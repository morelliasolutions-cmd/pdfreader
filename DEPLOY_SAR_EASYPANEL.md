# Déploiement du service SAR dans EasyPanel

## Pourquoi cette solution ?

Au lieu de faire un proxy vers le VPS externe (78.47.97.137:5001), on déploie le service **directement dans EasyPanel**. Cela résout le problème "Service is not reachable".

## Étapes de déploiement

### 1. Préparer le repository GitHub

Le code est déjà sur GitHub : `github.com/morelliasolutions-cmd/sarpdf`

Assurez-vous que ces fichiers sont présents :
- ✅ `extract_sar_address.py` (service Flask)
- ✅ `requirements.txt` (dépendances Python)
- ✅ `Dockerfile.sar` (configuration Docker)

### 2. Créer une nouvelle App dans EasyPanel

1. **Dashboard EasyPanel** → **Create**  **New App**
2. Choisir **GitHub Repository**
3. Connecter le repo : `morelliasolutions-cmd/sarpdf`
4. Configuration :
   - **Name** : `velox-sarpdf`
   - **Branch** : `main` (ou `master`)
   - **Dockerfile** : `Dockerfile.sar`
   - **Port** : `5001`

### 3. Configurer les variables d'environnement

Dans EasyPanel, aller dans **Environment** et ajouter :

```env
# Configuration du service
SAR_EXTRACTION_HOST=0.0.0.0
SAR_EXTRACTION_PORT=5001
SAR_EXTRACTION_DEBUG=False
SAR_EXTRACTION_PUBLIC_URL=https://velox-sarpdf.yhmr4j.easypanel.host

# Sécurité
ALLOWED_ORIGINS=https://connectfiber.yhmr4j.easypanel.host,https://agtelecom.connectfiber.ch

# Limites
MAX_UPLOAD_SIZE_MB=50
EXTRACTION_TIMEOUT_SECONDS=60

# Webhook N8N (IMPORTANT : gardez ces secrets sécurisés)
N8N_WEBHOOK_SAR_ADDRESS_URL=https://velox-n8n.yhmr4j.easypanel.host/webhook-test/sar-address-extraction
N8N_WEBHOOK_SAR_SECRET=sHmWBiGOgF8Uoqr1UXQ0k0+3dj4goqLjOzUIbd8uxHk=

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

⚠️ **IMPORTANT** : Le secret JWT ci-dessus est celui actuellement sur le VPS. Si vous voulez en générer un nouveau :

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 4. Configurer le domaine

Dans **Domains** :
- Ajouter : `velox-sarpdf.yhmr4j.easypanel.host`
- Activer **HTTPS** (Let's Encrypt automatique)

### 5. Déployer

1. Cliquer sur **Deploy**
2. Attendre que le build se termine (2-3 minutes)
3. Le service sera automatiquement démarré

### 6. Vérifier le déploiement

Une fois déployé, tester :

```bash
# Doit retourner le status du service
curl https://velox-sarpdf.yhmr4j.easypanel.host/api/health
```

**Résultat attendu** :
```json
{
  "service": "SAR Address Extraction",
  "status": "healthy",
  "version": "1.0.0",
  "max_upload_mb": 50,
  "extraction_timeout_seconds": 60
}
```

## Avantages de cette solution

✅ Pas de problème de réseau/firewall  
✅ HTTPS automatique avec Let's Encrypt  
✅ Logs centralisés dans EasyPanel  
✅ Auto-restart en cas de crash  
✅ Mise à jour facile par git push  
✅ Le service VPS (78.47.97.137:5001) peut être arrêté  

## Alternative : GitHub Actions pour auto-deploy

Si vous voulez que le service se redéploie automatiquement à chaque push :

1. EasyPanel → **App Settings** → **Webhooks**
2. Copier l'URL de webhook de déploiement
3. GitHub → **Settings** → **Webhooks** → Ajouter l'URL

## Fichiers créés

- [Dockerfile.sar](Dockerfile.sar) : Configuration Docker optimisée pour production avec gunicorn
- Ce guide : [DEPLOY_SAR_EASYPANEL.md](DEPLOY_SAR_EASYPANEL.md)

## Support

Si vous rencontrez des problèmes :
1. Vérifier les logs dans EasyPanel → **Logs**
2. Vérifier les variables d'environnement
3. Tester le endpoint `/api/health` pour le diagnostic
