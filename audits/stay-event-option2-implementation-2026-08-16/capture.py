#!/usr/bin/env python3
"""Capture option 2 at the two mobile widths used for alignment QA."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
URL = (ROOT / "서울까지400km.html").as_uri()


def enter_game(page):
    page.goto(URL)
    page.click("#bt-new")
    if page.locator("#scr-mode").is_visible():
        page.click("#mode-on")
    page.fill("#inp-name", "디자인 검수")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(180)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")


def capture(page, width, height):
    suffix = f"{width}x{height}"
    enter_game(page)
    page.click('[data-journey-mode="local"]')
    page.wait_for_timeout(150)
    page.screenshot(path=OUT / f"stay-{suffix}.png")

    page.evaluate("UI.showEvent(D.events.find(event => event.id === 'lib_meet'))")
    page.wait_for_timeout(160)
    page.screenshot(path=OUT / f"event-opening-{suffix}.png")
    for _ in range(3):
        if not page.locator(".story-next").count():
            break
        page.click(".story-next")
        page.wait_for_timeout(90)
        if page.locator(".chat-bubble").count():
            break
    page.screenshot(path=OUT / f"event-dialogue-{suffix}.png")
    for _ in range(16):
        if page.locator(".event-choice-dock .choice[data-i]").count():
            break
        if not page.locator(".story-next").count():
            break
        page.click(".story-next")
        page.wait_for_timeout(55)
    page.screenshot(path=OUT / f"event-decision-{suffix}.png")


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome")
    for width, height in ((390, 844), (320, 578)):
        page = browser.new_page(
            viewport={"width": width, "height": height}, device_scale_factor=1
        )
        page.add_init_script(
            "localStorage.clear(); localStorage.setItem('caravan_story_auto','0')"
        )
        capture(page, width, height)
        page.close()
    browser.close()

print(f"captured {OUT}")
