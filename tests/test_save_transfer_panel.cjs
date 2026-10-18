// Shipped panel/engine in private storage + minimal DOM doubles, not native file-picker QA.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const ui=fs.readFileSync('src/07-ui.js','utf8'),dom=fs.readFileSync('src/02-dom.html','utf8'),css=fs.readFileSync('src/01-style.html','utf8');
const panel=ui.slice(ui.indexOf('  // Approved save-transfer-v1.'),ui.indexOf('  const tossRuntime='));
const entry=ui.slice(ui.indexOf('  function enterGame('),ui.indexOf('  /* ── overlays ── */'));
function fixture(title=false){
 const store=new Map(),calls=[],nodes=new Map(),writes=[];
 const storage={fail:false,getItem:k=>store.get(k)??null,removeItem:k=>store.delete(k),setItem(k,v){if(this.fail)throw Error('quota');store.set(k,String(v));writes.push(k);}};
 const node=id=>{if(!nodes.has(id))nodes.set(id,{isConnected:true,open:false,innerHTML:'',textContent:'',value:'',scrollTop:0,attrs:{},
  focus(){calls.push('focus:'+id)},setAttribute(k,v){this.attrs[k]=v},replaceChildren(){this.innerHTML=''},
  showModal(){this.open=true},close(){this.open=false},click(){calls.push('click:'+id)}});return nodes.get(id)};
 const context=vm.createContext({console:{...console,warn(){}},URLSearchParams,location:{search:''},localStorage:storage,
  setTimeout:()=>0,clearTimeout(){},screen:title?'title':'game',$:s=>node(s.slice(1)),
  esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),
  UI:new Proxy({modalOpen:()=>false,showEvent:e=>calls.push('event:'+e.id)},{get:(o,k)=>o[k]||(()=>{})}),
  clearPreparation:()=>calls.push('clear-prep'),show:()=>calls.push('screen:game'),applyIcons(){},renderAll(){},
  closeModal:s=>calls.push('close:'+s),setDockTab:id=>calls.push('dock:'+id),showEnding:k=>calls.push('ending:'+k),
  AMBI:{restore(){}},showEvent:e=>calls.push('event:'+e.id),onArrive:()=>calls.push('arrival'),showSeoul(){},
  toast:t=>calls.push('toast:'+t),exportCurrentSave:()=>calls.push('export')});
 for(const f of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(f,'utf8'),context);
 for(const f of fs.readdirSync('src').filter(f=>/^04.*\.js$/.test(f)).sort())vm.runInContext(fs.readFileSync('src/'+f,'utf8'),context);
 const run=code=>vm.runInContext(code,context);
 vm.runInContext(panel+entry,context);
 run("G.newGame('onroad','현재 여정','skip','keeper','fuel');S.flags.main_mission_started=true;G.save();G.delayBanter(55);globalThis.previous=S;globalThis.previousRng=rng");
 const raw=run('G.exportSave()');if(title){store.clear();run('S=null;previous=null');}
 writes.length=0;context.wireSaveTransfer();
 const trigger=node('trigger');context.openSaveTransfer(trigger);
 const select=async(raw,name='backup.json')=>context.readSaveTransfer({name,text:async()=>raw});
 return {store,calls,nodes,node,context,run,storage,writes,raw,trigger,select};
}
function preserved(f,before,stored){assert.equal(f.run('G.exportSave()'),before);assert.deepEqual([...f.store],stored);assert.equal(f.run('rng===previousRng'),true);assert.equal(f.run('G.banterCooldown()'),55);}
test('inspection runs real migration/validation without writes, live object or timing replacement',()=>{
 const f=fixture(),before=f.run('G.exportSave()'),stored=[...f.store];
 for(const raw of [f.raw,JSON.stringify({...JSON.parse(f.raw),v:1}),'{','[]','null',JSON.stringify({...JSON.parse(f.raw),v:999})]){
  f.context.raw=raw;f.run('G.inspectSave(raw)');preserved(f,before,stored);assert.equal(f.run('S===previous'),true);
 }
 assert.equal(f.writes.length,0);
});
test('file selection only previews, escapes names and defaults focus to cancellation',async()=>{
 const f=fixture(),before=f.run('G.exportSave()'),stored=[...f.store];
 await f.select(JSON.stringify({...JSON.parse(f.raw),name:'<script>bad',day:2,at:'miryang',min:415}),'<img onerror=bad>.json');
 preserved(f,before,stored);assert.equal(f.writes.length,0);
 const html=f.node('save-transfer-body').innerHTML;assert.match(html,/&lt;script&gt;bad/);assert.match(html,/&lt;img onerror=bad&gt;\.json/);assert.match(html,/06:55/);assert.match(html,/현재 기기의 여정/);
 assert.equal(f.calls.at(-1),'focus:save-transfer-cancel');assert.match(f.node('save-transfer-actions').innerHTML,/이 백업으로 복원/);
});
test('cancel and close clear staged bytes, retain unsaved game and restore the actual trigger',async()=>{
 const f=fixture();f.run('S.scrap+=7');const before=f.run('G.exportSave()'),stored=[...f.store];
 await f.select(f.raw);f.context.backSaveTransfer();assert.equal(f.run('saveTransfer.pending'),null);preserved(f,before,stored);
 f.context.backSaveTransfer();assert.equal(f.run('saveTransfer'),null);assert.equal(f.node('save-transfer-dialog').open,false);assert.equal(f.node('save-transfer-body').innerHTML,'');assert.equal(f.calls.at(-1),'focus:trigger');
});
test('corrupt/future/read failures remain retryable without touching live or stored progress',async()=>{
 const f=fixture(),before=f.run('G.exportSave()'),stored=[...f.store];
 for(const raw of ['{',JSON.stringify({...JSON.parse(f.raw),v:999})]){
  await f.select(raw);assert.equal(f.run('saveTransfer.pending'),null);assert.match(f.node('save-transfer-body').innerHTML,/role="alert"/);preserved(f,before,stored);
 }
 assert.match(f.node('save-transfer-body').innerHTML,/업데이트/);
 await f.context.readSaveTransfer({name:'denied.json',text:async()=>{throw Error('read denied')}});assert.match(f.node('save-transfer-body').innerHTML,/접근 권한/);preserved(f,before,stored);
 await f.select(f.raw);assert(f.run('saveTransfer.pending'));assert.equal(f.writes.length,0);
});
test('title with no save can preview/cancel then explicitly restore and reload an older backup',async()=>{
 const f=fixture(true),raw=JSON.stringify({...JSON.parse(f.raw),v:1,name:'되찾은 여정'});
 await f.select(raw);assert.equal(f.run('S'),null);assert.equal(f.store.size,0);assert.doesNotMatch(f.node('save-transfer-body').innerHTML,/현재 기기의 여정을/);
 f.context.confirmSaveTransfer();assert.equal(f.run('S.name'),'되찾은 여정');assert.equal(f.run('S.v===SAVE_VERSION'),true);assert.equal(f.node('save-transfer-dialog').open,false);assert(f.calls.includes('screen:game'));
 assert.equal(f.run('G.load()'),true);assert.equal(f.run('S.name'),'되찾은 여정');assert.equal(f.run("G.canTravelTo('yangsan').ok"),true);
});
test('quota failure keeps confirmation/cancel and both saves; retry commits and closes once',async()=>{
 const f=fixture(),before=f.run('G.exportSave()'),stored=[...f.store];await f.select(JSON.stringify({...JSON.parse(f.raw),name:'복원 대상'}));f.storage.fail=true;
 f.context.confirmSaveTransfer();preserved(f,before,stored);assert(f.node('save-transfer-dialog').open);assert.match(f.node('save-transfer-body').innerHTML,/현재 여정은 그대로/);assert(!f.calls.some(c=>c.startsWith('toast:백업을 복원')));
 f.storage.fail=false;f.context.confirmSaveTransfer();const writes=f.writes.length;f.context.confirmSaveTransfer();assert.equal(f.writes.length,writes);assert.equal(f.run('S.name'),'복원 대상');assert.equal(f.calls.filter(c=>c==='toast:백업을 복원했다').length,1);
});
test('closed/reopened panel, a new file, new journey and screen changes invalidate late reads',async()=>{
 for(const mode of ['reopen','new-file','new-run','screen','back']){
  const f=fixture();let release;const pending=new Promise(r=>release=r);const task=f.context.readSaveTransfer({name:'late.json',text:()=>pending});
  if(mode==='reopen'){f.context.closeSaveTransfer();f.context.openSaveTransfer(f.trigger);}
  if(mode==='new-file')await f.select(JSON.stringify({...JSON.parse(f.raw),name:'새 파일'}));
  if(mode==='new-run')f.run("G.newGame('onroad','새 여정','skip','keeper','repair')");
  if(mode==='screen')f.context.screen='intro';
  if(mode==='back')f.context.backSaveTransfer();
  const before=f.run('G.exportSave()'),stored=[...f.store],writes=f.writes.length;release(f.raw);await task;
  assert.equal(f.run('G.exportSave()'),before,mode);assert.deepEqual([...f.store],stored,mode);assert.equal(f.writes.length,writes);
  if(mode==='new-file')assert.equal(f.run('saveTransfer.pending.summary.name'),'새 파일');else assert.equal(f.run('saveTransfer.pending'),null);
 }
});
test('stale confirmation cannot overwrite a changed run or screen',async()=>{
 for(const mode of ['run','screen']){const f=fixture();await f.select(f.raw);if(mode==='run')f.run("G.newGame('onroad','다른 여정','skip','keeper','repair')");else f.context.screen='name';const before=f.run('G.exportSave()'),writes=f.writes.length;f.context.confirmSaveTransfer();assert.equal(f.run('G.exportSave()'),before);assert.equal(f.writes.length,writes);}
});
test('paid opening result restores through real Continue once and next scene remains reachable',async()=>{
 const f=fixture();f.run("G.newGame('onroad','오프닝','interactive','keeper','repair');G.resolveOpeningChoice('opening_workshop','answer_call')");
 const paid=f.run('G.exportSave()'),min=f.run('S.min');f.context.closeSaveTransfer();f.context.openSaveTransfer(f.trigger);await f.select(paid);f.context.confirmSaveTransfer();
 assert(f.calls.includes('event:opening_workshop'));assert.equal(f.run('S.min'),min);assert.equal(f.run("G.resolveOpeningChoice('opening_workshop','answer_call').applied"),false);assert.equal(f.run('G.load()'),true);assert(f.run("G.continueOpening('opening_workshop')"));assert.equal(f.run('G.openingPending().id'),'opening_bus_repair');
});
test('ended and pending-arrival backups resume the intended owner',async()=>{
 for(const mode of ['ended','arrival']){const f=fixture();const data=JSON.parse(f.raw);if(mode==='ended'){data.ended=true;data.endKind='stranded';}else{data.at='yangsan';data.pendingArrival='yangsan';}await f.select(JSON.stringify(data));f.context.confirmSaveTransfer();assert(f.calls.includes(mode==='ended'?'ending:stranded':'arrival'));}
});
test('approved navigation, native modal pause, keyboard/cancel and single CSS ownership are connected',()=>{
 assert.match(dom,/id="bt-title-restore"[^>]*aria-controls="save-transfer-dialog"/);assert.match(dom,/id="menu-save-transfer"/);
 assert.equal((dom.match(/id="save-transfer-dialog"/g)||[]).length,1);assert.match(ui,/restore\.hidden=canContinue/);assert.match(ui,/\|\| !!\$\('#save-transfer-dialog'\)\?\.open/);
 assert.match(panel,/oncancel=event=>\{event\.preventDefault\(\);backSaveTransfer\(\)/);assert.match(panel,/event\.target\.value=''/);assert.match(panel,/event\.repeat/);
 assert.equal((css.match(/#save-transfer-dialog\{/g)||[]).length,1);assert.match(css,/#save-transfer-body\{[^}]*overflow:auto/);assert.match(css,/#save-transfer-dialog footer\{[^}]*flex:none/);
});
