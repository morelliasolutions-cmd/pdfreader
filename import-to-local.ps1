# Script d'import des données exportées du VPS vers Supabase local

Write-Host "📥 Import des données VPS vers Supabase Local" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""

# Chercher les fichiers d'export
$exportFiles = @()
$possiblePaths = @(
    ".\vps-export",
    ".\export",
    ".\backup",
    ".\supabase-export",
    "."
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $files = Get-ChildItem -Path $path -Filter "*.sql*" -Recurse -ErrorAction SilentlyContinue
        if ($files) {
            $exportFiles += $files
            Write-Host "✅ Fichiers trouvés dans: $path" -ForegroundColor Green
        }
    }
}

if ($exportFiles.Count -eq 0) {
    Write-Host "❌ Aucun fichier d'export trouvé !" -ForegroundColor Red
    Write-Host ""
    Write-Host "Cherchez dans ces dossiers:" -ForegroundColor Yellow
    foreach ($path in $possiblePaths) {
        Write-Host "  - $path" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "Ou placez vos fichiers .sql ou .sql.gz dans le dossier vps-export/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 Fichiers trouvés:" -ForegroundColor Cyan
foreach ($file in $exportFiles) {
    Write-Host "  - $($file.FullName)" -ForegroundColor White
}

# Vérifier que Supabase local est démarré
Write-Host ""
Write-Host "🔍 Vérification de Supabase local..." -ForegroundColor Cyan
$running = docker ps --format "{{.Names}}" | Select-String "supabase-db-local"
if (-not $running) {
    Write-Host "⚠️  Supabase local n'est pas démarré" -ForegroundColor Yellow
    Write-Host "Démarrage de Supabase local..." -ForegroundColor Cyan
    
    if (Test-Path "docker-compose.local.yml") {
        if (Test-Path ".env.local") {
            docker-compose -f docker-compose.local.yml --env-file .env.local up -d
        } else {
            docker-compose -f docker-compose.local.yml up -d
        }
        Start-Sleep -Seconds 10
    } else {
        Write-Host "❌ docker-compose.local.yml non trouvé !" -ForegroundColor Red
        Write-Host "Exécutez d'abord setup-local.ps1" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "✅ Supabase local est démarré" -ForegroundColor Green

# Trouver le fichier principal (le plus récent ou le plus gros)
$mainFile = $exportFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1

Write-Host ""
Write-Host "📦 Import du fichier: $($mainFile.Name)" -ForegroundColor Cyan
Write-Host ""

# Vider la base locale d'abord (optionnel)
$clear = Read-Host "Voulez-vous vider la base locale avant l'import ? (y/n)"
if ($clear -eq "y" -or $clear -eq "Y") {
    Write-Host "🗑️  Vidage de la base locale..." -ForegroundColor Yellow
    docker exec -it supabase-db-local psql -U postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    Write-Host "✅ Base vidée" -ForegroundColor Green
}

# Importer selon le type de fichier
if ($mainFile.Name -like "*.gz") {
    Write-Host "📥 Décompression et import..." -ForegroundColor Cyan
    # Sur Windows, on peut utiliser 7-Zip ou gunzip si disponible
    if (Get-Command gunzip -ErrorAction SilentlyContinue) {
        gunzip -c $mainFile.FullName | docker exec -i supabase-db-local psql -U postgres
    } else {
        Write-Host "⚠️  gunzip non trouvé. Extrayez d'abord le fichier .gz manuellement" -ForegroundColor Yellow
        Write-Host "Ou installez Git Bash qui inclut gunzip" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "📥 Import du fichier SQL..." -ForegroundColor Cyan
    Get-Content $mainFile.FullName | docker exec -i supabase-db-local psql -U postgres
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Import terminé avec succès !" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 Vérification des données:" -ForegroundColor Cyan
    docker exec -it supabase-db-local psql -U postgres -c "SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';"
    docker exec -it supabase-db-local psql -U postgres -c "\dt" | Select-Object -First 20
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors de l'import" -ForegroundColor Red
    Write-Host "Verifiez les logs ci-dessus" -ForegroundColor Yellow
}
