-- ============================================
-- Script de correction des permissions RLS pour le diagramme de Gantt
-- Ajoute les permissions pour admin, chef_chantier et dispatcher
-- ============================================

-- Vérifier que la fonction get_user_role() existe et inclut 'admin'
-- Si elle n'existe pas, on la crée
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
-- MISE À JOUR DES POLICIES POUR EMPLOYEES
-- ============================================

-- Supprimer l'ancienne policy de lecture
DROP POLICY IF EXISTS "Employees read policy" ON employees;

-- Nouvelle policy: Lecture des employés (admin, direction, chef_chantier, dispatcher)
CREATE POLICY "Employees read policy"
ON employees FOR SELECT
USING (
    CASE get_user_role()
        WHEN 'admin' THEN true
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

-- ============================================
-- MISE À JOUR DES POLICIES POUR APPOINTMENTS
-- ============================================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Appointments read policy" ON appointments;
DROP POLICY IF EXISTS "Appointments insert policy" ON appointments;
DROP POLICY IF EXISTS "Appointments update policy" ON appointments;
DROP POLICY IF EXISTS "Appointments delete policy" ON appointments;

-- Policy: Lecture des appointments (admin, direction, chef_chantier, dispatcher)
CREATE POLICY "Appointments read policy"
ON appointments FOR SELECT
USING (
    CASE get_user_role()
        WHEN 'admin' THEN true
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

-- Policy: Création d'appointments (admin, direction, chef_chantier, dispatcher)
CREATE POLICY "Appointments insert policy"
ON appointments FOR INSERT
WITH CHECK (
    get_user_role() IN ('admin', 'direction', 'dispatcher', 'chef_chantier')
);

-- Policy: Modification d'appointments (admin, direction, chef_chantier, dispatcher)
CREATE POLICY "Appointments update policy"
ON appointments FOR UPDATE
USING (
    get_user_role() IN ('admin', 'direction', 'dispatcher', 'chef_chantier')
);

-- Policy: Suppression d'appointments (admin, direction uniquement)
CREATE POLICY "Appointments delete policy"
ON appointments FOR DELETE
USING (
    get_user_role() IN ('admin', 'direction')
);

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Afficher les policies créées
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('employees', 'appointments')
ORDER BY tablename, policyname;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Policies RLS mises à jour avec succès!';
    RAISE NOTICE 'Les rôles admin, direction, chef_chantier et dispatcher ont maintenant accès aux tables employees et appointments.';
END $$;
