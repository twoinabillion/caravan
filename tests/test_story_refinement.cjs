const {test}=require('node:test'),assert=require('node:assert/strict');
const H=require('./fixtures/qa-cycle103-eunsu-join/setup.cjs');
function fresh(id,{known=false,method='sleep',party=[]}={}){const h=H.setup();h.run(`S.pendingPresentation=null;S.at='seoul';S.driving=null;S.party=${JSON.stringify(party)};S.flags.core_sleep=false;S.flags.core_transfer=false;S.flags.core_quarantine=false;S.flags['core_'+${JSON.stringify(method)}]=true;S.flags.seoul_core_reached=true;S.flags.seoul_open=true;S.flags.seoul_costs_seen=true;S.knowledge=S.knowledge||{};S.knowledge.family_order_source=${known?2:0};globalThis.e=G.presentationEvent(${JSON.stringify(id)});G.beginPresentation(e);`);return h;}
const text=h=>h.run("(typeof e.turns==='function'?e.turns(S):e.turns).map(t=>t.text).join('\\n')");
test('new revelation has a personal response; previously known truth is not a first revelation',()=>{
 const a=fresh('main_command_ledger');assert.equal(a.run('S.pendingPresentation.narrativeRevision'),'story-refinement-v1');assert.match(text(a),/우리 가족을/);
 const b=fresh('main_command_ledger',{known:true});assert.match(text(b),/이미 들었던/);assert.doesNotMatch(text(b),/우리 가족을\./);
});
test('unmarked historical entry keeps its prior authored turns and saved revision survives load',()=>{
 const h=fresh('main_command_ledger');h.run('delete S.pendingPresentation.narrativeRevision');const old=text(h);assert.doesNotMatch(old,/남산에서 직접 물을게요/);h.run("S.pendingPresentation.narrativeRevision='story-refinement-v1';G.save();G.load()");assert.equal(h.run('S.pendingPresentation.narrativeRevision'),'story-refinement-v1');
});
test('earlier inspection and core distinguish local self-signature from the external key',()=>{
 const a=fresh('story_bridge_watched');assert.match(text(a),/자체 승인/);
 const b=fresh('seoul_core');assert.match(text(b),/제 서명/);assert.match(text(b),/자기 보존/);
});
test('new night routes to an explicit optional-afterword choice; old paid night keeps its chain',()=>{
 const h=fresh('seoul_night');h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);');assert.equal(h.run('r.applied'),true);assert.equal(h.run('S.flags.story_closure_v1'),1);assert.equal(h.run('G.queuePresentation()'),'seoul_afterword_choice');
 const old=fresh('seoul_night');old.run('delete S.pendingPresentation.narrativeRevision;globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);');assert.equal(old.run('G.queuePresentation()'),'seoul_uplink_reveal');
});
test('main closing result is paid once, survives reload, and ends only when closed',()=>{
 const h=fresh('seoul_afterword_choice');h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);');assert.equal(h.run('r.applied'),true);assert.equal(h.run('S.flags.story_done'),true);assert.equal(h.run('S.ended'),false);assert.equal(h.run('S.flags.session_two_teased'),undefined);
 const receipt=h.run('JSON.stringify(S.pendingPresentation)');h.run('G.save();G.load();');assert.equal(h.run('JSON.stringify(S.pendingPresentation)'),receipt);h.run('globalThis.again=G.resolvePresentedChoice(e,e.choices[0]);');assert.equal(h.run('again.applied'),false);h.run('G.queuePresentation();');assert.equal(h.run('S.ended'),true);
});
test('choosing the optional afterword preserves all three actual core methods and spends no time',()=>{
 for(const method of ['transfer','sleep','quarantine']){const h=fresh('seoul_afterword_choice',{method});const before=h.run('S.day*1440+S.min');h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[1]);');assert.equal(h.run('S.day*1440+S.min'),before);assert.equal(h.run('G.resolvedFinaleMethod()'),'core_'+method);assert.equal(h.run('G.queuePresentation()'),'seoul_uplink_reveal');assert.equal(h.run('S.flags.story_done'),undefined);}
});
test('unread main closing result resumes before ending; optional afterword still reaches its original ending',()=>{
 for(const method of ['transfer','sleep','quarantine'])for(const optional of [false,true]){
  const h=fresh('seoul_afterword_choice',{method});
  h.run(`G.resolvePresentedChoice(e,e.choices[${optional?1:0}]);`);
  if(optional){
   assert.equal(h.run('G.queuePresentation()'),'seoul_uplink_reveal');
   h.run("G.presentTransition();e=G.presentationEvent('seoul_uplink_reveal');G.beginPresentation(e);G.resolvePresentedChoice(e,e.choices[0]);");
   assert.equal(h.run('G.queuePresentation()'),'seoul_session_reset');
   h.run("G.presentTransition();e=G.presentationEvent('seoul_session_reset');G.beginPresentation(e);G.resolvePresentedChoice(e,e.choices[0]);");
   assert.equal(h.run('S.flags.session_two_teased'),true);
  }
  const receipt=h.run('JSON.stringify(S.pendingPresentation)');
  assert.equal(h.run('S.ended'),false);h.run('G.save();G.load();G.resumePresentation();');
  assert.equal(h.run('S.ended'),false);assert.equal(h.run('JSON.stringify(S.pendingPresentation)'),receipt);
  assert.equal(h.run('G.resolvedFinaleMethod()'),'core_'+method);
  assert.equal(h.run('S.flags.run_archived'),true);
  const archive=h.store.get('seoul400_quality_archive_v1');assert(archive,'actual archive exists');
  assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[0]).applied'),false);
  assert.equal(h.store.get('seoul400_quality_archive_v1'),archive);
  h.run('G.queuePresentation()');assert.equal(h.run('S.ended'),true);
 }
});
test('new closure keeps earned family callbacks and source facts, without revealing the upper network',()=>{
 const h=fresh('seoul_afterword_choice');h.run("S.flags.mother_broadcast_ready=true;S.flags.intro_family_helped=true;S.items['남산행 편지']=1;globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);");
 const words=h.run('r.out.turns.map(t=>t.text).join("\\n")');
 assert.match(words,/뭐 좀 먹었니/);assert.match(words,/하진/);assert.match(words,/아직 수신인에게 전하지 못했다/);
 assert.doesNotMatch(words,/4억|487|상위망|정비 단말의 주소/);
 assert.equal(h.run("r.out.turns.find(t=>t.text.includes('달구지가 수원')).scene"),'parents-mother-return-interior-v1');
 const solo=fresh('seoul_afterword_choice');solo.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);');
 assert.doesNotMatch(solo.run('r.out.turns.map(t=>t.text).join("\\n")'),/엄마가|하진|민지가/);
 for(const id of ['main_command_ledger','main_command_companion_ledger']){
  const a=fresh(id);assert.match(text(a),/가족 이송 명령 작성자 — 천리안/);assert.match(text(a),/인간 확인 — 빈칸/);
  assert.match(text(a),/최초 조건의 목적 — 이 원본으로는 확인 불가/);
 }
});
test('lost transition recovery offers the new gate only for paid new-night owners',()=>{
 const h=fresh('seoul_night');h.run("for(const stop of D.seoulMap.stops.slice(0,4))S.flags['seoul_'+stop.id+'_done']=true;G.resolvePresentedChoice(e,e.choices[0]);S.pendingPresentation=null;S._chain=null;");
 assert.equal(h.run('G.unfinishedSeoulEvent().id'),'seoul_afterword_choice');
 h.run('S.flags.afterword_requested=true');assert.equal(h.run('G.unfinishedSeoulEvent().id'),'seoul_uplink_reveal');
 h.run('delete S.flags.story_closure_v1;delete S.flags.afterword_requested');assert.equal(h.run('G.unfinishedSeoulEvent().id'),'seoul_uplink_reveal');
});
test('travel-memory mechanics projection accepts only its reviewed edition and presentation metadata',()=>{
 const h=fresh('memory_busan_terminal'),project=require('../tools/story-refinement-contract.cjs');
 const original=h.json("G.presentationEvent('memory_busan_terminal')"),copy=()=>structuredClone(original);
 const row=copy();project([row]);
 const expected=copy();delete expected.narrativeRevision;delete expected.travelMemory;delete expected.roadApproach;
 assert.deepEqual(row,expected,'choices, gates, costs and rewards remain in the historical mechanics comparison');
 for(const mutate of [r=>{r.narrativeRevision='travel-memory-v2';},r=>{r.roadApproach={kind:'signal'};},
   r=>{r.travelMemory.cue='다른 기억';},r=>{r.travelMemory.extra=true;},r=>{r.id='another_memory';}]){
  const invalid=copy();mutate(invalid);assert.throws(()=>project([invalid]),assert.AssertionError);
 }
 const changed=copy();changed.choices[0].out[0].fx.time=999;project([changed]);
 assert.equal(changed.choices[0].out[0].fx.time,999,'projection must expose a cost mutation to the unchanged baseline');
});
