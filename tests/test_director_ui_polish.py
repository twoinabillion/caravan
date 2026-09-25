"""Navigation remains legible, read-only and reachable after the visual polish."""
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
URL = (ROOT / "서울까지400km.html").as_uri()
ARTIFACTS = ROOT / "artifacts/director-polish-20260914"


def bounds(page, selector):
    return page.locator(selector).evaluate("n => n.getBoundingClientRect().toJSON()")


@pytest.mark.parametrize("width,height", [(320, 578), (320, 640), (390, 844), (480, 900), (1440, 900)])
def test_navigation_first_view_and_map_return(width, height):
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": width, "height": height})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.add_init_script("localStorage.setItem('caravan_story_auto','0')")
        page.goto(URL)
        page.evaluate("""async () => {
          G.newGame('onroad','화면 점검','full');
          S.flags.main_mission_started=true; S.flags.onboarding_event_guide=true;
          await UI.restoreQaView({screen:'game'});
          document.documentElement.classList.remove('qa-exact-replay');
        }""")
        page.wait_for_timeout(150)
        dock = bounds(page, "#dock")
        # No scroll-to-control: departure and its costs must already be exposed.
        for selector in (".nav-depart-cta", ".nav-route-facts"):
            r = bounds(page, selector)
            assert r["top"] >= 0 and r["bottom"] <= dock["top"] + 1, (selector, r, dock)
        for button in page.locator("#dock button, .journey-mode-tabs button").all():
            r = button.bounding_box()
            assert r["width"] >= 44 and r["height"] >= 44
        page.screenshot(path=ARTIFACTS / f"road-{width}x{height}.png")
        snapshot = page.evaluate("JSON.stringify({at:S.at,driving:S.driving,fuel:S.fuel,items:S.items,min:S.min})")
        page.locator(".nav-route-map").click()
        page.wait_for_timeout(100)
        close = bounds(page, "#map-x")
        assert close["width"] >= 44 and close["height"] >= 44
        assert "현재 위치" in page.locator("#nodecard").inner_text()
        assert page.evaluate("D.nodes[S.at].name") in page.locator("#nodecard").inner_text()
        # Both the initial place and keyboard-selected places are fully readable.
        for press in (None, "]", "["):
            if press:
                page.keyboard.press(press)
            for selector in ("#map-mini", "#nodecard h4", ".map-compact-summary"):
                assert page.locator(selector).evaluate("n => n.scrollWidth <= n.clientWidth + 1 && n.scrollHeight <= n.clientHeight + 1"), selector
                r = bounds(page, selector)
                assert r["top"] >= 0 and r["bottom"] <= dock["top"], (selector, r)
        page.screenshot(path=ARTIFACTS / f"map-{width}x{height}.png")
        page.locator("#map-x").click()
        assert not page.locator("#ovl-map").is_visible()
        assert snapshot == page.evaluate("JSON.stringify({at:S.at,driving:S.driving,fuel:S.fuel,items:S.items,min:S.min})")
        page.locator("#dk-status").click()
        for name in page.locator(".bag-pocket-name").all():
            r = name.bounding_box()
            assert r["width"] >= 20 and r["height"] >= 12
            assert name.evaluate("n => n.scrollWidth <= n.clientWidth + 1")
        page.screenshot(path=ARTIFACTS / f"bag-{width}x{height}.png")
        page.locator("#dk-road").click()
        assert page.locator(".nav-depart-cta").is_visible()
        page.locator('button[data-journey-mode="local"]').click()
        page.wait_for_timeout(250)
        page.screenshot(path=ARTIFACTS / f"stay-{width}x{height}.png")
        assert page.locator(".stop-action-trigger").first.is_visible()
        page.locator('button[data-journey-mode="route"]').click()
        page.wait_for_timeout(180)
        r = bounds(page, ".nav-depart-cta")
        assert r["top"] >= 0 and r["bottom"] <= bounds(page, "#dock")["top"] + 1
        assert not errors, errors
        browser.close()


def test_new_departure_reaches_road_and_keeps_finite_resources():
    """Use the real opening controls; speed up only the dialogue reveal."""
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 390, "height": 844})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.add_init_script("localStorage.setItem('caravan_story_auto','0')")
        page.goto(URL)
        page.locator("#bt-new").click()
        if page.locator("#scr-mode").is_visible():
            page.locator("#mode-on").click()
        page.locator("#inp-name").fill("여행자")
        page.locator("#bt-name").click()
        page.evaluate("window.__CARAVAN_TEST_AUTO_MS=12")
        captured = False
        for _ in range(160):
            ready = page.evaluate("() => S?.opening?.completed && S.flags?.main_mission_started && !document.querySelector('#ev-wrap.on')")
            if ready:
                break
            page.evaluate("UI.finishStory()")
            controls = page.locator("#ev-sheet .onboarding-route-start:visible:not([disabled]), #ev-sheet .primary-exit-btn:visible:not([disabled]), #ev-sheet [data-r]:visible:not([disabled]), #ev-sheet [data-i]:visible:not([disabled]), #ev-sheet .story-next:visible:not([disabled])")
            if controls.count():
                if not captured and page.locator("#ev-sheet [data-i]").count():
                    page.screenshot(path=ARTIFACTS / "new-opening-choice-390.png")
                    captured = True
                controls.first.click()
            page.wait_for_timeout(70)
        assert ready, "The playable departure did not reach its road controls"
        assert captured
        page.evaluate("delete window.__CARAVAN_TEST_AUTO_MS")
        assert not page.evaluate("G.isInfiniteResourceMode()")
        page.screenshot(path=ARTIFACTS / "new-departure-road-390.png")
        page.locator(".nav-depart-cta").click()
        page.wait_for_function("!!S.driving")
        assert page.evaluate("S.driving.to") == "yangsan"
        page.screenshot(path=ARTIFACTS / "new-departure-driving-390.png")
        assert not errors, errors
        browser.close()
