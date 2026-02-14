-- Migration: Calcul des vacances au prorata
-- À exécuter dans Supabase SQL Editor

-- 1. Ajouter les champs nécessaires à la table employees
ALTER TABLE employees 
    ADD COLUMN IF NOT EXISTS contract_start_date DATE,
    ADD COLUMN IF NOT EXISTS annual_vacation_days INTEGER DEFAULT 25;

-- 2. Fonction pour calculer les jours de vacances acquis au prorata
CREATE OR REPLACE FUNCTION calculate_vacation_days_prorata(
    p_employee_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    days_earned NUMERIC,
    days_used NUMERIC,
    days_remaining NUMERIC,
    percentage_acquired NUMERIC
) AS $$
DECLARE
    v_contract_start DATE;
    v_annual_days INTEGER;
    v_days_since_start INTEGER;
    v_days_in_year INTEGER := 365;
    v_days_used NUMERIC;
BEGIN
    -- Récupérer les informations de l'employé
    SELECT contract_start_date, annual_vacation_days
    INTO v_contract_start, v_annual_days
    FROM employees
    WHERE id = p_employee_id;
    
    -- Si pas de date de contrat, retourner 0
    IF v_contract_start IS NULL THEN
        RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC;
        RETURN;
    END IF;
    
    -- Calculer le nombre de jours depuis le début du contrat
    v_days_since_start := p_date - v_contract_start;
    
    -- Si contrat pas encore commencé, retourner 0
    IF v_days_since_start < 0 THEN
        RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC;
        RETURN;
    END IF;
    
    -- Calculer les jours de vacances acquis (prorata)
    -- Limiter à une année complète max
    v_days_since_start := LEAST(v_days_since_start, v_days_in_year);
    
    -- Calculer les jours utilisés (congés déjà pris)
    SELECT COALESCE(COUNT(*), 0)
    INTO v_days_used
    FROM events
    WHERE employee_id = p_employee_id
      AND type = 'vacation'
      AND date BETWEEN v_contract_start AND p_date;
    
    RETURN QUERY SELECT
        ROUND((v_days_since_start::NUMERIC / v_days_in_year::NUMERIC) * v_annual_days::NUMERIC, 1) as days_earned,
        v_days_used::NUMERIC as days_used,
        ROUND((v_days_since_start::NUMERIC / v_days_in_year::NUMERIC) * v_annual_days::NUMERIC, 1) - v_days_used::NUMERIC as days_remaining,
        ROUND((v_days_since_start::NUMERIC / v_days_in_year::NUMERIC) * 100, 1) as percentage_acquired;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Vue pour obtenir les vacances de tous les employés
CREATE OR REPLACE VIEW employee_vacation_summary AS
SELECT 
    e.id,
    e.first_name,
    e.last_name,
    e.contract_start_date,
    e.annual_vacation_days,
    v.days_earned,
    v.days_used,
    v.days_remaining,
    v.percentage_acquired
FROM employees e
CROSS JOIN LATERAL calculate_vacation_days_prorata(e.id, CURRENT_DATE) v
WHERE e.status = 'active';

-- 4. Créer une policy pour que tout le monde puisse lire les vacances
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Grant access to the view
GRANT SELECT ON employee_vacation_summary TO authenticated;

-- 5. Exemple de test
-- Mettre à jour un employé avec une date de début de contrat
UPDATE employees
SET 
    contract_start_date = '2025-06-01',
    annual_vacation_days = 25
WHERE email = 'jean.dupont@velox.ch';

-- Tester la fonction
SELECT * FROM calculate_vacation_days_prorata(
    (SELECT id FROM employees WHERE email = 'jean.dupont@velox.ch'),
    CURRENT_DATE
);

-- Voir le résumé de tous les employés
SELECT 
    first_name || ' ' || last_name as employee,
    contract_start_date,
    days_earned || ' / ' || annual_vacation_days as vacation_progress,
    days_used as used,
    days_remaining as remaining,
    percentage_acquired || '%' as year_progress
FROM employee_vacation_summary
ORDER BY last_name;


