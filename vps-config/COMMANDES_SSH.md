# Commandes SSH à exécuter sur le VPS

## 1. Se connecter au VPS
```bash
ssh root@76.13.133.147
# ou
ssh root@78.47.97.137
```

## 2. Aller dans le dossier Supabase
```bash
cd /root/supabase/docker
# ou
cd /opt/supabase/docker
# ou trouvez le bon chemin avec :
find / -name "docker-compose.yml" -path "*/supabase/*" 2>/dev/null
```

## 3. Copier docker-compose.yml
```bash
cat docker-compose.yml
```
→ Copiez le résultat dans `vps-config/docker-compose.yml.txt`

## 4. Copier .env
```bash
cat .env
```
→ Copiez le résultat dans `vps-config/env.txt`

## 5. Copier kong.yml
```bash
cat volumes/api/kong.yml
```
→ Copiez le résultat dans `vps-config/kong.yml.txt`

## 6. Lister la structure
```bash
ls -la
ls -la volumes/
ls -la volumes/api/
ls -la volumes/db/
```

## 7. Copier d'autres fichiers importants
```bash
# Tous les fichiers YAML
find volumes/ -name "*.yml" -o -name "*.yaml"

# Tous les fichiers SQL
find volumes/ -name "*.sql"

# Structure complète
tree volumes/ 2>/dev/null || find volumes/ -type f
```

## 8. Vérifier les versions des images
```bash
grep "image:" docker-compose.yml
```

## 9. Vérifier les volumes
```bash
docker volume ls | grep supabase
```

## 10. Vérifier les réseaux
```bash
docker network ls | grep supabase
```
