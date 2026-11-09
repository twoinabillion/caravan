from playwright.sync_api import sync_playwright
from pathlib import Path
import json,time
root=Path(__file__).resolve().parents[1];out=root/'qa-artifacts/living-encounters-20261106';out.mkdir(parents=True,exist_ok=True)
raw=(root/'qa-artifacts/first30-20261101-companion/save.json').read_text();results={'provenance':'Explicit encounter fixtures on an actually acquired companion save; separate browser storage, configured live origin. Not a fresh end-to-end journey or user screen.','paths':[],'layouts':[],'errors':[]}
with sync_playwright() as p:
 b=p.chromium.launch()
 def openpage(width=390,height=844):
  context=b.new_context(viewport={'width':width,'height':height},device_scale_factor=2)
  context.add_init_script('if(!localStorage.getItem("seoul400_save_v1"))localStorage.setItem("seoul400_save_v1",'+json.dumps(raw)+');')
  page=context.new_page();page.on('pageerror',lambda e:results['errors'].append(str(e)))
  page.goto('http://127.0.0.1:4319/game?caravan-live=1',timeout=120000);page.wait_for_function('typeof UI!=="undefined"&&typeof G!=="undefined"',timeout=60000)
  if page.locator('#bt-continue').is_visible():page.locator('#bt-continue').click()
  page.wait_for_timeout(350);return context,page
 def actions(page):
  for i in range(60):
   if page.locator('#ev-sheet').get_attribute('data-story-step') in ['decision','result']:return
   page.locator('#ev-sheet .story-next:visible').click();page.wait_for_timeout(75)
  raise AssertionError('reader does not reach actions')
 def resources(page):return page.evaluate('({water:S.water,food:S.food,scrap:S.scrap,min:S.min,notes:S.notes.length,items:S.items,flags:S.flags,party:S.party})')
 for index in [0,1]:
  ctx,page=openpage();page.evaluate('G.openEvent(D.events.find(e=>e.id==="meet_postman"))');actions(page)
  before=resources(page);page.screenshot(path=str(out/f'postman-choice-{index}.png'))
  page.locator(f'#ev-sheet .choice[data-i="{index}"]:visible').click();actions(page);after=resources(page)
  assert after['water']==before['water']-(1 if index else 0),(before,after)
  assert after['notes']>=before['notes'];page.screenshot(path=str(out/f'postman-result-{index}.png'))
  page.evaluate('G.save()');paid=resources(page);page.reload(timeout=120000);page.wait_for_function('typeof UI!=="undefined"&&S&&document.querySelector("#ev-wrap.on")',timeout=60000);page.wait_for_timeout(300)
  assert resources(page)==paid,'reload changed paid effects'
  replay=page.evaluate('(i)=>G.resolvePresentedChoice(D.events.find(e=>e.id==="meet_postman"),D.events.find(e=>e.id==="meet_postman").choices[i])',index)
  assert replay['applied']==False;assert resources(page)==paid
  results['paths'].append({'choice':index,'waterDelta':after['water']-before['water'],'noteDelta':after['notes']-before['notes'],'reloadEqual':True,'duplicateApplied':replay['applied'],'skin':page.locator('#ev-sheet').get_attribute('data-reader-skin')})
  ctx.close()
 # Real renderer and real timers, with explicit event injection during an actual departure.
 ctx,page=openpage();page.locator('[data-nav-depart]:visible').click();page.wait_for_timeout(250)
 assert page.evaluate('!!S.driving');page.evaluate('G.openEvent(D.events.find(e=>e.id==="meet_postman"))')
 begun=time.monotonic()
 for seconds in [.8,2.3,4.65]:
  page.wait_for_timeout(max(1,int((seconds-(time.monotonic()-begun))*1000)))
  page.screenshot(path=str(out/f'road-{seconds}.png'))
 page.wait_for_function('!!document.querySelector("#ev-wrap.on")',timeout=10000)
 assert page.locator('#ev-sheet').get_attribute('data-reader-skin')=='cinematic'
 results['roadHandoff']=True
 # Enlarged contact sheet uses the actual production drawActor implementation, not a substitute rig.
 page.evaluate('''()=>{const c=document.createElement('canvas');c.width=1200;c.height=360;c.id='qa-rig';c.style='position:fixed;inset:0;z-index:99999;width:100vw;height:auto;background:#27352e';document.body.append(c);const x=c.getContext('2d');x.fillStyle='#27352e';x.fillRect(0,0,1200,360);const im=G.roadCueKit.images['postman-standing'].preloaded;[.2,1.5,2.5,4.5,4.8,5.3].forEach((t,i)=>{x.save();x.translate(i*200+20,0);G.roadCueKit.drawActor(x,im,{x:0,y:15,width:138,height:288},G.roadCueKit.actorPose({eventKey:'meet_postman',duration:5200},t));x.fillStyle='#e3dec9';x.font='15px sans-serif';x.fillText(t+'s',10,335);x.restore()})}''')
 page.locator('#qa-rig').screenshot(path=str(out/'production-rig-poses.png'));page.evaluate('document.querySelector("#qa-rig").remove()')
 # All representative read/decision/result states at narrow/short/large text sizes.
 for width,height in [(320,740),(360,728),(390,844),(480,800),(800,360)]:
  page.set_viewport_size({'width':width,'height':height})
  for large in [False,True]:
   page.evaluate('(large)=>{document.documentElement.classList.toggle("ui-large-text",large);UI.renderAll()}',large)
   page.evaluate('UI.showEvent(D.events.find(e=>e.id==="meet_postman"))');actions(page)
   overflow=page.locator('#ev-sheet').evaluate('s=>{const r=s.getBoundingClientRect();return [...s.querySelectorAll(".choice:not([hidden]),.story-next,.page-text,.page-speaker")].filter(e=>e.getClientRects().length).filter(e=>{const b=e.getBoundingClientRect();return b.left<r.left-1||b.right>r.right+1||b.top<r.top-1||b.bottom>r.bottom+1}).map(e=>e.textContent)}')
   results['layouts'].append({'width':width,'height':height,'large':large,'overflow':overflow,'fallback':page.locator('#ev-sheet').get_attribute('data-page-fallback')})
   if overflow:
    assert height<=360 and page.locator('#ev-sheet').get_attribute('data-page-fallback')=='actions',(width,height,large,overflow)
    for button in page.locator('#ev-sheet .choice:visible').all():
     button.scroll_into_view_if_needed();r=button.bounding_box();assert r['y']>=0 and r['y']+r['height']<=height+1
    results['layouts'][-1]['explicitScrollReachable']=True
   if width==320:page.screenshot(path=str(out/f'320-choice-large-{large}.png'))
 ctx.close()
 # Actual acquired Minji membership, camp preparation and the existing camp choice runner.
 ctx,page=openpage();page.get_by_role('tab',name='머물기',exact=True).click();page.locator('[data-stay-choice]').click();page.locator('[data-stay-select="camp"]').click();page.locator('[data-a="camp"]:visible').click();page.wait_for_timeout(200)
 page.locator('[data-camp-view="home"]').click();page.locator('[data-home-zone="shelf"]').click();page.locator('[data-home-object="companion:minji"]:visible').click();page.screenshot(path=str(out/'minji-earned-home.png'))
 assert page.locator('[data-home-prop="companion:minji"]').get_attribute('class').find('is-inspected')>=0
 assert page.locator('.home-lantern-glow').count()==1
 page.locator('[data-home-zone="table"]').click();assert not page.locator('.home-prop.is-inspected').count()
 page.locator('[data-home-zone="shelf"]').click();page.locator('[data-home-object="companion:minji"]:visible').click()
 page.locator('[data-home-return]').click();page.locator('[data-camp-view="prepare"]').click();page.locator('[data-camp-talk="minji"]').click();actions(page)
 assert page.locator('#ev-sheet').get_attribute('data-reader-skin')=='cinematic'
 before=resources(page);page.screenshot(path=str(out/'minji-camp-choice.png'));page.locator('#ev-sheet .choice:visible').first.click();actions(page);after=resources(page)
 page.screenshot(path=str(out/'minji-camp-result.png'));assert after['min']>=before['min']
 page.evaluate('G.save()');paid=resources(page);page.reload(timeout=120000);page.wait_for_function('typeof UI!=="undefined"&&S&&document.querySelector("#ev-wrap.on")',timeout=60000);assert resources(page)==paid
 results['minjiCamp']={'skin':page.locator('#ev-sheet').get_attribute('data-reader-skin'),'elapsedMinutes':after['min']-before['min'],'reloadEqual':True}
 page.emulate_media(reduced_motion='reduce');page.evaluate('document.documentElement.dataset.uiMotion="reduced"');results['reducedPostman']=page.evaluate('G.roadCueKit.actorPose({eventKey:"meet_postman",duration:5200},4.8,true)')
 ctx.close();b.close()
(out/'verification.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(json.dumps(results,ensure_ascii=False))
