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

    print('― DAY 30 시한 집행 (날짜 축)')
    d10 = page.evaluate("""() => {
      S.day=21; S._crisis=null; G.tickDeadline();
      return {flag:!!S.flags.deadline_seen_d10, queued:S._crisis};
    }""")
    check('D-10에 이송 준비 이벤트 예약', d10['flag'] and d10['queued'] == 'deadline_d10', str(d10))

    print('― 시한 집행 (거리 축 — 실제 플레이에서 먼저 닿는 쪽)')
    # 부산 출발 시 remainKm≈356이므로, 짧은 여정에서는 날짜가 아니라 거리가 압박을 연다.
    dist = page.evaluate("""() => {
      const out={start:G.remainKm()};
      const probe=(at)=>{ S.day=2; S.at=at; S.driving=null; S._crisis=null;
        for(const k of ['deadline_seen_d10','deadline_seen_d5','deadline_seen_d0']) delete S.flags[k];
        G.tickDeadline(); return {km:G.remainKm(), queued:S._crisis}; };
      out.mid=probe('daejeon');
      out.near=probe('suwon');
      return out;
    }""")
    check('출발 지점 잔여 거리가 260km 문턱보다 멀다 (거리 축이 단계적으로 열림)',
          dist['start'] > 260, str(dist['start']))
    check('중간 지점에서 거리 기준으로 압박 발화',
          dist['mid']['queued'] in ('deadline_d10', 'deadline_d5', 'deadline_d0'), str(dist['mid']))
    check('서울 근처에서는 마지막 단계까지 도달', dist['near']['km'] <= 60, str(dist['near']))
    page.evaluate("""() => { for(const k of ['deadline_seen_d10','deadline_seen_d5','deadline_seen_d0']) delete S.flags[k];
      S.at='busan'; S._crisis=null; }""")

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
      S.at='miryang'; S.driving=null; S.scrap=30;
      // 한 밤을 같은 조건에서 재현한다 — 날씨(빗물받이 +2)와 시각을 매번 고정
      const night=()=>{
        document.querySelectorAll('.wrap.on,.ovl.on').forEach(w=>w.classList.remove('on'));
        S.wx='clear'; S.wxNext='clear'; S.min=20*60;
        S.thirst=0; S.hunger=0;
        const before={scrap:S.scrap, water:S.water, food:S.food};
        G.camp();
        S.wx='clear'; S.wxNext='clear';
        return {scrapSpent:before.scrap-S.scrap, water:S.water-before.water,
                food:S.food-before.food, nights:(S._stlNights||{}).miryang};
      };
      r.first=night();
      r.second=night();
      S.scrap=0;            // 삯을 낼 수 없는 상태
      r.third=night();
      r.partySize=G.partySize();
      return r;
    }""")
    # 판정은 절대값이 아니라 밤 사이의 차이로 한다 (퍼크·업그레이드·날씨에 흔들리지 않게).
    check('정착지 첫 밤은 무상', camp['first']['scrapSpent'] == 0 and camp['first']['nights'] == 1, str(camp['first']))
    check('반복 숙박은 고철 2 청구', camp['second']['scrapSpent'] == 2 and camp['second']['nights'] == 2, str(camp['second']))
    check('유상 밤은 첫 밤과 같은 보급', camp['second']['water'] == camp['first']['water'], str(camp))
    # 삯을 못 내는 밤이 보급을 더 주면 가격 자체가 무의미해진다 (2026-08-06 실제 회귀)
    check('삯 없는 밤은 보급이 실제로 줄어든다',
          camp['third']['scrapSpent'] == 0
          and camp['third']['water'] < camp['first']['water']
          and camp['third']['food'] <= camp['first']['food'],
          f"무상밤={camp['first']} 삯없는밤={camp['third']}")

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
