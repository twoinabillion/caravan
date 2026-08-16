#!/usr/bin/env python3
"""Capture route/stay geometry and every visual state of one story event."""
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
    page.fill("#inp-name", "연속 화면 검수")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(180)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")


def rect(page, selector, required=True):
    locator = page.locator(selector)
    if not locator.count():
        if required:
            raise AssertionError(f"missing {selector}")
        return None
    value = locator.bounding_box()
    if not value:
        if required:
            raise AssertionError(f"missing bounds for {selector}")
        return None
    return {key: round(value[key], 2) for key in ("x", "y", "width", "height")}


def near(a, b, tolerance=1):
    return all(abs(a[key] - b[key]) <= tolerance for key in ("x", "y", "width", "height"))


def same_size(a, b, tolerance=1):
    return all(abs(a[key] - b[key]) <= tolerance for key in ("width", "height"))


def event_state(page):
    return {
        "sheet": rect(page, "#ev-sheet"),
        "scroll": rect(page, ".event-scroll"),
        "scene": rect(page, ".event-scene-frame"),
        "report": rect(page, ".event-field-report", required=False),
        "dock": rect(page, ".event-choice-dock"),
        "phase": page.locator("#ev-sheet").get_attribute("data-story-phase"),
        "step": page.locator("#ev-sheet").get_attribute("data-story-step"),
        "overflow": page.evaluate("document.documentElement.scrollWidth > innerWidth + 1"),
    }


def capture(prefix, verify):
    evidence = {}
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

            route = {
                "console": rect(page, ".journey-mode-console"),
                "shell": rect(page, ".route-console"),
                "rocker": rect(page, ".journey-rocker"),
                "stage": rect(page, "#stage"),
                "dock": rect(page, "#dock"),
                "scroll": page.locator("#panel").evaluate("node => node.scrollTop"),
            }
            page.screenshot(path=OUT / f"{prefix}-route-{width}x{height}.png")

            page.click('[data-journey-mode="local"]')
            page.wait_for_timeout(360)
            stay = {
                "console": rect(page, ".journey-mode-console"),
                "shell": rect(page, ".route-console"),
                "rocker": rect(page, ".journey-rocker"),
                "stage": rect(page, "#stage"),
                "dock": rect(page, "#dock"),
                "scroll": page.locator("#panel").evaluate("node => node.scrollTop"),
                "rows": page.locator(".journey-local-screen .stop-action-trigger").evaluate_all(
                    """rows => rows.slice(0,4).map(row => {
                      const r=row.getBoundingClientRect();
                      const description=row.querySelector('.stop-action-description');
                      const title=row.querySelector('.stop-action-copy>b');
                      const icon=row.querySelector('.stop-action-icon').getBoundingClientRect();
                      return {height:r.height, right:r.right,
                        description:getComputedStyle(description).display,
                        descriptionText:description.textContent.trim(),
                        descriptionSize:parseFloat(getComputedStyle(description).fontSize),
                        titleSize:parseFloat(getComputedStyle(title).fontSize),
                        iconSize:Math.max(icon.width,icon.height)};
                    })"""
                ),
            }
            page.screenshot(path=OUT / f"{prefix}-stay-{width}x{height}.png")

            page.evaluate(
                "UI.showEvent(D.events.find(event => event.id === 'story_generation_form'))"
            )
            # Wait for the sheet's entrance transition before treating its
            # position as the fixed baseline for every subsequent story step.
            page.wait_for_timeout(360)
            states = []
            for index in range(4):
                states.append(event_state(page))
                page.screenshot(path=OUT / f"{prefix}-event-{index + 1}-{width}x{height}.png")
                if page.locator(".story-next").count():
                    page.click(".story-next")
                    page.wait_for_timeout(100)

            decision = event_state(page)
            page.screenshot(path=OUT / f"{prefix}-event-decision-{width}x{height}.png")
            choice = page.locator(".event-choice-dock .choice[data-i]:not([disabled])").first
            assert choice.count(), "event has no enabled decision"
            choice.click()
            page.wait_for_timeout(160)
            outcome = event_state(page)
            page.screenshot(path=OUT / f"{prefix}-event-outcome-{width}x{height}.png")

            evidence[f"{width}x{height}"] = {
                "route": route,
                "stay": stay,
                "beats": states,
                "decision": decision,
                "outcome": outcome,
                "errors": errors,
            }

            if verify:
                assert near(route["console"], stay["console"]), (route, stay)
                assert near(route["shell"], stay["shell"]), (route, stay)
                assert near(route["rocker"], stay["rocker"]), (route, stay)
                assert near(route["stage"], stay["stage"], 2), (route, stay)
                assert near(route["dock"], stay["dock"]), (route, stay)
                assert abs(route["scroll"] - stay["scroll"]) <= 0.5, (route, stay)
                assert all(row["height"] >= 44 for row in stay["rows"]), stay
                assert all(row["description"] != "none" and row["descriptionText"] for row in stay["rows"]), stay
                assert all(row["titleSize"] <= 16 and row["descriptionSize"] <= 12 for row in stay["rows"]), stay
                assert all(row["iconSize"] <= 50 for row in stay["rows"]), stay

                event_states = states + [decision, outcome]
                assert all(near(states[0]["sheet"], state["sheet"]) for state in event_states), event_states
                assert all(state["report"] and same_size(states[0]["report"], state["report"], 1.5) for state in event_states), event_states
                assert all(not state["overflow"] for state in event_states), event_states
                assert outcome["phase"] == "outcome" and outcome["step"] == "result", outcome
                assert not errors, errors
            page.close()
        if prefix == "after":
            board = browser.new_page(viewport={"width": 1380, "height": 1100})
            board.goto((OUT / "comparison.html").as_uri())
            board.wait_for_timeout(260)
            board.screenshot(path=OUT / "comparison-final.png", full_page=True)
            board.close()
        browser.close()

    (OUT / f"{prefix}-geometry.json").write_text(
        dumps(evidence, ensure_ascii=False, indent=2), encoding="utf-8"
    )


if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument("prefix", choices=("before", "after"))
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    capture(args.prefix, args.verify)
    print(f"captured {args.prefix} evidence in {OUT}")
