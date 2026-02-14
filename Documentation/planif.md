# Documentation - planif.html

## Vue d'ensemble

Page de planning des techniciens avec vue Gantt. Permet de planifier les interventions par technicien et par heure de la journée, gérer les rendez-vous, verrouiller des créneaux par activité et visualiser sur carte.

## Fonctionnalités

### Planning Gantt
- **Vue Gantt horaire** : Planning de 7h à 19h avec créneaux horaires
- **Techniciens disponibles** : Affichage uniquement des techniciens non absents
- **Interventions affichées** : Blocs colorés par activité sur la timeline
- **Ajout d'intervention** : Bouton + sur chaque ligne de technicien
- **Modification d'intervention** : Clic sur une intervention pour modifier

### Gestion des interventions
- **Modal d'ajout/modification** : Formulaire complet pour créer/éditer une intervention
- **Informations techniques** : PTO, câble d'alim, crochets fibres (BEP)
- **Marquage d'urgence** : Flag is_urgent pour les interventions prioritaires
- **Panel de détails** : Vue latérale avec détails complets d'une intervention

### Navigation temporelle
- **Navigation jour par jour** : Boutons précédent/suivant
- **Bouton "Aujourd'hui"** : Retour rapide au jour actuel
- **Sélecteur de date** : Input date pour sélection rapide

### Verrouillage d'activité
- **Blocage par activité** : Verrouillage matin/après-midi par activité (Swisscom, FTTH FR, SIG, REA)
- **Modal de verrouillage** : Interface avec switch pour matin/après-midi
- **Stockage en base** : Table `activity_locks` pour persistance

### Carte des rendez-vous
- **Modal carte** : Affichage Leaflet/OpenStreetMap
- **Géocodage automatique** : Conversion adresse -> coordonnées via Nominatim
- **Marqueurs personnalisés** : Initiales des techniciens sur les marqueurs
- **Popup informatifs** : Détails intervention au clic sur marqueur

### Notifications RDV
- **Système de notifications** : Modal avec liste des demandes de RDV non traitées
- **Temps réel** : Abonnement Supabase Realtime pour nouvelles demandes
- **Marquage comme traité** : Bouton pour traiter une demande
- **Badge de compteur** : Affichage du nombre de demandes en attente

### Envoi de mail par activité
- **Boutons d'activité** : Swisscom, FTTH FR, SIG, REA dans le header
- **Texte configurable** : Textes stockés dans localStorage
- **Ouverture client mail** : Utilisation de mailto: avec sujet et corps prérempli

## Sécurité

### Authentification Supabase
- ✅ Vérification de session obligatoire
- ✅ Redirection si non authentifié
- ✅ Utilisation de `window.VeloxAPI.getSession()`

### Contrôle d'accès (RLS)
- ✅ Utilise Supabase client avec RLS activé
- ✅ Les requêtes respectent les politiques RLS
- ✅ La table `appointments` gère les rendez-vous

### Données sensibles
- ✅ Adresses client géocodées via service externe (Nominatim)
- ✅ Informations techniques (PTO, fibres) stockées sécuritairement

## Scripts et dépendances

### Scripts externes
- **Tailwind CSS** : Framework CSS
- **Material Symbols** : Icônes Google
- **Supabase JS v2** : Client Supabase
- **Leaflet 1.9.4** : Bibliothèque de cartes interactives
- **Nominatim API** : Service de géocodage OpenStreetMap

### Scripts locaux
- `js/config.js?v=7` : Configuration Supabase
- `js/api.js?v=7` : API wrapper
- `js/role-access-control.js?v=1` : Gestion des rôles

## Structure du code

### Éléments principaux
1. **Sidebar** : Navigation principale
2. **Header** : En-tête avec boutons d'activité, navigation temporelle, carte, notifications
3. **Gantt Chart** : Tableau avec techniciens en lignes et heures en colonnes
4. **Detail Panel** : Panneau latéral avec détails d'intervention

### Modals
- `activityLockModal` : Verrouillage d'activité
- `interventionModal` : Ajout/modification d'intervention
- `mapModal` : Carte des rendez-vous
- `notificationsModal` : Notifications RDV

### Variables JavaScript
- `currentUser` : Utilisateur connecté (global)
- `technicians` : Liste des techniciens disponibles
- `currentDate` : Date du planning affiché
- `activityConfig` : Configuration des couleurs par activité
- `currentActivity` : Activité en cours de verrouillage
- `rdvNotifications` : Liste des demandes de RDV

### Fonctions principales
- `init()` : Initialisation de la page
- `loadTechniciansForDate(date)` : Charge les techniciens disponibles
- `getInterventionsByDate(date)` : Récupère les interventions du jour
- `saveAppointment(appointment)` : Sauvegarde une intervention
- `deleteAppointment(id)` : Supprime une intervention
- `renderInterventions()` : Affiche les interventions sur le Gantt
- `openActivityLock(activity)` : Ouvre le modal de verrouillage
- `openMapModal()` : Ouvre la carte
- `loadRdvNotifications()` : Charge les notifications RDV
- `subscribeToRdvChanges()` : Abonne aux changements temps réel

## API utilisées

### Méthodes VeloxAPI
- `getSession()` : Récupère la session

### Requêtes Supabase directes
- `supabase.from('employees').select()` : Récupération des techniciens
- `supabase.from('events').select()` : Récupération des absences
- `supabase.from('appointments').select()` : Récupération des rendez-vous
- `supabase.from('appointments').insert()` : Création de rendez-vous
- `supabase.from('appointments').update()` : Mise à jour de rendez-vous
- `supabase.from('appointments').delete()` : Suppression de rendez-vous
- `supabase.from('activity_locks').upsert()` : Verrouillage d'activité
- `supabase.from('RDV').select()` : Récupération des demandes de RDV
- `supabase.channel().on('postgres_changes')` : Abonnement temps réel

### Services externes
- **Nominatim API** : Géocodage d'adresses
- **OpenStreetMap** : Tuiles de carte

## Structure des données

### Appointment (Rendez-vous)
```javascript
{
  id: uuid,
  employee_id: uuid,
  date: date,
  activity: 'swisscom' | 'ftth_fr' | 'sig' | 'rea' | 'smartmetering',
  mandate_number: string,
  client_name: string,
  phone: string,
  address: string,
  npa: string,
  city: string,
  start_time: time,
  end_time: time,
  note: string,
  is_urgent: boolean,
  pto_reference: string,
  cable_alim: string,
  fibre_1: string,
  fibre_2: string,
  fibre_3: string,
  fibre_4: string
}
```

### Activity Lock
```javascript
{
  activity: string,
  date: date,
  morning_locked: boolean,
  afternoon_locked: boolean
}
```

## Convention de code

- **IDs HTML** : `kebab-case` (activity-lock-modal, intervention-modal)
- **Variables JS** : `camelCase` (currentDate, technicians)
- **Configuration activité** : Objets avec color et name

## Gestion des erreurs

- Vérification de l'initialisation de Supabase avant utilisation
- Gestion des erreurs de géocodage (adresse non trouvée)
- Messages d'erreur génériques côté client
- Logs détaillés dans la console pour le débogage

## Notes de développement

- Les techniciens sont filtrés pour exclure les absents (via table `events`)
- Les interventions sont positionnées en pourcentage selon l'heure (7h-19h = 12h = 100%)
- Les urgences sont toujours affichées en rouge, même si l'activité a une couleur différente
- Le système de notifications utilise Supabase Realtime pour les mises à jour instantanées
- Les textes d'activité sont stockés dans localStorage (configurés dans parametres.html)
- La carte Leaflet est réutilisée entre les ouvertures (instance unique)
- Le géocodage est fait en parallèle pour toutes les adresses lors de l'ouverture de la carte
