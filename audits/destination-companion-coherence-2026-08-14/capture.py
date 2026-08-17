#!/usr/bin/env python3
"""Capture the destination console and every first-meet story beat in Chrome."""

import json
import os
import re
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
GAME = (ROOT / "서울까지400km.html").as_uri()
OUT = Path(os.environ.get("CARAVAN_AUDIT_OUT", Path(__file__).parent / "before"))
EVENTS = (
    ("minji", "meet_scrapyard"),
    ("parkss", "meet_bus"),
    ("leo", "meet_hitchhiker"),
    ("jaeyi", "jy_recruit"),
    ("eunsu", "es_recruit"),
    ("kangwoo", "kw_recruit"),
)


def slug(value):
    return re.sub(r"[^a-z0-9_-]+", "-", value.lower()).strip("-")


def settle(page, delay=100):
    page.evaluate("""() => document.querySelectorAll('*').forEach(node =>
      node.getAnimations?.().forEach(animation => { try { animation.finish(); } catch (_) {} }))""")
    page.wait_for_timeout(delay)


def boot(page):
    page.goto(GAME)
    page.evaluate("""() => {
      localStorage.clear();
      localStorage.setItem('caravan_story_auto','0');
      G.newGame('onroad','다온','full');
      document.querySelectorAll('.scr,.screen').forEach(node => node.classList.remove('on'));
      document.querySelector('#scr-game').classList.add('on');
      document.querySelector('#arrival-scene')?.classList.remove('on');
      UI.renderAll();
    }""")
    settle(page, 180)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    report = {"game": GAME, "destination": {}, "events": []}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 480, "height": 860}, device_scale_factor=1)
        boot(page)

        page.locator("#app").screenshot(path=str(OUT / "01-destination-480x860.png"))
        report["destination"]["480x860"] = page.evaluate("""() => {
          const pick=selector=>document.querySelector(selector)?.getBoundingClientRect().toJSON();
          return {
            console:pick('.route-console-v3'), screen:pick('.route-console-screen'),
            map:pick('.nav-route-map'), summary:pick('.nav-route-summary'),
            description:pick('.nav-place-description'), facts:pick('.nav-route-facts'),
            carousel:pick('.nav-destination-carousel'), dock:pick('#dock'),
            copy:document.querySelector('.nav-place-description')?.textContent.trim()
          };
        }""")

        page.set_viewport_size({"width": 360, "height": 700})
        settle(page, 160)
        page.locator("#app").screenshot(path=str(OUT / "02-destination-360x700.png"))
        report["destination"]["360x700"] = page.evaluate("""() => {
          const pick=selector=>document.querySelector(selector)?.getBoundingClientRect().toJSON();
          return {
            console:pick('.route-console-v3'), screen:pick('.route-console-screen'),
            map:pick('.nav-route-map'), summary:pick('.nav-route-summary'),
            description:pick('.nav-place-description'), facts:pick('.nav-route-facts'),
            carousel:pick('.nav-destination-carousel'), dock:pick('#dock')
          };
        }""")

        page.set_viewport_size({"width": 480, "height": 860})
        for companion, event_id in EVENTS:
            page.evaluate("document.querySelector('#ev-wrap')?.classList.remove('on')")
            page.evaluate(
                "eventId => UI.showEvent(D.events.find(item => item.id === eventId))",
                event_id,
            )
            settle(page)
            step = 1
            while step <= 20:
                state = page.evaluate("""({companion,eventId,step}) => {
                  const sheet=document.querySelector('#ev-sheet');
                  const frame=document.querySelector('.event-scene-frame');
                  const next=document.querySelector('#ev-sheet .story-next');
                  const choices=[...document.querySelectorAll('#ev-sheet .choice')].map(node=>node.innerText.trim());
                  return {companion,eventId,step,sceneKey:frame?.dataset.sceneKey||null,
                    storyStep:sheet?.dataset.storyStep||null,copy:sheet?.innerText.trim()||'',
                    hasNext:Boolean(next),choices};
                }""", {"companion": companion, "eventId": event_id, "step": step})
                filename = f"event-{companion}-{step:02d}-{slug(state['sceneKey'] or 'no-scene')}.png"
                page.locator("#ev-sheet").screenshot(path=str(OUT / filename))
                state["screenshot"] = filename
                report["events"].append(state)
                if not state["hasNext"]:
                    break
                page.locator("#ev-sheet .story-next").click()
                settle(page)
                step += 1

        browser.close()

    (OUT / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(OUT)


if __name__ == "__main__":
    main()
