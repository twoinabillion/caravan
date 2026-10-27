const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup:engineSetup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const before=require('../qa-artifacts/expedition-repairs-20261021/before.json');
const setup=()=>{const h=engineSetup();h.run('G.save();G.load();');return h;};
const paid=(h,id,ci)=>h.run(`globalThis.e=event('${id}');G.beginPresentation(e);globalThis.p=G.resolvePresentedChoice(e,e.choices[${ci}]);`);
const replay=h=>{const snapshot=h.run('JSON.stringify([S.day,S.min,S.fatigue,S.scrap,S.water,S.food,S.fuel,S.flags,S.comps,S.pendingPresentation])');
 assert(h.run('G.save();G.load()'));assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[S.pendingPresentation.choiceIndex]).applied'),false);
 assert.equal(h.run('JSON.stringify([S.day,S.min,S.fatigue,S.scrap,S.water,S.food,S.fuel,S.flags,S.comps,S.pendingPresentation])'),snapshot);};
test('E01: imminent collapse cannot be ready, but departure remains a player choice',()=>{
 for(const fatigue of [98.9,99,100]){const h=setup();h.run(`S.at='pyeongtaek';S.driving=null;S.known.push('suwon');S.min=600;S.wx='clear';S.fuel=70;S.food=24;S.water=28;S.van=100;S.fatigue=${fatigue};S.up.lightbar=true;S.up.snorkel=true;`);
  const f=h.json("G.travelForecast('suwon')");assert.match(f.readinessReason,/운전자 휴식 필요/);
  if(fatigue>=99){assert(f.readinessScore<=44);assert.equal(f.readinessClass,'danger');assert.notEqual(f.readinessLabel,'준비됨');}
  assert.equal(h.run("G.startTravel('suwon')"),true);
 }
});
test('E02: actual meals clear a stale hunger queue; possessing food does not',()=>{
 const h=setup();h.run("S.hunger=2;S._crisis='crisis_hungry';S.food=10;");
 assert.equal(h.run('G.crisisStillNeeded(S._crisis)'),true);
 assert.equal(h.run("G.consumeMeal('lunch').ok"),true);assert.equal(h.run('S.hunger'),1);assert.equal(h.run('S._crisis'),null);
 h.run("S.hunger=0;S._crisis='crisis_hungry';G.save();G.load();globalThis.opened=[];G.openEventById=id=>opened.push(id)");
 assert.equal(h.run('G.maybeCrisis()'),false);assert.deepEqual(h.json('opened'),[]);
 h.run("S.hunger=2;S._crisis='crisis_hungry'");assert.equal(h.run('G.maybeCrisis()'),true);assert.deepEqual(h.json('opened'),['crisis_hungry']);
 h.run("S.hunger=0;S._crisis='crisis_nofuel';G.consumeMeal('breakfast')");assert.equal(h.run('S._crisis'),'crisis_nofuel');assert.equal(h.run('G.maybeCrisis()'),true);
});
test('E02: legacy unpaid hunger entry/transition resumes only while hunger persists; paid text survives',()=>{
 for(const phase of ['event','transition','result'])for(const hunger of [0,2]){
  const h=setup();h.run(`S.hunger=${hunger};S.food=20;S._crisis='crisis_hungry';S.pendingPresentation={version:1,eventId:'crisis_hungry',phase:'${phase}',text:'옛 원문',choiceIndex:0,outcomeIndex:0,chips:[]};G.save();G.load();globalThis.opened=[];UI.showEvent=e=>opened.push(e.id);`);
  const before=h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.fatigue])');
  assert.equal(h.run('G.resumePresentation()'),phase==='result'||hunger>=2);
  assert.equal(h.run('S.pendingPresentation!==null'),phase==='result'||hunger>=2);
  assert.equal(h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.fatigue])'),before);
 }
});
test('E03: the salt field is a stopped coastal exploration, not an inland road encounter',()=>{
 const h=setup();h.run('S.used=[];S.min=600;');
 for(const at of ['yeosu','mokpo','gunsan']){h.run(`S.at='${at}';S.driving=null;`);assert(h.run("G.nodeEvents(S.at).some(e=>e.id==='ev_salt_farmer')"));assert.equal(h.run("G.eventAvailable(event('ev_salt_farmer'),{mode:'local'})"),false);}
 for(const at of ['gumi','gimcheon','cheongju']){h.run(`S.at='${at}';`);assert.equal(h.run("G.nodeEvents(S.at).some(e=>e.id==='ev_salt_farmer')"),false);}
 h.run("S.at=null;S.driving={from:'yeosu',to:'gwangyang',dist:30,gone:1};");assert.equal(h.run("G.eventAvailable(event('ev_salt_farmer'),{mode:'road'})"),false);
 h.run("S.at='gunsan';S.driving=null;S.min=600");paid(h,'ev_salt_farmer',1);assert.match(h.run('p.out.text'),/한 시간/);assert.equal(h.run('S.min'),660);replay(h);
});
test('E04: two-digit Seoul sign uses remaining distance, never total mileage',()=>{
 const h=setup();h.run("S.used=[];S.min=600;globalThis.remaining=275;G.remainKm=()=>remaining;S.stats.km=9999");
 for(const [km,allowed]of [[275,false],[100,false],[99,true],[1,true]]){h.run(`remaining=${km}`);assert.equal(h.run("G.eventAvailable(event('ev_highway_sign'))"),allowed);}
 const b=setup();b.run("S.at=null;S.driving={from:'pyeongtaek',to:'suwon',dist:100,gone:1,road:'paved',slots:[],si:0};S.stats.km=9999;S.used=[];");
 assert.equal(b.run("G.eventAvailable(event('ev_highway_sign'),{mode:'road'})"),b.run('G.remainKm()<=99'));
});
test('E05/E06: unknown helpers remain unknown; road theft starts after stopping, not waking',()=>{
 for(const used of [[],['ev_postman']]){const h=setup();h.run(`S.used=${JSON.stringify(used)}`);paid(h,'cell_sotgot_2',0);
  assert.doesNotMatch(h.run('p.out.text'),/우편부|서커스 단원|삼남매|씨앗 도서관/);assert.match(h.run('p.out.text'),/하나로 좁힐 수 없었다/);replay(h);}
 for(const driving of [false,true]){const h=setup();h.run(`S.at=${driving?'null':"'muju'"};S.min=1300;S.driving=${driving?"{from:'muju',to:'gimcheon',dist:38,gone:4,road:'paved',slots:[],si:0}":'null'};globalThis.e=event('ev_fuel_thief_night');G.beginPresentation(e);`);
  const text=h.run('S.pendingPresentation.text');assert.doesNotMatch(text,/눈을 떴|잠에서|자다가/);if(driving)assert.match(text,/갓길에 차를 세운 뒤/);
  h.run('G.save();G.load();G.beginPresentation(e)');assert.equal(h.run('S.pendingPresentation.text'),text);
  assert.doesNotMatch(h.run('JSON.stringify(e.choices.map(c=>c.label))'),/강우.*깨운/);
 }
});
for(const minute of [330,600,1260])test(`E07: explicit 480-minute temple sleep at ${minute} does not accrue waking fatigue`,()=>{
 const h=setup();h.run(`S.at='muju';S.min=${minute};S.fatigue=97;S.food=24;S.water=28;S._breakfastDay=S.day;S._lunchDay=S.day;S.injuries=[{who:'driver',label:'부상',days:2}];globalThis.start=S.day*1440+S.min;`);
 paid(h,'exp_temple',0);assert.equal(h.run('S.day*1440+S.min-start'),480);assert.equal(h.run('S.fatigue'),0);assert.equal(h.run('p.ok'),true);replay(h);
 assert.doesNotMatch(h.run('p.out.text'),/새벽|아침/);
});
test('E07: meal penalties and fatal midnight are not overwritten by sleep recovery',()=>{
 const h=setup();h.run("S.at='muju';S.party=['minji','kangwoo'];S.min=700;S.fatigue=97;S.food=0;S.water=28;S._lunchDay=S.day-1;");paid(h,'exp_temple',0);
 assert(h.run('S.fatigue')>0);assert(h.run('S.hunger')>0);
 const b=setup();b.run("S.at='muju';S.party=['minji','kangwoo'];S.min=1400;S.thirst=4;S.water=0;S.food=0;S.fatigue=90;S._breakfastDay=S.day;S._lunchDay=S.day;S.notes=[];");paid(b,'exp_temple',0);
 assert.equal(b.run('S.ended'),true);assert.equal(b.run('S.pendingPresentation?.phase')==='result',false);
 assert.equal(b.run("S.notes.some(n=>n.title==='절을 쓰는 노보살')"),false);
 const c=setup();c.run('S.fatigue=30;S.min=500');c.run('G.advance(60)');assert(c.run('S.fatigue')>30);
 paid(c,'exp_temple',1);assert(c.run('S.fatigue')>0);replay(c);
});
test('E08: only the completed rebuild branch proves that Kangwoo left his tag',()=>{
 for(const approach of ['spoof','follow','rebuild']){const h=setup();h.run(`S.comps.kangwoo.approach='${approach}';S.notes=[{title:'경비탑의 다음 사람',body:'감시 표식을 뜯고 서연이 직접 고친 새 경계선을 세웠다.'}]`);assert.equal(h.run('D.kangwooLeftOwnTag(S)'),approach==='rebuild');}
 for(const body of ['', '감시 표식을 뜯고 서연이 직접 고친 새 경계선을 세웠다.']){const h=setup();h.run(`delete S.comps.kangwoo.approach;S.recruitQ=null;S.pendingPresentation=null;S.used.push('rq_kangwoo_task');S.notes=[{title:'경비탑의 다음 사람',body:${JSON.stringify(body)}}]`);assert.equal(h.run('D.kangwooLeftOwnTag(S)'),!!body);}
 for(const phase of ['event','result'])for(const ci of [0,1,2]){const h=setup();h.run(`delete S.comps.kangwoo.approach;S.recruitQ=null;S.notes=[];S.pendingPresentation={eventId:'rq_kangwoo_task',phase:'${phase}',choiceIndex:${ci}}`);assert.equal(h.run('D.kangwooLeftOwnTag(S)'),phase==='result'&&ci===1);}
 const h=setup();h.run("delete S.comps.kangwoo.approach;S.recruitQ={id:'kangwoo',stage:'task',choice:'rebuild'};S.notes=[];S.pendingPresentation=null;");assert.equal(h.run('D.kangwooLeftOwnTag(S)'),false);h.run("S.recruitQ.stage='road'");assert.equal(h.run('D.kangwooLeftOwnTag(S)'),true);
});
test('C05: active main chain says continue reading across paid reload and transition',()=>{
 const h=setup();h.run("S.at='suwon';S.min=600;S.flags.father_fate_known=true;globalThis.e=event('history_parents_network');G.beginPresentation(e);");
 const hint=()=>{assert.match(h.run('G.mainQuestEntry().next'),/계속 읽/);assert.match(h.run('QuestJournal.entry(G.mainQuestEntry()).guide'),/계속 읽/);};hint();
 const stock=h.run('JSON.stringify([S.min,S.food,S.water,S.scrap,S.flags,S.pendingPresentation])');hint();assert.equal(h.run('JSON.stringify([S.min,S.food,S.water,S.scrap,S.flags,S.pendingPresentation])'),stock);
 paid(h,'history_parents_network',0);replay(h);hint();
 assert.equal(h.run('G.queuePresentation(null)'),'parents_mother_reunion');hint();
 h.run('G.save();G.load();UI.showEvent=ev=>G.beginPresentation(ev);G.presentTransition();');hint();
 h.run('G.queuePresentation(null);S._chain=null;S.pendingPresentation=null;');assert.equal(h.run('G.mainEvidenceReading()'),null);assert.match(h.run('QuestJournal.entry(G.mainQuestEntry()).guide'),/주변 탐색.*30분/);
});
test('C07: active mother goal learns the recent signal only when the player does',()=>{
 const h=setup();h.run("S.at='suwon';S.flags={intro_family_helped:true,intro_appeal_failed:true,intro_module_seen:true,first_order_trace:true,parents_split_known:true,parents_routes_traced:true,parent_key_found:true,main_testimony_record:true,main_command_record:true,family_order_known:true,father_fate_known:true,failed_namsan_known:true};");
 // Select the mother chapter without inventing evidence flags for a real play save.
 h.run("globalThis.origSteps=G.departureSteps;G.departureSteps=()=>origSteps().map(s=>({...s,done:s.id!=='mother'&&s.id!=='seoul'}));");
 assert.doesNotMatch(h.run('G.mainQuestEntry().why'),/며칠 전|최근/);assert.equal(h.run('QuestJournal.entry(G.mainQuestEntry()).title'),'엄마의 행방');
 h.run('S.flags.parents_recent_signal=true');assert.match(h.run('G.mainQuestEntry().title'),/최근 무전/);assert.match(h.run('QuestJournal.entry(G.mainQuestEntry()).next'),/무전 표식/);
 h.run('S.flags.mother_reunited=true');assert.match(h.run('QuestJournal.entry(G.mainQuestEntry()).next'),/다시 만났다/);
 assert.equal(h.run("QuestJournal.entry({...G.mainQuestEntry(),status:'completed'}).guide"),'');
});
test('C08: withdrawal warns about existing losses, but never requires fuel to leave',()=>{
 for(const fuel of [0,4,10]){const h=setup();h.run(`S.fuel=${fuel};S.min=600;globalThis.e=event('combat_toll_breach');`);
  assert.equal(h.run('G.reqOk(G.choiceReq(e.choices[3])).ok'),true);assert.match(h.run('JSON.stringify(G.choiceForeseeable(e.choices[3]))'),/4L.*40분/);assert.match(h.run('JSON.stringify(G.choiceForeseeable(e.choices[3]))'),/관측/);
  paid(h,'combat_toll_breach',3);assert.equal(h.run('S.fuel'),Math.max(0,fuel-4));assert.equal(h.run('S.min'),640);replay(h);
 }
});
test('C09: two verses are ready for broadcast, not falsely marked a finished three-verse song',()=>{
 const h=setup();h.run("S.party=['leo'];G.grantPerk('leo','leo_story')");assert(h.messages.some(t=>/두 절.*방송|두 절.*청주/.test(t)));
 assert.match(h.run("QuestJournal.companionRecords.leo[2]"),/마지막 절은 서울에서/);assert.doesNotMatch(h.run("JSON.stringify(D.comps.leo.perks)"),/서울에서 완성했다/);
});
test('C13: market and refusal format fractional capacity without rounding the fuel state',()=>{
 const h=setup(),ui=fs.readFileSync('src/07-ui.js','utf8');h.run("S.at='miryang';S.fuel=60.75103686666603;S.scrap=100;let curStl='miryang',stlQuests=[];");
 h.run(ui.match(/  const ITEM_ICO=.*;/)[0]);h.run(ui.slice(ui.indexOf('  function marketFieldRows(){'),ui.indexOf('  function fieldBoardRow(row){')));
 const row=h.json("marketFieldRows().supplyRows.find(r=>r.kind==='trade'&&r.index===0)");assert.match(row.sub,/60.8\/70/);assert.equal(row.enabled,false);
 const fuel=h.run('S.fuel'),stock=h.run('S.scrap');const out=h.json("G.trade('miryang',0)");assert.equal(out.ok,false);assert.match(out.why,/60.8\/70/);assert.equal(h.run('S.fuel'),fuel);assert.equal(h.run('S.scrap'),stock);
 for(const [amount,label]of [[0,'0'],[.002,'0.1 미만'],[.1,'0.1'],[70,'70']])assert.equal(h.run(`G.supplyAmountLabel(${amount})`),label);
 h.run('S.fuel=60');assert.equal(h.run("G.trade('miryang',0).ok"),true);assert.equal(h.run('S.fuel'),70);
});
test('C01-C04/C06/C10-C12: revised wording keeps authored effects and grounded causality',()=>{
 const h=setup();
 assert.match(h.run("prose(event('wx_bigwash').choices[0].out[0].text)"),/두 시간 반/);
 assert.match(h.run("prose(event('roadbeat_200_archive').choices[1].out[0].text)"),/옆판.*긁/);
 assert.match(h.run("prose(event('story_parent_route_guarded').text)"),/이 지역 보관함/);
 assert.match(h.run("event('crisis_drowsy').choices[2].label"),/부르며/);
 assert.match(h.run("prose(event('loc_icheon').choices[1].out[0].text)"),/옆에 놓아둔 그릇/);
 assert.doesNotMatch(h.run("prose(event('loc_icheon').choices[1].out[0].text)"),/하룻밤|새벽|아침/);
 assert.doesNotMatch(h.run("prose(event('loc_lake').text)"),/표지판 보고/);
 assert.match(h.run("prose(event('talk_mj_04').choices[0].out[0].text)"),/챙겨 둬야겠다고 생각/);
 for(const [id,old]of Object.entries(before.events)){
  const strip=v=>JSON.parse(JSON.stringify(v,(k,x)=>['text','label','note','maxRemain','foreseeable','sleep'].includes(k)?undefined:x));
  const current=h.json(`event('${id}')`);
  if(id==='wx_bigwash'){
   assert.deepEqual(current.turnSpeakers,['party_first']);
   assert.deepEqual(current.choices[0].out[0].turnSpeakers,[]);
   assert.equal(old.turnSpeakers,undefined);
   assert.equal(old.choices[0].out[0].turnSpeakers,undefined);
   delete current.turnSpeakers;
   delete current.choices[0].out[0].turnSpeakers;
  }
  if(id==='ev_salt_farmer'){
   const farmer={who:'passer_worker',name:'염전 사내'};
   assert.deepEqual(current.turnSpeakers,[farmer]);
   assert.deepEqual(current.choices[0].out[0].turnSpeakers,['me',farmer,farmer]);
   assert.deepEqual(current.choices[1].out[0].turnSpeakers,[farmer,farmer]);
   assert.equal(old.turnSpeakers,undefined);
   assert.equal(old.choices[0].out[0].turnSpeakers,undefined);
   assert.equal(old.choices[1].out[0].turnSpeakers,undefined);
   delete current.turnSpeakers;
   delete current.choices[0].out[0].turnSpeakers;
   delete current.choices[1].out[0].turnSpeakers;
  }
  if(id==='crisis_drowsy'){
   assert.equal(current.choices[0].out[0].fx.sleeping,true);
   delete current.choices[0].out[0].fx.sleeping;
  }
  if(id==='exp_temple'){
   assert.deepEqual(current.choices[1].req,{scrap:1});
   delete current.choices[1].req;
  }
  assert.deepEqual(strip(current),strip(old),id+' changed unrelated effects/choice indices');
 }
});
test('legacy paid receipts, chips and reading cursor survive changed eligibility and prose',()=>{
 for(const id of ['crisis_hungry','ev_highway_sign','ev_salt_farmer','exp_temple','rq_kangwoo_task']){const h=setup();h.run(`globalThis.e=event('${id}');S.hunger=0;S.fatigue=83;S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:0,outcomeIndex:0,text:'지급한 옛 원문',chips:[{t:'옛 정산',c:'minus'}],view:{turns:[{kind:'narration',text:'첫 줄'},{kind:'thought',text:'다음 줄'}],index:1}};G.save();G.load();globalThis.p=G.resolvePresentedChoice(e,e.choices[0]);`);
  assert.equal(h.run('p.applied'),false);assert.equal(h.run('p.out.text'),'지급한 옛 원문');assert.equal(h.run('S.pendingPresentation.view.index'),1);assert.equal(h.run('S.fatigue'),83);replay(h);
 }
});
test('C01: solo sleep decision names my key share; a travelling crew retains its own share',()=>{
 for(const party of [[],['minji']]){const h=setup();h.run(`S.party=${JSON.stringify(party)};globalThis.e=event('seoul_decision');globalThis.o=e.choices[1].out[0];`);
  const turns=h.json('typeof o.turns===\'function\'?o.turns(S):o.turns');
  assert(turns.some(t=>t.text.includes(party.length?'일행이 지닌 몫':'내가 지닌 몫')));
 }
});
test('E03: coastal explore enters the local salt field, then leaves the normal next action reachable',()=>{
 const h=setup();h.run("S.at='gunsan';S.driving=null;S.min=500;S.fatigue=0;S.used.push(...G.nodeEvents(S.at).filter(e=>e.id!=='ev_salt_farmer').map(e=>e.id));UI.showEvent=ev=>G.beginPresentation(ev);");
 assert.equal(h.run('G.explore()'),true);assert.equal(h.run('S.pendingPresentation.eventId'),'ev_salt_farmer');
 paid(h,'ev_salt_farmer',1);replay(h);h.run('G.queuePresentation(null);G.save();G.load();');assert(h.run('G.neighbors(S.at).some(n=>G.canTravelTo(n.id).ok)'));
});
test('E08: all three downstream readers use the same branch-specific tag proof',()=>{
 for(const approach of ['follow','spoof','rebuild']){const h=setup();h.run(`S.party=['kangwoo'];S.comps.kangwoo.approach='${approach}';S.notes=[{title:'경비탑의 다음 사람'}];`);
  for(const id of ['kangwoo_dogtag','talk_kw_07']){
   const text=h.run(`prose(event('${id}').text)`);if(approach==='rebuild')assert.doesNotMatch(text,/두 개|두 군번줄/);else assert.match(text,/두 개|두 군번줄/);
  }
  const bridge=h.run("prose(event('seoul_han').choices[3].out[0].text)");if(approach==='rebuild')assert.doesNotMatch(bridge,/군번줄 두 개/);else assert.match(bridge,/군번줄 두 개/);
 }
});
test('C05: no follow-up means a new search, and completed journal receipts do not become live guidance',()=>{
 const h=setup();h.run("S.at='cheongju';globalThis.e=event('story_family_principle');G.beginPresentation(e);");paid(h,'story_family_principle',0);assert.equal(h.run('G.mainEvidenceReading()'),null);
 h.run("S.at='suwon';S.flags.father_fate_known=true;S.pendingPresentation=null;globalThis.e=event('history_parents_network');G.beginPresentation(e);");
 assert(h.run('G.mainEvidenceReading()'));assert.equal(h.run("QuestJournal.entry({id:'main_history_key_1_x',kind:'completed',status:'completed',chapterId:'verification-key'}).guide"),'');
});
test('regression observer exposes the current fuel-recovery control even above 5L when all routes are short',()=>{
 const fs=require('node:fs'),bridge=require('../qa-artifacts/expedition-repairs-20261021/departure-observer.cjs');
 const source=fs.readFileSync('qa-artifacts/persona-playtest-20261018/runner.cjs','utf8'),next=bridge.apply(source);
 assert.match(next,/localControls:G.canSeekFuel\(\)\?/);assert.match(next,/case 'walkfuel':act\('walkfuel',\(\)=>\{return G.seekFuel\(\);\}/);assert.doesNotMatch(next,/localControls:!G.isInfiniteResourceMode\(\)&&s.fuel<5/);
});
