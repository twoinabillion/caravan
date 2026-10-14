const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function fixture(){
 const storage=new Map(),calls=[],list={scrollTop:81},trigger={id:'objective'};
 const ctx=vm.createContext({S:{seed:123,_quality:{createdAt:45},at:'busan',day:1,min:535},
  URLSearchParams,location:{search:'?caravan-live=1'},
  sessionStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k),removeItem:k=>storage.delete(k)},
  document:{body:null,querySelector:s=>s==='#scr-game.on'?{}:s==='[data-trip-objective]'?trigger:null}});
 vm.runInContext(fs.readFileSync('src/07d-ui-quests.js','utf8')+';this.q=QuestLedgerUI;',ctx);
 const q=ctx.q;q.root={querySelector:()=>list};q.isOpen=()=>true;
 q.returnFocus={hasAttribute:()=>true};q.tab='completed';
 q.open=(button,tab)=>calls.push([button,tab]);
 return {ctx,q,storage,calls,list,trigger};
}
test('live code reload restores the exact journal tab, scroll and originating shortcut once',()=>{
 const f=fixture();f.q.captureLiveView();f.list.scrollTop=0;f.q.tab='main';f.q.restoreLiveView();
 assert.deepEqual(f.calls,[[f.trigger,'completed']]);assert.equal(f.list.scrollTop,81);
 f.q.restoreLiveView();assert.equal(f.calls.length,1);assert.equal(f.storage.size,0);
});
test('closed, different save, pending story and ending cannot resurrect the old journal',()=>{
 for(const mode of ['closed','seed','createdAt','at','time','story','ending']){
  const f=fixture();if(mode==='closed')f.q.isOpen=()=>false;f.q.captureLiveView();
  if(mode==='seed')f.ctx.S.seed++;
  if(mode==='createdAt')f.ctx.S._quality.createdAt++;
  if(mode==='at')f.ctx.S.at='yangsan';
  if(mode==='time')f.ctx.S.min++;
  if(mode==='story')f.ctx.S.pendingPresentation={eventId:'example'};
  if(mode==='ending')f.ctx.S.ended=true;
  f.q.restoreLiveView();assert.equal(f.calls.length,0,mode);
 }
});
test('restore waits for gameplay initialization and does not run in standalone mode',()=>{
 const f=fixture();f.q.captureLiveView();const state=f.ctx.S;f.ctx.S=null;
 f.q.restoreLiveView();assert.equal(f.q.liveViewRestored,false);
 f.ctx.S=state;f.q.restoreLiveView();assert.equal(f.calls.length,1);
 const standalone=fixture();standalone.ctx.location.search='';standalone.q.captureLiveView();
 assert.equal(standalone.storage.size,0);
});
