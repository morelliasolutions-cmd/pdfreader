# Extraction d'adresse SAR - Documentation

## 📋 Vue d'ensemble

Ce module permet l'extraction automatique d'adresses depuis les fichiers SAR PDF. Il extrait :

- **Adresse** : Rue et numéro (ex: "av. du Simplon 4A")
- **NPA** : Code postal (ex: "1870")
- **Commune** : Ville (ex: "Monthey")

Les données extraites sont ensuite envoyées vers un webhook n8n pour traitement ultérieur.

---

## 🚀 Démarrage rapide

### 1. Installer les dépendances

```bash
pip install -r requirements.txt
```

Les dépendances incluent :
- `flask` : Framework web
- `flask-cors` : Support CORS pour les requêtes cross-origin
- `pdfplumber` : Extraction de texte depuis PDF

### 2. Démarrer le serveur

```bash
python extract_sar_address.py
```

Ou utiliser le script PowerShell :

```powershell
.\start-sar-extraction-service.ps1
```

Le serveur démarre sur `http://localhost:5001`

---

## 🔧 Utilisation

### Interface Web (mandats.html)

1. Ouvrir la page `mandats.html`
2. Localiser la zone bleue **"📍 Extraction d'adresse SAR"** en haut de la section Import Zones
3. Glisser-déposer un ou plusieurs fichiers SAR PDF (ou cliquer pour sélectionner)
4. L'extraction s'effectue automatiquement
5. Les résultats s'affichent sous la zone de dépôt
6. Les données sont envoyées au webhook n8n

### API directe

**Endpoint** : `POST http://localhost:5001/api/extract-sar-address`

**Format** : `multipart/form-data`

**Paramètres** :
- `pdfs` : Un ou plusieurs fichiers PDF (clé répétée pour chaque fichier)

**Exemple avec cURL** :

```bash
curl -X POST http://localhost:5001/api/extract-sar-address \
  -F "pdfs=@sar1.pdf" \
  -F "pdfs=@sar2.pdf"
```

**Réponse** :

```json
{
  "success": true,
  "count": 2,
  "success_count": 2,
  "results": [
    {
      "success": true,
      "file_name": "sar1.pdf",
      "page": 1,
      "data": {
        "address": "av. du Simplon 4A",
        "npa": "1870",
        "commune": "Monthey"
      }
    },
    {
      "success": true,
      "file_name": "sar2.pdf",
      "page": 1,
      "data": {
        "address": "rue de la Gare 15",
        "npa": "1950",
        "commune": "Sion"
      }
    }
  ]
}
```

---

## 📝 Format PDF attendu

Le script recherche le pattern suivant dans le PDF :

```
Libellé d'adresse :
av. du Simplon 4A
1870 Monthey
```

**Important** :
- Le texte "Libellé d'adresse :" doit être présent
- L'adresse est sur la ligne suivante
- Le NPA et la commune sont sur la ligne d'après, séparés par un espace

---

## 🌐 Configuration du webhook

Par défaut, les données extraites sont envoyées vers :

```
https://velox-n8n.yhmr4j.easypanel.host/webhook-test/sar-address-extraction
```

**Format envoyé** :

```json
{
  "timestamp": "2026-02-14T10:30:00.000Z",
  "results": [
    {
      "file_name": "sar.pdf",
      "address": "av. du Simplon 4A",
      "npa": "1870",
      "commune": "Monthey"
    }
  ]
}
```

Pour modifier l'URL du webhook, éditer dans `mandats.html` :

```javascript
const WEBHOOK_URL = 'https://votre-webhook-url';
```

---

## 🛠️ Développement

### Structure du code

```
extract_sar_address.py
├── extract_address_from_sar_pdf()  # Logique d'extraction
├── /api/extract-sar-address         # Endpoint principal
└── /api/health                      # Endpoint de santé
```

### Logs

Le serveur affiche des logs détaillés :

```
2026-02-14 10:30:00 - INFO - 🔄 Nouvelle requête d'extraction SAR
2026-02-14 10:30:00 - INFO - 📥 1 fichier(s) reçu(s)
2026-02-14 10:30:00 - INFO - 📄 Traitement du fichier: sar.pdf
2026-02-14 10:30:00 - INFO -   📖 Analyse de la page 1
2026-02-14 10:30:00 - INFO -   ✅ Pattern trouvé à la ligne 42
2026-02-14 10:30:00 - INFO -   📍 Adresse brute: av. du Simplon 4A
2026-02-14 10:30:00 - INFO -   📍 NPA/Commune brute: 1870 Monthey
2026-02-14 10:30:00 - INFO -   ✅ Extraction réussie: {'address': 'av. du Simplon 4A', 'npa': '1870', 'commune': 'Monthey'}
2026-02-14 10:30:00 - INFO - ✅ Extraction terminée: 1/1 réussies
```

### Gestion des erreurs

Le script gère plusieurs cas d'erreur :

- **Pattern introuvable** : Le texte "Libellé d'adresse" n'est pas dans le PDF
- **Format incorrect** : La ligne NPA/Commune ne correspond pas au pattern attendu
- **PDF illisible** : Le PDF est corrompu ou vide
- **Erreur serveur** : Exception Python non gérée

---

## 🔒 Sécurité (Conformément à AGENTS.md)

✅ **Bonnes pratiques respectées** :

- Le service ne stocke aucune donnée sensible
- Les fichiers PDF sont traités en mémoire uniquement
- Pas de clés API exposées
- CORS configuré pour autoriser uniquement les origines de confiance
- Logs ne contiennent pas d'informations sensibles

---

## 🧪 Tests

### Test manuel avec un fichier exemple

1. Créer un fichier `test_sar.pdf` avec le contenu :
   ```
   Informations du site
   
   Libellé d'adresse :
   av. du Simplon 4A
   1870 Monthey
   
   Autres informations...
   ```

2. Tester avec cURL :
   ```bash
   curl -X POST http://localhost:5001/api/extract-sar-address \
     -F "pdfs=@test_sar.pdf"
   ```

### Test de santé du service

```bash
curl http://localhost:5001/api/health
```

Réponse attendue :
```json
{
  "status": "healthy",
  "service": "SAR Address Extraction",
  "version": "1.0.0"
}
```

---

## 📞 Support

Pour toute question ou problème, consulter :

- **AGENTS.md** : Règles et conventions du projet
- **README.md** : Documentation générale du projet
- **Logs du serveur** : Détails sur les erreurs d'extraction

---

## 📜 Changelog

### Version 1.0.0 (2026-02-14)
- ✨ Extraction automatique d'adresses SAR depuis PDF
- 🔄 Support multi-fichiers
- 🌐 Envoi automatique vers webhook n8n
- 📊 Interface d'affichage des résultats
- 🔍 Logs détaillés pour debugging
