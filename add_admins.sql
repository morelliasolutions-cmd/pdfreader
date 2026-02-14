-- Script pour ajouter les administrateurs
-- Note: Les utilisateurs auth.users doivent être créés via l'interface Supabase Auth ou l'API
-- Ce script crée les employés et attribue les rôles admin

-- 1. Créer l'employé pour administrateur@morellia.ch (si n'existe pas)
INSERT INTO employees (email, first_name, last_name, type, role, status, start_date, vacation_days)
SELECT 
    'administrateur@morellia.ch',
    'Administrateur',
    'Morellia',
    'Bureau',
    'Administrateur',
    'Actif',
    CURRENT_DATE,
    25
WHERE NOT EXISTS (
    SELECT 1 FROM employees WHERE email = 'administrateur@morellia.ch'
);

-- 2. Attribuer le rôle admin à contact@morellia.ch
-- Récupérer les IDs
DO $$
DECLARE
    v_user_id_contact UUID;
    v_employee_id_contact UUID;
    v_user_id_admin UUID;
    v_employee_id_admin UUID;
BEGIN
    -- Récupérer les IDs pour contact@morellia.ch
    SELECT id INTO v_user_id_contact
    FROM auth.users
    WHERE email = 'contact@morellia.ch'
    LIMIT 1;
    
    SELECT id INTO v_employee_id_contact
    FROM employees
    WHERE email = 'contact@morellia.ch'
    LIMIT 1;
    
    -- Récupérer les IDs pour administrateur@morellia.ch
    SELECT id INTO v_user_id_admin
    FROM auth.users
    WHERE email = 'administrateur@morellia.ch'
    LIMIT 1;
    
    SELECT id INTO v_employee_id_admin
    FROM employees
    WHERE email = 'administrateur@morellia.ch'
    LIMIT 1;
    
    -- Attribuer le rôle admin à contact@morellia.ch
    IF v_user_id_contact IS NOT NULL AND v_employee_id_contact IS NOT NULL THEN
        INSERT INTO user_roles (user_id, employee_id, role)
        VALUES (v_user_id_contact, v_employee_id_contact, 'admin')
        ON CONFLICT (user_id, employee_id) 
        DO UPDATE SET role = 'admin';
    END IF;
    
    -- Attribuer le rôle admin à administrateur@morellia.ch (si l'utilisateur existe)
    IF v_user_id_admin IS NOT NULL AND v_employee_id_admin IS NOT NULL THEN
        INSERT INTO user_roles (user_id, employee_id, role)
        VALUES (v_user_id_admin, v_employee_id_admin, 'admin')
        ON CONFLICT (user_id, employee_id) 
        DO UPDATE SET role = 'admin';
    END IF;
END $$;

-- Vérification
SELECT 
    u.email as user_email,
    e.email as employee_email,
    e.first_name,
    e.last_name,
    ur.role
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
JOIN employees e ON ur.employee_id = e.id
WHERE u.email IN ('contact@morellia.ch', 'administrateur@morellia.ch')
ORDER BY u.email;

