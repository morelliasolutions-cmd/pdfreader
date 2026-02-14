#!/bin/bash

###############################################################################
# Script d'installation automatique HTTPS pour Supabase Local
# ConnectFiber - AGTelecom
# Date: 31 janvier 2026
###############################################################################

set -e  # Arrêter en cas d'erreur

echo "🚀 Installation HTTPS pour Supabase Local"
echo "=========================================="
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
info() {
    echo -e "${GREEN}✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

###############################################################################
# Étape 1: Vérification des prérequis
###############################################################################

echo "📋 Étape 1: Vérification des prérequis..."

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then 
    error "Ce script doit être exécuté en tant que root"
    exit 1
fi
info "Utilisateur root confirmé"

# Vérifier la connexion internet
if ! ping -c 1 8.8.8.8 &> /dev/null; then
    error "Pas de connexion internet"
    exit 1
fi
info "Connexion internet OK"

# Vérifier si Supabase est en cours d'exécution
if ! docker ps | grep -q supabase; then
    warn "Supabase ne semble pas être en cours d'exécution"
    read -p "Continuer quand même ? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    info "Supabase est en cours d'exécution"
fi

###############################################################################
# Étape 2: Demander le nom de domaine
###############################################################################

echo ""
echo "📝 Étape 2: Configuration du domaine"
echo ""

read -p "Nom de domaine pour l'API Supabase (ex: api.votredomaine.com): " API_DOMAIN
if [ -z "$API_DOMAIN" ]; then
    error "Le nom de domaine est requis"
    exit 1
fi

read -p "Nom de domaine pour Supabase Studio (ex: studio.votredomaine.com): " STUDIO_DOMAIN
if [ -z "$STUDIO_DOMAIN" ]; then
    error "Le nom de domaine Studio est requis"
    exit 1
fi

info "API Domain: $API_DOMAIN"
info "Studio Domain: $STUDIO_DOMAIN"

# Vérifier la résolution DNS
echo ""
warn "Vérification DNS..."
if ! nslookup $API_DOMAIN | grep -q "78.47.97.137"; then
    warn "⚠️  ATTENTION: Le domaine $API_DOMAIN ne pointe pas vers 78.47.97.137"
    warn "Assurez-vous que le DNS est configuré avant de continuer"
    read -p "Continuer quand même ? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    info "DNS configuré correctement"
fi

###############################################################################
# Étape 3: Installation de Nginx
###############################################################################

echo ""
echo "📦 Étape 3: Installation de Nginx..."

if command -v nginx &> /dev/null; then
    info "Nginx est déjà installé"
    NGINX_VERSION=$(nginx -v 2>&1 | awk -F/ '{print $2}')
    info "Version: $NGINX_VERSION"
else
    info "Installation de Nginx..."
    
    # Détecter la distribution
    if [ -f /etc/debian_version ]; then
        apt-get update
        apt-get install -y nginx
    elif [ -f /etc/redhat-release ]; then
        yum install -y nginx
    else
        error "Distribution non supportée"
        exit 1
    fi
    
    info "Nginx installé avec succès"
fi

# Démarrer et activer Nginx
systemctl enable nginx
systemctl start nginx
info "Nginx démarré"

###############################################################################
# Étape 4: Installation de Certbot
###############################################################################

echo ""
echo "📦 Étape 4: Installation de Certbot..."

if command -v certbot &> /dev/null; then
    info "Certbot est déjà installé"
else
    info "Installation de Certbot..."
    
    if [ -f /etc/debian_version ]; then
        apt-get install -y certbot python3-certbot-nginx
    elif [ -f /etc/redhat-release ]; then
        yum install -y certbot python3-certbot-nginx
    fi
    
    info "Certbot installé avec succès"
fi

###############################################################################
# Étape 5: Configuration Nginx
###############################################################################

echo ""
echo "⚙️  Étape 5: Configuration Nginx..."

# Créer le fichier de configuration pour l'API
cat > /etc/nginx/sites-available/supabase-api <<EOF
# Configuration Supabase API
server {
    listen 80;
    server_name $API_DOMAIN;

    # Headers pour Supabase
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Créer le fichier de configuration pour Studio
cat > /etc/nginx/sites-available/supabase-studio <<EOF
# Configuration Supabase Studio
server {
    listen 80;
    server_name $STUDIO_DOMAIN;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Activer les sites
ln -sf /etc/nginx/sites-available/supabase-api /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/supabase-studio /etc/nginx/sites-enabled/

# Supprimer la configuration par défaut si elle existe
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Tester la configuration Nginx
if nginx -t; then
    info "Configuration Nginx valide"
    systemctl reload nginx
    info "Nginx rechargé"
else
    error "Erreur dans la configuration Nginx"
    exit 1
fi

###############################################################################
# Étape 6: Obtenir les certificats SSL
###############################################################################

echo ""
echo "🔒 Étape 6: Obtention des certificats SSL..."

# Obtenir le certificat pour l'API
info "Obtention du certificat pour $API_DOMAIN..."
certbot --nginx -d $API_DOMAIN --non-interactive --agree-tos --email admin@$API_DOMAIN --redirect

# Obtenir le certificat pour Studio
info "Obtention du certificat pour $STUDIO_DOMAIN..."
certbot --nginx -d $STUDIO_DOMAIN --non-interactive --agree-tos --email admin@$STUDIO_DOMAIN --redirect

info "Certificats SSL obtenus avec succès"

###############################################################################
# Étape 7: Configuration du renouvellement automatique
###############################################################################

echo ""
echo "🔄 Étape 7: Configuration du renouvellement automatique..."

# Vérifier si le cron existe déjà
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    # Ajouter le renouvellement automatique
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'systemctl reload nginx'") | crontab -
    info "Renouvellement automatique configuré"
else
    info "Renouvellement automatique déjà configuré"
fi

###############################################################################
# Étape 8: Mise à jour de la configuration Supabase
###############################################################################

echo ""
echo "⚙️  Étape 8: Mise à jour de la configuration Supabase..."

# Chercher le fichier de configuration Supabase
SUPABASE_ENV_FILE=""
if [ -f "./config/supabase.env.local" ]; then
    SUPABASE_ENV_FILE="./config/supabase.env.local"
elif [ -f "/opt/supabase/.env" ]; then
    SUPABASE_ENV_FILE="/opt/supabase/.env"
elif [ -f "./supabase/.env" ]; then
    SUPABASE_ENV_FILE="./supabase/.env"
else
    warn "Fichier de configuration Supabase non trouvé automatiquement"
    read -p "Chemin vers le fichier supabase.env.local: " SUPABASE_ENV_FILE
fi

if [ -f "$SUPABASE_ENV_FILE" ]; then
    info "Fichier trouvé: $SUPABASE_ENV_FILE"
    
    # Sauvegarder le fichier original
    cp "$SUPABASE_ENV_FILE" "${SUPABASE_ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    info "Backup créé"
    
    # Mettre à jour les URLs
    sed -i "s|API_EXTERNAL_URL=.*|API_EXTERNAL_URL=https://$API_DOMAIN|g" "$SUPABASE_ENV_FILE"
    sed -i "s|SUPABASE_PUBLIC_URL=.*|SUPABASE_PUBLIC_URL=https://$API_DOMAIN|g" "$SUPABASE_ENV_FILE"
    
    # Ajouter les redirections si elles n'existent pas
    if ! grep -q "ADDITIONAL_REDIRECT_URLS" "$SUPABASE_ENV_FILE"; then
        echo "" >> "$SUPABASE_ENV_FILE"
        echo "# URLs de redirection HTTPS" >> "$SUPABASE_ENV_FILE"
        echo "ADDITIONAL_REDIRECT_URLS=https://$API_DOMAIN" >> "$SUPABASE_ENV_FILE"
    else
        # Ajouter le nouveau domaine aux redirections existantes
        if ! grep -q "$API_DOMAIN" "$SUPABASE_ENV_FILE"; then
            sed -i "s|ADDITIONAL_REDIRECT_URLS=\(.*\)|ADDITIONAL_REDIRECT_URLS=\1,https://$API_DOMAIN|g" "$SUPABASE_ENV_FILE"
        fi
    fi
    
    info "Configuration Supabase mise à jour"
    
    # Redémarrer Supabase si docker-compose est disponible
    if command -v docker-compose &> /dev/null; then
        SUPABASE_DIR=$(dirname "$SUPABASE_ENV_FILE")
        if [ -f "$SUPABASE_DIR/docker-compose.yml" ]; then
            warn "Redémarrage de Supabase..."
            cd "$SUPABASE_DIR"
            docker-compose down
            docker-compose up -d
            info "Supabase redémarré"
        fi
    fi
else
    warn "Fichier de configuration Supabase non trouvé"
    warn "Vous devrez mettre à jour manuellement:"
    warn "  API_EXTERNAL_URL=https://$API_DOMAIN"
    warn "  SUPABASE_PUBLIC_URL=https://$API_DOMAIN"
    warn "  ADDITIONAL_REDIRECT_URLS=https://$API_DOMAIN"
fi

###############################################################################
# Étape 9: Configuration du firewall
###############################################################################

echo ""
echo "🔥 Étape 9: Configuration du firewall..."

# Détecter le firewall
if command -v ufw &> /dev/null; then
    info "Configuration UFW..."
    ufw allow 80/tcp
    ufw allow 443/tcp
    info "Ports 80 et 443 ouverts"
elif command -v firewall-cmd &> /dev/null; then
    info "Configuration firewalld..."
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    info "Ports 80 et 443 ouverts"
else
    warn "Aucun firewall détecté (ufw ou firewalld)"
fi

###############################################################################
# Étape 10: Tests de validation
###############################################################################

echo ""
echo "🧪 Étape 10: Tests de validation..."

# Test 1: Vérifier que Nginx fonctionne
if systemctl is-active --quiet nginx; then
    info "Nginx est actif"
else
    error "Nginx n'est pas actif"
fi

# Test 2: Vérifier les certificats
if certbot certificates | grep -q "$API_DOMAIN"; then
    info "Certificat SSL pour $API_DOMAIN: OK"
else
    error "Certificat SSL pour $API_DOMAIN: ERREUR"
fi

if certbot certificates | grep -q "$STUDIO_DOMAIN"; then
    info "Certificat SSL pour $STUDIO_DOMAIN: OK"
else
    error "Certificat SSL pour $STUDIO_DOMAIN: ERREUR"
fi

# Test 3: Test de connexion HTTPS
if curl -s -o /dev/null -w "%{http_code}" "https://$API_DOMAIN" | grep -q "200\|301\|302"; then
    info "Connexion HTTPS à $API_DOMAIN: OK"
else
    warn "Connexion HTTPS à $API_DOMAIN: Vérifiez manuellement"
fi

###############################################################################
# Résumé final
###############################################################################

echo ""
echo "=========================================="
echo "✅ Installation terminée avec succès !"
echo "=========================================="
echo ""
echo "📋 Résumé de la configuration:"
echo ""
echo "  🌐 API Supabase:"
echo "     HTTP:  http://$API_DOMAIN"
echo "     HTTPS: https://$API_DOMAIN"
echo ""
echo "  🎨 Studio Supabase:"
echo "     HTTP:  http://$STUDIO_DOMAIN"
echo "     HTTPS: https://$STUDIO_DOMAIN"
echo ""
echo "  🔒 Certificats SSL:"
echo "     - Renouvellement automatique configuré"
echo "     - Test: certbot renew --dry-run"
echo ""
echo "  📝 Prochaines étapes:"
echo "     1. Mettre à jour js/config.js dans votre application:"
echo "        SUPABASE_LOCAL_URL = 'https://$API_DOMAIN'"
echo ""
echo "     2. Tester la connexion:"
echo "        curl https://$API_DOMAIN"
echo ""
echo "     3. Accéder au Studio:"
echo "        https://$STUDIO_DOMAIN"
echo ""
echo "=========================================="
echo ""
