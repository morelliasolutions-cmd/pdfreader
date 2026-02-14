-- ================================================
-- Table pour les photos des interventions (stockage privé)
-- ================================================

-- Créer le bucket privé pour les photos d'intervention
INSERT INTO storage.buckets (id, name, public)
VALUES ('intervention-photos-private', 'intervention-photos-private', false)
ON CONFLICT (id) DO NOTHING;

-- Activer RLS sur le bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Politique: Les techniciens peuvent uploader leurs photos
CREATE POLICY "Techniciens peuvent uploader photos" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'intervention-photos-private'
        AND auth.role() = 'authenticated'
    );

-- Politique: Les techniciens peuvent voir leurs photos
CREATE POLICY "Techniciens peuvent voir leurs photos" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'intervention-photos-private'
        AND auth.role() = 'authenticated'
    );

-- Politique: Les admins peuvent voir toutes les photos
CREATE POLICY "Admins peuvent voir toutes les photos" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'intervention-photos-private'
        AND EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- ================================================
-- Table intervention_photos
-- ================================================

CREATE TABLE IF NOT EXISTS public.intervention_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intervention_detail_id UUID NOT NULL REFERENCES intervention_details(id) ON DELETE CASCADE,
    
    -- Informations sur la photo
    photo_type TEXT NOT NULL, -- 'facade', 'pbo-avant', 'pbo-apres', etc.
    photo_label TEXT NOT NULL, -- Label français lisible
    
    -- Stockage
    storage_path TEXT NOT NULL, -- Chemin dans le bucket privé
    storage_url TEXT, -- URL d'accès (signée temporairement)
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    
    -- Métadonnées techniques
    technician_name TEXT, -- Nom du technicien
    technician_id UUID REFERENCES employees(id),
    capture_timestamp TIMESTAMPTZ DEFAULT NOW(), -- Heure de la prise de photo
    
    -- Métadonnées de l'intervention
    pto_reference TEXT, -- Numéro de référence de la prise (OTO)
    mandate_number TEXT, -- Numéro de mandat
    
    -- Fibres (couleurs uniquement, pas les numéros)
    fibre_colors JSONB, -- Ex: {"fibre1": "Bleu", "fibre2": "Orange", "fibre3": "Vert", "fibre4": "Marron"}
    
    -- Validation IA
    validation_status TEXT DEFAULT 'pending', -- 'pending', 'validated', 'rejected', 'partial'
    ai_score DECIMAL(3, 2), -- Score de 0 à 1
    ai_feedback TEXT,
    validation_issues JSONB, -- Liste des problèmes détectés
    validated_at TIMESTAMPTZ,
    
    -- Métadonnées supplémentaires
    is_additional BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commentaires
COMMENT ON TABLE public.intervention_photos IS 'Photos des interventions stockées dans un bucket privé';
COMMENT ON COLUMN public.intervention_photos.photo_type IS 'Type de photo (facade, pbo-avant, etc.)';
COMMENT ON COLUMN public.intervention_photos.technician_name IS 'Nom complet du technicien';
COMMENT ON COLUMN public.intervention_photos.capture_timestamp IS 'Heure réelle de prise de la photo';
COMMENT ON COLUMN public.intervention_photos.pto_reference IS 'Référence OTO de la prise';
COMMENT ON COLUMN public.intervention_photos.fibre_colors IS 'Couleurs des fibres (pas les numéros)';
COMMENT ON COLUMN public.intervention_photos.validation_status IS 'Statut de validation IA';

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_intervention_photos_intervention ON public.intervention_photos(intervention_detail_id);
CREATE INDEX IF NOT EXISTS idx_intervention_photos_technician ON public.intervention_photos(technician_id);
CREATE INDEX IF NOT EXISTS idx_intervention_photos_type ON public.intervention_photos(photo_type);
CREATE INDEX IF NOT EXISTS idx_intervention_photos_validation ON public.intervention_photos(validation_status);
CREATE INDEX IF NOT EXISTS idx_intervention_photos_created ON public.intervention_photos(created_at DESC);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_intervention_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_intervention_photos_updated_at ON public.intervention_photos;
CREATE TRIGGER trigger_update_intervention_photos_updated_at
    BEFORE UPDATE ON public.intervention_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_photos_updated_at();

-- ================================================
-- Row Level Security (RLS)
-- ================================================

ALTER TABLE public.intervention_photos ENABLE ROW LEVEL SECURITY;

-- Les techniciens peuvent voir leurs propres photos
CREATE POLICY "Techniciens voient leurs photos" ON public.intervention_photos
    FOR SELECT
    USING (
        technician_id = (
            SELECT id FROM employees WHERE email = auth.email()
        )
    );

-- Les techniciens peuvent insérer leurs photos
CREATE POLICY "Techniciens insèrent leurs photos" ON public.intervention_photos
    FOR INSERT
    WITH CHECK (
        technician_id = (
            SELECT id FROM employees WHERE email = auth.email()
        )
    );

-- Les techniciens peuvent mettre à jour leurs photos
CREATE POLICY "Techniciens modifient leurs photos" ON public.intervention_photos
    FOR UPDATE
    USING (
        technician_id = (
            SELECT id FROM employees WHERE email = auth.email()
        )
    )
    WITH CHECK (
        technician_id = (
            SELECT id FROM employees WHERE email = auth.email()
        )
    );

-- Les admins peuvent tout voir
CREATE POLICY "Admins voient toutes les photos" ON public.intervention_photos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Les admins peuvent tout modifier
CREATE POLICY "Admins modifient toutes les photos" ON public.intervention_photos
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );
