"""
Analyse de PDF OTDR avec IA locale (LM Studio)
Extrait les données du PDF et les envoie à LM Studio pour analyse
"""

import pdfplumber
import requests
import json
import sys
import re
from pathlib import Path
from typing import Dict, List, Optional

# Configuration LM Studio
LM_STUDIO_URL = "http://127.0.0.1:1234/v1/chat/completions"

def extract_otdr_text(pdf_path: str) -> Dict:
    """
    Extrait le texte et les tableaux d'un PDF OTDR
    
    Args:
        pdf_path: Chemin vers le fichier PDF
        
    Returns:
        Dictionnaire avec texte et tableaux extraits
    """
    result = {
        "file_name": Path(pdf_path).name,
        "text": "",
        "tables": [],
        "num_pages": 0,
        "parsed_data": {}
    }
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            result["num_pages"] = len(pdf.pages)
            
            for page_num, page in enumerate(pdf.pages, start=1):
                # Extraire le texte
                text = page.extract_text()
                if text:
                    result["text"] += f"\n=== Page {page_num} ===\n{text}\n"
                
                # Extraire les tableaux
                tables = page.extract_tables()
                if tables:
                    for table_idx, table in enumerate(tables):
                        result["tables"].append({
                            "page": page_num,
                            "table_index": table_idx,
                            "data": table
                        })
            
            # Parser les données spécifiques OTDR
            result["parsed_data"] = parse_otdr_fields(result["text"])
            
    except Exception as e:
        result["error"] = str(e)
        print(f"❌ Erreur lors de l'extraction du PDF: {e}")
    
    return result


def parse_otdr_fields(text: str) -> Dict:
    """
    Parse les champs spécifiques d'un rapport OTDR
    
    Args:
        text: Texte extrait du PDF
        
    Returns:
        Dictionnaire avec les champs parsés
    """
    fields = {}
    
    # Patterns de recherche
    patterns = {
        "cable_name": r"Nom Câble\s*[:：]\s*([^\s]+)",
        "fiber_name": r"Nom Fibre/Numéro\s*[:：]\s*([^\s]+)",
        "origin": r"Origine\s*[:：]\s*([^\s]+)",
        "destination": r"Extrémité\s*[:：]\s*([^\s]+)",
        "intervention_ref": r"Réf Intervention\s*[:：]\s*([^\s]+)",
        "operator": r"Opérateur\s*[:：]\s*([^\s]+)",
        "wavelength": r"(\d+)nm",
        "test_date": r"Date\s*[:：]\s*(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2})",
        "fiber_length": r"Fin de fibre\s+Km\s+.*?\s+(\d+\.\d+)",
        "total_attenuation": r"Bilan\s+dB\s+.*?\s+(\d+\.\d+)",
        "orl": r"ORL Liaison dB\s+(\d+\.\d+)",
        "avg_attenuation": r"Affai\.\s+Moy\.\s+dB/Km\s+.*?\s+(\d+\.\d+)",
        "num_events": r"Evt\s+.*?\s+(\d+)",
    }
    
    for key, pattern in patterns.items():
        match = re.search(pattern, text)
        if match:
            fields[key] = match.group(1).strip()
    
    # Extraire les événements du tableau
    events = []
    event_pattern = r"(\d+)\s+(\d+\.\d+)\s+([-\d.]+)\s+([-\d.]+)?\s+(\d+\.\d+)\s+(\d+\.\d+)"
    for match in re.finditer(event_pattern, text):
        events.append({
            "event_num": match.group(1),
            "distance_km": match.group(2),
            "attenuation_db": match.group(3),
            "reflectance_db": match.group(4) if match.group(4) else None,
            "section_km": match.group(5),
            "cumulative_loss_db": match.group(6)
        })
    
    if events:
        fields["events"] = events
    
    return fields


def format_data_for_analysis(extracted_data: Dict) -> str:
    """
    Formate les données extraites pour l'analyse IA
    
    Args:
        extracted_data: Données extraites du PDF
        
    Returns:
        Texte formaté pour l'IA
    """
    output = f"# Rapport OTDR: {extracted_data['file_name']}\n\n"
    output += f"Nombre de pages: {extracted_data['num_pages']}\n\n"
    
    # Ajouter le texte complet
    output += "## Contenu textuel:\n"
    output += extracted_data["text"]
    
    # Ajouter les tableaux de manière structurée
    if extracted_data["tables"]:
        output += "\n\n## Tableaux extraits:\n"
        for table_info in extracted_data["tables"]:
            output += f"\n### Tableau {table_info['table_index'] + 1} (Page {table_info['page']}):\n"
            table_data = table_info["data"]
            
            # Formater le tableau en markdown
            if table_data:
                # Header
                if table_data[0]:
                    output += "| " + " | ".join([str(cell) if cell else "" for cell in table_data[0]]) + " |\n"
                    output += "| " + " | ".join(["---"] * len(table_data[0])) + " |\n"
                
                # Rows
                for row in table_data[1:]:
                    if row:
                        output += "| " + " | ".join([str(cell) if cell else "" for cell in row]) + " |\n"
    
    return output


def analyze_with_lmstudio(data_text: str, model: str = "llama-3.2-3b-instruct") -> Dict:
    """
    Envoie les données à LM Studio pour analyse
    
    Args:
        data_text: Données formatées à analyser
        model: Nom du modèle LM Studio
        
    Returns:
        Résultat de l'analyse avec score et recommandations
    """
    
    # Prompt système pour l'analyse OTDR
    system_prompt = """Tu es un expert en télécommunications spécialisé dans l'analyse de mesures OTDR (Optical Time-Domain Reflectometer).

Ton rôle est d'analyser les rapports OTDR et de:
1. Identifier les données clés (longueur de fibre, atténuation, longueur d'onde, événements)
2. Évaluer la qualité de la mesure
3. Détecter les anomalies ou problèmes potentiels
4. Donner un score de qualité sur 10
5. Fournir des recommandations

Les critères d'évaluation:
- Atténuation totale: < 0.5 dB/km = excellent, 0.5-1 dB/km = bon, > 1 dB/km = problème
- Réflectance aux connecteurs: < -45 dB = excellent, -45 à -35 dB = bon, > -35 dB = problème
- Pertes aux épissures: < 0.1 dB = excellent, 0.1-0.3 dB = acceptable, > 0.3 dB = problème
- Qualité du trace: clean = 10, avec bruit = 6-8, très bruité = 0-5

Réponds TOUJOURS au format JSON suivant (sans markdown):
{
  "score": 8.5,
  "status": "excellent",
  "fiber_length_km": "2.45",
  "total_attenuation_db": "0.85",
  "wavelength_nm": "1550",
  "num_events": 5,
  "issues": ["Liste des problèmes détectés"],
  "recommendations": ["Liste des recommandations"],
  "summary": "Résumé de l'analyse en 2-3 phrases"
}"""

    user_prompt = f"""Analyse ce rapport OTDR et fournis ton évaluation au format JSON:

{data_text}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans texte avant ou après, sans balises markdown."""

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.3,  # Basse température pour des réponses plus précises
        "max_tokens": 1000
    }
    
    try:
        print("🤖 Envoi à LM Studio pour analyse...")
        response = requests.post(LM_STUDIO_URL, json=payload, timeout=60)
        response.raise_for_status()
        
        result = response.json()
        
        # Extraire le contenu de la réponse
        if "choices" in result and len(result["choices"]) > 0:
            content = result["choices"][0]["message"]["content"]
            
            # Nettoyer le contenu (supprimer les balises markdown si présentes)
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            # Parser le JSON
            try:
                analysis = json.loads(content)
                return analysis
            except json.JSONDecodeError as e:
                print(f"⚠️  Réponse de l'IA non-JSON, tentative de parsing...")
                # Essayer d'extraire le JSON du texte
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    analysis = json.loads(json_match.group(0))
                    return analysis
                else:
                    return {
                        "score": 5.0,
                        "status": "inconnu",
                        "issues": ["Impossible de parser la réponse de l'IA"],
                        "recommendations": ["Vérifier le format de réponse du modèle"],
                        "summary": content,
                        "raw_response": content
                    }
        else:
            return {
                "score": 0,
                "status": "erreur",
                "issues": ["Pas de réponse de LM Studio"],
                "recommendations": ["Vérifier que LM Studio est lancé"],
                "summary": "Erreur de communication"
            }
            
    except requests.exceptions.ConnectionError:
        return {
            "score": 0,
            "status": "erreur",
            "issues": ["Impossible de se connecter à LM Studio"],
            "recommendations": [
                "Vérifier que LM Studio est lancé",
                "Vérifier que le serveur local est actif sur http://127.0.0.1:1234"
            ],
            "summary": "LM Studio n'est pas accessible"
        }
    except requests.exceptions.Timeout:
        return {
            "score": 0,
            "status": "erreur",
            "issues": ["Timeout de la requête"],
            "recommendations": ["Le modèle est peut-être trop lent, essayer un modèle plus petit"],
            "summary": "Timeout lors de l'analyse"
        }
    except Exception as e:
        return {
            "score": 0,
            "status": "erreur",
            "issues": [f"Erreur: {str(e)}"],
            "recommendations": ["Vérifier les logs de LM Studio"],
            "summary": f"Erreur lors de l'analyse: {str(e)}"
        }


def save_results(pdf_path: str, analysis: Dict):
    """Sauvegarde les résultats au format JSON"""
    output_path = Path(pdf_path).with_suffix('.analysis.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)
    print(f"💾 Résultats sauvegardés: {output_path}")


def main():
    """Fonction principale"""
    if len(sys.argv) < 2:
        print("Usage: python analyze_otdr_with_lmstudio.py <chemin_pdf> [model]")
        print("Exemple: python analyze_otdr_with_lmstudio.py rapport_otdr.pdf")
        print("         python analyze_otdr_with_lmstudio.py rapport_otdr.pdf llama-3.2-3b-instruct")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    model = sys.argv[2] if len(sys.argv) > 2 else "llama-3.2-3b-instruct"
    
    if not Path(pdf_path).exists():
        print(f"❌ Erreur: Le fichier {pdf_path} n'existe pas")
        sys.exit(1)
    
    print("="*70)
    print(f"📄 Analyse OTDR avec IA locale")
    print("="*70)
    print(f"Fichier: {pdf_path}")
    print(f"Modèle IA: {model}")
    print(f"LM Studio: {LM_STUDIO_URL}")
    print("="*70)
    
    # Étape 1: Extraction du PDF
    print("\n📊 ÉTAPE 1: Extraction des données du PDF...")
    extracted_data = extract_otdr_text(pdf_path)
    
    if "error" in extracted_data:
        print(f"❌ Échec de l'extraction: {extracted_data['error']}")
        sys.exit(1)
    
    print(f"   ✅ {extracted_data['num_pages']} page(s) extraite(s)")
    print(f"   ✅ {len(extracted_data['tables'])} tableau(x) détecté(s)")
    print(f"   ✅ {len(extracted_data['text'])} caractères de texte")    
    # Afficher les données parsées
    if extracted_data.get("parsed_data"):
        print(f"\n📋 DONNÉES PARSÉES:")
        parsed = extracted_data["parsed_data"]
        if parsed.get("cable_name"):
            print(f"   - Câble: {parsed['cable_name']}")
        if parsed.get("fiber_name"):
            print(f"   - Fibre: {parsed['fiber_name']}")
        if parsed.get("operator"):
            print(f"   - Opérateur: {parsed['operator']}")
        if parsed.get("wavelength"):
            print(f"   - Longueur d'onde: {parsed['wavelength']} nm")
        if parsed.get("fiber_length"):
            print(f"   - Longueur fibre: {parsed['fiber_length']} km")
        if parsed.get("total_attenuation"):
            print(f"   - Bilan: {parsed['total_attenuation']} dB")
        if parsed.get("events"):
            print(f"   - Événements: {len(parsed['events'])}")    
    # Étape 2: Formatage des données
    print("\n📝 ÉTAPE 2: Formatage des données pour l'IA...")
    formatted_data = format_data_for_analysis(extracted_data)
    print(f"   ✅ Données formatées ({len(formatted_data)} caractères)")
    
    # Étape 3: Analyse avec LM Studio
    print("\n🤖 ÉTAPE 3: Analyse avec LM Studio...")
    analysis = analyze_with_lmstudio(formatted_data, model)
    
    # Affichage des résultats
    print("\n" + "="*70)
    print("⭐ RÉSULTATS DE L'ANALYSE")
    print("="*70)
    
    score = analysis.get("score", 0)
    status = analysis.get("status", "inconnu")
    
    # Emoji basé sur le score
    if score >= 8:
        emoji = "✅"
    elif score >= 6:
        emoji = "✔️"
    elif score >= 4:
        emoji = "⚠️"
    else:
        emoji = "❌"
    
    print(f"\n{emoji} Score: {score}/10")
    print(f"📊 Statut: {status.upper()}")
    
    # Données techniques
    if analysis.get("fiber_length_km"):
        print(f"\n🔧 DONNÉES TECHNIQUES:")
        print(f"   - Longueur fibre: {analysis.get('fiber_length_km')} km")
        if analysis.get("total_attenuation_db"):
            print(f"   - Atténuation totale: {analysis.get('total_attenuation_db')} dB")
        if analysis.get("wavelength_nm"):
            print(f"   - Longueur d'onde: {analysis.get('wavelength_nm')} nm")
        if analysis.get("num_events"):
            print(f"   - Événements détectés: {analysis.get('num_events')}")
    
    # Résumé
    if analysis.get("summary"):
        print(f"\n📋 RÉSUMÉ:")
        print(f"   {analysis['summary']}")
    
    # Problèmes détectés
    if analysis.get("issues") and len(analysis["issues"]) > 0:
        print(f"\n⚠️  PROBLÈMES DÉTECTÉS:")
        for issue in analysis["issues"]:
            print(f"   - {issue}")
    
    # Recommandations
    if analysis.get("recommendations") and len(analysis["recommendations"]) > 0:
        print(f"\n💡 RECOMMANDATIONS:")
        for rec in analysis["recommendations"]:
            print(f"   - {rec}")
    
    # Sauvegarde
    save_results(pdf_path, {
        "file": pdf_path,
        "model": model,
        "analysis": analysis,
        "extracted_data": {
            "num_pages": extracted_data["num_pages"],
            "num_tables": len(extracted_data["tables"]),
            "text_length": len(extracted_data["text"])
        }
    })
    
    print("\n" + "="*70)
    print("✅ Analyse terminée!")
    print("="*70)


if __name__ == "__main__":
    main()
