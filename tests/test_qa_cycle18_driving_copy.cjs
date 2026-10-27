'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup,root}=require('../qa-artifacts/qa-cycle-20261026/cycle15/story/repair/setup.cjs');
const dir=path.join(root,'qa-artifacts/qa-cycle-20261026/cycle18/story/repair19');
const old=require(dir+'/before.json'),delta=require(dir+'/copy-delta.json');
const frozen=path.join(root,'qa-artifacts/qa-cycle-20261026/cycle18/source');
const state=h=>h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.fuel,S.scrap,S.van,S.fatigue,S.items,S.flags,S.notes,S.party,S.comps,S.driving])');
function context(){const h=setup();h.run("S.party=['minji'];S.comps.minji.bond=8;S.flags.parent_key_found=true;S.pendingPresentation=null;");assert(h.run("G.startTravel('yangsan')"));return h;}
const get=(o,p)=>p.reduce((a,k)=>a[k],o);
test('only fifteen approved words change: all speakers, requirements, timing, summaries and opposite choices stay exact',()=>{
 const h=setup(),now=h.json("({banter:D.banter.find(b=>b.persona==='grounding'&&b.who==='minji'&&b.t.includes('오른쪽 어깨')),chats:Object.fromEntries(D.chats.filter(c=>['thread-parent-key-minji','daily-me-minji-hands'].includes(c.id)).map(c=>[c.id,c])),opening:D.openingDecisionCallbacks,memory:D.choiceMemories.meet_bus})");
 for(const d of delta){let o=now[d.collection];for(const k of d.path.slice(0,-1))o=o[k];assert.equal(o[d.path.at(-1)],d.new,d.path.join('.'));o[d.path.at(-1)]=d.old;}
 assert.deepEqual(now,old);
});
test('the current driver is asked about seat position, without being told to sit down',()=>{
 const h=context();h.run("D.banter=[D.banter.find(b=>b.persona==='grounding'&&b.who==='minji'&&b.t.includes('오른쪽 어깨'))];globalThis.picked=G.pickBanter()");
 assert(h.run('!!picked&&!!S.driving'));assert.equal(h.run('picked.t'),delta[0].new);assert.doesNotMatch(h.run('picked.t'),/앉아 봐/);
 h.run('S.party=[];lastBanter=[]');assert.equal(h.run('G.pickBanter()'),null);
});
for(const id of ['thread-parent-key-minji','daily-me-minji-hands'])test(id+' keeps present driving and only plans work/washing at the next stop',()=>{
 const h=context();h.run(`D.chats=[D.chats.find(c=>c.id===${JSON.stringify(id)})]`);const before=state(h);h.run('globalThis.picked=G.pickChat()');assert(h.run('!!picked&&!!S.driving'));assert.equal(state(h),before);
 for(const d of delta.filter(d=>d.collection==='chats'&&d.path[0]===id))assert.equal(h.run(`picked.lines[${d.path[2]}][1]`),d.new);
 h.run('G.load()');assert.equal(h.run('G.pickChat()'),null);h.run('S.day++');assert.equal(h.run('!!G.pickChat()'),id!=='thread-parent-key-minji');
});
test('parent-key chat retains companion, knowledge and bond8 eligibility',()=>{
 for(const change of ["S.party=[]","S.flags.parent_key_found=false","S.comps.minji.bond=7"]){const h=context();h.run("D.chats=[D.chats.find(c=>c.id==='thread-parent-key-minji')]");h.run(change);assert.equal(h.run('G.pickChat()'),null);}
});
test('all eleven opening callbacks retain real driving, kilometre/event thresholds and once-only reload behavior',()=>{
 for(const [event,choices]of Object.entries(old.opening))for(const [choice,def]of Object.entries(choices)){
  const h=context();h.run(`S.opening.decisions={[${JSON.stringify(event)}]:{choiceId:${JSON.stringify(choice)}}};S.stats.km=${def.afterKm-1};S.stats.events=${def.afterEvents};`);
  assert.equal(h.run('G.takeChoiceEcho()'),null);h.run('S.stats.km++;S.stats.events--');assert.equal(h.run('G.takeChoiceEcho()'),null);h.run('S.stats.events++;globalThis.road=S.driving;S.driving=null');assert.equal(h.run('G.takeChoiceEcho()'),null);
  h.run('S.driving=road;G.save();G.load();globalThis.echo=G.takeChoiceEcho()');assert(h.run('!!echo'));
  const d=delta.find(d=>d.collection==='opening'&&d.path[0]===event&&d.path[1]===choice);
  assert.equal(h.run('echo.lines[0][1]'),d?d.new:def.lines[0][1],event+':'+choice);
  assert.equal(h.run('S.opening.decisions['+JSON.stringify(event)+'].choiceId'),choice);h.run('G.load()');assert.equal(h.run('G.takeChoiceEcho()'),null);
 }
});
test('previously echoed opening decisions remain consumed; the stored paid event and notes remain frozen',()=>{
 const raw=JSON.parse(fs.readFileSync(dir+'/old-meet-paid.json','utf8'));
 const expected=JSON.stringify(raw.opening.decisions),h=setup();assert(h.run('G.load('+JSON.stringify(JSON.stringify(raw))+')'));assert.equal(h.run('JSON.stringify(S.opening.decisions)'),expected);
 assert(h.run('G.openingDecisionMemories().every(m=>m.echoed)'));
});
test('new medicine handoff snapshots the clarified memory, while old echoLines play their old words once',()=>{
 const entry=fs.readFileSync(path.join(dir,'../agent03/attempt01/normal-unpaid-229-meet_bus.json'),'utf8');
 for(const legacy of [false,true]){
  const h=setup();assert(h.run('G.load('+JSON.stringify(legacy?fs.readFileSync(dir+'/old-meet-paid.json','utf8'):entry)+')'));
  h.run("globalThis.e=G.presentationEvent('meet_bus');globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);");assert.equal(h.run('r.applied'),!legacy);
  const expected=legacy?old.memory[0].lines[1][1]:delta.at(-1).new;assert.equal(h.run('S.memories.choices.clinic_route_accepted.echoLines[1][1]'),expected);
  // Isolated callback fixture: leave all other real journey fields and memory snapshots intact.
  h.run("S.pendingPresentation=null;S.driving={from:'jeonju',to:'nonsan',gone:1,dist:40};S.at=null;S.stats.km=S.memories.choices.clinic_route_accepted.dueKm;S.stats.events=S.memories.choices.clinic_route_accepted.dueEvents;G.save();G.load();globalThis.echo=G.takeChoiceEcho()");
  assert.equal(h.run('echo.lines[1][1]'),expected);h.run('G.load()');assert.equal(h.run('G.takeChoiceEcho()'),null);
 }
});
for(const textOnly of [false,true])test('frozen18 paid meet_bus '+(textOnly?'text-only':'saved-view')+' reader and effects remain unchanged',()=>{
 const raw=JSON.parse(fs.readFileSync(dir+'/old-meet-paid.json','utf8'));
 if(textOnly){delete raw.pendingPresentation.view;delete raw.pendingPresentation.reading;delete raw.pendingPresentation.authoredView;}
 const views=[];
 for(const source of [frozen,root]){
  const h=setup(source);assert(h.run('G.load('+JSON.stringify(JSON.stringify(raw))+')'));const before=state(h);
  h.run("globalThis.e=G.presentationEvent('meet_bus');globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);globalThis.turns=Array.isArray(r.out.turns)&&r.out.turns.length?r.out.turns:buildStoryTurns(r.out.text,e,{speakers:r.out.speakers,frozenTextOnly:!!r.out.frozenTextOnly,turnSpeakers:r.out.frozenTextOnly?[]:r.out.turnSpeakers});");
  assert.equal(h.run('r.applied'),false);assert.equal(state(h),before);assert.equal(h.run('r.out.text'),raw.pendingPresentation.text);views.push(h.json('turns'));
 }assert.deepEqual(views[1],views[0]);
});
