const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
function fixture(id){const h=setup();h.run(`S.at='jeonju';S.day=4;S.min=540;S.food=24;S.water=28;S.fuel=25;S.party=[];S.notes=[];globalThis.e=event('${id}');G.beginPresentation(e);G.save();G.load();`);return h;}
function paid(h,index){h.run(`globalThis.r=G.resolvePresentedChoice(e,e.choices[${index}]);`);assert(h.run('r.ok'));const before=h.run('JSON.stringify([S.food,S.water,S.fuel,S.items,S.min,S.notes,S.flags])');h.run('G.save();G.load()');assert.equal(h.run(`G.resolvePresentedChoice(e,e.choices[${index}]).applied`),false);assert.equal(h.run('JSON.stringify([S.food,S.water,S.fuel,S.items,S.min,S.notes,S.flags])'),before);return h.run('r.out.text');}
test('bus-following result does not invent an exact extra twenty minutes while retaining costs and old paid words',()=>{
 const h=fixture('ai_bus');h.run('rng=()=>0;');const prose=paid(h,0);
 assert.doesNotMatch(prose,/20분|스무 분/);assert.match(prose,/차고지/);
 assert.equal(h.run('S.min'),540);assert.equal(h.run('S.fuel'),23);assert.equal(h.run('S.notes.at(-1).title'),'버스 차고지');
 h.run("S.pendingPresentation.text='버스는 20분을 달려 차고지에 들어갔다.';G.save();G.load();globalThis.old=G.resolvePresentedChoice(e,e.choices[0]);");
 assert.equal(h.run('old.applied'),false);assert.match(h.run('old.out.text'),/20분/);assert.equal(h.run('S.fuel'),23);
});
test('fire-station remaining-equipment outcome names the existing parts source',()=>{
 const h=fixture('ev_fire_station');h.run('rng=()=>0.99;globalThis.parts=S.items["부품"]||0;');const prose=paid(h,0);assert.match(prose,/방화복/);assert.match(prose,/예비.*부품/);assert.equal(h.run('S.items["부품"]-parts'),1);assert.equal(h.run('S.min'),575);
});
test('the departure key ring introduces both locks without altering either paid outcome',()=>{
 const h=setup();const entry=h.run("D.openingPresence.find(e=>e.id==='opening_departure').turns.map(t=>t.text).join(' ')");assert.match(entry,/공구함 열쇠와 셔터 열쇠/);
 const c=h.json("D.openingPresence.find(e=>e.id==='opening_departure').choices");assert.match(c[0].foreseeable.lasting,/작업장 열쇠/);assert.match(c[1].foreseeable.lasting,/작업장 열쇠/);assert.deepEqual(c.map(x=>[x.id,x.out[0].fx.time,x.out[0].fx.flag]),[['leave_key',10,'intro_workshop_left'],['keep_key',5,'intro_workshop_left']]);
});
test('relay completed through local contacts describes those contacts before any Suwon visit',()=>{
 const h=setup();h.run("S.at='sejong';S.flags={cell_sea:true,cell_dome:true,cell_ghost:true};G.save();G.load()");const row=h.json("G.departureSteps().find(r=>r.id==='relay')");assert(row.done);assert.doesNotMatch(row.detail,/수원/);for(const name of ['해도','돔','유령'])assert(row.detail.includes(name));assert.match(row.detail,/접촉/);
});
test('relay remote completion retains the actual Suwon response provenance',()=>{
 const h=setup();h.run('S.flags.main_relay_confirmed=true;G.save();G.load()');const row=h.json("G.departureSteps().find(r=>r.id==='relay')");assert(row.done);assert.match(row.detail,/수원/);assert.match(row.detail,/확인했다/);assert.equal(h.run('G.coreLinkedCells().length'),3);
});
test('nail-trap tire change keeps 70 minutes and avoids a half-day claim',()=>{
 const h=fixture('ev_nail_trap');const prose=paid(h,2);assert.doesNotMatch(prose,/한나절/);assert.match(prose,/한 시간/);assert.equal(h.run('S.min'),610);
});
test('guarded cache introduces the field map and copied-number link before the earned key',()=>{
 const h=fixture('story_parent_route_guarded');assert.match(h.run('S.pendingPresentation.text'),/배차실.*지도/);assert.match(h.run('S.pendingPresentation.text'),/베껴 둔 묶음 번호/);paid(h,0);assert.equal(h.run('S.items["부모님의 검증키"]'),1);assert(h.run('S.flags.parent_key_found'));
});
for(const [id,cost,duration]of [['crisis_nofuel',2,420],['crisis_nofuel2',3,540],['crisis_nofuel3',3,600]])test(`${id} forecasts capped emergency stocks while preserving food-free rescue`,()=>{
 const h=fixture(id);h.run('S.food=0;S.water=28;S.fuel=0;S.scrap=0;');assert.match(h.run('e.choices[0].foreseeable.expense'),new RegExp(`보유한.*최대 ${cost}.*끼니`));assert(h.run('G.reqOk(G.choiceReq(e.choices[0])).ok'));paid(h,0);assert.equal(h.run('S.food'),0);assert.equal(h.run('S.min'),540+duration);assert(h.run('S.fuel>0'));assert.equal(h.run('S.ended'),false);
});
for(const fixed of [false,true])test(`drive-in sound matches radio_fixed=${fixed} and does not repair it`,()=>{
 const h=fixture('loc_drivein');h.run(`S.flags.radio_fixed=${fixed}`);const prose=paid(h,0);
 if(fixed)assert.match(prose,/차 안에 소리까지/);else{assert.doesNotMatch(prose,/차 안에 소리까지/);assert.match(prose,/소리가 나지 않는 라디오/);}
 assert.equal(h.run('S.flags.radio_fixed'),fixed);assert.equal(h.run('S.fuel'),21);assert.equal(h.run('S.min'),690);assert.equal(h.run('S.notes.at(-1).title'),'달빛 상영회');
});
test('accepted board cards show deadline and next action, preserve proposal price and actual payout',()=>{
 const h=setup(),ui=fs.readFileSync(path.join(__dirname,'../src/07-ui.js'),'utf8');h.run("let curStl='miryang',stlQuests=[],marketSelection=null;const ITEM_ICO={};S.at='miryang';S.min=600;S.items['부품']=2;");h.run(ui.slice(ui.indexOf('  function marketFieldRows(){'),ui.indexOf('  function fieldBoardRow(')));
 const offers=h.json('marketFieldRows().questRows');assert(offers.some(r=>/고철/.test(r.meta)));h.run("G.acceptQuest({kind:'procure',from:'miryang',to:'miryang',need:{name:'부품',qty:2},reward:16,due:S.day+6});G.save();G.load()");const row=h.json('marketFieldRows().questRows[0]');assert.doesNotMatch(row.meta,/고철/);assert.match(row.meta,/D-/);assert.equal(row.action,'전달한다');assert(row.enabled);
 const scrap=h.run('S.scrap');assert(h.run('G.checkQuest()'));assert.equal(h.run('S.scrap')-scrap,20);assert.equal(h.run('S.items["부품"]'),0);h.run('G.save();G.load()');assert.equal(h.run('G.checkQuest()'),false);assert.equal(h.run('S.scrap')-scrap,20);
});
test('legacy paid prose and notes are preserved for all changed narrative results',()=>{
 for(const [id,index]of [['ev_fire_station',0],['ev_nail_trap',2],['story_parent_route_guarded',0],['loc_drivein',0],['crisis_nofuel3',0]]){
  const h=fixture(id);h.run(`S.notes=[{title:'옛 기록',body:'원래 기록'}];S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:${index},outcomeIndex:0,text:'이미 읽은 결과',chips:[],view:{turns:[{kind:'narration',text:'이미 읽은 결과'}],index:0}};G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[${index}]);`);assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),'이미 읽은 결과');assert.equal(h.run('S.notes[0].body'),'원래 기록');
 }
});
