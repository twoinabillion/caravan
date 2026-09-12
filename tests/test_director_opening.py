#!/usr/bin/env python3
"""Director pass: the short departure is playable, saved, and non-repeatable."""

import os
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = (ROOT / "서울까지400km.html").as_uri()
CAPTURE_URL = os.environ.get("CARAVAN_CAPTURE_URL", URL)
CAPTURES = ROOT / "qa-artifacts" / "director-opening-2026-09-11"


def state(page):
    return page.evaluate(
        """() => ({
          entryMode:S.entryMode,
          step:S.opening&&S.opening.step,
          pending:S.opening&&S.opening.pendingResult,
          completed:S.opening&&S.opening.completed,
          decisions:S.opening&&S.opening.decisions,
          fuel:S.fuel, scrap:S.scrap, part:S.items['부품'], min:S.min,
          family:!!S.flags.intro_family_helped,
          appeal:!!S.flags.intro_appeal_failed,
          module:!!S.flags.intro_module_seen,
          left:!!S.flags.intro_workshop_left,
          mission:!!S.flags.main_mission_started,
          notes:S.notes.map(note=>note.title),
          memoryIds:[...(S.memories&&S.memories.history||[])]
        })"""
    )


def finish_current_story(page):
    page.evaluate("UI.finishStory()")
    assert page.locator("#ev-sheet").get_attribute("data-story-step") in {"decision", "result"}


def test_opening_engine_saves_decisions_costs_and_completion():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.add_init_script("localStorage.clear()")
        page.goto(URL)

        fresh = page.evaluate(
            """() => {
              G.newGame('onroad','해온','interactive','keeper');
              const pending=G.openingPending();
              const neighbor=G.neighbors(S.at)[0];
              const travel=G.canTravelTo(neighbor.id);
              return {name:S.name,event:pending&&pending.id,turns:pending&&pending.turns.length,
                travel,opening:S.opening};
            }"""
        )
        assert fresh["name"] == "해온"
        assert fresh["event"] == "opening_workshop"
        assert 1 <= fresh["turns"] <= 8
        assert fresh["travel"]["ok"] is False
        assert "출발" in fresh["travel"]["why"]

        page.evaluate("G.save(); S=null; G.load()")
        before_choice = state(page)
        assert before_choice["step"] == 0 and before_choice["pending"] is None

        page.evaluate(
            "G.resolveOpeningChoice('opening_workshop','answer_call'); "
            "G.continueOpening('opening_workshop')"
        )
        base = state(page)
        assert base["step"] == 1

        fast = page.evaluate(
            """() => G.resolveOpeningChoice('opening_bus_repair','new_part')"""
        )
        after_fast = state(page)
        assert fast["applied"] is True
        assert after_fast["part"] == base["part"] - 1
        assert after_fast["min"] == base["min"] + 20
        assert after_fast["family"] is True
        assert after_fast["pending"]["choiceId"] == "new_part"
        assert after_fast["decisions"]["opening_bus_repair"]["choiceId"] == "new_part"
        assert "도윤 가족의 버스" in after_fast["notes"]

        # A second activation and a reload both rehydrate the stored result.
        repeated = page.evaluate(
            """() => G.resolveOpeningChoice('opening_bus_repair','new_part')"""
        )
        after_repeat = state(page)
        assert repeated["applied"] is False
        assert after_repeat["part"] == after_fast["part"]
        assert after_repeat["min"] == after_fast["min"]
        page.evaluate("G.save(); S=null; G.load()")
        assert state(page) == after_repeat

        # The resource-free repair is viable for every starting profile and
        # carries a different time/resource result from the fast repair.
        profiles = page.evaluate(
            """() => Object.keys(D.startProfiles).map(profile=>{
              G.newGame('onroad','안전','interactive',profile);
              G.resolveOpeningChoice('opening_workshop','answer_call');
              G.continueOpening('opening_workshop');
              const before={part:S.items['부품'],scrap:S.scrap,min:S.min};
              const result=G.resolveOpeningChoice('opening_bus_repair','hose_bypass');
              return {profile,before,after:{part:S.items['부품'],scrap:S.scrap,min:S.min},result};
            })"""
        )
        assert len(profiles) == 3
        for row in profiles:
            assert row["result"]["applied"] is True
            assert row["after"]["part"] == row["before"]["part"]
            assert row["after"]["scrap"] == row["before"]["scrap"]
            assert row["after"]["min"] == row["before"]["min"] + 55

        # Walking the remaining authored steps unlocks ordinary travel and
        # installs the canonical family/parents/main-story facts once.
        completed = page.evaluate(
            """() => {
              G.newGame('onroad','완주','interactive','keeper');
              while(G.openingPending()){
                const event=G.openingPending();
                const choice=event.choices.find(item=>G.reqOk(G.choiceReq(item)).ok);
                G.resolveOpeningChoice(event.id,choice.id);
                G.continueOpening(event.id);
              }
              const next=G.neighbors(S.at).find(node=>G.canTravelTo(node.id).ok);
              return {opening:S.opening,flags:S.flags,queue:S._storyQueue,
                travel:next&&G.canTravelTo(next.id),notes:S.notes.map(note=>note.title),
                decisions:Object.keys(S.opening.decisions)};
            }"""
        )
        assert completed["opening"]["completed"] is True
        assert len(completed["decisions"]) == 5
        for flag in (
            "intro_family_helped",
            "intro_appeal_failed",
            "intro_module_seen",
            "intro_workshop_left",
            "main_mission_started",
        ):
            assert completed["flags"][flag] is True
        assert completed["travel"]["ok"] is True
        assert completed["queue"].count("onboarding_first_road") == 1
        assert "도윤 가족의 버스" in completed["notes"]
        assert "계기판 속 검증 모듈" in completed["notes"]

        # Saves created before the interactive opening remain departed.
        legacy = page.evaluate(
            """() => {
              G.newGame('onroad','예전','full','keeper');
              delete S.opening; G.save(); S=null; const loaded=G.load();
              return {loaded,pending:G.openingPending(),opening:S.opening,
                travel:G.canTravelTo(G.neighbors(S.at)[0].id)};
            }"""
        )
        assert legacy["loaded"] is True
        assert legacy["pending"] is None
        assert legacy["travel"]["ok"] is True
        modes = page.evaluate(
            """() => ['full','summary','skip'].map(entryMode=>{
              G.newGame('onroad','호환',entryMode,'keeper');
              return {entryMode:S.entryMode,pending:G.openingPending(),
                travel:G.canTravelTo(G.neighbors(S.at)[0].id).ok};
            })"""
        )
        assert modes == [
            {"entryMode": "full", "pending": None, "travel": True},
            {"entryMode": "summary", "pending": None, "travel": True},
            {"entryMode": "skip", "pending": None, "travel": True},
        ]
        browser.close()


def test_new_game_ui_enters_event_shell_and_restores_pending_result():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 390, "height": 844})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.add_init_script(
            "if(!sessionStorage.getItem('opening-test-ready')){localStorage.clear(); "
            "sessionStorage.setItem('opening-test-ready','1')} "
            "localStorage.setItem('caravan_story_auto','0')"
        )
        page.goto(URL)
        page.click("#bt-new")
        page.fill("#inp-name", "별")
        page.click("#opening-history")
        assert page.locator("#scr-intro").get_attribute("class") == "scr on"
        assert page.locator("#intro-title").inner_text().strip()
        assert "17" not in page.locator("#intro-summary-continue").inner_text()

        page.reload()
        page.click("#bt-new")
        page.fill("#inp-name", "별")
        page.click("#bt-name")
        page.wait_for_selector("#ev-wrap.on")

        assert page.locator("#scr-game").get_attribute("class") == "on"
        assert page.locator("#ev-wrap").get_attribute("aria-hidden") == "false"
        assert page.locator("#ev-sheet").get_attribute("data-event-id") == "opening_workshop"
        assert page.evaluate("S.entryMode") == "interactive"
        assert page.evaluate("G.myName()") == "별"
        assert page.locator("#opening-history").count() == 1

        finish_current_story(page)
        assert page.locator(".event-choice-dock .choice:not([disabled])").count() >= 2
        page.locator(".event-choice-dock .choice:not([disabled])").first.click()
        finish_current_story(page)
        assert page.locator("#ev-sheet").get_attribute("data-story-phase") == "outcome"
        assert page.locator(".event-choice-dock .primary-exit-btn").inner_text() == "다음 장면"
        saved = state(page)
        assert saved["pending"]["stepId"] == "opening_workshop"

        page.reload()
        page.click("#bt-continue")
        page.wait_for_selector("#ev-wrap.on")
        page.wait_for_timeout(250)
        assert page.locator("#ev-sheet").get_attribute("data-event-id") == "opening_workshop"
        assert page.locator("#ev-sheet").get_attribute("data-story-phase") == "outcome"
        assert state(page) == saved

        page.locator(".event-choice-dock .primary-exit-btn").click()
        page.wait_for_timeout(500)
        assert page.locator("#ev-sheet").get_attribute("data-event-id") == "opening_bus_repair"
        assert page.evaluate("S.opening.step") == 1
        assert not errors, errors
        browser.close()


def capture_mobile_choice_result_and_departure():
    CAPTURES.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        for width, height in ((390, 844), (320, 578)):
            page = browser.new_page(viewport={"width": width, "height": height})
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.add_init_script(
                "localStorage.clear(); localStorage.setItem('caravan_story_auto','0')"
            )
            page.goto(CAPTURE_URL)
            page.click("#bt-new")
            page.fill("#inp-name", "다온")
            page.click("#bt-name")
            finish_current_story(page)
            page.locator(".event-choice-dock .choice:not([disabled])").first.click()
            finish_current_story(page)
            page.locator(".event-choice-dock .primary-exit-btn").click()
            page.wait_for_timeout(380)

            assert page.locator("#ev-sheet").get_attribute("data-event-id") == "opening_bus_repair"
            finish_current_story(page)
            page.wait_for_timeout(360)
            choices = page.locator(".event-choice-dock .choice:not([disabled])")
            assert choices.count() >= 2
            choice_fit = choices.evaluate_all(
                """cards => cards.map(card=>{
                  const req=card.querySelector('.choice-requirement');
                  const box=card.getBoundingClientRect(), reqBox=req&&req.getBoundingClientRect();
                  return {contentFits:card.scrollHeight<=card.clientHeight+1,
                    requirementFits:!reqBox||(reqBox.top>=box.top-1&&reqBox.bottom<=box.bottom+1)};
                })"""
            )
            assert all(row["contentFits"] and row["requirementFits"] for row in choice_fit), choice_fit
            choices.last.scroll_into_view_if_needed()
            bounds = choices.last.bounding_box()
            assert bounds and bounds["y"] >= 0 and bounds["y"] + bounds["height"] <= height + 1
            choices.first.scroll_into_view_if_needed()
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
            page.screenshot(path=str(CAPTURES / f"choice-{width}x{height}.png"))

            choices.last.click()
            finish_current_story(page)
            page.wait_for_timeout(360)
            assert page.locator("#ev-sheet").get_attribute("data-story-phase") == "outcome"
            assert page.locator(".story-result .fx").count() >= 1
            result_button = page.locator(".event-choice-dock .primary-exit-btn")
            result_bounds = result_button.bounding_box()
            assert result_bounds and result_bounds["y"] >= 0
            assert result_bounds["y"] + result_bounds["height"] <= height + 1
            assert result_bounds["height"] >= 44
            page.screenshot(path=str(CAPTURES / f"result-{width}x{height}.png"))

            result_button.click()
            page.wait_for_timeout(380)
            while page.evaluate("G.openingPending() && G.openingPending().id !== 'opening_departure'"):
                finish_current_story(page)
                page.locator(".event-choice-dock .choice:not([disabled])").first.click()
                finish_current_story(page)
                page.locator(".event-choice-dock .primary-exit-btn").click()
                page.wait_for_timeout(380)
            assert page.locator("#ev-sheet").get_attribute("data-event-id") == "opening_departure"
            finish_current_story(page)
            page.locator(".event-choice-dock .choice:not([disabled])").first.click()
            finish_current_story(page)
            page.wait_for_timeout(360)
            assert page.locator(".event-choice-dock .primary-exit-btn").inner_text() == "길로 나가기"
            departure_bounds = page.locator(".event-choice-dock .primary-exit-btn").bounding_box()
            assert departure_bounds and departure_bounds["y"] >= 0
            assert departure_bounds["y"] + departure_bounds["height"] <= height + 1
            assert departure_bounds["height"] >= 44
            page.screenshot(path=str(CAPTURES / f"departure-{width}x{height}.png"))
            page.locator(".event-choice-dock .primary-exit-btn").click()
            page.wait_for_timeout(180)
            assert page.locator("#ev-wrap").get_attribute("aria-hidden") == "true"
            assert page.evaluate("S.opening.completed") is True
            assert page.evaluate("G.canTravelTo(G.neighbors(S.at)[0].id).ok") is True
            assert not errors, errors
            page.close()
        browser.close()


if __name__ == "__main__":
    test_opening_engine_saves_decisions_costs_and_completion()
    test_new_game_ui_enters_event_shell_and_restores_pending_result()
    capture_mobile_choice_result_and_departure()
    print("✅ playable saved departure passed")
