-- ================================================
-- Table pour les demandes de rendez-vous (RDV)
-- ================================================

-- Créer la table RDV
CREATE TABLE IF NOT EXISTS public."RDV" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_mandat TEXT NOT NULL,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    telephone TEXT NOT NULL,
    email TEXT,
    calendrier TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    traite BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ajouter un commentaire à la table
COMMENT ON TABLE public."RDV" IS 'Demandes de rendez-vous clients pour les interventions';

-- Ajouter des commentaires aux colonnes
COMMENT ON COLUMN public."RDV".id IS 'Identifiant unique du RDV';
COMMENT ON COLUMN public."RDV".numero_mandat IS 'Numéro du mandat d''intervention';
COMMENT ON COLUMN public."RDV".nom IS 'Nom du client';
COMMENT ON COLUMN public."RDV".prenom IS 'Prénom du client';
COMMENT ON COLUMN public."RDV".telephone IS 'Téléphone du client';
COMMENT ON COLUMN public."RDV".email IS 'Email du client (optionnel)';
COMMENT ON COLUMN public."RDV".calendrier IS 'Date et heure souhaitée du RDV';
COMMENT ON COLUMN public."RDV".traite IS 'Indique si le RDV a été traité';
COMMENT ON COLUMN public."RDV".created_at IS 'Date de création de la demande';
COMMENT ON COLUMN public."RDV".updated_at IS 'Date de dernière modification';

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_rdv_traite ON public."RDV"(traite);
CREATE INDEX IF NOT EXISTS idx_rdv_calendrier ON public."RDV"(calendrier);
CREATE INDEX IF NOT EXISTS idx_rdv_numero_mandat ON public."RDV"(numero_mandat);
CREATE INDEX IF NOT EXISTS idx_rdv_created_at ON public."RDV"(created_at DESC);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_rdv_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS trigger_update_rdv_updated_at ON public."RDV";
CREATE TRIGGER trigger_update_rdv_updated_at
    BEFORE UPDATE ON public."RDV"
    FOR EACH ROW
    EXECUTE FUNCTION update_rdv_updated_at();

-- ================================================
-- Row Level Security (RLS)
-- ================================================

-- Activer RLS
ALTER TABLE public."RDV" ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut insérer (pour formulaire public)
CREATE POLICY "Permettre insertion publique" ON public."RDV"
    FOR INSERT
    WITH CHECK (true);

-- Politique: Seuls les utilisateurs authentifiés peuvent lire
CREATE POLICY "Permettre lecture authentifiée" ON public."RDV"
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Politique: Seuls les utilisateurs authentifiés peuvent mettre à jour
CREATE POLICY "Permettre mise à jour authentifiée" ON public."RDV"
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Politique: Seuls les administrateurs peuvent supprimer
CREATE POLICY "Permettre suppression admin" ON public."RDV"
    FOR DELETE
    USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- ================================================
-- Données de test (optionnel)
-- ================================================

-- Insérer quelques demandes de RDV de test
INSERT INTO public."RDV" (numero_mandat, nom, prenom, telephone, email, calendrier, traite) VALUES
    ('M-2026-001', 'Dupont', 'Jean', '+41 79 123 45 67', 'jean.dupont@example.com', NOW() + INTERVAL '2 days', false),
    ('M-2026-002', 'Martin', 'Sophie', '+41 78 234 56 78', 'sophie.martin@example.com', NOW() + INTERVAL '3 days', false),
    ('M-2026-003', 'Bernard', 'Pierre', '+41 76 345 67 89', NULL, NOW() + INTERVAL '1 day', false)
ON CONFLICT DO NOTHING;

-- Afficher les RDV créés
SELECT * FROM public."RDV" ORDER BY created_at DESC;
