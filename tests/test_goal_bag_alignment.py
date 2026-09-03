#!/usr/bin/env python3
"""Regression coverage for the shared Goal/Bag visual alignment rails."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = (ROOT / "서울까지400km.html").as_uri()


def enter_game(page):
    page.goto(URL)
    page.click("#bt-new")
    if page.locator("#scr-mode").is_visible():
        page.click("#mode-on")
    page.fill("#inp-name", "정렬 점검")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(220)
    page.evaluate(
        """()=>{
          document.querySelector('#arrival-scene').classList.remove('on');
          document.querySelector('#ev-wrap')?.classList.remove('on');
          S.flags.main_mission_started=true;
          S.flags.onboarding_mission_seen=true;
          S._storyQueue=[]; S._chain=null;
          UI.renderAll();
          document.querySelector('#ev-wrap')?.classList.remove('on');
        }"""
    )


def box(page, selector):
    result = page.locator(selector).bounding_box()
    assert result, f"missing bounds for {selector}"
    return result


def assert_same_rail(reference, candidate, label, tolerance=1.0):
    left = abs(reference["x"] - candidate["x"])
    right = abs(
        (reference["x"] + reference["width"])
        - (candidate["x"] + candidate["width"])
    )
    assert left <= tolerance and right <= tolerance, (
        f"{label} rail mismatch: left={left:.2f}px right={right:.2f}px "
        f"reference={reference} candidate={candidate}"
    )


def check_viewport(playwright, width, height):
    browser = playwright.chromium.launch(channel="chrome")
    page = browser.new_page(viewport={"width": width, "height": height})
    page.add_init_script(
        "localStorage.clear(); localStorage.setItem('caravan_story_auto','0')"
    )
    enter_game(page)

    page.evaluate("document.querySelector('#dk-objectives').click()")
    page.wait_for_function("document.querySelector('#ovl-status').classList.contains('on')")
    goal_prop = box(page, "#status-prop")
    assert abs(goal_prop["width"] / goal_prop["height"] - 720 / 1120) <= 0.003
    goal_left_gutter = goal_prop["x"]
    goal_right_gutter = width - goal_prop["x"] - goal_prop["width"]
    assert goal_left_gutter >= 7.5 and goal_right_gutter >= 7.5
    assert abs(goal_left_gutter - goal_right_gutter) <= 1.0
    goal_reference = box(page, ".folio-live-content>h3")
    for selector in (
        ".folio-title-row",
        ".folio-progress",
        ".folio-clue",
    ):
        assert_same_rail(goal_reference, box(page, selector), f"goal {selector}")
    assert abs(goal_reference["x"] - box(page, ".folio-location")["x"]) <= 1
    goal_frame_reference = box(page, ".folio-support")
    assert_same_rail(
        goal_frame_reference,
        box(page, ".folio-road-button"),
        "goal printed frame/button",
    )
    assert 0 <= goal_reference["x"] - goal_frame_reference["x"] <= 4, (
        goal_reference,
        goal_frame_reference,
    )
    assert page.locator(".prop-edge-tabs").count() == 0
    assert page.locator('.folio-location[data-road-tool]').count() == 0
    assert page.locator('.folio-location').evaluate("node => node.tagName") == "DIV"
    assert "지도에서 보기" not in page.locator('.folio-location').inner_text()
    assert page.locator('[data-road-tool]').count() == 1
    assert page.locator('[data-road-tool]').get_attribute('data-road-tool') == 'road'
    support = box(page, ".folio-support")
    support_copy = box(page, ".folio-support>b")
    support_meta = box(page, ".folio-support-meta")
    road_button = box(page, ".folio-road-button")
    clue_border = page.locator(".folio-clue").evaluate(
        "node => getComputedStyle(node).borderTopWidth"
    )
    assert clue_border == "0px", "the coded clue frame must not double the raster frame"
    page.locator(".folio-clue>span").evaluate(
        "node => node.textContent = '확인된 단서'"
    )
    page.locator(".folio-clue>b").evaluate(
        "node => node.textContent = '부모님의 수정안'"
    )
    page.locator(".folio-clue>p").evaluate(
        "node => node.textContent = "
        "'엄마와 아빠는 강제 명령 앞에 인간 확인을 돌려놓으려 했다.'"
    )
    clue = box(page, ".folio-clue")
    clue_label = box(page, ".folio-clue>span")
    clue_title = box(page, ".folio-clue>b")
    clue_copy = box(page, ".folio-clue>p")
    assert clue_label["y"] - clue["y"] >= 5
    assert clue_title["y"] - (clue_label["y"] + clue_label["height"]) >= 1.5
    assert clue_copy["y"] - (clue_title["y"] + clue_title["height"]) >= 1.5
    assert clue["y"] + clue["height"] - (clue_copy["y"] + clue_copy["height"]) >= 5
    clue_overflow = page.locator(".folio-clue").evaluate(
        "node => ({scrollHeight:node.scrollHeight,clientHeight:node.clientHeight})"
    )
    assert clue_overflow["scrollHeight"] <= clue_overflow["clientHeight"] + 1
    support_top_ratio = (support["y"] - goal_prop["y"]) / goal_prop["height"]
    assert 0.48 <= support_top_ratio <= 0.64, (
        f"goal action frame missed the printed folio slot: {support_top_ratio:.4f}"
    )
    assert road_button["y"] - (support["y"] + support["height"]) <= 8, (
        support,
        road_button,
    )
    assert support_copy["y"] >= support["y"]
    assert support_copy["y"] + support_copy["height"] < support_meta["y"]
    assert support_meta["y"] >= support["y"] + support["height"] * 0.55
    assert support_meta["y"] + support_meta["height"] <= support["y"] + support["height"]

    page.click("#dk-road")
    page.wait_for_timeout(80)
    page.click(".nav-route-map[data-open-map]")
    page.wait_for_timeout(80)
    assert page.locator("#ovl-map .map-tool-tabs").count() == 0
    assert page.locator("#ovl-map [data-road-tool]").count() == 0
    assert page.locator("#mission-strip").evaluate("node => node.tagName") == "DIV"

    page.click("#dk-status")
    page.wait_for_timeout(120)
    bag_prop = box(page, "#status-prop")
    bag_left_gutter = bag_prop["x"]
    bag_right_gutter = width - bag_prop["x"] - bag_prop["width"]
    assert bag_left_gutter >= 7.5 and bag_right_gutter >= 7.5
    assert abs(bag_left_gutter - bag_right_gutter) <= 1.0
    assert_same_rail(
        box(page, ".bag-critical"),
        box(page, ".bag-title-row"),
        "bag title/resource",
    )
    assert page.locator(".bag-title-row").is_visible()
    assert page.locator(".bag-tool-tabs").count() == 0
    assert page.locator(".bag-growth-shortcut").count() == 0
    supply_text = page.locator(".bag-journey-overview").inner_text()
    for label in ("보급 계획", "차량 상태", "다음 식사", "필요", "하루 소비", "허기"):
        assert label in supply_text, (label, supply_text)
    critical_text = page.locator(".bag-critical").inner_text()
    assert critical_text.count("/") == 3, critical_text

    flow_boxes = page.locator(
        ".bag-live-content>.bag-title-row,.bag-live-content>.bag-critical,"
        ".bag-live-content>.bag-journey-overview,.bag-live-content>.bag-pockets,"
        ".bag-live-content>.bag-detail"
    ).evaluate_all(
        """nodes => nodes.map(node => {
          const r=node.getBoundingClientRect();
          return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};
        })"""
    )
    assert len(flow_boxes) == 5
    for previous, current in zip(flow_boxes, flow_boxes[1:]):
        assert previous["bottom"] <= current["top"] + 1, (previous, current)
    assert max(item["right"] for item in flow_boxes) <= bag_prop["x"] + bag_prop["width"] + 1
    assert min(item["left"] for item in flow_boxes) >= bag_prop["x"] - 1

    pocket_boxes = page.locator(".bag-pocket").evaluate_all(
        """nodes => nodes.map(node => {
          const r = node.getBoundingClientRect();
          return {x:r.x,y:r.y,width:r.width,height:r.height};
        })"""
    )
    count_boxes = page.locator(".bag-pocket-count").evaluate_all(
        """nodes => nodes.map(node => {
          const r = node.getBoundingClientRect();
          return {x:r.x,y:r.y,width:r.width,height:r.height};
        })"""
    )
    icon_boxes = page.locator(".bag-pocket .ico").evaluate_all(
        """nodes => nodes.map(node => {
          const r = node.getBoundingClientRect();
          return {x:r.x,y:r.y,width:r.width,height:r.height};
        })"""
    )
    assert len(pocket_boxes) == len(count_boxes) == len(icon_boxes) == 4
    assert max(abs(item["y"] - pocket_boxes[0]["y"]) for item in pocket_boxes) <= 0.5
    assert max(abs(item["y"] - count_boxes[0]["y"]) for item in count_boxes) <= 0.5
    for pocket, count, icon in zip(pocket_boxes, count_boxes, icon_boxes):
        pocket_center = pocket["x"] + pocket["width"] / 2
        count_center = count["x"] + count["width"] / 2
        icon_center = icon["x"] + icon["width"] / 2
        assert pocket["x"] <= count_center <= pocket["x"] + pocket["width"]
        assert abs(icon_center - pocket_center) <= 1

    first_pocket = page.locator(".bag-pocket").first
    selected_style = page.locator(".bag-pocket.selected").evaluate(
        """node => ({
          borderColor:getComputedStyle(node).borderColor,
          boxShadow:getComputedStyle(node).boxShadow
        })"""
    )
    assert selected_style["borderColor"] != "rgba(0, 0, 0, 0)"
    assert selected_style["boxShadow"] != "none"
    assert first_pocket.get_attribute("aria-pressed") == "true"

    page.click('[data-bag-item="의약품"]')
    page.wait_for_timeout(80)
    detail_panel = box(page, ".bag-detail")
    detail_reference = box(page, ".bag-detail-copy")
    assert_same_rail(
        detail_reference, box(page, ".bag-detail-heading"), "bag detail heading"
    )
    assert detail_reference["y"] >= detail_panel["y"] - 0.5
    assert (
        detail_reference["y"] + detail_reference["height"]
        <= detail_panel["y"] + detail_panel["height"] + 0.5
    ), f"bag detail overflow: panel={detail_panel} copy={detail_reference}"
    selected = page.locator('[data-bag-item="의약품"]')
    assert selected.get_attribute("aria-pressed") == "true"
    assert page.locator(".bag-detail-heading span").inner_text() == "의약품"
    assert page.locator(".bag-detail-heading b").inner_text().endswith("개")
    assert page.locator('[data-bag-action="의약품"]').count() == 0

    numeric_variant = page.locator(".bag-pocket-count b").first.evaluate(
        "node => getComputedStyle(node).fontVariantNumeric"
    )
    assert "tabular-nums" in numeric_variant

    # A selected bag slot must not survive either visually or in the DOM after
    # switching to Goal. Repeated switching must preserve that isolation.
    for _ in range(2):
        page.click("#dk-objectives")
        page.wait_for_timeout(80)
        assert page.locator("#status-prop").get_attribute("data-tool-surface") == "goal"
        assert page.locator("#st-body .bag-live-content,#st-body .bag-pocket,#st-body .bag-detail").count() == 0
        assert page.locator("#st-body .folio-live-content").count() == 1
        page.click("#dk-status")
        page.wait_for_timeout(80)
        assert page.locator("#status-prop").get_attribute("data-tool-surface") == "bag"
        assert page.locator("#st-body .folio-live-content,#st-body .folio-progress,#st-body .folio-clue").count() == 0
        assert page.locator("#st-body .bag-live-content").count() == 1
    browser.close()


with sync_playwright() as playwright:
    check_viewport(playwright, 320, 578)
    check_viewport(playwright, 375, 553)
    check_viewport(playwright, 390, 844)
    check_viewport(playwright, 360, 700)
    check_viewport(playwright, 462, 832)
    check_viewport(playwright, 476, 809)
    print(
        "✅ 목표·가방 정렬·넘침 · "
        "320x578 / 375x553 / 360x700 / 390x844 / 462x832 / 476x809"
    )
