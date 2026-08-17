#!/usr/bin/env python3
"""Regression checks for the 2026-08-17 tool, stay-switch, and town-walk pass."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = (ROOT / "서울까지400km.html").as_uri()


def box(page, selector):
    result = page.locator(selector).bounding_box()
    assert result, selector
    return result


def assert_same_box(left, right, tolerance=0.5):
    for key in ("x", "y", "width", "height"):
        assert abs(left[key] - right[key]) <= tolerance, (left, right)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome")
    page = browser.new_page(viewport={"width": 390, "height": 844})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(URL)
    page.evaluate(
        """() => {
          localStorage.clear();
          G.newGame('onroad','다온','full');
          S.party=['minji','parkss','kangwoo','leo','jaeyi','eunsu'];
          document.querySelectorAll('.scr,.screen').forEach(node => node.classList.remove('on'));
          document.querySelector('#scr-game').classList.add('on');
          document.querySelector('#arrival-scene')?.classList.remove('on');
          UI.renderAll();
        }"""
    )
    page.wait_for_timeout(160)

    stage_before = box(page, "#stage")
    dock_before = box(page, "#dock")
    route_console = box(page, "#journey-mode-route .route-console")
    route_button = page.locator('button[data-journey-mode="route"]')
    assert route_button.get_attribute("aria-selected") == "true"
    assert route_button.evaluate(
        "node => getComputedStyle(node).boxShadow !== 'none'"
    )

    page.click('button[data-journey-mode="local"]')
    page.wait_for_timeout(100)
    local_console = box(page, "#journey-mode-local")
    assert abs(route_console["width"] - local_console["width"]) <= 1
    assert abs(route_console["height"] - local_console["height"]) <= 1
    assert_same_box(box(page, "#stage"), stage_before)
    assert_same_box(box(page, "#dock"), dock_before)
    assert page.locator('button[data-journey-mode="local"]').get_attribute("aria-selected") == "true"
    assert page.locator(".journey-local-screen .stop-action-card").count() <= 4
    assert page.locator(".journey-local-screen").evaluate(
        "node => node.scrollHeight <= node.clientHeight + 1"
    )
    assert "하룻밤을 보낸다" not in page.locator("#journey-mode-local").inner_text()

    page.click("#dk-map")
    page.wait_for_timeout(180)
    map_samples = page.locator("#mapcv").evaluate(
        """canvas => {
          const ctx=canvas.getContext('2d'), data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
          let opaque=0; const colors=new Set();
          for(let i=0;i<data.length;i+=64){
            if(data[i+3]) opaque++;
            colors.add(`${data[i]}-${data[i+1]}-${data[i+2]}-${data[i+3]}`);
          }
          return {opaque,colors:colors.size};
        }"""
    )
    assert map_samples["opaque"] > 100 and map_samples["colors"] > 10, map_samples

    page.evaluate(
        """() => {
          document.querySelectorAll('.ovl.on').forEach(node => node.classList.remove('on'));
          S.at='daegu';
          S.known=[...new Set([...S.known,'daegu'])];
          S.visited=[...new Set([...S.visited,'daegu'])];
          UI.showStl('daegu','hub');
        }"""
    )
    page.wait_for_timeout(100)
    assert page.locator(".stl-hub-v2").evaluate(
        "node => node.scrollWidth === node.clientWidth"
    )
    page.click('[data-stlfocus="garage"]')
    assert page.locator(".stl-hub-v2").get_attribute("data-focus") == "garage"
    assert page.locator('[data-stlfocus="garage"]').get_attribute("aria-pressed") == "true"
    page.click('[data-town-comp="minji"]')
    assert page.locator("#ev-wrap").get_attribute("aria-hidden") == "false"

    browser.close()

assert not errors, errors
print("✅ 지도 렌더 · 목적지/머물기 고정 전환 · 4행 무스크롤 · 정착지 터치 이동/동료 대화")
