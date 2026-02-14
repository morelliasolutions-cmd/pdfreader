# Configuration Supabase Local (VPS)

Ce guide explique comment connecter la web app à votre instance Supabase locale sur votre VPS.

## 🎯 Configuration Actuelle

L'application est maintenant configurée pour se connecter à votre **Supabase local** hébergé sur votre VPS.

### Informations de connexion

- **URL Supabase Local**: `http://78.47.97.137:8000`
- **URL Studio**: `http://78.47.97.137:3001`
- **ANON_KEY**: Configurée dans `js/config.js`

## 🔄 Basculer entre Local et Cloud

Dans le fichier `js/config.js`, modifiez la constante:

```javascript
const USE_LOCAL_SUPABASE = true;  // Local (VPS)
const USE_LOCAL_SUPABASE = false; // Cloud
```

## ✅ Ce qui a été configuré

1. **Fichier `js/config.js`** mis à jour avec:
   - Configuration Supabase Local (VPS)
   - Configuration Supabase Cloud (backup)
   - Switch pour basculer entre les deux
   - Logs console pour vérifier la connexion

## 🧪 Tester la connexion

1. Ouvrez votre navigateur sur n'importe quelle page de l'application
2. Ouvrez la console développeur (F12)
3. Vous devriez voir: `🔌 Connexion à Supabase: LOCAL (VPS) http://78.47.97.137:8000`

## 🔒 Sécurité

### ✅ Clés exposées (Safe pour le frontend)
- `ANON_KEY` - Clé publique anonyme
- `SUPABASE_URL` - URL publique de l'API

### ⚠️ ATTENTION: Clés à NE JAMAIS exposer
Ces clés doivent UNIQUEMENT être utilisées côté serveur:
- `SERVICE_ROLE_KEY` - Contourne toutes les règles RLS
- `POSTGRES_PASSWORD` - Accès direct à la base de données
- `JWT_SECRET` - Secret de signature des tokens

## 📝 Notes importantes

1. **CORS**: Assurez-vous que votre Supabase local accepte les requêtes depuis votre domaine
   - Vérifiez `ADDITIONAL_REDIRECT_URLS` dans `config/supabase.env.local`
   - Ajoutez votre domaine si nécessaire

2. **HTTPS vs HTTP**: 
   - Actuellement configuré en `http://` (développement)
   - En production, utilisez `https://` avec un certificat SSL valide

3. **RLS (Row Level Security)**:
   - Toutes les politiques de sécurité doivent être configurées dans Supabase
   - Le frontend ne doit JAMAIS contenir de logique de sécurité critique

## 🚀 Prochaines étapes recommandées

1. **Configurer un domaine** pour votre Supabase local
   - Exemple: `api.votredomaine.com`
   - Configurer SSL/TLS avec Let's Encrypt

2. **Mettre à jour l'URL** dans `js/config.js` avec votre domaine:
   ```javascript
   const SUPABASE_LOCAL_URL = 'https://api.votredomaine.com';
   ```

3. **Tester l'authentification** et les requêtes API

4. **Vérifier les logs** dans Supabase Studio

## 🔧 Dépannage

### Erreur CORS
Si vous voyez des erreurs CORS dans la console:
1. Ajoutez votre domaine dans `ADDITIONAL_REDIRECT_URLS` (fichier `config/supabase.env.local`)
2. Redémarrez les services Supabase

### Connexion refusée
Vérifiez que:
- Le service Supabase est démarré sur le VPS
- Le port 8000 est ouvert dans le firewall
- L'IP/domaine est accessible depuis votre réseau

### Token expiré
L'ANON_KEY actuelle expire en 2027. Pour générer de nouvelles clés:
1. Générez un nouveau JWT_SECRET
2. Redémarrez Supabase
3. Récupérez les nouvelles clés dans Studio

## 📚 Références

- [Documentation Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting)
- [Fichier de configuration VPS](config/supabase.env.local)
- [Guide agents](AGENTS.md)
