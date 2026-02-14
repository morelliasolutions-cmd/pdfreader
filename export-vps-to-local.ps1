# Script PowerShell pour exporter les données du VPS vers le local

$VPS_IP = "76.13.133.147"
$VPS_USER = "root"
$EXPORT_DIR = ".\vps-export"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "🚀 Export des données VPS vers Local" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

# Créer le dossier d'export
if (-not (Test-Path $EXPORT_DIR)) {
    New-Item -ItemType Directory -Path $EXPORT_DIR | Out-Null
}
Write-Host "✅ Dossier d'export créé: $EXPORT_DIR" -ForegroundColor Green

# Étape 1: Exporter la structure
Write-Host "📦 1. Export de la structure de la base de données..." -ForegroundColor Cyan
ssh ${VPS_USER}@${VPS_IP} "docker exec supabase-db pg_dump -U postgres --schema-only --no-owner --no-acl postgres" | Out-File -FilePath "$EXPORT_DIR\schema_${TIMESTAMP}.sql" -Encoding utf8
Write-Host "✅ Structure exportée" -ForegroundColor Green

# Étape 2: Exporter les données
Write-Host "📦 2. Export des données..." -ForegroundColor Cyan
ssh ${VPS_USER}@${VPS_IP} "docker exec supabase-db pg_dump -U postgres --data-only --no-owner --no-acl postgres" | Out-File -FilePath "$EXPORT_DIR\data_${TIMESTAMP}.sql" -Encoding utf8
Write-Host "✅ Données exportées" -ForegroundColor Green

# Étape 3: Exporter les tables spécifiques
Write-Host "📦 3. Export des tables spécifiques..." -ForegroundColor Cyan
$TABLES = @("employees", "user_roles", "interventions", "orders", "appointments", "absences", "time_entries", "events")

foreach ($table in $TABLES) {
    Write-Host "   Export de la table: $table" -ForegroundColor Gray
    ssh ${VPS_USER}@${VPS_IP} "docker exec supabase-db pg_dump -U postgres --table=public.$table --data-only --no-owner --no-acl postgres" 2>$null | Out-File -FilePath "$EXPORT_DIR\table_${table}_${TIMESTAMP}.sql" -Encoding utf8
}

# Étape 4: Créer le script d'import
Write-Host "📦 4. Création du script d'import..." -ForegroundColor Cyan
$importScript = @"
# Script d'import des données VPS vers Supabase local
# Généré le: $(Get-Date)

Write-Host "📥 Import des données VPS vers Supabase local" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""

# Vérifier que Supabase local est démarré
`$running = docker ps --format "{{.Names}}" | Select-String "supabase-db-local"
if (-not `$running) {
    Write-Host "❌ Supabase local n'est pas démarré" -ForegroundColor Red
    Write-Host "Démarrez-le avec: docker-compose -f docker-compose.local.yml up -d" -ForegroundColor Yellow
    exit 1
}

# Importer la structure
Write-Host "📋 Import de la structure..." -ForegroundColor Cyan
Get-Content "schema_${TIMESTAMP}.sql" | docker exec -i supabase-db-local psql -U postgres

# Importer les données
Write-Host "📊 Import des données..." -ForegroundColor Cyan
Get-Content "data_${TIMESTAMP}.sql" | docker exec -i supabase-db-local psql -U postgres

Write-Host ""
Write-Host "✅ Import terminé !" -ForegroundColor Green
Write-Host ""
Write-Host "Vérifiez les données:" -ForegroundColor Cyan
Write-Host "  docker exec -it supabase-db-local psql -U postgres -c '\dt'" -ForegroundColor Gray
"@

$importScript | Out-File -FilePath "$EXPORT_DIR\import_all_${TIMESTAMP}.ps1" -Encoding utf8
Write-Host "✅ Script d'import créé" -ForegroundColor Green

# Résumé
Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "✅ Export terminé !" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Fichiers exportés dans: $EXPORT_DIR" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Pour importer en local:" -ForegroundColor Yellow
Write-Host "   1. Assurez-vous que Supabase local est démarré" -ForegroundColor White
Write-Host "   2. Allez dans le dossier: cd $EXPORT_DIR" -ForegroundColor White
Write-Host "   3. Exécutez: .\import_all_${TIMESTAMP}.ps1" -ForegroundColor White
Write-Host ""
