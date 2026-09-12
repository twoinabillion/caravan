#!/usr/bin/env python3
"""A dismissed first meeting must remain reachable from both city surfaces."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
failures=[]
with sync_playwright() as p:
 b=p.chromium.launch();page=b.new_page(viewport={'width':390,'height':844})
 page.goto((ROOT/'서울까지400km.html').as_uri())
 for id in ['minji','parkss','leo','jaeyi','eunsu','kangwoo']:
  result=page.evaluate("""id=>{
   G.newGame('onroad','다시 만나기','full');G.save=()=>{};
   const def=D.recruitQuests[id];S.at=def.meetNode;
   G.openRecruitMeet(id); // remembers the encounter before any decision
   document.querySelector('#ev-wrap').classList.remove('on');
   const seen=S.used.includes(def.meet);
   UI.showStl(S.at,'hub');const map=SCENE.settlementState()?.recruit?.id===id;
   UI.showStl(S.at,'people');const list=!!document.querySelector('[data-person-key="recruit-'+id+'"]');
   return {seen,map,list};
  }""",id)
  ok=all(result.values()); print(('PASS' if ok else 'FAIL'),id,result)
  if not ok:failures.append(id);continue
  page.locator(f'[data-person-key="recruit-{id}"]').click();page.locator('#people-action').click()
  assert page.locator('#ev-wrap').get_attribute('aria-hidden')=='false'
  result=page.evaluate("""id=>{
   document.querySelector('#ev-wrap').classList.remove('on');G.startRecruitQuest(id);
   UI.showStl(S.at,'hub');const activeHidden=!SCENE.settlementState()?.recruit;
   S.recruitQ=null;S.party=[id];UI.showStl(S.at,'people');
   return {activeHidden,joinedHidden:!document.querySelector('[data-person-key="recruit-'+id+'"]')};
  }""",id)
  assert all(result.values()),(id,result)
 b.close()
assert not failures, f'Companions disappeared after first meeting: {failures}'
