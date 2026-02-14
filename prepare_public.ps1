# prepare_public.ps1
# Crée un dossier ./public et copie les fichiers nécessaires pour déploiement
# N'inclut PAS les fichiers secrets (.env, ssh-credentials.json, etc.)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$public = Join-Path $root 'public'

Write-Host "Création du dossier public: $public"
if (-Not (Test-Path $public)) { New-Item -ItemType Directory -Path $public | Out-Null }

# Liste des fichiers HTML à copier
$htmlFiles = @(
    'index.html',
    'mandats.html',
    'planif.html',
    'vue-generale.html',
    'dashboard.html',
    'production.html',
    'personnel.html',
    'parametres.html'
)

# Dossiers et fichiers statiques à copier (si présents)
$staticPaths = @(
    'js',
    'assets',
    'images',
    'fonts',
    'manifest.json',
    'sw.js',
    'favicon.ico',
    'robots.txt',
    'sitemap.xml'
)

# Exclusions explicites (ne pas copier)
$excludeFiles = @('*.env*','ssh-credentials.json','ssh-config.txt','SERVICE_ROLE_KEY.txt')

# Fonction utilitaire pour copier si existe
function Copy-IfExists($item, $destRoot) {
    $source = Join-Path $root $item
    if (Test-Path $source) {
        $dest = Join-Path $destRoot $item
        Write-Host "Copie: $item -> $dest"
        if (Test-Path $source -PathType Container) {
            # Dossier: copier récursivement
            Copy-Item -Path $source -Destination $dest -Recurse -Force -ErrorAction Stop
        } else {
            # Fichier
            $destDir = Split-Path -Parent $dest
            if (-Not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir | Out-Null }
            Copy-Item -Path $source -Destination $dest -Force -ErrorAction Stop
        }
    } else {
        Write-Host "Absent: $item (ignoré)" -ForegroundColor Yellow
    }
}

# Copier les fichiers HTML
foreach ($f in $htmlFiles) {
    Copy-IfExists $f $public
}

# Copier les chemins statiques
foreach ($p in $staticPaths) {
    Copy-IfExists $p $public
}

# Nettoyage: supprimer fichiers exclus du dossier public s'ils existent
foreach ($pattern in $excludeFiles) {
    $matches = Get-ChildItem -Path $public -Recurse -Force -Filter $pattern -ErrorAction SilentlyContinue
    foreach ($m in $matches) {
        Write-Host "Suppression fichier sensible dans public: $($m.FullName)" -ForegroundColor Red
        Remove-Item -Path $m.FullName -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Public build terminé. Contenu du dossier './public' :" -ForegroundColor Green
Get-ChildItem -Path $public -Recurse | ForEach-Object { Write-Host $_.FullName }

Write-Host "
Vérifiez le contenu, puis uploadez le dossier 'public' sur Hostinger." -ForegroundColor Cyan
