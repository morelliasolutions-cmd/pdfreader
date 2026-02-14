# ⚠️ Configuration Urgente du Secret WEBHOOKS_CONFIG

## Problème Actuel
L'Edge Function retourne l'erreur : **"Webhooks config not set"**

Le secret `WEBHOOKS_CONFIG` doit être configuré pour que les webhooks fonctionnent.

## Solution Rapide (Dashboard Supabase)

### Étape 1 : Aller sur le Dashboard
Ouvrez ce lien directement :
👉 https://supabase.com/dashboard/project/wdurkaelytgjbcsmkzgb/settings/functions

### Étape 2 : Configurer le Secret
1. Cliquez sur la fonction **`webhook-proxy`**
2. Allez dans l'onglet **"Secrets"** ou **"Environment Variables"**
3. Cliquez sur **"Add new secret"** ou **"New Secret"**
4. Remplissez :
   - **Name (Nom)** : `WEBHOOKS_CONFIG`
   - **Value (Valeur)** : Copiez EXACTEMENT le contenu ci-dessous

### Étape 3 : Valeur du Secret
Copiez ce JSON (tout, y compris les accolades) :

```json
{"expense":{"description_fr":"Note de frais","page_associee":"acceuil_Personnel.html","url":"https://velox-n8n.yhmr4j.easypanel.host/webhook-test/d056056b-764f-4aff-a551-3e1091661654","headers":{"Authorization":"Bearer e5362baf-c777-4d57-a609-6eaf1f9e87f6","Content-Type":"application/json"}},"accident":{"description_fr":"Signalement d'accident","page_associee":"acceuil_Personnel.html","url":"https://velox-n8n.yhmr4j.easypanel.host/webhook-test/d056056b-764f-4aff-a551-3e1091661654","headers":{"Authorization":"Bearer e5362baf-c777-4d57-a609-6eaf1f9e87f6","Content-Type":"application/json"}},"breakdown":{"description_fr":"Déclaration de panne","page_associee":"acceuil_Personnel.html","url":"https://velox-n8n.yhmr4j.easypanel.host/webhook-test/d056056b-764f-4aff-a551-3e1091661654","headers":{"Authorization":"Bearer e5362baf-c777-4d57-a609-6eaf1f9e87f6","Content-Type":"application/json"}},"timesheet_sign":{"description_fr":"Notification signature du pointage mensuel","page_associee":"acceuil_Personnel.html","url":"https://velox-n8n.yhmr4j.easypanel.host/webhook-test/d056056b-764f-4aff-a551-3e1091661654","headers":{"Authorization":"Bearer e5362baf-c777-4d57-a609-6eaf1f9e87f6","Content-Type":"application/json"}}}
```

### Étape 4 : Sauvegarder
1. Cliquez sur **"Save"** ou **"Add Secret"**
2. Attendez 5-10 secondes que le secret soit propagé
3. Rechargez votre page `acceuil_Personnel.html` et testez à nouveau

## Alternative : Via CLI (si vous préférez)

Si vous avez un access token Supabase :

```powershell
# Créer un fichier temporaire avec le contenu
$content = Get-Content 'webhooks.example.json' -Raw -Encoding UTF8 | ConvertFrom-Json | ConvertTo-Json -Compress

# Définir le token
$env:SUPABASE_ACCESS_TOKEN = "votre-access-token-ici"

# Configurer le secret
supabase secrets set --project-ref wdurkaelytgjbcsmkzgb WEBHOOKS_CONFIG="$content"
```

Pour obtenir un access token : https://supabase.com/dashboard/account/tokens

## Vérification

Après avoir configuré le secret, testez à nouveau depuis `acceuil_Personnel.html`.

L'erreur **"Webhooks config not set"** devrait disparaître et vous devriez recevoir les webhooks sur N8N.

---

**Note** : Le secret contient vos URLs et tokens webhook. Ne le partagez jamais publiquement.
