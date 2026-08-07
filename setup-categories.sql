-- 1. جداول
CREATE TABLE IF NOT EXISTS design_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_price NUMERIC DEFAULT 0,
  sample_image TEXT,
  sort_order NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS design_subcategories (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES design_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_price NUMERIC DEFAULT 0,
  sample_image TEXT,
  color_counts NUMERIC[] DEFAULT '{1,2,3,4}',
  color_prices JSONB DEFAULT '{}',
  color_images JSONB DEFAULT '{}',
  sort_order NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS design_exec_methods (
  id TEXT PRIMARY KEY,
  subcategory_id TEXT REFERENCES design_subcategories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sample_image TEXT,
  sort_order NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. دسترسی
ALTER TABLE design_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_exec_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p1 ON design_categories;
CREATE POLICY p1 ON design_categories FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS p2 ON design_subcategories;
CREATE POLICY p2 ON design_subcategories FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS p3 ON design_exec_methods;
CREATE POLICY p3 ON design_exec_methods FOR ALL TO anon USING (true) WITH CHECK (true);

-- 3. داده پیش‌فرض
INSERT INTO design_categories (id,name,base_price,sort_order) VALUES
('flexo','چاپ فلکسو',0,1),
('offset','چاپ افست',0,2),
('digital','چاپ دیجیتال',0,3),
('graphic','طراحی گرافیک',0,4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO design_subcategories (id,category_id,name,base_price,color_counts,sort_order) VALUES
('packaging','flexo','بسته‌بندی',500000,'{1,2,3,4}',1),
('catalog','offset','کاتالوگ',600000,'{1,2,3,4}',1),
('bcard','digital','کارت ویزیت',300000,'{1,2,3,4}',1),
('logo','graphic','لوگو',800000,'{1,2,3,4}',1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO design_exec_methods (id,subcategory_id,name,sort_order) VALUES
('e1','packaging','از روی عکس',1),
('e2','packaging','از روی اتود',2),
('e3','catalog','از روی عکس',1),
('e4','catalog','از روی اتود',2),
('e5','bcard','از روی عکس',1),
('e6','bcard','از روی اتود',2),
('e7','logo','از روی عکس',1),
('e8','logo','از روی اتود',2)
ON CONFLICT (id) DO NOTHING;
