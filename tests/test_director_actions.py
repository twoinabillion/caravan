"""Regression gates for unobstructed goals and usable reading preferences.

Breaks caught: a floating goal update hides departure; a menu drops saved
preferences; owner CSS defeats large text; reward ink disappears on paper.
"""
import os
import re
from pathlib import Path

import pytest
from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
URL = os.environ.get('CARAVAN_TEST_URL', (ROOT / '서울까지400km.html').as_uri())
ARTIFACTS = ROOT / 'artifacts/director-actions-20260914'


@pytest.fixture
def page():
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome')
        page = browser.new_page(viewport={'width':390,'height':844})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.add_init_script("localStorage.setItem('caravan_story_auto','0')")
        yield page
        assert not errors, errors
        browser.close()


def enter(page, width=390, height=844):
    page.set_viewport_size({'width':width,'height':height})
    page.goto(URL)
    page.evaluate("""async () => {
      G.newGame('onroad','읽기 점검','full');
      S.flags.main_mission_started=true; S.flags.onboarding_event_guide=true;
      await UI.restoreQaView({screen:'game'});
      document.documentElement.classList.remove('qa-exact-replay');
      G.save();
    }""")


def gameplay(page):
    return page.evaluate("JSON.stringify({at:S.at,min:S.min,day:S.day,fuel:S.fuel,food:S.food,water:S.water,hp:S.hp,scrap:S.scrap,items:S.items,flags:S.flags,driving:S.driving})")


def story(page, event='onboarding_first_road'):
    page.evaluate("id=>{UI.showEvent(D.events.find(e=>e.id===id));UI.finishStory()}", event)
    page.locator('#ev-sheet [data-i]').first.wait_for(state='visible')


def font(page, selector):
    return page.locator(selector).last.evaluate('n=>parseFloat(getComputedStyle(n).fontSize)')


def settled_rewards(page):
    page.wait_for_function("""() => {
      const pills=[...document.querySelectorAll('.reward-pill')];
      return pills.length && pills.every(n=>Number(getComputedStyle(n).opacity)>.99);
    }""")


@pytest.mark.parametrize('kind', ['main', 'side'])
def test_quest_update_uses_goal_entry_without_covering_departure(page, kind):
    enter(page, 320, 578)
    page.evaluate("""kind => {
      G.questLedgerSync();
      if(kind==='main') S.flags.first_order_trace=true;
      else S.quest={ledgerId:'notice_delivery',kind:'deliver',item:'검사 기록',from:'miryang',to:'gwangju',reward:10,due:8};
      G.questLedgerSync();
    }""", kind)
    # Acknowledgement belongs to the existing button, never a second overlay.
    assert page.locator('#quest-update-ribbon:visible').count() == 0
    expect(page.locator('#dk-objectives')).to_have_class(re.compile('has-quest-update'))
    assert page.locator('#quest-update-status').get_attribute('role') == 'status'
    assert page.locator('#quest-update-status').inner_text()
    assert page.locator('.nav-depart-cta').evaluate("""n=>{
      const r=n.getBoundingClientRect();
      return r.bottom<=document.querySelector('#dock').getBoundingClientRect().top+1
        && n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
    }""")
    page.screenshot(path=ARTIFACTS / f'goal-update-{kind}-320.png')
    before = gameplay(page)
    page.locator('#dk-objectives').click()
    assert page.evaluate('QuestLedgerUI.isOpen()')
    expect(page.locator(f'[data-quest-tab="{kind}"]')).to_have_attribute('aria-selected', 'true')
    assert 'has-quest-update' not in page.locator('#dk-objectives').get_attribute('class')
    page.locator('.quest-ledger-back').click()
    expect(page.locator('#dk-objectives')).to_be_focused()
    assert gameplay(page) == before


def test_quest_notice_survives_reload_until_acknowledged(page):
    enter(page)
    page.evaluate('G.questLedgerSync();S.flags.first_order_trace=true;G.save()')
    assert page.evaluate('G.questLedgerUpdates().length') > 0
    page.reload()
    page.evaluate("async()=>{await UI.restoreQaView({screen:'game'});document.documentElement.classList.remove('qa-exact-replay')}")
    expect(page.locator('#dk-objectives')).to_have_class(re.compile('has-quest-update'))
    page.locator('#dk-objectives').click()
    assert page.evaluate('G.questLedgerUpdates().length') == 0
    page.locator('.quest-ledger-back').click()
    page.reload()
    page.evaluate("async()=>{await UI.restoreQaView({screen:'game'});document.documentElement.classList.remove('qa-exact-replay')}")
    expect(page.locator('#dk-objectives')).not_to_have_class(re.compile('has-quest-update'))


@pytest.mark.parametrize('width,height', [(320,578), (390,844), (1440,900)])
def test_preferences_reachable_reversible_and_persisted(page, width, height):
    enter(page, width, height)
    before = gameplay(page)
    page.locator('#dk-menu').click()
    for selector in ('#menu-text-toggle', '#menu-motion-toggle'):
        button = page.locator(selector)
        expect(button).to_be_visible()
        assert button.bounding_box()['height'] >= 44
        button.click()
        expect(button).to_have_attribute('aria-pressed', 'true')
    assert page.evaluate("document.documentElement.dataset.uiText") == 'large'
    assert page.evaluate("document.documentElement.dataset.uiMotion") == 'reduced'
    assert gameplay(page) == before
    page.screenshot(path=ARTIFACTS / f'menu-large-{width}.png')
    page.reload()
    # Reload restores preferences even before choosing a saved game.
    assert page.evaluate("document.documentElement.dataset.uiText") == 'large'
    assert page.evaluate("document.documentElement.dataset.uiMotion") == 'reduced'
    page.evaluate("async()=>{await UI.restoreQaView({screen:'game'});document.documentElement.classList.remove('qa-exact-replay')}")
    page.locator('#dk-menu').click()
    for selector in ('#menu-text-toggle', '#menu-motion-toggle'):
        expect(page.locator(selector)).to_have_attribute('aria-pressed', 'true')
        page.locator(selector).click()
        expect(page.locator(selector)).to_have_attribute('aria-pressed', 'false')
    assert page.evaluate("localStorage.getItem('caravan_ui_text')") == 'normal'
    assert page.evaluate("localStorage.getItem('caravan_ui_motion')") == 'full'


@pytest.mark.parametrize('width,height', [(320,578), (390,844), (480,900)])
def test_large_saved_preference_changes_actual_story_and_choices(page, width, height):
    enter(page, width, height)
    story(page)
    normal = font(page, '.story-narration-text')
    normal_choice = font(page, '.choice-title>span:last-child')
    # Existing saved settings must work, not only the newly exposed menu.
    page.evaluate("localStorage.setItem('caravan_ui_text','large')")
    page.reload()
    page.evaluate("async()=>{await UI.restoreQaView({screen:'game'});document.documentElement.classList.remove('qa-exact-replay')}")
    story(page)
    assert font(page, '.story-narration-text') >= normal + 2
    assert font(page, '.choice-title>span:last-child') >= normal_choice + 2
    for choice in page.locator('#ev-sheet [data-i]').all():
        choice.scroll_into_view_if_needed()
        assert choice.evaluate("n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}")
        assert choice.locator('.choice-title').evaluate('n=>n.scrollHeight<=n.clientHeight+1&&n.scrollWidth<=n.clientWidth+1')
    page.screenshot(path=ARTIFACTS / f'story-large-{width}.png')
    page.locator('#ev-sheet [data-i="0"]').click()
    page.evaluate('UI.finishStory()')
    settled_rewards(page)
    assert font(page, '.reward-pill') >= 16
    for pill in page.locator('.reward-pill').all():
        assert pill.evaluate("""n=>{
          const r=n.getBoundingClientRect(),p=n.closest('.reward-section').getBoundingClientRect();
          return r.left>=p.left&&r.right<=p.right&&n.scrollWidth<=n.clientWidth+1;
        }"""), pill.inner_text()
    before = gameplay(page)
    page.screenshot(path=ARTIFACTS / f'result-large-{width}.png')
    page.reload()
    page.evaluate("async()=>{await UI.restoreQaView({screen:'game'});document.documentElement.classList.remove('qa-exact-replay')}")
    assert gameplay(page) == before, 'restoring a result duplicated its costs or rewards'


@pytest.mark.parametrize('choice', [0, 1, 2])
def test_reward_ink_is_readable_on_paper(page, choice):
    enter(page)
    story(page)
    page.locator(f'#ev-sheet [data-i="{choice}"]').click()
    page.evaluate('UI.finishStory()')
    settled_rewards(page)
    colors = page.locator('.reward-pill').evaluate_all("ns=>ns.map(n=>({text:n.innerText,color:getComputedStyle(n).color}))")
    assert colors

    def luminance(rgb):
        channels = [c/255 for c in rgb]
        linear = [c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4 for c in channels]
        return sum(c*w for c,w in zip(linear, (0.2126,0.7152,0.0722)))

    # Conservative hand-selected paper sample, not a expected value derived
    # from the CSS under test. Textured captures are also reviewed by eye.
    paper = luminance((200,180,145))
    for row in colors:
        ink = luminance([float(c) for c in re.findall(r'[\d.]+', row['color'])[:3]])
        contrast = (max(paper,ink)+.05)/(min(paper,ink)+.05)
        assert contrast >= 4.5, (row, contrast)
    page.screenshot(path=ARTIFACTS / f'reward-{choice}-390.png')


@pytest.mark.parametrize('event', ['story_family_key', 'combat_walker_strike'])
def test_large_dialogue_and_combat_choices_remain_readable(page, event):
    page.add_init_script("localStorage.setItem('caravan_ui_text','large')")
    enter(page, 320, 578)
    story(page, event)
    prose = page.locator('#ev-sheet .story-entry .chat-bubble, #ev-sheet .story-entry .turn-text, #ev-sheet .story-entry .story-narration-text')
    assert prose.count()
    for text in prose.all():
        if not text.is_visible():
            continue
        assert text.evaluate('n=>parseFloat(getComputedStyle(n).fontSize)>=18')
        assert text.evaluate('n=>n.scrollWidth<=n.clientWidth+1')
    for choice in page.locator('#ev-sheet [data-i]').all():
        choice.scroll_into_view_if_needed()
        assert choice.evaluate('n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}')
        assert choice.locator('.choice-title>span:last-child').evaluate('n=>parseFloat(getComputedStyle(n).fontSize)>=17')
    page.screenshot(path=ARTIFACTS / f'{event}-large-320.png')


@pytest.mark.parametrize('event', ['opening_workshop', 'opening_parents_module', 'opening_departure'])
def test_large_opening_thought_is_not_cancelled_by_its_skin(page, event):
    page.add_init_script("localStorage.setItem('caravan_ui_text','large')")
    enter(page, 320, 578)
    page.evaluate("id=>{UI.showEvent(D.openingDeparture.find(e=>e.id===id));UI.finishStory()}", event)
    thought = page.locator('#ev-sheet .story-turn.thought .turn-text')
    expect(thought).to_be_visible()
    assert thought.evaluate('n=>parseFloat(getComputedStyle(n).fontSize)>=18')
    assert thought.evaluate('n=>n.scrollWidth<=n.clientWidth+1')
    thought.scroll_into_view_if_needed()
    page.screenshot(path=ARTIFACTS / f'{event}-thought-large-320.png')
