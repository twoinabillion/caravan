'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'src/07e-ui-audio.js'),'utf8');
function fixture(live=true){
  let now=1000, next=0;
  const timers=new Map(), visible=new Set(), instances=[];
  class Audio {
    constructor(src){this.src=src;this.paused=true;this.currentTime=0;this.gain=0;instances.push(this);}
    play(){this.paused=false;return Promise.resolve();}
    pause(){this.paused=true;}
  }
  const sandbox={Audio,URLSearchParams,Set,Math,btoa:s=>Buffer.from(s,'binary').toString('base64'),performance:{now:()=>now},
    location:{hostname:'127.0.0.1',search:live?'?caravan-live=1':''},
    document:{getElementById:id=>({classList:{contains:()=>visible.has(id)}})},
    D:{vo:{},bgm:{},nodes:{busan:{},miryang:{stl:'miryang'},tunnelbook:{}}},
    S:{at:'busan',wx:'clear',min:450,driving:null,ended:false},
    G:{isNight:()=>sandbox.S.min>=1200||sandbox.S.min<360},
    SND:{level:()=>1,mediaVolume:a=>a.gain,setMediaVolume:(a,g)=>a.gain=g},
    setInterval:fn=>{const id=++next;timers.set(id,fn);return id;},
    clearInterval:id=>timers.delete(id),
    setTimeout:fn=>{const id=++next;timers.set(id,()=>{timers.delete(id);fn();});return id;},
    clearTimeout:id=>timers.delete(id)
  };
  sandbox.$=id=>sandbox.document.getElementById(id.replace('#',''));
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root,'src/03h-audio.js'),'utf8'),sandbox);
  vm.runInContext(fs.readFileSync(path.join(root,'src/03n-offline-foley.js'),'utf8'),sandbox);
  // Replace embedded placeholders with meaningful URLs in this isolated fixture.
  for(const k of Object.keys(sandbox.D.sfx)) sandbox.D.sfx[k]='recorded/'+k+'.mp3';
  vm.runInContext(source.slice(source.indexOf('const AMBI ='),source.indexOf('/* ═══════════════════ VO '))+'\nglobalThis.audio=AMBI;',sandbox);
  const f={...sandbox,instances,visible,flush(){now+=600;for(const fn of [...timers.values()])fn();},
    advance(ms){now+=ms;},playing(){return instances.filter(a=>!a.paused).map(a=>decodeURIComponent(a.src));}};
  f.audio.setOn(true);return f;
}
test('wet driving uses cab rain plus wipers; forecast alone does not',()=>{
  const f=fixture();f.S.driving={road:'rough'};f.S.wxNext='storm';f.audio.syncWorld('game');
  assert.equal(f.playing().length,0);
  f.S.wx='rain';f.audio.syncWorld('game');f.flush();
  assert(f.playing().some(s=>s.endsWith('/rain_cab_light_v2.mp3')));
  assert(f.playing().some(s=>s.endsWith('/wipers.mp3')));
});
test('clear/fog/dust retire all wet loops',()=>{
  for(const wx of ['clear','fog','dust']){
    const f=fixture();f.S.wx='storm';f.S.driving={};f.audio.syncWorld('game');f.flush();
    f.S.wx=wx;f.audio.syncWorld('game');f.flush();
    assert(!f.playing().some(s=>/rain_|wipers/.test(s)));
  }
});
test('stop keeps cab rain but not wipers',()=>{
  const f=fixture();f.S.wx='rain';f.S.driving={};f.audio.syncWorld('game');f.flush();
  f.S.driving=null;f.audio.syncWorld('game');f.flush();
  assert(f.playing().some(s=>s.endsWith('/rain_cab_light_v2.mp3')));
  assert(!f.playing().some(s=>s.endsWith('/wipers.mp3')));
});
test('market shelter and garage indoor routes do not leak exterior rain',()=>{
  const f=fixture();f.S.wx='rain';f.visible.add('ovl-stl');f.audio.settlement('market','miryang');
  f.audio.syncWorld('game');f.flush();assert(f.playing().some(s=>s.endsWith('/rain_shelter.mp3')));
  f.audio.settlement('garage','miryang');f.audio.syncWorld('game');f.flush();
  assert(!f.playing().some(s=>/rain_|wipers/.test(s)));
});
test('event context and cancel restore weather without replaying actions',()=>{
  const f=fixture();f.S.wx='storm';f.visible.add('ev-wrap');
  f.audio.event({id:'seoul_core'});f.audio.syncWorld('game');f.flush();
  assert(!f.playing().some(s=>/rain_|wipers/.test(s)));
  f.visible.delete('ev-wrap');f.audio.restore();f.audio.syncWorld('game');f.flush();
  assert(f.playing().some(s=>s.endsWith('/rain_cab_heavy_v2.mp3')));
});
test('mute stops old fading layers and shots immediately; unmute restores only current loops',()=>{
  const f=fixture();f.S.wx='rain';f.audio.syncWorld('game');f.audio.action('repair');
  f.S.wx='storm';f.audio.syncWorld('game');f.audio.setOn(false);f.flush();
  assert.equal(f.playing().length,0);
  f.audio.setOn(true);f.flush();
  assert(!f.playing().some(s=>/repair_ratchet/.test(s)));
  assert(!f.playing().some(s=>s.endsWith('/rain_cab_light_v2.mp3')));
  assert(f.playing().some(s=>s.endsWith('/rain_cab_heavy_v2.mp3')));
});
test('background suspend and startup interruption resume driving from saved state',()=>{
  const f=fixture();f.S.wx='rain';f.S.driving={road:'rough'};f.audio.depart('rough');f.audio.syncWorld('game');
  f.audio.suspend();f.flush();assert.equal(f.playing().length,0);
  f.audio.resume();f.flush();
  assert(f.playing().some(s=>s.includes('sfx_drive_gravel_loop')));
  assert(f.playing().some(s=>s.endsWith('/wipers.mp3')));
  assert(!f.playing().some(s=>s.includes('sfx_van_start')));
});
test('one-shot players are pooled, throttled and capped at six',()=>{
  const f=fixture();for(let i=0;i<30;i++){f.audio.action('repair');f.advance(200);}
  assert(f.instances.length<=6); // three takes, at most two media nodes per take
  assert.equal(new Set(f.instances.map(a=>a.src)).size,3);
  for(const kind of ['meal','journal','bag','map','radio','craft','menu']){f.audio.action(kind);f.advance(200);}
  assert(f.playing().length<=6);
  f.audio.action('menu');const before=f.instances.length;
  f.audio.action('menu');assert.equal(f.instances.length,before);
});
test('intro rerenders do not repeat foley; present weather never leaks into memory',()=>{
  const f=fixture();f.S.wx='storm';f.audio.intro('intro-busan-room-morning-v1');
  f.audio.introTurn('intro-busan-room-morning-v1',1,{});
  f.audio.introTurn('intro-busan-room-morning-v1',1,{});
  assert.equal(f.instances.filter(a=>a.src.endsWith('cup_set_down.mp3')).length,1);
  f.audio.intro('intro-parents-discovery');f.audio.syncWorld('intro');f.flush();
  assert(!f.playing().some(s=>/rain_|wipers/.test(s)));
});
test('Free-plan files never load in release/file or remote origins',()=>{
  const f=fixture(false);f.S.wx='rain';f.audio.syncWorld('game');f.audio.action('repair');
  assert(f.instances.length>0);assert(f.instances.every(a=>a.src.startsWith('data:audio/wav;base64,')));
  f.location.search='?caravan-live=1';f.location.hostname='game.example';f.audio.action('meal');
  assert(f.instances.every(a=>a.src.startsWith('data:audio/wav;base64,')));
});
test('offline app fallback covers every registered cue/take and keeps existing lifecycle/volume owners',()=>{
  const f=fixture(false),before=JSON.stringify(f.S);
  for(const key of Object.keys(f.D.detailSfx)){
    const pcm=f.D.offlineFoley.samples(key);assert(pcm,key);assert(pcm.length>0);
    assert.equal(Math.abs(pcm[0]),0);assert.equal(Math.abs(pcm.at(-1)),0);
    assert(pcm.every(x=>Number.isFinite(x)&&Math.abs(x)<=.321));
    const uri=f.D.offlineFoley.source(key);assert.equal(uri,f.D.offlineFoley.source(key));
    const bytes=Buffer.from(uri.split(',')[1],'base64');assert.equal(bytes.toString('ascii',0,4),'RIFF');
    assert.equal(bytes.readUInt32LE(40),pcm.length*2);
  }
  f.S.wx='rain';f.S.driving={};f.audio.syncWorld('game');f.audio.action('repair');f.flush();
  assert(f.playing().length>0);f.audio.suspend();assert.equal(f.playing().length,0);
  f.audio.resume();f.flush();assert(f.playing().length>0);f.audio.setOn(false);f.flush();assert.equal(f.playing().length,0);
  assert.equal(before,JSON.stringify({...f.S,wx:'clear',driving:null}));
  assert.equal(f.D.offlineFoley.source('unknown'),null);
});
test('authored cues and all asset files resolve without altering gameplay state',()=>{
  const f=fixture();const snapshot=JSON.stringify(f.S);
  for(const file of Object.values(f.D.detailSfx)) assert(fs.existsSync(path.join(root,'assets',file)),file);
  for(const cues of Object.values(f.D.introSoundCues)) for(const key of Object.values(cues)) assert(f.D.detailSfx[key]);
  for(let i=0;i<10;i++){f.audio.syncWorld('game');f.flush();}
  assert.equal(JSON.stringify(f.S),snapshot);
});
test('ending clears all ambience; thunder is not immediate and obeys mute',()=>{
  const f=fixture();f.S.wx='storm';f.audio.syncWorld('game');f.flush();
  assert(!f.playing().some(s=>s.endsWith('/thunder_distant.mp3')));
  f.advance(61000);f.audio.syncWorld('game');assert(f.playing().some(s=>s.endsWith('/thunder_distant.mp3')));
  f.audio.setOn(false);f.advance(61000);f.audio.syncWorld('game');f.flush();assert.equal(f.playing().length,0);
  f.audio.setOn(true);f.audio.syncWorld('end');f.flush();assert.equal(f.playing().length,0);
});
test('field result foley follows the completed action, not predicted rewards',()=>{
  const f=fixture();f.audio.fieldAction({change:{visual:'water'}});
  assert(f.playing().some(s=>s.endsWith('/water_pour.mp3')));
  const count=f.instances.length;f.audio.fieldAction({change:{visual:'watch'}});
  assert.equal(f.instances.length,count);
});
test('within-page memory cuts retire the previous scene and its foley',()=>{
  const f=fixture();f.audio.intro('intro-busan-room-morning-v1');
  f.audio.introTurn('intro-busan-room-morning-v1',1,{},'intro-cup-habit-v1');f.flush();
  assert(f.playing().some(s=>s.endsWith('/cup_set_down.mp3')));
  f.audio.introTurn('intro-busan-room-morning-v1',3,{},'intro-socket-memory-v1');f.flush();
  assert(!f.playing().some(s=>/rain_|cup_set_down/.test(s)));
});
test('sample pools do not immediately repeat; small rate/gain variation stays bounded',()=>{
  const f=fixture();let previous=null;
  for(let i=0;i<40;i++){
    const audio=f.audio.play('detail_steps_gravel',.24);
    assert(audio);assert.notEqual(audio.src,previous);previous=audio.src;
    assert(audio.playbackRate>=.97&&audio.playbackRate<=1.03);
    assert(audio._baseVolume>=.24*Math.pow(10,-.8/20)&&audio._baseVolume<=.24*Math.pow(10,.8/20));
    audio.onended();f.advance(200);
  }
  assert(f.instances.length<=3);
});
test('family throttle does not get bypassed by selecting a different take',()=>{
  const f=fixture();assert(f.audio.play('detail_paper_fold'));
  assert.equal(f.audio.play('detail_paper_fold'),null);
});
test('title/ending stop foley; leaving and returning never replay a paid action',()=>{
  const f=fixture();f.audio.action('repair');f.audio.syncWorld('end');f.flush();
  assert.equal(f.playing().length,0);
  f.audio.syncWorld('game');f.flush();assert(!f.playing().some(s=>s.includes('repair_ratchet')));
});

// The same authored choices/receipt resolver as the game, with private storage.
function eventEngine(){
  const store=new Map(),noop=()=>{};
  const ctx=vm.createContext({console,Date,URLSearchParams,location:{search:''},
    setTimeout:()=>0,clearTimeout:noop,UI:new Proxy({},{get:()=>noop}),
    localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  const {STATIC_CONTENT_FILES}=require('./content-registry.cjs');
  for(const file of [...STATIC_CONTENT_FILES,'src/03h-audio.js','src/07h-story-pages.js',
    ...fs.readdirSync(path.join(root,'src')).filter(file=>/^04.*\.js$/.test(file)).sort().map(file=>'src/'+file)])
    vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
  vm.runInContext('globalThis.g=G;globalThis.d=D;',ctx);
  return {ctx,run:code=>vm.runInContext(code,ctx)};
}
test('all interactive opening scenes use story music, including name and night, without changing ordinary routing',()=>{
  const h=eventEngine(),ui=fs.readFileSync(path.join(root,'src/07-ui.js'),'utf8');
  const assignment=ui.match(/^    bgmEvKey = .*;$/m)[0];
  h.ctx.$=selector=>({classList:{contains:()=>selector==='#ev-wrap'}});
  h.run(ui.slice(ui.indexOf('  function bgmKey(){'),ui.indexOf('  function loop(ts){')));
  h.ctx.screen='game';h.run(`G.newGame('onroad','','interactive')`);
  for(const minute of [450,1320])for(const event of [...h.ctx.d.openingDeparture,h.ctx.d.openingNameIntroduction]){
    h.ctx.evd=event;h.run(`S.min=${minute};${assignment}`);
    assert.equal(h.run('bgmKey()'),'story',event.id);
  }
  for(const [event,key] of [[{id:'other',type:'추적'},'tension'],[{id:'other',type:'스토리'},'story'],[{id:'other',type:'조우'},null]]){
    h.ctx.evd=event;h.run(assignment);assert.equal(h.ctx.bgmEvKey,key);
  }
});
test('opening workshops are indoors; bus/name use cab rain; the terminal is sheltered',()=>{
  for(const [id,context] of [['opening_workshop','indoors'],['opening_bus_repair','cab'],
    ['opening_name_introduction','cab'],['opening_failed_appeal','shelter'],
    ['opening_parents_module','indoors'],['opening_departure','indoors']]){
    const f=fixture();f.S.wx='rain';f.visible.add('ev-wrap');
    f.audio.event({id});f.audio.syncWorld('game');f.flush();
    const playing=f.playing();assert(!playing.some(s=>/rain_outdoor|wipers/.test(s)),id);
    if(context==='indoors'){
      assert(!playing.some(s=>/rain_|wind_|insects/.test(s)),id);
      assert(playing.some(s=>s.includes('sfx_garage_loop')),id);
    }else assert(playing.some(s=>s.endsWith(context==='cab'?'/rain_cab_light_v2.mp3':'/rain_shelter.mp3')),id);
  }
});
test('opening foley follows explicit successful choices, never entry, replay, failed or foreign choices',()=>{
  const h=eventEngine();
  for(const event of [...h.ctx.d.openingDeparture,h.ctx.d.openingNameIntroduction])for(const choice of event.choices){
    const f=fixture();f.visible.add('ev-wrap');f.audio.event(event);f.flush();
    assert(f.instances.every(a=>a.loop),'entry must not enact '+event.id);
    const before=f.instances.length,expected=f.D.eventAudio[event.id].results?.[choice.id];
    f.audio.result(event,choice,false);assert.equal(f.instances.length,before,'restored result');
    f.audio.result(event,{...choice},true);assert.equal(f.instances.length,before,'foreign choice');
    f.audio.result(event,choice,true);
    const shots=f.instances.filter(a=>!a.loop);
    assert.equal(shots.length,expected?1:0,event.id+'/'+choice.id);
    if(expected)assert(shots[0].src.includes(expected.startsWith('detail_')?expected.slice(7):expected),expected);
  }
});
test('fuel pump starts only on committed automatic pumping; manual pumping has no mismatched recording',()=>{
  const event={id:'ai_gasstation',choices:[{label:'카드 흉내를 낸다'},{label:'기계를 무시하고 수동으로 뺀다'}]};
  const f=fixture();f.audio.event(event);assert.equal(f.instances.length,0);
  f.audio.result(event,event.choices[1],true);assert.equal(f.instances.length,0);
  f.audio.result(event,event.choices[0],false);assert.equal(f.instances.length,0);
  f.audio.result(event,event.choices[0],true);
  assert.deepEqual(f.playing(),['recorded/sfx_fuel_pump.mp3']);
});
test('muting drops successful action cues; unmute and background resume never queue them',()=>{
  const event={id:'opening_bus_repair',choices:[{id:'new_part'}]},f=fixture();
  f.audio.setOn(false);f.audio.result(event,event.choices[0],true);
  f.audio.setOn(true);f.flush();assert.equal(f.instances.length,0);
  f.audio.suspend();f.audio.result(event,event.choices[0],true);
  f.audio.resume();f.flush();assert.equal(f.instances.length,0);
  f.audio.result(event,event.choices[0],true);assert(f.playing().some(s=>s.includes('repair_ratchet')));
  f.audio.event({id:'opening_name_introduction'});assert.equal(f.playing().length,0,'new conversation retires the repair tail');
});
test('actual UI result hook pays/plays once across every repair method, result reload, and the name handoff',()=>{
  const h=eventEngine(),ui=fs.readFileSync(path.join(root,'src/07-ui.js'),'utf8');
  const start=ui.indexOf('  function resolveChoice(choice){'),end=ui.indexOf('    const combatHud=',start);
  Object.assign(h.ctx,{clearStoryAuto(){},toast(){},storyOutcomeIsQuiet:()=>false,storyOutcomeChips:x=>x,curStory:null});
  h.run(ui.slice(start,end)+'return savedResolution;\n}');
  for(const pack of ['fuel','repair','provisions'])for(const method of ['new_part','scrap_collar','hose_bypass']){
    const f=fixture();h.ctx.AMBI=f.audio;
    h.run(`G.newGame('onroad','','interactive','keeper','${pack}');G.resolveOpeningChoice('opening_workshop','answer_call');G.continueOpening('opening_workshop');`);
    h.ctx.curEv=h.run('G.openingPending()');h.ctx.selected=h.ctx.curEv.choices.find(c=>c.id===method);
    assert(h.run('resolveChoice(selected).applied'));assert.equal(f.instances.length,1);
    const paid=h.run('JSON.stringify(S)');
    f.advance(500);assert.equal(h.run('resolveChoice(selected).applied'),false);
    assert.equal(h.run('JSON.stringify(S)'),paid);assert.equal(f.instances.length,1);
    assert(h.run('G.save();S=null;G.load()'));
    f.advance(500);assert.equal(h.run('resolveChoice(selected).applied'),false);assert.equal(f.instances.length,1);
    h.run(`G.continueOpening('opening_bus_repair')`);assert.equal(h.run('G.openingPending().id'),'opening_name_introduction');
    f.audio.event(h.run('G.openingPending()'));assert.equal(f.playing().length,0);
  }
  h.run(`G.newGame('onroad','','interactive');G.resolveOpeningChoice('opening_workshop','answer_call');G.continueOpening('opening_workshop');S.items['부품']=0;`);
  const f=fixture();h.ctx.AMBI=f.audio;h.ctx.curEv=h.run('G.openingPending()');h.ctx.selected=h.ctx.curEv.choices[0];
  assert.equal(h.run('resolveChoice(selected)'),undefined);assert.equal(f.instances.length,0,'failed requirement is silent');
});
test('retired missing event-level voices are not aliased to unrelated core recordings',()=>{
  const h=eventEngine(),ui=fs.readFileSync(path.join(root,'src/07-ui.js'),'utf8');
  let voices=0;
  Object.assign(h.ctx,{clearStoryAuto(){},VO:{stop(){},play(){voices++;}},BGM:{playSongOnce(){}},SND:{setDriving(){}},curEv:null,curStory:null});
  const start=ui.indexOf('  function showEvent(evd){'),end=ui.indexOf("    const sheet=$('#ev-sheet');",start);
  h.run(ui.slice(start,end)+'}\n');
  h.run(`G.newGame('onroad','검수','skip')`);
  for(const id of ['ai_vending','exp_glasshouse','ai_census','ai_gasstation','ai_manifest','seoul_gate']){
    const event=h.ctx.g.presentationEvent(id);assert(event,id);
    h.ctx.AMBI=fixture().audio;h.ctx.evd=event;h.run('showEvent(evd)');
  }
  assert.equal(voices,0);
  assert.equal(Object.keys(h.ctx.d.vo).length,15,'existing core recordings remain registered');
});
