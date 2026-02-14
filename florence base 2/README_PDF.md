# 📄 Analyse de PDF OTDR

Script Python pour extraire et analyser les données des rapports OTDR (PDF).

## 🚀 Installation

```bash
pip install -r requirements_pdf.txt
```

## 📖 Utilisation

### Analyse simple d'un PDF

```bash
python analyze_pdf.py rapport_otdr.pdf
```

### Utilisation dans du code Python

```python
from analyze_pdf import extract_otdr_data, analyze_otdr_quality

# Extraire les données
data = extract_otdr_data("rapport_otdr.pdf")

# Analyser la qualité
quality = analyze_otdr_quality(data)

print(f"Score: {quality['score']}/10")
print(f"Statut: {quality['status']}")
```

## 📊 Données extraites

Le script extrait automatiquement:

- **Métadonnées**: Nombre de pages, créateur, date
- **Texte complet**: Contenu textuel de chaque page
- **Tableaux**: Extraction automatique des tableaux
- **Données techniques OTDR**:
  - Longueur de fibre (km)
  - Longueur d'onde (nm)
  - Atténuation totale (dB)
  - Réflectance (dB)
  - Événements (distance, perte)
  - Date du test
  - Opérateur/Technicien

## ⭐ Analyse de qualité

Le script attribue un **score de 0 à 10** basé sur:

- ✅ Présence des données essentielles (longueur, atténuation, etc.)
- ✅ Nombre d'événements détectés
- ✅ Présence de tableaux
- ✅ Complétude du rapport

**Statuts:**
- 8-10: Excellent ✅
- 6-7.9: Bon ✔️
- 4-5.9: Moyen ⚠️
- 0-3.9: Faible ❌

## 📤 Format de sortie

Le résultat est sauvegardé en JSON:

```json
{
  "extraction": {
    "file_name": "otdr_report.pdf",
    "metadata": {
      "num_pages": 3,
      "creator": "OTDR Software"
    },
    "technical_data": {
      "fiber_length": "2.45",
      "wavelength": "1550",
      "attenuation": "0.85",
      "events": [
        {"distance_km": "0.5", "loss_db": "0.15"},
        {"distance_km": "1.2", "loss_db": "0.25"}
      ]
    }
  },
  "quality": {
    "score": 8.5,
    "status": "excellent",
    "issues": [],
    "recommendations": []
  }
}
```

## 🔗 Intégration avec n8n

Pour utiliser dans un workflow n8n:

1. **Node "Execute Command"** ou **"Python"**
   ```bash
   python analyze_pdf.py {{ $binary.data }}
   ```

2. **Node "Read Binary File"** → télécharger le PDF depuis Supabase Storage

3. **Node "Code"** → Parser le JSON de sortie

4. **Node "Supabase"** → Enregistrer le résultat dans la base

## 📝 Exemples

### Exemple 1: Analyse basique
```bash
python analyze_pdf.py test_otdr.pdf
```

### Exemple 2: Analyse et score uniquement
```python
from analyze_pdf import extract_otdr_data, analyze_otdr_quality

data = extract_otdr_data("rapport.pdf")
quality = analyze_otdr_quality(data)

if quality["score"] < 6:
    print("⚠️ Rapport incomplet - demander un nouveau test")
else:
    print("✅ Rapport valide")
```

## 🛠️ Personnalisation

### Ajouter d'autres patterns d'extraction

Dans la fonction `extract_technical_info()`:

```python
patterns = {
    # Ajouter vos propres patterns
    "fiber_type": r"(?:Fiber Type|Type)[:\s]+([A-Z0-9/]+)",
    "ior": r"(?:IOR|Index)[:\s]+([0-9.]+)",
}
```

### Modifier les critères de qualité

Dans la fonction `analyze_otdr_quality()`:

```python
# Ajouter vos propres vérifications
if not tech_data.get("fiber_type"):
    quality_score -= 1
    issues.append("Type de fibre non spécifié")
```

## ⚙️ Configuration avancée

### Extraction d'images du PDF

```python
import pdfplumber
from PIL import Image

with pdfplumber.open("rapport.pdf") as pdf:
    page = pdf.pages[0]
    # Extraire les images
    for img_idx, img in enumerate(page.images):
        # Traiter l'image
        pass
```

### Export vers Excel

```python
import pandas as pd

# Convertir les tableaux en DataFrame
for table in data["tables"]:
    df = pd.DataFrame(table["data"][1:], columns=table["data"][0])
    df.to_excel(f"table_page_{table['page']}.xlsx")
```

## 🐛 Dépannage

**Erreur: "No module named 'pdfplumber'"**
```bash
pip install pdfplumber
```

**PDF vide ou illisible**
- Vérifier que le PDF n'est pas protégé par mot de passe
- Essayer avec un autre outil: PyPDF2, pdfminer.six

**Tableaux non détectés**
- Ajuster les paramètres de `extract_tables()`
- Utiliser `extract_table()` avec settings personnalisés

## 📚 Ressources

- [Documentation pdfplumber](https://github.com/jsvine/pdfplumber)
- [Guide OTDR](https://www.fibertestequipment.com/otdr-basics)
