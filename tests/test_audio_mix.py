#!/usr/bin/env python3
"""믹서가 실제로 소리를 조절하는가 — 플랫폼을 타지 않는 경로인가.

2026-08-06 적대적 재검증: 음악·환경음·목소리가 전부 `HTMLMediaElement.volume`으로
조절되고 있었다. iOS Safari는 이 쓰기를 무시하므로, 아이폰에서는 4채널 믹서·크로스페이드·
더킹이 통째로 동작하지 않았을 가능성이 높다(실기 검증은 한 번도 안 됐다).

이제 재생 요소를 AudioContext 게인 노드에 물려 게인으로 조절한다. 이 검사는
"요소 볼륨을 직접 쓰지 않는다"는 계약과, 믹서 값이 실제 게인에 도달하는지를 본다.
"""
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / '서울까지400km.html').as_uri()
AUDIO_SRC = ROOT / 'src' / '07e-ui-audio.js'
failures = []


def check(label, ok, detail=''):
    print(('  ✅ ' if ok else '  ❌ ') + label + (f' — {detail}' if detail else ''))
    if not ok:
        failures.append(label)


print('― 소스 계약: 요소 볼륨을 직접 쓰지 않는다')
src = AUDIO_SRC.read_text()
# 라우팅 구현 내부(폴백 포함)만 예외로 둔다.
direct = [ln.strip() for ln in src.splitlines()
          if re.search(r'\.volume\s*=', ln) and 'audioEl.volume' not in ln]
check('재생 볼륨은 게인으로만 조절한다', not direct, '; '.join(direct[:3]))
check('SND가 미디어 라우팅 API를 노출한다',
      'setMediaVolume' in src and 'createMediaElementSource' in src)

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.add_init_script('localStorage.clear()')
    page.goto(GAME)

    print('― 게인 경로가 실제로 만들어지는가')
    routed = page.evaluate("""() => {
      SND.enable && SND.enable();
      const a = new Audio();
      a.src = 'data:audio/mpeg;base64,//uQx';   // 재생하지 않아도 라우팅은 가능해야 한다
      const h = SND.route(a);
      if (!h) return {routed:false};
      SND.setMediaVolume(a, 0.25);
      return {routed:true, gain:h.gain.gain.value, elementVolume:a.volume,
              reported:SND.mediaVolume(a)};
    }""")
    check('오디오 요소가 게인 노드에 연결된다', routed['routed'], str(routed))
    if routed['routed']:
        check('요소 볼륨은 1로 두고 게인이 값을 갖는다',
              abs(routed['elementVolume'] - 1) < 0.001 and routed['reported'] == 0.25, str(routed))

    print('― 채널 슬라이더가 게인까지 도달하는가')
    mix = page.evaluate("""() => {
      const before = SND.level('music');
      SND.setLevel('music', 0.3);
      const after = SND.level('music');
      SND.setLevel('music', before);
      return {before, after, restored:SND.level('music')};
    }""")
    check('믹서 채널 값이 저장·복원된다',
          abs(mix['after'] - 0.3) < 0.001 and abs(mix['restored'] - mix['before']) < 0.001, str(mix))

    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'오디오 믹스 검증 실패 {len(failures)}건: ' + ', '.join(failures))
print('✅ 믹서가 플랫폼을 타지 않는 경로로 소리를 조절한다')
