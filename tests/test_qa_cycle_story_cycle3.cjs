const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
function fixture(id,water=20){const h=setup();h.run(`S.at='jeonju';S.day=4;S.min=540;S.party=['leo','parkss'];S.dog=true;S.water=${water};S.food=20;S.used=[];S.notes=[];S.comps.parkss.bond=12;globalThis.e=event('${id}');G.beginPresentation(e);G.save();G.load();`);return h;}
for(const water of [0,1])test(`Bori bath cannot use two water when stock is ${water}`,()=>{
 const h=fixture('comp_bori_bath',water);assert.equal(h.run('G.reqOk(G.choiceReq(e.choices[0])).ok'),false);
 const before=h.run('JSON.stringify(S)');assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[0]).ok'),false);assert.equal(h.run('JSON.stringify(S)'),before);
 assert(h.run('G.reqOk(G.choiceReq(e.choices[1])).ok'));assert(h.run('G.resolvePresentedChoice(e,e.choices[1]).ok'));
});
test('Bori bath charges exact stock once, including after reload',()=>{
 const h=fixture('comp_bori_bath',2);assert(h.run('G.resolvePresentedChoice(e,e.choices[0]).ok'));assert.equal(h.run('S.water'),0);assert.equal(h.run('S.min'),600);
 const before=h.run('JSON.stringify([S.water,S.min,S.comps.leo.mood,S.notes])');h.run('G.save();G.load()');assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[0]).applied'),false);assert.equal(h.run('JSON.stringify([S.water,S.min,S.comps.leo.mood,S.notes])'),before);
 const stale=fixture('comp_bori_bath',2);stale.run('S.water=1;G.save();G.load()');assert.equal(stale.run('G.resolvePresentedChoice(e,e.choices[0]).ok'),false);
});
test('the convenience store does not deny all smokers before its tobacco barter choice',()=>{
 const h=fixture('ev_convenience_store');assert.doesNotMatch(h.run('S.pendingPresentation.text'),/아무도 안 피우/);h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[1])');assert.match(h.run('r.out.text'),/애연가/);
});
test('naming the van parts records the current ceremony instead of future repeated maintenance',()=>{
 const h=fixture('comp_naming');h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');assert.doesNotMatch(h.run('r.out.text'),/이후로|정비할 때마다/);assert(h.run('S.flags.van_parts_named'));assert.equal(h.run('S.min'),570);
});
for(const party of [[],['leo','parkss']])test(`plum meal fits an actual party of ${party.length}`,()=>{
 const h=fixture('ev_plum_blossom');h.run('S.party='+JSON.stringify(party));h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');assert.doesNotMatch(h.run('r.out.text'),/둘러앉|다 같이|일행 모두/);assert.match(h.run('r.out.text'),/끼니/);
});
test('Seoul gate does not invent carried letters or grandfather envelope',()=>{
 const h=setup();h.run("S.party=[];S.items={};S.flags={};globalThis.e=D.seoulOpenEvent;G.beginPresentation(e);G.save();G.load()");assert.doesNotMatch(h.run('S.pendingPresentation.text'),/편지와 봉투/);assert.match(h.run('S.pendingPresentation.text'),/수첩/);
});
test('Park can tell the bag story without an earlier promise event',()=>{
 const h=fixture('talk_pss_08');assert.equal(h.run('S.used.length'),0);assert.doesNotMatch(h.run('S.pendingPresentation.text'),/얘기해준다고 했지|말했잖|약속했/);h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');assert.match(h.run('r.out.text'),/수진이/);
});
test('historical paid text and notes stay frozen for all six story corrections',()=>{
 for(const id of ['comp_bori_bath','ev_convenience_store','comp_naming','ev_plum_blossom','talk_pss_08','seoul_open']){
  const h=setup();h.run(`S.water=0;S.notes=[{title:'옛 기록',body:'그때 읽은 원문'}];globalThis.e=${id==='seoul_open'?'D.seoulOpenEvent':`event('${id}')`};S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:0,outcomeIndex:0,text:'옛 지급 결과',chips:[],view:{turns:[{kind:'narration',text:'옛 지급 결과'}],index:0}};G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);`);
  assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),'옛 지급 결과');assert.equal(h.run('S.notes[0].body'),'그때 읽은 원문');assert.equal(h.run('S.water'),0);
 }
});
