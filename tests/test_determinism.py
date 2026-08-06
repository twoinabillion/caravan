#!/usr/bin/env python3
"""같은 시드 → 같은 여정. 리플레이 기반 회귀 검증의 전제를 지킨다."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / '서울까지400km.html').as_uri()
failures = []


def check(label, ok, detail=''):
    print(('  ✅ ' if ok else '  ❌ ') + label + (f' — {detail}' if detail else ''))
    if not ok:
        failures.append(label)


RUN_JS = """
(seed) => {
  const realModalOpen = UI.modalOpen;
  const noop = () => {};
  const stubs = ['toast','speak','playChat','playRadio','renderAll','renderHud','onDepart','clearSpeech'];
  const saved = {};
  for (const k of stubs) { saved[k] = UI[k]; UI[k] = noop; }
  const savedShow = UI.showEvent;
  UI.modalOpen = () => false; UI.onArrive = () => 0;
  const trace = [];
  UI.showEvent = (evd) => { trace.push('ev:' + evd.id); };

  G.seedOverride = seed;
  G.newGame('onroad', '결정성', 'full');
  G.seedOverride = undefined;
  // 고정 경로를 정해진 순서로 주행하며 발생 이벤트와 자원 변화를 기록
  for (const target of ['yangsan','miryang','daegu']) {
    if (!G.canTravelTo(target).ok) break;
    if (!G.startTravel(target)) break;
    let guard = 0;
    while (S.driving && guard++ < 3000) G.tick(1.4);
    trace.push(`at:${S.at}:${Math.round(S.fuel)}:${Math.round(S.van)}:${S.water}:${S.food}`);
  }
  trace.push(`end:${S.day}:${Math.round(S.stats.km)}:${S.stats.events}`);

  for (const k of stubs) UI[k] = saved[k];
  UI.modalOpen = realModalOpen; UI.showEvent = savedShow;
  return trace;
}
"""

with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.add_init_script('localStorage.clear()')
    page.goto(GAME)

    print('― 같은 시드 → 같은 여정')
    a = page.evaluate(RUN_JS, 424242)
    b = page.evaluate(RUN_JS, 424242)
    check('동일 시드 2회 실행 결과 일치', a == b, f'{len(a)} vs {len(b)} steps')
    if a != b:
        for i, (x, y) in enumerate(zip(a, b)):
            if x != y:
                print(f'    첫 불일치 #{i}: {x} vs {y}')
                break

    print('― 다른 시드 → 다른 여정')
    c = page.evaluate(RUN_JS, 999001)
    check('다른 시드는 다른 결과를 만든다', a != c, '시드가 무시되고 있음' if a == c else '')

    print('― 시드 주입 API')
    injected = page.evaluate("""() => {
      G.seedOverride = 12345; G.newGame('onroad','시드','full'); const s1 = S.seed;
      G.seedOverride = undefined; G.newGame('onroad','시드','full'); const s2 = S.seed;
      return {s1, s2};
    }""")
    check('seedOverride가 세이브 시드에 반영', injected['s1'] == 12345, str(injected))
    check('override 해제 시 무작위 시드로 복귀', injected['s2'] != 12345, str(injected))

    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'결정성 검증 실패 {len(failures)}건: ' + ', '.join(failures))
print('✅ 결정성 검증 통과 — 같은 시드는 같은 여정을 만든다')
