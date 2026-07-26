/* ═══════════════════ V-WORLD 2D — 선택형 실측 지도 ═══════════════════
   인증키는 소스/빌드에 넣지 않고 이 브라우저의 localStorage에만 저장한다.
   API가 없거나 실패하면 아래 MAPR 자체 여정도가 항상 폴백으로 남는다. */
const VMAP = (()=>{
  const KEY_STORE='seoul400_vworld_key';
  const DOMAIN_STORE='seoul400_vworld_domain';
  let map=null, source=null, layer=null, mode='route', loading=false, lastSync=0, lastSig='';
  const styleCache=new Map();
  const q=(s)=>document.querySelector(s);

  function init(){
    const route=q('#map-mode-route'), exact=q('#map-mode-vworld');
    if(!route||!exact) return;
    route.onclick=()=>setRoute();
    exact.onclick=()=> mode==='vworld'?showSetup():activate();
    q('#vworld-cancel').onclick=()=>setRoute();
    q('#vworld-connect').onclick=()=>{
      const key=q('#vworld-key').value.trim();
      const domain=q('#vworld-domain').value.trim();
      connect(key,domain);
    };
    q('#vworld-domain').value=localStorage.getItem(DOMAIN_STORE)||location.hostname||'';
    q('#map-geo-status').textContent=`WGS84 · ${Object.keys(D.geo||{}).length}곳`;
    updateTabs();
  }

  function updateTabs(){
    const exact=mode==='vworld';
    q('#map-mode-route').classList.toggle('here',!exact);
    q('#map-mode-route').setAttribute('aria-selected',String(!exact));
    q('#map-mode-vworld').classList.toggle('here',exact);
    q('#map-mode-vworld').setAttribute('aria-selected',String(exact));
    q('#mapwrap').classList.toggle('vworld',exact&&!!map);
  }

  function setRoute(){
    mode='route';
    q('#vworld-setup').classList.remove('on');
    q('#nodecard').classList.remove('on');
    updateTabs();
    MAPR.resize();
  }

  function showSetup(msg=''){
    const saved=localStorage.getItem(KEY_STORE)||'';
    q('#vworld-key').value=saved;
    q('#vworld-domain').value=localStorage.getItem(DOMAIN_STORE)||location.hostname||'';
    q('#vworld-msg').textContent=msg;
    q('#vworld-setup').classList.add('on');
    setTimeout(()=>q('#vworld-key').focus(),50);
  }

  function activate(){
    const key=localStorage.getItem(KEY_STORE)||'';
    const domain=localStorage.getItem(DOMAIN_STORE)||location.hostname||'';
    if(!key){ showSetup(location.protocol==='file:'
      ? '로컬 파일은 인증 도메인이 없습니다. 배포 주소나 localhost용 키가 필요합니다.'
      : '발급받은 인증키를 입력해 주세요.'); return; }
    connect(key,domain);
  }

  async function connect(key,domain){
    const msg=q('#vworld-msg');
    if(!/^[A-Za-z0-9-]{8,80}$/.test(key)){
      showSetup('인증키 형식을 확인해 주세요.'); return;
    }
    if(!/^[A-Za-z0-9.:-]{1,255}$/.test(domain)){
      showSetup('등록 도메인은 https://와 경로를 빼고 호스트만 입력해 주세요.'); return;
    }
    if(loading) return;
    loading=true; msg.textContent='V-World 지도를 불러오는 중…';
    try{
      await loadSdk(key,domain);
      if(!map) createMap();
      localStorage.setItem(KEY_STORE,key);
      localStorage.setItem(DOMAIN_STORE,domain);
      q('#vworld-setup').classList.remove('on');
      mode='vworld'; updateTabs();
      if(map.updateSize) map.updateSize();
      resetView(); sync(true);
      q('#map-geo-status').textContent='V-WORLD · 실측 좌표';
    }catch(err){
      mode='route'; updateTabs();
      showSetup('연결하지 못했습니다. 키의 등록 도메인과 네트워크를 확인해 주세요.');
    }finally{ loading=false; }
  }

  function loadSdk(key,domain){
    if(window.vw&&vw.ol3&&window.ol) return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const old=document.getElementById('vworld-sdk');
      if(old) old.remove();
      const script=document.createElement('script');
      script.id='vworld-sdk';
      const url=new URL('https://map.vworld.kr/js/vworldMapInit.js.do');
      url.searchParams.set('version','2.0');
      url.searchParams.set('apiKey',key);
      url.searchParams.set('domain',domain);
      script.src=url.toString();
      script.async=true;
      script.referrerPolicy='strict-origin-when-cross-origin';
      const timer=setTimeout(()=>{ script.remove(); reject(new Error('timeout')); },15000);
      script.onload=()=>{ clearTimeout(timer);
        window.vw&&vw.ol3&&window.ol?resolve():reject(new Error('sdk')); };
      script.onerror=()=>{ clearTimeout(timer); script.remove(); reject(new Error('network')); };
      document.head.appendChild(script);
    });
  }

  function createMap(){
    const night=vw.ol3.BasemapType.GRAPHIC_NIGHT||vw.ol3.BasemapType.GRAPHIC;
    vw.ol3.MapOptions={
      basemapType:night,
      controlDensity:vw.ol3.DensityType.BASIC,
      interactionDensity:vw.ol3.DensityType.BASIC,
      controlsAutoArrange:true,
      homePosition:vw.ol3.CameraPosition,
      initPosition:vw.ol3.CameraPosition,
    };
    map=new vw.ol3.Map('vworld-map',vw.ol3.MapOptions);
    source=new ol.source.Vector();
    layer=new ol.layer.Vector({source,style:featureStyle});
    if(layer.setZIndex) layer.setZIndex(50);
    map.addLayer(layer);
    map.on('click',evt=>{
      let id=null;
      map.forEachFeatureAtPixel(evt.pixel,feature=>{
        const hit=feature.get('gameId');
        if(hit){ id=hit; return true; }
        return false;
      });
      UI.showNodeCard(id);
    });
  }

  function resetView(){
    if(!map) return;
    const center=ol.proj.transform([127.72,36.48],'EPSG:4326','EPSG:900913');
    map.getView().setCenter(center);
    map.getView().setZoom(7);
  }

  const merc=(coord)=>ol.proj.transform(coord,'EPSG:4326','EPSG:900913');
  function featureStyle(feature){
    const kind=feature.get('mapKind');
    if(kind==='road'){
      const state=feature.get('state'), grade=feature.get('grade');
      const color=state==='current'?'rgba(255,180,84,.96)':
        state==='next'?'rgba(255,180,84,.62)':
        state==='visited'?'rgba(205,215,235,.48)':'rgba(135,155,205,.38)';
      const width=state==='current'?3.6:state==='next'?3:2;
      const dash=grade==='rough'?[3,7]:grade==='normal'?[9,5]:undefined;
      const key=`road|${color}|${width}|${dash||''}`;
      if(!styleCache.has(key)) styleCache.set(key,new ol.style.Style({
        stroke:new ol.style.Stroke({color,width,lineDash:dash})
      }));
      return styleCache.get(key);
    }
    if(kind==='van'){
      const key='van';
      if(!styleCache.has(key)) styleCache.set(key,new ol.style.Style({
        image:new ol.style.RegularShape({points:4,radius:7,angle:Math.PI/4,
          fill:new ol.style.Fill({color:'#ffb454'}),
          stroke:new ol.style.Stroke({color:'rgba(255,240,205,.95)',width:1.5})}),
        zIndex:100,
      }));
      return styleCache.get(key);
    }
    const nodeKind=feature.get('nodeKind'), label=feature.get('label')||'';
    const here=feature.get('here'), next=feature.get('next'), visited=feature.get('visited');
    const quest=feature.get('quest');
    const fill=nodeKind==='goal'?'#55e0c8':here?'#ffb454':
      nodeKind==='settlement'?(visited?'#ffb454':'#c98d47'):
      nodeKind==='hidden'?'rgba(201,184,255,.2)':visited?'#aab4cf':'#66718f';
    const stroke=quest?'#ffcf78':next?'#ffb454':
      nodeKind==='hidden'?'#c9b8ff':'rgba(8,12,22,.95)';
    const radius=nodeKind==='goal'?6.5:nodeKind==='settlement'?5.5:nodeKind==='hidden'?5:4;
    const key=['node',nodeKind,label,here,next,visited,quest].join('|');
    if(!styleCache.has(key)){
      const image=nodeKind==='settlement'
        ? new ol.style.RegularShape({points:4,radius:radius+1,angle:Math.PI/4,
            fill:new ol.style.Fill({color:fill}),stroke:new ol.style.Stroke({color:stroke,width:next||quest?2:1.2})})
        : new ol.style.Circle({radius:here?radius+1:radius,
            fill:new ol.style.Fill({color:fill}),stroke:new ol.style.Stroke({color:stroke,width:here||next||quest?2:1.2})});
      styleCache.set(key,new ol.style.Style({
        image,
        text:label?new ol.style.Text({
          text:label,offsetY:-13,font:`${here||nodeKind==='goal'?'700':'600'} 11px sans-serif`,
          fill:new ol.style.Fill({color:nodeKind==='goal'?'#8df2e2':here?'#ffd195':'#e1e5ef'}),
          stroke:new ol.style.Stroke({color:'rgba(7,10,18,.95)',width:3}),
        }):undefined,
        zIndex:here?90:nodeKind==='goal'?80:nodeKind==='settlement'?70:60,
      }));
    }
    return styleCache.get(key);
  }

  function neighborSet(){
    const out=new Set();
    if(!S||S.driving||!S.at) return out;
    for(const e of D.edges){
      if(e[0]===S.at&&S.known.includes(e[1])) out.add(e[1]);
      if(e[1]===S.at&&S.known.includes(e[0])) out.add(e[0]);
    }
    return out;
  }

  function vanGeo(){
    if(!S) return null;
    if(S.driving){
      const a=D.geo[S.driving.from], b=D.geo[S.driving.to];
      if(!a||!b) return null;
      const f=clamp(S.driving.gone/S.driving.dist,0,1);
      return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];
    }
    return D.geo[S.at]||null;
  }

  function sync(force=false){
    if(!map||mode!=='vworld'||!S) return;
    const now=performance.now();
    if(!force&&now-lastSync<400) return;
    lastSync=now;
    const driving=S.driving?`${S.driving.from}:${S.driving.to}:${Math.round(S.driving.gone*5)}`:'';
    const sig=[S.at,driving,S.known.join(','),S.visited.join(','),S.quest&&S.quest.to].join('|');
    if(!force&&sig===lastSig) return;
    lastSig=sig;
    const features=[], nbrs=neighborSet();
    for(const e of D.edges){
      if(!S.known.includes(e[0])||!S.known.includes(e[1])) continue;
      const a=D.geo[e[0]], b=D.geo[e[1]]; if(!a||!b) continue;
      const current=S.driving&&((S.driving.from===e[0]&&S.driving.to===e[1])||
        (S.driving.from===e[1]&&S.driving.to===e[0]));
      const next=!S.driving&&(e[0]===S.at||e[1]===S.at)&&(nbrs.has(e[0])||nbrs.has(e[1]));
      const visited=S.visited.includes(e[0])&&S.visited.includes(e[1]);
      const f=new ol.Feature({geometry:new ol.geom.LineString([merc(a),merc(b)])});
      f.setProperties({mapKind:'road',grade:e[3],state:current?'current':next?'next':visited?'visited':'known'});
      features.push(f);
    }
    for(const id of S.known){
      const n=D.nodes[id], coord=D.geo[id]; if(!n||!coord) continue;
      const here=S.at===id, next=nbrs.has(id), visited=S.visited.includes(id);
      const nodeKind=n.type==='goal'?'goal':(n.stl||n.type==='settlement')?'settlement':
        n.type==='hidden'?'hidden':'normal';
      const label=here||next||nodeKind==='goal'||nodeKind==='settlement'||nodeKind==='hidden'
        ? n.name.split(' ')[0]:'';
      const f=new ol.Feature({geometry:new ol.geom.Point(merc(coord))});
      f.setProperties({mapKind:'node',gameId:id,nodeKind,label,here,next,visited,
        quest:!!(S.quest&&S.quest.to===id)});
      features.push(f);
    }
    const van=vanGeo();
    if(van){
      const f=new ol.Feature({geometry:new ol.geom.Point(merc(van))});
      f.setProperties({mapKind:'van'});
      features.push(f);
    }
    source.clear();
    source.addFeatures(features);
  }

  function onOpen(){
    q('#map-geo-status').textContent=mode==='vworld'&&map
      ?'V-WORLD · 실측 좌표':`WGS84 · ${Object.keys(D.geo||{}).length}곳`;
    if(map&&mode==='vworld'){ setTimeout(()=>{ map.updateSize&&map.updateSize(); sync(true); },50); }
  }
  const active=()=>mode==='vworld'&&!!map;
  return {init,onOpen,active,sync,setRoute,resetView};
})();

/* ═══════════════════ MAP ═══════════════════ */
const MAPR = (()=>{
  let cv, ctx, W=0, H=0, DPR=1, tf={s:1,ox:0,oy:0}, t=0;
  let fogCv=null;

  const geo=(lon,lat)=>D.projectGeo([lon,lat]);
  /* 한반도 남부 해안선 — WGS84를 자체 지도공간 600×760에 투영.
     게임용으로 단순화했지만 도시 좌표·V-World 배경과 같은 축을 쓴다. */
  const COAST_GEO = [
    /* 휴전선 (서→동, 동쪽이 약간 더 북) */
    [126.16,37.78],[126.35,37.82],[126.60,37.96],[126.90,38.00],[127.20,38.12],
    [127.50,38.30],[127.80,38.32],[128.10,38.28],[128.35,38.45],[128.60,38.58],
    /* 동해안 (북→남) */
    [128.58,38.25],[128.73,38.00],[128.90,37.75],[129.12,37.30],[129.30,36.80],
    [129.43,36.35],[129.50,36.05],[129.45,35.80],[129.32,35.55],[129.20,35.30],
    [129.05,35.12],
    /* 남해안 (동→서) */
    [128.85,34.95],[128.60,34.82],[128.30,34.85],[128.05,34.78],[127.82,34.72],
    [127.58,34.82],[127.35,34.75],[127.10,34.70],[126.85,34.72],[126.60,34.70],
    [126.35,34.75],[126.18,34.90],
    /* 서해안 (남→북) */
    [126.28,35.15],[126.38,35.40],[126.52,35.62],[126.48,35.85],[126.63,36.05],
    [126.45,36.25],[126.28,36.45],[126.15,36.65],[126.32,36.82],[126.48,37.00],
    [126.58,37.20],[126.45,37.42],[126.28,37.55],
  ];
  const COAST=COAST_GEO.map(([lon,lat])=>geo(lon,lat));
  /* 섬들 (장식) — [x,y,rx,ry] */
  const ISLES = [
    [...geo(128.62,34.85),9,4],[...geo(127.90,34.80),10,4],
    [...geo(126.75,34.32),8,3],[...geo(126.25,34.48),8,3],[...geo(127.35,34.55),5,2],
    [...geo(125.90,35.05),3,1.6],[...geo(126.05,35.45),2.5,1.4],
    [...geo(126.10,35.85),3,1.6],[...geo(126.02,36.25),2.5,1.4],
    [...geo(126.18,36.65),3,1.6],
    [556,150,4,2],[566,156,1.5,1],                                            // 울릉도·독도
  ];
  /* 백두대간·소백산맥 능선 (장식) */
  const RIDGE = [
    [[128.58,38.20],[128.58,37.80],[128.50,37.40],[128.32,37.00],[128.18,36.60],[128.02,36.20]].map(p=>geo(...p)),
    [[128.02,36.20],[127.90,36.00],[127.70,35.80],[127.50,35.60],[127.30,35.40]].map(p=>geo(...p)),
  ];
  const DMZ=[[126.18,37.76],[126.55,37.88],[126.95,38.00],[127.35,38.20],
    [127.80,38.30],[128.20,38.34],[128.58,38.52]].map(p=>geo(...p));

  function init(canvas){
    cv=canvas; ctx=cv.getContext('2d');
    new ResizeObserver(resize).observe(cv);
    resize();
    cv.addEventListener('click', onClick);
  }
  function resize(){
    DPR=Math.min(2,window.devicePixelRatio||1);
    W=cv.clientWidth; H=cv.clientHeight;
    if(!W||!H) return;
    cv.width=W*DPR; cv.height=H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0);
    const bx0=178,bx1=532,by0=96,by1=672;         // 지도 좌표 실측 bounds
    const WIDEN=1.2;                               // 한반도 실제 비율 보정
    const s=Math.min((W-64)/((bx1-bx0)*WIDEN), (H-96)/(by1-by0));
    tf.sx=s*WIDEN; tf.sy=s; tf.s=s;
    tf.ox=(W-(bx1-bx0)*tf.sx)/2 - bx0*tf.sx;
    tf.oy=(H-(by1-by0)*tf.sy)/2 - by0*tf.sy + 4;
  }
  const px=(x)=>x*tf.sx+tf.ox, py=(y)=>y*tf.sy+tf.oy;

  function vanPos(){
    if(!S) return null;
    if(S.driving){ const a=D.nodes[S.driving.from], b=D.nodes[S.driving.to], f=S.driving.gone/S.driving.dist;
      return [a.x+(b.x-a.x)*f, a.y+(b.y-a.y)*f]; }
    const n=D.nodes[S.at]; return [n.x,n.y];
  }

  function draw(dt){
    if(VMAP.active()){ VMAP.sync(); return; }
    if(!ctx||!W) return; t+=dt;
    ctx.clearRect(0,0,W,H);
    /* 바다 — 은은한 심도 그라데이션 */
    const sea=ctx.createLinearGradient(0,0,0,H);
    sea.addColorStop(0,'#0a0f22'); sea.addColorStop(1,'#080c1a');
    ctx.fillStyle=sea; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(85,120,180,0.045)'; ctx.lineWidth=1;
    for(let x=0;x<W;x+=26){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for(let y=0;y<H;y+=26){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    /* 물결 잔선 (반짝임) */
    const wavePts=[[168,200],[560,300],[170,540],[540,560],[560,120],[240,700],[430,700],[170,640]];
    wavePts.forEach((wp,i)=>{ const a=0.10+0.08*Math.sin(t*1.3+i*1.9); if(a<=0.11) return;
      ctx.strokeStyle=`rgba(140,175,225,${a})`;
      ctx.beginPath(); ctx.moveTo(px(wp[0]),py(wp[1])); ctx.lineTo(px(wp[0]+14),py(wp[1])); ctx.stroke(); });
    /* 해안선 경로 (부드러운 곡선) */
    const coastPath=()=>{ ctx.beginPath();
      const n=COAST.length;
      const mx=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
      let m0=mx(COAST[n-1],COAST[0]);
      ctx.moveTo(px(m0[0]),py(m0[1]));
      for(let i=0;i<n;i++){ const p=COAST[i], m=mx(p,COAST[(i+1)%n]);
        ctx.quadraticCurveTo(px(p[0]),py(p[1]),px(m[0]),py(m[1])); }
      ctx.closePath(); };
    /* 해안 글로우 (물가 하이라이트) */
    coastPath();
    ctx.strokeStyle='rgba(110,160,215,0.22)'; ctx.lineWidth=5; ctx.stroke();
    /* 육지 */
    coastPath();
    const land=ctx.createLinearGradient(0,py(78),0,py(668));
    land.addColorStop(0,'#182138'); land.addColorStop(1,'#121a2c');
    ctx.fillStyle=land; ctx.fill();
    ctx.strokeStyle='#31446e'; ctx.lineWidth=1.5; ctx.stroke();
    /* 백두대간 능선 음영 */
    ctx.strokeStyle='rgba(60,80,125,0.5)'; ctx.lineWidth=1;
    RIDGE.forEach(seg=>{ ctx.beginPath();
      seg.forEach((p,i)=> i?ctx.lineTo(px(p[0]),py(p[1])):ctx.moveTo(px(p[0]),py(p[1]))); ctx.stroke(); });
    RIDGE.forEach(seg=>{ seg.forEach((p,i)=>{ if(i%2) return;      // 봉우리 ▲
      ctx.strokeStyle='rgba(75,98,145,0.55)';
      ctx.beginPath(); ctx.moveTo(px(p[0])-2,py(p[1])+2); ctx.lineTo(px(p[0]),py(p[1])-1); ctx.lineTo(px(p[0])+2,py(p[1])+2); ctx.stroke(); }); });
    /* 섬들 */
    ISLES.forEach(([ix,iy,rx,ry])=>{
      ctx.beginPath(); ctx.ellipse(px(ix),py(iy),Math.max(1.5,rx*tf.sx),Math.max(1,ry*tf.sy),0,0,7);
      ctx.fillStyle='#141c30'; ctx.fill(); ctx.strokeStyle='rgba(90,120,175,0.5)'; ctx.lineWidth=1; ctx.stroke(); });
    /* 휴전선 */
    ctx.setLineDash([5,4]); ctx.strokeStyle='rgba(226,87,79,0.4)'; ctx.lineWidth=1.2;
    ctx.beginPath();
    DMZ.forEach((p,i)=>i?ctx.lineTo(px(p[0]),py(p[1])):ctx.moveTo(px(p[0]),py(p[1])));
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='rgba(226,120,110,0.45)'; ctx.font='8px monospace';
    const dmzLabel=geo(127.05,38.12);
    ctx.fillText('─ 휴전선 ─', px(dmzLabel[0]), py(dmzLabel[1])-6);
    // 제주
    ctx.beginPath(); ctx.ellipse(px(288),py(714),40*tf.sx,13*tf.sy,0,0,7);
    ctx.fillStyle='#141c30'; ctx.fill(); ctx.strokeStyle='rgba(90,120,175,0.5)'; ctx.stroke();
    ctx.fillStyle='rgba(120,150,200,0.4)'; ctx.beginPath(); ctx.ellipse(px(288),py(712),4*tf.sx,2*tf.sy,0,0,7); ctx.fill(); // 한라산
    ctx.fillStyle='rgba(120,150,200,0.35)'; ctx.font='9px sans-serif'; ctx.textAlign='center';
    ctx.fillText('제주', px(288), py(714)+18); ctx.textAlign='left';
    // 바다 이름
    ctx.fillStyle='rgba(120,150,200,0.28)'; ctx.font=`${9*tf.s+6}px serif`;
    const eastSea=geo(129.56,37.55), westSea=geo(125.82,36.55), southSea=geo(127.45,34.54);
    ctx.fillText('동', px(eastSea[0]), py(eastSea[1])); ctx.fillText('해', px(eastSea[0]), py(eastSea[1])+16);
    ctx.fillText('서', px(westSea[0]), py(westSea[1])); ctx.fillText('해', px(westSea[0]), py(westSea[1])+16);
    ctx.fillText('남   해', px(southSea[0]), py(southSea[1]));

    /* 인접 노드 (지금 갈 수 있는 곳) */
    const nbrs=new Set();
    if(S && !S.driving && S.at){
      for(const e of D.edges){
        if(e[0]===S.at && S.known.includes(e[1])) nbrs.add(e[1]);
        if(e[1]===S.at && S.known.includes(e[0])) nbrs.add(e[0]);
      }
    }

    /* 도로 (edges) */
    for(const e of D.edges){
      const known = S && S.known.includes(e[0]) && S.known.includes(e[1]);
      if(!known) continue;
      const a=D.nodes[e[0]], b=D.nodes[e[1]];
      const cur = S.driving && ((S.driving.from===e[0]&&S.driving.to===e[1])||(S.driving.from===e[1]&&S.driving.to===e[0]));
      const next = !S.driving && (e[0]===S.at||e[1]===S.at) && (nbrs.has(e[0])||nbrs.has(e[1]));
      ctx.beginPath(); ctx.moveTo(px(a.x),py(a.y)); ctx.lineTo(px(b.x),py(b.y));
      ctx.setLineDash(e[3]==='rough'?[4,5]: e[3]==='normal'?[8,4]:[]);
      ctx.strokeStyle= cur? 'rgba(255,180,84,0.9)':
        next? 'rgba(255,180,84,0.5)':
        (S&&S.visited.includes(e[0])&&S.visited.includes(e[1]))? 'rgba(180,190,220,0.4)':'rgba(120,135,180,0.3)';
      ctx.lineWidth=cur?2.4: next?2:1.6;
      ctx.stroke(); ctx.setLineDash([]);
    }

    /* 노드 — 1패스: 심볼 */
    if(S) for(const id of S.known){
      const n=D.nodes[id]; const x=px(n.x), y=py(n.y);
      const visited=S.visited.includes(id);
      const here = S.at===id;
      if(n.type==='goal'){
        const pulse=0.5+0.5*Math.sin(t*2.4);
        ctx.strokeStyle=`rgba(85,224,200,${0.25+0.45*pulse})`; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(x,y,8+pulse*7,0,7); ctx.stroke();
        ctx.fillStyle='#55e0c8';
        ctx.beginPath(); ctx.arc(x,y,4.5,0,7); ctx.fill();
      } else if(n.stl||n.type==='settlement'){
        ctx.fillStyle= visited? '#ffb454':'#c98d47';
        ctx.save(); ctx.translate(x,y); ctx.rotate(Math.PI/4);
        ctx.fillRect(-4.4,-4.4,8.8,8.8); ctx.restore();
      } else if(n.type==='hidden'){
        ctx.strokeStyle='#c9b8ff'; ctx.setLineDash([2.5,2.5]); ctx.lineWidth=1.4;
        ctx.beginPath(); ctx.arc(x,y,5.6,0,7); ctx.stroke(); ctx.setLineDash([]);
        if(!visited){ ctx.fillStyle='#c9b8ff'; ctx.font='700 8px monospace'; ctx.textAlign='center';
          ctx.fillText('?',x,y+3); ctx.textAlign='left'; }
        else { ctx.fillStyle='#c9b8ff'; ctx.beginPath(); ctx.arc(x,y,2.6,0,7); ctx.fill(); }
      } else {
        ctx.fillStyle= visited? '#9aa5c4':'#5a6484';
        ctx.beginPath(); ctx.arc(x,y,3.6,0,7); ctx.fill();
      }
      /* 인접(이동 가능) 링 */
      if(nbrs.has(id)){
        ctx.strokeStyle=`rgba(255,180,84,${0.35+0.25*Math.sin(t*2.6)})`; ctx.lineWidth=1.3;
        ctx.beginPath(); ctx.arc(x,y,7.5,0,7); ctx.stroke();
      }
      if(here){ ctx.strokeStyle='rgba(255,180,84,0.8)'; ctx.lineWidth=1.6;
        ctx.beginPath(); ctx.arc(x,y,9+Math.sin(t*3)*1.6,0,7); ctx.stroke(); }
    }

    /* 노드 — 2패스: 라벨 (우선순위순, 겹치면 아래로, 그래도 겹치면 생략) */
    if(S){
      const placed=[];
      const putLabel=(x,y,txt,font,fill)=>{
        ctx.font=font;
        const w=ctx.measureText(txt).width+4;
        for(const dy of [-9,15]){
          const bx={x0:x-w/2, x1:x+w/2, y0:y+dy-9, y1:y+dy+3};
          if(bx.y0<26) continue;   // 상단 헤더 침범 방지
          if(placed.some(p=>p.x0<bx.x1&&bx.x0<p.x1&&p.y0<bx.y1&&bx.y0<p.y1)) continue;
          placed.push(bx);
          ctx.fillStyle=fill; ctx.textAlign='center';
          ctx.fillText(txt, x, y+dy);
          ctx.textAlign='left';
          return true;
        }
        return false;
      };
      const prio=(id)=>{ const n=D.nodes[id];
        if(S.at===id) return 0;
        if(n.type==='goal') return 1;
        if(n.stl) return 2;
        if(nbrs.has(id)) return 3;
        if(n.type==='hidden') return 4;
        if(S.visited.includes(id)) return 5;
        return 6; };
      const order=[...S.known].sort((a,b)=>prio(a)-prio(b));
      for(const id of order){
        const n=D.nodes[id]; const x=px(n.x), y=py(n.y);
        const p=prio(id);
        if(p===6 && tf.s<0.9) continue;             // 미방문 일반 노드는 작은 화면에선 점만
        const bold = p<=2;
        const font=`${bold?'700 ':''}${p<=3?10:9.5}px sans-serif`;
        const fill= n.type==='goal'? 'rgba(85,224,200,0.95)':
          S.at===id? 'rgba(255,200,120,0.98)':
          n.stl? 'rgba(240,225,195,0.95)':
          nbrs.has(id)? 'rgba(255,190,110,0.9)':
          n.type==='hidden'? 'rgba(201,184,255,0.8)': 'rgba(160,170,200,0.7)';
        putLabel(x,y,n.name.split(' ')[0],font,fill);
      }
    }

    /* 의뢰 목적지 마커 */
    if(S && S.quest && S.known.includes(S.quest.to)){
      const q=S.quest, n=D.nodes[q.to], x=px(n.x), y=py(n.y);
      const pulse=0.5+0.5*Math.sin(t*2.8);
      ctx.strokeStyle=`rgba(255,180,84,${0.35+0.4*pulse})`;
      ctx.setLineDash([3,3]); ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(x,y,11+pulse*2,0,7); ctx.stroke(); ctx.setLineDash([]);
      ctx.font='10px sans-serif'; ctx.textAlign='center';
      ctx.fillText((G.QKIND[q.kind]||G.QKIND.deliver).ic, x+13, y-8);
      ctx.textAlign='left';
    }

    /* 차 위치 */
    const vp=vanPos();
    if(vp){ const x=px(vp[0]), y=py(vp[1]);
      ctx.fillStyle='#ffb454';
      ctx.save(); ctx.translate(x,y);
      ctx.shadowColor='#ffb454'; ctx.shadowBlur=10;
      ctx.beginPath(); ctx.roundRect(-5,-3.4,10,6.8,2); ctx.fill();
      ctx.restore();
    }
    /* 범례 */
    ctx.font='9px monospace'; ctx.fillStyle='rgba(140,150,180,0.55)';
    ctx.fillText('◆ 정착지  ● 폐허  ◌? 미확인  ⊙ 지금 갈 수 있는 곳', 12, H-22);
    ctx.fillText('─ 고속 · ╌ 국도 · ┄ 험로   (지명을 누르면 상세)', 12, H-10);
  }

  function onClick(ev){
    if(!S) return;
    const r=cv.getBoundingClientRect();
    const mx=ev.clientX-r.left, my=ev.clientY-r.top;
    let best=null, bd=24;
    for(const id of S.known){ const n=D.nodes[id];
      const d=Math.hypot(px(n.x)-mx, py(n.y)-my);
      if(d<bd){ bd=d; best=id; } }
    UI.showNodeCard(best);
  }

  /* ── 미니맵 (스테이지 상시 표시) ── */
  let mcv=null, mctx=null, mt=0;
  function initMini(canvas){
    mcv=canvas; mctx=mcv.getContext('2d');
    const fit=()=>{ const d=Math.min(2,window.devicePixelRatio||1);
      mcv.width=(mcv.clientWidth||92)*d; mcv.height=(mcv.clientHeight||122)*d;
      mctx.setTransform(d,0,0,d,0,0); };
    new ResizeObserver(fit).observe(mcv); fit();
  }
  function drawMini(dt){
    if(!mctx||!S) return; mt+=dt;
    const w=mcv.clientWidth||92, h=mcv.clientHeight||122;
    const bx0=178,bx1=532,by0=96,by1=672, WIDEN=1.12;
    const s=Math.min((w-12)/((bx1-bx0)*WIDEN), (h-14)/(by1-by0));
    const sx=s*WIDEN, sy=s;
    const ox=(w-(bx1-bx0)*sx)/2 - bx0*sx;
    const oy=(h-(by1-by0)*sy)/2 - by0*sy + 2;
    const mpx=(x)=>x*sx+ox, mpy=(y)=>y*sy+oy;
    mctx.clearRect(0,0,w,h);
    /* 육지 */
    mctx.beginPath();
    COAST.forEach((p,i)=> i?mctx.lineTo(mpx(p[0]),mpy(p[1])):mctx.moveTo(mpx(p[0]),mpy(p[1])));
    mctx.closePath();
    mctx.fillStyle='rgba(24,33,58,0.85)'; mctx.fill();
    mctx.strokeStyle='rgba(70,95,150,0.7)'; mctx.lineWidth=1; mctx.stroke();
    /* 알려진 노드 */
    for(const id of S.known){ const n=D.nodes[id];
      const x=mpx(n.x), y=mpy(n.y);
      if(n.type==='goal'){ mctx.fillStyle=`rgba(85,224,200,${0.6+0.4*Math.sin(mt*2.4)})`;
        mctx.fillRect(x-1.5,y-1.5,3,3); continue; }
      mctx.fillStyle= S.visited.includes(id)? 'rgba(255,180,84,0.9)':
        n.stl? 'rgba(201,141,71,0.8)':'rgba(120,132,170,0.55)';
      mctx.fillRect(x-1,y-1, n.stl?2.4:1.8, n.stl?2.4:1.8);
    }
    /* 현재 이동 경로 */
    if(S.driving){ const a=D.nodes[S.driving.from], b=D.nodes[S.driving.to];
      mctx.strokeStyle='rgba(255,180,84,0.8)'; mctx.lineWidth=1.2;
      mctx.setLineDash([2,2]);
      mctx.beginPath(); mctx.moveTo(mpx(a.x),mpy(a.y)); mctx.lineTo(mpx(b.x),mpy(b.y)); mctx.stroke();
      mctx.setLineDash([]);
    }
    /* 차 위치 */
    const vp = S.driving
      ? [D.nodes[S.driving.from].x+(D.nodes[S.driving.to].x-D.nodes[S.driving.from].x)*(S.driving.gone/S.driving.dist),
         D.nodes[S.driving.from].y+(D.nodes[S.driving.to].y-D.nodes[S.driving.from].y)*(S.driving.gone/S.driving.dist)]
      : (S.at? [D.nodes[S.at].x, D.nodes[S.at].y]:null);
    if(vp){ const x=mpx(vp[0]), y=mpy(vp[1]);
      const pulse=0.5+0.5*Math.sin(mt*3.2);
      mctx.strokeStyle=`rgba(255,180,84,${0.25+0.4*pulse})`;
      mctx.beginPath(); mctx.arc(x,y,3.5+pulse*2.5,0,7); mctx.stroke();
      mctx.fillStyle='#ffb454';
      mctx.shadowColor='#ffb454'; mctx.shadowBlur=5;
      mctx.fillRect(x-2,y-1.4,4,2.8);
      mctx.shadowBlur=0;
    }
    /* 날씨 아이콘 + 남은 거리 */
    const wx=D.wx[S.wx]||D.wx.clear;
    mctx.font='10px sans-serif';
    mctx.fillText(wx.ic, 4, 12);
    mctx.font='700 8px ui-monospace,monospace';
    mctx.fillStyle='rgba(232,227,213,0.85)';
    mctx.textAlign='right';
    mctx.fillText(G.remainKm()+'km', w-4, h-5);
    mctx.textAlign='left';
    mctx.fillStyle='rgba(140,150,180,0.7)';
    mctx.font='7px ui-monospace,monospace';
    mctx.fillText('N', w-9, 10);
    mctx.strokeStyle='rgba(140,150,180,0.5)';
    mctx.beginPath(); mctx.moveTo(w-6.5,12); mctx.lineTo(w-6.5,17); mctx.stroke();
    mctx.beginPath(); mctx.moveTo(w-8.5,14); mctx.lineTo(w-6.5,12); mctx.lineTo(w-4.5,14); mctx.stroke();
  }

  return {init, draw, resize, initMini, drawMini};
})();

/* ═══════════════════ JOURNAL GRAPH ═══════════════════ */
const GRAPH = (()=>{
  let cv, ctx, W=0,H=0,DPR=1, nodes=[], links=[], t=0, selected=null;
  const COLOR={인물:'#e8a0bf',장소:'#8fc7ff',사건:'#ffb454',소문:'#c9b8ff'};

  function init(canvas){
    cv=canvas; ctx=cv.getContext('2d');
    new ResizeObserver(resize).observe(cv);
    cv.addEventListener('click', onClick);
  }
  function resize(){
    DPR=Math.min(2,window.devicePixelRatio||1);
    W=cv.clientWidth; H=cv.clientHeight;
    if(!W||!H) return;
    cv.width=W*DPR; cv.height=H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  function build(){
    resize();
    const notes = S? S.notes.slice(-46):[];
    const old = Object.fromEntries(nodes.map(n=>[n.title,n]));
    nodes = notes.map((n,i)=>{
      const o=old[n.title];
      return {note:n, title:n.title, type:n.type,
        x:o?o.x: W/2+Math.cos(i*2.4)*(40+i*3), y:o?o.y: H/2+Math.sin(i*2.4)*(40+i*3),
        vx:0, vy:0, r: n.type==='인물'?9: n.type==='장소'?7:6}; });
    const idx = Object.fromEntries(nodes.map((n,i)=>[n.title,i]));
    links=[];
    nodes.forEach((n,i)=>{ n.note.links.forEach(l=>{
      if(idx[l]!==undefined && idx[l]!==i) links.push([i,idx[l]]); }); });
    selected=null;
  }
  function physics(){
    for(let i=0;i<nodes.length;i++){
      const a=nodes[i];
      a.vx += (W/2-a.x)*0.0018; a.vy += (H/2-a.y)*0.0018;
      for(let j=i+1;j<nodes.length;j++){
        const b=nodes[j];
        let dx=a.x-b.x, dy=a.y-b.y; let d2=dx*dx+dy*dy;
        if(d2<1) { dx=Math.random()-.5; dy=Math.random()-.5; d2=1; }
        const d=Math.sqrt(d2);
        if(d<110){ const f=(110-d)/d*0.03;
          a.vx+=dx*f; a.vy+=dy*f; b.vx-=dx*f; b.vy-=dy*f; }
      }
    }
    for(const [i,j] of links){
      const a=nodes[i], b=nodes[j];
      const dx=b.x-a.x, dy=b.y-a.y, d=Math.hypot(dx,dy)||1;
      const f=(d-70)/d*0.02;
      a.vx+=dx*f; a.vy+=dy*f; b.vx-=dx*f; b.vy-=dy*f;
    }
    for(const n of nodes){
      n.x=Math.max(20,Math.min(W-20,n.x+n.vx)); n.y=Math.max(20,Math.min(H-30,n.y+n.vy));
      n.vx*=0.82; n.vy*=0.82;
    }
  }
  function draw(dt){
    if(!ctx||!W||!nodes.length){ if(ctx&&W){ ctx.clearRect(0,0,W,H);
      ctx.fillStyle='rgba(140,150,180,0.5)'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('아직 기록이 없다. 여행이 이야기를 만든다.', W/2, H/2); ctx.textAlign='left'; } return; }
    t+=dt; physics();
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0b0e1a'; ctx.fillRect(0,0,W,H);
    // links
    ctx.strokeStyle='rgba(120,140,190,0.28)'; ctx.lineWidth=1;
    for(const [i,j] of links){ ctx.beginPath();
      ctx.moveTo(nodes[i].x,nodes[i].y); ctx.lineTo(nodes[j].x,nodes[j].y); ctx.stroke(); }
    // nodes
    for(const n of nodes){
      const c=COLOR[n.type]||'#aaa';
      if(n===selected){ ctx.strokeStyle=c; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(n.x,n.y,n.r+4+Math.sin(t*3)*1.5,0,7); ctx.stroke(); }
      ctx.fillStyle=c;
      ctx.globalAlpha=0.9;
      ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,7); ctx.fill();
      ctx.globalAlpha=1;
      ctx.fillStyle='rgba(232,227,213,0.85)'; ctx.font='10px sans-serif'; ctx.textAlign='center';
      const label = n.title.length>9? n.title.slice(0,9)+'…':n.title;
      ctx.fillText(label, n.x, n.y+n.r+11);
      ctx.textAlign='left';
    }
  }
  function onClick(ev){
    const r=cv.getBoundingClientRect();
    const mx=ev.clientX-r.left, my=ev.clientY-r.top;
    let best=null,bd=26;
    for(const n of nodes){ const d=Math.hypot(n.x-mx,n.y-my);
      if(d<bd){ bd=d; best=n; } }
    selected=best;
    UI.showGraphNote(best? best.note : null);
  }
  return {init, build, draw};
})();
