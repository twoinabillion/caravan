#!/bin/bash
# Complete local release gate. Playwright may require running outside a restricted sandbox.
set -euo pipefail
cd "$(dirname "$0")/.."

npm run build
npm run verify:quick
npm run test:quality8
npm run test:quality9
npm run test:quality9:audit
npm run test:save
npm run test:xss
npm run test:pressure
npm run test:combat
npm run test:slots
npm run test:determinism
npm run test:eta
npm run test:choices
npm run test:beats
npm run test:finale
npm run test:accessibility9
npm run test:golden
python3 -u tests/test_keyboard_access.py
python3 -u tests/test_smoke.py
npm run simulate:journeys   # 지도·연비 전용 체크 (이벤트 층은 모델임)
npm run simulate:engine     # 실엔진 밸런스 — 진짜 게임을 측정한다
node tools/check-release.mjs
