# 🚀 Démarrage Rapide - Extraction SAR

## ✅ Ce qui a été fait

### 1. **Zone de drag & drop ajoutée dans mandats.html**
   - Zone bleue distinctive en haut de la section "Import Zones"
   - Support multi-fichiers PDF
   - Affichage des résultats d'extraction
   - Envoi automatique vers webhook n8n

### 2. **Service Python d'extraction (extract_sar_address.py)**
   - Utilise pdfplumber pour lire les PDF
   - Extrait : Adresse, NPA, Commune
   - Endpoint API REST sur le port 5001
   - Logs détaillés pour debugging

### 3. **Scripts et documentation**
   - `start-sar-extraction-service.ps1` : Démarrage automatique du service
   - `test_sar_extraction.py` : Tests automatisés
   - `SAR_EXTRACTION_README.md` : Documentation complète
   - `sar_extraction.config` : Configuration personnalisable

---

## 🎯 Comment utiliser

### Étape 1 : Démarrer le service Python

**Option A - Script PowerShell (recommandé)** :
```powershell
.\start-sar-extraction-service.ps1
```

**Option B - Commande directe** :
```powershell
python extract_sar_address.py
```

Le serveur démarre sur `http://localhost:5001`

### Étape 2 : Ouvrir mandats.html

1. Ouvrir `mandats.html` dans un navigateur
2. Localiser la zone bleue **"📍 Extraction d'adresse SAR"**
3. Glisser-déposer vos fichiers SAR.pdf
4. Les résultats s'affichent automatiquement
5. Les données sont envoyées au webhook n8n

---

## 📊 Format des données extraites

### Entrée (PDF)
```
Libellé d'adresse :
av. du Simplon 4A
1870 Monthey
```

### Sortie (JSON)
```json
{
  "address": "av. du Simplon 4A",
  "npa": "1870",
  "commune": "Monthey"
}
```

### Webhook (envoyé à n8n)
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

---

## 🧪 Tester l'installation

### Test 1 : Service en ligne ?
```bash
curl http://localhost:5001/api/health
```

Réponse attendue :
```json
{"status": "healthy", "service": "SAR Address Extraction", "version": "1.0.0"}
```

### Test 2 : Extraction automatique
```powershell
python test_sar_extraction.py
```

Ce script :
- ✅ Vérifie que le service est actif
- 📄 Crée un PDF de test
- 🔍 Teste l'extraction
- ✅ Valide les résultats

---

## ⚙️ Configuration du webhook

Par défaut, les données sont envoyées vers :
```
https://velox-n8n.yhmr4j.easypanel.host/webhook-test/sar-address-extraction
```

### Modifier l'URL du webhook

Dans `mandats.html`, chercher :
```javascript
const WEBHOOK_URL = 'https://velox-n8n.yhmr4j.easypanel.host/webhook-test/sar-address-extraction';
```

Remplacer par votre URL n8n :
```javascript
const WEBHOOK_URL = 'https://votre-n8n.com/webhook/mon-workflow';
```

---

## 🔍 Dépendances requises

Vérifier que ces packages Python sont installés :
```bash
pip install flask flask-cors pdfplumber
```

Pour les tests :
```bash
pip install reportlab requests
```

Ou installer tout d'un coup :
```bash
pip install -r requirements.txt
```

---

## 🛠️ Résolution de problèmes

### Problème : "Impossible de contacter le serveur"
**Solution** : Vérifier que le service Python est démarré
```powershell
python extract_sar_address.py
```

### Problème : "Pattern 'Libellé d'adresse' introuvable"
**Solution** : Vérifier le format du PDF
- Le texte doit contenir exactement "Libellé d'adresse :"
- L'adresse doit être sur la ligne suivante
- Le NPA et la commune sur la ligne d'après

### Problème : "Port 5001 déjà utilisé"
**Solution** : Modifier le port dans `extract_sar_address.py`
```python
app.run(host='0.0.0.0', port=5002, debug=True)  # Port 5002 au lieu de 5001
```

Et dans `mandats.html` :
```javascript
const response = await fetch('http://localhost:5002/api/extract-sar-address', {
```

---

## 📁 Fichiers créés/modifiés

| Fichier | Description |
|---------|-------------|
| `mandats.html` | ✏️ Modifié - Ajout zone drag & drop SAR |
| `extract_sar_address.py` | ✨ Nouveau - Service d'extraction |
| `start-sar-extraction-service.ps1` | ✨ Nouveau - Script de démarrage |
| `test_sar_extraction.py` | ✨ Nouveau - Tests automatisés |
| `SAR_EXTRACTION_README.md` | ✨ Nouveau - Documentation détaillée |
| `sar_extraction.config` | ✨ Nouveau - Configuration |
| `SAR_QUICKSTART.md` | ✨ Nouveau - Ce fichier |

---

## 🔒 Sécurité (Conformité AGENTS.md)

✅ **Conformes aux règles de sécurité** :
- ✅ Pas de données sensibles stockées
- ✅ Traitement en mémoire uniquement
- ✅ Pas de clés exposées côté client
- ✅ CORS configuré correctement
- ✅ Logs sans données sensibles
- ✅ Validation des entrées

---

## 📞 Support

- **Documentation complète** : [SAR_EXTRACTION_README.md](SAR_EXTRACTION_README.md)
- **Règles du projet** : [AGENTS.md](AGENTS.md)
- **Logs du serveur** : Consulter la console Python

---

## 🎉 Prêt à utiliser !

1. ✅ Service Python démarré
2. ✅ mandats.html ouvert
3. ✅ Glisser-déposer un SAR.pdf
4. ✅ Voir les résultats
5. ✅ Données envoyées au webhook

**Bonne extraction ! 🚀**
