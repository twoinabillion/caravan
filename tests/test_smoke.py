#!/usr/bin/env python3
"""서울까지 400km — 스모크 테스트 (빌드 산출물 대상)
사용: python3 tests/test_smoke.py
검사: 부팅→인트로→게임 진입, 콘솔 에러 0, 의뢰 4종 엔진 플로우, 신규 체인 이벤트 표시
주의: headless 캔버스 getImageData는 못 믿는다 — 픽셀 검증은 스크린샷 눈검수로.
"""
import sys, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / '서울까지400km.html').as_uri()
SHOT = ROOT / 'tests' / 'shots'
SHOT.mkdir(exist_ok=True)

fails = []
def check(name, ok, detail=''):
    print(('  ✅ ' if ok else '  ❌ ') + name + (f' — {detail}' if detail and not ok else ''))
    if not ok: fails.append(name)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 480, 'height': 860})
    errors = []
    IGNORE = ('Failed to load resource',)  # 오프로드 환경감지 프로브(401)는 정상
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' and not any(x in m.text for x in IGNORE) else None)
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(URL)
    pg.wait_for_timeout(600)

    print('― 부팅/진입')
    check('타이틀 표시', pg.locator('#bt-new').is_visible())
    pg.click('#bt-new'); pg.wait_for_timeout(200)
    pg.click('#mode-on'); pg.wait_for_timeout(300)
    for _ in range(len(pg.evaluate('D.intro'))):
        pg.click('#scr-intro'); pg.wait_for_timeout(120)
    pg.wait_for_timeout(400)
    check('게임 진입(HUD)', pg.locator('#g-fuel').is_visible())
    check('콘솔 에러 0', not errors, ' | '.join(errors[:3]))

    print('― 의뢰 엔진')
    r = pg.evaluate('''() => {
      const out = {};
      S.at = 'daegu'; S.quest = null; S._qoffer = null;
      const q1 = G.rollQuests();
      out.offers = q1.length;
      out.kinds = q1.map(q => q.kind);
      out.stable = JSON.stringify(G.rollQuests()) === JSON.stringify(q1);   // 같은 날 리롤 방지
      // deliver/express 완료 플로우
      const dq = {kind:'deliver', item:'약 꾸러미', from:'daegu', to:'daejeon', reward:12, due:S.day+4};
      G.acceptQuest(dq); const sc0 = S.scrap; S.at = 'daejeon';
      out.deliverReady = G.questReady();
      G.checkQuest(); out.deliverPaid = S.scrap - sc0; out.deliverCleared = S.quest === null;
      // procure 플로우
      S.at = 'daegu'; S._qoffer = null;
      G.acceptQuest({kind:'procure', need:{name:'부품', qty:2}, from:'daegu', to:'daegu', reward:15, due:S.day+6});
      S.items['부품'] = 0; out.procNotReady = !G.questReady();
      S.items['부품'] = 2; out.procReady = G.questReady();
      G.checkQuest(); out.procConsumed = S.items['부품'] === 0;
      // letter 플로우
      S.at = 'daegu'; S._qoffer = null;
      const stlNode = Object.keys(D.nodes).find(id => D.nodes[id].stl && id !== 'daegu');
      const npc = D.stls[D.nodes[stlNode].stl].npcs[0];
      G.acceptQuest({kind:'letter', npc, from:'daegu', to:stlNode, reward:6, due:S.day+5});
      const att0 = S.npcs[npc].att; S.at = stlNode; G.checkQuest();
      out.letterAtt = S.npcs[npc].att - att0;
      // v1.2 세이브 마이그레이션
      S.quest = {item:'책 꾸러미', from:'daegu', to:'suwon', reward:10, due:S.day+4};
      G.save(); G.load(); out.migrated = S.quest.kind === 'deliver';
      S.quest = null; return out;
    }''')
    check('게시판 2건 제시', r['offers'] == 2, str(r))
    check('의뢰 종류 상이', len(set(r['kinds'])) == 2, str(r['kinds']))
    check('같은 날 리롤 방지', r['stable'])
    check('배달 완료/보상', r['deliverReady'] and r['deliverCleared'] and r['deliverPaid'] >= 12, str(r))
    check('조달 물량 게이트', r['procNotReady'] and r['procReady'] and r['procConsumed'], str(r))
    check('편지 호감 보상', r['letterAtt'] >= 12, str(r))
    check('v1.2 세이브 의뢰 마이그레이션', r['migrated'])

    print('― 신규 콘텐츠')
    for ev in ['lib_meet', 'freq_catch', 'van_receipt', 'meet_smith', 'vg_cicada', 'night_djradio']:
        pg.evaluate(f'G.openEventById("{ev}")')
        pg.wait_for_timeout(150)
        vis = pg.locator('#ev-wrap.on').count() > 0
        check(f'이벤트 표시: {ev}', vis)
        if vis:
            pg.locator('#ev-wrap .choice').first.click()
            pg.wait_for_timeout(150)
            pg.evaluate('''() => { const c=document.querySelector('#ev-wrap .choice:last-child');
              if (c) c.click(); document.querySelector('#ev-wrap').classList.remove('on'); }''')
    # 체인 게이트: needFlag 미충족 시 풀에서 제외
    gated = pg.evaluate('''() => { delete S.flags.library_met;
      return G.eligible().some(e => e.id === 'lib_request'); }''')
    check('체인 게이트(lib_request 잠김)', not gated)
    opened = pg.evaluate('''() => { S.flags.library_met = true; S.driving = null;
      return G.eligible().some(e => e.id === 'lib_request'); }''')
    check('체인 게이트(플래그 후 해금)', opened)
    check('콘솔 에러 0 (최종)', not errors, ' | '.join(errors[:3]))

    print('― 스크린샷')
    pg.evaluate('document.querySelector("#ev-wrap").classList.remove("on")')
    pg.screenshot(path=str(SHOT / 'game.png'))
    pg.evaluate('S.at="daegu"; UI.showStl && 0')  # showStl은 비공개 — dock 경유
    b.close()

print()
if fails:
    print(f'❌ 실패 {len(fails)}건: ' + ', '.join(fails)); sys.exit(1)
print('✅ 스모크 전부 통과')
