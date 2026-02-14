# 🔒 Guide: Configuration HTTPS/SSL pour Supabase Local

## 🎯 Objectif

Passer de `http://78.47.97.137:8000` à `https://api.votredomaine.com` pour une configuration de production sécurisée.

---

## ⚠️ Pourquoi HTTPS est Important ?

- 🔒 **Sécurité**: Chiffrement des données en transit
- 🍪 **Cookies**: Les cookies sécurisés ne fonctionnent qu'en HTTPS
- 🌐 **Navigateurs**: Chrome/Firefox affichent des avertissements sans HTTPS
- 📱 **PWA**: Les Progressive Web Apps nécessitent HTTPS
- 🔐 **Auth**: Certaines méthodes d'authentification requièrent HTTPS

---

## 📋 Prérequis

- ✅ Un nom de domaine (ex: `votredomaine.com`)
- ✅ Accès SSH à votre VPS
- ✅ Supabase installé et fonctionnel
- ✅ Ports 80 et 443 ouverts sur le firewall

---

## 🚀 Option 1: Nginx + Let's Encrypt (Recommandé)

### Étape 1: Installer Nginx et Certbot

```bash
# Sur votre VPS (Ubuntu/Debian)
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### Étape 2: Configurer le DNS

Créez un enregistrement A dans votre DNS:
```
Type: A
Nom: api (ou supabase)
Valeur: 78.47.97.137
TTL: 3600
```

Attendez la propagation DNS (5-30 minutes):
```bash
# Vérifier la propagation
nslookup api.votredomaine.com
```

### Étape 3: Créer la Configuration Nginx

```bash
# Créer le fichier de configuration
sudo nano /etc/nginx/sites-available/supabase
```

Contenu:
```nginx
# Configuration Supabase API
server {
    listen 80;
    server_name api.votredomaine.com;

    # Redirection temporaire pour obtenir le certificat
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Configuration Supabase Studio
server {
    listen 80;
    server_name studio.votredomaine.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Étape 4: Activer la Configuration

```bash
# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/supabase /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

### Étape 5: Obtenir le Certificat SSL

```bash
# Obtenir les certificats pour API et Studio
sudo certbot --nginx -d api.votredomaine.com -d studio.votredomaine.com

# Suivre les instructions
# Choisir: Redirect HTTP to HTTPS (option 2)
```

### Étape 6: Vérification

```bash
# Vérifier le certificat
sudo certbot certificates

# Test de renouvellement automatique
sudo certbot renew --dry-run
```

---

## 🚀 Option 2: Caddy (Plus Simple)

### Étape 1: Installer Caddy

```bash
# Ubuntu/Debian
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy -y
```

### Étape 2: Configurer Caddy

```bash
sudo nano /etc/caddy/Caddyfile
```

Contenu:
```caddy
# API Supabase
api.votredomaine.com {
    reverse_proxy localhost:8000
}

# Studio Supabase
studio.votredomaine.com {
    reverse_proxy localhost:3001
}
```

### Étape 3: Redémarrer Caddy

```bash
sudo systemctl restart caddy
sudo systemctl status caddy
```

**✨ C'est tout !** Caddy obtient automatiquement les certificats SSL.

---

## 🔧 Configuration Supabase pour HTTPS

### Étape 1: Mettre à Jour les URLs

Éditez `config/supabase.env.local` sur votre VPS:

```env
# URLs avec HTTPS
API_EXTERNAL_URL=https://api.votredomaine.com
SITE_URL=https://votreapp.com
SUPABASE_PUBLIC_URL=https://api.votredomaine.com

# Redirections autorisées
ADDITIONAL_REDIRECT_URLS=https://votreapp.com,https://www.votreapp.com
```

### Étape 2: Redémarrer Supabase

```bash
cd /chemin/vers/supabase
docker-compose down
docker-compose up -d
```

---

## 💻 Mettre à Jour l'Application

### Fichier: `js/config.js`

```javascript
// Configuration Supabase Local (VPS) - PRODUCTION
const SUPABASE_LOCAL_URL = 'https://api.votredomaine.com';
const SUPABASE_LOCAL_ANON_KEY = 'VOTRE_ANON_KEY';
```

---

## ✅ Checklist de Vérification

- [ ] DNS configuré (A record)
- [ ] Propagation DNS vérifiée (`nslookup`)
- [ ] Nginx/Caddy installé et configuré
- [ ] Certificat SSL obtenu
- [ ] Supabase redémarré avec nouvelles URLs
- [ ] Application mise à jour (`js/config.js`)
- [ ] Test de connexion HTTPS
- [ ] Test d'authentification
- [ ] Renouvellement automatique configuré

---

## 🧪 Tester la Configuration HTTPS

### Test 1: Vérifier le Certificat

```bash
# Tester la connexion SSL
curl -I https://api.votredomaine.com

# Vérifier le certificat
echo | openssl s_client -servername api.votredomaine.com -connect api.votredomaine.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Test 2: Via le Navigateur

1. Ouvrez `https://api.votredomaine.com`
2. Vérifiez l'icône de cadenas dans la barre d'adresse
3. Cliquez sur le cadenas > Certificat
4. Vérifiez que le certificat est valide

### Test 3: Via l'Application

1. Ouvrez `test-supabase.html`
2. Vérifiez que l'URL affichée est `https://api.votredomaine.com`
3. Testez la connexion
4. Vérifiez qu'il n'y a pas d'avertissement de sécurité

---

## 🔄 Renouvellement Automatique des Certificats

### Let's Encrypt (Nginx)

Les certificats sont automatiquement renouvelés via cron:

```bash
# Vérifier le cron de renouvellement
sudo systemctl list-timers | grep certbot

# Tester le renouvellement
sudo certbot renew --dry-run
```

### Caddy

Caddy renouvelle automatiquement les certificats. Rien à faire ! 🎉

---

## 🆘 Dépannage

### Problème: Certificat SSL non obtenu

**Causes possibles**:
- DNS mal configuré
- Port 80 bloqué par le firewall
- Supabase déjà sur le port 80

**Solutions**:
```bash
# Vérifier les ports
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Ouvrir les ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Problème: CORS Error après passage en HTTPS

**Solution**:
Mettre à jour `ADDITIONAL_REDIRECT_URLS` dans `config/supabase.env.local`:
```env
ADDITIONAL_REDIRECT_URLS=https://votreapp.com,https://www.votreapp.com
```

### Problème: Mixed Content Warning

**Cause**: Votre app charge du contenu HTTP sur une page HTTPS

**Solution**: Vérifier tous les liens dans votre HTML:
```html
<!-- ❌ Mauvais -->
<img src="http://example.com/image.jpg">

<!-- ✅ Bon -->
<img src="https://example.com/image.jpg">
```

---

## 📊 Comparaison des Solutions

| Critère | Nginx + Let's Encrypt | Caddy |
|---------|---------------------|-------|
| **Facilité** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **SSL Auto** | ⭐⭐⭐ (via certbot) | ⭐⭐⭐⭐⭐ |
| **Documentation** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Popularité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**Recommandation**: 
- **Débutants**: Caddy
- **Production enterprise**: Nginx

---

## 📚 Ressources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Caddy Documentation](https://caddyserver.com/docs/)
- [Supabase Self-Hosting SSL](https://supabase.com/docs/guides/self-hosting/docker)

---

## 🎉 Configuration Production Complète

Après avoir suivi ce guide:

```
✅ HTTP → HTTPS automatiquement redirigé
✅ Certificats SSL valides
✅ Renouvellement automatique
✅ Sécurité maximale
✅ Compatible tous navigateurs
✅ Prêt pour la production
```

---

**Date de création**: 31 janvier 2026
**Dernière mise à jour**: 31 janvier 2026
**Testé sur**: Ubuntu 22.04 LTS
