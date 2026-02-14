# Documentation - inventaire/vehicule.html

## Vue d'ensemble

Page de gestion de la flotte de véhicules. Permet de gérer les véhicules, leurs caractéristiques, kilométrage, affectations et statuts.

## Fonctionnalités

### Gestion des véhicules
- **Liste des véhicules** : Tableau avec tous les véhicules de la flotte
- **Ajout/Modification** : Modal pour créer ou modifier un véhicule
- **Recherche** : Recherche par marque, modèle, plaque, etc.
- **Suppression** : Suppression de véhicules

### Informations véhicules
- **Marque et Modèle** : Identification du véhicule
- **Année** : Année de fabrication
- **Plaque d'immatriculation** : Numéro de plaque
- **Kilométrage** : Suivi du kilométrage actuel
- **Type de pneu** : Information sur les pneus
- **Statut** : Disponible, En usage, En maintenance, etc.
- **Assignation** : Technicien assigné au véhicule
- **Propriétaire** : Propriétaire du véhicule (interne/externe)

## Sécurité

### Authentification Supabase
- ✅ Vérification de session obligatoire
- ✅ Utilisation de `window.VeloxAPI.getSession()`
- ✅ Redirection si non authentifié

### Contrôle d'accès (RLS)
- ✅ Utilise Supabase client avec RLS activé
- ✅ Les requêtes respectent les politiques RLS
- ✅ La table `vehicles` gère les véhicules avec `user_id` implicite

## Scripts et dépendances

### Scripts externes
- **Tailwind CSS** : Framework CSS
- **Material Symbols** : Icônes Google
- **Supabase JS v2** : Client Supabase

### Scripts locaux
- `../js/config.js?v=8` : Configuration Supabase
- `../js/api.js?v=8` : API wrapper

## Structure du code

### Éléments principaux
1. **Navigation** : Barre de navigation horizontale
2. **Header** : En-tête avec bouton d'ajout
3. **Search** : Barre de recherche
4. **Table** : Tableau des véhicules

### Modal
- `modal` : Modal d'ajout/modification de véhicule

## API utilisées

### Requêtes Supabase directes
- `supabase.from('vehicles').select()` : Récupération des véhicules
- `supabase.from('vehicles').insert()` : Création de véhicule
- `supabase.from('vehicles').update()` : Mise à jour de véhicule
- `supabase.from('vehicles').delete()` : Suppression de véhicule

## Structure des données

### Véhicule
```javascript
{
  id: uuid,
  make: string, // Marque
  model: string, // Modèle
  year: number, // Année
  plate: string, // Plaque
  mileage: number, // Kilométrage
  tire_type: string, // Type de pneu
  status: string, // Statut
  assigned_to: uuid, // Technicien assigné (employee_id)
  owner: string, // Propriétaire
  created_at: timestamp,
  updated_at: timestamp
}
```

## Convention de code

- **IDs HTML** : `kebab-case` (search-input, modal)
- **Variables JS** : `camelCase`
- **Tableaux Supabase** : `snake_case` (vehicles)

## Notes de développement

- La page gère la flotte de véhicules de l'entreprise
- Les véhicules peuvent être assignés à des techniciens
- Le kilométrage doit être mis à jour régulièrement
- Le statut permet de gérer la disponibilité des véhicules
