#!/usr/bin/env python3
"""Capture fresh Bag states for a focused visual/UX audit."""

import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
URL = (ROOT / "서울까지400km.html").as_uri()


def enter_game(page):
    page.goto(URL, wait_until="load")
    page.click("#bt-new")
    if page.locator("#scr-mode").is_visible():
        page.click("#mode-on")
    page.fill("#inp-name", "다온")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(250)
    page.evaluate(
        "document.querySelector('#arrival-scene')?.classList.remove('on')"
    )
    page.click("#dk-status")
    page.wait_for_timeout(250)


def measure(page):
    return page.evaluate(
        """() => {
          const one = (selector) => {
            const node = document.querySelector(selector);
            if (!node) return null;
            const r = node.getBoundingClientRect();
            return {
              x: +r.x.toFixed(1), y: +r.y.toFixed(1),
              width: +r.width.toFixed(1), height: +r.height.toFixed(1),
              right: +r.right.toFixed(1), bottom: +r.bottom.toFixed(1)
            };
          };
          const many = (selector) => [...document.querySelectorAll(selector)].map(node => {
            const r = node.getBoundingClientRect();
            return {
              text: node.textContent.trim().replace(/\\s+/g, ' '),
              x: +r.x.toFixed(1), y: +r.y.toFixed(1),
              width: +r.width.toFixed(1), height: +r.height.toFixed(1),
              centerX: +(r.x + r.width / 2).toFixed(1),
              centerY: +(r.y + r.height / 2).toFixed(1)
            };
          });
          const body = document.body.getBoundingClientRect();
          return {
            viewport: {width: innerWidth, height: innerHeight},
            scroll: {
              bodyWidth: +body.width.toFixed(1),
              documentWidth: document.documentElement.scrollWidth,
              documentHeight: document.documentElement.scrollHeight,
              horizontalOverflow: document.documentElement.scrollWidth > innerWidth
            },
            prop: one('.bag-prop'),
            title: one('.bag-title-row'),
            resources: one('.bag-critical'),
            vehicle: one('.bag-vehicle'),
            pockets: one('.bag-pockets'),
            pocketButtons: many('.bag-pocket'),
            pocketNames: many('.bag-pocket-name'),
            pocketIcons: many('.bag-pocket .ico'),
            pocketCounts: many('.bag-pocket-count'),
            detail: one('.bag-detail'),
            detailIcon: one('.bag-detail > .ico'),
            detailCopy: one('.bag-detail-copy'),
            detailButton: one('.bag-detail button'),
            selected: document.querySelector('.bag-pocket.selected')?.dataset.bagItem || null
          };
        }"""
    )


def capture_state(playwright, width, height, selected, filename):
    browser = playwright.chromium.launch(channel="chrome")
    page = browser.new_page(
        viewport={"width": width, "height": height}, device_scale_factor=1
    )
    errors = []
    page.on(
        "console",
        lambda message: errors.append(f"console:{message.type}:{message.text}")
        if message.type == "error" and "Failed to load resource" not in message.text
        else None,
    )
    page.on("pageerror", lambda error: errors.append(f"page:{error}"))
    page.add_init_script(
        "localStorage.clear(); localStorage.setItem('caravan_story_auto','0')"
    )
    enter_game(page)
    if selected:
        page.click(f'[data-bag-item="{selected}"]')
        page.wait_for_timeout(160)
    screenshot = OUT / filename
    page.screenshot(path=str(screenshot))
    result = measure(page)
    result["file"] = screenshot.name
    result["errors"] = errors
    browser.close()
    return result


with sync_playwright() as playwright:
    results = [
        capture_state(playwright, 475, 948, None, "01-default-475x948.png"),
        capture_state(playwright, 475, 948, "의약품", "02-medicine-475x948.png"),
        capture_state(playwright, 320, 578, "의약품", "03-medicine-320x578.png"),
    ]
    metrics = OUT / "metrics.json"
    metrics.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(metrics)
