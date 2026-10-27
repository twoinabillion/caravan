const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup:engineSetup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const baseline=require('../qa-artifacts/full-audit-repairs-20261020/before.json');
const setup=()=>{const h=engineSetup();h.run('G.save();G.load();');return h;};
const paid=(h,id,ci=0)=>h.run(`globalThis.e=event('${id}');G.beginPresentation(e);globalThis.p=G.resolvePresentedChoice(e,e.choices[${ci}]);`);
const reload=h=>{
 const receipt=h.run('JSON.stringify(S.pendingPresentation)'),state=h.run('JSON.stringify([S.day,S.min,S.items,S.food,S.water,S.scrap,S.van,S.flags])');
 assert(h.run('G.save();G.load()'));assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[S.pendingPresentation.choiceIndex]).applied'),false);
 assert.equal(h.run('JSON.stringify(S.pendingPresentation)'),receipt);assert.equal(h.run('JSON.stringify([S.day,S.min,S.items,S.food,S.water,S.scrap,S.van,S.flags])'),state);
};
test('only individually approved gates, disclosed costs and free exits change the 30 available baseline rows (Seoul opening has its own owner)',()=>{
 const h=setup(),rows=h.json(`JSON.parse(JSON.stringify(${JSON.stringify(baseline.ids)}.map(id=>event(id)),(k,v)=>['text','label','title','turnSpeakers','turns','readingRecord','note'].includes(k)?undefined:v))`);
 for(const row of rows){
  if(!row)continue; // seoul_open has a dedicated owner, not D.events/seoulStops.
  if(row.id==='comp_rps'){
   assert.deepEqual(row.minuteWindow,[720,1020]);delete row.minuteWindow;
   assert.equal(row.choices[0].out[1].fx.sleeping,true);
   delete row.choices[0].out[1].fx.sleeping;
  }
  if(row.id==='loc_yeosu'){assert.equal(row.night,true);delete row.night;}
  if(['exp_outdoor','lc_suwon_galbi'].includes(row.id)){
   assert.deepEqual(row.choices[0].req,{scrap:2});delete row.choices[0].req;
   assert.deepEqual(row.choices.pop(),{out:[{p:1,fx:{}}]});
  }
  if(row.id==='route_market_mask'){
   assert.deepEqual(row.choices[0].req,{scrap:2});delete row.choices[0].req;
   assert.deepEqual(row.choices[0].foreseeable,{expense:'고철 1~2 · 실패에 대비해 2 필요'});delete row.choices[0].foreseeable;
  }
  if(row.id==='patrol_toll'){assert.deepEqual(row.choices[2].foreseeable,{expense:'연료 최대 4L · 차체 최대 3% · 45분'});delete row.choices[2].foreseeable;}
  if(row.id==='crisis_nofuel3'){
   assert.deepEqual(row.choices.map(c=>c.foreseeable),[
    {expense:'보유한 물·식량에서 각각 최대 3 소모 · 도보 중 끼니 소모 별도',lasting:'장시간 길을 비우며 관측 위험도 남는다'},
    {lasting:'견인과 급유에도 몇 시간이 걸린다'}]);
   row.choices.forEach(c=>delete c.foreseeable);
  }
  if(row.id==='comp_water_fight'){
   assert.equal(row.waterMin,1);delete row.waterMin;
   row.choices.slice(0,2).forEach(c=>{assert.deepEqual(c.req,{water:1});delete c.req;});
   assert.deepEqual(row.choices.pop(),{out:[{p:1,fx:{}}]});
  }
 }
 assert.deepEqual(rows,baseline.mechanics);
});
test('mountain introduction does not invent a dispatch; generation form does not change clear weather into rain',()=>{
 const h=setup();assert.match(h.run("event('cell_mountain_meet').choices[0].label"),/남산/);
 assert.doesNotMatch(h.run("event('cell_mountain_meet').choices[0].label"),/보내서/);
 h.run("globalThis.m=event('cell_mountain_meet');globalThis.out=m.choices[0].out[0];");
 assert.deepEqual(h.json("buildStoryTurns(out.text,m,{turnSpeakers:out.turnSpeakers}).filter(t=>t.kind==='dialogue').map(t=>t.who)"),['sanjigi','sanjigi','sanjigi','me','sanjigi','sanjigi','sanjigi']);
 for(const wx of ['clear','fog','dust']){
  h.run(`S.wx='${wx}';`);assert.doesNotMatch(h.run("prose(event('story_generation_form').text)"),/비를 피/);
 }
});
test('bakery writing is a record, solo result a thought, and every actual companion owns their reply',()=>{
 const h=setup();h.run("globalThis.e=event('lc_daejeon_bakery');");
 const entry=h.json('e.turns');assert(entry.some(t=>t.kind==='record'&&/셔터/.test(t.name)));
 assert(!entry.filter(t=>t.kind==='dialogue').some(t=>t.who==='record'));
 for(const cid of [null,'minji','kangwoo','parkss','eunsu','leo','jaeyi']){
  const x=setup();x.run(`S.party=${JSON.stringify(cid?[cid]:[])};globalThis.e=event('lc_daejeon_bakery');G.pickOutcome=()=>({...e.choices[0].out[0],presentationOutcomeIndex:0});`);paid(x,'lc_daejeon_bakery');
  const turns=x.json("typeof p.out.turns==='function'?p.out.turns(S):p.out.turns");
  assert.deepEqual(turns.filter(t=>t.kind==='dialogue').map(t=>t.who),cid?['me',cid,'me',cid]:[]);
  assert.equal(turns.some(t=>t.kind==='thought'),!cid);assert(x.run('p.ok'));reload(x);
  assert.deepEqual(x.json('p.out.turns'),turns);
 }
});
test('retrospective and zero-time talk refer only to choices made and the current stop',()=>{
 const h=setup();h.run("S.party=['minji'];S.min=900;");
 assert.doesNotMatch(h.run("prose(event('seoul_core').choices[4].out[0].text)"),/나눈 물|못 지킨 약속/);
 paid(h,'talk_mj_11');assert.equal(h.run('S.min'),900);assert.doesNotMatch(h.run('p.out.text'),/다음 정차/);reload(h);
 for(const [id,bad] of [['comp_food_debate',/한 시간|그날 저녁/],['exp_brewery',/그날 밤|잠들/],['loc_andong',/그날 밤|그날밤/]])
  assert.doesNotMatch(h.run(`prose(event('${id}').choices[0].out[0].text)`),bad);
 assert.doesNotMatch(h.run("event('camp_scan').text"),/새벽 3시/);
});
test('lunch game and Yeosu night keep their existing time costs and cannot enter at incompatible hours',()=>{
 const h=setup();h.run("S.party=['minji','kangwoo'];S.at='yeosu';S.min=390;");
 assert.equal(h.run("G.eventAvailable(event('comp_rps'))"),false);
 assert.equal(h.run("G.eventAvailable(event('loc_yeosu'))"),false);
 h.run('S.min=780;');assert.equal(h.run("G.eventAvailable(event('comp_rps'))"),true);
 // locEvent is arrival-owned, never a weighted local pool candidate.
 h.run("G.maybeCrisis=()=>false;G.popStory=()=>null;globalThis.opened=[];G.openEvent=e=>opened.push(e.id);S.min=900;S.pendingArrival='yeosu';G.finishArrival('yeosu');");
 assert(!h.json('opened').includes('loc_yeosu'));
 h.run("S.min=1260;S.pendingArrival='yeosu';G.finishArrival('yeosu');");assert(h.json('opened').includes('loc_yeosu'));
 assert.equal(h.run("event('loc_yeosu').choices[0].out[0].fx.time"),240);
});
test('mood receipts report applied capped changes, individually when party changes differ',()=>{
 const h=setup();h.run("S.party=['minji','kangwoo'];S.comps.minji.mood=100;S.comps.kangwoo.mood=98;");
 assert.deepEqual(h.json('G.applyFx({moodAll:5}).map(c=>c.t)'),['민지 사기 0','강우 사기 +2']);
 assert.deepEqual(h.json('G.applyFx({mood:{minji:5,kangwoo:5}}).map(c=>c.t)'),['민지 사기 0','강우 사기 0']);
 h.run('S.comps.minji.mood=0;S.comps.kangwoo.mood=2;');
 assert.deepEqual(h.json('G.applyFx({moodAll:-5}).map(c=>c.t)'),['민지 사기 0','강우 사기 -2']);
 assert.deepEqual(h.json('G.applyFx({moodAll:3,mood:{minji:2}}).map(c=>c.t)'),['사기 +3','민지 사기 +2']);
});
test('fatal camp time does not award a bond, memory, choice quality, plan or note after the terminal archive',()=>{
 for(const guest of [false,true]){
  const h=setup();h.run(`S.party=${guest?'[]':"['minji']"};S.min=1439;S.thirst=3;S.water=0;S._breakfastDay=S.day;S._lunchDay=S.day;
   ${guest?"S.recruitQ={id:'minji',stage:'follow',target:'miryang',choice:'care'};":''}
   globalThis.prepared=G.prepareCamp('talk','minji');globalThis.e=G.campConversationEvent();
   globalThis.end=G.endGame;G.endGame=kind=>{end(kind);globalThis.terminal=JSON.stringify(S);};`);
  assert(h.run('prepared.ok'));assert(h.run('e.choices.length>0'));
  h.run('globalThis.p=G.resolvePresentedChoice(e,e.choices[0]);');
  assert.equal(h.run('S.endKind'),'thirst');assert.equal(h.run('JSON.stringify(S)'),h.run('terminal'));
  assert.equal(h.run('G.resolveCampChoice(e.id,e.choices[0].id).ok'),false);
 }
 const normal=setup();normal.run("S.party=['minji'];S.min=1439;S.thirst=3;S.water=G.mealNeed('breakfast');S._breakfastDay=S.day;S._lunchDay=S.day;G.prepareCamp('talk','minji');globalThis.e=G.campConversationEvent();globalThis.p=G.resolvePresentedChoice(e,e.choices[0]);");
 assert(normal.run('p.ok&&!S.ended&&!!S.campMemories.minji'));const bond=normal.run('S.comps.minji.bond');
 normal.run('G.save();G.load();globalThis.p=G.resolvePresentedChoice(e,e.choices[0]);');
 assert.equal(normal.run('p.applied'),false);assert.equal(normal.run('S.comps.minji.bond'),bond);
});
test('salvage clerk cannot see the existing number rather than claiming the Dalguji has no plate',()=>{
 const h=setup();assert.doesNotMatch(h.run("event('salvage_claim').choices[0].out[0].text"),/번호판 없/);
 assert.match(h.run("event('salvage_claim').choices[0].out[0].text"),/안 보이/);
});
test('clinic memories snapshot the real request; old overturned-bus memories retain their own frozen story',()=>{
 for(const ci of [0,1]){
  const h=setup();h.run("globalThis.e=event('meet_bus');G.rememberChoice(e,e.choices["+ci+"],e.choices["+ci+"].out[0]);S.stats.km=1000;S.stats.events=100;S.driving={from:'busan',to:'miryang',dist:50,gone:0};G.save();G.load();globalThis.echo=G.takeChoiceEcho();");
  assert.match(h.run('echo.memory.id'),/clinic_route/);assert.match(h.run('JSON.stringify(echo.lines)'),/진료 버스/);
  assert.doesNotMatch(h.run('JSON.stringify(echo.lines)'),/넘어진|문을 두드/);assert.equal(h.run('G.takeChoiceEcho()'),null);
 }
 const h=setup();h.run("G.ensureNarrativeState();S.memories.choices.bus_rescued={id:'bus_rescued',eventId:'meet_bus',choiceIndex:0,summary:'옛 구조',dueKm:0,dueEvents:0};S.memories.pending=['bus_rescued'];S.driving={from:'busan',to:'miryang',dist:50,gone:0};G.save();G.load();globalThis.echo=G.takeChoiceEcho();");
 assert.match(h.run('JSON.stringify(echo.lines)'),/넘어진 버스/);assert.equal(h.run('echo.memory.summary'),'옛 구조');
});
test('dogtag count follows the paid rebuild choice, not mere entry, and absolution owner accepts dynamic prose',()=>{
 const h=setup();h.run("S.party=['kangwoo'];S.used.push('rq_kangwoo_task');");
 assert.equal(h.run('D.kangwooLeftOwnTag(S)'),false);assert.match(h.run("prose(event('kangwoo_dogtag').text)"),/두 개/);
 h.run("S.comps.kangwoo.approach='rebuild';");assert.equal(h.run('D.kangwooLeftOwnTag(S)'),true);
 assert.doesNotMatch(h.run("prose(event('kangwoo_dogtag').text)"),/두 개/);
 h.run('S.flags.kw_absolved=true;');assert.equal(typeof h.run("prose(event('kangwoo_dogtag').text)"),'string');
 for(const proof of ["S.recruitQ={id:'kangwoo',choice:'rebuild',stage:'ready'}", "S.notes.push({title:'경비탑의 다음 사람',body:'감시 표식을 뜯고 서연이 직접 고친 새 경계선을 세웠다.'})", "S.pendingPresentation={eventId:'rq_kangwoo_task',phase:'result',choiceIndex:1}"]){
  const x=setup();x.run(proof);assert.equal(x.run('D.kangwooLeftOwnTag(S)'),true);
 }
});
test('Eunsu can explain a known callsign in either order without claiming it is undisclosed or never used',()=>{
 const h=setup();h.run("S.party=['eunsu'];");
 for(const order of [['talk_es_21','talk_es_02','talk_es_16'],['talk_es_16','talk_es_21','talk_es_02']])for(const id of order){
  h.run(`globalThis.e=event('${id}');globalThis.text=prose(e.text);`);
  assert.doesNotMatch(h.run('text'),/그건 아직요|아직 한 번도|아직 말한 적/);
  const turns=h.json('buildStoryTurns(text,e,{turnSpeakers:e.turnSpeakers})');assert(turns.length);
 }
 assert.match(h.run("event('talk_es_16').choices[1].out[0].text"),/노스 스타|에코/);
});
test('one actual companion is singular at the core, two remain plural; a solo player cannot choose crew advice',()=>{
 const h=setup();h.run("S.party=['parkss'];");
 assert.match(h.run("prose(event('seoul_core').choices[1].out[0].text)"),/이 사람/);
 assert.doesNotMatch(h.run("prose(event('seoul_core').choices[1].out[0].text)"),/이 사람들|동료들이/);
 h.run("S.party=['parkss','minji'];");assert.match(h.run("prose(event('seoul_core').choices[1].out[0].text)"),/사람들이야|사람들이다/);
 h.run('S.party=[];');assert.equal(h.run("G.reqOk(G.choiceReq(event('seoul_core').choices[1])).ok"),false);
});
test('voluntary spending gates full worst-case price, leaves a free next action, and rechecks unpaid reload',()=>{
 for(const id of ['exp_outdoor','lc_suwon_galbi','route_market_mask'])for(const scrap of [0,1,2]){
  const h=setup();h.run(`S.scrap=${scrap};globalThis.e=event('${id}');G.beginPresentation(e);G.save();G.load();`);
  assert.equal(h.run('G.reqOk(G.choiceReq(e.choices[0])).ok'),scrap>=2);
  assert(h.run('e.choices.some(c=>G.reqVisible(G.choiceReq(c))&&G.reqOk(G.choiceReq(c)).ok)'));
  if(scrap<2)assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[0]).ok'),false);
  else {h.run('globalThis.p=G.resolvePresentedChoice(e,e.choices[0]);');assert(h.run('p.ok'));reload(h);}
 }
 for(const id of ['exp_outdoor','lc_suwon_galbi']){
  const h=setup();h.run('S.scrap=0;');paid(h,id,1);assert(h.run('p.ok'));assert.equal(h.run('S.scrap'),0);reload(h);
 }
 const escape=setup();escape.run("S.fuel=0;globalThis.c=event('patrol_toll').choices[2];");assert(escape.run('G.reqOk(G.choiceReq(c)).ok'));
 assert.match(escape.run('JSON.stringify(G.choiceForeseeable(c))'),/45분/);
});
test('relay remains chapter five in engine and persisted journal updates',()=>{
 const h=setup();h.run("G.departureSteps=()=>[{id:'mother',done:true},{id:'relay',done:false,label:'연락망'}];G.mainEvidenceOpportunity=()=>null;");
 assert.equal(h.run('G.mainQuestEntry().act'),'5장');assert.equal(h.run('G.mainQuestEntry().chapterId'),'relay');
 h.run('G.questLedgerSync();G.save();G.load();');assert.equal(h.run('G.mainQuestEntry().act'),'5장');
});
test('resource and fatigue chips preserve exact deltas while live summary formats tiny nonzero values without changing receipts',()=>{
 const h=setup(),ui=fs.readFileSync('src/07-ui.js','utf8');
 h.run(ui.slice(ui.indexOf('  function storyFeedbackNumber('),ui.indexOf('  function storyResourceHtml(')));
 h.run('S.fatigue=9.999999999;globalThis.chips=G.applyFx({fatigue:1e-8,fuel:-1e-8});');
 assert(h.json('chips').some(c=>/e-|999999/.test(c.t)));
 assert.equal(h.run('storyFeedbackNumber(1e-8)'),'+0.1 미만');assert.equal(h.run('storyFeedbackNumber(-1e-8)'),'−0.1 미만');
 assert.equal(h.run('storyFeedbackNumber(0)'),'0');assert.equal(h.run('storyFeedbackNumber(1.23456789)'),'+1.2');
 h.run("globalThis.old={t:'강우 사기 +2.000000004',c:'plus'};globalThis.oldJSON=JSON.stringify(old);");
 assert.equal(h.run('storyFeedbackChip(old).t'),'강우 사기 +2');assert.equal(h.run('JSON.stringify(old)'),h.run('oldJSON'));
 assert.equal(h.run("storyResourceChange({t:'연료 -1e-8L'}).tone"),'loss');assert.equal(h.run("storyResourceChange({t:'물 0'}).label"),'변화 없음');
 assert.equal(h.run("storyFeedbackChip({t:'연료 -2.005937L'}).t"),'연료 −2L');
 assert.equal(h.run("storyFeedbackChip({t:'물 +0.00000001 · 적재 한도'}).t"),'물 +0.1 미만 · 적재 한도');
});
test('moving silence is excluded from stopped camp but available on the road',()=>{
 const h=setup();h.run("S.party=['minji','kangwoo'];S.at='cheongju';");
 assert.deepEqual(h.json('D.eventLocations.comp_goodsilence'),{kind:'road'});
 assert.equal(h.run("G.eventAvailable(event('comp_goodsilence'))"),false);
 h.run("S.at=null;S.driving={from:'cheongju',to:'cheonan',dist:50,gone:10};");assert.equal(h.run("G.eventAvailable(event('comp_goodsilence'))"),true);
});
test('fuel rescue explains the existing six litres without moving the player or changing towing cost',()=>{
 const h=setup();h.run("S.at=null;S.driving={from:'busan',to:'miryang',dist:50,gone:10};S.fuel=0;S.scrap=30;globalThis.beforeDrive=JSON.stringify(S.driving);");paid(h,'crisis_nofuel3',1);
 assert.match(h.run('p.out.text'),/여섯 리터/);assert.equal(h.run('S.fuel'),6);assert.equal(h.run('S.scrap'),10);
 assert.equal(h.run('JSON.stringify(S.driving)'),h.run('beforeDrive'));reload(h);
});
test('water division cannot enter empty; already-open unpaid scenes have a zero-cost exit, paid old prose stays paid',()=>{
 const h=setup();h.run("S.party=['minji','kangwoo'];S.water=0;globalThis.e=event('comp_water_fight');");
 assert.equal(h.run('G.eventAvailable(e)'),false);h.run('S.water=1;');assert.equal(h.run('G.eventAvailable(e)'),true);
 h.run('G.beginPresentation(e);S.water=0;G.save();G.load();');
 assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[0]).ok'),false);assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[1]).ok'),false);
 h.run('globalThis.p=G.resolvePresentedChoice(e,e.choices[2]);');assert(h.run('p.ok'));assert.equal(h.run('S.water'),0);reload(h);
});
test('road echo uses the saved work label and legacy fallback, never the renderer category as a different favor',()=>{
 const h=setup();h.run("S._impactEcho={stlId:'miryang',from:'miryang',to:'daegu',actionId:'parts',label:'부품 정리',visual:'order',wx:'clear'};");
 assert.match(h.run("D.roadEchoCopy(S,'entry')"),/부품 정리/);assert.doesNotMatch(h.run("D.roadEchoCopy(S,'entry')"),/길을 정리|주민들가|주민들와/);
 h.run('delete S._impactEcho.label;S._impactEcho.actionId="unknown-legacy";');
 assert.match(h.run("D.roadEchoCopy(S,'entry')"),/정착지에서 만났던/);assert.doesNotMatch(h.run("D.roadEchoCopy(S,'entry')"),/길을 정리/);
});
test('midnight dehydration forecast follows the real fatal boundary without mutating state, RNG, travel availability or supplies',()=>{
 const h=setup();h.run("S.min=1430;S.thirst=3;S.water=0;S._breakfastDay=S.day;S._lunchDay=S.day;globalThis.snapshot=JSON.stringify(S);globalThis.seed=S.seed;");
 assert.equal(h.run('G.dehydrationForecast(9)'),null);assert.equal(h.run('G.dehydrationForecast(10).minutes'),10);
 assert.equal(h.run('G.dehydrationForecast(11).minutes'),10);assert.equal(h.run('JSON.stringify(S)'),h.run('snapshot'));
 assert.equal(h.run('S.seed'),h.run('seed'));for(const v of ['NaN','Infinity','-1','0'])assert.equal(h.run(`G.dehydrationForecast(${v})`),null);
 h.run("S.at='busan';S.fuel=70;globalThis.route=G.neighbors('busan').find(n=>G.canTravelTo(n.id).ok).id;globalThis.f=G.travelForecast(route);");
 assert.match(h.run('f.survivalWarning'),/탈수/);assert(h.run('f.readinessScore<=44'));assert(h.run('G.canTravelTo(route).ok'));
 const ui=fs.readFileSync('src/07-ui.js','utf8');
 h.run("globalThis.routeConsoleModel=rows=>rows[0];globalThis.esc=value=>String(value??'');globalThis.destinationPreview=()=>'';globalThis.tripDestinationPickerHtml=()=>'';globalThis.directionParticle=()=> '로';globalThis.routeMapOpen=false;G.mainQuestEntry=()=>null;");
 h.run(ui.slice(ui.indexOf('  function routeConsoleHtml('),ui.indexOf('  function syncRouteMap(')));
 const html=h.run("routeConsoleHtml([{nb:{id:route,km:f.km},forecast:f,fuel:f.fuel}])");
 assert.match(html,/journey-warning/);assert.match(html,/탈수 위험/);
 assert.doesNotMatch(html.match(/<button[^>]*class="trip-depart"[^>]*>/)[0],/disabled/);
 h.run("S.water=G.mealNeed('breakfast');");assert.equal(h.run('G.dehydrationForecast(11)'),null);
 h.run('S.water=0;G.advance(11);');assert.equal(h.run('S.endKind'),'thirst');
 const wet=setup();wet.run("S.min=380;S.thirst=2;S.water=0;S.up.collector=true;S.wx='rain';S._breakfastDay=0;");assert.equal(wet.run('G.dehydrationForecast(1100)'),null);
 const dry=setup();dry.run("S.min=380;S.thirst=2;S.water=0;S.up.collector=false;S._breakfastDay=0;");assert(dry.run('!!G.dehydrationForecast(1100)'));
});
test('Korean particles follow final consonants and the water-trade unit explains the existing four-unit reward',()=>{
 const h=setup();assert.equal(h.run("D.withParticle('박 선생','이','가')"),'박 선생이');assert.equal(h.run("D.withParticle('민지','과','와')"),'민지와');
 assert.match(h.run("event('water_toll').choices[0].out[0].text"),/네 개/);assert.equal(h.run("event('water_toll').choices[0].out[0].fx.water"),4);
 assert.doesNotMatch(h.run("event('talk_leo_18').choices[0].out[0].text"),/방금 만난|정비소 아이/);
 assert.doesNotMatch(h.run("event('talk_mj_08').text"),/411km/);
});
test('all affected historical paid receipts retain their stored prose, chips, viewing data and resources',()=>{
 for(const id of baseline.ids){
  const h=setup();h.run(`globalThis.e=event('${id}')||D.seoulOpenEvent;S.water=0;S.scrap=0;S.pendingPresentation={version:1,phase:'result',eventId:e.id,choiceIndex:0,outcomeIndex:0,text:'옛 결과 ${id}',chips:[{t:'사기 +5.000000001',c:'plus'}]};G.save();G.load();globalThis.p=G.resolvePresentedChoice(e,e.choices[0]);`);
  assert(h.run('p.ok&&!p.applied'));assert.equal(h.run('p.out.text'),'옛 결과 '+id);assert.equal(h.run('p.chips[0].t'),'사기 +5.000000001');reload(h);
 }
});
