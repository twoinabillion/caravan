#!/usr/bin/env python3
"""전투 개편 검증: 자동 성공 제거·3분기 실패·저격 캡·리스크 표시."""
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
    page.evaluate("G.newGame('onroad','전투','full')")

    print('― phase 2 자동 성공 제거')
    odds = page.evaluate("""() => {
      const evd=D.events.find(e=>e.id==='combat_walker_read');
      S.combat={id:'walker',edge:0,pressure:1,phase:2,history:[]};
      const counter=evd.choices.find(c=>c.tactic==='관찰');
      const breakdown=G.combatOddsBreakdown(counter,evd);
      return {odds:breakdown.odds, hasGuaranteeField:'guaranteedRead' in breakdown};
    }""")
    check('counter 선택 성공률 < 100%', odds['odds'] < 0.96, str(odds))
    check('보장 필드 제거됨', not odds['hasGuaranteeField'], str(odds))

    dist = page.evaluate("""() => {
      const evd=D.events.find(e=>e.id==='combat_walker_read');
      const counter=evd.choices.find(c=>c.tactic==='관찰');
      const seen=new Set();
      for(let i=0;i<200;i++){
        S.combat={id:'walker',edge:0,pressure:1,phase:2,history:[]};
        const out=G.pickOutcome(evd,counter);
        seen.add(counter.out.findIndex(o=>o.text===out.text));
      }
      return [...seen].sort();
    }""")
    check('phase 2 실패 분기 실제 도달', 1 in dist, str(dist))

    print('― 구조·호송 3분기 (성공/부분/실패)')
    tri = page.evaluate("""() => {
      const result={};
      for(const [id,tactic] of [['route_ridge_extract','분리 인양'],['route_market_pass','차체 지지']]){
        const evd=D.events.find(e=>e.id===id);
        const choice=evd.choices.find(c=>c.tactic===tactic);
        const seen=new Set();
        for(let i=0;i<400;i++){
          S.combat={id:'x',edge:0,pressure:1,phase:3,history:[]};
          const out=G.pickOutcome(evd,choice);
          seen.add(out.fx&&out.fx.combatResult);
        }
        result[id]=[...seen].sort();
      }
      return result;
    }""")
    for eid, seen in tri.items():
        check(f'{eid}: 실패 포함 3결과 도달', set(seen) == {'success', 'partial', 'failure'}, str(seen))

    print('― kw_sniper 조우당 1회 캡')
    sniper = page.evaluate("""() => {
      const evd=D.events.find(e=>e.id==='combat_walker_strike');
      const choice=evd.choices.find(c=>c.req&&c.req.item==='탄약');
      S.party=['kangwoo']; S.comps.kangwoo={mood:70,bond:0,lvl:2,perks:['kw_sniper']};
      S.items['탄약']=999; S.injuries={};
      // 첫 발: 확정 성공
      S.combat={id:'walker',edge:0,pressure:1,phase:3,history:[]};
      const first=G.pickOutcome(evd,choice);
      const firstGuaranteed=first.text===choice.out[0].text && S.combat.sniperUsed===1;
      // 이후: 같은 조우에서는 판정으로
      let sawFail=false;
      for(let i=0;i<200;i++){
        S.combat.sniperUsed=1;
        const out=G.pickOutcome(evd,choice);
        if(out.text===choice.out[1].text) sawFail=true;
      }
      return {firstGuaranteed, sawFail};
    }""")
    check('첫 발 확정 + 캡 기록', sniper['firstGuaranteed'], str(sniper))
    check('두 발째부터는 실패 가능', sniper['sawFail'], str(sniper))

    print('― 리스크 표시 (선택 전 % 숨김 + 실패 비용 노출)')
    ui = page.evaluate("""() => {
      G.newGame('onroad','전투UI','full');
      S.combat=null; S.injuries={}; S.pursuit=0;
      UI.showEvent(D.events.find(e=>e.id==='combat_walker_strike'));
      UI.finishStory();
      const odds=[...document.querySelectorAll('#ev-sheet .combat-odds')].map(n=>n.textContent);
      return {
        count:odds.length,
        percentLeak:odds.filter(t=>/\\d+\\s*%/.test(t)).length,
        failShown:odds.filter(t=>t.includes('실패하면')).length,
      };
    }""")
    check('선택 카드에 % 미노출', ui['count'] > 0 and ui['percentLeak'] == 0, str(ui))
    check('실패 비용 표기 존재', ui['failShown'] >= 2, str(ui))

    fail_preview = page.evaluate("""() => {
      const evd=D.events.find(e=>e.id==='combat_walker_strike');
      return evd.choices.filter(c=>c.combatRoll!==undefined).map(c=>G.combatFailurePreview(c));
    }""")
    check('combatFailurePreview 전 선택 반환', all(fail_preview), str(fail_preview)[:120])

    print('― W3: 판정 없는 확정 선택 비율')
    det = page.evaluate("""() => {
      let det=[], rolled=0;
      for(const e of D.events){
        if(!e.combat) continue;
        for(const c of (e.choices||[])){
          const isDet = c.combatRoll===undefined || !(c.out && c.out.length>1);
          // '준비 행동'으로 명시한 선택은 판정 대상이 아니다 (전망도 표시하지 않는다)
          if(isDet && !c.prep) det.push(`${e.id}:${c.tactic||c.label||''}`.slice(0,40));
          else if(!isDet) rolled++;
        }
      }
      return {det, rolled, pct: Math.round(100*det.length/Math.max(1,det.length+rolled))};
    }""")
    check('판정 없는 확정 선택 ≤ 15%', det['pct'] <= 15,
          f"{det['pct']}% ({len(det['det'])}개) 예: {det['det'][:3]}")

    # prep은 라벨이 아니라 계약이다 — 준비 행동에는 전망(등급·실패 비용)이 붙지 않아야 한다.
    prep_ui = page.evaluate("""() => {
      G.newGame('onroad','준비','full');
      S.combat=null; S.injuries={}; S.pursuit=0;
      UI.showEvent(D.events.find(e=>e.id==='patrol_walker'));
      UI.finishStory();
      const evd=D.events.find(e=>e.id==='patrol_walker');
      const cards=[...document.querySelectorAll('#ev-sheet .choice')];
      return cards.map((n,i)=>({prep:!!(evd.choices[i]&&evd.choices[i].prep),
        hasOdds: !!n.querySelector('.combat-odds')}));
    }""")
    leaked = [r for r in prep_ui if r['prep'] and r['hasOdds']]
    check('준비 행동에는 전망이 붙지 않는다', not leaked, f"{len(leaked)}개 카드가 확정 결과에 등급 표시")

    print('― W3: 이탈에 실질 비용이 붙는가')
    exits = page.evaluate("""() => {
      const rows=[];
      for(const e of D.events){
        if(!e.combat) continue;
        for(const c of (e.choices||[])){
          if(!['이탈','우회'].includes(c.tactic)) continue;
          const fx=(c.out&&c.out[0]&&c.out[0].fx)||{};
          // note/flag는 모든 이탈에 붙어 있어 판별력이 없다 — 실제 대가만 센다
          // (2026-08-07 뮤테이션: pursuit을 전부 지워도 초록이었다)
          const real = (fx.pursuit||0)>0 || fx.trust || fx.mood || (fx.moodAll||0)<=-3;
          rows.push({ev:e.id, real:!!real});
        }
      }
      return rows;
    }""")
    no_cost = [r['ev'] for r in exits if not r['real']]
    check('이탈 선택에 관측·신뢰·서사 대가가 붙는다', not no_cost,
          f"{len(no_cost)}/{len(exits)}개가 자원만 소모: {no_cost[:3]}")

    print('― W3: 관측(pursuit)에 임계 효과가 있는가')
    pursuit = page.evaluate("""() => {
      G.newGame('onroad','관측','full');
      const at=(n)=>{ S.pursuit=n; return {
        checkpoint: typeof G.pursuitCheckpoint==='function' ? G.pursuitCheckpoint() : null,
        refused: typeof G.pursuitRefusesShelter==='function' ? G.pursuitRefusesShelter() : null,
      };};
      return {low:at(0), mid:at(3), high:at(5)};
    }""")
    check('관측 3에서 강제 검문 임계가 존재',
          pursuit['mid']['checkpoint'] is not None and pursuit['mid']['checkpoint'] != pursuit['low']['checkpoint'],
          str(pursuit))
    check('관측 5에서 정착지 반응이 달라진다',
          pursuit['high']['refused'] is not None and pursuit['high']['refused'] != pursuit['low']['refused'],
          str(pursuit))

    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'전투 개편 검증 실패 {len(failures)}건: ' + ', '.join(failures))
print('✅ 전투 개편 전부 통과')
