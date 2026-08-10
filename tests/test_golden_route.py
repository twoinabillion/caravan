#!/usr/bin/env python3
"""부산→민지→밀양→대구 첫 90분 골든 루트 회귀 검사."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / '서울까지400km.html').as_uri()
failures = []


def check(label, ok, detail=''):
    mark = '✅' if ok else '❌'
    print(f'{mark} {label}')
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
    browser = p.chromium.launch()
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
      tabs:[...document.querySelectorAll('[data-journey-mode]')].map(button=>button.textContent.trim()),
      selected:document.querySelector('[data-journey-mode][aria-selected="true"]')?.dataset.journeyMode,
      panels:document.querySelectorAll('.journey-mode-panel').length,
      local:!!document.querySelector('.stop-action-console')
    })''')
    check('정차 기능은 목적지·머물기·달구지 세 모드를 가진 한 콘솔에서 전환한다',
          mode_initial['tabs'] == ['목적지', '머물기', '달구지'] and mode_initial['selected'] == 'local' and
          mode_initial['panels'] == 1 and mode_initial['local'], str(mode_initial))
    page.click('[data-journey-mode="route"]')
    nav_initial = page.evaluate('''() => ({
      console:!!document.querySelector('.route-console'),
      routes:[...document.querySelectorAll('[data-route-select]')].map(button=>button.dataset.routeSelect),
      hazards:document.querySelectorAll('.nav-hazard-row').length,
      selected:document.querySelector('[data-route-select][aria-pressed="true"]')?.dataset.routeSelect,
      copy:document.querySelector('.route-console')?.textContent||''
    })''')
    check('정차 화면은 목적지·위험·연료·식량을 한 네비게이션에서 보여 준다',
          nav_initial['console'] and nav_initial['routes'] == ['yangsan', 'gimhae'] and
          nav_initial['hazards'] == 3 and '연료' in nav_initial['copy'] and '식량' in nav_initial['copy'],
          str(nav_initial))
    page.click('[data-journey-mode="local"]')
    stop_console = page.evaluate('''() => {
      const action=document.querySelector('.stop-action-console');
      return {
        actionCopy:action?.textContent||'',
        explore:!!action?.querySelector('[data-a="explore"]:not([disabled])'),
        panels:document.querySelectorAll('.journey-mode-panel').length
      };
    }''')
    check('부산에서도 정착지와 외곽 탐색을 머물기 모드에서 고른다',
          stop_console['explore'] and '머물며 할 일' in stop_console['actionCopy'] and
          '2시간' in stop_console['actionCopy'] and '위험' in stop_console['actionCopy'] and
          stop_console['panels'] == 1, str(stop_console))
    local_layout = page.evaluate('''() => {
      const console=document.querySelector('.stop-action-console');
      return {
        visible:console?.querySelectorAll('.stop-action-card').length||0,
        nestedScroll:console ? console.scrollHeight > console.clientHeight + 1 : true
      };
    }''')
    check('머물기 콘솔은 주요 행동을 최대 두 개만 스크롤 없이 보여 준다',
          local_layout['visible'] <= 2 and not local_layout['nestedScroll'], str(local_layout))
    page.evaluate("S.recruitQ={id:'minji',stage:'task',target:'busan',startedDay:S.day}; UI.renderAll()")
    more_actions = page.locator('[data-local-more]')
    check('세 번째 행동부터는 콘솔 안 스크롤 대신 전체 행동 서랍으로 분리된다',
          more_actions.count() == 1 and more_actions.bounding_box()['height'] >= 44)
    more_actions.click()
    check('추가 행동 서랍에서 나머지 현지 행동을 바로 찾을 수 있다',
          page.locator('#ovl-local-actions.on').count() == 1 and page.locator('#local-actions-body [data-a]').count() >= 1)
    page.click('#local-actions-x')
    page.evaluate("S.recruitQ=null; UI.renderAll()")
    page.click('[data-a="camp"]')
    check('머물기 모드의 야영 준비는 실제 차 안 준비 화면을 연다',
          page.locator('#ovl-camp.on').count() == 1 and page.locator('#camp-rest').count() == 1)
    page.click('#camp-x')
    page.click('[data-journey-mode="vehicle"]')
    vehicle_console = page.evaluate('''() => {
      const vehicle=document.querySelector('.vehicle-console');
      const detail=document.querySelector('[data-vehicle-detail]');
      return {
        systems:vehicle?.querySelectorAll('.journey-system-strip>span').length||0,
        vehicleCopy:vehicle?.textContent||'',
        detailHeight:detail?.getBoundingClientRect().height||0,
        nestedScroll:vehicle ? vehicle.scrollHeight > vehicle.clientHeight + 1 : true
      };
    }''')
    check('달구지는 세 상태와 가장 필요한 행동을 스크롤 없이 먼저 보여 준다',
          vehicle_console['systems'] == 3 and '연료' in vehicle_console['vehicleCopy'] and
          '차체' in vehicle_console['vehicleCopy'] and '장비' in vehicle_console['vehicleCopy'] and
          '지금 할 수 있는 일' in vehicle_console['vehicleCopy'] and
          vehicle_console['detailHeight'] >= 44 and not vehicle_console['nestedScroll'], str(vehicle_console))
    page.click('[data-vehicle-detail]')
    vehicle_open = page.evaluate('''() => ({
      open:!!document.querySelector('#ovl-vehicle-detail.on'),
      systems:document.querySelectorAll('#vehicle-detail-body .vehicle-system-card').length,
      hasRepair:!!document.querySelector('#vehicle-detail-body [data-a="repair"]'),
      hasRadio:!!document.querySelector('#vehicle-detail-body [data-a="radio"]')
    })''')
    check('전체 정비 서랍을 열면 세 계통·장착 모듈·현장 정비 행동이 이어진다',
          vehicle_open['open'] and vehicle_open['systems'] == 3 and
          vehicle_open['hasRepair'] and vehicle_open['hasRadio'], str(vehicle_open))
    page.click('#vehicle-detail-x')
    page.click('[data-journey-mode="route"]')
    intel_coverage = page.evaluate('''() => {
      const cities=Object.entries(D.nodes).filter(([,node])=>node.type!=='hidden').map(([id])=>id);
      return {cities:cities.length, covered:cities.filter(id=>D.navIntel&&D.navIntel[id]).length};
    }''')
    check('현재 공개된 모든 도시는 출발 전 고유 위험 정보를 가진다',
          intel_coverage['cities'] == intel_coverage['covered'], str(intel_coverage))
    page.click('[data-nav-inspect="hazard:local"]')
    local_intel = page.evaluate('''() => ({
      key:document.querySelector('[data-nav-inspector]')?.dataset.navInspector,
      copy:document.querySelector('.nav-inspector')?.textContent||'',
      percent:(document.querySelector('.route-console')?.textContent||'').includes('%')
    })''')
    check('도시 위험을 누르면 출처·예상 결과·대응 방법이 열리고 가짜 확률은 보이지 않는다',
          local_intel['key'] == 'hazard:local' and '고가 낙하물' in local_intel['copy'] and
          '예상' in local_intel['copy'] and '대응' in local_intel['copy'] and not local_intel['percent'],
          str(local_intel))
    page.click('[data-nav-inspect-close]')
    page.click('[data-nav-inspect="resources"]')
    fuel_intel = page.evaluate('''() => ({
      key:document.querySelector('[data-nav-inspector]')?.dataset.navInspector,
      copy:document.querySelector('.nav-inspector')?.textContent||''
    })''')
    check('자원을 누르면 연료·식량·물 예상 소모와 도착지 보급 정보가 열린다',
          fuel_intel['key'] == 'resources' and '연료' in fuel_intel['copy'] and
          '식량/물' in fuel_intel['copy'] and '도착지 정보' in fuel_intel['copy'], str(fuel_intel))
    page.click('[data-nav-inspect-close]')
    page.click('[data-route-select="gimhae"]')
    nav_compare = page.evaluate('''() => ({
      driving:!!S.driving,
      selected:document.querySelector('.route-console')?.dataset.routeConsole,
      depart:document.querySelector('[data-nav-depart]')?.dataset.navDepart,
      title:document.querySelector('.nav-route-decision h3')?.textContent
    })''')
    check('다른 길 선택은 즉시 출발하지 않고 비교할 목적지만 바꾼다',
          not nav_compare['driving'] and nav_compare['selected'] == 'gimhae' and
          nav_compare['depart'] == 'gimhae' and '김해' in nav_compare['title'], str(nav_compare))
    page.click('[data-route-select="yangsan"]')
    page.click('[data-nav-depart="yangsan"]')
    check('네비게이션 출발 확인이 선택한 실제 주행을 시작한다',
          page.evaluate("S.driving&&S.driving.to==='yangsan'"))
    first_pool = page.evaluate('''() => ({
      slots:S.driving.slots.length,
      priority:G.eligible().filter(e=>e.priority).map(e=>e.id)
    })''')
    check('첫 도로에는 최소 한 번의 사건 자리가 있다', first_pool['slots'] >= 1, str(first_pool))
    check('첫 핵심 조우는 민지 한 명으로 집중된다', first_pool['priority'] == ['meet_scrapyard'], str(first_pool))

    # 정보 질문이 아닌 '부품부터 본다'를 골라도 민지 부탁이 사라지지 않아야 한다.
    page.evaluate("G.openEventById('meet_scrapyard')")
    finish_open_event(page, 1)
    after_meet = page.evaluate('''() => ({
      id:S.recruitQ&&S.recruitQ.id, stage:S.recruitQ&&S.recruitQ.stage,
      target:S.recruitQ&&S.recruitQ.target, used:S.used.includes('meet_scrapyard')
    })''')
    check('부품을 먼저 골라도 민지의 부탁으로 자연스럽게 이어진다',
          after_meet == {'id': 'minji', 'stage': 'task', 'target': 'yangsan', 'used': True}, str(after_meet))
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
    at_yangsan = page.evaluate("({at:S.at, button:document.querySelector('[data-a=recruitstep]')?.closest('.stop-action-card')?.textContent||''})")
    check('양산 도착 즉시 민지 부탁의 다음 행동이 보인다',
          at_yangsan['at'] == 'yangsan' and '부탁을 진행한다' in at_yangsan['button'], str(at_yangsan))

    opened = page.evaluate('G.openRecruitStep()')
    check('차 더미 구조 임무가 실제 행동으로 열린다', opened and page.locator('#ev-sheet').count() == 1)
    finish_open_event(page, 2)  # 달구지를 방패로 쓰는 무장비 해법
    task = page.evaluate('''() => ({
      stage:S.recruitQ&&S.recruitQ.stage, choice:S.recruitQ&&S.recruitQ.choice,
      van:S.van, time:G.fmtClock()
    })''')
    check('민지 첫 임무의 방식과 차체 흉터가 상태에 남는다',
          task['stage'] == 'road' and task['choice'] == 'shield' and task['van'] < 82, str(task))

    page.evaluate("G.startTravel('miryang')")
    guest = page.evaluate('''() => ({
      id:S.driving.guest, fuel:S.driving.guestFuel,
      copy:document.querySelector('.road-guest-card')?.textContent||''
    })''')
    check('합류 전에도 민지가 한 구간 실제 주행을 돕는다',
          guest['id'] == 'minji' and guest['fuel'] == .92 and '민지' in guest['copy'], str(guest))
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
    follow = page.evaluate('''() => ({
      at:S.at, stage:S.recruitQ&&S.recruitQ.stage, target:S.recruitQ&&S.recruitQ.target,
      held:!G.openRecruitStep(), day:S.day
    })''')
    check('밀양 도착 뒤 바로 합류시키지 않고 하룻밤을 요구한다',
          follow['at'] == 'miryang' and follow['stage'] == 'follow' and follow['target'] == 'miryang' and follow['held'], str(follow))

    page.evaluate("G.camp('밀양 장터에서 하룻밤을 묵었다')")
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

    drive_before = page.evaluate("({van:S.van,vanMax:S.vanMax})")
    page.evaluate("G.startTravel('daegu')")
    callback = page.evaluate('''() => ({
      memory:S.driving.recruitMemory,
      van:S.van,
      used:!!S.flags.minji_approach_drive,
      copy:document.querySelector('.road-memory-card')?.textContent||''
    })''')
    check('민지 임무에서 고른 방패 해법이 합류 후 첫 주행의 수리로 되돌아온다',
          callback['memory']['id'] == 'minji' and callback['memory']['choice'] == 'shield' and
          callback['van'] == min(drive_before['van'] + 4, drive_before['vanMax']) and
          callback['used'] and '긁힌 판' in callback['copy'], str(callback))
    daegu_pool = page.evaluate("G.eligible().filter(e=>e.priority&&e.recruitStart).map(e=>e.id)")
    check('민지 합류 직후 대구 길에서 새 동료 사건을 연달아 강제하지 않는다',
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
