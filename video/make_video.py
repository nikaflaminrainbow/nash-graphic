#!/usr/bin/env python3
"""Create promotional video for Nash Graphic with avatar + Farsi narration"""
import subprocess
import os

os.chdir('/data/workspace/nash-graphic/video')

AVATAR = 'avatar.jpg'
AUDIO = 'narration.mp3'
OUTPUT = 'nash-about.mp4'
W, H = 720, 1280
FPS = 30

# Font - use DejaVu which supports basic Arabic/Persian
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

# Theme colors
BG = '0x0a0a0a'
GOLD = '0xc8a96e'
WHITE = '0xf5f5f5'

# Scene text with timing (start, end, text, y_position)
scenes = [
    (0.0, 5.0, "نش گرافیک", H//2 - 50),
    (5.0, 10.0, "سلام! من نیکا هستم", H//2 - 50),
    (10.0, 16.0, "طراح چاپ و بسته بندي", H//2 - 50),
    (16.0, 22.0, "بيش از ۱۲ سال سابقه", H//2 - 50),
    (22.0, 28.0, "بازارچه طرح هاي آماده", H//2 - 50),
    (28.0, 34.0, "سفارش طراحي اختصاصي", H//2 - 50),
    (34.0, 40.0, "آماده سازي فايل چاپي", H//2 - 50),
    (40.0, 46.0, "بسته بندي خلاقانه", H//2 - 50),
    (46.0, 52.0, "کيفيت حرفه اي", H//2 - 50),
    (52.0, 57.0, "منتظرم کمکت کنم!", H//2 - 50),
]

# Build filter complex
filters = []

# Scale avatar
filters.append(f"[1:v]scale=200:200:force_original_aspect_ratio=decrease,crop=200:200,format=rgba[avatar]")

# Create base with background and avatar
filters.append(f"[0:v][avatar]overlay=(W-200)/2:(H/2-220):format=auto[base]")

# Add gold decorative line
filters.append(f"[base]drawbox=x=(w-300)/2:y=H/2+40:w=300:h=3:color={GOLD}@0.6:t=fill[gold_line]")

# Add text overlays with enable timing
text_filters = []
for i, (start, end, text, y) in enumerate(scenes):
    # Escape special characters for ffmpeg
    safe_text = text.replace("'", "'\\''").replace('"', '\\"')
    text_filters.append(
        f"drawtext=text='{safe_text}':fontfile={FONT}:fontsize=42:fontcolor={GOLD}"
        f":x=(w-text_w)/2:y={y}:enable='between(t,{start},{end})'"
    )

# Add "Nash Graphic" subtitle
text_filters.append(
    f"drawtext=text='Nash Graphic':fontfile={FONT}:fontsize=24:fontcolor={WHITE}@0.5"
    f":x=(w-text_w)/2:y=H/2+60:enable='between(t,0.5,57)'"
)

# Combine all text filters
full_filter = "[gold_line]" + ",".join(text_filters) + "[out]"

# Build ffmpeg command
filter_complex = ";".join(filters) + ";" + full_filter

cmd = [
    'ffmpeg', '-y',
    '-f', 'lavfi', '-i', f'color=c={BG}:s={W}x{H}:d=57:r={FPS}',
    '-i', AVATAR,
    '-i', AUDIO,
    '-filter_complex', filter_complex,
    '-map', '[out]',
    '-map', '2:a',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k',
    '-t', '57',
    '-movflags', '+faststart',
    OUTPUT
]

print("Creating video...")
print(f"Duration: 57 seconds")
print(f"Resolution: {W}x{H}")
print(f"Scenes: {len(scenes)}")

result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode != 0:
    print(f"Error: {result.stderr[-500:]}")
else:
    # Get file info
    size = os.path.getsize(OUTPUT)
    print(f"\n✅ Video created: {OUTPUT}")
    print(f"   Size: {size / 1024 / 1024:.1f} MB")
    print(f"   Duration: 57 seconds")
