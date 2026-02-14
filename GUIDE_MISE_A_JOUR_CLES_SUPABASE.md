# 🔑 Guide: Mise à Jour des Clés Supabase

## 📋 Pourquoi Mettre à Jour les Clés ?

Vous devrez peut-être mettre à jour les clés Supabase dans les cas suivants:
- 🔄 Régénération du `JWT_SECRET` sur votre VPS
- 🆕 Nouvelle installation de Supabase
- 🔒 Rotation de sécurité des clés
- 🐛 Problèmes d'authentification

---

## 🔍 Où Trouver les Clés sur Votre VPS

### Option 1: Via Supabase Studio
1. Accédez à Supabase Studio: `http://78.47.97.137:3001`
2. Connectez-vous avec les identifiants admin
3. Allez dans **Settings** > **API**
4. Copiez:
   - `anon` key (publique)
   - `service_role` key (secrète - NE PAS exposer au frontend)

### Option 2: Via le Fichier de Configuration
Sur votre VPS, consultez le fichier:
```bash
cat /chemin/vers/votre/supabase/.env
```

Cherchez les lignes:
```env
ANON_KEY=eyJhbGci...
SERVICE_ROLE_KEY=eyJhbGci...
```

---

## 📝 Mettre à Jour dans l'Application

### 1. Pour le Frontend (Web + Mobile)

**Fichier à modifier**: `js/config.js`

Modifiez la ligne 15:
```javascript
const SUPABASE_LOCAL_ANON_KEY = 'VOTRE_NOUVELLE_ANON_KEY_ICI';
```

### 2. Pour les Scripts Backend (si applicable)

**Fichiers concernés**:
- `sync-supabase-to-postgres.js`
- `api/*.js` (si des scripts utilisent la SERVICE_ROLE_KEY)

⚠️ **IMPORTANT**: La `SERVICE_ROLE_KEY` ne doit JAMAIS être dans le frontend !

---

## ✅ Checklist après Mise à Jour

- [ ] Vider le cache du navigateur (Ctrl + Shift + Del)
- [ ] Actualiser l'application (Ctrl + F5)
- [ ] Ouvrir la console (F12) et vérifier les erreurs
- [ ] Tester avec `test-supabase.html`
- [ ] Vérifier l'authentification

---

## 🧪 Tester les Nouvelles Clés

### Test 1: Console Navigateur
```javascript
// Dans la console du navigateur
console.log(SUPABASE_ANON_KEY.substring(0, 20) + '...');
```

### Test 2: Page de Test
1. Ouvrez `test-supabase.html`
2. Cliquez sur "🧪 Tester la Connexion"
3. Vérifiez qu'il n'y a pas d'erreur `401 Unauthorized`

### Test 3: Authentification
1. Essayez de vous connecter
2. Vérifiez dans la console qu'il n'y a pas d'erreur JWT

---

## 🔐 Sécurité des Clés

### ANON_KEY (Public Key)
- ✅ Peut être exposée au frontend
- ✅ Permet les requêtes avec RLS (Row Level Security)
- ✅ Limitée par les policies SQL
- 📍 Stockage: `js/config.js`

### SERVICE_ROLE_KEY (Secret Key)
- ⚠️ NE JAMAIS exposer au frontend
- ⚠️ Contourne toutes les règles RLS
- ⚠️ À utiliser UNIQUEMENT côté serveur
- 📍 Stockage: Variables d'environnement serveur uniquement

### JWT_SECRET
- ⚠️ NE JAMAIS exposer
- ⚠️ Utilisé pour signer les tokens
- 📍 Stockage: Configuration Supabase sur VPS uniquement

---

## 🔄 Exemple Complet de Mise à Jour

### Avant:
```javascript
// js/config.js
const SUPABASE_LOCAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...OLD_KEY';
```

### Après:
```javascript
// js/config.js
const SUPABASE_LOCAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...NEW_KEY';
```

### Validation:
1. Sauvegardez le fichier
2. Videz le cache: `Ctrl + Shift + Del`
3. Actualisez: `Ctrl + F5`
4. Testez la connexion

---

## 🆘 Problèmes Courants

### Erreur: "Invalid JWT"
**Cause**: La clé ne correspond pas au JWT_SECRET configuré sur Supabase
**Solution**: 
1. Vérifiez que vous avez copié la bonne clé depuis Studio
2. Vérifiez qu'il n'y a pas d'espaces avant/après la clé
3. Vérifiez que le JWT_SECRET n'a pas changé sur le VPS

### Erreur: "401 Unauthorized"
**Cause**: La clé est expirée ou invalide
**Solution**:
1. Régénérez les clés depuis Supabase Studio
2. Mettez à jour dans `js/config.js`

### Erreur: "CORS policy"
**Cause**: Problème de configuration CORS, pas de clé
**Solution**: Voir `CONFIGURATION_SUPABASE_LOCAL.md` section CORS

---

## 📋 Template de Clés

Pour faciliter la mise à jour, voici un template:

```javascript
// Configuration Supabase Local (VPS)
const SUPABASE_LOCAL_URL = 'http://78.47.97.137:8000';
const SUPABASE_LOCAL_ANON_KEY = 'REMPLACER_PAR_ANON_KEY_DEPUIS_STUDIO';

// ⚠️ NE JAMAIS mettre la SERVICE_ROLE_KEY ici !
// Elle doit rester UNIQUEMENT côté serveur
```

---

## 🔄 Régénérer les Clés (Sur le VPS)

Si vous devez régénérer complètement les clés:

### 1. Générer un nouveau JWT_SECRET
```bash
# Sur votre VPS
openssl rand -hex 64
```

### 2. Mettre à jour le fichier .env
```bash
# Éditer le fichier de configuration
nano /chemin/vers/supabase/.env

# Modifier:
JWT_SECRET=NOUVEAU_SECRET_ICI
```

### 3. Redémarrer Supabase
```bash
docker-compose down
docker-compose up -d
```

### 4. Récupérer les nouvelles clés
- Via Studio: `http://78.47.97.137:3001`
- Settings > API

### 5. Mettre à jour dans l'application
- Copier la nouvelle `ANON_KEY`
- Mettre à jour `js/config.js`

---

## 📚 Ressources

- [Documentation JWT Supabase](https://supabase.com/docs/guides/auth/jwts)
- [Configuration Self-Hosting](https://supabase.com/docs/guides/self-hosting)
- Fichier local: `CONFIGURATION_SUPABASE_LOCAL.md`

---

## ✅ Résumé

| Action | Fichier à Modifier | Type de Clé |
|--------|-------------------|-------------|
| Frontend (Web/Mobile) | `js/config.js` | ANON_KEY |
| Backend Scripts | Variables d'env | SERVICE_ROLE_KEY |
| Configuration VPS | `.env` sur VPS | JWT_SECRET |

**Règle d'Or**: 
- ✅ ANON_KEY → Frontend
- ⚠️ SERVICE_ROLE_KEY → Backend uniquement
- 🔒 JWT_SECRET → VPS uniquement

---

**Date de création**: 31 janvier 2026
**Dernière mise à jour**: 31 janvier 2026
