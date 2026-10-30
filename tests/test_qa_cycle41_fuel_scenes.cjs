'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const old=require('./fixtures/qa-cycle41-fuel/old.json'),{init,pay,state}=require('./fixtures/qa-cycle41-fuel/reader.cjs');
const day='event-crisis-fuel-stopped-day-v1',night='event-crisis-fuel-stopped-night-v1';
const expected=min=>min<330||min>=1170?night:day;
for(const [id,row] of Object.entries(old)){
 test(id+' retains its authored words, gates, costs and outcomes',()=>{
  const h=init(id),current=h.json('JSON.parse(JSON.stringify(e,(k,v)=>typeof v==="function"?v.toString():v))');if(id==='crisis_nofuel2'){assert.deepEqual(current.choices[0].out[0].turnSpeakers,[{who:'passer_refugee',name:'농가 사람'}]);delete current.choices[0].out[0].turnSpeakers}if(id==='crisis_nofuel3'){assert.deepEqual(current.choices[1].out[0].turnSpeakers,[{who:'passer_worker',name:'트랙터 기사'}]);delete current.choices[1].out[0].turnSpeakers}assert.deepEqual(current,row.definition);
 });
 test(id+' fresh empty-road plate follows entry and real paid clocks at day boundaries',()=>{
  for(const min of [0,329,330,1169,1170,1439]){
   const h=init(id,min);h.run('G.save();G.load()');assert.deepEqual(h.json('ei.sceneKeys'),[expected(min)]);assert.deepEqual(h.json('ei.sceneTime'),{day:4,min});
   const r=pay(h,0,0);assert.deepEqual(r.scene.sceneKeys,[expected(h.run('S.min'))]);assert.deepEqual(r.scene.sceneTime,{day:h.run('S.day'),min:h.run('S.min')});
   const before=state(h),reading=h.json('S.pendingPresentation.reading');h.run('G.save();G.load();globalThis.replay=G.resolvePresentedChoice(e,e.choices[0])');assert.equal(h.run('replay.applied'),false);assert.deepEqual(state(h),before);assert.deepEqual(h.json('S.pendingPresentation.reading'),reading);
  }
 });
 for(const c of row.cases)test(`${id} ${c.ci}.${c.oi}: mechanics and old entry/paid/text-only memories survive`,()=>{
  const h=init(id),r=pay(h,c.ci,c.oi);assert.equal(r.text,c.out.text);if(id==='crisis_nofuel3'&&c.ci===1&&c.oi===0){const newTurn=r.turns.find(t=>t.kind==='dialogue'),oldTurn=c.out.turns.find(t=>t.kind==='dialogue');assert.deepEqual(newTurn,{kind:'dialogue',who:'passer_worker',name:'트랙터 기사',text:'길에 서 있는 것보단 싸요.'});r.turns[r.turns.indexOf(newTurn)]=oldTurn;}if(id==='crisis_nofuel2'&&c.ci===0&&c.oi===0){const newTurn=r.turns.find(t=>t.kind==='dialogue'),oldTurn=c.out.turns.find(t=>t.kind==='dialogue');assert.deepEqual(newTurn,{kind:'dialogue',who:'passer_refugee',name:'농가 사람',text:'조심혀. 요즘 길에 서 있는 차는 위에서 다 세어 간다니께.'});r.turns[r.turns.indexOf(newTurn)]=oldTurn;}assert.deepEqual(r.turns,c.out.turns);assert.deepEqual(r.chips,c.out.chips);assert.deepEqual(state(h),c.state);
  assert(h.run('G.load('+JSON.stringify(row.entry)+')'));h.run("globalThis.i=info(e,'event',[],[])");assert.deepEqual(h.json('i.sceneKeys'),row.entryInfo.sceneKeys);assert.equal(h.run('i.sceneTime'),undefined);assert.deepEqual(h.json('S.pendingPresentation.reading.view.turns'),row.entryTurns);
  for(const textOnly of [false,true]){
   const saved=JSON.parse(c.paid);if(textOnly){delete saved.pendingPresentation.reading;delete saved.pendingPresentation.view;delete saved.pendingPresentation.authoredView;}
   assert(h.run('G.load('+JSON.stringify(JSON.stringify(saved))+')'));const before=state(h);h.run(`globalThis.replay=G.resolvePresentedChoice(e,e.choices[${c.ci}]),i=info(e,'outcome',[],[])`);assert.equal(h.run('replay.applied'),false);assert.equal(h.run('replay.out.text'),c.out.text);assert.deepEqual(h.json('i.sceneKeys'),c.out.scene.sceneKeys);assert.equal(h.run('i.sceneTime'),undefined);assert.deepEqual(state(h),before);if(textOnly)assert(h.run('replay.out.frozenTextOnly'));else assert.deepEqual(h.json('replay.out.turns'),c.out.turns);
  }
 });
}
test('old unpaid empty-tank history remains untimed when its new paid result crosses dusk',()=>{
 const h=init('crisis_nofuel');assert(h.run('G.load('+JSON.stringify(old.crisis_nofuel.entry)+')'));h.run("S.day=4;S.min=1140;globalThis.et=buildStoryTurns(S.pendingPresentation.text,e,{turnSpeakers:e.turnSpeakers}),ei=info(e,'event',[],et);G.capturePresentationView({eventId:e.id,phase:'event',turns:et,...ei,index:0});");assert.deepEqual(h.json('ei.sceneKeys'),['event-crisis-fuel']);assert.equal(h.run('ei.sceneTime'),undefined);const r=pay(h,0,0);assert.deepEqual(r.scene.sceneKeys,[night]);assert.deepEqual(h.json('S.pendingPresentation.reading.history.sceneKeys'),['event-crisis-fuel']);assert.equal(h.run('S.pendingPresentation.reading.history.sceneTime'),undefined);
});
