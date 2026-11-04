-- Public invitation images are readable without authentication; only admins can upload or delete.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-media',
  'event-media',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admins can upload event media" ON storage.objects;
CREATE POLICY "Admins can upload event media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'event-media'
  AND EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can delete event media" ON storage.objects;
CREATE POLICY "Admins can delete event media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'event-media'
  AND EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE user_id = auth.uid()
  )
);
