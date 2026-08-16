#!/usr/bin/env python3
"""Capture and verify that route/stay use one physical console and screen."""
from argparse import ArgumentParser
from json import dumps
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
    page.fill("#inp-name", "틀 전환 검수")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(250)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")


def rect(page, selector):
    box = page.locator(selector).bounding_box()
    if not box:
        raise AssertionError(f"missing bounds for {selector}")
    return {key: round(box[key], 2) for key in ("x", "y", "width", "height")}


def near(a, b, tolerance=1):
    return all(abs(a[key] - b[key]) <= tolerance for key in ("x", "y", "width", "height"))


def snapshot(page, prefix, width, height, mode):
    screen_selector = ".route-console-screen" if mode == "route" else ".journey-local-screen"
    data = {
        "console": rect(page, ".journey-mode-console"),
        "shell": rect(page, ".route-console"),
        "screen": rect(page, screen_selector),
        "rocker": rect(page, ".journey-rocker"),
        "stage": rect(page, "#stage"),
        "dock": rect(page, "#dock"),
        "panelScroll": page.locator("#panel").evaluate("node => node.scrollTop"),
        "documentOverflow": page.evaluate("document.documentElement.scrollWidth > innerWidth + 1"),
    }
    if mode == "stay":
        data["rows"] = page.locator(".journey-local-screen .stop-action-trigger").evaluate_all(
            """rows => rows.slice(0, 4).map(row => {
              const r = row.getBoundingClientRect();
              const title = row.querySelector('.stop-action-copy>b');
              const icon = row.querySelector('.stop-action-icon').getBoundingClientRect();
              return {x:r.x, y:r.y, width:r.width, height:r.height,
                titleSize:parseFloat(getComputedStyle(title).fontSize),
                iconSize:Math.max(icon.width, icon.height)};
            })"""
        )
    page.screenshot(path=OUT / f"{prefix}-{mode}-{width}x{height}.png")
    return data


def capture(prefix, verify):
    evidence = {}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        for width, height in VIEWPORTS:
            page = browser.new_page(viewport={"width": width, "height": height})
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.add_init_script("localStorage.clear()")
            enter_game(page)

            route = snapshot(page, prefix, width, height, "route")
            page.click('[data-journey-mode="local"]')
            page.wait_for_timeout(280)
            stay = snapshot(page, prefix, width, height, "stay")
            evidence[f"{width}x{height}"] = {"route": route, "stay": stay, "errors": errors}

            if verify:
                assert near(route["console"], stay["console"]), (route, stay)
                assert near(route["shell"], stay["shell"]), (route, stay)
                assert near(route["screen"], stay["screen"]), (route, stay)
                assert near(route["rocker"], stay["rocker"]), (route, stay)
                assert near(route["stage"], stay["stage"], 2), (route, stay)
                assert near(route["dock"], stay["dock"]), (route, stay)
                assert route["panelScroll"] == stay["panelScroll"] == 0
                assert not route["documentOverflow"] and not stay["documentOverflow"]
                assert not errors, errors
                assert len(stay["rows"]) == 4
                assert all(row["height"] >= 44 for row in stay["rows"])
        browser.close()
    (OUT / f"{prefix}-geometry.json").write_text(dumps(evidence, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument("prefix", choices=("before", "after"))
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    capture(args.prefix, args.verify)
