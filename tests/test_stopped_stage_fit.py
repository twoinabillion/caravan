#!/usr/bin/env python3
"""Fresh opening must leave an actually clickable stopped departure console.

A fitter regression that takes space from already-overflowing route content
makes this fail before departure. No state grants, forced clicks, or CSS patches.
"""
import hashlib
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
URL=os.environ.get('CARAVAN_CAPTURE_URL',(ROOT/'서울까지400km.html').as_uri())
OUT=Path(os.environ.get('CARAVAN_STAGE_OUTPUT',str(ROOT/'artifacts/director-pass-2026-09-11/stopped-stage-fit')))
GEOMETRY="""() => {const rect=s=>{const n=document.querySelector(s),r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,style:n.getAttribute('style'),scrollHeight:n.scrollHeight,clientHeight:n.clientHeight}};return {viewport:{width:innerWidth,height:innerHeight},stage:rect('#stage'),panel:rect('#panel'),dock:rect('#dock'),console:rect('.route-console-screen'),mode:document.documentElement.dataset.journeyMode,at:S.at,driving:!!S.driving}}"""

def opening(page):
 page.click('#bt-new')
 if page.locator('#scr-mode').is_visible(): page.click('#mode-on')
 page.fill('#inp-name','하린');page.click('#bt-name')
 for _ in range(300):
  if page.evaluate("()=>!!S.opening?.completed&&Object.keys(S.opening.decisions||{}).length===5&&!!S.flags?.main_mission_started&&!UI.modalOpen()"):
   return
  for selector in ['#ev-sheet .story-next:visible:not([disabled])','#ev-sheet .onboarding-route-start:visible:not([disabled])','#ev-sheet [data-r]:visible:not([disabled])','#ev-sheet [data-i]:visible:not([disabled])']:
   b=page.locator(selector)
   if b.count():b.first.click();page.wait_for_timeout(40);break
  else:page.wait_for_timeout(80)
 raise AssertionError('fresh opening did not complete')

def main():
 OUT.mkdir(parents=True,exist_ok=True);rows=[]
 sizes=[(320,578),(360,700),(390,844),(1440,900)]
 if os.environ.get('CARAVAN_STAGE_WIDTHS'):sizes=[x for x in sizes if str(x[0]) in os.environ['CARAVAN_STAGE_WIDTHS'].split(',')]
 with sync_playwright() as p:
  browser=p.chromium.launch()
  for width,height in sizes:
   page=browser.new_page(viewport={'width':width,'height':height});errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script("localStorage.setItem('caravan_story_auto','0');localStorage.setItem('caravan_intro_auto','0')")
   page.goto(URL,wait_until='domcontentloaded');page.wait_for_function("typeof G!=='undefined'&&typeof UI!=='undefined'")
   opening(page);page.wait_for_timeout(600)
   row={'width':width,'height':height,'afterOpening':page.evaluate(GEOMETRY)};rows.append(row)
   page.screenshot(path=str(OUT/f'{width}-after-opening.png'));(OUT/'geometry.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
   assert row['afterOpening']['dock']['bottom']<=height+1,('dock outside viewport',row)
   assert row['afterOpening']['console']['height']>80,('departure console collapsed',row)
   # Exercise both stopped modes before the real destination card click.
   page.locator('[data-journey-mode="local"]:visible').click();page.wait_for_timeout(180)
   page.locator('[data-journey-mode="route"]:visible').click();page.wait_for_timeout(180)
   row['afterModeSwitch']=page.evaluate(GEOMETRY)
   assert row['afterModeSwitch']['dock']['bottom']<=height+1,('dock drift after mode switch',row)
   chosen=page.evaluate("()=>G.questPreferredNeighbor(G.neighbors(S.at).filter(n=>G.canTravelTo(n.id).ok).map(nb=>({nb})))?.nb?.id")
   assert chosen
   depart=page.locator(f'[data-nav-depart="{chosen}"]:visible')
   if not depart.count():page.locator(f'[data-route-select="{chosen}"]:visible').last.click();depart=page.locator(f'[data-nav-depart="{chosen}"]:visible')
   depart.last.click(timeout=5000);page.wait_for_timeout(250)
   row['departure']=page.evaluate('()=>({from:S.driving?.from,to:S.driving?.to,fuel:S.fuel,infinite:G.isInfiniteResourceMode()})')
   assert row['departure']['from']=='busan' and row['departure']['to']==chosen and not row['departure']['infinite'],row
   assert not errors,errors
   row['pageErrors']=errors;page.screenshot(path=str(OUT/f'{width}-departure.png'));page.close()
  browser.close()
 receipt={'htmlSha256':hashlib.sha256((ROOT/'서울까지400km.html').read_bytes()).hexdigest(),'results':rows,'status':'passed'}
 (OUT/'receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n');print(json.dumps(receipt,ensure_ascii=False))

if __name__=='__main__':main()
