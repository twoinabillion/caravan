#!/usr/bin/env python3
"""Focused regressions for the pacing, mobile interaction, and audio 8.0 upgrade."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / '서울까지400km.html').as_uri()
SHOT = ROOT / 'tests' / 'shots' / 'quality8'
SHOT.mkdir(parents=True, exist_ok=True)
failures = []


def check(label, ok, detail=''):
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
    if page.locator('#scr-mode').is_visible():
        page.click('#mode-on')
    page.fill('#inp-name', '테스터')
    page.click('#bt-name')
    page.wait_for_timeout(100)
    check('첫 여행에도 핵심 요약이 보인다', page.locator('#intro-skip').is_visible())
    page.click('#intro-skip')
    page.wait_for_timeout(50)
    summary = page.evaluate("""() => ({
      open:document.querySelector('#intro-summary').classList.contains('on'),
      points:document.querySelectorAll('#intro-summary li').length,
      focus:document.activeElement.id,
      copy:document.querySelector('#intro-summary').textContent
    })""")
    check('요약은 네 개의 출발 근거와 직접 출발 선택을 제공한다',
          summary['open'] and summary['points'] == 4 and summary['focus'] == 'intro-summary-start' and
          '다음 이송표는 계속 발행된다' in summary['copy'] and '남산' in summary['copy'], str(summary))
    page.screenshot(path=str(SHOT / '01-intro-summary.png'))
    page.click('#intro-summary-continue')
    check('전체 프롤로그로 손실 없이 돌아간다',
          not page.locator('#intro-summary').is_visible() and page.locator('#intro-book').is_visible())
    page.click('#intro-skip')
    page.click('#intro-summary-start')
    page.wait_for_timeout(150)
    page.evaluate("""() => {
      document.querySelector('#arrival-scene')?.classList.remove('on');
      document.querySelector('#ev-wrap')?.classList.remove('on');
      for(const id of ['onboarding_main_mission','onboarding_first_road']){
        const event=D.events.find(item=>item.id===id);
        if(event && !S.used.includes(event.id)) S.used.push(event.id);
      }
      S.flags.onboarding_mission_seen=true;
      S.flags.onboarding_first_road_seen=true;
      S._storyQueue=[];
      S._chain=null;
    }""")
    page.wait_for_timeout(900)
    page.evaluate("""() => {
      document.querySelector('#ev-wrap')?.classList.remove('on');
      document.querySelector('#quest-update-ribbon')?.remove();
      S._storyQueue=[]; S._chain=null;
    }""")
    check('요약 경로가 이름을 보존하고 게임으로 진입한다',
          page.locator('#scr-game').is_visible() and page.evaluate('S.name') == '테스터')

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
      targets:['#menu-sound-toggle','.menu-volume-row','#menu-save-now','#menu-save-export']
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
      ids:[...document.querySelectorAll('.stl-field-switcher [data-fieldspot]')].map(node=>node.dataset.fieldspot),
      heights:[...document.querySelectorAll('.stl-field-switcher [data-fieldspot]')].map(node=>node.getBoundingClientRect().height)
    })""")
    check('삽화 밖에도 기본 행동 세 곳이 항상 표시된다',
          switcher['ids'] == ['noodles', 'parts', 'pump'], str(switcher))
    check('현장 선택기는 44px 이상이고 가로 스크롤할 수 있다',
          all(height >= 44 for height in switcher['heights']), str(switcher['heights']))
    page.click('.stl-field-switcher [data-fieldspot="pump"]')
    field_focus = page.evaluate("""() => ({
      cardVisible:document.querySelector('[data-fieldcard="pump"]').offsetParent!==null,
      cardFocused:document.querySelector('[data-fieldcard="pump"]').classList.contains('focused'),
      pressed:[...document.querySelectorAll('[data-fieldspot="pump"]')].every(node=>node.getAttribute('aria-pressed')==='true')
    })""")
    check('선택기에서 펌프를 고르면 실행 카드와 접근성 상태가 함께 바뀐다',
          all(field_focus.values()), str(field_focus))
    page.locator('.stl-field-switcher').scroll_into_view_if_needed()
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
print('\n✅ 8.0 업그레이드 회귀 전부 통과')
