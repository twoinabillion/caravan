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

VAN_BASE64="$(base64 < assets/van/dalguji-base.png | tr -d '\n')"
{
  cat "${PARTS_BEFORE_VAN[@]}"
  sed "s|__DALGUJI_BASE__|data:image/png;base64,$VAN_BASE64|" src/03e-van.js
  cat "${PARTS_AFTER_VAN[@]}"
} > 서울까지400km.html
echo "✅ 서울까지400km.html $(wc -c < 서울까지400km.html | tr -d ' ') bytes"
