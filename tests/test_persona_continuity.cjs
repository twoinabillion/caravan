/* Confirmed ten-persona findings: isolated source/engine/reader regressions.
   State fixtures are not natural playthroughs, user saves, or visual QA. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const ui=fs.readFileSync('src/07-ui.js','utf8'),plain=x=>JSON.parse(JSON.stringify(x));
function setup(){
  const store=new Map(),noop=()=>{},ctx=vm.createContext({console,Date,URLSearchParams,location:{search:''},setTimeout:()=>0,clearTimeout:noop,
    document:{readyState:'loading',addEventListener:noop},window:{dispatchEvent:noop},CustomEvent:function(){},
    UI:new Proxy({modalOpen:()=>false,onArrive:()=>0},{get:(o,k)=>o[k]||noop}),
    localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  const run=code=>vm.runInContext(code,ctx);
  for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
  for(const file of fs.readdirSync('src').filter(file=>/^04.*\.js$/.test(file)).sort())vm.runInContext(fs.readFileSync('src/'+file,'utf8'),ctx,{filename:file});
  run(fs.readFileSync('src/07h-story-pages.js','utf8'));
  run(ui.match(/  const stripTags=.*;/)[0]+ui.match(/  const playerSpeaker=.*;/)[0]+
    ui.slice(ui.indexOf('  function eventSpeakerCandidates('),ui.indexOf('  function prepareEventAudio(')));
  run(`G.seedOverride=181010;G.newGame('onroad','상혁','interactive');S.opening.completed=true;
    globalThis.event=id=>D.events.find(e=>e.id===id)||D.seoulStops.find(e=>e.id===id)`);
  return {ctx,run};
}
const reload=h=>assert(h.run('G.save();S=null;G.load()'));
function helper(h,name){const at=ui.indexOf('  function '+name+'('),end=ui.indexOf('\n  function ',at+4);assert(at>=0&&end>at,name);h.run(ui.slice(at,end));return h.ctx[name];}
const party=(h,ids)=>h.run(`S.party=${JSON.stringify(ids)};for(const id of S.party)S.comps[id]={mood:65,bond:5,perks:[]}`);

test('all fifteen touched events keep their pre-edit choices, requirements, odds and gameplay effects',()=>{
  const h=setup();
  const bytes=h.run(`JSON.stringify(['loc_mungyeong','rq_minji_join','rq_parkss_join','rq_leo_join','rq_jaeyi_join','rq_eunsu_join','rq_kangwoo_join','route_ridge_anchor','route_ridge_extract','pair_mj_kw_1','seoul_costs','seoul_decision','seoul_night','seoul_uplink_reveal','seoul_session_reset'].map(id=>({id,choices:event(id).choices})),(k,v)=>['text','label','turnSpeakers','turns','readingRecord','note'].includes(k)?undefined:v)`);
  // Independently calculated from git HEAD before these source edits, not rebased.
  const reviewed=require('../tools/story-review-contract.cjs').regional(JSON.parse(bytes));
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(reviewed)).digest('hex'),'55d9c54cbe73e4a3eef8d1d18c2cd6ccc7b4b1be544b54250189fa9be6d1b742');
});
test('the pass inscription is narration, not a ghost interlocutor, alone or with any companion',()=>{
  const h=setup();
  for(const id of [null,...h.run('Object.keys(D.comps)')]){
    party(h,id?[id]:[]);
    const turns=plain(h.run(`(()=>{const e=event('loc_mungyeong'),o=e.choices[0].out[0];return buildStoryTurns(o.text,e,{turnSpeakers:o.turnSpeakers})})()`));
    assert(turns.every(t=>t.kind==='narration'));assert.doesNotMatch(turns.map(t=>t.text).join('\n'),/뭐 적었|안 알려/);
    assert.match(turns.map(t=>t.text).join('\n'),/돌아오는 길에 답을 고치러/);
  }
});
test('every offer waits for actual acceptance, including full seats, refusal/back, reload and later acceptance',()=>{
  for(const cid of ['minji','parkss','leo','jaeyi','eunsu','kangwoo']){
    const h=setup(),others=h.run('Object.keys(D.comps)').filter(id=>id!==cid).slice(0,2);party(h,others);
    h.run(`S.recruitQ={id:'${cid}',stage:'ready',target:S.at};globalThis.e=event('rq_${cid}_join');G.beginPresentation(e);globalThis.result=G.resolvePresentedChoice(e,e.choices[0])`);
    assert(h.run('result.ok'));assert(!h.run(`S.party.includes('${cid}')`));
    assert(!h.run(`G.doRecruit('${cid}')`),'full seats must not board');
    const snapshot=h.run('JSON.stringify({party:S.party,dog:S.dog,day:S.day,min:S.min,items:S.items,stats:S.stats})');
    reload(h);assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[0]).applied'),false);
    assert.equal(h.run('JSON.stringify({party:S.party,dog:S.dog,day:S.day,min:S.min,items:S.items,stats:S.stats})'),snapshot);
    const prose=h.run('result.out.text');assert.doesNotMatch(prose,/가방이 먼저 실리고|그다음에 오른다|달구지에 올라 군장을|수신기를 고정하고|짐은 전부 세어 넣었고|보리가 먼저 올라가/);
    // The same close/Continue route used by refusal keeps the ready invitation.
    h.run('G.queuePresentation()');assert.equal(h.run('S.recruitQ.stage'),'ready');reload(h);
    assert(!h.run(`S.party.includes('${cid}')`));
    // Fixture releases a seat, then the real recruit API completes exactly once.
    h.run('S.party.pop()');assert(h.run(`G.doRecruit('${cid}')`));assert(!h.run(`G.doRecruit('${cid}')`));reload(h);
    assert(h.run(`S.party.includes('${cid}')`));if(cid==='leo')assert(h.run('S.dog'));
  }
});
test('all six ridge anchor outcomes explain the third person reaching the road, without rescuing the last woman twice',()=>{
  const h=setup(),anchor=plain(h.run("event('route_ridge_anchor').choices"));
  assert.match(anchor[2].label,/남자/);
  for(const choice of anchor)for(const out of choice.out){
    assert.match(out.text,/남자|그를/);assert.match(out.text,/도로/);
    assert.equal(out.fx.chain,'route_ridge_extract');
  }
  assert.match(anchor[2].out[1].text,/허리/);assert.match(anchor[2].out[1].text,/이번엔 그를 먼저 도로까지/);
  assert.equal(anchor[2].out[1].fx.injury.who,'driver');assert.equal(anchor[2].out[1].fx.time,35);
  assert.match(h.run("event('route_ridge_extract').text(S)"),/사람 셋은 올라왔다.*발목을 다친 여자와 수레가 남았다/);
  const snapshot=h.run('JSON.stringify(S)');
  for(const choice of h.run("event('route_ridge_extract').choices"))for(const out of choice.out)assert(out.fx.combatEnd&&out.fx.combatResult);
  assert.equal(h.run('JSON.stringify(S)'),snapshot);
});
test('mediation is a current adjustment and future agreement, with correct actual reader roles and unchanged zero minutes',()=>{
  const h=setup();party(h,['minji','kangwoo']);
  const before=h.run('S.min');h.run(`globalThis.e=event('pair_mj_kw_1');G.beginPresentation(e);globalThis.result=G.resolvePresentedChoice(e,e.choices[0])`);
  assert.equal(h.run('S.min'),before);assert.doesNotMatch(h.run('result.out.text'),/사흘째|일주일째/);
  const roles=plain(h.run('buildStoryTurns(result.out.text,e,{turnSpeakers:result.out.turnSpeakers}).filter(t=>t.kind===\'dialogue\').map(t=>t.who)'));
  assert.deepEqual(roles,['me','kangwoo','minji','kangwoo','minji','minji','kangwoo']);
  assert.match(h.run('result.out.fx.note.body'),/배우기로 했다/);assert.match(h.run('result.out.text'),/유격을 조정/);
  reload(h);assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[0]).applied'),false);
});
test('watch proposal preserves opposition and conditional cooperation, never signs absent/insufficient people',()=>{
  const h=setup(),ids=h.run('Object.keys(D.comps)');
  for(let mask=0;mask<64;mask++){
    const roster=ids.filter((_,i)=>mask&(1<<i));party(h,roster);
    const before=h.run('JSON.stringify(S)'),turns=plain(h.run('D.coreWatchProposalTurns(S)')),text=turns.map(t=>t.text).join('\n');
    assert(!h.run('S.coreWatchSigners'));assert.doesNotMatch(text,/강우이|차례로 고개를|채워지는 건 오늘|서명했다/);
    const kangwoo=turns.filter(t=>t.who==='kangwoo');assert.equal(kangwoo.length,roster.includes('kangwoo')?2:0);
    if(kangwoo.length){assert.match(kangwoo[0].text,/반대/);assert.match(kangwoo[1].text,/정해지면/);}
    if(roster.length<3)assert.match(text,new RegExp('아직 '+(3-roster.length)+'명이 더 필요'));
    assert.equal(h.run('JSON.stringify(S)'),before);
  }
  party(h,['kangwoo','minji','eunsu']);h.run('S.injuries.kangwoo={days:2};S.comps.minji.mood=44');
  assert.deepEqual(plain(h.run('D.coreWatchProposalTurns(S).filter(t=>t.kind===\'dialogue\').map(t=>t.who)')),['me']);
});
test('night watch guidance separates headcount, injuries and morale without changing the three-person gate',()=>{
  const h=setup();
  party(h,[]);assert.match(h.run('G.reqOk({nightWatch:3}).t'),/동료 3명 추가 합류/);
  party(h,['minji','kangwoo']);assert.match(h.run('G.reqOk({nightWatch:3}).t'),/동료 1명 추가 합류/);
  assert.doesNotMatch(h.run('G.reqOk({nightWatch:3}).t'),/치료|사기/);
  party(h,['minji','kangwoo','eunsu']);h.run('S.injuries.minji={days:2};S.comps.kangwoo.mood=44');
  let hint=h.run('G.reqOk({nightWatch:3}).t');assert.match(hint,/1\/3/);assert.match(hint,/부상 동료 1명/);assert.match(hint,/사기 낮은 동료 1명/);assert.doesNotMatch(hint,/추가 합류/);
  h.run('S.injuries={};S.comps.kangwoo.mood=45');assert(h.run('G.reqOk({nightWatch:3}).ok'));reload(h);assert(h.run('G.reqOk({nightWatch:3}).ok'));
});
test('preparation return retains the sixth chapter, 4/5 progress and an accurate journal before/after reload and re-entry',()=>{
  const h=setup();h.run(`S.at='seoul';S.flags.seoul_open=true;S.flags.seoul_core_reached=true;S.flags.seoul_costs_seen=true;
    G.seoulReady=()=>true;G.seoulStage=()=>4;G.mainEvidenceOpportunity=()=>null;
    globalThis.e=event('seoul_decision');G.beginPresentation(e)`);
  const before=h.run('S.min');assert(h.run('G.prepareFinale()'));assert.equal(h.run('S.min')-before,60);
  assert.equal(h.run('S.at'),'suwon');assert(!h.run('G.prepareFinale()'));reload(h);
  assert.equal(h.run('G.mainQuestEntry().chapterId'),'finale-preparation');assert.equal(h.run('G.mainQuestEntry().progress.label'),'4/5');
  h.run(fs.readFileSync('src/07d-ui-quests.js','utf8'));
  const rendered=h.run('QuestJournal.entry(G.mainQuestEntry()).next');assert.match(rendered,/남산/);assert.match(rendered,/멈춘 결정/);assert.doesNotMatch(rendered,/이제 서울로 가 볼까|진입로를 찾/);
  assert.equal(h.run("G.questObjectivePlan('main_namsan').target"),'seoul');
  h.run("S.at='seoul'");assert.equal(h.run('G.mainQuestEntry().chapterId'),'seoul-4');
  assert.match(h.run('G.mainQuestEntry().next'),/멈춘 결정/);assert.doesNotMatch(h.run('G.mainQuestEntry().next'),/막힌 길/);
  assert.match(h.run('QuestJournal.entry(G.mainQuestEntry()).next'),/조건까지 확인/);
  assert(!h.run('G.prepareFinale()'),'a return needs an open decision, not arbitrary location');
});
test('every finale method marks night/dawn/return as epilogue, preserves the clock and cuts pages on source boundaries',()=>{
  const h=setup();
  for(const method of ['transfer','sleep','quarantine']){
    h.run(`for(const key of ['core_transfer','core_sleep','core_quarantine'])delete S.flags[key];S.flags.core_${method}=true;S.flags.mother_broadcast_ready=true`);
    const before=h.run('JSON.stringify(S)');
    for(const choice of h.run("event('seoul_night').choices")){
      const turns=choice.out[0].turns(h.run('S')),markers=turns.filter(t=>t.timeKind);
      assert.deepEqual(Array.from(markers,t=>t.timeKind),['epilogue','epilogue']);assert.match(markers[0].timeLabel,/그날 밤/);assert.match(markers[1].timeLabel,/다음 날 새벽/);
      h.ctx.turns=turns;assert.equal(h.run('G.presentationView({turns}).turns[0].timeKind'),'epilogue');
    }
    for(const id of ['seoul_uplink_reveal','seoul_session_reset']){
      const turns=h.run(`event('${id}').turns(S)`);assert.equal(turns[0].timeKind,'epilogue');
    }
    const returns=h.run("event('seoul_session_reset').choices[0].out[0].turns(S)");assert.match(returns.find(t=>t.scene==='parents-mother-reunion-v1').timeLabel,/그 뒤,/);
    assert.equal(h.run('JSON.stringify(S)'),before);
  }
  const page=h.run(`StoryPages.take([{kind:'narration',text:'현재',timeKind:'current'},{kind:'narration',text:'나중',timeKind:'epilogue'}],{turn:0,offset:0},()=>true)`);
  assert.equal(page.rows.length,1);assert.equal(page.end.turn,1);
});
test('existing orientation follows epilogue/back/current, with inline review provenance and frozen paid receipts',()=>{
  const h=setup(),orientation={textContent:'',dataset:{currentOrientation:'지금 · 서울 · 09:00'}},sheet={dataset:{readerDensity:'quiet'},querySelector:s=>s==='.event-orientation'?orientation:null};
  h.ctx.$=()=>sheet;const render=helper(h,'renderStoryScene');
  const turns=[{kind:'narration',text:'현재',timeKind:'current'},{kind:'narration',text:'뒤',timeKind:'epilogue',timeLabel:'후일담 · 그날 밤'}],state={turns,eventId:'seoul_night',phase:'outcome',sceneKeys:[]};
  render(state,turns[1],1);assert.match(orientation.textContent,/후일담/);render(state,turns[0],0);assert.match(orientation.textContent,/09:00/);render(state,turns[1],1);
  Object.assign(h.ctx,{speakerInfo:(who,name)=>({id:who,name:name||who}),speakerLaneKey:t=>t.who,esc:v=>String(v),fmt:v=>v});
  assert.match(helper(h,'pagedStoryHtml')(turns,true),/page-time-source[^>]*>후일담/);
  h.run(`globalThis.e=event('seoul_costs');G.beginPresentation(e);G.resolvePresentedChoice(e,e.choices[2]);
    S.pendingPresentation.text='이전 판 유료 결과 · 이미 지불됨';
    G.capturePresentationView({eventId:e.id,phase:'outcome',turns:[{kind:'narration',text:S.pendingPresentation.text}],index:0,readingPage:{cursor:{turn:0,offset:3},end:{turn:1,offset:0},trail:[]}})`);
  reload(h);const before=h.run('JSON.stringify(S)');assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[2]).out.text'),'이전 판 유료 결과 · 이미 지불됨');assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[2]).applied'),false);
  assert.equal(h.run('JSON.stringify(S)'),before);
  const restored=plain(h.run(`(()=>{const row={eventId:e.id,phase:'outcome'};G.restorePresentationView(row);return row})()`));
  assert.equal(restored.turns[0].text,'이전 판 유료 결과 · 이미 지불됨');assert.equal(restored.readingPage.cursor.offset,3);
  assert(!restored.turns[0].timeKind,'old paid scene must not gain a new time marker');
});
