// Real arrival UI handlers + engine, controlled timers and private storage; no user state or visual QA.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const read=file=>fs.readFileSync(file,'utf8'),copy=value=>JSON.parse(JSON.stringify(value)),noop=()=>{};
function fixture({hidden=false,reduced=false}={}){
 let now=0,seq=0;const timers=new Map(),stored=new Map(),calls=[],nodes={};
 function node(){
  const classes=new Set();return {dataset:{},style:{setProperty:noop,removeProperty:noop},
   classList:{contains:key=>classes.has(key),add:key=>classes.add(key),remove:(...keys)=>keys.forEach(key=>classes.delete(key)),toggle:(key,on)=>on?classes.add(key):classes.delete(key)},
   focus:noop,querySelector(){return this.button;},set innerHTML(value){this.markup=value;this.button={};}};
 }
 for(const id of ['arrival-scene','ev-wrap','ev-sheet','dk-road'])nodes['#'+id]=node();
 const lookup=value=>typeof value==='string'?nodes[value]:value;
 const context=vm.createContext({console,Date,URLSearchParams,location:{search:''},
  document:{hidden,readyState:'loading',addEventListener:noop,documentElement:{dataset:{},classList:{contains:()=>false}}},
  window:{dispatchEvent:noop},CustomEvent:function(){},performance:{now:()=>now},
  localStorage:{getItem:key=>stored.get(key)??null,setItem:(key,value)=>stored.set(key,String(value))},
  setTimeout:(fn,ms)=>{timers.set(++seq,{fn,due:now+ms});return seq;},clearTimeout:id=>timers.delete(id),requestAnimationFrame:noop,
  screen:'game',uiPrefs:{reduceMotion:reduced},journeyConsoleMode:'route',roadNotice:null,
  esc:String,$:lookup,renderAll:noop,renderHud:noop,clearStoryAuto:noop,showCampHub:noop,showSeoul:noop,
  SND:{setDriving:noop},AMBI:{arrive:noop,restore:noop},
  closeModal:value=>{lookup(value).classList.remove('on');calls.push('close');},
  openModal:value=>lookup(value).classList.add('on'),activeModal:()=>Object.values(nodes).some(n=>n.classList.contains('on')),
  curEv:null,curStory:null,curCombatChoices:[]});
 const run=code=>vm.runInContext(code,context);
 context.UI=new Proxy({modalOpen:()=>context.activeModal(),onDepart:noop,onArrive:()=>run('onArrive()'),roadApproach:(_profile,next)=>next?.(),
  toast:message=>calls.push(['toast',message]),renderAll:()=>calls.push(['render'])},{get:(o,k)=>o[k]||noop});
 const show=event=>{context.curEv=event;context.curStory={phase:'event'};nodes['#ev-wrap'].classList.add('on');run(`G.beginPresentation(curEv)`);};
 context.showEvent=context.UI.showEvent=show;
 for(const file of STATIC_CONTENT_FILES)run(read(file));
 for(const file of fs.readdirSync('src').filter(file=>/^04.*\.js$/.test(file)).sort())run(read('src/'+file));
 const ui=read('src/07-ui.js');
 run(ui.slice(ui.indexOf('  /* ── main loop ── */'),ui.indexOf('  /* ── wiring ── */')));
 run(ui.slice(ui.indexOf('  function onArrive(){'),ui.indexOf('  /* ── bubbles ── */')));
 run(ui.slice(ui.indexOf('  function closeEvent(){'),ui.indexOf('  function showSeoul(')));
 run(`G.seedOverride=719;G.newGame('onroad','도착검수','skip','keeper','fuel');G.load()`);
 const tick=ms=>{
  now+=ms;let count=0;
  while(true){const next=[...timers].filter(([,t])=>t.due<=now).sort((a,b)=>a[1].due-b[1].due)[0];if(!next)break;
   timers.delete(next[0]);next[1].fn();assert(++count<100,'timer drain is bounded');}
 };
 const arrive=(id='yangsan')=>run(`S.at='${id}';S.driving=null;S.pendingArrival='${id}';onArrive()`);
 return {context,run,timers,tick,arrive,nodes,calls,stored,
  pause:on=>run(`setLifecyclePaused(${on})`),snapshot:()=>copy(run('({at:S.at,day:S.day,min:S.min,fuel:S.fuel,water:S.water,food:S.food,scrap:S.scrap,items:S.items,flags:S.flags})'))};
}
test('minor arrival countdown keeps its remaining visible time through background and return',()=>{
 const f=fixture();f.arrive();f.tick(1700);f.context.document.hidden=true;f.pause(true);const before=f.snapshot();
 f.tick(60000);assert(f.nodes['#arrival-scene'].classList.contains('on'));assert.equal(f.run('S.pendingArrival'),'yangsan');
 assert.deepEqual(f.snapshot(),before);f.context.document.hidden=false;f.pause(false);
 f.tick(2599);assert(f.nodes['#arrival-scene'].classList.contains('on'));
 f.tick(1);assert(!f.nodes['#arrival-scene'].classList.contains('on'));
 assert.equal(f.run('S.pendingArrival'),undefined);assert.equal(f.run('S.pendingPresentation.eventId'),'onboarding_first_road');
});
test('a timer already queued as hidden cannot consume arrival, including pagehide before hidden',()=>{
 for(const flag of ['document','pagehide']){
  const f=fixture();f.arrive();
  if(flag==='document')f.context.document.hidden=true;else f.pause(true);
  f.tick(10000);assert(f.nodes['#arrival-scene'].classList.contains('on'));assert.equal(f.run('S.pendingArrival'),'yangsan');
  f.context.document.hidden=false;f.pause(false);f.tick(4299);assert.equal(f.run('S.pendingArrival'),'yangsan');
  f.tick(1);assert.equal(f.run('S.pendingArrival'),undefined);
 }
});
test('initially hidden arrivals start their full countdown only after becoming visible',()=>{
 const f=fixture({hidden:true});f.arrive();f.tick(60000);assert.equal(f.run('S.pendingArrival'),'yangsan');
 f.context.document.hidden=false;f.pause(false);f.tick(4299);assert.equal(f.run('S.pendingArrival'),'yangsan');
 f.tick(1);assert.equal(f.run('S.pendingArrival'),undefined);
});
test('manual continue and Escape consume once; old callbacks cannot close another arrival or screen',()=>{
 const f=fixture();f.arrive();const old=f.nodes['#arrival-scene'].button.onclick;
 f.arrive('miryang');old();assert(f.nodes['#arrival-scene'].classList.contains('on'));assert.equal(f.run('S.pendingArrival'),'miryang');
 f.tick(60000);assert.equal(f.run('S.pendingArrival'),'miryang','major cities retain explicit Continue');
 const current=f.nodes['#arrival-scene'].button.onclick;f.context.screen='title';current();
 assert.equal(f.run('S.pendingArrival'),'miryang');assert(f.nodes['#arrival-scene'].classList.contains('on'));
 f.context.screen='game';f.nodes['#arrival-scene'].onkeydown({key:'Escape',preventDefault:noop,stopPropagation:noop});
 assert.equal(f.run('S.pendingArrival'),undefined);const count=f.calls.length;current();f.tick(10000);assert.equal(f.calls.length,count);
});
test('saved arrival reload stays at the same stop and has a single reachable next action',()=>{
 const f=fixture({reduced:true});f.arrive();f.run('G.save()');const before=f.snapshot();
 f.pause(true);f.tick(60000);assert(f.run('G.load()'));assert.deepEqual(f.snapshot(),before);
 f.pause(false);f.arrive();f.nodes['#arrival-scene'].button.onclick();
 assert.equal(f.run('S.pendingPresentation.eventId'),'onboarding_first_road');assert.deepEqual(f.snapshot(),before);
 const e=f.context.curEv;f.context.choice=e.choices[0];assert(f.run('G.resolvePresentedChoice(curEv,choice).applied'));
 const paid=f.snapshot();f.run('G.save();G.load()');assert.equal(f.run('G.resolvePresentedChoice(curEv,choice).applied'),false);
 assert.deepEqual(f.snapshot(),paid);f.context.curStory.phase='outcome';f.run('closeEvent()');
 assert(f.run('S.flags.first_order_trace'));assert.equal(f.run('S.pendingPresentation'),null);assert(f.run("G.canTravelTo('miryang').ok"));
});
test('three packs cross the actual opening, first leg, arrival, trace branches and exploration before next departure',()=>{
 for(const pack of ['fuel','repair','provisions'])for(let trace=0;trace<3;trace++){
  const f=fixture();f.run(`G.seedOverride=719;G.newGame('onroad','길검수','interactive','keeper','${pack}');
   while(G.openingPending()){const event=G.openingPending(),choice=event.choices.find(c=>G.reqOk(G.choiceReq(c)).ok);
    G.resolveOpeningChoice(event.id,choice.id);G.continueOpening(event.id);}`);
  assert(f.run("G.startTravel('yangsan')"));let frames=0;
  while(f.run('!!S.driving')){
   f.run('G.tick(.05)');
   while(f.nodes['#ev-wrap'].classList.contains('on')){
    f.context.choice=[...f.context.curEv.choices].reverse().find(c=>{
     f.context.candidate=c;return f.run('G.reqOk(G.choiceReq(candidate)).ok&&G.reqVisible(G.choiceReq(candidate))');
    });
    assert(f.context.choice,'a usable road choice remains');assert(f.run('G.resolvePresentedChoice(curEv,choice).ok'));
    f.context.curStory.phase='outcome';f.run('closeEvent()');
   }
   assert(++frames<1000,'first leg terminates without forced location');
  }
  assert.equal(f.run('S.at'),'yangsan');assert.equal(f.run('S.pendingArrival'),'yangsan');
  f.run('G.save();G.load()');f.arrive();f.nodes['#arrival-scene'].button.onclick();
  assert.equal(f.run('S.pendingPresentation.eventId'),'onboarding_first_road');
  f.context.choice=f.context.curEv.choices[trace];assert(f.run('G.resolvePresentedChoice(curEv,choice).applied'));
  const paid=f.snapshot();f.run('G.save();G.load()');assert.equal(f.run('G.resolvePresentedChoice(curEv,choice).applied'),false);
  assert.deepEqual(f.snapshot(),paid);f.context.curStory.phase='outcome';f.run('closeEvent()');
  assert(f.run('S.flags.first_order_trace'));assert.equal(f.run('S.startPack'),pack);
  const minute=f.run('S.day*1440+S.min');assert(f.run('G.explore()'));assert.equal(f.run('S.day*1440+S.min'),minute+120);
  assert.equal(f.run('S._exploreNodes.yangsan'),1);assert.equal(f.run('S.used.filter(id=>id==="onboarding_first_road").length'),1);
  if(f.nodes['#ev-wrap'].classList.contains('on')){
   f.context.choice=[...f.context.curEv.choices].reverse().find(c=>{f.context.candidate=c;return f.run('G.reqOk(G.choiceReq(candidate)).ok');});
   assert(f.run('G.resolvePresentedChoice(curEv,choice).ok'));f.context.curStory.phase='outcome';f.run('closeEvent()');
  }
  assert(f.run("G.startTravel('miryang')"));const leg=f.run('JSON.stringify(S.driving)');f.run('G.save();G.load()');
  assert.equal(f.run('JSON.stringify(S.driving)'),leg);
 }
});
test('exploration with a capped road encounter still reports its actual salvage and updates the next action',()=>{
 const f=fixture();f.run(`S.at='yangsan';S.flags.first_order_trace=true;S._roadEventDay=S.day;
  S._roadEventCount=3;S._lastRoadEventKm=S.stats.km;`);
 assert(f.run("G.eligible('탐색').length>0"));const before=f.snapshot();f.calls.length=0;
 assert(f.run('G.explore()'));assert.equal(f.run('S.pendingPresentation'),null);
 assert.equal(f.run('S.scrap'),before.scrap+6);assert.equal(f.run("S.items['부품']"),before.items['부품']+1);
 assert.equal(f.run('S.min'),before.min+120);
 assert(f.calls.some(call=>Array.isArray(call)&&call[0]==='toast'&&/고철 \+6.*부품 \+1/.test(call[1])),
  'a completed search must show its actual found supplies even when no event may open');
 assert(f.calls.some(call=>Array.isArray(call)&&call[0]==='render'),'refresh tries/repeat forecast instead of leaving the old search card');
 const parts=f.run("S.items['부품']"),scrap=f.run('S.scrap');f.calls.length=0;
 assert(f.run('G.explore()'));assert.equal(f.run("S.items['부품']"),parts);
 assert(f.run('S.scrap')>=scrap+2&&f.run('S.scrap')<=scrap+4);
 assert(f.calls.some(call=>Array.isArray(call)&&call[0]==='toast'&&/재수색 고철/.test(call[1])));
 assert.equal(f.run('G.exploreStatus().ok'),false);const exhausted=f.snapshot();
 assert.equal(f.run('G.explore()'),false);assert.deepEqual(f.snapshot(),exhausted);
 f.run('G.save();G.load()');assert.equal(f.run('G.exploreStatus().ok'),false);
});
test('encounter scheduler distinguishes an actual opened scene from a declined opportunity',()=>{
 const f=fixture();f.run(`S.at='yangsan';S.flags.first_order_trace=true;S.stats.km=100;S.stats.events=5;
  S._roadEventDay=S.day;S._roadEventCount=0;S._lastRoadEventKm=-999;`);
 assert.equal(f.run('G.fireDriveEvent2([])'),false);
 assert.equal(f.run("G.fireDriveEvent2(G.eligible('탐색'))"),true);
 assert(f.nodes['#ev-wrap'].classList.contains('on'));assert(f.run('!!S.pendingPresentation'));
 assert.equal(f.run('S._roadEventCount'),1);
});
