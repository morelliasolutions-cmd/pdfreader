# Script PowerShell pour démarrer le service d'extraction d'adresse SAR
# Auteur: ConnectFiber / Morellia
# Date: 2026-02-14

Write-Host "🚀 Démarrage du service d'extraction d'adresse SAR" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Python est installé
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Host "❌ Python n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "   Installez Python depuis https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

$pythonVersion = python --version
Write-Host "✅ Python détecté: $pythonVersion" -ForegroundColor Green

# Vérifier que les dépendances sont installées
Write-Host ""
Write-Host "📦 Vérification des dépendances..." -ForegroundColor Yellow

$pipList = pip list 2>&1 | Out-String

$dependencies = @{
    "flask" = $false
    "flask-cors" = $false
    "pdfplumber" = $false
}

foreach ($dep in $dependencies.Keys) {
    if ($pipList -match $dep) {
        $dependencies[$dep] = $true
        Write-Host "   ✅ $dep installé" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $dep manquant" -ForegroundColor Red
    }
}

# Installer les dépendances manquantes
$missingDeps = $dependencies.Keys | Where-Object { -not $dependencies[$_] }
if ($missingDeps.Count -gt 0) {
    Write-Host ""
    Write-Host "📦 Installation des dépendances manquantes..." -ForegroundColor Yellow
    
    if (Test-Path "requirements.txt") {
        pip install -r requirements.txt
    } else {
        Write-Host "❌ Fichier requirements.txt introuvable" -ForegroundColor Red
        Write-Host "   Installez manuellement: pip install flask flask-cors pdfplumber" -ForegroundColor Yellow
        exit 1
    }
}

# Vérifier que le fichier extract_sar_address.py existe
if (-not (Test-Path "extract_sar_address.py")) {
    Write-Host ""
    Write-Host "❌ Fichier extract_sar_address.py introuvable" -ForegroundColor Red
    Write-Host "   Assurez-vous d'être dans le bon répertoire" -ForegroundColor Yellow
    exit 1
}

# Afficher les informations de démarrage
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🌐 Service d'extraction d'adresse SAR                       ║" -ForegroundColor Cyan
Write-Host "║                                                               ║" -ForegroundColor Cyan
Write-Host "║  📡 URL du serveur: http://localhost:5001                    ║" -ForegroundColor Cyan
Write-Host "║  📋 Endpoint API: /api/extract-sar-address                   ║" -ForegroundColor Cyan
Write-Host "║  💚 Health check: /api/health                                ║" -ForegroundColor Cyan
Write-Host "║                                                               ║" -ForegroundColor Cyan
Write-Host "║  📄 Documentation: SAR_EXTRACTION_README.md                  ║" -ForegroundColor Cyan
Write-Host "║  🛑 Arrêter le serveur: Ctrl+C                               ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Attendre 2 secondes pour que l'utilisateur puisse lire
Start-Sleep -Seconds 2

# Démarrer le serveur
Write-Host "🎬 Démarrage du serveur..." -ForegroundColor Green
Write-Host ""

try {
    python extract_sar_address.py
} catch {
    Write-Host ""
    Write-Host "❌ Erreur lors du démarrage du serveur" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Yellow
    exit 1
}
