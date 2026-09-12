/* Pending presentation owns ordinary event/result/close handoff saves.
   Authored definitions own actions. Saves contain no executable effects or HTML. */
G.presentationEvent = id=>[...D.events,...D.seoulStops,D.seoulOpenEvent,D.gateEvent,
  D.bridgeEvent,D.onboardingMission].find(event=>event&&event.id===id)||null;
G.presentationCopy = value=>JSON.parse(JSON.stringify(value));
G.presentationText = value=>typeof value==='string'?value.slice(0,40000):'';
G.presentationView = view=>{
  if(!view||!Array.isArray(view.turns)||!view.turns.length) return null;
  const kinds=['dialogue','narration','ai','radio','record','letter','thought'];
  const turns=view.turns.slice(0,250).filter(turn=>turn&&kinds.includes(turn.kind)&&typeof turn.text==='string')
    .map(turn=>{
      const row={kind:turn.kind,text:G.presentationText(turn.text)};
      for(const key of ['who','name','voice','sfx','medium'])
        if(typeof turn[key]==='string') row[key]=turn[key].slice(0,160);
      return row;
    });
  if(!turns.length) return null;
  return {turns,index:clamp(Math.floor(Number(view.index)||0),0,turns.length-1),
    knownSpeaker:view.knownSpeaker===true,
    sceneKeys:Array.isArray(view.sceneKeys)?view.sceneKeys.filter(key=>typeof key==='string'&&D.scenes[key]).slice(0,12):[]};
};
G.validatePresentation = value=>{
  if(!value||Array.isArray(value)||value.version!==1||!['event','result','transition'].includes(value.phase)) return null;
  const event=G.presentationEvent(value.eventId);
  if(!event) return null;
  const row={version:1,eventId:event.id,phase:value.phase};
  if(value.phase==='transition') return row;
  row.text=G.presentationText(value.text);
  row.view=G.presentationView(value.view);
  if(value.phase==='result'){
    const ci=value.choiceIndex,oi=value.outcomeIndex;
    if(typeof value.text!=='string'||!Number.isInteger(ci)||!Number.isInteger(oi)||!event.choices[ci]?.out?.[oi]) return null;
    Object.assign(row,{choiceIndex:ci,outcomeIndex:oi});
    row.chips=(Array.isArray(value.chips)?value.chips:[]).slice(0,80)
      .filter(chip=>chip&&typeof chip.t==='string').map(chip=>({t:chip.t.slice(0,1000),
        c:['item','plus','minus'].includes(chip.c)?chip.c:'item'}));
    const combat=value.combatState;
    if(event.combat&&combat&&typeof combat==='object'&&!Array.isArray(combat)){
      row.combatState={edge:clamp(Number(combat.edge)||0,-2,3),pressure:clamp(Number(combat.pressure)||0,0,3),
        kind:G.presentationText(combat.kind),terrain:G.presentationText(combat.terrain),
        history:(Array.isArray(combat.history)?combat.history:[]).slice(-20).map(item=>({
          tactic:G.presentationText(item?.tactic),label:G.presentationText(item?.label),response:G.presentationText(item?.response)}))};
    }
  }
  return row;
};
G.beginPresentation = event=>{
  if(!S||event.openingStep||event.campConversation||!G.presentationEvent(event.id)) return null;
  // A restored stopped scene has no live approach timer to clear this marker.
  if(S.driving) delete S.driving.approach;
  const saved=S.pendingPresentation;
  if(saved&&saved.eventId===event.id&&saved.phase!=='transition') return saved;
  S.pendingPresentation={version:1,eventId:event.id,phase:'event',
    text:G.presentationText(typeof event.text==='function'?event.text(S):event.text)};
  G.save();
  return S.pendingPresentation;
};
G.restorePresentationView = state=>{
  const row=S.pendingPresentation;
  if(row&&row.eventId===state.eventId&&row.phase===(state.phase==='outcome'?'result':'event')&&row.view)
    Object.assign(state,G.presentationCopy(row.view));
};
G.capturePresentationView = state=>{
  const row=S&&S.pendingPresentation;
  if(!row||row.eventId!==state.eventId||row.phase!==(state.phase==='outcome'?'result':'event')) return;
  row.view=G.presentationView(state); G.save();
};
G.resolvePresentedChoice = (event,choice)=>{
  if(!S||S.ended) return {ok:false};
  const ci=event.choices.indexOf(choice), saved=S.pendingPresentation;
  if(ci<0) return {ok:false};
  if(saved?.eventId===event.id&&saved.phase==='result'){
    if(saved.choiceIndex!==ci) return {ok:false,why:'이미 다른 선택의 결과가 저장됐다'};
    const authored=choice.out[saved.outcomeIndex];
    return {ok:true,applied:false,out:{...authored,text:saved.text},chips:saved.chips,
      combatState:saved.combatState};
  }
  const req=G.reqOk(G.choiceReq(choice));
  const ownedReceipt=event.openingStep&&S.opening?.pendingResult||event.campConversation&&G.currentCampConversation()?.choiceId;
  if(!ownedReceipt&&(!G.reqVisible(G.choiceReq(choice))||!req.ok)) return {ok:false,why:req.t};
  // applyFx and its nested owners save themselves. Commit their changes together
  // with the result receipt only after every effect and callback has finished.
  G.presentationApplying=true;
  try{
    const own=event.campConversation?G.resolveCampChoice(event.id,choice.id)
      :event.openingStep?G.resolveOpeningChoice(event.id,choice.id):null;
    if(own&&!own.ok) return own;
    if(!own||own.applied){
      const visible=event.choices.filter(c=>G.reqVisible(G.choiceReq(c))).length;
      const available=event.choices.filter(c=>G.reqVisible(G.choiceReq(c))&&G.reqOk(G.choiceReq(c)).ok).length;
      G.qualityChoice(event,choice,ci,visible,available);
    }
    const before=S.combat?G.presentationCopy(S.combat):null;
    const out=own?own.out:G.pickOutcome(event,choice);
    // An explicitly chosen method replaces conflicting flags in a partial save.
    if(event.id==='seoul_decision')
      for(const key of ['core_transfer','core_sleep','core_quarantine']) delete S.flags[key];
    const meta=out.combatMeta||null;
    let entry=!own&&out.fx?.combatEnd?G.rememberCombatChoice(event,choice,meta):null;
    const chips=own?[...(own.chips||[])]:G.applyFx(out.fx,{noteTitle:event.title});
    if(!own&&event.needsComp) G.checkLevel(event.needsComp,{story:true});
    if(!own&&!entry) entry=G.rememberCombatChoice(event,choice,meta);
    if(!own) chips.push(...G.afterChoice(event,choice,out));
    let combatState=S.combat?G.presentationCopy(S.combat):before;
    if(before&&!S.combat){
      combatState.edge=clamp((before.edge||0)+(out.fx?.combatEdge||0),-2,3);
      combatState.history=[...(before.history||[]),...(entry?[entry]:[])];
    }
    const text=G.presentationText(typeof out.text==='function'?out.text(S):out.text);
    if(!own&&!S.ended){
      S.pendingPresentation=G.validatePresentation({version:1,phase:'result',eventId:event.id,
        choiceIndex:ci,outcomeIndex:out.presentationOutcomeIndex??choice.out.indexOf(out),text,chips,combatState});
    }
    return {ok:true,applied:!own||own.applied,out:{...out,text},chips,combatState};
  }finally{ G.presentationApplying=false; G.save(); }
};
G.queuePresentation = id=>{
  const row=G.validatePresentation(S.pendingPresentation);
  const outcome=row?.phase==='result'?G.presentationEvent(row.eventId).choices[row.choiceIndex].out[row.outcomeIndex]:null;
  const next=G.resolveMainEvidenceChain(outcome?.fx?.chain||id);
  S._chain=null;
  S.pendingPresentation=next&&G.presentationEvent(next)?{version:1,phase:'transition',eventId:next}:null;
  G.save(); return next;
};
G.presentTransition = ()=>{
  const row=S&&S.pendingPresentation;
  if(!row||row.phase!=='transition'||S.ended) return false;
  const next=G.resolveMainEvidenceChain(row.eventId);
  if(!next){ S.pendingPresentation=null; G.save(); return false; }
  const event=G.presentationEvent(next);
  if(!event){ S.pendingPresentation=null; G.save(); return false; }
  // Count a new chained event once, before presentation. Resumed event/result
  // phases bypass this path; an unconsumed transition has not been opened yet.
  G.openEvent(event); return true;
};
G.resolvedFinaleMethod = ()=>{
  const methods=['core_transfer','core_sleep','core_quarantine'].filter(key=>S?.flags[key]);
  return methods.length===1?methods[0]:null;
};
G.unfinishedSeoulEvent = ()=>{
  if(!S||S.ended||S.at!=='seoul'||S.driving||S.flags.story_done) return null;
  const f=S.flags;
  if(!f.seoul_open) return G.seoulReady()?D.seoulOpenEvent:null;
  if(D.seoulMap.stops.slice(0,4).some(stop=>!f[`seoul_${stop.id}_done`])) return null;
  if(!f.seoul_core_reached) return null; // the map owns choosing each climb stop
  const id=!f.seoul_costs_seen?'seoul_costs':!G.resolvedFinaleMethod()?'seoul_decision':
    !f.seoul_local_saved?'seoul_night':!f.uplink_scale_seen?'seoul_uplink_reveal':'seoul_session_reset';
  return G.presentationEvent(id);
};
G.resumePresentation = ()=>{
  if(!S||S.ended) return false;
  if(S.flags.story_done){ G.endGame('story_done'); return true; }
  const row=S.pendingPresentation=G.validatePresentation(S.pendingPresentation);
  if(row){
    if(row.phase==='transition') return G.presentTransition();
    // Completed results may be shown away from their original site, but an
    // unanswered geographical encounter cannot move with a corrupt old save.
    if(row.phase==='event'&&!G.mainEvidenceLocationReady(row.eventId)){
      S.pendingPresentation=null; G.save();
    }else{ UI.showEvent(G.presentationEvent(row.eventId)); return true; }
  }
  if(S._chain){ G.queuePresentation(S._chain); if(G.presentTransition()) return true; }
  const seoul=G.unfinishedSeoulEvent();
  if(seoul){ UI.showEvent(seoul); return true; }
  return false;
};
/* Same return corridor as the authored locked gate; no final choice is invented. */
G.prepareFinale = ()=>{
  if(S?.at!=='seoul'||S.pendingPresentation?.eventId!=='seoul_decision'||
    S.pendingPresentation.phase!=='event'||G.resolvedFinaleMethod()) return false;
  S.pendingPresentation=null; S._chain=null;
  G.applyFx({goto:'suwon',time:60,note:{type:'사건',title:'결정 전에 돌아간 길',
    body:'집행 방식을 고르기 전에 수원으로 내려왔다. 거점 응답과 열쇠 보유자, 동료의 부상과 사기를 다시 준비한다.',links:['남산','수원']}});
  return true;
};
