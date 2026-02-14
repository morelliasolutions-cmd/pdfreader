# Script pour mettre à jour .env.local avec les valeurs du VPS
# Basé sur vps-config/env-local-reference.txt

$envFile = ".env.local"
$referenceFile = "vps-config\env-local-reference.txt"

Write-Host "🔄 Mise à jour de .env.local avec les valeurs du VPS..." -ForegroundColor Cyan

if (-not (Test-Path $referenceFile)) {
    Write-Host "❌ Fichier de référence introuvable: $referenceFile" -ForegroundColor Red
    exit 1
}

# Lire les valeurs de référence
$referenceContent = Get-Content $referenceFile | Where-Object { $_ -notmatch '^#' -and $_ -notmatch '^$' }

# Créer ou mettre à jour .env.local
$envContent = @{}
if (Test-Path $envFile) {
    Write-Host "📖 Lecture du fichier .env.local existant..." -ForegroundColor Yellow
    Get-Content $envFile | Where-Object { $_ -notmatch '^#' -and $_ -notmatch '^$' } | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $envContent[$matches[1]] = $matches[2]
        }
    }
}

# Mettre à jour avec les valeurs de référence
$updated = 0
$referenceContent | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1]
        $value = $matches[2]
        if ($envContent.ContainsKey($key)) {
            if ($envContent[$key] -ne $value) {
                Write-Host "  ✏️  Mise à jour: $key" -ForegroundColor Yellow
                $envContent[$key] = $value
                $updated++
            }
        } else {
            Write-Host "  ➕ Ajout: $key" -ForegroundColor Green
            $envContent[$key] = $value
            $updated++
        }
    }
})

# Écrire le fichier mis à jour
$output = @()
$output += "# Configuration Supabase Local - Basée sur la config VPS"
$output += "# Généré automatiquement le $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$output += ""
$envContent.GetEnumerator() | Sort-Object Name | ForEach-Object {
    $output += "$($_.Key)=$($_.Value)"
}

$output | Out-File -FilePath $envFile -Encoding utf8

Write-Host ""
Write-Host "✅ .env.local mis à jour avec $updated modification(s)" -ForegroundColor Green
Write-Host "📝 Fichier: $envFile" -ForegroundColor Cyan
