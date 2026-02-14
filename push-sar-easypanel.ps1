# Script pour pousser les fichiers de déploiement EasyPanel sur GitHub

Write-Host "📦 Préparation du déploiement EasyPanel pour le service SAR" -ForegroundColor Cyan
Write-Host ""

# Aller dans le répertoire du projet
Set-Location "c:\Users\etien\OneDrive\Morellia\connectfiber\agtelecom"

# Ajouter les nouveaux fichiers
Write-Host "➕ Ajout des fichiers..." -ForegroundColor Yellow
git add Dockerfile.sar DEPLOY_SAR_EASYPANEL.md EASYPANEL_CONFIG_SAR.md PROBLEME_MIXED_CONTENT.md diagnostic-sar-vps.ps1

# Afficher le statut
Write-Host ""
Write-Host "📊 Statut Git :" -ForegroundColor Yellow
git status

# Commit
Write-Host ""
Write-Host "💾 Création du commit..." -ForegroundColor Yellow
git commit -m "feat: Ajout fichiers déploiement EasyPanel pour service SAR

- Dockerfile.sar avec gunicorn pour production
- Guide complet DEPLOY_SAR_EASYPANEL.md
- Documentation configuration et troubleshooting"

# Pousser sur le repo sarpdf
Write-Host ""
Write-Host "🚀 Push vers GitHub (sarpdf)..." -ForegroundColor Yellow
git push git@github.com:morelliasolutions-cmd/sarpdf.git HEAD:main

Write-Host ""
Write-Host "✅ Fichiers poussés sur GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes dans EasyPanel :" -ForegroundColor Cyan
Write-Host "  1. Create App → GitHub Repository" -ForegroundColor White
Write-Host "  2. Sélectionner: morelliasolutions-cmd/sarpdf" -ForegroundColor White
Write-Host "  3. Dockerfile: Dockerfile.sar" -ForegroundColor White
Write-Host "  4. Port: 5001" -ForegroundColor White
Write-Host "  5. Ajouter les variables d'environnement (voir DEPLOY_SAR_EASYPANEL.md)" -ForegroundColor White
Write-Host "  6. Domain: velox-sarpdf.yhmr4j.easypanel.host" -ForegroundColor White
Write-Host "  7. Deploy!" -ForegroundColor White
Write-Host ""
Write-Host "📖 Guide complet : DEPLOY_SAR_EASYPANEL.md" -ForegroundColor Gray
