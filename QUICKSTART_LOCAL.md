# 🚀 Démarrage Rapide - Supabase Local

## ⚡ Installation en 3 étapes

### 1️⃣ Préparer l'environnement

```bash
# Créer le fichier .env.local
cp .env.local.example .env.local

# Sur Windows PowerShell:
# Copy-Item .env.local.example .env.local
```

### 2️⃣ Démarrer Supabase

```bash
# Linux/Mac
docker-compose -f docker-compose.local.yml --env-file .env.local up -d

# Windows PowerShell
docker compose -f docker-compose.local.yml --env-file .env.local up -d
```

### 3️⃣ Créer les tables

```bash
# Créer toutes les tables
docker exec -i supabase-db-local psql -U postgres < create_all_tables.sql

# Configurer les RLS
docker exec -i supabase-db-local psql -U postgres < SETUP_RLS.sql
```

## ✅ C'est Prêt !

**URLs d'accès :**
- 🌐 API : http://localhost:8000
- 🎨 Studio : http://localhost:3001
- 🗄️ PostgreSQL : localhost:54322

**L'application détecte automatiquement que vous êtes en local !**

---

## 📝 Prochaines étapes

1. **Créer votre utilisateur admin** : Ouvrez `admin-create-user.html`
2. **Tester l'application** : Ouvrez `index.html` dans votre navigateur
3. **Développer** : Travaillez normalement, tout est en local !

---

**Pour plus de détails** : Consultez `SETUP_LOCAL.md`
