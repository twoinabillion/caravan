#!/usr/bin/env python3
"""Capture the named Miryang NPC portrait states in the current Chrome build."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
URL = (ROOT / "서울까지400km.html").as_uri()


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome")
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(URL)
    page.evaluate(
        """() => {
          localStorage.clear(); G.newGame('onroad','다온','full');
          document.querySelectorAll('.scr,.screen').forEach(node=>node.classList.remove('on'));
          document.querySelector('#scr-game').classList.add('on');
          document.querySelector('#arrival-scene')?.classList.remove('on');
          S.at='miryang'; S.known=[...new Set([...S.known,'miryang'])];
          S.visited=[...new Set([...S.visited,'miryang'])];
          UI.renderAll(); UI.showStl('miryang','people');
        }"""
    )
    page.wait_for_timeout(250)
    page.screenshot(path=OUT / "01-miryang-people.png")

    for index, npc_id in enumerate(("byungchul", "yeongok"), start=2):
        page.click(f'[data-npc="{npc_id}"]')
        page.wait_for_timeout(150)
        page.screenshot(path=OUT / f"0{index}-{npc_id}-dialogue.png")

    assert not errors, errors
    browser.close()
