-- ============================================================
--  MIGRATION: تغییر فرآیند سفارش به «درخواست + تماس دستی ادمین»
--  نسخه نهایی و کامل — این کل اسکریپت رو یکجا اجرا کن
-- ============================================================

-- ۱. اول محدودیت قدیمی رو کاملاً حذف می‌کنیم (بدون اینکه چک کنیم چی توشه)
alter table public.orders drop constraint if exists orders_status_check;

-- ۲. حالا که محدودیتی نیست، همه مقادیر را آزادانه نرمال‌سازی می‌کنیم
update public.orders set status = 'pending_review'
  where status is null
     or status not in ('pending_review','contacted','processing','shipped','delivered','cancelled');

-- ۳. حالا محدودیت جدید را اضافه می‌کنیم (دیگر هیچ سطری نباید تداخل داشته باشد)
alter table public.orders add constraint orders_status_check
  check (status in ('pending_review','contacted','processing','shipped','delivered','cancelled'));

alter table public.orders alter column status set default 'pending_review';

-- ۴. افزودن ستون‌های جدید برای پلتفرم تماس
alter table public.orders add column if not exists contact_platform text;
alter table public.orders add column if not exists contact_note text;

alter table public.orders drop constraint if exists orders_contact_platform_check;
alter table public.orders add constraint orders_contact_platform_check
  check (contact_platform is null or contact_platform in ('telegram','bale','rubika'));

-- ۵. حذف ستون‌های مربوط به پرداخت آنلاین (اگر وجود داشته باشند)
alter table public.orders drop column if exists payment_method;
alter table public.orders drop column if exists payment_status;

-- ۶. اجباری‌کردن شماره تلفن کاربران (طراح/چاپخانه)
update public.users set phone = 'نامشخص' where phone is null or phone = '';
alter table public.users alter column phone set not null;

-- ۷. اجباری‌کردن شماره تلفن در سفارش‌ها
update public.orders set user_phone = 'نامشخص' where user_phone is null or user_phone = '';
alter table public.orders alter column user_phone set not null;

-- پایان migration ✅
