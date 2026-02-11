#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API Flask pour extraction de données PDF Swisscom
Extraction structurée par tableaux (sans IA)
Version production - Février 2026
"""

import os
import pdfplumber
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path

app = Flask(__name__)
CORS(app, origins="*", methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type"])

def find_value_after_label(text, label):
    """Cherche un label dans le texte et retourne la valeur qui suit"""
    label_escaped = re.escape(label)
    pattern = label_escaped + r'\s*[:\s]*(.+?)(?:\n|$)'
    match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
    return match.group(1).strip() if match else None

def extract_phone_from_header(text):
    """Extrait le téléphone depuis l'en-tête du document"""
    header = text[:500]
    
    # Pattern 1: Téléphone suivi de +41...
    pattern1 = r'Téléphone\s*(\+41\d{9,11}|\+41\s*\d{2}\s*\d{3}\s*\d{2}\s*\d{2,3})'
    match1 = re.search(pattern1, header, re.IGNORECASE)
    if match1:
        return re.sub(r'\s+', '', match1.group(1))
    
    # Pattern 2: Téléphone suivi de 41... (sans +)
    pattern2 = r'Téléphone\s*(41\d{9})'
    match2 = re.search(pattern2, header, re.IGNORECASE)
    if match2:
        return '+' + re.sub(r'\s+', '', match2.group(1))
    
    # Pattern 3: Téléphone suivi de 0... (format local)
    pattern3 = r'Téléphone\s*(0\d{9})'
    match3 = re.search(pattern3, header, re.IGNORECASE)
    if match3:
        phone = match3.group(1)
        if phone.startswith('0'):
            return '+41' + phone[1:]
    
    return None

def extract_email(text):
    """Extrait l'email du texte"""
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    emails = re.findall(email_pattern, text)
    return emails[0] if emails else None

def extract_socket_label(text):
    """
    Extrait le Socket Label (format B.xxx.xxx.xxx.x où x peut être chiffre ou lettre)
    """
    socket_pattern = r'B\.\d{3}\.\d{3}\.\d{3}\.\w'
    
    # Pattern 1 : Après "Socket Label:"
    label_line = find_value_after_label(text, "Socket Label:")
    if label_line:
        match = re.search(socket_pattern, label_line)
        if match:
            return match.group(0)
    
    # Pattern 2 : Recherche globale
    matches = re.findall(socket_pattern, text)
    return matches[0] if matches else None

def extract_mandate_number(text):
    """Extrait le numéro de mandat (8 chiffres)"""
    mandate_pattern = r'\b\d{8}\b'
    matches = re.findall(mandate_pattern, text)
    return matches[0] if matches else None

def extract_from_structured_table(tables):
    """
    Extrait câbles et fibres directement depuis les tableaux structurés
    Gère les cas de multi-câbles (plusieurs lignes de données)
    """
    result = {
        'cables': [],
        'fibers': {f'fiber_{i}': None for i in range(1, 5)},
        'cables_details': []
    }
    
    if not tables:
        return result
    
    for table in tables:
        if not table or len(table) < 2:
            continue
        
        # Chercher la ligne header "Câble:"
        cable_col_idx = None
        for row_idx, row in enumerate(table):
            for col_idx, cell in enumerate(row):
                if cell and 'Câble:' in str(cell):
                    cable_col_idx = col_idx
                    break
            if cable_col_idx is not None:
                break
        
        # Chercher la ligne avec SP1, SP2, SP3, SP4
        sp_header_row_idx = None
        sp_col_indices = {}
        
        for row_idx, row in enumerate(table):
            for col_idx, cell in enumerate(row):
                if cell:
                    cell_str = str(cell).strip().upper()
                    for sp_num in range(1, 5):
                        if cell_str == f'SP{sp_num}':
                            if sp_header_row_idx is None:
                                sp_header_row_idx = row_idx
                            sp_col_indices[sp_num] = col_idx
        
        # Extraire toutes les lignes de données
        if sp_header_row_idx is not None:
            data_start_row = sp_header_row_idx + 1
            
            for data_row_idx in range(data_start_row, len(table)):
                data_row = table[data_row_idx]
                
                # Vérifier si cette ligne contient des données de câble
                if cable_col_idx is not None and cable_col_idx < len(data_row):
                    cable_raw = data_row[cable_col_idx]
                    
                    # Si la cellule est vide ou contient un header, arrêter
                    if not cable_raw or str(cable_raw).strip() in ['', 'Client', 'Interlocuteur']:
                        break
                    
                    # Nettoyer le câble
                    cable_clean = str(cable_raw).replace('\n', ' ').replace('\r', ' ')
                    cable_clean = re.sub(r'\s+', ' ', cable_clean).strip()
                    
                    # Extraire les fibres pour ce câble
                    cable_fibers = {}
                    for sp_num, col_idx in sp_col_indices.items():
                        if col_idx < len(data_row):
                            value = data_row[col_idx]
                            if value and str(value).strip():
                                fiber_value = str(value).strip()
                                digit_match = re.search(r'\d+', fiber_value)
                                if digit_match:
                                    cable_fibers[f'sp{sp_num}'] = digit_match.group(0)
                    
                    # Ajouter ce câble aux résultats
                    result['cables'].append(cable_clean)
                    result['cables_details'].append({
                        'cable': cable_clean,
                        **{f'sp{i}': cable_fibers.get(f'sp{i}') for i in range(1, 5)}
                    })
                    
                    # Mettre à jour les fibres globales
                    for sp_num in range(1, 5):
                        sp_key = f'sp{sp_num}'
                        if sp_key in cable_fibers:
                            if result['fibers'][f'fiber_{sp_num}'] is None:
                                result['fibers'][f'fiber_{sp_num}'] = cable_fibers[sp_key]
    
    if not result['cables']:
        result['cables'] = None
    
    return result

def extract_pdf_data(file_path):
    """Extrait toutes les données du PDF"""
    try:
        with pdfplumber.open(file_path) as pdf:
            if len(pdf.pages) == 0:
                raise Exception('PDF vide')
            
            page = pdf.pages[0]
            full_text = page.extract_text() or ""
            tables = page.extract_tables()
            
            # Extraction depuis tableaux structurés
            structured_data = extract_from_structured_table(tables)
            
            # Numéro de mandat
            disp_id = find_value_after_label(full_text, "Disp ID:")
            if disp_id:
                mandate_number = extract_mandate_number(disp_id)
            else:
                mandate_number = extract_mandate_number(full_text)
            
            # Nom du client
            client_line = find_value_after_label(full_text, "Adresse:")
            client_name = None
            if client_line:
                client_name = client_line.split('\n')[0].strip()
            
            # Téléphone
            header_phone = extract_phone_from_header(full_text)
            phone = header_phone
            
            # Socket Label
            socket_label = extract_socket_label(full_text)
            
            # Email
            email = extract_email(full_text)
            
            # Câbles et fibres
            cables = structured_data['cables']
            cable = cables[0] if cables else None
            
            # Construire la réponse
            data = {
                'mandate_number': mandate_number,
                'client_name': client_name,
                'phone': phone,
                'email': email,
                'socket_label': socket_label,
                'cable': cable,
                'cables': cables,
                'cables_details': structured_data.get('cables_details', []),
                'fiber_1': structured_data['fibers'].get('fiber_1'),
                'fiber_2': structured_data['fibers'].get('fiber_2'),
                'fiber_3': structured_data['fibers'].get('fiber_3'),
                'fiber_4': structured_data['fibers'].get('fiber_4'),
            }
            
            return data
            
    except Exception as e:
        print(f'Erreur extraction PDF: {e}')
        raise

@app.route('/analyze-pdf', methods=['POST', 'OPTIONS'])
def analyze_pdf():
    """Endpoint principal pour analyser un PDF uploadé"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Aucun fichier fourni'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Nom de fichier vide'}), 400
        
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({'error': 'Le fichier doit être un PDF'}), 400
        
        # Sauvegarder temporairement le fichier
        upload_folder = os.path.join(os.getcwd(), 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        
        file_path = os.path.join(upload_folder, file.filename)
        file.save(file_path)
        
        try:
            # Extraction structurée
            data = extract_pdf_data(file_path)
            
            # Nettoyer le fichier temporaire
            os.remove(file_path)
            
            return jsonify({
                'success': True,
                'source': 'structured_extraction',
                'data': data
            }), 200
            
        except Exception as e:
            # Nettoyer en cas d'erreur
            if os.path.exists(file_path):
                os.remove(file_path)
            raise e
            
    except Exception as e:
        print(f"Erreur lors de l'analyse du PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f"Erreur lors de l'analyse: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health():
    """Endpoint de santé pour vérifier que l'API fonctionne"""
    return jsonify({
        'status': 'ok',
        'version': '2.0',
        'extraction_method': 'structured_tables'
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8765))
    app.run(host='0.0.0.0', port=port, debug=True)
