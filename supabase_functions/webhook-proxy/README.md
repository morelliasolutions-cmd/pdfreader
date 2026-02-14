Webhook Proxy - Edge Function (Supabase)

But: Template d'Edge Function Deno pour router/masquer les webhooks externes.

Pré-requis:
- Supabase CLI installé
- Projet Supabase avec accès à deploy des Edge Functions

Installation & déploiement:

1. Préparer la configuration des webhooks (JSON) et l'ajouter aux secrets de l'Edge Function:

```bash
# Exemple: exporter le fichier JSON en variable
WEBHOOKS_JSON=$(cat webhooks.example.json)
# Définir le secret dans Supabase (remplacez <project-ref>)
supabase secrets set WEBHOOKS_CONFIG="$WEBHOOKS_JSON"
```

2. Déployer la fonction (depuis le répertoire `supabase_functions/webhook-proxy`):

```bash
cd supabase_functions/webhook-proxy
supabase functions deploy webhook-proxy --project-ref <your-project-ref>
```

3. Appeler l'Edge Function depuis l'app mobile (client):

POST JSON vers: `https://<project>.functions.supabase.co/webhook-proxy`

Body attendu:
```json
{ "type": "accident", "user": "user@example.com", "payload": { ... } }
```

La fonction ajoutera les en-têtes configurés et transmettra le payload vers l'URL configurée pour le `type`.

Sécurité:
- Les secrets (WEBHOOKS_CONFIG) sont stockés via `supabase secrets set` et accessibles seulement aux fonctions déployées.
- Pour ajouter une couche d'auth côté client, utilisez `Authorization: Bearer <token>` vers l'Edge Function et validez ce token côté fonction.

Limites:
- Cette fonction est un proxy simple. Pour uploads de photos, implémentez un upload direct vers Supabase Storage et transmettez les URLs dans le payload.

