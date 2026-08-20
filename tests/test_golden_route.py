#!/usr/bin/env python3
"""부산 출발·정차 콘솔·밀양 동료 조우 골든 루트 회귀 검사."""
import os
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
    page.fill('#inp-name', '하린')
    page.click('#bt-name')
    page.wait_for_timeout(100)
    page.evaluate('UI.skipIntro()')
    page.wait_for_timeout(180)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")

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

    dock_geometry = page.evaluate('''() => {
      const dock=document.querySelector('#dock');
      const dockBox=dock.getBoundingClientRect();
      const buttons=[...dock.querySelectorAll('button')];
      const target=[.1244,.3109,.4936,.6814,.8692];
      const measured=buttons.map((button,index)=>{
        const box=button.getBoundingClientRect();
        const face=getComputedStyle(button,'::before');
        const left=parseFloat(face.left)+parseFloat(face.marginLeft);
        const faceCenter=(box.left-dockBox.left+left+parseFloat(face.width)/2)/dockBox.width;
        const iconBox=button.querySelector('.dic').getBoundingClientRect();
        const labelBox=button.querySelector('span:last-child').getBoundingClientRect();
        return {
          target:target[index],
          hitWidth:box.width,
          faceCenter,
          iconCenter:(iconBox.left+iconBox.width/2-dockBox.left)/dockBox.width,
          labelCenter:(labelBox.left+labelBox.width/2-dockBox.left)/dockBox.width
        };
      });
      return {dockWidth:dockBox.width,measured};
    }''')
    hit_widths = [row['hitWidth'] for row in dock_geometry['measured']]
    center_errors = [
        abs(row[key] - row['target'])
        for row in dock_geometry['measured']
        for key in ('faceCenter', 'iconCenter', 'labelCenter')
    ]
    check('동일한 20% 터치 영역 안에서 면·아이콘·라벨이 셸 우물 중심에 함께 맞는다',
          max(hit_widths) - min(hit_widths) <= 1 and max(center_errors) <= .001,
          str(dock_geometry))

    dock_rest = page.evaluate('''() => {
      const road=document.querySelector('#dk-road');
      const map=document.querySelector('#dk-map');
      return {
        sameFace:getComputedStyle(road,'::before').backgroundImage===getComputedStyle(map,'::before').backgroundImage,
        roadDepth:getComputedStyle(road,'::before').transform,
        mapDepth:getComputedStyle(map,'::before').transform
      };
    }''')
    check('첫 화면의 길 버튼은 선택 표시만 있고 다른 버튼처럼 솟아 있다',
          dock_rest['sameFace'] and dock_rest['roadDepth'] == dock_rest['mapDepth'], str(dock_rest))

    map_box = page.locator('#dk-map').bounding_box()
    page.mouse.move(map_box['x'] + map_box['width'] / 2, map_box['y'] + map_box['height'] / 2)
    page.mouse.down()
    dock_press = page.evaluate('''() => {
      const button=document.querySelector('#dk-map');
      const face=getComputedStyle(button,'::before');
      const icon=getComputedStyle(button.querySelector('.dic'));
      const label=getComputedStyle(button.querySelector('span:last-child'));
      return {
        changedFace:face.backgroundImage!==getComputedStyle(document.querySelector('#dk-road'),'::before').backgroundImage,
        faceDepth:face.transform,
        iconDepth:icon.transform,
        labelDepth:label.transform
      };
    }''')
    page.mouse.move(0, 0)
    page.mouse.up()
    check('누르는 동안에만 버튼 면과 내용이 같은 깊이로 내려간다',
          dock_press['changedFace'] and dock_press['faceDepth'] == dock_press['iconDepth'] == dock_press['labelDepth'],
          str(dock_press))

    page.locator('#dk-menu').focus()
    page.keyboard.press('Shift+Tab')
    page.keyboard.press('Shift+Tab')
    dock_focus = page.evaluate('''() => {
      const button=document.querySelector('#dk-map');
      return {
        outline:getComputedStyle(button).outlineStyle,
        labelGlow:getComputedStyle(button.querySelector('span:last-child')).textShadow
      };
    }''')
    page.evaluate("document.querySelector('#dk-map').blur()")
    check('키보드 초점은 노란 사각형 대신 버튼 내용의 빛으로 보인다',
          dock_focus['outline'] == 'none' and dock_focus['labelGlow'] != 'none', str(dock_focus))

    mode_initial = page.evaluate('''() => ({
      tabs:[...document.querySelectorAll('.journey-mode-tabs [data-journey-mode]')].map(button=>button.textContent.trim()),
      selected:document.querySelector('.journey-mode-tabs [data-journey-mode][aria-selected="true"]')?.dataset.journeyMode,
      consoles:document.querySelectorAll('.journey-mode-console').length,
      route:!!document.querySelector('.route-console-v3')
    })''')
    check('정차 기능은 목적지·머물기 두 모드만 가진 한 콘솔에서 전환한다',
          mode_initial['tabs'] == ['목적지', '머물기'] and mode_initial['selected'] == 'route' and
          mode_initial['consoles'] == 1 and mode_initial['route'], str(mode_initial))
    stopped_geometry = page.evaluate('''() => {
      const shell=document.querySelector('.route-console');
      const dock=document.querySelector('#dock');
      const readout=document.querySelector('#road-status');
      const tabs=document.querySelector('.journey-mode-tabs');
      return {
        stageHeight:document.querySelector('#stage')?.getBoundingClientRect().height||0,
        shellBottom:shell?.getBoundingClientRect().bottom||0,
        dockTop:dock?.getBoundingClientRect().top||0,
        readoutBottom:readout?.getBoundingClientRect().bottom||0,
        tabsTop:tabs?.getBoundingClientRect().top||0
      };
    }''')
    stopped_gap = stopped_geometry['dockTop'] - stopped_geometry['shellBottom']
    check('정차 콘솔은 중복 계기판 없이 하단의 빈 띠를 줄이고 풍경과 길 선택을 넓게 쓴다',
          stopped_geometry['stageHeight'] >= 246 and 0 <= stopped_gap <= 26 and
          stopped_geometry['tabsTop'] > stopped_geometry['readoutBottom'],
          str({**stopped_geometry, 'dockGap': stopped_gap}))
    page.set_viewport_size({'width': 895, 'height': 955})
    # resize 디바운스 80ms와 2프레임 실측 보정이 모두 끝난 뒤 측정한다.
    page.wait_for_timeout(180)
    desktop_geometry = page.evaluate('''() => {
      const shell=document.querySelector('.route-console')?.getBoundingClientRect();
      const dock=document.querySelector('#dock')?.getBoundingClientRect();
      return {
        stageHeight:document.querySelector('#stage')?.getBoundingClientRect().height||0,
        shellBottom:shell?.bottom||0,
        dockTop:dock?.top||0,
        gap:(dock?.top||0)-(shell?.bottom||0)
      };
    }''')
    check('900px 바로 아래의 넓은 화면은 풍경을 유지하고 콘솔과 도크를 겹치지 않는다',
          desktop_geometry['stageHeight'] >= 279 and 0 <= desktop_geometry['gap'] <= 88,
          str(desktop_geometry))
    page.set_viewport_size({'width': 360, 'height': 700})
    page.wait_for_timeout(180)
    page.click('[data-journey-mode="route"]')
    nav_initial = page.evaluate('''() => ({
      console:!!document.querySelector('.route-console'),
      routes:[...new Set([...document.querySelectorAll('[data-route-select]')].map(button=>button.dataset.routeSelect))],
      hazards:document.querySelectorAll('.nav-hazard-row').length,
      facts:document.querySelectorAll('.nav-route-facts>span').length,
      unknowns:document.querySelectorAll('.nav-unknown-list>span').length,
      selected:document.querySelector('[data-route-select][aria-pressed="true"]')?.dataset.routeSelect,
      height:document.querySelector('.route-console')?.getBoundingClientRect().height||0,
      copy:document.querySelector('.route-console')?.textContent||'',
      titleSize:parseFloat(getComputedStyle(document.querySelector('.nav-map-destination-badge b')).fontSize),
      descriptionSize:parseFloat(getComputedStyle(document.querySelector('.nav-place-description')).fontSize),
      valueSize:parseFloat(getComputedStyle(document.querySelector('.nav-route-facts b')).fontSize),
      journeyContext:document.querySelector('.nav-journey-context')?.textContent||'',
      departHint:document.querySelector('[data-route-select][aria-pressed="true"] .nav-depart-hint')?.textContent||''
    })''')
    check('정차 네비게이션은 현재 경로 수치만 보이고 사전 신호나 만남을 예고하지 않는다',
          nav_initial['console'] and set(nav_initial['routes']) == {'yangsan', 'gimhae'} and
          nav_initial['hazards'] == 0 and nav_initial['facts'] == 3 and nav_initial['unknowns'] == 0 and
          '무너진 고가 아래로 길이 하나 살아 있다' in nav_initial['copy'] and
          '거리' in nav_initial['copy'] and '이동 시간' in nav_initial['copy'] and
          '연료 소모' in nav_initial['copy'] and
          nav_initial['titleSize'] >= 11 and nav_initial['descriptionSize'] >= 9 and nav_initial['valueSize'] >= 10 and
          not any(word in nav_initial['copy'] for word in ['만날','사람','위험','신호','미확인']),
          str(nav_initial))
    check('길 선택 화면은 주 여정·동행 맥락과 선택한 길의 출발 상태를 함께 보여 준다',
          '주 여정' in nav_initial['journeyContext'] and '동행' in nav_initial['journeyContext'] and
          nav_initial['departHint'] == '출발', str(nav_initial))
    page.click('[data-journey-mode="local"]')
    stop_console = page.evaluate('''() => {
      const action=document.querySelector('.stop-action-console');
      return {
        actionCopy:action?.textContent||'',
        explore:!!action?.querySelector('[data-a="explore"]:not([disabled])'),
        images:action?.querySelectorAll('.stop-action-card img').length||0,
        height:action?.closest('.route-console')?.getBoundingClientRect().height||0,
        panels:document.querySelectorAll('.journey-mode-panel').length,
        visiblePanels:[...document.querySelectorAll('.journey-mode-panel')].filter(panel=>!panel.hidden).length
      };
    }''')
    check('머물기 행동은 별도 제목 없이 바로 네 가지 행동을 보여 준다',
          stop_console['explore'] and '머물며 할 일' not in stop_console['actionCopy'] and
          '2시간' in stop_console['actionCopy'] and '발견물 미확인' in stop_console['actionCopy'] and
          '탐색 위험' not in stop_console['actionCopy'] and stop_console['images'] == 0 and
          stop_console['panels'] == 2 and stop_console['visiblePanels'] == 1, str(stop_console))
    local_layout = page.evaluate('''() => {
      const console=document.querySelector('.stop-action-console');
      return {
        visible:console?.querySelectorAll('.stop-action-card').length||0,
        nestedScroll:console ? console.scrollHeight > console.clientHeight + 1 : true
      };
    }''')
    check('머물기 콘솔은 기본 행동 네 개를 더보기 없이 한 화면에 보여 준다',
          local_layout['visible'] == 4 and not local_layout['nestedScroll'] and
          page.locator('[data-local-more]').count() == 0, str(local_layout))
    page.evaluate("S.recruitQ={id:'minji',stage:'task',target:'busan',startedDay:S.day}; UI.renderAll()")
    direct_actions = page.evaluate('''() => ({
      count:document.querySelectorAll('.stop-action-console .stop-action-card').length,
      hasCamp:!!document.querySelector('.stop-action-console [data-a="camp"]'),
      hasRepair:!!document.querySelector('.stop-action-console [data-a="repair"]'),
      hasRadio:!!document.querySelector('.stop-action-console [data-a="radio"]'),
      hasMore:!!document.querySelector('[data-local-more]')
    })''')
    check('동료 행동이 추가되어도 야영·정비·라디오는 머물기 화면 안에 그대로 남는다',
          direct_actions['count'] == 5 and direct_actions['hasCamp'] and direct_actions['hasRepair'] and
          direct_actions['hasRadio'] and not direct_actions['hasMore'], str(direct_actions))
    page.evaluate("document.querySelector('.stop-action-console [data-a=camp]').click()")
    check('머물기 모드의 야영 준비는 실제 차 안 준비 화면을 연다',
          page.locator('#ovl-camp.on').count() == 1 and page.locator('#camp-rest').count() == 1)
    page.click('#camp-x')
    page.evaluate("S.recruitQ=null; UI.renderAll()")
    check('목적지·머물기 두 콘솔의 외형 높이가 같고 달구지 탭은 남지 않는다',
          abs(nav_initial['height'] - stop_console['height']) <= 1 and
          page.locator('[data-journey-mode="vehicle"], #ovl-vehicle-detail').count() == 0,
          str({'route': nav_initial['height'], 'local': stop_console['height']}))
    page.click('[data-journey-mode="route"]')
    hidden_future = page.evaluate('''() => {
      const console=document.querySelector('.route-console');
      const copy=console?.textContent||'';
      const canvas=console?.querySelector('[data-nav-map]');
      return {
        inspector:!!console?.querySelector('[data-nav-inspector]'),
        hazardRows:console?.querySelectorAll('.nav-hazard-row').length||0,
        hotspots:(canvas?._navHazardHotspots||[]).length,
        exactHazard:copy.includes('고가 낙하물'),
        predictiveCopy:/만날|사람|위험|신호|미확인|예상/.test(copy),
        futureArrow:/연료\\s*\\d+\\s*→/.test(copy),
        hasKnownTravel:copy.includes('이동 시간')&&copy.includes('연료 소모')
      };
    }''')
    check('위험·인물·도착 후 자원은 출발 전에 인터페이스로 노출되지 않는다',
          not hidden_future['inspector'] and hidden_future['hazardRows'] == 0 and
          hidden_future['hotspots'] == 0 and not hidden_future['exactHazard'] and
          not hidden_future['predictiveCopy'] and not hidden_future['futureArrow'] and
          hidden_future['hasKnownTravel'], str(hidden_future))
    page.click('[data-nav-next]')
    nav_compare = page.evaluate('''() => ({
      driving:!!S.driving,
      selected:document.querySelector('.route-console')?.dataset.routeConsole,
      depart:document.querySelector('[data-nav-depart]')?.dataset.navDepart,
      title:document.querySelector('.nav-map-destination-badge b')?.textContent
    })''')
    check('다른 길 선택은 즉시 출발하지 않고 비교할 목적지만 바꾼다',
          not nav_compare['driving'] and nav_compare['selected'] == 'gimhae' and
          nav_compare['depart'] == 'gimhae' and '김해' in nav_compare['title'], str(nav_compare))
    page.click('[data-nav-next]')
    page.click('[data-nav-depart="yangsan"]')
    check('네비게이션 출발 확인이 선택한 실제 주행을 시작한다',
          page.evaluate("S.driving&&S.driving.to==='yangsan'"))
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
