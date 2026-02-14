# 🔄 Synchronisation VPS → Local

## 📋 Vue d'Ensemble

Ce guide vous permet d'exporter toutes les données de votre Supabase VPS pour les importer dans votre environnement local.

---

## 🚀 Export Rapide

### Sur Windows (PowerShell)

```powershell
.\export-vps-to-local.ps1
```

### Sur Linux/Mac

```bash
chmod +x export-vps-to-local.sh
./export-vps-to-local.sh
```

---

## 📦 Ce qui est Exporté

Le script exporte :

1. **Structure de la base de données** (tables, contraintes, index)
2. **Données** (toutes les lignes de toutes les tables)
3. **Tables spécifiques** (export individuel pour chaque table importante)
4. **Policies RLS** (Row Level Security)
5. **Fonctions** (fonctions PostgreSQL personnalisées)

---

## 📁 Fichiers Générés

Après l'export, vous trouverez dans `vps-export/` :

- `schema_YYYYMMDD_HHMMSS.sql` - Structure complète
- `data_YYYYMMDD_HHMMSS.sql` - Toutes les données
- `table_<nom_table>_YYYYMMDD_HHMMSS.sql` - Export par table
- `rls_policies_YYYYMMDD_HHMMSS.sql` - Policies RLS
- `functions_YYYYMMDD_HHMMSS.sql` - Fonctions
- `import_all_YYYYMMDD_HHMMSS.sh` ou `.ps1` - Script d'import automatique

---

## 📥 Import en Local

### Méthode 1 : Script Automatique

```bash
# Linux/Mac
cd vps-export
./import_all_YYYYMMDD_HHMMSS.sh

# Windows PowerShell
cd vps-export
.\import_all_YYYYMMDD_HHMMSS.ps1
```

### Méthode 2 : Import Manuel

```bash
# 1. S'assurer que Supabase local est démarré
docker-compose -f docker-compose.local.yml up -d

# 2. Importer la structure
docker exec -i supabase-db-local psql -U postgres < vps-export/schema_YYYYMMDD_HHMMSS.sql

# 3. Importer les données
docker exec -i supabase-db-local psql -U postgres < vps-export/data_YYYYMMDD_HHMMSS.sql
```

---

## ⚠️ Précautions

### Avant l'Import

1. **Sauvegarder votre base locale** (si vous avez des données importantes)
2. **Vérifier que Supabase local est démarré**
3. **Vider la base locale** (optionnel, si vous voulez un import propre)

```bash
# Vider toutes les données (⚠️ DESTRUCTIF)
docker exec -it supabase-db-local psql -U postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

### Conflits Possibles

Si vous avez déjà des données en local, l'import peut générer des erreurs de contraintes. Dans ce cas :

1. **Option 1** : Vider la base locale avant l'import
2. **Option 2** : Importer table par table et gérer les conflits
3. **Option 3** : Utiliser `ON CONFLICT` dans vos requêtes SQL

---

## 🔍 Vérification après Import

```bash
# Lister les tables
docker exec -it supabase-db-local psql -U postgres -c "\dt"

# Compter les lignes dans une table
docker exec -it supabase-db-local psql -U postgres -c "SELECT COUNT(*) FROM employees;"

# Vérifier les policies RLS
docker exec -it supabase-db-local psql -U postgres -c "SELECT * FROM pg_policies WHERE schemaname = 'public';"
```

---

## 🔄 Workflow Recommandé

1. **Développement Local** : Travaillez avec les données importées
2. **Tests** : Testez vos modifications en local
3. **Export Local → VPS** : Quand prêt, déployez sur le VPS
4. **Synchronisation** : Ré-exportez périodiquement pour rester à jour

---

## 🆘 Dépannage

### Erreur : "Connection refused"

```bash
# Vérifier que SSH fonctionne
ssh root@76.13.133.147 "echo 'Connection OK'"
```

### Erreur : "Container not found"

Vérifiez le nom du conteneur sur le VPS :
```bash
ssh root@76.13.133.147 "docker ps | grep supabase"
```

### Erreur lors de l'import : "relation already exists"

Les tables existent déjà. Options :
- Vider la base locale avant l'import
- Utiliser `DROP TABLE IF EXISTS` dans le script SQL
- Importer seulement les données (sans la structure)

---

## 📚 Commandes Utiles

### Export manuel d'une table spécifique

```bash
ssh root@76.13.133.147 "docker exec supabase-db pg_dump -U postgres --table=public.employees --data-only postgres" > employees.sql
```

### Import manuel d'une table

```bash
docker exec -i supabase-db-local psql -U postgres < employees.sql
```

### Comparer les données

```bash
# Nombre de lignes sur le VPS
ssh root@76.13.133.147 "docker exec supabase-db psql -U postgres -t -c 'SELECT COUNT(*) FROM employees;'"

# Nombre de lignes en local
docker exec supabase-db-local psql -U postgres -t -c "SELECT COUNT(*) FROM employees;"
```

---

**Date de création** : 31 janvier 2026  
**Version** : 1.0
