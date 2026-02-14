# 🚀 Guide Rapide : Migrer Supabase Cloud → VPS

## ⚡ 3 Étapes Rapides

### Étape 1 : Obtenir la Connection String PostgreSQL

**📌 IMPORTANT : Vous n'avez PAS besoin de clé API Supabase !**  
La migration utilise `pg_dump` qui se connecte directement à PostgreSQL, pas à l'API Supabase.

1. Connectez-vous à Supabase Cloud : `https://app.supabase.com`
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Database**
4. Dans **Connection string**, sélectionnez **URI**
5. Copiez la connection string
6. Remplacez `[YOUR-PASSWORD]` par votre mot de passe réel (visible dans Settings → Database)

**Exemple :**
```
postgresql://postgres.votreprojet:VOTRE_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

⚠️ **Note** : Vous pouvez aussi utiliser la connection directe (port 5432) au lieu du pooler (port 6543)

### Étape 2 : Configurer et Lancer la Migration

```bash
# Windows PowerShell
$env:SUPABASE_CLOUD_DB_URL="postgresql://postgres:VOTRE_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
node config/migrate-supabase-cloud-to-vps.js

# Linux/Mac
export SUPABASE_CLOUD_DB_URL="postgresql://postgres:VOTRE_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
node config/migrate-supabase-cloud-to-vps.js
```

### Étape 3 : Vérifier et Mettre à Jour

1. ✅ Accédez à Supabase Studio VPS : `http://78.47.97.137:3001`
2. ✅ Connectez-vous et vérifiez vos tables dans **Table Editor**
3. ✅ Récupérez les nouvelles clés API : **Settings** → **API**
4. ✅ Mettez à jour votre application avec les nouvelles URLs et clés

## ⚠️ Important

- ⏱️ **Temps estimé** : 5-30 minutes selon la taille des données
- 🔒 **Sécurité** : Ne commitez jamais vos connection strings
- 💾 **Backup** : Faites un backup complet avant la migration
- 🛑 **Downtime** : Planifiez une fenêtre de maintenance

## ❓ Problèmes ?

Consultez `config/MIGRATE_CLOUD_TO_VPS.md` pour le guide complet et le dépannage.
