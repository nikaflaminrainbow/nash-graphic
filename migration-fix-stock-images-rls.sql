-- Fix RLS for stock_images table
-- Run this in Supabase SQL Editor

-- Disable RLS (simplest fix - allows cron job to insert)
alter table stock_images disable row level security;

-- Verify it worked
select tablename, rowsecurity from pg_tables where tablename = 'stock_images';
