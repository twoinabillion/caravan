"""Task7 functional fixtures, not earned preparation proof. Uses isolated live4176."""
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'artifacts/director-pass-2026-09-11/task7'
ART.mkdir(exist_ok=True)
raw=(ROOT/'artifacts/director-pass-2026-09-11/crew-preliminary.save.json').read_text()
rows=[]
only='--reachability-only' in sys.argv
with sync_playwright() as p:
    browser=p.chromium.launch()
    page=browser.new_page(viewport={'width':390,'height':844},accept_downloads=True)
    page.add_init_script("localStorage.setItem('caravan_story_auto','0')")
    page.goto('http://127.0.0.1:4176/game?caravan-live=1')
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    def seed(kind='crew',phase=None):
        page.evaluate('''({raw,kind,phase})=>{localStorage.setItem(SAVE_KEY,raw);G.load();
          S.pendingPresentation=null;S._chain=null;
          if(kind==='solo') S.party=[];
          if(kind==='six'){S.party=Object.keys(D.comps);for(const id of S.party)S.comps[id]={mood:85,bond:40,lvl:3,perks:[]};}
          if(phase)UI.showEvent(G.presentationEvent(phase));G.save()}''',{'raw':raw,'kind':kind,'phase':phase})
        page.reload();page.wait_for_timeout(700)
        if page.locator('#bt-continue').is_visible():page.locator('#bt-continue').click()
        page.wait_for_timeout(600)
    def capture(name):
        page.evaluate('UI.finishStory()');page.wait_for_timeout(250)
        sheet=page.locator('#ev-sheet')
        rows.append({'name':name,'event':sheet.get_attribute('data-event-id'),'phase':sheet.get_attribute('data-story-phase'),
          'text':sheet.inner_text(),'speakers':page.locator('#ev-sheet .chat-name').all_inner_texts()})
        assert '???' not in rows[-1]['speakers'],rows[-1]
        page.screenshot(path=str(ART/(name+'.png')))
    def choose(index=0):
        page.evaluate('UI.finishStory()')
        page.locator(f'#ev-sheet .choice[data-i="{index}"]').click()
    def close():
        page.evaluate('UI.finishStory()')
        page.locator('#ev-sheet [data-r=ok]').click();page.wait_for_timeout(650)
    for branch in range(0 if only else 3):
        seed();capture(f'branch-{branch}-decision')
        choose(branch);capture(f'branch-{branch}-result')
        close();capture(f'branch-{branch}-epilogue')
        choose();capture(f'branch-{branch}-night-result')
        close();choose();close();choose()
        page.wait_for_timeout(300)
        assert page.evaluate('S.ended&&S.flags.story_done')
        page.screenshot(path=str(ART/f'branch-{branch}-ending.png'))
        page.locator('#end-journal').click()
        with page.expect_download() as download:
            page.locator('#bt-export').click()
        download.value.save_as(str(ART/f'branch-{branch}-journey.md'))
    for kind in ([] if only else ['solo','six']):
        seed(kind,'seoul_core');capture(kind+'-core')
        choose(4 if kind=='solo' else 2);capture(kind+'-core-result')
        close();choose();close();choose();close()
        capture(kind+'-night');choose();capture(kind+'-night-result')
    for stop in ([] if only else ['seoul_han','seoul_ruins','seoul_square','seoul_base']):
        seed('crew',stop);capture(stop)
    # Current solo means party empty with the earned checkpoint's retained history.
    geometry=[]
    for width in [320,390]:
        page.set_viewport_size({'width':width,'height':844 if width==390 else 578})
        for phase,target,name in [('seoul_core','.choice[data-i="4"]','solo-journal'),
                                  ('seoul_decision','[data-finale-prepare]','preparation')]:
            seed('solo',phase);page.evaluate('UI.finishStory()');page.wait_for_timeout(200)
            listing=page.locator('#ev-sheet .event-choice-dock > .choices')
            listing.hover();page.mouse.wheel(0,900);page.wait_for_timeout(200)
            control=page.locator('#ev-sheet '+target)
            box=control.bounding_box()
            hit=page.evaluate("([x,y])=>document.elementFromPoint(x,y)?.closest('button')?.outerHTML",[box['x']+box['width']/2,box['y']+box['height']/2])
            assert hit and (('data-i="4"' in hit) if name=='solo-journal' else 'data-finale-prepare' in hit), (name,width,box,hit)
            page.screenshot(path=str(ART/f'{name}-{width}.png'))
            page.mouse.click(box['x']+box['width']/2,box['y']+box['height']/2)
            assert page.evaluate('S.pendingPresentation?.phase')=='result' if name=='solo-journal' else page.evaluate('S.at')=='suwon'
            geometry.append({'width':width,'control':name,'rect':box,'pointerReached':True})
    (ART/'control-reachability.json').write_text(json.dumps(geometry,indent=2))
    assert not errors,errors
    if rows: (ART/'fixture-captures.json').write_text(json.dumps({'fixture':True,'rows':rows,'errors':errors},ensure_ascii=False,indent=2))
    browser.close()
print('Verified 4 pointer targets' if only else f'Captured {len(rows)} fixture screens, 3 ending journal downloads and 4 pointer targets')
