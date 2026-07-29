-- ============================================================
-- Migration: اضافه کردن ستون‌های گمشده به blog و categories
-- این رو در Supabase SQL Editor اجرا کن
-- ============================================================

-- ۱. اضافه کردن ستون image_url به جدول blog
alter table public.blog
  add column if not exists image_url text;

-- ۲. اضافه کردن ستون source_url به جدول blog
alter table public.blog
  add column if not exists source_url text;

-- ۳. اضافه کردن ستون description به جدول categories
alter table public.categories
  add column if not exists description text;
