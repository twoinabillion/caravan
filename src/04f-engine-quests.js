/* ═══ QUEST LEDGER — 본편·동료·지역 의뢰를 같은 상태 모델로 묶는다 ═══ */
G.ensureQuestLedger = ()=>{
  if(!S) return null;
  if(!S.questLedger||typeof S.questLedger!=='object') S.questLedger={};
  const ledger=S.questLedger;
  if(!Array.isArray(ledger.tracked)) ledger.tracked=[];
  if(!Array.isArray(ledger.completed)) ledger.completed=[];
  if(!Array.isArray(ledger.updates)) ledger.updates=[];
  if(!Array.isArray(ledger.mainHistory)) ledger.mainHistory=[];
  if(!Number.isInteger(ledger.seenUpdateCount)) ledger.seenUpdateCount=0;
  ledger.seenUpdateCount=Math.max(0,Math.min(ledger.seenUpdateCount,ledger.updates.length));
  if(!ledger.snapshot||typeof ledger.snapshot!=='object') ledger.snapshot={};
  ledger.tracked=[...new Set(ledger.tracked.filter(id=>typeof id==='string'))].slice(0,2);
  return ledger;
};

G.questGraphDistance = (from,to)=>{
  if(!from||!to) return Infinity;
  if(from===to) return 0;
  const dist={[from]:0}, pending=[from];
  while(pending.length){
    pending.sort((a,b)=>dist[a]-dist[b]);
    const here=pending.shift();
    if(here===to) return dist[here];
    for(const nb of G.neighbors(here)){
      const next=dist[here]+nb.km;
      if(next<(dist[nb.id]??Infinity)){ dist[nb.id]=next; pending.push(nb.id); }
    }
  }
  return Infinity;
};
G.questNavigationPlan = ()=>{
  if(!S) return null;
  const ledger=G.ensureQuestLedger(), q=S.quest;
  if(q&&ledger.tracked.includes(q.ledgerId)){
    const have=q.kind==='procure'&&q.need?Number(S.items&&S.items[q.need.name])||0:0;
    const target=q.kind==='procure'&&have>=q.need.qty?q.from:q.to;
    return {key:q.ledgerId,kind:'local',target,title:typeof G.questLabel==='function'?G.questLabel(q):(q.item||'지역 의뢰'),
      action:target===S.at?'이곳에서 의뢰인을 찾아 일을 마친다':`${D.nodes[target].name}까지 이동한다`};
  }
  const rq=S.recruitQ;
  if(rq&&rq.target&&ledger.tracked.includes(`companion_${rq.id}`))
    return {key:`companion_${rq.id}`,kind:'companion',target:rq.target,title:`${D.comps[rq.id].name}의 부탁`,action:`${D.nodes[rq.target].name}에서 다음 과제를 진행한다`};
  const main=G.mainQuestEntry();
  return {key:`main_${main&&main.chapterId||'namsan'}`,kind:'main',target:'seoul',title:main&&main.title||'남산으로 간다',action:main&&main.next||'북쪽 길을 따라간다'};
};
G.questPreferredNeighbor = routeModels=>{
  const plan=G.questNavigationPlan();
  if(!plan||!Array.isArray(routeModels)||!routeModels.length) return null;
  return [...routeModels].sort((a,b)=>(a.nb.km+G.questGraphDistance(a.nb.id,plan.target))-(b.nb.km+G.questGraphDistance(b.nb.id,plan.target)))[0]||null;
};
G.routeQuestCue = nodeId=>{
  const plan=G.questNavigationPlan();
  if(!plan||!S||!S.at) return null;
  const options=G.neighbors(S.at).filter(nb=>S.known.includes(nb.id)).map(nb=>({nb}));
  const preferred=G.questPreferredNeighbor(options);
  return preferred&&preferred.nb.id===nodeId?plan:null;
};

G.mainQuestEntry = ()=>{
  if(!S) return null;
  const departure=typeof G.departureSteps==='function'?(G.departureSteps()||[]):[];
  const nextDeparture=departure.find(step=>!step.done&&step.id!=='seoul');
  const endingDone=!!(S.flags&&(S.flags.core_transfer||S.flags.core_sleep||S.flags.core_quarantine||S.flags.run_archived));
  const base={id:'main_namsan',kind:'main',status:'active',tracked:true,
    recovery:'길을 놓쳤다면 지도에서 주 임무 표식이 붙은 북쪽 목적지를 고른다. 정착지에서는 사람들과 이야기하고 라디오와 임무 장부를 확인한다.'};
  const stepCopy={
    family:{act:'서장',chapterId:'prologue-family',title:'도윤 가족의 이송표를 확인한다',phase:'부산 감천 부두 · 떠나기 전',why:'부산에서 반복되던 이송표가 지금도 실제 가족을 갈라놓고 있다. 남산으로 갈 이유를 먼저 눈으로 확인해야 한다.',next:'고장 난 버스를 고치고 도윤 가족에게 왜 같은 표가 나왔는지 묻는다.',expected:'과거의 가족사와 지금 벌어지는 강제 이송이 같은 명령에서 시작됐다는 사실을 확인한다.'},
    appeal:{act:'서장',chapterId:'prologue-appeal',title:'부산에서 이송 명령에 이의를 제기한다',phase:'부산 원격 민원 창구',why:'이송을 멈출 수 있는 정상 절차가 남아 있다면 남산까지 갈 필요가 없다. 먼저 부산에서 할 수 있는 일을 모두 해 본다.',next:'이송표와 검증 모듈을 들고 원격 확인 절차를 요청한다.',expected:'부산에서 해결할 수 있는지, 남산 현장 확인이 꼭 필요한지 분명해진다.'},
    module:{act:'서장',chapterId:'prologue-module',title:'엄마가 남긴 검증 모듈을 확인한다',phase:'부산의 달구지 안',why:'엄마가 남긴 장치가 단순한 유품인지, 지금도 명령을 멈출 수 있는 열쇠인지 확인해야 한다.',next:'엄마의 회로도와 계기판 안쪽 배선을 맞춰 본다.',expected:'남산에서 사람이 직접 확인하는 절차를 되살릴 가능성을 찾는다.'},
    trace:{act:'1장',chapterId:'first-trace',title:'이송 명령의 첫 발신 기록을 찾는다',phase:'부산을 떠난 첫 구간',why:'이송표만 들고 가면 개인 민원으로 처리된다. 누가 언제 명령을 만들었는지 보여 주는 기록이 필요하다.',next:'첫 구간을 달리며 대상 선정 규칙과 발신 번호가 남은 기록을 찾는다.',expected:'부모님의 이송표와 지금 나오는 표가 같은 명령망에서 왔다는 사실을 입증한다.'},
    key:{act:'2장',chapterId:'verification-key',title:'검증키를 안전하게 꺼낼 절차를 찾는다',phase:'엄마의 장치를 남산까지 가져가기 위한 준비',why:'절차 없이 장치를 뽑으면 검증키도 달구지도 망가진다. 남산에 도착하기 전에 빠진 복원 순서를 찾아야 한다.',next:'북쪽 정착지의 정비소와 전파사를 살피며 분리 절차 4·5쪽을 복원한다. 지도에서는 주 임무 표식이 붙은 길을 고른다.',expected:'엄마의 검증키를 망가뜨리지 않고 남산 코어에 연결할 수 있게 된다.'},
    witness:{act:'3장',chapterId:'witnesses',title:'이송 당사자들의 증언을 모은다',phase:'발신 기록과 사람들의 기억을 맞추는 중',why:'기계가 남긴 로그만으로는 또 오류로 처리될 수 있다. 같은 표를 받은 사람들이 실제로 무엇을 겪었는지 함께 남겨야 한다.',next:'같은 이송표를 받은 사람들을 만나 이야기를 듣고 발신 기록과 대조한다.',expected:'한 가족의 민원이 아니라 여러 지역에서 반복된 강제 이송이었다는 사실을 증명한다.'}
  };
  const departureDone=departure.filter(step=>step.id!=='seoul'&&step.done);
  const departureNeed=Math.max(1,departure.filter(step=>step.id!=='seoul').length);
  const departureTrail=departure.filter(step=>step.id!=='seoul').map(step=>({id:step.id,label:step.label,detail:step.detail,state:step.done?'done':step.id===nextDeparture?.id?'current':'upcoming'}));

  if(endingDone) return {...base,status:'completed',act:'종장',chapterId:'ending',eyebrow:'주 임무 · 종장',title:'강제 이송 명령에 마지막 결론을 내렸다',phase:'남산 코어 · 여정 기록',why:'부산에서 시작한 질문에 답했고, 그 답이 앞으로 누구에게 남을지도 결정했다.',next:'이번 여정에서 내린 선택과 함께한 사람들의 기록을 확인한다.',expected:'끝난 명령과 아직 남아 있는 상위 명령망의 흔적을 확인한다.',recovery:'완료한 본편 기록은 임무 장부의 완료 탭에서 다시 볼 수 있다.',steps:[{id:'ending',label:'남산 코어에서 최종 결정을 내렸다',state:'done'}],progress:{have:1,need:1,label:'완료'}};

  if(S.at==='seoul'&&typeof G.seoulStage==='function'){
    const stage=G.seoulStage();
    const stops=D.seoulMap&&Array.isArray(D.seoulMap.stops)?D.seoulMap.stops:[];
    const stop=stops[stage], stopName=stop&&(stop.name||stop.label)||`남산 진입 지점 ${stage+1}`;
    const finished=stage>=stops.length;
    return {...base,act:'6장',chapterId:`seoul-${stage}`,eyebrow:'주 임무 · 6장',title:finished?'남산 코어에서 마지막 결정을 내린다':`${stopName}을 지나 남산 코어로 오른다`,phase:'서울 안쪽 · 남산 진입로',why:'모아 온 기록과 검증키를 실제 명령망에 연결하려면 남산 코어까지 직접 들어가야 한다.',next:finished?'남산 코어에 검증키와 증언 기록을 연결하고 마지막 선택을 한다.':`${stopName}에서 막힌 길을 열고 다음 진입 지점으로 간다.`,expected:'사람의 확인 없이 내려가는 강제 이송 명령을 코어에서 끊는다.',recovery:'서울 지도를 열면 현재 진입 지점과 다음 길을 다시 확인할 수 있다.',steps:stops.map((row,index)=>({id:row.id||String(index),label:row.name||row.label||`진입 지점 ${index+1}`,state:index<stage?'done':index===stage?'current':'upcoming'})),progress:{have:Math.min(stage,stops.length),need:Math.max(1,stops.length),label:`${Math.min(stage,stops.length)}/${Math.max(1,stops.length)}`}};
  }

  if(nextDeparture){
    const copy=stepCopy[nextDeparture.id]||stepCopy.trace;
    return {...base,...copy,eyebrow:`주 임무 · ${copy.act}`,steps:departureTrail,progress:{have:departureDone.length,need:departureNeed,label:`${departureDone.length}/${departureNeed}`}};
  }

  try{
    const pillars=G.pillars();
    const have=Object.values(pillars).reduce((sum,row)=>sum+Math.min(row.have,row.need),0);
    const need=Object.values(pillars).reduce((sum,row)=>sum+row.need,0);
    const ready=typeof G.seoulReady==='function'&&G.seoulReady();
    const pillarSteps=Object.entries(pillars).map(([name,row])=>({id:name,label:{관계:'당사자 증언',세계:'저항망',진실:'명령의 진실',유산:'남겨진 기록'}[name]||name,state:row.have>=row.need?'done':'upcoming',detail:`${Math.min(row.have,row.need)}/${row.need}`}));
    if(ready) return {...base,act:'5장',chapterId:'road-to-seoul',eyebrow:'주 임무 · 5장',title:'서울로 들어가 남산 코어까지 간다',phase:'남산 진입 준비 완료',why:'발신 기록, 검증키, 당사자 증언과 저항망이 모두 모였다. 이제 코어에서 명령을 바꿀 수 있다.',next:'북쪽 길을 따라 서울로 이동하고 남산 진입로를 찾는다.',expected:'모아 온 근거를 남산 코어에 연결해 사람이 직접 확인하는 절차를 되살린다.',recovery:'지도에서 서울로 이어지는 길을 확인한다. 날짜 제한은 없다.',steps:pillarSteps,progress:{have,need,label:`${have}/${need}`}};
    const missing=G.seoulMissing();
    const pillarCopy={
      관계:{act:'4장-A',title:'같은 이송을 겪은 사람들의 증언을 모은다',phase:'사람들의 기록을 발신 로그와 맞추는 중',why:'표와 로그만으로는 또 기계 오류로 묻힐 수 있다. 명령을 겪은 사람들이 직접 남긴 기록이 필요하다.',expected:'강제 이송이 여러 사람에게 반복됐다는 사실을 남산에서 증명한다.'},
      세계:{act:'4장-B',title:'저항망과 접선해 남산으로 가는 길을 연다',phase:'흩어진 저항 거점을 잇는 중',why:'남산 코어까지 혼자 들어갈 수는 없다. 길과 통신을 지켜 온 사람들의 도움이 필요하다.',expected:'서울까지 이어지는 안전한 길과 코어에 접근할 통신망을 확보한다.'},
      진실:{act:'4장-C',title:'이송 명령이 만들어진 경위를 밝힌다',phase:'명령망에 남은 기록을 추적하는 중',why:'누가 어떤 판단으로 이송을 자동화했는지 밝혀야 같은 명령이 다시 시작되는 것을 막을 수 있다.',expected:'강제 이송을 만든 명령과 남산 위의 상위 명령망을 구분한다.'},
      유산:{act:'4장-D',title:'부모님과 길 위 사람들이 남긴 기록을 챙긴다',phase:'남산에서 열 마지막 기록을 모으는 중',why:'남산에 도착해도 당사자의 기록이 없으면 시스템은 사람을 다시 숫자로만 처리한다.',expected:'편지와 물건에 남은 사람들의 선택을 최종 판단의 근거로 가져간다.'},
      여정:{act:'4장',title:'남산에서 쓸 마지막 근거를 보완한다',phase:'빠진 기록을 확인하는 중',why:'코어에 들어가기 전에 아직 비어 있는 근거를 채워야 한다.',expected:'남산 진입 조건을 모두 갖춘다.'}
    };
    const copy=pillarCopy[missing.pillar]||pillarCopy.여정;
    const steps=pillarSteps.map(step=>({...step,state:step.state==='done'?'done':step.id===missing.pillar?'current':'upcoming'}));
    return {...base,...copy,act:copy.act||'4장',chapterId:`prepare-${missing.pillar}`,eyebrow:`주 임무 · ${copy.act||'4장'}`,next:missing.hint||'가까운 정착지에서 사람들과 이야기하고 빠진 기록을 찾는다.',recovery:'가까운 정착지의 사람들, 라디오 방송, 야영 대화에서 다음 단서를 찾을 수 있다. 날짜 제한은 없다.',steps,progress:{have,need,label:`${have}/${need}`}};
  }catch(e){
    return {...base,act:'1장',chapterId:'first-trace-fallback',eyebrow:'주 임무 · 1장',title:'첫 발신 기록을 찾는다',phase:'부산을 떠난 첫 구간',why:'남산에서 명령을 멈추려면 발신 기록이 필요하다.',next:'북쪽으로 이동하며 이송표와 같은 발신 번호를 찾는다.',expected:'현재 명령이 어디서 시작됐는지 확인한다.',steps:departureTrail,progress:{have:departureDone.length,need:departureNeed,label:`${departureDone.length}/${departureNeed}`}};
  }
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
    const storyStage=typeof G.companionStoryStage==='function'?G.companionStoryStage(id):Math.min(level,3);
    const completed=!recruiting&&level>=3&&storyStage>=3;
    const deed=(D.deeds||[]).find(row=>row.comp===id);
    const milestones=D.companionMilestones&&D.companionMilestones[id]||['서로의 생활 방식을 익힌다','과거와 선택을 더 깊이 듣는다','남산까지 가져갈 이야기를 완성한다'];
    const pending=Number(state.pending)||0;
    const targetBond=!completed&&!pending&&D.bondTh?Number(D.bondTh[Math.min(level,2)])||0:0;
    const remaining=Math.max(0,targetBond-(Number(state.bond)||0));
    let next;
    if(completed) next='개인 서사가 완결됐다. 남산에서 이 선택이 다시 돌아온다.';
    else if(recruiting){
      const target=S.recruitQ.target&&D.nodes[S.recruitQ.target];
      next=target?`${target.name}에서 합류 조건을 이어 간다.`:'이 사람이 요구한 합류 조건을 해결한다.';
    }else if(pending) next=`동료 카드에서 Lv.${pending} 퍼크를 고르고, 지금까지 함께한 방식에 이름을 붙인다.`;
    else if(remaining>0) next=`야영 대화, 길 위 선택, 정착지의 일을 함께 겪으며 유대를 ${remaining} 더 쌓는다.`;
    else if(storyStage<3) next=`유대는 충분하다. 정차 중 ${comp.name}에게 말을 걸어 아직 듣지 못한 개인 이야기를 이어 간다.`;
    else next=deed&&deed.hint?deed.hint:'야영이나 정착지에서 대화를 이어 간다.';
    return {
      id:`companion_${id}`, kind:'companion', status:completed?'completed':'active',
      tracked:ledger.tracked.includes(`companion_${id}`), companion:id,
      eyebrow:recruiting?'동행 제안':'동료 이야기',
      title:recruiting?`${comp.name}와 함께할 이유`:comp.name,
      phase:recruiting?'합류 조건 진행 중':pending?`새 퍼크 선택 가능 · 유대 ${Number(state.bond)||0}`:`개인 이야기 ${storyStage}/3 · 동료 Lv.${Math.min(level,3)} · 유대 ${Number(state.bond)||0}`,
      why:recruiting?'같은 길을 갈 수 있는 사람인지 서로 확인하는 중이다.':`${comp.name}가 왜 이 길에 올랐는지 끝까지 들으면, 남산에서 내릴 선택도 달라질 수 있다.`,
      next, expected:completed?'남산의 최종 선택에 이 동료의 목소리가 더해진다.':'새 대화와 퍼크가 열리고, 마지막 판단에 이 동료의 증언이 더해진다.',
      steps:milestones.slice(0,3).map((label,index)=>({id:`${id}_${index+1}`,label,state:index<storyStage?'done':index===storyStage?'current':'upcoming'})),
      progress:{have:recruiting?0:storyStage,need:3,label:recruiting?'합류 전':`${storyStage}/3`},
    };
  }).filter(Boolean);
};

G.localQuestEntries = ()=>{
  if(!S) return [];
  const ledger=G.ensureQuestLedger(), rows=[];
  if(S.quest){
    const q=S.quest;
    if(!q.ledgerId) q.ledgerId=`local_${q.kind}_${q.from}_${q.to}_${q.due}`;
    const from=D.nodes[q.from]&&D.nodes[q.from].name||'출발지';
    const to=D.nodes[q.to]&&D.nodes[q.to].name||'목적지';
    const label=typeof G.questLabel==='function'?G.questLabel(q):(q.item||'지역 의뢰');
    let have=S.at===q.to?1:0, need=1, next=`${to}로 이동해 의뢰를 마친다.`;
    if(q.kind==='procure'){
      have=Math.min((S.items&&S.items[q.need.name])||0,q.need.qty); need=q.need.qty;
      next=have>=need?`${from}의 의뢰인에게 물건을 건넨다.`:`${q.need.name} ${need-have}개를 더 구한 뒤 ${from}으로 돌아간다.`;
    }else if(S.at===q.to) next='정착지 게시판에서 물건과 기록을 건네고 이 단계를 마친다.';
    if(!q.noExpiry&&S.day>q.due) next=`기한은 지났지만 ${to}에서 전달을 마칠 수 있다.`;
    if(q.story){ have=Math.max(q.story.stage-1,have?q.story.stage:0); need=q.story.total; }
    rows.push({
      id:q.ledgerId, kind:'local', status:'active', tracked:ledger.tracked.includes(q.ledgerId),
      eyebrow:q.story?`연속 의뢰 · ${q.story.stage}/${q.story.total}`:`지역 의뢰 · ${from}`, title:label,
      phase:`목적지 ${to} · ${q.noExpiry?'기한 없음':`권장 ${q.due}일차까지`}`, next,
      expected:q.story?`이번 단계 보상 · 고철 ${q.reward} · 다음 이야기 연결`:`완료 보상 · 고철 ${q.reward}`,
      progress:{have,need,label:q.story?`${q.story.stage}/${q.story.total}`:q.kind==='procure'?`${have}/${need}`:(S.at===q.to?'도착':'이동 중')},
    });
  }else if(S.questFollowup){
    const q=S.questFollowup, from=D.nodes[q.from]&&D.nodes[q.from].name||'현재 정착지';
    rows.push({
      id:q.ledgerId,kind:'local',status:'available',tracked:ledger.tracked.includes(q.ledgerId),
      eyebrow:`후속 의뢰 · ${q.story.stage}/${q.story.total}`,title:q.story.title,
      phase:`${from} 게시판에서 이어짐 · 기한 없음`,next:`${from}의 게시판에서 다음 부탁을 확인하고 계속할지 결정한다.`,
      expected:`이어서 맡으면 ${q.item}을 ${D.nodes[q.to].name}까지 가져간다.`,
      progress:{have:q.story.stage-1,need:q.story.total,label:`${q.story.stage-1}/${q.story.total}`}
    });
  }
  return rows;
};

G.completedQuestEntries = ()=>{
  const ledger=G.ensureQuestLedger();
  if(!ledger) return [];
  return [...ledger.completed,...ledger.mainHistory].slice().reverse().map(row=>({...row,kind:'completed',status:'completed',tracked:false}));
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
  try{ window.dispatchEvent(new CustomEvent('questtrackingchange',{detail:{id,tracked:index<0}})); }catch(e){}
  return {ok:true,tracked:index<0};
};

G.questLedgerSync = ()=>{
  const ledger=G.ensureQuestLedger();
  if(!ledger) return;
  const active=G.questLedgerEntries().filter(row=>row.kind!=='completed');
  const main=active.find(row=>row.kind==='main');
  const current={};
  for(const row of active) current[row.id]=`${row.status}|${row.phase}|${row.next}|${row.progress&&row.progress.label}`;
  if(!ledger.mainState&&main) ledger.mainState={chapterId:main.chapterId,act:main.act,title:main.title,phase:main.phase,next:main.next,expected:main.expected,progress:main.progress&&main.progress.label};
  if(!Object.keys(ledger.snapshot).length){ ledger.snapshot=current; return; }
  if(main){
    const previous=ledger.mainState;
    const changedChapter=previous&&previous.chapterId!==main.chapterId;
    const changedStep=previous&&(previous.next!==main.next||previous.progress!==(main.progress&&main.progress.label));
    if(changedChapter){
      ledger.mainHistory.push({id:`main_history_${previous.chapterId}_${S.day}_${S.at}`,eyebrow:`본편 기록 · ${previous.act}`,title:previous.title,phase:`${previous.phase} · ${S.day}일차`,next:'이 장에서 해야 할 일을 마쳤다.',expected:previous.expected,progress:{have:1,need:1,label:'완료'}});
      ledger.mainHistory=ledger.mainHistory.slice(-24);
      ledger.updates.push({id:main.id,kind:'main',title:`${main.act} · ${main.title}`,next:main.next,day:S.day,at:S.at});
    }else if(changedStep) ledger.updates.push({id:main.id,kind:'main',title:`본편 진행 · ${main.title}`,next:main.next,day:S.day,at:S.at});
    ledger.mainState={chapterId:main.chapterId,act:main.act,title:main.title,phase:main.phase,next:main.next,expected:main.expected,progress:main.progress&&main.progress.label};
  }
  for(const row of active.filter(row=>row.kind!=='main')){
    if(ledger.snapshot[row.id]&&ledger.snapshot[row.id]!==current[row.id]){
      ledger.updates.push({id:row.id,kind:row.kind,title:row.title,next:row.next,day:S.day,at:S.at});
    }else if(!ledger.snapshot[row.id]){
      ledger.updates.push({id:row.id,kind:row.kind,title:`새 임무 · ${row.title}`,next:row.next,day:S.day,at:S.at});
    }
  }
  if(ledger.updates.length>40){const overflow=ledger.updates.length-40;ledger.updates.splice(0,overflow);ledger.seenUpdateCount=Math.max(0,ledger.seenUpdateCount-overflow);}
  ledger.snapshot=current;
  try{ window.dispatchEvent(new CustomEvent('questledgerchange')); }catch(e){}
};

G.questLedgerUpdates = ()=>{
  const ledger=G.ensureQuestLedger();
  return ledger?ledger.updates.slice(ledger.seenUpdateCount):[];
};
G.questUpdateHistory = ()=>{const ledger=G.ensureQuestLedger();return ledger?ledger.updates.slice().reverse():[];};
G.clearQuestLedgerUpdates = ()=>{
  const ledger=G.ensureQuestLedger();
  if(ledger) ledger.seenUpdateCount=ledger.updates.length;
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
        next:'완료한 지역 의뢰다.', expected:`고철 ${q.reward}개를 받았다.`,
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
