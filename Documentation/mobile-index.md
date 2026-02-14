# Documentation - App mobile/index.html

## Vue d'ensemble

Page de connexion mobile pour l'application ConnectFiber. Interface optimisée pour mobile avec design moderne et authentification Supabase.

## Fonctionnalités

### Authentification mobile
- **Connexion utilisateur** : Formulaire de connexion avec email et mot de passe
- **Vérification auto** : Vérification si l'utilisateur est déjà connecté au chargement
- **Redirection conditionnelle** : Redirection vers `Rendez-vous_technicien.html` si technicien connecté
- **Gestion des erreurs** : Affichage des messages d'erreur en cas d'échec

### Interface mobile
- **Design responsive** : Optimisé pour mobile (max-width: 480px)
- **Image d'en-tête** : Image de fond avec overlay dégradé
- **Champs de formulaire** : Inputs avec icônes Material Symbols
- **Bouton de connexion** : Bouton principal avec animation active:scale

### Sécurité du formulaire
- **Autocomplete** : Attributs autocomplete pour username/password
- **Validation** : Validation côté client et serveur
- **Toggle password** : Affichage/masquage du mot de passe

## Sécurité

### Authentification Supabase
- ✅ Utilise `window.supabase.auth.signInWithPassword()`
- ✅ Vérification de la session via `window.supabase.auth.getUser()`
- ✅ Vérification du rôle utilisateur dans `user_roles`
- ✅ Redirection sécurisée selon le rôle

### Variables d'environnement
- Utilise `SUPABASE_URL` et `SUPABASE_ANON_KEY` via `js/config.js`
- ❌ Aucune clé sensible exposée

## Scripts et dépendances

### Scripts externes
- **Tailwind CSS** : Framework CSS
- **Material Symbols** : Icônes Google
- **Supabase JS v2** : Client Supabase

### Scripts locaux
- `../js/config.js?v=7` : Configuration Supabase
- `../js/api.js?v=7` : API wrapper

## Structure du code

### Éléments principaux
1. **Header Image Section** : Image de fond avec overlay dégradé
2. **Main Content** : Zone principale avec formulaire de connexion
3. **Footer** : Informations de version et support

### Variables JavaScript
- Variables locales pour gestion du formulaire
- Pas de variables globales (scope local)

### Fonctions principales
- `handleLogin(event)` : Gestion de la soumission du formulaire
- `togglePasswordVisibility()` : Affiche/masque le mot de passe
- Vérification automatique de session au chargement

## Flux d'authentification

1. **Chargement de la page**
   - Attente de l'initialisation de Supabase (max 5 secondes)
   - Vérification si l'utilisateur est déjà connecté

2. **Si session existe**
   - Vérification du rôle dans `user_roles`
   - Si rôle = 'technicien' : redirection vers `Rendez-vous_technicien.html`
   - Sinon : affichage du formulaire de connexion

3. **Soumission du formulaire**
   - Appel à `window.supabase.auth.signInWithPassword()`
   - En cas de succès : vérification du rôle et redirection
   - En cas d'erreur : affichage du message d'erreur

## Convention de code

- **Nom des fichiers** : `kebab-case` (index.html)
- **IDs HTML** : `kebab-case` (email, password)
- **Variables JS** : `camelCase`

## Gestion des erreurs

- Messages d'erreur génériques côté client
- Logs détaillés dans la console (dev uniquement)
- Aucune stack trace exposée au frontend
- Gestion du cas Supabase non initialisé

## Notes de développement

- Interface mobile optimisée avec contrainte max-width: 480px
- Image d'en-tête avec overlay dégradé pour la lisibilité
- Champs de formulaire avec icônes intégrées
- Toggle password avec icône Material Symbols changeante
- Bouton de connexion avec animation active:scale pour feedback tactile
