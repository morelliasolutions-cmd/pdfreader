"""
Extraction STRICTE de données des PDF de mandats FTTH avec parsing de tableaux
Version optimisée pour extraire les valeurs numériques des colonnes SP1-SP4
"""

import pdfplumber
import re
import json
import sys
from pathlib import Path
from typing import Dict, Optional


def extract_mandate_info_strict(pdf_path: str) -> Dict:
    """
    Extrait les informations d'un PDF de mandat FTTH (PREMIÈRE PAGE uniquement)
    Parsing strict des tableaux pour les fibres
    """
    result = {
        "file_name": Path(pdf_path).name,
        "success": False,
        "data": {
            "mandate_number": None,      # Obligatoire (Disp ID)
            "socket_label": None,         # Obligatoire (B.xxx.xxx.xxx.x)
            "cable": None,                # Obligatoire (câbles combinés avec /)
            "cables": [],                 # Liste des câbles (1 par ligne)
            "fibers_by_cable": [],        # Liste d'objets {cable, fiber_1..4}
            "fiber_1": None,              # Valeur numérique colonne SP1
            "fiber_2": None,              # Valeur numérique colonne SP2
            "fiber_3": None,              # Valeur numérique colonne SP3
            "fiber_4": None,              # Valeur numérique colonne SP4
            "phone": None,                # Téléphone +41...
            "email": None                 # Email
        },
        "confidence": 1.0,
        "needs_review": False,
        "missing_fields": [],
        "error": None
    }
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            if len(pdf.pages) == 0:
                raise Exception("PDF vide")
            
            page = pdf.pages[0]
            text = page.extract_text() or ""
            
            # === 1. DISP ID (mandate_number) - OBLIGATOIRE ===
            disp_match = re.search(r'Disp\s*ID[:\s]*(\d{8,})', text, re.IGNORECASE)
            if disp_match:
                result["data"]["mandate_number"] = disp_match.group(1).strip()
            else:
                result["missing_fields"].append("mandate_number")
            
            # === 2. SOCKET LABEL - OBLIGATOIRE ===
            socket_match = re.search(r'Socket\s*[Ll]abel[:\s]*([B]\.\d{3}\.\d{3}\.\d{3}\.[0-9X]+)', text, re.IGNORECASE)
            if socket_match:
                result["data"]["socket_label"] = socket_match.group(1).strip()
            else:
                result["missing_fields"].append("socket_label")
            
            # === 3 & 4. CÂBLES + FIBRES (SP1-SP4) - Parser TOUTES les lignes ===
            tables = page.extract_tables()
            fibers_found = False
            cables_found = []
            fibers_by_cable = []

            if tables:
                for table in tables:
                    if not table or len(table) < 2:
                        continue

                    sp_columns = {}
                    header_row_idx = None
                    cable_column_idx = None

                    # Trouver la ligne d'en-tête + colonnes SP + colonne Câble
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

                    # Parcourir toutes les lignes de données après l'en-tête
                    for data_row_idx in range(header_row_idx + 1, len(table)):
                        data_row = table[data_row_idx]
                        if not data_row:
                            continue

                        # Extraire câble sur cette ligne
                        cable_value = None
                        if cable_column_idx is not None and cable_column_idx < len(data_row):
                            cable_cell = data_row[cable_column_idx]
                            if cable_cell:
                                cable_value = ' '.join(str(cable_cell).split())
                                if cable_value and cable_value not in cables_found:
                                    cables_found.append(cable_value)

                        # Extraire fibres SP1..SP4 sur cette ligne
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
                                    fibers_found = True

                        # Conserver la ligne si elle a au moins un câble ou une fibre
                        if row_fibers["cable"] or any(row_fibers[f"fiber_{n}"] for n in ['1','2','3','4']):
                            fibers_by_cable.append(row_fibers)

                    if fibers_by_cable or cables_found:
                        break

            # Fallback câble: chercher dans le texte si aucun câble trouvé
            if not cables_found:
                cable_pattern1 = r'FTTH\s+\d+\s*FSP[A-Za-z0-9\-]+'
                cable_pattern2 = r'FSC\d+\s*-\s*[A-Za-z0-9]+'
                cables_found.extend(re.findall(cable_pattern1, text))
                cables_found.extend(re.findall(cable_pattern2, text))

            # Nettoyer et combiner les câbles (tous, séparés par /)
            cleaned_cables = []
            for cable in cables_found:
                clean = ' '.join(str(cable).split())
                if clean and clean not in cleaned_cables:
                    cleaned_cables.append(clean)

            result["data"]["cables"] = cleaned_cables
            if cleaned_cables:
                result["data"]["cable"] = " / ".join(cleaned_cables)
            else:
                result["missing_fields"].append("cable")

            # Conserver les fibres par câble
            result["data"]["fibers_by_cable"] = fibers_by_cable

            # Déduire fiber_1..4 par fusion (première valeur non nulle par colonne)
            for n in ['1','2','3','4']:
                if result["data"][f"fiber_{n}"] is None:
                    for row in fibers_by_cable:
                        if row.get(f"fiber_{n}"):
                            result["data"][f"fiber_{n}"] = row[f"fiber_{n}"]
                            break
            
            # Vérifier les fibres manquantes
            for i in range(1, 5):
                if result["data"][f"fiber_{i}"] is None:
                    result["missing_fields"].append(f"fiber_{i}")
            
            # === CALCULER CONFIDENCE & NEEDS_REVIEW ===
            required_fields = ["mandate_number", "socket_label", "cable"]
            missing_required = [f for f in required_fields if f in result["missing_fields"]]
            
            if missing_required:
                result["needs_review"] = True
                result["confidence"] = 0.3
            
            # === 5. TÉLÉPHONE (+41...) ===
            phone_match = re.search(r'\+41\s*\d{2}\s*\d{3}\s*\d{2}\s*\d{2}|\+41\d{9}', text)
            if phone_match:
                result["data"]["phone"] = phone_match.group(0).replace(' ', '')
            
            # === 6. EMAIL ===
            email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
            if email_match:
                result["data"]["email"] = email_match.group(0)
            elif len(result["missing_fields"]) > 0:
                # Fibres manquantes mais champs obligatoires OK
                result["confidence"] = 0.7
                result["needs_review"] = True
            else:
                result["confidence"] = 1.0
                result["needs_review"] = False
            
            result["success"] = len(missing_required) == 0  # Succès si champs obligatoires présents
            
    except Exception as e:
        result["error"] = str(e)
        result["success"] = False
        result["needs_review"] = True
        result["confidence"] = 0.0
    
    return result


def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "Usage: python analyze_mandate_pdf_strict.py <pdf_path>",
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
    
    result = extract_mandate_info_strict(pdf_path)
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
