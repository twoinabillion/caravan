#!/bin/bash
# 달구지 연속성 배치 적용 — codex TUI에서 생성한 PNG를 게임 규격으로 변환·교체·빌드.
# 선행: docs/van-continuity-batch.md 대로 assets/scenes/van-continuity/*.png 생성.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=assets/scenes/van-continuity
DST=assets/scenes
CUTS=(busan-departure generic-story generic-crisis generic-discovery generic-encounter)

missing=0
for c in "${CUTS[@]}"; do
  [[ -f "$SRC/$c.png" ]] || { echo "❌ $SRC/$c.png 없음"; missing=1; }
done
[[ $missing -eq 0 ]] || { echo "docs/van-continuity-batch.md 의 프롬프트로 먼저 생성하세요"; exit 1; }

for c in "${CUTS[@]}"; do
  # 중앙 크롭 → 768×432 JPEG (기존 컷과 같은 규격), 원본은 대체 전 백업
  cp "$DST/$c.jpg" "$DST/$c.jpg.bak-$(date +%Y%m%d)" 2>/dev/null || true
  ffmpeg -y -v error -i "$SRC/$c.png" \
    -vf "scale=768:432:force_original_aspect_ratio=increase,crop=768:432" \
    -q:v 4 "$DST/$c.jpg"
  echo "✅ $c.jpg 교체 ($(du -h "$DST/$c.jpg" | cut -f1))"
done

npm run build:html
echo "🔎 확인: 게임을 열어 오프닝·이벤트 컷의 차가 파란 캡오버 트럭인지 육안 대조"
