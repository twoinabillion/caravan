'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {setup,fresh,pay,state,root}=require('./fixtures/qa-cycle95-crisis-cache/setup.cjs');
const dir=path.join(__dirname,'fixtures/qa-cycle95-crisis-cache'),baseline=require('./fixtures/qa-cycle95-crisis-cache/baseline.json');
const raw=f=>fs.readFileSync(path.join(dir,f),'utf8'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const period=m=>m<330||m>=1170?'night':'day',cab=m=>`event-crisis-stationary-cab-${period(m)}-v1`,forage=m=>`event-crisis-forage-field-edge-${period(m)}-v1`,cache=m=>`story-jaeyi-container-warehouse-${period(m)}-v1`,driving=m=>period(m)==='night'?'event-crisis-exhaustion-night-v1':'event-crisis-exhaustion';
const entryKey=(id,m)=>id==='loc_jaeyi_cache'?cache(m):id==='crisis_hungry'?cab(m):driving(m);
const resultKey=(id,ci,m)=>id==='loc_jaeyi_cache'?cache(m):id==='crisis_hungry'?ci===0?forage(m):cab(m):id==='crisis_drowsy'&&ci!==0?driving(m):cab(m);
const textTurns=turns=>turns.map(({scene,...t})=>t);
function load(h,value){assert(h.run(`G.load(${JSON.stringify(typeof value==='string'?value:JSON.stringify(value))})`))}
function render(h){h.run("globalThis.entry=qaEntry(e),info=qaInfo(e,'event',[],entry)")}
function cuts(h,turns,key){for(let i=0;i<turns.length;i++)assert.equal(h.run(`qaCut({eventId:e.id,phase:'outcome',turns,sceneKeys:info.sceneKeys},${i})`),key)}
test('immutable pre95 controlled and natural94 files, source definitions and provenance',()=>{
 for(const [f,sha]of Object.entries(require('./fixtures/qa-cycle95-crisis-cache/SHA256.json')))assert.equal(hash(raw(f)),sha);
 for(const p of baseline.provenance){assert.equal(hash(raw(p.file)),p.sha256);assert.equal(hash(fs.readFileSync(path.join(root,p.source))),p.sha256)}
 for(const row of baseline.events){const h=fresh(row.id);assert.deepEqual(h.json("JSON.parse(JSON.stringify(e,(k,v)=>typeof v==='function'?v.toString():v))"),row.definition)}
});
for(const row of baseline.events){
 for(const min of [329.9,330,1169.9,1170])test(`${row.id} entry ${min}: first render/load/history/current revision`,()=>{
  const h=fresh(row.id,min,false),before=state(h);assert.deepEqual(h.json('info.sceneKeys'),[entryKey(row.id,min)]);assert.equal(h.run('S.pendingPresentation.sceneRevision'),'qa95');assert.deepEqual(h.json('info.sceneTime'),{day:9,min});
  load(h,h.run('G.exportSave()'));render(h);assert.deepEqual(state(h),before);assert.deepEqual(h.json('info.sceneKeys'),[entryKey(row.id,min)]);
  h.run("G.capturePresentationView({eventId:e.id,phase:'event',turns:entry,...info,index:0})");const saved=h.json('S.pendingPresentation.reading');load(h,h.run('G.exportSave()'));render(h);assert.deepEqual(h.json('S.pendingPresentation.reading'),saved);assert.deepEqual(h.json('info.sceneKeys'),[entryKey(row.id,min)]);
 });
 for(const old of row.outcomes){
  test(`${row.id} ${old.ci}/${old.oi}: words/effects/receipts remain exact`,()=>{const h=fresh(row.id),r=pay(h,old.ci,old.oi);assert(r.applied);assert.equal(r.text,old.result.text);assert.deepEqual(textTurns(r.turns),textTurns(old.result.turns));assert.deepEqual(r.chips,old.result.chips);assert.deepEqual(state(h),old.state);cuts(h,r.turns,resultKey(row.id,old.ci,old.state.min));});
  for(const end of [329.9,330,1169.9,1170,1445])test(`${row.id} ${old.ci}/${old.oi}: result boundary${end}, uncaptured paid reload and all cuts`,()=>{
   const duration=row.definition.choices[old.ci].out[old.oi].fx?.time||0,start=((end-duration)%1440+1440)%1440,h=fresh(row.id,start),entry=h.json('S.pendingPresentation.reading.view'),r=pay(h,old.ci,old.oi,false),actual=h.run('S.min');
   assert(r.applied);assert(Math.abs(actual-end%1440)<1e-6);assert.deepEqual(r.info.sceneTime,h.json('({day:S.day,min:S.min})'));cuts(h,r.turns,resultKey(row.id,old.ci,actual));assert.deepEqual(h.json('S.pendingPresentation.reading.history'),entry);
   const before=state(h),receipt=h.json('S.pendingPresentation');load(h,h.run('G.exportSave()'));const replay=pay(h,old.ci,old.oi,false);assert(!replay.applied);assert.equal(replay.text,r.text);assert.deepEqual(replay.turns,r.turns);assert.deepEqual(replay.info,r.info);assert.deepEqual(state(h),before);assert.deepEqual(replay.chips,h.json('S.pendingPresentation.chips'));assert.deepEqual(replay.chips.map(c=>c.t),r.chips.map(c=>c.t));assert.deepEqual(h.json('S.pendingPresentation'),receipt);
   h.run("G.capturePresentationView({eventId:e.id,phase:'outcome',turns,...info,index:Math.max(0,turns.length-1)})");const reading=h.json('S.pendingPresentation.reading');load(h,h.run('G.exportSave()'));const savedReplay=pay(h,old.ci,old.oi,false);assert(!savedReplay.applied);assert.deepEqual(h.json('S.pendingPresentation.reading'),reading);assert.deepEqual(savedReplay.info,r.info);cuts(h,savedReplay.turns,resultKey(row.id,old.ci,actual));
  });
 }
 test(`${row.id}: natural94 entry keeps exact saved old picture and words`,()=>{const saved=JSON.parse(raw(row.id+'-natural-entry.json')),h=setup();load(h,saved);h.run(`globalThis.e=event(${JSON.stringify(row.id)})`);render(h);assert.deepEqual(h.json('entry'),saved.pendingPresentation.reading.view.turns);assert.deepEqual(h.json('info.sceneKeys'),saved.pendingPresentation.reading.view.sceneKeys);assert.equal(h.run('S.pendingPresentation.sceneRevision||null'),null)});
 const paidFiles=[...row.outcomes.map(o=>o.file),row.id+'-natural-paid.json'];
 for(const file of paidFiles)for(const mode of ['reader','view-only','text-only'])test(`${file} ${mode}: preserve historical prose/receipt, no new markers or repayment`,()=>{
  const saved=JSON.parse(raw(file)),old=saved.pendingPresentation,view=old.reading?.view||old.view;
  if(mode==='view-only'){old.view=view;delete old.reading}if(mode==='text-only'){delete old.reading;delete old.view;delete old.authoredView}
  const h=setup();load(h,saved);h.run(`globalThis.e=event(${JSON.stringify(row.id)});globalThis.entry=qaEntry(e),info=qaInfo(e,'event',[],entry)`);const before=state(h),receipt=h.json('S.pendingPresentation'),r=pay(h,old.choiceIndex,old.outcomeIndex,false);assert(!r.applied);assert.equal(r.text,old.text);assert.deepEqual(r.chips,old.chips);assert.deepEqual(state(h),before);assert.deepEqual(h.json('S.pendingPresentation'),receipt);
  if(mode!=='text-only'){assert.deepEqual(r.info.sceneKeys,view.sceneKeys);assert.deepEqual(r.turns,view.turns)}else{assert(r.turns.every(t=>!t.scene));assert(!r.info.sceneKeys.some(k=>/stationary-cab|forage-field-edge|container-warehouse/.test(k)));}
  load(h,h.run('G.exportSave()'));assert.deepEqual(state(h),before);assert.deepEqual(h.json('S.pendingPresentation'),receipt);
 });
}
for(const stem of ['event-crisis-stationary-cab','event-crisis-forage-field-edge','story-jaeyi-container-warehouse'])for(const p of ['day','night'])test(`${stem}-${p}: source delivery geometry and runtime coverage label`,async()=>{const k=`${stem}-${p}-v1`,h=setup();assert.equal(h.run(`D.scenes[${JSON.stringify(k)}]`),`assets/scenes/${k}.webp`);const meta=await require('sharp')(path.join(root,'assets/scenes/'+k+'.webp')).metadata();assert.deepEqual([meta.width,meta.height,meta.format],[1024,576,'webp']);assert.match(h.run(`D.sceneAssetMeta[${JSON.stringify(k)}].status`),/runtime.crop.pending/i)});
