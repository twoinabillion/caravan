#!/usr/bin/env python3
"""Capture and verify that route and stay share one unchanged console shell."""
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
    page.fill("#inp-name", "동일 쉘 검수")
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
          const local=document.querySelector('.journey-local-panel');
          const shell=document.querySelector('.route-console');
          const shellStyle=getComputedStyle(shell);
          const overlay=local?getComputedStyle(local,'::after'):null;
          return {
            stage:box('#stage'), dock:box('#dock'), panel:box('#panel'),
            console:box('.journey-mode-console'), shell:box('.route-console'),
            rocker:box('.journey-rocker'), screen:box('.route-console-screen'),
            mode:document.documentElement.dataset.journeyMode,
            scrollY:window.scrollY, panelScroll:document.querySelector('#panel').scrollTop,
            overflow:document.documentElement.scrollWidth>innerWidth+1,
            shellImage:shellStyle.backgroundImage,
            overlayImage:overlay?.backgroundImage||'none'
          };
        }"""
    )


def same_box(a, b, tolerance=1):
    return all(abs(a[key] - b[key]) <= tolerance for key in ("x", "y", "w", "h"))


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
        page.wait_for_timeout(360)
        route = geometry(page)
        page.screenshot(path=OUT / f"route-{width}x{height}.png")

        page.click('[data-journey-mode="local"]')
        page.wait_for_timeout(420)
        stay = geometry(page)
        page.screenshot(path=OUT / f"stay-{width}x{height}.png")

        page.click('[data-journey-mode="route"]')
        page.wait_for_timeout(420)
        returned = geometry(page)
        page.screenshot(path=OUT / f"route-return-{width}x{height}.png")

        assert route["mode"] == "route" and stay["mode"] == "local", (route, stay)
        assert same_box(route["console"], stay["console"]), (route, stay)
        assert same_box(route["shell"], stay["shell"]), (route, stay)
        assert same_box(route["rocker"], stay["rocker"]), (route, stay)
        assert same_box(route["dock"], stay["dock"]), (route, stay)
        assert abs(route["stage"]["h"] - stay["stage"]["h"]) <= 2, (route, stay)
        assert abs(route["scrollY"] - stay["scrollY"]) <= 0.5, (route, stay)
        assert abs(route["panelScroll"] - stay["panelScroll"]) <= 0.5, (route, stay)
        assert "stay-journey-ledger" not in stay["shellImage"], stay
        assert "data:image/webp" in stay["overlayImage"], stay
        assert not route["overflow"] and not stay["overflow"], (route, stay)
        assert same_box(route["shell"], returned["shell"]), (route, returned)
        assert not errors, errors
        print(f"✅ {width}×{height}: 길·머물기 동일 쉘/높이/위치 · 스크롤 이동 없음")
        page.close()

    comparison = browser.new_page(viewport={"width": 1280, "height": 1180})
    comparison.goto((OUT / "comparison.html").as_uri())
    comparison.wait_for_timeout(180)
    comparison.screenshot(path=OUT / "comparison-route-vs-stay.png", full_page=True)
    comparison.close()
    browser.close()

print(f"captured {OUT}")
