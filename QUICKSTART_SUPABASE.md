# 🚀 Guide Rapide - Connexion Supabase Local

## ✅ Configuration Terminée

Votre application web est maintenant configurée pour se connecter à votre **Supabase local** sur votre VPS (`78.47.97.137:8000`).

## 🎯 Fichiers Modifiés

1. **`js/config.js`** - Configuration Supabase avec switch Local/Cloud
2. **`test-supabase.html`** - Page de test de connexion
3. **`CONFIGURATION_SUPABASE_LOCAL.md`** - Documentation complète

## 🧪 Tester la Configuration

### Option 1: Page de Test Dédiée
Ouvrez dans votre navigateur:
```
test-supabase.html
```

Cette page vous permettra de:
- ✅ Vérifier la connexion à Supabase
- ✅ Tester l'authentification
- ✅ Voir la configuration active
- ✅ Afficher les erreurs détaillées

### Option 2: Console du Navigateur
1. Ouvrez n'importe quelle page de l'application
2. Ouvrez la console (F12)
3. Vous devriez voir:
   ```
   🔌 Connexion à Supabase: LOCAL (VPS) http://78.47.97.137:8000
   ```

## 🔄 Changer entre Local et Cloud

Éditez `js/config.js` ligne 7:

```javascript
// Pour utiliser Supabase LOCAL (VPS)
const USE_LOCAL_SUPABASE = true;

// Pour utiliser Supabase CLOUD
const USE_LOCAL_SUPABASE = false;
```

## ⚠️ Points Importants

### 1. Vérifier que Supabase est démarré sur le VPS
```bash
# Sur votre VPS
docker ps | grep supabase
```

### 2. Vérifier les ports ouverts
Le port **8000** doit être accessible depuis votre réseau.

### 3. Configuration CORS
Si vous avez des erreurs CORS, ajoutez votre domaine dans le fichier `config/supabase.env.local`:
```env
ADDITIONAL_REDIRECT_URLS=http://votredomaine.com,http://localhost
```

Puis redémarrez Supabase.

## 🔒 Sécurité

### ✅ Exposé au Frontend (Safe)
- `ANON_KEY` - Clé publique anonyme
- `SUPABASE_URL` - URL de l'API

### ⚠️ NE JAMAIS Exposer
- `SERVICE_ROLE_KEY` - Contourne RLS (uniquement backend)
- `JWT_SECRET` - Secret de signature
- `POSTGRES_PASSWORD` - Mot de passe DB

## 📝 Prochaines Étapes Recommandées

1. **Tester la connexion** avec `test-supabase.html`
2. **Vérifier l'authentification** en vous connectant
3. **Configurer un domaine** avec SSL pour la production
4. **Mettre à jour les URLs** une fois le domaine configuré

## 🆘 Problèmes Fréquents

### Erreur "Failed to fetch"
- Vérifiez que Supabase est démarré sur le VPS
- Vérifiez que le port 8000 est accessible
- Vérifiez votre firewall

### Erreur CORS
- Ajoutez votre domaine dans `ADDITIONAL_REDIRECT_URLS`
- Redémarrez les services Supabase

### Token invalide
- Vérifiez que l'ANON_KEY correspond à celle générée par Supabase
- Consultez Supabase Studio pour obtenir la bonne clé

## 📚 Documentation

Pour plus de détails, consultez:
- **`CONFIGURATION_SUPABASE_LOCAL.md`** - Guide complet
- **`AGENTS.md`** - Règles de sécurité
- [Documentation Supabase](https://supabase.com/docs)

---

**Configuration effectuée le**: 31 janvier 2026
**Version Supabase**: Local (Self-hosted)
**VPS IP**: 78.47.97.137
