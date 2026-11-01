'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),{setup,pay,state}=require(path.join(root,'tests/fixtures/qa-cycle103-camp-memory/setup.cjs')),dir=path.join(__dirname,'fixtures/qa-cycle107-dogs'),b=require('./fixtures/qa-cycle107-dogs/baseline.json');
test('pre107 controlled eight results and hashes immutable, not fresh games',()=>{assert.equal(b.events.length,8);for(const[f,sha]of Object.entries(require('./fixtures/qa-cycle107-dogs/SHA256.json')))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,f))).digest('hex'),sha);});
for(const row of b.events)for(const mode of ['reader','view-only','text-only','clocked-text-only'])test(`${row.file}/${mode}: old paid words keys receipt state preserved`,()=>{
 const saved=JSON.parse(fs.readFileSync(path.join(dir,row.file))),old=structuredClone(saved.pendingPresentation),v=old.reading.view||{turns:row.result.turns,sceneKeys:row.result.info.sceneKeys,index:0};
 if(!saved.pendingPresentation.reading.view)saved.pendingPresentation.reading.view=v;
 if(mode==='view-only'){saved.pendingPresentation.view=v;delete saved.pendingPresentation.reading;}
 if(mode.includes('text-only')){delete saved.pendingPresentation.reading;delete saved.pendingPresentation.view;delete saved.pendingPresentation.authoredView;}
 if(mode==='clocked-text-only')saved.pendingPresentation.sceneTime={day:saved.day,min:saved.min};
 const h=setup();assert(h.run(`G.load(${JSON.stringify(JSON.stringify(saved))})`));h.run("globalThis.e=event('camp_dogs'),info={sceneKeys:[]}");const before=state(h),receipt=h.json('S.pendingPresentation'),r=pay(h,row.ci,row.oi,false);
 assert.equal(r.applied,false);assert.equal(r.text,old.text);assert.deepEqual(r.chips,old.chips);assert.deepEqual(r.info.sceneKeys,['camp-stray-dogs-night-v1']);assert.deepEqual(state(h),before);assert.deepEqual(h.json('S.pendingPresentation'),receipt);
 if(!mode.includes('text-only'))assert.deepEqual(r.turns,v.turns);else assert(r.turns.every(t=>!t.scene));
 const again=h.run('G.exportSave()');assert(h.run(`G.load(${JSON.stringify(again)})`));assert.deepEqual(state(h),before);assert.deepEqual(h.json('S.pendingPresentation'),receipt);
});
