"""Road conversation is read, answered and resumed without duplicate rewards."""
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
        page = browser.new_page(viewport={'width': 320, 'height': 568})
        page.add_init_script("localStorage.setItem('caravan_story_auto','0')")
        page.goto(URL)
        page.evaluate("""() => {
          localStorage.removeItem(SAVE_KEY); G.newGame('onroad','길동무','full');
          S.flags.main_mission_started=true; S.flags.onboarding_event_guide=true;
          S.party=['minji','kangwoo'];
          for(const id of S.party) S.comps[id]={mood:60,bond:0,lvl:0,perks:[]};
          UI.restoreQaView({screen:'game'});
          G.startTravel('yangsan'); S.driving.slots=[]; G.save(); UI.renderAll();
        }""")
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        yield page
        assert not errors, errors
        browser.close()


def transcript(page):
    return page.locator('#ev-sheet .story-transcript').inner_text()


def resume(page):
    page.reload()
    if page.locator('#bt-continue').is_visible():
        page.locator('#bt-continue').click()
    page.wait_for_function("document.querySelector('#ev-wrap.on .event-mode')")


def answer(page):
    page.evaluate('UI.finishStory()')
    page.locator('#ev-sheet .choice[data-i]').first.click()


def close(page):
    page.evaluate('UI.finishStory()')
    page.locator('#ev-sheet [data-r=ok]').click()


def test_chat_opens_before_reward_and_resumes_once(page):
    page.locator('[data-road-checkin=minji]').click()
    assert page.locator('#ev-wrap.on .story-transcript').count() == 1
    assert page.evaluate('S.comps.minji.bond') == 0
    assert not page.evaluate('!!S.driving.checkIn')
    partial = transcript(page)
    resume(page)
    assert transcript(page) == partial
    page.evaluate('UI.finishStory()')
    before = page.locator('.story-transcript > [data-story-entry]').all_inner_texts()
    page.locator('#ev-sheet .choice[data-i]').first.click()
    assert all(line in transcript(page) for line in before)
    assert page.evaluate('S.comps.minji.bond') == 1
    assert page.evaluate('S.comps.minji.mood') == 63
    assert page.evaluate('S.driving.checkIn') == 'minji'
    assert page.evaluate('S.stats.events') == 0
    result = transcript(page)
    resume(page)
    assert transcript(page) == result
    assert page.evaluate('S.comps.minji.bond') == 1
    close(page)
    assert page.locator('.road-checkin.is-complete').is_visible()
    assert not page.evaluate("G.roadCheckIn('kangwoo').ok")


def test_back_does_not_spend_checkin_or_relationship(page):
    page.locator('[data-road-checkin=minji]').click()
    page.locator('#ev-sheet [data-road-later]').click()
    assert not page.evaluate('!!S.pendingPresentation')
    assert not page.evaluate('!!S.driving.checkIn')
    assert page.evaluate('S.comps.minji.bond') == 0
    page.locator('[data-road-checkin=kangwoo]').click()
    answer(page)
    assert page.evaluate('S.driving.checkIn') == 'kangwoo'


def test_route_pair_and_legacy_completed_leg(page):
    page.evaluate("S.at='gimcheon';S.driving=null;S.routePlan={id:'ridge'};G.startTravel('sangju');S.driving.slots=[];UI.renderAll()")
    page.locator('[data-road-checkin=minji]').click()
    page.evaluate('UI.finishStory()')
    assert '강우' in transcript(page)
    answer(page)
    assert page.evaluate('S.comps.kangwoo.mood') == 62
    assert page.evaluate('S.comps.kangwoo.bond') == 0
    assert page.evaluate('S.driving.checkInMoment.id') == 'ridge_minji_kangwoo'
    close(page)
    page.evaluate("delete S.driving.checkInMoment;delete S.driving.checkInSummary;G.save();G.load();UI.renderAll()")
    assert page.locator('[data-road-checkin]').count() == 0
    assert not page.evaluate("G.roadCheckIn('minji').ok")


def test_stopped_missing_companion_and_pending_event_are_rejected(page):
    assert not page.evaluate("G.roadCheckIn('eunsu').ok")
    page.evaluate("G.openEventById('ev_truck_cafe')")
    assert not page.evaluate("G.roadCheckIn('minji').ok")
    page.wait_for_function('S.pendingPresentation')
    existing = page.evaluate('S.pendingPresentation.eventId')
    assert not page.evaluate("G.roadCheckIn('minji').ok")
    assert page.evaluate('S.pendingPresentation.eventId') == existing
    page.evaluate('S.driving=null')
    assert not page.evaluate("G.roadCheckIn('minji').ok")


@pytest.mark.parametrize('companion', ['minji', 'parkss', 'kangwoo', 'jaeyi', 'eunsu', 'leo'])
def test_each_companion_can_talk_again_on_next_leg(page, companion):
    page.evaluate("""id=>{
      S.party=[id]; S.comps[id]={mood:60,bond:0,lvl:0,perks:[]}; UI.renderAll();
    }""", companion)
    page.locator(f'[data-road-checkin={companion}]').click()
    answer(page)
    close(page)
    assert page.evaluate('id=>S.comps[id].bond', companion) == 1
    page.evaluate("S.at='yangsan';S.driving=null;G.startTravel('miryang');S.driving.slots=[];UI.restoreQaView({screen:'game'})")
    page.locator(f'[data-road-checkin={companion}]').click()
    answer(page)
    assert page.evaluate('id=>S.comps[id].bond', companion) == 2
