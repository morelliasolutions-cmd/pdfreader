-- Script pour vider la table appointments et repartir à zéro
-- À exécuter dans Supabase SQL Editor

-- Supprimer toutes les données de la table appointments
DELETE FROM appointments;

-- Optionnel : supprimer aussi la table mandats (ancienne structure)
-- DELETE FROM mandats;

-- Réinitialiser les séquences si nécessaire
-- ALTER SEQUENCE appointments_id_seq RESTART WITH 1;

SELECT 'Table appointments vidée - redémarrage à zéro' as status;
