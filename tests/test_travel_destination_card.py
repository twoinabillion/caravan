#!/usr/bin/env python3
"""The moving screen should describe the actual destination instead of an empty log."""

import os
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = (ROOT / "서울까지400km.html").as_uri()


def test_travel_destination_card():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.add_init_script(
            "localStorage.clear(); localStorage.setItem('caravan_story_auto','0')"
        )
        page.goto(URL)
        page.click("#bt-new")
        if page.locator("#scr-mode").is_visible():
            page.click("#mode-on")
        page.fill("#inp-name", "목적지 카드 점검")
        page.click("#bt-name")
        page.evaluate("UI.skipIntro()")
        page.wait_for_timeout(260)
        page.evaluate(
            "document.querySelector('#arrival-scene').classList.remove('on'); "
            "document.querySelector('#ev-wrap').classList.remove('on'); "
            "S.flags.main_mission_started=true; "
            "document.documentElement.classList.add('qa-exact-replay')"
        )
        destination = page.evaluate(
            """() => {
              const next = G.neighbors(S.at).find(node => G.canTravelTo(node.id).ok);
              if (!next || !G.startTravel(next.id)) return null;
              return {id:next.id,name:D.nodes[next.id].name};
            }"""
        )
        assert destination

        card = page.locator(".travel-destination-card")
        assert card.is_visible()
        assert destination["name"] in card.inner_text()
        assert card.locator(".travel-destination-visual img").count() == 1
        assert card.locator(".travel-destination-description").inner_text().strip()
        assert card.locator(".travel-destination-action").inner_text().strip()
        assert card.locator(".travel-destination-known").inner_text().strip()
        assert page.locator("#road-notice-slot").is_hidden()
        assert "달구지는 계속 달린다" not in page.locator("#panel").inner_text()
        assert "아직 남은 기록이 없다" not in page.locator("#panel").inner_text()

        box = card.bounding_box()
        panel = page.locator("#panel").evaluate(
            "node => ({scrollHeight:node.scrollHeight,clientHeight:node.clientHeight})"
        )
        assert box and box["width"] <= 390
        assert panel["scrollHeight"] >= panel["clientHeight"]
        if screenshot := os.environ.get("CARAVAN_DESTINATION_SCREENSHOT"):
            page.locator("#panel").evaluate(
                "panel => { const card=panel.querySelector('.travel-destination-card'); "
                "panel.scrollTop=Math.max(0,card.offsetTop-panel.offsetTop-4); }"
            )
            page.wait_for_timeout(80)
            page.screenshot(path=screenshot, full_page=False)
        browser.close()
