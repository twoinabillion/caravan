const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/07f-ui-road-thoughts.js','utf8');
const controller=source.slice(0,source.indexOf('/* ── 전방 발견'));
const ui=fs.readFileSync('src/07-ui.js','utf8');
function fixture(){
  let now=0,sequence=0,modal=false,notify;
  const timers=new Map(),listeners=new Map();
  const root={dataset:{},classList:{toggle(){}},style:{setProperty(){}}};
  const caption={hidden:true,textContent:'',offsetHeight:28};
  const stage={clientWidth:360,clientHeight:344};
  const nodes=new Map([['stage',stage],['road-whisper',caption],['bubbles',{childElementCount:0}],['toasts',{childElementCount:0}],['journey-driving-warning',{textContent:''}],['pursuit-help',{hidden:true}],['pursuit-notice',{hidden:true}]]);
  const document={documentElement:root,hidden:false,getElementById:id=>nodes.get(id),addEventListener:(name,fn)=>listeners.set(name,fn)};
  const ctx={document,window:{addEventListener:(name,fn)=>listeners.set(name,fn)},UI:{modalOpen:()=>modal},S:{driving:{from:'busan',to:'yangsan',gone:13.000307666666718},fuel:42,food:10,water:10,van:82},performance:{now:()=>now},
    setTimeout:(fn,ms)=>{const id=++sequence;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id),
    setInterval:(fn,ms)=>{const id=++sequence;timers.set(id,{fn,ms,interval:true});return id;},clearInterval:id=>timers.delete(id),
    MutationObserver:class{constructor(fn){notify=fn;}observe(){}}};
  vm.createContext(ctx);vm.runInContext(controller,ctx);
  return {ctx,root,caption,stage,nodes,timers,listeners,notify:()=>notify(),now:value=>now=value,modal:value=>modal=value,api:ctx.UI.roadThought};
}
test('plain caption never inserts a card/image, consumes resources, or persists narration',()=>{
  const f=fixture(),before=JSON.stringify(f.ctx.S);
  assert(f.api.show('<img src=x> 원문'));assert.equal(f.caption.textContent,'<img src=x> 원문');
  assert.equal(f.caption.hidden,false);assert.equal(f.root.dataset.roadThoughtUi,'whisper');
  const expiry=[...f.timers.values()].find(t=>!t.interval);assert.equal(expiry.ms,8000);expiry.fn();
  assert(f.caption.hidden);assert.equal(f.caption.textContent,'');assert.equal(f.timers.size,0);
  assert.equal(JSON.stringify(f.ctx.S),before);
  assert.doesNotMatch(controller,/innerHTML|createElement|insertAdjacent|localStorage|G\.save|D\.scenes|road-thought-card/);
});
test('35s cooldown drops intermediate observations without queueing or extending hold',()=>{
  const f=fixture();assert(f.api.show('첫 문장'));const timers=f.timers.size;
  f.now(7000);assert.equal(f.api.show('두 번째'),false);assert.equal(f.caption.textContent,'첫 문장');assert.equal(f.timers.size,timers);
  f.api.hide();f.now(34999);assert.equal(f.api.show('세 번째'),false);
  f.now(35000);assert(f.api.show('새 문장'));assert.equal(f.caption.textContent,'새 문장');
});
test('event, approach, hidden window, preference, urgent warning, speech and tools suppress immediately',()=>{
  const changes=[f=>f.modal(true),f=>f.ctx.S.driving.approach={},f=>f.ctx.document.hidden=true,
    f=>f.root.dataset.uiRoadThought='off',f=>f.root.dataset.routeMap='open',f=>f.root.dataset.roadApproach='vehicle',
    f=>f.nodes.get('toasts').childElementCount=1,f=>f.nodes.get('bubbles').childElementCount=1,
    f=>f.nodes.get('journey-driving-warning').textContent='차체 위험',f=>f.nodes.get('pursuit-notice').hidden=false,
    f=>f.nodes.get('pursuit-help').hidden=false,f=>f.ctx.S.driving=null,f=>f.ctx.S.ended=true];
  for(const change of changes){const f=fixture();assert(f.api.show('관찰'));change(f);f.notify();assert(f.caption.hidden);assert.equal(f.timers.size,0);f.now(40000);assert.equal(f.api.show('새 관찰'),false);}
  const f=fixture();f.modal(true);assert.equal(f.api.show('이벤트 중'),false);f.modal(false);f.notify();assert(f.caption.hidden,'closing never replays suppressed text');
});
test('insufficient free road / resizing / large text omit caption without changing stage or deck',()=>{
  const f=fixture();f.caption.offsetHeight=48;assert.equal(f.api.show('두 줄'),false);
  f.caption.offsetHeight=28;assert(f.api.show('한 줄'));f.stage.clientHeight=240;f.listeners.get('resize')();assert(f.caption.hidden);
  assert.equal(f.stage.clientHeight,240);f.stage.clientHeight=500;f.caption.offsetHeight=60;f.now(35000);assert.equal(f.api.show('큰 두 줄'),false);
});
function fn(name){const start=ui.indexOf('  function '+name+'(');const next=ui.indexOf('\n  function ',start+3);return ui.slice(start,next);}
test('menu occasional/off uses device preference, survives reload and leaves game save untouched',()=>{
  const memory=new Map(),f=fixture();
  const storage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)};
  Object.assign(f.ctx,{localStorage:storage,savedMotion:null,savedBrightness:100,curStory:null,$:()=>null});
  const prefs=ui.match(/  const uiPrefs=\{[\s\S]*?\n  \};/)[0].replace('const uiPrefs','var uiPrefs');
  const setup=prefs+'\n'+fn('applyUiPrefs')+'\n'+fn('toggleUiPref');
  vm.runInContext(setup,f.ctx);const before=JSON.stringify(f.ctx.S);
  f.ctx.toggleUiPref('road-thought');assert.equal(memory.get('caravan_ui_road_thought'),'off');assert.equal(f.root.dataset.uiRoadThought,'off');
  vm.runInContext(prefs,f.ctx);assert.equal(f.ctx.uiPrefs.roadThought,false);
  f.ctx.toggleUiPref('road-thought');assert.equal(memory.get('caravan_ui_road_thought'),'occasional');
  assert.equal(JSON.stringify(f.ctx.S),before);
  assert.match(fs.readFileSync('src/02-dom.html','utf8'),/id="menu-road-thought-toggle" data-ui-pref="road-thought"/);
  assert.equal((ui.match(/data-ui-pref="road-thought"/g)||[]).length,2);
});
test('speech interception only targets driving sys narration, leaving dialogue and road cue unchanged',()=>{
  assert.match(ui,/if\(b\.who==='sys'&&S&&S\.driving&&UI\.roadThought\)\{\s*UI\.roadThought\.show\(b\.t\);\s*showNextSpeech\(\);return;/);
  assert.match(ui,/const isThought = b\.who==='나'/);
  assert.match(source,/UI\.roadApproach = \(profile, onComplete\)/);
  const style=fs.readFileSync('src/01-style.html','utf8');
  const blocks=[...style.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)];for(const [,css]of blocks)require('postcss').parse(css);
  assert.match(style,/html\[data-road-thought-ui="whisper"\] #road-whisper\{\s*position:absolute/);
  assert.match(style,/#road-whisper\[hidden\]\{display:none\}/);
});
