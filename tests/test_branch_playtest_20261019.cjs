/* Targeted fixtures for observations from continued branch play, not browser QA. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
function setup(){
  const store=new Map(),noop=()=>{},ctx=vm.createContext({console,Date,URLSearchParams,location:{search:''},
    setTimeout:()=>0,clearTimeout:noop,document:{readyState:'loading',addEventListener:noop},
    window:{dispatchEvent:noop},CustomEvent:function(){},
    UI:new Proxy({modalOpen:()=>false,onArrive:()=>0},{get:(o,k)=>o[k]||noop}),
    localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  const run=code=>vm.runInContext(code,ctx);
  for(const file of STATIC_CONTENT_FILES)run(fs.readFileSync(file,'utf8'));
  for(const file of fs.readdirSync('src').filter(f=>/^04.*\.js$/.test(f)).sort())run(fs.readFileSync('src/'+file,'utf8'));
  const ui=fs.readFileSync('src/07-ui.js','utf8');
  run(ui.match(/  const stripTags=.*;/)[0]+ui.match(/  const playerSpeaker=.*;/)[0]+
    ui.slice(ui.indexOf('  function eventSpeakerCandidates('),ui.indexOf('  function prepareEventAudio(')));
  run(`G.seedOverride=191999;G.newGame('onroad','상혁','interactive');S.opening.completed=true;
    globalThis.event=id=>D.events.find(e=>e.id===id)||D.seoulStops.find(e=>e.id===id);`);
  return {run};
}
test('branch-copy repairs preserve all five events costs, probabilities, requirements, flags and effects',()=>{
  const h=setup(),bytes=h.run(`JSON.stringify(['lc_daegu_makchang','lc_nonsan_camp','ev_mart_warehouse','seoul_base','story_family_principle']
    .map(id=>({id,choices:event(id).choices})),(k,v)=>['text','label','turnSpeakers','turns','readingRecord','note'].includes(k)?undefined:v)`);
  // Captured independently before this batch's production edits.
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'95867ba01e90c2fc4902f7f91cae9e0ff91744bfa613093b9ac7ce7d5a2ac4bc');
});
test('short free Nonsan and Daegu reactions do not certify an exact five-minute jump',()=>{
  const h=setup();
  for(const [id,ci] of [['lc_nonsan_camp',0],['lc_daegu_makchang',1]]){
    h.run(`globalThis.e=event('${id}'),c=e.choices[${ci}];globalThis.before=[S.day,S.min];
      G.beginPresentation(e);globalThis.paid=G.resolvePresentedChoice(e,c)`);
    assert(h.run('paid.ok'));assert.equal(h.run('JSON.stringify([S.day,S.min])'),h.run('JSON.stringify(before)'));
    assert.doesNotMatch(h.run('paid.out.text'),/5분|다섯 분/);
    h.run('G.queuePresentation()');
  }
});
test('forklift salvage labels the scrap actually received, not an untracked future diesel trade',()=>{
  const h=setup();h.run(`globalThis.e=event('ev_mart_warehouse'),c=e.choices[1];
    globalThis.before={scrap:S.scrap,fuel:S.fuel,clock:S.day*1440+S.min};
    G.beginPresentation(e);globalThis.paid=G.resolvePresentedChoice(e,c)`);
  assert(h.run('paid.ok'));assert.match(h.run('c.label'),/부품|고철/);
  assert.match(h.run('paid.out.text'),/체인|이음쇠|고철/);assert.doesNotMatch(h.run('paid.out.text'),/경유|물물교환 밑천/);
  assert.equal(h.run('S.scrap-before.scrap'),6);assert.equal(h.run('S.fuel'),h.run('before.fuel'));
  assert.equal(h.run('S.day*1440+S.min-before.clock'),30);
  assert(h.run('G.save();G.load()'));const state=h.run('JSON.stringify(S)');
  assert.equal(h.run('G.resolvePresentedChoice(e,c).applied'),false);assert.equal(h.run('JSON.stringify(S)'),state);
});
test('saving the single-use jammer does not also activate its interference',()=>{
  const h=setup();h.run(`S.items['교란 장치']=1;globalThis.e=event('seoul_base'),c=e.choices[5];
    globalThis.before=[S.day,S.min,S.fuel,S.items['교란 장치']];
    G.beginPresentation(e);globalThis.paid=G.resolvePresentedChoice(e,c)`);
  assert(h.run('paid.ok'));assert.match(h.run('paid.out.text'),/배터리/);
  assert.doesNotMatch(h.run('paid.out.text'),/목소리가.*끊|시야 잡음|0\.8초/);
  assert.match(h.run('paid.out.text'),/전원은 아꼈다/);
  assert.equal(h.run('JSON.stringify([S.day,S.min,S.fuel,S.items["교란 장치"]])'),h.run('JSON.stringify(before)'));
  assert(h.run('S.flags.seoul_base_done'));assert(h.run('S.flags.ghost_saluted'));
  assert(h.run('G.save();G.load()'));assert.equal(h.run('G.resolvePresentedChoice(e,c).applied'),false);
  assert.equal(h.run('S.items["교란 장치"]'),1);
});
test('jammer battery inspection keeps the actual player line, without a phantom AI reply',()=>{
  const h=setup();
  const roles=h.run(`(()=>{const e=event('seoul_base'),o=e.choices[5].out[0];
    return buildStoryTurns(o.text,e,{turnSpeakers:o.turnSpeakers}).filter(t=>t.kind==='dialogue'||t.kind==='ai').map(t=>t.who)})()`);
  assert.deepEqual(JSON.parse(JSON.stringify(roles)),['me']);
});
test('video-classification choice memory keeps video provenance rather than a paper manuscript',()=>{
  const h=setup();const summary=h.run(`D.choiceMemories.story_family_principle.find(row=>row.id==='principle_screen').summary`);
  assert.match(summary,/영상/);assert.doesNotMatch(summary,/원고/);
});
test('the newly inspected companion and rescue branches retain their original mechanics',()=>{
  const h=setup(),bytes=h.run(`JSON.stringify(['talk_es_03','pair_mj_jy_1','pair_mj_es_1','exp_ricemill','route_ridge_rescue','comp_kw_stop']
    .map(id=>({id,choices:event(id).choices})),(k,v)=>['text','label','turnSpeakers','turns','readingRecord','note'].includes(k)?undefined:v)`);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'714297961c3927ef20c019f83bf3f53fddea86046bd718472c2b4c3697c4ff23');
});
test('a stopped morning Eunsu conversation does not fabricate an afternoon drive',()=>{
  const h=setup();h.run(`S.at='suwon';S.min=390;S.party=['eunsu'];S.comps.eunsu={bond:3,mood:60,perks:[],lvl:1};
    globalThis.e=event('talk_es_03');G.beginPresentation(e);globalThis.paid=G.resolvePresentedChoice(e,e.choices[0])`);
  assert(h.run('paid.ok'));assert.doesNotMatch(h.run('paid.out.text'),/오후였다|시속|달렸다/);
  assert.equal(h.run('S.min'),390);assert.equal(h.run('S.driving'),null);assert.equal(h.run('S.at'),'suwon');
});
test('free pair conversations close the current exchange rather than completing tonight or two hours',()=>{
  const h=setup();h.run(`S.party=['minji','jaeyi','eunsu'];for(const id of S.party)S.comps[id]={bond:3,mood:60,perks:[],lvl:1};S.min=594`);
  for(const id of ['pair_mj_jy_1','pair_mj_es_1']){
    h.run(`globalThis.e=event('${id}');G.beginPresentation(e);globalThis.paid=G.resolvePresentedChoice(e,e.choices[0])`);
    assert(h.run('paid.ok'));assert.equal(h.run('S.min'),594);
    assert.doesNotMatch(h.run('paid.out.text'),/그날 저녁|그날 밤.*잤다|두 시간 동안/);
    assert.doesNotMatch(h.run('JSON.stringify(paid.out.fx.note)'),/2시간/);
    h.run('G.queuePresentation()');
  }
});
test('ricemill smell needs no invented group, while a full bottle can be split into two halves',()=>{
  const h=setup();assert.equal(h.run('S.party.length'),0);
  assert.doesNotMatch(h.run("event('exp_ricemill').choices[1].out[0].text"),/한 사람씩|때마다/);
  assert.match(h.run("event('exp_ricemill').choices[0].out[0].text"),/병 하나 분량/);
});
test('ridge directions agree with the subsequent injured-last extraction',()=>{
  const h=setup();assert.doesNotMatch(h.run("event('route_ridge_rescue').choices[1].out[0].text"),/다친 분은 마지막 말고 세 번째/);
  assert.match(h.run("event('route_ridge_extract').text(S)"),/발목을 다친 여자/);
});
test('the charcoal stall remains readable in daylight without falsely recording a night',()=>{
  const h=setup();assert.doesNotMatch(h.run("event('lc_daegu_makchang').text"),/어둠 속/);
  assert.doesNotMatch(h.run("JSON.stringify(event('lc_daegu_makchang').choices[0].out[0].fx.note)"),/밤/);
});
test('Kangwoo braking incident is drawn only on the road, never from a stopped camp pool',()=>{
  const h=setup();h.run(`S.party=['kangwoo'];S.comps.kangwoo={bond:3,mood:60,perks:[],lvl:1};S.at='suwon';S.min=390;
    globalThis.e=event('comp_kw_stop')`);
  assert.equal(h.run("G.eventAvailable(e,{mode:'local'})"),false);
  assert.equal(h.run("G.eligible('동행').some(e=>e.id==='comp_kw_stop')"),false);
  h.run(`S.driving={from:'pyeongtaek',to:'suwon',gone:12,dist:30};S.at=null`);
  assert.equal(h.run("G.eventAvailable(e,{mode:'road'})"),true);
});
test('the new road-only gate never rewrites or recharges an old paid local braking receipt',()=>{
  const h=setup();h.run(`S.at='suwon';S.fuel=16;S.van=52;
    S.pendingPresentation={version:1,phase:'result',eventId:'comp_kw_stop',choiceIndex:1,outcomeIndex:0,
      text:'이미 지불한 옛 사건의 결과',chips:[{t:'차체 -8%',c:'minus'}]};
    G.save();G.load();globalThis.before=JSON.stringify(S);globalThis.e=event('comp_kw_stop');
    globalThis.replay=G.resolvePresentedChoice(e,e.choices[1])`);
  assert(h.run('replay.ok'));assert.equal(h.run('replay.applied'),false);
  assert.equal(h.run('replay.out.text'),'이미 지불한 옛 사건의 결과');
  assert.equal(h.run('JSON.stringify(S)'),h.run('before'));
  h.run('G.queuePresentation()');assert.equal(h.run('S.pendingPresentation'),null);
  assert.equal(h.run('S.fuel'),16);assert.equal(h.run('S.van'),52);
});
