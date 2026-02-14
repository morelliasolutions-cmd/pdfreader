# Script automatique - Lit ssh-credentials.json et fait tout

Write-Host "🚀 Lecture des credentials..." -ForegroundColor Green

# Lire le JSON
$creds = Get-Content "ssh-credentials.json" | ConvertFrom-Json

$vps = "$($creds.ssh_user)@$($creds.vps_ip)"
$password = $creds.ssh_password

Write-Host "✅ Credentials lus" -ForegroundColor Green
Write-Host "📡 Connexion à: $vps" -ForegroundColor Cyan
Write-Host ""

# Créer un script bash à exécuter sur le serveur
$bashScript = @"
#!/bin/bash
set -e

echo "🚀 Installation HTTPS pour Supabase"
echo "=================================="

# Vérifications
echo "📋 Vérifications..."
whoami
docker ps | grep supabase || echo "Supabase non trouvé"

# Installer Nginx
if ! command -v nginx &> /dev/null; then
    echo "📦 Installation Nginx..."
    apt-get update -y
    apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo "✅ Nginx installé"
else
    echo "✅ Nginx déjà installé"
fi

# Installer Certbot
if ! command -v certbot &> /dev/null; then
    echo "📦 Installation Certbot..."
    apt-get install -y certbot python3-certbot-nginx
    echo "✅ Certbot installé"
else
    echo "✅ Certbot déjà installé"
fi

# Ouvrir les ports
echo "🔥 Configuration firewall..."
ufw allow 80/tcp 2>/dev/null || true
ufw allow 443/tcp 2>/dev/null || true
echo "✅ Ports ouverts"

echo ""
echo "✅ Installation de base terminée!"
echo ""
echo "📝 Pour configurer HTTPS avec domaines:"
echo "   Remplissez api_domain et studio_domain dans ssh-credentials.json"
"@

# Sauvegarder le script bash
$bashScript | Out-File -FilePath "install.sh" -Encoding utf8

Write-Host "📤 Transfert et exécution du script sur le serveur..." -ForegroundColor Cyan

# Utiliser ssh avec le script
Write-Host ""
Write-Host "⚠️  Vous allez devoir entrer le mot de passe SSH" -ForegroundColor Yellow
Write-Host "   Mot de passe: $password" -ForegroundColor Gray
Write-Host ""

# Exécuter via SSH
ssh $vps "bash -s" < install.sh

Write-Host ""
Write-Host "✅ Terminé!" -ForegroundColor Green
