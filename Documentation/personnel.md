# Documentation - personnel.html

## Vue d'ensemble

Page de gestion du personnel. Permet de consulter, créer, modifier et gérer les profils des employés, leurs absences, leurs vacances et leurs heures de travail.

## Fonctionnalités

### Gestion des employés
- **Liste des employés** : Affichage sous forme de tableau avec recherche et filtres
- **Ajout d'employé** : Modal pour créer un nouveau profil
- **Modification d'employé** : Modal pour modifier un profil existant
- **Vue détaillée** : Panneau latéral avec informations complètes

### Gestion des absences
- **Notification d'absence** : Modal pour notifier une absence
- **Calendrier d'événements** : Affichage mensuel des absences et congés
- **Types d'absences** : Congés payés, maladie, absence, congé sans solde, jours fériés

### Gestion des vacances
- **Solde de vacances** : Affichage du solde et progression
- **Prochain congé** : Affichage de la prochaine période de congés
- **Rapport mensuel** : Génération de rapports d'heures par mois

### Heures mensuelles
- **Graphique mensuel** : Barres de progression par mois
- **Rapport détaillé** : Tableau avec toutes les heures du mois sélectionné
- **Export PDF** : Génération de PDF pour impression

## Sécurité

### Authentification et autorisation
- ✅ Vérification de session obligatoire
- ✅ Redirection si non authentifié
- ⚠️ Vérification du rôle admin pour ajout/modification d'employés
- ✅ Utilisation de `currentUserRole` pour les permissions

### Contrôle d'accès (RLS)
- ✅ Utilise `window.VeloxAPI` qui respecte les RLS Supabase
- ✅ Les rôles RLS sont gérés via la table `user_roles`
- ⚠️ Attribution de rôles RLS nécessite que l'utilisateur existe dans `auth.users`

### Données sensibles
- ✅ Gestion sécurisée des emails et informations personnelles
- ✅ Les mises à jour respectent les contraintes de la base de données
- ✅ Validation côté client et serveur (via RLS)

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
3. **Search & Filters** : Barre de recherche et filtres par statut
4. **Employee List** : Tableau des employés (colonne principale)
5. **Detail View** : Panneau latéral avec détails de l'employé sélectionné

### Modals
- `addEmployeeModal` : Ajout d'un employé
- `editEmployeeModal` : Modification d'un employé
- `absenceModal` : Notification d'absence
- `calendarModal` : Calendrier mensuel
- `reportModal` : Rapport mensuel d'heures

### Variables JavaScript
- `currentUser` : Utilisateur connecté (global)
- `employees` : Liste des employés
- `currentEmployeeId` : ID de l'employé sélectionné
- `currentCalendarDate` : Date du calendrier affiché
- `currentEvents` : Événements du calendrier

### Fonctions principales
- `loadEmployees()` : Charge la liste des employés
- `selectEmployee(emp)` : Sélectionne un employé et affiche les détails
- `addEmployee(event)` : Crée un nouvel employé
- `updateEmployee(event)` : Met à jour un employé existant
- `notifyAbsence(event)` : Notifie une absence
- `loadMonthlyReport()` : Charge le rapport mensuel
- `assignRLSRole(email, employeeId, role)` : Attribue un rôle RLS

## API utilisées

### Méthodes VeloxAPI
- `getSession()` : Récupère la session
- `getEmployees()` : Liste des employés
- `createEmployee(employeeData)` : Création d'employé
- `updateEmployee(id, updates)` : Mise à jour d'employé
- `getEmployeeStats(id)` : Statistiques d'un employé
- `getEmployeeEvents(id, startDate, endDate)` : Événements d'un employé
- `createEventRange(employeeId, startDate, endDate, type, note)` : Création d'événement

### Requêtes Supabase directes
- `supabase.from('user_roles').select()` : Récupération des rôles RLS
- `supabase.from('user_roles').upsert()` : Mise à jour des rôles RLS
- `supabase.from('time_entries').select()` : Récupération des pointages

## Structure des données

### Employé
```javascript
{
  id: uuid,
  first_name: string,
  last_name: string,
  type: 'Bureau' | 'Technicien',
  role: string,
  status: 'Actif' | 'Inactif' | 'Maladie' | 'En congé',
  contract_start_date: date,
  annual_vacation_days: number,
  email: string,
  notes: string
}
```

### Statistiques employé
```javascript
{
  absences_year: number,
  next_vacation: string,
  vacation_days_used: number,
  vacation_days_total: number,
  monthly_hours: [{month: number, hours: number}]
}
```

## Convention de code

- **IDs HTML** : `kebab-case` (add-employee-modal, edit-employee-modal)
- **Variables JS** : `camelCase` (currentEmployeeId, employeesData)
- **Mapping des données** : Conversion entre valeurs base de données et formulaire

## Gestion des erreurs

- Validation des champs obligatoires côté client
- Messages d'erreur détaillés pour les erreurs de base de données
- Logs d'erreur dans la console
- Gestion des cas où l'utilisateur n'existe pas dans `auth.users` pour les rôles RLS

## Notes de développement

- Le champ `annual_vacation_days` nécessite l'exécution de `SETUP_VACATION_PRORATA.sql`
- Les rôles RLS nécessitent que l'utilisateur existe dans `auth.users` avant attribution
- Le système de mapping convertit les anciennes valeurs ('atelier', 'terrain') vers les nouvelles ('Bureau', 'Technicien')
- Le rapport mensuel génère un PDF via la fonction d'impression du navigateur
