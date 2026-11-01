'use strict';
const evidencePath=require('./fixtures/qa-evidence-path.cjs');
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {setup,pay,state,root}=require('./fixtures/qa-cycle55-story/setup.cjs');
const dir=path.join(__dirname,'fixtures/qa-cycle93-leo-rescue-art'),baseline=require('./fixtures/qa-cycle93-leo-rescue-art/baseline.json');
const raw=f=>fs.readFileSync(path.join(dir,f),'utf8'),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const night=m=>m<330||m>=1170,key=m=>`recruit-leo-rescued-${night(m)?'night':'day'}-v1`,durations=[70,100,75];
function load(h,s){assert(h.run(`G.load(${JSON.stringify(typeof s==='string'?s:JSON.stringify(s))})`))}
function view(h){h.run("globalThis.entry=qaEntry(e),info=qaInfo(e,'event',[],entry)")}
function capture(h){h.run("G.capturePresentationView({eventId:e.id,phase:'event',turns:entry,...info,index:0})")}
function fresh(id='rq_leo_task',min=600,saveEntry=true,originalCapture=false){const h=setup();load(h,raw('rq_leo_task-natural-entry.json'));h.run(`S.pendingPresentation=null;S.day=8;S.min=${min};S.food=${originalCapture?30:20};S.water=${originalCapture?30:20};S.fuel=50;S.scrap=40;S.fatigue=10;S.van=90;S.up.winch=true;globalThis.e=event(${JSON.stringify(id)});G.beginPresentation(e)`);view(h);if(saveEntry)capture(h);return h}
function paidReplay(h,ci,reading,before){const save=h.run('G.exportSave()');load(h,save);const got=pay(h,ci,0,false);assert(!got.applied);assert.deepEqual(state(h),before);assert.deepEqual(h.json('S.pendingPresentation.reading'),reading);return got}

test('immutable natural92 and controlled baseline bytes, original sources and task definition',()=>{
 for(const [f,sha]of Object.entries(require('./fixtures/qa-cycle93-leo-rescue-art/SHA256.json')))assert.equal(hash(raw(f)),sha);
 for(const p of baseline.provenance){assert.equal(hash(raw(p.file)),p.sha256);assert.equal(hash(fs.readFileSync(evidencePath(p.source))),p.sha256)}
 const h=fresh();assert.deepEqual(h.json("JSON.parse(JSON.stringify(e,(k,v)=>typeof v==='function'?v.toString():v))"),baseline.definition);
});
for(const o of baseline.outcomes)test(`choice${o.ci}: exact authored reader, resource effects and new result only`,()=>{const h=fresh('rq_leo_task',600,true,true),entry=h.json('S.pendingPresentation.reading.view');assert.deepEqual(h.json('entry'),baseline.entry.turns);assert.deepEqual(h.json('info.sceneKeys'),['recruit-leo-rescue-choice-v1']);const r=pay(h,o.ci);assert(r.applied);assert.equal(r.text,o.result.text);assert.deepEqual(r.turns,o.result.turns);assert.deepEqual(r.chips,o.result.chips);assert.deepEqual(state(h),o.state);assert.deepEqual(r.info.sceneKeys,[key(600+durations[o.ci])]);assert.deepEqual(h.json('S.pendingPresentation.reading.history'),entry)});
for(const ci of [0,1,2])for(const start of [329,330,1169,1170])test(`choice${ci} entry clock${start}: before/after view loads, current result, full cuts, paid history`,()=>{
 const h=fresh('rq_leo_task',start,false);assert.deepEqual(h.json('info.sceneKeys'),['recruit-leo-rescue-choice-v1']);assert.deepEqual(h.json('info.sceneTime'),{day:8,min:start});const original=h.json('info'),beforeEntry=state(h);load(h,h.run('G.exportSave()'));view(h);assert.deepEqual(h.json('info'),original);assert.deepEqual(state(h),beforeEntry);
 capture(h);const entry=h.json('S.pendingPresentation.reading.view');load(h,h.run('G.exportSave()'));view(h);assert.deepEqual(h.json('S.pendingPresentation.reading.view'),entry);const r=pay(h,ci);assert(r.applied);assert.deepEqual(r.info.sceneKeys,[key(start+durations[ci])]);assert.deepEqual(r.info.sceneTime,{day:8,min:start+durations[ci]});assert.deepEqual(h.json('S.pendingPresentation.reading.history'),entry);
 for(let i=0;i<r.turns.length;i++)assert.equal(h.run(`qaCut({eventId:e.id,phase:'outcome',turns,sceneKeys:info.sceneKeys},${i})`),key(start+durations[ci]));const reading=h.json('S.pendingPresentation.reading'),before=state(h),replay=paidReplay(h,ci,reading,before);assert.deepEqual(replay.turns,r.turns);assert.deepEqual(replay.info,r.info);
});
for(const ci of [0,1,2])for(const target of [329,330,1169,1170,1445])test(`choice${ci} actual${durations[ci]}min reaches${target}; paid before first outcome capture`,()=>{
 const start=target-durations[ci],h=fresh('rq_leo_task',start),entry=h.json('S.pendingPresentation.reading.view'),r=pay(h,ci,0,false),day=target>=1440?9:8,min=target%1440;
 assert.equal(h.run('S.day'),day);assert.equal(h.run('S.min'),min);assert.deepEqual(r.info.sceneKeys,[key(min)]);assert.deepEqual(r.info.sceneTime,{day,min});assert.deepEqual(h.json('S.pendingPresentation.reading.history'),entry);
 const reading=h.json('S.pendingPresentation.reading'),receiptChips=h.json('S.pendingPresentation.chips'),before=state(h),again=paidReplay(h,ci,reading,before);assert.deepEqual(again.info,r.info);assert.equal(again.text,r.text);assert.deepEqual(again.chips,receiptChips);assert.deepEqual(again.chips.map(c=>c.t),r.chips.map(c=>c.t));
});
test('natural92 historical entry remains exact old words/plate without inferred new clock',()=>{const h=setup(),saved=JSON.parse(raw('rq_leo_task-natural-entry.json'));load(h,saved);h.run("globalThis.e=event('rq_leo_task')");view(h);assert.deepEqual(h.json('S.pendingPresentation.reading'),saved.pendingPresentation.reading);assert.deepEqual(h.json('info.sceneKeys'),saved.pendingPresentation.reading.view.sceneKeys);assert.equal(h.run('info.sceneTime||null'),null);assert.deepEqual(h.json('entry'),saved.pendingPresentation.reading.view.turns)});
const oldPaid=[...baseline.outcomes.map(o=>({file:o.file,ci:o.ci,kind:'controlled'})),{file:'rq_leo_task-natural-paid.json',ci:2,kind:'natural92'}];
for(const o of oldPaid)for(const mode of ['reader','view-only','text-only'])test(`${o.kind} ${o.file} ${mode}: old words/receipt and no repayments`,()=>{
 const saved=JSON.parse(raw(o.file)),original=saved.pendingPresentation,view=original.reading.view,history=original.reading.history;
 if(mode==='view-only'){original.view=view;delete original.reading}if(mode==='text-only'){delete original.view;delete original.reading;delete original.authoredView}
 const h=setup();load(h,saved);h.run("globalThis.e=event('rq_leo_task')");// Inspect owner before outcome rendering.
 const before=state(h),receipt=h.json('S.pendingPresentation');h.run(`globalThis.r=G.resolvePresentedChoice(e,e.choices[${o.ci}]),turns=qaResult(e,e.choices[${o.ci}],r.out),info=qaInfo(e,'outcome',[D.eventChoiceScenes[e.id][${o.ci}]],turns)`);
 assert(h.run('r.ok&&!r.applied'));assert.equal(h.run('r.out.text'),original.text);assert.deepEqual(h.json('r.chips'),original.chips);assert.deepEqual(state(h),before);assert.deepEqual(h.json('S.pendingPresentation'),receipt);
 if(mode!=='text-only'){assert.deepEqual(h.json('info.sceneKeys'),view.sceneKeys);assert.deepEqual(h.json('turns'),view.turns);if(mode==='reader')assert.deepEqual(h.json('S.pendingPresentation.reading.history'),history)}else{assert(h.run('r.out.frozenTextOnly'));assert.deepEqual(h.json('info.sceneKeys'),[o.ci===1?'recruit-leo-task-wade':'recruit-leo-follow']);}
 load(h,h.run('G.exportSave()'));assert.deepEqual(state(h),before);assert.deepEqual(h.json('S.pendingPresentation'),receipt);
});
for(const row of baseline.neighbors)for(const ci of row.outcomes.map(o=>o.ci))test(`${row.id} choice${ci}: unrelated old base users remain unchanged`,()=>{const h=fresh(row.id,600,true,true),old=row.outcomes[ci];assert.deepEqual(h.json("JSON.parse(JSON.stringify(e,(k,v)=>typeof v==='function'?v.toString():v))"),row.definition);assert.deepEqual(h.json('info'),row.entry);const r=pay(h,ci);assert.deepEqual(r,old.result);assert.deepEqual(state(h),old.state);assert(!r.info.sceneKeys.some(k=>k.startsWith('recruit-leo-rescued-')))});
for(const period of ['day','night'])test(`registered ${period} recovery delivery geometry`,async()=>{const k=`recruit-leo-rescued-${period}-v1`,h=setup();assert.equal(h.run(`D.scenes['${k}']`),'assets/scenes/'+k+'.webp');const m=await require('sharp')(path.join(root,'assets/scenes/'+k+'.webp')).metadata();assert.deepEqual([m.width,m.height,m.format],[1024,576,'webp']);assert.match(h.run(`D.sceneAssetMeta['${k}'].status`),/runtime.crop.pending/i)});
