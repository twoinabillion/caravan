"""Task 5 regression: legal wayfinding, place-bound reunion and authored cities."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]

def test_tracked_clinic_routes_through_commitment_then_returns():
 with sync_playwright() as p:
  b=p.chromium.launch();g=b.new_page();g.goto((ROOT/'서울까지400km.html').as_uri())
  rows=g.evaluate('''()=>['ridge','market'].map(route=>{
   G.newGame('onroad','경로','full');S.at='gimcheon';S.known=Object.keys(D.nodes);
   S.recruitQ={id:'parkss',target:'gumi',stage:'task'};G.ensureQuestLedger().tracked=['companion_parkss'];
   G.chooseRoute(route);const path=[],plans=[];
   for(let i=0;i<20&&S.at!=='gumi';i++){
    const plan=G.questNavigationPlan();plans.push({...plan});
    const next=G.questPreferredNeighbor(G.neighbors(S.at).map(nb=>({nb})));
    if(!next)break;
    path.push({from:S.at,to:next.nb.id,ok:G.routeTravelCheck(S.at,next.nb.id).ok,cue:G.routeQuestCue(next.nb.id)});
    S.at=next.nb.id;G.updateRouteOnArrival(S.at);
   }
   return {route,path,plans,at:S.at,complete:G.routeStatus().complete};
  })''')
  for row in rows:
   assert row['at']=='gumi',row
   assert row['complete'] and all(step['ok'] for step in row['path']),row
   assert row['plans'][0]['target']=='gumi' and row['plans'][0]['waypoint']=='cheongju',row
   assert '청주' in row['plans'][0]['action'] and '구미' in row['plans'][0]['action']
   assert len({step['from'] for step in row['path'][:next(i for i,v in enumerate(row['path']) if v['to']=='cheongju')+1]})==next(i for i,v in enumerate(row['path']) if v['to']=='cheongju')+1
  underway=g.evaluate("""()=>{G.newGame('onroad','주행 안내','full');S.at='sangju';S.known=Object.keys(D.nodes);
   S.recruitQ={id:'parkss',target:'gumi',stage:'task'};G.ensureQuestLedger().tracked=['companion_parkss'];G.chooseRoute('ridge');
   S.driving={from:'sangju',to:'mungyeong'};S.at=null;return G.routeQuestCue('mungyeong')}""")
  assert underway and underway['target']=='gumi' and underway['waypoint']=='cheongju',underway
  b.close()

def test_high_mileage_mother_beats_queues_and_saved_chain_wait_for_suwon():
 with sync_playwright() as p:
  b=p.chromium.launch();g=b.new_page();g.goto((ROOT/'서울까지400km.html').as_uri())
  rows=g.evaluate('''()=>['miryang','mungyeong','suwon'].map(at=>{
   G.newGame('onroad','재회','full');S.at=at;S.stats.km=627;
   const beat=D.journeyBeats.find(b=>b.id==='history_parents_network');
   S._beatQueue=[beat.id];S._storyQueue=['parents_mother_reunion','parents_mother_truth'];
   S._chain='parents_mother_reunion';S.flags.parent_key_located=true;G.save();S=null;G.load();
   return {at,ready:G.beatReady(beat),beat:G.popBeat(),story:G.popStory(),chain:G.resolveMainEvidenceChain(S._chain),
    signal:S.flags.parent_key_located,reunited:!!S.flags.mother_reunited};
  })''')
  for r in rows:
   assert r['signal'] and not r['reunited']
   if r['at']=='suwon': assert r['ready'] and r['beat']=='history_parents_network' and r['story']=='parents_mother_reunion' and r['chain']=='parents_mother_reunion',r
   else: assert not r['ready'] and r['beat'] is None and r['story'] is None and r['chain'] is None,r
  b.close()

def test_seven_hubs_foreground_existing_local_person_and_saved_change():
 with sync_playwright() as p:
  b=p.chromium.launch();g=b.new_page();g.goto((ROOT/'서울까지400km.html').as_uri())
  rows=g.evaluate('''()=>Object.keys(D.stls).map(id=>{
   G.newGame('onroad','도시','full');S.at=id;S.min=600;UI.showStl(id,'hub');
   const before=document.querySelector('[data-stl-concern]')?.innerText||'';
   const action=D.stls[id].field.actions.find(a=>!a.hidden&&D.stls[id].npcs.includes(a.npc));
   const result=G.doStlFieldAction(id,action.id);G.save();S=null;G.load();UI.showStl(id,'hub');
   return {id,before,npc:D.npcs[action.npc].name,ok:result.ok,after:document.querySelector('[data-stl-concern]')?.innerText||'',expected:action.change.after,count:G.stlImpact(id).count};
  })''')
  assert len(rows)==7
  for row in rows:
   assert row['npc'] in row['before'],row
   assert row['ok'] and row['count']==1 and row['expected'] in row['after'],row
  b.close()

def test_every_city_change_reaches_departure_echo_once_after_save():
 with sync_playwright() as p:
  b=p.chromium.launch();g=b.new_page();g.goto((ROOT/'서울까지400km.html').as_uri())
  rows=g.evaluate('''()=>Object.keys(D.stls).map(id=>{
   G.newGame('onroad','출발','full');S.at=id;S.min=600;
   const action=D.stls[id].field.actions.find(a=>!a.hidden&&D.stls[id].npcs.includes(a.npc));
   G.doStlFieldAction(id,action.id);G.save();S=null;G.load();
   const to=G.neighbors(id)[0].id,dv={dist:40,slots:[],wx:S.wx};
   const echo=G.prepareSettlementRoadEcho(dv,id,to),copy=G.roadEchoCopy('outcome');
   const first=G.resolveImpactEcho('relay'),second=G.resolveImpactEcho('relay');
   G.save();S=null;G.load();
   return {id,echo,copy,first,second,again:G.prepareSettlementRoadEcho({dist:40,slots:[],wx:S.wx},id,to),impact:G.stlImpact(id).count};
  })''')
  for row in rows:
   assert row['echo']['stlId']==row['id'] and row['copy'] and row['first']['chips']
   assert not row['second']['chips'] and row['again'] is None and row['impact']==1,row
  b.close()

def test_actual_saved_mother_chain_defers_then_suwon_choices_complete():
 with sync_playwright() as p:
  b=p.chromium.launch();g=b.new_page(viewport={'width':390,'height':844});g.goto((ROOT/'서울까지400km.html').as_uri())
  g.evaluate('''()=>{G.newGame('onroad','재회','full');S.at='mungyeong';S.stats.km=627;
   S.flags.parents_recent_signal=true;S._chain='parents_mother_reunion';G.save();S=null;G.load();
   UI.restoreQaView({screen:'game'});G.openEventById('main_transfer_testimony');UI.finishStory();}''')
  g.locator('#ev-sheet [data-i="0"]').click();g.evaluate('UI.finishStory()');g.locator('#ev-sheet [data-r="ok"]').click();g.wait_for_timeout(650)
  assert g.evaluate("!S._chain&&!JSON.parse(localStorage.getItem(SAVE_KEY))._chain&&!S.flags.mother_reunited&&S.flags.parents_recent_signal")
  assert not g.locator('#ev-wrap.on').count()
  g.evaluate("S.at='suwon';G.openEventById(G.resolveMainEvidenceChain('parents_mother_reunion'));UI.finishStory()")
  for expected in ['parents_mother_reunion','parents_mother_truth']:
   assert g.locator('#ev-sheet').get_attribute('data-event-id')==expected
   g.locator('#ev-sheet [data-i="0"]').click();g.evaluate('UI.finishStory()');g.locator('#ev-sheet [data-r="ok"]').click();g.wait_for_timeout(650);g.evaluate('UI.finishStory()')
  assert g.evaluate('!!S.flags.mother_reunited&&!!S.flags.mother_broadcast_ready')
  assert g.evaluate("G.resolveMainEvidenceChain('parents_mother_reunion')===null&&G.resolveMainEvidenceChain('parents_mother_truth')===null")
  b.close()

def test_both_route_crew_callbacks_keep_route_identity_after_save():
 with sync_playwright() as p:
  b=p.chromium.launch();g=b.new_page();g.goto((ROOT/'서울까지400km.html').as_uri())
  rows=g.evaluate('''()=>['ridge','market'].map(route=>{
   G.newGame('onroad','노선 기억','full');S.at='cheongju';S.known=Object.keys(D.nodes);
   G.chooseRoute(route);G.updateRouteOnArrival('cheongju');
   const moment=D.routeCrewMoments.find(row=>row.route===route);
   S.party=moment.crew.slice();moment.crew.forEach(id=>S.comps[id]={mood:65,bond:0,lvl:1,perks:[]});
   G.save();S=null;G.load();
   const started=G.startTravel('cheonan'),out=G.roadCheckIn(moment.crew[0]);
   G.save();S=null;G.load();
   return {route,started,id:out.moment?.id,expected:moment.id,saved:S.driving.checkInMoment?.id,
    repeat:G.roadCheckIn(moment.crew[1]).ok,complete:G.routeStatus().complete};
  })''')
  for row in rows:assert row['started'] and row['complete'] and row['id']==row['expected']==row['saved'] and not row['repeat'],row
  b.close()
