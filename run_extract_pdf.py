import json
import sys
from app import extract_pdf_data

p = sys.argv[1] if len(sys.argv) > 1 else 'pdfexport.pdf'
try:
    d=extract_pdf_data(p)
    print(json.dumps(d,indent=2,ensure_ascii=False))
except Exception as e:
    print('ERROR', e)
