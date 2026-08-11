#!/usr/bin/env python3
"""내비게이션·주요 정착지·대표 사건의 현재 모바일 화면을 감사용으로 캡처한다."""
import argparse
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / "서울까지400km.html").as_uri()
AUDIT = ROOT / "audits" / "visual-coherence-2026-08-11"
SETTLEMENTS = ("miryang", "daegu", "muju", "jeonju", "daejeon", "suwon", "gwangju")
EVENTS = (
    ("meet_scrapyard", "character-meet"),
    ("roadcrew_bridge", "road-action"),
    ("story_generation_form", "story-detail"),
    ("lc_busan_dried", "generic-local-event"),
)


def settle(page, delay=140):
    page.evaluate("""() => document.querySelectorAll('*').forEach(node =>
      node.getAnimations?.().forEach(animation => { try { animation.finish(); } catch (_) {} }))""")
    page.wait_for_timeout(delay)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("label", choices=("before", "after"))
    args = parser.parse_args()
    out = AUDIT / args.label
    out.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={"width": 480, "height": 860})
        page.goto(GAME)
        page.evaluate("""() => {
          localStorage.setItem('caravan_story_auto','0');
          G.newGame('onroad','다온','full');
          document.querySelectorAll('.scr').forEach(node => node.classList.remove('on'));
          document.querySelector('#scr-game').classList.add('on');
          UI.renderAll();
        }""")
        settle(page)
        page.click('[data-journey-mode="route"]')
        settle(page)
        page.screenshot(path=str(out / "01-navigation.png"))

        for index, settlement_id in enumerate(SETTLEMENTS, start=2):
            page.evaluate("""settlementId => {
              S.at=settlementId; S.driving=null; UI.renderAll(); UI.showStl(settlementId);
            }""", settlement_id)
            settle(page)
            page.screenshot(path=str(out / f"{index:02d}-settlement-{settlement_id}.png"))
            page.evaluate("document.querySelector('#ovl-stl').classList.remove('on')")

        for index, (event_id, slug) in enumerate(EVENTS, start=9):
            page.evaluate("""eventId => {
              const event=D.events.find(item => item.id===eventId);
              UI.showEvent(event);
            }""", event_id)
            settle(page)
            page.screenshot(path=str(out / f"{index:02d}-event-{slug}.png"))
            page.evaluate("document.querySelector('#ev-wrap').classList.remove('on')")

        browser.close()
    print(out)


if __name__ == "__main__":
    main()
