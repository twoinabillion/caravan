'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

// Observe real vehicle drawing geometry after its canvas transforms. The lamp
// reference is measured on the existing HD cab image, not copied from the cone.
function fixture(decoded=true){
 const contexts=[];
 function canvas(){
  const paths=[],rects=[],images=[],stack=[];let path=[],m=[2,0,0,2,0,0];
  const point=(x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
  const c=new Proxy({fillStyle:'',globalAlpha:1,
   save(){stack.push({m:[...m],fillStyle:this.fillStyle,globalAlpha:this.globalAlpha});},
   restore(){const s=stack.pop();assert(s);m=s.m;this.fillStyle=s.fillStyle;this.globalAlpha=s.globalAlpha;},
   setTransform(...v){m=v;},translate(x,y){m[4]+=m[0]*x+m[2]*y;m[5]+=m[1]*x+m[3]*y;},scale(x,y){m[0]*=x;m[1]*=x;m[2]*=y;m[3]*=y;},
   rotate(a){const [x,y,z,w]=m,co=Math.cos(a),si=Math.sin(a);m[0]=x*co+z*si;m[1]=y*co+w*si;m[2]=z*co-x*si;m[3]=w*co-y*si;},
   beginPath(){path=[];},moveTo(x,y){path.push(point(x,y));},lineTo(x,y){path.push(point(x,y));},
   fill(){paths.push({style:this.fillStyle,points:path.slice()});},
   fillRect(x,y,w,h){rects.push({style:this.fillStyle,alpha:this.globalAlpha,points:[point(x,y),point(x+w,y+h)]});},
   drawImage(...args){images.push({args,m:[...m]});},
   createLinearGradient(...coords){return {coords,stops:[],addColorStop(at,color){this.stops.push([at,color]);}};},
   createRadialGradient(){return {addColorStop(){}};},measureText:t=>({width:t.length*5})
  },{get:(o,k)=>k in o?o[k]:()=>{}});
  const cv={clientWidth:390,clientHeight:260,width:0,height:0,getContext:()=>c};contexts.push({c,paths,rects,images});return cv;
 }
 const S={at:'gyeongju',min:1320,day:3,wx:'clear',party:[],up:{},fatigue:0,dog:false,flags:{},driving:null};
 const context=vm.createContext({console,Date,Math,S,Image:class{constructor(){this.complete=decoded;this.naturalWidth=decoded?1024:0;this.naturalHeight=decoded?601:0;}},
  document:{createElement:canvas},window:{devicePixelRatio:2},ResizeObserver:class{observe(){}},
  G:{isNight:()=>true},UI:{modalOpen:()=>false},clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});
 vm.runInContext(fs.readFileSync('src/03-data.js','utf8'),context);
 const manifest=JSON.parse(fs.readFileSync('assets/ui/vehicle-upgrades/manifest-v1.json','utf8'));
 vm.runInContext(fs.readFileSync('src/05b-vehicle-kit.js','utf8').replace('/*__VEHICLE_KIT__*/{}',JSON.stringify(manifest.images)),context);
 const source=fs.readFileSync('src/05-scene.js','utf8').replace('return {init,initTitle,draw,drawTitle,drawSettlementVan','return {van,init,initTitle,draw,drawTitle,drawSettlementVan');
 vm.runInContext(source+';globalThis.scene=SCENE;globalThis.data=D',context);context.scene.init(canvas());
 return {S,scene:context.scene,stages:context.data.vanStages,draw(facing,scale=1,speed=0){
  const f=contexts[1];f.paths.length=f.rects.length=f.images.length=0;f.c.setTransform(2,0,0,2,0,0);
  if(facing<0){f.c.translate(236,0);f.c.scale(-1,1);}
  const before=JSON.stringify(S);context.scene.van(105,speed,1,S.wx,undefined,scale);assert.equal(JSON.stringify(S),before);
  return f;
 }};
}

for(const decoded of [true,false])test(`${decoded?'HD':'undecoded fallback'} beam starts at its visible front lamp across stages, suspension and facing`,()=>{
 const f=fixture(decoded);
 for(const stage of f.stages)for(const suspension of [false,true])for(const facing of [1,-1]){
  f.S.up={...(stage.up?{[stage.up]:true}:{}),...(suspension?{susp:true}:{})};
  for(const speed of [0,1]){
   f.S.driving=speed?{from:'gyeongju',to:'daegu'}:null;
   const frame=f.draw(facing,speed?1:1.3,speed),beam=frame.paths.find(p=>p.style?.stops?.some(s=>s[1].startsWith('rgba(255,220,150,')));
   const lamp=frame.rects.find(r=>r.style==='#ffe9b0'&&r.alpha===1);assert(beam&&lamp,'actual lamp and cone must be drawn');
   const [a,b]=lamp.points,centerY=(a[1]+b[1])/2,frontX=facing>0?Math.max(a[0],b[0]):Math.min(a[0],b[0]);
   const near=[beam.points[0],beam.points.at(-1)];
   for(const p of near){assert(Math.abs(p[0]-frontX)<.01,'cone starts at the front edge of the lamp');assert(p[1]>=Math.min(a[1],b[1])&&p[1]<=Math.max(a[1],b[1]),'cone starts at lamp height, never at the wheel');}
   assert(Math.abs((near[0][1]+near[1][1])/2-centerY)<.01);
   if(decoded){
    const cab=frame.images.find(r=>r.args[0].src==='__UI_JOURNEY_DALGUJI_BASE__'&&r.args[2]===427&&r.args[4]===174);assert(cab,'the actual lower HD cab crop must be used');
    const [,sx,sy,sw,sh,dx,dy,dw,dh]=cab.args,[ma,mb,mc,md,mx,my]=cab.m;
    const x=dx+(1000-sx)/sw*dw,y=dy+(445-sy)/sh*dh;
    const projected=[ma*x+mc*y+mx,mb*x+md*y+my],scale=Math.hypot(ma,mb);
    assert(Math.abs((a[0]+b[0])/2-projected[0])<=scale,'light core matches the headlamp measured in the HD source');
    assert(Math.abs(centerY-projected[1])<=scale,'light core stays above the wheel on the HD source');
   }
  }
 }
});
