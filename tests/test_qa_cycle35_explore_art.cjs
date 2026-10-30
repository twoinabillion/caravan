'use strict';
process.env.QA_TIME_PRODUCTION='1';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup,open,pay,state,root}=require('./fixtures/qa-cycle26-37-support/cycle31/story/time-scene/setup.cjs');
const fixtures=path.join(root,'tests/fixtures/qa-cycle26-37-support/cycle35/explorer/fixtures');
const rows=[{id:'ev_crashed_helicopter',day:'explore-fire-rescue-helicopter-day-v1',night:'explore-fire-rescue-helicopter-night-v1'}, {id:'exp_jjimjil',day:'explore-jjimjil-cold-v1',night:'explore-jjimjil-cold-v1'}];
for(const row of rows)test(`${row.id} actual event presentation at all day/night boundaries, all reader turns and outcomes`,()=>{
 for(const min of [329,330,1169,1170]){
  const h=open(row.id,min),key=min<330||min>=1170?row.night:row.day;assert.deepEqual(h.json('info.sceneKeys'),[key]);
  for(let i=0;i<h.run('entry.length');i++)assert.equal(h.run(`qaCut({eventId:e.id,phase:'event',turns:entry,sceneKeys:info.sceneKeys},${i})`),key);
  if(row.id==='ev_crashed_helicopter')assert.deepEqual(h.json('info.sceneTime'),{day:9,min});
  const definition=h.json("JSON.parse(JSON.stringify(e,(k,v)=>typeof v==='function'?v.toString():v))");
  assert.deepEqual(definition,JSON.parse(fs.readFileSync(path.join(fixtures,row.id+'-definition.json'))));
  for(let ci=0;ci<definition.choices.length;ci++)for(let oi=0;oi<definition.choices[ci].out.length;oi++){
   const x=open(row.id,min);if(row.id==='ev_crashed_helicopter')x.run("S.party=['minji'];S.comps.minji.bond=10");const result=pay(x,ci,oi),end=x.run('S.min'),resultKey=end<330||end>=1170?row.night:row.day;assert.equal(result.applied,true);assert.deepEqual(result.info.sceneKeys,[resultKey]);
   for(let i=0;i<result.turns.length;i++)assert.equal(x.run(`qaCut({eventId:e.id,phase:'outcome',turns,sceneKeys:info.sceneKeys},${i})`),resultKey);
   const before=state(x);x.run('G.save();G.load()');const replay=pay(x,ci,oi);assert.equal(replay.applied,false);assert.deepEqual(replay.info.sceneKeys,[resultKey]);assert.deepEqual(state(x),before);
  }
 }
});
for(const row of rows)test(`${row.id} prechange paid and unpaid saved views remain frozen and never repay`,()=>{
 for(const phase of ['entry','paid'])for(const textOnly of [false,true]){
  const raw=JSON.parse(fs.readFileSync(path.join(fixtures,row.id+'-'+phase+'.json')));if(textOnly){delete raw.pendingPresentation.reading;delete raw.pendingPresentation.view;delete raw.pendingPresentation.authoredView;}
  const h=setup();assert(h.run(`G.load(${JSON.stringify(JSON.stringify(raw))})`));h.run(`globalThis.e=event(${JSON.stringify(row.id)}),entry=qaEntry(e),info=qaInfo(e,${JSON.stringify(phase==='paid'?'outcome':'event')},[],entry)`);
  const pre=state(h);if(!textOnly){assert.deepEqual(h.json('info.sceneKeys'),raw.pendingPresentation.reading.view.sceneKeys);assert.equal(h.run('info.sceneTime'),undefined);}
  if(phase==='paid'){h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');assert.equal(h.run('r.applied'),false);assert.deepEqual(state(h),pre);assert.equal(h.run('S.pendingPresentation.text'),raw.pendingPresentation.text);}
  if(row.id==='ev_crashed_helicopter'&&textOnly){assert.deepEqual(h.json('info.sceneKeys'),['event-explore-transit']);assert.equal(h.run('info.sceneTime'),undefined);}
 }
});
for(const row of rows)test(`${row.id} every outcome preserves frozen prechange prose, roles, effects and state`,()=>{
 const old=JSON.parse(fs.readFileSync(path.join(fixtures,row.id+'-outcomes.json')));for(const item of old){const h=open(row.id,700);h.run("S.party=['minji'];S.comps.minji.bond=10");const r=pay(h,item.ci,item.oi,false);assert.equal(r.text,item.text);assert.deepEqual(r.turns,item.turns);assert.deepEqual(r.chips,item.chips);assert.deepEqual(state(h),item.state);}
});
test('three supplied scene assets and honest review metadata',()=>{const h=setup();for(const key of ['explore-fire-rescue-helicopter-day-v1','explore-fire-rescue-helicopter-night-v1','explore-jjimjil-cold-v1']){
 const file=h.run(`D.scenes[${JSON.stringify(key)}]`),meta=h.json(`D.sceneAssetMeta[${JSON.stringify(key)}]`);assert.match(file,/^assets\/scenes\/.*\.webp$/);assert.equal(meta.size,'1024x576');assert.equal(meta.styleId,'caravan-grounded-cinematic-v1');assert.match(meta.status,/runtime-crop-pending/);assert.match(meta.provenance,/cycle35\/explorer/);const b=fs.readFileSync(path.join(root,file));assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,16),'WEBPVP8 ');assert.equal(b.readUInt16LE(26)&0x3fff,1024);assert.equal(b.readUInt16LE(28)&0x3fff,576);
}});
