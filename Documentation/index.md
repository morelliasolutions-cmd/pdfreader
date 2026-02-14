# Documentation - index.html

## Vue d'ensemble

Page de connexion principale et point d'entrée de l'application Veloxnumeric. Cette page gère l'authentification des utilisateurs et redirige vers le dashboard après connexion réussie.

## Fonctionnalités

### Authentification
- **Connexion utilisateur** : Formulaire de connexion avec email et mot de passe
- **Vérification de session** : Vérifie automatiquement si un utilisateur est déjà connecté au chargement
- **Redirection automatique** : Redirige vers `dashboard.html` si une session active existe
- **Gestion des erreurs** : Affichage des messages d'erreur en cas d'échec de connexion

### Interface utilisateur
- **Écran de chargement** : Affichage pendant l'initialisation
- **Écran de connexion** : Interface de login avec fond dégradé
- **Mode sombre/clair** : Support du thème sombre via la classe `dark`

## Sécurité

### Authentification Supabase
- ✅ Utilise `window.VeloxAPI.signIn()` pour l'authentification
- ✅ Vérifie la session via `window.VeloxAPI.getSession()`
- ✅ Redirection si pas de session valide
- ✅ Gestion sécurisée des erreurs (messages génériques côté client)

### Variables d'environnement
- Utilise `SUPABASE_URL` et `SUPABASE_ANON_KEY` via `js/config.js`
- ❌ Aucune clé sensible exposée

## Scripts et dépendances

### Scripts externes
- **Tailwind CSS** : Framework CSS via CDN
- **Material Symbols** : Icônes Google
- **Supabase JS v2** : Client Supabase

### Scripts locaux
- `js/config.js?v=7` : Configuration Supabase
- `js/api.js?v=7` : API wrapper (VeloxAPI)
- `js/role-access-control.js?v=1` : Gestion des rôles et contrôle d'accès

## Structure du code

### Éléments principaux
1. **Loading Screen** (`#loadingScreen`) : Écran de chargement
2. **Login Screen** (`#loginScreen`) : Formulaire de connexion
3. **Main App** (`#mainApp`) : Contenu principal (masqué initialement)

### Variables JavaScript
- `currentUser` : Déclaré globalement dans `role-access-control.js`
- `isChecking` : Flag pour éviter les vérifications multiples

### Fonctions principales
- `logout()` : Déconnexion de l'utilisateur
- `showLoginScreen()` : Affichage de l'écran de connexion
- Event listener sur `loginForm` : Gestion de la soumission du formulaire

## Flux d'authentification

1. **Chargement de la page**
   - Attente du chargement de `window.VeloxAPI`
   - Vérification de la session existante

2. **Si session existe**
   - Définition de `currentUser`
   - Redirection vers `dashboard.html`

3. **Si aucune session**
   - Affichage de l'écran de connexion
   - Attente de la soumission du formulaire

4. **Soumission du formulaire**
   - Appel à `window.VeloxAPI.signIn(email, password)`
   - En cas de succès : redirection vers `dashboard.html`
   - En cas d'erreur : affichage du message d'erreur

## Convention de code

- **Nom des fichiers** : `kebab-case` (index.html)
- **Variables JS** : `camelCase` (currentUser, isChecking)
- **IDs HTML** : `camelCase` (loginScreen, loginForm)

## Gestion des erreurs

- Messages d'erreur génériques côté client
- Logs détaillés dans la console (développement uniquement)
- Aucune stack trace exposée au frontend

## Notes de développement

- La variable `currentUser` est partagée globalement via `role-access-control.js`
- Utilisation de `window.location.replace()` pour éviter les problèmes de bouton retour
- Le formulaire de connexion inclut des placeholders et des messages d'aide
