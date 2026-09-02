#!/usr/bin/env python3
"""Finite water/food storage and settlement capacity UI contract."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = (ROOT / "서울까지400km.html").as_uri()


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome")
    page = browser.new_page(viewport={"width": 390, "height": 844})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(URL)
    initial = page.evaluate(
        """() => {
          localStorage.clear(); G.newGame('onroad','다온','full','keeper');
          document.querySelectorAll('.scr,.screen').forEach(node=>node.classList.remove('on'));
          document.querySelector('#scr-game').classList.add('on');
          S.at='miryang'; S.driving=null; UI.renderAll(); UI.showStl('miryang','hub');
          const resources=Object.fromEntries([...document.querySelectorAll('.stl-resource-strip>span')]
            .map(node=>[node.querySelector('small').textContent,node.querySelector('b').textContent]));
          return {water:S.water,waterMax:S.waterMax,food:S.food,foodMax:S.foodMax,resources};
        }"""
    )
    assert initial["waterMax"] == 28 and initial["foodMax"] == 24, initial
    assert initial["resources"]["물"] == "16/28", initial
    assert initial["resources"]["식량"] == "14/24", initial
    assert initial["resources"]["고철"] == "24" and "∞" not in initial["resources"]["고철"], initial
    assert initial["resources"]["부품"] == "1" and "∞" not in initial["resources"]["부품"], initial

    migrated = page.evaluate(
        """() => {
          const legacy=JSON.parse(JSON.stringify(S));
          legacy.v=6; delete legacy.waterMax; delete legacy.foodMax;
          legacy.water=99; legacy.food=99;
          localStorage.setItem(SAVE_KEY,JSON.stringify(legacy)); S=null;
          const ok=G.load();
          return {ok,v:S.v,water:S.water,waterMax:S.waterMax,food:S.food,foodMax:S.foodMax};
        }"""
    )
    assert migrated == {"ok": True, "v": 7, "water": 28, "waterMax": 28, "food": 24, "foodMax": 24}, migrated

    market = page.evaluate(
        """() => {
          S.at='daegu'; S.scrap=100; S.water=S.waterMax; S.food=S.foodMax;
          const waterIndex=D.stls.daegu.trade.findIndex(row=>row[1]==='water');
          const foodIndex=D.stls.daegu.trade.findIndex(row=>row[1]==='food');
          UI.showStl('daegu','market');
          const before=S.scrap, waterResult=G.trade('daegu',waterIndex), foodResult=G.trade('daegu',foodIndex);
          const bundleResult=G.tradeBundle('daegu');
          return {waterIndex,foodIndex,before,after:S.scrap,waterResult,foodResult,bundleResult};
        }"""
    )
    assert market["waterIndex"] >= 0 and market["foodIndex"] >= 0, market
    assert not market["waterResult"]["ok"] and "공간" in market["waterResult"]["why"], market
    assert not market["foodResult"]["ok"] and "공간" in market["foodResult"]["why"], market
    assert not market["bundleResult"]["ok"] and "공간" in market["bundleResult"]["why"], market
    assert market["after"] == market["before"], market
    for index in (market["waterIndex"], market["foodIndex"]):
        row = page.locator(f'[data-market-key="trade-{index}"]')
        assert row.get_attribute("data-unavailable") == "true"
        assert "보관 공간 부족" in row.inner_text()

    capped = page.evaluate(
        """() => {
          S.water=S.waterMax-1; S.food=S.foodMax-2;
          const water=G.addSupply('water',4), food=G.addSupply('food',5);
          return {water,food,state:{water:S.water,food:S.food}};
        }"""
    )
    assert capped["water"]["delta"] == 1 and capped["water"]["overflow"] == 3, capped
    assert capped["food"]["delta"] == 2 and capped["food"]["overflow"] == 3, capped
    assert capped["state"] == {"water": 28, "food": 24}, capped
    assert not errors, errors
    browser.close()

print("✅ 물·식량 적재 한도와 장터 차단 계약 통과")
