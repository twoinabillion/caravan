"""Live review fixtures, not a no-grant campaign: actual search/choice/result UI.
Late and companion-completed setup is explicit; no evidence is granted after setup.
"""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/director-pass-2026-09-11/task3-review1'
OUT.mkdir(exist_ok=True)
rows=[]
with sync_playwright() as p:
 browser=p.chromium.launch()
 for hybrid in [False,True]:
  page=browser.new_page(viewport={'width':390,'height':844})
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.add_init_script("localStorage.setItem('caravan_story_auto','0')")
  page.goto('http://localhost:4176/game?caravan-live=1')
  page.evaluate('''hybrid=>{
   G.newGame('onroad','하린','full');S.at='suwon';S.stats.km=430;
   if(hybrid){
    S.party=['minji','parkss','leo'];S.party.forEach(id=>S.comps[id].lvl=3);
    ['first_order_trace','parents_routes_traced','parent_key_found','father_fate_known','mother_reunited','mother_broadcast_ready','postman_letter'].forEach(f=>S.flags[f]=true);
   }
   G.save();UI.restoreQaView({screen:'game'});
   document.documentElement.classList.remove('qa-exact-replay');
  }''',hybrid)
  assert not page.evaluate('G.isInfiniteResourceMode()')
  for step in range(2 if hybrid else 1):
   before=page.evaluate('''() => ({at:S.at,time:S.day*1440+S.min,pursuit:S.pursuit,flags:{...S.flags},opportunity:G.mainEvidenceOpportunity()})''')
   name=before['opportunity']['event']
   assert page.evaluate('G.explore()')
   page.evaluate('UI.finishStory()')
   page.wait_for_timeout(450)
   entry=page.locator('#ev-sheet').inner_text()
   page.screenshot(path=str(OUT/f'{name}-choice.png'))
   page.locator('#ev-sheet .story-entry').first.scroll_into_view_if_needed()
   page.screenshot(path=str(OUT/f'{name}-source.png'))
   index=0 if hybrid else 2
   page.locator(f'#ev-sheet [data-i="{index}"]').click()
   page.evaluate('UI.finishStory()')
   page.wait_for_timeout(450)
   page.wait_for_function("[...document.querySelectorAll('#ev-sheet .reward-pill')].length>0 && [...document.querySelectorAll('#ev-sheet .reward-pill')].every(e=>e.textContent.trim()&&Number(getComputedStyle(e).opacity)>.99)")
   result=page.locator('#ev-sheet').inner_text()
   page.screenshot(path=str(OUT/f'{name}-result.png'))
   after=page.evaluate('''() => ({at:S.at,time:S.day*1440+S.min,pursuit:S.pursuit,flags:{...S.flags},note:S.notes.at(-1),used:S.used})''')
   assert after['time']-before['time']==(30 if hybrid else 40)
   assert after['at']=='suwon'
   assert '???' not in entry+result
   if hybrid:
    assert not after['flags'].get('main_testimony_record')
    assert '동료' in after['note']['body']
   else:
    assert 'onboarding_first_road' not in after['used']
    assert '수원' in after['note']['body'] and after['pursuit']==before['pursuit']+1
   rows.append({'fixture':'hybrid completed companion stories' if hybrid else 'late save with missing first record','before':before,'entry':entry,'result':result,'after':after})
   page.locator('#ev-sheet [data-r="ok"]').click()
   page.wait_for_timeout(500)
  assert not errors,errors
  page.close()
 browser.close()
(OUT/'trace.json').write_text(json.dumps({'mode':'Explicit late/hybrid fixtures on live 4176; actual UI actions; no grants after setup; not fresh campaign evidence','rows':rows},ensure_ascii=False,indent=2))
print('PASS live late recovery and hybrid command/relay choice/result, real costs, notes and flags')
