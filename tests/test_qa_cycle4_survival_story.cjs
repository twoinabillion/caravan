const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const legacyMinji='민지가 나를 빤히 보더니, 렌치를 툭 던져줬다.\n\n"그 말 기억해. 차든 사람이든." 받아든 렌치가 계약서였다.\n\n그날부터 정비는 둘이서 했다. 하나가 조이면 하나가 받치면서.';
function fixture(id,minute=440){const h=setup();h.run(`G.save();G.load();S.party=['minji','parkss'];S.day=11;S.min=${minute};S.food=12;S.water=8;S.weather='clear';globalThis.e=event(${JSON.stringify(id)});G.beginPresentation(e);`);return h;}
const paidState=h=>h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.scrap,S.notes,S.comps])');
for(const minute of [440,1320])test(`Minji's promise becomes one current action at minute ${minute}` ,()=>{
 const h=fixture('talk_mj_21',minute),clock=h.run('JSON.stringify([S.day,S.min])');
 h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[1])');assert(h.run('r.ok'));
 assert.equal(h.run('JSON.stringify([S.day,S.min])'),clock);
 assert.deepEqual(h.json('e.choices[1].out[0].fx'),{mood:{minji:7}});
 assert.match(h.run('r.out.text'),/공구함.*열|함께.*챙/);
 assert.doesNotMatch(h.run('r.out.text'),/그날부터 정비는 둘이서 했다/);
 const paid=paidState(h);h.run('G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[1])');
 assert.equal(h.run('r.applied'),false);assert.equal(paidState(h),paid);
});
test('a paid legacy Minji promise remains frozen without reapplying its reward',()=>{
 const h=fixture('talk_mj_21');h.run(`S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:1,outcomeIndex:0,text:${JSON.stringify(legacyMinji)},chips:[]};G.save();G.load();`);
 const paid=paidState(h);h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[1])');
 assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),legacyMinji);assert.equal(paidState(h),paid);
});
const legacyPark='물을 받아든 박 선생이 한 모금 마셨다.\n\n"따뜻하네. …이 물 어디 것이지?"\n\n"아까 그 계곡이요."\n\n"그렇군."\n\n대답을 듣고도 한 모금 더 마시고 나서야 컵을 내 쪽으로 조금 기울였다. "지금은 말하지 말자는 거지? 알겠네."\n\n빗소리를 들으며 물이 식을 때까지 앉아 있었다.';
test('Parkss water exchange names no unvisited source or unsupported current weather',()=>{
 const h=fixture('talk_pss_19'),clock=h.run('JSON.stringify([S.day,S.min])');
 h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[1])');assert(h.run('r.ok'));
 assert.equal(h.run('JSON.stringify([S.day,S.min])'),clock);assert.equal(h.run('S.water'),7);
 assert.deepEqual(h.json('e.choices[1].out[0].fx'),{mood:{parkss:5},water:-1});
 assert.doesNotMatch(h.run('r.out.text'),/아까 그 계곡|빗소리/);
 assert.match(h.run('r.out.text'),/창밖/);
 assert.deepEqual(h.json("buildStoryTurns(r.out.text,e,{turnSpeakers:r.out.turnSpeakers}).filter(t=>t.kind==='dialogue').map(t=>t.who)"),['parkss','me','parkss','parkss']);
 const text=h.run('r.out.text'),paid=paidState(h);h.run('G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[1])');
 assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),text);assert.equal(paidState(h),paid);
});
test('paid legacy Parkss rain and stream prose remains frozen with no second water cost',()=>{
 const h=fixture('talk_pss_19');h.run(`S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:1,outcomeIndex:0,text:${JSON.stringify(legacyPark)},chips:[]};G.save();G.load();`);
 const paid=paidState(h);h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[1])');
 assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),legacyPark);assert.equal(paidState(h),paid);
});
