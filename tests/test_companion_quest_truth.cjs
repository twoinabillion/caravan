'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');

// A paid high-bond conversation develops a relationship; it cannot stand in for
// a visit, reunion or broadcast. No new game, effects or user save is involved.
function fixture(){
  const c=vm.createContext({document:{readyState:'loading',addEventListener(){}},console,
    S:{at:'cheonan',day:8,min:720,flags:{pss_list:true,kw_truth:true,leo_song:true,es_backdoor_ready:true},
      known:['cheonan','daejeon','suwon','cheongju','mingyu_ridge','jaeyi_cache'],
      party:['minji','parkss','kangwoo','leo','jaeyi','eunsu'],
      comps:Object.fromEntries(['minji','parkss','kangwoo','leo','jaeyi','eunsu'].map(id=>[id,{lvl:3,bond:30,perks:[],pending:0}])),
      used:['talk_mj_15','talk_pss_09','talk_kw_15','talk_leo_09','talk_jy_09','talk_es_19'],notes:[],
      items:{},_storyQueue:['es_nightshift'],pendingPresentation:null},
    G:{},UI:{}});
  for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),c);
  for(const file of ['src/04b-engine-crew.js','src/04e-engine-world.js','src/04f-engine-quests.js','src/04g-engine-evidence.js'])vm.runInContext(fs.readFileSync(file,'utf8'),c);
  vm.runInContext(fs.readFileSync('src/07d-ui-quests.js','utf8')+';globalThis.J=QuestJournal;',c);
  c.G.mainQuestEntry=()=>null;c.G.mainEvidenceOpportunity=()=>null;c.G.openingPending=()=>false;
  c.G.hasComp=id=>c.S.party.includes(id);
  c.G.ensureQuestLedger();
  return {c,run:code=>vm.runInContext(code,c),row:id=>c.G.companionQuestEntries().find(row=>row.companion===id)};
}

test('Lv3 relationships leave all six unperformed personal actions active without changing state',()=>{
  const h=fixture(),before=JSON.stringify(h.c.S);
  for(const id of h.c.S.party){
    assert.equal(h.run(`G.companionStoryStage('${id}')`),3,id+' relationship is actually developed');
    const row=h.row(id);
    assert.equal(row.status,'active',id+' still has a real personal action');
    assert.match(row.phase,/관계/);
    assert.doesNotMatch(row.next,/모두 들었다|끝까지 들었다/);
    assert(!row.steps.some(step=>step.state==='done'&&/신호를 함께 따라|수비대에서|창고.*다시|접속 코드.*책임/.test(step.label)));
  }
  assert.equal(JSON.stringify(h.c.S),before,'guidance does not grant flags/perks/levels or rewrite saved receipts');
});

test('a tracked personal action targets its actual public location instead of another camp',()=>{
  const h=fixture();
  for(const [id,target] of [['minji','mingyu_ridge'],['parkss','daejeon'],['kangwoo','suwon'],['leo','cheongju'],['jaeyi','jaeyi_cache']]){
    const key='companion_'+id;h.c.S.questLedger.tracked=[key];
    assert.equal(h.c.G.questObjectivePlan(key)?.target,target,id+' explicit next target');
    assert.equal(h.c.G.questObjectivePlan()?.target,target,id+' tracked next target');
    assert.equal(h.c.G.questActionPlan(key)?.surface,'route',id+' opens route preview without traveling');
  }
  h.c.S.at='daejeon';
  assert.equal(h.c.G.questActionPlan('companion_parkss')?.focus,'explore');
  h.c.S.flags.pss_met=true;
  assert.equal(h.c.G.questObjectivePlan('companion_parkss')?.target,'suwon');
  h.c.S.at='suwon';
  assert.equal(h.c.G.questActionPlan('companion_kangwoo')?.focus,'explore');
});

test('journal high-bond records never invent physical visits or the unresolved personal ending',()=>{
  const h=fixture();
  for(const id of h.c.S.party){
    const row=h.row(id),entry=h.c.J.entry(row),words=JSON.stringify(entry);
    assert.doesNotMatch(words,/민규.*만났다|수진.*만났다|수비대에서 무슨 일이 있었는지 끝까지 들었다|열쇠가 가리키는 곳까지 같이 가 봤지|떠나왔던 곳에 다시 갔다|접속 코드와 그 책임/);
    assert(entry.guide,id+' keeps the unfinished public action visible');
  }
});

test('opening a personal event and broad reused flags are not paid physical completion',()=>{
  const h=fixture();
  h.c.S.used.push('loc_mingyu','loc_jaeyi_cache','leo_broadcast','es_backdoor');
  h.c.S.flags.jy_law=true;h.c.S.flags.es_truth=true;h.c.S.flags.uplink_seen=true;
  for(const id of ['minji','leo','jaeyi','eunsu'])assert.equal(h.row(id).status,'active',id+' entry or similar fact is not completion');
  h.c.S.flags.pss_absolved=true;
  assert.equal(h.row('parkss').status,'active','a roadside confession does not visit the former trainee');
  assert.equal(h.c.G.questObjectivePlan('companion_parkss')?.target,'daejeon');
  h.c.S.flags.kw_absolved=true;
  const kangwoo=h.c.J.entry(h.row('kangwoo'));
  assert.doesNotMatch(JSON.stringify(kangwoo),/방벽.*찾았다|제3방어선.*다녀|현장.*다녀/,'a confession never invents the memorial visit');
});

test('actual completion closes each personal action while preserving Lv3 state',()=>{
  const h=fixture();
  Object.assign(h.c.S.flags,{mingyu_reunion:true,pss_met:true,pss_absolved:true,kw_absolved:true,song_400km:true,jaeyi_cache_opened:true});
  h.c.S.notes.push({title:'가족의 빈칸에 있던 계산',body:'보관한 백도어 결과'});
  const before=JSON.stringify(h.c.S);
  for(const id of h.c.S.party){
    assert.equal(h.row(id).status,'completed',id+' real work is now complete');
    assert.equal(h.c.S.comps[id].lvl,3);
  }
  assert.equal(JSON.stringify(h.c.S),before);
});

test('unfinished personal actions do not revoke Lv3 testimony or add a main-story gate',()=>{
  const h=fixture();
  Object.assign(h.c.S.flags,{first_order_trace:true,parents_split_known:true,parents_routes_traced:true,
    parent_key_found:true,main_testimony_record:true,main_command_record:true,failed_namsan_known:true,
    father_fate_known:true,mother_reunited:true,mother_broadcast_ready:true,main_relay_confirmed:true});
  assert.equal(h.c.G.deedsDone().filter(row=>row.cat==='동료').length,6,'existing Lv3 testimony still counts');
  assert.equal(h.c.G.seoulReady(),true,'main evidence permits the finale without visiting every personal destination');
  assert(h.c.G.companionQuestEntries().every(row=>row.status==='active'),'personal work is still visibly unfinished');
});

test('eunsu guidance follows the actual unpaid nightshift/backdoor and paid legacy proof',()=>{
  const h=fixture();
  assert.match(h.row('eunsu').next,/정차|이야기|기록/);
  h.c.S.flags.es_v1194=true;h.c.S._storyQueue=['es_backdoor'];
  assert.equal(h.row('eunsu').status,'active');
  assert.doesNotMatch(h.c.J.entry(h.row('eunsu')).next,/책임.*같이 얘기해 봤다|끝까지 들었다/);
  h.c.S.pendingPresentation={eventId:'es_backdoor',phase:'event'};
  assert.equal(h.row('eunsu').status,'active');
  h.c.S.pendingPresentation.phase='result';
  assert.equal(h.row('eunsu').status,'completed');
  h.c.S.pendingPresentation=null;
  h.c.S.notes=[{title:'직접 사유와 최초 목적',body:'기존 완료 기록'}];
  assert.equal(h.row('eunsu').status,'completed','exact legacy paid note remains valid');
});

test('locked relationships keep unrevealed places and future personal outcomes out of guidance',()=>{
  const h=fixture();h.c.S.known=['cheonan'];h.c.S.flags={};h.c.S.used=[];
  for(const id of h.c.S.party){h.c.S.comps[id].lvl=1;h.c.S.comps[id].bond=1;}
  for(const id of h.c.S.party){
    const row=h.row(id),entry=h.c.J.entry(row);
    assert.equal(row.status,'active');
    assert.doesNotMatch(JSON.stringify(entry),/민규의 능선|재이의 창고|수진|백도어|살아 있었다|제3방어선/);
  }
});
