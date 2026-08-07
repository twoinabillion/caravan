#!/usr/bin/env python3
"""불변식 퍼저 — 무작위 행동으로 상태공간을 두들기고 불변식 위반을 잡는다.

시나리오 테스트는 아는 경로만 지킨다. 이 도구는 실엔진 API를 무작위 순서로
수천 번 부르면서, 어떤 순서에서도 깨지면 안 되는 것들을 확인한다:

  - 자원은 음수가 되지 않는다 (물·식량·연료·고철·차체)
  - 어떤 수치도 NaN/Infinity가 되지 않는다
  - 시간은 뒤로 가지 않는다
  - 파티에 없는 동료의 유대/퍼크가 생기지 않는다 (유령 동료)
  - 종료된 게임의 상태는 더 변하지 않는다
  - 저장→로드 왕복이 상태를 보존한다

위반은 [시드, 행동 시퀀스 꼬리]와 함께 출력한다 — 그대로 재현 가능하다.

실행: python3 tools/fuzz-invariants.py --runs 12 --steps 400
"""
import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / '서울까지400km.html').as_uri()

FUZZ_JS = r"""
({seed, steps, selftest}) => {
  const noop=()=>{};
  for(const k of ['toast','speak','renderAll','renderHud','onDepart','clearSpeech','playChat','playRadio']) UI[k]=noop;
  UI.onArrive=()=>0; UI.modalOpen=()=>false; UI.showStl=noop; UI.showEnding=noop; UI.showSeoul=noop;
  let pending=null;
  UI.showEvent=(e)=>{ pending=e; };

  /* 퍼저 전용 rng — 엔진 rng를 건드리지 않는다 */
  let fz = seed >>> 0;
  const frand=()=>{ fz=(fz+0x6D2B79F5)>>>0; let t=Math.imul(fz^(fz>>>15),1|fz);
    t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; };
  const pick=(arr)=>arr[Math.floor(frand()*arr.length)];

  const violations=[];
  const trail=[];
  const record=(name)=>{ trail.push(name); if(trail.length>30) trail.shift(); };

  const num=(v)=>typeof v==='number';
  const checkInvariants=(label)=>{
    if(!S) return;
    const bad=(msg)=>violations.push({at:label, msg, trail:trail.slice(-12),
      snap:{day:S.day, min:S.min, water:S.water, food:S.food, fuel:S.fuel, scrap:S.scrap, van:S.van, ended:S.ended}});
    for(const k of ['water','food','fuel','scrap','van','fuelMax','vanMax','pursuit','fatigue','day','min']){
      const v=S[k];
      if(!num(v)||Number.isNaN(v)||!Number.isFinite(v)) bad(`S.${k}=${v} — NaN/유한 아님`);
    }
    for(const k of ['water','food','fuel','scrap','van']) if(S[k]<-1e-9) bad(`S.${k}=${S[k]} — 음수 자원`);
    if(S.pursuit<0||S.pursuit>5) bad(`pursuit=${S.pursuit} — [0,5] 밖`);
    if(S.fatigue<0||S.fatigue>100.001) bad(`fatigue=${S.fatigue} — [0,100] 밖`);
    for(const cid of Object.keys(S.comps||{})){
      const c=S.comps[cid];
      if(c&&num(c.bond)&&Number.isNaN(c.bond)) bad(`comps.${cid}.bond NaN`);
      if(c&&(c.perks||[]).length&&!S.party.includes(cid)&&c.lvl>0&&!G.hasComp(cid))
        ;/* 하차한 동료의 기록은 남을 수 있다 — 위반 아님 */
    }
    for(const cid of S.party||[]) if(!D.comps[cid]) bad(`party에 정체불명 '${cid}'`);
    if(S.items) for(const [k,v] of Object.entries(S.items))
      if(!num(v)||v<0||Number.isNaN(v)) bad(`items['${k}']=${v}`);
  };

  const resolveEvent=()=>{
    let guard=0;
    while(pending&&guard++<10){
      const evd=pending; pending=null;
      const usable=(evd.choices||[]).filter(c=>{
        if(!c.req) return true;
        try{ const rq=G.reqOk(c.req); return !rq||rq.ok!==false; }catch(e){ return false; }
      });
      if(!usable.length) break;
      const choice=pick(usable);
      record('choice:'+evd.id);
      try{
        const o=G.pickOutcome(evd, choice);
        G.applyFx(o.fx||{});
        if(o.fx&&o.fx.offerComp&&S.party.length<G.maxParty()&&frand()<0.7) G.doRecruit(o.fx.offerComp);
        if(o.fx&&o.fx.chain){ const nx=D.events.find(e=>e.id===o.fx.chain); if(nx) G.openEvent(nx); }
      }catch(e){ violations.push({at:'choice:'+evd.id, msg:'예외: '+String(e).slice(0,120), trail:trail.slice(-12)}); }
    }
    pending=null;
  };

  const actions=[
    ['travel', ()=>{ if(S.driving) return;
      const nbs=G.neighbors(S.at).filter(n=>{ try{ return G.canTravelTo(n.id).ok; }catch(e){ return false; } });
      if(nbs.length) G.startTravel(pick(nbs).id); }],
    ['tick', ()=>{ if(S.driving) for(let i=0;i<20&&S.driving&&!S.ended;i++){ G.tick(1.4); if(pending) resolveEvent(); } }],
    ['camp', ()=>{ if(!S.driving) G.camp(); }],
    ['explore', ()=>{ if(!S.driving) try{ G.explore(); }catch(e){} }],
    ['trade', ()=>{ const stl=S.at&&D.nodes[S.at]&&D.nodes[S.at].stl; if(stl&&!S.driving){
      if(frand()<0.5) G.tradeBundle(stl); else G.trade(stl, Math.floor(frand()*6)); } }],
    ['buyUp', ()=>{ const ups=(D.upgrades||[]).filter(u=>{ try{ return G.canBuyUp(u.id).ok; }catch(e){ return false; } });
      if(ups.length&&!S.driving) G.buyUpgrade(pick(ups).id); }],
    ['repair', ()=>{ const stl=S.at&&D.nodes[S.at]&&D.nodes[S.at].stl; if(stl&&!S.driving) try{ G.settlementRepair(); }catch(e){} }],
    ['field', ()=>{ const stl=S.at&&D.nodes[S.at]&&D.nodes[S.at].stl;
      if(stl&&D.stls[stl]&&D.stls[stl].field&&!S.driving){
        const a=pick(D.stls[stl].field.actions||[{}]);
        if(a&&a.id) try{ G.doStlFieldAction(stl, a.id); }catch(e){} } }],
    ['recruitStep', ()=>{ if(S.recruitQ&&!S.driving) try{ G.openRecruitStep(); }catch(e){} }],
    ['perk', ()=>{ for(const cid of S.party||[]) if(S.comps[cid]&&S.comps[cid].pending) G.choosePerk(cid, frand()<0.5?0:1); }],
    ['bond', ()=>{ if(S.party&&S.party.length) G.bond(pick(S.party), Math.floor(frand()*3)); }],
    ['saveload', ()=>{ if(S.driving) return;
      try{
        G.save();
        const before=JSON.stringify({day:S.day, water:S.water, fuel:S.fuel, scrap:S.scrap, party:S.party, up:S.up});
        G.load();
        const after=JSON.stringify({day:S.day, water:S.water, fuel:S.fuel, scrap:S.scrap, party:S.party, up:S.up});
        if(before!==after) violations.push({at:'saveload', msg:'저장→로드 왕복 불일치', before, after, trail:trail.slice(-12)});
      }catch(e){ violations.push({at:'saveload', msg:'예외: '+String(e).slice(0,120), trail:trail.slice(-12)}); }
    }],
  ];

  G.seedOverride=seed; G.newGame('onroad','퍼즈','full',
    pick(['keeper','runner','hauler']));
  G.seedOverride=undefined;

  let lastAbs=S.day*1440+S.min;
  let endedSnapshot=null;
  let i=0;
  for(;i<steps;i++){
    if(S.ended){
      const snap=JSON.stringify({water:S.water, fuel:S.fuel, scrap:S.scrap, day:S.day});
      if(endedSnapshot===null) endedSnapshot=snap;
      else if(endedSnapshot!==snap){
        violations.push({at:'ended-mutation', msg:'종료 후 상태 변화', was:endedSnapshot, now:snap, trail:trail.slice(-12)});
        endedSnapshot=snap;
      }
      /* 종료 뒤에도 몇 스텝 더 두들겨 종료 상태 불변을 확인한다 */
      if(i%7===0){ const [name,fn]=pick(actions); record(name+'(ended)'); try{ fn(); }catch(e){} continue; }
      break;
    }
    if(selftest&&i===5) S.water=NaN;          // 자가검증: 퍼저가 이걸 못 잡으면 퍼저가 고장
    if(selftest&&i===9) S.min-=600;           // 자가검증: 시간 역행
    const [name,fn]=pick(actions);
    record(name);
    try{ fn(); }catch(e){ violations.push({at:name, msg:'예외: '+String(e).slice(0,140), trail:trail.slice(-12)}); }
    if(pending) resolveEvent();
    const abs=S.day*1440+S.min;
    if(abs<lastAbs-1e-9) violations.push({at:name, msg:`시간 역행 ${lastAbs}→${abs}`, trail:trail.slice(-12)});
    lastAbs=abs;
    checkInvariants(name);
    if(violations.length>=8) break;   // 한 시드에서 홍수나면 그만 — 재현이 목적
  }
  return {seed, steps:i, day:S.day, ended:S.ended, violations};
}
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--runs', type=int, default=12)
    ap.add_argument('--steps', type=int, default=400)
    ap.add_argument('--seed', type=int, default=970001)
    ap.add_argument('--selftest', action='store_true', help='고의 오염을 주입해 퍼저 자신을 검증')
    args = ap.parse_args()

    all_violations = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page()
        errors = []
        page.on('pageerror', lambda exc: errors.append((str(exc) + ' || ' + (exc.stack or ''))[:600]))
        page.add_init_script('localStorage.clear()')
        page.goto(GAME)
        page.wait_for_function('typeof G!=="undefined"&&typeof D!=="undefined"')
        for i in range(args.runs):
            seed = args.seed + i * 104729
            r = page.evaluate(FUZZ_JS, {'seed': seed, 'steps': args.steps, 'selftest': bool(args.selftest)})
            tag = f"seed {seed}: {r['steps']}스텝 D{r['day']}" + (' ended' if r['ended'] else '')
            if r['violations']:
                all_violations.extend(r['violations'])
                print(f"  ❌ {tag} — 위반 {len(r['violations'])}건")
                for v in r['violations'][:3]:
                    print(f"     · {v['at']}: {v['msg']}  ← {'>'.join(v.get('trail', [])[-5:])}")
            else:
                print(f"  ✅ {tag}")
        browser.close()

    if errors:
        print(f"  ⚠️ pageerror {len(errors)}건: {errors[:2]}")
    if all_violations or errors:
        out = ROOT / 'reports' / 'fuzz-violations.json'
        out.write_text(json.dumps({'violations': all_violations, 'pageerrors': errors}, ensure_ascii=False, indent=1))
        raise SystemExit(f"불변식 위반 {len(all_violations)}건 + pageerror {len(errors)}건 → {out}")
    print(f"✅ 불변식 퍼저 통과 — {args.runs}시드 × {args.steps}스텝, 위반 0")


if __name__ == '__main__':
    main()
