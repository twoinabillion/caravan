#!/usr/bin/env python3
"""Regression coverage for the compact cinematic story event reader."""
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

    head = box(page, ".event-head")
    reader = box(page, ".story-reader")
    current = box(page, ".story-reader [data-story-entry]:last-child")
    dock = box(page, ".event-choice-dock")
    tap_hint = box(page, ".story-tap-hint")
    tutorial = page.locator(".event-tutorial-note")
    preceding = box(page, ".event-tutorial-note") if tutorial.is_visible() else head

    assert reader["y"] - (preceding["y"] + preceding["height"]) <= 18, {
        "viewport": (width, height), "preceding": preceding, "reader": reader
    }
    assert current["y"] - reader["y"] <= 10
    assert reader["height"] >= 120, reader
    assert current["y"] + current["height"] <= dock["y"]
    # Narrative turns now use the full reader as the touch target. The hint
    # stays inside the compact dock instead of reserving space for a button.
    assert tap_hint["x"] >= dock["x"]
    assert tap_hint["x"] + tap_hint["width"] <= dock["x"] + dock["width"] + 1
    assert page.locator(".story-tap-hint").inner_text() == "화면을 탭해 다음 문장"
    assert page.locator(".story-next").count() == 0
    assert page.locator("[data-event-progress]").inner_text() == "1 / 4"
    report_start = box(page, ".event-field-report")
    scene_start = box(page, ".event-scene-frame")
    sheet_start = box(page, "#ev-sheet")
    for expected in (2, 3, 4):
        page.locator(".story-reader").click()
        page.wait_for_timeout(90)
        assert page.locator("[data-event-progress]").inner_text() == f"{expected} / 4"
        report = box(page, ".event-field-report")
        scene = box(page, ".event-scene-frame")
        sheet = box(page, "#ev-sheet")
        assert abs(report["width"] - report_start["width"]) <= 1
        assert abs(report["x"] - report_start["x"]) <= 1
        assert abs(report["y"] - report_start["y"]) <= 1
        assert abs(scene["x"] - scene_start["x"]) <= 1
        assert abs(scene["y"] - scene_start["y"]) <= 1
        assert abs(scene["width"] - scene_start["width"]) <= 1
        assert abs(scene["height"] - scene_start["height"]) <= 1
        assert abs(sheet["width"] - sheet_start["width"]) <= 1
        assert abs(sheet["height"] - sheet_start["height"]) <= 1
    assert page.locator("#ev-sheet").get_attribute("data-story-step") == "decision"
    page.locator(".event-choice-dock .choice[data-i]:not([disabled])").first.click()
    page.wait_for_timeout(110)
    assert page.locator("#ev-sheet").get_attribute("data-story-phase") == "outcome"
    assert page.locator("#ev-sheet").get_attribute("data-story-step") == "result"
    outcome_report = box(page, ".event-field-report")
    outcome_scene = box(page, ".event-scene-frame")
    outcome_sheet = box(page, "#ev-sheet")
    assert abs(outcome_report["width"] - report_start["width"]) <= 1
    assert abs(outcome_report["x"] - report_start["x"]) <= 1
    assert abs(outcome_report["y"] - report_start["y"]) <= 1
    assert abs(outcome_scene["x"] - scene_start["x"]) <= 1
    assert abs(outcome_scene["y"] - scene_start["y"]) <= 1
    assert abs(outcome_scene["width"] - scene_start["width"]) <= 1
    assert abs(outcome_scene["height"] - scene_start["height"]) <= 1
    assert abs(outcome_sheet["width"] - sheet_start["width"]) <= 1
    assert abs(outcome_sheet["height"] - sheet_start["height"]) <= 1
    assert not errors, errors
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
    browser.close()


with sync_playwright() as playwright:
    for viewport in ((320, 578), (375, 667), (390, 844), (475, 948)):
        check_viewport(playwright, *viewport)
    print("✅ 이벤트 본문·탭 진행 · 320x578 / 375x667 / 390x844 / 475x948")
