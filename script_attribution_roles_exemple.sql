-- ============================================
-- SCRIPT D'ATTRIBUTION DES RÔLES
-- Basé sur vos utilisateurs Supabase Auth
-- ============================================

-- ÉTAPE 1 : Vérifier que les utilisateurs et employés existent
-- Exécutez cette requête d'abord pour voir ce qui existe

SELECT 
  'Utilisateur Auth' as type,
  u.id,
  u.email,
  NULL as employee_name
FROM auth.users u
WHERE u.email IN (
  'admin@morellia.ch',
  'chefdechantier@morellia.ch',
  'contact@morellia.ch',
  'dispatcher@morellia.ch',
  'florian.lejeune@morellia.ch',
  'technicien@morellia.ch',
  'technicien@velox.ch'
)
UNION ALL
SELECT 
  'Employé' as type,
  e.id,
  e.email,
  e.first_name || ' ' || e.last_name as employee_name
FROM employees e
WHERE e.email IN (
  'admin@morellia.ch',
  'chefdechantier@morellia.ch',
  'contact@morellia.ch',
  'dispatcher@morellia.ch',
  'florian.lejeune@morellia.ch',
  'technicien@morellia.ch',
  'technicien@velox.ch'
)
ORDER BY email, type;

-- ============================================
-- ÉTAPE 2 : Attribuer les rôles
-- Exécutez ces requêtes une par une ou toutes ensemble
-- ============================================

-- 1. ADMIN - admin@morellia.ch
INSERT INTO user_roles (user_id, employee_id, role)
SELECT 
  u.id as user_id,
  e.id as employee_id,
  'admin' as role
FROM auth.users u
JOIN employees e ON u.email = e.email
WHERE u.email = 'admin@morellia.ch'
ON CONFLICT (user_id, employee_id) 
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- 2. CHEF DE CHANTIER - chefdechantier@morellia.ch
INSERT INTO user_roles (user_id, employee_id, role)
SELECT 
  u.id as user_id,
  e.id as employee_id,
  'chef_chantier' as role
FROM auth.users u
JOIN employees e ON u.email = e.email
WHERE u.email = 'chefdechantier@morellia.ch'
ON CONFLICT (user_id, employee_id) 
DO UPDATE SET 
  role = 'chef_chantier',
  updated_at = NOW();

-- 3. DISPATCHER - dispatcher@morellia.ch
INSERT INTO user_roles (user_id, employee_id, role)
SELECT 
  u.id as user_id,
  e.id as employee_id,
  'dispatcher' as role
FROM auth.users u
JOIN employees e ON u.email = e.email
WHERE u.email = 'dispatcher@morellia.ch'
ON CONFLICT (user_id, employee_id) 
DO UPDATE SET 
  role = 'dispatcher',
  updated_at = NOW();

-- 4. TECHNICIEN - technicien@morellia.ch
INSERT INTO user_roles (user_id, employee_id, role)
SELECT 
  u.id as user_id,
  e.id as employee_id,
  'technicien' as role
FROM auth.users u
JOIN employees e ON u.email = e.email
WHERE u.email = 'technicien@morellia.ch'
ON CONFLICT (user_id, employee_id) 
DO UPDATE SET 
  role = 'technicien',
  updated_at = NOW();

-- 5. TECHNICIEN - technicien@velox.ch
INSERT INTO user_roles (user_id, employee_id, role)
SELECT 
  u.id as user_id,
  e.id as employee_id,
  'technicien' as role
FROM auth.users u
JOIN employees e ON u.email = e.email
WHERE u.email = 'technicien@velox.ch'
ON CONFLICT (user_id, employee_id) 
DO UPDATE SET 
  role = 'technicien',
  updated_at = NOW();

-- 6. FLORIAN LEJEUNE - florian.lejeune@morellia.ch
-- À adapter selon son rôle réel (exemple: technicien)
INSERT INTO user_roles (user_id, employee_id, role)
SELECT 
  u.id as user_id,
  e.id as employee_id,
  'technicien' as role  -- Changez selon le rôle souhaité
FROM auth.users u
JOIN employees e ON u.email = e.email
WHERE u.email = 'florian.lejeune@morellia.ch'
ON CONFLICT (user_id, employee_id) 
DO UPDATE SET 
  role = 'technicien',  -- Changez selon le rôle souhaité
  updated_at = NOW();

-- 7. CONTACT - contact@morellia.ch
-- À adapter selon le rôle souhaité (peut-être admin ou dispatcher)
INSERT INTO user_roles (user_id, employee_id, role)
SELECT 
  u.id as user_id,
  e.id as employee_id,
  'dispatcher' as role  -- Changez selon le rôle souhaité
FROM auth.users u
JOIN employees e ON u.email = e.email
WHERE u.email = 'contact@morellia.ch'
ON CONFLICT (user_id, employee_id) 
DO UPDATE SET 
  role = 'dispatcher',  -- Changez selon le rôle souhaité
  updated_at = NOW();

-- ============================================
-- ÉTAPE 3 : Vérifier les rôles attribués
-- ============================================

SELECT 
  u.email as email_utilisateur,
  e.first_name || ' ' || e.last_name as nom_employe,
  e.email as email_employe,
  ur.role,
  ur.created_at as attribue_le,
  ur.updated_at as modifie_le
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
JOIN employees e ON ur.employee_id = e.id
WHERE u.email IN (
  'admin@morellia.ch',
  'chefdechantier@morellia.ch',
  'contact@morellia.ch',
  'dispatcher@morellia.ch',
  'florian.lejeune@morellia.ch',
  'technicien@morellia.ch',
  'technicien@velox.ch'
)
ORDER BY ur.role, e.last_name;

-- ============================================
-- NOTES IMPORTANTES
-- ============================================

-- ⚠️ AVANT D'EXÉCUTER :
-- 1. Assurez-vous que tous les employés existent dans la table 'employees'
--    avec les mêmes emails que dans auth.users
-- 2. Si un employé n'existe pas, créez-le d'abord :
--    INSERT INTO employees (first_name, last_name, email, type, role, status)
--    VALUES ('Prénom', 'Nom', 'email@example.com', 'Bureau', 'Rôle', 'Actif');

-- 📝 POUR MODIFIER UN RÔLE EXISTANT :
-- Utilisez la même requête INSERT avec ON CONFLICT DO UPDATE
-- Le rôle sera automatiquement mis à jour

-- 🗑️ POUR SUPPRIMER UN RÔLE :
-- DELETE FROM user_roles 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'email@example.com');

-- 🔍 POUR TROUVER UN UTILISATEUR SANS EMPLOYÉ :
-- SELECT u.email 
-- FROM auth.users u
-- WHERE u.email = 'email@example.com'
-- AND NOT EXISTS (
--   SELECT 1 FROM employees e WHERE e.email = u.email
-- );


