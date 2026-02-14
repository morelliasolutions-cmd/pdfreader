# Documentation - inventaire/parametres.html

## Vue d'ensemble

Page de paramètres du module inventaire. Permet de configurer le logo de l'entreprise et gérer les dépôts (warehouses).

## Fonctionnalités

### Personnalisation
- **Logo entreprise** : Configuration de l'URL du logo
- **Aperçu du logo** : Prévisualisation du logo configuré
- **Persistance** : Stockage dans localStorage (`company_logo_url`)

### Gestion des dépôts
- **Liste des dépôts** : Affichage de tous les dépôts disponibles
- **Ajout de dépôt** : Création d'un nouveau dépôt
- **Modification** : Édition d'un dépôt existant
- **Suppression** : Suppression de dépôts
- **Activation** : Définir un dépôt comme actif par défaut

## Sécurité

### Authentification Supabase
- ✅ Utilisation de Supabase pour l'authentification (implicite)
- ✅ Gestion des utilisateurs via profil

### Contrôle d'accès (RLS)
- ✅ Utilise Supabase client avec RLS activé
- ✅ Les requêtes respectent les politiques RLS
- ✅ La table `depots` gère les dépôts avec permissions

### Données sensibles
- ✅ URLs de logos stockées dans localStorage (données non sensibles)
- ✅ Gestion des dépôts avec validation

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
1. **Navigation** : Barre de navigation horizontale
2. **Section Personnalisation** : Configuration du logo
3. **Section Dépôts** : Gestion des dépôts

## API utilisées

### Requêtes Supabase directes
- `supabase.from('depots').select()` : Récupération des dépôts
- `supabase.from('depots').insert()` : Création de dépôt
- `supabase.from('depots').update()` : Mise à jour de dépôt
- `supabase.from('depots').delete()` : Suppression de dépôt

## Structure des données

### Dépôt
```javascript
{
  id: uuid,
  name: string, // Nom du dépôt
  address: string, // Adresse
  is_active: boolean, // Dépôt actif par défaut
  created_at: timestamp,
  updated_at: timestamp
}
```

## Convention de code

- **IDs HTML** : `kebab-case` (logo-url, depots-list)
- **Variables JS** : `camelCase`
- **localStorage keys** : `snake_case` (company_logo_url)

## Notes de développement

- Le logo est stocké dans localStorage pour persister entre les sessions
- Les dépôts sont gérés dans Supabase pour la persistance multi-utilisateurs
- Un seul dépôt peut être actif à la fois (logique métier)
- L'aperçu du logo se met à jour en temps réel lors de la saisie de l'URL
