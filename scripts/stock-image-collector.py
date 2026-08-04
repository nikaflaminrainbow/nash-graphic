#!/usr/bin/env python3
"""
Stock Image Collector - Updated
Collects from Vecteezy for ALL filter categories
"""
import json, os, re, time, subprocess, urllib.request
from datetime import datetime

# Config
def _load_config():
    try:
        with open('js/config.js', 'r') as f:
            c = f.read()
        url_m = re.search(r"SUPABASE_URL\s*=\s*'(.*?)'", c)
        key_m = re.search(r"SUPABASE_ANON\s*=\s*'(.*?)'", c)
        return (url_m.group(1) if url_m else ''), (key_m.group(1) if key_m else '')
    except:
        return '', ''

_cfg = _load_config()
SUPABASE_URL = _cfg[0]
SUPABASE_KEY = _cfg[1]
USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"

# ALL categories from marketplace filters
CATEGORIES = [
    'background', 'vector', 'pattern', 'texture', 'logo', 'icon',
    'illustration', 'abstract', 'floral', 'nature', 'business',
    'minimal', 'luxury', 'vintage', 'geometric', 'modern',
    'colorful', 'poster', 'banner', 'mockup', 'template',
    'card', 'branding', 'packaging', 'label', 'paper',
    'watercolor', 'gradient', 'dark', 'gold'
]

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def fetch_url(url):
    try:
        result = subprocess.run(
            ['curl', '-sL', '-A', USER_AGENT, '--max-time', '10', url],
            capture_output=True, text=True, timeout=15
        )
        return result.stdout if result.returncode == 0 else ''
    except:
        return ''

def get_existing_urls():
    try:
        headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
        req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/stock_images?select=download_url&limit=2000", headers=headers)
        resp = urllib.request.urlopen(req, timeout=15)
        return set(img['download_url'] for img in json.loads(resp.read()))
    except:
        return set()

def insert_image(img_data):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    data = json.dumps(img_data).encode()
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/stock_images", data=data, headers=headers, method="POST")
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        return True
    except Exception as e:
        log(f"  Insert error: {str(e)[:50]}")
        return False

def collect_category(category, existing):
    """Collect images for ONE category from Vecteezy"""
    url = f"https://www.vecteezy.com/free-vector/{category}"
    html = fetch_url(url)
    if not html:
        return 0
    
    # Extract image URLs
    imgs = re.findall(r'src="(https://static\.vecteezy\.com/system/resources/thumbnails/[^"]+\.jpg[^"]*)"', html)
    
    count = 0
    for img_url in imgs[:3]:  # 3 per category
        if img_url in existing:
            continue
        
        # Get title from nearby alt text
        idx = html.find(img_url)
        title_area = html[max(0,idx-300):idx+100]
        alt_match = re.search(r'alt="([^"]{5,80})"', title_area)
        title = alt_match.group(1) if alt_match else f"{category} vector"
        
        payload = {
            "title": title[:100],
            "preview_url": img_url,
            "download_url": img_url,
            "thumbnail_url": img_url,
            "source_url": f"https://www.vecteezy.com/free-vector/{category}",
            "source": "vecteezy",
            "category": category,
            "price": 0,
            "is_approved": True,
            "tags": [category, "vecteezy"]
        }
        
        if insert_image(payload):
            existing.add(img_url)
            count += 1
            log(f"  ✅ {title[:40]}")
        
        time.sleep(0.3)
    
    return count

def main():
    log("=" * 50)
    log("Stock Image Collector - Starting")
    log(f"Categories: {len(CATEGORIES)}")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        log("ERROR: Config not found!")
        return
    
    existing = get_existing_urls()
    log(f"Existing images: {len(existing)}")
    
    total_new = 0
    
    for cat in CATEGORIES:
        log(f"Collecting: {cat}")
        new = collect_category(cat, existing)
        total_new += new
        time.sleep(0.5)
    
    log(f"=" * 50)
    log(f"Done! Added {total_new} new images")
    log(f"Total now: {len(existing) + total_new}")

if __name__ == "__main__":
    main()
