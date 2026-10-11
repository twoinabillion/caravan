const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {routes}=require('../tools/road-route-plan.cjs').catalogue();
let decoded=true;const canvases=[];
function canvas(){
 const calls=[],stack=[],ctx=new Proxy({
   save(){stack.push({globalCompositeOperation:this.globalCompositeOperation,imageSmoothingEnabled:this.imageSmoothingEnabled});},
   restore(){assert(stack.length);Object.assign(this,stack.pop());},
 },{get:(o,k)=>k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert(Number.isFinite(a),k);calls.push([k,...args]);}});
 const c={width:472,height:436,calls,getContext:()=>ctx,ctx};canvases.push(c);return c;
}
const registry={enabled:true,routes:routes.map(r=>({...r,source:'terrain:'+r.id}))};
const source=fs.readFileSync(require.resolve('../src/05d-route-panorama.js'),'utf8');
const env=vm.createContext({Image:class{constructor(){this.complete=decoded;this.naturalWidth=1024;this.naturalHeight=576;}},document:{createElement:canvas}});
vm.runInContext(source.replace('/*__ROAD_ROUTES__*/{enabled:false,routes:[]}',JSON.stringify(registry)).replace('return {key,position,stopped,paint,draw,active:','return {cache,key,position,stopped,paint,draw,active:')+';globalThis.renderer=ROUTE_PANORAMA',env);
const target=canvas();let draws=0;
function draw(leg,recap=null,at=null,hour=12,wx='clear',W=236,H=218){
 const frame={driving:leg,recap,at,W,H,scale:2,hour,wx,dark:hour===0?1:0},before=JSON.stringify(frame);
 assert.equal(env.renderer.draw(target.ctx,frame),true);assert.equal(JSON.stringify(frame),before);assert(env.renderer.cache.size<=8);draws++;
}
for(const route of routes)for(const reverse of [false,true])for(const hour of [0,6,12,18])for(const wx of ['clear','rain','storm','fog','dust'])for(const p of [0,.5,1]){
 const from=reverse?route.to:route.from,to=reverse?route.from:route.to;
 draw({from,to,dist:route.km,gone:route.km*p},null,null,hour,wx);
}
for(const r of routes)draw(null,{from:r.from,to:r.to},r.to,12,'clear',320,231);
const drawn=new Set(canvases.flatMap(c=>c.calls.filter(a=>a[0]==='drawImage'&&a[1]?.src).map(a=>a[1].src)));
for(const r of routes)assert(drawn.has('terrain:'+r.id));
assert(!target.calls.some(a=>a[0]==='rect'||a[0]==='clip'),'no vertical swap seam in new renderer');
draw(null,null,'busan');decoded=false;
const pending=routes.find(r=>!env.renderer.cache.has(r.id));
const leg={from:pending.from,to:pending.to,dist:pending.km,gone:pending.km*.5};
draw(leg);env.renderer.cache.get(pending.id).image.onerror();draw(leg);
assert([...env.renderer.cache.values()].some(e=>e.image.complete&&!e.failed),'last ready image is retained');
const disabled=vm.runInNewContext(source+';ROUTE_PANORAMA');assert.equal(disabled.draw(target.ctx,{}),false);
console.log(`PASS ${draws} continuous-terrain runtime draws: all routes, reverse, clock/weather, bounded decoding, failure retention, finite geometry, save-state immutability. Actual visual QA remains separate.`);
