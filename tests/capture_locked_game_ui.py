#!/usr/bin/env python3
"""Capture the locked mobile game composition at phone and desktop viewports."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = (ROOT / '서울까지400km.html').as_uri()
OUT = ROOT / 'audits' / 'locked-game-ui-2026-08-12'
OUT.mkdir(parents=True, exist_ok=True)


def enter_game(page):
    page.goto(URL)
    page.click('#bt-new')
    if page.locator('#scr-mode').is_visible():
        page.click('#mode-on')
    page.fill('#inp-name', '다온')
    page.click('#bt-name')
    page.evaluate('UI.skipIntro()')
    page.wait_for_timeout(220)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")


def capture(playwright, width, height, prefix):
    browser = playwright.chromium.launch()
    page = browser.new_page(viewport={'width': width, 'height': height}, device_scale_factor=1)
    errors = []
    page.on('console', lambda msg: errors.append(msg.text)
            if msg.type == 'error' and 'Failed to load resource' not in msg.text else None)
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.add_init_script("localStorage.clear(); localStorage.setItem('caravan_story_auto','0')")
    enter_game(page)

    app_box = page.locator('#app').bounding_box()
    hud = page.evaluate("""() => ({
      fuel: document.querySelector('#stage-fuel').textContent,
      van: document.querySelector('#stage-van').textContent,
      day: document.querySelector('#stage-day').textContent,
      clock: document.querySelector('#stage-clock').textContent,
      weather: document.querySelector('#stage-weather').textContent,
      minimap: getComputedStyle(document.querySelector('#minimap')).display,
    })""")
    page.screenshot(path=str(OUT / f'{prefix}-road-full.png'))
    page.locator('#app').screenshot(path=str(OUT / f'{prefix}-road-app.png'))

    page.click('#dk-objectives')
    page.wait_for_timeout(160)
    goal_box = page.locator('#status-prop').bounding_box()
    page.locator('#app').screenshot(path=str(OUT / f'{prefix}-goal-app.png'))

    page.click('#dk-status')
    page.wait_for_timeout(160)
    bag_box = page.locator('#status-prop').bounding_box()
    page.locator('#app').screenshot(path=str(OUT / f'{prefix}-bag-app.png'))

    if (not app_box or abs(app_box['width'] - min(width, 480)) > 1
            or hud['minimap'] != 'none' or not hud['fuel'].endswith('L')
            or not hud['van'].endswith('%') or not hud['day'].startswith('DAY ')
            or ':' not in hud['clock'] or not hud['weather']
            or not goal_box or not bag_box or abs(goal_box['width'] - 480) > 1
            or abs(bag_box['width'] - 480) > 1 or errors):
        raise SystemExit(
            f'{prefix} failure: app={app_box} goal={goal_box} bag={bag_box} '
            f'hud={hud} errors={errors}'
        )
    browser.close()
    return app_box, goal_box, bag_box, hud


with sync_playwright() as playwright:
    mobile = capture(playwright, 480, 860, '01-mobile-480x860')
    desktop = capture(playwright, 1440, 900, '02-desktop-1440x900')
    print(f'captured {OUT} mobile={mobile[0]} desktop={desktop[0]}')
