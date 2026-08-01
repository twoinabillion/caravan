#!/bin/bash
# 서울까지 400km — 최신 게임 통합 빌드
# 기본: src/ → 서울까지400km.html → caravan.ait + 호환 파일명 동기화
# --html-only: AIT 빌드 내부에서 재귀 없이 HTML만 갱신
set -euo pipefail
cd "$(dirname "$0")"

HTML_ONLY=false
if [[ "${1:-}" == "--html-only" ]]; then
  HTML_ONLY=true
  shift
fi
if [[ $# -gt 0 ]]; then
  echo "사용법: ./build.sh [--html-only]" >&2
  exit 2
fi

# 기존 배포본을 덮기 전에 대사와 콘텐츠 참조를 검사한다.
node tools/dialogue-lint.cjs
node tools/validate-content.cjs
node tools/build-html.mjs

if [[ "$HTML_ONLY" == false ]]; then
  echo "📦 최신 HTML로 AIT 번들을 갱신합니다."
  CARAVAN_HTML_READY=1 npm run build:toss
fi
