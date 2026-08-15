#!/usr/bin/env python3
"""선택 카드는 잘리지 않고, 현재 상황 상세는 별도로 열 수 있다."""
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
    visible: cards.filter(c=>!c.hidden).map(c=>c.dataset.i),
    clipped: cards.filter(c=>!c.hidden && c.scrollHeight > c.clientHeight + 1)
                  .map(c=>({t:(c.innerText||'').slice(0,18), r:c.clientHeight, c:c.scrollHeight})),
    pager: !!document.querySelector('[data-choice-pages]'),
    page: document.querySelector('[data-choice-page]')?.textContent||'',
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
        check(f'{label}: 현재 페이지 선택 카드가 세 개 이하로 온전히 보임',
              r['count'] > 0 and len(r['visible']) <= 3 and not r['clipped'], str(r)[:220])
        # 네 개 이상은 3개 단위 페이지로 나눠 작은 화면에서도 선택지를 읽을 수 있어야 한다.
        if r['count'] >= 4:
            first = r['visible']
            page.click('[data-choice-next]')
            page.wait_for_timeout(60)
            after = page.evaluate(PROBE)
            check(f'{label}: 넘치는 선택지는 페이지로 이동 가능',
                  r['pager'] and r['page'] == '1' and after['page'] == '2' and
                  first != after['visible'] and len(after['visible']) <= 3 and not after['clipped'], str(after))
        terminal = page.evaluate("""() => ({
          phase:document.querySelector('#ev-sheet').dataset.storyPhase,
          step:document.querySelector('#ev-sheet').dataset.storyStep,
          progress:document.querySelector('[data-event-progress]')?.textContent||'',
          sceneHeight:document.querySelector('.event-scene-frame')?.getBoundingClientRect().height||0,
          detail:!!document.querySelector('[data-event-detail]')
        })""")
        check(f'{label}: 전술 선택 터미널에 큰 장면·진행 상태·현재 정보 상세 제어 표시',
              terminal['phase'] == 'event' and terminal['step'] == 'decision' and
              '/' in terminal['progress'] and terminal['sceneHeight'] >= 170 and terminal['detail'], str(terminal))
        page.click('[data-event-detail]')
        check(f'{label}: 전투 현재 정보 토글 작동',
              page.locator('#ev-sheet').evaluate("node=>node.classList.contains('combat-details-open')"))
        page.evaluate("""() => {
          document.querySelector('.choice[data-i="4"]').click();
          UI.finishStory();
        }""")
        page.wait_for_timeout(80)
        outcome = page.evaluate("""() => ({
          phase:document.querySelector('#ev-sheet').dataset.storyPhase,
          title:document.querySelector('.event-head h2')?.textContent||'',
          recap:document.querySelector('.event-choice-recap')?.textContent||'',
          effects:document.querySelectorAll('.story-result .fx').length,
          actionHeight:document.querySelector('.event-choice-dock .choice')?.getBoundingClientRect().height||0
        })""")
        check(f'{label}: 결과 화면이 제목·영향 칩·다음 행동으로 이어짐',
              outcome['phase'] == 'outcome' and '제압을 포기' in outcome['title'] and
              not outcome['recap'] and outcome['effects'] > 0 and outcome['actionHeight'] >= 44, str(outcome))
        page.close()

    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'선택 카드 가시성 실패 {len(failures)}건: ' + ', '.join(failures))
print('✅ 선택 카드가 모든 뷰포트에서 잘리지 않는다')
