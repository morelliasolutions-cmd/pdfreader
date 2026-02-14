# 🔐 Configuration RLS et Vacances au Prorata - Veloxnumeric

## 📋 Vue d'ensemble

Ce guide vous permet de configurer :
1. **Row Level Security (RLS)** avec 4 rôles utilisateurs
2. **Calcul automatique des vacances** au prorata de la date de début de contrat

---

## 🚀 Étape 1 : Exécuter les scripts SQL

### 1.1 Configuration des rôles (RLS)

1. Allez sur **Supabase Dashboard** → **SQL Editor**
2. Créez une nouvelle requête
3. Copiez-collez le contenu de `SETUP_RLS.sql`
4. **Exécutez** ▶️

✅ Cela va créer :
- Table `user_roles` pour stocker les rôles
- Fonction `get_user_role()` pour récupérer le rôle
- Policies RLS sur toutes les tables (`employees`, `time_entries`, `interventions`, `events`)
- Votre compte `contact@morellia.ch` sera défini comme **Direction**

### 1.2 Configuration des vacances au prorata

1. Toujours dans **SQL Editor**
2. Créez une nouvelle requête
3. Copiez-collez le contenu de `SETUP_VACATION_PRORATA.sql`
4. **Exécutez** ▶️

✅ Cela va créer :
- Colonnes `contract_start_date` et `annual_vacation_days` dans `employees`
- Fonction `calculate_vacation_days_prorata()` pour calculer les jours acquis
- Vue `employee_vacation_summary` pour voir le résumé

---

## 👥 Étape 2 : Attribuer des rôles aux utilisateurs

### Via SQL :

```sql
-- Ajouter un rôle à un utilisateur existant
INSERT INTO user_roles (user_id, role)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'chef@exemple.com'),
    'chef_chantier'
)
ON CONFLICT (user_id) DO UPDATE SET role = 'chef_chantier';
```

### Les 4 rôles disponibles :

| Rôle | Permissions |
|------|-------------|
| `direction` | ✅ Accès complet (tout lire, modifier, supprimer) |
| `chef_chantier` | ✅ Lire tous les employés<br>✅ Modifier/créer pointages et interventions<br>❌ Pas de gestion du personnel |
| `dispatcher` | ✅ Lire tous les employés<br>✅ Modifier/créer interventions et événements<br>❌ Pas de pointages |
| `technicien` | ✅ Voir uniquement ses propres données<br>✅ Modifier ses propres pointages<br>✅ Demander des congés |

---

## 📅 Étape 3 : Configurer les dates de contrat

Pour chaque employé, définissez :
- **Date de début de contrat** (`contract_start_date`)
- **Jours de vacances annuels** (`annual_vacation_days`, par défaut 25)

### Via SQL :

```sql
UPDATE employees
SET 
    contract_start_date = '2025-01-15',
    annual_vacation_days = 25
WHERE id = 'UUID_DE_L_EMPLOYE';
```

---

## 🧪 Étape 4 : Tester

### 4.1 Vérifier les rôles

```sql
SELECT 
    u.email,
    ur.role,
    ur.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY u.email;
```

### 4.2 Tester les vacances au prorata

```sql
-- Voir le résumé de tous les employés
SELECT 
    first_name || ' ' || last_name as employee,
    contract_start_date,
    days_earned || ' / ' || annual_vacation_days as progress,
    days_used as used,
    days_remaining as remaining,
    percentage_acquired || '%' as year_progress
FROM employee_vacation_summary
ORDER BY last_name;
```

### 4.3 Calculer pour un employé spécifique

```sql
SELECT * FROM calculate_vacation_days_prorata(
    (SELECT id FROM employees WHERE email = 'jean.dupont@velox.ch'),
    CURRENT_DATE
);
```

---

## 🎨 Étape 5 : Mettre à jour le frontend

### 5.1 Afficher le rôle de l'utilisateur

Dans `js/api.js`, ajoutez :

```javascript
async getUserRole() {
    const { data, error } = await this.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', (await this.getCurrentUser()).id)
        .single();
    
    if (error) throw error;
    return data?.role || 'technicien';
}
```

### 5.2 Afficher les vacances dans personnel.html

Dans la page de détail d'un employé, afficher :
- Jours acquis (au prorata)
- Jours utilisés
- Jours restants
- Progression de l'année (%)

---

## 📊 Exemple de calcul

**Employé :** Jean Dupont  
**Date de début :** 01/06/2025  
**Vacances annuelles :** 25 jours  
**Date actuelle :** 31/12/2025  

**Calcul :**
- Jours travaillés : 214 jours (du 01/06 au 31/12)
- Prorata : (214 / 365) × 25 = **14.7 jours acquis**
- Jours pris : 5 jours
- **Solde restant : 9.7 jours**

---

## 🔒 Sécurité

✅ **RLS activé** : Chaque utilisateur ne voit que ce qu'il doit voir  
✅ **Policies strictes** : Pas d'accès direct aux données sensibles  
✅ **Fonction sécurisée** : `SECURITY DEFINER` pour les calculs  

---

## ❓ Questions fréquentes

### Comment changer le rôle d'un utilisateur ?

```sql
UPDATE user_roles
SET role = 'chef_chantier'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@exemple.com');
```

### Comment ajouter un nouvel utilisateur avec un rôle ?

1. Créez l'utilisateur dans **Authentication → Users**
2. Attribuez son rôle :

```sql
INSERT INTO user_roles (user_id, role)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'nouveau@exemple.com'),
    'dispatcher'
);
```

### Comment changer les jours de vacances d'un employé ?

```sql
UPDATE employees
SET annual_vacation_days = 30
WHERE id = 'UUID_DE_L_EMPLOYE';
```

---

## 🎯 Prochaines étapes

1. ✅ Exécuter `SETUP_RLS.sql`
2. ✅ Exécuter `SETUP_VACATION_PRORATA.sql`
3. ✅ Vérifier que votre compte est "direction"
4. ✅ Définir les dates de contrat des employés
5. 🔄 Mettre à jour le frontend pour afficher les vacances
6. 🔄 Ajouter une interface de gestion des rôles (pour la direction)

---

Besoin d'aide ? Contactez-moi ! 🚀


