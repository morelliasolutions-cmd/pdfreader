# Documentation - production.html

## Vue d'ensemble

Page de saisie de production pour les techniciens. Permet d'enregistrer les interventions réalisées avec leur montant CHF, canton, activité, et de suivre les performances par technicien et par activité.

## Fonctionnalités

### Saisie de production
- **Liste des techniciens** : Tableau avec tous les techniciens actifs
- **Modal d'interventions** : Interface pour ajouter/modifier/supprimer des interventions
- **Par date** : Filtrage par date (navigation jour par jour)
- **Recherche** : Recherche par nom de technicien ou canton

### Statistiques (KPIs)
- **CHF Total** : Somme de toutes les interventions du jour
- **Installations** : Nombre total d'interventions
- **Techniciens Actifs** : Nombre de techniciens ayant au moins une intervention
- **Atteinte Objectifs** : Pourcentage par rapport à l'objectif (900 CHF/technicien)

### Production par activité
- **Swisscom** : Compteur et CHF par activité
- **REA** : Compteur et CHF par activité
- **FTTH FR** : Compteur et CHF par activité
- **SIG** : Compteur et CHF par activité
- **SmartMetering** : Compteur et CHF par activité

### Gestion des interventions
- **Ajout** : Formulaire pour créer une nouvelle intervention
- **Modification** : Édition des interventions existantes
- **Suppression** : Suppression avec confirmation
- **Statut "On Hold"** : Marquage d'interventions en attente

### Vue par technicien
- **Production par canton** : Affichage du total CHF par canton
- **Total CHF** : Montant total généré par le technicien
- **Installations totales** : Nombre d'interventions
- **On Hold** : Nombre d'interventions en attente

## Sécurité

### Authentification Supabase
- ✅ Vérification de session obligatoire
- ✅ Redirection si non authentifié
- ✅ Utilisation de `window.VeloxAPI.getSession()`

### Contrôle d'accès (RLS)
- ✅ Utilise Supabase client avec RLS activé
- ✅ Les requêtes respectent les politiques RLS
- ✅ La table `interventions` gère les productions avec `user_id` implicite

### Données sensibles
- ✅ Montants CHF validés (numériques, positifs)
- ✅ Gestion des erreurs sans exposer de détails sensibles
- ✅ Validation des champs obligatoires

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
3. **Header Card** : Bandeau informatif "Saisie de Production"
4. **KPIs** : 4 cartes de statistiques principales
5. **KPIs par Activité** : 5 cartes pour chaque activité
6. **Table** : Tableau des techniciens avec leurs statistiques

### Modal
- `interventionModal` : Ajout/modification d'interventions

### Variables JavaScript
- `currentUser` : Utilisateur connecté (global)
- `currentTechId` : ID du technicien en cours d'édition
- `currentDate` : Date sélectionnée pour la production
- `techniciansData` : Données des techniciens avec leurs interventions
- `activityData` : Données agrégées par activité

### Fonctions principales
- `fetchData()` : Charge les données pour la date sélectionnée
- `renderTable()` : Affiche le tableau des techniciens
- `updateKPIs()` : Met à jour toutes les statistiques
- `openModal(techId, techName)` : Ouvre le modal d'interventions
- `closeModal()` : Ferme le modal
- `addIntervention()` : Ajoute une intervention
- `deleteIntervention(intervId)` : Supprime une intervention
- `renderInterventions(interventions)` : Affiche la liste des interventions
- `filterTable()` : Filtre le tableau par recherche
- `changeDate(delta)` : Change la date (+1 ou -1 jour)

## API utilisées

### Méthodes VeloxAPI
- `getSession()` : Récupère la session

### Requêtes Supabase directes
- `supabase.from('employees').select()` : Récupération des techniciens (type='Technicien')
- `supabase.from('interventions').select()` : Récupération des interventions
- `supabase.from('interventions').insert()` : Création d'intervention
- `supabase.from('interventions').delete()` : Suppression d'intervention

## Structure des données

### Intervention (Production)
```javascript
{
  id: uuid,
  employee_id: uuid,
  date: date,
  canton: string, // 'VD', 'GE', 'VS', 'FR', 'NE', 'JU'
  activity: 'Swisscom' | 'REA' | 'FTTH FR' | 'SIG' | 'SmartMetering' | 'Autre',
  amount_chf: decimal,
  is_on_hold: boolean,
  notes: string,
  created_at: timestamp,
  updated_at: timestamp
}
```

### Technician Data (Technicien enrichi)
```javascript
{
  id: uuid,
  first_name: string,
  last_name: string,
  role: string,
  photo_url: string,
  total_chf: number,
  total_installations: number,
  total_on_hold: number,
  cantons: {[canton: string]: number} // CHF par canton
}
```

## Convention de code

- **IDs HTML** : `kebab-case` (kpi-total-chf, intervention-modal)
- **Variables JS** : `camelCase` (currentTechId, techniciansData)
- **Tableaux Supabase** : `snake_case` (interventions, employees)

## Gestion des erreurs

- Validation des champs obligatoires (canton, activité, montant, date)
- Validation numérique pour amount_chf
- Messages d'erreur génériques à l'utilisateur
- Logs détaillés dans la console pour le débogage

## Logique métier

### Calcul des statistiques
- **Total CHF** : Somme de tous les `amount_chf` du jour
- **Installations** : Compte des interventions du jour
- **Techniciens Actifs** : Nombre de techniciens avec au moins une intervention
- **Objectif** : 900 CHF par technicien (calcul : totalCHF / (nbTechniciens * 900) * 100)

### Codage couleur des cartes
- **Rouge** : 0 CHF ou < 450 CHF
- **Orange** : 450-890 CHF
- **Vert** : >= 890 CHF

### Groupement par canton
- Agrégation des montants CHF par canton pour chaque technicien
- Affichage sous forme de chaîne "VD: 150.00 CHF, GE: 200.00 CHF"

## Notes de développement

- Les interventions sont filtrées par date lors du chargement
- Les statistiques sont calculées en temps réel lors du rendu
- Le statut "On Hold" permet de marquer des interventions en attente de validation
- Le champ `activity` peut être "Autre" pour des activités non standardisées
- Les cantons sont codés en abréviation (VD, GE, VS, FR, NE, JU)
- La recherche filtre à la fois par nom de technicien et par canton
