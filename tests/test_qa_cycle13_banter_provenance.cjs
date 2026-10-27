const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
// Explicit provenance fixtures; none is counted as a natural expedition.
const rows=[
 ['우물 판 데 말이다','meet_welldigger','열두 번째 우물',['kangwoo'],1],
 ['재이 씨, 그때 2호기','duo_appraisal','고물과 전파',['jaeyi','eunsu']],
 ['은수 누나, 그 채보한','duo_mixtape','제목 없는 채보',['leo','eunsu']],
 ['국수 뽑고 나서','exp_noodleworks','신종 국수',['parkss'],1],
 ['판소리 어르신','meet_pansori','소리꾼',['leo']],
 ['……강릉에 병원','night_convoy','강릉행 호송대',['kangwoo']],
 ['그 0원 영수증','ai_gasstation','적립: 무한',['jaeyi'],1],
 ['…쇠파이프 쥐는 손보다','smith_again','세상에서 제일 진지한 휴업',['kangwoo'],1],
 ['대시보드의 그림','kids_letter','바퀴 다섯 개 달구지',[]],
 ['삼남매 큰애 말이야','kids_letter','바퀴 다섯 개 달구지',['parkss']],
 ['조수석 서랍에서 커피 향','exp_coffee','질소 충전의 기적',[]]
];
// Prefix aliases let the red run select the old unguarded text too.
function fixture(row){const h=setup();const prefix=row[0];h.run(`S.party=${JSON.stringify(row[3])};S.flags.photo_received=true;S.flags.armed_age=true;S.flags.kids_settled=true;S.flags.coffee_found=true;S.flags.smith_met=true;D.banter=[D.banter.find(b=>b.t.startsWith(${JSON.stringify(prefix)})||(${JSON.stringify(prefix)}==='재이 씨, 그때 2호기'&&b.t.startsWith('재이 씨, 어제 그 2호기'))||(${JSON.stringify(prefix)}==='…쇠파이프 쥐는 손보다'&&b.t.startsWith('작업대 만들 때는')))];globalThis.ev=event(${JSON.stringify(row[1])});`);assert(h.run('D.banter[0]&&ev'),row[1]);return h;}
function pick(h){h.run('G.resetDriveTimers()');return h.run('G.pickBanter()');}
function complete(h,index=0){h.run(`G.beginPresentation(ev);globalThis.c=ev.choices[${index}];globalThis.r=G.resolvePresentedChoice(ev,c)`);assert(h.run('r.ok&&r.applied'));}
for(const row of rows)test(row[0]+' requires its actual completed source and survives legacy reload',()=>{
 const h=fixture(row);assert.equal(pick(h),null,'unrelated broad flags are insufficient');h.run('S.used.push(ev.id);G.beginPresentation(ev)');assert.equal(pick(h),null,'opening alone is insufficient');
 complete(h);assert(h.run(`S.notes.some(n=>n.title===${JSON.stringify(row[2])})`));assert(pick(h));h.run('S.pendingPresentation=null;S.used=[];S.flags={};G.save()');assert(h.run('G.load()'));assert(pick(h),'exact historic completion note remains sufficient');
 if(row[4]!==undefined){const wrong=fixture(row);complete(wrong,row[4]);assert.equal(pick(wrong),null,'other completed choice does not prove this action');wrong.run('G.save();G.load()');assert.equal(pick(wrong),null);}
});
test('missing/nonarray legacy notes block callback without throwing or inventing a note',()=>{for(const notes of ['undefined','null','{}','[]','[null]']){const h=setup();h.run(`S.party=['minji'];D.banter=[D.banter.find(b=>b.t.startsWith('그 대필 편지'))];S.notes=${notes}`);assert.equal(pick(h),null,notes);}});
test('real current-source note array supports callbacks after save/load',()=>{const h=fixture(rows[0]);complete(h);h.run('G.save();G.load()');assert(pick(h));});
test('the receipt callback does not mistake a photo or another zero-price receipt for the infinite-points receipt',()=>{const h=fixture(rows[6]);h.run("G.addNote({title:'첫 방문 프로모션',body:'0원 결제'});G.save();G.load()");assert.equal(pick(h),null);});
test('coffee kept in the drawer stops being claimed after the last serving',()=>{const h=fixture(rows[10]);complete(h);assert(pick(h));h.run('S.flags.coffee_served=true;G.save();G.load()');assert.equal(pick(h),null);});
