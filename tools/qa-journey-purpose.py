#!/usr/bin/env python3
"""Synthetic presentation matrix on an explicit local preview. Never a human/full journey test."""
import argparse,json,time
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--url',required=True);p.add_argument('--save',required=True);p.add_argument('--out',required=True);p.add_argument('--large-text',action='store_true');a=p.parse_args()
assert a.url.startswith(('http://127.0.0.1:','http://localhost:'))
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from tests.director_journey_helpers import install_checkpoint_once
out=Path(a.out);out.mkdir(parents=True,exist_ok=True);rows=[];errors=[]
with sync_playwright() as p:
 b=p.chromium.launch();c=b.new_context(viewport={'width':360,'height':728});install_checkpoint_once(c,Path(a.save).read_text())
 if a.large_text:c.add_init_script("localStorage.setItem('caravan_ui_text','large')")
 page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(a.url,wait_until='domcontentloaded',timeout=120000);page.wait_for_function("typeof UI!=='undefined'&&!!S",timeout=120000)
 if page.locator('#bt-continue:visible').count():page.click('#bt-continue')
 page.wait_for_selector('#scr-game.on');page.wait_for_timeout(500)
 ids=page.evaluate('Object.keys(D.nodes)')
 for width,height in [(320,578),(360,728),(480,850)]:
  page.set_viewport_size({'width':width,'height':height})
  for at in ids:
   # Explicit synthetic presentation state, never the player's profile/save.
   page.evaluate('''at=>{S.at=at;S.driving=null;S.recruitQ=null;S.quest=null;S.questFollowup=null;S.questLedger.tracked=[];S.known=Object.keys(D.nodes);UI.renderAll()}''',at)
   row=page.locator('.journey-place-choice').evaluate('''e=>{const p=e.querySelector('.journey-place-preview'),r=p.getBoundingClientRect(),b=e.getBoundingClientRect();return {text:p.innerText,previewHeight:r.height,previewBottom:r.bottom,buttonBottom:b.bottom,scroll:p.scrollWidth,client:p.clientWidth}}''')
   row.update({'width':width,'at':at});rows.append(row)
   assert row['scroll']<=row['client']+1,row
   assert row['previewBottom']<=row['buttonBottom']+1,row
  page.evaluate("S.at='busan';S.flags.first_order_trace=false;UI.renderAll()")
  page.screenshot(path=str(out/f'{width}-opening-purpose.png'))
  before=page.evaluate('JSON.stringify([S.at,S.fuel,S.min,S.stats,S.flags])');page.locator('[data-trip-destination]').click();page.screenshot(path=str(out/f'{width}-picker.png'));assert page.locator('#trip-destination-dialog [data-trip-route]').count()==2;page.keyboard.press('Escape');assert page.evaluate('JSON.stringify([S.at,S.fuel,S.min,S.stats,S.flags])')==before
  for stage in ['task','road','follow','ready']:
   page.evaluate('''stage=>{S.at='ulsan';S.day=3;S.recruitQ={id:'minji',stage,target:'ulsan',roadDay:3};G.ensureQuestLedger().tracked=['companion_minji'];UI.renderAll()}''',stage)
   page.locator('#dk-objectives').click();page.locator('[data-quest-tab="side"]').click() if page.locator('[data-quest-tab="side"]').count() else None
   page.screenshot(path=str(out/f'{width}-companion-{stage}.png'));page.keyboard.press('Escape')
 for corridor in ['ridge','market']:
  page.evaluate('''corridor=>{G.newGame('onroad','화면 검수','full');S.at='gimcheon';S.recruitQ={id:'parkss',stage:'task',target:'gumi'};G.ensureQuestLedger().tracked=['companion_parkss'];G.chooseRoute(corridor);S.at=D.routePlans[corridor].corridor.at(-2);UI.renderAll()}''',corridor)
  text=page.locator('.journey-place-preview').first.inner_text();assert '구미' in text and '함께할 곳' not in text,text
  page.screenshot(path=str(out/f'{corridor}-release-waypoint.png'))
 result={'kind':'synthetic UI matrix, not journeys','largeText':a.large_text,'rows':rows,'pageErrors':errors};(out/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));assert not errors;print(json.dumps({'checks':len(rows),'pageErrors':errors}));b.close()
