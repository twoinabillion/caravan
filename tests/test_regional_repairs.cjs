const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup:engineSetup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const setup=()=>{const h=engineSetup();h.run('G.save();G.load();');return h;};
const ui=fs.readFileSync('src/07-ui.js','utf8');
const before=require('../qa-artifacts/regional-repairs-20261020/before.json');
const localBefore=require('../qa-artifacts/regional-repairs-20261020/local-before.json');
const paid=(h,id,ci)=>h.run(`globalThis.e=event('${id}');G.beginPresentation(e);globalThis.p=G.resolvePresentedChoice(e,e.choices[${ci}]);`);
const replay=h=>{const old=h.run('JSON.stringify([S.day,S.min,S.scrap,S.water,S.food,S.flags,S.pendingPresentation])');
 assert(h.run('G.save();G.load()'));assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[S.pendingPresentation.choiceIndex]).applied'),false);
 assert.equal(h.run('JSON.stringify([S.day,S.min,S.scrap,S.water,S.food,S.flags,S.pendingPresentation])'),old);};
function market(h){h.run("let curStl='miryang',stlQuests=[];");h.run(ui.match(/  const ITEM_ICO=.*;/)[0]);
 h.run(ui.slice(ui.indexOf('  function marketFieldRows(){'),ui.indexOf('  function fieldBoardRow(row){')));}
test('R01: bakery has a free exit at zero scrap, unpaid reload, and paid purchase retains index0',()=>{
 for(const scrap of [0,1,2,3]){const h=setup();h.run(`S.at='gunsan';S.scrap=${scrap};S.min=500;globalThis.e=event('lc_gunsan_bakery');G.beginPresentation(e);G.save();G.load();`);
  assert.equal(h.run('G.reqOk(G.choiceReq(e.choices[0])).ok'),scrap>=3);
  const free=h.run('e.choices.findIndex((c,i)=>i>0&&G.reqOk(G.choiceReq(c)).ok)');assert(free>0);
  const old=h.run('JSON.stringify([S.scrap,S.food,S.day,S.min])');paid(h,'lc_gunsan_bakery',free);
  assert.equal(h.run('JSON.stringify([S.scrap,S.food,S.day,S.min])'),old);replay(h);
  assert.equal(h.run('G.queuePresentation(null)'),null);assert.equal(h.run('S.pendingPresentation'),null);
 }
 const h=setup();h.run('S.scrap=3;S.food=5;');paid(h,'lc_gunsan_bakery',0);
 assert.equal(h.run('S.scrap'),0);assert.equal(h.run('S.food'),7);replay(h);
});
test('R06: full or partially fitting fuel batch is refused before charging, UI and engine agree',()=>{
 for(const amount of [70,65,60]){const h=setup();h.run(`S.at='miryang';S.fuel=${amount};S.scrap=30;S.min=500;`);market(h);
  h.run("globalThis.i=D.stls.miryang.trade.findIndex(r=>r[1]==='fuel');");
  const fits=h.run('G.canStoreSupply(\'fuel\',D.stls.miryang.trade[i][2])');assert.equal(fits,amount<=60);
  const row=h.json('marketFieldRows().supplyRows.find(r=>r.index===i&&r.kind===\'trade\')');assert.equal(row.enabled,fits);
  const pre=h.run('JSON.stringify([S.fuel,S.scrap,S.day,S.min])');const out=h.json("G.trade('miryang',i)");
  assert.equal(out.ok,fits);if(!fits)assert.equal(h.run('JSON.stringify([S.fuel,S.scrap,S.day,S.min])'),pre);
  else{assert.equal(h.run('S.fuel'),70);assert(h.run('S.scrap<30'));assert.equal(h.run('S.min'),525);}
 }
 const h=setup();h.run("location.search='?infinite-resources=1';S.fuel=70;S.scrap=0;");assert.equal(h.run("G.trade('miryang',0).ok"),true);
});
test('R01 class: all four sibling paid local encounters retain their purchase and a zero-scrap exit',()=>{
 const mechanics=value=>JSON.parse(JSON.stringify(value,(k,v)=>['text','label','turns','turnSpeakers','readingRecord','note'].includes(k)?undefined:v));
 for(const [id,old] of Object.entries(localBefore)){
  const h=setup();h.run(`S.party=['minji'];S.at=${JSON.stringify(old.nearNode[0])};S.scrap=0;globalThis.e=event('${id}');G.beginPresentation(e);G.save();G.load();`);
  assert(h.run(`G.nodeEvents(S.at).some(e=>e.id==='${id}')`));
  assert.equal(h.run('G.reqOk(G.choiceReq(e.choices[0])).ok'),false);assert(h.run('G.reqOk(G.choiceReq(e.choices[1])).ok'));
  assert.deepEqual(mechanics(h.json('e.choices[0]')),mechanics(old.choices[0]));
  const state=h.run('JSON.stringify([S.scrap,S.food,S.water,S.day,S.min])');paid(h,id,1);
  assert.equal(h.run('JSON.stringify([S.scrap,S.food,S.water,S.day,S.min])'),state);replay(h);h.run('G.queuePresentation(null)');
  assert.equal(h.run('S.pendingPresentation'),null);assert(h.run('G.neighbors(S.at).length>0'));
 }
});
test('R01 actual repeat search can offer the low-balance bakery and the authored exit returns to next road actions',()=>{
 const h=setup();h.run("G.seedOverride=1;G.newGame('onroad','상혁','interactive');S.opening.completed=true;S.at='gunsan';S.driving=null;S.scrap=0;S.min=500;S.fatigue=0;S._salvagedNodes.gunsan=true;S._exploreDay=S.day;S._exploreNodes={gunsan:1};globalThis.offered=null;UI.showEvent=e=>{offered=e.id;G.beginPresentation(e);};G.explore();G.save();G.load();");
 assert.equal(h.run('offered'),'lc_gunsan_bakery');assert.equal(h.run('S.scrap'),2);
 paid(h,'lc_gunsan_bakery',1);replay(h);h.run('G.queuePresentation(null);G.save();G.load();');
 assert.equal(h.run('S.pendingPresentation'),null);assert(h.run('G.neighbors(S.at).some(n=>G.canTravelTo(n.id).ok)'));
});
test('R08: zero-water donation cannot claim a gift, unpaid reload retains a no-supply exit',()=>{
 const h=setup();h.run("S.at='hapcheon';S.water=0;globalThis.e=event('near_hapcheon_sutra');G.beginPresentation(e);G.save();G.load();");
 assert.equal(h.run('G.reqOk(G.choiceReq(e.choices[1])).ok'),false);
 assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[1]).ok'),false);
 assert.match(h.run('G.reqCostText(G.choiceReq(e.choices[1]))'),/물.*1/);
 const free=h.run('e.choices.findIndex((c,i)=>i>1&&G.reqOk(G.choiceReq(c)).ok)');assert(free>1);paid(h,'near_hapcheon_sutra',free);replay(h);
 const yes=setup();yes.run('S.water=1;');paid(yes,'near_hapcheon_sutra',1);assert.equal(yes.run('S.water'),0);replay(yes);
});
test('R10: two scrap prepare both rigging outcomes, charge remains1/2, and other tactics stay available',()=>{
 for(const scrap of [0,1,2]){const h=setup();h.run(`S.scrap=${scrap};globalThis.e=event('route_ridge_anchor');G.beginPresentation(e);G.save();G.load();`);
  assert.equal(h.run('G.reqOk(G.choiceReq(e.choices[1])).ok'),scrap>=2);
  assert(h.run('e.choices.some((c,i)=>i!==1&&G.reqOk(G.choiceReq(c)).ok)'));
  assert.match(h.run('JSON.stringify(G.choiceForeseeable(e.choices[1]))'),/1.*2/);
 }
 for(const oi of [0,1]){const h=setup();h.run(`S.scrap=2;globalThis.e=event('route_ridge_anchor');G.pickOutcome=()=>({...e.choices[1].out[${oi}],presentationOutcomeIndex:${oi}});`);
  paid(h,'route_ridge_anchor',1);assert.equal(h.run('S.scrap'),1-oi);replay(h);assert.equal(h.run('G.queuePresentation(null)'),'route_ridge_extract');}
});
test('R05: market opening waits for Muju on queue, transition and unpaid Continue, not a paid legacy result',()=>{
 const h=setup();h.run("S.at='gimcheon';S.driving=null;S._storyQueue=[];G.chooseRoute('market');");
 assert.deepEqual(h.json("G.eventLocation(event('route_market_convoy'))"),{kind:'node',nodes:['muju']});
 assert.equal(h.run('G.popStory()'),null);assert(h.run("S._storyQueue.includes('route_market_convoy')"));
 h.run("S.pendingPresentation={version:1,phase:'transition',eventId:'route_market_convoy'};G.save();G.load();");
 assert.equal(h.run('G.presentTransition()'),false);assert.equal(h.run('S.pendingPresentation'),null);
 h.run("globalThis.shown=[];UI.showEvent=e=>shown.push(e.id);S.used.push('route_market_convoy');S.pendingPresentation={version:1,phase:'event',eventId:'route_market_convoy'};G.save();G.load();G.resumePresentation();");
 assert.deepEqual(h.json('shown'),[]);
 h.run("S.at='muju';");assert.equal(h.run('G.popStory()'),'route_market_convoy');
 h.run("S.at='gimcheon';S.pendingPresentation={version:1,phase:'result',eventId:'route_market_convoy',choiceIndex:0,outcomeIndex:0,text:'옛 지급 결과',chips:[]};G.save();G.load();");
 assert.equal(h.run('G.resumePresentation()'),true);assert.deepEqual(h.json('shown'),['route_market_convoy']);
 assert.equal(h.run("G.deferRouteOpening('route_market_mask')"),false);
 for(const flag of ['route_market_escorted','route_market_escorted_partial','route_market_failed']){
  const x=setup();x.run(`S.at='muju';S.used.push('route_market_convoy');S.flags['${flag}']=true;S._storyQueue=['route_market_convoy'];`);
  assert.equal(x.run('G.popStory()'),null);
 }
});
test('old paid receipts bypass new spending gates and retain text, chips and reading cursor; another choice cannot replace them',()=>{
 for(const [id,ci] of [['lc_gunsan_bakery',0],['near_hapcheon_sutra',1],['route_ridge_anchor',1],['seoul_ruins',0]]){
  const h=setup(),text=before.events[id].choices[ci].out[0].text;
  h.run(`S.scrap=0;S.water=0;globalThis.e=event('${id}');S.pendingPresentation={version:1,phase:'result',eventId:'${id}',choiceIndex:${ci},outcomeIndex:0,text:${JSON.stringify(text)},chips:[{t:'옛 지급 영수증',c:'item'}],view:{turns:[{kind:'narration',text:'옛 첫 줄'},{kind:'thought',text:'옛 다음 줄'}],index:1}};G.save();G.load();`);
  const frozen=h.run('JSON.stringify(S.pendingPresentation)'),resources=h.run('JSON.stringify([S.water,S.scrap,S.day,S.min])');
  h.run(`globalThis.result=G.resolvePresentedChoice(e,e.choices[${ci}]);`);
  assert.equal(h.run('result.applied'),false);assert.equal(h.run('result.out.text'),text);
  assert.equal(h.run('result.out.turns[1].text'),'옛 다음 줄');assert.equal(h.run('S.pendingPresentation.view.index'),1);
  assert.equal(h.run('JSON.stringify(S.pendingPresentation)'),frozen);assert.equal(h.run('JSON.stringify([S.water,S.scrap,S.day,S.min])'),resources);
  assert.equal(h.run(`G.resolvePresentedChoice(e,e.choices[${ci===0?1:0}]).ok`),false);
 }
 const h=setup();h.run("globalThis.e=event('seoul_ruins');S.pendingPresentation={version:1,phase:'result',eventId:e.id,choiceIndex:0,outcomeIndex:0,text:'옛 기록 그대로',chips:[]};globalThis.out=G.resolvePresentedChoice(e,e.choices[0]).out;");
 assert.equal(h.run('out.text'),'옛 기록 그대로');assert.equal(h.run('out.frozenTextOnly'),true);assert.equal(h.run('out.turns'),null);
});
test('clarifications do not assert current direction, earlier visits, contact or a new six-second reset; crisis hints retain uncertain rescue',()=>{
 const h=setup();
 assert.doesNotMatch(h.run("event('memory_busan_terminal').choices[1].out[0].text"),/여전히 북쪽/);
 assert.doesNotMatch(h.run("event('parents_diversion_manifest').text"),/환승소에서 찾은/);
 assert.doesNotMatch(h.run("event('meet_postman').choices[0].out[0].text"),/우리가 스친/);
 assert.doesNotMatch(h.run("event('combat_toll_breach').text"),/아직 사이렌|지금부터/);
 assert.doesNotMatch(h.run("event('combat_toll_breach').choices[3].out[0].text"),/손댄 채|손댄 흔적/);
 assert.doesNotMatch(h.run("event('story_bridge_departure_echo').text"),/멀어질 즈음/);
 assert.match(h.run("event('story_parent_route_shared').text"),/전달자 서진/);
 for(const id of ['crisis_nofuel','crisis_nofuel2']){
  assert.match(h.run(`JSON.stringify(G.choiceForeseeable(event('${id}').choices[1]))`),/유료 지원 시|지원이 없으면/);
  assert.equal(h.run(`G.choiceReq(event('${id}').choices[1])`),null);
 }
});
test('R11: actual result parser attributes the solo ruins question to the player and freezes its turns',()=>{
 const h=setup();h.run("S.party=[];S.recruitQ=null;globalThis.e=event('seoul_ruins');globalThis.out=e.choices[0].out[0];globalThis.entry=buildStoryTurns(prose(e.text),e,{turnSpeakers:D.finaleSpeakers(e.id,-1,S)||e.turnSpeakers});");
 const turns=h.json('buildStoryTurns(out.text,e,{knownSpeaker:!!entry.knownSpeaker,speakers:out.speakers,turnSpeakers:D.finaleSpeakers(e.id,0,S)||out.turnSpeakers})');
 assert.equal(turns.find(t=>t.text==='뭘 위해서.').who,'me');
 paid(h,'seoul_ruins',0);assert.equal(h.run('p.out.turns.find(t=>t.text===\'뭘 위해서.\').who'),'me');replay(h);
});
test('R14/R15: current naming entry does not pre-complete30minutes or promise afternoon, sauna promises its real8hours',()=>{
 const h=setup();h.run("S.party=['minji','kangwoo'];S.min=390;");
 assert.doesNotMatch(h.run("prose(event('comp_naming').text)"),/오후|30분 뒤.*이름을 갖/);
 paid(h,'comp_naming',0);assert.equal(h.run('S.min'),420);replay(h);
 assert.match(h.run("event('exp_jjimjil').choices[1].label"),/8시간/);
 assert.equal(h.run("event('exp_jjimjil').choices[1].out[0].fx.time"),480);
});
test('only declared resource gates, free exits, tactical disclosure and prose metadata change the baseline events',()=>{
 const h=setup(),strip=rows=>JSON.parse(JSON.stringify(rows,(k,v)=>['text','label','title','turnSpeakers','turns','readingRecord','note'].includes(k)?undefined:v));
 const rows=h.json(`JSON.parse(JSON.stringify(${JSON.stringify(Object.keys(before.events))}.map(id=>event(id))))`);
 const base=Object.values(before.events);
 require('../tools/story-review-contract.cjs').expedition(rows);
 for(const row of rows){
  if(row.id==='lc_gunsan_bakery'||row.id==='near_hapcheon_sutra'){
   const exit=row.choices.pop();assert.deepEqual(strip(exit),{out:[{p:1,fx:{}}]});
   if(row.id==='near_hapcheon_sutra'){assert.deepEqual(row.choices[1].req,{water:1});delete row.choices[1].req;}
  }
  if(row.id==='route_ridge_anchor'){assert.deepEqual(row.choices[1].req,{scrap:2});delete row.choices[1].req;
   assert.equal(row.choices[1].foreseeable.expense,'고철 1~2 · 실패에 대비해 2 필요');delete row.choices[1].foreseeable;}
  if(['crisis_nofuel','crisis_nofuel2','crisis_nofuel3'].includes(row.id))row.choices.forEach(c=>{assert(c.foreseeable);delete c.foreseeable;});
 }
 assert.deepEqual(strip(rows),strip(base));
});
