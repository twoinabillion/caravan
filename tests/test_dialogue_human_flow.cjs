/* Authored voice + actual parser/advance regressions. No browser or user save;
   a passing test is not an acting, typography, crop or visual QA claim. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES,permanentEvents}=require('../tools/content-registry.cjs');
const plain=x=>JSON.parse(JSON.stringify(x));
const ui=fs.readFileSync('src/07-ui.js','utf8');
function setup(){
  const ctx=vm.createContext({console,S:{party:[],flags:{},comps:{}},G:{myName:()=> '검수 이름'}});
  for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
  ctx.data=vm.runInContext('D',ctx);
  vm.runInContext(ui.match(/  const stripTags=.*;/)[0]+ui.match(/  const playerSpeaker=.*;/)[0]+
    ui.slice(ui.indexOf('  function eventSpeakerCandidates('),ui.indexOf('  function prepareEventAudio(')),ctx);
  return ctx;
}
const page=(ctx,id)=>ctx.data.intro.find(p=>p.scene===id);
const text=p=>p.beats.map(t=>t.text).join('\n');
function helper(ctx,name){
  const start=ui.indexOf('  function '+name+'('),end=ui.indexOf('\n  function ',start+4);
  assert(start>=0&&end>start,name);vm.runInContext(ui.slice(start,end),ctx);return ctx[name];
}
test('ordinary life and associative memories reach the present decision through 27 authored chapters',()=>{
  const ctx=setup();
  assert.deepEqual(Array.from(ctx.data.intro,p=>p.scene),[
    'intro-busan-room-morning-v1','intro-busan-water-line-v1','intro-busan-workday-v1',
    'intro-socket-memory-v1','intro-workday-return-v1',
    'intro-busan-cold-storage-v1','intro-busan-generator-night-v1','intro-busan-evening-call-v1',
    'intro-current-expulsion','intro-family-packing-v1','intro-passenger-seat','intro-dock-aid',
    'intro-appeal-denied','intro-cheollian-2026','intro-terminal-wait-v1',
    'intro-first-expulsion','intro-terminal-copy-v1','intro-resistance-begins','intro-mother-keepsakes',
    'intro-parents-discovery','intro-silenced-presentation','intro-blank-reason',
    'intro-keepsakes-return-v1','intro-envelope-signal','intro-dashboard-module',
    'intro-workshop-departure','intro-departure-choice'
  ]);
  for(const p of ctx.data.intro){
    assert(p.beats.length&&ctx.data.scenes[p.scene],p.scene);
    for(const b of p.beats){
      assert(b.text.trim()&&b.kind,p.scene+' nonempty turn');
      if(b.scene)assert(ctx.data.scenes[b.scene],b.scene);
      if(b.kind==='thought')assert.equal(b.who,'me');
    }
  }
});
test('the solitary morning acts between thoughts instead of speaking a self-introduction aloud',()=>{
  const ctx=setup(),p=page(ctx,'intro-busan-room-morning-v1');
  assert(p.solo);assert.equal(p.beats.filter(t=>t.kind==='dialogue').length,0);
  assert(p.beats.filter(t=>t.kind==='narration').length>=5);
  assert.equal(p.beats.filter(t=>t.kind==='thought').length,3);
  assert.match(text(p),/컵 두 개.*하나는 다시.*돌아가신 뒤.*물통.*장부/s);
  assert.match(text(page(ctx,'intro-busan-workday-v1')),/열두 밀리.*작업복 주머니.*할아버지/s);
  assert.match(text(page(ctx,'intro-socket-memory-v1')),/공구를 찾아 건넸다.*열셋.*마지막으로.*십 분.*오 분/s);
  assert.match(text(page(ctx,'intro-workday-return-v1')),/안에 있어요.*부르는 소리.*입고 있는 옷 주머니.*오늘 안에는/s);
});
test('a frightened child keeps hold of the paper; administrative penalties belong to narration',()=>{
  const ctx=setup(),p=page(ctx,'intro-current-expulsion');
  const child=p.beats.filter(t=>t.who==='intro_child');
  assert(child.some(t=>/잃어버리면 안 돼요/.test(t.text)));
  assert(child.some(t=>/유나 누나.*열/.test(t.text)));
  for(const t of child)assert.doesNotMatch(t.text,/20kg|제7 구역|배급 계정|통행 권한/);
  assert.match(p.beats.filter(t=>t.kind==='narration').map(t=>t.text).join('\n'),
    /20kg.*제7 구역.*집 문.*배급 계정.*통행 권한/s);
  assert.match(text(p),/열 번 넘게.*사유란.*6,412/s);
  assert.match(text(page(ctx,'intro-dock-aid')),/아저씨\?.*빗물.*뒤 차.*난방.*열세 번.*민원 단말/s);
  assert.match(page(ctx,'intro-appeal-denied').beats[0].text,/부두의 버스.*공구 가방.*민원 단말.*하진.*표.*유리판/s);
});
test('parent jobs, human verification, missing pages and the reason for departure survive the new rhythm',()=>{
  const ctx=setup(),parents=text(page(ctx,'intro-parents-discovery'));
  assert.match(parents,/확실히 몰랐어.*판단을 검증.*반도체.*승인자 칸은 비어/s);
  assert.match(parents,/서명.*칩.*이송 사유.*이의 신청.*병원.*전기/s);
  assert.match(text(page(ctx,'intro-silenced-presentation')),/정부.*부산에서 들었다.*가방/s);
  assert.match(text(page(ctx,'intro-keepsakes-return-v1')),/다음 차는 오지 않았다.*명령 규격 번호.*할아버지의 편지/s);
  assert.match(text(page(ctx,'intro-blank-reason')),/남산.*엄마와 아빠의 이송 명령은 누가 만들었나/s);
  assert.match(text(page(ctx,'intro-envelope-signal')),/곧장 시동부터 걸지는 마라.*전압 점검.*기록 대조를 요청합니다.*아무것도 싣지 않았다/s);
  assert.match(text(page(ctx,'intro-dashboard-module')),/4–5쪽이 뜯겨/);
  assert.match(text(page(ctx,'intro-departure-choice')),/아직은 몰라.*장치 꺼내는 법.*이미 떠난 사람.*먼저 떠난 사람들도 찾아보겠습니다.*400km.*할아버지, 다녀올게/s);
});
test('all rewritten one-to-one lines retain confirmed voices through the actual reader and receipt serialization',()=>{
  const ctx=setup(),events=permanentEvents(ctx.data);
  for(const id of ['talk_jy_01','talk_jy_04','talk_jy_05','talk_mj_11','talk_mj_13','talk_leo_19','talk_pss_15']){
    const e=events.find(e=>e.id===id);ctx.S.party=[e.needsComp];
    for(const owner of [e,...e.choices.flatMap(c=>c.out)]){
      const before=JSON.stringify(owner);
      const turns=ctx.buildStoryTurns(owner.text,e,{turnSpeakers:owner.turnSpeakers});
      const lines=turns.filter(t=>t.kind==='dialogue');
      assert.deepEqual(Array.from(lines,t=>t.who),Array.from(owner.turnSpeakers),id);
      assert(lines.every(t=>!t.speakerUncertain),id+' no alternating guesses');
      assert.deepEqual(plain(turns),plain(JSON.parse(JSON.stringify(turns))));
      assert.equal(JSON.stringify(owner),before,id+' parser is pure');
    }
  }
});
test('the actual intro renderer cuts at authored beats and restores the right still on re-render',()=>{
  const ctx=setup(),before=JSON.stringify(ctx.S),nodes=new Map();
  const node=()=>({dataset:{},style:{},classList:{add(){},remove(){}},
    querySelector(){return null;},insertAdjacentHTML(){},scrollTo(){}});
  Object.assign(ctx,{$:selector=>{
    if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector);
  },VO:{stop(){},play(){}},AMBI:{intro(){},introTurn(){}},introIdx:0,introTurnIdx:0,
    personalizedIntroBeat:b=>b,storyPresentationOptions:()=>({}),storyReaderHtml:()=>'',
    storyRecordHtml:()=>'',requestAnimationFrame:fn=>fn(),scheduleIntroAuto(){}});
  // A record node exists only to exercise the existing last-turn branch.
  const record=node();nodes.set('#intro-txt',{...node(),querySelector:s=>s==='.story-reading-record'?record:null});
  const render=helper(ctx,'renderIntro');
  const check=(id,at,scene)=>{
    ctx.introIdx=ctx.data.intro.findIndex(p=>p.scene===id);ctx.introTurnIdx=at;
    render(true);
    assert.equal(nodes.get('#intro-img').dataset.scene,scene);
    assert.equal(nodes.get('#intro-img').src,ctx.data.scenes[scene]);
    assert.equal(nodes.get('#intro-img').alt,ctx.data.sceneDescriptions[scene]||`${ctx.data.intro[ctx.introIdx].title} 장면`);
    assert.equal(JSON.stringify(ctx.S),before);
  };
  check('intro-busan-room-morning-v1',0,'intro-busan-room-morning-v1');
  check('intro-busan-room-morning-v1',1,'intro-cup-habit-v1');
  check('intro-family-packing-v1',0,'intro-family-packing-v1');
  check('intro-family-packing-v1',7,'intro-family-farewell-v1');
  check('intro-dock-aid',0,'intro-dock-aid');
  check('intro-workday-return-v1',5,'intro-workday-repair-v1');
  check('intro-workday-return-v1',0,'intro-workday-return-v1');
  check('intro-envelope-signal',0,'intro-last-winter-v1');
  check('intro-envelope-signal',4,'intro-envelope-signal');
  check('intro-dashboard-module',0,'intro-keepsakes-return-v1');
  check('intro-dashboard-module',1,'intro-dashboard-module');
});
test('seven delivered cinematic stills retain masters, canonical references and truthful review status',async()=>{
  const sharp=require('sharp'),ctx=setup();
  const provenance=JSON.parse(fs.readFileSync('assets/intro/associative-v1/provenance.json','utf8'));
  const contract=JSON.parse(fs.readFileSync('assets/visual-contract.json','utf8'));
  const accepted=provenance.assets.filter(a=>a.delivery);
  assert.equal(accepted.length,7);
  for(const asset of accepted){
    const master=await sharp(asset.master).metadata(),delivery=await sharp(asset.delivery).metadata();
    assert(master.width>=1536&&master.height>=864,asset.id);
    assert.deepEqual([delivery.width,delivery.height,delivery.format],[1024,576,'webp']);
    assert.equal(provenance.styleId,contract.styleId);
    for(const ref of contract.requiredReferences)assert(asset.references.some(r=>r.endsWith(ref)),asset.id+' '+ref);
    assert(asset.prompt&&asset.status.includes('in-game-crop-pending'));
    assert(Object.values(ctx.data.scenes).includes(asset.delivery),asset.id+' wired');
  }
  for(const portraits of Object.values(provenance.referenceStrips))
    for(const path of portraits)assert(fs.existsSync(path),path);
  const rejected=provenance.assets.filter(a=>!a.delivery);
  assert.equal(rejected.length,1);
  assert(!Object.values(ctx.data.scenes).includes(rejected[0].master),'wrong action is never wired');
});
test('real intro advance reaches the next scene and existing game entry exactly once without intermediate gameplay writes',()=>{
  const ctx=setup(),original=JSON.stringify(ctx.S),entries=[],seen=[];
  Object.assign(ctx,{introIdx:0,introTurnIdx:0,introRestart:false,pendingMode:'onroad',
    pendingName:'검수 이름',pendingProfile:'keeper',pendingPack:'fuel',clearIntroAuto(){},
    renderIntro(newPage){seen.push([ctx.introIdx,ctx.introTurnIdx,newPage]);},
    AMBI:{setLoop(){}},localStorage:{setItem(){}},enterGame(){entries.push('game')}});
  ctx.G.newGame=(...args)=>entries.push(args);
  const advance=helper(ctx,'nextIntro');
  for(const [index,p] of ctx.data.intro.entries())for(let b=0;b<p.beats.length;b++){
    assert.equal(ctx.introIdx,index);assert.equal(ctx.introTurnIdx,b);
    assert.equal(JSON.stringify(ctx.S),original);
    advance();
  }
  assert.equal(ctx.introIdx,ctx.data.intro.length);assert.equal(ctx.introTurnIdx,0);
  assert.equal(entries.length,2);assert.equal(entries[1],'game');
  assert.deepEqual(entries[0],['onroad','검수 이름','full','keeper','fuel']);
  assert.equal(seen.filter(row=>row[2]).length,ctx.data.intro.length-1);
});

test('present-day errands close after the memory, without moving facts onto the transfer paper',()=>{
  const ctx=setup(),wait=page(ctx,'intro-terminal-wait-v1'),copy=page(ctx,'intro-terminal-copy-v1');
  assert.match(wait.era,/오늘 아침/);assert.match(copy.era,/오늘 아침/);
  assert.match(text(wait),/담요.*의자.*단말.*마른 수건.*종이 가장자리/s);
  assert.match(text(copy),/원본은 하진에게.*수건.*버스/s);
  assert.match(text(page(ctx,'intro-departure-choice')),/마른 수건.*하진에게 건넸다/s);
  const returned=text(page(ctx,'intro-keepsakes-return-v1'));
  assert.match(returned,/타기로 했던 다음 차.*단말은 남산/s);
  assert.doesNotMatch(returned,/부모님이 탄|아빠가 탄|이번 표에는 남산/);
  assert.doesNotMatch(text(page(ctx,'intro-resistance-begins'))+' '+text(page(ctx,'intro-dashboard-module')),
    /길 여섯 조각을 맞추면|여섯 거점의 도움이 필요/);
});
test('the watched passage never moves the verification key onto the roof or extracts it through either exit',()=>{
  const ctx=setup(),e=permanentEvents(ctx.data).find(e=>e.id==='story_bridge_watched');
  assert.equal(e.needFlag,'bridge_trace_gap');
  assert.match(e.text,/계기판 안에 숨겨 두고 출발한/); // still true after actual extraction
  for(const owner of [e,...e.choices,...e.choices.flatMap(c=>c.out)])
    assert.doesNotMatch(owner.text||owner.label||'',/지붕의 검증|방수포|모듈을 덮/);
  assert.deepEqual(plain(e.choices.map(c=>c.out[0].fx)),[
    {time:20,pursuit:1,flag:'bridge_watched'}, {fatigue:2,flag:'bridge_watched'}]);
});
test('new reunion and ordinary lines resolve confirmed voices in every supported state without mutation',()=>{
  const ctx=setup(),events=permanentEvents(ctx.data);
  const ids=['minji_toolbox','comp_minji_radio','talk_mj_05','talk_mj_06','talk_mj_08','talk_mj_10',
    'talk_pss_01','talk_pss_02','talk_leo_02','talk_leo_06','talk_leo_09','talk_es_09','talk_jy_09','pair_mj_leo_2'];
  for(const id of ids){
    const e=events.find(e=>e.id===id);
    ctx.S.party=[e.needsComp,...(e.needsComp2?[e.needsComp2]:[])];
    for(const flags of [{},{mingyu_reunion:true}])for(const dog of [false,true]){
      ctx.S.flags=flags;ctx.S.dog=dog;
      const before=JSON.stringify(ctx.S);
      for(const owner of [e,...e.choices.flatMap(c=>c.out)]){
        const value=typeof owner.text==='function'?owner.text(ctx.S):owner.text;
        const turns=ctx.buildStoryTurns(value,e,{turnSpeakers:owner.turnSpeakers});
        const lines=turns.filter(t=>t.kind==='dialogue');
        assert.deepEqual(Array.from(lines,t=>t.who),Array.from(owner.turnSpeakers||[]),id);
        assert(lines.every(t=>!t.speakerUncertain),id+' no alternating fallback');
        assert.deepEqual(plain(turns),plain(JSON.parse(JSON.stringify(turns))));
        if(!dog&&['talk_leo_02','talk_leo_09','talk_jy_09'].includes(id))assert.doesNotMatch(value,/보리/);
      }
      assert.equal(JSON.stringify(ctx.S),before,id+' text is read-only');
    }
  }
  ctx.S.flags={mingyu_reunion:true};
  const result=(id,c=0,o=0)=>events.find(e=>e.id===id).choices[c].out[o].text(ctx.S);
  assert.match(result('minji_toolbox'),/능선.*정오/s);
  assert.match(result('minji_toolbox',1),/능선에서도/);
  assert.match(result('talk_mj_08'),/능선에 남겠다고/);
  assert.doesNotMatch(result('talk_mj_10'),/오빠 만나면/);
  assert.match(result('pair_mj_leo_2'),/능선으로 보낼 노래/);
  assert.doesNotMatch(result('comp_minji_radio'),/북쪽 어딘가에서, 민규는 살아/);
  // Opening an event or an old used marker is not a completed reunion.
  const toolbox=events.find(e=>e.id==='minji_toolbox').choices[0].out[0];
  assert.equal(toolbox.text({flags:{},used:{loc_mingyu:1}}),toolbox.text({flags:{}}));
});
test('paid dialogue and reader position remain frozen after reunion, refresh, and an attempted different choice',()=>{
  const ctx=setup(),e=permanentEvents(ctx.data).find(e=>e.id==='minji_toolbox'),effects=[];
  ctx.clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  vm.runInContext(fs.readFileSync('src/04h-engine-presentation.js','utf8'),ctx);
  Object.assign(ctx.G,{
    save(){},openingPending:()=>null,currentCampConversation:()=>null,
    reqOk:()=>({ok:true}),reqVisible:()=>true,choiceReq:c=>c.req,qualityChoice(){},
    pickOutcome:(ev,c)=>c.out[0],rememberCombatChoice:()=>null,checkLevel(){},
    applyFx(fx){effects.push(plain(fx));return [];},afterChoice:()=>[],questLedgerSync(){},
    questLedgerUpdates:()=>[],clearQuestLedgerUpdates(){},resolveMainEvidenceChain:id=>id
  });
  ctx.S.party=['minji'];ctx.G.beginPresentation(e);
  const first=ctx.G.resolvePresentedChoice(e,e.choices[0]);assert(first.applied);
  const turns=ctx.buildStoryTurns(first.out.text,e,{turnSpeakers:first.out.turnSpeakers});
  ctx.G.capturePresentationView({eventId:e.id,phase:'outcome',turns,index:2});
  const receipt=JSON.stringify(ctx.S.pendingPresentation);
  ctx.S.flags.mingyu_reunion=true;
  ctx.S=JSON.parse(JSON.stringify(ctx.S)); // simulate persistence, not a live save
  assert.notEqual(e.choices[0].out[0].text(ctx.S),first.out.text);
  const restored={eventId:e.id,phase:'outcome'};
  ctx.G.restorePresentationView(restored);assert.equal(restored.index,2);
  assert.deepEqual(plain(restored.turns),plain(turns));
  const again=ctx.G.resolvePresentedChoice(e,e.choices[0]);
  assert.equal(again.applied,false);assert.equal(again.out.text,first.out.text);
  assert.equal(ctx.G.resolvePresentedChoice(e,e.choices[1]).ok,false);
  assert.equal(effects.length,1);assert.equal(JSON.stringify(ctx.S.pendingPresentation),receipt);
  ctx.G.queuePresentation(null);assert.equal(ctx.S.pendingPresentation,null);
  ctx.G.beginPresentation(e); // next presentation is reachable; no effect replay on entry
  assert.equal(ctx.S.pendingPresentation.phase,'event');assert.equal(effects.length,1);
});
test('the collective reply works at the minimum party size, not a fixed fourth passenger',()=>{
  const ctx=setup(),e=permanentEvents(ctx.data).find(e=>e.id==='roadbeat_100_divide');
  assert.equal(e.minParty,2);ctx.S.party=['minji','leo'];
  const before=JSON.stringify(ctx.S),body=e.text();
  assert.equal((body.match(/다른 사람 없이/g)||[]).length,2);
  assert.doesNotMatch(e.choices[1].out[0].text,/세 번째|네 번째/);
  assert.deepEqual(plain(e.choices[1].out[0].fx),{flag:'ai_divide_seen',moodAll:2});
  assert.equal(JSON.stringify(ctx.S),before);
});

test('clock-specific prose matches actual elapsed costs, without a forced dawn or cured passenger',()=>{
  const ctx=setup(),events=permanentEvents(ctx.data),event=id=>events.find(e=>e.id===id);
  for(const [id,c,o,minutes,words] of [
    ['comp_sick',1,0,120,'두 시간'],['ev_fog_pass',2,0,120,'두 시간'],
    ['ev_bridge_creak',0,0,70,'한 시간 십 분'],['ev_lost_child',0,0,80,'한 시간 이십 분'],
    ['ev_ice_road',0,0,70,'한 시간 십 분'],['ev_ice_road',2,0,120,'두 시간'],
    ['ev_landslide_block',1,0,120,'두 시간'],['ev_flooded_road',1,0,100,'한 시간 사십 분'],
    ['ev_dust_storm',0,1,90,'한 시간 반'],['ev_snow_road',2,0,120,'두 시간'],
    ['resist_bridge_consequence',0,0,3,'삼 분']]){
    const out=event(id).choices[c].out[o];assert.equal(out.fx.time,minutes,id);
    assert.match(out.text,new RegExp(words),id);assert.doesNotMatch(out.text,/반나절|종일|꼬박 하루/,id);
  }
  assert.doesNotMatch(event('ev_ice_road').choices[2].out[0].text,/아침|히터도 없는|서로 붙어/);
  assert.match(event('ev_landslide_block').choices[1].out[0].text,/차 한 대/);
  assert.match(event('comp_sick').text,/배가 뒤틀린다.*운전석에서 내려/s);
  assert.doesNotMatch(event('comp_sick').choices.map(c=>c.out[0].text).join(' '),/반나절|하루 간호|이틀을 앓/);
  assert.match(event('comp_pss_night').choices[0].out[0].fx.note.body,/학생의 이름에서.*멈췄/);
  assert.doesNotMatch(event('talk_pss_11').choices[0].out[0].text,/오후에 정말/);
});
test('ordinary reactions finish in the present, and the real parser retains consecutive people and written speech',()=>{
  const ctx=setup(),events=permanentEvents(ctx.data);
  const ids=['comp_snore','pair_pss_leo_1','pair_kw_leo_1','talk_leo_12','talk_leo_15',
    'talk_bori_06','ev_comp_birthday','up_armor_argument'];
  for(const id of ids){
    const e=events.find(e=>e.id===id);
    for(const out of e.choices.flatMap(c=>c.out))
      assert.doesNotMatch(typeof out.text==='function'?out.text.toString():out.text,
        /다음 날|익일|사흘 동안|사흘을 버티다|밤이 돌아왔다/,id);
  }
  for(const id of ['comp_sick','comp_pss_night','talk_pss_11','pair_pss_leo_1','pair_kw_leo_1','talk_leo_12','talk_leo_15']){
    const e=events.find(e=>e.id===id);ctx.S.party=['parkss','leo','kangwoo'];
    for(const owner of [e,...e.choices.flatMap(c=>c.out)]){
      const parsed=ctx.buildStoryTurns(owner.text,e,{turnSpeakers:owner.turnSpeakers});
      const routed=parsed.filter(t=>['dialogue','record'].includes(t.kind));
      assert.deepEqual(Array.from(routed,t=>t.who),Array.from(owner.turnSpeakers,s=>typeof s==='string'?s:s.who),id);
      assert(routed.every(t=>!t.speakerUncertain),id);
      if(id==='talk_leo_12')assert(routed.every(t=>t.kind==='record'),'a sore throat does not speak written replies aloud');
    }
  }
  assert.doesNotMatch(events.find(e=>e.id==='up_armor_argument').choices[0].out[0].text,/재이/);
});
test('salvage and small conversations do not pre-empt an unseen day; insomnia stays a personal memory',()=>{
  const events=permanentEvents(setup().data),event=id=>events.find(e=>e.id===id);
  for(const id of ['exp_stationery','meet_popper','near_yeosu_camellia','duo_appraisal']) {
    const out=event(id).choices[0].out[0];
    assert.doesNotMatch(out.text,/다음 날|사흘|하루 종일/,id);
    assert.doesNotMatch(out.fx.note.body,/사흘|하루 종일/,id+' journal');
  }
  const insomnia=event('talk_pss_05').choices[0].out[0];
  assert.doesNotMatch(insomnia.text,/약을 쓰면 안 되는|불면엔 약이 없어|한 시간쯤/);
  assert.match(insomnia.text,/나도 그땐.*몰랐어.*컵도 기울었다/s);
  const chase=event('ev_stealth_dog').choices[2].out[0];
  assert.equal(chase.fx.time,30);assert.match(chase.text,/삼십 분 뒤/);
  assert.doesNotMatch(chase.text,/밤새.*꿈/);
});
test('driving instruction and noise collection use actual people, consecutive speakers, and completed actions',()=>{
  const ctx=setup(),events=permanentEvents(ctx.data);
  for(const [id,voices] of [
    ['talk_mj_07',['minji','me','minji','minji','minji']],
    ['talk_es_07',['eunsu','eunsu','eunsu']]
  ]){
    const e=events.find(e=>e.id===id),out=e.choices[0].out[0];ctx.S.party=[e.needsComp];
    const turns=ctx.buildStoryTurns(out.text,e,{turnSpeakers:out.turnSpeakers});
    assert.deepEqual(Array.from(turns.filter(t=>t.kind==='dialogue'),t=>t.who),voices);
    assert(turns.every(t=>!t.speakerUncertain));
    assert.doesNotMatch(out.text,/삼십 분|한 시간|세상에서 제일 시끄러운 침묵/);
    assert.deepEqual(plain(turns),plain(JSON.parse(JSON.stringify(turns))));
  }
});
test('comforting Kangwoo remembers his story without inventing a base visit',()=>{
  const ctx=setup(),e=permanentEvents(ctx.data).find(e=>e.id==='kangwoo_dogtag');
  const out=e.choices[0].out[0];
  assert.match(out.text({flags:{kw_absolved:1}}),/그 밤 얘기는 했지/);
  assert.doesNotMatch(out.text({flags:{kw_absolved:1}}),/제3방어선 얘기는 했지|같이 갔/);
  assert.equal(out.text({flags:{},used:{kw_base:1}}),out.text({flags:{}}));
});
test('approved key and cache art have separate consumers; terminal art starts on entry, not at dawn',()=>{
  const ctx=setup(),events=permanentEvents(ctx.data),e=id=>events.find(e=>e.id===id);
  assert.deepEqual(Array.from(e('story_family_key').scenes),['family-verification-key']);
  assert.equal(e('main_recovery_story_family_key').scene,'family-verification-key');
  assert.equal(e('main_recovery_story_personal_cache').scene,'suwon-exchange-cache-v1');
  const state={party:[],flags:{core_sleep:1}};
  const turns=e('seoul_uplink_reveal').turns(state);
  assert.equal(turns[0].scene,'seoul-home-dawn-v2');
  assert.equal(turns[1].scene,'seoul-uplink-empty-v2');
  assert(turns.some(t=>/잠든 코어/.test(t.text)));
  assert.equal(ctx.data.scenes['seoul-reset-empty-v2'],ctx.data.scenes['seoul-uplink-empty-v2']);
  for(const id of ['family-verification-key','suwon-exchange-cache-v1','seoul-home-dawn-v2','seoul-night-quiet-v2','seoul-uplink-empty-v2']){
    assert.deepEqual(Array.from(ctx.data.sceneAssetMeta[id].companions),[],id+' no phantom companion');
  }
});
test('the approved replay still is connected only after the choice, and its review page cannot apply a save',async()=>{
  const sharp=require('sharp'),ctx=setup();
  const provenance=JSON.parse(fs.readFileSync('tools/design-drafts/story-scene-review/replay-provenance.json','utf8'));
  const contract=JSON.parse(fs.readFileSync('assets/visual-contract.json','utf8'));
  assert.equal(provenance.styleId,contract.styleId);
  assert.equal(provenance.wiredIntoGameplay,true);
  assert.equal(provenance.status,'Sang-approved-source-wired-crop-pending');
  assert.match(provenance.review.SangApproval,/approved-2026-10-10/);
  assert.match(provenance.review.actualInGameCrop,/not observed/);
  for(const reference of contract.requiredReferences)assert(provenance.references.includes(reference));
  assert.deepEqual(provenance.referenceStripSources,['assets/portraits/kangwoo.png','assets/portraits/leo.png']);
  for(const reference of [...provenance.references,...provenance.referenceStripSources])assert(fs.existsSync(reference));
  assert(provenance.prompt.startsWith(contract.prompt.base));assert(provenance.prompt.includes(contract.prompt.negative));
  const master=await sharp(provenance.master).metadata(),delivery=await sharp(provenance.delivery).metadata();
  assert(master.width>=1536&&master.height>=864);
  assert.deepEqual([delivery.width,delivery.height,delivery.format],[1024,576,'webp']);
  assert.equal(ctx.data.scenes['pair-kangwoo-leo-replay-v1'],provenance.delivery);
  const e=permanentEvents(ctx.data).find(e=>e.id==='pair_kw_leo_1');
  assert.equal(e.needsComp,'kangwoo');assert.equal(e.needsComp2,'leo');
  assert.deepEqual(Array.from(e.scenes),['pair-kangwoo-leo-watch-v1']);
  assert.deepEqual(Array.from(e.choices[0].out[0].scenes),['pair-kangwoo-leo-replay-v1']);
  for(const id of provenance.preservedExistingScenes)assert(ctx.data.scenes[id],'legacy receipt scene remains available');
  const manifest=JSON.parse(fs.readFileSync('tools/design-drafts/manifest.json','utf8'));
  const entry=manifest.drafts.find(d=>d.id==='replay-scene-review-v1');assert(entry);
  const html=fs.readFileSync('tools/design-drafts/'+entry.file,'utf8');
  assert(html.includes(provenance.delivery));assert.doesNotMatch(html,/localStorage|sessionStorage|postMessage|fetch\(/);
});
