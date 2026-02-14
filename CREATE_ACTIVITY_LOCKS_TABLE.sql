-- ================================================
-- Table pour les verrouillages d'activités
-- ================================================

-- Créer la table activity_locks
CREATE TABLE IF NOT EXISTS public.activity_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity TEXT NOT NULL CHECK (activity IN ('swisscom', 'ftth_fr', 'sig', 'rea')),
    date DATE NOT NULL,
    morning_locked BOOLEAN NOT NULL DEFAULT FALSE,
    afternoon_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(activity, date)
);

-- Ajouter un commentaire à la table
COMMENT ON TABLE public.activity_locks IS 'Verrouillages des calendriers par activité et période';

-- Ajouter des commentaires aux colonnes
COMMENT ON COLUMN public.activity_locks.id IS 'Identifiant unique';
COMMENT ON COLUMN public.activity_locks.activity IS 'Type d''activité (swisscom, ftth_fr, sig, rea)';
COMMENT ON COLUMN public.activity_locks.date IS 'Date du verrouillage';
COMMENT ON COLUMN public.activity_locks.morning_locked IS 'Matin verrouillé';
COMMENT ON COLUMN public.activity_locks.afternoon_locked IS 'Après-midi verrouillé';

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_activity_locks_date ON public.activity_locks(date);
CREATE INDEX IF NOT EXISTS idx_activity_locks_activity ON public.activity_locks(activity);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_activity_locks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS trigger_update_activity_locks_updated_at ON public.activity_locks;
CREATE TRIGGER trigger_update_activity_locks_updated_at
    BEFORE UPDATE ON public.activity_locks
    FOR EACH ROW
    EXECUTE FUNCTION update_activity_locks_updated_at();

-- ================================================
-- Row Level Security (RLS)
-- ================================================

-- Activer RLS
ALTER TABLE public.activity_locks ENABLE ROW LEVEL SECURITY;

-- Politique: Seuls les utilisateurs authentifiés peuvent lire
CREATE POLICY "Permettre lecture authentifiée" ON public.activity_locks
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Politique: Seuls les utilisateurs authentifiés peuvent insérer
CREATE POLICY "Permettre insertion authentifiée" ON public.activity_locks
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Politique: Seuls les utilisateurs authentifiés peuvent mettre à jour
CREATE POLICY "Permettre mise à jour authentifiée" ON public.activity_locks
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Politique: Seuls les utilisateurs authentifiés peuvent supprimer
CREATE POLICY "Permettre suppression authentifiée" ON public.activity_locks
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- ================================================
-- Données de test (optionnel)
-- ================================================

-- Insérer quelques verrouillages de test
INSERT INTO public.activity_locks (activity, date, morning_locked, afternoon_locked) VALUES
    ('swisscom', CURRENT_DATE, true, false),
    ('ftth_fr', CURRENT_DATE + INTERVAL '1 day', false, true),
    ('sig', CURRENT_DATE + INTERVAL '2 days', true, true)
ON CONFLICT (activity, date) DO NOTHING;

-- Afficher les verrouillages créés
SELECT * FROM public.activity_locks ORDER BY date DESC;
