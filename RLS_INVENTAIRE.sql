-- ==============================================================================
-- RLS_INVENTAIRE.sql
-- Configuration RLS pour le dossier inventaire
-- Admin et chef_chantier : tous les droits (SELECT, INSERT, UPDATE, DELETE)
-- Dispatcher : uniquement SELECT (lecture)
-- ==============================================================================

-- Fonction helper pour vérifier si l'utilisateur est Admin ou Chef de chantier
CREATE OR REPLACE FUNCTION is_admin_or_chef()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'chef_chantier')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction helper pour vérifier si l'utilisateur est Dispatcher
CREATE OR REPLACE FUNCTION is_dispatcher()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() 
        AND role = 'dispatcher'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction helper pour vérifier si l'utilisateur est Admin, Chef de chantier ou Dispatcher
CREATE OR REPLACE FUNCTION is_inventory_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'chef_chantier', 'dispatcher')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 1. TABLE: INVENTORY_ITEMS (Articles d'inventaire)
-- ==============================================================================
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Inventory read policy" ON inventory_items;
DROP POLICY IF EXISTS "Inventory update policy" ON inventory_items;
DROP POLICY IF EXISTS "Inventory admin insert/delete policy" ON inventory_items;
DROP POLICY IF EXISTS "Inventory admin delete policy" ON inventory_items;
DROP POLICY IF EXISTS "Inventory admin write policy" ON inventory_items;

-- SELECT : Admin, Chef de chantier, Dispatcher (lecture uniquement pour dispatcher)
CREATE POLICY "Inventory read policy"
ON inventory_items FOR SELECT
USING (is_inventory_user());

-- INSERT : Admin et Chef de chantier uniquement
CREATE POLICY "Inventory insert policy"
ON inventory_items FOR INSERT
WITH CHECK (is_admin_or_chef());

-- UPDATE : Admin et Chef de chantier uniquement
CREATE POLICY "Inventory update policy"
ON inventory_items FOR UPDATE
USING (is_admin_or_chef())
WITH CHECK (is_admin_or_chef());

-- DELETE : Admin et Chef de chantier uniquement
CREATE POLICY "Inventory delete policy"
ON inventory_items FOR DELETE
USING (is_admin_or_chef());

-- ==============================================================================
-- 2. TABLE: EMPLOYEE_EQUIPMENT (Équipements des employés)
-- ==============================================================================
ALTER TABLE employee_equipment ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Equipment read policy" ON employee_equipment;
DROP POLICY IF EXISTS "Equipment insert policy" ON employee_equipment;
DROP POLICY IF EXISTS "Equipment update policy" ON employee_equipment;
DROP POLICY IF EXISTS "Equipment delete policy" ON employee_equipment;

-- SELECT : Admin, Chef de chantier, Dispatcher (lecture uniquement pour dispatcher)
CREATE POLICY "Equipment read policy"
ON employee_equipment FOR SELECT
USING (is_inventory_user());

-- INSERT : Admin et Chef de chantier uniquement
CREATE POLICY "Equipment insert policy"
ON employee_equipment FOR INSERT
WITH CHECK (is_admin_or_chef());

-- UPDATE : Admin et Chef de chantier uniquement
CREATE POLICY "Equipment update policy"
ON employee_equipment FOR UPDATE
USING (is_admin_or_chef())
WITH CHECK (is_admin_or_chef());

-- DELETE : Admin et Chef de chantier uniquement
CREATE POLICY "Equipment delete policy"
ON employee_equipment FOR DELETE
USING (is_admin_or_chef());

-- ==============================================================================
-- 3. TABLE: DEPOTS (Dépôts)
-- ==============================================================================
ALTER TABLE depots ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Depots read policy" ON depots;
DROP POLICY IF EXISTS "Depots admin write policy" ON depots;
DROP POLICY IF EXISTS "Depots admin policy" ON depots;

-- SELECT : Admin, Chef de chantier, Dispatcher (lecture uniquement pour dispatcher)
CREATE POLICY "Depots read policy"
ON depots FOR SELECT
USING (is_inventory_user());

-- INSERT : Admin et Chef de chantier uniquement
CREATE POLICY "Depots insert policy"
ON depots FOR INSERT
WITH CHECK (is_admin_or_chef());

-- UPDATE : Admin et Chef de chantier uniquement
CREATE POLICY "Depots update policy"
ON depots FOR UPDATE
USING (is_admin_or_chef())
WITH CHECK (is_admin_or_chef());

-- DELETE : Admin et Chef de chantier uniquement
CREATE POLICY "Depots delete policy"
ON depots FOR DELETE
USING (is_admin_or_chef());

-- ==============================================================================
-- 4. TABLE: ORDERS (Commandes)
-- ==============================================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Orders read policy" ON orders;
DROP POLICY IF EXISTS "Orders insert policy" ON orders;
DROP POLICY IF EXISTS "Orders update policy" ON orders;
DROP POLICY IF EXISTS "Orders delete policy" ON orders;

-- SELECT : Admin, Chef de chantier, Dispatcher (lecture uniquement pour dispatcher)
CREATE POLICY "Orders read policy"
ON orders FOR SELECT
USING (is_inventory_user());

-- INSERT : Admin et Chef de chantier uniquement
CREATE POLICY "Orders insert policy"
ON orders FOR INSERT
WITH CHECK (is_admin_or_chef());

-- UPDATE : Admin et Chef de chantier uniquement
CREATE POLICY "Orders update policy"
ON orders FOR UPDATE
USING (is_admin_or_chef())
WITH CHECK (is_admin_or_chef());

-- DELETE : Admin et Chef de chantier uniquement
CREATE POLICY "Orders delete policy"
ON orders FOR DELETE
USING (is_admin_or_chef());

-- ==============================================================================
-- 5. TABLE: VEHICLES (Véhicules)
-- ==============================================================================
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Vehicles read policy" ON vehicles;
DROP POLICY IF EXISTS "Vehicles insert policy" ON vehicles;
DROP POLICY IF EXISTS "Vehicles update policy" ON vehicles;
DROP POLICY IF EXISTS "Vehicles delete policy" ON vehicles;

-- SELECT : Admin, Chef de chantier, Dispatcher (lecture uniquement pour dispatcher)
CREATE POLICY "Vehicles read policy"
ON vehicles FOR SELECT
USING (is_inventory_user());

-- INSERT : Admin et Chef de chantier uniquement
CREATE POLICY "Vehicles insert policy"
ON vehicles FOR INSERT
WITH CHECK (is_admin_or_chef());

-- UPDATE : Admin et Chef de chantier uniquement
CREATE POLICY "Vehicles update policy"
ON vehicles FOR UPDATE
USING (is_admin_or_chef())
WITH CHECK (is_admin_or_chef());

-- DELETE : Admin et Chef de chantier uniquement
CREATE POLICY "Vehicles delete policy"
ON vehicles FOR DELETE
USING (is_admin_or_chef());

-- ==============================================================================
-- 6. TABLE: INTERVENTION_DETAILS (Détails d'intervention - utilisé dans collaborateurs.html)
-- ==============================================================================
ALTER TABLE intervention_details ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Intervention details read policy" ON intervention_details;
DROP POLICY IF EXISTS "Intervention details insert policy" ON intervention_details;
DROP POLICY IF EXISTS "Intervention details update policy" ON intervention_details;
DROP POLICY IF EXISTS "Intervention details delete policy" ON intervention_details;

-- SELECT : Admin, Chef de chantier, Dispatcher (lecture uniquement pour dispatcher)
CREATE POLICY "Intervention details read policy"
ON intervention_details FOR SELECT
USING (is_inventory_user());

-- INSERT : Admin et Chef de chantier uniquement
CREATE POLICY "Intervention details insert policy"
ON intervention_details FOR INSERT
WITH CHECK (is_admin_or_chef());

-- UPDATE : Admin et Chef de chantier uniquement
CREATE POLICY "Intervention details update policy"
ON intervention_details FOR UPDATE
USING (is_admin_or_chef())
WITH CHECK (is_admin_or_chef());

-- DELETE : Admin et Chef de chantier uniquement
CREATE POLICY "Intervention details delete policy"
ON intervention_details FOR DELETE
USING (is_admin_or_chef());

-- ==============================================================================
-- 7. TABLE: EMPLOYEES (Employés - utilisé dans plusieurs fichiers inventaire)
-- ==============================================================================
-- Note: Les RLS pour employees sont déjà configurées dans SETUP_RLS.sql
-- On s'assure juste que dispatcher peut lire (déjà fait normalement)
-- On vérifie et met à jour si nécessaire

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Vérifier si la policy SELECT existe déjà et inclut dispatcher
-- Si elle existe, on la laisse (elle devrait déjà inclure dispatcher)
-- Sinon, on en crée une nouvelle

-- On ne modifie pas les policies existantes pour employees car elles sont gérées ailleurs
-- On s'assure juste que dispatcher peut lire (normalement déjà fait dans SETUP_RLS.sql)

-- ==============================================================================
-- RÉSUMÉ DES PERMISSIONS
-- ==============================================================================
-- 
-- Tables configurées :
-- 1. inventory_items
-- 2. employee_equipment
-- 3. depots
-- 4. orders
-- 5. vehicles
-- 6. intervention_details
--
-- Permissions par rôle :
-- - admin : SELECT, INSERT, UPDATE, DELETE (tous les droits)
-- - chef_chantier : SELECT, INSERT, UPDATE, DELETE (tous les droits)
-- - dispatcher : SELECT uniquement (lecture seule)
--
-- ==============================================================================
