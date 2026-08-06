#!/usr/bin/env python3
"""Historical, partial, and corrupt save recovery fixtures."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / '서울까지400km.html').as_uri()
failures = []


def check(label, ok, detail=''):
    print(('  ✅ ' if ok else '  ❌ ') + label + (f' — {detail}' if detail and not ok else ''))
    if not ok:
        failures.append(label)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(viewport={'width': 390, 'height': 780})
    errors = []
    page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.add_init_script('localStorage.clear()')
    page.goto(GAME)

    print('― historical save fixture')
    historical = page.evaluate("""() => {
      G.newGame('onroad','옛 저장','full');
      const save=JSON.parse(JSON.stringify(S));
      for(const key of ['_quality','memories','knowledge','relations','director','combat','lastCombatReport',
        '_combatFlow','routePlan','_stlField','_impactEcho','injuries','guideDismissed','lastJourneyRecap']) delete save[key];
      for(const id of Object.keys(save.comps)){ delete save.comps[id].bond; delete save.comps[id].lvl; delete save.comps[id].perks; }
      localStorage.setItem(SAVE_KEY,JSON.stringify(save));
      S=null;
      const ok=G.load();
      return {ok,at:S&&S.at,quality:S&&S._quality&&S._quality.version,
        narrative:Boolean(S&&S.memories&&S.relations&&S.director),
        companion:Object.values(S&&S.comps||{}).every(comp=>Number.isFinite(comp.bond)&&Array.isArray(comp.perks)),
        field:Boolean(S&&S._stlField&&S._stlField.roadEchoed)};
    }""")
    check('pre-quality save migrates without losing its location',
          historical['ok'] and historical['at'] == 'busan' and historical['quality'] == 3, str(historical))
    check('narrative, companion, and settlement state is backfilled',
          historical['narrative'] and historical['companion'] and historical['field'], str(historical))

    print('― quality v2 fixture')
    quality_v2 = page.evaluate("""() => {
      const save=JSON.parse(JSON.stringify(S));
      save._quality.version=2; save._quality.build='quality2';
      delete save._quality.milestones; delete save._quality.choiceCallbacks;
      delete save._quality.meaningful; delete save._quality.heavyStreak; delete save._quality.maxHeavyStreak;
      localStorage.setItem(SAVE_KEY,JSON.stringify(save));
      S=null;
      const ok=G.load();
      return {ok,version:S&&S._quality.version,build:S&&S._quality.build,
        milestones:S&&S._quality.milestones,callbacks:S&&S._quality.choiceCallbacks,
        meaningful:S&&S._quality.meaningful};
    }""")
    check('quality v2 evidence upgrades to the current schema',
          quality_v2['ok'] and quality_v2['version'] == 3 and quality_v2['build'] == '2026-08-06-quality3' and
          quality_v2['milestones'] == {} and quality_v2['callbacks']['late'] == 0 and
          quality_v2['meaningful']['changes'] == [], str(quality_v2))

    print('― partial save fixture')
    partial = page.evaluate("""() => {
      const save={v:1,mode:'onroad',name:'부분 저장',day:3,min:600,at:'busan',driving:null,
        stats:{km:42,events:3},seed:77,party:[],flags:{},comps:{},used:[],known:['busan'],items:{},notes:[]};
      localStorage.setItem(SAVE_KEY,JSON.stringify(save));
      S=null;
      const ok=G.load();
      return {ok,day:S&&S.day,km:S&&S.stats.km,fuel:S&&S.fuel,water:S&&S.water,
        npcs:S&&Object.keys(S.npcs).length,known:S&&S.known.length};
    }""")
    check('a structurally valid partial save receives safe defaults',
          partial['ok'] and partial['day'] == 3 and partial['km'] == 42 and partial['fuel'] == 42 and
          partial['water'] == 16 and partial['npcs'] > 0 and partial['known'] > 1, str(partial))

    print('― corrupt save fixtures')
    corrupt = page.evaluate("""() => {
      localStorage.setItem(SAVE_KEY,'{"v":1,');
      S=null;
      const visible=G.hasSave();
      const loaded=G.load();
      const cleared=S===null;
      localStorage.setItem(SAVE_KEY,JSON.stringify({v:1,day:2,at:'missing-node',stats:{km:1,events:0},seed:1}));
      const invalidVisible=G.hasSave();
      const invalidLoaded=G.load();
      return {visible,loaded,cleared,invalidVisible,invalidLoaded,stateCleared:S===null};
    }""")
    check('malformed JSON is hidden and fails without a poisoned runtime state',
          not corrupt['visible'] and not corrupt['loaded'] and corrupt['cleared'], str(corrupt))
    check('an invalid location is rejected safely',
          corrupt['invalidVisible'] and not corrupt['invalidLoaded'] and corrupt['stateCleared'], str(corrupt))
    check('console/runtime errors remain zero', not errors, str(errors[:5]))
    browser.close()

if failures:
    print('\n실패 목록:')
    for failure in failures:
        print(f'- {failure}')
    raise SystemExit(1)
print('\n✅ save migration and corruption fixtures passed')
