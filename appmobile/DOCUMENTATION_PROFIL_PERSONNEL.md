# Documentation - Page Profil Personnel
## `acceuil_Personnel.html`

---

## 📋 Vue d'ensemble

Page de profil personnel pour les techniciens de l'application mobile Veloxnumeric. Cette interface permet aux employés de consulter leurs informations personnelles, gérer leur véhicule attribué, suivre leurs heures de travail, et effectuer des demandes administratives.

**Type**: Application mobile (PWA)  
**Framework CSS**: Tailwind CSS (CDN)  
**Backend**: Supabase  
**Authentification**: Supabase Auth

---

## 🎨 Design System & Code Couleurs

### Palette Principale

```javascript
{
    primary: "#135bec",           // Bleu principal (boutons, accents)
    background-light: "#f6f6f8",  // Fond clair
    background-dark: "#101622",   // Fond sombre (dark mode)
    surface-light: "#ffffff",     // Surface claire (cartes)
    surface-dark: "#1c2433",      // Surface sombre
    card-light: "#ffffff",        // Cartes claires
    card-dark: "#1c2433",         // Cartes sombres
}
```

### Couleurs Sémantiques

| Couleur | Usage | Code HEX |
|---------|-------|----------|
| 🔵 Bleu | Actions principales, navigation active | `#135bec` |
| 🟢 Vert | Validation, succès, signature confirmée | `#10b981` |
| 🟠 Orange | Avertissement, document non signé | `#f97316` |
| 🔴 Rouge | Erreur, alerte critique, accident | `#ef4444` |
| 🟣 Violet | Demandes de congés | `#9333ea` |
| ⚫ Gris | Texte secondaire, éléments désactivés | `#616f89` |

### Typographie

- **Police principale**: Inter, "Noto Sans", sans-serif
- **Titres**: Font-bold (700)
- **Corps**: Font-medium (500)
- **Petits textes**: Font-normal (400)

---

## 🏗️ Architecture & Technologies

### Stack Technique

```
┌─────────────────────────────────────┐
│         Frontend (HTML/JS)          │
│  - Tailwind CSS (Utility-first)     │
│  - Vanilla JavaScript (ES6+)        │
│  - Material Symbols Icons           │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│       Supabase Client SDK           │
│  - Authentication (Auth.users)      │
│  - Real-time Database (PostgreSQL)  │
│  - Row Level Security (RLS)         │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      Base de Données Supabase       │
│  - employees                        │
│  - vehicles                         │
│  - time_entries                     │
│  - events                           │
│  - monthly_signatures               │
└─────────────────────────────────────┘
```

### Dépendances Externes

1. **Tailwind CSS CDN** : Framework CSS utility-first
2. **Supabase JS SDK** : Client JavaScript pour Supabase
3. **Google Material Symbols** : Bibliothèque d'icônes
4. **VeloxAPI** : Wrapper custom pour les appels Supabase (`../js/api.js`)
5. **Config.js** : Configuration Supabase (`../js/config.js`)

---

## 🗄️ Schéma de Base de Données

### Tables Utilisées

#### 1. `employees`
```sql
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    type TEXT,
    role TEXT,
    status TEXT,
    vacation_days INTEGER DEFAULT 25,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policy**: 
- Techniciens peuvent lire leur propre profil
- Admin/Chef peuvent lire tous les profils

#### 2. `vehicles`
```sql
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_plate TEXT UNIQUE NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    assigned_to TEXT,
    mileage INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policy**:
- Lecture: Technicien peut voir le véhicule qui lui est assigné
- Écriture: Technicien peut mettre à jour le kilométrage

**Liaison**: `vehicles.assigned_to` ↔ `CONCAT(employees.first_name, ' ', employees.last_name)`

#### 3. `time_entries`
```sql
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    total_hours DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, date)
);
```

**RLS Policy**:
- Lecture: Employé peut lire ses propres entrées
- Écriture: Employé peut créer/modifier ses entrées

#### 4. `events`
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    date DATE NOT NULL,
    type TEXT NOT NULL, -- 'vacation', 'sickness', 'paid_leave', 'unpaid'
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policy**:
- Lecture: Employé peut lire ses propres événements
- Écriture: Employé peut créer des demandes (validation par admin)

#### 5. `monthly_signatures`
```sql
CREATE TABLE monthly_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    month_date DATE NOT NULL,
    status TEXT DEFAULT 'signed',
    signed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, month_date)
);
```

**RLS Policy**:
- Lecture: Employé peut lire ses signatures
- Écriture: Employé peut signer (INSERT uniquement, pas de modification)

---

## 🔐 Row Level Security (RLS)

### Principe de Sécurité

Chaque technicien ne peut accéder qu'à **ses propres données**. La politique RLS vérifie l'identité via `auth.uid()`.

### Exemples de Policies

#### Policy: Lecture des heures
```sql
CREATE POLICY "Employees can view own time entries"
ON time_entries FOR SELECT
USING (
    employee_id IN (
        SELECT id FROM employees 
        WHERE email = auth.email()
    )
);
```

#### Policy: Mise à jour kilométrage
```sql
CREATE POLICY "Employees can update assigned vehicle mileage"
ON vehicles FOR UPDATE
USING (
    assigned_to ILIKE (
        SELECT first_name || ' ' || last_name 
        FROM employees 
        WHERE email = auth.email()
    )
);
```

---

## 📦 Sections de la Page

### 1. **Header (TopAppBar)**
- Bouton retour vers `Rendez-vous.html`
- Titre : "Profil"

### 2. **Carte Véhicule**
```javascript
// Champs affichés
- Plaque d'immatriculation (vehicle.license_plate)
- Modèle (vehicle.make + vehicle.model)
- Propriétaire (vehicle.assigned_to)
- Alerte kilométrique (si non mis à jour ce mois-ci)
```

**Logique d'alerte**:
```javascript
if (vehicle.updated_at < firstDayOfCurrentMonth) {
    // Afficher alerte rouge "⚠️ Relevé kilométrique requis"
}
```

### 3. **Section Kilométrage**
- Input numérique pour saisir le nouveau kilométrage
- Bouton "Mettre à jour" (bg-primary #135bec)
- Date de dernière mise à jour

**Action**: Met à jour `vehicles.mileage` et `vehicles.updated_at`

### 4. **Pointage Heures (Timesheet)**

#### Données affichées:
- Navigation mois par mois (chevron gauche/droite)
- Total heures du mois (time_entries.total_hours)
- Vacances prises / Total (events.type = 'vacation')
  - Conversion : 1 jour = 8.4 heures
- Statut signature (monthly_signatures)

#### Boutons:
- **Détails** : Ouvre modal avec la liste complète des pointages
- **Signer** : Certifie l'exactitude des heures et enregistre dans `monthly_signatures`

**États du bouton Signer**:
| État | Visuel | Action |
|------|--------|--------|
| Non signé | Orange "Non signé" + Bouton bleu actif | INSERT dans monthly_signatures |
| Signé | Vert "Signé" + Bouton bleu désactivé (opacité 70%) | Aucune action |

### 5. **Actions Rapides**

#### Note de frais
- Input file (photo via caméra)
- Webhook appelé avec type "expense"

#### Demande congés
- Modal avec formulaire:
  - Type (vacation, sickness, paid_leave, unpaid)
  - Date début / fin
  - Note optionnelle
- Crée des entrées dans `events` (1 par jour ouvrable)

#### Signaler un accident
- Webhook appelé avec type "accident"
- **À implémenter**: Modal avec adresse + photos

#### Déclarer une panne
- Webhook appelé avec type "breakdown"
- **À implémenter**: Modal avec message

---

## 🔄 Flux de Données

### Initialisation de la Page

```
1. DOMContentLoaded event
   ↓
2. Récupérer utilisateur connecté (Supabase Auth)
   ↓
3. Chercher employee_id via email
   ↓
4. Charger véhicule assigné (vehicles.assigned_to ILIKE fullName)
   ↓
5. Charger heures du mois (time_entries)
   ↓
6. Charger vacances (events WHERE type='vacation')
   ↓
7. Vérifier signature (monthly_signatures)
```

### Workflow Signature Mensuelle

```
1. Clic sur "Signer"
   ↓
2. Confirm dialog ("Je certifie l'exactitude...")
   ↓
3. INSERT INTO monthly_signatures
   {
     employee_id,
     month_date: '2026-01-01',
     status: 'signed',
     signed_at: NOW()
   }
   ↓
4. Refresh UI (badge vert "Signé")
```

### Workflow Demande de Congés

```
1. Clic "Demande congés" → Ouvre modal
   ↓
2. Remplir formulaire (type, dates, note)
   ↓
3. Validation dates (début <= fin)
   ↓
4. Boucle sur période (exclure weekends)
   ↓
5. INSERT INTO events (1 ligne par jour)
   ↓
6. Fermer modal + recharger stats vacances
```

---

## 🎯 Fonctions JavaScript Principales

### `loadVehicle(email)`
Récupère le véhicule assigné à l'employé via son nom complet.

### `updateMileage(vehicleId)`
Met à jour le kilométrage et `updated_at` dans la table `vehicles`.

### `loadTimesheetSummary(employeeId)`
Charge le résumé des heures, vacances et signature pour le mois courant.

### `loadTimesheetDetails()`
Génère la liste HTML des pointages détaillés (modal).

### `signTimesheet()`
Enregistre la signature mensuelle dans `monthly_signatures`.

### `submitLeaveRequest()`
Crée des entrées `events` pour chaque jour ouvrable de la période sélectionnée.

### `triggerWebhook(type, payload)`
Appelle un webhook externe pour envoyer des notifications (accident, panne, frais).

---

## 🔔 Webhooks & Notifications

### Configuration

```javascript
const WEBHOOK_URL = ''; // À définir (ex: n8n, Zapier, Make)
```

### Payload Type

```json
{
  "type": "expense" | "accident" | "breakdown",
  "user": "technicien@morellia.ch",
  "timestamp": "2026-01-09T14:30:00Z",
  ...payload
}
```

### Cas d'usage

| Événement | Webhook | Payload supplémentaire |
|-----------|---------|------------------------|
| Note de frais | `expense` | `{ filename: "IMG_001.jpg" }` |
| Accident | `accident` | `{ location, photos[] }` (à impl.) |
| Panne | `breakdown` | `{ message }` (à impl.) |

---

## 🧩 Modals (Popups)

### Structure Commune

```html
<div id="modal-xxx" class="fixed inset-0 z-50 hidden">
    <!-- Backdrop (fermeture au clic) -->
    <div class="absolute inset-0 bg-black/50" onclick="closeModal('modal-xxx')"></div>
    
    <!-- Contenu centré -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ...">
        <div class="header">Titre + Bouton Close</div>
        <div class="content">Contenu scrollable</div>
    </div>
</div>
```

### Modals Existants

1. **modal-timesheet**: Détail des heures (liste scrollable)
2. **modal-leave**: Formulaire de demande de congés

### Modals À Créer

3. **modal-accident**: Signaler un accident (adresse + photos)
4. **modal-breakdown**: Déclarer une panne (message)

---

## 📱 Navigation Bottom Bar

| Icône | Label | Action | État |
|-------|-------|--------|------|
| 📅 calendar_today | Agenda | → Rendez-vous_technicien.html | Inactif |
| 📦 inventory_2 | Stock | → invetaire_technicien.html | Inactif |
| 👤 person (filled) | Profil | Page actuelle | **Actif (bleu)** |
| 🚪 logout | Déconnexion | handleLogout() | Inactif |

---

## 🚀 Points d'Amélioration

### Fonctionnalités en attente

- [ ] Modal complet pour signaler un accident (adresse + photos)
- [ ] Modal complet pour déclarer une panne (message)
- [ ] Upload photos vers Supabase Storage
- [ ] Intégration Webhook réelle (remplacer alerts)
- [ ] Gestion offline (Service Worker)
- [ ] Validation formulaire côté client (regex, dates)

### Optimisations Performance

- [ ] Caching des données véhicule (localStorage)
- [ ] Lazy loading des heures (pagination)
- [ ] Debounce sur input kilométrage

---

## 📄 Fichiers Liés

```
veloxnumeric-web/
├── App mobile/
│   ├── acceuil_Personnel.html          (Cette page)
│   ├── Rendez-vous_technicien.html     (Agenda)
│   ├── invetaire_technicien.html       (Stock)
│   └── DOCUMENTATION_PROFIL_PERSONNEL.md (Ce fichier)
├── js/
│   ├── config.js                        (Config Supabase)
│   └── api.js                           (VeloxAPI wrapper)
└── SUPABASE_SETUP.md                    (Config backend)
```

---

## 🔑 Variables Globales JavaScript

```javascript
window.currentEmployee = { id, first_name, last_name }  // Employé connecté
currentDate = new Date()                                // Mois de visualisation
```

---

## 📞 Support & Maintenance

**Auteur**: GitHub Copilot + Étienne  
**Version**: 1.2.0  
**Dernière mise à jour**: 9 janvier 2026  
**Contact**: admin@morellia.ch

---

## 🐛 Débogage

### Erreurs Communes

1. **"Utilisateur non connecté"** → Vérifier session Supabase Auth
2. **"Employé non trouvé"** → Email absent de table `employees`
3. **"Véhicule non assigné"** → `vehicles.assigned_to` ne correspond pas au nom
4. **Signature bloquée** → Contrainte UNIQUE sur `(employee_id, month_date)`

### Console Logs Utiles

```javascript
console.log("Recherche véhicule pour:", fullName);
console.log("Webhook Triggered:", type, payload);
```

---

**FIN DE LA DOCUMENTATION**
