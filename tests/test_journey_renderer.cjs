/* Renderer integration: loaded/unloaded art, weather, expansions and previews. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
let loaded=true;const decoded=[];
const all=[];
function canvas(){
  let depth=0;
  const calls=[];
  const c=new Proxy({save(){depth++},restore(){assert(--depth>=0)},measureText:s=>({width:s.length*5}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},
  {get:(o,k)=>k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert(Number.isFinite(a),k+' has nonfinite geometry');calls.push([k,...args])}});
  const cv={width:0,height:0,clientWidth:360,clientHeight:332,getContext:()=>c,calls};all.push(cv);return cv;
}
const state={at:'yangsan',day:1,min:577,wx:'clear',flags:{},up:{},party:[],fatigue:0,pursuit:0,dog:false,driving:null};
const context=vm.createContext({console,Date,Math,Image:class{constructor(){this.complete=loaded;this.naturalWidth=900;this.naturalHeight=520;decoded.push(this)}},ResizeObserver:class{observe(){}},
  document:{createElement:()=>canvas()},window:{devicePixelRatio:2,matchMedia:()=>({matches:true})},S:state,
  G:{isNight:()=>state.min>=1200,regionOf:()=>0,remainKm:()=>400},UI:{modalOpen:()=>false},clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});
const read=n=>fs.readFileSync(path.join(__dirname,'../src',n),'utf8');
vm.runInContext(read('03-data.js'),context);
const manifest=require('../assets/ui/road-environment/manifest.json');
const environmentSource=read('05a-road-environment.js').replace('/*__ROAD_ENVIRONMENTS__*/{}',JSON.stringify(Object.fromEntries(Object.keys(manifest.locations).map(id=>[id,'terrain:'+id]))));
vm.runInContext(environmentSource,context);
const vehicleManifest=require('../assets/ui/vehicle-upgrades/manifest-v1.json');
const kitSource=read('05b-vehicle-kit.js').replace('/*__VEHICLE_KIT__*/{}',JSON.stringify(Object.fromEntries(Object.keys(vehicleManifest.images).map(id=>[id,'vehicle:'+id]))));
vm.runInContext(kitSource,context);
const sceneSource=read('05-scene.js').replace('function drawCelestial(hour,dark,wx){','function drawCelestial(hour,dark,wx){ globalThis.celestialPasses=(globalThis.celestialPasses||0)+1;');
vm.runInContext(sceneSource+'\nglobalThis.scene=SCENE;globalThis.data=D;',context);
const cv=canvas();context.scene.init(cv);
for(const wx of ['clear','rain','storm','fog','dust'])for(const expanded of [false,true]){
  state.wx=wx;state.up=expanded?Object.fromEntries(context.data.upgrades.map(u=>[u.id,true])):{};
  state.party=expanded?['minji','parkss']:[];state.dog=expanded;state.min=expanded?1270:577;
  for(const driving of [false,true]){
    state.driving=driving?{from:'yangsan',to:'miryang',dist:34,gone:10}:null;
    const before=JSON.stringify(state);context.scene.draw(.016);assert.equal(JSON.stringify(state),before,'drawing must not change progression');
    context.scene.drawSettlementVan(canvas(),state.up);
  }
}
assert(all.some(c=>c.calls.some(a=>a[0]==='drawImage'&&a[1]?.src?.includes('JOURNEY_DALGUJI_BASE'))),'detailed body actually participates in rendering');
for(const id of ['equipment','living','jumpseat'])assert(all.some(c=>c.calls.some(a=>a[0]==='drawImage'&&a[1]?.src==='vehicle:'+id)),'modular art actually drawn: '+id);
assert(all.some(c=>c.calls.some(a=>a[0]==='drawImage'&&a[1]?.src==='terrain:yangsan')),'place-specific background is drawn');
// Each part on every extension must remain finite, keep real riders/dog, and
// share the same renderer in a stationary preview and moving world.
for(const stage of context.data.vanStages)for(const u of context.data.upgrades){
  state.up={[stage.id]:true,[u.id]:true};state.party=Object.keys(context.data.comps);state.dog=true;
  state.driving={from:'gumi',to:'gimcheon',dist:26,gone:14};context.scene.showMeal(2);
  const before=JSON.stringify(state);context.scene.draw(.016);context.scene.drawSettlementVan(canvas(),state.up);
  assert.equal(JSON.stringify(state),before);
}
for(const stage of context.data.vanStages.filter(x=>x.up))assert(all.some(c=>c.calls.some(a=>a[0]==='drawImage'&&a[1]?.src==='vehicle:'+stage.id)),'extension art missing: '+stage.id);
// A single undecoded atlas/body uses the existing renderer, not a blank van.
for(const id of ['equipment','living','jumpseat']){
  const im=decoded.find(x=>x.src==='vehicle:'+id);im.complete=false;
  state.up={jumpseat:true,armor:true,solar:true};context.scene.draw(.016);context.scene.drawSettlementVan(canvas(),state.up);im.complete=true;
}
state.party=[];state.dog=false;state.up={};state.wx='clear';
for(const [id] of Object.entries(manifest.locations))for(const min of [360,720,1080,1320]){
  state.at=id;state.min=min;state.driving=null;context.celestialPasses=0;
  const before=JSON.stringify(state);context.scene.draw(.016);
  assert.equal(context.celestialPasses,1,id+' sky/celestial should be drawn once');
  assert.equal(JSON.stringify(state),before);
}
for(const [from,to,dist] of context.data.edges)for(const fraction of [0,.4,.5,.6,1]){
  state.driving={from,to,dist,gone:dist*fraction};context.celestialPasses=0;
  context.scene.draw(.016);assert.equal(context.celestialPasses,1,'transition duplicates the sun');
  const profile=context.scene.roadBackdropState();assert.equal(profile.from.id,from);assert.equal(profile.to.id,to);
  assert(profile.mix>=0&&profile.mix<=1);if(fraction===0)assert.equal(profile.mix,0);if(fraction===1)assert.equal(profile.mix,1);
}
// The authored sky/van path remains a working fallback before image decode.
loaded=false;const fallback=vm.createContext({...context,Image:class{constructor(){this.complete=false;this.naturalWidth=0}}});
vm.runInContext(read('03-data.js')+'\n'+environmentSource+'\n'+kitSource+'\n'+read('05-scene.js')+'\nglobalThis.fallbackScene=SCENE;',fallback);
fallback.fallbackScene.init(canvas());fallback.fallbackScene.draw(.016);
console.log(`PASS 20 weather/upgrade/travel combinations; 28 parts × 5 vehicle stages with riders/dog; ${Object.keys(manifest.locations).length} locations × 4 times; ${context.data.edges.length} routes × 5 transition points; previews, partial/full decode fallback, finite geometry and state preservation`);
