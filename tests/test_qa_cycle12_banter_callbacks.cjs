const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
// Deliberate boundary fixtures, separate from the cycle12 natural journey.
const cases=[
 {event:'meet_scribe',prefix:'그 대필 편지 말이야',title:'미래의 우리에게'},
 {event:'duo_mechsong',prefix:'레오, 그 19mm 왈츠',title:'19mm의 왈츠'}
];
function fixture(row){const h=setup();h.run(`S.party=['minji','leo'];D.banter=[D.banter.find(b=>b.t.startsWith(${JSON.stringify(row.prefix)}))];globalThis.ev=event(${JSON.stringify(row.event)});`);return h;}
function pick(h){h.run('G.resetDriveTimers()');return h.run('G.pickBanter()');}
function choose(h,index){h.run(`G.beginPresentation(ev);globalThis.choice=ev.choices[${index}];globalThis.result=G.resolvePresentedChoice(ev,choice);`);assert(h.run('result.ok&&result.applied'));}
for(const row of cases){
 test(row.event+' callback requires completed source, not merely entry or used history',()=>{
  const h=fixture(row);assert.equal(pick(h),null);h.run('G.beginPresentation(ev);S.used.push(ev.id)');assert.equal(pick(h),null);
  h.run('G.save();G.load()');assert.equal(pick(h),null);
 });
 test(row.event+' paid source permits callback and survives saved result replay without duplicate payment',()=>{
  const h=fixture(row);choose(h,0);assert(h.run(`S.notes.some(n=>n.title===${JSON.stringify(row.title)})`));assert(pick(h));
  const before=h.run('JSON.stringify([S.scrap,S.notes,S.day,S.min,S.van])');h.run('G.save();G.load();globalThis.replay=G.resolvePresentedChoice(ev,choice)');
  assert.equal(h.run('replay.applied'),false);assert.equal(h.run('JSON.stringify([S.scrap,S.notes,S.day,S.min,S.van])'),before);assert(pick(h));
 });
 test(row.event+' legacy exact completion note remains sufficient without inventing new flags',()=>{
  const h=fixture(row);choose(h,0);h.run('S.pendingPresentation=null;S.used=[];G.save();G.load()');assert(pick(h));
  h.run(`S.notes=S.notes.filter(n=>n.title!==${JSON.stringify(row.title)});G.addNote({title:'비슷하지만 다른 기록',body:${JSON.stringify(row.title)}});G.save();G.load()`);assert.equal(pick(h),null);
 });
}
test('free spelling consultation does not create the paid letter callback',()=>{
 const h=fixture(cases[0]);choose(h,1);assert.equal(pick(h),null);h.run('G.save();G.load()');assert.equal(pick(h),null);
});
test('a later companion may read the saved letter without claiming to have dictated it',()=>{
 const h=fixture(cases[0]);h.run('S.party=[]');choose(h,0);assert.equal(pick(h),null);h.run("S.party=['minji'];G.save();G.load()");
 const line=pick(h);assert(line);assert.doesNotMatch(line.t,/내가 부른/);assert.match(line.t,/여기까지 온 건 진짜다/);
});
