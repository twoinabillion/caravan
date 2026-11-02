#!/usr/bin/env python3
"""Focused regressions for the pacing, mobile interaction, and audio 8.0 upgrade."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / '서울까지400km.html').as_uri()
SHOT = ROOT / 'qa-artifacts/batch-20261101-complete/story/quality8-shots'
SHOT.mkdir(parents=True, exist_ok=True)
failures = []
checks = []


def check(label, ok, detail=''):
    checks.append((label, bool(ok)))
    print(('  ✅ ' if ok else '  ❌ ') + label + (f' — {detail}' if detail and not ok else ''))
    if not ok:
        failures.append(label)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(viewport={'width': 390, 'height': 780})
    errors = []
    page.on('console', lambda msg: errors.append(msg.text)
            if msg.type == 'error' and 'Failed to load resource' not in msg.text else None)
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.add_init_script("""
      localStorage.clear();
      localStorage.setItem('caravan_intro_auto','0');
      localStorage.setItem('caravan_story_auto','0');
    """)
    page.goto(GAME)
    page.wait_for_timeout(300)

    print('― 프롤로그 진입 속도')
    page.click('#bt-new')
    # Retired: hidden legacy name/mode and summary controls. Current preparation
    # offers optional history; naming belongs to the actual Do-yun dialogue.
    check('첫 여행은 세 가지 짐 중 하나를 고르는 준비 화면으로 진입한다',
          page.locator('#scr-name').is_visible() and page.locator('#profile-pick [role="radio"]').count() == 3 and not page.locator('#scr-mode').is_visible())
    page.locator('#profile-pick [role="radio"]').last.click()
    selected_pack = page.locator('#profile-pick [role="radio"][aria-checked="true"]').get_attribute('data-pack')
    page.click('#opening-history')
    check('과거 이야기는 출발을 강제하지 않는 선택 읽기다',
          page.locator('#scr-intro').is_visible() and page.evaluate('S===null || !S?.flags?.main_mission_started'))
    history = page.evaluate("""() => ({
      count:document.querySelector('#intro-count').textContent,
      expected:`1 / ${D.introHistoryPages.length} · 1 / ${D.introHistoryPages[0].beats.length}`,
      pageCount:D.introHistoryPages.length,
      beats:D.introHistoryPages.reduce((n,p)=>n+p.beats.length,0),
      hasCurrentRepair:D.introHistoryPages.some(p=>p.beats.some(t=>t.timeKind==='current'))
    })""")
    check('선택 역사 읽기는 첫 문장부터 시작하고 현재 출발 행동을 대신 결정하지 않는다',
          history['count'] == history['expected'] and history['pageCount'] > 0 and not history['hasCurrentRepair'], str(history))
    page.screenshot(path=str(SHOT / '01-optional-history.png'))
    for _ in range(history['beats'] + 2):
        if not page.locator('#scr-intro').is_visible():
            break
        page.locator('#scr-intro').press('Enter')
        page.wait_for_timeout(25)
    check('전체 역사 읽기 뒤 짐 선택을 보존하고 출발 준비로 돌아온다',
          page.locator('#scr-name').is_visible() and page.locator('#profile-pick [role="radio"][aria-checked="true"]').get_attribute('data-pack') == selected_pack)
    page.click('#bt-name')
    for _ in range(300):
        if page.evaluate("!!S?.flags?.main_mission_started&&!document.querySelector('#ev-wrap')?.classList.contains('on')"):
            break
        name = page.locator('#opening-name:visible')
        if name.count():
            name.fill('테스터')
        next_button = page.locator('#ev-sheet .story-next:visible:not([disabled])')
        choices = page.locator('#ev-sheet .choice:visible:not([disabled])')
        exits = page.locator('#ev-sheet [data-r]:visible:not([disabled]),#ev-sheet .primary-exit-btn:visible:not([disabled])')
        if next_button.count():
            next_button.first.click()
        elif choices.count():
            choices.first.click()
        elif exits.count():
            exits.first.click()
        else:
            page.wait_for_timeout(40)
        page.wait_for_timeout(25)
    check('실제 도윤 대화의 이름과 출발 선택을 보존하고 길로 진입한다',
          page.locator('#scr-game').is_visible() and page.evaluate("S.name==='테스터'&&!!S.flags.main_mission_started&&!document.querySelector('#ev-wrap').classList.contains('on')"))

    print('― 단순화한 전체 소리 설정')
    page.click('#dk-menu')
    sliders = page.locator('#menu-volume:visible')
    check('메뉴에는 전체 음량 조절 하나가 있다', sliders.count() == 1)
    defaults = page.evaluate("['music','ambience','effects','voice'].map(key=>SND.level(key))")
    check('새 기기의 네 채널은 음소거가 아닌 100%로 시작한다', defaults == [1, 1, 1, 1], str(defaults))
    page.locator('#menu-volume:visible').evaluate("""input => {
      input.value='35'; input.dispatchEvent(new Event('input',{bubbles:true}));
    }""")
    mixer = page.evaluate("""() => ({
      levels:['music','ambience','effects','voice'].map(key=>SND.level(key)),
      saved:['music','ambience','effects','voice'].map(key=>localStorage.getItem('caravan_audio_'+key)),
      targets:['#menu-sound-toggle','.menu-volume-row','#menu-save-now','#menu-save-transfer']
        .map(selector=>document.querySelector(selector).getBoundingClientRect().height)
    })""")
    check('전체 음량이 네 채널에 즉시 반영되고 이 기기에 저장된다',
          mixer['levels'] == [.35, .35, .35, .35] and mixer['saved'] == ['0.35'] * 4, str(mixer))
    check('믹서의 모든 조작 행은 44px 터치 영역이다', all(height >= 44 for height in mixer['targets']), str(mixer['targets']))
    page.locator('.menu-control-list:visible').scroll_into_view_if_needed()
    page.screenshot(path=str(SHOT / '02-audio-mixer.png'))
    page.click('#menu-x')

    print('― 밀양 현장 행동 발견성')
    page.evaluate("""() => {
      S.at='miryang'; S.driving=null; S.party=['minji'];
      S._stlField={daily:{},once:{},impact:{},log:[]};
      UI.showStl('miryang','alley');
    }""")
    switcher = page.evaluate("""() => ({
      ids:[...document.querySelectorAll('.field-board-list [data-fieldspot]')].map(node=>node.dataset.fieldspot),
      heights:[...document.querySelectorAll('.field-board-list [data-fieldspot]')].map(node=>node.getBoundingClientRect().height)
    })""")
    check('현재 현장 작업판에 기본 행동 세 곳이 표시된다',
          switcher['ids'] == ['noodles', 'parts', 'pump'], str(switcher))
    check('현장 작업판의 세 선택 행은 모두44px 이상이다',
          len(switcher['heights']) == 3 and all(height >= 44 for height in switcher['heights']), str(switcher['heights']))
    page.click('.stl-field-switcher [data-fieldspot="pump"]')
    field_focus = page.evaluate("""() => ({
      cardVisible:document.querySelector('[data-fieldcard="pump"]').offsetParent!==null,
      cardFocused:document.querySelector('[data-fieldcard="pump"]').classList.contains('focused'),
      pressed:[...document.querySelectorAll('[data-fieldspot="pump"]')].every(node=>node.getAttribute('aria-pressed')==='true')
    })""")
    check('선택기에서 펌프를 고르면 실행 카드와 접근성 상태가 함께 바뀐다',
          all(field_focus.values()), str(field_focus))
    page.locator('.field-board-list').scroll_into_view_if_needed()
    page.screenshot(path=str(SHOT / '03-miryang-switcher.png'))

    print('― 모바일 전투 정보 밀도')
    page.evaluate("""() => {
      document.querySelector('#ovl-stl').classList.remove('on');
      S.combat=null; S.injuries={}; S.pursuit=0; S.van=S.vanMax;
      UI.showEvent(D.events.find(event=>event.id==='patrol_walker'));
      UI.finishStory();
      document.querySelector('#ev-sheet').getAnimations().forEach(animation=>animation.finish());
    }""")
    page.wait_for_timeout(180)
    combat = page.evaluate("""() => {
      const choices=[...document.querySelectorAll('#ev-sheet .choice')];
      const rects=choices.map(node=>node.getBoundingClientRect());
      const overlaps=rects.some((rect,index)=>index>0 && rect.top < rects[index-1].bottom-.5);
      const choiceCopy=choices.map(node=>`${node.textContent} ${node.getAttribute('aria-label')||''}`).join(' ');
      const list=document.querySelector('.event-choice-dock>.choices');
      return {
        choiceCount:choices.length,
        overlaps,
        forecastNodes:document.querySelectorAll('#ev-sheet .combat-odds, #ev-sheet .combat-risk, #ev-sheet .combat-forecast').length,
        predictionLeak:/판정 전망|실패하면|가장 나은|가장 위험|\\d+\\s*%/.test(choiceCopy),
        stateCount:document.querySelectorAll('.combat-state span').length,
        solid:choices.every(node=>!getComputedStyle(node).backgroundColor.includes('rgba')),
        contained:rects.every(rect=>rect.left>=list.getBoundingClientRect().left-.5 && rect.right<=list.getBoundingClientRect().right+.5),
        listOverflow:getComputedStyle(list).overflowY
      };
    }""")
    check('기본 전투 카드는 성공 전망·실패 결과 없이 행동만 표시한다',
          combat['choiceCount'] >= 2 and combat['forecastNodes'] == 0 and not combat['predictionLeak']
          and combat['stateCount'] <= 3, str(combat))
    check('전투 선택은 독립 스크롤 영역 안에서 겹치거나 비치지 않는다',
          not combat['overlaps'] and combat['solid'] and combat['contained'] and combat['listOverflow'] == 'auto', str(combat))
    page.screenshot(path=str(SHOT / '04-combat-density.png'))
    check('콘솔/런타임 오류 0건', not errors, str(errors[:5]))
    browser.close()

if failures:
    print('\n실패 목록:')
    for failure in failures:
        print(f'- {failure}')
    raise SystemExit(1)
print(f'\n✅ 8.0 업그레이드 회귀 전부 통과 ({len(checks)} checks)')
