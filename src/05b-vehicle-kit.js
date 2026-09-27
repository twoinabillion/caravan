/* High-detail live vehicle kit. Pure drawing/layout: never changes a save.
   Artwork is split by engineering mount, not a screenshot of one build. */
const VEHICLE_KIT=(()=>{
  const sources=/*__VEHICLE_KIT__*/{};
  const images={};
  for(const [id,src] of Object.entries(sources)){const im=new Image();im.src=src;images[id]=im;}
  const ready=id=>!!(images[id]?.complete&&images[id].naturalWidth);
  const parts={
    tank1:['equipment',0],tank2:['equipment',1],susp:['equipment',2],armor:['equipment',3],
    garden:['equipment',4],collector:['equipment',5],solar:['equipment',6],antenna:['equipment',7],
    winch:['equipment',8],bullbar:['equipment',9],snorkel:['equipment',10],mudtires:['equipment',11],
    lightbar:['living',0],awning:['living',1],stove:['living',2],sidebox:['living',3],
    beehive:['living',4],garden2:['living',5],kitchen:['living',6],fridge:['living',7],
    armory:['living',8],scope:['living',9],horn:['living',10],curtain:['living',11]
  };
  // Measured source rectangles, including the actual glass, after delivery export.
  const bodies={
    bench:{rect:[40,17,438,226],glass:[[120,78,72,43],[229,78,84,43],[365,83,35,40]]},
    cabin:{rect:[40,28,441,192],glass:[[112,67,62,42],[205,68,66,42],[303,68,66,42],[405,67,28,43]]},
    bunk:{rect:[52,27,407,198],glass:[[121,91,61,40],[207,92,69,40],[303,91,51,40],[388,91,30,36]],upper:[[186,45,54,8],[287,45,54,8]]},
    jumpseat:{rect:[41,26,437,197],glass:[[134,93,59,38],[220,93,55,38],[304,93,59,38],[398,96,24,32]],upper:[[177,42,49,11],[334,42,52,11]]}
  };
  const partBounds={"tank1":[7,35,109,58],"tank2":[149,21,103,85],"susp":[260,29,119,60],"armor":[17,164,97,61],"garden":[136,172,113,53],"collector":[287,150,59,87],"solar":[12,296,112,68],"antenna":[132,276,96,89],"winch":[260,294,119,73],"bullbar":[37,393,86,102],"snorkel":[171,401,44,84],"mudtires":[275,403,87,86],"lightbar":[6,51,110,35],"awning":[134,49,118,33],"stove":[260,19,94,88],"sidebox":[12,173,111,43],"beehive":[158,153,77,84],"garden2":[263,163,116,65],"kitchen":[13,279,105,72],"fridge":[150,291,79,57],"armory":[262,293,117,73],"scope":[35,405,67,82],"horn":[136,418,113,50],"curtain":[267,404,111,84]};
  function part(c,id,x,y,w,h,angle=0){
    const p=parts[id],im=p&&images[p[0]];if(!im||!ready(p[0]))return false;
    const r=partBounds[id],s=Math.min(w/r[2],h/r[3]),dw=r[2]*s,dh=r[3]*s;
    c.save();c.translate(x+w/2,y+h/2);if(angle)c.rotate(angle);
    c.drawImage(im,r[0]*im.naturalWidth/384,r[1]*im.naturalHeight/512,r[2]*im.naturalWidth/384,r[3]*im.naturalHeight/512,-dw/2,h/2-dh,dw,dh);c.restore();return true;
  }
  function layout(up,build){
    const roof=['garden','collector','solar','antenna','beehive','scope'].filter(id=>up[id]||(id==='garden'&&up.garden2));
    // Three legal bays. Legacy over-cap saves retain every item in two depth rows.
    const span=build.bodyL-29,bay=span/Math.min(3,Math.max(1,roof.length));
    return {stage:build.id,roof:roof.map((id,i)=>({id:id==='garden'&&up.garden2?'garden2':id,
      x:6+(i%3)*bay,y:Math.floor(i/3)*5,w:bay-1,row:Math.floor(i/3)}))};
  }
  function draw(c,o){
    const {up,build,base,vx,cabX,vy,bodyL,bodyH,dark,speed,spin,time}=o;
    if(!base.complete||!base.naturalWidth||!ready('equipment')||!ready('living'))return null;
    const body=bodies[build.id];if(body&&!ready(build.id))return null;
    const sw=base.naturalWidth,sh=base.naturalHeight,scaleX=sw/1024,scaleY=sh/601;
    const original=(r,x,y,w,h)=>c.drawImage(base,r[0]*scaleX,r[1]*scaleY,r[2]*scaleX,r[3]*scaleY,x,y,w,h);
    const rear=vx+bodyL*.372,front=cabX+9,roofY=vy-bodyH;
    let glass,upper=[];
    c.save();c.imageSmoothingEnabled=true;c.filter=`brightness(${1-dark*.48})`;
    // Axle/wheel proportions remain fixed when the living box gets longer.
    original([355,466,354,71],vx,vy+3,bodyL,7);
    if(body){
      c.drawImage(images[build.id],...body.rect,vx,roofY,bodyL,bodyH+4);
      const [rx,ry,rw,rh]=body.rect;
      const project=r=>({source:r,image:images[build.id],x:vx+(r[0]-rx)/rw*bodyL,
        y:roofY+(r[1]-ry)/rh*(bodyH+4),w:r[2]/rw*bodyL,h:r[3]/rh*(bodyH+4)});
      glass=body.glass.map(project);
      upper=(body.upper||[]).map(project);
    }else{
      original([0,124,714,342],vx,roofY,bodyL,bodyH+4);
      glass=[[164,200,99,73],[334,200,124,73],[527,205,53,66]].map(r=>({
        image:base,source:[r[0]*scaleX,r[1]*scaleY,r[2]*scaleX,r[3]*scaleY],
        x:vx+r[0]/714*bodyL,y:roofY+(r[1]-124)/342*(bodyH+4),w:r[2]/714*bodyL,h:r[3]/342*(bodyH+4)}));
    }
    original([714,0,310,427],cabX,vy-43,27,38);
    original([714,427,310,174],cabX,vy-5,27,17);
    // Fixed visual identity travels with every body: canvas bags + two red cans.
    original([112,20,581,107],cabX-23,roofY-7,22,7);
    const mounts=layout(up,build);
    for(const m of mounts.roof){
      const high=m.id==='antenna'?21:m.id==='scope'?13:m.id==='collector'?12:10;
      part(c,m.id,vx+m.x,roofY-high-m.y,m.w,high);
    }
    if(up.stove){
      part(c,'stove',vx-1,roofY-12,6,13);
      if(speed<.05)for(let i=0;i<3;i++){
        const rise=(time*4+i*3.2)%8;c.fillStyle=`rgba(210,210,205,${.25*(1-rise/8)})`;
        c.fillRect(vx+2+Math.sin(time*2+i),roofY-13-rise,1,1);
      }
    }
    if(up.armor){
      for(let x=vx+5;x<cabX-8;x+=12)part(c,'armor',x,vy-9,12,12);
      part(c,'armor',cabX+1,vy-6,9,8);
    }
    if(up.susp)part(c,'susp',rear-12,vy-2,24,10);
    if(up.tank1)part(c,'tank1',cabX-18,vy-4,14,12);
    if(up.tank2)part(c,'tank2',vx-5,vy-10,9,16);
    if(up.sidebox)part(c,'sidebox',vx+3,vy-5,13,10);
    if(up.lightbar){
      part(c,'lightbar',cabX+1,vy-32,13,9);
      if(dark>.3){c.fillStyle='rgba(255,235,170,.6)';c.fillRect(cabX+4,vy-28,8,.6);}
    }
    if(up.horn)part(c,'horn',cabX+14,vy-32,10,9);
    if(up.snorkel)part(c,'snorkel',cabX+20,vy-33,6,24);
    if(up.bullbar)part(c,'bullbar',cabX+23,vy-15,10,20);
    if(up.winch)part(c,'winch',cabX+25,vy-4,9,9);
    if(up.awning){
      part(c,'awning',vx+8,roofY+5,bodyL-22,5);
      // The roll stays mechanically attached; a short canvas shade opens only parked.
      if(speed<=0){
        const shade=c.createLinearGradient(0,roofY+6,0,roofY+13);
        shade.addColorStop(0,'#8a8063');shade.addColorStop(.75,'#645f4b');shade.addColorStop(1,'#48483b');
        c.fillStyle=shade;c.beginPath();c.moveTo(vx+9,roofY+6);c.lineTo(vx+29,roofY+6);
        c.lineTo(vx+9,roofY+13);c.lineTo(vx-13,roofY+13);c.closePath();c.fill();
        c.strokeStyle='#aea184';c.lineWidth=.35;
        for(let i=0;i<4;i++){c.beginPath();c.moveTo(vx+10+i*6,roofY+6);c.lineTo(vx-12+i*6,roofY+12.5);c.stroke();}
        c.strokeStyle='#635d47';c.lineWidth=.7;c.beginPath();c.moveTo(vx-12,roofY+13);c.lineTo(vx-12,vy+10);c.stroke();
      }
    }
    for(const x of [rear,front]){
      if(up.mudtires)part(c,'mudtires',x-8,vy-3,16,16,spin);
      else if(x===rear)original([184,443,180,158],x-7.8,vy-3,15.6,15.6);
    }
    c.filter='none';
    const closed=up.curtain&&dark>.35&&speed<=0;
    for(const g of upper){
      if(closed){c.fillStyle='#39382d';c.fillRect(g.x,g.y,g.w,g.h);}
      else if(dark>.2)c.drawImage(g.image,...g.source,g.x,g.y,g.w,g.h);
    }
    glass.forEach((g,i)=>{
      if(dark>.2)c.drawImage(g.image,...g.source,g.x,g.y,g.w,g.h);
      c.save();c.beginPath();c.rect(g.x,g.y,g.w,g.h);c.clip();
      if(closed){c.fillStyle='#39382d';c.fillRect(g.x,g.y,g.w,g.h);part(c,'curtain',g.x,g.y,g.w,g.h);}
      else{
        if(up.curtain){part(c,'curtain',g.x,g.y,1.3,g.h);part(c,'curtain',g.x+g.w-1.3,g.y,1.3,g.h);}
        if(i===0&&up.armory)part(c,'armory',g.x,g.y+g.h*.55,g.w,g.h*.5);
        if(i===1&&up.fridge)part(c,'fridge',g.x+g.w*.58,g.y+g.h*.5,g.w*.4,g.h*.5);
        if(i===2&&up.kitchen)part(c,'kitchen',g.x,g.y+g.h*.6,g.w,g.h*.4);
      }
      c.restore();
    });
    c.restore();return {glass,closed,mounts};
  }
  return {draw,layout,parts,bodies};
})();
