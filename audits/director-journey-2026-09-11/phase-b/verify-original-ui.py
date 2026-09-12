#!/usr/bin/env python3
"""Bounded delivery proof: actual controls, isolated storage, exact served HTML.
Reuses the reviewed interaction and original-response transport helpers. No
progression writes, event reopening, accelerated clock or dialogue overrides.
"""
import datetime, importlib.util, json, os, sys, time
from pathlib import Path
from types import SimpleNamespace
from playwright.sync_api import sync_playwright
ROOT=Path('/Users/sang/caravan')
OUT=Path(__file__).resolve().parent/('ui-diagnostic-layout' if os.environ.get('DIRECTOR_UI_DIAGNOSTIC') else 'ui')
sys.path.insert(0,str(ROOT))
spec=importlib.util.spec_from_file_location('reviewed_campaign',ROOT/'tools/qa-director-city-route.py')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
from tests.director_journey_helpers import snapshot, presentation_identity, reload_exact_once, sha256_file, canonical_json
START_RUNNER_SHA256=sha256_file(Path(__file__))
START_TRANSPORT_SHA256=sha256_file(ROOT/'tools/qa-director-city-route.py')
START_HELPER_SHA256=sha256_file(ROOT/'tests/director_journey_helpers.py')
CHECKPOINT=ROOT/'artifacts/director-pass-2026-09-11/task8-final/crew-checkpoint/save.json'

def compact(s):
 keys=['build','schema','at','day','min','km','drive','eventId','presentationPhase','storyStep','resources','flags','party','seoul','ended','endKind','archives','choiceCount','eventCount','noteSeq']
 return {k:s[k] for k in keys}

class Delivery(mod.Campaign):
 def capture(self,event,phase): pass
 def record(self,action,before,**extra):
  self.page.wait_for_timeout(35)
  row={'sequence':len(self.actions)+1,'action':action,'before':compact(before),'after':compact(snapshot(self.page)),**extra};self.actions.append(row)
  if len(self.actions)%20==0: self.emit({'phase':'delivery-actions','scenario':self.sid(),'actions':len(self.actions),'event':row['after']['eventId']})
  return row
 def shot(self,label):
  self.page.wait_for_timeout(450);p=self.out/(label+'.png');self.page.screenshot(path=str(p))
  r={'label':label,'path':str(p.relative_to(OUT)),'bytes':p.stat().st_size,'sha256':sha256_file(p),'state':compact(snapshot(self.page)),'presentation':presentation_identity(self.page)}
  self.images.append(r);return r

def scenario(browser,width,height,kind):
 name=f'{width}x{height}-{kind}';a=SimpleNamespace(root=str(ROOT),output=str(OUT/name),scenario='finale',method='core_transfer',checkpoint=str(CHECKPOINT) if kind=='earned' else None,route='ridge',companion=None,camp_choice=None,seed=None,pause_ms=0,limit=3000,url='http://127.0.0.1:4175/game?caravan-live=1')
 c=Delivery(a,browser);c.actions=[];c.images=[];c.page.set_viewport_size({'width':width,'height':height});reload_proof=None
 if os.environ.get('DIRECTOR_UI_DIAGNOSTIC'):
  c.page.add_init_script("""(() => {
   window.__layoutSamples=[];
   document.addEventListener('DOMContentLoaded',()=>{
    const sample=why=>{ const rows=window.__layoutSamples;if(rows.length>=400)return;
     const get=sel=>{const n=document.querySelector(sel);if(!n)return null;const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {x:r.x,y:r.y,width:r.width,height:r.height,style:n.getAttribute('style'),display:s.display,flexBasis:s.flexBasis,overflow:s.overflow,scrollTop:n.scrollTop,scrollHeight:n.scrollHeight,clientHeight:n.clientHeight}};
     rows.push({why,time:performance.now(),viewport:{width:innerWidth,height:innerHeight},attrs:{...document.documentElement.dataset},event:document.querySelector('#ev-wrap.on #ev-sheet')?.dataset.eventId||null,gameOn:document.querySelector('#scr-game').classList.contains('on'),nodes:Object.fromEntries(['#stage','#main','#panel','#dock','.journey-mode-console','.route-console-screen'].map(s=>[s,get(s)]))});};
    sample('DOMContentLoaded');const stage=document.querySelector('#stage');new MutationObserver(()=>sample('stage-style')).observe(stage,{attributes:true,attributeFilter:['style']});
    document.addEventListener('click',e=>{if(e.target.closest('button')){sample('before-click:'+e.target.closest('button').outerHTML.slice(0,180));requestAnimationFrame(()=>sample('after-click-frame'));}},true);
   });
  })()""")
 try:
  if kind=='fresh':
   c.goto();c.page.click('#bt-new')
   if c.page.locator('#scr-mode').is_visible(): c.page.click('#mode-on')
   c.page.fill('#inp-name','하린');c.page.click('#bt-name')
  else: c.resume(accelerated=False)
  assert c.page.evaluate('GAME_BUILD')=='2026-09-11-director-journey'
  assert not c.page.evaluate('G.isInfiniteResourceMode()')
  initial=compact(snapshot(c.page)); seen_choice=False;seen_result=False;next_after_reload=False
  deadline=time.monotonic()+240
  for _ in range(3000):
   assert time.monotonic()<deadline,('bounded UI proof timeout',name,compact(snapshot(c.page)))
   s=snapshot(c.page)
   if kind=='fresh' and c.page.evaluate("()=>!!S.opening?.completed&&Object.keys(S.opening.decisions||{}).length>=5&&!!S.flags?.main_mission_started&&!UI.modalOpen()"):
    c.page.wait_for_selector('#quest-update-ribbon',state='detached',timeout=10000);c.shot('03-opening-complete');
    (c.out/'pre-departure-dom.json').write_text(json.dumps(c.page.evaluate("""() => ({viewport:{width:innerWidth,height:innerHeight},dataset:{...document.documentElement.dataset},nodes:Object.fromEntries(['#stage','#main','#panel','#dock','.journey-mode-console','.route-console-screen'].map(sel=>{const n=document.querySelector(sel),r=n?.getBoundingClientRect(),c=n&&getComputedStyle(n);return [sel,n?{rect:{x:r.x,y:r.y,width:r.width,height:r.height},style:n.getAttribute('style'),display:c.display,overflow:c.overflow,scrollTop:n.scrollTop,scrollHeight:n.scrollHeight,clientHeight:n.clientHeight}:null]}))})"""),ensure_ascii=False,indent=2));
    c.travel(snapshot(c.page));c.shot('04-actual-departure');break
   if kind=='earned' and s['ended']:
    assert s['endKind']=='story_done' and s['archives']==1 and s['seoul']['method']=='core_transfer'
    c.shot('05-ending');break
   choices=c.page.locator('#ev-sheet [data-i]:visible:not([disabled])')
   if not seen_choice and choices.count():
    choices.first.scroll_into_view_if_needed();c.shot('01-choice');seen_choice=True
   is_result=(s.get('presentationPhase')=='outcome' or (s.get('pending') or {}).get('phase')=='result' or (s.get('opening') or {}).get('pendingResult'))
   if seen_choice and not seen_result and is_result:
    c.shot('02-result');seen_result=True
    if kind=='earned':
     before,after=reload_exact_once(c.page)
     assert after['presentation']['eventId']==before['presentation']['eventId']=='seoul_decision'
     assert after['presentation']['phase']==before['presentation']['phase']=='outcome'
     loaded=after['loadedInput']['state'];restored=after['state']
     for k in ['resources','choiceCount','eventCount','noteSeq','party']:
      assert loaded[k]==restored[k],(k,loaded[k],restored[k])
     assert loaded['pending']['eventId']==restored['pending']['eventId']=='seoul_decision'
     assert loaded['pending']['phase']==restored['pending']['phase']=='result'
     reload_proof={'before':before,'after':after,'sameResourcesChoicesEventsNotesParty':True,'checkpointImportedOnlyOnce':True}
     c.shot('03-result-restored');continue
   if reload_proof and not next_after_reload and s['eventId'] not in ['seoul_decision',None]:
    c.shot('04-next-authored-scene');next_after_reload=True
   if s['eventId'] and c.event(s):continue
   c.page.wait_for_timeout(80)
  else: raise AssertionError('UI loop exhausted')
  final=compact(snapshot(c.page));assert seen_choice and seen_result
  if kind=='earned': assert reload_proof and next_after_reload and final['ended']
  else: assert final['drive'] and len(c.page.evaluate('Object.keys(S.opening.decisions)'))==5
  assert not c.errors,c.errors
  assert sha256_file(Path(__file__))==START_RUNNER_SHA256
  assert sha256_file(ROOT/'tools/qa-director-city-route.py')==START_TRANSPORT_SHA256
  assert sha256_file(ROOT/'tests/director_journey_helpers.py')==START_HELPER_SHA256
  receipt={'scenario':name,'verifiedAt':datetime.datetime.now().astimezone().isoformat(),'url':a.url,'viewport':{'width':width,'height':height},'status':'passed','pace':'scripted actual clicks; normal engine timers; no human-reading or phone-performance claim','initial':initial,'final':final,'response':c.response,'responses':c.responses,'resumeMode':c.resume_mode,'checkpointInput':{'path':str(CHECKPOINT),'bytes':CHECKPOINT.stat().st_size,'sha256':sha256_file(CHECKPOINT),'imports':1} if kind=='earned' else None,'pageErrors':c.errors,'consoleErrors':c.console,'httpErrors':c.http_errors,'actions':c.actions,'departureTrace':c.trace.rows,'captures':c.images,'reload':reload_proof,'runnerSha256':START_RUNNER_SHA256,'runnerStableThroughoutRun':True,'reviewedTransportSha256':START_TRANSPORT_SHA256,'reviewedHelperSha256':START_HELPER_SHA256}
  p=c.out/'receipt.json';p.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
  print(canonical_json({'scenario':name,'status':'passed','receipt':str(p),'captures':[x['path'] for x in c.images],'actions':len(c.actions)}),flush=True)
  return {'scenario':name,'receipt':str(p.relative_to(OUT)),'sha256':sha256_file(p),'status':'passed','pageErrorCount':len(c.errors),'captures':[{'path':x['path'],'sha256':x['sha256']} for x in c.images]}
 except Exception as e:
  (c.out/'layout-samples.json').write_text(json.dumps(c.page.evaluate('window.__layoutSamples||[]'),ensure_ascii=False,indent=2));c.page.evaluate('G.save()');(c.out/'failure.save.json').write_text(c.page.evaluate("localStorage.getItem('seoul400_save_v1')") or "null");c.page.screenshot(path=str(c.out/'failure.png'));(c.out/'failure.json').write_text(json.dumps({'error':repr(e),'state':compact(snapshot(c.page)),'errors':c.errors,'actions':c.actions},ensure_ascii=False,indent=2));raise
 finally:
  c.context.close()

OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch()
 results=[]
 for width,height in [(320,578),(390,844),(1440,900)]:
  for kind in ['fresh','earned']:
   name=f'{width}x{height}-{kind}'
   if os.environ.get('DIRECTOR_UI_SCENARIOS') and name not in os.environ['DIRECTOR_UI_SCENARIOS'].split(','):continue
   if (OUT/name/'receipt.json').exists():continue
   results.append(scenario(browser,width,height,kind));(OUT/'index.json').write_text(json.dumps({'verifiedAt':datetime.datetime.now().astimezone().isoformat(),'completedScenarios':len(results),'requiredScenarios':6,'results':results},ensure_ascii=False,indent=2)+'\n')
 browser.close()
assert results
