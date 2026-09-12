#!/usr/bin/env python3
"""All seven city hubs keep both settled actions inside the phone viewport."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
failures=[]
with sync_playwright() as p:
 browser=p.chromium.launch();page=browser.new_page()
 page.goto((ROOT/'서울까지400km.html').as_uri())
 page.evaluate("""()=>{G.newGame('onroad','도시 검수','full');G.save=()=>{};document.querySelectorAll('.scr').forEach(n=>n.classList.remove('on'));document.querySelector('#scr-game').classList.add('on')}""")
 for w,h in [(320,578),(390,844)]:
  page.set_viewport_size({'width':w,'height':h})
  for city in ['miryang','daegu','muju','jeonju','daejeon','suwon','gwangju']:
   for night in [False,True]:
    result=page.evaluate("""({city,night})=>{
      S.at=city;S.driving=null;S.min=night?23*60:10*60;UI.showStl(city,'hub');
      for(let i=0;i<180;i++)SCENE.drawSettlement(.05);
      const hub=document.querySelector('.stl-hub-v2'),dock=hub.querySelector('.stl-hub-dock');
      const bounds=[...hub.querySelectorAll('#stl-enter,#stl-out')].map(n=>{
        const r=n.getBoundingClientRect();return {id:n.id,x:r.x,y:r.y,right:r.right,bottom:r.bottom,h:r.height,w:r.width,disabled:n.disabled};});
      return {bounds,nightButtons:[...hub.querySelectorAll('[data-stlfocus]')].map(n=>({id:n.dataset.stlfocus,disabled:n.disabled})),overflow:hub.scrollWidth>hub.clientWidth,dockScroll:dock.scrollHeight-dock.clientHeight};
    }""",{'city':city,'night':night})
    ok=not result['overflow'] and len(result['bounds'])==2 and all(b['bottom']<=h and b['x']>=0 and b['right']<=w and b['h']>=44 and b['w']>=44 and not b['disabled'] for b in result['bounds'])
    if night: ok=ok and all(b['disabled']==(b['id']!='people') for b in result['nightButtons'])
    print(('PASS' if ok else 'FAIL'),city,w,'night' if night else 'day',result if not ok else '')
    if not ok: failures.append((city,w,night,result))
 browser.close()
assert not failures, f'{len(failures)} city action states are clipped or unreachable'
