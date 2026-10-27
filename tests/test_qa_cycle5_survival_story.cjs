const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const oldRiceFx={food:1,moodAll:5,note:{type:'사건',title:'서로 돕는 밥',body:'대나무가 밥을 지키고 밥이 향을 얻는다. 버릴 게 없는 한 끼.'}};
function fixture(id,food=1){const h=setup();h.run(`G.save();G.load();S.at='damyang';S.day=7;S.min=994;S.food=${food};S.water=10;S.party=[];S.used=[];S.notes=[];globalThis.e=event(${JSON.stringify(id)});G.beginPresentation(e);G.save();G.load();`);return h;}
const paidState=h=>h.run('JSON.stringify([S.food,S.water,S.fuel,S.scrap,S.van,S.fatigue,S.day,S.min,S.comps,S.notes,S.flags,S.items])');
for(const food of [0,.5])test(`rice barter rejects initial food ${food} without granting the net gain`,()=>{
 const h=fixture('lc_damyang_juktong',food),before=h.run('JSON.stringify(S)');
 assert.equal(h.run('G.reqOk(G.choiceReq(e.choices[0])).ok'),false);
 assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[0]).ok'),false);
 assert.equal(h.run('JSON.stringify(S)'),before);
 assert(h.run('G.reqOk(G.choiceReq(e.choices[1])).ok'));
});
test('one food enables the disclosed barter and preserves the authored net gain once',()=>{
 const h=fixture('lc_damyang_juktong');assert.deepEqual(h.json('e.choices[0].req'),{food:1});
 assert.match(h.run('e.choices[0].label'),/바꾼다.*식량 1/);
 assert.deepEqual(h.json('e.choices[0].out.map(o=>({p:o.p,fx:o.fx}))'),[{p:1,fx:oldRiceFx}]);
 h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');assert(h.run('r.ok'));assert.equal(h.run('S.food'),2);assert.equal(h.run('S.min'),994);
 const before=paidState(h),text=h.run('r.out.text');h.run('G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');
 assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),text);assert.equal(paidState(h),before);
});
test('an unpaid barter rechecks the lost initial food after reload',()=>{
 const h=fixture('lc_damyang_juktong');h.run('S.food=0;G.save();G.load()');const before=paidState(h);
 assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[0]).ok'),false);assert.equal(paidState(h),before);
});
test('the appended rice decline is free, grants no reward and permits the next scene',()=>{
 const h=fixture('lc_damyang_juktong',0),before=paidState(h);assert.equal(h.run('e.choices.length'),2);
 assert.deepEqual(h.json('e.choices[1].out[0].fx'),{});h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[1])');assert(h.run('r.ok'));
 assert.equal(paidState(h),before);assert.doesNotMatch(h.run('r.out.text'),/통조림.*아껴|먹었다|나눠 받/);
 h.run('G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[1])');assert.equal(h.run('r.applied'),false);assert.equal(paidState(h),before);
 h.run('G.queuePresentation(null)');assert.equal(h.run('S.pendingPresentation'),null);
});
test('a legacy paid barter still reloads with no food and does not charge or grant again',()=>{
 const h=fixture('lc_damyang_juktong',0);h.run(`S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:0,outcomeIndex:0,text:'통조림 하나와 죽통밥 두 통을 바꿨다.',chips:[]};G.save();G.load();`);
 const before=paidState(h);h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');assert.equal(h.run('r.applied'),false);
 assert.equal(h.run('r.out.text'),'통조림 하나와 죽통밥 두 통을 바꿨다.');assert.equal(paidState(h),before);
});
for(const met of [false,true])test(`Eunsu objects to the record closure without inventing the applicant identity, prior meeting ${met}`,()=>{
 const h=fixture('seoul_costs');h.run(`G.queuePresentation(null);S.party=['eunsu'];S.used=${met?'["story_generation_form"]':'[]'};G.beginPresentation(e);G.save();G.load();`);
 const text=h.run('S.pendingPresentation.text');assert.doesNotMatch(text,/할아버지가 내일 조회/);assert.match(text,/면사무소에서 내일 조회하기로 한 이송표 세 장/);
 assert.match(text,/격리 수면은 안 돼요/);assert.deepEqual(h.json("D.finaleSpeakers(e.id,-1,S)"),['eunsu']);
 assert.deepEqual(h.json("buildStoryTurns(S.pendingPresentation.text,e,{turnSpeakers:D.finaleSpeakers(e.id,-1,S)}).filter(t=>t.kind==='dialogue').map(t=>t.who)"),['eunsu']);
 const before=paidState(h);h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[1])');assert(h.run('r.ok'));
 assert.match(h.run('r.out.text'),/내가 만난 사람인지는 알 수 없었다/);assert.equal(h.run('S.min'),994);
 assert.equal(h.run('S.flags.costs_checked_records'),true);assert.equal(h.run('r.out.fx.chain'),'seoul_decision');
 const paid=paidState(h);h.run('G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[1])');assert.equal(h.run('r.applied'),false);assert.equal(paidState(h),paid);
});
test('a paid historical costs receipt remains frozen with the same flags and resources',()=>{
 const h=fixture('seoul_costs');h.run("S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:1,outcomeIndex:0,text:'면사무소 할아버지가 기다린다.',chips:[]};G.save();G.load()");const before=paidState(h);
 h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[1])');assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),'면사무소 할아버지가 기다린다.');assert.equal(paidState(h),before);
});
for(const food of [0,.5,1])test(`the derived salt/meat barter checks initial food ${food} and retains net food+4`,()=>{
 const h=fixture('ev_hunter_meat',food);h.run('S.items={"부품":0,"의약품":0,"탄약":0}');assert.deepEqual(h.json('e.choices[2].out.map(o=>({p:o.p,fx:o.fx}))'),[{p:1,fx:{food:4,moodAll:2}}]);
 assert.deepEqual(h.json('e.choices[2].req'),{food:1});assert.match(h.run('e.choices[2].label'),/식량 1/);
 assert.equal(h.run('G.reqOk(G.choiceReq(e.choices[2])).ok'),food===1);const before=paidState(h);
 h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[2])');assert.equal(h.run('r.ok'),food===1);
 if(food<1){assert.equal(paidState(h),before);assert(h.run('G.reqOk(G.choiceReq(e.choices[3])).ok'));}
 else{assert.equal(h.run('S.food'),5);const paid=paidState(h);h.run('G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[2])');assert.equal(h.run('r.applied'),false);assert.equal(paidState(h),paid);}
});
test('a hunter can be declined without food, ammunition or Leo and no rewards appear',()=>{
 const h=fixture('ev_hunter_meat',0);h.run('S.items={"부품":0,"의약품":0,"탄약":0}');assert.equal(h.run('e.choices.length'),4);
 for(const i of [0,1,2])assert.equal(h.run(`G.reqOk(G.choiceReq(e.choices[${i}])).ok`),false);
 assert.deepEqual(h.json('e.choices[3].out[0].fx'),{});const before=paidState(h);
 h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[3])');assert(h.run('r.ok'));assert.equal(paidState(h),before);
 h.run('G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[3])');assert.equal(h.run('r.applied'),false);assert.equal(paidState(h),before);
 h.run('G.queuePresentation(null)');assert.equal(h.run('S.pendingPresentation'),null);
});
test('the hunter rechecks unpaid stock after reload but preserves a paid legacy exchange',()=>{
 const h=fixture('ev_hunter_meat',1);h.run('S.food=0;G.save();G.load()');assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[2]).ok'),false);
 h.run("S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:2,outcomeIndex:0,text:'가진 소금 조금과 고기를 바꿨다.',chips:[]};G.save();G.load()");const before=paidState(h);
 h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[2])');assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),'가진 소금 조금과 고기를 바꿨다.');assert.equal(paidState(h),before);
});
function popper(food){const h=fixture('meet_popper',food);h.run("G.queuePresentation(null);S.party=['leo'];S.dog=true;G.beginPresentation(e);G.save();G.load()");return h;}
for(const food of [0,.5,1])test(`corn processing checks initial food ${food}, preserving its net food+1`,()=>{
 const h=popper(food);assert.equal(h.run('e.needsDog'),true);assert.equal(h.run('e.choices.length'),2);
 assert.deepEqual(h.json('e.choices[0].req'),{food:1});assert.equal(h.run('e.choices[0].label'),'옥수수를 맡긴다 (식량 1)');
 assert.deepEqual(h.json('e.choices[0].out[0].fx'),{food:1,moodAll:5,note:{type:'인물',title:'뻥튀기 아저씨',body:'"문명이 아니라 물리라서." 부피의 마법사. 예고해도 놀라는 쾅.'}});
 const before=paidState(h);h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');assert.equal(h.run('r.ok'),food===1);
 if(food<1){assert.equal(paidState(h),before);assert(h.run('G.reqOk(G.choiceReq(e.choices[1])).ok'));}
 else{assert.equal(h.run('S.food'),2);const paid=paidState(h);h.run('G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');assert.equal(h.run('r.applied'),false);assert.equal(paidState(h),paid);}
});
test('the existing free popper audience choice keeps only its authored mood reward',()=>{
 const h=popper(0);assert.deepEqual(h.json('e.choices[1].out[0].fx'),{moodAll:2});const mood=h.run('S.comps.leo.mood');
 h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[1])');assert(h.run('r.ok'));assert.equal(h.run('S.food'),0);assert.equal(h.run('S.comps.leo.mood'),mood+2);
 const paid=paidState(h);h.run('G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[1])');assert.equal(h.run('r.applied'),false);assert.equal(paidState(h),paid);
});
test('unpaid corn stock is rechecked while an already-paid legacy popper receipt stays frozen',()=>{
 const h=popper(1);h.run('S.food=0;G.save();G.load()');assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[0]).ok'),false);
 h.run("S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:0,outcomeIndex:0,text:'옥수수 한 봉이 튀밥 한 자루가 됐다.',chips:[]};G.save();G.load()");const paid=paidState(h);
 h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),'옥수수 한 봉이 튀밥 한 자루가 됐다.');assert.equal(paidState(h),paid);
});
