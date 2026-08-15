#!/usr/bin/env python3
"""Capture the first beat of the generation-form story at the user's viewport."""
import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
URL = (ROOT / "서울까지400km.html").as_uri()
OUT = Path(__file__).resolve().parent


def enter_game(page):
    page.goto(URL)
    page.click("#bt-new")
    if page.locator("#scr-mode").is_visible():
        page.click("#mode-on")
    page.fill("#inp-name", "다온")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(220)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("label")
    parser.add_argument("--width", type=int, default=475)
    parser.add_argument("--height", type=int, default=948)
    args = parser.parse_args()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        page = browser.new_page(
            viewport={"width": args.width, "height": args.height},
            device_scale_factor=1,
        )
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on(
            "console",
            lambda message: errors.append(message.text)
            if message.type == "error" and "Failed to load resource" not in message.text
            else None,
        )
        page.add_init_script(
            "localStorage.clear(); localStorage.setItem('caravan_story_auto','0')"
        )
        enter_game(page)
        page.evaluate(
            """() => {
              S.stopover = null;
              S.driving = {from:'busan',to:'yangsan',dist:24,gone:14,
                road:'high',slots:[],si:0};
              UI.showEvent(D.events.find(event => event.id === 'story_generation_form'));
            }"""
        )
        page.wait_for_timeout(220)
        path = OUT / f"{args.label}-{args.width}x{args.height}.png"
        page.screenshot(path=str(path))
        metrics = page.evaluate(
            """() => {
              const pick = selector => {
                const node = document.querySelector(selector);
                if (!node) return null;
                const r = node.getBoundingClientRect();
                return {x:r.x,y:r.y,width:r.width,height:r.height,
                  right:r.right,bottom:r.bottom,scrollHeight:node.scrollHeight,
                  clientHeight:node.clientHeight};
              };
              return {
                viewport:{width:innerWidth,height:innerHeight},
                sheet:pick('#ev-sheet'),scene:pick('.event-scene-frame'),
                head:pick('.event-head'),reader:pick('.story-reader'),
                narration:pick('.story-reader [data-story-entry]:last-child'),
                dock:pick('.event-choice-dock'),
                next:pick('.story-next'),toggle:pick('.story-auto-toggle'),
                overflow:document.documentElement.scrollWidth > innerWidth + 1
              };
            }"""
        )
        browser.close()
        if errors:
            raise RuntimeError(" | ".join(errors))
        print(json.dumps(metrics, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
