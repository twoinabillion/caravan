"""Explicit active-route fixtures; click the actual recommended departure card."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-artifacts/director-cities-2026-09-11';rows=[]
with sync_playwright() as p:
 b=p.chromium.launch()
 for route,at,to in [('ridge','sangju','mungyeong'),('market','muju','jeonju')]:
  g=b.new_page(viewport={'width':390,'height':844});g.goto('http://localhost:4176/game?caravan-live=1')
  g.evaluate("G.newGame('onroad','하린','full');G.save()");g.reload();g.wait_for_timeout(600)
  if g.locator('.onboarding-route-start:visible').count():g.locator('.onboarding-route-start:visible').click()
  g.evaluate('''({route,at})=>{S.at=at;S.known=Object.keys(D.nodes);
   S.recruitQ={id:'parkss',target:'gumi',stage:'task'};G.ensureQuestLedger().tracked=['companion_parkss'];
   G.chooseRoute(route);UI.renderAll()}''',{'route':route,'at':at})
  card=g.locator('.nav-destination-card.is-selected');assert card.get_attribute('data-nav-depart')==to
  assert '사이드 미션 경로' in card.inner_text();g.screenshot(path=str(OUT/f'{route}-tracked-clinic-stopped.png'))
  card.click();g.wait_for_timeout(600)
  text=g.locator('.travel-destination-action').inner_text();assert '청주' in text and '구미' in text,text
  g.screenshot(path=str(OUT/f'{route}-tracked-clinic-driving.png'))
  rows.append({'route':route,'from':at,'to':to,'text':text,'plan':g.evaluate('G.questNavigationPlan()')})
  g.close()
 b.close()
(OUT/'route-cues.json').write_text(json.dumps({'provenance':'Explicit active-route and tracked Parkss task fixtures; actual recommended card click starts real travel, no teleport after fixture.','rows':rows},ensure_ascii=False,indent=2))
print('PASS both stopped recommendations and driving waypoint text')
