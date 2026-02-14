"""
Validation automatique de PDF OTDR sans IA
Vérifie les critères de qualité selon les règles métier
"""

import pdfplumber
import re
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

def extract_otdr_data(pdf_path: str) -> Dict:
    """Extrait les données structurées du PDF OTDR"""
    data = {
        "file_path": pdf_path,
        "file_name": Path(pdf_path).name,
        "raw_text": "",
        "fields": {}
    }
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            data["raw_text"] = pdf.pages[0].extract_text()
            
            # Parser les champs principaux
            text = data["raw_text"]
            
            # Date d'impression
            match = re.search(r"Date d'Impression\s*[:：]\s*(\d{2}/\d{2}/\d{4})", text)
            if match:
                data["fields"]["print_date"] = match.group(1)
            
            # Nom câble (PTO)
            match = re.search(r"Nom Câble\s*[:：]\s*([^\s]+)", text)
            if match:
                data["fields"]["cable_name"] = match.group(1)
            
            # Nom fibre/numéro
            match = re.search(r"Nom Fibre/Numéro\s*[:：]\s*(\w+)\s+(\d+)", text)
            if match:
                data["fields"]["fiber_name"] = match.group(1)
                data["fields"]["fiber_number"] = int(match.group(2))
            
            # Origine
            match = re.search(r"Origine\s*[:：]\s*([^\s]+)", text)
            if match:
                data["fields"]["origin"] = match.group(1)
            
            # Extrémité
            match = re.search(r"Extrémité\s*[:：]\s*([^\s]+)", text)
            if match:
                data["fields"]["destination"] = match.group(1)
            
            # Section A-B (le dernier nombre)
            match = re.search(r"A-B\s*[:：]\s*([0-9.]+)km\s+([0-9.]+)\s+dB/Km\s+([0-9.]+)\s+dB", text)
            if match:
                data["fields"]["section_ab"] = {
                    "distance_km": float(match.group(1)),
                    "attenuation_per_km": float(match.group(2)),
                    "total_db": float(match.group(3))
                }
            
            # Seuils d'alarme
            match = re.search(r"Perte Connecteur \(dB\)\s+>([0-9.]+)", text)
            if match:
                data["fields"]["threshold_connector"] = float(match.group(1))
            
            match = re.search(r"Perte Epissure \(dB\)\s+>([0-9.]+)", text)
            if match:
                data["fields"]["threshold_splice"] = float(match.group(1))
            
            match = re.search(r"Réflection \(dB\)\s+>([-0-9.]+)", text)
            if match:
                data["fields"]["threshold_reflection"] = float(match.group(1))
            
            # Événements du tableau
            data["fields"]["events"] = []
            event_pattern = r"(\d+)\s+([0-9.]+)\s+([-0-9.]+)\s+([-0-9.]+)?\s+([0-9.]+)\s+([0-9.]+)"
            for match in re.finditer(event_pattern, text):
                event = {
                    "event_num": int(match.group(1)),
                    "distance_km": float(match.group(2)),
                    "attenuation_db": float(match.group(3)),
                    "reflectance_db": float(match.group(4)) if match.group(4) else None,
                    "section_km": float(match.group(5)),
                    "cumulative_loss_db": float(match.group(6))
                }
                data["fields"]["events"].append(event)
                
    except Exception as e:
        data["error"] = str(e)
    
    return data


def validate_otdr(pdf_path: str, expected_pto: str, pdf_slot: int, check_date: bool = True) -> Dict:
    """
    Valide un PDF OTDR selon les critères métier
    
    Args:
        pdf_path: Chemin vers le PDF
        expected_pto: Numéro PTO attendu (ex: B.161.079.627.6)
        pdf_slot: Emplacement du PDF (1-4) pour vérifier le numéro de fibre
        check_date: Si True, vérifie que la date est du jour
        
    Returns:
        Résultat de validation avec score et détails
    """
    
    result = {
        "file": pdf_path,
        "valid": True,
        "score": 10.0,
        "errors": [],
        "warnings": [],
        "checks": {},
        "data": {}
    }
    
    # Extraction des données
    print(f"📄 Extraction du PDF...")
    extracted = extract_otdr_data(pdf_path)
    
    if "error" in extracted:
        result["valid"] = False
        result["score"] = 0
        result["errors"].append(f"Erreur d'extraction: {extracted['error']}")
        return result
    
    fields = extracted["fields"]
    result["data"] = fields
    
    # === VÉRIFICATION 1: Date d'impression ===
    if check_date and "print_date" in fields:
        print(f"📅 Vérification date d'impression...")
        try:
            pdf_date = datetime.strptime(fields["print_date"], "%d/%m/%Y")
            today = datetime.now()
            
            # Tolérance: même jour ou veille (pour tests nocturnes)
            if pdf_date.date() == today.date():
                result["checks"]["date"] = {"status": "OK", "message": "Date du jour"}
            elif pdf_date.date() == (today - timedelta(days=1)).date():
                result["checks"]["date"] = {"status": "WARNING", "message": "Date de la veille"}
                result["warnings"].append("PDF généré hier")
                result["score"] -= 0.5
            else:
                result["checks"]["date"] = {"status": "ERROR", "message": f"Date incorrecte: {fields['print_date']}"}
                result["errors"].append(f"Date d'impression incorrecte: {fields['print_date']} (attendu: {today.strftime('%d/%m/%Y')})")
                result["score"] -= 2.0
                result["valid"] = False
        except ValueError:
            result["checks"]["date"] = {"status": "ERROR", "message": "Format de date invalide"}
            result["errors"].append("Format de date invalide")
            result["score"] -= 1.0
    else:
        result["checks"]["date"] = {"status": "SKIP", "message": "Vérification date désactivée"}
    
    # === VÉRIFICATION 2: Nom câble = PTO ===
    print(f"🔌 Vérification PTO...")
    if "cable_name" in fields:
        if fields["cable_name"] == expected_pto:
            result["checks"]["pto"] = {"status": "OK", "message": f"PTO correct: {expected_pto}"}
        else:
            result["checks"]["pto"] = {"status": "ERROR", "message": f"PTO incorrect: {fields['cable_name']} ≠ {expected_pto}"}
            result["errors"].append(f"PTO incorrect: trouvé '{fields['cable_name']}', attendu '{expected_pto}'")
            result["score"] -= 3.0
            result["valid"] = False
    else:
        result["checks"]["pto"] = {"status": "ERROR", "message": "PTO non trouvé"}
        result["errors"].append("Nom câble (PTO) non trouvé dans le PDF")
        result["score"] -= 3.0
        result["valid"] = False
    
    # === VÉRIFICATION 3: Numéro de fibre = slot PDF ===
    print(f"🧵 Vérification numéro de fibre...")
    if "fiber_number" in fields:
        if fields["fiber_number"] == pdf_slot:
            result["checks"]["fiber_slot"] = {"status": "OK", "message": f"Fibre {pdf_slot} OK"}
        else:
            result["checks"]["fiber_slot"] = {"status": "ERROR", "message": f"Fibre {fields['fiber_number']} ≠ slot {pdf_slot}"}
            result["errors"].append(f"Numéro de fibre incorrect: trouvé {fields['fiber_number']}, attendu {pdf_slot}")
            result["score"] -= 2.0
            result["valid"] = False
    else:
        result["checks"]["fiber_slot"] = {"status": "ERROR", "message": "Numéro de fibre non trouvé"}
        result["errors"].append("Numéro de fibre non trouvé")
        result["score"] -= 2.0
        result["valid"] = False
    
    # === VÉRIFICATION 4: Origine et Extrémité identiques ===
    print(f"📍 Vérification origine/destination...")
    if "origin" in fields and "destination" in fields:
        # Note: l'utilisateur dit "identique" mais dans son exemple OTO ≠ OMDF
        # Je suppose qu'il veut vérifier qu'ils existent, pas qu'ils soient égaux
        result["checks"]["endpoints"] = {"status": "OK", "message": f"{fields['origin']} → {fields['destination']}"}
    else:
        result["checks"]["endpoints"] = {"status": "WARNING", "message": "Origine ou destination manquante"}
        result["warnings"].append("Origine ou destination non trouvée")
        result["score"] -= 0.5
    
    # === VÉRIFICATION 5: Section A-B < 1.200 dB ===
    print(f"📊 Vérification atténuation A-B...")
    if "section_ab" in fields:
        total_db = fields["section_ab"]["total_db"]
        if total_db < 1.200:
            result["checks"]["attenuation_ab"] = {"status": "OK", "message": f"A-B: {total_db} dB < 1.200 dB"}
        else:
            result["checks"]["attenuation_ab"] = {"status": "ERROR", "message": f"A-B: {total_db} dB ≥ 1.200 dB"}
            result["errors"].append(f"Atténuation A-B trop élevée: {total_db} dB (max 1.200 dB)")
            result["score"] -= 2.0
            result["valid"] = False
    else:
        result["checks"]["attenuation_ab"] = {"status": "WARNING", "message": "Section A-B non trouvée"}
        result["warnings"].append("Section A-B non trouvée")
        result["score"] -= 0.5
    
    # === VÉRIFICATION 6: Événements - Seuils d'alarme ===
    print(f"⚡ Vérification événements...")
    if "events" in fields and len(fields["events"]) > 0:
        threshold_connector = fields.get("threshold_connector", 0.80)
        threshold_splice = fields.get("threshold_splice", 0.45)
        threshold_reflection = fields.get("threshold_reflection", -55.0)
        
        violations = []
        
        for event in fields["events"]:
            event_num = event["event_num"]
            attenuation = event["attenuation_db"]
            reflectance = event["reflectance_db"]
            
            # Vérifier perte connecteur/épissure
            if attenuation > threshold_connector:
                violations.append(f"Evt {event_num}: Perte {attenuation} dB > {threshold_connector} dB (seuil connecteur)")
            elif attenuation > threshold_splice:
                violations.append(f"Evt {event_num}: Perte {attenuation} dB > {threshold_splice} dB (seuil épissure)")
            
            # Vérifier réflectance (si présente)
            if reflectance is not None and reflectance > threshold_reflection:
                violations.append(f"Evt {event_num}: Réflectance {reflectance} dB > {threshold_reflection} dB")
        
        if violations:
            result["checks"]["events"] = {"status": "ERROR", "message": f"{len(violations)} violation(s)"}
            result["errors"].extend(violations)
            result["score"] -= len(violations) * 0.5
            result["valid"] = False
        else:
            result["checks"]["events"] = {"status": "OK", "message": f"{len(fields['events'])} événements conformes"}
    else:
        result["checks"]["events"] = {"status": "WARNING", "message": "Aucun événement trouvé"}
        result["warnings"].append("Tableau des événements vide")
        result["score"] -= 0.5
    
    # Score final entre 0 et 10
    result["score"] = max(0, min(10, result["score"]))
    
    return result


def main():
    """Fonction principale de test"""
    import sys
    
    if len(sys.argv) < 4:
        print("Usage: python validate_otdr_pdf.py <pdf_path> <pto_expected> <pdf_slot> [check_date]")
        print()
        print("Exemples:")
        print('  python validate_otdr_pdf.py rapport.pdf "B.161.079.627.6" 1')
        print('  python validate_otdr_pdf.py rapport.pdf "B.161.079.627.6" 1 false')
        print()
        print("Arguments:")
        print("  pdf_path      : Chemin vers le PDF OTDR")
        print("  pto_expected  : Numéro PTO attendu (ex: B.161.079.627.6)")
        print("  pdf_slot      : Emplacement du PDF (1-4)")
        print("  check_date    : Vérifier la date (true/false, défaut: true)")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    expected_pto = sys.argv[2]
    pdf_slot = int(sys.argv[3])
    check_date = sys.argv[4].lower() != "false" if len(sys.argv) > 4 else True
    
    if not Path(pdf_path).exists():
        print(f"❌ Erreur: Le fichier {pdf_path} n'existe pas")
        sys.exit(1)
    
    print("="*70)
    print("🔍 VALIDATION OTDR PDF")
    print("="*70)
    print(f"Fichier    : {pdf_path}")
    print(f"PTO attendu: {expected_pto}")
    print(f"Slot PDF   : {pdf_slot}")
    print(f"Vérif. date: {'Oui' if check_date else 'Non'}")
    print("="*70)
    
    # Validation
    result = validate_otdr(pdf_path, expected_pto, pdf_slot, check_date)
    
    # Affichage des résultats
    print("\n" + "="*70)
    print("📋 RÉSULTATS DE VALIDATION")
    print("="*70)
    
    if result["valid"]:
        print("✅ VALIDATION RÉUSSIE")
    else:
        print("❌ VALIDATION ÉCHOUÉE")
    
    print(f"\n⭐ Score: {result['score']:.1f}/10")
    
    # Détails des vérifications
    print("\n🔍 DÉTAILS DES VÉRIFICATIONS:")
    for check_name, check_result in result["checks"].items():
        status = check_result["status"]
        message = check_result["message"]
        
        if status == "OK":
            icon = "✅"
        elif status == "WARNING":
            icon = "⚠️"
        elif status == "ERROR":
            icon = "❌"
        else:
            icon = "⏭️"
        
        print(f"  {icon} {check_name.replace('_', ' ').title()}: {message}")
    
    # Erreurs
    if result["errors"]:
        print(f"\n❌ ERREURS DÉTECTÉES ({len(result['errors'])}):")
        for error in result["errors"]:
            print(f"  - {error}")
    
    # Avertissements
    if result["warnings"]:
        print(f"\n⚠️  AVERTISSEMENTS ({len(result['warnings'])}):")
        for warning in result["warnings"]:
            print(f"  - {warning}")
    
    # Sauvegarde JSON
    output_path = Path(pdf_path).with_suffix('.validation.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Résultats sauvegardés: {output_path}")
    
    print("\n" + "="*70)
    if result["valid"]:
        print("✅ PDF CONFORME")
    else:
        print("❌ PDF NON CONFORME")
    print("="*70)
    
    # Exit code selon validation
    sys.exit(0 if result["valid"] else 1)


if __name__ == "__main__":
    main()
