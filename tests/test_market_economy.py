#!/usr/bin/env python3
"""지역 시세 — 사고파는 값이 마을마다 다르고, 그 차이가 동선이 되는가.

2026-08-07: 시세 계수(D.market.mul)·매입(demand)·이웃 시세 소문 추가.
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


with sync_playwright() as pw:
    browser = pw.chromium.launch()
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)[:120]))
    page.add_init_script('localStorage.clear()')
    page.goto(GAME)

    r = page.evaluate("""() => {
      G.newGame('onroad','시세','full');
      const out={};
      // 같은 식량이 전주(0.7)와 수원(1.3)에서 다른 값인가 — 실구매로 확인
      const price=(stl)=>{
        S.scrap=100; const before=S.scrap;
        const i=D.stls[stl].trade.findIndex(r=>r[1]==='food');
        G.trade(stl,i);
        return before-S.scrap;
      };
      out.jeonjuFood=price('jeonju'); out.suwonFood=price('suwon');
      // 매입 — 부품을 수원(13)에서 판다
      S.items['부품']=3; S.scrap=0;
      const sell=G.sellToDemand('suwon');
      out.sold=sell.ok; out.gain=S.scrap; out.partsLeft=S.items['부품'];
      // 식량 매입은 이틀치 보호선이 있다
      S.food=1; const guard=G.sellToDemand('daejeon');
      out.foodGuard=!guard.ok;
      // 전 정착지 시세·수요 데이터 정합
      out.marketCount=Object.keys(D.market).length;
      out.badDemand=Object.entries(D.market).filter(([k,v])=>v.demand&&!v.demand.item).map(([k])=>k);
      return out;
    }""")
    check('같은 식량이 마을마다 다른 값', r['jeonjuFood'] < r['suwonFood'],
          f"전주 {r['jeonjuFood']} vs 수원 {r['suwonFood']}")
    check('매입이 실제로 고철을 준다', r['sold'] and r['gain'] >= 10 and r['partsLeft'] == 2, str(r))
    check('식량 매입엔 이틀치 보호선', r['foodGuard'], '')
    check('정착지 7곳 전부 시세 등록', r['marketCount'] == 7, str(r['marketCount']))

    ui = page.evaluate("""() => new Promise(res=>{
      S.at='suwon'; S.scrap=60; S.items['부품']=2;
      UI.showStl('suwon','market');
      setTimeout(()=>{
        const html=document.querySelector('#trade').innerHTML;
        res({dear:html.includes('여긴 귀하다'), demand:html.includes('매입'), rumor:html.includes('장사꾼들 말로는')});
      },400);
    })""")
    check('시장 화면에 시세 표식', ui['dear'], str(ui))
    check('시장 화면에 매입 줄', ui['demand'], str(ui))
    check('이웃 시세 소문 노출', ui['rumor'], str(ui))
    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'시세 검증 실패 {len(failures)}건: ' + ', '.join(failures))
print('✅ 값의 차이가 동선이 된다')
