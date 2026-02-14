# Import simple des donnees VPS vers Supabase local

Write-Host "Import des donnees VPS vers Supabase Local" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Chercher le fichier dans vps-export
$exportFile = Get-ChildItem -Path ".\vps-export" -Filter "*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $exportFile) {
    Write-Host "ERREUR: Aucun fichier .sql trouve dans vps-export/" -ForegroundColor Red
    exit 1
}

Write-Host "Fichier trouve: $($exportFile.Name)" -ForegroundColor Green

# Verifier que Supabase local est demarre
Write-Host ""
Write-Host "Verification de Supabase local..." -ForegroundColor Cyan
$running = docker ps --format "{{.Names}}" | Select-String "supabase-db-local"

if (-not $running) {
    Write-Host "Demarrage de Supabase local..." -ForegroundColor Yellow
    if (Test-Path ".env.local") {
        docker-compose -f docker-compose.local.yml --env-file .env.local up -d
    } else {
        docker-compose -f docker-compose.local.yml up -d
    }
    Start-Sleep -Seconds 10
}

Write-Host "Supabase local est demarre" -ForegroundColor Green

# Importer
Write-Host ""
Write-Host "Import du fichier..." -ForegroundColor Cyan
Get-Content $exportFile.FullName -Encoding UTF8 | docker exec -i supabase-db-local psql -U postgres

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Import termine avec succes !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verification:" -ForegroundColor Cyan
    docker exec -it supabase-db-local psql -U postgres -c "\dt"
} else {
    Write-Host ""
    Write-Host "ERREUR lors de l'import" -ForegroundColor Red
}
