'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const H=require('./fixtures/qa-cycle103-eunsu-join/setup.cjs');
const actual=JSON.parse(fs.readFileSync(__dirname+'/fixtures/continuous-repair03/suwon-local-648.json'));
function local(place,nid,min=648){const h=H.setup();h.run(`S.pendingPresentation=null;S.at=${JSON.stringify(place)};S.driving=null;S.day=5;S.min=${min};globalThis.e={id:'local_chat_'+${JSON.stringify(nid)},type:'대화',title:'현지 주민',localConversation:true,locEvent:S.at};globalThis.turns=[{kind:'dialogue',text:'이곳의 소식'}];globalThis.info=qaInfo(e,'event',[],turns)`);return h;}
test('natural10:48 Suwon local input now selects its reviewed daylight plate without changing speech or state',()=>{
 const row=actual.localViews[0],h=local(row.clock.at,actual.npc,row.clock.min);h.run(`e=${JSON.stringify({...row.event,locEvent:row.clock.at})};turns=${JSON.stringify(row.view.turns)}`);const state=H.state(h),turns=h.json('turns');
 h.run("info=qaInfo(e,'event',[],turns)");assert.deepEqual(h.json('info.sceneKeys'),['event-suwon-fortress-day-v1']);assert.deepEqual(h.json('info.sceneTime'),{day:5,min:648});assert.deepEqual(h.json('turns'),turns);assert.deepEqual(H.state(h),state);assert.equal(h.run('S.pendingPresentation'),null);
});
test('reviewed place lighting covers existing and future resident IDs at exact fractional boundaries',()=>{
 const towns={suwon:{ids:['deokgu','hwasun','gitae','future_resident'],day:'event-suwon-fortress-day-v1',night:'suwon-fortress'},daegu:{ids:['taeho','sera','mansu','future_resident'],day:'event-daegu-dome-day-v1',night:'event-daegu-dome-night-v2'}};
 for(const [place,row] of Object.entries(towns))for(const nid of row.ids){const h=local(place,nid);for(const min of [329.9,330,648,1169.9,1170]){h.run(`S.min=${min};info=qaInfo(e,'event',[],turns)`);assert.deepEqual(h.json('info.sceneKeys'),[min<330||min>=1170?row.night:row.day],place+'/'+nid+'/'+min);assert.equal(h.run('S.pendingPresentation'),null);}}
});
test('unreviewed places and unrelated explicit cuts retain their own actual art',()=>{
 const h=local('daejeon','drhan');assert.deepEqual(h.json('info.sceneKeys'),h.json('qaBaseKeys(e)'));
 const s=local('suwon','deokgu');s.run("e.scene='event-drhan-board-v1';info=qaInfo(e,'event',[],turns)");assert.deepEqual(s.json('info.sceneKeys'),['event-drhan-board-v1']);
});
test('historical local speech and nonlocal events never borrow the current-place fallback',()=>{
 const h=local('suwon','deokgu');
 for(const kind of ['memory','video']){h.run(`e.storyOrigin={kind:'${kind}'};info=qaInfo(e,'event',[],turns)`);assert.deepEqual(h.json('info.sceneKeys'),['suwon-fortress']);assert.equal(h.run('info.sceneTime'),undefined);}
 h.run("delete e.storyOrigin;turns[0].timeKind='epilogue';info=qaInfo(e,'event',[],turns)");assert.deepEqual(h.json('info.sceneKeys'),['suwon-fortress']);assert.equal(h.run('info.sceneTime'),undefined);
 h.run("delete turns[0].timeKind;delete e.localConversation;info=qaInfo(e,'event',[],turns)");assert.deepEqual(h.json('info.sceneKeys'),['suwon-fortress']);assert.equal(h.run('info.sceneTime'),undefined);
});
test('invalid current clocks and stored owner views cannot opt into place lighting',()=>{
 const h=local('suwon','deokgu');h.run("S.min=1440;info=qaInfo(e,'event',[],turns)");assert.deepEqual(h.json('info.sceneKeys'),['suwon-fortress']);assert.equal(h.run('info.sceneTime'),undefined);
 // Explicitly synthetic owner-priority guard, not a claimed saved local chat.
 h.run("S.min=648;S.pendingPresentation={eventId:e.id,phase:'event',view:{turns,sceneKeys:['suwon-fortress'],index:0}};info=qaInfo(e,'event',[],turns)");assert.deepEqual(h.json('info.sceneKeys'),['suwon-fortress']);
});
