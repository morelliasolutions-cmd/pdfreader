# Documentation - parametres.html

## Vue d'ensemble

Page de paramètres utilisateur. Permet de configurer les textes des activités pour l'envoi de mail depuis le planning (planif.html).

## Fonctionnalités

### Paramètres utilisateur
- **Affichage email** : Email de l'utilisateur connecté (lecture seule)
- **Affichage rôle** : Rôle de l'utilisateur (Admin RH)

### Configuration des textes d'activité
- **Swisscom** : Zone de texte pour configurer le mail Swisscom
- **FTTH FR** : Zone de texte pour configurer le mail FTTH FR
- **SIG** : Zone de texte pour configurer le mail SIG
- **REA** : Zone de texte pour configurer le mail REA
- **Sauvegarde globale** : Bouton pour sauvegarder tous les textes d'un coup

### Persistance
- **localStorage** : Stockage local des textes configurés
- **Clés** : `activityText_swisscom`, `activityText_ftth_fr`, `activityText_sig`, `activityText_rea`
- **Chargement automatique** : Les textes sont chargés au démarrage de la page

## Sécurité

### Authentification Supabase
- ✅ Vérification de session obligatoire
- ✅ Redirection si non authentifié
- ✅ Utilisation de `window.VeloxAPI.getSession()`

### Données sensibles
- ✅ Aucune donnée sensible stockée
- ✅ Les textes sont stockés localement (localStorage) uniquement
- ✅ Aucune information personnelle exposée

## Scripts et dépendances

### Scripts externes
- **Tailwind CSS** : Framework CSS
- **Material Symbols** : Icônes Google
- **Supabase JS v2** : Client Supabase

### Scripts locaux
- `js/config.js?v=7` : Configuration Supabase
- `js/api.js?v=7` : API wrapper
- `js/role-access-control.js?v=1` : Gestion des rôles

## Structure du code

### Éléments principaux
1. **Sidebar** : Navigation principale
2. **Header** : En-tête avec notifications
3. **Content** : Formulaire de paramètres
   - Section profil utilisateur
   - Section textes d'activité
   - Bouton de déconnexion

### Variables JavaScript
- `currentUser` : Utilisateur connecté (global)

### Fonctions principales
- `loadActivityTexts()` : Charge les textes depuis localStorage
- `saveAllActivityTexts()` : Sauvegarde tous les textes dans localStorage
- `logout()` : Déconnexion de l'utilisateur

## API utilisées

### Méthodes VeloxAPI
- `getSession()` : Récupère la session
- `signOut()` : Déconnexion

## Structure des données

### Textes d'activité (localStorage)
```javascript
{
  'activityText_swisscom': string,
  'activityText_ftth_fr': string,
  'activityText_sig': string,
  'activityText_rea': string
}
```

## Convention de code

- **IDs HTML** : `kebab-case` avec préfixe `activityText_` (activityText_swisscom)
- **Variables JS** : `camelCase` (currentUser)
- **Clés localStorage** : Format `activityText_${activity}`

## Gestion des erreurs

- Vérification de session avant affichage
- Gestion des erreurs de localStorage (quota dépassé)
- Messages de confirmation lors de la sauvegarde
- Feedback visuel (bouton change de couleur/text au succès)

## Intégration avec planif.html

Les textes configurés dans cette page sont utilisés dans `planif.html` :

1. **Chargement** : Les textes sont lus depuis localStorage lors de l'envoi de mail
2. **Envoi** : Utilisation de `mailto:` avec le texte configuré comme corps du message
3. **Clés** : Les mêmes clés sont utilisées (`activityText_${activity}`)

## Notes de développement

- Les textes sont stockés localement par navigateur (localStorage)
- Chaque utilisateur peut configurer ses propres textes
- Les textes sont persistants entre les sessions (jusqu'à nettoyage du cache)
- Le bouton de sauvegarde change temporairement de couleur pour confirmer
- Les zones de texte sont multilignes (textarea) pour supporter des mails formatés
- Si aucun texte n'est configuré, un texte par défaut est utilisé dans planif.html
