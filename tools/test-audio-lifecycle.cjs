// Actual module owners, isolated timers/media/AudioContext; no user save.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(){
  const media=[],contexts=[],timers=new Map();let timer=0;
  class Param{constructor(value=0){this.value=value;}cancelScheduledValues(){}setValueAtTime(v){this.value=v;}linearRampToValueAtTime(v){this.value=v;}exponentialRampToValueAtTime(v){this.value=v;}}
  class Node{constructor(){this.gain=new Param(1);this.frequency=new Param();this.Q=new Param();this.connections=[];}
    connect(n){this.connections.push(n);}disconnect(){this.connections=[];}start(){}stop(){}}
  class Context{
    constructor(){this.sampleRate=1000;this.currentTime=0;this.state='running';this.destination={};contexts.push(this);}
    createGain(){return new Node();}createBiquadFilter(){return new Node();}createOscillator(){return new Node();}
    createBufferSource(){return new Node();}createMediaElementSource(){return new Node();}
    createBuffer(ch,n){return {getChannelData:()=>new Float32Array(n)};}
    resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}
  }
  class Audio{
    constructor(src){this.src=src;this.currentTime=0;this.paused=true;this.volume=1;media.push(this);}
    play(){this.paused=false;return new Promise((resolve,reject)=>{this.resolvePlay=resolve;this.rejectPlay=reject;});}
    pause(){this.paused=true;}playing(){this.onplaying?.();this.resolvePlay?.();}ended(){this.paused=true;this.onended?.();}
  }
  const store=new Map();
  const ctx=vm.createContext({Audio,window:{AudioContext:Context,addEventListener(){}},
    document:{getElementById:()=>null,addEventListener(){},querySelector:()=>null,hidden:false},
    $:()=>null,localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},
    D:{bgm:{title:'title',story:'story'},sfx:{sfx_drive_asphalt_loop:'road'},vo:{a:'voice-a',b:'voice-b'}},
    S:{driving:null},UI:{modalOpen:()=>false},location:{hostname:'127.0.0.1',search:'?caravan-live=1'},
    URLSearchParams,performance:{now:()=>1000},setTimeout:()=>0,clearTimeout(){},
    setInterval:fn=>{timers.set(++timer,fn);return timer;},clearInterval:id=>timers.delete(id)});
  vm.runInContext(fs.readFileSync('src/07e-ui-audio.js','utf8')+'\nglobalThis.audio={SND,BGM,AMBI,VO,suspendForLifecycle,resumeForLifecycle};',ctx);
  ctx.audio.SND.enable();
  return {...ctx,media,contexts,timers};
}
test('voice ducks both buses only after playback, and restores on end/error/stop',()=>{
  const f=fixture();f.audio.VO.play('a');const voice=f.media.find(a=>a.src==='voice-a');
  const music=f.audio.SND.route(f.media.find(a=>a.src==='title'));
  const ambient=f.audio.SND.route(new f.Audio('amb'),{bus:'ambience'});
  assert.equal(music.bus,'music');assert.equal(music.busGain.gain.value,1);
  voice.playing();assert(Math.abs(music.busGain.gain.value-Math.pow(10,-9/20))<1e-8);
  assert(Math.abs(ambient.busGain.gain.value-Math.pow(10,-6/20))<1e-8);
  assert.equal(f.audio.SND.route(voice).bus,'voice');
  voice.ended();assert.equal(music.busGain.gain.value,1);
  f.audio.VO.play('a');voice.playing();voice.onerror();assert.equal(music.busGain.gain.value,1);
  f.audio.VO.play('a');voice.playing();f.audio.VO.stop();assert.equal(music.busGain.gain.value,1);
});
test('voice channel mute releases duck and unmute restores it without restarting',()=>{
  const f=fixture();f.audio.VO.play('a');const voice=f.media.find(a=>a.src==='voice-a');voice.playing();
  const music=f.audio.SND.route(f.media.find(a=>a.src==='title'));
  f.audio.SND.setLevel('voice',0);assert.equal(music.busGain.gain.value,1);assert.equal(f.audio.SND.mediaVolume(voice),0);
  f.audio.SND.setLevel('voice',.5);assert(music.busGain.gain.value<1);assert.equal(f.audio.SND.mediaVolume(voice),.4);
});
test('late rejection from an interrupted utterance cannot clear the new voice duck',async()=>{
  const f=fixture();f.audio.VO.play('a');const voice=f.media.find(a=>a.src==='voice-a');const oldReject=voice.rejectPlay;
  f.audio.VO.play('a');voice.playing();oldReject(new Error('interrupted'));await Promise.resolve();
  const music=f.audio.SND.route(f.media.find(a=>a.src==='title'));
  assert(music.busGain.gain.value<1);assert.equal(voice.paused,false);
});
test('voice media nodes are reused, and hidden-page timers cannot start utterances',()=>{
  const f=fixture();for(let i=0;i<30;i++){f.audio.VO.play(i%2?'a':'b');f.audio.VO.stop();}
  assert.equal(f.media.filter(a=>a.src.startsWith('voice-')).length,2);
  f.audio.VO.suspend();f.audio.VO.play('a');assert(f.media.filter(a=>a.src.startsWith('voice-')).every(a=>a.paused));
  f.audio.VO.resume();assert(f.media.filter(a=>a.src.startsWith('voice-')).every(a=>a.paused));
});
test('mute stops fading BGM immediately and leaves no timer to revive it',()=>{
  const f=fixture();f.audio.BGM.tick('story');f.audio.BGM.setOn(false);
  assert(f.media.every(a=>a.paused));assert.equal(f.timers.size,0);
});
test('all groups share the master headroom; recorded road excludes synthetic motor rumble',()=>{
  const f=fixture();const music=f.audio.SND.route(f.media.find(a=>a.src==='title'));
  const voice=f.audio.SND.route(new f.Audio('voice'),{bus:'voice'});
  assert.equal(music.master,voice.master);assert(Math.abs(music.master.gain.value-Math.pow(10,-3/20))<1e-8);
  // Source contract verifies no fallback motor is mixed over recorded road.
  const source=fs.readFileSync('src/07e-ui-audio.js','utf8');assert(source.includes('on&&!suspended&&!hasRecorded'));
});
