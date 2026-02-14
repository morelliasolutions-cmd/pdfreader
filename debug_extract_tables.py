import sys
import json
import pdfplumber

def main():
    path = sys.argv[1] if len(sys.argv) > 1 else 'pdfexport.pdf'
    with pdfplumber.open(path) as pdf:
        page = pdf.pages[0]
        text = page.extract_text()
        tables = page.extract_tables()
        print('--- PAGE TEXT ---')
        print(text)
        print('\n--- EXTRACTED TABLES (raw) ---')
        print(json.dumps(tables, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
