/* Shared city windows and authored quiet outskirts. Geometry is presentation
   only: this owner never reads/writes saves, time, resources or route choices. */
const CONTINUOUS_TERRAIN=(()=>{
 const registry=/*__CONTINUOUS_TERRAIN__*/{enabled:false,nodes:{},corridors:{},routes:[]};
 const join=/*__CONTINUOUS_JOIN__*/null;
 const UNIT=1024,WIDTH=2048,HEIGHT=576,OVERLAP=512,STEP=1536;
 const images=new Map(),worlds=new Map(),workerJobs=new Map();
 let enabled=registry.enabled===true,stamp=0,activeId='',worker=null,workerFailed=false,jobId=0,layer=null,layerCtx=null,follow=null;
 const key=(a,b)=>[a,b].sort().join('--');
 const legOf=v=>v?.driving||(v?.from&&v?.to?v:null);
 const routeOf=v=>{const l=legOf(v);return l?registry.routes.find(r=>r.id===key(l.from,l.to)):null;};
 const active=()=>enabled;
 function position(view,width){
  if(!Number.isFinite(width)||width<=0)return null;
  const leg=legOf(view);
  if(!leg){const id=view?.at;if(!registry.nodes[id])return null;return {kind:'city',id,sourceX:OVERLAP,camera:OVERLAP/UNIT*width};}
  const r=routeOf(view),dist=Number(leg.dist),gone=Number(leg.gone);
  if(!r||!Number.isFinite(dist)||dist<=0||!Number.isFinite(gone))return null;
  const p=Math.max(0,Math.min(1,gone/dist)),sourceX=OVERLAP+STEP*2*(leg.from===r.from?p:1-p);
  return {kind:'road',id:r.id,sourceX,camera:sourceX/UNIT*width};
 }
 function citySample(view){
  const leg=legOf(view);let id=view?.at;
  if(leg){if(!routeOf(view)||!(leg.dist>0))return null;if(leg.gone<=0)id=leg.from;else if(leg.gone>=leg.dist)id=leg.to;else return null;}
  return registry.nodes[id]?{id,sourceX:OVERLAP,viewport:UNIT,height:HEIGHT}:null;
 }
 function direction(state){
  const l=state?.driving||(state?.lastJourneyRecap?.to===state?.at?state.lastJourneyRecap:null),r=l&&routeOf(l);
  return r&&l.from===r.to?-1:1;
 }
 function trim(keep=''){
  const pinned=new Set();
  for(const id of [activeId,keep]){const r=registry.routes.find(r=>r.id===id);if(r){pinned.add('node:'+r.from);pinned.add('node:'+r.to);pinned.add('corridor:'+r.kind);}}
  while(images.size>8){const old=[...images].filter(([id,e])=>!pinned.has(id)&&!e.loading).sort((a,b)=>a[1].used-b[1].used)[0];if(!old)break;images.delete(old[0]);}
  while(worlds.size>2){const old=[...worlds].filter(([id,e])=>id!==activeId&&id!==keep&&!e.loading).sort((a,b)=>a[1].used-b[1].used)[0];if(!old)break;worlds.delete(old[0]);}
 }
 function request(kind,id){
  const cacheKey=kind+':'+id;let e=images.get(cacheKey);
  if(e){e.used=++stamp;return e;}
  const item=(kind==='node'?registry.nodes:registry.corridors)[id];
  e={used:++stamp,loading:true,failed:false,canvas:null,promise:null};images.set(cacheKey,e);
  e.promise=new Promise((resolve,reject)=>{
   const image=new Image();image.decoding='async';
   const timer=setTimeout(()=>fail(),4000);
   const fail=()=>{clearTimeout(timer);e.loading=false;e.failed=true;image.onload=null;image.onerror=null;reject(Error('Terrain image unavailable: '+cacheKey));};
   image.onerror=fail;
   image.onload=()=>{clearTimeout(timer);try{
    if(image.naturalWidth!==WIDTH||image.naturalHeight!==HEIGHT)throw Error('Terrain geometry: '+cacheKey);
    const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;
    const cx=canvas.getContext('2d',{willReadFrequently:true});cx.drawImage(image,0,0);
    const data=cx.getImageData(0,0,WIDTH,HEIGHT);for(let i=3;i<data.data.length;i+=4)if(data.data[i]>=192)data.data[i]=255;cx.putImageData(data,0,0);
    e.canvas=canvas;e.loading=false;image.onload=null;image.onerror=null;resolve(canvas);
   }catch(_){fail();}};
   if(!item?.source)fail();else image.src=item.source;
  });
  return e;
 }
 function retireWorker(){
  workerFailed=true;worker?.terminate();worker=null;
  for(const task of workerJobs.values()){clearTimeout(task.timer);task.reject(Error('Terrain worker unavailable'));}
  workerJobs.clear();
 }
 function getWorker(){
  if(workerFailed||typeof Worker==='undefined'||typeof Blob==='undefined'||typeof URL==='undefined'||!URL.createObjectURL)return null;
  if(worker)return worker;
  let url;
  try{
   url=URL.createObjectURL(new Blob([`const join=${join.toString()};self.onmessage=e=>{try{const {id,a,b,c}=e.data;const out=join(new Uint8ClampedArray(a),new Uint8ClampedArray(b),new Uint8ClampedArray(c));self.postMessage({id,data:out.buffer},[out.buffer]);}catch(error){self.postMessage({id:e.data.id,error:String(error)});}};`],{type:'text/javascript'}));
   worker=new Worker(url);
   worker.onmessage=e=>{const task=workerJobs.get(e.data.id);if(!task)return;workerJobs.delete(e.data.id);clearTimeout(task.timer);if(e.data.error)task.reject(Error(e.data.error));else task.resolve(new Uint8ClampedArray(e.data.data));};
   worker.onerror=retireWorker;
   return worker;
  }catch(_){workerFailed=true;return null;}finally{if(url)URL.revokeObjectURL(url);}
 }
 function pixels(canvas){return canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,WIDTH,HEIGHT).data;}
 async function compose(a,b,c){
  const background=getWorker();let data;
  if(background){try{data=await new Promise((resolve,reject)=>{const id=++jobId,arrays=[a,b,c].map(pixels);const timer=setTimeout(retireWorker,8000);workerJobs.set(id,{resolve,reject,timer});background.postMessage({id,a:arrays[0].buffer,b:arrays[1].buffer,c:arrays[2].buffer},arrays.map(v=>v.buffer));});}catch(_){data=join(...[a,b,c].map(pixels));}}
  else data=join(...[a,b,c].map(pixels));
  const canvas=document.createElement('canvas');canvas.width=WIDTH*3-OVERLAP*2;canvas.height=HEIGHT;
  const cx=canvas.getContext('2d'),frame=cx.createImageData?cx.createImageData(canvas.width,HEIGHT):{data:new Uint8ClampedArray(data.length)};frame.data.set(data);cx.putImageData(frame,0,0);
  return canvas;
 }
 function prepare(view){
  if(!enabled||typeof join!=='function')return Promise.resolve(false);
  const leg=legOf(view);
  if(!leg){if(!registry.nodes[view?.at])return Promise.resolve(false);return request('node',view.at).promise.then(()=>{trim();return true;}).catch(()=>false);}
  const r=routeOf(view);if(!r)return Promise.resolve(false);
  let entry=worlds.get(r.id);if(entry){entry.used=++stamp;return entry.promise;}
  entry={canvas:null,loading:true,used:++stamp,promise:null};worlds.set(r.id,entry);
  entry.promise=Promise.all([request('node',r.from).promise,request('corridor',r.kind).promise,request('node',r.to).promise])
   .then(([a,b,c])=>compose(a,b,c)).then(canvas=>{entry.canvas=canvas;entry.loading=false;trim(r.id);return true;})
   .catch(()=>{entry.loading=false;trim(r.id);return false;});
  return entry.promise;
 }
 function ready(view){
  const leg=legOf(view);if(leg){const r=routeOf(view);return !!(r&&worlds.get(r.id)?.canvas);}
  return !!images.get('node:'+view?.at)?.canvas;
 }
 function presentation(p,frame){
  const leg=frame.driving;if(!leg||!Number.isFinite(frame.dt)){follow=null;return p;}
  const id=leg.from+'>'+leg.to;if(!follow||follow.id!==id)follow={id,x:p.sourceX};
  const tau=.2*Math.min(1,Math.max(0,(leg.dist-leg.gone)/.5)),dt=Math.max(0,Math.min(.1,frame.dt));
  follow.x+= (p.sourceX-follow.x)*(tau>0?1-Math.exp(-dt/tau):1);
  if(Math.abs(follow.x-p.sourceX)<.001)follow.x=p.sourceX;
  return {...p,sourceX:follow.x,camera:follow.x/UNIT*frame.W};
 }
 function draw(target,frame){
  if(!enabled)return false;const p=position(frame,frame.W);if(!p)return false;
  let image=p.kind==='road'?worlds.get(p.id)?.canvas:images.get('node:'+p.id)?.canvas;
  if(!image){prepare(frame);return false;}
  if(p.kind==='road')activeId=p.id;
  const view=presentation(p,frame),{W,H,scale=2,dark=0,hour=12,wx='clear'}=frame;
  const endpoint=citySample(frame);let sourceX=view.sourceX;
  // Raw city/world pixels are equal, but browser scaling can round differently
  // for different-sized source canvases. Use the same node at exact endpoints.
  if(endpoint&&images.get('node:'+endpoint.id)?.canvas){image=images.get('node:'+endpoint.id).canvas;sourceX=OVERLAP;}
  if(!layer){layer=document.createElement('canvas');layerCtx=layer.getContext('2d');}
  if(layer.width!==W*scale||layer.height!==H*scale){layer.width=W*scale;layer.height=H*scale;layerCtx.setTransform(scale,0,0,scale,0,0);}
  layerCtx.clearRect(0,0,W,H);layerCtx.imageSmoothingEnabled=true;
  layerCtx.drawImage(image,sourceX,0,UNIT,HEIGHT,0,Math.round(H*.72)-HEIGHT/UNIT*W,W,HEIGHT/UNIT*W);
  layerCtx.save();layerCtx.globalCompositeOperation='source-atop';
  layerCtx.fillStyle=`rgba(5,10,24,${dark*.78})`;layerCtx.fillRect(0,0,W,H);
  const dusk=Math.max(0,1-Math.abs(hour-18)/1.5)*(1-dark)*.13;
  if(dusk){layerCtx.fillStyle=`rgba(188,112,66,${dusk})`;layerCtx.fillRect(0,0,W,H);}
  if(wx==='fog'||wx==='dust'){layerCtx.fillStyle=wx==='fog'?'rgba(125,145,158,.18)':'rgba(147,126,92,.16)';layerCtx.fillRect(0,0,W,H);}
  layerCtx.restore();target.save();target.imageSmoothingEnabled=true;target.drawImage(layer,0,0,layer.width,layer.height,0,0,W,H);target.restore();return true;
 }
 if(enabled&&registry.nodes.busan)prepare({at:'busan'});
 return {active,position,citySample,direction,prepare,ready,draw,disable:()=>{enabled=false;}};
})();
