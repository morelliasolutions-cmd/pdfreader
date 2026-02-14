-- ==============================================================================
-- UPDATE_RLS_MOBILE.sql
-- Configuration RLS pour l'Application Mobile (Technicien & Admin)
-- ==============================================================================

-- 1. Mettre à jour la fonction helper pour supporter 'admin' (alias de direction)
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

-- Fonction helper pour vérifier si l'utilisateur est Admin (ou Direction)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'direction')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction helper pour obtenir l'ID employé de l'utilisateur courant
CREATE OR REPLACE FUNCTION get_my_employee_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM employees
        WHERE email = auth.jwt()->>'email'
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 2. TABLE: DEPOTS
-- ==============================================================================
ALTER TABLE depots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Depots read policy" ON depots;
DROP POLICY IF EXISTS "Depots admin policy" ON depots;

-- Lecture : Tout le monde (Techniciens besoin pour liste, Admin pour gestion)
CREATE POLICY "Depots read policy"
ON depots FOR SELECT
USING (auth.role() = 'authenticated');

-- Écriture : Admin uniquement
CREATE POLICY "Depots admin write policy"
ON depots FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- ==============================================================================
-- 3. TABLE: INVENTORY_ITEMS (Stock Général)
-- ==============================================================================
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inventory read policy" ON inventory_items;
DROP POLICY IF EXISTS "Inventory update policy" ON inventory_items;
DROP POLICY IF EXISTS "Inventory admin policy" ON inventory_items;

-- Lecture : Tout le monde
CREATE POLICY "Inventory read policy"
ON inventory_items FOR SELECT
USING (auth.role() = 'authenticated');

-- Update : Technicien (pour décrémenter stock) et Admin
-- Note: Idéalement via RPC, mais l'app fait un UPDATE direct en fallback
CREATE POLICY "Inventory update policy"
ON inventory_items FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Insert/Delete : Admin uniquement
CREATE POLICY "Inventory admin insert/delete policy"
ON inventory_items FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Inventory admin delete policy"
ON inventory_items FOR DELETE
USING (is_admin());

-- ==============================================================================
-- 4. TABLE: EMPLOYEE_EQUIPMENT (Inventaire Perso du Technicien)
-- ==============================================================================
ALTER TABLE employee_equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Equipment read policy" ON employee_equipment;
DROP POLICY IF EXISTS "Equipment insert policy" ON employee_equipment;
DROP POLICY IF EXISTS "Equipment update policy" ON employee_equipment;
DROP POLICY IF EXISTS "Equipment delete policy" ON employee_equipment;

-- Lecture : Admin (tout), Technicien (le sien)
CREATE POLICY "Equipment read policy"
ON employee_equipment FOR SELECT
USING (
    is_admin() 
    OR 
    employee_id = get_my_employee_id()
);

-- Insertion : Admin (tout), Technicien (pour lui-même)
CREATE POLICY "Equipment insert policy"
ON employee_equipment FOR INSERT
WITH CHECK (
    is_admin() 
    OR 
    employee_id = get_my_employee_id()
);

-- Modification : Admin (tout), Technicien (le sien - ex: marquer comme utilisé/rendu)
CREATE POLICY "Equipment update policy"
ON employee_equipment FOR UPDATE
USING (
    is_admin() 
    OR 
    employee_id = get_my_employee_id()
);

-- Suppression : Admin uniquement (Technicien doit "rendre" ou "utiliser", pas supprimer trace)
CREATE POLICY "Equipment delete policy"
ON employee_equipment FOR DELETE
USING (is_admin());

-- ==============================================================================
-- 5. TABLE: APPOINTMENTS (Rendez-vous)
-- ==============================================================================
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Appointments read policy" ON appointments;
DROP POLICY IF EXISTS "Appointments update policy" ON appointments;

-- Lecture : Admin (tout), Technicien (si assigné)
-- Note: On suppose que la colonne est technician_id ou employee_id. Le code JS utilise employee_id.
-- Vérifions la structure supposée via le code : l'app utilise employee_id dans employee_equipment mais appointment a 'technician_id' dans intervention insert?
-- Dans details_intervention.html: intervention.technician_id = appointment.employee_id. Donc appointment.employee_id semble être la clé.
CREATE POLICY "Appointments read policy"
ON appointments FOR SELECT
USING (
    is_admin() 
    OR 
    employee_id = get_my_employee_id()
    OR
    EXISTS ( -- Si assigné comme technicien secondaire ou autre champ si existant
        SELECT 1 FROM intervention_details WHERE appointment_id = appointments.id AND technician_id = get_my_employee_id()
    )
    OR
    -- Fallback simple si la colonne s'appelle technician_id
    (current_setting('request.jwt.claims', true)::json->>'email' IN (
        SELECT email FROM employees WHERE id = appointments.employee_id
    ))
);

-- Update : Admin (tout), Technicien (si assigné - ex: status, note)
CREATE POLICY "Appointments update policy"
ON appointments FOR UPDATE
USING (
    is_admin() 
    OR 
    employee_id = get_my_employee_id()
);

-- Admin Full Access (Insert/Delete)
CREATE POLICY "Appointments admin write policy"
ON appointments FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Appointments admin delete policy"
ON appointments FOR DELETE
USING (is_admin());

-- ==============================================================================
-- 6. TABLE: INTERVENTION_DETAILS
-- ==============================================================================
ALTER TABLE intervention_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Intervention details read policy" ON intervention_details;
DROP POLICY IF EXISTS "Intervention details write policy" ON intervention_details;

-- Lecture : Admin (tout), Technicien (si assigné ou créateur)
-- Champ: technician_id (vu dans details_intervention.html createInterventionFromAppointment)
CREATE POLICY "Intervention details read policy"
ON intervention_details FOR SELECT
USING (
    is_admin()
    OR
    technician_id = get_my_employee_id()
);

-- Insert : Technicien (pour ses RDV), Admin
CREATE POLICY "Intervention details insert policy"
ON intervention_details FOR INSERT
WITH CHECK (
    is_admin()
    OR
    technician_id = get_my_employee_id()
);

-- Update : Technicien (le sien), Admin
CREATE POLICY "Intervention details update policy"
ON intervention_details FOR UPDATE
USING (
    is_admin()
    OR
    technician_id = get_my_employee_id()
);

-- ==============================================================================
-- 7. TABLE: INTERVENTION_PHOTOS
-- ==============================================================================
ALTER TABLE intervention_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Photos read policy" ON intervention_photos;
DROP POLICY IF EXISTS "Photos insert policy" ON intervention_photos;
DROP POLICY IF EXISTS "Photos update policy" ON intervention_photos;
DROP POLICY IF EXISTS "Photos delete policy" ON intervention_photos;

-- Lecture : Via lien avec intervention
CREATE POLICY "Photos read policy"
ON intervention_photos FOR SELECT
USING (
    is_admin()
    OR
    EXISTS (
        SELECT 1 FROM intervention_details
        WHERE id = intervention_photos.intervention_detail_id
        AND technician_id = get_my_employee_id()
    )
);

-- Insertion : Si on a accès à l'intervention
CREATE POLICY "Photos insert policy"
ON intervention_photos FOR INSERT
WITH CHECK (
    is_admin()
    OR
    EXISTS (
        SELECT 1 FROM intervention_details
        WHERE id = intervention_photos.intervention_detail_id
        AND technician_id = get_my_employee_id()
    )
);

-- Update/Delete : Si on a accès
CREATE POLICY "Photos update policy"
ON intervention_photos FOR UPDATE
USING (
    is_admin()
    OR
    EXISTS (
        SELECT 1 FROM intervention_details
        WHERE id = intervention_photos.intervention_detail_id
        AND technician_id = get_my_employee_id()
    )
);

CREATE POLICY "Photos delete policy"
ON intervention_photos FOR DELETE
USING (
    is_admin()
    OR
    EXISTS (
        SELECT 1 FROM intervention_details
        WHERE id = intervention_photos.intervention_detail_id
        AND technician_id = get_my_employee_id()
    )
);

