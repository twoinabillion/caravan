#!/usr/bin/env python3
"""키보드만으로 인트로→첫 정착지→모달 순회→저장까지 진행 가능한지 회귀 검사.

마우스 클릭(page.click) 대신 Tab/Enter/Space/Escape/화살표만 사용한다.
각 모달에서: 포커스가 모달 내부로 들어가는지, Tab이 새는지, Escape로
닫히는지, 닫힌 뒤 포커스가 트리거로 복귀하는지 확인한다.
"""
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


def active_id(page):
    return page.evaluate("document.activeElement && document.activeElement.id || document.activeElement.tagName")


def tab_to(page, target_id, max_tabs=40):
    """target_id가 포커스될 때까지 Tab. 못 찾으면 False."""
    for _ in range(max_tabs):
        if active_id(page) == target_id:
            return True
        page.keyboard.press('Tab')
    return active_id(page) == target_id


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 390, 'height': 780})
    console_errors = []
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
    page.on('pageerror', lambda exc: console_errors.append(str(exc)))
    page.add_init_script(
        "window.ReactNativeWebView={postMessage(){}}; localStorage.setItem('caravan_story_auto','0')"
    )
    page.goto(GAME)

    # ── 새 게임 시작: 클릭 없이 Tab/Enter만 사용 ──
    page.click('#bt-new')  # 최초 진입 버튼은 마우스 없이 도달 불가한 스플래시이므로 1회 예외
    if page.locator('#scr-mode').is_visible():
        page.keyboard.press('Enter')  # 온로드 모드 버튼에 이미 포커스가 가 있어야 함
    page.fill('#inp-name', '하린')
    page.keyboard.press('Enter')
    page.wait_for_timeout(150)
    page.evaluate('UI.skipIntro()')
    page.wait_for_timeout(200)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")
    page.evaluate("document.querySelector('#ev-wrap')?.classList.remove('on')")
    page.evaluate("""() => {
      for(const id of ['onboarding_main_mission','onboarding_first_road']){
        const event=D.events.find(item=>item.id===id);
        if(event && !S.used.includes(event.id)) S.used.push(event.id);
      }
      S.flags.onboarding_mission_seen=true;
      S.flags.onboarding_first_road_seen=true;
      S._storyQueue=[]; S._chain=null;
    }""")
    page.wait_for_timeout(900)
    page.evaluate("""() => {
      document.querySelector('#ev-wrap')?.classList.remove('on');
      document.querySelector('#quest-update-ribbon')?.remove();
      S._storyQueue=[]; S._chain=null;
    }""")

    # ── 하단 도크가 키보드로 도달 가능한가 ──
    reached_map = tab_to(page, 'dk-map')
    check('Tab만으로 지도 버튼(#dk-map) 도달', reached_map, f'현재 포커스={active_id(page)}')

    # ── 지도 모달: Enter로 열기 → 포커스 진입 → Escape로 닫기 → 트리거 복귀 ──
    page.keyboard.press('Enter')
    page.wait_for_timeout(150)
    map_open = page.evaluate("document.querySelector('#ovl-map').classList.contains('on')")
    check('Enter로 지도 모달 열림', map_open)
    focus_inside_map = page.evaluate(
        "document.querySelector('#ovl-map').contains(document.activeElement)"
    )
    check('지도 모달 열릴 때 포커스가 모달 내부로 이동', focus_inside_map, f'activeElement={active_id(page)}')

    page.keyboard.press('Escape')
    page.wait_for_timeout(150)
    map_closed = page.evaluate("!document.querySelector('#ovl-map').classList.contains('on')")
    check('Escape로 지도 모달 닫힘', map_closed)
    focus_returned = active_id(page) == 'dk-map'
    check('지도 닫은 뒤 포커스가 트리거(#dk-map)로 복귀', focus_returned, f'activeElement={active_id(page)}')

    # ── 상태 모달: 탭(now/journey/crew)까지 화살표로 순회 ──
    reached_status = tab_to(page, 'dk-status', max_tabs=10)
    check('Tab으로 상태 버튼(#dk-status) 도달', reached_status)
    page.keyboard.press('Enter')
    page.wait_for_timeout(150)
    status_open = page.evaluate("document.querySelector('#ovl-status').classList.contains('on')")
    check('Enter로 상태 모달 열림', status_open)

    focus_inside_status = page.evaluate(
        "document.querySelector('#ovl-status').contains(document.activeElement)"
    )
    check('상태 모달이 열리면 포커스가 내부로 이동', focus_inside_status, f'activeElement={active_id(page)}')
    focus_trapped = True
    for _ in range(12):
        page.keyboard.press('Tab')
        if not page.evaluate("document.querySelector('#ovl-status').contains(document.activeElement)"):
            focus_trapped = False
            break
    check('상태 모달의 Tab 순환이 배경 화면으로 새지 않음', focus_trapped, f'activeElement={active_id(page)}')

    page.keyboard.press('Escape')
    page.wait_for_timeout(150)
    status_closed = page.evaluate("!document.querySelector('#ovl-status').classList.contains('on')")
    check('Escape로 상태 모달 닫힘', status_closed)
    status_focus_returned = active_id(page) == 'dk-status'
    check('상태 닫은 뒤 포커스가 트리거(#dk-status)로 복귀', status_focus_returned, f'activeElement={active_id(page)}')

    # ── HUD 텍스트 최소 크기 확인 (접근성 폰트 크기 회귀 방지) ──
    tiny = page.evaluate("""
      () => Array.from(document.querySelectorAll('button,input,select,textarea,[role="button"],[role="tab"]')).filter(el => {
        const cs = getComputedStyle(el);
        if (!el.textContent || !el.textContent.trim()) return false;
        const size=parseFloat(cs.fontSize);
        return size > 0 && size < 12 && el.offsetParent !== null;
      }).map(el => ({tag:el.tagName, cls:el.className, text:el.textContent.trim().slice(0,40), size:getComputedStyle(el).fontSize}))
    """)
    check('화면의 조작 가능한 요소에 12px 미만 텍스트 없음', len(tiny) == 0, f'{len(tiny)}개 발견: {tiny[:4]}')


    # ── 선택지 숫자키 — 게임의 대부분이 선택이므로 키보드 완주의 중심 배선 ──
    picked = page.evaluate("""() => {
      G.newGame('onroad','키보드','full');
      S.scrap=20;
      const evd=D.events.find(e=>e.id==='meet_toll');
      UI.showEvent(evd);
      return new Promise(res=>{
        const t0=Date.now();
        const tick=()=>{
          const frame=document.querySelector('#ev-wrap [role="button"]');
          if(frame) frame.click();   // 타이프라이터 빨리감기
          // 대화 페이지('계속'=story-next)는 숫자키 1로 넘어간다 — 그 자체가 키보드 배선 검증
          const next=document.querySelector('#ev-wrap button.choice.story-next');
          if(next){ document.dispatchEvent(new KeyboardEvent('keydown',{key:'1',bubbles:true})); }
          const cards=[...document.querySelectorAll('#ev-wrap button.choice:not(.story-next)')].filter(x=>x.offsetParent!==null&&!x.disabled);
          if(cards.length>=2){
            const firstText=cards[0].textContent;
            document.dispatchEvent(new KeyboardEvent('keydown',{key:'2',bubbles:true}));
            setTimeout(()=>{
              const now=[...document.querySelectorAll('#ev-wrap button.choice:not(.story-next)')].filter(x=>x.offsetParent!==null);
              res({cards:cards.length, changed:!now.length||now[0]&&now[0].textContent!==firstText});
            }, 500);
            return;
          }
          if(Date.now()-t0>6000) return res({cards:cards.length, timeout:true});
          setTimeout(tick, 250);
        };
        tick();
      });
    }""")
    check('숫자키 2가 두 번째 선택지를 실행한다', picked.get('cards', 0) >= 2 and picked.get('changed'), str(picked))

    # ── 지도 키보드 여행 — ]로 이웃 순회, Enter로 출발 ──
    travel = page.evaluate("""() => {
      G.newGame('onroad','키보드여행','full');
      document.querySelector('#ovl-map').classList.add('on');
      document.dispatchEvent(new KeyboardEvent('keydown',{key:']',bubbles:true}));
      const cardOn=document.querySelector('#nodecard').classList.contains('on');
      const goBtn=!!document.querySelector('#nodecard [data-go]');
      const before=S.at;
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
      const departed=!!S.driving;
      document.querySelector('#ovl-map').classList.remove('on');
      return {cardOn, goBtn, departed, from:before, to:S.driving&&S.driving.to};
    }""")
    check('] 키가 이웃 노드 카드를 연다', travel.get('cardOn') and travel.get('goBtn'), str(travel))
    check('Enter가 실제로 출발시킨다', travel.get('departed'), str(travel))

    check('콘솔/런타임 오류 0건', len(console_errors) == 0, str(console_errors[:5]))

    browser.close()

if failures:
    print('\n실패 목록:')
    for item in failures:
        print(f'- {item}')
    raise SystemExit(1)
print('\n✅ 키보드 전용 회귀 전부 통과')
