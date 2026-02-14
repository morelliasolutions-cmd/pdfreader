"""
Script de debug pour voir la structure brute des tables PDF
"""

import pdfplumber
import json
import sys

if len(sys.argv) < 2:
    print("Usage: python debug_pdf_table.py <pdf_path>")
    sys.exit(1)

pdf_path = sys.argv[1]

with pdfplumber.open(pdf_path) as pdf:
    page = pdf.pages[0]
    tables = page.extract_tables()
    
    print(f"\n=== DEBUG: {len(tables)} table(s) trouvée(s) ===\n")
    
    for table_idx, table in enumerate(tables):
        print(f"--- TABLE {table_idx + 1} ({len(table)} lignes) ---\n")
        
        for row_idx, row in enumerate(table):
            print(f"Ligne {row_idx}:")
            for col_idx, cell in enumerate(row):
                print(f"  Col {col_idx}: {repr(cell)}")
            print()
