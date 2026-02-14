# Documentation - mandats.html

## Vue d'ensemble

Page de gestion des mandats clients. Permet de créer, consulter, filtrer et assigner des techniciens aux mandats d'intervention.

## Fonctionnalités

### Gestion des mandats
- **Liste des mandats** : Tableau avec toutes les informations clients
- **Ajout de mandat** : Modal pour créer un nouveau mandat
- **Recherche** : Recherche par numéro, nom, ville
- **Filtres** : Filtrage par statut et type d'intervention

### Assignation de techniciens
- **Modal d'assignation** : Interface pour sélectionner les techniciens
- **Liste de techniciens** : Affichage des techniciens actifs disponibles
- **Multi-sélection** : Possibilité d'assigner plusieurs techniciens à un mandat
- **Mise à jour automatique du statut** : Passage à "assigne" quand des techniciens sont assignés

### Types d'intervention
- Swisscom
- FTTH FR
- SIG
- REA
- Smart Metering

### Statuts de mandat
- **En attente** : Mandat créé, aucun technicien assigné
- **Assigné** : Techniciens assignés
- **En cours** : Intervention en cours
- **Terminé** : Intervention terminée
- **Annulé** : Mandat annulé

## Sécurité

### Authentification Supabase
- ✅ Vérification de session obligatoire
- ✅ Redirection si non authentifié
- ✅ Vérification de l'initialisation de Supabase avant utilisation

### Contrôle d'accès (RLS)
- ✅ Utilise Supabase client avec RLS activé
- ✅ Les requêtes respectent les politiques RLS de la table `mandats`
- ✅ La table `mandat_techniciens` gère les relations many-to-many

### Données sensibles
- ✅ Informations client (nom, adresse, téléphone, email) gérées sécuritairement
- ✅ Validation des champs obligatoires
- ✅ Gestion des erreurs sans exposer de détails sensibles

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
3. **Search & Filters** : Barre de recherche et filtres multiples
4. **Mandats Table** : Tableau principal des mandats

### Modals
- `addMandatModal` : Ajout d'un mandat
- `assignTechniciansModal` : Assignation de techniciens

### Variables JavaScript
- `currentUser` : Utilisateur connecté (global)
- `mandats` : Liste des mandats
- `employees` : Liste des employés (techniciens uniquement)
- `currentMandatId` : ID du mandat en cours d'assignation

### Fonctions principales
- `loadMandats()` : Charge la liste des mandats
- `renderMandatsTable()` : Affiche le tableau des mandats
- `addMandat(event)` : Crée un nouveau mandat
- `openAssignTechniciansModal(mandatId, mandatNumber)` : Ouvre le modal d'assignation
- `saveAssignedTechnicians()` : Sauvegarde les techniciens assignés
- `filterTable()` : Filtre le tableau selon les critères

## API utilisées

### Méthodes VeloxAPI
- `getSession()` : Récupère la session
- `getEmployees()` : Liste des employés (filtrée pour techniciens)

### Requêtes Supabase directes
- `supabase.from('mandats').select()` : Récupération des mandats
- `supabase.from('mandats').insert()` : Création de mandat
- `supabase.from('mandat_techniciens').select()` : Récupération des assignations
- `supabase.from('mandat_techniciens').delete()` : Suppression des assignations
- `supabase.from('mandat_techniciens').insert()` : Création d'assignation
- `supabase.from('mandats').update()` : Mise à jour du statut

## Structure des données

### Mandat
```javascript
{
  id: uuid,
  numero_mandat: string,
  nom_client: string,
  prenom_client: string,
  telephone: string,
  email: string,
  adresse: string,
  npa: string,
  ville: string,
  type_intervention: 'swisscom' | 'ftth_fr' | 'sig' | 'rea' | 'smartmetering',
  date_intervention: date,
  priorite: boolean,
  notes: string,
  statut: 'en_attente' | 'assigne' | 'en_cours' | 'termine' | 'annule'
}
```

### Assignation technicien
```javascript
{
  mandat_id: uuid,
  employee_id: uuid
}
```

## Convention de code

- **IDs HTML** : `kebab-case` (mandats-table, assign-technicians-modal)
- **Variables JS** : `camelCase` (mandats, currentMandatId)
- **Tableaux Supabase** : `snake_case` (mandats, mandat_techniciens)

## Gestion des erreurs

- Vérification de l'initialisation de Supabase avant utilisation
- Messages d'erreur SQL détaillés dans la console
- Affichage d'erreurs génériques à l'utilisateur
- Gestion des cas où aucun technicien n'est disponible

## Notes de développement

- La page attend explicitement l'initialisation de Supabase (30 tentatives)
- Les techniciens sont filtrés pour ne garder que les actifs de type 'Technicien'
- Le statut est automatiquement mis à jour lors de l'assignation/désassignation
- Le compteur de techniciens assignés est affiché en badge sur le bouton d'assignation
- Diagnostic de chargement disponible dans la console (window.addEventListener('load'))
