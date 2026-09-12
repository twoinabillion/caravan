#!/usr/bin/env python3
"""전체 선택 목록은 한 흐름으로 스크롤되고, 현재 상황 상세는 별도로 열린다."""
import os
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
GAME = os.environ.get('CARAVAN_TEST_URL', (ROOT / '서울까지400km.html').as_uri())
CAPTURE_DIR = os.environ.get('CARAVAN_CAPTURE_DIR')
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
    overlaps: cards.filter(card=>{
      const head=card.querySelector('.choice-head'), forecast=card.querySelector('.choice-forecast');
      if(!head||!forecast) return false;
      const hr=head.getBoundingClientRect(), fr=forecast.getBoundingClientRect();
      return hr.bottom>fr.top+.5;
    }).map(card=>(card.innerText||'').slice(0,36)),
    pager: !!document.querySelector('[data-choice-pages]'),
    page: document.querySelector('[data-choice-page]')?.textContent||'',
    listOverflow: list ? getComputedStyle(list).overflowY : '',
    listClient: list ? list.clientHeight : 0,
    listScroll: list ? list.scrollHeight : 0,
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
        check(f'{label}: 전체 선택 카드가 한 목록에 있고 내용이 잘리지 않음',
              r['count'] > 0 and len(r['visible']) == r['count'] and
              not r['pager'] and not r['clipped'] and not r['overlaps'], str(r)[:300])
        if CAPTURE_DIR and width == 390 and height == 844 and not large:
            Path(CAPTURE_DIR).mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(Path(CAPTURE_DIR) / 'walker-actions-top-390x844.png'))
        # 네 개 이상은 한 목록 안에서 스크롤해 마지막 행동까지 직접 도달한다.
        if r['count'] >= 4:
            last = page.locator('.choice[data-i="4"]')
            last.scroll_into_view_if_needed()
            reached = page.evaluate("""() => {
              const list=document.querySelector('.event-choice-dock>.choices');
              const last=document.querySelector('.choice[data-i="4"]');
              const lr=list.getBoundingClientRect(), cr=last.getBoundingClientRect();
              return {scrollTop:list.scrollTop, top:cr.top, bottom:cr.bottom,
                listTop:lr.top, listBottom:lr.bottom,
                reached:cr.top>=lr.top-1&&cr.bottom<=lr.bottom+1};
            }""")
            check(f'{label}: 스크롤로 마지막 행동까지 도달 가능',
                  r['listOverflow'] in ('auto', 'scroll') and reached['reached'] and
                  (r['listScroll'] <= r['listClient'] + 1 or reached['scrollTop'] > 0), str(reached))
            if CAPTURE_DIR and width == 390 and height == 844 and not large:
                page.screenshot(path=str(Path(CAPTURE_DIR) / 'walker-actions-bottom-390x844.png'))
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
        last = page.locator('.choice[data-i="4"]')
        last.scroll_into_view_if_needed()
        if CAPTURE_DIR and width == 390 and height == 844 and not large:
            Path(CAPTURE_DIR).mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(Path(CAPTURE_DIR) / 'walker-actions-390x844.png'))
        last.click()
        page.evaluate('UI.finishStory()')
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
        if CAPTURE_DIR and width == 390 and height == 844 and not large:
            page.screenshot(path=str(Path(CAPTURE_DIR) / 'walker-retreat-result-390x844.png'))
        page.close()

    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'선택 카드 가시성 실패 {len(failures)}건: ' + ', '.join(failures))
print('✅ 선택 카드가 모든 뷰포트에서 잘리지 않는다')
