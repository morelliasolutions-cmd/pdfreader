# 📘 Documentation Technique Complète - Veloxnumeric Web App

**Version :** 1.0  
**Date :** Décembre 2025  
**Client :** Morellia / Veloxnumeric  
**Type :** Application de Gestion RH et Production pour techniciens  

---

## 📑 Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture technique](#2-architecture-technique)
3. [Base de données Supabase](#3-base-de-données-supabase)
4. [Système d'authentification et RLS](#4-système-dauthentification-et-rls)
5. [Structure des fichiers](#5-structure-des-fichiers)
6. [Fonctionnalités détaillées par page](#6-fonctionnalités-détaillées-par-page)
7. [API JavaScript (VeloxAPI)](#7-api-javascript-veloxapi)
8. [Flux de données et logique métier](#8-flux-de-données-et-logique-métier)
9. [Design et UI/UX](#9-design-et-uiux)
10. [Déploiement et hébergement](#10-déploiement-et-hébergement)
11. [Maintenance et évolutions](#11-maintenance-et-évolutions)

---

## 1. Vue d'ensemble

### 1.1 Objectif du projet

**Veloxnumeric** est une application web de gestion RH et production pour une entreprise de techniciens (télécommunications, installations, réseaux). Elle remplace un ancien backend PHP/Flask par une architecture moderne **frontend statique + Supabase**.

### 1.2 Contexte technique

- **Migration** : PHP/Flask → HTML statique + Supabase
- **Backend** : 100% sur Supabase (BaaS)
- **Frontend** : HTML/CSS/JavaScript pur (pas de framework)
- **Hébergement** : Cloudflare Pages / Netlify
- **Base de données** : PostgreSQL (via Supabase)
- **Authentification** : Supabase Auth

### 1.3 Utilisateurs cibles

| Rôle | Nombre | Accès |
|------|--------|-------|
| **Direction** | 1-2 | Accès complet à tout |
| **Chef de chantier** | 2-3 | Gestion pointages, production |
| **Dispatcher** | 1-2 | Planning, interventions |
| **Technicien** | 10-50 | Ses propres données uniquement |

### 1.4 Fonctionnalités principales

1. **Dashboard** : Vue d'ensemble des KPIs (présences, productivité, alertes)
2. **Pointage** : Saisie quotidienne des heures de travail (début/fin)
3. **Personnel** : Gestion des employés, absences, calendrier, rapports mensuels
4. **Production** : Suivi des interventions par technicien et activité
5. **Planning** : Planification des rendez-vous des techniciens avec carte de Suisse
6. **Inventaire** : Gestion des stocks par dépôt avec modification rapide des quantités
7. **Collaborateurs** : Gestion des techniciens et de leur matériel avec mouvements de stock
8. **Véhicules** : Gestion de la flotte de véhicules
9. **Paramètres** : Gestion du profil utilisateur (web app principale) et des dépôts (module inventaire)

---

## 2. Architecture technique

### 2.1 Architecture globale

```
┌─────────────────────────────────────────────────────────────┐
│                    UTILISATEUR (Navigateur)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (HTML/CSS/JS Statique)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  index.html  │  │dashboard.html│  │pointage.html │      │
│  │  (Login)     │  │   (KPIs)     │  │  (Heures)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │personnel.html│  │production.html│  │parametres.html│     │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  JavaScript Layer:                                           │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  config.js   │  │   api.js     │                         │
│  │ (Supabase    │  │ (VeloxAPI)   │                         │
│  │  Config)     │  │              │                         │
│  └──────────────┘  └──────────────┘                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Supabase Client SDK
                         │ (REST API + Realtime)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (Backend)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │   │
│  │  │employees │ │time_     │ │interven- │ │events   │ │   │
│  │  │          │ │entries   │ │tions     │ │         │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │   │
│  │  │appoint-  │ │depots    │ │inventory │ │vehicles │ │   │
│  │  │ments     │ │          │ │_items    │ │         │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │   │
│  │  ┌──────────┐ ┌──────────┐                          │   │
│  │  │user_roles│ │upload_   │                          │   │
│  │  │          │ │events    │                          │   │
│  │  └──────────┘ └──────────┘                          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Supabase Auth (JWT)                      │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Row Level Security (RLS Policies)             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Storage (private-uploads + Signed URLs)        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Stack technique

| Couche | Technologie | Version | Rôle |
|--------|-------------|---------|------|
| **Frontend** | HTML5 | - | Structure des pages |
| | CSS3 / Tailwind CSS | CDN | Styling (via CDN) |
| | JavaScript Vanilla | ES6+ | Logique métier |
| **Backend** | Supabase | Latest | BaaS complet |
| | PostgreSQL | 15+ | Base de données |
| **Auth** | Supabase Auth | - | JWT + Session |
| **Hosting** | Cloudflare Pages | - | Static hosting + CDN |
| **CDN** | jsDelivr | - | Supabase JS SDK |

### 2.3 Choix architecturaux

#### ✅ Pourquoi du HTML statique ?

1. **Performance** : Pas de serveur backend à maintenir
2. **Coût** : Hébergement gratuit (Cloudflare/Netlify)
3. **Sécurité** : Pas de surface d'attaque serveur
4. **Scalabilité** : CDN global automatique
5. **Simplicité** : Pas de build step, pas de Node.js

#### ✅ Pourquoi Supabase ?

1. **Backend complet** : DB + Auth + Storage + Realtime
2. **PostgreSQL** : Base de données robuste et SQL complet
3. **RLS natif** : Sécurité au niveau des lignes
4. **API auto-générée** : REST + GraphQL automatique
5. **Dashboard intégré** : Gestion facile des données

#### ⚠️ Limitations connues

1. **Cache browser** : Nécessite des query params `?v=X` pour forcer le rechargement
2. **Pas de SSR** : Tout est rendu côté client (SEO non prioritaire ici)
3. **CORS local** : Nécessite un serveur HTTP local pour dev (`python -m http.server`)

---

## 3. Base de données Supabase

### 3.1 Schéma relationnel

```
┌──────────────────┐
│   auth.users     │ (Supabase géré)
│──────────────────│
│ id (UUID) PK     │
│ email            │
│ encrypted_pwd    │
│ created_at       │
└────────┬─────────┘
         │
         │ 1:1
         ▼
┌──────────────────┐
│   user_roles     │
│──────────────────│
│ id (UUID) PK     │
│ user_id (FK)     │───┐
│ role (TEXT)      │   │ direction, chef_chantier,
│ created_at       │   │ dispatcher, technicien
│ updated_at       │   │
└──────────────────┘   │
                        │
         ┌──────────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐
│   employees      │
│──────────────────│
│ id (UUID) PK     │
│ first_name       │
│ last_name        │
│ email            │
│ phone            │
│ type             │ (atelier/terrain)
│ status           │ (active/inactive)
│ contract_start   │ (pour vacances prorata)
│ annual_vacation  │ (25 jours par défaut)
│ target_hours     │ (heures mensuelles cibles)
│ created_at       │
└────────┬─────────┘
         │
         │ 1:N
         ├────────────────────────────┐
         │                            │
         ▼                            ▼
┌──────────────────┐        ┌──────────────────┐
│  time_entries    │        │  interventions   │
│──────────────────│        │──────────────────│
│ id (UUID) PK     │        │ id (UUID) PK     │
│ employee_id (FK) │        │ employee_id (FK) │
│ date (DATE)      │        │ date (DATE)      │
│ start_time       │        │ canton (TEXT)    │
│ end_time         │        │ activity (TEXT)  │
│ total_hours      │        │ amount_chf       │
│ filled_by        │        │ created_at       │
│ created_at       │        │ updated_at       │
│ updated_at       │        └──────────────────┘
└──────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐
│     events       │
│──────────────────│
│ id (UUID) PK     │
│ employee_id (FK) │
│ date (DATE)      │
│ type (TEXT)      │ (vacation, sickness,
│ created_at       │  public_holiday, absent)
│ updated_at       │
└──────────────────┘
```

### 3.2 Tables détaillées

#### 📋 Table: `employees`

Stocke les informations des employés/techniciens.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique |
| `first_name` | TEXT | NOT NULL | Prénom |
| `last_name` | TEXT | NOT NULL | Nom |
| `email` | TEXT | UNIQUE | Email professionnel |
| `phone` | TEXT | - | Numéro de téléphone |
| `type` | TEXT | CHECK (atelier, terrain) | Type d'employé |
| `status` | TEXT | CHECK (active, inactive), DEFAULT 'active' | Statut actif/inactif |
| `contract_start_date` | DATE | - | Date début contrat (pour vacances) |
| `annual_vacation_days` | INTEGER | DEFAULT 25 | Jours de vacances annuels |
| `target_hours` | NUMERIC | DEFAULT 176 | Heures mensuelles cibles |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de modification |

**Index :**
- `idx_employees_email` sur `email`
- `idx_employees_status` sur `status`

---

#### ⏱️ Table: `time_entries`

Enregistre les pointages quotidiens (heures de travail).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique |
| `employee_id` | UUID | FOREIGN KEY → employees(id), NOT NULL | Employé concerné |
| `date` | DATE | NOT NULL | Date du pointage |
| `start_time` | TIME | NOT NULL | Heure de début |
| `end_time` | TIME | NOT NULL | Heure de fin |
| `total_hours` | NUMERIC(5,2) | NOT NULL | Heures totales (calculées) |
| `filled_by` | TEXT | - | Qui a rempli le pointage |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de modification |

**Contraintes uniques :**
- `UNIQUE (employee_id, date)` : Un seul pointage par employé par jour

**Index :**
- `idx_time_entries_employee_date` sur `(employee_id, date)`
- `idx_time_entries_date` sur `date`

**Logique de calcul `total_hours` :**
```javascript
// Heures brutes
let hours = (end_time - start_time) / 3600000; // millisecondes → heures

// Retirer 1h si travail sur la pause déjeuner (12h-13h)
if (start_time < '13:00' && end_time > '12:00') {
    hours -= 1;
}

total_hours = Math.max(0, hours).toFixed(2);
```

---

#### 🏭 Table: `interventions`

Suit les interventions/productions des techniciens.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique |
| `employee_id` | UUID | FOREIGN KEY → employees(id), NOT NULL | Technicien |
| `date` | DATE | NOT NULL | Date de l'intervention |
| `canton` | TEXT | NOT NULL | Canton (GE, VD, FR, etc.) |
| `activity` | TEXT | NOT NULL | Type (Swisscom, REA, TBL, etc.) |
| `amount_chf` | NUMERIC(10,2) | NOT NULL | Montant en CHF |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de modification |

**Index :**
- `idx_interventions_employee_date` sur `(employee_id, date)`
- `idx_interventions_date` sur `date`
- `idx_interventions_activity` sur `activity`

**Activités possibles :**
- Swisscom
- REA
- TBL
- SBB
- Autres

---

#### 📅 Table: `events`

Gère les absences, congés, jours fériés.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique |
| `employee_id` | UUID | FOREIGN KEY → employees(id), NOT NULL | Employé concerné |
| `date` | DATE | NOT NULL | Date de l'événement |
| `type` | TEXT | NOT NULL, CHECK | Type d'événement |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de modification |

**Types d'événements possibles :**
- `vacation` : Congés payés
- `sickness` : Maladie
- `public_holiday` : Jour férié
- `absent` : Absence non justifiée
- `paid_leave` : Congé sans solde

**Index :**
- `idx_events_employee_date` sur `(employee_id, date)`
- `idx_events_date` sur `date`

---

#### 📦 Table: `depots`

Gère les dépôts/entrepôts pour l'inventaire.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique |
| `name` | TEXT | NOT NULL, UNIQUE | Nom du dépôt (ex: "Dépôt 1") |
| `description` | TEXT | - | Description optionnelle |
| `address` | TEXT | - | Adresse du dépôt |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de modification |

**Index :**
- `idx_depots_name` sur `name`

---

#### 📋 Table: `inventory_items`

Gère les articles d'inventaire par dépôt.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique |
| `depot_id` | UUID | FOREIGN KEY → depots(id), NOT NULL | Dépôt concerné |
| `reference` | TEXT | NOT NULL | Référence article |
| `name` | TEXT | NOT NULL | Nom de l'article |
| `category` | TEXT | NOT NULL, DEFAULT 'Outils' | Catégorie |
| `supplier` | TEXT | - | Fournisseur |
| `price` | NUMERIC(10,2) | NOT NULL, DEFAULT 0.0 | Prix unitaire (CHF) |
| `quantity` | INTEGER | NOT NULL, DEFAULT 0 | Quantité en stock |
| `threshold` | INTEGER | NOT NULL, DEFAULT 0 | Seuil de sécurité |
| `photo` | TEXT | - | URL photo |
| `website_url` | TEXT | - | Lien vers le site |
| `monthly_need` | INTEGER | DEFAULT 0 | Besoin mensuel |
| `weekly_need` | INTEGER | DEFAULT 0 | Besoin hebdomadaire par technicien |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de modification |

**Contraintes uniques :**
- `UNIQUE (depot_id, reference)` : Une référence unique par dépôt

**Index :**
- `idx_inventory_items_depot` sur `depot_id`
- `idx_inventory_items_reference` sur `reference`
- `idx_inventory_items_category` sur `category`

**Logique de calcul stock recommandé :**
```javascript
recommended = weekly_need × nombre_techniciens_actifs
```

---

#### 🚗 Table: `vehicles`

Gère la flotte de véhicules de l'entreprise.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique |
| `make` | TEXT | NOT NULL | Marque (ex: "Volkswagen") |
| `model` | TEXT | NOT NULL | Modèle (ex: "Transporter") |
| `year` | INTEGER | NOT NULL | Année |
| `license_plate` | TEXT | NOT NULL, UNIQUE | Plaque d'immatriculation |
| `mileage` | INTEGER | NOT NULL, DEFAULT 0 | Kilométrage |
| `tire_type` | TEXT | NOT NULL, DEFAULT 'Été' | Type de pneu |
| `assignment_status` | TEXT | NOT NULL, DEFAULT 'Available' | Statut |
| `assigned_to` | TEXT | - | Personne assignée (employé ou autre) |
| `owner` | TEXT | - | Propriétaire (Entreprise / Location / Autre) |
| `notes` | TEXT | - | Notes diverses |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de modification |

**Contraintes :**
- `CHECK (tire_type IN ('Été', 'Hiver', 'Toutes saisons'))`
- `CHECK (assignment_status IN ('Available', 'Assigned', 'Maintenance', 'Out of Service'))`

**Index :**
- `idx_vehicles_license_plate` sur `license_plate`
- `idx_vehicles_assigned_to` sur `assigned_to`
- `idx_vehicles_status` sur `assignment_status`

**Note :** `assigned_to` est un champ texte libre qui peut contenir le nom d'un employé (technicien ou bureau) ou toute autre personne. Le champ `owner` indique si le véhicule appartient à l'entreprise, est en location, etc.

---

#### 🛠️ Table: `employee_equipment`

Gère le matériel assigné aux techniciens (scanné via l'application mobile).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique |
| `employee_id` | UUID | FOREIGN KEY → employees(id), NOT NULL | Technicien concerné |
| `inventory_item_id` | UUID | FOREIGN KEY → inventory_items(id) | Lien optionnel avec l'inventaire |
| `reference` | TEXT | NOT NULL | Référence scannée (code-barres/QR) |
| `name` | TEXT | NOT NULL | Nom du matériel |
| `category` | TEXT | - | Catégorie |
| `quantity` | INTEGER | NOT NULL, DEFAULT 1 | Quantité |
| `scanned_at` | TIMESTAMPTZ | - | Date/heure du scan (via mobile) |
| `scanned_by` | TEXT | - | Email ou user_id du scanner |
| `returned` | BOOLEAN | DEFAULT FALSE | Matériel retourné |
| `returned_at` | TIMESTAMPTZ | - | Date de retour |
| `returned_by` | TEXT | - | Qui a marqué comme retourné |
| `depot_id` | UUID | FOREIGN KEY → depots(id) | Dépôt d'origine du matériel |
| `site_address` | TEXT | - | Adresse du chantier (renseignée via web app mobile) |
| `notes` | TEXT | - | Notes optionnelles |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de modification |

**Index :**
- `idx_employee_equipment_employee` sur `employee_id`
- `idx_employee_equipment_reference` sur `reference`
- `idx_employee_equipment_returned` sur `returned`
- `idx_employee_equipment_inventory_item` sur `inventory_item_id`

**Utilisation :**
- Le technicien scanne le matériel via l'app mobile
- Le matériel apparaît automatiquement dans `collaborateurs.html`
- Le chef de chantier peut cocher/décocher le retour
- **Décompte automatique du stock** dans `inventory_items` lors de l'ajout
- **Réincrémentation du stock** lors du retour ou de la suppression
- **Adresse du chantier** (`site_address`) renseignée via la web app mobile pour traçabilité
- Impression de la liste disponible

**Voir :** `API_MOBILE_SCAN.md` pour l'intégration mobile

---

#### 📅 Table: `appointments`

Gère les rendez-vous/interventions planifiés pour les techniciens.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique |
| `employee_id` | UUID | FOREIGN KEY → employees(id), NOT NULL | Technicien assigné |
| `date` | DATE | NOT NULL | Date du rendez-vous |
| `start_time` | TIME | NOT NULL | Heure de début |
| `end_time` | TIME | NOT NULL | Heure de fin |
| `activity` | TEXT | NOT NULL | Type d'activité (swisscom, ftth_fr, sig, rea, smartmetering) |
| `mandate_number` | TEXT | NOT NULL | Numéro de mandat |
| `client_name` | TEXT | - | Nom du client |
| `phone` | TEXT | - | Téléphone |
| `address` | TEXT | NOT NULL | Adresse complète |
| `npa` | TEXT | - | Code postal |
| `city` | TEXT | - | Ville |
| `note` | TEXT | - | Notes |
| `is_urgent` | BOOLEAN | DEFAULT FALSE | Urgence |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de modification |
| `created_by` | TEXT | - | Créateur |

**Index :**
- `idx_appointments_employee_date` sur `(employee_id, date)`
- `idx_appointments_date` sur `date`

---

#### 🔐 Table: `user_roles`

Gère les rôles utilisateurs pour RLS.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique |
| `user_id` | UUID | FOREIGN KEY → auth.users(id), UNIQUE | Utilisateur Supabase |
| `role` | TEXT | NOT NULL, CHECK, DEFAULT 'technicien' | Rôle attribué |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de modification |

**Rôles valides :**
- `direction` : Accès complet
- `chef_chantier` : Gestion opérationnelle
- `dispatcher` : Planning et interventions
- `technicien` : Ses propres données uniquement

**Contrainte :**
- `UNIQUE (user_id)` : Un utilisateur = un rôle

---

### 3.3 Vues SQL

#### 📊 Vue: `employee_vacation_summary`

Calcule automatiquement les vacances au prorata pour chaque employé.

```sql
CREATE OR REPLACE VIEW employee_vacation_summary AS
SELECT 
    e.id,
    e.first_name,
    e.last_name,
    e.contract_start_date,
    e.annual_vacation_days,
    v.days_earned,
    v.days_used,
    v.days_remaining,
    v.percentage_acquired
FROM employees e
CROSS JOIN LATERAL calculate_vacation_days_prorata(e.id, CURRENT_DATE) v
WHERE e.status = 'active';
```

**Retourne :**
- `days_earned` : Jours acquis au prorata (ex: 14.7)
- `days_used` : Jours déjà pris (ex: 5)
- `days_remaining` : Solde restant (ex: 9.7)
- `percentage_acquired` : % de l'année écoulée (ex: 58.9%)

---

### 3.4 Fonctions SQL

#### 🧮 Fonction: `get_user_role()`

Retourne le rôle de l'utilisateur authentifié (pour RLS).

```sql
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM user_roles
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

#### 📅 Fonction: `calculate_vacation_days_prorata()`

Calcule les jours de vacances acquis au prorata.

**Signature :**
```sql
calculate_vacation_days_prorata(
    p_employee_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    days_earned NUMERIC,
    days_used NUMERIC,
    days_remaining NUMERIC,
    percentage_acquired NUMERIC
)
```

**Logique :**
1. Récupère `contract_start_date` et `annual_vacation_days`
2. Calcule les jours écoulés depuis le début du contrat
3. Prorata : `(jours_écoulés / 365) × annual_vacation_days`
4. Compte les jours déjà pris (type='vacation' dans `events`)
5. Solde = acquis - pris

---

#### 📤 Table: `upload_events` (Centralisation Uploads & Webhooks)

Cette table est la pièce centrale de l'architecture "Private Uploads + DB Trigger". Elle sert à stocker les références d'upload et à déclencher les automatisations via n8n.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | ID unique de l'événement |
| `event_type` | TEXT | NOT NULL | Type d'événement (`intervention_photo`, `expense_receipt`, `accident_report`, `breakdown_report`) |
| `file_path` | TEXT | - | Chemin vers le fichier dans le bucket `private-uploads` (NULL si pas de fichier) |
| `metadata` | JSONB | - | Données JSON contextuelles (ex: `amount`, `comment`, `intervention_id`, etc.) |
| `status` | TEXT | DEFAULT 'pending' | Statut du traitement (pending, processed, error) |
| `created_by` | UUID | DEFAULT auth.uid() | Utilisateur ayant généré l'événement |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de l'événement |

**Fonctionnement :**
1. L'app mobile upload un fichier (Secure Bucket) ou génère une action.
2. Une ligne est insérée dans `upload_events` (via `triggerWebhookDB`).
3. Un trigger Supabase (ou polling n8n) détecte l'INSERT.
4. n8n traite la demande (Envoi Email, OCR, Archivage, etc.).

---

## 4. Système d'authentification et RLS

### 4.1 Authentification Supabase

**Méthode :** Email + Password (JWT)

**Flux de connexion :**
```
1. Utilisateur saisit email + password
2. Frontend appelle: supabase.auth.signInWithPassword()
3. Supabase valide et retourne un JWT (access_token + refresh_token)
4. Session stockée dans localStorage (auto par Supabase)
5. Chaque requête API inclut le JWT dans Authorization header
6. RLS policies vérifient auth.uid() et get_user_role()
```

**Session :**
- **Durée** : 3600s (1h)
- **Auto-refresh** : Oui (refresh_token)
- **Persistance** : localStorage
- **Détection** : `detectSessionInUrl: true`

---

### 4.2 Row Level Security (RLS)

**Principe :** Chaque table a des **policies** qui filtrent automatiquement les données selon le rôle.

#### 📋 RLS sur `employees`

| Action | Direction | Chef chantier | Dispatcher | Technicien |
|--------|-----------|---------------|------------|------------|
| **SELECT** | ✅ Tous | ✅ Tous | ✅ Tous | 👤 Son profil uniquement |
| **INSERT** | ✅ Oui | ❌ Non | ❌ Non | ❌ Non |
| **UPDATE** | ✅ Tous | ❌ Non | ❌ Non | 👤 Son profil (champs limités) |
| **DELETE** | ✅ Oui | ❌ Non | ❌ Non | ❌ Non |

**Policy SELECT exemple :**
```sql
CREATE POLICY "Employees read policy"
ON employees FOR SELECT
USING (
    CASE get_user_role()
        WHEN 'direction' THEN true
        WHEN 'chef_chantier' THEN true
        WHEN 'dispatcher' THEN true
        WHEN 'technicien' THEN 
            id IN (
                SELECT id FROM employees
                WHERE email = auth.jwt()->>'email'
            )
        ELSE false
    END
);
```

---

#### ⏱️ RLS sur `time_entries`

| Action | Direction | Chef chantier | Dispatcher | Technicien |
|--------|-----------|---------------|------------|------------|
| **SELECT** | ✅ Tous | ✅ Tous | ✅ Tous | 👤 Ses pointages |
| **INSERT** | ✅ Oui | ✅ Oui | ❌ Non | 👤 Ses pointages |
| **UPDATE** | ✅ Tous | ✅ Tous | ❌ Non | 👤 Ses pointages |
| **DELETE** | ✅ Oui | ✅ Oui | ❌ Non | ❌ Non |

---

#### 🏭 RLS sur `interventions`

| Action | Direction | Chef chantier | Dispatcher | Technicien |
|--------|-----------|---------------|------------|------------|
| **SELECT** | ✅ Tous | ✅ Tous | ✅ Tous | 👤 Ses interventions |
| **INSERT** | ✅ Oui | ✅ Oui | ✅ Oui | ❌ Non |
| **UPDATE** | ✅ Tous | ✅ Tous | ✅ Oui | ❌ Non |
| **DELETE** | ✅ Oui | ✅ Oui | ❌ Non | ❌ Non |

---

#### 📅 RLS sur `events`

| Action | Direction | Chef chantier | Dispatcher | Technicien |
|--------|-----------|---------------|------------|------------|
| **SELECT** | ✅ Tous | ✅ Tous | ✅ Tous | 👤 Ses événements |
| **INSERT** | ✅ Oui | ✅ Oui | ✅ Oui | 👤 Demande de congés |
| **UPDATE** | ✅ Tous | ✅ Tous | ✅ Oui | ❌ Non |
| **DELETE** | ✅ Oui | ✅ Oui | ✅ Oui | ❌ Non |

---

### 4.3 Sécurité frontend

**Protection des routes :**

Chaque page HTML (sauf `index.html`) vérifie la session au chargement :

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    // Empêcher les vérifications multiples
    if (isChecking) return;
    isChecking = true;
    
    // Attendre que l'API soit chargée
    let attempts = 0;
    while (!window.VeloxAPI && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    // Vérifier la session
    const session = await window.VeloxAPI.getSession();
    
    if (!session || !session.user) {
        // Pas de session → Redirection vers login
        window.location.replace('index.html');
        return;
    }
    
    // Session valide → Charger la page
    currentUser = session.user;
    // ... reste de la logique
});
```

**Points clés :**
1. ✅ Vérification côté client (pas de routes protégées serveur)
2. ✅ RLS côté serveur assure la vraie sécurité
3. ✅ Frontend empêche juste l'accès visuel

---

## 5. Structure des fichiers

### 5.1 Arborescence complète

```
veloxnumeric-web/
│
├── index.html                    # Login / Page d'accueil
├── dashboard.html                # Tableau de bord (KPIs)
├── pointage.html                 # Pointage des heures
├── personnel.html                # Gestion du personnel
├── production.html               # Suivi production
├── planif.html                   # Planning des rendez-vous
├── parametres.html               # Paramètres utilisateur
│
├── inventaire/                   # Module inventaire
│   ├── inventaire.html           # Gestion des stocks par dépôt (avec modification rapide quantités)
│   ├── collaborateurs.html      # Gestion techniciens et matériel (avec mouvements de stock)
│   ├── vehicule.html             # Gestion de la flotte
│   ├── parametres.html           # Paramètres inventaire (dépôts, logo) - différent de ../parametres.html
│   └── ...                       # Autres pages inventaire
│
**Note sur les liens :**
- Les liens vers "Inventaire" dans la web app principale pointent vers `inventaire/inventaire.html`
- Les fichiers dans `inventaire/` utilisent des liens relatifs (`inventaire.html`, `collaborateurs.html`, etc.)
│
├── js/
│   ├── config.js                 # Configuration Supabase
│   └── api.js                    # VeloxAPI (wrapper Supabase)
│
├── css/
│   └── styles.css                # Styles personnalisés (optionnel)
│
├── DOCUMENTATION_TECHNIQUE.md    # 📘 Ce fichier
├── GUIDE_RLS_VACANCES.md         # Guide RLS et vacances
├── SETUP_RLS.sql                 # Script SQL pour RLS
├── SETUP_VACATION_PRORATA.sql    # Script SQL vacances
├── RECALCULATE_HOURS.sql         # Recalculer heures pointages
│
├── README.md                     # Instructions générales
├── START.bat                     # Démarrer serveur (Windows)
└── START.sh                      # Démarrer serveur (Linux/Mac)
```

---

### 5.2 Fichiers clés

#### 📄 `js/config.js`

**Rôle :** Initialiser le client Supabase et le rendre disponible globalement.

```javascript
const SUPABASE_URL = 'https://wdurkaelytgjbcsmkzgb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJ...'; // Clé publique anonyme

// Sauvegarder la lib avant de créer le client
const SupabaseLib = window.supabase;

// Créer le client
const supabaseClient = SupabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// Exposer globalement
window.supabase = supabaseClient;
```

**⚠️ Important :**
- Chargé **APRÈS** `@supabase/supabase-js@2` CDN
- Version `?v=X` pour forcer le cache refresh

---

#### 📄 `js/api.js`

**Rôle :** Wrapper orienté métier autour du client Supabase.

**Structure :**

```javascript
class VeloxAPI {
    constructor() {
        this.supabase = window.supabase;
        this.currentUser = null;
    }

    // ========== AUTHENTIFICATION ==========
    async signIn(email, password) { ... }
    async signOut() { ... }
    async getCurrentUser() { ... }
    async getSession() { ... }

    // ========== EMPLOYEES ==========
    async getEmployees(filters = {}) { ... }
    async getEmployee(id) { ... }
    async createEmployee(data) { ... }
    async updateEmployee(id, data) { ... }
    async deleteEmployee(id) { ... }
    async getEmployeeStats(id) { ... }

    // ========== TIME ENTRIES ==========
    async getTimeEntries(employeeId, dateStart, dateEnd) { ... }
    async saveTimeEntry(data) { ... }
    async deleteTimeEntry(id) { ... }

    // ========== INTERVENTIONS ==========
    async getInterventions(filters = {}) { ... }
    async getInterventionsRange(startDate, endDate) { ... }
    async createIntervention(data) { ... }
    async deleteIntervention(id) { ... }

    // ========== EVENTS ==========
    async getEmployeeEvents(employeeId, startDate, endDate) { ... }
    async createEvent(data) { ... }
    async createEventRange(data) { ... }
    async deleteEvent(id) { ... }
}

// Instance globale
window.VeloxAPI = new VeloxAPI();
```

**Utilisation :**

```javascript
// Connexion
const result = await window.VeloxAPI.signIn('user@exemple.com', 'password');

// Récupérer des employés
const employees = await window.VeloxAPI.getEmployees({ status: 'active' });

// Créer un pointage
await window.VeloxAPI.saveTimeEntry({
    employee_id: 'uuid-xxx',
    date: '2025-12-28',
    start_time: '08:00:00',
    end_time: '17:00:00',
    total_hours: 8.0
});
```

---

## 6. Fonctionnalités détaillées par page

### 6.1 📄 `index.html` - Login

**Objectif :** Authentifier l'utilisateur.

**Fonctionnalités :**
- ✅ Formulaire email + password
- ✅ Connexion via Supabase Auth
- ✅ Gestion des erreurs (identifiants incorrects)
- ✅ Redirection automatique vers dashboard si déjà connecté
- ✅ Design moderne avec logo Veloxnumeric

**Flux utilisateur :**
1. Utilisateur arrive sur `index.html`
2. S'il est déjà connecté → Redirection automatique vers `dashboard.html`
3. Sinon, afficher le formulaire de login
4. Soumission du formulaire → `VeloxAPI.signIn()`
5. Si succès → Redirection vers `dashboard.html`
6. Si échec → Message d'erreur

**Code clé :**

```javascript
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const data = await window.VeloxAPI.signIn(email, password);
        currentUser = data.user;
        window.location.replace('dashboard.html');
    } catch (error) {
        console.error('Erreur login:', error);
        document.getElementById('loginError').textContent = error.message;
    }
});
```

---

### 6.2 📊 `dashboard.html` - Tableau de bord

**Objectif :** Vue d'ensemble des KPIs de l'entreprise.

**KPIs affichés :**

1. **Total Employés** : Nombre d'employés actifs
2. **Présents Aujourd'hui** : Employés avec un pointage aujourd'hui
3. **Taux d'Absentéisme** : % d'absences sur le mois
4. **Score de Productivité** : Basé sur le CA moyen par technicien

**Graphiques (statiques pour l'instant) :**
- 📊 Répartition des présences (Présents / Absents / Congés / Maladie)
- 📈 Tendances productivité (CA mensuel)
- 🔔 Alertes et demandes récentes

**Fonctionnalités :**
- ✅ Sidebar de navigation
- ✅ Header avec nom utilisateur et déconnexion
- ✅ Cartes KPI interactives
- ✅ Graphiques avec animations (Tailwind CSS)
- ❌ Graphiques dynamiques (à implémenter avec Chart.js)

**Données chargées :**
```javascript
async function loadDashboard() {
    const employees = await window.VeloxAPI.getEmployees({ status: 'active' });
    const today = formatDate(new Date());
    const timeEntries = await window.VeloxAPI.getTimeEntries(null, today, today);
    
    // Calculer KPIs
    document.getElementById('totalEmployees').textContent = employees.length;
    document.getElementById('presentToday').textContent = timeEntries.length;
    // ... etc
}
```

---

### 6.3 ⏱️ `pointage.html` - Pointage des heures

**Objectif :** Saisir les heures de travail quotidiennes de chaque employé.

**Interface :**

```
┌──────────────────────────────────────────────────────┐
│  [Calendrier mensuel] [Sélecteur de date]            │
│  📅 Décembre 2025                                     │
│  [Jour sélectionné: Lundi 23 Décembre 2025]          │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  KPIs du jour:                                        │
│  ✅ Taux présence: 85%                                │
│  ⏱️ Heures moyennes: 8.2h                            │
│  📊 Total heures: 156h                                │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  [🔍 Filtrer: Tous | Atelier | Terrain]              │
│                                                        │
│  ┌──────────────────────────────────────────────┐   │
│  │ 👤 Jean Dupont                               │   │
│  │ Début: [08:00] Fin: [17:12] [💾 Sauvegarder] │   │
│  │ ✅ Traité • 450 CHF                           │   │
│  └──────────────────────────────────────────────┘   │
│                                                        │
│  ┌──────────────────────────────────────────────┐   │
│  │ 👤 Sarah Meier                               │   │
│  │ Début: [     ] Fin: [     ] [💾 Sauvegarder] │   │
│  │ ⚠️ Non traité                                 │   │
│  └──────────────────────────────────────────────┘   │
│                                                        │
│  ... (autres employés)                                │
└──────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

1. **Calendrier interactif** :
   - Navigation mois par mois
   - Jours colorés selon statut :
     - 🟢 Vert : Tous les pointages remplis
     - 🔴 Rouge : Pointages manquants
     - ⚪ Gris : Week-end ou futur
   - Clic sur une date → Charge les pointages du jour

2. **Liste des employés** :
   - Filtre par type (Tous / Atelier / Terrain)
   - Champs pré-remplis si pointage existant
   - Sauvegarde individuelle par employé
   - Affiche le montant de production du jour (discret, en gris)

3. **Logique métier** :
   - **Heure de fin par défaut** : 17:12
   - **Calcul automatique des heures** :
     ```javascript
     let hours = (end_time - start_time) / 3600000;
     // Retirer 1h si pause déjeuner (12h-13h)
     if (start_time < '13:00' && end_time > '12:00') {
         hours -= 1;
     }
     total_hours = Math.max(0, hours);
     ```
   - **Week-end masqué** : Samedi/Dimanche → message "Week-end - Aucun pointage requis"

4. **Performance** :
   - ✅ Chargement unique des pointages du mois (pas jour par jour)
   - ✅ Rendu instantané du calendrier

**Code clé - Sauvegarde d'un pointage :**

```javascript
async function saveCard(empId) {
    const start = document.getElementById(`start_${empId}`).value;
    const end = document.getElementById(`end_${empId}`).value;
    const dateStr = formatDate(currentDate);
    
    // Calculer total_hours
    let totalHours = 0;
    if (start && end) {
        const startTime = new Date(`2000-01-01T${start}`);
        const endTime = new Date(`2000-01-01T${end}`);
        let hours = (endTime - startTime) / (1000 * 60 * 60);
        
        // Pause déjeuner
        const noon = new Date(`2000-01-01T12:00:00`);
        const onePm = new Date(`2000-01-01T13:00:00`);
        if (startTime < onePm && endTime > noon) {
            hours -= 1;
        }
        
        totalHours = Math.max(0, hours);
    }
    
    // Sauvegarder (insert ou update)
    const { data: existing } = await supabase
        .from('time_entries')
        .select('id')
        .eq('employee_id', empId)
        .eq('date', dateStr)
        .single();
    
    if (existing) {
        // UPDATE
        await supabase
            .from('time_entries')
            .update({
                start_time: start,
                end_time: end,
                total_hours: totalHours.toFixed(2),
                filled_by: currentUser.email.split('@')[0]
            })
            .eq('id', existing.id);
    } else {
        // INSERT
        await supabase
            .from('time_entries')
            .insert({
                employee_id: empId,
                date: dateStr,
                start_time: start,
                end_time: end,
                total_hours: totalHours.toFixed(2),
                filled_by: currentUser.email.split('@')[0]
            });
    }
    
    await fetchData(); // Refresh
}
```

---

### 6.4 👥 `personnel.html` - Gestion du personnel

**Objectif :** Gérer les employés, leurs absences, et générer des rapports mensuels.

**Interface principale :**

```
┌──────────────────────────────────────────────────────────────┐
│ [🔍 Rechercher] [Filtrer: Tous/Atelier/Terrain]              │
│ [➕ Ajouter un employé]                                       │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│ 📋 Liste des employés (tableau)                               │
│                                                                │
│ NOM/PRÉNOM    TYPE      STATUT    ACTIONS                     │
│ Jean Dupont   Terrain   ✅ Actif  [👁️] [✏️] [🗑️]           │
│ Sarah Meier   Atelier   ✅ Actif  [👁️] [✏️] [🗑️]           │
│ ...                                                            │
└──────────────────────────────────────────────────────────────┘

[Panneau de détail employé ouvert à droite →]
```

**Fonctionnalités :**

1. **Liste des employés** :
   - Tableau avec tri et filtres
   - Recherche par nom
   - Filtre par type (Atelier/Terrain)
   - Actions : Voir détail, Modifier, Supprimer

2. **Panneau de détail** (slide-in à droite) :
   - ✅ Informations personnelles (nom, email, phone, type, statut)
   - ✅ **Heures mensuelles** avec barre de progression :
     ```
     Décembre 2025: 142h / 176h (80.7%)
     [████████████░░░░░░] 🟢 Dans les temps
     ```
   - ✅ **Absences** : Total congés, maladie, etc.
   - ✅ **Solde vacances** (au prorata si `contract_start_date` défini)
   - ✅ Bouton "Notifier Absence"
   - ✅ Bouton "Calendrier" (modal)
   - ✅ Bouton "Rapport mensuel" (modal détaillé)
   - ✅ Bouton "Modifier le profil"

3. **Modal "Notifier Absence"** :
   - Sélection de date (ou plage de dates)
   - Type : Congés / Maladie / Jours fériés / Congé s/solde
   - Sauvegarde dans la table `events`

4. **Modal "Calendrier"** :
   - Calendrier mensuel coloré
   - Légende :
     - 🔵 Bleu : Congés
     - 🔴 Rouge : Maladie
     - 🟣 Violet : Jours fériés
   - Navigation mois par mois
   - Affiche les absences de l'employé

5. **Modal "Rapport mensuel"** :
   - Sélecteur mois + année
   - **Résumé en haut** :
     ```
     Total heures: 142.5h
     Jours travaillés: 18
     Moyenne/jour: 7.9h
     ```
   - **Tableau détaillé jour par jour** :
     ```
     Date       Jour    Début    Fin      Total   Statut
     2025-12-01 Lun.    08:00    17:00    8.0h    ✓ Validé
     2025-12-02 Mar.    -        -        -       ⚠ Manquant
     2025-12-03 Mer.    08:00    17:00    8.0h    ✓ Validé
     2025-12-06 Sam.    -        -        -       Week-end
     ...
     ```
   - Boutons **Imprimer** et **Télécharger PDF**

6. **Modals "Ajouter/Modifier employé"** :
   - Formulaire complet (prénom, nom, email, phone, type, statut)
   - Validation côté client
   - Sauvegarde via `VeloxAPI.createEmployee()` ou `updateEmployee()`

**Code clé - Rapport mensuel :**

```javascript
async function loadMonthlyReport() {
    const month = parseInt(document.getElementById('reportMonth').value);
    const year = parseInt(document.getElementById('reportYear').value);
    
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    // Récupérer pointages du mois
    const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('*')
        .eq('employee_id', currentEmployeeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');
    
    // Récupérer événements (absences)
    const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('employee_id', currentEmployeeId)
        .gte('date', startDate)
        .lte('date', endDate);
    
    // Générer le tableau jour par jour
    let totalHours = 0;
    let daysWorked = 0;
    
    for (let d = 1; d <= lastDay; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const timeEntry = timeEntries?.find(te => te.date === dateStr);
        const event = events?.find(e => e.date === dateStr);
        
        if (timeEntry) {
            totalHours += parseFloat(timeEntry.total_hours || 0);
            daysWorked++;
        }
        
        // Afficher ligne dans le tableau
        // ... (voir code source)
    }
    
    // Mettre à jour le résumé
    document.getElementById('reportTotalHours').textContent = totalHours.toFixed(1) + 'h';
    document.getElementById('reportDaysWorked').textContent = daysWorked;
    document.getElementById('reportAverage').textContent = 
        daysWorked > 0 ? (totalHours / daysWorked).toFixed(1) + 'h' : '0h';
}
```

**Code clé - Imprimer le rapport :**

```javascript
function printReport() {
    const printWindow = window.open('', '_blank');
    const employeeName = document.getElementById('reportEmployeeName').textContent;
    const month = document.getElementById('reportMonth').options[...].text;
    const totalHours = document.getElementById('reportTotalHours').textContent;
    const tableBody = document.getElementById('reportTableBody').innerHTML;
    
    const htmlContent = '<!DOCTYPE html><html>...' +
        '<h1>Rapport d\'heures - ' + employeeName + '</h1>' +
        '<div>' + month + '</div>' +
        '<div>Total: ' + totalHours + '</div>' +
        '<table>' + tableBody + '</table>' +
        '<script>window.onload = function() { window.print(); }</script>' +
        '</html>';
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
}
```

---

### 6.5 🏭 `production.html` - Suivi production

**Objectif :** Enregistrer et suivre les interventions par technicien.

**Interface :**

```
┌──────────────────────────────────────────────────────────┐
│ [📅 Date: 2025-12-28] [Période: Aujourd'hui ▼]           │
├──────────────────────────────────────────────────────────┤
│ KPIs:                                                     │
│ 💰 Total CHF: 12,450  📊 Swisscom: 8,200  🔧 REA: 4,250 │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ [🔍 Filtrer technicien...]                                │
│                                                            │
│ TECHNICIEN       CANTON  ACTIVITÉ   MONTANT CHF  ACTIONS │
│ Jean Dupont      GE      Swisscom   450          [🗑️]   │
│ Jean Dupont      VD      REA         350          [🗑️]   │
│ Sarah Meier      FR      Swisscom   520          [🗑️]   │
│ ...                                                        │
│                                                            │
│ [➕ Ajouter une intervention]                             │
└──────────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

1. **Sélection de date** :
   - Date picker en haut
   - Boutons rapides : Aujourd'hui / Cette semaine / Ce mois

2. **KPIs dynamiques** :
   - Total CHF
   - Total par activité (Swisscom, REA, TBL, etc.)
   - Nombre d'interventions

3. **Tableau des interventions** :
   - Liste filtrée par date
   - Filtre par technicien (recherche)
   - Tri par colonne
   - Suppression d'une intervention (icône poubelle)

4. **Modal "Ajouter intervention"** :
   - Sélection technicien (dropdown)
   - Canton (GE, VD, FR, etc.)
   - Activité (Swisscom, REA, TBL, SBB, Autres)
   - Montant CHF
   - Sauvegarde → Rafraîchit le tableau

5. **Export** (boutons en haut) :
   - Export par Canton (CSV)
   - Export par Activité (CSV)

**Code clé - Ajouter une intervention :**

```javascript
async function addIntervention() {
    const empId = document.getElementById('interventionEmployee').value;
    const canton = document.getElementById('interventionCanton').value;
    const activity = document.getElementById('interventionActivity').value;
    const amount = parseFloat(document.getElementById('interventionAmount').value);
    
    await window.VeloxAPI.createIntervention({
        employee_id: empId,
        date: currentDate,
        canton: canton,
        activity: activity,
        amount_chf: amount
    });
    
    closeModal('interventionModal');
    await fetchData(); // Rafraîchir
}
```

---

### 6.6 ⚙️ `parametres.html` - Paramètres

**Objectif :** Gérer le profil utilisateur.

**Fonctionnalités actuelles :**
- ✅ Affichage email utilisateur
- ✅ Bouton "Changer mot de passe" (modal)
- ✅ Thème clair/sombre (à implémenter)
- ❌ Notifications (à implémenter)

**À améliorer :**
- Gestion des rôles (pour Direction uniquement)
- Paramètres de l'entreprise
- Export global des données

---

### 6.7 📅 `planif.html` - Planning des rendez-vous

**Objectif :** Planifier les rendez-vous/interventions des techniciens.

**Interface :**
- Diagramme de Gantt horizontal
- Techniciens en lignes, heures en colonnes
- Cartes colorées par activité (Swisscom, REA, SIG, FTTH FR, Smartmetering)
- Urgences en rouge

**Fonctionnalités :**
- ✅ Sélection de date (précédent/suivant/aujourd'hui)
- ✅ Affichage uniquement des techniciens actifs et non absents
- ✅ Ajout/modification/suppression de rendez-vous
- ✅ Carte de la Suisse avec géolocalisation des rendez-vous
- ✅ Filtre par type d'employé (Technicien uniquement)

**Données :** Table `appointments` dans Supabase

---

### 6.8 📦 `inventaire/inventaire.html` - Gestion des stocks

**Objectif :** Gérer l'inventaire des articles par dépôt.

**Fonctionnalités :**
- ✅ Sélection du dépôt actif (menu déroulant)
- ✅ Liste des articles du dépôt sélectionné
- ✅ **KPIs dynamiques** (Total articles, En stock, Seuil bas, Hors stock, Valeur totale) - **mis à jour selon la recherche**
- ✅ **Modification rapide des quantités** : Boutons +/- directement dans le tableau pour ajuster les quantités sans ouvrir le formulaire
- ✅ Recherche avec mise à jour automatique des KPIs
- ✅ Export Excel
- ✅ Ajout/Modification/Suppression d'articles
- ✅ Calcul du stock recommandé (besoin hebdomadaire × nombre techniciens)
- ✅ **Modification rapide des quantités** : Boutons +/- directement dans le tableau

**Données :** Tables `depots` et `inventory_items` dans Supabase

---

### 6.9 🚗 `inventaire/vehicule.html` - Gestion de la flotte

**Objectif :** Gérer les véhicules de l'entreprise.

**Fonctionnalités :**
- ✅ Liste des véhicules avec filtres
- ✅ Ajout/modification/suppression
- ✅ Assignation à un employé (select avec tous les employés actifs)
- ✅ Champ propriétaire (Entreprise / Location / Autre)
- ✅ Suivi kilométrage et type de pneu
- ✅ Statuts : Disponible, Assigné, En maintenance, Hors service

**Données :** Table `vehicles` dans Supabase

**Champs clés :**
- `assigned_to` : Texte libre (peut être un employé ou autre)
- `owner` : Propriétaire (Entreprise / Location / Autre)

---

### 6.10 ⚙️ `inventaire/parametres.html` - Paramètres inventaire

**Objectif :** Gérer les paramètres du module inventaire.

**Fonctionnalités :**
- ✅ Gestion des dépôts (ajouter/modifier/supprimer)
- ✅ Configuration du logo de l'entreprise
- ✅ Liste des dépôts avec actions

**Données :** Table `depots` dans Supabase

---

### 6.11 👥 `inventaire/collaborateurs.html` - Gestion des techniciens et matériel

**Objectif :** Lister les techniciens et gérer leur inventaire de matériel (scanné via mobile app).

**Fonctionnalités :**
- ✅ Liste des techniciens (depuis `employees` avec `type='Technicien'`)
- ✅ **KPI dynamiques** (Total techniciens, Avec matériel, **Prix Total Inventaires** - mis à jour selon les filtres)
- ✅ Recherche par nom/email (met à jour les KPI automatiquement)
- ✅ **Tableau avec prix total** au lieu de l'email
- ✅ **Modal amélioré** avec onglets :
  - **Inventaire Matériel** : Liste du matériel assigné au technicien
  - **Mouvements de Stock** : Historique complet des mouvements avec :
    - Filtres (technicien, type de mouvement, recherche)
    - Statistiques (Total Sorties, Total Retours, En Circulation)
    - Affichage de l'**adresse du chantier** (préparé pour web app mobile) au lieu de l'email
- ✅ Gestion du matériel : ajout manuel, retour, suppression
- ✅ Impression de l'inventaire
- ✅ **Décompte automatique du stock** lors de l'ajout de matériel
- ✅ **Réincrémentation du stock** lors du retour ou de la suppression
- ✅ Cases à cocher pour le retour de matériel
- ✅ Intégration mobile (le matériel scanné apparaît automatiquement)

**Interface :**
```
┌──────────────────────────────────────────────────────────┐
│ KPI: [Total: 15] [Avec Matériel: 12] [Prix Total: 45'230 CHF] │
│ [Rechercher technicien...]                                │
├──────────────────────────────────────────────────────────┤
│ NOM      PRÉNOM   STATUT   PRIX TOTAL    MATÉRIEL  ACTIONS│
│ Dupont   Jean     ✅ Actif  1'250.50 CHF [3 articles] [👁️]│
│ Meier    Sarah    ✅ Actif    850.00 CHF [0 articles] [👁️]│
└──────────────────────────────────────────────────────────┘

[Modal détail technicien ouvert →]
┌──────────────────────────────────────────────────────────┐
│ [Inventaire Matériel] [Mouvements de Stock] ← Onglets     │
│ Jean Dupont - j.dupont@example.com                       │
│ [Ajouter matériel] [Imprimer]                            │
├──────────────────────────────────────────────────────────┤
│ Retour │ Référence │ Nom      │ Catégorie │ Qté │ Dépôt│
│ [✓]    │ REF-001   │ Perceuse │ Outils    │ 1   │ Dépôt1│
│ [ ]    │ REF-002   │ Tournevis│ Outils    │ 2   │ Dépôt2│
└──────────────────────────────────────────────────────────┘
│ [Onglet Mouvements]                                      │
│ Filtres: [Technicien ▼] [Type ▼] [Recherche...]         │
│ Stats: [Sorties: 45] [Retours: 30] [Circulation: 15]   │
│ Date      │ Type  │ Technicien │ Référence │ Chantier    │
│ 30/12 14h │ Sortie│ Jean Dupont│ REF-001   │ Rue X, Genève│
└──────────────────────────────────────────────────────────┘
```

**Données :** Tables `employees` et `employee_equipment` dans Supabase

**Intégration mobile :**
- Le technicien scanne le matériel via l'app mobile
- L'app envoie une requête `INSERT` à `employee_equipment`
- Le matériel apparaît automatiquement dans la liste (via Realtime ou refresh)
- Voir `API_MOBILE_SCAN.md` pour les détails techniques

---

## 7. API JavaScript (VeloxAPI)

### 7.1 Architecture de l'API

**Fichier :** `js/api.js`

**Principe :**
- Classe `VeloxAPI` qui encapsule toutes les requêtes Supabase
- Instance globale `window.VeloxAPI` accessible partout
- Méthodes async/await pour toutes les opérations

**Avantages :**
- ✅ Centralisation de la logique d'accès aux données
- ✅ Réutilisable sur toutes les pages
- ✅ Gestion des erreurs unifiée
- ✅ Facilite les tests et la maintenance

---

### 7.2 Méthodes disponibles

#### 🔐 Authentification

| Méthode | Paramètres | Retour | Description |
|---------|------------|--------|-------------|
| `signIn(email, password)` | email, password | `{user, session}` | Connexion |
| `signOut()` | - | - | Déconnexion |
| `getCurrentUser()` | - | `User` | Utilisateur courant |
| `getSession()` | - | `Session` | Session courante |

---

#### 👥 Employés

| Méthode | Paramètres | Retour | Description |
|---------|------------|--------|-------------|
| `getEmployees(filters)` | `{status, type}` | `Employee[]` | Liste employés |
| `getEmployee(id)` | `id: UUID` | `Employee` | Un employé |
| `createEmployee(data)` | `Employee` | `Employee` | Créer |
| `updateEmployee(id, data)` | `id, data` | `Employee` | Modifier |
| `deleteEmployee(id)` | `id: UUID` | - | Supprimer |
| `getEmployeeStats(id)` | `id: UUID` | `Stats` | Statistiques |

---

#### ⏱️ Pointages

| Méthode | Paramètres | Retour | Description |
|---------|------------|--------|-------------|
| `getTimeEntries(empId, start, end)` | `empId, dateStart, dateEnd` | `TimeEntry[]` | Pointages |
| `saveTimeEntry(data)` | `TimeEntry` | `TimeEntry` | Créer/Modifier |
| `deleteTimeEntry(id)` | `id: UUID` | - | Supprimer |

---

#### 🏭 Interventions

| Méthode | Paramètres | Retour | Description |
|---------|------------|--------|-------------|
| `getInterventions(filters)` | `{date, empId}` | `Intervention[]` | Liste |
| `getInterventionsRange(start, end)` | `dateStart, dateEnd` | `Intervention[]` | Par période |
| `createIntervention(data)` | `Intervention` | `Intervention` | Créer |
| `deleteIntervention(id)` | `id: UUID` | - | Supprimer |

---

#### 📅 Événements (Absences)

| Méthode | Paramètres | Retour | Description |
|---------|------------|--------|-------------|
| `getEmployeeEvents(empId, start, end)` | `empId, dateStart, dateEnd` | `Event[]` | Événements |
| `createEvent(data)` | `Event` | `Event` | Créer (1 jour) |
| `createEventRange(data)` | `Event + {endDate}` | - | Créer (plage) |
| `deleteEvent(id)` | `id: UUID` | - | Supprimer |

---

### 7.3 Exemples d'utilisation

#### Connexion
```javascript
try {
    const result = await window.VeloxAPI.signIn('user@exemple.com', 'password');
    console.log('Utilisateur:', result.user);
    window.location.href = 'dashboard.html';
} catch (error) {
    alert('Identifiants incorrects');
}
```

#### Récupérer les employés actifs de type terrain
```javascript
const employees = await window.VeloxAPI.getEmployees({
    status: 'active',
    type: 'terrain'
});
console.log('Techniciens terrain:', employees);
```

#### Créer un pointage
```javascript
await window.VeloxAPI.saveTimeEntry({
    employee_id: 'uuid-xxx',
    date: '2025-12-28',
    start_time: '08:00:00',
    end_time: '17:12:00',
    total_hours: 8.2,
    filled_by: 'admin'
});
```

#### Créer une absence sur plusieurs jours
```javascript
await window.VeloxAPI.createEventRange({
    employee_id: 'uuid-xxx',
    type: 'vacation',
    startDate: '2025-12-24',
    endDate: '2025-12-31'
});
// Crée un événement pour chaque jour de la plage
```

---

## 8. Flux de données et logique métier

### 8.1 Flux de connexion

```
1. Utilisateur → index.html
2. Saisie email + password
3. Frontend → VeloxAPI.signIn()
4. VeloxAPI → Supabase.auth.signInWithPassword()
5. Supabase valide → Retourne JWT
6. JWT stocké dans localStorage (auto)
7. Redirection → dashboard.html
8. dashboard.html vérifie session → Charge KPIs
```

---

### 8.2 Flux de pointage

```
1. Utilisateur → pointage.html
2. Sélection date dans calendrier
3. Frontend → Charge employés + pointages du jour
4. Affichage cartes employés avec champs pré-remplis
5. Utilisateur modifie heures → Clic "Sauvegarder"
6. Frontend calcule total_hours (avec pause déjeuner)
7. Frontend → VeloxAPI.saveTimeEntry()
8. VeloxAPI → Supabase (INSERT ou UPDATE selon existence)
9. RLS vérifie permission (role check)
10. Supabase enregistre → Retourne succès
11. Frontend rafraîchit la carte
```

---

### 8.3 Flux de rapport mensuel

```
1. Utilisateur → personnel.html → Sélection employé
2. Clic "Rapport mensuel" → Ouverture modal
3. Sélection mois + année
4. Frontend → Récupère time_entries du mois (1 requête)
5. Frontend → Récupère events du mois (1 requête)
6. Frontend génère tableau jour par jour :
   - Pour chaque jour du mois :
     - Cherche pointage correspondant
     - Cherche événement correspondant
     - Détermine statut (Validé / Manquant / Congé / Week-end)
     - Calcule total
7. Affichage résumé + tableau détaillé
8. Option impression → Nouvelle fenêtre avec HTML formaté
```

---

### 8.4 Flux de création d'intervention

```
1. Utilisateur → production.html
2. Clic "Ajouter intervention" → Ouverture modal
3. Sélection technicien, canton, activité, montant
4. Clic "Sauvegarder"
5. Frontend → VeloxAPI.createIntervention()
6. VeloxAPI → Supabase.from('interventions').insert()
7. RLS vérifie role (direction/chef_chantier/dispatcher OK)
8. Supabase enregistre
9. Frontend rafraîchit tableau + KPIs
```

---

## 9. Design et UI/UX

### 9.1 Framework CSS

**Tailwind CSS** via CDN :
```html
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
```

**Configuration personnalisée :**
```javascript
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#ea2a33',      // Rouge Veloxnumeric
                'surface-dark': '#1e1e2e',
                'background-light': '#f8f9fa'
            }
        }
    }
};
```

---

### 9.2 Icônes

**Material Symbols Outlined** (Google Icons) :
```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet">
```

**Utilisation :**
```html
<span class="material-symbols-outlined">person</span>
<span class="material-symbols-outlined">logout</span>
```

---

### 9.3 Composants réutilisables

#### Sidebar
- Logo en haut
- Navigation (Dashboard, Pointage, Production, Personnel, Paramètres)
- Item actif surligné en rouge
- Responsive (collapse sur mobile)

#### Header
- Nom utilisateur à droite
- Bouton déconnexion
- Sticky top

#### Cards KPI
- Icône colorée à gauche
- Titre + valeur principale
- Badge de variation (+X%)
- Hover avec animation

#### Modals
- Overlay semi-transparent
- Fermeture au clic extérieur
- Boutons "Fermer" / "Sauvegarder"
- Animation slide-in

#### Tables
- Header sticky
- Tri par colonne (à implémenter)
- Hover row
- Actions en dernière colonne

---

### 9.4 Responsive design

**Breakpoints Tailwind :**
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px
- `xl:` 1280px

**Adaptations :**
- Sidebar collapse sur `< lg`
- Cartes empilées sur mobile
- Tableaux scroll horizontal sur mobile
- Modals plein écran sur mobile

---

## 10. Déploiement et hébergement

### 10.1 Hébergement actuel

**Domaine :** `https://www.client.morellia.ch`  
**Provider :** Inconnu (probablement Cloudflare Pages ou hébergement custom)  
**CDN :** Cloudflare  

---

### 10.2 Déploiement

**Méthode recommandée : Cloudflare Pages**

1. **Connecter le repo Git** (ou upload manuel)
2. **Build settings** :
   - Build command: (aucun, c'est du HTML statique)
   - Output directory: `/` (root)
3. **Déploiement automatique** à chaque push
4. **Purge du cache** après chaque déploiement

**Commandes locales :**
- Windows : `START.bat` (lance `python -m http.server 8000`)
- Linux/Mac : `START.sh` (lance `python3 -m http.server 8000`)

---

### 10.3 Variables d'environnement

**Actuellement :**
- URL Supabase : Hardcodée dans `js/config.js`
- Clé anon : Hardcodée dans `js/config.js`

**⚠️ À améliorer (optionnel) :**
- Utiliser les variables d'environnement de Cloudflare Pages
- Créer un fichier `config.js` généré au build

---

### 10.4 Checklist de déploiement

- [ ] Vérifier que tous les fichiers HTML ont `?v=X` sur les scripts JS
- [ ] Tester sur navigateurs (Chrome, Firefox, Edge, Safari)
- [ ] Vérifier RLS policies sur Supabase
- [ ] Purger cache Cloudflare
- [ ] Tester connexion + toutes les fonctionnalités
- [ ] Vérifier responsive (mobile/tablet/desktop)
- [ ] Logs d'erreur vides dans la console

---

## 11. Maintenance et évolutions

### 11.1 Tâches de maintenance régulières

1. **Backup Supabase** :
   - Export SQL hebdomadaire
   - Stockage sécurisé

2. **Monitoring** :
   - Vérifier logs Supabase (erreurs API)
   - Surveiller usage (limite gratuite : 500MB DB / 2GB bandwidth)

3. **Mise à jour SDK** :
   - Supabase JS : `@supabase/supabase-js@2` (CDN auto-update)
   - Tailwind CSS : CDN (pas de maintenance)

4. **Sécurité** :
   - Auditer les policies RLS (trimestrial)
   - Vérifier les rôles utilisateurs
   - Rotation des tokens (si nécessaire)

---

### 11.2 Évolutions prévues

#### Phase 1 (Court terme) ✅
- [x] Migration PHP → Supabase
- [x] Dashboard fonctionnel
- [x] Pointage complet
- [x] Personnel avec calendrier et rapports
- [x] Production basique
- [x] RLS avec 4 rôles
- [x] Vacances au prorata

#### Phase 2 (Moyen terme) 🔄
- [ ] Planning interactif (rendez-vous)
- [ ] Graphiques dynamiques (Chart.js)
- [ ] Export PDF natif (jsPDF)
- [ ] Interface gestion des rôles (Direction)
- [ ] Notifications en temps réel (Supabase Realtime)
- [ ] App mobile (PWA ou React Native)

#### Phase 3 (Long terme) 📋
- [ ] Gestion des documents (Storage Supabase)
- [ ] Signature électronique (rapports mensuels)
- [ ] Intégration comptabilité (API externe)
- [ ] BI/Analytics avancé
- [ ] Multi-entreprise (SaaS)

---

### 11.3 Bugs connus et limitations

#### 🐛 Bugs mineurs

1. **Cache browser persistant** :
   - Symptôme : Fichiers JS pas mis à jour
   - Solution : Incrémenter `?v=X` + Purge Cloudflare

2. **Planning non fonctionnel** :
   - Statut : Pas encore implémenté
   - Contournement : Utiliser un outil externe temporairement

#### ⚠️ Limitations

1. **Pas de SSR** :
   - Impact : SEO limité (pas critique pour une app interne)

2. **Graphiques statiques** :
   - Impact : Pas de vraies données dynamiques sur le dashboard
   - Solution : Intégrer Chart.js

3. **Export CSV basique** :
   - Impact : Pas de formatage avancé
   - Solution : Utiliser une lib (PapaParse)

---

### 11.4 Support et documentation

**Contacts :**
- Développeur : (À compléter)
- Client : Morellia / Veloxnumeric

**Documentation :**
- Ce fichier : `DOCUMENTATION_TECHNIQUE.md`
- Guide RLS : `GUIDE_RLS_VACANCES.md`
- Scripts SQL : `SETUP_*.sql`

**Ressources externes :**
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [MDN Web Docs](https://developer.mozilla.org/)

---

## 📝 Historique des versions

| Version | Date | Auteur | Changements |
|---------|------|--------|-------------|
| 1.0 | 2025-12-28 | Claude (Anthropic) | Documentation initiale complète |

---

## 🎯 Conclusion

Cette application représente une **migration réussie d'un backend monolithique PHP/Flask vers une architecture moderne JAMstack avec Supabase**. Elle offre :

✅ **Performance** : Static hosting + CDN global  
✅ **Sécurité** : RLS Supabase + JWT Auth  
✅ **Évolutivité** : Scalable sans limite  
✅ **Maintenabilité** : Code simple, pas de dépendances complexes  
✅ **Coût** : Hébergement gratuit (< 500MB DB)  

L'architecture est **saine, documentée, et prête pour les évolutions futures**.

---

*📘 Ce document doit être mis à jour à chaque évolution majeure de l'application.*

