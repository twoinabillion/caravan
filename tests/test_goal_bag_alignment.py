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
    goal_reference = box(page, ".folio-live-content>h3")
    for selector in (
        ".folio-title-row",
        ".folio-progress",
        ".folio-clue",
        ".folio-support",
        ".folio-road-button",
    ):
        assert_same_rail(goal_reference, box(page, selector), f"goal {selector}")

    page.click("#dk-status")
    page.wait_for_timeout(120)
    assert_same_rail(
        box(page, ".bag-critical"),
        box(page, ".bag-title-row"),
        "bag title/resource",
    )
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
    assert_same_rail(
        detail_reference, box(page, ".bag-detail-heading"), "bag detail heading"
    )
    assert_same_rail(
        detail_reference, box(page, ".bag-detail button"), "bag detail action"
    )
    selected = page.locator('[data-bag-item="의약품"]')
    assert selected.get_attribute("aria-pressed") == "true"
    assert page.locator(".bag-detail-heading span").inner_text() == "의약품"

    numeric_variant = page.locator(".bag-pocket-count b").first.evaluate(
        "node => getComputedStyle(node).fontVariantNumeric"
    )
    assert "tabular-nums" in numeric_variant
    browser.close()


with sync_playwright() as playwright:
    check_viewport(playwright, 390, 844)
    check_viewport(playwright, 360, 700)
    print("✅ 목표·가방 정렬 레일 · 390x844 / 360x700")
