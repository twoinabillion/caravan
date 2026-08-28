#!/usr/bin/env python3
"""Field Board rollout contract: seven cities, four facilities, three widths."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
URL = (ROOT / "서울까지400km.html").as_uri()
CITIES = ('gwangju','miryang','daegu','muju','jeonju','daejeon','suwon')
MODES = ('market','garage','people','alley')
VIEWPORTS = ((320,578),(390,844),(475,844))
BOOT = """({city,mode}) => {
  localStorage.clear(); G.newGame('onroad','다온','full');
  document.querySelectorAll('.scr,.screen').forEach(n=>n.classList.remove('on'));
  document.querySelector('#scr-game').classList.add('on');
  S.at=city; S.known=[...new Set([...S.known,city])]; S.visited=[...new Set([...S.visited,city])];
  S.scrap=999; S.fuel=40; S.water=99; S.food=99; S.van=60; S.items['부품']=99; S.items['의약품']=9;
  S.party=['minji']; S._stlField={daily:{},once:{},impact:{},log:[]}; UI.renderAll(); UI.showStl(city,mode);
}"""

with sync_playwright() as pw:
    browser = pw.chromium.launch(channel="chrome")
    for width,height in VIEWPORTS:
        page = browser.new_page(viewport={"width":width,"height":height}, device_scale_factor=1)
        errors=[]
        page.on('pageerror', lambda err: errors.append(str(err)))
        page.goto(URL)
        palettes=[]
        for city in CITIES:
            for mode in MODES:
                page.evaluate(BOOT, {'city':city,'mode':mode})
                page.wait_for_timeout(25)
                board=page.locator(f'[data-field-board="{mode}"]')
                assert board.count()==1,(width,city,mode)
                assert 'field-board-visual-finish' in (board.get_attribute('class') or ''),(width,city,mode)
                assert board.locator('.field-board-chevron').count()==0,(width,city,mode)
                assert page.locator('.stl-section-hero').count()==0,(width,city,mode)
                assert board.locator('.field-board-action > button').count()==1,(width,city,mode)
                assert board.evaluate('node=>node.scrollWidth<=node.clientWidth+1'),(width,city,mode)
                assert page.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'),(width,city,mode)
                assert board.locator('.field-board-row').evaluate_all(
                    'nodes=>nodes.length>0&&nodes.every(node=>node.getBoundingClientRect().height>=44)'),(width,city,mode)
                action=board.locator('.field-board-action')
                assert action.evaluate('node=>{const r=node.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1}'),(width,city,mode)
                assert page.locator('#stl-hub-back').count()==1,(width,city,mode)
                if mode=='market':
                    assert page.locator('#trade').count()==1
                    assert board.locator('.field-board-note').count()>=1,(width,city)
                    assert board.locator('.field-board-note').evaluate_all(
                        'nodes=>nodes.every(node=>node.getBoundingClientRect().height>=44)'),(width,city)
                if mode=='garage':
                    assert page.locator('#garage [data-ug]').count()==7
                    assert page.locator('#garage-van-cv').count()==1
                if mode=='people': assert page.locator('.stl-resident-list').count()==1
                if mode=='alley': assert page.locator('[data-fieldcard]').count()>=2,(width,city)
            page.evaluate(BOOT, {'city':city,'mode':'market'})
            palettes.append(page.locator('.field-board').evaluate(
                "node=>getComputedStyle(node).getPropertyValue('--fb-win').trim()"))
        assert len(set(palettes))==len(CITIES),(width,palettes)
        assert not errors,(width,errors)
        page.close()

    page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
    page.goto(URL)
    page.evaluate(BOOT, {'city':'daegu','mode':'garage'})
    before=page.evaluate('S.van')
    page.locator('[data-garage-key="repair"]').click()
    budget=page.locator('.field-board-budget')
    current=budget.locator('[data-budget-stage="current"] [data-budget-resource="고철"]')
    change=budget.locator('[data-budget-stage="change"] [data-budget-resource="고철"]')
    remaining=budget.locator('[data-budget-stage="after"] [data-budget-resource="고철"]')
    assert current.locator('b').inner_text()=='999'
    assert change.locator('b').inner_text()=='−6'
    assert remaining.locator('b').inner_text()=='993'
    assert budget.locator('[data-budget-resource]').evaluate_all(
        'nodes=>nodes.every(node=>node.scrollWidth<=node.clientWidth+1)')
    page.locator('#garage-action').click()
    assert page.evaluate('S.van')>before
    page.evaluate(BOOT, {'city':'daegu','mode':'people'})
    page.locator('[data-person-key="npc-taeho"]').click(); page.locator('#people-action').click()
    assert page.locator('#stl-talk-slot .dlg.talk').count()==1
    page.evaluate(BOOT, {'city':'miryang','mode':'alley'})
    page.locator('[data-fieldspot="noodles"]').click(); page.locator('#alley-action').click()
    assert page.locator('[data-field-result]').count()==1
    browser.close()
print('✅ 현장 판 7도시 × 4시설 × 3폭 및 대표 실행 동작 통과')
