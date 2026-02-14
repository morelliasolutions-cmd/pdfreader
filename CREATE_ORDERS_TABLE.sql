-- Table pour gérer les commandes
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(100) NOT NULL,
    supplier_name VARCHAR(200) NOT NULL,
    depot VARCHAR(100) NOT NULL,
    order_date DATE NOT NULL,
    price_ttc DECIMAL(10, 2) NOT NULL,
    price_ht DECIMAL(10, 2) NOT NULL,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_supplier ON orders(supplier_name);
CREATE INDEX IF NOT EXISTS idx_orders_depot ON orders(depot);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date DESC);

-- RLS Policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Seuls Admin et Chef de chantier peuvent voir les commandes
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

-- Seuls Admin et Chef de chantier peuvent ajouter des commandes
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

-- Seuls Admin et Chef de chantier peuvent mettre à jour les commandes
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

-- Seuls Admin et Chef de chantier peuvent supprimer les commandes
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

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_orders_updated_at();
