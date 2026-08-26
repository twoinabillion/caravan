#!/usr/bin/env python3
"""The live-only intro shortcut starts a genuinely new journey."""

from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = (ROOT / "서울까지400km.html").as_uri()


def enter_game(page):
    page.goto(f"{URL}?caravan-live=1")
    page.click("#bt-new")
    page.fill("#inp-name", "인트로 점검")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(220)
    page.evaluate(
        "document.querySelector('#arrival-scene').classList.remove('on'); "
        "document.querySelector('#ev-wrap').classList.remove('on'); "
        "S.flags.main_mission_started=true"
    )


def test_live_intro_shortcut_resets_journey_before_intro():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.add_init_script(
            "localStorage.clear(); localStorage.setItem('caravan_intro_auto','0'); "
            "localStorage.setItem('caravan_story_auto','0')"
        )
        enter_game(page)
        started = page.evaluate(
            """() => {
              const next=G.neighbors(S.at).find(node=>G.canTravelTo(node.id).ok);
              return next&&G.startTravel(next.id);
            }"""
        )
        assert started
        page.evaluate("S.day=9; S.scrap=3; G.save()")
        button = page.locator("#intro-test-shortcut")
        assert button.is_visible()
        button.click()
        assert page.locator("#scr-intro").get_attribute("class") == "scr on"
        assert page.locator("#intro-skip").inner_text() == "프롤로그 핵심 요약"
        assert page.locator("#intro-title").inner_text().strip()
        reset = page.evaluate(
            "() => ({day:S.day,name:S.name,at:S.at,driving:S.driving,scrap:S.scrap,hasSave:G.hasSave()})"
        )
        assert reset == {
            "day": 1,
            "name": "인트로 점검",
            "at": "busan",
            "driving": None,
            "scrap": 24,
            "hasSave": True,
        }

        page.click("#intro-skip")
        page.click("#intro-summary-start")
        assert page.locator("#scr-game").get_attribute("class") == "on"
        after = page.evaluate(
            "() => ({day:S.day,name:S.name,at:S.at,driving:S.driving,hasSave:G.hasSave()})"
        )
        assert after == {
            "day": 1,
            "name": "인트로 점검",
            "at": "busan",
            "driving": None,
            "hasSave": True,
        }
        browser.close()


def test_intro_restart_button_is_hidden_outside_live_mode():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.goto(URL)
        assert page.locator("#intro-test-shortcut").is_hidden()
        browser.close()
