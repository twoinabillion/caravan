#!/usr/bin/env python3
"""Capture the current Caravan driving cadence for the trailer alignment audit."""

from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent / "motion"
GAME = (ROOT / "서울까지400km.html").as_uri()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        context = browser.new_context(
            viewport={"width": 480, "height": 860},
            record_video_dir=str(OUT),
            record_video_size={"width": 480, "height": 860},
        )
        page = context.new_page()
        page.goto(GAME)
        page.wait_for_timeout(500)
        page.click("#bt-new")
        page.click("#mode-on")
        page.fill("#inp-name", "다온")
        page.click("#bt-name")
        intro_beats = page.evaluate("D.intro.reduce((total, part) => total + part.beats.length, 0)")
        for _ in range(intro_beats):
            page.click("#scr-intro")
            page.wait_for_timeout(45)
        page.evaluate(
            """() => {
              S.at='busan'; S.min=19*60; S.wx='clear';
              S.party=['minji','parkss','leo'];
              S.up={bench:true};
              S.driving={from:'busan',to:'ulsan',dist:55,gone:2,road:'high',wx:'clear',slots:[],si:0};
              UI.renderAll();
            }"""
        )
        page.wait_for_timeout(500)
        for index in range(5):
            page.screenshot(path=str(OUT / f"{index + 1:02d}-driving.png"))
            page.wait_for_timeout(750)
        video = page.video
        context.close()
        source = Path(video.path())
        target = OUT / "van-driving.webm"
        if target.exists():
            target.unlink()
        source.rename(target)
        browser.close()
    print(target)


if __name__ == "__main__":
    main()
