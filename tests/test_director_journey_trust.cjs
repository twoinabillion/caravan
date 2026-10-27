/* Ten-agent findings: isolated actual-engine/reader regressions, not visual QA. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const plain=x=>JSON.parse(JSON.stringify(x));
function setup(){
  const store=new Map(),calls=[],noop=()=>{},ctx=vm.createContext({console,Date,URLSearchParams,location:{search:''},
    setTimeout:()=>0,clearTimeout:noop,document:{readyState:'loading',addEventListener:noop},
    window:{dispatchEvent:noop},CustomEvent:function(){},
    UI:new Proxy({modalOpen:()=>false,onArrive:()=>0,showStl:id=>calls.push(['town',id])},{get:(o,k)=>o[k]||noop}),
    localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  const run=code=>vm.runInContext(code,ctx);
  for(const f of STATIC_CONTENT_FILES)run(fs.readFileSync(f,'utf8'));
  for(const f of fs.readdirSync('src').filter(f=>/^04.*\.js$/.test(f)).sort())run(fs.readFileSync('src/'+f,'utf8'));
  run(fs.readFileSync('src/07h-story-pages.js','utf8'));
  const ui=fs.readFileSync('src/07-ui.js','utf8');
  run(ui.match(/  const stripTags=.*;/)[0]+ui.match(/  const playerSpeaker=.*;/)[0]+
    ui.slice(ui.indexOf('  function eventSpeakerCandidates('),ui.indexOf('  function prepareEventAudio(')));
  run(fs.readFileSync('src/07d-ui-quests.js','utf8')+';globalThis.journal=QuestJournal');
  run(`G.seedOverride=181801;G.newGame('onroad','상혁','interactive');S.opening.completed=true;
    globalThis.event=id=>D.events.find(e=>e.id===id)||D.seoulStops.find(e=>e.id===id);
    globalThis.words=value=>typeof value==='function'?value(S):value;
    globalThis.entry=id=>words(event(id).text);`);
  return {ctx,run,calls};
}
const reload=h=>assert(h.run('G.save();S=null;G.load()'));
test('zero-fuel settlement arrival keeps the market reachable, reload and duplicate arrival inert',()=>{
  const h=setup();h.run(`S.at='suwon';S.pendingArrival='suwon';S.driving=null;S.flags.armed_age=true;S.fuel=0;S.scrap=71;
    S.used.push(...D.events.filter(e=>e.locEvent==='suwon').map(e=>e.id));
    globalThis.opened=[];G.openRescue=(...args)=>opened.push(args);G.maybeCrisis=()=>false;G.popStory=()=>null;
    globalThis.before=[S.day,S.min,S.water,S.food,S.scrap];G.finishArrival('suwon')`);
  assert.deepEqual(plain(h.run('opened')),[]);assert(h.calls.some(c=>c[0]==='town'));
  assert.deepEqual(plain(h.run('[S.day,S.min,S.water,S.food,S.scrap]')),plain(h.run('before')));
  reload(h);h.run('G.finishArrival("suwon")');assert.deepEqual(plain(h.run('opened')),[]);
  h.run(`globalThis.market=D.stls[D.nodes[S.at].stl];globalThis.fuelRow=market.trade.findIndex(r=>r[1]==='fuel');
    G.trade(D.nodes[S.at].stl,fuelRow)`);assert(h.run('S.fuel>0'));
});
test('zero-fuel remote arrival still opens the existing rescue; nonempty tank does not',()=>{
  const h=setup();h.run(`globalThis.node=Object.values(D.nodes).find(n=>!n.stl&&n.id!=='seoul');
    globalThis.id=Object.keys(D.nodes).find(k=>!D.nodes[k].stl&&k!=='seoul');
    S.at=id;S.pendingArrival=id;S.flags.armed_age=true;S.fuel=0;globalThis.opened=[];
    G.openRescue=(...args)=>opened.push(args);G.finishArrival(id)`);
  assert.equal(h.run('opened[0][0]'),'nofuel');
  h.run(`S.pendingArrival=id;S.fuel=5;G.maybeCrisis=()=>false;G.popStory=()=>null;G.finishArrival(id)`);
  assert.equal(h.run('opened.length'),1);
});
test('verification-key originals and recovery never invent another opening preparation',()=>{
  const h=setup();
  for(const choiceId of ['trace_diagram','label_wires',null]){
    h.ctx.choiceId=choiceId;h.run(`S.opening.decisions={opening_parents_module:{choiceId}}`);
    for(const id of ['story_family_key','main_recovery_story_family_key']){
      assert.doesNotMatch(h.run(`entry('${id}')`),/출발 전에 번호를 붙여 둔/);
      assert.match(h.run(`entry('${id}')`),/모듈|검증키/);
    }
  }
});
test('ghost contact introduces its own conversation, not an unearned Hanbyeol password',()=>{
  const h=setup();assert.doesNotMatch(h.run("entry('cell_ghost_meet')"),/한별이 알려준|암호를 말하자|문구를 말하자/);
  assert.match(h.run("entry('cell_ghost_meet')"),/무슨 일|어디서/);
});
test('owned living upgrades describe use and adjustment rather than another first installation',()=>{
  const h=setup();h.run(`S.day=7;S.up.bench=true;S.up.cabin=true;S.up.jumpseat=true;S.party=['minji','kangwoo'];S.stats.km=496`);
  for(const id of ['up_bench_first','up_cabin_sleepchart','up_full_house'])
    assert.doesNotMatch(h.run(`entry('${id}')`),/후미 범퍼를 떼고|새 바닥을 40cm|후미 벽을 뜯고|서비스칸을 40cm 잇고|창 한 칸이 더 생긴 첫날/);
});
test('a free Kangwoo talk cannot complete a future meal at zero food; paid result stays frozen',()=>{
  const h=setup();h.run(`S.party=['kangwoo'];S.comps.kangwoo={bond:15,mood:60};S.food=0;S.min=390;
    globalThis.e=event('talk_kw_19');G.beginPresentation(e);globalThis.before=[S.day,S.min,S.food];
    globalThis.paid=G.resolvePresentedChoice(e,e.choices[1])`);
  assert(h.run('paid.ok'));assert.doesNotMatch(h.run('words(paid.out.text)'),/그날 저녁|많이 먹었다/);
  assert.deepEqual(plain(h.run('[S.day,S.min,S.food]')),plain(h.run('before')));
  reload(h);const saved=h.run('JSON.stringify(S)');h.run(`e.choices[1].out[0].text='바뀐 코드';globalThis.replay=G.resolvePresentedChoice(e,e.choices[1])`);
  assert.equal(h.run('replay.applied'),false);assert.doesNotMatch(h.run('words(replay.out.text)'),/바뀐 코드/);assert.equal(h.run('JSON.stringify(S)'),saved);
});
test('a stationary notebook lesson is a plan, with matching journal and no phantom travel',()=>{
  const h=setup();h.run(`S.at='daegu';S.min=390;S.stats.km=206;globalThis.e=event('gp_note2');
    globalThis.before=[S.day,S.min,S.stats.km,S.at];G.beginPresentation(e);globalThis.paid=G.resolvePresentedChoice(e,e.choices[0])`);
  assert.match(h.run('e.choices[0].label'),/적|확인/);
  assert.doesNotMatch(h.run('words(paid.out.text)'),/평지에 닿은 뒤|일정한 속도로 내려갔다/);
  assert.doesNotMatch(h.run('JSON.stringify(paid.out.fx.note)'),/안전하게 내려왔다/);
  assert.deepEqual(plain(h.run('[S.day,S.min,S.stats.km,S.at]')),plain(h.run('before')));
});
test('unscheduled Gyeongju entry works at dawn, midday and night without fixed sunset',()=>{
  const h=setup();for(const min of [315,780,1405]){h.ctx.min=min;h.run('S.min=min');assert.doesNotMatch(h.run("entry('loc_gyeongju')"),/해가 진다|노을/);}
});
test('warning-shot hull loss has a physical cause without removing its original cost',()=>{
  const h=setup();h.run(`globalThis.e=event('perimeter_first');globalThis.o=e.choices[0].out[0]`);
  assert.equal(h.run('o.fx.van'),-6);assert.match(h.run('words(e.text)+words(o.text)'),/파편|외판|차체/);
  assert.doesNotMatch(h.run('words(o.text)'),/다음 정차에서/);
});
test('all three final methods lead forward in engine and actual journal, including reload',()=>{
  const h=setup();h.run(`S.at='seoul';G.seoulReady=()=>true;S.flags.seoul_open=true;S.flags.seoul_core_reached=true;S.flags.seoul_costs_seen=true`);
  for(const method of ['core_transfer','core_sleep','core_quarantine']){
    h.ctx.method=method;h.run(`for(const key of ['core_transfer','core_sleep','core_quarantine'])delete S.flags[key];S.flags[method]=true`);
    for(const phase of [0,1,2]){
      h.ctx.phase=phase;h.run(`S.flags.seoul_local_saved=phase>=1;S.flags.uplink_scale_seen=phase>=2;globalThis.row=G.mainQuestEntry();globalThis.note=journal.entry(row)`);
      assert.equal(h.run('row.chapterId'),'finale-aftermath');assert.equal(h.run('row.progress.have'),h.run('row.progress.need'));
      assert.doesNotMatch(h.run('note.next+note.guide+row.next'),/막힌 길|마지막 선택을 한다|검증키.*연결할 차례/);
      const before=h.run('JSON.stringify(S)');h.run('journal.entry(row)');assert.equal(h.run('JSON.stringify(S)'),before);
      reload(h);assert.equal(h.run('G.mainQuestEntry().chapterId'),'finale-aftermath');
    }
  }
});
test('pre-decision guidance remains a decision, while open-city guidance does not invent a blockade',()=>{
  const h=setup();h.run(`S.at='seoul';G.seoulReady=()=>true;S.flags.seoul_core_reached=true;S.flags.seoul_costs_seen=true`);
  assert.match(h.run('journal.entry(G.mainQuestEntry()).next'),/정하자/);
  h.run('delete S.flags.seoul_core_reached;delete S.flags.seoul_costs_seen;S.flags.seoul_han_done=true');
  assert.doesNotMatch(h.run('journal.entry(G.mainQuestEntry()).next'),/길이 막|길을 열고/);
});
test('food offers use stock units, not a whole party day; quantities and prices stay intact',()=>{
  const h=setup();const offers=plain(h.run(`Object.values(D.stls).flatMap(s=>s.trade||[]).filter(r=>r[1]==='food')`));
  assert(offers.length>0);for(const row of offers){assert.doesNotMatch(row[0],/일치/);assert.equal(row[2],1);assert(row[3]>0);}
  h.run(`S.party=['minji','kangwoo'];S.food=10;globalThis.need=G.mealNeed('breakfast');G.consumeMeal('breakfast')`);
  assert.equal(h.run('need'),3);assert.equal(h.run('S.food'),7);
});
test('repeat rescue tiers do not assert a fixed third or second occurrence',()=>{
  const h=setup();for(const id of ['crisis_nofuel3','crisis_collapse2','crisis_breakdown2'])
    assert.doesNotMatch(h.run(`event('${id}').title+entry('${id}')+JSON.stringify(event('${id}').choices)`),/세 번째|세 번째다|두 번째|두 번 했다/);
});
test('short conversations keep their free-time contract without claiming completed exact minutes',()=>{
  const h=setup();for(const id of ['talk_kw_01','talk_mj_06','talkr_mj_3']){
    assert.doesNotMatch(h.run(`entry('${id}')+JSON.stringify(event('${id}').choices)`),/20분|10분|5분|2분|30초/);
    assert(h.run(`event('${id}').choices.every(c=>c.out.every(o=>!o.fx?.time))`));
  }
});
test('Seoul ascent labels acknowledge the actual actor without changing companion requirements',()=>{
  const h=setup();h.run(`globalThis.e=event('seoul_base');S.party=['kangwoo']`);
  assert.match(h.run('e.choices[2].label'),/민지/);assert.equal(h.run('e.choices[2].req.comp'),'minji');
  assert.doesNotMatch(h.run('e.choices[3].label'),/혼자/);assert(h.run('G.reqOk(e.choices[3].req).ok'));
});
test('rescues use rescue feedback, not gunfight labels, with identical numerical effects',()=>{
  const h=setup();h.run(`G.applyFx({combatStart:{id:'test',kind:'구조'}});globalThis.chips=G.applyFx({combatEdge:1,combatPressure:1})`);
  assert.match(h.run('JSON.stringify(chips)'),/구조 여건|구조 위험/);assert.doesNotMatch(h.run('JSON.stringify(chips)'),/교전|전세/);
  assert.equal(h.run('S.combat.edge'),1);assert.equal(h.run('S.combat.pressure'),1);
  h.run(`S.combat.kind='교전';globalThis.chips=G.applyFx({combatEdge:1,combatPressure:1})`);
  assert.match(h.run('JSON.stringify(chips)'),/교전 압박|전세/);
});
test('the recall encounter closes both interventions on site without inventing a carried passenger',()=>{
  const h=setup();h.run(`globalThis.e=event('cleaners_recall')`);
  assert.match(h.run('e.choices[0].out[0].text'),/문을 안에서 잠갔다/);
  assert.match(h.run('e.choices[0].out[1].text'),/여자가 내려|들길로 걸어갔다/);
  assert.doesNotMatch(h.run('JSON.stringify(e.choices[0].out)'),/정착지까지만 태워|그 자리를 떠나는 수밖/);
  assert.deepEqual(plain(h.run('e.choices[0].out.map(o=>o.fx.time)')),[40,30]);
});
test('revised Minji banter and free conversation routes retain their actual consecutive speakers',()=>{
  const h=setup();h.run(`S.party=['minji'];globalThis.actors=(id,i)=>{const e=event(id),o=e.choices[i].out[0];return buildStoryTurns(words(o.text),e,{turnSpeakers:o.turnSpeakers}).filter(t=>t.kind==='dialogue').map(t=>t.who)}`);
  assert.deepEqual(plain(h.run(`actors('talk_mj_03',0)`)),['minji','me','minji','me']);
  assert.deepEqual(plain(h.run(`actors('talkr_mj_3',0)`)),['minji','me','minji','minji','me','minji']);
  assert.doesNotMatch(h.run(`event('talk_mj_03').choices[0].out[0].text`),/말하면 손 뺐/);
});
test('other immediate free lessons and banter avoid completed stopwatch claims, but history stays intact',()=>{
  const h=setup();
  for(const id of ['comp_kw_stop','comp_van_name','comp_wordchain','gp_note1','comp_goodsilence','talk_mj_05',
    'talk_pss_04','talk_jy_04','talk_bori_04','pair_pss_jy_1','talk_mj_12','ev_leo_eunsu','ev_eunsu_solo','talk_leo_16']){
    const copy=h.run(`JSON.stringify(event('${id}').choices)`);
    assert.doesNotMatch(copy,/\d+분|\d+분간|\d+분쯤/,id);
  }
  assert.doesNotMatch(h.run(`entry('comp_goodsilence')`),/노을/);
  assert.doesNotMatch(h.run(`event('ev_eunsu_solo').choices[0].out[0].text`),/오토/);
  assert.match(h.run(`event('talk_pss_06').choices[0].out[0].text`),/30분/,'reported practice is not a current elapsed cost');
  assert.match(h.run(`event('comp_satellite').choices[0].out[0].text`),/90분/,'orbital period is not the story clock');
});
test('late preparation never sends chapter numbering back below the completed family arc',()=>{
  const h=setup();h.run(`G.departureSteps=()=>[{id:'mother',done:true},{id:'seoul',done:false}];
    G.seoulReady=()=>false;G.pillars=()=>({세계:{have:1,need:2}});G.seoulMissing=()=>({pillar:'세계',hint:'거점 응답 확인'});
    globalThis.row=G.mainQuestEntry()`);
  assert.equal(h.run('row.act'),'5장-B');assert.equal(h.run('row.chapterId'),'prepare-세계');
});
