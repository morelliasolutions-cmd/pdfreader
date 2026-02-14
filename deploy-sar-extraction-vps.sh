#!/bin/bash
# Script de déploiement du service d'extraction SAR sur VPS
# Usage: ./deploy-sar-extraction-vps.sh

set -e

echo "🚀 Déploiement du service d'extraction SAR sur VPS"
echo "=================================================="

# Variables de configuration
PROJECT_DIR="/var/www/agtelecom"
VENV_DIR="$PROJECT_DIR/.venv"
SERVICE_NAME="sar-extraction"
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"
NGINX_CONF="/etc/nginx/sites-available/$SERVICE_NAME"
NGINX_ENABLED="/etc/nginx/sites-enabled/$SERVICE_NAME"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de log
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier que le script est exécuté en root
if [[ $EUID -ne 0 ]]; then
   log_error "Ce script doit être exécuté en tant que root (sudo)"
   exit 1
fi

# 1. Mise à jour du code depuis GitHub
log_info "📥 Mise à jour du code depuis GitHub..."
cd "$PROJECT_DIR"
git pull origin main

# 2. Installation des dépendances Python
log_info "📦 Installation des dépendances Python..."
if [ ! -d "$VENV_DIR" ]; then
    log_info "Création de l'environnement virtuel Python..."
    python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"
pip install --upgrade pip
pip install -r requirements.txt

# 3. Vérifier que .env existe
log_info "🔐 Vérification de la configuration .env..."
if [ ! -f "$PROJECT_DIR/.env" ]; then
    log_warn "Fichier .env introuvable, copie depuis .env.example..."
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
    log_warn "⚠️ IMPORTANT: Configurez les variables dans .env avant de démarrer le service !"
    log_warn "   nano $PROJECT_DIR/.env"
    log_warn ""
    log_warn "Variables à configurer :"
    log_warn "  - N8N_WEBHOOK_SAR_ADDRESS_URL"
    log_warn "  - N8N_WEBHOOK_SAR_SECRET"
    log_warn "  - SAR_EXTRACTION_PUBLIC_URL"
    log_warn "  - ALLOWED_ORIGINS"
fi

# 4. Créer le service systemd
log_info "⚙️ Configuration du service systemd..."
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=SAR PDF Address Extraction Service
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$PROJECT_DIR
Environment="PATH=$VENV_DIR/bin"
ExecStart=$VENV_DIR/bin/python extract_sar_address.py
Restart=always
RestartSec=10

# Sécurité
PrivateTmp=yes
NoNewPrivileges=true

# Logs
StandardOutput=journal
StandardError=journal
SyslogIdentifier=sar-extraction

[Install]
WantedBy=multi-user.target
EOF

# 5. Configuration Nginx (reverse proxy)
log_info "🌐 Configuration du reverse proxy Nginx..."
cat > "$NGINX_CONF" << 'EOF'
server {
    listen 80;
    server_name sar-extraction.yhmr4j.easypanel.host;

    # Logs
    access_log /var/log/nginx/sar-extraction.access.log;
    error_log /var/log/nginx/sar-extraction.error.log;

    # Proxy vers le service Python (port 5001)
    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts pour uploads de gros fichiers
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Taille max des uploads
        client_max_body_size 50M;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://127.0.0.1:5001/api/health;
        access_log off;
    }
}
EOF

# Activer le site Nginx
if [ ! -L "$NGINX_ENABLED" ]; then
    ln -s "$NGINX_CONF" "$NGINX_ENABLED"
fi

# 6. Vérifier la configuration Nginx
log_info "🔍 Vérification de la configuration Nginx..."
nginx -t

# 7. Recharger systemd et démarrer le service
log_info "🔄 Rechargement de systemd..."
systemctl daemon-reload

log_info "▶️ Démarrage du service $SERVICE_NAME..."
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

# 8. Recharger Nginx
log_info "🔄 Rechargement de Nginx..."
systemctl reload nginx

# 9. Vérifier le statut du service
log_info "📊 Vérification du statut du service..."
sleep 2

if systemctl is-active --quiet "$SERVICE_NAME"; then
    log_info "✅ Service $SERVICE_NAME démarré avec succès !"
else
    log_error "❌ Le service $SERVICE_NAME n'a pas démarré correctement"
    log_error "Vérifiez les logs: journalctl -u $SERVICE_NAME -n 50"
    exit 1
fi

# 10. Test de santé
log_info "🏥 Test de santé du service..."
sleep 2

if curl -f http://localhost:5001/api/health > /dev/null 2>&1; then
    log_info "✅ Service répond correctement sur http://localhost:5001"
else
    log_warn "⚠️ Service ne répond pas sur http://localhost:5001"
    log_warn "Vérifiez les logs: journalctl -u $SERVICE_NAME -n 50"
fi

echo ""
echo "=================================================="
log_info "🎉 Déploiement terminé avec succès !"
echo "=================================================="
echo ""
log_info "Commandes utiles :"
echo "  • Voir les logs      : journalctl -u $SERVICE_NAME -f"
echo "  • Redémarrer         : systemctl restart $SERVICE_NAME"
echo "  • Arrêter            : systemctl stop $SERVICE_NAME"
echo "  • Statut             : systemctl status $SERVICE_NAME"
echo "  • Configurer .env    : nano $PROJECT_DIR/.env"
echo ""
log_info "URLs :"
echo "  • API Health : http://sar-extraction.yhmr4j.easypanel.host/api/health"
echo "  • API Extract: http://sar-extraction.yhmr4j.easypanel.host/api/extract-sar-address"
echo "  • API Save   : http://sar-extraction.yhmr4j.easypanel.host/api/save-sar"
echo ""
log_warn "⚠️ N'oubliez pas de configurer les variables dans .env :"
log_warn "   nano $PROJECT_DIR/.env"
echo ""
