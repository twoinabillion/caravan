'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {setup,fresh,pay,state,root}=require('./fixtures/qa-cycle99-bag-postman/setup.cjs');
const dir=path.join(__dirname,'fixtures/qa-cycle99-bag-postman'),baseline=require('./fixtures/qa-cycle99-bag-postman/baseline.json');
const raw=f=>fs.readFileSync(path.join(dir,f),'utf8'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const night=m=>m<330||m>=1170,oldKey=id=>id==='meet_postman'?'event-postman-solo-v2':'parkss-clinic',key=(id,m)=>id==='parkss_bag'?'parkss-bag-name-detail-v1':night(m)?'event-postman-solo-night-v1':oldKey(id);
const oldLine='그날 왕진을 나갈 때도 「김수진」 쪽이 안으로 향해 있었다.',newLine='「김수진」 이름표는 가방 안쪽에 그대로 남아 있었다.';
const fixed=v=>JSON.parse(JSON.stringify(v).replaceAll(oldLine,newLine));
const words=t=>t.map(({scene,...r})=>r);
function load(h,v){assert(h.run(`G.load(${JSON.stringify(typeof v==='string'?v:JSON.stringify(v))})`))}
function render(h){h.run("globalThis.entry=qaEntry(e),info=qaInfo(e,'event',[],entry)")}
function cuts(h,turns,k){for(let i=0;i<turns.length;i++)assert.equal(h.run(`qaCut({eventId:e.id,phase:'outcome',turns,sceneKeys:info.sceneKeys},${i})`),k)}
test('immutable pre99 definitions, 7 controlled outcomes and actual98 raw provenance',()=>{
 for(const [f,s]of Object.entries(require('./fixtures/qa-cycle99-bag-postman/SHA256.json')))assert.equal(hash(raw(f)),s);
 for(const p of baseline.provenance){assert.equal(hash(raw(p.file)),p.sha256);assert.equal(hash(fs.readFileSync(path.join(root,p.source))),p.sha256)}
 for(const row of baseline.events){const h=fresh(row.id,600,true,row.met);assert.deepEqual(h.json("JSON.parse(JSON.stringify(e,(k,v)=>typeof v==='function'?v.toString():v))"),fixed(row.definition))}
});
for(const row of baseline.events){
 for(const min of [0,329.9,330,1169.9,1170,1296])test(`${row.name} entry ${min}: before/after capture reload, qa99 and exact roles`,()=>{
  const h=fresh(row.id,min,false,row.met),before=state(h);assert.deepEqual(h.json('info.sceneKeys'),[key(row.id,min)]);assert.deepEqual(h.json('info.sceneTime'),{day:9,min});assert.equal(h.run('S.pendingPresentation.sceneRevision'),'qa99');assert.deepEqual(words(h.json('entry')),words(row.entry));
  load(h,h.run('G.exportSave()'));render(h);assert.deepEqual(state(h),before);assert.deepEqual(h.json('info.sceneKeys'),[key(row.id,min)]);
  h.run("G.capturePresentationView({eventId:e.id,phase:'event',turns:entry,...info,index:0})");const reading=h.json('S.pendingPresentation.reading');load(h,h.run('G.exportSave()'));render(h);assert.deepEqual(h.json('S.pendingPresentation.reading'),reading);assert.deepEqual(h.json('info.sceneKeys'),[key(row.id,min)]);
 });
 for(const old of row.outcomes){
  test(`${row.name} ${old.ci}/${old.oi}: exact words, body fx, notes, role routes and resources`,()=>{const h=fresh(row.id,600,true,row.met),r=pay(h,old.ci,old.oi);assert(r.applied);assert.equal(r.text,fixed(old.result.text));assert.deepEqual(words(r.turns),words(fixed(old.result.turns)));assert.deepEqual(r.chips,old.result.chips);assert.deepEqual(state(h),old.state);});
  for(const min of [329.9,330,1169.9,1170,1296])test(`${row.name} ${old.ci}/${old.oi}: payment before first capture reload, boundary ${min}`,()=>{
   const h=fresh(row.id,min,true,row.met),history=h.json('S.pendingPresentation.reading.view'),r=pay(h,old.ci,old.oi,false);assert(r.applied);assert.equal(h.run('S.pendingPresentation.sceneRevision'),'qa99');cuts(h,r.turns,key(row.id,h.run('S.min')));assert.deepEqual(h.json('S.pendingPresentation.reading.history'),history);
   const before=state(h),receipt=h.json('S.pendingPresentation');load(h,h.run('G.exportSave()'));const replay=pay(h,old.ci,old.oi,false);assert(!replay.applied);assert.equal(replay.text,r.text);assert.deepEqual(replay.turns,r.turns);assert.deepEqual(replay.info,r.info);assert.deepEqual(state(h),before);assert.deepEqual(replay.chips,h.json('S.pendingPresentation.chips'));assert.deepEqual(replay.chips.map(c=>c.t),r.chips.map(c=>c.t));assert.deepEqual(h.json('S.pendingPresentation'),receipt);
   h.run("G.capturePresentationView({eventId:e.id,phase:'outcome',turns,...info,index:Math.max(0,turns.length-1)})");const reading=h.json('S.pendingPresentation.reading');load(h,h.run('G.exportSave()'));const captured=pay(h,old.ci,old.oi,false);assert(!captured.applied);assert.deepEqual(h.json('S.pendingPresentation.reading'),reading);assert.deepEqual(captured.info,r.info);cuts(h,captured.turns,key(row.id,h.run('S.min')));
  });
 }
 const entries=[row.name+'-entry.json',...baseline.provenance.filter(p=>p.file===`actual98-${row.id}-entry.json`).map(p=>p.file)];
 for(const file of entries)for(const clocked of [false,true])test(`${file} old unanswered clocked=${clocked}: old view then new payment opts in`,()=>{const saved=JSON.parse(raw(file));if(clocked)saved.pendingPresentation.sceneTime={day:saved.day,min:saved.min};const h=setup();load(h,saved);h.run(`globalThis.e=event(${JSON.stringify(row.id)})`);render(h);assert.deepEqual(h.json('info.sceneKeys'),[oldKey(row.id)]);assert.equal(h.run('S.pendingPresentation.sceneRevision||null'),null);assert.deepEqual(words(h.json('entry')),words(saved.pendingPresentation.reading.view.turns));const r=pay(h,0,0,false);assert(r.applied);assert.equal(h.run('S.pendingPresentation.sceneRevision'),'qa99');assert.deepEqual(r.info.sceneKeys,[key(row.id,h.run('S.min'))]);});
 const paid=[...row.outcomes.map(o=>o.file),...baseline.provenance.filter(p=>p.file===`actual98-${row.id}-result.json`).map(p=>p.file)];
 for(const file of paid)for(const mode of ['reader','view-only','text-only','clocked-text-only'])test(`${file} ${mode}: historical metadata/words/chips/no repay`,()=>{
  const saved=JSON.parse(raw(file)),old=saved.pendingPresentation,view=old.reading?.view||old.view;if(mode==='view-only'){old.view=view;delete old.reading;}if(mode.includes('text-only')){delete old.reading;delete old.view;delete old.authoredView;}if(mode==='clocked-text-only')old.sceneTime={day:saved.day,min:saved.min};
  const h=setup();load(h,saved);h.run(`globalThis.e=event(${JSON.stringify(row.id)})`);render(h);const before=state(h),receipt=h.json('S.pendingPresentation'),r=pay(h,old.choiceIndex,old.outcomeIndex,false);assert(!r.applied);assert.equal(r.text,old.text);assert.deepEqual(r.chips,old.chips);assert.deepEqual(state(h),before);assert.deepEqual(h.json('S.pendingPresentation'),receipt);assert.deepEqual(r.info.sceneKeys,[oldKey(row.id)]);if(!mode.includes('text-only'))assert.deepEqual(r.turns,view.turns);load(h,h.run('G.exportSave()'));assert.deepEqual(state(h),before);assert.deepEqual(h.json('S.pendingPresentation'),receipt);
 });
}

for(const k of ['parkss-bag-name-detail-v1','event-postman-solo-night-v1'])test(`${k} delivery1024/576 and pending runtime crop`,async()=>{const h=setup();assert.equal(h.run(`D.scenes[${JSON.stringify(k)}]`),`assets/scenes/${k}.webp`);const m=await require('sharp')(path.join(root,'assets/scenes/'+k+'.webp')).metadata();assert.deepEqual([m.width,m.height,m.format],[1024,576,'webp']);assert.match(h.run(`D.sceneAssetMeta[${JSON.stringify(k)}].status`),/runtime.crop.pending/i)});
for(const row of baseline.events)for(const old of row.outcomes)test(`${row.name} ${old.ci}/${old.oi}: payment interrupted before parser`,()=>{const h=fresh(row.id,1296,true,row.met);h.run(`globalThis.c=e.choices[${old.ci}];G.pickOutcome=()=>c.out[${old.oi}];globalThis.payment=G.resolvePresentedChoice(e,c);`);assert(h.run('payment.applied'));assert(h.run('Array.isArray(S.pendingPresentation.authoredView?.turns)&&S.pendingPresentation.authoredView.turns.length>0'));const saved=h.run('G.exportSave()'),before=state(h),receipt=h.json('S.pendingPresentation'),known=h.run('!!S.pendingPresentation.knownSpeaker');load(h,saved);assert.equal(h.run('!!S.pendingPresentation.knownSpeaker'),known);const r=pay(h,old.ci,old.oi,false);assert.equal(h.run('!!S.pendingPresentation.knownSpeaker'),known);assert(!r.applied);assert.equal(r.text,fixed(old.result.text));assert.deepEqual(words(r.turns),words(fixed(old.result.turns)));assert.deepEqual(r.info.sceneKeys,[key(row.id,h.run('S.min'))]);assert.deepEqual(state(h),before);assert.deepEqual(h.json('S.pendingPresentation'),receipt);});
