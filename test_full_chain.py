"""
Test complet de l'extraction PDF avec double couche
"""
import sys
import os

# Ajouter le chemin pour importer app
sys.path.insert(0, os.path.dirname(__file__))

# Import des fonctions d'extraction
from app import extract_pdf_data, extract_with_ai, merge_extractions

# Créer un PDF de test simple
print("🧪 Test complet de la chaîne d'extraction")
print("="*70)

# Simuler un texte extrait de PDF
test_text = """
SWISSCOM FTTH Installation Order - Dispatch Details

Order Information:
Disp ID: 987654321
Date: 11.02.2026

Technical Details:
Socket Label: B.5678.90.12.3
PTO Reference: B.5678.90.12.3

Customer Information:
Name: Marie Martin
Address: Avenue de la Gare 42, 1001 Lausanne, Switzerland
Phone: +41 78 987 65 43
Email: marie.martin@bluewin.ch

Cable Configuration:
Main Cable: FO-SWISSCOM-LAU-2026-A

Splice Points:
SP1: 8
SP2: 11
SP3: 14
SP4: 17

Installation Notes:
- Standard FTTH installation
- Customer available after 14:00
"""

print("\n📝 Texte de test:")
print("-" * 70)
print(test_text[:300] + "...")
print("-" * 70)

# Test extraction traditionnelle (simulée)
print("\n1️⃣ Simulation extraction traditionnelle...")
traditional_data = {
    'mandate_number': '987654321',
    'socket_label': 'B.5678.90.12.3',
    'cable': 'FO-SWISSCOM-LAU-2026-A',
    'cables': ['FO-SWISSCOM-LAU-2026-A'],
    'fibers_by_cable': [],
    'fiber_1': '8',
    'fiber_2': '11',
    'fiber_3': '14',
    'fiber_4': '17',
    'phone': None,  # Pas trouvé par traditionnel (regex raté)
    'email': None,  # Pas trouvé par traditionnel
    'full_text': test_text,
    'address': None,
    'client_name': None
}
print(f"✅ Champs trouvés: {[k for k, v in traditional_data.items() if v and k != 'full_text']}")

# Test extraction IA
print("\n2️⃣ Test extraction IA réelle...")
ai_data = extract_with_ai(test_text, "test.pdf")

if ai_data:
    print(f"✅ IA a extrait: {list(ai_data.keys())}")
    for key, value in ai_data.items():
        print(f"   - {key}: {value}")
else:
    print("❌ L'IA n'a rien retourné")

# Test fusion
print("\n3️⃣ Test fusion des extractions...")
merged = merge_extractions(traditional_data, ai_data)

print(f"\n📊 Résultat final de la fusion:")
print("-" * 70)
for key, value in merged.items():
    if key not in ['full_text', 'cables', 'fibers_by_cable'] and value:
        source = "🤖 IA" if key in merged.get('ai_filled_fields', []) else "📝 Trad"
        print(f"{source} {key:20s}: {value}")

print("\n" + "="*70)
if merged.get('ai_contribution'):
    print(f"✅ L'IA a contribué ! Champs complétés: {merged.get('ai_filled_fields', [])}")
else:
    print("⚠️ L'IA n'a PAS contribué (ai_contribution = False)")

print("\n🔍 Diagnostic:")
print(f"  - traditional_data avait phone? {bool(traditional_data.get('phone'))}")
print(f"  - ai_data existe? {ai_data is not None}")
if ai_data:
    print(f"  - ai_data avait phone? {bool(ai_data.get('phone'))}")
    print(f"  - ai_data avait address? {bool(ai_data.get('address'))}")
    print(f"  - ai_data avait client_name? {bool(ai_data.get('client_name'))}")
