/* Fresh-play findings and interrupted-result reproduction. Isolated fixtures,
   not browser play or user-save edits. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const plain=x=>JSON.parse(JSON.stringify(x));
function setup(){
  const store=new Map(),noop=()=>{},ctx=vm.createContext({console,Date,URLSearchParams,location:{search:''},setTimeout:()=>0,clearTimeout:noop,
    UI:new Proxy({modalOpen:()=>false,onArrive:()=>0},{get:(o,k)=>o[k]||noop}),
    localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  const run=code=>vm.runInContext(code,ctx);
  for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
  for(const file of fs.readdirSync('src').filter(f=>/^04.*\.js$/.test(f)).sort())vm.runInContext(fs.readFileSync('src/'+file,'utf8'),ctx,{filename:file});
  run(fs.readFileSync('src/07h-story-pages.js','utf8'));
  run(`G.seedOverride=181105;G.newGame('onroad','상혁','interactive');S.opening.completed=true;
    globalThis.event=id=>D.events.find(e=>e.id===id)||D.seoulStops.find(e=>e.id===id)`);
  return {run,ctx};
}
const reload=h=>assert(h.run('G.save();S=null;G.load()'));
test('a paid authored result survives code replacement even before its first UI reading capture',()=>{
  const h=setup();h.run(`S.at='seoul';S.flags.core_transfer=true;
    globalThis.e=event('seoul_night');globalThis.o=e.choices[0].out[0];G.beginPresentation(e);
    globalThis.paid=G.resolvePresentedChoice(e,e.choices[0]);
    globalThis.expectedTurns=typeof paid.out.turns==='function'?paid.out.turns(S):paid.out.turns;
    globalThis.expectedRecord=typeof paid.out.readingRecord==='function'?paid.out.readingRecord(S):paid.out.readingRecord;`);
  assert(!h.run('S.pendingPresentation.reading?.view'),'interrupted before first capture');reload(h);
  const expected=plain(h.run('expectedTurns')),record=h.run('expectedRecord'),before=h.run('JSON.stringify(S)');
  h.run(`o.turns=()=>[{kind:'dialogue',who:'kangwoo',text:'새 코드의 다른 결과'}];o.readingRecord=()=> '새 코드의 다른 기록';
    globalThis.replay=G.resolvePresentedChoice(e,e.choices[0])`);
  const replayed=plain(h.run(`typeof replay.out.turns==='function'?replay.out.turns(S):replay.out.turns`));
  assert.deepEqual(replayed,expected);assert.equal(h.run(`typeof replay.out.readingRecord==='function'?replay.out.readingRecord(S):replay.out.readingRecord`),record);
  assert.equal(h.run('replay.applied'),false);assert.equal(h.run('JSON.stringify(S)'),before);
});
test('legacy paid text never borrows a new authored result or quote route; captured views still win',()=>{
  const h=setup();h.run(`globalThis.e=event('seoul_costs');G.beginPresentation(e);G.resolvePresentedChoice(e,e.choices[2]);
    delete S.pendingPresentation.authoredView;S.pendingPresentation.view=null;S.pendingPresentation.reading=null;
    S.pendingPresentation.text='이전 판의 대사와 결과';G.save()`);reload(h);
  const before=h.run('JSON.stringify(S)');
  h.run(`e.choices[2].out[0].turns=()=>{throw Error('new source must not execute')};globalThis.replay=G.resolvePresentedChoice(e,e.choices[2])`);
  assert.equal(h.run('replay.out.text'),'이전 판의 대사와 결과');assert.equal(h.run('replay.out.turns'),null);assert(h.run('replay.out.frozenTextOnly'));
  assert.equal(h.run('replay.applied'),false);assert.equal(h.run('JSON.stringify(S)'),before);
  assert(!h.run('G.resolvePresentedChoice(e,e.choices[0]).ok'),'cannot switch a paid choice');
});
test('a cosmetic content exception cannot unlock or double-charge an already paid choice',()=>{
  const h=setup();h.run(`globalThis.e=event('seoul_costs');e.choices[2].out[0].turns=()=>{throw Error('bad display draft')};
    G.beginPresentation(e);globalThis.result=G.resolvePresentedChoice(e,e.choices[2])`);
  assert(h.run('result.ok&&result.applied&&result.out.frozenTextOnly'));assert.equal(h.run('S.pendingPresentation.phase'),'result');
  reload(h);const before=h.run('JSON.stringify(S)');assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[2]).applied'),false);
  assert.equal(h.run('JSON.stringify(S)'),before);
});
test('frozen result capture includes speakers, source, art and record without fabricating a layout cursor',()=>{
  const h=setup();h.run(`S.flags.core_transfer=true;globalThis.e=event('seoul_night');G.beginPresentation(e);G.resolvePresentedChoice(e,e.choices[0])`);
  assert(h.run('S.pendingPresentation.authoredView.turns.some(t=>t.scene&&t.timeKind===\'epilogue\')'));
  assert(!h.run('S.pendingPresentation.view'),'content snapshot must not overwrite real sceneKeys or layout');
  h.run(`G.capturePresentationView({eventId:e.id,phase:'outcome',turns:S.pendingPresentation.authoredView.turns,index:1,
    sceneKeys:['seoul-night-quiet-v2','seoul-home-dawn-v2'],readingRecord:S.pendingPresentation.authoredView.readingRecord,
    readingPage:{cursor:{turn:1,offset:2},end:{turn:2,offset:0},trail:[{turn:0,offset:0}]}})`);reload(h);
  const restored=plain(h.run(`(()=>{const row={eventId:e.id,phase:'outcome'};G.restorePresentationView(row);return row})()`));
  assert.equal(restored.readingPage.cursor.offset,2);assert.equal(restored.sceneKeys.length,2);
  assert.equal(restored.turns[0].timeKind,'epilogue');assert(restored.readingRecord.length);
  h.run('G.queuePresentation(S._chain)');assert(h.run('S.pendingPresentation.phase===\'transition\''),'Continue remains reachable');
});
test('new copy preserves five events’ mechanical contract and reader quote roles',()=>{
  const h=setup(),rows=plain(h.run(`['loc_gyeongju','levy_office','crisis_hungry','combat_toll_read','combat_toll_breach'].map(id=>({id,choices:event(id).choices}))`));
  require('../tools/story-review-contract.cjs').expedition(rows);
  const bytes=JSON.stringify(rows,(k,v)=>['text','label','turnSpeakers','turns','readingRecord','note'].includes(k)?undefined:v);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'f9ed3c632cd89c24192e9cbff63e5149b5277887e14347e227b76eee00db45c4');
  const ui=fs.readFileSync('src/07-ui.js','utf8');h.run(ui.match(/  const stripTags=.*;/)[0]+ui.match(/  const playerSpeaker=.*;/)[0]+
    ui.slice(ui.indexOf('  function eventSpeakerCandidates('),ui.indexOf('  function prepareEventAudio(')));
  assert.deepEqual(plain(h.run(`(()=>{const e=event('loc_gyeongju'),o=e.choices[0].out[0];return buildStoryTurns(o.text,e,{turnSpeakers:o.turnSpeakers}).filter(t=>t.kind==='dialogue').map(t=>t.who)})()`)),['passer_child','me','passer_child','me','me']);
});
test('23:25 Gyeongju rest promises five hours and does not narrate a daytime nap',()=>{
  const h=setup();h.run(`S.at='gyeongju';S.min=1405;globalThis.e=event('loc_gyeongju');G.beginPresentation(e);globalThis.paid=G.resolvePresentedChoice(e,e.choices[0])`);
  assert.match(h.run('e.choices[0].label'),/5시간/);assert.doesNotMatch(h.run('e.choices[0].label'),/하루/);
  assert.equal(h.run('S.day*1440+S.min-(1440+1405)'),300);assert.doesNotMatch(h.run('paid.out.text'),/낮잠/);
  reload(h);const before=h.run('JSON.stringify(S)');assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[0]).applied'),false);assert.equal(h.run('JSON.stringify(S)'),before);
});
test('the checkpoint discloses its lever tool before entry/choice and keeps an available withdrawal',()=>{
  const h=setup();h.run(`globalThis.e=event('combat_toll_read')`);
  assert.match(h.run('e.text'),/쇠파이프.*지렛대/);assert.match(h.run('e.choices[3].out[0].text'),/지렛대가 필요/);
  assert.doesNotMatch(h.run('e.choices[3].out[0].text'),/당기기만 하면/);
  assert(!h.run(`G.reqOk(event('combat_toll_breach').choices[0].req).ok`));
  assert(h.run(`G.reqOk(event('combat_toll_breach').choices[3].req).ok`));
  h.run(`G.beginPresentation(event('combat_toll_breach'));globalThis.result=G.resolvePresentedChoice(event('combat_toll_breach'),event('combat_toll_breach').choices[3])`);
  assert(h.run('result.ok'));assert(h.run('result.out.fx.combatEnd'));
});
test('resource receipt uses actual clamped amounts and finite decimals, without changing transactions',()=>{
  const h=setup();
  for(const [key,label,start,max,v,end,shown] of [
    ['scrap','고철',7,null,-8,0,'-7'],['scrap','고철',0,null,-8,0,'0'],
    ['fuel','연료',69.7,70,12,70,'+0.3L'],['fuel','연료',70,70,12,70,'0L'],
    ['van','차체',98.4,100,6,100,'+1.6%'],['van','차체',3,100,-12,0,'-3%']]){
    h.run(`S.${key}=${start};${max?`S.${key==='van'?'vanMax':'fuelMax'}=${max};`:''}`);
    h.ctx.fx={[key]:v};const chips=plain(h.run('G.applyFx(fx)'));
    assert.equal(h.run('S.'+key),end);assert(chips.some(c=>c.t===label+' '+shown),JSON.stringify(chips));
  }
  h.run(`S.scrap=7;S.party=['jaeyi'];S.comps.jaeyi={mood:65,perks:['jy_hands']}`);
  assert(plain(h.run('G.applyFx({scrap:-8})')).some(c=>c.t==='고철 -6'));assert.equal(h.run('S.scrap'),1);
  assert.doesNotMatch(h.run("event('levy_office').choices[0].out[1].text"),/고철 여덟에/);
});
test('hunger after two missed meals does not invent a full day without food',()=>{
  const h=setup();h.run('S.food=0;S.hunger=0;G.consumeMeal(\'breakfast\');G.consumeMeal(\'lunch\')');
  assert.equal(h.run('S.hunger'),2);assert.doesNotMatch(h.run("event('crisis_hungry').text"),/하루|24시간/);
});
