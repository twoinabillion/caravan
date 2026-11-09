'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const manifest=JSON.parse(fs.readFileSync('assets/road-cues/manifest-v2.json'));
function kit(){const c={G:{}};vm.runInNewContext(fs.readFileSync('src/05c-road-cue-kit.js','utf8').replace('__ROAD_KIT_MANIFEST__',JSON.stringify(manifest)),c);return c.G.roadCueKit;}
const profile={eventKey:'meet_postman',duration:5200,scene:{motif:'postman',people:1}};
test('postman pose has readable discovery, greeting, stopped steps and settled finish without state writes',()=>{
 const k=kit(),before=JSON.stringify(profile);
 assert.equal(k.actorPose(profile,.2).phase,'noticed');
 assert.equal(k.actorPose(profile,2).phase,'greet');
 assert.equal(k.actorPose(profile,4.55).phase,'approach');
 assert.equal(k.actorPose(profile,6).phase,'settled');
 assert.equal(JSON.stringify(profile),before);
 assert.equal(JSON.stringify(k.actorPose(profile,2)),JSON.stringify(k.actorPose(profile,2)));
 assert.equal(k.actorPose(profile,4).offset,0,'actor cannot walk before the caravan settles');
 assert(k.actorPose(profile,4.9).offset<0,'person approaches the van, bicycle stays behind');
 assert.equal(k.actorPose(profile,6).stride,0,'settled feet stop moving');
});
test('reduced motion and non-authored actors remain still; malformed clock is bounded',()=>{
 const k=kit();assert.equal(k.actorPose({eventKey:'meet_smith'},1),null);
 const reduced=k.actorPose(profile,4.8,true);assert.equal(reduced.stride,0);assert.equal(reduced.arm,0);
 for(const time of [NaN,Infinity,-10,0,100])for(const value of Object.values(k.actorPose(profile,time)))
  if(typeof value==='number')assert(Number.isFinite(value));
});
test('canonical cutout articulation restores canvas state and never writes the sprite or layer',()=>{
 const k=kit(),image={naturalWidth:184,naturalHeight:384,complete:true},layer={x:10,y:-38,width:18.4,height:38.4};
 const calls=[],c=new Proxy({depth:0,save(){this.depth++;},restore(){this.depth--;},drawImage(...a){calls.push(a);}}, {get(o,key){return key in o?o[key]:(()=>{});}});
 const before=JSON.stringify(layer);assert.equal(k.drawActor(c,image,layer,k.actorPose(profile,4.8)),true);
 assert(calls.length>=5,'articulated arm/torso/legs, not a whole-image sway');assert.equal(c.depth,0);assert.equal(JSON.stringify(layer),before);
 assert.equal(k.drawActor(c,{naturalWidth:0},layer,k.actorPose(profile,1)),false);
});
test('cinematic reader opt-in is explicit, excludes combat and does not change event data',()=>{
 const src=fs.readFileSync('src/07-ui.js','utf8'),at=src.indexOf('  function storyReaderSkin(');assert(at>=0,'reader skin selector');
 const end=src.indexOf('\n  function ',at+4),env=vm.createContext({});vm.runInContext(src.slice(at,end),env);
 for(const ev of [{id:'meet_postman'},{id:'postman_again'},{id:'meet_scrapyard'},{id:'rq_minji_request'},{id:'camp_1_minji',campConversation:true}]){
  const before=JSON.stringify(ev);assert.equal(env.storyReaderSkin(ev),'cinematic');assert.equal(JSON.stringify(ev),before);
 }
 for(const ev of [{id:'meet_postman',combat:true},{id:'camp_1_minji'},{id:'camp_1_eunsu',campConversation:true},{id:'seoul_core'},{id:'meet_smith'}])assert.equal(env.storyReaderSkin(ev),'materials');
});
test('home light is backdrop-owned and never invents a companion keepsake',()=>{
 const env=vm.createContext({});vm.runInContext(fs.readFileSync('src/07g-ui-home.js','utf8')+'\nglobalThis.home=HOME;',env);
 const s={scene:'room.webp',party:[],up:{},keepsakes:{minji:{name:'자석 접시'}},memories:{}};
 const before=JSON.stringify(s);assert(env.home.html(s).includes('home-lantern-glow'));assert(!env.home.html(s).includes('data-home-prop="companion:minji"'));
 s.party=['minji'];assert(env.home.html(s).includes('data-home-prop="companion:minji"'));s.party=[];
 assert.equal(JSON.stringify(s),before);s.scene=null;assert(!env.home.html(s).includes('home-lantern-glow'));
});
test('bicycle cue respects mute, suspension and known cue names',()=>{
 const src=fs.readFileSync('src/07e-ui-audio.js','utf8'),at=src.indexOf('  function sceneCue(');assert(at>=0,'scene cue');
 const end=src.indexOf('\n  function ',at+4),calls=[],env=vm.createContext({on:false,suspended:false,ac:{state:'running'},tone:(...v)=>calls.push(v)});
 vm.runInContext(src.slice(at,end),env);env.sceneCue('bicycle-bell');assert.equal(calls.length,0);
 env.on=true;env.suspended=true;env.sceneCue('bicycle-bell');assert.equal(calls.length,0);
 env.suspended=false;env.sceneCue('unknown');assert.equal(calls.length,0);env.sceneCue('bicycle-bell');assert.equal(calls.length,2);
 assert(calls.every(v=>v[4]<=.08),'restrained effect gain before effects bus mix');
});
test('postman result names the actual earned note without changing saved chips or reader rows',()=>{
 const src=fs.readFileSync('src/07-ui.js','utf8'),at=src.indexOf('  function storyResultPageTurns('),end=src.indexOf('\n  function ',at+4);
 const env=vm.createContext({StoryPages:{slice:(s,o)=>s.slice(o)},storyElapsedChip:()=>false,stripTags:s=>s,storyResourceChange:()=>null,storyFeedbackChip:x=>x});
 vm.runInContext(src.slice(at,end),env);
 const state={eventId:'meet_postman',readingPage:{cursor:{turn:0,offset:0}},turns:[{kind:'narration',text:'답례로 어느 고개의 지름길을 알려줬다.'}],resultChips:[{t:'새 소문 · 우편부의 지름길',c:'item'}]};
 const before=JSON.stringify(state),rows=env.storyResultPageTurns(state);
 assert(rows.at(-1).text.includes('우편부의 지름길'));assert.equal(JSON.stringify(state),before);
 state.eventId='meet_smith';assert(!env.storyResultPageTurns(state).at(-1).text.includes('우편부의 지름길'));
});
