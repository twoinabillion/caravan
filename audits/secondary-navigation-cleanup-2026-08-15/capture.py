#!/usr/bin/env python3
"""Capture the cleaned primary-tool navigation and Bag alignment."""

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


def new_page(browser, width, height):
    page = browser.new_page(viewport={"width": width, "height": height})
    page.add_init_script(
        "localStorage.clear(); localStorage.setItem('caravan_story_auto','0')"
    )
    enter_game(page)
    return page


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome")
    errors = []

    page = new_page(browser, 390, 844)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.click("#dk-objectives")
    page.wait_for_timeout(160)
    page.screenshot(path=str(OUT / "01-goal-clean.png"))
    goal = page.evaluate(
        """() => ({
          crossLinks: document.querySelectorAll('.prop-edge-tabs, .folio-location[data-road-tool]').length,
          roadReturn: document.querySelectorAll('[data-road-tool="road"]').length,
          locationTag: document.querySelector('.folio-location')?.tagName,
          locationText: document.querySelector('.folio-location')?.textContent.trim()
        })"""
    )

    page.click("#dk-map")
    page.wait_for_timeout(160)
    page.screenshot(path=str(OUT / "02-map-clean.png"))
    map_state = page.evaluate(
        """() => ({
          crossLinks: document.querySelectorAll('#ovl-map .map-tool-tabs, #ovl-map [data-road-tool]').length,
          closeButton: document.querySelector('#map-x')?.textContent.trim()
        })"""
    )

    page.click("#dk-status")
    page.click('[data-bag-item="의약품"]')
    page.wait_for_timeout(160)
    page.screenshot(path=str(OUT / "03-bag-clean.png"))
    bag = page.evaluate(
        """() => {
          const detail = document.querySelector('.bag-detail-copy').getBoundingClientRect();
          const state = document.querySelector('.bag-detail-state').getBoundingClientRect();
          return {
            crossLinks: document.querySelectorAll('#ovl-status [data-road-tool]').length,
            stateText: document.querySelector('.bag-detail-state')?.textContent.trim(),
            stateInsideCopy: state.x > detail.x && state.right <= detail.right + 1,
            horizontalOverflow: document.documentElement.scrollWidth > innerWidth
          };
        }"""
    )
    page.close()

    short = new_page(browser, 320, 578)
    short.click("#dk-status")
    short.click('[data-bag-item="의약품"]')
    short.wait_for_timeout(160)
    short.screenshot(path=str(OUT / "04-bag-short-clean.png"))
    short_state = short.evaluate(
        """() => ({
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
          pocketNameSize: getComputedStyle(document.querySelector('.bag-pocket-name')).fontSize,
          leadingPossessionLabelVisible: getComputedStyle(document.querySelector('.bag-pocket-count>small')).display !== 'none',
          gapStack: document.elementsFromPoint(innerWidth / 2, innerHeight - 84).map(node => ({
            tag: node.tagName, id: node.id, className: String(node.className || '')
          })).slice(0, 8)
        })"""
    )

    result = {
        "goal": goal,
        "map": map_state,
        "bag": bag,
        "shortBag": short_state,
        "errors": errors,
    }
    (OUT / "metrics.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    browser.close()
