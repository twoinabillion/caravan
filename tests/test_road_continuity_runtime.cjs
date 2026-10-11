const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),test=require('node:test');
const {routes}=require('../tools/road-route-plan.cjs').catalogue();
const source=fs.readFileSync(require.resolve('../src/05e-road-continuity.js'),'utf8');
const registry={enabled:true,routes:routes.map(r=>({...r,source:'assets/'+r.id+'.webp'}))};
const pure=vm.runInNewContext(source+';ROAD_CONTINUITY');
function plate(ridge,rgb){
 const d=new Uint8ClampedArray(1024*576*4);
 for(let y=ridge;y<576;y++)for(let x=0;x<1024;x++){const i=(y*1024+x)*4;d.set([...rgb,249],i);}
 return d;
}
test('all 78 graph edges / 156 directions share immutable canonical endpoints and distance',()=>{
 assert.equal(routes.length,78);
 for(const r of routes)for(const reverse of [false,true]){
  let previous=null;
  for(let n=0;n<=20;n++){
   const leg={from:reverse?r.to:r.from,to:reverse?r.from:r.to,dist:r.km,gone:r.km*n/20};
   const before=JSON.stringify(leg),p=pure.position(leg,r,360);
   assert.equal(JSON.stringify(leg),before);assert.equal(p.reverse,reverse);
   if(previous!==null)assert(reverse?p.camera<previous:p.camera>previous);
   previous=p.camera;
   if(n===0)assert.equal(p.camera,reverse?675:0);
   if(n===20)assert.equal(p.camera,reverse?0:675);
  }
 }
 assert.equal(pure.position({from:'bogus',to:'city',dist:10,gone:2},routes[0],360),null);
});
test('protected 64px banks preserve source RGBA; native center retains original texture y',()=>{
 const a=plate(220,[44,62,71]),b=plate(310,[75,63,52]),raw=plate(270,[30,44,60]);
 const before=[a,b,raw].map(x=>Buffer.from(x));
 const joined=pure.connector(a,b,raw);
 for(let y=0;y<576;y++)for(let x=0;x<64;x++)for(let ch=0;ch<4;ch++){
  assert.equal(joined[(y*1024+x)*4+ch],a[(y*1024+960+x)*4+ch]);
  assert.equal(joined[(y*1024+960+x)*4+ch],b[(y*1024+x)*4+ch]);
 }
 for(let ch=0;ch<3;ch++)assert.equal(joined[(550*1024+512)*4+ch],raw[(550*1024+512)*4+ch]);
 assert.equal(joined[(270*1024+512)*4+3],255);
 assert.equal(joined[(100*1024+512)*4+3],0);
 for(let i=0;i<3;i++)assert.deepEqual(Buffer.from([a,b,raw][i]),before[i]);
});
test('offline/error join has no midpoint palette switch, no transparent ground or vertical texture warp',()=>{
 const joined=pure.connector(plate(220,[20,40,60]),plate(310,[80,90,100]),null);
 for(let x=64;x<960;x++)for(let y=480;y<576;y++)assert.equal(joined[(y*1024+x)*4+3],255);
 for(let x=500;x<525;x++)for(let ch=0;ch<3;ch++)assert(Math.abs(joined[(530*1024+x)*4+ch]-joined[(530*1024+x-1)*4+ch])<=5);
 assert(!source.includes('scale(-1'),'city orientation must never be mirrored');
 assert(!source.includes('frame.state.mix'),'no legacy midpoint wipe');
});
function runtime(workerSupport=false){
 const seen=[],worldCanvases=[],targetCalls=[];let now=0,decodeCities=true,decodeArt=false;
 const fill=plate(270,[30,45,60]);
 function canvas(){
  const c={width:0,height:0},calls=[];
  const cx=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
   getImageData:(x,y,w,h)=>({data:w===1024?fill.slice():new Uint8ClampedArray(w*h*4)}),
  },{get:(o,k)=>k in o?o[k]:(...a)=>{for(const n of a)if(typeof n==='number')assert(Number.isFinite(n));calls.push([k,...a]);}});
  c.calls=calls;c.getContext=()=>cx;worldCanvases.push(c);return c;
 }
 const workers=[];
 const ctx={Image:class{
  constructor(){this.naturalWidth=1024;this.width=1024;}
  set src(value){this._src=value;this.complete=value.startsWith('city:')?decodeCities:decodeArt;seen.push(this);}
  get src(){return this._src;}
 },document:{createElement:canvas},location:{protocol:'http:',hostname:'127.0.0.1'},Date:{now:()=>now},
 ROAD_ENVIRONMENT:{source:id=>'city:'+id}};
 if(workerSupport){
  let program;
  ctx.Blob=class{constructor(parts){program=parts.join('');}};
  ctx.URL={createObjectURL:()=> 'blob:qa',revokeObjectURL(){}};
  ctx.Worker=class{constructor(){this.program=program;workers.push(this);}postMessage(data){this.pending=data;}terminate(){this.terminated=true;}
   finish(){const owner=this;const self={postMessage:data=>owner.onmessage({data})};vm.runInNewContext(this.program,{self});self.onmessage({data:this.pending});}
  };
 }
 const exposed=source.replace('/*__ROAD_CONTINUITY__*/{enabled:false,routes:[]}',JSON.stringify(registry))
  .replace('return {active,draw,key,position,connector,ridges};','return {active,draw,key,position,connector,ridges,images,worlds};');
 const r=vm.runInNewContext(exposed+';ROAD_CONTINUITY',ctx);
 const target=new Proxy({}, {get:(o,k)=>(...a)=>targetCalls.push([k,...a])});
 return {r,seen,worldCanvases,targetCalls,workers,
  draw(leg,at=null){const frame={driving:leg,at,W:360,H:344,scale:2,hour:17.3,dark:.1,wx:'clear'};
   const before=JSON.stringify(frame),result=r.draw(target,frame);assert.equal(JSON.stringify(frame),before);return result;},
  time(value){now=value;},decoded(value){decodeArt=value;},cities(value){decodeCities=value;}};
}
test('HTTP connector decode is awaited; error/timeout fallback is latched without a later terrain pop',()=>{
 const rt=runtime(),r=routes[0],leg={from:r.from,to:r.to,dist:r.km,gone:0};
 assert(rt.draw(leg));assert.equal(rt.r.worlds.size,0,'ready cities must not suppress a loading HD connector');
 const art=rt.seen.find(i=>i.src.startsWith('assets/'));art.complete=true;
 assert(rt.draw(leg));assert.equal(rt.r.worlds.size,1);
 const held=rt.r.worlds.get(r.id);assert(rt.draw({...leg,gone:r.km*.5}));assert.equal(rt.r.worlds.get(r.id),held);
 const failure=runtime();failure.draw(leg);failure.seen.find(i=>i.src.startsWith('assets/')).onerror();failure.draw(leg);
 const fallback=failure.r.worlds.get(r.id);assert(fallback);failure.seen.find(i=>i.src.startsWith('assets/')).complete=true;
 failure.draw(leg);assert.equal(failure.r.worlds.get(r.id),fallback);
 const timeout=runtime();timeout.draw(leg);timeout.time(4001);timeout.draw(leg);assert.equal(timeout.r.worlds.size,1);
});
test('worker performs pixel composition off the draw path; ready source is installed exactly once',()=>{
 const rt=runtime(true);rt.decoded(true);const r=routes[0],leg={from:r.from,to:r.to,dist:r.km,gone:0};
 assert(rt.draw(leg));assert.equal(rt.r.worlds.size,0);assert.equal(rt.workers.length,1);
 assert(rt.draw(leg));assert.equal(rt.workers.length,1);
 rt.workers[0].finish();assert(rt.draw(leg));assert.equal(rt.r.worlds.size,1);
 const world=rt.worldCanvases.find(c=>c.width===2944);
 assert.equal(world.calls.filter(c=>c[0]==='clearRect').length,2,'protected overlaps replace, never double the ridge alpha');
 const held=rt.r.worlds.get(r.id);rt.draw({...leg,gone:r.km*.8});assert.equal(rt.r.worlds.get(r.id),held);
 const failure=runtime(true);failure.decoded(true);failure.draw(leg);failure.workers[0].onerror();
 assert(failure.workers[0].terminated);assert(failure.draw(leg));assert.equal(failure.r.worlds.size,1);
});
test('cache is bounded across all routes/stops; missing cities are not drawn from an unrelated prior route',()=>{
 const rt=runtime();rt.decoded(true);
 for(const r of routes){
  const leg={from:r.from,to:r.to,dist:r.km,gone:r.km*.5};
  assert(rt.draw(leg));assert(rt.r.images.size<=8);assert(rt.r.worlds.size<=2);
  assert(rt.draw(null,r.to));assert(rt.r.images.size<=8);
 }
 rt.cities(false);rt.decoded(false);
 const other={id:'missing-a--missing-b',from:'missing-a',to:'missing-b',km:10};
 // Test source registry supplies only real routes: invalid entries return to
 // the existing safe owner, never reuse the previous world's geography.
 assert.equal(rt.draw({from:other.from,to:other.to,dist:10,gone:5}),false);
 for(const call of rt.targetCalls.filter(x=>x[0]==='drawImage'))assert.equal(call.length,10,'explicit 2x canvas source/destination geometry');
});
test('game builder wires all graph routes, preserves raw acceptance and the 80MB limit',()=>{
 const build=fs.readFileSync(require.resolve('../tools/build-html.mjs'),'utf8');
 assert(build.includes("'src/05e-road-continuity.js'"));assert(build.includes('enabled:true,routes:continuityRoutes'));
 assert(build.includes('const MAX_BYTES = 80_000_000'));
 const hd=require('../assets/ui/road-connectors/manifest-hd.json');assert.equal(hd.enabled,false);
 for(const r of routes){const candidate=hd.routes.find(c=>c.id===r.id);assert(candidate?.nativeCandidate);assert.equal(candidate.nativeCandidate.acceptance.geometry,false);}
 assert(fs.readFileSync(require.resolve('../src/05a-road-environment.js'),'utf8').includes('ROAD_CONTINUITY.draw(target,frame)'));
 assert.equal(pure.draw(null,{}),false,'unbuilt source remains gated');
});
