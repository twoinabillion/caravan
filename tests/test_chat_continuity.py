"""A real choice must retain its context, receipt and reading position on reload."""
import os
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
URL = os.environ.get('CARAVAN_TEST_URL', (ROOT / '서울까지400km.html').as_uri())


@pytest.fixture
def page():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome')
        page = browser.new_page(viewport={'width': 390, 'height': 844})
        page.add_init_script("localStorage.setItem('caravan_story_auto','0')")
        page.goto(URL)
        page.evaluate("""() => {
          localStorage.removeItem(SAVE_KEY); G.newGame('onroad','대화 검수','full');
          S.flags.main_mission_started=true; S.flags.onboarding_event_guide=true;
          UI.restoreQaView({screen:'game'}); G.save(); G.load();
          document.documentElement.classList.remove('qa-exact-replay');
        }""")
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        yield page
        assert not errors, errors
        browser.close()


def finish(page):
    page.evaluate('UI.finishStory()')


def transcript(page):
    return '\n'.join(page.locator('#ev-sheet .story-transcript > [data-story-entry], #ev-sheet .story-transcript > .story-result').all_inner_texts())


def resume(page):
    page.reload()
    if page.locator('#bt-continue').is_visible():
        page.locator('#bt-continue').click()
    page.wait_for_function("document.querySelector('#ev-wrap.on') && document.querySelector('#ev-sheet').dataset.storyPhase==='outcome'")


def resources(page):
    return page.evaluate('JSON.stringify({fuel:S.fuel,food:S.food,water:S.water,items:S.items,scrap:S.scrap,day:S.day,min:S.min,flags:S.flags,notes:S.notes,comps:S.comps,campMemories:S.campMemories})')


@pytest.mark.parametrize('event_id', ['ev_truck_cafe', 'onboarding_first_road', 'combat_walker_read'])
def test_choice_keeps_prior_dialogue_and_receipt_on_reload(page, event_id):
    page.evaluate('(id)=>G.openEventById(id)', event_id)
    finish(page)
    before = transcript(page)
    page.locator('#ev-sheet .choice[data-i]:enabled').first.click()
    # The original conversation survives even while only the first result turn is visible.
    assert before in transcript(page)
    assert page.locator('#ev-sheet .story-selected-action').count() == 1
    partial = transcript(page)
    after_choice = resources(page)
    resume(page)
    assert transcript(page) == partial
    assert resources(page) == after_choice
    finish(page)
    assert before in transcript(page)
    if event_id != 'combat_walker_read':
        assert page.locator('.story-transcript .reward-section').count() == 1
    assert page.locator('#ev-sheet .choice[data-i]').count() == 0
    complete = transcript(page)
    resume(page)
    assert transcript(page) == complete
    assert resources(page) == after_choice
    assert page.locator('#ev-sheet [data-r=ok]').is_enabled()


def test_goal_change_is_read_in_chat_without_a_second_ribbon(page):
    page.evaluate("G.openEventById('onboarding_first_road')")
    finish(page)
    page.locator('#ev-sheet .choice[data-i]:enabled').first.click()
    finish(page)
    assert page.locator('.story-transcript .story-quest-update').count() >= 1
    assert page.locator('#quest-update-ribbon:visible').count() == 0
    update = page.locator('.story-quest-update').all_inner_texts()
    resume(page)
    assert page.locator('.story-quest-update').all_inner_texts() == update


def test_camp_choice_preserves_exchange_and_does_not_charge_twice(page):
    page.evaluate("""() => {
      S.party=['minji']; S.comps.minji={mood:65,bond:5,lvl:0,perks:[],pending:1};
      S.at='gyeongju'; S.min=780; G.prepareCamp('talk','minji');
      UI.showEvent(G.campConversationEvent());
    }""")
    finish(page)
    before = transcript(page)
    page.locator('#ev-sheet .choice[data-i="0"]').click()
    partial = transcript(page)
    assert before in partial
    paid = resources(page)
    resume(page)
    assert transcript(page) == partial
    assert resources(page) == paid
    finish(page)
    page.locator('#ev-sheet [data-r=ok]').click()
    assert page.locator('#ovl-camp').is_visible()


def test_unread_goal_update_waiting_during_dialogue_is_not_discarded(page):
    page.evaluate("G.openEventById('ev_truck_cafe')")
    page.evaluate("G.ensureQuestLedger().updates.push({id:'pending_delivery',kind:'side',title:'수원 배달 준비',next:'수원에서 물자를 전달한다'})")
    finish(page)
    page.locator('#ev-sheet .choice[data-i]:enabled').first.click()
    finish(page)
    assert '수원 배달 준비' in page.locator('.story-result').inner_text()
    assert '수원에서 물자를 전달한다' in page.locator('.story-result').inner_text()
    resume(page)
    assert '수원 배달 준비' in page.locator('.story-result').inner_text()


def test_opening_exchange_survives_result_and_moves_to_next_scene_once(page):
    page.evaluate("G.newGame('onroad','출발','interactive','keeper');G.save();G.load();UI.restoreQaView({screen:'game'});document.documentElement.classList.remove('qa-exact-replay');UI.showEvent(G.openingPending())")
    finish(page)
    before = transcript(page)
    page.locator('#ev-sheet .choice[data-i]:enabled').first.click()
    partial = transcript(page)
    assert before in partial
    paid = resources(page)
    resume(page)
    assert transcript(page) == partial
    assert resources(page) == paid
    finish(page)
    page.locator('#ev-sheet [data-r=ok]').click()
    page.wait_for_function('S.opening.step===1')
    assert page.evaluate('Object.keys(S.opening.decisions).length') == 1


@pytest.mark.parametrize('activation', ['click', 'keyboard'])
def test_finale_record_toggle_does_not_advance_and_survives_choice_reload(page, activation):
    page.evaluate("""() => {
      S.at='seoul'; S.flags.seoul_open=true; S.flags.seoul_core_reached=true; S.flags.seoul_costs_seen=true;
      S.party=['minji','kangwoo','eunsu']; S.injuries={};
      S.party.forEach(id=>S.comps[id]={mood:65,bond:5,lvl:0,perks:[],pending:1});
      G.openEventById('seoul_decision');
    }""")
    finish(page)
    record = page.locator('.story-reading-record').last
    record.locator('summary').click()
    assert record.get_attribute('open') is not None
    original = record.locator('div').inner_text()
    page.locator('#ev-sheet .choice[data-i]:enabled').first.click()
    history = page.locator('.story-reading-record[data-record-history=true]')
    assert history.get_attribute('open') is not None
    assert history.locator('div').inner_text() == original
    progress = page.locator('[data-event-progress]').inner_text()
    history.locator('summary').click()
    assert history.get_attribute('open') is None
    assert page.locator('[data-event-progress]').inner_text() == progress
    if activation == 'keyboard':
        history.locator('summary').press('Enter')
    else:
        history.locator('summary').click()
    resume(page)
    assert page.locator('.story-reading-record[data-record-history=true]').get_attribute('open') is not None
    assert page.locator('[data-event-progress]').inner_text() == progress


@pytest.mark.parametrize('width,height', [(320,578),(390,844),(475,948),(1440,900)])
def test_story_actions_and_result_are_reachable_in_one_scroll(page, width, height):
    page.set_viewport_size({'width':width,'height':height})
    page.evaluate("G.openEventById('onboarding_first_road')")
    finish(page)
    assert page.locator('.event-field-report').evaluate("n=>n.getBoundingClientRect().bottom>=n.querySelector('.event-choice-dock').getBoundingClientRect().bottom"), 'manuscript background must contain the full conversation and choices'
    last = page.locator('#ev-sheet .choice[data-i]:enabled').last
    last.scroll_into_view_if_needed()
    last.click()
    finish(page)
    done = page.locator('#ev-sheet [data-r=ok]')
    done.scroll_into_view_if_needed()
    rect = done.bounding_box()
    assert rect and rect['y'] >= 0 and rect['y']+rect['height'] <= height+1
    assert rect['height'] >= 44
    assert page.evaluate("document.documentElement.scrollWidth<=innerWidth+1")
    # History can be read backwards without a second nested scroll container.
    assert page.locator('#ev-sheet .story-reader').evaluate("n=>n.scrollHeight<=n.clientHeight+1")
    assert page.locator('#ev-sheet .event-choice-dock').evaluate("n=>n.closest('.story-transcript')!==null")
    done.click()
    assert page.locator('#ev-wrap.on').count() == 0
