"""
Analyse de PDF OTDR avec PDFPlumber
Extraction de données techniques des rapports OTDR
"""

import pdfplumber
import re
import json
from pathlib import Path
from typing import Dict, List, Optional
import sys

def extract_otdr_data(pdf_path: str) -> Dict:
    """
    Extrait les données d'un PDF OTDR
    
    Args:
        pdf_path: Chemin vers le fichier PDF
        
    Returns:
        Dictionnaire avec les données extraites
    """
    result = {
        "file_path": pdf_path,
        "file_name": Path(pdf_path).name,
        "pages": [],
        "text_content": "",
        "tables": [],
        "metadata": {},
        "technical_data": {}
    }
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            # Métadonnées du PDF
            result["metadata"] = {
                "num_pages": len(pdf.pages),
                "creator": pdf.metadata.get("Creator", ""),
                "producer": pdf.metadata.get("Producer", ""),
                "creation_date": pdf.metadata.get("CreationDate", "")
            }
            
            # Extraction page par page
            for page_num, page in enumerate(pdf.pages, start=1):
                page_data = {
                    "page_number": page_num,
                    "text": "",
                    "tables": [],
                    "width": page.width,
                    "height": page.height
                }
                
                # Extraction du texte
                text = page.extract_text()
                if text:
                    page_data["text"] = text
                    result["text_content"] += f"\n--- Page {page_num} ---\n{text}"
                
                # Extraction des tableaux
                tables = page.extract_tables()
                if tables:
                    for table_idx, table in enumerate(tables):
                        page_data["tables"].append({
                            "table_index": table_idx,
                            "data": table
                        })
                        result["tables"].append({
                            "page": page_num,
                            "table_index": table_idx,
                            "data": table
                        })
                
                result["pages"].append(page_data)
            
            # Analyse des données techniques OTDR
            result["technical_data"] = extract_technical_info(result["text_content"])
            
    except Exception as e:
        result["error"] = str(e)
    
    return result


def extract_technical_info(text: str) -> Dict:
    """
    Extrait les informations techniques spécifiques aux OTDR
    
    Args:
        text: Texte complet du PDF
        
    Returns:
        Dictionnaire avec les données techniques
    """
    technical_data = {
        "fiber_length": None,
        "wavelength": None,
        "attenuation": None,
        "reflectance": None,
        "splice_loss": [],
        "connector_loss": [],
        "events": [],
        "test_date": None,
        "operator": None
    }
    
    # Regex patterns pour extraction
    patterns = {
        "fiber_length": r"(?:Length|Distance|Longueur)[:\s]+([0-9.,]+)\s*(?:km|m)",
        "wavelength": r"(?:Wavelength|λ)[:\s]+([0-9]+)\s*nm",
        "attenuation": r"(?:Attenuation|Att|Affaiblissement)[:\s]+([0-9.,]+)\s*dB",
        "reflectance": r"(?:Reflectance|Réflectance)[:\s]+(-?[0-9.,]+)\s*dB",
        "test_date": r"(?:Date|Test Date)[:\s]+([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})",
        "operator": r"(?:Operator|Opérateur|Technicien)[:\s]+([A-Za-zÀ-ÿ\s]+)"
    }
    
    for key, pattern in patterns.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            technical_data[key] = match.group(1).strip()
    
    # Extraction des événements (splices, connecteurs)
    # Pattern pour les événements dans les tableaux OTDR
    event_pattern = r"([0-9.,]+)\s+(?:km|m)\s+([0-9.,]+)\s+dB"
    events = re.findall(event_pattern, text)
    
    for distance, loss in events:
        technical_data["events"].append({
            "distance_km": distance,
            "loss_db": loss
        })
    
    return technical_data


def analyze_otdr_quality(data: Dict) -> Dict:
    """
    Analyse la qualité d'un rapport OTDR
    
    Args:
        data: Données extraites du PDF
        
    Returns:
        Score de qualité et recommandations
    """
    quality_score = 10.0
    issues = []
    recommendations = []
    
    tech_data = data.get("technical_data", {})
    
    # Vérification de la présence des données essentielles
    if not tech_data.get("fiber_length"):
        quality_score -= 2
        issues.append("Longueur de fibre non détectée")
    
    if not tech_data.get("wavelength"):
        quality_score -= 1
        issues.append("Longueur d'onde non spécifiée")
    
    if not tech_data.get("attenuation"):
        quality_score -= 2
        issues.append("Atténuation totale non trouvée")
    
    # Vérification des événements
    events = tech_data.get("events", [])
    if len(events) == 0:
        quality_score -= 1
        recommendations.append("Aucun événement détecté - vérifier le tracé")
    
    # Vérification de la présence de tableaux
    if len(data.get("tables", [])) == 0:
        quality_score -= 1
        recommendations.append("Aucun tableau détecté dans le PDF")
    
    # Vérification du nombre de pages
    num_pages = data.get("metadata", {}).get("num_pages", 0)
    if num_pages == 0:
        quality_score -= 3
        issues.append("PDF vide ou illisible")
    elif num_pages < 2:
        quality_score -= 0.5
        recommendations.append("PDF court - peut manquer d'informations")
    
    # Score final entre 0 et 10
    quality_score = max(0, min(10, quality_score))
    
    return {
        "score": round(quality_score, 1),
        "status": "excellent" if quality_score >= 8 else "bon" if quality_score >= 6 else "moyen" if quality_score >= 4 else "faible",
        "issues": issues,
        "recommendations": recommendations,
        "details": {
            "has_fiber_length": bool(tech_data.get("fiber_length")),
            "has_wavelength": bool(tech_data.get("wavelength")),
            "has_attenuation": bool(tech_data.get("attenuation")),
            "num_events": len(events),
            "num_tables": len(data.get("tables", [])),
            "num_pages": num_pages
        }
    }


def main():
    """Fonction principale pour tester l'analyse"""
    if len(sys.argv) < 2:
        print("Usage: python analyze_pdf.py <chemin_pdf>")
        print("Exemple: python analyze_pdf.py otdr_report.pdf")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not Path(pdf_path).exists():
        print(f"❌ Erreur: Le fichier {pdf_path} n'existe pas")
        sys.exit(1)
    
    print(f"📄 Analyse du PDF: {pdf_path}")
    print("="*60)
    
    # Extraction des données
    data = extract_otdr_data(pdf_path)
    
    if "error" in data:
        print(f"❌ Erreur lors de l'extraction: {data['error']}")
        sys.exit(1)
    
    # Affichage des métadonnées
    print("\n📊 MÉTADONNÉES:")
    print(f"   - Nombre de pages: {data['metadata']['num_pages']}")
    print(f"   - Créateur: {data['metadata']['creator']}")
    
    # Affichage des données techniques
    print("\n🔧 DONNÉES TECHNIQUES:")
    tech_data = data["technical_data"]
    for key, value in tech_data.items():
        if value and not isinstance(value, list):
            print(f"   - {key}: {value}")
    
    if tech_data.get("events"):
        print(f"\n⚡ ÉVÉNEMENTS DÉTECTÉS: {len(tech_data['events'])}")
        for i, event in enumerate(tech_data["events"][:5], 1):
            print(f"   {i}. Distance: {event['distance_km']} km, Perte: {event['loss_db']} dB")
        if len(tech_data["events"]) > 5:
            print(f"   ... et {len(tech_data['events']) - 5} autres événements")
    
    # Analyse de qualité
    print("\n⭐ ANALYSE DE QUALITÉ:")
    quality = analyze_otdr_quality(data)
    print(f"   - Score: {quality['score']}/10")
    print(f"   - Statut: {quality['status'].upper()}")
    
    if quality["issues"]:
        print("\n⚠️  PROBLÈMES DÉTECTÉS:")
        for issue in quality["issues"]:
            print(f"   - {issue}")
    
    if quality["recommendations"]:
        print("\n💡 RECOMMANDATIONS:")
        for rec in quality["recommendations"]:
            print(f"   - {rec}")
    
    # Sauvegarde en JSON
    output_path = Path(pdf_path).with_suffix('.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            "extraction": data,
            "quality": quality
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Résultats sauvegardés dans: {output_path}")
    print("\n✅ Analyse terminée!")


if __name__ == "__main__":
    main()
