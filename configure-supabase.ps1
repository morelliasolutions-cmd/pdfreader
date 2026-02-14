# Script de configuration automatique Supabase via SSH
# Lit ssh-credentials.json et exécute toutes les commandes

Write-Host "🚀 Configuration automatique Supabase + Nginx" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Lire les credentials
$creds = Get-Content "ssh-credentials.json" | ConvertFrom-Json
$vps_ip = $creds.vps_ip
$ssh_user = $creds.ssh_user
$ssh_password = $creds.ssh_password

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "  VPS: $ssh_user@$vps_ip" -ForegroundColor White
Write-Host ""

# Créer un script bash qui sera exécuté sur le serveur
$bashScript = @'
#!/bin/bash
set -e

echo "================================================"
echo "🚀 Configuration Nginx + Supabase"
echo "================================================"
echo ""

# Étape 1: Vérifier Supabase
echo "📋 Étape 1: Vérification Supabase..."
docker ps | grep supabase-kong > /dev/null && echo "✅ Supabase actif" || echo "❌ Supabase non trouvé"

# Étape 2: Trouver le dossier Supabase
echo ""
echo "📁 Étape 2: Localisation de la configuration..."
SUPABASE_DIR="/root/supabase/docker"
if [ -f "$SUPABASE_DIR/.env" ]; then
    echo "✅ Configuration trouvée: $SUPABASE_DIR"
else
    echo "❌ Configuration non trouvée"
    exit 1
fi

# Étape 3: Vérifier Nginx
echo ""
echo "📦 Étape 3: Vérification Nginx..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx actif"
    nginx -v
else
    echo "❌ Nginx non actif"
    exit 1
fi

# Étape 4: Supprimer la config par défaut de Nginx
echo ""
echo "🗑️  Étape 4: Nettoyage configuration Nginx par défaut..."
rm -f /etc/nginx/sites-enabled/default
echo "✅ Configuration par défaut supprimée"

# Étape 5: Créer la configuration Nginx pour Supabase API
echo ""
echo "⚙️  Étape 5: Configuration Nginx pour Supabase API..."
cat > /etc/nginx/sites-available/supabase-api << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    
    # Logs
    access_log /var/log/nginx/supabase-api-access.log;
    error_log /var/log/nginx/supabase-api-error.log;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/supabase-api /etc/nginx/sites-enabled/
echo "✅ Configuration Nginx créée"

# Étape 6: Tester la configuration Nginx
echo ""
echo "🧪 Étape 6: Test de la configuration Nginx..."
if nginx -t 2>&1; then
    echo "✅ Configuration Nginx valide"
else
    echo "❌ Configuration Nginx invalide"
    exit 1
fi

# Étape 7: Redémarrer Nginx
echo ""
echo "🔄 Étape 7: Redémarrage de Nginx..."
systemctl reload nginx
systemctl status nginx --no-pager | head -15
echo "✅ Nginx redémarré"

# Étape 8: Tester l'accès
echo ""
echo "🧪 Étape 8: Test de connexion..."
sleep 2
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80)
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "404" ] || [ "$RESPONSE" = "301" ]; then
    echo "✅ Nginx répond (HTTP $RESPONSE)"
else
    echo "⚠️  Nginx répond avec le code: $RESPONSE"
fi

# Étape 9: Afficher les URLs d'accès
echo ""
echo "================================================"
echo "✅ Configuration terminée avec succès !"
echo "================================================"
echo ""
echo "📋 URLs d'accès:"
echo ""
echo "  🌐 API Supabase:"
echo "     http://76.13.133.147"
echo "     http://localhost:8000 (depuis le serveur)"
echo ""
echo "  🎨 Studio Supabase:"
echo "     Accès direct via IP sur port 8000/studio"
echo "     ou configurez un tunnel SSH"
echo ""
echo "================================================"
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Mettez à jour js/config.js:"
echo "     SUPABASE_LOCAL_URL = 'http://76.13.133.147'"
echo ""
echo "  2. Testez depuis votre navigateur:"
echo "     http://76.13.133.147"
echo ""
echo "  3. Pour HTTPS, configurez un nom de domaine"
echo ""
echo "================================================"
'@

# Sauvegarder le script bash temporaire
$scriptPath = "temp-install.sh"
$bashScript | Out-File -FilePath $scriptPath -Encoding ASCII -NoNewline

Write-Host "📤 Connexion au VPS et exécution du script..." -ForegroundColor Cyan
Write-Host ""

# Afficher la commande à exécuter
Write-Host "💡 Commande SSH à exécuter:" -ForegroundColor Yellow
Write-Host "   ssh $ssh_user@$vps_ip < $scriptPath" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Entrez le mot de passe quand demandé: $ssh_password" -ForegroundColor Yellow
Write-Host ""

# Exécuter via SSH (nécessitera le mot de passe)
ssh "$ssh_user@$vps_ip" "bash -s" < $scriptPath

# Nettoyer
Remove-Item $scriptPath -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ Script terminé !" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Mise à jour de js/config.js..." -ForegroundColor Cyan

# Mettre à jour js/config.js
$configFile = "js/config.js"
if (Test-Path $configFile) {
    $content = Get-Content $configFile -Raw
    $content = $content -replace 'const SUPABASE_LOCAL_URL = ''http://78\.47\.97\.137:8000'';', "const SUPABASE_LOCAL_URL = 'http://76.13.133.147';"
    $content | Set-Content $configFile -NoNewline
    Write-Host "✅ js/config.js mis à jour avec la nouvelle IP" -ForegroundColor Green
} else {
    Write-Host "⚠️  Fichier js/config.js non trouvé" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Configuration complète !" -ForegroundColor Green
Write-Host "   Testez: http://76.13.133.147" -ForegroundColor White
Write-Host ""
