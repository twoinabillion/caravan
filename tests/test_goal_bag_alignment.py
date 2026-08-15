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
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")


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

    page.click("#dk-objectives")
    page.wait_for_timeout(120)
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
    edge_tabs = page.locator(".prop-edge-tabs button").evaluate_all(
        """nodes => nodes.map(node => {
          const r = node.getBoundingClientRect();
          return {x:r.x,right:r.right,width:r.width,height:r.height};
        })"""
    )
    assert len(edge_tabs) == 3
    assert page.locator(".prop-edge-tabs button").all_inner_texts() == ["지도", "가방", "메뉴"]
    for tab in edge_tabs:
        assert tab["x"] >= 7.5 and tab["right"] <= width - 7.5, tab
        assert tab["width"] >= 44 and tab["height"] >= 44, tab
    page.click('.prop-edge-tabs [data-road-tool="menu"]')
    page.wait_for_timeout(80)
    assert "on" in (page.locator("#ovl-menu").get_attribute("class") or "").split()
    page.evaluate("document.querySelector('#dk-menu').click()")
    page.evaluate("document.querySelector('#dk-objectives').click()")
    page.wait_for_timeout(80)
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

    page.click("#dk-status")
    page.wait_for_timeout(120)
    bag_prop = box(page, "#status-prop")
    assert abs(bag_prop["width"] / bag_prop["height"] - 720 / 1120) <= 0.003
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
    name_boxes = page.locator(".bag-pocket-name").evaluate_all(
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
    assert len(pocket_boxes) == len(count_boxes) == len(name_boxes) == len(icon_boxes) == 5
    assert max(abs(item["y"] - pocket_boxes[0]["y"]) for item in pocket_boxes) <= 0.5
    assert max(abs(item["y"] - count_boxes[0]["y"]) for item in count_boxes) <= 0.5
    raster_pocket_centers = (0.1312, 0.3156, 0.5, 0.6844, 0.8688)
    for pocket, count, name, icon, expected_center in zip(
        pocket_boxes, count_boxes, name_boxes, icon_boxes, raster_pocket_centers
    ):
        pocket_center = pocket["x"] + pocket["width"] / 2
        count_center = count["x"] + count["width"] / 2
        name_center = name["x"] + name["width"] / 2
        icon_center = icon["x"] + icon["width"] / 2
        expected_content_center = pocket_center - pocket["width"] * 0.04
        for content_center in (count_center, name_center, icon_center):
            assert abs(content_center - expected_content_center) <= 0.8, (
                pocket,
                content_center,
                expected_content_center,
            )
        pocket_center_ratio = (pocket_center - bag_prop["x"]) / bag_prop["width"]
        assert abs(pocket_center_ratio - expected_center) <= 0.006, (
            f"bag pocket missed stitched slot: actual={pocket_center_ratio:.4f} "
            f"expected={expected_center:.4f}"
        )

    first_pocket = page.locator(".bag-pocket").first
    pocket_icon = box(page, ".bag-pocket:first-child .ico")
    pocket_icon_top_ratio = (pocket_icon["y"] - pocket_boxes[0]["y"]) / pocket_boxes[0][
        "height"
    ]
    assert 0.36 <= pocket_icon_top_ratio <= 0.38, pocket_icon_top_ratio
    selected_style = page.locator(".bag-pocket.selected").evaluate(
        """node => ({
          backgroundColor:getComputedStyle(node).backgroundColor,
          boxShadow:getComputedStyle(node).boxShadow,
          decoration:getComputedStyle(node.querySelector('.bag-pocket-name')).textDecorationLine
        })"""
    )
    assert selected_style["backgroundColor"] == "rgba(0, 0, 0, 0)"
    assert selected_style["boxShadow"] == "none"
    assert "underline" in selected_style["decoration"]
    assert first_pocket.get_attribute("aria-pressed") == "true"

    vehicle = box(page, ".bag-vehicle")
    detail_panel = box(page, ".bag-detail")
    vehicle_top_ratio = (vehicle["y"] - bag_prop["y"]) / bag_prop["height"]
    pocket_bottom_ratio = (
        pocket_boxes[0]["y"] + pocket_boxes[0]["height"] - bag_prop["y"]
    ) / bag_prop["height"]
    detail_left_ratio = (detail_panel["x"] - bag_prop["x"]) / bag_prop["width"]
    assert abs(vehicle_top_ratio - 0.177) <= 0.004, vehicle_top_ratio
    assert abs(pocket_bottom_ratio - 0.713) <= 0.004, pocket_bottom_ratio
    assert abs(detail_left_ratio - 0.08) <= 0.004, detail_left_ratio

    page.click('[data-bag-item="의약품"]')
    page.wait_for_timeout(80)
    detail_reference = box(page, ".bag-detail-copy")
    assert_same_rail(
        detail_reference, box(page, ".bag-detail-heading"), "bag detail heading"
    )
    assert_same_rail(
        detail_reference, box(page, ".bag-detail button"), "bag detail action"
    )
    assert detail_reference["y"] >= detail_panel["y"] - 0.5
    assert (
        detail_reference["y"] + detail_reference["height"]
        <= detail_panel["y"] + detail_panel["height"] + 0.5
    ), f"bag detail overflow: panel={detail_panel} copy={detail_reference}"
    selected = page.locator('[data-bag-item="의약품"]')
    assert selected.get_attribute("aria-pressed") == "true"
    assert page.locator(".bag-detail-heading span").inner_text() == "의약품"

    numeric_variant = page.locator(".bag-pocket-count b").first.evaluate(
        "node => getComputedStyle(node).fontVariantNumeric"
    )
    assert "tabular-nums" in numeric_variant
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
