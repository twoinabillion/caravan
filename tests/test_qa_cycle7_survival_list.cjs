const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const body='달구지에서 생긴 일들이 값 없는 물건 목록의 3~9번 칸에 적혀 있다.';
const legacyBody='달구지에서 생긴 아홉 가지가 값 없는 물건 목록에 올랐다.';
const legacyText='"3번, 달구지 조수석 이용권(평생). 4번, 처음 받은 \'정품 인정\' 한마디. 5번, 손 닿는 데 걸어 둔 물건 주머니…"\n\n"그 주머니도요?"\n\n"네. 내릴 때 챙길 거 한꺼번에 넣어두는 거요. 맨날 어디 뒀나 찾았는데, 이제 안 찾아도 돼요."\n\n목록은 아홉 개까지 늘어 있었다. 전부 이 차에서 생긴 것들이었다.\n\n"문제는 다 안 팔려요. 부자인데 현금이 없네." 재이가 목록을 접어 제일 안쪽 주머니에 넣었다.';
function fixture(dog=false){const h=setup();h.run(`G.save();G.load();S.at='cheonan';S.day=16;S.min=793;S.party=['jaeyi'];S.dog=${dog};S.comps.jaeyi.bond=40;S.comps.jaeyi.mood=60;S.notes=[];S.used=[];`);return h;}
const state=h=>h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.scrap,S.fuel,S.van,S.fatigue,S.notes,S.comps,S.flags,S.items])');
function choose(h,id){h.run(`G.queuePresentation(null);globalThis.e=event(${JSON.stringify(id)});G.beginPresentation(e);G.save();G.load();globalThis.entry=S.pendingPresentation.text;globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);`);assert(h.run('r.ok'));return h.json('r');}
for(const dog of [false,true])for(const tenFirst of [false,true])test(`Jaeyi reads entries3–9 with dog=${dog}, signed item10 first=${tenFirst}`,()=>{
 const h=fixture(dog),clock=h.run('JSON.stringify([S.day,S.min])');
 if(tenFirst){const r=choose(h,'talk_jy_10');assert.match(r.out.text,/10번\. 이 여행/);}
 const r=choose(h,'talk_jy_09');assert.doesNotMatch(h.run('entry'),/업데이트|새로 적힌/);assert.match(h.run('entry'),/3번부터 9번까지/);
 assert.match(r.out.text,/세 번째부터 아홉 번째 칸까지/);assert.doesNotMatch(r.out.text,/목록은 아홉 개까지|전부 이 차에서/);
 assert.equal(h.run('JSON.stringify([S.day,S.min])'),clock);assert.equal(r.out.fx.mood.jaeyi,6);assert.equal(r.out.fx.moodAll,2);
 assert.equal(r.out.fx.note.body,body);assert.equal(h.run('S.notes.at(-1).body'),body);
 if(dog)assert.match(r.out.text,/보리 거요/);else assert.doesNotMatch(r.out.text,/보리 거요|비 온 날 창문/);
 assert.deepEqual(h.json("buildStoryTurns(r.out.text,e,{turnSpeakers:r.out.turnSpeakers}).filter(t=>t.kind==='dialogue').map(t=>t.who)"),['jaeyi','me','jaeyi','jaeyi']);
 const paid=state(h),text=r.out.text;h.run('G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),text);assert.equal(state(h),paid);
 if(!tenFirst){const last=choose(h,'talk_jy_10');assert.match(last.out.text,/10번\. 이 여행/);}
 assert(h.json('S.notes.map(n=>n.title)').includes('감정서 10번'));
});
test('the list keeps both original eligibility gates and its single choice mechanics',()=>{
 const h=fixture();assert.deepEqual(h.json("(()=>{const e=event('talk_jy_09');return {id:e.id,type:e.type,w:e.w,once:e.once,needsComp:e.needsComp,needBond:e.needBond,choices:e.choices.map(c=>({label:c.label,req:c.req??null,out:c.out.map(o=>({p:o.p,fx:o.fx}))}))};})()"),{id:'talk_jy_09',type:'대화',w:4,once:true,needsComp:'jaeyi',needBond:['jaeyi',12],choices:[{label:'"3번이 뭔데요?"',req:null,out:[{p:1,fx:{mood:{jaeyi:6},moodAll:2,note:{type:'사건',title:'시세 없는 목록 3~9번',body,links:['재이','달구지']}}}]}]});
 assert.deepEqual(h.json("event('talk_jy_10').needBond"),['jaeyi',20]);
});
test('already-paid list prose and its old nine-item note stay frozen after reload',()=>{
 const h=fixture();h.run(`globalThis.e=event('talk_jy_09');S.notes=[{type:'사건',title:'시세 없는 목록 3~9번',body:${JSON.stringify(legacyBody)},links:['재이','달구지']}];S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:0,outcomeIndex:0,text:${JSON.stringify(legacyText)},chips:[{t:'사기 +6',c:'plus'}]};G.save();G.load();`);
 const before=state(h),receipt=h.run('JSON.stringify(S.pendingPresentation)');h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');
 assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),legacyText);assert.equal(h.run('S.notes[0].body'),legacyBody);assert.equal(state(h),before);assert.equal(h.run('JSON.stringify(S.pendingPresentation)'),receipt);
});
