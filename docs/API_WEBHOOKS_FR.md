# Webhooks & En-têtes d'authentification (API)

Ce document liste les endpoints webhook et les en-têtes d'authentification requis pour les services utilisés par l'application mobile, y compris la page `acceuil_Personnel.html`.

> Remplissez les valeurs dans `webhooks.example.json` puis stockez-les de façon sécurisée (ne pas committer en clair dans le dépôt). Vous pouvez utiliser les Secrets d'Edge Functions ou un secret manager.

## Entrées Webhook

Les clés webhook référencées par l'application :

- `expense` — Note de frais
- `accident` — Signalement d'accident (adresse, photos)
- `breakdown` — Déclaration de panne (message)
- `timesheet_sign` — Optionnel : notification lors de la signature du pointage mensuel

Chaque entrée webhook contient :
- `url` — URL complète (https://...)
- `headers` — objet clef/valeur des en-têtes HTTP à inclure dans le POST

### Exemples de payloads

- Note de frais

```json
{ "type": "expense", "user": "user@example.com", "filename": "IMG_001.jpg" }
```

- Accident

```json
{ "type": "accident", "user": "user@example.com", "address": "Rue de la Gare 15", "photos": ["img1.jpg"], "note": "..." }
```

- Panne

```json
{ "type": "breakdown", "user": "user@example.com", "breakdown_type": "mechanical", "message": "..." }
```

## Méthodes d'authentification recommandées

- Jeton Bearer : `Authorization: Bearer <token>`
- Clé statique : `X-API-Key: <key>`
- Signature HMAC : `X-Signature` (HMAC-SHA256 du body)

> Remarque : n'exposez jamais de secret directement dans l'application cliente. Utilisez une Edge Function ou un proxy serveur pour signer les requêtes.

## Format d'exemple attendu

```json
{
  "expense": { "url": "https://...", "headers": { "Authorization": "Bearer ..." } },
  "accident": { "url": "https://...", "headers": { "X-API-Key": "..." } },
  "breakdown": { "url": "https://...", "headers": { "X-API-Key": "..." } },
  "timesheet_sign": { "url": "https://...", "headers": { "Authorization": "Bearer ..." } }
}
```

## Utilisation côté client (`acceuil_Personnel.html`)

- La fonction `triggerWebhook(type, payload)` doit envoyer un POST JSON vers l'URL configurée et y ajouter les en-têtes fournis.
- Si vous utilisez une Edge Function (fortement recommandé), le client POST vers l'Edge Function et celle-ci appelle les webhooks externes en gardant les secrets côté serveur.

## Sécurité et bonnes pratiques

- Stocker les webhooks et les clés dans les Secrets d'Edge Functions (`supabase secrets set WEBHOOKS_CONFIG '<json>'`) ou dans un secret manager.
- Valider côté serveur les en-têtes d'auth et les signatures HMAC.
- Limiter le taux de requêtes (rate limiting) et protéger contre les tentatives de replay pour les endpoints sensibles.

## Prochaines étapes proposées

- Ajouter `timesheet_sign` si vous voulez notifier un canal (Slack, e-mail) lors de la signature.
- Remplacer l'implémentation d'alerte actuelle (alert) par des appels réels à l'Edge Function.

---

Fichier d'exemple : `../webhooks.example.json`

