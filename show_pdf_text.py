#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script simplifié pour afficher le texte brut d'un PDF
"""

import pdfplumber
import sys
from pathlib import Path

if len(sys.argv) < 2:
    print("Usage: python show_pdf_text.py <pdf_file>")
    sys.exit(1)

pdf_path = sys.argv[1]

print("="*80)
print(f"PDF: {Path(pdf_path).name}")
print("="*80)
print()

with pdfplumber.open(pdf_path) as pdf:
    page = pdf.pages[0]
    
    print(f"Dimensions: {page.width} x {page.height} points")
    print()
    
    full_text = page.extract_text() or ""
    
    print("TEXTE COMPLET:")
    print("-"*80)
    print(full_text)
    print("-"*80)
    print()
    
    # Tableaux
    tables = page.extract_tables()
    print(f"Nombre de tableaux: {len(tables)}")
    print()
    
    if tables:
        for idx, table in enumerate(tables):
            print(f"Tableau #{idx + 1}:")
            print("-"*80)
            for row_idx, row in enumerate(table):
                print(f"Ligne {row_idx + 1}: {row}")
            print()
