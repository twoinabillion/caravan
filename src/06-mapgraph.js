/* ═══════════════════ ILLUSTRATED JOURNEY MAP ═══════════════════
   외부 지도 SDK 없이 실제 좌표 위에 게임 경로와 지형의 기억을 그린다. */
/* ═══════════════════ MAP ═══════════════════ */
const MAPR = (()=>{
  let cv, ctx, W=0, H=0, DPR=1, tf={s:1,ox:0,oy:0}, t=0, selectedNode=null;
  const geo=(lon,lat)=>D.projectGeo([lon,lat]);
  /* 한반도 남부 해안선 — WGS84를 자체 지도공간 600×760에 투영.
     게임용으로 단순화했지만 모든 도시와 여행 경로가 같은 축을 쓴다. */
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
  /* 지리는 방향을 알려 주는 배경이어야 한다. 화면에는 실제 여행에서 기준이 되는
     주요 도시만 상시 표시하고, 작은 경유지는 현재 위치나 다음 길일 때만 이름을 보인다. */
  const CITY_IDS=new Set([
    'seoul','suwon','daejeon','sejong','cheongju','daegu','jeonju','gwangju',
    'busan','ulsan','pohang','gyeongju','gunsan','mokpo','yeosu','wonju','gangneung','sokcho'
  ]);
  const edgeKey=(a,b)=>a<b?`${a}|${b}`:`${b}|${a}`;
  function shortestPath(start,target){
    if(!S||!start||!target||!D.nodes[start]||!D.nodes[target]) return null;
    if(start===target) return {nodes:[start],km:0,segments:0,names:[D.nodes[start].name]};
    const known=new Set(S.known||[]), dist={}, prev={}, open=new Set([...known,start,target]);
    for(const id of open) dist[id]=Infinity;
    dist[start]=0;
    while(open.size){
      let cur=null,best=Infinity;
      for(const id of open) if((dist[id]??Infinity)<best){ best=dist[id]; cur=id; }
      if(cur===null||best===Infinity) break;
      open.delete(cur);
      if(cur===target) break;
      for(const e of D.edges){
        let next=null;
        if(e[0]===cur) next=e[1]; else if(e[1]===cur) next=e[0];
        if(!next||!known.has(next)||!open.has(next)) continue;
        const nd=best+(Number(e[2])||1);
        if(nd<dist[next]){ dist[next]=nd; prev[next]=cur; }
      }
    }
    if(!Number.isFinite(dist[target])) return null;
    const nodes=[target];
    while(nodes[0]!==start){ const p=prev[nodes[0]]; if(!p) return null; nodes.unshift(p); }
    return {nodes,km:Math.round(dist[target]),segments:nodes.length-1,names:nodes.map(id=>D.nodes[id].name)};
  }
  function pathTo(target){
    if(!S||!target) return null;
    const start=S.driving?S.driving.to:S.at;
    return shortestPath(start,target);
  }
  const pathEdges=path=>new Set(path&&path.nodes?path.nodes.slice(1).map((id,i)=>edgeKey(path.nodes[i],id)):[]);

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
    if(!ctx||!W) return; t+=dt;
    ctx.clearRect(0,0,W,H);
    const navigatorMode=!!(cv.closest&&cv.closest('.map-navigator'));
    /* 바다 — 윤곽과 도시가 먼저 읽히도록 장식 격자와 물결은 쓰지 않는다. */
    const sea=ctx.createLinearGradient(0,0,0,H);
    sea.addColorStop(0,navigatorMode?'#031c1d':'#0a0f22'); sea.addColorStop(1,navigatorMode?'#021112':'#080c1a');
    ctx.fillStyle=sea; ctx.fillRect(0,0,W,H);
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
    ctx.strokeStyle=navigatorMode?'rgba(82,190,181,0.18)':'rgba(110,160,215,0.18)'; ctx.lineWidth=6; ctx.stroke();
    /* 육지 */
    coastPath();
    const land=ctx.createLinearGradient(0,py(78),0,py(668));
    land.addColorStop(0,navigatorMode?'#0c3130':'#182138'); land.addColorStop(1,navigatorMode?'#092221':'#121a2c');
    ctx.fillStyle=land; ctx.fill();
    ctx.strokeStyle=navigatorMode?'#397a74':'#3a4e78'; ctx.lineWidth=1.8; ctx.stroke();
    /* 제주는 방향 기준으로만 남긴다. */
    ctx.beginPath(); ctx.ellipse(px(288),py(714),40*tf.sx,13*tf.sy,0,0,7);
    ctx.fillStyle=navigatorMode?'#0b2928':'#141c30'; ctx.fill(); ctx.strokeStyle=navigatorMode?'rgba(79,159,151,.5)':'rgba(90,120,175,0.5)'; ctx.stroke();

    /* 인접 노드 (지금 갈 수 있는 곳) */
    const nbrs=new Set();
    if(S && !S.driving && S.at){
      for(const e of D.edges){
        if(e[0]===S.at && S.known.includes(e[1])) nbrs.add(e[1]);
        if(e[1]===S.at && S.known.includes(e[0])) nbrs.add(e[0]);
      }
    }

    const selectedPath=pathTo(selectedNode), selectedEdges=pathEdges(selectedPath);
    const activeRouteEdges=new Set();
    const route=S&&S.routePlan&&S.routePlan.status==='active'&&D.routePlans&&D.routePlans[S.routePlan.id];
    if(route) route.corridor.slice(1).forEach((id,i)=>activeRouteEdges.add(edgeKey(route.corridor[i],id)));

    /* 도로 (edges) — 전체 망은 방향을 읽을 만큼 남기고, 실제 선택은 더 강하게 겹친다. */
    for(const e of D.edges){
      const known = S && S.known.includes(e[0]) && S.known.includes(e[1]);
      if(!known) continue;
      const a=D.nodes[e[0]], b=D.nodes[e[1]];
      const cur = S.driving && ((S.driving.from===e[0]&&S.driving.to===e[1])||(S.driving.from===e[1]&&S.driving.to===e[0]));
      const next = !S.driving && (e[0]===S.at||e[1]===S.at) && (nbrs.has(e[0])||nbrs.has(e[1]));
      const traveled=S&&S.visited.includes(e[0])&&S.visited.includes(e[1]);
      const selected=selectedEdges.has(edgeKey(e[0],e[1]));
      const routeEdge=activeRouteEdges.has(edgeKey(e[0],e[1]));
      ctx.beginPath(); ctx.moveTo(px(a.x),py(a.y)); ctx.lineTo(px(b.x),py(b.y));
      ctx.setLineDash(cur||selected||routeEdge?[]:e[3]==='rough'?[4,5]:e[3]==='normal'?[8,4]:[]);
      ctx.strokeStyle= cur? 'rgba(255,180,84,0.96)':
        selected? 'rgba(85,224,200,0.88)':
        next? 'rgba(255,190,105,0.94)':
        routeEdge? 'rgba(255,180,84,0.7)':
        traveled? 'rgba(190,202,232,0.5)':'rgba(145,168,215,0.25)';
      ctx.lineWidth=cur?3.5:selected?3.4:next?3.2:routeEdge?2.7:traveled?2:1.25;
      ctx.stroke(); ctx.setLineDash([]);
    }

    /* 노드 — 1패스: 심볼 */
    if(S) for(const id of S.known){
      const n=D.nodes[id]; const x=px(n.x), y=py(n.y);
      const visited=S.visited.includes(id);
      const here = S.at===id;
      const selected=selectedNode===id;
      const city=CITY_IDS.has(id);
      const visible=city||here||visited||nbrs.has(id)||n.stl||n.type==='goal';
      if(!visible) continue;
      if(n.type==='goal'){
        const pulse=0.5+0.5*Math.sin(t*2.4);
        ctx.strokeStyle=`rgba(85,224,200,${0.25+0.45*pulse})`; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(x,y,8+pulse*7,0,7); ctx.stroke();
        ctx.fillStyle='#55e0c8';
        ctx.beginPath(); ctx.arc(x,y,4.5,0,7); ctx.fill();
      } else if(n.stl||n.type==='settlement'){
        ctx.fillStyle= visited? '#ffb454':'#c98d47';
        ctx.save(); ctx.translate(x,y); ctx.rotate(Math.PI/4);
        ctx.fillRect(-5,-5,10,10); ctx.restore();
      } else if(city){
        ctx.fillStyle=visited?'#c8d0e6':'#7d89aa';
        ctx.beginPath(); ctx.arc(x,y,4.5,0,7); ctx.fill();
        ctx.strokeStyle='rgba(216,225,244,.6)'; ctx.lineWidth=1.2;
        ctx.beginPath(); ctx.arc(x,y,7.2,0,7); ctx.stroke();
      } else if(n.type==='hidden'){
        ctx.strokeStyle='#c9b8ff'; ctx.setLineDash([2.5,2.5]); ctx.lineWidth=1.4;
        ctx.beginPath(); ctx.arc(x,y,5.6,0,7); ctx.stroke(); ctx.setLineDash([]);
        if(!visited){ ctx.fillStyle='#c9b8ff'; ctx.font='700 8px monospace'; ctx.textAlign='center';
          ctx.fillText('?',x,y+3); ctx.textAlign='left'; }
        else { ctx.fillStyle='#c9b8ff'; ctx.beginPath(); ctx.arc(x,y,2.6,0,7); ctx.fill(); }
      } else {
        ctx.fillStyle= visited? '#9aa5c4':'#5a6484';
        ctx.beginPath(); ctx.arc(x,y,4.1,0,7); ctx.fill();
      }
      /* 인접(이동 가능) 링 */
      if(nbrs.has(id)){
        ctx.strokeStyle=`rgba(255,180,84,${0.52+0.28*Math.sin(t*2.6)})`; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(x,y,9,0,7); ctx.stroke();
      }
      if(here){ ctx.strokeStyle='rgba(255,180,84,0.8)'; ctx.lineWidth=1.6;
        ctx.beginPath(); ctx.arc(x,y,9+Math.sin(t*3)*1.6,0,7); ctx.stroke(); }
      if(selected){ ctx.strokeStyle='rgba(85,224,200,0.95)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(x,y,11+Math.sin(t*2.4),0,7); ctx.stroke(); }
    }

    /* 노드 — 2패스: 라벨. 작은 지도에서는 글자끼리뿐 아니라 다른 도시 심벌과도
       부딪히지 않는 후보만 그린다. 현재 위치·선택 지점은 항상 우선한다. */
    if(S){
      const placed=[];
      const nodeZones=S.known.map(id=>{
        const n=D.nodes[id];
        return {id,x:px(n.x),y:py(n.y),r:W<340?9:7};
      });
      const hitsNode=(box,id)=>nodeZones.some(zone=>zone.id!==id&&
        zone.x+zone.r>box.x0&&zone.x-zone.r<box.x1&&
        zone.y+zone.r>box.y0&&zone.y-zone.r<box.y1);
      const putLabel=(id,x,y,txt,font,fill,essential)=>{
        ctx.font=font;
        const w=ctx.measureText(txt).width+8;
        for(const dy of [-11,18]){
          const bx={x0:x-w/2, x1:x+w/2, y0:y+dy-10, y1:y+dy+4};
          if(bx.x0<7||bx.x1>W-7||bx.y0<28||bx.y1>H-31) continue;
          if(placed.some(p=>p.x0<bx.x1&&bx.x0<p.x1&&p.y0<bx.y1&&bx.y0<p.y1)) continue;
          if(!essential&&hitsNode(bx,id)) continue;
          placed.push(bx);
          ctx.fillStyle=fill; ctx.textAlign='center';
          ctx.fillText(txt, x, y+dy);
          ctx.textAlign='left';
          return true;
        }
        return false;
      };
      const prio=(id)=>{ const n=D.nodes[id];
        if(selectedNode===id) return 0;
        if(S.at===id) return 0;
        if(n.type==='goal') return 1;
        if(CITY_IDS.has(id)) return 2;
        if(nbrs.has(id)) return 3;
        return 4; };
      const order=[...S.known].sort((a,b)=>prio(a)-prio(b));
      for(const id of order){
        const n=D.nodes[id]; const x=px(n.x), y=py(n.y);
        const p=prio(id);
        if(p>=4) continue;                           // 작은 경유지는 점으로만 남긴다
        const bold = p<=2;
        const font=`${bold?'700 ':''}${p<=3?11:10.5}px sans-serif`;
        const fill= n.type==='goal'? 'rgba(85,224,200,0.95)':
          S.at===id? 'rgba(255,200,120,0.98)':
          n.stl? 'rgba(240,225,195,0.95)':
          nbrs.has(id)? 'rgba(255,205,135,0.98)':
          n.type==='hidden'? 'rgba(211,196,255,0.88)': 'rgba(181,192,220,0.84)';
        putLabel(id,x,y,n.name.split(/[ —]/)[0],font,fill,p<=1);
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
  }

  function onClick(ev){
    if(!S) return;
    const r=cv.getBoundingClientRect();
    const mx=ev.clientX-r.left, my=ev.clientY-r.top;
    const nbrs=new Set();
    if(!S.driving&&S.at) for(const e of D.edges){
      if(e[0]===S.at&&S.known.includes(e[1])) nbrs.add(e[1]);
      if(e[1]===S.at&&S.known.includes(e[0])) nbrs.add(e[0]);
    }
    let best=null, bd=24;
    for(const id of S.known){ const n=D.nodes[id];
      if(!(CITY_IDS.has(id)||S.at===id||S.visited.includes(id)||nbrs.has(id)||n.stl||n.type==='goal')) continue;
      const d=Math.hypot(px(n.x)-mx, py(n.y)-my);
      if(d<bd){ bd=d; best=id; } }
    selectedNode=best;
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

  return {init, draw, resize, initMini, drawMini, pathTo, mode:'cities-only'};
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
        if(d<142){ const f=(142-d)/d*0.026;
          a.vx+=dx*f; a.vy+=dy*f; b.vx-=dx*f; b.vy-=dy*f; }
      }
    }
    for(const [i,j] of links){
      const a=nodes[i], b=nodes[j];
      const dx=b.x-a.x, dy=b.y-a.y, d=Math.hypot(dx,dy)||1;
      const f=(d-118)/d*0.014;
      a.vx+=dx*f; a.vy+=dy*f; b.vx-=dx*f; b.vy-=dy*f;
    }
    for(const n of nodes){
      n.x=Math.max(54,Math.min(W-54,n.x+n.vx)); n.y=Math.max(28,Math.min(H-48,n.y+n.vy));
      n.vx*=0.8; n.vy*=0.8;
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
      ctx.font='11px sans-serif'; ctx.textAlign='center';
      const label = n.title.length>9? n.title.slice(0,9)+'…':n.title;
      const labelY=n.y+n.r+14, labelW=ctx.measureText(label).width;
      ctx.fillStyle='rgba(11,14,26,0.88)';
      ctx.fillRect(n.x-labelW/2-4,labelY-11,labelW+8,15);
      ctx.fillStyle='rgba(244,239,226,0.92)';
      ctx.fillText(label, n.x, labelY);
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
