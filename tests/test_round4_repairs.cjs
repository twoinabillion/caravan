const test=require('node:test'),assert=require('node:assert/strict');
const {setup:engineSetup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const setup=()=>{const h=engineSetup();h.run('G.save();G.load();');return h;};
const baseline=require('../qa-artifacts/round4-repairs-20261020/before.json');
const paid=(h,id,ci=0)=>h.run(`globalThis.e=event('${id}');G.beginPresentation(e);globalThis.p=G.resolvePresentedChoice(e,e.choices[${ci}]);`);
const reload=(h)=>{
 const receipt=h.run('JSON.stringify(S.pendingPresentation)'),resources=h.run('JSON.stringify([S.day,S.min,S.items,S.food,S.water,S.scrap,S.van,S.flags])');
 assert(h.run('G.save();G.load()'));assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[S.pendingPresentation.choiceIndex]).applied'),false);
 assert.equal(h.run('JSON.stringify(S.pendingPresentation)'),receipt);assert.equal(h.run('JSON.stringify([S.day,S.min,S.items,S.food,S.water,S.scrap,S.van,S.flags])'),resources);
};
test('round4 permits only the explicit one-medicine consumption delta',()=>{
 const h=setup(),rows=h.json(`JSON.parse(JSON.stringify(${JSON.stringify(baseline.ids)}.map(id=>event(id)),(key,value)=>['text','label','turnSpeakers','turns','readingRecord','note'].includes(key)?undefined:value))`);
 const fx=rows.find(e=>e.id==='ev_mobile_clinic').choices[0].out[0].fx;
 assert.deepEqual(fx.item,{'의약품':-1});delete fx.item;
 assert.deepEqual(rows,baseline.mechanics);
});
test('medicine gift pays one item exactly once and keeps the existing alternate choices',()=>{
 const h=setup();h.run(`S.items['의약품']=2;S.party=['minji'];`);paid(h,'ev_mobile_clinic');
 assert(h.run('p.ok&&p.applied'));assert.equal(h.run('S.items["의약품"]'),1);
 assert.match(h.run('e.choices[0].label'),/1개/);assert.doesNotMatch(h.run('p.out.text'),/절반/);
 assert.match(h.run('G.reqCostText(e.choices[0].req)'),/의약품/);reload(h);
 const no=setup();no.run(`S.items['의약품']=0;`);paid(no,'ev_mobile_clinic');assert.equal(no.run('p.ok'),false);
 const cancel=setup();cancel.run(`S.items['의약품']=2;`);paid(cancel,'ev_mobile_clinic',2);assert.equal(cancel.run('S.items["의약품"]'),2);
 const park=setup();park.run(`S.party=['parkss'];S.items['의약품']=2;`);paid(park,'ev_mobile_clinic',1);assert.equal(park.run('S.items["의약품"]'),3);
});
test('unpaid medicine entry rechecks inventory after reload, existing thrift perk still owns its waiver',()=>{
 const h=setup();h.run(`S.items['의약품']=1;globalThis.e=event('ev_mobile_clinic');G.beginPresentation(e);S.items['의약품']=0;G.save();G.load();`);
 assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[0]).ok'),false);
 const perk=setup();perk.run(`S.items['의약품']=2;G.hasPerk=id=>id==='pss_thrift';rng=()=>0;`);paid(perk,'ev_mobile_clinic');
 assert.equal(perk.run('S.items["의약품"]'),2);assert(perk.json('p.chips').some(c=>/알뜰 처방/.test(c.t)));reload(perk);
});
test('three moving incidents cannot be drawn by stopped camp; road requirements are otherwise unchanged',()=>{
 const h=setup();h.run(`S.party=['kangwoo','eunsu'];S.comps.kangwoo.bond=10;S.pursuit=2;S.at='cheongju';`);
 for(const id of ['initiative_kangwoo_route','comp_brake','ev_carsick_comp']){
  assert.deepEqual(h.json(`D.eventLocations['${id}']`),{kind:'road'});
  assert.equal(h.run(`G.eligible('동행').some(e=>e.id==='${id}')`),false);
  h.run(`S.at=null;S.driving={from:'sangju',to:'mungyeong',gone:10,dist:50,slots:[],si:0,road:'rough'};`);
  assert.equal(h.run(`G.eligible('동행').some(e=>e.id==='${id}')`),true);
  h.run(`S.driving=null;S.at='cheongju';`);
 }
 h.run(`G.openEvent=ev=>{globalThis.campEvent=ev.id;};S.min=1200;G.camp();`);
 assert(!['initiative_kangwoo_route','comp_brake','ev_carsick_comp'].includes(h.run('globalThis.campEvent')));
});
test('ridge opening stays queued in Gimcheon across reload and does not block another story',()=>{
 const h=setup();h.run(`S.at='gimcheon';G.chooseRoute('ridge');G.queueStory('talkr_leo_1');`);
 assert.equal(h.run('G.popStory()'),'talkr_leo_1');
 assert.deepEqual(h.json('S._storyQueue'),['route_ridge_rescue']);
 assert.equal(h.run('G.popStory()'),null);assert(h.run('G.save();G.load()'));
 assert.deepEqual(h.json('S._storyQueue'),['route_ridge_rescue']);
 h.run(`S.at=null;S.driving={from:'gimcheon',to:'sangju',gone:10,dist:40};`);
 assert.equal(h.run('G.popStory()'),null);
 h.run(`S.driving=null;S.at='sangju';`);assert.equal(h.run('G.popStory()'),'route_ridge_rescue');
 assert.equal(h.run('G.popStory()'),null);
});
test('unpaid old ridge presentation/transition defers without erasing used history, completed/paid work does not rewind',()=>{
 for(const phase of ['event','transition']){
  const h=setup();h.run(`S.at='gimcheon';G.chooseRoute('ridge');S._storyQueue=[];S.used.push('route_ridge_rescue');S.pendingPresentation={version:1,phase:'${phase}',eventId:'route_ridge_rescue',text:'상주를 벗어난 능선'};G.save();G.load();G.resumePresentation();`);
  assert.equal(h.run('S.pendingPresentation'),null);assert(h.run(`S.used.includes('route_ridge_rescue')`));
  assert.deepEqual(h.json('S._storyQueue'),['route_ridge_rescue']);
  h.run(`S.at='sangju';`);assert.equal(h.run('G.popStory()'),'route_ridge_rescue');
 }
 const done=setup();done.run(`S.at='sangju';S.flags.route_ridge_saved_partial=true;S.used.push('route_ridge_rescue');S._storyQueue=['route_ridge_rescue'];`);
 assert.equal(done.run('G.popStory()'),null);
 const paidOld=setup();paidOld.run(`S.at='gimcheon';G.chooseRoute('ridge');S._storyQueue=[];`);paid(paidOld,'route_ridge_rescue');reload(paidOld);
 assert.equal(paidOld.run('G.queuePresentation(S._chain)'),'route_ridge_anchor');
 assert.equal(paidOld.run('G.presentTransition()'),true);
});
test('fresh Sangju rescue follows all three existing steps, persists and leaves the next action',()=>{
 const h=setup();h.run(`S.at='sangju';G.chooseRoute('ridge');globalThis.id=G.popStory();`);assert.equal(h.run('id'),'route_ridge_rescue');
 for(const id of ['route_ridge_rescue','route_ridge_anchor','route_ridge_extract']){
  paid(h,id);assert(h.run('p.ok'));reload(h);h.run('G.queuePresentation(S._chain);G.presentTransition();');
 }
 assert(h.run(`S.flags.route_ridge_saved||S.flags.route_ridge_saved_partial||S.flags.route_ridge_failed`));
 assert.equal(h.run('S.pendingPresentation'),null);assert(h.run('G.exploreStatus().ok'));
});
test('real arrival handoff opens ridge at Sangju rather than Gimcheon, and retains it behind an earlier local event',()=>{
 const h=setup();h.run(`S.at='gimcheon';G.chooseRoute('ridge');globalThis.opened=[];G.openEvent=ev=>opened.push(ev.id);S.pendingArrival='gimcheon';G.finishArrival('gimcheon');`);
 assert(!h.json('opened').includes('route_ridge_rescue'));assert(h.json('S._storyQueue').includes('route_ridge_rescue'));
 h.run(`S.at='sangju';S.pendingArrival='sangju';G.finishArrival('sangju');`);
 // An existing local event may own the first arrival beat. Closing it checks
 // the same story queue; the opening must not be charged as a paid exploration.
 if(!h.json('opened').includes('route_ridge_rescue'))h.run(`globalThis.next=G.popStory();G.openEventById(next);`);
 assert(h.json('opened').includes('route_ridge_rescue'));
});
test('legitimate road entries resume unanswered and keep their one paid receipt',()=>{
 for(const id of ['initiative_kangwoo_route','comp_brake','ev_carsick_comp']){
  const h=setup();h.run(`S.party=['kangwoo','eunsu'];S.comps.kangwoo.bond=10;S.at=null;S.driving={from:'sangju',to:'mungyeong',gone:10,dist:50,slots:[],si:0,road:'rough',wx:'clear'};globalThis.e=event('${id}');G.beginPresentation(e);G.save();G.load();`);
  const before=h.run('JSON.stringify([S.day,S.min,S.items,S.fuel,S.driving])');
  assert.equal(h.run('G.resumePresentation()'),true);assert.equal(h.run('JSON.stringify([S.day,S.min,S.items,S.fuel,S.driving])'),before);
  h.run('globalThis.p=G.resolvePresentedChoice(e,e.choices[0]);');assert(h.run('p.ok'));reload(h);
 }
});
test('garden roster only prints Bori when the dog is actually aboard, rewards and replay unchanged',()=>{
 for(const dog of [false,true]){
  const h=setup();h.run(`S.up.garden=true;S.party=['minji','kangwoo'];S.dog=${dog};S.food=5;`);paid(h,'up_garden_roster');
  assert.equal(/보리/.test(h.run('p.out.text')),dog);assert.equal(h.run('S.food'),6);assert(h.run('S.flags.garden_roster'));reload(h);
 }
});
test('brief labor and rainy roof talk do not invent an hour or an afternoon',()=>{
 for(const min of [390,900,1320])for(const id of ['gw_gangneung','talk_leo_11']){
  const h=setup();h.run(`S.at='gangneung';S.party=['leo'];S.wx='rain';S.min=${min};`);paid(h,id);
  assert.equal(h.run('S.min'),min);assert.doesNotMatch(h.run('p.out.text'),/한 시간 벽돌|된 오후/);reload(h);
 }
});
test('graffiti shows the same arrows and distance marks decoded by Kangwoo, with human confirmation not guaranteed safety',()=>{
 const h=setup();h.run(`S.party=['kangwoo'];globalThis.e=event('ev_resistance_graffiti');`);
 assert.match(h.run('e.text'),/화살표/);assert.match(h.run('e.text'),/숫자/);assert.doesNotMatch(h.run('e.text'),/화살표 대신/);
 assert.match(h.run('e.choices[0].out[0].text'),/확인/);assert.match(h.run('e.choices[0].out[0].fx.note.body'),/확인/);
 assert.deepEqual(h.json("buildStoryTurns(e.choices[0].out[0].text,e,{turnSpeakers:e.choices[0].out[0].turnSpeakers}).filter(t=>t.kind==='dialogue').map(t=>t.who)"),['kangwoo','kangwoo']);
 for(const [ci,oi] of [[0,0],[1,0],[1,1],[2,0]]){
  h.run(`globalThis.out=e.choices[${ci}].out[${oi}];`);
  assert.doesNotMatch(h.run('out.text'),/감시 없음/);
  const turns=h.json('buildStoryTurns(out.text,e,{turnSpeakers:out.turnSpeakers})');assert(turns.length);
 }
});
test('all nine old paid text-only receipts keep their own prose, time, inventory and result chips',()=>{
 for(const id of baseline.ids){
  const h=setup();h.run(`S.party=['kangwoo','eunsu','leo'];S.items['의약품']=2;S.up.garden=true;globalThis.e=event('${id}');
   S.pendingPresentation={version:1,phase:'result',eventId:e.id,choiceIndex:0,outcomeIndex:0,text:'옛 지급 결과 ${id}',chips:[{t:'옛 지급',c:'item'}]};G.save();G.load();globalThis.p=G.resolvePresentedChoice(e,e.choices[0]);`);
  assert.equal(h.run('p.applied'),false);assert.equal(h.run('p.out.text'),'옛 지급 결과 '+id);assert.equal(h.run('S.items["의약품"]'),2);reload(h);
 }
});
test('public field action observation includes UI requirements, never hidden results or effects',()=>{
 const {fieldActions}=require('../tools/persona-observer.cjs');
 const h=setup();h.run(`S.at='miryang';globalThis.observerArgs={G,S,D};`);
 const args=h.run('observerArgs'),before=h.run('JSON.stringify(S)');
 const rows=fieldActions(args.G,args.D.stls.miryang,'miryang');
 const noodles=rows.find(a=>a.id==='noodles');assert(noodles);
 assert.equal(noodles.cost,h.run(`G.reqCostText(D.stls.miryang.field.actions.find(a=>a.id==='noodles').req)`));
 assert.match(noodles.cost,/고철/);
 for(const row of rows)assert.deepEqual(Object.keys(row).sort(),['cost','description','id','label','status','time']);
 assert.equal(h.run('JSON.stringify(S)'),before);
});
