import os
import json
import pdfplumber
import re
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Configuration CORS simple pour tous les endpoints
CORS(app, origins="*", methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type"])

def extract_pdf_data(file_path):
    """Extrait les données du PDF avec pdfplumber"""
    try:
        with pdfplumber.open(file_path) as pdf:
            if len(pdf.pages) == 0:
                raise Exception('PDF vide')
            
            page = pdf.pages[0]
            text = page.extract_text() or ""
            
            # Extraire avec regex
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
                'email': None
            }
            
            # Mandate number (Disp ID)
            match = re.search(r'Disp\s*ID[:\s]+(\d+)', text, re.IGNORECASE)
            if match:
                data['mandate_number'] = match.group(1)
            
            # Socket Label
            match = re.search(r'Socket\s*Label[:\s]+(B\.\d+\.\d+\.\d+\.\d+)', text, re.IGNORECASE)
            if match:
                data['socket_label'] = match.group(1)
            
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
                            if cell_upper == 'SP1':
                                sp_columns['1'] = col_idx
                                header_row_idx = row_idx
                            elif cell_upper == 'SP2':
                                sp_columns['2'] = col_idx
                            elif cell_upper == 'SP3':
                                sp_columns['3'] = col_idx
                            elif cell_upper == 'SP4':
                                sp_columns['4'] = col_idx
                            if 'Câble' in cell_str or 'Cable' in cell_str:
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
                                if cable_text and not cable_text.isdigit():
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
                                if cell_value and cell_value.isdigit():
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
            
            data['fibers_by_cable'] = fibers_by_cable
            
            # Fusionner les fibres (première valeur non nulle par colonne)
            for n in ['1','2','3','4']:
                if data[f"fiber_{n}"] is None:
                    for row in fibers_by_cable:
                        if row.get(f"fiber_{n}"):
                            data[f"fiber_{n}"] = row[f"fiber_{n}"]
                            break
            
            # Phone (+41...)
            match = re.search(r'\+41\s*\d{2}\s*\d{3}\s*\d{2}\s*\d{2}|\+41\d{9}', text)
            if match:
                data['phone'] = match.group(0).replace(' ', '')
            
            # Email
            match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
            if match:
                data['email'] = match.group(0)
            
            return data
            
    except Exception as e:
        print(f'Erreur extraction PDF: {e}')
        raise

@app.route('/api/analyze-pdf', methods=['POST', 'OPTIONS'])
def analyze_pdf():
    """Analyse les PDF envoyés"""
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
            
            # Extraire les données
            data = extract_pdf_data(temp_path)
            
            # Calculer confiance
            required_fields = ['mandate_number', 'socket_label', 'cable']
            missing = [f for f in required_fields if not data.get(f)]
            confidence = 1.0 - (len(missing) * 0.33)
            confidence = max(0, confidence)
            
            results.append({
                'success': True,
                'file_name': file.filename,
                'data': data,
                'confidence': confidence,
                'needs_review': len(missing) > 0,
                'missing_fields': missing
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
