const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup:engineSetup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const before=require('../qa-artifacts/discovery-repairs-20261020/before.json');
const setup=()=>{const h=engineSetup();h.run('G.save();G.load();');return h;};
const paid=(h,id,ci)=>h.run(`globalThis.e=event('${id}');G.beginPresentation(e);globalThis.p=G.resolvePresentedChoice(e,e.choices[${ci}]);`);
const replay=h=>{const old=h.run('JSON.stringify([S.day,S.min,S.scrap,S.water,S.food,S.fuel,S.flags,S.pendingPresentation])');
 assert(h.run('G.save();G.load()'));assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[S.pendingPresentation.choiceIndex]).applied'),false);
 assert.equal(h.run('JSON.stringify([S.day,S.min,S.scrap,S.water,S.food,S.fuel,S.flags,S.pendingPresentation])'),old);};
test('D01: current storm/fog/fatigue speed and forecast share the actual tick model',()=>{
 for(const wx of ['clear','storm','fog'])for(const fatigue of [0,80]){
  const h=setup();h.run(`S.wx='${wx}';S.fatigue=${fatigue};S.driving={from:'muju',to:'gimcheon',dist:1000,gone:0,road:'paved',slots:[],si:0};S.fuel=70;S.min=510;S._drowsyAt=S.day*1440+S.min;`);
  const shown=h.run('G.driveMinutes(38)');h.run('G.tick(.1)');
  const rate=h.run('S.driving.gone/(.1*7.4)');assert.equal(shown,Math.ceil(38/rate));
 }
 const h=setup();h.run("S.at='muju';S.known.push('gimcheon');S.wx='storm';S.min=510;S.fatigue=0;S.food=11;S.water=20;S.routePlan=null;");
 const f=h.json("G.travelForecast('gimcheon')");assert.equal(f.minutes,231);assert.equal(f.rationForecast.lunches,1);assert.equal(f.rationForecast.food,1);
 h.run("S.wx='fog'");assert.match(h.run("G.travelForecast('gimcheon').risk"),/안개/);
});
test('D02/D03: stopped orchard and daytime boat stay at the observed place/time',()=>{
 const h=setup();h.run("S.at='muju';S.driving=null");paid(h,'exp_orchard',1);assert.doesNotMatch(h.run('p.out.text'),/운전하며|차창 밖으로 팔/);assert.equal(h.run('S.at'),'muju');assert.equal(h.run('S.driving'),null);replay(h);
 const b=setup();b.run("S.at='danyang';S.min=531;S.fatigue=0");paid(b,'loc_danyang',0);assert.equal(b.run('S.min'),711);assert.doesNotMatch(b.run('p.out.text'),/노을/);assert.doesNotMatch(b.run('JSON.stringify(S.journal||S.notes)'),/노을/);replay(b);
});
for(const [id,resource,cost]of [['exp_underground','water',1],['loc_danyang','scrap',3]]){
 test(`D04/D05: ${id} voluntary payment is gated, clear, and has a free exit`,()=>{
  for(const stock of [0,cost-1,cost]){const h=setup();h.run(`S.at='danyang';S.${resource}=${stock};S.min=500;globalThis.e=event('${id}');G.beginPresentation(e);G.save();G.load();`);
   assert.equal(h.run('G.reqOk(G.choiceReq(e.choices[1])).ok'),stock>=cost);
   assert.match(h.run('e.choices[1].label'),new RegExp(`${resource==='water'?'물':'고철'}\\s*${cost}`));
   if(stock<cost){const state=h.run('JSON.stringify([S.day,S.min,S.water,S.food,S.scrap])');assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[1]).ok'),false);assert.equal(h.run('JSON.stringify([S.day,S.min,S.water,S.food,S.scrap])'),state);}
   const exit=h.run('e.choices.findIndex((c,i)=>i>1&&G.reqOk(G.choiceReq(c)).ok)');assert(exit>=2);
   const state=h.run('JSON.stringify([S.day,S.min,S.water,S.food,S.scrap])');paid(h,id,exit);assert.equal(h.run('JSON.stringify([S.day,S.min,S.water,S.food,S.scrap])'),state);replay(h);
   h.run('G.queuePresentation(null);G.save();G.load();');assert.equal(h.run('S.pendingPresentation'),null);assert(h.run('G.neighbors(S.at).some(n=>G.canTravelTo(n.id).ok)'));
  }
  const h=setup();h.run(`S.${resource}=${cost};S.min=500;`);paid(h,id,1);assert.equal(h.run(`S.${resource}`),0);replay(h);
 });
 test(`D04/D05: ${id} legacy paid text/chips/turn cursor survives new requirements`,()=>{
  const h=setup();h.run(`globalThis.e=event('${id}');S.${resource}=0;S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:1,outcomeIndex:0,text:'옛 지급 원문',chips:[{t:'기존 정산',c:'minus'}],view:{turns:[{kind:'narration',text:'옛 첫 줄'},{kind:'thought',text:'옛 다음 줄'}],index:1}};G.save();G.load();globalThis.p=G.resolvePresentedChoice(e,e.choices[1]);`);
  assert.equal(h.run('p.applied'),false);assert.equal(h.run('p.out.text'),'옛 지급 원문');assert.equal(h.run('S.pendingPresentation.view.index'),1);assert.equal(h.run(`S.${resource}`),0);replay(h);
 });
}
test('D05: the actual Danyang arrival still offers the gated encounter',()=>{
 const h=setup();h.run("S.at=null;S.driving={from:'chungju',to:'danyang',dist:1,gone:1,road:'paved',slots:[],si:0};S.flags.armed_age=true;S.used=[];globalThis.offered=[];UI.onArrive=()=>{};UI.showEvent=e=>{offered.push(e.id);G.beginPresentation(e)};G.arrive();G.finishArrival('danyang');");
 assert(h.run("offered.includes('loc_danyang')"));assert.equal(h.run('S.at'),'danyang');
});
test('D06/D07: short companionship and empty inventory do not assert weeks or a fictional theft',()=>{
 const h=setup();h.run("S.day=6;S.min=1170;S.party=['kangwoo'];S.comps.kangwoo.bond=8");paid(h,'talk_kw_18',1);assert.doesNotMatch(h.run('p.out.text'),/셋째 주|둘째 주/);assert.match(h.run('p.out.text'),/물/);replay(h);
 for(const scrap of [0,1,4,5]){const b=setup();b.run(`S.scrap=${scrap};globalThis.e=event('camp_thief');e.choices[0]={...e.choices[0],out:[e.choices[0].out[0]]};`);paid(b,'camp_thief',0);assert.equal(b.run('S.scrap'),Math.max(0,scrap-4));assert.doesNotMatch(b.run('p.out.text'),/고철 몇 개가 사라진/);assert.equal(b.run('e.storyOrigin.kind'),'memory');replay(b);}
});
test('D08: failed anchor read survives reload and introduces the existing auxiliary rope re-rig',()=>{
 const h=setup();h.run("G.applyFx({combatStart:{id:'ridge',threat:'비탈에 걸린 우편 수레',kind:'구조'}});S.combat.read={label:'줄이 하나뿐이라 한 번에 한 사람',tactics:['릴레이']};S.combat.pressure=2;G.save();G.load();globalThis.e=event('route_ridge_extract');G.beginPresentation(e);");
 assert.match(h.run('S.pendingPresentation.text'),/보조줄/);assert.match(h.run('S.pendingPresentation.text'),/달구지/);assert.match(h.run('e.choices[0].label'),/다시/);assert.equal(h.run('S.combat.pressure'),2);
 const raw=h.run('S.pendingPresentation.text');h.run('G.save();G.load();G.beginPresentation(e)');assert.equal(h.run('S.pendingPresentation.text'),raw);
 paid(h,'route_ridge_extract',0);assert(h.run('p.ok'));replay(h);
});
test('D08 real chain: failed equipment outcome keeps pressure/cost through Continue and reload',()=>{
 const h=setup();h.run("S.at='sangju';S.min=510;S.scrap=20;G.applyFx({combatStart:{id:'ridge',threat:'비탈에 걸린 우편 수레',kind:'구조'}});globalThis.e=event('route_ridge_anchor');globalThis.oldPick=G.pickOutcome;G.pickOutcome=(ev,c)=>ev.id==='route_ridge_anchor'?{...c.out[1],presentationOutcomeIndex:1}:oldPick(ev,c);G.beginPresentation(e);globalThis.p=G.resolvePresentedChoice(e,e.choices[1]);");
 assert.equal(h.run('S.scrap'),18);assert.equal(h.run('S.min'),540);assert.equal(h.run('S.combat.pressure'),2);replay(h);
 const next=h.run('G.queuePresentation(null)');assert.equal(next,'route_ridge_extract');
 h.run("G.save();G.load();UI.showEvent=ev=>G.beginPresentation(ev);G.presentTransition();globalThis.e=event('route_ridge_extract');G.beginPresentation(e)");
 assert.match(h.run('S.pendingPresentation.text'),/기울어진 기둥에서 보조줄/);assert.equal(h.run('S.combat.read.label'),'줄이 하나뿐이라 한 번에 한 사람');
 paid(h,'route_ridge_extract',0);assert(h.run('p.ok'));replay(h);
});
test('D01 observed storm leg: the shared forecast includes the midday ration actually consumed',()=>{
 const h=setup();h.run("S.at='muju';S.known.push('gimcheon');S.wx='storm';S.min=510;S.fatigue=0;S.food=11;S.water=20;S.fuel=70;S.routePlan=null;S._breakfastDay=S.day;S._lunchDay=S.day-1;globalThis.forecast=G.travelForecast('gimcheon');G.startTravel('gimcheon');S.driving.slots=[];UI.onArrive=()=>{};globalThis.steps=0;while(S.driving&&steps++<1000)G.tick(.5);");
 assert.equal(h.run('S.at'),'gimcheon');assert.equal(h.run('S.food'),10);assert.equal(h.run('forecast.rationForecast.food'),1);
 assert(h.run('Math.abs((S.min-510)-forecast.minutes)<4'));
});
test('actual reader preserves the revised companion and rescue speakers, including entry reload',()=>{
 const h=setup();h.run("S.party=['kangwoo'];globalThis.e=event('talk_kw_18');globalThis.o=e.choices[1].out[0];");
 assert.deepEqual(h.json("buildStoryTurns(o.text,e,{turnSpeakers:o.turnSpeakers}).filter(t=>t.kind==='dialogue').map(t=>t.who)"),['kangwoo','kangwoo','me']);
 h.run("globalThis.e=event('loc_danyang');globalThis.o=e.choices[0].out[0]");
 assert.deepEqual(h.json("buildStoryTurns(o.text,e,{turnSpeakers:o.turnSpeakers}).filter(t=>t.kind==='dialogue').map(t=>t.who)"),['me','passer_elder']);
 h.run('globalThis.o=e.choices[1].out[0]');
 assert.deepEqual(h.json("buildStoryTurns(o.text,e,{turnSpeakers:o.turnSpeakers}).filter(t=>t.kind==='dialogue').map(t=>t.who)"),['passer_elder','me','passer_elder']);
 for(const kind of ['stopped','driving']){h.run(`S.at='muju';S.driving=${kind==='stopped'?'null':"{from:'muju',to:'gimcheon',dist:38,gone:2,road:'rough',slots:[],si:0}"};G.queuePresentation(null);globalThis.e=event('crisis_nofuel3');G.beginPresentation(e);globalThis.text=S.pendingPresentation.text;`);
  const turns=h.json('buildStoryTurns(text,e)');assert.equal(turns.filter(t=>t.kind==='ai').length,kind==='driving'?1:0);
  h.run('G.save();G.load();G.beginPresentation(e)');assert.equal(h.run('S.pendingPresentation.text'),h.run('text'));
 }
});
test('C01/C02: first contact identifies the captain; new nonlinear camp choice names the switch of subject',()=>{
 const h=setup();assert.match(h.run("prose(event('cell_sea_meet').text)"),/김 선장/);
 assert.match(h.run("D.campConversationData({cid:'minji',chapter:2,previousChoiceId:'sort',choiceVisits:{sort:1}}).choices.find(c=>c.id==='listen').label"),/퓨즈/);
 assert.doesNotMatch(h.run("D.campConversationData({cid:'minji',chapter:2,previousChoiceId:'sort'}).choices.find(c=>c.id==='listen').label"),/퓨즈 정리 대신/);
});
test('C03/C04: shortage above 5L can use the public fuel action, without free fuel or changing escalation',()=>{
 const h=setup();h.run("S.at='muju';S.driving=null;S.fuel=5.6503;S.routePlan={id:'market',status:'active',visited:['gimcheon','muju']};S.known.push(...G.neighbors('muju').map(n=>n.id));S.fatigue=0;S._rescues={};");
 assert(h.run("G.neighbors(S.at).filter(n=>G.canTravelTo(n.id).ok).every(n=>G.travelForecast(n.id).shortage)"));
 assert(h.run('S.fuel>=5'));assert.equal(h.run('G.canSeekFuel()'),true);
 const stock=h.run('S.fuel');h.run("globalThis.offered=null;G.openEventById=id=>{offered=id;G.beginPresentation(event(id))};G.seekFuel()");assert.equal(h.run('offered'),'crisis_nofuel');assert.equal(h.run('S.fuel'),stock);assert.equal(h.run('S._rescues.nofuel'),1);
 assert.doesNotMatch(h.run('S.pendingPresentation.text'),/엔진이 두 번 기침|가장 가까운 사람 사는 곳/);assert.match(h.run('S.pendingPresentation.text'),/무주/);
 for(const id of ['crisis_nofuel2','crisis_nofuel3']){h.run('G.queuePresentation(null);G.seekFuel()');assert.equal(h.run('offered'),id);assert.doesNotMatch(h.run('S.pendingPresentation.text'),/엔진이.*잠들|이번에도 길 위/);}
 h.run('G.queuePresentation(null);S.fuel=70');assert.equal(h.run('G.canSeekFuel()'),false);assert.equal(h.run('G.seekFuel()'),false);
 h.run("S.fuel=1;S.driving={from:'muju',to:'gimcheon'}");assert.equal(h.run('G.canSeekFuel()'),false);assert.match(h.run("prose(event('crisis_nofuel').text)"),/엔진이 두 번 기침/);
 h.run("S.driving=null;location.search='?infinite-resources=1'");assert.equal(h.run('G.canSeekFuel()'),false);
 const ui=fs.readFileSync('src/07-ui.js','utf8');assert.match(ui,/if\(G\.canSeekFuel\(\)\) localActions/);assert.match(ui,/wf\.onclick=.*G\.seekFuel\(\)/);
});
test('C05-C08: address, loot, kinship and the existing-letter prerequisite are explicit',()=>{
 const h=setup();h.run('S.party=[];S.recruitQ=null');assert.doesNotMatch(h.run("prose(event('cell_mountain_meet').choices[0].out[0].text)"),/우리 얼굴/);
 assert.match(h.run("prose(event('ev_hospital_pharmacy').choices[0].out[0].text)"),/영양식/);
 assert.match(h.run("prose(event('story_generation_form').text)"),/노인의 증조모, 할머니, 어머니/);
 assert.match(h.run("event('ev_post_office').choices[1].label"),/맡은 편지/);assert.equal(h.run("G.reqOk(G.choiceReq(event('ev_post_office').choices[1])).ok"),false);
 const main=fs.readFileSync('src/03k-main-evidence.js','utf8');assert.doesNotMatch(main,/너희가 들어가면 여섯 주파수/);
});
test('discovery repair mechanics: preserve all prior indices, outcomes, probabilities, costs and rewards',()=>{
 const clean=value=>JSON.parse(JSON.stringify(value,(k,v)=>['text','label','title','turns','turnSpeakers','readingRecord','note'].includes(k)?undefined:v));
 for(const [id,old]of Object.entries(before.events)){const h=setup(),now=h.json(`event('${id}')`);
  if(['loc_danyang','exp_underground'].includes(id)){assert.deepEqual(clean(now.choices.pop()),{out:[{p:1,fx:{}}]});delete now.choices[1].req;}
  if(['crisis_nofuel','crisis_nofuel2','crisis_nofuel3'].includes(id)){
   const cost=id==='crisis_nofuel'?2:3;
   assert.equal(now.choices[0].foreseeable.expense,`보유한 물·식량에서 각각 최대 ${cost} 소모 · 도보 중 끼니 소모 별도`);
   now.choices[0].foreseeable.expense=old.choices[0].foreseeable.expense;
  }
  assert.deepEqual(clean(now),clean(old),id);
 }
});
