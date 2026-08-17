#!/usr/bin/env python3
"""Capture Goal/Bag at browser-constrained phone viewports and report overflow."""
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


def surface_metrics(page, selectors):
    return page.evaluate(
        """selectors => {
          const prop = document.querySelector('#status-prop').getBoundingClientRect();
          const viewport = {width: innerWidth, height: innerHeight};
          const bounds = Object.fromEntries(selectors.map(selector => {
            const node = document.querySelector(selector);
            if (!node) return [selector, null];
            const r = node.getBoundingClientRect();
            return [selector, {
              x:r.x, y:r.y, right:r.right, bottom:r.bottom,
              width:r.width, height:r.height,
              scrollWidth:node.scrollWidth, clientWidth:node.clientWidth,
              scrollHeight:node.scrollHeight, clientHeight:node.clientHeight
            }];
          }));
          const visibleButtons = [...document.querySelectorAll('#status-prop button')]
            .filter(node => node.offsetParent !== null)
            .map(node => {
              const r = node.getBoundingClientRect();
              return {text:node.textContent.trim(), x:r.x, y:r.y, right:r.right,
                bottom:r.bottom, width:r.width, height:r.height};
            });
          return {
            viewport,
            prop:{x:prop.x,y:prop.y,right:prop.right,bottom:prop.bottom,
              width:prop.width,height:prop.height,ratio:prop.width/prop.height},
            bounds,
            visibleButtons,
            horizontalOverflow:document.documentElement.scrollWidth > innerWidth + 1
          };
        }""",
        selectors,
    )


def capture(playwright, width, height, large_text=False):
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
    text_pref = "localStorage.setItem('caravan_ui_text','large');" if large_text else ""
    page.add_init_script(
        f"localStorage.clear(); localStorage.setItem('caravan_story_auto','0');{text_pref}"
    )
    enter_game(page)

    suffix = f"{width}x{height}{'-large' if large_text else ''}"
    page.click("#dk-objectives")
    page.wait_for_timeout(160)
    page.screenshot(path=str(OUT / f"{PHASE}-goal-{suffix}.png"))
    goal = surface_metrics(
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
            ".prop-edge-tabs",
        ],
    )

    page.click("#dk-status")
    page.wait_for_timeout(160)
    page.screenshot(path=str(OUT / f"{PHASE}-bag-{suffix}.png"))
    bag = surface_metrics(
        page,
        [
            ".bag-live-content",
            ".bag-title-row",
            ".bag-critical",
            ".bag-vehicle",
            ".bag-pockets",
            ".bag-detail",
            ".bag-detail-copy",
            ".bag-detail button",
            ".bag-tool-tabs",
        ],
    )

    page.click('[data-bag-item="고철"]')
    page.wait_for_timeout(100)
    page.screenshot(path=str(OUT / f"{PHASE}-bag-selected-{suffix}.png"))
    if errors:
        raise SystemExit(f"browser errors: {errors}")
    browser.close()
    return {"name": suffix, "goal": goal, "bag": bag}


with sync_playwright() as playwright:
    report = [
        capture(playwright, 320, 578),
        capture(playwright, 375, 553),
        capture(playwright, 390, 664),
        capture(playwright, 360, 700),
        capture(playwright, 390, 844),
        capture(playwright, 462, 832),
        capture(playwright, 476, 809),
        capture(playwright, 390, 664, large_text=True),
    ]
    print(json.dumps(report, ensure_ascii=False, indent=2))
