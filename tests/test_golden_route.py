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

    page.evaluate("G.startTravel('yangsan')")
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
    at_yangsan = page.evaluate("({at:S.at, button:document.querySelector('[data-a=recruitstep]')?.textContent||''})")
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
    next_day = page.evaluate("({day:S.day, min:S.min, opened:G.openRecruitStep()})")
    check('다음 날에야 민지의 두 번째 대화가 열린다',
          next_day['day'] == 2 and next_day['min'] == 390 and next_day['opened'], str(next_day))
    finish_open_event(page, 2)
    page.wait_for_timeout(650)  # rq_minji_join 연쇄
    join_title = page.locator('#ev-sheet h2').text_content()
    check('정오의 대답 뒤 합류 제안이 끊기지 않고 이어진다', join_title == '민지가 고른 자리', join_title)
    finish_open_event(page, 0, 'yes')
    joined = page.evaluate('''() => ({
      party:[...S.party], quest:S.recruitQ,
      approach:S.comps.minji.approach, bond:S.comps.minji.bond
    })''')
    check('민지는 첫 만남이 아니라 두 사건을 겪은 뒤 탑승한다',
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
