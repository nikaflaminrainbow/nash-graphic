#!/usr/bin/env python3
"""
Batch upload 6 Farsi blog articles to Supabase for Nash Graphic.
Reads config from js/config.js, checks for duplicates, uploads, and saves backups.
"""

import json
import os
import re
import urllib.request
import urllib.parse
from datetime import datetime

# ─── CONFIG ───────────────────────────────────────────────────
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "js", "config.js")
BACKUP_DIR = os.path.join(os.path.dirname(__file__), "blog-posts")

with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    config_text = f.read()

SB_URL = re.search(r"SUPABASE_URL\s*=\s*'([^']*)'", config_text).group(1)
SB_KEY = re.search(r"SUPABASE_ANON\s*=\s*'([^']*)'", config_text).group(1)

print(f"Supabase URL: {SB_URL}")
print(f"Key length: {len(SB_KEY)} chars")

# ─── ARTICLES ─────────────────────────────────────────────────
TODAY = datetime.utcnow().strftime("%Y-%m-%d")

ARTICLES = [
    {
        "title": "بحث داغ هوش مصنوعی در دنیای هنر: وقتی هر دو طرف حق دارند",
        "slug": "ai-art-debate-everyone-has-a-point",
        "source_url": "https://www.creativebloq.com/ai/everyone-in-this-ai-art-row-has-a-point-and-thats-what-worries-me",
        "image_url": "https://cdn.mos.cms.futurecdn.net/3d8gDVhkWRwpqaqYHxNqwQ.jpg",
        "tags": "هوش مصنوعی، هنر دیجیتال، گالری، طراحی گرافیک، اخلاق هنری، بلفاست",
        "excerpt": "گالری بلفاست اگزپوزد نمایشگاهی از آثار هوش مصنوعی را برگزار کرد که بحث‌های تندی در میان هنرمندان و منتقدان به راه انداخت.",
        "content": """# بحث داغ هوش مصنوعی در دنیای هنر: وقتی هر دو طرف حق دارند

اخیراً گالری «بلفاست اگزپوزد» در ایرلند شمالی میزبان نمایشگاهی بود که جنجال قابل‌توجهی به پا کرد. جانی شریدان، فارغ‌التحصیل کارشناسی ارشد هنرهای زیبا، مجموعه‌ای از تصاویر با هوش مصنوعی خلق کرده بود که بازخوانی طنزآمیزی از عکاسی تابلویی محسوب می‌شد — پروژه «گالاتیا» که هدفش به چالش کشیدن خود هوش مصنوعی از درون بود.

مدیرعامل گالری، دیردره راب، از این اثر دفاع کرد و آن را اثری طنزآمیز و انتقادی دانست. اما دو عکاس به نام‌های کلئو اوستین و برندن هارکین به شدت معترض بودند. واکنش آنلاین هم تندتر بود و بسیاری این آثار را «زباله هوش مصنوعی» خواندند.

اما ماجرا فقط به این نمایشگاه ختم نمی‌شد. نمایشگاه‌های دیگری هم بودند که با رویکردهای هوشمندانه‌تری از هوش مصنوعی استفاده کرده بودند. رفیک آنادول مجموعه‌ای از ۳۵ میلیون تصویر شخصی خودش را برای آموزش مدل‌ها استفاده کرد — یعنی محتوای خودش را دزدیده نبود. گالری سرپنتین هوش مصنوعی را به‌عنوان موضوع تحقیق مطرح کرد نه به‌عنوان اثر هنری. و «هاوس آو تریلز» هم از هوش مصنوعی به‌عنوان ابزاری برای هنر طنزآمیز استفاده کرد.

نکته‌ای که این بحث را پیچیده می‌کند این است که **هر دو طرف حرف‌شان درست است**. از یک سو، گالری‌ها وظیفه دارند آثار دشوار و بحث‌برانگیز را نمایش دهند — هنر دقیقاً به همین دلیل هنر است. از سوی دیگر، هنرمندان کاملاً حق دارند که معترض باشند، چون ابزارهای هوش مصنوعی تولید محتوا با جمع‌آوری داده‌ها از آثار هنرمندان و بدون اجازه آن‌ها ساخته شده‌اند.

این تقابل بین آزادی بیان هنری و اخلاق داده‌کاوی، یکی از چالش‌های اصلی دنیای طراحی گرافیک و هنر دیجیتال در سال‌های پیش رو خواهد بود. مسئله‌ای که ساده نیست و پاسخ ساده‌ای هم ندارد.

---
*نش گرافیک*"""
    },
    {
        "title": "تبلت کاغذی reMarkable Paper Pro Move: وقتی نوشتن دوباره لذت‌بخش می‌شود",
        "slug": "remarkable-paper-pro-move-review",
        "source_url": "https://www.creativebloq.com/design/product-design/this-portable-paper-tablet-might-be-my-favourite-gadget-of-the-decade",
        "image_url": "https://cdn.mos.cms.futurecdn.net/oSuJ7XJENGFAbu4TDkrZfQ.jpg",
        "tags": "طراحی محصول، تکنولوژی، یادداشت‌برداری دیجیتال، تبلت کاغذی، طراحی صنعتی، reMarkable",
        "excerpt": "مرور کامل reMarkable Paper Pro Move؛ تبلتی که تجربه نوشتن روی کاغذ واقعی را با تکنولوژی مدرن ترکیب کرده است.",
        "content": """# تبلت کاغذی reMarkable Paper Pro Move: وقتی نوشتن دوباره لذت‌بخش می‌شود

دنیای دیجیتال هر روز سریع‌تر می‌شود، اما گاهی اوقات بهترین ابزارها آن‌هایی هستند که ما را به سادگی بازمی‌گردانند. reMarkable Paper Pro Move دقیقاً همین کار را می‌کند: تجربه نوشتن روی کاغذ واقعی را در قالب یک دستگاه دیجیتال مدرن بازآفرینی می‌کند.

این تبلت ابعادی تقریباً هم‌اندازه یک کتاب جیبی دارد و بدنه آلومینیومی آن حسی لوکس و در عین حال مقاوم منتقل می‌کند. صفحه‌نمایش رنگی e-ink با نور پس‌زمینه، تجربه‌ای بسیار نزدیک به کاغذ واقعی ایجاد می‌کند — آنقدر طبیعی که وقتی قلم را روی سطح آن حرکت می‌دهید، تقریباً فراموش می‌کنید با یک دستگاه الکترونیکی کار می‌کنید.

وقتی آیپد را کنار بگذارید و با reMarkable بنویسید، تفاوت فاحش است. سطح شیشه‌ای آیپد هرگز نمی‌تواند مقاومت و حس طبیعی سطح این تبلت را تقلید کند. به همین دلیل بسیاری از حرفه‌ای‌ها که زیاد یادداشت‌برداری می‌کنند — از طراحان گرافیک تا مدیران پروژه — به این دستگاه عادت می‌کنند و دیگر آن را کنار نمی‌گذارند.

کاور چرمی پریمیوم همراه دستگاه، ظاهری حرفه‌ای به آن می‌بخشد و حمل آن را راحت‌تر می‌کند. البته مشکلات جزئی هم وجود دارد: نسبت تصویر متفاوت با سایر محصولات reMarkable باعث می‌شود برخی محتواها برش بخورند. اما این موضوع در استفاده روزمره چندان آزاردهنده نیست.

در مجموع، این تبلت تبدیل به دفتر یادداشتی غیرقابل‌جایگزین شده — هم برای کار و هم برای نوشتن‌های شخصی. اگر از آن دسته افرادی هستید که به نوشتن دستی اهمیت می‌دهید، این شاید بهترین ابزاری باشد که در دهه اخیر خواهید دید.

---
*نش گرافیک*"""
    },
    {
        "title": "انیمیشن‌های نقاشی‌شده: بازآفرینی پارک‌های بازی ناتمام ایسامو نوگوچی",
        "slug": "noguchi-unrealized-playgrounds-animation",
        "source_url": "https://www.designboom.com/art/hand-painted-animations-isamu-noguchi-unrealized-playgrounds-life-eastend-western-nicolas-menard-jack-cunningham-kate-wiener-interview/",
        "image_url": "https://www.designboom.com/wp-content/uploads/2026/07/hand-painted-animations-isamu-noguchi-unrealized-playgrounds-life-eastend-western-nicolas-menard-jack-cunningham-kate-wiener-interview-designboom-02.jpg",
        "tags": "انیمیشن، هنر، مجسمه‌سازی، موزه نوگوچی، طراحی پارک بازی، فیلم کوتاه، هنر نقاشی",
        "excerpt": "به مناسبت چهلمین سالگرد موزه نوگوچی، استودیو ایست‌اند وسترن پنج فیلم انیمیشن نقاشی‌شده دستی ساخته است.",
        "content": """# انیمیشن‌های نقاشی‌شده: بازآفرینی پارک‌های بازی ناتمام ایسامو نوگوچی

موزه نوگوچی در کوئینز نیویورک امسال چهلمین سالگرد تأسیس خود را جشن می‌گیرد، و جشنی که گرفته هیچ شباهتی به نمایشگاه‌های معمول موزه‌ای ندارد. استودیو «ایست‌اند وسترن» از مونtréal، پنج فیلم انیمیشن نقاشی‌شده دستی ساخته که پنج مجسمه بازی ناتمام ایسامو نوگوچی را دوباره زنده می‌کند.

این پنج پروژه — «کوه بازی» (۱۹۳۳)، «تجهیزات بازی» (۱۹۴۰)، «پارک بازی توپوگرافیک» (۱۹۴۱)، «پارک بازی سازمان ملل» (۱۹۵۲) و «پارک بازی ریورساید» (۱۹۶۱-۶۲) — هیچ‌کدام هرگز ساخته نشدند. نوگوچی آن‌ها را طراحی کرد، با دولت‌ها و سازمان‌ها مذاکره کرد، اما هیچ‌وقت به مرحله اجرا نرسیدند. تا اینکه یک استودیوی انیمیشن در کانادا تصمیم گرفت این خواب‌های تعبیرنشده را به تصویر بکشد.

در این فیلم‌ها، بچه‌ها روی تاب‌ها نوسان می‌کنند، از میان تپه‌های خاکی عبور می‌کنند، و در فضاهای دایره‌ای دور هم جمع می‌شوند. اما نکته جالب این است که فیلم‌ها نمی‌خواهند فقط نشان دهند این پارک‌ها چه شکلی بودند — می‌خواهند نشان دهند **تجربه** بودن در آن‌ها چگونه بود. بچه‌ها فقط در فضا حرکت نمی‌کنند، با آن تعامل می‌کنند.

تکنیک نقاشی دستی به این آثار حسی صمیمی و انسانی می‌بخشد که با CGI و انیمیشن‌های دیجیتال رایج امروز تفاوت چشمگیری دارد. هر فریم حس لمس قلم‌مو روی کاغذ را منتقل می‌کند — انتخابی آگاهانه که با فلسفه نوگوچی درباره ارتباط انسان با فضا و ماده هماهنگ است.

این فیلم‌ها از طریق Vimeo به‌صورت آنلاین قابل دسترسی هستند و برای هر کسی که به انیمیشن، مجسمه‌سازی یا طراحی فضای بازی علاقه‌مند است، تجربه‌ای ارزشمند به شمار می‌روند.

---
*نش گرافیک*"""
    },
    {
        "title": "آی وی‌وی پس از ۵۰ سال دوباره نقاشی کشید: درختی که دیگر بهار نخواهد دید",
        "slug": "ai-weiwei-drawing-dying-tree-circa",
        "source_url": "https://www.designboom.com/art/ai-weiwei-drawing-50-years-dying-tree-circa-interview/",
        "image_url": "https://www.designboom.com/wp-content/uploads/2026/07/ai-weiwei-drawing-50-years-dying-tree-circa-interview-designboom-01.jpg",
        "tags": "هنر، آی وی‌وی، نقاشی، انیمیشن، طراحی گرافیک، هنر عمومی، لندن",
        "excerpt": "آی وی‌وی، هنرمند ۶۹ ساله چینی، پس از مرگ درخت باستانی ۱۲۰۰ ساله جنگل شروود، برای اولین بار در ۵۰ سال گذشته نقاشی کشید.",
        "content": """# آی وی‌وی پس از ۵۰ سال دوباره نقاشی کشید: درختی که دیگر بهار نخواهد دید

وقتی آی وی‌وی، هنرمند ۶۹ ساله و چهره شناخته‌شده هنر معاصر جهان، خبر مرگ درخت باستانی «مِیجر اوک» را شنید، چیزی درونش شکست. این درخت بلوط عظیم در جنگل شروود انگلستان، ۱۲۰۰ سال عمر داشت — ۱۲۰۰ سال باد، باران، سرما و گرما را تحمل کرده بود تا اینکه سرانجام از پا درآمد.

آی وی‌وی برای اولین بار در بیش از ۵۰ سال گذشته دست به مداد شد. این اتفاق در شب تابستانی انقلاب تابستانی رخ داد — زمانی که خورشید در بلندترین نقطه خود در آسمان قرار می‌گیرد. نقاشی ساده‌ای که کشید، تصویر درختی بود که دیگر زنده نیست.

این نقاشی پایه و اساس انیمیشن «A Tree» (یک درخت) شد — پروژه‌ای از CIRCA که روی نمایشگر غول‌پیکر «پیکدیلی لایتز» در مرکز لندن نمایش داده شد. در کنار این تصویر، شعر «درخت‌ها» از پدر آی وی‌وی، آی چینگ — شاعر بزرگ چینی که آن شعر را در سال ۱۹۴۰ سروده بود — هم پخش شد.

آی وی‌وی در گفت‌وگوی خود بازتاب‌هایی عمیق درباره عمر درخت و زندگی انسانی ارائه داد. او از نقاشی یاد کرد که گفته بود «خوش‌بین باور دارد که بهار دیگری خواهد آمد» — و بعد اضافه کرد: «برای این درخت، بهار دیگری نخواهد آمد.»

این اثر هم ادای احترامی به طبیعت است و هم یادآوری تلخی از مفهوم زمان و فناپذیری. وقتی اثر هنری در مقیاس عمومی مانند پیکدیلی لایتز نمایش داده می‌شود، به هزاران نفر فرصت تأمل می‌دهد — و شاید همین هدف اصلی هنر عمومی باشد.

---
*نش گرافیک*"""
    },
    {
        "title": "۳۰ سالگی تونیک: استودیویی که آمستردام را بازتعریف کرد",
        "slug": "thonik-studio-30-years-amsterdam",
        "source_url": "https://www.printmag.com/daily-heller/the-daily-heller-thonik/",
        "image_url": "https://i0.wp.com/www.printmag.com/wp-content/uploads/2026/08/thonik_Keukenhof-spring-garden_new-identity_3-scaled.png?fit=1568%2C882&quality=80&ssl=1",
        "tags": "استودیو طراحی، برندینگ، هویت بصری، طراحی گرافیک، آمستردام، تونیک، طراحی حرکتی",
        "excerpt": "نیکی گونیسن و توماس ویدرشوون ۳۰ سال پیش استودیوی تونیک را در آمستردام تأسیس کردند؛ استودیویی که هویت بصری شهر را دگرگون ساخت.",
        "content": """# ۳۰ سالگی تونیک: استودیویی که آمستردام را بازتعریف کرد

نیکی گونیسن و توماس ویدershoven در سال ۱۹۹۳ استودیوی «تونیک» را در آمستردام تأسیس کردند — نامی که از ترکیب حروف اول اسم‌هایشان (Tho + Nik) ساخته شده و به معنای «تُنیک» یا نوشیدنی تقویت‌کننده است. و این دقیقاً همان کاری است که این استودیو در ۳۰ سال گذشته با فرهنگ بصری آمستردام و هلند کرده است.

فهرست پروژه‌های تونیک خیره‌کننده است: هویت بصری فرودگاه اسخیپول، باغ‌های کوکنهوف، هفته طراحی هلند، موزه هنر آلماتی، هویت بصری شهر آمستردام (سه صلیب معروف از نشان قرون وسطایی شهر) و همکاری ۱۶ ساله با شبکه پخش VPRO. هر کدام از این پروژه‌ها به تنهایی می‌تواند اعتبار یک استودیوی طراحی را بسازد.

نکته جالب درباره هویت بصری شهر آمستردام این است که طراحی آن فقط یک بعدازظهر طول کشید — اما اجرایش یک سال زمان برد و بیش از ۵۰ مدیر و مقام رسمی درگیر آن شدند. این نشان می‌دهد که طراحی خوب فقط خلق یک لوگو نیست؛ مذاکره، تطبیق و اجرای دقیق هم بخش حیاتی کار است.

تونیک با کارگاه‌های مشترک با مشتریانش همکاری می‌کند — روشی که تضمین می‌کند نتیجه نهایی واقعاً بازتاب‌دهنده هویت و نیاز سازمان باشد. استودیو با بیش از پنج ملیت مختلف در تیمش، ثابت کرده که تنوع فرهنگی خودش یک مزیت رقابتی است.

آن‌ها معتقدند ارتباطات برای فرهنگ، خودش تبدیل به فرهنگ می‌شود — و شاید کلید موفقیتشان در یک جمله خلاصه شود: فضایی برای تنفس دادن به استعدادهای یکدیگر.

---
*نش گرافیک*"""
    },
    {
        "title": "دبرا مک‌گوایر: طراح لباسی که دنیای فرندز را پوشاند",
        "slug": "debra-mcguire-costume-designer-friends",
        "source_url": "https://www.printmag.com/fine-art/what-matters-to-debra-mcguire/",
        "image_url": "https://i0.wp.com/www.printmag.com/wp-content/uploads/2026/07/Debra_McGuire.jpg?fit=1170%2C881&quality=89&ssl=1",
        "tags": "طراحی لباس، طراحی صحنه و لباس، فیلم و سینما، هنر، دبرا مک‌گوایر، فرندز، خلاقیت",
        "excerpt": "دبرا مک‌گوایر، طراح لباس افسانه‌ای سریال فرندز و ده‌ها فیلم موفق سینمایی، هنرمندی است که در قلبش نقاش است.",
        "content": """# دبرا مک‌گوایر: طراح لباسی که دنیای فرندز را پوشاند

دبرا مک‌گوایر شاید بیشتر به‌عنوان طراح لباس سریال «فرندز» شناخته شود — همه ده فصل آن — اما حرفه او به‌مراتب فراتر از یک سریال تلویزیونی است. او طراح لباس فیلم‌هایی مانند «앵کرمن»، «باکره ۴۰ ساله»، «باردار شده»، «سوپربد»، «سونیک خارپشت» و «شب بازی» بوده و افتخارات متعددی در حوزه طراحی صحنه و لباس دارد.

اما چیزی که بسیاری نمی‌دانند این است که در قلب دبرا یک هنرمند تجسمی نشسته — یک نقاش. او از همان دوران کودکی نقاشی می‌کشید. در سن هفت سالگی، آثارش را به مجله کمیک «میلی د مدل» فرستاد و آن‌ها را با نام «دبی کِی فاین، طراح» منتشر کردند. در چهار سالگی هم سعی کرده بود به خودش فرفری دائمی بدهد — که نشان می‌دهد روحیه جسورانه و خلاقش از همان ابتدا در وجودش بوده.

کتاب «پوشاندن داستان: هنر طراحی لباس» خلاصه‌ای از فلسفه کاری اوست — اینکه لباس فقط پارچه نیست، بلکه ابزاری برای روایت داستان و ساختن شخصیت است.

دبرا هر صبح مدیتیشن می‌کند و شنا می‌کند — عادتی که ۵۵ سال است هرگز ترکش نکرده. سی سال مطالعه بودیسم و کابالا هم بخشی از سفر معنوی اوست. وقتی از او پرسیده شده چه چیزی برایش مهم‌ترین است، پاسخ داده: «عاشق کار کردن در استودیویم هستم و عاشق اینم که در کارم گم بشوم.»

شاید راز موفقیت دبرا مک‌گوایر در همین جمله باشد: غرق شدن در کار، با چشم‌اندازی معنوی و روحیه‌ای هنرمندانه. طراحی لباس برای او نه یک شغل، بلکه ادامه‌ای طبیعی از زندگی هنری‌اش است.

---
*نش گرافیک*"""
    }
]

# ─── HELPERS ──────────────────────────────────────────────────

def api_request(endpoint, method="GET", data=None):
    """Make a request to Supabase REST API."""
    url = f"{SB_URL}/rest/v1/{endpoint}"
    headers = {
        "apikey": SB_KEY,
        "Authorization": f"Bearer {SB_KEY}",
    }
    body = None
    if data is not None:
        headers["Content-Type"] = "application/json"
        headers["Prefer"] = "return=minimal"
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")


def check_duplicate(title, source_url):
    """Check if article already exists by title or source_url."""
    encoded_title = urllib.parse.quote(title, safe="")
    encoded_url = urllib.parse.quote(source_url, safe="")
    endpoint = f"blog?select=id&or=(title.eq.{encoded_title},source_url.eq.{encoded_url})"
    status, body = api_request(endpoint)
    if status == 200:
        data = json.loads(body)
        return len(data) > 0
    return False


def upload_article(article):
    """Upload a single article to Supabase."""
    # Tags must be a JSON array for PostgreSQL array column
    tags_list = [t.strip() for t in article["tags"].split("،") if t.strip()]
    payload = {
        "title": article["title"],
        "content": article["content"],
        "excerpt": article["excerpt"],
        "image_url": article["image_url"],
        "source_url": article["source_url"],
        "tags": tags_list,
    }
    status, body = api_request("blog", method="POST", data=payload)
    return status, body


def save_backup(article):
    """Save article as backup JSON."""
    os.makedirs(BACKUP_DIR, exist_ok=True)
    filename = f"{TODAY}-{article['slug']}.json"
    filepath = os.path.join(BACKUP_DIR, filename)
    backup_data = {
        "title": article["title"],
        "content": article["content"],
        "excerpt": article["excerpt"],
        "image_url": article["image_url"],
        "source_url": article["source_url"],
        "tags": article["tags"],
        "slug": article["slug"],
        "uploaded_at": datetime.utcnow().isoformat() + "Z",
    }
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(backup_data, f, ensure_ascii=False, indent=2)
    return filepath


# ─── MAIN ─────────────────────────────────────────────────────

def main():
    uploaded = 0
    skipped = 0
    errors = 0

    print(f"\n{'='*60}")
    print(f"Blog Batch Upload — {TODAY}")
    print(f"Total articles to process: {len(ARTICLES)}")
    print(f"Existing blog posts: 61")
    print(f"{'='*60}\n")

    for i, article in enumerate(ARTICLES, 1):
        print(f"[{i}/{len(ARTICLES)}] {article['title'][:60]}...")

        # Check for duplicates
        if check_duplicate(article["title"], article["source_url"]):
            print(f"  ⏭️  SKIPPED — duplicate found")
            skipped += 1
            continue

        # Upload
        try:
            status, body = upload_article(article)
            if status in (200, 201):
                print(f"  ✅ UPLOADED (HTTP {status})")
                uploaded += 1
            else:
                print(f"  ❌ ERROR (HTTP {status}): {body[:200]}")
                errors += 1
                continue
        except Exception as e:
            print(f"  ❌ EXCEPTION: {e}")
            errors += 1
            continue

        # Save backup
        try:
            path = save_backup(article)
            print(f"  💾 Backup: {os.path.basename(path)}")
        except Exception as e:
            print(f"  ⚠️  Backup failed: {e}")

    print(f"\n{'='*60}")
    print(f"SUMMARY")
    print(f"  ✅ Uploaded:   {uploaded}")
    print(f"  ⏭️  Skipped:    {skipped}")
    print(f"  ❌ Errors:     {errors}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
