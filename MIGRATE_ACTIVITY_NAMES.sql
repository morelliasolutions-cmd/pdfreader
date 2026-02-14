-- ========================================
-- Migration des noms d'activités
-- ========================================
-- Ce script met à jour les anciens noms d'activités vers les nouveaux
-- dans toutes les tables concernées (interventions, appointments)
--
-- Anciens noms → Nouveaux noms :
-- 1. Swisscom → Swisscom (pas de changement)
-- 2. REA → Swiss4net
-- 3. FTTH FR / FTTH France → Col. Montante
-- 4. SIG → Rollout
-- 5. SmartMetering / Smart Metering → Manchon
-- ========================================

-- Vérification des données existantes AVANT migration
SELECT 
    'interventions' as table_name,
    activity,
    COUNT(*) as count
FROM interventions
WHERE activity IN ('REA', 'FTTH FR', 'SIG', 'SmartMetering', 'Smart Metering')
GROUP BY activity

UNION ALL

SELECT 
    'appointments' as table_name,
    activity,
    COUNT(*) as count
FROM appointments
WHERE activity IN ('rea', 'ftth_fr', 'sig', 'smartmetering')
GROUP BY activity;

-- ========================================
-- Migration de la table 'interventions'
-- ========================================
-- Note : cette table utilise des noms complets (ex: "REA", "FTTH FR")
UPDATE interventions
SET activity = 'Swiss4net'
WHERE activity = 'REA';

UPDATE interventions
SET activity = 'Col. Montante'
WHERE activity = 'FTTH FR';

UPDATE interventions
SET activity = 'Rollout'
WHERE activity = 'SIG';

UPDATE interventions
SET activity = 'Manchon'
WHERE activity IN ('SmartMetering', 'Smart Metering');

-- ========================================
-- Migration de la table 'appointments'
-- ========================================
-- Note : cette table utilise des valeurs en minuscules/snake_case (ex: "rea", "ftth_fr")
UPDATE appointments
SET activity = 'swiss4net'
WHERE activity = 'rea';

UPDATE appointments
SET activity = 'col_montante'
WHERE activity = 'ftth_fr';

UPDATE appointments
SET activity = 'rollout'
WHERE activity = 'sig';

UPDATE appointments
SET activity = 'manchon'
WHERE activity = 'smartmetering';

-- ========================================
-- Vérification des données APRÈS migration
-- ========================================
SELECT 
    'interventions' as table_name,
    activity,
    COUNT(*) as count
FROM interventions
WHERE activity IN ('Swisscom', 'Swiss4net', 'Col. Montante', 'Rollout', 'Manchon')
GROUP BY activity

UNION ALL

SELECT 
    'appointments' as table_name,
    activity,
    COUNT(*) as count
FROM appointments
WHERE activity IN ('swisscom', 'swiss4net', 'col_montante', 'rollout', 'manchon')
GROUP BY activity;

-- ========================================
-- Résumé de la migration
-- ========================================
SELECT 
    '✅ Migration terminée' as status,
    (SELECT COUNT(*) FROM interventions WHERE activity IN ('Swisscom', 'Swiss4net', 'Col. Montante', 'Rollout', 'Manchon')) as interventions_migres,
    (SELECT COUNT(*) FROM appointments WHERE activity IN ('swisscom', 'swiss4net', 'col_montante', 'rollout', 'manchon')) as appointments_migres;
