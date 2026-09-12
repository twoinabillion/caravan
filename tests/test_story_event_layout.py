#!/usr/bin/env python3
"""Regression coverage for the continuous story transcript and deliberate tap progression."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = (ROOT / "서울까지400km.html").as_uri()


def box(page, selector):
    result = page.locator(selector).bounding_box()
    assert result, f"missing bounds for {selector}"
    return result


def enter_story(page):
    page.goto(URL)
    page.click("#bt-new")
    if page.locator("#scr-mode").is_visible():
        page.click("#mode-on")
    page.fill("#inp-name", "이벤트 정렬")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(180)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")
    page.evaluate(
        """() => {
          S.stopover = null;
          S.driving = {from:'busan',to:'yangsan',dist:24,gone:14,
            road:'high',slots:[],si:0};
          UI.showEvent(D.events.find(event => event.id === 'story_generation_form'));
        }"""
    )
    page.wait_for_timeout(160)


def check_viewport(playwright, width, height):
    browser = playwright.chromium.launch(channel="chrome")
    page = browser.new_page(viewport={"width": width, "height": height})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.add_init_script(
        "localStorage.clear(); localStorage.setItem('caravan_story_auto','0')"
    )
    enter_story(page)

    reader = page.locator('.story-reader')
    transcript = page.locator('.story-transcript')
    assert reader.evaluate('n=>n.scrollHeight<=n.clientHeight+1')
    assert page.locator('.story-next').is_visible()
    assert page.locator('[data-event-progress]').inner_text() == '1 / 4'
    sheet_start = box(page, '#ev-sheet')
    for expected in (2, 3, 4):
        before = transcript.locator(':scope > [data-story-entry]').all_inner_texts()
        latest = transcript.locator(':scope > [data-story-entry]').last
        page.locator('.story-next').scroll_into_view_if_needed()
        page.evaluate("document.querySelector('.event-scroll').scrollTop=document.querySelector('.event-scroll').scrollHeight")
        page.wait_for_timeout(300)  # deliberate taps, outside the double-tap guard
        latest.click()
        page.wait_for_timeout(90)
        assert page.locator('[data-event-progress]').inner_text() == f'{expected} / 4', (width, expected, page.locator('[data-event-progress]').inner_text(), page.locator('.event-scroll').evaluate('n=>({top:n.scrollTop,height:n.scrollHeight,client:n.clientHeight})'))
        after = transcript.locator(':scope > [data-story-entry]').all_inner_texts()
        assert after[:len(before)] == before
        assert len(after) == len(before)+1
        assert reader.evaluate('n=>n.scrollHeight<=n.clientHeight+1')
        sheet = box(page, '#ev-sheet')
        assert abs(sheet['width']-sheet_start['width']) <= 1
        assert abs(sheet['height']-sheet_start['height']) <= 1
    assert page.locator('#ev-sheet').get_attribute('data-story-step') == 'decision'
    assert page.locator('.event-choice-dock').evaluate("n=>n.parentElement.matches('.story-transcript')")
    before = transcript.locator(':scope > [data-story-entry]').all_inner_texts()
    page.evaluate("window.__priorFrame=document.querySelector('.event-scene-frame');window.__priorScene=window.__priorFrame.dataset.sceneKey")
    page.locator('.event-choice-dock .choice[data-i]:not([disabled])').first.click()
    page.wait_for_timeout(110)
    assert page.locator('#ev-sheet').get_attribute('data-story-phase') == 'outcome'
    assert transcript.locator(':scope > [data-story-entry]').all_inner_texts()[:len(before)] == before
    assert page.locator('.story-selected-action').count() == 1
    assert page.evaluate("document.querySelector('.event-scene-frame').dataset.sceneKey!==window.__priorScene||document.querySelector('.event-scene-frame')===window.__priorFrame")
    page.evaluate('UI.finishStory()')
    done = page.locator('[data-r=ok]')
    done.scroll_into_view_if_needed()
    rect = done.bounding_box()
    assert rect and rect['y']>=0 and rect['y']+rect['height']<=height+1
    done.click()
    assert page.locator('#ev-wrap.on').count() == 0
    assert not errors, errors
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
    browser.close()


with sync_playwright() as playwright:
    for viewport in ((320, 578), (375, 667), (390, 844), (475, 948)):
        check_viewport(playwright, *viewport)
    print("✅ 이벤트 본문·탭 진행 · 320x578 / 375x667 / 390x844 / 475x948")
