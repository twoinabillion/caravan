#!/usr/bin/env python3
"""Capture the current stay-action and event-dialogue surfaces for design review."""
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


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome")
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    page.add_init_script("localStorage.clear(); localStorage.setItem('caravan_story_auto','0')")
    enter_game(page)

    page.screenshot(path=OUT / "00-route-quality-reference-390x844.png")
    page.click('[data-journey-mode="local"]')
    page.wait_for_timeout(140)
    page.screenshot(path=OUT / "01-stay-actions-390x844.png")

    page.evaluate("UI.showEvent(D.events.find(event => event.id === 'lib_meet'))")
    page.wait_for_timeout(160)
    page.screenshot(path=OUT / "02-event-opening-390x844.png")
    for _ in range(3):
        if not page.locator(".story-next").count():
            break
        page.click(".story-next")
        page.wait_for_timeout(90)
        if page.locator(".chat-bubble").count():
            break
    page.screenshot(path=OUT / "03-event-dialogue-390x844.png")
    browser.close()

print(f"captured {OUT}")
