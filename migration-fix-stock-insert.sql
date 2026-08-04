DROP POLICY IF EXISTS "Allow anon insert stock_images" ON stock_images;

CREATE POLICY "Allow anon insert stock_images" ON stock_images
  FOR INSERT
  TO anon
  WITH CHECK (true);
