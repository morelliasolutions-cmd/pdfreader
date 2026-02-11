"""
Test rapide : Upload PDF via API directement (sans Service Worker)
"""
import requests
import glob

api_url = "https://velox-pdfswisscom.yhmr4j.easypanel.host/api/analyze-pdf"

# Prendre 2 PDFs pour un test rapide
pdf_files = glob.glob('*.pdf')[:2]

if not pdf_files:
    print("❌ Aucun PDF trouvé")
    exit(1)

print("🧪 Test rapide d'upload PDF (2 fichiers)")
print("="*60)

files = []
for pdf in pdf_files:
    with open(pdf, 'rb') as f:
        files.append(('pdfs', (pdf, f.read(), 'application/pdf')))
    print(f"📄 {pdf}")

print(f"\n🚀 Envoi à l'API...")

try:
    import time
    start = time.time()
    
    response = requests.post(api_url, files=files, timeout=120)
    elapsed = time.time() - start
    
    print(f"⏱️  Temps: {elapsed:.1f}s")
    print(f"📊 Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✅ SUCCÈS!")
        print(f"   Fichiers traités: {result.get('count')}")
        
        for r in result.get('results', []):
            ai_contrib = r.get('extraction_sources', {}).get('ai_contributed', False)
            ai_fields = r.get('extraction_sources', {}).get('ai_fields', [])
            confidence = r.get('confidence', 0) * 100
            
            icon = "🤖" if ai_contrib else "📝"
            print(f"\n   {icon} {r['file_name']}: {confidence:.0f}%")
            if ai_fields:
                print(f"      IA: {', '.join(ai_fields)}")
    else:
        print(f"❌ Erreur {response.status_code}")
        print(response.text[:500])
        
except Exception as e:
    print(f"❌ Exception: {e}")

print("\n" + "="*60)
print("💡 Si ça fonctionne ici mais pas dans le navigateur,")
print("   c'est le Service Worker qui bloque. Faites Ctrl+Shift+R")
