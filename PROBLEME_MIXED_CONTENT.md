# Problème Mixed Content (HTTPS → HTTP)

## Situation actuelle

- **Frontend** : `https://agtelecom.connectfiber.ch` (HTTPS ✅)
- **Backend SAR** : `http://78.47.97.137:5001` (HTTP ⚠️)

## Problème

Les navigateurs modernes bloquent les requêtes HTTP depuis des pages HTTPS pour des raisons de sécurité ("Mixed Content").

**Erreur attendue** :
```
Mixed Content: The page at 'https://agtelecom.connectfiber.ch' was loaded over HTTPS, 
but requested an insecure resource 'http://78.47.97.137:5001/api/extract-sar-address'. 
This request has been blocked; the content must be served over HTTPS.
```

## Solutions

### Solution 1 : Configurer EasyPanel (RECOMMANDÉ) ⭐

Configurer le domaine `sarpdf.yhmr4j.easypanel.host` dans EasyPanel pour router vers le VPS port 5001 avec HTTPS automatique.

**Avantages** :
- HTTPS automatique avec certificat SSL
- Pas de modification de code nécessaire
- Solution pérenne

**Étapes** :
1. Se connecter à EasyPanel
2. Créer une nouvelle application ou service
3. Router `sarpdf.yhmr4j.easypanel.host` → `78.47.97.137:5001`
4. Activer HTTPS (Let's Encrypt automatique)

Une fois configuré, changer dans [js/webhook-config.js](js/webhook-config.js#L24) :
```javascript
prod: 'https://sarpdf.yhmr4j.easypanel.host'
```

---

### Solution 2 : HTTPS sur VPS avec Nginx + Certbot

Mettre en place un reverse proxy Nginx avec certificat SSL sur le VPS.

**Avantages** :
- Contrôle total
- Performance optimale

**Inconvénients** :
- Configuration manuelle
- Maintenance des certificats
- Port 80 actuellement occupé par Docker

**Script disponible** : Voir `install-https-supabase.sh`

---

### Solution 3 : Test temporaire en développement

Pour tester localement sans HTTPS :

```powershell
# Lancer le frontend en HTTP local
http-server . -p 8080

# Ouvrir http://localhost:8080/mandats.html
```

---

### Solution 4 : Désactiver protection Mixed Content (TEMPORAIRE) ⚠️

**Chrome** :
```
chrome.exe --disable-web-security --user-data-dir="C:\temp\chrome-dev"
```

**Edge** :
```
msedge.exe --disable-web-security --user-data-dir="C:\temp\edge-dev"
```

⚠️ **ATTENTION** : À utiliser UNIQUEMENT pour tester en développement, jamais en production !

---

## État actuel du code

| Fichier | URL configurée |
|---------|----------------|
| [js/webhook-config.js](js/webhook-config.js#L24) | `http://78.47.97.137:5001` |
| [mandats.html](mandats.html#L1294) (fallback) | `http://78.47.97.137:5001/api/extract-sar-address` |
| [mandats.html](mandats.html#L1470) (fallback save) | `http://78.47.97.137:5001/api/save-sar`|

## Test de connexion

```powershell
# Vérifier que le service répond
curl http://78.47.97.137:5001/api/health

# Résultat attendu :
# HTTP/1.1 200 OK
# Access-Control-Allow-Origin: https://agtelecom.connectfiber.ch
```

## Recommandation

👉 **Utiliser la Solution 1** (Configurer EasyPanel) pour une solution professionnelle et sécurisée.
