#!/usr/bin/env python3
"""Capture Goal/Bag switching and canonical/legacy event portrait states."""

import argparse
import json
import os
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / "서울까지400km.html").as_uri()
AUDIT = ROOT / "audits" / "surface-consistency-2026-08-17"


def enter_game(page):
    page.goto(GAME)
    page.evaluate(
        """() => {
          localStorage.clear();
          localStorage.setItem('caravan_story_auto','0');
          G.newGame('onroad','다온','full');
          document.querySelectorAll('.scr,.screen').forEach(node => node.classList.remove('on'));
          document.querySelector('#scr-game').classList.add('on');
          UI.renderAll();
          document.querySelector('#arrival-scene')?.classList.remove('on');
        }"""
    )
    page.wait_for_timeout(160)


def settle(page):
    page.evaluate(
        """() => document.querySelectorAll('*').forEach(node =>
          node.getAnimations?.().forEach(animation => {
            try { animation.finish(); } catch (_) {}
          }))"""
    )
    page.wait_for_timeout(100)


def surface_state(page):
    return page.evaluate(
        """() => {
          const prop=document.querySelector('#status-prop');
          const body=document.querySelector('#st-body');
          const visible=node=>!!(node&&node.getClientRects().length);
          return {
            propClass:prop?.className||'',
            toolSurface:prop?.dataset.toolSurface||'',
            bagNodes:body?.querySelectorAll('.bag-live-content,.bag-pocket,.bag-detail').length||0,
            visibleBagNodes:[...body.querySelectorAll('.bag-live-content,.bag-pocket,.bag-detail')].filter(visible).length,
            goalNodes:body?.querySelectorAll('.folio-live-content,.folio-progress,.folio-clue').length||0,
            visibleGoalNodes:[...body.querySelectorAll('.folio-live-content,.folio-progress,.folio-clue')].filter(visible).length
          };
        }"""
    )


def advance_to_portrait(page, event_id, expected_id):
    opened = page.evaluate(
        """eventId => {
          const event=D.events.find(item => item.id===eventId);
          if (!event) return false;
          UI.showEvent(event);
          return true;
        }""",
        event_id,
    )
    assert opened, event_id
    settle(page)
    expected_src = page.evaluate("id => D.portraits[id] || ''", expected_id)
    for _ in range(24):
        avatar = page.locator("#ev-sheet .turn-avatar, #ev-sheet .chat-avatar")
        if avatar.count() and avatar.first.get_attribute("src") == expected_src:
            return True
        next_button = page.locator("#ev-sheet .story-next")
        if not next_button.count():
            break
        next_button.click()
        settle(page)
    return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("label", choices=("before", "after"))
    args = parser.parse_args()
    out = AUDIT / args.label
    out.mkdir(parents=True, exist_ok=True)

    metrics = {}
    with sync_playwright() as playwright:
        print("launching browser", flush=True)
        browser = playwright.chromium.launch(
            channel=os.environ.get("CARAVAN_BROWSER_CHANNEL") or None
        )
        page = browser.new_page(viewport={"width": 390, "height": 844})
        print("entering game", flush=True)
        enter_game(page)

        print("capturing bag", flush=True)
        page.click("#dk-status")
        page.click('[data-bag-item="의약품"]')
        settle(page)
        metrics["bag_selected"] = surface_state(page)
        page.screenshot(path=str(out / "01-bag-medicine.png"))

        print("capturing goal after bag", flush=True)
        page.click("#dk-objectives")
        settle(page)
        metrics["goal_after_bag"] = surface_state(page)
        page.screenshot(path=str(out / "02-goal-after-bag.png"))

        print("capturing bag after goal", flush=True)
        page.click("#dk-status")
        settle(page)
        metrics["bag_after_goal"] = surface_state(page)
        page.screenshot(path=str(out / "03-bag-after-goal.png"))

        print("capturing second goal", flush=True)
        page.click("#dk-objectives")
        settle(page)
        metrics["goal_after_second_bag"] = surface_state(page)
        page.screenshot(path=str(out / "04-goal-after-second-bag.png"))

        print("capturing legacy portrait event", flush=True)
        page.evaluate("document.querySelector('#ovl-status').classList.remove('on')")
        legacy_visible = advance_to_portrait(page, "lib_meet", "hanbyeol")
        metrics["legacy_portrait_visible"] = legacy_visible
        page.screenshot(path=str(out / "05-legacy-portrait-event.png"))
        page.evaluate("document.querySelector('#ev-wrap').classList.remove('on')")

        print("capturing canonical portrait event", flush=True)
        canonical_visible = advance_to_portrait(page, "meet_scrapyard", "minji")
        metrics["canonical_portrait_visible"] = canonical_visible
        page.screenshot(path=str(out / "06-canonical-portrait-event.png"))

        if args.label == "after":
            for key in ("goal_after_bag", "goal_after_second_bag"):
                assert metrics[key]["bagNodes"] == 0, metrics[key]
                assert metrics[key]["visibleBagNodes"] == 0, metrics[key]
                assert metrics[key]["goalNodes"] > 0, metrics[key]
                assert metrics[key]["toolSurface"] == "goal", metrics[key]
            for key in ("bag_selected", "bag_after_goal"):
                assert metrics[key]["goalNodes"] == 0, metrics[key]
                assert metrics[key]["visibleGoalNodes"] == 0, metrics[key]
                assert metrics[key]["bagNodes"] > 0, metrics[key]
                assert metrics[key]["toolSurface"] == "bag", metrics[key]
            assert not legacy_visible, "legacy illustrated portrait reached event UI"
            assert canonical_visible, "canonical companion portrait disappeared"

        (out / "metrics.json").write_text(
            json.dumps(metrics, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        browser.close()

    print(json.dumps(metrics, ensure_ascii=False))
    print(out)


if __name__ == "__main__":
    main()
