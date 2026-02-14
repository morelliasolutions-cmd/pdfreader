#!/bin/bash

###############################################################################
# Script de configuration Supabase Local
# Prépare tout pour travailler en local avec Docker Compose
###############################################################################

set -e

echo "🚀 Configuration Supabase Local"
echo "=================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info() {
    echo -e "${GREEN}✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    error "Docker n'est pas installé"
    exit 1
fi
info "Docker trouvé"

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    error "Docker Compose n'est pas installé"
    exit 1
fi
info "Docker Compose trouvé"

# Créer le fichier .env.local s'il n'existe pas
if [ ! -f .env.local ]; then
    info "Création du fichier .env.local..."
    cp .env.local.example .env.local
    info "Fichier .env.local créé"
else
    warn "Le fichier .env.local existe déjà"
    read -p "Voulez-vous le réinitialiser ? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp .env.local.example .env.local
        info "Fichier .env.local réinitialisé"
    fi
fi

# Créer les dossiers nécessaires
info "Création des dossiers nécessaires..."
mkdir -p supabase/volumes/api
mkdir -p supabase/volumes/functions
mkdir -p supabase/migrations
info "Dossiers créés"

# Créer le fichier kong.yml si nécessaire
if [ ! -f supabase/volumes/api/kong.yml ]; then
    warn "Création du fichier kong.yml basique..."
    cat > supabase/volumes/api/kong.yml << 'EOF'
_format_version: "3.0"
_transform: true

services:
  - name: auth-v1
    url: http://auth:9999/
    routes:
      - name: auth-v1-all
        strip_path: true
        paths:
          - /auth/v1/
    plugins:
      - name: cors

  - name: rest-v1
    url: http://rest:3000/
    routes:
      - name: rest-v1-all
        strip_path: true
        paths:
          - /rest/v1/
    plugins:
      - name: cors

  - name: storage-v1
    url: http://storage:5000/
    routes:
      - name: storage-v1-all
        strip_path: true
        paths:
          - /storage/v1/
    plugins:
      - name: cors

  - name: functions-v1
    url: http://functions:9000/
    routes:
      - name: functions-v1-all
        strip_path: true
        paths:
          - /functions/v1/
    plugins:
      - name: cors

consumers:
  - username: anon
    keyauth_credentials:
      - key: ${ANON_KEY}

  - username: service_role
    keyauth_credentials:
      - key: ${SERVICE_ROLE_KEY}
EOF
    info "Fichier kong.yml créé"
fi

# Vérifier si Supabase est déjà en cours d'exécution
if docker ps | grep -q supabase; then
    warn "Supabase semble déjà être en cours d'exécution"
    read -p "Voulez-vous le redémarrer ? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Arrêt de Supabase..."
        docker-compose -f docker-compose.local.yml down
    fi
fi

# Démarrer Supabase
info "Démarrage de Supabase..."
docker-compose -f docker-compose.local.yml --env-file .env.local up -d

# Attendre que les services soient prêts
info "Attente du démarrage des services..."
sleep 10

# Vérifier l'état
info "Vérification de l'état des services..."
docker-compose -f docker-compose.local.yml ps

echo ""
echo "=================================="
echo "✅ Configuration terminée !"
echo "=================================="
echo ""
echo "📋 URLs d'accès:"
echo ""
echo "  🌐 API Supabase:"
echo "     http://localhost:8000"
echo ""
echo "  🎨 Supabase Studio:"
echo "     http://localhost:3001"
echo ""
echo "  🗄️  PostgreSQL:"
echo "     localhost:54322"
echo ""
echo "📝 Prochaines étapes:"
echo ""
echo "  1. Créer les tables SQL:"
echo "     docker exec -i supabase-db-local psql -U postgres < create_all_tables.sql"
echo ""
echo "  2. Configurer les RLS:"
echo "     docker exec -i supabase-db-local psql -U postgres < SETUP_RLS.sql"
echo ""
echo "  3. Créer votre utilisateur admin:"
echo "     Ouvrez admin-create-user.html"
echo ""
echo "  4. Mettre à jour js/config.js:"
echo "     USE_LOCAL_SUPABASE = true"
echo ""
echo "=================================="
echo ""
