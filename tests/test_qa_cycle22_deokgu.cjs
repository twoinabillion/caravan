'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle22/systems/repair23');
const {load,state}=require(dir+'/fixture.cjs'),{setup}=require(dir+'/setup.cjs');
const helper=require('../qa-artifacts/qa-cycle-20261026/cycle12/story/reader-runtime.cjs');
const baseline=require(dir+'/baseline.json'),legacy=require(dir+'/legacy.json');
const young={who:'passer_man',name:'밀양 청년'};
const routes=[['deokgu','deokgu','deokgu'],['me',young,young,'me',young]];
test('the exact natural pending entry retains its existing Deokgu introduction across reload',()=>{
 const h=load();assert.deepEqual(h.json('qaNamed(entry)'),baseline.entry);
 const before=state(h),view=h.json('S.pendingPresentation.view');
 assert(h.run('G.save();G.load()'));assert.deepEqual(state(h),before);assert.deepEqual(h.json('S.pendingPresentation.view'),view);
 assert.deepEqual(h.json('qaNamed(qaEntry(e))'),baseline.entry);
});
for(const ci of [0,1])test(`Deokgu choice ${ci} actual reader preserves all prose and explicit question/reply ownership for solo and reversed crew`,()=>{
 for(const party of [null,[],['eunsu','parkss'],['parkss','eunsu']]){
  const h=load({party,youngMan:ci===1});h.run(`globalThis.c=e.choices[${ci}];globalThis.o=c.out[0]`);
  const result=h.json('qaNamed(qaResult(e,c,o,{knownSpeaker:entry.knownSpeaker}))');
  assert.deepEqual(result.map(t=>t.text),baseline.out[ci+'.0'].map(t=>t.text));
  assert.deepEqual(result.filter(t=>t.kind==='narration'),baseline.out[ci+'.0'].filter(t=>t.kind==='narration'));
  const spoken=result.filter(t=>t.kind!=='narration');
  assert.deepEqual(spoken.map(t=>t.who),routes[ci].map(r=>typeof r==='string'?r:r.who));
  for(const [i,t] of spoken.entries()){
   assert.equal(t.kind,'dialogue');assert(!t.speakerUncertain);assert.notEqual(t.displayName,'???');
   if(typeof routes[ci][i]==='object'){assert.equal(t.name,'밀양 청년');assert.equal(t.displayName,'밀양 청년');}
   else if(ci===0)assert.equal(t.displayName,'덕구');
  }
 }
});
test('only two outcome metadata arrays change; entry, all text, mechanics, flags, notes, weights and gates remain frozen22',()=>{
 const h=load(),now=h.json("JSON.parse(JSON.stringify(e,(k,v)=>typeof v==='function'?v.toString():v))"),expected=structuredClone(baseline.event);
 for(const ci of [0,1])expected.choices[ci].out[0].turnSpeakers=routes[ci];
 assert.deepEqual(now,expected);
 assert.equal(h.run('G.reqOk(e.choices[1].req).ok'),false);
});
for(const old of legacy)test(`choice ${old.choice} new paid reader reload retains voices and exact frozen22 effects without reapplication`,()=>{
 const h=load({youngMan:old.choice===1}),frozen=load({frozen:true,youngMan:old.choice===1});
 for(const env of [h,frozen]){env.run(`globalThis.c=e.choices[${old.choice}];globalThis.r=G.resolvePresentedChoice(e,c)`);assert(env.run('r.ok&&r.applied'));}
 assert.deepEqual(state(h),state(frozen));assert.deepEqual(h.json('r.chips'),frozen.json('r.chips'));assert.equal(h.run('r.out.text'),old.text);
 h.run('globalThis.turns=qaResult(e,c,r.out,{knownSpeaker:entry.knownSpeaker})');
 const turns=h.json('qaNamed(turns)'),paid=state(h);
 h.run('G.capturePresentationView({eventId:e.id,phase:"outcome",turns,knownSpeaker:!!entry.knownSpeaker,index:0});G.save();G.load();globalThis.again=G.resolvePresentedChoice(e,c)');
 assert.equal(h.run('again.applied'),false);assert.deepEqual(state(h),paid);assert.deepEqual(h.json('qaNamed(qaResult(e,c,again.out))'),turns);
});
test('both frozen22 paid views and text-only legacy receipts preserve historical labels/text without repayment',()=>{
 for(const old of legacy)for(const textOnly of [false,true]){
  const h=setup();h.run('(()=>{'+helper.code()+'})()');const saved=JSON.parse(fs.readFileSync(dir+'/'+old.file));
  if(textOnly){delete saved.pendingPresentation.view;delete saved.pendingPresentation.reading;delete saved.pendingPresentation.authoredView;}
  assert(h.run(`G.load(${JSON.stringify(JSON.stringify(saved))})`));const before=state(h);
  h.run(`globalThis.e=event('npc_deokgu_2');globalThis.c=e.choices[${old.choice}];globalThis.r=G.resolvePresentedChoice(e,c)`);
  assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),old.text);assert.deepEqual(state(h),before);
  assert.deepEqual(h.json('qaNamed(qaResult(e,c,r.out))'),textOnly?old.textOnlyResult:old.result);
  if(textOnly)assert(h.run('r.out.frozenTextOnly'));
 }
});
