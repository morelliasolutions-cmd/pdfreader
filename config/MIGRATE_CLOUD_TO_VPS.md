# Guide de Migration : Supabase Cloud → VPS Self-hosted

## Vue d'ensemble

Ce guide explique comment migrer vos données de Supabase Cloud vers votre instance Supabase self-hosted sur votre VPS.

## ⚠️ Prerequisites

1. **Supabase Cloud** : Votre projet Supabase Cloud avec les données
2. **Supabase VPS** : Instance Supabase déployée et opérationnelle sur votre VPS
3. **Connection string PostgreSQL** : URL de connexion directe à votre base de données Supabase Cloud

## 🔑 Obtenir les credentials Supabase Cloud

### ✅ Méthode Recommandée : Connection String PostgreSQL

**📌 Vous n'avez PAS besoin de clé API (ni anon, ni service_role)**  
La migration utilise `pg_dump` qui se connecte directement à PostgreSQL, pas à l'API REST Supabase.

1. Connectez-vous à votre dashboard Supabase Cloud : `https://app.supabase.com`
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Database**
4. Dans **Connection string**, sélectionnez **URI**
5. Copiez la connection string (format: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`)
6. Remplacez `[PASSWORD]` par votre mot de passe de base de données (visible dans Settings → Database)

**Options de connection string :**
- **Direct** (port 5432) : `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`
- **Pooler** (port 6543) : `postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-xxx.pooler.supabase.com:6543/postgres`

Les deux fonctionnent, mais le pooler est optimisé pour les connexions multiples.

### ❌ Méthode Alternative : Service Role Key (NON utilisée actuellement)

⚠️ **Cette méthode n'est pas utilisée par le script actuel.**  
Si vous voulez migrer via API Supabase (futur), vous auriez besoin de la **service_role key** (clé secrète), pas la clé anon.

1. Dans Supabase Studio → **Settings** → **API**
2. Copiez la **service_role key** (⚠️ gardez-la secrète, elle bypass toutes les RLS policies)

## 📋 Configuration des variables d'environnement

### Option 1 : Variables d'environnement (recommandé)

Créez un fichier `.env.migration` (non versionné) :

```bash
# Connection string PostgreSQL directe (recommandé - C'EST TOUT CE DONT VOUS AVEZ BESOIN)
SUPABASE_CLOUD_DB_URL=postgresql://postgres:VOTRE_PASSWORD@db.xxxxx.supabase.co:5432/postgres

# Les lignes suivantes ne sont PAS nécessaires pour la migration via pg_dump :
# SUPABASE_CLOUD_URL=https://xxxxx.supabase.co
# SUPABASE_CLOUD_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**📌 Note** : Vous n'avez besoin QUE de `SUPABASE_CLOUD_DB_URL`. Les autres variables (`SUPABASE_CLOUD_URL` et `SUPABASE_CLOUD_SERVICE_ROLE_KEY`) sont pour une méthode alternative via API qui n'est pas implémentée actuellement.

Puis chargez-les :

```bash
# Windows PowerShell
Get-Content .env.migration | ForEach-Object { if ($_ -match '^([^#][^=]+)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process') } }

# Linux/Mac
export $(cat .env.migration | xargs)
```

### Option 2 : Modifier directement le script

Éditez `config/migrate-supabase-cloud-to-vps.js` et modifiez :

```javascript
const CLOUD_CONFIG = {
  dbUrl: 'postgresql://postgres:VOTRE_PASSWORD@db.xxxxx.supabase.co:5432/postgres'
};
```

## 🚀 Exécution de la migration

### Étape 1 : Préparer la migration

```bash
# Vérifier que pg_dump est installé sur le VPS
ssh root@78.47.97.137 "which pg_dump"
```

Si `pg_dump` n'est pas installé, installez-le :

```bash
ssh root@78.47.97.137 "apt-get update && apt-get install -y postgresql-client"
```

### Étape 2 : Lancer la migration

```bash
# Avec variables d'environnement
node config/migrate-supabase-cloud-to-vps.js

# OU directement avec les credentials
export SUPABASE_CLOUD_DB_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
node config/migrate-supabase-cloud-to-vps.js
```

## 📊 Ce qui sera migré

### ✅ Automatiquement migré

- ✅ **Schéma de base de données** : Toutes les tables, colonnes, types
- ✅ **Données** : Toutes les lignes de toutes les tables
- ✅ **Indexes** : Tous les index
- ✅ **Foreign keys** : Toutes les contraintes de clés étrangères
- ✅ **RLS Policies** : Toutes les politiques Row Level Security
- ✅ **Functions** : Toutes les fonctions PostgreSQL
- ✅ **Triggers** : Tous les triggers
- ✅ **Sequences** : Tous les séquences (pour les IDs auto-incrémentés)

### ⚠️ À migrer manuellement

- ⚠️ **Storage Buckets** : Les fichiers dans Storage doivent être migrés manuellement
- ⚠️ **Edge Functions** : Les fonctions serverless doivent être redéployées
- ⚠️ **Users/Auth** : Les utilisateurs doivent être recréés ou migrés
- ⚠️ **Secrets** : Les secrets/configurations spécifiques

## 📦 Migration Storage (manuelle)

Pour migrer les fichiers Storage :

### Option 1 : Via Supabase Studio

1. Connectez-vous à Supabase Studio Cloud
2. Allez dans **Storage**
3. Téléchargez les fichiers bucket par bucket
4. Connectez-vous à Supabase Studio VPS (`http://78.47.97.137:3001`)
5. Créez les mêmes buckets
6. Uploadez les fichiers

### Option 2 : Via API (script futur)

Un script automatisé pour Storage sera ajouté dans une version future.

## 🔐 Migration des utilisateurs Auth

Les utilisateurs Supabase Auth sont stockés dans la table `auth.users`. Ils seront migrés automatiquement avec les données.

⚠️ **Important** : Après la migration, les utilisateurs devront peut-être se reconnecter car les tokens JWT peuvent être différents.

## ✅ Vérification post-migration

### 1. Vérifier les données

```bash
# Se connecter à PostgreSQL sur le VPS
ssh root@78.47.97.137 "cd /opt/supabase/docker && docker compose exec -T db psql -U postgres -d postgres -c '\\dt'"
```

### 2. Compter les lignes

```bash
# Compter les lignes dans une table spécifique
ssh root@78.47.97.137 "cd /opt/supabase/docker && docker compose exec -T db psql -U postgres -d postgres -c 'SELECT COUNT(*) FROM votre_table;'"
```

### 3. Vérifier dans Supabase Studio VPS

1. Accédez à `http://78.47.97.137:3001`
2. Connectez-vous avec les credentials
3. Allez dans **Table Editor** et vérifiez vos tables
4. Allez dans **Authentication** et vérifiez vos utilisateurs

## 🔄 Mise à jour de l'application

Après la migration, mettez à jour vos variables d'environnement :

### Avant (Supabase Cloud)
```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### Après (Supabase VPS)
```javascript
const SUPABASE_URL = 'http://78.47.97.137:8000'; // Ou votre domaine
const SUPABASE_ANON_KEY = 'NOUVELLE_ANON_KEY'; // Récupérée depuis Studio VPS
```

## ⚠️ Points importants

1. **Backup avant migration** : Faites un backup complet de Supabase Cloud avant la migration
2. **Downtime** : Planifiez une fenêtre de maintenance, l'application sera indisponible pendant la migration
3. **Test** : Testez la migration sur un environnement de staging d'abord
4. **RLS** : Vérifiez que toutes les policies RLS sont bien migrées
5. **Secrets** : Mettez à jour tous les secrets dans votre application
6. **DNS** : Si vous utilisez un domaine, mettez à jour les DNS après migration

## 🆘 Dépannage

### Erreur : "connection refused"

- Vérifiez que Supabase VPS est démarré : `ssh root@78.47.97.137 "cd /opt/supabase/docker && docker compose ps"`
- Vérifiez que PostgreSQL est accessible : `ssh root@78.47.97.137 "cd /opt/supabase/docker && docker compose exec db pg_isready"`

### Erreur : "permission denied"

- Vérifiez que le mot de passe PostgreSQL est correct
- Vérifiez que l'utilisateur `postgres` a les bonnes permissions

### Erreur : "table already exists"

- Les tables existent déjà, c'est normal pour une re-migration
- Le script ignore les erreurs de duplication

### Données manquantes

- Vérifiez les logs d'import : `ssh root@78.47.97.137 "cat /tmp/supabase-migration/*.log"`
- Vérifiez les erreurs dans Supabase Studio VPS

## 📝 Checklist de migration

- [ ] Backup complet de Supabase Cloud effectué
- [ ] Supabase VPS opérationnel et accessible
- [ ] Credentials Supabase Cloud récupérés
- [ ] Variables d'environnement configurées
- [ ] `pg_dump` installé sur le VPS
- [ ] Migration exécutée
- [ ] Données vérifiées dans Supabase Studio VPS
- [ ] Storage migré manuellement (si nécessaire)
- [ ] Application testée avec nouvelles clés API
- [ ] Variables d'environnement mises à jour
- [ ] DNS mis à jour (si domaine utilisé)

## 📚 Ressources

- [Documentation Supabase Self-hosting](https://supabase.com/docs/guides/self-hosting)
- [Documentation pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Documentation PostgreSQL Migration](https://www.postgresql.org/docs/current/backup-dump.html)
