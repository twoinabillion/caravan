"""Current live UI replays of records already earned by the no-grant campaign.
No outcomes are reapplied. These are layout/readability checks, not new play proof.
"""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'artifacts/director-pass-2026-09-11'
SAVE=(ART/'task3-conference-route.save.json').read_text()
OUT=ART/'task3-current-ui'
OUT.mkdir(exist_ok=True)
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch()
    for width,height in [(390,844),(320,578)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.add_init_script("localStorage.setItem('seoul400_save_v1',"+json.dumps(SAVE)+");localStorage.setItem('caravan_story_auto','0')")
        page.goto('http://localhost:4176/game?caravan-live=1')
        page.evaluate("G.load();UI.restoreQaView({screen:'game'})")
        assert not page.evaluate('G.isInfiniteResourceMode()')
        for event in ['main_transfer_testimony','main_command_ledger','main_relay_conference']:
            assert page.evaluate('(id)=>S.used.includes(id)',event)
            flags=page.evaluate('JSON.stringify(S.flags)')
            page.evaluate('(id)=>G.openEventById(id)',event)
            page.evaluate('UI.finishStory()')
            page.wait_for_timeout(400)
            assert '???' not in page.locator('#ev-sheet').inner_text()
            choice=page.locator('#ev-sheet [data-i="0"]').first
            choice.scroll_into_view_if_needed()
            box=choice.bounding_box()
            assert box and box['y']>=0 and box['y']+box['height']<=height+1,box
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
            assert flags==page.evaluate('JSON.stringify(S.flags)')
            page.screenshot(path=str(OUT/f'{event}-{width}.png'))
            results.append({'event':event,'width':width,'choice':box,'flagsUnchanged':True})
        assert not errors,errors
        page.close()
    browser.close()
(OUT/'checks.json').write_text(json.dumps({'mode':'Read-only current-scene replay from earned campaign save; no choice outcomes reapplied','checks':results},ensure_ascii=False,indent=2))
print('PASS 6 live mobile evidence replays, controls reachable, no unknown speakers, no flag changes')
