# API Webhooks & Auth Headers

This document lists webhook endpoints and the required authentication headers for services used by the mobile app, including `acceuil_Personnel.html`.

> Fill the values in `webhooks.example.json` and then copy to a secure location (not committed to git) like `.env` or a secrets manager.

## Webhook entries

The following webhook keys are referenced by the app UI:

- `expense` — Note de frais
- `accident` — Signalement accident (adresse, photos)
- `breakdown` — Déclaration de panne (message)
- `timesheet_sign` — Optional: notification when employee signs timesheet

Each webhook entry supports two fields:
- `url` — full https webhook URL
- `headers` — object of header key/value pairs to include in the POST

### Example payloads

- Expense
```
{ "type":"expense", "user":"user@example.com", "filename":"IMG_001.jpg" }
```

- Accident
```
{ "type":"accident", "user":"user@example.com", "address":"Rue de la Gare 15", "photos":["img1.jpg"], "note":"..." }
```

- Breakdown
```
{ "type":"breakdown", "user":"user@example.com", "breakdown_type":"mechanical", "message":"..." }
```

## Security / Auth Headers

Preferred methods:

- Bearer token: `Authorization: Bearer <token>`
- Static API Key: `X-API-Key: <key>`
- HMAC signature: `X-Signature` with `HMAC-SHA256` of the body using a shared secret (recommended for higher security)

### Example header formats

- Bearer
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI...
```

- Static key
```
X-API-Key: sk_live_xxx
```

- HMAC (server-side validation required)
```
X-Signature: sha256=abcdef1234567890
```

## How to configure in the app

1. Create a secure config file (example: `webhooks.json`) and keep it out of source control.
2. The app will POST to the configured URL and include any headers defined.
3. For uploading files (photos) the app currently sends filenames only — implement multipart or Storage upload when ready.

## Recommended Server-side Validations

- Validate `Content-Type: application/json` or `multipart/form-data` as expected.
- Verify Authorization header (bearer or API key).
- If HMAC is used, compute signature and compare with `X-Signature`.
- Rate-limit/Throttling and replay-protection for sensitive endpoints.

## Next steps

- Add `timesheet_sign` webhook in `webhooks.example.json` if you want a notification flow on sign.
- Replace local `triggerWebhook()` alerts with calls using the configured headers.
