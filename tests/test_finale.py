#!/usr/bin/env python3
"""최종막이 결정인가 — 요구 조건·잠금·패배 엔딩·반대의 비용.

2026-08-06 적대적 재검증: `seoul_costs`는 선택지가 하나뿐인 페이지 넘김이고,
세 처분에는 요구 조건도 실패도 자원 비용도 없었다. 무엇을 들고 왔든 전부 열려 있고
어느 것도 실패하지 않는다 — "저항"이 아니라 무압력 의식이었다.
전역 서울 제한일을 제거한 뒤에는 도착 날짜가 결말 종류를 바꾸지 않아야 한다.
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


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(viewport={'width': 390, 'height': 780})
    errors = []
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.add_init_script('localStorage.clear()')
    page.goto(GAME)

    print('― 세 처분에 요구 조건이 있는가')
    reqs = page.evaluate("""() => {
      const dec=D.events.find(e=>e.id==='seoul_decision');
      return (dec.choices||[]).map(c=>({label:c.label.slice(0,20), req:c.req||null}));
    }""")
    missing = [r['label'] for r in reqs if not r['req']]
    check('세 처분 모두 요구 조건을 갖는다', not missing, f"조건 없음: {missing}")

    print('― 준비 못 한 처분은 실제로 잠기는가')
    lock = page.evaluate("""() => {
      G.newGame('onroad','최종막','full');
      S.party=[]; S.flags.seoul_core_reached=true;
      const dec=D.events.find(e=>e.id==='seoul_decision');
      const bare=(dec.choices||[]).map(c=>!c.req || G.reqOk(c.req).ok!==false);
      // 충분히 준비한 상태
      S.party=['minji','parkss','kangwoo','eunsu'];
      for(const id of S.party) S.comps[id]={mood:80,bond:20,lvl:3,perks:[]};
      for(const cell of (D.resistance||[])) S.flags[cell.flag]=true;
      const ready=(dec.choices||[]).map(c=>!c.req || G.reqOk(c.req).ok!==false);
      return {bare, ready};
    }""")
    # 하나만 잠겨도 통과하면 자물쇠 두 개를 지워도 초록이다 (2026-08-07 뮤테이션 실증)
    check('빈손이면 셋 다 잠긴다', lock['bare'] == [False, False, False], str(lock['bare']))
    check('준비하면 전부 열린다', all(lock['ready']), str(lock['ready']))

    print('― 대가 확인이 실제 선택인가')
    costs = page.evaluate("""() => {
      const c=D.events.find(e=>e.id==='seoul_costs');
      return {count:(c.choices||[]).length};
    }""")
    check('seoul_costs가 선택지 2개 이상', costs['count'] >= 2, f"{costs['count']}개")

    print('― 엔딩이 갈리는가')
    endings = page.evaluate("""() => {
      const kinds=(typeof G.endingKinds==='function') ? G.endingKinds() : null;
      return {kinds};
    }""")
    check('생존 실패 3종과 본편 완결이 모두 존재',
          endings['kinds'] is not None and len(endings['kinds']) >= 4 and
          'story_done' in endings['kinds'], str(endings))

    # 배열에 이름만 있는 엔딩은 엔딩이 아니다 — 화면과 트리거가 함께 있어야 한다
    reach = page.evaluate("""() => {
      const out={};
      for(const kind of G.endingKinds()){
        UI.showEnding(kind);
        const t=(document.querySelector('#scr-end h1')||{}).textContent||'';
        out[kind]={title:t, generic: t==='여행이 끝났다'};
      }
      return out;
    }""")
    generic = [k for k, v in reach.items() if v['generic']]
    check('모든 엔딩이 전용 화면을 갖는다', not generic, f"일반 문구로 떨어짐: {generic}")

    triggers = page.evaluate("""() => {
      // 에필로그가 여정을 닫는가 + 좌초/기피가 상태에서 발화하는가
      const night=D.events.find(e=>e.id==='seoul_night');
      const closes=(night.choices||[]).every(c=>c.out[0].fx && c.out[0].fx.endJourney);
      G.newGame('onroad','좌초','full');
      S.at='yangsan'; S.driving=null; S.fuel=0; S.scrap=0;
      S._rescues={nofuel:3}; S._strandedDays=1; S.water=9; S.food=9;
      const before=S.ended; G.dawn();
      const stranded=!!S.ended && !before;
      G.newGame('onroad','기피','full');
      /* 기피는 관측 5 + 실제 문전박대 2회 이후에만 — 길에서 자급하는 차는 기피로 죽지 않는다 */
      S.pursuit=5; S._shunnedDays=3; S._shelterRefusals=2; S._lastPursuitUp=S.day; S.water=9; S.food=9;
      G.dawn();
      const shunned=!!S.ended;
      return {closes, stranded, shunned};
    }""")
    check('에필로그가 여정을 닫는다(endJourney)', triggers['closes'], str(triggers))
    check('좌초가 상태에서 발화한다', triggers['stranded'], str(triggers))
    check('기피가 상태에서 발화한다', triggers['shunned'], str(triggers))

    print('― 오래 머문 뒤에도 본편 완결이 유지되는가')
    empty = page.evaluate("""() => {
      G.newGame('onroad','늦음','full');
      S.day=90;      // 오래 머문 뒤에도 서울 본편은 계속된다
      const t=G.transferStatus();
      const kind=(typeof G.arrivalEndingKind==='function') ? G.arrivalEndingKind() : null;
      return {remaining:t.remainingResidents, kind};
    }""")
    check('날짜가 지나도 주민 피해 없이 본편 완결을 반환',
          empty['remaining'] == 6412 and empty['kind'] == 'story_done', str(empty))

    print('― 동료의 반대를 누르면 값을 치르는가')
    dissent = page.evaluate("""() => {
      G.newGame('onroad','반대','full');
      S.party=['eunsu']; S.comps.eunsu={mood:80,bond:20,lvl:3,perks:[]};
      const before=S.comps.eunsu.bond;
      const applied=(typeof G.overrideDissent==='function') ? G.overrideDissent('core_sleep') : null;
      return {applied, before, after:S.comps.eunsu.bond};
    }""")
    check('반대 무시가 유대를 깎는다',
          dissent['applied'] is not None and dissent['after'] < dissent['before'], str(dissent))

    # 함수만 있고 아무도 안 부르면 그건 기능이 아니다 (이번 세션에서 반복된 함정)
    wired = page.evaluate("""() => {
      G.newGame('onroad','배선','full');
      S.party=['eunsu']; S.comps.eunsu={mood:80,bond:20,lvl:3,perks:[]};
      const before=S.comps.eunsu.bond;
      const dec=D.events.find(e=>e.id==='seoul_decision');
      const sleep=dec.choices.find(c=>c.label.includes('격리 수면'));
      const chips=G.applyFx(sleep.out[0].fx)||[];
      return {before, after:S.comps.eunsu.bond,
              chip:chips.map(c=>c.t).some(t=>t.includes('반대')),
              flag:!!S.flags.dissent_overridden_eunsu,
              allHaveDissent:(dec.choices||[]).every(c=>c.out[0].fx && c.out[0].fx.dissent)};
    }""")
    check('처분 선택이 실제로 반대 비용을 부른다',
          wired['after'] < wired['before'] and wired['chip'] and wired['flag'], str(wired))
    check('세 처분 모두 반대 대상을 갖는다', wired['allHaveDissent'], str(wired))

    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'최종막 검증 실패 {len(failures)}건: ' + ', '.join(failures))
print('✅ 최종막이 결정이다')
