/* Source/engine/reader fixtures with isolated storage. Not user-save or visual QA. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const ui=fs.readFileSync('src/07-ui.js','utf8'),plain=value=>JSON.parse(JSON.stringify(value));
function engine(){
  const store=new Map(),ctx=vm.createContext({console,Date,URLSearchParams,location:{search:''},setTimeout:()=>0,clearTimeout(){},UI:{onDepart(){}},
    localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,String(value)),removeItem:key=>store.delete(key)}});
  for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
  for(const file of fs.readdirSync('src').filter(file=>/^04.*\.js$/.test(file)).sort())vm.runInContext(fs.readFileSync('src/'+file,'utf8'),ctx,{filename:file});
  vm.runInContext(fs.readFileSync('src/07h-story-pages.js','utf8'),ctx);
  return {ctx,run:code=>vm.runInContext(code,ctx)};
}
function helper(h,name){const at=ui.indexOf('  function '+name+'('),end=ui.indexOf('\n  function ',at+4);h.run(ui.slice(at,end));return h.ctx[name];}
const reload=h=>assert(h.run('G.save();S=null;G.load()'));
test('legacy five-step definitions and paid receipts do not opt into the new farewell',()=>{
  const h=engine();
  for(const version of [1,2]){
    h.run(`G.newGame('onroad','예전','interactive');S.opening={version:${version},step:4,pendingResult:null,decisions:{},completed:false,nameIntroduction:'done'}`);
    assert.equal(h.run('G.openingPending()===D.openingDeparture[4]'),true);
    const text=h.run(`G.resolveOpeningChoice('opening_departure','keep_key').out.text`);
    assert.match(text,/시동 모터가 두 번째/);reload(h);
    assert.equal(h.run(`G.resolveOpeningChoice('opening_departure','keep_key').applied`),false);
    h.run(`G.continueOpening('opening_departure')`);reload(h);
    assert.equal(h.run('G.openingPending()'),null);assert(h.run('S.opening.completed'));
  }
});
test('new goodbye follows both paid keys, survives reload, costs nothing and completes once',()=>{
  for(const choice of ['leave_key','keep_key']){
    const h=engine();h.run(`G.seedOverride=719;G.newGame('onroad','다온','interactive');S.opening.step=4`);
    const before=h.run('S.min');h.run(`G.resolveOpeningChoice('opening_departure','${choice}')`);
    assert.equal(h.run('S.min')-before,choice==='leave_key'?10:5);
    assert.doesNotMatch(h.run('G.openingPending().choices.find(c=>c.id==="'+choice+'").out[0].text'),/시동/);
    h.run(`G.continueOpening('opening_departure')`);reload(h);
    assert.equal(h.run('G.openingPending().id'),'opening_farewell');assert(!h.run('S.opening.completed'));
    assert(!h.run('G.canTravelTo("yangsan").ok'));
    const snapshot=h.run('JSON.stringify({min:S.min,items:S.items,stats:S.stats,notes:S.notes})');
    const shadow=engine();shadow.run(`G.seedOverride=719;G.newGame('onroad','다온','interactive');S.opening.step=4;G.resolveOpeningChoice('opening_departure','${choice}');G.continueOpening('opening_departure');G.save();S=null;G.load()`);
    h.run(`G.resolveOpeningChoice('opening_farewell','begin_road')`);
    assert.equal(h.run('rng()'),shadow.run('rng()'),'cosmetic departure cannot consume gameplay randomness');
    assert.equal(h.run('JSON.stringify({min:S.min,items:S.items,stats:S.stats,notes:S.notes})'),snapshot);
    reload(h);assert.equal(h.run(`G.resolveOpeningChoice('opening_farewell','begin_road').applied`),false);
    h.run(`G.continueOpening('opening_farewell')`);reload(h);
    assert(h.run('S.opening.completed'));assert.equal(h.run('G.openingPending()'),null);
    assert.equal(h.run('S._storyQueue.filter(id=>id==="onboarding_first_road").length'),1);
    assert.equal(h.run(`G.continueOpening('opening_farewell')`),false);assert(h.run('G.canTravelTo("yangsan").ok'));
  }
});
test('short authored memory returns to the current appeal; immutable pagination cannot straddle that cut',()=>{
  const h=engine();h.run(`G.newGame('onroad','다온','interactive');S.opening.step=2`);
  const event=plain(h.run('G.openingPending()'));
  assert.deepEqual(event.turns.filter(turn=>turn.timeKind).map(turn=>turn.timeKind),['current','memory','current']);
  assert.equal(event.turns.filter(turn=>turn.timeKind==='memory').length,1);
  assert.match(event.readingRecordLabel,/할아버지에게 들은/);
  const pages=plain(h.run(`(()=>{const turns=G.openingPending().turns;let at={turn:0,offset:0},result=[];while(at.turn<turns.length){const page=StoryPages.take(turns,at,()=>true);result.push(page);at=page.end;}return result;})()`));
  assert.equal(pages.length,3);assert.deepEqual(pages.map(page=>page.rows[0].timeKind),['current','memory','current']);
  assert.deepEqual(event.choices.map(choice=>choice.out[0].fx.time),[15,30]);
  assert.deepEqual(event.turns.slice(4).map(turn=>turn.text),plain(h.run('D.openingDeparture[2].turns.slice(1).map(turn=>turn.text)')));
});
test('time source, picture, partial cursor and optional-history disclosure survive receipt reload',()=>{
  const h=engine();h.run(`G.newGame('onroad','다온','interactive');S.opening.step=2;
    G.capturePresentationView({eventId:'opening_failed_appeal',phase:'event',turns:G.openingPending().turns,index:2,sceneKeys:G.openingPending().scenes,readingRecord:G.openingPending().readingRecord,readingRecordLabel:G.openingPending().readingRecordLabel,recordOpen:true,readingPage:{cursor:{turn:2,offset:1},end:{turn:3,offset:0},trail:[{turn:1,offset:0}]}})`);
  reload(h);const view=plain(h.run(`(()=>{const state={eventId:'opening_failed_appeal',phase:'event'};G.restorePresentationView(state);return state;})()`));
  assert.equal(view.turns[1].timeKind,'memory');assert.match(view.turns[1].timeLabel,/여덟 살/);
  assert.equal(view.readingPage.cursor.offset,1);assert(view.recordOpen);assert.match(view.readingRecordLabel,/할아버지/);
});
test('preparation history contains past sources, never today’s repair or departure, and the legacy playlist stays intact',()=>{
  const h=engine(),pages=plain(h.run('D.introHistoryPages'));
  assert.equal(h.run('D.intro.length'),27);assert.equal(pages.length,10);
  for(const page of pages){assert(page.scene&&page.beats.length);assert(['memory','reported'].includes(page.timeKind));assert.doesNotMatch(page.era,/오늘|어제|요즘/);}
  assert(!pages.some(page=>/departure|appeal|dashboard/.test(page.scene)));
  Object.assign(h.ctx,{introPreview:true});const playlist=helper(h,'introPages');assert.equal(playlist().length,10);
  h.ctx.introPreview=false;assert.equal(playlist().length,27);
});
test('reader orientation changes on back/current/result without spending gameplay state',()=>{
  const h=engine(),orientation={textContent:'',dataset:{currentOrientation:'지금 · 부산 감천 부두 · 07:55'}},sheet={dataset:{readerDensity:'quiet'},querySelector:selector=>selector==='.event-orientation'?orientation:null};
  h.ctx.$=()=>sheet;const render=helper(h,'renderStoryScene');
  const turns=plain(h.run('D.openingPresence[2].turns')),state={turns,sceneKeys:[],eventId:'opening_failed_appeal',phase:'event'};
  render(state,turns[1],1);assert.equal(sheet.dataset.narrativeTime,'memory');assert.match(orientation.textContent,/여덟 살/);
  render(state,turns[4],4);assert.equal(sheet.dataset.narrativeTime,'current');assert.match(orientation.textContent,/07:55/);
  render(state,turns[2],2);assert.equal(sheet.dataset.narrativeTime,'memory');
  render({turns:[{text:'서장을 마치고'}],sceneKeys:[],eventId:'opening_farewell',phase:'outcome'},null,0);assert.equal(sheet.dataset.chapterBoundary,'true');
});
test('quiet CSS stays in existing owners, opts in after code apply and keeps art viewport-only',()=>{
  const css=fs.readFileSync('src/01-style.html','utf8'),postcss=require('postcss');
  const owner=css.match(/<style id="passenger-story-reader">([\s\S]*?)<\/style>/)[1];
  const ast=postcss.parse(owner);
  const declarations=(selector,property)=>{const values=[];ast.walkRules(rule=>{if(rule.selector===selector)rule.walkDecls(property,decl=>values.push(decl.value));});return values;};
  const quiet='#app #ev-wrap.on #ev-sheet.passenger-reader[data-reader-layout="pages"][data-reader-density="quiet"]';
  assert.deepEqual(declarations(quiet,'--dialogue-body-size'),['calc(var(--reading-body-size,13px) + 3px)']);
  assert.deepEqual(declarations(quiet,'--reader-portrait-size'),['36px']);
  assert.match(owner,/html\.ui-large-text #app #ev-wrap\.on #ev-sheet[^\n]*--reader-portrait-size:44px/);
  assert.match(owner,/--reader-art-height:min\(31dvh,56\.25cqw\)/);
  ast.walkRules(rule=>{if(/data-reader-density="quiet"/.test(rule.selector)&&/story-step|story-phase/.test(rule.selector))assert(!rule.nodes.some(decl=>/height|reader-art-height/.test(decl.prop||'')));});
  assert.match(ui,/sheet\.dataset\.readerDensity=!evd\.combat&&!missionOnly\?'quiet':''/);
  assert.match(css,/#intro-book\[data-reader-density="quiet"\] #intro-title\{position:absolute;width:1px/);
});
test('every original choice, requirement, weight and gameplay effect is unchanged in the new five-step variants',()=>{
  const h=engine();
  const projection='events=>events.map(event=>({id:event.id,choices:event.choices.map(choice=>({id:choice.id,label:choice.label,req:choice.req,out:choice.out.map(out=>({p:out.p,fx:out.fx}))}))}))';
  assert.deepEqual(plain(h.run(`(${projection})(D.openingPresence)`)),plain(h.run(`(${projection})(D.openingDeparture)`)));
  const farewell=plain(h.run('D.openingFarewell'));
  assert(farewell.presentationOnly);assert.equal(farewell.choices.length,1);assert(!farewell.choices[0].out[0].fx);
});
test('review keeps the memory source inline even when the main header has returned to now',()=>{
  const h=engine();Object.assign(h.ctx,{speakerInfo:(who,name)=>({id:who,name:name||who}),speakerLaneKey:turn=>turn.who,
    esc:value=>String(value),fmt:value=>value});
  const render=helper(h,'pagedStoryHtml'),turns=plain(h.run('D.openingPresence[2].turns'));
  assert.match(render(turns,true),/page-time-source[^>]*>내 기억 · 여덟 살/);
  assert.doesNotMatch(render(turns),/page-time-source/);
});
