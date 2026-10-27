'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle19/systems/repair');
const {load,state}=require(dir+'/fixture.cjs'),{setup}=require(dir+'/setup.cjs'),helper=require('../qa-artifacts/qa-cycle-20261026/cycle12/story/reader-runtime.cjs');
const baseline=require(dir+'/baseline.json'),legacy=require(dir+'/legacy.json');
test('signal bait keeps both recorded requests while ordinary noise does not invent Tianyan as its source',()=>{
 const h=load('signal_bait',{party:[]}),turns=h.json('qaNamed(entry)');
 const noise=turns.find(t=>/잡음/.test(t.text));assert.equal(noise.kind,'narration');assert.equal(noise.text,'잡음이 섞였다.');assert(!turns.some(t=>t.kind==='ai'||t.kind==='thought'||t.who==='cheollian'));
 const radio=turns.filter(t=>t.kind==='radio');assert.equal(radio.length,2);
 for(const line of radio){assert.equal(line.name,'녹음된 구조 요청');assert.equal(line.who,'radio');assert.equal(line.text,'…차량 고장. 아이 둘. 좌표 보냅니다. 물이 없어요…');}
});
for(const id of ['crisis_nofuel','crisis_nofuel2'])test(`${id} paid help identifies the already introduced merchant without assigning NPC Mansu or a passenger`,()=>{
 for(const party of [[],['eunsu','parkss'],['parkss','eunsu']]){
  const h=load(id,{party});h.run('globalThis.c=e.choices[1];globalThis.o=c.out[0]');
  const lines=h.json('qaNamed(qaResult(e,c,o,{knownSpeaker:entry.knownSpeaker})).filter(t=>t.kind!=="narration")');
  assert.equal(lines.length,1);assert.equal(lines[0].kind,'dialogue');assert.equal(lines[0].who,'passer_merchant');assert.equal(lines[0].name,'만물상 상인');assert.equal(lines[0].displayName,'만물상 상인');assert.notEqual(lines[0].who,'mansu');assert(!party.includes(lines[0].who));
 }
});
for(const spec of baseline)test(`${spec.id} every result retains its full original prose and other speakers without entry-route leakage`,()=>{
 const h=load(spec.id);
 for(const [key,old] of Object.entries(spec.routes.out)){
  const [ci,oi]=key.split('.');h.run(`globalThis.c=e.choices[${ci}];globalThis.o=c.out[${oi}]`);
  const turns=h.json('qaNamed(qaResult(e,c,o,{knownSpeaker:entry.knownSpeaker}))');
  assert.deepEqual(turns.map(t=>t.text),old.map(t=>t.text));
  if(spec.id.startsWith('crisis_nofuel')&&key==='1.0'){
   assert.deepEqual(turns.filter(t=>t.kind==='narration'),old.filter(t=>t.kind==='narration'));
   assert.equal(turns.filter(t=>t.kind==='dialogue')[0].name,'만물상 상인');
  }else assert.deepEqual(turns,old,key);
 }
});
for(const old of legacy)test(`${old.id}[${old.choice}.${old.outcome}] current entry/result reload preserve reader and the frozen19 resource/time effects`,()=>{
 const h=load(old.id),frozen=load(old.id,{frozen:true}),entry=h.json('qaNamed(entry)');
 assert(h.run('G.save();G.load()'));h.run('globalThis.entry=qaEntry(e)');assert.deepEqual(h.json('qaNamed(entry)'),entry);
 for(const env of [h,frozen]){env.run(`globalThis.c=e.choices[${old.choice}];G.pickOutcome=()=>c.out[${old.outcome}];globalThis.r=G.resolvePresentedChoice(e,c)`);assert(env.run('r.ok&&r.applied'));}
 assert.deepEqual(state(h),state(frozen));assert.equal(h.run('r.out.text'),frozen.run('r.out.text'));assert.deepEqual(h.json('r.chips'),frozen.json('r.chips'));
 h.run('globalThis.turns=qaResult(e,c,r.out,{knownSpeaker:entry.knownSpeaker})');const turns=h.json('qaNamed(turns)'),paid=state(h);
 h.run("G.capturePresentationView({eventId:e.id,phase:'outcome',turns,knownSpeaker:!!entry.knownSpeaker,index:0});G.save();G.load();globalThis.again=G.resolvePresentedChoice(e,c)");
 assert.equal(h.run('again.applied'),false);assert.deepEqual(state(h),paid);assert.deepEqual(h.json('qaNamed(qaResult(e,c,again.out))'),turns);
});
test('all ten old paid views and text-only receipts retain historical voices/text without repayment',()=>{
 for(const old of legacy)for(const textOnly of [false,true]){
  const h=setup();h.run('(()=>{'+helper.code()+'})()');const saved=JSON.parse(fs.readFileSync(dir+'/'+old.file));
  if(textOnly){delete saved.pendingPresentation.view;delete saved.pendingPresentation.reading;delete saved.pendingPresentation.authoredView;}
  assert(h.run(`G.load(${JSON.stringify(JSON.stringify(saved))})`));const before=state(h);
  h.run(`globalThis.e=event('${old.id}');globalThis.c=e.choices[${old.choice}];globalThis.r=G.resolvePresentedChoice(e,c)`);
  assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),old.text);assert.deepEqual(state(h),before);
  if(!textOnly)assert.deepEqual(h.json('qaNamed(qaResult(e,c,r.out))'),old.result);
  else{assert(h.run('r.out.frozenTextOnly'));assert.deepEqual(h.json('qaNamed(qaResult(e,c,r.out))'),old.textOnlyResult);}
 }
});
test('only the noise wrapper and the two merchant role routes change; all flags, costs, probabilities, indexes and outcome words remain frozen19',()=>{
 const h=setup();for(const old of baseline){const now=h.json(`JSON.parse(JSON.stringify(event('${old.id}'),(k,v)=>typeof v==='function'?v.toString():v))`),expected=JSON.parse(JSON.stringify(old.event));
  if(old.id==='signal_bait')expected.text=expected.text.replace('<span class="ai">(잡음)</span>','잡음이 섞였다.');
  else expected.choices[1].out[0].turnSpeakers=[{who:'passer_merchant',name:'만물상 상인'}];
  assert.deepEqual(now,expected,old.id);
 }
});
