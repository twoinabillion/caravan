/* ═══════════════════ MAP ═══════════════════ */
const MAPR = (()=>{
  let cv, ctx, W=0, H=0, DPR=1, tf={s:1,ox:0,oy:0}, t=0;
  let fogCv=null;

  /* 한반도 남부 해안선 (지도공간 600×760) */
  const COAST = [
    /* 휴전선 부근 */
    [208,132],[250,118],[310,110],[370,100],[430,84],[456,78],
    /* 동해안 — 완만 */
    [468,120],[480,170],[492,230],[500,290],[512,340],[528,392],[526,440],[514,492],[508,540],[502,585],[496,622],
    /* 남해안 — 다도해 들쭉 */
    [492,646],[462,652],[438,640],[410,656],[382,644],[352,660],[322,648],[296,658],[268,648],[244,630],[232,612],
    /* 서해안 — 리아스식 들쭉 */
    [218,570],[230,532],[210,492],[224,458],[204,420],[218,382],[200,344],[214,306],[198,268],[212,230],[196,196],[214,162],
  ];

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
    const bx0=196,bx1=528,by0=78,by1=668;         // 지도 좌표 실측 bounds
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
    /* 바다 */
    ctx.fillStyle='#0a0e1e'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(85,120,180,0.06)'; ctx.lineWidth=1;
    for(let x=0;x<W;x+=26){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for(let y=0;y<H;y+=26){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    /* 육지 */
    ctx.beginPath();
    COAST.forEach((p,i)=> i?ctx.lineTo(px(p[0]),py(p[1])):ctx.moveTo(px(p[0]),py(p[1])));
    ctx.closePath();
    ctx.fillStyle='#131a2e'; ctx.fill();
    ctx.strokeStyle='#2a3a5e'; ctx.lineWidth=1.5; ctx.stroke();
    // 제주
    ctx.beginPath(); ctx.ellipse(px(288),py(714),40*tf.sx,13*tf.sy,0,0,7);
    ctx.fillStyle='#111828'; ctx.fill(); ctx.strokeStyle='#243252'; ctx.stroke();
    // 바다 이름
    ctx.fillStyle='rgba(120,150,200,0.28)'; ctx.font=`${9*tf.s+6}px serif`;
    ctx.fillText('동', px(508), py(150)); ctx.fillText('해', px(508), py(150)+16);
    ctx.fillText('서', px(178), py(300)); ctx.fillText('해', px(178), py(300)+16);
    ctx.fillText('남   해', px(340), py(700));

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
    const bx0=196,bx1=528,by0=78,by1=668, WIDEN=1.15;
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
