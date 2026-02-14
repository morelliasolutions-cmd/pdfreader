import requests

# Test avec un vrai PDF
api_url = "https://velox-pdfswisscom.yhmr4j.easypanel.host/api/analyze-pdf"

print("🧪 Test d'envoi d'un PDF réel à l'API...")
print("="*60)

# Lister les PDFs disponibles
import os
pdf_files = [f for f in os.listdir('.') if f.endswith('.pdf')]
if not pdf_files:
    print("❌ Aucun PDF trouvé dans le dossier")
    exit(1)

print(f"📄 PDFs disponibles: {pdf_files[:5]}")
test_pdf = pdf_files[0]
print(f"📤 Test avec: {test_pdf}")
print()

try:
    with open(test_pdf, 'rb') as f:
        files = {'pdfs': (test_pdf, f, 'application/pdf')}
        
        print("🚀 Envoi du PDF à l'API...")
        response = requests.post(api_url, files=files, timeout=120)
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📝 Headers: {dict(response.headers)}")
        print()
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Succès!")
            print(f"\nRésultat:")
            import json
            print(json.dumps(result, indent=2, ensure_ascii=False))
            
            if result.get('results'):
                for r in result['results']:
                    print(f"\n📄 {r['file_name']}:")
                    if r.get('extraction_sources'):
                        sources = r['extraction_sources']
                        print(f"   🔍 Sources d'extraction:")
                        print(f"      - Traditionnel: {sources.get('traditional')}")
                        print(f"      - IA: {sources.get('ai')}")
                        print(f"      - IA contribution: {sources.get('ai_contributed')}")
                        if sources.get('ai_fields'):
                            print(f"      - Champs IA: {sources.get('ai_fields')}")
        else:
            print(f"❌ Erreur: {response.status_code}")
            print(response.text)
            
except Exception as e:
    print(f"❌ Erreur: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
