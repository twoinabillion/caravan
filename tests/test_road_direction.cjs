/* Executed scene-layer transforms, not a claim of visual or device QA. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=n=>fs.readFileSync(require.resolve('../src/'+n),'utf8');
const {routes}=require('../tools/road-route-plan.cjs').catalogue();
const connected=require('../assets/ui/road-environment/connected-v1.json');
const registry={enabled:true,routes,connected:{...connected,source:''}};
const source=read('05e-road-continuity.js').replace('/*__ROAD_CONTINUITY__*/{enabled:false,routes:[]}',JSON.stringify(registry));
const road=vm.runInNewContext(source+';ROAD_CONTINUITY',{Image:class{},document:{}});
test('all 156 travel directions agree with terrain camera motion and survive arrival/reload',()=>{
 for(const r of routes)for(const reverse of [false,true]){
  const leg={from:reverse?r.to:r.from,to:reverse?r.from:r.to,dist:r.km,gone:0};
  const before=JSON.stringify(leg),state={driving:leg,at:null};
  const position=gone=>road.connectedPosition({driving:{...leg,gone},W:236})||road.position({...leg,gone},r,236);
  const a=position(0).camera,b=position(r.km).camera;
  assert.equal(road.direction(state),Math.sign(b-a),r.id+' foreground/camera direction');
  const stopped={at:leg.to,driving:null,lastJourneyRecap:{from:leg.from,to:leg.to}};
  assert.equal(road.direction(stopped),road.direction(state));
  assert.equal(road.direction(JSON.parse(JSON.stringify(stopped))),road.direction(state));
  stopped.selectedDestination=leg.from;assert.equal(road.direction(stopped),road.direction(state));
  assert.equal(JSON.stringify(leg),before);
 }
 assert.equal(road.direction(null),1);
 assert.equal(road.direction({at:'busan'}),1);
 assert.equal(road.direction({at:'busan',lastJourneyRecap:{from:'miryang',to:'yangsan'}}),1);
 assert.equal(road.direction({driving:{from:'unknown',to:'busan'}}),1);
});
function sceneRuntime(){
 let matrix=1,now=10000,paused=false;const stack=[],samples=[];
 const cx=new Proxy({save(){stack.push(matrix);},restore(){assert(stack.length);matrix=stack.pop();},
  scale(x){matrix*=x;},setTransform(){matrix=1;},
  createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},
  {get:(o,k)=>k in o?o[k]:(...args)=>{for(const n of args)if(typeof n==='number')assert(Number.isFinite(n));}});
 const canvas=()=>({width:0,height:0,clientWidth:360,clientHeight:344,getContext:()=>cx});
 const S={at:null,min:720,wx:'clear',up:{},flags:{},party:[],dog:false,fatigue:0,driving:null};
 const context=vm.createContext({S,Date:{now:()=>now},Math,console,ROAD_CONTINUITY:road,
  ROAD_ENVIRONMENT:{draw(){samples.push({layer:'terrain',matrix});}},
  UI:{modalOpen:()=>paused},G:{isNight:()=>false,regionOf:()=>0},
  Image:class{constructor(){this.complete=false;this.naturalWidth=0;}},
  ResizeObserver:class{observe(){}},window:{devicePixelRatio:2},document:{createElement:canvas},
  clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),
  capture:(layer,x,speed)=>samples.push({layer,matrix,x,speed})});
 let scene=read('05-scene.js');
 for(const [signature,call] of [
  ['function road(dark,wx){',"capture('road',worldX);"],
  ['function van(roadY,speed,dark,wx,upOverride,displayScale=1){',"capture('van',worldX,speed);"],
  ['function roadApproachScene(roadY,dark){',"capture('cue',worldX);"],
  ['function drawPuffs(dt){',"capture('smoke',worldX);"],
  ['function weather(wx,dark,speed,dt){',"capture('weather',worldX,speed);"]]){
   assert(scene.includes(signature),signature);scene=scene.replace(signature,signature+call);
 }
 vm.runInContext(read('03-data.js')+'\n'+scene+';globalThis.scene=SCENE;',context);
 context.scene.init(canvas());
 return {S,samples,draw(dt=1/60){samples.length=0;context.scene.draw(dt);assert.equal(stack.length,0);return samples;},
  time:n=>now=n,pause:v=>paused=v};
}
test('real SCENE turns only near road, vehicle, cues and smoke; sky/terrain/weather stay unmirrored',()=>{
 const rt=sceneRuntime();
 for(const [from,to,sign] of [['busan','yangsan',1],['yangsan','busan',-1]]){
  rt.S.driving={from,to,dist:20,gone:5};
  const first=rt.draw().find(x=>x.layer==='road').x;
  const samples=rt.draw(),second=samples.find(x=>x.layer==='road').x;
  assert.equal(Math.sign(-(second-first)*sign),-sign,'near road moves opposite travel');
  for(const layer of ['road','van','cue','smoke'])assert.equal(samples.find(x=>x.layer===layer).matrix,sign,layer);
  for(const layer of ['terrain','weather'])assert.equal(samples.find(x=>x.layer===layer).matrix,1,layer);
  rt.S.lastJourneyRecap={from,to};rt.S.at=to;rt.S.driving=null;
  assert.equal(rt.draw().find(x=>x.layer==='van').matrix,sign);
 }
});
test('reverse discovery/braking/stop/modal/resume retains direction and continuous speed without save writes',()=>{
 const rt=sceneRuntime();rt.S.driving={from:'miryang',to:'yangsan',dist:34,gone:13,
  approach:{startedAt:10000,duration:2700,kind:'people',scene:{motif:'postman'}}};
 const saved=JSON.stringify(rt.S);let previous=1,speed=1;
 for(let ms=0;ms<=3000;ms+=16){
  rt.time(10000+ms);const van=rt.draw().find(x=>x.layer==='van');speed=van.speed;
  assert.equal(van.matrix,-1);assert(speed<=previous&&speed>=0);assert(previous-speed<.025);previous=speed;
 }
 assert.equal(speed,0);assert.equal(JSON.stringify(rt.S),saved);
 delete rt.S.driving.approach;rt.pause(true);assert.equal(rt.draw().find(x=>x.layer==='van').speed,0);
 rt.pause(false);assert.equal(rt.draw().find(x=>x.layer==='van').speed,1);
});
