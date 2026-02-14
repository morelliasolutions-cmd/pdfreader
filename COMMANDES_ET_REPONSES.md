# 🔧 Commandes SSH - Installation HTTPS Supabase

## Instructions
1. Connectez-vous en SSH : `ssh root@76.13.133.147`
2. Entrez le mot de passe : `Bergu29910.1`
3. Exécutez chaque commande ci-dessous UNE PAR UNE
4. Copiez la réponse et collez-la après la commande dans ce fichier

---

## ✅ Commande 1 : Vérifier la connexion
```bash
whoami
```
**Réponse :**
```
root
```

---

## ✅ Commande 2 : Vérifier Supabase
```bash
docker ps | grep supabase
```
**Réponse :**
```
root@srv1311793:~# docker ps | grep supabase
8c642f44a212   supabase/storage-api:v1.33.0             "docker-entrypoint.s…"    22 hours ago   Up 21 hours (healthy)   5000/tcp                                  
                                                                     supabase-storage
34c55f5e6583   supabase/supavisor:2.7.4                 "/usr/bin/tini -s -g…"    22 hours ago   Up 21 hours (healthy)   0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp, 0.0.0.0:6543->6543/tcp, [::]:6543->6543/tcp                       supabase-pooler
cebee6bcc33a   supabase/studio:2025.12.17-sha-43f4f7f   "docker-entrypoint.s…"    22 hours ago   Up 21 hours (healthy)   3000/tcp                                  
                                                                     supabase-studio
3942d262d5ba   supabase/logflare:1.27.0                 "sh run.sh"               22 hours ago   Up 21 hours (healthy)   0.0.0.0:4000->4000/tcp, [::]:4000->4000/tcp                                                                    supabase-analytics
2521b9e60c38   timberio/vector:0.28.1-alpine            "/usr/local/bin/vect…"    22 hours ago   Up 21 hours (healthy)                                             
                                                                     supabase-vector
24ca502d0359   kong:2.8.1                               "bash -c 'eval \"echo…"   22 hours ago   Up 21 hours (healthy)   0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 8001/tcp, 0.0.0.0:8443->8443/tcp, [::]:8443->8443/tcp, 8444/tcp   supabase-kong
b2931aedba98   supabase/postgres-meta:v0.95.1           "docker-entrypoint.s…"    23 hours ago   Up 21 hours (healthy)   8080/tcp                                  
                                                                     supabase-meta
16077343ba24   supabase/realtime:v2.68.0                "/usr/bin/tini -s -g…"    23 hours ago   Up 21 hours (healthy)                                             
                                                                     realtime-dev.supabase-realtime
2441d2106364   supabase/gotrue:v2.184.0                 "auth"                    23 hours ago   Up 21 hours (healthy)                                             
                                                                     supabase-auth
afacb5adb01f   supabase/edge-runtime:v1.69.28           "edge-runtime start …"    23 hours ago   Up 21 hours                                                       
                                                                     supabase-edge-functions
7466581fa13e   postgrest/postgrest:v14.1                "postgrest"               23 hours ago   Up 21 hours             3000/tcp                                  
                                                                     supabase-rest
0a5358b65285   supabase/postgres:15.8.1.085             "docker-entrypoint.s…"    23 hours ago   Up 21 hours (healthy)   5432/tcp                                  
                                                                     supabase-db
79217f4a5a5a   darthsim/imgproxy:v3.8.0                 "imgproxy"                23 hours ago   Up 21 hours (healthy)   8080/tcp                                  
                                                                     supabase-imgproxy
```

---

## ✅ Commande 3 : Vérifier Nginx
```bash
nginx -v
```
**Réponse :**
```
Command 'nginx' not found, but can be installed with:
apt install nginx
```

---

## ✅ Commande 4 : Vérifier Certbot
```bash
certbot --version
```
**Réponse :**
```
Command 'certbot' not found, but can be installed with:
snap install certbot  # version 5.2.2, or
apt  install certbot  # version 2.1.0-4
See 'snap info certbot' for additional versions.
```

---

## ✅ Commande 5 : Installer Nginx (si pas installé)
```bash
apt-get update && apt-get install -y nginx
```
**Réponse :**
```
c'est ok c'est fait
```

---

## ✅ Commande 6 : Démarrer Nginx
```bash
systemctl enable nginx && systemctl start nginx && systemctl status nginx
```
**Réponse :**
```
Synchronizing state of nginx.service with SysV service script with /usr/lib/systemd/systemd-sysv-install.
Executing: /usr/lib/systemd/systemd-sysv-install enable nginx
● nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/usr/lib/systemd/system/nginx.service; enabled; preset: enabled)
     Active: active (running) since Sat 2026-01-31 13:14:23 UTC; 16s ago
       Docs: man:nginx(8)
   Main PID: 3385902 (nginx)
      Tasks: 3 (limit: 9483)
     Memory: 2.4M (peak: 5.3M)
        CPU: 18ms
     CGroup: /system.slice/nginx.service
             ├─3385902 "nginx: master process /usr/sbin/nginx -g daemon on; master_process on;"
             ├─3385904 "nginx: worker process"
lines 1-11
```

---

## ✅ Commande 7 : Installer Certbot (si pas installé)
```bash
apt-get install -y certbot python3-certbot-nginx
```
**Réponse :**
```
Setting up python3-certbot-nginx (2.9.0-1) ...
Processing triggers for man-db (2.12.0-4build2) ...
Scanning processes...
Scanning linux images...

Running kernel seems to be up-to-date.

No services need to be restarted.

No containers need to be restarted.

No user sessions are running outdated binaries.

No VM guests are running outdated hypervisor (qemu) binaries on this host.
```

---

## ✅ Commande 8 : Ouvrir les ports firewall
```bash
ufw allow 80/tcp && ufw allow 443/tcp && ufw status
```
**Réponse :**
```
Rules updated
Rules updated (v6)
Rules updated
Rules updated (v6)
Status: inactive
```

---

## ✅ Commande 9 : Trouver le dossier Supabase
```bash
find / -name "supabase.env.local" 2>/dev/null | head -1
```
**Réponse :**
```
rien
```

---

## ✅ Commande 10 : Vérifier les ports Supabase
```bash
netstat -tulpn | grep -E '8000|3001|5432'
```
**Réponse :**
```
tcp        0      0 0.0.0.0:5432            0.0.0.0:*               LISTEN      1972/docker-proxy
tcp        0      0 0.0.0.0:8000            0.0.0.0:*               LISTEN      2202/docker-proxy
tcp6       0      0 :::5432                 :::*                    LISTEN      1980/docker-proxy
tcp6       0      0 :::8000                 :::*                    LISTEN      2210/docker-proxy
```

---

## 📝 Questions pour la suite :

**Avez-vous un nom de domaine configuré ?**
- [ ] Oui, j'ai un domaine
- [x] Non, je veux utiliser l'IP

**Si OUI, donnez-moi :**
- Domaine API (ex: api.votredomaine.com) : ________________
- Domaine Studio (ex: studio.votredomaine.com) : ________________
- Email pour Let's Encrypt : ________________

---

## 🚀 Après avoir rempli les réponses, dites-moi "c'est fait" et je continuerai !

---

## ✅ Commande 11 : Trouver le dossier Supabase (autre méthode)
```bash
docker inspect supabase-kong | grep -i "com.docker.compose.project.working_dir" | head -1
```
**Réponse :**
```
                "com.docker.compose.project.working_dir": "/root/supabase/docker",
```

---

## ✅ Commande 12 : Chercher les fichiers .env Supabase
```bash
find /root -name "*.env" -type f 2>/dev/null | grep -i supabase | head -3
```
**Réponse :**
```
root@srv1311793:~# docker inspect supabase-kong | grep -i "com.docker.compose.project.working_dir" | head -1
                "com.docker.compose.project.working_dir": "/root/supabase/docker",
root@srv1311793:~# find /root -name "*.env" -type f 2>/dev/null | grep -i supabase | head -3
/root/supabase/examples/slack-clone/nextjs-slack-clone-dotenvx/supabase/.env
/root/supabase/docker/.env
/root/supabase/apps/studio/.env
```

---

## ✅ Commande 13 : Vérifier le port Studio
```bash
docker port supabase-studio 2>/dev/null || docker ps --format "table {{.Names}}\t{{.Ports}}" | grep studio
```
**Réponse :**
```
rien
```

---

## ⚠️ IMPORTANT : Configuration HTTPS avec IP

**Pour HTTPS, il FAUT un nom de domaine.** Let's Encrypt ne peut pas délivrer de certificat pour une IP.

**Options :**
1. **Configurer un domaine** (recommandé) - gratuit avec des services comme DuckDNS, No-IP, ou un vrai domaine
2. **Utiliser HTTP uniquement** pour l'instant (moins sécurisé)
3. **Certificat auto-signé** (avertissement navigateur)

**Pour l'instant, je vais configurer Nginx en reverse proxy HTTP. Dites-moi si vous voulez configurer un domaine plus tard !**

---

## ✅ Commande 11 : Trouver le dossier Supabase (autre méthode)
```bash
docker inspect supabase-kong | grep -i "com.docker.compose.project.working_dir" | head -1
```
**Réponse :**
```
[COLLER LA RÉPONSE ICI]
```

---

## ✅ Commande 12 : Chercher les fichiers .env Supabase
```bash
find /root -name "*.env" -type f 2>/dev/null | grep -i supabase | head -3
```
**Réponse :**
```
[COLLER LA RÉPONSE ICI]
```

---

## ✅ Commande 13 : Vérifier le port Studio
```bash
docker port supabase-studio 2>/dev/null || docker ps --format "table {{.Names}}\t{{.Ports}}" | grep studio
```
**Réponse :**
```
[COLLER LA RÉPONSE ICI]
```

---

## ✅ Commande 14 : Configurer Nginx pour Supabase API (HTTP)
```bash
cat > /etc/nginx/sites-available/supabase-api << 'EOF'
server {
    listen 80;
    server_name 76.13.133.147;
    
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
EOF
ln -sf /etc/nginx/sites-available/supabase-api /etc/nginx/sites-enabled/
nginx -t
```
**Réponse :**
```
[COLLER LA RÉPONSE ICI]
```

---

## ✅ Commande 15 : Redémarrer Nginx
```bash
systemctl reload nginx && systemctl status nginx
```
**Réponse :**
```
[COLLER LA RÉPONSE ICI]
```

---

## ✅ Commande 16 : Tester la configuration
```bash
curl -I http://localhost:80
```
**Réponse :**
```
[COLLER LA RÉPONSE ICI]
```
