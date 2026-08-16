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
    next_button = box(page, ".story-next")
    button_face = page.locator(".story-next").evaluate(
        """node => ({
          backgroundImage:getComputedStyle(node).backgroundImage,
          faceImage:getComputedStyle(node,'::before').backgroundImage,
          faceSize:getComputedStyle(node,'::before').backgroundSize,
          faceDisplay:getComputedStyle(node,'::before').display
        })"""
    )

    assert reader["y"] - (head["y"] + head["height"]) <= 12, {
        "viewport": (width, height), "head": head, "reader": reader
    }
    assert current["y"] - reader["y"] <= 10
    assert reader["height"] <= 150, reader
    assert current["y"] + current["height"] <= dock["y"]
    # Option 2 uses the approved low, rectangular field-recorder key instead
    # of the former square nav-button face.
    assert 44 <= next_button["height"] <= 62, next_button
    assert 118 <= next_button["width"] <= 166, next_button
    assert 2.5 <= next_button["width"] / next_button["height"] <= 3.1, next_button
    assert next_button["x"] >= dock["x"] + 13
    assert next_button["x"] + next_button["width"] <= dock["x"] + dock["width"] - 13
    assert "data:image/webp" in button_face["backgroundImage"]
    assert button_face["faceDisplay"] == "none"
    assert page.locator(".story-next strong").inner_text() == "계속"
    assert box(page, ".story-next strong")["height"] <= 18
    assert page.locator(".story-next .req").count() == 0
    assert page.locator("[data-event-progress]").inner_text() == "1 / 4"
    report_start = box(page, ".event-field-report")
    sheet_start = box(page, "#ev-sheet")
    for expected in (2, 3, 4):
        page.click(".story-next")
        page.wait_for_timeout(90)
        assert page.locator("[data-event-progress]").inner_text() == f"{expected} / 4"
        report = box(page, ".event-field-report")
        sheet = box(page, "#ev-sheet")
        assert abs(report["width"] - report_start["width"]) <= 1
        assert abs(report["height"] - report_start["height"]) <= 1
        assert abs(sheet["width"] - sheet_start["width"]) <= 1
        assert abs(sheet["height"] - sheet_start["height"]) <= 1
    assert page.locator("#ev-sheet").get_attribute("data-story-step") == "decision"
    page.locator(".event-choice-dock .choice[data-i]:not([disabled])").first.click()
    page.wait_for_timeout(110)
    assert page.locator("#ev-sheet").get_attribute("data-story-phase") == "outcome"
    assert page.locator("#ev-sheet").get_attribute("data-story-step") == "result"
    outcome_report = box(page, ".event-field-report")
    outcome_sheet = box(page, "#ev-sheet")
    assert abs(outcome_report["width"] - report_start["width"]) <= 1
    assert abs(outcome_report["height"] - report_start["height"]) <= 1
    assert abs(outcome_sheet["width"] - sheet_start["width"]) <= 1
    assert abs(outcome_sheet["height"] - sheet_start["height"]) <= 1
    assert not errors, errors
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
    browser.close()


with sync_playwright() as playwright:
    for viewport in ((320, 578), (375, 667), (390, 844), (475, 948)):
        check_viewport(playwright, *viewport)
    print("✅ 이벤트 본문·계속 버튼 · 320x578 / 375x667 / 390x844 / 475x948")
