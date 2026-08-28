#!/bin/bash
# 최신 실제 플레이 녹화본을 3분 이내 1080p 심사용 데모로 조립한다.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RAW="exports/raw/caravan-gameplay-trailer.webm"
MUSIC="assets/audio/bgm/story.mp3"
OUT="exports/서울까지400km-심사용-데모.mp4"
CONTACT="exports/서울까지400km-심사용-데모-contact.jpg"
THUMB="exports/서울까지400km-심사용-데모-thumbnail.jpg"

if [[ ! -f "$RAW" ]]; then
  echo "Missing gameplay recording: $RAW" >&2
  echo "Run: python3 tools/record-game-trailer.py" >&2
  exit 1
fi

mkdir -p exports

ffmpeg -y -v warning \
  -i "$RAW" \
  -i "$MUSIC" \
  -/filter_complex trailer/submission-demo.filter \
  -map '[vout]' -map '[aout]' \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.1 \
  -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -movflags +faststart \
  -t 63 "$OUT"

ffmpeg -y -v error -ss 2.2 -i "$OUT" -frames:v 1 -q:v 2 "$THUMB"
ffmpeg -y -v error -i "$OUT" \
  -vf "select='not(mod(n,225))',scale=480:-1,tile=3x3:padding=8:margin=8:color=0x070910" \
  -frames:v 1 -q:v 3 "$CONTACT"

ffprobe -v error \
  -show_entries format=duration,size,bit_rate \
  -show_entries stream=index,codec_name,width,height,r_frame_rate \
  -of default=noprint_wrappers=1 "$OUT"

echo "$OUT"
