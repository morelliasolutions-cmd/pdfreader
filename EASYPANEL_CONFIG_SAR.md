# Configuration EasyPanel pour le service SAR

## Situation actuelle

- ✅ Service SAR : tourne sur **78.47.97.137:5001** (vérifié fonctionnel)
- ❌ Domaine `velox-sarpdf.yhmr4j.easypanel.host` : pointe vers un autre service (gunicorn qui retourne 404)

## Configuration requise dans EasyPanel

### Option 1 : Application proxy/reverse proxy (RECOMMANDÉ)

Dans EasyPanel, créer une nouvelle application de type **Proxy** :

1. **Dashboard** → **Create App** → **Proxy**
2. **Nom** : `velox-sarpdf`
3. **Domain** : `velox-sarpdf.yhmr4j.easypanel.host`
4. **Target** : `http://78.47.97.137:5001`
5. **Enable HTTPS** : ✅ Activé (Let's Encrypt automatique)
6. **Custom Headers** (si nécessaire) :
   - `X-Forwarded-For: $proxy_add_x_forwarded_for`
   - `X-Forwarded-Proto: $scheme`

### Option 2 : Configuration manuelle du service existant

Si le service existe déjà dans EasyPanel :

1. Aller dans **Apps** → Trouver `velox-sarpdf`
2. Aller dans **Settings** → **Deployment**
3. Vérifier/modifier :
   - **Port** : `5001`
   - **Host** : `78.47.97.137`
4. Sauvegarder et redémarrer

### Option 3 : Déployer le service directement dans EasyPanel

Au lieu d'utiliser le VPS externe, déployer le code dans EasyPanel :

1. **Create App** → **Docker**
2. Utiliser le Dockerfile du projet
3. Configurer les variables d'environnement depuis [.env](c:\\Users\\etien\\OneDrive\\Morellia\\connectfiber\\agtelecom\\.env)
4. Le domaine sera automatiquement configuré avec HTTPS

## Validation après configuration

Une fois configuré, tester :

```bash
# Doit retourner le status du service SAR
curl https://velox-sarpdf.yhmr4j.easypanel.host/api/health

# Résultat attendu :
# {
#   "service": "SAR Address Extraction",
#   "status": "healthy",
#   "version": "1.0.0",
#   ...
# }
```

## Configuration actuelle du code

Le code est déjà configuré pour utiliser ce domaine :

- [js/webhook-config.js](../js/webhook-config.js#L25) : `prod: 'https://velox-sarpdf.yhmr4j.easypanel.host'`
- [mandats.html](../mandats.html#L1294) : Fallback avec la même URL

Une fois EasyPanel configuré, tout devrait fonctionner immédiatement ! ✨

## Support

Si vous avez besoin d'aide pour la configuration EasyPanel, je peux :
1. Créer les fichiers de configuration Nginx/Traefik nécessaires
2. Créer un docker-compose.yml pour déploiement direct dans EasyPanel
3. Documenter la configuration exacte selon votre setup EasyPanel
