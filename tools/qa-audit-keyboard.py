"""Real key down/up checks in an isolated fixture, never the Studio save."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    page.set_default_timeout(7000)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto((ROOT / '서울까지400km.html').as_uri())
    page.evaluate("G.newGame('onroad','키 검사','full');G.save();G.load();UI.restoreQaView({screen:'game'})")
    def tab_to(selector):
        for _ in range(60):
            if page.locator(selector).evaluate('n=>n===document.activeElement'):
                return
            page.keyboard.press('Tab')
        raise AssertionError('keyboard cannot reach ' + selector)
    tab_to('[data-route-map-toggle]')
    page.keyboard.press('Enter')
    assert page.locator('[data-route-map-toggle]').get_attribute('aria-expanded') == 'true'
    page.keyboard.press('Escape')
    assert page.locator('[data-route-map-toggle]').get_attribute('aria-expanded') == 'false'
    assert page.locator('[data-route-map-toggle]').evaluate('n=>n===document.activeElement')
    tab_to('[data-trip-destination]')
    page.keyboard.press('Enter')
    assert page.locator('#trip-destination-dialog').evaluate('n=>n.open')
    page.keyboard.press('Escape')
    assert page.locator('[data-trip-destination]').evaluate('n=>n===document.activeElement')
    assert page.evaluate('!S.driving')
    print('PASS current map and destination: Tab/Enter/Escape/focus return/no departure', flush=True)

    page.evaluate("UI.showEvent(D.events.find(e=>e.id==='meet_toll'));UI.finishStory()")
    for _ in range(30):
        choices = page.locator('#ev-sheet .choice[data-i]:visible')
        if choices.count() >= 2:
            break
        page.keyboard.press('1')
    assert choices.count() >= 2
    assert choices.nth(1).is_disabled(), 'fixture requires unavailable Kangwoo negotiation'
    before = page.evaluate('JSON.stringify([S.scrap,S.van,S.min,S.pendingPresentation])')
    page.keyboard.press('2')
    assert page.evaluate('JSON.stringify([S.scrap,S.van,S.min,S.pendingPresentation])') == before
    assert choices.count() >= 3
    expected = int(choices.nth(2).get_attribute('data-i'))
    page.keyboard.press('3')
    page.wait_for_function("S.pendingPresentation?.phase==='result'")
    assert page.evaluate('S.pendingPresentation.choiceIndex') == expected
    page.reload()
    page.locator('#bt-continue').click()
    assert page.evaluate('S.pendingPresentation.choiceIndex') == expected
    assert not errors, errors
    print('PASS disabled Digit2 is inert; Digit3 selects actual third choice; Continue preserves result; no errors', flush=True)
    for crew, scrap, key, expected in [(False, 0, '1', None), (True, 20, '2', 1)]:
        extra = browser.new_page(viewport={'width': 390, 'height': 844})
        extra.on('pageerror', lambda error: errors.append(str(error)))
        extra.goto((ROOT / '서울까지400km.html').as_uri())
        extra.evaluate("""({crew,scrap})=>{
          G.newGame('onroad','키 조건 검사','full');S.scrap=scrap;
          if(crew)S.party=['kangwoo'];
          UI.showEvent(D.events.find(e=>e.id==='meet_toll'));UI.finishStory();
        }""", {'crew': crew, 'scrap': scrap})
        before = extra.evaluate('JSON.stringify([S.scrap,S.van,S.min,S.pendingPresentation])')
        extra.keyboard.press(key)
        if expected is None:
            assert extra.evaluate('JSON.stringify([S.scrap,S.van,S.min,S.pendingPresentation])') == before
        else:
            assert extra.evaluate('S.pendingPresentation.choiceIndex') == expected
        extra.close()
    assert not errors, errors
    print('PASS unaffordable first choice stays inert; enabled second choice keeps Digit2', flush=True)
    browser.close()
