/* ═══ ENGINE 4/5 — 사건 감독·fx 적용·도착 ═══ */
/* ── 사건 감독 ──
   콘텐츠 수를 늘리는 대신, 방금 본 사건과 같은 종류가 다시 겹치지 않게 하고
   무거운 본편·위기 뒤에는 한 호흡 가벼운 길 풍경을 우선한다. */
G.eventIsContextual = ev=> !!(ev && ev.once && (
  ev.priority || ev.needFlag || ev.needFlag2 || ev.needFlagMin || ev.needUp ||
  ev.needKnowledge || ev.needsComp2 || ev.needBond || ev.maxRemain!==undefined || ev.recruitStart
));
G.eventIsHeavy = ev=> !!(ev && (
  ev.ai || ev.priority || ['스토리','추적','위기'].includes(ev.type) ||
  (ev.once && (ev.needFlag || ev.needFlag2 || ev.needFlagMin))
));
G.eventIsCalm = ev=> !!(ev && !G.eventIsHeavy(ev) && !ev.minPursuit &&
  ['정경','동행','발견'].includes(ev.type));
G.directorPressure = ()=>{
  if(!S) return 0;
  G.ensureNarrativeState();
  return clamp(S.director.intensity+S.pursuit*4+(S.fatigue>=75?8:0)+(S.van<30?7:0),0,100);
};
G.directorWeight = ev=>{
  if(!S||!ev) return 1;
  const pressure=G.directorPressure(), phase=S.director.phase;
  /* 절정은 무거운 사건을 밀어붙이는 국면이다 — 억제는 fade/relax의 일이다 */
  if(phase==='peak'){
    if(G.eventIsHeavy(ev)) return ev.priority?1.6:1.45;
    if(G.eventIsCalm(ev)) return 0.5;
  }
  if(['fade','relax'].includes(phase)){
    if(G.eventIsCalm(ev)) return phase==='relax'?2.4:1.8;
    if(G.eventIsHeavy(ev)&&!ev.priority) return phase==='relax'?0.18:0.42;
  }
  if(phase==='build'&&pressure>=55&&G.eventIsHeavy(ev)) return 1.25;
  if(phase==='build'&&pressure<25&&G.eventIsCalm(ev)) return 0.78;
  return 1;
};
G.directEventPool = (pool,opt={})=>{
  let out=(pool||[]).filter(Boolean);
  if(!out.length||!S) return out;
  if(S.driving&&(S.driving.eventCount||0)>=2) return [];
  /* 사건 뒤에는 실제로 아무 일도 일어나지 않는 도로 구간을 둔다.
     기존 breather는 '조용한 전체화면 사건'을 다시 골랐기 때문에 플레이
     호흡은 쉬지 못했다. 같은 구간의 재호출도 계속 비워 둔다. */
  const legKey=S.driving?`${S.day}:${S.at}>${S.driving.to}`:'';
  if(opt.breather!==false && S.driving && (S._eventBreather>0||S._breatherLegKey===legKey)){
    if(S._breatherLegKey!==legKey){
      S._breatherLegKey=legKey;
      S._eventBreather=Math.max(0,S._eventBreather-1);
    }
    return [];
  }
  const recent=new Set((S._recentEvents||[]).slice(-10));
  const fresh=out.filter(e=>!recent.has(e.id));
  if(fresh.length>=Math.min(3,out.length)) out=fresh;

  const phase=S.director&&S.director.phase;
  /* 숨 고르기는 절정이 끝난 뒤에 — peak 중에는 breather가 절정을 가로채지 않는다 */
  if(opt.breather!==false && S._eventBreather>0 && phase!=='peak'){
    /* 기둥이 비어 있는 사건은 숨고르기에도 얼굴을 내민다 — 접선·수소문은
       대부분 조용한 장면이고, 이걸 거르면 기둥이 운에 갇힌다(2026-08-07 실측). */
    const calm=out.filter(e=>G.eventIsCalm(e)||(e.pillar&&G.pillarUnmet(e.pillar)));
    if(calm.length){
      out=calm;
      S._eventBreather=Math.max(0,S._eventBreather-1);
    }
  }

  if(phase==='peak'){
    /* 절정은 절정답게 — 무거운 사건을 한 박자 더 밀고, fade가 내리막을 맡는다 */
    const climax=out.filter(G.eventIsHeavy);
    if(climax.length) out=climax;
  } else if(['fade','relax'].includes(phase)){
    const calm=out.filter(G.eventIsCalm);
    if(calm.length) out=calm;
    else {
      const lighter=out.filter(e=>!G.eventIsHeavy(e));
      if(lighter.length) out=lighter;
    }
  }

  const types=(S._recentEventTypes||[]).slice(-2);
  if(types.length===2&&types[0]===types[1]){
    const varied=out.filter(e=>e.type!==types[1]);
    if(varied.length) out=varied;
  }
  return out;
};
G.rememberEvent = ev=>{
  if(!S||!ev) return;
  if(!Array.isArray(S._recentEvents)) S._recentEvents=[];
  if(!Array.isArray(S._recentEventTypes)) S._recentEventTypes=[];
  if(!Number.isFinite(S._eventBreather)) S._eventBreather=0;
  G.ensureNarrativeState();
  if(ev.id){
    S._recentEvents.push(ev.id);
    if(S._recentEvents.length>16) S._recentEvents.splice(0,S._recentEvents.length-16);
  }
  if(ev.type){
    S._recentEventTypes.push(ev.type);
    if(S._recentEventTypes.length>6) S._recentEventTypes.splice(0,S._recentEventTypes.length-6);
  }
  /* 일반 사건 뒤 두 번, 전투·위기 뒤 세 번은 전체화면 사건 없이 달린다. */
  S._eventBreather=Math.max(S._eventBreather,G.eventIsHeavy(ev)?3:2);
  if(S.driving) S._lastNarrativeLeg=`${S.day}:${S.at}>${S.driving.to}`;
  if(S.driving) S.driving.eventCount=(S.driving.eventCount||0)+1;
  const d=S.director, calm=G.eventIsCalm(ev), heavy=G.eventIsHeavy(ev);
  if(d.phase==='peak'){
    d.peakEvents=(d.peakEvents||0)+1;
    /* 절정은 무거운 사건 최대 2개까지 유지 — 그 뒤에 내리막 */
    if(heavy&&d.peakEvents<2){
      d.intensity=clamp(d.intensity+6,0,100);
    } else {
      d.intensity=clamp(d.intensity-(calm?18:8),0,100);
      d.phase='fade'; d.peakEvents=0;
    }
  } else if(d.phase==='fade'){
    d.intensity=clamp(d.intensity-(calm?20:9),0,100);
    if(d.intensity<=38){ d.phase='relax'; d.relaxEvents=0; }
  } else if(d.phase==='relax'){
    d.intensity=clamp(d.intensity-(calm?12:5),0,100);
    d.relaxEvents++;
    if(d.relaxEvents>=2||d.intensity<=16){ d.phase='build'; d.relaxEvents=0; }
  } else {
    const rise=heavy?28:(calm?5:12);
    d.intensity=clamp(d.intensity+rise,0,100);
    if(heavy||d.intensity>=72){ d.phase='peak'; d.peakEvents=0; }
  }
  d.lastEvent=ev.id||null;
  d.lastDay=S.day;
};

G.fireDriveEvent = ()=>{
  // 동행/추적/조우/발견/탐색 가중 혼합
  let pool = G.eligible();
  const pri = pool.filter(ev=>ev.priority);   // 영입 등 필수 이벤트는 구역 진입 시 우선
  if(pri.length) pool = pri;
  pool=G.directEventPool(pool);
  if(!pool.length) return;
  // 가중치: 관측↑→추적형↑ / 경계태세→매복류↓ / 보리의육감→발견형↑
  const AMBUSH=['meet_waver','meet_toll','meet_bikers','meet_child_alone'];
  const wOf=(e)=>{ let w=e.w*G.directorWeight(e);
    /* 기둥 필수 사건은 운에 맡기지 않는다. 주행당 뽑기가 1~2회뿐이라 w12짜리도
       런당 기대 0.3회 — 안 채워진 기둥의 사건은 판이 당겨준다(2026-08-07 실측). */
    if(e.pillar&&G.pillarUnmet(e.pillar)) w*=6;
    if(G.eventIsContextual(e)) w*=2.1;                    // 방금 열린 인물·업그레이드·본편 후속
    if(e.type==='추적') w*=(1+S.pursuit*0.5);
    if(G.hasPerk('kw_guard')&&AMBUSH.includes(e.id)) w*=0.35;
    if(G.hasPerk('leo_bori')&&e.type==='발견') w*=1.7;
    if(S.wx==='fog'&&e.type==='발견') w*=0.5;
    if(S.wx==='storm'&&(e.type==='조우'||e.type==='탐색')) w*=0.7;
    if(S.up&&S.up.antenna&&e.type==='발견') w*=1.5;
    if(S.driving&&S.driving.road==='high'&&e.type==='추적') w*=1.3;  // 천리안은 고속도로를 좋아한다
    if(S.up&&S.up.winch&&e.type==='위기') w*=0.6;                     // 윈치=빠져도 나온다
    if(S.up&&S.up.lightbar&&G.isNight()&&e.type==='발견') w*=1.3;     // 라이트바=밤눈
    if(S.up&&S.up.scope){ if(e.type==='발견') w*=1.25; if(AMBUSH.includes(e.id)) w*=0.75; }
    if(S.up&&S.up.horn&&['crisis_boar','meet_bikers','meet_waver'].includes(e.id)) w*=0.7;
    return w; };
  const total = pool.reduce((s,e)=>s+wOf(e),0);
  let r = rng()*total;
  let evd = pool[0];
  for(const e of pool){ r -= wOf(e); if(r<=0){ evd=e; break } }
  /* 풀 가중치는 코드를 읽지 않으면 플라시보와 구별이 안 된다 —
     장비가 실제로 개입한 순간에 짧은 귀속 한 줄을 남긴다. */
  if(S.up){
    if(evd.type==='발견'&&S.up.antenna) UI.toast('📡 장거리 안테나가 먼저 신호를 잡았다');
    else if(evd.type==='발견'&&S.up.lightbar&&G.isNight()) UI.toast('💡 라이트바가 어둠 속의 것을 먼저 비췄다');
    else if(AMBUSH.includes(evd.id)&&S.up.scope) UI.toast('🔭 망원대가 그림자를 먼저 잡았다 — 손쓸 시간은 남아 있다');
    else if(!G.eventIsHeavy(evd)&&rng()<0.08){
      /* 억제형 장비의 일상 귀속 — 조용한 날이 왜 조용한지 가끔 알려 준다 */
      if(S.up.horn&&pool.some(e=>['crisis_boar','meet_bikers','meet_waver'].includes(e.id)))
        UI.toast('📯 왕경적 소리에 길가의 그림자들이 먼저 흩어졌다');
      else if(S.up.winch&&pool.some(e=>e.type==='위기'))
        UI.toast('🪝 전면 윈치 덕에 걱정할 구덩이가 하나 줄었다');
    }
  }
  G.openEvent(evd);
};

G.openEventById = (id)=>{ const ev = D.events.find(e=>e.id===id); if(ev) G.openEvent(ev); };
  const ROAD_APPROACH_LABELS = {
    people:'길가에 사람이 보인다', cyclist:'자전거 한 대가 보인다', vehicle:'멈춰 선 차가 보인다',
    debris:'도로 위에 장애물이 보인다', checkpoint:'앞에 검문 시설이 있다', signal:'낯선 신호가 잡힌다',
    smoke:'멀리 연기가 보인다', shelter:'길가에 건물이 보인다', animal:'도로 가장자리에 움직임이 있다',
    cache:'길가에 물건이 놓여 있다', flood:'앞쪽 도로에 물이 차 있다', surveillance:'감시 장치가 길을 보고 있다',
    bridge:'앞에 임시 통로가 보인다', medical:'누군가 도움을 청하고 있다', market:'길가에 작은 장터가 보인다',
    landmark:'낯선 표식이 눈에 들어온다'
  };
  const ROAD_APPROACH_RULES = [
    ['cyclist',/자전거|우편|배달|courier|bicycle|bike/],
    ['medical',/요양원|왕진|환자|열병|의사|약사|구급|부상|medical|clinic/],
    ['checkpoint',/검문|초소|순찰|통행세|관문|checkpoint|patrol|toll|gate/],
    ['bridge',/다리|교량|판자길|임시 통로|bridge|crossing/],
    ['flood',/침수|물길|나루|홍수|범람|flood|waterway/],
    ['surveillance',/드론|센서|카메라|감시|자동 장치|청소차|surveillance|scanner/],
    ['signal',/라디오|방송|신호|안테나|확성기|주파수|송신|beacon|radio|signal/],
    ['smoke',/불길|연기|모닥불|봉화|화재|campfire|smoke|fire/],
    ['market',/시장|장터|상인|교역|행상|노점|market|trader|merchant/],
    ['shelter',/주유소|휴게소|온실|가게|건물|창고|터널|정거장|농장|shelter|station|warehouse/],
    ['animal',/고라니|사슴|들개|멧돼지|짐승|동물|animal|boar|deer/],
    ['vehicle',/트럭|버스|차량|화물차|승용차|견인|vehicle|truck|van|car/],
    ['debris',/잔해|차단|표지판|장애물|낙석|붕괴|바리케이드|debris|barrier|rockslide/],
    ['landmark',/신발|방울|촛불|무덤|묘지|기념|표식|비석|landmark|memorial/],
    ['cache',/상자|가방|물자|부품|식량|과일|소금|발견물|공구|cache|salvage|supply/]
  ];
  G.roadApproachProfile = (evd)=>{
    if(!evd || evd.roadApproach === false) return null;
    const type = String(evd.type || '');
    if(type === '대화' || type === '동행') return null;
    const id = String(evd.id || '').toLowerCase();
    if(/^(crisis_|critical_)/.test(id) || /nofuel|no_fuel|breakdown|drowsy|collapse|fuel_empty/.test(id)) return null;
    const fields = [evd.id, evd.title, evd.scene, evd.location, evd.type];
    if(typeof evd.text === 'string') fields.push(evd.text);
    const haystack = fields.filter(Boolean).join(' ').toLowerCase();
    let kind = '';
    for(const [candidate, pattern] of ROAD_APPROACH_RULES){
      if(pattern.test(haystack)){ kind = candidate; break; }
    }
    if(!kind){
      if(type === '조우') kind = 'people';
      else if(type === '발견' || type === '탐색') kind = 'cache';
      else if(type === '추적') kind = 'surveillance';
      else if(type === '위기' || evd.combat) kind = 'debris';
      else kind = 'landmark';
    }
    const key = evd.id || `${evd.title || 'road-event'}:${type}`;
    return {kind, label:ROAD_APPROACH_LABELS[kind], duration:(type === '위기' || evd.combat) ? 850 : 1450, eventKey:key};
  };

  /* UI.roadApproach 구현은 src/07f-ui-road-thoughts.js로 옮겨졌다 —
     빌드 순서상 04d는 const UI 선언(07-ui.js)보다 먼저 실행되므로 여기서
     UI를 건드리면 TDZ 오류로 이후 전체 스크립트가 죽는다. */

  G.openEvent = (evd)=>{
    const eventKey = evd && (evd.id || `${evd.title || 'road-event'}:${evd.type || ''}`);
    const approach = S.driving ? G.roadApproachProfile(evd) : null;
    if(approach && S._roadApproachBypass !== eventKey && !S.driving.approach){
      S.driving.approach = approach;
      UI.roadApproach(approach, ()=>{
        if(S.driving) delete S.driving.approach;
        S._roadApproachBypass = eventKey;
        UI.roadApproach(null);
        G.openEvent(evd);
      });
      return;
    }
    if(S._roadApproachBypass === eventKey) delete S._roadApproachBypass;
    if(evd.once) S.used.push(evd.id);
  G.qualityEventOpen(evd);
  G.rememberEvent(evd);
  S.stats.events++;
  UI.showEvent(evd);
};

/* fx 적용 → 표시용 칩 목록 반환 */
G.applyFx = (fx)=>{
  const chips = [];
  if(!fx) return chips;
  if(fx.routeChoice){
    if(G.chooseRoute(fx.routeChoice)) chips.push({t:`노선 선택 · ${D.routePlans[fx.routeChoice].name}`,c:'item'});
  }
  if(fx.impactEcho){
    const echo=G.resolveImpactEcho(fx.impactEcho);
    const base={...fx}; delete base.impactEcho;
    fx={...base,...echo.fx}; chips.push(...echo.chips);
  }
  /* 강한 사기 저하는 장면의 여운이다. 다음 주행이 시작된 뒤 40~60초 동안
     일반 잡담을 늦춰 강도·죽음·상실 직후의 유쾌한 티키타카를 막는다. */
  if(fx.moodAll<=-4 && G.delayBanter) G.delayBanter(40,60);
  /* 퍼크 보정 */
  if(fx.scrap>0 && G.hasComp('jaeyi')) fx={...fx, scrap:Math.ceil(fx.scrap*1.3)};
  if(fx.scrap<0 && G.hasPerk('jy_hands')) fx={...fx, scrap:-Math.ceil(-fx.scrap*0.75)};
  if(fx.flag==='food_poison' && G.hasPerk('pss_iron')){ fx={...fx}; delete fx.flag;
    chips.push({t:'💊 강철 위장: 식중독 무효', c:'plus'}); }
  if(fx.item && fx.item['의약품']<0 && G.hasPerk('pss_thrift') && rng()<0.5){
    fx={...fx, item:{...fx.item}}; delete fx.item['의약품'];
    chips.push({t:'💊 알뜰 처방: 의약품 아낌', c:'plus'}); }
  if(fx.pursuit>0){
    if(G.hasPerk('kw_stealth')&&rng()<0.5){ fx={...fx}; delete fx.pursuit; chips.push({t:'🪖 위장술: 관측 회피', c:'plus'}); }
    else if(G.hasPerk('es_silence')&&rng()<0.5){ fx={...fx}; delete fx.pursuit; chips.push({t:'📡 전파 침묵: 관측 회피', c:'plus'}); }
    if(fx.pursuit>0) S._lastPursuitUp=S.day;   // 표식 갱신일 — 조용하면 흐려진다
  }
  if(fx.van<0 && S.up&&S.up.armor){ fx={...fx, van:-Math.ceil(-fx.van*0.7)};
    chips.push({t:'🛡 장갑판: 피해 감소', c:'plus'}); }
  if(fx.van<0 && S.up&&S.up.bullbar){ fx={...fx, van:-Math.ceil(-fx.van*0.85)};
    chips.push({t:'🛡 전면 가드: 피해 감소', c:'plus'}); }
  if(fx.combatStart){
    const c=fx.combatStart;
    const flow=G.ensureCombatFlow();
    if(flow) flow.runId = Math.max(0,(Number(flow.runId)||0)+1);
    const adaptiveBias=flow ? flow.adjust : G.combatAdaptiveBias();
    S.combat={id:c.id||'encounter',threat:c.threat||'위협',edge:c.edge||0,
      terrain:c.terrain||'',stakes:c.stakes||'',objective:c.objective||'',
      kind:c.kind||'교전',pressure:clamp(c.pressure||0,0,3),read:null,startedDay:S.day,
      runId:flow&&flow.runId?flow.runId:0,adaptive:adaptiveBias,adaptivePercent:Math.round(adaptiveBias*100),
      start:{van:S.van,fuel:S.fuel,water:S.water,food:S.food,scrap:S.scrap,
        fatigue:S.fatigue,pursuit:S.pursuit,items:{...(S.items||{})},
        injuries:Object.keys(S.injuries||{})}};
  }
  if(fx.combatEdge&&S.combat){
    S.combat.edge=clamp((S.combat.edge||0)+fx.combatEdge,-2,3);
    chips.push({t:`전세 ${fx.combatEdge>0?'우세 +':'불리 '}${fx.combatEdge}`,c:fx.combatEdge>0?'plus':'minus'});
  }
  if(fx.combatPressure&&S.combat){
    const before=S.combat.pressure||0;
    S.combat.pressure=clamp(before+fx.combatPressure,0,3);
    const delta=S.combat.pressure-before;
    if(delta) chips.push({t:delta>0?'교전 압박 상승':'숨 돌릴 틈 확보',c:delta>0?'minus':'plus'});
  }
  if(fx.combatRead&&S.combat){
    S.combat.read={label:String(fx.combatRead.label||'틈을 읽었다'),
      tactics:Array.isArray(fx.combatRead.tactics)?[...fx.combatRead.tactics]:[]};
    chips.push({t:`◎ 읽어낸 틈 · ${S.combat.read.label}`,c:'plus'});
  }
  const num = (k,label,unit)=>{ if(fx[k]){ const v=fx[k];
    if(k==='fuel') S.fuel=clamp(S.fuel+v,0,S.fuelMax);
    else if(k==='water') S.water=Math.max(0,S.water+v);
    else if(k==='food') S.food=Math.max(0,S.food+v);
    else if(k==='scrap') S.scrap=Math.max(0,S.scrap+v);
    else if(k==='van') S.van=clamp(S.van+v,0,S.vanMax);
    chips.push({t:`${label} ${v>0?'+':''}${v}${unit||''}`, c:v>0?'plus':'minus'}); } };
  num('fuel','연료','L'); num('water','물'); num('food','식량'); num('scrap','고철'); num('van','차체','%');
  if(fx.time){ G.advance(fx.time); chips.push({t:`${fx.time>=60?Math.round(fx.time/60*10)/10+'시간':fx.time+'분'} 경과`, c:''}); }
  if(fx.fatigue){ S.fatigue=clamp(S.fatigue+fx.fatigue,0,100);
    chips.push({t:`피로 ${fx.fatigue>0?'+':''}${fx.fatigue}`, c:fx.fatigue<0?'plus':'minus'}); }
  if(fx.skipKm && S.driving){ S.driving.gone=Math.min(S.driving.dist, S.driving.gone+fx.skipKm);
    chips.push({t:`🛣 지름길 ${fx.skipKm}km`, c:'plus'}); }
  if(fx.moodAll){ G.moodAll(fx.moodAll); if(S.party.length) chips.push({t:`사기 ${fx.moodAll>0?'+':''}${fx.moodAll}`, c:fx.moodAll>0?'plus':'minus'}); }
  if(fx.mood){ for(const id in fx.mood){ if(S.comps[id]!==undefined&&G.hasComp(id)){ S.comps[id].mood=clamp(S.comps[id].mood+fx.mood[id],0,100);
    chips.push({t:`${D.comps[id].name} ${fx.mood[id]>0?'+':''}${fx.mood[id]}`, c:fx.mood[id]>0?'plus':'minus'}); } } }
  if(fx.item){ for(const nm in fx.item){ const v=fx.item[nm]; S.items[nm]=Math.max(0,(S.items[nm]||0)+v);
    chips.push({t:`${nm} ${v>0?'+':''}${v}`, c:v>0?'plus':'minus'}); } }
  if(fx.flag) S.flags[fx.flag]=true;
  if(fx.flag2) S.flags[fx.flag2]=true;
  if(fx.flagCount) S.flags[fx.flagCount]=(S.flags[fx.flagCount]||0)+1;
  if(fx.unflag) delete S.flags[fx.unflag];
  if(fx.knowledge){
    const gains=Array.isArray(fx.knowledge[0])?fx.knowledge:[fx.knowledge];
    for(const gain of gains){
      const learned=G.learn(gain[0],gain[1]);
      if(learned) chips.push({t:`◈ ${learned.label} · ${learned.level>=2?'확인':'단서'}`,c:'item'});
    }
  }
  if(fx.relation&&fx.relation.between){
    const rel=G.changeRelation(fx.relation.between[0],fx.relation.between[1],fx.relation.amount||0,fx.relation.reason);
    if(rel){
      const [a,b]=fx.relation.between;
      chips.push({t:`♦ ${D.comps[a].name}·${D.comps[b].name} — ${G.relationLabel(rel.score)}`,c:'item'});
    }
  }
  if(fx.goto){ S.driving=null; S.at=fx.goto; }
  if(fx.pursuit){ S.pursuit=clamp(S.pursuit+fx.pursuit,0,5);
    chips.push({t:`◉ 관측 ${fx.pursuit>0?'+':''}${fx.pursuit}`, c:fx.pursuit>0?'minus':'plus'}); }
  if(fx.reveal){ const id = fx.reveal==='any' ? G.nearestHidden() : fx.reveal;
    if(id && !S.known.includes(id)){ S.known.push(id); chips.push({t:`🗺 ${D.nodes[id].name} 발견`, c:'item'});
      UI.toast(`<span class="ic">🗺</span>새 장소 발견 — ${D.nodes[id].name}`, 'discover');
      if(G.hasPerk('es_scan')){ const id2=G.nearestHidden();
        if(id2){ S.known.push(id2); chips.push({t:`📡 주파수 스캔: ${D.nodes[id2].name}`, c:'item'}); } } } }
  if(fx.revealNear){ for(let i=0;i<fx.revealNear;i++){ const id=G.nearestHidden();
    if(id){ S.known.push(id); chips.push({t:`🗺 ${D.nodes[id].name} 발견`, c:'item'}); } } }
  if(fx.dog){ S.dog=true; }
  if(fx.enterSeoul){ S.seoul={entered:true}; }
  if(fx.injury){
    const inj=G.addInjury(fx.injury.who,fx.injury.label,fx.injury.days);
    chips.push({t:`🩹 ${G.injuryName(inj.id)} · ${inj.label} ${inj.days}일`,c:'minus'});
  }
  if(fx.healInjury){
    const healed=G.healInjury(fx.healInjury);
    if(healed) chips.push({t:`✚ ${G.injuryName(healed.id)} 부상 처치`,c:'plus'});
  }
  if(fx.combatEnd){
    if(S.combat){
      const resultCode=fx.combatResult==='success'?'success':fx.combatResult==='partial'?'partial':'failure';
      const adaptiveUpdate=G.recordCombatOutcome(resultCode);
      const adaptiveEndPercent=adaptiveUpdate && Number.isFinite(adaptiveUpdate.after) ? Math.round(adaptiveUpdate.after*100) : G.combatAdaptivePercent();
      const history=Array.isArray(S.combat.history)?S.combat.history:[];
      const tactics=[...new Set(history.map(x=>x.tactic).filter(Boolean))];
      const kind=S.combat.kind||'교전';
      const result=fx.combatResult==='success'?'목표 달성':fx.combatResult==='partial'?'부분 달성':'종료';
      const start=S.combat.start||{};
      const gains=[], costs=[];
      const addDelta=(label,delta,unit='',higherIsGood=true)=>{
        delta=Math.round((Number(delta)||0)*10)/10;
        if(!delta) return;
        const text=`${label} ${delta>0?'+':''}${delta}${unit}`;
        ((delta>0)===higherIsGood?gains:costs).push(text);
      };
      addDelta('차체',S.van-start.van,'%',true);
      addDelta('연료',S.fuel-start.fuel,'L',true);
      addDelta('물',S.water-start.water,'',true);
      addDelta('식량',S.food-start.food,'',true);
      addDelta('고철',S.scrap-start.scrap,'',true);
      addDelta('피로',S.fatigue-start.fatigue,'',false);
      addDelta('관측',S.pursuit-start.pursuit,'',false);
      const itemNames=new Set([...Object.keys(start.items||{}),...Object.keys(S.items||{})]);
      itemNames.forEach(name=>addDelta(name,(S.items[name]||0)-(start.items&&start.items[name]||0),'',true));
      const previousInjuries=new Set(start.injuries||[]);
      const newInjuries=Object.keys(S.injuries||{}).filter(id=>!previousInjuries.has(id));
      newInjuries.forEach(id=>{
        const injury=S.injuries[id];
        costs.push(`${G.injuryName(id)} · ${injury&&injury.label||'부상'}`);
      });
      const decisive=[...history].reverse().find(x=>x.read==='읽어낸 틈 활용'||x.response)||history[history.length-1];
      const finalChoice=history[history.length-1]||{};
      const causeSummary=finalChoice&&finalChoice.outcomeMeta&&finalChoice.outcomeMeta.summary
        ? finalChoice.outcomeMeta.summary : '';
      const causeFactors=finalChoice&&finalChoice.outcomeMeta&&Array.isArray(finalChoice.outcomeMeta.details)
        ? finalChoice.outcomeMeta.details : [];
      S.lastCombatReport={kind,threat:S.combat.threat,result,resultCode,
        adaptive:{start:S.combat.adaptivePercent||Math.round((S.combat.adaptive||0)*100),end:adaptiveEndPercent,
          delta:adaptiveUpdate&&Number.isFinite(adaptiveUpdate.delta)?Math.round(adaptiveUpdate.delta*100):0,
          streak:adaptiveUpdate&&adaptiveUpdate.streak?adaptiveUpdate.streak:1},
        tactics,history:history.map(x=>({...x})),read:S.combat.read&&S.combat.read.label||'',
        readUsed:history.some(x=>x.read==='읽어낸 틈 활용'),
        objective:S.combat.objective||'',stakes:S.combat.stakes||'',
        keyMoment:decisive?`${decisive.tactic} · ${decisive.label}`:'',
        causeSummary:causeSummary,
        causeFactors:causeFactors,
        gains,costs,newInjuries,day:S.day};
      G.qualityCombat(S.lastCombatReport);
      const context=[S.combat.terrain&&`지형: ${S.combat.terrain}`,
        S.combat.objective&&`처음 목표: ${S.combat.objective}`,
        S.combat.stakes&&`실패 위험: ${S.combat.stakes}`,
        S.combat.read&&`읽어낸 틈: ${S.combat.read.label}`].filter(Boolean).join('\n');
      G.addNote({type:'사건',title:`${kind} 기록: ${S.combat.threat}`,
        body:`${context}${context?'\n':''}${history.map(x=>`${x.step} — ${x.tactic}: ${x.label}`).join('\n')||'행동 기록 없음'}\n결과: ${result}. 차체 ${Math.round(S.van)}/${S.vanMax}, 관측 ${S.pursuit}/5.`,
        links:['달구지','천리안']});
      if(kind!=='교전'&&['success','partial'].includes(fx.combatResult)) S.stats.nonlethal++;
      if(tactics.length>=2&&S.party.length){ G.moodAll(1); chips.push({t:'전술 연계 · 사기 +1',c:'plus'}); }
      chips.push({t:`${kind} ${result} · 행동 기록 저장`,c:'plus'});
      S._eventBreather=Math.max(Number(S._eventBreather)||0,2);
      G.ensureNarrativeState();
      S.director.phase='fade';
      S.director.intensity=Math.max(44,Math.min(72,S.director.intensity));
    }
    S.combat=null;
  }
  if(fx.chain){ S._chain = fx.chain; }   // 시트 닫힐 때 UI가 이어서 연다 (시네마틱 연쇄)
  if(fx.startRecruit) G.startRecruitQuest(fx.startRecruit);
  if(fx.recruitChoice) G.rememberRecruitChoice(fx.recruitChoice);
  if(fx.recruitRoad) G.markRecruitRoad(fx.recruitRoad);
  if(fx.recruitReady) G.markRecruitReady(fx.recruitReady);
  if(fx.recruit&&G.doRecruit(fx.recruit)){
    const recruit=D.comps[fx.recruit];
    chips.push({t:`정식 동료 합류 · ${recruit.name} · ${recruit.cls} · 크루 ${S.party.length}/${Object.keys(D.comps).length}`,c:'plus'});
  }
  if(fx.note) G.addNote(fx.note);
  for(const learned of G.syncKnowledgeFromFlags())
    chips.push({t:`◈ ${learned.label} · ${learned.level>=2?'확인':'단서'}`,c:'item'});
  if(fx.flag==='story_done') chips.push(...G.completeJourney());
  /* 반대한 동료를 누르고 고른 처분이면 값이 나간다 — 반대가 문단으로 끝나지 않게 */
  if(fx.dissent){
    const paid=G.overrideDissent(fx.dissent);
    if(paid) chips.push({t:`✦ ${paid.name}의 반대를 눌렀다 — 유대 -6`, c:'minus'});
  }
  if(fx.roadGarage){ S.roadGarage=true; setTimeout(()=>UI.showStl(G.nearestStl(),'garage'), 400); }
  if(fx.endJourney) G.endGame(G.arrivalEndingKind());
  if(fx.gameover) G.endGame(fx.gameover);
  G.qualityResourceCheck();
  G.save();
  return chips;
};
G.nearestHidden = ()=>{
  const unk = G.unknownHidden(); if(!unk.length) return null;
  const cur = S.driving? D.nodes[S.driving.to] : D.nodes[S.at];
  unk.sort((a,b)=>{ const A=D.nodes[a],B=D.nodes[b];
    return ((A.x-cur.x)**2+(A.y-cur.y)**2)-((B.x-cur.x)**2+(B.y-cur.y)**2) });
  return unk[0];
};
G.reqOk = (req)=>{
  if(!req) return {ok:true};
  if(req.perk && !G.hasPerk(req.perk)){ const p=G.perkDef(req.perk);
    return {ok:false, t:`퍼크 「${p?p.nm:req.perk}」 필요`}; }
  if(req.flagMin && (S.flags[req.flagMin[0]]||0) < req.flagMin[1]) return {ok:false, t:'아직 단골이 아니다'};
  if(req.flag && !S.flags[req.flag]) return {ok:false, t:'해당 사항 없음'};
  if(req.knowledge && G.knowledgeLevel(req.knowledge[0])<req.knowledge[1])
    return {ok:false,t:'아직 확인하지 못한 사실이다'};
  if(req.traces && G.traceCount()<req.traces) return {ok:false, t:`세대의 흔적 ${req.traces}개 필요`};
  if(req.party && S.party.length<req.party) return {ok:false, t:`동료 ${req.party}명 필요`};
  if(req.stories && G.deedsDone().filter(d=>d.cat==='동료').length<req.stories)
    return {ok:false, t:`개인 서사 ${req.stories}개 필요`};
  if(req.comp && !G.hasComp(req.comp)) return {ok:false, t:`${D.comps[req.comp].name} 필요`};
  if(req.trustComp){
    if(!G.hasComp(req.trustComp)) return {ok:false,t:`${D.comps[req.trustComp].name} 필요`};
    if(G.isInjured(req.trustComp)) return {ok:false,t:`${D.comps[req.trustComp].name}가 다쳐 맡을 수 없다`};
    if((S.comps[req.trustComp].mood||0)<25) return {ok:false,t:`${D.comps[req.trustComp].name}가 지금은 맡지 않겠다고 한다`};
  }
  if(req.healthyComp){
    if(!G.hasComp(req.healthyComp)) return {ok:false, t:`${D.comps[req.healthyComp].name} 필요`};
    if(G.isInjured(req.healthyComp)) return {ok:false, t:`${D.comps[req.healthyComp].name} 부상 회복 필요`};
  }
  if(req.up && !(S.up&&S.up[req.up])) return {ok:false, t:`${(G.upDef(req.up)||{nm:req.up}).nm} 필요`};
  /* ── 최종막 처분 조건 ──
     세 처분은 성격이 다르고, 준비한 것도 달라야 고를 수 있다.
     (2026-08-06까지는 셋 다 무조건 열려 있어 "무엇을 들고 왔든" 같은 결말이었다.) */
  if(req.cells){
    const linked=(D.resistance||[]).filter(c=>S.flags[c.flag]).length;
    if(linked<req.cells) return {ok:false, t:`이은 거점 ${linked}/${req.cells} — 넘겨받을 손이 모자란다`};
  }
  if(req.nightWatch){
    /* 깨어 있는 것 곁에 밤을 설 사람. 사기가 낮으면 거절한다 — 근무표는 사람이 채운다 */
    const willing=S.party.filter(id=>!G.isInjured(id)&&(S.comps[id]||{}).mood>=45).length;
    if(willing<req.nightWatch)
      return {ok:false, t:`감시 근무를 설 사람 ${willing}/${req.nightWatch} — 지친 사람에게 밤을 맡길 수 없다`};
  }
  if(req.keyHolders){
    /* 재가동 열쇠를 나눠 맡을 상대 — 동료와 이은 거점을 합쳐 센다 */
    const holders=S.party.filter(id=>!G.isInjured(id)).length
      + (D.resistance||[]).filter(c=>S.flags[c.flag]).length;
    if(holders<req.keyHolders)
      return {ok:false, t:`열쇠를 나눠 맡을 상대 ${holders}/${req.keyHolders} — 한 사람이 다 쥘 수는 없다`};
  }
  if(req.dog && !S.dog) return {ok:false, t:'보리가 없다'};
  if(req.item && (S.items[req.item]||0)<(req.itemQty||1))
    return {ok:false, t:`${req.item} ${req.itemQty||1}개 필요`};
  if(req.item2 && !(S.items[req.item2]>0)) return {ok:false, t:`${req.item2} 필요`};
  if(req.scrap && S.scrap<req.scrap) return {ok:false, t:`고철 ${req.scrap} 필요`};
  if(req.fuel && S.fuel<req.fuel) return {ok:false, t:`연료 ${req.fuel}L 필요`};
  if(req.water && S.water<req.water) return {ok:false, t:`물 ${req.water} 필요`};
  if(req.food && S.food<req.food) return {ok:false, t:`식량 ${req.food} 필요`};
  return {ok:true};
};
/* 예전 이벤트의 choice.minParty도 req.party와 같은 규칙으로 정규화한다.
   화면·봇·새 호출부가 모두 하나의 조건 객체를 쓰게 해 조건 누락을 막는다. */
G.choiceReq = (choice)=>{
  const req={...(choice&&choice.req||{})};
  if(choice&&choice.minParty!==undefined)
    req.party=Math.max(req.party||0,choice.minParty);
  return Object.keys(req).length?req:null;
};
G.reqText = (req)=>{
  if(!req) return '';
  const parts=[];
  if(req.perk){ const p=G.perkDef(req.perk); parts.push(`퍼크: ${p?p.nm:req.perk}`); }
  if(req.traces) parts.push(`세대의 흔적 ${G.traceCount()}/${req.traces}`);
  if(req.party) parts.push(`동료 ${S.party.length}/${req.party}`);
  if(req.stories) parts.push(`개인 서사 ${G.deedsDone().filter(d=>d.cat==='동료').length}/${req.stories}`);
  if(req.comp) parts.push(`동료: ${D.comps[req.comp].name}`);
  if(req.knowledge){ const k=D.knowledge&&D.knowledge[req.knowledge[0]]; parts.push(`확인: ${k?k.label:req.knowledge[0]}`); }
  if(req.trustComp) parts.push(`맡김: ${D.comps[req.trustComp].name}`);
  if(req.healthyComp) parts.push(`전투 가능: ${D.comps[req.healthyComp].name}${G.isInjured(req.healthyComp)?' (부상)':''}`);
  if(req.item) parts.push(`아이템: ${req.item}${req.itemQty>1?' '+req.itemQty+'개':''}${req.item2?'+'+req.item2:''}`);
  if(req.scrap) parts.push(`고철 ${req.scrap}`);
  if(req.fuel) parts.push(`연료 ${req.fuel}L`); if(req.water) parts.push(`물 ${req.water}`); if(req.food) parts.push(`식량 ${req.food}`);
  return parts.join(' · ');
};
/* 동료·퍼크·과거 선택 같은 특별 조건은 충족되기 전까지 선택지 자체를 숨긴다.
   자원 비용은 플레이어가 계획할 정보라 그대로 보여준다. */
G.reqVisible = (req)=>{
  if(!req) return true;
  if(req.perk&&!G.hasPerk(req.perk)) return false;
  if(req.flagMin&&(S.flags[req.flagMin[0]]||0)<req.flagMin[1]) return false;
  if(req.flag&&!S.flags[req.flag]) return false;
  if(req.knowledge&&G.knowledgeLevel(req.knowledge[0])<req.knowledge[1]) return false;
  if(req.traces&&G.traceCount()<req.traces) return false;
  if(req.party&&S.party.length<req.party) return false;
  if(req.stories&&G.deedsDone().filter(d=>d.cat==='동료').length<req.stories) return false;
  if(req.comp&&!G.hasComp(req.comp)) return false;
  if(req.trustComp&&!G.hasComp(req.trustComp)) return false;
  if(req.healthyComp&&!G.hasComp(req.healthyComp)) return false;
  if(req.up&&!(S.up&&S.up[req.up])) return false;
  if(req.dog&&!S.dog) return false;
  return true;
};
G.reqCostText = (req)=>{
  if(!req) return '';
  const parts=[];
  if(req.item) parts.push(`${req.item}${req.itemQty>1?' '+req.itemQty+'개':''}${req.item2?' + '+req.item2:''}`);
  if(req.scrap) parts.push(`고철 ${req.scrap}`);
  if(req.fuel) parts.push(`연료 ${req.fuel}L`);
  if(req.water) parts.push(`물 ${req.water}`);
  if(req.food) parts.push(`식량 ${req.food}`);
  return parts.join(' · ');
};

/* 정착지 마이크로 탐색. 하루 제한과 일회성 보상을 엔진에서 강제해
   화면을 다시 열거나 세이브를 불러와도 무한 파밍이 되지 않게 한다. */
G.stlFieldState = ()=>{
  if(!S._stlField||Array.isArray(S._stlField)) S._stlField={daily:{},once:{},impact:{},roadEchoed:{},log:[]};
  S._stlField.daily=S._stlField.daily||{};
  S._stlField.once=S._stlField.once||{};
  S._stlField.impact=S._stlField.impact||{};
  S._stlField.roadEchoed=S._stlField.roadEchoed||{};
  S._stlField.log=Array.isArray(S._stlField.log)?S._stlField.log:[];
  return S._stlField;
};
G.stlFieldAction = (stlId,actionId)=>{
  const field=D.stls&&D.stls[stlId]&&D.stls[stlId].field;
  return field&&field.actions&&field.actions.find(a=>a.id===actionId);
};
G.stlFieldStatus = (stlId,action)=>{
  const state=G.stlFieldState();
  const field=D.stls&&D.stls[stlId]&&D.stls[stlId].field;
  const today=field&&field.actions
    ?field.actions.filter(a=>state.daily[`${S.day}:${stlId}:${a.id}`]).length:0;
  if(!action) return {ok:false,reason:'할 일을 찾지 못했다',doneToday:today};
  const dayKey=`${S.day}:${stlId}:${action.id}`, onceKey=`${stlId}:${action.id}`;
  const impact=state.impact[onceKey]||null;
  const done=!!((action.daily&&state.daily[dayKey])||(action.once&&state.once[onceKey]));
  const hiddenLocked=!!(action.hidden&&action.needDone&&today<action.needDone);
  const req=G.reqOk(action.req);
  let reason='';
  if(done) reason=action.once?'이미 마친 일':'오늘은 이미 들렀다';
  else if(hiddenLocked) reason='아직 보이지 않는다';
  else if(!req.ok) reason=req.t;
  return {ok:!done&&!hiddenLocked&&req.ok,done,changed:!!impact,changedOn:impact,
    hiddenLocked,reason,doneToday:today,dayKey,onceKey};
};
/* 한 번이라도 직접 손을 보탠 장소는 날짜가 바뀌어도 기억한다. 이 값은
   정착지 풍경, 주민 반응, 품앗이 가격에 공통으로 쓰이는 단일 진실이다. */
G.stlImpact = stlId=>{
  const stl=D.stls&&D.stls[stlId], field=stl&&stl.field, state=G.stlFieldState();
  const actions=field&&field.actions||[];
  const changed=actions.filter(action=>state.impact[`${stlId}:${action.id}`]);
  const total=actions.length, count=changed.length;
  return {
    count,total,stage:count===0?0:(count>=total?3:(count>=2?2:1)),
    changed,last:changed.length?changed[changed.length-1]:null,
    discount:count>=2?.9:1
  };
};
/* 현장 일의 품앗이 삯. 처음 거드는 일은 후하게, 반복은 소소하게.
   정착지 노동이 경제에 실제로 기여해야 차고 카탈로그가 도달 가능해진다.
   ⚠️ 대가를 내고 얻는 행동(국수를 사 먹거나 솥에 식량을 보태는 것)은 노동이 아니다 —
      거기에 삯을 붙이면 사 먹는 행동이 돈 버는 행동이 된다(2026-08-06 실제 회귀). */
G.stlFieldIsLabor = (action)=>{
  const r=action&&action.req;
  return !(r && (r.scrap||r.food||r.water||r.fuel));
};
G.stlFieldWage = (first)=> first ? 14 : 5;
G.doStlFieldAction = (stlId,actionId)=>{
  if(S.driving||!S.at||D.nodes[S.at].stl!==stlId) return {ok:false,reason:'이 장소에 멈춰 있지 않다'};
  const action=G.stlFieldAction(stlId,actionId), before=G.stlFieldStatus(stlId,action);
  if(!before.ok) return {ok:false,reason:before.reason};
  const field=D.stls[stlId].field, state=G.stlFieldState();
  const impactBefore=G.stlImpact(stlId), firstImpact=!state.impact[before.onceKey];
  const wasHiddenOpen=field.actions.some(a=>a.hidden&&!G.stlFieldStatus(stlId,a).hiddenLocked);
  const fx={...(action.fx||{}),time:action.time||0};
  /* 품앗이 삯 — 마을 일을 거들면 마을이 갚는다. 처음 거든 일은 후하게.
     사고파는 행동에는 붙지 않는다. */
  if(G.stlFieldIsLabor(action)){
    fx.scrap=(fx.scrap||0)+G.stlFieldWage(firstImpact);
  }
  if(action.req){
    if(action.req.scrap) fx.scrap=(fx.scrap||0)-action.req.scrap;
    if(action.req.fuel) fx.fuel=(fx.fuel||0)-action.req.fuel;
    if(action.req.water) fx.water=(fx.water||0)-action.req.water;
    if(action.req.food) fx.food=(fx.food||0)-action.req.food;
    if(action.req.item){
      fx.item={...(fx.item||{})};
      fx.item[action.req.item]=(fx.item[action.req.item]||0)-(action.req.itemQty||1);
      if(action.req.item2) fx.item[action.req.item2]=(fx.item[action.req.item2]||0)-1;
    }
  }
  /* 보상을 적용하기 전에 소비 키를 남겨 중복 탭도 한 번만 처리한다. */
  state.daily[before.dayKey]=true;
  if(action.once) state.once[before.onceKey]=true;
  if(firstImpact) state.impact[before.onceKey]={day:S.day,min:S.min};
  state.log.push({stl:stlId,id:action.id,day:S.day,min:S.min});
  G.qualitySettlementAction(stlId);
  if(state.log.length>40) state.log=state.log.slice(-40);
  const chips=G.applyFx(fx);
  if(firstImpact){
    const localNpc=(D.stls[stlId].npcs||[])[0];
    if(localNpc&&S.npcs[localNpc]) S.npcs[localNpc].att=clamp((S.npcs[localNpc].att||0)+4,-30,30);
    chips.push({t:'이곳에 우리 손길이 남았다',c:'item'});
  }
  const comp=S.party&&S.party.find(id=>D.comps[id]);
  if(comp){ G.bond(comp,1); chips.push({t:`✦ ${D.comps[comp].name} 유대 +1`,c:'item'}); }
  const hiddenOpen=!wasHiddenOpen&&field.actions.some(a=>a.hidden&&!G.stlFieldStatus(stlId,a).hiddenLocked);
  G.save();
  return {ok:true,action,chips,compId:comp||null,hiddenOpen,firstImpact,
    impactBefore,impactAfter:G.stlImpact(stlId)};
};
G.rollOut = (outs)=>{
  const total = outs.reduce((s,o)=>s+o.p,0); let r=rng()*total;
  for(const o of outs){ r-=o.p; if(r<=0) return o } return outs[outs.length-1];
};

G.doRecruit = (id)=>{
  if(G.hasComp(id) || S.party.length>=G.maxParty()) return false;
  const approach=S.recruitQ&&S.recruitQ.id===id?S.recruitQ.choice:null;
  S.party.push(id); S.comps[id] = S.comps[id]||{mood:65};
  if(S.comps[id].mood===undefined) S.comps[id].mood=65;
  S.comps[id].bond=Math.max(S.comps[id].bond||0,5);
  if(approach) S.comps[id].approach=approach;
  if(id==='leo') S.dog=true;
  if(S.recruitQ&&S.recruitQ.id===id) S.recruitQ=null;
  G.qualityMilestone('first_recruit',{companionId:id,approach:approach||''});
  G.qualityMeaningfulChange('relationship',id);
  G.checkLevel(id,{recruit:true});
  const memory=G.recruitApproach(id);
  G.addNote({type:'인물',title:D.comps[id].name,
    body:`떠나기 전의 일을 함께 끝낸 뒤 달구지에 합류했다.${memory?' '+memory.label+'. '+memory.memory:''} ${D.comps[id].bio}`,links:[]});
  const nextSeat=G.nextSeatUpgrade();
  if(S.party.length>=G.maxParty()&&nextSeat)
    setTimeout(()=>UI.toast(`💺 달구지가 찼다 — 다음 자리: ${nextSeat.nm}`),900);
  G.save(); return true;
};

/* ── arrival ── */
G.makeJourneyRecap = (drive,routeCompleted=false)=>{
  if(!drive) return null;
  const start=drive.snapshot||{};
  const delta=(key)=>Math.round(((Number(S[key])||0)-(Number(start[key])||0))*10)/10;
  const changes=[
    ['연료',delta('fuel'),'L',true],['물',delta('water'),'',true],['식량',delta('food'),'',true],
    ['고철',delta('scrap'),'',true],['차체',delta('van'),'%',true],['피로',delta('fatigue'),'',false],
    ['관측',delta('pursuit'),'',false]
  ].filter(row=>row[1]!==0).map(([label,value,unit,higherIsGood])=>({label,value,unit,
    good:(value>0)===higherIsGood}));
  const elapsed=Math.max(0,Math.round(S.day*1440+S.min-(Number(start.gameMinute)||S.day*1440+S.min)));
  const route=G.routeStatus();
  const routeContract=route&&route.def?{
    id:route.def.id,
    name:route.def.name,
    mark:route.def.mark,
    promise:route.def.promise,
    reward:route.def.reward,
    done:route.done,
    total:route.total,
    remainingSegments:Math.max(0,route.total-route.done),
    complete:routeCompleted
  }:null;
  const checkIn=drive.checkIn&&D.comps[drive.checkIn]?{
    id:drive.checkIn,name:D.comps[drive.checkIn].name,
    moment:drive.checkInMoment||null
  }:null;
  return {from:drive.from,to:drive.to,km:Math.round(drive.dist),minutes:elapsed,road:drive.road,
    events:drive.eventCount||0,build:start.build||'기본 생존형',changes,routeCompleted,
    routeContract,routeName:route&&route.def&&route.def.name||'',routeProgress:routeContract?`${routeContract.done}/${routeContract.total}`:'',
    checkIn,chapter:routeCompleted&&routeContract?{
      title:`${routeContract.name} 완주`,
      text:`${routeContract.done}개 구간을 지나 길의 약속을 마쳤다. ${routeContract.reward}`
    }:null,day:S.day};
};
G.arrive = ()=>{
  const completedDrive=S.driving;
  const to = S.driving.to;
  const road = S.driving.road;
  S.at = to; S.driving = null; S.stopover=null;
  G.qualitySettlementEnter(to);
  G.tickDeadline();   // 거리로 다가오는 시한은 도착할 때마다 확인한다
  if(completedDrive&&completedDrive.guestFind){
    S.scrap+=completedDrive.guestFind;
    UI.toast(`🧰 재이가 길가에서 쓸 만한 고철을 챙겼다 +${completedDrive.guestFind}`);
  }
  if(completedDrive&&completedDrive.memoryScrap){
    S.scrap+=completedDrive.memoryScrap;
    const id=completedDrive.recruitMemory&&completedDrive.recruitMemory.id;
    UI.toast(`🔩 ${id?D.comps[id].name:'동료'}가 표시한 고철 +${completedDrive.memoryScrap}`);
  }
  if(S.recruitQ&&S.recruitQ.stage==='road'&&S.recruitQ.roadFrom!==to){
    const rq=S.recruitQ, def=D.recruitQuests[rq.id];
    rq.stage='follow'; rq.target=to; rq.followDay=S.day;
    if(def) UI.toast(`🤝 ${D.nodes[to].name} — ${def.name}, 마주할 일이 생겼다`);
  }
  if(road==='rough') G.moodAll(2);   // 험한 길은 경치로 갚는다
  if(!S.visited.includes(to)){
    S.visited.push(to);
    const n = D.nodes[to];
    G.addNote({type:'장소', title:n.name, body:`DAY ${S.day} 도착. ${n.desc}`, links:[]});
  }
  const routeCompleted=G.updateRouteOnArrival(to);
  S.lastJourneyRecap=G.makeJourneyRecap(completedDrive,routeCompleted);
  if(S.lastJourneyRecap){
    if(!Array.isArray(S.journeyRecaps)) S.journeyRecaps=[];
    S.journeyRecaps.push(S.lastJourneyRecap);
    if(S.journeyRecaps.length>12) S.journeyRecaps=S.journeyRecaps.slice(-12);
  }
  G.qualityMeaningfulChange('arrival',to);
  G.scheduleJourneyBeat();
  if(to==='seoul'){
    if(S.flags.seoul_open){ UI.renderAll(); G.save(); return; }  // 이미 열림 — 서울 맵
    if(G.seoulReady()){                                          // 조건 충족 → 남산이 열린다
      UI.renderAll();
      setTimeout(()=>G.openEvent(D.seoulOpenEvent), 500);
      G.save(); return;
    }
    /* 아직 — 길이 접혀 되돌아온다 (제일 모자란 기둥 안내) */
    UI.renderAll();
    const miss=G.seoulMissing();
    setTimeout(()=>{
      UI.toast(`📖 ${miss.pillar} ${miss.have}/${miss.need} — 아직: ${miss.hint}`);
      setTimeout(()=>G.openEvent(D.gateEvent), 1600);
    }, 500);
    G.save(); return; }
  const n = D.nodes[to];
  /* 위수 구역 첫 진입 — 초계와의 첫 조우 */
  if(n.region==='north' && !S.flags.armed_age){
    const arrivalDelay=UI.onArrive();
    G.deferEvent('perimeter_first');
    setTimeout(()=>G.openEventById('perimeter_first'), arrivalDelay);
    G.save(); return; }
  if(S.fuel<=0){ G.deferEvent('crisis_nofuel'); setTimeout(()=>G.openRescue('nofuel','crisis_nofuel'), 700); }   // 도착 직후 빈 탱크 — 잠김 방지
  const loc = D.events.find(e=>e.locEvent===to && !S.used.includes(e.id)
    && (!e.needsComp||G.hasComp(e.needsComp)) && (!e.needFlag||S.flags[e.needFlag]));
  const arrivalDelay=UI.onArrive();
  if(S.recruitQ&&S.recruitQ.stage==='task'&&S.recruitQ.target===to){
    /* 타이머가 돌기 전에 영입이 끝나면 S.recruitQ는 null이다 — 이름을 지금 캡처한다
       (2026-08-07 퍼저 실측 크래시) */
    const recruitName=D.recruitQuests[S.recruitQ.id].name;
    setTimeout(()=>UI.toast(`🤝 ${recruitName}의 부탁을 진행할 수 있다`),arrivalDelay);
  }
  /* setTimeout으로 넘기는 id를 함께 기록한다. 타이머가 돌지 않는 환경(시뮬·테스트)이
     이 층을 통째로 놓치거나, 반대로 사본을 만들어 큐를 두 번 빼는 일을 막는다. */
  S._simDeferred=[];
  if(loc){ G.deferEvent(loc.id); setTimeout(()=>G.openEvent(loc), arrivalDelay); }
  else if(!G.maybeCrisis()){
    const queued=G.popStory();
    if(queued){ G.deferEvent(queued); setTimeout(()=>G.openEventById(queued), arrivalDelay); }
    else if(n.stl){ /* settlement panel via UI */ }
  }
  G.save();
};
