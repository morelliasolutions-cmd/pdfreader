# Checklist : Fichiers à uploader dans le dossier public pour publication

Ce document liste les fichiers et ressources à placer dans le répertoire public (hébergement statique) pour publier l'application web.

**Principe** : ne pas exposer de clés secrètes (SERVICE_ROLE_KEY, fichiers `.env`) — uniquement la clé `anon` de Supabase côté client.

**1. Pages HTML (racine)**
- `index.html` (page d'accueil)
- `mandats.html`
- `planif.html`
- `vue-generale.html`
- toute autre page `.html` utilisée directement par les utilisateurs (ex: `dashboard.html`, `production.html`, `personnel.html`, `parametres.html`, etc.)

**2. Dossiers statiques et scripts**
- `js/` : tout le dossier JavaScript nécessaire (ex : `config.js`, `api.js`, `role-access-control.js`, scripts d'import/gestion)
- `css/` (ou styles intégrés) : si vous avez des fichiers CSS locaux
- `assets/` ou `images/` : logos, icônes, images utilisées par vos pages
- `fonts/` : si vous hébergez des polices en local
- `manifest.json` (pour PWA)
- `sw.js` (service worker, si utilisé)

**3. Librairies et dépendances**
- Si vous utilisez des CDN (recommandé pour simplicité), pas besoin d'uploader les libs externes.
- Si vous préférez l'auto-hébergement, inclure les bundles locaux : ex. `libs/xlsx.full.min.js`, `supabase-js` UMD build (si non chargé via CDN).

**4. Fichiers de configuration d’hébergement (optionnel selon la plateforme)**
- `404.html` (fallback pour pages manquantes)
- `_redirects` (Netlify) ou `vercel.json` (Vercel) ou règles `rewrites` (Firebase/GH Pages) pour SPA fallback
- `nginx.conf` ou `CNAME` si vous avez un domaine personnalisé et hébergement propre

**5. Assets additionnels**
- `robots.txt` (optionnel)
- `sitemap.xml` (optionnel)

**6. À NE PAS uploader (sécurité)**
- `.env`, `.env.local`, `setup-*.ps1` contenant des clés privées
- Tout fichier contenant `SERVICE_ROLE_KEY` ou clés admin
- Fichiers de backup contenant secrets (ex: `ssh-credentials.json` si privé)

**7. Supabase — points importants côté client**
- `js/config.js` doit contenir uniquement : `SUPABASE_URL` (endpoint) et la **clé `anon`** (SUPABASE_ANON_KEY).
- Ne jamais mettre `SERVICE_ROLE_KEY` dans les fichiers publics.
- Vérifier que `USE_LOCAL_SUPABASE` est configuré pour pointer vers l'instance Cloud en production.

**8. Règles et politiques (déploiement)**
- Activer HTTPS (obligatoire en production)
- Configurer CORS côté Supabase pour autoriser votre domaine public
- Vérifier les policies RLS (Row Level Security) : l'accès en lecture/écriture attendu pour les utilisateurs anonymes/identifiés
- Mettre des headers de cache appropriés pour les assets statiques (ex : `Cache-Control: public, max-age=31536000` pour les assets immuables)

**9. Mise en cache côté client (recommandé)**
- Si vous utilisez un cache local (ex: localStorage pour `vue-generale`), gardez la logique côté client (déjà implémenté dans `vue-generale.html`).
- Pour réduire la bande passante, servir les assets statiques compressés (gzip / brotli) côté serveur.

**10. Processus de déploiement rapide**
- Préparer un dossier `public/` contenant : toutes les pages `.html` + `js/` + `css/` + `assets/` + `manifest.json` + `sw.js`.
- Vérifier localement en ouvrant `index.html` (ou utiliser un petit serveur statique : `npx http-server public` ou `python -m http.server 8000` depuis le dossier `public`).
- Pousser le contenu sur la plateforme choisie (Netlify / Vercel / GitHub Pages / VPS + Nginx).

**11. Vérifications finales après upload**
- Ouvrir le site en HTTPS et tester : connexion Supabase, import CSV, PDF, vue générale, planning.
- Ouvrir la console navigateur et vérifier qu'aucun fichier avec une clé privée n'est chargé.
- Tester les règles RLS et CORS en production avec un utilisateur authentifié et non-authentifié.

---

Si tu veux, je peux générer automatiquement un dossier `public/` minimal avec les fichiers listés (copie des `.html`, `js/`, `manifest.json`, `sw.js`, `assets`), ou te fournir les commandes exactes pour déployer sur Netlify/Vercel/Nginx. Veux-tu que je crée aussi un petit `README_deploiement.md` avec les commandes pas-à-pas ?