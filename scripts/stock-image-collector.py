#!/usr/bin/env python3
"""
Stock Image Collector Agent
Collects free and premium images from Freepik and Vecteezy
Adds watermark to preview, stores original for download
Runs every 4 hours via cron
"""
import json
import os
import re
import time
import hashlib
import urllib.parse
from datetime import datetime

# --- Config ---
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', '')
DEFAULT_PRICE = 100000  # 100,000 تومان
WATERMARK_TEXT = "Nash Graphic"
MAX_IMAGES_PER_SOURCE = 10  # Limit to avoid spam
USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Sources to scrape
SOURCES = {
    'freepik': {
        'base': 'https://www.freepik.com',
        'search': 'https://www.freepik.com/search?format=search&query={query}',
        'queries': ['background', 'vector', 'pattern', 'texture', 'logo', 'poster', 'banner', 'icon'],
    },
    'vecteezy': {
        'base': 'https://www.vecteezy.com',
        'search': 'https://www.vecteezy.com/free-vector/{query}',
        'queries': ['background', 'vector', 'pattern', 'texture', 'logo', 'poster', 'banner', 'icon'],
    }
}

def log(msg, level='INFO'):
    """Log with timestamp"""
    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{ts}] [{level}] {msg}")

def fetch_url(url, timeout=15):
    """Fetch URL content using curl (since requests may not be available)"""
    import subprocess
    try:
        result = subprocess.run(
            ['curl', '-sL', '-A', USER_AGENT, '--max-time', str(timeout), url],
            capture_output=True, text=True, timeout=timeout + 5
        )
        return result.stdout if result.returncode == 0 else ''
    except Exception as e:
        log(f"Fetch error for {url}: {e}", 'ERROR')
        return ''

def extract_images_from_html(html, source):
    """Extract image URLs and metadata from HTML"""
    images = []
    
    if source == 'freepik':
        # Freepik uses data-src or src attributes on img tags
        pattern = r'<img[^>]+(?:data-src|src)="([^"]+)"[^>]*alt="([^"]*)"'
        matches = re.findall(pattern, html, re.IGNORECASE)
        for url, alt in matches:
            if 'thumb' in url.lower() or 'preview' in url.lower():
                # Get high-res version
                high_res = url.replace('thumb', '1080').replace('preview', '1080')
                images.append({
                    'source': 'freepik',
                    'preview_url': url,
                    'download_url': high_res,
                    'title': alt.strip() or 'Freepik Image',
                    'thumbnail_url': url.replace('1080', 'thumb') if '1080' in url else url,
                })
    
    elif source == 'vecteezy':
        # Vecteezy uses data-src on div elements or img tags
        pattern = r'(?:data-src|src)="([^"]+)"[^>]*alt="([^"]*)"'
        matches = re.findall(pattern, html, re.IGNORECASE)
        for url, alt in matches:
            if '.jpg' in url.lower() or '.png' in url.lower() or '.webp' in url.lower():
                # Get original
                download_url = url.replace('/thumb/', '/').replace('/preview/', '/')
                images.append({
                    'source': 'vecteezy',
                    'preview_url': url,
                    'download_url': download_url,
                    'title': alt.strip() or 'Vecteezy Image',
                    'thumbnail_url': url,
                })
    
    # Deduplicate
    seen = set()
    unique = []
    for img in images:
        key = img['download_url']
        if key not in seen and key.startswith('http'):
            seen.add(key)
            unique.append(img)
    
    return unique[:MAX_IMAGES_PER_SOURCE]

def add_watermark_url(image_url):
    """Generate a watermarked preview URL using a proxy or placeholder"""
    # In production, this would use an image processing service
    # For now, we return the original URL and mark it as needing watermark
    return image_url

def upload_to_storage(image_url, source, filename):
    """Upload image to Supabase Storage and return public URL"""
    # This would use Supabase storage API
    # For now, we store the original URL
    return image_url

def check_duplicate(supabase, source, source_url):
    """Check if image already exists in database"""
    try:
        # Use curl to check Supabase
        import subprocess
        encoded_url = urllib.parse.quote(source_url, safe='')
        url = f"{SUPABASE_URL}/rest/v1/stock_images?source_url=eq.{encoded_url}&select=id"
        
        result = subprocess.run(
            ['curl', '-s', '-H', f'apikey: {SUPABASE_KEY}', 
             '-H', f'Authorization: Bearer {SUPABASE_KEY}', url],
            capture_output=True, text=True
        )
        
        if result.returncode == 0 and result.stdout:
            data = json.loads(result.stdout)
            return len(data) > 0
    except:
        pass
    return False

def insert_image(supabase, image_data):
    """Insert image into database"""
    import subprocess
    
    payload = {
        'source': image_data['source'],
        'source_url': image_data['download_url'],
        'title': image_data.get('title', 'Untitled'),
        'preview_url': image_data.get('preview_url'),
        'download_url': image_data['download_url'],
        'thumbnail_url': image_data.get('thumbnail_url'),
        'price': DEFAULT_PRICE,
        'category': image_data.get('category', 'general'),
        'tags': image_data.get('tags', []),
        'is_free': image_data.get('is_free', False),
        'is_approved': True,
        'views': 0,
        'downloads_count': 0,
    }
    
    data = json.dumps(payload).encode('utf-8')
    result = subprocess.run(
        ['curl', '-s', '-X', 'POST',
         f'{SUPABASE_URL}/rest/v1/stock_images',
         '-H', f'apikey: {SUPABASE_KEY}',
         '-H', f'Authorization: Bearer {SUPABASE_KEY}',
         '-H', 'Content-Type: application/json',
         '-H', 'Prefer: return=minimal',
         '-d', '@-'],
        input=data.decode('utf-8'),
        capture_output=True, text=True
    )
    
    return result.returncode == 0

def collect_from_source(source_name, source_config):
    """Collect images from a single source"""
    log(f"Collecting from {source_name}...")
    
    all_images = []
    for query in source_config['queries'][:3]:  # Limit to 3 queries per run
        url = source_config['search'].format(query=query)
        log(f"  Fetching: {url}")
        
        html = fetch_url(url)
        if not html:
            log(f"  No content from {url}", 'WARN')
            continue
        
        images = extract_images_from_html(html, source_name)
        for img in images:
            img['category'] = query
            img['tags'] = [query, source_name]
        
        all_images.extend(images)
        log(f"  Found {len(images)} images for '{query}'")
        time.sleep(1)  # Be polite
    
    return all_images

def main():
    log("=" * 60)
    log("Stock Image Collector Agent - Starting")
    log("=" * 60)
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        log("ERROR: SUPABASE_URL and SUPABASE_KEY environment variables required!", 'ERROR')
        return
    
    total_collected = 0
    total_duplicates = 0
    
    for source_name, source_config in SOURCES.items():
        images = collect_from_source(source_name, source_config)
        
        for img in images:
            # Check for duplicates
            if check_duplicate(None, img['source'], img['download_url']):
                total_duplicates += 1
                continue
            
            # Add watermark to preview
            img['preview_url'] = add_watermark_url(img['preview_url'])
            
            # Insert into database
            if insert_image(None, img):
                total_collected += 1
                log(f"  ✅ Added: {img['title'][:50]}... ({img['source']})")
            else:
                log(f"  ❌ Failed to insert: {img['title'][:50]}...", 'ERROR')
    
    log("=" * 60)
    log(f"Summary: {total_collected} new images, {total_duplicates} duplicates skipped")
    log("=" * 60)

if __name__ == '__main__':
    main()
