# 🚀 Guide de Configuration Supabase Local

## 📋 Vue d'Ensemble

Ce guide vous permet de configurer Supabase en local avec Docker Compose pour développer sur votre ordinateur avant de déployer sur le serveur.

---

## ✅ Prérequis

- **Docker Desktop** installé et démarré
- **Docker Compose** (inclus avec Docker Desktop)
- **Git** (optionnel, pour cloner le projet)

---

## 🚀 Installation Rapide

### Étape 1 : Préparer l'environnement

```bash
# Créer le fichier .env.local
cp .env.local.example .env.local

# Rendre le script exécutable (Linux/Mac)
chmod +x setup-local.sh

# Exécuter le script de setup
./setup-local.sh
```

**Sur Windows (PowerShell) :**
```powershell
# Copier le fichier .env
Copy-Item .env.local.example .env.local

# Exécuter le script (si Git Bash installé)
bash setup-local.sh

# Ou démarrer manuellement
docker-compose -f docker-compose.local.yml --env-file .env.local up -d
```

### Étape 2 : Vérifier que tout fonctionne

```bash
# Vérifier les conteneurs
docker-compose -f docker-compose.local.yml ps

# Vérifier les logs
docker-compose -f docker-compose.local.yml logs -f
```

**URLs d'accès :**
- **API Supabase** : http://localhost:8000
- **Studio Supabase** : http://localhost:3001
- **PostgreSQL** : localhost:54322

---

## 📊 Créer les Tables et Configurer RLS

### Étape 1 : Créer toutes les tables

```bash
docker exec -i supabase-db-local psql -U postgres < create_all_tables.sql
```

### Étape 2 : Configurer les RLS (Row Level Security)

```bash
docker exec -i supabase-db-local psql -U postgres < SETUP_RLS.sql
```

### Étape 3 : Créer votre utilisateur admin

1. Ouvrez `admin-create-user.html` dans votre navigateur
2. Remplissez le formulaire avec vos informations
3. Entrez la SERVICE_ROLE_KEY (trouvable dans `.env.local`)

---

## ⚙️ Configuration de l'Application

### Mettre à jour js/config.js

Le fichier `js/config.js` est déjà configuré pour détecter automatiquement l'environnement local.

**Pour forcer l'utilisation du local :**
```javascript
const USE_LOCAL_SUPABASE = true; // Ligne 7
```

**URLs configurées :**
- Local : `http://localhost:8000`
- VPS : `http://76.13.133.147:8000`

---

## 🔧 Commandes Utiles

### Démarrer Supabase
```bash
docker-compose -f docker-compose.local.yml --env-file .env.local up -d
```

### Arrêter Supabase
```bash
docker-compose -f docker-compose.local.yml down
```

### Voir les logs
```bash
docker-compose -f docker-compose.local.yml logs -f
```

### Redémarrer un service
```bash
docker-compose -f docker-compose.local.yml restart <service-name>
```

### Accéder à PostgreSQL
```bash
docker exec -it supabase-db-local psql -U postgres
```

### Exécuter un script SQL
```bash
docker exec -i supabase-db-local psql -U postgres < votre_script.sql
```

### Vider la base de données (⚠️ DESTRUCTIF)
```bash
docker-compose -f docker-compose.local.yml down -v
```

---

## 📁 Structure des Fichiers

```
agtelecom/
├── docker-compose.local.yml      # Configuration Docker Compose
├── .env.local                    # Variables d'environnement (à créer)
├── .env.local.example            # Template des variables
├── setup-local.sh                # Script de setup automatique
├── supabase/
│   ├── volumes/
│   │   ├── api/
│   │   │   └── kong.yml          # Configuration Kong
│   │   └── functions/            # Edge Functions
│   └── migrations/               # Migrations SQL
└── js/
    └── config.js                 # Configuration Supabase (détecte auto local/VPS)
```

---

## 🔑 Récupérer les Clés API

### Via Docker

```bash
# ANON_KEY
docker exec supabase-kong-local env | grep ANON_KEY

# SERVICE_ROLE_KEY
docker exec supabase-kong-local env | grep SERVICE_ROLE_KEY
```

### Via le fichier .env.local

```bash
# Linux/Mac
grep ANON_KEY .env.local
grep SERVICE_ROLE_KEY .env.local

# Windows PowerShell
Select-String -Path .env.local -Pattern "ANON_KEY"
Select-String -Path .env.local -Pattern "SERVICE_ROLE_KEY"
```

---

## 🆘 Dépannage

### Les conteneurs ne démarrent pas

```bash
# Vérifier les logs
docker-compose -f docker-compose.local.yml logs

# Vérifier que les ports ne sont pas déjà utilisés
netstat -an | grep -E '8000|3001|54322'
```

### Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL est démarré
docker ps | grep supabase-db-local

# Vérifier les logs PostgreSQL
docker logs supabase-db-local
```

### Les tables n'existent pas

```bash
# Vérifier la connexion
docker exec -it supabase-db-local psql -U postgres -c "\dt"

# Recréer les tables
docker exec -i supabase-db-local psql -U postgres < create_all_tables.sql
```

### L'application ne se connecte pas

1. Vérifiez que `USE_LOCAL_SUPABASE = true` dans `js/config.js`
2. Vérifiez que Supabase est démarré : `docker ps | grep supabase`
3. Vérifiez l'URL dans la console : doit afficher `http://localhost:8000`

---

## 🔄 Synchroniser avec le Serveur

### Exporter les données du serveur

```bash
# Sur le serveur (SSH)
docker exec supabase-db psql -U postgres -c "\copy (SELECT * FROM employees) TO '/tmp/employees.csv' CSV HEADER"
```

### Importer dans le local

```bash
# Sur votre machine locale
docker exec -i supabase-db-local psql -U postgres -c "\copy employees FROM '/tmp/employees.csv' CSV HEADER"
```

---

## 📝 Checklist de Démarrage

- [ ] Docker Desktop installé et démarré
- [ ] Fichier `.env.local` créé
- [ ] Script `setup-local.sh` exécuté
- [ ] Conteneurs Supabase démarrés
- [ ] Tables créées (`create_all_tables.sql`)
- [ ] RLS configuré (`SETUP_RLS.sql`)
- [ ] Utilisateur admin créé
- [ ] `js/config.js` configuré pour local
- [ ] Application testée et fonctionnelle

---

## 🎯 Workflow Recommandé

1. **Développement local** : Travaillez avec `docker-compose.local.yml`
2. **Tests** : Testez tout en local avant de déployer
3. **Déploiement** : Push vers GitHub puis déployez sur le VPS
4. **Production** : Utilisez la configuration VPS

---

## 📚 Ressources

- [Documentation Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- Fichier local : `CONFIGURATION_SUPABASE_LOCAL.md`

---

**Date de création** : 31 janvier 2026  
**Version** : 1.0
