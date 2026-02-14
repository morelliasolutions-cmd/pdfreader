# ✅ Supabase Local - Installation Complète

## 📦 Configuration créée

Tous les fichiers nécessaires ont été créés :

- ✅ `docker-compose.local.yml` - Configuration Docker Compose basée sur la config VPS
- ✅ `.env.local` - Variables d'environnement complètes
- ✅ `supabase/volumes/api/kong.yml` - Configuration Kong API Gateway
- ✅ `supabase/volumes/logs/vector.yml` - Configuration Vector pour les logs

## 🚀 Services disponibles

Une fois tous les services démarrés, vous aurez accès à :

- **Studio** : http://localhost:3001
- **API Gateway (Kong)** : http://localhost:8000
- **Analytics** : http://localhost:4000

## 📊 Commandes utiles

### Démarrer tous les services
```powershell
docker compose -f docker-compose.local.yml --env-file .env.local up -d
```

### Voir le statut des services
```powershell
docker compose -f docker-compose.local.yml --env-file .env.local ps
```

### Voir les logs d'un service
```powershell
docker logs supabase-auth-local
docker logs supabase-rest-local
```

### Redémarrer un service
```powershell
docker compose -f docker-compose.local.yml --env-file .env.local restart auth
```

### Arrêter tous les services
```powershell
docker compose -f docker-compose.local.yml --env-file .env.local down
```

### Arrêter et supprimer les volumes (⚠️ supprime les données)
```powershell
docker compose -f docker-compose.local.yml --env-file .env.local down -v
```

## 🔧 Services inclus

- **db** : PostgreSQL 15.8.1
- **auth** : GoTrue v2.184.0
- **rest** : PostgREST v14.1
- **storage** : Storage API v1.33.0
- **realtime** : Realtime v2.68.0
- **functions** : Edge Runtime v1.69.28
- **analytics** : Logflare 1.27.0
- **studio** : Studio 2025.12.17
- **kong** : Kong 2.8.1
- **meta** : Postgres Meta v0.95.1
- **imgproxy** : Imgproxy v3.8.0
- **vector** : Vector 0.28.1

## ⚠️ Notes importantes

1. Les services peuvent prendre quelques minutes pour démarrer complètement
2. La base de données `_supabase` et les utilisateurs sont créés automatiquement
3. Le mot de passe par défaut est dans `.env.local` (POSTGRES_PASSWORD)
4. Tous les services utilisent le même réseau Docker : `supabase-local-network`

## 🔗 Connexion de la web app

La web app est déjà configurée pour utiliser Supabase local automatiquement quand elle détecte `localhost`. Vérifiez `js/config.js` pour la configuration.
