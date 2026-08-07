/* ═══ ENGINE 3/5 — 주행·연비·관측 임계·사건 발화 ═══ */
/* ── travel ── */
G.routeStatus = ()=>{
  const state=S&&S.routePlan, def=state&&D.routePlans&&D.routePlans[state.id];
  if(!state||!def) return null;
  const at=S.driving?S.driving.to:S.at;
  const reached=new Set(state.visited||[]);
  if(at) reached.add(at);
  const done=def.corridor.filter(id=>reached.has(id)).length;
  return {state,def,done,total:def.corridor.length,complete:state.status==='complete'};
};
G.durationLabel = mins=>{
  mins=Math.max(0,Math.round(Number(mins)||0));
  if(mins<60) return `${mins}분`;
  const h=Math.floor(mins/60), m=mins%60;
  return m?`${h}시간 ${m}분`:`${h}시간`;
};
/* 노선 선택은 숨은 정답 대신 지금 가진 자원과 감당할 시간을 보여 준다.
   거리는 고정값이 아니라 실제 도로 데이터를 합산해 지도 수정에도 함께 갱신된다. */
G.routeForecast = id=>{
  const def=D.routePlans&&D.routePlans[id];
  if(!def) return null;
  let km=0,fuel=0,rough=0;
  for(let i=0;i<def.corridor.length-1;i++){
    const e=G.edgeBetween(def.corridor[i],def.corridor[i+1]);
    if(!e) continue;
    km+=e[2]; fuel+=G.fuelFor(e[2],e[3]);
    if(e[3]==='rough') rough++;
  }
  const stops=def.corridor.slice(1,-1).filter(node=>D.nodes[node]&&D.nodes[node].stl).length;
  const short=Math.max(0,fuel-Math.floor(S.fuel));
  const readiness=short===0?'현재 연료로 통과 가능'
    :stops?`연료 ${short}L가량은 중간 보급 필요`:`출발 전 연료 ${short}L가량 더 필요`;
  return {id,km,fuel,rough,stops,minutes:G.driveMinutes(km),short,readiness};
};
G.goalDistance = id=>{
  if(!D.nodes[id]||!D.nodes.seoul) return Infinity;
  const distances=Object.fromEntries(Object.keys(D.nodes).map(node=>[node,Infinity]));
  const pending=new Set(Object.keys(D.nodes));
  distances[id]=0;
  while(pending.size){
    let current=null;
    for(const node of pending){
      if(current===null||distances[node]<distances[current]) current=node;
    }
    if(current===null||!Number.isFinite(distances[current])) break;
    pending.delete(current);
    if(current==='seoul') break;
    for(const edge of D.edges){
      let next=null;
      if(edge[0]===current) next=edge[1];
      else if(edge[1]===current) next=edge[0];
      if(!next||!pending.has(next)) continue;
      const candidate=distances[current]+edge[2];
      if(candidate<distances[next]) distances[next]=candidate;
    }
  }
  return distances.seoul;
};
G.travelForecast = id=>{
  const chk=G.canTravelTo(id);
  if(!chk.ok) return {...chk,minutes:0,risk:'',gear:[],gearLabel:'',readinessScore:0,
    readinessLabel:'이동 불가',readinessClass:'blocked',readinessReason:chk.why||'지금은 갈 수 없다'};
  const reasons=[];
  if(chk.road==='rough') reasons.push('험로');
  if(S.wx==='storm') reasons.push('폭풍');
  else if(S.wx==='rain') reasons.push('빗길');
  else if(S.wx==='dust') reasons.push('먼지');
  if(S.fatigue>=60) reasons.push('피로 누적');
  const gear=[];
  if(chk.road==='rough'&&S.up.mudtires) gear.push('험로 타이어');
  if(chk.road==='rough'&&S.up.susp) gear.push('강화 서스펜션');
  if(chk.road==='rough'&&S.up.winch) gear.push('전면 윈치');
  if(['storm','dust'].includes(S.wx)&&S.up.snorkel) gear.push('스노클');
  if(G.isNight()&&S.up.lightbar) gear.push('라이트바');
  if(S.up.solar) gear.push('태양광 보조');
  const minutes=G.driveMinutes(chk.km);
  const shortage=S.fuel<chk.fuel;
  const fuelMargin=Math.floor(S.fuel-chk.fuel);
  const party=Math.max(1,G.partySize());
  const supplyNeed=Math.max(1,Math.ceil(party*minutes/600));
  const supplyMargin=Math.floor(Math.min(S.food,S.water)-supplyNeed);
  const vanRatio=S.van/Math.max(1,S.vanMax);
  const warnings=[];
  let readinessScore=100;
  if(shortage){ readinessScore-=70+Math.min(20,Math.abs(fuelMargin)*2); warnings.push(`연료 ${Math.abs(fuelMargin)}L 부족`); }
  else if(fuelMargin<=3){ readinessScore-=22; warnings.push(`연료 여유 ${fuelMargin}L`); }
  else if(fuelMargin<=7) readinessScore-=10;
  if(supplyMargin<0){ readinessScore-=28; warnings.push('식량·물 보충 필요'); }
  else if(supplyMargin<=2){ readinessScore-=12; warnings.push('식량·물 여유 적음'); }
  if(vanRatio<.3){ readinessScore-=30; warnings.push('차체 위험'); }
  else if(vanRatio<.55){ readinessScore-=14; warnings.push('차체 점검 권장'); }
  if(S.fatigue>=75){ readinessScore-=22; warnings.push('운전자 휴식 필요'); }
  else if(S.fatigue>=55){ readinessScore-=10; warnings.push('피로 누적'); }
  if(chk.road==='rough'&&!S.up.mudtires&&!S.up.susp){ readinessScore-=12; warnings.push('험로 대응 없음'); }
  if(['storm','dust'].includes(S.wx)&&!S.up.snorkel){ readinessScore-=8; warnings.push('흡기 보호 없음'); }
  if(G.isNight()&&!S.up.lightbar){ readinessScore-=7; warnings.push('야간 시야 제한'); }
  readinessScore=Math.round(clamp(readinessScore+Math.min(9,gear.length*3),0,100));
  const readinessLabel=readinessScore>=86?'여유':readinessScore>=68?'준비됨':readinessScore>=45?'주의':'위험';
  const readinessClass=readinessScore>=86?'ready':readinessScore>=68?'steady':readinessScore>=45?'caution':'danger';
  const support=gear.length?`${gear.join(' · ')} 작동`:'';
  const readinessReason=[...warnings,support].filter(Boolean).join(' · ')||'자원과 차체 상태가 안정적이다';
  const currentGoalDistance=G.goalDistance(S.at);
  const nextGoalDistance=G.goalDistance(id);
  const progressKm=Math.round(currentGoalDistance-nextGoalDistance);
  const progressScore=progressKm>0?Math.round(clamp(55+progressKm*.8,55,100))
    :progressKm===0?45:Math.round(clamp(35+progressKm,0,40));
  const destination=D.nodes[id]||{};
  let supplyScore=destination.stl?82:destination.type==='settlement'?70:38;
  if(destination.stl&&supplyMargin<=2) supplyScore+=12;
  if(!destination.stl&&supplyMargin<=0) supplyScore-=18;
  supplyScore=Math.round(clamp(supplyScore,0,100));
  const directionLabel=progressKm>0?`서울 방향 ${progressKm}km 전진`
    :progressKm<0?`서울에서 ${Math.abs(progressKm)}km 멀어짐`:'서울 진행도 변화 없음';
  return {...chk,minutes,shortage,
    risk:reasons.length?reasons.join(' · '):'보통 도로',gear,
    gearLabel:gear.length?`대응 장비: ${gear.join(' · ')}`:'',fuelMargin,supplyMargin,
    readinessScore,readinessLabel,readinessClass,readinessReason,
    safetyScore:readinessScore,progressKm,progressScore,supplyScore,directionLabel};
};
G.vanBuildProfile = ()=>{
  const installed=(D.upgrades||[]).filter(up=>S.up&&S.up[up.id]);
  const ranked=(D.upgradeGroups||[]).map(group=>({
    id:group.id,nm:group.nm,sub:group.sub,
    count:group.ids.filter(id=>S.up&&S.up[id]).length
  })).sort((a,b)=>b.count-a.count);
  const profiles={
    fuel:['장거리 순항형','연료 여유와 악천후 대응으로 먼 구간을 끊지 않고 달린다'],
    seating:['이동 공동체형','더 많은 사람과 생활 공간을 싣는 움직이는 집이다'],
    chassis:['험로 돌파형','차체와 바퀴를 믿고 끊긴 길을 정면으로 넘는다'],
    utility:['현장 대응형','고장과 돌발 상황을 그 자리에서 해결한다'],
    power:['관측 선행형','먼저 보고 먼저 듣고 위험이 닿기 전에 움직인다'],
    camp:['야영 생활형','멈춘 시간을 회복과 관계의 시간으로 바꾼다'],
    living:['자급 생활형','물과 먹을 것을 차 위에서 조금씩 되살린다']
  };
  if(!installed.length) return {id:'stock',name:'기본 생존형',summary:'아직 한 방향으로 특화되지 않은 출발 상태',installed:0,signature:[],secondary:'',tier:0,tierLabel:'기본'};
  const main=ranked[0], second=ranked.find(group=>group.count>0&&group.id!==main.id);
  const identity=profiles[main.id]||[main.nm,main.sub];
  const signature=installed.filter(up=>main.id&&((D.upgradeGroups||[]).find(g=>g.id===main.id)?.ids||[]).includes(up.id)).slice(-3).map(up=>up.nm);
  const tier=main.count>=4?2:main.count>=2?1:0;
  return {id:main.id,name:identity[0],summary:identity[1],installed:installed.length,signature,
    secondary:second&&second.count===main.count?`${second.nm} 혼합`:'',tier,
    tierLabel:tier===2?'완성':tier===1?'특화':'형성 중'};
};
G.routeTravelCheck = (from,to)=>{
  const rs=G.routeStatus();
  if(!rs||rs.complete||from===rs.def.end) return {ok:true};
  /* 오래된 세이브나 강제 이동이 노선 밖에서 복원되면 발을 묶지 않는다. */
  if(!rs.def.corridor.includes(from)) return {ok:true};
  if(rs.def.corridor.includes(to)) return {ok:true};
  return {ok:false,why:`${rs.def.name}을 골랐다 — 청주까지 이 노선을 마쳐야 한다`};
};
G.chooseRoute = id=>{
  const def=D.routePlans&&D.routePlans[id];
  if(!def||S.routePlan) return false;
  S.routePlan={id,status:'active',chosenDay:S.day,startedKm:Math.round(S.stats.km),visited:[def.start]};
  G.queueStory(def.opening);
  G.addNote({type:'사건',title:`김천에서 고른 길: ${def.name}`,
    body:`${def.promise}. 청주에서 길이 다시 합쳐질 때까지 이 노선을 간다.`,links:['달구지']});
  UI.toast(`${def.mark} ${def.name} — 청주까지 노선 고정`);
  G.qualityRoute(id,'chosen');
  G.qualityMeaningfulChange('objective',`route:${id}`);
  return true;
};
G.updateRouteOnArrival = to=>{
  const rs=G.routeStatus();
  if(!rs||rs.complete) return false;
  if(rs.def.corridor.includes(to)&&!rs.state.visited.includes(to)) rs.state.visited.push(to);
  if(to!==rs.def.end) return false;
  rs.state.status='complete'; rs.state.completedDay=S.day;
  if(rs.state.id==='ridge'){
    S.pursuit=Math.max(0,S.pursuit-1); G.moodAll(2);
  } else {
    S.food+=2; S.water+=2;
  }
  G.addNote({type:'사건',title:`노선 완주: ${rs.def.name}`,
    body:`김천에서 고른 길을 청주까지 바꾸지 않고 왔다. ${rs.def.reward}.`,links:['달구지']});
  UI.toast(`${rs.def.mark} ${rs.def.name} 완주 — 두 길이 청주에서 다시 만났다`);
  G.qualityRoute(rs.state.id,'completed');
  G.qualityMeaningfulChange('world',`route_complete:${rs.state.id}`);
  return true;
};
G.canTravelTo = (id)=>{
  if(S.driving||S.ended) return {ok:false};
  const e = G.edgeBetween(S.at,id);
  if(!e) return {ok:false, why:'인접한 길이 없다'};
  if(!S.known.includes(id)) return {ok:false, why:'모르는 곳이다'};
  const route=G.routeTravelCheck(S.at,id);
  if(!route.ok) return route;
  const fuelNeed = G.fuelFor(e[2], e[3]);
  if(S.fuel<=0) return {ok:false, why:'연료가 없다'};
  return {ok:true, km:e[2], road:e[3], fuel:fuelNeed};
};
G.fuelFor = (km,road)=>{ let per = 1/6.0; if(road==='rough') per*=1.35; if(road==='high') per*=0.92;
  if(G.hasComp('minji')) per*=0.92;
  if(G.hasPerk('mj_fuel')) per*=0.95;
  if(road==='rough' && S && S.up && S.up.mudtires) per/=1.15;   // 험로 타이어
  if(S){ let wxPen = S.wx==='storm'?0.12 : S.wx==='dust'?0.08 : 0;
    if(S.up&&S.up.snorkel) wxPen/=2;                              // 스노클
    per*=(1+wxPen);
    if(S.up&&S.up.solar) per*=0.92;
    per*=G.weightFuelFactor();           // 많이 실은 차는 많이 마신다
    if(S.fatigue>=60) per*=1.08;         // 피곤한 발은 무겁다
    per*=(1 - G.driverLv()*0.02); }
  return Math.ceil(km*per); };

G.prepareRecruitGuest = (dv)=>{
  const q=S.recruitQ;
  if(!q||q.stage!=='road'||!dv) return;
  const def=D.recruitQuests[q.id];
  if(!def||!def.guest) return;
  dv.guest=q.id;
  if(q.id==='minji') dv.guestFuel=.92;
  if(q.id==='parkss') S.fatigue=clamp(S.fatigue-8,0,100);
  if(q.id==='leo') dv.guestFatigue=.8;
  if(q.id==='jaeyi'){ dv.guestWear=.7; dv.guestFind=2; }
  if(q.id==='eunsu'){
    if(S.pursuit>0) S.pursuit--;
    else if(dv.slots.length) dv.slots.pop();
  }
  if(q.id==='kangwoo'&&dv.slots.length) dv.slots.pop();
  G.qualityMilestone('temporary_companion',{companionId:q.id});
  UI.toast(`${def.guest.ic} 임시 동행 — ${def.guest.title}`);
};

/* 영입 임무에서 고른 방법이 문구로만 남지 않고, 합류 후 첫 주행에
   한 번의 실제 결과를 만든다. 데이터에 drive가 있는 동료만 대상이다. */
G.prepareRecruitMemory = (dv)=>{
  if(!dv) return null;
  for(const id of S.party||[]){
    const choice=S.comps[id]&&S.comps[id].approach;
    const approach=choice&&D.recruitQuests[id]&&D.recruitQuests[id].approaches[choice];
    const drive=approach&&approach.drive, flag=`${id}_approach_drive`;
    if(!drive||S.flags[flag]) continue;
    S.flags[flag]=true;
    dv.recruitMemory={id,choice,title:drive.title,desc:drive.desc,effect:drive.effect};
    if(drive.fuel) dv.memoryFuel=drive.fuel;
    if(drive.fatigueMul) dv.memoryFatigue=drive.fatigueMul;
    if(drive.fatigue){
      S.fatigue=clamp(S.fatigue+drive.fatigue,0,100);
      dv.memoryFatigueStart=drive.fatigue;
    }
    if(drive.pursuit){
      S.pursuit=clamp(S.pursuit+drive.pursuit,0,5);
      dv.memoryPursuit=drive.pursuit;
    }
    if(drive.skipEvent&&dv.slots.length){
      dv.slots.pop();
      dv.memorySkippedEvent=true;
    }
    if(drive.scrap) dv.memoryScrap=drive.scrap;
    if(drive.van){
      S.van=clamp(S.van+drive.van,0,S.vanMax);
      dv.memoryVan=drive.van;
    }
    UI.toast(`🔩 ${D.comps[id].name}가 첫 동행을 준비한다 — ${drive.effect}`);
    return dv.recruitMemory;
  }
  return null;
};

/* 정착지에서 바꾼 풍경이 정착지 패널 안에서 끝나지 않게, 그곳을 떠나는
   첫 주행 중 한 번만 후속 장면을 예약한다. */
G.prepareSettlementRoadEcho = (dv,from,to)=>{
  const node=D.nodes[from], stlId=node&&node.stl;
  if(!dv||!stlId) return null;
  const state=G.stlFieldState();
  const recent=[...state.log].reverse().find(entry=>{
    if(!entry||entry.stl!==stlId) return false;
    const key=`${stlId}:${entry.id}`, action=G.stlFieldAction(stlId,entry.id);
    return action&&action.change&&!state.roadEchoed[key];
  });
  if(!recent) return null;
  const action=G.stlFieldAction(stlId,recent.id), key=`${stlId}:${recent.id}`;
  S._impactEcho={key,stlId,actionId:recent.id,from,to,wx:dv.wx,day:S.day,
    visual:action.change.visual||'route',label:action.label||action.title||'도운 일',done:false};
  dv.slots.push({at:Math.max(2,dv.dist*(.28+rng()*.12)),special:'impact'});
  dv.slots.sort((a,b)=>a.at-b.at);
  return S._impactEcho;
};
G.roadEchoCopy = phase=>D.roadEchoCopy(S,phase);
G.resolveImpactEcho = mode=>{
  const echo=S&&S._impactEcho;
  if(!echo||echo.done) return {fx:{},chips:[]};
  const state=G.stlFieldState();
  echo.done=true; echo.mode=mode;
  state.roadEchoed[echo.key]={day:S.day,min:S.min,mode,to:echo.to};
  const tech=['light','air','gate','watch','record','route','order'].includes(echo.visual);
  let fx={}, summary='일행을 그대로 보냈다';
  if(mode==='assist'){
    fx={time:35,fatigue:2,moodAll:2}; summary='차를 세우고 마지막 구간을 함께 정리했다';
    if(echo.visual==='water') fx.water=2;
    else if(['steam','food'].includes(echo.visual)) fx.food=2;
    else if(echo.visual==='shelter') fx.fatigue=-4;
    else fx.scrap=2;
  } else if(mode==='relay'){
    fx={time:15,moodAll:1,scrap:1}; summary='달구지 무전과 지도로 다음 구간을 이어 줬다';
    if(tech) fx.pursuit=-1;
  }
  G.addNote({type:'사건',title:G.roadEchoCopy('title'),
    body:`${summary}. ${G.roadEchoCopy('outcome')}`,links:['달구지']});
  return {fx,chips:[{t:'정착지의 변화가 길 위로 이어졌다',c:'item'}]};
};

/* ── 관측(pursuit) 임계 효과 ──
   그동안 관측은 이벤트 가중치만 흔들었고 문턱이 없어, 전투 실패와 구제 사다리가
   물리던 "관측 +1"이 사실상 가짜 값이었다(2026-08-06 실측: 임계 분기 0개).
   이제 3에서 길이 좁아지고, 5에서 마을이 문을 닫는다. */
G.PURSUIT_CHECKPOINT = 3;
G.PURSUIT_SHUNNED = 5;
G.pursuitCheckpoint = ()=>{
  if(!S) return null;
  if(S.pursuit>=G.PURSUIT_SHUNNED) return {level:'high', chance:0.5,
    label:'검문망이 좁혀졌다 — 주행마다 검문 위험'};
  if(S.pursuit>=G.PURSUIT_CHECKPOINT) return {level:'watch', chance:0.28,
    label:'초계가 늘었다 — 긴 구간에서 검문 위험'};
  return null;
};
G.pursuitRefusesShelter = ()=>{
  if(!S) return null;
  if(S.pursuit>=G.PURSUIT_SHUNNED) return {refused:true,
    why:'표시된 차량은 마을에 재우지 않는다'};
  return {refused:false, why:''};
};
G.startTravel = (to)=>{
  const chk = G.canTravelTo(to); if(!chk.ok) return false;
  G.qualitySettlementLeave(S.at);
  const wx = S.wx;
  const slots = [];
  const isBridge = (S.at==='suwon'&&to==='seoul'&&!S.flags.bridge_crossed);
  if(isBridge){ slots.push({at:chk.km*0.5, special:'bridge'}); }
  else{
    let count = chk.km>=40?2 : chk.km>=18?1 : (rng()<0.5?1:0);
    if(rng()<0.3) count++;
    const used=[];
    for(let i=0;i<count;i++){ let f; do{ f=0.14+rng()*0.72 }while(used.some(u=>Math.abs(u-f)<0.15)); used.push(f);
      const gen = S.mode==='offroad' && OFF.ready() && rng()<0.5;
      slots.push({at:chk.km*f, gen}); }
    slots.sort((a,b)=>a.at-b.at);
    /* 여정 비트는 길 위의 장면이다. 도착 슬롯에 두면 위치 이벤트·위기와 자리를 다퉈
       한두 개만 전달된다(2026-08-06 실측). 주행 중 한 자리를 비트에 준다. */
    if(Array.isArray(S._beatQueue)&&S._beatQueue.length){
      slots.push({at:chk.km*(0.3+rng()*0.35), beat:true});
      slots.sort((a,b)=>a.at-b.at);
    }
    /* 기둥 접선도 길의 장면이다. 접선은 노드 앵커형(nearNode)이라 그 구간 1~2번
       뽑기에 걸리길 비는 구조로는 산술이 안 된다(2026-08-07 완주봇: 50일에 0~1/3).
       이 구간에서 만날 수 있는 접선이 있으면 자리 하나를 보장한다. */
    if(D.events.some(e=>e.pillar&&G.pillarUnmet(e.pillar))){
      slots.push({at:chk.km*(0.5+rng()*0.3), pillarPick:true});
      slots.sort((a,b)=>a.at-b.at);
    }
    /* 관측이 문턱을 넘으면 검문이 실제로 길 위에 선다 — 긴 구간일수록 더 자주 */
    const watch=G.pursuitCheckpoint();
    if(watch){
      const odds=watch.chance*(chk.km>=30?1:0.6);
      if(rng()<odds) slots.push({at:chk.km*(0.35+rng()*0.4), forced:'patrol_toll'});
      slots.sort((a,b)=>a.at-b.at);
    }
  }
  S.driving = {from:S.at, to, dist:chk.km, gone:0, road:chk.road, wx, slots, si:0,eventCount:0,
    snapshot:{gameMinute:S.day*1440+S.min,fuel:S.fuel,water:S.water,food:S.food,scrap:S.scrap,
      van:S.van,fatigue:S.fatigue,pursuit:S.pursuit,build:G.vanBuildProfile().name}};
  G.qualityMilestone('first_departure',{from:S.at,to,km:chk.km,road:chk.road});
  if(!isBridge) G.prepareSettlementRoadEcho(S.driving,S.at,to);
  G.prepareRecruitGuest(S.driving);
  G.prepareRecruitMemory(S.driving);
  S.at = null;
  if(S.mode==='offroad') OFF.prefetch();
  UI.onDepart();
  G.save();
  return true;
};

/* 무너진 국도를 낡은 용달차로 간다. 평균 시속은 고속도로 순항이 아니라
   우회·서행·잔해 치우기가 섞인 값이다. 시속을 낮추는 대신 TIMESCALE을 같은 비율로
   올려 실시간 체감(초당 약 1.6km 진행)은 그대로 두었다 — 게임 안의 하루만 무거워진다.
   411km ÷ 13km/h ≈ 32시간 주행 = 낮에만 달리면 사나흘, 사건과 정비까지 치면 일주일 넘게. */
const KMH = 13;                    // 평균 주행 속도 (실주행 기준, 잔해·우회 포함)
const TIMESCALE = 7.4;             // 실제 1초 = 게임 7.4분 (13/60*7.4 ≈ 이전과 같은 초당 거리)
let banterCd = 6;                  // 첫 잡담까지 몇 초
let radioCd = 30;                  // 라디오 첫 수신까지
let choiceEchoCd = 8;              // 선택의 후속은 일반 잡담보다 먼저 한 번 확인
/* 선택 풀을 거르는 "최근에 나온 것" 기록까지 함께 되돌린다 — 쿨다운만 리셋하면
   대사 후보 집합이 이전 판을 기억한 채 남아 같은 시드가 다른 여정을 만든다. */
G.resetDriveTimers = ()=>{ banterCd=6; radioCd=30; choiceEchoCd=8;
  lastBanter=[]; lastChat=-1; lastRadio=null; };
/* 실시간 1초당 진행 거리(km). 테스트·도구가 속도 상수를 복제하지 않도록 엔진이 노출한다. */
G.tickKmPerSecond = ()=> KMH/60*TIMESCALE;
/* 표시용 주행 소요 시간(게임 분). UI가 속도 상수를 복제하면 예상과 실제가 갈라진다 —
   2026-08-06에 실제로 그랬다(표시 2시간 58분 vs 실제 10시간). 단일 소스로 고정. */
G.driveMinutes = (km)=> Math.ceil((Number(km)||0)/KMH*60);

G.tick = (dt)=>{ // dt: real seconds
  if(!S || S.ended || UI.modalOpen()) return;
  if(!S.driving) return;
  const gm = dt*TIMESCALE;               // game minutes
  const wxSpd = S.wx==='storm'?0.76 : S.wx==='fog'?0.88 : 1;
  const ftgSpd = S.fatigue>=80?0.85:1;   // 수면 부족 → 감속
  const km = KMH/60*gm*wxSpd*ftgSpd;
  const dv = S.driving;
  dv.gone = Math.min(dv.dist, dv.gone+km);
  S.stats.km += km;
  // fuel
  const per = G.fuelFor(1000,dv.road)/1000;
  S.fuel = Math.max(0, S.fuel - km*per*(dv.guestFuel||1)*(dv.memoryFuel||1));
  // van wear
  let wearMul = S.up&&S.up.susp? 0.5:1;
  if(S.up&&S.up.mudtires&&dv.road==='rough') wearMul*=0.6;
  wearMul*=G.weightWearFactor();   // 무거운 차는 험로에서 더 앓는다
  wearMul*=dv.guestWear||1;
  if(dv.road==='rough') S.van = Math.max(0, S.van - km*(G.isWet()?0.09:0.06)*wearMul);
  if(S.wx==='storm') S.van = Math.max(0, S.van - km*0.03*wearMul);
  // 재이: 까치의 눈
  if(G.hasPerk('jy_magpie')){ S._scrapKm=(S._scrapKm||0)+km;
    if(S._scrapKm>=18){ S._scrapKm-=18; S.scrap++; UI.toast('🎒 재이가 길에서 쓸 만한 고철을 낚아챘다 +1'); } }
  // 운전은 추가 피로 (밤 운전은 특히)
  const nightFtg = G.isNight()? (S.up&&S.up.lightbar?0.049:0.075) : 0.04;   // 라이트바=밤길이 덜 갉아먹음
  const bunkMul = S.up&&S.up.bunk? 0.8:1;                                    // 2층 침대=교대 수면
  S.fatigue = clamp(S.fatigue + gm*nightFtg*bunkMul*(1-G.driverLv()*0.06)*(dv.guestFatigue||1)*(dv.memoryFatigue||1), 0, 100);
  G.qualityResourceCheck();
  G.checkDriverLv();
  G.advance(gm);
  if(S.ended) return;
  // crises
  if(S.fuel<=0 && dv.gone<dv.dist){ G.openRescue('nofuel','crisis_nofuel'); return; }
  if(S.van<=0){ S.van=0; G.openRescue('breakdown','crisis_breakdown'); return; }
  if(S.fatigue>=99){ G.openRescue('collapse','crisis_collapse'); return; }
  if(S.fatigue>=85 && (S.day*1440+S.min)-S._drowsyAt>240){
    S._drowsyAt=S.day*1440+S.min; G.openEventById('crisis_drowsy'); return; }
  // event slots
  if(dv.si < dv.slots.length && dv.gone >= dv.slots[dv.si].at){
    const slot = dv.slots[dv.si++];
    if(slot.special==='bridge'){ G.openEvent(D.bridgeEvent); return; }
    if(slot.special==='impact'){ G.openEventById('settlement_road_echo'); return; }
    if(slot.beat){ const id=G.popBeat(); if(id){ G.openEventById(id); return; } }
    if(slot.pillarPick){
      const pool=G.eligible().filter(e=>e.pillar&&G.pillarUnmet(e.pillar));
      if(pool.length){ G.openEvent(pool[Math.floor(rng()*pool.length)]); return; }
      G.fireDriveEvent(); return;   // 이 구간엔 접선이 없다 — 자리는 일반 뽑기로
    }
    if(slot.forced){ G.openEventById(slot.forced); return; }   // 관측 문턱이 세운 검문
    if(slot.gen){ OFF.playGenerated(()=>G.fireDriveEvent()); return; }
    G.fireDriveEvent(); return;
  }
  // 중요한 선택은 충분한 거리와 사건이 지난 뒤 한 번만 대화/풍경으로 돌아온다.
  choiceEchoCd -= dt;
  if(choiceEchoCd<=0){
    const echo=G.takeChoiceEcho();
    if(echo){
      UI.playChat(echo.lines);
      banterCd=Math.max(banterCd,echo.lines.length*4+8);
      choiceEchoCd=55;
    } else choiceEchoCd=8;
  }
  // banter
  banterCd -= dt;
  if(banterCd<=0){ banterCd = 11+R(9);
    if(rng()<0.22){ const c=G.pickChat(); if(c){ UI.playChat(c.lines); banterCd+=c.lines.length*3; } }
    else { const b = G.pickBanter(); if(b) UI.speak(b); } }
  // radio (수리 후에만 수신)
  if(S.flags.radio_fixed){ radioCd -= dt;
    if(radioCd<=0){ radioCd = 90+R(120); UI.playRadio(); } }
  // arrival
  if(dv.gone>=dv.dist){ G.arrive(); }
};

G.queueCrisis = (id)=>{ S._crisis = id; };
G.maybeCrisis = ()=>{ if(S._crisis){ const id=S._crisis; S._crisis=null; G.openEventById(id); return true } return false };
/* 구제 위기는 반복될수록 비싸진다. 첫 실수는 배움이고, 그 뒤로는 시간·자원·관측이
   실제 비용으로 청구된다 — "실패 = 소액 과금" 루프를 여기서 끊는다. */
G.rescueCount = (kind)=>((S&&S._rescues)||{})[kind]||0;
G.openRescue = (kind, base)=>{
  S._rescues=S._rescues||{};
  const n=S._rescues[kind]||0;
  S._rescues[kind]=n+1;
  const tiers={nofuel:['crisis_nofuel','crisis_nofuel2','crisis_nofuel3'],
    breakdown:['crisis_breakdown','crisis_breakdown2','crisis_breakdown2'],
    collapse:['crisis_collapse','crisis_collapse2','crisis_collapse2']};
  const ladder=tiers[kind]||[base];
  G.openEventById(ladder[Math.min(n,ladder.length-1)]||base);
};

/* ── events ── */
G.eligible = (typeFilter)=>{
  const region = G.regionOf(); const night = G.isNight(); const remain=G.remainKm();
  return D.events.filter(ev=>{
    if(ev.w<=0||ev.fixed||ev.locEvent) return false;
    if(typeFilter && ev.type!==typeFilter) return false;
    if(ev.once && S.used.includes(ev.id)) return false;
    if(ev.region && !ev.region.includes(region)) return false;
    if(ev.maxRemain!==undefined && remain>ev.maxRemain) return false;
    if(ev.minRemain!==undefined && remain<ev.minRemain) return false;
    if(ev.nearNode){ const ctx = S.driving? [S.driving.from,S.driving.to] : [S.at];
      if(!ev.nearNode.some(n=>ctx.includes(n))) return false; }
    if(ev.recruitStart && (S.recruitQ||G.hasComp(ev.recruitStart))) return false;
    if(ev.needFlagMin && (S.flags[ev.needFlagMin[0]]||0) < ev.needFlagMin[1]) return false;
    if(ev.needsNpc && !(S.npcs&&S.npcs[ev.needsNpc]&&S.npcs[ev.needsNpc].met)) return false;
    if(ev.night && !night) return false;
    if(ev.needsComp && !G.hasComp(ev.needsComp)) return false;
    if(ev.needBond && ((S.comps[ev.needBond[0]]||{}).bond||0) < ev.needBond[1]) return false;
    if(ev.needsComp2 && !G.hasComp(ev.needsComp2)) return false;  // 2인 케미 이벤트
    if(ev.noComp && G.hasComp(ev.noComp)) return false;   // 미영입 동료 소문용
    if(ev.noFlag && S.flags[ev.noFlag]) return false;   // 해당 서사 이미 봤으면 스킵
    if(ev.noPool) return false;   // 랜덤 풀 제외 — chain/직접 호출 전용
    if(ev.needUp && !(S.up&&S.up[ev.needUp])) return false; // 업그레이드 연계 이벤트
    if(ev.scrapMin!==undefined && S.scrap<ev.scrapMin) return false;  // 쓸 고철이 있어야 의미 있는 제안
    if(ev.needsDog && !S.dog) return false;
    if(ev.minParty && S.party.length<ev.minParty) return false;
    if(ev.minPursuit && S.pursuit<ev.minPursuit) return false;
    if(ev.maxVanPct!==undefined && S.van/Math.max(1,S.vanMax)*100>ev.maxVanPct) return false;
    if(ev.maxScrap!==undefined && S.scrap>ev.maxScrap) return false;
    if(ev.needsInjury && !Object.keys(S.injuries||{}).length) return false;
    if(ev.needsDriverInjury && !G.isInjured('driver')) return false;
    if(ev.maxPartyMood!==undefined){
      const moods=S.party.map(id=>(S.comps[id]||{}).mood||0);
      if(!moods.length||Math.min(...moods)>ev.maxPartyMood) return false;
    }
    if(ev.needFlag && !S.flags[ev.needFlag]) return false;
    if(ev.needFlag2 && !S.flags[ev.needFlag2]) return false;
    if(ev.needKnowledge && G.knowledgeLevel(ev.needKnowledge[0])<ev.needKnowledge[1]) return false;
    if(ev.noKnowledge && G.knowledgeLevel(ev.noKnowledge[0])>=ev.noKnowledge[1]) return false;
    if(ev.needWx && S.wx!==ev.needWx) return false;
    if(ev.needRain && !G.isWet()) return false;
    if(ev.needLowWater && S.water>2) return false;
    if(ev.hiddenTarget && !G.unknownHidden().length) return false;
    if(ev.id==='comp_sick' && !S.flags.food_poison) return false;
    return true;
  });
};
G.unknownHidden = ()=> Object.keys(D.nodes).filter(id=>D.nodes[id].type==='hidden' && !D.nodes[id].secret && !S.known.includes(id));

