# Script PowerShell pour Windows - Configuration Supabase Local

Write-Host "🚀 Configuration Supabase Local" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Vérifier Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker n'est pas installé" -ForegroundColor Red
    Write-Host "Installez Docker Desktop depuis: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Docker trouvé" -ForegroundColor Green

if (-not (docker compose version 2>$null)) {
    Write-Host "❌ Docker Compose n'est pas disponible" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker Compose trouvé" -ForegroundColor Green

# Créer le fichier .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "📝 Création du fichier .env.local..." -ForegroundColor Cyan
    
    # Créer le fichier avec les valeurs par défaut
    @"
# Configuration Supabase Local
POSTGRES_PASSWORD=ae9bf4dcb11e265619953e751be5dfc5007551a1f3538e1987c1dcf8fa935433
JWT_SECRET=035f850f68ea09404e714365d937007e021a2f30b31bd4df8b0bbb717307b0998abfba6200ef58e2c748dcb40786d2e33146c7742092b64895bf1eec32677699
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q
API_EXTERNAL_URL=http://localhost:8000
SITE_URL=http://localhost:3000
ADDITIONAL_REDIRECT_URLS=http://localhost:3000,http://127.0.0.1:3000
DISABLE_SIGNUP=false
ENABLE_EMAIL_SIGNUP=true
ENABLE_PHONE_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true
ENABLE_PHONE_AUTOCONFIRM=false
JWT_EXP=3600
STUDIO_DEFAULT_ORGANIZATION=Default Organization
STUDIO_DEFAULT_PROJECT=Default Project
SUPABASE_PUBLIC_URL=http://localhost:8000
PGRST_DB_SCHEMAS=public,storage,graphql_public
PGRST_DB_EXTRA_SEARCH_PATH=public,extensions
IMGPROXY_ENABLE_WEBP_DETECTION=true
"@ | Out-File -FilePath ".env.local" -Encoding utf8
    
    Write-Host "✅ Fichier .env.local créé" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Le fichier .env.local existe déjà" -ForegroundColor Yellow
}

# Créer les dossiers nécessaires
Write-Host "📁 Création des dossiers..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "supabase\volumes\api" | Out-Null
New-Item -ItemType Directory -Force -Path "supabase\volumes\functions" | Out-Null
New-Item -ItemType Directory -Force -Path "supabase\migrations" | Out-Null
Write-Host "✅ Dossiers créés" -ForegroundColor Green

# Créer le fichier kong.yml si nécessaire
if (-not (Test-Path "supabase\volumes\api\kong.yml")) {
    Write-Host "📝 Création du fichier kong.yml..." -ForegroundColor Cyan
    
    @"
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
      - key: `${ANON_KEY}`

  - username: service_role
    keyauth_credentials:
      - key: `${SERVICE_ROLE_KEY}`
"@ | Out-File -FilePath "supabase\volumes\api\kong.yml" -Encoding utf8
    
    Write-Host "✅ Fichier kong.yml créé" -ForegroundColor Green
}

# Vérifier si Supabase est déjà en cours d'exécution
$running = docker ps --format "{{.Names}}" | Select-String "supabase"
if ($running) {
    Write-Host "⚠️  Supabase semble déjà être en cours d'exécution" -ForegroundColor Yellow
    $restart = Read-Host "Voulez-vous le redémarrer ? (y/n)"
    if ($restart -eq "y" -or $restart -eq "Y") {
        Write-Host "🛑 Arrêt de Supabase..." -ForegroundColor Cyan
        docker compose -f docker-compose.local.yml down
    }
}

# Démarrer Supabase
Write-Host "🚀 Démarrage de Supabase..." -ForegroundColor Cyan
docker compose -f docker-compose.local.yml --env-file .env.local up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Supabase démarré" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "⏳ Attente du démarrage des services..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    Write-Host ""
    Write-Host "=================================" -ForegroundColor Green
    Write-Host "✅ Configuration terminée !" -ForegroundColor Green
    Write-Host "=================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 URLs d'accès:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  🌐 API Supabase:" -ForegroundColor White
    Write-Host "     http://localhost:8000" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  🎨 Supabase Studio:" -ForegroundColor White
    Write-Host "     http://localhost:3001" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  🗄️  PostgreSQL:" -ForegroundColor White
    Write-Host "     localhost:54322" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📝 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  1. Créer les tables SQL:" -ForegroundColor White
    Write-Host "     docker exec -i supabase-db-local psql -U postgres < create_all_tables.sql" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Configurer les RLS:" -ForegroundColor White
    Write-Host "     docker exec -i supabase-db-local psql -U postgres < SETUP_RLS.sql" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Créer votre utilisateur admin:" -ForegroundColor White
    Write-Host "     Ouvrez admin-create-user.html" -ForegroundColor Gray
    Write-Host ""
    Write-Host "=================================" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "❌ Erreur lors du démarrage de Supabase" -ForegroundColor Red
    Write-Host "Vérifiez les logs: docker compose -f docker-compose.local.yml logs" -ForegroundColor Yellow
    exit 1
}
