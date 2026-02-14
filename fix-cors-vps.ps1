# Script pour corriger la configuration CORS sur le VPS
# Usage: Exécuter ce script pour mettre à jour les origines autorisées

Write-Host "🔧 Mise à jour de la configuration CORS sur le VPS..." -ForegroundColor Cyan

# Connexion SSH et mise à jour
$commands = @"
cd /var/www/agtelecom
sed -i 's|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://connectfiber.yhmr4j.easypanel.host,https://agtelecom.connectfiber.ch|' .env
systemctl restart sar-extraction
echo '✅ CORS mis à jour et service redémarré'
systemctl status sar-extraction --no-pager
"@

Write-Host "Connexion au VPS 78.47.97.137..." -ForegroundColor Yellow
ssh root@78.47.97.137 $commands

Write-Host ""
Write-Host "✅ Si pas d'erreurs, le CORS est maintenant configuré pour:" -ForegroundColor Green
Write-Host "   - https://connectfiber.yhmr4j.easypanel.host" -ForegroundColor White
Write-Host "   - https://agtelecom.connectfiber.ch" -ForegroundColor White
