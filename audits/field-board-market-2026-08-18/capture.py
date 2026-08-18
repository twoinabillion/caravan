#!/usr/bin/env python3
"""Phase 1 field-board evidence: Daegu market at the three target widths."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
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
        page.wait_for_timeout(280)
        page.screenshot(path=OUT / f"market-{width}.png")
        if errors:
            raise RuntimeError(f"{width}px page errors: {errors}")
        page.close()
    browser.close()
