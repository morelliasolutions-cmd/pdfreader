-- Table pour stocker les paramètres de l'application
-- Ces paramètres sont partagés entre tous les utilisateurs
-- À exécuter dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    setting_type TEXT NOT NULL CHECK (setting_type IN ('production_prices', 'activity_messages')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_app_settings_type ON app_settings(setting_type);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire les paramètres (ils sont partagés)
CREATE POLICY "Everyone can read settings"
ON app_settings FOR SELECT
TO authenticated
USING (true);

-- Policy: Seuls les admins et la direction peuvent modifier les paramètres
CREATE POLICY "Only admins can update settings"
ON app_settings FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'direction')
    )
);

-- Policy: Seuls les admins et la direction peuvent créer des paramètres
CREATE POLICY "Only admins can insert settings"
ON app_settings FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'direction')
    )
);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_settings_timestamp
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_app_settings_updated_at();

-- Insérer les paramètres par défaut (si ils n'existent pas)
INSERT INTO app_settings (setting_key, setting_value, setting_type, description)
VALUES 
    ('production_prices', '{"swisscom": 0, "ftth_fr": 0, "sig": 0, "rea": 0, "smartmetering": 0}'::jsonb, 'production_prices', 'Tarifs de production par type d''installation en CHF'),
    ('activity_messages', '{"swisscom": "", "ftth_fr": "", "sig": "", "rea": ""}'::jsonb, 'activity_messages', 'Messages préconçus pour les activités')
ON CONFLICT (setting_key) DO NOTHING;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Table app_settings créée avec succès !';
    RAISE NOTICE 'Les paramètres sont maintenant partagés entre tous les utilisateurs.';
END $$;
