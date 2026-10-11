/* Native-HD distance-owned scenery. Cities are immutable shared owners.
   Integration was requested by Sang; raw art acceptance remains separate.
   Hosted connectors load lazily; single-file/offline uses deterministic terrain
   from the same city pixels. Neither path changes saves or the braking clock. */
const ROAD_CONTINUITY=(()=>{
 const registry=/*__ROAD_CONTINUITY__*/{enabled:false,routes:[]};
 const SIZE=1024,HEIGHT=576,EDGE=64,JOIN=192,WORLD=2944;
 const images=new Map(),worlds=new Map(),jobs=new Map();
 let stamp=0,jobSequence=0,last=null,layer,layerCtx,worker,workerUnavailable=false;
 const key=(a,b)=>[a,b].sort().join('--');
 const clamp=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
 const smooth=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
 const active=()=>registry.enabled===true;
 function materialGrain(x,y){
  const gx=x/8,gy=y/8,ix=Math.floor(gx),iy=Math.floor(gy),tx=gx-ix,ty=gy-iy;
  const noise=(a,b)=>((a*41+b*67)%17)-8;
  const low=(noise(ix,iy)*(1-tx)+noise(ix+1,iy)*tx)*(1-ty)+(noise(ix,iy+1)*(1-tx)+noise(ix+1,iy+1)*tx)*ty;
  return (((x*73+y*37)%19)-9)*.24+low*.2;
 }
 function position(leg,r,width){
  if(!leg||!r||key(leg.from,leg.to)!==r.id||!(leg.dist>0)||!(width>0))return null;
  const p=clamp(leg.gone/leg.dist),reverse=leg.from!==r.from;
  return {progress:p,reverse,camera:(reverse?1-p:p)*(WORLD-SIZE)/SIZE*width,width};
 }
 function request(id,source){
  let e=images.get(id);if(!e){
   const image=new Image();image.decoding='async';e={image,used:0,failed:!source,startedAt:Date.now()};
   image.onerror=()=>{e.failed=true;};images.set(id,e);if(source)image.src=source;
  }e.used=++stamp;return e;
 }
 const ready=e=>e&&!e.failed&&e.image.complete&&e.image.naturalWidth>0;
 function pixels(image){
  const c=document.createElement('canvas');c.width=SIZE;c.height=HEIGHT;
  const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(image,0,0,SIZE,HEIGHT);
  return cx.getImageData(0,0,SIZE,HEIGHT).data;
 }
 function ridges(data){
  const out=new Int16Array(SIZE);out.fill(HEIGHT-1);
  for(let x=0;x<SIZE;x++)for(let y=0;y<HEIGHT;y++)if(data[(y*SIZE+x)*4+3]>=192){out[x]=y;break;}
  return out;
 }
 function cityTerrain(entry){
  if(!entry.terrain){
   const c=document.createElement('canvas');c.width=SIZE;c.height=HEIGHT;
   const cx=c.getContext('2d'),data=cx.createImageData(SIZE,HEIGHT);data.data.set(pixels(entry.image));
   for(let i=3;i<data.data.length;i+=4)if(data.data[i]>=192)data.data[i]=255;
   cx.putImageData(data,0,0);entry.terrain=c;
  }
  return entry.terrain;
 }
 // Code-native silhouette/material join: no scaling or column-height warp.
 // Every source texture is sampled at its ORIGINAL y. New uncovered hillside
 // uses a restrained deterministic material, not stretched city/building pixels.
 function connector(from,to,raw){
  const a=ridges(from),b=ridges(to),c=raw?ridges(raw):null;
  const out=new Uint8ClampedArray(SIZE*HEIGHT*4);
  for(let x=0;x<SIZE;x++){
   const left=x<SIZE/2,edgeX=left?SIZE-1:0,city=left?from:to;
   const edgeRidge=left?a[edgeX]:b[edgeX];
   const protectedEdge=x<EDGE||x>=SIZE-EDGE;
   if(protectedEdge){
    const sx=x<EDGE?SIZE-EDGE+x:x-(SIZE-EDGE),src=x<EDGE?from:to;
    for(let y=0;y<HEIGHT;y++){const o=(y*SIZE+x)*4,i=(y*SIZE+sx)*4;out.set(src.subarray(i,i+4),o);}
    continue;
   }
   const distance=left?x-EDGE:SIZE-EDGE-1-x;
   const t=smooth(distance/JOIN),colour=smooth(distance/24);
   const fallback=smooth((x-EDGE)/(SIZE-2*EDGE));
   const nativeRidge=c?c[x]:Math.round(a[SIZE-1]*(1-fallback)+b[0]*fallback);
   const horizon=edgeRidge*(1-t)+nativeRidge*t;
   const tintA=(Math.min(HEIGHT-1,Math.max(a[SIZE-1]+24,HEIGHT-96))*SIZE+SIZE-1)*4;
   const tintB=(Math.min(HEIGHT-1,Math.max(b[0]+24,HEIGHT-96))*SIZE)*4;
   const surface=[0,0,0];let samples=0;
   if(c)for(let sx=Math.max(0,x-32);sx<=Math.min(SIZE-1,x+32);sx+=4){
    const i=(Math.min(HEIGHT-1,c[sx]+16)*SIZE+sx)*4;
    if(raw[i+3]>=192){for(let ch=0;ch<3;ch++)surface[ch]+=raw[i+ch];samples++;}
   }
   if(samples)for(let ch=0;ch<3;ch++)surface[ch]/=samples;
   for(let y=Math.max(0,Math.floor(horizon));y<HEIGHT;y++){
    const o=(y*SIZE+x)*4,i=(y*SIZE+edgeX)*4;
    const hasRaw=raw&&raw[o+3]>=192,hasCity=city[i+3]>=192;
    const grain=materialGrain(x,y);
    const tint=(Math.min(HEIGHT-1,Math.max(edgeRidge+16,y))*SIZE+edgeX)*4;
    for(let ch=0;ch<3;ch++){
     // A newly filled contour uses native hillside material, never the city's
     // vertical building-edge colours (which would draw horizontal bars).
     // Average hillside MATERIAL, not a single trunk/edge column. Repeating
     // one source column's colour vertically would fabricate striped cliffs.
     const base=(c&&samples?surface[ch]:city[tint+ch])+grain;
     const near=hasCity?city[i+ch]:base;
     // Both banks own the fallback palette continuously. Switching a single
     // bank at x=512 would create a new colour seam in offline/error mode.
     const material=from[tintA+ch]*(1-fallback)+to[tintB+ch]*fallback+grain;
     const far=hasRaw?raw[o+ch]:c?base:material;
     // Terrain contour needs a broad shoulder, but repeating an edge pixel's
     // colour over that same shoulder smears buildings into horizontal bands.
     // Material joins over 24px; original native textures own the rest.
     out[o+ch]=Math.round(near*(1-colour)+far*colour);
    }
    out[o+3]=y<Math.ceil(horizon)?Math.round((1-(horizon-y))*255):255;
   }
  }
  return out;
 }
 function pixelWorker(){
  if(workerUnavailable)return null;if(worker)return worker;
  if(typeof Worker==='undefined'||typeof Blob==='undefined'||typeof URL==='undefined'||!URL.createObjectURL){workerUnavailable=true;return null;}
  let url;
  try{
   const program=`const SIZE=${SIZE},HEIGHT=${HEIGHT},EDGE=${EDGE},JOIN=${JOIN};const clamp=${clamp.toString()},smooth=${smooth.toString()};${ridges.toString()}${materialGrain.toString()}${connector.toString()}
    self.onmessage=e=>{try{const {id,token,a,b,c}=e.data;const data=connector(new Uint8ClampedArray(a),new Uint8ClampedArray(b),c?new Uint8ClampedArray(c):null);self.postMessage({id,token,data:data.buffer},[data.buffer]);}catch(error){self.postMessage({id:e.data.id,token:e.data.token,error:String(error)});}};`;
   url=URL.createObjectURL(new Blob([program],{type:'text/javascript'}));worker=new Worker(url);
   worker.onmessage=e=>{const job=jobs.get(e.data.id);if(job&&job.token===e.data.token){job.data=e.data.data?new Uint8ClampedArray(e.data.data):null;job.error=!!e.data.error;}};
   worker.onerror=()=>{workerUnavailable=true;if(worker)worker.terminate();worker=null;for(const job of jobs.values())job.error=true;};
   return worker;
  }catch(_){workerUnavailable=true;worker=null;return null;}
  finally{if(url)URL.revokeObjectURL(url);}
 }
 function assemble(r,joined){
  const from=request('city:'+r.from,ROAD_ENVIRONMENT.source(r.from));
  const to=request('city:'+r.to,ROAD_ENVIRONMENT.source(r.to));
  if(!ready(from)||!ready(to))return null;
  const bridge=document.createElement('canvas');bridge.width=SIZE;bridge.height=HEIGHT;
  const bx=bridge.getContext('2d');const data=bx.createImageData(SIZE,HEIGHT);data.data.set(joined);bx.putImageData(data,0,0);
  const world=document.createElement('canvas');world.width=WORLD;world.height=HEIGHT;
  const cx=world.getContext('2d');cx.drawImage(cityTerrain(from),0,0,SIZE,HEIGHT);
  // Overlap is ownership replacement, not translucent double exposure. Clear
  // only the offscreen world section so fractional ridge alpha stays identical.
  cx.clearRect(SIZE-EDGE,0,SIZE,HEIGHT);cx.drawImage(bridge,SIZE-EDGE,0);
  cx.clearRect(2*(SIZE-EDGE),0,SIZE,HEIGHT);cx.drawImage(cityTerrain(to),2*(SIZE-EDGE),0,SIZE,HEIGHT);
  // Substantive ground must not expose the moving sky through near-opaque art.
  // Retain fractional silhouette edges; only strengthen already-solid pixels.
  const opaque=cx.getImageData(0,0,WORLD,HEIGHT);
  for(let i=3;i<opaque.data.length;i+=4)if(opaque.data[i]>=192)opaque.data[i]=255;
  cx.putImageData(opaque,0,0);
  return world;
 }
 function prepare(r,from,to,art){
  let job=jobs.get(r.id);if(job?.data){jobs.delete(r.id);return assemble(r,job.data);}
  if(job&&!job.error)return null;
  const background=pixelWorker();
  const a=pixels(from.image),b=pixels(to.image),c=ready(art)?pixels(art.image):null;
  if(background&&!job?.error){
   const token=++jobSequence;jobs.set(r.id,{token,data:null,error:false});
   background.postMessage({id:r.id,token,a:a.buffer,b:b.buffer,c:c?.buffer||null},c?[a.buffer,b.buffer,c.buffer]:[a.buffer,b.buffer]);
   return null;
  }
  jobs.delete(r.id);return assemble(r,connector(a,b,c));
 }
 function trim(pinned){
  while(images.size>8){const old=[...images].filter(([id])=>!pinned.has(id)).sort((a,b)=>a[1].used-b[1].used)[0];if(!old)break;images.delete(old[0]);}
  while(worlds.size>2){const old=[...worlds].find(([id])=>id!==last?.id);if(!old)break;worlds.delete(old[0]);}
  for(const id of jobs.keys())if(!pinned.has('bridge:'+id))jobs.delete(id);
 }
 function paint(target,image,view,frame){
  const {W,H,scale=2,dark=0,hour=12,wx='clear'}=frame;
  if(!layer){layer=document.createElement('canvas');layerCtx=layer.getContext('2d');}
  if(layer.width!==W*scale||layer.height!==H*scale){layer.width=W*scale;layer.height=H*scale;layerCtx.setTransform(scale,0,0,scale,0,0);}
  layerCtx.clearRect(0,0,W,H);layerCtx.imageSmoothingEnabled=true;
  const artH=W*HEIGHT/SIZE,top=Math.round(H*.72)-artH;
  layerCtx.drawImage(image,0,0,image.width||image.naturalWidth,HEIGHT,-view.camera,top,(image.width||image.naturalWidth)/SIZE*W,artH);
  layerCtx.save();layerCtx.globalCompositeOperation='source-atop';
  layerCtx.fillStyle=`rgba(5,10,24,${dark*.78})`;layerCtx.fillRect(0,0,W,H);
  const dusk=Math.max(0,1-Math.abs(hour-18)/1.5)*(1-dark)*.13;
  if(dusk){layerCtx.fillStyle=`rgba(188,112,66,${dusk})`;layerCtx.fillRect(0,0,W,H);}
  if(wx==='fog'||wx==='dust'){layerCtx.fillStyle=wx==='fog'?'rgba(125,145,158,.18)':'rgba(147,126,92,.16)';layerCtx.fillRect(0,0,W,H);}
  layerCtx.restore();target.save();target.imageSmoothingEnabled=true;target.drawImage(layer,0,0,layer.width,layer.height,0,0,W,H);target.restore();
 }
 function draw(target,frame){
  if(!active())return false;
  if(!frame.driving){
   const id=frame.at||frame.state?.from?.id,city=request('city:'+id,ROAD_ENVIRONMENT.source(id));
   trim(new Set(['city:'+id]));
   if(ready(city)){paint(target,cityTerrain(city),{camera:0},frame);last=null;return true;}
   return false;
  }
  const leg=frame.driving,r=registry.routes.find(x=>x.id===key(leg.from,leg.to));
  if(!r)return false;
  const from=request('city:'+r.from,ROAD_ENVIRONMENT.source(r.from)),to=request('city:'+r.to,ROAD_ENVIRONMENT.source(r.to));
  // Current live assets only; offline never requests absent companion files.
  const hosted=typeof location!=='undefined'&&/^https?:$/.test(location.protocol)&&location.hostname==='127.0.0.1';
  const art=hosted?request('bridge:'+r.id,r.source):null;
  let world=worlds.get(r.id);
  // Await the native connector instead of latching a fallback before its HTTP
  // decode completes. A genuinely failed/stalled asset falls back once only.
  const resolved=!art||ready(art)||art.failed||Date.now()-art.startedAt>=4000;
  if(!world&&ready(from)&&ready(to)&&resolved){
   try{world=prepare(r,from,to,art);}catch(_){jobs.delete(r.id);return false;}
   if(world)worlds.set(r.id,world);
  }
  // Choose the decoded source once per leg. No asynchronous mid-leg terrain pop.
  const view=position(leg,r,frame.W);
  if(world&&view){last={id:r.id,world,view};paint(target,world,view,frame);}
  else if(last&&last.id===r.id)paint(target,last.world,last.view,frame);
  else {
   const origin=leg.from===r.from?from:to;
   if(ready(origin))paint(target,cityTerrain(origin),{camera:0},frame);
   trim(new Set(['city:'+r.from,'city:'+r.to,'bridge:'+r.id]));
   return ready(origin);
  }
  trim(new Set(['city:'+r.from,'city:'+r.to,'bridge:'+r.id]));
  return !!world||!!last;
 }
 return {active,draw,key,position,connector,ridges};
})();
