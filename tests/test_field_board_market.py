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
        assert board.locator('.field-board-budget').count() == 1
        budget = board.locator('.field-board-budget')
        assert budget.locator('[data-budget-stage]').count() == 3
        current = budget.locator('[data-budget-stage="current"] [data-budget-resource="고철"]')
        change = budget.locator('[data-budget-stage="change"] [data-budget-resource="고철"]')
        remaining = budget.locator('[data-budget-stage="after"] [data-budget-resource="고철"]')
        assert current.locator('i').inner_text() == '고철' and current.locator('b').inner_text() == '60'
        assert change.locator('i').inner_text() == '고철' and change.locator('b').inner_text() == '−5'
        assert remaining.locator('i').inner_text() == '고철' and remaining.locator('b').inner_text() == '55'
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
        updated = page.locator('.field-board-budget [data-budget-stage="current"] [data-budget-resource="고철"] b')
        assert updated.inner_text() == str(after['scrap'])
        assert not errors, errors
        page.close()

    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    page.goto(URL)
    page.evaluate(BOOT)
    page.evaluate("S.scrap=3; UI.showStl('daegu','market')")
    page.locator('[data-market-key="bundle"]').click()
    budget = page.locator('.field-board-budget')
    remaining = budget.locator('[data-budget-stage="after"] [data-budget-resource="고철"]')
    assert remaining.locator('b').inner_text() == '2' and remaining.locator('strong').inner_text() == '부족'
    assert page.locator('#market-action').is_disabled()
    page.close()

    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    page.goto(URL)
    page.evaluate(BOOT)
    sell = page.evaluate("""() => {
      const demand=G.stlDemand('daegu');
      if(demand.item==='식량') S.food=5; else S.items[demand.item]=2;
      UI.showStl('daegu','market'); return {price:demand.price,scrap:S.scrap};
    }""")
    page.locator('[data-market-key="sell"]').click()
    budget = page.locator('.field-board-budget-gain')
    assert budget.locator('[data-budget-stage="change"] b').inner_text() == f"+{sell['price']}"
    assert budget.locator('[data-budget-stage="after"] b').inner_text() == str(sell['scrap'] + sell['price'])
    assert '받음' in budget.get_attribute('aria-label') and '판매 후' in budget.get_attribute('aria-label')

    page.evaluate("""() => {
      S.at='muju'; S.known=[...new Set([...S.known,'muju'])]; S.visited=[...new Set([...S.visited,'muju'])];
      S.water=3; UI.showStl('muju','market');
    }""")
    page.locator('[data-market-key="trade-0"]').click()
    budget = page.locator('.field-board-budget-barter')
    assert budget.locator('[data-budget-stage="current"] b').inner_text() == '3'
    assert budget.locator('[data-budget-stage="change"] b').inner_text() == '−2'
    assert budget.locator('[data-budget-stage="after"] b').inner_text() == '1'
    assert '교환' in budget.get_attribute('aria-label') and '교환 후' in budget.get_attribute('aria-label')
    page.close()
    browser.close()
print('✅ 장터 현장 판 320/390/475px 계약 통과')
