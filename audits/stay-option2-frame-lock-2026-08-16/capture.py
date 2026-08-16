#!/usr/bin/env python3
"""Capture and verify the persistent option-2 stopped-screen frame."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
URL = (ROOT / "서울까지400km.html").as_uri()
VIEWPORTS = ((320, 578), (390, 844), (475, 948))


def enter_game(page):
    page.goto(URL)
    page.click("#bt-new")
    if page.locator("#scr-mode").is_visible():
        page.click("#mode-on")
    page.fill("#inp-name", "프레임 검수")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(180)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")


def geometry(page):
    return page.evaluate(
        """() => {
          const box = selector => {
            const node = document.querySelector(selector);
            const rect = node.getBoundingClientRect();
            return {x:rect.x,y:rect.y,w:rect.width,h:rect.height,
              right:rect.right,bottom:rect.bottom};
          };
          const game=document.querySelector('#scr-game');
          const ledger=document.querySelector('.journey-local-panel');
          return {
            game:box('#scr-game'), stage:box('#stage'), dock:box('#dock'),
            console:box('.journey-mode-console'), rocker:box('.journey-rocker'),
            ledger:ledger?box('.journey-local-panel'):null,
            frame:getComputedStyle(game).borderImageSource,
            mode:document.documentElement.dataset.journeyMode,
            overflow:document.documentElement.scrollWidth>innerWidth+1
          };
        }"""
    )


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome")
    for width, height in VIEWPORTS:
        page = browser.new_page(viewport={"width": width, "height": height})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.add_init_script(
            "localStorage.clear(); localStorage.setItem('caravan_story_auto','0')"
        )
        enter_game(page)
        page.wait_for_timeout(320)
        route = geometry(page)
        page.screenshot(path=OUT / f"route-{width}x{height}.png")

        page.click('[data-journey-mode="local"]')
        page.wait_for_timeout(420)
        local = geometry(page)
        page.screenshot(path=OUT / f"stay-{width}x{height}.png")
        page.locator(".journey-mode-console").screenshot(
            path=OUT / f"stay-console-{width}x{height}.png"
        )

        page.click('[data-journey-mode="route"]')
        page.wait_for_timeout(420)
        returned = geometry(page)
        page.screenshot(path=OUT / f"route-return-{width}x{height}.png")

        assert route["mode"] == "route" and local["mode"] == "local", (route, local)
        assert route["frame"] != "none" and local["frame"] != "none", (route, local)
        assert not route["overflow"] and not local["overflow"], (route, local)
        assert abs(route["game"]["x"] - local["game"]["x"]) <= 0.5, (route, local)
        assert abs(route["game"]["w"] - local["game"]["w"]) <= 0.5, (route, local)
        assert abs(route["dock"]["x"] - local["dock"]["x"]) <= 0.5, (route, local)
        assert abs(route["dock"]["w"] - local["dock"]["w"]) <= 0.5, (route, local)
        assert abs(route["dock"]["y"] - local["dock"]["y"]) <= 0.5, (route, local)
        assert local["ledger"] and abs(local["ledger"]["y"] - local["console"]["y"]) <= 0.5, local
        assert local["dock"]["y"] - local["console"]["bottom"] <= 6, local
        assert abs(route["stage"]["h"] - returned["stage"]["h"]) <= 2, (route, returned)
        assert not errors, errors
        print(f"✅ {width}×{height}: 공통 외곽 프레임·고정 키덱·2번 기록철 전환")
        page.close()

    comparison = browser.new_page(viewport={"width": 1040, "height": 1500})
    comparison.goto((OUT / "comparison.html").as_uri())
    comparison.wait_for_timeout(180)
    comparison.screenshot(path=OUT / "comparison-reference-vs-final.png", full_page=True)
    comparison.close()
    browser.close()

print(f"captured {OUT}")
