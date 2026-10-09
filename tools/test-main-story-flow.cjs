/* node --test tools/test-main-story-flow.cjs — actual data/engine, isolated saves. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('./content-registry.cjs');
const noop=()=>{},plain=value=>JSON.parse(JSON.stringify(value));
const read=(value,state)=>typeof value==='function'?value(state):value;
const prose=(owner,state)=>{
  const turns=read(owner.turns,state);
  return Array.isArray(turns)?turns.map(t=>t.text).join('\n'):read(owner.text,state);
};
function setup(entry='full'){
  const store=new Map(),shown=[];
  const ctx=vm.createContext({console,URLSearchParams,location:{search:''},
    setTimeout:()=>0,clearTimeout:noop,document:{readyState:'loading',addEventListener:noop,documentElement:{dataset:{}}},
    window:{dispatchEvent:noop},CustomEvent:function(){},
    localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
    UI:new Proxy({modalOpen:()=>false,onArrive:()=>0},{get:(o,k)=>o[k]||noop}),
    SND:new Proxy({},{get:()=>noop})});
  for(const f of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
  for(const f of fs.readdirSync('src').filter(f=>/^04[a-h]-/.test(f)).sort())
    vm.runInContext(fs.readFileSync('src/'+f,'utf8'),ctx);
  vm.runInContext('globalThis.g=G;globalThis.d=D;Object.defineProperty(globalThis,"s",{get:()=>S});',ctx);
  ctx.UI.showEvent=e=>{shown.push(e.id);ctx.g.beginPresentation(e);};
  ctx.g.newGame('onroad','흐름 검수',entry);
  const h={ctx,G:ctx.g,D:ctx.d,shown,event:id=>ctx.g.presentationEvent(id),get S(){return ctx.s;}};
  h.reload=()=>{h.G.save();assert(h.G.load());};
  h.choose=(event,index=0,reload=false)=>{
    if(h.S.pendingPresentation?.eventId!==event.id)
      h.G.openEvent(event,{continuation:true});
    const result=h.G.resolvePresentedChoice(event,event.choices[index]);
    assert(result.ok,event.id+': '+result.why);
    if(reload&&!h.S.ended){
      const before=JSON.stringify(h.S);h.reload();
      const replay=h.G.resolvePresentedChoice(event,event.choices[index]);
      assert(replay.ok&&!replay.applied,event.id+' result must not spend twice');
      // load may normalize unrelated presentation caches; gameplay effects stay fixed.
      const a=JSON.parse(before),b=h.S;
      for(const key of ['day','min','flags','items','fuel','food','water','scrap','van'])
        assert.deepEqual(plain(b[key]),plain(a[key]),event.id+' replay '+key);
    }
    return result;
  };
  h.chain=(id,variant=0)=>{
    let n=0;
    while(id&&n++<20&&!h.S.ended){
      const event=h.event(id);assert(event,id);
      h.choose(event,variant%event.choices.length,true);
      id=h.G.queuePresentation();
      if(id){h.reload();assert(h.G.presentTransition());}
    }
    assert(n<20,'bounded main chain');
  };
  h.recover=(variant=0)=>{
    h.S.at='suwon';h.S.stats.km=430;h.S.driving=null;
    let n=0;
    while(!h.G.seoulReady()&&n++<30){
      const op=h.G.mainEvidenceOpportunity();assert(op,'missing objective');
      assert.equal(op.target,'suwon');h.chain(op.event,variant);
    }
    assert(n<30,'main evidence must make progress');assert(h.G.seoulReady());
  };
  h.finishFinale=(disposition=0,nightChoice=0)=>{
    h.S.at='seoul';h.S.pendingPresentation=null;
    const run=e=>{
      let count=0;
      while(e&&!h.S.ended&&count++<20){
        const index=e.id==='seoul_decision'?disposition:e.id==='seoul_night'?nightChoice:
          e.choices.findIndex(c=>!c.req||h.G.reqOk(c.req).ok);
        assert(index>=0,e.id+' usable choice');h.choose(e,index,true);
        const next=h.G.queuePresentation();e=next?h.event(next):null;
      }
      assert(count<20);
    };
    run(h.D.seoulOpenEvent);
    for(let n=0;n<8&&!h.S.ended&&h.G.seoulStage()<h.D.seoulMap.stops.length;n++){
      const stage=h.G.seoulStage();h.G.seoulEnter(stage);
      run(h.event(h.shown.at(-1)));assert(h.G.seoulStopDone(stage));
    }
    assert(h.S.flags.story_done&&h.S.ended);
    assert(h.S.flags[['core_transfer','core_sleep','core_quarantine'][disposition]]);
    assert.equal(['core_transfer','core_sleep','core_quarantine'].filter(k=>h.S.flags[k]).length,1);
  };
  h.reload(); // normalize the same legacy migration markers as a real Continue
  return h;
}

// Execute the same parser used by showEvent/showResult, not a second quote splitter.
function dialogue(h,event,owner=event){
  if(!h.ctx.buildStoryTurns){
    const ui=fs.readFileSync('src/07-ui.js','utf8');
    vm.runInContext(ui.match(/  const stripTags=.*;/)[0]+ui.match(/  const playerSpeaker=.*;/)[0]+
      ui.slice(ui.indexOf('  function eventSpeakerCandidates('),ui.indexOf('  function prepareEventAudio(')),h.ctx);
  }
  return h.ctx.buildStoryTurns(read(owner.text,h.S),event,{turnSpeakers:owner.turnSpeakers})
    .filter(t=>t.kind==='dialogue');
}

test('road-network contact uses earned meetings, not invented completed favours',()=>{
  const h=setup();h.S.at='gimcheon';h.S.party=[];
  const e=h.event('resist_reveal');
  assert(!h.G.eventAvailable(e));
  for(const flag of ['library_met','postman_met','mapmaker_met'])h.S.flags[flag]=true;
  assert(h.G.eventAvailable(e));
  const out=e.choices[1].out[0];
  assert.doesNotMatch(read(out.text,h.S),/세 번|빌린 책|지난 약속|자꾸 길을 바꿨/);
  assert.doesNotMatch(out.fx.note.body,/우회.*여러 번/);
  assert.deepEqual(plain(dialogue(h,e,out).map(t=>t.who)),
    ['hanbyeol','me','mapmaker','mapmaker','hanbyeol','me','hanbyeol','hanbyeol']);
  h.choose(e,1,true);
  assert(h.S.flags.resist_revealed&&h.S.flags.cell_road);
  assert.equal(h.G.queuePresentation(),undefined);
  const contact=h.event('resist_first_contact');
  assert.match(read(contact.text,h.S),/한별에게 받은 기록 봉투/);
  delete h.S.flags.resist_revealed;
  assert.doesNotMatch(read(contact.text,h.S),/한별/);
  assert.equal(dialogue(h,contact)[0].who,'seojin');
});

test('human check trial connects the station, pump, map and two independent approvals',()=>{
  for(const choice of [0,1,2]){
    const h=setup();h.S.at='gimcheon';h.S.party=[];
    const contact=h.event('resist_first_contact');
    assert(h.G.eventAvailable(contact));
    const trial=h.event('resist_human_check_trial'),council=h.event('resist_membership_council');
    assert(!h.G.eventAvailable(trial));assert(!h.G.eventAvailable(council));
    h.choose(contact,1,true);assert(h.G.eventAvailable(trial));
    h.G.openEvent(trial);h.reload();
    assert(!h.S.flags.resistance_trial_done,'reading/back cannot approve a pump');
    assert.match(read(trial.text,h.S),/양수장.*관리인.*수로 지도/s);
    assert.equal(dialogue(h,trial)[0].who,'seojin');
    assert.match(read(trial.choices[1].out[0].text,h.S),/서진과 관리인이 각각 서명/);
    h.choose(trial,choice,true);
    assert.equal(!!h.S.flags.resistance_trial_done,choice!==2);
    assert.equal(h.G.eventAvailable(council),choice!==2);
    assert.equal(h.G.queuePresentation(),undefined,'optional meeting returns to road');
    h.S.at='cheonan';
    assert.equal(h.G.eventAvailable(council),choice!==2);
    assert.doesNotMatch(read(council.text,h.S),/중부 폐차장|네가 모은/);
    if(choice!==2){h.choose(council,choice,true);assert(h.S.flags[choice===0?'resistance_member':'resistance_ally']);}
  }
});

test('world objections address scene contacts, not unintroduced allies or player debts',()=>{
  const h=setup();h.S.at='gimcheon';h.S.party=[];
  const supply=h.event('world_resistance_supply_resentment'),clinic=h.event('world_tianyan_supporter_clinic');
  assert(h.G.eventAvailable(supply));assert(h.G.eventAvailable(clinic));
  assert.doesNotMatch(read(supply.text,h.S),/서진|태식/);
  assert.match(read(supply.text,h.S),/연락꾼/);
  assert.match(read(supply.text,h.S),/주민이.*돌아봤다/);
  assert.equal(dialogue(h,supply)[0].name,'마을 주민');
  assert.equal(dialogue(h,clinic)[0].name,'진료소장');
  assert.doesNotMatch(supply.choices[1].out[0].fx.note,/받은 몫|갚았다/);
  assert.match(read(clinic.text,h.S),/연락꾼을 막고/);
  h.choose(supply,1,true);assert.equal(h.G.queuePresentation(),undefined);
});

test('resistance reactions keep consecutive companion voices through the real reader and reload',()=>{
  const routes={minji:2,parkss:1,kangwoo:2,leo:2,jaeyi:2,eunsu:2};
  for(const [id,count] of Object.entries(routes))for(const choice of [0,1]){
    const h=setup(),event=h.event('react_resist_'+id);h.S.party=[id];
    h.S.flags.resistance_trial_done=true;
    const lines=dialogue(h,event);
    assert.deepEqual(Array.from(lines,t=>t.who),Array(count).fill(id),event.id);
    const turns=h.ctx.buildStoryTurns(event.text,event,{turnSpeakers:event.turnSpeakers});
    assert.equal(turns.filter(t=>t.kind==='dialogue').length,count);
    assert(!turns.some(t=>t.kind==='record'),'a signature in narration is not a spoken document');
    h.G.openEvent(event,{continuation:true});
    h.G.capturePresentationView({eventId:event.id,phase:'event',turns,index:turns.length-1});h.reload();
    const restored={eventId:event.id,phase:'event'};h.G.restorePresentationView(restored);
    assert.deepEqual(plain(restored.turns.filter(t=>t.kind==='dialogue').map(t=>t.who)),Array(count).fill(id));
    const out=event.choices[choice].out[0],resultLines=dialogue(h,event,out);
    assert(resultLines.every(t=>t.who===id),'the selected reply also belongs to its companion');
    const result=h.choose(event,choice,true);assert(result.applied);
    assert.equal(h.S.pendingPresentation.phase,'result');
    assert.equal(h.S.pendingPresentation.choiceIndex,choice);
    assert(!h.G.queuePresentation(),'the reaction ends normally without replaying a main scene');
  }
});

test('testimony compares the parents’ actual document, not an invented Busan terminal visit',()=>{
  const h=setup(),event=h.event('main_transfer_testimony');
  for(const text of [event.text,event.readingRecord,event.turns.map(t=>t.text).join('\n')]){
    assert.match(text,/부모님의 이송표에 찍힌 발신 번호/);
    assert.doesNotMatch(text,/부산에서 가져온 발신 번호/);
  }
  assert.match(h.event('main_recovery_onboarding_first_road').text,/앞 여덟 자리가 같은 발신 번호/);
  assert.match(event.text,/같은 번호였다/,'full numbers are compared here, not claimed at the first partial clue');
});

test('resistance memories preserve Kangwoo’s unit and Jaeyi’s identity',()=>{
  const h=setup();
  assert.match(h.event('react_resist_kangwoo').text,/서울 수비대/);
  assert.doesNotMatch(h.event('react_resist_kangwoo').text,/주방위대/);
  assert.match(h.event('react_resist_jaeyi').text,/재이는 거래선 두 곳/);
  assert.doesNotMatch(h.event('react_resist_jaeyi').text,/그는 거래선/);
});

test('seed handoff requires the actual carried bundle and spends it once after the decision',()=>{
  const h=setup(),pickup=h.event('trace_coldbag'),handoff=h.event('trace_coldbag_return');
  h.S.at='suwon';h.S.driving=null;
  assert(!h.G.eventAvailable(handoff,{mode:'local'}));
  h.choose(pickup,0,true);assert.equal(h.S.items['씨앗 꾸러미'],1);
  h.S.pendingPresentation=null;
  assert(h.G.eventAvailable(handoff,{mode:'local'}));
  assert.match(handoff.text,/씨앗은 아직 기다리고/);
  assert.doesNotMatch(handoff.text,/며칠 뒤|이미 전달|싹이|모종/);
  h.G.openEvent(handoff,{continuation:true});
  const turns=dialogue(h,handoff);
  h.G.capturePresentationView({eventId:handoff.id,phase:'event',turns,index:0});h.reload();
  assert.equal(h.S.items['씨앗 꾸러미'],1,'opening, reading/back and Continue do not hand it over');
  const food=h.S.food,result=h.choose(handoff,0,true);
  assert(result.applied);assert.equal(h.S.items['씨앗 꾸러미'],0);
  assert.equal(h.S.food,Math.min(food+4,h.S.foodMax));assert(h.S.flags.coldbag_delivered);
  assert.match(result.out.text,/말린 콩과 들깨/);
  assert.match(result.out.fx.note.body,/전달했다/);
  assert(!h.G.eventAvailable(handoff,{mode:'local'}),'completed handoff cannot be drawn again');
  assert(!h.G.queuePresentation());assert(h.G.eligible().length,'next local actions remain reachable');
});

test('missing or lost seed bundles cannot open an unusable handoff or grant food',()=>{
  for(const flag of [false,true]){
    const h=setup(),event=h.event('trace_coldbag_return');h.S.at='suwon';
    h.S.flags.coldbag_seeds=flag;h.S.items['씨앗 꾸러미']=0;
    assert(!h.G.eventAvailable(event,{mode:'local'}));
    assert(!h.G.eligible().some(e=>e.id===event.id));
    h.reload();assert(!h.G.eventAvailable(event,{mode:'local'}));
    const food=h.S.food;h.G.openEvent(event,{continuation:true});
    const result=h.G.resolvePresentedChoice(event,event.choices[0]);
    assert(!result.ok);assert.equal(h.S.food,food);assert(!h.S.flags.coldbag_delivered);
  }
  const waterRoute=setup();waterRoute.S.at='suwon';
  waterRoute.choose(waterRoute.event('trace_coldbag'),1,true);
  assert(!waterRoute.G.eventAvailable(waterRoute.event('trace_coldbag_return'),{mode:'local'}));
});

test('legacy paid seed receipts preserve their prose and never retroactively consume an item',()=>{
  const h=setup(),event=h.event('trace_coldbag_return');
  h.S.flags.coldbag_seeds=true;h.S.flags.coldbag_delivered=true;
  h.S.items['씨앗 꾸러미']=1;h.S.used.push(event.id);
  const historical='예전 저장에 남은 전달 결과';
  h.S.pendingPresentation={version:1,phase:'result',eventId:event.id,
    choiceIndex:0,outcomeIndex:0,text:historical,chips:[]};
  const before=plain({items:h.S.items,food:h.S.food,flags:h.S.flags});h.reload();
  assert(h.G.resumePresentation());assert.equal(h.S.pendingPresentation.text,historical);
  const replay=h.G.resolvePresentedChoice(event,event.choices[0]);
  assert(replay.ok&&!replay.applied);assert.equal(replay.out.text,historical);
  assert.deepEqual(plain({items:h.S.items,food:h.S.food,flags:h.S.flags}),before);
  assert(!h.G.eventAvailable(event,{mode:'local'}));
});

test('artifact notes do not invent unread dates and the protagonist remembers being expelled',()=>{
  const h=setup(),route=h.event('story_generation_route').choices[1].out[0];
  assert.match(route.text,/그날을 숫자 하나로 줄이고 싶지 않았다/);
  assert.doesNotMatch(route.text,/날짜를 몰|할아버지가.*말.*않/);
  for(const id of ['trace_cortis_relic','trace_cortis_beacon','trace_worldcup_chart','trace_coldbag']){
    for(const choice of h.event(id).choices)for(const out of choice.out)
      assert.doesNotMatch(out.fx.note.body,/2026|2169/,id+' notes must not introduce an unread date');
  }
  assert.match(h.event('trace_fourcuts').text,/날짜는 2026년/,'visible dates remain intact');
  assert.match(h.event('trace_consent_archive').text,/2026년/);
});

test('northern restored video retains the parents’ actual reply roles and receipt cursor',()=>{
  const h=setup(),source=h.event('story_family_principle'),copy=h.event('main_recovery_story_family_principle');
  h.S.at='suwon';h.S.party=[];
  assert.equal(copy.turns,undefined,'the real quote parser must own the video');
  assert.equal(copy.text.substring(copy.text.indexOf('\n\n')),source.text.substring(source.text.indexOf('\n\n')));
  const lines=dialogue(h,copy),original=dialogue(h,source);
  assert.deepEqual(plain(lines.map(t=>({who:t.who,text:t.text}))),plain(original.map(t=>({who:t.who,text:t.text}))));
  assert.equal(lines.length,12);assert.deepEqual(plain(lines.map(t=>t.who)),
    ['father','mother','father','mother','father','mother','father','mother','father','mother','father','mother']);
  h.G.openEvent(copy,{continuation:true});
  const turns=h.ctx.buildStoryTurns(copy.text,copy,{turnSpeakers:copy.turnSpeakers});
  h.G.capturePresentationView({eventId:copy.id,phase:'event',turns,index:4});h.reload();
  const restored={eventId:copy.id,phase:'event'};h.G.restorePresentationView(restored);
  assert.deepEqual(plain(restored.turns.filter(t=>t.kind==='dialogue').map(t=>t.who)),plain(lines.map(t=>t.who)));
  assert.equal(restored.index,4);
  h.choose(copy,0,true);assert(h.S.flags.parent_principle_found);
  assert.equal(dialogue(h,copy,copy.choices[0].out[0])[0].who,'mother');
});

test('father’s escape, reunion and final maintenance remain ordered in both routes',()=>{
  const h=setup(),father=h.event('parents_father_last_log'),copy=h.event('main_recovery_parents_father_last_log');
  for(const text of [father.turns.map(t=>t.text).join('\n'),father.readingRecord,copy.turns.map(t=>t.text).join('\n')]){
    assert(text.indexOf('화물차')<text.indexOf('다시 만났다'));
    assert(text.indexOf('다시 만났다')<text.indexOf('아빠는 그날 남산에서 죽었다'));
    assert.doesNotMatch(text,/화물 전달망/);
    assert.match(text,/잠시 멎었지만.*다시 이송을 명령할 수 있는 코어/);
  }
  assert.match(copy.text,/수원 북부 교환소/);
  assert.equal(copy.choices[0].out[0].fx.flag,'father_fate_known');
});

test('northern first-record notes preserve the same eight-digit clue as the text',()=>{
  const h=setup(),copy=h.event('main_recovery_onboarding_first_road');
  assert.match(copy.text,/앞 여덟 자리가 같은 발신 번호/);
  for(const index of [0,2])assert.match(copy.choices[index].out[0].fx.note.body,/앞 여덟 자리가 같은 발신 번호/);
});

test('shared manifest close-up does not claim a southern visit in northern recovery',()=>{
  const h=setup(),copy=h.event('main_recovery_parents_diversion_manifest');
  assert.match(copy.text,/수원 북부 교환소/);
  assert.equal(copy.scene,'parents-diversion-record-v2');
  assert.doesNotMatch(h.D.sceneDescriptions[copy.scene],/남쪽|환승소 책상/);
  assert.match(h.D.sceneDescriptions[copy.scene],/운행표.*분류 기록/);
});

test('actual reader assigns family memories and consecutive replies to their authors',()=>{
  const h=setup();h.S.party=['jaeyi','leo','eunsu'];
  const routes={
    jy_photo:[['me','jaeyi','me','jaeyi'],['jaeyi','me','jaeyi','jaeyi'],['jaeyi','me','jaeyi','jaeyi']],
    leo_father_song:[['me','leo','leo'],['passer_elder','leo','passer_elder','leo','leo','passer_elder'],
      ['passer_elder','leo','passer_elder','leo','passer_elder','leo','passer_elder']],
    ev_eunsu_past:[['eunsu','eunsu'],['me','eunsu','me'],['eunsu','me','eunsu']],
    ev_jaeyi_solo:[['jaeyi','jaeyi','jaeyi'],['me','jaeyi'],['me','jaeyi','me','jaeyi']],
    ev_eunsu_solo:[['eunsu','eunsu','eunsu'],['eunsu','me','eunsu','eunsu','eunsu'],['eunsu']]
  };
  for(const [id,expected] of Object.entries(routes)){
    const e=h.event(id),owners=[e,...e.choices.map(c=>c.out[0])];
    owners.forEach((owner,i)=>assert.deepEqual(Array.from(dialogue(h,e,owner),t=>t.who),expected[i],`${id}/${i}`));
  }
});

test('backdoor entry follows nightshift across pool, queue, transition and Continue',()=>{
  const h=setup();h.S.party=['eunsu'];h.S.at='suwon';
  h.G.grantPerk('eunsu','es_story');
  assert(!h.G.eligible().some(e=>e.id==='es_backdoor'));
  h.S._storyQueue=['es_backdoor'];h.reload();
  assert.equal(h.G.popStory(),'es_nightshift');
  h.S.pendingPresentation={version:1,phase:'transition',eventId:'es_backdoor'};
  assert(h.G.resumePresentation());assert.equal(h.shown.at(-1),'es_nightshift');
  assert(!h.S.flags.es_v1194);h.reload();
  assert(h.G.resumePresentation());assert.equal(h.shown.at(-1),'es_nightshift');
  h.choose(h.event('es_nightshift'),0,true);
  assert(!h.G.eligible().some(e=>e.id==='es_nightshift'));
  assert(h.S.flags.es_v1194);assert.equal(h.G.queuePresentation(),'es_backdoor');
  assert(h.G.presentTransition());assert.equal(h.shown.at(-1),'es_backdoor');
  const out=h.choose(h.event('es_backdoor'),0,true),paid=plain(h.S.items);
  h.S._storyQueue=['es_nightshift','es_backdoor'];assert.equal(h.G.popStory(),null);
  assert(!h.G.eligible().some(e=>e.id==='es_nightshift'));
  h.reload();assert(h.G.resumePresentation());
  assert.equal(h.S.pendingPresentation.text,out.out.text);
  assert.deepEqual(plain(h.S.items),paid);
  h.S.pendingPresentation=null;h.S._chain=null;
  assert.equal(h.G.resolveMainEvidenceChain('es_nightshift'),null);
  assert.equal(h.G.resolveMainEvidenceChain('es_backdoor'),null);
});

test('an unanswered legacy backdoor redirects, but a paid legacy receipt is preserved',()=>{
  const h=setup();h.S.party=['eunsu'];h.S.flags.es_backdoor_ready=true;
  h.G.openEvent(h.event('es_backdoor'));h.reload();assert(h.G.resumePresentation());
  assert.equal(h.shown.at(-1),'es_nightshift');assert(!h.S.flags.es_v1194);
  h.S.pendingPresentation=null;h.S.used=h.S.used.filter(id=>id!=='es_backdoor');
  const paid=h.choose(h.event('es_backdoor'),1,true); // emulate the old out-of-order paid result
  h.S._storyQueue=['es_nightshift'];h.reload();assert.equal(h.G.popStory(),null);
  assert(h.G.resumePresentation());assert.equal(h.S.pendingPresentation.text,paid.out.text);
});

test('legacy entry without a paid Eunsu result remains recoverable without replaying completed work',()=>{
  const h=setup();h.S.party=['eunsu'];h.S.flags.es_backdoor_ready=true;
  h.S.used.push('es_nightshift','es_backdoor');h.S.pendingPresentation=null;h.S._storyQueue=[];
  h.S.flags.main_command_record=true;h.reload(); // another proof is not completion of this personal scene
  assert.equal(h.G.popStory(),'es_nightshift');
  h.choose(h.event('es_nightshift'),0,true);h.S.pendingPresentation=null;h.S._chain=null;
  h.S._storyQueue=['es_nightshift'];h.reload();
  assert.equal(h.G.popStory(),'es_backdoor');
  h.S.party=[];h.S._storyQueue=['es_backdoor'];assert.equal(h.G.popStory(),null);
  h.S.party=['eunsu'];h.reload();assert.equal(h.G.popStory(),'es_backdoor');
  h.choose(h.event('es_backdoor'),1,true);h.S.pendingPresentation=null;h.S._chain=null;
  h.S._storyQueue=[];h.reload();assert.equal(h.G.popStory(),null);
});

test('Jaeyi remembers the completed warehouse, not entry or the unrelated law flag',()=>{
  const h=setup();h.S.party=['jaeyi'];const event=h.event('jy_photo'),out=event.choices[0].out[0];
  h.S.flags.jy_law=true;h.G.openEvent(h.event('loc_jaeyi_cache'));
  assert.match(read(out.text,h.S),/오래 못 갔어요/);
  assert(!h.D.jaeyiCacheOpened(h.S));
  h.choose(h.event('loc_jaeyi_cache'),0,true);assert(h.D.jaeyiCacheOpened(h.S));
  const text=read(out.text,h.S);assert.match(text,/같이 열었죠/);assert.match(text,/같이 갔으니까/);
  assert.deepEqual(Array.from(dialogue(h,event,out),t=>t.who),['jaeyi','me','jaeyi','jaeyi']);
  delete h.S.flags.jaeyi_cache_opened;h.reload();assert(h.D.jaeyiCacheOpened(h.S),'legacy completed note');
  assert.doesNotMatch(out.fx.note.body,/혼자서는 못 가는 곳/);
  assert.doesNotMatch(h.event('ev_jaeyi_solo').choices[1].out[0].text,/부산에서 여기까지/);
  const paid=h.choose(event,0,true);delete h.S.flags.jaeyi_cache_opened;h.S.notes=[];h.reload();
  assert.equal(h.G.resolvePresentedChoice(event,event.choices[0]).out.text,paid.out.text,'paid prose stays frozen');
});

test('camp branch history follows chosen work, survives back/reload and never pays twice',()=>{
  for(const cid of Object.keys(setup().D.campConversations)){
    const h=setup();h.S.party=[cid];h.S.driving=null;h.S.items['부품']=10;h.S.water=10;h.S.scrap=10;
    const base=h.D.campConversations[cid], [a,b]=base.choices;
    const enter=()=>{assert(h.G.prepareCamp('talk',cid).ok);return h.G.campConversationEvent();};
    const choose=id=>{
      const event=h.G.campConversationEvent();const result=h.G.resolveCampChoice(event.id,id);assert(result.applied);
      const frozen=plain(h.S.campConversation),mins=h.S.min,resources=plain(h.S.items);
      h.reload();const replay=h.G.resolveCampChoice(event.id,id);assert(replay.ok&&!replay.applied);
      assert.equal(h.S.min,mins);assert.deepEqual(plain(h.S.items),resources);
      assert.equal(h.G.campConversationEvent().choices.find(c=>c.id===id).out[0].text,result.out.text);
      assert.deepEqual(plain(h.S.campConversation.choiceVisits),frozen.choiceVisits);
      h.S.campNight++;h.S.campConversation=null;h.S._campPlan={};return result;
    };
    enter();choose(a.id);enter();
    assert.equal(h.G.campConversationEvent().choices.find(c=>c.id===b.id).out[0].text,b.text,`${cid}: untouched branch`);
    h.S.campConversation.active=false;assert(h.G.prepareCamp('talk',cid).ok);h.reload();
    assert.equal(h.G.campConversationEvent().choices.find(c=>c.id===b.id).out[0].text,b.text);
    choose(b.id);enter();
    assert.equal(h.G.campConversationEvent().choices.find(c=>c.id===a.id).out[0].text,base.followup.choices[a.id].text);
    choose(a.id);enter();
    assert.equal(h.G.campConversationEvent().choices.find(c=>c.id===a.id).out[0].text,base.settled.choices[a.id].text);
    assert.equal(h.G.campConversationEvent().choices.find(c=>c.id===b.id).out[0].text,base.followup.choices[b.id].text);
  }
});

test('a paid camp result never regenerates its prose from later edits or memory',()=>{
  const h=setup();h.S.party=['minji'];assert(h.G.prepareCamp('talk','minji').ok);
  const event=h.G.campConversationEvent(),paid=h.G.resolveCampChoice(event.id,'listen');
  assert(paid.applied);h.reload();
  h.D.campConversations.minji.choices[0].text='나중에 바뀐 본문';
  h.S.campMemories.minji.choiceVisits={listen:2,sort:2};
  const replay=h.G.resolveCampChoice(event.id,'listen');
  assert(replay.ok&&!replay.applied);assert.equal(replay.out.text,paid.out.text);
});

test('legacy camp prose remains unchanged and guest practice is not crew branch history',()=>{
  const h=setup(),base=h.D.campConversations.minji;
  h.S.party=['minji'];h.S.campMemories.minji={choiceId:'listen',visits:12,home:'옛 결과',road:'옛 회상'};
  h.S.campConversation={id:'camp_0_minji',night:0,cid:'minji',chapter:3,previousChoiceId:'listen',
    choiceId:'sort',chips:[],active:true};
  const old=h.G.campConversationEvent().choices[1].out[0].text;h.reload();
  assert.equal(h.G.campConversationEvent().choices[1].out[0].text,old);
  h.S.campNight++;h.S.campConversation=null;h.S._campPlan={};
  assert(h.G.prepareCamp('talk','minji').ok);
  assert.equal(h.G.campConversationEvent().choices[1].out[0].text,base.choices[1].text);
  h.S.campConversation=null;h.S.campMemories.minji={choiceId:'listen',visits:3,voice:'minji-guest-v1'};
  assert(h.G.prepareCamp('talk','minji').ok);
  assert.equal(h.S.campConversation.chapter,1);
  assert.equal(h.G.campConversationEvent().choices[0].out[0].text,base.choices[0].text);
});

test('high exposure crew advice and Park recruitment follow the stable address contract',()=>{
  const h=setup();
  assert.match(h.D.settlementCompanionLines.minji.market,/봐줄까/);
  assert.match(h.D.settlementCompanionLines.minji.garage,/맡겨 볼 만하겠네/);
  assert.match(h.D.settlementCompanionLines.parkss.garage,/쉬어야 해.*안 되지/);
  assert.match(h.D.upgradeAdvisers.fuel.line,/먼저야.*깔아/);
  assert.match(h.D.upgradeAdvisers.seating.line,/보세/);
  const park=h.event('rq_parkss_task').choices[0].out[0];
  assert.doesNotMatch(park.text,/한 거요|싶소만/);assert.match(park.text,/한 거야/);
  const e=h.event('ev_eunsu_solo');assert.match(e.choices[0].out[0].text,/사과할 일 아니에요/);
  assert.match(e.choices[1].label,/무전.*배급/);assert.doesNotMatch(e.choices[1].out[0].text,/하루 만에/);
});

test('comfort plus an antenna sighting cannot substitute for the family command evidence',()=>{
  const h=setup();h.S.party=['eunsu'];h.S.at='cheongju';h.S.min=1300;
  h.choose(h.event('ev_eunsu_past'),0,true);
  assert(h.S.flags.es_truth,'personal trust is kept');
  // This flag can be earned independently by looking at the northern antennas.
  h.S.flags.uplink_seen=true;h.S.flags.parent_key_found=true;h.S.flags.massacre_known=true;
  h.G.syncKnowledgeFromFlags();h.reload();
  assert.equal(h.G.knowledgeLevel('family_order_source'),0);
  assert.equal(h.D.familyOrderKnown(h.S),false);
  assert.equal(h.G.mainEvidenceRows().find(r=>r.id==='command').done,false);
  assert.equal(h.G.seoulReady(),false);
  h.recover();assert(h.S.flags.main_command_record,'actual record remains the next recoverable proof');
});

test('either backdoor answer establishes proof and the core acknowledges it after reload',()=>{
  for(const index of [0,1]){
    const h=setup();h.S.party=['eunsu'];h.S.at='suwon';
    h.choose(h.event('es_backdoor'),index,true);
    assert.equal(h.G.knowledgeLevel('family_order_source'),2);
    assert(h.D.familyOrderKnown(h.S));assert(!h.S.flags.main_command_record);
    const core=h.event('seoul_core');
    assert.match(prose(core,h.S),/백도어에서 네가 만든 명령/);
    assert.match(read(core.readingRecord,h.S),/백도어 기록에선/);
    assert.doesNotMatch(prose(core,h.S),/명령도 네가 만들었어\?/);
    h.recover();assert(!h.S.flags.main_command_record,'earned backdoor proof is not erased');
  }
});

test('v8 migration separates unproved cached knowledge from paid backdoor results',()=>{
  for(const proven of [false,true]){
    const h=setup();h.S.party=['eunsu'];
    h.choose(h.event(proven?'es_backdoor':'ev_eunsu_past'),0);
    const receipt=plain(h.S.pendingPresentation),trust=h.S.comps.eunsu.mood;
    h.S.v=8;h.S.flags.uplink_seen=true;h.S.knowledge.family_order_source=2;
    h.S.flags.es_backdoor_ready=true;h.reload();
    assert.equal(h.S.v,9);assert.equal(h.G.knowledgeLevel('family_order_source'),proven?2:0);
    assert.equal(h.S.comps.eunsu.mood,trust);
    assert.equal(h.S.pendingPresentation.text,receipt.text,'paid history remains frozen');
    assert(h.S.flags.es_truth);
    if(!proven)assert(h.S._storyQueue.includes('es_nightshift'),'the real proof stays reachable');
    const state=JSON.stringify(h.S);h.reload();assert.equal(JSON.stringify(h.S),state,'migration is idempotent');
  }
  const h=setup();h.S.v=8;h.S.used.push('es_backdoor');h.S.flags.es_truth=true;h.S.flags.uplink_seen=true;
  h.S.knowledge.family_order_source=2;h.reload();
  assert.equal(h.G.knowledgeLevel('family_order_source'),0,'entry alone is not a paid result');
});

test('Seoul preludes reject mileage-only locations and resume into the actual city opening',()=>{
  for(const index of [0,1]){
    const h=setup();h.recover();h.S.flags.bridge_crew_answer=true;
    for(const at of ['cheonan','pyeongtaek','suwon']){
      h.S.at=at;h.S.stats.km=600;h.S.flags.bridge_invitation=true;
      for(const id of ['story_bridge_invitation','story_bridge_last_quiet']){
        assert.equal(h.G.beatReady(h.D.journeyBeats.find(b=>b.id===id)),false);
        h.S._beatQueue=[id];assert.equal(h.G.popBeat(),null);
        h.S._storyQueue=[id];assert.equal(h.G.popStory(),null);
        assert.equal(h.G.resolveMainEvidenceChain(id),null);
        h.S.pendingPresentation={version:1,phase:'event',eventId:id};h.reload();
        assert.equal(h.G.resumePresentation(),false);assert.equal(h.S.pendingPresentation,null);
      }
    }
    delete h.S.flags.bridge_invitation;h.S.at='seoul';h.S.pendingArrival='seoul';
    const timers=[];h.ctx.setTimeout=fn=>{timers.push(fn);return timers.length;};
    h.G.finishArrival('seoul');while(timers.length)timers.shift()();
    assert.equal(h.shown.at(-1),'story_bridge_invitation');h.reload();assert(h.G.resumePresentation());
    const before=h.S.day*1440+h.S.min,trace=[];
    let id='story_bridge_invitation';
    while(id){trace.push(id);h.choose(h.event(id),id==='story_bridge_invitation'?index:0,true);id=h.G.queuePresentation();}
    assert.deepEqual(trace,['story_bridge_invitation','story_bridge_last_quiet','seoul_open']);
    assert(h.S.flags.seoul_open&&h.S.flags.bridge_last_quiet);
    assert(h.S.day*1440+h.S.min>=before+(index?35:0));
    assert.equal(h.G.mainEvidenceLocationReady('story_bridge_last_quiet'),false,'no replay after entering the city');
    assert.equal(h.G.seoulStage(),0,'the city map is the next action');
  }
});

test('broadcast wall reply waits three actual days, travel, and Leo, and never repeats',()=>{
  const h=setup();h.S.party=['leo'];h.S.at='cheongju';h.S.day=2;h.S.min=600;
  const start=h.S.day*1440+h.S.min;
  const out=h.choose(h.event('leo_broadcast'),0,true);
  assert.doesNotMatch(out.out.text,/사흘 뒤|마을 벽|우리도 달린다/);
  assert.equal(h.S.day*1440+h.S.min,start,'no invented clock jump');
  const memory=h.S.memories.choices.leo_broadcast_wall;
  assert.equal(memory.dueMinute,start+3*1440);
  h.S.driving={from:'cheongju',to:'cheonan'};h.S.stats.km=memory.dueKm;h.S.stats.events=memory.dueEvents;
  h.S.day=5;h.S.min=599;assert.equal(h.G.takeChoiceEcho(),null);
  h.reload();h.S.min=600;h.S.party=[];assert.equal(h.G.takeChoiceEcho(),null);
  h.S.party=['leo'];h.S.driving=null;assert.equal(h.G.takeChoiceEcho(),null,'not while stopped');
  h.S.driving={from:'cheongju',to:'cheonan'};
  const echo=h.G.takeChoiceEcho();assert.equal(echo.memory.id,'leo_broadcast_wall');
  assert(echo.lines.some(([,t])=>t.includes('우리도 달린다')));
  h.reload();assert.equal(h.G.takeChoiceEcho(),null);
  const old=setup();old.S.flags.song_400km=true;old.S.used.push('leo_broadcast');old.S.v=8;old.reload();
  assert(!old.S.memories.choices.leo_broadcast_wall,'old receipts already contained the reply; do not fabricate another');
});

test('clear Yangsan and companion addressees retain their real context',()=>{
  const h=setup();h.S.at='yangsan';h.S.wx='clear';
  for(const c of h.event('onboarding_first_road').choices)assert.doesNotMatch(read(c.out[0].text,h.S),/빗속|비가|젖었/);
  assert.match(h.event('rq_minji_follow').choices[1].out[0].text,/궁금했어\./);
  assert.match(h.event('rq_jaeyi_follow').choices[2].label,/재이 씨가 정해요/);
  assert.match(h.event('rq_jaeyi_follow').choices[2].out[0].text,/볼트 네 개면 돼요/);
  assert.match(h.event('leo_father_song').text,/왜 그래요\?/);
  assert.match(read(h.event('jy_photo').choices[0].out[0].text,h.S),/김천이라고 했죠/);
});

test('all 48 opening choices preserve sequence, once-only costs and the first road action',()=>{
  for(let seed=0;seed<48;seed++){
    const h=setup('interactive');let value=seed;
    const ids=[];
    while(h.G.openingPending()&&ids.length<6){
      const e=h.G.openingPending(),index=value%e.choices.length;value=Math.floor(value/e.choices.length);
      ids.push(e.id);h.choose(e,index,true);assert.notEqual(h.G.continueOpening(e.id),false);
    }
    assert.deepEqual(ids,['opening_workshop','opening_bus_repair','opening_failed_appeal','opening_parents_module','opening_departure']);
    assert(h.G.canTravelTo('yangsan').ok);assert(h.S._storyQueue.includes('onboarding_first_road'));
  }
});

test('late parent bridges preserve known routes and reunion in all three motives',()=>{
  for(const variant of [0,1,2]){
    const h=setup();h.recover(variant);
    for(const id of ['story_bridge_parent_route','story_bridge_child_voice']){
      assert(h.G.beatReady(h.D.journeyBeats.find(b=>b.id===id)));
      h.chain(id);
    }
    const e=h.event('story_bridge_crew_question');assert(h.S.flags.mother_reunited);
    assert.doesNotMatch(prose(e,h.S),/엄마가 그곳에 없더라도|엄마가 살아 있다면/);
    for(const c of e.choices){
      assert.doesNotMatch(c.label+' '+prose(c.out[0],h.S),/엄마가 살아 있다면|살아 있다면 왜|엄마를 못 만나더라도|가족을 찾는 일/);
    }
    assert.match(prose(h.event('story_bridge_parent_route'),h.S),/중부.*기록.*정리소/);
  }
});

test('mother contact never precedes father evidence, including queued and saved transitions',()=>{
  const h=setup();h.S.at='suwon';h.S.stats.km=430;
  const beat=h.D.journeyBeats.find(b=>b.id==='history_parents_network');
  assert.equal(h.G.beatReady(beat),false);
  h.S._storyQueue=['history_parents_network'];assert.equal(h.G.popStory(),null);
  assert.equal(h.G.resolveMainEvidenceChain('parents_mother_reunion'),null);
  h.S.pendingPresentation={version:1,phase:'transition',eventId:'parents_mother_reunion'};
  h.reload();assert.equal(h.G.resumePresentation(),false);assert.equal(h.S.pendingPresentation,null);
  assert(h.G.mainEvidenceOpportunity(),'a rejected stale chain must leave a next action');
  h.S.flags.father_fate_known=true;assert(h.G.beatReady(beat));
  assert.equal(h.G.resolveMainEvidenceChain('parents_mother_truth'),null,
    'a stale truth chain cannot skip the reunion itself');
  h.S.flags.parents_recent_signal=true;
  h.G.openEvent(h.event('parents_mother_reunion'),{continuation:true});
  assert.equal(h.G.resolveMainEvidenceChain('parents_mother_truth'),'parents_mother_truth');
});

test('normal regional evidence reaches the same readiness, including both key extraction routes',()=>{
  for(const variant of [0,1,2]){
    const h=setup(),visited=[];let count=0;
    while(!h.G.seoulReady()&&count++<25){
      const op=h.G.mainEvidenceOpportunity();assert(op);
      h.S.at=op.target;h.S.driving=null;
      assert(h.G.mainEvidenceLocationReady(op.event));visited.push(op.id);
      h.chain(op.event,variant);
    }
    assert(h.G.seoulReady());assert(count<25);
    assert(visited.indexOf('father')<visited.indexOf('mother'));
    assert(h.S.flags.parent_key_found&&h.S.flags.mother_broadcast_ready);
    assert(!h.S.used.some(id=>id.startsWith('main_recovery_')),
      'normal route must not claim a northern copy');
  }
});

test('full/summary departure notes keep Yuna the older sister',()=>{
  for(const mode of ['full','summary']){
    const h=setup(mode),note=h.S.notes.find(n=>n.title==='도윤의 가족');
    assert.match(note.body,/누나 유나/);assert.doesNotMatch(note.body,/동생 유나/);
  }
});

test('preparation return preserves completed Seoul work and resumes the unpaid decision',()=>{
  const h=setup();h.recover();h.S.at='seoul';
  h.S.flags.seoul_open=true;
  for(const stop of h.D.seoulMap.stops.slice(0,4))h.S.flags['seoul_'+stop.id+'_done']=true;
  h.S.flags.seoul_core_reached=true;h.S.flags.seoul_costs_seen=true;
  h.G.openEvent(h.event('seoul_decision'),{continuation:true});
  const before=h.S.day*1440+h.S.min;
  assert(h.G.prepareFinale());assert.equal(h.S.at,'suwon');
  assert.equal(h.S.day*1440+h.S.min,before+60);
  assert.equal(h.G.prepareFinale(),false);h.reload();
  assert.equal(h.G.resolvedFinaleMethod(),null);
  h.S.at='seoul';h.G.seoulEnter(4);
  assert.equal(h.shown.at(-1),'seoul_decision');
  assert.equal(h.S.pendingPresentation.phase,'event');
  assert.equal(h.S.day*1440+h.S.min,before+60,'completed ascent costs do not replay');
  h.reload();assert(h.G.resumePresentation());
  assert.equal(h.shown.at(-1),'seoul_decision');
  assert(h.G.reqOk(h.event('seoul_decision').choices[0].req).ok,
    'the earned civilian-relay transfer remains a reachable finish');
});

test('recovered outcomes use the northern copy, not inherited original-site reading turns',()=>{
  const h=setup(),e=h.event('main_recovery_parents_father_last_log');
  const out=e.choices[1].out[0];
  assert.match(prose(out,h.S),/새.*표찰/);
  assert.doesNotMatch(prose(out,h.S),/마지막 정비 번호표를.*걸었다/);
  assert.equal(read(out.readingRecord,h.S),read(out.text,h.S));
});

test('sleep stays asleep through the uplink reveal, in turns and the optional record',()=>{
  const h=setup();h.S.flags.core_sleep=true;
  const reveal=h.event('seoul_uplink_reveal'),out=reveal.choices[0].out[0];
  for(const text of [prose(reveal,h.S),read(reveal.text,h.S),read(reveal.readingRecord,h.S)]){
    assert.match(text,/정비 단말/);assert.match(text,/잠든|잠들/);
    assert.doesNotMatch(text,/흰 불은 그대로|코어 뒤 벽이 갈라/);
  }
  assert(!read(out.turns,h.S).some(t=>t.kind==='ai'),'sleeping local core cannot speak');
  assert.doesNotMatch(read(out.readingRecord,h.S),/<span class="ai">/);
  assert.match(prose(h.event('seoul_session_reset'),h.S),/거부합니다/);
});

test('core confrontation acknowledges the original record; epilogue ends on the local result',()=>{
  const h=setup();h.S.flags.main_command_record=true;
  assert.match(prose(h.event('seoul_core'),h.S),/원본.*봤|기록.*봤/);
  for(const method of ['transfer','sleep','quarantine']){
    h.S.flags={['core_'+method]:true};
    for(const c of h.event('seoul_night').choices){
      for(const text of [prose(c.out[0],h.S),read(c.out[0].readingRecord,h.S)])
        assert.doesNotMatch(text,/상위 응답.*남았다|상위 응답 대기/);
    }
  }
});

test('reunion/conference share a place; dawn returns explicitly to the core without erasing prior deportations',()=>{
  const h=setup();
  for(const id of ['parents_mother_reunion','main_relay_conference','main_relay_companion_conference']){
    for(const text of [prose(h.event(id),h.S),read(h.event(id).readingRecord,h.S)]){
      assert.match(text,/수원 외곽/);assert.doesNotMatch(text,/서울 외곽/);
    }
  }
  for(const method of ['transfer','sleep','quarantine']){
    h.S.flags={['core_'+method]:true};
    const reveal=h.event('seoul_uplink_reveal'),night=h.event('seoul_night');
    for(const text of [prose(reveal,h.S),read(reveal.readingRecord,h.S)])
      assert.match(text,/코어실에 다시 들렀다/);
    for(const text of [prose(night,h.S),read(night.readingRecord,h.S)]){
      assert.match(text,/6,412/);assert.match(text,/더는 누구도 강제로 실려 가지 않는다/);
      assert.doesNotMatch(text,/한 사람도 실려 가지 않았다/);
    }
  }
});

test('solo civilian-evidence route ends on either epilogue choice without inventing a party requirement',()=>{
  for(const nightChoice of [0,1]){
    const h=setup();h.recover();assert.equal(h.S.party.length,0);
    h.finishFinale(0,nightChoice);
  }
});

test('companion testimony keeps its own provenance through the command ledger, relay and ending',()=>{
  const h=setup();
  h.S.party=['minji','kangwoo','eunsu'];
  for(const id of h.S.party)Object.assign(h.S.comps[id],{lvl:3,mood:80,injury:0});
  h.S.flags.postman_letter=true; // the separately earned physical-record pillar
  h.recover();
  assert(h.S.used.includes('main_command_companion_ledger'));
  assert(h.S.used.includes('main_relay_companion_conference'));
  assert(!h.S.flags.main_testimony_record,'companion testimony is not three civilian signatures');
  for(const id of ['main_command_companion_ledger','main_relay_companion_conference'])
    assert.doesNotMatch(prose(h.event(id),h.S),/순옥|태문|지아|세 사람의 증언 사본/);
  h.finishFinale();
});

test('three evidence choice patterns reach all three finales with reloads and earned requirements',()=>{
  for(const variant of [0,1,2])for(let disposition=0;disposition<3;disposition++)for(const nightChoice of [0,1]){
    const h=setup();h.recover(variant);
    // An explicit test roster supplies the other two dispositions' real guards.
    h.S.party=['minji','kangwoo','eunsu'];
    for(const id of h.S.party)Object.assign(h.S.comps[id],{lvl:3,mood:80,injury:0});
    h.S.day=nightChoice===0?5:120;
    h.finishFinale(disposition,nightChoice);
  }
});
