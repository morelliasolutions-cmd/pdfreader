# 🚀 Déploiement du Service d'Extraction SAR sur VPS

## 📋 Prérequis

- VPS avec Ubuntu/Debian
- Accès SSH en root ou sudo
- Nginx installé
- Python 3.8+ installé
- Git configuré avec accès au dépôt

## 🔧 Installation Rapide

### 1. Connexion SSH au VPS

```bash
ssh root@votre-vps-ip
```

### 2. Cloner le dépôt (si première installation)

```bash
cd /var/www
git clone https://github.com/morelliasolutions-cmd/pdfreader.git agtelecom
cd agtelecom
```

### 3. Rendre le script exécutable

```bash
chmod +x deploy-sar-extraction-vps.sh
```

### 4. Exécuter le déploiement

```bash
sudo ./deploy-sar-extraction-vps.sh
```

Le script va :
- ✅ Mettre à jour le code depuis GitHub
- ✅ Créer l'environnement virtuel Python
- ✅ Installer les dépendances
- ✅ Configurer le service systemd
- ✅ Configurer Nginx comme reverse proxy
- ✅ Démarrer le service automatiquement

### 5. Configurer les variables d'environnement

```bash
nano /var/www/agtelecom/.env
```

**Variables à configurer obligatoirement** :

```bash
# URL publique du service (votre domaine)
SAR_EXTRACTION_PUBLIC_URL=https://sar-extraction.yhmr4j.easypanel.host

# Webhook n8n pour OneDrive
N8N_WEBHOOK_SAR_ADDRESS_URL=https://velox-n8n.yhmr4j.easypanel.host/webhook-test/sar-address-extraction
N8N_WEBHOOK_SAR_SECRET=votre-jwt-secret-min-32-chars

# Origines CORS autorisées (votre frontend)
ALLOWED_ORIGINS=https://connectfiber.yhmr4j.easypanel.host,https://votre-domaine.com

# Mode production
SAR_EXTRACTION_DEBUG=False
```

**Enregistrer** : `Ctrl+X`, puis `Y`, puis `Enter`

### 6. Redémarrer le service

```bash
systemctl restart sar-extraction
```

### 7. Vérifier que tout fonctionne

```bash
# Statut du service
systemctl status sar-extraction

# Logs en temps réel
journalctl -u sar-extraction -f

# Test de santé
curl http://localhost:5001/api/health
```

## 🌐 Configuration DNS/HTTPS (Optionnel mais recommandé)

### Si vous utilisez un domaine personnalisé :

1. **Ajouter un enregistrement DNS A** :
   ```
   sar-extraction.votredomaine.com → IP_VPS
   ```

2. **Installer Certbot pour HTTPS** :
   ```bash
   apt install certbot python3-certbot-nginx -y
   certbot --nginx -d sar-extraction.votredomaine.com
   ```

3. **Mettre à jour le .env** :
   ```bash
   SAR_EXTRACTION_PUBLIC_URL=https://sar-extraction.votredomaine.com
   ```

## 📊 Commandes Utiles

### Gestion du service

```bash
# Voir les logs
journalctl -u sar-extraction -f

# Statut
systemctl status sar-extraction

# Redémarrer
systemctl restart sar-extraction

# Arrêter
systemctl stop sar-extraction

# Démarrer
systemctl start sar-extraction

# Désactiver au démarrage
systemctl disable sar-extraction
```

### Mise à jour du code

```bash
cd /var/www/agtelecom
git pull origin main
systemctl restart sar-extraction
```

### Logs Nginx

```bash
# Access logs
tail -f /var/log/nginx/sar-extraction.access.log

# Error logs
tail -f /var/log/nginx/sar-extraction.error.log
```

## 🧪 Tests

### Test local (sur le VPS)

```bash
# Health check
curl http://localhost:5001/api/health

# Config
curl http://localhost:5001/api/config

# Test extraction (avec un fichier PDF)
curl -X POST http://localhost:5001/api/extract-sar-address \
  -F "pdfs=@/chemin/vers/votre/SAR.pdf"
```

### Test depuis l'extérieur

```bash
# Health check
curl https://sar-extraction.yhmr4j.easypanel.host/api/health

# Config (vérifier webhook_configured: true)
curl https://sar-extraction.yhmr4j.easypanel.host/api/config
```

## 🔐 Sécurité

### Fichiers sensibles

Le fichier `.env` contient des secrets et **NE DOIT PAS** être accessible publiquement :

```bash
# Vérifier les permissions
ls -la /var/www/agtelecom/.env

# Devrait être : -rw-r----- (640)
# Si ce n'est pas le cas :
chmod 640 /var/www/agtelecom/.env
chown www-data:www-data /var/www/agtelecom/.env
```

### Firewall

```bash
# Autoriser HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Le port 5001 doit rester INTERNE seulement (pas d'accès public)
# Nginx fait le reverse proxy
```

## 🐛 Dépannage

### Service ne démarre pas

```bash
# Voir les erreurs
journalctl -u sar-extraction -n 50

# Vérifier les dépendances Python
cd /var/www/agtelecom
source .venv/bin/activate
python -c "import flask, pdfplumber, requests"
```

### Erreur "Module not found"

```bash
cd /var/www/agtelecom
source .venv/bin/activate
pip install -r requirements.txt
systemctl restart sar-extraction
```

### Service répond sur localhost mais pas depuis l'extérieur

```bash
# Vérifier Nginx
nginx -t
systemctl status nginx

# Vérifier les logs Nginx
tail -f /var/log/nginx/error.log
```

### Webhook n8n ne fonctionne pas

```bash
# Vérifier la configuration
grep N8N_WEBHOOK /var/www/agtelecom/.env

# Tester manuellement le webhook
curl -X POST https://velox-n8n.yhmr4j.easypanel.host/webhook-test/sar-address-extraction \
  -H "Authorization: Bearer VOTRE_JWT" \
  -F "pdf=@test.pdf" \
  -F "address=Test Address" \
  -F "npa=1870" \
  -F "commune=Monthey"
```

## 📁 Structure des fichiers sur le VPS

```
/var/www/agtelecom/
├── extract_sar_address.py    # Service Flask
├── test_sar_extraction.py    # Tests
├── requirements.txt           # Dépendances Python
├── .env                       # Configuration (SECRETS)
├── .env.example              # Template
├── .venv/                    # Environnement virtuel Python
├── mandats.html              # Interface web
├── js/
│   └── webhook-config.js     # Config dynamique frontend
└── ARCHITECTURE_SAR_ONEDRIVE.md  # Documentation

/etc/systemd/system/
└── sar-extraction.service    # Service systemd

/etc/nginx/sites-available/
└── sar-extraction           # Config Nginx

/var/log/nginx/
├── sar-extraction.access.log
└── sar-extraction.error.log
```

## 🔄 Mises à jour

### Déploiement d'une nouvelle version

```bash
cd /var/www/agtelecom
git pull origin main
source .venv/bin/activate
pip install -r requirements.txt --upgrade
systemctl restart sar-extraction
```

### Réexécuter le script de déploiement

```bash
cd /var/www/agtelecom
sudo ./deploy-sar-extraction-vps.sh
```

## 📞 Support

En cas de problème :
1. Vérifier les logs : `journalctl -u sar-extraction -f`
2. Vérifier Nginx : `tail -f /var/log/nginx/sar-extraction.error.log`
3. Tester en local : `curl http://localhost:5001/api/health`
4. Vérifier le `.env` : `cat /var/www/agtelecom/.env`

---

**Date** : 2026-02-14  
**Version** : 1.0.0  
**Auteur** : ConnectFiber / Morellia
