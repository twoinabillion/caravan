'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const {fresh,pay,state}=require(path.join(root,'tests/fixtures/qa-cycle103-camp-memory/setup.cjs'));
const b=require('./fixtures/qa-cycle107-dogs/baseline.json');
const plain=ts=>ts.map(({scene,...t})=>t);
const stages=[['camp-stray-dogs-night-v1','camp-thief-after-night-v1','camp-visitor-empty-day-v1'],['camp-thief-after-night-v1','camp-dogs-returned-can-morning-v1'],['camp-stray-dogs-night-v1','camp-thief-after-night-v1'],['camp-thief-after-night-v1']];
for(const row of b.events)test(`controlled dogs ${row.min}/${row.ci}/${row.oi}: words effects and authored stage cuts`,()=>{
 const h=fresh('camp_dogs',row.min);h.run("S.party=['leo'];S.comps.leo.bond=10;");const r=pay(h,row.ci,row.oi,false);
 assert.equal(r.applied,true);assert.equal(r.text,row.result.text);assert.deepEqual(plain(r.turns),plain(row.result.turns));assert.deepEqual(r.chips,row.result.chips);assert.deepEqual(state(h),row.state);
 assert.equal(h.run('S.pendingPresentation.sceneRevision'),'qa107');assert.equal(r.info.sceneTime,undefined);
 const want=stages[row.ci===2?2+row.oi:row.ci];for(let i=0;i<r.turns.length;i++){assert.equal(h.run(`qaCut({eventId:e.id,phase:'outcome',turns:${JSON.stringify(r.turns)},sceneKeys:${JSON.stringify(r.info.sceneKeys)}},${i})`),want[i]);}
 const save=h.run('G.exportSave()'),before=state(h);assert(h.run(`G.load(${JSON.stringify(save)})`));const again=pay(h,row.ci,row.oi,false);assert.equal(again.applied,false);assert.deepEqual(again,{...r,applied:false});assert.deepEqual(state(h),before);
});
