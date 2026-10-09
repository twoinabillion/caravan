// Real engine and closeEvent, isolated VM/storage; never changes the Studio save.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const read=file=>fs.readFileSync(file,'utf8'),copy=value=>JSON.parse(JSON.stringify(value)),noop=()=>{};
function harness(entry='story'){
  const storage=new Map(),calls=[],classes=new Set(['on']);
  const wrap={classList:{contains:key=>classes.has(key)}};
  const sheet={classList:{remove:noop},dataset:{},style:{removeProperty:noop}};
  const ctx=vm.createContext({console,URLSearchParams,location:{search:''},
    setTimeout:fn=>{calls.push('timer');return 0},clearTimeout:noop,
    document:{readyState:'loading',addEventListener:noop,documentElement:{dataset:{}}},
    window:{dispatchEvent:noop},CustomEvent:function(){},
    localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
    UI:new Proxy({modalOpen:()=>classes.has('on'),onArrive:()=>1},{get:(obj,key)=>obj[key]||noop}),
    SND:new Proxy({setDriving:on=>calls.push('driving:'+on)},{get:(obj,key)=>obj[key]||noop}),
    AMBI:{restore:()=>calls.push('ambient:restore')},
    $:selector=>selector==='#ev-wrap'?wrap:sheet,
    clearStoryAuto:()=>calls.push('auto:clear'),
    closeModal:()=>{calls.push('close');classes.delete('on')},
    renderAll:()=>calls.push('road:render'),renderHud:()=>calls.push('hud'),
    showCampHub:()=>calls.push('camp'),showSeoul:noop,
    curEv:null,curStory:null,curCombatChoices:[]});
  for(const file of STATIC_CONTENT_FILES)vm.runInContext(read(file),ctx);
  for(const file of fs.readdirSync('src').filter(file=>/^04[a-h]-/.test(file)).sort())vm.runInContext(read('src/'+file),ctx);
  vm.runInContext('globalThis.g=G;globalThis.d=D;Object.defineProperty(globalThis,"s",{get:()=>S,set:value=>S=value});',ctx);
  ctx.showEvent=ctx.UI.showEvent=event=>{
    assert(classes.has('on'),'shell must not expose the road between scenes');
    calls.push('show:'+event.id);ctx.curEv=event;ctx.curStory={eventId:event.id,phase:'event'};
    ctx.g.beginPresentation(event);
  };
  ctx.UI.roadApproach=()=>calls.push('approach');
  const ui=read('src/07-ui.js'),start=ui.indexOf('  function closeEvent('),end=ui.indexOf('\n  function ',start+4);
  vm.runInContext(ui.slice(start,end),ctx);
  ctx.g.newGame('onroad','검수',entry);
  calls.length=0;
  return {ctx,calls,classes,sheet,event:id=>ctx.g.presentationEvent(id),
    show:event=>ctx.showEvent(event),reload:()=>{ctx.g.save();assert.equal(ctx.g.load(),true)}};
}
const drive=()=>({from:'busan',to:'yangsan',dist:20,gone:13,road:'high',wx:'clear',slots:[],si:0,eventCount:0,snapshot:{}});
const resources=state=>copy({min:state.min,fuel:state.fuel,water:state.water,food:state.food,scrap:state.scrap,van:state.van,items:state.items});
function choose(h,event,index=0){
  const result=h.ctx.g.resolvePresentedChoice(event,event.choices[index]);
  assert(result.ok);h.ctx.curStory.phase='outcome';return result;
}
test('explicit combat chain swaps in the modal with no timer, road, audio restart or second approach',()=>{
  const h=harness(),{ctx,calls}=h,event=h.event('combat_walker_read');
  ctx.s.driving=drive();ctx.s.at=null;ctx.s.stopover={name:'검수 정차'};
  h.show(event);choose(h,event);h.reload();const before=resources(ctx.s),count=ctx.s.stats.events;
  assert.equal(ctx.g.resolvePresentedChoice(event,event.choices[0]).applied,false);
  calls.length=0;ctx.closeEvent();
  assert.deepEqual(calls,['auto:clear','show:combat_walker_strike','hud']);
  assert(h.classes.has('on'));assert.equal(ctx.s.stats.events,count+1);
  assert.equal(ctx.s.pendingPresentation.phase,'event');assert.equal(ctx.s.pendingPresentation.eventId,'combat_walker_strike');
  assert(ctx.s.stopover);assert.deepEqual(resources(ctx.s),before);assert.equal(ctx.s.driving.gone,13);
  h.reload();calls.length=0;assert(ctx.g.resumePresentation());
  assert.deepEqual(calls,['show:combat_walker_strike']);assert.equal(ctx.s.stats.events,count+1);
});
test('persisted transition resumes directly once; an independent encounter still uses approach',()=>{
  const h=harness(),{ctx,calls}=h;ctx.s.driving=drive();ctx.s.at=null;
  const event=h.event('combat_walker_read');h.show(event);choose(h,event);
  assert.equal(ctx.g.queuePresentation(ctx.s._chain),'combat_walker_strike');h.reload();
  const count=ctx.s.stats.events;calls.length=0;assert(ctx.g.resumePresentation());
  assert.deepEqual(calls,['show:combat_walker_strike']);assert.equal(ctx.s.stats.events,count+1);
  h.reload();calls.length=0;assert(ctx.g.resumePresentation());assert.equal(ctx.s.stats.events,count+1);
  ctx.s.pendingPresentation=null;calls.length=0;ctx.g.openEvent(h.event('combat_walker_strike'));
  assert.deepEqual(calls,['approach']);assert(ctx.s.driving.approach);
});
test('recruitment continuation preserves effects, consent and queued unrelated stories',()=>{
  const h=harness(),{ctx,calls}=h,event=h.event('meet_scrapyard');ctx.s.at='miryang';
  ctx.s._storyQueue=['onboarding_first_road'];h.show(event);choose(h,event);
  const before=resources(ctx.s);calls.length=0;ctx.closeEvent();
  assert.deepEqual(calls,['auto:clear','show:rq_minji_request','hud']);assert.equal(ctx.s.recruitQ,null);
  assert.deepEqual(resources(ctx.s),before);assert.deepEqual(copy(ctx.s._storyQueue),['onboarding_first_road']);
  const request=h.event('rq_minji_request');choose(h,request,1);calls.length=0;ctx.closeEvent();
  assert(calls.includes('close'));assert.equal(ctx.s.pendingPresentation,null);assert.equal(ctx.s.recruitQ,null);
  assert.deepEqual(copy(ctx.s._storyQueue),['onboarding_first_road']);
});
test('opening cannot exit unread, then advances in place and saves its next step',()=>{
  const h=harness('interactive'),{ctx,calls}=h,event=ctx.g.openingPending();h.show(event);
  calls.length=0;assert.equal(ctx.closeEvent(),false);assert.equal(calls.length,0);
  choose(h,event);const before=resources(ctx.s);h.reload();calls.length=0;ctx.closeEvent();
  assert.equal(ctx.s.opening.step,1);assert.deepEqual(calls,['auto:clear','show:'+ctx.g.openingPending().id,'hud']);
  assert.deepEqual(resources(ctx.s),before);h.reload();assert.equal(ctx.g.openingPending().id,ctx.curEv.id);
  while(ctx.g.openingPending()){
    const next=ctx.g.openingPending();h.show(next);choose(h,next);ctx.closeEvent();
  }
  assert(ctx.s.opening.completed);assert.equal(ctx.s.pendingPresentation,null);assert(!h.classes.has('on'));
  assert(ctx.s._storyQueue.includes('onboarding_first_road'));assert(ctx.g.canTravelTo('yangsan').ok);
});
test('bus repair still spends authored time and parts once, then restores the same receipt and next scene',()=>{
  const h=harness('interactive'),{ctx}=h;
  h.show(ctx.g.openingPending());choose(h,ctx.g.openingPending());ctx.closeEvent();
  const bus=ctx.g.openingPending();assert.equal(bus.id,'opening_bus_repair');
  ctx.s.items['부품']=2;const before=resources(ctx.s);
  const result=choose(h,bus,0);
  assert.equal(ctx.s.min,before.min+20);assert.equal(ctx.s.items['부품'],1);
  assert(result.chips.some(c=>c.t==='20분 경과'));assert(result.chips.some(c=>c.t==='부품 -1'));
  const receipt=copy(result.chips),after=resources(ctx.s);h.reload();
  const restored=ctx.g.resolvePresentedChoice(bus,bus.choices[0]);
  assert.equal(restored.applied,false);assert.deepEqual(copy(restored.chips),receipt);
  assert.deepEqual(resources(ctx.s),after);ctx.closeEvent();
  assert.equal(ctx.g.openingPending().id,'opening_failed_appeal');assert.deepEqual(resources(ctx.s),after);
});
test('final/unknown chains exit once and restore the road only after the last scene',()=>{
  for(const chain of [null,'not-an-event']){
    const h=harness(),{ctx,calls}=h;ctx.s.driving=drive();ctx.s.at=null;ctx.s._chain=chain;
    ctx.s.stopover={name:'끝'};ctx.curEv={id:'last'};ctx.curStory={phase:'outcome'};
    ctx.closeEvent();assert.deepEqual(calls,['auto:clear','close','driving:true','ambient:restore','road:render']);
    assert.equal(ctx.s.pendingPresentation,null);assert.equal(ctx.s.stopover,null);
    assert.equal(ctx.closeEvent(),false);assert.equal(calls.filter(call=>call==='close').length,1);
    h.reload();assert.equal(ctx.g.resumePresentation(),false);
  }
});
test('shared craft/companion sheets still close with no curEv; camp/local owners keep their exit paths',()=>{
  for(const kind of ['shared','local','camp']){
    const h=harness(),{ctx,calls}=h;
    ctx.curEv=kind==='shared'?null:kind==='local'?{localConversation:true}:{campConversation:true};
    if(kind==='camp')ctx.s.campConversation={active:true};
    ctx.closeEvent();assert.equal(calls.filter(call=>call==='close').length,1);
    if(kind==='camp'){assert.equal(ctx.s.campConversation.active,false);assert.equal(calls.at(-1),'camp')}
    if(kind==='local')assert(!calls.includes('road:render'));
  }
});
