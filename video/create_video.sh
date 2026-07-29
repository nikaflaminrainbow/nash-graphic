#!/bin/bash
# Create promotional video for Nash Graphic "About Us" page
# Uses avatar image + animated text overlays

cd /data/workspace/nash-graphic/video

AVATAR="avatar.jpg"
OUTPUT="nash-about.mp4"
W=720
H=1280
FPS=30

# Colors matching the site theme
BG_COLOR="#0a0a0a"
GOLD="#c8a96e"
WHITE="#f5f5f5"
DARK="#1a1a1a"

# Font setup
FONT="/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc"
FONT_FA="/usr/share/fonts/truetype/noto/NotoNaskh-Regular.ttc"

# Check available fonts
if [ ! -f "$FONT_FA" ]; then
  FONT_FA=$(fc-list :lang=fa | head -1 | cut -d: -f1)
fi
if [ -z "$FONT_FA" ]; then
  FONT_FA="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
fi

echo "Using font: $FONT_FA"

# Scene definitions: (text, duration_seconds)
declare -a SCENES=(
  "نش گرافیک|3"
  "سلام! من نیکا هستم|3"
  "طراح چاپ و بسته بندی|3"
  "بیش از ۱۲ سال سابقه|3"
  "بازارچه طرح هاي آماده|3"
  "سفارش طراحی اختصاصی|3"
  "آماده سازی فایل چاپی|3"
  "بسته بندی خلاقانه|3"
  "کیفیت حرفه ای|3"
  "منتظرم کمکت کنم!|3"
)

# Step 1: Create avatar circle crop
echo "Step 1: Preparing avatar..."
convert "$AVATAR" -resize 300x300^ -gravity center -extent 300x300 \
  \( +clone -threshold -1 -negate -fill white -draw "circle 150,150 150,0" \) \
  -alpha off -compose CopyOpacity -composite \
  avatar_circle.png 2>/dev/null

# Step 2: Create each scene
echo "Step 2: Creating scenes..."
SCENE_NUM=0
for scene in "${SCENES[@]}"; do
  IFS='|' read -r TEXT DURATION <<< "$scene"
  SCENE_NUM=$((SCENE_NUM + 1))
  SCENE_FILE="scene_$(printf '%02d' $SCENE_NUM).mp4"
  
  # Calculate frames
  FRAMES=$((DURATION * FPS))
  
  # Create scene with avatar + text + gold line
  ffmpeg -y -f lavfi -i "color=c=${BG_COLOR}:s=${W}x${H}:d=${DURATION}:r=${FPS}" \
    -i avatar_circle.png \
    -filter_complex "
      [1:v]scale=200:200[avatar];
      [0:v][avatar]overlay=(W-w)/2:(H/2-180)[bg_avatar];
      [bg_avatar]drawtext=text='${TEXT}':fontfile=${FONT_FA}:fontsize=48:fontcolor=${GOLD}:x=(w-text_w)/2:y=(H/2+20):enable='between(t,0.3,${DURATION})',
      drawtext=text='—':fontfile=${FONT_FA}:fontsize=36:fontcolor=${GOLD}:x=(w-text_w)/2:y=(H/2+100):enable='between(t,0.5,${DURATION})',
      drawbox=x=(w-200)/2:y=H/2+130:w=200:h=2:color=${GOLD}@0.6:t=fill:enable='between(t,0.6,${DURATION})',
      drawtext=text='Nash Graphic':fontfile=${FONT_FA}:fontsize=24:fontcolor=${WHITE}@0.5:x=(w-text_w)/2:y=H/2+150:enable='between(t,0.7,${DURATION})'
    " \
    -c:v libx264 -pix_fmt yuv420p -t "${DURATION}" \
    "$SCENE_FILE" 2>/dev/null
  
  echo "  Scene $SCENE_NUM: $TEXT ($DURATION s)"
done

# Step 3: Create intro scene (avatar only)
echo "Step 3: Creating intro..."
ffmpeg -y -f lavfi -i "color=c=${BG_COLOR}:s=${W}x${H}:d=3:r=${FPS}" \
  -i avatar_circle.png \
  -filter_complex "
    [1:v]scale=250:250[avatar];
    [0:v][avatar]overlay=(W-w)/2:(H/2-200)[bg];
    [bg]drawtext=text='نش گرافیک':fontfile=${FONT_FA}:fontsize=56:fontcolor=${GOLD}:x=(w-text_w)/2:y=(H/2+100):enable='between(t,0.5,3)',
    drawtext=text='Nash Graphic':fontfile=${FONT_FA}:fontsize=28:fontcolor=${WHITE}@0.7:x=(w-text_w)/2:y=(H/2+170):enable='between(t,0.8,3)',
    drawtext=text='طراحی و چاپ':fontfile=${FONT_FA}:fontsize=24:fontcolor=${WHITE}@0.4:x=(w-text_w)/2:y=(H/2+210):enable='between(t,1.0,3)'
  " \
  -c:v libx264 -pix_fmt yuv420p -t 3 \
  scene_00_intro.mp4 2>/dev/null
echo "  Intro created"

# Step 4: Create outro scene
echo "Step 4: Creating outro..."
ffmpeg -y -f lavfi -i "color=c=${BG_COLOR}:s=${W}x${H}:d=4:r=${FPS}" \
  -i avatar_circle.png \
  -filter_complex "
    [1:v]scale=180:180[avatar];
    [0:v][avatar]overlay=(W-w)/2:(H/2-250)[bg];
    [bg]drawtext=text='منتظرم کمکت کنم!':fontfile=${FONT_FA}:fontsize=44:fontcolor=${GOLD}:x=(w-text_w)/2:y=(H/2+20):enable='between(t,0.5,4)',
    drawtext=text='nikadesigningco@gmail.com':fontfile=${FONT_FA}:fontsize=22:fontcolor=${WHITE}@0.6:x=(w-text_w)/2:y=(H/2+90):enable='between(t,0.8,4)',
    drawtext=text='t.me/nash_graphic_team':fontfile=${FONT_FA}:fontsize=22:fontcolor=${WHITE}@0.6:x=(w-text_w)/2:y=(H/2+130):enable='between(t,1.0,4)',
    drawbox=x=(w-300)/2:y=H/2+180:w=300:h=2:color=${GOLD}@0.4:t=fill:enable='between(t,1.2,4)'
  " \
  -c:v libx264 -pix_fmt yuv420p -t 4 \
  scene_99_outro.mp4 2>/dev/null
echo "  Outro created"

# Step 5: Concatenate all scenes
echo "Step 5: Combining scenes..."
cat > concat.txt << EOF
file 'scene_00_intro.mp4'
file 'scene_01.mp4'
file 'scene_02.mp4'
file 'scene_03.mp4'
file 'scene_04.mp4'
file 'scene_05.mp4'
file 'scene_06.mp4'
file 'scene_07.mp4'
file 'scene_08.mp4'
file 'scene_09.mp4'
file 'scene_99_outro.mp4'
EOF

ffmpeg -y -f concat -safe 0 -i concat.txt \
  -c:v libx264 -pix_fmt yuv420p \
  -movflags +faststart \
  "$OUTPUT" 2>/dev/null

# Step 6: Get info
echo ""
echo "=== Video Created ==="
ls -lh "$OUTPUT"
ffprobe -v quiet -show_entries format=duration,size -of default=noprint_wrappers=1 "$OUTPUT" 2>/dev/null
echo ""
echo "Total scenes: $((SCENE_NUM + 2))"
echo "File: $OUTPUT"
