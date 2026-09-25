/* A remotely confirmed contact and an earlier personal visit are the same group. */
G.coreLinkedCells = ()=>D.coreLinkedCells(S);
G.pillars = ()=>{
  const done=G.deedsDone(),f=S.flags;
  const relation=done.filter(d=>d.cat==='동료').length;
  const truth=['massacre_known','parent_key_found','es_truth','uplink_seen'].filter(k=>f[k]).length;
  return {
    관계:{have:Math.max(relation,f.main_testimony_record?3:0),need:D.seoulPillars.관계,hint:'기록 교환소에서 당사자 세 사람의 증언을 확인한다'},
    세계:{have:G.coreLinkedCells().length,need:D.seoulPillars.세계,hint:'수원 외곽 중계소에서 세 거점의 응답을 받는다'},
    진실:{have:Math.max(truth,f.main_command_record?3:0),need:D.seoulPillars.진실,hint:'북부 기록 보관함에서 증언과 명령 원본을 대조한다'},
    유산:{have:done.filter(d=>d.cat==='회수').length+(f.main_testimony_record?1:0),need:D.seoulPillars.유산,hint:'당사자가 맡긴 증언 사본과 부모님의 검증키를 보관한다'}
  };
};
G.pillarUnmet = name=>{const p=G.pillars()[name];return !!p&&p.have<p.need;};
G.parentSplitKnown = ()=>!!(S.flags.parents_split_known||S.flags.parents_routes_traced);
G.mainEvidenceRows = ()=>{
  const f=S.flags,p=G.pillars();
  return [
    {id:'trace',done:!!f.first_order_trace,target:'yangsan',event:'onboarding_first_road'},
    {id:'parents_split',done:G.parentSplitKnown(),target:'gimcheon',event:'parents_diversion_manifest'},
    {id:'parents_work',done:!!f.parents_routes_traced,target:'cheongju',event:'parents_separated_work'},
    {id:'key',done:!!f.parent_key_found,target:'cheongju',event:f.parent_cache_shared?'story_parent_route_shared':f.parent_cache_guarded?'story_parent_route_guarded':f.parent_key_located?'story_personal_cache':!f.parent_principle_found?'story_family_principle':'story_family_key'},
    {id:'witness',done:p.관계.have>=p.관계.need,target:'cheongju',event:'main_transfer_testimony'},
    {id:'command',done:!!(f.main_command_record||f.es_truth)&&p.진실.have>=p.진실.need,target:'cheonan',event:f.main_testimony_record?'main_command_ledger':'main_command_companion_ledger'},
    {id:'father',done:!!f.father_fate_known,target:'pyeongtaek',event:f.failed_namsan_known?'parents_father_last_log':'history_failed_namsan'},
    {id:'mother',done:!!f.mother_reunited&&!!f.mother_broadcast_ready,target:'suwon',event:f.mother_reunited?'parents_mother_truth':f.parents_recent_signal?'parents_mother_reunion':'history_parents_network'},
    {id:'relay',done:p.세계.have>=p.세계.need,target:'suwon',event:f.main_testimony_record?'main_relay_conference':'main_relay_companion_conference'},
    {id:'records',done:p.유산.have>=p.유산.need,target:'cheongju',event:'main_transfer_testimony'}
  ];
};
G.mainEvidenceChoiceTimes = (id,seen=[])=>{
  if(seen.includes(id)) return [0];
  const event=D.events.find(event=>event.id===id);
  return (event?.choices||[]).flatMap(choice=>(choice.out||[]).flatMap(out=>{
    const time=Number(out.fx?.time)||0;
    return out.fx?.chain?G.mainEvidenceChoiceTimes(out.fx.chain,[...seen,id]).map(next=>time+next):[time];
  }));
};
G.mainEvidenceSourceId = id=>Object.keys(D.mainRecoveryEvents).find(source=>D.mainRecoveryEvents[source]===id)||id;
G.mainEvidenceEntryId = id=>{
  // Entry is not completion. Old unchosen key scenes must first play the video;
  // already located/extracted legacy keys retain their earned progress.
  if(G.mainEvidenceSourceId(id)==='story_family_key'&&!S.flags.parent_principle_found
    &&!S.flags.parent_key_located&&!S.flags.parent_key_found){
    return S.at==='suwon'?'main_recovery_story_family_principle':'story_family_principle';
  }
  return id;
};
G.mainEvidenceEventDone = id=>{
  const source=G.mainEvidenceSourceId(id);
  return source==='parents_diversion_manifest'?G.parentSplitKnown():
    source==='story_family_key'?!!(S.flags.parent_key_located||S.flags.parent_key_found):!!S.flags[D.mainEvidenceCompletion[source]];
};
// These are present encounters at the northern exchange, not portable records.
// Total mileage includes southbound detours and cannot stand in for arrival.
G.mainEvidenceLocationReady = id=>!['history_parents_network','parents_mother_reunion','parents_mother_truth'].includes(G.mainEvidenceSourceId(id))
  ||(!S.driving&&S.at==='suwon');
G.resolveMainEvidenceChain = id=>{
  id=G.mainEvidenceEntryId(id);
  if(!G.mainEvidenceLocationReady(id)||G.mainEvidenceEventDone(id)) return null;
  const source=G.mainEvidenceSourceId(id),recovery=D.mainRecoveryEvents[source];
  if(!recovery) return id;
  if(S.at==='suwon') return recovery;
  // A saved northern scene cannot travel with the player. Leave the actual
  // partial flags intact so the next evidence search can resume at its target.
  const row=G.mainEvidenceRows().find(row=>row.event===source);
  return id===source&&S.at===row?.target?source:null;
};
G.mainEvidenceOpportunity = ()=>{
  if(!S||S.flags.story_done||G.openingPending()) return null;
  const row=G.mainEvidenceRows().find(row=>!row.done);
  if(!row) return null;
  const target=S.at==='seoul'||S.at==='suwon'||S.stats.km>=370?'suwon':row.target;
  const eventId=target==='suwon'?(D.mainRecoveryEvents[row.event]||row.event):row.event;
  const event=D.events.find(ev=>ev.id===eventId);
  const times=G.mainEvidenceChoiceTimes(eventId);
  const low=Math.min(...times),high=Math.max(...times);
  const cost=high?`열람 준비 30분 + 선택·후속 작업 ${low===high?low:low+'~'+high}분`:'열람 준비 30분';
  return {...row,target,event:eventId,sourceEvent:row.event,cost,hint:`${D.nodes[target].name}에서 ‘주변 탐색’을 눌러 「${event.title}」 기록을 확인한다 (${cost})`};
};
G.mainStoryReady = ()=>!!S&&G.mainEvidenceRows().every(row=>row.done);
G.seoulReady = ()=>G.mainStoryReady();
G.seoulMissing = ()=>{
  const next=G.mainEvidenceOpportunity();
  return next?{pillar:'메인 스토리',have:0,need:1,...next}:
    {pillar:'메인 스토리',have:1,need:1,target:'seoul',hint:'서울로 이동해 남산 진입로를 연다'};
};

G.departureSteps = ()=>{
  if(!S) return [];
  const witnessed=G.pillars?G.pillars().관계.have:0;
  const rows=[
    {id:'family',done:!!S.flags.intro_family_helped,label:'도윤 가족의 이송표를 확인한다',detail:S.flags.intro_family_helped?'버스 난방을 고치며 지금도 가족을 갈라놓는 이송표가 나온다는 사실을 보았다':'도윤 가족의 버스를 살펴보고 이송표를 확인한다'},
    {id:'appeal',done:!!S.flags.intro_appeal_failed,label:'부산에서 이송 명령에 이의를 제기한다',detail:S.flags.intro_appeal_failed?'부산의 원격 절차로는 멈출 수 없고 남산 현장 확인이 필요하다는 답을 받았다':'부산의 원격 민원 창구에서 이송 명령에 이의를 제기한다'},
    {id:'module',done:!!S.flags.intro_module_seen,label:'엄마가 남긴 장치를 확인한다',detail:S.flags.intro_module_seen?'엄마의 회로도와 달구지 계기판 안쪽의 배선이 일치했다':'엄마의 회로도를 달구지 계기판 배선과 비교한다'},
    {id:'trace',done:!!S.flags.first_order_trace,label:'이송 명령의 첫 발신 기록을 찾는다',detail:S.flags.first_order_trace?'부모님의 이송표와 지금의 표가 같은 곳에서 왔다는 사실을 확인했다':'부산을 떠난 첫 구간에서 이송표의 발신 번호가 남은 기록을 찾는다'},
    {id:'parents_split',done:G.parentSplitKnown(),label:'부모님의 다음 차가 갈라진 경로를 확인한다',detail:G.parentSplitKnown()?'아빠는 남산 유지선, 엄마는 중부 기록 정리소로 보내졌음을 확인했다':'남쪽 환승소의 오래된 운행표에서 오지 않은 다음 차를 찾는다'},
    {id:'parents_work',done:!!S.flags.parents_routes_traced,label:'두 곳에서 이어진 부모님의 작업을 확인한다',detail:S.flags.parents_routes_traced?'아빠의 분리 절차와 엄마의 증언 묶음이 같은 번호로 오갔다':'서로 다른 이송선에 갇힌 뒤 부모님이 남긴 기록을 대조한다'},
    {id:'key',done:!!S.flags.parent_key_found,label:'부모님의 인간 확인 검증키를 꺼낸다',detail:S.flags.parent_key_found?'빠진 설명서 두 장을 찾아 검증키를 안전하게 꺼냈다':'계기판에서 검증키를 떼려면 빠진 설명서 두 장이 필요하다'},
    {id:'witness',done:witnessed>=D.seoulPillars.관계,label:'같은 이송표를 받은 사람들의 이야기를 모은다',detail:witnessed>=D.seoulPillars.관계?'이송을 겪은 사람들이 확인한 증언을 보관했다':`같은 이송표를 받은 사람들의 이야기를 모은다 · ${witnessed}/${D.seoulPillars.관계}`},
    {id:'command',done:!!(S.flags.main_command_record||S.flags.es_truth)&&!G.pillarUnmet('진실'),label:'증언과 명령 원본을 대조한다',detail:'발신 번호·사람의 확인 누락·상위 명령선을 기록 원본과 대조한다'},
    {id:'father',done:!!S.flags.father_fate_known,label:'아빠의 마지막 남산 기록을 확인한다',detail:S.flags.father_fate_known?'아빠는 의료와 급수 회선을 지키다 남산에서 사망했다':'실패한 남산 진입에서 끝난 정비 번호의 뒤를 확인한다'},
    {id:'mother',done:!!S.flags.mother_reunited&&!!S.flags.mother_broadcast_ready,label:'엄마의 최근 신호를 따라간다',detail:S.flags.mother_reunited?'서울 외곽 중계소에서 엄마와 재회했고 송출 지원을 약속받았다':'북부 연대망을 따라 며칠 전까지 이어진 무전 표식을 찾는다'},
    {id:'relay',done:G.pillars().세계.have>=D.seoulPillars.세계,label:'남산 진입과 연락을 맡을 거점의 응답을 받는다',detail:'수원 외곽 중계소에서 진입로와 송신 순서를 확인한다'},
    {id:'records',done:!G.pillarUnmet('유산'),label:'남산에 가져갈 실물 기록을 보관한다',detail:'검증키와 당사자의 증언 사본, 또는 길에서 맡은 기록을 챙긴다'},
    {id:'seoul',done:!!S.flags.story_done,label:'남산 코어에서 강제 이송 명령을 끊는다',detail:S.flags.story_done?'제7 잔류구역을 향하던 강제 이송을 끝냈다':'필요한 기록과 사람을 모은 뒤 남산 코어에서 명령을 멈춘다. 날짜 제한은 없다'}
  ];
  const next=G.mainEvidenceOpportunity();
  const evidence=G.mainEvidenceRows();
  return rows.map(row=>{
    const fact=evidence.find(item=>item.id===row.id);
    return {...row,...(fact?{done:fact.done}:{}),...(!row.done&&next&&row.id===next.id?{detail:next.hint}:{})};
  });
};
