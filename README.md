# 🎨 نیکا دیزاین — راهنمای نصب و راه‌اندازی

## ساختار فایل‌ها

```
nika/
├── index.html              ← صفحه اصلی (HTML)
├── supabase-schema.sql     ← اسکیمای دیتابیس
├── css/
│   └── styles.css          ← استایل‌ها + ۳ تم آماده
└── js/
    ├── config.js           ← تنظیمات Supabase + دیکشنری زبان
    ├── auth.js             ← احراز هویت + پروفایل + پشتیبانی + پیگیری
    ├── cart.js             ← سبد خرید + پرداخت + ثبت سفارش
    ├── marketplace.js      ← بازارچه + آپلود طرح + نظرات + علاقه‌مندی
    ├── dashboard.js        ← داشبورد طراح و چاپخانه
    ├── admin.js            ← پنل ادمین (۱۱ بخش)
    └── app.js              ← راه‌اندازی اصلی + صفحه خانه + وبلاگ + FAQ
```

---

## 🚀 مراحل نصب

### ۱. ساخت پروژه Supabase

1. به [supabase.com](https://supabase.com) بروید
2. حساب کاربری بسازید و **New Project** بزنید
3. نام پروژه و رمز دیتابیس را وارد کنید
4. منطقه را **Europe (Frankfurt)** انتخاب کنید (نزدیک‌ترین به ایران)

---

### ۲. فعال‌سازی Authentication

در Supabase Dashboard:
1. **Authentication** > **Providers** بروید
2. **Email** را فعال کنید
3. **Confirm email** را غیرفعال کنید (برای تست سریع‌تر)

---

### ۳. اجرای اسکیمای دیتابیس

1. در Supabase Dashboard به **SQL Editor** بروید
2. محتوای فایل `supabase-schema.sql` را کپی و **Run** بزنید
3. پیام موفقیت باید نمایش داده شود

---

### ۴. پیکربندی Storage (اگر SQL بالا کافی نبود)

در **Storage** > **Buckets** دستی بسازید:
- `logos` (Public: ✅)
- `banners` (Public: ✅)
- `themes` (Public: ✅)
- `designs` (Public: ✅)
- `avatars` (Public: ✅)

---

### ۵. ساخت کاربر ادمین

**روش اول (توصیه شده):**
1. در Supabase > **Authentication** > **Users** > **Add User**
2. ایمیل: `nikadesigningco@gmail.com`
3. رمز: `Shahab.jumper1989`
4. **Create User** بزنید
5. UUID ساخته شده را کپی کنید
6. در SQL Editor اجرا کنید:
```sql
insert into public.users (id, email, role, name, is_active)
values ('UUID-اینجا-بگذارید', 'nikadesigningco@gmail.com', 'admin', 'ادمین نیکا', true)
on conflict (id) do update set role = 'admin';
```

**روش دوم:**
وارد سایت شوید با ایمیل/رمز ادمین، سپس در SQL Editor:
```sql
update public.users set role = 'admin' where email = 'nikadesigningco@gmail.com';
```

---

### ۶. تنظیم کلیدهای Supabase در کد

فایل `js/config.js` را باز کنید:

```javascript
const SUPABASE_URL  = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON = 'YOUR_ANON_KEY';
```

کلیدها را از:
**Supabase Dashboard** > **Settings** > **API** بگیرید:
- `Project URL` → جایگزین `SUPABASE_URL` کنید
- `anon public` → جایگزین `SUPABASE_ANON` کنید

---

### ۷. فعال‌سازی Realtime

در Supabase Dashboard > **Database** > **Replication**:
- جدول `orders` را فعال کنید
- جدول `notifications` را فعال کنید
- جدول `tickets` را فعال کنید

---

### ۸. Deploy سایت

**گزینه A — GitHub Pages (رایگان):**
1. یک repository جدید در GitHub بسازید
2. تمام فایل‌ها را آپلود کنید
3. **Settings** > **Pages** > **Branch: main** را فعال کنید

**گزینه B — Vercel (رایگان):**
1. به [vercel.com](https://vercel.com) بروید
2. **New Project** > **Import Git Repository**
3. خودکار deploy می‌شود

**گزینه C — Netlify (رایگان):**
1. پوشه `nika` را به [app.netlify.com](https://app.netlify.com) drag & drop کنید

---

## 🎭 نقش‌های کاربری

| نقش | دسترسی |
|-----|---------|
| **ادمین** | دسترسی کامل + پنل مدیریت |
| **طراح** | آپلود طرح + داشبورد طراح + خرید |
| **چاپخانه** | داشبورد چاپخانه + سفارش + خرید |
| **مهمان** | همه امکانات به جز آپلود فایل |

---

## 🎨 تم‌های آماده

| تم | توضیح |
|----|-------|
| `dark` | تیره — مشکی و نارنجی (پیش‌فرض) |
| `light` | روشن — سفید و نارنجی |
| `orange` | نارنجی-مشکی — اختصاصی |
| `custom` | فایل CSS سفارشی (آپلود توسط ادمین) |

---

## 🔧 ویژگی‌های فنی

- ✅ Supabase Auth (Email/Password)
- ✅ Row Level Security (RLS) کامل
- ✅ Supabase Storage (۵ باکت)
- ✅ Realtime listeners (سفارش، نوتیفیکیشن)
- ✅ دو زبانه فارسی/انگلیسی (RTL/LTR)
- ✅ ۳ تم آماده + تم سفارشی CSS
- ✅ خروج خودکار بعد از ۳۰ دقیقه
- ✅ Lazy loading تصاویر
- ✅ Responsive کامل (موبایل، تبلت، دسکتاپ)
- ✅ اعداد فارسی در حالت FA
- ✅ تاریخ شمسی در حالت FA
- ✅ پیگیری سفارش با کد پیگیری
- ✅ رسید خرید با قابلیت چاپ
- ✅ Glassmorphism design

---

## 📞 اطلاعات تماس

- **ایمیل:** nikadesigningco@gmail.com
- **تلفن:** ۰۹۳۵۱۷۶۰۰۵۴
- **آدرس:** تهران، شهرک اکباتان

---

## ⚠️ نکات مهم

1. **قبل از هر چیز** کلیدهای Supabase را در `config.js` تنظیم کنید
2. اسکیمای SQL را **یک بار** اجرا کنید
3. ادمین را **دستی** در دیتابیس با `role='admin'` تنظیم کنید
4. Storage buckets باید **Public** باشند
5. برای محیط Production، **Confirm email** را فعال کنید
