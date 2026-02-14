# Guide : Attribution des Rôles Utilisateurs

## 📋 Vue d'ensemble

Pour attribuer un rôle à un utilisateur, vous devez créer un enregistrement dans la table `user_roles` qui lie :
- Un utilisateur Supabase Auth (`auth.users`)
- Un employé (`employees`)
- Un rôle (`admin`, `chef_chantier`, `dispatcher`, `technicien`)

## 🔑 Méthode 1 : Via SQL Editor (Recommandé)

### Étape 1 : Identifier l'utilisateur

Vous avez besoin de :
1. **L'UUID de l'utilisateur** dans `auth.users` (correspond à l'email de connexion)
2. **L'UUID de l'employé** dans la table `employees`

#### Trouver l'UUID d'un utilisateur par email :
```sql
SELECT id, email 
FROM auth.users 
WHERE email = 'technicien@example.com';
```

#### Trouver l'UUID d'un employé :
```sql
SELECT id, first_name, last_name, email 
FROM employees 
WHERE email = 'technicien@example.com';
```

### Étape 2 : Attribuer le rôle

```sql
INSERT INTO user_roles (user_id, employee_id, role)
VALUES (
  'uuid-de-l-utilisateur-auth',  -- UUID de auth.users
  'uuid-de-l-employe',            -- UUID de employees
  'technicien'                    -- Rôle : 'admin', 'chef_chantier', 'dispatcher', 'technicien'
);
```

### Exemple complet :

```sql
-- 1. Trouver l'utilisateur
SELECT id, email FROM auth.users WHERE email = 'jean.dupont@example.com';

-- 2. Trouver l'employé correspondant
SELECT id, first_name, last_name, email FROM employees WHERE email = 'jean.dupont@example.com';

-- 3. Attribuer le rôle de technicien
INSERT INTO user_roles (user_id, employee_id, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'jean.dupont@example.com'),
  (SELECT id FROM employees WHERE email = 'jean.dupont@example.com'),
  'technicien'
);
```

## 🔑 Méthode 2 : Via l'API Supabase (Programmatique)

### Depuis votre application backend ou un script :

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SERVICE_ROLE_KEY' // Utilisez la service role key pour bypass RLS
);

// Fonction pour attribuer un rôle
async function assignRole(userEmail, employeeEmail, role) {
  // 1. Récupérer l'UUID de l'utilisateur
  const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(userEmail);
  if (userError) throw userError;
  
  // 2. Récupérer l'UUID de l'employé
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id')
    .eq('email', employeeEmail)
    .single();
  
  if (employeeError) throw employeeError;
  
  // 3. Attribuer le rôle
  const { data, error } = await supabase
    .from('user_roles')
    .insert({
      user_id: user.user.id,
      employee_id: employee.id,
      role: role // 'admin', 'chef_chantier', 'dispatcher', 'technicien'
    });
  
  if (error) throw error;
  return data;
}

// Exemple d'utilisation
await assignRole('jean.dupont@example.com', 'jean.dupont@example.com', 'technicien');
```

## 🔑 Méthode 3 : Script SQL pour attribuer plusieurs rôles

### Script pour attribuer des rôles en masse :

```sql
-- Exemple : Attribuer des rôles à plusieurs utilisateurs
-- Assurez-vous que les emails correspondent entre auth.users et employees

-- Technicien 1
INSERT INTO user_roles (user_id, employee_id, role)
SELECT 
  u.id as user_id,
  e.id as employee_id,
  'technicien' as role
FROM auth.users u
JOIN employees e ON u.email = e.email
WHERE u.email = 'technicien1@example.com'
ON CONFLICT (user_id, employee_id) DO UPDATE SET role = 'technicien';

-- Dispatcher 1
INSERT INTO user_roles (user_id, employee_id, role)
SELECT 
  u.id as user_id,
  e.id as employee_id,
  'dispatcher' as role
FROM auth.users u
JOIN employees e ON u.email = e.email
WHERE u.email = 'dispatcher1@example.com'
ON CONFLICT (user_id, employee_id) DO UPDATE SET role = 'dispatcher';

-- Chef de chantier 1
INSERT INTO user_roles (user_id, employee_id, role)
SELECT 
  u.id as user_id,
  e.id as employee_id,
  'chef_chantier' as role
FROM auth.users u
JOIN employees e ON u.email = e.email
WHERE u.email = 'chef1@example.com'
ON CONFLICT (user_id, employee_id) DO UPDATE SET role = 'chef_chantier';

-- Admin 1
INSERT INTO user_roles (user_id, employee_id, role)
SELECT 
  u.id as user_id,
  e.id as employee_id,
  'admin' as role
FROM auth.users u
JOIN employees e ON u.email = e.email
WHERE u.email = 'admin@example.com'
ON CONFLICT (user_id, employee_id) DO UPDATE SET role = 'admin';
```

## 📊 Vérifier les rôles attribués

### Voir tous les rôles :
```sql
SELECT 
  ur.id,
  u.email as user_email,
  e.first_name,
  e.last_name,
  ur.role,
  ur.created_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
JOIN employees e ON ur.employee_id = e.id
ORDER BY ur.role, e.last_name;
```

### Voir les rôles d'un utilisateur spécifique :
```sql
SELECT 
  ur.role,
  e.first_name || ' ' || e.last_name as employee_name,
  ur.created_at
FROM user_roles ur
JOIN employees e ON ur.employee_id = e.id
WHERE ur.user_id = (SELECT id FROM auth.users WHERE email = 'technicien@example.com');
```

## 🔄 Modifier un rôle existant

```sql
UPDATE user_roles
SET role = 'admin'  -- Nouveau rôle
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com')
AND employee_id = (SELECT id FROM employees WHERE email = 'user@example.com');
```

## 🗑️ Supprimer un rôle

```sql
DELETE FROM user_roles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com')
AND employee_id = (SELECT id FROM employees WHERE email = 'user@example.com');
```

## ⚠️ Points importants

1. **Email correspondance** : L'email dans `auth.users` doit correspondre à l'email dans `employees` pour faciliter la liaison.

2. **Un utilisateur = Un rôle** : Un utilisateur ne peut avoir qu'un seul rôle à la fois (contrainte UNIQUE sur `user_id, employee_id`).

3. **Permissions** : Seuls les admins peuvent modifier les rôles (via RLS).

4. **Service Role Key** : Pour attribuer des rôles via l'API, utilisez la **Service Role Key** (pas l'anon key) pour bypasser RLS.

## 🚀 Exemple complet : Setup initial

```sql
-- 1. Créer les utilisateurs dans Supabase Auth (via Dashboard ou API)
-- 2. Créer les employés correspondants dans la table employees
-- 3. Attribuer les rôles

-- Admin
INSERT INTO user_roles (user_id, employee_id, role)
SELECT u.id, e.id, 'admin'
FROM auth.users u
JOIN employees e ON u.email = e.email
WHERE u.email = 'admin@veloxnumeric.com'
ON CONFLICT DO NOTHING;

-- Chef de chantier
INSERT INTO user_roles (user_id, employee_id, role)
SELECT u.id, e.id, 'chef_chantier'
FROM auth.users u
JOIN employees e ON u.email = e.email
WHERE u.email = 'chef@veloxnumeric.com'
ON CONFLICT DO NOTHING;

-- Dispatcher
INSERT INTO user_roles (user_id, employee_id, role)
SELECT u.id, e.id, 'dispatcher'
FROM auth.users u
JOIN employees e ON u.email = e.email
WHERE u.email = 'dispatcher@veloxnumeric.com'
ON CONFLICT DO NOTHING;

-- Techniciens (exemple pour plusieurs)
INSERT INTO user_roles (user_id, employee_id, role)
SELECT u.id, e.id, 'technicien'
FROM auth.users u
JOIN employees e ON u.email = e.email
WHERE u.email IN (
  'technicien1@veloxnumeric.com',
  'technicien2@veloxnumeric.com',
  'technicien3@veloxnumeric.com'
)
ON CONFLICT DO NOTHING;
```

## 📝 Checklist

- [ ] Créer les utilisateurs dans Supabase Auth
- [ ] Créer les employés correspondants dans `employees`
- [ ] Vérifier que les emails correspondent
- [ ] Attribuer les rôles via SQL ou API
- [ ] Vérifier les rôles attribués
- [ ] Tester les permissions RLS


