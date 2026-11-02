"""Visible-control helpers for the current packing and interactive opening UI."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / '서울까지400km.html').as_uri()


def active_id(page):
    return page.evaluate("document.activeElement?.id || document.activeElement?.tagName")


def tab_to(page, selector, max_tabs=160):
    target = page.locator(selector)
    if target.count() != 1 or not target.is_visible():
        return False
    for _ in range(max_tabs):
        if target.evaluate('(e)=>e===document.activeElement'):
            return True
        page.keyboard.press('Tab')
    return target.evaluate('(e)=>e===document.activeElement')


def activate(page, selector, keyboard=False):
    target = page.locator(selector)
    target.wait_for(state='visible')
    if keyboard:
        assert tab_to(page, selector), f'Unreachable by Tab: {selector}'
        page.keyboard.press('Enter')
    else:
        target.click()


def enter_game(page, keyboard=False):
    page.goto(GAME)
    activate(page, '#bt-new', keyboard)
    activate(page, '#bt-name', keyboard)
    named = False
    tested_second = False
    # The opening now owns name entry. Use real reading/choice controls rather
    # than hiding overlays, skipping story flags, or replacing the saved state.
    for _ in range(180):
        page.wait_for_timeout(65)
        name = page.locator('#opening-name:visible')
        if name.count():
            if keyboard:
                assert tab_to(page, '#opening-name')
                page.keyboard.type('하린')
                page.keyboard.press('Enter')
            else:
                name.fill('접근성')
                name.press('Enter')
            named = True
            continue
        if page.locator('#ev-wrap.on').count():
            next_button = page.locator('#ev-wrap button.story-next:visible')
            choices = page.locator('#ev-wrap button.choice:visible:not(:disabled)')
            if next_button.count():
                if keyboard:
                    assert tab_to(page, '#ev-wrap button.story-next:visible')
                    page.keyboard.press('Enter')
                else:
                    next_button.click()
            elif choices.count():
                if keyboard:
                    if not tested_second and choices.count() >= 2:
                        expected = choices.nth(1).inner_text()
                        page.keyboard.press('2')
                        page.wait_for_timeout(80)
                        actual = page.evaluate("S.opening.decisions.opening_workshop?.label")
                        assert actual and actual in expected, f'Number2 failed: {expected} / {actual}'
                        tested_second = True
                    else:
                        page.keyboard.press('1')
                else:
                    choices.first.click()
            else:
                # Space completes a currently typing page through its visible
                # reading surface; never a hidden element click.
                if keyboard:
                    page.keyboard.press('1')
                else:
                    surface = page.locator('#ev-wrap [role="button"]:visible')
                    if surface.count():
                        surface.first.click()
            continue
        arrival = page.locator('[data-arrival-continue]:visible')
        if arrival.count():
            activate(page, '[data-arrival-continue]:visible', keyboard)
            continue
        if named and page.locator('[data-journey-mode="route"]:visible').count():
            return
    raise AssertionError('Interactive opening did not reach the stopped journey shell')
