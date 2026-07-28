-- ============================================================
-- Migration: پشتیبانی از ۱ تا ۸ رنگ + قیمت هر رنگ + برچسب
-- این رو در Supabase SQL Editor اجرا کن
-- ============================================================

-- ۱. حذف محدودیت قدیمی (۱ تا ۴ رنگ)
alter table public.category_color_images
  drop constraint if exists category_color_images_color_count_check;

-- ۲. اضافه کردن محدودیت جدید (۱ تا ۸ رنگ)
alter table public.category_color_images
  add constraint category_color_images_color_count_check
  check (color_count between 1 and 8);

-- ۳. اضافه کردن ستون قیمت اضافه برای هر رنگ (روی قیمت پایه دسته اضافه میشه)
alter table public.category_color_images
  add column if not exists extra_price numeric default 0;

-- ۴. اضافه کردن برچسب دلخواه برای هر تعداد رنگ (مثلاً "۳ رنگ" یا "فول‌کالر ویژه")
alter table public.category_color_images
  add column if not exists label text;
