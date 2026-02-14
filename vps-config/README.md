# Configuration VPS - À copier depuis le serveur

## Instructions

1. Connectez-vous au VPS via SSH
2. Allez dans le dossier Supabase : `cd /root/supabase/docker` (ou le chemin approprié)
3. Copiez le contenu de chaque fichier dans les fichiers correspondants ci-dessous

## Fichiers à copier

### 1. docker-compose.yml
```bash
cat docker-compose.yml
```
→ Copiez dans : `vps-config/docker-compose.yml.txt`

### 2. .env (variables d'environnement)
```bash
cat .env
```
→ Copiez dans : `vps-config/env.txt`

### 3. Kong configuration
```bash
cat volumes/api/kong.yml
```
→ Copiez dans : `vps-config/kong.yml.txt`

### 4. Autres fichiers de configuration
```bash
ls -la volumes/
cat volumes/api/*.yml 2>/dev/null
cat volumes/db/*.sql 2>/dev/null
```
→ Copiez dans : `vps-config/other-configs.txt`

---

## Structure des fichiers

- `docker-compose.yml.txt` - Configuration Docker Compose complète
- `env.txt` - Variables d'environnement
- `kong.yml.txt` - Configuration Kong API Gateway
- `other-configs.txt` - Autres fichiers de configuration
