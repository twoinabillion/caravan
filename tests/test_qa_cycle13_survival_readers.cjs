
// Cycle29: project only the reviewed standalone-attribution edit into frozen baselines.
function projectCycle29(id,now,old){
 const changes={talk_mj_18:[0,'중간에 "아니 그게 아니라"를 두 번쯤 하더니 고개를 끄덕였다.','중간에 두 번쯤 말했다. "아니 그게 아니라" 그러더니 고개를 끄덕였다.'],talk_jy_18:[1,'웃다가 다시 "저녁 뭐예요?" 하고 물었다.','웃다가 다시 물었다. "저녁 뭐예요?"']};
 const change=changes[id];if(!change)return now;
 const [i,from,to]=change,was=old.choices[i].out[0].text,cur=now.choices[i].out[0].text;
 assert.equal(was.split(from).length,2,id+' old fragment');assert.equal(cur,was.replace(from,to),id+' exact cycle29 delta');
 now.choices[i].out[0].text=was;return now;
}
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const dir=path.join(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle13/survival/reader-fix');
const cases=require(path.join(dir,'cases.json')),baseline=require(path.join(dir,'before-events.json'));
const state=h=>h.run('JSON.stringify([S.food,S.water,S.scrap,S.min,S.items,S.flags,S.notes,S.comps,S.stats])');
function fixture(id,party=['leo','jaeyi','eunsu']){const h=setup();h.run(`S.party=${JSON.stringify(party)};S.food=10;S.water=15;S.scrap=40;S.min=600;S.dog=true;globalThis.e=event('${id}');G.beginPresentation(e);globalThis.entryTurns=buildStoryTurns(S.pendingPresentation.text,e,{turnSpeakers:D.finaleSpeakers(e.id,-1,S)||e.turnSpeakers});globalThis.knownSpeaker=!!entryTurns.knownSpeaker;G.capturePresentationView({eventId:e.id,phase:'event',turns:entryTurns,knownSpeaker,index:0});G.save();G.load();`);return h;}
function reader(h,i){h.run(`globalThis.turns=Array.isArray(r.out.turns)&&r.out.turns.length?r.out.turns:buildStoryTurns(r.out.text,e,{knownSpeaker:typeof knownSpeaker==='boolean'?knownSpeaker:false,frozenTextOnly:!!r.out.frozenTextOnly,turnSpeakers:r.out.frozenTextOnly?[]:D.finaleSpeakers(e.id,${i},S)||r.out.turnSpeakers})`);return h.json('turns');}
const routed=turns=>turns.filter(t=>['dialogue','record','radio'].includes(t.kind));
function verify(turns,spec){assert.deepEqual(routed(turns).map(t=>[t.kind,t.who]),spec.map(s=>typeof s==='string'?['dialogue',s]:[s.kind||'dialogue',s.who]));assert(routed(turns).every(t=>t.name!=='???'&&!t.speakerUncertain));for(let i=0;i<spec.length;i++)if(spec[i].name)assert.equal(routed(turns)[i].name,spec[i].name);}
for(const c of cases){
 if(c.entry)test(c.id+' entry preserves actual speakers after unpaid reload',()=>{const h=fixture(c.id);verify(h.json("buildStoryTurns(S.pendingPresentation.text,e,{turnSpeakers:D.finaleSpeakers(e.id,-1,S)||e.turnSpeakers})"),c.entry);});
 for(const branch of c.choices)for(const party of [['leo','jaeyi','eunsu'],['eunsu','leo','jaeyi']])test(`${c.id}.${branch.i}.${branch.o} actual reader and paid replay / ${party[0]}`,()=>{
  const h=fixture(c.id,party);h.run(`G.rollOut=outs=>outs[${branch.o}];globalThis.r=G.resolvePresentedChoice(e,e.choices[${branch.i}]);`);assert(h.run('r.ok&&r.applied'));const turns=reader(h,branch.i);verify(turns,branch.speakers);
  const paid=state(h);h.run(`G.capturePresentationView({eventId:e.id,phase:'outcome',turns,knownSpeaker,index:1,readerMode:'current'});G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[${branch.i}]);`);assert.equal(h.run('r.applied'),false);assert.deepEqual(reader(h,branch.i),turns);assert.equal(state(h),paid);
 });
}
test('previous paid reader snapshots remain frozen with identical effects',()=>{
 for(const c of cases)for(const b of c.choices){const stem=`${c.id}-${b.i}-${b.o}`,h=setup();assert(h.run('G.load('+JSON.stringify(fs.readFileSync(path.join(dir,stem+'-paid.json'),'utf8'))+')'));const before=state(h);h.run(`globalThis.knownSpeaker=!!S.pendingPresentation?.reading?.view?.knownSpeaker;globalThis.e=event('${c.id}');globalThis.r=G.resolvePresentedChoice(e,e.choices[${b.i}]);`);assert.equal(h.run('r.applied'),false);assert.deepEqual(reader(h,b.i),JSON.parse(fs.readFileSync(path.join(dir,stem+'-reader.json'),'utf8')));assert.equal(state(h),before);}
});
test('text-only previous receipts do not acquire newly authored speaker routes',()=>{
 for(const c of cases)for(const b of c.choices){const stem=`${c.id}-${b.i}-${b.o}`,h=setup(),saved=JSON.parse(fs.readFileSync(path.join(dir,stem+'-paid.json'),'utf8'));saved.pendingPresentation.view=null;saved.pendingPresentation.reading=null;saved.pendingPresentation.authoredView=null;
  assert(h.run('G.load('+JSON.stringify(JSON.stringify(saved))+')'));const before=state(h);h.run(`globalThis.knownSpeaker=!!S.pendingPresentation?.reading?.view?.knownSpeaker;globalThis.e=event('${c.id}');globalThis.r=G.resolvePresentedChoice(e,e.choices[${b.i}]);`);assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.frozenTextOnly'),true);assert.equal(h.run('r.out.text'),saved.pendingPresentation.text);
  // Text-only legacy data has no saved view markers; compare the original prose and speaker identity.
  const withoutViewMarkers=turns=>turns.map(({timeKind,timeLabel,...turn})=>turn);assert.deepEqual(withoutViewMarkers(reader(h,b.i)),withoutViewMarkers(JSON.parse(fs.readFileSync(path.join(dir,stem+'-reader.json'),'utf8'))));assert.equal(state(h),before);
 }
});
test('only explicit speaker metadata changes: prose, choices, gates, probabilities and effects stay identical',()=>{
 const h=setup();for(const id of Object.keys(baseline)){const current=JSON.parse(h.run(`JSON.stringify(event('${id}'),(k,v)=>k==='turnSpeakers'?undefined:typeof v==='function'?v.toString():v)`));const old=JSON.parse(JSON.stringify(baseline[id],(k,v)=>k==='turnSpeakers'?undefined:v));assert.deepEqual(projectCycle29(id,current,old),old,id);}
});

// Complete result matrix beneath every entry route introduced by survival in cycles12–14.
const entryMatrix=require(path.join(dir,'entry-inheritance-cases.json'));
for(const c of entryMatrix)for(const b of c.choices)test(`${c.id}.${b.i}.${b.o} result is independent from the entry speaker route`,()=>{
 const h=fixture(c.id,['minji','leo','jaeyi','eunsu']);
 // A future entry-only edit must not move result lines to the driver.
 h.run(`e.turnSpeakers=['me'];G.rollOut=outs=>outs[${b.o}];globalThis.r=G.resolvePresentedChoice(e,e.choices[${b.i}]);`);
 assert(h.run('r.ok&&r.applied'));const turns=reader(h,b.i);verify(turns,b.speakers);
 const before=state(h);h.run(`G.capturePresentationView({eventId:e.id,phase:'outcome',turns,knownSpeaker,index:0});G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[${b.i}]);`);
 assert.equal(h.run('r.applied'),false);assert.deepEqual(reader(h,b.i),turns);assert.equal(state(h),before);
});
test('all entry-owner result fixtures preserve their prior paid view',()=>{
 for(const c of entryMatrix)for(const b of c.choices){const h=setup(),stem=`${c.id}-${b.i}-${b.o}`,folder=path.join(dir,'entry-sweep');assert(h.run('G.load('+JSON.stringify(fs.readFileSync(path.join(folder,stem+'-paid.json'),'utf8'))+')'));const before=state(h);h.run(`globalThis.knownSpeaker=!!S.pendingPresentation.reading.view.knownSpeaker;globalThis.e=event('${c.id}');globalThis.r=G.resolvePresentedChoice(e,e.choices[${b.i}]);`);assert.equal(h.run('r.applied'),false);assert.deepEqual(reader(h,b.i),JSON.parse(fs.readFileSync(path.join(folder,stem+'-reader.json'),'utf8')));assert.equal(state(h),before);}
});
test('complete entry-owner outcome matrix has unchanged prose and mechanics',()=>{
 const old=require(path.join(dir,'entry-sweep/before-events.json')),h=setup();for(const c of entryMatrix){assert.equal(h.run(`event('${c.id}').choices.reduce((n,c)=>n+c.out.length,0)`),c.choices.length,'matrix misses outcome '+c.id);const curr=JSON.parse(h.run(`JSON.stringify(event('${c.id}'),(k,v)=>k==='turnSpeakers'?undefined:typeof v==='function'?v.toString():v)`));const was=JSON.parse(JSON.stringify(old[c.id],(k,v)=>k==='turnSpeakers'?undefined:v));assert.deepEqual(projectCycle29(c.id,curr,was),was);}
});
