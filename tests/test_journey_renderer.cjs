/* Renderer integration: loaded/unloaded art, weather, expansions and previews. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
let loaded=true;
const all=[];
function canvas(){
  let depth=0;
  const calls=[];
  const c=new Proxy({save(){depth++},restore(){assert(--depth>=0)},measureText:s=>({width:s.length*5}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},
  {get:(o,k)=>k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert(Number.isFinite(a),k+' has nonfinite geometry');calls.push([k,...args])}});
  const cv={width:0,height:0,clientWidth:360,clientHeight:332,getContext:()=>c,calls};all.push(cv);return cv;
}
const state={at:'yangsan',day:1,min:577,wx:'clear',flags:{},up:{},party:[],fatigue:0,pursuit:0,dog:false,driving:null};
const context=vm.createContext({console,Date,Math,Image:class{constructor(){this.complete=loaded;this.naturalWidth=900;this.naturalHeight=520}},ResizeObserver:class{observe(){}},
  document:{createElement:()=>canvas()},window:{devicePixelRatio:2,matchMedia:()=>({matches:true})},S:state,
  G:{isNight:()=>state.min>=1200,regionOf:()=>0,remainKm:()=>400},UI:{modalOpen:()=>false},clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});
const read=n=>fs.readFileSync(path.join(__dirname,'../src',n),'utf8');
vm.runInContext(read('03-data.js'),context);
vm.runInContext(read('05-scene.js')+'\nglobalThis.scene=SCENE;globalThis.data=D;',context);
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
assert(all.some(c=>c.calls.some(a=>a[0]==='drawImage'&&a[1]?.src?.includes('JOURNEY_ROAD_BACKDROP'))),'place-specific background is drawn');
// The authored sky/van path remains a working fallback before image decode.
loaded=false;const fallback=vm.createContext({...context,Image:class{constructor(){this.complete=false;this.naturalWidth=0}}});
vm.runInContext(read('03-data.js')+'\n'+read('05-scene.js')+'\nglobalThis.fallbackScene=SCENE;',fallback);
fallback.fallbackScene.init(canvas());fallback.fallbackScene.draw(.016);
console.log('PASS 20 loaded-art weather/upgrade/travel combinations, upgrade previews, image-loading fallback, finite geometry and unchanged game state');
