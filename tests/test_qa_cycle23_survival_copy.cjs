'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle23/survival/repair24');
const {setup,open,choose,state,frozen}=require(dir+'/setup.cjs');
const delta=require(dir+'/copy-delta.json'),before=require(dir+'/before.json'),legacy=require(dir+'/legacy-manifest.json');
const voices=turns=>turns.filter(t=>t.kind!=='narration').map(t=>({kind:t.kind,who:t.who,name:t.name,text:t.text}));
test('only the two approved prose fragments change; all routes, conditions, costs, notes and other outcomes remain identical',()=>{
 const h=setup(),now=h.json(`Object.fromEntries(${JSON.stringify(Object.keys(before))}.map(id=>[id,event(id)]))`);
 for(const d of delta){assert.equal(now[d.id].choices[1].out[0].text,d.new);now[d.id].choices[1].out[0].text=d.old;}
 assert.deepEqual(now,before);
});
for(const d of delta)test(`${d.id}: current decision has zero elapsed time, unchanged state/chips and the same actual spoken roles`,()=>{
 const h=open(setup(),d.id),old=open(setup(frozen),d.id),start=state(h);
 const result=choose(h,1),previous=choose(old,1);
 assert(result.ok&&result.applied);assert.equal(result.text,d.new);
 assert.equal(state(h).day,start.day);assert.equal(state(h).min,start.min);
 assert.deepEqual(state(h),state(old));assert.deepEqual(result.chips,previous.chips);
 assert.deepEqual(voices(result.turns),voices(previous.turns));
 const paid=state(h),reading=h.json('S.pendingPresentation.reading');
 assert.equal(h.run('G.load()'),true);const replay=choose(h,1);assert.equal(replay.applied,false);
 assert.deepEqual(replay.turns,result.turns);assert.deepEqual(state(h),paid);assert.deepEqual(h.json('S.pendingPresentation.reading'),reading);
});
test('water sharing retains the exact public requirement and mood-only effects for water 1/1.5/2 and reordered 2/3 companions',()=>{
 for(const water of [1,1.5,2])for(const party of [['minji','parkss'],['eunsu','parkss','minji']]){
  const h=open(setup(),'comp_water_fight',water,party),old=open(setup(frozen),'comp_water_fight',water,party);
  assert.equal(h.run('G.reqOk(G.choiceReq(e.choices[1])).ok'),true);
  const a=choose(h,1),b=choose(old,1);assert(a.applied);assert.equal(h.run('S.water'),water);
  assert.deepEqual(state(h),state(old));assert.deepEqual(voices(a.turns),voices(b.turns));
  assert.deepEqual(a.turns.filter(t=>t.kind==='dialogue').map(t=>t.who),party.slice(0,2));
 }
 const h=open(setup(),'comp_water_fight',0.5);assert.equal(h.run('G.reqOk(G.choiceReq(e.choices[1])).ok'),false);
 const initial=state(h);assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[1]).ok'),false);assert.deepEqual(state(h),initial);
});
test('all other choices retain entry, result reader, mechanics and stable entry/paid reloads',()=>{
 for(const row of legacy.filter(r=>r.ci!==1)){
  const h=open(setup(),row.id),r=choose(h,row.ci);
  assert.deepEqual(h.json('et'),row.entry);assert.deepEqual(r,row.result);assert.deepEqual(state(h),row.after);
  assert.equal(h.run('G.load()'),true);assert.equal(choose(h,row.ci).applied,false);assert.deepEqual(state(h),row.after);
 }
});
for(const textOnly of [false,true])test(`all five frozen23 paid outcomes preserve ${textOnly?'text-only':'saved-view'} text, voices, notes and chips without reapplying`,()=>{
 for(const row of legacy){
  const raw=JSON.parse(fs.readFileSync(path.join(dir,row.file)));
  if(textOnly){delete raw.pendingPresentation.view;delete raw.pendingPresentation.reading;delete raw.pendingPresentation.authoredView;}
  const results=[];
  for(const source of [frozen,undefined]){
   const h=setup(source);assert.equal(h.run(`G.load(${JSON.stringify(JSON.stringify(raw))})`),true);
   const initial=state(h),loadedChips=h.json('S.pendingPresentation.chips');h.run(`globalThis.e=event(${JSON.stringify(row.id)});globalThis.et={knownSpeaker:false};`);
   const r=choose(h,row.ci);assert.equal(r.applied,false);assert.equal(r.text,row.result.text);assert.deepEqual(r.chips,loadedChips);
   assert.deepEqual(state(h),initial);results.push(r);
   assert.equal(h.run('G.load()'),true);assert.equal(choose(h,row.ci).applied,false);assert.deepEqual(state(h),initial);
  }
  assert.deepEqual(results[1],results[0]);
 }
});
