#!/usr/bin/env python3
"""Reference mobile sizes, large text, reduced motion, and 200% zoom gate."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / '서울까지400km.html').as_uri()
failures = []


def check(label, ok, detail=''):
    print(('  ✅ ' if ok else '  ❌ ') + label + (f' — {detail}' if detail and not ok else ''))
    if not ok:
        failures.append(label)


def enter_game(page):
    page.goto(GAME)
    page.click('#bt-new')
    if page.locator('#scr-mode').is_visible():
        page.click('#mode-on')
    page.fill('#inp-name', '접근성')
    page.click('#bt-name')
    page.evaluate('UI.skipIntro()')
    page.wait_for_timeout(120)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")
    page.click('[data-journey-mode="route"]')


def layout_state(page):
    return page.evaluate("""() => {
      const panel=document.querySelector('#panel');
      const controls=[...panel.querySelectorAll('button:not([disabled])')].filter(node=>node.offsetParent!==null);
      const panelRect=panel.getBoundingClientRect();
      const rects=controls.map(node=>node.getBoundingClientRect());
      return {
        documentOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
        panelOverflow:panel.scrollWidth>panel.clientWidth+1,
        shortControls:rects.filter(rect=>rect.height<43.5).length,
        escaped:rects.filter(rect=>rect.left<panelRect.left-1||rect.right>panelRect.right+1).length,
        routeCount:panel.querySelectorAll('[data-go]').length,
        primaryCount:panel.querySelectorAll('.act.primary').length,
        guide:panel.querySelector('.journey-guide')?.textContent||''
      };
    }""")


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    for width, height in [(360, 700), (390, 844), (480, 860)]:
        page = browser.new_page(viewport={'width': width, 'height': height})
        errors = []
        page.on('console', lambda msg: errors.append(msg.text)
                if msg.type == 'error' and 'Failed to load resource' not in msg.text else None)
        page.on('pageerror', lambda exc: errors.append(str(exc)))
        page.add_init_script("localStorage.clear(); localStorage.setItem('caravan_story_auto','0')")
        enter_game(page)

        normal = layout_state(page)
        check(f'{width}×{height} normal text keeps the primary route path usable',
              normal['routeCount'] >= 2 and
              not normal['documentOverflow'] and not normal['panelOverflow'] and
              normal['shortControls'] == 0 and normal['escaped'] == 0, str(normal))

        page.evaluate("""() => {
          document.documentElement.classList.add('ui-large-text');
          UI.renderAll();
        }""")
        large = layout_state(page)
        check(f'{width}×{height} large text has no clipped or sub-44px critical control',
              not large['documentOverflow'] and not large['panelOverflow'] and
              large['shortControls'] == 0 and large['escaped'] == 0, str(large))

        motion = page.evaluate("""() => {
          document.documentElement.classList.add('ui-reduce-motion');
          const option=document.querySelector('.route-option');
          const style=getComputedStyle(option);
          return {duration:style.animationDuration,transition:style.transitionDuration};
        }""")
        check(f'{width}×{height} reduced motion collapses animation and transition time',
              motion['duration'] in ('0.001ms', '0.000001s', '1e-06s', '0s') and
              motion['transition'] in ('0.001ms', '0.000001s', '1e-06s', '0s'), str(motion))
        check(f'{width}×{height} console/runtime errors remain zero', not errors, str(errors[:5]))
        page.close()

    zoom = browser.new_page(viewport={'width': 720, 'height': 900})
    zoom.add_init_script("localStorage.clear(); localStorage.setItem('caravan_story_auto','0')")
    enter_game(zoom)
    zoom.evaluate("document.documentElement.style.zoom='2'")
    zoom.wait_for_timeout(100)
    zoom_state = layout_state(zoom)
    check('200% zoom preserves a scrollable, horizontally contained primary route path',
          zoom_state['routeCount'] >= 2 and not zoom_state['panelOverflow'] and
          zoom_state['shortControls'] == 0 and zoom_state['escaped'] == 0, str(zoom_state))
    zoom.close()
    browser.close()

if failures:
    print('\n실패 목록:')
    for failure in failures:
        print(f'- {failure}')
    raise SystemExit(1)
print('\n✅ Quality 9 accessibility reference gate passed')
