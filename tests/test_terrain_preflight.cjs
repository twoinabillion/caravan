const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../src/07-ui.js'),'utf8');
function functionText(name,next){const a=source.indexOf('  function '+name+'('),b=source.indexOf('  function '+next+'(',a+1);assert(a>=0&&b>a,'missing terrain preflight helper');return source.slice(a,b);}
function harness({valid=true,ready=false}={}){
 const helper=functionText('withPreparedTerrain','continueSavedJourney'),resume=functionText('continueSavedJourney','previousJourneyHtml');
 let resolve;const listeners=new Map(),wait=new Promise(r=>resolve=r),calls={load:0,enter:0,sound:0,disabled:0,failed:0,travel:0,refresh:0,cancelled:0},button={disabled:false};
 const terrain={active:()=>calls.disabled===0,ready:()=>ready,prepare:()=>wait,disable:()=>calls.disabled++};
 const context={document:{addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:type=>listeners.delete(type)},selection:'b',modal:false,cancelled:()=>{calls.cancelled++;button.disabled=false;},CONTINUOUS_TERRAIN:terrain,SND:{enable:()=>calls.sound++},SAVE_KEY:'test-save',localStorage:{getItem:()=>context.raw},raw:'old-save',$:()=>button,
  G:{inspectSave:()=>({ok:valid,summary:{at:null,from:'a',to:'b',ended:false}}),load:()=>{calls.load++;if(valid)vm.runInContext('S={ended:false,at:"a",driving:null}',context);return valid;}},refreshTitle:()=>calls.refresh++,toast:()=>{},showEnding:()=>{},Promise};
 vm.createContext(context);vm.runInContext('let screen="title",S=null,terrainEpoch=0,terrainContinueWaiting=false;'+helper+resume+`;function enterGame(){screen='game';S={at:'a',driving:null};}globalThis.api={start:()=>continueSavedJourney(true),cancel:()=>{terrainEpoch++;terrainContinueWaiting=false;screen='mode';},game:()=>{screen='game';S={at:'a',driving:null};},travel:()=>withPreparedTerrain({from:'a',to:'b'},()=>globalThis.travelled(),()=>globalThis.failed())};`,context);
 context.travelled=()=>calls.travel++;context.failed=()=>calls.failed++;
 context.intentTravel=()=>vm.runInContext("withPreparedTerrain({from:'a',to:'b'},()=>globalThis.travelled(),()=>globalThis.failed(),{current:()=>selection==='b'&&!modal,cancelled})",context);
 return {api:context.api,calls,button,context,interact:()=>listeners.get('click')?.(),listeners,finish:async ok=>{ready=ok;resolve(ok);await new Promise(r=>setImmediate(r));}};
}
test('Continue waits before loading a save and unlocks audio once on the original gesture',async()=>{
 const h=harness();assert.equal(h.api.start(),false);assert.equal(h.calls.load,0);assert.equal(h.calls.sound,1);assert.equal(h.button.disabled,true);
 assert.equal(h.api.start(),false);assert.equal(h.calls.sound,1);
 await h.finish(true);assert.equal(h.calls.load,1);assert.equal(h.calls.sound,1);assert.equal(h.button.disabled,false);
});
test('leaving title or replacing the stored save cancels the delayed Continue',async()=>{
 const a=harness();a.api.start();a.api.cancel();await a.finish(true);assert.equal(a.calls.load,0);
 const b=harness();b.api.start();b.context.raw='new-save';await b.finish(true);assert.equal(b.calls.load,0);assert.equal(b.button.disabled,false);assert.equal(b.calls.refresh,1);
});
test('invalid saves and an already-ready landscape retain synchronous original behavior',()=>{
 const bad=harness({valid:false});assert.equal(bad.api.start(),false);assert.equal(bad.calls.load,1);assert.equal(bad.calls.sound,0);
 const good=harness({ready:true});assert.equal(good.api.start(),true);assert.equal(good.calls.load,1);assert.equal(good.calls.sound,1);
});
test('failed cold-load preparation uses legacy before entering the game, never mid-leg',async()=>{
 const h=harness();h.api.start();await h.finish(false);assert.equal(h.calls.disabled,1);assert.equal(h.calls.load,1);assert.equal(h.calls.sound,1);
});
test('travel is not committed before readiness; failure/cancel has no travel side effect',async()=>{
 const a=harness();a.api.game();a.api.travel();assert.equal(a.calls.travel,0);await a.finish(true);assert.equal(a.calls.travel,1);
 const b=harness();b.api.game();b.api.travel();await b.finish(false);assert.equal(b.calls.travel,0);assert.equal(b.calls.failed,1);
 const c=harness();c.api.game();c.api.travel();c.api.cancel();await c.finish(true);assert.equal(c.calls.travel,0);
});
test('a later interaction, changed destination or open modal cancels departure and releases the control',async()=>{
 for(const change of [h=>h.interact(),h=>h.context.selection='c',h=>h.context.modal=true]){
  const h=harness();h.api.game();h.button.disabled=true;h.context.intentTravel();change(h);await h.finish(true);
  assert.equal(h.calls.travel,0);assert.equal(h.calls.cancelled,1);assert.equal(h.button.disabled,false);assert.equal(h.listeners.size,0);
 }
 const h=harness();h.api.game();h.context.intentTravel();await h.finish(true);assert.equal(h.calls.travel,1);assert.equal(h.calls.cancelled,0);assert.equal(h.listeners.size,0);
});
test('backup replacement prepares its inspected route before commit, with cancellation and safe fallback',async()=>{
 assert.match(source,/withImportedTerrain\(raw,/);assert.match(source,/withImportedTerrain\(pending\.raw,/);
 for(const mode of ['ready','failed','cancel']){
  const h=harness();h.api.game();h.context.commit=()=>h.calls.load++;
  vm.runInContext('withImportedTerrain(raw,commit)',h.context);assert.equal(h.calls.load,0);
  if(mode==='cancel')h.api.cancel();await h.finish(mode!=='failed');
  assert.equal(h.calls.load,mode==='cancel'?0:1);assert.equal(h.calls.disabled,mode==='failed'?1:0);
 }
 const closed=harness();closed.api.game();closed.context.valid=true;closed.context.commit=()=>closed.calls.load++;
 vm.runInContext('withImportedTerrain(raw,commit,()=>valid)',closed.context);closed.context.valid=false;await closed.finish(false);
 assert.equal(closed.calls.load,0);assert.equal(closed.calls.disabled,0,'closed backup UI cannot switch an existing journey to legacy');
});
