"""Live city fixtures: normal Continue/animation; actual action/return/reload clicks."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-artifacts/director-cities-2026-09-11';OUT.mkdir(parents=True,exist_ok=True)
rows=[]
with sync_playwright() as p:
 b=p.chromium.launch()
 for width,height in [(390,844),(320,578)]:
  g=b.new_page(viewport={'width':width,'height':height});errors=[]
  g.on('pageerror',lambda e:errors.append(str(e)))
  g.goto('http://localhost:4176/game?caravan-live=1')
  g.evaluate("G.newGame('onroad','하린','full');G.save()")
  g.reload();g.wait_for_timeout(600)
  if g.locator('.onboarding-route-start:visible').count():g.locator('.onboarding-route-start:visible').click()
  for city in ['gwangju','miryang','daegu','muju','jeonju','daejeon','suwon']:
   g.evaluate('''id=>{S.at=id;S.driving=null;S.min=600;UI.showStl(id,'hub')}''',city)
   g.wait_for_function("!document.querySelector('#stl-enter').disabled",timeout=15000)
   before=g.locator('[data-stl-concern]').inner_text()
   g.wait_for_function("!document.querySelector('#toasts')?.children.length",timeout=45000)
   g.screenshot(path=str(OUT/f'{city}-day-before-{width}.png'))
   g.locator('[data-stl-concern]').click()
   g.locator('#alley-action').click()
   assert g.locator('[data-field-result]').count()==1
   g.locator('#stl-hub-back').click()
   g.wait_for_function("!document.querySelector('#stl-enter').disabled",timeout=15000)
   after=g.locator('[data-stl-concern]').inner_text()
   assert after!=before,(city,before,after)
   g.wait_for_function("!document.querySelector('#toasts')?.children.length",timeout=45000)
   g.screenshot(path=str(OUT/f'{city}-day-after-{width}.png'))
   g.locator('#stl-out').click()
   assert not g.locator('#ovl-stl.on').count()
   g.evaluate('G.save()');g.reload();g.wait_for_timeout(800)

   if not g.locator('#ovl-stl.on').count():
    g.locator('[data-journey-mode="local"]').click()
    g.locator('[data-a="stl"]:visible').first.click()
   assert g.locator('[data-stl-concern]').inner_text()==after
   g.evaluate("S.min=1380;UI.showStl(S.at,'hub')")
   g.wait_for_function("!document.querySelector('#stl-enter').disabled",timeout=15000)
   assert g.locator('[data-stlfocus]:disabled').count()==3
   boxes=g.locator('#stl-enter,#stl-out,[data-stl-concern]').evaluate_all('''nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {id:n.id,height:r.height,bottom:r.bottom,right:r.right,top:r.top}})''')
   assert all(x['height']>=44 and x['bottom']<=height and x['right']<=width for x in boxes),(city,width,boxes)
   assert g.locator('#stl-body').evaluate('n=>n.scrollWidth<=n.clientWidth')
   g.wait_for_function("!document.querySelector('#toasts')?.children.length",timeout=45000)
   g.screenshot(path=str(OUT/f'{city}-night-{width}.png'))
   g.locator('[data-stl-concern]').click()
   assert g.locator('#people-action').count()==1
   g.locator('#stl-hub-back').click();g.locator('#stl-out').click()
   rows.append({'city':city,'viewport':[width,height],'before':before,'after':after,'nightControls':boxes,'reload':True})
  assert not errors,errors
  g.close()
 b.close()
(OUT/'trace.json').write_text(json.dumps({'provenance':'Explicit location/time fixtures. Real normal Continue and animation; actual hub/action/return/reload controls. No natural travel or timing claim.','rows':rows},ensure_ascii=False,indent=2))
print('PASS 14 city/viewport help-return-reload-night flows; zero pageerrors')
