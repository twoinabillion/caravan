/* Real engine and UI handlers with private VM/DOM doubles, not user storage or visual QA. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const ui=fs.readFileSync('src/07-ui.js','utf8'),copy=v=>JSON.parse(JSON.stringify(v));
function engine(){
  const store=new Map(),ctx=vm.createContext({console,Date,URLSearchParams,location:{search:''},setTimeout:()=>0,clearTimeout(){},UI:{onDepart(){}},
    localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
  for(const file of fs.readdirSync('src').filter(f=>/^04.*\.js$/.test(f)).sort())vm.runInContext(fs.readFileSync('src/'+file,'utf8'),ctx,{filename:file});
  return {ctx,store,run:s=>vm.runInContext(s,ctx)};
}
function begin(h,pack='repair',repair='new_part',name=''){
  h.run(`G.seedOverride=719;G.newGame('onroad',${JSON.stringify(name)},'interactive','keeper','${pack}');G.resolveOpeningChoice('opening_workshop','answer_call');G.continueOpening('opening_workshop');G.resolveOpeningChoice('opening_bus_repair','${repair}')`);
}
const stock=h=>copy(h.run('({fuel:S.fuel,scrap:S.scrap,items:S.items,day:S.day,min:S.min,water:S.water,food:S.food,van:S.van,notes:S.notes,stats:S.stats})'));
const reload=h=>assert(h.run('G.save();S=null;G.load()'));
test('three paid repair branches enter the name interlude without moving legacy step indices or paying twice',()=>{
  for(const pack of ['fuel','repair','provisions'])for(const repair of ['new_part','scrap_collar','hose_bypass']){
    const h=engine();begin(h,pack,repair);const paid=stock(h);
    reload(h);assert.equal(h.run('G.openingPending().id'),'opening_bus_repair');
    h.run(`G.continueOpening('opening_bus_repair')`);
    assert.equal(h.run('S.opening.step'),2);assert.equal(h.run('G.openingPending().id'),'opening_name_introduction');
    assert.equal(h.run(`G.continueOpening('opening_bus_repair')`),false);
    assert.equal(h.run('G.canTravelTo("yangsan").ok'),false);
    assert.deepEqual(stock(h),paid);
    h.run(`G.setOpeningNameDraft('다온')`);assert.equal(h.run('S.name'),null);
    const chosen=h.run(`G.resolvePresentedChoice(G.openingPending(),G.openingPending().choices[0])`);
    assert(chosen.ok&&chosen.applied);assert.equal(h.run('S.name'),'다온');assert.deepEqual(stock(h),paid);
    reload(h);assert.equal(h.run('G.openingPending().id'),'opening_name_introduction');
    assert.equal(h.run(`G.resolvePresentedChoice(G.openingPending(),G.openingPending().choices[0]).applied`),false);
    assert.equal(h.run(`G.setOpeningNameDraft('다른 이름')`),false);
    assert.deepEqual(stock(h),paid);
    h.run(`G.continueOpening('opening_name_introduction')`);
    assert.equal(h.run('G.openingPending().id'),'opening_failed_appeal');assert.equal(h.run('S.opening.step'),2);
    assert.equal(h.run(`G.continueOpening('opening_name_introduction')`),false);reload(h);
    assert.equal(h.run('G.openingPending().id'),'opening_failed_appeal');assert.deepEqual(stock(h),paid);
  }
});
test('draft and existing reader cursor survive reload; confirming freezes response name and speaker roles',()=>{
  const h=engine();begin(h);h.run(`G.continueOpening('opening_bus_repair');G.setOpeningNameDraft('  민우 ');G.capturePresentationView({eventId:'opening_name_introduction',phase:'event',turns:D.openingNameIntroduction.turns,index:1})`);
  reload(h);assert.equal(h.run('S.opening.nameDraft'),'  민우 ');assert.equal(h.run('S.name'),null);
  assert.equal(h.run(`(()=>{const state={eventId:'opening_name_introduction',phase:'event'};G.restorePresentationView(state);return state.index;})()`),1);
  h.run(`G.resolvePresentedChoice(G.openingPending(),G.openingPending().choices[0]);S.name='다른이름'`);
  const turns=copy(h.run('D.openingNameIntroduction.choices[0].out[0].turns(S)'));
  assert.deepEqual(turns.map(t=>t.who||''),['me','','intro_child']);
  assert.equal(turns[0].text,'민우야.');assert.equal(turns[2].text,'엄마, 민우 아저씨래.');
  reload(h);assert.equal(h.run('S.name'),'민우');
  h.run(`G.capturePresentationView({eventId:'opening_name_introduction',phase:'outcome',turns:D.openingNameIntroduction.choices[0].out[0].turns(S),index:2})`);reload(h);
  assert.equal(h.run('S.opening.reading.view.index'),2);assert.equal(h.run('S.opening.reading.phase'),'outcome');
});
test('a cosmetic name confirmation does not consume gameplay randomness',()=>{
  const a=engine(),b=engine();for(const h of [a,b]){begin(h);h.run(`G.continueOpening('opening_bus_repair')`);}
  a.run(`G.setOpeningNameDraft('다온');G.resolvePresentedChoice(G.openingPending(),G.openingPending().choices[0])`);
  assert.equal(a.run('rng()'),b.run('rng()'));
});
test('blank, excessive, hidden and malformed names cannot confirm; Unicode and markup remain plain text',()=>{
  const h=engine();begin(h);h.run(`G.continueOpening('opening_bus_repair')`);
  for(const value of ['', '  ', '가나다라마바사아자', '김\n나', '김\u202e나', '\ud800']){
    h.run(`G.setOpeningNameDraft(${JSON.stringify(value)})`);
    const result=h.run(`G.resolveOpeningChoice('opening_name_introduction','say_name')`);
    assert.equal(result.ok,false,value);assert.equal(h.run('S.name'),null);assert.equal(h.run('S.opening.pendingResult'),null);
  }
  assert.equal(h.run(`G.validatePlayerName('다온').name`),'다온');
  assert.equal(h.run(`G.validatePlayerName('각'.repeat(8)).name`),'각'.repeat(8));
  assert(h.run(`G.validatePlayerName('가나다라마바사아').ok`));
  assert(h.run(`G.validatePlayerName('😀😀😀😀😀😀😀😀').ok`));
  assert.equal(h.run(`D.openingNameReply('다온')`),'다온이야.');assert.equal(h.run(`D.openingNameReply('Alex')`),'내 이름은 Alex.');
  h.run(`G.setOpeningNameDraft('<b>나</b>')`);assert(h.run(`G.resolveOpeningChoice('opening_name_introduction','say_name').ok`));
  assert.equal(h.run('S.name'),'<b>나</b>');
});
test('old named/unnamed v1 openings and current named starts do not receive a new question',()=>{
  for(const name of ['', '기존 이름'])for(const step of [0,1,2,3,4]){
    const h=engine();h.run(`G.newGame('onroad',${JSON.stringify(name)},'interactive');S.opening={version:1,step:${step},decisions:{},pendingResult:null,completed:false}`);reload(h);
    assert.equal(h.run('G.openingPending().id'),h.run(`D.openingDeparture[${step}].id`));assert.equal(h.run('S.name'),name||null);
  }
  const h=engine();begin(h,'repair','scrap_collar','이미 정함');h.run(`G.continueOpening('opening_bus_repair')`);
  assert.equal(h.run('G.openingPending().id'),'opening_failed_appeal');assert.equal(h.run('S.name'),'이미 정함');
  for(const mode of ['full','summary','skip']){h.run(`G.newGame('onroad','','${mode}')`);assert.equal(h.run('G.openingPending()'),null);}
});
test('historical preview exits to the same preparation, never recreating a journey or replaying repair',()=>{
  for(const action of ['nextIntro()','skipIntro()']){
    const calls=[],ctx=vm.createContext({screen:'intro',introIdx:0,introTurnIdx:0,introRestart:false,introPreview:true,pendingMode:'onroad',
      D:{intro:[],introHistoryPages:[{beats:[{text:'끝'}]}]},clearIntroAuto(){},closeModal(){},localStorage:{setItem(){}},AMBI:{setLoop(){}},
      $:()=>({classList:{contains:()=>true},focus(){calls.push('focus');}}),
      startNew:mode=>{calls.push('prep:'+mode);ctx.screen='name';},G:{newGame(){throw new Error('preview cannot replace save');}},renderIntro(){}});
    vm.runInContext(ui.slice(ui.indexOf('  function introPages(){'),ui.indexOf('  function renderIntro('))+ui.slice(ui.indexOf('  function nextIntro(){'),ui.indexOf('  function enterGame(){')),ctx);
    vm.runInContext(action+';'+action,ctx);
    assert.deepEqual(calls,['prep:onroad','focus']);assert.equal(ctx.introPreview,false);
  }
});
test('canonical preparation has no name field and starts unnamed exactly once with the selected pack',()=>{
  const h=engine(),elements={};
  Object.assign(h.ctx,{screen:'name',pendingName:'',pendingMode:'onroad',pendingProfile:'keeper',pendingPack:'provisions',preparationKey:'prep',
    $:id=>id==='#inp-name'?null:elements[id]||(elements[id]={addEventListener(){},value:''}),
    sessionStorage:{setItem:(k,v)=>h.store.set(k,v)},SND:{enable(){}},enterGame:()=>{h.ctx.screen='game';}});
  h.run(ui.slice(ui.indexOf('  function rememberPreparation('),ui.indexOf('  let navChoiceAt')));
  h.run(ui.slice(ui.indexOf('    const nameGo=()=>{'),ui.indexOf('    const openingHistory=')));
  elements['#bt-name'].onclick();assert.equal(h.run('S.name'),null);assert.equal(h.run('S.startPack'),'provisions');
  assert.equal(h.run('G.openingPending().id'),'opening_workshop');
  const started=h.run('S');elements['#bt-name'].onclick();assert.equal(h.run('S'),started);
});
test('every pack and all48 opening branches still reach the first road after one name confirmation',()=>{
  for(const pack of ['fuel','repair','provisions']){
    const h=engine();
    for(let n=0;n<48;n++){
      h.run(`G.newGame('onroad','','interactive','keeper','${pack}')`);let branch=n,seen=[];
      while(h.run('Boolean(G.openingPending())')){
        const e=copy(h.run('G.openingPending()'));
        if(e.nameInput)h.run(`G.setOpeningNameDraft('새이름')`);
        const c=e.choices[branch%e.choices.length];branch=Math.floor(branch/e.choices.length);
        assert(h.run(`G.resolvePresentedChoice(G.openingPending(),G.openingPending().choices.find(c=>c.id==='${c.id}')).ok`));
        seen.push(e.id);reload(h);h.run(`G.continueOpening('${e.id}')`);assert(seen.length<=7);
      }
      assert.equal(seen.filter(id=>id==='opening_name_introduction').length,1);assert.equal(h.run('S.name'),'새이름');
      assert.equal(h.run('S._storyQueue.filter(id=>id==="onboarding_first_road").length'),1);
      assert(h.run('G.startTravel("yangsan")'));reload(h);assert.equal(h.run('S.driving.to'),'yangsan');
    }
  }
});
function inputHarness(){
  const h=engine();begin(h);h.run(`G.continueOpening('opening_bus_repair')`);
  const attrs={},input={value:'',focus(){this.focused=true;},blur(){},setAttribute:(k,v)=>attrs[k]=v,removeAttribute:k=>delete attrs[k]};
  const button={},error={hidden:true,textContent:''},form={isConnected:true,querySelector:s=>s==='input'?input:s==='[data-name-confirm]'?button:error};
  const dock={querySelector:()=>form},state={phase:'event',readerMode:'current'},event=h.run('G.openingPending()');
  Object.assign(h.ctx,{curStory:state,curEv:event,heldStoryAdvanceKeys:new Set(),resolveChoice:choice=>h.run(`G.resolvePresentedChoice(G.openingPending(),G.openingPending().choices[0])`)});
  vm.runInContext(ui.slice(ui.indexOf('  function wireOpeningNameAnswer('),ui.indexOf('  function showEvent(')),h.ctx);
  h.ctx.dock=dock;h.run('wireOpeningNameAnswer(dock,curStory,curEv)');
  const key=extra=>input.onkeydown({key:'Enter',code:'Enter',target:input,preventDefault(){},stopPropagation(){},...extra});
  const click=()=>button.onclick({preventDefault(){},stopPropagation(){}});
  return {...h,input,button,error,attrs,form,state,event,key,click};
}
test('actual input handlers preserve a draft, reject IME/held/native-submit and confirm only once',()=>{
  const h=inputHarness();h.input.value='다온';h.input.oninput();assert.equal(h.run('S.name'),null);assert.equal(h.run('S.opening.nameDraft'),'다온');
  for(const extra of [{isComposing:true},{keyCode:229},{repeat:true}]){h.key(extra);assert.equal(h.run('S.name'),null);}
  h.input.oncompositionstart();h.click();h.key({});assert.equal(h.run('S.name'),null);h.input.oncompositionend();
  h.form.onsubmit({preventDefault(){},stopPropagation(){}});assert.equal(h.run('S.name'),null);
  h.key({});assert.equal(h.run('S.name'),'다온');h.input.value='다른';h.click();h.key({});assert.equal(h.run('S.name'),'다온');
});
test('actual input handlers show errors in place and stale form/old journey cannot write',()=>{
  const h=inputHarness();h.click();assert(!h.error.hidden);assert.equal(h.attrs['aria-invalid'],'true');assert(h.input.focused);assert.equal(h.run('S.name'),null);
  h.input.value='가나다라마바사아자';h.input.oninput();h.click();assert.match(h.error.textContent,/8자/);
  h.input.value='민우';h.input.oninput();assert(h.error.hidden);
  h.form.isConnected=false;h.click();assert.equal(h.run('S.name'),null);
  h.form.isConnected=true;h.run(`G.newGame('onroad','','interactive')`);h.click();h.input.oninput();assert.equal(h.run('S.opening.nameDraft'),'');
});
test('back/review rerender restores draft; input HTML escapes and focused keyboard resize preserves its node',()=>{
  const h=inputHarness();h.input.value='민우';h.input.oninput();h.input.value='';h.run('wireOpeningNameAnswer(dock,curStory,curEv)');assert.equal(h.input.value,'민우');
  h.ctx.esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  vm.runInContext(ui.slice(ui.indexOf('  function openingNameAnswerHtml('),ui.indexOf('  function wireOpeningNameAnswer(')),h.ctx);
  h.run(`S.opening.nameDraft='\"><x>';`);assert.match(h.run('openingNameAnswerHtml()'),/value="&quot;&gt;&lt;x&gt;"/);
  const sheet={dataset:{},querySelector:s=>s==='.story-reader'?{}:s==='.event-choice-dock'?{querySelector:()=>h.input,getBoundingClientRect:()=>({height:210})}:{clientHeight:200}};
  h.ctx.document={activeElement:h.input};h.ctx.sheet=sheet;h.ctx.curStory.nameEntry=true;h.ctx.curStory.readingPage={mode:'actions'};
  const prefix=ui.slice(ui.indexOf('  function renderPagedStory('),ui.indexOf('    page.cursor=StoryPages.cursor',ui.indexOf('  function renderPagedStory(')));
  vm.runInContext(prefix+'\n}',h.ctx);h.run('renderPagedStory(curStory,sheet)');assert.equal(sheet.dataset.pageFallback,'actions');
  require('postcss').parse(fs.readFileSync('src/01-style.html','utf8').match(/<style id="passenger-story-reader">([\s\S]*?)<\/style>/)[1]);
});
