// Shipped approach controller and lifecycle bridge, with a private clock/DOM.
// These checks exercise timing/ownership, not the actual browser presentation.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8'),noop=()=>{};
function fixture({hidden=false}={}){
  let now=0,sequence=0,completed=0;
  const timers=new Map(),nodes=new Map();
  function node(){
    const classes=new Set(),children=[];
    return {children,style:{setProperty:noop},setAttribute:noop,classList:{add:key=>classes.add(key),contains:key=>classes.has(key)},
      append(...items){children.push(...items);for(const item of items)if(item.id)nodes.set(item.id,item);},
      remove(){nodes.delete(this.id);},textContent:''};
  }
  const stage=node();nodes.set('stage',stage);
  const context=vm.createContext({console,Date:class extends Date{static now(){return 100000+now;}},
    performance:{now:()=>now},document:{hidden,documentElement:{dataset:{},classList:{contains:()=>false}},getElementById:id=>nodes.get(id),createElement:node},
    setTimeout:(fn,ms)=>{const id=++sequence;timers.set(id,{fn,due:now+ms});return id;},clearTimeout:id=>timers.delete(id),
    UI:{modalOpen:()=>context.modal===true},G:{tick:noop,isNight:()=>false},S:{driving:{approach:{startedAt:100000}},fuel:30,min:600},
    BGM:{tick:noop},AMBI:{syncWorld:noop},SCENE:{draw:noop},MAPR:{drawMini:noop},requestAnimationFrame:noop,
    renderHud:noop,renderMission:noop,renderTravelbar:noop,$:()=>({classList:{contains:()=>false}}),uiPrefs:{reduceMotion:false},
    screen:'game',bgmEvKey:null,curStory:null,clearIntroAuto:noop,clearStoryAuto:noop,scheduleIntroAuto:noop,scheduleStoryAuto:noop});
  const run=code=>vm.runInContext(code,context);
  const ui=read('src/07-ui.js'),approach=read('src/07f-ui-road-thoughts.js');
  run(ui.slice(ui.indexOf('  /* ── main loop ── */'),ui.indexOf('  /* ── wiring ── */')));
  run(approach.slice(approach.indexOf('(()=>{',approach.indexOf('/* ── 전방 발견'))));
  const start=()=>context.UI.roadApproach({kind:'people',label:'길가의 사람',duration:4200},()=>completed++);
  const tick=ms=>{
    const end=now+ms;
    for(let n=0;n<100;n++){
      const next=[...timers].filter(([,t])=>t.due<=end).sort((a,b)=>a[1].due-b[1].due)[0];
      if(!next){now=end;return;}
      now=next[1].due;timers.delete(next[0]);next[1].fn();
    }
    throw Error('unbounded approach timers');
  };
  return {context,start,tick,run,nodes,timers,frame:()=>run('loop(performance.now())'),pause:paused=>run(`setLifecyclePaused(${paused})`),
    completed:()=>completed,elapsed:()=>run('Date.now()-S.driving.approach.startedAt'),
    cue:()=>nodes.get('road-approach-cue')};
}
test('visible approach keeps discovery, braking, stop and handoff in their original order',()=>{
  const f=fixture();f.start();f.tick(1007);assert.equal(f.context.S.driving.approach.phase,undefined);
  f.tick(1);assert.equal(f.context.S.driving.approach.phase,'braking');
  f.tick(2519);assert.equal(f.context.S.driving.approach.phase,'braking');
  f.tick(1);assert.equal(f.context.S.driving.approach.phase,'stopped');
  f.tick(672);assert(f.cue().classList.contains('is-handoff'));assert.equal(f.completed(),0);
  f.tick(100);assert.equal(f.completed(),1);f.tick(60000);assert.equal(f.completed(),1);
});
test('backgrounding during discovery retains remaining reading time and the canvas position',()=>{
  const f=fixture();f.start();f.tick(700);f.pause(true);
  f.tick(30000);assert.equal(f.completed(),0,'hidden time must not open the event');
  assert.equal(f.context.S.driving.approach.phase,undefined);
  f.pause(false);assert.equal(f.elapsed(),700,'renderer clock excludes the suspended interval');
  f.tick(307);assert.equal(f.context.S.driving.approach.phase,undefined);
  f.tick(1);assert.equal(f.context.S.driving.approach.phase,'braking');
  f.tick(3292);assert.equal(f.completed(),1);
});
test('repeat suspension, braking and final handoff keep their remaining time without changing resources',()=>{
  const f=fixture();f.start();f.tick(2000);f.pause(true);f.tick(500);f.pause(true);f.tick(20000);
  assert.equal(f.completed(),0);f.pause(false);assert.equal(f.elapsed(),2000);
  f.tick(1527);assert.equal(f.context.S.driving.approach.phase,'braking');
  f.tick(1);assert.equal(f.context.S.driving.approach.phase,'stopped');
  f.tick(722);f.pause(true);f.tick(30000);assert.equal(f.completed(),0);
  f.pause(false);f.tick(49);assert.equal(f.completed(),0);f.tick(1);assert.equal(f.completed(),1);
  assert.equal(f.context.S.fuel,30);assert.equal(f.context.S.min,600);
});
test('initially hidden approach waits for visibility and cancel removes every pending callback',()=>{
  const f=fixture({hidden:true});f.start();f.tick(60000);assert.equal(f.completed(),0);
  f.context.document.hidden=false;f.pause(false);f.tick(1007);
  assert.equal(f.context.S.driving.approach.phase,undefined);
  f.context.UI.roadApproach(null);f.tick(60000);assert.equal(f.completed(),0);
  assert.equal(f.cue(),undefined);assert.equal(f.timers.size,0);
});
test('a replaced journey cannot receive an old approach callback',()=>{
  const f=fixture();f.start();f.tick(500);f.context.S={driving:null,fuel:10,min:700};
  f.tick(60000);assert.equal(f.completed(),0);assert.equal(f.context.S.fuel,10);
});
test('reading a road tool holds the approach and returning from background cannot bypass that tool',()=>{
  const f=fixture();f.start();f.tick(700);f.context.modal=true;f.frame();
  f.tick(10000);assert.equal(f.completed(),0,'do not replace a tool with an unseen encounter');
  f.pause(true);f.tick(30000);f.pause(false);f.tick(10000);assert.equal(f.completed(),0);
  f.context.modal=false;f.frame();assert.equal(f.elapsed(),700);
  f.tick(307);assert.equal(f.context.S.driving.approach.phase,undefined);
  f.tick(1);assert.equal(f.context.S.driving.approach.phase,'braking');
  f.tick(3292);assert.equal(f.completed(),1);
});
test('a hidden callback without a visibility event retains a coherent unread beat and renderer clock',()=>{
  const f=fixture();f.start();f.tick(700);f.context.document.hidden=true;f.tick(10000);
  assert.equal(f.completed(),0);assert.equal(f.context.S.driving.approach.phase,undefined);
  f.context.document.hidden=false;f.pause(false);assert.equal(f.elapsed(),0);
  f.tick(1007);assert.equal(f.context.S.driving.approach.phase,undefined);
  f.tick(1);assert.equal(f.context.S.driving.approach.phase,'braking');
});
