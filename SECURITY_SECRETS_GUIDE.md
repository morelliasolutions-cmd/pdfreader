# 🔒 Guide de Sécurité - Gestion des Secrets

## 📋 Vue d'ensemble

Ce guide explique comment gérer de manière sécurisée les secrets (webhooks, JWT, API keys) dans le projet ConnectFiber, **conforme à AGENTS.md**.

---

## ✅ Principes de sécurité (AGENTS.md)

### ❌ **NE JAMAIS** :
- Exposer de clés privées Supabase
- Coder des secrets en dur dans le code
- Commit un fichier `.env` sur GitHub
- Exposer des secrets côté client (JavaScript frontend)
- Faire confiance aux données envoyées depuis le frontend

### ✅ **TOUJOURS** :
- Utiliser des variables d'environnement
- Vérifier `auth.uid()` dans les policies SQL
- Activer RLS sur toutes les tables
- Gérer la sécurité côté backend/SQL
- Stocker les secrets dans `.env`

---

## 🗂️ Structure des secrets

```
.
├── .env                    ← Vos VRAIES valeurs (JAMAIS sur GitHub)
├── .env.example            ← Modèle avec valeurs d'exemple (SAFE pour GitHub)
├── .gitignore              ← Contient .env pour éviter les commits accidentels
└── js/webhook-config.js    ← Récupère config depuis backend (pas de secrets)
```

---

## 🔐 Fichier .env

### Créer votre fichier .env

```bash
# 1. Copier le modèle
cp .env.example .env

# 2. Éditer avec vos vraies valeurs
# Utiliser un éditeur de texte, PAS de commit Git

# 3. Vérifier que .env est dans .gitignore
cat .gitignore | grep .env
```

### Exemple de .env (VOS valeurs réelles)

```bash
############
# ConnectFiber - Service d'extraction SAR
############

SAR_EXTRACTION_PORT=5001
SAR_EXTRACTION_HOST=0.0.0.0
SAR_EXTRACTION_DEBUG=False
SAR_EXTRACTION_PUBLIC_URL=https://sar-extraction.yhmr4j.easypanel.host

############
# ConnectFiber - Webhooks N8N
############

# Webhook pour archivage PDF mandats Swisscom
N8N_WEBHOOK_ARCHIVE_URL=https://velox-n8n.yhmr4j.easypanel.host/webhook-test/b590df38-6d6b-47c6-9abc-5c4d554a6e00
N8N_WEBHOOK_ARCHIVE_SECRET=VotreVraiSecretJWT-Min32Caracteres-Changez-Moi!

# Webhook pour extraction adresses SAR
N8N_WEBHOOK_SAR_ADDRESS_URL=https://velox-n8n.yhmr4j.easypanel.host/webhook-test/sar-address-extraction
N8N_WEBHOOK_SAR_SECRET=VotreAutreSecretJWT-Min32Caracteres-Unique!

# CORS : Origines autorisées (domaines séparés par virgules)
ALLOWED_ORIGINS=https://connectfiber.yhmr4j.easypanel.host,https://app.connectfiber.com

# Limites
MAX_UPLOAD_SIZE_MB=50
EXTRACTION_TIMEOUT_SECONDS=60
```

---

## 🔑 Générer des secrets sécurisés

### Secret JWT (min 32 caractères)

```bash
# Linux / macOS / Git Bash
openssl rand -base64 32

# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### UUID (pour webhooks)

```bash
# PowerShell
[guid]::NewGuid().ToString()

# Python
python -c "import uuid; print(uuid.uuid4())"

# Linux
uuidgen
```

---

## 🚀 Utilisation en production

### Backend Python (extract_sar_address.py)

```python
from dotenv import load_dotenv
import os

# Charger .env au démarrage
load_dotenv()

# Récupérer les secrets
WEBHOOK_URL = os.getenv('N8N_WEBHOOK_SAR_ADDRESS_URL', '')
WEBHOOK_SECRET = os.getenv('N8N_WEBHOOK_SAR_SECRET', '')

# ✅ Les secrets ne sont JAMAIS exposés via l'API
# ✅ Le backend gère l'authentification webhook
```

### Frontend JavaScript (mandats.html)

```javascript
// ✅ Récupérer la config depuis le backend
const apiUrl = getSarExtractionUrl(); // Depuis webhook-config.js

// ❌ NE JAMAIS faire ça :
// const secret = 'mon-secret-jwt'; // INTERDIT !
// const webhook = 'https://...'; // URL en dur = mauvaise pratique

// ✅ Le backend gère les webhooks
// Le frontend ne fait QUE appeler l'API publique
fetch(apiUrl, { method: 'POST', body: formData });
```

---

## 🛡️ Sécurité par couche

### Couche 1 : Base de données (PostgreSQL + RLS)

```sql
-- ✅ RLS activé sur toutes les tables
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- ✅ Policy basée sur auth.uid()
CREATE POLICY "users_own_data" ON appointments
  FOR ALL USING (user_id = auth.uid());
```

### Couche 2 : Backend (Python/Flask)

```python
# ✅ Variables d'environnement
load_dotenv()

# ✅ CORS restreint
CORS(app, origins=os.getenv('ALLOWED_ORIGINS').split(','))

# ✅ Validation des entrées
if not files or len(files) == 0:
    return jsonify({'error': 'No files'}), 400

# ✅ Authentification webhook (JWT)
token = jwt.encode({'data': payload}, WEBHOOK_SECRET)
```

### Couche 3 : Frontend (JavaScript)

```javascript
// ✅ Récupération config depuis backend
await loadWebhookConfig();

// ✅ Appel API avec URL dynamique
const url = getSarExtractionUrl();

// ❌ Aucun secret en dur
// ❌ Aucune logique métier sensible
// ❌ Aucune confiance dans les données client
```

---

## 📋 Checklist de sécurité

### Avant de commiter

- [ ] Fichier `.env` dans `.gitignore`
- [ ] Aucun secret en dur dans le code
- [ ] `.env.example` à jour avec valeurs d'exemple
- [ ] Pas de `console.log()` exposant des secrets
- [ ] Pas de commentaires contenant des secrets

### Avant le déploiement

- [ ] Créer `.env` sur le serveur avec vraies valeurs
- [ ] Secrets JWT avec min 32 caractères aléatoires
- [ ] CORS configuré avec domaines spécifiques
- [ ] SSL/TLS activé (HTTPS)
- [ ] Logs ne contiennent pas de secrets
- [ ] Permissions fichiers correctes (`chmod 600 .env`)

### Après le déploiement

- [ ] Tester l'endpoint `/api/config` (ne doit pas exposer de secrets)
- [ ] Vérifier que les webhooks fonctionnent
- [ ] Monitorer les logs pour erreurs d'auth
- [ ] Rotation des secrets (tous les 90 jours recommandé)

---

## 🔄 Rotation des secrets

### Quand changer les secrets ?

- **Immédiatement** : Si un secret est exposé (commit accidentel, leak)
- **Régulièrement** : Tous les 90 jours (bonne pratique)
- **Après un départ** : Si un membre de l'équipe quitte le projet

### Comment changer les secrets ?

```bash
# 1. Générer de nouveaux secrets
NEW_SECRET=$(openssl rand -base64 32)

# 2. Mettre à jour .env LOCAL
echo "N8N_WEBHOOK_SAR_SECRET=$NEW_SECRET" >> .env

# 3. Mettre à jour .env sur le VPS
ssh user@vps "echo 'N8N_WEBHOOK_SAR_SECRET=$NEW_SECRET' >> /opt/connectfiber-sar/.env"

# 4. Redémarrer le service
ssh user@vps "sudo systemctl restart sar-extraction"

# 5. Mettre à jour le webhook n8n avec le nouveau secret
```

---

## 🚨 En cas de fuite de secret

### Actions immédiates

```bash
# 1. Changer TOUS les secrets immédiatement

# 2. Révoquer les anciens secrets dans n8n

# 3. Vérifier les logs pour accès non autorisés

# 4. Si commit Git exposé :
# Supprimer le commit de l'historique (dangereux !)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Forcer le push (écrase l'historique)
git push origin --force --all
```

### Prévention

- Utiliser des pre-commit hooks pour détecter les secrets
- Scanner le repo régulièrement avec `git-secrets` ou `trufflehog`
- Former l'équipe aux bonnes pratiques

---

## 📚 Ressources

- [12-Factor App - Config](https://12factor.net/config)
- [OWASP - Key Management](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
- [GitHub - Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

---

## 🆘 Support

En cas de doute sur la sécurité :
1. Consulter AGENTS.md
2. Privilégier la sécurité côté backend/SQL
3. Ne JAMAIS exposer de secrets côté client
4. Demander une revue de code avant déploiement

---

**🔒 La sécurité n'est pas une option, c'est une nécessité !**
