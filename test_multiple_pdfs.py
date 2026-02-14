import requests
import glob
import time

# Test avec plusieurs PDFs pour vérifier les timeouts
api_url = "https://velox-pdfswisscom.yhmr4j.easypanel.host/api/analyze-pdf"

pdf_files = glob.glob('*.pdf')[:5]  # Prendre 5 PDFs max pour le test

if not pdf_files:
    print("❌ Aucun PDF trouvé")
    exit(1)

print("🧪 Test de timeout avec plusieurs PDFs")
print("="*70)
print(f"📄 PDFs à traiter: {len(pdf_files)}")
for pdf in pdf_files:
    print(f"   - {pdf}")
print(f"\n⏱️  Temps estimé: ~{len(pdf_files) * 5}s (5s par PDF avec IA)")
print("="*70)

# Préparer les fichiers
files = []
for pdf in pdf_files:
    with open(pdf, 'rb') as f:
        files.append(('pdfs', (pdf, f.read(), 'application/pdf')))

print(f"\n🚀 Envoi de {len(files)} PDFs à l'API...")
start_time = time.time()

try:
    response = requests.post(api_url, files=files, timeout=300)  # 5 minutes
    elapsed = time.time() - start_time
    
    print(f"✅ Réponse reçue en {elapsed:.2f}s")
    print(f"📊 Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n📈 Résultats:")
        print(f"   - Count: {result.get('count')}")
        print(f"   - Success: {result.get('success')}")
        
        if result.get('results'):
            ai_contributed = sum(1 for r in result['results'] if r.get('extraction_sources', {}).get('ai_contributed'))
            print(f"   - PDFs avec contribution IA: {ai_contributed}/{len(result['results'])}")
            
            print(f"\n📄 Détails par fichier:")
            for r in result['results']:
                sources = r.get('extraction_sources', {})
                ai_fields = sources.get('ai_fields', [])
                confidence = r.get('confidence', 0)
                print(f"   • {r['file_name']}: {confidence*100:.0f}% confiance")
                if ai_fields:
                    print(f"     🤖 IA: {', '.join(ai_fields)}")
    else:
        print(f"❌ Erreur: {response.status_code}")
        print(response.text)
        
except requests.Timeout:
    elapsed = time.time() - start_time
    print(f"⏱️ TIMEOUT après {elapsed:.2f}s")
    print("❌ Le serveur n'a pas répondu dans les 5 minutes")
except Exception as e:
    elapsed = time.time() - start_time
    print(f"❌ Erreur après {elapsed:.2f}s: {e}")

print("\n" + "="*70)
print(f"⏱️  Temps total: {time.time() - start_time:.2f}s")
