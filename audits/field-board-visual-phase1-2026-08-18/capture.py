#!/usr/bin/env python3
"""Reproduce the original Daegu-market visual checkpoint against the final class."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
URL = (ROOT / "서울까지400km.html").as_uri()
VIEWPORTS = ((320, 578), (390, 844), (475, 844))
BOOT = """() => {
  localStorage.clear(); G.newGame('onroad','다온','full');
  document.querySelectorAll('.scr,.screen').forEach(node=>node.classList.remove('on'));
  document.querySelector('#scr-game').classList.add('on');
  S.at='daegu'; S.known=[...new Set([...S.known,'daegu'])]; S.visited=[...new Set([...S.visited,'daegu'])];
  S.scrap=60; S.fuel=40; S.water=20; S.food=20; UI.renderAll(); UI.showStl('daegu','market');
}"""

def rgb_channels(value):
    """Normalize Chrome's rgb() or color(srgb …) serialization to 0–255 channels."""
    numbers = [float(part) for part in re.findall(r"[0-9.]+", value)]
    if value.startswith("color(srgb"):
        return tuple(channel * 255 for channel in numbers[:3])
    return tuple(numbers[:3])

def within(actual, expected, tolerance=2):
    return all(abs(left - right) <= tolerance for left, right in zip(rgb_channels(actual), expected))

with sync_playwright() as pw:
    browser = pw.chromium.launch(channel="chrome")
    for width, height in VIEWPORTS:
        page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
        errors = []
        page.on("pageerror", lambda err: errors.append(str(err)))
        page.goto(URL)
        page.evaluate(BOOT)
        page.wait_for_timeout(100)
        board = page.locator('[data-field-board="market"]')
        assert board.count() == 1
        assert board.get_attribute("data-field-board-city") == "daegu"
        assert "field-board-visual-finish" in (board.get_attribute("class") or "")
        assert page.evaluate("document.documentElement.scrollWidth<=document.documentElement.clientWidth+1")
        assert board.evaluate("node=>node.scrollWidth<=node.clientWidth+1")
        assert board.locator(".field-board-row-meta").evaluate_all(
            "nodes=>nodes.every(node=>node.getBoundingClientRect().right<=innerWidth+1)")
        if width == 390:
            # Same DOM/state, preview class only: a fair surface-only before/after comparison.
            board.evaluate("node=>node.classList.remove('field-board-visual-finish')")
            page.screenshot(path=OUT / "before-daegu-market-390.png")
            board.evaluate("node=>node.classList.add('field-board-visual-finish')")
            metrics = board.evaluate("""node=>{
              const probe=document.createElement('i');
              const color=name=>{probe.style.color=`var(${name})`;node.appendChild(probe);const out=getComputedStyle(probe).color;probe.remove();return out};
              const after=getComputedStyle(node.querySelector('.field-board-head'),'::after');
              return {head:color('--fb-head-bg'),body:color('--fb-body-bg'),title:color('--fb-title'),
                dotsOpacity:after.opacity,dotsSize:after.backgroundSize};
            }""")
            assert within(metrics["head"], (45, 49, 51)), metrics
            assert within(metrics["body"], (30, 34, 36)), metrics
            assert within(metrics["title"], (239, 194, 129)), metrics
            assert metrics["dotsOpacity"] == "0.5" and metrics["dotsSize"] == "3px 3px", metrics
        page.screenshot(path=OUT / f"after-daegu-market-{width}.png")
        assert not errors, errors
        page.close()

    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    page.goto(URL)
    page.evaluate("""() => {
      localStorage.clear(); G.newGame('onroad','다온','full');
      document.querySelectorAll('.scr,.screen').forEach(node=>node.classList.remove('on'));
      document.querySelector('#scr-game').classList.add('on');
      S.at='miryang'; UI.renderAll(); UI.showStl('miryang','market');
    }""")
    assert page.locator('.field-board-visual-finish').count() == 1
    browser.close()

print("✅ 대구 장터 시각 마감 체크포인트 · 320/390/475px · 색 토큰 · 도트 격자 통과")
