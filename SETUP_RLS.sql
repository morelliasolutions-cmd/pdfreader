-- Migration: Ajouter le système de rôles (RLS)
-- À exécuter dans Supabase SQL Editor

-- 1. Ajouter la colonne 'role' à la table users (si elle existe)
-- Si vous n'avez pas de table users personnalisée, on utilise auth.users avec des métadonnées

-- Option A: Si vous avez une table 'users' personnalisée
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'technicien';
ALTER TABLE users ADD CONSTRAINT check_role CHECK (role IN ('direction', 'chef_chantier', 'dispatcher', 'technicien'));

-- Option B: Créer une table 'user_roles' liée à auth.users
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'technicien',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_role CHECK (role IN ('direction', 'chef_chantier', 'dispatcher', 'technicien')),
    CONSTRAINT unique_user_role UNIQUE (user_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire son propre rôle
CREATE POLICY "Users can read their own role"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Seule la direction peut modifier les rôles
CREATE POLICY "Only direction can update roles"
ON user_roles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'direction'
    )
);

-- Policy: Seule la direction peut créer des rôles
CREATE POLICY "Only direction can insert roles"
ON user_roles FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'direction'
    )
);

-- Fonction helper pour obtenir le rôle de l'utilisateur courant
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

-- ============================================
-- RLS POLICIES POUR LA TABLE EMPLOYEES
-- ============================================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Enable all for authenticated users" ON employees;

-- Policy: Lecture des employés
CREATE POLICY "Employees read policy"
ON employees FOR SELECT
USING (
    CASE get_user_role()
        WHEN 'direction' THEN true
        WHEN 'chef_chantier' THEN true
        WHEN 'dispatcher' THEN true
        WHEN 'technicien' THEN 
            -- Technicien ne peut voir que son propre profil
            id IN (
                SELECT id FROM employees
                WHERE email = auth.jwt()->>'email'
            )
        ELSE false
    END
);

-- Policy: Modification des employés
CREATE POLICY "Employees update policy"
ON employees FOR UPDATE
USING (
    CASE get_user_role()
        WHEN 'direction' THEN true
        WHEN 'chef_chantier' THEN false
        WHEN 'dispatcher' THEN false
        WHEN 'technicien' THEN 
            -- Technicien peut modifier certains champs de son profil
            id IN (
                SELECT id FROM employees
                WHERE email = auth.jwt()->>'email'
            )
        ELSE false
    END
);

-- Policy: Création d'employés (direction uniquement)
CREATE POLICY "Employees insert policy"
ON employees FOR INSERT
WITH CHECK (get_user_role() = 'direction');

-- Policy: Suppression d'employés (direction uniquement)
CREATE POLICY "Employees delete policy"
ON employees FOR DELETE
USING (get_user_role() = 'direction');

-- ============================================
-- RLS POLICIES POUR LA TABLE TIME_ENTRIES
-- ============================================

DROP POLICY IF EXISTS "Enable all for authenticated users" ON time_entries;

-- Policy: Lecture des pointages
-- TOUS les utilisateurs authentifiés peuvent lire TOUS les pointages
-- Nécessaire pour l'interface de pointage qui doit afficher tous les employés
CREATE POLICY "Time entries read policy - all authenticated"
ON time_entries FOR SELECT
TO authenticated
USING (true);

-- Policy: Modification des pointages
-- ❌ Les techniciens NE PEUVENT PAS modifier leurs pointages (règle de sécurité)
CREATE POLICY "Time entries update policy"
ON time_entries FOR UPDATE
USING (
    get_user_role() IN ('direction', 'chef_chantier')
);

-- Policy: Création de pointages
CREATE POLICY "Time entries insert policy"
ON time_entries FOR INSERT
WITH CHECK (
    CASE get_user_role()
        WHEN 'direction' THEN true
        WHEN 'chef_chantier' THEN true
        WHEN 'dispatcher' THEN false
        WHEN 'technicien' THEN 
            employee_id IN (
                SELECT id FROM employees
                WHERE email = auth.jwt()->>'email'
            )
        ELSE false
    END
);

-- Policy: Suppression de pointages (direction + chef chantier)
CREATE POLICY "Time entries delete policy"
ON time_entries FOR DELETE
USING (
    get_user_role() IN ('direction', 'chef_chantier')
);

-- ============================================
-- RLS POLICIES POUR LA TABLE INTERVENTIONS
-- ============================================

DROP POLICY IF EXISTS "Enable all for authenticated users" ON interventions;

-- Policy: Lecture des interventions
CREATE POLICY "Interventions read policy"
ON interventions FOR SELECT
USING (
    CASE get_user_role()
        WHEN 'direction' THEN true
        WHEN 'chef_chantier' THEN true
        WHEN 'dispatcher' THEN true
        WHEN 'technicien' THEN 
            employee_id IN (
                SELECT id FROM employees
                WHERE email = auth.jwt()->>'email'
            )
        ELSE false
    END
);

-- Policy: Modification des interventions
CREATE POLICY "Interventions update policy"
ON interventions FOR UPDATE
USING (
    get_user_role() IN ('direction', 'chef_chantier', 'dispatcher')
);

-- Policy: Création d'interventions
CREATE POLICY "Interventions insert policy"
ON interventions FOR INSERT
WITH CHECK (
    get_user_role() IN ('direction', 'chef_chantier', 'dispatcher')
);

-- Policy: Suppression d'interventions
CREATE POLICY "Interventions delete policy"
ON interventions FOR DELETE
USING (
    get_user_role() IN ('direction', 'chef_chantier')
);

-- ============================================
-- RLS POLICIES POUR LA TABLE EVENTS
-- ============================================

DROP POLICY IF EXISTS "Enable all for authenticated users" ON events;

-- Policy: Lecture des événements (absences, congés)
CREATE POLICY "Events read policy"
ON events FOR SELECT
USING (
    CASE get_user_role()
        WHEN 'direction' THEN true
        WHEN 'chef_chantier' THEN true
        WHEN 'dispatcher' THEN true
        WHEN 'technicien' THEN 
            employee_id IN (
                SELECT id FROM employees
                WHERE email = auth.jwt()->>'email'
            )
        ELSE false
    END
);

-- Policy: Modification des événements
CREATE POLICY "Events update policy"
ON events FOR UPDATE
USING (
    get_user_role() IN ('direction', 'chef_chantier', 'dispatcher')
);

-- Policy: Création d'événements
CREATE POLICY "Events insert policy"
ON events FOR INSERT
WITH CHECK (
    CASE get_user_role()
        WHEN 'direction' THEN true
        WHEN 'chef_chantier' THEN true
        WHEN 'dispatcher' THEN true
        WHEN 'technicien' THEN 
            -- Technicien peut créer ses propres demandes de congés
            employee_id IN (
                SELECT id FROM employees
                WHERE email = auth.jwt()->>'email'
            )
        ELSE false
    END
);

-- Policy: Suppression d'événements
CREATE POLICY "Events delete policy"
ON events FOR DELETE
USING (
    get_user_role() IN ('direction', 'chef_chantier', 'dispatcher')
);

-- ============================================
-- INSÉRER LE PREMIER UTILISATEUR DIRECTION
-- ============================================

-- Remplacez cet UUID par l'ID de votre utilisateur dans auth.users
-- Vous pouvez le trouver dans: Supabase Dashboard -> Authentication -> Users
INSERT INTO user_roles (user_id, role)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'contact@morellia.ch' LIMIT 1),
    'direction'
)
ON CONFLICT (user_id) DO UPDATE SET role = 'direction';

-- Vérifier que tout fonctionne
SELECT 
    u.email,
    ur.role,
    ur.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY ur.created_at DESC;


