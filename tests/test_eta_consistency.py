#!/usr/bin/env python3
"""화면에 표시한 주행 시간이 실제 경과와 맞는가.

2026-08-06 회귀: 평균 속도 상수를 44→13km/h로 바꿨는데 `routeForecast`·`travelForecast`가
44를 하드코딩한 채 남아, 플레이어가 보는 모든 예상 시간이 실제의 1/3.4로 표시됐다
(장터 219km → "4시간 59분", 실제 16시간 51분). 출발 버튼과 도착 정산이 한 구간 안에서
서로 모순되던 상태. 표시와 실제를 같은 소스에서 뽑는지 검사한다.
"""
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / '서울까지400km.html').as_uri()
failures = []


def check(label, ok, detail=''):
    print(('  ✅ ' if ok else '  ❌ ') + label + (f' — {detail}' if detail else ''))
    if not ok:
        failures.append(label)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(viewport={'width': 390, 'height': 780})
    errors = []
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.add_init_script("window.ReactNativeWebView={postMessage(){}}; localStorage.clear(); localStorage.setItem('caravan_story_auto','0')")
    page.goto(GAME)
    # G.tick은 screen==='game'을 요구한다 — 실제 시작 흐름을 밟는다
    page.click('#bt-new')
    if page.locator('#scr-mode').is_visible():
        page.click('#mode-on')
    page.fill('#inp-name', 'ETA')
    page.click('#bt-name')
    page.wait_for_timeout(100)
    page.evaluate('UI.skipIntro()')
    page.wait_for_timeout(200)
    page.evaluate("document.querySelector('#arrival-scene') && document.querySelector('#arrival-scene').classList.remove('on')")

    print('― 표시 시간 vs 실제 경과 (같은 구간)')
    drive = page.evaluate("""() => {
      const target='yangsan';
      const chk=G.canTravelTo(target);
      const shown=G.travelForecast(target).minutes;
      const before={day:S.day, min:S.min};
      const oldArrive=UI.onArrive; UI.onArrive=()=>0;
      G.startTravel(target);
      S.driving.slots=[];                       // 사건 시간은 제외하고 순수 주행만 잰다
      let guard=0;
      while(S.driving && guard++<20000) G.tick(1.4);
      UI.onArrive=oldArrive;
      const elapsed=(S.day-before.day)*1440 + (S.min-before.min);
      return {km:chk.km, shown, elapsed:Math.round(elapsed)};
    }""")
    ratio = drive['elapsed'] / max(1, drive['shown'])
    check('출발 전 예상과 실제 경과가 ±20% 안',
          0.8 <= ratio <= 1.2, f"{drive['km']}km 표시 {drive['shown']}분 vs 실제 {drive['elapsed']}분 ({ratio:.2f}배)")

    print('― 노선 예보도 같은 소스를 쓴다')
    routes = page.evaluate("""() => Object.keys(D.routePlans||{}).map(id=>{
      const f=G.routeForecast(id);
      return {id, km:f.km, minutes:f.minutes, expected:G.driveMinutes(f.km)};
    })""")
    for r in routes:
        check(f"노선 {r['id']} 예보가 엔진 계산과 일치",
              r['minutes'] == r['expected'], f"표시 {r['minutes']}분 vs 엔진 {r['expected']}분")

    print('― 속도 상수를 복제한 곳이 없다')
    dup = page.evaluate("""() => {
      // 엔진이 노출하는 단일 소스가 존재하고, 표시 계산이 그것과 일치하는지
      const km=100;
      return {driveMinutes:G.driveMinutes(km), perSec:G.tickKmPerSecond(),
              consistent: Math.abs(G.driveMinutes(km) - Math.ceil(km/(G.tickKmPerSecond()*60/7.4)*60)) <= 1};
    }""")
    check('driveMinutes와 tickKmPerSecond가 같은 속도를 가리킨다', dup['consistent'], str(dup))

    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'ETA 일관성 실패 {len(failures)}건: ' + ', '.join(failures))
print('✅ 표시 시간과 실제 경과가 일치한다')
