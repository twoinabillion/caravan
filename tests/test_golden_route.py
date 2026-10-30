#!/usr/bin/env python3
"""부산 출발·정차 콘솔·밀양 동료 조우 골든 루트 회귀 검사."""
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / '서울까지400km.html').as_uri()
failures = []


def check(label, ok, detail=''):
    mark = '✅' if ok else '❌'
    print(f'{mark} {label}' + (f' — {detail}' if not ok and detail else ''))
    if not ok:
        failures.append(f'{label}: {detail}')


def finish_open_event(page, choice_index, action='ok'):
    page.evaluate('UI.finishStory()')
    choice = page.locator(f'#ev-sheet [data-i="{choice_index}"]')
    assert choice.count() == 1 and choice.is_enabled(), f'선택지 {choice_index} 사용 불가'
    choice.click()
    page.evaluate('UI.finishStory()')
    action_btn = page.locator(f'#ev-sheet [data-r="{action}"]')
    assert action_btn.count() == 1 and action_btn.is_enabled(), f'결과 행동 {action} 사용 불가'
    action_btn.click()


with sync_playwright() as p:
    browser = p.chromium.launch(channel=os.environ.get('CARAVAN_BROWSER_CHANNEL') or None)
    # 작은 안드로이드 WebView까지 골든 루트의 실제 터치 흐름을 보장한다.
    page = browser.new_page(viewport={'width': 360, 'height': 700})
    console_errors = []
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
    page.on('pageerror', lambda exc: console_errors.append(str(exc)))
    page.add_init_script("window.ReactNativeWebView={postMessage(){}}; localStorage.setItem('caravan_story_auto','0')")
    page.goto(GAME)
    page.click('#bt-new')
    if page.locator('#scr-mode').is_visible():
        page.click('#mode-on')
    page.locator('[data-pack]').first.click()
    page.click('#bt-name')
    page.wait_for_timeout(100)
    page.evaluate('UI.skipIntro()')
    page.wait_for_timeout(180)
    opening_ids = []
    while page.evaluate('!!G.openingPending()'):
        opening_ids.append(page.evaluate('G.openingPending().id'))
        page.evaluate('UI.finishStory()')
        name_input = page.locator('#ev-sheet input')
        if name_input.count():
            name_input.first.fill('하린')
        page.locator('.event-choice-dock .choice:not([disabled])').first.click()
        page.evaluate('UI.finishStory()')
        page.locator('.event-choice-dock .primary-exit-btn').click()
        page.wait_for_timeout(100)
        assert len(opening_ids) <= 8, '출발 장면이 끝나지 않음'
    check('출발 장면과 이름 입력을 실제 선택으로 마친다',
          page.evaluate('S.opening.completed && !!S.name') and
          'opening_workshop' in opening_ids and 'opening_departure' in opening_ids, str(opening_ids))
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")
    page.evaluate("document.querySelector('#ev-wrap')?.classList.remove('on')")
    page.evaluate("S._storyQueue=[]; S._chain=null")
    page.wait_for_timeout(900)
    page.evaluate("""() => {
      document.querySelector('#ev-wrap')?.classList.remove('on');
      document.querySelector('#quest-update-ribbon')?.remove();
      S._storyQueue=[]; S._chain=null;
    }""")

    start = page.evaluate('''() => ({
      at:S.at, day:S.day, min:S.min, fuel:S.fuel, scrap:S.scrap,
      route:G.canTravelTo('yangsan')
    })''')
    check('부산에서 양산 골든 루트가 즉시 열린다', start['at'] == 'busan' and start['route']['ok'], str(start))
    compact = page.evaluate('''() => ({
      viewport:document.documentElement.clientWidth,
      content:document.documentElement.scrollWidth,
      dock:document.querySelector('#dock')?.getBoundingClientRect().width||0
    })''')
    check('360px 모바일 첫 화면에 가로 넘침이 없다',
          compact['content'] <= compact['viewport'] and compact['dock'] <= compact['viewport'], str(compact))

    dock = page.evaluate('''() => {
      const d=document.querySelector('#dock'),r=d.getBoundingClientRect();
      return {width:r.width,buttons:[...d.querySelectorAll('button')].map(b=>({
        label:b.textContent.trim(),width:b.getBoundingClientRect().width,
        icon:!!b.querySelector('.dic'),current:b.getAttribute('aria-current')}))};
    }''')
    check('다섯 주요 메뉴는 모바일 화면 안에 고른 터치 영역과 아이콘을 제공한다',
          [b['label'] for b in dock['buttons']] == ['길','목표','동료','가방','메뉴'] and
          all(b['width'] >= 44 and b['icon'] for b in dock['buttons']) and
          max(b['width'] for b in dock['buttons'])-min(b['width'] for b in dock['buttons']) <= 1 and
          dock['buttons'][0]['current'] == 'page' and dock['width'] <= 360, str(dock))
    page.locator('#dk-menu').focus()
    page.keyboard.press('Shift+Tab')
    page.keyboard.press('Shift+Tab')
    focus = page.evaluate('''() => {
      const b=document.querySelector('#dk-crew'),s=getComputedStyle(b);
      return {active:document.activeElement===b,outline:s.outlineStyle,width:parseFloat(s.outlineWidth)};
    }''')
    check('키보드로 동료 메뉴에 이동하면 초점 표시가 보인다',
          focus['active'] and focus['outline'] != 'none' and focus['width'] >= 2, str(focus))
    page.evaluate("document.querySelector('#dk-crew').blur()")
    tabs=page.locator('.journey-tabs [data-journey-mode]')
    check('정차 콘솔은 목적지와 머물기 두 모드를 제공한다',
          tabs.all_text_contents() == ['목적지','머물기'] and
          page.locator('button[data-journey-mode="route"]').get_attribute('aria-selected') == 'true')
    route=page.evaluate('''() => ({
      selected:document.querySelector('[data-route-console]')?.dataset.routeConsole,
      title:document.querySelector('[data-trip-destination]')?.textContent.trim(),
      forecast:document.querySelector('.trip-forecast')?.textContent||'',
      depart:document.querySelector('[data-nav-depart]')?.dataset.navDepart,
      disabled:document.querySelector('[data-nav-depart]')?.disabled,
      overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth
    })''')
    check('목적지 화면은 선택한 양산 경로와 시간·연료를 표시한다',
          route['selected']=='yangsan' and route['depart']=='yangsan' and not route['disabled'] and
          '양산' in route['title'] and 'km' in route['forecast'] and '연료' in route['forecast'] and
          not route['overflow'], str(route))
    disclosure=page.evaluate('''() => ({
      context:document.querySelector('#road-quest-tracker')?.textContent||'',
      copy:document.querySelector('[data-route-console]')?.textContent||'',
      preview:document.querySelector('.journey-place-preview')?.textContent||''
    })''')
    check('길 화면에는 본편 목표가 표시되고 미래 사건·도착 후 자원은 공개되지 않는다',
          '메인 스토리' in disclosure['context'] and
          not any(x in disclosure['preview'] for x in ['만날','위험','신호','미확인','예상']) and
          '고가 낙하물' not in disclosure['copy'] and
          not re.search(r'연료\s*\d+\s*→', disclosure['copy']), str(disclosure))
    page.set_viewport_size({'width': 900, 'height': 700})
    wide = page.evaluate('''() => ({
      viewport:document.documentElement.clientWidth,
      content:document.documentElement.scrollWidth,
      dock:document.querySelector('#dock').getBoundingClientRect().width,
      route:document.querySelector('[data-nav-depart]').getBoundingClientRect().width,
      routeBottom:document.querySelector('[data-nav-depart]').getBoundingClientRect().bottom,
      dockTop:document.querySelector('#dock').getBoundingClientRect().top
    })''')
    check('넓은 화면에서도 경로와 메뉴가 화면 안에 표시된다',
          wide['content'] <= wide['viewport'] and 0 < wide['dock'] <= wide['viewport'] and
          wide['route'] >= 44 and wide['routeBottom'] <= wide['dockTop'], str(wide))
    page.set_viewport_size({'width': 360, 'height': 700})
    page.click('[data-trip-destination]')
    picker=page.locator('#trip-destination-dialog')
    check('목적지 목록에 양산과 김해가 비교 가능한 선택지로 열린다',
          picker.evaluate('(e)=>e.open') and set(picker.locator('[data-trip-route]').evaluate_all('(es)=>es.map(e=>e.dataset.tripRoute)')) == {'yangsan','gimhae'})
    page.click('[data-trip-route="gimhae"]')
    check('다른 목적지 선택만으로 출발하지 않는다',
          not page.evaluate('!!S.driving') and page.locator('[data-nav-depart]').get_attribute('data-nav-depart') == 'gimhae')
    page.click('[data-trip-destination]')
    page.click('[data-trip-route="yangsan"]')
    # 합성 동료 의뢰 상태에서 기본 정차 행동이 사라지지 않는지 별도로 확인한다.
    page.evaluate("S.recruitQ={id:'minji',stage:'task',target:'busan',startedDay:S.day}; UI.renderAll()")
    page.click('button[data-journey-mode="local"]')
    page.click('[data-stay-choice]')
    companion_actions=page.locator('#stay-action-dialog [data-stay-select]').evaluate_all('(es)=>es.map(e=>e.dataset.staySelect)')
    check('동료 의뢰 중에도 야영·정비·라디오 선택이 남는다',
          {'camp','repair','radio'}.issubset(set(companion_actions)), str(companion_actions))
    page.click('#stay-action-dialog [data-stay-picker-close]')
    page.evaluate("S.recruitQ=null; UI.renderAll()")
    page.click('button[data-journey-mode="local"]')
    page.click('[data-stay-choice]')
    stay_options=page.locator('#stay-action-dialog [data-stay-select]')
    check('머물기 목록에서 야영과 정비를 찾을 수 있다',
          {'camp','repair'}.issubset(set(stay_options.evaluate_all('(es)=>es.map(e=>e.dataset.staySelect)'))))
    page.click('#stay-action-dialog [data-stay-select="camp"]')
    page.click('#stay-detail [data-a="camp"]')
    check('야영 행동은 실제 준비 화면을 연다', page.locator('#ovl-camp.on').count() == 1)
    page.click('#camp-x')
    page.click('button[data-journey-mode="route"]')
    page.click('[data-nav-depart="yangsan"]')
    check('출발 버튼이 선택한 양산 주행을 시작한다', page.evaluate("S.driving&&S.driving.to==='yangsan'"))
    first_pool = page.evaluate('''() => ({
      slots:S.driving.slots.length,
      waypoints:S.driving.slots.filter(slot=>slot.waypoint).map(slot=>slot.waypoint),
      priority:G.eligible().filter(e=>e.priority).map(e=>e.id)
    })''')
    check('첫 도로에는 최소 한 번의 사건 자리가 있다', first_pool['slots'] >= 1, str(first_pool))
    check('민지 조우는 일반 도로와 부산→양산 경유지에 섞이지 않는다',
          first_pool['waypoints'] == [] and first_pool['priority'] == [], str(first_pool))

    # 첫 구간은 실제 엔진으로 도착시키되, 무작위 사건은 이 골든 루트에서 분리한다.
    page.evaluate('''() => {
      const old=UI.onArrive; UI.onArrive=()=>{UI.renderAll();return 0};
      S.driving.slots=[]; S.driving.si=0;
      const wx=S.wx==='storm'?.76:S.wx==='fog'?.88:1;
      const ftg=S.fatigue>=80?.85:1;
      const perSec=G.tickKmPerSecond();
      G.tick(S.driving.dist/(perSec*wx*ftg)+.02);
      UI.onArrive=old;
    }''')
    arrival = page.evaluate("({at:S.at,driving:!!S.driving,known:[...S.known]})")
    check('부산에서 출발한 첫 구간은 양산 정차로 정상 종료된다',
          arrival['at'] == 'yangsan' and not arrival['driving'], str(arrival))

    # 민지의 첫 만남은 도로 랜덤 사건이 아니라 밀양 장터의 실제 인물 슬롯이다.
    page.evaluate('''() => {
      S.at='miryang'; S.driving=null; S.recruitQ=null; S.party=[];
      S.used=S.used.filter(id=>id!=='meet_scrapyard');
      if(!S.known.includes('miryang')) S.known.push('miryang');
      UI.renderAll();
      UI.showStl('miryang','people');
    }''')
    meet_slot = page.evaluate('''() => ({
      row:!!document.querySelector('[data-person-key="recruit-minji"]'),
      location:D.eventLocations.meet_scrapyard,
      title:document.querySelector('[data-person-key="recruit-minji"]')?.textContent||''
    })''')
    check('밀양 장터 사람 목록에서 민지를 직접 찾아갈 수 있다',
          meet_slot['row'] and meet_slot['location'] == {'kind': 'node', 'nodes': ['miryang']} and
          '민지' in meet_slot['title'], str(meet_slot))

    page.click('[data-person-key="recruit-minji"]')
    page.click('#people-action')
    meeting = page.evaluate('''() => ({
      title:document.querySelector('#ev-sheet h2')?.textContent||'',
      stopover:S.stopover,
      driving:!!S.driving
    })''')
    check('민지의 첫 장면은 도로가 아니라 밀양 부품 천막에서 열린다',
          meeting['title'] == '부품 천막의 정비사' and meeting['stopover'] is None and
          not meeting['driving'], str(meeting))

    finish_open_event(page, 1)
    check('민지의 부탁을 이어서 확인한다',
          page.locator('#ev-sheet').get_attribute('data-event-id') == 'rq_minji_request')
    finish_open_event(page, 0)
    recruit = page.evaluate('''() => ({
      id:S.recruitQ&&S.recruitQ.id,
      stage:S.recruitQ&&S.recruitQ.stage,
      target:S.recruitQ&&S.recruitQ.target,
      metAt:S.recruitQ&&S.recruitQ.metAt,
      used:S.used.includes('meet_scrapyard')
    })''')
    check('첫 대화 뒤 민지는 울산 현장까지 가는 임시 동행 의뢰로 이어진다',
          recruit == {'id': 'minji', 'stage': 'task', 'target': 'ulsan',
                      'metAt': 'miryang', 'used': True}, str(recruit))

    # 정착지 허브와 골목도 작은 모바일 화면에서 실제 탐색 공간을 유지한다.
    page.evaluate("S.party=['minji']; UI.showStl('miryang','hub')")
    hub = page.evaluate('''() => ({
      spots:[...document.querySelectorAll('[data-stlfocus]')].map(b=>b.dataset.stlfocus),
      player:!!SCENE.settlementState()?.player,
      companions:(SCENE.settlementState()?.companions||[]).map(person=>person.id)
    })''')
    check('밀양은 시장·정비소·사람들·골목의 네 공간을 갖는다',
          hub['spots'] == ['market', 'garage', 'people', 'alley'], str(hub))
    check('장터를 걸을 때 주인공과 동행 중인 민지가 함께 보인다',
          hub['player'] and hub['companions'] == ['minji'], str(hub))

    page.evaluate("UI.showStl('miryang','alley')")
    alley_scroll = page.evaluate('''() => {
      const panel=document.querySelector('.field-board-body');
      const last=document.querySelector('.stl-field-switcher [data-fieldspot="pump"]');
      last.scrollIntoView({block:'center'});
      const r=last.getBoundingClientRect();
      return {top:r.top,bottom:r.bottom,width:r.width,viewport:innerWidth,
        overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
        scrollable:panel.scrollHeight>panel.clientHeight};
    }''')
    check('360px에서도 장터 골목의 마지막 행동까지 스크롤해 누를 수 있다',
          alley_scroll['top'] >= 0 and alley_scroll['bottom'] <= 700 and
          alley_scroll['width'] <= alley_scroll['viewport'] and not alley_scroll['overflow'],
          str(alley_scroll))
    check('골든 루트 콘솔 오류 0건', not console_errors, str(console_errors[:5]))
    browser.close()

if failures:
    raise SystemExit('\n'.join(failures))
print('\n✅ 부산 출발·정차 콘솔·밀양 동료 조우 골든 루트 전부 통과')
