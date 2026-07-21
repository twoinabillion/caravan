#!/bin/bash
# 서울까지 400km — 단일 HTML 빌드
# src/ 파트를 순서대로 cat 해서 서울까지400km.html 을 만든다.
# 파트 순서가 곧 스크립트 로드 순서 (data → engine → scene → map → ui → offroad → boot)
set -euo pipefail
cd "$(dirname "$0")"

PARTS_BEFORE_VAN=(
  src/01-style.html
  src/02-dom.html
  src/03-data.js
  src/03b-portraits.js
  src/03c-icons.js
  src/03d-bgm.js
)

PARTS_AFTER_VAN=(
  src/04-engine.js
  src/05-scene.js
  src/06-mapgraph.js
  src/07-ui.js
  src/08-offroad.js
  src/09-close.html
)

VAN_KEYS=(BASE CABIN REINFORCED EXPEDITION WHEEL)
VAN_FILES=(
  assets/van/dalguji-base-body.png
  assets/van/dalguji-cabin-body.png
  assets/van/dalguji-reinforced-body.png
  assets/van/dalguji-expedition-body.png
  assets/van/dalguji-wheel.png
)
VAN_JS="$(< src/03e-van.js)"
for I in "${!VAN_KEYS[@]}"; do
  VAN_BASE64="$(base64 < "${VAN_FILES[$I]}" | tr -d '\n')"
  VAN_JS="${VAN_JS//__DALGUJI_${VAN_KEYS[$I]}__/data:image/png;base64,$VAN_BASE64}"
done
NPC_KEYS=(geumja sundeok taeho jaepil miyoung drhan deokgu kimcaptain hayeosa sanjigi hanbyeol seoyeon mansu postman mapmaker mingyu grandfather bori)
NPC_JS="$(< src/03f-npc-portraits.js)"
for KEY in "${NPC_KEYS[@]}"; do
  NPC_BASE64="$(base64 < "assets/portraits/$KEY.png" | tr -d '\n')"
  NPC_JS="${NPC_JS//__NPC_${KEY}__/data:image/png;base64,$NPC_BASE64}"
done
{
  cat "${PARTS_BEFORE_VAN[@]}"
  printf '%s\n' "$VAN_JS"
  printf '%s\n' "$NPC_JS"
  cat "${PARTS_AFTER_VAN[@]}"
} > 서울까지400km.html
echo "✅ 서울까지400km.html $(wc -c < 서울까지400km.html | tr -d ' ') bytes"
