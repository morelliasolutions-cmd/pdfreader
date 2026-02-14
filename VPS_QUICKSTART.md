# 🚀 DÉPLOIEMENT RAPIDE SUR VPS

## Commandes à exécuter sur votre VPS

### 1. Connexion SSH

```bash
ssh root@votre-vps-ip
```

### 2. Mise à jour du code

```bash
cd /var/www/agtelecom
git pull origin main
```

### 3. Exécuter le déploiement

```bash
chmod +x deploy-sar-extraction-vps.sh
sudo ./deploy-sar-extraction-vps.sh
```

### 4. Configurer les secrets

```bash
nano /var/www/agtelecom/.env
```

**Modifier ces lignes** :
```bash
SAR_EXTRACTION_PUBLIC_URL=https://sar-extraction.yhmr4j.easypanel.host
N8N_WEBHOOK_SAR_ADDRESS_URL=https://velox-n8n.yhmr4j.easypanel.host/webhook-test/sar-address-extraction
N8N_WEBHOOK_SAR_SECRET=votre-jwt-secret-32-chars-minimum
ALLOWED_ORIGINS=https://connectfiber.yhmr4j.easypanel.host
SAR_EXTRACTION_DEBUG=False
```

**Sauvegarder** : `Ctrl+X` → `Y` → `Enter`

### 5. Redémarrer le service

```bash
systemctl restart sar-extraction
```

### 6. Vérifier que ça fonctionne

```bash
# Statut du service
systemctl status sar-extraction

# Logs en direct
journalctl -u sar-extraction -f

# Test de santé
curl http://localhost:5001/api/health
```

## ✅ C'est prêt !

Le service est maintenant accessible à :
- **API Extract** : `https://sar-extraction.yhmr4j.easypanel.host/api/extract-sar-address`
- **API Save** : `https://sar-extraction.yhmr4j.easypanel.host/api/save-sar`
- **Health Check** : `https://sar-extraction.yhmr4j.easypanel.host/api/health`

Le frontend `mandats.html` se connectera automatiquement au service !

---

📖 **Documentation complète** : Voir [DEPLOY_VPS_README.md](DEPLOY_VPS_README.md)
