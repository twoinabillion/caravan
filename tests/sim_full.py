# 완주 밸런스 시뮬레이터 — 실엔진을 봇이 몰고 부산→(동료 6 영입 투어)→수원까지.
# 이벤트는 자동 해소(감당 가능한 선택지 중 무작위, out은 p-가중 추첨). 결과: 자원/유대/영입/위기 통계.
# 사용: python3 tests/sim_full.py [runs]
import sys, json, statistics as st
from pathlib import Path
from playwright.sync_api import sync_playwright

RUNS = int(sys.argv[1]) if len(sys.argv) > 1 else 12
HTML = Path(__file__).resolve().parent.parent / '서울까지400km.html'

SETUP = r'''() => {
  window.SIM = {ev:0, evIds:{}, crises:{}, recruitedDay:{}, log:[],
                minFood:99, minWater:99, foodZeroDays:0, waterZeroDays:0, stranded:false};
  // 이벤트 자동 해소기 — UI를 열지 않고 즉시 선택/적용
  const pickOut = (outs) => { let tot=0; outs.forEach(o=>tot+=(o.p||1));
    let r = Math.random()*tot; for(const o of outs){ r-=(o.p||1); if(r<=0) return o; } return outs[outs.length-1]; };
  UI.onArrive = () => 0;   // 도착 연출 스킵 — locEvent 즉시 개봉
  const _end = G.endGame; G.endGame = (kind)=>{ SIM.endKind = kind; S.ended = true; };   // 사인 기록(연출 스킵)
  G.openEvent = (evd) => {
    if(!evd) return;
    if(evd.once) S.used.push(evd.id);
    SIM.ev++; SIM.evIds[evd.id]=(SIM.evIds[evd.id]||0)+1; SIM.lastEv=evd.id;
    if(evd.id && evd.id.startsWith('crisis_')) SIM.crises[evd.id]=(SIM.crises[evd.id]||0)+1;
    const affordable = (evd.choices||[]).filter(c=>!c.req || G.reqOk(c.req).ok);
    if(!affordable.length) return;
    // 기대효용: 부족한 자원일수록 가중 (봇 생존 정책)
    const scF=S.food<5?3:1, scW=S.water<5?3:1, scFu=S.fuel<15?2.5:1;
    const util=(fx)=>{ if(!fx) return 0;
      return (fx.food||0)*2*scF + (fx.water||0)*2*scW + (fx.fuel||0)*1.5*scFu
           + (fx.scrap||0)*0.7 + (fx.van||0)*0.25 + (fx.moodAll||0)*0.3
           - (fx.pursuit||0)*1.5 - (fx.time||0)*0.005 + (fx.offerComp?50:0) + (fx.recruit?50:0); };
    const score=(ch)=>{ let tot=0,s2=0; (ch.out||[]).forEach(o=>{ tot+=(o.p||1); s2+=(o.p||1)*util(o.fx); }); return tot? s2/tot : 0; };
    affordable.sort((a,b)=>score(b)-score(a));
    const mustTake = affordable.find(c=>(c.out||[]).some(o=>o.fx&&(o.fx.offerComp||o.fx.recruit)));
    const ch = mustTake || ((Math.random()<0.75)? affordable[0] : affordable[Math.floor(Math.random()*affordable.length)]);
    const out = pickOut(ch.out||[]);
    if(out && out.fx){
      const fx = out.fx;
      if(fx.offerComp && !G.hasComp(fx.offerComp)){ G.doRecruit(fx.offerComp); SIM.recruitedDay[fx.offerComp]=S.day; }
      G.applyFx(fx);
      if(fx.recruit) SIM.recruitedDay[fx.recruit]=S.day;
      if(S._chain){ const cid=S._chain; S._chain=null; G.openEventById(cid); }
    }
  };
  return true;
}'''

# 동료 투어 순서: 지역상 남→북 (compWhere 기준 대표 노드들)
STEP = r'''() => {
  const OUT = {done:false, note:''};
  if(!window.SIM || SIM.stranded){ OUT.done=true; return OUT; }
  const TOUR = [
    ['minji',  ['ulsan','gyeongju','pohang']],
    ['kangwoo',['daegu']],
    ['parkss', ['gumi','gimcheon','sangju']],
    ['jaeyi',  ['gunsan','gimcheon']],
    ['leo',    ['jeonju','gwangju','damyang']],
    ['eunsu',  ['daejeon','sejong']],
    [null,     ['cheonan','suwon']],
  ];
  const dist=(a,b)=>{const A=D.nodes[a],B=D.nodes[b];return Math.hypot(A.x-B.x,A.y-B.y);};
  const target=()=>{ for(const [c,nodes] of TOUR){ if(c && !G.hasComp(c)) return nodes;
      if(!c) return nodes; } return ['suwon']; };

  // 주행 중이면 도착까지 밟는다 (이벤트는 자동 해소됨)
  const wasDriving = !!S.driving;
  if(S.driving){ let g=0; while(S.driving && g++<600) G.tick(4); }
  if(S.ended){ OUT.done=true; OUT.note='ended:'+(SIM.endKind||SIM.lastEv||'?'); return OUT; }
  if(wasDriving && !S.driving){ return OUT; }   // 방금 도착 — locEvent 타이머 소화용 양보

  // 통계
  SIM.minFood=Math.min(SIM.minFood,S.food); SIM.minWater=Math.min(SIM.minWater,S.water);

  // 정착지 거래 — 부족분 보충 (trade 테이블 파싱: [비용, 획득] 'scrap3'식)
  const stl = S.at && D.nodes[S.at] && D.nodes[S.at].stl ? D.stls[D.nodes[S.at].stl] : null;
  if(stl && stl.trade){
    // 포맷: [라벨, 종류(fuel/water/food/itemX), 수량, 고철값]
    for(let i=0;i<30;i++){
      const needF=S.food<14, needW=S.water<14, needFu=S.fuel<36;
      if(!needF&&!needW&&!needFu) break;
      let did=false;
      for(const row of stl.trade){
        const [,kind,amt,cost]=row;
        const want=(kind==='food'&&needF)||(kind==='water'&&needW)||(kind==='fuel'&&needFu);
        if(!want||S.scrap<cost) continue;
        S.scrap-=cost;
        if(kind==='food')S.food+=amt; else if(kind==='water')S.water+=amt;
        else if(kind==='fuel')S.fuel=Math.min(S.fuelMax,S.fuel+amt);
        did=true; break;
      }
      if(!did) break;
    }
  }

  // 좌석 업그레이드 (영입 캡 해제가 최우선) → 이후 연료탱크
  const SEATQ=['bench','jumpseat','bunk','cabin'];
  for(const uid of SEATQ){ if(!(S.up&&S.up[uid])){ if(G.buyUpgrade(uid)){ (SIM.upBought=SIM.upBought||[]).push(uid+'@D'+S.day); } break; } }
  if(SEATQ.every(u=>S.up&&S.up[u]) && !(S.up&&S.up.tank1)){ if(G.buyUpgrade('tank1')) (SIM.upBought=SIM.upBought||[]).push('tank1@D'+S.day); }

  // 정착지 영입 (강우 — 대구 돔 시장)
  if(stl && stl.recruit && !G.hasComp(stl.recruit)){ G.doRecruit(stl.recruit); SIM.recruitedDay[stl.recruit]=S.day; }

  // 낮이면 현재 노드에서 탐색 1회 (자원 루프의 핵심)
  if(S.at && !G.isNight() && S.fatigue<75){ try{ G.explore(); }catch(e){} }

  // 하루 한 번 1:1 대화 (유대 곡선 측정) — 유대 낮은 동료 우선
  if(S.party.length){ const id=[...S.party].sort((a,b)=>S.comps[a].bond-S.comps[b].bond)[0];
    try{ G.talkTo(id); }catch(e){} }

  // 밤이거나 피로하면 야영
  if(G.isNight() || S.fatigue>=65){ if(S.food<=0) SIM.foodZeroDays++; if(S.water<=0) SIM.waterZeroDays++;
    G.camp(); return OUT; }

  // 목적지 향해 한 칸 이동
  const tg=target(); if(S.at===tg[0]||tg.includes(S.at)){
    if(!TOUR.some(([c])=>c&&!G.hasComp(c)) && tg.includes('suwon') && S.at==='suwon'){ OUT.done=true; OUT.note='arrived'; return OUT; }
  }
  const cand = tg.filter(n=>S.known.includes(n));
  const goal = cand.length? cand.sort((a,b)=>dist(S.at,a)-dist(S.at,b))[0] : tg[0];
  const nbrs = D.edges.filter(e=>e[0]===S.at||e[1]===S.at)
    .map(e=>e[0]===S.at?e[1]:e[0]).filter(n=>S.known.includes(n));
  if(!nbrs.length){ SIM.stranded=true; OUT.done=true; OUT.note='no-edge'; return OUT; }
  nbrs.sort((a,b)=>dist(a,goal)-dist(b,goal));
  if(SIM.lastFrom && nbrs.length>1){ const i=nbrs.indexOf(SIM.lastFrom); if(i===0){ nbrs.push(nbrs.shift()); } }
  let moved=false;
  for(const n of nbrs){ if(G.startTravel(n)){ moved=true; break; } }
  if(!moved){ // 연료 0 — 위기(걸어서 기름 구함) 발동, 그래도 12회 연속이면 좌초
    SIM.failDays=(SIM.failDays||0)+1;
    if(S.fuel<=0){ G.openEventById('crisis_nofuel'); }
    if(SIM.failDays>=12){ SIM.stranded=true; OUT.done=true; OUT.note='stranded-fuel'; return OUT; }
    if(!G.isNight() && S.fatigue<80){ try{ G.explore(); }catch(e){} }
    else G.camp();
  } else { SIM.failDays=0; SIM.lastFrom=S.driving?S.driving.from:null; }
  return OUT;
}'''

COLLECT = r'''() => ({
  day:S.day, party:S.party.length, fuel:Math.round(S.fuel), food:S.food, water:S.water,
  van:Math.round(S.van), scrap:S.scrap,
  bonds:Object.fromEntries(Object.entries(S.comps).map(([k,v])=>[k,v.bond])),
  lvls:Object.fromEntries(Object.entries(S.comps).map(([k,v])=>[k,v.lvl])),
  ev:SIM.ev, evUnique:Object.keys(SIM.evIds).length, crises:SIM.crises,
  recruitedDay:SIM.recruitedDay, minFood:SIM.minFood, minWater:SIM.minWater,
  foodZeroDays:SIM.foodZeroDays, waterZeroDays:SIM.waterZeroDays,
  stranded:SIM.stranded, km:Math.round(S.stats.km), endKind:SIM.endKind||null, upBought:SIM.upBought||[]
})'''

def run():
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for i in range(RUNS):
            pg = browser.new_page()
            errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.goto(HTML.as_uri())
            pg.wait_for_timeout(400)
            # 실제 UI로 게임 진입 (모달 판정이 tick을 막지 않게)
            pg.evaluate('localStorage.clear()')
            pg.click('#bt-new'); pg.wait_for_timeout(120)
            pg.click('#mode-on'); pg.wait_for_timeout(200)
            for _ in range(pg.evaluate('D.intro.length')):
                pg.click('#scr-intro'); pg.wait_for_timeout(60)
            pg.fill('#inp-name', '봇'); pg.click('#bt-name'); pg.wait_for_timeout(200)
            pg.evaluate(SETUP)
            note = ''
            for step in range(900):
                r = pg.evaluate(STEP)
                pg.wait_for_timeout(12)  # locEvent/캠프 setTimeout 소화
                if r.get('done'):
                    note = r.get('note',''); break
                day = pg.evaluate('S ? S.day : 99')
                if day > 45: note = 'timeout45d'; break
            data = pg.evaluate(COLLECT)
            data['endNote'] = note
            data['jsErrors'] = len(errs)
            results.append(data)
            print(f"run{i+1:02d}: {note or 'maxstep'} day={data['day']} party={data['party']} "
                  f"km={data['km']} fuel={data['fuel']} food={data['food']} water={data['water']} "
                  f"ev={data['ev']} up={len(data['upBought'])} 좌초={data['stranded']} err={data['jsErrors']}")
            pg.close()
        browser.close()

    ok = [r for r in results if r['endNote'] == 'arrived']
    print('\n══════ 요약 ══════')
    print(f"수원 도달(6인 완주): {len(ok)}/{len(results)}")
    for k, label in [('day','소요 일수'), ('ev','이벤트 수'), ('evUnique','고유 이벤트')]:
        vals = [r[k] for r in ok] or [r[k] for r in results]
        print(f"{label}: 평균 {st.mean(vals):.1f} (min {min(vals)} / max {max(vals)})")
    starve = sum(1 for r in results if r['foodZeroDays']>0 or r['waterZeroDays']>0)
    print(f"식량/물 0 경험 런: {starve}/{len(results)} · 좌초: {sum(1 for r in results if r['stranded'])}")
    crisis_tot = {}
    for r in results:
        for k,v in r['crises'].items(): crisis_tot[k]=crisis_tot.get(k,0)+v
    print(f"위기 발생 합계: {crisis_tot}")
    comps = ['minji','parkss','kangwoo','leo','jaeyi','eunsu']
    print('\n동료별 (도달런 기준): 영입일 / 최종 유대 / 레벨')
    for c in comps:
        rd = [r['recruitedDay'].get(c) for r in ok if r['recruitedDay'].get(c)]
        bd = [r['bonds'][c] for r in ok if r['recruitedDay'].get(c)]
        lv = [r['lvls'][c] for r in ok if r['recruitedDay'].get(c)]
        if rd:
            print(f"  {c:8s} 영입 {len(rd)}/{len(ok)}런 · 평균 D{st.mean(rd):.0f} · 유대 {st.mean(bd):.1f} (max {max(bd)}) · 평균Lv {st.mean(lv):.1f}")
        else:
            print(f"  {c:8s} 영입 0런")
    b20 = sum(1 for r in ok for c in comps if r['bonds'][c] >= 20)
    print(f"\nbond20 도달 (동료×런): {b20} / {len(ok)*6}")
    err_runs = sum(1 for r in results if r['jsErrors'])
    print(f"JS 에러 발생 런: {err_runs}/{len(results)}")

if __name__ == '__main__':
    run()
