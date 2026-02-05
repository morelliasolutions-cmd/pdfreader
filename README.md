# API d'analyse PDF - ConnectFiber

API Flask pour extraire les données des PDF de mandats Swisscom FTTH.

## 🚀 Déploiement sur EasyPanel

### Configuration

**Build Method:** Dockerfile

**Port:** 5000

**Variables d'environnement:**
- `PORT=5000` (déjà défini dans le Dockerfile)

### Endpoints

- `POST /api/analyze-pdf` - Analyse un ou plusieurs PDF
- `GET /health` - Health check

## 🧪 Test local

```bash
# Installer les dépendances
pip install -r requirements.txt

# Lancer l'API
python app.py

# Tester
curl http://localhost:5000/health
```

## 📦 Données extraites

- `mandate_number` - Numéro du mandat (Disp ID)
- `socket_label` - Référence du socket (B.x.x.x.x)
- `cable` - Nom du câble FTTH
- `fibers_by_cable` - Détail des fibres par câble
- `fiber_1` à `fiber_4` - Positions des fibres (SP1-SP4)
- `phone` - Numéro de téléphone (+41...)
- `email` - Email

## 🔧 Stack technique

- Python 3.11
- Flask 3.0
- pdfplumber 0.11.1
- flask-cors 4.0

## 📄 Licence

Propriétaire - Morellia Solutions
