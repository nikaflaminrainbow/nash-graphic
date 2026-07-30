#!/usr/bin/env python3
"""
Lightweight About Us Video - uses ffmpeg for final encoding
Generates minimal frames, ffmpeg handles the rest
"""
import os, math, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

BASE = '/data/workspace/nash-graphic'
AVATAR = os.path.join(BASE, 'video', 'avatar.jpg')
OUTPUT = os.path.join(BASE, 'video', 'nash-about.mp4')

W, H = 720, 1280
FPS = 15
DURATION = 105

BG = (18, 18, 24)
GOLD = (200, 169, 110)
WHITE = (255, 255, 255)
DARK = (30, 30, 40)

def get_font(sz):
    for p in ['/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf',
              '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf']:
        if os.path.exists(p): return ImageFont.truetype(p, sz)
    return ImageFont.load_default()

def load_avatar():
    img = Image.open(AVATAR).convert('RGBA')
    img = img.resize((320, 320), Image.Resampling.LANCZOS)
    img = img.filter(ImageFilter.SMOOTH_MORE)
    img = ImageEnhance.Contrast(img).enhance(1.3)
    # Circle mask
    mask = Image.new('L', (320, 320), 0)
    ImageDraw.Draw(mask).ellipse([8, 8, 312, 312], fill=255)
    out = Image.new('RGBA', (320, 320), (0,0,0,0))
    out.paste(img, mask=mask)
    return out

def text_center(draw, txt, y, font, fill=WHITE):
    bb = draw.textbbox((0,0), txt, font=font)
    x = (W - (bb[2]-bb[0])) // 2
    draw.text((x, y), txt, font=font, fill=fill)

def frame(t, avatar, texts):
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    
    # BG particles
    random.seed(42)
    for i in range(12):
        px = int((random.random()*W + t*(8+i*2)) % W)
        py = int((random.random()*H + math.sin(t*0.5+i)*25) % H)
        ps = 2 + int(math.sin(t+i)*2)
        d.ellipse([px-ps,py-ps,px+ps,py+ps], fill=GOLD)
    
    # Avatar float
    ay = int(300 + math.sin(t*0.8)*12)
    ax = (W - 320)//2
    
    # Glow
    for r in range(180, 0, -8):
        a = int(20 * r/180)
        c = tuple(min(255, v+a) for v in BG)
        d.ellipse([W//2-r, ay+160-r, W//2+r, ay+160+r], fill=c)
    
    # Shadow
    d.ellipse([ax+20, ay+310, ax+300, ay+330], fill=(10,10,15))
    
    # Avatar
    img.paste(avatar, (ax, ay), avatar)
    
    # Crown
    cf = get_font(30)
    d.text((W//2-15, int(ay-35+math.sin(t*1.5)*4)), "👑", font=cf)
    
    # Title
    tf = get_font(38)
    text_center(d, "Nash Graphic", ay+350, tf, GOLD)
    sf = get_font(20)
    text_center(d, "نش گرافیک", ay+395, sf, WHITE)
    text_center(d, "طراحی چاپ و بسته‌بندی", ay+425, sf, GOLD)
    
    # Animated texts
    bf = get_font(22)
    for st, et, txt, yp in texts:
        if st <= t <= et:
            p = (t-st)/(et-st)
            alpha = 255
            if p < 0.15: alpha = int(255*p/0.15)
            elif p > 0.85: alpha = int(255*(1-p)/0.15)
            
            xo = 0
            if p < 0.2: xo = int((1-p/0.2)*80)
            
            bb = d.textbbox((0,0), txt, font=bf)
            tw, th = bb[2]-bb[0], bb[3]-bb[1]
            bx = (W-tw)//2 - 15 + xo
            by = yp - 8
            
            # Box bg
            for ox in range(3):
                d.rounded_rectangle([bx-ox, by-ox, bx+tw+30+ox, by+th+16+ox], 
                                   radius=10, fill=(30,30,40))
            
            d.text(((W-tw)//2+xo, yp), txt, font=bf, fill=WHITE)
    
    # Bottom bar
    d.rectangle([(0, H-70), (W, H-67)], fill=GOLD)
    cf2 = get_font(14)
    text_center(d, "nikadesigningco@gmail.com", H-55, cf2, GOLD)
    text_center(d, "۰۹۳۵۱۷۶۰۰۵۴", H-35, cf2, WHITE)
    
    return img

def main():
    print("Loading avatar...")
    av = load_avatar()
    
    texts = [
        (2, 8, "سلام! من نیکا هستم 👋", 190),
        (9, 16, "طراح چاپ و بسته‌بندی", 190),
        (17, 25, "بیش از ۱۲ سال تجربه", 190),
        (26, 34, "طراحی دایکات و جعبه", 190),
        (35, 43, "طراحی لیبل و برچسب", 190),
        (44, 52, "طراحی کاتالوگ و بروشور", 190),
        (53, 62, "طراحی لوگو و هویت بصری", 190),
        (63, 72, "آماده همکاری با شما 🤝", 190),
        (73, 82, "سفارش آنلاین از سایت ما", 190),
        (83, 92, "nikaflaminrainbow.github.io", 190),
        (93, 102, "نش گرافیک — نشانه تجارت شما ✨", 190),
    ]
    
    total = FPS * DURATION
    print(f"Generating {total} frames ({DURATION}s @ {FPS}fps)...")
    
    for i in range(total):
        t = i / FPS
        f = frame(t, av, texts)
        f.save(os.path.join(BASE, 'video', f'f_{i:04d}.jpg'), quality=85)
        if i % (FPS*10) == 0:
            print(f"  {i}/{total} ({100*i//total}%)")
    
    print("Frames done! Encoding video...")
    os.system(f'ffmpeg -y -framerate {FPS} -i {BASE}/video/f_%04d.jpg '
              f'-c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p '
              f'-an '
              f'-vf "scale=720:1280" {OUTPUT} 2>&1 | tail -5')
    
    # Cleanup frames
    import glob
    for f in glob.glob(os.path.join(BASE, 'video', 'f_*.jpg')):
        os.remove(f)
    
    sz = os.path.getsize(OUTPUT) / 1024 / 1024
    print(f"✅ Done! {OUTPUT} ({sz:.1f}MB)")

if __name__ == '__main__':
    main()
