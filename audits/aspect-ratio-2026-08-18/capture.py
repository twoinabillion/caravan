#!/usr/bin/env python3
"""Capture current UI surfaces that reuse canvases at several phone widths."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
URL = (ROOT / '서울까지400km.html').as_uri()
VIEWPORTS = ((320, 720), (390, 844), (475, 844))
BOOT = """() => {
  localStorage.clear(); G.newGame('onroad','다온','full');
  document.querySelectorAll('.scr,.screen').forEach(node=>node.classList.remove('on'));
  document.querySelector('#scr-game').classList.add('on');
  S.at='daegu'; S.known=[...new Set([...S.known,'daegu'])]; S.visited=[...new Set([...S.visited,'daegu'])];
  S.scrap=999; S.fuel=40; S.water=30; S.food=30; S.van=S.vanMax; S.items['부품']=99;
  S.party=['minji']; S.up={}; UI.renderAll();
}"""

def size(page, selector):
    return page.locator(selector).evaluate("node=>({w:node.clientWidth,h:node.clientHeight,ar:node.clientWidth/node.clientHeight})")

rows=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(channel='chrome')
    for width,height in VIEWPORTS:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        errors=[]
        page.on('pageerror',lambda err: errors.append(str(err)))
        page.goto(URL); page.evaluate(BOOT)

        page.evaluate("UI.showStl('daegu','garage')"); page.wait_for_timeout(180)
        garage=size(page,'#garage-van-cv')
        page.screenshot(path=OUT/f'01-garage-{width}.png')

        page.click('[data-ug="seating"]'); page.click('[data-garage-key="upgrade-bench"]'); page.click('#garage-action')
        page.wait_for_timeout(180)
        compare=size(page,'#up-before-van')
        page.screenshot(path=OUT/f'02-upgrade-compare-{width}.png')
        page.evaluate("document.querySelector('.upgrade-install')?.remove()")

        page.evaluate("UI.showStl('daegu','hub')"); page.wait_for_timeout(180)
        town=size(page,'#stl-town-canvas')
        page.screenshot(path=OUT/f'03-town-{width}.png')

        page.evaluate("document.querySelector('#ovl-stl').classList.remove('on'); UI.renderAll()")
        page.click('#dk-map'); page.wait_for_timeout(160)
        map_size=size(page,'#mapcv') if page.locator('#mapcv').count() else None
        page.screenshot(path=OUT/f'04-map-control-{width}.png')

        rows.append({'width':width,'garage':garage,'upgrade':compare,'town':town,'map':map_size,'errors':errors})
        page.close()
    browser.close()

print(json.dumps(rows,ensure_ascii=False,indent=2))
