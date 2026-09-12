"""Departure costs and an explicit action belong in the initial viewport."""
import os
from pathlib import Path
import pytest
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
URL=os.environ.get('CARAVAN_TEST_URL',(ROOT/'서울까지400km.html').as_uri())
@pytest.fixture
def page():
    with sync_playwright() as p:
        browser=p.chromium.launch(channel='chrome')
        page=browser.new_page(viewport={'width':320,'height':578})
        page.goto(URL)
        page.evaluate("G.newGame('onroad','출발 검수','full');S.flags.main_mission_started=true;S.flags.onboarding_event_guide=true;UI.restoreQaView({screen:'game'});document.documentElement.classList.remove('qa-exact-replay')")
        page.locator('button[data-journey-mode=route]').click()
        yield page
        browser.close()

def visible_without_scrolling(page,selector):
    return page.locator(selector).evaluate("""n=>{const r=n.getBoundingClientRect(); if(r.height<1||r.top<0||r.bottom>innerHeight) return false; for(let p=n.parentElement;p;p=p.parentElement){const s=getComputedStyle(p),b=p.getBoundingClientRect(); if(['auto','scroll','hidden','clip'].includes(s.overflowY)&&(r.top<b.top-1||r.bottom>b.bottom+1)) return false;} return true;}""")

@pytest.mark.parametrize('size',[(320,578),(360,640),(375,667),(390,667),(390,844),(475,844),(1440,900)])
def test_explicit_departure_and_costs_are_visible_before_scroll(page,size):
    page.set_viewport_size({'width':size[0],'height':size[1]})
    page.wait_for_timeout(350)
    assert visible_without_scrolling(page,'.nav-depart-cta'), '출발 버튼이 처음 화면에 보이지 않음'
    assert visible_without_scrolling(page,'.nav-route-facts'), '출발 비용이 처음 화면에 보이지 않음'
    button=page.locator('.nav-depart-cta')
    assert button.bounding_box()['height']>=44
    dest=button.get_attribute('data-nav-depart')
    assert dest and '출발' in button.inner_text()
    # Choosing or reselecting a destination is a preview, not travel.
    page.locator('.nav-destination-card.is-selected').click()
    assert not page.evaluate('!!S.driving')
    button.click()
    assert page.evaluate('S.driving&&S.driving.to')==dest


def test_route_change_updates_action_and_low_fuel_explains_block(page):
    before=page.locator('.nav-depart-cta').get_attribute('data-nav-depart')
    page.locator('[data-nav-next]').click()
    dest=page.locator('.nav-depart-cta').get_attribute('data-nav-depart')
    assert dest!=before
    assert not page.evaluate('!!S.driving')
    page.evaluate('S.fuel=0;UI.renderAll();G.save()')
    assert page.locator('.nav-depart-cta').is_disabled()
    assert visible_without_scrolling(page,'.nav-depart-blocked')
    assert '연료' in page.locator('.nav-depart-blocked').inner_text()
    assert not page.evaluate('!!S.driving')


def test_returning_from_stay_keeps_departure_visible_and_save_resumes_trip(page):
    page.locator('button[data-journey-mode=local]').click()
    page.wait_for_timeout(200)
    page.locator('button[data-journey-mode=route]').click()
    page.wait_for_timeout(200)
    assert visible_without_scrolling(page,'.nav-depart-cta')
    assert visible_without_scrolling(page,'.nav-route-facts')
    dest=page.locator('.nav-depart-cta').get_attribute('data-nav-depart')
    page.locator('.nav-depart-cta').click()
    page.evaluate('G.save()')
    page.reload()
    page.locator('#bt-continue').click()
    assert page.evaluate('S.driving&&S.driving.to')==dest


def test_story_return_from_stay_cannot_keep_departure_below_fold(page):
    page.locator('button[data-journey-mode=local]').click()
    page.evaluate("G.openEventById('onboarding_first_road');UI.finishStory()")
    page.locator('.choice[data-i]:enabled').first.click()
    page.evaluate('UI.finishStory()')
    page.locator('[data-r=ok]').click()
    page.wait_for_timeout(350)
    page.locator('button[data-journey-mode=route]').click()
    page.wait_for_timeout(150)
    assert visible_without_scrolling(page,'.nav-depart-cta')
    assert visible_without_scrolling(page,'.nav-route-facts')
