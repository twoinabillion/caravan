#!/usr/bin/env python3
"""Capture the live bag and story terminal at a representative phone size."""
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
    page.fill("#inp-name", "화면 검수")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(180)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome")
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    page.add_init_script("localStorage.clear(); localStorage.setItem('caravan_story_auto','0')")
    enter_game(page)

    page.click("#dk-status")
    page.wait_for_timeout(120)
    page.locator("#status-prop").screenshot(path=OUT / "01-bag-parts-390x844.png")
    page.click('[data-bag-item="의약품"]')
    page.wait_for_timeout(80)
    page.locator("#status-prop").screenshot(path=OUT / "02-bag-medicine-390x844.png")

    page.click("#dk-road")
    page.evaluate(
        """() => {
          S.stopover = null;
          S.driving = {from:'busan',to:'yangsan',dist:24,gone:14,
            road:'high',slots:[],si:0};
          UI.showEvent(D.events.find(event => event.id === 'story_generation_form'));
        }"""
    )
    page.wait_for_timeout(160)
    page.locator("#ev-sheet").screenshot(path=OUT / "03-event-beat-390x844.png")
    page.evaluate("UI.finishStory()")
    page.wait_for_timeout(100)
    page.locator("#ev-sheet").screenshot(path=OUT / "04-event-choice-390x844.png")
    page.locator('.event-choice-dock .choice[data-i]').first.click()
    page.evaluate("UI.finishStory()")
    page.wait_for_timeout(100)
    page.locator("#ev-sheet").screenshot(path=OUT / "05-event-outcome-390x844.png")
    browser.close()

print(f"captured {OUT}")
