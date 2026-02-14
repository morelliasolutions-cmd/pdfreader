-- ============================================
-- FIX RLS POINTAGE TECHNICIEN
-- ============================================
-- Objectif : Les techniciens peuvent UNIQUEMENT AJOUTER des pointages
--            Seuls les administrateurs et chefs de chantier peuvent modifier/supprimer
-- ============================================

-- Suppression des anciennes policies
DROP POLICY IF EXISTS "Time entries read policy" ON time_entries;
DROP POLICY IF EXISTS "Time entries update policy" ON time_entries;
DROP POLICY IF EXISTS "Time entries insert policy" ON time_entries;
DROP POLICY IF EXISTS "Time entries delete policy" ON time_entries;

-- ============================================
-- LECTURE : TOUS les utilisateurs authentifiés peuvent lire TOUS les pointages
-- Nécessaire pour l'interface de pointage (pointage.html) qui doit afficher tous les employés
-- ============================================
CREATE POLICY "Time entries read policy - all authenticated"
ON time_entries FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- INSERTION : Tout le monde peut ajouter ses propres pointages
-- Admin et Chef peuvent ajouter pour n'importe qui
-- ============================================
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

-- ============================================
-- MODIFICATION : UNIQUEMENT Admin et Chef de chantier
-- ❌ Les techniciens NE PEUVENT PAS modifier leurs pointages
-- ============================================
CREATE POLICY "Time entries update policy"
ON time_entries FOR UPDATE
USING (
    get_user_role() IN ('direction', 'chef_chantier')
);

-- ============================================
-- SUPPRESSION : UNIQUEMENT Admin et Chef de chantier
-- ============================================
CREATE POLICY "Time entries delete policy"
ON time_entries FOR DELETE
USING (
    get_user_role() IN ('direction', 'chef_chantier')
);

-- ============================================
-- Vérification de l'activation du RLS
-- ============================================
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Confirmation
SELECT 'RLS Pointages mis à jour avec succès!' as message;
SELECT '✓ Techniciens : INSERT uniquement' as info;
SELECT '✓ Admin/Chef : INSERT + UPDATE + DELETE' as info;
