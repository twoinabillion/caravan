#!/usr/bin/env python3
"""Current opening, journey controls, dialog focus and map via physical keys."""
from playwright.sync_api import sync_playwright
from batch_accessibility_helpers import GAME, activate, active_id, enter_game, tab_to

failures = []
def check(label, ok, detail=''):
    print(('✅ ' if ok else '❌ ') + label + (f' — {detail}' if not ok else ''))
    if not ok:
        failures.append(label)


def modal_check(page, trigger, modal):
    reached = tab_to(page, trigger)
    check(f'Tab reaches {trigger}', reached, active_id(page))
    if not reached:
        return
    page.keyboard.press('Enter')
    page.wait_for_timeout(350)
    check(f'Enter opens {modal}', page.locator(modal).is_visible())
    inside = lambda: page.locator(modal).evaluate('(e)=>e.contains(document.activeElement)')
    check(f'{modal} receives focus', inside(), active_id(page))
    trapped = True
    excursions=[]
    for _ in range(22):
        page.keyboard.press('Tab')
        body_boundary=page.evaluate("document.activeElement===document.body") and page.locator(modal).evaluate("e=>e.tagName==='DIALOG' && e.open")
        if not inside() and not body_boundary:
            excursions.append(page.evaluate("({tag:document.activeElement.tagName,id:document.activeElement.id,classes:document.activeElement.className,text:document.activeElement.textContent.trim().slice(0,60)})"))
        trapped = trapped and (inside() or body_boundary)
    check(f'{modal} traps Tab', trapped, str(excursions))
    reverse_trapped=True
    for _ in range(12):
        page.keyboard.press('Shift+Tab')
        body_boundary=page.evaluate("document.activeElement===document.body") and page.locator(modal).evaluate("e=>e.tagName==='DIALOG' && e.open")
        reverse_trapped=reverse_trapped and (inside() or body_boundary)
    check(f'{modal} traps reverse Tab',reverse_trapped,active_id(page))
    page.keyboard.press('Escape')
    page.wait_for_timeout(350)
    check(f'Escape closes {modal}', not page.locator(modal).is_visible())
    check(f'{modal} restores trigger focus', page.locator(trigger).evaluate('(e)=>e===document.activeElement'), active_id(page))


with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome')
    page = browser.new_page(viewport={'width':390,'height':780})
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type=='error' and 'Failed to load resource' not in m.text else None)
    page.add_init_script("localStorage.clear();localStorage.setItem('caravan_story_auto','0')")
    enter_game(page, keyboard=True)
    check('Tab/Enter and number2 complete interactive opening and actual name entry',
          page.evaluate("S.opening.completed && S.name==='하린' && S.opening.decisions.opening_workshop.label.includes('난로')"))
    check('Opening returns to visible stopped route shell',page.locator('[data-nav-depart]:visible').count()==1)
    modal_check(page, '#dk-crew', '#ovl-status')
    check('Crew dock selects crew tab',page.locator('[data-st="crew"]').get_attribute('aria-selected')=='true')
    modal_check(page, '#dk-status', '#ovl-status')
    modal_check(page, '#dk-objectives', '#quest-ledger')
    modal_check(page, '#dk-menu', '#ovl-menu')
    modal_check(page, '[data-trip-destination]', '#trip-destination-dialog')
    check('Tab reaches inline regional map toggle',tab_to(page,'[data-route-map-toggle]'))
    page.keyboard.press('Enter')
    check('Regional map opens in current scene',page.locator('#journey-route-map').is_visible())
    activate(page,'#journey-map-world',keyboard=True)
    page.wait_for_timeout(350)
    check('Regional map button opens full map with focus inside',page.locator('#ovl-map').is_visible() and page.locator('#ovl-map').evaluate('(e)=>e.contains(document.activeElement)'))
    page.keyboard.press(']')
    check('] opens known map node information without a departure action',page.locator('#nodecard').evaluate('(e)=>e.classList.contains("on")') and page.locator('#nodecard [data-go]').count()==0)
    before=page.evaluate('({at:S.at,driving:S.driving})')
    page.keyboard.press('Enter')
    check('Map Enter never starts an unrequested trip',page.evaluate('({at:S.at,driving:S.driving})')==before)
    if page.locator('#ovl-map').is_visible():
        page.keyboard.press('Escape')
    page.wait_for_timeout(350)
    check('Full map closes and restores regional trigger',not page.locator('#ovl-map').is_visible() and active_id(page)=='journey-map-world',str(page.evaluate("({id:document.activeElement.id,classes:document.activeElement.className,text:document.activeElement.textContent.slice(0,60)})")))
    page.keyboard.press('Escape')
    check('Inline map Escape restores map toggle',not page.locator('#journey-route-map').is_visible() and page.locator('[data-route-map-toggle]').evaluate('(e)=>e===document.activeElement'))
    activate(page,'button[data-journey-mode="route"]',keyboard=True)
    page.keyboard.press('ArrowRight')
    check('ArrowRight selects stay tab',page.locator('button[data-journey-mode="local"]').get_attribute('aria-selected')=='true')
    modal_check(page,'[data-stay-choice]','#stay-action-dialog')
    page.keyboard.press('Tab')
    check('Current stay action has a keyboard-reachable execute control',tab_to(page,'.stay-execute'))
    # Save is reached via the real menu; no save/state fixture substitutes.
    activate(page,'#dk-menu',keyboard=True)
    activate(page, '#menu-save-now', keyboard=True)
    check('Keyboard menu save produces a readable save',page.evaluate("JSON.parse(localStorage.getItem('seoul400_save_v1')).name===S.name"))
    page.keyboard.press('Escape')
    tiny=page.locator('#scr-game button:visible').evaluate_all('(a)=>a.filter(e=>e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize)<12).map(e=>({text:e.textContent,size:getComputedStyle(e).fontSize}))')
    check('Visible game controls contain no sub12px text',not tiny,str(tiny))
    check('No console/runtime errors',not errors,str(errors))
    browser.close()
if failures:
    raise SystemExit('\n'.join(failures))
print('✅ Keyboard accessibility checks passed')
