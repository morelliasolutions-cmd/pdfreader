# Configuration des Webhooks - Supabase Edge Function

## ✅ État Actuel

### Edge Function Déployée
- **Nom:** `webhook-proxy`
- **Projet:** ConnectFiber (`wdurkaelytgjbcsmkzgb`)
- **URL:** `https://wdurkaelytgjbcsmkzgb.supabase.co/functions/v1/webhook-proxy`
- **Statut:** ✅ ACTIVE
- **Version:** 1
- **JWT Verification:** Désactivée (pour permettre les appels publics)

### Webhooks Configurés

Les webhooks sont configurés dans [webhooks.example.json](webhooks.example.json) et pointent vers:
- **URL cible:** `https://velox-n8n.yhmr4j.easypanel.host/webhook-test/d056056b-764f-4aff-a551-3e1091661654`
- **Authorization:** `Bearer e5362baf-c777-4d57-a609-6eaf1f9e87f6`

#### Types de webhooks:
1. **expense** - Note de frais (page: acceuil_Personnel.html)
2. **accident** - Signalement d'accident (page: acceuil_Personnel.html)
3. **breakdown** - Déclaration de panne (page: acceuil_Personnel.html)
4. **timesheet_sign** - Notification signature du pointage mensuel (page: acceuil_Personnel.html)

## 🔧 Configuration Manuelle du Secret

### Option 1: Via Supabase CLI (recommandé)

```bash
# 1. Se connecter à Supabase
supabase login

# 2. Configurer le secret WEBHOOKS_CONFIG
# Windows PowerShell:
$content = Get-Content 'webhooks.example.json' -Raw -Encoding UTF8 | ConvertFrom-Json | ConvertTo-Json -Compress
supabase secrets set --project-ref wdurkaelytgjbcsmkzgb WEBHOOKS_CONFIG="$content"

# Linux/Mac:
export WEBHOOKS_CONFIG=$(cat webhooks.example.json)
supabase secrets set --project-ref wdurkaelytgjbcsmkzgb WEBHOOKS_CONFIG="$WEBHOOKS_CONFIG"
```

### Option 2: Via Dashboard Supabase

1. Aller sur https://supabase.com/dashboard/project/wdurkaelytgjbcsmkzgb/settings/functions
2. Sélectionner la fonction `webhook-proxy`
3. Ajouter un nouveau secret:
   - **Nom:** `WEBHOOKS_CONFIG`
   - **Valeur:** Le contenu complet de `webhooks.example.json` (format JSON compressé)

### Option 3: Via Access Token

```bash
# Obtenir un access token depuis: https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="votre-token-ici"

# Puis exécuter la commande secrets set
supabase secrets set --project-ref wdurkaelytgjbcsmkzgb WEBHOOKS_CONFIG="$(cat webhooks.example.json)"
```

## 📱 Intégration Client

La page [App mobile/acceuil_Personnel.html](App mobile/acceuil_Personnel.html) a été mise à jour pour utiliser l'Edge Function proxy:

```javascript
// La fonction triggerWebhook envoie maintenant les données via l'Edge Function
window.triggerWebhook = async function(type, payload = {}) {
    const WEBHOOK_PROXY_URL = 'https://wdurkaelytgjbcsmkzgb.supabase.co/functions/v1/webhook-proxy';
    
    const response = await fetch(WEBHOOK_PROXY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.supabaseClient?.supabaseKey || ''}`
        },
        body: JSON.stringify({
            type: type,
            user: window.currentEmployee?.email || 'unknown',
            payload: payload
        })
    });
}
```

## 🔒 Sécurité

### Avantages de l'Edge Function Proxy
✅ Les secrets (URLs et tokens) ne sont **jamais exposés** côté client  
✅ Tous les webhooks passent par un point unique et sécurisé  
✅ Possibilité d'ajouter des validations, logs, rate-limiting  
✅ Headers d'authentification configurés de manière centralisée  

### Format de Requête

**Client → Edge Function:**
```json
{
  "type": "accident",
  "user": "technicien@velox.com",
  "payload": {
    "address": "12 rue de la Fibre",
    "photos": ["url1", "url2"]
  }
}
```

**Edge Function → N8N:**
```json
{
  "forwarded_at": "2026-01-09T10:30:00.000Z",
  "source": "velox-mobile",
  "type": "accident",
  "user": "technicien@velox.com",
  "payload": {
    "address": "12 rue de la Fibre",
    "photos": ["url1", "url2"]
  }
}
```

## 🧪 Test

Pour tester l'Edge Function:

```bash
curl -X POST https://wdurkaelytgjbcsmkzgb.supabase.co/functions/v1/webhook-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "type": "expense",
    "user": "test@example.com",
    "payload": {
      "amount": 50,
      "description": "Test"
    }
  }'
```

## 📚 Documentation Complète

- [DOCUMENTATION_PROFIL_PERSONNEL.md](App mobile/DOCUMENTATION_PROFIL_PERSONNEL.md) - Documentation de la page profil
- [docs/API_WEBHOOKS_FR.md](docs/API_WEBHOOKS_FR.md) - Documentation API webhooks
- [supabase_functions/webhook-proxy/README_FR.md](supabase_functions/webhook-proxy/README_FR.md) - README Edge Function

## 🚀 Prochaines Étapes

1. ⚠️ **Configurer le secret WEBHOOKS_CONFIG** (voir section Configuration ci-dessus)
2. ✅ Tester l'envoi de webhooks depuis la page profil
3. 📊 Vérifier la réception dans N8N
4. 🔄 Ajuster les payloads si nécessaire

---

**Date de déploiement:** 9 janvier 2026  
**Projet Supabase:** ConnectFiber (wdurkaelytgjbcsmkzgb)  
**Edge Function:** webhook-proxy v1
