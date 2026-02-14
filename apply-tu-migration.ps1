# Script PowerShell pour exécuter la migration SQL sur Supabase
# Ajoute les colonnes TU à la table mandats

$projectRef = "wdurkaelytgjbcsmkzgb"
$supabaseUrl = "https://$projectRef.supabase.co"

# Charger les variables d'environnement
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*)$') {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

$serviceRoleKey = $env:SERVICE_ROLE_KEY

if (-not $serviceRoleKey) {
    Write-Host "❌ SERVICE_ROLE_KEY non trouvée dans .env" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pour exécuter cette migration manuellement :" -ForegroundColor Yellow
    Write-Host "1. Connectez-vous à https://supabase.com/dashboard/project/$projectRef/editor" -ForegroundColor Cyan
    Write-Host "2. Allez dans SQL Editor" -ForegroundColor Cyan
    Write-Host "3. Copiez-collez le contenu de ADD_TU_COLUMN.sql" -ForegroundColor Cyan
    Write-Host "4. Cliquez sur 'Run'" -ForegroundColor Cyan
    exit 1
}

Write-Host "🔄 Exécution de la migration sur Supabase..." -ForegroundColor Cyan

$sql = @"
-- Ajouter la colonne TU (donneur d'ordre) à la table mandats
ALTER TABLE mandats ADD COLUMN IF NOT EXISTS tu TEXT;

-- Ajouter une colonne pour le statut de validation TU
ALTER TABLE mandats ADD COLUMN IF NOT EXISTS tu_valide BOOLEAN DEFAULT FALSE;

-- Ajouter une colonne pour la date de validation TU
ALTER TABLE mandats ADD COLUMN IF NOT EXISTS tu_date_validation TIMESTAMPTZ;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_mandats_tu ON mandats(tu);
CREATE INDEX IF NOT EXISTS idx_mandats_tu_valide ON mandats(tu_valide);
"@

$body = @{
    query = $sql
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" `
        -Method Post `
        -Headers @{
            "apikey" = $serviceRoleKey
            "Authorization" = "Bearer $serviceRoleKey"
            "Content-Type" = "application/json"
        } `
        -Body $body
    
    Write-Host "✅ Migration exécutée avec succès !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Colonnes ajoutées à la table 'mandats' :" -ForegroundColor Green
    Write-Host "  - tu (TEXT)" -ForegroundColor White
    Write-Host "  - tu_valide (BOOLEAN)" -ForegroundColor White
    Write-Host "  - tu_date_validation (TIMESTAMPTZ)" -ForegroundColor White
    Write-Host ""
    Write-Host "Index créés pour améliorer les performances." -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de l'exécution de la migration" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Exécutez la migration manuellement :" -ForegroundColor Yellow
    Write-Host "1. Connectez-vous à https://supabase.com/dashboard/project/$projectRef/editor" -ForegroundColor Cyan
    Write-Host "2. Allez dans SQL Editor" -ForegroundColor Cyan
    Write-Host "3. Copiez-collez le contenu de ADD_TU_COLUMN.sql" -ForegroundColor Cyan
    Write-Host "4. Cliquez sur 'Run'" -ForegroundColor Cyan
}
