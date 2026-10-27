const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const oldText='반죽 한 시간, 밀기 30분, 롤러에 넣고 돌리자— 국수가 나왔다. 굵기가 칼국수와 우동 사이 어딘가의 신종이었지만 국수는 국수다.\n\n그날 저녁은 잔치국수(고명: 오미자청 조금, 참기름, 말린 나물). 면을 직접 뽑아 먹으면 후루룩 소리가 두 배로 당당해진다.';
const oldFx={time:120,food:4,moodAll:6,note:{type:'사건',title:'신종 국수',body:'제면소 수동 롤러로 뽑은 칼국수-우동 사이의 무언가. 당당한 후루룩.'}};
function fixture(minute){const h=setup();h.run(`G.save();G.load();S.at='namwon';S.day=3;S.min=${minute};S._breakfastDay=3;S._lunchDay=${minute>=720?3:2};S.food=9;S.water=12;S.party=[];S.fatigue=10;globalThis.e=event('exp_noodleworks');G.beginPresentation(e);G.save();G.load();`);return h;}
const paidState=h=>h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.fuel,S.scrap,S.van,S.fatigue,S.notes,S.comps,S.items,S.flags])');
for(const minute of [510,660,1080,1380])test(`noodle meal is within the current120 minutes from ${minute}, with frozen paid replay`,()=>{
 const h=fixture(minute),before=h.run('S.day*1440+S.min');
 assert.deepEqual(h.json('e.choices[0].out.map(o=>({p:o.p,fx:o.fx}))'),[{p:1,fx:oldFx}]);
 h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');assert(h.run('r.ok'));assert(h.run('r.applied'));
 assert.equal(h.run('S.day*1440+S.min')-before,120);
 assert.match(h.run('r.out.text'),/뽑은 면.*잔치국수.*끓/);
 assert.doesNotMatch(h.run('r.out.text'),/그날 저녁|다음 날|내일/);
 if(minute===510){assert.equal(h.run('S.min'),630);assert.equal(h.run('S.food'),13);}
 if(minute===660){assert.equal(h.run('S.min'),780);assert.equal(h.run('S.food'),12);assert(h.messages.some(t=>t.includes('점심 식사')));}
 const paid=paidState(h),text=h.run('r.out.text');h.run('G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');
 assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),text);assert.equal(paidState(h),paid);
});
test('the historical paid evening receipt stays frozen without spending another120 minutes',()=>{
 const h=fixture(630);h.run(`S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:0,outcomeIndex:0,text:${JSON.stringify(oldText)},chips:[{t:'식량 +4',c:'plus'}]};G.save();G.load();`);
 const paid=paidState(h),receipt=h.run('JSON.stringify(S.pendingPresentation)');
 h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');assert.equal(h.run('r.applied'),false);
 assert.equal(h.run('r.out.text'),oldText);assert.equal(paidState(h),paid);assert.equal(h.run('JSON.stringify(S.pendingPresentation)'),receipt);
});
test('both original choice indices and free flour pickup remain unchanged and can exit',()=>{
 const h=fixture(510);assert.deepEqual(h.json('e.choices.map(c=>({label:c.label,req:c.req??null}))'),[{label:'국수를 뽑는다',req:null},{label:'밀가루만 챙긴다',req:null}]);
 assert.deepEqual(h.json('e.choices[1].out.map(o=>({p:o.p,fx:o.fx}))'),[{p:1,fx:{food:3}}]);
 h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[1])');assert(h.run('r.ok'));assert.equal(h.run('S.min'),510);assert.equal(h.run('S.food'),12);
 h.run('G.queuePresentation(null)');assert.equal(h.run('S.pendingPresentation'),null);
});
