"""Diagnostic real-UI campaign probe. No state/resource/progress grants.

Dialogue reveal and driving ticks are accelerated; event/UI handlers and all
resource costs are real. This is not fresh-player pacing or fun evidence.
"""
from pathlib import Path
import argparse, json, time
from playwright.sync_api import sync_playwright

ap=argparse.ArgumentParser()
ap.add_argument('--root',default=str(Path(__file__).resolve().parents[1]))
ap.add_argument('--url',default='http://localhost:4176/game?caravan-live=1')
ap.add_argument('--limit',type=int,default=1800)
ap.add_argument('--companion',default='')
ap.add_argument('--main-record-route',action='store_true')
ap.add_argument('--stop-at-first-night',action='store_true')
ap.add_argument('--output',default='artifacts/director-pass-2026-09-11/task3-main-route.json')
a=ap.parse_args()
trace=[]
STATE='''() => ({at:S.at, day:S.day,min:Math.round(S.min),km:Math.round(S.stats.km),
 fuel:S.fuel,water:S.water,food:S.food,scrap:S.scrap,van:S.van,fatigue:S.fatigue,
 driving:!!S.driving,approach:!!S.driving?.approach,ended:!!S.ended,endKind:S.endKind,
 event:document.querySelector('#ev-wrap.on #ev-sheet')?.dataset.eventId,
 phase:document.querySelector('#ev-wrap.on #ev-sheet')?.dataset.storyPhase,
 modal:UI.modalOpen(),party:S.party,recruitQ:S.recruitQ,flags:S.flags,ready:G.seoulReady(),missing:G.seoulMissing(),
 queue:S._beatQueue,chain:S._chain,used:S.used})'''

with sync_playwright() as p:
 browser=p.chromium.launch()
 page=browser.new_page(viewport={'width':390,'height':844})
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script("localStorage.setItem('caravan_story_auto','0');localStorage.setItem('caravan_intro_auto','0')")
 page.goto(a.url)
 page.evaluate('G.seedOverride=400911')
 page.click('#bt-new')
 page.fill('#inp-name','하린')
 page.click('#bt-name')
 page.wait_for_timeout(120)
 if page.locator('#scr-intro').is_visible(): page.evaluate('UI.skipIntro()')
 page.evaluate('G.seedOverride=undefined')
 assert not page.evaluate('G.isInfiniteResourceMode()')
 capture_dir=Path(a.output).parent/'task3-captures'
 capture_dir.mkdir(parents=True,exist_ok=True)
 captured=set()
 page.evaluate('(id)=>window.probeCompanion=id',a.companion)
 explored=set()
 stopped=0
 reason='iteration limit'
 start=time.monotonic()
 try:
  for step in range(a.limit):
   s=page.evaluate(STATE)
   if s['ended']:
    reason='ended'
    break
   if a.stop_at_first_night and s.get('recruitQ') and s['recruitQ'].get('stage')=='follow' and not s['modal']:
    reason='temporary guest reached first night'
    page.locator('[data-a="camp"]').first.click()
    page.wait_for_timeout(350)
    break
   if a.companion and a.companion in s['party'] and not s['modal']:
    reason='companion recruited through normal flow'
    break
   if s.get('event'):
    page.evaluate('UI.finishStory()')
    if s['event'].startswith('main_') and s['event'] not in captured:
     page.screenshot(path=str(capture_dir/(s['event']+'.png')))
     captured.add(s['event'])
    if s['event'].startswith('opening_'):
     btn=page.locator('.event-choice-dock .primary-exit-btn:visible')
     if btn.count(): btn.click();page.wait_for_timeout(520);continue
     btn=page.locator('.event-choice-dock .choice:visible:not([disabled])')
     if btn.count():
      trace.append({'kind':'opening choice','event':s['event'],'choice':0,'before':s})
      btn.first.click();page.wait_for_timeout(80);continue
    direct=page.locator('#ev-sheet .onboarding-route-start:visible')
    if direct.count():
     trace.append({'kind':'mission accepted','event':s['event']})
     direct.click();page.wait_for_timeout(600);continue
    result=page.locator('#ev-sheet [data-r]:visible:not([disabled])')
    if result.count():
     preferred=page.locator('#ev-sheet [data-r="ok"]:visible:not([disabled])')
     (preferred if preferred.count() else result.first).click()
     page.wait_for_timeout(520)
     continue
    choices=page.locator('#ev-sheet [data-i]:visible:not([disabled])')
    if choices.count():
     index=page.evaluate('''() => {
       const id=document.querySelector('#ev-sheet').dataset.eventId;
       const e=D.events.find(x=>x.id===id)||D.onboardingMission;
       const buttons=[...document.querySelectorAll('#ev-sheet [data-i]:not([disabled])')];
       const score=c=>(c?.out||[]).reduce((n,o)=>{
         const f=o.fx||{}; return n+(o.p||1)*(
           (f.flag?20:0)+(f.flag2?10:0)+(f.chain?10:0)+
           (f.startRecruit===window.probeCompanion?200:0)+(f.recruitRoad===window.probeCompanion?200:0)+(f.recruitJoin===window.probeCompanion?200:0)+
           (f.fuel||0)*3+(f.water||0)*2+(f.food||0)*2+(f.scrap||0)-
           (f.pursuit||0)*30+(f.van||0)*.6-(f.time||0)*.01);
       },0);
       return buttons.map(b=>({i:+b.dataset.i,s:score(e?.choices?.[+b.dataset.i])})).sort((a,b)=>b.s-a.s)[0]?.i;
     }''')
     trace.append({'kind':'choice','event':s['event'],'choice':index,'before':s})
     print(json.dumps({'event':s['event'],'choice':index,'at':s['at'],'km':s['km']},ensure_ascii=False),flush=True)
     page.locator(f'#ev-sheet [data-i="{index}"]').click()
     page.wait_for_timeout(60)
     continue
   # Explicit close controls invoke their normal handlers; no DOM/state reset.
   if s['modal']:
    closed=False
    for selector in ['#stl-leave','#camp-x','#map-x','#j-x','#st-x','#ev-sheet [data-x]','[data-arrival-continue]']:
     btn=page.locator(selector)
     if btn.count() and btn.first.is_visible():
      btn.first.click();closed=True;break
    page.wait_for_timeout(160)
    stopped=stopped+1 if not closed else 0
    if stopped>120:
     reason='unhandled modal'
     trace.append({'kind':reason,'html':page.locator('body').inner_text()[-3500:]})
     break
    continue
   stopped=0
   if s['driving']:
    page.evaluate('''() => {for(let i=0;i<30 && S.driving&&!S.driving.approach&&!UI.modalOpen();i++)G.tick(.25)}''')
    page.wait_for_timeout(60 if not s['approach'] else 200)
    continue
   if a.companion:
    recruit_action=page.evaluate('''() => {
      const id=window.probeCompanion,def=D.recruitQuests[id],q=S.recruitQ;
      if(q&&q.stage==='follow'&&S.day<=q.roadDay){G.camp();return {kind:'recruit-night',at:S.at,id};}
      if(q&&G.openRecruitStep())return {kind:'recruit-step',stage:q.stage,at:S.at,id};
      if(!q&&def.meetNode===S.at&&G.openRecruitMeet(id))return {kind:'recruit-meet',at:S.at,id};
      return null;
    }''')
    if recruit_action:
     trace.append(recruit_action);page.wait_for_timeout(600);continue
   opportunity=page.evaluate('G.mainEvidenceOpportunity()')
   if opportunity and opportunity['target']==s['at']:
    trace.append({'kind':'main evidence search','opportunity':opportunity,'before':s})
    page.locator('[data-a="explore"]').first.click()
    page.wait_for_timeout(650);continue
   if s['at']=='seoul':
    if not s['ready']:
     reason='Seoul reached without main-story readiness'
     break
    reason='main-story gate reached with solo authored evidence'
    page.wait_for_timeout(600)
    page.evaluate('UI.finishStory()')
    page.screenshot(path=str(capture_dir/'seoul-gate-390.png'))
    break
   action=page.evaluate('''() => {
     const stl=D.nodes[S.at]?.stl;
     if(stl){
       for(const [key,floor] of [['water',G.partySize()*4+4],['food',G.partySize()*3+3],['fuel',36]]){
         const i=(D.stls[stl].trade||[]).findIndex(r=>r[1]===key);
         if(i>=0&&S[key]<floor){const r=G.trade(stl,i);if(r?.ok)return {kind:'buy',key,at:S.at};}
       }
       if(S.van<55){const r=G.settlementRepair();if(r?.ok||r===true)return {kind:'repair',at:S.at};}
     }
     if(S.fatigue>=68||G.isNight()){G.camp();return {kind:'camp',at:S.at};}
     return null;
   }''')
   if action:
    trace.append(action);page.wait_for_timeout(700);continue
   visit=(s['at'],s['day'])
   if visit not in explored and not (a.main_record_route and s['at'] in ['busan','daegu','mungyeong']):
    explored.add(visit)
    if page.evaluate('G.explore()'):
     trace.append({'kind':'explore','at':s['at'],'day':s['day']})
     page.wait_for_timeout(900)
     continue
   action=page.evaluate('''() => {
     const candidates=G.neighbors(S.at).filter(n=>G.canTravelTo(n.id).ok);
     const q=S.recruitQ,def=D.recruitQuests[window.probeCompanion];
     const goal=q&&['task','follow'].includes(q.stage)?q.target:def&&!q?def.meetNode:G.questNavigationPlan().target;
     candidates.sort((a,b)=>(a.km+G.questGraphDistance(a.id,goal))-(b.km+G.questGraphDistance(b.id,goal)));
     if(!candidates.length)return {kind:'blocked',at:S.at,neighbors:G.neighbors(S.at).map(n=>({id:n.id,check:G.canTravelTo(n.id)}))};
     const to=candidates[0].id,from=S.at;
     return {kind:'travel',from,to,ok:G.startTravel(to)};
   }''')
   trace.append(action)
   if action['kind']=='blocked':
    reason='route blocked';break
   if len(trace)%15==0:
    print(json.dumps({'step':step,'action':action,'day':s['day'],'km':s['km']},ensure_ascii=False),flush=True)
   page.wait_for_timeout(300)
 except Exception as e:
  reason='probe exception: '+str(e)
 final=page.evaluate(STATE)
 dest=Path(a.output)
 dest.parent.mkdir(parents=True,exist_ok=True)
 page.screenshot(path=str(dest.with_suffix('.png')),full_page=False)
 dest.write_text(json.dumps({'reason':reason,'elapsed':round(time.monotonic()-start,1),'source':a.root,'mode':'real UI, accelerated dialogue reveal and engine driving ticks; no grants','errors':errors,'final':final,'trace':trace},ensure_ascii=False,indent=2))
 page.evaluate('G.save()')
 dest.with_suffix('.save.json').write_text(page.evaluate('JSON.stringify(S)'))
 print(json.dumps({'reason':reason,'at':final['at'],'km':final['km'],'ready':final['ready'],'missing':final['missing'],'events':len(final['used']),'report':str(dest)},ensure_ascii=False),flush=True)
 browser.close()
