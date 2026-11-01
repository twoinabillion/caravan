"""Private Chromium profile; actual05f renderer with an explicit candidate registry.
Never touches the user's browser, localStorage, server or production enable flag.
Run audit-continuous-terrain.mjs first. Not a gameplay/audio/device-feel test.
"""
from pathlib import Path
from urllib.parse import unquote, urlparse
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'qa-artifacts/route-continuity-v3/browser-graph'
OUT.mkdir(parents=True,exist_ok=True)
REGISTRY=json.loads((ROOT/'qa-artifacts/route-continuity-v3/full-graph/registry-candidate.json').read_text())
SOURCE=(ROOT/'src/05f-continuous-terrain.js').read_text()
JOIN=(ROOT/'tools/continuous-route-join.cjs').read_text().split('module.exports=')[0]
SOURCE=SOURCE.replace('/*__CONTINUOUS_TERRAIN__*/{enabled:false,nodes:{},corridors:{},routes:[]}',json.dumps(REGISTRY)).replace('/*__CONTINUOUS_JOIN__*/null','joinTilePixels')
HARNESS=r"""
const cv=document.createElement('canvas');document.body.appendChild(cv);
function paint(view,W=360,light='day',wx='clear'){
 cv.width=W*2;cv.height=544;const cx=cv.getContext('2d',{willReadFrequently:true});cx.scale(2,2);cx.fillStyle='#99aab5';cx.fillRect(0,0,W,272);
 if(!CONTINUOUS_TERRAIN.draw(cx,{...view,W,H:272,scale:2,hour:light==='day'?12:light==='dusk'?18:23,dark:light==='night'?.8:0,wx}))throw Error('unprepared draw');
 return cx.getImageData(0,0,cv.width,cv.height).data;
}
function diff(a,b){let max=0,count=0,sum=0;for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);if(d){count++;sum+=d;max=Math.max(max,d);}}return {max,count,mean:sum/a.length};}
globalThis.checkRoute=async r=>{
 if(!await CONTINUOUS_TERRAIN.prepare({from:r.from,to:r.to}))throw Error('decode/compose failed '+r.id);
 const endpoints=[],reverse=[];
 for(const W of [320,360,480]){
  for(const [light,wx]of [['day','clear'],['dusk','clear'],['night','rain'],['day','fog'],['day','dust']]){
   for(const [from,to]of [[r.from,r.to],[r.to,r.from]])for(const end of [0,1]){
    const city=end?to:from,road=paint({driving:{from,to,dist:r.km,gone:r.km*end}},W,light,wx),stopped=paint({at:city},W,light,wx),d=diff(road,stopped);
    if(d.max!==0)throw Error('endpoint mismatch '+r.id+' '+city+' '+JSON.stringify({W,light,wx,from,to,end,...d}));
    endpoints.push({W,light,wx,from,to,end,...d});
   }
  }
  for(const n of [0,1,2,3,4,5,6,7,8]){
   const a=paint({driving:{from:r.from,to:r.to,dist:r.km,gone:r.km*n/8}},W),b=paint({driving:{from:r.to,to:r.from,dist:r.km,gone:r.km*(1-n/8)}},W),d=diff(a,b);
   if(d.max!==0)throw Error('reverse mismatch '+r.id);reverse.push({W,n,...d});
  }
 }
 return {id:r.id,endpoints,reverse};
};
globalThis.showSample=async (r,W,p,light='day')=>{await CONTINUOUS_TERRAIN.prepare(r);paint({driving:{from:r.from,to:r.to,dist:r.km,gone:r.km*p}},W,light);};
"""
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 context=browser.new_context(viewport={'width':1000,'height':650})
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 def serve(route):
  if urlparse(route.request.url).path=='/__qa/continuous':
   route.fulfill(content_type='text/html',body='<style>body{margin:0;background:#18232c}canvas{display:block}</style>');return
  f=ROOT/unquote(urlparse(route.request.url).path).lstrip('/')
  if f.is_relative_to(ROOT) and f.is_file():route.fulfill(path=str(f))
  else:route.abort()
 page.route('http://qa.local/**',serve)
 page.goto('http://qa.local/__qa/continuous')
 page.add_script_tag(content=JOIN+'\n'+SOURCE+'\n'+HARNESS)
 results=[]
 for i,r in enumerate(REGISTRY['routes']):
  results.append(page.evaluate('r=>checkRoute(r)',r))
  if i%10==0:print(f"renderer roads {i+1}/78",flush=True)
  if r['id'] in ['busan--gimhae','gimcheon--muju','gyeongju--pohang','danyang--wonju','daegwallyeong--gangneung','seoul--suwon','gwangju--mokpo']:
   for W in [320,360,480]:
    for progress in [.3333333333,.5,.6666666667]:
     page.evaluate('([r,W,p])=>showSample(r,W,p)',[r,W,progress])
     page.locator('canvas').screenshot(path=str(OUT/f"{r['id']}-{W}-{round(progress*100)}.png"))
 degrees={id:sum(id in [r['from'],r['to']] for r in REGISTRY['routes']) for id in REGISTRY['nodes']}
 report={'scope':'actual05f candidate renderer; private synthetic states, not gameplay/HUD/audio or user current scene','roads':results,'endpoints':sum(len(r['endpoints']) for r in results),'reverse':sum(len(r['reverse']) for r in results),'cityPairHandoffs':sum(n*n for n in degrees.values()),'errors':errors}
 (OUT/'results.json').write_text(json.dumps(report,indent=2))
 context.close();browser.close();assert not errors
 print(json.dumps({k:v for k,v in report.items() if k!='roads'}),flush=True)
