"""Story choices stay discoverable without splitting the conversation."""
import os
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = os.environ.get("CARAVAN_TEST_URL", (ROOT / "서울까지400km.html").as_uri())
ARTIFACTS = ROOT / "artifacts/mobile-actions-20260913/story"


@pytest.fixture
def page():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.add_init_script("localStorage.clear(); localStorage.setItem('caravan_story_auto','0')")
        page.goto(URL)
        page.evaluate("""() => {
          G.newGame('onroad','선택지 검수','full');
          S.flags.main_mission_started=true; S.flags.onboarding_event_guide=true;
          UI.restoreQaView({screen:'game'});
          document.documentElement.classList.remove('qa-exact-replay');
        }""")
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        yield page
        assert not errors, errors
        browser.close()


def open_fixture(page, long=False):
    tail = ("마지막으로 짧게 묻는다." if not long else
            "마지막 질문이 길게 이어진다. " * 22)
    choices = (["확인한다", "기다린다", "돌아간다"] if not long else
               ["첫 번째로 아주 긴 선택을 끝까지 읽고 결정한다 " * 5,
                "두 번째 선택도 숨은 뜻이 없도록 문장을 끝까지 읽는다 " * 5,
                "세 번째 선택까지 같은 대화 안에서 천천히 검토한다 " * 5])
    page.evaluate("""({tail,choices}) => UI.showEvent({
      id:'qa_choice_discovery', type:'스토리', title:'선택지 발견성 검수',
      turns:[
        {kind:'dialogue',who:'radio',name:'무전',text:'앞선 대화다.'},
        {kind:'dialogue',who:'me',text:tail}
      ],
      choices:choices.map((label,index)=>({
        label,
        out:[{p:1,text:'선택 결과 '+(index+1),fx:{}}]
      }))
    })""", {"tail": tail, "choices": choices})


@pytest.mark.parametrize("width,height", [(320, 578), (390, 844)])
def test_short_final_turn_and_three_choices_are_visible_together(page, width, height):
    page.set_viewport_size({"width": width, "height": height})
    page.evaluate("G.openEventById('onboarding_first_road')")
    page.evaluate("UI.finishStory()")
    assert page.locator(".choice-dock-head").inner_text() == "어떻게 할까 · 선택지 3개"
    final_turn = page.locator("[data-story-entry]").last.bounding_box()
    choices = page.locator(".event-choice-dock .choice[data-i]")
    assert choices.count() == 3
    boxes = [choices.nth(index).bounding_box() for index in range(3)]
    assert final_turn and final_turn["y"] >= 0
    assert all(box and box["y"] >= 0 and box["y"] + box["height"] <= height + 1 for box in boxes)
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=ARTIFACTS / f"onboarding-first-road-choices-{width}x{height}.png")


def test_long_copy_keeps_final_turn_and_points_to_more_in_same_scroll(page):
    page.set_viewport_size({"width": 320, "height": 578})
    open_fixture(page, long=True)
    page.evaluate("UI.finishStory()")
    scroll = page.locator(".event-scroll")
    final_turn = page.locator("[data-story-entry]").last
    assert final_turn.bounding_box()["y"] >= 0
    assert page.locator(".story-choice-more").is_visible()
    cue_box = page.locator(".story-choice-more").bounding_box()
    assert cue_box and 0 <= cue_box["y"] and cue_box["y"] + cue_box["height"] <= 578
    assert "아래로 더 보기" in page.locator(".story-choice-more").inner_text()
    assert page.locator(".event-choice-dock").evaluate("n=>n.closest('.story-transcript')!==null")
    assert scroll.evaluate("n=>n.scrollHeight>n.clientHeight")
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=ARTIFACTS / "long-choices-more-320x578.png")
    page.locator(".event-choice-dock .choice[data-i]").last.scroll_into_view_if_needed()
    assert page.locator("[data-story-entry]").last.count() == 1


def test_held_number_key_is_consumed_until_keyup_then_fresh_key_works(page):
    open_fixture(page)
    page.keyboard.down("1")
    assert page.locator("#ev-sheet").get_attribute("data-story-step") == "decision"
    page.keyboard.down("1")  # browser repeat while the original key is held
    assert page.locator("#ev-sheet").get_attribute("data-story-phase") == "event"
    page.keyboard.up("1")
    page.keyboard.press("1")
    assert page.locator("#ev-sheet").get_attribute("data-story-phase") == "outcome"


def test_pointer_tap_advances_only_once_and_fresh_tap_works_immediately(page):
    open_fixture(page)
    final_visible = page.locator("[data-story-entry]").last.bounding_box()
    page.mouse.click(final_visible["x"] + final_visible["width"] / 2,
                     final_visible["y"] + final_visible["height"] / 2)
    assert page.locator("#ev-sheet").get_attribute("data-story-step") == "decision"
    assert page.locator("#ev-sheet").get_attribute("data-story-phase") == "event"
    page.locator(".event-choice-dock .choice[data-i]").first.click()
    assert page.locator("#ev-sheet").get_attribute("data-story-phase") == "outcome"
