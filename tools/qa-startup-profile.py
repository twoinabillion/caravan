#!/usr/bin/env python3
"""Local desktop Chromium startup profile. CPU throttling is not a physical phone."""
import argparse,json,time,platform,hashlib
from pathlib import Path
from collections import defaultdict
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--url',required=True);p.add_argument('--out',required=True);p.add_argument('--repeats',type=int,default=1);p.add_argument('--rates',default='1,4');a=p.parse_args();assert a.url.startswith(('http://127.0.0.1:','http://localhost:','file:///Users/sang/caravan/'))
out=Path(a.out);out.mkdir(parents=True,exist_ok=True);rows=[]
with sync_playwright() as p:
 b=p.chromium.launch()
 for rate,repeat in [(float(rate),i+1) for rate in a.rates.split(',') for i in range(a.repeats)]:
  c=b.new_context(viewport={'width':360,'height':728},device_scale_factor=2);page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));cdp=c.new_cdp_session(page);cdp.send('Network.enable');cdp.send('Network.setCacheDisabled',{'cacheDisabled':True});cdp.send('Performance.enable');cdp.send('Emulation.setCPUThrottlingRate',{'rate':rate});cdp.send('Profiler.enable');cdp.send('Profiler.start')
  page.add_init_script("window.startupLongTasks=[];new PerformanceObserver(l=>window.startupLongTasks.push(...l.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true})")
  start=time.monotonic();page.goto(a.url,wait_until='domcontentloaded',timeout=180000);page.wait_for_function("typeof UI!=='undefined'&&!!document.querySelector('#bt-new')",timeout=180000);page.locator('#bt-new').wait_for();elapsed=(time.monotonic()-start)*1000;page.wait_for_timeout(500)
  profile=cdp.send('Profiler.stop')['profile'];names={n['id']:n['callFrame']['functionName'] or '(anonymous)' for n in profile['nodes']};totals=defaultdict(int)
  for sample,delta in zip(profile.get('samples',[]),profile.get('timeDeltas',[])):totals[names[sample]]+=delta
  metrics={r['name']:r['value'] for r in cdp.send('Performance.getMetrics')['metrics']};timing=page.evaluate('({navigation:performance.getEntriesByType("navigation")[0].toJSON(),paint:performance.getEntriesByType("paint").map(e=>({name:e.name,start:e.startTime})),longTasks:window.startupLongTasks})')
  row={'cpuThrottle':rate,'repeat':repeat,'readyWallMs':round(elapsed,1),'timing':timing,'metrics':metrics,'topSampledSelfMs':sorted([{'name':n,'ms':round(v/1000,1)} for n,v in totals.items()],key=lambda x:-x['ms'])[:15],'pageErrors':errors};rows.append(row);(out/f'cpu-{rate}-{repeat}-profile.json').write_text(json.dumps(profile));page.screenshot(path=str(out/f'cpu-{rate}-{repeat}-title.png'));print(json.dumps({'cpuThrottle':rate,'repeat':repeat,'readyWallMs':row['readyWallMs'],'JSHeapUsedSize':metrics.get('JSHeapUsedSize'),'top':row['topSampledSelfMs'][:5],'errors':errors}),flush=True);c.close()
 b.close()
(out/'results.json').write_text(json.dumps({'kind':'desktop Chromium cold context/cache disabled; not phone/network/thermal measurements','platform':platform.platform(),'rows':rows},indent=2))
