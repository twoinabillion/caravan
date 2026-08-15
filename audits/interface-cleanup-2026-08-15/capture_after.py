#!/usr/bin/env python3
"""Capture the streamlined event and secondary interfaces."""

import json
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
    page.fill("#inp-name", "다온")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(220)
    page.evaluate("document.querySelector('#arrival-scene')?.classList.remove('on')")
    page.evaluate(
        """() => {
          S.party=['minji','parkss','leo'];
          for (const id of S.party) {
            S.comps[id].joined=true;
            S.comps[id].mood=Math.max(55,S.comps[id].mood||0);
          }
          UI.renderAll();
        }"""
    )


def shot(page, name):
    page.wait_for_timeout(160)
    page.screenshot(path=str(OUT / name))


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome")
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.add_init_script(
        "localStorage.clear(); localStorage.setItem('caravan_story_auto','0')"
    )
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    enter_game(page)

    shot(page, "00-road-after.png")
    page.evaluate("UI.showEvent(D.events.find(event => event.id === 'meet_scrapyard'))")
    shot(page, "01-event-reading-after.png")
    page.evaluate("UI.finishStory()")
    shot(page, "02-event-choice-after.png")
    page.evaluate("document.querySelector('#ev-wrap').classList.remove('on')")

    page.click("#dk-menu")
    shot(page, "03-menu-after.png")

    page.click("#menu-crew")
    shot(page, "04-crew-after.png")
    page.click("#st-x")

    page.click("#dk-menu")
    page.click("#menu-settings")
    shot(page, "05-settings-after.png")
    page.click("#st-x")

    page.click("#dk-menu")
    page.click("#dk-journal")
    shot(page, "06-journal-after.png")
    page.click("#j-x")

    page.click("#dk-menu")
    page.click("#dk-camp")
    shot(page, "07-camp-after.png")

    result = {
        "errors": errors,
        "viewport": [390, 844],
        "screens": 8,
        "eventChrome": page.evaluate(
            """() => ({
              metaRows:document.querySelectorAll('.event-meta-row').length,
              cutMarks:document.querySelectorAll('.scene-cut-mark').length,
              autoToggles:document.querySelectorAll('.story-auto-toggle').length,
              dockHeads:document.querySelectorAll('.choice-dock-head').length
            })"""
        ),
    }
    (OUT / "after-metrics.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    browser.close()
