/* ═══ ENGINE 5/5 — 노드 행동·성장·경제·의뢰·서울/최종막·엔딩 ═══ */
/* ── node actions ── */
G.exploreStatus = ()=>{
  const tries=S._exploreDay===S.day&&S._exploreNodes
    ?(S._exploreNodes[S.at]||0):0;
  const repeat=tries===1;
  const fresh=!(S._salvagedNodes&&S._salvagedNodes[S.at]);
  const mins=repeat?240:120;
  /* 첫 탐색은 시간 피로(약 +5)만 적용한다. 이미 훑은 곳을 다시 뒤질 때만
     잔해를 들추는 노동 피로를 별도로 더해 정상 탐험보다 파밍을 비싸게 만든다. */
  const fatigue=repeat?4:0;
  if(tries>=2) return {ok:false,tries,mins:0,fatigue:0,reason:'오늘은 이 주변을 충분히 뒤졌다 — 야영 후 다시 살필 수 있다'};
  /* 밤에만 성립하는 지역 장면(별자리·등불·반딧불)은 그 장소에서 실제로
     기다렸을 때 볼 수 있어야 한다. 아무 현장 사건도 없을 때만 야간 수색을 막는다. */
  if(G.isNight()&&!(G.nodeEvents&&G.nodeEvents(S.at).length))
    return {ok:false,tries,mins,fatigue,reason:'해가 진 뒤에는 주변을 탐색할 수 없다'};
  if(S.fatigue>=80) return {ok:false,tries,mins,fatigue,reason:'피로 80% 이상 — 먼저 쉬어야 한다'};
  return {ok:true,tries,repeat,fresh,mins,fatigue,miss:repeat?0.45:0.15};
};
G.explore = ()=>{
  if(S.driving||UI.modalOpen()) return false;
  const status=G.exploreStatus();
  if(!status.ok){ UI.toast(`🔦 ${status.reason}`); UI.renderAll(); return false; }
  if(S._exploreDay!==S.day){ S._exploreDay=S.day; S._exploreNodes={}; }
  S._exploreNodes[S.at]=status.tries+1;
  let freshHaul='';
  if(status.fresh){
    S._salvagedNodes[S.at]=true; S._salvageCount++;
    /* 남쪽은 이미 백사십삼 년 동안 훑였고, 북쪽은 위험한 만큼 남아 있다.
       (2026-08-06: 일괄 +4는 런당 고철 수입 12 — 608짜리 카탈로그의 2%였다.
        슬롯·중량이 코드로만 존재하고 아무도 도달하지 못하던 원인.) */
    const region=G.regionOf();
    const haul=region==='north'?12:region==='mid'?9:6;
    S.scrap+=haul; freshHaul=` · 고철 +${haul}`;
    /* 초반 두 지역은 좌석 증축을 막지 않도록 표준 체결 부품을 보장한다.
       이후에는 세 지역마다 한 번이라 무한 파밍보다 새 길을 택하는 편이 낫다. */
    if(S._salvageCount<=2||S._salvageCount%2===0){
      S.items['부품']=(S.items['부품']||0)+1;
      freshHaul+=' · 부품 +1';
    }
  }
  G.advance(status.mins);
  S.fatigue=clamp(S.fatigue+status.fatigue,0,100);
  const localPool=G.nodeEvents?G.nodeEvents(S.at):[];
  const pool = G.eligible('탐색');
  if(status.repeat){
    /* 다시 뒤지는 것도 완전히 헛되지는 않다 — 대신 처음만 못하다 */
    const again=2+Math.floor(rng()*3);
    S.scrap+=again; freshHaul+=` · 재수색 고철 +${again}`;
  }
  /* 장소 계약 사건은 이곳까지 와서 시간을 쓴 결과다. 도로 사건 쿨다운이나
     탐색 실패 주사위로 다시 묻지 않고, 현재 장소 후보 안에서만 고른다. */
  if(localPool.length){
    const total=localPool.reduce((sum,event)=>sum+Math.max(1,event.w||1),0);
    let roll=rng()*total, selected=localPool[0];
    for(const event of localPool){ roll-=Math.max(1,event.w||1); if(roll<=0){ selected=event; break; } }
    G.openEvent(selected); G.save(); return true;
  }
  if(!pool.length || rng()<status.miss){
    const spent=status.repeat?'네 시간을 더 샅샅이 뒤졌지만':'두 시간을 돌아봤지만';
    UI.toast(`🔦 ${spent} 큰 수확은 없었다${freshHaul}`);
    UI.renderAll(); G.save(); return true;
  }
  G.fireDriveEvent2(pool);
  G.save();
  return true;
};
G.fireDriveEvent2 = (pool)=>{
  /* 도로는 사건 목록이 아니라 실제 이동 공간이다. 초반에는 시스템을 익힐
     여백을 더 주고, 이후에도 하루 두 번을 넘는 강제 사건은 보류한다. */
  if(S._roadEventDay!==S.day){
    S._roadEventDay=S.day;
    S._roadEventCount=0;
  }
  const earlyJourney=(S.stats&&S.stats.km<35)||(S.stats&&S.stats.events<4);
  const dailyCap=earlyJourney?1:3;
  const minGapKm=earlyJourney?26:14;
  const km=Number(S.stats&&S.stats.km)||0;
  if((Number(S._roadEventCount)||0)>=dailyCap||km-(Number(S._lastRoadEventKm)||-999)<minGapKm) return;
  /* 큐에 든 이야기는 직전 모달을 닫자마자 재생하지 않고, 다음 정상적인
     도로 사건 기회에 대신 사용한다. 플레이어가 그 사이 실제로 운전한다. */
  pool=G.directEventPool(pool); if(!pool.length) return;
  const queued=G.popStory();
  const markRoadEvent=()=>{
    S._roadEventCount=(Number(S._roadEventCount)||0)+1;
    S._lastRoadEventKm=km;
  };
  if(queued){ markRoadEvent(); G.openEventById(queued); return; }
  const weight=e=>e.w*(G.eventIsContextual(e)?2.1:1)*G.directorWeight(e);
  const total=pool.reduce((s,e)=>s+weight(e),0); let r=rng()*total;
  let evd=pool[0]; for(const e of pool){ r-=weight(e); if(r<=0){evd=e;break} }
  markRoadEvent(); G.openEvent(evd);
};
/* 야영은 즉시 시간 넘김이 아니라, 차를 "집"처럼 쓰는 짧은 준비 단계도 가진다.
   _campPlan은 기존 저장 파일에도 자연스럽게 붙고, 다음 취침 후 반드시 비운다. */
G.prepareCamp = (kind,cid)=>{
  const plan=S._campPlan||(S._campPlan={});
  if(kind==='meal'){
    if(plan.meal) return {ok:false,why:'오늘의 한 끼는 이미 준비했다'};
    if(S.food<1||S.water<1) return {ok:false,why:'따뜻한 저녁에는 식량 1과 물 1이 필요하다'};
    const hungerBefore=S.hunger||0, fatigueBefore=S.fatigue;
    S.food--; S.water--; plan.meal=true;
    S.hunger=Math.max(0,hungerBefore-1);
    S.fatigue=Math.max(0,S.fatigue-6);
    G.moodAll(3);
    const hunger=S.hunger<hungerBefore?(S.hunger===0?' · 허기 해소':` · 허기 ${hungerBefore}→${S.hunger}`):'';
    UI.toast(`🍲 따뜻한 저녁 · 식량 -1 · 물 -1 · 사기 +3 · 피로 -${fatigueBefore-S.fatigue}${hunger}`);
  } else if(kind==='repair'){
    if(plan.repair) return {ok:false,why:'오늘 밤의 간이 정비는 이미 끝냈다'};
    if((S.items['부품']||0)<1) return {ok:false,why:'간이 정비에는 부품 1이 필요하다'};
    if(S.van>=S.vanMax) return {ok:false,why:'차체는 지금 더 손볼 곳이 없다'};
    S.items['부품']--; plan.repair=true;
    UI.toast('🔧 공구를 꺼내 차체를 살폈다 — 취침 시 내구 +8');
  } else if(kind==='talk'){
    if(plan.talk) return {ok:false,why:'오늘 밤엔 이미 한 사람과 오래 이야기했다'};
    if(!cid||!S.party.includes(cid)) return {ok:false,why:'지금 함께 야영 중인 동료를 골라야 한다'};
    plan.talk=cid;
    UI.toast(`🕯 ${D.comps[cid].name}와 불빛 아래 이야기를 나누기로 했다`);
  } else return {ok:false,why:'알 수 없는 야영 준비다'};
  G.save();
  return {ok:true};
};
G.camp = (msg)=>{
  if(S.driving||UI.modalOpen()) return;
  const inTown = !!(S.at && D.nodes[S.at] && D.nodes[S.at].stl);
  /* 정착지 숙박: 첫 밤은 손님 대접, 그 뒤로는 품앗이 삯이 든다.
     공짜 안전+보급이 노숙을 절대 열위로 만드는 걸 막는 밸런스 축 —
     "안전을 사거나(정착지), 준비로 벌거나(노숙 경계)". */
  let townStingy=false, townShunned=false;
  /* 관측 문턱을 넘긴 차량은 마을이 받아 주지 않는다 — 관측이 처음으로 값을 갖는 자리 */
  const shun=G.pursuitRefusesShelter();
  if(inTown && shun && shun.refused){
    townShunned=true;
    S._shelterRefusals=(S._shelterRefusals||0)+1;
    G.moodAll(-4);
    UI.toast('🚫 마을이 문을 닫았다 — 표시된 차량은 재우지 않는다');
  }
  else if(inTown){
    S._stlNights=S._stlNights||{};
    const nights=S._stlNights[S.at]||0;
    S._stlNights[S.at]=nights+1;
    /* 손님 대접(첫 밤)과 품앗이 삯을 낸 밤은 같은 보급을 받는다.
       삯도 없이 또 신세 지는 밤은 우물물 한 통뿐 — 인원이 몇이든 한 통이라
       파티가 클수록 더 아프다. (인원수 배급보다 반드시 적어야 한다.) */
    const townSupply=Math.min(6,G.partySize())+1;
    if(nights===0 || S.scrap>=2){
      if(nights>0) S.scrap-=2;
      S.water+=townSupply;
      S.food+=1;
    } else {
      townStingy=true;
      S.water+=1;
    }
  }
  // advance to next 06:30
  const target = 6.5*60;
  let mins = (24*60 - S.min + target); if(S.min < target) mins = target - S.min;
  /* 수면 자체의 시간은 피로를 쌓지 않는다. 먼저 휴식한 뒤 06:30 배급에서
     생긴 결식 피로만 기상 상태에 남긴다. */
  S.fatigue=0;
  G.advance(mins,{sleeping:true});
  S.min = Math.round(S.min);   // 기상 시각은 정확히 06:30이어야 한다
  let mood=6, vanFix=4;
  if(G.hasPerk('pss_night')) mood+=3;
  if(G.hasPerk('leo_fire')) mood+=4;
  if(G.hasPerk('mj_camp')) vanFix+=8;
  if(S.up&&S.up.solar) vanFix+=3;
  if(S.up&&S.up.awning) mood+=2;
  if(S.up&&S.up.stove) mood+= G.isWet()?3:2;
  const campPlan=S._campPlan||{};
  if(campPlan.repair) vanFix+=8;
  G.moodAll(mood); S.van = clamp(S.van+vanFix,0,S.vanMax);
  if(G.hasPerk('jy_break')){ S.scrap+=2; }
  if(G.isWet()){ S.water+=2; UI.toast('💧 빗물받이 가득 — 물 +2'); }
  if(G.hasPerk('es_tap')&&rng()<0.25){ const h=G.nearestHidden();
    if(h){ S.known.push(h); UI.toast(`<span class="ic">📡</span>은수의 도청 — ${D.nodes[h].name}`, 'discover'); } }
  /* 모닥불 대화는 전원의 시간이다 — 한 명만 깊어지면 4인 Lv3(관계 기둥)가
     산술적으로 시한 안에 안 들어간다(2026-08-07 완주봇 실측: 관계가 최장 병목). */
  for(const cid of S.party) G.bond(cid,1);
  if(campPlan.talk&&S.party.includes(campPlan.talk)) G.bond(campPlan.talk,2);
  S._campPlan={};
  if(townStingy) G.moodAll(-2);
  const nightsHere=inTown?((S._stlNights&&S._stlNights[S.at])||1):0;
  UI.toast(msg|| (townShunned?'🚫 마을 밖 갓길에서 밤을 났다 — 관측된 차량은 받아 주지 않는다'
    :inTown?
    (nightsHere<=1?'🏘 마을 한켠에서 물과 묽은 죽을 얻어 하루를 묵었다'
      :townStingy?'🏘 삯 없이 또 신세를 졌다 — 우물물만 얻었다'
      :'🏘 품앗이 삯(고철 2)을 내고 하루를 묵었다')
    :'🔥 야영으로 하루를 마쳤다'));
  /* 노숙 리스크 — 마을 밖(또는 마을이 문을 닫은 밤)에 잘 때. 동료 경계 당번이 위험을 깎는다 */
  if(!inTown || townShunned){
    let risk = G.regionOf()==='north'? 0.45:0.33;
    if(S.dog) risk-=0.10;
    if(G.hasPerk('kw_guard')) risk-=0.10;
    if(S.party.length){ risk-=0.05*Math.min(2,S.party.length);
      if(rng()<0.35) UI.toast('🕯 경계 당번을 세웠다 — 밤이 한결 덜 위험하다'); }
    if(S.up&&S.up.curtain) risk-=0.07;
    const campStoryReady=!Number.isFinite(S._lastCampEventDay)||S.day-S._lastCampEventDay>=2;
    if(campStoryReady&&rng()<Math.max(0.08,risk)){
      const north = G.regionOf()==='north';
      /* 밤은 접선의 시간이기도 하다 — 기둥이 비어 있으면 35%로 그 사건이 모닥불을 찾아온다.
         주행 뽑기가 하루 0.7회뿐이라(2026-08-07 실측) 밤 채널이 없으면 기둥이 운에 갇힌다. */
      const pillarPool=G.eligible().filter(e=>e.pillar&&G.pillarUnmet(e.pillar));
      if(pillarPool.length&&rng()<0.18){
        const pv=pillarPool[Math.floor(rng()*pillarPool.length)];
        S._lastCampEventDay=S.day;
        G.deferEvent(pv.id);
        setTimeout(()=>G.openEventById(pv.id), 600);
        UI.renderAll(); G.save(); return;
      }
      const r=rng();
      const ev = north? (r<0.45?'camp_scan': r<0.7?'camp_thief': r<0.87?'camp_dogs':'camp_visitor')
                      : (r<0.32?'camp_thief': r<0.6?'camp_dogs':'camp_visitor');
      S._lastCampEventDay=S.day;
      G.deferEvent(ev);
      setTimeout(()=>G.openEventById(ev), 600);
      UI.renderAll(); G.save(); return;
    }
  }
  if(!G.maybeCrisis() && S.party.length && rng()<0.25){
    const pool = G.eligible('동행'); if(pool.length) setTimeout(()=>G.fireDriveEvent2(pool), 500);
  }
  UI.renderAll(); G.save();
};

/* ── banter ── */
let lastBanter = [];
let lastChat=-1;
G.pickChat = ()=>{
  if(!D.chats) return null;
  S._crewChatSeen=S._crewChatSeen||{};
  const night=G.isNight(), region=G.regionOf();
  const pool=D.chats.filter((c,i)=>{
    if(i===lastChat) return false;
    if(c.once&&c.id&&S._crewChatSeen[c.id]) return false;
    const nd=c.need||{};
    if(nd.comp && !G.hasComp(nd.comp)) return false;
    if(nd.comp2 && !G.hasComp(nd.comp2)) return false;
    if(nd.comps && !nd.comps.every(id=>G.hasComp(id))) return false;
    if(nd.party && S.party.length<nd.party) return false;
    if(nd.dog===1 && !S.dog) return false;
    if(nd.night===1 && !night) return false;
    if(nd.rain===1 && !G.isWet()) return false;
    if(nd.region && region!==nd.region) return false;
    if(nd.flag && !S.flags[nd.flag]) return false;
    if(nd.noFlag && S.flags[nd.noFlag]) return false;
    if(nd.lowFuel===1 && S.fuel>12) return false;
    if(nd.tired===1 && S.fatigue<55) return false;
    if(nd.afterKm && S.stats.km<nd.afterKm) return false;
    if(nd.minBond && Object.entries(nd.minBond).some(([id,bond])=>!G.hasComp(id)||Number(S.comps[id]&&S.comps[id].bond||0)<bond)) return false;
    if(nd.knowledge && G.knowledgeLevel(nd.knowledge[0])<nd.knowledge[1]) return false;
    /* 등장 화자 전원이 실제 탑승 중이어야 함 (동료만 검사, 나/sys 제외) */
    for(const ln of c.lines){ const w=ln[0];
      if(w!=='나'&&w!=='sys'&&D.comps[w]&&!G.hasComp(w)) return false; }
    return true; });
  if(!pool.length) return null;
  const storyPool=pool.filter(c=>c.arc&&c.once);
  const source=storyPool.length?storyPool:pool;
  const c=source[Math.floor(rng()*source.length)];
  lastChat=D.chats.indexOf(c);
  if(c.once&&c.id) S._crewChatSeen[c.id]={day:S.day,km:Math.round(S.stats.km)};
  G.rememberCrewChat(c);
  return c;
};
G.pickBanter = ()=>{
  const night = G.isNight(), rain = G.isWet(), region = G.regionOf();
  const pool = D.banter.filter(b=>{
    const nd = b.need||{};
    if(b.who!=='나'&&b.who!=='sys'&&D.comps[b.who]&&!G.hasComp(b.who)) return false;
    if(nd.party && S.party.length<nd.party) return false;
    if(nd.comp && !G.hasComp(nd.comp)) return false;
    if(nd.comp2 && !G.hasComp(nd.comp2)) return false;
    if(nd.night===1 && !night) return false; if(nd.night===0 && night) return false;
    if(nd.rain===1 && !rain) return false;
    if(nd.wx && S.wx!==nd.wx) return false;
    if(nd.up && !(S.up&&S.up[nd.up])) return false;
    if(nd.tired && S.fatigue<55) return false;
    if(nd.dog===1 && !S.dog) return false;
    if(nd.lowFuel===1 && S.fuel>12) return false;
    if(nd.region && region!==nd.region) return false;
    if(nd.flag && !S.flags[nd.flag]) return false;
    /* 진행이 끝난 뒤에는 "아직 못 했다"는 줄이 다시 뜨면 안 된다 */
    if(nd.noFlag && S.flags[nd.noFlag]) return false;
    if(nd.knowledge && G.knowledgeLevel(nd.knowledge[0])<nd.knowledge[1]) return false;
    if(lastBanter.includes(b.t)) return false;
    return true;
  });
  if(!pool.length) return null;
  const b = pick(pool);
  lastBanter.push(b.t); if(lastBanter.length>8) lastBanter.shift();
  return b;
};

/* ── 운전사(주인공) 레벨 ── */
G.driverLv = ()=>{ if(!S) return 0;
  let lv=0; D.driverLv.forEach((d,i)=>{ if(S.stats.km>=d.km) lv=i; }); return lv; };
G.driverTitle = ()=> D.driverLv[G.driverLv()].nm;
G.checkDriverLv = ()=>{
  const lv=G.driverLv();
  if(lv>S._dlv){ S._dlv=lv;
    UI.toast(`<span class="ic">🧑‍✈️</span>운전 숙련 상승 — 「${D.driverLv[lv].nm}」 (연비·피로 개선)`, 'discover');
    G.addNote({type:'사건', title:'운전 숙련: '+D.driverLv[lv].nm,
      body: lv>=4? `누적 주행 ${Math.round(S.stats.km)}km. 로드마스터 — 할아버지가 스스로를 그렇게 불렀다. 이제 그 이름이 내 것이 됐다.`
        : `누적 주행 ${Math.round(S.stats.km)}km. 핸들이 손에 붙는다.`,
      links: lv>=4? ['할아버지']:[]}); }
};

/* ── 현장 수리 ── */
G.fieldRepair = ()=>{
  if((S.items['부품']||0)<1 || S.van>=S.vanMax-2) return false;
  const box=S.up&&S.up.sidebox;
  const saved = box && rng()<0.5;
  if(!saved) S.items['부품']--;
  S.van=clamp(S.van+(box?45:35),0,S.vanMax);
  G.advance(100);
  UI.toast('🔧 부품으로 정비 완료 — 내구 +'+(box?45:35)+(saved?' · 🧰 부품 아낌':''));
  UI.renderAll(); G.save(); return true;
};

/* ── 차 업그레이드 ── */
G.seatCapacity = ()=> Math.min(D.maxParty,(D.baseParty||2)+D.upgrades.reduce((n,u)=>n+(u.seat&&S&&S.up&&S.up[u.id]?u.seat:0),0));
G.maxParty = ()=> Math.max(G.seatCapacity(),S&&S.party?S.party.length:0); // 구버전 과승 세이브는 동료를 내리지 않는다
G.vanStage = ()=>{
  const stages=D.vanStages||[];
  let stage=stages[0]||{id:'base',lv:0,nm:'기본 생활칸',bodyL:62,bodyH:25,cm:0,build:''};
  for(const x of stages){ if(!x.up||(S&&S.up&&S.up[x.up])) stage=x; }
  return stage;
};
G.nextSeatUpgrade = ()=> D.upgrades.find(u=>u.seat&&!(S&&S.up&&S.up[u.id]));
G.upDef = (id)=> D.upgrades.find(u=>u.id===id);
/* 차고 작업 소요 시간. 값을 UI가 미리 보여줘야 '지금 달까, 다음 마을에서 달까'가 선택이 된다. */
G.upgradeMinutes = (u)=> Math.round((u&&u.seat?300:200)*(G.hasComp('minji')&&!G.isInjured('minji')?0.75:1));
/* ── 탑재 중량·슬롯: 싣는 것에는 자리와 무게라는 값이 있다 ── */
G.upWeight = ()=> (D.upgrades||[]).reduce((w,u)=>w+((S&&S.up&&S.up[u.id])?(u.w||0):0),0);
/* 8pt까지는 공짜, 그 위로는 1pt당 연비 +1.2% (최대 +12%) */
G.weightFuelFactor = ()=>{ const w=G.upWeight(); return 1+Math.min(0.12,Math.max(0,w-8)*0.012); };
/* 10pt를 넘는 무게는 험로에서 차체를 더 갉아먹는다 (최대 +20%) */
G.weightWearFactor = ()=>{ const w=G.upWeight(); return 1+Math.min(0.2,Math.max(0,w-10)*0.02); };
G.slotUsage = slot=> (D.upgrades||[]).filter(u=>u.slot===slot&&S&&S.up&&S.up[u.id]);
/* 길 위 작업대는 웃돈을 받는다. 정착지 밖에서도 고철을 쓸 곳이 있어야
   마지막 정착지 뒤에 번 것이 죽지 않는다(실측: 도착 시 평균 85 고철 사장). */
G.ROAD_GARAGE_MUL = 1.5;
G.upScrapCost = (u)=> Math.ceil(u.cost.scrap * (S&&S.roadGarage ? G.ROAD_GARAGE_MUL : 1));
G.canBuyUp = (id)=>{
  const u=G.upDef(id); if(!u||S.up[id]) return {ok:false, why:'장착됨'};
  if(u.needs&&!S.up[u.needs]) return {ok:false, why:G.upDef(u.needs).nm+' 필요'};
  if(u.slot&&D.upSlots&&D.upSlots[u.slot]){
    const rule=D.upSlots[u.slot], used=G.slotUsage(u.slot);
    if(used.length>=rule.cap)
      return {ok:false, why:`${rule.nm} 자리 없음 — ${used.map(x=>x.nm).join(' · ')} 장착 중`};
  }
  if(S.scrap<G.upScrapCost(u)) return {ok:false, why:'고철 부족'};
  if((u.cost.parts||0)>(S.items['부품']||0)) return {ok:false, why:'부품 부족'};
  return {ok:true};
};
G.buyUpgrade = (id)=>{
  const chk=G.canBuyUp(id); if(!chk.ok) return false;
  const u=G.upDef(id);
  S.scrap-=G.upScrapCost(u);
  if(u.cost.parts) S.items['부품']-=u.cost.parts;
  S.up[id]=true;
  /* 차고 작업은 분해·체결·확인 세 단계다(D.upgradeWork). 그 서사만큼 시간도 든다 —
     증축은 반나절, 나머지는 서너 시간. 정비 전문가가 타고 있으면 손이 빠르다. */
  G.advance(G.upgradeMinutes(u));
  if(S.ended) return true;   // 차고 작업 중 여정이 끝날 수 있다
  G.qualityUpgrade(id);
  if(id==='tank1'||id==='tank2'){ S.fuelMax+=25; }
  if(id==='armor'){ S.vanMax+=25; S.van+=25; }
  const stage=u.seat?G.vanStage():null;
  const group=(D.upgradeGroups||[]).find(x=>x.ids.includes(id));
  const adviser=group&&D.upgradeAdvisers&&D.upgradeAdvisers[group.id];
  if(adviser&&G.hasComp(adviser.id)&&!G.isInjured(adviser.id)) G.bond(adviser.id,1);
  UI.toast(`${u.ic} ${u.nm} 장착 완료${u.seat?` — ${stage.nm} · 동료 자리 ${G.maxParty()}명`:''}`);
  G.addNote({type:'사건', title:'달구지 개조: '+u.nm,
    body:(stage?stage.build:u.d)+` — 달구지가 조금 더 우리 집이 됐다.${adviser&&G.hasComp(adviser.id)?` ${D.comps[adviser.id].name}가 자기 전문으로 작업을 거들었다.`:''}`, links:[]});
  G.save(); return true;
};

/* ── 정착지 경제: 거래·수리 규칙은 엔진 소관, UI는 호출과 표시만 한다.
   (엔진 테스트와 시뮬레이터가 실제 규칙과 같은 코드를 보게 하기 위함) ── */
/* 지역 시세 계수 — key('fuel'/'water'/'food'/'item부품'…)를 마을 사정으로 환산 */
G.marketMul = (stlId,key)=>{
  const m=D.market&&D.market[stlId]&&D.market[stlId].mul; if(!m) return 1;
  const name=key&&key.startsWith&&key.startsWith('item')?key.slice(4):key;
  return m[name]||1;
};
/* 이 마을이 웃돈 주고 사는 것 — 싣고 온 물건을 판다 */
G.stlDemand = (stlId)=> (D.market&&D.market[stlId]&&D.market[stlId].demand)||null;
G.sellToDemand = (stlId)=>{
  const d=G.stlDemand(stlId); if(!d) return {ok:false, why:'매입 없음'};
  if(d.item==='식량'){
    if(S.food<2) return {ok:false, why:'팔 식량이 없다 (이틀치는 남겨야)'};
    S.food--; S.scrap+=d.price;
  } else {
    if((S.items[d.item]||0)<1) return {ok:false, why:'팔 '+d.item+'이 없다'};
    S.items[d.item]--; S.scrap+=d.price;
  }
  S._soldDemand=S._soldDemand||{}; S._soldDemand[stlId]=(S._soldDemand[stlId]||0)+1;
  G.advance(20);
  if(S.ended) return {ok:true, ended:true, price:d.price};
  G.save(); return {ok:true, price:d.price};
};
G.tradeDiscount = (stlId)=>{
  const crewDisc=G.hasPerk('leo_vip')?0.8:G.hasComp('leo')?0.9:1;
  return Math.max(.65, crewDisc*G.stlImpact(stlId).discount);
};
G.trade = (stlId, i)=>{
  const stl=D.stls[stlId]; if(!stl||!stl.trade||!stl.trade[i]) return {ok:false, why:'거래 없음'};
  const [,key,qty,price0]=stl.trade[i];
  const localTrusted=G.stlImpact(stlId).discount<1;
  if(key==='barter_wf'){ const cost=localTrusted?1:2;
    if(S.water<cost) return {ok:false, why:'물이 부족하다'};
    S.water-=cost; S.food+=1; }
  else if(key==='barter_fp'){ const cost=localTrusted?1:2;
    if(S.food<cost) return {ok:false, why:'식량이 부족하다'};
    S.food-=cost; S.items['부품']=(S.items['부품']||0)+1; }
  else if(key==='barter_mf'){
    if((S.items['의약품']||0)<1) return {ok:false, why:'의약품이 없다'};
    S.items['의약품']--; S.food+=localTrusted?4:3; }
  else {
    const price=Math.max(1,Math.round(price0*G.marketMul(stlId,key)*G.tradeDiscount(stlId)));
    if(S.scrap<price) return {ok:false, why:'고철 부족'};
    S.scrap-=price;
    if(key==='fuel') S.fuel=clamp(S.fuel+qty,0,S.fuelMax);
    else if(key==='water') S.water+=qty;
    else if(key==='food') S.food+=qty;
    else if(key.startsWith('item')){ const nm=key.slice(4); S.items[nm]=(S.items[nm]||0)+qty; }
  }
  G.advance(25);   // 흥정도 시간이다
  if(S.ended) return {ok:true, ended:true};
  G.save(); return {ok:true};
};
G.tradeBundle = (stlId)=>{
  const stl=D.stls[stlId]; if(!stl||!stl.trade) return {ok:false, why:'거래 없음'};
  const w=stl.trade.find(row=>row[1]==='water');
  const f=stl.trade.find(row=>row[1]==='food');
  if(!w||!f) return {ok:false, why:'묶음 없음'};
  const price=Math.max(1,Math.round((w[3]*G.marketMul(stlId,'water')+f[3]*2*G.marketMul(stlId,'food'))*G.tradeDiscount(stlId)));
  if(S.scrap<price) return {ok:false, why:'고철 부족'};
  S.scrap-=price; S.water+=w[2]; S.food+=f[2]*2;
  G.advance(40);   // 물통과 자루를 싣는 데 걸리는 시간
  if(S.ended) return {ok:true, ended:true, water:w[2], food:f[2]*2, price};
  G.save(); return {ok:true, water:w[2], food:f[2]*2, price};
};
/* 정비소 수리는 맡기고 기다리는 일이다 — 반나절이 사라진다.
   시간이 값이 되어야 "지금 고칠까, 다음 마을까지 버틸까"가 선택이 된다. */
G.settlementRepairQuote = ()=>({cost:G.hasComp('minji')?6:8, amount:30, mins:G.hasComp('minji')?120:180});
G.settlementRepair = ()=>{
  const quote=G.settlementRepairQuote();
  if(S.van>=S.vanMax-5) return {ok:false, why:'수리할 곳이 없다'};
  if(S.scrap<quote.cost) return {ok:false, why:'고철 부족'};
  S.scrap-=quote.cost; S.van=clamp(S.van+quote.amount,0,S.vanMax);
  G.advance(quote.mins);
  if(S.ended) return {ok:true, ended:true, ...quote};   // advance가 갈증 종료를 부를 수 있다
  G.save(); return {ok:true, ...quote};
};

/* ── 제작 (작업대) ── */
G.canCraft = (id)=>{
  const c=D.crafts.find(x=>x.id===id); if(!c) return {ok:false};
  if(c.need.scrap && S.scrap<c.need.scrap) return {ok:false, why:'고철 부족'};
  if(c.need.parts && (S.items['부품']||0)<c.need.parts) return {ok:false, why:'부품 부족'};
  if(c.need.fuel && S.fuel<c.need.fuel+3) return {ok:false, why:'연료 여유 없음'};
  return {ok:true};
};
G.craft = (id)=>{
  const c=D.crafts.find(x=>x.id===id);
  const chk=G.canCraft(id); if(!chk.ok) return false;
  const ar=S.up&&S.up.armory;
  if(c.need.scrap) S.scrap-=ar? Math.ceil(c.need.scrap*0.8):c.need.scrap;
  if(c.need.parts) S.items['부품']-=c.need.parts;
  if(c.need.fuel) S.fuel-=c.need.fuel;
  for(const nm in c.out) S.items[nm]=(S.items[nm]||0)+c.out[nm];
  G.advance(ar?20:40);
  UI.toast(`${c.ic} ${c.nm} 제작 완료`);
  G.save(); return true;
};

/* ── 1:1 대화 (동료 카드에서 '말을 건다') ── */
G.talkTo = (id)=>{
  if(S.driving || !G.hasComp(id)) return false;
  S._talked = S._talked||{};
  if(S._talked[id]===S.day){ UI.toast(`${D.comps[id].name}와는 오늘 충분히 이야기했다`); return false; }
  const pool = G.eligible('대화').filter(ev=>ev.needsComp===id);
  if(!pool.length){ UI.toast(`${D.comps[id].name}는 지금 자기 일에 빠져 있다`); return false; }
  S._talked[id]=S.day;
  G.openEvent(pick(pool));
  G.save(); return true;
};
/* 장거리에는 사건만큼 평범한 말도 남는다. 한 구간에 한 번만 허용해
   반복 클릭 보상 대신 "이번 길에서 누구와 시간을 보낼지"를 고르게 한다. */
G.roadCheckIn = (id)=>{
  if(!S.driving||!id||!S.party.includes(id)) return {ok:false,why:'지금 함께 달리는 동료를 골라야 한다'};
  if(S.driving.checkIn) return {ok:false,why:'이 구간에서는 이미 누군가와 이야기를 나눴다'};
  S.driving.checkIn=id;
  G.bond(id,1);
  if(S.comps[id]) S.comps[id].mood=clamp((S.comps[id].mood||0)+3,0,100);
  const routeId=S.routePlan&&S.routePlan.id;
  const moment=(D.routeCrewMoments||[]).find(row=>row.route===routeId&&row.crew.includes(id)&&row.crew.every(cid=>S.party.includes(cid)));
  if(moment){
    const other=moment.crew.find(cid=>cid!==id);
    S.driving.checkInMoment={id:moment.id,title:moment.title,text:moment.text,crew:moment.crew.slice()};
    if(other&&S.comps[other]) S.comps[other].mood=clamp((S.comps[other].mood||0)+2,0,100);
    UI.toast(`💬 ${moment.title} — ${D.comps[id].name}와 ${D.comps[other].name}`);
  }else UI.toast(`💬 ${D.comps[id].name}와 짧게 이야기를 나눴다 — 유대 +1 · 기분 +3`);
  G.save();
  return {ok:true,moment:moment||null};
};

/* ── 저항 연대망 ── */
G.cellsLinked = ()=> (D.resistance||[]).filter(c=>S.flags[c.flag]);

/* ── 서울 내부 (오르막 진행) ── */
G.seoulStopDone = (i)=> !!S.flags[`seoul_${D.seoulMap.stops[i].id}_done`] || (i===4 && !!S.flags.seoul_core_reached);
G.seoulStage = ()=>{ /* 다음에 진행할 정거장 인덱스 (0~5, 5=완주) */
  for(let i=0;i<D.seoulMap.stops.length;i++) if(!G.seoulStopDone(i)) return i;
  return D.seoulMap.stops.length;
};
G.seoulEnter = (i)=>{
  const ev = D.seoulStops.find(e=>e.seoulStop===i);
  if(ev) G.openEvent(ev);
};

/* ── 여정 장부 (서울 관문 조건) ── */
G.deedDone = (d)=>{
  if(!S) return false;
  if(d.comp) return G.hasComp(d.comp) && (S.comps[d.comp]||{}).lvl>=3;
  if(d.flag) return !!S.flags[d.flag];
  return false;
};
G.deedsDone = ()=> D.deeds.filter(G.deedDone);
G.traceCount = ()=> !S?0:(D.eraTraces||[]).filter(t=>S.flags[t.flag]).length;
G.traceNames = ()=> !S?[]:(D.eraTraces||[]).filter(t=>S.flags[t.flag]).map(t=>t.name);
G.fullCrewStories = ()=> !S?false:Object.keys(D.comps).every(id=>
  G.hasComp(id)&&(S.comps[id]||{}).lvl>=3);
/* 네 기둥 진척 — 관계는 선택한 네 사람으로 성립하고, 전원 완주는 선택 보상이다 */
G.pillars = ()=>{
  const done = G.deedsDone();
  const relationNeed = D.seoulPillars.관계;
  const storyDone = done.filter(d=>d.cat==='동료').length;
  /* 이름·위치를 먼저 밝히지 않고, 이미 함께하는 사람만 구체적으로 안내한다. */
  const miss = Object.keys(D.comps).find(c=>!G.hasComp(c));
  const shallow = Object.keys(D.comps).find(c=>G.hasComp(c)&&(S.comps[c]||{}).lvl<3);
  const truthFlags=['massacre_known','parent_key_found','es_truth','uplink_seen'];
  const truthN=truthFlags.filter(f=>S.flags[f]).length;
  const truthHint=!S.flags.massacre_known
    ? '길 위의 오래된 추방 기록에서 반복되는 방식 확인하기'
    : !S.flags.parent_key_found
    ? '달구지에 숨은 부모님의 검증키 찾기'
    : !S.flags.es_truth
    ? (G.hasComp('eunsu')?'은수가 끝내지 못한 관제 기록 함께 열기':'서울 관제실을 나온 사람의 증언 찾기')
    : !S.flags.uplink_seen
    ? '백도어 로그에서 남산보다 위로 가는 선 확인하기'
    : '첫 침묵·작성자·상행선의 관계 확인';
  /* 접선을 폭로 뒤에만 세면 세계 기둥이 이벤트 하나에 이중 잠금된다(2026-08-07 실측:
     50일 순회에도 0~1/3). 만난 거점은 만난 것이다 — 폭로는 그 의미를 밝힐 뿐. */
  const worldN=G.cellsLinked().length;
  return {
    관계: { have: storyDone, need: relationNeed,
            hint: miss? '길에서 사람들을 더 만나고, 같은 곳까지 갈 이유를 함께 찾는다'
              : shallow? `${D.comps[shallow].name}와 야영이나 정착지에서 이야기를 더 나눈다`
              : '함께 가는 사람들의 이야기를 끝까지 듣는다' },
    세계: { have: worldN, need: D.seoulPillars.세계,
            hint:S.flags.resist_revealed?'저항 거점들을 이어 서울까지 갈 길과 통신망을 확보한다':'중부 국도에서 이음망과 먼저 접선한다' },
    진실: { have: truthN, need: D.seoulPillars.진실,
            hint:truthHint },
    유산: { have: done.filter(d=>d.cat==='회수').length, need: D.seoulPillars.유산,
            hint:'부모님과 길 위 사람들이 남긴 편지와 물건을 챙긴다' },
  };
};
G.pillarUnmet = (name)=>{ try{ const p=G.pillars()[name]; return !!p && p.have<p.need; }catch(e){ return false; } };
G.seoulReady = ()=> Object.values(G.pillars()).every(x=>x.have>=x.need);
/* 관문에서 되돌릴 때 — 제일 모자란 기둥 하나 안내 */
G.seoulMissing = ()=>{
  const p=G.pillars();
  /* 부족분(need-have)이 큰 기둥부터 */
  const lacking = Object.entries(p).filter(([k,x])=>x.have<x.need)
    .sort((a,b)=>(b[1].need-b[1].have)-(a[1].need-a[1].have));
  if(lacking.length){ const [k,x]=lacking[0]; return {pillar:k, have:x.have, need:x.need, hint:x.hint}; }
  /* 기둥은 다 찼는데 총 과업이 모자란 경우 */
  const undone=D.deeds.filter(d=>!G.deedDone(d));
  const near=undone.find(d=>d.comp&&G.hasComp(d.comp))||undone.find(d=>!d.comp)||undone[0];
  const need=Object.values(p).reduce((n,x)=>n+x.need,0);
  return {pillar:'여정', have:G.deedsDone().length, need, hint: near?near.hint:'조금 더'};
};

/* ── 라디오 수리 (진공관 1 소모, 1회) ── */
G.fixRadio = ()=>{
  if(S.flags.radio_fixed || !(S.items['라디오 진공관']>0)) return false;
  S.items['라디오 진공관']--;
  S.flags.radio_fixed=true;
  G.advance(40);
  G.addNote({type:'사건', title:'라디오 소생',
    body:'진공관을 갈아 끼우자 죽어 있던 라디오가 지직— 하고 숨을 쉬었다. 그날 밤 남산의 신호 이후 처음이다. 이제 길 위의 목소리들이 들린다.', links:['달구지']});
  UI.toast('📻 라디오가 살아났다 — 주행 중 방송이 잡힌다');
  G.save(); return true;
};
G.pickRadio = ()=>{
  const night=G.isNight(), region=G.regionOf();
  const pool=D.radioTexts.filter(r=>{
    if(r.night===1&&!night) return false;
    if(r.flag&&!S.flags[r.flag]) return false;
    if(r.noFlag&&S.flags[r.noFlag]) return false;
    if(r.region&&r.region!==region) return false;
    if(lastRadio===r.key) return false;
    return true; });
  if(!pool.length) return null;
  const total=pool.reduce((s,r)=>s+(r.w||1),0);
  let x=rng()*total;
  for(const r of pool){ x-=(r.w||1); if(x<=0){ lastRadio=r.key; return r; } }
  return pool[0];
};
let lastRadio=null;

/* ── 연속 지역 이야기 ── */
G.ensureStoryQuestState = ()=>{
  if(!S.storyQuests||typeof S.storyQuests!=='object') S.storyQuests={};
  if(!Array.isArray(S.storyQuests.completed)) S.storyQuests.completed=[];
  if(!S.storyQuests.active||typeof S.storyQuests.active!=='object') S.storyQuests.active=null;
  return S.storyQuests;
};
G.storyQuestDef = id=>(D.storyQuestChains||[]).find(chain=>chain.id===id);
G.storyQuestTarget = excluded=>{
  const blocked=new Set(excluded||[]);
  const candidates=Object.keys(D.nodes).filter(id=>D.nodes[id].stl&&!blocked.has(id));
  return candidates.length?pick(candidates):null;
};
G.makeStoryQuest = (def,stage,from,to,origin,visited=[])=>{
  const step=def&&def.steps&&def.steps[stage-1];
  if(!step||!from||!to) return null;
  return {
    kind:step.kind||'deliver', item:step.item, from, to,
    reward:12+stage*4, due:S.day+99, noExpiry:true,
    ledgerId:`story_${def.id}_${stage}`,
    story:{id:def.id,title:def.title,stage,total:def.steps.length,origin:origin||from,
      visited:[...new Set([...(visited||[]),from,to])],prompt:step.prompt,completion:def.completion}
  };
};
G.storyQuestOffer = (from,tos)=>{
  const state=G.ensureStoryQuestState();
  if(S.questFollowup) return S.questFollowup.from===from?S.questFollowup:null;
  if(state.active) return null;
  const def=(D.storyQuestChains||[]).find(chain=>!state.completed.includes(chain.id));
  if(!def) return null;
  const to=pick((tos||[]).filter(id=>id!==from));
  return G.makeStoryQuest(def,1,from,to,from,[from]);
};
G.nextStoryQuest = q=>{
  if(!q||!q.story) return null;
  const def=G.storyQuestDef(q.story.id), stage=q.story.stage+1;
  if(!def||stage>q.story.total) return null;
  const from=q.to;
  const to=stage===q.story.total
    ? q.story.origin
    : (G.storyQuestTarget([...(q.story.visited||[]),from,q.story.origin])||q.story.origin);
  return G.makeStoryQuest(def,stage,from,to,q.story.origin,q.story.visited);
};
G.completeStoryQuestStage = q=>{
  if(!q||!q.story) return null;
  const state=G.ensureStoryQuestState(), def=G.storyQuestDef(q.story.id);
  S.flags[`story_chain_${q.story.id}_${q.story.stage}`]=true;
  if(q.story.stage>=q.story.total){
    if(!state.completed.includes(q.story.id)) state.completed.push(q.story.id);
    state.active=null; S.questFollowup=null;
    S.flags[`story_chain_${q.story.id}_done`]=true;
    return {finished:true,title:q.story.title,completion:def&&def.completion};
  }
  const follow=G.nextStoryQuest(q);
  state.active=follow?{id:q.story.id,stage:follow.story.stage,origin:q.story.origin}:null;
  S.questFollowup=follow;
  return follow?{finished:false,title:q.story.title,stage:follow.story.stage,total:follow.story.total,from:follow.from}:null;
};

/* ── 의뢰 (배달/특송/조달/편지) ── */
G.QKIND = {
  deliver:{ic:'📦', nm:'배달'},
  express:{ic:'⚡', nm:'특송'},
  procure:{ic:'🧰', nm:'조달'},
  letter :{ic:'✉️', nm:'편지'},
};
D.expressItems = ['백신 아이스박스','수술 도구 소독 세트','혼례 떡','부고 답장','제사 신위','접골 부목'];
G.questLabel = (q)=> q.story ? `${q.story.title} ${q.story.stage}/${q.story.total} · ${q.item}`
  : q.kind==='procure' ? `${q.need.name} ${q.need.qty}개 조달`
  : q.kind==='letter' ? `${D.npcs[q.npc].name}에게 편지` : q.item;
G.questDesc = (q)=>{
  const to=D.nodes[q.to].name;
  if(q.story) return `"${q.story.prompt}"`;
  if(q.kind==='deliver') return `"${q.item}, ${to}까지 부탁해도 되겠소? 사례는 고철 ${q.reward}."`;
  if(q.kind==='express') return `"급합니다. ${q.item} — ${to}까지 이틀 안에. 사례는 고철 ${q.reward}. 서둘러 주시오."`;
  if(q.kind==='procure') return `"${q.need.name} ${q.need.qty}개를 구해다 주시오. 여기로 다시 오면 되오. 사례는 고철 ${q.reward}."`;
  if(q.kind==='letter')  return `"${to}의 ${D.npcs[q.npc].name}에게 편지 한 통만. 사례는 약소하오만… 꼭 좀 전해주시오."`;
  return '';
};
G.rollQuests = ()=>{
  if(S.quest||!S.at||!D.nodes[S.at].stl) return [];
  /* 같은 날 같은 정착지에선 같은 게시판 (리롤 방지) */
  if(S._qoffer && S._qoffer.at===S.at && S._qoffer.day===S.day) return S._qoffer.offers;
  const from=S.at;
  const tos=Object.keys(D.nodes).filter(id=>D.nodes[id].stl && id!==from);
  if(!tos.length) return [];
  const mk={
    deliver:()=>({kind:'deliver', item:pick(D.questItems), from, to:pick(tos),
      reward:10+Math.floor(rng()*9), due:S.day+4}),
    express:()=>({kind:'express', item:pick(D.expressItems), from, to:pick(tos),
      reward:18+Math.floor(rng()*9), due:S.day+2}),
    procure:()=>({kind:'procure', need:{name:pick(['부품','의약품']), qty:2}, from, to:from,
      reward:14+Math.floor(rng()*7), due:S.day+6}),
    letter:()=>{ const to=pick(tos); const stl=D.stls[D.nodes[to].stl];
      return {kind:'letter', npc:pick(stl.npcs), from, to,
        reward:5+Math.floor(rng()*4), due:S.day+5}; },
  };
  const story=G.storyQuestOffer(from,tos);
  const kinds=Object.keys(mk).sort(()=>rng()-0.5).slice(0,story?1:2);
  const offers=kinds.map(k=>mk[k]());
  if(story) offers.unshift(story);
  S._qoffer={at:from, day:S.day, offers};
  return offers;
};
G.acceptQuest = (q)=>{
  S.quest=q; S._qoffer=null;
  if(q.story){
    const state=G.ensureStoryQuestState();
    state.active={id:q.story.id,stage:q.story.stage,origin:q.story.origin};
    if(S.questFollowup&&S.questFollowup.ledgerId===q.ledgerId) S.questFollowup=null;
  }
  const K=G.QKIND[q.kind];
  G.addNote({type:'소문', title:'의뢰: '+G.questLabel(q),
    body:`${D.nodes[q.from].name}에서 맡은 ${q.story?'연속 이야기':K.nm+' 의뢰'}. ${q.kind==='procure'?'구해서 돌아올 것':D.nodes[q.to].name+'까지'}. 사례는 고철 ${q.reward}.${q.noExpiry?' 서두르기보다 끝까지 이어 가기로 했다.':` 기한 ${q.due}일차.`}`,
    links:[D.nodes[q.to].name]});
  UI.toast(`${K.ic} ${q.story?'연속 의뢰를 맡았다':'의뢰를 받았다'} — ${G.questLabel(q)}`);
  G.save();
};
G.questReady = ()=>{ /* 완료 조건 충족? (조달은 물량 체크) */
  const q=S.quest;
  if(!q || q.to!==S.at) return false;
  if(q.kind==='procure') return (S.items[q.need.name]||0) >= q.need.qty;
  return true;
};
G.checkQuest = ()=>{
  if(!G.questReady()) return false;
  const q=S.quest; S.quest=null;
  const K=G.QKIND[q.kind]||G.QKIND.deliver;
  if(q.kind==='procure') S.items[q.need.name]-=q.need.qty;
  const early = S.day<=q.due-2;
  const bonus = early ? (q.kind==='express'?6:4) : 0;
  S.scrap += q.reward + bonus;
  if(bonus) UI.toast(`⚡ 빠른 처리 보너스 — 고철 +${bonus}`);
  const stl=D.stls[D.nodes[S.at].stl];
  if(stl) stl.npcs.forEach(nid=>{ S.npcs[nid].att += (q.kind==='express'?9:6); });
  if(q.kind==='letter'){ S.npcs[q.npc].att+=12; S.npcs[q.npc].met=true; }
  G.addNote({type:'사건', title:K.nm+' 완료: '+G.questLabel(q),
    body: q.kind==='letter'
      ? `${D.npcs[q.npc].name}이(가) 편지를 두 번 읽었다. 답장은 없었다. 눈가가 대신 답했다.`
      : `${D.nodes[q.from].name} → ${D.nodes[q.to].name}. 사례 고철 ${q.reward}. 받은 이의 얼굴이 밝아졌다.`, links:[]});
  const storyResult=G.completeStoryQuestStage(q);
  if(storyResult&&storyResult.finished){
    G.addNote({type:'사건',title:`연속 의뢰 완료: ${storyResult.title}`,body:storyResult.completion||'여러 정착지를 오간 부탁을 끝까지 마쳤다.',links:[]});
    UI.toast(`✦ ${storyResult.title} 완료 — ${storyResult.completion||'이야기가 마무리됐다'}`,'discover');
  }else if(storyResult){
    UI.toast(`↳ ${storyResult.title} ${storyResult.stage}/${storyResult.total} — ${D.nodes[storyResult.from].name}에서 후속 의뢰를 확인할 수 있다`);
  }else UI.toast(`${K.ic} ${G.questLabel(q)} 완료 — 고철 +${q.reward}`);
  G.save(); return true;
};

/* ── endings ── */
G.completeJourney = ()=>{
  if(!S||S.flags.run_archived) return [];
  const kind=S.flags.core_transfer?'transfer':S.flags.core_sleep?'sleep':'quarantine';
  const memories=(S.memories&&S.memories.history||[]).map(id=>S.memories.choices[id]).filter(Boolean);
  const recruitEchoes=G.recruitApproachEchoes();
  for(const memory of memories){
    memory.lateEchoed=true;
    memory.lateDay=S.day;
    G.qualityChoiceLate(memory.id,kind);
  }
  G.qualityMeaningfulChange('ending',kind);
  G.qualityEnding(kind);
  S.lastRecruitApproachEchoes=recruitEchoes;
  for(const echo of recruitEchoes) S.flags[`${echo.id}_approach_ending`]=true;
  S.flags.run_archived=true;
  G.qualitySessionEnd('journey_complete');
  G.archiveQualityRun(kind);
  G.save();
  return [
    ...memories.slice(-4).map(memory=>({t:`되돌아온 선택 · ${memory.summary}`,c:'item'})),
    ...recruitEchoes.slice(-2).map(echo=>({t:`끝까지 남은 합류 방식 · ${echo.name}: ${echo.label}`,c:'item'}))
  ];
};
/* 엔딩 종류 목록 — 화면(showEnding)과 검사가 같은 정의를 본다.
   2026-08-06까지 authored 엔딩은 갈증 하나뿐이었고, 나머지는 "여행이 끝났다"였다. */
/* 타이머로 넘기는 이벤트는 여기 남긴다. 타이머가 돌지 않는 환경(시뮬·테스트)이
   이 층을 통째로 놓치던 문제 — 도착 말고도 야영·초계·구제 경로가 있다. */
G.deferEvent = (id)=>{ if(!S||!id) return; if(!Array.isArray(S._simDeferred)) S._simDeferred=[]; S._simDeferred.push(id); };
/* 길 위 작업대가 빌려 쓰는 정착지 화면 — 가장 가까운 곳의 재고를 쓴다 */
G.nearestStl = ()=>{ const ids=Object.keys(D.stls); return (S&&S.at&&D.nodes[S.at]&&D.nodes[S.at].stl)||ids[ids.length-1]; };
G.endingKinds = ()=>['thirst','stranded','shunned','story_done'];
/* 서울 결말은 도착 날짜가 아니라 남산에서 내린 결정으로 끝난다. */
G.arrivalEndingKind = ()=>S?'story_done':null;
/* 동료의 반대를 누르고 결정하면 값을 치른다 — 반대가 문단 하나로 끝나지 않게. */
G.overrideDissent = (disposition)=>{
  if(!S) return null;
  const map={core_sleep:'eunsu', core_quarantine:'kangwoo', core_transfer:'jaeyi'};
  const who=map[disposition];
  if(!who||!G.hasComp(who)) return null;
  G.bond(who,-6);
  S.flags[`dissent_overridden_${who}`]=1;
  G.addNote({type:'인물', title:D.comps[who].name,
    body:'남산에서 이 사람의 반대를 누르고 결정했다. 따라오긴 했지만, 그날의 표정은 오래 남았다.',
    links:['남산','천리안']});
  return {who, name:D.comps[who].name};
};
G.endGame = (kind)=>{
  S.endKind=kind;
  G.qualityEnding(kind);
  G.qualitySessionEnd('ending');
  G.archiveQualityRun(kind);
  S.ended = true; G.wipe();
  UI.showEnding(kind);
};

/* ── journal export (Obsidian md) ── */
G.exportMd = ()=>{
  const L = [];
  L.push(`# 서울까지 400km — 여행 일지`);
  L.push(``);
  L.push(`> ${S.mode==='offroad'?'오프로드':'온로드'} 모드 · DAY ${S.day} · 주행 ${Math.round(S.stats.km)}km · 이벤트 ${S.stats.events}건`);
  L.push(``);
  const knowledge=G.knowledgeSummary().filter(k=>k.level>0);
  if(knowledge.length){
    L.push(`## 아는 것과 모르는 것`); L.push(``);
    for(const k of knowledge) L.push(`- ${k.level>=2?'[x]':'[ ]'} **${k.label}** — ${k.text}`);
    L.push(``);
  }
  const choices=(S.memories&&S.memories.history||[]).map(id=>S.memories.choices[id]).filter(Boolean);
  if(choices.length){
    L.push(`## 길이 기억한 선택`); L.push(``);
    for(const m of choices) L.push(`- DAY ${m.day} · ${m.eventTitle}: ${m.summary}`);
    L.push(``);
  }
  const types = ['인물','장소','사건','소문'];
  for(const t of types){
    const ns = S.notes.filter(n=>n.type===t);
    if(!ns.length) continue;
    L.push(`## ${t}`); L.push(``);
    for(const n of ns){
      L.push(`### ${n.title}`);
      L.push(`*DAY ${n.day}* #${n.type}`);
      L.push(``);
      L.push(n.body);
      if(n.links.length) L.push(``), L.push(n.links.map(l=>`[[${l}]]`).join(' '));
      L.push(``);
    }
  }
  L.push(`---`);
  L.push(`동행: ${S.party.map(id=>D.comps[id].name).join(', ')||'없음'}${S.dog?' + 보리(개)':''}`);
  return L.join('\n');
};
