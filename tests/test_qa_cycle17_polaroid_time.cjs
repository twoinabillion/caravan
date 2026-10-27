'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup:baseSetup}=require('../qa-artifacts/qa-cycle-20261026/cycle15/story/repair/setup.cjs'),helper=require('../qa-artifacts/qa-cycle-20261026/cycle12/story/reader-runtime.cjs');
const dir=path.resolve(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle17/story/polaroid-review'),copies=require(dir+'/copy-delta.json'),old=[require(dir+'/before.json'),require(dir+'/before-photostudio.json')];
const setup=()=>process.env.QA_SOURCE_ROOT?baseSetup(process.env.QA_SOURCE_ROOT):baseSetup();
function init(){const h=setup();h.run('(()=>{'+helper.code()+'})()');h.run("S.party=['minji'];S.day=5;S.min=120;");return h;}
const state=h=>h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.fuel,S.scrap,S.flags,S.notes,S.comps,S.items,S.stats])');
test('the public photo choice proves the studio visit and permits polaroid at all tested times',()=>{
 const h=init();assert.equal(h.run("G.eventAvailable(event('comp_polaroid'))"),false);
 h.run("globalThis.p=event('exp_photostudio');G.beginPresentation(p);globalThis.r=G.resolvePresentedChoice(p,p.choices[0]);");assert(h.run('r.ok&&r.applied&&S.flags.family_photo'));
 for(const min of [120,300,600,900,1080,1320]){h.run('S.min='+min);assert(h.run("G.eventAvailable(event('comp_polaroid'))"));assert(h.run("G.eligible().some(e=>e.id==='comp_polaroid')"));}
});
test('fresh polaroid entries and both results keep time-neutral copy, notes and reloads at every tested time',()=>{
 for(const min of [120,300,600,900,1080,1320])for(const i of [0,1]){
  const h=init();h.run(`S.flags.family_photo=true;S.min=${min};globalThis.e=event('comp_polaroid');G.beginPresentation(e);globalThis.entry=qaEntry(e);G.save();G.load();`);
  assert.equal(h.run('e.text'),copies.find(d=>d.id==='comp_polaroid'&&d.path.length===1).new);assert.doesNotMatch(h.run('e.text'),/오후/);
  h.run(`globalThis.c=e.choices[${i}];globalThis.r=G.resolvePresentedChoice(e,c);globalThis.reader=qaResult(e,c,r.out,{knownSpeaker:!!entry.knownSpeaker})`);assert(h.run('r.ok&&r.applied'));assert.doesNotMatch(h.run('r.out.text'),/노을|내렸았다/);
  if(i===0)assert.equal(h.run("S.notes.find(n=>n.title==='필름 한 장').body"),copies.find(d=>d.path.at(-1)==='body').new);
  const paid=state(h),turns=h.json('qaNamed(reader)');h.run("G.capturePresentationView({eventId:e.id,phase:'outcome',turns:reader,knownSpeaker:!!entry.knownSpeaker,index:0});G.save();G.load();globalThis.replay=G.resolvePresentedChoice(e,c)");assert.equal(h.run('replay.applied'),false);assert.equal(state(h),paid);assert.deepEqual(h.json('qaNamed(qaResult(e,c,replay.out))'),turns);
 }
});
test('taking the family photo now explicitly carries the same camera and remaining film',()=>{
 const h=init();h.run("globalThis.e=event('exp_photostudio');G.beginPresentation(e);globalThis.entry=qaEntry(e);globalThis.c=e.choices[0];globalThis.r=G.resolvePresentedChoice(e,c)");assert(h.run('r.ok&&r.applied'));assert.equal(h.run('r.out.text'),copies.find(d=>d.id==='exp_photostudio').new);assert(h.run('S.flags.family_photo'));assert.deepEqual(h.json('r.out.fx'),old[1].event.choices[0].out[0].fx);
});
test('both complete definitions retain all other prose, gates, resource effects and choice order',()=>{
 const h=setup();for(const b of old){const actual=h.json(`event('${b.event.id}')`);for(const d of copies.filter(d=>d.id===b.event.id)){let target=actual;for(const k of d.path.slice(0,-1))target=target[k];assert.equal(target[d.path.at(-1)],d.new);target[d.path.at(-1)]=d.old;}assert.deepEqual(actual,b.event);}
});
for(const textOnly of [false,true])test('four old paid '+(textOnly?'text-only':'full-view')+' receipts retain words, notes and effects',()=>{
 for(const b of old)for(const row of b.legacy){const h=init(),save=JSON.parse(fs.readFileSync(path.join(dir,row.file)));if(textOnly){delete save.pendingPresentation.view;delete save.pendingPresentation.reading;}assert(h.run('G.load('+JSON.stringify(JSON.stringify(save))+')'));const paid=state(h);h.run(`globalThis.e=event('${b.event.id}');globalThis.c=e.choices[${row.i}];globalThis.r=G.resolvePresentedChoice(e,c)`);assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),row.text);assert.equal(state(h),paid);assert.deepEqual(h.json('S.notes'),row.notes);assert.deepEqual(h.json('qaNamed(qaResult(e,c,r.out))'),textOnly?row.textOnly:row.reader);}
});
