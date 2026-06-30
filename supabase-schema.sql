-- ============================================================
--  NIKA DESIGN — SUPABASE SQL SCHEMA
--  اجرا کنید در: Supabase Dashboard > SQL Editor
-- ============================================================

-- ─── EXTENSIONS ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── USERS ───────────────────────────────────────────────────
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  role        text not null check (role in ('admin','designer','printer')) default 'designer',
  name        text,
  phone       text not null,
  address     text,
  avatar      text,
  resume      text,
  is_active   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── CATEGORIES ──────────────────────────────────────────────
create table if not exists public.categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  parent_id   uuid references public.categories(id) on delete set null,
  base_price  numeric default 0,
  image_url   text,
  created_at  timestamptz default now()
);

-- ─── PORTFOLIO CATEGORIES (لوگو، پوستر، بسته‌بندی، ...) ────────
create table if not exists public.portfolio_categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  order_index integer default 99,
  created_at  timestamptz default now()
);

-- ─── PORTFOLIO ITEMS (نمونه‌کارهای طراحان، حداکثر ۲۰ به ازای هر طراح) ──
create table if not exists public.portfolio_items (
  id            uuid primary key default uuid_generate_v4(),
  designer_id   uuid not null references public.users(id) on delete cascade,
  category_id   uuid references public.portfolio_categories(id) on delete set null,
  title         text,
  description   text,
  image_url     text not null,
  order_index   integer default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── CATEGORY COLOR IMAGES (عکس نمونه به ازای دسته اصلی + تعداد رنگ) ──
-- مثال: کارتن مادر + ۱ رنگ → عکس A , کارتن مادر + ۲ رنگ → عکس B
create table if not exists public.category_color_images (
  id            uuid primary key default uuid_generate_v4(),
  category_id   uuid not null references public.categories(id) on delete cascade,
  color_count   integer not null check (color_count between 1 and 4),
  image_url     text not null,
  created_at    timestamptz default now(),
  unique (category_id, color_count)
);

-- ─── DESIGNS ─────────────────────────────────────────────────
create table if not exists public.designs (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  category      text,
  price         numeric not null default 0,
  description   text,
  tags          text[],
  designer_id   uuid references public.users(id) on delete set null,
  designer_name text,
  status        text not null check (status in ('pending','approved','rejected')) default 'pending',
  thumbnail_url text,
  file_url      text,
  sales_count   integer default 0,
  avg_rating    numeric default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── ORDERS ──────────────────────────────────────────────────
create table if not exists public.orders (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references public.users(id) on delete set null,
  guest_email     text,
  guest_name      text,
  is_guest        boolean default false,
  user_name       text,
  user_phone      text not null,
  user_address    text,
  items           jsonb not null default '[]',
  total_amount    numeric not null default 0,
  discount_amount numeric default 0,
  final_amount    numeric not null default 0,
  -- وضعیت سفارش: در انتظار بررسی ادمین → تماس گرفته‌شده → در حال انجام → ارسال شده → تحویل شده / لغو شده
  status          text not null check (status in ('pending_review','contacted','processing','shipped','delivered','cancelled')) default 'pending_review',
  -- پلتفرم پیام‌رسانی که ادمین برای تماس با مشتری انتخاب کرده (بعد از تأیید)
  contact_platform text check (contact_platform in ('telegram','bale','rubika')),
  contact_note     text,
  tracking_code   text unique,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── COMMENTS ────────────────────────────────────────────────
create table if not exists public.comments (
  id          uuid primary key default uuid_generate_v4(),
  design_id   uuid references public.designs(id) on delete cascade,
  user_id     uuid references public.users(id) on delete set null,
  guest_name  text,
  user_name   text,
  rating      integer check (rating >= 1 and rating <= 5),
  text        text not null,
  is_guest    boolean default false,
  created_at  timestamptz default now()
);

-- ─── WISHLIST ────────────────────────────────────────────────
create table if not exists public.wishlist (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references public.users(id) on delete cascade,
  guest_session_id text,
  design_id        uuid references public.designs(id) on delete cascade,
  is_guest         boolean default false,
  created_at       timestamptz default now(),
  unique (user_id, design_id)
);

-- ─── MENU ────────────────────────────────────────────────────
create table if not exists public.menu (
  id          uuid primary key default uuid_generate_v4(),
  label_fa    text not null,
  label_en    text,
  label       text,
  page        text not null,
  order_index integer default 99,
  created_at  timestamptz default now()
);

-- ─── SETTINGS ────────────────────────────────────────────────
create table if not exists public.settings (
  id         uuid primary key default uuid_generate_v4(),
  key        text unique not null,
  value      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  type       text,
  title      text,
  message    text,
  order_id   uuid,
  is_read    boolean default false,
  created_at timestamptz default now()
);

-- ─── TICKETS ─────────────────────────────────────────────────
create table if not exists public.tickets (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.users(id) on delete set null,
  guest_email text,
  name        text not null,
  email       text not null,
  subject     text not null,
  message     text not null,
  reply       text,
  status      text check (status in ('open','closed')) default 'open',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── BLOG ────────────────────────────────────────────────────
create table if not exists public.blog (
  id         uuid primary key default uuid_generate_v4(),
  title      text not null,
  content    text,
  excerpt    text,
  author_id  uuid references public.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── FAQ ─────────────────────────────────────────────────────
create table if not exists public.faq (
  id          uuid primary key default uuid_generate_v4(),
  question    text not null,
  answer      text not null,
  order_index integer default 99,
  created_at  timestamptz default now()
);

-- ─── LEGAL ───────────────────────────────────────────────────
create table if not exists public.legal (
  id         uuid primary key default uuid_generate_v4(),
  type       text unique not null,
  content_fa text,
  content_en text,
  updated_at timestamptz default now()
);

-- ============================================================
--  RLS (Row Level Security) POLICIES
-- ============================================================

-- Enable RLS on all tables
alter table public.users         enable row level security;
alter table public.designs       enable row level security;
alter table public.orders        enable row level security;
alter table public.comments      enable row level security;
alter table public.wishlist      enable row level security;
alter table public.categories    enable row level security;
alter table public.menu          enable row level security;
alter table public.settings      enable row level security;
alter table public.notifications enable row level security;
alter table public.tickets       enable row level security;
alter table public.blog          enable row level security;
alter table public.faq           enable row level security;
alter table public.legal         enable row level security;
alter table public.portfolio_categories     enable row level security;
alter table public.portfolio_items          enable row level security;
alter table public.category_color_images    enable row level security;

-- ─── Helper: is admin ────────────────────────────────────────
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_designer()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'designer'
  );
$$;

-- ─── USERS policies ──────────────────────────────────────────
create policy "Users: public read"
  on public.users for select using (true);

create policy "Users: own update"
  on public.users for update
  using (auth.uid() = id);

create policy "Users: insert own"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users: admin delete"
  on public.users for delete
  using (public.is_admin());

-- ─── DESIGNS policies ────────────────────────────────────────
create policy "Designs: public read approved"
  on public.designs for select
  using (status = 'approved' or auth.uid() = designer_id or public.is_admin());

create policy "Designs: designer insert"
  on public.designs for insert
  with check (auth.uid() = designer_id and public.is_designer() or public.is_admin());

create policy "Designs: designer/admin update"
  on public.designs for update
  using (auth.uid() = designer_id or public.is_admin());

create policy "Designs: admin delete"
  on public.designs for delete
  using (auth.uid() = designer_id or public.is_admin());

-- ─── ORDERS policies ─────────────────────────────────────────
create policy "Orders: anyone insert"
  on public.orders for insert
  with check (true);

create policy "Orders: own read or admin"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin() or user_id is null);

create policy "Orders: admin update"
  on public.orders for update
  using (public.is_admin());

create policy "Orders: admin delete"
  on public.orders for delete
  using (public.is_admin());

-- ─── COMMENTS policies ───────────────────────────────────────
create policy "Comments: public read"
  on public.comments for select using (true);

create policy "Comments: anyone insert"
  on public.comments for insert with check (true);

create policy "Comments: admin delete"
  on public.comments for delete using (public.is_admin());

-- ─── WISHLIST policies ───────────────────────────────────────
create policy "Wishlist: own read"
  on public.wishlist for select
  using (auth.uid() = user_id or user_id is null);

create policy "Wishlist: anyone insert"
  on public.wishlist for insert with check (true);

create policy "Wishlist: own delete"
  on public.wishlist for delete
  using (auth.uid() = user_id or user_id is null or public.is_admin());

-- ─── CATEGORIES policies ─────────────────────────────────────
create policy "Categories: public read"
  on public.categories for select using (true);

create policy "Categories: admin write"
  on public.categories for all using (public.is_admin());

-- ─── MENU policies ───────────────────────────────────────────
create policy "Menu: public read"
  on public.menu for select using (true);

create policy "Menu: admin write"
  on public.menu for all using (public.is_admin());

-- ─── SETTINGS policies ───────────────────────────────────────
create policy "Settings: public read"
  on public.settings for select using (true);

create policy "Settings: admin write"
  on public.settings for all using (public.is_admin());

-- ─── NOTIFICATIONS policies ──────────────────────────────────
create policy "Notifications: admin read"
  on public.notifications for select using (public.is_admin());

create policy "Notifications: system insert"
  on public.notifications for insert with check (true);

create policy "Notifications: admin update"
  on public.notifications for update using (public.is_admin());

-- ─── TICKETS policies ────────────────────────────────────────
create policy "Tickets: own read or admin"
  on public.tickets for select
  using (auth.uid() = user_id or public.is_admin() or user_id is null);

create policy "Tickets: anyone insert"
  on public.tickets for insert with check (true);

create policy "Tickets: admin update"
  on public.tickets for update using (public.is_admin());

-- ─── BLOG policies ───────────────────────────────────────────
create policy "Blog: public read"
  on public.blog for select using (true);

create policy "Blog: admin write"
  on public.blog for all using (public.is_admin());

-- ─── FAQ policies ────────────────────────────────────────────
create policy "FAQ: public read"
  on public.faq for select using (true);

create policy "FAQ: admin write"
  on public.faq for all using (public.is_admin());

-- ─── LEGAL policies ──────────────────────────────────────────
create policy "Legal: public read"
  on public.legal for select using (true);

create policy "Legal: admin write"
  on public.legal for all using (public.is_admin());

-- ─── PORTFOLIO CATEGORIES policies ───────────────────────────
create policy "PortfolioCategories: public read"
  on public.portfolio_categories for select using (true);

create policy "PortfolioCategories: admin write"
  on public.portfolio_categories for all using (public.is_admin());

-- ─── PORTFOLIO ITEMS policies ────────────────────────────────
-- همه (از جمله مهمان) می‌توانند پورتفولیوی همه طراحان را ببینند
create policy "Portfolio: public read"
  on public.portfolio_items for select using (true);

-- طراح فقط برای خودش، یا ادمین برای هر طراحی می‌تواند آیتم اضافه کند
create policy "Portfolio: owner or admin insert"
  on public.portfolio_items for insert
  with check (auth.uid() = designer_id or public.is_admin());

create policy "Portfolio: owner or admin update"
  on public.portfolio_items for update
  using (auth.uid() = designer_id or public.is_admin());

create policy "Portfolio: owner or admin delete"
  on public.portfolio_items for delete
  using (auth.uid() = designer_id or public.is_admin());

-- ─── CATEGORY COLOR IMAGES policies ──────────────────────────
create policy "CategoryColorImages: public read"
  on public.category_color_images for select using (true);

create policy "CategoryColorImages: admin write"
  on public.category_color_images for all using (public.is_admin());

-- ============================================================
--  SEED DATA (نمونه داده)
-- ============================================================

-- Default settings
insert into public.settings (key, value) values
  ('theme',            'dark'),
  ('hero_title_fa',    'پلتفرم تخصصی طراحی و چاپ ایران'),
  ('hero_title_en',    'Iran''s Professional Design & Print Platform'),
  ('hero_subtitle_fa', 'طرح‌های حرفه‌ای، چاپ باکیفیت، تحویل سریع'),
  ('hero_subtitle_en', 'Professional designs, quality printing, fast delivery'),
  ('footer_text_fa',   'پلتفرم تخصصی طراحی و چاپ'),
  ('footer_text_en',   'Professional Design & Print Platform')
on conflict (key) do nothing;

-- Default categories
insert into public.categories (name, base_price) values
  ('چاپ دیجیتال',    500000),
  ('چاپ افست',       800000),
  ('چاپ سیلک',       600000),
  ('طراحی لوگو',     1500000),
  ('طراحی بسته‌بندی', 2000000),
  ('طراحی کارت ویزیت', 300000)
on conflict do nothing;

-- Default portfolio categories (دسته‌بندی نمونه‌کارهای طراحان)
insert into public.portfolio_categories (name, order_index) values
  ('لوگو',        1),
  ('پوستر',       2),
  ('بسته‌بندی',    3),
  ('کارت ویزیت',  4),
  ('سوشال مدیا',  5),
  ('چاپ',         6),
  ('سایر',        99)
on conflict do nothing;

-- Default FAQ
insert into public.faq (question, answer, order_index) values
  ('چگونه می‌توانم طرح آپلود کنم؟', 'پس از ثبت‌نام به عنوان طراح، از منوی بازارچه روی "آپلود طرح" کلیک کنید.', 1),
  ('آیا کاربر مهمان می‌تواند خرید کند؟', 'بله، کاربر مهمان می‌تواند بدون ثبت‌نام خرید کند.', 2),
  ('حداکثر حجم فایل آپلودی چقدر است؟', 'برای فایل‌های طرح حداکثر ۲۰ مگابایت و برای تصویر پیش‌نمایش ۵ مگابایت.', 3),
  ('چگونه سفارشم را پیگیری کنم؟', 'از منوی "پیگیری سفارش" کد پیگیری دریافتی را وارد کنید.', 4)
on conflict do nothing;

-- Default legal
insert into public.legal (type, content_fa, content_en) values
  ('terms',
   '<h2>شرایط استفاده</h2><p>استفاده از خدمات نیکا دیزاین به منزله پذیرش تمام شرایط و قوانین این پلتفرم است. نیکا دیزاین حق دارد در هر زمان شرایط استفاده را تغییر دهد.</p>',
   '<h2>Terms of Use</h2><p>Using Nika Design services means accepting all terms and conditions. Nika Design reserves the right to change terms at any time.</p>'),
  ('privacy',
   '<h2>حریم خصوصی</h2><p>نیکا دیزاین متعهد است اطلاعات شخصی کاربران را محرمانه نگه دارد و بدون اجازه کاربر در اختیار اشخاص ثالث قرار ندهد.</p>',
   '<h2>Privacy Policy</h2><p>Nika Design is committed to keeping users personal information confidential and will not share it with third parties without permission.</p>'),
  ('return',
   '<h2>قوانین بازگشت</h2><p>در صورت عدم رضایت از محصول دیجیتال، ظرف ۴۸ ساعت امکان بازگشت وجود دارد. محصولات فیزیکی تا ۷ روز قابل بازگشت هستند.</p>',
   '<h2>Return Policy</h2><p>For digital products, returns are possible within 48 hours. Physical products can be returned within 7 days.</p>')
on conflict (type) do nothing;

-- ============================================================
--  GRANTS (لازم برای دسترسی anon/authenticated به API)
--  بدون این خطوط، درخواست‌های REST API با خطای 404 مواجه می‌شوند
-- ============================================================
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;

alter function public.is_admin() security definer set search_path = public;
alter function public.is_designer() security definer set search_path = public;

-- ============================================================
--  STORAGE BUCKETS (اجرا از Storage Settings در Supabase)
-- ============================================================
-- در Supabase Dashboard > Storage، این باکت‌ها را بسازید:
--   logos    (public: true)
--   banners  (public: true)
--   themes   (public: true)
--   designs  (public: true)
--   avatars  (public: true)

-- Storage Policies (در SQL Editor اجرا کنید):

-- LOGOS bucket
insert into storage.buckets (id, name, public) values ('logos', 'logos', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('banners', 'banners', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('themes', 'themes', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('designs', 'designs', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('category-samples', 'category-samples', true) on conflict do nothing;

-- Storage: public read for all buckets
create policy "Storage logos: public read"
  on storage.objects for select using (bucket_id = 'logos');

create policy "Storage banners: public read"
  on storage.objects for select using (bucket_id = 'banners');

create policy "Storage themes: public read"
  on storage.objects for select using (bucket_id = 'themes');

create policy "Storage designs: public read"
  on storage.objects for select using (bucket_id = 'designs');

create policy "Storage avatars: public read"
  on storage.objects for select using (bucket_id = 'avatars');

-- Storage: admin-only write for logos, banners, themes
create policy "Storage logos: admin write"
  on storage.objects for insert
  with check (bucket_id = 'logos' and public.is_admin());

create policy "Storage banners: admin write"
  on storage.objects for insert
  with check (bucket_id = 'banners' and public.is_admin());

create policy "Storage themes: admin write"
  on storage.objects for insert
  with check (bucket_id = 'themes' and public.is_admin());

-- Storage: authenticated users can write avatars
create policy "Storage avatars: auth write"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- Storage: designers can upload designs (max 20MB enforced in JS)
create policy "Storage designs: designer write"
  on storage.objects for insert
  with check (
    bucket_id = 'designs'
    and auth.role() = 'authenticated'
    and (public.is_designer() or public.is_admin())
  );

-- Storage: owners can delete their own files
create policy "Storage designs: owner delete"
  on storage.objects for delete
  using (bucket_id = 'designs' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin()));

-- PORTFOLIO bucket: public read
create policy "Storage portfolio: public read"
  on storage.objects for select using (bucket_id = 'portfolio');

-- PORTFOLIO bucket: designer can upload to their own folder, or admin to any
create policy "Storage portfolio: owner or admin write"
  on storage.objects for insert
  with check (
    bucket_id = 'portfolio'
    and auth.role() = 'authenticated'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

create policy "Storage portfolio: owner or admin delete"
  on storage.objects for delete
  using (
    bucket_id = 'portfolio'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

-- CATEGORY-SAMPLES bucket: public read, admin-only write
create policy "Storage category-samples: public read"
  on storage.objects for select using (bucket_id = 'category-samples');

create policy "Storage category-samples: admin write"
  on storage.objects for insert
  with check (bucket_id = 'category-samples' and public.is_admin());

create policy "Storage category-samples: admin delete"
  on storage.objects for delete
  using (bucket_id = 'category-samples' and public.is_admin());

-- ============================================================
--  REALTIME (فعال‌سازی Realtime برای جداول)
-- ============================================================
-- در Supabase Dashboard > Database > Replication:
-- این جداول را فعال کنید:
--   orders, notifications, tickets

-- یا از SQL:
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.tickets;

-- ============================================================
--  ADMIN USER SETUP
-- ============================================================
-- بعد از اینکه با ایمیل nikadesigningco@gmail.com در Auth ثبت‌نام کردید:
-- این کوئری را اجرا کنید (uuid را با auth.uid ادمین جایگزین کنید):

-- insert into public.users (id, email, role, name, is_active) values
--   ('YOUR-ADMIN-UUID-HERE', 'nikadesigningco@gmail.com', 'admin', 'ادمین نیکا', true)
-- on conflict (id) do update set role = 'admin';
