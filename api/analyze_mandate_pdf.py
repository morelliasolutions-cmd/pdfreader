"""
Extraction de données techniques des PDF de mandats FTTH
Utilise pdfplumber pour extraire: socket label, dispé ID, câbles, fibres, contact
"""

import pdfplumber
import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Optional


def extract_mandate_info(pdf_path: str) -> Dict:
    """
    Extrait les informations d'un PDF de mandat FTTH
    
    Structure attendue (basée sur PDF Export 2):
    - Socket label (ex: "Socket label: XXX")
    - Dispé ID dans l'en-tête (pas dans le tableau)
    - Numéros de câble (ex: "FTTH 32FSP 0FK 29")
    - Fibres Access (SP1, SP2, SP3 = fibre 1, 2, 3)
    - Interlocuteur et adresse pour l'installation
    
    Args:
        pdf_path: Chemin vers le fichier PDF
        
    Returns:
        Dictionnaire avec les données extraites
    """
    result = {
        "file_name": Path(pdf_path).name,
        "success": False,
        "data": {
            "socket_label": None,
            "dispe_id": None,
            "cables": [],  # Liste des câbles trouvés
            "fibers": [],  # Liste des fibres (SP1, SP2, etc.)
            "contact_name": None,
            "contact_address": None,
            "contact_city": None,
            "contact_zip": None,
            "contact_phone": None,
            "contact_email": None,
            "mandate_number": None  # Pour faire la correspondance
        },
        "raw_text": "",
        "error": None
    }
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ""
            
            # Analyser UNIQUEMENT la première page
            if len(pdf.pages) > 0:
                page = pdf.pages[0]
                text = page.extract_text()
                if text:
                    full_text = f"\n--- Page 1 ---\n{text}"
                    
                    # Extraction de l'en-tête et données principales
                    if True:  # Toujours traiter la première page
                        # Socket label (format B.111.580.234.8 ou similaire)
                        socket_match = re.search(r'Socket\s*[Ll]abel[:\s]*([B]\.\d{3}\.\d{3}\.\d{3}\.[0-9X]+)', text, re.IGNORECASE)
                        if socket_match:
                            result["data"]["socket_label"] = socket_match.group(1).strip()
                        
                        # Dispé ID dans l'en-tête (juste après "Disp ID:")
                        header_text = text.split('\n')[:15]  # Premières lignes
                        for line in header_text:
                            dispe_match = re.search(r'Disp\s*ID[:\s]*(\d+)', line, re.IGNORECASE)
                            if dispe_match:
                                result["data"]["dispe_id"] = dispe_match.group(1).strip()
                                break
                    
                    # Numéros de câble (ex: FTTH 32 FSP0fk290o-22, FSC09 - 53fi3)
                    cable_pattern1 = r'FTTH\s+\d+\s*FSP[A-Za-z0-9\-]+'
                    cable_pattern2 = r'FSC\d+\s*-\s*[A-Za-z0-9]+'
                    cables1 = re.findall(cable_pattern1, text)
                    cables2 = re.findall(cable_pattern2, text)
                    all_cables = cables1 + cables2
                    for cable in all_cables:
                        clean_cable = ' '.join(cable.split())  # Nettoyer les espaces
                        if clean_cable not in result["data"]["cables"]:
                            result["data"]["cables"].append(clean_cable)
                    
                    # Fibres Access (SP1, SP2, SP3, etc.)
                    # Dans le texte: "SP 1", "SP1", "36SP 2", etc.
                    fiber_pattern = r'(?:\d+)?SP\s*(\d+)'
                    fibers = re.findall(fiber_pattern, text, re.IGNORECASE)
                    for fiber_num in fibers:
                        fiber_label = f"SP{fiber_num}"
                        if fiber_label not in result["data"]["fibers"]:
                            result["data"]["fibers"].append(fiber_label)
                    
                    # Section "Interlocuteur et adresse pour l'installation"
                    contact_section = re.search(
                        r'Interlocuteur.*?installation.*?\n(.*?)(?:\n\n|\Z)',
                        text,
                        re.IGNORECASE | re.DOTALL
                    )
                    if contact_section:
                        contact_text = contact_section.group(1)
                        
                        # Nom (première ligne généralement)
                        lines = [l.strip() for l in contact_text.split('\n') if l.strip()]
                        if lines:
                            result["data"]["contact_name"] = lines[0]
                        
                        # Adresse (chercher rue, numéro)
                        addr_match = re.search(r'([^,\n]+(?:rue|avenue|chemin|route|ch\.|av\.)[^,\n]+)', contact_text, re.IGNORECASE)
                        if addr_match:
                            result["data"]["contact_address"] = addr_match.group(1).strip()
                        
                        # Code postal
                        zip_match = re.search(r'\b(\d{4})\b', contact_text)
                        if zip_match:
                            result["data"]["contact_zip"] = zip_match.group(1)
                        
                        # Ville (après le code postal)
                        if result["data"]["contact_zip"]:
                            city_match = re.search(rf'{result["data"]["contact_zip"]}\s+([A-Za-zÀ-ÿ\s\-]+)', contact_text)
                            if city_match:
                                result["data"]["contact_city"] = city_match.group(1).strip()
                        
                        # Téléphone
                        phone_match = re.search(r'(?:T[eé]l|Phone|Tel)[:\s]*([+\d\s]+)', contact_text, re.IGNORECASE)
                        if not phone_match:
                            phone_match = re.search(r'\+?\d{2}[\s\-]?\d{2}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}', contact_text)
                        if phone_match:
                            result["data"]["contact_phone"] = phone_match.group(1).strip() if hasattr(phone_match.group(1), 'strip') else phone_match.group(0).strip()
                        
                        # Email
                        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', contact_text)
                        if email_match:
                            result["data"]["contact_email"] = email_match.group(0)
                
                    # Extraire les tableaux (première page uniquement)
                    tables = page.extract_tables()
                    if tables:
                        for table in tables:
                            # Chercher numéro de mandat dans les tableaux
                            for row in table:
                                if row:
                                    # Chercher pattern numéro de mandat (ex: "24875848", "B.112.508.037.X")
                                    for cell in row:
                                        if cell:
                                            mandate_match = re.search(r'(?:^|\s)([B]?\d{8,}(?:\.\d+)*(?:\.X)?)', str(cell))
                                            if mandate_match and not result["data"]["mandate_number"]:
                                                result["data"]["mandate_number"] = mandate_match.group(1).strip()
            
            result["raw_text"] = full_text
            result["success"] = True
            
            # Formater les câbles (si plusieurs, les joindre avec " / ")
            if len(result["data"]["cables"]) > 1:
                result["data"]["cables_formatted"] = " / ".join(result["data"]["cables"][:2])  # Max 2 premiers
            elif result["data"]["cables"]:
                result["data"]["cables_formatted"] = result["data"]["cables"][0]
            else:
                result["data"]["cables_formatted"] = None
            
            # Formater les fibres (séparer en fibre_1, fibre_2, etc. pour appointments)
            if result["data"]["fibers"]:
                result["data"]["fibers"].sort(key=lambda x: int(x[2:]))  # Trier par numéro
                result["data"]["fibers_formatted"] = ", ".join(result["data"]["fibers"][:10])  # Max 10
                # Séparer les 4 premières fibres pour appointments
                for i, fiber in enumerate(result["data"]["fibers"][:4], 1):
                    result["data"][f"fiber_{i}"] = fiber
            else:
                result["data"]["fibers_formatted"] = None
            
    except Exception as e:
        result["error"] = str(e)
        result["success"] = False
    
    return result


def main():
    """Point d'entrée en ligne de commande"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "Usage: python analyze_mandate_pdf.py <pdf_path>",
            "success": False
        }))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not Path(pdf_path).exists():
        print(json.dumps({
            "error": f"Fichier non trouvé: {pdf_path}",
            "success": False
        }))
        sys.exit(1)
    
    result = extract_mandate_info(pdf_path)
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
