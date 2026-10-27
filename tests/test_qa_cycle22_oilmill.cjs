'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle22/systems/repair23');
const {load,state,old,next}=require(dir+'/oilmill.cjs'),baseline=require(dir+'/oilmill-before.json');
for(const minute of [360,900,1430])test(`oilmill at ${minute} plans the next meal without claiming a completed evening or advancing the clock`,()=>{
 const h=load({minute}),frozen=load({minute,frozen:true});assert(h.run('available'));assert.deepEqual(h.json('qaNamed(entry)'),baseline.entry);
 const unpaid=state(h),view=h.json('S.pendingPresentation.reading.view');assert(h.run('G.save();G.load()'));assert.deepEqual(state(h),unpaid);assert.deepEqual(h.json('S.pendingPresentation.reading.view'),view);
 for(const env of [h,frozen]){env.run('globalThis.c=e.choices[0];globalThis.r=G.resolvePresentedChoice(e,c)');assert(env.run('r.ok&&r.applied'));}
 assert.equal(h.run('S.day'),5);assert.equal(h.run('S.min'),minute);assert.deepEqual(state(h),state(frozen));assert.deepEqual(h.json('r.chips'),frozen.json('r.chips'));
 assert.equal(h.run('S.food'),5);assert.equal(h.run('S.scrap'),16);assert.equal(h.run('S.comps.minji.mood'),46);
 h.run('globalThis.turns=qaResult(e,c,r.out,{knownSpeaker:entry.knownSpeaker})');const turns=h.json('qaNamed(turns)');
 assert.deepEqual(turns.map(t=>t.text),baseline.out[0].map(t=>t.text===old?next:t.text));
 assert(turns.every(t=>t.kind==='narration'));assert(turns.some(t=>t.text===next));
 const paid=state(h);h.run('G.capturePresentationView({eventId:e.id,phase:"outcome",turns,knownSpeaker:!!entry.knownSpeaker,index:0});G.save();G.load();globalThis.again=G.resolvePresentedChoice(e,c)');
 assert.equal(h.run('again.applied'),false);assert.deepEqual(state(h),paid);assert.deepEqual(h.json('qaNamed(qaResult(e,c,again.out))'),turns);
});
test('oilmill alternate outcome retains full reader and numeric effects; entry gates stay party/region based',()=>{
 const h=load(),frozen=load({frozen:true});
 for(const env of [h,frozen]){env.run('globalThis.c=e.choices[1];globalThis.r=G.resolvePresentedChoice(e,c)');assert(env.run('r.ok&&r.applied'));}
 assert.deepEqual(h.json('qaNamed(qaResult(e,c,r.out,{knownSpeaker:entry.knownSpeaker}))'),baseline.out[1]);assert.deepEqual(state(h),state(frozen));assert.deepEqual(h.json('r.chips'),frozen.json('r.chips'));
 h.run('globalThis.turns=qaResult(e,c,r.out,{knownSpeaker:entry.knownSpeaker})');const paid=state(h),turns=h.json('qaNamed(turns)');h.run('G.capturePresentationView({eventId:e.id,phase:"outcome",turns,knownSpeaker:!!entry.knownSpeaker,index:0});G.save();G.load();globalThis.again=G.resolvePresentedChoice(e,c)');assert.equal(h.run('again.applied'),false);assert.deepEqual(state(h),paid);assert.deepEqual(h.json('qaNamed(qaResult(e,c,again.out))'),turns);
 assert.equal(load({party:[]}).run('available'),false);assert.equal(load({at:'suwon'}).run('available'),false);
});
test('only the one future-evening paragraph changes; every original note/FX/gate/index/weight remains exact',()=>{
 const h=load(),expected=structuredClone(baseline.event);expected.choices[0].out[0].text=expected.choices[0].out[0].text.replace(old,next);assert.deepEqual(h.json('e'),expected);
 assert.deepEqual(h.json('e.choices[0].out[0].fx'),baseline.event.choices[0].out[0].fx);
});
test('both old paid and text-only oilmill outcomes keep frozen22 prose, reader and effects without repayment',()=>{
 for(const row of baseline.legacy)for(const textOnly of [false,true]){
  const h=load(),raw=JSON.parse(fs.readFileSync(dir+'/'+row.file));if(textOnly){delete raw.pendingPresentation.view;delete raw.pendingPresentation.reading;delete raw.pendingPresentation.authoredView;}
  assert(h.run(`G.load(${JSON.stringify(JSON.stringify(raw))})`));const before=state(h);h.run(`globalThis.c=e.choices[${row.choice}];globalThis.r=G.resolvePresentedChoice(e,c)`);
  assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),row.text);assert.deepEqual(state(h),before);assert.deepEqual(h.json('qaNamed(qaResult(e,c,r.out))'),textOnly?row.textOnly:row.result);if(textOnly)assert(h.run('r.out.frozenTextOnly'));
 }
});
