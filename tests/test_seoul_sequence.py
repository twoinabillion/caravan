#!/usr/bin/env python3
"""서울 내부 오르막 — 관문에서 결말까지 실엔진으로 끝까지 돈다.

2026-08-07까지 서울 내부(관문→한강→폐허→광장→기지→코어→에필로그→결말)를
자동으로 끝까지 돌아본 적이 없다. 완주봇도 'completed' 판정에서 멈춘다.
이 검사는 기둥을 채운 상태에서 관문 이벤트 연쇄→정거장 5개→에필로그를
실제 이벤트 해석으로 밟고, 도착 날짜와 무관하게 같은 완결에 도달하는지 본다.
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
  // 기둥과 부모 추적선을 실제 데이터 경로로 채운다.
  S.party=['minji','parkss','leo'];
  for(const cid of S.party) S.comps[cid]={mood:80,bond:20,lvl:3,perks:[]};
  for(const f of ['cell_road','cell_sea','cell_dome']) S.flags[f]=true;
  for(const f of ['massacre_known','first_order_trace','parent_key_found','es_truth',
                  'parents_routes_traced','father_fate_known','mother_reunited']) S.flags[f]=true;
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

    print('― 날짜 제한 없는 서울 도착')
    early = page.evaluate(RUN_JS, 5)
    late = page.evaluate(RUN_JS, 120)
    check('이른 도착에서 관문이 열린다', bool(early.get('opened')), str(early)[:160])
    check('늦은 도착에서도 관문이 열린다', bool(late.get('opened')), str(late)[:160])
    check('두 경우 모두 정거장 5개를 완료한다',
          early.get('stage') == 5 and late.get('stage') == 5, str([early.get('stops'), late.get('stops')]))
    check('두 경우 모두 날짜와 무관하게 본편이 완결된다',
          early.get('ended') and late.get('ended') and
          early.get('endKind') == 'story_done' and late.get('endKind') == 'story_done',
          str([early.get('endKind'), late.get('endKind')]))
    check('늦게 도착해도 주민 이송 피해가 생기지 않는다',
          early.get('transfer', {}).get('departed') == 0 and
          late.get('transfer', {}).get('departed') == 0 and
          late.get('transfer', {}).get('remainingResidents') == 6412,
          str(late.get('transfer')))

    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'서울 시퀀스 검증 실패 {len(failures)}건: ' + ', '.join(failures[:6]))
print('✅ 관문→오르막→에필로그가 도착 날짜와 무관하게 끝까지 돈다')
