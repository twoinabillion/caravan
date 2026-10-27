'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle19/survival/repair20');
const {setup,fixture,reader,normalEntry}=require(dir+'/runtime.cjs');
const plain=x=>JSON.parse(JSON.stringify(x));
const resources=h=>h.json('({day:S.day,min:S.min,food:S.food,water:S.water,scrap:S.scrap,fuel:S.fuel,fatigue:S.fatigue,items:S.items,flags:S.flags,notes:S.notes,comps:S.comps,stats:S.stats})');
function choose(h,i,j=0){h.run(`globalThis.originalPick=G.pickOutcome;G.pickOutcome=(e,c)=>c.out[${j}];globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}]);G.pickOutcome=originalPick;`);return reader(h,i);}
const rosters=[
 {party:['minji'],guest:{id:'jaeyi',stage:'road',target:'gimcheon'}},
 {party:['minji'],guest:null},
 {party:['jaeyi','minji'],guest:null},
 {party:['eunsu','minji'],guest:{id:'leo',stage:'road',target:'gimcheon'}},
];
for(const spec of rosters)test(`slide laughter belongs to current companion for ${spec.party}, guest ${spec.guest?.id||'none'}`,()=>{
 const h=fixture(false,spec.party,spec.guest),old=fixture(true,spec.party,spec.guest);
 const entry=h.json('entryTurns'),before=resources(h);h.run('G.save();G.load()');assert.deepEqual(h.json('S.pendingPresentation.reading.view.turns'),entry);assert.deepEqual(resources(h),before);
 const turns=choose(h,1);choose(old,1);
 const speech=turns.filter(t=>t.kind==='dialogue');assert.equal(speech.length,1);assert.equal(speech[0].who,spec.party[0]);assert.notEqual(speech[0].who,'me');assert.notEqual(speech[0].name,'???');assert(!speech[0].speakerUncertain);
 assert.equal(h.run('r.out.text'),old.run('r.out.text'));assert.deepEqual(resources(h),resources(old));assert.deepEqual(h.json('r.chips'),old.json('r.chips'));assert.equal(h.run('S.min')-before.min,30);
 const paid=resources(h);h.run('G.capturePresentationView({eventId:e.id,phase:"outcome",turns,knownSpeaker,index:1});G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[1]);');assert.equal(h.run('r.applied'),false);assert.deepEqual(reader(h,1),turns);assert.deepEqual(resources(h),paid);
});
test('both supply outcomes and solo option availability are unchanged',()=>{
 for(const party of [[],['minji'],['jaeyi','eunsu']])for(const j of [0,1]){
  const h=fixture(false,party),old=fixture(true,party);const now=choose(h,0,j),before=choose(old,0,j);assert.deepEqual(now,before);assert.deepEqual(resources(h),resources(old));assert.equal(h.run('r.out.text'),old.run('r.out.text'));
 }
 const h=fixture(false,[]),old=fixture(true,[]);for(const x of [h,old])assert.equal(x.run('G.reqOk(e.choices[1].req).ok'),false);
});
test('normal frozen19 entry keeps its saved entry, pays current result once and displays actual Minji',()=>{
 const h=setup();assert(h.run(`G.load(${JSON.stringify(normalEntry)})`));const entry=h.json('S.pendingPresentation.reading.view'),before=resources(h);h.run('G.save();G.load()');assert.deepEqual(h.json('S.pendingPresentation.reading.view'),entry);assert.deepEqual(resources(h),before);
 h.run("globalThis.e=G.presentationEvent('ev_waterpark');globalThis.knownSpeaker=!!S.pendingPresentation.reading.view.knownSpeaker;");const turns=choose(h,1);assert.equal(turns.find(t=>t.kind==='dialogue').who,'minji');assert.equal(h.run('S.recruitQ.id'),'jaeyi');
});
for(const textOnly of [false,true])test(`frozen19 paid result preserves ${textOnly?'text-only':'saved reader'} without re-award`,()=>{
 const saved=JSON.parse(fs.readFileSync(dir+'/frozen19-paid.json','utf8'));
 if(textOnly){saved.pendingPresentation.reading=null;saved.pendingPresentation.view=null;saved.pendingPresentation.authoredView=null;}
 const compared=[];
 for(const frozen of [true,false]){
  const h=setup(frozen);assert(h.run(`G.load(${JSON.stringify(JSON.stringify(saved))})`));const before=resources(h);
  h.run(`globalThis.e=G.presentationEvent('ev_waterpark');globalThis.knownSpeaker=${textOnly?'false':'!!S.pendingPresentation.reading.view.knownSpeaker'};globalThis.r=G.resolvePresentedChoice(e,e.choices[1]);`);
  assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),saved.pendingPresentation.text);assert.deepEqual(resources(h),before);if(textOnly)assert(h.run('r.out.frozenTextOnly'));
  const turns=reader(h,1);compared.push(turns);h.run('G.save();G.load()');assert.deepEqual(resources(h),before);
 }
 assert.deepEqual(compared[1],compared[0]);if(!textOnly)assert.equal(compared[1].find(t=>t.kind==='dialogue').who,'passer_worker');
});
test('only the approved outcome metadata changes; words, all conditions/effects and indices remain frozen19',()=>{
 const h=setup(),old=setup(true),serialize="JSON.parse(JSON.stringify(G.presentationEvent('ev_waterpark'),(k,v)=>typeof v==='function'?v.toString():v))";
 const a=h.json(serialize),b=old.json(serialize);assert.deepEqual(a.choices[1].out[0].turnSpeakers,['party_first']);delete a.choices[1].out[0].turnSpeakers;assert.deepEqual(a,b);
});
