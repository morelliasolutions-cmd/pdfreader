# agents.md

## Objectif

Ce fichier **agents.md** sert de référence pour les agents Cursor / IA intervenant sur ce projet. Il décrit l’architecture, les conventions, et surtout les **bonnes pratiques de sécurité** à respecter lors du développement d’un projet **vide coder** avec un **backend Supabase**.

L’objectif est de garantir :

* Cohérence du code
* Sécurité des données
* Scalabilité du projet
* Facilité de maintenance

---

## Stack technique

* **Frontend** : à définir (ex: Next.js, Vite, Expo, etc.)
* **Backend** : Supabase

  * Auth Supabase
  * PostgreSQL
  * Row Level Security (RLS)
  * Edge Functions (si utilisées)
* **Gestion des secrets** : variables d’environnement uniquement

---

## Règles générales pour les agents

* ❌ Ne jamais coder de logique métier critique côté client
* ❌ Ne jamais exposer de clés privées Supabase
* ✅ Toujours supposer que le client est compromis
* ✅ Favoriser les politiques SQL (RLS) plutôt que les vérifications côté frontend
* ✅ Écrire du code lisible, explicite et documenté

---

## Sécurité Supabase (OBLIGATOIRE)

### Clés et variables d’environnement

* Utiliser **uniquement** :

  * `SUPABASE_URL`
  * `SUPABASE_ANON_KEY` côté client
* Ne jamais exposer :

  * `SERVICE_ROLE_KEY`

Les clés sont stockées dans :

* `.env.local`
* Variables d’environnement de la plateforme de déploiement

---

### Authentification

* Toujours utiliser `auth.uid()` dans les policies SQL
* Ne jamais faire confiance à un `user_id` envoyé depuis le frontend
* Toutes les tables sensibles doivent être liées à un utilisateur authentifié

Exemple de bonne pratique :

```sql
user_id = auth.uid()
```

---

### Row Level Security (RLS)

* ✅ RLS activé sur **toutes** les tables
* ❌ Aucune table publique sans policy explicite

Types de policies recommandées :

* SELECT : données appartenant à l’utilisateur
* INSERT : user_id forcé à auth.uid()
* UPDATE : uniquement sur ses propres lignes
* DELETE : restreint ou interdit selon le besoin

---

### Structure de base de données

Bonnes pratiques :

* Clés primaires en UUID
* Champs standards :

  * `id`
  * `user_id`
  * `created_at`
  * `updated_at`
* Index sur `user_id`

---

## Bonnes pratiques Frontend

* Ne jamais filtrer la sécurité côté UI uniquement
* Toujours gérer les erreurs Supabase (`error`)
* Centraliser le client Supabase
* Pas de logique métier sensible dans les composants

---

## Edge Functions (si utilisées)

* Utiliser les Edge Functions pour :

  * Logique sensible
  * Actions admin
  * Webhooks

Règles :

* Vérifier systématiquement l’identité utilisateur
* Ne jamais faire confiance aux données entrantes
* Logger sans exposer de données sensibles

---

## Convention de code

* Nom des fichiers : `kebab-case`
* Nom des tables : `snake_case`
* Nom des variables JS/TS : `camelCase`
* SQL lisible et commenté

---

## Gestion des erreurs

* Messages d’erreur génériques côté client
* Logs détaillés côté serveur uniquement
* Ne jamais exposer de stack trace au frontend

---

## Checklist avant mise en production

* [ ] RLS activé partout
* [ ] Aucune clé sensible exposée
* [ ] Policies testées
* [ ] Erreurs gérées
* [ ] Logs sécurisés

---

## Règle d’or

> **La sécurité est gérée par Supabase et le SQL, jamais par le frontend seul.**

---

## Notes

Ce fichier doit être mis à jour à chaque évolution majeure du projet ou de l’architecture.
