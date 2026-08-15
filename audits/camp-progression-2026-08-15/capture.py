#!/usr/bin/env python3
"""Capture the current camp hub at early and fully expanded states."""

import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
URL = (ROOT / "서울까지400km.html").as_uri()


def enter(page):
    page.goto(URL)
    page.click("#bt-new")
    if page.locator("#scr-mode").is_visible():
        page.click("#mode-on")
    page.fill("#inp-name", "다온")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(180)
    page.evaluate("document.querySelector('#arrival-scene')?.classList.remove('on')")


def capture(page, name):
    page.wait_for_timeout(160)
    page.screenshot(path=str(OUT / name))


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome")
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.add_init_script("localStorage.clear()")
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    enter(page)

    page.evaluate(
        """() => {
          S.party=['minji'];
          S.comps.minji.joined=true;
          S.up={};
          S.min=20*60;
          UI.renderAll();
        }"""
    )
    page.click("#dk-menu")
    page.click("#dk-camp")
    capture(page, "01-early-camp.png")
    page.click("#camp-x")

    page.evaluate(
        """() => {
          S.party=['minji','parkss','kangwoo','leo','jaeyi','eunsu'];
          for (const id of S.party) S.comps[id].joined=true;
          for (const id of ['bench','cabin','bunk','jumpseat','awning','stove','kitchen','solar']) S.up[id]=true;
          S.min=21*60;
          UI.renderAll();
        }"""
    )
    page.click("#dk-menu")
    page.click("#dk-camp")
    capture(page, "02-full-crew-upgraded-camp.png")
    page.locator("#camp-rest").scroll_into_view_if_needed()
    capture(page, "03-full-crew-camp-actions.png")

    metrics = page.evaluate(
        """() => ({
          campImages:document.querySelectorAll('#camp-body img,#camp-body canvas,#camp-body video').length,
          portraitImages:document.querySelectorAll('#camp-body .pimg,#camp-body .npc-pimg').length,
          partyButtons:document.querySelectorAll('[data-camp-talk]').length,
          upgradeLabels:document.querySelectorAll('.camp-interior i').length,
          fireCopy:document.querySelector('#camp-body').textContent.includes('불빛 아래'),
          bodyOverflow:document.querySelector('#camp-body').scrollHeight>document.querySelector('#camp-body').clientHeight
        })"""
    )
    (OUT / "metrics.json").write_text(
        json.dumps({"errors": errors, **metrics}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps({"errors": errors, **metrics}, ensure_ascii=False, indent=2))
    browser.close()
