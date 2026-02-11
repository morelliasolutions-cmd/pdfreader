#!/usr/bin/env python3
"""Test l'API en mode batch (plusieurs PDFs)"""

import requests
import sys

if len(sys.argv) < 2:
    print("Usage: python test_api_batch.py pdf1.pdf pdf2.pdf ...")
    sys.exit(1)

# Préparer les fichiers
files = []
for pdf_path in sys.argv[1:]:
    files.append(('pdfs', (pdf_path, open(pdf_path, 'rb'), 'application/pdf')))

print(f"Envoi de {len(files)} PDF(s) à l'API...")

try:
    response = requests.post(
        'http://localhost:8765/api/analyze-pdf',
        files=files,
        timeout=30
    )
    
    # Fermer les fichiers
    for _, (_, f, _) in files:
        f.close()
    
    print(f"Status: {response.status_code}")
    print(f"Response:")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success: {data.get('success')}")
        print(f"📊 Count: {data.get('count')}")
        print(f"\nRésultats:")
        for result in data.get('results', []):
            print(f"\n  📄 {result['file_name']}")
            print(f"     Success: {result['success']}")
            if result['success']:
                d = result['data']
                print(f"     Mandat: {d.get('mandate_number')}")
                print(f"     Client: {d.get('client_name')}")
                print(f"     Phone: {d.get('phone')}")
                print(f"     Email: {d.get('email')}")
                print(f"     Socket: {d.get('socket_label')}")
                print(f"     Cable: {d.get('cable')}")
                print(f"     Fibres: SP1={d.get('fiber_1')}, SP2={d.get('fiber_2')}, SP3={d.get('fiber_3')}, SP4={d.get('fiber_4')}")
    else:
        print(response.text)
        
except Exception as e:
    print(f"❌ Erreur: {e}")
    # Fermer les fichiers en cas d'erreur
    for _, (_, f, _) in files:
        f.close()
