// Actual engine + in-memory storage. Never touches the Studio save.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('./content-registry.cjs');
const read=f=>fs.readFileSync(f,'utf8');
function setup(){
  const storage=new Map(),noop=()=>{},c=vm.createContext({console,URLSearchParams,
    location:{search:''},setTimeout:()=>0,clearTimeout:noop,
    document:{readyState:'loading',addEventListener:noop},window:{dispatchEvent:noop},CustomEvent:function(){},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    UI:new Proxy({modalOpen:()=>false,onArrive:()=>1},{get:(o,k)=>o[k]||noop}),SND:new Proxy({},{get:()=>noop})});
  for(const f of STATIC_CONTENT_FILES)vm.runInContext(read(f),c);
  for(const f of fs.readdirSync('src').filter(f=>/^04[a-h]-/.test(f)).sort())vm.runInContext(read('src/'+f),c);
  vm.runInContext('globalThis.g=G;globalThis.d=D;Object.defineProperty(globalThis,"s",{get:()=>S,set:v=>S=v});',c);
  c.g.newGame('story','상혁');
  c.s.at='miryang';c.s.day=3;c.s.min=540;c.s.flags.recruit_migration_v2=true;
  c.g.openEventById=id=>{c.opened=id;return true;};
  vm.runInContext(read('src/07d-ui-quests.js')+';globalThis.j=QuestJournal;',c);
  const ui=read('src/07-ui.js'),start=ui.indexOf('  function minjiGuestNoteHtml()'),end=ui.indexOf('  function normalizeRecruitDecisionDock',start);
  vm.runInContext('const esc=s=>String(s??"").replaceAll("<","&lt;");'+ui.slice(start,end)+';globalThis.guestHtml=minjiGuestNoteHtml;globalThis.decisionHtml=recruitDecisionHtml;',c);
  return c;
}
const event=(c,id)=>c.d.events.find(e=>e.id===id);
const reload=c=>{c.g.save();assert.equal(c.g.load(),true);};
const drive=()=>({from:'ulsan',to:'gyeongju',km:38,gone:0,road:'normal',slots:[],snapshot:{},startMin:600});
function accept(c){c.g.applyFx(event(c,'meet_scrapyard').choices[0].out[0].fx);c.g.applyFx(event(c,'rq_minji_request').choices[0].out[0].fx);}
function task(c,method){accept(c);c.s.at='ulsan';c.s.up.winch=1;c.s.scrap=24;c.g.applyFx(event(c,'rq_minji_task').choices.find(ch=>ch.out[0].fx.recruitChoice===method).out[0].fx);}

test('listening and salvage never imply consent; decline/revisit cannot farm first-meeting loot',()=>{
  for(const choice of [0,1])for(const outcome of choice===1?[0,1]:[0]){
    const c=setup();c.g.applyFx(event(c,'meet_scrapyard').choices[choice].out[outcome].fx);
    assert.equal(c.s.recruitQ,null);assert.equal(c.s._chain,'rq_minji_request');
    const before=[c.s.scrap,c.s.van,c.s.items.부품];
    c.g.applyFx(event(c,'rq_minji_request').choices[1].out[0].fx);reload(c);
    assert.equal(c.s.recruitQ,null);assert.equal(c.guestHtml(),'');
    assert(c.g.openRecruitMeet('minji'));assert.equal(c.opened,'rq_minji_request');
    assert.deepEqual([c.s.scrap,c.s.van,c.s.items.부품],before);
    c.g.applyFx(event(c,'rq_minji_request').choices[0].out[0].fx);
    assert.equal(c.s.recruitQ.target,'ulsan');assert.equal(c.s.party.length,0);
    const q=JSON.stringify(c.s.recruitQ);assert.equal(c.g.startRecruitQuest('minji'),false);assert.equal(JSON.stringify(c.s.recruitQ),q);
    reload(c);assert.match(c.guestHtml(),/무릎 위 공구함/);assert.equal(c.g.openRecruitMeet('minji'),false);
  }
});
test('three task gates remain real, and guest road consequences apply once across save/join',()=>{
  for(const method of ['winch','pulley','shield']){
    const c=setup(),e=event(c,'rq_minji_task');
    c.s.up={};c.s.scrap=0;
    assert.equal(c.g.reqOk(e.choices[0].req).ok,false);assert.equal(c.g.reqOk(e.choices[1].req).ok,false);
    task(c,method);assert.equal(c.s.recruitQ.stage,'road');assert.equal(c.s.recruitQ.choice,method);
    const dv=drive(),hull=c.s.van,scrap=c.s.scrap;c.s.driving=dv;c.s.at=null;
    c.g.prepareRecruitGuest(dv);const m=c.g.prepareRecruitMemory(dv);assert.equal(m.choice,method);assert(m.line);
    assert.equal(dv.guestFuel,.92);assert.equal(dv.memoryFuel,method==='winch'?.95:undefined);
    assert.equal(c.s.van,hull+(method==='shield'?4:0));
    reload(c);assert.equal(c.g.prepareRecruitMemory(c.s.driving),null);
    c.g.arrive();assert.equal(c.s.scrap,scrap+(method==='pulley'?2:0));assert.equal(c.s.recruitQ.stage,'follow');
    assert.equal(c.g.openRecruitStep(),false); // same day, no forced confession
    c.s.day++;assert(c.g.openRecruitStep());assert.equal(c.opened,'rq_minji_join');
    reload(c);assert.match(c.decisionHtml('minji'),/아직 결정하지 않고 돌아간다/);
    assert(c.g.openRecruitStep());assert(c.g.doRecruit('minji'));assert.equal(c.s.comps.minji.approach,method);
    reload(c);assert.equal(c.guestHtml(),'');assert.equal(c.g.prepareRecruitMemory(drive()),null);
    assert.equal(c.g.doRecruit('minji'),false);
  }
});
test('mid-leg/legacy guests can get their unused echo on the next departure, never before work',()=>{
  const c=setup();accept(c);assert.equal(c.g.prepareRecruitMemory(drive()),null);
  c.s.recruitQ.stage='follow';c.s.recruitQ.choice='shield';
  assert.equal(c.g.prepareRecruitMemory(drive()).choice,'shield');
  c.s.flags.minji_approach_drive=true;assert.equal(c.g.prepareRecruitMemory(drive()),null);
  c.s.recruitQ={id:'parkss',stage:'road',choice:'medicine'};assert.equal(c.g.prepareRecruitMemory(drive()),null);
});
test('guest camp voice is saved, resolves once, and does not reveal a keepsake or confession',()=>{
  const c=setup();task(c,'pulley');c.s.min=1200;
  c.s.lastCombatReport={day:3,resultCode:'success',threat:'보행기'};
  assert(c.g.prepareCamp('talk','minji').ok);assert.equal(c.s.campConversation.voice,'minji-guest-v1');
  assert.match(c.s.campConversation.context,/도르래/);
  const e=c.g.campConversationEvent(),before=c.s.min;assert.equal(e.choices.length,1);assert.doesNotMatch(e.text,/민규|대장님/);
  reload(c);assert.equal(c.g.campConversationEvent().text,e.text);
  const result=c.g.resolveCampChoice(e.id,'listen');assert(result.applied);assert.equal(c.s.min,before+15);
  assert.equal(c.s.campMemories.minji.pendingBond,2);assert.doesNotMatch(JSON.stringify(result.chips),/자석접시/);
  reload(c);assert.equal(c.g.resolveCampChoice(e.id,'listen').applied,false);assert.equal(c.s.min,before+15);
  assert(c.g.doRecruit('minji'));assert.equal(c.s.comps.minji.bond,7);assert.equal(c.s.campMemories.minji.pendingBond,0);
  assert.equal(c.g.campConversationEvent().text,e.text); // joining cannot rewrite this saved night
});
test('skipping conversation and full-seat postponement preserve the next reachable action',()=>{
  const c=setup();task(c,'winch');c.s.recruitQ.stage='follow';c.s.recruitQ.target=c.s.at;
  c.s.day++;assert(c.g.openRecruitStep());assert.equal(c.s.campConversation,null);
  c.s.party=['leo','jaeyi'];assert.match(c.decisionHtml('minji'),/disabled/);
  assert.equal(c.g.doRecruit('minji'),false);assert.equal(c.s.recruitQ.stage,'ready');
  reload(c);assert(c.g.openRecruitStep());assert.equal(c.opened,'rq_minji_join');
  c.s.party=[];assert(c.g.doRecruit('minji'));assert.equal(c.s.recruitQ,null);
});
test('old pending camp/choice records and quest descriptions stay historical',()=>{
  const c=setup();task(c,'shield');c.g.prepareCamp('talk','minji');delete c.s.campConversation.voice;
  const old=c.g.campConversationEvent();assert.equal(old.choices.length,2);reload(c);assert.equal(c.g.campConversationEvent().text,old.text);
  const row={id:'companion_minji',kind:'companion',companion:'minji',status:'active',steps:[]};
  c.s.recruitQ.stage='task';let j=c.j.entry(row);assert.equal(j.pencil,'');assert.match(j.title,/목소리가 남아 있을까/);
  c.s.recruitQ.stage='road';j=c.j.entry(row);assert.match(j.pencil,/안쪽도 봐야/);
  c.s.flags.minji_approach_drive=true;j=c.j.entry(row);assert.match(j.pencil,/잡아 줬다/);
  assert.doesNotMatch(j.next,/살아 있다|보상|죄책감/);
});
test('actual presentation receipts keep consent, task effects and frozen prose through reload',()=>{
  const c=setup(),meet=event(c,'meet_scrapyard');
  c.g.beginPresentation(meet);
  const heard=c.g.resolvePresentedChoice(meet,meet.choices[0]);assert(heard.applied);reload(c);
  assert.equal(c.g.resolvePresentedChoice(meet,meet.choices[0]).applied,false);assert.equal(c.s.recruitQ,null);
  assert(c.g.queuePresentation(c.s._chain));c.g.presentTransition();
  const request=event(c,'rq_minji_request');c.g.beginPresentation(request);
  const accepted=c.g.resolvePresentedChoice(request,request.choices[0]);assert(accepted.applied);reload(c);
  assert.equal(c.g.resolvePresentedChoice(request,request.choices[0]).applied,false);
  assert.equal(c.g.resolvePresentedChoice(request,request.choices[1]).ok,false);
  c.s.at='ulsan';const task=event(c,'rq_minji_task');c.g.beginPresentation(task);
  const before=c.s.scrap,worked=c.g.resolvePresentedChoice(task,task.choices[1]);assert(worked.applied);assert.equal(c.s.scrap,before-4);
  reload(c);const again=c.g.resolvePresentedChoice(task,task.choices[1]);assert.equal(again.applied,false);assert.equal(c.s.scrap,before-4);assert.equal(again.out.text,worked.out.text);
});
test('real departure owns the guest echo and stops before a second departure can repeat it',()=>{
  const c=setup();task(c,'winch');
  assert.equal(c.g.startTravel('gyeongju'),true);
  assert.equal(c.s.driving.recruitMemory.choice,'winch');assert.equal(c.s.driving.memoryFuel,.95);
  const before=JSON.stringify(c.s.driving);assert.equal(c.g.startTravel('gyeongju'),false);assert.equal(JSON.stringify(c.s.driving),before);
  reload(c);assert.equal(c.s.driving.recruitMemory.line,'아까처럼요. 손 보이면 잠깐만 기다려요.');
});
