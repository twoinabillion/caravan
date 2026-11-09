'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const H=require('./fixtures/qa-cycle103-eunsu-join/setup.cjs');
function start(id,{party=[],revision,day=6}={}){
 const h=H.setup();h.run(`S.pendingPresentation=null;S.party=${JSON.stringify(party)};S.day=${day};S.min=600;S.at=${JSON.stringify(id.startsWith('main_recovery_')?'suwon':id.startsWith('seoul_')?'seoul':'cheongju')};S.driving=null;S.food=20;S.water=20;S.fatigue=10;S.flags.parents_split_known=true;S.flags.parent_key_located=true;S.flags.parent_cache_shared=true;S.flags.parent_cache_guarded=true;G.save();G.load();globalThis.e=G.presentationEvent(${JSON.stringify(id)});if(e)G.beginPresentation(e);`);
 if(revision!==undefined){
  h.run(revision===null?'delete S.pendingPresentation.narrativeRevision;':`S.pendingPresentation.narrativeRevision=${JSON.stringify(revision)};`);
  // A historical owner has its historical entry text, not a new entry whose
  // version marker alone was deleted after the future words were captured.
  h.run('S.pendingPresentation.text=typeof e.text==="function"?e.text(S):e.text;');
 }
 return h;
}
const entry=h=>h.run('qaEntry(e).map(t=>t.text).join("\\n")');
const resolve=(h,ci=0)=>h.run(`globalThis.r=G.resolvePresentedChoice(e,e.choices[${ci}]);if(!r.ok)throw Error(r.why);`);
const result=h=>h.run('r.out.turns.map(t=>t.text).join("\\n")');
const economy=h=>h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.fuel,S.scrap,S.van,S.fatigue,S.items,S.notes])');

test('father result acknowledges only a companion actually present and freezes that reaction after payment',()=>{
 for(const id of ['parents_father_last_log','main_recovery_parents_father_last_log'])for(const ci of [0,1]){
  const h=start(id,{party:['minji']});resolve(h,ci);
  assert.match(result(h),/민지/,'a present person responds to the paid loss');
  assert.doesNotMatch(result(h),/강우|은수|박 선생|레오|재이/);
  const words=result(h),paid=economy(h),receipt=h.run('JSON.stringify(S.pendingPresentation)');
  h.run(`S.party=[];G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[${ci}]);`);
  assert.equal(h.run('r.applied'),false);assert.equal(result(h),words);assert.equal(economy(h),paid);
  assert.equal(h.run('JSON.stringify(S.pendingPresentation)'),receipt);
  h.run(`delete S.pendingPresentation.authoredView;delete S.pendingPresentation.view;delete S.pendingPresentation.reading;G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[${ci}]);`);
  assert.equal(h.run('r.out.frozenTextOnly'),true);assert.match(h.run('r.out.text'),/민지/);
  const solo=start(id);resolve(solo,ci);assert.doesNotMatch(result(solo),/민지|강우|은수|박 선생|레오|재이/);
 }
});

test('family status waits for the departure broadcast and is a one-shot current contact on early or late journeys',()=>{
 const h=start('story_doyun_family_update');
 assert(h.run('!!e'),'the family update is an authored journey beat');
 h.run("globalThis.b=D.journeyBeats.find(b=>b.id===e.id);S.stats.km=160;delete S.flags.bridge_departure_echo;");
 assert.equal(h.run('G.beatReady(b)'),false);h.run('S.flags.bridge_departure_echo=true;');assert.equal(h.run('G.beatReady(b)'),true);
 assert.match(entry(h),/하진/);assert.match(entry(h),/환승|대기구역/);assert.match(entry(h),/취소/);
 const before=economy(h);resolve(h);assert.equal(economy(h),before,'receiving news spends no survival resources or clock');
 h.run('G.queuePresentation();');assert.equal(h.run('G.beatReady(b)'),false,'a paid update does not become another journey beat');
 const late=start('story_doyun_family_update',{day:15});
 assert.match(entry(late),/하진/);assert.doesNotMatch(entry(late),/내일 새벽|오늘 새벽|몇 분 전|열이 내렸|다 나았/);
});

test('a paid investigation choice changes which existing cache record is read first, including northern recovery',()=>{
 for(const prefix of ['', 'main_recovery_'])for(const ci of [0,1]){
  const h=start(prefix+'parents_separated_work');resolve(h,ci);assert(h.run('r.applied'));
  h.run(`G.queuePresentation();S.pendingPresentation=null;globalThis.e=G.presentationEvent(${JSON.stringify(prefix+'story_personal_cache')});G.beginPresentation(e);`);
  const words=entry(h),manual=words.indexOf('분리 절차 수첩'),testimony=words.indexOf('증언 카드');
  assert(manual>=0&&testimony>=0,'both existing records remain available');
  assert.equal(manual<testimony,ci===0,'the selected investigation controls the next record order');
  const before=h.run('JSON.stringify(S)');entry(h);assert.equal(h.run('JSON.stringify(S)'),before,'reading has no hidden state effect');
 }
 const unknown=start('story_personal_cache');assert.match(entry(unknown),/발신 릴/,'unknown legacy receives the neutral cache, without claiming a paid order');
});

test('two recovered pages put the already learned principle to work and still pay exactly one key',()=>{
 for(const prefix of ['', 'main_recovery_'])for(const route of ['shared','guarded']){
  const h=start(prefix+'story_parent_route_'+route);const words=entry(h);
  assert.doesNotMatch(words,/전부 끄라는 게 아니었구나|기계를 끄는 순서가 아니라/);
  assert.match(words,/커넥터|배선|분리 순서/);assert.match(words,/강제 이송선/);
  h.run("S.items['부모님의 검증키']=0;");resolve(h);assert.equal(h.run("S.items['부모님의 검증키']"),1);
  h.run('G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);');assert.equal(h.run('r.applied'),false);assert.equal(h.run("S.items['부모님의 검증키']"),1);
 }
});

test('core cites a specific paid opening action and road effort, with neutral fallback for unknown or mismatched memories',()=>{
 const h=start('onboarding_first_road');resolve(h,2);h.run('G.queuePresentation();S.pendingPresentation=null;S.at="seoul";S.opening=S.opening||{};S.opening.decisions={opening_bus_repair:{choiceId:"hose_bypass"}};globalThis.e=G.presentationEvent("seoul_core");G.beginPresentation(e);');
 resolve(h,4);const words=result(h);assert.match(words,/호스/);assert.match(words,/관측망|스캔/);assert.match(words,/부품|시간/);
 const paid=words,receipt=h.run('JSON.stringify(S.pendingPresentation)');h.run('S.opening.decisions={};S.memories.choices={};G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[4]);');assert.equal(result(h),paid);assert.equal(h.run('JSON.stringify(S.pendingPresentation)'),receipt);
 const neutral=start('seoul_core');neutral.run('S.opening=null;S.memories.choices={bad:{id:"first_trace_scan",eventId:"another_event",choiceIndex:2}};');resolve(neutral,4);
 assert.doesNotMatch(result(neutral),/유나|호스를|스캔이 끝날|달구지 번호를/,'broad flags and forged/mismatched memory cannot invent a kindness');
});

test('all three actual opening payments return their distinct repair and every paid road choice keeps its own effort',()=>{
 const repairs=[['new_part',/내 부품 하나/],['scrap_collar',/고철을 말아/],['hose_bypass',/부품 대신 시간을/]];
 const traces=[/명령띠를 끊지 않고/,/전원을 끊고 저장 모듈/,/관측망에 등록/];
 for(let index=0;index<repairs.length;index++)for(const coreChoice of [1,4]){
  const [repair,want]=repairs[index],h=H.setup();
  h.run(`G.seedOverride=812;G.newGame('onroad','검수','interactive');globalThis.first=G.openingPending();G.resolveOpeningChoice(first.id,first.choices[0].id);G.continueOpening(first.id);globalThis.paid=G.resolveOpeningChoice('opening_bus_repair',${JSON.stringify(repair)});`);
  assert(h.run('paid.ok&&paid.applied'),'the repair must actually pay before its callback');
  h.run(`G.continueOpening('opening_bus_repair');for(let n=0;n<12&&G.openingPending();n++){const e=G.openingPending();if(e.nameInput)S.opening.nameDraft='검수';const c=e.choices.find(c=>G.reqOk(G.choiceReq(c)).ok);const r=G.resolveOpeningChoice(e.id,c.id);if(!r.ok)throw Error(r.why);G.continueOpening(e.id);}S.pendingPresentation=null;globalThis.e=G.presentationEvent('onboarding_first_road');G.beginPresentation(e);globalThis.trace=G.resolvePresentedChoice(e,e.choices[${index}]);G.queuePresentation();S.pendingPresentation=null;S.party=['minji'];S.at='seoul';globalThis.e=G.presentationEvent('seoul_core');G.beginPresentation(e);`);
  assert(h.run('trace.ok&&trace.applied'));resolve(h,coreChoice);const words=result(h);
  assert.match(words,want);assert.match(words,traces[index]);
  assert.doesNotMatch(words,/자기 일을 마치고|자기 일 끝내고|그 종이를 여기까지 가져왔어|번호가 남는 건 알았지만|다시 조여 달라고|도윤이가 바람이 따뜻해졌다고 했어|이 일지 첫 장/);
  const paid=result(h),balance=economy(h);h.run(`G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[${coreChoice}]);`);assert.equal(result(h),paid);assert.equal(economy(h),balance);
 }
});

test('Jaeyi responds to the displayed record in both father choices without inventing name-writing for the numberplate',()=>{
 for(const prefix of ['', 'main_recovery_'])for(const ci of [0,1]){
  const h=start(prefix+'parents_father_last_log',{party:['jaeyi']});resolve(h,ci);const words=result(h);
  assert.match(words,/재이/);assert.doesNotMatch(words,/엄마가|민지|강우|은수/);
  if(ci===0)assert.match(words,/아빠 이름/);
  else{assert.match(words,/정비 번호|표찰/);assert.doesNotMatch(words,/내가 적는 이름/,'a numberplate choice did not write a name');}
 }
});

test('a paid transfer update carries Hajin current location into both actual closing routes and all core methods',()=>{
 for(const closing of ['seoul_afterword_choice','seoul_session_reset'])for(const method of ['transfer','sleep','quarantine']){
  const h=start('story_doyun_family_update');resolve(h);assert.equal(h.run('S.flags.doyun_family_status_known'),true);
  h.run(`G.queuePresentation();S.pendingPresentation=null;S.at='seoul';S.flags.intro_family_helped=true;S.flags.mother_broadcast_ready=false;for(const m of ['transfer','sleep','quarantine'])S.flags['core_'+m]=m===${JSON.stringify(method)};globalThis.e=G.presentationEvent(${JSON.stringify(closing)});G.beginPresentation(e);`);
  resolve(h);const turns=h.json('r.out.turns'),phone=turns.find(t=>t.kind==='radio'&&t.who==='passer_woman'),words=result(h);
  assert(phone,'the known family receives the actual cancellation');assert.equal(phone.name,'하진 · 환승 대기구역');assert.match(words,/부두 연락소.*환승 대기구역/);
  assert.doesNotMatch(words,/엄마가 송신기|아빠는.*죽었다/,'a family update does not grant either parent payoff');
  const receipt=h.run('JSON.stringify(S.pendingPresentation)'),text=h.run('r.out.text');
  h.run('delete S.flags.doyun_family_status_known;G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);');
  assert.equal(h.run('r.applied'),false);assert.equal(result(h),words);assert.equal(h.run('JSON.stringify(S.pendingPresentation)'),receipt);
  h.run('delete S.pendingPresentation.authoredView;delete S.pendingPresentation.view;delete S.pendingPresentation.reading;G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);');assert.equal(h.run('r.out.text'),text);
 }
});

test('unknown family location and historical closing owners keep their dock call even if a later flag is present',()=>{
 for(const id of ['seoul_afterword_choice','seoul_session_reset'])for(const revision of [undefined,null,'afterword-timing-v2','unknown-closing']){
  const h=start(id,{revision});h.run(`S.flags.intro_family_helped=true;S.flags.doyun_family_status_known=${revision===undefined?'false':'true'};S.flags.mother_broadcast_ready=false;`);resolve(h);
  assert.equal(h.json('r.out.turns').find(t=>t.kind==='radio'&&t.who==='passer_woman').name,'하진 · 부산 부두');
  const words=result(h);h.run('G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);');assert.equal(result(h),words);assert.equal(h.run('r.applied'),false);
 }
});

test('unmarked, previous and unknown owners retain their prior entry and paid result with or without a stored view',()=>{
 for(const revision of [null,'family-records-v1','future-unknown'])for(const id of ['story_parent_route_shared','main_recovery_story_parent_route_shared']){
  const h=start(id,{revision});assert.match(entry(h),id.startsWith('main_recovery_')&&revision!=='family-records-v1'?/강제 이송선만 분리하는 순서/:/전부 끄라는 게 아니었구나|기계를 끄는 법이 아니라/);
  resolve(h);const paid=h.run('r.out.text'),state=economy(h);
  h.run('delete S.pendingPresentation.authoredView;delete S.pendingPresentation.view;delete S.pendingPresentation.reading;G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);');
  assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),paid);assert.equal(economy(h),state);
 }
 for(const revision of [null,'unrecognized']){
  const h=start('parents_father_last_log',{party:['minji'],revision});resolve(h);assert.doesNotMatch(result(h),/민지/);
 }
});
