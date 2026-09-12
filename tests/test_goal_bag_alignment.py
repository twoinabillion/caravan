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
    page.evaluate("window.__CARAVAN_TEST_AUTO_MS=12")
    for _ in range(240):
        state = page.evaluate(
            "()=>({opening:!!S.opening?.completed,main:!!S.flags?.main_mission_started,"
            "event:document.querySelector('#ev-wrap')?.classList.contains('on')})"
        )
        if state["opening"] and state["main"] and not state["event"]:
            break
        control = page.locator(
            "#ev-sheet .story-next:visible:not([disabled]),"
            "#ev-sheet .onboarding-route-start:visible:not([disabled]),"
            "#ev-sheet [data-i]:visible:not([disabled]),"
            "#ev-sheet [data-r]:visible:not([disabled]),"
            "#ev-sheet .primary-exit-btn:visible:not([disabled])"
        )
        if control.count():
            control.first.click()
        page.wait_for_timeout(30)
    page.evaluate("delete window.__CARAVAN_TEST_AUTO_MS")
    coherent = page.evaluate(
        "()=>S.opening?.completed&&S.flags?.main_mission_started&&"
        "!document.querySelector('#ev-wrap')?.classList.contains('on')"
    )
    assert coherent, "opening/onboarding UI flow did not reach the road HUD"


def box(page, selector):
    result = page.evaluate(
        "selector => { const node=document.querySelector(selector); "
        "if(!node) return null; const r=node.getBoundingClientRect(); "
        "return {x:r.x,y:r.y,width:r.width,height:r.height}; }",
        selector,
    )
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
    page.wait_for_function(
        "document.querySelector('#quest-ledger').getAttribute('aria-hidden') === 'false'"
    )
    page.wait_for_timeout(120)
    assert not page.locator("#ovl-status").evaluate(
        "node => node.classList.contains('on')"
    )
    ledger = box(page, "#quest-ledger")
    assert ledger["width"] <= min(width, 480) + 1
    assert abs((ledger["x"] * 2 + ledger["width"]) - width) <= 1
    tabs = page.locator("[data-quest-tab]")
    assert tabs.evaluate_all("nodes => nodes.map(node => node.dataset.questTab)") == [
        "main", "side", "completed"
    ]
    assert tabs.first.get_attribute("aria-selected") == "true"
    assert tabs.first.evaluate("node => node.classList.contains('active')")
    card = page.locator(".quest-ledger-card.quest-kind-main").first
    assert card.is_visible()
    card_text = card.inner_text()
    for label in ("왜 이 일을 하나", "지금 할 일", "길을 놓쳤다면"):
        assert label in card_text, (label, card_text)
    assert card.locator(".quest-main-steps").count() == 1
    list_box = box(page, ".quest-ledger-list")
    card_box = box(page, ".quest-ledger-card.quest-kind-main")
    assert card_box["x"] >= list_box["x"] + 8
    assert card_box["x"] + card_box["width"] <= list_box["x"] + list_box["width"] - 8
    assert page.locator(".quest-ledger-list").evaluate(
        "node => node.scrollWidth <= node.clientWidth + 1"
    )
    page.locator(".quest-ledger-list").evaluate(
        "node => { const card=node.querySelector('.quest-ledger-card'); "
        "for(let i=0;i<3;i++) node.append(card.cloneNode(true)); node.scrollTop=node.scrollHeight; }"
    )
    assert page.locator(".quest-ledger-list").evaluate(
        "node => node.scrollTop > 0 && node.scrollTop + node.clientHeight >= node.scrollHeight - 1"
    )
    for tab in ("side", "completed", "main"):
        page.click(f'[data-quest-tab="{tab}"]')
        assert page.locator(f'[data-quest-tab="{tab}"]').get_attribute("aria-selected") == "true"
        assert page.locator(".quest-ledger-list").evaluate(
            "node => node.scrollWidth <= node.clientWidth + 1"
        )

    page.click("#dk-road")
    page.wait_for_timeout(80)
    page.locator(".nav-route-map[data-open-map]").evaluate("node => node.click()")
    page.wait_for_timeout(80)
    assert page.locator("#ovl-map .map-tool-tabs").count() == 0
    assert page.locator("#ovl-map [data-road-tool]").count() == 0
    assert page.locator("#mission-strip").evaluate("node => node.tagName") == "DIV"

    page.click("#dk-status")
    page.wait_for_timeout(120)
    assert page.locator("#quest-ledger").get_attribute("aria-hidden") == "true"
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
    for pocket, count, icon in zip(pocket_boxes, count_boxes, icon_boxes):
        pocket_center = pocket["x"] + pocket["width"] / 2
        count_center = count["x"] + count["width"] / 2
        icon_center = icon["x"] + icon["width"] / 2
        assert pocket["x"] <= count_center <= pocket["x"] + pocket["width"]
        assert pocket["x"] <= icon_center <= pocket["x"] + pocket["width"]
        assert pocket["x"] >= bag_prop["x"] - 1
        assert pocket["x"] + pocket["width"] <= bag_prop["x"] + bag_prop["width"] + 1
        assert pocket["y"] <= count["y"] <= pocket["y"] + pocket["height"]

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

    # Goal and Bag own separate surfaces and must never remain open together.
    # Repeated switching preserves that mutual exclusion.
    for _ in range(2):
        page.click("#dk-objectives")
        page.wait_for_timeout(80)
        assert page.locator("#quest-ledger").get_attribute("aria-hidden") == "false"
        assert not page.locator("#ovl-status").evaluate("node => node.classList.contains('on')")
        assert page.locator("#ovl-status").get_attribute("aria-hidden") == "true"
        assert not page.locator("#st-body .bag-live-content").is_visible()
        page.click("#dk-status")
        page.wait_for_timeout(80)
        assert page.locator("#status-prop").get_attribute("data-tool-surface") == "bag"
        assert page.locator("#quest-ledger").get_attribute("aria-hidden") == "true"
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
