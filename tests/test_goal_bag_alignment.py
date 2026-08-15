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
    browser = playwright.chromium.launch()
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
    assert goal_left_gutter >= 3.5 and goal_right_gutter >= 3.5
    assert abs(goal_left_gutter - goal_right_gutter) <= 1.0
    goal_reference = box(page, ".folio-live-content>h3")
    for selector in (
        ".folio-title-row",
        ".folio-progress",
        ".folio-clue",
        ".folio-support",
        ".folio-road-button",
    ):
        assert_same_rail(goal_reference, box(page, selector), f"goal {selector}")
    edge_tabs = page.locator(".prop-edge-tabs button").evaluate_all(
        """nodes => nodes.map(node => {
          const r = node.getBoundingClientRect();
          return {x:r.x,right:r.right,width:r.width,height:r.height};
        })"""
    )
    assert len(edge_tabs) == 2
    for tab in edge_tabs:
        assert tab["x"] >= 3.5 and tab["right"] <= width - 3.5, tab
        assert tab["width"] >= 44 and tab["height"] >= 44, tab
    support = box(page, ".folio-support")
    road_button = box(page, ".folio-road-button")
    assert road_button["y"] - (support["y"] + support["height"]) <= 8, (
        support,
        road_button,
    )

    page.click("#dk-status")
    page.wait_for_timeout(120)
    bag_prop = box(page, "#status-prop")
    assert abs(bag_prop["width"] / bag_prop["height"] - 720 / 1120) <= 0.003
    bag_left_gutter = bag_prop["x"]
    bag_right_gutter = width - bag_prop["x"] - bag_prop["width"]
    assert bag_left_gutter >= 3.5 and bag_right_gutter >= 3.5
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
    assert len(pocket_boxes) == len(count_boxes) == 5
    assert max(abs(item["y"] - pocket_boxes[0]["y"]) for item in pocket_boxes) <= 0.5
    assert max(abs(item["y"] - count_boxes[0]["y"]) for item in count_boxes) <= 0.5
    for pocket, count in zip(pocket_boxes, count_boxes):
        pocket_center = pocket["x"] + pocket["width"] / 2
        count_center = count["x"] + count["width"] / 2
        assert abs(pocket_center - count_center) <= 0.5

    page.click('[data-bag-item="의약품"]')
    page.wait_for_timeout(80)
    detail_reference = box(page, ".bag-detail-copy")
    detail_panel = box(page, ".bag-detail")
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
    print("✅ 목표·가방 정렬·넘침 · 320x578 / 375x553 / 360x700 / 390x844")
