-- Migration: Ajouter les colonnes manquantes à la table appointments
-- Pour permettre le stockage des données extraites des PDFs

-- Ajouter la colonne email (manquante dans la structure initiale)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Ajouter les colonnes techniques pour les infos Swisscom
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS pto_reference TEXT,
ADD COLUMN IF NOT EXISTS cable_alim TEXT,
ADD COLUMN IF NOT EXISTS fibre_1 TEXT,
ADD COLUMN IF NOT EXISTS fibre_2 TEXT,
ADD COLUMN IF NOT EXISTS fibre_3 TEXT,
ADD COLUMN IF NOT EXISTS fibre_4 TEXT;

-- Créer un index sur mandate_number pour améliorer les recherches
CREATE INDEX IF NOT EXISTS idx_appointments_mandate_number 
ON appointments(mandate_number);

-- Vérifier la structure mise à jour
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;
