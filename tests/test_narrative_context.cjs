/* Run: node --test tests/test_narrative_context.cjs. Never touches a browser/save. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),
 vm=require('node:vm'),crypto=require('node:crypto');
const {STATIC_CONTENT_FILES,permanentEvents}=require('../tools/content-registry.cjs');
const source=name=>fs.readFileSync('src/'+name,'utf8');
function setup(){
 const ctx=vm.createContext({console,clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),setTimeout:()=>0,clearTimeout(){}});
 for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 ctx.data=vm.runInContext('D',ctx);
 ctx.S={party:[],dog:false,recruitQ:null,day:2,min:114.958,flags:{},water:16,fatigue:80,
  at:null,driving:{from:'gimcheon',to:'muju',gone:25.057695,dist:38},ended:false};
 ctx.G={};return ctx;
}
const ids=["crisis_drowsy","crisis_collapse","crisis_collapse2","crisis_breakdown","crisis_breakdown2","crisis_nofuel","crisis_nofuel2","crisis_hungry","cleaners_recall","signal_bait","meet_bikers","prev_trace_thirst","meet_cinema","loc_sunflower","gp_note1","gp_note3","loc_icheon","combat_walker_strike","combat_toll_breach","ev_uplink","ev_seaside_restaurant","ev_used_bookstore","roadbeat_50_courtesy","exp_radioshop","exp_kimchi","loc_filmset","ai_census","vg_tollgate","bori_tag","exp_batting","deserter_check","exp_blanket","exp_mart","exp_mushroom","meet_tinker","exp_underground","ev_quarry_hideout","ev_typhoon","ev_night_dogs","ev_river_flood","seoul_square"];
const event=(ctx,id)=>permanentEvents(ctx.data).find(e=>e.id===id);
const copy=(ctx,id,c=0,o=0)=>event(ctx,id).choices[c].out[o].text;
const plain=value=>JSON.parse(JSON.stringify(value));
test('41 edited encounters retain gates, branches, probabilities, effects and chains',()=>{
 const ctx=setup(),rows=permanentEvents(ctx.data).filter(e=>ids.includes(e.id)).sort((a,b)=>a.id.localeCompare(b.id));
 assert.equal(rows.length,ids.length);
 // Only authored prose, quote attribution and the corrected one-hour label are excluded.
 const data=JSON.stringify(rows,(k,v)=>['text','body','turns','readingRecord','turnSpeakers','label'].includes(k)?undefined:v);
 assert.equal(crypto.createHash('sha256').update(data).digest('hex'),
  'e50deef32c77afeeebc346701c345c1ca262c886d99dbd953a71811cf6596913');
 assert.equal(event(ctx,'ev_quarry_hideout').choices[0].label,'한 시간 쉬어 간다');
});
test('mandatory fatigue crises remain solo-safe without gating away the crisis',()=>{
 const ctx=setup();
 for(const party of [[],['minji'],Object.keys(ctx.data.comps)]){
  ctx.S.party=party;const before=JSON.stringify(ctx.S);
  for(const id of ['crisis_drowsy','crisis_collapse','crisis_collapse2']){
   const e=event(ctx,id);assert(!e.needsComp&&!e.minParty);
   assert.doesNotMatch(e.text+' '+copy(ctx,id),/누군가|손이 겹쳐|덮여 있고|걱정시켰다|얼굴에 적혀/);
  }
  assert.equal(JSON.stringify(ctx.S),before);
 }
 assert.match(copy(ctx,'crisis_drowsy'),/차를 세우고.*시트를 젖혔다/);
 assert.match(copy(ctx,'crisis_drowsy'),/두 시간/);
 assert.deepEqual(plain(event(ctx,'crisis_drowsy').choices[0].out[0].fx),{time:120,fatigue:-45,moodAll:2});
 vm.runInContext(source('04c-engine-travel.js'),ctx);
 const opened=[];ctx.G.openEventById=id=>opened.push(id);
 for(let i=0;i<3;i++)ctx.G.openRescue('collapse','crisis_collapse');
 assert.deepEqual(opened,['crisis_collapse','crisis_collapse2','crisis_collapse2']);
});
test('ungated scenes no longer invent passengers, shared dialogue or previous choices',()=>{
 const ctx=setup();
 const scopes=[['cleaners_recall',0],['cleaners_recall',2],['signal_bait',0],['meet_bikers',0],
  ['prev_trace_thirst',0],['meet_cinema',1],['loc_sunflower',0],['gp_note1',0],['gp_note3',0],
  ['loc_icheon',0],['combat_walker_strike',0],['ev_uplink',0],['ev_seaside_restaurant',0],
  ['ev_used_bookstore',0],['roadbeat_50_courtesy',0],['loc_filmset',1],['ai_census',0],
  ['vg_tollgate',0],['bori_tag',1],['exp_batting',0],['meet_tinker',1],['seoul_square',2]];
 for(const [id,c] of scopes)assert.doesNotMatch(copy(ctx,id,c),
  /누군가|다들|일행이|돌아가며|태웠어|밤새 말이 없던 사람|숫자가 뒤집히자|나란히 앉아/,id);
 assert.doesNotMatch(event(ctx,'crisis_breakdown2').text,/철사/);
 assert.doesNotMatch(copy(ctx,'crisis_breakdown2',1),/내가 한 번은|했죠/);
 assert.doesNotMatch(event(ctx,'crisis_nofuel2').text,/같은 갓길/);
 assert.doesNotMatch(copy(ctx,'crisis_nofuel2'),/같은 농가/);
 assert.doesNotMatch(copy(ctx,'crisis_nofuel2',1),/또 지나|또 만났/);
 assert.doesNotMatch(copy(ctx,'deserter_check'),/개\(있다면|보리/);
 assert.match(copy(ctx,'gp_note1'),/시동을 끄고 조였다/);
});
test('real NPCs and properly gated companions keep their presence',()=>{
 const ctx=setup();
 assert.match(copy(ctx,'meet_cinema'),/영사기사/);
 assert.match(copy(ctx,'road_night_circle'),/누군가.*컵/);
 assert.equal(event(ctx,'comp_satellite').needsComp,'eunsu');
 assert.equal(event(ctx,'meet_bikers').choices[1].req.comp,'kangwoo');
 assert.match(copy(ctx,'meet_bikers',1),/강우가 조용히 내려서/);
 assert.equal(event(ctx,'exp_batting').needsDog,true);
 assert.match(copy(ctx,'exp_batting'),/보리가 달려가서/);
 assert.equal(event(ctx,'ev_milkyway').minParty,1);
});
test('result time and resource descriptions match the unchanged effects',()=>{
 const ctx=setup();
 for(const [id,c,o,minutes,words] of [
  ['crisis_breakdown',2,0,300,'다섯 시간'],['crisis_breakdown2',2,0,420,'일곱 시간'],
  ['crisis_nofuel',1,1,600,'열 시간'],['crisis_nofuel2',0,0,540,'아홉 시간'],
  ['crisis_collapse',0,0,240,'네 시간'],['crisis_collapse2',0,0,360,'여섯 시간'],
  ['ev_quarry_hideout',0,0,60,'한 시간'],['ev_typhoon',0,0,90,'한 시간 반'],
  ['ev_river_flood',0,0,100,'한 시간 사십 분'],['ev_river_flood',1,0,50,'오십 분'],
  ['ev_night_dogs',0,0,40,'사십 분']]){
  const out=event(ctx,id).choices[c].out[o];assert.equal(out.fx.time,minutes,id);assert(out.text.includes(words),id);
 }
 for(const id of ['exp_kimchi','ev_used_bookstore','exp_blanket','exp_underground'])
  for(const choice of event(ctx,id).choices)for(const out of choice.out)
   assert.doesNotMatch(out.text,/그날 밤|다음 날|첫날 밤|두 단계/);
 const salvage=event(ctx,'exp_radioshop').choices[0].out[0];
 assert.equal(salvage.fx.scrap,4);assert.match(salvage.text,/고철도 챙겼다/);
 assert.doesNotMatch(copy(ctx,'exp_mart',0,1)+copy(ctx,'exp_mushroom',1,1),/단체로|몇 명이|밤새/);
});
test('new drowsy receipt resumes without replaying time/effects; exit releases the next action',()=>{
 const ctx=setup(),shown=[],effects=[];vm.runInContext(source('04h-engine-presentation.js'),ctx);
 const G=ctx.G,e=event(ctx,'crisis_drowsy'),choice=e.choices[0];
 Object.assign(G,{
  save(){},openingPending:()=>null,currentCampConversation:()=>null,
  reqOk:()=>({ok:true}),reqVisible:()=>true,choiceReq:c=>c.req,
  qualityChoice(){},pickOutcome:(ev,c)=>c.out[0],rememberCombatChoice:()=>null,
  applyFx(fx){effects.push(fx);ctx.S.min+=fx.time;ctx.S.fatigue+=fx.fatigue;return [{t:'2시간 경과',c:'item'}]},
  afterChoice:()=>[],questLedgerSync(){},questLedgerUpdates:()=>[],clearQuestLedgerUpdates(){},
  mainEvidenceEntryId:id=>id,mainEvidenceLocationReady:()=>true,resolveMainEvidenceChain:id=>id
 });
 ctx.UI={showEvent:e=>shown.push(e.id)};
 G.beginPresentation(e);assert.equal(ctx.S.pendingPresentation.phase,'event');
 const driving=JSON.stringify(ctx.S.driving),time=ctx.S.min;
 const first=G.resolvePresentedChoice(e,choice);assert(first.applied);assert.equal(ctx.S.min,time+120);
 assert.equal(first.out.text,copy(ctx,'crisis_drowsy'));
 const state={eventId:e.id,phase:'outcome',turns:[{kind:'narration',text:first.out.text}],index:0};
 G.capturePresentationView(state);const saved=JSON.stringify(ctx.S.pendingPresentation);
 ctx.S=JSON.parse(JSON.stringify(ctx.S));assert(G.resumePresentation());assert.deepEqual(shown,[e.id]);
 for(let i=0;i<3;i++){const again=G.resolvePresentedChoice(e,choice);assert.equal(again.applied,false);assert.equal(again.out.text,first.out.text)}
 assert.equal(effects.length,1);assert.equal(ctx.S.min,time+120);
 assert.equal(JSON.stringify(ctx.S.pendingPresentation),saved);assert.equal(JSON.stringify(ctx.S.driving),driving);
 G.queuePresentation(null);assert.equal(ctx.S.pendingPresentation,null);assert.equal(ctx.S.driving.to,'muju');
 // Existing paid outcomes remain original history, not rewritten from today's party.
 ctx.S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:0,outcomeIndex:0,text:'이전에 저장한 결과',chips:[]};
 assert.equal(G.resolvePresentedChoice(e,choice).out.text,'이전에 저장한 결과');assert.equal(effects.length,1);
});

