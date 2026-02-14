# Documentation - pointage.html

## Vue d'ensemble

Page de saisie rapide des heures de travail (pointage). Permet de saisir les heures de début et fin pour chaque employé d'une journée donnée, avec vue calendrier mensuel et statistiques.

## Fonctionnalités

### Saisie de pointage
- **Liste des employés** : Cartes individuelles pour chaque employé actif
- **Champs de saisie** : Début et fin de journée en format time
- **Enregistrement rapide** : Bouton "Enregistrer" / "Mettre à jour" par carte
- **Calcul automatique** : Calcul des heures totales avec déduction de pause (1h si >5h)
- **Filtres par type** : Filtrage par "Tous", "Technicien" ou "Bureau"

### Calendrier mensuel
- **Vue mensuelle** : Calendrier avec jours du mois
- **Sélection de jour** : Clic sur un jour pour charger les pointages
- **Indicateurs visuels** : Points verts/rouges selon complétude
- **Navigation** : Boutons précédent/suivant pour changer de mois

### Statistiques (KPIs)
- **Taux de présence** : Pourcentage d'employés pointés sur les actifs
- **Collaborateurs actifs** : Nombre d'employés actifs (hors absents)
- **Pointages en attente** : Nombre d'employés non pointés

### Gestion des absences
- **Exclusion automatique** : Les employés absents ne sont pas affichés
- **Vérification d'événements** : Recherche dans la table `events` pour absences
- **Week-end** : Message informatif pour les jours de week-end

## Sécurité

### Authentification Supabase
- ✅ Vérification de session obligatoire
- ✅ Redirection si non authentifié
- ✅ Utilisation de `window.VeloxAPI.getSession()`

### Contrôle d'accès (RLS)
- ✅ Utilise Supabase client avec RLS activé
- ✅ Les requêtes respectent les politiques RLS
- ✅ La table `time_entries` gère les pointages avec `user_id` implicite

### Données sensibles
- ✅ Champ `filled_by` : Enregistre l'utilisateur qui a saisi le pointage
- ✅ Validation des heures (début < fin)
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
3. **Main Content** : Liste des employés avec cartes de pointage
4. **Sidebar Right** : Calendrier mensuel et KPIs

### Variables JavaScript
- `currentUser` : Utilisateur connecté (global)
- `currentDate` : Date sélectionnée pour le pointage
- `calendarDate` : Date du calendrier affiché
- `currentFilter` : Filtre actif ('all', 'Technicien', 'Bureau')
- `employeesData` : Données des employés avec pointages

### Fonctions principales
- `fetchData()` : Charge les données pour la date sélectionnée
- `renderList()` : Affiche la liste des employés avec cartes
- `renderCalendar()` : Affiche le calendrier mensuel
- `drawCalendarGrid(year, month)` : Génère la grille du calendrier
- `saveCard(empId)` : Sauvegarde le pointage d'un employé
- `updateKPIs()` : Met à jour les statistiques
- `filterList(type)` : Filtre la liste par type d'employé

## API utilisées

### Méthodes VeloxAPI
- `getSession()` : Récupère la session

### Requêtes Supabase directes
- `supabase.from('employees').select()` : Récupération des employés
- `supabase.from('time_entries').select()` : Récupération des pointages
- `supabase.from('time_entries').insert()` : Création de pointage
- `supabase.from('time_entries').update()` : Mise à jour de pointage
- `supabase.from('events').select()` : Récupération des absences
- `supabase.from('interventions').select()` : Récupération de la production

## Structure des données

### Time Entry (Pointage)
```javascript
{
  id: uuid,
  employee_id: uuid,
  date: date,
  start_time: time,
  end_time: time,
  total_hours: decimal,
  filled_by: string,
  created_at: timestamp,
  updated_at: timestamp
}
```

### Employee Data (Employé enrichi)
```javascript
{
  id: uuid,
  first_name: string,
  last_name: string,
  type: 'Bureau' | 'Technicien',
  photo_url: string,
  start_time: time,
  end_time: time,
  is_treated: boolean,
  filled_by: string,
  is_absent: boolean,
  absence_reason: string,
  production: number (CHF)
}
```

## Convention de code

- **IDs HTML** : `kebab-case` (employee-list, calendar-grid)
- **Variables JS** : `camelCase` (currentDate, employeesData)
- **Fonctions** : `camelCase` (fetchData, saveCard)

## Gestion des erreurs

- Vérification de l'initialisation de Supabase avant utilisation
- Gestion des cas où aucun pointage n'existe (insert vs update)
- Messages d'erreur génériques à l'utilisateur
- Logs détaillés dans la console pour le débogage

## Logique métier

### Calcul des heures
1. Calcul de la différence entre début et fin
2. Si > 5h : déduction automatique de 1h (pause)
3. Arrondi à 2 décimales
4. Minimum 0h

### Indicateurs calendrier
- **Vert** : Tous les employés sont soit pointés, soit absents (justifiés)
- **Rouge** : Des employés manquent (ni pointage, ni absence)

### Filtres
- Les absents sont toujours exclus de la liste
- Le filtre par type s'applique sur les employés actifs non absents

## Notes de développement

- Le calendrier utilise un système de maps (pointagesByDate, absencesByDate) pour optimiser les requêtes
- Les requêtes sont faites une seule fois pour tout le mois lors de l'affichage du calendrier
- Les week-ends affichent un message informatif et ne permettent pas de saisie
- Les statistiques sont calculées uniquement sur les employés actifs (hors absents)
- Le champ `filled_by` stocke l'email de l'utilisateur (sans le @domain)
