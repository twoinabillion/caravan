#!/usr/bin/env python3
"""Market Field Board contract, including distinct quest-note material."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
URL = (ROOT / "서울까지400km.html").as_uri()
BOOT = """() => {
  localStorage.clear(); G.newGame('onroad','다온','full');
  document.querySelectorAll('.scr,.screen').forEach(n=>n.classList.remove('on'));
  document.querySelector('#scr-game').classList.add('on');
  S.at='daegu'; S.known=[...new Set([...S.known,'daegu'])]; S.visited=[...new Set([...S.visited,'daegu'])];
  S.scrap=60; S.fuel=40; S.water=20; S.food=20; UI.renderAll(); UI.showStl('daegu','market');
}"""

with sync_playwright() as pw:
    browser = pw.chromium.launch(channel="chrome")
    for width, height in ((320, 578), (390, 844), (475, 844)):
        page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
        errors = []
        page.on("pageerror", lambda err: errors.append(str(err)))
        page.goto(URL)
        page.evaluate(BOOT)
        page.wait_for_timeout(120)
        board = page.locator('[data-field-board="market"]')
        assert board.count() == 1
        assert page.locator('.stl-section-hero').count() == 0
        assert board.locator('.dlg').count() == 0
        assert board.locator('#market-action').count() == 1
        assert board.locator('.field-board-row').count() >= 7
        assert board.locator('.field-board-note').count() >= 1
        assert board.locator('.field-board-chevron').count() == 0
        assert '의뢰' in board.inner_text() and '물자' in board.inner_text()
        assert '보유 고철' in board.inner_text() and '길 위 기본 보급' in board.inner_text()
        assert board.evaluate("node => node.scrollWidth <= node.clientWidth")
        assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
        assert board.locator('.field-board-row').evaluate_all(
            "nodes => nodes.every(node => node.getBoundingClientRect().height >= 44)")
        assert board.locator('.field-board-note').evaluate_all(
            "nodes => nodes.every(node => node.getBoundingClientRect().height >= 44)")
        before = page.evaluate("({scrap:S.scrap,water:S.water,food:S.food})")
        page.locator('#market-action').click()
        after = page.evaluate("({scrap:S.scrap,water:S.water,food:S.food})")
        assert after['scrap'] < before['scrap'] and after['water'] > before['water'] and after['food'] > before['food']
        assert not errors, errors
        page.close()
    browser.close()
print('✅ 장터 현장 판 320/390/475px 계약 통과')
