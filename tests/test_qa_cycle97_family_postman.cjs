'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {setup,fresh,pay,state,root}=require('./fixtures/qa-cycle97-family-postman/setup.cjs');
const dir=path.join(__dirname,'fixtures/qa-cycle97-family-postman'),baseline=require('./fixtures/qa-cycle97-family-postman/baseline.json');
const raw=f=>fs.readFileSync(path.join(dir,f),'utf8'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const night=m=>m<330||m>=1170,oldKey=id=>id==='postman_again'?'postman-again-bicycle-v1':'family-verification-key',key=(id,m)=>night(m)?id==='postman_again'?'postman-again-bicycle-night-v1':'family-verification-key-mounted-night-v1':oldKey(id);
const words=t=>t.map(({scene,...r})=>r);
function load(h,v){assert(h.run(`G.load(${JSON.stringify(typeof v==='string'?v:JSON.stringify(v))})`))}
function render(h){h.run("globalThis.entry=qaEntry(e),info=qaInfo(e,'event',[],entry)")}
function cuts(h,turns,k){for(let i=0;i<turns.length;i++)assert.equal(h.run(`qaCut({eventId:e.id,phase:'outcome',turns,sceneKeys:info.sceneKeys},${i})`),k)}
test('immutable pre97 definitions, 6 outcomes and actual96 raw provenance',()=>{
 for(const [f,s]of Object.entries(require('./fixtures/qa-cycle97-family-postman/SHA256.json')))assert.equal(hash(raw(f)),s);
 for(const p of baseline.provenance){assert.equal(hash(raw(p.file)),p.sha256);assert.equal(hash(fs.readFileSync(path.join(root,p.source))),p.sha256)}
 for(const row of baseline.events){const h=fresh(row.id);assert.deepEqual(h.json("JSON.parse(JSON.stringify(e,(k,v)=>typeof v==='function'?v.toString():v))"),row.definition)}
});
for(const row of baseline.events){
 for(const min of [0,329.9,330,1169.9,1170,1296])test(`${row.id} entry ${min}: before/after capture reload, qa97 and exact roles`,()=>{
  const h=fresh(row.id,min,false),before=state(h);assert.deepEqual(h.json('info.sceneKeys'),[key(row.id,min)]);assert.deepEqual(h.json('info.sceneTime'),{day:9,min});assert.equal(h.run('S.pendingPresentation.sceneRevision'),'qa97');assert.deepEqual(words(h.json('entry')),words(row.entry));
  load(h,h.run('G.exportSave()'));render(h);assert.deepEqual(state(h),before);assert.deepEqual(h.json('info.sceneKeys'),[key(row.id,min)]);
  h.run("G.capturePresentationView({eventId:e.id,phase:'event',turns:entry,...info,index:0})");const reading=h.json('S.pendingPresentation.reading');load(h,h.run('G.exportSave()'));render(h);assert.deepEqual(h.json('S.pendingPresentation.reading'),reading);assert.deepEqual(h.json('info.sceneKeys'),[key(row.id,min)]);
 });
 for(const old of row.outcomes){
  test(`${row.id} ${old.ci}/${old.oi}: exact words, body fx, notes, role routes and resources`,()=>{const h=fresh(row.id),r=pay(h,old.ci,old.oi);assert(r.applied);assert.equal(r.text,old.result.text);assert.deepEqual(words(r.turns),words(old.result.turns));assert.deepEqual(r.chips,old.result.chips);assert.deepEqual(state(h),old.state);});
  for(const min of [329.9,330,1169.9,1170,1296])test(`${row.id} ${old.ci}/${old.oi}: payment before first capture reload, boundary ${min}`,()=>{
   const h=fresh(row.id,min),history=h.json('S.pendingPresentation.reading.view'),r=pay(h,old.ci,old.oi,false);assert(r.applied);assert.equal(h.run('S.pendingPresentation.sceneRevision'),'qa97');cuts(h,r.turns,key(row.id,h.run('S.min')));assert.deepEqual(h.json('S.pendingPresentation.reading.history'),history);
   const before=state(h),receipt=h.json('S.pendingPresentation');load(h,h.run('G.exportSave()'));const replay=pay(h,old.ci,old.oi,false);assert(!replay.applied);assert.equal(replay.text,r.text);assert.deepEqual(replay.turns,r.turns);assert.deepEqual(replay.info,r.info);assert.deepEqual(state(h),before);assert.deepEqual(replay.chips,h.json('S.pendingPresentation.chips'));assert.deepEqual(replay.chips.map(c=>c.t),r.chips.map(c=>c.t));assert.deepEqual(h.json('S.pendingPresentation'),receipt);
   h.run("G.capturePresentationView({eventId:e.id,phase:'outcome',turns,...info,index:Math.max(0,turns.length-1)})");const reading=h.json('S.pendingPresentation.reading');load(h,h.run('G.exportSave()'));const captured=pay(h,old.ci,old.oi,false);assert(!captured.applied);assert.deepEqual(h.json('S.pendingPresentation.reading'),reading);assert.deepEqual(captured.info,r.info);cuts(h,captured.turns,key(row.id,h.run('S.min')));
  });
 }
 const entries=[row.id+'-entry.json',...baseline.provenance.filter(p=>p.file===`actual96-${row.id}-entry.json`).map(p=>p.file)];
 for(const file of entries)for(const clocked of [false,true])test(`${file} old unanswered clocked=${clocked}: old view then new payment opts in`,()=>{const saved=JSON.parse(raw(file));if(clocked)saved.pendingPresentation.sceneTime={day:saved.day,min:saved.min};const h=setup();load(h,saved);h.run(`globalThis.e=event(${JSON.stringify(row.id)})`);render(h);assert.deepEqual(h.json('info.sceneKeys'),[oldKey(row.id)]);assert.equal(h.run('S.pendingPresentation.sceneRevision||null'),null);assert.deepEqual(words(h.json('entry')),words(saved.pendingPresentation.reading.view.turns));const r=pay(h,0,0,false);assert(r.applied);assert.equal(h.run('S.pendingPresentation.sceneRevision'),'qa97');assert.deepEqual(r.info.sceneKeys,[key(row.id,h.run('S.min'))]);});
 const paid=[...row.outcomes.map(o=>o.file),...baseline.provenance.filter(p=>p.file===`actual96-${row.id}-result.json`).map(p=>p.file)];
 for(const file of paid)for(const mode of ['reader','view-only','text-only','clocked-text-only'])test(`${file} ${mode}: historical metadata/words/chips/no repay`,()=>{
  const saved=JSON.parse(raw(file)),old=saved.pendingPresentation,view=old.reading?.view||old.view;if(mode==='view-only'){old.view=view;delete old.reading;}if(mode.includes('text-only')){delete old.reading;delete old.view;delete old.authoredView;}if(mode==='clocked-text-only')old.sceneTime={day:saved.day,min:saved.min};
  const h=setup();load(h,saved);h.run(`globalThis.e=event(${JSON.stringify(row.id)})`);render(h);const before=state(h),receipt=h.json('S.pendingPresentation'),r=pay(h,old.choiceIndex,old.outcomeIndex,false);assert(!r.applied);assert.equal(r.text,old.text);assert.deepEqual(r.chips,old.chips);assert.deepEqual(state(h),before);assert.deepEqual(h.json('S.pendingPresentation'),receipt);assert.deepEqual(r.info.sceneKeys,[oldKey(row.id)]);if(!mode.includes('text-only'))assert.deepEqual(r.turns,view.turns);load(h,h.run('G.exportSave()'));assert.deepEqual(state(h),before);assert.deepEqual(h.json('S.pendingPresentation'),receipt);
 });
}
test('historical audio roles remain father/mother while artwork follows current vehicle clock',()=>{for(const id of ['story_family_key','main_recovery_story_family_key']){const h=fresh(id,1296),ts=h.json('entry');assert.deepEqual(ts.filter(t=>t.kind==='dialogue').map(t=>t.who),['father','mother','father','mother','father','mother']);assert.equal(ts.filter(t=>t.kind==='record'&&t.who==='father').length,2);assert.deepEqual(h.json('info.sceneKeys'),['family-verification-key-mounted-night-v1']);if(id.startsWith('main_recovery'))assert.match(ts[1].text,/교환소 앞 달구지의 계기판/);}});
for(const k of ['family-verification-key-mounted-night-v1','postman-again-bicycle-night-v1'])test(`${k} explicit delivery, geometry and unverified runtime crop label`,async()=>{const h=setup();assert.equal(h.run(`D.scenes[${JSON.stringify(k)}]`),`assets/scenes/${k}.webp`);const m=await require('sharp')(path.join(root,'assets/scenes/'+k+'.webp')).metadata();assert.deepEqual([m.width,m.height,m.format],[1024,576,'webp']);assert.match(h.run(`D.sceneAssetMeta[${JSON.stringify(k)}].status`),/runtime.crop.pending/i)});
for(const row of baseline.events)for(const old of row.outcomes)test(`${row.id} ${old.ci}/${old.oi}: interrupt immediately after payment before any result parser/selector`,()=>{
 const h=fresh(row.id,1296);h.run(`globalThis.c=e.choices[${old.ci}];G.pickOutcome=()=>c.out[${old.oi}];globalThis.payment=G.resolvePresentedChoice(e,c);`);assert(h.run('payment.applied'));assert(h.run('Array.isArray(S.pendingPresentation.authoredView?.turns)&&S.pendingPresentation.authoredView.turns.length>0'));
 const saved=h.run('G.exportSave()'),before=state(h),receipt=h.json('S.pendingPresentation');load(h,saved);const replay=pay(h,old.ci,old.oi,false);assert(!replay.applied);assert.equal(replay.text,old.result.text);assert.deepEqual(words(replay.turns),words(old.result.turns));assert.deepEqual(replay.info.sceneKeys,[key(row.id,1296)]);assert.deepEqual(h.json('S.pendingPresentation'),receipt);assert.deepEqual(state(h),before);
});
