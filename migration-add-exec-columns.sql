-- Add color_prices and color_images to exec methods
ALTER TABLE design_exec_methods ADD COLUMN IF NOT EXISTS color_prices JSONB DEFAULT '{}';
ALTER TABLE design_exec_methods ADD COLUMN IF NOT EXISTS color_images JSONB DEFAULT '{}';
