#!/usr/bin/env python3
"""Capture the complete 7-city x 4-facility Field Board rollout at 390px."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent
URL=(ROOT/'서울까지400km.html').as_uri()
CITIES=('gwangju','miryang','daegu','muju','jeonju','daejeon','suwon')
MODES=('market','garage','people','alley')
BOOT="""({city,mode})=>{
 localStorage.clear();G.newGame('onroad','다온','full');
 document.querySelectorAll('.scr,.screen').forEach(n=>n.classList.remove('on'));document.querySelector('#scr-game').classList.add('on');
 S.at=city;S.known=[...new Set([...S.known,city])];S.visited=[...new Set([...S.visited,city])];
 S.scrap=80;S.fuel=40;S.water=30;S.food=30;S.van=70;S.items['부품']=12;S.items['의약품']=4;S.party=['minji'];
 S._stlField={daily:{},once:{},impact:{},log:[]};UI.renderAll();UI.showStl(city,mode);
}"""
with sync_playwright() as pw:
    browser=pw.chromium.launch(channel='chrome')
    page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
    errors=[];page.on('pageerror',lambda err:errors.append(str(err)));page.goto(URL)
    for city in CITIES:
        for mode in MODES:
            page.evaluate(BOOT,{'city':city,'mode':mode});page.wait_for_timeout(80)
            page.screenshot(path=OUT/f'{city}-{mode}.png')
    browser.close()
    if errors: raise RuntimeError(errors)
