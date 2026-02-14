-- Ajouter la colonne TU (donneur d'ordre) à la table mandats
-- Cette colonne stocke le nom du donneur d'ordre extrait de la colonne BU de l'Excel

ALTER TABLE mandats
ADD COLUMN IF NOT EXISTS tu TEXT;

-- Ajouter une colonne pour le statut de validation TU
ALTER TABLE mandats
ADD COLUMN IF NOT EXISTS tu_valide BOOLEAN DEFAULT FALSE;

-- Ajouter une colonne pour la date de validation TU
ALTER TABLE mandats
ADD COLUMN IF NOT EXISTS tu_date_validation TIMESTAMPTZ;

-- Index pour améliorer les performances des recherches
CREATE INDEX IF NOT EXISTS idx_mandats_tu ON mandats(tu);
CREATE INDEX IF NOT EXISTS idx_mandats_tu_valide ON mandats(tu_valide);

-- Commentaires
COMMENT ON COLUMN mandats.tu IS 'Nom du donneur d''ordre (TU) extrait de la colonne BU';
COMMENT ON COLUMN mandats.tu_valide IS 'Statut de validation TU (true = validé, false = non validé/annulé)';
COMMENT ON COLUMN mandats.tu_date_validation IS 'Date et heure de la dernière validation/annulation TU';
