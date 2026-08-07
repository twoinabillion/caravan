#!/usr/bin/env python3
"""소스 구조 위생 — 파일이 스스로 완결되는가, 테스트가 진짜 빌드를 보는가.

2026-08-06 적대적 재검증: "07-ui.js 3,713줄을 5분할" 했지만 실제로는 하나의 IIFE를
텍스트로 자른 것이라 07a·07d가 단독 파싱조차 되지 않았다. 파일이 나뉘어도 독립적으로
검사·정렬·이동할 수 없으면 나눈 것이 아니다.

같은 리뷰에서: 모든 테스트가 빌드된 HTML을 읽는데 src와의 신선도를 대조하지 않아,
엔진을 고치고 테스트만 돌리면 이전 빌드가 초록을 반환했다.
"""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILT = ROOT / '서울까지400km.html'
SRC = ROOT / 'src'
failures = []

MAX_LINES = 1200


def check(label, ok, detail=''):
    print(('  ✅ ' if ok else '  ❌ ') + label + (f' — {detail}' if detail else ''))
    if not ok:
        failures.append(label)


print('― 파일이 스스로 완결되는가 (단독 파싱)')
js_files = sorted(SRC.glob('0*.js'))
broken = []
for f in js_files:
    r = subprocess.run(['node', '--check', str(f)], capture_output=True)
    if r.returncode != 0:
        first = (r.stderr.decode().strip().splitlines() or [''])[-1][:60]
        broken.append(f'{f.name}: {first}')
check('모든 소스 파일이 단독으로 파싱된다', not broken, '; '.join(broken))

print('― 파일 크기')
big = [f'{f.name} {len(f.read_text().splitlines())}줄'
       for f in js_files
       if len(f.read_text().splitlines()) > MAX_LINES and f.name != '03-data.js']
# 03-data.js는 90% 이상이 선언적 콘텐츠라 예외로 둔다(분할해도 읽기가 나아지지 않는다).
check(f'코드 파일은 {MAX_LINES}줄 이하 (03-data.js 제외)', not big, '; '.join(big))

print('― 테스트가 stale 빌드를 검증하지 않는가')
built_mtime = BUILT.stat().st_mtime
newer = [f.name for f in list(SRC.iterdir()) if f.is_file() and f.stat().st_mtime > built_mtime]
check('빌드가 src보다 최신이다', not newer,
      f"빌드 이후 수정됨: {newer[:5]} — `npm run build:html` 후 다시 검사")

if failures:
    raise SystemExit(f'소스 위생 실패 {len(failures)}건: ' + ', '.join(failures))
print('✅ 소스가 스스로 완결되고, 검사가 진짜 빌드를 본다')
