-- Script de mise à jour pour la table orders
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- Ajouter la colonne supplier_name si elle n'existe pas
ALTER TABLE orders ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(200);

-- Mettre à jour les enregistrements existants avec une valeur par défaut
UPDATE orders SET supplier_name = 'Non renseigné' WHERE supplier_name IS NULL;

-- Rendre la colonne NOT NULL après avoir mis à jour les valeurs existantes
ALTER TABLE orders ALTER COLUMN supplier_name SET NOT NULL;

-- Créer l'index pour la recherche rapide
CREATE INDEX IF NOT EXISTS idx_orders_supplier ON orders(supplier_name);

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent voir les commandes" ON orders;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent ajouter des commandes" ON orders;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent modifier les commandes" ON orders;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent supprimer les commandes" ON orders;

-- Créer les nouvelles policies restrictives (Admin RH et Chef Chantier seulement)
CREATE POLICY "Admin et Chef de chantier peuvent voir les commandes"
ON orders FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE employees.id = auth.uid()
        AND employees.role IN ('Admin RH', 'Chef Chantier')
    )
);

CREATE POLICY "Admin et Chef de chantier peuvent ajouter des commandes"
ON orders FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM employees
        WHERE employees.id = auth.uid()
        AND employees.role IN ('Admin RH', 'Chef Chantier')
    )
);

CREATE POLICY "Admin et Chef de chantier peuvent modifier les commandes"
ON orders FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE employees.id = auth.uid()
        AND employees.role IN ('Admin RH', 'Chef Chantier')
    )
);

CREATE POLICY "Admin et Chef de chantier peuvent supprimer les commandes"
ON orders FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE employees.id = auth.uid()
        AND employees.role IN ('Admin RH', 'Chef Chantier')
    )
);

-- Vérification
SELECT 
    'Table orders mise à jour avec succès' as message,
    COUNT(*) as nombre_commandes
FROM orders;

SELECT 
    'Policies RLS actives:' as info,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'orders';
