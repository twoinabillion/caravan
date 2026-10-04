/* Live terrain only. Sky, weather, the road, caravan and approach cues remain
   separate canvas layers. The build requires one alpha panorama per D.nodes id. */
const ROAD_ENVIRONMENT = (()=>{
  const sources=/*__ROAD_ENVIRONMENTS__*/{};
  const cache=new Map(),MAX_IMAGES=8;
  let stamp=0,lastReady='',preloadKey='',layer,nextScene,layerCtx,nextCtx;
  const ready=entry=>entry&&!entry.failed&&entry.image.complete&&entry.image.naturalWidth>0;
  function request(id){
    if(!sources[id]) return null;
    let entry=cache.get(id);
    if(!entry){
      const image=new Image();image.decoding='async';
      entry={image,failed:false,used:0};
      image.onerror=()=>{entry.failed=true;};
      cache.set(id,entry);image.src=sources[id];
    }
    entry.used=++stamp;
    return entry;
  }
  function prepare(state,edges){
    const from=request(state.from.id),to=request(state.to.id);
    const key=state.from.id+'>'+state.to.id;
    if(key!==preloadKey){
      preloadKey=key;
      // Only the current pair and nearby routes decode, not all 58 panoramas.
      const neighbours=(edges||[]).filter(e=>e[0]===state.to.id||e[1]===state.to.id)
        .map(e=>e[0]===state.to.id?e[1]:e[0]).slice(0,4);
      neighbours.forEach(request);
    }
    const pinned=new Set([state.from.id,state.to.id,lastReady]);
    while(cache.size>MAX_IMAGES){
      const candidate=[...cache].filter(([id])=>!pinned.has(id)).sort((a,b)=>a[1].used-b[1].used)[0];
      if(!candidate)break;
      cache.delete(candidate[0]);
    }
    return {from:ready(from)?from:null,to:ready(to)?to:null};
  }
  function buffers(W,H,scale){
    if(!layer){
      layer=document.createElement('canvas');nextScene=document.createElement('canvas');
      layerCtx=layer.getContext('2d');nextCtx=nextScene.getContext('2d');
    }
    if(layer.width!==W*scale||layer.height!==H*scale){
      for(const c of [layer,nextScene]){c.width=W*scale;c.height=H*scale;}
      layerCtx.setTransform(scale,0,0,scale,0,0);nextCtx.setTransform(scale,0,0,scale,0,0);
    }
  }
  function terrain(target,entry,{W,H,worldX,dark,hour,wx}){
    const image=entry.image,ground=Math.round(H*.72);
    const artH=Math.max(ground,W*image.naturalHeight/image.naturalWidth);
    const artW=artH*image.naturalWidth/image.naturalHeight;
    const scroll=worldX*.12,first=Math.floor(scroll/artW),offset=scroll-first*artW;
    layerCtx.clearRect(0,0,W,H);layerCtx.save();layerCtx.imageSmoothingEnabled=true;
    // Mirrored neighbours share identical edge pixels. Foreground moves faster
    // in SCENE; the distant landscape never replaces the moving road itself.
    for(let n=first,x=-offset;x<W;n++,x+=artW){
      layerCtx.save();layerCtx.translate(x+(n%2?artW:0),ground-artH);layerCtx.scale(n%2?-1:1,1);
      // Generated opaque surfaces retain ~1% alpha. Reinforce in the terrain
      // buffer so sunlight cannot bleed through hills; zero-alpha sky stays clear.
      layerCtx.drawImage(image,0,0,artW+.5,artH);
      layerCtx.drawImage(image,0,0,artW+.5,artH);layerCtx.restore();
    }
    // Tint existing terrain pixels only: never paint a rectangle over the sky.
    layerCtx.globalCompositeOperation='source-atop';
    layerCtx.fillStyle=`rgba(5,10,24,${dark*.78})`;layerCtx.fillRect(0,0,W,H);
    const dusk=Math.max(0,1-Math.abs(hour-18)/1.5)*(1-dark)*.13;
    if(dusk){layerCtx.fillStyle=`rgba(188,112,66,${dusk})`;layerCtx.fillRect(0,0,W,H);}
    if(wx==='fog'||wx==='dust'){
      layerCtx.fillStyle=wx==='fog'?'rgba(125,145,158,.18)':'rgba(147,126,92,.16)';layerCtx.fillRect(0,0,W,H);
    }
    layerCtx.restore();
    target.save();target.imageSmoothingEnabled=true;
    target.drawImage(layer,0,0,layer.width,layer.height,0,0,W,H);target.restore();
  }
  function draw(target,skyCanvas,frame){
    const {state,W,H,scale}=frame;
    const pair=prepare(state,frame.edges);
    buffers(W,H,scale);
    const fallback=cache.get(lastReady);
    // Decode delays keep the last detailed landscape. Never fall back to the
    // old block-building renderer. A cold start shows the shared sky briefly.
    const from=pair.from||pair.to||(ready(fallback)?fallback:null);
    const to=pair.to||from;
    if(!from)return;
    if(pair.from)lastReady=state.from.id;
    if(pair.to&&state.mix>=1)lastReady=state.to.id;
    if(state.mix<=0||from===to){terrain(target,from,frame);return;}
    if(state.mix>=1){terrain(target,to,frame);return;}
    // Copy ONE sky/celestial pass before adding the destination terrain.
    nextCtx.clearRect(0,0,W,H);
    nextCtx.drawImage(skyCanvas,0,0,skyCanvas.width,skyCanvas.height,0,0,W,H);
    terrain(nextCtx,to,frame);terrain(target,from,frame);
    // The destination enters from the right at full opacity. Copy its shared
    // sky too: transparent terrain must not expose the departing buildings.
    const edge=W*(1-state.mix);
    target.save();target.imageSmoothingEnabled=true;
    target.beginPath();target.rect(edge,0,W-edge,H);target.clip();
    target.drawImage(nextScene,0,0,nextScene.width,nextScene.height,0,0,W,H);target.restore();
  }
  return {draw};
})();
