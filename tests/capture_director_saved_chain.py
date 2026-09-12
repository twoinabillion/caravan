"""Live continuation of an explicitly seeded partial save, not a fresh campaign."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/director-pass-2026-09-11/task3-review2'
OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch()
 page=browser.new_page(viewport={'width':390,'height':844})
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script("localStorage.setItem('caravan_story_auto','0')")
 page.goto('http://localhost:4176/game?caravan-live=1')
 page.evaluate('''()=>{
  G.newGame('onroad','하린','full');S.at='suwon';S.stats.km=430;
  ['first_order_trace','parents_routes_traced','parent_key_located','parent_cache_shared'].forEach(f=>S.flags[f]=true);
  S._chain='story_parent_route_shared';G.save();
 }''')
 page.reload()
 page.wait_for_function("S&&S.at==='suwon'")
 before=page.evaluate('''()=>({at:S.at,chain:S._chain,key:!!S.flags.parent_key_found,time:S.day*1440+S.min})''')
 assert before['chain']=='story_parent_route_shared' and not before['key']
 assert not page.evaluate('G.isInfiniteResourceMode()')
 # A resumed save has no generic restored result modal. Resolve the current
 # exchange testimony through UI; its normal result close consumes the saved chain.
 page.evaluate("G.openEventById('main_transfer_testimony');UI.finishStory()")
 page.locator('#ev-sheet [data-i="0"]').click()
 page.evaluate('UI.finishStory()')
 page.locator('#ev-sheet [data-r="ok"]').click()
 page.wait_for_function("document.querySelector('#ev-sheet').dataset.eventId==='main_recovery_story_parent_route_shared'")
 page.evaluate('UI.finishStory()')
 page.wait_for_timeout(450)
 entry=page.locator('#ev-sheet').inner_text()
 page.screenshot(path=str(OUT/'saved-chain-choice.png'))
 page.locator('#ev-sheet .story-entry').first.scroll_into_view_if_needed()
 page.screenshot(path=str(OUT/'saved-chain-source.png'))
 pending=page.evaluate('''()=>({chain:S._chain,savedChain:JSON.parse(localStorage.getItem(SAVE_KEY))._chain,key:!!S.flags.parent_key_found,at:S.at})''')
 assert pending['chain'] is None and pending['savedChain'] is None and not pending['key'] and pending['at']=='suwon'
 assert '수원 북부 교환소' in entry and '서진이 부모님 상자' not in entry
 page.locator('#ev-sheet [data-i="0"]').click()
 page.evaluate('UI.finishStory()')
 page.wait_for_function("[...document.querySelectorAll('#ev-sheet .reward-pill')].length>0 && [...document.querySelectorAll('#ev-sheet .reward-pill')].every(e=>e.textContent.trim()&&Number(getComputedStyle(e).opacity)>.99)")
 result=page.locator('#ev-sheet').inner_text()
 page.screenshot(path=str(OUT/'saved-chain-result.png'))
 after=page.evaluate('''()=>({at:S.at,time:S.day*1440+S.min,key:!!S.flags.parent_key_found,partial:!!S.flags.parent_cache_shared,used:S.used,note:S.notes.at(-1)})''')
 assert after['key'] and not after['partial'] and after['at']=='suwon'
 assert 'story_parent_route_shared' not in after['used'] and '수원' in after['note']['body']
 assert after['time']==before['time'] # Both source chain choices have zero additional time.
 page.locator('#ev-sheet [data-r="ok"]').click()
 page.reload()
 page.wait_for_function('S&&S.flags.parent_key_found')
 persisted=page.evaluate('''()=>({key:!!S.flags.parent_key_found,chain:S._chain,at:S.at})''')
 assert persisted['key'] and not persisted['chain'] and persisted['at']=='suwon'
 assert not errors and '???' not in entry+result
 browser.close()
(OUT/'trace.json').write_text(json.dumps({'mode':'Explicit partial-save fixture; real live reload, choice/result continuation; no grants after setup; not fresh campaign evidence','before':before,'pending':pending,'entry':entry,'result':result,'after':after,'persisted':persisted,'errors':errors},ensure_ascii=False,indent=2))
print('PASS live saved-chain reload, truthful continuation, real extraction, persisted completion')
