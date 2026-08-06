#!/usr/bin/env python3
"""DAY 30 집행·구제 유상화·야영 밸런스·페이싱 감독이 실제로 배선됐는지 확인한다."""
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
    # 실제 시작 흐름 — camp() 등은 screen==='game'을 요구한다
    page.click('#bt-new')
    if page.locator('#scr-mode').is_visible():
        page.click('#mode-on')
    page.fill('#inp-name', '검증')
    page.click('#bt-name')
    page.wait_for_timeout(100)
    page.evaluate('UI.skipIntro()')
    page.wait_for_timeout(200)
    page.evaluate("document.querySelector('#arrival-scene') && document.querySelector('#arrival-scene').classList.remove('on')")

    print('― DAY 30 시한 집행')
    d10 = page.evaluate("""() => {
      S.day=21; S._crisis=null; G.tickDeadline();
      return {flag:!!S.flags.deadline_seen_d10, queued:S._crisis};
    }""")
    check('D-10에 이송 준비 이벤트 예약', d10['flag'] and d10['queued'] == 'deadline_d10', str(d10))

    d5 = page.evaluate("""() => {
      S._crisis=null; S.day=26; S.pursuit=0; G.tickDeadline();
      return {flag:!!S.flags.deadline_seen_d5, queued:S._crisis, pursuit:S.pursuit};
    }""")
    check('D-5에 통제 이벤트 + 관측 바닥 1', d5['flag'] and d5['queued'] == 'deadline_d5' and d5['pursuit'] >= 1, str(d5))

    late = page.evaluate("""() => {
      S._crisis=null; S.day=31; G.tickDeadline();
      return {flag:!!S.flags.deadline_seen_late, queued:S._crisis};
    }""")
    check('시한 초과 시 첫 이송 이벤트 예약', late['flag'] and late['queued'] == 'deadline_late', str(late))

    ended = page.evaluate("""() => {
      S._crisis=null; S.flags.core_decided=1; S.day=40; G.tickDeadline();
      return {queued:S._crisis};
    }""")
    check('처분 뒤에는 시한 압박 정지', ended['queued'] is None, str(ended))
    page.evaluate("delete S.flags.core_decided; S.day=2; S.pursuit=0; S._crisis=null")

    print('― 야영 밸런스')
    camp = page.evaluate("""() => {
      const r={};
      S.at='miryang'; S.driving=null; S.scrap=30; S.min=20*60;
      const s0=S.scrap;
      G.camp();
      r.first={scrap:s0-S.scrap, nights:(S._stlNights||{}).miryang};
      document.querySelectorAll('.wrap.on,.ovl.on').forEach(w=>w.classList.remove('on'));
      S.min=20*60;
      const s1=S.scrap;
      G.camp();
      r.second={scrap:s1-S.scrap, nights:(S._stlNights||{}).miryang};
      document.querySelectorAll('.wrap.on,.ovl.on').forEach(w=>w.classList.remove('on'));
      S.min=20*60; S.scrap=0;
      const f2=S.food;
      G.camp();
      r.third={foodGain:S.food-f2, nights:(S._stlNights||{}).miryang};
      return r;
    }""")
    first_free = camp['first']['scrap'] == 0 and camp['first']['nights'] == 1
    check('정착지 첫 밤 무상', first_free, str(camp['first']))
    check('반복 숙박은 고철 2 청구', camp['second']['scrap'] == 2 and camp['second']['nights'] == 2, str(camp['second']))
    check('삯 없으면 배급 축소', camp['third']['foodGain'] <= 0, str(camp['third']))

    print('― 구제 유상화 (에스컬레이션 사다리)')
    ladder = page.evaluate("""() => {
      const seen=[];
      document.querySelectorAll('.wrap.on,.ovl.on').forEach(w=>w.classList.remove('on'));
      for(let i=0;i<3;i++){
        G.openRescue('nofuel','crisis_nofuel');
        seen.push((document.querySelector('#ev-sheet h2')||{}).textContent||'');
        document.querySelectorAll('.wrap.on,.ovl.on').forEach(w=>w.classList.remove('on'));
      }
      return {seen, count:S._rescues.nofuel};
    }""")
    check('nofuel 3회 = 서로 다른 3개 이벤트', ladder['count'] == 3 and len(set(ladder['seen'])) == 3, str(ladder))
    check('3회차 제목에 세 번째 명시', '세 번째' in (ladder['seen'][2] or ''), ladder['seen'][2])

    print('― 페이싱 감독 (peak가 무거운 사건을 밀어붙임)')
    director = page.evaluate("""() => {
      S.director.phase='peak'; S.director.peakEvents=0; S._eventBreather=1;
      const heavy={id:'x1',type:'위기',w:5}, calm={id:'x2',type:'정경',w:5};
      const wH=G.directorWeight(heavy), wC=G.directorWeight(calm);
      const pool=G.directEventPool([heavy,calm]);
      return {wH,wC,poolIds:pool.map(e=>e.id)};
    }""")
    check('peak에서 무거운 이벤트 가중 상승', director['wH'] > 1.2 and director['wC'] < 1, str(director))
    check('peak 풀이 무거운 이벤트로 좁혀짐 (breather가 가로채지 않음)', director['poolIds'] == ['x1'], str(director))

    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'Phase1 검증 실패 {len(failures)}건: ' + ', '.join(failures))
print('✅ DAY30·구제·야영·감독 배선 전부 통과')
