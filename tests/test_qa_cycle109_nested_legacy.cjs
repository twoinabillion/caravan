'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..'),H=require(root+'/tests/fixtures/qa-cycle103-eunsu-join/setup.cjs'),b=require('./fixtures/qa-cycle109-eunsu/baseline.json'),pre=require(root+'/tests/fixtures/qa-cycle103-eunsu-join/baseline.json');
const load=(h,s)=>assert(h.run(`G.load(${JSON.stringify(JSON.stringify(s))})`));
// Only an isolated data wrapper: no source write, fake asset, newGame, or gameplay action.
// With real qa109 installed, use its registry directly to avoid a redundant wrapper.
function wrap(h){h.run(`if(D.eventSceneTimeVariants.rq_eunsu_join.revision!=='qa109'){const old=JSON.parse(JSON.stringify(D.eventSceneTimeVariants.rq_eunsu_join));D.eventSceneTimeVariants.rq_eunsu_join={...old,revision:'qa109',legacy:old};}`);}
function mode(s,m){const o=s.pendingPresentation;if(m==='view-only'){o.view=o.reading.view;delete o.reading;}if(m.includes('text-only')){delete o.reading;delete o.view;delete o.authoredView;}if(m==='clocked-text-only')o.sceneTime={day:s.day,min:s.min};return s;}
function read(h,paid,ci=0,oi=0){h.run("globalThis.e=event('rq_eunsu_join');globalThis.info={sceneKeys:[]}");if(paid)return H.pay(h,ci,oi,false);H.render(h);return {turns:h.json('entry'),info:h.json('info')};}
const rows=[...pre.map(r=>({...r,era:'pre103',base:root+'/tests/fixtures/qa-cycle103-eunsu-join/'})),...b.rows.map(r=>({...r,era:'qa103',base:__dirname+'/fixtures/qa-cycle109-eunsu/'}))];
for(const row of rows)for(const paid of [false,true])for(const m of ['reader','view-only','text-only','clocked-text-only'])test(`${row.era}/${row.approach}/${row.min}/${paid?'paid':'unpaid'}/${m}: exact revision resolver retains stored words cuts receipt`,()=>{
 const s=mode(JSON.parse(fs.readFileSync(row.base+(paid?row.paidFile:row.entryFile))),m),h=H.setup();load(h,s);const before=H.state(h),receipt=h.json('S.pendingPresentation');
 // Expect the pre109 source's exact historical result; baseline fixtures remain immutable.
 const old=H.setup();load(old,s);old.run(`if(D.eventSceneTimeVariants.rq_eunsu_join.revision==='qa109')D.eventSceneTimeVariants.rq_eunsu_join=D.eventSceneTimeVariants.rq_eunsu_join.legacy;`);const expected=read(old,paid);wrap(h);const result=read(h,paid);assert.deepEqual(result,expected);assert.deepEqual(H.state(h),before);assert.deepEqual(h.json('S.pendingPresentation'),receipt);if(paid)assert.equal(result.applied,false);
 const save=h.run('G.exportSave()');load(h,JSON.parse(save));assert.deepEqual(read(h,paid),expected);assert.deepEqual(H.state(h),before);assert.deepEqual(h.json('S.pendingPresentation'),receipt);
});
for(const p of b.provenance)test(`natural108 ${p.file}: preserved reader history/view despite newest variant`,()=>{const s=JSON.parse(fs.readFileSync(__dirname+'/fixtures/qa-cycle109-eunsu/'+p.file)),h=H.setup();load(h,s);const paid=p.file.includes('result'),before=H.state(h),receipt=h.json('S.pendingPresentation');wrap(h);read(h,paid);assert.deepEqual(H.state(h),before);assert.deepEqual(h.json('S.pendingPresentation'),receipt);});
