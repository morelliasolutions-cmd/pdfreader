-- Script pour recalculer les heures totales de tous les pointages
-- À exécuter dans l'éditeur SQL de Supabase

UPDATE time_entries
SET total_hours = CASE
    WHEN start_time IS NOT NULL AND end_time IS NOT NULL THEN
        GREATEST(0, 
            EXTRACT(EPOCH FROM (end_time::time - start_time::time)) / 3600
            - CASE 
                -- Retirer 1h si travail entre 12h et 13h (pause déjeuner)
                WHEN start_time::time < '13:00:00'::time 
                     AND end_time::time > '12:00:00'::time 
                THEN 1 
                ELSE 0 
            END
        )
    ELSE 0
END
WHERE start_time IS NOT NULL AND end_time IS NOT NULL;

-- Vérifier les résultats
SELECT 
    date, 
    employee_id,
    start_time, 
    end_time, 
    total_hours,
    CASE
        WHEN start_time::time < '13:00:00'::time 
             AND end_time::time > '12:00:00'::time 
        THEN 'Avec pause'
        ELSE 'Sans pause'
    END as pause_info
FROM time_entries
ORDER BY date DESC, employee_id
LIMIT 50;


