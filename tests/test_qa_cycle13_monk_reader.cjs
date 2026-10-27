const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const dir=path.join(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle13/story/monk-fix');
const spec=require(path.join(dir,'expected-routes.json'));
const state=h=>h.run('JSON.stringify([S.water,S.food,S.min,S.flags,S.notes,S.comps])');
function fixture(party){const h=setup();h.run(`S.party=${JSON.stringify(party)};S.water=12;S.min=600;globalThis.e=event('near_hapcheon_sutra');G.beginPresentation(e);G.save();G.load();`);return h;}
function read(h){h.run("globalThis.ts=Array.isArray(r.out.turns)&&r.out.turns.length?r.out.turns:buildStoryTurns(r.out.text,e,{frozenTextOnly:!!r.out.frozenTextOnly,turnSpeakers:r.out.frozenTextOnly?[]:r.out.turnSpeakers})");return h.json('ts');}
test('introduced monk entry has the reviewed identity and registered portrait',()=>{
 const h=fixture([]);assert.equal(h.run("D.portraits.passer_monk"),'__NPC_passer_monk__');
 const ts=h.json('buildStoryTurns(S.pendingPresentation.text,e,{turnSpeakers:e.turnSpeakers})');
 assert.deepEqual(ts.filter(t=>t.kind==='dialogue').map(t=>[t.who,t.name]),[['passer_monk','목판 옮기는 스님'],['passer_monk','목판 옮기는 스님']]);
});
for(const party of [[],['minji','eunsu']])for(const c of spec.choices)test(`monk choice${c.i} / ${party.join('+')||'solo'} actual reader and paid reload`,()=>{
 const h=fixture(party);h.run(`globalThis.r=G.resolvePresentedChoice(e,e.choices[${c.i}])`);assert(h.run('r.ok&&r.applied'));
 const ts=read(h),speech=ts.filter(t=>t.kind==='dialogue');assert.deepEqual(speech.map(t=>t.who),c.speakers.map(x=>typeof x==='string'?x:x.who));
 assert(speech.filter(t=>t.who==='passer_monk').every(t=>t.name==='목판 옮기는 스님'));assert(speech.every(t=>!t.speakerUncertain));
 const before=state(h);h.run(`S.pendingPresentation.view={turns:ts,index:0};G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[${c.i}])`);assert.equal(h.run('r.applied'),false);assert.deepEqual(read(h),ts);assert.equal(state(h),before);
});
test('old worker-fallback paid views remain frozen and never repay',()=>{
 for(let i=0;i<3;i++){const h=setup(),save=fs.readFileSync(path.join(dir,'choice'+i+'-legacy-paid.json'),'utf8');assert(h.run('G.load('+JSON.stringify(save)+')'));const before=state(h);h.run(`globalThis.e=event('near_hapcheon_sutra');globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}])`);assert.equal(h.run('r.applied'),false);assert.deepEqual(read(h),require(path.join(dir,'choice'+i+'-old-reader.json')));assert.equal(state(h),before);}
});
test('old text-only receipts retain their previous reader instead of adopting new monk identity',()=>{
 for(let i=0;i<3;i++){const h=setup(),save=JSON.parse(fs.readFileSync(path.join(dir,'choice'+i+'-legacy-paid.json'),'utf8'));delete save.pendingPresentation.view;assert(h.run('G.load('+JSON.stringify(JSON.stringify(save))+')'));h.run(`globalThis.e=event('near_hapcheon_sutra');globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}])`);assert.equal(h.run('r.applied'),false);assert(h.run('r.out.frozenTextOnly'));assert.deepEqual(read(h),require(path.join(dir,'choice'+i+'-old-textonly-reader.json')));}
});
test('monk identity metadata leaves every word, choice, cost, probability and effect unchanged',()=>{
 const h=setup(),old=require(path.join(dir,'before-event.json'));assert.deepEqual(h.json("JSON.parse(JSON.stringify(event('near_hapcheon_sutra'),(k,v)=>k==='turnSpeakers'?undefined:v))"),JSON.parse(JSON.stringify(old,(k,v)=>k==='turnSpeakers'?undefined:v)));
});
