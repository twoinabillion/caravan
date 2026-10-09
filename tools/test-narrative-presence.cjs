/* node --test tools/test-narrative-presence.cjs — isolated VM, no live save. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {STATIC_CONTENT_FILES,permanentEvents}=require('./content-registry.cjs');
function setup(){
  const ctx=vm.createContext({console,clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),setTimeout:()=>0,clearTimeout(){},G:{},rng:()=>0});
  for(const f of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
  ctx.data=vm.runInContext('D',ctx);
  ctx.S={party:[],dog:false,flags:{},up:{},fuel:42,fatigue:70,water:20,thirst:0,comps:{},day:2,min:568,stats:{km:200}};
  for(const f of ['04b-engine-crew.js','04e-engine-world.js','04h-engine-presentation.js'])
    vm.runInContext(fs.readFileSync('src/'+f,'utf8'),ctx);
  Object.assign(ctx.G,{hasComp:id=>ctx.S.party.includes(id),isNight:()=>false,isWet:()=>true,regionOf:()=> 'mid',isInfiniteResourceMode:()=>false,knowledgeLevel:()=>0});
  ctx.pick=pool=>{ctx.pool=pool;return pool[0]};
  return ctx;
}
const event=(c,id)=>permanentEvents(c.data).find(e=>e.id===id);
const text=(value,state)=>typeof value==='function'?value(state):value;
const ids=['find_bori_nose','ai_drone','meet_kids_toll','vg_rainbow','vg_fisherman','vg_reflectors','loc_cablecar','wx_ghostlight','wx_struck_tree','wx_frogs','vg_tunnelfan','wx_dustart','camp_thief','camp_scan','conflict_fuel_detour','story_bridge_last_quiet'];

test('all 64 rosters × dog present/absent respect authored ambient actors',()=>{
  const c=setup(),names=Object.keys(c.data.comps);assert.equal(names.length,6);
  for(let mask=0;mask<64;mask++)for(const dog of [false,true]){
    c.S.party=names.filter((_,i)=>mask&(1<<i));c.S.dog=dog;
    vm.runInContext('lastBanter=[];G.pickBanter()',c);
    for(const row of c.pool){
      const n=row.need||{};
      for(const id of [n.comp,n.comp2,c.data.comps[row.who]&&row.who].filter(Boolean))assert(c.S.party.includes(id),row.t);
      if(n.dog)assert(dog,row.t);
      if(n.party)assert(c.S.party.length>=n.party,row.t);
      assert.doesNotMatch(row.t,/누가 창문에|누가 손가락으로|누군가 숨을 참는다/);
    }
    assert.equal(c.pool.some(b=>b.t.startsWith('민지가 김 서린 창')),c.S.party.includes('minji'));
    assert.equal(c.pool.some(b=>b.t.startsWith('레오가 김 서린 창')),c.S.party.includes('leo'));
    assert.equal(c.pool.some(b=>b.t.startsWith('하품이 차 안을')),!!c.S.party.length);
    c.pool=[];const line=c.G.pickMealBanter();
    if(!c.S.party.length){assert.equal(line,null);continue;}
    assert.equal(c.pool.some(b=>(typeof b==='string'?b:b.t).includes('보리')),dog);
  }
});

test('both real meal entry points suppress absent Bori and retain him when present',()=>{
  const c=setup(),spoken=[];c.UI={toast(){},speak:row=>spoken.push(row.t)};
  Object.assign(c.G,{consumeMeal:()=>({ok:true,used:1,before:0,after:0}),mealToast:()=>'',save(){},mealNeed:()=>1,addSupply(){},moodAll(){}});
  for(const name of ['lunch','breakfast'])for(const party of [[],['minji'],['leo']])for(const dog of [false,true]){
    c.S.party=party;c.S.dog=dog;spoken.length=0;
    c.pick=pool=>pool.find(b=>(typeof b==='string'?b:b.t).includes('보리'))||pool[0];
    c.G[name]();
    assert.equal(spoken.length,party.length?1:0);
    if(party.length){assert.equal(typeof spoken[0],'string');assert.equal(spoken[0].includes('보리'),dog);}
  }
  c.S.party=['minji'];c.data.mealBanter=[{t:'dog-only',need:{dog:1}}];c.S.dog=false;
  assert.equal(c.G.pickMealBanter(),null);
});

test('Bori-only, solo and accompanied scenes resolve to actors actually present',()=>{
  const c=setup(),bori=event(c,'find_bori_nose'),quiet=event(c,'story_bridge_last_quiet');
  c.S.dog=true;
  assert.doesNotMatch(text(bori.choices[1].out[0].text,c.S),/레오/);
  assert.doesNotMatch(text(quiet.text,c.S),/돌아갈 사람|누가 먼저|한 번씩|안쪽에서/);
  c.S.party=['leo'];assert.match(text(bori.choices[1].out[0].text,c.S),/레오가/);
  assert.match(text(quiet.text,c.S),/돌아갈 사람/);
  const frogs=event(c,'wx_frogs');assert.equal(frogs.needsDog,true);
  assert.match(frogs.choices[0].out[0].text,/보리가 창밖/);
  assert.doesNotMatch(frogs.choices[0].out[0].text,/설이 갈렸다|논쟁/);
});

test('solo ambient scenes contain no phantom reply or fixed crew count',()=>{
  const c=setup();
  for(const id of ['ai_drone','vg_rainbow','vg_fisherman','vg_reflectors','loc_cablecar','wx_ghostlight','wx_struck_tree','vg_tunnelfan','wx_dustart']){
    const e=event(c,id);assert(!e.minParty&&!e.needsComp,id+' remains reachable solo');
    assert.doesNotMatch(e.choices[0].out[0].text,/"|누가 먼저|아무도 웃지|그렇게 정해졌다|이름 공모/);
  }
  assert.doesNotMatch(event(c,'camp_thief').text,/들려\?|뭐가\.|저거\./);
  assert.doesNotMatch(event(c,'camp_scan').choices[0].out[1].text,/열원 다수/);
  assert.doesNotMatch(event(c,'conflict_fuel_detour').text,/여섯|일곱/);
  const chat=c.data.chats.find(r=>r.need?.comp==='parkss'&&r.need?.comp2==='jaeyi'&&r.need?.flag==='seoul_seen');
  assert(chat);assert.doesNotMatch(JSON.stringify(chat.lines),/여섯이/);
  // Real scene NPCs and gated specialist actions must not disappear with the fix.
  assert.match(event(c,'meet_kids_toll').text,/아이 셋/);
  assert.match(event(c,'meet_kids_toll').choices[0].out[0].text,/방금 정했어요/);
  assert.match(event(c,'wx_ghostlight').choices[0].out[1].text,/북쪽 조심하세요/);
  assert.equal(event(c,'ai_drone').choices[2].req.comp,'kangwoo');
  assert.match(event(c,'ai_drone').choices[2].out[0].text,/강우가/);
});

test('16 revised encounters preserve all gates, choices, effects, probabilities and chains',()=>{
  const c=setup(),rows=permanentEvents(c.data).filter(e=>ids.includes(e.id)).sort((a,b)=>a.id.localeCompare(b.id));
  assert.equal(rows.length,16);
  const projected=require('./story-review-contract.cjs')(JSON.parse(JSON.stringify(rows)));
  const data=JSON.stringify(projected,(k,v)=>['text','body','turns','readingRecord','turnSpeakers','speakers'].includes(k)?undefined:v);
  assert.equal(crypto.createHash('sha256').update(data).digest('hex'),'672256f4d0db52e557883dcdae4276d651d245e24e1b1bfab521ff277dcdac4d');
});

test('conditional scene text freezes in its receipt through reload, then exits without new effects',()=>{
  const c=setup(),G=c.G,e=event(c,'find_bori_nose'),effects=[];
  c.S.dog=true;c.S.party=['leo'];
  c.UI={showEvent(){}};
  Object.assign(G,{save(){},openingPending:()=>null,currentCampConversation:()=>null,reqOk:()=>({ok:true}),reqVisible:()=>true,
    choiceReq:ch=>ch.req,qualityChoice(){},pickOutcome:(ev,ch)=>ch.out[0],rememberCombatChoice:()=>null,
    applyFx:fx=>{effects.push(fx);return []},afterChoice:()=>[],questLedgerSync(){},questLedgerUpdates:()=>[],clearQuestLedgerUpdates(){},
    mainEvidenceEntryId:id=>id,mainEvidenceLocationReady:()=>true,resolveMainEvidenceChain:id=>id});
  G.beginPresentation(e);const result=G.resolvePresentedChoice(e,e.choices[1]);
  assert(result.applied);assert.match(result.out.text,/레오가/);
  c.S=JSON.parse(JSON.stringify(c.S));c.S.party=[];
  assert(G.resumePresentation());
  const replay=G.resolvePresentedChoice(e,e.choices[1]);assert.equal(replay.applied,false);
  assert.equal(replay.out.text,result.out.text);assert.equal(effects.length,1);
  G.queuePresentation(null);assert.equal(c.S.pendingPresentation,null);
  G.beginPresentation(e);const fresh=G.resolvePresentedChoice(e,e.choices[1]);
  assert.doesNotMatch(fresh.out.text,/레오/);assert.equal(effects.length,2);
});
