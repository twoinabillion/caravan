#!/usr/bin/env python3
"""서울 내부 오르막 — 관문에서 결말까지 실엔진으로 끝까지 돈다.

2026-08-07까지 서울 내부(관문→한강→폐허→광장→기지→코어→에필로그→결말)를
자동으로 끝까지 돌아본 적이 없다. 완주봇도 'completed' 판정에서 멈춘다.
이 검사는 기둥을 채운 상태에서 관문 이벤트 연쇄→정거장 5개→에필로그를
실제 이벤트 해석으로 밟고, 도착 시점에 따라 세 결말(제때/늦음/빈 구역)이
실제로 갈리는지를 본다.
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


RUN_JS = """(arrivalDay) => {
  const noop=()=>{};
  for(const k of ['toast','speak','renderAll','renderHud','onDepart','clearSpeech','playChat','playRadio']) UI[k]=noop;
  UI.onArrive=()=>0; UI.modalOpen=()=>false; UI.showStl=noop;
  let pending=null, endShown=null;
  UI.showEvent=(e)=>{ pending=e; };
  UI.showEnding=(kind)=>{ endShown=kind; };
  UI.showSeoul=noop;

  const resolve=()=>{
    let guard=0;
    while(pending&&guard++<20){
      const evd=pending; pending=null;
      const usable=(evd.choices||[]).filter(c=>{
        if(!c.req) return true;
        const rq=G.reqOk(c.req); return !rq||rq.ok!==false;
      });
      if(!usable.length) break;
      const o=G.pickOutcome(evd, usable[0]);
      G.applyFx(o.fx||{});
      if(o.fx&&o.fx.chain){ const nx=D.events.find(e=>e.id===o.fx.chain); if(nx) G.openEvent(nx); }
    }
    pending=null;
  };

  G.newGame('onroad','서울','full');
  S.water=40; S.food=40; S.fuel=90; S.scrap=200; S.items['부품']=10;
  for(const uid of ['bench','cabin']) if(G.canBuyUp(uid).ok) G.buyUpgrade(uid);   // 좌석 한도(기본 2) 해제
  // 기둥을 실제 데이터 경로로 채운다: 동료 3인 Lv3 + 세계 접선 3 + 진실 3 + 유산 2
  for(const cid of ['minji','parkss','leo']){
    G.doRecruit(cid); S.comps[cid].approach=Object.keys(D.recruitQuests[cid].approaches)[0];
    for(let k=0;k<30&&(S.comps[cid].lvl||0)<3;k++){ G.bond(cid,2); if(S.comps[cid].pending) G.choosePerk(cid,0); }
  }
  for(const f of ['cell_road','cell_sea','cell_dome']) S.flags[f]=true;
  for(const f of ['massacre_known','parent_key_found','es_truth']) S.flags[f]=true;
  for(const f of ['postman_letter','gp_envelope_found']) S.flags[f]=true;
  S.day=arrivalDay;
  if(!G.seoulReady()) return {err:'기둥 미충족', missing:G.seoulMissing()};

  // 관문 — 실제 도착 경로
  S.at='suwon'; S.flags.bridge_crossed=true;
  S.at='seoul';
  G.openEvent(D.seoulOpenEvent); resolve();
  const opened=!!S.flags.seoul_open;

  // 오르막 다섯 정거장
  const stops=[];
  let guard=0;
  while(G.seoulStage()<D.seoulMap.stops.length&&guard++<12){
    const i=G.seoulStage();
    G.seoulEnter(i); resolve();
    stops.push(D.seoulMap.stops[i].id+':'+(G.seoulStopDone(i)?'완료':'미완'));
    if(!G.seoulStopDone(i)) break;
  }

  // 에필로그 — 큐에 남은 본편 연쇄를 소화한다
  let epGuard=0;
  while(epGuard++<8&&!S.ended){
    const queued=G.popStory&&G.popStory();
    if(!queued) break;
    G.openEventById(queued); resolve();
  }
  const night=D.events.find(e=>e.id==='seoul_night');
  if(night&&!S.ended){ G.openEvent(night); resolve(); }

  return {opened, stops, stage:G.seoulStage(), ended:!!S.ended,
          endKind:S.endKind||endShown||null, storyDone:!!S.flags.story_done,
          transfer:D.transferStatus(S)};
}"""

with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.add_init_script('localStorage.clear()')
    page.goto(GAME)

    deadline = page.evaluate('D.transferDeadlineDay')

    print('― 제때 도착 (시한 안)')
    ontime = page.evaluate(RUN_JS, deadline - 2)
    check('관문이 열린다', bool(ontime.get('opened')), str(ontime)[:160])
    check('정거장 5개 전부 완료', ontime.get('stage') == 5, str(ontime.get('stops')))
    check('에필로그가 여정을 닫는다', bool(ontime.get('ended')), str(ontime.get('endKind')))
    check('제때 결말(story_done)', ontime.get('endKind') == 'story_done', str(ontime.get('endKind')))

    print('― 늦은 도착 (시한 뒤, 잔여 주민 있음)')
    late = page.evaluate(RUN_JS, deadline + 3)
    check('늦어도 완주는 된다', bool(late.get('ended')), str(late.get('stops')))
    check('늦은 결말(too_late)', late.get('endKind') == 'too_late',
          f"endKind={late.get('endKind')} transfer={late.get('transfer', {}).get('onTime')}")

    print('― 아주 늦은 도착 (구역이 빈 뒤)')
    empty_day = page.evaluate('(d)=>{ for(let day=d; day<d+120; day++){ if(D.transferStatus({day,flags:{}}).remainingResidents<=0) return day; } return null; }', deadline)
    check('구역이 비는 날이 존재한다', empty_day is not None, str(empty_day))
    if empty_day:
        empty = page.evaluate(RUN_JS, empty_day + 1)
        check('빈 구역 결말(empty_district)', empty.get('endKind') == 'empty_district', str(empty.get('endKind')))

    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'서울 시퀀스 검증 실패 {len(failures)}건: ' + ', '.join(failures[:6]))
print('✅ 관문→오르막→에필로그→세 갈래 결말이 실엔진으로 끝까지 돈다')
