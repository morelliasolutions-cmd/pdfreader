#!/usr/bin/env pwsh
# Script pour ajouter les colonnes manquantes à la table appointments

Write-Host "🔧 Ajout des colonnes manquantes à appointments..." -ForegroundColor Cyan

# Lire la migration SQL
$sqlContent = Get-Content -Path "ADD_MISSING_COLUMNS_APPOINTMENTS.sql" -Raw

# Échapper le SQL pour JSON
$sqlEscaped = $sqlContent -replace '\\', '\\' -replace '"', '\"' -replace "`n", '\n' -replace "`r", ''

# Corps de la requête
$body = @{
    query = $sqlEscaped
} | ConvertTo-Json -Compress

# Appeler l'API Supabase (nécessite SUPABASE_URL et SERVICE_ROLE_KEY dans .env)
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.+)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
        }
    }
}

$supabaseUrl = $env:SUPABASE_URL
$serviceKey = $env:SERVICE_ROLE_KEY

if (-not $supabaseUrl -or -not $serviceKey) {
    Write-Host "❌ Variables d'environnement manquantes. Veuillez exécuter :" -ForegroundColor Red
    Write-Host "   1. Ouvrez Supabase Dashboard > Settings > API" -ForegroundColor Yellow
    Write-Host "   2. Copiez le contenu du fichier ADD_MISSING_COLUMNS_APPOINTMENTS.sql" -ForegroundColor Yellow
    Write-Host "   3. Collez-le dans: SQL Editor > New query > RUN" -ForegroundColor Yellow
    exit 1
}

try {
    $response = Invoke-RestMethod `
        -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" `
        -Method POST `
        -Headers @{
            "apikey" = $serviceKey
            "Authorization" = "Bearer $serviceKey"
            "Content-Type" = "application/json"
        } `
        -Body $body
    
    Write-Host "✅ Migration appliquée avec succès !" -ForegroundColor Green
    Write-Host $response
} catch {
    Write-Host "⚠️ Erreur API. Veuillez appliquer manuellement :" -ForegroundColor Yellow
    Write-Host "   1. Ouvrez: https://supabase.com/dashboard/project/_/sql" -ForegroundColor Cyan
    Write-Host "   2. Copiez le contenu de: ADD_MISSING_COLUMNS_APPOINTMENTS.sql" -ForegroundColor Cyan
    Write-Host "   3. Exécutez-le dans SQL Editor" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
