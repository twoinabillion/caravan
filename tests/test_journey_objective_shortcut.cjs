/* Real UI handlers in an isolated DOM stub; not visual/native focus QA. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');

test('named road objective opens main story with the actual trigger, without starting travel',()=>{
  const source=fs.readFileSync('src/07-ui.js','utf8');
  const start=source.indexOf('  function wireRouteConsole(');
  const end=source.indexOf('  function applyIcons(',start);
  assert(start>=0&&end>start);
  const objective={},calls=[];
  const ctx=vm.createContext({
    journeyRouteModels:[],
    QuestLedgerUI:{open:(...args)=>calls.push(args)},
    $:()=>({click(){calls.push(['generic dock']);}}),
    syncRouteMap(){},
    G:{startTravel(){assert.fail('a goal shortcut must not start travel');}},
  });
  vm.runInContext(source.slice(start,end)+';this.wire=wireRouteConsole;',ctx);
  ctx.wire({querySelector:s=>s==='[data-trip-objective]'?objective:null},[]);
  objective.onclick();
  assert.equal(calls.length,1);
  assert.equal(calls[0][0],objective);
  assert.equal(calls[0][1],'main');
});

test('explicit journal destination wins over unread side updates; generic opening keeps its behavior',()=>{
  const body={classList:{add(){},remove(){}}};
  const ledger={setAttribute(){},getAttribute:()=> 'false'};
  const back={focus(){}};
  const ctx=vm.createContext({S:{},D:{},UI:{},G:{clearQuestLedgerUpdates(){},save(){}},
    document:{body:null,activeElement:{},querySelector:s=>s==='#scr-game.on'?{}:null},
    requestAnimationFrame:fn=>fn()});
  vm.runInContext(fs.readFileSync('src/07d-ui-quests.js','utf8')+';this.Q=QuestLedgerUI;',ctx);
  ctx.document.body=body;
  const q=ctx.Q,trigger={isConnected:true,focus(){this.focused=true;}};
  q.root={querySelector:s=>s==='#quest-ledger'?ledger:back};
  q.render=()=>{};q.setDock=()=>{};q.clearUpdateNotice=()=>{q.pendingUpdateKind=null;};
  for(const previous of ['main','side','completed']){
    q.tab=previous;q.pendingUpdateKind='side';q.open(trigger,'main');
    assert.equal(q.tab,'main');assert.equal(q.returnFocus,trigger);
    q.close();assert(trigger.focused);trigger.focused=false;
  }
  q.tab='completed';q.pendingUpdateKind=null;q.open(trigger);assert.equal(q.tab,'completed');
  q.pendingUpdateKind='side';q.open(trigger);assert.equal(q.tab,'side');
  q.pendingUpdateKind='main';q.open(trigger);assert.equal(q.tab,'main');
});
