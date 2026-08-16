#!/usr/bin/env python3
"""Capture stay rows and story choices before/after visual polish."""
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
    page.fill("#inp-name", "선택지 검수")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(220)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")


def box(page, selector):
    value = page.locator(selector).bounding_box()
    if not value:
        raise AssertionError(f"missing {selector}")
    return {key: round(value[key], 2) for key in ("x", "y", "width", "height")}


def capture(prefix, verify):
    evidence = {}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        for width, height in VIEWPORTS:
            page = browser.new_page(viewport={"width": width, "height": height})
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.add_init_script("localStorage.clear(); localStorage.setItem('caravan_story_auto','0')")
            enter_game(page)
            page.click('[data-journey-mode="local"]')
            page.wait_for_timeout(220)
            stay_rows = page.locator(".journey-local-screen .stop-action-trigger").evaluate_all(
                """rows => rows.slice(0,4).map(row => {
                  const rect=row.getBoundingClientRect();
                  const cta=row.querySelector('.stop-action-cta');
                  return {height:rect.height, cta:cta.textContent.trim(),
                    ctaWidth:cta.getBoundingClientRect().width};
                })"""
            )
            page.screenshot(path=OUT / f"{prefix}-stay-{width}x{height}.png")

            page.evaluate("UI.showEvent(D.events.find(event => event.id === 'story_generation_form'))")
            page.wait_for_timeout(320)
            while page.locator(".story-next").count():
                page.click(".story-next")
                page.wait_for_timeout(70)
            choices = page.locator(".event-choice-dock .choice[data-i]")
            choice_data = choices.evaluate_all(
                """nodes => nodes.map(node => {
                  const rect=node.getBoundingClientRect();
                  const number=node.querySelector('.choice-index');
                  const title=node.querySelector('.choice-title');
                  return {width:rect.width,height:rect.height,disabled:node.disabled,
                    label:node.textContent.trim(),number:number.textContent.trim(),
                    numberSize:parseFloat(getComputedStyle(number).fontSize),
                    titleSize:parseFloat(getComputedStyle(title).fontSize)};
                })"""
            )
            page.screenshot(path=OUT / f"{prefix}-choices-{width}x{height}.png")
            if choices.count():
                choices.first.hover()
                page.screenshot(path=OUT / f"{prefix}-choices-hover-{width}x{height}.png")

            evidence[f"{width}x{height}"] = {
                "stayScreen": box(page, ".journey-local-screen"),
                "stayRows": stay_rows,
                "eventSheet": box(page, "#ev-sheet"),
                "choices": choice_data,
                "overflow": page.evaluate("document.documentElement.scrollWidth > innerWidth + 1"),
                "errors": errors,
            }
            if verify:
                assert len(stay_rows) == 4
                assert all(row["height"] >= 44 for row in stay_rows), stay_rows
                assert len(choice_data) >= 2
                assert all(choice["height"] >= 44 for choice in choice_data), choice_data
                assert not evidence[f"{width}x{height}"]["overflow"]
                assert not errors, errors
            page.close()
        browser.close()
    (OUT / f"{prefix}-geometry.json").write_text(dumps(evidence, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument("prefix", choices=("before", "after"))
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    capture(args.prefix, args.verify)
