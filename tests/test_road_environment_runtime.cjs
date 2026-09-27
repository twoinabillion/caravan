const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const manifest=require('../assets/ui/road-environment/manifest.json');
const ids=Object.keys(manifest.locations),images=[],canvases=[];
let decoded=true;
function canvas(){
  const calls=[],stack=[];
  const c=new Proxy({
    save(){stack.push({globalCompositeOperation:this.globalCompositeOperation,imageSmoothingEnabled:this.imageSmoothingEnabled});},
    restore(){assert(stack.length);Object.assign(this,stack.pop());},
    createLinearGradient(...args){calls.push(['gradient',...args]);return {addColorStop(){}};}
  },{get:(o,k)=>k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert(Number.isFinite(a),k);calls.push([k,...args]);}});
  const cv={width:472,height:436,calls,context:c,getContext:()=>c};canvases.push(cv);return cv;
}
const env=vm.createContext({console,Image:class{constructor(){this.complete=decoded;this.naturalWidth=1024;this.naturalHeight=576;images.push(this)}},document:{createElement:canvas}});
const registry=Object.fromEntries(ids.map(id=>[id,'terrain:'+id]));
const src=fs.readFileSync(require.resolve('../src/05a-road-environment.js'),'utf8').replace('/*__ROAD_ENVIRONMENTS__*/{}',JSON.stringify(registry));
vm.runInContext(src.replace('return {draw};','return {draw,cache,prepare};')+';globalThis.renderer=ROAD_ENVIRONMENT;',env);
const target=canvas(),sky=canvas();
function draw(from,to,mix,hour=12,wx='clear'){
  const state={from:{id:from},to:{id:to},mix};const before=JSON.stringify(state);
  env.renderer.draw(target.context,sky,{state,W:236,H:218,scale:2,worldX:420,dark:hour===0?1:0,hour,wx,edges:[[from,to,52,'high']]});
  assert.equal(JSON.stringify(state),before);
  assert(env.renderer.cache.size<=8,'decode cache stays bounded');
}
for(let i=0;i<ids.length;i++)for(const wx of ['clear','rain','storm','fog','dust'])for(const hour of [0,6,12,18]){
  draw(ids[i],ids[(i+1)%ids.length],0,hour,wx);
  draw(ids[i],ids[(i+1)%ids.length],.5,hour,wx);
  draw(ids[i],ids[(i+1)%ids.length],1,hour,wx);
}
const drawn=new Set(canvases.flatMap(c=>c.calls.filter(a=>a[0]==='drawImage'&&a[1]?.src).map(a=>a[1].src)));
for(const id of ids)assert(drawn.has('terrain:'+id),id+' did not render');
assert(canvases.some(c=>c.calls.some(a=>a[0]==='drawImage'&&a[1]===sky)),'transition reuses the same already-rendered sky');
assert(canvases.some(c=>c.calls.some(a=>a[0]==='gradient')),'transition has a spatial feather, not a full-screen alpha');
// Explicit decode/error delay: retain known good terrain rather than old shapes.
draw('busan','busan',0);decoded=false;
const key=ids.find(id=>!env.renderer.cache.has(id));draw(key,key,0);
const failed=env.renderer.cache.get(key);failed.image.onerror();draw(key,key,0);
assert(env.renderer.cache.get('busan'),'last detailed landscape remains available during decode failure');
console.log('PASS 3480 location/time/weather/transition draws; full coverage, bounded cache, decode failure, finite geometry and state preservation');
