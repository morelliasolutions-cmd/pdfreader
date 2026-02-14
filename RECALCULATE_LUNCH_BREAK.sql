-- ============================================
-- RECALCUL DES HEURES EN FONCTION DE LA PAUSE DE MIDI
-- ============================================
-- Objectif : Recalculer les heures pour appliquer la pause de 1h
--            UNIQUEMENT si la plage horaire inclut 12h-13h
-- ============================================

-- Fonction pour vérifier si une plage horaire inclut 12h-13h
CREATE OR REPLACE FUNCTION includes_lunch_break(p_start_time TIME, p_end_time TIME)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (p_start_time < '13:00:00' AND p_end_time > '12:00:00');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Mise à jour de toutes les entrées existantes
UPDATE time_entries
SET 
    break_duration = CASE 
        WHEN includes_lunch_break(start_time, end_time) THEN 60
        ELSE 0
    END,
    total_hours = CASE
        WHEN includes_lunch_break(start_time, end_time) THEN
            GREATEST(0, EXTRACT(EPOCH FROM (end_time - start_time)) / 3600 - 1)
        ELSE
            GREATEST(0, EXTRACT(EPOCH FROM (end_time - start_time)) / 3600)
    END
WHERE start_time IS NOT NULL 
  AND end_time IS NOT NULL;

-- Vérification
SELECT 
    date,
    start_time,
    end_time,
    break_duration,
    total_hours,
    includes_lunch_break(start_time, end_time) as includes_lunch
FROM time_entries
ORDER BY date DESC
LIMIT 20;

-- Affichage du résumé
SELECT 
    COUNT(*) FILTER (WHERE break_duration = 60) as avec_pause_midi,
    COUNT(*) FILTER (WHERE break_duration = 0) as sans_pause,
    COUNT(*) as total
FROM time_entries
WHERE start_time IS NOT NULL AND end_time IS NOT NULL;
