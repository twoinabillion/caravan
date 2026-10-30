'use strict';
process.env.QA_TIME_PRODUCTION='1';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup,open,pay,state,root}=require('./fixtures/qa-cycle26-37-support/cycle31/story/time-scene/setup.cjs');
const rows=[
 {id:'story_bridge_watched',day:'story-bridge-watched-day-v1',night:'story-bridge-watched-v1'},
 {id:'meet_bus',day:'recruit-parkss-tilted-bus-day-v1',night:'recruit-parkss-tilted-bus-night-v1'}
];
for(const row of rows)test(`${row.id}: real reader selects the right image and preserves it across reload at day/night boundaries`,()=>{
 for(const min of [0,329,329.9,330,1169,1169.9,1170,1439]){
  const h=open(row.id,min),key=min<330||min>=1170?row.night:row.day,keys=h.json('info.sceneKeys');
  assert.equal(keys[0],key,`${row.id} at ${min}`);
  assert.deepEqual(h.json('info.sceneTime'),{day:9,min});
  for(let i=0;i<h.run('entry.length');i++)assert.equal(h.run(`qaCut({eventId:e.id,phase:'event',turns:entry,sceneKeys:info.sceneKeys},${i})`),key,`${row.id} turn ${i}`);
  h.run('S.min=700;G.save();G.load();globalThis.restored={eventId:e.id,phase:"event"};G.restorePresentationView(restored)');
  assert.deepEqual(h.json('restored.sceneKeys'),keys);assert.deepEqual(h.json('restored.sceneTime'),{day:9,min});
 }
});
for(const row of rows)test(`${row.id}: each choice keeps the matching presentation through result and reload`,()=>{
 for(const min of [320,700,1200])for(const ci of [0,1]){
  const h=open(row.id,min),r=pay(h,ci),end=h.run('S.min'),key=end<330||end>=1170?row.night:row.day;assert.equal(r.applied,true);assert.equal(r.info.sceneKeys[0],key);
  for(let i=0;i<r.turns.length;i++)assert.equal(h.run(`qaCut({eventId:e.id,phase:'outcome',turns,sceneKeys:info.sceneKeys},${i})`),key);
  const paid=state(h);h.run('G.save();G.load()');const replay=pay(h,ci);assert.equal(replay.applied,false);assert.deepEqual(replay.info.sceneKeys,r.info.sceneKeys);assert.deepEqual(state(h),paid);
 }
});
test('watched: twenty minute cost crosses sunrise and sunset with frozen entry and new result clock',()=>{
 for(const [start,entry,result] of [[320,'story-bridge-watched-v1','story-bridge-watched-day-v1'],[1160,'story-bridge-watched-day-v1','story-bridge-watched-v1']]){
  const h=open('story_bridge_watched',start);assert.equal(h.run('info.sceneKeys[0]'),entry);const r=pay(h,0);assert.equal(h.run('S.min'),start+20);assert.equal(r.info.sceneKeys[0],result);assert.deepEqual(r.info.sceneTime,{day:9,min:start+20});assert.deepEqual(h.json('S.pendingPresentation.reading.history.sceneKeys'),[entry]);
  const paid=state(h);h.run('G.save();G.load()');assert.equal(pay(h,0).applied,false);assert.deepEqual(state(h),paid);
 }
});
for(const row of rows)test(`${row.id}: actual old unpaid save retains historical untimed keys; old paid snapshot never pays twice`,()=>{
 const f=path.join(root,'tests/fixtures/qa-cycle26-37-support/cycle32/story/agent93/attempt01',row.id==='meet_bus'?'normal-unpaid-247-meet_bus.json':'normal-unpaid-111-story_bridge_watched.json');
 const h=setup(),raw=fs.readFileSync(f,'utf8');assert(h.run(`G.load(${JSON.stringify(raw)})`));h.run(`globalThis.e=event(${JSON.stringify(row.id)}),entry=qaEntry(e),info=qaInfo(e,'event',[],entry)`);
 assert.equal(h.run('info.sceneTime'),undefined);const oldKeys=h.json('info.sceneKeys');
 h.run("G.capturePresentationView({eventId:e.id,phase:'event',turns:entry,...info,index:0});G.save();G.load();globalThis.restored={eventId:e.id,phase:'event'};G.restorePresentationView(restored)");
 assert.deepEqual(h.json('restored.sceneKeys'),oldKeys);assert.equal(h.run('restored.sceneTime'),undefined);
 const out=pay(h,0);assert.equal(out.applied,true);h.run("delete S.pendingPresentation.sceneTime;delete S.pendingPresentation.reading.sceneTime;if(S.pendingPresentation.reading.view)delete S.pendingPresentation.reading.view.sceneTime;G.save();G.load()");
 const paidKeys=h.json('S.pendingPresentation.reading.view.sceneKeys'),before=state(h);h.run(`globalThis.restoredPaid={eventId:e.id,phase:'outcome'};G.restorePresentationView(restoredPaid)`);assert.deepEqual(h.json('restoredPaid.sceneKeys'),paidKeys);assert.equal(h.run('restoredPaid.sceneTime'),undefined);const again=pay(h,0);assert.equal(again.applied,false);assert.deepEqual(again.info.sceneKeys,paidKeys);assert.equal(again.info.sceneTime,undefined);assert.deepEqual(state(h),before);
});
test('four registered delivery files and metadata are valid',()=>{
 const h=setup();for(const key of ['story-bridge-watched-day-v1','comp-minji-closed-panel-day-v1','recruit-parkss-tilted-bus-day-v1','recruit-parkss-tilted-bus-night-v1']){
  const file=h.run(`D.scenes[${JSON.stringify(key)}]`),meta=h.json(`D.sceneAssetMeta[${JSON.stringify(key)}]`);assert.match(file,/^assets\/scenes\/.+\.webp$/);assert(fs.existsSync(path.join(root,file)));assert.equal(meta.size,'1024x576');assert.equal(meta.styleId,'caravan-grounded-cinematic-v1');assert.match(meta.status,/runtime-crop-pending/);assert(h.run(`D.sceneDescriptions[${JSON.stringify(key)}].length>0`));
  const data=fs.readFileSync(path.join(root,file));assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');assert(data.length>1000);assert.equal(data.toString('ascii',12,16),'VP8 ');assert.equal(data.readUInt16LE(26)&0x3fff,1024);assert.equal(data.readUInt16LE(28)&0x3fff,576);
 }
});
