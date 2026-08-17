#!/usr/bin/env python3
"""Capture representative event-geography states in the user's Chrome browser."""

import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
GAME = (ROOT / "서울까지400km.html").as_uri()
OUT = Path(__file__).parent / "current"
CASES = (
    ("minji", "meet_scrapyard", 2, "부산→양산 구간의 폐차장"),
    ("parkss", "meet_bus", 1, "김천권 도로의 넘어진 버스"),
    ("leo", "meet_hitchhiker", 2, "밤길의 히치하이커"),
    ("jaeyi", "jy_recruit", 3, "도로를 이동하는 리어카"),
    ("eunsu", "es_recruit", 1, "충청권 폐 기지국 옥상"),
    ("eunsu-point", "es_recruit", 4, "하늘 좌표를 가리키는 은수"),
    ("kangwoo", "kw_recruit", 2, "대구 돔 시장 경비탑"),
)


def settle(page, delay=120):
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
    report = {"game": GAME, "viewport": "480x860", "cases": []}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 480, "height": 860}, device_scale_factor=1)
        boot(page)

        route_file = "01-route-before-discovery.png"
        page.locator("#app").screenshot(path=str(OUT / route_file))
        report["route"] = page.evaluate("""() => ({
          screenshot:'01-route-before-discovery.png',
          from:S.at,
          destinations:[...document.querySelectorAll('[data-route-select]')].map(node=>node.dataset.routeSelect),
          copy:document.querySelector('.route-console')?.innerText.trim()||''
        })""")

        for index, (label, event_id, target_step, contract) in enumerate(CASES, start=2):
            page.evaluate("document.querySelector('#ev-wrap')?.classList.remove('on')")
            page.evaluate("eventId => UI.showEvent(D.events.find(item => item.id === eventId))", event_id)
            settle(page)
            for _ in range(1, target_step):
                page.locator("#ev-sheet .story-next").click()
                settle(page)
            state = page.evaluate("""({eventId,contract}) => {
              const event=D.events.find(item=>item.id===eventId);
              const frame=document.querySelector('.event-scene-frame');
              return {
                eventId,contract,title:event?.title||'',type:event?.type||'',weight:event?.w,
                priority:event?.priority||0,nearNode:event?.nearNode||[],region:event?.region||[],
                locEvent:event?.locEvent||null,fixed:Boolean(event?.fixed),noPool:Boolean(event?.noPool),
                recruitStart:event?.recruitStart||null,sceneKey:frame?.dataset.sceneKey||null,
                storyStep:document.querySelector('#ev-sheet')?.dataset.storyStep||null,
                visibleCopy:document.querySelector('#ev-sheet')?.innerText.trim()||''
              };
            }""", {"eventId": event_id, "contract": contract})
            filename = f"{index:02d}-{label}-step-{target_step}.png"
            page.locator("#ev-sheet").screenshot(path=str(OUT / filename))
            state["screenshot"] = filename
            report["cases"].append(state)

        browser.close()

    (OUT / "report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(OUT)


if __name__ == "__main__":
    main()
