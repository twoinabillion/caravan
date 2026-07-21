/* ═══════════════════ DRIVE SCENE — 픽셀아트 렌더러 ═══════════════════
   저해상도(236px) 오프스크린에 그린 뒤 픽셀 업스케일로 블릿한다. */
const SCENE = (()=>{
  const LW = 236;                     // 논리 해상도(픽셀아트 폭)
  let mealT = 0;                      // 식사 연출 남은 시간(초)
  let talkIdx = -1, talkT = 0;        // 말하는 탑승자 표시
  let LH = 128;
  let dcv, dctx, VW=560, VH=300, DPR=1;   // 표시 캔버스
  let off, ctx, W=LW, H=LH;               // 픽셀 캔버스 (모든 드로잉)
  let worldX=0, t=0, puffs=[], rainDrops=null, flashT=0, shoot=null, birds=null;
  let vanSprite=null;
  let crowFly=[], crowCd={};
  let signTexts=[];                   // 픽셀 패스에서 수집 → 블릿 후 선명하게 그림

  const hash=(n)=>{ let x=Math.sin(n*127.1+311.7)*43758.5453; return x-Math.floor(x); };
  const lerp=(a,b,f)=>a+(b-a)*f;
  const toRGB=(h)=> h[0]==='#'
    ? [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]
    : h.match(/[\d.]+/g).slice(0,3).map(Number);
  const mix=(h1,h2,f)=>{ const a=toRGB(h1),b=toRGB(h2);
    return `rgb(${Math.round(lerp(a[0],b[0],f))},${Math.round(lerp(a[1],b[1],f))},${Math.round(lerp(a[2],b[2],f))})`; };
  const P=(x)=>Math.round(x);        // 픽셀 스냅

  /* 시간대별 하늘 [hour, top, horizon, glow] */
  const SKY=[
    [0,'#04050e','#0a0d1e','#141a30'],[4.5,'#04050e','#0a0d1e','#141a30'],
    [6,'#141a38','#3a3357','#8a5a54'],[7.5,'#39598c','#8a80a0','#eaa870'],
    [11,'#5c82ab','#93accb','#d2dce1'],[15,'#567aa2','#8ba3c0','#c9cfd4'],
    [18,'#3f4573','#8a6288','#e0814e'],[19.5,'#191c3d','#33284e','#7c4544'],
    [21,'#070812','#0d1022','#181f38'],[24,'#04050e','#0a0d1e','#141a30'],
  ];
  const skyAt=(h)=>{ for(let i=0;i<SKY.length-1;i++){ const a=SKY[i],b=SKY[i+1];
    if(h>=a[0]&&h<=b[0]){ const f=(h-a[0])/(b[0]-a[0]||1);
      return [mix(a[1],b[1],f),mix(a[2],b[2],f),mix(a[3],b[3],f)]; } }
    return [SKY[0][1],SKY[0][2],SKY[0][3]]; };
  const darknessAt=(h)=>(h>=20||h<5)?1:(h>=8&&h<=17)?0: h<8? 1-((h-5)/3):(h-17)/3;

  function init(canvas){
    dcv=canvas; dctx=dcv.getContext('2d');
    off=document.createElement('canvas'); ctx=off.getContext('2d');
    if(D.vanSprites&&D.vanSprites.base){
      vanSprite=new Image(); vanSprite.src=D.vanSprites.base;
    }
    new ResizeObserver(resize).observe(dcv); resize();
  }
  function resize(){
    DPR=Math.min(2,window.devicePixelRatio||1);
    VW=dcv.clientWidth||560; VH=dcv.clientHeight||300;
    dcv.width=VW*DPR; dcv.height=VH*DPR; dctx.setTransform(DPR,0,0,DPR,0,0);
    LH=Math.round(LW*VH/VW); W=LW; H=LH;
    off.width=W; off.height=H;
    ctx.imageSmoothingEnabled=false; dctx.imageSmoothingEnabled=false;
    rainDrops=null;
  }

  /* ── 하늘: 포스터라이즈 밴드 ── */
  function drawSky(hour,dark,wx){
    const [top,mid,glow]=skyAt(hour);
    const skyH=H*0.76, bands=13;
    for(let i=0;i<bands;i++){
      const f=i/(bands-1);
      const c= f<0.62? mix(top,mid,f/0.62): mix(mid,glow,(f-0.62)/0.38);
      ctx.fillStyle=c;
      ctx.fillRect(0,P(skyH*i/bands),W,Math.ceil(skyH/bands)+1);
    }
    /* 별 */
    if(dark>0.15){ const a=dark*(wx==='clear'?1:0.3);
      for(let i=0;i<46;i++){ const x=P(hash(i)*W), y=P(hash(i+99)*H*0.5);
        const tw=0.5+0.5*Math.sin(t*1.5+i*2.4);
        ctx.fillStyle=`rgba(223,230,255,${a*(0.3+0.6*tw)})`;
        ctx.fillRect(x,y,1,1);
        if(i%11===0){ ctx.fillRect(x+1,y,1,1); ctx.fillRect(x,y+1,1,1); } } }
    /* 유성 */
    if(dark>0.6&&!shoot&&Math.random()<0.0012) shoot={x:Math.random()*W,y:Math.random()*H*0.25,life:0.6};
    if(shoot){ shoot.life-=0.016; shoot.x-=2.6; shoot.y+=1.2;
      if(shoot.life<=0) shoot=null;
      else{ ctx.strokeStyle=`rgba(230,238,255,${shoot.life})`; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(shoot.x,shoot.y); ctx.lineTo(shoot.x+9,shoot.y-4); ctx.stroke(); } }
    /* 달/해 */
    const cx=W*0.8, cy=H*0.16;
    if(dark>0.5){
      ctx.fillStyle=`rgba(232,230,218,${Math.min(1,dark)*(wx==='clear'?1:0.4)})`;
      circ(cx,cy,7);
      ctx.fillStyle=skyAt(hour)[0]; circ(cx-3,cy-2,6);
      ctx.fillStyle=`rgba(232,230,218,${0.06*dark})`; circ(cx,cy,11);
    } else if(dark<0.35&&hour>6&&hour<19){
      const sx=W*0.3, sy=H*0.26, a=(0.35-dark)*2*(wx==='clear'?1:0.3);
      ctx.fillStyle=`rgba(255,243,216,${a*0.16})`; circ(sx,sy,8);
      ctx.fillStyle=`rgba(255,243,216,${a*0.45})`; circ(sx,sy,5);
      ctx.fillStyle=`rgba(255,248,230,${a})`; circ(sx,sy,3);
    }
    /* 구름 (얇은 스트립 2층) */
    cloudLayer(0.04, H*0.10, 5, `rgba(24,30,54,${0.30+0.15*dark})`);
    cloudLayer(0.09, H*0.22, 4, `rgba(20,25,46,${0.26+0.12*dark})`);
    /* 새 떼 (낮, 드물게) */
    if(dark<0.3){ if(!birds&&Math.random()<0.0008) birds={x:W+10,y:H*0.15+Math.random()*H*0.15,life:99};
      if(birds){ birds.x-=0.45;
        if(birds.x<-30) birds=null;
        else{ ctx.strokeStyle='rgba(20,26,40,0.8)'; ctx.lineWidth=1;
          for(let i=0;i<5;i++){ const bx=birds.x+i*5+(i%2)*2, by=birds.y+Math.abs(i-2)*2.4;
            const fl=Math.sin(t*7+i)>0?1:0;
            ctx.beginPath(); ctx.moveTo(bx-2,by-fl); ctx.lineTo(bx,by+1-fl); ctx.lineTo(bx+2,by-fl); ctx.stroke(); } } } }
  }
  function circ(x,y,r){ ctx.beginPath(); ctx.arc(P(x),P(y),r,0,7); ctx.fill(); }
  function cloudLayer(par,y0,n,col){
    const drift=t*1.1+worldX*par;
    ctx.fillStyle=col;
    for(let i=0;i<n;i++){
      const cw=20+hash(i*7)*26;
      const x=((i*113+hash(i)*70-drift)%(W+90))-45;
      const y=y0+hash(i*3)*H*0.07;
      ctx.fillRect(P(x),P(y),P(cw),2);
      ctx.fillRect(P(x+5),P(y-1),P(cw*0.55),1);
      ctx.fillRect(P(x+3),P(y+2),P(cw*0.7),1);
    }
  }

  /* ── 원경/중경 ── */
  function ridge(y0,amp,freq,seed,col,par){
    ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(0,H);
    for(let x=0;x<=W;x+=3){
      const wx=(x+worldX*par);
      const y=y0+Math.sin(wx*freq+seed)*amp+Math.sin(wx*freq*2.7+seed*2)*amp*0.4;
      ctx.lineTo(x,P(y));
    }
    ctx.lineTo(W,H); ctx.closePath(); ctx.fill();
  }
  function pines(par,baseY,col){
    const cell=64, offp=worldX*par, first=Math.floor(offp/cell)-1;
    ctx.fillStyle=col;
    for(let i=first;i<first+Math.ceil(W/cell)+2;i++){
      if(hash(i*4.4)>0.62) continue;
      const x=i*cell-offp+hash(i*2.2)*30;
      const n=2+Math.floor(hash(i*6.6)*4);
      for(let k=0;k<n;k++){
        const tx=x+k*7+hash(i+k)*4, th=9+hash(i*3+k)*10;
        const ty=baseY+2-hash(i*9+k)*3;
        ctx.beginPath(); ctx.moveTo(P(tx),P(ty-th)); ctx.lineTo(P(tx-3.2),P(ty)); ctx.lineTo(P(tx+3.2),P(ty)); ctx.closePath(); ctx.fill();
        ctx.fillRect(P(tx)-0.5,P(ty),1,2);
      }
    }
  }
  function buildings(par,cell,density,baseY,hMin,hMax,col,dark,winCol){
    const offp=worldX*par, first=Math.floor(offp/cell)-1;
    for(let i=first;i<first+Math.ceil(W/cell)+3;i++){
      const h1=hash(i*3.7); if(h1>density) continue;
      const bw=P(10+hash(i*1.3)*20), bh=P(hMin+hash(i*2.1)*(hMax-hMin));
      const x=P(i*cell-offp+hash(i*5.3)*cell*0.3), y=P(baseY-bh);
      ctx.fillStyle=col; ctx.fillRect(x,y,bw,bh);
      const br=hash(i*7.9);
      if(br>0.4){ /* 부서진 상단 */
        ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+bw*0.3,y-3-br*4);
        ctx.lineTo(x+bw*0.55,y); ctx.lineTo(x+bw*0.78,y-2-br*3); ctx.lineTo(x+bw,y);
        ctx.closePath(); ctx.fill(); }
      /* 창문 그리드 (어두운 창 + 드물게 불빛/깨진 창) */
      if(bw>=13&&bh>=16){
        for(let wy=y+3;wy<y+bh-4;wy+=5) for(let wx2=x+2;wx2<x+bw-3;wx2+=4){
          const wh=hash(wx2*13.7+wy*7.1+i);
          if(wh>0.86) continue;                      // 깨진 창 = 벽색 그대로
          if(dark>0.4&&wh>0.825){ const fl=0.55+0.45*Math.sin(t*2.6+wx2+wy);
            ctx.fillStyle=`rgba(255,190,110,${0.7*fl*dark})`; }
          else ctx.fillStyle='rgba(6,8,16,0.75)';
          ctx.fillRect(wx2,wy,2,3);
        }
      }
      if(hash(i*19)>0.8){ ctx.strokeStyle=col; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(x+bw*0.5,y); ctx.lineTo(x+bw*0.5,y-6); ctx.stroke();
        if(dark>0.4&&hash(i*23)>0.5){ ctx.fillStyle=`rgba(255,80,80,${0.5+0.5*Math.sin(t*2+i)})`;
          ctx.fillRect(P(x+bw*0.5)-1,y-7,1,1); } }
    }
  }
  /* ── 바이옴 (지역별 배경) ── */
  function bioOf(){
    if(!S) return 'rural';
    if(S.driving){ const f=S.driving.gone/S.driving.dist;
      return D.nodeBio[f<0.5?S.driving.from:S.driving.to]||'rural'; }
    return D.nodeBio[S.at]||'rural';
  }
  /* 바다/호수 */
  function water(kind,dark){
    const y0=P(H*0.545), y1=P(H*0.705);
    const g=ctx.createLinearGradient(0,y0,0,y1);
    g.addColorStop(0,mix('#2b4a66','#0d1826',dark*0.65));
    g.addColorStop(1,mix('#1b3247','#09111c',dark*0.65));
    ctx.fillStyle=g; ctx.fillRect(0,y0,W,y1-y0);
    ctx.fillStyle=`rgba(205,225,240,${Math.max(0.06,0.24-dark*0.16)})`;
    ctx.fillRect(0,y0,W,1);
    if(kind==='coast'){
      ctx.fillStyle=`rgba(180,210,230,${0.18-dark*0.08})`;
      for(let i=0;i<10;i++){
        const wy=y0+3+hash(i*3)*(y1-y0-6);
        const wx2=((i*53+t*(6+hash(i)*8))%(W+30))-15;
        ctx.fillRect(P(wx2),P(wy),P(6+hash(i*7)*10),1);
      }
      /* 갈매기 */
      if(dark<0.4){ ctx.strokeStyle='rgba(230,235,240,0.7)'; ctx.lineWidth=1;
        for(let i=0;i<3;i++){ const gx=((i*90+t*9)%(W+40))-20, gy=y0-8-hash(i*5)*14;
          const fl=Math.sin(t*6+i)>0?1.5:0;
          ctx.beginPath(); ctx.moveTo(P(gx-3),P(gy-fl)); ctx.lineTo(P(gx),P(gy+1)); ctx.lineTo(P(gx+3),P(gy-fl)); ctx.stroke(); } }
    } else { /* lake — 잔잔 + 낚싯배 */
      ctx.fillStyle='rgba(180,210,230,0.12)';
      for(let i=0;i<5;i++) ctx.fillRect(P(hash(i*9)*W),P(y0+4+hash(i*4)*(y1-y0-8)),10,1);
      const bx=P(((worldX*0.05+50)%(W+60))-30), by=y0+P((y1-y0)*0.42);
      ctx.fillStyle='rgba(150,175,195,0.85)'; ctx.fillRect(bx,by,12,1);
      ctx.fillStyle='#131c2c'; ctx.fillRect(bx+1,by+1,10,2);
      ctx.fillRect(bx+5,by-4,1,4); ctx.fillRect(bx+4,by-4,3,1);
      ctx.fillStyle='rgba(150,175,195,0.25)'; ctx.fillRect(bx+2,by+4,8,1);
    }
  }
  /* 논 + 비닐하우스 */
  function paddies(par){
    const y0=P(H*0.615);
    for(let r=0;r<3;r++){
      const y=y0+r*5;
      ctx.fillStyle=`rgba(88,116,66,${0.42-r*0.09})`; ctx.fillRect(0,y,W,3);
      ctx.strokeStyle='rgba(38,56,36,0.35)'; ctx.lineWidth=1;
      const cell=34+r*9, off=worldX*par*(0.75+r*0.12);
      for(let x=-(off%cell); x<W; x+=cell) line(x,y,x+6,y+3);
    }
    const cell=130, off=worldX*par, first=Math.floor(off/cell)-1;
    for(let i=first;i<first+Math.ceil(W/cell)+2;i++){
      if(hash(i*5.2)>0.6) continue;
      const x=P(i*cell-off+hash(i*3)*40), y=P(H*0.692);
      ctx.fillStyle='rgba(196,208,214,0.55)';
      ctx.beginPath(); ctx.ellipse(x,y,16,6,0,Math.PI,0); ctx.fill();
      ctx.strokeStyle='rgba(230,238,242,0.5)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.ellipse(x,y,16,6,0,Math.PI*1.25,Math.PI*1.75); ctx.stroke();
      ctx.strokeStyle='rgba(80,90,100,0.5)';
      for(let a2=-12;a2<=12;a2+=6) line(x+a2,y,x+a2,y-Math.sqrt(Math.max(0,1-(a2*a2)/(16*16)))*6+1);
    }
  }
  /* 대숲 */
  function bambooStrip(par){
    const base=P(H*0.705), off=worldX*par, cell=6;
    const first=Math.floor(off/cell)-1;
    for(let i=first;i<first+Math.ceil(W/cell)+2;i++){
      const x=i*cell-off+hash(i)*3, h2=24+hash(i*3)*24;
      const sway=Math.sin(t*1.5+i*0.7)*1.6;
      ctx.strokeStyle=`rgba(58,96,62,${0.5+hash(i*7)*0.35})`; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(P(x),base);
      ctx.quadraticCurveTo(P(x+sway*0.4),base-h2*0.6,P(x+sway),base-h2); ctx.stroke();
      ctx.strokeStyle='rgba(28,48,32,0.55)'; ctx.lineWidth=1;
      for(let m2=1;m2<3;m2++) line(x-1,base-h2*m2/3,x+1.5,base-h2*m2/3);
    }
  }
  /* 절벽 (산악) */
  function cliffs(par,col){
    const cell=120, off=worldX*par, first=Math.floor(off/cell)-1;
    for(let i=first;i<first+Math.ceil(W/cell)+2;i++){
      const x=P(i*cell-off), w2=P(cell+2);
      const top=H*(0.5+hash(i*3)*0.1);
      const y0=P(top), y1=P(H*0.705);
      ctx.fillStyle=col; ctx.fillRect(x,y0,w2,y1-y0);
      ctx.fillStyle='rgba(150,165,195,0.35)'; ctx.fillRect(x,y0,w2,1);
      ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.lineWidth=1;
      for(let s2=1;s2<4;s2++) line(x,y0+(y1-y0)*s2/4,x+w2,y0+(y1-y0)*s2/4-3);
      /* 세로 균열 + 낙석망 */
      ctx.strokeStyle='rgba(0,0,0,0.3)';
      line(x+w2*0.3,y0+2,x+w2*0.34,y1);
      if(hash(i*9.1)>0.5){ ctx.strokeStyle='rgba(120,128,145,0.35)';
        for(let d2=4;d2<w2-4;d2+=7) line(x+d2,y0+1,x+d2+5,y0+16); }
    }
  }

  /* 남산타워 (북부, 근접 시) */
  function namsan(dark){
    if(!S||G.regionOf()!=='north') return;
    const remain=G.remainKm(); if(remain>85) return;
    const a=Math.min(1,(85-remain)/50);
    const x=W*0.72+ (worldX*0.015 % 30), y=H*0.5;
    ctx.globalAlpha=a*0.8;
    ctx.fillStyle='#0d1322';
    ctx.beginPath(); ctx.moveTo(x-5,y); ctx.lineTo(x+5,y); ctx.lineTo(x+1.5,y-16); ctx.lineTo(x-1.5,y-16); ctx.closePath(); ctx.fill();
    ctx.fillRect(P(x-4),P(y-20),8,4);   // 전망대
    ctx.fillRect(P(x-0.5),P(y-30),1,10); // 첨탑
    const bl=0.5+0.5*Math.sin(t*2.2);
    ctx.fillStyle=`rgba(85,224,200,${(0.4+0.6*bl)*a})`;
    ctx.fillRect(P(x-0.5)-1,P(y-31),2,2);
    ctx.globalAlpha=1;
  }

  function poles(par,roadY,col){
    const cell=118, offp=worldX*par, first=Math.floor(offp/cell)-1;
    ctx.strokeStyle=col; ctx.lineWidth=1;
    let prev=null;
    for(let i=first;i<first+Math.ceil(W/cell)+3;i++){
      const x=P(i*cell-offp), ph=P(28+hash(i*3.1)*5), tilt=P((hash(i*9.7)-0.5)*5);
      line(x,roadY,x+tilt,roadY-ph);
      line(x+tilt-4,roadY-ph+3,x+tilt+4,roadY-ph+3);
      line(x+tilt-3,roadY-ph+6,x+tilt+3,roadY-ph+6);
      const topx=x+tilt,topy=roadY-ph+3;
      if(prev&&hash(i*4.3)>0.2){
        ctx.beginPath(); ctx.moveTo(prev[0],prev[1]);
        ctx.quadraticCurveTo((prev[0]+topx)/2,prev[1]+11,topx,topy); ctx.stroke();
      }
      /* 전선 위 까마귀 */
      if(hash(i*15.5)>0.72){
        const cx2=x+tilt-8+hash(i*31)*16, cy2=roadY-ph+3+3;
        if(!crowFly.some(c=>c.cell===i)){
          const vanX=W*0.26+34;
          if(S&&S.driving&&Math.abs(cx2-vanX)<26&&!crowCd[i]){
            crowCd[i]=true;
            crowFly.push({cell:i,x:cx2,y:cy2,vx:-14-Math.random()*8,vy:-16-Math.random()*6,life:1.4});
          } else {
            ctx.fillStyle='#0a0d16';
            ctx.fillRect(P(cx2)-1,P(cy2)-2,3,2); ctx.fillRect(P(cx2),P(cy2)-3,1,1);
          }
        }
      }
      prev=[topx,topy];
    }
  }
  function line(a,b,c,d){ ctx.beginPath(); ctx.moveTo(a,b); ctx.lineTo(c,d); ctx.stroke(); }
  function drawCrows(dt){
    for(let i=crowFly.length-1;i>=0;i--){ const c=crowFly[i];
      c.x+=c.vx*dt; c.y+=c.vy*dt; c.vy-=6*dt; c.life-=dt;
      if(c.life<=0){ crowFly.splice(i,1); continue; }
      const fl=Math.sin(t*16+i)>0;
      ctx.strokeStyle='rgba(10,13,22,0.9)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(c.x-2,c.y-(fl?2:0)); ctx.lineTo(c.x,c.y+1); ctx.lineTo(c.x+2,c.y-(fl?2:0)); ctx.stroke();
    }
  }

  function signs(par,roadY){
    const cell=620, offp=worldX*par, first=Math.floor(offp/cell)-1;
    for(let i=first;i<first+Math.ceil(W/cell)+2;i++){
      const x=P(i*cell-offp+hash(i*2.3)*120);
      if(x<-40||x>W+20) continue;
      const remain=S?G.remainKm():400;
      const km=Math.max(0,Math.round((remain+((i*cell-offp)-W*0.26)/10)/10)*10);
      ctx.fillStyle='#222c34'; ctx.fillRect(x-1,roadY-26,2,26);
      ctx.fillStyle='#173629'; ctx.fillRect(x-17,roadY-38,34,14);
      ctx.strokeStyle='#2e5140'; ctx.lineWidth=1; ctx.strokeRect(x-16.5,roadY-37.5,33,13);
      signTexts.push({x:x, y:roadY-31, km});
    }
  }
  function deadCars(par,roadY,col){
    const cell=290, offp=worldX*par, first=Math.floor(offp/cell)-1;
    for(let i=first;i<first+Math.ceil(W/cell)+2;i++){
      if(hash(i*6.1)>0.5) continue;
      const x=P(i*cell-offp+hash(i*8.9)*90);
      const kind=hash(i*3.3);
      ctx.fillStyle=col;
      if(kind>0.85){ /* 전복 */
        ctx.fillRect(x,roadY-6,20,5);
        ctx.fillStyle='#080a12'; circ(x+5,roadY-8,2.4); circ(x+15,roadY-8,2.4);
      } else if(kind>0.6){ /* 버스 */
        ctx.fillRect(x,roadY-11,28,10);
        ctx.fillStyle='rgba(6,8,14,0.8)';
        for(let wx2=x+2;wx2<x+26;wx2+=5) ctx.fillRect(wx2,roadY-9,3,3);
        ctx.fillStyle='#080a12'; circ(x+6,roadY-1,2.4); circ(x+22,roadY-1,2.4);
      } else { /* 승용차 */
        ctx.fillRect(x,roadY-7,21,5);
        ctx.fillRect(x+4,roadY-11,11,5);
        ctx.fillStyle='rgba(6,8,14,0.8)'; ctx.fillRect(x+5,roadY-10,9,3);
        ctx.fillStyle='#080a12'; circ(x+5,roadY-1,2.2); circ(x+16,roadY-1,2.2);
      }
      /* 잡동사니 */
      if(hash(i*12)>0.6){ ctx.fillStyle=col;
        ctx.fillRect(x+26,roadY-2,4,2); circ(x+33,roadY-1,1.5); }
    }
  }

  /* ── 도로 ── */
  function road(dark,wx){
    const roadY=P(H*0.72);
    /* 갓길 흙+풀 */
    ctx.fillStyle=mix('#2a2c26','#15161a',dark*0.5);
    ctx.fillRect(0,roadY,W,3);
    /* 노면 */
    ctx.fillStyle=mix('#23262e','#121419',dark*0.55);
    ctx.fillRect(0,roadY+3,W,H-roadY-3);
    ctx.fillStyle=mix('#191c23','#0c0e13',dark*0.55);
    ctx.fillRect(0,roadY+P((H-roadY)*0.6),W,H);
    /* 갓길선 */
    ctx.fillStyle='rgba(200,200,190,0.2)'; ctx.fillRect(0,roadY+5,W,1);
    /* 중앙 점선 */
    const dashW=13,gap=11,offp=worldX%(dashW+gap);
    ctx.fillStyle='rgba(222,206,140,0.5)';
    const laneY=roadY+P((H-roadY)*0.42);
    for(let x=-offp;x<W;x+=dashW+gap) ctx.fillRect(P(x),laneY,dashW,1);
    /* 균열/패치 */
    const cell=70, first=Math.floor(worldX/cell)-1;
    for(let i=first;i<first+Math.ceil(W/cell)+2;i++){
      const r=hash(i*5.7);
      const x=P(i*cell-worldX+hash(i*3.9)*40), y=roadY+4+P(hash(i*7.7)*(H-roadY-8));
      if(r<0.3){ ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+6+hash(i)*8,y+(hash(i*2)-0.5)*6);
        ctx.lineTo(x+13+hash(i)*9,y+(hash(i*4)-0.5)*9); ctx.stroke(); }
      else if(r<0.42){ ctx.fillStyle='rgba(0,0,0,0.22)';
        ctx.fillRect(x,y,P(8+hash(i)*10),3); }
      /* 빗길 웅덩이 */
      if(wx==='rain'&&r>0.55&&r<0.72){ ctx.fillStyle='rgba(120,150,200,0.13)';
        ctx.beginPath(); ctx.ellipse(x,y,7,1.6,0,0,7); ctx.fill(); }
    }
    /* 갓길 풀 (흔들림) */
    ctx.fillStyle='rgba(88,104,64,0.75)';
    const gcell=26, gfirst=Math.floor(worldX*1.02/gcell)-1;
    for(let i=gfirst;i<gfirst+Math.ceil(W/gcell)+2;i++){
      const x=P(i*gcell-worldX*1.02+hash(i*1.9)*14);
      if(hash(i*8.3)>0.6) continue;
      const sway=Math.sin(t*3+i)*0.8;
      for(let b=0;b<3;b++){ const bx=x+b*2;
        const gh=2+hash(i+b)*3;
        ctx.fillRect(P(bx+sway*((b%2)?1:0.4)),P(roadY+1-gh),1,gh+1); }
    }
    return roadY;
  }

  /* 이미지 차체 + 실시간 레이어. 이미지 로딩 전에는 아래 기존 렌더러로 폴백. */
  function spriteVan(vx,vy,baseY,bodyL,speed,dark,wx,up,bnc,bnc2){
    if(!vanSprite||!vanSprite.complete||!vanSprite.naturalWidth) return false;
    /* 원본 96x53 기준. 차체는 서스펜션을 따라 움직이고 바퀴는 노면에 붙인다. */
    const sx=P(vx-8), sy=P(vy-37), sw=96, sh=53;
    ctx.drawImage(vanSprite,sx,sy,sw,sh);

    /* 업그레이드 오버레이: 모두 차체 기준 앵커를 공유한다. */
    if(up.solar){
      ctx.fillStyle='#274e74'; ctx.fillRect(sx+34,sy+5,17,4);
      ctx.strokeStyle='#5991bd'; for(let x=sx+38;x<sx+51;x+=4) line(x,sy+5,x,sy+9);
    }
    if(up.garden){
      ctx.fillStyle='#54402c'; ctx.fillRect(sx+54,sy+5,12,4);
      ctx.fillStyle='#67a34b'; for(let g=0;g<4;g++) ctx.fillRect(P(sx+56+g*2.4+Math.sin(t*3+g)*0.5),sy+2,1,4);
    }
    if(up.garden2){
      ctx.strokeStyle='rgba(175,215,240,0.7)'; ctx.beginPath(); ctx.arc(sx+60,sy+6,7,Math.PI,0); ctx.stroke();
    }
    if(up.collector&&!up.solar){
      ctx.fillStyle='#67707d'; ctx.beginPath(); ctx.moveTo(sx+17,sy+3); ctx.lineTo(sx+25,sy+3); ctx.lineTo(sx+21,sy+9); ctx.closePath(); ctx.fill();
    }
    if(up.stove&&!up.solar){
      ctx.fillStyle='#343943'; ctx.fillRect(sx+29,sy,3,8);
      if(speed<=0){ const rise=(t*4)%7; ctx.fillStyle=`rgba(210,210,205,${0.35*(1-rise/7)})`; ctx.fillRect(P(sx+30+Math.sin(t*2)),P(sy-1-rise),2,2); }
    }
    if(up.beehive&&!up.garden){ ctx.fillStyle='#a58a4a'; ctx.fillRect(sx+64,sy+6,7,5); ctx.fillStyle='#2e2a20'; ctx.fillRect(sx+67,sy+9,1,1); }
    if(up.scope&&!up.garden2&&!up.antenna){ ctx.fillStyle='#454b56'; ctx.fillRect(sx+58,sy,2,7); ctx.fillRect(sx+56,sy,6,2); }
    if(up.horn&&!up.collector){ ctx.fillStyle='#c9c2b0'; ctx.fillRect(sx+12,sy+4,5,2); ctx.fillRect(sx+12,sy+8,5,2); }
    if(up.lightbar){
      ctx.fillStyle='#30343d'; ctx.fillRect(sx+75,sy+11,11,2);
      if(dark>0.3){ ctx.fillStyle='#ffe9a8'; for(let i=0;i<5;i++) ctx.fillRect(sx+76+i*2,sy+11,1,1); }
    }
    if(up.antenna){
      ctx.strokeStyle='#777'; line(sx+24,sy+7,sx+20,sy-11);
      ctx.fillStyle=`rgba(255,90,90,${0.5+0.5*Math.sin(t*3)})`; ctx.fillRect(sx+19,sy-12,1,1);
    }
    if(up.cabin){
      ctx.fillStyle=dark>0.35?'#e6a75c':'#7991a4'; ctx.fillRect(sx+59,sy+22,7,4);
      ctx.strokeStyle='#3d352c'; ctx.strokeRect(sx+58.5,sy+21.5,8,5);
    }
    if(up.bunk){ ctx.fillStyle=dark>0.35?'#e8a95c':'#829aad'; ctx.fillRect(sx+39,sy+17,7,2); }
    /* 냉장고는 실내 설비라 외장 오버레이로 중복 표시하지 않는다. */
    if(up.curtain&&dark>0.35&&speed<=0){ ctx.fillStyle='#453a4a'; ctx.fillRect(sx+38,sy+20,20,13); }
    if(up.kitchen&&speed<=0){
      ctx.fillStyle='#3c372f'; ctx.fillRect(sx+43,sy+34,13,2); ctx.fillStyle='#252934'; ctx.fillRect(sx+48,sy+31,4,2);
    }
    if(up.armor){
      ctx.fillStyle='rgba(76,82,92,0.9)'; ctx.fillRect(sx+34,sy+32,13,6); ctx.fillRect(sx+50,sy+32,13,6);
      ctx.fillStyle='#9ca2ad'; [[36,34],[45,34],[52,34],[61,34]].forEach(p=>ctx.fillRect(sx+p[0],sy+p[1],1,1));
    }
    if(up.tank1||up.tank2){
      const tankW=up.tank1&&up.tank2?17:11;
      ctx.fillStyle='#424752'; ctx.fillRect(sx+47,sy+40,tankW,3);
      ctx.fillStyle='#69707d'; ctx.fillRect(sx+48,sy+40,tankW-2,1);
    }
    if(up.sidebox&&!up.armor){ ctx.fillStyle='#515867'; ctx.fillRect(sx+11,sy+37,7,5); ctx.fillStyle='#c9a24a'; ctx.fillRect(sx+13,sy+39,2,1); }
    if(up.armory){ ctx.strokeStyle='#5b4630'; line(sx+12,sy+25,sx+19,sy+32); line(sx+16,sy+24,sx+15,sy+34); }
    if(up.awning){
      ctx.fillStyle='#874f45';
      if(speed>0) ctx.fillRect(sx+29,sy+14,25,2);
      else { ctx.fillRect(sx+9,sy+14,45,3); ctx.strokeStyle='#4c4438'; line(sx+10,sy+17,sx+10,sy+52); }
    }
    if(up.snorkel){ ctx.fillStyle='#333842'; ctx.fillRect(sx+89,sy+18,2,18); ctx.fillRect(sx+86,sy+17,5,2); }
    if(up.bullbar){ ctx.strokeStyle='#6b7280'; line(sx+91,sy+34,sx+94,sy+43); line(sx+91,sy+43,sx+96,sy+43); }
    if(up.winch){ ctx.fillStyle='#2b2f3a'; ctx.fillRect(sx+89,sy+40,7,3); ctx.fillStyle='#c9a24a'; ctx.fillRect(sx+95,sy+42,2,1); }

    /* 창문 속 탑승자. 초상 대신 저해상도 실루엣을 실시간으로 움직인다. */
    const riders=S? ['#2c3346',...S.party.map(id=>D.comps[id].color)]:['#2c3346'];
    const slots=[[78,28],[55,29],[49,29],[42,29]];
    riders.slice(0,slots.length).forEach((color,i)=>{
      const q=slots[i], nod=Math.sin(t*1.2+i*2.7)>0.96?1:0;
      ctx.fillStyle='#171a24'; ctx.fillRect(sx+q[0]-2,sy+q[1]-1+nod,4,4);
      ctx.fillStyle=color; ctx.fillRect(sx+q[0]-2,sy+q[1]-3+nod,4,2);
      if(i===talkIdx&&talkT>0){ ctx.fillStyle='#ffebbe'; ctx.fillRect(sx+q[0],sy+q[1]-7,1,1); ctx.fillRect(sx+q[0]+2,sy+q[1]-7,1,1); }
    });
    if(S&&S.dog){
      const bob=speed>0?Math.sin(t*9):0;
      ctx.fillStyle='#c9a36a'; ctx.fillRect(sx+19,P(sy+25+bob),5,4);
      ctx.fillStyle='#8a6c42'; ctx.fillRect(sx+19,P(sy+23+bob),2,2); ctx.fillRect(sx+22,P(sy+23+bob),2,2);
    }

    /* 외곽 타이어/휠하우스는 원본 그대로 두고 작은 허브만 회전시킨다. */
    const spin=worldX/6.2;
    [[24,44,0],[77,44,0.28]].forEach((w)=>{
      const wx0=sx+w[0], wy0=sy+w[1], a=spin+w[2];
      if(up.mudtires){
        ctx.strokeStyle='rgba(24,27,34,0.9)'; ctx.lineWidth=1;
        for(let k=0;k<4;k++){
          const ta=a+k*Math.PI/2;
          line(wx0+Math.cos(ta)*5.5,wy0+Math.sin(ta)*5.5,wx0+Math.cos(ta)*6.5,wy0+Math.sin(ta)*6.5);
        }
      }
      ctx.fillStyle='#30343c'; circ(wx0,wy0,2.6);
      ctx.strokeStyle='#777b80'; ctx.lineWidth=1;
      line(wx0-Math.cos(a)*2,wy0-Math.sin(a)*2,wx0+Math.cos(a)*2,wy0+Math.sin(a)*2);
      line(wx0-Math.cos(a+Math.PI/2)*2,wy0-Math.sin(a+Math.PI/2)*2,wx0+Math.cos(a+Math.PI/2)*2,wy0+Math.sin(a+Math.PI/2)*2);
      ctx.fillStyle='#a09b8d'; circ(wx0,wy0,0.8);
    });

    ctx.fillStyle=dark>0.25?'#ffe9b0':'#d8d2be'; ctx.fillRect(sx+90,sy+36,2,3);
    ctx.fillStyle=speed>0?'#c74138':'#762a24'; ctx.fillRect(sx+8,sy+36,2,3);
    if(wx==='rain'){
      ctx.globalAlpha=0.15; ctx.drawImage(vanSprite,sx,sy+58,sw,-18); ctx.globalAlpha=1;
    }
    return true;
  }

  /* ── 차 (달구지) ── */
  function van(roadY,speed,dark,wx){
    const up=S? (S.up||{}):{};
    const vx=P(W*0.22), baseY=roadY+P((H-roadY)*0.42);
    const bnc=speed>0? Math.sin(t*11)*0.8+Math.sin(t*23.7)*0.4 : Math.sin(t*1.6)*0.3;
    const bnc2=speed>0? Math.sin(t*11+1.2)*0.8 : Math.sin(t*1.6+0.6)*0.3;
    const ride=up.susp?1.5:0;
    const vy=P(baseY+bnc-ride);
    const bodyL=62+(up.cabin?15:0), bodyH=25, cabL=17;
    /* 그림자 */
    ctx.fillStyle='rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.ellipse(vx+bodyL*0.55,baseY+9,bodyL*0.6,2.5,0,0,7); ctx.fill();
    /* 헤드라이트 콘 */
    if(dark>0.25){
      const hg=ctx.createLinearGradient(vx+bodyL+cabL-2,0,vx+bodyL+cabL+95,0);
      hg.addColorStop(0,`rgba(255,220,150,${0.3*dark*(wx==='fog'?1.6:1)})`); hg.addColorStop(1,'rgba(255,220,150,0)');
      ctx.fillStyle=hg;
      ctx.beginPath(); ctx.moveTo(vx+bodyL+cabL-3,vy+8);
      ctx.lineTo(vx+bodyL+cabL+100,vy);
      ctx.lineTo(vx+bodyL+cabL+100,vy+26); ctx.lineTo(vx+bodyL+cabL-3,vy+13);
      ctx.closePath(); ctx.fill();
      /* 라이트 콘 안 먼지 */
      for(let i=0;i<5;i++){ const dx=vx+bodyL+cabL+((t*30+i*23)%80), dy=vy+6+hash(i*7)*12;
        ctx.fillStyle=`rgba(255,230,180,${0.25*dark})`; ctx.fillRect(P(dx),P(dy),1,1); }
    }
    if(spriteVan(vx,vy,baseY,bodyL,speed,dark,wx,up,bnc,bnc2)) return;
    /* ── 차체: 박스(투톤) ── */
    ctx.fillStyle='#8d8474';                        // 상부 베이지
    ctx.fillRect(vx,vy-bodyH,bodyL,bodyH-7);
    ctx.fillStyle='#6f6250';                        // 하부 브라운 밴드
    ctx.fillRect(vx,vy-7,bodyL,12);
    ctx.fillStyle='#4c4438';                        // 스커트
    ctx.fillRect(vx,vy+3,bodyL,2);
    /* 팝업 루프 + 러기지랙 */
    ctx.fillStyle='#5d564a'; ctx.fillRect(vx+6,vy-bodyH-4,bodyL-24,4);
    ctx.strokeStyle='#3c372f'; ctx.lineWidth=1;
    line(vx+4,vy-bodyH-5, vx+bodyL-14,vy-bodyH-5);
    line(vx+4,vy-bodyH-5, vx+4,vy-bodyH);
    line(vx+bodyL-14,vy-bodyH-5, vx+bodyL-14,vy-bodyH);
    /* 지붕짐: 스페어 + 제리캔 (+업그레이드 장비) */
    ctx.fillStyle='#23262e'; circ(vx+bodyL-20,vy-bodyH-7,4);
    ctx.fillStyle='#3d414f'; circ(vx+bodyL-20,vy-bodyH-7,2);
    ctx.fillStyle='#943b32'; ctx.fillRect(vx+32,vy-bodyH-9,7,5);
    ctx.fillStyle='#b8443a'; ctx.fillRect(vx+32,vy-bodyH-9,7,1);
    if(up.solar){ /* 태양광 패널 */
      ctx.fillStyle='#274e74'; ctx.fillRect(vx+7,vy-bodyH-8,Math.min(23,bodyL-44),4);
      ctx.strokeStyle='#3f77aa'; ctx.lineWidth=1;
      for(let px2=vx+10;px2<vx+7+Math.min(23,bodyL-44);px2+=5) line(px2,vy-bodyH-8,px2,vy-bodyH-4);
      ctx.fillStyle=`rgba(160,210,255,${0.25+0.2*Math.sin(t*2)})`; ctx.fillRect(vx+8,vy-bodyH-8,4,1);
    } else {
      ctx.fillStyle='#8a7a55'; ctx.fillRect(vx+8,vy-bodyH-8,9,4);
      ctx.strokeStyle='#4c4438'; line(vx+10,vy-bodyH-8,vx+10,vy-bodyH-4); line(vx+14,vy-bodyH-8,vx+14,vy-bodyH-4);
    }
    if(up.garden){ /* 지붕 텃밭 */
      ctx.fillStyle='#54402c'; ctx.fillRect(vx+20,vy-bodyH-8,10,4);
      ctx.fillStyle='#4f7a3a';
      for(let g=0;g<4;g++){ const gx=vx+21+g*2.4, sway=Math.sin(t*3+g)*0.5;
        ctx.fillRect(P(gx+sway),vy-bodyH-11,1,3); }
      ctx.fillStyle='#7fb35c'; ctx.fillRect(P(vx+22),vy-bodyH-12,1,1); ctx.fillRect(P(vx+27),vy-bodyH-12,1,1);
    }
    if(up.collector){ /* 빗물 집수기: 깔때기+통 */
      ctx.fillStyle='#5a6270';
      ctx.beginPath(); ctx.moveTo(vx+1,vy-bodyH-12); ctx.lineTo(vx+7,vy-bodyH-12); ctx.lineTo(vx+4,vy-bodyH-7); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#3f4757'; ctx.fillRect(vx+2,vy-bodyH-7,4,4);
    }
    if(up.tank1){ /* 보조 연료탱크 (측면 실린더) */
      ctx.fillStyle='#4a4f5c'; ctx.beginPath(); ctx.roundRect(vx+bodyL-15,vy-2,11,5,2); ctx.fill();
      ctx.fillStyle='#5d6472'; ctx.fillRect(vx+bodyL-15,vy-2,11,1);
    }
    if(up.tank2){ ctx.fillStyle='#4a4f5c'; ctx.beginPath(); ctx.roundRect(vx+bodyL-29,vy-2,11,5,2); ctx.fill();
      ctx.fillStyle='#5d6472'; ctx.fillRect(vx+bodyL-29,vy-2,11,1); }
    if(up.armor){ /* 장갑판 */
      ctx.fillStyle='#697080';
      ctx.fillRect(vx+5,vy-5,13,7); ctx.fillRect(vx+24,vy-5,13,7);
      ctx.fillStyle='#8b93a3';
      [[vx+6,vy-4],[vx+16,vy-4],[vx+6,vy+0],[vx+16,vy+0],[vx+25,vy-4],[vx+35,vy-4],[vx+25,vy+0],[vx+35,vy+0]]
        .forEach(([rx,ry])=>ctx.fillRect(rx,ry,1,1));
    }
    if(up.sidebox){ /* 사이드 공구함 (후미 하단) */
      ctx.fillStyle='#4f5665'; ctx.fillRect(vx-1,vy-2,6,5);
      ctx.fillStyle='#6a7284'; ctx.fillRect(vx-1,vy-2,6,1);
      ctx.fillStyle='#c9a24a'; ctx.fillRect(vx+1,vy,1,1);            // 잠금쇠
    }
    if(up.stove){ /* 장작 난로 굴뚝 */
      ctx.fillStyle='#3a3f4a'; ctx.fillRect(vx+17,vy-bodyH-9,2,6);
      ctx.fillStyle='#565d6b'; ctx.fillRect(vx+16,vy-bodyH-10,4,1);  // 갓
      if(speed<=0){ for(let sm=0;sm<3;sm++){ const rise=((t*4+sm*3.2)%8);
        ctx.fillStyle=`rgba(210,210,205,${0.3*(1-rise/8)})`;
        ctx.fillRect(P(vx+17+Math.sin(t*2+sm)*1.5), P(vy-bodyH-11-rise), 1,1); } }
    }
    if(up.beehive){ /* 이동 벌통 (지붕 후미) */
      ctx.fillStyle='#a58a4a'; ctx.fillRect(vx+bodyL-9,vy-bodyH-7,5,4);
      ctx.fillStyle='#7a6435'; ctx.fillRect(vx+bodyL-9,vy-bodyH-5,5,1);
      ctx.fillStyle='#2e2a20'; ctx.fillRect(vx+bodyL-7,vy-bodyH-4,1,1); // 입구
      for(let bz=0;bz<2;bz++){ ctx.fillStyle='rgba(240,200,90,0.9)';
        ctx.fillRect(P(vx+bodyL-7+Math.sin(t*7+bz*3)*4), P(vy-bodyH-8+Math.cos(t*9+bz*2)*2), 1,1); }
    }
    if(up.lightbar){ /* 라이트바 (캡 지붕) */
      ctx.fillStyle='#2f333d'; ctx.fillRect(vx+bodyL+2,vy-bodyH+2,9,2);
      if(dark>0.3){ ctx.fillStyle='#ffe9a8';
        for(let lb=0;lb<4;lb++) ctx.fillRect(vx+bodyL+3+lb*2,vy-bodyH+3,1,1);
        ctx.fillStyle='rgba(255,235,170,0.12)'; ctx.fillRect(vx+bodyL+2,vy-bodyH+4,10,3); }
    }
    if(up.snorkel){ /* 스노클 (캡 옆 흡기 파이프) */
      ctx.fillStyle='#3a3f4a';
      ctx.fillRect(vx+bodyL+cabL-3,vy-bodyH+3,2,12);
      ctx.fillRect(vx+bodyL+cabL-5,vy-bodyH+2,4,2);                  // 흡기구(앞으로 꺾임)
    }
    if(up.bullbar){ /* 전면 가드 */
      ctx.strokeStyle='#5d6472'; ctx.lineWidth=1;
      line(vx+bodyL+cabL+2,vy-bodyH+14, vx+bodyL+cabL+2,vy+4);
      line(vx+bodyL+cabL+1,vy-bodyH+16, vx+bodyL+cabL+3,vy-bodyH+16);
      line(vx+bodyL+cabL+1,vy-1, vx+bodyL+cabL+3,vy-1);
    }
    if(up.winch){ /* 전면 윈치 드럼 */
      ctx.fillStyle='#2b2f3a'; ctx.fillRect(vx+bodyL+cabL,vy+2,4,3);
      ctx.fillStyle='#8b93a3'; ctx.fillRect(vx+bodyL+cabL+1,vy+3,2,1); // 케이블 감김
      ctx.fillStyle='#c9a24a'; ctx.fillRect(vx+bodyL+cabL+4,vy+4,1,1); // 훅
    }
    if(up.mudtires){ /* 험로 타이어 펜더 플레어 */
      ctx.fillStyle='#3a3f4c';
      ctx.fillRect(vx+7,vy+3,13,2); ctx.fillRect(vx+bodyL-1,vy+3,13,2);
    }
    if(up.garden2){ /* 지붕 온실 — 텃밭 위 유리 아치 */
      ctx.strokeStyle='rgba(175,215,240,0.55)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(P(vx+25),P(vy-bodyH-8),6,Math.PI,0); ctx.stroke();
      ctx.fillStyle='rgba(220,240,255,0.35)'; ctx.fillRect(P(vx+21+((t*2)%7)),P(vy-bodyH-12),1,1); // 유리 반짝
    }
    if(up.scope){ /* 지붕 망원대 */
      ctx.fillStyle='#3a3f4a'; ctx.fillRect(vx+30,vy-bodyH-11,1,7);
      ctx.fillStyle='#565d6b'; ctx.fillRect(vx+28,vy-bodyH-12,4,2);
      ctx.fillStyle='rgba(180,220,255,0.8)'; ctx.fillRect(vx+31,vy-bodyH-12,1,1); // 렌즈
    }
    if(up.horn){ /* 왕경적 (지붕 후미 나팔 2개) */
      ctx.fillStyle='#c9c2b0';
      ctx.fillRect(vx+1,vy-bodyH-7,3,2); ctx.fillRect(vx,vy-bodyH-8,1,4);
      ctx.fillRect(vx+1,vy-bodyH-11,3,2); ctx.fillRect(vx,vy-bodyH-12,1,4);
    }
    if(up.armory){ /* 무기 선반 — 뒷문에 석궁 걸림 */
      ctx.strokeStyle='#4c4438'; ctx.lineWidth=1;
      line(vx+1,vy-bodyH+9, vx+5,vy-bodyH+11);
      line(vx+3,vy-bodyH+8, vx+3,vy-bodyH+13);
      ctx.fillStyle='#8a6c42'; ctx.fillRect(vx+2,vy-bodyH+10,2,1);
    }
    if(up.bunk){ /* 2층 침대 — 상단 쪽창 */
      ctx.fillStyle= dark>0.35? '#e8a95c':'rgba(170,198,220,0.45)';
      ctx.fillRect(vx+28,vy-bodyH+1,6,2);
      ctx.strokeStyle='#4c4438'; line(vx+31,vy-bodyH+1,vx+31,vy-bodyH+3);
    }
    if(up.awning){ /* 차양 — 주행 중엔 말린 롤, 정차 중엔 펼침 */
      if(speed>0){
        ctx.fillStyle='#7a4a3f'; ctx.fillRect(vx+7,vy-bodyH+2,18,2);
        ctx.fillStyle='#9c5f50'; for(let aw=0;aw<4;aw++) ctx.fillRect(vx+9+aw*4,vy-bodyH+2,1,2);
      } else {
        ctx.fillStyle='#7a4a3f'; ctx.fillRect(vx-16,vy-bodyH+3,24,2);
        ctx.fillStyle='#b8877a'; for(let aw=0;aw<5;aw++) ctx.fillRect(vx-15+aw*5,vy-bodyH+3,2,1);
        ctx.strokeStyle='#4c4438'; line(vx-15,vy-bodyH+5, vx-15,baseY+7);   // 지지대
      }
    }
    /* ── 캡 ── */
    ctx.fillStyle='#988e7c';
    ctx.beginPath();
    ctx.moveTo(vx+bodyL,vy-bodyH+5);
    ctx.lineTo(vx+bodyL+cabL-6,vy-bodyH+6);
    ctx.lineTo(vx+bodyL+cabL-1,vy-bodyH+13);
    ctx.lineTo(vx+bodyL+cabL,vy+1);
    ctx.lineTo(vx+bodyL,vy+1); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#6f6250'; ctx.fillRect(vx+bodyL,vy-6,cabL,11);
    ctx.fillStyle='#4c4438'; ctx.fillRect(vx+bodyL,vy+3,cabL,2);
    /* 보닛 */
    ctx.fillStyle='#877d6b'; ctx.fillRect(vx+bodyL+cabL-6,vy-bodyH+13,6,4);
    /* 앞유리 + 운전자 */
    ctx.fillStyle= dark>0.4?'rgba(150,180,215,0.32)':'rgba(185,210,232,0.6)';
    ctx.beginPath();
    ctx.moveTo(vx+bodyL+1,vy-bodyH+7);
    ctx.lineTo(vx+bodyL+cabL-7,vy-bodyH+8);
    ctx.lineTo(vx+bodyL+cabL-4,vy-bodyH+14);
    ctx.lineTo(vx+bodyL+1,vy-bodyH+14); ctx.closePath(); ctx.fill();
    /* 사이드미러 */
    ctx.fillStyle='#3c372f'; ctx.fillRect(vx+bodyL+cabL-2,vy-bodyH+8,2,3);
    /* ── 옆창 (거주구) : 따뜻한 빛 + 탑승자 ── */
    const winY=vy-bodyH+5, winH=9;
    ctx.fillStyle= dark>0.35? '#f5b869':'rgba(170,198,220,0.55)';
    ctx.fillRect(vx+7,winY,bodyL-16,winH);
    if(dark>0.35){ ctx.fillStyle='rgba(255,235,190,0.5)'; ctx.fillRect(vx+7,winY,bodyL-16,2); }
    const curtained = up.curtain && dark>0.35 && speed<=0;
    if(curtained){ /* 암막 커튼 — 불빛이 새지 않는다 */
      ctx.fillStyle='#453a4a'; ctx.fillRect(vx+7,winY,bodyL-16,winH-1);
      ctx.fillStyle='rgba(255,220,160,0.5)'; ctx.fillRect(vx+7,winY+winH-1,bodyL-16,1); // 틈새 빛
    }
    if(up.fridge && !curtained){ /* 냉장 박스 — 창문 너머로 보임 */
      ctx.fillStyle='#dfe5ea'; ctx.fillRect(vx+17,winY+3,4,5);
      ctx.fillStyle='#9fc3d8'; ctx.fillRect(vx+18,winY+4,1,1);
    }
    ctx.strokeStyle='#4c4438';
    line(vx+24,winY,vx+24,winY+winH); line(vx+41,winY,vx+41,winY+winH);
    if(up.cabin) line(vx+58,winY,vx+58,winY+winH);
    if(up.kitchen && speed<=0){ /* 간이 주방 — 정차 시 조리 해치 열림 */
      ctx.fillStyle='#877d6b'; ctx.fillRect(vx+26,vy-11,10,1);      // 열린 판(선반)
      ctx.fillStyle='#3c372f'; ctx.fillRect(vx+26,vy-10,1,3); ctx.fillRect(vx+35,vy-10,1,3); // 지지
      ctx.fillStyle='#2b2f3a'; ctx.fillRect(vx+29,vy-13,3,2);       // 냄비
      const rise=((t*5)%5);
      ctx.fillStyle=`rgba(240,240,235,${0.4*(1-rise/5)})`;
      ctx.fillRect(P(vx+30+Math.sin(t*3)*0.8),P(vy-14-rise),1,1);   // 김
    }
    /* 탑승자 (나 + 동료) — 인원수만큼 창문에 균등 배치 */
    const outside=(mealT>0&&speed<=0&&S)? S.party.slice(0,2):[];   // 정차 식사 중엔 밖에 있는 동료
    const riders=S? [['#2c3346'],...S.party.filter(id=>!outside.includes(id)).map(id=>[D.comps[id].color])]:[['#2c3346']];
    const seatSpan=bodyL-20, seatGap=Math.min(13, seatSpan/Math.max(1,riders.length));  // 많으면 촘촘히
    if(!curtained) riders.forEach((r,i)=>{
      const hx=P(vx+bodyL-8-i*seatGap);
      const nod = Math.sin(t*1.2+i*2.7)>0.96?1:0;                    // 가끔 고개 까딱
      const doze = S && S.fatigue>=70 && speed>0 && i===1+(S.day%3) && i>0;  // 피로하면 누군가 존다
      const hy=P(winY+winH-3+((i%2)?bnc2-bnc:0)) + (doze? 1:nod);
      ctx.fillStyle='#171a24'; ctx.fillRect(hx-2,hy-3,5,4);          // 몸/얼굴 실루엣
      ctx.fillStyle=r[0]; ctx.fillRect(hx-2,hy-5,5,2);               // 머리색
      ctx.fillRect(hx-3,hy-4,1,2); ctx.fillRect(hx+3,hy-4,1,2);
      if(doze && Math.sin(t*2)>0){ ctx.fillStyle='rgba(200,215,240,0.65)';
        ctx.fillRect(hx+4,hy-8,1,1); ctx.fillRect(hx+5,hy-10,1,1); } // 쿨쿨 zZ
      if(i===talkIdx && talkT>0){                                    // 말하는 중 ・・・
        ctx.fillStyle='rgba(255,235,190,0.9)';
        const dn=1+Math.floor((t*4)%3);
        for(let d2=0;d2<dn;d2++) ctx.fillRect(hx-2+d2*2, hy-8, 1,1);
      }
    });
    /* 식사 연출: 창문 안 먹는 모션 + 김 (아침 배급·점심 후 16초) */
    if(mealT>0){
      riders.forEach((r,i)=>{
        const hx=P(vx+bodyL-8-i*seatGap), hy=P(winY+winH-3+((i%2)?bnc2-bnc:0));
        const toMouth = Math.sin(t*4.5+i*1.7)>0;                 // 손이 입으로 갔다 내려갔다
        ctx.fillStyle='#e8d9a8';                                  // 주먹밥
        ctx.fillRect(hx+(toMouth?0:1), hy-(toMouth?3:1), 2,1);
      });
      /* 김 — 창문 위로 몽글몽글 */
      for(let k=0;k<3;k++){
        const sx=vx+14+k*16, rise=((t*6+k*4)%7);
        ctx.fillStyle=`rgba(240,240,235,${0.35*(1-rise/7)})`;
        ctx.fillRect(P(sx+Math.sin(t*3+k)*1.2), P(winY-1-rise), 1,1);
      }
    }
    /* 정차 중 식사: 밴 옆에 서서 먹는 실루엣 */
    if(mealT>0 && speed<=0 && S){
      const eaters=S.party.slice(0,2);
      eaters.forEach((id,i)=>{
        const fx=P(vx-9-i*9), fy=P(baseY+6);                     // 지면
        const bob=Math.sin(t*4+i*2)>0?1:0;
        ctx.fillStyle='rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.ellipse(fx+2,fy+1,3,1,0,0,7); ctx.fill();
        ctx.fillStyle='#171a24'; ctx.fillRect(fx,fy-7,4,7);       // 몸
        ctx.fillStyle=D.comps[id].color; ctx.fillRect(fx,fy-9,4,2); // 머리
        ctx.fillStyle='#d8c894'; ctx.fillRect(fx+4,fy-5-bob,2,1);  // 그릇 든 손
        const rise=((t*5+i*3)%5);
        ctx.fillStyle=`rgba(240,240,235,${0.4*(1-rise/5)})`;      // 그릇 김
        ctx.fillRect(P(fx+4+Math.sin(t*4+i)*0.8), P(fy-7-rise-bob), 1,1);
      });
      /* 혼자면 나라도: 운전자 자리 비우고 밴 옆에서 */
      if(!eaters.length){
        const fx=P(vx-9), fy=P(baseY+6);
        const bob=Math.sin(t*4)>0?1:0;
        ctx.fillStyle='#171a24'; ctx.fillRect(fx,fy-7,4,7);
        ctx.fillStyle='#2c3346'; ctx.fillRect(fx,fy-9,4,2);
        ctx.fillStyle='#d8c894'; ctx.fillRect(fx+4,fy-5-bob,2,1);
      }
    }
    /* 보리: 가끔 창밖으로 고개 내밀기 */
    if(S&&S.dog&&!curtained){
      const out=speed>0&&Math.sin(t*0.5)>0.2;
      if(out){
        const dx=vx+5, dy=winY+2+Math.sin(t*9)*0.7;
        ctx.fillStyle='#c9a36a'; ctx.fillRect(P(dx-4),P(dy),5,4);       // 머리(창밖)
        ctx.fillRect(P(dx-6),P(dy+1),2,2);                              // 주둥이
        ctx.fillStyle='#8a6c42'; ctx.fillRect(P(dx-3),P(dy-2),2,2); ctx.fillRect(P(dx),P(dy-2),2,2); // 귀 펄럭
        ctx.fillStyle='#e2857f'; ctx.fillRect(P(dx-6),P(dy+3),1,1);     // 혀
      } else {
        ctx.fillStyle='#c9a36a'; ctx.fillRect(vx+8,winY+winH-4,4,3);
        ctx.fillRect(vx+8,winY+winH-6,1,2); ctx.fillRect(vx+11,winY+winH-6,1,2);
      }
    }
    /* 문/디테일/녹 */
    ctx.strokeStyle='rgba(30,26,20,0.5)';
    line(vx+bodyL*0.55,vy-bodyH+4,vx+bodyL*0.55,vy+2);
    ctx.fillStyle='#3c372f'; ctx.fillRect(P(vx+bodyL*0.55)+2,vy-9,3,1); // 손잡이
    ctx.fillStyle='rgba(122,70,40,0.55)';
    ctx.fillRect(vx+3,vy-2,6,3); ctx.fillRect(vx+bodyL-9,vy-bodyH+9,3,5);
    ctx.fillRect(vx+bodyL+4,vy+1,5,2);
    /* 덕트테이프 X 패치 */
    ctx.strokeStyle='rgba(190,190,180,0.5)';
    line(vx+46,vy-4,vx+52,vy+2); line(vx+52,vy-4,vx+46,vy+2);
    /* 뒷사다리 */
    ctx.strokeStyle='#4c4438';
    line(vx+2,vy-bodyH+2,vx+2,vy+2);
    for(let ly=vy-bodyH+4;ly<vy+2;ly+=4) line(vx,ly,vx+4,ly);
    /* 안테나 + 깃발 */
    ctx.strokeStyle='#666';
    const antTop = up.antenna? -24:-15;
    line(vx+10,vy-bodyH-4,vx+7,vy-bodyH+antTop);
    if(up.antenna){
      ctx.strokeStyle='#777';
      ctx.beginPath(); ctx.arc(vx+7,vy-bodyH+antTop-1,2.6,-0.6,2.5); ctx.stroke();
      ctx.fillStyle=`rgba(255,90,90,${0.5+0.5*Math.sin(t*3)})`;
      ctx.fillRect(P(vx+7)-1,P(vy-bodyH+antTop)-2,1,1);
    }
    const flap=Math.sin(t*(speed>0?14:3))*1.6;
    ctx.fillStyle='#ffb454';
    ctx.beginPath(); ctx.moveTo(vx+7,vy-bodyH+antTop+2);
    ctx.lineTo(vx+1,vy-bodyH+antTop+4+flap*0.4); ctx.lineTo(vx+7,vy-bodyH+antTop+6);
    ctx.closePath(); ctx.fill();
    /* 바퀴 */
    const spin=worldX*0.3;
    [[vx+13,bnc],[vx+bodyL+5,bnc2]].forEach(wj=>{
      const wx0=wj[0], wy0=P(baseY+6);
      ctx.fillStyle='#0e1016'; circ(wx0,wy0,5.5);
      ctx.fillStyle='#2b2f3a'; circ(wx0,wy0,3.2);
      ctx.fillStyle='#464c5c'; circ(wx0,wy0,1.4);
      ctx.strokeStyle='#14161f'; ctx.lineWidth=1;
      for(let s2=0;s2<2;s2++){ const a=spin+s2*Math.PI/2;
        line(wx0-Math.cos(a)*3,wy0-Math.sin(a)*3,wx0+Math.cos(a)*3,wy0+Math.sin(a)*3); }
    });
    /* 흙받이 */
    ctx.fillStyle='#33302a';
    ctx.fillRect(vx+7,P(baseY+3),3,4); ctx.fillRect(vx+bodyL+11,P(baseY+3),3,4);
    /* 라이트 */
    ctx.fillStyle= dark>0.25?'#ffe9b0':'#d8d2be';
    ctx.fillRect(vx+bodyL+cabL-2,vy-3,2,3);
    const braking=S&&S.driving&&speed===0;
    ctx.fillStyle= braking?'#ff6055': speed>0?'#c74138':'#6e2620';
    ctx.fillRect(vx-2,vy-3,2,3);
    if(dark>0.4){ ctx.fillStyle='rgba(255,80,70,0.25)'; ctx.fillRect(vx-4,vy-4,3,5); }
    /* 젖은 노면 반사 */
    if(wx==='rain'){
      ctx.globalAlpha=0.18;
      ctx.fillStyle= dark>0.25?'#ffe9b0':'#d8d2be';
      ctx.fillRect(vx+bodyL+cabL-2,baseY+9,2,5);
      ctx.fillStyle='#ff6055'; ctx.fillRect(vx-2,baseY+9,2,5);
      if(dark>0.35){ ctx.fillStyle='#f5b869'; ctx.fillRect(vx+7,baseY+9,bodyL-16,2); }
      ctx.globalAlpha=1;
    }
    /* 배기 */
    if(speed>0&&Math.random()<0.3) puffs.push({x:vx-3,y:vy+5,r:1,a:0.4,vx:-9,vy:-2-Math.random()*2});
    if(S&&!S.driving&&G.isNight()&&Math.random()<0.08) puffs.push({x:vx+30,y:vy-bodyH-9,r:1,a:0.25,vx:1.5,vy:-4});
  }
  function drawPuffs(dt){
    for(let i=puffs.length-1;i>=0;i--){ const p2=puffs[i];
      p2.x+=p2.vx*dt; p2.y+=p2.vy*dt; p2.r+=2.4*dt; p2.a-=0.35*dt;
      if(p2.a<=0){ puffs.splice(i,1); continue; }
      ctx.fillStyle=`rgba(185,185,185,${p2.a})`;
      ctx.fillRect(P(p2.x),P(p2.y),Math.max(1,P(p2.r)),Math.max(1,P(p2.r))); }
  }

  /* ── 날씨/분위기 ── */
  let dustP=null;
  function weather(wx,dark,speed,dt){
    if(wx==='rain'||wx==='storm'){
      const storm = wx==='storm';
      if(!rainDrops){ rainDrops=[]; for(let i=0;i<64;i++) rainDrops.push({x:Math.random()*W,y:Math.random()*H,s:130+Math.random()*80}); }
      ctx.strokeStyle=`rgba(160,180,210,${storm?0.5:0.4})`; ctx.lineWidth=1;
      const windX=-(speed>0?55:14)*(storm?2:1);
      const n=storm?64:42;
      for(let i=0;i<n;i++){ const d=rainDrops[i];
        d.y+=d.s*(storm?1.5:1)*dt; d.x+=windX*dt;
        if(d.y>H){ d.y=-4; d.x=Math.random()*W*1.3; }
        if(d.x<0) d.x+=W*1.2;
        ctx.beginPath(); ctx.moveTo(P(d.x),P(d.y)); ctx.lineTo(P(d.x+windX*0.045),P(d.y+(storm?7:5))); ctx.stroke();
      }
      ctx.fillStyle=`rgba(14,19,36,${storm?0.4:0.28})`; ctx.fillRect(0,0,W,H);
      /* 날리는 잎/비닐 (폭풍) */
      if(storm){ for(let i=0;i<4;i++){ const fx2=((i*83+ t*(140+i*30))%(W+40))-20;
          const fy=H*0.3+Math.sin(t*4+i*2)*H*0.2+i*9;
          ctx.fillStyle='rgba(120,130,110,0.5)';
          ctx.fillRect(P(W-fx2),P(fy),2,1); } }
      /* 번개 */
      if(Math.random()<(storm?0.011:0.0035)) flashT=0.22;
      if(flashT>0){ flashT-=dt;
        ctx.fillStyle=`rgba(210,225,255,${flashT*(storm?1.1:0.9)})`; ctx.fillRect(0,0,W,H); }
    } else if(wx==='dust'){
      if(!dustP){ dustP=[]; for(let i=0;i<26;i++) dustP.push({x:Math.random()*W,y:Math.random()*H,s:40+Math.random()*70}); }
      const dg=ctx.createLinearGradient(0,0,0,H);
      dg.addColorStop(0,'rgba(190,120,55,0.12)'); dg.addColorStop(0.7,'rgba(205,135,60,0.22)'); dg.addColorStop(1,'rgba(180,110,50,0.16)');
      ctx.fillStyle=dg; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='rgba(230,180,120,0.5)';
      for(const d of dustP){
        d.x-=d.s*(speed>0?2:1)*dt; d.y+=Math.sin(t*3+d.s)*0.3;
        if(d.x<0){ d.x=W+4; d.y=Math.random()*H; }
        ctx.fillRect(P(d.x),P(d.y),1,1);
      }
    } else if(wx==='fog'){
      const bands=3;
      for(let i=0;i<bands;i++){
        const y=H*0.52+i*H*0.14, sway=Math.sin(t*0.5+i*2)*3;
        ctx.fillStyle=`rgba(150,160,180,${0.07+i*0.05})`;
        ctx.fillRect(0,P(y+sway),W,P(H*0.13));
      }
    } else if(darknessAt(S?S.min/60:21)>0.6&&S&&G.regionOf()!=='north'){
      /* 반딧불이 (남부/중부 맑은 밤) */
      for(let i=0;i<7;i++){
        const fx=(hash(i*13)*W+Math.sin(t*0.7+i*2.1)*8+worldX*-0.06)%W;
        const fy=H*0.55+hash(i*7)*H*0.12+Math.sin(t*1.1+i)*3;
        const a=0.25+0.55*Math.max(0,Math.sin(t*1.8+i*2.7));
        ctx.fillStyle=`rgba(255,220,120,${a})`;
        ctx.fillRect(P((fx+W)%W),P(fy),1,1);
      }
    }
  }

  /* ── 천리안 관측 시각 언어 ──
     얼굴 대신 센서·스캔·정렬 오류로 존재감을 보인다. pursuit가 높을수록 노골적이다. */
  function cheollianFx(roadY){
    if(!S) return;
    const seoul = S.at==='seoul' || (S.driving&&S.driving.to==='seoul') || !!S.flags.seoul_open;
    const level=Math.max(S.pursuit||0,seoul?5:0);
    if(level<=0) return;
    const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cyan='85,224,200', red='226,87,79';

    /* 먼 구조물의 카메라 눈. 처음엔 점처럼, 관측이 오르면 조리개처럼 읽힌다. */
    const eyes=Math.min(6,level+1);
    for(let i=0;i<eyes;i++){
      const ex=P(18+hash(i*19+7)*(W-36));
      const ey=P(H*0.29+hash(i*31+3)*H*0.31);
      const blink=reduced?0.7:0.35+0.65*Math.max(0,Math.sin(t*(1.1+i*0.13)+i*2.4));
      ctx.fillStyle=`rgba(${seoul&&i%3===0?red:cyan},${0.22+blink*0.55})`;
      ctx.fillRect(ex,ey,1,1);
      if(level>=2&&blink>0.72){ ctx.fillRect(ex-2,ey,1,1); ctx.fillRect(ex+2,ey,1,1); }
      if(level>=4&&blink>0.84){ ctx.fillRect(ex,ey-2,1,1); ctx.fillRect(ex,ey+2,1,1); }
    }

    /* 화면을 훑는 계측선. 비·안개와 싸우지 않도록 매우 옅게 유지한다. */
    if(level>=2){
      const scanY=P(reduced?H*0.45:(t*(9+level*2))%(H+12)-6);
      ctx.fillStyle=`rgba(${cyan},${0.025+level*0.012})`; ctx.fillRect(0,scanY,W,1);
      if(level>=4){ ctx.fillStyle=`rgba(${cyan},0.045)`; ctx.fillRect(0,scanY+2,W,1); }
    }

    /* 달구지를 인식한 추적 프레임. 네 모서리만 남겨 감시 장치처럼 보이게 한다. */
    if(level>=3){
      const bx=P(W*0.22-10), by=P(roadY+(H-roadY)*0.42-43), bw=101, bh=59;
      const pulse=reduced?0.55:0.3+0.3*(0.5+0.5*Math.sin(t*2.7));
      ctx.strokeStyle=`rgba(${cyan},${pulse})`; ctx.lineWidth=1;
      const c=7;
      line(bx,by,bx+c,by); line(bx,by,bx,by+c);
      line(bx+bw,by,bx+bw-c,by); line(bx+bw,by,bx+bw,by+c);
      line(bx,by+bh,bx+c,by+bh); line(bx,by+bh,bx,by+bh-c);
      line(bx+bw,by+bh,bx+bw-c,by+bh); line(bx+bw,by+bh,bx+bw,by+bh-c);
      if(level>=4){
        const tx=P(W-16), ty=P(H*0.24);
        ctx.strokeStyle=`rgba(${cyan},0.12)`; line(tx,ty,bx+bw,by+6);
        ctx.fillStyle=`rgba(${seoul?red:cyan},0.75)`; ctx.fillRect(tx-1,ty-1,3,3);
        ctx.fillStyle='#070a12'; ctx.fillRect(tx,ty,1,1);
      }
    }

    /* 관측 5단계: 영상 자체가 짧게 어긋난다. */
    if(level>=5&&!reduced&&Math.sin(t*1.7)>0.94){
      const gy=P(H*(0.2+hash(Math.floor(t*3))*0.58));
      const shift=Math.sin(t*17)>0?3:-3;
      ctx.globalAlpha=0.42;
      ctx.drawImage(off,0,gy,W,2,shift,gy,W,2);
      ctx.drawImage(off,0,gy+4,W,1,-shift,gy+4,W,1);
      ctx.globalAlpha=1;
    }

    /* 서울에서는 코어의 붉은 맥박이 관측망 전체에 섞인다. */
    if(seoul){
      const beat=reduced?0.08:Math.pow(Math.max(0,Math.sin(t*1.35)),12)*0.15;
      if(beat>0.01){ ctx.fillStyle=`rgba(${red},${beat})`; ctx.fillRect(0,0,W,H); }
      ctx.fillStyle=`rgba(${red},${0.45+0.35*Math.sin(t*1.35)})`;
      ctx.fillRect(P(W*0.8),P(H*0.16),2,2);
    }
  }

  /* ── 메인 draw ── */
  function draw(dt){
    if(!ctx) return; t+=dt;
    mealT=Math.max(0,mealT-dt);
    talkT=Math.max(0,talkT-dt);
    signTexts=[];
    const hour=S? S.min/60:21.2;
    const dark=darknessAt(hour);
    const wx=S? (S.wx||'clear'):'clear';
    const speed=S&&S.driving&&!UI.modalOpen()?1:0;
    if(speed>0) worldX+=64*dt;

    drawSky(hour,dark,wx);
    const bio=bioOf();
    if(bio==='mount'){
      ridge(H*0.42,20,0.008,3, mix('#1d2544','#0d111f',dark*0.55),0.08);
      ridge(H*0.50,17,0.013,9, mix('#171d36','#0a0d19',dark*0.55),0.16);
    } else {
      ridge(H*0.52,11,0.009,3, mix('#1b2340','#0d111f',dark*0.55),0.1);
      ridge(H*0.58,8,0.016,9, mix('#161c33','#0a0d19',dark*0.55),0.18);
    }
    namsan(dark);
    if(bio==='coast'||bio==='lake') water(bio,dark);
    const density = bio==='city'?0.85: bio==='coast'?0.3: bio==='mount'?0.18:
      bio==='lake'?0.26: bio==='bamboo'?0.2: 0.45;
    buildings(0.34,52,density,H*0.705,14, bio==='city'?66:58, mix('#131a2e','#080b15',dark*0.5),dark);
    if(bio==='mount') cliffs(0.5, mix('#252c48','#111420',dark*0.5));
    if(bio==='rural') paddies(0.5);
    if(bio==='bamboo') bambooStrip(0.55);
    if(bio!=='coast'&&bio!=='lake') pines(0.46,H*0.705, mix('#0f1626','#070a12',dark*0.5));
    buildings(0.55,64,density*0.72,H*0.715,9,30, mix('#0f1526','#060910',dark*0.5),dark);
    const roadY=road(dark,wx);
    deadCars(0.85,roadY+P((H-roadY)*0.32), mix('#181d2c','#0b0e18',dark*0.5));
    poles(0.85,roadY+2, mix('#20263a','#111420',dark*0.4));
    signs(1.0,roadY+1);
    van(roadY,speed,dark,wx);
    drawPuffs(dt); drawCrows(dt);
    weather(wx,dark,speed,dt);
    cheollianFx(roadY);
    /* 비네트 */
    const vg=ctx.createRadialGradient(W/2,H*0.45,H*0.3,W/2,H*0.5,H*0.95);
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.42)');
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);

    /* ── 블릿 (픽셀 업스케일) ── */
    dctx.clearRect(0,0,VW,VH);
    dctx.imageSmoothingEnabled=false;
    dctx.drawImage(off,0,0,W,H,0,0,VW,VH);
    /* 표지판 텍스트만 선명하게 */
    const sc=VW/W;
    dctx.font='700 11px ui-monospace,monospace'; dctx.textAlign='center';
    for(const st of signTexts){
      dctx.fillStyle='#cfe4d6';
      dctx.fillText('서울 '+st.km, st.x*sc, st.y*sc);
      dctx.font='8px ui-monospace,monospace'; dctx.fillStyle='#8fbf9d';
      dctx.fillText('SEOUL', st.x*sc, st.y*sc+9);
      dctx.font='700 11px ui-monospace,monospace';
    }
    dctx.textAlign='left';
  }

  /* ── 타이틀 (같은 픽셀 파이프라인) ── */
  let tcv,tdctx,toff,tctx2,tt=0,TW=236,TH=410;
  function initTitle(canvas){
    tcv=canvas; tdctx=tcv.getContext('2d');
    toff=document.createElement('canvas'); tctx2=toff.getContext('2d');
    tctx2.imageSmoothingEnabled=false;
    if(!vanSprite){ vanSprite=new Image(); vanSprite.src=D.vanSprites.base; }
    const fit=()=>{ const vw=tcv.clientWidth||420, vh=tcv.clientHeight||820;
      tcv.width=vw*DPR; tcv.height=vh*DPR; tdctx.setTransform(DPR,0,0,DPR,0,0);
      TH=Math.round(TW*vh/vw); toff.width=TW; toff.height=TH; };
    new ResizeObserver(fit).observe(tcv); fit();
  }
  function drawTitle(dt){
    if(!tctx2) return; tt+=dt;
    const c=tctx2, w=TW, h=TH;
    /* 밤하늘 밴드 */
    const cols=['#04050e','#05060f','#070812','#0a0c18','#0d1020','#131228','#1a142a','#221629'];
    const skyH=h*0.66;
    cols.forEach((col,i)=>{ c.fillStyle=col;
      c.fillRect(0,P(skyH*i/cols.length),w,Math.ceil(skyH/cols.length)+1); });
    /* 별 */
    for(let i=0;i<80;i++){ const x=P(hash(i)*w), y=P(hash(i+55)*h*0.5);
      c.fillStyle=`rgba(220,228,255,${0.2+0.5*hash(i+9)*(0.5+0.5*Math.sin(tt+i))})`;
      c.fillRect(x,y,1,1); }
    /* 달 */
    c.fillStyle='#e8e6da'; c.beginPath(); c.arc(w*0.78,h*0.12,8,0,7); c.fill();
    c.fillStyle='#04050e'; c.beginPath(); c.arc(w*0.78-3.4,h*0.12-2,7,0,7); c.fill();
    /* 지평선 도시 + 멀리 남산 (청록 점) */
    c.fillStyle='#0a0d1a';
    for(let i=0;i<12;i++){ const bw=8+hash(i*3)*14, x=i*(w/12), bh=h*0.05+hash(i*7)*h*0.1;
      c.fillRect(P(x),P(h*0.66-bh),P(bw),P(bh));
      if(hash(i*11)>0.75){ c.fillStyle=`rgba(85,224,200,${0.3+0.4*Math.sin(tt*2+i)})`;
        c.fillRect(P(x+bw*0.4),P(h*0.66-bh+3),1,1); c.fillStyle='#0a0d1a'; } }
    /* 남산타워 미니 */
    const nx=w*0.62;
    c.fillStyle='#0d1322';
    c.beginPath(); c.moveTo(nx-3,h*0.66); c.lineTo(nx+3,h*0.66); c.lineTo(nx+1,h*0.66-13); c.lineTo(nx-1,h*0.66-13); c.closePath(); c.fill();
    c.fillRect(P(nx-2.5),P(h*0.66-15),5,2.5); c.fillRect(P(nx)-0.5,P(h*0.66-22),1,7);
    c.fillStyle=`rgba(85,224,200,${0.5+0.5*Math.sin(tt*2.2)})`; c.fillRect(P(nx)-1,P(h*0.66-23),2,2);
    /* 도로 */
    c.fillStyle='#131722'; c.fillRect(0,P(h*0.66),w,h);
    c.fillStyle='#0e1118'; c.fillRect(0,P(h*0.75),w,h);
    c.fillStyle='rgba(222,206,140,0.35)';
    for(let x=0;x<w;x+=22) c.fillRect(P(x-(tt*18%22)),P(h*0.71),12,1);
    /* 차 (크게) */
    const vx=w*0.3, vy=P(h*0.66), BL=76,BH=30,CL=20;
    const gl=0.75+0.25*Math.sin(tt*1.8);
    c.fillStyle='rgba(0,0,0,0.55)'; c.beginPath(); c.ellipse(vx+BL*0.6,vy+10,BL*0.62,3,0,0,7); c.fill();
    if(vanSprite&&vanSprite.complete&&vanSprite.naturalWidth){
      c.imageSmoothingEnabled=false;
      c.drawImage(vanSprite,P(vx-8),vy-38,96,53);
    } else {
    c.fillStyle='#8d8474'; c.fillRect(P(vx),vy-BH,BL,BH-8);
    c.fillStyle='#6f6250'; c.fillRect(P(vx),vy-8,BL,12);
    c.fillStyle='#5d564a'; c.fillRect(P(vx+8),vy-BH-5,BL-30,5);
    c.fillStyle='#943b32'; c.fillRect(P(vx+38),vy-BH-10,9,6);
    c.fillStyle='#23262e'; c.beginPath(); c.arc(vx+BL-24,vy-BH-8,5,0,7); c.fill();
    c.fillStyle='#988e7c';
    c.beginPath(); c.moveTo(vx+BL,vy-BH+6); c.lineTo(vx+BL+CL-7,vy-BH+7); c.lineTo(vx+BL+CL,vy+1); c.lineTo(vx+BL,vy+1); c.closePath(); c.fill();
    c.fillStyle=`rgba(245,184,105,${0.9*gl})`; c.fillRect(P(vx+9),vy-BH+6,BL-20,11);
    c.fillStyle='rgba(255,235,190,0.5)'; c.fillRect(P(vx+9),vy-BH+6,BL-20,2);
    c.strokeStyle='#4c4438'; c.lineWidth=1;
    c.beginPath(); c.moveTo(vx+30,vy-BH+6); c.lineTo(vx+30,vy-BH+17); c.stroke();
    c.beginPath(); c.moveTo(vx+51,vy-BH+6); c.lineTo(vx+51,vy-BH+17); c.stroke();
    c.fillStyle='#0e1016'; c.beginPath(); c.arc(vx+16,vy+6,6.5,0,7); c.arc(vx+BL+6,vy+6,6.5,0,7); c.fill();
    c.fillStyle='#2b2f3a'; c.beginPath(); c.arc(vx+16,vy+6,3.6,0,7); c.arc(vx+BL+6,vy+6,3.6,0,7); c.fill();
    c.fillStyle='#ffb454';
    c.beginPath(); c.moveTo(vx+10,vy-BH-14); c.lineTo(vx+3,vy-BH-12); c.lineTo(vx+10,vy-BH-10); c.closePath(); c.fill();
    c.strokeStyle='#666'; c.beginPath(); c.moveTo(vx+12,vy-BH-4); c.lineTo(vx+10,vy-BH-14); c.stroke();
    }
    /* 헤드라이트 */
    const hg=c.createLinearGradient(vx+BL+CL,0,vx+BL+CL+120,0);
    hg.addColorStop(0,`rgba(255,220,150,${0.24*gl})`); hg.addColorStop(1,'rgba(255,220,150,0)');
    c.fillStyle=hg;
    c.beginPath(); c.moveTo(vx+BL+CL-2,vy-8); c.lineTo(vx+BL+CL+125,vy-18); c.lineTo(vx+BL+CL+125,vy+9); c.lineTo(vx+BL+CL-2,vy-1); c.closePath(); c.fill();
    /* 모닥불 */
    const fx=vx+BL+CL+34, fy=vy+4;
    const ff=Math.sin(tt*9)*0.8+Math.sin(tt*17)*0.5;
    c.fillStyle='#3c372f'; c.fillRect(P(fx-4),P(fy+1),8,1);
    c.fillStyle='#e2814e'; c.fillRect(P(fx-1.5),P(fy-2+ff*0.4),3,3);
    c.fillStyle='#ffb454'; c.fillRect(P(fx-0.5),P(fy-4+ff),2,3);
    c.fillStyle=`rgba(255,200,120,${0.12+0.05*ff})`; c.beginPath(); c.arc(fx,fy-2,8,0,7); c.fill();
    /* 페이드 */
    const fg=c.createLinearGradient(0,h*0.45,0,h);
    fg.addColorStop(0,'rgba(0,0,0,0)'); fg.addColorStop(1,'rgba(0,0,0,0.85)');
    c.fillStyle=fg; c.fillRect(0,0,w,h);
    /* 블릿 */
    const vw=tcv.clientWidth||420, vh=tcv.clientHeight||820;
    tdctx.imageSmoothingEnabled=false;
    tdctx.clearRect(0,0,vw,vh);
    tdctx.drawImage(toff,0,0,TW,TH,0,0,vw,vh);
  }

  return {init,initTitle,draw,drawTitle, showMeal:(sec)=>{mealT=sec;}, talkPulse:(idx,sec)=>{talkIdx=idx; talkT=sec||3;}};
})();
