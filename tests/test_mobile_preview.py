#!/usr/bin/env python3
"""Desktop device preview loads the real game at every declared CSS viewport."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
PREVIEW = (ROOT / 'mobile-preview.html').as_uri()
EXPECTED = {
    'iphone-se3-safari': (375, 553),
    'iphone13-mini-safari': (375, 629),
    'iphone13-safari': (390, 664),
    'iphone15-pro-safari': (393, 659),
    'iphone15-promax-safari': (430, 739),
    'iphone13-home': (390, 844),
    'iphone15-pro-home': (393, 852),
    'iphone15-promax-home': (430, 932),
    'galaxy-s24-chrome': (360, 700),
    'galaxy-a55-chrome': (480, 940),
    'galaxy-s9-chrome': (320, 578),
    'pixel5-chrome': (393, 647),
    'pixel7-chrome': (412, 759),
    'iphone13-inapp': (390, 604),
    'galaxy-s24-inapp': (360, 640),
}


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(viewport={'width': 1440, 'height': 1100})
    errors = []
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.goto(PREVIEW, wait_until='domcontentloaded')
    page.wait_for_timeout(700)

    options = page.locator('#preset option').evaluate_all(
        "options => options.map(option => option.value)"
    )
    assert options == list(EXPECTED), f'preview options differ: {options}'

    for preset, (width, height) in EXPECTED.items():
        page.select_option('#preset', preset)
        page.wait_for_timeout(30)
        result = page.evaluate("""expected => {
          const frame=document.querySelector('#game');
          return {
            selected:document.querySelector('#preset').value,
            dimensions:document.querySelector('#dimensions').textContent.trim(),
            frame:[frame.offsetWidth,frame.offsetHeight],
            url:new URL(location.href).searchParams.get('preset')
          };
        }""", [width, height])
        assert result['selected'] == preset and result['url'] == preset, result
        assert result['frame'] == [width, height], f'{preset}: {result}'
        assert result['dimensions'] == f'{width} × {height}', f'{preset}: {result}'
        print(f'✅ {preset}: {width}×{height}')

    game_frame = next(frame for frame in page.frames if '400km' in frame.url)
    assert game_frame.locator('#bt-new').count() == 1, 'real game did not load in preview iframe'
    assert not errors, errors
    browser.close()

print('✅ All mobile preview presets load the interactive game')
