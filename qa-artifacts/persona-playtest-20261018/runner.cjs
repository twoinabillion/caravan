/* Diagnostic only: actual source engine with isolated memory and presentation stubs.
   No browser, user save, cheats, outcome-peeking policy, or production-code changes. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto');
const ROOT='/Users/sang/caravan',OUT=__dirname;
const {STATIC_CONTENT_FILES}=require(ROOT+'/tools/content-registry.cjs');
const copy=x=>x===undefined?null:JSON.parse(JSON.stringify(x));
const read=(value,state)=>typeof value==='function'?value(state):value;
const prose=(owner,state)=>{const turns=read(owner?.turns,state);return Array.isArray(turns)?turns.map(t=>t.text).join('\n'):read(owner?.text,state)||'';};
function runPersona(config){
  if(!/^player\d\d$/.test(config.id))throw Error('Use playerNN id');
  const store=new Map(),timers=[],trace=[],messages=[],notifications=[];let current=null,terminal=null,seq=0;
  const noop=()=>{},UI=new Proxy({modalOpen:()=>!!current,onArrive:()=>0,
    toast:message=>{messages.push(String(message));notifications.push(String(message));},showEnding:kind=>terminal=kind,
    roadApproach:(options,done)=>{if(done)done();return true;}},{get:(o,key)=>o[key]||noop});
  const ctx=vm.createContext({console,Date,URLSearchParams,location:{search:''},
    setTimeout:(fn)=>{timers.push(fn);return timers.length;},clearTimeout:noop,
    document:{readyState:'loading',addEventListener:noop,documentElement:{dataset:{}}},
    window:{dispatchEvent:noop},CustomEvent:function(){},
    localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
    UI,SND:new Proxy({},{get:()=>noop})});
  const sources=[...STATIC_CONTENT_FILES,...fs.readdirSync(ROOT+'/src').filter(f=>/^04[a-h]-.*\.js$/.test(f)).sort().map(f=>'src/'+f)];
  for(const file of sources)vm.runInContext(fs.readFileSync(ROOT+'/'+file,'utf8'),ctx,{filename:file});
  vm.runInContext('globalThis.g=G;globalThis.d=D;Object.defineProperty(globalThis,"s",{get:()=>S});',ctx);
  const G=ctx.g,D=ctx.d,S=()=>ctx.s;
  UI.showEvent=event=>{if(!event)return;current=event;if(!event.openingStep&&!event.campConversation)G.beginPresentation(event);};
  function flush(){let n=0;while(timers.length&&!current&&n++<60){const fn=timers.shift();fn();}if(n>=60)throw Error('timer drain limit');}
  function snap(){const s=S();return {at:s.at,location:D.nodes[s.at]?.name,day:s.day,min:Math.round(s.min),km:Math.round(s.stats.km*10)/10,
    driving:s.driving?{from:s.driving.from,to:s.driving.to,gone:s.driving.gone,dist:s.driving.dist}:null,
    fuel:s.fuel,water:s.water,food:s.food,scrap:s.scrap,van:s.van,fatigue:s.fatigue,party:[...s.party],items:copy(s.items),
    ended:s.ended,endKind:s.endKind,main:G.mainQuestEntry(),navigation:G.questNavigationPlan('main_namsan')};}
  function record(action,before,details={}){const after=snap();trace.push({n:++seq,action,...details,before,after,messages:messages.splice(0)});}
  function act(action,fn,details={}){const before=snap(),result=fn();flush();record(action,before,{...details,result:copy(result)});return result;}
  const memory={},visits={},talked={},explored={},labor={},errors=[];
  function eventObservation(event){return {eventId:event.id,title:event.title,text:prose(event,S()),
    controls:event.id==='seoul_decision'?[{id:'prepare-finale',label:'수원으로 내려가 준비한다 · 60분'}]:[],
    choices:(event.choices||[]).map((c,index)=>({index,id:c.id,label:c.label,hint:[c.hint,c.cost,...G.choiceForeseeable(c).map(row=>row.label+' · '+row.text)].filter(Boolean).map(value=>typeof value==='string'?value:JSON.stringify(value)).join(' · '),
      visible:G.reqVisible(G.choiceReq(c)),enabled:G.reqOk(G.choiceReq(c)).ok,requirement:G.reqOk(G.choiceReq(c)).t||''})),state:snap()};}
  function resolve(event){
    const obs=eventObservation(event),available=obs.choices.filter(c=>c.visible&&c.enabled);
    if(!available.length)throw Error('No enabled choice: '+event.id);
    const choiceIndex=typeof config.choose==='function'?config.choose(copy(obs),memory):available[0].index;
    if(choiceIndex==='prepare-finale'&&event.id==='seoul_decision'){
      current=null;act('prepare-finale',()=>G.prepareFinale(),{observation:obs});return;
    }
    const visible=available.find(c=>c.index===choiceIndex);if(!visible)throw Error('Policy selected unavailable choice '+choiceIndex+' at '+event.id);
    if(event.nameInput)G.setOpeningNameDraft(config.name||config.id);
    const before=snap(),choice=event.choices[choiceIndex];
    const result=event.openingStep?G.resolveOpeningChoice(event.id,choice.id):G.resolvePresentedChoice(event,choice);
    if(!result.ok)throw Error('Choice failed '+event.id+': '+result.why);
    record('choice',before,{observation:obs,chosen:visible,resultText:prose(result.out,S()),chips:copy(result.chips),applied:result.applied});
    if(S().ended){current=null;return;}
    if(config.reloadAfterChoice){
      const savedBefore=snap();G.save();const loaded=G.load();
      const replay=event.openingStep?G.resolveOpeningChoice(event.id,choice.id):G.resolvePresentedChoice(event,choice);
      record('paid-result-reload',savedBefore,{loaded,replayed:replay.ok,applied:replay.applied});
      if(!loaded||!replay.ok||replay.applied)throw Error('Paid result replay changed effects at '+event.id);
    }
    if(result.out?.fx?.offerComp){
      const cid=result.out.fx.offerComp,accept=config.acceptCompanions!==false;
      if(accept)act('accept-companion',()=>G.doRecruit(cid),{cid});
      else record('decline-companion',snap(),{cid});
    }
    current=null;
    if(event.openingStep)G.continueOpening(event.id);
    else if(event.campConversation){/* The engine already owns the saved camp result. */}
    else {const next=G.queuePresentation(S()._chain);if(next&&!S().ended)G.presentTransition();}
    flush();
  }
  function observe(){
    const s=S(),stlId=D.nodes[s.at]?.stl,stl=D.stls[stlId];
    const plan=G.questNavigationPlan('main_namsan');
    const routes=G.neighbors(s.at).filter(n=>s.known.includes(n.id)).map(n=>({id:n.id,name:D.nodes[n.id].name,km:n.km,
      check:copy(G.canTravelTo(n.id)),forecast:copy(G.travelForecast(n.id)),distanceToGoal:plan?G.questGraphDistance(n.id,plan.waypoint||plan.target,true):null,
      distanceToRecruit:s.recruitQ?.target?G.questGraphDistance(n.id,s.recruitQ.target,true):null}));
    return {...snap(),notifications:notifications.slice(-12),night:G.isNight(),explore:copy(G.exploreStatus()),routes,
      stl:stl?{id:stlId,name:stl.name,recruit:stl.recruit&&!G.hasComp(stl.recruit)&&!s.recruitQ&&D.recruitQuests[stl.recruit]?{id:stl.recruit,name:D.recruitQuests[stl.recruit].name}:null,
        trade:(stl.trade||[]).map((row,index)=>({index,label:row[0],key:row[1],qty:row[2],price:Math.max(1,Math.round(row[3]*G.marketMul(stlId,row[1])*G.tradeDiscount(stlId)))})),
        actions:(stl.field?.actions||[]).map(a=>({id:a.id,label:a.label||a.name||a.title,time:a.time,description:a.desc||a.text||'',status:copy(G.stlFieldStatus(stlId,a))})).filter(a=>!a.status.hiddenLocked)}:null,
      upgrades:stl||s.roadGarage?(D.upgrades||[]).map(u=>({id:u.id,name:u.nm||u.name,cost:copy(u.cost),owned:!!s.up[u.id],status:copy(G.canBuyUp(u.id))})):[],
      seatCapacity:G.seatCapacity(),
      exploredHere:explored[s.at]||0,visits:copy(visits),recruitQuest:s.recruitQ?{id:s.recruitQ.id,stage:s.recruitQ.stage,target:s.recruitQ.target}:null};
  }
  function defaultDecision(obs){
    const opts=config.behavior||{},r=obs.routes.filter(r=>r.check.ok).sort((a,b)=>(a.distanceToGoal??0)+a.km-((b.distanceToGoal??0)+b.km));
    const reserve=opts.reserve??8,foodNeed=Math.min(S().foodMax,Math.max(5,G.partySize()*3)),waterNeed=Math.min(S().waterMax,Math.max(6,G.partySize()*4));
    if(obs.stl){
      const needs=obs.stl.trade.filter(row=>(row.key==='fuel'&&obs.fuel<(opts.fuelTarget??35))||(row.key==='food'&&obs.food<foodNeed)||(row.key==='water'&&obs.water<waterNeed));
      const row=needs.find(row=>obs.scrap>=row.price&&(row.key==='fuel'||G.canStoreSupply(row.key,row.qty)));
      if(row)return {type:'trade',index:row.index};
      if((needs.length&&obs.scrap<reserve)||(opts.helpWork&&!(labor[obs.at]>=2))){
        const job=obs.stl.actions.find(a=>a.status.ok&&/수리|정비|나르|거들|일손|품앗|정리|밸브|발전|펌프|분류|운반/.test(a.label||''));
        if(job&&obs.fatigue<70)return {type:'work',id:job.id};
      }
    }
    if(obs.van<(opts.repairBelow??55)&&obs.items['부품']>0)return {type:'repair'};
    if(obs.fatigue>(opts.restAt??65)||obs.night&&!opts.driveNight)return {type:'camp'};
    if(opts.seekCompanions&&obs.stl?.recruit&&!memory['met:'+obs.stl.recruit.id])return {type:'meet-recruit',cid:obs.stl.recruit.id};
    if(opts.followRecruit&&obs.recruitQuest?.stage!=='ready'&&obs.recruitQuest?.target&&obs.recruitQuest.target!==obs.at){
      const next=obs.routes.filter(r=>r.check.ok).sort((a,b)=>a.km+a.distanceToRecruit-b.km-b.distanceToRecruit)[0];
      if(next)return {type:'travel',to:next.id};
    }
    if(opts.talk&&obs.party.length){const cid=obs.party.find(id=>talked[id]!==obs.day);if(cid)return {type:'talk',cid};}
    if(obs.at===obs.navigation?.target&&obs.explore.ok)return {type:'explore'};
    if(opts.exploreEach&&!obs.exploredHere&&obs.explore.ok)return {type:'explore'};
    if(opts.detours?.length){const target=opts.detours.find(id=>!visits[id]);
      if(target&&obs.at!==target){const next=obs.routes.filter(row=>row.check.ok).sort((a,b)=>a.km+G.questGraphDistance(a.id,target,true)-b.km-G.questGraphDistance(b.id,target,true))[0];if(next)return {type:'travel',to:next.id};}}
    if(r[0])return {type:'travel',to:r[0].id};
    if(obs.explore.ok&&obs.exploredHere<2)return {type:'explore'};
    return {type:'camp'};
  }
  let status='limit',error=null;
  G.seedOverride=config.seed;G.newGame('onroad','', 'interactive',undefined,config.pack||'fuel');G.seedOverride=undefined;
  visits[S().at]=1;record('new-game',snap(),{persona:config.persona,seed:config.seed,pack:config.pack});
  try{
    let prior='',unchanged=0;
    for(let iteration=0;iteration<(config.maxActions||1800);iteration++){
      flush();if(S().ended){status='ended';break;}
      if(S().day>(config.maxDays||100)){status='day-limit';break;}
      const opening=G.openingPending();if(opening){resolve(opening);continue;}
      if(current){resolve(current);continue;}
      if(S().pendingPresentation||S()._chain){if(G.resumePresentation()){continue;}}
      if(S().driving){
        const before=snap();let ticks=0;
        while(S().driving&&!current&&!S().ended&&ticks++<3000){G.tick(0.5);flush();}
        record('drive',before,{ticks});if(!S().driving&&S().at)visits[S().at]=(visits[S().at]||0)+1;continue;
      }
      if(G.resumePresentation())continue;
      if(S().at==='seoul'&&G.seoulReady()) {const stage=G.seoulStage();if(stage<5){act('seoul-enter',()=>G.seoulEnter(stage),{stage});continue;}}
      if(S().recruitQ&&['task','follow','ready'].includes(S().recruitQ.stage)&&S().recruitQ.target===S().at){
        const rq=S().recruitQ,key=JSON.stringify([rq.id,rq.stage,rq.target,S().at,S().day,G.seatCapacity()]);
        // A returned/declined/seat-blocked recruitment must not reopen every frame.
        // A new stage, earned seat or later visit/day permits another explicit attempt.
        if(!memory['recruit-step:'+key]){memory['recruit-step:'+key]=true;act('recruit-step',()=>G.openRecruitStep());if(current)continue;}
      }
      const obs=observe(),decision=typeof config.decide==='function'?config.decide(copy(obs),memory)||defaultDecision(obs):defaultDecision(obs);
      const signature=JSON.stringify([obs.at,obs.day,obs.min,obs.km,obs.fuel,obs.scrap,obs.fatigue,decision]);
      unchanged=signature===prior?unchanged+1:0;prior=signature;if(unchanged>3){status='stalled';error='repeated no-op '+JSON.stringify(decision);break;}
      switch(decision.type){
        case 'travel':act('travel',()=>G.startTravel(decision.to),{to:decision.to,observation:obs});break;
        case 'explore':explored[S().at]=(explored[S().at]||0)+1;act('explore',()=>G.explore(),{observation:obs});break;
        case 'camp':act('camp',()=>G.camp(),{observation:obs});break;
        case 'trade':act('trade',()=>G.trade(obs.stl.id,decision.index),{offer:obs.stl.trade.find(row=>row.index===decision.index)});break;
        case 'work':labor[S().at]=(labor[S().at]||0)+1;act('work',()=>G.doStlFieldAction(obs.stl.id,decision.id),{observation:obs,id:decision.id});break;
        case 'repair':act('field-repair',()=>G.fieldRepair());break;
        case 'talk':talked[decision.cid]=S().day;act('talk',()=>G.talkTo(decision.cid),{cid:decision.cid});break;
        case 'meet-recruit':memory['met:'+decision.cid]=true;act('meet-recruit',()=>G.openRecruitMeet(decision.cid),{cid:decision.cid});break;
        case 'upgrade':act('buy-upgrade',()=>G.buyUpgrade(decision.id),{id:decision.id});break;
        case 'reload':act('save-reload',()=>{G.save();return G.load();});break;
        default:throw Error('Unknown policy action '+JSON.stringify(decision));
      }
      // Level-up is a visible earned decision, not a grant. Default first skill.
      for(const cid of S().party)if(S().comps[cid]?.pending)act('earned-perk',()=>G.choosePerk(cid,config.perkChoice||0),{cid});
    }
  }catch(err){status='error';error=String(err.stack||err);errors.push(error);}
  if(S().ended)status='ended';
  const summary={id:config.id,persona:config.persona,seed:config.seed,pack:config.pack,status,error,ending:terminal||S().endKind||null,
    state:snap(),method:G.resolvedFinaleMethod(),storyDone:!!S().flags.story_done,route:trace.filter(r=>r.action==='travel'&&r.result!==false).map(r=>r.to),
    actions:trace.length,choices:trace.filter(r=>r.action==='choice').length,events:[...new Set(trace.filter(r=>r.action==='choice').map(r=>r.observation.eventId))],
    runnerHash:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),
    sourceHash:crypto.createHash('sha256').update(sources.map(file=>fs.readFileSync(ROOT+'/'+file,'utf8')).join('\n')).digest('hex'),
    limits:['Node VM engine simulation, not browser or human playtest','Presentation/audio/timing are stubbed; no visual/input/audio QA','Policy sees displayed choices/goals/costs, not future fx/outcomes','No edits to source or actual user save; no infinite resources'],errors};
  fs.writeFileSync(path.join(OUT,config.id+'-trace.json'),JSON.stringify({summary,trace},null,2));
  fs.writeFileSync(path.join(OUT,config.id+'-summary.json'),JSON.stringify(summary,null,2));
  fs.writeFileSync(path.join(OUT,config.id+'-save.json'),JSON.stringify(S(),null,2));
  return summary;
}
module.exports={runPersona};
if(require.main===module){console.log(JSON.stringify(runPersona({id:'player00',persona:'harness smoke',seed:181000,maxActions:100}),null,2));}
