/* Native-HD distance-owned scenery. Cities are immutable shared owners.
   Approved full-route panoramas are embedded for hosted and offline apps;
   code-native joining preserves canonical city banks on every incoming road.
   Neither path changes saves, resources or the existing braking clock. */
const ROAD_CONTINUITY=(()=>{
 const registry=/*__ROAD_CONTINUITY__*/{enabled:false,routes:[]};
 const SIZE=1024,HEIGHT=576,EDGE=64,JOIN=192,WORLD=2944;
 const images=new Map(),worlds=new Map(),jobs=new Map();
 let stamp=0,jobSequence=0,last=null,layer,layerCtx,worker,workerUnavailable=false;
 const key=(a,b)=>[a,b].sort().join('--');
 const clamp=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
 const smooth=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
 const active=()=>registry.enabled===true;
 const shared=registry.connected;
 const atlas=registry.atlas,ATLAS_WIDTH=2048;
 let sharedTerrain=null,sharedCamera=null;
 const sharedCities=new Map();
 // The foreground follows the same spatial owner as the terrain camera.
 // A completed leg keeps its facing at a stop/reload; selecting a destination
 // cannot turn the vehicle. Legacy saves without a recap keep the old facing.
 function direction(state){
  if(!active()||!state)return 1;
  const leg=state.driving||(state.lastJourneyRecap?.to===state.at?state.lastJourneyRecap:null);
  if(!leg)return 1;
  if(shared?.routes.some(([a,b])=>key(a,b)===key(leg.from,leg.to))){
   const delta=shared.nodes[leg.to]-shared.nodes[leg.from];
   if(Number.isFinite(delta)&&delta!==0)return Math.sign(delta);
  }
  const route=routeFor(leg);
  return route&&leg.from===route.to?-1:1;
 }
 function routeFor(leg){
  const id=key(leg.from,leg.to),plate=atlas?.routes.find(r=>r.id===id);
  return plate?{...plate,atlas:true,span:(SIZE-EDGE)*2+ATLAS_WIDTH-SIZE}:registry.routes.find(r=>r.id===id);
 }
 // Pure distance mapping: no wall clock, selected destination, recap or save write.
 // Reverse travel walks the same source pixels backwards; it never mirrors art.
 function connectedPosition(frame){
  if(!shared||!active()||!Number.isFinite(frame.W)||!(frame.W>0))return null;
  let x;
  const leg=frame.driving;
  if(leg){
   if(!shared.routes.some(([a,b])=>key(a,b)===key(leg.from,leg.to))||!Number.isFinite(leg.dist)||!(leg.dist>0)||!Number.isFinite(leg.gone))return null;
   const p=clamp(leg.gone/leg.dist);
   x=shared.nodes[leg.from]+(shared.nodes[leg.to]-shared.nodes[leg.from])*p;
  }else x=shared.nodes[frame.at];
  if(!Number.isFinite(x))return null;
  return {camera:x/shared.viewport*frame.W,sourceX:x,unit:shared.viewport,height:shared.height};
 }
 function presentationPosition(view,frame){
  const leg=frame.driving;
  if(!leg||!Number.isFinite(frame.dt)){sharedCamera=null;return view;}
  const id=leg.from+'>'+leg.to;
  if(!sharedCamera||sharedCamera.id!==id)sharedCamera={id,x:view.sourceX};
  // The engine freezes paid distance at discovery while the existing cue
  // brakes. Let the visual camera settle into that SAME distance continuously;
  // never spend distance/resources, advance on a timer, or snap on speed>0.
  const dt=Math.max(0,Math.min(.1,frame.dt));
  // Shed the small following distance before the arrival owner takes over.
  const tau=.2*Math.min(1,Math.max(0,(leg.dist-leg.gone)/.5));
  const delta=view.sourceX-sharedCamera.x;
  if(Math.abs(delta)<.001)sharedCamera.x=view.sourceX;
  else sharedCamera.x+=delta*(tau>0?1-Math.exp(-dt/tau):1);
  return {...view,sourceX:sharedCamera.x,camera:sharedCamera.x/(view.unit||shared.viewport)*frame.W};
 }
 function solidTerrain(image){
  const c=document.createElement('canvas');c.width=image.naturalWidth||image.width;c.height=image.naturalHeight||image.height;
  const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(image,0,0);
  const data=cx.getImageData(0,0,c.width,c.height);
  for(let i=3;i<data.data.length;i+=4)if(data.data[i]>=192)data.data[i]=255;
  cx.putImageData(data,0,0);return c;
 }
 function sharedEntry(){
  if(!shared)return null;
  const entry=request('shared:'+shared.id,shared.source);
  if(ready(entry)&&!sharedTerrain)sharedTerrain=solidTerrain(entry.image);
  return entry;
 }
 function requestCity(id){
  if(!shared||!Object.hasOwn(shared.nodes,id)){
   const crop=atlas?.cities[id],plate=crop&&atlas.routes.find(r=>r.id===crop.route);
   if(!plate)return request('city:'+id,ROAD_ENVIRONMENT.source(id));
   const entry=request('atlas:'+plate.id,plate.source);
   if(entry.failed)return request('city:'+id,ROAD_ENVIRONMENT.source(id));
   if(!ready(entry))return entry;
   entry.cityCrops??=new Map();
   if(!entry.cityCrops.has(id)){
    const c=document.createElement('canvas');c.width=SIZE;c.height=HEIGHT;
    const scale=SIZE/1080,cx=c.getContext('2d');
    cx.drawImage(entry.image,-crop.x*scale,HEIGHT-720*scale,2160*scale,720*scale);
    entry.cityCrops.set(id,{image:entry.image,terrain:solidTerrain(c)});
   }
   return entry.cityCrops.get(id);
  }
  const entry=sharedEntry();
  if(entry.failed)return request('city:'+id,ROAD_ENVIRONMENT.source(id));
  if(!ready(entry))return entry;
  if(!sharedCities.has(id)){
   const c=document.createElement('canvas');c.width=SIZE;c.height=HEIGHT;
   const cx=c.getContext('2d'),scale=SIZE/shared.viewport;
   // Same uniform scale/baseline as the shared panorama. Only empty sky above
   // the 576px city window is clipped, never stretch a 720px plate to 576px.
   cx.drawImage(sharedTerrain,-shared.nodes[id]*scale,HEIGHT-shared.height*scale,shared.width*scale,shared.height*scale);
   sharedCities.set(id,{image:entry.image,terrain:c});
  }
  return sharedCities.get(id);
 }
 function materialGrain(x,y){
  const gx=x/8,gy=y/8,ix=Math.floor(gx),iy=Math.floor(gy),tx=gx-ix,ty=gy-iy;
  const noise=(a,b)=>((a*41+b*67)%17)-8;
  const low=(noise(ix,iy)*(1-tx)+noise(ix+1,iy)*tx)*(1-ty)+(noise(ix,iy+1)*(1-tx)+noise(ix+1,iy+1)*tx)*ty;
  return (((x*73+y*37)%19)-9)*.24+low*.2;
 }
 function position(leg,r,width){
  if(!leg||!r||key(leg.from,leg.to)!==r.id||!(leg.dist>0)||!(width>0))return null;
  const p=clamp(leg.gone/leg.dist),reverse=leg.from!==r.from;
  const x=(reverse?1-p:p)*(r.span??WORLD-SIZE);
  return {progress:p,reverse,camera:x/SIZE*width,width,...(r.atlas?{sourceX:x,unit:SIZE,height:HEIGHT}:{})};
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
 function atlasPixels(image){
  const c=document.createElement('canvas');c.width=ATLAS_WIDTH;c.height=HEIGHT;
  const cx=c.getContext('2d',{willReadFrequently:true}),scale=SIZE/1080;
  cx.drawImage(image,0,HEIGHT-720*scale,2160*scale,720*scale);
  return cx.getImageData(0,0,ATLAS_WIDTH,HEIGHT).data;
 }
 function ridges(data,width=SIZE){
  const out=new Int16Array(width);out.fill(HEIGHT-1);
  for(let x=0;x<width;x++)for(let y=0;y<HEIGHT;y++)if(data[(y*width+x)*4+3]>=192){out[x]=y;break;}
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
 function connector(from,to,raw,width=SIZE){
  const a=ridges(from),b=ridges(to),c=raw?ridges(raw,width):null;
  const out=new Uint8ClampedArray(width*HEIGHT*4);
  for(let x=0;x<width;x++){
   const left=x<width/2,edgeX=left?SIZE-1:0,city=left?from:to;
   const edgeRidge=left?a[edgeX]:b[edgeX];
   const protectedEdge=x<EDGE||x>=width-EDGE;
   if(protectedEdge){
    const sx=x<EDGE?SIZE-EDGE+x:x-(width-EDGE),src=x<EDGE?from:to;
    for(let y=0;y<HEIGHT;y++){const o=(y*width+x)*4,i=(y*SIZE+sx)*4;out.set(src.subarray(i,i+4),o);}
    continue;
   }
   const distance=left?x-EDGE:width-EDGE-1-x;
   const t=smooth(distance/JOIN),colour=smooth(distance/24);
   const fallback=smooth((x-EDGE)/(width-2*EDGE));
   const nativeRidge=c?c[x]:Math.round(a[SIZE-1]*(1-fallback)+b[0]*fallback);
   const horizon=edgeRidge*(1-t)+nativeRidge*t;
   const tintA=(Math.min(HEIGHT-1,Math.max(a[SIZE-1]+24,HEIGHT-96))*SIZE+SIZE-1)*4;
   const tintB=(Math.min(HEIGHT-1,Math.max(b[0]+24,HEIGHT-96))*SIZE)*4;
   const surface=[0,0,0];let samples=0;
   if(c)for(let sx=Math.max(0,x-32);sx<=Math.min(width-1,x+32);sx+=4){
    const i=(Math.min(HEIGHT-1,c[sx]+16)*width+sx)*4;
    if(raw[i+3]>=192){for(let ch=0;ch<3;ch++)surface[ch]+=raw[i+ch];samples++;}
   }
   if(samples)for(let ch=0;ch<3;ch++)surface[ch]/=samples;
   for(let y=Math.max(0,Math.floor(horizon));y<HEIGHT;y++){
    const o=(y*width+x)*4,i=(y*SIZE+edgeX)*4;
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
    self.onmessage=e=>{try{const {id,token,a,b,c,width}=e.data;const data=connector(new Uint8ClampedArray(a),new Uint8ClampedArray(b),c?new Uint8ClampedArray(c):null,width);self.postMessage({id,token,data:data.buffer},[data.buffer]);}catch(error){self.postMessage({id:e.data.id,token:e.data.token,error:String(error)});}};`;
   url=URL.createObjectURL(new Blob([program],{type:'text/javascript'}));worker=new Worker(url);
   worker.onmessage=e=>{const job=jobs.get(e.data.id);if(job&&job.token===e.data.token){job.data=e.data.data?new Uint8ClampedArray(e.data.data):null;job.error=!!e.data.error;}};
   worker.onerror=()=>{workerUnavailable=true;if(worker)worker.terminate();worker=null;for(const job of jobs.values())job.error=true;};
   return worker;
  }catch(_){workerUnavailable=true;worker=null;return null;}
  finally{if(url)URL.revokeObjectURL(url);}
 }
 function assemble(r,joined){
  const from=requestCity(r.from);
  const to=requestCity(r.to);
  if(!ready(from)||!ready(to))return null;
  const width=r.atlas?ATLAS_WIDTH:SIZE,worldWidth=(SIZE-EDGE)*2+width;
  const bridge=document.createElement('canvas');bridge.width=width;bridge.height=HEIGHT;
  const bx=bridge.getContext('2d');const data=bx.createImageData(width,HEIGHT);data.data.set(joined);bx.putImageData(data,0,0);
  const world=document.createElement('canvas');world.width=worldWidth;world.height=HEIGHT;
  const cx=world.getContext('2d');cx.drawImage(cityTerrain(from),0,0,SIZE,HEIGHT);
  // Overlap is ownership replacement, not translucent double exposure. Clear
  // only the offscreen world section so fractional ridge alpha stays identical.
  cx.clearRect(SIZE-EDGE,0,width,HEIGHT);cx.drawImage(bridge,SIZE-EDGE,0);
  cx.clearRect(SIZE-EDGE+width-EDGE,0,SIZE,HEIGHT);cx.drawImage(cityTerrain(to),SIZE-EDGE+width-EDGE,0,SIZE,HEIGHT);
  // Substantive ground must not expose the moving sky through near-opaque art.
  // Retain fractional silhouette edges; only strengthen already-solid pixels.
  const opaque=cx.getImageData(0,0,worldWidth,HEIGHT);
  for(let i=3;i<opaque.data.length;i+=4)if(opaque.data[i]>=192)opaque.data[i]=255;
  cx.putImageData(opaque,0,0);
  return world;
 }
 function prepare(r,from,to,art){
  let job=jobs.get(r.id);if(job?.data){jobs.delete(r.id);return assemble(r,job.data);}
  if(job&&!job.error)return null;
  const background=pixelWorker();
  const a=pixels(cityTerrain(from)),b=pixels(cityTerrain(to));
  const c=ready(art)?(r.atlas?atlasPixels(art.image):pixels(art.image)):null,width=r.atlas?ATLAS_WIDTH:SIZE;
  if(background&&!job?.error){
   const token=++jobSequence;jobs.set(r.id,{token,data:null,error:false});
   background.postMessage({id:r.id,token,a:a.buffer,b:b.buffer,c:c?.buffer||null,width},c?[a.buffer,b.buffer,c.buffer]:[a.buffer,b.buffer]);
   return null;
  }
  jobs.delete(r.id);return assemble(r,connector(a,b,c,width));
 }
 function trim(pinned){
  if(shared)pinned.add('shared:'+shared.id);
  while(images.size>8){const old=[...images].filter(([id])=>!pinned.has(id)).sort((a,b)=>a[1].used-b[1].used)[0];if(!old)break;images.delete(old[0]);}
  while(worlds.size>2){const old=[...worlds].find(([id])=>id!==last?.id);if(!old)break;worlds.delete(old[0]);}
  for(const id of jobs.keys())if(!pinned.has('bridge:'+id))jobs.delete(id);
 }
 function cityPin(id){
  return atlas?.cities[id]&&!(shared&&Object.hasOwn(shared.nodes,id))?'atlas:'+atlas.cities[id].route:'city:'+id;
 }
 function paint(target,image,view,frame){
  const {W,H,scale=2,dark=0,hour=12,wx='clear'}=frame;
  if(!layer){layer=document.createElement('canvas');layerCtx=layer.getContext('2d');}
  if(layer.width!==W*scale||layer.height!==H*scale){layer.width=W*scale;layer.height=H*scale;layerCtx.setTransform(scale,0,0,scale,0,0);}
  layerCtx.clearRect(0,0,W,H);layerCtx.imageSmoothingEnabled=true;
  const unit=view.unit||SIZE,sourceHeight=view.height||HEIGHT;
  const artH=W*sourceHeight/unit,top=Math.round(H*.72)-artH;
  layerCtx.drawImage(image,0,0,image.width||image.naturalWidth,sourceHeight,-view.camera,top,(image.width||image.naturalWidth)/unit*W,artH);
  layerCtx.save();layerCtx.globalCompositeOperation='source-atop';
  layerCtx.fillStyle=`rgba(5,10,24,${dark*.78})`;layerCtx.fillRect(0,0,W,H);
  const dusk=Math.max(0,1-Math.abs(hour-18)/1.5)*(1-dark)*.13;
  if(dusk){layerCtx.fillStyle=`rgba(188,112,66,${dusk})`;layerCtx.fillRect(0,0,W,H);}
  if(wx==='fog'||wx==='dust'){layerCtx.fillStyle=wx==='fog'?'rgba(125,145,158,.18)':'rgba(147,126,92,.16)';layerCtx.fillRect(0,0,W,H);}
  layerCtx.restore();target.save();target.imageSmoothingEnabled=true;target.drawImage(layer,0,0,layer.width,layer.height,0,0,W,H);target.restore();
 }
 function draw(target,frame){
  if(!active())return false;
  const connected=connectedPosition(frame);
  if(connected){
   const entry=sharedEntry();
   // Preloaded embedded source is also available offline. Never show an old
   // city or a previous route while the shared image is decoding.
   if(ready(entry)){paint(target,sharedTerrain,presentationPosition(connected,frame),frame);last=null;}
   if(!entry.failed){trim(new Set());return true;}
  }
  if(!frame.driving||!atlas)sharedCamera=null;
  if(!frame.driving){
   const id=frame.at||frame.state?.from?.id,city=requestCity(id);
   trim(new Set([cityPin(id)]));
   if(ready(city)){paint(target,cityTerrain(city),{camera:0},frame);last=null;return true;}
   return false;
  }
  const leg=frame.driving,r=routeFor(leg);
  if(!r)return false;
  const from=requestCity(r.from),to=requestCity(r.to);
  // Current live assets only; offline never requests absent companion files.
  const hosted=typeof location!=='undefined'&&/^https?:$/.test(location.protocol)&&location.hostname==='127.0.0.1';
  const art=r.atlas?request('atlas:'+r.id,r.source):hosted?request('bridge:'+r.id,r.source):null;
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
  if(world&&view){last={id:r.id,world,view};paint(target,world,r.atlas?presentationPosition(view,frame):view,frame);}
  else if(last&&last.id===r.id)paint(target,last.world,last.view,frame);
  else {
   const origin=leg.from===r.from?from:to;
   if(ready(origin))paint(target,cityTerrain(origin),{camera:0},frame);
   trim(new Set([cityPin(r.from),cityPin(r.to),'bridge:'+r.id,'atlas:'+r.id]));
   return ready(origin);
  }
  trim(new Set([cityPin(r.from),cityPin(r.to),'bridge:'+r.id,'atlas:'+r.id]));
  return !!world||!!last;
 }
 // Decode during title/intro instead of waiting for the first departure.
 if(shared&&active())request('shared:'+shared.id,shared.source);
 return {active,draw,key,position,connector,ridges,connectedPosition,direction};
})();
