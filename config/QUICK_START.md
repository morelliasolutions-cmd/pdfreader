# 🚀 Guide Rapide : Déployer Supabase sur Easypanel

## ✅ La Méthode la Plus Simple (3 étapes)

### Étape 1 : Accéder à Easypanel
Ouvrez votre navigateur et allez sur : `https://yhmr4j.easypanel.host`

### Étape 2 : Utiliser le Template Supabase

1. Cliquez sur **"New Project"** → Nommez-le `veloxnumeric`
2. Dans le projet, cliquez sur **"Add Service"** → **"Templates"** → **"Supabase"**
3. Cliquez sur **"Deploy"**

### Étape 3 : Configurer les Variables

Dans les paramètres du service Supabase, ajoutez ces variables d'environnement :

```
POSTGRES_PASSWORD=ae9bf4dcb11e265619953e751be5dfc5007551a1f3538e1987c1dcf8fa935433
JWT_SECRET=035f850f68ea09404e714365d937007e021a2f30b31bd4df8b0bbb717307b0998abfba6200ef58e2c748dcb40786d2e33146c7742092b64895bf1eec32677699
```

**Important** : Les variables `ANON_KEY` et `SERVICE_ROLE_KEY` seront générées automatiquement au premier démarrage.

### C'est tout ! 🎉

Attendez 5-10 minutes que Supabase démarre, puis accédez à Supabase Studio pour récupérer vos clés API.

## 📋 Où trouver vos clés API ?

1. Accédez à Supabase Studio (l'URL vous sera donnée dans Easypanel)
2. Allez dans **Settings** → **API**
3. Copiez les clés :
   - **Project URL** : votre URL Supabase
   - **anon/public key** : clé publique
   - **service_role key** : clé secrète ⚠️ (gardez-la secrète)

## 🔐 Configuration de votre application

Mettez à jour `js/config.js` avec vos nouvelles clés :

```javascript
const SUPABASE_URL = 'https://votre-url-supabase';
const SUPABASE_ANON_KEY = 'votre-anon-key';
```

## ❓ Problèmes ?

Si le template ne fonctionne pas :
1. Vérifiez les logs dans Easypanel
2. Consultez `config/EASYPANEL_SUPABASE_SOLUTION.md` pour plus de détails
3. Essayez la méthode alternative avec Git (voir le fichier ci-dessus)
