/* Shared geometry for the approved continuous-terrain study.
   No game mutation or animation clock: distance owns the camera position.
   Production activation is intentionally separate from asset generation. */
const ROUTE_PANORAMA = (()=>{
  const registry=/*__ROAD_ROUTES__*/{enabled:false,routes:[]};
  const cache=new Map();let stamp=0,lastView=null,layer=null,layerCtx=null,preloadKey='';
  const key=(a,b)=>[a,b].sort().join('--');
  const finite=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
  const clamp=v=>Math.max(0,Math.min(1,finite(v)));
  function position(leg,route,width){
    if(!leg||!route||key(leg.from,leg.to)!==route.id)return null;
    const W=finite(width);
    if(W<=0||leg.from===leg.to)return null;
    const distance=finite(leg.dist,route.km);
    if(distance<=0)return null;
    const progress=clamp(finite(leg.gone)/distance);
    return {id:route.id,progress,reverse:leg.from!==route.from,
      stripWidth:W*3,travel:W*2*progress};
  }
  function stopped(at,recap,routes){
    if(recap&&recap.to===at){
      const route=routes.find(r=>r.id===key(recap.from,recap.to));
      if(route)return {route,leg:{from:recap.from,to:recap.to,dist:route.km,gone:route.km}};
    }
    // First entry is deterministic. This does NOT claim that the endpoints of
    // independently generated corridors already form a verified node handoff.
    const route=routes.find(r=>r.from===at||r.to===at);
    if(!route)return null;
    const from=at,to=route.from===at?route.to:route.from;
    return {route,leg:{from,to,dist:route.km,gone:0}};
  }
  function paint(ctx,image,position,{W,H}){
    if(!position||!image||!image.naturalWidth||!image.naturalHeight)return false;
    const artW=position.stripWidth,artH=artW*image.naturalHeight/image.naturalWidth;
    ctx.save();ctx.imageSmoothingEnabled=true;
    ctx.translate(-position.travel+(position.reverse?artW:0),Math.round(H*.72)-artH);
    if(position.reverse)ctx.scale(-1,1);
    // One terrain, one spatial camera. Generated ground retains a tiny alpha
    // residue, as in the existing terrain owner. An identical second pass
    // reinforces it; this is not two scenes or an animated opacity transition.
    ctx.drawImage(image,0,0,artW,artH);ctx.drawImage(image,0,0,artW,artH);
    ctx.restore();return true;
  }
  function request(route){
    let entry=cache.get(route.id);
    if(!entry){
      const image=new Image();image.decoding='async';entry={image,used:0,failed:false};
      image.onerror=()=>{entry.failed=true;};cache.set(route.id,entry);image.src=route.source;
    }
    entry.used=++stamp;return entry;
  }
  const ready=e=>e&&!e.failed&&e.image.complete&&e.image.naturalWidth>0;
  function draw(target,frame){
    if(registry.enabled!==true)return false;
    let view;
    if(frame.driving){
      const route=registry.routes.find(r=>r.id===key(frame.driving.from,frame.driving.to));
      if(route)view={route,leg:frame.driving};
    }else view=stopped(frame.at,frame.recap,registry.routes);
    if(!view)return true;
    const current=request(view.route),node=frame.driving?frame.driving.to:frame.at;
    if(preloadKey!==node){
      preloadKey=node;
      registry.routes.filter(r=>r.from===node||r.to===node).slice(0,6).forEach(request);
    }
    const pinned=new Set([view.route.id,lastView?.route.id]);
    while(cache.size>8){
      const oldest=[...cache].filter(([id])=>!pinned.has(id)).sort((a,b)=>a[1].used-b[1].used)[0];
      if(!oldest)break;cache.delete(oldest[0]);
    }
    if(ready(current))lastView={route:view.route,leg:{...view.leg}};
    else if(lastView)view=lastView;
    const entry=cache.get(view.route.id);if(!ready(entry))return true;
    const {W,H,scale=2,dark=0,hour=12,wx='clear'}=frame;
    if(!layer){layer=document.createElement('canvas');layerCtx=layer.getContext('2d');}
    if(layer.width!==W*scale||layer.height!==H*scale){layer.width=W*scale;layer.height=H*scale;layerCtx.setTransform(scale,0,0,scale,0,0);}
    layerCtx.clearRect(0,0,W,H);
    if(!paint(layerCtx,entry.image,position(view.leg,view.route,W),{W,H}))return true;
    layerCtx.save();layerCtx.globalCompositeOperation='source-atop';
    layerCtx.fillStyle=`rgba(5,10,24,${dark*.78})`;layerCtx.fillRect(0,0,W,H);
    const dusk=Math.max(0,1-Math.abs(hour-18)/1.5)*(1-dark)*.13;
    if(dusk){layerCtx.fillStyle=`rgba(188,112,66,${dusk})`;layerCtx.fillRect(0,0,W,H);}
    if(wx==='fog'||wx==='dust'){layerCtx.fillStyle=wx==='fog'?'rgba(125,145,158,.18)':'rgba(147,126,92,.16)';layerCtx.fillRect(0,0,W,H);}
    layerCtx.restore();target.save();target.imageSmoothingEnabled=true;
    target.drawImage(layer,0,0,layer.width,layer.height,0,0,W,H);target.restore();return true;
  }
  return {key,position,stopped,paint,draw,active:()=>registry.enabled===true};
})();
