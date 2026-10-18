// Real frame loop, lifecycle handlers and engine in private storage. This is not device QA.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const read=file=>fs.readFileSync(file,'utf8'),copy=value=>JSON.parse(JSON.stringify(value)),noop=()=>{};
function fixture({hidden=false,screen='game'}={}){
 const stored=new Map(),handlers={document:{},window:{}},calls=[];
 const listen=kind=>(type,fn)=>(handlers[kind][type]??=[]).push(fn);
 const audio=group=>new Proxy({}, {get:(_,key)=>(...args)=>calls.push([group,key,...args])});
 const context=vm.createContext({console,Date,URLSearchParams,location:{search:''},
  document:{hidden,documentElement:{classList:{contains:()=>false}},addEventListener:listen('document'),
   querySelector:selector=>selector==='.scr.on'?{id:'scr-'+screen}:null},
  window:{addEventListener:listen('window')},setTimeout:()=>0,clearTimeout:noop,
  localStorage:{getItem:key=>stored.get(key)??null,setItem:(key,value)=>stored.set(key,String(value)),removeItem:key=>stored.delete(key)},
  UI:new Proxy({modalOpen:()=>context.modal===true},{get:(o,k)=>o[k]||noop}),
  SND:audio('sound'),BGM:audio('music'),AMBI:audio('ambient'),VO:audio('voice'),
  SCENE:audio('scene'),MAPR:audio('map'),uiPrefs:{reduceMotion:false},screen,bgmEvKey:null,
  $:()=>({classList:{contains:()=>false}}),requestAnimationFrame:()=>calls.push(['frame']),
  renderHud:()=>calls.push(['hud']),renderMission:noop,renderTravelbar:noop,GRAPH:{draw:noop}});
 for(const file of STATIC_CONTENT_FILES)vm.runInContext(read(file),context,{filename:file});
 for(const file of fs.readdirSync('src').filter(file=>/^04.*\.js$/.test(file)).sort())vm.runInContext(read('src/'+file),context,{filename:file});
 const run=code=>vm.runInContext(code,context);
 run(`G.seedOverride=719;G.newGame('onroad','복귀검수','skip','keeper','fuel');
  S.at=null;S.driving={from:'busan',to:'yangsan',dist:20,gone:1,road:'high',slots:[],si:0};G.qualitySessionStart();`);
 const ui=read('src/07-ui.js');
 assert.match(ui,/return \{boot,[\s\S]*?showEnding, setLifecyclePaused,/,'the shipped UI must expose its lifecycle bridge');
 run(ui.slice(ui.indexOf('  /* ── main loop ── */'),ui.indexOf('  /* ── wiring ── */')));
 // Keep the public lifecycle bridge as shipped; do not fake a successful pause.
 if(run('typeof setLifecyclePaused')==='function')context.UI.setLifecyclePaused=run('setLifecyclePaused');
 const source=read('src/07e-ui-audio.js');run(source.slice(source.indexOf('/* 토스 WebView')));
 const frame=timestamp=>run(`loop(${timestamp})`);
 const snapshot=()=>copy(run('({day:S.day,min:S.min,driving:S.driving,fuel:S.fuel,water:S.water,food:S.food,van:S.van,fatigue:S.fatigue,stats:S.stats,used:S.used,seed:S.seed})'));
 const emit=(target,type)=>{for(const handler of handlers[target][type]||[])handler({type});};
 frame(1000);frame(1016);calls.length=0;
 return {context,run,stored,calls,frame,snapshot,emit};
}
test('hidden frame callbacks cannot spend fuel, advance time/distance or render the road',()=>{
 const f=fixture();f.context.document.hidden=true;f.emit('document','visibilitychange');
 const before=f.snapshot();f.calls.length=0;
 for(let n=0;n<120;n++)f.frame(2000+n*1000);
 assert.deepEqual(f.snapshot(),before);
 assert(f.calls.every(call=>call[0]==='frame'),'no hidden render, HUD or ambient restart');
 assert.equal(JSON.parse(f.stored.get('seoul400_save_v1')).driving.gone,before.driving.gone);
});
test('pagehide pauses even before document.hidden; visible pageshow resumes without catch-up',()=>{
 const f=fixture();f.emit('window','pagehide');const before=f.snapshot();
 f.frame(3000);assert.deepEqual(f.snapshot(),before);
 f.context.document.hidden=true;f.emit('window','pageshow');f.frame(4000);
 assert.deepEqual(f.snapshot(),before,'a hidden pageshow cannot resume');
 f.context.document.hidden=false;f.emit('window','pageshow');f.frame(3600000);
 assert.equal(f.snapshot().driving.gone,before.driving.gone,'first return frame has zero elapsed time');
 f.frame(3600016);assert(f.snapshot().driving.gone>before.driving.gone);
 assert(f.snapshot().driving.gone-before.driving.gone<=f.run('G.tickKmPerSecond()')*.016+1e-9);
});
test('return without any background frame does not charge the suspended interval',()=>{
 const f=fixture();f.context.document.hidden=true;f.emit('document','visibilitychange');const before=f.snapshot();
 f.context.document.hidden=false;f.emit('document','visibilitychange');f.frame(600000);
 assert.equal(f.snapshot().fuel,before.fuel);assert.equal(f.snapshot().min,before.min);
 f.frame(600016);assert(f.snapshot().fuel<before.fuel);
});
test('initially hidden load becomes playable on its first visible lifecycle event',()=>{
 const f=fixture({hidden:true});const before=f.snapshot();f.frame(2000);
 assert.deepEqual(f.snapshot(),before);
 f.context.document.hidden=false;f.emit('document','visibilitychange');f.frame(5000);f.frame(5016);
 assert(f.snapshot().driving.gone>before.driving.gone);
});
test('suspension records the actual base screen and never serializes a permanent pause',()=>{
 for(const screen of ['game','name','intro','title']){
  const f=fixture({screen});f.emit('window','pagehide');
  assert.equal(f.run('S._quality.lastStop.context'),'scr-'+screen);
  const saved=JSON.parse(f.stored.get('seoul400_save_v1'));
  assert.equal(saved.lifecyclePaused,undefined);assert.equal(saved.lifecycleHidden,undefined);
  assert(f.run('G.load()'));assert.equal(f.run('S.driving.gone'),saved.driving.gone);
 }
});
test('resume retains an open result/modal; next frames cannot silently resume its road',()=>{
 const f=fixture();f.context.modal=true;f.emit('window','pagehide');const before=f.snapshot();
 f.emit('window','pageshow');f.frame(8000);f.frame(8016);
 assert.equal(f.context.modal,true);assert.equal(f.snapshot().driving.gone,before.driving.gone);
 assert.equal(f.snapshot().fuel,before.fuel);
 f.context.modal=false;f.frame(8032);assert(f.snapshot().driving.gone>before.driving.gone);
});
test('paid opening result survives suspension/reload once and keeps its next reachable scene',()=>{
 const f=fixture();f.run(`G.newGame('onroad','복귀검수','interactive','keeper','repair');
  G.resolveOpeningChoice('opening_workshop','answer_call')`);f.context.modal=true;
 const before=f.snapshot(),paid=f.run('JSON.stringify(S.opening.pendingResult)');
 f.emit('window','pagehide');assert(f.run('G.load()'));f.emit('window','pageshow');
 f.frame(100000);f.frame(100016);
 assert.deepEqual(f.snapshot(),before);assert.equal(f.run('JSON.stringify(S.opening.pendingResult)'),paid);
 assert.equal(f.run(`G.resolveOpeningChoice('opening_workshop','answer_call').applied`),false);
 assert(f.run(`G.continueOpening('opening_workshop')`));
 assert.equal(f.run('G.openingPending().id'),'opening_bus_repair');
});
