#!/usr/bin/env python3
"""Reproducible final director-journey campaign runner.

Fresh scenarios use real controls, finite resources and gameplay APIs. Dialogue
and driving may be accelerated, but progress is never granted. Finale forks
preload one exact earned save in a fresh context, once.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from tests.director_journey_helpers import (  # noqa: E402
    TraceChain, capture_gameplay_save, canonical_json, continue_from_title,
    install_checkpoint_once, reload_exact_once, sha256_bytes, sha256_file, sha256_text,
    snapshot, timed_pause,
)

CHOICES = {"minji":"listen","parkss":"share","leo":"line","jaeyi":"space","eunsu":"facts","kangwoo":"trust"}
MEET_PATHS = {
 "minji":["yangsan","miryang"],
 "parkss":["gimhae","jinju","namwon","jeonju"],
 "leo":["gimhae","jinju","namwon","damyang","gwangju"],
 "jaeyi":["yangsan","miryang","hapcheon","geochang","muju"],
 "eunsu":["yangsan","miryang","hapcheon","geochang","muju","yeongdong","daejeon"],
 "kangwoo":["yangsan","miryang","daegu"],
}
CREW=["minji","kangwoo","jaeyi"]
CREW_PATHS={
 "minji":["yangsan","miryang"],
 "kangwoo":["yangsan","ulsan","gyeongju","daegu"],
 "jaeyi":["hapcheon","geochang","muju"],
}
PENDING_CLASSES=["recruitment-event","recruitment-result","camp-event","camp-result","ordinary-event","ordinary-result","combat-event","combat-result","seoul_open","seoul_han","seoul_ruins","seoul_square","seoul_base","seoul_core","seoul_costs","seoul_decision","seoul_night","seoul_uplink_reveal","seoul_session_reset"]


def arguments():
 p=argparse.ArgumentParser()
 p.add_argument("--root",default=str(ROOT));p.add_argument("--url",default="http://127.0.0.1:4176/game?caravan-live=1")
 p.add_argument("--scenario",choices=("route","recruit","crew-checkpoint","finale","reload-matrix","normal-opening","normal-earned"),required=True)
 p.add_argument("--route",choices=("ridge","market"),default="ridge");p.add_argument("--companion",choices=tuple(CHOICES));p.add_argument("--camp-choice")
 p.add_argument("--method",choices=("core_transfer","core_sleep","core_quarantine"));p.add_argument("--checkpoint")
 p.add_argument("--seed",type=int,default=400911);p.add_argument("--pause-ms",type=int,default=0);p.add_argument("--limit",type=int,default=3200);p.add_argument("--output",required=True)
 return p.parse_args()


class Campaign:
 def __init__(self,a,browser):
  self.a=a;self.root=Path(a.root).resolve();self.out=Path(a.output);self.out=self.out if self.out.is_absolute() else self.root/self.out;self.out.mkdir(parents=True,exist_ok=True)
  self.trace=TraceChain(self.sid());self.errors=[];self.console=[];self.timings=[];self.captures=[];self.reloads=[];self.captured=set();self.cursors={};self.explored=set();self.stalled_ticks=0
  context_options={"viewport":{"width":390,"height":844},"accept_downloads":True}
  if a.scenario.startswith("normal-"):
   (self.out/"video").mkdir(exist_ok=True);context_options.update(record_video_dir=str(self.out/"video"),record_video_size={"width":390,"height":844})
  self.context=browser.new_context(**context_options)
  self.checkpoint=Path(a.checkpoint).read_text(encoding="utf-8") if a.checkpoint else None
  if self.checkpoint: install_checkpoint_once(self.context,self.checkpoint)
  else:self.context.add_init_script("localStorage.setItem('caravan_story_auto','0');localStorage.setItem('caravan_intro_auto','0')")
  self.page=self.context.new_page();self.page.on("pageerror",lambda e:self.errors.append(str(e)));self.page.on("console",lambda m:self.console.append(m.text) if m.type=="error" else None)
  self.http_errors=[];self.page.on("response",lambda r:self.http_errors.append({"status":r.status,"url":r.url}) if r.status>=400 else None)
  self.response=None;self.responses=[];self.original_response=None;self.resume_mode=None;self.run_log=self.out/"run.log";self.run_log.write_text("",encoding="utf-8")

 def emit(self,payload):
  line=canonical_json(payload);print(line,flush=True)
  with self.run_log.open("a",encoding="utf-8") as stream:stream.write(line+"\n")

 def sid(self):
  if self.a.scenario=="route":return f"route-{self.a.route}"
  if self.a.scenario=="recruit":return f"recruit-{self.a.companion}"
  if self.a.scenario=="finale":return f"finale-{self.a.method.removeprefix('core_')}"
  return self.a.scenario

 def goto(self):
  assert "rev" not in self.a.url and "caravan-live=1" in self.a.url
  local=self.root/"서울까지400km.html";local_hash=sha256_file(local)
  def deliver_original(route):
   if self.original_response:
    source=self.responses[0];receipt={"url":source["url"],"status":source["status"],"bytes":source["bytes"],"sha256":source["sha256"],"navigation":len(self.responses)+1,"fetchBodyMs":0,"sourceNavigation":1,"capture":"reuse exact route.fetch response verified on navigation 1; fulfill cached original response unchanged"}
    assert receipt["sha256"]==local_hash,"cached served HTML differs from local build"
    self.responses.append(receipt);fulfill_started=time.monotonic();route.fulfill(response=self.original_response)
    receipt["fulfillMs"]=round((time.monotonic()-fulfill_started)*1000);self.emit({"phase":"main-cached-fulfilled","navigation":receipt["navigation"],"fulfillMs":receipt["fulfillMs"]});return
   self.emit({"phase":"main-fetch-start","scenario":self.sid()})
   fetch_started=time.monotonic()
   original=route.fetch(timeout=120_000);body=original.body()
   fetch_ms=round((time.monotonic()-fetch_started)*1000)
   self.emit({"phase":"main-body","bytes":len(body),"sha256":sha256_bytes(body),"fetchBodyMs":fetch_ms})
   receipt={"url":original.url,"status":original.status,"bytes":len(body),
    "sha256":sha256_bytes(body),"navigation":len(self.responses)+1,
    "fetchBodyMs":fetch_ms,"capture":"route.fetch original response; hash exact bytes; fulfill cached original response unchanged"}
   assert receipt["sha256"]==local_hash,"served HTML differs from local build"
   self.responses.append(receipt);self.original_response=original;fulfill_started=time.monotonic();route.fulfill(response=original)
   receipt["fulfillMs"]=round((time.monotonic()-fulfill_started)*1000)
   self.emit({"phase":"main-fulfilled","fulfillMs":receipt["fulfillMs"]})
  self.page.route(self.a.url,deliver_original)
  response=self.page.goto(self.a.url,wait_until="commit",timeout=300_000);assert response and response.ok
  self.page.wait_for_function("typeof G!=='undefined'&&typeof UI!=='undefined'",timeout=120_000)
  self.emit({"phase":"game-runtime-ready","build":self.page.evaluate("GAME_BUILD")})
  assert self.responses;self.response=self.responses[0]
  self.page.evaluate("localStorage.setItem('caravan_story_auto','0');localStorage.setItem('caravan_intro_auto','0')")

 def fresh(self):
  self.goto();self.page.evaluate("seed=>G.seedOverride=seed",self.a.seed);self.page.click("#bt-new")
  if self.page.locator("#scr-mode").is_visible():self.page.click("#mode-on")
  self.page.fill("#inp-name","하린");self.page.click("#bt-name")
  if self.page.locator("#scr-intro").is_visible():self.page.evaluate("UI.skipIntro()")
  self.page.evaluate("G.seedOverride=undefined;window.__CARAVAN_TEST_AUTO_MS=12")
  self.emit({"phase":"fresh-game","event":snapshot(self.page)["eventId"]})
  assert not self.page.evaluate("G.isInfiniteResourceMode()")

 def resume(self,accelerated=True):
  self.goto();self.resume_mode=continue_from_title(self.page)
  if accelerated:self.page.evaluate("window.__CARAVAN_TEST_AUTO_MS=12")
  self.emit({"phase":"resume","mode":self.resume_mode,"event":snapshot(self.page)["eventId"],"accelerated":accelerated})
  assert not self.page.evaluate("G.isInfiniteResourceMode()")

 def record(self,action,before,**extra):
  self.page.wait_for_timeout(25);row=self.trace.add(action,before,snapshot(self.page),**extra)
  if row["sequence"]%20==0:
   drive=row.get("travel");drive={k:drive.get(k) for k in ("from","to","gone","dist","approach")} if drive else None
   self.emit({"phase":"campaign-progress","scenario":self.sid(),"actions":row["sequence"],"at":row["location"],"event":row["eventId"],"drive":drive})
  return row

 def capture(self,event,phase):
  key=f"{event}-{phase}"
  if key in self.captured:return
  self.page.wait_for_timeout(300)
  path=self.out/f"{len(self.captures)+1:03d}-{key}.png";self.page.screenshot(path=str(path));self.captures.append({"eventId":event,"phase":phase,"path":path.name,"sha256":sha256_file(path)});self.captured.add(key)

 def current(self):
  if self.a.scenario=="recruit":return self.a.companion
  if self.a.scenario=="crew-checkpoint":return next((x for x in CREW if not self.page.evaluate("id=>S.party.includes(id)",x)),None)
  return None

 def choice_index(self,event):
  desired=self.a.method or self.a.camp_choice;route=self.a.route
  return self.page.evaluate("""([id,desired,route])=>{const e=G.presentationEvent(id)||G.campConversationEvent?.(),bs=[...document.querySelectorAll('#ev-sheet [data-i]:not([disabled])')];if(!bs.length)return null;if(id==='route_mid_fork')return route==='market'?1:0;const authored=b=>{const c=e?.choices?.[+b.dataset.i];return c?.id||(c?.out||[]).map(o=>o.fx?.flag2).find(Boolean)};const hit=bs.find(b=>authored(b)===desired);if(hit)return +hit.dataset.i;const score=c=>(c?.out||[]).reduce((n,o)=>{const f=o.fx||{};return n+(o.p||1)*((f.flag?25:0)+(f.flag2?15:0)+(f.chain?12:0)+(f.startRecruit?180:0)+(f.recruitRoad?180:0)+(f.recruitJoin?180:0)+(f.fuel||0)*3+(f.water||0)*2+(f.food||0)*2+(f.scrap||0)-(f.pursuit||0)*30+(f.van||0)*.6-(f.time||0)*.01)},0);return bs.map(b=>({i:+b.dataset.i,s:score(e?.choices?.[+b.dataset.i])})).sort((a,b)=>b.s-a.s)[0].i}""",[event,desired,route])

 def event(self,s):
  eid=s["eventId"]
  if eid and (eid.startswith(("main_","seoul_","rq_","camp_")) or self.a.scenario=="normal-opening" and eid.startswith("opening_")):
   phase=s.get("presentationPhase") or "event"
   if self.a.scenario.startswith("normal-"):phase=f"{phase}-{s.get('storyStep') or 'open'}"
   self.capture(eid,phase)
  nxt=self.page.locator("#ev-sheet .story-next:visible:not([disabled])")
  if nxt.count():
   if self.a.pause_ms:timed_pause(self.page,f"{eid}:next",self.a.pause_ms,self.timings)
   before=snapshot(self.page);nxt.first.click();self.record("story-next",before,control=".story-next");return True
  start=self.page.locator("#ev-sheet .onboarding-route-start:visible:not([disabled])")
  if start.count():
   before=snapshot(self.page)
   if self.a.pause_ms:timed_pause(self.page,f"{eid}:mission",self.a.pause_ms,self.timings)
   start.click();self.record("accept-main-mission",before,control=".onboarding-route-start");return True
  result=self.page.locator("#ev-sheet [data-r]:visible:not([disabled])")
  if result.count():
   preferred=self.page.locator('#ev-sheet [data-r="ok"]:visible:not([disabled]),#ev-sheet [data-r="yes"]:visible:not([disabled])');button=preferred.first if preferred.count() else result.first
   rid=button.get_attribute("data-r");before=snapshot(self.page)
   if self.a.pause_ms:timed_pause(self.page,f"{eid}:result",self.a.pause_ms,self.timings)
   button.click();self.record("result-continue",before,control="[data-r]",resultId=rid);return True
  buttons=self.page.locator("#ev-sheet [data-i]:visible:not([disabled])")
  if buttons.count():
   index=self.choice_index(eid);button=self.page.locator(f'#ev-sheet [data-i="{index}"]:visible:not([disabled])');assert button.count(),(eid,index)
   cid=self.page.evaluate("""([id,i])=>{const e=G.presentationEvent(id)||G.campConversationEvent?.(),c=e?.choices?.[i];return c?.id||(c?.out||[]).map(o=>o.fx?.routeChoice||o.fx?.flag2).find(Boolean)||String(i)}""",[eid,index]);before=snapshot(self.page)
   if self.a.pause_ms:timed_pause(self.page,f"{eid}:choice",self.a.pause_ms,self.timings)
   button.click();self.record("event-choice",before,control=f'[data-i="{index}"]',choiceId=cid);return True
  return False

 def modal(self,s):
  cid=self.current()
  if cid and not self.page.evaluate("id=>!!S.campMemories?.[id]?.choiceId",cid):
   talk=self.page.locator(f'[data-camp-talk="{cid}"]:visible:not([disabled])')
   if talk.count():before=snapshot(self.page);talk.click();self.record("camp-talk-open",before,control=f'[data-camp-talk="{cid}"]');return True
  go=self.page.locator("#seoul-go:visible:not([disabled])")
  if go.count():
   before=snapshot(self.page);label=go.inner_text()
   if self.a.pause_ms:timed_pause(self.page,f"{s.get('eventId') or 'seoul'}:continue",self.a.pause_ms,self.timings)
   go.click();self.record("seoul-stop",before,control="#seoul-go",label=label);return True
  rest=self.page.locator("#camp-rest:visible:not([disabled])")
  if rest.count():
   before=snapshot(self.page);rest.first.click();self.page.wait_for_timeout(250);self.record("camp-rest",before,control="#camp-rest");return True
  for sel in ("[data-arrival-continue]:visible:not([disabled])","#stl-leave:visible","#camp-x:visible","#map-x:visible","#j-x:visible","#st-x:visible","#ev-sheet [data-x]:visible"):
   b=self.page.locator(sel)
   if b.count():before=snapshot(self.page);b.first.click();self.record("modal-close",before,control=sel);return True
  return False

 def recruit(self,s):
  cid=self.current()
  if not cid:return False
  q=s.get("recruitQ");memory=self.page.evaluate("id=>S.campMemories?.[id]||null",cid)
  if q and q["id"]==cid:
   tracking=self.page.evaluate("""id=>{const key='companion_'+id,ledger=G.ensureQuestLedger();if(ledger.tracked.includes(key))return {changed:false,key,tracked:[...ledger.tracked]};for(const old of [...ledger.tracked]){if(old.startsWith('companion_'))G.toggleQuestTracking(old)}const result=G.toggleQuestTracking(key);return {changed:true,key,result,tracked:[...G.ensureQuestLedger().tracked]}}""",cid)
   if tracking["changed"]:self.record("track-recruit-objective",s,control="G.toggleQuestTracking",tracking=tracking);return True
  joined=self.page.evaluate("id=>S.party.includes(id)",cid)
  if not memory and (joined or q and q["id"]==cid and q["stage"] in ("road","follow","ready")):
   camp=self.page.locator('[data-a="camp"]:visible:not([disabled])')
   if camp.count():before=snapshot(self.page);camp.first.click();self.record("camp-open",before,control='[data-a="camp"]');return True
  action=self.page.evaluate("""id=>{const q=S.recruitQ,d=D.recruitQuests[id];if(q&&q.id===id&&q.stage==='follow'&&S.day<=q.roadDay){G.camp();return {kind:'recruit-night'}}if(q&&q.id===id&&G.openRecruitStep())return {kind:'recruit-step',stage:q.stage};if(!q&&d.meetNode===S.at&&G.openRecruitMeet(id))return {kind:'recruit-meet'};return null}""",cid)
  if action:self.page.wait_for_timeout(220);self.record(action["kind"],s,companion=cid,stage=action.get("stage"));return True
  return False

 def service(self,s):
  local_tab=self.page.locator('#panel [data-journey-mode="local"]:visible:not([disabled])')
  if local_tab.count() and local_tab.get_attribute("aria-selected")!="true":local_tab.click();self.page.wait_for_timeout(50)
  rescue=self.page.locator('#panel [data-a="walkfuel"]:visible:not([disabled])')
  if rescue.count():
   before=snapshot(self.page);rescue.click();self.page.wait_for_timeout(250);self.record("emergency-fuel",before,control='#panel [data-a="walkfuel"]');return True
  need_seats=self.a.scenario=="crew-checkpoint"
  long_mission=self.a.scenario in ("recruit","crew-checkpoint")
  action=self.page.evaluate("""([needSeats,longMission])=>{const stl=D.nodes[S.at]?.stl;if(stl){if(needSeats&&G.nextSeatUpgrade&&G.nextSeatUpgrade()&&G.seatCapacity()<4){const u=G.nextSeatUpgrade();if(G.canBuyUp(u.id).ok&&G.buyUpgrade(u.id))return {kind:'seat-upgrade',id:u.id};if((S.items['부품']||0)<(u.cost.parts||0)){const i=(D.stls[stl].trade||[]).findIndex(r=>r[1]==='item부품'||r[1]==='barter_fp');if(i>=0&&G.trade(stl,i)?.ok)return {kind:'buy-seat-parts'}}}for(const [key,floor] of [['water',G.partySize()*4+7],['food',G.partySize()*3+6],['fuel',longMission?55:38]]){const i=(D.stls[stl].trade||[]).findIndex(r=>r[1]===key);if(i>=0&&S[key]<Math.min(floor,S.fuelMax||floor)&&G.trade(stl,i)?.ok)return {kind:'buy',key}}if(S.van<58){const r=G.settlementRepair();if(r?.ok||r===true)return {kind:'repair'}}}if(S.fatigue>=68||G.isNight()){G.camp();return {kind:'camp'}}return null}""",[need_seats,long_mission])
  if action:self.page.wait_for_timeout(300);self.record(action["kind"],s,key=action.get("key"),upgrade=action.get("id"));return True
  return False

 def fixed_next(self,cid,at):
  path=CREW_PATHS[cid] if self.a.scenario=="crew-checkpoint" else MEET_PATHS[cid];cursor=self.cursors.get(cid,0)
  while cursor<len(path) and path[cursor]==at:cursor+=1
  self.cursors[cid]=cursor;return path[cursor] if cursor<len(path) else None

 def travel(self,s):
  cid=self.current();fixed=cid and cid not in s["party"] and not s.get("recruitQ") and self.fixed_next(cid,s["at"])
  route=self.page.evaluate("""fixed=>{const cs=G.neighbors(S.at).filter(nb=>G.canTravelTo(nb.id).ok),ms=cs.map(nb=>({nb})),plan=G.questNavigationPlan(),p=G.questPreferredNeighbor(ms),chosen=fixed||p?.nb?.id||cs[0]?.id;return {candidates:cs.map(x=>x.id),preferred:p?.nb?.id||null,chosen,plan,policy:fixed?'fixed-visible-meet-itinerary':'G.questPreferredNeighbor'}}""",fixed)
  assert route["chosen"],route
  if not fixed and route["preferred"]:assert route["chosen"]==route["preferred"]
  chosen=route["chosen"];road=self.page.locator("#dk-road:visible:not([disabled])")
  if road.count():road.click()
  self.page.evaluate("UI.renderAll()");self.page.wait_for_timeout(60)
  route_tab=self.page.locator('#panel [data-journey-mode="route"]:visible:not([disabled])')
  if route_tab.count() and route_tab.get_attribute("aria-selected")!="true":route_tab.click();self.page.wait_for_timeout(60)
  depart=self.page.locator(f'#panel [data-nav-depart="{chosen}"]:visible')
  if not depart.count():
   selector=self.page.locator(f'#panel [data-route-select="{chosen}"]:visible')
   assert selector.count(),(s["at"],route,self.page.locator("#panel").inner_text()[-1200:])
   selector.last.click();self.page.wait_for_timeout(80)
   depart=self.page.locator(f'#panel [data-nav-depart="{chosen}"]:visible')
  assert depart.count(),(s["at"],route,self.page.locator("#panel").inner_text()[-1200:])
  before=s;depart.last.click();self.page.wait_for_timeout(100);after=snapshot(self.page);assert after["drive"] and after["drive"]["to"]==chosen
  self.trace.add("travel",before,after,control=f'#panel [data-nav-depart="{chosen}"]',candidates=route["candidates"],preferred=route["preferred"],chosen=chosen,routePolicy=route["policy"]);return True

 def tick(self,s):
  self.page.evaluate("()=>{for(let i=0;i<32&&S.driving&&!S.driving.approach&&!UI.modalOpen();i++)G.tick(.25)}");self.page.wait_for_timeout(35 if not s["drive"].get("approach") else 180)
  after=snapshot(self.page);before_drive=s.get("drive") or {};after_drive=after.get("drive") or {}
  moved=not after_drive or after_drive.get("gone")!=before_drive.get("gone") or after_drive.get("approach")!=before_drive.get("approach") or after.get("eventId")!=s.get("eventId")
  self.stalled_ticks=0 if moved else self.stalled_ticks+1
  row=self.trace.add("accelerated-tick",s,after,control="G.tick(.25)",pace="accelerated")
  if row["sequence"]%20==0:
   drive=row.get("travel");drive={k:drive.get(k) for k in ("from","to","gone","dist","approach")} if drive else None
   self.emit({"phase":"campaign-progress","scenario":self.sid(),"actions":row["sequence"],"at":row["location"],"event":row["eventId"],"drive":drive})
  assert self.stalled_ticks<20,("driving made no progress",after,self.page.locator("body").inner_text()[-1200:])

 def done(self,s):
  if self.a.scenario=="crew-checkpoint":
   if s["eventId"]!="seoul_decision" or s["presentationPhase"]!="event":return False
   methods=self.page.evaluate("""()=>{const e=G.presentationEvent('seoul_decision');return [...document.querySelectorAll('#ev-sheet [data-i]:not([disabled])')].map(b=>e.choices[+b.dataset.i]?.out?.[0]?.fx?.flag2).filter(Boolean)}""")
   return set(methods)=={"core_transfer","core_sleep","core_quarantine"}
  if self.a.scenario=="recruit":
   m=s["campMemories"].get(self.a.companion);return self.a.companion in s["party"] and bool(m and m.get("choiceId")==self.a.camp_choice and m.get("home") and m.get("road") and not m.get("pendingRoad",True)) and not s["drive"]
  return s["ended"] and s["endKind"]=="story_done" and "story_done" in s["flags"]

 def loop(self):
  for _ in range(self.a.limit):
   s=snapshot(self.page)
   if self.done(s):return "complete"
   if s["ended"]:raise AssertionError(f"campaign ended before goal: {s['endKind']}")
   if s["eventId"] and self.event(s):continue
   if s["eventId"]:
    self.page.wait_for_timeout(50)
    continue
   if self.page.evaluate("UI.modalOpen()"):
    refreshed=snapshot(self.page)
    if refreshed["eventId"]:
     if self.event(refreshed):continue
     self.page.wait_for_timeout(50);continue
    if self.modal(refreshed):continue
    raise AssertionError("unhandled modal: "+self.page.locator("body").inner_text()[-1200:])
   if s["drive"]:self.tick(s);continue
   if self.recruit(s):continue
   opp=self.page.evaluate("G.mainEvidenceOpportunity()")
   if opp and opp.get("target")==s["at"]:
    b=self.page.locator('[data-a="explore"]:visible:not([disabled])')
    if b.count():before=snapshot(self.page);b.first.click();self.page.wait_for_timeout(220);self.record("main-evidence-search",before,control='[data-a="explore"]',opportunity=opp);continue
   if s["at"]=="seoul":self.page.wait_for_timeout(180);continue
   if self.service(s):continue
   visit=(s["at"],s["day"])
   if visit not in self.explored:
    self.explored.add(visit);before=s
    if self.page.evaluate("G.explore()"):self.page.wait_for_timeout(220);self.record("explore",before);continue
   self.travel(s)
  return "iteration-limit"

 def route_recruit_crew(self):self.fresh();return self.loop()

 def finale(self):
  assert self.a.method and self.checkpoint;self.resume();original=sha256_text(self.checkpoint);reason=self.loop();final=snapshot(self.page)
  assert final["archives"]==1 and final["endKind"]=="story_done" and final["seoul"]["method"]==self.a.method,final
  journal=self.page.locator("#end-journal:visible");journal.wait_for(state="visible");before=final;journal.click();self.record("end-journal",before,control="#end-journal")
  export=self.page.locator("#bt-export:visible");export.wait_for(state="visible")
  with self.page.expect_download() as info:export.click()
  path=self.out/(info.value.suggested_filename or "journey.md");info.value.save_as(str(path));assert path.is_file() and path.stat().st_size>0
  self.captures.append({"kind":"journal-export","path":path.name,"bytes":path.stat().st_size,"sha256":sha256_file(path)})
  assert sha256_text(self.checkpoint)==original;return reason

 def normal_opening(self):
  self.goto();self.page.evaluate("seed=>G.seedOverride=seed",self.a.seed);self.page.click("#bt-new")
  if self.page.locator("#scr-mode").is_visible():self.page.click("#mode-on")
  self.page.fill("#inp-name","하린");self.page.click("#bt-name")
  self.page.evaluate("G.seedOverride=undefined");self.a.pause_ms=max(4000,self.a.pause_ms)
  for _ in range(240):
   s=snapshot(self.page)
   complete=self.page.evaluate("()=>!!S.opening?.completed&&Object.keys(S.opening.decisions||{}).length>=5&&!!S.flags?.main_mission_started&&!UI.modalOpen()")
   if complete:
    choices=[row for row in self.trace.rows if row["action"]=="event-choice" and str(row.get("eventId") or "").startswith("opening_")]
    assert len(choices)>=5,choices
    assert len(self.timings)>=5 and all(row["requestedMs"]>=4000 for row in self.timings),self.timings
    return "complete"
   if s["eventId"] and self.event(s):continue
   self.page.wait_for_timeout(100)
  return "opening-timeout"

 def normal_earned(self):
  assert self.checkpoint;self.resume(accelerated=False);self.a.pause_ms=max(4000,self.a.pause_ms)
  initial=snapshot(self.page);assert initial["eventId"]=="seoul_decision" and not initial["drive"],initial
  reason=self.loop()
  assert not any(row["action"]=="accelerated-tick" for row in self.trace.rows),"normal proof used G.tick"
  assert any(row["action"]=="event-choice" and row.get("eventId")=="seoul_decision" for row in self.trace.rows)
  assert self.timings and all(row["requestedMs"]>=4000 for row in self.timings),self.timings
  return reason

 def reload_matrix(self):
  self.fresh();targets={"opening-event","opening-result","travel"};seen=set()
  for _ in range(self.a.limit):
   s=snapshot(self.page);phase=None
   if s["eventId"] and str(s["eventId"]).startswith("opening_"):phase="opening-result" if s.get("opening",{}).get("pendingResult") and s.get("presentationPhase")=="outcome" else "opening-event"
   elif s["drive"] and not self.page.evaluate("UI.modalOpen()"):phase="travel"
   if phase and phase not in seen:
    before,after=reload_exact_once(self.page);bs,restored=before["state"],after["state"]
    saved=after["loadedInput"]["state"]
    entry={"class":phase,"before":before,"after":after,"preClickSaveMatchesLoadedInput":before["saveInput"]["sha256"]==after["loadedInput"]["sha256"]};self.reloads.append(entry)
    (self.out/"reload-progress.json").write_text(json.dumps(self.reloads,ensure_ascii=False,indent=2),encoding="utf-8")
    added_flags=sorted(set(restored["flags"])-set(saved["flags"]));removed_flags=sorted(set(saved["flags"])-set(restored["flags"]));entry["migrationFlagsAdded"]=added_flags
    assert not removed_flags and set(added_flags)<= {"recruit_migration_v2"},(added_flags,removed_flags)
    for key in ("schema","noteSeq","notes","party","usedCount","choiceCount","eventCount","opening"):
     assert saved[key]==restored[key],(key,saved[key],restored[key])
    if phase=="travel":
     sd=saved["drive"];rd=restored["drive"];assert sd and rd and (sd["from"],sd["to"],sd["dist"])==(rd["from"],rd["to"],rd["dist"])
     moved=rd["gone"]-sd["gone"];assert moved>=0 and abs(restored["km"]-(saved["km"]+moved))<1e-6
     expected_fuel=self.page.evaluate("""([fuel,drive,moved])=>Math.max(0,fuel-moved*(G.fuelFor(1000,drive.road)/1000)*(drive.guestFuel||1)*(drive.memoryFuel||1))""",[saved["resources"]["fuel"],sd,moved])
     assert abs(restored["resources"]["fuel"]-expected_fuel)<1e-6
     for key in ("water","food","scrap","items"):assert restored["resources"][key]==saved["resources"][key]
    else:
     assert saved["resources"]==restored["resources"]
     for key in ("eventId","phase","storyStep","title","authoredText","choices","results"):assert before["presentation"][key]==after["presentation"][key],(key,before["presentation"],after["presentation"])
     if before["presentation"]["text"]!=after["presentation"]["text"]:
      assert before["presentation"]["tutorialVisible"] and not after["presentation"]["tutorialVisible"] and "onboarding_event_guide" in saved["flags"] and "onboarding_event_guide" in restored["flags"]
    seen.add(phase)
    if seen==targets:break
   s=snapshot(self.page)
   if s["eventId"] and self.event(s):continue
   if self.page.evaluate("UI.modalOpen()"):
    refreshed=snapshot(self.page)
    if refreshed["eventId"] and self.event(refreshed):continue
    if self.modal(refreshed):continue
   if self.page.evaluate("()=>!!S.opening&&!S.opening.completed"):
    self.page.wait_for_timeout(400);continue
   if s["drive"]:self.tick(s);continue
   if self.service(s):continue
   self.travel(s)
  # These are separately recorded test-owner references, not executions by this
  # runner. Camp uses direct scripts; historical Task 7 and fresh audio proof
  # must not be described as one final-build pending regression run.
  owners=json.loads((self.root/"audits/director-journey-2026-09-11/whole-review-fix/pending-owner-correction.json").read_text())["references"]
  assert [row["class"] for row in owners]==PENDING_CLASSES
  self.reloads.extend(owners)
  return "complete" if seen==targets else "reload-matrix-incomplete"

 def finish(self,reason):
  final=snapshot(self.page);save=None if self.a.scenario=="finale" or final["ended"] else capture_gameplay_save(self.page,self.out/"save.json")
  if self.a.scenario in ("route","finale","normal-earned"):
   assert final["ended"] and final["endKind"]=="story_done" and "story_done" in final["flags"] and final["seoul"]["method"],final
   assert final["archives"]==1,final
  if self.a.scenario=="crew-checkpoint":
   enabled=self.page.evaluate("""()=>{const e=G.presentationEvent('seoul_decision');return [...document.querySelectorAll('#ev-sheet [data-i]:not([disabled])')].map(b=>e.choices[+b.dataset.i]?.out?.[0]?.fx?.flag2).filter(Boolean)}""")
   assert set(enabled)=={"core_transfer","core_sleep","core_quarantine"},enabled
  trace_path=self.out/"trace.json";trace_path.write_text(json.dumps(self.trace.rows,ensure_ascii=False,indent=2),encoding="utf-8")
  if self.reloads:(self.out/"reloads.json").write_text(json.dumps(self.reloads,ensure_ascii=False,indent=2),encoding="utf-8")
  funcs=self.page.evaluate("()=>({preferred:G.questPreferredNeighbor.toString(),navigation:G.questNavigationPlan.toString()})")
  status=subprocess.check_output(["git","status","--short"],cwd=self.root,text=True)
  manifest={"scenario":self.sid(),"status":reason,"command":" ".join(sys.argv),"seed":self.a.seed,"pace":"normal-scripted" if self.a.scenario.startswith("normal-") else "accelerated","viewport":{"width":390,"height":844},"runtimeBuild":final["build"],"schema":final["schema"],"commit":subprocess.check_output(["git","rev-parse","HEAD"],cwd=self.root,text=True).strip(),"sourceDirty":bool(status.strip()),"sourceStatus":status.splitlines(),"localHtml":{"path":"서울까지400km.html","bytes":os.path.getsize(self.root/'서울까지400km.html'),"sha256":sha256_file(self.root/'서울까지400km.html')},"mainResponse":self.response,"mainResponses":self.responses,"resumeMode":self.resume_mode,"runnerSha256":sha256_file(Path(__file__)),"helperSha256":sha256_file(self.root/'tests/director_journey_helpers.py'),"routePolicy":{"name":"G.questPreferredNeighbor","preferredSha256":sha256_text(funcs['preferred']),"navigationSha256":sha256_text(funcs['navigation'])},"checkpointInput":{"path":self.a.checkpoint,"bytes":len(self.checkpoint.encode()),"sha256":sha256_text(self.checkpoint)} if self.checkpoint else None,"save":save,"trace":{"rows":len(self.trace.rows),"head":self.trace.previous,"sha256":sha256_file(trace_path)},"captures":self.captures,"timings":self.timings,"reloadClasses":[x['class'] for x in self.reloads],"pageErrors":self.errors,"consoleErrors":self.console,"httpErrors":self.http_errors,"final":final}
  manifest_path=self.out/"manifest.json";manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")
  video=self.page.video if self.a.scenario.startswith("normal-") else None
  self.page.screenshot(path=str(self.out/"final.png"));assert not self.errors,self.errors;assert reason=="complete",reason
  if self.original_response:self.original_response.dispose();self.original_response=None
  self.context.close()
  if video:
   video_path=Path(video.path());manifest["video"]={"path":str(video_path.relative_to(self.out)),"bytes":video_path.stat().st_size,"sha256":sha256_file(video_path)}
   manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")
  self.emit({"status":reason,"scenario":self.sid(),"actions":len(self.trace.rows),"at":final["at"],"km":final["km"],"day":final["day"],"errors":len(self.errors),"manifest":str(manifest_path)})

 def failure(self,error):
  failure_trace=self.out/"failure-trace.json";failure_trace.write_text(json.dumps(self.trace.rows,ensure_ascii=False,indent=2),encoding="utf-8")
  details={"scenario":self.sid(),"error":repr(error),"responses":self.responses,"actions":len(self.trace.rows),"trace":{"path":failure_trace.name,"sha256":sha256_file(failure_trace),"head":self.trace.previous},"commit":subprocess.check_output(["git","rev-parse","HEAD"],cwd=self.root,text=True).strip(),"runnerSha256":sha256_file(Path(__file__)),"helperSha256":sha256_file(self.root/'tests/director_journey_helpers.py'),"pageErrors":self.errors,"consoleErrors":self.console,"httpErrors":self.http_errors}
  try:
   details["state"]=snapshot(self.page);details["screen"]=self.page.locator("body").inner_text()[-2400:]
   self.page.screenshot(path=str(self.out/"failure.png"))
  except Exception as capture_error:details["captureError"]=repr(capture_error)
  (self.out/"failure.json").write_text(json.dumps(details,ensure_ascii=False,indent=2),encoding="utf-8")


def main():
 a=arguments()
 if a.scenario=="recruit":assert a.companion;a.camp_choice=a.camp_choice or CHOICES[a.companion];assert a.camp_choice==CHOICES[a.companion]
 with sync_playwright() as p:
  browser=p.chromium.launch();c=Campaign(a,browser)
  try:
   if a.scenario in ("route","recruit","crew-checkpoint"):reason=c.route_recruit_crew()
   elif a.scenario=="finale":reason=c.finale()
   elif a.scenario=="reload-matrix":reason=c.reload_matrix()
   elif a.scenario=="normal-opening":reason=c.normal_opening()
   else:reason=c.normal_earned()
   c.finish(reason)
  except BaseException as error:
   c.failure(error);raise
  finally:browser.close()

if __name__=="__main__":main()
