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
  if(G.isNight()) return {ok:false,tries,mins,fatigue,reason:'해가 진 뒤에는 주변을 탐색할 수 없다'};
  if(S.fatigue>=80) return {ok:false,tries,mins,fatigue,reason:'피로 80% 이상 — 먼저 쉬어야 한다'};
  return {ok:true,tries,repeat,fresh,mins,fatigue,miss:repeat?0.45:0.15};
};
G.exploreForecast = status=>{
  status=status||G.exploreStatus();
  const region=G.regionOf();
  const danger=(S.pursuit>=3||S.wx==='storm'||region==='north')?'높음'
    :(S.pursuit>0||S.wx==='rain'||status.repeat)?'보통':'낮음';
  const focus=region==='north'?'통제 흔적 · 우회로 · 생존 물자'
    :region==='central'?'사람의 흔적 · 폐시설 · 보급품':'생활 흔적 · 고철 · 길의 소문';
  /* 예보는 실제 수확을 말해야 한다 — 고정 문구를 두면 지역 차등을 도입한 순간 거짓말이 된다 */
  const haul=region==='north'?12:region==='mid'?9:6;
  const guaranteed=status.fresh?`고철 ${haul} · 체결 부품 가능`
    :status.repeat?'재수색 고철 2~4':'확정 회수 없음';
  return {danger,focus,guaranteed};
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
  const pool = G.eligible('탐색');
  if(status.repeat){
    /* 다시 뒤지는 것도 완전히 헛되지는 않다 — 대신 처음만 못하다 */
    const again=2+Math.floor(rng()*3);
    S.scrap+=again; freshHaul+=` · 재수색 고철 +${again}`;
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
G.fireDriveEvent2 = (pool)=>{ pool=G.directEventPool(pool); if(!pool.length) return;
  const weight=e=>e.w*(G.eventIsContextual(e)?2.1:1)*G.directorWeight(e);
  const total=pool.reduce((s,e)=>s+weight(e),0); let r=rng()*total;
  let evd=pool[0]; for(const e of pool){ r-=weight(e); if(r<=0){evd=e;break} } G.openEvent(evd); };
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
  G.advance(mins);
  S.min = Math.round(S.min);   // 기상 시각은 정확히 06:30이어야 한다
  let mood=6, vanFix=4;
  if(G.hasPerk('pss_night')) mood+=3;
  if(G.hasPerk('leo_fire')) mood+=4;
  if(G.hasPerk('mj_camp')) vanFix+=8;
  if(S.up&&S.up.solar) vanFix+=3;
  if(S.up&&S.up.awning) mood+=2;
  if(S.up&&S.up.stove) mood+= G.isWet()?3:2;
  S.fatigue=0;
  G.moodAll(mood); S.van = clamp(S.van+vanFix,0,S.vanMax);
  if(G.hasPerk('jy_break')){ S.scrap+=2; }
  if(G.isWet()){ S.water+=2; UI.toast('💧 빗물받이 가득 — 물 +2'); }
  if(G.hasPerk('es_tap')&&rng()<0.25){ const h=G.nearestHidden();
    if(h){ S.known.push(h); UI.toast(`<span class="ic">📡</span>은수의 도청 — ${D.nodes[h].name}`, 'discover'); } }
  /* 모닥불 대화는 전원의 시간이다 — 한 명만 깊어지면 4인 Lv3(관계 기둥)가
     산술적으로 시한 안에 안 들어간다(2026-08-07 완주봇 실측: 관계가 최장 병목). */
  for(const cid of S.party) G.bond(cid,1);
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
    if(rng()<Math.max(0.08,risk)){
      const north = G.regionOf()==='north';
      /* 밤은 접선의 시간이기도 하다 — 기둥이 비어 있으면 35%로 그 사건이 모닥불을 찾아온다.
         주행 뽑기가 하루 0.7회뿐이라(2026-08-07 실측) 밤 채널이 없으면 기둥이 운에 갇힌다. */
      const pillarPool=G.eligible().filter(e=>e.pillar&&G.pillarUnmet(e.pillar));
      if(pillarPool.length&&rng()<0.35){
        const pv=pillarPool[Math.floor(rng()*pillarPool.length)];
        G.deferEvent(pv.id);
        setTimeout(()=>G.openEventById(pv.id), 600);
        UI.renderAll(); G.save(); return;
      }
      const r=rng();
      const ev = north? (r<0.45?'camp_scan': r<0.7?'camp_thief': r<0.87?'camp_dogs':'camp_visitor')
                      : (r<0.32?'camp_thief': r<0.6?'camp_dogs':'camp_visitor');
      G.deferEvent(ev);
      setTimeout(()=>G.openEventById(ev), 600);
      UI.renderAll(); G.save(); return;
    }
  }
  if(!G.maybeCrisis() && S.party.length && rng()<0.5){
    const pool = G.eligible('동행'); if(pool.length) setTimeout(()=>G.fireDriveEvent2(pool), 500);
  }
  UI.renderAll(); G.save();
};

/* ── banter ── */
let lastBanter = [];
let lastChat=-1;
G.pickChat = ()=>{
  if(!D.chats) return null;
  const night=G.isNight(), region=G.regionOf();
  const pool=D.chats.filter((c,i)=>{
    if(i===lastChat) return false;
    const nd=c.need||{};
    if(nd.comp && !G.hasComp(nd.comp)) return false;
    if(nd.comp2 && !G.hasComp(nd.comp2)) return false;
    if(nd.party && S.party.length<nd.party) return false;
    if(nd.dog===1 && !S.dog) return false;
    if(nd.night===1 && !night) return false;
    if(nd.rain===1 && !G.isWet()) return false;
    if(nd.region && region!==nd.region) return false;
    if(nd.flag && !S.flags[nd.flag]) return false;
    if(nd.knowledge && G.knowledgeLevel(nd.knowledge[0])<nd.knowledge[1]) return false;
    /* 등장 화자 전원이 실제 탑승 중이어야 함 (동료만 검사, 나/sys 제외) */
    for(const ln of c.lines){ const w=ln[0];
      if(w!=='나'&&w!=='sys'&&D.comps[w]&&!G.hasComp(w)) return false; }
    return true; });
  if(!pool.length) return null;
  const c=pool[Math.floor(rng()*pool.length)];
  lastChat=D.chats.indexOf(c);
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
            hint: miss? '길 위의 인연을 더 만나고, 함께할 이유를 쌓기'
              : shallow? `${D.comps[shallow].name}와 더 깊어져 개인 서사 Lv.3 열기`
              : '함께 갈 네 사람의 개인 서사를 끝까지 듣기' },
    세계: { have: worldN, need: D.seoulPillars.세계,
            hint:S.flags.resist_revealed?'저항 거점을 이어 세상 편이 되기':'중부 국도에서 이음망과 먼저 접선하기' },
    진실: { have: truthN, need: D.seoulPillars.진실,
            hint:truthHint },
    유산: { have: done.filter(d=>d.cat==='회수').length, need: D.seoulPillars.유산,
            hint:'남산에서 열 것들을 챙기기 (편지·봉투·커피)' },
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

/* ── 의뢰 (배달/특송/조달/편지) ── */
G.QKIND = {
  deliver:{ic:'📦', nm:'배달'},
  express:{ic:'⚡', nm:'특송'},
  procure:{ic:'🧰', nm:'조달'},
  letter :{ic:'✉️', nm:'편지'},
};
D.expressItems = ['백신 아이스박스','수술 도구 소독 세트','혼례 떡','부고 답장','제사 신위','접골 부목'];
G.questLabel = (q)=> q.kind==='procure' ? `${q.need.name} ${q.need.qty}개 조달`
  : q.kind==='letter' ? `${D.npcs[q.npc].name}에게 편지` : q.item;
G.questDesc = (q)=>{
  const to=D.nodes[q.to].name;
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
  const kinds=Object.keys(mk).sort(()=>rng()-0.5).slice(0,2);
  const offers=kinds.map(k=>mk[k]());
  S._qoffer={at:from, day:S.day, offers};
  return offers;
};
G.acceptQuest = (q)=>{
  S.quest=q; S._qoffer=null;
  const K=G.QKIND[q.kind];
  G.addNote({type:'소문', title:'의뢰: '+G.questLabel(q),
    body:`${D.nodes[q.from].name}에서 맡은 ${K.nm} 의뢰. ${q.kind==='procure'?'구해서 돌아올 것':D.nodes[q.to].name+'까지'}. 사례는 고철 ${q.reward}. 기한 ${q.due}일차.`,
    links:[D.nodes[q.to].name]});
  UI.toast(`${K.ic} 의뢰를 받았다 — ${G.questLabel(q)}`);
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
  UI.toast(`${K.ic} ${G.questLabel(q)} 완료 — 고철 +${q.reward}`);
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
G.endingKinds = ()=>['thirst','stranded','shunned','too_late','empty_district','story_done'];
/* 도착 시점의 결말 종류. 늦음은 실패가 아니라 다른 결말이지만,
   구역이 비어버린 뒤의 도착은 승리 텍스트의 변주가 아니라 이름 있는 결말이어야 한다. */
G.arrivalEndingKind = ()=>{
  if(!S) return null;
  const t=D.transferStatus(S);
  if(t.remainingResidents<=0) return 'empty_district';
  if(!t.onTime) return 'too_late';
  return 'story_done';
};
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
