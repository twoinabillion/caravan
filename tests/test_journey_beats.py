#!/usr/bin/env python3
"""쓴 것이 보이는가 — 여정 비트 전달 검사.

2026-08-06 실측: 갈등 아크·악의 조우의 런당 등장률이 0%였다. 무작위 풀(802개
이벤트·총가중치 5,918)에 두면 조건이 붙은 장면일수록 영영 안 나온다.
`D.journeyBeats` + `when` 조건으로 승격했고, 이 검사가 그 배선을 지킨다.

동료 조건 비트는 실엔진 시뮬이 잴 수 없다(자동 플레이어가 동료를 못 얻는다).
그래서 여기서 조건을 직접 세우고 예약이 실제로 일어나는지 본다.
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
    page.add_init_script('localStorage.clear()')
    page.goto(GAME)

    print('― 비트 정의 위생')
    defs = page.evaluate("""() => {
      const beats=D.journeyBeats||[];
      const ids=beats.map(b=>b.id);
      return {
        count: beats.length,
        missing: ids.filter(id=>!D.events.some(e=>e.id===id)),
        unsorted: beats.some((b,i)=>i>0 && b.km < beats[i-1].km),
        dupes: ids.filter((id,i)=>ids.indexOf(id)!==i),
      };
    }""")
    check('모든 비트가 실재하는 이벤트를 가리킨다', not defs['missing'], str(defs['missing']))
    check('비트가 거리 순으로 정렬돼 있다', not defs['unsorted'])
    check('중복 비트 없음', not defs['dupes'], str(defs['dupes']))

    # 승격은 "풀에서 꺼내 보장한다"는 뜻이지 "아무 데서나 튼다"는 뜻이 아니다.
    # 원래 이벤트가 갖고 있던 출현 조건이 비트 조건으로 옮겨졌는지 확인한다.
    conds = page.evaluate("""() => (D.journeyBeats||[]).map(b => ({
      id: b.id, ...G.beatConditionsMatchEvent(b) }))""")
    bad = [c for c in conds if not c['ok']]
    check('승격이 원래 출현 조건을 잃지 않았다', not bad,
          '; '.join(f"{c['id']}: {c.get('why')}" for c in bad))

    print('― 동료 조건 비트 (갈등 아크)')
    conflict = page.evaluate("""() => {
      const beat=(D.journeyBeats||[]).find(b=>b.id==='conflict_fuel_detour');
      if(!beat) return {found:false};
      G.newGame('onroad','비트','full');
      S.stats.km = beat.km + 10;
      S.at = 'gimcheon';        // 이 비트는 중부 전용이다 (원 이벤트의 region 조건)
      S.driving = null;
      // 조건 미충족(동료 없음)
      const withoutComps = G.beatReady(beat);
      // 조건 충족
      S.party=['kangwoo','parkss'];
      S.comps.kangwoo={mood:70,bond:6,lvl:1,perks:[]};
      S.comps.parkss={mood:70,bond:6,lvl:1,perks:[]};
      S.injuries={};
      const withComps = G.beatReady(beat);
      S._beatQueue=[]; S.used=[];
      G.scheduleJourneyBeat();
      const queued = (S._beatQueue||[]).includes('conflict_fuel_detour');
      // 부상 중이면 다시 닫힌다 (조건이 실제로 읽히는지)
      S.injuries={kangwoo:{label:'테스트',days:2}};
      const injured = G.beatReady(beat);
      return {found:true, withoutComps, withComps, queued, injured, km:beat.km};
    }""")
    check('갈등 아크가 비트로 등록돼 있다', conflict['found'])
    check('동료가 없으면 열리지 않는다', conflict['withoutComps'] is False)
    check('두 동료가 타면 열린다', conflict['withComps'] is True)
    check('조건 충족 시 실제로 예약된다', conflict['queued'] is True)
    check('동료가 다치면 다시 닫힌다', conflict['injured'] is False)

    print('― 예약 뒤 조건이 깨지면 내보내지 않는다')
    # 2026-08-06 적대적 재검증 실증: 예약 시점에만 조건을 보면, 두 사람이 내린 뒤에도
    # 두 사람의 갈등 장면이 열리고 물통을 채운 뒤에도 "물통이 바닥"이 출력됐다.
    stale = page.evaluate("""() => {
      G.newGame('onroad','조건붕괴','full');
      S.at='gimcheon'; S.driving=null; S.stats.km=400;
      S.party=['kangwoo','parkss'];
      S.comps.kangwoo={mood:70,bond:6,lvl:1,perks:[]};
      S.comps.parkss={mood:70,bond:6,lvl:1,perks:[]};
      S.injuries={}; S.water=1;
      S._beatQueue=[]; S.used=[];
      G.scheduleJourneyBeat();
      const queuedConflict = (S._beatQueue||[]).includes('conflict_fuel_detour');
      const queuedWater = (S._beatQueue||[]).includes('water_toll');
      // 조건을 깬다: 동료 하차 + 물통 가득
      S.party=[]; S.water=99;
      const popped=[];
      for(let i=0;i<12;i++){ const id=G.popBeat(); if(!id) break; popped.push(id); S.used.push(id); }
      return {queuedConflict, queuedWater, popped,
              stillQueued:[...(S._beatQueue||[])]};
    }""")
    check('조건 충족 시 둘 다 예약됐다',
          stale['queuedConflict'] and stale['queuedWater'], str(stale)[:120])
    check('동료가 내리면 갈등 아크가 나오지 않는다',
          'conflict_fuel_detour' not in stale['popped'], str(stale['popped']))
    check('물통을 채우면 우물 장면이 나오지 않는다',
          'water_toll' not in stale['popped'], str(stale['popped']))
    check('조건이 깨진 비트는 버리지 않고 보관한다',
          'conflict_fuel_detour' in stale['stillQueued'] and 'water_toll' in stale['stillQueued'],
          str(stale['stillQueued']))

    print('― 조건 종류별 실제 차단 (정의 대조가 아니라 동작)')
    enforce = page.evaluate("""() => {
      G.newGame('onroad','차단','full');
      S.stats.km=400; S.driving=null; S.injuries={};
      const beat=(id)=>(D.journeyBeats||[]).find(b=>b.id===id);
      S.at='busan';  S.water=1;  const southBlocksNorth=!G.beatReady(beat('cleaners_recall'));
      S.at='gimcheon'; S.water=99; const fullWaterBlocks=!G.beatReady(beat('water_toll'));
      S.at='seoul'; delete S.flags.radio_fixed; const noFlagBlocks=!G.beatReady(beat('signal_bait'));
      return {southBlocksNorth, fullWaterBlocks, noFlagBlocks};
    }""")
    check('남부에서는 북부 전용 조우가 열리지 않는다', enforce['southBlocksNorth'], str(enforce))
    check('물통이 가득하면 우물 장면이 열리지 않는다', enforce['fullWaterBlocks'], str(enforce))
    check('라디오 없이 신호 미끼가 열리지 않는다', enforce['noFlagBlocks'], str(enforce))

    print('― 예약은 도착마다 채워지고 하나씩 나온다')
    queueing = page.evaluate("""() => {
      G.newGame('onroad','큐','full');
      S.stats.km = 400;                 // 모든 거리 문턱 통과
      S.at = 'gimcheon'; S.driving = null;   // 중부 — 지역 조건 비트가 열리는 자리
      S._beatQueue=[]; S.used=[];
      G.scheduleJourneyBeat();
      const queuedAll = S._beatQueue.length;
      const first = G.popBeat();
      const afterPop = S._beatQueue.length;
      return {queuedAll, first, afterPop};
    }""")
    check('조건을 넘긴 비트가 한꺼번에 대기열에 들어간다', queueing['queuedAll'] >= 5, str(queueing))
    check('꺼내는 것은 한 번에 하나', queueing['afterPop'] == queueing['queuedAll'] - 1, str(queueing))

    print('― 미충족 기둥 접선은 출발 슬롯으로 보장된다')
    pillar_slot = page.evaluate("""() => {
      G.newGame('onroad','기둥슬롯','full');
      S.at='busan'; S.driving=null; S._beatQueue=[]; S._driveLegsSinceBlock=3;
      const unmet=Object.values(G.pillars()).some(p=>p.have<p.need);
      const started=G.startTravel('yangsan');
      const slots=(S.driving&&S.driving.slots)||[];
      return {unmet,started,hasPillar:slots.some(slot=>slot.pillarPick),slots};
    }""")
    check('미충족 기둥이 있으면 다음 길에 접선 슬롯이 생긴다',
          pillar_slot['unmet'] and pillar_slot['started'] and pillar_slot['hasPillar'],
          str(pillar_slot))

    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'여정 비트 검사 실패 {len(failures)}건: ' + ', '.join(failures))
print('✅ 쓴 것이 실제로 전달된다')
