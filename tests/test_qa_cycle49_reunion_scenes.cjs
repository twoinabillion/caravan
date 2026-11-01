'use strict';
process.env.QA_TIME_PRODUCTION='1';
const test=require('node:test'),assert=require('node:assert/strict'),{open,pay}=require('./fixtures/qa-cycle26-37-support/cycle31/story/time-scene/setup.cjs');
for(const id of ['parkss','leo','jaeyi','eunsu','kangwoo'])for(const min of [329,330,1169,1170])test(`${id} reunion and authored join preserve their own entry/result images at ${min}`,()=>{
 const previous=open(`rq_${id}_join`,min),reunion=open(`recruit_reunion_${id}`,min);
 if(id==='eunsu'){
  assert.equal(previous.run('S.pendingPresentation.sceneRevision'),'qa109');
  assert.deepEqual(previous.json('info.sceneKeys'),['comp-eunsu-conversation-worn-interior-v1','comp-eunsu-conversation-bare-interior-v1']);
  const at=previous.json('entry').findIndex(t=>t.kind==='narration'&&t.text.includes('은수는 수신기를 끄고 헤드폰을 벗는다'));
  assert(at>0);assert.equal(previous.run(`entry[${at}].scene`),'comp-eunsu-conversation-bare-interior-v1');
  for(let i=0;i<previous.run('entry.length');i++)assert.equal(previous.run(`qaCut({eventId:e.id,phase:'event',turns:entry,...info},${i})`),i<at?'comp-eunsu-conversation-worn-interior-v1':'comp-eunsu-conversation-bare-interior-v1');
  assert.equal(reunion.run('S.pendingPresentation.sceneRevision'),'qa103');
  assert.deepEqual(reunion.json('info.sceneKeys'),['comp-eunsu-conversation-worn-interior-v1']);
  assert(reunion.json('entry').every(t=>!t.text.includes('은수는 수신기를 끄고 헤드폰을 벗는다')));
  for(let i=0;i<reunion.run('entry.length');i++)assert.equal(reunion.run(`qaCut({eventId:e.id,phase:'event',turns:entry,...info},${i})`),'comp-eunsu-conversation-worn-interior-v1');
 }
 if(id!=='eunsu')assert.deepEqual(reunion.json('info.sceneKeys'),previous.json('info.sceneKeys'));
 assert.deepEqual(reunion.json('info.sceneTime||null'),previous.json('info.sceneTime||null'));
 const n=reunion.run('entry.length'),entryKeys=reunion.json('info.sceneKeys');for(let i=0;i<n;i++)assert(entryKeys.includes(reunion.run(`qaCut({eventId:e.id,phase:'event',turns:entry,...info},${i})`)));
 const entry=reunion.json('S.pendingPresentation.reading');reunion.run('G.save();G.load();globalThis.restore={eventId:e.id,phase:"event"};G.restorePresentationView(restore)');assert.deepEqual(reunion.json('S.pendingPresentation.reading'),entry);assert.deepEqual(reunion.json('restore.sceneKeys'),entryKeys);
 const a=pay(previous,0),b=pay(reunion,0);assert(a.applied&&b.applied);if(id==='eunsu'){const day=min>=330&&min<1170;assert.deepEqual(a.info.sceneKeys,[day?'recruit-eunsu-join-result-day-v1':'recruit-eunsu-join-result-night-v2']);assert.deepEqual(b.info.sceneKeys,[day?'recruit-eunsu-join-result-day-v1':'recruit-eunsu-join-decision']);}else assert.deepEqual(b.info.sceneKeys,a.info.sceneKeys);assert.deepEqual(b.info.sceneTime||null,a.info.sceneTime||null);for(let i=0;i<b.turns.length;i++)assert(b.info.sceneKeys.includes(reunion.run(`qaCut(readerState,${i})`)));
});
