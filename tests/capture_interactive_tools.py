#!/usr/bin/env python3
"""Capture and exercise the three interactive road-tool surfaces."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = (ROOT / '서울까지400km.html').as_uri()
OUT = ROOT / 'audits' / 'interactive-road-tools-2026-08-12'
OUT.mkdir(parents=True, exist_ok=True)


def enter_game(page):
    page.goto(URL)
    page.click('#bt-new')
    if page.locator('#scr-mode').is_visible():
        page.click('#mode-on')
    page.fill('#inp-name', '다온')
    page.click('#bt-name')
    page.evaluate('UI.skipIntro()')
    page.wait_for_timeout(250)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(viewport={'width': 480, 'height': 860}, device_scale_factor=1)
    errors = []
    page.on('console', lambda msg: errors.append(msg.text)
            if msg.type == 'error' and 'Failed to load resource' not in msg.text else None)
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.add_init_script("localStorage.clear(); localStorage.setItem('caravan_story_auto','0')")
    enter_game(page)

    page.click('#dk-objectives')
    page.wait_for_timeout(180)
    page.screenshot(path=str(OUT / '01-goal-folio.png'))

    page.click('.folio-location')
    goal_to_map = page.locator('#ovl-map').is_visible()

    page.wait_for_timeout(250)
    page.screenshot(path=str(OUT / '02-map-navigator.png'))

    selected_route = page.locator('#nodecard h4').inner_text()
    fuel_before_depart = page.evaluate('S.fuel')
    page.click('#nodecard .go')
    driving_after_depart = page.evaluate('Boolean(S.driving)')
    page.wait_for_timeout(450)
    fuel_after_depart = page.evaluate('S.fuel')

    page.click('#dk-status')
    page.wait_for_timeout(180)
    before = page.locator('[data-bag-item="부품"]').get_attribute('aria-pressed')
    water_before = page.evaluate('S.water')
    page.screenshot(path=str(OUT / '03-bag-supply-roll.png'))

    # Prove that the controls and numbers are state-driven, not a static mockup.
    van_before_repair = page.evaluate('S.van')
    parts_before_repair = page.evaluate("S.items['부품'] || 0")
    page.click('[data-bag-action="부품"]')
    van_after_repair = page.evaluate('S.van')
    parts_after_repair = page.evaluate("S.items['부품'] || 0")
    page.evaluate('S.water = Math.max(0, S.water - 1)')
    page.click('[data-bag-item="고철"]')
    after = page.locator('[data-bag-item="고철"]').get_attribute('aria-pressed')
    water_after = page.evaluate('S.water')
    rendered_water = page.locator('.bag-critical b').first.inner_text()

    page.click('#dk-road')
    road_visible = page.locator('#panel').is_visible() and not page.locator('#ovl-status').is_visible()

    if (not goal_to_map or not selected_route or not driving_after_depart
            or fuel_after_depart >= fuel_before_depart or before != 'true' or after != 'true'
            or van_after_repair <= van_before_repair or parts_after_repair >= parts_before_repair
            or water_after != water_before - 1 or rendered_water != str(water_after)
            or not road_visible or errors):
        raise SystemExit(
            'interaction failure: '
            f'goal_to_map={goal_to_map} route={selected_route!r} '
            f'driving={driving_after_depart} fuel={fuel_before_depart}->{fuel_after_depart} '
            f'repair={van_before_repair}/{parts_before_repair}->{van_after_repair}/{parts_after_repair} '
            f'before={before} after={after} water={water_before}->{water_after} '
            f'rendered={rendered_water} road={road_visible} errors={errors}'
        )
    print(f'captured {OUT}')
    browser.close()
