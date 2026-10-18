const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../src/05e-road-continuity.js'),'utf8');
const manifest=require('../assets/ui/road-environment/atlas-v2.json');
const shared=require('../assets/ui/road-environment/connected-v1.json');
const registry={enabled:true,routes:[],connected:shared,atlas:manifest};
const road=vm.runInNewContext(source.replace('/*__ROAD_CONTINUITY__*/{enabled:false,routes:[]}',JSON.stringify(registry))
 .replace('return {active,draw,key,position,connector,ridges,connectedPosition,direction};',
 'return {active,draw,key,position,connector,ridges,connectedPosition,direction,routeFor};')+';ROAD_CONTINUITY',
 {Image:class{},document:{}});
test('global atlas covers the real graph, fixed city crops and corrected geography masters without history dependence',async()=>{
 const {runtimeAtlas}=await import('../tools/runtime-landscape-atlas.mjs');
 const current=runtimeAtlas(require('node:path').resolve(__dirname,'..'));
 assert.equal(JSON.stringify(current),JSON.stringify(manifest),'generated manifest must be current');
 assert.equal(manifest.routes.length,78);assert.equal(Object.keys(manifest.cities).length,58);
 for(const [id,crop] of Object.entries(manifest.cities)){
  const r=manifest.routes.find(r=>r.id===crop.route);assert(r,id);
  assert.equal(crop.x,r.from===id?0:1080);assert(r.from===id||r.to===id);
 }
 assert.equal(manifest.routes.filter(r=>r.origin==='landform-corrected-master').length,5);
 for(const r of manifest.routes)for(const reverse of [false,true]){
  const leg={from:reverse?r.to:r.from,to:reverse?r.from:r.to,dist:r.km,gone:0},route=road.routeFor(leg);
  let prev=null;
  for(let n=0;n<=20;n++){
   leg.gone=r.km*n/20;const saved=JSON.stringify(leg),view=road.position(leg,route,360);
   assert(view.sourceX>=0&&view.sourceX<=2944);assert.equal(view.unit,1024);
   if(prev!==null)assert(reverse?view.camera<prev:view.camera>prev);prev=view.camera;
   assert.equal(JSON.stringify(leg),saved);
  }
  const stopped={at:leg.to,lastJourneyRecap:{from:leg.from,to:leg.to}};
  assert.equal(road.direction(stopped),road.direction({driving:leg}));
  assert.equal(road.direction(JSON.parse(JSON.stringify(stopped))),road.direction(stopped));
 }
});
test('full-width atlas joining preserves both canonical endpoint banks and the central native texture',()=>{
 const plate=(width,ridge,rgb)=>{const p=new Uint8ClampedArray(width*576*4);
  for(let y=ridge;y<576;y++)for(let x=0;x<width;x++)p.set([...rgb,255],(y*width+x)*4);return p;};
 const a=plate(1024,240,[30,40,50]),b=plate(1024,300,[60,70,80]),raw=plate(2048,260,[42,52,62]);
 const before=Buffer.from(raw),joined=road.connector(a,b,raw,2048);
 assert.equal(joined.length,2048*576*4);
 for(let y=0;y<576;y++)for(let x=0;x<64;x++)for(let c=0;c<4;c++){
  assert.equal(joined[(y*2048+x)*4+c],a[(y*1024+960+x)*4+c]);
  assert.equal(joined[(y*2048+1984+x)*4+c],b[(y*1024+x)*4+c]);
 }
 for(let x=256;x<1792;x+=61){
  assert.deepEqual(Array.from(joined.slice((500*2048+x)*4,(500*2048+x)*4+4)),[42,52,62,255]);
  assert.equal(joined[(100*2048+x)*4+3],0);
 }
 assert.deepEqual(Buffer.from(raw),before);
});
test('the app embeds each full route, and offline drawing does not depend on a localhost connector request',()=>{
 const builder=fs.readFileSync(require.resolve('../tools/build-html.mjs'),'utf8');
 assert(builder.includes("source:dataUri(r.file,'image/webp')"));
 assert(source.includes("r.atlas?request('atlas:'+r.id,r.source)"));
 assert(source.includes('atlasPixels(art.image)'));assert(!source.includes('localStorage'));
});
