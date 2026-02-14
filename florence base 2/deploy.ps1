# Script PowerShell pour déployer Florence-2 sur GitHub Container Registry
# Étapes 2 et 3 : Build, Test et Publication

param(
    [string]$GitHubUsername = "",
    [string]$GitHubToken = "",
    [switch]$SkipTest = $false
)

Write-Host "🚀 Déploiement de Florence-2 sur GitHub Container Registry" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Docker est en cours d'exécution
Write-Host "🔍 Vérification de Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker n'est pas accessible"
    }
    Write-Host "✅ Docker est en cours d'exécution" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: Docker Desktop n'est pas démarré ou Docker n'est pas installé" -ForegroundColor Red
    Write-Host "   Veuillez démarrer Docker Desktop et réessayer" -ForegroundColor Yellow
    exit 1
}

# Étape 1: Construire l'image
Write-Host ""
Write-Host "📦 Étape 1: Construction de l'image Docker..." -ForegroundColor Cyan
docker build -t florence-2-runpod:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la construction de l'image" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Image construite avec succès: florence-2-runpod:latest" -ForegroundColor Green

# Étape 2: Tester l'image (optionnel)
if (-not $SkipTest) {
    Write-Host ""
    Write-Host "🧪 Étape 2: Test de l'image (optionnel)..." -ForegroundColor Cyan
    Write-Host "   Pour tester l'image, exécutez dans un autre terminal:" -ForegroundColor Yellow
    Write-Host "   docker run --gpus all -p 8000:8000 florence-2-runpod:latest" -ForegroundColor White
    Write-Host ""
    $test = Read-Host "Voulez-vous tester l'image maintenant? (o/N)"
    if ($test -eq "o" -or $test -eq "O") {
        Write-Host "   Démarrage du conteneur en arrière-plan..." -ForegroundColor Yellow
        $containerId = docker run -d --gpus all -p 8000:8000 florence-2-runpod:latest
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Conteneur démarré: $containerId" -ForegroundColor Green
            Write-Host "   ⏳ Attente de 30 secondes pour l'initialisation..." -ForegroundColor Yellow
            Start-Sleep -Seconds 30
            Write-Host "   🧹 Arrêt du conteneur de test..." -ForegroundColor Yellow
            docker stop $containerId | Out-Null
            docker rm $containerId | Out-Null
            Write-Host "   ✅ Test terminé" -ForegroundColor Green
        }
    }
}

# Étape 3: Publication sur GitHub Container Registry
Write-Host ""
Write-Host "📤 Étape 3: Publication sur GitHub Container Registry..." -ForegroundColor Cyan

# Demander les informations GitHub si non fournies
if ([string]::IsNullOrEmpty($GitHubUsername)) {
    $GitHubUsername = Read-Host "Entrez votre nom d'utilisateur GitHub"
}

if ([string]::IsNullOrEmpty($GitHubToken)) {
    Write-Host ""
    Write-Host "Pour créer un token GitHub:" -ForegroundColor Yellow
    Write-Host "1. Allez sur https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "2. Cliquez sur 'Generate new token (classic)'" -ForegroundColor White
    Write-Host "3. Cochez 'write:packages' et 'read:packages'" -ForegroundColor White
    Write-Host "4. Copiez le token généré" -ForegroundColor White
    Write-Host ""
    $GitHubToken = Read-Host "Entrez votre token GitHub" -AsSecureString
    $GitHubToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($GitHubToken)
    )
}

# Se connecter à GitHub Container Registry
Write-Host ""
Write-Host "🔐 Connexion à GitHub Container Registry..." -ForegroundColor Yellow
echo $GitHubToken | docker login ghcr.io -u $GitHubUsername --password-stdin

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la connexion à GitHub Container Registry" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Connecté à GitHub Container Registry" -ForegroundColor Green

# Taguer l'image
$imageTag = "ghcr.io/$GitHubUsername/florence-2-runpod:latest"
Write-Host ""
Write-Host "🏷️  Marquage de l'image: $imageTag" -ForegroundColor Yellow
docker tag florence-2-runpod:latest $imageTag

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du marquage de l'image" -ForegroundColor Red
    exit 1
}

# Publier l'image
Write-Host ""
Write-Host "📤 Publication de l'image sur GitHub..." -ForegroundColor Yellow
Write-Host "   Cela peut prendre plusieurs minutes..." -ForegroundColor Yellow
docker push $imageTag

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Image publiée avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Informations pour RunPod:" -ForegroundColor Cyan
    Write-Host "   Container Image: $imageTag" -ForegroundColor White
    Write-Host "   Handler: handler.handler" -ForegroundColor White
    Write-Host "   Port: 8000" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 URL de l'image: https://ghcr.io/$GitHubUsername/florence-2-runpod:latest" -ForegroundColor Cyan
} else {
    Write-Host "❌ Erreur lors de la publication de l'image" -ForegroundColor Red
    exit 1
}

