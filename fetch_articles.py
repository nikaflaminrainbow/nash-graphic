#!/usr/bin/env python3
"""Fetch homepages from 3 design sites and extract relevant article links."""
import urllib.request, urllib.parse, re, json, sys
from html import unescape

SITES = [
    ('creativebloq', 'https://www.creativebloq.com/design/graphic-design'),
    ('designboom', 'https://www.designboom.com'),
    ('printmag', 'https://www.printmag.com'),
]

KEYWORDS = ['graphic design', 'print', 'packaging', 'brand', 'typography',
            'illustration', 'logo', 'design', 'color', 'layout']

HEADERS = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'}

def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    resp = urllib.request.urlopen(req, timeout=30)
    return resp.read().decode('utf-8', errors='replace')

def extract_links(html, base_url):
    """Extract article links from HTML."""
    links = set()
    # Find all href links
    hrefs = re.findall(r'href=["\']([^"\']+)["\']', html)
    for href in hrefs:
        href = unescape(href).strip()
        # Skip external, anchors, mailto, javascript
        if href.startswith('#') or href.startswith('mailto:') or href.startswith('javascript:') or href.startswith('tel:'):
            continue
        # Make absolute URL
        if href.startswith('http'):
            full = href
        elif href.startswith('/'):
            full = urllib.parse.urljoin(base_url, href)
        else:
            full = urllib.parse.urljoin(base_url, '/' + href)
        # Filter to article-like paths
        links.add(full)
    return links

def score_link(url, title_hint=""):
    """Score relevance to design topics."""
    combined = (url + ' ' + title_hint).lower()
    score = 0
    for kw in ['brand', 'packaging', 'print', 'typograph', 'illustration', 'logo', 'graphic-design', 'design']:
        if kw in combined:
            score += 2
    for kw in ['art', 'color', 'layout', 'creative']:
        if kw in combined:
            score += 1
    # Penalize non-article pages
    for bad in ['page/', '/tag/', '#', 'rss', 'feed', 'login', 'register', 'cart', 'checkout', 'sitemap']:
        if bad in combined:
            score -= 2
    return score

results = {}

for name, url in SITES:
    print(f'\n=== {name} ({url}) ===')
    try:
        html = fetch(url)
        links = extract_links(html, url)
        # Also extract titles near links
        all_links = list(links)
        # Score each link
        scored = []
        for link in all_links:
            s = score_link(link)
            if s > 0:
                scored.append((s, link))
        scored.sort(key=lambda x: -x[0])
        # Deduplicate, keep top 10
        seen = set()
        top = []
        for s, link in scored:
            if link not in seen:
                seen.add(link)
                top.append((s, link))
            if len(top) >= 10:
                break
        print(f'Found {len(scored)} scored links, top 10:')
        for s, link in top:
            print(f'  [{s}] {link}')
        results[name] = [link for s, link in top[:10]]
    except Exception as e:
        print(f'ERROR: {e}')
        results[name] = []

with open('/tmp/scored_links.json', 'w') as f:
    json.dump(results, f, indent=2)
print('\nSaved to /tmp/scored_links.json')
