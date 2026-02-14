-- Table pour les rendez-vous/interventions planifiées
-- À exécuter dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Informations intervention
    activity TEXT NOT NULL, -- swisscom, ftth_fr, sig, rea, smartmetering
    mandate_number TEXT NOT NULL,
    client_name TEXT,
    phone TEXT,
    
    -- Adresse
    address TEXT NOT NULL,
    npa TEXT,
    city TEXT,
    
    -- Métadonnées
    note TEXT,
    is_urgent BOOLEAN DEFAULT FALSE,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_appointments_employee_date ON appointments(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_activity ON appointments(activity);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy: Lecture des appointments
CREATE POLICY "Appointments read policy"
ON appointments FOR SELECT
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

-- Policy: Création d'appointments (direction + dispatcher)
CREATE POLICY "Appointments insert policy"
ON appointments FOR INSERT
WITH CHECK (
    get_user_role() IN ('direction', 'dispatcher', 'chef_chantier')
);

-- Policy: Modification d'appointments (direction + dispatcher)
CREATE POLICY "Appointments update policy"
ON appointments FOR UPDATE
USING (
    get_user_role() IN ('direction', 'dispatcher', 'chef_chantier')
);

-- Policy: Suppression d'appointments (direction + dispatcher)
CREATE POLICY "Appointments delete policy"
ON appointments FOR DELETE
USING (
    get_user_role() IN ('direction', 'dispatcher')
);

-- Fonction trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Vérifier
SELECT * FROM appointments LIMIT 10;

