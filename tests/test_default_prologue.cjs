// Real narrative data, engine and entry handlers with private stores; no user save.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const ui=fs.readFileSync('src/07-ui.js','utf8');
function fixture(){
  const store=new Map(),session=new Map(),elements=new Map();
  const element=id=>{
    if(id==='#inp-name')return null;
    if(!elements.has(id))elements.set(id,{value:'',open:false,scrollTop:0,textContent:'',hidden:false,focus(){},addEventListener(){},classList:{contains:()=>false}});
    return elements.get(id);
  };
  const ctx=vm.createContext({console,Date,URLSearchParams,location:{search:''},setTimeout:()=>0,clearTimeout(){},
    localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
    sessionStorage:{getItem:k=>session.get(k)||null,setItem:(k,v)=>session.set(k,String(v)),removeItem:k=>session.delete(k)},
    screen:'title',introIdx:0,introTurnIdx:0,introPreview:false,introPrologue:false,introRestart:false,
    pendingMode:'onroad',pendingName:'',pendingProfile:'keeper',pendingPack:'fuel',preparationKey:'caravan-departure-prep-v1',
    $:element,SND:{enabled:false,enable(){this.enabled=true;}},AMBI:{setLoop(){}},clearIntroAuto(){},closeModal(){},
    show:id=>{ctx.screen=id.slice(4);},renderProfilePick(){},renderIntro(){},UI:{onDepart(){}},
    enterGame(){ctx.screen='game';}});
  const run=code=>vm.runInContext(code,ctx);
  for(const f of STATIC_CONTENT_FILES)run(fs.readFileSync(f,'utf8'));
  for(const f of fs.readdirSync('src').filter(f=>/^04.*\.js$/.test(f)).sort())run(fs.readFileSync('src/'+f,'utf8'));
  run(ui.slice(ui.indexOf('  function rememberPreparation('),ui.indexOf('  let navChoiceAt')));
  run(ui.slice(ui.indexOf('  function startNew(mode){'),ui.indexOf('  function introName()')));
  run(ui.slice(ui.indexOf('  function introPages(){'),ui.indexOf('  function renderIntro(')));
  run(ui.slice(ui.indexOf('  function nextIntro(){'),ui.indexOf('  function enterGame(){')));
  run(ui.slice(ui.indexOf('    const nameGo=()=>{'),ui.indexOf('    const openingHistory=')));
  return {ctx,run,store,session,elements};
}
test('a normal new journey begins with family history before packing, without replacing an existing journey',()=>{
  const h=fixture();h.run("G.newGame('onroad','이전 여정','interactive');G.resolveOpeningChoice('opening_workshop','answer_call')");
  const before=h.store.get('seoul400_save_v1'),state=h.run('S');
  h.run(ui.match(/    \$\('#bt-new'\)\.onclick=.*;/)[0]);h.elements.get('#bt-new').onclick();
  assert.equal(h.ctx.screen,'intro');assert.equal(h.run('introPages()[introIdx].scene'),'intro-family-packing-v1');
  const scenes=h.run('Array.from(introPages(),p=>p.scene)');
  for(const scene of ['intro-cheollian-2026','intro-first-expulsion','intro-parents-discovery','intro-blank-reason','intro-envelope-signal'])assert(scenes.includes(scene),scene);
  assert.equal(h.run('S'),state);assert.equal(h.store.get('seoul400_save_v1'),before);
});
test('finishing the history reaches packing, then one fresh interactive opening with the selected supplies',()=>{
  const h=fixture();h.run('startJourneyPrologue();introIdx=introPages().length-1;introTurnIdx=introPages()[introIdx].beats.length-1;nextIntro()');
  assert.equal(h.ctx.screen,'name');assert.equal(h.run('S'),null);
  h.run("pendingPack='repair'");h.elements.get('#bt-name').onclick();
  assert.equal(h.ctx.screen,'game');assert.equal(h.run('S.startPack'),'repair');
  assert.equal(h.run('G.openingPending().id'),'opening_workshop');
  assert.equal(h.run('S.opening.nameIntroduction'),'pending');
  const state=h.run('S');h.elements.get('#bt-name').onclick();assert.equal(h.run('S'),state);
});
test('a refreshed new-journey history resumes its exact page and turn, while old saves stay unchanged',()=>{
  const h=fixture();h.run("G.newGame('onroad','수리 중','interactive');G.resolveOpeningChoice('opening_workshop','answer_call')");
  const before=h.store.get('seoul400_save_v1');
  h.run('startJourneyPrologue();introIdx=4;introTurnIdx=3;rememberJourneyPrologue();introIdx=0;introTurnIdx=0;introPrologue=false;introPreview=false;startJourneyPrologue()');
  assert.equal(h.ctx.screen,'intro');assert.equal(h.ctx.introIdx,4);assert.equal(h.ctx.introTurnIdx,3);
  assert.equal(h.store.get('seoul400_save_v1'),before);
});
test('explicit summary leads to preparation; back and re-entry do not trap the player in a repeated prologue',()=>{
  const h=fixture();h.run('startJourneyPrologue();skipIntro()');assert.equal(h.ctx.screen,'name');
  h.run("rememberPreparation(false);screen='title';startJourneyPrologue()");assert.equal(h.ctx.screen,'name');
  assert.equal(h.run('S'),null);
  h.run('clearPreparation();startJourneyPrologue()');assert.equal(h.ctx.screen,'intro','a distinct new journey receives the prologue again');
});
test('optional history preview returns to packing and cannot mark an unseen default prologue as finished',()=>{
  const h=fixture();h.run("startNew('onroad');introPreview=true;introIdx=introPages().length-1;introTurnIdx=introPages()[introIdx].beats.length-1;screen='intro';nextIntro();startJourneyPrologue()");
  assert.equal(h.ctx.screen,'intro');assert.equal(h.ctx.introIdx,0);
});
test('the explicit title gesture enables sound for the default prologue, but boot resume never enables it',()=>{
  const h=fixture();h.run(ui.match(/    \$\('#bt-new'\)\.onclick=.*;/)[0]);h.elements.get('#bt-new').onclick();
  assert.equal(h.ctx.SND.enabled,true);
  h.ctx.SND.enabled=false;h.run('startJourneyPrologue()');assert.equal(h.ctx.SND.enabled,false);
});
test('past-only summary never claims the upcoming bus repair or module discovery; legacy summary restores on leaving',()=>{
  const h=fixture(),list={innerHTML:'<li>내가 고친 버스와 계기판 검증 모듈</li>',hidden:true};
  const els={'#intro-summary ol':list,'#intro-hint':{},'#intro-summary .intro-summary-lead':{},'#intro-summary-start':{},'#intro-summary-title':{}};
  h.ctx.$=id=>els[id];h.ctx.introPrologue=true;h.ctx.introPreview=true;
  const code=ui.slice(ui.indexOf("    $('#intro-hint').textContent="),ui.indexOf('    if(newPage){',ui.indexOf("    $('#intro-hint').textContent=")));
  h.run('{'+code+'}');assert.equal(list.hidden,false);assert.match(list.innerHTML,/할아버지/);assert.match(list.innerHTML,/부모님|엄마/);
  assert.doesNotMatch(list.innerHTML,/도윤|유나|고친 버스|계기판|검증 모듈/);
  h.ctx.introPrologue=false;h.ctx.introPreview=false;h.run('{'+code+'}');
  assert.equal(list.innerHTML,'<li>내가 고친 버스와 계기판 검증 모듈</li>');
});
test('new default prologue earns the grandfather farewell with their shared workshop and home',()=>{
  const h=fixture();h.run('startJourneyPrologue()');
  const pages=h.run('introPages()'),scenes=Array.from(pages,p=>p.scene);
  assert(scenes.includes('intro-years-together'));
  assert(scenes.includes('intro-camper-conversion'));
  assert(!scenes.includes('intro-socket-memory-v1'),'the socket joke is told once in the fuller scene');
  const words=Array.from(pages,p=>p.beats.map(b=>b.text).join('\n')).join('\n');
  assert(!words.includes('돌아오는 길에 수첩 속 표식들이 생각났다'));
  assert.match(words,/차 말고 우리/);assert.match(words,/두 사람이 겨우 눕는 작은 집/);
  assert.equal(JSON.parse(h.session.get('caravan-prologue-view-v1')).version,2);
});
test('an active old prologue retains its exact playlist, words and cursor across refresh',()=>{
  const h=fixture();h.session.set('caravan-prologue-view-v1',JSON.stringify({version:1,page:8,turn:4,completed:false}));
  h.run('startJourneyPrologue()');
  assert.equal(h.run('introPages()[introIdx].scene'),'intro-socket-memory-v1');
  assert.equal(h.ctx.introTurnIdx,4);
  assert.equal(JSON.parse(h.session.get('caravan-prologue-view-v1')).version,1);
  h.run('rememberJourneyPrologue();startJourneyPrologue()');
  assert.equal(h.run('introPages()[introIdx].scene'),'intro-socket-memory-v1');
});
