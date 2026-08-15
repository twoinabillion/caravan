#!/usr/bin/env python3
"""Capture and measure Goal/Bag alignment at representative phone sizes."""
import json
import os
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
URL = (ROOT / "서울까지400km.html").as_uri()
OUT = Path(__file__).resolve().parent
PHASE = os.environ.get("CARAVAN_CAPTURE_PHASE", "before")


def enter_game(page):
    page.goto(URL)
    page.click("#bt-new")
    if page.locator("#scr-mode").is_visible():
        page.click("#mode-on")
    page.fill("#inp-name", "다온")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(240)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")


def rects(page, selectors):
    return page.evaluate(
        """selectors => Object.fromEntries(selectors.map(selector => {
          const nodes = [...document.querySelectorAll(selector)];
          return [selector, nodes.map(node => {
            const r = node.getBoundingClientRect();
            return {
              x: Math.round(r.x * 10) / 10,
              y: Math.round(r.y * 10) / 10,
              width: Math.round(r.width * 10) / 10,
              height: Math.round(r.height * 10) / 10
            };
          })];
        }))""",
        selectors,
    )


def capture(playwright, width, height):
    browser = playwright.chromium.launch(
        channel=os.environ.get("CARAVAN_BROWSER_CHANNEL") or None
    )
    page = browser.new_page(
        viewport={"width": width, "height": height}, device_scale_factor=1
    )
    errors = []
    page.on(
        "console",
        lambda msg: errors.append(msg.text)
        if msg.type == "error" and "Failed to load resource" not in msg.text
        else None,
    )
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.add_init_script(
        "localStorage.clear(); localStorage.setItem('caravan_story_auto','0')"
    )
    enter_game(page)

    prefix = f"{width}x{height}"
    page.click("#dk-objectives")
    page.wait_for_timeout(180)
    page.screenshot(path=str(OUT / f"{PHASE}-goal-{prefix}.png"))
    goal = rects(
        page,
        [
            ".folio-live-content",
            ".folio-title-row",
            ".folio-live-content>h3",
            ".folio-location",
            ".folio-progress",
            ".folio-clue",
            ".folio-support",
            ".folio-road-button",
        ],
    )

    page.click("#dk-status")
    page.wait_for_timeout(180)
    page.screenshot(path=str(OUT / f"{PHASE}-bag-{prefix}.png"))
    bag = rects(
        page,
        [
            ".bag-title-row",
            ".bag-critical",
            ".bag-vehicle",
            ".bag-pockets",
            ".bag-pocket",
            ".bag-pocket-name",
            ".bag-pocket-count",
            ".bag-detail",
            ".bag-detail-copy",
            ".bag-detail-heading",
            ".bag-detail button",
        ],
    )
    page.click('[data-bag-item="의약품"]')
    page.wait_for_timeout(120)
    page.screenshot(path=str(OUT / f"{PHASE}-bag-selected-{prefix}.png"))

    if errors:
        raise SystemExit(f"browser errors: {errors}")
    browser.close()
    return {"viewport": [width, height], "goal": goal, "bag": bag}


with sync_playwright() as playwright:
    measurements = [
        capture(playwright, 390, 844),
        capture(playwright, 360, 700),
    ]
    print(json.dumps(measurements, ensure_ascii=False, indent=2))
