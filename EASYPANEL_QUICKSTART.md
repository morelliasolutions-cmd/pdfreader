# 🚀 Guide Rapide : Déployer le SAR dans EasyPanel

## Étape 1 : Copier le Dockerfile

Le [Dockerfile](Dockerfile) est prêt à l'emploi pour EasyPanel.

## Étape 2 : Créer l'App dans EasyPanel

### Configuration de base

**Dashboard EasyPanel** → **Create App** → **From Git Repository**

- **Repository** : `github.com/morelliasolutions-cmd/sarpdf`
- **Branch** : `main`
- **Build Method** : Dockerfile
- **Dockerfile Path** : `Dockerfile` (par défaut)
- **Port** : `5001`
- **App Name** : `velox-sarpdf`

### Variables d'Environnement (COPIER-COLLER)

```env
SAR_EXTRACTION_HOST=0.0.0.0
SAR_EXTRACTION_PORT=5001
SAR_EXTRACTION_DEBUG=False
SAR_EXTRACTION_PUBLIC_URL=https://velox-sarpdf.yhmr4j.easypanel.host
ALLOWED_ORIGINS=https://connectfiber.yhmr4j.easypanel.host,https://agtelecom.connectfiber.ch
MAX_UPLOAD_SIZE_MB=50
EXTRACTION_TIMEOUT_SECONDS=60
N8N_WEBHOOK_SAR_ADDRESS_URL=https://velox-n8n.yhmr4j.easypanel.host/webhook-test/sar-address-extraction
N8N_WEBHOOK_SAR_SECRET=sHmWBiGOgF8Uoqr1UXQ0k0+3dj4goqLjOzUIbd8uxHk=
LOG_LEVEL=INFO
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

### Domaine

- **Domain** : `velox-sarpdf.yhmr4j.easypanel.host`
- **Enable HTTPS** : ✅ OUI (Let's Encrypt automatique)

## Étape 3 : Deploy

Cliquer sur **Deploy** 🚀

Le build prendra 2-3 minutes.

## Étape 4 : Vérifier

Une fois déployé :

```bash
curl https://velox-sarpdf.yhmr4j.easypanel.host/api/health
```

**Résultat attendu :**
```json
{
  "service": "SAR Address Extraction",
  "status": "healthy",
  "version": "1.0.0"
}
```

## 🎉 C'est tout !

Le frontend fonctionnera automatiquement car il est déjà configuré pour utiliser ce domaine dans [js/webhook-config.js](js/webhook-config.js#L25).

---

## 🔧 Troubleshooting

### Build échoue ?
- Vérifier que `extract_sar_address.py` et `requirements.txt` sont dans le repo GitHub
- Regarder les logs de build dans EasyPanel

### Service "unhealthy" ?
- Vérifier les variables d'environnement
- Regarder les logs de l'app dans EasyPanel
- Tester : `curl https://velox-sarpdf.yhmr4j.easypanel.host/api/health`

### CORS errors ?
- Vérifier que `ALLOWED_ORIGINS` contient le domaine du frontend
- Format : URLs séparées par des virgules, sans espaces
