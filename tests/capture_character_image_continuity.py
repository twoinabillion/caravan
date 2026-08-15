#!/usr/bin/env python3
"""동료 6명의 첫 만남 행동컷과 합류 선택 결과컷을 모바일로 캡처한다."""
import os
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / "서울까지400km.html").as_uri()
OUT = ROOT / "tests" / "shots" / "character-continuity-after"
SPECS = (
    ("minji", "meet_scrapyard"),
    ("parkss", "meet_bus"),
    ("leo", "meet_hitchhiker"),
    ("jaeyi", "jy_recruit"),
    ("eunsu", "es_recruit"),
    ("kangwoo", "kw_recruit"),
)


def settle(page):
    page.evaluate("document.querySelector('#ev-sheet')?.getAnimations().forEach(a => a.finish())")
    page.wait_for_timeout(90)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel=os.environ.get("CARAVAN_BROWSER_CHANNEL") or None)
        page = browser.new_page(viewport={"width": 480, "height": 860})
        page.goto(GAME)
        page.evaluate("""() => {
          localStorage.setItem('caravan_story_auto','0');
          G.newGame('onroad','다온','full');
          document.querySelectorAll('.screen').forEach(node => node.classList.remove('on'));
          document.querySelector('#scr-game').classList.add('on');
          UI.renderAll();
        }""")

        for companion_id, meet_id in SPECS:
            join_id = f"rq_{companion_id}_join"
            meet_keys = page.evaluate(
                "eventId => [...(D.eventTurnScenes[eventId] || [])]", meet_id
            )
            assert len(meet_keys) >= 2, (meet_id, meet_keys)

            page.evaluate(
                "eventId => UI.showEvent(D.events.find(item => item.id === eventId))",
                meet_id,
            )
            settle(page)
            current = page.locator(".event-scene-frame").get_attribute("data-scene-key")
            assert current == meet_keys[0], (meet_id, current, meet_keys)
            page.screenshot(path=str(OUT / f"{companion_id}-01-meet-{meet_keys[0]}.png"))
            for cut_index, expected_key in enumerate(meet_keys[1:], start=2):
                guard = 0
                while page.locator("#ev-sheet .story-next").count() and guard < 40:
                    guard += 1
                    page.locator("#ev-sheet .story-next").click()
                    settle(page)
                    if page.locator(".event-scene-frame").get_attribute("data-scene-key") == expected_key:
                        break
                current = page.locator(".event-scene-frame").get_attribute("data-scene-key")
                assert current == expected_key, (meet_id, current, expected_key, meet_keys)
                page.screenshot(path=str(OUT / f"{companion_id}-{cut_index:02d}-meet-{expected_key}.png"))
            page.evaluate("document.querySelector('#ev-wrap').classList.remove('on')")

            page.evaluate(
                "eventId => UI.showEvent(D.events.find(item => item.id === eventId))",
                join_id,
            )
            page.evaluate("UI.finishStory()")
            settle(page)
            assert page.locator(".event-scene-frame").get_attribute("data-scene-key") == f"recruit-{companion_id}-join"
            base = len(meet_keys) + 1
            page.screenshot(path=str(OUT / f"{companion_id}-{base:02d}-join-before-choice.png"))
            page.locator('#ev-sheet [data-i="0"]').click()
            settle(page)
            assert page.locator(".event-scene-frame").get_attribute("data-scene-key") == f"recruit-{companion_id}-join-decision"
            page.screenshot(path=str(OUT / f"{companion_id}-{base + 1:02d}-join-after-choice.png"))
            page.evaluate("document.querySelector('#ev-wrap').classList.remove('on')")

        browser.close()
    print(OUT)


if __name__ == "__main__":
    main()
