// Shipped handlers + Continue + real engine, private storage and DOM/file doubles.
// This does not certify an OS download or exercise a currently reachable restore UI.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const ui=fs.readFileSync('src/07-ui.js','utf8'),copy=x=>JSON.parse(JSON.stringify(x)),noop=()=>{};
const helpers=ui.slice(ui.indexOf('  function saveCurrentJourney('),ui.indexOf('  const tossRuntime='));
const entry=ui.slice(ui.indexOf('  function enterGame('),ui.indexOf('  /* ── overlays ── */'));
function fixture(){
 const store=new Map(),calls=[],files=new Map(),timers=[],stateLabel={textContent:''};
 const storage={fail:false,getItem:key=>store.get(key)??null,removeItem:key=>store.delete(key),
  setItem(key,value){if(this.fail)throw Error('quota');store.set(key,String(value));}};
 const owner={open:true,classList:{contains:()=>owner.open}};
 const input={value:'fixture.json',files:[],isConnected:true,closest:()=>owner};
 const context=vm.createContext({console:{...console,warn:()=>calls.push('save:warn')},URLSearchParams,location:{search:''},Blob,
  URL:{createObjectURL:blob=>{const id='blob:'+files.size;files.set(id,blob);return id;},revokeObjectURL:id=>calls.push('revoke:'+id)},
  document:{body:{appendChild:a=>{a.connected=true;calls.push('anchor:append');}},createElement:()=>({connected:false,
   click(){assert(this.connected,'download anchor must be mounted');calls.push('download:'+this.download);},remove(){calls.push('anchor:remove');}})},
  localStorage:storage,setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout:noop,
  window:{confirm:()=>true},screen:'game',$:()=>stateLabel,clearPreparation:noop,
  show:()=>calls.push('screen:game'),applyIcons:noop,renderAll:()=>calls.push('render'),
  closeModal:selector=>calls.push('close:'+selector),setDockTab:id=>calls.push('dock:'+id),
  showEnding:kind=>calls.push('ending:'+kind),AMBI:{restore:noop},
  toast:text=>calls.push('toast:'+text),showEvent:event=>calls.push('event:'+event.id),
  onArrive:()=>calls.push('arrival'),showSeoul:noop,
  UI:new Proxy({modalOpen:()=>false,showEvent:event=>calls.push('event:'+event.id),toast:text=>calls.push('toast:'+text)},{get:(o,k)=>o[k]||noop})});
 for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),context);
 for(const file of fs.readdirSync('src').filter(f=>/^04.*\.js$/.test(f)).sort())vm.runInContext(fs.readFileSync('src/'+file,'utf8'),context);
 const run=code=>vm.runInContext(code,context);
 vm.runInContext(helpers+entry,context);
 run("G.newGame('onroad','현재 여정','skip','keeper','fuel');S.flags.main_mission_started=true;G.save()");calls.length=0;
 context.wireSaveImport(input);
 const restore=raw=>{input.files=[{text:async()=>raw}];return input.onchange();};
 const raw=()=>run('G.exportSave()');
 return {run,context,calls,store,storage,owner,input,files,timers,stateLabel,restore,raw};
}
test('save reports its actual commit; manual UI never declares success after quota failure',()=>{
 const f=fixture(),before=f.raw(),stored=[...f.store];f.storage.fail=true;
 assert.equal(f.context.saveCurrentJourney(),false);assert.equal(f.stateLabel.textContent,'저장 안 됨');
 assert(!f.calls.includes('toast:현재 여정을 저장했다'));assert.deepEqual([...f.store],stored);
 assert.equal(f.run('S.name'),'현재 여정');assert.equal(JSON.parse(f.raw()).scrap,JSON.parse(before).scrap);
 f.storage.fail=false;assert.equal(f.context.saveCurrentJourney(),true);assert.equal(f.stateLabel.textContent,'방금 저장됨');
 assert(f.calls.includes('toast:현재 여정을 저장했다'));
 f.run('S=null');assert.equal(f.run('G.save()'),false);
});
test('backup can rescue unsaved live progress despite quota failure; anchor and URL are released',async()=>{
 const f=fixture();f.run('S.scrap+=7');const live=copy(JSON.parse(f.raw())),old=[...f.store];f.storage.fail=true;
 assert.equal(f.context.exportCurrentSave(),true);assert.deepEqual([...f.store],old);
 assert.deepEqual(JSON.parse(await f.files.get('blob:0').text()),live);
 assert(f.calls.includes('anchor:append'));assert(f.calls.includes('anchor:remove'));
 assert(f.calls.includes('toast:백업 파일 다운로드를 요청했다'));
 assert(!f.calls.some(x=>x.includes('백업 파일로 만들었다')));
 f.timers.forEach(fn=>fn());assert(f.calls.includes('revoke:blob:0'));
});
test('failed download setup stays retryable and never reports a completed file',()=>{
 const f=fixture();f.context.document.createElement=()=>({click(){throw Error('denied');},remove(){f.calls.push('removed');}});
 assert.equal(f.context.exportCurrentSave(),false);assert(f.calls.includes('removed'));
 assert(f.calls.some(x=>x.startsWith('toast:백업 파일을 내보내지 못했다')));
 assert(!f.calls.includes('toast:백업 파일 다운로드를 요청했다'));
 f.timers.forEach(fn=>fn());assert(f.calls.includes('revoke:blob:0'));
});
test('cancel, bad JSON, file read rejection and quota failure keep the current save and reset input',async()=>{
 for(const mode of ['cancel','invalid','read','quota']){
  const f=fixture(),before=f.raw(),stored=[...f.store];
  if(mode==='cancel')f.context.window.confirm=()=>false;
  if(mode==='quota')f.storage.fail=true;
  if(mode==='read'){f.input.files=[{text:async()=>{throw Error('read denied');}}];await f.input.onchange();}
  else await f.restore(mode==='invalid'?'{':before);
  assert.equal(f.raw(),before,mode);assert.deepEqual([...f.store],stored,mode);assert.equal(f.input.value,'',mode);
  assert(!f.calls.includes('toast:백업을 복원했다'),mode);assert(!f.calls.includes('screen:game'),mode);
 }
});
test('late file reads cannot replace a closed/rebuilt panel, different run or intro',async()=>{
 for(const mode of ['closed','disconnected','new-run','intro']){
  const f=fixture();let release;const pending=new Promise(resolve=>{release=resolve;});const raw=f.raw();
  f.input.files=[{text:()=>pending}];const task=f.input.onchange();
  if(mode==='closed')f.owner.open=false;
  if(mode==='disconnected')f.input.isConnected=false;
  if(mode==='new-run')f.run("G.newGame('onroad','바뀐 여정','skip','keeper','repair');G.save()");
  if(mode==='intro')f.context.screen='intro';
  const before=f.raw(),stored=[...f.store];release(raw);await task;
  assert.equal(f.raw(),before,mode);assert.deepEqual([...f.store],stored,mode);assert(!f.calls.includes('screen:game'),mode);
 }
});
test('only the newest file request may commit and an older completion cannot clear its input',async()=>{
 const f=fixture();let release;const a=new Promise(resolve=>{release=resolve;});const old=f.raw();
 f.input.files=[{text:()=>a}];const pending=f.input.onchange();
 const newest=JSON.stringify({...JSON.parse(old),name:'두 번째 파일'});await f.restore(newest);
 f.input.value='new-selection';release(old);await pending;
 assert.equal(f.run('S.name'),'두 번째 파일');assert.equal(f.input.value,'new-selection');
 assert.equal(f.calls.filter(x=>x==='toast:백업을 복원했다').length,1);
});
test('paid opening backup resumes the same result through real Continue without charging twice',async()=>{
 const f=fixture();f.run("G.newGame('onroad','오프닝 백업','interactive','keeper','repair');G.resolveOpeningChoice('opening_workshop','answer_call')");
 const raw=f.raw(),paid=JSON.parse(raw),receipt=JSON.stringify(paid.opening.pendingResult);
 f.run("G.newGame('onroad','교체 전','skip','keeper','fuel')");await f.restore(raw);
 assert(f.calls.includes('event:opening_workshop'));assert(f.calls.includes('close:#ovl-status'));
 assert.equal(f.run('S.min'),paid.min);assert.equal(f.run('JSON.stringify(S.opening.pendingResult)'),receipt);
 assert.equal(f.run("G.resolveOpeningChoice('opening_workshop','answer_call').applied"),false);
 assert.equal(f.run('S.min'),paid.min);assert(f.run('G.load()'));
 assert.equal(f.run('JSON.stringify(S.opening.pendingResult)'),receipt);
 assert(f.run("G.continueOpening('opening_workshop')"));assert.equal(f.run('G.openingPending().id'),'opening_bus_repair');
});
test('paid road event and pending arrival use the existing resume owners, not a bare rerender',async()=>{
 for(const mode of ['event','arrival']){
  const f=fixture();
  if(mode==='event')f.run("globalThis.e=D.events.find(e=>e.id==='whites_pass');G.beginPresentation(e);G.resolvePresentedChoice(e,e.choices[0])");
  else f.run("S.at='yangsan';S.pendingArrival='yangsan'");
  const raw=f.raw(),before=JSON.parse(raw);f.run("G.newGame('onroad','교체 전','skip','keeper','fuel')");await f.restore(raw);
  assert.equal(f.run('S.min'),before.min);assert.equal(f.run('S.scrap'),before.scrap);
  if(mode==='event'){
   assert(f.calls.includes('event:whites_pass'));assert.equal(f.run('JSON.stringify(S.pendingPresentation)'),JSON.stringify(before.pendingPresentation));
   assert.equal(f.run('G.resolvePresentedChoice(e,e.choices[0]).applied'),false);
  }else{assert(f.calls.includes('arrival'));assert.equal(f.run('S.pendingArrival'),'yangsan');}
 }
});
test('ended backups show the ending without restarting play; existing controls share the owner',async()=>{
 const f=fixture(),raw=JSON.stringify({...JSON.parse(f.raw()),ended:true,endKind:'stranded'});await f.restore(raw);
 assert(f.calls.includes('ending:stranded'));assert(!f.calls.includes('screen:game'));
 assert.match(ui,/if\(saveNow\) saveNow\.onclick=saveCurrentJourney;/);
 assert.match(ui,/if\(saveExport\) saveExport\.onclick=exportCurrentSave;/);
 assert.match(ui,/wireSaveImport\(b\.querySelector\('\[data-save-import\]'\)\)/);
});
