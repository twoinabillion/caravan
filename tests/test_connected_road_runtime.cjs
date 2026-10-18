const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createHash}=require('node:crypto');
const source=fs.readFileSync(require.resolve('../src/05e-road-continuity.js'),'utf8');
const manifest=require('../assets/ui/road-environment/connected-v1.json');
const routes=[{id:'busan--yangsan',from:'busan',to:'yangsan',km:20},{id:'miryang--yangsan',from:'yangsan',to:'miryang',km:34},
 {id:'ulsan--yangsan',from:'yangsan',to:'ulsan',km:22}].map(r=>({...r,source:'bridge:'+r.id}));
function runtime(decoded=true){
 const canvases=[],requests=[];
 function canvas(){
  const calls=[],c={width:0,height:0,calls};
  const cx=new Proxy({getImageData:(x,y,w,h)=>{const data=new Uint8ClampedArray(w*h*4);for(let i=3;i<data.length;i+=4)data[i]=i%16===3?0:i%16===7?100:249;return {data};},
   createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},
   {get:(o,k)=>k in o?o[k]:(...a)=>{for(const n of a)if(typeof n==='number')assert(Number.isFinite(n));calls.push([k,...a]);}});
  c.getContext=()=>cx;canvases.push(c);return c;
 }
 const registry={enabled:true,routes,connected:{...manifest,source:'shared:terrain'}};
 const ctx={Image:class{constructor(){this.complete=decoded;this.naturalWidth=2160;this.naturalHeight=720;}set src(v){this._src=v;requests.push(this);}get src(){return this._src;}},
  document:{createElement:canvas},ROAD_ENVIRONMENT:{source:id=>'city:'+id},location:{protocol:'file:'}};
 const text=source.replace('/*__ROAD_CONTINUITY__*/{enabled:false,routes:[]}',JSON.stringify(registry))
  .replace('return {active,draw,key,position,connector,ridges,connectedPosition,direction};','return {active,draw,key,position,connector,ridges,connectedPosition,direction,requestCity,cityTerrain,presentationPosition};');
 return {r:vm.runInNewContext(text+';ROAD_CONTINUITY',ctx),canvases,requests,target:canvas().getContext('2d')};
}
const frame=(driving,at)=>({driving,at,W:360,H:344,scale:2,hour:12,dark:0,wx:'clear'});
test('shared distance crop survives arrival, stop, next departure, reverse and JSON reload',()=>{
 const {r}=runtime();
 for(const W of [236,320,360,480]){
  const expected=r.connectedPosition({...frame(null,'yangsan'),W});assert.equal(expected.sourceX,540);
  for(const leg of [{from:'busan',to:'yangsan',dist:20,gone:20},{from:'yangsan',to:'miryang',dist:34,gone:0},
   {from:'miryang',to:'yangsan',dist:34,gone:34},{from:'yangsan',to:'busan',dist:20,gone:0}]){
   const f={...frame(leg),W},before=JSON.stringify(f);
   assert.deepEqual(r.connectedPosition(f),expected);assert.deepEqual(r.connectedPosition(JSON.parse(before)),expected);
   assert.equal(JSON.stringify(f),before);
  }
 }
 assert.equal(r.connectedPosition(frame({from:'busan',to:'miryang',dist:54,gone:20})),null);
 assert.equal(r.connectedPosition(frame(null,'ulsan')),null);
});
test('every position is monotonic, unmirrored, bounded and unaffected by modal/approach/clock metadata',()=>{
 const {r}=runtime();
 for(const [from,to,dist] of manifest.routes)for(let i=0;i<=100;i++){
  const p=i/100,leg={from,to,dist,gone:dist*p},f=frame(leg);
  const a=r.connectedPosition(f),b=r.connectedPosition(frame({from:to,to:from,dist,gone:dist*(1-p)}));
  assert(Math.abs(a.sourceX-b.sourceX)<1e-9);assert(a.sourceX>=0&&a.sourceX+1080<=2160);
  assert.deepEqual(a,r.connectedPosition({...f,hour:23,wx:'storm',driving:{...leg,approach:{startedAt:999,duration:2700}}}));
 }
});
test('decode is preloaded once and shared source never flashes a legacy city; normalization runs once',()=>{
 const rt=runtime(false);assert.equal(rt.requests.length,1);
 const f=frame({from:'busan',to:'yangsan',dist:20,gone:13});const before=JSON.stringify(f);
 rt.r.draw(rt.target,f);assert.equal(rt.requests.length,1);assert.equal(rt.canvases.length,1);
 rt.requests[0].complete=true;rt.r.draw(rt.target,f);rt.r.draw(rt.target,f);
 assert.equal(JSON.stringify(f),before);assert.equal(rt.requests.length,1);
 const normalized=rt.canvases.filter(c=>c.width===2160&&c.height===720);assert.equal(normalized.length,1);
 const bytes=normalized[0].calls.find(c=>c[0]==='putImageData')[1].data;
 assert.equal(bytes[3],0);assert.equal(bytes[7],100);assert.equal(bytes[11],255);assert.equal(bytes[15],255);
});
test('all adjoining corridors use the same three city crops with uniform scale, not old city files',()=>{
 const rt=runtime();
 for(const id of Object.keys(manifest.nodes)){
  const city=rt.r.requestCity(id),crop=rt.r.cityTerrain(city);assert.equal(crop.width,1024);assert.equal(crop.height,576);
  const draw=crop.calls.find(c=>c[0]==='drawImage'),scale=1024/1080;
  assert.equal(draw[2],-manifest.nodes[id]*scale);assert.equal(draw[3],576-720*scale);
  assert(Math.abs(draw[4]/draw[5]-3)<1e-12);assert.equal(rt.r.requestCity(id),city);
 }
 assert.equal(rt.requests.length,1);rt.r.requestCity('ulsan');assert.equal(rt.requests.at(-1).src,'city:ulsan');
});
test('weather/clock tint stays on terrain and the embedded source is hash pinned for offline/reload',()=>{
 const rt=runtime();
 for(const wx of ['clear','rain','storm','fog','dust'])for(const hour of [0,6,12,18])rt.r.draw(rt.target,{...frame(null,'yangsan'),wx,hour,dark:hour===0?1:0});
 for(const c of rt.canvases)for(const draw of c.calls.filter(x=>x[0]==='drawImage'&&x.length===10))assert(draw[4]>0&&draw[5]>0);
 const file=fs.readFileSync(require.resolve('../'+manifest.file));assert.equal(createHash('sha256').update(file).digest('hex'),manifest.sha256);
 const builder=fs.readFileSync(require.resolve('../tools/build-html.mjs'),'utf8');assert(builder.includes("source:dataUri(connected.file,'image/webp')"));
 assert(!source.includes('scale(-1'));assert(!source.includes('localStorage'));
});
test('failed shared decoding falls back to the existing city owner instead of permanently blank terrain',()=>{
 const rt=runtime(false);rt.requests[0].onerror();
 const city=rt.r.requestCity('yangsan');assert.equal(city.image.src,'city:yangsan');
 city.image.complete=true;assert.equal(rt.r.draw(rt.target,frame(null,'yangsan')),true);
});
test('camera settles continuously at the paid event distance, then resumes without reversing or changing the save',()=>{
 const {r}=runtime(),f={...frame({from:'busan',to:'yangsan',dist:20,gone:0}),dt:1/60};
 let previous=0,lastStep=0;
 for(let i=0;i<120;i++){
  f.driving.gone=i/60*1.6;const target=r.connectedPosition(f),view=r.presentationPosition(target,f);
  assert(view.sourceX>=previous);assert(view.sourceX<=target.sourceX);lastStep=view.sourceX-previous;previous=view.sourceX;
 }
 f.driving.approach={startedAt:1,duration:2700};const saved=JSON.stringify(f);
 for(let i=0;i<180;i++){
  const view=r.presentationPosition(r.connectedPosition(f),f),step=view.sourceX-previous;
  assert(step>=0&&step<=Math.max(lastStep+1e-8,.001),JSON.stringify({i,step,lastStep,previous,x:view.sourceX}));lastStep=step;previous=view.sourceX;
 }
 assert.equal(previous,r.connectedPosition(f).sourceX);assert.equal(JSON.stringify(f),saved);
 delete f.driving.approach;f.driving.gone+=.05;
 const resumed=r.presentationPosition(r.connectedPosition(f),f);assert(resumed.sourceX>=previous);
 const cold=runtime().r;assert.equal(cold.presentationPosition(cold.connectedPosition(f),f).sourceX,cold.connectedPosition(f).sourceX);
});
test('real engine departure, modal pause, save/load and arrival preserve connected scenery and the next leg',()=>{
 const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
 const storage=new Map(),noop=()=>{};let paused=false;
 const ctx=vm.createContext({console,URLSearchParams,location:{search:''},setTimeout:()=>0,clearTimeout:noop,
  document:{readyState:'loading',addEventListener:noop,documentElement:{dataset:{}}},
  window:{dispatchEvent:noop},CustomEvent:function(){},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  UI:new Proxy({modalOpen:()=>paused,onArrive:()=>1},{get:(o,k)=>o[k]||noop}),
  SND:new Proxy({},{get:()=>noop}),AMBI:{restore:noop}});
 for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 for(const file of fs.readdirSync('src').filter(f=>/^04[a-h]-/.test(f)).sort())vm.runInContext(fs.readFileSync('src/'+file,'utf8'),ctx);
 vm.runInContext('globalThis.g=G;Object.defineProperty(globalThis,"s",{get:()=>S});',ctx);
 ctx.g.newGame('onroad','풍경 검수','story');
 const {r}=runtime(),position=()=>r.connectedPosition(frame(ctx.s.driving,ctx.s.at)).sourceX;
 assert.equal(position(),0);assert(ctx.g.canTravelTo('yangsan').ok);ctx.g.startTravel('yangsan');
 assert.equal(position(),0);ctx.g.tick(.1);assert(position()>0);
 paused=true;const stopped=position(),resources=JSON.stringify([ctx.s.min,ctx.s.fuel,ctx.s.water,ctx.s.food,ctx.s.scrap,ctx.s.van]);
 ctx.g.tick(1);assert.equal(position(),stopped);
 ctx.g.save();assert.equal(ctx.g.load(),true);assert.equal(position(),stopped);
 assert.equal(JSON.stringify([ctx.s.min,ctx.s.fuel,ctx.s.water,ctx.s.food,ctx.s.scrap,ctx.s.van]),resources);
 paused=false;ctx.g.tick(.1);assert(position()>stopped);
 // Prepared arrival fixture, not a claim of traversing every event in this leg.
 ctx.s.driving.gone=ctx.s.driving.dist;assert.equal(position(),540);
 ctx.g.arrive();assert.equal(ctx.s.at,'yangsan');assert.equal(position(),540);
 ctx.g.save();assert.equal(ctx.g.load(),true);assert.equal(position(),540);
 assert(ctx.g.canTravelTo('miryang').ok);ctx.g.startTravel('miryang');assert.equal(position(),540);
 ctx.g.tick(.1);assert(position()>540);
});
