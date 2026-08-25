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
    /* 사건 예고 레이어가 켜져도 주행 중 달구지의 기준 배율은 바꾸지 않는다. */
    if(S&&S.driving) displayScale=1;
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
    /* Blend road vibration into the idle sway. A boolean speed check made the
       suspension snap on the final braking frame even though scenery slowed. */
    const motion=clamp(Number(speed)||0,0,1), idle=1-motion;
    const bnc=(Math.sin(t*11)*0.8+Math.sin(t*23.7)*0.4)*motion+Math.sin(t*1.6)*0.3*idle;
    const bnc2=Math.sin(t*11+1.2)*0.8*motion+Math.sin(t*1.6+0.6)*0.3*idle;
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

  /* Detailed road vehicles use the same hard-edged, low-resolution canvas
     language as the caravan. Their physical scale is deliberately smaller
     because they sit farther up the road, not because the asset is a thumbnail. */
  function approachDetailedVehicle(x,ground,motif,dark,variant){
    const bus=motif==='clinic-bus', broken=motif==='broken-vehicle';
    const w=bus?94:88, h=bus?43:39, left=Math.round(x-w/2), top=Math.round(ground-h);
    const palette={
      'coffee-van':['#6f5943','#a7835d','#d3a663'],
      'food-truck':['#70483b','#a56548','#d89055'],
      'clinic-bus':['#d0c8b0','#728f82','#b9574f'],
      'broken-vehicle':['#5d625e','#7b817a','#c17a45'],
      'film-vehicle':['#46515a','#697680','#c89b52']
    }[motif]||['#655b4d','#8a7a63','#c28b4e'];
    const shade=dark?'#171d20':'#272a28', glass=dark?'#263845':'#71838a';
    const wheel=(cx)=>{
      ctx.fillStyle='#111417';circ(cx,ground-6,7);
      ctx.fillStyle='#2e3334';circ(cx,ground-6,4);
      ctx.fillStyle='#77746c';circ(cx,ground-6,1.5);
    };
    const person=(px,coat,wave=false)=>{
      const py=Math.round(ground-3), skin=dark?'#9c765a':'#b58b69';
      ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(px-4,py+1,9,2);
      ctx.fillStyle=skin;circ(px,py-22,3.5);
      ctx.fillStyle=coat;ctx.fillRect(px-4,py-18,8,10);
      ctx.strokeStyle=shade;ctx.lineWidth=2;
      line(px-2,py-8,px-3,py);line(px+2,py-8,px+4,py);
      line(px-4,py-16,px-7,py-10);
      line(px+4,py-16,wave?px+8:px+7,wave?py-25:py-10);
      ctx.fillStyle=skin;circ(wave?px+8:px+7,wave?py-25:py-10,1.5);
    };
    ctx.save();
    ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='rgba(0,0,0,.34)';
    ctx.beginPath();ctx.ellipse(x,ground-2,w*.46,5,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=shade;ctx.fillRect(left+2,top+9,w-4,h-14);
    ctx.fillStyle=palette[0];ctx.fillRect(left+4,top+7,w-31,h-15);
    ctx.fillStyle=palette[1];ctx.fillRect(left+4,top+18,w-9,h-17);
    ctx.beginPath();ctx.moveTo(left+w-31,top+7);ctx.lineTo(left+w-15,top+8);ctx.lineTo(left+w-5,top+18);ctx.lineTo(left+w-5,ground-8);ctx.lineTo(left+w-31,ground-8);ctx.closePath();ctx.fill();
    ctx.fillStyle=shade;ctx.fillRect(left+w-29,top+10,19,11);
    ctx.fillStyle=glass;ctx.fillRect(left+w-27,top+11,8,8);ctx.fillRect(left+w-17,top+12,6,7);
    ctx.fillStyle=dark?'#d7a45b':'#ead095';ctx.fillRect(left+w-6,ground-17,3,3);
    ctx.fillStyle='#3a3530';ctx.fillRect(left+1,ground-10,w-2,3);
    wheel(left+20);wheel(left+w-20);
    if(motif==='coffee-van'||motif==='food-truck'){
      ctx.fillStyle=shade;ctx.fillRect(left+10,top+10,35,16);
      ctx.fillStyle=dark?'#b87838':'#ddad68';ctx.fillRect(left+12,top+12,31,12);
      ctx.fillStyle=palette[2];
      for(let i=0;i<5;i++)ctx.fillRect(left+10+i*8,top+7,5,4);
      ctx.fillStyle='#302820';ctx.fillRect(left+13,top+23,29,2);
      if(motif==='coffee-van'){
        ctx.strokeStyle='#e1c18b';ctx.lineWidth=1.5;circ(left+26,top+17,3);line(left+29,top+17,left+32,top+17);
      }else{
        ctx.fillStyle='#e5d2ac';ctx.fillRect(left+20,top+15,15,2);
        ctx.fillStyle='rgba(221,221,203,.55)';ctx.fillRect(left+24,top+8,2,4);ctx.fillRect(left+31,top+6,2,6);
      }
      person(left-8,motif==='coffee-van'?'#5d493c':'#62443b',true);
      person(left+51,'#3f4a4c',false);
    }else if(bus){
      ctx.fillStyle=glass;
      for(let i=0;i<4;i++)ctx.fillRect(left+9+i*14,top+10,10,9);
      ctx.fillStyle=palette[2];ctx.fillRect(left+10,top+25,45,3);
      ctx.fillRect(left+61,top+12,3,13);ctx.fillRect(left+56,top+17,13,3);
      person(left-8,'#d1d0c5',true);
    }else if(broken){
      ctx.fillStyle=shade;ctx.fillRect(left+w-10,top+4,17,3);
      ctx.strokeStyle='#343638';ctx.lineWidth=2;line(left+w-11,top+7,left+w+5,top-3);
      ctx.fillStyle='rgba(153,158,151,.42)';circ(left+w+2,top-8,3);circ(left+w+7,top-13,4);
      ctx.fillStyle=palette[2];ctx.fillRect(left+w+5,ground-8,7,5);
      person(left+w+13,'#4b4f4d',false);
    }else if(motif==='film-vehicle'){
      ctx.fillStyle=palette[2];ctx.fillRect(left+13,top+9,28,3);
      ctx.fillStyle='#25292b';ctx.fillRect(left+19,top+4,12,5);circ(left+34,top+6,4);
      ctx.strokeStyle='#373b3d';ctx.lineWidth=2;line(left-7,ground,left-1,ground-18);line(left+5,ground,left-1,ground-18);line(left-1,ground-18,left+7,ground-23);
      ctx.fillStyle='#202426';ctx.fillRect(left+6,ground-26,8,6);circ(left+16,ground-23,4);
      person(left-13,'#3b4248',false);
    }
    ctx.fillStyle='rgba(235,210,164,.22)';ctx.fillRect(left+6,top+20,2,h-24);
    ctx.restore();
  }

  /* ── 길 위 사건 예고 ──
     달구지와 같은 해상도의 전용 픽셀 자산을 사용한다. 사람과 시설은 갓길에,
     실제 주행 장애물만 차선에 놓고 접근 중 크기는 바꾸지 않는다. */
  const approachSpriteSources={
    animal:'assets/road-cues/cue-animal.png', bridge:'assets/road-cues/cue-bridge.png', cache:'assets/road-cues/cue-cache.png',
    checkpoint:'assets/road-cues/cue-checkpoint.png', cyclist:'assets/road-cues/cue-cyclist.png', debris:'assets/road-cues/cue-debris.png',
    flood:'assets/road-cues/cue-flood.png', landmark:'assets/road-cues/cue-landmark.png', market:'assets/road-cues/cue-market.png',
    medical:'assets/road-cues/cue-medical.png', people:'assets/road-cues/cue-people.png', shelter:'assets/road-cues/cue-shelter.png',
    signal:'assets/road-cues/cue-signal.png', smoke:'assets/road-cues/cue-smoke.png', surveillance:'assets/road-cues/cue-surveillance.png',
    vehicle:'assets/road-cues/cue-vehicle.png',
    'coffee-van':'assets/road-cues/cue-coffee-van-v2.webp',
    'food-truck':'assets/road-cues/cue-food-truck-v2.webp',
    'clinic-bus':'assets/road-cues/cue-clinic-bus-v2.webp',
    'broken-vehicle':'assets/road-cues/cue-broken-vehicle-v2.webp',
    'film-vehicle':'assets/road-cues/cue-film-vehicle-v2.webp'
  };
  const approachSpriteCache={};
  function approachSprite(key){
    const src=(G.roadCueImages&&G.roadCueImages[key])||approachSpriteSources[key];
    if(!src) return null;
    const cached=approachSpriteCache[key];
    if(cached&&cached.src===src) return cached;
    const img=new Image(); img.src=src; approachSpriteCache[key]=img;
    return img;
  }
  function approachSpriteKey(kind,motif){
    if(['coffee-van','food-truck','clinic-bus','broken-vehicle','film-vehicle'].includes(motif)) return motif;
    if(['bridge','checkpoint','debris','flood','smoke'].includes(kind)) return kind;
    if(motif==='pharmacy') return 'medical';
    if(motif==='postman') return 'cyclist';
    if(['coffee-stall','food-stall','market-cart','barber'].includes(motif)) return 'market';
    if(['greenhouse','school','bath','farm'].includes(motif)) return 'shelter';
    if(['wedding','piano','musician','procession','cow-walker','beekeeper','child','elder','monk','photo'].includes(motif)) return 'people';
    if(motif==='camera-post') return 'surveillance';
    if(motif==='radio-post') return 'signal';
    if(['fire-station','carwash','gas-station'].includes(motif)) return 'landmark';
    if(approachSpriteSources[kind]) return kind;
    return 'landmark';
  }
  function approachSeed(value){
    let n=2166136261;
    for(const ch of String(value||'road-event')){n^=ch.charCodeAt(0);n=Math.imul(n,16777619);}
    return (n>>>0)/4294967295;
  }
  function approachPerson(x,ground,pose='stand',coat='#59625b',flip=0){
    const dir=flip?-1:1, y=P(ground-13);
    ctx.fillStyle='rgba(0,0,0,.38)';ctx.fillRect(x-3,ground,7,1);
    ctx.fillStyle='#25272a';ctx.fillRect(x-2,y,5,2);
    ctx.fillStyle='#b78d6c';ctx.fillRect(x-1,y+2,3,3);
    ctx.fillStyle=coat;ctx.fillRect(x-2,y+5,5,6);
    ctx.fillStyle=mix(coat,'#d7c5a8',.18);ctx.fillRect(x-1,y+5,1,5);
    ctx.fillStyle='#26292d';ctx.fillRect(x-2,y+11,2,3);ctx.fillRect(x+1,y+11,2,3);
    ctx.strokeStyle=coat;ctx.lineWidth=1;
    if(pose==='wave'){line(x+dir*2,y+6,x+dir*5,y+2);line(x+dir*5,y+2,x+dir*5,y-1);}
    else if(pose==='kneel'){ctx.fillRect(x+dir*2,y+9,4,2);ctx.fillRect(x+dir*4,y+10,2,3);}
    else if(pose==='point'){line(x+dir*2,y+6,x+dir*6,y+4);}
    else line(x-3,y+6,x-3,y+10);
  }
  function approachVehicle(x,ground,variant,dark){
    const truck=variant===1, bus=variant===2;
    const w=bus?34:truck?29:25, h=bus?13:truck?12:9, y=P(ground-h-3);
    ctx.fillStyle='rgba(0,0,0,.46)';ctx.fillRect(x-w/2-2,ground,w+5,2);
    ctx.fillStyle=mix(bus?'#6b675f':truck?'#656d64':'#585f65','#11151b',dark*.5);
    ctx.fillRect(P(x-w/2),y,w,h);
    if(truck){ctx.fillStyle='#333a3b';ctx.fillRect(P(x-w/2),y,14,h);ctx.fillStyle='#756d5d';ctx.fillRect(P(x-w/2+15),y+5,w-15,h-5);}
    if(!truck){ctx.fillStyle=dark>.35?'#d59a4d':'#728895';for(let wx=x-w/2+4;wx<x+w/2-3;wx+=7)ctx.fillRect(P(wx),y+2,5,3);}
    ctx.fillStyle='#202329';circ(x-w*.28,ground-1,3);circ(x+w*.3,ground-1,3);
    ctx.fillStyle='#555a5f';circ(x-w*.28,ground-1,1);circ(x+w*.3,ground-1,1);
    ctx.fillStyle='#9c4937';ctx.fillRect(P(x-w/2),y+h-3,2,2);
  }
  function approachBike(x,ground){
    ctx.strokeStyle='#25282e';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x-5,ground-3,4,0,7);ctx.arc(x+5,ground-3,4,0,7);ctx.stroke();
    line(x-5,ground-3,x,ground-8);line(x,ground-8,x+5,ground-3);line(x-5,ground-3,x+2,ground-3);line(x+2,ground-3,x,ground-8);line(x,ground-8,x+4,ground-10);
  }
  function approachCrate(x,ground,variant=0){
    const w=variant?8:11,h=variant?7:8;
    ctx.fillStyle='rgba(0,0,0,.34)';ctx.fillRect(x-w/2-1,ground,w+2,1);
    ctx.fillStyle=variant?'#5c6259':'#745d3d';ctx.fillRect(P(x-w/2),ground-h,w,h);
    ctx.strokeStyle=variant?'#303633':'#3e3326';ctx.lineWidth=1;line(x-w/2,ground-h,x+w/2,ground);line(x+w/2,ground-h,x-w/2,ground);
  }
  function approachPeople(x,ground,count,action,seed){
    const poses=action==='repair'?['kneel','point','stand']:action==='guard'?['point','stand','stand']:
      action==='walk'?['stand','stand','stand']:action==='perform'?['stand','wave','stand']:
      action==='kneel'?['kneel','stand','wave']:action==='wave'?['wave','stand','stand']:['stand','stand','stand'];
    const coats=['#53615a','#695647','#4d5561'];
    for(let i=0;i<count;i++)approachPerson(x+(i-(count-1)/2)*9,ground,poses[i]||'stand',coats[(i+Math.floor(seed*10))%coats.length],i%2);
  }
  function approachProp(x,ground,prop,dark){
    if(prop==='coffee'){
      ctx.fillStyle='#d9cbb1';ctx.fillRect(x-3,ground-6,6,5);ctx.fillStyle='#78563a';ctx.fillRect(x+3,ground-5,2,3);
      ctx.strokeStyle=`rgba(225,225,210,${.45+.3*Math.sin(t*3)})`;line(x-1,ground-8,x-2,ground-12);line(x+2,ground-8,x+3,ground-13);
    }else if(prop==='mail'){
      ctx.fillStyle='#65513b';ctx.fillRect(x-6,ground-9,12,9);ctx.fillStyle='#d0bea0';ctx.fillRect(x-4,ground-7,8,5);ctx.fillStyle='#765b3d';ctx.fillRect(x-1,ground-7,1,5);
    }else if(prop==='medical'){
      ctx.fillStyle='#d8d3be';ctx.fillRect(x-6,ground-9,12,9);ctx.fillStyle='#9c4b43';ctx.fillRect(x-1,ground-8,2,7);ctx.fillRect(x-4,ground-6,8,2);
    }else if(prop==='tools'){
      ctx.fillStyle='#4b4033';ctx.fillRect(x-7,ground-5,14,5);ctx.strokeStyle='#a0a29c';line(x-5,ground-7,x+2,ground-12);line(x+1,ground-11,x+5,ground-8);
    }else if(prop==='radio'){
      ctx.fillStyle='#3e4649';ctx.fillRect(x-7,ground-10,14,10);ctx.fillStyle=dark>.35?'#d59a4b':'#6c8d88';ctx.fillRect(x-5,ground-8,6,4);ctx.strokeStyle='#747b7a';line(x+4,ground-10,x+8,ground-18);
    }else if(prop==='camera'){
      ctx.fillStyle='#33393c';ctx.fillRect(x-5,ground-14,10,6);ctx.fillStyle='#6eb2aa';ctx.fillRect(x+2,ground-12,2,2);ctx.strokeStyle='#474c4e';line(x,ground-8,x-5,ground);line(x,ground-8,x+5,ground);
    }else if(prop==='flowers'){
      ctx.strokeStyle='#536851';for(let i=-5;i<=5;i+=5)line(x+i,ground,x+i+(i%2),ground-8);ctx.fillStyle='#aa6657';circ(x-5,ground-9,2);ctx.fillStyle='#c59b55';circ(x,ground-10,2);ctx.fillStyle='#8d6576';circ(x+5,ground-9,2);
    }else if(prop==='piano'){
      ctx.fillStyle='#3b3028';ctx.fillRect(x-10,ground-13,20,13);ctx.fillStyle='#d2c6ac';ctx.fillRect(x-8,ground-6,16,3);ctx.fillStyle='#272727';for(let i=-6;i<8;i+=4)ctx.fillRect(x+i,ground-6,1,2);
    }else if(prop==='beehive'){
      ctx.fillStyle='#8b7147';for(let i=0;i<3;i++)ctx.fillRect(x-7+i,ground-5-i*5,14-i*2,4);ctx.fillStyle='#31302a';ctx.fillRect(x-2,ground-4,4,1);
    }else if(prop==='books'){
      const colors=['#76544a','#596653','#5d6170'];for(let i=0;i<3;i++){ctx.fillStyle=colors[i];ctx.fillRect(x-7+i,ground-3-i*3,14-i*2,2);}
    }else if(prop==='fuel'){
      ctx.fillStyle='#7e3f34';ctx.fillRect(x-5,ground-11,10,11);ctx.fillStyle='#262a2c';ctx.fillRect(x-2,ground-9,4,2);ctx.strokeStyle='#454b4b';line(x+5,ground-9,x+9,ground-5);
    }else if(prop==='food'){
      ctx.fillStyle='#6f553b';ctx.fillRect(x-8,ground-7,16,7);ctx.fillStyle='#d0b679';ctx.fillRect(x-6,ground-9,12,3);ctx.fillStyle='#d9d0b7';circ(x,ground-10,3);
    }
  }
  function approachSpecialVehicle(x,ground,style,dark,variant){
    const bus=style==='clinic-bus'||style==='film-vehicle', truck=!bus;
    approachVehicle(x,ground,bus?2:1,dark);
    const y=ground-(bus?16:15);
    if(style==='coffee-van'||style==='food-truck'){
      ctx.fillStyle='#272b29';ctx.fillRect(x-9,y,15,7);ctx.fillStyle=dark>.35?'#e1a252':'#b77c3c';ctx.fillRect(x-10,y-2,17,2);
      ctx.fillStyle='#d7c7a8';ctx.fillRect(x-7,y+2,10,1);
      if(style==='coffee-van')approachProp(x-2,ground-1,'coffee',dark);else approachProp(x-2,ground-1,'food',dark);
    }else if(style==='clinic-bus'){
      ctx.fillStyle='#d2cbbc';ctx.fillRect(x-13,y+2,21,8);ctx.fillStyle='#97473f';ctx.fillRect(x-4,y+3,2,6);ctx.fillRect(x-7,y+5,8,2);ctx.fillStyle='#9c4b43';ctx.fillRect(x-1,y-3,4,2);
    }else if(style==='film-vehicle'){
      ctx.fillStyle='#24272a';ctx.fillRect(x-13,y+1,22,9);ctx.fillStyle='#d4b477';ctx.fillRect(x-10,y+3,12,5);ctx.fillStyle='#555b5d';circ(x+6,y+5,3);
    }else if(style==='broken-vehicle'){
      ctx.fillStyle='#555c5c';ctx.fillRect(x+10,y-4,8,2);ctx.strokeStyle='#35393a';line(x+11,y-3,x+8,y+6);
      ctx.fillStyle='rgba(89,89,86,.55)';circ(x+14+Math.sin(t)*2,y-8,2);circ(x+16+Math.sin(t*.7),y-13,3);
    }
  }
  function approachStall(x,ground,style,dark){
    const wide=style==='wedding'||style==='school';
    ctx.fillStyle=style==='greenhouse'?'rgba(92,128,116,.48)':'#5e4b39';ctx.fillRect(x-(wide?17:14),ground-15,wide?34:28,15);
    ctx.fillStyle=style==='coffee-stall'?'#9d6c3b':style==='food-stall'?'#8a5736':style==='pharmacy'?'#d0c8b5':'#665b4b';ctx.fillRect(x-(wide?19:16),ground-19,wide?38:32,4);
    if(style==='coffee-stall'){ctx.fillStyle=dark>.35?'#d89b4b':'#7b918a';ctx.fillRect(x-8,ground-12,12,6);approachProp(x+8,ground,'coffee',dark);}
    else if(style==='food-stall')approachProp(x,ground,'food',dark);
    else if(style==='pharmacy')approachProp(x,ground,'medical',dark);
    else if(style==='greenhouse'){ctx.strokeStyle='#7a968a';line(x-14,ground-15,x,ground-24);line(x,ground-24,x+14,ground-15);}
    else if(style==='school'){ctx.fillStyle='#8a7e66';ctx.fillRect(x-8,ground-11,16,11);ctx.fillStyle='#52696b';ctx.fillRect(x-5,ground-9,10,5);}
  }
  function roadApproachScene(roadY,dark){
    const ap=S&&S.driving&&S.driving.approach;
    if(!ap)return;
    if(!ap.startedAt)ap.startedAt=Date.now();
    const elapsed=Math.max(0,(Date.now()-ap.startedAt)/1000);
    const duration=Math.max(.8,(Number(ap.duration)||1450)/1000);
    const stopAt=Math.max(.9,duration*.84);
    const q=Math.min(1,elapsed/stopAt),ease=1-Math.pow(1-q,3);
    const x=P(lerp(W+30,W*.82,ease)), ground=P(roadY+(H-roadY)*.43+8);
    const seed=approachSeed(ap.eventKey),variant=Math.floor(seed*3),kind=ap.kind||'landmark',spec=ap.scene||{},motif=spec.motif||'';
    if(spec.selfVehicle)return;
    /* The moving road never mixes generated/raster artwork with the caravan.
       Every event first appears as a motif-specific canvas object; cinematic
       art is reserved for the event screen after the vehicle has stopped. */
    const vehicleCue=['coffee-van','food-truck','clinic-bus','film-vehicle','broken-vehicle'].includes(motif);
    const structureCue=['coffee-stall','food-stall','pharmacy','greenhouse','school','wedding'].includes(motif);
    const fallbackScale=(vehicleCue?.82:structureCue?.78:.8)+(vehicleCue?.18:structureCue?.2:.18)*ease;
    ctx.save();ctx.globalAlpha=Math.min(1,.2+q*1.4);
    ctx.imageSmoothingEnabled=false;
    ctx.translate(x,ground);ctx.scale(fallbackScale,fallbackScale);ctx.translate(-x,-ground);
    ctx.fillStyle=dark?'rgba(1,4,8,.34)':'rgba(18,22,20,.24)';
    ctx.fillRect(Math.round(x-25),Math.round(ground),50,2);
    if(['coffee-van','food-truck','clinic-bus','film-vehicle','broken-vehicle'].includes(motif)){
      approachDetailedVehicle(x,ground,motif,dark,variant);
    }else if(motif==='postman'){
      approachBike(x+5,ground);approachPeople(x-7,ground,1,spec.action||'wave',seed);approachProp(x+13,ground,'mail',dark);
    }else if(['coffee-stall','food-stall','pharmacy','greenhouse','school'].includes(motif)){
      approachStall(x,ground,motif,dark);approachPeople(x+19,ground,spec.people||1,spec.action||'serve',seed);
    }else if(motif==='wedding'){
      ctx.strokeStyle='#a77f57';line(x-14,ground,x-14,ground-20);line(x+14,ground,x+14,ground-20);ctx.beginPath();ctx.arc(x,ground-20,14,Math.PI,0);ctx.stroke();
      approachProp(x,ground-13,'flowers',dark);approachPeople(x,ground,3,'stand',seed);
    }else if(motif==='piano'){
      approachProp(x+4,ground,'piano',dark);approachPeople(x-11,ground,spec.people||1,'perform',seed);
    }else if(motif==='musician'){
      approachPeople(x-3,ground,spec.people||1,'perform',seed);ctx.fillStyle='#6f4a2f';ctx.fillRect(x+5,ground-11,4,9);circ(x+7,ground-12,3);ctx.strokeStyle='#b69262';line(x+7,ground-13,x+12,ground-23);
    }else if(motif==='procession'){
      approachPeople(x,ground,3,'walk',seed);if(spec.prop)approachProp(x+17,ground,spec.prop,dark);
    }else if(motif==='cow-walker'){
      ctx.fillStyle='#756657';ctx.fillRect(x-2,ground-11,15,8);ctx.fillRect(x+11,ground-15,6,6);ctx.fillRect(x,ground-3,2,4);ctx.fillRect(x+9,ground-3,2,4);approachPeople(x-10,ground,1,'walk',seed);
    }else if(motif==='beekeeper'){
      approachProp(x+5,ground,'beehive',dark);approachPeople(x-8,ground,spec.people||1,spec.action||'carry',seed);
    }else if(motif==='barber'){
      approachStall(x,ground,'food-stall',dark);ctx.fillStyle='#8f4d43';ctx.fillRect(x+9,ground-15,2,12);ctx.fillStyle='#d8d0bd';ctx.fillRect(x+9,ground-13,2,3);ctx.fillRect(x+9,ground-7,2,3);approachPeople(x-17,ground,spec.people||2,'stand',seed);
    }else if(motif==='fire-station'){
      approachVehicle(x,ground,1,dark);ctx.fillStyle='#8c3f36';ctx.fillRect(x-13,ground-14,21,8);ctx.fillStyle='#b9b7a7';for(let i=-10;i<8;i+=4)ctx.fillRect(x+i,ground-17,3,1);approachPeople(x-19,ground,spec.people||1,'stand',seed);
    }else if(motif==='carwash'){
      ctx.fillStyle='#43494b';ctx.fillRect(x-17,ground-22,3,22);ctx.fillRect(x+15,ground-22,3,22);ctx.fillRect(x-17,ground-22,35,3);approachVehicle(x,ground,0,dark);
      ctx.fillStyle='rgba(113,153,164,.55)';for(let i=-10;i<=10;i+=5)ctx.fillRect(x+i,ground-20+(i%3),1,12);
    }else if(motif==='gas-station'){
      ctx.fillStyle='#535957';ctx.fillRect(x-8,ground-18,12,18);ctx.fillStyle='#8e4439';ctx.fillRect(x-5,ground-15,6,5);ctx.strokeStyle='#333738';line(x+4,ground-13,x+11,ground-5);approachPeople(x+13,ground,spec.people||1,'wave',seed);
    }else if(motif==='bath'){
      ctx.fillStyle='#6a5740';ctx.fillRect(x-10,ground-10,20,10);ctx.strokeStyle='#a78a62';for(let i=-8;i<10;i+=4)line(x+i,ground-10,x+i,ground);
      for(let i=0;i<3;i++){ctx.fillStyle='rgba(205,210,201,.36)';circ(x-5+i*5+Math.sin(t+i),ground-15-i*2,2);}
      approachPeople(x+15,ground,spec.people||1,'stand',seed);
    }else if(motif==='market-cart'){
      ctx.fillStyle='#64513b';ctx.fillRect(x-10,ground-10,20,9);ctx.fillStyle='#27292b';circ(x-7,ground,3);circ(x+7,ground,3);approachProp(x,ground-8,spec.prop||'food',dark);approachPeople(x-15,ground,spec.people||1,'carry',seed);
    }else if(motif==='photo'){
      approachPeople(x-5,ground,spec.people||1,'stand',seed);approachProp(x+8,ground,'camera',dark);
    }else if(motif==='radio-post'){
      approachProp(x,ground,'radio',dark);ctx.strokeStyle='#6d7777';line(x,ground-14,x,ground-28);line(x,ground-28,x-7,ground-17);line(x,ground-28,x+7,ground-17);approachPeople(x+13,ground,spec.people||1,'stand',seed);
    }else if(motif==='camera-post'){
      approachProp(x,ground,'camera',dark);approachPeople(x-13,ground,spec.people||0,'guard',seed);
    }else if(motif==='vending'){
      ctx.fillStyle='#485052';ctx.fillRect(x-7,ground-20,14,20);ctx.fillStyle=dark>.35?'#d59543':'#6e9691';ctx.fillRect(x-5,ground-17,10,7);ctx.fillStyle='#b9b19d';for(let i=0;i<3;i++)ctx.fillRect(x-4+i*4,ground-8,2,2);
    }else if(motif==='rail-crossing'){
      ctx.fillStyle='#3f4445';ctx.fillRect(x-14,ground-24,2,24);ctx.fillStyle='#a0723d';ctx.fillRect(x-13,ground-21,29,2);ctx.fillStyle='#252a2b';for(let i=-10;i<15;i+=7)ctx.fillRect(x+i,ground-21,4,2);ctx.fillStyle='#53575a';ctx.fillRect(x-20,ground-2,42,1);
    }else if(motif==='farm'){
      ctx.fillStyle='#4e5d45';for(let i=-16;i<=16;i+=8){ctx.fillRect(x+i,ground-7,2,7);ctx.fillRect(x+i-2,ground-6,2,2);ctx.fillRect(x+i+2,ground-5,2,2);}approachCrate(x+17,ground,0);approachPeople(x-18,ground,spec.people||1,'carry',seed);
    }else if(motif==='child'||motif==='elder'||motif==='monk'){
      approachPeople(x,ground,spec.people||1,spec.action||'stand',seed);if(spec.prop)approachProp(x+11,ground,spec.prop,dark);
    }else if(kind==='vehicle'){
      approachVehicle(x,ground,variant,dark);approachPeople(x-20,ground,spec.people||1,spec.action||'stand',seed);
      if(spec.prop)approachProp(x+18,ground,spec.prop,dark);
    }else if(kind==='people'){
      approachPeople(x-4,ground,spec.people||2,spec.action||'wave',seed);
      if(spec.prop)approachProp(x+16,ground,spec.prop,dark);else approachCrate(x+14,ground,1);
    }else if(kind==='cyclist'){
      approachBike(x+3,ground);approachPerson(x-6,ground,'wave','#4a5552',0);approachCrate(x+10,ground,variant%2);
    }else if(kind==='checkpoint'){
      ctx.fillStyle='#39403f';ctx.fillRect(x+4,ground-22,14,21);ctx.fillStyle=dark>.35?'#d69b4d':'#607d7b';ctx.fillRect(x+7,ground-18,7,5);
      ctx.fillStyle='#b89950';ctx.fillRect(x-19,ground-8,27,2);ctx.fillStyle='#313638';ctx.fillRect(x-17,ground-8,4,2);ctx.fillRect(x-8,ground-8,4,2);ctx.fillRect(x+1,ground-8,4,2);
      approachPerson(x-1,ground,'point','#596056',1);
    }else if(kind==='medical'){
      approachPerson(x-8,ground,'kneel','#67594d',0);approachPerson(x+3,ground,'wave','#57645e',1);
      ctx.fillStyle='#d8d3be';ctx.fillRect(x+8,ground-8,10,8);ctx.fillStyle='#9c4b43';ctx.fillRect(x+12,ground-7,2,6);ctx.fillRect(x+10,ground-5,6,2);
    }else if(kind==='bridge'){
      ctx.fillStyle='#4d4436';for(let i=-18;i<=18;i+=6)ctx.fillRect(x+i,ground-4+(i%12?1:0),5,3);
      ctx.strokeStyle='#827153';line(x-19,ground-7,x+20,ground-7);line(x-16,ground-10,x-16,ground-3);line(x+17,ground-10,x+17,ground-3);
      approachPerson(x+19,ground,'wave','#5d604f',1);
    }else if(kind==='flood'){
      ctx.fillStyle='rgba(75,107,126,.66)';ctx.fillRect(x-28,ground-6,W-(x-28),8);
      ctx.fillStyle='rgba(158,188,195,.55)';for(let i=0;i<4;i++)ctx.fillRect(x-24+i*13,ground-5+(i%2)*3,8,1);
      ctx.fillStyle='#656052';ctx.fillRect(x-9,ground-18,2,13);ctx.fillRect(x-14,ground-18,12,6);
    }else if(kind==='surveillance'){
      ctx.fillStyle='#3d4448';ctx.fillRect(x,ground-25,2,25);ctx.fillRect(x-4,ground-25,11,3);ctx.fillRect(x+5,ground-24,5,4);
      const pulse=.4+.4*Math.sin(t*5);ctx.strokeStyle=`rgba(85,224,200,${pulse})`;ctx.beginPath();ctx.arc(x+6,ground-22,6,0,7);ctx.stroke();
    }else if(kind==='signal'){
      ctx.fillStyle='#3d4246';ctx.fillRect(x,ground-24,2,24);line(x+1,ground-24,x-7,ground-8);line(x+1,ground-24,x+9,ground-8);
      ctx.strokeStyle='rgba(117,204,193,.7)';for(let r=4;r<13;r+=4){ctx.beginPath();ctx.arc(x+1,ground-23,r,Math.PI*1.15,Math.PI*1.85);ctx.stroke();}
    }else if(kind==='smoke'){
      ctx.fillStyle='#a65d36';ctx.fillRect(x-4,ground-5,8,4);ctx.fillStyle='#dda14f';ctx.fillRect(x-2,ground-8,4,5);
      for(let i=0;i<4;i++){ctx.fillStyle=`rgba(75,78,79,${.55-i*.1})`;circ(x+Math.sin(t+i)*3,ground-13-i*5,3+i*.6);}
      if(variant)approachPerson(x+11,ground,'stand','#5d5548',1);
    }else if(kind==='shelter'||kind==='market'){
      const market=kind==='market';ctx.fillStyle=market?'#64503c':'#4b514e';ctx.fillRect(x-15,ground-16,29,16);
      ctx.fillStyle=market?'#9b6e40':'#656b65';ctx.fillRect(x-18,ground-19,35,4);ctx.fillStyle=dark>.35?'#d69a48':'#81918a';ctx.fillRect(x-7,ground-12,8,6);
      approachPerson(x+19,ground,market?'wave':'stand','#62564b',1);
    }else if(kind==='animal'){
      const deer=variant===2;ctx.fillStyle='#69584a';ctx.fillRect(x-6,ground-(deer?10:7),12,deer?7:5);ctx.fillRect(x+5,ground-(deer?15:10),5,6);
      ctx.fillRect(x-5,ground-3,2,4);ctx.fillRect(x+3,ground-3,2,4);ctx.fillRect(x+8,ground-8,2,9);
      if(deer){ctx.strokeStyle='#69584a';line(x+7,ground-14,x+5,ground-19);line(x+8,ground-14,x+11,ground-19);}
    }else if(kind==='cache'){
      approachCrate(x-7,ground,0);approachCrate(x+5,ground,1);if(variant===2)approachCrate(x+14,ground,0);
      ctx.fillStyle='#82714d';ctx.fillRect(x-16,ground-4,5,4);
    }else if(kind==='debris'){
      ctx.fillStyle='#4b4d4d';for(let i=0;i<5;i++){const rx=x-17+i*8,hh=4+Math.floor(hash(i+seed*10)*6);ctx.fillRect(rx,ground-hh,7,hh);}
      if(variant===1){ctx.fillStyle='#9c6c35';ctx.fillRect(x-20,ground-12,38,3);ctx.fillStyle='#2e3132';for(let i=-16;i<17;i+=9)ctx.fillRect(x+i,ground-12,4,3);}
    }else{
      ctx.fillStyle='#4b4f4d';ctx.fillRect(x,ground-22,3,22);ctx.fillStyle='#696156';ctx.fillRect(x-8,ground-22,19,10);
      ctx.fillStyle='#9e8654';ctx.fillRect(x-5,ground-19,13,1);if(variant===2)approachPerson(x+14,ground,'stand','#575b52',1);
    }
    ctx.restore();
  }

  function roadApproachVehicleAlert(roadY){
    const ap=S&&S.driving&&S.driving.approach;
    if(!ap||!ap.scene||!ap.scene.selfVehicle)return;
    const elapsed=Math.max(0,(Date.now()-(ap.startedAt||Date.now()))/1000);
    const strength=Math.min(1,elapsed/.55);
    const hoodX=P(W*.53+22),baseY=P(roadY+(H-roadY)*.42-24);
    if(ap.scene.alert==='temperature'){
      ctx.fillStyle=`rgba(221,151,66,${.42+.42*strength})`;
      ctx.fillRect(hoodX-2,baseY+15,4,2);
      ctx.fillStyle=`rgba(168,54,43,${.25+.45*Math.abs(Math.sin(t*5))})`;
      ctx.fillRect(hoodX-1,baseY+15,2,1);
      return;
    }
    for(let i=0;i<4;i++){
      const rise=((elapsed*9+i*5)%17),drift=Math.sin(t*1.7+i)*2;
      ctx.fillStyle=`rgba(66,69,68,${(.34-i*.045)*strength})`;
      circ(hoodX+drift+i,baseY+10-rise,2+i*.45);
    }
  }


  /* ── 메인 draw ── */
  function draw(dt){
    if(!ctx) return; t+=dt;
    mealT=Math.max(0,mealT-dt);
    talkT=Math.max(0,talkT-dt);
    const hour=S? S.min/60:21.2;
    const dark=darknessAt(hour);
    const wx=S? (S.wx||'clear'):'clear';
    const activeApproach=S&&S.driving&&S.driving.approach;
    const approachElapsed=activeApproach?Math.max(0,(Date.now()-(activeApproach.startedAt||Date.now()))/1000):0;
    const approachDuration=activeApproach?Math.max(.8,(Number(activeApproach.duration)||1450)/1000):1;
    /* Hold road speed briefly while the cue becomes legible, then use a
       smootherstep curve so acceleration and braking force both reach zero. */
    const brakeStart=approachDuration*.18;
    const brakeSpan=Math.max(.9,approachDuration*.66);
    const brakeProgress=activeApproach?Math.min(1,Math.max(0,(approachElapsed-brakeStart)/brakeSpan)):0;
    const brakeEase=brakeProgress*brakeProgress*brakeProgress*(brakeProgress*(brakeProgress*6-15)+10);
    const approachSpeed=activeApproach?Math.max(0,1-brakeEase):1;
    const speed=S&&S.driving&&!UI.modalOpen()?approachSpeed:0;
    if(speed>0) worldX+=64*dt*speed;

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
    roadApproachScene(roadY,dark);
    /* 주행, 접근, 제동, 정차 모두 같은 달구지 배율을 쓴다. 원근 변화는
       전방 사건 오브젝트에만 적용해 차가 순간적으로 수축하는 착시를 막는다. */
    van(roadY,speed,dark,wx,undefined,1);
    roadApproachVehicleAlert(roadY);
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
    /* 도시마다 생활 방식이 다른 만큼 거리의 골격도 다르다. 시설 좌표는
       그대로 유지하되 길 폭, 광장, 마당과 통로의 비율을 다르게 잡는다. */
    c.fillStyle=q.road;
    if(kind==='dome'){
      c.fillRect(0,150,TOWN_W,72);c.fillRect(80,92,76,TOWN_H-92);c.fillRect(18,222,200,64);
    }else if(kind==='tunnel'){
      c.fillRect(24,82,TOWN_W-48,TOWN_H-82);c.fillRect(50,145,TOWN_W-100,78);
    }else if(kind==='hanok-market'){
      c.fillRect(0,158,TOWN_W,66);c.fillRect(84,102,68,TOWN_H-102);c.fillRect(35,224,166,61);
    }else if(kind==='research'){
      c.fillRect(0,154,TOWN_W,60);c.fillRect(88,92,60,TOWN_H-92);c.fillRect(28,222,180,64);
    }else if(kind==='fortress'){
      c.fillRect(14,150,TOWN_W-28,72);c.fillRect(91,74,54,TOWN_H-74);c.fillRect(38,222,160,64);
    }else if(kind==='five-day-market'){
      c.fillRect(0,158,TOWN_W,70);c.fillRect(80,104,76,TOWN_H-104);c.fillRect(34,224,168,62);
    }else{
      c.fillRect(0,156,TOWN_W,64);c.fillRect(86,100,64,TOWN_H-100);c.fillRect(30,220,176,66);
    }
    c.fillStyle=q.line;
    if(kind==='dome'||kind==='research'){
      for(let x=7;x<TOWN_W;x+=22)c.fillRect(x,184,12,1);
      for(let y=104;y<TOWN_H;y+=18)c.fillRect(117,y,2,9);
    }else if(kind==='fortress'||kind==='hanok-market'){
      for(let y=160;y<286;y+=10)for(let x=18+(y%20?5:0);x<TOWN_W-18;x+=20)c.fillRect(x,y,13,1);
    }else{
      for(let y=164;y<224;y+=12)for(let x=(y/12%2)*8;x<TOWN_W;x+=16)c.fillRect(x,y,9,1);
      for(let y=108;y<TOWN_H;y+=14)c.fillRect(96,y,44,1);
    }
    /* 빈 회색 면 대신 실제 왕래가 남긴 흔적을 낮은 대비로 쌓는다. */
    for(let i=0;i<18;i++){
      const x=12+hash(i*7.3+town.id.length)*212,y=132+hash(i*11.9+4)*150;
      c.fillStyle=i%4===0?'rgba(9,15,18,.28)':mix(q.road,'#000000',.16);
      c.fillRect(P(x),P(y),i%4===0?8:2,i%3===0?2:1);
      if(i%5===0){c.fillStyle='rgba(114,145,151,.14)';c.fillRect(P(x+1),P(y),6,1);}
    }
    c.fillStyle=mix(q.road,'#000000',.25);
    for(const [x,y] of [[30,191],[66,238],[173,177],[202,247]]){c.fillRect(x,y,9,1);c.fillRect(x+3,y+1,1,3);}
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
    c.fillStyle=index%3===0?q.trim:q.roof;c.fillRect(x-2-(index%2),y+3,w+4+(index%2)*2,5);c.fillStyle=mix(q.roof,'#ffffff',.14);c.fillRect(x,y,w,3);
    if(kind==='hanok-market'||kind==='fortress'){c.fillStyle=q.roof;c.fillRect(x-4,y+4,w+8,3);c.fillRect(x,y,w,2);}
    if(kind==='research'){c.fillStyle=q.trim;c.fillRect(x+3,y+5,w-6,2);}
    const rows=h>=38?2:1;
    for(let row=0;row<rows;row++){
      c.fillStyle=q.window;for(let wx=x+6+(row%2)*3;wx<x+w-6;wx+=13){
        const wy=y+13+row*11;c.fillRect(wx,wy,6,5);c.fillStyle=q.dark;c.fillRect(wx+2,wy,1,5);
        c.fillStyle=mix(q.window,'#ffffff',.18);c.fillRect(wx,wy,1,1);c.fillStyle=q.window;
      }
    }
    c.fillStyle=mix(q.wall,'#000000',.17);for(let px=x+4;px<x+w-4;px+=9)c.fillRect(px,y+22,1,Math.max(2,h-24));
    c.fillStyle=q.dark;c.fillRect(x+w/2-4,y+h-10,8,10);c.fillStyle=q.trim;c.fillRect(x+w/2-3,y+h-8,6,2);c.fillStyle=q.window;c.fillRect(x+w/2+2,y+h-5,1,1);
    c.fillStyle=mix(q.roof,'#ffffff',.22);c.fillRect(x+3+(index*7)%Math.max(4,w-10),y+1,5,2);
    if(index%4===1){c.fillStyle=mix(q.wall,'#000000',.35);c.fillRect(x+w-10,y+17,8,2);c.fillRect(x+w-7,y+19,5,1);}
    if(index%4===2){c.fillStyle=q.trim;c.fillRect(x+3,y+h-15,w-6,3);for(let ax=x+4;ax<x+w-5;ax+=8){c.fillStyle=ax%16?q.trim:mix(q.trim,'#ffffff',.12);c.fillRect(ax,y+h-15,5,3);}}
  }

  function townPixelAwning(c,x,y,w,index=0){
    const q=townPixelPalette();c.fillStyle=mix(q.dark,'#ffffff',.12);c.fillRect(x,y+5,w,4);c.fillStyle=index%2?q.trim:mix(q.trim,'#ffffff',.12);c.fillRect(x-2,y,w+4,5);
    for(let ax=x;ax<x+w;ax+=8){c.fillStyle=ax/8%2?q.trim:mix(q.trim,'#f0c57a',.32);c.fillRect(ax,y,5,5);}
    c.fillStyle=q.dark;c.fillRect(x+2,y+9,2,8);c.fillRect(x+w-4,y+9,2,8);
  }
  function townPixelTower(c,x,y,h,index=0){
    const q=townPixelPalette();c.fillStyle='rgba(5,7,9,.42)';c.fillRect(x+3,y+4,18,h);c.fillStyle=mix(q.wall,'#ffffff',.06);c.fillRect(x,y+8,18,h-8);
    c.fillStyle=q.roof;c.fillRect(x-3,y+3,24,5);c.fillStyle=q.trim;c.fillRect(x+3,y+13,12,3);c.fillStyle=q.window;c.fillRect(x+6,y+17,6,5);
    c.fillStyle=q.dark;c.fillRect(x+8,y+22,2,h-22);if(index%2===0){c.fillStyle=q.trim;c.fillRect(x+8,y-5,2,8);c.fillRect(x+5,y-4,8,2);}
  }
  function townPixelWire(c,x1,y1,x2,y2,sag=4){
    const q=townPixelPalette();c.fillStyle=mix(q.dark,'#ffffff',.16);
    for(let x=x1;x<=x2;x+=2){const t=(x-x1)/Math.max(1,x2-x1),y=y1+(y2-y1)*t+Math.sin(t*Math.PI)*sag;c.fillRect(P(x),P(y),2,1);}
  }
  function townPixelCarcass(c,x,y,index=0){
    const q=townPixelPalette();c.fillStyle='rgba(4,6,8,.35)';c.fillRect(x+2,y+5,18,7);c.fillStyle=mix(q.wall,index%2?'#6f493c':'#5b6264',.35);c.fillRect(x,y+2,20,7);
    c.fillStyle=q.dark;c.fillRect(x+4,y,10,4);c.fillStyle='#20252a';c.fillRect(x+3,y+8,4,4);c.fillRect(x+14,y+8,4,4);c.fillStyle=mix(q.wall,'#ffffff',.14);c.fillRect(x+6,y+1,6,2);
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
    if(kind==='night-market'){
      [[2,72,37,42],[34,64,43,50],[72,70,35,40],[130,67,40,44],[166,61,42,51],[203,72,31,40]].forEach((b,i)=>townPixelBuilding(c,...b,i));
      townPixelAwning(c,5,119,35,0);townPixelAwning(c,196,119,34,1);townPixelAwning(c,6,239,34,2);townPixelWire(c,10,102,226,93,9);
    }else if(kind==='five-day-market'){
      [[4,73,48,35],[47,68,45,40],[143,70,42,38],[181,75,50,33]].forEach((b,i)=>townPixelBuilding(c,...b,i));
      townPixelAwning(c,7,121,34,0);townPixelAwning(c,194,121,35,1);townPixelAwning(c,8,241,33,2);townPixelAwning(c,195,241,33,3);
    }else if(kind==='dome'){
      townPixelBuilding(c,48,55,140,60,0,'dome');townPixelTower(c,8,70,63,0);townPixelTower(c,210,72,61,1);
      [[2,126,40,45],[194,126,40,45],[4,235,38,45],[194,237,39,43]].forEach((b,i)=>townPixelBuilding(c,...b,i+1));
      townPixelAwning(c,47,128,45,1);townPixelAwning(c,145,128,43,2);townPixelWire(c,17,112,218,105,7);townPixelCarcass(c,13,229,0);townPixelCarcass(c,202,206,1);
    }else if(kind==='tunnel'){
      [[27,90,35,31],[174,90,35,31],[27,134,34,29],[175,134,34,29],[27,247,34,29],[175,247,34,29]].forEach((b,i)=>townPixelBuilding(c,...b,i));
      townPixelWire(c,27,82,209,82,2);
    }else if(kind==='hanok-market'){
      [[3,73,47,34],[45,69,45,38],[144,70,44,37],[184,74,48,33]].forEach((b,i)=>townPixelBuilding(c,...b,i));
      [[7,121,35,30],[194,121,35,30],[8,241,34,30],[194,241,35,30]].forEach((b,i)=>townPixelBuilding(c,...b,i+4));
      townPixelAwning(c,52,113,31,0);townPixelWire(c,12,105,224,105,3);
    }else if(kind==='research'){
      [[4,72,42,43],[43,64,52,51],[141,65,51,50],[190,72,42,43]].forEach((b,i)=>townPixelBuilding(c,...b,i));
      townPixelTower(c,107,55,60,0);townPixelBuilding(c,7,126,35,35,5);townPixelBuilding(c,194,126,35,35,6);townPixelBuilding(c,7,241,35,34,7);townPixelBuilding(c,194,241,35,34,8);
      const q=townPixelPalette();c.fillStyle=q.trim;c.fillRect(15,118,36,3);c.fillRect(185,118,36,3);townPixelWire(c,15,99,220,91,5);
    }else if(kind==='fortress'){
      const q=townPixelPalette();c.fillStyle='#565246';c.fillRect(14,68,208,34);for(let x=18;x<220;x+=18){c.fillStyle='#777162';c.fillRect(x,65,11,7);}
      townPixelTower(c,16,59,53,0);townPixelTower(c,202,59,53,1);c.fillStyle='#252923';c.fillRect(98,67,40,38);c.fillStyle='#111411';c.fillRect(109,78,18,27);
      [[8,126,35,34],[193,126,35,34],[8,241,35,33],[193,241,35,33]].forEach((b,i)=>townPixelBuilding(c,...b,i+2));
    }
    townPixelProps(c);
  }

  function townPixelLightPools(c){
    const q=townPixelPalette(),kind=town.world.kind,lights=kind==='dome'?[[64,147,18],[172,147,18],[118,123,25],[64,239,15],[171,239,15]]
      :kind==='tunnel'?[[53,126,13],[183,126,13],[53,236,13],[183,236,13]]
      :kind==='research'?[[64,145,16],[172,145,16],[118,121,20]]
      :[[62,148,17],[173,150,17],[66,239,14],[169,239,14]];
    c.save();c.globalCompositeOperation='screen';
    for(const [x,y,r] of lights){
      c.fillStyle=kind==='research'?'rgba(91,194,186,.055)':'rgba(239,174,83,.055)';c.fillRect(P(x-r),P(y-r/2),P(r*2),P(r));
      c.fillStyle=kind==='research'?'rgba(91,194,186,.09)':'rgba(239,174,83,.09)';c.fillRect(P(x-r*.55),P(y-r*.28),P(r*1.1),P(r*.56));
      c.fillStyle=mix(q.window,'#ffffff',.15);c.fillRect(P(x-1),P(y-1),2,2);
    }
    c.restore();
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
    const entry=townPoint(town.layout.entry||{x:50,y:90}),x=P(entry.x-25),y=TOWN_H-43,q=townPixelPalette();
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
  function townPixelLayered(c){
    const rows=town.facilities.map((facility,index)=>({y:facility.p.y+19,index,draw:()=>townPixelFacility(c,facility)}));
    town.crowd.forEach((person,index)=>{
      const x=tclamp(person.x+Math.sin(townT*person.speed+person.phase)*person.lane,16,TOWN_W-16),y=tclamp(person.y+Math.cos(townT*person.speed*.7+person.phase)*4,108,TOWN_H-15);
      rows.push({y:y+12,index:20+index,draw:()=>townPixelPerson(c,x,y,person.color,index,'crowd')});
    });
    town.residents.forEach((npc,index)=>rows.push({y:npc.p.y+17,index:50+index,draw:()=>townPixelPerson(c,npc.p.x,npc.p.y,townColor(npc.id),npc.id.length,'resident',npc.id)}));
    if(town.recruit)rows.push({y:town.recruit.p.y+17,index:70,draw:()=>townPixelPerson(c,town.recruit.p.x,town.recruit.p.y,townColor(town.recruit.id),4,'recruit',town.recruit.id)});
    townCompanionEntities().forEach((comp,index)=>rows.push({y:comp.p.y+17,index:80+index,draw:()=>townPixelPerson(c,comp.p.x,comp.p.y,townColor(comp.id),10+index,'companion',comp.id)}));
    rows.push({y:town.player.y+17,index:90,draw:()=>townPixelPerson(c,town.player.x,town.player.y,'#3f4b47',1,'player','player')});
    rows.push({y:TOWN_H-8,index:100,draw:()=>townPixelVan(c)});
    rows.sort((a,b)=>a.y-b.y||a.index-b.index).forEach(row=>row.draw());
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
    const c=town.c;c.clearRect(0,0,TOWN_W,TOWN_H);townPixelBackdrop(c);townPixelLightPools(c);townPixelLayered(c);townPixelWeather(c);
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
