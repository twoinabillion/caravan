const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const ui=fs.readFileSync('src/07-ui.js','utf8');
function fixture(){
 const tasks=[],storage=new Map(),calls=[];
 const classes=()=>{const set=new Set();return {add:x=>set.add(x),remove:x=>set.delete(x),contains:x=>set.has(x),toggle(x,on){on?set.add(x):set.delete(x);}};};
 const nodes={};for(const id of ['scr-game','scr-intro','scr-title','app','early-sound','intro-skip']) nodes[id]={classList:classes(),dataset:{}};
 nodes['scr-game'].classList.add('on');
 let hidden='false';const ledger={getAttribute:()=>hidden,setAttribute:(k,v)=>hidden=v},list={scrollTop:42};
 const ctx=vm.createContext({S:{seed:7,at:'busan',day:1,min:535},screen:'game',pursuitUi:null,saveTransfer:null,
  Event,URLSearchParams,location:{search:'?caravan-live=1'},
  sessionStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k),removeItem:k=>storage.delete(k)},
  document:{body:null,documentElement:{classList:classes()},activeElement:null,
   querySelector:s=>s==='#scr-game.on'&&nodes['scr-game'].classList.contains('on')?nodes['scr-game']:null,
   querySelectorAll:s=>s==='.scr'?Object.values(nodes):[]},
  $:s=>nodes[s.slice(1)],window:{dispatchEvent:e=>{assert.equal(e.type,'caravanscreenchange');ctx.q.syncAvailability(true);}},
  closePursuitHelp(){},resetStoppedStageFit(){},closeModal(){},closeSaveTransfer(restore){calls.push('transfer-close:'+restore);ctx.saveTransfer=null;},renderIntro(){calls.push('intro');},
  SND:{setDriving(){}},G:{myName:()=> '상혁',newGame(){ctx.S={seed:8,at:'busan',day:1,min:450};},save(){calls.push('save');},clearQuestLedgerUpdates(){calls.push('ack');}},
  requestAnimationFrame:fn=>tasks.push(fn)});
 vm.runInContext(fs.readFileSync('src/07d-ui-quests.js','utf8')+';this.q=QuestLedgerUI;',ctx);
 const q=ctx.q;ctx.document.body={classList:classes()};ctx.document.body.classList.add('quest-ledger-open');
 q.root={querySelector:s=>s==='#quest-ledger'?ledger:s==='.quest-ledger-list'?list:{focus(){calls.push('focus');}}};
 q.setDock=()=>{};q.clearUpdateNotice=()=>{};q.render=()=>q.syncAvailability();
 q.returnFocus={isConnected:true,focus(){calls.push('old focus');}};
 vm.runInContext(ui.slice(ui.indexOf('  function show(id){'),ui.indexOf('  /* ── boot ── */')),ctx);
 vm.runInContext(ui.slice(ui.indexOf('  function startIntroRestart(){'),ui.indexOf('  function nextIntro(){')),ctx);
 return {ctx,q,nodes,tasks,calls,storage};
}
test('real restart closes the old notebook synchronously without focusing old road controls',()=>{
 const f=fixture();f.q.captureLiveView();assert.equal(f.storage.size,1);
 vm.runInContext('startIntroRestart()',f.ctx);
 assert.equal(f.ctx.screen,'intro');assert.equal(f.ctx.S.min,450);
 assert.equal(f.q.isOpen(),false);assert.equal(f.q.root.hidden,true);assert.equal(f.q.root.inert,true);
 assert.equal(f.ctx.document.body.classList.contains('quest-ledger-open'),false);
 assert.equal(f.q.returnFocus,null);assert.equal(f.storage.size,0);
 assert.deepEqual(f.calls,['save','intro']);
 f.q.open(null,'side');assert.deepEqual(f.calls,['save','intro']);
 f.q.captureLiveView();assert.equal(JSON.parse(f.storage.get(f.q.liveViewKey)).open,false);
});
test('leaving for another base screen cancels queued notebook focus; returning to game enables it',()=>{
 const f=fixture();f.q.open();
 vm.runInContext("show('scr-title')",f.ctx);f.tasks.splice(0).forEach(fn=>fn());
 assert(!f.calls.includes('focus'));assert.equal(f.q.isOpen(),false);
 vm.runInContext("show('scr-game')",f.ctx);assert.equal(f.q.root.hidden,false);
 f.q.open();f.tasks.splice(0).forEach(fn=>fn());assert(f.calls.includes('focus'));
});
test('event and absent-save guards do not acknowledge or save an unavailable notebook',()=>{
 for(const reason of ['event','save']){
  const f=fixture();if(reason==='event')f.q.eventIsOpen=()=>true;else f.ctx.S=null;
  f.q.open();assert.deepEqual(f.calls,[]);f.q.syncAvailability();assert.equal(f.q.isOpen(),false);
 }
});
test('boot availability check preserves a pending live restore until gameplay exists',()=>{
 const f=fixture();f.q.captureLiveView();f.q.close(false);
 f.nodes['scr-game'].classList.remove('on');f.q.syncAvailability();
 assert.equal(f.storage.size,1);assert.equal(f.q.root.hidden,true);
});
test('a base-screen change discards staged backup UI before opening intro without old focus',()=>{
 const f=fixture();f.ctx.saveTransfer={pending:{raw:'uncommitted'}};
 vm.runInContext("show('scr-intro')",f.ctx);
 assert.equal(f.ctx.saveTransfer,null);assert.deepEqual(f.calls,['transfer-close:false']);assert.equal(f.ctx.screen,'intro');
});
