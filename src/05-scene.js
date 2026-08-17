/* ═══════════════════ DRIVE SCENE — 코드 기반 픽셀아트 렌더러 ═══════════════════
   배경과 달구지를 저해상도(236px) Canvas에 직접 그린 뒤 픽셀 업스케일한다.
   달구지는 PNG 없이 S.up의 개조 상태를 매 프레임 조합한다. */
const SCENE = (()=>{
  const LW = 236;                     // 논리 해상도(픽셀아트 폭)
  let mealT = 0;                      // 식사 연출 남은 시간(초)
  let talkIdx = -1, talkT = 0;        // 말하는 탑승자 표시
  let LH = 128;
  let dcv, dctx, VW=560, VH=300, DPR=1;   // 표시 캔버스
  let off, ctx, W=LW, H=LH;               // 픽셀 캔버스 (모든 드로잉)
  let worldX=0, t=0, puffs=[], rainDrops=null, flashT=0, shoot=null, birds=null;
  let crowFly=[], crowCd={};

  const hash=(n)=>{ let x=Math.sin(n*127.1+311.7)*43758.5453; return x-Math.floor(x); };
  const lerp=(a,b,f)=>a+(b-a)*f;
  const toRGB=(h)=> h[0]==='#'
    ? [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]
    : h.match(/[\d.]+/g).slice(0,3).map(Number);
  const mix=(h1,h2,f)=>{ const a=toRGB(h1),b=toRGB(h2);
    return `rgb(${Math.round(lerp(a[0],b[0],f))},${Math.round(lerp(a[1],b[1],f))},${Math.round(lerp(a[2],b[2],f))})`; };
  const P=(x)=>Math.round(x);        // 픽셀 스냅
  const townSpriteAtlas=new Image();
  townSpriteAtlas.decoding='async';
  townSpriteAtlas.src='__TOWN_WORLD_SPRITE_ATLAS__';

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
  function sceneryOf(){
    if(!S||!D.nodeScenery) return '';
    if(S.driving){ const f=S.driving.gone/S.driving.dist;
      return D.nodeScenery[f<0.5?S.driving.from:S.driving.to]||''; }
    return D.nodeScenery[S.at]||'';
  }
  /* 같은 바이옴 위에 얹는 지역의 기억. 낮은 실루엣으로만 그려 달구지와 날씨를 가리지 않는다. */
  function localScenery(kind,dark){
    if(!kind) return;
    const base=P(H*0.704);
    const loop=W+150;
    const x=P(((W*0.67-worldX*0.105)%loop+loop)%loop-38);
    const col=mix('#1a2237','#090d17',dark*0.55);
    const dim=mix('#27344c','#101520',dark*0.55);
    ctx.fillStyle=col; ctx.strokeStyle=dim; ctx.lineWidth=1;
    const roof=(rx,ry,rw,rh)=>{
      ctx.fillRect(rx+3,ry+rh,rw-6,5);
      ctx.beginPath(); ctx.moveTo(rx,ry+rh); ctx.lineTo(rx+rw/2,ry);
      ctx.lineTo(rx+rw,ry+rh); ctx.closePath(); ctx.fill();
      ctx.fillRect(rx-2,ry+rh,rw+4,1);
    };
    const crane=(cx,cy,flip=1)=>{
      line(cx,cy,cx,cy-30); line(cx,cy-29,cx+25*flip,cy-33);
      line(cx+4*flip,cy-28,cx+22*flip,cy-13);
      line(cx+21*flip,cy-32,cx+21*flip,cy-11);
      ctx.fillRect(P(cx+19*flip),P(cy-11),4,3);
    };
    if(['port','old-port','ferry','fishing-port','night-port','containers'].includes(kind)){
      crane(x,base-2,1); crane(x+66,base+1,-1);
      for(let r=0;r<2;r++) for(let k=0;k<4;k++){
        ctx.fillStyle=r?'#151d2c':col; ctx.fillRect(x+19+k*12+(r%2)*4,base-8-r*6,11,5);
      }
      ctx.fillStyle=col;
      ctx.beginPath(); ctx.moveTo(x+78,base-3); ctx.lineTo(x+111,base-3);
      ctx.lineTo(x+103,base+3); ctx.lineTo(x+83,base+3); ctx.closePath(); ctx.fill();
      if(kind==='fishing-port'||kind==='old-port'){
        line(x+88,base-3,x+88,base-18); line(x+88,base-18,x+99,base-7);
      }
      if(kind==='night-port'&&dark>0.2){
        for(const lx of [x+22,x+47,x+82,x+103]){
          ctx.fillStyle=`rgba(255,184,92,${0.35+dark*0.35})`; ctx.fillRect(lx,base-7,1,1);
        }
      }
      return;
    }
    if(['refinery','steelworks','factory'].includes(kind)){
      for(let i=0;i<4;i++){
        const sx=x+i*24, sh=20+(i%3)*9;
        ctx.fillStyle=col; ctx.fillRect(sx,base-sh,7,sh);
        ctx.fillStyle=dim; ctx.fillRect(sx-2,base-sh,11,2);
        line(sx+3,base-sh,sx+3,base-sh-8);
        if(i%2===0){ ctx.fillStyle='rgba(100,105,112,0.18)'; circ(sx+5,base-sh-12,5+i); }
      }
      ctx.strokeStyle=dim;
      line(x,base-9,x+79,base-9); line(x+10,base-18,x+57,base-18);
      if(kind==='steelworks'){ ctx.fillStyle=col; circ(x+97,base-13,15); ctx.fillRect(x+82,base-13,30,13); }
      return;
    }
    if(kind==='tumuli'){
      for(let i=0;i<4;i++){
        const tx=x+i*30, ry=9+(i%2)*4;
        ctx.fillStyle=mix('#253324','#101713',dark*0.45);
        ctx.beginPath(); ctx.ellipse(tx,base,20,ry,0,Math.PI,0); ctx.fill();
      }
      return;
    }
    if(kind==='dome'){
      ctx.fillStyle=col; ctx.beginPath(); ctx.ellipse(x+49,base,48,29,0,Math.PI,0); ctx.fill();
      ctx.strokeStyle=dim;
      for(let i=0;i<=6;i++) line(x+7+i*14,base,x+49,base-29);
      ctx.fillStyle='#0c111c'; ctx.fillRect(x+2,base-5,94,5); return;
    }
    if(['hanok','market','pavilion','gate','fortress'].includes(kind)){
      roof(x+3,base-27,33,8); roof(x+43,base-22,28,7);
      if(kind==='fortress'||kind==='gate'){
        ctx.fillStyle=col; ctx.fillRect(x-9,base-12,106,12);
        for(let i=0;i<9;i++) ctx.fillRect(x-9+i*13,base-16,7,5);
        roof(x+29,base-35,32,8);
      }
      if(kind==='pavilion'){ for(const px2 of [x+9,x+30,x+49,x+65]) ctx.fillRect(px2,base-17,2,17); }
      return;
    }
    if(['research','planned-city','broadcast'].includes(kind)){
      ctx.fillStyle=col;
      for(let i=0;i<5;i++){
        const bw=10+i%2*7,bh=18+(i*11)%31;
        ctx.fillRect(x+i*20,base-bh,bw,bh);
      }
      const ax=x+105; line(ax,base,ax,base-48); line(ax-7,base-34,ax+7,base-34);
      line(ax-5,base-24,ax+5,base-24);
      ctx.beginPath(); ctx.arc(ax,base-42,8,-1.2,1.2); ctx.stroke();
      return;
    }
    if(kind==='windfarm'){
      for(let i=0;i<3;i++){
        const wx2=x+i*48, wy=base-5-i*4; line(wx2,wy,wx2,wy-43);
        const cy=wy-43, a=t*0.35+i;
        for(let b=0;b<3;b++){ const a2=a+b*Math.PI*2/3;
          line(wx2,cy,wx2+Math.cos(a2)*14,cy+Math.sin(a2)*14); }
        ctx.fillStyle=dim; circ(wx2,cy,2);
      }
      return;
    }
    if(kind==='overpass'){
      ctx.fillStyle=col; ctx.fillRect(x-25,base-27,140,5);
      for(let i=0;i<4;i++) ctx.fillRect(x+i*38,base-23,5,23);
      ctx.strokeStyle=dim; line(x-20,base-30,x+108,base-30); return;
    }
    if(kind==='airfield'){
      ctx.fillStyle=col; ctx.fillRect(x-20,base-3,138,3);
      ctx.beginPath(); ctx.moveTo(x+35,base-8); ctx.lineTo(x+73,base-8);
      ctx.lineTo(x+91,base-3); ctx.lineTo(x+22,base-3); ctx.closePath(); ctx.fill();
      ctx.fillRect(x+56,base-20,4,12); return;
    }
    if(kind==='orchard'){
      for(let i=0;i<6;i++){ const tx=x+i*22; ctx.fillStyle=col; ctx.fillRect(tx,base-16,2,16);
        ctx.fillStyle=mix('#203527','#0c1610',dark*0.5); circ(tx,base-19,9); }
      return;
    }
    if(kind==='lantern-river'){
      ctx.strokeStyle=dim; line(x-20,base-20,x+120,base-20);
      for(let i=0;i<7;i++){ const lx=x+i*20; line(lx,base-20,lx,base-12);
        ctx.fillStyle=`rgba(238,156,77,${0.25+dark*0.35})`; ctx.fillRect(lx-2,base-12,4,4); }
      return;
    }
    if(kind==='reeds'){
      for(let i=0;i<42;i++){ const rx=x+i*4, h2=10+hash(i*4)*21;
        ctx.strokeStyle=dim; line(rx,base,rx+Math.sin(t+i)*1.2,base-h2);
        if(i%3===0){ ctx.fillStyle=col; ctx.fillRect(rx-1,base-h2-2,3,3); } }
      return;
    }
    if(kind==='bikes'){
      for(let i=0;i<4;i++){ const bx=x+i*35; ctx.strokeStyle=dim;
        ctx.beginPath(); ctx.arc(bx,base-5,5,0,7); ctx.arc(bx+13,base-5,5,0,7); ctx.stroke();
        line(bx,base-5,bx+7,base-13); line(bx+7,base-13,bx+13,base-5); line(bx,base-5,bx+13,base-5); }
      return;
    }
    if(kind==='kiln'){
      for(let i=0;i<3;i++){ const kx=x+i*38; ctx.fillStyle=col;
        ctx.beginPath(); ctx.ellipse(kx,base,17,22,0,Math.PI,0); ctx.fill();
        ctx.fillStyle='#080c13'; ctx.fillRect(kx-5,base-9,10,9);
        if(dark>0.2){ ctx.fillStyle='rgba(224,103,50,0.48)'; ctx.fillRect(kx-3,base-6,6,6); } }
      return;
    }
    if(kind==='tunnel'){
      ctx.fillStyle=col; ctx.beginPath(); ctx.ellipse(x+45,base,46,35,0,Math.PI,0); ctx.fill();
      ctx.fillStyle='#070a11'; ctx.beginPath(); ctx.ellipse(x+45,base,25,24,0,Math.PI,0); ctx.fill(); return;
    }
    if(['limestone','mountain-town'].includes(kind)){
      ctx.fillStyle=col;
      ctx.beginPath(); ctx.moveTo(x-20,base); ctx.lineTo(x+2,base-42); ctx.lineTo(x+21,base-19);
      ctx.lineTo(x+40,base-51); ctx.lineTo(x+67,base-14); ctx.lineTo(x+101,base-39); ctx.lineTo(x+126,base);
      ctx.closePath(); ctx.fill(); return;
    }
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

  /* ── 차 (달구지) ── */
  function vanBuildStage(up){
    const stages=D.vanStages||[];
    let stage=stages[0]||{lv:0,bodyL:62,bodyH:25};
    for(const x of stages){ if(!x.up||up[x.up]) stage=x; }
    return stage;
  }
  function van(roadY,speed,dark,wx,upOverride,displayScale=1){
    const up=upOverride||(S? (S.up||{}):{});
    const build=vanBuildStage(up);
    /* 캐논 비율: 짧은 한국형 캡오버 운전석 + 그보다 긴 독립 생활 박스.
       운전석과 거주구가 한 덩어리인 RV/패널 밴 실루엣으로 돌아가지 않는다. */
    const bodyL=build.bodyL, bodyH=build.bodyH, cabL=25, cabH=22;
    const cabX=P(W*0.53), vx=cabX-bodyL;
    const baseY=roadY+P((H-roadY)*0.42);
    /* 정차 화면에서는 달구지가 주인공이다. 차축과 노면 접점을 고정한 채 키워
       배경 표지판이나 지평선보다 먼저 읽히게 한다. 정착지 비교 캔버스는 1배를 쓴다. */
    ctx.save();
    if(displayScale!==1){
      ctx.translate(cabX,baseY+6);
      ctx.scale(displayScale,displayScale);
      ctx.translate(-cabX,-baseY-6);
    }
    const bnc=speed>0? Math.sin(t*11)*0.8+Math.sin(t*23.7)*0.4 : Math.sin(t*1.6)*0.3;
    const bnc2=speed>0? Math.sin(t*11+1.2)*0.8 : Math.sin(t*1.6+0.6)*0.3;
    const ride=up.susp?1.5:0;
    const vy=P(baseY+bnc-ride);
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
    /* ── 차체: 박스(투톤) ── */
    ctx.fillStyle='#8d8474';                        // 상부 베이지
    ctx.fillRect(vx,vy-bodyH,bodyL,bodyH-7);
    ctx.fillStyle='#6f6250';                        // 하부 브라운 밴드
    ctx.fillRect(vx,vy-7,bodyL,12);
    ctx.fillStyle='#4c4438';                        // 스커트
    ctx.fillRect(vx,vy+3,bodyL,2);
    /* 사람을 더 태울 때마다 뒤로 이어 붙인 실제 증축부.
       세로 이음선과 바닥 레일이 좌석 수치가 아니라 차체 공사였음을 보여준다. */
    const stages=D.vanStages||[];
    for(let si=1;si<=build.lv&&si<stages.length;si++){
      const seg=stages[si], prev=stages[si-1];
      const sx=cabX-seg.bodyL, sw=seg.bodyL-prev.bodyL;
      ctx.fillStyle=si%2?'rgba(72,61,46,0.18)':'rgba(205,184,145,0.08)';
      ctx.fillRect(sx,vy-bodyH,sw,bodyH+4);
      ctx.strokeStyle='#3f392f'; ctx.lineWidth=1;
      line(cabX-prev.bodyL,vy-bodyH,cabX-prev.bodyL,vy+3);
      ctx.fillStyle='#b59b68';
      for(let by=vy-bodyH+3;by<vy+1;by+=6) ctx.fillRect(cabX-prev.bodyL-1,by,1,1);
    }
    if(build.lv>0){ /* 천공 차대 레일과 단계별 체결 브래킷 */
      ctx.fillStyle='#343944'; ctx.fillRect(vx+2,vy+4,bodyL-10,2);
      ctx.fillStyle='#747b88';
      for(let rx=vx+5;rx<cabX-10;rx+=8) ctx.fillRect(rx,vy+4,1,1);
    }
    /* 팝업 루프 + 러기지랙 */
    ctx.fillStyle='#5d564a'; ctx.fillRect(vx+6,vy-bodyH-4,bodyL-24,4);
    ctx.strokeStyle='#3c372f'; ctx.lineWidth=1;
    line(vx+4,vy-bodyH-5, vx+bodyL-14,vy-bodyH-5);
    line(vx+4,vy-bodyH-5, vx+4,vy-bodyH);
    line(vx+bodyL-14,vy-bodyH-5, vx+bodyL-14,vy-bodyH);
    if(up.bunk){ /* 상부 수면칸: 주행 중에도 접히지 않는 경량 하드탑 */
      const ux=vx+12, uw=bodyL-29;
      ctx.fillStyle='#756d60'; ctx.fillRect(ux,vy-bodyH-3,uw,3);
      ctx.fillStyle=dark>0.35?'#d99a54':'rgba(151,181,205,0.48)';
      for(let bx=ux+5;bx<ux+uw-3;bx+=12) ctx.fillRect(bx,vy-bodyH-2,6,2);
      ctx.strokeStyle='#3c372f';
      line(ux+2,vy-bodyH-4,ux+6,vy-bodyH);
      line(ux+uw-3,vy-bodyH-4,ux+uw-7,vy-bodyH);
    }
    /* 지붕짐은 개조 단계와 무관하게 같은 차를 알아보게 하는 고정 표식이다.
       검은 예비 타이어·올리브 짐가방·빨간 연료통 두 개를 캡 가까이에 묶는다. */
    const rackRight=cabX-7;
    ctx.fillStyle='#23262e'; circ(rackRight-14,vy-bodyH-7,4);
    ctx.fillStyle='#3d414f'; circ(rackRight-14,vy-bodyH-7,2);
    ctx.fillStyle='#514d3d'; ctx.fillRect(rackRight-29,vy-bodyH-9,12,5);
    ctx.fillStyle='#6b634c'; ctx.fillRect(rackRight-28,vy-bodyH-9,10,1);
    for(let rc=0;rc<2;rc++){
      const rx=rackRight-9+rc*5;
      ctx.fillStyle='#8f3730'; ctx.fillRect(rx,vy-bodyH-10,4,6);
      ctx.fillStyle='#b4483d'; ctx.fillRect(rx,vy-bodyH-10,4,1);
      ctx.fillStyle='#512925'; ctx.fillRect(rx+1,vy-bodyH-8,2,3);
    }
    if(up.solar){ /* 태양광 패널 — 텃밭과 함께 달면 앞쪽 랙으로 이동 */
      const panelX=vx+(up.garden?32:7), panelW=Math.min(up.garden?18:23,bodyL-(panelX-vx)-9);
      ctx.fillStyle='#274e74'; ctx.fillRect(panelX,vy-bodyH-8,panelW,4);
      ctx.strokeStyle='#3f77aa'; ctx.lineWidth=1;
      for(let px2=panelX+3;px2<panelX+panelW;px2+=5) line(px2,vy-bodyH-8,px2,vy-bodyH-4);
      ctx.fillStyle=`rgba(160,210,255,${0.25+0.2*Math.sin(t*2)})`; ctx.fillRect(panelX+1,vy-bodyH-8,4,1);
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
      for(let ax=vx+5;ax<cabX-11;ax+=18) ctx.fillRect(ax,vy-5,13,7);
      ctx.fillStyle='#8b93a3';
      for(let ax=vx+6;ax<cabX-11;ax+=18){
        [[ax,vy-4],[ax+10,vy-4],[ax,vy],[ax+10,vy]].forEach(([rx,ry])=>ctx.fillRect(rx,ry,1,1));
      }
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
      ctx.fillStyle='#2f333d'; ctx.fillRect(vx+bodyL+2,vy-cabH+2,9,2);
      if(dark>0.3){ ctx.fillStyle='#ffe9a8';
        for(let lb=0;lb<4;lb++) ctx.fillRect(vx+bodyL+3+lb*2,vy-cabH+3,1,1);
        ctx.fillStyle='rgba(255,235,170,0.12)'; ctx.fillRect(vx+bodyL+2,vy-cabH+4,10,3); }
    }
    if(up.snorkel){ /* 스노클 (캡 옆 흡기 파이프) */
      ctx.fillStyle='#3a3f4a';
      ctx.fillRect(vx+bodyL+cabL-3,vy-cabH+3,2,12);
      ctx.fillRect(vx+bodyL+cabL-5,vy-cabH+2,4,2);                  // 흡기구(앞으로 꺾임)
    }
    if(up.bullbar){ /* 전면 가드 */
      ctx.strokeStyle='#5d6472'; ctx.lineWidth=1;
      line(vx+bodyL+cabL+2,vy-cabH+14, vx+bodyL+cabL+2,vy+4);
      line(vx+bodyL+cabL+1,vy-cabH+16, vx+bodyL+cabL+3,vy-cabH+16);
      line(vx+bodyL+cabL+1,vy-1, vx+bodyL+cabL+3,vy-1);
    }
    if(up.winch){ /* 전면 윈치 드럼 */
      ctx.fillStyle='#2b2f3a'; ctx.fillRect(vx+bodyL+cabL,vy+2,4,3);
      ctx.fillStyle='#8b93a3'; ctx.fillRect(vx+bodyL+cabL+1,vy+3,2,1); // 케이블 감김
      ctx.fillStyle='#c9a24a'; ctx.fillRect(vx+bodyL+cabL+4,vy+4,1,1); // 훅
    }
    if(up.mudtires){ /* 험로 타이어 펜더 플레어 */
      const rearAxle=cabX-(45+build.lv*3), frontAxle=cabX+13;
      ctx.fillStyle='#3a3f4c';
      ctx.fillRect(rearAxle-6,vy+3,13,2); ctx.fillRect(frontAxle-6,vy+3,13,2);
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
    /* ── 독립 캡오버 운전석 ── */
    ctx.fillStyle='#91897d';
    ctx.beginPath();
    ctx.moveTo(vx+bodyL+1,vy-cabH+2);
    ctx.lineTo(vx+bodyL+cabL-7,vy-cabH+2);
    ctx.lineTo(vx+bodyL+cabL-1,vy-cabH+8);
    ctx.lineTo(vx+bodyL+cabL,vy+2);
    ctx.lineTo(vx+bodyL,vy+1); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#6f6250'; ctx.fillRect(vx+bodyL,vy-6,cabL,11);
    ctx.fillStyle='#4c4438'; ctx.fillRect(vx+bodyL,vy+3,cabL,2);
    /* 검은 세로 틈이 생활 박스와 캡을 확실히 분리한다. */
    ctx.fillStyle='#37332d'; ctx.fillRect(cabX-1,vy-cabH+1,2,cabH+3);
    if(up.armor){ /* 장갑판은 차체 하단을 한 덩어리로 바꿔 원정형 실루엣을 만든다 */
      ctx.fillStyle='#59616f';
      ctx.fillRect(vx+2,vy-7,bodyL-4,10);
      ctx.fillRect(vx+bodyL,vy-6,cabL-1,9);
      ctx.fillStyle='#737c8c';
      for(let ax=vx+5;ax<vx+bodyL+cabL-3;ax+=8) ctx.fillRect(P(ax),vy-5+(Math.floor(ax/8)%2)*5,1,1);
      ctx.strokeStyle='rgba(30,34,42,0.65)';
      line(vx+bodyL-1,vy-7,vx+bodyL-1,vy+3);
    }
    /* 앞유리와 옆문 창. 앞바퀴 위까지 선 캡오버 전면이라 긴 보닛이 없다. */
    const cabGlass=dark>0.4?'rgba(132,157,180,0.38)':'rgba(169,188,201,0.62)';
    ctx.fillStyle=cabGlass;
    ctx.beginPath();
    ctx.moveTo(cabX+3,vy-cabH+5);
    ctx.lineTo(cabX+cabL-11,vy-cabH+5);
    ctx.lineTo(cabX+cabL-9,vy-cabH+13);
    ctx.lineTo(cabX+3,vy-cabH+13); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cabX+cabL-9,vy-cabH+5);
    ctx.lineTo(cabX+cabL-3,vy-cabH+9);
    ctx.lineTo(cabX+cabL-3,vy-cabH+14);
    ctx.lineTo(cabX+cabL-7,vy-cabH+13); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#4b463d'; line(cabX+2,vy-cabH+15,cabX+2,vy+1);
    line(cabX+cabL-9,vy-cabH+5,cabX+cabL-7,vy-cabH+14);
    /* 운전사는 거주구 머리 줄에 섞지 않고 앞유리 안에 따로 앉는다. */
    ctx.fillStyle='rgba(20,23,31,0.78)';
    ctx.fillRect(cabX+9,vy-cabH+10,4,4);
    ctx.fillRect(cabX+10,vy-cabH+8,3,3);
    /* 사이드미러 */
    ctx.fillStyle='#3c372f'; ctx.fillRect(vx+bodyL+cabL-1,vy-cabH+8,3,2);
    /* 전면 그릴과 고정된 흰 X: 증축해도 항상 같은 운전석에 남는다. */
    ctx.fillStyle='#49463f'; ctx.fillRect(cabX+cabL-2,vy-6,2,6);
    ctx.fillStyle='#2f302d';
    for(let gy=vy-5;gy<vy;gy+=2) ctx.fillRect(cabX+cabL-2,gy,2,1);
    ctx.strokeStyle='rgba(220,218,205,0.78)'; ctx.lineWidth=1.5;
    line(cabX+5,vy-7,cabX+11,vy); line(cabX+11,vy-7,cabX+5,vy);
    ctx.lineWidth=1;
    /* ── 옆창 (거주구) : 따뜻한 빛 + 탑승자 ── */
    const winY=vy-bodyH+5, winH=9;
    const winX=vx+7, winW=bodyL-16;
    const winPanels=Math.min(6,3+build.lv);
    const winGap=2, panelW=Math.max(4,Math.floor((winW-winGap*(winPanels-1))/winPanels));
    ctx.fillStyle= dark>0.35? '#e6a24e':'rgba(151,174,188,0.58)';
    for(let wp=0;wp<winPanels;wp++){
      const px=P(winX+wp*(panelW+winGap));
      ctx.fillRect(px,winY,panelW,winH);
      if(dark>0.35){ ctx.fillStyle='rgba(255,226,168,0.5)'; ctx.fillRect(px+1,winY+1,Math.max(1,panelW-2),1);
        ctx.fillStyle='#e6a24e'; }
    }
    const curtained = up.curtain && dark>0.35 && speed<=0;
    if(curtained){ /* 암막 커튼 — 불빛이 새지 않는다 */
      for(let wp=0;wp<winPanels;wp++){
        const px=P(winX+wp*(panelW+winGap));
        ctx.fillStyle='#453a4a'; ctx.fillRect(px,winY,panelW,winH-1);
        ctx.fillStyle='rgba(255,220,160,0.5)'; ctx.fillRect(px,winY+winH-1,panelW,1);
      }
    }
    if(up.fridge && !curtained){ /* 냉장 박스 — 창문 너머로 보임 */
      ctx.fillStyle='#dfe5ea'; ctx.fillRect(vx+17,winY+3,4,5);
      ctx.fillStyle='#9fc3d8'; ctx.fillRect(vx+18,winY+4,1,1);
    }
    if(up.kitchen && speed<=0){ /* 간이 주방 — 정차 시 조리 해치 열림 */
      ctx.fillStyle='#877d6b'; ctx.fillRect(vx+26,vy-11,10,1);      // 열린 판(선반)
      ctx.fillStyle='#3c372f'; ctx.fillRect(vx+26,vy-10,1,3); ctx.fillRect(vx+35,vy-10,1,3); // 지지
      ctx.fillStyle='#2b2f3a'; ctx.fillRect(vx+29,vy-13,3,2);       // 냄비
      const rise=((t*5)%5);
      ctx.fillStyle=`rgba(240,240,235,${0.4*(1-rise/5)})`;
      ctx.fillRect(P(vx+30+Math.sin(t*3)*0.8),P(vy-14-rise),1,1);   // 김
    }
    if(up.bench){ /* 첫 좌석 증설: 뒤쪽 창의 안전 손잡이 */
      ctx.fillStyle='#d0b36e'; ctx.fillRect(vx+10,winY+winH-2,6,1);
      ctx.fillStyle='#4c4438'; ctx.fillRect(vx+10,winY+winH-3,1,2); ctx.fillRect(vx+15,winY+winH-3,1,2);
    }
    if(up.jumpseat){ /* 마지막 보조석: 뒷문 바깥으로 드러나는 접이식 힌지 */
      ctx.fillStyle='#717988'; ctx.fillRect(vx+1,vy-12,3,1); ctx.fillRect(vx+1,vy-8,3,1);
      ctx.fillStyle='#c9a24a'; ctx.fillRect(vx+2,vy-10,1,1);
    }
    /* 동료는 창 안쪽에 어두운 실루엣으로만 보인다.
       주인공은 앞유리, 동료는 실제로 늘어난 거주구 창을 나눠 쓴다. */
    const outside=(mealT>0&&speed<=0&&S)? S.party.slice(0,2):[];   // 정차 식사 중엔 밖에 있는 동료
    const riders=S? S.party.filter(id=>!outside.includes(id)):[];
    const seatSpan=bodyL-22, seatGap=seatSpan/Math.max(1,riders.length);
    if(!curtained) riders.forEach((id,i)=>{
      const hx=P(vx+10+(i+0.5)*seatGap);
      const nod = Math.sin(t*1.2+i*2.7)>0.96?1:0;                    // 가끔 고개 까딱
      const doze = S && S.fatigue>=70 && speed>0 && i===1+(S.day%3) && i>0;  // 피로하면 누군가 존다
      const hy=P(winY+winH-2+((i%2)?bnc2-bnc:0)) + (doze? 1:nod);
      ctx.fillStyle='rgba(18,21,29,0.88)';
      ctx.fillRect(hx-2,hy-2,5,2);                                  // 어깨
      ctx.fillRect(hx-1,hy-5,3,3);                                  // 창 안의 머리
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
      riders.forEach((id,i)=>{
        const hx=P(vx+10+(i+0.5)*seatGap), hy=P(winY+winH-2+((i%2)?bnc2-bnc:0));
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
    const rearAxle=cabX-(45+build.lv*3), frontAxle=cabX+13;
    [[rearAxle,bnc],[frontAxle,bnc2]].forEach(wj=>{
      const wx0=wj[0], wy0=P(baseY+6);
      const wr=up.mudtires?6.7:5.5;
      ctx.fillStyle='#0e1016'; circ(wx0,wy0,wr);
      if(up.mudtires){
        ctx.strokeStyle='#252832'; ctx.lineWidth=1;
        for(let k=0;k<8;k++){ const a=spin+k*Math.PI/4;
          line(wx0+Math.cos(a)*(wr-1),wy0+Math.sin(a)*(wr-1),wx0+Math.cos(a)*(wr+0.4),wy0+Math.sin(a)*(wr+0.4)); }
      }
      ctx.fillStyle='#2b2f3a'; circ(wx0,wy0,3.2);
      ctx.fillStyle='#464c5c'; circ(wx0,wy0,1.4);
      ctx.strokeStyle='#14161f'; ctx.lineWidth=1;
      for(let s2=0;s2<2;s2++){ const a=spin+s2*Math.PI/2;
        line(wx0-Math.cos(a)*3,wy0-Math.sin(a)*3,wx0+Math.cos(a)*3,wy0+Math.sin(a)*3); }
    });
    /* 흙받이 */
    ctx.fillStyle='#33302a';
    ctx.fillRect(rearAxle-6,P(baseY+3),3,4); ctx.fillRect(frontAxle+6,P(baseY+3),3,4);
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
    ctx.restore();
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
      const build=vanBuildStage(S.up||{}), cabX=P(W*0.53), bodyX=cabX-build.bodyL;
      const bx=P(bodyX-10), by=P(roadY+(H-roadY)*0.42-build.bodyH-18);
      const bw=build.bodyL+43, bh=build.bodyH+35;
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

  /* ── 운전석 시점 ───────────────────────────────────────────
     기존 지역·시간·날씨를 그대로 쓰되 주행 중에는 측면 도로 대신 앞유리
     너머의 소실점 도로를 그린다. 실제 조향 게임이 아니라 여행의 시점을
     운전자에게 돌려주는 2D 다이제틱 허브다. */
  function forwardRoad(dark,wx){
    const horizon=P(H*0.57), cx=P(W*0.52);
    ctx.fillStyle=mix('#313126','#17171b',dark*0.56);
    ctx.fillRect(0,horizon,W,H-horizon);
    ctx.beginPath();
    ctx.moveTo(cx-P(W*0.055),horizon); ctx.lineTo(cx+P(W*0.055),horizon);
    ctx.lineTo(W+P(W*0.06),H); ctx.lineTo(-P(W*0.06),H); ctx.closePath();
    ctx.fillStyle=wx==='rain'?mix('#30343c','#11141c',dark*0.55):mix('#34343a','#171820',dark*0.48);
    ctx.fill();
    ctx.strokeStyle=mix('#77756d','#34343c',dark*0.55); ctx.lineWidth=1;
    line(cx-P(W*0.055),horizon,-P(W*0.06),H);
    line(cx+P(W*0.055),horizon,W+P(W*0.06),H);
    const phase=(worldX*0.012)%1;
    for(let i=0;i<8;i++){
      const q=(i+phase)/8, q2=q*q;
      const y=horizon+(H-horizon)*q2;
      const len=1+q2*10;
      ctx.strokeStyle=`rgba(220,211,180,${0.2+q*0.58})`; ctx.lineWidth=Math.max(1,P(q*2));
      line(cx,y,cx,y+len);
    }
    if(wx==='rain'){
      ctx.fillStyle='rgba(135,160,180,.08)'; ctx.fillRect(0,horizon,W,H-horizon);
    }
    return horizon;
  }

  function drawApproachLandmark(dark){
    if(!S||!S.driving||!D.nodes[S.driving.to]) return;
    const f=S.driving.gone/S.driving.dist;
    if(f<0.48) return;
    const name=String(D.nodes[S.driving.to].name||'');
    const q=Math.min(1,(f-0.48)/0.52), s=0.55+q*0.8;
    const base=P(H*(0.63+q*0.025)), x=P(W*(0.69-q*0.08));
    const col=mix('#26314b','#0a0d17',dark*0.56);
    ctx.fillStyle=col; ctx.strokeStyle=col; ctx.lineWidth=Math.max(1,P(s));
    const tower=(tx,top,h,w)=>{ ctx.fillRect(P(tx-w/2),P(top+h*0.45),Math.max(1,P(w)),P(h*0.55));
      ctx.beginPath(); ctx.moveTo(P(tx),P(top)); ctx.lineTo(P(tx-w*0.38),P(top+h*0.45)); ctx.lineTo(P(tx+w*0.38),P(top+h*0.45)); ctx.closePath(); ctx.fill(); };
    if(name.includes('서울')){
      tower(x,base-P(42*s),P(42*s),P(5*s));
      ctx.fillRect(x-P(3*s),base-P(47*s),P(6*s),P(3*s));
      ctx.fillRect(x-P(34*s),base-P(29*s),P(13*s),P(29*s));
      ctx.fillStyle=dark>0.35?'rgba(255,190,105,.65)':'rgba(175,190,190,.5)';
      for(let i=0;i<4;i++) ctx.fillRect(x-P(31*s),base-P((6+i*6)*s),1,1);
    } else if(name.includes('부산')){
      ctx.beginPath(); ctx.moveTo(x-P(52*s),base); ctx.lineTo(x-P(44*s),base-P(30*s)); ctx.lineTo(x-P(36*s),base); ctx.moveTo(x+P(34*s),base); ctx.lineTo(x+P(42*s),base-P(30*s)); ctx.lineTo(x+P(50*s),base); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x-P(44*s),base-P(23*s)); ctx.quadraticCurveTo(x,base-P(5*s),x+P(42*s),base-P(23*s)); ctx.stroke();
    } else if(name.includes('대구')){
      tower(x,base-P(38*s),P(38*s),P(6*s)); ctx.fillRect(x-P(8*s),base-P(40*s),P(16*s),P(5*s));
    } else if(name.includes('대전')){
      tower(x,base-P(35*s),P(35*s),P(5*s)); ctx.beginPath(); ctx.arc(x,base-P(35*s),P(7*s),0,7); ctx.fill();
    } else if(name.includes('경주')){
      ctx.beginPath(); ctx.moveTo(x-P(14*s),base); ctx.quadraticCurveTo(x-P(10*s),base-P(27*s),x,base-P(34*s)); ctx.quadraticCurveTo(x+P(10*s),base-P(27*s),x+P(14*s),base); ctx.fill();
      ctx.fillStyle=mix('#141b2b','#080b13',dark*0.5); for(let i=0;i<4;i++) ctx.fillRect(x-1,base-P((7+i*6)*s),2,2);
    } else if(name.includes('수원')){
      ctx.fillRect(x-P(25*s),base-P(16*s),P(50*s),P(16*s));
      ctx.beginPath(); ctx.moveTo(x-P(30*s),base-P(16*s)); ctx.lineTo(x,base-P(28*s)); ctx.lineTo(x+P(30*s),base-P(16*s)); ctx.closePath(); ctx.fill();
    } else if(name.includes('광주')){
      ctx.beginPath(); ctx.moveTo(x-P(48*s),base); ctx.lineTo(x-P(18*s),base-P(26*s)); ctx.lineTo(x,base-P(15*s)); ctx.lineTo(x+P(18*s),base-P(30*s)); ctx.lineTo(x+P(48*s),base); ctx.fill();
    } else if(name.includes('여수')||name.includes('포항')){
      ctx.fillStyle=mix('#243549','#0a111b',dark*0.5); ctx.fillRect(x-P(58*s),base-P(5*s),P(116*s),P(5*s));
      ctx.strokeStyle=col; ctx.beginPath(); ctx.moveTo(x-P(38*s),base); ctx.quadraticCurveTo(x,base-P(28*s),x+P(38*s),base); ctx.stroke();
    } else if(name.includes('강릉')||name.includes('속초')){
      ctx.beginPath(); ctx.moveTo(x-P(56*s),base); ctx.lineTo(x-P(20*s),base-P(30*s)); ctx.lineTo(x,base-P(17*s)); ctx.lineTo(x+P(20*s),base-P(36*s)); ctx.lineTo(x+P(56*s),base); ctx.fill();
      ctx.fillStyle=mix('#263d45','#0a1419',dark*0.5); ctx.fillRect(0,base,W,H-base);
    } else if(name.includes('춘천')){
      ctx.fillStyle=mix('#253b4e','#0b121c',dark*0.5); ctx.fillRect(0,base-P(6*s),W,P(6*s));
      ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x-P(50*s),base); ctx.lineTo(x-P(15*s),base-P(25*s)); ctx.lineTo(x+P(5*s),base-P(12*s)); ctx.lineTo(x+P(42*s),base-P(30*s)); ctx.lineTo(x+P(60*s),base); ctx.fill();
    }
  }

  function drawCockpit(dark,wx,speed){
    const dashY=P(H*0.735), warm=dark>0.35?'#d79b4d':'#b68243';
    /* 천장과 A필러 */
    ctx.fillStyle=mix('#25231f','#0c0d11',dark*0.52);
    ctx.fillRect(0,0,W,P(H*0.055));
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(P(W*0.09),0); ctx.lineTo(P(W*0.17),dashY); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(W-P(W*0.09),0); ctx.lineTo(W,0); ctx.lineTo(W,H); ctx.lineTo(W-P(W*0.17),dashY); ctx.closePath(); ctx.fill();
    /* 백미러 */
    ctx.fillStyle='#090a0d'; ctx.fillRect(P(W*0.39),P(H*0.055),P(W*0.23),P(H*0.065));
    ctx.fillStyle=mix('#293448','#10141d',dark*0.5); ctx.fillRect(P(W*0.405),P(H*0.068),P(W*0.20),P(H*0.038));
    ctx.fillStyle='rgba(255,180,84,.55)'; ctx.fillRect(P(W*0.49),P(H*0.108),P(W*0.02),1);
    /* 대시보드 */
    const dg=ctx.createLinearGradient(0,dashY,0,H);
    dg.addColorStop(0,mix('#403b31','#17181b',dark*0.55)); dg.addColorStop(1,'#090a0d');
    ctx.fillStyle=dg; ctx.beginPath(); ctx.moveTo(P(W*0.09),dashY); ctx.lineTo(P(W*0.91),dashY); ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#111319'; ctx.fillRect(P(W*0.32),dashY+5,P(W*0.36),P(H*0.13));
    /* 계기판 */
    const fuel=S?Math.max(0,Math.min(1,S.fuel/S.fuelMax)):0.5;
    const vanHealth=S?Math.max(0,Math.min(1,S.van/S.vanMax)):0.8;
    ctx.strokeStyle='#555a62'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(P(W*0.42),dashY+P(H*0.07),P(H*0.045),Math.PI,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(P(W*0.58),dashY+P(H*0.07),P(H*0.045),Math.PI,Math.PI*2); ctx.stroke();
    ctx.strokeStyle=fuel<0.2?'#e2574f':warm; ctx.lineWidth=2;
    const fa=Math.PI+Math.PI*fuel; line(P(W*0.42),dashY+P(H*0.07),P(W*0.42)+Math.cos(fa)*P(H*0.035),dashY+P(H*0.07)+Math.sin(fa)*P(H*0.035));
    ctx.strokeStyle=vanHealth<0.3?'#e2574f':'#7dc98f';
    const va=Math.PI+Math.PI*vanHealth; line(P(W*0.58),dashY+P(H*0.07),P(W*0.58)+Math.cos(va)*P(H*0.035),dashY+P(H*0.07)+Math.sin(va)*P(H*0.035));
    ctx.fillStyle='#c5d2c8'; ctx.font=`${Math.max(5,P(H*0.018))}px monospace`; ctx.textAlign='center';
    ctx.fillText('FUEL',P(W*0.42),dashY+P(H*0.102)); ctx.fillText('VAN',P(W*0.58),dashY+P(H*0.102));
    /* 라디오와 접힌 지도 */
    ctx.fillStyle='#17191d'; ctx.fillRect(P(W*0.70),dashY+P(H*0.035),P(W*0.18),P(H*0.10));
    ctx.fillStyle=warm; ctx.fillRect(P(W*0.73),dashY+P(H*0.055),P(W*0.11),2);
    ctx.fillStyle=mix('#c5b88f','#68604b',dark*0.3); ctx.fillRect(P(W*0.11),dashY+P(H*0.025),P(W*0.15),P(H*0.12));
    ctx.strokeStyle='rgba(52,68,77,.55)'; ctx.lineWidth=1; line(P(W*0.16),dashY+P(H*0.03),P(W*0.18),dashY+P(H*0.14));
    /* 핸들 */
    ctx.strokeStyle='#090a0c'; ctx.lineWidth=P(H*0.022);
    ctx.beginPath(); ctx.arc(P(W*0.31),H+P(H*0.005),P(H*0.16),Math.PI*1.08,Math.PI*1.92); ctx.stroke();
    ctx.lineWidth=P(H*0.012); line(P(W*0.31),H-P(H*0.075),P(W*0.31),H-P(H*0.005));
    /* 비 오는 날 와이퍼 */
    if(wx==='rain'&&speed>0){
      const sweep=(Math.sin(t*5)+1)*0.5;
      ctx.strokeStyle='rgba(12,13,16,.9)'; ctx.lineWidth=2;
      line(P(W*0.48),dashY,P(W*(0.22+0.38*sweep)),P(H*(0.68-0.42*sweep)));
    }
    ctx.textAlign='left';
  }

  /* ── 메인 draw ── */
  function draw(dt){
    if(!ctx) return; t+=dt;
    mealT=Math.max(0,mealT-dt);
    talkT=Math.max(0,talkT-dt);
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
    localScenery(sceneryOf(),dark);
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
    van(roadY,speed,dark,wx,undefined,speed>0?1:1.26);
    drawPuffs(dt);
    drawCrows(dt); weather(wx,dark,speed,dt);
    cheollianFx(roadY);
    /* 비네트 */
    const vg=ctx.createRadialGradient(W/2,H*0.45,H*0.3,W/2,H*0.5,H*0.95);
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.42)');
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);

    /* ── 블릿 (픽셀 업스케일) ── */
    dctx.clearRect(0,0,VW,VH);
    dctx.imageSmoothingEnabled=false;
    dctx.drawImage(off,0,0,W,H,0,0,VW,VH);
  }

  /* ── 정착지 내부: 코드 기반 일러스트 월드 ────────────────────────
     도착 시네마틱의 JPG를 확대해 쓰지 않는다. 논리 좌표는 터치 판정과
     작은 화면 구도를 위해 유지하되 3배 버퍼에 다시 그려 건축·사람·조명은
     픽셀 블록이 아니라 부드러운 코드 일러스트로 보이게 한다. */
  const TOWN_W=236,TOWN_H=306,TOWN_RENDER_SCALE=1;
  let town=null,townT=0;
  const tclamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function townPoint(pos){
    return {x:P(12+(pos.x||50)/100*(TOWN_W-24)),y:P(64+(pos.y||50)/100*(TOWN_H-70))};
  }
  function townColor(id,i=0){
    const coats=['#4e5e57','#665348','#4d5668','#6d583d','#3f625f','#6a4b4c','#555247'];
    return coats[Math.floor(hash((id||'person').split('').reduce((n,ch)=>n+ch.charCodeAt(0),0)+i)*coats.length)%coats.length];
  }
  function initSettlement(canvas,options){
    if(!canvas) return;
    const world=D.settlementWorlds&&D.settlementWorlds[options.id]||{
      kind:'market',sign:'정착지',crowd:8,palette:{ground:'#32302a',path:'#5a5548',wall:'#1d201d',roof:'#44463d',light:'#e8b66a',accent:'#9a6350'}};
    const buffer=document.createElement('canvas');
    buffer.width=TOWN_W*TOWN_RENDER_SCALE; buffer.height=TOWN_H*TOWN_RENDER_SCALE;
    const bctx=buffer.getContext('2d');
    bctx.setTransform(TOWN_RENDER_SCALE,0,0,TOWN_RENDER_SCALE,0,0);
    bctx.imageSmoothingEnabled=false;
    const layout=options.layout||{},spots=options.spots||{},entry=townPoint(layout.entry||{x:50,y:90});
    const facilities=Object.entries(spots).map(([id,spot])=>({type:'facility',id,label:spot.label,sub:spot.sub,p:townPoint(spot)}));
    const fallback=[[20,58],[80,57],[51,65]];
    const residents=(options.npcs||[]).map((npc,index)=>{
      const host=Object.values(spots).find(spot=>spot.npc===npc.id);
      const base=townPoint(host||{x:fallback[index%fallback.length][0],y:fallback[index%fallback.length][1]});
      return {type:'npc',id:npc.id,label:npc.name,role:npc.role,p:{x:tclamp(base.x+(index%2?10:-10),14,TOWN_W-14),y:tclamp(base.y+9,82,TOWN_H-22)}};
    });
    const recruit=options.recruit?{type:'recruit',id:options.recruit.id,label:options.recruit.name,
      role:options.recruit.label||'처음 보는 사람',p:townPoint(layout.recruit||{x:50,y:54})}:null;
    const crowd=Array.from({length:Math.max(7,Math.round((world.crowd||8)*.82))},(_,i)=>({
      x:18+hash(i*5.7+options.id.length)*200,y:108+hash(i*8.1+11)*154,
      lane:5+hash(i*9.3)*14,phase:hash(i*12.7)*Math.PI*2,speed:.32+hash(i*3.1)*.62,color:townColor(options.id,i)
    }));
    town={canvas,out:canvas.getContext('2d'),buffer,c:bctx,id:options.id,world,layout,spots,options,
      facilities,residents,recruit,crowd,player:{...entry},target:{...entry},focus:options.focus||'market',
      moving:false,pending:null,selected:{type:'facility',id:options.focus||'market'},lastSize:''};
    canvas.style.imageRendering='pixelated';
    canvas.onpointerup=event=>townPointer(event);
    canvas.onkeydown=event=>townKey(event);
    walkSettlement(options.focus||'market',false);
    drawSettlement(.016);
  }
  function closeSettlement(){ town=null; }
  function walkSettlement(id,notify=true){
    if(!town) return false;
    const facility=town.facilities.find(item=>item.id===id); if(!facility) return false;
    town.focus=id; town.target={x:facility.p.x,y:tclamp(facility.p.y+18,74,TOWN_H-14)};
    town.moving=true; town.pending=null; town.selected={type:'facility',id};
    if(notify&&town.options.onWalk) town.options.onWalk(id);
    return true;
  }
  function townCompanionEntities(){
    if(!town) return [];
    return (town.options.party||[]).map((comp,index)=>({type:'companion',id:comp.id,label:comp.name,role:comp.role,
      p:{x:tclamp(town.player.x-7-(index%3)*6,10,TOWN_W-10),y:tclamp(town.player.y+8+Math.floor(index/3)*7,72,TOWN_H-10)}}));
  }
  function townEntities(){ return town?[...town.residents,...(town.recruit?[town.recruit]:[]),...townCompanionEntities()]:[]; }
  function townPointer(event){
    if(!town||event.currentTarget!==town.canvas) return;
    const rect=town.canvas.getBoundingClientRect();
    const p={x:(event.clientX-rect.left)/rect.width*TOWN_W,y:(event.clientY-rect.top)/rect.height*TOWN_H};
    let picked=null,best=19;
    for(const entity of townEntities()){
      const d=Math.hypot(p.x-entity.p.x,p.y-entity.p.y); if(d<best){best=d;picked=entity;}
    }
    if(picked){
      town.target={x:picked.p.x,y:tclamp(picked.p.y+8,72,TOWN_H-12)};town.moving=true;
      town.selected={type:picked.type,id:picked.id};town.pending=picked;
      if(town.options.onSelectPerson) town.options.onSelectPerson(picked);
      return;
    }
    let facility=null;best=31;
    for(const item of town.facilities){const d=Math.hypot(p.x-item.p.x,p.y-item.p.y);if(d<best){best=d;facility=item;}}
    if(facility){
      if(town.options.onFocus) town.options.onFocus(facility.id); else walkSettlement(facility.id);
      return;
    }
    town.target={x:tclamp(p.x,9,TOWN_W-9),y:tclamp(p.y,72,TOWN_H-9)};
    town.moving=true;town.pending=null;town.selected={type:'ground',id:''};
    if(town.options.onGround) town.options.onGround();
  }
  function townKey(event){
    if(!town) return;
    const delta={ArrowLeft:[-13,0],ArrowRight:[13,0],ArrowUp:[0,-13],ArrowDown:[0,13]}[event.key];
    if(delta){event.preventDefault();town.target={x:tclamp(town.player.x+delta[0],9,TOWN_W-9),y:tclamp(town.player.y+delta[1],72,TOWN_H-9)};town.moving=true;town.pending=null;return;}
    if(event.key==='Enter'||event.key===' '){event.preventDefault();const entity=townEntities().sort((a,b)=>
      Math.hypot(town.player.x-a.p.x,town.player.y-a.p.y)-Math.hypot(town.player.x-b.p.x,town.player.y-b.p.y))[0];
      if(entity&&Math.hypot(town.player.x-entity.p.x,town.player.y-entity.p.y)<24){town.pending=entity;town.target={...entity.p};town.moving=true;}}
  }
  function townLine(c,x1,y1,x2,y2,col,w=1){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(P(x1),P(y1));c.lineTo(P(x2),P(y2));c.stroke();}
  function townEllipse(c,x,y,rx,ry,col,stroke){c.beginPath();c.ellipse(P(x),P(y),rx,ry,0,0,7);if(col){c.fillStyle=col;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
  function townRound(c,x,y,w,h,r,fill,stroke,lw=1){
    const rr=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+rr,y);c.arcTo(x+w,y,x+w,y+h,rr);c.arcTo(x+w,y+h,x,y+h,rr);
    c.arcTo(x,y+h,x,y,rr);c.arcTo(x,y,x+w,y,rr);c.closePath();
    if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}
  }
  function townPoly(c,points,fill,stroke,lw=1){
    c.beginPath();points.forEach((point,index)=>(index?c.lineTo(point[0],point[1]):c.moveTo(point[0],point[1])));c.closePath();
    if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}
  }
  function townGlow(c,x,y,r,color,alpha=.3){
    const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color.replace('ALPHA',String(alpha)));g.addColorStop(.32,color.replace('ALPHA',String(alpha*.48)));g.addColorStop(1,color.replace('ALPHA','0'));
    c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
  }
  function townBackdrop(c,world){
    const p=world.palette,kind=world.kind;
    const ground=c.createLinearGradient(0,54,0,TOWN_H);ground.addColorStop(0,mix(p.ground,'#11151a',.28));ground.addColorStop(.48,p.ground);ground.addColorStop(1,mix(p.ground,'#090b0d',.42));
    c.fillStyle=ground;c.fillRect(0,0,TOWN_W,TOWN_H);
    c.fillStyle='rgba(255,255,255,.035)';
    for(let i=0;i<180;i++){const x=hash(i*7.31+world.sign.length)*TOWN_W,y=58+hash(i*11.17+3)*(TOWN_H-58),s=.25+hash(i*5.1)*.65;c.globalAlpha=.25+hash(i*2.9)*.55;c.fillRect(x,y,s,s);}
    c.globalAlpha=1;
    if(kind==='dome'){
      c.fillStyle='#090c0f';c.fillRect(0,54,TOWN_W,24);
      const bowl=c.createRadialGradient(118,166,30,118,166,118);bowl.addColorStop(0,'#343838');bowl.addColorStop(.58,'#242829');bowl.addColorStop(.82,'#171b1d');bowl.addColorStop(1,'#090c0e');
      townEllipse(c,118,171,114,106,bowl,'rgba(168,173,168,.55)');
      townEllipse(c,118,171,101,93,'#242829','rgba(116,125,123,.7)');townEllipse(c,118,171,75,67,p.ground,'rgba(159,161,151,.62)');
      for(let r=0;r<5;r++){
        c.strokeStyle=`rgba(179,184,176,${.26-r*.025})`;c.lineWidth=2.2;c.beginPath();c.ellipse(118,168,101-r*7,91-r*6.4,0,Math.PI*.04,Math.PI*.96);c.stroke();
      }
      c.strokeStyle='rgba(222,218,198,.24)';c.lineWidth=1;
      for(let a=.12;a<Math.PI;a+=.23){const x1=118+Math.cos(a)*76,y1=168-Math.sin(a)*68,x2=118+Math.cos(a)*104,y2=168-Math.sin(a)*94;townLine(c,x1,y1,x2,y2,'rgba(222,218,198,.19)',1);}
      for(let i=0;i<74;i++){
        const a=.08+hash(i*2.3)*Math.PI*.84,r=80+hash(i*7.2)*18,x=118+Math.cos(a)*r,y=168-Math.sin(a)*(r*.88);
        c.fillStyle=i%9===0?p.accent:i%5===0?'#72837d':'rgba(203,195,170,.58)';c.fillRect(x,y,1.05,.8);
      }
      c.save();c.shadowBlur=10;c.shadowColor='rgba(229,165,76,.34)';townRound(c,78,91,80,27,2,'#070a0c','#5f615b',1);c.restore();
      c.fillStyle='#111719';c.fillRect(82,95,72,15);c.fillStyle=p.light;
      for(let i=0;i<9;i++){const h=2+Math.abs(Math.sin(townT*1.5+i))*4;c.fillRect(86+i*7.3,106-h,4.2,h);}
      c.fillStyle='#8f382f';c.fillRect(101,112,34,3);c.fillStyle='#d3c7a8';c.font='700 4.5px sans-serif';c.textAlign='center';c.fillText('DAEGU DOME',118,100);c.textAlign='left';
      for(const sx of [19,217]){c.fillStyle='#5e625f';c.fillRect(sx-1,61,2,34);c.fillStyle='#e8d9af';c.fillRect(sx-5,62,10,2);townGlow(c,sx,65,18,'rgba(234,211,159,ALPHA)',.18);}
    }else if(kind==='tunnel'){
      const tunnel=c.createLinearGradient(0,54,0,TOWN_H);tunnel.addColorStop(0,'#050708');tunnel.addColorStop(.58,'#171918');tunnel.addColorStop(1,'#26231d');c.fillStyle=tunnel;c.fillRect(0,52,TOWN_W,TOWN_H-52);
      for(let r=0;r<6;r++){c.strokeStyle=`rgba(139,137,125,${.33-r*.035})`;c.lineWidth=5.5;c.beginPath();c.ellipse(118,171,117-r*17,130-r*14.7,0,Math.PI,Math.PI*2);c.stroke();}
      c.fillStyle=mix(p.path,'#0b0d0e',.32);c.fillRect(34,80,168,226);
      for(let y=86;y<292;y+=18){for(const x of [42,194]){const flicker=.45+.25*Math.sin(townT*5+y+x);townGlow(c,x,y,13,'rgba(232,184,104,ALPHA)',flicker*.22);c.fillStyle=`rgba(245,201,126,${.68+flicker*.2})`;c.fillRect(x-1,y-1,2,4);}}
      c.strokeStyle='rgba(188,185,169,.24)';c.setLineDash([7,8]);townLine(c,118,88,118,TOWN_H,'rgba(188,185,169,.24)',1);c.setLineDash([]);
      c.fillStyle='#121516';for(let y=108;y<278;y+=42){c.fillRect(31,y,8,18);c.fillRect(197,y+18,8,18);}
    }else if(kind==='research'){
      c.fillStyle='#0b1115';c.fillRect(6,58,224,238);
      for(let x=12;x<232;x+=14)townLine(c,x,62,x,296,'rgba(55,78,88,.42)',.6);
      for(let y=66;y<296;y+=14)townLine(c,6,y,230,y,'rgba(55,78,88,.42)',.6);
      const lab=c.createLinearGradient(0,68,0,103);lab.addColorStop(0,'#203038');lab.addColorStop(1,'#121b20');townRound(c,12,67,212,34,3,lab,'#405660');
      c.fillStyle='#0e1519';for(let i=0;i<7;i++)townRound(c,20+i*29,75,20,14,1,'#17272d','#2f444c');
      c.fillStyle=p.light;for(let i=0;i<7;i++){c.globalAlpha=.35+.5*Math.abs(Math.sin(townT*1.1+i));c.fillRect(23+i*29,79,8+(i%3)*3,1.3);}c.globalAlpha=1;
      c.fillStyle='#1d2a30';for(let i=0;i<5;i++){townRound(c,18+i*42,107,30,6,2,'#1d2a30','#344951');c.fillStyle='rgba(120,211,200,.4)';c.fillRect(23+i*42,109,8,1);}
      c.strokeStyle='rgba(112,200,191,.38)';c.lineWidth=1.2;c.beginPath();c.moveTo(24,60);c.quadraticCurveTo(118,35,212,60);c.stroke();c.fillStyle='#88d3ca';townEllipse(c,118,49,2.2,2.2,'#88d3ca');
    }else if(kind==='fortress'){
      const stone=c.createLinearGradient(0,56,0,TOWN_H);stone.addColorStop(0,'#33342e');stone.addColorStop(1,'#191b18');c.fillStyle=stone;c.fillRect(0,56,TOWN_W,30);c.fillRect(0,56,24,TOWN_H);c.fillRect(TOWN_W-24,56,24,TOWN_H);
      c.fillStyle='#666255';for(let x=2;x<TOWN_W;x+=14)c.fillRect(x,60,9,8);
      for(let y=72;y<TOWN_H;y+=13){c.fillStyle=y%26?'#504e45':'#696457';c.fillRect(3,y,15,7);c.fillRect(TOWN_W-18,y,15,7);townLine(c,3,y+8,18,y+8,'rgba(8,10,9,.4)',.6);townLine(c,TOWN_W-18,y+8,TOWN_W-3,y+8,'rgba(8,10,9,.4)',.6);}
      townPoly(c,[[91,TOWN_H],[103,101],[133,101],[146,TOWN_H]],p.path,'rgba(171,160,133,.35)');
      townRound(c,91,70,54,36,2,'#171b18','#5f5b4e');townPoly(c,[[83,76],[118,54],[153,76]],p.roof,'#6a6253');
      c.fillStyle='#0b0e0d';townRound(c,105,83,26,21,12,'#0b0e0d','#6d6553');c.fillStyle=p.light;c.fillRect(116,79,4,4);townGlow(c,118,82,14,'rgba(229,181,104,ALPHA)',.18);
      c.fillStyle='#837a65';for(let x=31;x<205;x+=19)c.fillRect(x,62,11,4);
    }else{
      const hanok=kind==='hanok-market';
      const sky=c.createLinearGradient(0,52,0,101);sky.addColorStop(0,'#0a0d0e');sky.addColorStop(1,hanok?'#24231d':'#171b1a');c.fillStyle=sky;c.fillRect(0,52,TOWN_W,50);
      for(let i=0;i<5;i++){
        const x=5+i*48,h=20+(i%2)*5;townRound(c,x,74-h/5,41,h,1,i%2?p.wall:mix(p.wall,p.roof,.35),'#0b0d0d');
        if(hanok){townPoly(c,[[x-4,77-h/5],[x+20,68-h/5],[x+45,77-h/5]],'#171a18','#5f5141');c.fillStyle='#6e5842';for(let k=0;k<6;k++)c.fillRect(x+k*7,76-h/5,5,1.2);}
        else{c.fillStyle=i%2?p.roof:p.accent;c.fillRect(x-3,71-h/5,47,6);c.fillStyle='rgba(225,207,168,.18)';c.fillRect(x,71-h/5,41,1);}
        for(const wx of [x+8,x+27]){const a=.34+.22*Math.sin(townT*2.4+i+wx);townGlow(c,wx,84,13,'rgba(241,173,85,ALPHA)',a*.2);c.fillStyle=`rgba(241,173,85,${a})`;c.fillRect(wx,79,5,7);}
      }
      if(kind==='night-market'){
        townLine(c,7,102,TOWN_W-7,115,'rgba(194,120,77,.75)',.8);
        for(let x=12;x<TOWN_W;x+=16){const y=102+(x-7)/(TOWN_W-14)*13;townGlow(c,x,y,9,'rgba(241,173,85,ALPHA)',.12);townEllipse(c,x,y,1.4,1.8,p.light);}
      }
      if(kind==='five-day-market'){for(let x=13;x<TOWN_W;x+=29)townPoly(c,[[x,101],[x+11,101],[x+8,108],[x+3,108]],x%2?p.accent:p.roof);}
    }
  }
  function townDistrict(c){
    const kind=town.world.kind,p=town.world.palette;
    const marketLike=kind==='night-market'||kind==='five-day-market'||kind==='hanok-market';
    const blocks=kind==='dome'
      ?[[14,132,27,17],[195,132,27,17],[12,207,28,19],[196,207,28,19],[42,264,31,17],[163,264,31,17]]
      :kind==='tunnel'
        ?[[42,112,30,18],[164,112,30,18],[39,163,24,22],[173,164,24,22],[43,247,31,19],[162,247,31,19]]
        :kind==='research'
          ?[[12,119,34,21],[190,119,34,21],[12,170,29,27],[195,170,29,27],[42,262,35,20],[159,262,35,20]]
          :kind==='fortress'
            ?[[28,119,36,21],[173,119,35,21],[29,174,27,24],[181,174,27,24],[45,257,35,20],[156,257,35,20]]
            :[[10,119,36,22],[190,119,36,22],[9,169,28,27],[199,169,28,27],[43,258,37,20],[156,258,37,20]];
    c.lineCap='round';
    for(const y of [126,184,246]){townLine(c,5,y,TOWN_W-5,y,'rgba(217,201,163,.055)',3);townLine(c,5,y,TOWN_W-5,y,'rgba(12,14,14,.3)',.7);}
    for(const x of [45,191])townLine(c,x,105,x,287,'rgba(217,201,163,.045)',2.4);
    blocks.forEach(([x,y,w,h],index)=>{
      townEllipse(c,x+w/2+1,y+h+3,w*.54,4,'rgba(0,0,0,.35)');
      if(kind==='dome'){
        townRound(c,x,y,w,h,2,'#171b1c','#505452',.8);townPoly(c,[[x-2,y],[x+w+2,y],[x+w-2,y+5],[x+2,y+5]],index%2?p.accent:'#5a5e59','rgba(208,202,184,.22)');
        c.fillStyle='#090c0d';townRound(c,x+4,y+7,w-8,h-8,1,'#090c0d');c.fillStyle=p.light;for(let k=0;k<3;k++)c.fillRect(x+6+k*6,y+10,3,1.2);
      }else if(kind==='tunnel'){
        townRound(c,x,y,w,h,3,'#171918','#5b574c',.8);c.fillStyle='#0a0c0d';c.beginPath();c.arc(x+w/2,y+h,w*.32,Math.PI,0);c.fill();
        c.fillStyle='#75634a';for(let k=0;k<3;k++)townRound(c,x+4+k*7,y+5,5,7,1,k%2?'#584c3c':'#796447','#24211c');
        c.fillStyle=p.light;c.fillRect(x+w-5,y+4,1.5,3.5);
      }else if(kind==='research'){
        const g=c.createLinearGradient(x,y,x,y+h);g.addColorStop(0,'#25343a');g.addColorStop(1,'#11191d');townRound(c,x,y,w,h,2,g,'#466069',.8);
        for(let k=0;k<3;k++){townRound(c,x+4+k*(w-8)/3,y+5,(w-13)/3,h-10,1,'#102126','#315159');c.fillStyle=p.light;c.globalAlpha=.22+.28*Math.abs(Math.sin(townT*2+k+index));c.fillRect(x+6+k*(w-8)/3,y+8,4,1);c.globalAlpha=1;}
      }else if(kind==='fortress'){
        townRound(c,x,y,w,h,1,'#292923','#0f1110');townPoly(c,[[x-3,y+2],[x+w/2,y-7],[x+w+3,y+2]],index%2?p.roof:'#514a3d','#756955');
        c.fillStyle='#b08a55';c.fillRect(x+5,y+7,5,7);c.fillRect(x+w-10,y+7,5,7);c.fillStyle='#161817';c.fillRect(x+w/2-3,y+9,6,h-9);
      }else if(marketLike){
        townRound(c,x,y,w,h,1,mix(p.wall,'#5d503b',index%2?.18:.08),'#121312');
        if(kind==='hanok-market')townPoly(c,[[x-3,y+1],[x+w/2,y-7],[x+w+3,y+1]],'#25231e','#625544');
        else townPoly(c,[[x-2,y],[x+w+2,y],[x+w-2,y+6],[x+2,y+6]],index%3===0?p.accent:p.roof,'rgba(224,205,168,.22)');
        c.fillStyle=`rgba(239,178,94,${.34+.12*Math.sin(townT*2+index)})`;c.fillRect(x+5,y+9,5,6);c.fillRect(x+w-10,y+9,5,6);
        c.fillStyle='#776147';townRound(c,x+w/2-5,y+h-4,10,4,1,'#776147');
      }
      if(index%2===0){c.fillStyle='#60533f';townRound(c,x-4,y+h-3,5,5,1,'#60533f');townRound(c,x+2,y+h-2,4,4,1,'#4b4439');}
    });
    /* 원경의 작은 생활 소품: 지붕과 길만 있는 무대가 아니라 실제로 쓰는
       도시처럼 보이되, 핵심 시설보다 대비를 낮게 유지한다. */
    for(let i=0;i<9;i++){
      const x=16+hash(i*17.3+town.id.length)*204,y=116+hash(i*23.7+4)*165;
      if(Math.abs(x-118)<31||town.facilities.some(f=>Math.hypot(f.p.x-x,f.p.y-y)<33))continue;
      c.fillStyle=i%3===0?'#67563f':'#49473f';townRound(c,x,y,5+i%2*3,3+i%3,1,c.fillStyle,'rgba(10,11,11,.5)',.5);
    }
  }
  function townPaths(c){
    const p=town.world.palette,entry=townPoint(town.layout.entry||{x:50,y:90}),center={x:118,y:190};
    const route=(from,to,width,bend=0)=>{
      const mx=(from.x+to.x)/2+bend,my=(from.y+to.y)/2;
      c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(from.x,from.y);c.quadraticCurveTo(mx,my,to.x,to.y);
      c.strokeStyle='rgba(3,5,6,.42)';c.lineWidth=width+5;c.stroke();
      const g=c.createLinearGradient(from.x,from.y,to.x,to.y);g.addColorStop(0,mix(p.path,'#111417',.12));g.addColorStop(.55,p.path);g.addColorStop(1,mix(p.path,'#d5c59e',.08));
      c.strokeStyle=g;c.lineWidth=width;c.stroke();
      c.strokeStyle='rgba(231,217,181,.12)';c.lineWidth=.7;c.setLineDash([3,5]);c.stroke();c.setLineDash([]);
    };
    route(entry,center,13,0);
    town.facilities.forEach((facility,index)=>route(center,facility.p,10,index%2?3:-3));
    townEllipse(c,center.x,center.y,15,9,'rgba(8,10,11,.16)','rgba(222,198,142,.17)');
    for(let i=0;i<7;i++){const a=i/7*Math.PI*2;c.fillStyle='rgba(225,209,172,.13)';townEllipse(c,center.x+Math.cos(a)*10,center.y+Math.sin(a)*5,.7,.45,'rgba(225,209,172,.13)');}
  }
  function townFacility(c,facility){
    const {x,y}=facility.p,p=town.world.palette,selected=town.selected.type==='facility'&&town.selected.id===facility.id;
    townEllipse(c,x+2,y+13,25,8,'rgba(0,0,0,.46)');
    if(selected){townGlow(c,x,y,32,'rgba(229,165,76,ALPHA)',.28);c.save();c.setLineDash([2,2]);townEllipse(c,x,y+5,27,18,null,p.light);c.restore();}
    if(facility.id==='market'){
      for(let i=-1;i<=1;i++){
        const sx=x+i*13,cloth=i===0?p.accent:i<0?mix(p.accent,'#d4aa72',.28):p.roof;
        townRound(c,sx-6,y-3,12,17,1,'#211b17','#090b0c');townPoly(c,[[sx-8,y-5],[sx+8,y-5],[sx+6,y+1],[sx-6,y+1]],cloth,'rgba(232,213,176,.3)');
        c.fillStyle=p.light;c.fillRect(sx-4,y+3,8,1.3);c.fillStyle='#756044';for(let k=0;k<3;k++)townEllipse(c,sx-3+k*3,y+7,1.2,.8,k%2?p.light:'#8e4e36');
        townLine(c,sx-6,y-5,sx-6,y+13,'rgba(202,186,151,.5)',.7);townLine(c,sx+6,y-5,sx+6,y+13,'rgba(202,186,151,.5)',.7);
      }
      townRound(c,x-22,y+12,44,4,1,'#705d42','#282017');c.fillStyle='rgba(231,197,129,.45)';c.fillRect(x-18,y+13,30,1);
    }else if(facility.id==='garage'){
      const wall=c.createLinearGradient(x,y-16,x,y+17);wall.addColorStop(0,mix(p.wall,'#59605d',.22));wall.addColorStop(1,p.wall);townRound(c,x-22,y-14,44,31,2,wall,'#07090a');
      townPoly(c,[[x-25,y-16],[x+25,y-16],[x+21,y-9],[x-22,y-9]],p.roof,'rgba(214,204,179,.25)');
      townRound(c,x-15,y-6,30,23,1,'#070a0b','#4c514d');c.fillStyle='#1c2223';for(let k=0;k<4;k++)c.fillRect(x-13,y-3+k*5,26,1);
      townRound(c,x-11,y+4,22,8,2,'#686154','#252829');c.fillStyle='#22272a';townEllipse(c,x-7,y+11,3,3,'#22272a','#72736e');townEllipse(c,x+7,y+11,3,3,'#22272a','#72736e');
      c.strokeStyle='#a4a095';c.lineWidth=.8;c.beginPath();c.moveTo(x+13,y-7);c.lineTo(x+18,y-2);c.lineTo(x+14,y+4);c.stroke();
      const spark=Math.floor(townT*18)%6;townGlow(c,x+17,y-spark,11,'rgba(244,183,81,ALPHA)',.2);c.fillStyle=p.light;c.fillRect(x+16+(spark%2),y-1-spark,1.2,1.2);c.fillRect(x+19-spark*.4,y+2,1,1);
    }else if(facility.id==='people'){
      townRound(c,x-23,y-12,46,25,2,'#211e1a','#0c0d0d');townPoly(c,[[x-25,y-13],[x+25,y-13],[x+20,y-7],[x-21,y-7]],p.roof,'rgba(214,204,179,.22)');
      townRound(c,x-17,y+8,34,4,1,'#553a26','#17120f');townLine(c,x-13,y+12,x-13,y+16,'#2e241d',1);townLine(c,x+13,y+12,x+13,y+16,'#2e241d',1);
      const flame=2+Math.sin(townT*8)*1.2;townGlow(c,x,y+3,18,'rgba(238,164,73,ALPHA)',.34);townEllipse(c,x,y+6,6,2.6,'#32231c');townPoly(c,[[x-3,y+5],[x,y-4-flame],[x+4,y+5]],'#e57438');townPoly(c,[[x-1.5,y+4],[x,y-flame],[x+2,y+4]],p.light);
      c.fillStyle='#87745a';c.fillRect(x-18,y-1,7,2);c.fillRect(x+11,y-1,7,2);
    }else{
      const kind=town.world.kind;townRound(c,x-21,y-13,42,28,2,p.wall,'#090b0b');townPoly(c,[[x-23,y-15],[x+23,y-15],[x+20,y-8],[x-20,y-8]],p.roof,'rgba(218,205,176,.25)');
      if(kind==='tunnel'){c.fillStyle='#111516';c.beginPath();c.arc(x,y+15,15,Math.PI,0);c.fill();townLine(c,x-12,y+4,x+12,y+4,'#8b7c61',1);c.fillStyle=p.light;for(let i=-1;i<=1;i++)c.fillRect(x+i*8-1,y-4,2,5);}
      else if(kind==='research'){for(let i=0;i<3;i++){townRound(c,x-15+i*11,y-7,8,14,1,'#173338','#3f7774');c.fillStyle=p.light;c.globalAlpha=.35+.35*Math.sin(townT*2+i);c.fillRect(x-13+i*11,y-4,4,7);c.globalAlpha=1;}townLine(c,x-12,y+10,x+13,y+10,'#6faaa4',1);}
      else if(kind==='fortress'){c.fillStyle='#777060';for(let i=0;i<4;i++)c.fillRect(x-18+i*11,y-20,7,8);c.fillStyle='#151816';townRound(c,x-9,y-3,18,18,9,'#151816','#78705d');}
      else{c.fillStyle=p.accent;for(let i=0;i<4;i++)c.fillRect(x-15+i*8,y-4,6,5);c.fillStyle=p.light;c.fillRect(x-12,y+5,24,2);townLine(c,x-12,y+9,x+12,y+9,'rgba(225,210,175,.45)',.8);}
    }
    /* 시설명은 아래의 고정 포커스 패널이 담당한다. 월드 안에는 선택 링만
       남겨 사람 이름과 겹치지 않게 하고 건물 형태 자체가 읽히게 한다. */
  }
  function townLabel(c,text,x,y,selected,color){
    c.font=`750 ${selected?7.2:6.4}px sans-serif`;c.textAlign='center';
    const label=text.length>11?text.slice(0,11):text,w=Math.ceil(c.measureText(label).width)+8;
    townRound(c,P(x-w/2),P(y-8),w,11,2,selected?'rgba(7,9,10,.95)':'rgba(8,10,12,.78)',selected?'rgba(233,187,108,.55)':null,.7);
    c.fillStyle=selected?color:'#d4d0c5';c.fillText(label,P(x),P(y+.2));c.textAlign='left';
  }
  function townPerson(c,x,y,color,frame=0,role='resident',label='',entityId=''){
    const mini=role==='crowd';
    if(mini){c.save();c.translate(x,y);c.scale(.68,.68);x=0;y=0;}
    const active=role==='player'||role==='recruit'||town.selected.id===entityId;
    const walking=role==='player'&&town.moving,step=Math.sin(townT*(walking?11:4)+frame),bob=walking?Math.abs(step)*.9:Math.sin(townT*2+frame)*.22;
    const skin=role==='recruit'?'#d5ad82':'#bd9676',hair=role==='player'?'#373126':role==='recruit'?'#28312f':'#292827';
    townEllipse(c,x,y+8,5.3,2.2,'rgba(0,0,0,.45)');
    if(active)townEllipse(c,x,y+6,7.5,4.3,'rgba(229,165,76,.08)',role==='player'?'rgba(255,207,125,.8)':'rgba(118,202,191,.68)');
    c.strokeStyle='#171a1b';c.lineWidth=2.15;c.lineCap='round';
    townLine(c,x-1.8,y+2+bob,x-2.6-step*1.5,y+7,'#171a1b',2.15);townLine(c,x+1.8,y+2+bob,x+2.6+step*1.5,y+7,'#171a1b',2.15);
    const torso=c.createLinearGradient(x,y-7,x,y+4);torso.addColorStop(0,mix(color,'#d6c6aa',.08));torso.addColorStop(1,mix(color,'#101315',.24));
    townPoly(c,[[x-4.2,y-6+bob],[x+4.2,y-6+bob],[x+3.5,y+3+bob],[x-3.5,y+3+bob]],torso,'rgba(5,7,8,.42)',.55);
    const arm=walking?step*1.8:Math.sin(townT*1.7+frame)*.35;
    townLine(c,x-3.8,y-4+bob,x-5.5+arm,y+1+bob,mix(color,'#090b0d',.2),1.75);townLine(c,x+3.8,y-4+bob,x+5.5-arm,y+1+bob,mix(color,'#090b0d',.2),1.75);
    townEllipse(c,x,y-9.1+bob,3.35,3.55,skin,'rgba(55,38,29,.7)');
    c.fillStyle=hair;c.beginPath();c.arc(x,y-10+bob,3.5,Math.PI,Math.PI*2);c.lineTo(x+3.1,y-8.8+bob);c.lineTo(x-3.1,y-8.8+bob);c.closePath();c.fill();
    c.fillStyle='rgba(24,22,21,.85)';c.fillRect(x-1.45,y-9+bob,.65,.55);c.fillRect(x+.8,y-9+bob,.65,.55);
    if(role==='player'){c.fillStyle='#c89b4f';c.fillRect(x-4,y-3+bob,8,1.15);c.fillStyle='#65746e';townRound(c,x+3.2,y-3+bob,2.2,6,1,'#65746e');}
    if(role==='companion'){c.fillStyle='#83b8b0';townEllipse(c,x+3,y-5+bob,1.1,1.1,'#83b8b0');}
    if(role==='recruit'){
      const pulse=1+.35*Math.sin(townT*4);townGlow(c,x,y-18,9,'rgba(230,173,82,ALPHA)',.13);
      c.save();c.translate(x,y-18);c.rotate(Math.PI/4);townRound(c,-1.7*pulse,-1.7*pulse,3.4*pulse,3.4*pulse,.45,'#e6ad52','#fff0c7',.55);c.restore();
    }
    if(label&&(role==='player'||role==='recruit'||town.selected.id===entityId))
      townLabel(c,label,x,y-19.5,role==='player'||town.selected.id===entityId,role==='player'?'#ffd48a':'#b9d8d3');
    if(mini)c.restore();
  }
  function townParkedVan(c){
    const entry=townPoint(town.layout.entry||{x:50,y:90}),build=vanBuildStage(S&&S.up||{}),extra=Math.max(0,(build.lv||0)*3);
    const x=tclamp(entry.x-29,22,TOWN_W-42),y=TOWN_H-5,h=35+extra,w=25+(build.lv||0)*1.5;
    townEllipse(c,x+2,y-5,w*.7,6,'rgba(0,0,0,.56)');
    const body=c.createLinearGradient(x-w/2,y-h,x+w/2,y);body.addColorStop(0,'#9a9183');body.addColorStop(.5,'#756d61');body.addColorStop(1,'#4f493f');
    townRound(c,x-w/2,y-h,w,h-8,3,body,'#292923',1);townRound(c,x-w/2+1,y-11,w-2,8,1,'#514a3f','#242522');
    c.fillStyle='rgba(113,62,38,.52)';c.fillRect(x-w/2+2,y-h+7,4,6);c.fillRect(x+w/2-5,y-14,3,5);
    townRound(c,x-w/2+2,y-h-8,w-4,11,3,'#8f887b','#343730');
    const glass=c.createLinearGradient(x,y-h-6,x,y-h+2);glass.addColorStop(0,'#78909b');glass.addColorStop(1,'#34454d');townRound(c,x-w/2+5,y-h-5,w-10,6,1,glass,'#202629');
    c.fillStyle='#171a1c';for(const wx of [x-w/2-1,x+w/2-2]){townRound(c,wx,y-h+6,3,9,1,'#171a1c');townRound(c,wx,y-12,3,8,1,'#171a1c');}
    c.fillStyle='#d49643';for(let i=0;i<3;i++)townRound(c,x-w/2+4+i*(w-8)/3,y-h+7,(w-11)/3,6,1,'#d49643','#55452e');
    townRound(c,x-w/2+3,y-h-14,w*.55,5,1,'#514b3f','#242622');townLine(c,x-w/2+2,y-h-10,x+w/2-2,y-h-10,'#2f322e',1);
    c.fillStyle='#8f3730';townRound(c,x+w/2-7,y-h-15,5,7,1,'#8f3730','#4a211e');townRound(c,x+w/2-1,y-h-15,4,7,1,'#8f3730','#4a211e');
    c.strokeStyle='#e4ddd0';c.lineWidth=1.3;c.beginPath();c.moveTo(x-5,y-10);c.lineTo(x+5,y-4);c.moveTo(x+5,y-10);c.lineTo(x-5,y-4);c.stroke();
    c.fillStyle='#cc493d';townRound(c,x-w/2+3,y-5,4,2,1,'#cc493d');townRound(c,x+w/2-7,y-5,4,2,1,'#cc493d');
    if(build.lv>0){c.fillStyle='#aba28e';for(let i=0;i<3;i++)c.fillRect(x-w/2+4+i*7,y-h-18,5,3);}
  }
  function townAmbient(c,dt){
    town.crowd.forEach((person,index)=>{
      const x=tclamp(person.x+Math.sin(townT*person.speed+person.phase)*person.lane,14,TOWN_W-14);
      const y=tclamp(person.y+Math.cos(townT*person.speed*.7+person.phase)*4,90,TOWN_H-12);
      townPerson(c,x,y,person.color,index,'crowd');
    });
    const people=town.facilities.find(item=>item.id==='people');
    if(people){for(let i=0;i<3;i++){const a=townT*.45+i*2.1,x=people.p.x+Math.sin(a)*12,y=people.p.y+9+Math.cos(a)*5;townPerson(c,x,y,townColor(town.id,30+i),i,'crowd');}}
  }
  function townAtmosphere(c){
    const kind=town.world.kind,p=town.world.palette;
    if(kind==='night-market'||kind==='five-day-market'||kind==='hanok-market'){
      const market=town.facilities.find(item=>item.id==='market');
      if(market){for(let i=0;i<5;i++){const rise=(townT*7+i*5)%22,x=market.p.x-8+i*4+Math.sin(townT*2+i)*1.5,y=market.p.y-7-rise;c.fillStyle=`rgba(224,217,199,${.16*(1-rise/22)})`;townEllipse(c,x,y,1.2+rise*.04,.7+rise*.03,c.fillStyle);}}
      for(let i=0;i<4;i++){const x=22+i*63+Math.sin(townT*.4+i)*3,y=126+i%2*28;c.fillStyle='rgba(190,157,106,.28)';townRound(c,x,y,9,5,1,c.fillStyle);townLine(c,x+2,y+5,x+1,y+9,'rgba(84,66,45,.7)',1);townLine(c,x+7,y+5,x+8,y+9,'rgba(84,66,45,.7)',1);}
    }
    if(kind==='dome'){
      const pulse=.08+.05*Math.sin(townT*1.4);townGlow(c,118,156,82,'rgba(235,217,174,ALPHA)',pulse);
      for(let i=0;i<12;i++){const a=townT*.035+i*Math.PI/6,x=118+Math.cos(a)*94,y=170+Math.sin(a)*83;c.fillStyle=i%3?p.light:'rgba(211,204,184,.4)';c.globalAlpha=.25+.35*Math.abs(Math.sin(townT*1.7+i));townEllipse(c,x,y,.8,.55,c.fillStyle);c.globalAlpha=1;}
    }else if(kind==='tunnel'){
      for(let i=0;i<18;i++){const x=23+hash(i*7.1)*190,y=68+((hash(i*9.7)*220+townT*(1+hash(i)*2))%220);c.fillStyle=`rgba(231,197,132,${.08+hash(i)*.15})`;townEllipse(c,x,y,.4+hash(i)*.5,.4+hash(i)*.5,c.fillStyle);}
    }else if(kind==='research'){
      const scan=68+(townT*11)%212;c.fillStyle='rgba(111,211,199,.035)';c.fillRect(8,scan,220,5);townLine(c,8,scan,228,scan,'rgba(111,211,199,.16)',.6);
      for(let i=0;i<5;i++){const x=24+i*44,y=120+Math.sin(townT*.7+i)*2;c.fillStyle='rgba(112,206,196,.18)';townEllipse(c,x,y,3,1,c.fillStyle);}
    }else if(kind==='fortress'){
      for(const x of [35,201]){townLine(c,x,73,x,105,'#4f4a3f',1);const flap=Math.sin(townT*2+x)*2;townPoly(c,[[x,75],[x+10+flap,78],[x,83]],p.accent,'rgba(30,25,22,.55)');}
    }
    const g=c.createLinearGradient(0,250,0,TOWN_H);g.addColorStop(0,'rgba(3,5,6,0)');g.addColorStop(1,'rgba(3,5,6,.36)');c.fillStyle=g;c.fillRect(0,250,TOWN_W,TOWN_H-250);
  }
  function townNamedPeople(c){
    for(const npc of town.residents)townPerson(c,npc.p.x,npc.p.y,townColor(npc.id),npc.id.length,'resident',npc.label,npc.id);
    if(town.recruit)townPerson(c,town.recruit.p.x,town.recruit.p.y,townColor(town.recruit.id),4,'recruit',town.recruit.label,town.recruit.id);
    const companions=townCompanionEntities();companions.forEach((comp,index)=>townPerson(c,comp.p.x,comp.p.y,townColor(comp.id),10+index,'companion',comp.label,comp.id));
  }
  /* 고전 탑다운 RPG 문법: 12px 타일, 제한된 팔레트, 넓은 거리, 같은 규격의
     작은 스프라이트. 현실적인 미니어처 대신 한눈에 읽히는 도시 지도다. */
  function townPixelPalette(){
    const kind=town.world.kind,sets={
      'night-market':{ground:'#32303b',road:'#494656',line:'#625e70',wall:'#51443d',roof:'#673d35',trim:'#a75a3d',window:'#f0bd58',dark:'#171821'},
      'five-day-market':{ground:'#514735',road:'#655b49',line:'#83765e',wall:'#6a5940',roof:'#735137',trim:'#a65b37',window:'#efc264',dark:'#211f1b'},
      dome:{ground:'#303438',road:'#444a4e',line:'#667075',wall:'#4d5557',roof:'#2d3437',trim:'#a94e41',window:'#e9b24e',dark:'#12161a'},
      tunnel:{ground:'#2b2b2d',road:'#444346',line:'#625f61',wall:'#3a3938',roof:'#1c1f21',trim:'#64817d',window:'#e8bd72',dark:'#0d1012'},
      'hanok-market':{ground:'#4d453a',road:'#675e50',line:'#847968',wall:'#6a5a47',roof:'#37332f',trim:'#8f5642',window:'#e6b568',dark:'#201f1d'},
      research:{ground:'#253039',road:'#364751',line:'#506872',wall:'#344750',roof:'#1d2b32',trim:'#4f8f8b',window:'#76c8bf',dark:'#10171c'},
      fortress:{ground:'#444238',road:'#5b594c',line:'#777365',wall:'#686356',roof:'#343831',trim:'#80604e',window:'#e4b264',dark:'#1b1d1a'}
    };return sets[kind]||sets['night-market'];
  }
  function townPixelGround(c){
    const q=townPixelPalette(),kind=town.world.kind;c.fillStyle=q.ground;c.fillRect(0,0,TOWN_W,TOWN_H);
    for(let y=60;y<TOWN_H;y+=8)for(let x=(y/8%2)*4;x<TOWN_W;x+=8){
      const seed=hash(x*3.1+y*5.7+town.id.length);c.fillStyle=seed>.53?mix(q.ground,'#ffffff',.08):mix(q.ground,'#000000',.09);c.fillRect(x+2,y+2,seed>.8?2:1,1);
    }
    /* 포켓몬식 넓은 십자 거리. 시설 사이를 선으로 잇지 않고 길 블록으로 읽힌다. */
    c.fillStyle=q.road;c.fillRect(0,166,TOWN_W,58);c.fillRect(96,100,44,TOWN_H-100);
    c.fillRect(42,130,56,94);c.fillRect(138,130,57,94);c.fillRect(42,222,56,63);c.fillRect(138,222,57,63);
    c.fillStyle=q.line;
    for(let y=168;y<224;y+=12){for(let x=(y/12%2)*8;x<TOWN_W;x+=16)c.fillRect(x,y,9,1);}
    for(let y=106;y<TOWN_H;y+=12){c.fillRect(97,y,42,1);if(y%24===0){c.fillRect(101,y+5,5,1);c.fillRect(126,y+5,8,1);}}
    if(kind==='research'){c.fillStyle='rgba(105,197,189,.16)';for(let x=8;x<TOWN_W;x+=16)c.fillRect(x,58,1,TOWN_H-58);for(let y=62;y<TOWN_H;y+=16)c.fillRect(0,y,TOWN_W,1);}
    if(kind==='tunnel'){c.fillStyle='#15181a';c.fillRect(0,54,24,TOWN_H);c.fillRect(TOWN_W-24,54,24,TOWN_H);c.fillRect(0,54,TOWN_W,26);for(let y=76;y<TOWN_H;y+=28){c.fillStyle='#4c4a47';c.fillRect(18,y,6,14);c.fillRect(TOWN_W-24,y+12,6,14);}}
    if(kind==='fortress'){c.fillStyle='#565246';c.fillRect(0,54,TOWN_W,20);c.fillRect(0,54,14,TOWN_H);c.fillRect(TOWN_W-14,54,14,TOWN_H);for(let x=2;x<TOWN_W;x+=16){c.fillStyle='#777162';c.fillRect(x,55,10,7);}}
  }
  function townPixelBuilding(c,x,y,w,h,index=0,special=''){
    const q=townPixelPalette(),kind=town.world.kind;x=P(x);y=P(y);w=P(w);h=P(h);
    c.fillStyle='rgba(8,9,11,.42)';c.fillRect(x+3,y+4,w,h);
    if(special==='dome'){
      c.fillStyle=q.wall;c.fillRect(x,y+8,w,h-8);c.fillStyle=q.roof;c.fillRect(x+6,y,w-12,4);c.fillRect(x+3,y+4,w-6,4);
      c.fillStyle=mix(q.wall,'#ffffff',.1);for(let by=y+12;by<y+h-7;by+=7)for(let bx=x+4+(by%2?4:0);bx<x+w-4;bx+=12)c.fillRect(bx,by,7,1);
      c.fillStyle=q.trim;c.fillRect(x+9,y+15,w-18,4);c.fillStyle=q.window;for(let k=0;k<6;k++)c.fillRect(x+10+k*10,y+8,5,4);
      c.fillStyle='#d6c89f';c.fillRect(x+w/2-13,y+24,26,2);c.fillStyle=q.dark;c.fillRect(x+w/2-9,y+26,18,h-26);c.fillStyle=q.window;c.fillRect(x+w/2-6,y+29,12,4);return;
    }
    c.fillStyle=q.wall;c.fillRect(x,y+8,w,h-8);c.fillStyle=mix(q.wall,'#ffffff',.11);c.fillRect(x+2,y+10,w-4,2);
    c.fillStyle=index%3===0?q.trim:q.roof;c.fillRect(x-2,y+3,w+4,5);c.fillStyle=mix(q.roof,'#ffffff',.14);c.fillRect(x,y,w,3);
    if(kind==='hanok-market'||kind==='fortress'){c.fillStyle=q.roof;c.fillRect(x-4,y+4,w+8,3);c.fillRect(x,y,w,2);}
    if(kind==='research'){c.fillStyle=q.trim;c.fillRect(x+3,y+5,w-6,2);}
    c.fillStyle=q.window;for(let wx=x+6;wx<x+w-6;wx+=13){c.fillRect(wx,y+13,6,6);c.fillStyle=q.dark;c.fillRect(wx+2,y+13,1,6);c.fillStyle=mix(q.window,'#ffffff',.18);c.fillRect(wx,y+13,1,1);c.fillStyle=q.window;}
    c.fillStyle=mix(q.wall,'#000000',.17);for(let px=x+4;px<x+w-4;px+=9)c.fillRect(px,y+22,1,Math.max(2,h-24));
    c.fillStyle=q.dark;c.fillRect(x+w/2-4,y+h-10,8,10);c.fillStyle=q.trim;c.fillRect(x+w/2-3,y+h-8,6,2);c.fillStyle=q.window;c.fillRect(x+w/2+2,y+h-5,1,1);
    c.fillStyle=mix(q.roof,'#ffffff',.22);c.fillRect(x+3+(index*7)%Math.max(4,w-10),y+1,5,2);
  }

  function townPixelAtlas(c,type,index,x,y,w,h){
    if(!townSpriteAtlas.complete||!townSpriteAtlas.naturalWidth)return false;
    c.save();c.imageSmoothingEnabled=false;
    // atlas v2 cells are authored at exact render size so every draw is 1:1:
    // buildings 50x43 at (i*55+2,2) / people 11x17 at (i*13+2,50) / crowd 7x12 at (i*9+110,52)
    if(type==='building')c.drawImage(townSpriteAtlas,(index%4)*55+2,2,50,43,P(x),P(y),P(w),P(h));
    else if(type==='crowd')c.drawImage(townSpriteAtlas,(index%8)*9+110,52,7,12,P(x),P(y),P(w),P(h));
    else c.drawImage(townSpriteAtlas,(index%8)*13+2,50,11,17,P(x),P(y),P(w),P(h));
    c.restore();return true;
  }
  function townPixelBackdrop(c){
    const kind=town.world.kind;townPixelGround(c);
    if(kind==='dome')townPixelBuilding(c,58,58,120,54,0,'dome');
    else if(kind==='tunnel'){
      for(const [x,y] of [[30,90],[174,90],[30,238],[174,238]])townPixelBuilding(c,x,y,32,28,1);
    }else{
      const top=kind==='research'?[[8,68,45,31],[58,68,45,31],[133,68,45,31],[183,68,45,31]]:[[5,68,46,34],[56,68,43,34],[137,68,43,34],[185,68,46,34]];
      top.forEach((b,i)=>townPixelBuilding(c,...b,i));
    }
    const sides=kind==='dome'?[[7,126,35,29],[194,126,35,29],[7,241,35,29],[194,241,35,29]]
      :kind==='tunnel'?[[28,136,32,26],[176,136,32,26],[28,258,32,25],[176,258,32,25]]
      :[[7,119,34,30],[195,119,34,30],[7,241,34,30],[195,241,34,30]];
    sides.forEach((b,i)=>townPixelBuilding(c,...b,i+2));
    if(kind==='fortress'){c.fillStyle='#252923';c.fillRect(100,66,36,35);c.fillStyle='#817963';c.fillRect(96,62,44,7);c.fillStyle='#111411';c.fillRect(109,79,18,22);}
    if(kind==='research'){const q=townPixelPalette();c.fillStyle=q.trim;c.fillRect(17,109,34,3);c.fillRect(185,109,34,3);}
    townPixelProps(c);
  }
  function townPixelProps(c){
    /* 도시 정체성 소품 2개씩 — 시설보다 낮은 대비, 대로 가장자리라 보행·히트 영역과 무관 */
    const kind=town.world.kind,q=townPixelPalette();
    const L={x:kind==='tunnel'?27:kind==='fortress'?17:10,y:170},R={x:kind==='tunnel'?188:198,y:188};
    const f=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    if(kind==='night-market'){
      f(L.x,L.y+6,6,2,'#26282b');f(L.x+1,L.y+2,4,4,'#3a3d40');f(L.x+1,L.y+1,4,1,'#54575b');f(L.x+2,L.y+7,1,1,'#d28f3d');
      f(R.x,R.y+2,9,4,'#4a4a33');f(R.x-1,R.y+5,11,2,'#3f4028');f(R.x+2,R.y+1,2,1,'#8b857a');f(R.x+5,R.y+1,2,1,'#8b857a');
    }else if(kind==='five-day-market'){
      f(L.x+2,L.y,2,6,'#33373b');f(L.x,L.y+1,2,1,'#33373b');f(L.x-1,L.y+5,5,2,'#26282b');f(L.x,L.y+6,3,1,'#4d5257');
      f(R.x,R.y+1,7,4,'#63492b');f(R.x,R.y+1,7,1,'#7f6238');f(R.x+1,R.y+2,1,1,'#d28f3d');f(R.x+4,R.y+2,2,1,'#9c4f38');
    }else if(kind==='dome'){
      f(L.x,L.y+3,11,3,'#43474c');for(let k=0;k<11;k+=4)f(L.x+k,L.y+3,2,3,'#8a4438');f(L.x+1,L.y+6,1,2,'#26282b');f(L.x+9,L.y+6,1,2,'#26282b');
      f(R.x,R.y+1,6,5,'#3a3f44');f(R.x,R.y+1,6,1,'#54575b');f(R.x+1,R.y+3,4,1,'#26282b');f(R.x+4,R.y+2,1,1,q.window);
    }else if(kind==='tunnel'){
      f(L.x,L.y,7,6,'#26282b');f(L.x+1,L.y+1,2,2,'#3d5a55');f(L.x+4,L.y+1,2,2,'#3d5a55');f(L.x+1,L.y+4,2,1,'#4c4f4b');f(L.x+4,L.y+4,2,1,'#4c4f4b');
      f(R.x,R.y+4,4,2,'#33373b');f(R.x+1,R.y+2,1,2,'#e8bd72');f(R.x+2,R.y+3,1,1,'#33373b');
    }else if(kind==='hanok-market'){
      f(L.x,L.y+3,3,4,'#4f3d2c');f(L.x,L.y+2,3,1,'#63492b');f(L.x+4,L.y+4,2,3,'#4f3d2c');f(L.x+4,L.y+3,2,1,'#63492b');
      f(R.x,R.y+2,8,2,'#63492b');f(R.x,R.y+2,8,1,'#7f6238');f(R.x+1,R.y+4,1,2,'#46331f');f(R.x+6,R.y+4,1,2,'#46331f');
    }else if(kind==='research'){
      f(L.x,L.y,5,7,'#2b3238');f(L.x+1,L.y+1,3,2,'#5d8b82');f(L.x+1,L.y+4,3,1,'#1d2b32');f(L.x+2,L.y+5,1,1,'#76c8bf');
      f(R.x,R.y+4,9,1,'#22282c');f(R.x+2,R.y+3,3,1,'#22282c');f(R.x+7,R.y+1,3,3,'#33373b');f(R.x+8,R.y+2,1,1,'#22282c');
    }else if(kind==='fortress'){
      f(L.x+1,L.y,2,6,'#6b6659');f(L.x,L.y+5,4,2,'#565246');f(L.x+1,L.y,2,1,'#817963');
      f(R.x+1,R.y+2,4,3,'#26282b');f(R.x,R.y+4,6,1,'#33373b');f(R.x+2,R.y+1,1,1,'#e36e32');f(R.x+3,R.y+2,1,1,'#f2d178');
    }
    /* 현장에서 도운 일이 허브 그림에도 남는다. 사진 오버레이나 상태 배지를
       얹지 않고, 같은 1x 타일 문법으로 작업등→정리된 자재→공동 표식을 쌓는다. */
    const impact=town.options&&town.options.impact||{},stage=Number(impact.stage)||0;
    if(stage>=1){
      f(29,228,9,2,mix(q.wall,'#ffffff',.08));f(30,225,2,3,q.trim);f(35,225,2,3,q.trim);
      f(31,224,1,1,q.window);f(36,224,1,1,q.window);
    }
    if(stage>=2){
      f(198,213,11,2,mix(q.wall,'#ffffff',.1));f(199,209,4,4,q.roof);f(204,209,4,4,q.roof);
      f(200,210,2,1,q.window);f(205,210,2,1,q.window);
    }
    if(stage>=3){
      f(84,154,1,7,q.trim);f(151,154,1,7,q.trim);f(84,154,10,2,mix(q.trim,'#ffffff',.14));
      f(142,154,10,2,mix(q.trim,'#ffffff',.14));f(89,155,1,1,q.window);f(146,155,1,1,q.window);
    }
  }
  function townPixelFacility(c,facility){
    const q=townPixelPalette(),x=P(facility.p.x),y=P(facility.p.y),selected=town.selected.type==='facility'&&town.selected.id===facility.id;
    const atlasIndex=facility.id==='market'?0:facility.id==='garage'?1:facility.id==='people'?2:3;
    const atlasDrawn=townPixelAtlas(c,'building',atlasIndex,x-25,y-22,50,43);
    if(!atlasDrawn&&facility.id==='market'){
      c.fillStyle=q.dark;c.fillRect(x-19,y-4,38,22);c.fillStyle=q.trim;c.fillRect(x-22,y-9,44,7);c.fillStyle=q.window;
      for(let k=-14;k<=10;k+=8)c.fillRect(x+k,y+3,5,3);c.fillStyle='#74573b';c.fillRect(x-18,y+14,36,4);
    }else if(!atlasDrawn&&facility.id==='garage'){
      townPixelBuilding(c,x-22,y-15,44,32,2);c.fillStyle=q.dark;c.fillRect(x-14,y-2,28,17);c.fillStyle='#6f716b';c.fillRect(x-10,y+6,20,6);c.fillStyle='#20252a';c.fillRect(x-8,y+11,5,4);c.fillRect(x+4,y+11,5,4);
    }else if(!atlasDrawn&&facility.id==='people'){
      townPixelBuilding(c,x-20,y-12,40,28,3);c.fillStyle='#513620';c.fillRect(x-13,y+10,26,4);c.fillStyle='#e36e32';c.fillRect(x-2,y+4,5,7);c.fillStyle=q.window;c.fillRect(x-1,y+2+(Math.floor(townT*5)%2),3,5);
    }else if(!atlasDrawn){
      townPixelBuilding(c,x-21,y-14,42,30,4);c.fillStyle=q.trim;c.fillRect(x-13,y-2,26,4);c.fillStyle=q.window;c.fillRect(x-10,y+5,20,3);
    }
    if(selected&&Math.floor(townT*3)%2===0){
      c.fillStyle=q.window;const l=5,x1=x-25,y1=y-18,x2=x+25,y2=y+22;c.fillRect(x1,y1,l,2);c.fillRect(x1,y1,2,l);c.fillRect(x2-l,y1,l,2);c.fillRect(x2-2,y1,2,l);c.fillRect(x1,y2-2,l,2);c.fillRect(x1,y2-l,2,l);c.fillRect(x2-l,y2-2,l,2);c.fillRect(x2-2,y2-l,2,l);
    }
  }
  function townPixelPerson(c,x,y,color,frame=0,role='resident',entityId=''){
    const small=role==='crowd',w=small?6:9,h=small?10:14,bob=Math.floor(Math.abs(Math.sin(townT*(role==='player'&&town.moving?10:3)+frame)));
    x=P(x-w/2);y=P(y-h+bob);c.fillStyle='rgba(8,9,11,.38)';c.fillRect(x,y+h,w+1,2);
    const spriteIndex=role==='player'?0:role==='recruit'?7:role==='companion'?1+(frame%2):frame%8;
    const atlasDrawn=townPixelAtlas(c,small?'crowd':'person',spriteIndex,x-(small?0:1),y-2,small?7:11,small?12:17);
    if(!atlasDrawn){
      c.fillStyle='#17191d';c.fillRect(x+1,y+h-3,2,3);c.fillRect(x+w-3,y+h-3,2,3);
      c.fillStyle=color;c.fillRect(x,y+3,w,h-5);c.fillStyle=mix(color,'#ffffff',.17);c.fillRect(x+1,y+4,1,h-7);
      c.fillStyle=role==='recruit'?'#d4aa75':'#bd956f';c.fillRect(x+1,y,w-2,4);c.fillStyle=role==='player'?'#b96837':role==='recruit'?'#33413d':'#252628';c.fillRect(x,y,w,2);
    }
    if(role==='player'){c.fillStyle='#e3a94c';c.fillRect(x,y+5,w,2);}
    if(role==='companion'){c.fillStyle='#72b5ad';c.fillRect(x+w-2,y+5,2,2);}
    if(role==='recruit'&&town.selected.id!==entityId){c.fillStyle='#f0b74f';c.fillRect(x+2,y-6,3,4);c.fillRect(x+3,y-1,1,1);}
    if(town.selected.id===entityId){const q=townPixelPalette();c.fillStyle=q.window;c.fillRect(x-2,y-2,2,2);c.fillRect(x+w,y-2,2,2);c.fillRect(x-2,y+h-2,2,2);c.fillRect(x+w,y+h-2,2,2);}
  }
  function townPixelVan(c){
    const entry=townPoint(town.layout.entry||{x:50,y:90}),x=P(entry.x-25),y=TOWN_H-28,q=townPixelPalette();
    c.fillStyle='rgba(4,5,6,.45)';c.fillRect(x+3,y+5,22,25);c.fillStyle='#6e685d';c.fillRect(x,y,24,27);c.fillStyle='#91897c';c.fillRect(x+2,y-4,20,8);
    c.fillStyle='#31444d';c.fillRect(x+5,y-2,14,5);c.fillStyle='#d28f3d';c.fillRect(x+4,y+8,6,6);c.fillRect(x+14,y+8,6,6);c.fillStyle='#22252a';c.fillRect(x-2,y+4,3,7);c.fillRect(x+23,y+4,3,7);c.fillRect(x-2,y+19,3,7);c.fillRect(x+23,y+19,3,7);
    c.fillStyle='#8e332e';c.fillRect(x+15,y-9,5,7);c.fillRect(x+21,y-9,4,7);c.fillStyle=q.window;c.fillRect(x+2,y+23,3,2);c.fillRect(x+19,y+23,3,2);
    c.fillStyle='#e6dfd2';c.fillRect(x+8,y+18,2,2);c.fillRect(x+14,y+18,2,2);c.fillRect(x+10,y+20,4,2);c.fillRect(x+10,y+16,4,2);
  }
  function townPixelAmbient(c){
    town.crowd.forEach((person,index)=>{
      const x=tclamp(person.x+Math.sin(townT*person.speed+person.phase)*person.lane,16,TOWN_W-16),y=tclamp(person.y+Math.cos(townT*person.speed*.7+person.phase)*4,108,TOWN_H-15);
      townPixelPerson(c,x,y,person.color,index,'crowd');
    });
  }
  function townPixelNamed(c){
    for(const npc of town.residents)townPixelPerson(c,npc.p.x,npc.p.y,townColor(npc.id),npc.id.length,'resident',npc.id);
    if(town.recruit)townPixelPerson(c,town.recruit.p.x,town.recruit.p.y,townColor(town.recruit.id),4,'recruit',town.recruit.id);
    townCompanionEntities().forEach((comp,index)=>townPixelPerson(c,comp.p.x,comp.p.y,townColor(comp.id),10+index,'companion',comp.id));
  }
  function townPixelWeather(c){
    const q=townPixelPalette(),kind=town.world.kind;
    if(kind==='night-market'||kind==='five-day-market'||kind==='hanok-market'){
      for(let i=0;i<5;i++){const y=112+i*29,x=18+((townT*4+i*37)%205);c.fillStyle='rgba(222,210,185,.22)';c.fillRect(P(x),y,1,1);}
    }else if(kind==='tunnel'){
      for(let i=0;i<10;i++){c.fillStyle=i%2?q.window:'#8b7350';c.fillRect(i%2?18:TOWN_W-20,88+i*20+(Math.floor(townT*3+i)%2),2,3);}
    }else if(kind==='research'){
      const y=88+Math.floor((townT*9)%190);c.fillStyle='rgba(103,205,193,.18)';c.fillRect(0,y,TOWN_W,1);
    }
  }
  function townMove(dt){
    if(!town.moving) return;
    const dx=town.target.x-town.player.x,dy=town.target.y-town.player.y,dist=Math.hypot(dx,dy),speed=62;
    if(dist<=Math.max(1.5,speed*dt)){
      town.player={...town.target};town.moving=false;
      const pending=town.pending;town.pending=null;
      if(pending){
        const cb=pending.type==='npc'?town.options.onNpc:pending.type==='recruit'?town.options.onRecruit:pending.type==='companion'?town.options.onComp:null;
        if(cb) setTimeout(()=>cb(pending.id),80);
      }else if(town.selected.type==='facility'&&town.options.onArrive)town.options.onArrive(town.selected.id);
      return;
    }
    town.player.x+=dx/dist*speed*dt;town.player.y+=dy/dist*speed*dt;
  }
  function drawSettlement(dt){
    if(!town||!town.canvas.isConnected) return;
    townT+=dt;townMove(dt);
    const c=town.c;c.clearRect(0,0,TOWN_W,TOWN_H);townPixelBackdrop(c);town.facilities.forEach(facility=>townPixelFacility(c,facility));townPixelVan(c);
    townPixelAmbient(c);townPixelNamed(c);townPixelPerson(c,town.player.x,town.player.y,'#3f4b47',1,'player','player');townPixelWeather(c);
    const canvas=town.canvas,out=town.out,vw=Math.max(1,canvas.clientWidth||390),vh=Math.max(1,canvas.clientHeight||470),dpr=Math.min(2,window.devicePixelRatio||1),key=`${vw}/${vh}/${dpr}`;
    if(key!==town.lastSize){canvas.width=Math.round(vw*dpr);canvas.height=Math.round(vh*dpr);out.setTransform(dpr,0,0,dpr,0,0);out.imageSmoothingEnabled=false;town.lastSize=key;}
    out.clearRect(0,0,vw,vh);out.imageSmoothingEnabled=false;out.drawImage(town.buffer,0,0,town.buffer.width,town.buffer.height,0,0,vw,vh);
  }
  function settlementState(){return town?{id:town.id,focus:town.focus,moving:town.moving,impactStage:Number(town.options&&town.options.impact&&town.options.impact.stage)||0,player:{...town.player},target:{...town.target},
    facilities:town.facilities.map(item=>({id:item.id,p:{...item.p}})),residents:town.residents.map(item=>({id:item.id,p:{...item.p}})),
    recruit:town.recruit?{id:town.recruit.id,p:{...town.recruit.p}}:null,
    companions:townCompanionEntities().map(item=>({id:item.id,p:{...item.p}}))}:null;}

  /* 정착지·정비소에서도 주행 화면과 같은 달구지를 그대로 쓴다.
     별도 PNG가 아니라 업그레이드 상태를 넘겨 전후 외형을 즉시 비교한다. */
  function drawSettlementVan(canvas,upState){
    if(!canvas) return;
    const prevCtx=ctx, prevW=W, prevH=H;
    const pw=170, ph=100, buf=document.createElement('canvas');
    buf.width=pw; buf.height=ph;
    ctx=buf.getContext('2d'); W=pw; H=ph;
    ctx.imageSmoothingEnabled=false;
    ctx.clearRect(0,0,W,H);
    van(54,0,.62,'clear',upState||(S&&S.up)||{});
    ctx=prevCtx; W=prevW; H=prevH;

    const out=canvas.getContext('2d');
    const vw=Math.max(1,canvas.clientWidth||360), vh=Math.max(1,canvas.clientHeight||180);
    const dpr=Math.min(2,window.devicePixelRatio||1);
    canvas.width=Math.round(vw*dpr); canvas.height=Math.round(vh*dpr);
    out.setTransform(dpr,0,0,dpr,0,0);
    out.clearRect(0,0,vw,vh);
    out.imageSmoothingEnabled=false;
    /* 주행 장면의 넓은 여백은 버리고 차체만 크게 잡는다.
       후미 증축은 왼쪽으로 길어져 마지막 좌석 단계까지 한눈에 비교된다. */
    out.drawImage(buf,0,12,128,72,0,0,vw,vh);
  }

  /* ── 타이틀 (같은 픽셀 파이프라인) ── */
  let tcv,tdctx,toff,tctx2,tt=0,TW=236,TH=410;
  function initTitle(canvas){
    tcv=canvas; tdctx=tcv.getContext('2d');
    toff=document.createElement('canvas'); tctx2=toff.getContext('2d');
    tctx2.imageSmoothingEnabled=false;
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
    const vx=w*0.27, vy=P(h*0.66), BL=76,BH=30,CL=28;
    const gl=0.75+0.25*Math.sin(tt*1.8);
    c.fillStyle='rgba(0,0,0,0.55)'; c.beginPath(); c.ellipse(vx+BL*0.6,vy+10,BL*0.62,3,0,0,7); c.fill();
    c.fillStyle='#8d8474'; c.fillRect(P(vx),vy-BH,BL,BH-8);
    c.fillStyle='#6f6250'; c.fillRect(P(vx),vy-8,BL,12);
    c.fillStyle='#4c4438'; c.fillRect(P(vx),vy+2,BL+CL-2,2);
    c.fillStyle='#5d564a'; c.fillRect(P(vx+8),vy-BH-5,BL-30,5);
    c.strokeStyle='#3c372f'; c.lineWidth=1;
    c.beginPath(); c.moveTo(vx+6,vy-BH-6); c.lineTo(vx+BL-13,vy-BH-6); c.stroke();
    c.fillStyle='#514d3d'; c.fillRect(P(vx+BL-31),vy-BH-10,13,6);
    c.fillStyle='#23262e'; c.beginPath(); c.arc(vx+BL-36,vy-BH-8,5,0,7); c.fill();
    for(let rc=0;rc<2;rc++){
      c.fillStyle='#8f3730'; c.fillRect(P(vx+BL-16+rc*6),vy-BH-11,5,7);
      c.fillStyle='#b4483d'; c.fillRect(P(vx+BL-16+rc*6),vy-BH-11,5,1);
    }
    c.fillStyle='#91897d';
    c.beginPath(); c.moveTo(vx+BL+1,vy-BH+8); c.lineTo(vx+BL+CL-8,vy-BH+8);
    c.lineTo(vx+BL+CL-1,vy-BH+15); c.lineTo(vx+BL+CL,vy+1);
    c.lineTo(vx+BL,vy+1); c.closePath(); c.fill();
    c.fillStyle='#6f6250'; c.fillRect(P(vx+BL),vy-8,CL-1,10);
    c.fillStyle='#37332d'; c.fillRect(P(vx+BL-1),vy-BH+7,2,BH-5);
    c.fillStyle=`rgba(230,162,78,${0.9*gl})`;
    for(let wi=0;wi<3;wi++){
      const px=P(vx+9+wi*20);
      c.fillRect(px,vy-BH+6,16,11);
      c.fillStyle='rgba(255,235,190,0.5)'; c.fillRect(px+1,vy-BH+7,14,2);
      c.fillStyle=`rgba(230,162,78,${0.9*gl})`;
    }
    c.strokeStyle='#4c4438'; c.lineWidth=1;
    c.fillStyle='rgba(125,153,179,0.55)';
    c.beginPath(); c.moveTo(vx+BL+4,vy-BH+12); c.lineTo(vx+BL+CL-12,vy-BH+12);
    c.lineTo(vx+BL+CL-9,vy-BH+20); c.lineTo(vx+BL+4,vy-BH+20); c.closePath(); c.fill();
    c.fillStyle='rgba(125,153,179,0.55)';
    c.beginPath(); c.moveTo(vx+BL+CL-10,vy-BH+12); c.lineTo(vx+BL+CL-3,vy-BH+16);
    c.lineTo(vx+BL+CL-3,vy-BH+21); c.lineTo(vx+BL+CL-8,vy-BH+20); c.closePath(); c.fill();
    c.fillStyle='#3c372f'; c.fillRect(P(vx+BL+CL-1),vy-BH+15,3,2);
    c.fillStyle='#49463f'; c.fillRect(P(vx+BL+CL-2),vy-8,2,7);
    c.strokeStyle='rgba(220,218,205,0.78)'; c.lineWidth=1.5;
    c.beginPath(); c.moveTo(vx+BL+6,vy-8); c.lineTo(vx+BL+13,vy);
    c.moveTo(vx+BL+13,vy-8); c.lineTo(vx+BL+6,vy); c.stroke(); c.lineWidth=1;
    c.fillStyle='#0e1016'; c.beginPath(); c.arc(vx+18,vy+6,6.5,0,7); c.arc(vx+BL+14,vy+6,6.5,0,7); c.fill();
    c.fillStyle='#2b2f3a'; c.beginPath(); c.arc(vx+18,vy+6,3.6,0,7); c.arc(vx+BL+14,vy+6,3.6,0,7); c.fill();
    c.fillStyle='#6b4a35'; c.fillRect(P(vx+3),vy-5,8,3); c.fillRect(P(vx+BL-10),vy-BH+13,4,5);
    c.strokeStyle='#4c4438';
    c.beginPath(); c.moveTo(vx+3,vy-BH+2); c.lineTo(vx+3,vy+1);
    for(let ly=vy-BH+5;ly<vy;ly+=5){ c.moveTo(vx+1,ly); c.lineTo(vx+5,ly); } c.stroke();
    c.fillStyle='#d8d2be'; c.fillRect(P(vx+BL+CL-2),vy-4,2,3);
    c.fillStyle='#762a24'; c.fillRect(P(vx-1),vy-4,2,3);
    c.fillStyle='#ffb454';
    c.beginPath(); c.moveTo(vx+10,vy-BH-14); c.lineTo(vx+3,vy-BH-12); c.lineTo(vx+10,vy-BH-10); c.closePath(); c.fill();
    c.strokeStyle='#666'; c.beginPath(); c.moveTo(vx+12,vy-BH-4); c.lineTo(vx+10,vy-BH-14); c.stroke();
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

  return {init,initTitle,draw,drawTitle,drawSettlementVan,initSettlement,drawSettlement,walkSettlement,closeSettlement,settlementState,
    showMeal:(sec)=>{mealT=sec;}, talkPulse:(idx,sec)=>{talkIdx=idx; talkT=sec||3;}};
})();
