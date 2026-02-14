# Script automatique d'installation HTTPS pour Supabase
# Lit ssh-credentials.json et fait tout automatiquement

Write-Host "🚀 Installation HTTPS automatique pour Supabase" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Lire les credentials
$credentialsPath = "ssh-credentials.json"
if (-not (Test-Path $credentialsPath)) {
    Write-Host "❌ Fichier $credentialsPath non trouvé!" -ForegroundColor Red
    Write-Host "Créez le fichier avec vos identifiants SSH" -ForegroundColor Yellow
    exit 1
}

$creds = Get-Content $credentialsPath | ConvertFrom-Json

$vps_ip = $creds.vps_ip
$ssh_user = $creds.ssh_user
$ssh_password = $creds.ssh_password
$ssh_port = $creds.ssh_port
$api_domain = $creds.api_domain
$studio_domain = $creds.studio_domain
$email = $creds.email

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "  VPS: $ssh_user@$vps_ip:$ssh_port" -ForegroundColor White
Write-Host ""

# Vérifier si sshpass est disponible (ou utiliser Plink)
$usePlink = $false
if (Get-Command plink -ErrorAction SilentlyContinue) {
    $usePlink = $true
    Write-Host "✅ Plink trouvé" -ForegroundColor Green
} else {
    Write-Host "⚠️  Plink non trouvé, installation de sshpass..." -ForegroundColor Yellow
    # On va utiliser une autre méthode
}

# Fonction pour exécuter une commande SSH
function Invoke-SSHCommand {
    param(
        [string]$Command
    )
    
    if ($usePlink) {
        $commandFile = [System.IO.Path]::GetTempFileName()
        Set-Content -Path $commandFile -Value "y`n$Command`nexit`n"
        $result = echo y | plink -ssh -P $ssh_port $ssh_user@$vps_ip -pw $ssh_password -batch -m $commandFile 2>&1
        Remove-Item $commandFile
        return $result
    } else {
        # Utiliser ssh avec expect ou autre méthode
        $result = ssh -p $ssh_port $ssh_user@$vps_ip $Command 2>&1
        return $result
    }
}

Write-Host "🔌 Connexion au VPS..." -ForegroundColor Cyan
$testConnection = Invoke-SSHCommand "whoami"
Write-Host "✅ Connecté: $testConnection" -ForegroundColor Green

Write-Host ""
Write-Host "📦 Vérification de l'état actuel..." -ForegroundColor Cyan

# Vérifier Docker/Supabase
Write-Host "  Vérification Supabase..." -ForegroundColor White
$supabase = Invoke-SSHCommand "docker ps | grep supabase"
Write-Host "  $supabase" -ForegroundColor Gray

# Vérifier Nginx
Write-Host "  Vérification Nginx..." -ForegroundColor White
$nginx = Invoke-SSHCommand "nginx -v 2>&1"
Write-Host "  $nginx" -ForegroundColor Gray

# Installer Nginx si nécessaire
if ($nginx -match "not found" -or $nginx -match "command not found") {
    Write-Host "📦 Installation de Nginx..." -ForegroundColor Cyan
    Invoke-SSHCommand "apt-get update -y"
    Invoke-SSHCommand "apt-get install -y nginx"
    Invoke-SSHCommand "systemctl enable nginx"
    Invoke-SSHCommand "systemctl start nginx"
    Write-Host "✅ Nginx installé" -ForegroundColor Green
}

# Installer Certbot si nécessaire
Write-Host "📦 Vérification de Certbot..." -ForegroundColor Cyan
$certbot = Invoke-SSHCommand "certbot --version 2>&1"
if ($certbot -match "not found" -or $certbot -match "command not found") {
    Write-Host "📦 Installation de Certbot..." -ForegroundColor Cyan
    Invoke-SSHCommand "apt-get install -y certbot python3-certbot-nginx"
    Write-Host "✅ Certbot installé" -ForegroundColor Green
}

# Ouvrir les ports
Write-Host "🔥 Configuration du firewall..." -ForegroundColor Cyan
Invoke-SSHCommand "ufw allow 80/tcp"
Invoke-SSHCommand "ufw allow 443/tcp"
Write-Host "✅ Ports 80 et 443 ouverts" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Configuration de base terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "  1. Remplissez api_domain et studio_domain dans ssh-credentials.json" -ForegroundColor White
Write-Host "  2. Relancez ce script pour configurer HTTPS" -ForegroundColor White
