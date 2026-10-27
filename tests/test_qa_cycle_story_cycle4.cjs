const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
function fixture(id){const h=setup();h.run(`S.at='suwon';S.day=8;S.min=600;S.food=24;S.water=28;S.party=['leo','kangwoo','eunsu'];S.used=[];S.notes=[];globalThis.e=event('${id}');G.beginPresentation(e);G.save();G.load();`);return h;}
function replay(h,index){const before=h.run('JSON.stringify([S.food,S.water,S.scrap,S.van,S.items,S.min,S.flags,S.notes])');h.run('G.save();G.load()');assert.equal(h.run(`G.resolvePresentedChoice(e,e.choices[${index}]).applied`),false);assert.equal(h.run('JSON.stringify([S.food,S.water,S.scrap,S.van,S.items,S.min,S.flags,S.notes])'),before);}
test('mall reached from Taeho rumor does not invent an acquired child map in entry, success, or note',()=>{
 const h=fixture('loc_mall');h.run("S.flags.rumor_taeho=true;rng=()=>0;globalThis.before={time:S.min,scrap:S.scrap};");assert.doesNotMatch(h.run('S.pendingPresentation.text'),/크레용|스케치북|별표/);h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');assert(h.run('r.ok'));assert.doesNotMatch(h.run('r.out.text'),/스케치북|크레용|아이에게/);assert.doesNotMatch(h.run('JSON.stringify(S.notes)'),/크레용|아이야|별표/);assert.equal(h.run('S.min-before.time'),60);assert.equal(h.run('S.scrap-before.scrap'),8);replay(h,0);
});
test('Minji mall result uses a source-neutral new note without changing rewards',()=>{
 const h=fixture('loc_mall');h.run("S.party=['minji'];globalThis.oldScrap=S.scrap");h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[1])');assert(h.run('r.ok'));assert.equal(h.run('S.scrap-oldScrap'),10);assert.equal(h.run('S.notes.at(-1).title'),'지하 창고의 보물');replay(h,1);
});
test('Eunsu may introduce control terms before any first-lesson event',()=>{
 const h=fixture('talk_es_18');assert.doesNotMatch(h.run('S.pendingPresentation.text'),/또 열렸다|이번엔 심화반/);assert.doesNotMatch(h.run('e.title'),/심화/);h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');assert(h.run('r.ok'));assert.doesNotMatch(h.run('r.out.text'),/그날부터/);assert.match(h.run('r.out.text'),/배운 지 몇 분/);replay(h,0);
});
for(const index of [0,1])test(`transfer finale choice ${index} follows actual linked groups and omits unconnected Ium`,()=>{
 const h=fixture('seoul_night');h.run("S.flags={core_decided:true,core_transfer:true,cell_sea:true,cell_dome:true,cell_ghost:true};G.queuePresentation(null);G.beginPresentation(e);G.save();G.load();");
 const source=h.run(`prose(e.choices[${index}].out[0].text)`);assert.doesNotMatch(source,/이음망 채널/);assert.match(source,/해도.*돔.*유령/);
 h.run(`globalThis.r=G.resolvePresentedChoice(e,e.choices[${index}])`);assert(h.run('r.ok'));assert.doesNotMatch(h.run('r.out.text'),/이음망 채널/);assert.match(h.run('r.out.text'),/해도.*돔.*유령/);replay(h,index);
});
test('hand-signal lesson ends with current practice rather than completed later habits',()=>{
 const h=fixture('talk_kw_17');h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');assert.doesNotMatch(h.run('r.out.text'),/그날부터|보게 됐다/);assert.match(h.run('r.out.text'),/손을 보고/);assert.equal(h.run('S.min'),600);replay(h,0);
});
test('woodshop choice names taking the tools it grants',()=>{
 const h=fixture('exp_woodshop');assert.match(h.run('e.choices[0].label'),/챙긴다/);assert.doesNotMatch(h.run('e.choices[0].label'),/빌린다/);h.run('globalThis.parts=S.items["부품"];globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');assert.match(h.run('r.out.text'),/챙겼다/);assert.equal(h.run('S.items["부품"]-parts'),1);replay(h,0);
});
test('all five corrections preserve historical paid prose, note text and effects',()=>{
 for(const [id,index]of [['loc_mall',0],['loc_mall',1],['talk_es_18',0],['seoul_night',0],['seoul_night',1],['talk_kw_17',0],['exp_woodshop',0]]){
  const h=fixture(id);h.run(`S.notes=[{title:'별표의 보물',body:'크레용 지도는 진짜였다. 아이야, 고마워.'}];S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:${index},outcomeIndex:0,text:'이미 지급한 옛 결과',chips:[],view:{turns:[{kind:'narration',text:'이미 지급한 옛 결과'}],index:0}};G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[${index}]);`);assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),'이미 지급한 옛 결과');assert.equal(h.run('S.notes[0].title'),'별표의 보물');assert.equal(h.run('S.notes[0].body'),'크레용 지도는 진짜였다. 아이야, 고마워.');
 }
});
