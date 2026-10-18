// Independent renderer fixture. No localStorage, sessionStorage or game iframe.
const read=async p=>{const r=await fetch(new URL('../'+p,import.meta.url));if(!r.ok)throw Error(p+': '+r.status);return r.text();};
const asset=p=>new URL('../'+p,import.meta.url).href;
const $=id=>document.getElementById(id);
const connected=JSON.parse(await read('assets/ui/road-environment/connected-v1.json'));
const atlas=JSON.parse(await read('assets/ui/road-environment/atlas-v2.json'));
const kit=JSON.parse(await read('assets/ui/vehicle-upgrades/manifest-v1.json'));
const registry={enabled:true,routes:[],connected:{...connected,source:asset(connected.file)},
 atlas:{cities:atlas.cities,routes:atlas.routes.map(r=>({...r,source:asset(r.file)}))}};
const continuity=(await read('src/05e-road-continuity.js')).replace('/*__ROAD_CONTINUITY__*/{enabled:false,routes:[]}',JSON.stringify(registry))
 .replace('return {active,draw,key,position,connector,ridges,connectedPosition,direction};',
 'return {active,draw,key,position,connector,ridges,connectedPosition,direction,fixtureReady:s=>connectedPosition({...s,W:360})?!!sharedTerrain:s.driving?worlds.has(key(s.driving.from,s.driving.to)):true};');
const vehicle=(await read('src/05b-vehicle-kit.js')).replace('/*__VEHICLE_KIT__*/{}',JSON.stringify(Object.fromEntries(Object.entries(kit.images).map(([k,v])=>[k,asset(v)]))));
const scene=(await read('src/05-scene.js')).replaceAll('__UI_JOURNEY_DALGUJI_BASE__',asset('assets/ui/journey-dalguji-base-v1.webp')).replaceAll('__TOWN_WORLD_SPRITE_ATLAS__',asset('assets/ui/settlement/town-world-sprite-atlas-v4.webp'));
const data=await read('src/03-data.js');
const fixture=new Function(`${data}
 let S=null,paused=true; const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const G={isNight:()=>S.min<300||S.min>=1200,regionOf:()=> 'south',
  roadCueImages:{cyclist:${JSON.stringify(asset('assets/road-cues/cue-cyclist.png'))}}};
 const UI={modalOpen:()=>paused};
 ${continuity}
 const ROAD_ENVIRONMENT={draw:(ctx,sky,frame)=>ROAD_CONTINUITY.draw(ctx,frame),source:()=>''};
 ${vehicle}
 ${scene}
 return {scene:SCENE,road:ROAD_CONTINUITY,names:Object.fromEntries(Object.entries(D.nodes).map(([id,n])=>[id,n.name])),
 set:s=>S=s,pause:v=>paused=v};`)();
let state={min:720,wx:'clear',at:'busan',driving:null,up:{},party:[],dog:false,comps:{},fatigue:0,van:82,flags:{},stats:{km:0}};
let running=false,lastTime=0;
const legs=[['busan','yangsan',20],['yangsan','miryang',34],['miryang','yangsan',34],['yangsan','busan',20]];
for(const r of atlas.routes)for(const [from,to] of [[r.from,r.to],[r.to,r.from]]){
 if(!legs.some(l=>l[0]===from&&l[1]===to))legs.push([from,to,r.km]);
}
$('leg').replaceChildren(...legs.map(([from,to],i)=>new Option(fixture.names[from]+' → '+fixture.names[to],String(i))));
const setLeg=()=>{const [from,to,dist]=legs[Number($('leg').value)];state.at=null;state.driving={from,to,dist,gone:dist*Number($('progress').value)/100,road:'high'};};
const position=()=>fixture.road.connectedPosition({at:state.at,driving:state.driving,W:360})||
 (state.driving?{progress:state.driving.gone/state.driving.dist}:null);
function status(){fixture.set(state);fixture.pause(!running);$('road').dataset.atlasReady='false';$('status').textContent=JSON.stringify({at:state.at,driving:state.driving,sourceX:position()?.sourceX,hour:state.min/60,weather:state.wx,playing:running},null,2);}
function compare(){
 const states=[{at:'yangsan'},...[[0,20],[1,0],[2,34],[3,0]].map(([i,gone])=>{const [from,to,dist]=legs[i];return {driving:{from,to,dist,gone}};})];
 const values=states.map(s=>fixture.road.connectedPosition({...s,W:360}).sourceX);
 $('checks').textContent='양산 도착/정차/출발/왕복 좌표: '+JSON.stringify(values)+'\n모두 동일: '+values.every(x=>x===540);
}
$('leg').onchange=()=>{setLeg();status();};$('progress').oninput=()=>{setLeg();status();};
$('play').onclick=()=>{if(!state.driving)setLeg();running=true;status();};
$('pause').onclick=()=>{running=false;status();};
$('arrive').onclick=()=>{if(state.driving){state.lastJourneyRecap={from:state.driving.from,to:state.driving.to};state.at=state.driving.to;state.driving=null;}running=false;status();};
$('depart').onclick=()=>{
 const at=state.at||state.driving?.to,previous=state.lastJourneyRecap?.from||state.driving?.from;
 let next=legs.findIndex(([from,to])=>from===at&&to!==previous);
 if(next<0)next=legs.findIndex(([from])=>from===at);
 if(next<0)return;
 $('leg').value=String(next);$('progress').value=0;setLeg();running=true;status();
};
$('encounter').onclick=()=>{if(state.driving){state.driving.approach={startedAt:Date.now(),duration:2700,kind:'people',scene:{motif:'postman'}};running=true;status();}};
$('resume').onclick=()=>{if(state.driving)delete state.driving.approach;running=true;status();};
$('reload').onclick=()=>{const before=position();state=JSON.parse(JSON.stringify(state));status();$('checks').textContent='JSON 재개 전후 좌표 동일: '+(JSON.stringify(before)===JSON.stringify(position()));};
$('hour').onchange=()=>{state.min=Number($('hour').value)*60;status();};$('weather').onchange=()=>{state.wx=$('weather').value;status();};
$('width').onchange=()=>{const w=Number($('width').value);$('road').style.width=w+'px';$('road').style.height=w*344/360+'px';};
$('upgrade').onchange=()=>{state.up=$('upgrade').checked?{bench:true,cabin:true,bunk:true,solar:true,curtain:true}:{};status();};
fixture.scene.init($('road'));status();compare();
function tick(t){const dt=Math.min(.05,(t-lastTime)/1000||0);lastTime=t;
 if(running&&state.driving&&!state.driving.approach){state.driving.gone=Math.min(state.driving.dist,state.driving.gone+dt*.65);$('progress').value=state.driving.gone/state.driving.dist*100;}
 fixture.scene.draw(dt);$('road').dataset.atlasReady=String(fixture.road.fixtureReady(state));requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
window.addEventListener('error',e=>{$('checks').textContent='ERROR: '+e.message;});
