# Documentation - dashboard.html

## Vue d'ensemble

Tableau de bord principal de l'application Veloxnumeric. Affiche des statistiques en temps réel sur les effectifs, la productivité, les absences et les demandes récentes.

## Fonctionnalités

### Statistiques globales (KPIs)
- **Total Employés** : Nombre total d'employés actifs
- **Présents Aujourd'hui** : Nombre d'employés présents aujourd'hui
- **Taux d'Absentéisme** : Pourcentage d'absents
- **Score Productivité** : Score sur 10 basé sur les performances

### Graphiques et visualisations
- **Graphique en secteurs (Doughnut)** : Répartition des interventions par activité
- **Graphique linéaire** : Volume d'interventions sur 30 jours
- **Tableau des demandes récentes** : Liste des demandes de vacances, alertes, etc.
- **Visualisation des absences** : Répartition des absences par type

### Filtres temporels
- **Aujourd'hui** : Statistiques du jour
- **Cette Semaine** : Statistiques des 7 derniers jours
- **Ce Mois** : Statistiques des 30 derniers jours

## Sécurité

### Authentification Supabase
- ✅ Vérification de session obligatoire
- ✅ Redirection vers `index.html` si non authentifié
- ✅ Utilisation de `window.VeloxAPI.getSession()`

### Accès aux données
- ✅ Utilise les API wrapper (`VeloxAPI`) qui respectent les RLS
- ✅ Pas d'accès direct aux tables sans vérification de permission
- ✅ Messages d'erreur génériques côté client

## Scripts et dépendances

### Scripts externes
- **Tailwind CSS** : Framework CSS
- **Chart.js v4.4.0** : Bibliothèque de graphiques
- **Material Symbols** : Icônes Google
- **Supabase JS v2** : Client Supabase

### Scripts locaux
- `js/config.js?v=7` : Configuration Supabase
- `js/api.js?v=7` : API wrapper
- `js/role-access-control.js?v=1` : Gestion des rôles

## Structure du code

### Éléments principaux
1. **Sidebar** : Navigation principale avec menu
2. **Header** : En-tête avec notifications et profil utilisateur
3. **Content** : Zone principale avec statistiques et graphiques
   - KPI Cards : 4 cartes de statistiques
   - Charts Section : Graphiques en secteurs et linéaire
   - Table des demandes : Tableau récentes demandes
   - Absences par type : Liste des absences

### Variables JavaScript
- `currentUser` : Utilisateur connecté (global)
- `isChecking` : Flag de vérification
- `activityFilterPeriod` : Période de filtrage ('today', 'week', 'month')
- `activityChart` : Instance du graphique en secteurs
- `productivityChart` : Instance du graphique linéaire

### Fonctions principales
- `refreshAllData()` : Rafraîchit toutes les données selon la période
- `loadDashboard(startDate, endDate)` : Charge les statistiques KPIs
- `loadActivityChart(startDate, endDate)` : Charge le graphique en secteurs
- `loadProductivityChart(startDate, endDate)` : Charge le graphique linéaire
- `loadAbsences(startDate, endDate)` : Charge les statistiques d'absences

## API utilisées

### Méthodes VeloxAPI
- `getSession()` : Récupère la session actuelle
- `getDashboardStatsRange(startDate, endDate)` : Statistiques du dashboard
- `getInterventionsRange(startDate, endDate)` : Interventions pour le graphique
- `getProductivityHistory(startDate, endDate)` : Historique de productivité
- `getAbsenceStats(startDate, endDate)` : Statistiques d'absences
- `signOut()` : Déconnexion

## Structure des données

### Statistiques Dashboard
```javascript
{
  total_employees: number,
  present_today: number,
  absenteeism_rate: number,
  productivity_score: number,
  present_pct: number
}
```

### Interventions par activité
- Groupement par champ `activity`
- Comptage des interventions par type

### Absences par type
```javascript
{
  sick: number,
  vacation: number,
  remote: number,
  unpaid: number
}
```

## Convention de code

- **IDs HTML** : `kebab-case` (activity-chart, productivity-chart)
- **Variables JS** : `camelCase` (activityChart, productivityChart)
- **Classes CSS** : Tailwind utility classes

## Gestion des erreurs

- Try/catch sur toutes les requêtes API
- Logs d'erreur dans la console
- Affichage de messages génériques à l'utilisateur
- Gestion des cas où aucune donnée n'est disponible

## Notes de développement

- Les graphiques utilisent Chart.js avec configuration adaptative (dark mode)
- Le graphique de productivité est toujours sur 30 jours, indépendamment du filtre
- Les statistiques sont calculées côté serveur via les API Supabase
- La sidebar active est mise en évidence visuellement
