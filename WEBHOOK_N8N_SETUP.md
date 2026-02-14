# 🔐 Configuration Webhooks n8n (Backend Sécurisé)

## Vue d'ensemble

Ce système permet d'envoyer des fichiers (PDFs OTDR et photos spéciales) vers des webhooks n8n **sans exposer les URLs dans le code frontend**. Les URLs sont stockées côté serveur dans les variables d'environnement.

## Architecture

```
Frontend (details_intervention.html)
    ↓
Backend API (/api/upload-otdr, /api/upload-special-photo)
    ↓
Webhooks n8n (URLs sécurisées)
    ↓
Traitement IA / Stockage
```

## Configuration

### 1. Variables d'environnement (.env)

Créez un fichier `.env` à la racine du projet :

```env
# Webhooks n8n (NE PAS COMMITTER ce fichier)
N8N_WEBHOOK_OTDR_URL=https://votre-instance-n8n.com/webhook/otdr-upload
N8N_WEBHOOK_SPECIAL_PHOTOS_URL=https://votre-instance-n8n.com/webhook/special-photos
N8N_WEBHOOK_AUTH=Bearer votre_token_secret
```

### 2. Installation des dépendances

```bash
npm install express multer node-fetch form-data dotenv
```

### 3. Intégration dans votre serveur

Dans votre fichier serveur principal (ex: `server.js` ou `app.js`) :

```javascript
const express = require('express');
const webhookHandler = require('./api/webhook-handler');

const app = express();

// Routes API
app.use('/api', webhookHandler);

// Servir les fichiers statiques
app.use(express.static('public'));

app.listen(3000, () => {
    console.log('Serveur démarré sur le port 3000');
});
```

## Endpoints API

### POST /api/upload-otdr

Envoie un fichier PDF OTDR vers le webhook n8n.

**Body (multipart/form-data):**
- `file` : Fichier PDF
- `otdr_number` : Numéro de la mesure (1-4)
- `intervention_id` : ID de l'intervention
- `employee_id` : ID de l'employé
- `timestamp` : Horodatage

**Response:**
```json
{
  "success": true,
  "message": "OTDR envoyé avec succès",
  "data": { ... }
}
```

### POST /api/upload-special-photo

Envoie une photo spéciale (OTDR sur fibre active / Routeur OK) vers le webhook n8n.

**Body (multipart/form-data):**
- `file` : Image
- `photo_id` : ID de la photo
- `photo_type` : Type (otdr_active / routeur)
- `intervention_id` : ID de l'intervention
- `employee_id` : ID de l'employé
- `timestamp` : Horodatage

**Response:**
```json
{
  "success": true,
  "message": "Photo spéciale envoyée avec succès",
  "ai_score": 8.5,
  "ai_comment": "Excellente qualité...",
  "data": { ... }
}
```

## Configuration n8n

### Webhook 1 : OTDR Upload

1. Créez un nouveau workflow dans n8n
2. Ajoutez un node "Webhook" avec :
   - Method: POST
   - Path: /otdr-upload
   - Response: JSON
3. Configurez l'authentification si nécessaire
4. Ajoutez les nodes de traitement (stockage, notifications, etc.)

### Webhook 2 : Special Photos

1. Créez un nouveau workflow dans n8n
2. Ajoutez un node "Webhook" avec :
   - Method: POST
   - Path: /special-photos
   - Response: JSON avec `ai_score` et `ai_comment`
3. Intégrez l'analyse IA (Florence-2 ou autre)
4. Retournez la note dans la réponse :

```json
{
  "ai_score": 8.5,
  "ai_comment": "Photo de bonne qualité, tous les éléments visibles"
}
```

## Sécurité

✅ **Les URLs des webhooks ne sont JAMAIS exposées au frontend**
✅ **Les tokens d'authentification sont stockés côté serveur**
✅ **Validation des fichiers (type, taille)**
✅ **Gestion des erreurs sans révéler d'informations sensibles**

## Photos renommées

- **Photo 10** : "Box Installée" → "OTDR sur Fibre Active"
- **Photo 11** : "Signature Client" → "Routeur OK"

Ces 2 photos sont automatiquement envoyées au webhook spécial après upload.

## Tableau des notes IA

Une table s'affiche automatiquement dans l'interface mobile avec :
- Nom de la photo
- Note IA (sur 10)
- Statut coloré (Excellent / Bon / Moyen / Faible)

Les notes sont mises à jour en temps réel après l'analyse IA.

## Développement local

Pour tester localement avec ngrok :

```bash
# Démarrer ngrok
ngrok http 3000

# Utiliser l'URL ngrok dans n8n
https://xxxx-xx-xx-xxx-xxx.ngrok.io/webhook/...
```

## Production

En production, utilisez :
- HTTPS obligatoire
- Authentification par token
- Rate limiting
- Logs sécurisés
- Variables d'environnement via votre hébergeur (Vercel, Heroku, etc.)
