-- Fix stock_images RLS — Run this in Supabase SQL Editor once
-- After this, the cron job will be able to insert images

-- Step 1: Disable RLS (allow all inserts from service_role)
ALTER TABLE stock_images DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify RLS is off
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'stock_images';

-- Step 3: Test insert (you can run this as a test)
-- INSERT INTO stock_images (source, source_url, title, price, is_approved, is_free)
-- VALUES ('test', 'https://example.com', 'Test Image', 100000, true, true);
