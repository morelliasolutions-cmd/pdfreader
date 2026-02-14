-- Relaxer les contraintes de la table appointments pour permettre le "backlog" (mandats en attente)
-- À exécuter dans Supabase SQL Editor

ALTER TABLE appointments ALTER COLUMN employee_id DROP NOT NULL;
ALTER TABLE appointments ALTER COLUMN date DROP NOT NULL;
ALTER TABLE appointments ALTER COLUMN start_time DROP NOT NULL;
ALTER TABLE appointments ALTER COLUMN end_time DROP NOT NULL;
ALTER TABLE appointments ALTER COLUMN address DROP NOT NULL;

-- Vérifier
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments';
