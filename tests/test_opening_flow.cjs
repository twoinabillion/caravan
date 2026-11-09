'use strict';
// Private unit VMs and immutable retained saves; not fresh persona journeys.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),base=path.join(root,'qa-artifacts/remaining-20261108/cohort02/survival/agent218/attempt01');
const before=path.join(root,'qa-artifacts/opening-flow-20261108/before/src');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const reader=require('../qa-artifacts/remaining-20261108/cohort02/survival/reader-runtime.cjs');
// Post-run checkpoints are intentionally outside the pre-run source freeze.
const checkpointHashes={
 'scene-onboarding_first_road-entry-38.json':'b82447e2e334d4689f110656b2549cf7a784b90b40156cf9d6fcd8a34afb7ad1',
 'scene-onboarding_first_road-result-38.json':'a2bd0a0c96fce0eecfdaddf065f6c0f00009f83fa87c564ddd848c8c7580cd5f',
 'scene-opening_bus_repair-entry-7.json':'49f823db225cb7cae79455d25df033ee123afe6d91ecbedf2501053afe798797',
 'scene-opening_bus_repair-result-7.json':'1d1188f5dad4945cab807dc8718c411736dbf922da94a0c4994f0bc435988912',
 'scene-opening_departure-entry-23.json':'397e6b116bf2f89d6def09840851f1d06916a14071964d098c4b4ba62c462d60',
 'scene-opening_departure-result-23.json':'d1d61d749abe062b11373f59b638372d9e370d79da2f14d831740b90092ed49a',
 'scene-opening_failed_appeal-entry-15.json':'8d1946587e4384be916b596c613d4f6877b6cd89ccd783ded54cb5861bd90b8f',
 'scene-opening_failed_appeal-result-15.json':'5b677e218f88c126d0aa2802dab10f36ffb5f47684f12659ac1fe5b106b32b78',
 'scene-opening_farewell-entry-27.json':'560104dc0f2691401cc3da444c82263b089373fd28b8836118600c837c235bde',
 'scene-opening_farewell-result-27.json':'e5062ef780d2107c157f8e29f28722a505c62fe2cf92fab04fa9b3c1905814be',
 'scene-opening_parents_module-entry-19.json':'86c9259527510687784e43e9f60ef0f1adea26d2e85381b7775e3500c48abd3b',
 'scene-opening_parents_module-result-19.json':'68a3adc0fa92a822e3022d563dd6200bd3b25a729ab7438cf2ff608c5fb1042f',
 'scene-opening_workshop-entry-3.json':'a469dc51131a8154027f227df47c411a34bce45b8ad212316314fbadfd7f1d69',
 'scene-opening_workshop-result-3.json':'5dc9804a11decc551187b06428584f74241b956b8b3acab068448455c61a225a'
},sourceCache=new Map();
const revision='opening-flow-v1',copy=x=>JSON.parse(JSON.stringify(x));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function source(file){if(!sourceCache.has(file))sourceCache.set(file,fs.readFileSync(file,'utf8'));return sourceCache.get(file);}
function retained(id,phase){
 const file=fs.readdirSync(base).find(f=>f.startsWith(`scene-${id}-${phase}-`));assert(file,'Required closed218 checkpoint '+id+' '+phase);
 const absolute=path.join(base,file),bytes=fs.readFileSync(absolute);assert.equal(sha(bytes),checkpointHashes[file],'Closed218 checkpoint immutable');return JSON.parse(bytes);
}
function engine(legacy=false,raw){
 const store=new Map(),noop=()=>{},UI=new Proxy({modalOpen:()=>false},{get:(o,k)=>o[k]||noop}),DateFixed=class extends Date{static now(){return 1793014000000;}};
 const ctx=vm.createContext({console,Date:DateFixed,URLSearchParams,location:{search:''},setTimeout:()=>0,clearTimeout:noop,document:{readyState:'loading',addEventListener:noop},window:{dispatchEvent:noop},CustomEvent:function(){},UI,SND:new Proxy({},{get:()=>noop}),localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
 const run=code=>vm.runInContext(code,ctx),json=code=>JSON.parse(run('JSON.stringify('+code+')'));
 for(const file of [...STATIC_CONTENT_FILES,...fs.readdirSync(path.join(root,'src')).filter(f=>/^04[a-h]-.*\.js$/.test(f)).sort().map(f=>'src/'+f)]){
  const selected=legacy&&['src/03o-story-refinement.js','src/04a-engine-core.js'].includes(file)?path.join(before,path.basename(file)):path.join(root,file);run(source(selected));
 }
 run(source(path.join(root,'src/07h-story-pages.js')));
 const journal=source(path.join(root,'src/07d-ui-quests.js'));run(journal.slice(0,journal.indexOf('const QuestLedgerUI=')));
 run(reader.code()+`;globalThis.qaEvent=id=>G.openingPending()?.id===id?G.openingPending():G.presentationEvent(id);`);
 // These are the current UI's reader-expression and owner-restore ordering.
 run(`globalThis.qaMountedEntry=id=>{const evd=qaEvent(id);globalThis.e=evd;G.beginPresentation(evd);const turns=qaEntry(evd),info=eventScenePresentation(evd,'event',[],turns);const state={eventId:id,phase:'event',turns,...info,index:0,knownSpeaker:!!turns.knownSpeaker,readingRecord:typeof evd.readingRecord==='function'?evd.readingRecord(S):evd.readingRecord,readingRecordLabel:evd.readingRecordLabel||''};G.restorePresentationView(state);return state;};
 globalThis.qaMountedResult=(id,choiceId,history)=>{const evd=qaEvent(id),choice=typeof choiceId==='number'?evd.choices[choiceId]:evd.choices.find(c=>c.id===choiceId);globalThis.e=evd;const result=G.resolvePresentedChoice(evd,choice,history);if(!result.ok)throw Error(result.why||'Choice failed');const turns=qaResult(evd,choice,result.out,{knownSpeaker:!!history?.knownSpeaker}),ci=evd.choices.indexOf(choice),cuts=[result.out.scenes,result.out.scene,choice.scenes,choice.scene,D.eventChoiceScenes?.[id]?.[ci]];let info=eventScenePresentation(evd,'outcome',cuts,turns);if(!cuts.some(v=>Array.isArray(v)?v.some(Boolean):!!v))info=eventScenePresentation(evd,'outcome',history?.sceneKeys?.length?[history.sceneKeys[0]]:[],turns);const state={eventId:id,phase:'outcome',turns,...info,index:0,knownSpeaker:!!turns.knownSpeaker,history:result.applied?G.presentationView(history):null,selection:choice.label,readingRecord:typeof result.out.readingRecord==='function'?result.out.readingRecord(S):result.out.readingRecord};G.restorePresentationView(state);return {applied:result.applied,text:typeof result.out.text==='function'?result.out.text(S):result.out.text,frozenTextOnly:result.out.frozenTextOnly,state};};`);
 UI.showEvent=e=>run('G.beginPresentation(G.presentationEvent('+JSON.stringify(e.id)+'))');
 if(raw)assert(run('G.load('+JSON.stringify(JSON.stringify(raw))+')'));
 return {ctx,run,json,entry:id=>json('qaMountedEntry('+JSON.stringify(id)+')'),result:(id,choice,history)=>json('qaMountedResult('+JSON.stringify(id)+','+JSON.stringify(choice)+','+JSON.stringify(history||null)+')'),reload:()=>assert(run('G.load(G.exportSave())'))};
}
const stock=h=>h.json('({day:S.day,min:S.min,fuel:S.fuel,food:S.food,water:S.water,scrap:S.scrap,van:S.van,fatigue:S.fatigue,hunger:S.hunger,thirst:S.thirst,items:S.items,flags:S.flags,notes:S.notes,stats:S.stats,comps:S.comps,used:S.used,queue:S._storyQueue,seed:S.seed})');
const words=view=>view.turns.map(t=>t.text).join('\n');
function entryFixture(id,...markers){const marker=markers.length?markers[0]:revision,raw=retained(id,'entry');delete raw.opening.reading;if(marker===undefined)delete raw.opening.proseRevision;else raw.opening.proseRevision=marker;return raw;}
function futureEntry(id,mutate=()=>{}){const raw=entryFixture(id);mutate(raw);const h=engine(false,raw);return {h,view:h.entry(id)};}
function declarative(h,expression){return h.json(`JSON.parse(JSON.stringify(${expression},(_k,v)=>typeof v==='function'?v.toString():v))`);}

test('new interactive initialization alone opts in; old entry modes and absent/unknown markers never acquire the edition',()=>{
 const h=engine();h.run("G.seedOverride=2201;G.newGame('onroad','','interactive')");
 assert.equal(h.run('S.opening.proseRevision'),revision,'New interactive opening must opt in');
 assert.equal(h.run('S.opening.version'),2);assert.equal(h.run('S.opening.narrativeVersion'),1);h.reload();assert.equal(h.run('S.opening.proseRevision'),revision);
 for(const mode of ['full','summary','skip']){h.run(`G.newGame('onroad','예전',${JSON.stringify(mode)})`);assert.equal(h.run('S.opening'),null);}
 for(const marker of [undefined,'unknown-edition']){const raw=entryFixture('opening_bus_repair',marker),a=engine(false,raw),b=engine(true,raw);a.reload();assert.equal(a.run('S.opening.proseRevision||null'),marker||null);assert.deepEqual(a.entry('opening_bus_repair'),b.entry('opening_bus_repair'));}
});

test('original and presence tables remain exact, and future table keeps every real action/requirement/effect/note',()=>{
 const a=engine(),b=engine(true);assert(a.run('Array.isArray(D.openingFlowV1)'),'Future edition table is required');
 for(const table of ['D.openingDeparture','D.openingPresence','D.openingNameIntroduction','D.openingFarewell'])assert.deepEqual(declarative(a,table),declarative(b,table),table+' is historical');
 const project=`events=>events.map(e=>({id:e.id,openingFinal:e.openingFinal,presentationOnly:e.presentationOnly,scene:e.scene,scenes:e.scenes,choices:e.choices.map(c=>({id:c.id,label:c.label,req:c.req,foreseeable:c.foreseeable,out:c.out.map(o=>({p:o.p,fx:o.fx,scene:o.scene,scenes:o.scenes}))}))}))`;
 assert.deepEqual(a.json(`(${project})(D.openingFlowV1)`),b.json(`(${project})(D.openingPresence)`));
});

for(const id of ['opening_workshop','opening_bus_repair','opening_failed_appeal','opening_parents_module','opening_departure','opening_farewell'])for(const phase of ['entry','result'])for(const viewed of [false,true])test(`actual218 ${id} ${phase} ${viewed?'captured partial cursor':'before view'} stays in its old edition`,()=>{
 const raw=retained(id,phase);delete raw.opening.proseRevision;
 if(!viewed)delete raw.opening.reading;else{const view=raw.opening.reading.view;view.index=Math.min(1,view.turns.length-1);view.recordOpen=true;view.readingPage={cursor:{turn:view.index,offset:1},end:{turn:view.index,offset:2},trail:[{turn:0,offset:0}],mode:'read',choicePage:1,resultPage:0};}
 const a=engine(false,raw),b=engine(true,raw),beforeStock=stock(a);a.reload();b.reload();
 if(phase==='entry')assert.deepEqual(a.entry(id),b.entry(id));else{const choice=raw.opening.pendingResult.choiceId,ra=a.result(id,choice),rb=b.result(id,choice);assert.equal(ra.applied,false);assert.deepEqual(ra,rb);assert.deepEqual(stock(a),beforeStock);}
 assert.deepEqual(a.json('S.opening'),b.json('S.opening'));assert.equal(a.run('S.opening.proseRevision||null'),null);
 assert.equal(a.run('rng()'),b.run('rng()'),'Reload/payment must not consume different randomness');
});

test('unmarked original v1/v2 and unknown presence editions keep viewless old prose and next step',()=>{
 for(const version of [1,2])for(const narrative of [undefined,1])for(const marker of [undefined,'future-unknown',revision]){
  if(narrative===1&&marker===revision)continue;
  const raw=retained('opening_bus_repair','result');raw.opening.version=version;if(narrative===undefined)delete raw.opening.narrativeVersion;else raw.opening.narrativeVersion=narrative;if(marker===undefined)delete raw.opening.proseRevision;else raw.opening.proseRevision=marker;delete raw.opening.reading;
  const a=engine(false,raw),b=engine(true,raw);a.reload();b.reload();assert.deepEqual(a.result('opening_bus_repair','new_part'),b.result('opening_bus_repair','new_part'));
  a.run("G.continueOpening('opening_bus_repair')");b.run("G.continueOpening('opening_bus_repair')");assert.equal(a.run('G.openingPending()?.id'),b.run('G.openingPending()?.id'));assert.deepEqual(stock(a),stock(b));
 }
});

for(const [choice,prepared] of [['pack_workshop',true],['answer_call',false]])test(`new bus entry reflects actual ${choice} preparation without losing heater facts or cut positions`,()=>{
 const {h,view}=futureEntry('opening_bus_repair',raw=>raw.opening.decisions.opening_workshop.choiceId=choice);
 assert.match(view.turns[0].text,prepared?/예비 공구/:/들고 온 공구함/);assert.match(view.turns[0].text,/버스 계단/);assert.match(view.turns[0].text,/열이 난 유나/);assert.match(view.turns[0].text,/소매/);
 assert.equal(view.turns.length,4);assert.equal(view.turns[1].who,'intro_child');assert.match(view.turns[1].text,/손.*차가워/);assert.match(view.turns[3].text,/호스.*찢어/);assert.deepEqual(view.sceneKeys,['intro-dock-aid','opening-bus-heater-v1']);
 const old=engine(true,entryFixture('opening_bus_repair'));assert.deepEqual(view.turns.slice(1),old.entry('opening_bus_repair').turns.slice(1));assert(!h.run("S.items['부모님의 검증키']"));
});

test('new bus with missing or unknown preparation receipt stays neutral instead of inventing spare tools',()=>{
 for(const choice of [null,'unknown-choice']){const {view}=futureEntry('opening_bus_repair',raw=>{if(choice)raw.opening.decisions.opening_workshop.choiceId=choice;else delete raw.opening.decisions.opening_workshop;});const old=engine(true,entryFixture('opening_bus_repair')).entry('opening_bus_repair');assert.equal(view.turns[0].text,old.turns[0].text);}
});

test('new scrap repair gives Doyun the short heard response; all repair branches pay the original cost once before naming',()=>{
 for(const choice of ['new_part','scrap_collar','hose_bypass']){
  const raw=entryFixture('opening_bus_repair'),a=engine(false,raw),b=engine(true,raw),ea=a.entry('opening_bus_repair'),eb=b.entry('opening_bus_repair');const ra=a.result('opening_bus_repair',choice,ea),rb=b.result('opening_bus_repair',choice,eb);assert(ra.applied&&rb.applied);assert.deepEqual(stock(a),stock(b));
  if(choice==='scrap_collar'){assert(ra.state.turns.some(t=>t.kind==='dialogue'&&t.who==='intro_child'&&/유나.*바람/.test(t.text)),'Child must audibly answer in the assembled result');assert.match(words(ra.state),/고리를 다시/);assert.match(words(ra.state),/하진.*유나.*송풍구/);}else assert.deepEqual(ra.state.turns,rb.state.turns);
  const paid=stock(a);a.reload();b.reload();const replay=a.result('opening_bus_repair',choice);b.result('opening_bus_repair',choice);assert.equal(replay.applied,false);assert.deepEqual(replay.state.turns,ra.state.turns);assert.deepEqual(stock(a),paid);
  a.run("G.continueOpening('opening_bus_repair')");b.run("G.continueOpening('opening_bus_repair')");assert.equal(a.run('G.openingPending().id'),'opening_name_introduction');assert.equal(a.run('S.opening.step'),2);assert.equal(a.run("G.canTravelTo('yangsan').ok"),false);assert.equal(a.run('rng()'),b.run('rng()'));
 }
});

test('new appeal supplies the application antecedent after memory while preserving source facts and the optional full record',()=>{
 const {view}=futureEntry('opening_failed_appeal'),old=engine(true,entryFixture('opening_failed_appeal')).entry('opening_failed_appeal');
 const hajin=view.turns.find(t=>t.who==='passer_woman');assert.match(hajin.text,/이의 신청.*열세 번/);assert.deepEqual(view.turns.map(t=>[t.scene,t.timeKind,t.timeLabel]),old.turns.map(t=>[t.scene,t.timeKind,t.timeLabel]));
 assert.equal(view.readingRecord,old.readingRecord);assert.equal(view.readingRecordLabel,old.readingRecordLabel);assert.match(words(view),/이송표를 내밀었다/);assert.match(words(view),/사유와 최종 승인자/);assert.match(words(view),/6,412명/);assert.match(words(view),/이의 신청을 받을 수 없습니다/);assert.match(words(view),/서울 남산/);
});

test('name-recording result includes Hajin giving consent; both appeal choices preserve payments, notes and history across reload',()=>{
 for(const choice of ['copy_receipt','record_names']){const raw=entryFixture('opening_failed_appeal'),a=engine(false,raw),b=engine(true,raw),ea=a.entry('opening_failed_appeal'),eb=b.entry('opening_failed_appeal');const ra=a.result('opening_failed_appeal',choice,ea);b.result('opening_failed_appeal',choice,eb);assert.deepEqual(stock(a),stock(b));
  if(choice==='record_names'){assert.match(ra.state.turns[0].text,/이름.*적어도.*물었다/);assert(ra.state.turns.some(t=>t.kind==='dialogue'&&t.who==='passer_woman'&&/네.*하진.*도윤.*유나/.test(t.text)),'Consent must be heard from Hajin, not only asserted by narration');}
  a.run('G.capturePresentationView('+JSON.stringify(ra.state)+')');const captured=a.json('S.opening.reading'),paid=stock(a);a.reload();b.reload();const replay=a.result('opening_failed_appeal',choice);b.result('opening_failed_appeal',choice);assert.equal(replay.applied,false);assert.deepEqual(a.json('S.opening.reading'),captured);assert.deepEqual(replay.state.history.turns,ea.turns);assert.deepEqual(stock(a),paid);assert.equal(a.run('rng()'),b.run('rng()'));
 }
});

test('new module splits the first narration without inventing a written record or losing any fact, warning or memo',()=>{
 const {h,view}=futureEntry('opening_parents_module'),old=engine(true,entryFixture('opening_parents_module')).entry('opening_parents_module');
 assert.equal(view.turns[0].kind,'narration');assert.match(view.turns[0].text,/회로도가 떨어졌다/);assert.doesNotMatch(view.turns[0].text,/남산 현장 확인 포트/);
 assert.equal(view.turns.length,5);assert.equal(view.turns[1].kind,'narration');assert.match(view.turns[1].text,/남산 현장 확인 포트.*달구지 계기판/);assert.match(view.turns[1].text,/엄마가 설계하고 아빠가 만든/);assert.match(view.turns[1].text,/명령.*실행.*전에.*사람.*승인/);assert.equal(view.turns[0].text+' '+view.turns[1].text,old.turns[0].text);assert.deepEqual(view.turns.slice(2),old.turns.slice(1));assert(!view.turns.some(t=>t.kind==='record'));assert.match(words(view),/분리 순서 두 장/);assert.match(words(view),/검증키와 달구지 전장.*타 버린/);assert(!h.run("S.items['부모님의 검증키']"));
});

test('new label-wires result closes through a visible action without granting the mounted key or altering costs',()=>{
 for(const choice of ['label_wires','trace_diagram']){const raw=entryFixture('opening_parents_module'),a=engine(false,raw),b=engine(true,raw),ea=a.entry('opening_parents_module'),eb=b.entry('opening_parents_module'),ra=a.result('opening_parents_module',choice,ea);b.result('opening_parents_module',choice,eb);assert.deepEqual(stock(a),stock(b));assert(!a.run("S.items['부모님의 검증키']"));if(choice==='label_wires'){assert.match(words(ra.state),/모듈은 그대로/);assert.match(words(ra.state),/공구.*거뒀/);}a.reload();b.reload();assert.equal(a.result('opening_parents_module',choice).applied,false);b.result('opening_parents_module',choice);assert.equal(a.run('rng()'),b.run('rng()'));}
});

test('new named and unnamed unit openings retain every name/farewell handoff and queue first-road exactly once',()=>{
 for(const name of ['', '이미 정함']){const a=engine(),b=engine(true);for(const h of [a,b])h.run(`G.seedOverride=2202;G.newGame('onroad',${JSON.stringify(name)},'interactive','keeper','provisions')`);
  let names=0,farewells=0;for(let guard=0;guard<9;guard++){const id=a.run('G.openingPending()?.id');if(!id)break;assert.equal(id,b.run('G.openingPending()?.id'));assert.equal(a.run("G.canTravelTo('yangsan').ok"),false);if(id==='opening_name_introduction'){names++;for(const h of [a,b])h.run("G.setOpeningNameDraft('다온')");}if(id==='opening_farewell')farewells++;
   const choice=a.run('G.openingPending().choices[0].id'),before=stock(a),ea=a.entry(id),eb=b.entry(id),ra=a.result(id,choice,ea);b.result(id,choice,eb);assert.deepEqual(stock(a),stock(b));if(id==='opening_farewell')assert.deepEqual(stock(a),before);a.reload();b.reload();assert.equal(a.result(id,choice).applied,false);b.result(id,choice);for(const h of [a,b])h.run('G.continueOpening('+JSON.stringify(id)+')');assert.equal(a.run('G.continueOpening('+JSON.stringify(id)+')'),false);
  }
  assert.equal(names,name?0:1);assert.equal(farewells,1);assert.equal(a.run('S.opening.completed'),true);assert.equal(a.run('S._storyQueue.filter(id=>id===\'onboarding_first_road\').length'),1);assert.equal(a.run("G.canTravelTo('yangsan').ok"),true);assert.equal(a.run('rng()'),b.run('rng()'));
 }
});

function firstRoad(legacy=false,newReceipt=false,ci=0){const raw=retained('onboarding_first_road','entry');delete raw.pendingPresentation.reading;delete raw.pendingPresentation.view;const h=engine(legacy,raw);if(newReceipt){h.run("S.pendingPresentation=null;G.queuePresentation('onboarding_first_road');G.presentTransition()");}const view=h.entry('onboarding_first_road');return {h,view,pay:()=>h.result('onboarding_first_road',ci,view)};}
test('new ordinary first-road queue stamps a prose receipt while entry, document anchors and all three actions remain exact',()=>{
 const a=firstRoad(false,true),b=firstRoad(true,true);assert.equal(a.h.run('S.pendingPresentation.narrativeRevision'),revision);assert.deepEqual(a.view,b.view);assert.match(words(a.view),/종이띠를 토해 냈다/);assert.match(words(a.view),/배급망 변동 시 자동 실행/);assert.match(words(a.view),/앞 여덟 자리가 같았다/);
 assert.deepEqual(declarative(a.h,'e.choices.map(c=>({label:c.label,req:c.req,foreseeable:c.foreseeable,out:c.out.map(o=>({p:o.p,fx:o.fx}))}))'),declarative(b.h,'e.choices.map(c=>({label:c.label,req:c.req,foreseeable:c.foreseeable,out:c.out.map(o=>({p:o.p,fx:o.fx}))}))'));
});
for(const ci of [0,1,2])test(`new first-road result ${ci} handles the chosen object/consequence and preserves original20/35/10-minute and pursuit costs`,()=>{
 const a=firstRoad(false,true,ci),b=firstRoad(true,true,ci),min=a.h.run('S.min'),ra=a.pay();b.pay();assert.deepEqual(stock(a.h),stock(b.h));assert.equal(a.h.run('S.min')-min,[20,35,10][ci]);const text=words(ra.state);if(ci===0)assert.match(text,/접힌 곳.*펴|검증 번호를 다시/);if(ci===1)assert.match(text,/앞 여덟 자리/);if(ci===2){assert.match(text,/달구지.*관측망.*등록/);assert.match(text,/추적 흔적/);assert.doesNotMatch(text,/새 인과 노드/);}a.h.reload();b.h.reload();assert.equal(a.h.result('onboarding_first_road',ci).applied,false);b.h.result('onboarding_first_road',ci);assert.equal(a.h.run('rng()'),b.h.run('rng()'));
});

test('unmarked first-road entry still pays its old result; captured and viewless historical paid readers remain frozen',()=>{
 for(const ci of [0,1,2]){const a=firstRoad(false,false,ci),b=firstRoad(true,false,ci);assert.equal(a.h.run('S.pendingPresentation.narrativeRevision'),undefined);assert.deepEqual(a.view,b.view);assert.deepEqual(a.pay(),b.pay());assert.deepEqual(stock(a.h),stock(b.h));}
 for(const viewed of [false,true]){const raw=retained('onboarding_first_road','result');if(!viewed){delete raw.pendingPresentation.reading;delete raw.pendingPresentation.view;delete raw.pendingPresentation.authoredView;}else{raw.pendingPresentation.reading.view.index=1;raw.pendingPresentation.reading.view.readingPage={cursor:{turn:1,offset:1},end:{turn:1,offset:2},trail:[{turn:0,offset:0}],mode:'read'};}
  const a=engine(false,raw),b=engine(true,raw),beforeStock=stock(a);a.reload();b.reload();const ra=a.result('onboarding_first_road',raw.pendingPresentation.choiceIndex),rb=b.result('onboarding_first_road',raw.pendingPresentation.choiceIndex);assert.equal(ra.applied,false);assert.equal(ra.text,raw.pendingPresentation.text);assert.deepEqual(ra,rb);assert.deepEqual(stock(a),beforeStock);assert.deepEqual(a.json('S.pendingPresentation'),b.json('S.pendingPresentation'));if(!viewed)assert.equal(ra.frozenTextOnly,true);
 }
});
