#!/usr/bin/env python3
"""도입부·동료·잠긴 선택지의 모바일 상태를 비교 캡처한다."""
import argparse
import pathlib

from playwright.sync_api import sync_playwright


ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / "서울까지400km.html").as_uri()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("label", choices=("before", "after"))
    args = parser.parse_args()
    shot = ROOT / "tests" / "shots" / f"story-{args.label}"
    shot.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={"width": 480, "height": 860})
        page.goto(URL)
        page.wait_for_timeout(500)
        page.click("#bt-new")
        page.click("#mode-on")
        page.wait_for_timeout(350)

        intro_len = page.evaluate("D.intro.length")
        for index in range(intro_len):
            page.screenshot(path=str(shot / f"intro-{index + 1:02d}.png"))
            beat_count = page.evaluate(f"D.intro[{index}].beats.length")
            for _ in range(beat_count):
                page.click("#scr-intro")
                page.wait_for_timeout(80)

        page.fill("#inp-name", "다온")
        page.click("#bt-name")
        page.wait_for_timeout(350)
        page.screenshot(path=str(shot / "main-party.png"))

        page.click("#dk-status")
        page.click('#st-tabs [data-st="crew"]')
        page.wait_for_timeout(180)
        page.screenshot(path=str(shot / "status-crew.png"))
        page.click("#st-x")

        page.evaluate("G.openEventById('meet_family')")
        page.evaluate("UI.finishStory()")
        page.wait_for_timeout(200)
        page.screenshot(path=str(shot / "locked-choice.png"))
        page.evaluate("document.querySelector('#ev-wrap').classList.remove('on')")

        for event_id in (
            "story_family_principle",
            "story_family_key",
            "es_backdoor",
            "seoul_core",
            "patrol_walker",
            "combat_walker_read",
            "combat_walker_strike",
            "patrol_swarm",
            "patrol_toll",
        ):
            opened = page.evaluate("""event_id => {
                const event = D.events.find(item => item.id === event_id)
                    || D.seoulStops.find(item => item.id === event_id);
                if (!event) return false;
                UI.showEvent(event);
                UI.finishStory();
                return true;
            }""", event_id)
            if opened:
                page.wait_for_timeout(200)
                page.screenshot(path=str(shot / f"{event_id}.png"))
                page.evaluate("document.querySelector('#ev-wrap').classList.remove('on')")

        browser.close()
        print(shot)


if __name__ == "__main__":
    main()
