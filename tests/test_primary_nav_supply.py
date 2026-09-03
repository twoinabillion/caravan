#!/usr/bin/env python3
"""Focused regression for the companion dock, central map entry, and supply plan."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = "http://127.0.0.1:4173/game?caravan-live=1"


def enter_game(page):
    page.goto(URL, wait_until="domcontentloaded")
    page.click("#bt-new")
    if page.locator("#scr-mode").is_visible():
        page.click("#mode-on")
    page.fill("#inp-name", "보급 점검")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(220)
    page.evaluate(
        """
        document.querySelector('#arrival-scene').classList.remove('on');
        document.querySelector('#ev-wrap').classList.remove('on');
        S.flags.main_mission_started=true; S.flags.onboarding_mission_seen=true;
        S.van=82; S.water=14; S.food=14; S.fuel=28; S.hunger=0;
        UI.renderAll();
        document.querySelector('#ev-wrap').classList.remove('on');
        """
    )


def assert_inside(page, child_selector, parent_selector):
    result = page.evaluate(
        """([childSelector,parentSelector])=>{
          const child=document.querySelector(childSelector)?.getBoundingClientRect();
          const parent=document.querySelector(parentSelector)?.getBoundingClientRect();
          if(!child||!parent) return null;
          return {
            left:child.left>=parent.left-1,
            right:child.right<=parent.right+1,
            top:child.top>=parent.top-1,
            bottom:child.bottom<=parent.bottom+1
          };
        }""",
        [child_selector, parent_selector],
    )
    assert result and all(result.values()), (child_selector, parent_selector, result)


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 950, "height": 908})
        page.add_init_script(
            "localStorage.clear(); localStorage.setItem('caravan_story_auto','0')"
        )
        enter_game(page)

        dock_labels = page.locator("#dock button>span:last-child").all_text_contents()
        assert dock_labels == ["길", "목표", "동료", "가방", "메뉴"], dock_labels
        assert page.locator("#dk-map").count() == 0

        map_entry = page.locator(".nav-route-map[data-open-map]")
        assert map_entry.is_visible()
        assert page.locator(".nav-map-region").is_visible()
        assert "→" in page.locator(".nav-map-region").inner_text()
        assert "전체 지도" not in map_entry.inner_text()
        assert page.evaluate("getComputedStyle(document.querySelector('.nav-route-map'),'::before').backgroundImage !== 'none'")
        cue_geometry = page.evaluate(
            """()=>{
              const map=document.querySelector('.nav-route-map[data-open-map]').getBoundingClientRect();
              const cueNode=document.querySelector('.nav-map-open-cue');
              const cue=cueNode.getBoundingClientRect();
              const style=getComputedStyle(cueNode);
              const terrain=getComputedStyle(document.querySelector('.nav-route-map'),'::before');
              return {map:{left:map.left,right:map.right,top:map.top,bottom:map.bottom},
                cue:{left:cue.left,right:cue.right,top:cue.top,bottom:cue.bottom,width:cue.width,height:cue.height},
                style:{position:style.position,display:style.display,width:style.width,height:style.height,inset:style.inset,transform:style.transform},
                terrain:{size:terrain.backgroundSize,position:terrain.backgroundPosition,filter:terrain.filter,opacity:terrain.opacity}};
            }"""
        )
        assert cue_geometry["cue"]["width"] >= 24, cue_geometry
        assert cue_geometry["cue"]["height"] >= 24, cue_geometry
        assert cue_geometry["cue"]["left"] >= cue_geometry["map"]["left"], cue_geometry
        assert cue_geometry["cue"]["right"] <= cue_geometry["map"]["right"], cue_geometry
        assert cue_geometry["map"]["right"] - cue_geometry["cue"]["right"] <= 10, cue_geometry
        assert cue_geometry["map"]["bottom"] - cue_geometry["cue"]["bottom"] <= 10, cue_geometry
        page.screenshot(path="/tmp/caravan-route-map-entry.png", full_page=True)
        map_entry.click()
        assert page.locator("#ovl-map").get_attribute("aria-hidden") == "false"
        assert page.locator("#dk-road").get_attribute("aria-current") == "page"
        assert page.locator("#map-x").is_visible()
        page.screenshot(path="/tmp/caravan-map-open.png", full_page=True)
        page.click("#map-x")

        page.click("#dk-crew")
        assert page.locator("#ovl-status").get_attribute("aria-hidden") == "false"
        assert page.locator('#st-tabs [data-st="crew"]').get_attribute("aria-selected") == "true"
        assert page.locator("#st-tabs button").all_inner_texts() == ["내 상태", "동료", "능력"]
        assert "가방" not in page.locator("#st-tabs").inner_text()
        assert "목표" not in page.locator("#st-tabs").inner_text()
        page.click('#st-tabs [data-st="self"]')
        self_text = page.locator('[data-stpane="self"]').inner_text()
        for label in ("현재 몸 상태", "피로", "허기", "부상", "운전 숙련"):
            assert label in self_text, (label, self_text)
        page.screenshot(path="/tmp/caravan-self-status.png", full_page=True)
        page.click('#st-tabs [data-st="growth"]')
        growth_text = page.locator('[data-stpane="growth"]').inner_text()
        assert "운전사 성장 경로" in growth_text
        assert "동료 스킬 경로" in growth_text
        page.click('#st-tabs [data-st="crew"]')
        page.screenshot(path="/tmp/caravan-companion-entry.png", full_page=True)
        page.click("#dk-road")

        page.click("#dk-status")
        assert page.locator(".bag-journey-overview").is_visible()
        supply_text = page.locator(".bag-journey-overview").inner_text()
        for label in ("보급 계획", "차량 상태", "다음 식사", "필요", "하루 소비", "허기"):
            assert label in supply_text, (label, supply_text)
        assert "여정 · 식사 상태" not in page.locator("#st-body").inner_text()
        assert page.locator(".bag-critical").inner_text().count("/") == 3
        assert page.locator(".bag-growth-shortcut").count() == 0
        for child in (
            ".bag-title-row",
            ".bag-critical",
            ".bag-journey-overview",
            ".bag-pockets",
            ".bag-detail",
        ):
            assert_inside(page, child, "#status-prop")
        page.screenshot(path="/tmp/caravan-supply-nav.png", full_page=True)
        page.click("#dk-road")

        page.click("#dk-menu")
        menu_text = page.locator("#ovl-menu").inner_text()
        assert "GROWTH" not in menu_text
        assert "성장 기록 보기" not in menu_text
        assert "화면 밝기" in menu_text and "소리" in menu_text and "저장" in menu_text
        page.click("#menu-x")

        page.locator(".nav-destination-card.is-selected").click()
        page.wait_for_timeout(180)
        driving_map_entry = page.locator(".travel-destination-visual[data-open-map]")
        assert driving_map_entry.is_visible()
        driving_map_entry.click()
        assert page.locator("#ovl-map").get_attribute("aria-hidden") == "false"
        page.click("#map-x")
        assert page.evaluate("Boolean(S.driving)")

        page.set_viewport_size({"width": 786, "height": 692})
        page.click("#dk-status")
        compact_scroll = page.locator(".bag-live-content").evaluate(
            "node => ({clientWidth:node.clientWidth,scrollWidth:node.scrollWidth,clientHeight:node.clientHeight,scrollHeight:node.scrollHeight})"
        )
        assert compact_scroll["scrollWidth"] <= compact_scroll["clientWidth"] + 1, compact_scroll
        compact_flow = page.locator(
            ".bag-live-content>.bag-title-row,.bag-live-content>.bag-critical,"
            ".bag-live-content>.bag-journey-overview,.bag-live-content>.bag-pockets,"
            ".bag-live-content>.bag-detail"
        ).evaluate_all(
            "nodes => nodes.map(node => {const r=node.getBoundingClientRect(); return {top:r.top,bottom:r.bottom}})"
        )
        for previous, current in zip(compact_flow, compact_flow[1:]):
            assert previous["bottom"] <= current["top"] + 1, compact_flow
        page.screenshot(path="/tmp/caravan-supply-compact-top.png", full_page=True)
        page.locator(".bag-detail").scroll_into_view_if_needed()
        assert_inside(page, ".bag-detail", "#status-prop")
        page.screenshot(path="/tmp/caravan-supply-compact-bottom.png", full_page=True)
        page.click("#dk-road")

        browser.close()
    print("✅ 동료 도크 · 중앙 지도 · 보급 계획 회귀 점검 통과")


if __name__ == "__main__":
    main()
