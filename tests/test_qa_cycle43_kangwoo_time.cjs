'use strict';process.env.QA_TIME_PRODUCTION='1';
const test=require('node:test'),assert=require('node:assert/strict');
const {open,pay,state}=require('./fixtures/qa-cycle26-37-support/cycle31/story/time-scene/setup.cjs');
test('north-facing Kangwoo stays standing in the actual entry and both result cuts, with a phase-owned clock',()=>{
 for(const min of [329,330,1169,1170])for(const ci of [0,1]){
  const h=open('talk_kw_20',min),key=min<330||min>=1170?'comp-kangwoo-north-stand-night-v1':'comp-kangwoo-north-stand-day-v1';
  assert.deepEqual(h.json('info.sceneKeys'),[key]);assert.deepEqual(h.json('info.sceneTime'),{day:9,min});
  for(let i=0;i<h.run('entry.length');i++)assert.equal(h.run(`qaCut({eventId:e.id,turns:entry,sceneKeys:info.sceneKeys},${i})`),key);
  const r=pay(h,ci);assert(r.applied);assert.deepEqual(r.info.sceneKeys,[key]);assert(r.turns.some(t=>t.text.includes(ci===0?'경례':'같은 방향')));
  const before=state(h);h.run('G.save();G.load()');const replay=pay(h,ci);assert.equal(replay.applied,false);assert.deepEqual(replay.info,r.info);assert.deepEqual(state(h),before);
 }
});
test('an untimed old fallback remains the original night portrait without inventing a clock',()=>{
 const h=open('talk_kw_20',600);h.run("delete S.pendingPresentation.sceneTime;delete S.pendingPresentation.reading;delete S.pendingPresentation.view;globalThis.info=qaInfo(e,'event',[],entry)");assert.deepEqual(h.json('info.sceneKeys'),['comp-talk-kangwoo-camp-v1']);assert.equal(h.run('info.sceneTime'),undefined);
});
