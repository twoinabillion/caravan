/* ═══ ENGINE 2/5 — 유대·퍼크·전투 판정·일지·날씨·시간 ═══ */
/* ── 유대 & 퍼크 (진전도) ── */
/* 부상 중에는 해당 동료의 전문 퍼크가 잠시 멈춘다. 기본 동행 효과는 유지된다. */
G.hasPerk = (pid)=> S && S.party.some(id=> !G.isInjured(id)&&(S.comps[id].perks||[]).includes(pid));
G.perkDef = (pid)=>{
  for(const cid in D.comps){ const P2=D.comps[cid].perks;
    for(const lv of [1,2]) for(const p of P2[lv]) if(p.id===pid) return p;
    if(P2[3].id===pid) return P2[3]; }
  return null;
};
/* 유대 수치와 개인 서사는 별개다. 잠만 반복해 유대가 올라도 실제 대화를
   건너뛴 채 Lv.3 이야기가 끝나지 않도록, 함께 본 장면의 깊이를 따로 센다. */
G.companionStoryStage = (id)=>{
  if(!S||!id) return 0;
  const used=new Set(Array.isArray(S.used)?S.used:[]);
  const scenes=(D.events||[]).filter(ev=>ev&&ev.once&&ev.needsComp===id&&used.has(ev.id)
    &&['대화','동행','스토리'].includes(ev.type));
  if(!scenes.length) return 0;
  const bondAt=ev=>Array.isArray(ev.needBond)&&ev.needBond[0]===id?Number(ev.needBond[1])||0:0;
  let stage=1;
  if(scenes.some(ev=>bondAt(ev)>=(Number(D.bondTh&&D.bondTh[0])||5))) stage=2;
  if(scenes.some(ev=>bondAt(ev)>=(Number(D.bondTh&&D.bondTh[1])||12))) stage=3;
  return stage;
};
G.bond = (id, amt)=>{
  if(!G.hasComp(id)) return;
  const c=S.comps[id];
  if(c.lvl>=3) { c.bond+=amt; return; }
  c.bond += amt;
  G.checkLevel(id);
};
G.checkLevel = (id,opt={})=>{
  const c=S.comps[id], nm=D.comps[id].name;
  while(c.lvl<3 && !c.pending && c.bond>=D.bondTh[c.lvl]){
    const next=c.lvl+1;
    if(next===3&&G.companionStoryStage(id)<3){
      c.storyReady=true;
      const stage=G.companionStoryStage(id);
      if(c.storyGateNotified!==stage){
        c.storyGateNotified=stage;
        UI.toast(`<span class="ic">✦</span>${nm}와 나눌 이야기가 남아 있다 — 야영이나 정차 중 말을 건다`);
      }
      break;
    }else if(next<3){ c.pending=next;
      UI.toast(opt.recruit
        ? `<span class="recruit-kicker">정식 동료 합류</span><strong>${nm}</strong> · ${D.comps[id].cls} · 크루 ${S.party.length}/${Object.keys(D.comps).length}<span class="recruit-next">첫 유대 보상 · 동료 카드에서 퍼크 선택</span>`
        : `<span class="ic">✦</span>${nm}와의 유대가 깊어졌다 — 동료 카드에서 퍼크 선택`, opt.recruit?'recruit':undefined);
    } else { /* Lv3 시그니처(스토리)는 자동 습득 */
      c.lvl=3;
      const p=D.comps[id].perks[3];
      if(!c.perks.includes(p.id)) c.perks.push(p.id);
      delete c.storyReady; delete c.storyGateNotified;
      G.grantPerk(id, p.id);
      UI.toast(`<span class="ic">★</span>${nm} — 「${p.nm}」`, 'discover');
    }
  }
  G.save();
};
G.choosePerk = (id, pick)=>{ // pick: 0|1
  const c=S.comps[id]; if(!c.pending) return;
  const p=D.comps[id].perks[c.pending][pick];
  c.perks.push(p.id); c.lvl=c.pending; c.pending=0;
  G.grantPerk(id, p.id);
  UI.toast(`<span class="ic">✦</span>${D.comps[id].name} — 「${p.nm}」 습득`);
  G.checkLevel(id);
  G.save();
};
G.grantPerk = (id, pid)=>{ // 습득 즉시 효과
  switch(pid){
    case 'mj_tune': S.vanMax+=20; S.van+=20; break;
    case 'jy_map': for(let i=0;i<2;i++){ const h=G.nearestHidden(); if(h){ S.known.push(h);
        UI.toast(`<span class="ic">🗺</span>재이의 감 — ${D.nodes[h].name}`, 'discover'); } } break;
    case 'mj_radio': if(!S.known.includes('mingyu_ridge')){ S.known.push('mingyu_ridge');
        G.addNote({type:'소문',title:'역추적된 좌표',body:'민지가 통신탑 기록과 신호 세기로 발신지를 역산했다. 영동 북쪽 능선.',links:['민규의 신호','민규의 능선']});
        UI.toast('<span class="ic">🗺</span>민규의 능선 — 지도에 표시됨','discover'); } break;
    case 'jy_story': if(!S.known.includes('jaeyi_cache')){ S.known.push('jaeyi_cache');
        G.addNote({type:'소문',title:'재이의 열쇠',body:'재이가 목에 걸고 다니던 열쇠의 주소를 말했다. 김천 인근.',links:['재이','재이의 창고']});
        UI.toast('<span class="ic">🗺</span>재이의 창고 — 지도에 표시됨','discover'); } break;
    case 'kw_story': S.flags.kw_truth=true; break;
    case 'pss_story': S.flags.pss_list=true; break;
    case 'leo_story': S.flags.leo_song=true;
      UI.toast('🎸 레오의 노래가 완성됐다 — 청주 방송국으로'); break;
    case 'es_story':
      S.flags.es_backdoor_ready=true; S.pursuit=Math.max(0,S.pursuit-2);
      G.queueStory(S.flags.es_v1194?'es_backdoor':'es_nightshift');
      UI.toast('📡 은수의 접속 코드가 살아 있다 — 다음 정차 때 로그를 연다'); break;
  }
};
/* 개인 서사처럼 반드시 보여야 하는 장면. 현재 시트를 닫은 뒤 순서대로 연다. */
G.queueStory = (id)=>{
  if(!S||!id||S.used.includes(id)||S._storyQueue.includes(id)) return;
  S._storyQueue.push(id);
};
/* 핵심 여정 장면은 무작위 풀과 경쟁하지 않는다. 주행거리 문턱을 넘긴 뒤
   다음 도착에서 한 장면만 예약해, 길 위의 호흡을 끊지 않고 본편을 되짚는다. */
/* 비트 조건. 거리만으로 고르면 동료·상황이 맞아야 성립하는 장면을 예약할 수 없고,
   그래서 그런 장면들이 무작위 풀에 남아 등장률 0%가 됐다(2026-08-06 실측). */
G.beatReady = (b)=>{
  if(!b||S.stats.km<b.km) return false;
  const w=b.when;
  if(!w) return true;
  if(w.comps && !w.comps.every(id=>G.hasComp(id)&&!G.isInjured(id))) return false;
  if(w.region){ const r=G.regionOf();
    if(Array.isArray(w.region)? !w.region.includes(r) : w.region!==r) return false; }
  if(w.flag && !S.flags[w.flag]) return false;
  if(w.noFlag && S.flags[w.noFlag]) return false;
  if(w.minParty!==undefined && S.party.length<w.minParty) return false;
  if(w.maxKm!==undefined && S.stats.km>w.maxKm) return false;
  if(w.lowWater && S.water>Math.max(2,G.partySize()+1)) return false;  // 본문이 "물통 바닥"을 전제하는 장면용
  if(w.day===false && G.isNight()) return false;
  return true;
};
/* 비트로 승격한 이벤트가 원래 갖고 있던 출현 조건을 잃지 않게 한다.
   승격은 "무작위 풀에서 꺼내 보장한다"는 뜻이지 "아무 데서나 튼다"는 뜻이 아니다.
   (2026-08-06: water_toll이 물통 가득한 상태에서 "우리 물통은 바닥이 보인다"를
    출력할 수 있었다 — 승격이 needLowWater를 우회했기 때문.) */
G.beatConditionsMatchEvent = (b)=>{
  const ev=D.events.find(e=>e.id===b.id);
  if(!ev) return {ok:false, why:'이벤트 없음'};
  const w=b.when||{};
  if(ev.region && !w.region) return {ok:false, why:`region ${ev.region.join('/')} 조건이 비트에 없음`};
  if(ev.needLowWater && !w.lowWater) return {ok:false, why:'needLowWater 조건이 비트에 없음'};
  if(ev.needFlag && w.flag!==ev.needFlag) return {ok:false, why:`needFlag ${ev.needFlag} 조건이 비트에 없음`};
  if(ev.night===false && w.day!==false) return {ok:false, why:'주간 전용 조건이 비트에 없음'};
  return {ok:true};
};
/* 여정 비트는 개인 서사 연쇄(_storyQueue)와 다른 큐를 쓴다.
   _storyQueue는 사건을 닫을 때마다 빠지므로(07c-ui-story.js closeEvent),
   비트를 거기 넣으면 정착지 한 곳에서 장면이 연달아 쏟아진다 — 실제로 그랬다.
   비트는 도착에서만, 한 번에 하나씩 나온다. */
G.queueBeat = (id)=>{
  if(!S||!id||S.used.includes(id)) return;
  if(!Array.isArray(S._beatQueue)) S._beatQueue=[];
  if(!S._beatQueue.includes(id)) S._beatQueue.push(id);
};
G.scheduleJourneyBeat = ()=>{
  if(!S||!D.journeyBeats) return null;
  if(!Array.isArray(S._beatQueue)) S._beatQueue=[];
  const ready=D.journeyBeats.filter(b=>G.beatReady(b)
    && !S.used.includes(b.id) && !S._beatQueue.includes(b.id));
  ready.forEach(b=>G.queueBeat(b.id));
  return ready.length?ready[0].id:null;
};
/* 예약 시점과 꺼내는 시점 사이에 상황이 바뀔 수 있다. 동료가 다치거나 내리고,
   물통이 채워지고, 지역이 바뀐다. 조건이 깨진 비트는 내보내지 않고 되돌려 둔다 —
   안 그러면 두 사람이 없는데 두 사람의 갈등 장면이 열린다(2026-08-06 실측). */
G.popBeat = ()=>{
  if(!S||!Array.isArray(S._beatQueue)) return null;
  const defs=id=>(D.journeyBeats||[]).find(b=>b.id===id);
  /* 조건(지역·저수량·플래그)이 붙은 비트는 창이 닫힌다 — 북부를 벗어나면 북부 장면은
     영영 못 나온다. 조건 없는 본편 비트는 언제 나와도 되므로 뒤로 미룬다.
     (2026-08-06 실측: 북부 창이 4구간뿐이라 순서가 안 돌아왔다.) */
  const ready=S._beatQueue.filter(id=>{
    const b=defs(id); return b && !S.used.includes(id) && G.beatReady(b);
  });
  if(!ready.length) return null;
  /* 지역 한정 사건은 창이 닫히기 전에 먼저 내보내고, 그다음 본편을 일반 역사
     비트보다 앞세운다. 이 순서여야 세계의 대비와 최단 경로의 본편이 함께 남는다. */
  const main=ready.find(id=>id.startsWith('story_')||id.startsWith('parents_')||
    ['memory_busan_terminal','history_failed_namsan','history_parents_network'].includes(id));
  const urgent=ready.find(id=>{ const w=defs(id).when||{}; return w.region||w.lowWater||w.flag; });
  const out=urgent||main||ready[0];
  S._beatQueue=S._beatQueue.filter(id=>id!==out && defs(id) && !S.used.includes(id));
  return out;
};
G.popStory = ()=>{
  while(S&&S._storyQueue&&S._storyQueue.length){
    const id=S._storyQueue.shift(), ev=D.events.find(e=>e.id===id);
    if(ev && (!ev.once||!S.used.includes(id))) return id;
  }
  return null;
};
/* 이벤트 해석 후 훅: 유대 획득 + 직업 부가 수확 + 오래 남을 선택 */
G.afterChoice = (evd, choice, outcome)=>{
  const extra=[];
  const actingComp=choice.req&&(choice.req.healthyComp||choice.req.trustComp||choice.req.comp);
  if(actingComp){ G.bond(actingComp, 2); extra.push({t:`✦ ${D.comps[actingComp].name} 유대 +2`, c:'item'}); }
  else if(choice.req&&choice.req.perk){
    /* id 정확 매치 — 직렬화 부분 문자열 매치는 id가 다른 id/설명문에 포함되는 순간 오귀속된다 */
    const cid=Object.keys(D.comps).find(k=>Object.values(D.comps[k].perks||{})
      .some(lv=>Array.isArray(lv)?lv.some(p=>p.id===choice.req.perk):lv&&lv.id===choice.req.perk));
    if(cid&&G.hasComp(cid)){ G.bond(cid,2); extra.push({t:`✦ ${D.comps[cid].name} 유대 +2`, c:'item'}); } }
  if(evd.needsComp&&actingComp!==evd.needsComp){ G.bond(evd.needsComp, 2);
    extra.push({t:`✦ ${D.comps[evd.needsComp].name} 유대 +2`, c:'item'}); }
  if(evd.type==='탐색'){
    if(G.hasPerk('mj_eye')&&rng()<0.25){ S.items['부품']=(S.items['부품']||0)+1; extra.push({t:'🔧 폐차장의 눈: 부품 +1', c:'item'}); }
    if(G.hasPerk('pss_herb')&&rng()<0.2){ S.items['의약품']=(S.items['의약품']||0)+1; extra.push({t:'💊 약초학: 의약품 +1', c:'item'}); }
  }
  extra.push(...G.rememberChoice(evd,choice,outcome));
  return extra;
};
G.choiceMemoryDef = (eventId,choiceIndex)=>{
  const defs=D.choiceMemories&&D.choiceMemories[eventId];
  return Array.isArray(defs)?defs[choiceIndex]:null;
};
G.rememberChoice = (evd,choice,outcome)=>{
  if(!S||!evd||!choice) return [];
  G.ensureNarrativeState();
  const choiceIndex=(evd.choices||[]).indexOf(choice);
  const def=G.choiceMemoryDef(evd.id,choiceIndex);
  if(!def||S.memories.choices[def.id]) return [];
  const entry={id:def.id,eventId:evd.id,choiceIndex,day:S.day,km:Math.round(S.stats.km),
    eventTitle:evd.title,choiceLabel:String(choice.label||'').replace(/<[^>]*>/g,''),
    summary:def.summary,dueKm:S.stats.km+(def.afterKm||16),dueEvents:S.stats.events+(def.afterEvents||1),
    echoed:false};
  S.memories.choices[def.id]=entry;
  S.memories.pending.push(def.id);
  S.memories.history.push(def.id);
  if(S.memories.history.length>40) S.memories.history=S.memories.history.slice(-40);
  G.qualityChoiceRemember(entry);
  return [{t:`기억됨 · ${def.summary}`,c:'item'}];
};
G.pendingChoiceMemory = ()=>{
  if(!S) return null;
  G.ensureNarrativeState();
  for(const id of S.memories.pending){
    const memory=S.memories.choices[id];
    if(memory&&!memory.echoed) return memory;
  }
  return null;
};
G.takeChoiceEcho = ()=>{
  if(!S||!S.driving) return null;
  G.ensureNarrativeState();
  const idx=S.memories.pending.findIndex(id=>{
    const m=S.memories.choices[id];
    return m&&!m.echoed&&S.stats.km>=m.dueKm&&S.stats.events>=m.dueEvents;
  });
  if(idx<0) return null;
  const id=S.memories.pending[idx], memory=S.memories.choices[id];
  const def=G.choiceMemoryDef(memory.eventId,memory.choiceIndex);
  if(!def||!Array.isArray(def.lines)){
    S.memories.pending.splice(idx,1);
    return null;
  }
  /* 동료가 화자로 지정된 기억은 그 사람이 실제 탑승 중일 때만 재생한다. */
  const unavailable=def.lines.some(line=>D.comps[line[0]]&&!G.hasComp(line[0]));
  if(unavailable) return null;
  memory.echoed=true;
  memory.echoDay=S.day;
  memory.echoKm=Math.round(S.stats.km);
  S.memories.pending.splice(idx,1);
  G.qualityChoiceEcho(memory);
  G.save();
  return {memory,lines:def.lines};
};
G.combatTacticDelta = choice=>{
  if(!S||!S.combat||!choice||!choice.tactic) return 0;
  const history=Array.isArray(S.combat.history)?S.combat.history:[];
  const last=history[history.length-1];
  let delta=0;
  /* 같은 해법을 연달아 쓰면 상대가 각도를 읽는다. 다른 전술로 잇는 선택은
     정찰→대응→이탈의 단계가 실제로 연결되도록 작은 보너스를 준다. */
  if(last&&last.tactic===choice.tactic) delta-=0.09;
  else if(last&&last.tactic!==choice.tactic) delta+=0.04;
  if(history.slice(0,-1).some(x=>x.tactic===choice.tactic)) delta-=0.03;
  const helper=choice.req&&choice.req.healthyComp;
  if(helper&&G.hasComp(helper)&&!G.isInjured(helper))
    delta+=Math.min(0.06,(S.comps[helper].lvl||0)*0.02);
  return delta;
};
G.combatTacticNote = choice=>{
  const delta=G.combatTacticDelta(choice);
  if(delta>=0.06) return '전문가 연계';
  if(delta>0) return '전술 전환';
  if(delta<=-0.08) return '같은 수를 읽힘';
  if(delta<0) return '반복 부담';
  return '새 전술';
};
G.combatContextDelta = choice=>{
  if(!choice) return 0;
  const state=S&&S.combat?S.combat:null;
  const pressure=state?state.pressure||0:0;
  const terrain=Number(choice.terrainFit||0);
  const noise=Number(choice.noise||0);
  /* 지형을 제대로 쓴 선택은 보상하고, 몰린 상태에서 큰 소리를 내는 선택은
     검문망에 더 빨리 잡히게 한다. 전세와 별개의 축이라 같은 장비라도
     교전 장소와 앞 단계 선택에 따라 성공률이 달라진다. */
  return terrain*0.035-pressure*0.05-noise*(0.018+((S&&S.pursuit)||0)*0.004);
};
G.combatContextNote = choice=>{
  const notes=[];
  if(Number(choice&&choice.terrainFit)>=2) notes.push('지형 정답');
  else if(Number(choice&&choice.terrainFit)>=1) notes.push('지형 활용');
  if(Number(choice&&choice.noise)>=2) notes.push('경보 노출 큼');
  else if(Number(choice&&choice.noise)>=1) notes.push('소음 노출');
  if(S&&S.combat&&(S.combat.pressure||0)>=2) notes.push('시간에 몰림');
  return notes.join(' · ');
};
G.combatDifficultyMeta = p=>{
  if(!Number.isFinite(p)) return {odds:0,pct:0,label:'측정 불가',className:'neutral',score:3,score10:5};
  const v=clamp(p,0,1);
  const pct=Math.round(v*100);
  const score10=Math.max(1,Math.min(10,Math.round(v*10)));
  const score=Math.max(1,Math.min(5,Math.ceil(score10/2)));
  const bucket=score10>=9
    ? {label:'매우 쉬움',className:'good'}
    : score10>=7
      ? {label:'쉬움',className:'good'}
      : score10>=5
        ? {label:'보통',className:'neutral'}
        : score10>=3
          ? {label:'어려움',className:'hard'}
          : {label:'매우 어려움',className:'hard'};
  return {odds:v,pct,label:bucket.label,className:bucket.className,score,score10};
};
G.combatIntentAnswer = (evd,choice)=>{
  const combat=evd&&evd.combat;
  const counters=combat&&combat.counters;
  if(!counters||!choice||!choice.tactic) return null;
  const label=counters[choice.tactic];
  return label?{match:true,label}:null;
};
G.combatIntentDelta = (evd,choice)=>G.combatIntentAnswer(evd,choice)?0.07:0;
G.combatIntentNote = (evd,choice)=>{
  const answer=G.combatIntentAnswer(evd,choice);
  return answer?`의도 대응 · ${answer.label}`:'';
};
G.combatBaseOdds = (choice,evd)=>{
  const combat=evd&&evd.combat;
  const hasRoll=typeof choice.combatRoll==='number';
  const roll=hasRoll ? choice.combatRoll : 0.52;
  const globalShift=Number(combat&&combat.difficulty)||0;
  const shift=clamp(globalShift,-2,2)*COMBAT_DIFFICULTY_SHIFT;
  const adaptive=G.combatAdaptiveBias()*COMBAT_AUTO_ADJUST_SCALE;
  const eventBase=Number(combat&&combat.baseChance);
  if(Number.isFinite(combat&&combat.baseChance)){
    return clamp(eventBase + (hasRoll ? (roll-0.5)*COMBAT_ROLL_VARIANCE : 0) + shift + adaptive,0.1,0.94);
  }
  return clamp(roll + shift + adaptive,0.1,0.94);
};
G.combatOddsSource = (choice,evd)=>{
  const combat=evd&&evd.combat;
  if(Number.isFinite(combat&&combat.baseChance)) return 'eventBase';
  const base=typeof choice.combatRoll==='number'?choice.combatRoll:NaN;
  const baseSource = Number.isFinite(base)?'choiceBase':'fallbackBase';
  return baseSource;
};
G.combatReadDelta = choice=>{
  const read=S&&S.combat&&S.combat.read;
  if(!read||!choice||!choice.tactic||!Array.isArray(read.tactics)) return 0;
  return read.tactics.includes(choice.tactic)?0.1:0;
};
G.combatReadNote = choice=>{
  const read=S&&S.combat&&S.combat.read;
  if(!read||!choice||!choice.tactic||!Array.isArray(read.tactics)) return '';
  return read.tactics.includes(choice.tactic)?'읽어낸 틈 활용':'다른 해법';
};
G.combatOddsBreakdown = (choice,evd)=>{
  const flow=G.ensureCombatFlow();
  const base=G.combatBaseOdds(choice,evd);
  const baseSource=G.combatOddsSource(choice,evd);
  const edge=S&&S.combat?S.combat.edge||0:0;
  const readBonus=G.combatReadDelta(choice);
  const terrainDelta=G.combatContextDelta(choice);
  const tacticDelta=G.combatTacticDelta(choice);
  const intentDelta=G.combatIntentDelta(evd,choice);
  const tactic=choice&&choice.tactic||'';
  const vehicleSources=[];
  let vehicleDelta=0;
  const vehicleFit=(id,delta,label)=>{ if(S&&S.up&&S.up[id]){ vehicleDelta+=delta; vehicleSources.push(label); } };
  vehicleFit('armor',0.04,'장갑판');
  if(['분리 인양','고정','차체 지지'].includes(tactic)) vehicleFit('winch',0.06,'전면 윈치');
  if(['정비','장비'].includes(tactic)) vehicleFit('sidebox',0.05,'사이드 공구함');
  if(['돌입','운전'].includes(tactic)) vehicleFit('bullbar',0.05,'전면 가드');
  if(['유인','교란','이탈'].includes(tactic)) vehicleFit('horn',0.04,'왕경적');
  if(G.isNight()&&['관찰','정찰','운전'].includes(tactic)) vehicleFit('lightbar',0.05,'라이트바');
  if(S&&S.up&&S.up.scope&&['사격','관찰','정찰'].includes(tactic)){
    vehicleDelta+=tactic==='사격'?0.08:0.05;
    vehicleSources.push('지붕 망원대');
  }
  if(choice&&Number(choice.terrainFit)>=2) vehicleFit('mudtires',0.03,'험로 타이어');
  const perkDelta=Math.min(0.14,vehicleDelta);
  const injury= G.isInjured('driver') ? -0.08 : 0;
  const adaptive=G.combatAdaptiveBias()*COMBAT_AUTO_ADJUST_SCALE;
  const comeback= flow&&Array.isArray(flow.history) ? Math.min(3,G.combatRecentFailureStreak())*0.015 : 0;
  const bonus=edge*0.12+tacticDelta+terrainDelta+intentDelta+readBonus+perkDelta+injury+comeback;
  /* 앞 단계에서 구체적인 틈을 읽고 그에 맞는 해법을 고른 경우에만
     일반 성공 상한 90%를 95%까지 연다. 준비해도 실패 가능성은 남긴다. */
  return {base,baseSource,edge,readBonus,readDelta:readBonus,terrainDelta,tacticDelta,intentDelta,perkDelta,vehicleSources,
    injury,bonus,adaptive:adaptive+comeback,adaptiveRecovery:comeback,adaptivePercent:G.combatAdaptivePercent(),
    odds:clamp(base+bonus,0.12,readBonus>0?0.95:0.9)};
};
G.combatChoiceOutcomeMeta = (evd,choice,roll,result)=>{
  const breakdown=G.combatOddsBreakdown(choice,evd);
  if(!breakdown||!Number.isFinite(breakdown.base)||!Number.isFinite(breakdown.odds))
    return null;
  const show=(n,suffix='')=>`${n>=0?'+':''}${Math.round(n)}${suffix}`;
  const details=[];
  const read=breakdown.readDelta*100;
  const terrain=breakdown.terrainDelta*100;
  const tactic=breakdown.tacticDelta*100;
  const intent=breakdown.intentDelta*100;
  const perk=breakdown.perkDelta*100;
  const adaptive=breakdown.adaptive*100;
  const injury=breakdown.injury*100;
  if(Math.abs(read)>=1) details.push(`틈 활용 ${show(read)}%`);
  if(Math.abs(terrain)>=1) details.push(`지형 ${show(terrain)}%`);
  if(Math.abs(tactic)>=1) details.push(`전술 ${show(tactic)}%`);
  if(Math.abs(intent)>=1) details.push(`의도 대응 ${show(intent)}%`);
  if(Math.abs(perk)>=1) details.push(`차량 ${show(perk)}%`);
  if(Math.abs(adaptive)>=1) details.push(`적응 ${show(adaptive)}%`);
  if(Math.abs(injury)>=1) details.push(`부상 ${show(injury)}%`);
  const base = Math.round(breakdown.base*100);
  const odds = Math.round(breakdown.odds*100);
  const adjusted = odds-base;
  const baseSource = breakdown.baseSource==='eventBase' ? '교전 기본' : '선택 기준';
  const summary = `${baseSource} ${base}% → ${show(adjusted)}% = ${odds}%`;
  return {
    result: String(result||'').trim(),
    base,
    odds,
    adjusted,
    roll: Number.isFinite(roll) ? Math.round(roll*100) : null,
    baseSource: breakdown.baseSource,
    baseSourceLabel: baseSource,
    vehicleSources: breakdown.vehicleSources||[],
    details,
    summary
  };
};
G.combatOdds = (choice,evd)=>{
  const breakdown=G.combatOddsBreakdown(choice,evd);
  return breakdown?breakdown.odds:0.52;
};
G.combatOddsPercent = (choice,evd)=>{
  const p=G.combatOdds(choice,evd);
  return Math.round(clamp(Number.isFinite(p)?p:0,0,1)*100);
};
G.combatChoiceChoiceText = choice=>{
  if(!choice) return '';
  const tactic=choice.tactic||'행동';
  const label=String(choice.label||'').replace(/<[^>]*>/g,'').trim();
  if(tactic==='행동'&&label) return label;
  if(!label) return tactic;
  return `${tactic} · ${label}`;
};
G.combatGrade = (choice,evd)=>{
  const p=G.combatOdds(choice,evd);
  return p>=0.68?'우세':p<0.42?'불리':'팽팽';
};
G.rememberCombatChoice = (evd,choice,outcomeMeta=null)=>{
  if(!evd||!evd.combat||!choice) return null;
  const answer=G.combatIntentAnswer(evd,choice);
  const read=G.combatReadNote(choice);
  const entry={phase:evd.combat.phase,step:evd.combat.step,
    tactic:choice.tactic||'행동',label:String(choice.label||'').replace(/<[^>]*>/g,''),
    intent:evd.combat.intent||'',response:answer&&answer.label||'',read,
    context:G.combatContextNote(choice),outcomeMeta:outcomeMeta||null};
  if(S.combat){
    if(!Array.isArray(S.combat.history)) S.combat.history=[];
    S.combat.history.push(entry);
    if(S.combat.history.length>3) S.combat.history=S.combat.history.slice(-3);
    G.save();
  }
  return entry;
};
G.inferCombatResult = (choice,out,index,rolled)=>{
  const fx=out&&out.fx;
  if(!fx||!fx.combatEnd) return '';
  if(['success','partial','failure'].includes(fx.combatResult)) return fx.combatResult;
  const severeCost=!!fx.injury || (fx.pursuit||0)>0 || (fx.van||0)<=-7 || (fx.fuel||0)<=-7;
  const clearGain=(fx.scrap||0)>0 || (fx.food||0)>0 || (fx.water||0)>0 ||
    !!fx.note || !!fx.flag || !!fx.flag2 || !!fx.knowledge || !!fx.reveal;
  if(rolled) return index===0?'success':severeCost?'failure':'partial';
  if(choice&&choice.tactic==='이탈') return 'partial';
  return clearGain&&!severeCost?'success':'partial';
};
/* 기계도 배운다 — 플레이어가 위협을 읽어냈으면(threatRead) 다음 조우에서
   그 계통은 counter 하나의 패턴을 바꾼다. 준비=확정 규칙이 '한 번 배우면
   영원히 심심함'으로 굳는 것을 막는 학습 대 학습 축(2026-08-07).
   조우당 하나, 조우 시작 시 결정되어 조우 내내 고정된다. */
G.threatAdaptedTactic = (evd)=>{
  if(!S||!evd||!evd.combat||!evd.combat.threat||!evd.combat.counters) return null;
  if(!(S._threatRead&&S._threatRead[evd.combat.threat])) return null;   // 아직 안 읽힌 위협은 안 바뀐다
  if(!S.combat) return null;
  if(S.combat.adaptedFor!==evd.combat.threat){
    const keys=Object.keys(evd.combat.counters);
    S.combat.adaptedFor=evd.combat.threat;
    S.combat.adapted=keys.length?keys[Math.floor(rng()*keys.length)]:null;
  }
  return S.combat.adapted||null;
};
G.pickOutcome = (evd, choice)=>{
  let out=null, index=0, rolled=false, rolledValue;
  /* 강우의 저격은 조우당 한 발만 확실하다 — 연발은 위치를 드러낸다(소음×관측 정합) */
  if(choice.req&&choice.req.item==='탄약'&&G.hasPerk('kw_sniper')&&S.combat&&!S.combat.sniperUsed){
    S.combat.sniperUsed=1; out=choice.out[0];
  }
  /* 준비는 굴림을 대체한다. 선언된 counter의 tactic과 일치하는 선택이
     (a) 요구를 실제로 채웠거나(맞는 동료·장비 — req 통과가 곧 준비 확인)
     (b) 같은 위협을 이미 한 번 겪어 읽어냈다면(S._threatRead)
     결과는 확실한 성공이다. 굴림은 준비 없이 덤빌 때의 것.
     (2026-08-07: counters가 준비를 '선언'만 하고 판정은 여전히 굴림이던 간극을 닫음) */
  else if(choice.combatRoll!==undefined && choice.out.length>1
    && choice.tactic && evd.combat && evd.combat.counters && evd.combat.counters[choice.tactic]
    && !(choice.req&&choice.req.item)   /* 소모품 지불은 준비 숙련이 아니다 — 연발은 위치를 드러낸다 */
    && G.threatAdaptedTactic(evd)!==choice.tactic   /* 기계도 배운다 — 바뀐 패턴엔 옛 해법이 안 통한다 */
    && ((choice.req&&(choice.req.healthyComp||choice.req.up||choice.req.knowledge))
        || (S._threatRead&&S._threatRead[evd.combat.threat]))){
    out=choice.out[0]; index=0;
  }
  else if(choice.combatRoll!==undefined&&choice.out.length>1){
    rolled=true;
    rolledValue=rng();
    const odds=G.combatOdds(choice,evd);
    if(rolledValue<odds) index=0;
    /* out이 3개면 실패 대역이 갈라진다: 나머지의 60%는 부분 성공, 40%는 실패 */
    else if(choice.out.length>=3) index = rolledValue<odds+(1-odds)*0.6 ? 1 : 2;
    else index=1;
    out=choice.out[index];
  } else {
    out=G.rollOut(choice.out);
    index=Math.max(0,choice.out.indexOf(out));
  }
  /* 이 위협을 한 번 겪어냈다 — 다음 조우부터 같은 계통은 읽는 법을 안다.
     도장은 조우가 '끝난' 결과(combatEnd)에만 찍는다. 단계 중간에 찍으면
     3단계 작전의 2·3단계가 첫 판부터 확정이 된다(2026-08-07 재검토 실측). */
  if(evd&&evd.combat&&evd.combat.threat&&out&&out.fx&&out.fx.combatEnd){
    S._threatRead=S._threatRead||{};
    S._threatRead[evd.combat.threat]=true;
  }
  const combatResult=G.inferCombatResult(choice,out,index,rolled);
  const combatMeta = G.combatChoiceOutcomeMeta(evd,choice,rolled?rolledValue:null,combatResult);
  if(combatMeta){
    combatMeta.rollValue=Number.isFinite(rolledValue) ? Math.round(rolledValue*100) : null;
  }
  if(combatResult&&out&&out.fx&&!out.fx.combatResult)
    return {...out,fx:{...out.fx,combatResult},...(combatMeta?{combatMeta}:{} )};
  return combatMeta ? {...out,combatMeta} : out;
};

/* ── notes (지식 그래프) ── */
G.addNote = (n)=>{
  const ex = S.notes.find(x=>x.title===n.title);
  if(ex){ if(n.body && !ex.body.includes(n.body)) ex.body += '\n'+n.body;
    /* 같은 제목에 무한히 붙으면 세이브·일지가 비대해진다 — 최근 기록만 남긴다 */
    const lines=ex.body.split('\n'); if(lines.length>20) ex.body=lines.slice(-20).join('\n');
    (n.links||[]).forEach(l=>{ if(!ex.links.includes(l)) ex.links.push(l) }); ex.day=S.day; return ex; }
  const note = {id:'n'+(S.noteSeq++), type:n.type||'사건', title:n.title, body:n.body||'', links:n.links||[], day:S.day};
  S.notes.push(note); return note;
};

/* ── weather (세계 날씨: 하루 단위 + 예보) ── */
G.rollWx = (cur)=>{
  const table = D.wxNext[cur]||D.wxNext.clear;
  let r=rng();
  for(const [w,p] of table){ r-=p; if(r<=0) return w; }
  return table[0][0];
};
G.wxName = w=> (D.wx[w]||D.wx.clear).nm;
G.isWet = ()=> S.wx==='rain'||S.wx==='storm';

/* ── time & rations ── */
G.hungerLabel = stage=> ['정상','허기','공복','쇠약'][clamp(Math.round(Number(stage)||0),0,3)];
G.mealNeed = kind=>{
  const party=G.partySize();
  const breakfast=Math.max(1,party-(G.hasPerk('kw_ration')&&party>1?1:0));
  if(kind==='breakfast') return breakfast;
  if(kind==='lunch') return Math.ceil(party/2);
  return 1;
};
G.dailyRationInfo = ()=>{
  const breakfast=G.mealNeed('breakfast'), lunch=G.mealNeed('lunch');
  const foodPerDay=breakfast+lunch, waterPerDay=breakfast;
  const foodDays=Math.floor(S.food/Math.max(1,foodPerDay));
  const waterDays=Math.floor(S.water/Math.max(1,waterPerDay));
  return {breakfast,lunch,foodPerDay,waterPerDay,foodDays,waterDays,supplyDays:Math.min(foodDays,waterDays)};
};
G.nextMealInfo = ()=>{
  if((S._breakfastDay||0)<S.day) return {kind:'breakfast',label:'아침',clock:'06:30',food:G.mealNeed('breakfast'),water:G.mealNeed('breakfast')};
  if((S._lunchDay||0)<S.day) return {kind:'lunch',label:'점심',clock:'12:00',food:G.mealNeed('lunch'),water:0};
  return {kind:'breakfast',label:'아침',clock:'내일 06:30',food:G.mealNeed('breakfast'),water:G.mealNeed('breakfast')};
};
/* 현재 시각부터 주어진 분 동안 실제로 넘는 06:30·12:00 경계만 센다.
   경로 카드와 엔진이 같은 식사 계약을 쓰므로 긴 구간의 보급 예측이 어긋나지 않는다. */
G.mealForecast = mins=>{
  const now=S.day*1440+S.min, end=now+Math.max(0,Number(mins)||0);
  let breakfasts=0,lunches=0;
  let bDay=(S._breakfastDay||0)<S.day?S.day:S.day+1;
  let lDay=(S._lunchDay||0)<S.day?S.day:S.day+1;
  for(let at=bDay*1440+390;at<=end+0.0001;at+=1440) breakfasts++;
  for(let at=lDay*1440+720;at<=end+0.0001;at+=1440) lunches++;
  const food=breakfasts*G.mealNeed('breakfast')+lunches*G.mealNeed('lunch');
  const water=breakfasts*G.mealNeed('breakfast');
  return {breakfasts,lunches,food,water};
};
G.consumeMeal = kind=>{
  const need=G.mealNeed(kind), before=clamp(Number(S.hunger)||0,0,3);
  const used=Math.min(Math.max(0,S.food),need), ok=used>=need;
  S.food=Math.max(0,S.food-used);
  if(ok){
    S.hunger=Math.max(0,before-1);
    return {ok,need,used,before,after:S.hunger,fatigue:0,mood:0};
  }
  S.hunger=Math.min(3,before+1);
  const stage=[null,{fatigue:8,mood:-4},{fatigue:12,mood:-6},{fatigue:18,mood:-8}][S.hunger];
  S.fatigue=clamp(S.fatigue+stage.fatigue,0,100);
  if(S.party.length) G.moodAll(stage.mood);
  if(before<2&&S.hunger>=2) G.queueCrisis('crisis_hungry');
  return {ok,need,used,before,after:S.hunger,fatigue:stage.fatigue,mood:S.party.length?stage.mood:0};
};
G.mealToast = (label,result,icon='🍚')=>{
  if(result.ok){
    const recovery=result.after<result.before?(result.after===0?' · 허기 해소':` · 허기 ${result.before}→${result.after}`):'';
    return `${icon} ${label} 식사 · 식량 -${result.used}${recovery}`;
  }
  const mood=result.mood?` · 사기 ${result.mood}`:'';
  return `${icon} ${label} 결식 · 식량 ${result.used}/${result.need} · ${G.hungerLabel(result.after)} ${result.after}/3 · 피로 +${result.fatigue}${mood}`;
};
G.advance = (mins,options={})=>{
  let m = mins;
  const settleBoundary=()=>{
    let changed=false;
    if((S._breakfastDay||0)<S.day&&S.min>=6.5*60){ S._breakfastDay=S.day; G.breakfast(); changed=true; }
    if((S._lunchDay||0)<S.day&&S.min>=12*60){ S._lunchDay=S.day; G.lunch(); changed=true; }
    if(S.min>=24*60){ S.min=0; S.day++; G.dawn(); changed=true; }
    return changed;
  };
  while(m>0){
    settleBoundary();
    let boundary=24*60;
    if((S._breakfastDay||0)<S.day&&S.min<6.5*60) boundary=Math.min(boundary,6.5*60);
    if((S._lunchDay||0)<S.day&&S.min<12*60) boundary=Math.min(boundary,12*60);
    const step = Math.min(m, Math.max(0,boundary-S.min));
    if(step<=0) break;
    /* 분 단위로 정규화한다. 주행 tick이 실수를 더하다 보면 06:30이 389.9999가 되어
       "다음 날 아침"을 판별하는 조건과 표시가 어긋난다. */
    S.min = Math.round((S.min + step) * 1000) / 1000; m -= step;
    /* 깨어 있는 모든 시간에 피로가 쌓인다 (수면=camp가 유일한 리셋) */
    if(!options.sleeping){
      const injuryMul=G.isInjured('driver')?1.2:1;
      S.fatigue = clamp(S.fatigue + step*0.045*(1-G.driverLv()*0.06)*injuryMul, 0, 100);
    }
  }
  settleBoundary();
};
G.lunch = ()=>{
  const result=G.consumeMeal('lunch');
  UI.toast(G.mealToast('점심',result));
  if(result.ok){
    if(typeof SCENE!=='undefined') SCENE.showMeal(16);
    if(S.up&&S.up.awning&&!S.driving) S.fatigue=Math.max(0,S.fatigue-3);
    if(S.up&&S.up.kitchen) G.moodAll(1);
    if(S.party.length&&rng()<0.6&&D.mealBanter) UI.speak({who:'sys', t:pick(D.mealBanter)}); }
  G.save();
};
G.breakfast = ()=>{
  const need=G.mealNeed('breakfast');
  const waterUsed=Math.min(Math.max(0,S.water),need), waterOk=waterUsed>=need;
  S.water=Math.max(0,S.water-waterUsed);
  let waterFatigue=0,waterMood=0;
  if(waterOk) S.thirst=0;
  else {
    S.thirst++; waterFatigue=15; waterMood=S.party.length?-8:0;
    S.fatigue=clamp(S.fatigue+waterFatigue,0,100);
    if(waterMood) G.moodAll(waterMood);
  }
  const result=G.consumeMeal('breakfast');
  if(waterOk&&result.ok){
    const recovery=result.after<result.before?(result.after===0?' · 허기 해소':` · 허기 ${result.before}→${result.after}`):'';
    UI.toast(`🍙 아침 식사 · 식량 -${result.used} · 물 -${waterUsed}${recovery}`);
  } else {
    const fatigue=result.fatigue+waterFatigue, mood=result.mood+waterMood;
    UI.toast(`🍙 아침 식사 부족 · 식량 ${result.used}/${result.need} · 물 ${waterUsed}/${need} · ${G.hungerLabel(result.after)} ${result.after}/3${fatigue?` · 피로 +${fatigue}`:''}${mood?` · 사기 ${mood}`:''}`);
  }
  if(result.ok){
    if(typeof SCENE!=='undefined') SCENE.showMeal(16);
    if(S.up&&S.up.awning&&!S.driving) S.fatigue=Math.max(0,S.fatigue-3);
    if(S.up&&S.up.kitchen) G.moodAll(1);
    if(S.party.length&&rng()<0.6&&D.mealBanter) UI.speak({who:'sys', t:pick(D.mealBanter)});
  }
  if(S.up&&S.up.beehive&&rng()<0.3){ S.food+=1; G.moodAll(2);
    UI.toast('🐝 지붕 벌통에서 아침 꿀 — 식량 +1'); }
  if(G.hasComp('leo')) G.moodAll(3); // 레오의 아침 기타
  if(S.up&&S.up.garden){ S.food += S.up.garden2?2:1; }
  if(S.up&&S.up.fridge){ S._fridgeD=(S._fridgeD||0)+1;
    if(S._fridgeD>=3){ S._fridgeD=0; S.food+=1; UI.toast('🧊 냉장 박스 — 아낀 식량 +1'); } }
  if(S.up&&S.up.collector){ S.water += G.isWet()?2:1; }
  G.save();
};
G.dawn = ()=>{
  /* 같은 장소도 다음 날이면 다시 수색할 수 있다.
     대신 하루를 넘기며 물·식량을 소비하므로 무한 무료 파밍은 되지 않는다. */
  S._exploreDay=S.day; S._exploreNodes={};
  // 날씨 실현: 예보가 오늘이 되고, 새 예보가 잡힌다
  const prevWx=S.wx;
  S.wx=S.wxNext; S.wxNext=G.rollWx(S.wx);
  G.tickInjuries();
  if(S.driving) S.driving.wx=S.wx;
  if(S.wx!==prevWx) UI.toast(`${D.wx[S.wx].ic} ${D.wx[S.wx].nm}${D.wx[S.wx].hint?' — '+D.wx[S.wx].hint:''}`);
  if(S.fatigue>=70){ G.moodAll(-3); UI.toast(S.party.length?'😴 다들 피곤이 얼굴에 앉았다 — 쉬어야 한다':'😴 피곤이 얼굴에 앉았다 — 쉬어야 한다'); }
  /* 의뢰 기한 */
  if(S.quest && !S.quest.noExpiry && S.day>S.quest.due){
    const q=S.quest; S.quest=null;
    const K=G.QKIND[q.kind]||G.QKIND.deliver;
    const fromStl=D.stls[D.nodes[q.from].stl];
    if(fromStl) fromStl.npcs.forEach(nid=>{ S.npcs[nid].att-=(q.kind==='express'?8:5); });
    UI.toast(`${K.ic} 의뢰 기한 초과 — ${G.questLabel(q)} 실패`);
    G.addNote({type:'사건', title:K.nm+' 실패: '+G.questLabel(q),
      body:`기한(${q.due}일차)을 넘겼다. ${D.nodes[q.from].name} 사람들 볼 낯이 없다.`, links:[]});
  }
  if(S.thirst>=3){ G.endGame('thirst'); return; }
  /* 좌초 — 연료도 살 고철도 없고 마을도 아닌 곳에서 며칠째. 구제는 무한하지 않다. */
  const atTown=!!(S.at&&D.nodes[S.at]&&D.nodes[S.at].stl);
  /* 빈 탱크로 길가에서 맞는 아침 — 구제가 먼저 온다(값은 오르고 세 번이 한계).
     고철이 있어도 살 곳이 없으면 영구 교착이 되는 소프트락 실측(2026-08-07 완주봇). */
  if(S.fuel<=0 && !atTown && !S.driving){
    /* 구제 사다리는 마지막 단(견인 20고철·걷기)을 계속 제안한다 — 셀 수 있는 건 값이지 횟수가 아니다 */
    setTimeout(()=>G.openRescue('nofuel','crisis_nofuel'), 800);
  }
  if(S.fuel<=0 && !atTown && S.scrap<20 && ((S._rescues&&S._rescues.nofuel)||0)>=3){
    S._strandedDays=(S._strandedDays||0)+1;
    if(S._strandedDays>=2){ G.endGame('stranded'); return; }
  } else S._strandedDays=0;
  /* 관측은 갱신되지 않으면 흐려진다 — 이틀 조용하면 표식이 한 단계 낡는다.
     이게 없으면 관측 5가 흡수 상태가 되어 늦은 완주는 구조적으로 기피 사망한다
     (2026-08-07 완주봇: ready 후 전원 shunned). 압박에는 대응 수단이 있어야 한다. */
  if(S.pursuit>0 && (S.day-(S._lastPursuitUp||0))>=2){
    S.pursuit--; S._lastPursuitUp=S.day;
    if(S.pursuit<G.PURSUIT_SHUNNED) UI.toast('📡 표식이 낡았다 — 관측 -1');
  }
  /* 기피 — 관측 문턱을 넘긴 채 마을이 계속 문을 닫으면 길 위에서 버티는 일만 남는다 */
  if(S.pursuit>=G.PURSUIT_SHUNNED && (S._shelterRefusals||0)>=2){
    /* 문전박대를 실제로 두 번 이상 겪은 뒤에만 — 길에서 자급하는 차는 기피로 죽지 않는다 */
    S._shunnedDays=(S._shunnedDays||0)+1;
    if(S._shunnedDays>=4){ G.endGame('shunned'); return; }
  } else S._shunnedDays=0;
  G.tickDeadline();
  G.save();
};
/* 전역 서울 제한일은 제거됐다. 기존 호출과 세이브 호환을 위해 빈 훅만 유지한다. */
G.tickDeadline = ()=>{};
G.moodAll = (d)=>{ for(const id of S.party){ S.comps[id].mood = clamp(S.comps[id].mood+d,0,100); } };
