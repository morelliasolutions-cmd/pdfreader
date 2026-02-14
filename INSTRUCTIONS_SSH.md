# 🔐 Instructions pour la Configuration SSH Automatique

## 📋 Étapes

### 1️⃣ Remplir le fichier `ssh-config.txt`

Ouvrez le fichier **`ssh-config.txt`** et remplissez les informations suivantes :

```txt
VPS_IP=76.13.133.147
SSH_USER=root
SSH_PASSWORD=VOTRE_MOT_DE_PASSE_ICI
SSH_PORT=22

# Si vous avez des domaines :
API_DOMAIN=api.votredomaine.com
STUDIO_DOMAIN=studio.votredomaine.com
EMAIL_CERTBOT=votre@email.com

# Chemin Supabase (si vous le connaissez)
SUPABASE_PATH=/opt/supabase
```

### 2️⃣ Me dire quand c'est fait

Une fois le fichier rempli, dites-moi **"c'est fait"** ou **"go"** et je vais :

1. ✅ Lire le fichier de configuration
2. ✅ Me connecter automatiquement au VPS
3. ✅ Installer Nginx et Certbot
4. ✅ Configurer HTTPS automatiquement
5. ✅ Mettre à jour Supabase
6. ✅ Tout tester

## 🔒 Sécurité

- ✅ Le fichier `ssh-config.txt` est dans `.gitignore` (ne sera pas commité)
- ⚠️ Ne partagez JAMAIS ce fichier
- ⚠️ Supprimez-le après utilisation si vous voulez

## 🚀 Ce que je vais faire automatiquement

1. **Vérification** de l'état actuel
2. **Installation** de Nginx et Certbot
3. **Configuration** des domaines et SSL
4. **Mise à jour** de Supabase pour HTTPS
5. **Tests** de validation

## ❓ Questions ?

- **Pas de domaine ?** Pas de problème, on peut utiliser l'IP avec un certificat auto-signé ou configurer plus tard
- **Mot de passe oublié ?** Utilisez une clé SSH si vous préférez
- **Port différent ?** Modifiez `SSH_PORT` dans le fichier

---

**Remplissez `ssh-config.txt` et dites-moi quand c'est prêt !** 🚀
