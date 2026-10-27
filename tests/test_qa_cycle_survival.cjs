const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
function fixture(id,ci,values={}){
 const h=setup();h.run(`G.save();G.load();S.at='daejeon';S.driving=null;S.min=400;S.fatigue=90;S.food=12;S.water=16;S._breakfastDay=S.day;S._lunchDay=S.day;Object.assign(S,${JSON.stringify(values)});globalThis.ev=event('${id}');G.beginPresentation(ev);globalThis.start=S.day*1440+S.min;globalThis.ci=${ci};`);return h;
}
const pay=h=>h.run('globalThis.result=G.resolvePresentedChoice(ev,ev.choices[ci]);');
function replay(h){const before=h.run('JSON.stringify([S.day,S.min,S.fatigue,S.food,S.water,S.flags,S.comps,S.pendingPresentation])');assert(h.run('G.save();G.load()'));assert.equal(h.run('G.resolvePresentedChoice(ev,ev.choices[ci]).applied'),false);assert.equal(h.run('JSON.stringify([S.day,S.min,S.fatigue,S.food,S.water,S.flags,S.comps,S.pendingPresentation])'),before);}
// Catches partial naps accidentally using awake time or the full-sleep fatigue reset.
for(const minute of [400,840,1400])test(`partial naps exclude awake accrual and retain authored recovery at minute ${minute}`,()=>{
 for(const [id,ci,fatigue,want,elapsed]of [['crisis_drowsy',0,90,45,120],['ev_golf_clubhouse',1,40,34,60]]){
  const h=fixture(id,ci,{min:minute,fatigue});pay(h);assert.equal(h.run('result.ok'),true);assert.equal(h.run('S.fatigue'),want,id);assert.equal(h.run('S.day*1440+S.min-start'),elapsed);replay(h);
 }
});
test('overnight sleep restores drive-in fatigue and retains the film-set authored partial recovery',()=>{
 for(const [id,ci,want,elapsed]of [['loc_drivein',1,0,480],['loc_filmset',0,10,600]]){
  const h=fixture(id,ci,{min:1200,fatigue:40});pay(h);assert.equal(h.run('S.fatigue'),want,id);assert.equal(h.run('S.day*1440+S.min-start'),elapsed);replay(h);
 }
});
test('sleeping time still pays meal and water boundaries, injury does not add awake fatigue',()=>{
 const h=fixture('crisis_drowsy',0,{min:380,fatigue:90,food:0,water:16,_breakfastDay:0});h.run("G.addInjury('driver','부상',2)");assert(h.run("G.isInjured('driver')"));pay(h);
 assert.equal(h.run('S.hunger'),1);assert.equal(h.run('S.fatigue'),53);assert.equal(h.run('S.water'),15);replay(h);
 const b=fixture('crisis_drowsy',0,{min:400,fatigue:90});b.run("G.addInjury('driver','부상',2)");assert(b.run("G.isInjured('driver')"));pay(b);assert.equal(b.run('S.fatigue'),45);
 const c=fixture('crisis_drowsy',0,{min:400,fatigue:40});c.run("G.addInjury('driver','부상',2);G.advance(60)");assert.equal(c.run('S.fatigue'),43.24);
});
test('fatal midnight terminates partial sleeping effects and later rewards',()=>{
 const h=fixture('loc_filmset',0,{min:1400,fatigue:40,water:0,food:3,thirst:4});h.run('S.notes=[]');pay(h);assert.equal(h.run('S.ended'),true);assert.notEqual(h.run('S.pendingPresentation?.phase'),'result');assert.equal(h.run("S.notes.some(n=>n.title==='세트장 관리인')"),false);
 assert.equal(h.run('S.fatigue'),40); // No awake accrual and no post-fatal -30.
});
test('ordinary awake time and existing full sleep preserve their distinct rules',()=>{
 const h=setup();h.run('S.min=500;S.fatigue=40;G.advance(60)');assert.equal(h.run('S.fatigue'),42.7);
 const b=fixture('exp_temple',0,{min:500,fatigue:90});pay(b);assert.equal(b.run('S.fatigue'),0);replay(b);
});
test('Leo has a resource-free response without Minji, preserved indices, and a reachable next route',()=>{
 const h=fixture('initiative_leo_pause',2,{party:['leo'],food:0,fatigue:30});h.run('S.comps.leo.bond=6;S.comps.leo.mood=50;');
 assert.equal(h.run('G.reqOk(G.choiceReq(ev.choices[0])).ok'),false);assert.equal(h.run('G.reqOk(G.choiceReq(ev.choices[1])).ok'),false);
 assert(h.run('ev.choices.some(c=>G.reqVisible(G.choiceReq(c))&&G.reqOk(G.choiceReq(c)).ok)'));
 h.run('G.save();G.load()');pay(h);assert.equal(h.run('result.ok'),true);assert.equal(h.run('S.food'),0);assert.equal(h.run('S.water'),16);assert.equal(h.run('S.min'),400);replay(h);
 h.run('G.queuePresentation(null);S._chain=null;');assert(h.run('G.neighbors(S.at).some(n=>G.canTravelTo(n.id).ok)'));
});
test('fog waiting remains legal with zero food and never invents a meal',()=>{
 for(const food of [0,1,3]){const h=fixture('ev_fog_pass',2,{food,min:480});pay(h);assert.equal(h.run('result.ok'),true);assert.equal(h.run('S.food'),Math.max(0,food-1));assert.equal(h.run('S.min'),600);if(food===0)assert.doesNotMatch(h.run('result.out.text'),/먹을 것을 꺼|마지막 봉지|식사|먹었다/);replay(h);}
});
test('old paid sleep, Leo and fog receipts remain frozen and never repay after load',()=>{
 for(const [id,ci]of [['crisis_drowsy',0],['ev_golf_clubhouse',1],['loc_drivein',1],['loc_filmset',0],['initiative_leo_pause',0],['ev_fog_pass',2]]){
  const h=fixture(id,ci,{food:0,fatigue:83});h.run("S.pendingPresentation={version:1,eventId:ev.id,phase:'result',choiceIndex:ci,outcomeIndex:0,text:'옛 지급 원문',chips:[{t:'옛 정산'}],view:{turns:[{kind:'narration',text:'저장한 줄'}],index:0}};G.save();G.load();");pay(h);assert.equal(h.run('result.applied'),false);assert.equal(h.run('result.out.text'),'옛 지급 원문');assert.equal(h.run('S.fatigue'),83);replay(h);
 }
});
test('Leo guitar promise never invents a loan from Minji, including when she was never encountered',()=>{
 for(const party of [['leo'],['leo','eunsu'],['leo','minji']]){
  const h=fixture('talk_leo_21',0,{party});h.run('S.comps.leo.bond=25;S.used=[]');pay(h);
  assert.equal(h.run('result.ok'),true);assert.doesNotMatch(h.run('result.out.text'),/민지.*빌|두 번 빌/);
  assert.match(h.run('result.out.text'),/송곳/);assert(h.run("S.notes.some(n=>n.title==='기타 뒷판의 유언장')"));replay(h);
 }
 const old=fixture('talk_leo_21',0,{party:['leo']});old.run("S.pendingPresentation={version:1,eventId:ev.id,phase:'result',choiceIndex:0,outcomeIndex:0,text:'송곳이요. 민지한테 빌렸어요. 두 번 빌렸어요.',chips:[]};G.save();G.load()");pay(old);assert.equal(old.run('result.applied'),false);assert.match(old.run('result.out.text'),/민지한테 빌렸어요/);replay(old);
});
