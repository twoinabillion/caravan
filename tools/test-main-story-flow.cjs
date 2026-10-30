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
test('Opposing procession encounters preserve each actual speaker across all choices and reload',()=>{
  const specs=[
    ['ev_pilgrims_white','parkss','passer_refugee',[
      ['passer_refugee','passer_refugee','me','passer_refugee'],['parkss','me','parkss','parkss'],[]]],
    ['ev_cult_opposite','jaeyi','passer_man',[
      ['me','passer_man'],['jaeyi','passer_man','jaeyi'],[]]],
  ];
  for(const [id,comp,npc,routes] of specs)for(const present of [false,true])for(let choice=0;choice<3;choice++){
    const h=setup(),e=h.event(id);h.S.at='daejeon';h.S.party=present?[comp]:[];
    assert(!h.G.eventAvailable(e,{mode:'local'}));
    h.choose(h.event('whites_pass'),1,true);h.G.queuePresentation();
    assert(h.G.eventAvailable(e,{mode:'local'}));
    h.G.openEvent(e,{continuation:true});h.reload();
    assert.deepEqual(Array.from(dialogue(h,e),t=>t.who),[npc],id+' entry');
    if(choice===1&&!present){
      const before=JSON.stringify(h.S);assert(!h.G.resolvePresentedChoice(e,e.choices[choice]).ok);
      assert.equal(JSON.stringify(h.S),before);continue;
    }
    const result=h.choose(e,choice,true);
    assert.deepEqual(Array.from(dialogue(h,e,result.out),t=>t.who),routes[choice],id+' choice '+choice);
    h.S.party=[];h.reload();const before=JSON.stringify(h.S);
    const replay=h.G.resolvePresentedChoice(e,e.choices[choice]);
    assert(replay.ok&&!replay.applied);assert.equal(replay.out.text,result.out.text);
    assert.equal(JSON.stringify(h.S),before);h.G.queuePresentation();
    assert(!h.S.pendingPresentation);assert(h.G.canTravelTo('sejong').ok);
  }
});
test('Recruiter gift requires real water while the free conversation remains reachable',()=>{
  for(const water of [0,1,2])for(const choice of [0,1]){
    const h=setup();h.S.at='daejeon';h.S.party=[];h.S.water=water;
    const e=h.event('cult_recruiter');assert(!h.G.eventAvailable(e,{mode:'local'}));
    h.choose(h.event('whites_pass'),0,true);h.G.queuePresentation();
    assert(h.G.eventAvailable(e,{mode:'local'}));
    h.G.openEvent(e,{continuation:true});h.reload();assert.equal(h.S.water,water);
    assert.equal(h.G.reqOk(e.choices[1].req).ok,water>=1);
    if(!water&&choice===1){
      const before=JSON.stringify(h.S);assert(!h.G.resolvePresentedChoice(e,e.choices[1]).ok);
      assert.equal(JSON.stringify(h.S),before);continue;
    }
    const result=h.choose(e,choice,true);
    assert.equal(h.S.water,water-(choice===1?1:0));
    assert(h.S.flags.cult_doubt_seeded);assert.equal(h.S.flags.whites_doubt,1);
    h.G.queuePresentation();assert(!h.S.pendingPresentation);
    assert(h.G.canTravelTo('sejong').ok);assert(!h.G.eventAvailable(e,{mode:'local'}));
  }
});
test('Recruiter dialogue keeps the NPC consecutive replies and does not invent learned testimony',()=>{
  const h=setup(),e=h.event('cult_recruiter');h.S.at='daejeon';h.S.party=[];
  assert.deepEqual(Array.from(dialogue(h,e),t=>t.who),['passer_refugee']);
  assert.deepEqual(Array.from(dialogue(h,e,e.choices[1].out[0]),t=>t.who),
    ['passer_refugee','me','passer_refugee','passer_refugee','me','passer_refugee']);
  assert.deepEqual(Array.from(dialogue(h,e,e.choices[0].out[0]),t=>t.who),
    ['passer_refugee','me','passer_refugee','me','passer_refugee']);
  assert.doesNotMatch(read(e.choices[0].out[0].text,h.S),/강원에서 정리된|도로에 갇혀 얼어/);
  h.S.water=1;h.G.openEvent(e,{continuation:true});h.S.water=0;h.reload();
  assert(!h.G.resolvePresentedChoice(e,e.choices[1]).ok);
  h.S.water=1;h.choose(e,1,true);
  h.S.pendingPresentation.text='옛 신도 대화 결과';h.reload();
  const before=JSON.stringify(h.S),replay=h.G.resolvePresentedChoice(e,e.choices[1]);
  assert(replay.ok&&!replay.applied);assert.equal(replay.out.text,'옛 신도 대화 결과');
  assert.equal(JSON.stringify(h.S),before);h.G.queuePresentation();assert(!h.S.pendingPresentation);
});
test('White procession followup spends water only on the explicit gift and survives reload',()=>{
  for(const passChoice of [0,1])for(const water of [0,1,2]){
    const h=setup();h.S.at='miryang';h.S.min=600;h.S.party=[];h.S.water=water;
    const e=h.event('whites_straggler');
    assert(!h.G.eventAvailable(e,{mode:'local'}));
    h.choose(h.event('whites_pass'),passChoice,true);h.G.queuePresentation();
    assert(h.G.eventAvailable(e,{mode:'local'}));
    h.G.openEvent(e,{continuation:true});h.reload();
    assert.equal(h.S.water,water,'entry and unread resume do not give water');
    assert.doesNotMatch(h.S.pendingPresentation.text,/물을 건네자|반을 마시고/);
    assert.equal(h.G.reqOk(e.choices[0].req).ok,water>=1);
    assert.deepEqual(Array.from(dialogue(h,e),t=>t.who),['passer_elder','passer_elder']);
    const before=JSON.stringify(h.S),minute=h.S.min;
    if(!water){
      assert(!h.G.resolvePresentedChoice(e,e.choices[0]).ok);
      assert.equal(JSON.stringify(h.S),before,'blocked gift cannot mutate the receipt or resources');
    }
    const result=h.choose(e,water?0:1,true);
    assert.equal(h.S.water,Math.max(0,water-1));
    assert.equal(h.S.min,minute+(water?0:20));
    assert.equal(!!h.S.flags.straggler_south,water>0);assert(h.S.flags.whites_doubt);
    assert.deepEqual(Array.from(dialogue(h,e,result.out),t=>t.who),Array(water?3:1).fill('passer_elder'));
    if(water)assert.match(result.out.text,/물을 건네자/);
    else assert.doesNotMatch(result.out.text,/물을 건네자|반을 마시고/);
    h.G.queuePresentation();assert(!h.S.pendingPresentation);assert(h.G.canTravelTo('daegu').ok);
  }
});
test('White procession gift rechecks unpaid supplies but preserves paid historical results',()=>{
  const h=setup(),e=h.event('whites_straggler');h.S.at='miryang';h.S.flags.whites_seen=true;h.S.water=1;
  h.G.openEvent(e,{continuation:true});h.S.water=0;h.reload();
  const unpaid=JSON.stringify(h.S);assert(!h.G.resolvePresentedChoice(e,e.choices[0]).ok);
  assert.equal(JSON.stringify(h.S),unpaid);
  h.S.water=1;h.choose(e,0,true);
  h.S.pendingPresentation.text='옛 지급 결과: 노인은 남쪽으로 돌아갔다.';h.reload();
  const paid=JSON.stringify(h.S),replay=h.G.resolvePresentedChoice(e,e.choices[0]);
  assert(replay.ok&&!replay.applied);assert.match(replay.out.text,/옛 지급 결과/);
  assert.equal(JSON.stringify(h.S),paid);h.G.queuePresentation();assert(!h.S.pendingPresentation);
});
test('Bori family reunion follows the actual tag choice, training and present crew',()=>{
  for(const tagChoice of [0,1])for(const trained of [false,true])for(const leoPresent of [false,true]){
    const h=setup();h.S.at='miryang';h.S.min=600;h.S.dog=true;h.S.party=['leo'];
    const family=h.event('bori_family');
    assert(!h.G.eventAvailable(family,{mode:'node',node:'miryang'}));
    h.choose(h.event('bori_tag'),tagChoice,true);h.G.queuePresentation();
    h.choose(h.event('meet_dogtrainer'),trained?0:1,true);h.G.queuePresentation();
    h.S.party=leoPresent?['leo']:[];h.reload();
    assert(h.G.eventAvailable(family,{mode:'node',node:'miryang'}));
    const result=h.choose(family,0,true),text=result.out.text;
    assert.equal(text.includes('하이파이브'),trained);
    assert.equal(text.includes('레오는 인식표'),leoPresent);
    assert.doesNotMatch(text,/저녁|가르친 보람/);
    assert.deepEqual(Array.from(dialogue(h,family,result.out),t=>t.who),
      ['passer_man','passer_man','me','passer_man','passer_man','me','passer_man','passer_man']);
    assert.equal(h.S.min,trained?615:600);assert(h.S.flags.bori_family_known);
    assert.doesNotMatch(h.S.notes.find(n=>n.title==='탄이의 가족').body,/저녁/);
    h.G.queuePresentation();assert(!h.S.pendingPresentation);assert(h.G.canTravelTo('daegu').ok);
  }
});
test('Bori reunion stays in settlement exploration and preserves paid roadside history',()=>{
  const h=setup(),e=h.event('bori_family');h.S.dog=true;h.S.flags.bori_tag_found=true;
  for(const [id,node] of Object.entries(h.D.nodes)){
    h.S.at=id;
    assert.equal(h.G.eventAvailable(e,{mode:'node',node:id}),node.type==='settlement',id);
    assert(!h.G.eventAvailable(e,{mode:'road',node:id}));
  }
  h.S.at='miryang';h.S.dog=false;
  assert(!h.G.eventAvailable(e,{mode:'node',node:'miryang'}));
  h.S.dog=true;h.choose(e,0,true);
  h.S.pendingPresentation.text='옛 길가 재회: 보리는 하이파이브를 하고 레오와 돌아왔다.';
  h.S.at='gimhae';h.S.party=[];h.S.dog=false;h.reload();
  const before=JSON.stringify(h.S),replay=h.G.resolvePresentedChoice(e,e.choices[0]);
  assert(replay.ok&&!replay.applied);assert.match(replay.out.text,/옛 길가 재회/);
  assert.equal(JSON.stringify(h.S),before);h.G.queuePresentation();assert(!h.S.pendingPresentation);
});
test('DJ guestbook and antenna routes preserve actual knowledge and reach solo recording',()=>{
  for(const source of ['night','signal','antenna'])for(const dog of [false,true]){
    const h=setup();h.S.at='gimcheon';h.S.min=120;h.S.party=source==='antenna'?['minji']:[];h.S.dog=dog;
    const first=h.event(source==='night'?'night_djradio':'ev_radio_dj_signal');
    assert(h.G.eventAvailable(first,{mode:'local'}));
    h.choose(first,source==='antenna'?1:0,true);h.G.queuePresentation();
    const tower=h.event('dj_tower'),meet=h.event('dj_meet');
    if(source!=='antenna'){
      assert(!h.G.eventAvailable(meet,{mode:'local'}));
      assert(h.G.eventAvailable(tower,{mode:'local'}));
      h.G.openEvent(tower,{continuation:true});h.reload();
      assert.doesNotMatch(read(meet.text,h.S),/방명록 네 번째 팀/,'opening a book is not signing it');
      const signed=h.choose(tower,0,true);assert.equal(signed.out.text.includes('개 있음'),dog);
      h.G.queuePresentation();
    }
    h.S.party=[];h.reload();
    assert(h.G.eventAvailable(meet,{mode:'local'}));
    assert.equal(read(meet.text,h.S).includes('방명록 네 번째 팀'),source!=='antenna');
    assert.deepEqual(Array.from(dialogue(h,meet),t=>t.name),['DJ','DJ']);
    const result=h.choose(meet,1,true);assert.doesNotMatch(result.out.text,/다 같이|회의 끝/);
    assert.deepEqual(Array.from(dialogue(h,meet,result.out),t=>t.name),['DJ','DJ']);
    assert.equal(h.S.flags.dj_story_sent,1);h.G.queuePresentation();h.reload();
    h.S.min=150;const onair=h.event('dj_onair');assert(h.G.eventAvailable(onair,{mode:'local'}));
    assert.deepEqual(Array.from(dialogue(h,onair)),[],'the broadcast is not an unseen live companion');
    const heard=h.choose(onair,0,true);assert.doesNotMatch(heard.out.text,/다들|누군가 밤이|쪽지에/);
    h.G.queuePresentation();assert(h.S.flags.dj_onair_done);assert(!h.S.pendingPresentation);
    assert(h.G.canTravelTo('gumi').ok);
  }
});
test('DJ interview alone does not submit a recording and every reply belongs to the DJ',()=>{
  const h=setup();h.S.at='gimcheon';h.S.min=120;h.S.party=[];
  h.choose(h.event('night_djradio'),0,true);h.G.queuePresentation();
  h.choose(h.event('dj_tower'),0,true);h.G.queuePresentation();
  const meet=h.event('dj_meet'),result=h.choose(meet,0,true);
  assert.deepEqual(Array.from(dialogue(h,meet,result.out),t=>t.name),Array(5).fill('DJ'));
  h.G.queuePresentation();assert(h.S.flags.dj_met);assert(!h.S.flags.dj_story_sent);
  assert(!h.G.eventAvailable(h.event('dj_onair'),{mode:'local'}));
});
test('DJ premiere waits for its actual hour without consuming missed entries or rewriting paid results',()=>{
  const h=setup(),e=h.event('dj_onair');h.S.party=[];h.S.flags.dj_story_sent=1;h.S.at='gimcheon';
  for(const minute of [0,119,120,150,179,180,600,1200,1439]){
    h.S.min=minute;
    for(const mode of ['local','road'])assert.equal(h.G.eventAvailable(e,{mode}),minute>=120&&minute<180);
    assert(!h.S.used.includes(e.id));
  }
  h.S.day++;h.S.min=120;h.G.openEvent(e,{continuation:true});h.reload();
  assert.equal(h.S.pendingPresentation.eventId,e.id);
  h.choose(e,0,true);const text=h.S.pendingPresentation.text;
  h.S.min=600;h.reload();const restored=h.G.resolvePresentedChoice(e,e.choices[0]);
  assert(restored.ok&&!restored.applied);assert.equal(restored.out.text,text);
  h.G.queuePresentation();assert(!h.S.pendingPresentation);assert(h.G.canTravelTo('gumi').ok);
});
test('DJ recordings survive crew departure and historical paid prose is never regenerated',()=>{
  const h=setup();h.S.at='gimcheon';h.S.min=120;h.S.party=['minji','leo'];
  h.choose(h.event('night_djradio'),0,true);h.G.queuePresentation();
  h.choose(h.event('dj_tower'),0,true);h.G.queuePresentation();
  h.choose(h.event('dj_meet'),1,true);h.G.queuePresentation();
  h.S.party=[];h.S.min=150;h.reload();const e=h.event('dj_onair');
  assert(h.G.eventAvailable(e,{mode:'local'}));h.choose(e,0,true);
  h.S.pendingPresentation.text='옛 녹음 방송 결과 — 함께 채널을 지켰다.';
  h.S.min=600;h.reload();const before=JSON.stringify(h.S);
  const replay=h.G.resolvePresentedChoice(e,e.choices[0]);
  assert(replay.ok&&!replay.applied);assert.equal(replay.out.text,'옛 녹음 방송 결과 — 함께 채널을 지켰다.');
  assert.equal(JSON.stringify(h.S),before);h.G.queuePresentation();assert(!h.S.pendingPresentation);
});
test('Mansu repeat meetings actually unlock the robbery and opening without editing visit flags',()=>{
  const h=setup(),trader=h.event('meet_trader_truck'),robbed=h.event('mansu_robbed'),opening=h.event('mansu_opening');
  h.S.at='miryang';h.S.party=['minji'];h.S.scrap=40;
  assert(!h.G.eventAvailable(robbed,{mode:'local'}));
  assert(!h.G.eventAvailable(opening,{mode:'node',node:'miryang'}));
  for(let visit=0;visit<4;visit++){
    assert(h.G.eventAvailable(trader,{mode:'local'}),'visit '+(visit+1));
    assert(h.G.eligible().some(e=>e.id===trader.id),'the real encounter pool retains the next visit');
    h.G.openEvent(trader,{continuation:true});h.reload();
    assert.equal(h.S.flags.mansu||0,visit,'entry/reload is not a paid visit');
    const text=h.S.pendingPresentation.text;
    assert.match(text,visit===0?/없는 거 빼고/:visit===1?/저번에 봤죠/:new RegExp((visit+1)+'번째'));
    assert(dialogue(h,trader).every(t=>t.who==='mansu'),'trader greeting belongs to Mansu');
    const result=h.choose(trader,visit%2?4:0,true);
    assert.equal(h.S.flags.mansu,visit+1);
    assert.equal(h.S.scrap,40-7*Math.ceil((visit+1)/2));
    assert(result.applied);h.G.queuePresentation();h.reload();
    assert.equal(h.G.eventAvailable(robbed,{mode:'local'}),visit>=1);
    assert.equal(h.G.eventAvailable(opening,{mode:'node',node:'miryang'}),visit>=3);
  }
  assert.equal(h.S.used.filter(id=>id===trader.id).length,1,'history is not erased to permit revisits');
  h.choose(opening,1,true);h.G.queuePresentation();h.reload();
  for(const mode of ['local','road']){
    assert(!h.G.eventAvailable(trader,{mode}),'retired trader does not return on the road');
    assert(!h.G.eventAvailable(robbed,{mode}),'robbery cannot start after retirement');
  }
  assert(h.G.canTravelTo('daegu').ok);
  const ordinary=h.event('meet_waver');h.G.openEvent(ordinary,{continuation:true});
  h.choose(ordinary,2,true);h.G.queuePresentation();
  assert(!h.G.eventAvailable(ordinary,{mode:'local'}),'ordinary scenes still do not repeat');
});
test('Mansu waits for the unresolved robbery before trading or opening, while paid receipts survive',()=>{
  for(const index of [0,1,2]){
    const h=setup();h.S.at='miryang';h.S.party=['kangwoo'];h.S.flags.mansu=4;h.S.scrap=10;
    h.choose(h.event('mansu_robbed'),1,true);h.G.queuePresentation();h.reload();
    assert(h.S.flags.mansu_hurt);
    assert(!h.G.eventAvailable(h.event('meet_trader_truck'),{mode:'local'}));
    assert(!h.G.eventAvailable(h.event('mansu_opening'),{mode:'node',node:'miryang'}));
    const revenge=h.event('mansu_revenge');assert(h.G.eventAvailable(revenge,{mode:'local'}));
    h.choose(revenge,index,true);h.G.queuePresentation();h.reload();
    assert(!h.S.flags.mansu_hurt);assert(h.G.eventAvailable(h.event('meet_trader_truck'),{mode:'local'}));
    assert(h.G.eventAvailable(h.event('mansu_opening'),{mode:'node',node:'miryang'}));
    const trader=h.event('meet_trader_truck');
    assert.equal(h.G.reqOk(trader.choices[3].req).ok,index!==2,'only an actual rescue earns the free favour');
    const visit=h.choose(trader,index===2?4:3,true);
    if(index===2)assert.doesNotMatch(visit.out.text,/뽕짝이 멀어진다|무적인|무사한/);
    h.G.queuePresentation();assert(h.G.canTravelTo('daegu').ok);
  }
  for(const id of ['meet_trader_truck','mansu_robbed']){
    const h=setup(),e=h.event(id);h.choose(e,id==='meet_trader_truck'?4:1,true);
    const text=h.S.pendingPresentation.text;h.S.flags.mansu_shop=true;h.reload();
    const replay=h.G.resolvePresentedChoice(e,e.choices[id==='meet_trader_truck'?4:1]);
    assert(replay.ok&&!replay.applied);assert.equal(replay.out.text,text);
    h.G.queuePresentation();assert(!h.S.pendingPresentation);
  }
});
test('Mansu opening requires a settlement and paid shopping has a no-purchase exit',()=>{
  const pool=setup(),opening=pool.event('mansu_opening');pool.S.party=['minji'];
  pool.S.at='miryang';pool.S.flags.mansu=3;
  assert(!pool.G.eventAvailable(opening,{mode:'node',node:'miryang'}));
  pool.S.flags.mansu=4;
  for(const [id,node] of Object.entries(pool.D.nodes)){
    pool.S.at=id;
    assert.equal(pool.G.eventAvailable(opening,{mode:'node',node:id}),node.type==='settlement',id);
    assert(!pool.G.eventAvailable(opening,{mode:'road',node:id}));
  }
  for(const balance of [0,1,2])for(const buy of [false,true]){
    const h=setup(),e=h.event('mansu_opening');h.S.party=['minji','leo','parkss'];
    h.S.at='miryang';h.S.flags.mansu=4;h.S.scrap=balance;h.S.items['부품']=0;
    h.G.openEvent(e,{continuation:true});h.reload();
    assert.equal(h.S.pendingPresentation.eventId,e.id);
    const before=JSON.stringify(h.S),food=h.S.food;
    if(buy&&balance<2){
      assert(!h.G.resolvePresentedChoice(e,e.choices[0]).ok);
      assert.equal(JSON.stringify(h.S),before);
    }
    const paid=buy&&balance>=2,result=h.choose(e,paid?0:1,true);
    assert.equal(h.S.scrap,balance-(paid?2:0));assert.equal(h.S.food,food+(paid?3:0));
    assert.equal(h.S.items['부품']||0,paid?1:0);assert(h.S.flags.mansu_shop);
    assert.doesNotMatch(result.out.text,/셋이/);
    assert.deepEqual(Array.from(dialogue(h,e,result.out),t=>t.who),
      paid?['mansu','me','me','mansu','mansu','mansu']:['mansu','mansu']);
    h.G.queuePresentation();assert(!h.S.pendingPresentation);
    assert(!h.G.eventAvailable(e,{mode:'node',node:'miryang'}));
    assert(h.G.canTravelTo('daegu').ok);
  }
});
test('already paid Mansu opening receipts retain old text outside the new location and payment gates',()=>{
  const h=setup(),e=h.event('mansu_opening');h.S.party=['minji'];h.S.at='miryang';h.S.scrap=2;
  h.choose(e,0);h.S.pendingPresentation.text='옛 개업식 결과';
  h.S.at='gimhae';h.S.party=[];h.S.scrap=0;h.reload();
  const before=JSON.stringify(h.S),result=h.G.resolvePresentedChoice(e,e.choices[0]);
  assert(result.ok&&!result.applied);assert.equal(result.out.text,'옛 개업식 결과');
  assert.equal(JSON.stringify(h.S),before);
  h.G.queuePresentation();assert(!h.S.pendingPresentation);
});
test('4-0-0 remains reachable solo through either receiver choice and either broadcast-room result',()=>{
  for(const start of [0,2])for(const source of [0,1]){
    const h=setup();h.S.party=[];h.S.at='suwon';h.S.min=600;
    const ids=['freq_catch','freq_triangulate','freq_source','freq_L2'];
    assert(!h.G.eventAvailable(h.event(ids[1]),{mode:'local'}));
    for(const [i,index] of [start,0,source,0].entries()){
      const e=h.event(ids[i]);assert(h.G.eventAvailable(e,{mode:'local'}),e.id);
      h.G.openEvent(e,{continuation:true});h.reload();
      assert.equal(h.S.pendingPresentation.eventId,e.id);
      assert.deepEqual(Array.from(dialogue(h,e)),[],'no unseen companion at '+e.id);
      const result=h.choose(e,index,true);
      assert.deepEqual(Array.from(dialogue(h,e,result.out)),[],'broadcast and writing are not live dialogue');
      if(e.id==='freq_source'&&index===0){
        const turns=h.ctx.buildStoryTurns(result.out.text,e,{turnSpeakers:result.out.turnSpeakers});
        assert.equal(turns.filter(t=>t.kind==='record').length,3);
        assert.match(turns.filter(t=>t.kind==='record').map(t=>t.text).join(' '),/배터리는 2년/);
      }
      if(e.id==='freq_L2'){
        assert.doesNotMatch(e.text,/L의 중계기/);
        assert.doesNotMatch(result.out.fx.note.body,/남산에|그리로 갔다/);
      }
      h.G.queuePresentation();assert(!h.S.pendingPresentation);
    }
    assert(h.S.flags.freq_L2_heard);assert(h.G.canTravelTo('pyeongtaek').ok);
  }
});
test('Eunsu can locate the signal and then leave without stranding the broadcast followup',()=>{
  const h=setup();h.S.at='suwon';h.S.party=['eunsu'];
  for(const id of ['freq_catch','freq_triangulate']){
    const e=h.event(id);assert(h.G.reqOk(e.choices[1].req).ok);
    const result=h.choose(e,1,true);
    assert.deepEqual(Array.from(dialogue(h,e,result.out),t=>t.who),
      id==='freq_catch'?['eunsu','me','eunsu']:['eunsu','eunsu']);
    h.G.queuePresentation();
  }
  h.S.party=[];h.reload();assert(h.G.eventAvailable(h.event('freq_source'),{mode:'local'}));
  h.choose(h.event('freq_source'),1,true);h.G.queuePresentation();
  assert(h.G.eventAvailable(h.event('freq_L2'),{mode:'local'}));
});
test('both book recovery outcomes supply the titles celebrated at the later handoff',()=>{
  for(const variant of [0,1]){
    const h=setup(),e=h.event('lib_books');h.S.party=[];h.S.flags.library_quest=true;
    h.G.pickOutcome=(event,choice)=>choice.out[variant]||choice.out[0];
    const found=h.choose(e,0,true);assert.match(found.out.text,/무협지/);
    assert.equal(h.S.items['책 꾸러미'],1);assert(h.S.flags.library_books);
    h.G.queuePresentation();h.G.pickOutcome=(event,choice)=>choice.out[0];
    const handed=h.choose(h.event('lib_return'),0,true);
    assert.match(handed.out.text,/무협지/);assert(h.S.flags.library_done);
    assert(!h.S.items['책 꾸러미']);h.G.queuePresentation();assert(!h.S.pendingPresentation);
  }
});
test('night rounds preserve the current night and only the two present companions speak',()=>{
  for(const party of [['parkss','kangwoo'],['parkss','kangwoo','minji','leo']]){
    const h=setup(),e=h.event('duo_nightround');h.S.party=party;h.S.min=1320;
    assert(h.G.eventAvailable(e,{mode:'local'}));
    assert.deepEqual(Array.from(dialogue(h,e),t=>t.who),['kangwoo','parkss','kangwoo']);
    const result=h.choose(e,0,true);assert.equal(h.S.min,1320);assert.equal(h.S.day,1);
    assert.doesNotMatch(result.out.text,/아침에|전원|쟤들|한 장씩/);
    assert.match(result.out.text,/발끝에 담요 한 장/);
    assert.deepEqual(Array.from(dialogue(h,e,result.out),t=>t.who),
      ['parkss','kangwoo','parkss','kangwoo','parkss','kangwoo','parkss','kangwoo']);
    h.G.queuePresentation();assert(!h.S.pendingPresentation);
  }
  const missing=setup(),e=missing.event('duo_nightround');missing.S.min=1320;
  for(const party of [[],['parkss'],['kangwoo']]){
    missing.S.party=party;assert(!missing.G.eventAvailable(e,{mode:'local'}));
  }
});
test('solo rooftop planting records seeds, not nonexistent helpers or grown lettuce',()=>{
  const h=setup(),e=h.event('seed_harvest');h.S.party=[];h.S.flags.seed_borrowed=true;
  assert(!h.G.reqOk(e.choices[1].req).ok);h.S.up.garden=1;
  const result=h.choose(e,1,true);
  assert.match(result.out.text,/아직 싹도 없는/);
  assert.match(result.out.fx.note.body,/아직 싹은 없고/);
  assert.doesNotMatch(result.out.fx.note.body,/여럿|과보호|수확/);
  h.G.queuePresentation();assert(!h.S.pendingPresentation);assert(h.S.flags.seed_grown);
});
test('speaker recovery returns to the introduced Mansu without inventing later journeys',()=>{
  for(const index of [0,1,2])for(const minute of [600,1320]){
    const h=setup();h.S.at='miryang';h.S.min=minute;h.S.scrap=20;
    h.S.party=index===0?['kangwoo']:[];
    const e=h.event('mansu_revenge');
    assert(!h.G.eventAvailable(e,{mode:'local'}));
    h.S.flags.mansu_hurt=true;assert(h.G.eventAvailable(e,{mode:'local'}));
    assert.match(read(e.text,h.S),/입구에는 만수의 탑차/);
    const result=h.choose(e,index,true);
    assert.equal(h.S.min,minute);assert.equal(h.S.at,'miryang');
    assert(!h.S.flags.mansu_hurt);
    assert.equal(!!h.S.flags.mansu_saved,index!==2);
    assert.doesNotMatch(result.out.text,/그 뒤로 만난|돌아가는 길|어둠에서/);
    if(index===0)assert.match(result.out.text,/만수에게 건넸다/);
    const roles=dialogue(h,e,result.out).map(t=>t.who);
    assert.deepEqual(Array.from(roles),index===0?['kangwoo','passer_man','kangwoo']:
      index===1?['me','passer_man','me','passer_man']:['me']);
    h.G.queuePresentation();assert(!h.S.pendingPresentation);
    assert(!h.G.eventAvailable(e,{mode:'local'}));
    assert(h.G.canTravelTo('yangsan').ok||h.G.canTravelTo('daegu').ok);
  }
});
test('Soyeon disembarks only at a real settlement and old paid roadside receipts still resume',()=>{
  const h=setup(),e=h.event('deserter_farewell');h.S.party=[];h.S.flags.deserter_hidden=true;
  for(const [id,node] of Object.entries(h.D.nodes)){
    h.S.at=id;h.S.driving=null;
    assert.equal(h.G.eventAvailable(e,{mode:'node',node:id}),node.type==='settlement',id);
    assert(!h.G.eventAvailable(e,{mode:'road',node:id}),id+' road');
  }
  h.S.at='daejeon';h.S.min=720;h.reload();
  assert(h.G.eventAvailable(e,{mode:'node',node:'daejeon'}));
  assert.match(read(e.text,h.S),/정착지에 차를 세우자/);
  assert.deepEqual(Array.from(dialogue(h,e),t=>t.who),['seoyeon','seoyeon','me','seoyeon']);
  const result=h.choose(e,0,true);assert(h.S.flags.deserter_saved);
  assert.doesNotMatch(read(e.text,h.S)+result.out.text,/여러분/);
  assert(!h.S.flags.deserter_hidden);assert.equal(h.S.min,720);
  assert.deepEqual(Array.from(dialogue(h,e,result.out),t=>t.who),['seoyeon','seoyeon']);
  h.G.queuePresentation();assert(!h.S.pendingPresentation);
  assert(h.G.canTravelTo('sejong').ok);
  const old=setup(),legacy=old.event('deserter_farewell');old.S.at='gimhae';
  old.S.flags.deserter_hidden=true;old.choose(legacy,0);
  old.S.pendingPresentation.text='옛 결과: 소연이 정착지 인파 속으로 사라졌다.';
  old.reload();const replay=old.G.resolvePresentedChoice(legacy,legacy.choices[0]);
  assert(replay.ok&&!replay.applied);assert.match(replay.out.text,/옛 결과/);
});
test('library copying completes within its charged hours without inventing a tournament loss',()=>{
  for(const index of [0,1])for(const party of [[],['leo','minji']]){
    const h=setup();h.S.at='daejeon';h.S.min=480;h.S.party=party;
    const e=h.event('library_scribe');assert(!h.G.eventAvailable(e,{mode:'local'}));
    h.S.flags.library_done=true;assert(h.G.eventAvailable(e,{mode:'local'}));
    assert.doesNotMatch(read(e.text,h.S),/세 번째/);
    const result=h.choose(e,index,true);
    assert.equal(h.S.min,480+(index===0?300:240));assert(h.S.flags.library_scribed);
    assert.doesNotMatch(result.out.text,/하룻밤|가위바위보|참패/);
    assert.match(result.out.text,/원본을.*돌려줬다/);
    assert.match(result.out.fx.note.body,/앞부분|각주/);
    assert.deepEqual(Array.from(dialogue(h,e,result.out),t=>t.who),index===0?
      ['hanbyeol','hanbyeol','me','hanbyeol','hanbyeol','hanbyeol']:['hanbyeol']);
    h.G.queuePresentation();assert(!h.S.pendingPresentation);
    assert(!h.G.eventAvailable(e,{mode:'local'}));assert(h.G.canTravelTo('sejong').ok);
  }
  const old=setup(),e=old.event('library_scribe');old.choose(e,1);
  old.S.pendingPresentation.text='옛 결과: 가위바위보 참패는 각주 처리하는 조건으로.';
  old.reload();const replay=old.G.resolvePresentedChoice(e,e.choices[1]);
  assert(replay.ok&&!replay.applied);assert.match(replay.out.text,/옛 결과.*참패/);
});
test('settlement exploration reaches Soyeon and resumes the unpaid stop before a single farewell',()=>{
  const h=setup(),e=h.event('deserter_farewell');h.D.events=[e];
  h.G.mainEvidenceOpportunity=()=>null;
  h.S.party=[];h.S.at='daejeon';h.S.min=600;h.S.flags.deserter_hidden=true;
  assert(h.G.explore());assert.equal(h.S.pendingPresentation.eventId,e.id);
  assert(!h.S.flags.deserter_saved);const minute=h.S.min;
  h.reload();assert(h.G.resumePresentation());assert.equal(h.shown.at(-1),e.id);
  assert(!h.S.flags.deserter_saved);assert.equal(h.S.min,minute);
  h.choose(e,0,true);assert(h.S.flags.deserter_saved);
  assert.equal(h.S.min,minute);h.G.queuePresentation();assert(!h.S.pendingPresentation);
  assert(!h.G.nodeEvents('daejeon').some(row=>row.id===e.id));
  assert(h.G.canTravelTo('sejong').ok);
});
test('detour aftermath waits for a real later morning and an actual night camp',()=>{
  for(const choice of [0,1,2,3]){
    const h=setup();h.S.party=['kangwoo','parkss'];h.S.at='miryang';h.S.min=600;
    h.S.fuel=70;h.S.food=24;h.S.water=28;h.S.items['의약품']=1;
    const first=h.event('conflict_fuel_detour');h.choose(first,choice,true);
    const minute=h.S.min,day=h.S.day;
    assert.equal(h.G.queuePresentation(),null);
    assert(!h.S.pendingPresentation);assert.equal(h.S.min,minute);
    const due=(day+1)*1440+390;
    assert.deepEqual(plain(h.S.timedStories),[{id:'conflict_silent_cab',due}]);
    h.reload();assert(!h.G.resumePresentation());assert.notEqual(h.G.popStory(),'conflict_silent_cab');
    assert.equal(h.S.timedStories[0].due,due);
    // Sleeping in a settlement uses the real engine clock and morning meals.
    h.G.maybeCrisis=()=>false;h.G.camp();
    assert.equal(h.S.day,day+1);assert.equal(h.S.min,390);
    assert.equal(h.S.pendingPresentation.eventId,'conflict_silent_cab');
    h.choose(h.event('conflict_silent_cab'),1,true);
    assert.equal(h.G.queuePresentation(),null);assert(!h.S.pendingPresentation);
    h.reload();assert.notEqual(h.G.popStory(),'conflict_campfire');
    h.G.advance(750);assert.equal(h.S.min,1170);
    assert.notEqual(h.G.popStory(),'conflict_campfire','a night arrival alone is not a fireside');
    const campDay=h.S.day;h.G.camp();
    assert.equal(h.S.day,campDay);assert.equal(h.S.min,1170,'scene before sleep');
    assert.equal(h.S.pendingPresentation.eventId,'conflict_campfire');
    h.choose(h.event('conflict_campfire'),1,true);h.G.queuePresentation();
    assert(h.S.flags.conflict_resolved);assert(!h.S.pendingPresentation);
    assert(!h.G.popTimedStory('camp'));assert.equal(h.S.timedStories.length,0);
    h.G.camp();assert.equal(h.S.min,390);assert.equal(h.S.day,campDay+1);
  }
});
test('missed windows and absent companions retain deferred scenes without blocking other stories',()=>{
  const h=setup();h.S.party=['kangwoo','parkss'];h.S.pendingPresentation=null;
  h.G.deferTimedStory('conflict_silent_cab');const due=h.S.timedStories[0].due;
  h.S.day=2;
  for(const minute of [389.99,660,1200]){
    h.S.min=minute;h.reload();assert.notEqual(h.G.popStory(),'conflict_silent_cab');
    assert.equal(h.S.timedStories[0].due,due);
  }
  h.S.min=390;h.S.party=['kangwoo'];assert.notEqual(h.G.popStory(),'conflict_silent_cab');
  h.S._storyQueue=[];
  h.G.queueStory('onboarding_first_road');
  assert.equal(h.G.popStory(),'onboarding_first_road','pending actor does not block unrelated queue');
  assert.equal(h.S.timedStories.length,1);h.reload();
  h.S.day=3;h.S.min=659.99;h.S.party=['kangwoo','parkss'];
  h.S.driving={to:'yangsan'};assert(!h.G.popTimedStory());h.S.driving=null;
  assert.equal(h.G.popStory(),'conflict_silent_cab');
  assert.equal(h.S.timedStories.length,0);
  h.G.openEventById('conflict_silent_cab');h.reload();
  assert(h.G.resumePresentation());assert.equal(h.S.pendingPresentation.phase,'event');
  assert.doesNotMatch(read(h.event('conflict_silent_cab').text,h.S),/이튿날|어제/);
});
test('legacy immediate transitions are deferred, while paid results remain frozen',()=>{
  const h=setup();h.S.party=['kangwoo','parkss'];h.S.min=600;
  h.S.pendingPresentation={version:1,phase:'transition',eventId:'conflict_silent_cab'};
  h.reload();assert(!h.G.resumePresentation());assert(!h.S.pendingPresentation);
  const due=h.S.timedStories[0].due;
  h.G.queueStory('conflict_silent_cab');assert.notEqual(h.G.popStory(),'conflict_silent_cab');
  assert.equal(h.S.timedStories.length,1);assert.equal(h.S.timedStories[0].due,due);
  h.choose(h.event('conflict_silent_cab'),1);
  h.S.pendingPresentation.text='옛 결과: 어제 일을 이야기하며 아침을 먹었다.';
  h.S.party=[];h.S.food=0;h.S.min=1200;h.reload();
  const replay=h.G.resolvePresentedChoice(h.event('conflict_silent_cab'),h.event('conflict_silent_cab').choices[1]);
  assert(replay.ok&&!replay.applied);assert.match(replay.out.text,/옛 결과/);
});
test('hose repairs and the full conflict chain always retain a no-supply exit',()=>{
  for(const [id,index,reqs,fallback,outcomes] of [
    ['crisis_hose',0,[['부품',1]],2,2],
    ['conflict_fuel_detour',0,[['fuel',8]],3,1],
    ['conflict_fuel_detour',1,[['의약품',1]],3,1],
    ['conflict_fuel_detour',2,[['fuel',4],['의약품',1]],3,1],
    ['conflict_silent_cab',0,[['food',1]],1,1],
    ['conflict_campfire',0,[['water',1]],1,1]
  ])for(let oi=0;oi<outcomes;oi++){
    const h=setup(),e=h.event(id);h.S.party=['kangwoo','parkss'];h.S.min=390;h.S.at='miryang';
    const set=(key,n)=>{if(['부품','의약품'].includes(key))h.S.items[key]=n;else h.S[key]=n;};
    for(const [key,n] of reqs)set(key,n);
    h.G.openEvent(e,{continuation:true});
    for(const [key,n] of reqs){
      set(key,n-1);h.reload();const before=JSON.stringify(h.S);
      assert(!h.G.resolvePresentedChoice(e,e.choices[index]).ok,id+' missing '+key);
      assert.equal(JSON.stringify(h.S),before);set(key,n);
    }
    h.G.pickOutcome=(event,choice)=>choice.out[oi];h.choose(e,index,true);
    for(const [key] of reqs)set(key,0);h.reload();
    const replay=h.G.resolvePresentedChoice(e,e.choices[index]);
    assert(replay.ok&&!replay.applied);h.G.queuePresentation();assert(!h.S.pendingPresentation);
    const f=setup(),fe=f.event(id);f.S.party=['kangwoo','parkss'];f.S.fuel=0;f.S.food=0;f.S.water=0;
    f.S.items['부품']=0;f.S.items['의약품']=0;
    f.choose(fe,fallback,true);f.G.queuePresentation();assert(!f.S.pendingPresentation);
    assert.equal(f.S.items['부품'],0);assert.equal(f.S.items['의약품'],0);
  }
});
test('the actual reader preserves the conflict participants and both free aftermath choices',()=>{
  const h=setup();h.S.party=['kangwoo','parkss'];const e=h.event('conflict_fuel_detour');
  assert.deepEqual(Array.from(dialogue(h,e),t=>t.who),['passer_child','me','passer_child','kangwoo','parkss','kangwoo','parkss']);
  for(const [id,index,who] of [
    ['conflict_fuel_detour',1,['me','me','parkss']],
    ['conflict_fuel_detour',2,['me','parkss','kangwoo']],
    ['conflict_fuel_detour',3,['me','parkss','kangwoo']],
    ['conflict_silent_cab',1,['me','parkss','kangwoo']],
    ['conflict_campfire',1,['kangwoo','parkss']]
  ])assert.deepEqual(Array.from(dialogue(h,h.event(id),h.event(id).choices[index].out[0]),t=>t.who),who);
});
test('the dawn broadcast has a real entry window and cannot invent a solo driver change or sunrise',()=>{
  const h=setup(),e=h.event('ai_broadcast');h.S.at='suwon';h.S.party=[];h.S.pursuit=1;
  h.S.pendingPresentation=null;
  for(const minute of [0,239.99,330,600,1170,1439]){
    h.S.min=minute;assert(!h.G.eventAvailable(e,{mode:'local'}));
    assert(!h.G.eligible().some(row=>row.id===e.id));assert(!h.S.used.includes(e.id));
  }
  for(const minute of [240,300,329.99]){
    h.S.min=minute;assert(h.G.eventAvailable(e,{mode:'local'}));
    h.S.driving={from:'suwon',to:'seoul',gone:1,dist:20};h.S.at=null;
    assert(h.G.eventAvailable(e,{mode:'road'}));h.S.driving=null;h.S.at='suwon';
  }
  assert.doesNotMatch(e.text,/교대/);
  for(const index of [0,1]){
    const f=setup(),fe=f.event('ai_broadcast');f.S.party=[];f.S.min=240;
    const out=f.choose(fe,index,true).out;assert.equal(f.S.min,240);
    assert.doesNotMatch(out.text,/해가 뜰 때까지|아무도/);
    f.S.min=720;f.reload();const result=f.G.resolvePresentedChoice(fe,fe.choices[index]);
    assert(result.ok&&!result.applied);assert.equal(f.S.min,720);
    f.G.queuePresentation();assert(!f.S.pendingPresentation);
  }
});
test('photographs arrive without Bori or the original crew, with once-only saved effects',()=>{
  for(const dog of [false,true]){
    const h=setup(),e=h.event('meet_photographer'),delivery=h.event('photo_delivered');
    h.S.at='daejeon';h.S.party=['minji'];h.S.dog=dog;h.S.pendingPresentation=null;
    assert(!h.G.eventAvailable(delivery,{mode:'local'}),'no photograph taken yet');
    const photo=h.choose(e,0,true).out;
    assert.equal(photo.text.includes('보리는 맨 앞'),dog);
    assert.doesNotMatch(photo.text,/있다면/);
    assert.deepEqual(Array.from(dialogue(h,e,photo),t=>t.who),['passer_elder','me','passer_elder']);
    h.G.queuePresentation();h.S.party=[];h.S.dog=false;h.reload();
    assert(h.G.eventAvailable(delivery,{mode:'local'}),'solo delivery after crew leaves');
    assert.doesNotMatch(read(delivery.text,h.S),/보리|개 타고/);
    h.S.dog=true;assert.match(read(delivery.text,h.S),/보리가 창문/);
    h.S.dog=false;
    const before=h.S.min,out=h.choose(delivery,0,true).out;
    assert.equal(h.S.min,before,'receipt does not invent elapsed travel');
    assert.doesNotMatch(out.text,/곰 뒤|안 감았어/);
    assert.deepEqual(Array.from(dialogue(h,delivery,out),t=>t.who),['me','me']);
    assert(h.S.flags.photo_received);h.G.queuePresentation();
    assert(!h.S.pendingPresentation);assert(!h.G.eventAvailable(delivery,{mode:'local'}));
  }
  const h=setup(),e=h.event('photo_delivered');h.S.flags.photo_film=true;
  h.choose(e,0);h.S.pendingPresentation.text='옛 결과: 대시보드 곰 뒤에 사진을 붙였다.';
  h.reload();const old=h.G.resolvePresentedChoice(e,e.choices[0]);
  assert(old.ok&&!old.applied);assert.match(old.out.text,/곰 뒤/);
});

test('the managed greenhouse keeps its warning without inventing a solo crew',()=>{
  const h=setup(),e=h.event('exp_glasshouse');h.S.party=[];
  h.G.pickOutcome=(event,choice)=>choice.out[1];
  const result=h.choose(e,0,true);
  assert.doesNotMatch(result.out.text,/다 같이/);assert.equal(result.out.fx.pursuit,1);
  assert.match(result.out.text,/금일 수확량이 기록되었습니다/);
  h.G.queuePresentation();assert(!h.S.pendingPresentation);
});

test('Sejong library uses its actual city and roster without inventing a librarian meeting',()=>{
  for(const party of [['minji'],['minji','kangwoo','eunsu'],['minji','kangwoo','eunsu','leo','jaeyi','parkss']]){
    const h=setup(),e=h.event('lc_sejong_library');h.S.party=party;h.S.pendingPresentation=null;
    assert.deepEqual(plain(h.G.eventLocation(e)),{kind:'node',nodes:['sejong']});
    for(const at of ['sejong','gongju','gimhae']){
      h.S.at=at;assert.equal(h.G.eventAvailable(e,{mode:'node',node:at}),at==='sejong');
    }
    h.S.at='sejong';h.G.openEvent(e,{continuation:true});h.reload();
    const out=h.choose(e,0,true).out;
    assert.match(out.text,/한 사람씩 이름/);
    for(const text of [out.text,out.fx.note.body]){
      assert.doesNotMatch(text,/4번|네 명|사서|영감|책의 터널/);
    }
    assert.equal(out.fx.moodAll,7);
    assert.deepEqual(Array.from(dialogue(h,e,out),t=>t.who),['me']);
    h.G.queuePresentation();assert(!h.S.pendingPresentation);
    assert(!h.G.eventAvailable(e,{mode:'node',node:'sejong'}));
  }
  const h=setup(),e=h.event('lc_sejong_library');h.S.at='sejong';h.S.party=[];
  assert(!h.G.eventAvailable(e,{mode:'node',node:'sejong'}),'existing group gate unchanged');
  h.S.party=['minji'];h.choose(e,0);
  h.S.pendingPresentation.text='대출 카드 1~4번에 우리 이름.';
  h.S.party=[];h.S.at='gongju';h.reload();
  const replay=h.G.resolvePresentedChoice(e,e.choices[0]);
  assert(replay.ok&&!replay.applied);
  assert.equal(replay.out.text,'대출 카드 1~4번에 우리 이름.','historical result remains frozen');
});

test('parcel delivery follows its Suwon clue and works solo without rewriting paid receipts',()=>{
  for(const party of [[],['minji']]){
    const h=setup(),e=h.event('parcel_found');h.S.party=party;h.S.pendingPresentation=null;
    assert.deepEqual(plain(h.G.eventLocation(e)),{kind:'node',nodes:['suwon']});
    assert.deepEqual(Array.from(dialogue(h,e),t=>t.who),['me','passer_man','me','passer_man']);
    assert.deepEqual(Array.from(dialogue(h,e,e.choices[0].out[0]),t=>t.who),['passer_woman','me']);
    h.S.at='suwon';assert(!h.G.eventAvailable(e,{mode:'node',node:'suwon'}));
    h.S.flags.parcel_lead=true;
    for(const at of ['gimhae','pyeongtaek','seoul','suwon']){
      h.S.at=at;
      assert.equal(h.G.eventAvailable(e,{mode:'node',node:at}),at==='suwon',at);
    }
    h.G.openEvent(e,{continuation:true});h.reload();
    const result=h.choose(e,0,true);
    assert.match(result.out.text,/내가 조용히 말했다/);
    assert(h.S.flags.parcel_done);assert(!h.S.flags.parcel_lead);
    assert(!h.G.eventAvailable(e,{mode:'node',node:'suwon'}));
    h.G.queuePresentation();assert(!h.S.pendingPresentation);
  }
  const h=setup(),e=h.event('parcel_found');h.S.at='seoul';h.S.flags.parcel_lead=true;
  h.choose(e,0);h.S.pendingPresentation.text='이전에 저장된 배송 결과';h.reload();
  const restored=h.G.resolvePresentedChoice(e,e.choices[0]);
  assert(restored.ok&&!restored.applied);assert.equal(restored.out.text,'이전에 저장된 배송 결과');
});

test('detour mileage cannot move local evidence to Suwon; actual northern recovery remains available',()=>{
  for(const km of [369,370,900]){
    const h=setup();h.S.at='yangsan';h.S.driving=null;h.S.stats.km=km;
    h.S.flags.first_order_trace=false;
    const before=JSON.stringify(h.S);
    assert.equal(h.G.mainEvidenceOpportunity().target,'yangsan');
    assert.equal(h.G.mainEvidenceOpportunity().event,'onboarding_first_road');
    assert.equal(JSON.stringify(h.S),before,'guidance is read-only');
    assert.equal(h.G.exploreStatus().mainEvidence.event,'onboarding_first_road');
    h.reload();
    assert.equal(h.G.mainEvidenceOpportunity().target,'yangsan');
    assert(h.G.explore());
    assert.equal(h.S.pendingPresentation.eventId,'onboarding_first_road');
    h.choose(h.event('onboarding_first_road'),0,true);
    h.G.queuePresentation();
    assert.notEqual(h.G.mainEvidenceOpportunity().id,'trace');
  }
  for(const at of ['suwon','seoul']){
    const h=setup();h.S.at=at;h.S.driving=null;h.S.stats.km=100;
    h.S.flags.first_order_trace=false;
    const op=h.G.mainEvidenceOpportunity();
    assert.equal(op.target,'suwon');
    assert.equal(op.event,'main_recovery_onboarding_first_road');
    h.reload();assert.equal(h.G.mainEvidenceOpportunity().event,op.event);
  }
});
test('Jaeyi brace memory repairs existing frame without resurrecting the consumed support',()=>{
  const h=setup(),e=h.D.events.find(e=>e.id==='rq_jaeyi_task');
  const out=e.choices[1].out[0];
  assert.equal(out.fx.item['부품'],-1);
  assert.match(out.text,/받침은 천장 아래서 납작해졌다/);
  h.S.party=['jaeyi'];h.S.comps.jaeyi.approach='brace';
  h.S.van=70;h.S.vanMax=100;
  const drive={slots:[]};
  const memory=h.G.prepareRecruitMemory(drive);
  assert.doesNotMatch(memory.desc,/창고에서 쓴 받침|다시 맞춰/);
  assert.equal(h.S.van,74);
  assert.equal(drive.memoryVan,4);
  h.reload();
  assert.equal(h.G.prepareRecruitMemory({slots:[]}),null);
  assert.equal(h.S.van,74);
});
test('Mingyu reunion stays at the ridge at morning and night across paid reload',()=>{
  for(const minute of [480,1320]){
    const h=setup();h.S.at='mingyu_ridge';h.S.driving=null;h.S.party=['minji'];h.S.min=minute;
    const e=h.D.events.find(e=>e.id==='loc_mingyu');
    h.choose(e,0,true);
    assert.equal(h.S.at,'mingyu_ridge');assert.equal(h.S.driving,null);
    assert.equal(h.S.min,minute);assert(h.S.flags.mingyu_reunion);
    assert.doesNotMatch(e.choices[0].out[0].text,/해가 기울|백미러/);
  }
});
test('Leo joins the truckers without advancing an unrestricted daytime encounter to night',()=>{
  for(const minute of [480,1320]){
    const h=setup();h.S.at='daejeon';h.S.driving=null;h.S.party=['leo'];h.S.min=minute;
    const e=h.event('leo_father_song'),result=h.choose(e,1,true);
    assert.equal(h.S.min,minute);assert.equal(h.S.at,'daejeon');
    assert(h.S.flags.leo_father_song);
    assert.doesNotMatch(result.out.text,/그날 밤/);
    assert.match(result.out.text,/옆으로 비켜 앉았다/);
    assert.match(result.out.text,/5톤 윙바디/);
    const replay=h.G.resolvePresentedChoice(e,e.choices[1]);
    assert(replay.ok&&!replay.applied);assert.equal(replay.out.text,result.out.text);
    h.G.queuePresentation();assert.equal(h.S.pendingPresentation,null);
  }
});
test('regional chain copy allows distant or southbound destinations without expiry',()=>{
  const h=setup();
  for(const def of h.D.storyQuestChains){
    for(let stage=1;stage<=def.steps.length;stage++){
      const q=h.G.makeStoryQuest(def,stage,'suwon','miryang','suwon');
      assert.equal(q.to,'miryang');assert.equal(q.noExpiry,true);
      assert.doesNotMatch(h.G.questDesc(q),/옆 마을|옆 진료소|더 북쪽|얼음이 다 녹기|신호가 바뀌기 전에/);
      h.G.acceptQuest(q);h.reload();
      assert.equal(h.S.quest.story.prompt,def.steps[stage-1].prompt);
      assert.equal(h.S.quest.noExpiry,true);
    }
  }
  assert.equal(h.D.storyQuestChains.find(d=>d.id==='clinic').steps[0].item,'밀봉 약품 상자');
});
test('memorial song chat requires the completed performance, not just knowing the massacre',()=>{
  const h=setup(),chat=h.D.chats.find(c=>c.lines[0][1]==='형. 위령비 이름들, 제가 노래로 만들었어요.');
  assert.equal(chat.need.flag,'leo_names_song');
  h.D.chats=[chat];h.S.party=['leo','kangwoo'];h.S.flags.massacre_known=true;
  assert.equal(h.G.pickChat(),null);
  const e=h.D.events.find(e=>e.id==='react_mass_leo');
  h.choose(e,0,true);
  assert.equal(h.G.pickChat(),chat);
});
test('physical memorial reactions stay at the ridge and remain available to later recruits',()=>{
  const ids=['react_mass_pss','react_mass_kw','react_mass_leo','react_mass_jy','react_mass_es'];
  for(const id of ids){
    const h=setup(),e=h.event(id);
    assert.deepEqual(plain(h.D.eventLocations[id]),{kind:'node',nodes:['daegwallyeong']});
    h.S.flags.massacre_known=true;h.S.party=[e.needsComp];h.S.at='daejeon';
    assert(!h.G.eventAvailable(e,{mode:'local'}));
    assert(!h.G.eventAvailable(e,{mode:'road'}));
    assert(!h.G.eventAvailable(e,{mode:'node',node:'daejeon'}));
    h.S.at='daegwallyeong';h.S.party=[];
    assert(!h.G.nodeEvents(h.S.at).some(x=>x.id===id));
    h.S.party=[e.needsComp];h.reload();
    assert(h.G.nodeEvents(h.S.at).some(x=>x.id===id));
    const minute=h.S.min,result=h.choose(e,0,true);
    assert.equal(h.S.min,minute);
    h.S.at='daejeon';h.reload();
    const replay=h.G.resolvePresentedChoice(e,e.choices[0]);
    assert(replay.ok&&!replay.applied);assert.equal(replay.out.text,result.out.text);
    assert.equal(h.G.queuePresentation(),undefined);
    assert.equal(h.S.pendingPresentation,null);
    assert(!h.G.nodeEvents('daegwallyeong').some(x=>x.id===id));
  }
  const h=setup(),mj=h.event('react_mass_mj');h.S.party=['minji'];h.S.flags.massacre_known=true;
  assert(h.G.eventAvailable(mj,{mode:'local'}));
  assert.doesNotMatch(mj.text,/대관령 이후/);
});
test('ridge exploration actually opens a memorial reaction and resumes its unpaid choice',()=>{
  const h=setup(),e=h.event('react_mass_leo');
  h.D.events=[e];h.G.mainEvidenceOpportunity=()=>null; // Isolate the existing local-action route.
  h.S.at='daegwallyeong';h.S.driving=null;h.S.party=['leo'];
  h.S.flags.massacre_known=true;h.S.min=600;h.S.fatigue=0;
  assert(h.G.explore());assert.equal(h.S.pendingPresentation.eventId,e.id);
  assert(!h.S.flags.leo_names_song);
  h.reload();assert(h.G.resumePresentation());
  assert.equal(h.shown.at(-1),e.id);
  h.choose(e,0,true);assert(h.S.flags.leo_names_song);
  assert.equal(h.G.queuePresentation(),undefined);
  assert.equal(h.S.pendingPresentation,null);
});
test('Eunsu recognizes Ghost code only after its source and preserves paid receipts',()=>{
  const h=setup(),e=h.event('react_resist_es');h.S.party=['eunsu'];h.S.at='daejeon';
  h.S.flags.resist_revealed=true;
  assert(!h.G.eventAvailable(e,{mode:'local'}));
  h.S.used.push('cell_ghost_meet');
  assert(!h.G.eventAvailable(e,{mode:'local'}),'opening a meeting is not its completed code disclosure');
  h.S.flags.cell_ghost=true;
  assert(h.G.eventAvailable(e,{mode:'local'}));
  const result=h.choose(e,0,true);
  delete h.S.flags.cell_ghost;h.reload();
  const replay=h.G.resolvePresentedChoice(e,e.choices[0]);
  assert(replay.ok&&!replay.applied);assert.equal(replay.out.text,result.out.text);
});
test('Kangwoo offers rest without inventing a driving leg, sleep duration or a two-person roster',()=>{
  for(const minute of [720,1320])for(const party of [['kangwoo'],['kangwoo','minji','leo']]){
    const h=setup();h.S.party=party;h.S.comps.kangwoo.bond=20;h.S.fatigue=50;
    h.S.min=minute;h.S.driving=null;h.S.at='busan';
    const e=h.event('talk_kw_10');assert(h.G.eventAvailable(e,{mode:'local'}));
    const result=h.choose(e,0,true);
    assert.equal(h.S.driving,null);assert.equal(h.S.at,'busan');assert.equal(h.S.min,minute);
    assert.equal(h.S.fatigue,35);
    assert.doesNotMatch(e.text+result.out.text,/운전|낮잠|둘인 거다|덮고 잤다/);
    h.G.queuePresentation();assert.equal(h.S.pendingPresentation,null);
  }
});
test('pausing the lyric session is a present break rather than a completed day',()=>{
  const h=setup();h.G.doRecruit('leo');h.S.min=720;
  const e=h.event('talk_leo_07');assert(h.G.eventAvailable(e,{mode:'local'}));
  const result=h.choose(e,1,true);assert.equal(h.S.min,720);
  assert.match(result.out.text,/잠깐 가사 생각을 접었다/);
  h.G.queuePresentation();assert.equal(h.S.pendingPresentation,null);
});
test('Leo joins with Bori and harmonica conversations do not require a random introduction order',()=>{
  for(const order of [['talk_leo_03','talk_leo_08'],['talk_leo_08','talk_leo_03']])for(const learned of [false,true]){
    const h=setup();assert.equal(h.S.dog,false);assert(h.G.doRecruit('leo'));
    assert.equal(h.S.dog,true);h.reload();assert.equal(h.S.dog,true);
    h.S.comps.leo.bond=20;h.S.flags.leo_father_song=learned;
    for(const id of order){
      const e=h.event(id);assert(h.G.eventAvailable(e,{mode:'local'}));
      assert.doesNotMatch(e.text,/처음 보는|다시 나왔다|이번엔/);
      const result=h.choose(e,0,true);
      assert.doesNotMatch(result.out.text,/뒤는 몰라요/);
      h.G.queuePresentation();assert.equal(h.S.pendingPresentation,null);
    }
  }
});
test('Kangwoo conversations allow a two-person daytime crew without an unseen cook or night',()=>{
  for(const [id,index] of [['talk_kw_05',0],['talk_kw_05',1],['talk_kw_09',0]]){
    const h=setup(),e=h.event(id);h.S.party=['kangwoo'];h.S.comps.kangwoo.bond=20;
    h.S.min=720;h.S.dog=false;assert(h.G.eventAvailable(e,{mode:'local'}));
    assert.doesNotMatch(e.text,/저녁 당번/);
    const result=h.choose(e,index,true);
    assert.doesNotMatch(result.out.text,/뒷자리에서 누가/);
    assert.deepEqual(plain(h.S.party),['kangwoo']);assert.equal(h.S.min,720);
    h.G.queuePresentation();assert.equal(h.S.pendingPresentation,null);
  }
});
test('Eunsu can hear the completed worm rescue story after joining later',()=>{
  const h=setup();h.S.party=['minji'];h.S.dog=true;h.S.wx='rain';
  const rescue=h.event('wx_worms');h.choose(rescue,0,true);
  assert(h.S.flags.worm_rescue_done);assert(!h.S.party.includes('eunsu'));
  h.G.queuePresentation();
  h.S.party=['eunsu','leo'];h.S.comps.eunsu.bond=20;
  const e=h.event('talk_es_15');assert(h.G.eventAvailable(e,{mode:'local'}));
  assert.match(e.text,/옮겼다는 게 진짜예요/);
  const result=h.choose(e,0,true);
  assert.doesNotMatch(result.out.text,/제가 셌어요|그날처럼|시상식/);
  assert.match(result.out.text,/웃음을 터뜨렸다/);
  h.G.queuePresentation();assert.equal(h.S.pendingPresentation,null);
});
test('recorded rain session and quiet maintenance do not assert current dawn or end the storm',()=>{
  for(const [id,wx] of [['pair_leo_es_1','clear'],['talk_kw_07','clear'],['talk_es_11','storm']]){
    const h=setup(),e=h.event(id);h.S.party=['leo','eunsu','kangwoo'];h.S.comps.kangwoo.bond=20;
    h.S.at='busan';h.S.min=720;h.S.wx=wx;
    assert(h.G.eventAvailable(e,{mode:'local'}),id);
    const result=h.choose(e,0,true);
    assert.equal(h.S.min,720);assert.equal(h.S.wx,wx);
    assert.doesNotMatch(result.out.text,/30분 뒤|오늘 비 오는|오늘 새벽|04:12|폭풍이 잦아들 때까지/);
    assert.doesNotMatch(result.out.fx.note.title,/밤/);
    if(id==='pair_leo_es_1')assert.match(result.out.text,/모아 둔 빗소리 녹음/);
    h.G.queuePresentation();assert.equal(h.S.pendingPresentation,null);
  }
});
test('short everyday choices preserve current time, weather and the decision to defer a walk',()=>{
  const cases=[['talk_kw_03',0],['talk_kw_06',0],['talk_es_12',0],['talk_bori_01',0],
    ['talk_bori_01',1],['talkr_bori_2',1],['talk_bori_05',0],['talk_bori_06',1],['minji_toolbox',0]];
  for(const [id,index] of cases)for(const reunion of [false,true]){
    const h=setup(),e=h.event(id);h.S.party=['minji','kangwoo','eunsu'];h.S.dog=true;
    h.S.at='busan';h.S.min=720;h.S.wx='storm';h.S.flags.mingyu_reunion=reunion;
    const result=h.choose(e,index,true);
    assert.equal(h.S.min,720,id);assert.equal(h.S.at,'busan');assert.equal(h.S.wx,'storm');
    assert.doesNotMatch(result.out.text,/그날 이후로|그날부터 강우|다음 날부터|15분 뒤|15분 산책|10분 뒤|30분간|바닥에서 한 시간|폭풍이 지날 때까지/);
    if(id==='talk_bori_01'&&index===1){
      assert.match(result.out.text,/지금은 나가지 않았다/);
    }
    assert.equal(h.G.queuePresentation(),undefined);assert.equal(h.S.pendingPresentation,null);
  }
});
test('Seoul reaction conversations survive detours, daytime and receipt reload without moving time or place',()=>{
  for(const suffix of ['mj','kw','pss','es','all'])for(const minute of [600,1320]){
    const h=setup(),e=h.event('react_seoul_'+suffix);
    h.S.at='busan';h.S.driving=null;h.S.min=minute;
    h.S.party=e.needsComp?[e.needsComp]:['minji','leo'];
    assert(!h.G.eventAvailable(e,{mode:'local'}));
    h.S.flags.seoul_seen=true;
    assert(h.G.eventAvailable(e,{mode:'local'}));
    const result=h.choose(e,0,true);
    assert.equal(h.S.at,'busan');assert.equal(h.S.min,minute);
    assert(result.ok);assert.equal(h.G.queuePresentation(),undefined);
    assert.equal(h.S.pendingPresentation,null);
    assert(!h.G.eventAvailable(e,{mode:'local'}));
  }
});
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
test('voluntary road payments require supplies, retain a fallback, and never repay restored results',()=>{
  for(const [id,index,key,amount,fallback,outcomes] of [
    ['meet_waver',0,'fuel',5,2,2],
    ['meet_toll',1,'scrap',8,2,2],
    ['mansu_robbed',0,'의약품',1,1,1],
    ['meet_postman',1,'water',1,0,1],
    ['meet_seedlady',0,'water',2,1,1],
  ])for(let oi=0;oi<outcomes;oi++){
    const h=setup(),e=h.event(id);h.S.party=['kangwoo'];
    assert(!h.G.isInfiniteResourceMode());
    const set=n=>{if(key==='의약품')h.S.items[key]=n;else h.S[key]=n;};
    h.G.openEvent(e,{continuation:true});
    for(let n=0;n<amount;n++){
      set(n);h.reload();const before=JSON.stringify(h.S);
      assert(!h.G.resolvePresentedChoice(e,e.choices[index]).ok,id+' balance '+n);
      assert.equal(JSON.stringify(h.S),before,'rejected payment must not mutate state');
    }
    assert(h.G.reqOk(h.G.choiceReq(e.choices[fallback])).ok,'free alternative remains');
    set(amount);h.G.pickOutcome=(event,choice)=>choice.out[oi];
    assert(h.choose(e,index,true).applied);
    const expected=amount+(e.choices[index].out[oi].fx[key]||e.choices[index].out[oi].fx.item?.[key]||0);
    assert.equal(key==='의약품'?(h.S.items[key]||0):h.S[key],expected);
    set(0);h.reload();
    const replay=h.G.resolvePresentedChoice(e,e.choices[index]);
    assert(replay.ok&&!replay.applied,'paid receipt survives a now-unmet requirement');
    h.G.queuePresentation();assert(!h.S.pendingPresentation,'next road action is reachable');
    const f=setup(),fe=f.event(id);f.S.party=[];
    if(key==='의약품')f.S.items[key]=0;else f.S[key]=0;
    f.G.pickOutcome=(event,choice)=>choice.out[0];
    assert(f.choose(fe,fallback,true).applied,'zero-resource solo fallback resolves');
    f.G.queuePresentation();assert(!f.S.pendingPresentation);
  }
});

test('the live event pool waits for the noon window without consuming a missed radio scene',()=>{
  const h=setup(),e=h.event('comp_minji_radio');h.S.at='daejeon';h.S.party=['minji'];
  h.S.pendingPresentation=null;h.S.used=[];
  for(const minute of [0,450,713.999,720,1039.824,1439]){
    h.S.min=minute;assert(!h.G.eventAvailable(e,{mode:'local'}),String(minute));
    assert(!h.G.eligible().some(row=>row.id===e.id));assert(!h.S.used.includes(e.id));
  }
  for(const minute of [714,716.5,719.999]){
    h.S.min=minute;assert(h.G.eventAvailable(e,{mode:'local'}),String(minute));
    h.S.driving={from:'daejeon',to:'cheongju',gone:1,dist:70};h.S.at=null;
    assert(h.G.eventAvailable(e,{mode:'road'}),'same clock contract in travel');
    h.S.driving=null;h.S.at='daejeon';
  }
  h.S.party=[];assert(!h.G.eventAvailable(e));
  h.S.party=['minji'];h.S.used=[e.id];assert(!h.G.eventAvailable(e));
});
test('noon choices and legacy radio receipts survive Continue outside the entry window with once-only effects',()=>{
  for(const outcome of [0,1]){
    const h=setup(),e=h.event('comp_minji_radio');h.S.at='daejeon';h.S.party=['minji'];
    h.S.min=715;h.S.pendingPresentation=null;h.S.used=[];
    h.G.pickOutcome=(event,choice)=>choice.out[outcome];
    const result=h.choose(e,0,true);
    assert.equal(h.S.min,715+(outcome===0?15:20));
    assert.equal(result.out.text.includes('12:04'),outcome===0);
    const before=plain(h.S);h.reload();
    const replay=h.G.resolvePresentedChoice(e,e.choices[0]);assert(replay.ok&&!replay.applied);
    assert.equal(replay.out.text,result.out.text);assert.equal(h.S.min,before.min);
    assert.equal(h.G.resolvePresentedChoice(e,e.choices[1]).ok,false);
    assert.equal(h.G.queuePresentation(null),null);assert.equal(h.S.pendingPresentation,null);
    assert(h.G.eventAvailable(h.event('talk_mj_03')),'next ordinary conversation remains reachable without assuming bond 5');
  }
  const h=setup(),e=h.event('comp_minji_radio');h.S.party=['minji'];h.S.at='daejeon';h.S.min=715;
  h.S.pendingPresentation=null;h.S.used=[];const before=h.S.min;
  const declined=h.choose(e,1,true);assert.equal(h.S.min,before);
  assert.doesNotMatch(declined.out.text,/오후를 보냈다/);h.G.queuePresentation(null);
  h.S.min=1039.824;h.G.beginPresentation(e);
  h.S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:0,outcomeIndex:0,
    text:'옛 저장: 12:04. 오빠 신호야.',chips:[]};h.reload();
  const old=h.G.resolvePresentedChoice(e,e.choices[0]);assert(old.ok&&!old.applied);
  assert.equal(old.out.text,'옛 저장: 12:04. 오빠 신호야.');assert.equal(h.S.min,1039.824);
});
function dialogue(h,event,owner=event){
  if(!h.ctx.buildStoryTurns){
    const ui=fs.readFileSync('src/07-ui.js','utf8');
    vm.runInContext(ui.match(/  const stripTags=.*;/)[0]+ui.match(/  const playerSpeaker=.*;/)[0]+
      ui.slice(ui.indexOf('  function eventSpeakerCandidates('),ui.indexOf('  function prepareEventAudio(')),h.ctx);
  }
  return h.ctx.buildStoryTurns(read(owner.text,h.S),event,{turnSpeakers:owner.turnSpeakers})
    .filter(t=>t.kind==='dialogue');
}

test('the default core conversation retains the cause, challenge and verification before the decision',()=>{
  const h=setup();h.recover();h.S.at='seoul';
  const e=h.event('seoul_core'),turns=read(e.turns,h.S);
  const target=turns.findIndex(t=>t.text.includes('최종 정리 대상'));
  assert.equal(turns[target-1].who,'me');assert.match(turns[target-1].text,/나라가 무너졌어/);
  assert.equal(turns[target+1].who,'cheollian');assert.match(turns[target+1].text,/제가 추가한 항목/);
  assert.equal(turns[target+2].who,'me');assert.match(turns[target+2].text,/왜 스스로 멈추지/);
  assert.equal(turns[target+3].who,'cheollian');assert.match(turns[target+3].text,/자기 보존 규칙에 막혔.*검증키를 가진 사람이 결정.*인계 규약/);
  assert.match(read(e.readingRecord,h.S),/제가 추가한 항목/,'not a new last-minute premise');
  h.G.openEvent(e,{continuation:true});h.G.capturePresentationView({eventId:e.id,phase:'event',turns,index:target+2});h.reload();
  const restored={eventId:e.id,phase:'event'};h.G.restorePresentationView(restored);
  assert.equal(restored.index,target+2);assert.equal(restored.turns[target+2].who,'me');
  h.choose(e,4,true);assert.equal(h.G.queuePresentation(),'seoul_costs');
  h.choose(h.event('seoul_costs'),0,true);assert.equal(h.G.queuePresentation(),'seoul_decision');
  const decision=h.event('seoul_decision');
  assert.match(prose(decision,h.S),/검증키가 맞물리자[\s\S]*여러분의 승인 없이는 강제 명령을 실행할 수 없습니다/);
  assert.match(read(decision.readingRecord,h.S),/검증키로 확인된 외부 집행자의 승인 없이는 강제 명령을 실행할 수 없습니다/);
  assert(h.G.reqOk(decision.choices[0].req).ok);
});

test('all 20 three-contact coalitions keep their own council, without phantom residents or six channels',()=>{
  for(let a=0;a<4;a++)for(let b=a+1;b<5;b++)for(let c=b+1;c<6;c++){
    const h=setup(),cells=[a,b,c].map(i=>h.D.resistance[i]);h.S.at='seoul';
    for(const cell of cells)h.S.flags[cell.flag]=true;
    const cost=h.event('seoul_costs'),body=prose(cost,h.S);
    assert.match(body,/연결된 3곳/);assert.doesNotMatch(body,/여섯 거점/);
    for(const cell of cells)assert(body.includes(cell.name));
    h.choose(cost,0,true);assert.equal(h.G.queuePresentation(),'seoul_decision');
    const e=h.event('seoul_decision'),out=e.choices[0].out[0];assert(h.G.reqOk(e.choices[0].req).ok);
    for(const text of [prose(out,h.S),read(out.readingRecord,h.S)]){
      assert(text.includes(cells[0].name)&&text.includes(cells[1].name));
      assert.doesNotMatch(text,/덕구|금자/);
      for(const cell of h.D.resistance.filter(row=>!cells.includes(row)))assert(!text.includes(cell.name));
    }
    h.choose(e,0,true);assert(h.S.flags.core_transfer);assert.equal(h.G.queuePresentation(),'seoul_night');
  }
});

test('northern relay and each companion cost scene retain actual presence and a concrete record cost',()=>{
  for(const party of [[],['minji'],['parkss'],['leo'],['kangwoo'],['jaeyi'],['eunsu']]){
    const h=setup();h.S.party=party;h.S.flags.main_relay_confirmed=true;
    const e=h.event('seoul_costs');assert.match(prose(e,h.S),/연결된 3곳/);
    assert.doesNotMatch(prose(e,h.S),/혼자 서 있는/);
    const text=read(e.choices[1].out[0].text,h.S);
    assert.doesNotMatch(text,/부산에서 우리 차를 고쳐|같은 성/);
    assert.match(text,/내일.*조회|내일 오전/);
    const transfer=h.event('seoul_decision').choices[0].out[0];
    assert.match(prose(transfer,h.S),/이음망.*유령/);assert.doesNotMatch(prose(transfer,h.S),/금자|덕구/);
  }
});

test('the watch outcome uses the same healthy willing crew as its gate and the player owns the request',()=>{
  for(const eunsu of ['absent','injured','low','willing','recovered','kangwoo_injured']){
    const h=setup();h.S.at='seoul';h.S.flags.main_relay_confirmed=true;
    h.S.party=['minji','parkss','leo',...(eunsu==='absent'?[]:['eunsu'])];
    if(eunsu==='kangwoo_injured')h.S.party.push('kangwoo');
    for(const id of h.S.party)h.S.comps[id].mood=id==='eunsu'&&eunsu==='low'?40:60;
    if(eunsu==='injured'||eunsu==='recovered')h.S.injuries.eunsu={days:eunsu==='injured'?2:0};
    if(eunsu==='kangwoo_injured')h.S.injuries.kangwoo={days:2};
    const e=h.event('seoul_decision'),out=e.choices[2].out[0];assert(h.G.reqOk(e.choices[2].req).ok);
    const expected=h.S.party.filter(id=>!h.G.isInjured(id)&&h.S.comps[id].mood>=45);
    assert.deepEqual(Array.from(h.D.coreWatchCrew(h.S)),expected);
    for(const text of [prose(out,h.S),read(out.readingRecord,h.S)]){
      assert.doesNotMatch(text,/유령 통신원/);
      assert.equal(text.includes('은수'),['willing','recovered','kangwoo_injured'].includes(eunsu));
    }
    assert.deepEqual(Array.from(read(out.turns,h.S).filter(t=>t.kind==='dialogue'),t=>t.who),['me']);
    assert.deepEqual(Array.from(dialogue(h,e,out),t=>t.who),['me','me']);
    h.choose(e,2,true);assert(h.S.flags.core_quarantine);assert.equal(h.G.queuePresentation(),'seoul_night');
    if(eunsu==='kangwoo_injured'){
      const night=h.event('seoul_night').choices[0].out[0];
      for(const text of [prose(night,h.S),read(night.readingRecord,h.S)]){
        assert.doesNotMatch(text,/내가 먼저 선다/);assert.match(text,/첫 근무는 서명한 세 사람/);
      }
    }
  }
});

test('watch signatures are frozen before the reward and exclude unsigned eligible crew from the first shift',()=>{
  for(const mood of [43,44,45]){
    const h=setup();h.S.at='seoul';
    h.S.party=['minji','parkss','leo','eunsu','kangwoo'];
    for(const id of h.S.party)h.S.comps[id].mood=id==='eunsu'?mood:60;
    const e=h.event('seoul_decision');
    const expected=mood<45?['minji','parkss','leo']:['eunsu','minji','parkss'];
    const result=h.choose(e,2,true);
    assert.deepEqual(Array.from(h.D.coreWatchSigners(h.S)),expected);
    assert.equal(result.out.text.includes('은수'),mood>=45);
    assert.equal(h.G.queuePresentation(),'seoul_night');
    h.S.comps.eunsu.mood=90;h.S.comps.minji.mood=20;h.reload();
    assert.deepEqual(Array.from(h.D.coreWatchSigners(h.S)),expected,'later morale cannot rewrite signatures');
    const night=h.event('seoul_night').choices[0].out[0];
    for(const text of [prose(night,h.S),read(night.readingRecord,h.S)]){
      assert.doesNotMatch(text,/내가 먼저 선다/,'healthy but unsigned Kangwoo is not the first shift');
      assert.match(text,/첫 근무는 서명한 세 사람/);
    }
  }
});

test('cache handoff records the introduced courier, not an unestablished named ally',()=>{
  for(const id of ['story_personal_cache','main_recovery_story_personal_cache']){
    const h=setup(),e=h.event(id);h.S.at=id.startsWith('main_recovery_')?'suwon':'cheongju';
    h.S.flags.parent_key_located=true;
    const result=h.choose(e,0,true);
    assert.doesNotMatch(result.out.text,/서진/);
    assert(h.S.notes.some(note=>/전달자/.test(note.body)));
    assert(!h.S.notes.some(note=>/서진과 함께 대조/.test(note.body)));
    assert.equal(h.G.queuePresentation(),id.startsWith('main_recovery_')?'main_recovery_story_parent_route_shared':'story_parent_route_shared');
  }
});

test('the paid reunion records meeting mother before her separate broadcast commitment',()=>{
  for(const index of [0,1]){
    const h=setup();h.S.at='suwon';h.S.flags.father_fate_known=true;h.S.flags.parents_recent_signal=true;
    const e=h.event('parents_mother_reunion');
    h.G.openEvent(e,{continuation:true});
    assert(!h.S.flags.mother_reunited,'entry alone is not a completed reunion');
    h.choose(e,index,true);
    assert(h.S.flags.mother_reunited);assert(!h.S.flags.mother_broadcast_ready);
    assert.equal(h.G.resolveMainEvidenceChain(e.id),null,'paid reunion cannot replay');
    assert.equal(h.G.mainEvidenceRows().find(row=>row.id==='mother').event,'parents_mother_truth');
    assert.equal(h.G.queuePresentation(),'parents_mother_truth');
    h.reload();assert(h.G.presentTransition());
    h.choose(h.event('parents_mother_truth'),index,true);
    assert(h.S.flags.mother_broadcast_ready);
    assert(h.G.mainEvidenceRows().find(row=>row.id==='mother').done);
  }
});

test('paid old finale outcomes retain their text and reading voices after Continue',()=>{
  for(const index of [0,1,2]){
    const h=setup(),e=h.event('seoul_decision'),text='옛 저장의 덕구·금자·통신원 결과';
    h.S.used.push(e.id);h.S.pendingPresentation={version:1,phase:'result',eventId:e.id,
      choiceIndex:index,outcomeIndex:0,text,chips:[],view:{turns:[{kind:'dialogue',who:'eunsu',text}],index:0}};
    const before=plain({flags:h.S.flags,food:h.S.food,min:h.S.min,items:h.S.items});
    h.reload();assert(h.G.resumePresentation());
    const result=h.G.resolvePresentedChoice(e,e.choices[index]);assert(result.ok&&!result.applied);
    assert.equal(result.out.text,text);
    const state={eventId:e.id,phase:'outcome'};h.G.restorePresentationView(state);
    assert.equal(state.turns[0].who,'eunsu');assert.equal(state.turns[0].text,text);
    assert.deepEqual(plain({flags:h.S.flags,food:h.S.food,min:h.S.min,items:h.S.items}),before);
  }
});

test('found seed stock does not invent a library loan; planting requires the owned garden',()=>{
  for(const outcome of [0,1]){
    const h=setup(),e=h.event('ev_seed_warehouse');
    h.G.applyFx(e.choices[0].out[outcome].fx);
    assert(h.S.flags.seed_found);assert(!h.S.flags.seed_borrowed);
    assert(!h.G.eventAvailable(h.event('seed_harvest'),{mode:'local'}));
  }
  for(const garden of [false,true]){
    const h=setup(),e=h.event('seed_harvest');
    h.choose(h.event('meet_seedlady'),0,true);h.S.up.garden=garden;
    assert(h.G.eventAvailable(e,{mode:'local'}));
    assert.equal(h.G.reqOk(e.choices[1].req).ok,garden);
    assert(h.G.reqOk(e.choices[0].req).ok,'field planting remains an alternative');
    h.choose(e,garden?1:0,true);
    assert.doesNotMatch(h.S.pendingPresentation.text,/"|수확했다|키운 상추/);
    assert.equal(dialogue(h,e).length,0,'no absent companion supplies a question');
  }
});

test('both planting branches return seeds or supplies without claiming an immediate harvest',()=>{
  for(const planted of [0,1])for(const returned of [0,1]){
    const h=setup();h.S.up.garden=true;
    h.choose(h.event('meet_seedlady'),0,true);h.choose(h.event('seed_harvest'),planted,true);
    const e=h.event('seed_return');assert(h.G.eventAvailable(e,{mode:'local'}));
    const food=h.S.food;h.choose(e,returned,true);
    assert.equal(h.S.food,food-(returned===0?1:0));
    assert.doesNotMatch(h.S.pendingPresentation.text,/지붕에서 키운|두 배로 세어|주인 없는 밭에 심고/);
    assert.deepEqual(Array.from(dialogue(h,e),t=>t.who),['passer_woman','me','passer_woman']);
    assert(dialogue(h,e,e.choices[returned].out[0]).every(t=>t.who==='passer_woman'));
    assert(h.S.flags.seed_returned);assert.equal(h.G.queuePresentation(),undefined);
  }
  const h=setup(),e=h.event('seed_return');h.S.food=0;
  assert(!h.G.reqOk(e.choices[0].req).ok);assert(h.G.reqOk(e.choices[1].req).ok);
});

test('a cafe drink does not create a carried coffee parcel or a remembered Daeyang debt',()=>{
  const h=setup(),e=h.event('vanowner_coffee');
  h.S.flags.coffee_found=true;
  assert(!h.G.eventAvailable(e,{mode:'local'}));
  h.S.flags.van_owner_done=true;assert(!h.G.eventAvailable(e,{mode:'local'}));
  h.S.items['커피 원두']=1;assert(h.G.eventAvailable(e,{mode:'local'}));
  h.G.openEvent(e,{continuation:true});delete h.S.items['커피 원두'];
  const before=plain({food:h.S.food,min:h.S.min,flags:h.S.flags});
  assert(!h.G.resolvePresentedChoice(e,e.choices[0]).ok);
  assert.deepEqual(plain({food:h.S.food,min:h.S.min,flags:h.S.flags}),before);
});

test('coffee gifts and debt repayments keep distinct history, real speakers, and the same next promise',()=>{
  for(const debt of [false,true])for(const letter of [false,true]){
    const h=setup();h.S.flags.van_garage=true;
    h.choose(h.event('van_owner'),debt?0:1,true);
    if(letter)h.S.items['남산행 편지']=1;
    const beans=h.event('exp_coffee');h.choose(beans,0,true);
    assert.equal(/남산행 편지/.test(h.S.pendingPresentation.text),letter);
    assert.equal(/외상/.test(h.S.pendingPresentation.text),debt);
    const e=h.event('vanowner_coffee');assert(h.G.eventAvailable(e,{mode:'local'}));
    h.choose(e,0,true);
    assert.equal(/외상 장부/.test(h.S.pendingPresentation.text),debt);
    assert.match(h.S.pendingPresentation.text,/남산 가서 마셔/);
    assert(dialogue(h,e,e.choices[0].out[0]).every(t=>t.who==='passer_elder'&&t.name==='대양'));
    assert(h.S.flags.coffee_paid);assert.equal(h.S.items['커피 원두'],1,'remaining half stays for Namsan');
    assert.equal(h.G.queuePresentation(),undefined);
    const base=h.event('seoul_base').choices.find(c=>c.req?.flag==='coffee_paid');
    assert(base);assert.doesNotMatch(read(base.out[0].text,h.S),/외상 청산 조건/);
  }
});

test('old paid seed and coffee receipts are not rewritten or charged again',()=>{
  for(const id of ['seed_harvest','seed_return','exp_coffee','vanowner_coffee']){
    const h=setup(),e=h.event(id),text='옛 저장의 수확·외상 문장';
    h.S.used.push(id);h.S.pendingPresentation={version:1,phase:'result',eventId:id,
      choiceIndex:0,outcomeIndex:0,text,chips:[]};
    const before=plain({items:h.S.items,flags:h.S.flags,food:h.S.food,min:h.S.min});
    h.reload();assert(h.G.resumePresentation());
    const replay=h.G.resolvePresentedChoice(e,e.choices[0]);assert(replay.ok&&!replay.applied);
    assert.equal(replay.out.text,text);
    assert.deepEqual(plain({items:h.S.items,flags:h.S.flags,food:h.S.food,min:h.S.min}),before);
  }
});

test('personal keepsakes remember completed revelations, not entry, and keep their actual voices',()=>{
  for(const [id,comp,flag] of [['jaeyi_pricetag','jaeyi','jaeyi_cache_opened'],
    ['kangwoo_dogtag','kangwoo','kw_absolved'],['parkss_bag','parkss','pss_met']]){
    const choices=id==='parkss_bag'?[0,1]:[0];
    for(const index of choices)for(const known of [false,true]){
      const h=setup();h.S.party=[comp];h.S.at='suwon';h.S.min=1260;
      const e=h.event(id),out=e.choices[index].out[0];
      h.S.used.push({jaeyi_pricetag:'loc_jaeyi_cache',kangwoo_dogtag:'kw_base',parkss_bag:'pss_daejeon'}[id]);
      if(known)h.S.flags[flag]=true;
      assert(h.G.eventAvailable(e));
      h.G.openEvent(e,{continuation:true});h.reload();
      const text=read(out.text,h.S),spoken=dialogue(h,e,out);
      if(id==='jaeyi_pricetag'){
        assert.deepEqual(plain(spoken.map(t=>t.who)),['jaeyi','me','jaeyi','jaeyi','jaeyi']);
        assert.equal(spoken.at(-1).who,'jaeyi');
        assert.equal(/같이 문을 열었죠/.test(text),known);
        assert.equal(/김천에서 확인/.test(text),!known);
        assert.match(dialogue(h,e).at(-1).text,/그건요/);
      }else if(id==='kangwoo_dogtag'){
        assert.deepEqual(plain(spoken.map(t=>t.who)),
          ['kangwoo','kangwoo','me','kangwoo','kangwoo','kangwoo','me','kangwoo','me']);
        assert.equal(/그 얘긴 아직/.test(text),!known);
      }else{
        assert.equal(/수진을 만났을 때/.test(read(e.text,h.S)),known);
        assert.equal(/언젠가 얘기해|될 애였/.test(text),!known);
        assert.equal(e.choices[1].label,'가방 이름표 이야기를 꺼낸다');
        assert(spoken.filter(t=>t.who==='me').every(t=>/요|겠어요/.test(t.text)));
      }
      h.choose(e,index,true);
      const receiptText=JSON.stringify(h.S.pendingPresentation);
      h.S.flags[flag]=!known;h.reload();
      assert.equal(JSON.stringify(h.S.pendingPresentation),receiptText,'paid prose stays frozen after knowledge changes');
      assert.equal(h.G.queuePresentation(),undefined,'optional keepsake scene returns to road');
    }
  }
  const h=setup();h.S.notes.push({title:'고물상의 법',body:'창고는 이제 지나가는 모두의 것이다'});
  assert.match(read(h.event('jaeyi_pricetag').choices[0].out[0].text,h.S),/같이 문을 열었죠/);
  h.S.notes=[];h.S.flags.jy_law=true;
  assert.match(read(h.event('jaeyi_pricetag').choices[0].out[0].text,h.S),/창고가 남았는지도/);
});

test('legacy paid keepsake results keep their text and already-paid resources',()=>{
  for(const [id,comp,flag] of [['jaeyi_pricetag','jaeyi','jaeyi_cache_opened'],
    ['kangwoo_dogtag','kangwoo','kw_absolved'],['parkss_bag','parkss','pss_met']]){
    const h=setup(),e=h.event(id);h.S.party=[comp];h.S.flags[flag]=true;h.S.used.push(id);
    const text='예전 저장의 '+id+' 결과';
    h.S.pendingPresentation={version:1,phase:'result',eventId:id,choiceIndex:0,outcomeIndex:0,
      text,chips:[]};
    const before=plain({items:h.S.items,flags:h.S.flags,food:h.S.food,day:h.S.day,min:h.S.min});
    h.reload();assert(h.G.resumePresentation());
    const replay=h.G.resolvePresentedChoice(e,e.choices[0]);
    assert(replay.ok&&!replay.applied);assert.equal(replay.out.text,text);
    assert.deepEqual(plain({items:h.S.items,flags:h.S.flags,food:h.S.food,day:h.S.day,min:h.S.min}),before);
  }
});

test('an unscheduled night remembers Eunsu’s shift without inventing an anniversary or player confession',()=>{
  const h=setup(),e=h.event('eunsu_lastshift');h.S.party=['eunsu'];h.S.min=1260;
  assert(h.G.eventAvailable(e));
  assert.doesNotMatch(read(e.text,h.S),/오늘이에요|오늘 며칠/);
  assert.deepEqual(plain(dialogue(h,e).map(t=>t.who)),['eunsu','eunsu']);
  const out=e.choices[0].out[0];
  assert.match(read(out.text,h.S),/야간 당직.*밤인데도/s);
  assert.deepEqual(plain(dialogue(h,e,out).map(t=>t.who)),['eunsu','me','eunsu','eunsu','eunsu','eunsu']);
  assert.equal(dialogue(h,e,out).find(t=>/역사책/.test(t.text)).who,'eunsu');
  h.choose(e,0,true);assert.equal(h.G.queuePresentation(),undefined);
});

test('heritage scenes introduce the altar and preserve a generations-old record as reported history',()=>{
  const h=setup(),photo=h.event('trace_fourcuts'),reply=h.event('trace_worldcup_reply');
  h.S.party=[];h.S.at='gimcheon';
  assert.match(read(photo.text,h.S),/사진 부스 잔해.*작은 제단/);
  assert(!h.G.eventAvailable(reply));h.S.flags.worldcup_kept=true;
  assert(h.G.eventAvailable(reply));
  assert.match(read(reply.text,h.S),/족보.*전해 내려온 기록.*후손/s);
  assert.doesNotMatch(read(reply.text,h.S),/우리 외삼촌/);
  assert.equal(dialogue(h,reply)[0].name,'장터의 노인');
  assert.equal(dialogue(h,reply,reply.choices[0].out[0])[0].who,'passer_elder');
  h.choose(reply,0,true);assert(h.S.flags.worldcup_family_found);
  assert.equal(h.G.queuePresentation(),undefined);
});

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

test('northern key recovery preserves why the parents chose the truck, record roles and saved cursor',()=>{
  const h=setup(),source=h.event('story_family_key'),copy=h.event('main_recovery_story_family_key');
  h.S.at='suwon';h.S.flags.parent_principle_found=true;
  Object.assign(h.S.flags,{first_order_trace:true,parents_split_known:true,parents_routes_traced:true});
  assert.equal(copy.text.split('\n\n').slice(2).join('\n\n'),source.text.split('\n\n').slice(2).join('\n\n'));
  assert.match(copy.text,/교환소 앞 달구지/);
  assert.equal(copy.turns,undefined);
  const spoken=dialogue(h,copy);
  assert.deepEqual(plain(spoken.map(t=>({who:t.who,text:t.text}))),plain(dialogue(h,source).map(t=>({who:t.who,text:t.text}))));
  assert.deepEqual(plain(spoken.map(t=>t.who)),['father','mother','father','mother','father','mother']);
  const turns=h.ctx.buildStoryTurns(copy.text,copy,{turnSpeakers:copy.turnSpeakers});
  assert.equal(turns.filter(t=>t.kind==='record').length,2);
  h.G.openEvent(copy,{continuation:true});
  h.G.capturePresentationView({eventId:copy.id,phase:'event',turns,index:5});h.reload();
  const restored={eventId:copy.id,phase:'event'};h.G.restorePresentationView(restored);
  assert.equal(restored.index,5);assert.deepEqual(plain(restored.turns),plain(turns));
  h.choose(copy,0,true);assert(h.S.flags.parent_key_located);assert(!h.S.flags.parent_key_found);
  h.G.queuePresentation();assert.equal(h.G.mainEvidenceOpportunity().sourceEvent,'story_personal_cache');
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

test('main evidence does not require an unseen faction dispute or invent completed delivery',()=>{
  const h=setup();
  for(const id of ['history_failed_namsan','main_recovery_history_failed_namsan']){
    const e=h.event(id);
    assert.doesNotMatch(e.text,/서진과 태식의 다툼/);
    assert.match(e.text,/급수 펌프와 진료소 전력/);
    assert.match(e.text,/사람에게 명령권/);
    assert.equal(e.choices[0].out[0].fx.chain,id.startsWith('main_recovery_')?'main_recovery_parents_father_last_log':'parents_father_last_log');
  }
  for(const recovery of [false,true]){
    const run=setup(),id=(recovery?'main_recovery_':'')+'story_parent_route_guarded',e=run.event(id);
    run.S.at=recovery?'suwon':'cheongju';
    Object.assign(run.S.flags,{parent_cache_guarded:true,parent_key_located:true});
    assert.match(e.text,recovery?/담당자.*전달편/:/전달함/);
    const out=run.choose(e,1,true).out;
    assert.match(prose(out,run.S),recovery?/교환소 담당자에게 맡겼다/:/전달함에 넣었다/);
    assert.doesNotMatch(prose(out,run.S),/여섯 길로|여섯 조직/);
    assert.equal(run.S.items['부모님의 검증키'],1);
    assert(run.S.flags.parent_key_found);assert(!run.S.flags.parent_cache_guarded);
  }
});

test('Eunsu personal radio practice respects her earlier transmissions and a two-person party',()=>{
  for(const index of [0,1]){
    const h=setup(),e=h.event('talk_es_20');h.S.party=['eunsu'];h.S.min=720;h.S.at='suwon';
    h.S.comps.eunsu.bond=12;
    assert(!h.G.eligible().some(x=>x.id===e.id),'confession is required');
    h.S.flags.es_truth=true;
    assert(h.G.eligible().some(x=>x.id===e.id),'available after confession with sufficient bond');
    assert.match(e.text,/커피를 마시던/);
    assert.doesNotMatch(e.text,/그날 이후 송신을 못|수신만 하고/);
    const out=e.choices[index].out[0],lines=dialogue(h,e,out);
    assert.deepEqual(plain(lines.map(t=>t.who)),index===0?['eunsu','me','eunsu','me','eunsu','me']:['me','eunsu','me']);
    assert.doesNotMatch(out.text,/여기저기서|첫 교신|은수는 돌아오는 길/);
    h.choose(e,index,true);
    assert.equal(h.S.at,'suwon');assert.equal(h.S.min,720);
    h.G.queuePresentation();assert.equal(h.S.pendingPresentation,null);
  }
});
test('coffee, radio and night watch close in the present rather than advancing an unpaid scene',()=>{
  for(const [id,index] of [['talk_es_19',1],['talk_es_21',1],['pair_pss_kw_2',0]]){
    const h=setup(),e=h.event(id);h.S.party=['eunsu','parkss','kangwoo'];h.S.min=id==='pair_pss_kw_2'?1260:720;
    const minute=h.S.min,out=e.choices[index].out[0];
    assert.doesNotMatch(e.text,/새벽 불침번/);
    assert.doesNotMatch(out.text,/다음 정차|그날 밤 은수|어깨가 아침에/);
    h.choose(e,index,true);assert.equal(h.S.min,minute);
  }
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
    let expectedFollowup=base.followup.choices[a.id].text;
    if(cid==='kangwoo'){
      assert.equal(h.S.campConversation.replyContext,'kangwoo-rotate-trust-v1');
      assert(expectedFollowup.startsWith('"들리면 같이 받아요."\n'));
      expectedFollowup=expectedFollowup.replace('"들리면 같이 받아요."','"오른쪽 뒤는 제가 볼게요. 무전이 들리면 같이 받아요."');
    }
    assert.equal(h.G.campConversationEvent().choices.find(c=>c.id===a.id).out[0].text,expectedFollowup);
    choose(a.id);enter();
    assert.equal(h.G.campConversationEvent().choices.find(c=>c.id===a.id).out[0].text,base.settled.choices[a.id].text);
    let expectedOther=base.followup.choices[b.id].text;
    if(cid==='kangwoo'){
      assert.equal(h.S.campConversation.replyContext,'kangwoo-cross-choice-v2');
      assert(expectedOther.startsWith('"여기서는 보여요. 문도요."\n'));
      expectedOther=expectedOther.replace('"여기서는 보여요. 문도요."','"호출 오면 같이 들을게요. 오른쪽 뒤도 여기서 보여요. 문도요."');
    }
    assert.equal(h.G.campConversationEvent().choices.find(c=>c.id===b.id).out[0].text,expectedOther);
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

test('Leo first verse promise pays off once in either night choice and freezes through reload',()=>{
  for(const method of ['transfer','sleep','quarantine'])for(const promised of [false,true])for(const index of [0,1]){
    const h=setup();h.S.party=['leo'];h.S.at='seoul';h.S.driving=null;
    if(promised)h.choose(h.event('talk_leo_10'),0,true);
    else h.S.used.push('talk_leo_10');
    h.S.flags['core_'+method]=true;
    const e=h.event('seoul_night');
    const out=h.choose(e,index,true);
    assert.match(out.out.text,/시동을 끄니 네 노래가 더 잘 들린다/);
    assert.equal(out.out.text.includes('약속한 첫 줄'),promised);
    assert.equal((out.out.text.match(/시동을 끄니 네 노래가 더 잘 들린다/g)||[]).length,1);
    assert(h.S.flags.seoul_local_saved);
    assert.equal(h.G.queuePresentation(),'seoul_uplink_reveal');
  }
});

test('seeing the skyline does not close arrival promises; entering Seoul does',()=>{
  for(const [id,cid] of [['talk_leo_10','leo'],['talk_jy_21','jaeyi']]){
    const h=setup();h.S.party=[cid];h.S.comps[cid].bond=30;h.S.at='suwon';h.S.driving=null;
    const e=h.event(id);
    assert(h.G.eventAvailable(e,{mode:'local'}));
    h.S.flags.seoul_seen=true;
    assert(h.G.eventAvailable(e,{mode:'local'}),'skyline is not arrival');
    h.S.flags.seoul_open=true;
    assert(!h.G.eventAvailable(e,{mode:'local'}),'no new future-arrival promise inside Seoul');
  }
});

test('both scale handoffs persist and pay off once in both night choices',()=>{
  for(const handoff of [0,1])for(const night of [0,1]){
    const h=setup();h.S.party=['jaeyi'];h.S.driving=null;
    h.choose(h.event('talk_jy_21'),handoff,true);
    assert(h.S.flags.jaeyi_scale_entrusted);
    h.S.at='seoul';h.S.flags.core_sleep=true;
    const out=h.choose(h.event('seoul_night'),night,true);
    assert.equal((out.out.text.match(/거래 완료/g)||[]).length,1);
    assert.match(out.out.text,/자기 손목에 맞게 줄였다/);
    assert.equal(h.G.queuePresentation(),'seoul_uplink_reveal');
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

test('an absent memory speaker does not block later echoes and returns only once after rejoining',()=>{
  const h=setup();
  const family=h.event('meet_family'),bus=h.event('meet_bus');
  h.G.rememberChoice(family,family.choices[1],family.choices[1].out[0]);
  h.G.rememberChoice(bus,bus.choices[1],bus.choices[1].out[0]);
  h.S.stats.km=200;h.S.stats.events=20;h.S.party=[];
  h.S.driving={from:'cheongju',to:'cheonan'};
  h.reload();
  assert.equal(h.G.takeChoiceEcho().memory.id,'clinic_route_declined');
  assert(!h.S.memories.choices.family_repaired.echoed);
  assert(h.S.memories.pending.includes('family_repaired'));
  h.reload();assert.equal(h.G.takeChoiceEcho(),null);
  h.S.party=['minji'];h.S.driving=null;
  assert.equal(h.G.takeChoiceEcho(),null,'still requires driving');
  h.S.driving={from:'cheongju',to:'cheonan'};
  assert.equal(h.G.takeChoiceEcho().memory.id,'family_repaired');
  h.reload();assert.equal(h.G.takeChoiceEcho(),null);
});

test('an absent companion memory does not block an eligible opening callback',()=>{
  const h=setup('interactive');
  const step=h.G.openingPending();h.choose(step,0,true);h.G.continueOpening(step.id);
  const family=h.event('meet_family');
  h.G.rememberChoice(family,family.choices[1],family.choices[1].out[0]);
  h.S.stats.km=200;h.S.stats.events=20;h.S.party=[];
  h.S.driving={from:'cheongju',to:'cheonan'};
  const echo=h.G.takeChoiceEcho();
  assert.equal(echo.memory.eventId,'opening_workshop');
  assert(!h.S.memories.choices.family_repaired.echoed);
  h.reload();assert.equal(h.G.takeChoiceEcho(),null);
});

test('library collection and delivery can be deferred without consuming the mission',()=>{
  const h=setup();h.S.at='gimcheon';h.S.flags.library_quest=true;
  const books=h.event('lib_books'),returned=h.event('lib_return');
  assert.match(h.event('lib_meet').choices[1].out[0].text,/한별이라고 이름을 알려/);
  assert.doesNotMatch(returned.choices[0].out[0].text,/그날 저녁/);
  assert.equal(returned.choices[0].out[0].fx.time,80);
  assert(h.G.eventAvailable(books,{mode:'local'}));
  for(let attempt=0;attempt<2;attempt++){
    h.choose(books,1,true);h.G.queuePresentation();h.reload();
    assert(h.S.used.includes(books.id),'history is retained');
    assert(h.G.eventAvailable(books,{mode:'local'}),'can search again');
    assert(!h.S.flags.library_books);
  }
  h.G.pickOutcome=(event,choice)=>choice.out[0];
  h.choose(books,0,true);h.G.queuePresentation();h.reload();
  assert.equal(h.S.items['책 꾸러미'],1);
  assert(!h.G.eventAvailable(books,{mode:'local'}),'no second harvest');
  for(let attempt=0;attempt<2;attempt++){
    h.choose(returned,1,true);h.G.queuePresentation();h.reload();
    assert(h.G.eventAvailable(returned,{mode:'local'}),'next time is a real option');
    assert.equal(h.S.items['책 꾸러미'],1);
    assert(!h.S.flags.library_done);
  }
  delete h.S.items['책 꾸러미'];
  assert(!h.G.eventAvailable(returned,{mode:'local'}),'no imagined heavy box');
  h.S.items['책 꾸러미']=1;
  h.choose(returned,0,true);h.G.queuePresentation();h.reload();
  assert(h.S.flags.library_done);assert(!h.S.items['책 꾸러미']);
  assert(!h.G.eventAvailable(returned,{mode:'local'}),'completed delivery stays closed');
  assert(!h.G.eventAvailable(books,{mode:'local'}));
  const ordinary=h.event('lib_meet');h.S.used.push(ordinary.id);
  assert(!h.G.eventAvailable(ordinary,{mode:'local'}),'unrelated encounters remain once-only');
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

test('levy confrontation has no invented companions and preserves both paid outcomes',()=>{
  for(const party of [[],['parkss']]) for(const outcome of [0,1]){
    const h=setup();h.S.at='gimcheon';h.S.party=party;
    const e=h.event('levy_office'),choice=e.choices[2];
    assert(!choice.req&&!choice.minParty&&!e.needsComp&&!e.minParty);
    assert.deepEqual(plain(choice.out.map(o=>({p:o.p,fx:o.fx}))),[
      {p:1,fx:{time:20,moodAll:1,flag:'levy_chased',note:{type:'사건',title:'걷어낸 천막',body:'가짜 행정소를 쫓아냈다. 부순 게 아니라 옮긴 것에 가깝다.',links:[]}}},
      {p:1,fx:{van:-8,moodAll:-2,fatigue:6,flag:'levy_chased'}}
    ]);
    h.G.pickOutcome=()=>choice.out[outcome];
    const result=h.choose(e,2,true);
    assert.doesNotMatch(result.out.text,/다 같이|셋 대 우리|누군가의|박 선생/);
    assert(h.S.flags.levy_chased);
    const before=plain(h.S);
    assert(!h.G.queuePresentation());
    h.reload();assert.equal(h.S.van,before.van);assert.equal(h.S.min,before.min);
    assert.equal(h.S.pendingPresentation,null);
  }
});

test('all 48 opening choices preserve sequence, once-only costs and the first road action',()=>{
  for(let seed=0;seed<48;seed++){
    const h=setup('interactive');let value=seed;
    const ids=[];
    while(h.G.openingPending()&&ids.length<6){
      const e=h.G.openingPending(),index=value%e.choices.length;value=Math.floor(value/e.choices.length);
      ids.push(e.id);h.choose(e,index,true);assert.notEqual(h.G.continueOpening(e.id),false);
    }
    assert.deepEqual(ids,['opening_workshop','opening_bus_repair','opening_failed_appeal','opening_parents_module','opening_departure','opening_farewell']);
    assert(h.G.canTravelTo('yangsan').ok);assert(h.S._storyQueue.includes('onboarding_first_road'));
  }
});

test('each repair journal survives reload without learning the next scene early',()=>{
  for(let index=0;index<3;index++){
    const h=setup('interactive');
    let e=h.G.openingPending();
    h.choose(e,0,true);h.G.continueOpening(e.id);
    e=h.G.openingPending();assert.equal(e.id,'opening_bus_repair');
    const result=h.choose(e,index,true);
    assert(result.applied);
    const note=h.S.notes.find(n=>n.title==='도윤 가족의 버스');
    assert(note);assert.match(note.body,/난방/);
    assert.doesNotMatch(note.body,/이송 사유|최종 승인자|남산|이송표/);
    assert(!h.S.flags.intro_appeal_failed);
    assert.notEqual(h.G.continueOpening(e.id),false);
    const next=h.G.openingPending();assert.equal(next.id,'opening_failed_appeal');
    assert.match(next.turns[0].text,/도윤이 이송표를 내밀었다/);
    h.choose(next,1,true);
    assert.match(h.S.notes.find(n=>n.title==='남산 주소 옆의 세 이름').body,/비어 있는 이송 사유/);
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

test('chosen journey reason survives entry, cancel, payment, reload and an attempted different answer',()=>{
  const reasons=['bridge_reason_stop','bridge_reason_family','bridge_reason_both'];
  const phrases=[/이 명령만큼은/,/엄마.*마주 앉|엄마 곁/,/겁난다|겁난다고/];
  for(const [index,reason] of reasons.entries()){
    const h=setup(),e=h.event('story_bridge_crew_question');
    h.S.flags.bridge_child_voice=true;h.S.flags.mother_reunited=true;
    h.G.openEvent(e,{continuation:true});
    assert(reasons.every(key=>!h.S.flags[key]),'entry is not a decision');
    h.S.pendingPresentation=null;h.reload(); // close an unpaid view, then reopen
    assert(reasons.every(key=>!h.S.flags[key]));
    h.choose(e,index,true);
    assert.deepEqual(reasons.map(key=>!!h.S.flags[key]),reasons.map(key=>key===reason));
    const receipt=plain(h.S.pendingPresentation);
    const alternate=h.G.resolvePresentedChoice(e,e.choices[(index+1)%3]);
    assert.equal(alternate.ok,false); // a different paid answer is rejected
    assert.equal(h.S.pendingPresentation.text,receipt.text);
    assert.deepEqual(reasons.map(key=>!!h.S.flags[key]),reasons.map(key=>key===reason));
    assert.match(prose(h.event('story_bridge_last_quiet'),h.S),phrases[index]);
    h.S.flags.mother_broadcast_ready=true;
    for(const method of ['core_transfer','core_sleep','core_quarantine']){
      for(const key of ['core_transfer','core_sleep','core_quarantine'])h.S.flags[key]=key===method;
      for(const choice of h.event('seoul_night').choices){
        const before=JSON.stringify(h.S),out=choice.out[0];
        assert.match(prose(out,h.S),phrases[index]);
        assert.match(read(out.readingRecord,h.S),phrases[index]);
        assert.match(prose(out,h.S),/엄마.*의자.*비워/);
        assert.match(prose(out,h.S),/한동안 일어나지 않았다\.$/);
        assert.doesNotMatch(prose(out,h.S),/487,213,006|SESSION 1/);
        assert.equal(out.fx.chain,'seoul_uplink_reveal');
        assert.equal(JSON.stringify(h.S),before,'recall is read-only');
      }
    }
  }
});

test('old paid motive receipts stay unchanged and an unknown reason is never inferred',()=>{
  const h=setup(),e=h.event('story_bridge_crew_question');
  h.S.flags.bridge_crew_answer=true;h.S.used.push(e.id);
  const historical='이미 읽고 선택했던 예전 결과';
  h.S.pendingPresentation={version:1,phase:'result',eventId:e.id,
    choiceIndex:1,outcomeIndex:0,text:historical,chips:[]};
  h.reload();assert(h.G.resumePresentation());
  assert.equal(h.S.pendingPresentation.text,historical);
  assert.equal(h.G.resolvePresentedChoice(e,e.choices[0]).ok,false);
  const result=h.G.resolvePresentedChoice(e,e.choices[1]);
  assert(result.ok&&!result.applied);assert.equal(result.out.text,historical);
  assert.equal(h.D.journeyReasonRecall(h.S,'entry'),'');
  assert.equal(h.D.journeyReasonRecall(h.S),'');
  assert(!h.S.flags.bridge_reason_family);
  assert.doesNotMatch(h.D.finaleHomeClosure(h.S),/엄마.*기다|마주 앉/);
  h.S.flags.bridge_reason_stop=true;h.S.flags.bridge_reason_family=true;
  assert.equal(h.D.journeyReasonRecall(h.S),'','conflicting flags are not a remembered choice');
});

test('both father routes pause after the death and preserve records, provenance and one-time payment',()=>{
  for(const id of ['parents_father_last_log','main_recovery_parents_father_last_log']){
    for(const index of [0,1]){
      const h=setup(),e=h.event(id),turns=read(e.turns,h.S);
      const death=turns.findIndex(turn=>/아빠는.*죽었다/.test(turn.text));
      assert(death>=0);
      assert.match(turns[death+1].text,/다음 장.*다시 돌아왔다/);
      assert.match(turns[death+2].text,/연필.*쓰지 못했다/);
      assert(turns.some(turn=>turn.kind==='record'&&/00:17/.test(turn.text)));
      if(id.startsWith('main_recovery')){
        assert(turns.filter(turn=>turn.kind==='record').every(turn=>turn.name.includes('사본')));
        assert.match(e.text,/수원.*사본/);
        assert.match(e.choices[1].out[0].text,/사본에 적힌.*빈 금속 표찰에 새겨/);
      }
      const out=h.choose(e,index,true);
      assert(h.S.flags.father_fate_known);
      assert.match(out.out.text,index===0?/장부를 닫지 못했다/:/시동.*걸지 않았다/);
      assert.equal(h.G.mainEvidenceRows().find(row=>row.id==='father')?.done,true);
    }
  }
});

test('paid parent and local-ending prose and reader cursor remain frozen after the rewrite',()=>{
  for(const id of ['parents_father_last_log','main_recovery_parents_father_last_log','seoul_night']){
    for(const index of [0,1]){
      const h=setup(),e=h.event(id),text='이전에 읽은 결과와 그때의 여운';
      h.S.used.push(e.id);
      h.S.pendingPresentation={version:1,phase:'result',eventId:id,
        choiceIndex:index,outcomeIndex:0,text,chips:[],view:{
          turns:[{kind:'narration',text:'이전에 읽은 첫 줄'},{kind:'narration',text}],
          index:1,readingRecord:text}};
      const before=plain({flags:h.S.flags,min:h.S.min,items:h.S.items});
      h.reload();assert(h.G.resumePresentation());
      const result=h.G.resolvePresentedChoice(e,e.choices[index]);
      assert(result.ok&&!result.applied);assert.equal(result.out.text,text);
      const view={eventId:id,phase:'outcome'};h.G.restorePresentationView(view);
      assert.equal(view.index,1);assert.equal(view.turns[1].text,text);
      assert.equal(view.readingRecord,text);
      assert.deepEqual(plain({flags:h.S.flags,min:h.S.min,items:h.S.items}),before);
    }
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
  assert.match(prose(out,h.S),/빈 금속 표찰에 새겨/);
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

test('final homecoming is readable before ending, survives reload, and never pays twice',()=>{
  for(const method of ['transfer','sleep','quarantine'])for(const mother of [false,true]){
    const h=setup(),e=h.event('seoul_session_reset');
    h.S.at='seoul';h.S.flags['core_'+method]=true;
    h.S.flags.mother_broadcast_ready=mother;
    const result=h.choose(e,0,true);
    assert(h.S.flags.story_done);assert(!h.S.ended,'final result must be read before terminal screen');
    assert.equal(h.S.pendingPresentation.phase,'result');
    const turns=read(result.out.turns,h.S),before=plain(h.S.flags);
    assert.equal(turns.some(t=>t.who==='mother'),mother);
    assert.equal(turns.some(t=>t.scene==='parents-mother-reunion-v1'),mother);
    assert(turns.every(t=>!t.scene||e.choices[0].out[0].scenes.includes(t.scene)));
    if(mother){
      assert.match(result.out.text,/수원 외곽 중계소/);
      assert.match(result.out.text,/할아버지 얘기부터/);
      assert.doesNotMatch(result.out.text,/용서했|전부 이해|다음 목적지는/);
    }
    h.G.capturePresentationView({eventId:e.id,phase:'outcome',turns,index:2,
      sceneKeys:e.choices[0].out[0].scenes});
    h.reload();assert(h.G.resumePresentation());
    assert.equal(h.shown.at(-1),e.id);assert(!h.S.ended);
    const restored={eventId:e.id,phase:'outcome'};h.G.restorePresentationView(restored);
    assert.equal(restored.index,2);
    assert.deepEqual(plain(restored.turns),plain(turns),'saved speakers and authored scene markers survive');
    assert.equal(h.G.resolvePresentedChoice(e,e.choices[0]).applied,false);
    assert.deepEqual(plain(h.S.flags),before);
    h.G.queuePresentation();assert(h.S.ended);assert.equal(h.S.endKind,'story_done');
  }
});

test('old final receipts stay frozen and completed legacy journeys do not replay homecoming',()=>{
  const h=setup(),e=h.event('seoul_session_reset');
  h.choose(e,0);h.S.pendingPresentation.text='옛 마지막 결과';
  const oldTurns=[{kind:'narration',text:'저장된 마지막 문장'}];
  h.G.capturePresentationView({eventId:e.id,phase:'outcome',turns:oldTurns,index:0});
  h.reload();assert(h.G.resumePresentation());
  assert.equal(h.G.resolvePresentedChoice(e,e.choices[0]).out.text,'옛 마지막 결과');
  const restored={eventId:e.id,phase:'outcome'};h.G.restorePresentationView(restored);
  assert.deepEqual(plain(restored.turns),oldTurns);
  h.S.pendingPresentation=null;assert(h.G.resumePresentation());assert(h.S.ended);
});

test('the opening family gets a choice to return, without an invented cure or forced relocation',()=>{
  const h=setup();
  for(const helped of [false,true]){
    h.S.flags.intro_family_helped=helped;
    const before=JSON.stringify(h.S),turns=h.D.finaleReturnTurns(h.S);
    const radio=turns.filter(t=>t.kind==='radio');
    assert.equal(radio.length,helped?1:0);
    if(helped){
      assert.equal(radio[0].name,'하진 · 부산 부두');
      assert.match(radio[0].text,/꼭 가야 하는 건 아니고요/);
      assert.match(turns.map(t=>t.text).join('\n'),/아이들과 얘기해/);
      assert.doesNotMatch(turns.map(t=>t.text).join('\n'),/유나.*나았|가족.*서울에 도착/);
    }
    assert.equal(JSON.stringify(h.S),before);
  }
});

test('gate remains south of the river and key recording answers why this truck',()=>{
  const h=setup();
  for(const tries of [0,1]){
    h.S.flags.seoulTries=tries;
    assert.match(read(h.D.gateEvent.text,h.S),/한강 남쪽/);
    assert.doesNotMatch(read(h.D.gateEvent.text,h.S),/한강을 건넜다|남산 1km/);
  }
  assert.match(read(h.D.seoulOpenEvent.text,h.S),/한강 남쪽.*관문/);
  const key=h.event('story_family_key');
  assert.match(key.text,/계기판 뒤.*고치려고/);
  assert.match(key.text,/4–5쪽.*북부 연락소/);
  const spoken=dialogue(h,key);
  assert.deepEqual(Array.from(spoken,t=>t.who),['father','mother','father','mother','father','mother']);
  h.S.flags={bridge_reason_both:true,mother_broadcast_ready:true};
  assert.doesNotMatch(h.D.finaleHomeClosure(h.S),/시트|운전석/);
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
