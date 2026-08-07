-- Create storage bucket for design sample images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('design-samples', 'design-samples', true, 5242880, '{image/png,image/jpeg,image/webp,image/gif}')
ON CONFLICT (id) DO NOTHING;

-- Allow anon to upload
DROP POLICY IF EXISTS "Allow anon upload design samples" ON storage.objects;
CREATE POLICY "Allow anon upload design samples" ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'design-samples');

-- Allow public read
DROP POLICY IF EXISTS "Allow public read design samples" ON storage.objects;
CREATE POLICY "Allow public read design samples" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'design-samples');
