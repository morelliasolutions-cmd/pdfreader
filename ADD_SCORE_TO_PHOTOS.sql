-- Add score and ai_comment to intervention_photos table
ALTER TABLE intervention_photos 
ADD COLUMN IF NOT EXISTS score numeric,
ADD COLUMN IF NOT EXISTS ai_comment text;
