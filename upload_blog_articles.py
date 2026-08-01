#!/usr/bin/env python3
"""Upload 6 design articles to Nash Graphic blog in Farsi."""
import json, re, os, urllib.request, urllib.parse, urllib.error, datetime

# ── Supabase config ──
with open('js/config.js', encoding='utf-8') as f:
    config = f.read()
SB_URL  = re.search(r"SUPABASE_URL\s*=\s*'([^']*)'",  config).group(1)
SB_KEY  = re.search(r"SUPABASE_ANON\s*=\s*'([^']*)'", config).group(1)
AUTH_HDR = {'apikey': SB_KEY, 'Authorization': f'Bearer {SB_KEY}', 'Content-Type': 'application/json'}

# ── Article data: translated to natural, professional Farsi ──
articles = [
    {
        'title_fa': 'پوستر ورولافتگر رابرت ایگرز نیازی به اصلاح ندارد',
        'source_url': 'https://www.creativebloq.com/design/poster-design/no-robert-eggers-werwulf-poster-doesnt-need-fixing',
        'image_url': 'https://cdn.mos.cms.futurecdn.net/EbofLfMGEoCauZFMoM5c2T-1920-80.jpg',
        'tags': ['طراحی پوستر', 'گرافیک', 'ریاضیات طراحی', 'سمتري', 'هولرور', 'فیلم‌سازی', 'تایپوگرافی'],
        'excerpt_fa': 'پوستر فیلم «ورولافتگر» رابرت ایگرز از بهترین پوسترهای سینمای ترسناک سال است. یک نکته ظریف ترکیب‌بندی می‌تواند پوستر را ناگهان به شکلی نمادین تبدیل کند.',
        'content_fa': '''در دنیای طراحی پوستر سینمایی، بهترین آثار اغلب اولین نگرش به سادگی و توازن نگاه می‌کنند. اما زمانی که طراحی شتاب‌زده و بدون هدف تقدیم می‌شود، پوستر با وجود زیبایی بصری، فاقد عمق محتوایی می‌ماند. پوستر «ورولافتگر» رابرت ایگرز نمونه‌ای از این نقطه مقابل است. پوستری سیاه‌وسفید که گل گل‌های سراسر پرده را با یک تصویر شبه‌واقعی و دراماتیک از یک موجود افسانه‌ای ترکیب کرده است. استفاده از فونت خوشنویسی دستی برای عنوان اصلی، حس ناخوفتانی ایجاد می‌کند که با ظهور کامل ماه بدرقه در کنار فرم آسیب‌دیده قهرمان، هماهنگ می‌شود. ترکیب‌بندی غیرمتمایز قسمت‌های مختلف پوستر، توجه بیننده را به طبقات مختلف بصری هدایت می‌کند و سفری را به پشت پرده‌ای از گلدان‌های سرخ و تیره آغاز می‌کند که موجودات جادویی را در آن پناه می‌گیرند. این پوستر نشان می‌دهد که چگونه یک طراح می‌تواند با حفظ سادگی و وضوح بصری، فضای ترسناک و مرموزی خلق کند. نش گرافیک | طراحی پوستر گرافیک و سینمای ترسناک'''
    },
    {
        'title_fa': 'نقل‌قول روز صائد باس: «طراحی، افکار را تصویری می‌کند»',
        'source_url': 'https://www.creativebloq.com/design/graphic-design/quote-of-the-day-by-saul-bass-design-is-thinking-made-visual',
        'image_url': 'https://cdn.mos.cms.futurecdn.net/KQwqLQf4rB4UM4pajcgKXP-1600-80.jpg',
        'tags': ['گرافیک', 'طراحی', 'تایپوگرافی', 'هویت بصری', 'سادگی در طراحی', 'لوگو', 'برندینگ'],
        'excerpt_fa': 'صائد باس، پدر الهیات طراحی گرافیک سینمای قرن بیستم، نشان داد که خوب طراحی یعنی دانستن چه چیزی می‌خواهید بگویید و پیدا کردن ساده‌ترین راه برای بیان آن.',
        'content_fa': '''«طراحی، افکار را تصویری می‌کند» یکی از معروف‌ترین جمله‌های تاریخ طراحی گرافیک است که صائد باس، طراح و تایپوگراف‌ساز آمریکایی، ابداز آن کرده است. باس در کار خود نشان داد که طراحی یک افسانه یا تزئین نیست؛ بلکه ابزاری برای تحویل دادن افکار پیچیده به شکل ساده و قابل فهم است. از تیتراژهای افتتاحیه فیلم‌های آلفرد هیچکاک و استنلی کوبریک تا لوگوهای شرکت‌هایی مانند AT&T و یونایتد ایرلاینز، کار باس همیشه با هدف واضح و مسیر شناختنی همراه بوده است. موفقیت باس در ساخت هویت‌های بصری ماندگار نشان می‌دهد که نیازی به جزئیات اضافی و چرخ‌وفلک‌های بصری پیچیده نیست; کافی است هر خط، شکل و رنگ، هدف واضحی داشته باشد. در دنیای امروز که برندها در تلاش برای جلب توجه مخاطبان هستند و هوش مصنوعی می‌تواند یک ایده را با افکت‌های کلی‌شان پیچیده کند، رویکرد باس بیش از همیشه مرتبط است. طراحی خوب، پراکندگی اثر نیست؛ بلکه تمرکز بر محتوای اصلی و بیان شناخت‌پذیر آن است. صائد باس ثابت کرد که طراحی گرافیک می‌تواند هم قدرتمند و هم ساده باشد — و این دوگانگی، چیزی است که هر طراح حرفه‌ای باید در کار خود به آن دامن بزند. نش گرافیک | فلسفه طراحی و تاریخ گرافیک'''
    },
    {
        'title_fa': 'دن آرتیز لیزمن: صندلی‌های پلاستیکی را به ساز تبدیل کرد',
        'source_url': 'https://www.designboom.com/art/dan-ortiz-leizman-strings-monobloc-chair-playable-instrument-interview/',
        'image_url': 'https://www.designboom.com/twitterimages/uploads/2026/07/dan-ortiz-leizman-strings-monobloc-chair-playable-instrument-interview-designboom-1200.jpg',
        'tags': ['طراحی شیء', 'معماری', 'هنر مدرن', 'مش', 'سازسازی', 'طراحی جامعه‌محور', 'هنر تعاملی'],
        'excerpt_fa': 'پروژه «هارپ‌های مونوبلاک» صندلی‌های رایج پلاستیکی شهری را به سازهای قابل نواختن تبدیل می‌کند و نگرش مردم را به یک ابزار روزمره بازتعریف می‌کند.',
        'content_fa': '''صندلی مونوبلاک، یکی از دست‌آوردهای طراحی صنعتی که در هر قاره و فرهنگ پیدا می‌شود، نه به خاطر طراح‌شناخته شده، بلکه به دلیل فراموش‌نشدنی در زندگی روزمره. اما برای هنرمند و پرورش‌دهنده دن آرتیز لیزمن، آشنایی عمیق این صندلی با زندگی انسان، نقطه شروع یک پروژه هنری برجسته بود. در پروژه «هارپ‌های مونوبلاک»، آرتیز لیزمن صندلی‌های پلاستیکی دست‌کاری‌نشده را برداشته و به سازهای زهی قابل‌نواختن تبدیل کرده است. صندلی هنوز صندلی می‌ماند، اما افزودن زنگ‌ها به بازدیدکنندگان دعوت می‌کند که متوقف شوند، لمس کنند و گوش بدهند. این پروژه در طی اقامت هنری در یک مرکز آزمایشی صوتی در شهرهای مین به وجود آمد، جایی که صندلی‌های سفید رایج پس از مورد بررسی، مفهوم متفاوتی از «شنیدن» را به زندگی بخشیدند. آرتیز لیزمن در گفتگوی طولانی با دیزاین بوم توضیح داد که نگاه به صندلی‌ها به عنوان «شیء پس از جنگ» که وجود بشری را به شکل نشستن تثبیت کرده، او را به فکر انعطاف‌پذیری طراحی تاریخی انداخت. صندلی دیگر صرفاً وسیله‌ای برای نشستن نیست؛ می‌تواند صدا و احساس تولید کند. آنچه از طراحی شیء استخراج شده این موضوع است که هنر می‌تواند از مواد رایج و در دسترس ساخته شود — صندلی‌های حاشیه‌ای شهری، زنگ‌های تبدیل‌شده، و زیرصدای انسانی. نش گرافیک | طراحی شیء و هنر تعاملی'''
    },
    {
        'title_fa': 'شکستن پرده‌های کاغذی و جنگ با گل: آزادی خلاق گروه گوتایی پس از جنگ جهانی',
        'source_url': 'https://www.designboom.com/art/tearing-paper-wrestling-mud-gutai-play-creative-freedom-postwar-japan/',
        'image_url': 'https://www.designboom.com/twitterimages/uploads/2026/07/gutai-art-association-japanese-postwar-performance-play-designboom-FB.jpg',
        'tags': ['هنر معاصر', 'ژاپن', 'طراحی آوانگارد', 'هنر اجرایی', 'تاریخ هنر', 'خلاقیت آزاد', 'پس از جنگ'],
        'excerpt_fa': 'گروه گوتایی، بنیان‌گذاری‌شده در سال ۱۹۵۴ در ژاپن پس از جنگ، به هنرمندان دعوت کرد که با رسانه‌های نامنظم و عملکردهای شادانه خود، آزادی هنری را تمرین کنند.',
        'content_fa': '''گوتایی نام یکی از مهم‌ترین جنبش‌های هنری پیشرو قرن بیستم است که در سال ۱۹۵۴ در نزدیکی اوساکا، ژاپن، تأسیس شد. معنای نام آن را می‌توان «تجسم» یا «شخصیت‌سازی» دریافت کرد که نشان‌دهنده علاقه هنرمندان به برخورد مستقیم با جهان فیزیکی است. بنیان‌گذار، جیرو یوشیhara، به نسل جوانی ژاپنی دستور داد: «کاری که هرگز انجام نشده باشد انجام ده!» این جمله، هم درخشان بود و هم منشوری برای حرکت. هنرمندان گوتایی رنگ را از کان‌ها پاشیدم، آب رنگی را بین درختان آویزان کردند، زنگ‌ها را به سالن‌های نمایش وصل کردند، و از بازدیدکنندگان خواستند که روی آثار خود بکشند. هر آزمایش، شرایط اولیه هنرسازی را تغییر می‌داد. نقاشی می‌توانست به اتفاقی تبدیل شود یا نمایشی با بازیگری مثل یک پارک بازی عمل کند. اهمیت این حرکت در پس از جنگ جهانی دوم آشکار است. ژاپن در جستجوی بازسازی فرهنگی خود بود و هنر آزاد بعد از سال‌ها حاکمیت نظامی و انطباق اجباری به ارزشی جدی داشت. بازی‌کردن در هنر حامل وزن بیشتری بود. گوتایی آزمایش را به عنوان راهی برای تمرین تفکر مستقل پس از دوره‌ای از نظامیون و انطباق اجباری می‌دید. اعضا هنر آموزشی دادند، به مجله شعر کودکان نیرین کمک کردند، و پروژه‌هایی را توسعه دادند که جوانان را تشویق می‌کرد بدون ایده‌های زیبایی وارث شده تصویر بسازند. نش گرافیک | هنر معاصر و تاریخ آوانگارد'''
    },
    {
        'title_fa': 'این لاگوس: تبدیل تایپوگرافی دست‌نقاش شهری به هنر عمومی پهرستان',
        'source_url': 'https://www.printmag.com/type-tuesday/this-is-lagos-turns-the-citys-hand-painted-typography-into-monumental-public-art/',
        'image_url': 'https://i0.wp.com/www.printmag.com/wp-content/uploads/2026/07/This-Is-Lagos_Berger_01_Dennis-Osadebe_Photo-by-Kadara-Enyeasi_Courtesy-Dennis-Osadebe-Studio-scaled.jpg?fit=2560%2C1707&quality=89&ssl=1',
        'tags': ['تایپوگرافی', 'هنر عمومی', 'ططراحی', 'لاگوس', 'هنر شهری', 'نئون‌آرت', 'نقشه‌برداری', 'فونت سفارشی'],
        'excerpt_fa': 'دنیس اوساده، هنرمند بصری، با الهام از تایپوگرافی دست‌نقاش حمل‌ونقل لاگوس، مجسمه‌های فولادی پهرستانی آفریده که نشان می‌دهد تایپوگرافی معمولی شهری می‌تواند به زیبایی پهرستانی تبدیل شود.',
        'content_fa': '''تایپوگرافی معمولاً در صفحه‌نمایش مانیتورها، کتاب‌ها و سیستم‌های برندینگ زندگی می‌کند. اما در لاگوس، نیجیریا، تایپوگرافی از زمان‌ها پیش روی خیابان‌ها حیات خود را گرفته است. حروف همزمان قوی و روان‌اند، بازتاب حرکت دائمی و انرژی خلاقانه این شهر پرجمعیت هستند. دنیس اوساده، هنرمند و طراح بصری، پروژه جدیدی به نام «این لاگوس» خلق کرده که الهام‌بخش بخش از قابل‌شناس‌ترین زبان بصری شهر است: تایپوگرافی دست‌نقاش که پیشرو، کوکو ماروا، اتوبوس‌های تجاری و کامیون‌ها با آن تزئین شده‌اند. اوساده یک فونت سفارشی به نام «خدایا» طراحی کرد که از تحقیق و مستندسازی طولانی مدت از زبان بصری منحصربه‌فرد این وسایل حمل‌ونقل پدید آمد. فونت «خدایا» پایه مجسمه‌هایی شد که در حال حاضر در سراسر شهر نصب می‌شوند. پنج مجسمه فولادی پهرستانی، هر کدام در یکی از پنج منطقه اداری لاگوس، عبارت شناخته‌شده «این لاگوس» را به ابعاد مهندسی عمومات تبدیل کرده‌اند. اوساده نشان داد که بازسازی تایپوگرافی محلی صرفاً دیجیتالی‌سازی نشانه‌های قدیمی یا انتشار کتاب نمونه نیست. در عوض، باید فکر کرد که چه اتفاقی می‌افتد وقتی تایپوگرافی روزمره شهر به زیرساخت عمومي تبدیل شود. نتیجه تایپوگرافی‌ای است که صرفاً ابزار ارتباطی نیست؛ بلکه بنایی تقدیمی است — جشنی از فرهنگ بصری که توسط مردم عادی خلق شده و در زندگی روزمره پیوند خورده است. نش گرافیک | تایپوگرافی کاربردی و طراحی شهری'''
    },
    {
        'title_fa': 'روزانه هلر: طراحی جلد آلبوم‌های جاز پرستیج رکوردز',
        'source_url': 'https://www.printmag.com/daily-heller/the-daily-heller-all-that-jazzy-record-album-design/',
        'image_url': 'https://i0.wp.com/www.printmag.com/wp-content/uploads/2025/11/teaser-6.jpg?fit=1353%2C888&quality=89&ssl=1',
        'tags': ['جلد آلبوم', 'گرافیک', 'طراحی موسیقی', 'تایپوگرافی', 'چاپ رتبی', 'هنر پوستر', 'تاریخ گرافیک', 'پرستیج رکوردز'],
        'excerpt_fa': 'وایل (WAIL) یک تاریخچه غنی از هنر جلد آلبوم پرستیج رکوردز را به روایت شکل‌گیری روابط نزدیک بین هنر، هنرمند، موسیقی و گوش‌دهنده کشیده می‌کند.',
        'content_fa': '''اگر چه خرید کتاب امروزه دشوار است، می‌توان در عصر وینیل اهمیت جلدهای آلبوم موسیقی را بیشتر درک کرد. در دوره وینیل (اوایل دهه ۱۹۵۰ تا دهه ۱۹۷۰)، جلد آلبوم یک عنصر محوری در تجربه گوش‌دادن موسیقی بود. شنوندگان گرمای دیسک ۱۲ اینچ را با دقت از کاور محافظش برمی‌داشتند، آن را روی پلاتر می‌گذاشتند و به موسیقی و هنر روی کاور غرق می‌شدند. برای پرستیج رکوردز، آرت ویریوی جلدآلبوم‌هایش آنقدر مهم بود که از یک برند تجاری ساده، به یک میراث هنری تبدیل شد. مجموعه WAIL: The Art of Prestige Records 1949-1970 تاریخچه طراحی گرافیکی، تایپوگرافیکی و عکاسی این برچسب افسانه‌ای را ثبت می‌کند. طراحانی مانند رید مایز، با ابزار تایپوگرافی جسورانه و صفحه‌آرایی‌های پویا، هویت بصری متمایزی برای پرستیج خلق کردند. جلد آلبوم «منبیلی» مايلز دیویس نمونه‌ای بارز از این هنر است. کاورهای پرستیج، اغلب با دو رنگ چاپ شده بودند و عکاسی هنری را با ساختارهای تایپوگرافیکی جسورانه ترکیب می‌کردند. نش گرافیک | جلد آلبوم، طراحی گرافیک موسیقی و تاریخ چاپ گرافیک'''
    },
]

# ── Helper functions ──
def check_duplicate(title):
    """Check if article title already exists in Supabase blog."""
    encoded_title = urllib.parse.quote(title, safe='')
    url = f'{SB_URL}/rest/v1/blog?select=id&title=eq.{encoded_title}'
    req = urllib.request.Request(url, headers=AUTH_HDR)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
            if data:
                return True
    except Exception:
        pass
    return False

def upload_article(title_fa, content_fa, excerpt_fa, image_url, source_url, tags):
    """Upload a single article to Supabase blog table."""
    # Truncate title to fit DB column limits
    if len(title_fa) > 200:
        title_fa = title_fa[:197] + '...'
    if len(content_fa) > 10000:
        content_fa = content_fa[:9997] + '...'
    
    payload = {
        'title': title_fa,
        'content': content_fa,
        'excerpt': excerpt_fa,
        'image_url': image_url or None,
        'source_url': source_url or None,
        'author_id': None,
    }
    
    data = json.dumps(payload, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(
        f'{SB_URL}/rest/v1/blog',
        data=data,
        headers={**AUTH_HDR, 'Prefer': 'return=minimal'},
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            status = resp.status
            body = resp.read().decode('utf-8')
            return True, f'Uploaded (HTTP {status})'
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        return False, f'HTTP {e.code}: {body[:200]}'
    except Exception as e:
        return False, str(e)

# ── Main upload process ──
print('=' * 60)
print('نش گرافیک — آپلود مقالات بلاگ به Supabase')
print('=' * 60)

uploaded = 0
skipped = 0
errors = 0

for i, article in enumerate(articles):
    title = article['title_fa']
    print(f'\n[{i+1}/{len(articles)}] بررسی: "{title[:60]}..."')
    
    # Check for duplicate
    if check_duplicate(title):
        print(f'  ⚠️  SKIP (duplicate): {title[:60]}')
        skipped += 1
        continue
    
    # Upload
    success, msg = upload_article(
        title, article['content_fa'], article['excerpt_fa'],
        article['image_url'], article['source_url'], article['tags']
    )
    
    if success:
        print(f'  ✅ UPLOADED: {title[:60]}')
        uploaded += 1
    else:
        print(f'  ❌ ERROR: {msg}')
        errors += 1

print(f'\n{"=" * 60}')
print(f'نتایج نهایی:')
print(f'  آپلود شد: {uploaded}')
print(f'  پاسخ (تکراری): {skipped}')
print(f'  خطا: {errors}')
print(f'  مجموع: {uploaded + skipped + errors} مقاله')
print(f'{"=" * 60}')

# ── Save backups ──
backup_dir = 'blog-posts'
os.makedirs(backup_dir, exist_ok=True)

for i, article in enumerate(articles):
    title_clean = re.sub(r'[^\w\s-]', '', article['title_fa']).strip().replace(' ', '-')
    # Persian-safe filename
    title_slug = re.sub(r'[^\u0600-\u06FF\w\s-]', '', article['title_fa']).strip().replace(' ', '-')[:80]
    filename = f'{datetime.date.today().isoformat()}-{title_slug}.json'
    filepath = os.path.join(backup_dir, filename)
    
    backup_data = {
        'title_fa': article['title_fa'],
        'content_fa': article['content_fa'],
        'excerpt_fa': article['excerpt_fa'],
        'image_url': article['image_url'],
        'source_url': article['source_url'],
        'tags': article['tags'],
        'uploaded_at': datetime.datetime.now().isoformat(),
        'source_site': 'creativebloq' if 'creativebloq' in article['source_url'] else ('designboom' if 'designboom' in article['source_url'] else 'printmag'),
    }
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(backup_data, f, indent=2, ensure_ascii=False)
    
    print(f'  Backup saved: {filepath}')

print(f'\nتمام مقالات پردازش شد. {uploaded} مقاله آپلود، {skipped} تکراری، {errors} خطا.')
