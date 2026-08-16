#!/usr/bin/env python3
"""부산→민지→밀양→대구 첫 90분 골든 루트 회귀 검사."""
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
      valueSize:parseFloat(getComputedStyle(document.querySelector('.nav-route-facts b')).fontSize)
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
    check('민지 조우는 일반 도로 풀에 섞이지 않고 실제 폐차장 경유지에 숨겨진다',
          first_pool['waypoints'] == ['meet_scrapyard'] and first_pool['priority'] == [], str(first_pool))

    # 실제 경유 거리까지 달려야 폐차장과 민지가 드러난다. 테스트의 다른 랜덤 슬롯만 비운다.
    page.evaluate('''() => {
      const dv=S.driving;
      dv.slots=dv.slots.filter(slot=>slot.waypoint==='meet_scrapyard');
      dv.si=0;
      const wx=S.wx==='storm'?.76:S.wx==='fog'?.88:1;
      const ftg=S.fatigue>=80?.85:1;
      G.tick(dv.slots[0].at/(G.tickKmPerSecond()*wx*ftg)+.02);
    }''')
    at_scrapyard = page.evaluate('''() => ({
      event:S.stopover&&S.stopover.eventId,
      from:S.stopover&&S.stopover.from,
      to:S.stopover&&S.stopover.to,
      remaining:S.stopover&&S.stopover.remainingKm,
      title:document.querySelector('#ev-sheet h2')?.textContent||''
    })''')
    check('부산→양산 도중 실제 폐차장 지점에서만 자동차 무덤이 열린다',
          at_scrapyard['event'] == 'meet_scrapyard' and at_scrapyard['from'] == 'busan' and
          at_scrapyard['to'] == 'yangsan' and at_scrapyard['remaining'] > 0 and
          at_scrapyard['title'] == '자동차 무덤', str(at_scrapyard))

    # 정보 질문이 아닌 '부품부터 본다'를 골라도 민지 부탁은 같은 현장에서 바로 이어진다.
    finish_open_event(page, 1)
    page.wait_for_timeout(550)
    after_meet = page.evaluate('''() => ({
      id:S.recruitQ&&S.recruitQ.id, stage:S.recruitQ&&S.recruitQ.stage,
      target:S.recruitQ&&S.recruitQ.target, used:S.used.includes('meet_scrapyard'),
      sameStop:S.recruitQ&&S.recruitQ.sameStop,
      stopover:S.stopover&&S.stopover.eventId,
      title:document.querySelector('#ev-sheet h2')?.textContent||''
    })''')
    check('부품을 먼저 골라도 되돌아갈 도시 없이 같은 폐차장의 부탁으로 이어진다',
          after_meet == {'id': 'minji', 'stage': 'task', 'target': 'yangsan', 'used': True,
                         'sameStop': True, 'stopover': 'meet_scrapyard', 'title': '무너지기 전의 목소리'},
          str(after_meet))

    finish_open_event(page, 2)  # 달구지를 방패로 쓰는 무장비 해법
    task = page.evaluate('''() => ({
      stage:S.recruitQ&&S.recruitQ.stage, choice:S.recruitQ&&S.recruitQ.choice,
      van:S.van, guest:S.driving&&S.driving.guest,
      fuel:S.driving&&S.driving.guestFuel,
      remaining:S.driving&&Math.round(S.driving.dist-S.driving.gone),
      copy:document.querySelector('.road-guest-card')?.textContent||''
    })''')
    check('민지 첫 임무의 방식과 차체 흉터가 상태에 남는다',
          task['stage'] == 'road' and task['choice'] == 'shield' and task['van'] < 82, str(task))
    check('폐차장 일을 끝낸 민지는 새 출발을 기다리지 않고 남은 길부터 함께 탄다',
          task['guest'] == 'minji' and task['fuel'] == .92 and task['remaining'] > 0 and
          '민지' in task['copy'], str(task))
    same_leg_events = page.evaluate('G.directEventPool(G.eligible()).length')
    check('민지 사건을 닫은 같은 주행 구간에는 다른 사건이 연달아 열리지 않는다',
          same_leg_events == 0, str(same_leg_events))

    # 실제 엔진의 시간·연료 계산으로 도착하되, 이 테스트에서는 추가 랜덤 사건만 건너뛴다.
    page.evaluate('''() => {
      const old=UI.onArrive; UI.onArrive=()=>{UI.renderAll();return 0};
      S.driving.slots=[]; S.driving.si=0;
      const wx=S.wx==='storm'?.76:S.wx==='fog'?.88:1;
      const ftg=S.fatigue>=80?.85:1;
      // 속도 상수를 테스트가 복제하면 밸런스 튜닝 때마다 여기서 깨진다.
      // 엔진이 실제로 쓰는 값을 그대로 역산한다.
      const perSec=G.tickKmPerSecond();
      G.tick(S.driving.dist/(perSec*wx*ftg)+.02);
      UI.onArrive=old;
    }''')
    page.click('[data-journey-mode="local"]')
    follow = page.evaluate('''() => ({
      at:S.at, stage:S.recruitQ&&S.recruitQ.stage, target:S.recruitQ&&S.recruitQ.target,
      held:!G.openRecruitStep(), day:S.day
    })''')
    check('양산 정차 뒤 바로 합류시키지 않고 함께 보낸 하룻밤을 요구한다',
          follow['at'] == 'yangsan' and follow['stage'] == 'follow' and follow['target'] == 'yangsan' and follow['held'], str(follow))

    # 야영 무작위 사건은 별도 회귀 대상이다. 이 루트에서는 영입의 밤만 고정한다.
    page.evaluate("S._lastCampEventDay=S.day; G.camp('양산 외곽에서 민지와 하룻밤을 묵었다')")
    next_day = page.evaluate("({day:S.day, min:S.min, opened:G.openRecruitStep(), title:document.querySelector('#ev-sheet h2')?.textContent||''})")
    check('다음 날 별도 재회 없이 민지의 합류 결정이 열린다',
          next_day['day'] == 2 and next_day['min'] == 390 and next_day['opened'], str(next_day))
    check('민지는 다른 장소에서 다시 소개되지 않고 곧바로 자리를 고른다',
          next_day['title'] == '민지가 고른 자리', next_day['title'])
    finish_open_event(page, 0, 'yes')
    joined = page.evaluate('''() => ({
      party:[...S.party], quest:S.recruitQ,
      approach:S.comps.minji.approach, bond:S.comps.minji.bond
    })''')
    check('민지는 첫 만남·공동 과제·실제 주행 뒤 탑승한다',
          joined['party'] == ['minji'] and joined['quest'] is None and joined['approach'] == 'shield' and joined['bond'] >= 5,
          str(joined))

    drive_before = page.evaluate("({van:S.van,vanMax:S.vanMax})")
    page.evaluate("G.startTravel('miryang')")
    callback = page.evaluate('''() => ({
      memory:S.driving.recruitMemory,
      van:S.van,
      used:!!S.flags.minji_approach_drive,
      copy:document.querySelector('.road-memory-card')?.textContent||''
    })''')
    check('민지 임무에서 고른 방패 해법이 합류 후 첫 주행의 수리로 되돌아온다',
          callback['memory']['id'] == 'minji' and callback['memory']['choice'] == 'shield' and
          abs(callback['van'] - min(drive_before['van'] + 4, drive_before['vanMax'])) < .01 and
          callback['used'] and '긁힌 판' in callback['copy'], str(callback))
    page.evaluate('''() => {
      const old=UI.onArrive; UI.onArrive=()=>{UI.renderAll();return 0};
      S.driving.slots=[]; S.driving.si=0;
      const wx=S.wx==='storm'?.76:S.wx==='fog'?.88:1;
      const ftg=S.fatigue>=80?.85:1;
      const perSec=G.tickKmPerSecond();
      G.tick(S.driving.dist/(perSec*wx*ftg)+.02);
      UI.onArrive=old;
    }''')
    check('민지를 다시 찾으러 되돌아가지 않고 진행 방향의 밀양에 도착한다',
          page.evaluate("S.at==='miryang' && !S.driving"))

    page.evaluate("UI.showStl('miryang','hub')")
    hub = page.evaluate('''() => ({
      spots:[...document.querySelectorAll('[data-stlfocus]')].map(b=>b.dataset.stlfocus),
      walkers:document.querySelectorAll('.stl-walker-face').length
    })''')
    check('밀양은 사진 세 버튼이 아니라 직접 걸어 들어갈 네 번째 공간이 있다',
          hub['spots'] == ['market', 'garage', 'people', 'alley'], str(hub))
    check('장터를 걸을 때 주인공과 민지가 함께 보인다', hub['walkers'] == 2, str(hub))

    page.evaluate("UI.showStl('miryang','alley')")
    alley_scroll = page.evaluate('''() => {
      const panel=document.querySelector('#stl-body');
      const last=document.querySelector('.stl-field-switcher [data-fieldspot="pump"]');
      last.scrollIntoView({block:'center'});
      const r=last.getBoundingClientRect();
      return {top:r.top,bottom:r.bottom,width:r.width,viewport:innerWidth,
        overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
        scrollable:panel.scrollHeight>panel.clientHeight};
    }''')
    check('360px에서도 장터 골목의 마지막 기본 행동까지 스크롤해 누를 수 있다',
          alley_scroll['top'] >= 0 and alley_scroll['bottom'] <= 700 and
          alley_scroll['width'] <= alley_scroll['viewport'] and not alley_scroll['overflow'] and alley_scroll['scrollable'],
          str(alley_scroll))
    initial_field = page.evaluate("[...document.querySelectorAll('[data-stlfield]')].map(b=>b.dataset.stlfield)")
    check('숨은 번호표는 골목을 둘러보기 전에 스포하지 않는다',
          initial_field == ['noodles', 'parts', 'pump'], str(initial_field))
    field_before = page.evaluate("({day:S.day,min:S.min,scrap:S.scrap,food:S.food,water:S.water,bond:S.comps.minji.bond})")
    page.click('[data-stlfield="noodles"]')
    noodles = page.evaluate('''() => ({
      day:S.day,min:S.min,scrap:S.scrap,food:S.food,
      disabled:document.querySelector('[data-stlfield="noodles"]').disabled,
      result:document.querySelector('[data-field-result]')?.textContent||''
    })''')
    check('국수 좌판은 공짜 버튼이 아니라 시간과 고철을 쓰고 하루에 한 번만 머문다',
          noodles['day'] == field_before['day'] and noodles['min'] == field_before['min'] + 20 and
          noodles['scrap'] == field_before['scrap'] - 2 and noodles['food'] == field_before['food'] + 1 and
          noodles['disabled'] and '순덕' in noodles['result'], str(noodles))
    page.click('.stl-field-switcher [data-fieldspot="pump"]')
    page.click('[data-stlfield="pump"]')
    revealed = page.evaluate("[...document.querySelectorAll('[data-stlfield]')].map(b=>b.dataset.stlfield)")
    check('두 곳을 거들어야 143년의 작은 흔적이 자연스럽게 열린다',
          revealed == ['noodles', 'parts', 'pump', 'oldcard'], str(revealed))
    page.click('.stl-field-switcher [data-fieldspot="oldcard"]')
    page.click('[data-stlfield="oldcard"]')
    trace = page.evaluate('''() => ({
      flag:!!S.flags.miryang_oldcard,
      note:S.notes.some(n=>n.title==='2026년 교통카드 번호표'),
      disabled:document.querySelector('[data-stlfield="oldcard"]').disabled,
      water:S.water,bond:S.comps.minji.bond
    })''')
    check('교통카드는 일회성 발견으로 기록되고 다시 파밍할 수 없다',
          trace['flag'] and trace['note'] and trace['disabled'], str(trace))
    check('같이 장터를 돌면 보상만이 아니라 민지와의 유대도 남는다',
          trace['bond'] == field_before['bond'] + 3, str(trace))
    page.evaluate("UI.showStl('miryang','hub'); document.querySelector('#stl-out').click()")

    page.evaluate("G.startTravel('daegu')")
    later_drive = page.evaluate('''() => ({
      memory:S.driving.recruitMemory,
      used:!!S.flags.minji_approach_drive
    })''')
    check('민지의 첫 주행 기억 보상은 다음 구간에서 중복 적용되지 않는다',
          later_drive['memory'] is None and later_drive['used'], str(later_drive))
    daegu_pool = page.evaluate("G.eligible().filter(e=>e.priority&&e.recruitStart).map(e=>e.id)")
    check('민지 합류 직후의 다음 대구 길에서 새 동료 사건을 연달아 강제하지 않는다',
          daegu_pool == [], str(daegu_pool))
    page.evaluate('''() => {
      const old=UI.onArrive; UI.onArrive=()=>{UI.renderAll();return 0};
      S.driving.slots=[]; S.driving.si=0;
      const wx=S.wx==='storm'?.76:S.wx==='fog'?.88:1;
      const ftg=S.fatigue>=80?.85:1;
      // 속도 상수를 테스트가 복제하면 밸런스 튜닝 때마다 여기서 깨진다.
      // 엔진이 실제로 쓰는 값을 그대로 역산한다.
      const perSec=G.tickKmPerSecond();
      G.tick(S.driving.dist/(perSec*wx*ftg)+.02);
      UI.onArrive=old;
      UI.showStl('daegu','people');
    }''')
    finish = page.evaluate('''() => ({
      at:S.at, day:S.day, clock:G.fmtClock(), fuel:Math.round(S.fuel*10)/10,
      water:S.water, food:S.food, van:Math.round(S.van), km:Math.round(S.stats.km),
      kangwoo:!!document.querySelector('[data-recruit="kangwoo"]'),
      parkss:!!document.querySelector('[data-recruit="parkss"]')
    })''')
    check('DAY 2 대구 도착까지 자원과 달구지가 진행 가능한 범위다',
          finish['at'] == 'daegu' and finish['day'] == 2 and finish['fuel'] >= 18 and
          finish['water'] >= 10 and finish['food'] >= 10 and finish['van'] >= 65 and finish['km'] == 106,
          str(finish))
    check('대구에서는 강우를 찾아갈 수 있지만 박 선생이 겹쳐 나오지 않는다',
          finish['kangwoo'] and not finish['parkss'], str(finish))
    check('골든 루트 콘솔 오류 0건', not console_errors, str(console_errors[:5]))
    browser.close()

if failures:
    raise SystemExit('\n'.join(failures))
print('\n✅ 부산→민지→밀양→대구 골든 루트 전부 통과')
