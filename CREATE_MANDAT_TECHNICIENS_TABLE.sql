-- Table de liaison pour assigner plusieurs techniciens à un mandat (pré-assignation)
-- Ceci permet d'afficher les techniciens suggérés dans planning.html lors de la planification

-- Supprimer la table si elle existe déjà (pour recréer avec la bonne structure)
DROP TABLE IF EXISTS mandat_techniciens CASCADE;

-- Créer la table avec foreign key vers appointments (et non vers mandats qui n'existe pas)
CREATE TABLE mandat_techniciens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(appointment_id, employee_id) -- Un technicien ne peut être assigné qu'une fois par mandat
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX idx_mandat_techniciens_appointment ON mandat_techniciens(appointment_id);
CREATE INDEX idx_mandat_techniciens_employee ON mandat_techniciens(employee_id);

-- Activer RLS (Row Level Security)
ALTER TABLE mandat_techniciens ENABLE ROW LEVEL SECURITY;

-- Policy : Tout le monde peut lire (les techniciens doivent voir leurs assignations)
CREATE POLICY "Allow read access to all authenticated users" ON mandat_techniciens
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Policy : Seuls les admins et managers peuvent insérer/modifier/supprimer
CREATE POLICY "Allow insert for admins and managers" ON mandat_techniciens
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.user_id = auth.uid() 
            AND employees.role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Allow delete for admins and managers" ON mandat_techniciens
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.user_id = auth.uid() 
            AND employees.role IN ('admin', 'manager')
        )
    );

-- Commentaires pour documentation
COMMENT ON TABLE mandat_techniciens IS 'Pré-assignation de techniciens aux mandats pour faciliter la planification';
COMMENT ON COLUMN mandat_techniciens.appointment_id IS 'Référence au mandat (table appointments)';
COMMENT ON COLUMN mandat_techniciens.employee_id IS 'Référence au technicien pré-assigné';
