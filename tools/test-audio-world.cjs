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
  const sandbox={Audio,URLSearchParams,Set,Math,performance:{now:()=>now},
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
  assert.equal(f.instances.length,0);
  f.location.search='?caravan-live=1';f.location.hostname='game.example';f.audio.action('meal');
  assert.equal(f.instances.length,0);
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
