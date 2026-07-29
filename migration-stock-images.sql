-- Stock Images table for designer dashboard
CREATE TABLE IF NOT EXISTS stock_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source VARCHAR(50) NOT NULL, -- 'freepik' or 'vecteezy'
  source_url TEXT NOT NULL,
  title VARCHAR(500),
  preview_url TEXT, -- watermarked preview URL (stored in Supabase Storage)
  download_url TEXT, -- original high-quality URL
  thumbnail_url TEXT, -- smaller thumbnail
  price INTEGER DEFAULT 100000,
  category VARCHAR(100), -- e.g., 'background', 'vector', 'icon', 'texture'
  tags TEXT[] DEFAULT '{}',
  is_free BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false, -- admin approval for paid images
  views INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stock_images_source ON stock_images(source);
CREATE INDEX IF NOT EXISTS idx_stock_images_category ON stock_images(category);
CREATE INDEX IF NOT EXISTS idx_stock_images_price ON stock_images(price);
CREATE INDEX IF NOT EXISTS idx_stock_images_approved ON stock_images(is_approved);
CREATE INDEX IF NOT EXISTS idx_stock_images_created ON stock_images(created_at DESC);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_stock_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_stock_images ON stock_images;
CREATE TRIGGER trg_update_stock_images
  BEFORE UPDATE ON stock_images
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_images_updated_at();

-- Allow authenticated users to read approved images
ALTER TABLE stock_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS stock_images_select ON stock_images
  FOR SELECT USING (is_approved = true);

CREATE POLICY IF NOT EXISTS stock_images_admin_select ON stock_images
  FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS stock_images_admin_insert ON stock_images
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY IF NOT EXISTS stock_images_admin_update ON stock_images
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS stock_images_admin_delete ON stock_images
  FOR DELETE TO authenticated USING (true);
