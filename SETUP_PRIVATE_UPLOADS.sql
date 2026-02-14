-- 1. Create Private Bucket (if permissions allow, otherwise user acts)
INSERT INTO storage.buckets (id, name, public)
VALUES ('private-uploads', 'private-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Create Unified Uploads Table
CREATE TABLE IF NOT EXISTS upload_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID DEFAULT auth.uid(),
    type TEXT NOT NULL, -- 'intervention_photo', 'expense_receipt', 'accident_report', 'inventory_check'
    related_id UUID, -- Optional: intervention_id, inventory_item_id, etc.
    storage_path TEXT NOT NULL,
    bucket_id TEXT NOT NULL DEFAULT 'private-uploads',
    metadata JSONB DEFAULT '{}'::jsonb, -- Store labels, coordinates, notes here
    status TEXT DEFAULT 'pending' -- 'pending', 'processed'
);

-- 3. RLS Policies
ALTER TABLE upload_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own uploads" 
ON upload_events FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own uploads" 
ON upload_events FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Admins/Dispatchers can view all uploads"
ON upload_events FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('direction', 'admin', 'dispatcher', 'chef_chantier')
  )
);

-- 4. Storage Policies for 'private-uploads'

-- Policy: Allow authenticated users to upload files
-- Note: 'owner' column in storage.objects is automatically set to auth.uid() on INSERT
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'private-uploads'
  AND auth.uid() = owner
);

-- Policy: Allow users to view/download their own files
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'private-uploads'
  AND auth.uid() = owner
);

-- Policy: Allow Direction/Managers to view all files
CREATE POLICY "Management can view all files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'private-uploads'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('direction', 'admin', 'chef_chantier', 'dispatcher')
  )
);
