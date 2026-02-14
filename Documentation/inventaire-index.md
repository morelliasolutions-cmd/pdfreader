# Documentation - inventaire/index.html

## Vue d'ensemble

Page d'accueil du module inventaire. Page de présentation avec liens vers les différents sous-modules (Inventaire, Collaborateurs, Véhicules, Commandes).

## Fonctionnalités

### Navigation
- **Liens vers modules** : 4 cartes cliquables vers les sous-modules
  - Inventaire
  - Collaborateurs
  - Véhicules
  - Commandes

### Présentation
- **Titre principal** : "Gestionnaire de Stock"
- **Description** : Texte d'introduction
- **Logo entreprise** : Affichage du logo si configuré (depuis localStorage)

### Liens
- Chaque carte redirige vers la page correspondante :
  - `inventaire.html` : Gestion du stock
  - `collaborateurs.html` : Gestion des collaborateurs
  - `vehicule.html` : Gestion des véhicules
  - `commandes.html` : Gestion des commandes

## Sécurité

- ✅ Pas d'authentification requise (page publique du module)
- ✅ Aucune donnée sensible affichée
- ✅ Liens simples vers les sous-pages (qui gèrent l'authentification)

## Scripts et dépendances

### Scripts externes
- **Tailwind CSS** : Framework CSS
- **Material Symbols** : Icônes Google

### Scripts locaux
- Aucun script spécifique (lecture du logo depuis localStorage uniquement)

## Structure du code

### Éléments principaux
1. **Header** : Titre et description
2. **Logo** : Logo entreprise (optionnel)
3. **Grid de cartes** : 4 cartes de navigation
4. **Footer** : Informations de version et crédits

### Variables JavaScript
- `company_logo_url` : URL du logo depuis localStorage

## API utilisées

- Aucune API (page statique avec navigation)

## Convention de code

- **IDs HTML** : `kebab-case` (company-logo)
- **Classes CSS** : Tailwind utility classes

## Notes de développement

- Page d'accueil simple sans authentification requise
- Le logo est chargé depuis `localStorage.getItem('company_logo_url')`
- Les cartes utilisent des effets hover (scale, shadow)
- Page responsive avec grille adaptative (1 colonne mobile, 3 colonnes desktop)
