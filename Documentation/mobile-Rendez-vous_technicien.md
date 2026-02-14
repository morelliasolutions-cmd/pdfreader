# Documentation - App mobile/Rendez-vous_technicien.html

## Vue d'ensemble

Page principale mobile pour les techniciens. Affiche la liste des rendez-vous du jour avec timeline, progression et navigation temporelle.

## Fonctionnalités

### Affichage des rendez-vous
- **Timeline** : Liste des rendez-vous du jour avec horaires
- **Navigation jour par jour** : Boutons précédent/suivant pour changer de date
- **Bouton "Aujourd'hui"** : Retour rapide au jour actuel
- **Affichage date** : Format lisible de la date sélectionnée

### Progression du jour
- **Barre de progression** : Indicateur visuel du nombre d'interventions complétées
- **Compteur** : Affichage "X/Y Interventions"
- **Calcul automatique** : Progression basée sur les statuts des interventions

### Navigation mobile
- **Bottom Navigation** : Barre de navigation fixe en bas
  - Agenda (page actuelle)
  - Stock (inventaire)
  - Profil
  - Déconnexion

### Cartes de rendez-vous
- **Horaires** : Affichage de l'heure de début et fin
- **Client** : Nom du client
- **Adresse** : Adresse complète
- **Activité** : Type d'intervention (badge coloré)
- **Statut** : En attente, En cours, Terminé
- **Bouton détails** : Accès aux détails de l'intervention

## Sécurité

### Authentification Supabase
- ✅ Vérification de session obligatoire
- ✅ Récupération de l'ID employé via la session
- ✅ Redirection si non authentifié

### Contrôle d'accès (RLS)
- ✅ Utilise Supabase client avec RLS activé
- ✅ Les requêtes respectent les politiques RLS
- ✅ Affichage uniquement des rendez-vous du technicien connecté
- ✅ Utilisation de `auth.uid()` dans les policies

### Données sensibles
- ✅ Adresses client affichées (nécessaires pour les interventions)
- ✅ Téléphones client (accessibles pour appeler)

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
1. **Header** : En-tête sticky avec avatar et bouton déconnexion
2. **Date Navigation** : Contrôles de navigation temporelle
3. **Progress Bar** : Barre de progression du jour
4. **Timeline** : Liste des rendez-vous (`#appointments-timeline`)
5. **Bottom Navigation** : Barre de navigation fixe

### Variables JavaScript
- `currentDate` : Date sélectionnée pour affichage
- `currentEmployeeId` : ID de l'employé connecté
- `appointments` : Liste des rendez-vous du jour

### Fonctions principales
- `initializeApp()` : Initialisation de l'application
- `loadAppointments(date)` : Charge les rendez-vous pour une date
- `renderAppointments(appointments)` : Affiche la timeline des rendez-vous
- `changeDate(offset)` : Change la date (+1 ou -1 jour)
- `updateProgress()` : Met à jour la barre de progression
- `handleLogout()` : Déconnexion de l'utilisateur
- `openProfile()` : Ouvre le profil utilisateur

## API utilisées

### Requêtes Supabase directes
- `supabase.auth.getUser()` : Récupération de l'utilisateur connecté
- `supabase.from('employees').select()` : Récupération de l'employé via email
- `supabase.from('appointments').select()` : Récupération des rendez-vous
- `supabase.from('appointments').update()` : Mise à jour du statut des rendez-vous

## Structure des données

### Appointment (Rendez-vous)
```javascript
{
  id: uuid,
  employee_id: uuid,
  date: date,
  activity: string,
  mandate_number: string,
  client_name: string,
  phone: string,
  address: string,
  npa: string,
  city: string,
  start_time: time,
  end_time: time,
  status: 'pending' | 'in_progress' | 'completed',
  note: string
}
```

## Convention de code

- **IDs HTML** : `kebab-case` (appointments-timeline, progress-bar)
- **Variables JS** : `camelCase` (currentDate, appointments)
- **Classes CSS** : Tailwind utility classes

## Gestion des erreurs

- Vérification de l'initialisation de Supabase (max 3 secondes)
- Gestion des erreurs d'authentification
- Messages d'erreur génériques côté client
- Logs détaillés dans la console pour le débogage

## Notes de développement

- Interface mobile optimisée avec contrainte max-width: 480px
- Bottom navigation fixe avec padding safe area (pb-safe) pour iOS
- Timeline avec cartes de rendez-vous cliquables
- Barre de progression calculée selon les statuts des interventions
- Navigation temporelle avec boutons précédent/suivant
- Header sticky avec backdrop-blur pour effet glassmorphism
- Avatar utilisateur affiché dans le header
