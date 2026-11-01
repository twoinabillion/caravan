"""Actual game UI, candidate registry, private profile and synthetic save only."""
from pathlib import Path
from urllib.parse import unquote,urlparse
import json,base64
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'qa-artifacts/route-continuity-v3/browser-gameplay';OUT.mkdir(parents=True,exist_ok=True)
registry=json.loads((ROOT/'qa-artifacts/route-continuity-v3/full-graph/registry-candidate.json').read_text())
for group in ['nodes','corridors']:
 for item in registry[group].values():
  f=ROOT/unquote(urlparse(item['source']).path).lstrip('/')
  item['source']='data:image/webp;base64,'+base64.b64encode(f.read_bytes()).decode()
html=(ROOT/'서울까지400km.html').read_text()
needle='const registry={"enabled":false,"nodes":{},"corridors":{},"routes":[]};'
if html.count(needle)==1:
 html=html.replace(needle,'const registry='+json.dumps(registry)+';')
else:
 start=html.index('const registry=',html.index('const CONTINUOUS_TERRAIN=(()=>{'))+len('const registry=')
 # The builder may pool data URIs into JS constants; this is deliberately not
 # JSON anymore. Factory tests verify coverage/hashes, browser asserts active().
 assert html[start:].startswith('{"enabled":true,')
candidate=Path('/private/tmp/caravan-route-audit/candidate-game.html');candidate.write_text(html)
HOLD=r"""() => {
 const prepare=CONTINUOUS_TERRAIN.prepare,ready=CONTINUOUS_TERRAIN.ready;
 let resolve;const waiting=new Promise(r=>resolve=r);
 CONTINUOUS_TERRAIN.prepare=v=>v.from?waiting.then(()=>prepare(v)):prepare(v);
 CONTINUOUS_TERRAIN.ready=v=>v.from?false:ready(v);
 window.releaseTerrain=()=>{CONTINUOUS_TERRAIN.prepare=prepare;CONTINUOUS_TERRAIN.ready=ready;resolve();};
 window.travelCalls=[];window.travelActive=[];const start=G.startTravel;G.startTravel=id=>{travelCalls.push(id);travelActive.push(CONTINUOUS_TERRAIN.active());return start(id);};
}"""
SEED=r"""async() => {
 G.newGame('onroad','배경 QA','skip','keeper','fuel');S.at='gimcheon';S.flags.main_mission_started=true;
 if(S.opening)S.opening.completed=true;S._storyQueue=[];S._chain=null;S.pendingArrival=null;
 G.save();
 return {active:CONTINUOUS_TERRAIN.active(),can:G.canTravelTo('muju')};
}"""
with sync_playwright() as p:
 b=p.chromium.launch(headless=True);context=b.new_context(viewport={'width':360,'height':780},record_video_dir=str(OUT/'video'));context.set_offline(True)
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script("window.ReactNativeWebView={postMessage(){}};localStorage.setItem('caravan_story_auto','0')")
 def serve(route):
  url=urlparse(route.request.url)
  if url.path=='/game':route.fulfill(content_type='text/html',body=html);return
  f=ROOT/unquote(url.path).lstrip('/')
  if f.is_relative_to(ROOT) and f.is_file():route.fulfill(path=str(f))
  else:route.abort()
 page.route('http://qa.local/**',serve)
 results=[]
 def rendered():
  page.wait_for_function("""() => {const c=document.querySelector('#cv');if(!c?.width)return false;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=64)if(d[i]+d[i+1]+d[i+2]>20)n++;return n>100;}""")
 def fresh():
  page.goto(candidate.as_uri(),wait_until='domcontentloaded',timeout=120000);page.locator('#scr-title.on').wait_for();seed=page.evaluate(SEED);assert seed['active'] and seed['can']['ok'],seed
  page.reload(wait_until='domcontentloaded',timeout=120000);page.locator('#scr-title.on').wait_for();page.evaluate(HOLD);page.locator('#bt-continue').click();page.locator('#scr-game.on').wait_for();rendered()
  page.locator('[data-trip-destination]').click();page.locator('[data-trip-route="muju"]').click()
  assert page.locator('[data-nav-depart]').get_attribute('data-nav-depart')=='muju'
 fresh();page.locator('[data-nav-depart]').click();assert page.evaluate('travelCalls.length')==0
 page.locator('[data-trip-destination]').click();page.locator('[data-trip-route="yeongdong"]').click()
 page.evaluate('releaseTerrain()');page.wait_for_timeout(1000);assert page.evaluate('travelCalls.length')==0;assert page.locator('[data-nav-depart]').is_enabled()
 results.append('destination change cancels pending departure');page.screenshot(path=str(OUT/'changed-destination.png'))
 fresh();page.locator('[data-nav-depart]').click();assert page.evaluate('travelCalls.length')==0
 page.locator('#dk-menu').click();page.evaluate('releaseTerrain()');page.wait_for_timeout(1000);assert page.evaluate('travelCalls.length')==0
 results.append('opening menu cancels pending departure')
 fresh();page.locator('[data-nav-depart]').click();assert page.evaluate('travelCalls.length')==0
 page.evaluate('releaseTerrain()');page.wait_for_function('travelCalls.length===1&&!!S.driving');assert page.evaluate('S.driving.to')=='muju'
 results.append('departure commits once after actual preparation');rendered();page.wait_for_timeout(200);page.screenshot(path=str(OUT/'driving.png'))
 page.wait_for_timeout(1500);page.evaluate('G.save()');saved=page.evaluate('localStorage.getItem(SAVE_KEY)')
 page.reload(wait_until='domcontentloaded',timeout=120000);page.locator('#scr-title.on').wait_for();page.evaluate(HOLD)
 saved=page.evaluate('localStorage.getItem(SAVE_KEY)') # includes normal pagehide flush before reload
 page.locator('#bt-continue').click();assert page.evaluate('S===null');assert page.evaluate('localStorage.getItem(SAVE_KEY)')==saved
 page.evaluate('releaseTerrain()');page.wait_for_function('!!S?.driving&&CONTINUOUS_TERRAIN.ready(S)');assert page.evaluate('S.driving.to')=='muju'
 results.append('Continue waits before replacing state and resumes the saved leg')
 fresh();page.evaluate('CONTINUOUS_TERRAIN.prepare=()=>Promise.resolve(false)');page.locator('[data-nav-depart]').click()
 page.wait_for_function('!!S.driving');assert page.evaluate('travelCalls')==['muju'];assert page.evaluate('travelActive')==[False]
 results.append('failed preparation falls back before a single departure')
 def stage_backup():
  fresh()
  backup=page.evaluate("""() => {const current=G.exportSave();G.startTravel('muju');S.driving.gone=7;S.name='가져온 배경';const backup=G.exportSave();G.importSave(current);UI.renderAll();return backup;}""")
  page.locator('#dk-menu').click();page.locator('#menu-save-transfer').click()
  page.locator('#save-transfer-file').set_input_files({'name':'terrain-backup.json','mimeType':'application/json','buffer':backup.encode()})
  page.locator('#save-transfer-confirm').wait_for();before=page.evaluate('G.exportSave()');page.locator('#save-transfer-confirm').click()
  assert page.evaluate('G.exportSave()')==before
  return before
 before=stage_backup();page.locator('#save-transfer-back').click();page.evaluate('releaseTerrain()');page.wait_for_timeout(1000)
 assert page.evaluate('G.exportSave()')==before;results.append('canceling an import while preparing preserves the current journey')
 stage_backup();page.evaluate('releaseTerrain()');page.wait_for_function('S?.name==="가져온 배경"&&!!S.driving')
 assert page.evaluate('CONTINUOUS_TERRAIN.ready(S)');assert page.evaluate('S.driving.to')=='muju'
 results.append('confirmed mid-leg backup enters with its actual terrain ready');rendered();page.wait_for_timeout(200);page.screenshot(path=str(OUT/'restored-driving.png'))
 page.evaluate('UI.setLifecyclePaused(true)');frozen=page.evaluate('S.driving.gone');page.wait_for_timeout(350);assert page.evaluate('S.driving.gone')==frozen
 page.evaluate('UI.setLifecyclePaused(false)');page.wait_for_function('(n)=>S.driving.gone>n',arg=frozen)
 results.append('lifecycle pause freezes distance and resume continues without a catch-up jump')
 page.evaluate("""() => {const old=UI.onArrive;UI.onArrive=()=>UI.renderAll();S.driving.slots=[];S.driving.si=0;const wx=S.wx==='storm'?.76:S.wx==='fog'?.88:1,ftg=S.fatigue>=80?.85:1;G.tick((S.driving.dist-S.driving.gone)/(G.tickKmPerSecond()*wx*ftg)+.02);UI.onArrive=old;}""")
 assert page.evaluate('S.at==="muju"&&!S.driving&&CONTINUOUS_TERRAIN.ready(S)');rendered();page.wait_for_timeout(200);page.screenshot(path=str(OUT/'arrived-muju.png'))
 page.locator('[data-trip-destination]').click();page.locator('[data-trip-route="yeongdong"]').click();page.locator('[data-nav-depart]').click()
 page.wait_for_function('S.driving?.to==="yeongdong"&&CONTINUOUS_TERRAIN.ready(S)');rendered()
 results.append('actual engine arrival retains the city and the next UI departure prepares the adjoining road')
 (OUT/'results.json').write_text(json.dumps({'scope':'actual game candidate UI, private synthetic save; not user scene or audio/device-feel certification','checks':results,'errors':errors},indent=2))
 context.close();b.close();assert not errors;print(json.dumps({'checks':results,'errors':errors}),flush=True)
