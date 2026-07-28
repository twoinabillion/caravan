#!/usr/bin/env python3
"""화자 턴 UI의 대표 모바일 상태를 디자인 QA용으로 캡처한다."""

import pathlib

from playwright.sync_api import sync_playwright


ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / "서울까지400km.html").as_uri()
SHOT = ROOT / "tests" / "shots" / "dialogue-qa"
SHOT.mkdir(parents=True, exist_ok=True)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(
        viewport={"width": 480, "height": 860},
        device_scale_factor=1,
    )
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(URL)
    page.wait_for_timeout(450)
    page.click("#bt-new")
    page.click("#mode-on")
    page.fill("#inp-name", "다온")
    page.click("#bt-name")
    page.click("#scr-intro")
    page.click("#scr-intro")
    page.wait_for_timeout(160)
    page.screenshot(path=str(SHOT / "01-intro-grandfather-turn.png"))

    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(250)

    page.evaluate(
        """() => {
          S.party=['minji','kangwoo'];
          S.comps.minji.bond=20;
          S.comps.kangwoo.bond=20;
          UI.showEvent(D.events.find(e=>e.id==='pair_mj_kw_2'));
        }"""
    )
    page.click("#ev-sheet .story-next")
    page.wait_for_timeout(150)
    page.screenshot(path=str(SHOT / "02-companion-speaker-turn.png"))
    page.evaluate("document.querySelector('#ev-wrap').classList.remove('on')")

    page.evaluate(
        """() => {
          S.driving={from:'busan',to:'ulsan',dist:55,gone:14,road:'high',slots:[],si:0};
          UI.renderAll();
          UI.clearSpeech();
          UI.speak({who:'minji',t:'조용할 때 연료부터 확인해.'});
        }"""
    )
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "03-driving-character-turn.png"))

    page.evaluate(
        """() => {
          UI.clearSpeech();
          UI.speak({who:'sys',t:'오늘 길은 생각보다 조용하다.'});
        }"""
    )
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "04-driving-narration-turn.png"))

    browser.close()
    if errors:
        raise RuntimeError(" | ".join(errors))
    print(SHOT)
