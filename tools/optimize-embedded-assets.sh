#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/caravan-assets.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT

before=$(du -sk "$ROOT/assets/scenes" "$ROOT/assets/intro" "$ROOT/assets/upgrades" "$ROOT/assets/audio" | awk '{s+=$1} END{print s}')
image_saved=0
audio_saved=0

replace_if_smaller(){
  local source="$1" candidate="$2" threshold_percent="${3:-92}"
  local old new
  old=$(stat -f%z "$source")
  new=$(stat -f%z "$candidate")
  if (( new * 100 <= old * threshold_percent )); then
    mv "$candidate" "$source"
    REPLACED=$((old-new))
  else
    rm -f "$candidate"
    REPLACED=0
  fi
}

echo "🖼  장면 이미지 최적화"
if [[ "${CARAVAN_SKIP_IMAGES:-0}" != "1" ]]; then
  while IFS= read -r source; do
    name=$(basename "$source")
    candidate="$TMP/$name"
    if [[ "$name" == "miryang-market-hub.jpg" ]]; then
      sips -Z 1200 -s format jpeg -s formatOptions 72 "$source" --out "$candidate" >/dev/null
    else
      sips -s format jpeg -s formatOptions 72 "$source" --out "$candidate" >/dev/null
    fi
    REPLACED=0; replace_if_smaller "$source" "$candidate" 92
    image_saved=$((image_saved+REPLACED))
  done < <(find "$ROOT/assets/scenes" "$ROOT/assets/intro" "$ROOT/assets/upgrades" -type f -name '*.jpg' | sort)
fi

transcode_audio(){
  local input="$1" bitrate="$2" channels="$3"
  local relative candidate
  relative="${input#$ROOT/}"
  candidate="$TMP/$(echo "$relative" | tr '/ ' '__').mp3"
  ffmpeg -nostdin -loglevel error -y -i "$input" -map_metadata -1 -codec:a libmp3lame -b:a "$bitrate" -ac "$channels" "$candidate"
  REPLACED=0; replace_if_smaller "$input" "$candidate" 95
  audio_saved=$((audio_saved+REPLACED))
}

echo "🎧 내장 오디오 최적화"
transcode_audio "$ROOT/assets/audio/title.mp3" 64k 2
while IFS= read -r audio_file; do transcode_audio "$audio_file" 48k 2; done < <(find "$ROOT/assets/audio/bgm" -type f -name '*.mp3' | sort)
while IFS= read -r audio_file; do transcode_audio "$audio_file" 48k 1; done < <(find "$ROOT/assets/audio/sfx" -type f -name '*.mp3' | sort)
while IFS= read -r audio_file; do transcode_audio "$audio_file" 48k 1; done < <(find "$ROOT/assets/audio/voice" -type f -name '*.mp3' | sort)

after=$(du -sk "$ROOT/assets/scenes" "$ROOT/assets/intro" "$ROOT/assets/upgrades" "$ROOT/assets/audio" | awk '{s+=$1} END{print s}')
printf '✅ 이미지 %.2fMB · 오디오 %.2fMB 절감 · 전체 %dKB → %dKB\n' \
  "$(awk -v n="$image_saved" 'BEGIN{print n/1048576}')" \
  "$(awk -v n="$audio_saved" 'BEGIN{print n/1048576}')" "$before" "$after"
