const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
function fixture(id,{food=0,water=0,party=['leo']}={}){
 const h=setup();h.run(`S.at='jeonju';S.day=4;S.min=540;S.party=${JSON.stringify(party)};S.food=${food};S.water=${water};S.items={};S.flags.food_poison=true;S.notes=[];globalThis.e=event('${id}');G.beginPresentation(e);G.save();G.load();`);return h;
}
for(const food of [0,1])test(`both children food choices reject stock ${food}, with a reachable free exit`,()=>{
 for(const index of [0,1]){
  const h=fixture('kids_meet',{food,party:[]});assert.equal(h.run(`G.reqOk(G.choiceReq(e.choices[${index}])).ok`),false);
  const before=h.run('JSON.stringify(S)');assert.equal(h.run(`G.resolvePresentedChoice(e,e.choices[${index}]).ok`),false);assert.equal(h.run('JSON.stringify(S)'),before);
  assert(h.run('G.reqOk(G.choiceReq(e.choices[2])).ok'));assert(h.run('G.resolvePresentedChoice(e,e.choices[2]).ok'));
  assert.equal(h.run('S.food'),food);assert.equal(h.run('!!S.flags.kids_met'),false);assert.equal(h.run('S.min'),540);
 }
});
for(const index of [0,1])test(`children paid choice ${index} charges exact stock once and rechecks stock after reload`,()=>{
 const h=fixture('kids_meet',{food:2,water:20});assert(h.run(`G.resolvePresentedChoice(e,e.choices[${index}]).ok`));assert.equal(h.run('S.food'),0);assert(h.run('S.flags.kids_met'));
 const before=h.run('JSON.stringify([S.food,S.min,S.notes,S.flags])');h.run('G.save();G.load()');assert.equal(h.run(`G.resolvePresentedChoice(e,e.choices[${index}]).applied`),false);assert.equal(h.run('JSON.stringify([S.food,S.min,S.notes,S.flags])'),before);
 const stale=fixture('kids_meet',{food:2});stale.run('S.food=1;G.save();G.load()');assert.equal(stale.run(`G.resolvePresentedChoice(e,e.choices[${index}]).ok`),false);
});
for(const stock of [0,4])test(`medicine-free crisis remains reachable at stock ${stock} without inventing a meal`,()=>{
 const h=fixture('comp_sick',{food:stock,water:stock});assert.equal(h.run('G.reqOk(G.choiceReq(e.choices[0])).ok'),false);assert.equal(h.run('G.reqOk(G.choiceReq(e.choices[1])).ok'),false);
 assert(h.run('G.reqOk(G.choiceReq(e.choices[2])).ok'));h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[2])');assert(h.run('r.ok'));
 assert.doesNotMatch(h.run('r.out.text'),/물과 먹을 것|남은 봉지|먹었다|마셨다/);assert.match(h.run('r.out.text'),/통증이 잦아들/);
 assert.equal(h.run('S.food'),Math.max(0,stock-2));assert.equal(h.run('S.water'),Math.max(0,stock-2));assert.equal(h.run('!!S.flags.food_poison'),false);assert.equal(h.run('S.min'),540);
 const paid=h.run('JSON.stringify([S.food,S.water,S.min,S.comps.leo.mood])');h.run('G.save();G.load()');assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[2]).applied'),false);assert.equal(h.run('JSON.stringify([S.food,S.water,S.min,S.comps.leo.mood])'),paid);
});
for(const water of [0,2,3])test(`Park treatment checks three water at stock ${water}`,()=>{
 const h=fixture('comp_sick',{water,party:['parkss']});assert.equal(h.run('G.reqOk(G.choiceReq(e.choices[1])).ok'),water===3);
 const before=h.run('JSON.stringify(S)');h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[1])');assert.equal(h.run('r.ok'),water===3);
 if(water<3){assert.equal(h.run('JSON.stringify(S)'),before);assert(h.run('G.reqOk(G.choiceReq(e.choices[2])).ok'));}
 else{assert.equal(h.run('S.water'),0);assert.equal(h.run('S.min'),660);assert.equal(h.run('!!S.flags.food_poison'),false);const paid=h.run('JSON.stringify([S.water,S.min,S.comps.parkss.mood])');h.run('G.save();G.load()');assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[1]).applied'),false);assert.equal(h.run('JSON.stringify([S.water,S.min,S.comps.parkss.mood])'),paid);}
});
test('Park treatment rechecks water after restoring an entry',()=>{
 const h=fixture('comp_sick',{water:3,party:['parkss']});h.run('S.water=2;G.save();G.load()');assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[1]).ok'),false);assert(h.run('G.reqOk(G.choiceReq(e.choices[2])).ok'));
});
for(const party of [[],['leo']])test(`snow detour with no food remains reachable for party ${party.length}`,()=>{
 const h=fixture('ev_snow_road',{party,water:20});h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[2])');assert(h.run('r.ok'));assert.equal(h.run('S.food'),0);assert.equal(h.run('S.min'),660);assert.doesNotMatch(h.run('r.out.text'),/먹을 것을|꺼내 먹|먹었다/);assert.match(h.run('r.out.text'),/바퀴 자국/);
});
test('legacy paid results and notes stay frozen across all three events',()=>{
 for(const [id,index]of [['kids_meet',0],['kids_meet',1],['comp_sick',1],['comp_sick',2],['ev_snow_road',2]]){
  const h=fixture(id);h.run(`S.notes=[{title:'옛 기록',body:'옛 원문'}];S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:${index},outcomeIndex:0,text:'옛 지급 결과',chips:[],view:{turns:[{kind:'narration',text:'옛 지급 결과'}],index:0}};G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[${index}]);`);
  assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),'옛 지급 결과');assert.equal(h.run('S.notes[0].body'),'옛 원문');assert.equal(h.run('S.food'),0);
 }
});
