const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
function fixture(minute){const h=setup();h.run(`G.save();G.load();S.party=['minji','leo'];S.day=8;S.min=${minute};S.food=12;S.water=16;globalThis.e=event('pair_mj_leo_1');G.beginPresentation(e);`);return h;}
for(const minute of [580,1320])test(`the cylinder conversation stays in the present at minute ${minute} without advancing the clock`,()=>{
 const h=fixture(minute),before=h.json('({day:S.day,min:S.min})');
 h.run('globalThis.result=G.resolvePresentedChoice(e,e.choices[0])');assert(h.run('result.ok'));
 assert.deepEqual(h.json('({day:S.day,min:S.min})'),before);
 const text=h.run('result.out.text');assert.match(text,/레오.*보닛.*소리/);assert.doesNotMatch(text,/그날 저녁 내내/);
 assert(h.run("S.notes.some(n=>n.title==='실린더 피처링')"));
 const paid=h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.scrap,S.notes,S.comps])');
 h.run('G.save();G.load();globalThis.result=G.resolvePresentedChoice(e,e.choices[0])');assert.equal(h.run('result.applied'),false);
 assert.equal(h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.scrap,S.notes,S.comps])'),paid);
});
test('a legacy paid evening result remains frozen without a second effect or clock advance',()=>{
 const h=fixture(580);h.run("S.notes=[{id:'legacy-cylinder',title:'실린더 피처링',body:'400km 크레딧: 사운드 엔지니어 민지, 피처링 2번 실린더.',links:['민지','레오','달구지'],day:8}];S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:0,outcomeIndex:0,text:'레오는 그날 저녁 내내 보닛에 귀를 대고 있었다.',chips:[]};G.save();G.load();");
 const before=h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.scrap,S.notes,S.comps])');h.run('globalThis.result=G.resolvePresentedChoice(e,e.choices[0])');
 assert.equal(h.run('result.applied'),false);assert.equal(h.run('result.out.text'),'레오는 그날 저녁 내내 보닛에 귀를 대고 있었다.');assert.equal(h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.scrap,S.notes,S.comps])'),before);
});
