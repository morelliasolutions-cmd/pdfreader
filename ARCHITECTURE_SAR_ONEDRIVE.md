# Architecture Sécurisée SAR → OneDrive

## Vue d'ensemble

Cette architecture respecte **AGENTS.md** en gardant les secrets côté backend et en utilisant un **proxy sécurisé** pour communiquer avec n8n.

```
┌─────────────┐
│  Frontend   │  mandats.html
│  (Browser)  │  
└──────┬──────┘
       │ 1. Upload PDF
       ▼
┌─────────────┐
│  Backend    │  extract_sar_address.py (Flask)
│  Python     │  Port 5001
└──────┬──────┘
       │ 2. Extraction pdfplumber
       ▼
┌─────────────┐
│  Frontend   │  Affiche résultats + bouton "Enregistrer"
└──────┬──────┘
       │ 3. Clic "Enregistrer sur OneDrive"
       ▼
┌─────────────┐
│  Backend    │  /api/save-sar (PROXY SÉCURISÉ)
│  Python     │  Ajoute JWT depuis .env
└──────┬──────┘
       │ 4. POST avec JWT Bearer
       ▼
┌─────────────┐
│  Webhook    │  n8n - velox-n8n.yhmr4j.easypanel.host
│  n8n        │  Vérifie JWT
└──────┬──────┘
       │ 5. Sauvegarde fichier
       ▼
┌─────────────┐
│  OneDrive   │  Fichier archivé avec métadonnées
└─────────────┘
```

---

## 🔐 Sécurité

### ✅ Ce qui est SÉCURISÉ

- **Webhook URL** : Stockée uniquement dans `.env` backend
- **JWT Secret** : Stocké uniquement dans `.env` backend
- **Backend agit comme proxy** : Le frontend n'a jamais accès aux secrets
- **CORS configuré** : Seules les origines autorisées peuvent appeler l'API
- **JWT Bearer Auth** : Ajouté automatiquement par le backend

### ❌ Ce qui N'EST PAS exposé

- Les credentials n8n ne sont **JAMAIS** visibles dans le navigateur
- Pas de secrets dans le code JavaScript
- Pas de secrets dans les DevTools
- Conforme à AGENTS.md : **"La sécurité est gérée par le backend, jamais par le frontend seul"**

---

## 📁 Fichiers modifiés

### 1. Backend : `extract_sar_address.py`

**Nouvel endpoint** : `/api/save-sar`

```python
@app.route('/api/save-sar', methods=['POST'])
def save_sar_to_onedrive():
    """
    Endpoint PROXY sécurisé vers n8n
    - Reçoit : données JSON + fichier PDF
    - Ajoute : JWT depuis .env
    - Envoie : vers webhook n8n de manière sécurisée
    """
```

**Fonctionnalités** :
- Lit `N8N_WEBHOOK_SAR_ADDRESS_URL` et `N8N_WEBHOOK_SAR_SECRET` depuis `.env`
- Ajoute automatiquement `Authorization: Bearer {JWT}` dans les headers
- Transmet le PDF + métadonnées à n8n
- Gère les erreurs et timeouts

### 2. Frontend : `mandats.html`

**Variable globale** :
```javascript
let sarFilesData = new Map(); // Stocke fichiers + données extraites
```

**Fonction modifiée** : `handleSarPdfFiles()`
- Stocke les fichiers originaux avec leurs données extraites
- Permet l'envoi ultérieur vers OneDrive

**Fonction ajoutée** : `saveSarToOneDrive(filename)`
```javascript
async function saveSarToOneDrive(filename) {
    // 1. Récupère le fichier et les données depuis sarFilesData
    // 2. Crée FormData avec PDF + données JSON
    // 3. Envoie vers /api/save-sar (backend proxy)
    // 4. Backend gère l'authentification n8n
}
```

**UI ajoutée** :
- Bouton "Enregistrer sur OneDrive" pour chaque fichier extrait avec succès
- États visuels : initial → loading → success/error
- Désactive le bouton après succès (évite les doublons)

### 3. Configuration : `.env`

**Variables ajoutées** :
```bash
# Service d'extraction SAR
SAR_EXTRACTION_PORT=5001
SAR_EXTRACTION_HOST=0.0.0.0
SAR_EXTRACTION_DEBUG=True
SAR_EXTRACTION_PUBLIC_URL=http://localhost:5001

# Webhooks N8N (🔐 SECRETS)
N8N_WEBHOOK_SAR_ADDRESS_URL=https://velox-n8n.yhmr4j.easypanel.host/webhook-test/sar-address-extraction
N8N_WEBHOOK_SAR_SECRET=test-jwt-secret-32-chars-minimum-required

# CORS
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080

# Limites
MAX_UPLOAD_SIZE_MB=50
EXTRACTION_TIMEOUT_SECONDS=60
```

⚠️ **IMPORTANT** : Le fichier `.env` est dans `.gitignore` - NE JAMAIS commit les secrets !

---

## 🚀 Utilisation

### 1. Démarrer le serveur Python

```powershell
.venv\Scripts\python.exe extract_sar_address.py
```

Logs attendus :
```
🔧 Configuration chargée depuis .env
   Port: 5001
   Webhook configuré: Oui
🚀 Démarrage du serveur d'extraction SAR
```

### 2. Ouvrir mandats.html

1. Glisser-déposer un ou plusieurs fichiers SAR.pdf dans la zone bleue
2. Attendre l'extraction automatique
3. Vérifier les résultats affichés (adresse, NPA, commune)
4. Cliquer sur "Enregistrer sur OneDrive" pour chaque fichier
5. Le fichier est envoyé au backend → n8n → OneDrive avec JWT

### 3. Flow complet

```
1. Drag & drop SAR.pdf
   ↓ (Frontend → Backend)
2. Extraction pdfplumber
   ↓ (Backend → Frontend)
3. Affichage résultats + bouton
   ↓ (User clic)
4. saveSarToOneDrive()
   ↓ (Frontend → Backend /api/save-sar)
5. Backend ajoute JWT
   ↓ (Backend → n8n webhook)
6. n8n vérifie JWT
   ↓ (n8n → OneDrive)
7. Fichier archivé ✅
```

---

## 🧪 Tests

### Test extraction seule

```powershell
# Créer un PDF de test
python test_sar_extraction.py
```

### Test endpoint /api/health

```powershell
Invoke-RestMethod -Uri http://localhost:5001/api/health
```

### Test endpoint /api/config

```powershell
Invoke-RestMethod -Uri http://localhost:5001/api/config | ConvertTo-Json
```

Vérifier que `webhook_configured: true`

### Test extraction avec curl (sans frontend)

```powershell
curl -X POST http://localhost:5001/api/extract-sar-address `
  -F "pdfs=@sar.pdf"
```

---

## 📦 Dépendances

Toutes les dépendances sont dans `requirements.txt` :

```
flask==3.0.0
flask-cors==4.0.0
pdfplumber==0.11.1
requests==2.31.0
python-dotenv==1.0.0
```

Installation :
```powershell
.venv\Scripts\pip install -r requirements.txt
```

---

## 🔧 Production

### Variables à configurer sur le VPS

1. Copier `.env.example` → `.env`
2. Modifier :
   - `SAR_EXTRACTION_PUBLIC_URL` → URL publique du service
   - `N8N_WEBHOOK_SAR_ADDRESS_URL` → URL réelle du webhook n8n
   - `N8N_WEBHOOK_SAR_SECRET` → JWT secret réel (min 32 chars)
   - `ALLOWED_ORIGINS` → Domaines autorisés en production
   - `SAR_EXTRACTION_DEBUG=False` pour prod

### Déploiement

Utiliser les fichiers fournis :
- `deploy-sar-extraction.sh` : Script de déploiement
- `sar-extraction.service` : Service systemd
- `nginx-sar-extraction.conf` : Configuration Nginx

---

## 📚 Documentation

- **AGENTS.md** : Règles de sécurité du projet
- **SECURITY_SECRETS_GUIDE.md** : Guide complet de gestion des secrets
- **.env.example** : Template de configuration

---

## ✅ Checklist sécurité

- [x] Secrets uniquement dans `.env` backend
- [x] `.env` dans `.gitignore`
- [x] Backend agit comme proxy (pas d'exposition des secrets)
- [x] JWT ajouté automatiquement par le backend
- [x] CORS configuré
- [x] Gestion des erreurs
- [x] Timeouts configurés
- [x] Logging sans exposition de secrets
- [x] Tests passants

---

## 🎯 Avantages de cette architecture

1. **Sécurité maximale** : Zéro exposition des secrets côté client
2. **Évolutivité** : Facile d'ajouter d'autres webhooks/endpoints
3. **Maintenabilité** : Séparation claire frontend/backend
4. **Conformité AGENTS.md** : Respect total des règles de sécurité
5. **Testabilité** : Chaque composant peut être testé indépendamment

---

**Date de création** : 2026-02-14  
**Version** : 1.0.0  
**Conforme à** : AGENTS.md  
**Auteur** : ConnectFiber / Morellia
