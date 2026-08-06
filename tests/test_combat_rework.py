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

    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'전투 개편 검증 실패 {len(failures)}건: ' + ', '.join(failures))
print('✅ 전투 개편 전부 통과')
