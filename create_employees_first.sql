-- ============================================
-- ÉTAPE 1 : Créer les employés manquants
-- Exécutez ce script AVANT d'importer le CSV user_roles
-- ============================================

INSERT INTO employees (first_name, last_name, email, type, role, status)
VALUES 
  ('Admin', 'Morellia', 'admin@morellia.ch', 'Bureau', 'Administrateur', 'Actif'),
  ('Chef', 'Chantier', 'chefdechantier@morellia.ch', 'Bureau', 'Chef de chantier', 'Actif'),
  ('Dispatcher', 'Morellia', 'dispatcher@morellia.ch', 'Bureau', 'Dispatcher', 'Actif'),
  ('Contact', 'Morellia', 'contact@morellia.ch', 'Bureau', 'Contact', 'Actif'),
  ('Florian', 'Lejeune', 'florian.lejeune@morellia.ch', 'Technicien', 'Technicien', 'Actif'),
  ('Technicien', 'Morellia', 'technicien@morellia.ch', 'Technicien', 'Technicien', 'Actif'),
  ('Technicien', 'Velox', 'technicien@velox.ch', 'Technicien', 'Technicien', 'Actif')
ON CONFLICT DO NOTHING;

-- Vérifier que les employés ont été créés
SELECT id, email, first_name || ' ' || last_name as name
FROM employees
WHERE email IN (
  'admin@morellia.ch',
  'chefdechantier@morellia.ch',
  'contact@morellia.ch',
  'dispatcher@morellia.ch',
  'florian.lejeune@morellia.ch',
  'technicien@morellia.ch',
  'technicien@velox.ch'
)
ORDER BY email;


