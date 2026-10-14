"""Current controls in an isolated fixture; not user-save or visual QA."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 360, 'height': 728})
    page.set_default_timeout(7000)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto((ROOT / '서울까지400km.html').as_uri())
    page.evaluate("""() => {
      G.newGame('onroad','조작 검사','full'); S.at='suwon';
      G.save(); G.load(); UI.restoreQaView({screen:'game'});
    }""")
    page.locator('#dk-objectives').click()
    for tab in ['side', 'completed', 'main']:
        button = page.locator(f'[data-quest-tab="{tab}"]')
        button.click()
        assert button.get_attribute('aria-pressed') == 'true'
        assert page.locator('[data-quest-tab][aria-pressed="true"]').count() == 1
    page.keyboard.press('Escape')
    page.wait_for_function("document.querySelector('#quest-ledger').getAttribute('aria-hidden')==='true'")
    print('PASS goal main/side/completed selection uses aria-pressed; Escape closes', flush=True)

    page.evaluate("UI.showStl('suwon','people')")
    def enter():
        page.locator('[data-person-key="npc-gitae"]').click()
        page.locator('#people-action').click()
        page.evaluate('UI.finishStory()')
    def choose(label):
        for _ in range(20):
            control = page.get_by_role('button', name=label, exact=True)
            if control.is_visible():
                control.click()
                page.evaluate('UI.finishStory()')
                return
            page.locator('#ev-sheet [data-page-next]:visible, #ev-sheet [data-choice-next]:visible').first.click()
        raise AssertionError('unreachable local action: ' + label)
    enter()
    choose('요즘 소문 들은 거 없어요?')
    assert page.evaluate("S.flags.rumor_gitae && S.notes.some(n=>n.body===D.npcs.gitae.rumor.text)")
    assert '편지' in page.locator('#ev-sheet').inner_text()
    choose('고맙습니다')
    enter()
    choose('이런저런 얘기를 나눈다')
    page.locator('#ev-sheet [data-reader-mode="review"]').click()
    chat = page.evaluate("({lines:D.npcs.gitae.chats,shown:document.querySelector('#ev-sheet').textContent})")
    assert any(line.strip('"「」') in chat['shown'] for line in chat['lines']), chat
    page.locator('#ev-sheet [data-local-close]').click()
    assert not page.locator('#ev-wrap').evaluate("n=>n.classList.contains('on')")
    page.reload()
    page.locator('#bt-continue').click()
    assert page.evaluate("S.flags.rumor_gitae && S.npcs.gitae.met")
    assert not errors, errors
    print('PASS current NPC rumor -> thanks -> personal chat -> close -> Continue; state retained; no page errors', flush=True)
    browser.close()
