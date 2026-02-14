# Script pour vérifier la configuration du service SAR sur le VPS
# et diagnostiquer pourquoi EasyPanel ne peut pas l'atteindre

Write-Host "🔍 Diagnostic de la configuration du service SAR" -ForegroundColor Cyan
Write-Host ""

# Commandes à exécuter sur le VPS
$diagnosticCommands = @"
echo '=== 1. Vérification du statut du service ==='
systemctl status sar-extraction --no-pager

echo ''
echo '=== 2. Vérification de l interface réseau (port 5001) ==='
netstat -tlnp | grep 5001 || ss -tlnp | grep 5001

echo ''
echo '=== 3. Contenu du fichier .env ==='
cat /var/www/agtelecom/.env | grep -v SECRET | grep -v WEBHOOK

echo ''
echo '=== 4. Test local du service ==='
curl -s http://localhost:5001/api/health | jq . || curl -s http://localhost:5001/api/health

echo ''
echo '=== 5. Test depuis IP publique ==='
curl -s http://78.47.97.137:5001/api/health | jq . || curl -s http://78.47.97.137:5001/api/health

echo ''
echo '=== 6. Vérification du firewall ==='
ufw status || iptables -L -n | grep 5001

echo ''
echo '=== 7. Logs récents du service ==='
journalctl -u sar-extraction --since '5 minutes ago' --no-pager | tail -20
"@

Write-Host "📋 Commandes à exécuter sur le VPS :" -ForegroundColor Yellow
Write-Host ""
Write-Host $diagnosticCommands -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Exécutez manuellement avec : ssh root@78.47.97.137" -ForegroundColor Green
Write-Host ""
Write-Host "Ou copiez-collez les commandes ci-dessus." -ForegroundColor Green
