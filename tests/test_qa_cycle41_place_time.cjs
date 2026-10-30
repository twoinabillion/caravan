'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{init}=require('./fixtures/qa-cycle41-fuel/reader.cjs');
for(const [id,base,day,night] of [
 ['ev_truck_cafe','event-road-coffee-van-v2','event-road-coffee-van-day-v1','event-road-coffee-van-v2'],
 ['patrol_toll','event-ai-checkpoint','event-ai-checkpoint-day-v1','event-ai-checkpoint'],
 ['combat_toll_read','event-ai-checkpoint','event-ai-checkpoint-day-v1','event-ai-checkpoint'],
 ['combat_toll_breach','event-ai-checkpoint','event-ai-checkpoint-day-v1','event-ai-checkpoint'],
 ['ev_pc_cafe','event-explore-leisure','event-explore-pc-cafe-v1','event-explore-pc-cafe-v1']
])test(id+' actual entry uses the reviewed place/time while old untimed entry keeps its original key',()=>{
 for(const min of [329,330,1169,1170]){
  const h=init(id,min),key=min<330||min>=1170?night:day;
  assert.deepEqual(h.json('ei.sceneKeys'),[key]);assert.deepEqual(h.json('ei.sceneTime'),{day:4,min});
  const before=h.json('S.pendingPresentation.reading');h.run('G.save();G.load();');assert.deepEqual(h.json('S.pendingPresentation.reading'),before);
  h.run("S.pendingPresentation.reading=null;S.pendingPresentation.view=null;delete S.pendingPresentation.sceneTime;globalThis.i=info(e,'event',[],et)");assert.deepEqual(h.json('i.sceneKeys'),[base]);assert.equal(h.run('i.sceneTime'),undefined);
  h.run("globalThis.foreign=info(e,'event',['seoul-core-view-v2'],[])");assert.deepEqual(h.json('foreign.sceneKeys'),['seoul-core-view-v2']);
 }
});
