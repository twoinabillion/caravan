'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const H=require('./fixtures/qa-cycle103-eunsu-camp/setup.cjs'),rows=require('./fixtures/qa-cycle105-eunsu-fold/baseline.json'),dir=path.join(__dirname,'fixtures/qa-cycle105-eunsu-fold');
const raw=f=>fs.readFileSync(path.join(dir,f),'utf8'),words=ts=>ts.map(({scene,...t})=>t),bare='comp-eunsu-conversation-bare-interior-v1',notebook='comp-eunsu-notebook-interior-v1';
const load=(h,s)=>assert(h.run(`G.load(${JSON.stringify(s)})`));
test('immutable103 v1 paid branch fixtures remain byte exact',()=>{for(const[f,sha]of Object.entries(require('./fixtures/qa-cycle105-eunsu-fold/SHA256.json')))assert.equal(crypto.createHash('sha256').update(raw(f)).digest('hex'),sha)});
for(const row of rows){
 test(`fresh ${row.prev}/${row.min}: fold closes visible notebook only after narration, no effect delta`,()=>{
  const h=H.fresh(row.prev,row.facts,row.wait,row.min);assert.equal(h.run('S.campConversation.sceneRevision'),'qa105');
  h.run("G.capturePresentationView({eventId:e.id,phase:'event',turns:entry,...info,index:0})");const history=h.json('S.campConversation.reading.view'),r=H.pay(h,0,0,false),at=r.turns.findIndex(t=>t.kind==='narration'&&t.text.includes('은수는 다음 설명을 하려다가 종이를 접었다'));
  assert(at>=0);assert.equal(r.turns[at].scene,bare);for(let i=0;i<r.turns.length;i++)assert.equal(h.run(`qaCut({eventId:e.id,phase:'outcome',turns,sceneKeys:info.sceneKeys},${i})`),i<at?notebook:bare);
  assert.equal(r.text,row.paid.text);assert.deepEqual(words(r.turns),words(row.paid.turns));assert.deepEqual(r.chips,row.paid.chips);assert.deepEqual(H.state(h),row.state);
  const receipt=h.json('S.campConversation'),state=H.state(h);load(h,h.run('G.exportSave()'));H.render(h);const replay=H.pay(h,0,0,false);assert(!replay.applied);assert.deepEqual(replay.turns,r.turns);assert.deepEqual(H.state(h),state);assert.deepEqual(h.json('S.campConversation'),receipt);assert.deepEqual(h.json('S.campConversation.reading.history'),history);
 });
 for(const textOnly of [false,true])test(`old103 ${row.prev}/${row.min} textOnly=${textOnly}: no retroactive fold cut or repayment`,()=>{const s=JSON.parse(raw(row.paidFile));if(textOnly)delete s.campConversation.reading;const h=H.setup();load(h,JSON.stringify(s));H.render(h);const state=H.state(h),owner=h.json('S.campConversation'),r=H.pay(h,0,0,false);assert(!r.applied);assert.equal(r.text,row.paid.text);assert.deepEqual(r.info,row.paid.info);assert.deepEqual(words(r.turns),words(row.paid.turns));assert(!r.turns.some(t=>t.scene===bare));assert.deepEqual(H.state(h),state);assert.deepEqual(h.json('S.campConversation'),owner);});
}
