// Actual engine and extracted production UI handlers; isolated storage/DOM sinks.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const {harness,select,htmlFacts}=require('../qa-artifacts/gap-ten-20261021/agent06/qa-crafting.cjs');
const state=h=>h.run('JSON.stringify([S.day,S.min,S.scrap,S.fuel,S.items,S.injuries,S.ended,S.pendingPresentation])');
const base=()=>harness("S.min=600;S.scrap=40;S.items['부품']=3;S.fuel=10;S.food=12;S.water=12;S.thirst=0;S.fatigue=0;");
test('terminal crafting never reopens its sheet or pays again through stale controls',()=>{
 const h=base();h.run('S.min=1430;S.water=0;S.thirst=3;S._breakfastDay=S.day;S._lunchDay=S.day;');select(h,'pipe');
 h.run('globalThis.staleMake=qaButtons.make.onclick;qaCalls.length=0;staleMake()');
 assert.equal(h.run('S.ended'),true);assert.equal(h.run('qaOpen'),false);
 assert.deepEqual(h.json('qaCalls'),['ending']);
 const after=state(h),archive=h.store.get('seoul400_quality_archive_v1');
 h.run("staleMake();showCraft({selected:'pipe'});");assert.equal(h.run("G.craft('pipe')"),false);
 assert.equal(state(h),after);assert.equal(h.run('qaOpen'),false);
 assert.equal(h.store.get('seoul400_quality_archive_v1'),archive);assert(!h.store.has('seoul400_save_v1'));
});
test('weapon shelf quote, UI gate and payment agree at each discounted threshold',()=>{
 for(const[id,cost,parts,fuel,item,qty]of [['pipe',5,0,0,'쇠파이프',1],['xbow',10,1,0,'석궁',1],['bolt',3,0,0,'볼트',3],['molotov',2,0,2,'화염병',2],['ammo',7,1,0,'탄약',2]]){
  const h=base();h.run(`S.up.armory=true;S.scrap=${cost};S.items={부품:3,의약품:0,탄약:0};`);select(h,id);
  assert.equal(htmlFacts(h).disabled,false,id+' discounted amount must suffice');
  assert.equal(htmlFacts(h).costs.at(3)[1],String(cost),id+' visible scrap quote');
  h.run('qaButtons.make.onclick()');assert.equal(h.run('S.scrap'),0);assert.equal(h.run('S.min'),620);
  assert.equal(h.run("S.items['부품']"),3-parts);assert.equal(h.run('S.fuel'),10-fuel);assert.equal(h.run(`S.items[${JSON.stringify(item)}]`),qty);
  const after=state(h);assert(h.run('G.load()'));assert.equal(state(h),after);
  h.run('qaButtons.close.onclick()');assert.equal(h.run('qaOpen'),false);assert(h.run("G.canTravelTo('chungju').ok"));
  const b=base();b.run(`S.up.armory=true;S.scrap=${cost-1};`);const before=state(b);assert.equal(b.run(`G.craft('${id}')`),false);assert.equal(state(b),before);
 }
});
test('ordinary crafting retains base prices, fuel reserve, cancellation and repeat behavior',()=>{
 const h=base();h.run("S.up.armory=false;S.scrap=6;");select(h,'pipe');const before=state(h);h.run('qaButtons.close.onclick()');assert.equal(state(h),before);
 select(h,'pipe');h.run('qaButtons.make.onclick()');assert.equal(h.run('S.scrap'),0);assert.equal(h.run('S.min'),640);
 h.run("S.scrap=6;qaButtons.make.onclick()");assert.equal(h.run("S.items['쇠파이프']"),2);assert.equal(h.run('S.min'),680);
 for(const [fuel,ok]of [[4.99,false],[5,true]]){const b=base();b.run(`S.fuel=${fuel}`);select(b,'molotov');assert.match(b.run('qaSheet.innerHTML'),/연료 5L 이상 필요 · 2L 소모 · 3L 여유/);assert.equal(b.run("G.craft('molotov')"),ok);assert.equal(b.run('S.fuel'),ok?3:fuel);}
});
test('Park treatment heals the patient driver even when Kangwoo has a longer injury, once across reload',()=>{
 const h=setup();h.run("S.party=['parkss','kangwoo'];S.comps.parkss.bond=5;S.items['의약품']=2;S.day=1;S.min=600;S.food=6;S.water=6;S.injuries={};G.addInjury('driver','driver',2);G.addInjury('kangwoo','kangwoo',3);globalThis.e=event('initiative_parkss_check');G.beginPresentation(e);globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);");
 assert.equal(h.run("G.isInjured('driver')"),false);assert.equal(h.run('S.injuries.kangwoo.days'),3);assert.equal(h.run("S.items['의약품']"),1);assert.equal(h.run('S.min'),635);
 assert(h.json('r.chips').some(c=>c.t.includes('부상 처치')&&!c.t.includes('강우')));
 const after=state(h);assert(h.run('G.save();G.load()'));assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[0]).applied'),false);assert.equal(state(h),after);
 h.run('G.queuePresentation(null)');assert(h.run("G.startTravel('yangsan')"));
});
test('legacy paid wrong-target treatment remains frozen and is never compensated or reapplied',()=>{
 const h=setup();h.run("S.party=['parkss','kangwoo'];S.items['의약품']=1;G.addInjury('driver','old injury',2);globalThis.e=event('initiative_parkss_check');S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:0,outcomeIndex:0,text:'이미 받은 진료 기록',chips:[{t:'강우 부상 처치',c:'plus'}]};G.save();G.load();");
 const after=state(h);const r=h.json('G.resolvePresentedChoice(e,e.choices[0])');assert.equal(r.applied,false);assert.equal(r.out.text,'이미 받은 진료 기록');assert.equal(r.chips[0].t,'강우 부상 처치');assert.equal(state(h),after);
});
test('two-o-clock live broadcast is selected only in the matching hour; unrelated broadcasts remain available',()=>{
 for(const[min,allowed]of [[0,false],[119.99,false],[120,true],[179.99,true],[180,false],[1170,false],[1439,false]]){
  const h=setup();h.run(`S.min=${min};S.at='busan';S.flags={};rng=()=>0;lastRadio=null;`);
  const r=h.json('G.pickRadio()');assert.equal(r?.key==='radio_dj_open',allowed,'minute '+min);assert(r,'other broadcasts remain at '+min);
 }
});
const terminalTools=require('../qa-artifacts/qa-cycle-20261026/cycle2/systems/terminal-tools-audit.cjs');
for(const kind of ['radio','repair','upgrade','settlement-repair'])test(`${kind} stops completion UI after fatal time and rejects old controls and direct calls`,()=>{
 const {fixture,installRoad,installGarage,snap}=terminalTools;
 for(const mode of ['during','stale']){
  const h=fixture();kind==='radio'||kind==='repair'?installRoad(h,kind):installGarage(h,kind==='upgrade'?'upgrade':'repair');
  if(mode==='stale')h.run('G.advance(40);calls.length=0');const before=snap(h);
  h.run('button.onclick()');assert.equal(h.run('S.ended'),true);assert.deepEqual(h.json('calls'),mode==='during'?['ending']:[]);
  if(mode==='stale')assert.deepEqual(snap(h),before);
  const ended=snap(h),archive=h.store.get('seoul400_quality_archive_v1');
  const call={radio:'G.fixRadio()',repair:'G.fieldRepair()',upgrade:"G.buyUpgrade('bench')",'settlement-repair':'G.settlementRepair().ok'}[kind];
  assert.equal(h.run(call),false);assert.deepEqual(snap(h),ended);assert.equal(h.store.get('seoul400_quality_archive_v1'),archive);assert(!h.store.has('seoul400_save_v1'));
 }
});
test('guarded tools retain normal costs, elapsed work, usable completion UI and save/load',()=>{
 for(const[kind,time,scrap,van,parts,expectedCalls]of [['radio',40,100,10,10,['audio:radio','render']],['repair',100,100,45,9,['audio:repair']],['upgrade',300,88,10,9,['garage','hud','install']],['settlement-repair',180,92,40,10,['audio:repair','hud','garage']]]){
  const h=terminalTools.fixture();h.run("G.save();G.load();S.min=500;S.water=24;S.food=20;S.thirst=0;S.items['의약품']=0;S.items['탄약']=0;");kind==='radio'||kind==='repair'?terminalTools.installRoad(h,kind):terminalTools.installGarage(h,kind==='upgrade'?'upgrade':'repair');
  h.run('button.onclick()');assert.equal(h.run('S.ended'),false);assert.equal(h.run('S.min'),500+time);assert.equal(h.run('S.scrap'),scrap);assert.equal(h.run('S.van'),van);assert.equal(h.run("S.items['부품']"),parts);assert.deepEqual(h.json('calls'),expectedCalls);
  const before=terminalTools.snap(h);assert(h.run('G.save();G.load()'));assert.deepEqual(terminalTools.snap(h),before);
 }
});
test('comic-room borrowing requires its displayed two scrap and pays once at the exact boundary',()=>{
 for(const scrap of [0,1,2]){
  const h=setup();h.run(`S.party=['leo'];S.comps.leo.mood=50;S.scrap=${scrap};globalThis.e=event('exp_comicroom');G.beginPresentation(e);`);
  const before=state(h),allowed=scrap>=2;
  assert.equal(h.run('G.reqOk(G.choiceReq(e.choices[1])).ok'),allowed,'scrap '+scrap);
  h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[1]);');
  assert.equal(h.run('r.ok'),allowed);
  if(!allowed){assert.equal(state(h),before);assert.equal(h.run('S.comps.leo.mood'),50);continue;}
  assert.match(h.run('e.choices[1].label'),/고철 2/);assert.match(h.run('G.reqCostText(G.choiceReq(e.choices[1]))'),/고철 2/);
  assert.equal(h.run('S.scrap'),0);assert.equal(h.run('S.comps.leo.mood'),55);
  const paid=state(h);assert(h.run('G.save();G.load()'));assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[1]).applied'),false);assert.equal(state(h),paid);assert.equal(h.run('S.comps.leo.mood'),55);
  h.run('G.queuePresentation(null)');assert(h.run("G.startTravel('yangsan')"));
 }
});
test('legacy paid comic-room receipt remains readable at zero scrap without repricing or repeated morale',()=>{
 const h=setup();h.run("S.party=['leo'];S.comps.leo.mood=55;S.scrap=0;globalThis.e=event('exp_comicroom');S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:1,outcomeIndex:0,text:'이미 빌린 만화책의 기록',chips:[{t:'고철 0',c:'item'},{t:'사기 +5',c:'plus'}]};G.save();G.load();");
 const before=state(h),r=h.json('G.resolvePresentedChoice(e,e.choices[1])');
 assert.equal(r.applied,false);assert.equal(r.out.text,'이미 빌린 만화책의 기록');assert.deepEqual(r.chips,[{t:'고철 0',c:'item'},{t:'사기 +5',c:'plus'}]);assert.equal(state(h),before);assert.equal(h.run('S.comps.leo.mood'),55);
});
const marketTools=require('../qa-artifacts/qa-cycle-20261026/cycle3/systems/crossreview-terminal.cjs');
test('road exploration suppresses its completion audio when its elapsed time ends the journey',()=>{
 const h=terminalTools.fixture();terminalTools.installRoad(h,'explore');assert(h.run('G.exploreStatus().ok'));
 h.run('button.onclick()');assert(h.run('S.ended'));assert.deepEqual(h.json('calls'),['ending']);
});
for(const kind of ['trade','bundle','sell'])test(`ended market ${kind} rejects captured UI and direct engine calls without touching the archive`,()=>{
 const h=marketTools.marketFixture(kind);h.run('G.advance(40);calls.length=0');assert(h.run('S.ended'));
 const before=marketTools.snap(h),archive=h.store.get('seoul400_quality_archive_v1');h.run('button.onclick()');
 assert.deepEqual(h.json('calls'),[]);assert.deepEqual(marketTools.snap(h),before);
 const call={trade:"G.trade('miryang',0)",bundle:"G.tradeBundle('miryang')",sell:"G.sellToDemand('miryang')"}[kind];
 assert.equal(h.run(call+'.ok'),false);assert.deepEqual(marketTools.snap(h),before);assert.equal(h.store.get('seoul400_quality_archive_v1'),archive);assert(!h.store.has('seoul400_save_v1'));
});
test('market trade, bundle and surplus sale keep normal settlement quotes, completion and reload',()=>{
 for(const[kind,minutes,expected]of [['trade',25,{scrap:93,fuel:20,water:6,food:6,meds:2}],['bundle',40,{scrap:96,fuel:10,water:11,food:8,meds:2}],['sell',20,{scrap:109,fuel:10,water:6,food:6,meds:1}]]){
  const h=marketTools.marketFixture(kind);h.run('G.save();G.load();S.min=600;S.water=6;S.thirst=0;calls.length=0;');h.run('button.onclick()');
  assert.equal(h.run('S.ended'),false);assert.equal(h.run('S.min'),600+minutes);
  assert.deepEqual(h.json("({scrap:S.scrap,fuel:S.fuel,water:S.water,food:S.food,meds:S.items['의약품']})"),expected);
  assert.deepEqual(h.json('calls'),['audio:trade','toast','hud','market']);const paid=marketTools.snap(h);assert(h.run('G.save();G.load()'));assert.deepEqual(marketTools.snap(h),paid);
 }
});
