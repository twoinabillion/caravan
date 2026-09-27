/* Real profile/renderer code against a recording canvas. This is NOT visual QA. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,'src',n),'utf8');
let now=100000,decoded=true,buffer;
const calls=[];
function canvas(){
  const stack=[];
  const ctx=new Proxy({globalAlpha:1,filter:'none',imageSmoothingEnabled:false,
    save(){stack.push({globalAlpha:this.globalAlpha,filter:this.filter,imageSmoothingEnabled:this.imageSmoothingEnabled});},
    restore(){assert(stack.length,'balanced canvas saves');Object.assign(this,stack.pop());},
    createLinearGradient(){return {addColorStop(){}}},createRadialGradient(){calls.push(['glow']);return {addColorStop(){}}}
  },{get:(o,k)=>k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert(Number.isFinite(a),k+' finite geometry');calls.push([k,...args,{filter:o.filter}]);}});
  return {width:0,height:0,clientWidth:360,clientHeight:254,getContext:()=>ctx};
}
const S={up:{},driving:null},G={};
const context=vm.createContext({console,Math,Date:{now:()=>now},S,G,
  Image:class{constructor(){this.complete=decoded;this.naturalWidth=decoded?512:0;this.naturalHeight=265;}},
  ResizeObserver:class{observe(){}},document:{createElement:()=>buffer=canvas()},window:{devicePixelRatio:2},
  clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});
vm.runInContext(read('03-data.js')+';globalThis.data=D;',context);
const director=read('04d-engine-director.js');
vm.runInContext(director.slice(director.indexOf('  const ROAD_APPROACH_LABELS'),director.indexOf('  /* UI.roadApproach 구현')),context);
const instrumented=read('05-scene.js').replace('return {init,initTitle,draw,drawTitle,',
  'globalThis.cue={roadApproachScene,approachSpriteKey,approachCueLayout,detailedCueActors,vanBuildStage,approachSpriteCache};return {init,initTitle,draw,drawTitle,');
vm.runInContext(instrumented+';globalThis.scene=SCENE;',context);context.scene.init(canvas());
const ids=['ev_truck_cafe','meet_family','ev_fake_checkpoint'];
const keys=['coffee-van','broken-vehicle','temporary-checkpoint'];
for(let i=0;i<ids.length;i++){
  const ev=context.data.events.find(e=>e.id===ids[i]),profile=G.roadApproachProfile(ev);
  assert.equal(profile.scene.motif,keys[i]);assert.equal(context.cue.approachSpriteKey(profile.kind,profile.scene.motif),keys[i]);
  assert.equal(profile.scene.people,[1,3,2][i]);
  const layout=context.cue.approachCueLayout[keys[i]];
  for(const up of [{},Object.fromEntries(context.data.upgrades.map(u=>[u.id,true]))]){
    S.up=up;S.driving={from:'gumi',to:'gimcheon',dist:26,gone:14.43,approach:{...profile,startedAt:100000}};
    const before=JSON.stringify(S),dimensions=[],positions=[];
    for(const elapsed of [0,300,900,1800,2268,2700]){
      now=100000+elapsed;calls.length=0;context.cue.roadApproachScene(100,0);
      const draw=calls.find(c=>c[0]==='drawImage'&&c[1]?.src?.includes('cue-'+keys[i]));
      assert(draw,ids[i]+' actually draws its own part');
      const [x,y,w,h]=draw.slice(2,6);dimensions.push([w,h]);positions.push(x);
      assert(Math.abs(w/h-layout.aspect)<1e-8,'preserve non-square asset aspect');
      if(i<2){const ratio=w/(context.cue.vanBuildStage(up).bodyL+27);assert(ratio>=.45&&ratio<=.55,'cue/caravan scale contract');}
      assert.equal(JSON.stringify(S),before,'drawing must not mutate save');
    }
    assert(dimensions.every(d=>d[0]===dimensions[0][0]&&d[1]===dimensions[0][1]),'no approach scale jump');
    assert(positions.every((x,j)=>j===0||x<=positions[j-1]),'continuous approach toward stop');
    assert.equal(positions.at(-1),positions.at(-2),'cue is settled before handoff');
    const [w,h]=dimensions[0],actors=context.cue.detailedCueActors(keys[i],profile.scene,w,h);
    assert.equal(actors.length,profile.scene.people);
    assert.equal(actors.filter(a=>a.child).length,i===1?2:0);
    if(i<2)for(const actor of actors.filter(a=>!a.child))assert.equal(actor.height,h*.4,'adult half of 80%-height vehicle body');
    if(i===1)assert(actors.filter(a=>a.child).every(a=>a.y<0),'children belong in cargo bed, not in traffic');
    if(i===2)assert(actors.every(a=>a.vest),'authored reflective vests');
    calls.length=0;context.cue.roadApproachScene(100,1);
    const darkDraw=calls.find(c=>c[0]==='drawImage'&&c[1]?.src?.includes('cue-'+keys[i]));
    assert.equal(darkDraw.at(-1).filter,'brightness(0.52)','night light matches caravan');
    assert.equal(calls.some(c=>c[0]==='glow'),i!==1,'practical light only in occupied coffee/checkpoint');
    const saved=JSON.stringify(S);Object.assign(S,JSON.parse(saved));calls.length=0;context.cue.roadApproachScene(100,1);
    assert.equal(JSON.stringify(S),saved,'restored approach stays read-only');
  }
  // Reject fabricated people and preserve an explicit empty cue.
  assert.equal(context.cue.detailedCueActors(keys[i],{people:0},46,24).length,0);
  assert.equal(context.cue.detailedCueActors(keys[i],{people:-1},46,24).length,0);
  assert.equal(context.cue.detailedCueActors(keys[i],{people:100},46,24).length,3);
  decoded=false;delete context.cue.approachSpriteCache[keys[i]];calls.length=0;
  context.cue.roadApproachScene(100,1);
  assert(!calls.some(c=>c[0]==='drawImage'),'undecoded image is never drawn');
  assert(calls.some(c=>c[0]==='fillRect'),'native fallback is visible');decoded=true;
}
assert.equal(context.cue.approachSpriteKey('checkpoint',''),'checkpoint','automatic checkpoints retain original identity');
assert.equal(context.cue.approachSpriteKey('bridge','rail-crossing'),'checkpoint','rail crossing is not a fake roadblock');
S.driving.approach.scene.selfVehicle=true;calls.length=0;context.cue.roadApproachScene(100,0);
assert.equal(calls.length,0,'own vehicle crisis does not spawn another truck');
S.driving=null;calls.length=0;context.cue.roadApproachScene(100,0);assert.equal(calls.length,0,'no stale cue after event/arrival');
console.log('PASS 3 authored encounters; 36 approach frames; normal/expanded caravan; aspect, scale, actors, day/night, decode fallback, save round-trip and cleanup');
