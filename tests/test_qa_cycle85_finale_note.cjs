'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {setup,pay,state}=require('./fixtures/qa-cycle55-story/setup.cjs');
const oldDefinition=require('./fixtures/qa-cycle85-finale-note/definition.json');
const title='수첩의 마지막 줄';
// Catches a shared finale note falsely recording sleep after transfer/quarantine,
// and retroactive rewriting or repeated effects when a historical receipt reloads.
for(const method of ['transfer','sleep','quarantine']){
 const old=require('./fixtures/qa-cycle85-finale-note/'+method+'.json');
 test('finale notebook records only established facts after '+method,()=>{
  const h=setup();assert(h.run(`G.load(${JSON.stringify(old.entry)})`));
  h.run("globalThis.e=event('seoul_night'),entry=qaEntry(e),info=qaInfo(e,'event',[],entry)");
  const result=pay(h,1);assert(result.applied);
  const note=h.json(`S.notes.find(n=>n.title===${JSON.stringify(title)})`);
  assert.match(note.body,/가족의 직접 사유/);assert.match(note.body,/143년의 미확인 목적/);
  assert.match(note.body,/반복 정리 중지와 재집행 불가/);
  if(method!=='sleep')assert.doesNotMatch(note.body,/코어 수면|코어를 재웠|잠든 코어/);
  assert.equal(h.run('S.flags.core_'+method),true);
  assert.deepEqual(result,old.result); // Actual words/chips/turns stay unchanged.
  const oldState=structuredClone(old.state),current=state(h);
  oldState.notes.find(n=>n.title===title).body=note.body;
  assert.deepEqual(current,oldState);
  const save=h.run('G.exportSave()');assert(h.run(`G.load(${JSON.stringify(save)})`));
  const before=state(h);assert.equal(pay(h,1).applied,false);assert.deepEqual(state(h),before);
 });
 for(const kind of ['reader','text-only'])test('historical '+method+' '+kind+' receipt keeps its note and does not repay',()=>{
  const saved=JSON.parse(old.paid);if(kind==='text-only'){delete saved.pendingPresentation.view;delete saved.pendingPresentation.reading;delete saved.pendingPresentation.authoredView;}
  const h=setup();assert(h.run(`G.load(${JSON.stringify(JSON.stringify(saved))})`));
  const before=state(h);assert.match(before.notes.find(n=>n.title===title).body,/코어 수면 뒤에는/);
  h.run("globalThis.e=event('seoul_night'),r=G.resolvePresentedChoice(e,e.choices[1])");
  assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),old.result.text);
  assert.deepEqual(state(h),before);
  if(kind==='reader')assert.deepEqual(h.json('r.out.turns'),old.result.turns);else assert(h.run('r.out.frozenTextOnly'));
 });
}
test('the only authored delta is removal of the shared false sleep claim',()=>{
 const h=setup(),now=h.json("JSON.parse(JSON.stringify(event('seoul_night'),(k,v)=>typeof v==='function'?v.toString():v))"),expected=structuredClone(oldDefinition);
 expected.choices[1].out[0].fx.note.body='가족의 직접 사유와 143년의 미확인 목적을 나눠 적었다. 반복 정리 중지와 재집행 불가를 기록했다.';
 require('../tools/legacy-narrative-definition.cjs')(now,expected);
});
