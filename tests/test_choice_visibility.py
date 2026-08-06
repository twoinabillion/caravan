#!/usr/bin/env python3
"""선택 카드는 잘리지 않는다.

2026-08-06 회귀: 전투 카드에 '실패하면 …' 줄을 추가하자 카드가 길어졌는데,
.choice가 overflow:hidden + flex-shrink:1이라 목록이 스크롤되는 대신 카드가
눌려 내용의 절반(등급·실패 비용·요구 조건)이 통째로 사라졌다. 스크린리더에는
남아 있어 눈으로 보는 사람만 정보를 잃는 형태였다.
"""
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / '서울까지400km.html').as_uri()
failures = []


def check(label, ok, detail=''):
    print(('  ✅ ' if ok else '  ❌ ') + label + (f' — {detail}' if detail else ''))
    if not ok:
        failures.append(label)


PROBE = """() => {
  const cards=[...document.querySelectorAll('.event-choice-dock>.choices>.choice')];
  const list=document.querySelector('.event-choice-dock>.choices');
  return {
    count: cards.length,
    clipped: cards.filter(c=>c.scrollHeight > c.clientHeight + 1)
                  .map(c=>({t:(c.innerText||'').slice(0,18), r:c.clientHeight, c:c.scrollHeight})),
    scrollable: list ? list.scrollHeight > list.clientHeight + 1 : false,
    listOverflow: list ? getComputedStyle(list).overflowY : '',
  };
}"""

OPEN_COMBAT = """() => {
  G.newGame('onroad','카드','full');
  S.combat=null; S.injuries={}; S.pursuit=0;
  UI.showEvent(D.events.find(e=>e.id==='combat_walker_strike'));
  UI.finishStory();
}"""

with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    errors = []
    for width, height, large in [(360, 700, False), (390, 844, False), (390, 844, True), (1440, 900, False)]:
        page = browser.new_page(viewport={'width': width, 'height': height})
        page.on('pageerror', lambda exc: errors.append(str(exc)))
        page.add_init_script('localStorage.clear()')
        page.goto(GAME)
        if large:
            page.evaluate("localStorage.setItem('caravan_ui_text','1')")
            page.reload()
        page.evaluate(OPEN_COMBAT)
        page.wait_for_timeout(250)
        r = page.evaluate(PROBE)
        label = f"{width}x{height}{' 큰 글자' if large else ''}"
        check(f'{label}: 선택 카드 {r["count"]}개 전부 온전히 보임',
              r['count'] > 0 and not r['clipped'], str(r['clipped'])[:160])
        # 카드가 화면보다 많으면 목록이 실제로 스크롤되어야 한다 (안내 문구가 거짓말이 되지 않게)
        if r['count'] >= 4:
            check(f'{label}: 넘치는 목록은 스크롤 가능', r['scrollable'] or r['listOverflow'] == 'auto', str(r))
        page.close()

    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'선택 카드 가시성 실패 {len(failures)}건: ' + ', '.join(failures))
print('✅ 선택 카드가 모든 뷰포트에서 잘리지 않는다')
