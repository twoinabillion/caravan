/* ═══ QUEST LEDGER — 본편·동료·지역 의뢰를 같은 상태 모델로 묶는다 ═══ */
G.ensureQuestLedger = ()=>{
  if(!S) return null;
  if(!S.questLedger||typeof S.questLedger!=='object') S.questLedger={};
  const ledger=S.questLedger;
  if(!Array.isArray(ledger.tracked)) ledger.tracked=[];
  if(!Array.isArray(ledger.completed)) ledger.completed=[];
  if(!Array.isArray(ledger.updates)) ledger.updates=[];
  if(!ledger.snapshot||typeof ledger.snapshot!=='object') ledger.snapshot={};
  ledger.tracked=[...new Set(ledger.tracked.filter(id=>typeof id==='string'))].slice(0,2);
  return ledger;
};

G.mainQuestEntry = ()=>{
  if(!S) return null;
  const departure=typeof G.departureSteps==='function'?(G.departureSteps()||[]):[];
  const nextDeparture=departure.find(step=>!step.done);
  const endingDone=!!(S.flags&&(S.flags.core_transfer||S.flags.core_sleep||S.flags.core_quarantine||S.flags.run_archived));
  let phase='남산으로 갈 증거를 모은다';
  let next=nextDeparture&&nextDeparture.label;
  let have=departure.filter(step=>step.done).length;
  let need=Math.max(1,departure.length);
  let status='active';

  if(endingDone){
    phase='인간 확인 절차에 결론을 내렸다';
    next='이번 여정의 선택과 남은 흔적을 확인한다.';
    have=need=1;
    status='completed';
  }else if(S.at==='seoul'&&typeof G.seoulStage==='function'){
    const stage=G.seoulStage();
    phase='서울 안쪽에서 남산 코어로 오른다';
    next=stage>=5?'남산 코어에서 마지막 결정을 내린다.':`서울 진입 단계 ${stage+1}을 진행한다.`;
    have=Math.min(stage,5); need=5;
  }else if(!next){
    try{
      const missing=G.seoulMissing();
      const pillars=G.pillars();
      have=Object.values(pillars).reduce((sum,row)=>sum+Math.min(row.have,row.need),0);
      need=Object.values(pillars).reduce((sum,row)=>sum+row.need,0);
      if(missing&&missing.hint){
        phase=`남산 진입 준비 · ${missing.pillar}`;
        next=missing.hint;
      }else{
        phase='남산 진입 준비가 끝났다';
        next='서울 진입로를 따라 남산 코어로 간다.';
      }
    }catch(e){ next='북쪽으로 이동하며 현재 명령의 근거를 찾는다.'; }
  }

  return {
    id:'main_namsan', kind:'main', status, tracked:true,
    eyebrow:'주 임무',
    title:'남산 코어로 가서 강제 이송 명령을 멈춘다', phase,
    why:'엄마와 아빠를 갈라놓은 명령은 아직 끝나지 않았다. 지금도 다른 가족에게 같은 이송표가 나오고 있다.',
    next:next||'첫 구간에서 이송 명령의 발신 기록을 찾는다.',
    expected:'세 가지 근거로 자동 명령을 멈추고, 사람이 직접 확인해야만 이송할 수 있도록 바꾼다.',
    progress:{have,need,label:`${Math.min(have,need)}/${need}`},
  };
};

G.companionQuestEntries = ()=>{
  if(!S) return [];
  const ledger=G.ensureQuestLedger();
  const ids=new Set(Array.isArray(S.party)?S.party:[]);
  if(S.recruitQ&&S.recruitQ.id) ids.add(S.recruitQ.id);
  return [...ids].map(id=>{
    const comp=D.comps&&D.comps[id];
    if(!comp) return null;
    const state=S.comps&&S.comps[id]||{};
    const recruiting=S.recruitQ&&S.recruitQ.id===id&&!S.party.includes(id);
    const level=Number(state.lvl)||0;
    const completed=!recruiting&&level>=3;
    const deed=(D.deeds||[]).find(row=>row.comp===id);
    let next;
    if(completed) next='개인 서사가 완결됐다. 남산에서 이 선택이 다시 돌아온다.';
    else if(recruiting){
      const target=S.recruitQ.target&&D.nodes[S.recruitQ.target];
      next=target?`${target.name}에서 합류 조건을 이어 간다.`:'이 사람이 요구한 합류 조건을 해결한다.';
    }else next=deed&&deed.hint?deed.hint:'야영이나 정착지에서 대화를 이어 간다.';
    return {
      id:`companion_${id}`, kind:'companion', status:completed?'completed':'active',
      tracked:ledger.tracked.includes(`companion_${id}`), companion:id,
      eyebrow:recruiting?'동행 제안':'동료 이야기',
      title:recruiting?`${comp.name}와 함께할 이유`:comp.name,
      phase:recruiting?'합류 조건 진행 중':`개인 서사 Lv.${Math.min(level,3)}/3 · 유대 ${Number(state.bond)||0}`,
      next, expected:completed?'남산의 최종 선택에 이 동료의 목소리가 더해진다.':'관계를 쌓으면 새로운 대화와 남산의 선택지가 열린다.',
      progress:{have:recruiting?0:Math.min(level,3),need:3,label:recruiting?'합류 전':`${Math.min(level,3)}/3`},
    };
  }).filter(Boolean);
};

G.localQuestEntries = ()=>{
  if(!S||!S.quest) return [];
  const q=S.quest, ledger=G.ensureQuestLedger();
  if(!q.ledgerId) q.ledgerId=`local_${q.kind}_${q.from}_${q.to}_${q.due}`;
  const from=D.nodes[q.from]&&D.nodes[q.from].name||'출발지';
  const to=D.nodes[q.to]&&D.nodes[q.to].name||'목적지';
  const label=typeof G.questLabel==='function'?G.questLabel(q):(q.item||'지역 의뢰');
  let have=0, need=1, next=`${to}로 이동해 의뢰를 마친다.`;
  if(q.kind==='procure'){
    have=Math.min((S.items&&S.items[q.need.name])||0,q.need.qty); need=q.need.qty;
    next=have>=need?`${from}의 의뢰인에게 물건을 건넨다.`:`${q.need.name} ${need-have}개를 더 구한 뒤 ${from}으로 돌아간다.`;
  }else if(S.at===q.to) next='도착지의 의뢰인에게 말을 걸어 전달을 마친다.';
  if(S.day>q.due) next=`기한은 지났지만 ${to}에서 전달을 마칠 수 있다.`;
  return [{
    id:q.ledgerId, kind:'local', status:'active', tracked:ledger.tracked.includes(q.ledgerId),
    eyebrow:`지역 의뢰 · ${from}`, title:label,
    phase:`목적지 ${to} · 권장 ${q.due}일차까지`, next,
    expected:`완료 보상 · 고철 ${q.reward}`,
    progress:{have,need,label:q.kind==='procure'?`${have}/${need}`:(S.at===q.to?'도착':'이동 중')},
  }];
};

G.completedQuestEntries = ()=>{
  const ledger=G.ensureQuestLedger();
  if(!ledger) return [];
  return ledger.completed.slice().reverse().map(row=>({...row,kind:'completed',status:'completed',tracked:false}));
};

G.questLedgerEntries = ()=>{
  if(!S) return [];
  return [G.mainQuestEntry(),...G.companionQuestEntries(),...G.localQuestEntries(),...G.completedQuestEntries()].filter(Boolean);
};

G.toggleQuestTracking = (id)=>{
  const ledger=G.ensureQuestLedger();
  if(!ledger||id==='main_namsan') return {ok:false,why:'주 임무는 항상 표시된다.'};
  const entry=G.questLedgerEntries().find(row=>row.id===id&&row.status!=='completed');
  if(!entry) return {ok:false,why:'이 임무는 추적할 수 없다.'};
  const index=ledger.tracked.indexOf(id);
  if(index>=0) ledger.tracked.splice(index,1);
  else {
    if(ledger.tracked.length>=2) return {ok:false,why:'선택 임무는 두 개까지만 추적할 수 있다.'};
    ledger.tracked.push(id);
  }
  if(typeof G.save==='function') G.save();
  return {ok:true,tracked:index<0};
};

G.questLedgerSync = ()=>{
  const ledger=G.ensureQuestLedger();
  if(!ledger) return;
  const active=G.questLedgerEntries().filter(row=>row.kind!=='completed');
  const current={};
  for(const row of active) current[row.id]=`${row.status}|${row.phase}|${row.next}|${row.progress&&row.progress.label}`;
  if(!Object.keys(ledger.snapshot).length){ ledger.snapshot=current; return; }
  for(const row of active){
    if(ledger.snapshot[row.id]&&ledger.snapshot[row.id]!==current[row.id]){
      ledger.updates.push({id:row.id,title:row.title,next:row.next,day:S.day,at:S.at});
    }else if(!ledger.snapshot[row.id]){
      ledger.updates.push({id:row.id,title:`새 임무 · ${row.title}`,next:row.next,day:S.day,at:S.at});
    }
  }
  ledger.updates=ledger.updates.slice(-8);
  ledger.snapshot=current;
  try{ window.dispatchEvent(new CustomEvent('questledgerchange')); }catch(e){}
};

G.questLedgerUpdates = ()=>{
  const ledger=G.ensureQuestLedger();
  return ledger?ledger.updates:[];
};
G.clearQuestLedgerUpdates = ()=>{
  const ledger=G.ensureQuestLedger();
  if(ledger) ledger.updates=[];
};

if(typeof G.acceptQuest==='function'){
  const acceptQuestBase=G.acceptQuest;
  G.acceptQuest=(q)=>{
    if(q&&!q.ledgerId) q.ledgerId=`local_${q.kind}_${q.from}_${q.to}_${q.due}`;
    return acceptQuestBase(q);
  };
}
if(typeof G.checkQuest==='function'){
  const checkQuestBase=G.checkQuest;
  G.checkQuest=()=>{
    const q=S&&S.quest?{...S.quest,need:S.quest.need?{...S.quest.need}:null}:null;
    const result=checkQuestBase();
    if(result&&q){
      const ledger=G.ensureQuestLedger();
      const label=typeof G.questLabel==='function'?G.questLabel(q):(q.item||'지역 의뢰');
      ledger.completed.push({
        id:`completed_${q.ledgerId||Date.now()}`, eyebrow:'완료 기록', title:label,
        phase:`${D.nodes[q.from].name} → ${D.nodes[q.to].name} · ${S.day}일차`,
        next:'완료한 지역 의뢰다.', expected:`고철 ${q.reward}을 받았다.`,
        progress:{have:1,need:1,label:'완료'}
      });
      ledger.completed=ledger.completed.slice(-40);
      G.questLedgerSync();
      G.save();
    }
    return result;
  };
}
if(typeof G.save==='function'){
  const saveWithQuestLedger=G.save;
  G.save=(...args)=>{
    if(S){ G.ensureQuestLedger(); G.questLedgerSync(); }
    return saveWithQuestLedger(...args);
  };
}
