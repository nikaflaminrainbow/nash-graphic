#!/bin/bash
set -e
cd /data/workspace/nash-graphic/video

AVATAR="avatar.jpg"
AUDIO="narration.mp3"
OUTPUT="nash-about.mp4"
W=720
H=1280
FPS=30
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
DURATION=57

echo "Step 1: Creating base video with avatar..."
ffmpeg -y -f lavfi -i "color=c=0x0a0a0a:s=${W}x${H}:d=${DURATION}:r=${FPS}" \
  -i "$AVATAR" \
  -filter_complex "
    [1:v]scale=200:200:force_original_aspect_ratio=decrease,crop=200:200[avatar];
    [0:v][avatar]overlay=(W-200)/2:(H/2-220)[base];
    [base]drawtext=text='نش گرافیک':fontfile=${FONT}:fontsize=56:fontcolor=0xc8a96e:x=(w-text_w)/2:y=(H/2-40):enable='between(t,0,5)',
    drawtext=text='Nash Graphic':fontfile=${FONT}:fontsize=28:fontcolor=0xffffff@0.5:x=(w-text_w)/2:y=(H/2+30):enable='between(t,0.5,5)',
    drawbox=x=(w-300)/2:y=(H/2+70):w=300:h=3:color=0xc8a96e@0.6:t=fill:enable='between(t,1,5)'
    [out]
  " \
  -map "[out]" \
  -c:v libx264 -pix_fmt yuv420p -t ${DURATION} \
  video_only.mp4 2>&1 | tail -3

echo "Step 2: Adding audio..."
ffmpeg -y -i video_only.mp4 -i "$AUDIO" \
  -c:v copy -c:a aac -b:a 128k \
  -map 0:v -map 1:a \
  -shortest \
  "$OUTPUT" 2>&1 | tail -3

echo ""
echo "✅ Done!"
ls -lh "$OUTPUT"
