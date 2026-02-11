import os
import json
import pdfplumber
import re
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from concurrent.futures import ThreadPoolExecutor

app = Flask(__name__)
# Configuration CORS simple pour tous les endpoints
CORS(app, origins="*", methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type"])

# Configuration du modèle IA
OLLAMA_API_URL = "https://agtelecom-ollama.yhmr4j.easypanel.host/api/generate"
OLLAMA_MODEL = "qwen2.5:3b"

def extract_pdf_data(file_path):
    """Extrait les données du PDF avec pdfplumber (extraction traditionnelle renforcée)"""
    try:
        with pdfplumber.open(file_path) as pdf:
            if len(pdf.pages) == 0:
                raise Exception('PDF vide')
            
            # Extraire tout le texte de toutes les pages
            full_text = ""
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                full_text += page_text + "\n"
            
            page = pdf.pages[0]  # Première page pour tableaux
            
            # Extraire avec regex renforcés
            data = {
                'mandate_number': None,
                'socket_label': None,
                'cable': None,
                'cables': [],
                'fibers_by_cable': [],
                'fiber_1': None,
                'fiber_2': None,
                'fiber_3': None,
                'fiber_4': None,
                'phone': None,
                'email': None,
                'full_text': full_text  # Stocker le texte complet pour l'IA
            }
            
            # Mandate number (Disp ID) - patterns multiples
            patterns_mandate = [
                r'Disp\s*ID[:\s]+(\d+)',
                r'Mandat[:\s]*#?(\d+)',
                r'Ordre[:\s]*#?(\d+)',
                r'N°\s*mandat[:\s]*(\d+)',
                r'Mandate[:\s]*(?:number|#)?[:\s]*(\d+)'
            ]
            for pattern in patterns_mandate:
                match = re.search(pattern, full_text, re.IGNORECASE)
                if match:
                    data['mandate_number'] = match.group(1)
                    break
            
            # Socket Label - patterns multiples
            patterns_socket = [
                r'Socket\s*Label[:\s]+(B\.\d+\.\d+\.\d+\.\d+)',
                r'PTO[:\s]+(B\.\d+\.\d+\.\d+\.\d+)',
                r'Socket[:\s]+(B\.\d+\.\d+\.\d+\.\d+)',
                r'Prise[:\s]+(B\.\d+\.\d+\.\d+\.\d+)',
                r'(B\.\d{3,}\.\d{2,}\.\d{2,}\.\d{1,})'
            ]
            for pattern in patterns_socket:
                match = re.search(pattern, full_text, re.IGNORECASE)
                if match:
                    data['socket_label'] = match.group(1)
                    break
            
            # Extraire les tableaux pour les câbles et fibres
            tables = page.extract_tables()
            cables_found = []
            fibers_by_cable = []
            
            if tables:
                for table in tables:
                    if not table or len(table) < 2:
                        continue
                    
                    sp_columns = {}
                    header_row_idx = None
                    cable_column_idx = None
                    
                    # Trouver la ligne d'en-tête avec SP1, SP2, SP3, SP4
                    for row_idx, row in enumerate(table):
                        if not row:
                            continue
                        for col_idx, cell in enumerate(row):
                            if cell is None:
                                continue
                            cell_str = str(cell).strip()
                            cell_upper = cell_str.upper()
                            # Patterns pour les SP avec variantes
                            if re.search(r'SP\s*1|SPLICE\s*1', cell_upper):
                                sp_columns['1'] = col_idx
                                header_row_idx = row_idx
                            elif re.search(r'SP\s*2|SPLICE\s*2', cell_upper):
                                sp_columns['2'] = col_idx
                            elif re.search(r'SP\s*3|SPLICE\s*3', cell_upper):
                                sp_columns['3'] = col_idx
                            elif re.search(r'SP\s*4|SPLICE\s*4', cell_upper):
                                sp_columns['4'] = col_idx
                            # Supporter plusieurs langues/variantes pour l'en-tête "cable"
                            if cable_column_idx is None:
                                if re.search(r'câbl|cabl|kabel|cable', cell_str, re.IGNORECASE) and not re.search(r'long|läng|length', cell_str, re.IGNORECASE):
                                    cable_column_idx = col_idx
                        if header_row_idx is not None and (sp_columns or cable_column_idx is not None):
                            break
                    
                    if header_row_idx is None:
                        continue
                    
                    # Parcourir les lignes de données
                    for data_row_idx in range(header_row_idx + 1, len(table)):
                        data_row = table[data_row_idx]
                        if not data_row:
                            continue
                        
                        # Extraire le câble
                        cable_value = None
                        if cable_column_idx is not None and cable_column_idx < len(data_row):
                            cable_cell = data_row[cable_column_idx]
                            if cable_cell:
                                cable_text = str(cable_cell).strip()
                                # Nettoyer et valider le câble
                                if cable_text and not cable_text.isdigit() and len(cable_text) > 2:
                                    cable_value = ' '.join(cable_text.split())
                                    if cable_value and cable_value not in cables_found:
                                        cables_found.append(cable_value)
                        
                        # Extraire les fibres SP1..SP4
                        row_fibers = {
                            "cable": cable_value,
                            "fiber_1": None,
                            "fiber_2": None,
                            "fiber_3": None,
                            "fiber_4": None
                        }
                        
                        for fiber_num, col_idx in sp_columns.items():
                            if col_idx < len(data_row):
                                cell_value = str(data_row[col_idx]).strip()
                                # Accepter nombres et certains patterns alphanumériques
                                if cell_value and (cell_value.isdigit() or re.match(r'^[A-Z0-9]{1,4}$', cell_value)):
                                    row_fibers[f"fiber_{fiber_num}"] = cell_value
                        
                        # Ajouter si au moins un câble ou une fibre
                        if cable_value or any(row_fibers[f"fiber_{n}"] for n in ['1','2','3','4']):
                            fibers_by_cable.append(row_fibers)
                    
                    if fibers_by_cable or cables_found:
                        break
            
            # Nettoyer les câbles
            cleaned_cables = []
            for cable in cables_found:
                clean = ' '.join(str(cable).split())
                if clean and clean not in cleaned_cables:
                    cleaned_cables.append(clean)
            
            data['cables'] = cleaned_cables
            if cleaned_cables:
                data['cable'] = " / ".join(cleaned_cables)
            
            # Si une ligne de fibres n'a pas de `cable` mais des valeurs de fibre,
            # tenter de remplir avec le câble détecté globalement ou le dernier connu.
            if fibers_by_cable:
                last_known = None
                for row in fibers_by_cable:
                    if row.get('cable'):
                        last_known = row['cable']
                    else:
                        # Si on a un seul câble détecté globalement, l'utiliser
                        if len(cleaned_cables) == 1:
                            row['cable'] = cleaned_cables[0]
                            last_known = row['cable']
                        elif last_known:
                            row['cable'] = last_known

            data['fibers_by_cable'] = fibers_by_cable
            
            # Fusionner les fibres (première valeur non nulle par colonne)
            for n in ['1','2','3','4']:
                if data[f"fiber_{n}"] is None:
                    for row in fibers_by_cable:
                        if row.get(f"fiber_{n}"):
                            data[f"fiber_{n}"] = row[f"fiber_{n}"]
                            break
            
            # Phone - patterns multiples renforcés
            phone_patterns = [
                r'\+41\s*\d{2}\s*\d{3}\s*\d{2}\s*\d{2}',
                r'\+41\d{9}',
                r'0\d{2}\s*\d{3}\s*\d{2}\s*\d{2}',
                r'Tel[:\s]*\+?41?\s*\d{2}\s*\d{3}\s*\d{2}\s*\d{2}',
                r'Phone[:\s]*\+?41?\s*\d{2}\s*\d{3}\s*\d{2}\s*\d{2}',
                r'Tél[:\s]*\+?41?\s*\d{2}\s*\d{3}\s*\d{2}\s*\d{2}'
            ]
            for pattern in phone_patterns:
                match = re.search(pattern, full_text, re.IGNORECASE)
                if match:
                    data['phone'] = match.group(0).replace(' ', '')
                    break
            
            # Email - patterns renforcés
            email_patterns = [
                r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
                r'Email[:\s]*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})',
                r'E-mail[:\s]*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})'
            ]
            for pattern in email_patterns:
                match = re.search(pattern, full_text, re.IGNORECASE)
                if match:
                    data['email'] = match.group(1) if match.lastindex else match.group(0)
                    break
            
            return data
            
    except Exception as e:
        print(f'Erreur extraction PDF: {e}')
        raise


def extract_with_ai(full_text, file_name):
    """Extrait les données du PDF en utilisant le modèle IA Qwen2.5:3b"""
    try:
        # Préparer le prompt pour le modèle
        prompt = f"""Tu es un assistant d'extraction de données de mandats de fibre optique Swisscom. Analyse le texte suivant et extrait les informations structurées.

Texte du document:
{full_text[:4000]}

Instructions:
- Extrais UNIQUEMENT les informations présentes dans le texte
- Ne devine pas, ne fabrique pas de données
- Retourne un objet JSON valide avec ces champs (null si non trouvé):
  * mandate_number: numéro du mandat/Disp ID
  * socket_label: référence PTO/Socket (format B.xxx.xx.xx.x)
  * cable: nom du câble d'alimentation
  * fiber_1, fiber_2, fiber_3, fiber_4: numéros de fibres (SP1, SP2, SP3, SP4)
  * phone: numéro de téléphone (format +41...)
  * email: adresse email du contact
  * address: adresse complète du site
  * client_name: nom du client

Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire."""

        # Appeler l'API Ollama
        response = requests.post(
            OLLAMA_API_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,  # Très déterministe pour extraction
                    "top_p": 0.9,
                    "num_predict": 500
                }
            },
            timeout=30
        )
        
        if response.status_code != 200:
            print(f"Erreur API Ollama: {response.status_code}")
            return None
        
        result = response.json()
        ai_response = result.get('response', '').strip()
        
        # Extraire le JSON de la réponse
        # Le modèle peut ajouter du texte avant/après le JSON
        json_match = re.search(r'\{[^}]*\}', ai_response, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            ai_data = json.loads(json_str)
            
            # Nettoyer les valeurs null/vides
            cleaned_data = {}
            for key, value in ai_data.items():
                if value and value != "null" and value != "None":
                    cleaned_data[key] = value
            
            return cleaned_data
        else:
            print(f"Pas de JSON trouvé dans la réponse IA: {ai_response[:200]}")
            return None
            
    except requests.Timeout:
        print(f"Timeout lors de l'appel à l'API Ollama pour {file_name}")
        return None
    except requests.RequestException as e:
        print(f"Erreur réseau lors de l'appel à l'API Ollama: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"Erreur parsing JSON de la réponse IA: {e}")
        return None
    except Exception as e:
        print(f"Erreur extraction IA: {e}")
        return None


def merge_extractions(traditional_data, ai_data):
    """Fusionne intelligemment les résultats de l'extraction traditionnelle et de l'IA"""
    merged = traditional_data.copy()
    
    if not ai_data:
        merged['ai_contribution'] = False
        return merged
    
    ai_filled_fields = []
    
    # Liste des champs à fusionner
    fields = ['mandate_number', 'socket_label', 'cable', 'phone', 'email', 
              'fiber_1', 'fiber_2', 'fiber_3', 'fiber_4', 'address', 'client_name']
    
    for field in fields:
        ai_value = ai_data.get(field)
        traditional_value = merged.get(field)
        
        # Si l'extraction traditionnelle n'a rien trouvé et l'IA oui
        if (not traditional_value or traditional_value == '') and ai_value:
            merged[field] = ai_value
            ai_filled_fields.append(field)
        # Si les deux ont trouvé quelque chose mais que c'est différent
        # On fait confiance à l'extraction traditionnelle mais on ajoute une note
        elif traditional_value and ai_value and str(traditional_value) != str(ai_value):
            # Pour certains champs critiques, on préfère l'extraction traditionnelle
            if field in ['mandate_number', 'socket_label']:
                merged[f'{field}_ai_alternative'] = ai_value
    
    merged['ai_contribution'] = len(ai_filled_fields) > 0
    merged['ai_filled_fields'] = ai_filled_fields
    
    return merged

@app.route('/api/analyze-pdf', methods=['POST', 'OPTIONS'])
def analyze_pdf():
    """Analyse les PDF envoyés avec double extraction (traditionnelle + IA)"""
    if request.method == 'OPTIONS':
        return '', 204
    
    if 'pdfs' not in request.files:
        return jsonify({'success': False, 'error': 'Aucun fichier envoyé'}), 400
    
    files = request.files.getlist('pdfs')
    if not files:
        return jsonify({'success': False, 'error': 'Aucun fichier sélectionné'}), 400
    
    results = []
    
    for file in files:
        if not file.filename.lower().endswith('.pdf'):
            results.append({
                'success': False,
                'file_name': file.filename,
                'error': 'Fichier invalide (PDF requis)'
            })
            continue
        
        try:
            # Sauvegarder temporairement
            temp_path = f'/tmp/{file.filename}'
            file.save(temp_path)
            
            # EXTRACTION PARALLÈLE : Traditionnelle + IA
            with ThreadPoolExecutor(max_workers=2) as executor:
                # Lance les deux extractions en parallèle
                future_traditional = executor.submit(extract_pdf_data, temp_path)
                
                # On attendra le texte de l'extraction traditionnelle pour l'IA
                traditional_data = future_traditional.result()
                full_text = traditional_data.get('full_text', '')
                
                # Lance l'extraction IA avec le texte
                future_ai = executor.submit(extract_with_ai, full_text, file.filename)
                ai_data = future_ai.result()
            
            # Fusionner les deux sources
            merged_data = merge_extractions(traditional_data, ai_data)
            
            # Supprimer le full_text avant d'envoyer au client (trop volumineux)
            if 'full_text' in merged_data:
                del merged_data['full_text']
            
            # Calculer confiance (améliorée si l'IA a contribué)
            required_fields = ['mandate_number', 'socket_label', 'cable']
            missing = [f for f in required_fields if not merged_data.get(f)]
            confidence = 1.0 - (len(missing) * 0.33)
            confidence = max(0, confidence)
            
            # Bonus de confiance si l'IA a contribué
            if merged_data.get('ai_contribution'):
                confidence = min(1.0, confidence + 0.1)
            
            results.append({
                'success': True,
                'file_name': file.filename,
                'data': merged_data,
                'confidence': confidence,
                'needs_review': len(missing) > 0,
                'missing_fields': missing,
                'extraction_sources': {
                    'traditional': True,
                    'ai': ai_data is not None,
                    'ai_contributed': merged_data.get('ai_contribution', False),
                    'ai_fields': merged_data.get('ai_filled_fields', [])
                }
            })
            
            # Nettoyer
            os.remove(temp_path)
            
        except Exception as e:
            results.append({
                'success': False,
                'file_name': file.filename,
                'error': str(e)
            })
    
    return jsonify({
        'success': True,
        'count': len([r for r in results if r['success']]),
        'results': results
    })

@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({'status': 'healthy', 'version': '1.0.0'})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
