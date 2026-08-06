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
npm run test:accessibility9
npm run test:golden
python3 -u tests/test_keyboard_access.py
python3 -u tests/test_smoke.py
npm run simulate:journeys
node tools/check-release.mjs
