#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test d'extraction PDF par recherche de labels
Extrait le texte structuré et cherche les valeurs associées aux labels connus
"""

import pdfplumber
import re
import sys
from pathlib import Path

def extract_phone_from_header(text):
    """
    Extrait le téléphone depuis l'en-tête du document
    Cherche "Téléphone" suivi du numéro (avec ou sans +41)
    Exemple: "Téléphone 41797026413" ou "Téléphone +41 79 702 64 13"
    """
    # Prendre les 500 premiers caractères (zone d'en-tête)
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
        # Convertir 079... en +4179...
        if phone.startswith('0'):
            return '+41' + phone[1:]
    
    return None

def extract_phones(text):
    """Extrait tous les numéros de téléphone suisses (+41...)"""
    # Pattern pour +41 XX XXX XX XX ou +41XXXXXXXXX
    phone_pattern = r'\+41\s*\d{1,2}\s*\d{3}\s*\d{2}\s*\d{2,3}|\+41\d{9,11}'
    phones = re.findall(phone_pattern, text)
    # Nettoyer et dédupliquer
    cleaned = list(dict.fromkeys([re.sub(r'\s+', '', p) for p in phones]))
    return cleaned

def extract_email(text):
    """Extrait l'email du texte"""
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    emails = re.findall(email_pattern, text)
    return emails[0] if emails else None

def extract_socket_label(text):
    """
    Extrait le Socket Label (format B.xxx.xxx.xxx.x où x peut être chiffre ou lettre)
    Cherche d'abord après "Socket Label:" puis globalement
    """
    # Pattern acceptant chiffres et lettres (ex: B.112.603.634.X)
    socket_pattern = r'B\.\d{3}\.\d{3}\.\d{3}\.\w'
    
    # Pattern 1 : Après "Socket Label:"
    label_line = find_value_after_label(text, "Socket Label:")
    if label_line:
        # Extraire le socket du contenu après "Socket Label:"
        match = re.search(socket_pattern, label_line)
        if match:
            return match.group(0)
    
    # Pattern 2 : Recherche globale
    matches = re.findall(socket_pattern, text)
    return matches[0] if matches else None

def extract_mandate_number(text):
    """Extrait le numéro de mandat (8 chiffres)"""
    # Pattern pour 8 chiffres consécutifs
    mandate_pattern = r'\b\d{8}\b'
    matches = re.findall(mandate_pattern, text)
    return matches[0] if matches else None

def extract_cable_numbers(text):
    """
    Extrait les numéros de câbles (format FSCxx - xxx ou similaire)
    Peut avoir jusqu'à 3 câbles, parfois avec sauts de ligne à l'intérieur
    Exemple: "FSC09 -\n3d070" doit donner "FSC09 - 3d070"
    """
    # D'abord nettoyer : remplacer les sauts de ligne par des espaces
    # MAIS garder la structure pour les patterns
    text_cleaned = text.replace('\r\n', ' ').replace('\n', ' ').replace('\r', ' ')
    # Nettoyer les espaces multiples
    text_cleaned = re.sub(r'\s+', ' ', text_cleaned)
    
    # Pattern très permissif : FSC + chiffres + espaces + tiret + espaces + alphanum
    # Accepte beaucoup d'espaces entre les parties
    cable_pattern = r'FSC\d+\s*-\s*[\w\d]+'
    matches = re.findall(cable_pattern, text_cleaned, re.IGNORECASE)
    
    # Nettoyer chaque match (normaliser les espaces autour du tiret)
    cables = []
    for match in matches:
        # Normaliser : "FSC09  -   3d070" → "FSC09 - 3d070"
        normalized = re.sub(r'\s*-\s*', ' - ', match.strip())
        cables.append(normalized)
    
    # Dédupliquer en gardant l'ordre
    seen = set()
    unique_cables = []
    for cable in cables:
        cable_upper = cable.upper()
        if cable_upper not in seen:
            seen.add(cable_upper)
            unique_cables.append(cable)
    
    return unique_cables if unique_cables else None

def find_value_after_label(text, label):
    """
    Cherche un label dans le texte et retourne la valeur qui suit
    Exemple: "Téléphone +41 79 123 45 67" → retourne "+41 79 123 45 67"
    """
    # Échapper les caractères spéciaux regex
    label_escaped = re.escape(label)
    # Chercher le label suivi d'espaces et capturer le reste de la ligne
    pattern = label_escaped + r'\s*[:\s]*(.+?)(?:\n|$)'
    match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
    return match.group(1).strip() if match else None

def extract_fiber_positions(text):
    """
    Extrait les positions des fibres SP1-SP4 depuis le texte brut
    Cherche plusieurs patterns possibles
    """
    fibers = {}
    
    # Nettoyer le texte : remplacer sauts de ligne par espaces
    text_cleaned = text.replace('\n', ' ').replace('\r', ' ')
    text_cleaned = re.sub(r'\s+', ' ', text_cleaned)
    
    for sp_num in range(1, 5):
        fiber_value = None
        
        # Pattern 1: "SPx numéro" (avec espace(s))
        pattern1 = rf'SP\s*{sp_num}\s+(\d{{1,2}})'
        match1 = re.search(pattern1, text_cleaned, re.IGNORECASE)
        if match1:
            fiber_value = match1.group(1)
            print(f"      Pattern 1 (SPx espace): SP{sp_num} = {fiber_value}")
        
        # Pattern 2: "SPx:numéro" ou "SPx: numéro"
        if not fiber_value:
            pattern2 = rf'SP\s*{sp_num}\s*:\s*(\d{{1,2}})'
            match2 = re.search(pattern2, text_cleaned, re.IGNORECASE)
            if match2:
                fiber_value = match2.group(1)
                print(f"      Pattern 2 (SPx:): SP{sp_num} = {fiber_value}")
        
        # Pattern 3: Dans les en-têtes de colonnes "SP1 SP2 SP3 SP4" suivi des valeurs
        # Chercher "SP1 SP2 SP3 SP4" puis prendre le numéro à la position correspondante
        if not fiber_value:
            # Chercher la ligne avec SP1 SP2 SP3 SP4
            sp_header_pattern = r'SP\s*1.*?SP\s*2.*?SP\s*3.*?SP\s*4'
            header_match = re.search(sp_header_pattern, text_cleaned, re.IGNORECASE)
            if header_match:
                # Chercher les valeurs après cette ligne
                after_header = text_cleaned[header_match.end():]
                # Prendre les 4 premiers chiffres isolés
                numbers = re.findall(r'\b(\d{1,2})\b', after_header[:100])
                if len(numbers) >= sp_num:
                    fiber_value = numbers[sp_num - 1]
                    print(f"      Pattern 3 (après header): SP{sp_num} = {fiber_value}")
        
        fibers[f'fiber_{sp_num}'] = fiber_value
    
    return fibers

def extract_from_structured_table(tables):
    """
    Extrait câbles et fibres directement depuis les tableaux structurés
    Gère les cas de multi-câbles (plusieurs lignes de données)
    Structure attendue :
    - Ligne avec "Câble:" est le header
    - Ligne avec SP1, SP2, SP3, SP4 est le header des fibres
    - Plusieurs lignes de données possibles (multi-câbles)
    """
    result = {
        'cables': [],
        'fibers': {f'fiber_{i}': None for i in range(1, 5)},
        'cables_details': []  # Détails par câble
    }
    
    if not tables:
        return result
    
    print("   DEBUG: Extraction depuis tableaux structures")
    
    for table_idx, table in enumerate(tables):
        if not table or len(table) < 2:
            continue
        
        print(f"   Tableau #{table_idx + 1}:")
        
        # Chercher la ligne header qui contient "Câble:"
        cable_col_idx = None
        header_row_idx = None
        
        for row_idx, row in enumerate(table):
            for col_idx, cell in enumerate(row):
                if cell and 'Câble:' in str(cell):
                    cable_col_idx = col_idx
                    header_row_idx = row_idx
                    print(f"      Header 'Cable:' trouve a ligne {row_idx + 1}, col {col_idx + 1}")
                    break
            if cable_col_idx is not None:
                break
        
        # Chercher la ligne avec SP1, SP2, SP3, SP4 (ligne headers fibres)
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
                            print(f"      SP{sp_num} header trouve a ligne {row_idx + 1}, col {col_idx + 1}")
        
        # Si headers SP trouvés, extraire TOUTES les lignes de données suivantes
        if sp_header_row_idx is not None:
            data_start_row = sp_header_row_idx + 1
            print(f"      Recherche de lignes de donnees a partir de #{data_start_row + 1}")
            
            # Parcourir les lignes suivantes jusqu'à trouver une ligne sans câble
            for data_row_idx in range(data_start_row, len(table)):
                data_row = table[data_row_idx]
                
                # Vérifier si cette ligne contient des données de câble
                if cable_col_idx is not None and cable_col_idx < len(data_row):
                    cable_raw = data_row[cable_col_idx]
                    
                    # Si la cellule est vide ou contient un header, arrêter
                    if not cable_raw or str(cable_raw).strip() in ['', 'Client', 'Interlocuteur']:
                        print(f"      Fin des donnees a ligne {data_row_idx + 1}")
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
                    
                    print(f"      ✅ Cable #{len(result['cables'])}: '{cable_clean}'")
                    for sp_num in range(1, 5):
                        sp_key = f'sp{sp_num}'
                        if sp_key in cable_fibers:
                            print(f"         SP{sp_num} = {cable_fibers[sp_key]}")
                            # Mettre à jour les fibres globales (prendre la première valeur trouvée)
                            if result['fibers'][f'fiber_{sp_num}'] is None:
                                result['fibers'][f'fiber_{sp_num}'] = cable_fibers[sp_key]
    
    # Convertir la liste de câbles en None si vide
    if not result['cables']:
        result['cables'] = None
    
    return result

def analyze_pdf_structured(pdf_path):
    """
    Analyse un PDF en cherchant les labels connus dans le texte structuré
    """
    print(f"\n{'='*80}")
    print(f"📄 Analyse: {Path(pdf_path).name}")
    print(f"{'='*80}\n")
    
    results = {
        "file_name": Path(pdf_path).name,
        "success": True,
        "data": {},
        "full_text": ""
    }
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            if len(pdf.pages) == 0:
                results["success"] = False
                results["error"] = "PDF vide"
                return results
            
            page = pdf.pages[0]
            
            print(f"📐 Dimensions: {page.width} × {page.height} points")
            print(f"   Format: {'Paysage' if page.width > page.height else 'Portrait'}")
            print()
            
            # Extraire tout le texte
            full_text = page.extract_text() or ""
            results["full_text"] = full_text
            
            print("📝 TEXTE COMPLET DU PDF:")
            print("=" * 80)
            print(full_text)
            print("=" * 80)
            print()
            
            # Extraire les tableaux si présents
            tables = page.extract_tables()
            print(f"📊 Tableaux détectés: {len(tables)}")
            
            print(f"\n{'='*80}")
            print("🔍 EXTRACTION DES DONNÉES")
            print(f"{'='*80}\n")
            
            # 1. Numéro de mandat (Disp ID)
            # Chercher après "Disp ID:" ou juste 8 chiffres isolés
            disp_id = find_value_after_label(full_text, "Disp ID:")
            if disp_id:
                results["data"]["mandate_number"] = extract_mandate_number(disp_id)
            else:
                results["data"]["mandate_number"] = extract_mandate_number(full_text)
            print(f"1️⃣  Numéro de mandat: {results['data']['mandate_number']}")
            
            # 2. Nom du client (après "Adresse:")
            client_line = find_value_after_label(full_text, "Adresse:")
            if client_line:
                # Prendre la première ligne après "Adresse:"
                results["data"]["client_name"] = client_line.split('\n')[0].strip()
            else:
                results["data"]["client_name"] = None
            print(f"2️⃣  Nom du client: {results['data']['client_name']}")
            
            # 3. Téléphone(s)
            # D'abord essayer d'extraire depuis l'en-tête (plus fiable)
            header_phone = extract_phone_from_header(full_text)
            if header_phone:
                results["data"]["phone"] = header_phone
                results["data"]["all_phones"] = [header_phone]
                print(f"3️⃣  Téléphone (en-tête): {header_phone}")
            else:
                # Sinon chercher tous les +41...
                phones = extract_phones(full_text)
                results["data"]["phone"] = phones[0] if phones else None
                results["data"]["all_phones"] = phones
                print(f"3️⃣  Téléphone(s): {', '.join(phones) if phones else 'NON TROUVÉ'}")
            
            # 4. Socket Label (B.112.xxx.xxx.x)
            results["data"]["socket_label"] = extract_socket_label(full_text)
            print(f"4️⃣  Socket Label: {results['data']['socket_label']}")
            
            # 5. & 6. Câbles et Fibres - extraction depuis tableaux structurés
            print(f"5️⃣  & 6️⃣  Extraction câbles et fibres depuis tableaux:")
            structured_data = extract_from_structured_table(tables)
            
            # Câbles (peut être une liste pour multi-câbles)
            if structured_data['cables']:
                results["data"]["cables"] = structured_data['cables']
                results["data"]["cable"] = structured_data['cables'][0]  # Premier câble principal
                results["data"]["cables_details"] = structured_data.get('cables_details', [])
                
                print(f"\n   ✅ Câble(s): {len(structured_data['cables'])}")
                for idx, cable in enumerate(structured_data['cables'], 1):
                    print(f"      #{idx}: {cable}")
                    # Afficher les fibres de ce câble
                    if idx <= len(structured_data.get('cables_details', [])):
                        details = structured_data['cables_details'][idx - 1]
                        fibers_str = ", ".join([f"SP{i}:{details.get(f'sp{i}', '-')}" for i in range(1, 5) if details.get(f'sp{i}')])
                        if fibers_str:
                            print(f"          Fibres: {fibers_str}")
            else:
                results["data"]["cables"] = None
                results["data"]["cable"] = None
                print(f"\n   ❌ Câble: NON TROUVÉ")
            
            # Fibres globales
            fibers = structured_data['fibers']
            results["data"].update(fibers)
            print(f"\n   Fibres (résumé global):")
            for i in range(1, 5):
                fiber_val = fibers.get(f'fiber_{i}')
                status = "✅" if fiber_val else "❌"
                print(f"      {status} SP{i}: {fiber_val or '-'}")

            
            # 7. Email
            results["data"]["email"] = extract_email(full_text)
            print(f"\n7️⃣  Email: {results['data']['email']}")
            
            # Extraction depuis tableaux si disponibles
            print(f"\n{'='*80}")
            print("📋 ANALYSE DÉTAILLÉE DES TABLEAUX")
            print(f"{'='*80}\n")
            
            if tables:
                for idx, table in enumerate(tables):
                    print(f"📊 Tableau #{idx + 1}: {len(table)} lignes × {len(table[0]) if table else 0} colonnes")
                    print("-" * 80)
                    
                    # Afficher toutes les lignes (max 10 pour ne pas surcharger)
                    max_rows = min(len(table), 10)
                    for row_idx in range(max_rows):
                        row = table[row_idx]
                        # Limiter à 15 chars par cellule pour la lisibilité
                        row_display = []
                        for cell in row[:12]:  # Max 12 colonnes
                            if cell:
                                cell_str = str(cell).replace('\n', ' ')[:15]
                                row_display.append(f"{cell_str:15}")
                            else:
                                row_display.append(f"{'':15}")
                        print(f"  [{row_idx + 1}] | {' | '.join(row_display)}")
                    
                    if len(table) > max_rows:
                        print(f"  ... ({len(table) - max_rows} lignes supplémentaires non affichées)")
                    print()
            else:
                print("⚠️ Aucun tableau structuré détecté par pdfplumber")
                print("   Le PDF pourrait utiliser du texte positionné au lieu de vrais tableaux.")
            
            print(f"{'='*80}")
            print("✅ Extraction terminée")
            print(f"{'='*80}\n")
            
    except Exception as e:
        print(f"\n❌ Erreur lors de l'analyse: {str(e)}")
        import traceback
        traceback.print_exc()
        results["success"] = False
        results["error"] = str(e)
    
    return results
def analyze_multiple_pdfs(pdf_paths):
    """Analyse plusieurs PDFs et affiche un résumé"""
    print(f"\n🎯 Analyse de {len(pdf_paths)} PDF(s)\n")
    
    all_results = []
    
    for pdf_path in pdf_paths:
        if not Path(pdf_path).exists():
            print(f"❌ Fichier introuvable: {pdf_path}")
            continue
        
        result = analyze_pdf_structured(pdf_path)
        all_results.append(result)
    
    # Résumé final
    print(f"\n{'='*80}")
    print("📊 RÉSUMÉ DE L'EXTRACTION")
    print(f"{'='*80}\n")
    
    for result in all_results:
        if not result["success"]:
            print(f"❌ {result['file_name']}: {result.get('error', 'Erreur inconnue')}")
            continue
        
        data = result["data"]
        print(f"✅ {result['file_name']}")
        print(f"   • Mandat: {data.get('mandate_number', '❌ NON TROUVÉ')}")
        print(f"   • Client: {data.get('client_name', '❌ NON TROUVÉ')}")
        print(f"   • Téléphone: {data.get('phone', '❌ NON TROUVÉ')}")
        print(f"   • Email: {data.get('email', '❌ NON TROUVÉ')}")
        print(f"   • Socket: {data.get('socket_label', '❌ NON TROUVÉ')}")
        
        # Afficher tous les câbles
        cables = data.get('cables')
        if cables:
            print(f"   • Câble(s): {', '.join(cables)}")
        else:
            print(f"   • Câble(s): ❌ NON TROUVÉ")
        
        # Afficher les fibres
        fibers = [data.get(f'fiber_{i}') for i in range(1, 5)]
        fibers_str = ', '.join([f"SP{i}:{f or '-'}" for i, f in enumerate(fibers, 1)])
        print(f"   • Fibres: {fibers_str}")
        print()
    
    return all_results

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_bbox_extraction.py <pdf1> [pdf2] [pdf3] ...")
        print("\nExemple:")
        print("  python test_bbox_extraction.py pdf1.pdf pdf2.pdf pdf3.pdf")
        sys.exit(1)
    
    pdf_files = sys.argv[1:]
    results = analyze_multiple_pdfs(pdf_files)
    
    success_count = len([r for r in results if r['success']])
    print(f"\n✨ Analyse terminée: {success_count} succès / {len(results)} total")

