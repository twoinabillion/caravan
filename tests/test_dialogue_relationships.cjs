/* Authored voice/relationship regressions; no browser or user save access. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),
 vm=require('node:vm'),crypto=require('node:crypto');
const {STATIC_CONTENT_FILES,permanentEvents}=require('../tools/content-registry.cjs');
const plain=value=>JSON.parse(JSON.stringify(value));
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const quotes=text=>[...text.matchAll(/["“]([^"”\n]{2,})["”]/g)].map(m=>m[1]);
function setup(){
 const ctx=vm.createContext({console,setTimeout:()=>0,clearTimeout(){}});
 for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 ctx.data=vm.runInContext('D',ctx);return ctx;
}
const event=(D,id)=>permanentEvents(D).find(e=>e.id===id);
test('1039 events retain branches, costs, effects and chains; only callsign recall gains a prerequisite',()=>{
 const {data:D}=setup(),omit=new Set(['text','body','title','label','turnSpeakers','turns','readingRecord','note','missionBrief']);
 const rows=permanentEvents(D).map(e=>{
  const row=JSON.parse(JSON.stringify(e,(k,v)=>omit.has(k)?undefined:v));
  if(e.id==='talkr_es_2')delete row.needFlag;return row;
 }).sort((a,b)=>a.id.localeCompare(b.id));
 // Presentation-only missionBrief excluded against the pre-condensation baseline.
 // Costs, effects, prerequisites and chains remain in the contract.
 assert.equal(rows.length,1039);
 require('../tools/story-review-contract.cjs')(rows);
 assert.equal(hash(rows),'abf633951b873662bf81e42ac1fc75a1e47b0ec6450a11b98371970626543f38');
 assert.equal(event(D,'talkr_es_2').needFlag,'eunsu_callsign_held');
 assert.equal(event(D,'talk_es_02').choices[0].out[0].fx.flag,'eunsu_callsign_held');
});
test('onboarding keeps a compact objective, three leads, optional side missions and the same road exit',()=>{
 const {data:D}=setup(),e=D.onboardingMission,b=e.missionBrief;
 assert.equal(b.objective.replace(/\s+/g,' '),'남산의 강제 이송을 멈춘다');
 assert(!b.why&&!b.promise,'intro exposition is not repeated as two extra sections');
 assert.deepEqual(plain(b.leads).map(row=>row.name),['이송표','검증키','증언']);
 assert(b.leads.every(row=>row.detail.length>3));
 assert.match(b.intent,/사람의 확인 없이는/);
 assert.match(b.optional,/사이드 미션.*내가 돕고 싶을 때/);
 assert.equal(e.choices.length,1);
 assert.equal(e.choices[0].label,'길로 나가기');
 assert.equal(e.choices[0].continueToRoad,true);
 assert.equal(e.choices[0].out[0].fx.flag,'main_mission_started');
 assert.match(e.choices[0].out[0].fx.note.body,/북쪽으로.*남산/);
});
test('brief validation requires a goal, intent, three named leads and optional-mission guidance',()=>{
 const source=fs.readFileSync('tools/validate-content.cjs','utf8');
 const start=source.indexOf('function validateMissionBrief('),end=source.indexOf('\nfunction validateEventBody',start);
 const errors=[];
 const validate=new Function('need','isObject',source.slice(start,end)+';return validateMissionBrief;')(
  (ok,where)=>{if(!ok)errors.push(where)},v=>v!==null&&typeof v==='object'&&!Array.isArray(v));
 const brief=plain(setup().data.onboardingMission.missionBrief);
 assert(validate(brief,'brief'));assert.equal(errors.length,0);
 for(const field of ['objective','intent','optional','leads']){
  const missing={...brief};delete missing[field];assert.equal(validate(missing,'brief'),false);
 }
 for(const field of ['objective','intent','optional'])for(const value of ['',42,null])
  assert.equal(validate({...brief,[field]:value},'brief'),false);
 for(const leads of [null,[],brief.leads.slice(0,2),[...brief.leads,brief.leads[0]],
  [null,...brief.leads.slice(1)],[{name:'표',detail:42},...brief.leads.slice(1)]])
  assert.equal(validate({...brief,leads},'brief'),false);
 assert.equal(validate(null,'brief'),false);
});
test('all 17 NPCs distinguish a first encounter, neutral revisit and actual affinity',()=>{
 const {data:D}=setup();assert.equal(Object.keys(D.npcs).length,17);
 for(const [id,npc] of Object.entries(D.npcs)){
  const first={met:false,att:30},before=JSON.stringify(first);
  assert.equal(D.npcGreeting(id,first),npc.greet0,id);
  assert.equal(JSON.stringify(first),before,'reading a greeting is pure');
  const repeat=D.npcGreeting(id,{met:true,att:0});
  assert(repeat&&repeat!==npc.greet0,id+' must not introduce themselves twice');
  assert.equal(D.npcGreeting(id,{met:true,att:11}),npc.greetGood);
  assert.equal(D.npcGreeting(id,{met:true,att:-11}),npc.greetBad);
  assert.equal(D.npcGreeting(id,{met:true,att:10}),repeat);
  assert.equal(D.npcGreeting(id,{met:true,att:-10}),repeat);
 }
});
function npcHarness(D,S,fame=false){
 const source=fs.readFileSync('src/07-ui.js','utf8');
 const start=source.indexOf('  function talk(nid){'),end=source.indexOf('  // Small-talk uses',start);
 let active=null,saved=null,offroad=null;
 const G={hasPerk:()=>fame,save(){saved=plain(S)},addNote(){},applyFx(){G.save()}};
 const showNpcDialogue=(id,turns,actions)=>{active={html:turns.map(t=>t.text).join(''),actions}};
 const talk=new Function('D','S','G','OFF','talkOff','showNpcDialogue','pick','renderHud',
  'showStl','curStl','curEv','curStory','closeEvent',source.slice(start,end)+';return talk;')(
   D,S,G,{ready:()=>true},(id,greet)=>{offroad=greet},showNpcDialogue,a=>a[0],()=>{},()=>{},D.nodes[D.npcs.geumja.node].stl,null,null,()=>{active=null});
 return {talk,get active(){return active},get saved(){return saved},get offroad(){return offroad}};
}
test('actual NPC entry saves the greeting state, cancel is safe, fame applies only once after reload',()=>{
 const {data:D}=setup();let S={mode:'standard',npcs:{geumja:{met:false,att:0}},flags:{}};
 let h=npcHarness(D,S);h.talk('geumja');
 assert(h.active.html.includes(D.npcs.geumja.greet0));assert(h.saved.npcs.geumja.met);
 h.active.actions.find(b=>b.label==='그만 일어난다').run();assert.equal(h.active,null);
 S=plain(h.saved);h=npcHarness(D,S);h.talk('geumja');
 assert(h.active.html.includes(D.npcRepeatGreetings.geumja));
 h.active.actions.find(b=>b.label==='이런저런 얘기를 나눈다').run();assert.equal(h.saved.npcs.geumja.att,3);
 h.active.actions.find(b=>b.label==='요즘 소문 들은 거 없어요?').run();assert.equal(h.saved.npcs.geumja.att,8);
 assert(h.saved.flags.rumor_geumja);assert.equal(h.active.actions.length,1);
 S={mode:'offroad',npcs:{geumja:{met:false,att:0}},flags:{}};
 h=npcHarness(D,S,true);h.talk('geumja');
 assert.equal(h.offroad,D.npcs.geumja.greet0);assert.equal(h.saved.npcs.geumja.att,15);
 h=npcHarness(D,plain(h.saved),true);h.talk('geumja');
 assert.equal(h.offroad,D.npcs.geumja.greetGood);assert.equal(h.saved.npcs.geumja.att,15);
});
test('expanded chats retain distinct professions, age relationships and repair rather than lecture',()=>{
 const {data:D}=setup(),chat=id=>D.chats.find(c=>c.id===id);
 for(const row of D.chats)for(const [who,text] of row.lines){
  if(who==='parkss')assert.doesNotMatch(text,/민지 씨|레오 씨|의사는 할 일이/);
  if(who==='minji')assert.doesNotMatch(text,/은수 씨|강우 씨/);
 }
 assert.match(chat('daily-kangwoo-jaeyi-gear').lines[0][1],/아저씨.*거예요/);
 assert.equal(chat('daily-kangwoo-jaeyi-gear').lines[1][1],'실어.');
 assert.match(chat('daily-leo-jaeyi-pick').lines[6][1],/지금 달아/);
 assert.match(chat('daily-kangwoo-eunsu-orders').lines.map(x=>x[1]).join('\n'),/부탁이다/);
 assert(D.banter.some(b=>b.who==='parkss'&&/약사가 아니라 팬/.test(b.t)));
});
test('ungated conversations do not invent earlier job offers, clubs, nicknames or expert incompetence',()=>{
 const {data:D}=setup(),out=(id,c=0)=>event(D,id).choices[c].out[0].text;
 assert.doesNotMatch(out('talk_pss_09',1),/또 무급/);
 assert.doesNotMatch(out('talk_jy_02',1),/세 번째|취업 제안/);
 assert.doesNotMatch(event(D,'pair_pss_es_2').text,/정기 모임|클럽/);
 assert.doesNotMatch(out('talk_jy_10')+event(D,'talk_jy_15').text,/키잡이/);
 assert.doesNotMatch(out('pair_kw_leo_2'),/어제 그거|어제.*틀/);
 assert.match(out('talk_es_14'),/접점부터 볼게요/);
 assert.match(out('talk_es_02'),/D는 델타/);
});
test('new exchange roles match every quote, including consecutive replies by the same speaker',()=>{
 const {data:D}=setup();
 for(const id of ['talk_mj_09','talk_pss_09','talk_jy_10','talk_jy_15','pair_mj_leo_1',
  'talkr_mj_1','talk_es_02','talkr_es_2','talk_es_14','parents_mother_truth']){
  const e=event(D,id),script=D.eventTurnScripts[id];
  if(script.text){assert.equal(quotes(e.text).length,script.text.length,id);assert.deepEqual(plain(e.turnSpeakers),plain(script.text))}
  for(const [path,speakers] of Object.entries(script.choices||{})){
   const [c,o]=path.split('.').map(Number),out=e.choices[c].out[o];
   assert.equal(quotes(out.text).length,speakers.length,id+'.'+path);
   assert.deepEqual(plain(out.turnSpeakers),plain(speakers));
  }
 }
 assert.deepEqual(plain(event(D,'talk_es_14').choices[0].out[0].turnSpeakers),['eunsu','me','eunsu','eunsu','eunsu']);
 const mother=event(D,'parents_mother_truth');
 assert.match(mother.text,/나는 아무것도 몰랐잖아/);assert.match(mother.text,/오늘은 이해 못 할/);
 assert.equal(mother.turnSpeakers.length,10);
});
test('all camp chapters/branches preserve choice costs and roles; guest Minji keeps her initial register',()=>{
 const {data:D}=setup();
 const contracts=Object.entries(D.campConversations).map(([cid,c])=>({cid,
  choices:c.choices.map(({id,mins,req,fx})=>({id,mins,req,fx}))}));
 assert.equal(hash(contracts),'5d59af440863f5ab1b81d04d6fa6c0a3f347f4af3ee46a48f90fb8d91063c760');
 for(const [cid,base] of Object.entries(D.campConversations))for(const chapter of [1,2,3]){
  for(const previousChoiceId of base.choices.map(c=>c.id)){
   const data=D.campConversationData({cid,chapter,previousChoiceId});
   assert(data.line);for(const [i,choice] of data.choices.entries()){
    assert.equal(quotes(choice.text).length,choice.speakers.length,`${cid}.${chapter}.${choice.id}`);
    assert.equal(choice.id,base.choices[i].id);assert.equal(choice.mins,base.choices[i].mins);
    assert(choice.home&&choice.road,'a remembered object and next-road echo stay available');
   }
  }
 }
 const guest=D.campConversationData({cid:'minji',voice:'minji-guest-v1'});
 assert.match(guest.line,/아니었죠/);assert.match(guest.choices[0].text,/아니에요/);
 assert.doesNotMatch(D.campConversationData({cid:'minji',chapter:2,previousChoiceId:'listen'}).choices[0].text,/엔진 껐잖아/);
});
test('rewritten camp entry, cancel/reopen, one-time effects, reload and next road echo stay intact',()=>{
 const ctx=setup(),G=ctx.G={},D=ctx.data;
 ctx.S={party:['minji'],day:4,min:1200,campNight:0,campMemories:{},flags:{},comps:{}};
 vm.runInContext(fs.readFileSync('src/04e-engine-world.js','utf8'),ctx);
 const calls=[];Object.assign(G,{campParticipants:()=>ctx.S.party,campContext:()=>'',campTimeLabel:()=> '밤',
  save(){},reqOk:()=>({ok:true}),choiceReq:c=>c.req,bond(){},addNote(){},
  applyFx(fx){calls.push(plain(fx));ctx.S.min+=fx.time;return []}});
 assert(G.prepareCamp('talk','minji').ok);const id=ctx.S.campConversation.id;
 ctx.S.campConversation.active=false;assert(G.prepareCamp('talk','minji').ok);
 assert.equal(ctx.S.campConversation.id,id);assert.equal(calls.length,0);
 assert(G.resolveCampChoice(id,'listen').applied);assert.equal(ctx.S.min,1215);
 const saved=plain(ctx.S);ctx.S=plain(saved);
 assert.equal(G.resolveCampChoice(id,'listen').applied,false);assert.equal(calls.length,1);
 assert.equal(G.resolveCampChoice(id,'sort').ok,false);
 assert.equal(G.campTravelEcho().text,D.campConversations.minji.choices[0].road);
 const drive={};G.prepareCampTravel(drive);assert.equal(drive.campEchoes.length,1);
 assert.equal(G.campTravelEcho(),null,'echo is consumed only when departing');
 ctx.S.campNight++;assert(G.prepareCamp('talk','minji').ok);
 assert.equal(ctx.S.campConversation.chapter,2);assert.equal(ctx.S.campConversation.previousChoiceId,'listen');
});
