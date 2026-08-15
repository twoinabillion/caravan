#!/usr/bin/env python3
"""장소 사건이 도로 전체로 새지 않고 영입 동선이 진행 방향을 지키는지 검사한다."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / '서울까지400km.html').as_uri()
failures = []


def check(label, ok, detail=''):
    print(('✅ ' if ok else '❌ ') + label + (f' — {detail}' if detail and not ok else ''))
    if not ok:
        failures.append(f'{label}: {detail}')


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel=os.environ.get('CARAVAN_BROWSER_CHANNEL') or None)
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.goto(GAME)
    page.click('#bt-new')
    if page.locator('#scr-mode').is_visible():
        page.click('#mode-on')
    page.fill('#inp-name', '지리QA')
    page.click('#bt-name')
    page.evaluate('UI.skipIntro()')
    page.wait_for_timeout(120)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")

    contracts = page.evaluate('''() => {
      const legacy=D.events.filter(event=>event.nearNode);
      return {
        legacy:legacy.length,
        mapped:legacy.filter(event=>D.eventLocations[event.id]).length,
        node:Object.values(D.eventLocations).filter(location=>location.kind==='node').length,
        waypoint:Object.values(D.eventLocations).filter(location=>location.kind==='waypoint').length
      };
    }''')
    check('52개 구형 nearNode 사건이 모두 위치 계약으로 이전됐다',
          contracts == {'legacy': 52, 'mapped': 52, 'node': 46, 'waypoint': 6}, str(contracts))

    busan = page.evaluate('''() => {
      G.startTravel('yangsan');
      return {
        waypoint:S.driving.slots.filter(slot=>slot.waypoint).map(slot=>slot.waypoint),
        road:G.eligible().map(event=>event.id),
        busanNode:G.nodeEvents('busan').map(event=>event.id)
      };
    }''')
    check('부산 지역 사건은 부산 탐색에 남고 양산 도로 랜덤 풀에서는 빠진다',
          'lc_busan_dried' in busan['busanNode'] and 'lc_busan_dried' not in busan['road'], str(busan))
    check('민지 첫 만남은 부산→양산의 숨은 실제 경유지로 예약된다',
          'meet_scrapyard' in busan['waypoint'] and 'meet_scrapyard' not in busan['road'], str(busan))

    minji = page.evaluate('''() => {
      const meet=D.events.find(event=>event.id==='meet_scrapyard');
      const slot=S.driving.slots.find(item=>item.waypoint==='meet_scrapyard');
      S.driving.gone=slot.at; S.stopover={eventId:meet.id,from:S.driving.from,to:S.driving.to,
        atKm:Math.round(slot.at),remainingKm:Math.round(S.driving.dist-slot.at)};
      G.applyFx(meet.choices[1].out[0].fx);
      const afterMeet={stage:S.recruitQ.stage,target:S.recruitQ.target,chain:S._chain,
        escort:S.driving.recruitEscort,sameStop:S.recruitQ.sameStop};
      S._chain=null;
      const task=D.events.find(event=>event.id==='rq_minji_task');
      G.applyFx(task.choices[2].out[0].fx);
      return {afterMeet,afterTask:{stage:S.recruitQ.stage,target:S.recruitQ.target,
        guest:S.driving.guest,roadFrom:S.recruitQ.roadFrom,gone:Math.round(S.driving.gone),
        remaining:Math.round(S.driving.dist-S.driving.gone)}};
    }''')
    check('민지는 같은 폐차장에서 바로 구조 과제로 이어지고 이미 지난 도시를 요구하지 않는다',
          minji['afterMeet']['stage'] == 'task' and minji['afterMeet']['target'] == 'yangsan' and
          minji['afterMeet']['chain'] == 'rq_minji_task' and minji['afterMeet']['sameStop'], str(minji))
    check('과제 뒤 민지는 남은 같은 주행부터 실제 임시 동행한다',
          minji['afterTask']['stage'] == 'road' and minji['afterTask']['guest'] == 'minji' and
          minji['afterTask']['roadFrom'] == 'busan' and minji['afterTask']['remaining'] > 0, str(minji))

    escorts = page.evaluate('''() => {
      const run=(id,eventId,from,to)=>{
        G.newGame('story','QA','full','keeper'); S.at=from; UI.renderAll();
        G.startTravel(to);
        const event=D.events.find(item=>item.id===eventId);
        G.applyFx(event.choices[0].out[0].fx);
        UI.renderAll();
        return {id,target:S.recruitQ&&S.recruitQ.target,escort:S.driving.recruitEscort,
          card:(document.querySelector('.road-guest-card')?.textContent||'').replace(/\\s+/g,' ').trim()};
      };
      return [
        run('parkss','meet_bus','gimcheon','gumi'),
        run('parkss','meet_bus','gimcheon','sangju'),
        run('jaeyi','jy_recruit','gimcheon','gumi'),
        run('jaeyi','jy_recruit','gumi','gimcheon')
      ];
    }''')
    check('박 선생·재이는 양방향 모두 현재 목적지까지만 동행한다',
          all(row['escort'] == row['id'] for row in escorts) and
          [row['target'] for row in escorts] == ['gumi', 'sangju', 'gumi', 'gimcheon'], str(escorts))
    check('현장 동행 카드는 되돌아갈 장소 대신 지금 향하는 정차지를 보여 준다',
          all('같은 방향의 현장 동행' in row['card'] and '되돌아가지 않고' in row['card'] for row in escorts),
          str(escorts))

    eunsu = page.evaluate('''() => {
      G.newGame('story','QA','full','keeper'); S.at='daejeon'; UI.renderAll();
      const daejeon=G.nodeEvents('daejeon').map(event=>event.id);
      G.startTravel('cheongju');
      const road=G.eligible().map(event=>event.id);
      const slots=S.driving.slots.filter(slot=>slot.waypoint).map(slot=>slot.waypoint);
      S.driving=null; S.at='cheongju'; UI.renderAll();
      return {daejeon,road,slots,cheongju:G.nodeEvents('cheongju').map(event=>event.id)};
    }''')
    check('은수는 길 한가운데가 아니라 청주 기지국을 탐색할 때만 만난다',
          'es_recruit' not in eunsu['daejeon'] and 'es_recruit' not in eunsu['road'] and
          'es_recruit' not in eunsu['slots'] and 'es_recruit' in eunsu['cheongju'], str(eunsu))

    hidden_places = page.evaluate('''() => {
      const result={};
      for(const id of ['sunflower','maehwa','cablecar','lighthouse']){
        G.newGame('story','QA','full','keeper'); S.at=id;
        result[id]=G.nodeEvents(id).map(event=>event.id);
      }
      return result;
    }''')
    check('숨은 장소는 낡은 광역 태그와 달라도 그 장소 전용 사건을 잃지 않는다',
          'ev_sunflower_field' in hidden_places['sunflower'] and
          'ev_plum_blossom' in hidden_places['maehwa'] and
          'ev_cablecar_hang' in hidden_places['cablecar'] and
          'ev_lighthouse_visit' in hidden_places['lighthouse'], str(hidden_places))

    migration = page.evaluate('''() => {
      G.newGame('story','QA','full','keeper');
      const old=JSON.parse(G.exportSave()); old.v=3; old.at=null;
      old.driving={from:'gimcheon',to:'gumi',dist:26,gone:8,road:'high',wx:'clear',slots:[],si:0};
      old.recruitQ={id:'parkss',stage:'task',target:'sangju',startedDay:old.day};
      delete old.stopover; delete old.locationContractVersion;
      localStorage.setItem('seoul400_save_v1',JSON.stringify(old));
      const loaded=G.load();
      return {loaded,v:S.v,target:S.recruitQ.target,stopover:S.stopover,contract:S.locationContractVersion};
    }''')
    check('구버전 진행도 현재 주행 방향으로 안전하게 마이그레이션된다',
          migration == {'loaded': True, 'v': 4, 'target': 'gumi', 'stopover': None, 'contract': 1},
          str(migration))
    check('장소 계약 회귀 중 브라우저 오류가 없다', not errors, str(errors))
    browser.close()

if failures:
    raise SystemExit('\n'.join(failures))
print('✅ 사건 지리·영입 동선 회귀 검사 통과')
