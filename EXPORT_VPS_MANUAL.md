# 📥 Export Manuel VPS → Local

## 🚀 Méthode Simple (Commandes à Copier-Coller)

### Étape 1 : Sur votre Terminal SSH (connecté au VPS)

```bash
# Créer un dossier temporaire
mkdir -p /tmp/vps-export
cd /tmp/vps-export

# Exporter la structure complète
docker exec supabase-db pg_dump -U postgres --schema-only --no-owner --no-acl postgres > schema.sql

# Exporter toutes les données
docker exec supabase-db pg_dump -U postgres --data-only --no-owner --no-acl postgres > data.sql

# Exporter les tables importantes individuellement
docker exec supabase-db pg_dump -U postgres --table=public.employees --data-only --no-owner --no-acl postgres > employees.sql
docker exec supabase-db pg_dump -U postgres --table=public.user_roles --data-only --no-owner --no-acl postgres > user_roles.sql
docker exec supabase-db pg_dump -U postgres --table=public.interventions --data-only --no-owner --no-acl postgres > interventions.sql
docker exec supabase-db pg_dump -U postgres --table=public.orders --data-only --no-owner --no-acl postgres > orders.sql

# Créer une archive
tar -czf vps-export-$(date +%Y%m%d).tar.gz *.sql

# Afficher le chemin
echo "Archive créée: /tmp/vps-export/vps-export-$(date +%Y%m%d).tar.gz"
```

### Étape 2 : Télécharger l'archive sur votre PC

**Option A : Via SCP (depuis votre PC Windows)**

```powershell
# Dans PowerShell sur votre PC
scp root@76.13.133.147:/tmp/vps-export/vps-export-*.tar.gz .\vps-export\
```

**Option B : Via WinSCP ou FileZilla**

1. Connectez-vous au VPS avec WinSCP/FileZilla
2. Allez dans `/tmp/vps-export/`
3. Téléchargez le fichier `vps-export-YYYYMMDD.tar.gz`

**Option C : Via le navigateur (si vous avez un serveur web)**

```bash
# Sur le VPS, créer un lien symbolique accessible
ln -s /tmp/vps-export /var/www/html/export
# Puis télécharger via http://76.13.133.147/export/vps-export-*.tar.gz
```

### Étape 3 : Extraire et Importer en Local

```powershell
# Sur votre PC, extraire l'archive
cd vps-export
tar -xzf vps-export-*.tar.gz

# Ou avec 7-Zip sur Windows
# Clic droit > Extraire ici
```

### Étape 4 : Importer dans Supabase Local

```powershell
# S'assurer que Supabase local est démarré
docker-compose -f docker-compose.local.yml up -d

# Importer la structure
Get-Content schema.sql | docker exec -i supabase-db-local psql -U postgres

# Importer les données
Get-Content data.sql | docker exec -i supabase-db-local psql -U postgres

# Ou importer table par table
Get-Content employees.sql | docker exec -i supabase-db-local psql -U postgres
Get-Content user_roles.sql | docker exec -i supabase-db-local psql -U postgres
```

---

## 🎯 Méthode Ultra-Rapide (Une Seule Commande)

### Sur le VPS (SSH)

```bash
# Export complet en une commande
docker exec supabase-db pg_dump -U postgres --no-owner --no-acl postgres | gzip > /tmp/supabase-full-export.sql.gz
```

### Télécharger

```powershell
# Depuis votre PC
scp root@76.13.133.147:/tmp/supabase-full-export.sql.gz .\vps-export\
```

### Importer

```powershell
# Décompresser et importer
gunzip -c vps-export\supabase-full-export.sql.gz | docker exec -i supabase-db-local psql -U postgres
```

---

## ✅ Vérification

```powershell
# Vérifier que les données sont importées
docker exec -it supabase-db-local psql -U postgres -c "SELECT COUNT(*) FROM employees;"
docker exec -it supabase-db-local psql -U postgres -c "SELECT COUNT(*) FROM user_roles;"
```

---

## 🆘 Si ça ne marche pas

### Erreur : "Container not found"

Vérifiez le nom du conteneur :
```bash
# Sur le VPS
docker ps | grep supabase
```

### Erreur : "Permission denied" lors du SCP

```bash
# Sur le VPS, donner les permissions
chmod 644 /tmp/vps-export/*.sql
```

### Erreur lors de l'import : "relation already exists"

Videz d'abord la base locale :
```powershell
docker exec -it supabase-db-local psql -U postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

---

**C'est la méthode la plus simple et la plus fiable !** 🚀
