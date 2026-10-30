'use strict';
process.env.QA_TIME_PRODUCTION='1';
const test=require('node:test'),assert=require('node:assert/strict'),{open,pay}=require('./fixtures/qa-cycle26-37-support/cycle31/story/time-scene/setup.cjs');
for(const id of ['parkss','leo','jaeyi','eunsu','kangwoo'])for(const min of [329,330,1169,1170])test(`${id} reunion entry/result image matches authored join at ${min}`,()=>{
 const previous=open(`rq_${id}_join`,min),reunion=open(`recruit_reunion_${id}`,min);
 assert.deepEqual(reunion.json('info.sceneKeys'),previous.json('info.sceneKeys'));
 assert.deepEqual(reunion.json('info.sceneTime||null'),previous.json('info.sceneTime||null'));
 const n=reunion.run('entry.length'),entryKeys=reunion.json('info.sceneKeys');for(let i=0;i<n;i++)assert(entryKeys.includes(reunion.run(`qaCut({eventId:e.id,phase:'event',turns:entry,...info},${i})`)));
 const entry=reunion.json('S.pendingPresentation.reading');reunion.run('G.save();G.load();globalThis.restore={eventId:e.id,phase:"event"};G.restorePresentationView(restore)');assert.deepEqual(reunion.json('S.pendingPresentation.reading'),entry);assert.deepEqual(reunion.json('restore.sceneKeys'),entryKeys);
 const a=pay(previous,0),b=pay(reunion,0);assert(a.applied&&b.applied);assert.deepEqual(b.info.sceneKeys,a.info.sceneKeys);assert.deepEqual(b.info.sceneTime||null,a.info.sceneTime||null);for(let i=0;i<b.turns.length;i++)assert(b.info.sceneKeys.includes(reunion.run(`qaCut(readerState,${i})`)));
});
