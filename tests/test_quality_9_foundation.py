#!/usr/bin/env python3
"""Regression coverage for the 9.0 measurement schema and release evidence."""
import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / '서울까지400km.html').as_uri()
failures = []


def check(label, ok, detail=''):
    print(('  ✅ ' if ok else '  ❌ ') + label + (f' — {detail}' if detail and not ok else ''))
    if not ok:
        failures.append(label)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(viewport={'width': 390, 'height': 780})
    errors = []
    page.on('console', lambda msg: errors.append(msg.text)
            if msg.type == 'error' and 'Failed to load resource' not in msg.text else None)
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.add_init_script('localStorage.clear()')
    page.goto(GAME)
    page.wait_for_timeout(200)

    print('― 9.0 계측 스키마')
    initial = page.evaluate("""() => {
      G.newGame('onroad','계측 테스터','summary');
      G.qualitySessionStart();
      const summary=G.qualitySummary();
      return {summary,version:S._quality.version};
    }""")
    check('품질 스키마 v3와 고정 빌드가 기록된다',
          initial['version'] == 3 and initial['summary']['build'] == '2026-08-06-quality3', str(initial))
    check('진입 방식과 여정 시작 이정표가 기록된다',
          initial['summary']['entryMode'] == 'summary' and 'journey_start' in initial['summary']['milestones'], str(initial))

    callbacks = page.evaluate("""() => {
      const memory={id:'test-memory',eventId:'test-event'};
      G.qualityChoiceRemember(memory);
      G.qualityChoiceRemember(memory);
      G.qualityChoiceEcho(memory);
      G.qualityChoiceEcho(memory);
      G.qualityChoiceLate(memory.id,'test');
      G.qualityChoiceLate(memory.id,'test');
      return G.qualitySummary().choiceCallbacks;
    }""")
    check('선택 기록·가까운 회수·먼 회수는 각각 한 번만 집계된다',
          callbacks['remembered'] == callbacks['near'] == callbacks['late'] == 1, str(callbacks))
    check('선택별 회수 상태를 함께 보존한다',
          callbacks['items']['test-memory'] == {'remembered': True, 'near': True, 'late': True}, str(callbacks))

    migrated = page.evaluate("""() => {
      S._quality.version=2;
      S._quality.build='legacy';
      delete S._quality.milestones;
      delete S._quality.choiceCallbacks;
      const q=G.ensureQualityState();
      return {version:q.version,build:q.build,milestones:q.milestones,callbacks:q.choiceCallbacks};
    }""")
    check('이전 저장은 데이터 손실 없이 v3로 보강된다',
          migrated['version'] == 3 and migrated['build'] == '2026-08-06-quality3' and
          migrated['milestones'] == {} and migrated['callbacks']['remembered'] == 0, str(migrated))

    exported = json.loads(page.evaluate("G.exportQuality('json')"))
    check('JSON 내보내기에 빌드·이정표·회수 근거가 포함된다',
          exported['summary']['build'] == '2026-08-06-quality3' and
          'milestones' in exported['summary'] and 'choiceCallbacks' in exported['summary'])

    print('― 첫 여정 안내와 주행 정산')
    flow = page.evaluate("""() => {
      G.newGame('onroad','흐름 테스터','summary');
      G.qualitySessionStart();
      UI.renderAll();
      const first=document.querySelector('.journey-guide')?.textContent||'';
      G.startTravel('yangsan');
      const driving=document.querySelector('.journey-guide')?.textContent||'';
      S.driving.eventCount=1;
      S.fuel-=3;
      S.scrap+=2;
      S.fatigue+=4;
      S.min+=35;
      G.arrive();
      const recap={...S.lastJourneyRecap,changes:[...S.lastJourneyRecap.changes]};
      const ledger=document.querySelector('.arrival-ledger')?.textContent||'';
      return {first,driving,recap,ledger};
    }""")
    check('첫 화면은 길 선택을 한 가지 다음 행동으로 안내한다',
          '1/4' in flow['first'] and '다음 길 하나를 고른다' in flow['first'], flow['first'])
    check('출발 뒤 안내가 주행과 첫 사건 규칙으로 전환된다',
          '2/4' in flow['driving'] and '주행은 자동' in flow['driving'], flow['driving'])
    check('도착 정산은 시간·사건·차량 빌드와 자원 증감을 보존한다',
          flow['recap']['minutes'] == 35 and flow['recap']['events'] == 1 and
          flow['recap']['build'] == '기본 생존형' and '연료' in flow['ledger'] and '고철' in flow['ledger'], str(flow))

    settlement = page.evaluate("""() => {
      document.querySelector('#arrival-scene').classList.remove('on');
      G.qualityMilestone('first_event',{eventId:'test'});
      S.at='miryang'; S.driving=null;
      G.qualitySettlementEnter('miryang');
      UI.renderAll();
      const before=document.querySelector('.journey-guide')?.textContent||'';
      UI.showStl('miryang');
      const visited=Boolean(G.qualitySummary().milestones.first_settlement_visit);
      document.querySelector('#ovl-stl').classList.remove('on');
      G.qualityMilestone('temporary_companion',{companionId:'minji'});
      UI.renderAll();
      return {before,visited,finished:!document.querySelector('.journey-guide')};
    }""")
    check('첫 정착지 도착 뒤 실제 진입 행동을 안내한다',
          '3/4' in settlement['before'] and '정착지 안으로' in settlement['before'], str(settlement))
    check('정착지 진입과 임시 동행까지 안내 진행을 계측하고 마친다',
          settlement['visited'] and settlement['finished'], str(settlement))

    replay = page.evaluate("""() => {
      G.archiveQualityRun('liberate');
      G.newGame('onroad','두 번째','summary');
      G.qualitySessionStart();
      UI.renderAll();
      const guide=Boolean(document.querySelector('.journey-guide'));
      document.querySelector('#bt-preview').click();
      return {guide,previous:document.querySelector('#previous-journey')?.textContent||''};
    }""")
    check('두 번째 여정은 배운 안내를 자동으로 접는다', not replay['guide'], str(replay))
    check('새 출발 전 이전 빌드와 다른 노선 소문을 보여 준다',
          '기본 생존형' in replay['previous'] and '이번에는 다른 소문' in replay['previous'], replay['previous'])

    approach_callbacks = page.evaluate("""() => {
      G.newGame('onroad','합류 회수','summary');
      return Object.entries(D.recruitQuests).map(([id,quest])=>{
        const choice=Object.keys(quest.approaches)[0];
        S.party=[id]; S.comps[id].approach=choice;
        delete S.flags[`${id}_approach_drive`];
        const drive={slots:[{at:1},{at:2}]};
        const memory=G.prepareRecruitMemory(drive);
        const changed=['memoryFuel','memoryFatigue','memoryFatigueStart','memoryPursuit','memorySkippedEvent','memoryScrap','memoryVan']
          .some(key=>drive[key]!==undefined);
        return {id,choice,memory:Boolean(memory),changed,effect:memory&&memory.effect};
      });
    }""")
    check('여섯 동료의 영입 방식이 첫 합류 뒤 실제 주행 효과로 회수된다',
          all(row['memory'] and row['changed'] and row['effect'] for row in approach_callbacks), str(approach_callbacks))

    completion = page.evaluate("""() => {
      G.newGame('onroad','완주 테스터','summary');
      G.qualitySessionStart();
      S.flags.core_transfer=true;
      S.party=['minji'];
      S.comps.minji.approach='winch';
      S.flags.minji_approach_drive=true;
      for(let index=1;index<=4;index++){
        const memory={id:`ending-${index}`,eventId:'test',eventTitle:`선택 ${index}`,
          summary:`실제 여정 선택 ${index}`,day:index,choiceIndex:0};
        S.memories.choices[memory.id]=memory;
        S.memories.history.push(memory.id);
        G.qualityChoiceRemember(memory);
      }
      const first=G.completeJourney();
      const archiveCount=G.qualityArchive().length;
      const second=G.completeJourney();
      const summary=G.qualitySummary();
      const last=G.qualityArchive().slice(-1)[0];
      return {first,second,archiveCount,archiveAfter:G.qualityArchive().length,summary,last,
        recruitEchoes:S.lastRecruitApproachEchoes,endingFlag:S.flags.minji_approach_ending,
        archived:S.flags.run_archived};
    }""")
    check('성공 완주는 실제 선택 네 개를 결말 회수로 남긴다',
          len(completion['first']) >= 4 and completion['summary']['choiceCallbacks']['late'] == 4, str(completion))
    check('영입 방식은 첫 주행 뒤 결말에서 두 번째로 회수된다',
          completion['endingFlag'] and completion['recruitEchoes'][0]['choice'] == 'winch' and
          completion['last']['recruitApproaches'][0]['driveEchoed'], str(completion))
    check('성공 완주는 한 번만 보관되고 이전 여정 자료가 된다',
          completion['archived'] and completion['last']['ending'] == 'transfer' and
          completion['archiveCount'] == completion['archiveAfter'] and completion['second'] == [], str(completion))
    check('콘솔/런타임 오류 0건', not errors, str(errors[:5]))
    browser.close()

if failures:
    print('\n실패 목록:')
    for failure in failures:
        print(f'- {failure}')
    raise SystemExit(1)
print('\n✅ 9.0 계측 기반 회귀 전부 통과')
