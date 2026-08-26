#!/usr/bin/env python3
"""Focused regressions for the three-item menu and shared event action style."""

from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = (ROOT / "서울까지400km.html").as_uri()


def enter_game(page):
    page.goto(f"{URL}?caravan-live=1")
    page.click("#bt-new")
    page.fill("#inp-name", "메뉴 점검")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(220)
    page.evaluate(
        "document.querySelector('#arrival-scene').classList.remove('on'); "
        "document.querySelector('#ev-wrap').classList.remove('on'); "
        "S.flags.main_mission_started=true"
    )


def test_menu_contains_only_brightness_sound_and_save():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.add_init_script(
            "localStorage.clear(); localStorage.setItem('caravan_intro_auto','0'); "
            "localStorage.setItem('caravan_story_auto','0')"
        )
        enter_game(page)
        page.evaluate("UI.renderAll()")
        route_console = page.locator(".route-console-v3")
        assert route_console.is_visible()
        assert route_console.locator(".nav-route-ration").count() == 0
        assert "구간 배급" not in route_console.inner_text()
        page.click("#dk-menu")

        headings = page.locator("#menu-body .menu-control-card header b").all_inner_texts()
        assert headings == ["화면 밝기", "소리", "저장"]
        assert page.locator("#menu-body .menu-control-card").count() == 3
        menu_text = page.locator("#menu-body").inner_text()
        for removed in ["동료", "여행 일지", "야영", "인트로"]:
            assert removed not in menu_text

        page.locator("#menu-brightness").evaluate(
            "input => { input.value='80'; input.dispatchEvent(new Event('input',{bubbles:true})); }"
        )
        brightness = page.evaluate(
            "() => ({saved:localStorage.getItem('caravan_ui_brightness'), "
            "value:getComputedStyle(document.querySelector('#frame')).filter, "
            "label:document.querySelector('#menu-brightness-value').textContent})"
        )
        assert brightness == {"saved": "80", "value": "brightness(0.8)", "label": "80%"}

        page.click("#menu-save-now")
        assert page.locator("#menu-save-state").inner_text() == "방금 저장됨"
        assert page.evaluate("G.hasSave()")
        browser.close()


def test_next_and_return_buttons_share_the_same_visual_style():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.add_init_script(
            "localStorage.clear(); localStorage.setItem('caravan_intro_auto','0'); "
            "localStorage.setItem('caravan_story_auto','0')"
        )
        enter_game(page)
        page.evaluate("UI.showEvent(D.events.find(event => event.id==='lc_busan_dried'))")
        page.wait_for_timeout(80)
        next_style = page.locator(".story-next").evaluate(
            "button => { const s=getComputedStyle(button); return {height:s.height, background:s.backgroundColor, "
            "border:s.border, radius:s.borderRadius, color:s.color, font:s.font, shadow:s.boxShadow}; }"
        )
        return_style = page.evaluate(
            """() => {
              const sheet=document.querySelector('#ev-sheet');
              sheet.dataset.storyPhase='outcome';
              sheet.dataset.storyStep='result';
              const dock=sheet.querySelector('.event-choice-dock');
              dock.className='event-choice-dock';
              dock.innerHTML='<div class="choices"><button class="choice primary-exit-btn" data-r="ok"><span>길로 돌아가기</span></button></div>';
              const s=getComputedStyle(dock.querySelector('.primary-exit-btn'));
              return {height:s.height, background:s.backgroundColor, border:s.border,
                radius:s.borderRadius, color:s.color, font:s.font, shadow:s.boxShadow};
            }"""
        )
        assert return_style == next_style
        browser.close()


def test_onboarding_finishes_with_one_direct_road_button():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.add_init_script(
            "localStorage.clear(); localStorage.setItem('caravan_intro_auto','0'); "
            "localStorage.setItem('caravan_story_auto','0')"
        )
        enter_game(page)
        page.evaluate("S.flags.main_mission_started=false; UI.showEvent(D.onboardingMission)")
        direct = page.locator(".onboarding-route-start")
        assert direct.is_visible()
        assert direct.inner_text() == "길로 나가기"
        assert page.locator("#ev-sheet .choice-index").count() == 0
        assert "남산으로 가는 첫 길을 고른다" not in page.locator("#ev-sheet").inner_text()
        assert "부두 출구 앞에서 차를 세우고 수첩을 폈다" not in page.locator("#ev-sheet").inner_text()
        assert "남산까지 가는 동안" not in page.locator("#ev-sheet").inner_text()
        assert "남산의 강제 이송을 멈춘다" in page.locator("#ev-sheet .mission-brief h3").inner_text()
        assert "먼저 찾아야 할 것" not in page.locator("#ev-sheet .mission-brief").inner_text()
        assert "찾아야 할 것" in page.locator("#ev-sheet .mission-brief").inner_text()
        objective_lines = page.locator("#ev-sheet .mission-brief h3").evaluate(
            "heading => Math.round(heading.getBoundingClientRect().height / parseFloat(getComputedStyle(heading).lineHeight))"
        )
        assert objective_lines == 1
        assert not page.locator("#ev-sheet .story-reader").is_visible()
        scroll_state = page.locator("#ev-sheet .event-scroll").evaluate(
            "node => ({overflow:getComputedStyle(node).overflowY, client:node.clientHeight, scroll:node.scrollHeight})"
        )
        assert scroll_state["overflow"] == "hidden"
        assert scroll_state["scroll"] <= scroll_state["client"] + 1
        assert direct.evaluate(
            "button => { const dock=button.parentElement.getBoundingClientRect(); const box=button.getBoundingClientRect(); "
            "return Math.abs((box.left+box.right)/2-(dock.left+dock.right)/2)<1; }"
        )
        assert direct.evaluate(
            "button => getComputedStyle(button.querySelector('strong')).color === getComputedStyle(button).color"
        )

        direct.click()
        assert page.locator("#ev-wrap").get_attribute("aria-hidden") == "true"
        assert page.evaluate("S.flags.main_mission_started") is True
        browser.close()


def test_story_choices_use_centered_orange_actions_without_labels_or_inline_results():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.add_init_script(
            "localStorage.clear(); localStorage.setItem('caravan_intro_auto','0'); "
            "localStorage.setItem('caravan_story_auto','0')"
        )
        enter_game(page)
        page.evaluate(
            "S.scrap=99; S.food=10; "
            "UI.showEvent(D.events.find(event => event.id==='lc_busan_dried')); UI.finishStory()"
        )

        choices = page.locator("#ev-sheet .event-choice-dock button.choice")
        assert choices.count() == 2
        assert page.locator("#ev-sheet .choice-index").count() == 0
        assert page.locator("#ev-sheet .choice-cost-tag").count() == 0
        assert "(고철 4)" not in page.locator("#ev-sheet .event-choice-dock").inner_text()
        assert page.locator("#ev-sheet .choice-intent, #ev-sheet .combat-tactic").count() == 0
        assert choices.first.evaluate("button => getComputedStyle(button).backgroundColor") == "rgb(184, 117, 40)"
        assert choices.first.evaluate(
            "button => { const text=button.querySelector('.choice-title>span:last-child').getBoundingClientRect(); "
            "const box=button.getBoundingClientRect(); return Math.abs((text.left+text.right)/2-(box.left+box.right)/2)<1; }"
        )

        choices.filter(has_text="건어물을 산다").click()
        page.evaluate("UI.finishStory()")
        result = page.locator("#ev-sheet .reward-section")
        assert result.is_visible()
        assert result.locator(".reward-pill").count() >= 2
        assert "고철" in result.inner_text()
        assert "식량" in result.inner_text()
        browser.close()


def test_first_road_actions_are_plain_centered_text_and_report_the_record_afterward():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.add_init_script(
            "localStorage.clear(); localStorage.setItem('caravan_intro_auto','0'); "
            "localStorage.setItem('caravan_story_auto','0')"
        )
        enter_game(page)
        page.evaluate(
            "UI.showEvent(D.events.find(event => event.id==='onboarding_first_road')); UI.finishStory()"
        )

        choices = page.locator("#ev-sheet .event-choice-dock button.choice")
        assert choices.all_inner_texts() == [
            "차를 세우고 명령띠를 뽑는다",
            "전원을 끊고 단말을 통째로 연다",
            "스캔을 끝까지 받아 기록을 복사한다",
        ]
        assert page.locator("#ev-sheet .choice-intent, #ev-sheet .combat-tactic").count() == 0
        assert choices.evaluate_all(
            "buttons => buttons.every(button => { const text=button.querySelector('.choice-title>span').getBoundingClientRect(); "
            "const box=button.getBoundingClientRect(); return Math.abs((text.left+text.right)/2-(box.left+box.right)/2)<1; })"
        )

        choices.first.click()
        page.evaluate("UI.finishStory()")
        result = page.locator("#ev-sheet .reward-section")
        assert result.is_visible()
        assert result.locator(".event-result-kicker").inner_text() == "결과"
        assert "본편 단서 · 첫 번째 발신 기록" in result.inner_text()
        browser.close()
