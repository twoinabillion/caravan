"""Isolated live fixtures; settled normal animation, never qa-exact-replay."""
from pathlib import Path
import json,sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-artifacts/director-art-2026-09-11'/('before' if '--before' in sys.argv else 'after');OUT.mkdir(parents=True,exist_ok=True)
camp_only='--camp-only' in sys.argv
review_only='--review-only' in sys.argv
rows=json.loads((OUT/'trace.json').read_text())['rows'] if camp_only or review_only else []
if camp_only: rows=[r for r in rows if not r['name'].startswith('camp-')]
if review_only: rows=[r for r in rows if r['name'] not in ['opening-choices','opening-last-action','recruit-rescue-before','recruit-rescue-after']]
retained_count=len(rows)
with sync_playwright() as p:
 b=p.chromium.launch()
 for width,height in [(320,578),(390,844),(1280,900)]:
  g=b.new_page(viewport={'width':width,'height':height}); errors=[]
  g.on('pageerror',lambda e:errors.append(str(e)))
  g.add_init_script("localStorage.clear();localStorage.setItem('caravan_story_auto','0')")
  g.goto('http://localhost:4176/game?caravan-live=1');g.evaluate("G.newGame('onroad','하린','full');G.save()")
  def fresh_page():
   # A closed page also discards delayed normal chains from the previous fixture.
   global g
   g.close();g=b.new_page(viewport={'width':width,'height':height})
   g.on('pageerror',lambda e:errors.append(str(e)))
   g.add_init_script("localStorage.clear();localStorage.setItem('caravan_story_auto','0')")
   g.goto('http://localhost:4176/game?caravan-live=1')
   g.evaluate("G.newGame('onroad','하린','full');S.party=[];S.dog=false;S.flags.onboarding_event_guide=true;G.save()")
  def shot(name,expected_event=None,expected_scene=None,expected_title=None,expected_phase=None):
   g.wait_for_timeout(1300)
   g.wait_for_function("!document.querySelector('#toasts')?.children.length&&!document.querySelector('#quest-update-ribbon')",timeout=10000)
   identity=g.locator('#ev-sheet').evaluate("n=>({eventId:n.dataset.eventId,phase:n.dataset.storyPhase,title:n.querySelector('.event-head h2')?.textContent,scene:n.querySelector('.event-scene-frame')?.dataset.sceneKey})")
   if expected_event: assert identity['eventId']==expected_event,identity
   if expected_scene: assert identity['scene']==expected_scene,identity
   if expected_title: assert identity['title']==expected_title,identity
   if expected_phase: assert identity['phase']==expected_phase,identity
   g.screenshot(path=str(OUT/f'{name}-{width}.png'))
   rows.append({'name':name,'width':width,'identity':identity,'geometry':g.evaluate('''() => ({scene:document.querySelector('.event-scene-frame')?.dataset.sceneKey,overflow:document.documentElement.scrollWidth>innerWidth,footer:(()=>{const n=document.querySelector('.event-choice-dock');if(!n)return null;const r=n.getBoundingClientRect();return {height:r.height,top:r.top,rows:getComputedStyle(n).gridTemplateRows}})()})''')})
   assert not rows[-1]['geometry']['overflow'],rows[-1]
  def event(id,party=[]):
   g.evaluate('''([id,party])=>{S.party=party;S.dog=party.includes('leo');S.combat=null;S.flags.onboarding_event_guide=true;UI.showEvent([...D.events,...D.seoulStops].find(e=>e.id===id));}''',[id,party])
  if not camp_only:
   fresh_page()
   g.evaluate("S.at='namwon';S.recruitQ={id:'leo',stage:'task',target:'namwon'}")
   event('rq_leo_task');shot('recruit-rescue-before','rq_leo_task','recruit-leo-rescue-choice-v1','돌아가야 하는 이유','event')
   g.evaluate('UI.finishStory()')
   before=g.evaluate('({van:S.van,minute:S.day*1440+S.min})')
   g.locator('[data-i="2"]').click();g.evaluate('UI.finishStory()')
   shot('recruit-rescue-after','rq_leo_task','recruit-leo-follow','돌아가야 하는 이유','outcome')
   after=g.evaluate('({van:S.van,minute:S.day*1440+S.min})')
   assert after['van']==before['van']-9 and after['minute']==before['minute']+75,(before,after)
   rows[-1]['outcome']={'choiceIndex':2,'method':'actual button click; no forced outcome','before':before,'after':after}
   fresh_page()
   g.evaluate("UI.showEvent(D.openingDeparture.find(e=>e.id==='opening_bus_repair'));UI.finishStory()")
   shot('opening-choices','opening_bus_repair','intro-dock-aid','난방이 끊긴 가족 버스','event')
   assert g.locator('.choice[data-i]').count()==3
   last=g.locator('.choice[data-i="2"]')
   last.scroll_into_view_if_needed();last.click(trial=True)
   shot('opening-last-action','opening_bus_repair','intro-dock-aid','난방이 끊긴 가족 버스','event')
   if review_only:
    assert not errors,errors
    g.close()
    continue
   fresh_page()
   event('meet_postman');shot('postman-solo')
   event('seoul_session_reset');g.evaluate('UI.finishStory()');shot('session-reset-solo')
   event('seoul_uplink_reveal');g.evaluate('UI.finishStory()');shot('uplink-solo')
   event('seoul_core');shot('core-solo')
   event('seoul_night');shot('night-solo')
   g.evaluate('UI.finishStory()');g.locator('[data-i="0"]').click();g.evaluate('UI.finishStory()');shot('night-dawn-result')
   assert rows[-1]['geometry']['scene']=='seoul-home-dawn-v2'
   event('route_ridge_extract');shot('ridge-before')
   g.evaluate('UI.finishStory()');g.locator('[data-i="0"]').click();g.evaluate('UI.finishStory()');shot('ridge-after')
   # Force a named authored outcome only for crop proof; no earned outcome claim.
   event('combat_walker_strike')
   g.evaluate("S.flags.onboarding_event_guide=false;UI.showEvent(D.events.find(e=>e.id==='combat_walker_strike'))");shot('walker-tutorial')
   g.evaluate("S.items['석궁']=1;S.items['볼트']=3;window.qaPick=G.pickOutcome;G.pickOutcome=(e,c)=>c.out[0];UI.showEvent(D.events.find(e=>e.id==='combat_walker_strike'));UI.finishStory()")
   g.locator('[data-i="0"]').click();g.evaluate('G.pickOutcome=window.qaPick;UI.finishStory()');shot('walker-disabled-result')
   assert rows[-1]['geometry']['scene']=='combat-walker-disabled-v2'
   event('combat_walker_strike');g.evaluate("S.items['석궁']=0;UI.showEvent(D.events.find(e=>e.id==='combat_walker_strike'));UI.finishStory()");shot('walker-disabled-choices')
   g.locator('.event-choice-dock>.choices').evaluate('n=>n.scrollTop=n.scrollHeight');shot('walker-last-action')
   g.locator('[data-i="4"]').click();g.evaluate('UI.finishStory()');shot('walker-retreat')
   assert 44<=rows[-1]['geometry']['footer']['height']<=65,rows[-1]
   g.locator('[data-r="ok"]').click()
   assert not g.locator('#ev-wrap.on').count()
   fresh_page()
   g.evaluate("UI.showEnding('story_done')");shot('ending')
  # Selected / disabled / empty / full-crew long camp use actual local/camp buttons.
  for crew in [[],['minji','parkss','kangwoo','leo','jaeyi','eunsu']]:
   g.close();g=b.new_page(viewport={'width':width,'height':height})
   g.on('pageerror',lambda e:errors.append(str(e)))
   g.add_init_script("localStorage.clear();localStorage.setItem('caravan_story_auto','0')")
   g.goto('http://localhost:4176/game?caravan-live=1')
   g.evaluate('''crew=>{G.newGame('onroad','하린','full');S.party=crew;S.dog=crew.includes('leo');for(const id of crew)S.comps[id]={mood:65,bond:5,lvl:0,perks:[],pending:0};S.at='gyeongju';S.min=1200;S.food=20;S.water=20;S.flags.onboarding_event_guide=true;S.items['부품']=4;UI.restoreQaView({screen:'game'});document.documentElement.classList.remove('qa-exact-replay');UI.renderAll();}''',crew)
   g.locator('button[data-journey-mode="local"]').click();g.locator('[data-a="camp"]').click()
   shot('camp-full' if crew else 'camp-empty')
   if crew:
    g.locator('[data-camp-prep="meal"]').click()
    assert g.locator('[data-camp-prep="meal"]').is_disabled()
    g.locator('[data-camp-prep="meal"]').scroll_into_view_if_needed();shot('camp-selected-disabled')
    g.locator('[data-camp-talk="eunsu"]').scroll_into_view_if_needed();shot('camp-last-companion')
    g.locator('[data-camp-talk="eunsu"]').click();g.evaluate('UI.finishStory()');g.wait_for_timeout(600);g.evaluate('UI.finishStory()');shot('camp-long-dialogue')
    choice_box=g.locator('.event-choice-dock>.choices')
    assert choice_box.evaluate('n=>n.clientHeight>=96'),choice_box.bounding_box()
    for choice in g.locator('.event-choice-dock .choice[data-i]').all():
     choice.scroll_into_view_if_needed()
     assert choice.bounding_box()['height']>=44
     assert choice.evaluate("n=>{const rects=e=>{const w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),a=[];let t;while(t=w.nextNode()){if(!t.textContent.trim())continue;const r=document.createRange();r.selectNodeContents(t);a.push(...r.getClientRects());}return a;};return Math.max(...rects(n.querySelector('.choice-title')).map(r=>r.bottom))<=Math.min(...rects(n.querySelector('.req')).map(r=>r.top))}"),(width,choice.inner_text())
    back=g.locator('[data-camp-later]').bounding_box()
    assert back['y']>=0 and back['y']+back['height']<=height,back
    g.locator('[data-camp-later]').click()
   g.locator('#camp-x').click()

  assert not errors,errors
  g.close()
 b.close()
(OUT/'trace.json').write_text(json.dumps({'provenance':'Explicit same-state fixtures; UI.finishStory accelerates dialogue; ordinary scene animation settled 1.3s; real outcome clicks except explicitly forced walker-disable crop. Party/camp are explicit fixtures. Not fresh campaign or reading-time proof.','rows':rows},ensure_ascii=False,indent=2))
print(f'PASS {len(rows)-retained_count} fresh captures; {len(rows)} states in aggregate inventory: {OUT}')
