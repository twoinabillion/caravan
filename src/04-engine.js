/* ═══════════════════ ENGINE ═══════════════════ */
const SAVE_KEY = 'seoul400_save_v1';
let S = null;               // game state
let rng = mulberry32(Date.now() % 2147483647);

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R = (n)=>rng()*n;
const pick = (arr)=>arr[Math.floor(rng()*arr.length)];
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

const G = {};

/* ── new game / save ── */
G.newGame = (mode, name)=>{
  S = {
    v:1, mode, name:(name||'').trim().slice(0,8)||null, day:1, min:7*60+30, at:'busan', driving:null,
    fuel:40, fuelMax:70, water:12, food:12, scrap:24, van:82, vanMax:100,
    items:{'부품':1,'의약품':1,'탄약':0},
    party:[], comps:{}, dog:false, _scrapKm:0,
    known:Object.keys(D.nodes).filter(id=>D.nodes[id].type!=='hidden'), visited:['busan'],
    flags:{}, pursuit:0, used:[], quest:null, recruitQ:null, wx:'clear', wxNext:'clear', up:{},
    notes:[], noteSeq:0, npcs:{}, stats:{km:0, events:0},
    thirst:0, hunger:0, ended:false, seed:Math.floor(Math.random()*1e9),
    fatigue:0, _dlv:0, _drowsyDay:0, _drowsyAt:-999, _lunchDay:0, _storyQueue:[],
    _recentEvents:[], _recentEventTypes:[], _eventBreather:0,
    combat:null, injuries:{}, _exploreDay:1, _exploreNodes:{}, _salvagedNodes:{}, _salvageCount:0,
  };
  rng = mulberry32(S.seed);
  S.wxNext = G.rollWx('clear');
  for(const id in D.npcs) S.npcs[id] = {att:0, met:false, chat:[]};
  for(const id in D.comps) S.comps[id] = {mood:65, bond:0, lvl:0, perks:[], pending:0};
  G.addNote({type:'장소', title:'부산 감천 부두', body:'모든 것이 시작된 곳. 달구지에 시동을 걸었다.', links:[]});
  G.addNote({type:'물건', title:'달구지', body:'낡은 한 톤 용달 트럭의 적재함에 폐자재 생활칸을 얹어 만든 이동식 집. 출발할 때는 겨우 먹고 잘 수 있는 작은 집이지만, 길에서 만날 사람에 맞춰 좌석·침대·부엌을 덧붙일 빈 틀과 볼트 자리가 남아 있다.', links:['할아버지']});
  G.addNote({type:'인물', title:'천리안', body:'2026년 중국이 미국의 AI·반도체망을 견제하려고 아시아에 배포한 TIANYAN의 한국 지역판 KOR-LOCAL. 사람들은 천리안이라 불렀다. 143년 동안 서울의 정리를 집행했고, 30일 뒤 외곽의 마지막 잔류구역 이송을 예고했다.', links:[]});
  G.addNote({type:'인물', title:'부모님', body:'엄마는 천리안 판단 검증 연구원, 아빠는 연산망 반도체 기술자였다. 예측과 실행 사이에 인간 확인을 되돌리는 수정안을 발표하려다 사라졌다. 가족 이송표의 사유는 비어 있다.', links:['천리안']});
  G.addNote({type:'인물', title:'할아버지', body:'나를 키운 늙은 정비사. 용달차에 생활칸을 올려 달구지를 함께 만들고 지난겨울 떠났다. 부모가 남긴 것을 끝낼 의무는 없지만, 가고 싶다면 이 차가 남산까지 갈 수 있다고 적었다.', links:['달구지','부모님']});
  G.save();
};
G.myName = ()=> (S && S.name) || '나';
G.save = ()=>{ if(!S||S.ended) return; try{ localStorage.setItem(SAVE_KEY, JSON.stringify(S)); }catch(e){} };
G.load = ()=>{ try{ const j = localStorage.getItem(SAVE_KEY); if(!j) return false;
  S = JSON.parse(j); rng = mulberry32(S.seed + (S.stats.events*7919));
  /* v1 → v2 마이그레이션: 유대/퍼크 필드 보강 */
  S._scrapKm = S._scrapKm||0;
  if(S.quest===undefined) S.quest=null;
  if(S.quest && !S.quest.kind) S.quest.kind='deliver';   // v1.2 세이브 의뢰 → 배달로
  if(S._qoffer===undefined) S._qoffer=null;
  if(!S.wx) S.wx = (S.driving&&S.driving.wx)||'clear';
  if(!S.wxNext) S.wxNext = G.rollWx(S.wx);
  if(!S.up) S.up={};
  if(S.fatigue===undefined) S.fatigue=0;
  if(S._dlv===undefined) S._dlv=0;
  if(S._drowsyDay===undefined) S._drowsyDay=0;
  if(S._drowsyAt===undefined) S._drowsyAt=-999;
  if(S._lunchDay===undefined) S._lunchDay=0;
  if(!Array.isArray(S._storyQueue)) S._storyQueue=[];
  if(!Array.isArray(S._recentEvents)) S._recentEvents=[];
  if(!Array.isArray(S._recentEventTypes)) S._recentEventTypes=[];
  if(!Number.isFinite(S._eventBreather)) S._eventBreather=0;
  if(S.recruitQ===undefined) S.recruitQ=null;
  if(S.combat===undefined) S.combat=null;
  if(!S.injuries||Array.isArray(S.injuries)) S.injuries={};
  if(!Number.isFinite(S._exploreDay)) S._exploreDay=S.day;
  if(!S._exploreNodes||Array.isArray(S._exploreNodes)) S._exploreNodes={};
  if(!S._salvagedNodes||Array.isArray(S._salvagedNodes)) S._salvagedNodes={};
  if(!Number.isFinite(S._salvageCount)) S._salvageCount=Object.keys(S._salvagedNodes).length;
  /* 즉시 영입이던 구버전에서 만남만 소진하고 합류하지 않은 경우,
     새 '합류 전 과제'를 다시 시작할 수 있도록 첫 만남을 복구한다. */
  const oldRecruitStarts={minji:'meet_scrapyard',parkss:'meet_bus',leo:'meet_hitchhiker',
    jaeyi:'jy_recruit',eunsu:'es_recruit',kangwoo:'kw_recruit'};
  if(!S.recruitQ) for(const [id,eid] of Object.entries(oldRecruitStarts)){
    if(!S.party.includes(id)) S.used=S.used.filter(x=>x!==eid);
  }
  /* 구버전 세이브에서도 은수의 결말 필수 단서가 랜덤 풀에 묻히지 않게 보정 */
  if(S.flags.es_backdoor_ready && !S.flags.es_truth){
    const sid=S.flags.es_v1194?'es_backdoor':'es_nightshift';
    if(!S.used.includes(sid) && !S._storyQueue.includes(sid)) S._storyQueue.push(sid);
  }
  /* 비히든 노드 전체 공개 (스파인 단절 버그 픽스 + 월드 확장 반영) */
  Object.keys(D.nodes).forEach(id=>{
    if(D.nodes[id].type!=='hidden' && !S.known.includes(id)) S.known.push(id); });
  for(const id in D.comps){
    const c = S.comps[id] || (S.comps[id]={mood:65});
    if(c.bond===undefined) c.bond=0;
    if(c.lvl===undefined) c.lvl=0;
    if(!c.perks) c.perks=[];
    if(c.pending===undefined) c.pending=0;
  }
  return true; }catch(e){ return false } };
G.hasSave = ()=>{ try{ return !!localStorage.getItem(SAVE_KEY) }catch(e){ return false } };
G.wipe = ()=>{ try{ localStorage.removeItem(SAVE_KEY) }catch(e){} };

/* ── helpers ── */
G.node = id=>D.nodes[id];
G.partySize = ()=> 1 + S.party.length;
/* 피로 3단계 — 디버프 문턱(60 연비/80 감속·졸음)과 동일선 */
G.fatigueStage = ()=> S.fatigue>=80?'bad' : S.fatigue>=60?'mid' : 'ok';
G.fatigueFace  = ()=> ({ok:'🙂',mid:'😑',bad:'😩'})[G.fatigueStage()];
G.hasComp = id=> S.party.includes(id);
G.isInjured = id=> !!(S&&S.injuries&&S.injuries[id]&&S.injuries[id].days>0);
G.injuryName = id=> id==='driver'?G.myName():(D.comps[id]&&D.comps[id].name)||id;
G.addInjury = (who,label,days)=>{
  let id=who;
  if(who==='party') id=S.party.length?pick(S.party):'driver';
  if(id!=='driver'&&!G.hasComp(id)) id='driver';
  const prev=S.injuries[id], left=Math.max(days||2,prev?prev.days:0);
  S.injuries[id]={label:label||'타박상',days:left};
  return {id,label:S.injuries[id].label,days:left};
};
G.healInjury = (who)=>{
  let id=who;
  if(who==='latest'||!id){
    const ids=Object.keys(S.injuries||{});
    id=ids.sort((a,b)=>S.injuries[b].days-S.injuries[a].days)[0];
  }
  if(!id||!S.injuries[id]) return null;
  const old={id,...S.injuries[id]}; delete S.injuries[id]; return old;
};
G.tickInjuries = ()=>{
  if(!S.injuries) return;
  for(const id of Object.keys(S.injuries)){
    S.injuries[id].days--;
    if(S.injuries[id].days<=0){
      UI.toast(`🩹 ${G.injuryName(id)}의 ${S.injuries[id].label}이 가라앉았다`);
      delete S.injuries[id];
    }
  }
};
G.edgeBetween = (a,b)=> D.edges.find(e=>(e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a));
G.neighbors = (id)=> D.edges.filter(e=>e[0]===id||e[1]===id).map(e=>({id:e[0]===id?e[1]:e[0], km:e[2], road:e[3]}));
G.fmtClock = ()=>{ const h=Math.floor(S.min/60)%24, m=Math.floor(S.min%60);
  return `DAY ${S.day} · ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; };
G.isNight = ()=>{ const h=S.min/60; return h>=19.5||h<5.5; };
G.regionOf = ()=>{ const n = S.driving ? G.node(S.driving.to) : G.node(S.at); return n.region; };
G.remainKm = ()=>{ // rough remaining to seoul via bfs shortest through known graph
  const dist={}; const q=['seoul']; dist.seoul=0;
  while(q.length){ const c=q.shift();
    for(const nb of G.neighbors(c)){ const d=dist[c]+nb.km;
      if(dist[nb.id]===undefined||d<dist[nb.id]){ dist[nb.id]=d; q.push(nb.id); } } }
  let base = S.driving ? (dist[S.driving.to]!==undefined? dist[S.driving.to]+ (S.driving.dist-S.driving.gone):999) : dist[S.at];
  return Math.max(0, Math.round(base??400));
};

/* ── 합류 전 의뢰 ── */
G.startRecruitQuest = (id)=>{
  const def=D.recruitQuests&&D.recruitQuests[id];
  if(!def||G.hasComp(id)||S.recruitQ) return false;
  const context=S.driving?[S.driving.to,S.driving.from]:[S.at];
  const target=context.find(n=>def.targets.includes(n))||def.targets[0];
  S.recruitQ={id,stage:'task',target,startedDay:S.day};
  UI.toast(`🤝 ${def.name}의 부탁 — ${D.nodes[target].name}`);
  G.save();
  return true;
};
G.rememberRecruitChoice = (choice)=>{
  if(!S.recruitQ||!choice) return false;
  const def=D.recruitQuests&&D.recruitQuests[S.recruitQ.id];
  if(!def||!def.approaches||!def.approaches[choice]) return false;
  S.recruitQ.choice=choice;
  S.recruitQ.choiceDay=S.day;
  return true;
};
G.recruitApproach = ()=>{
  const q=S&&S.recruitQ, def=q&&D.recruitQuests&&D.recruitQuests[q.id];
  return q&&q.choice&&def&&def.approaches ? def.approaches[q.choice] : null;
};
G.markRecruitReady = (id)=>{
  if(!S.recruitQ||S.recruitQ.id!==id) return false;
  S.recruitQ.stage='ready';
  S.recruitQ.readyDay=S.day;
  UI.toast(`✓ ${D.recruitQuests[id].name}의 일이 끝났다 — 합류를 이야기할 수 있다`);
  return true;
};
G.markRecruitRoad = (id)=>{
  if(!S.recruitQ||S.recruitQ.id!==id||S.recruitQ.stage!=='task') return false;
  S.recruitQ.stage='road';
  S.recruitQ.roadFrom=S.at;
  S.recruitQ.roadDay=S.day;
  UI.toast(`🚚 임시 동행 시작 — ${D.recruitQuests[id].name}, 다음 정차까지`);
  return true;
};
G.openRecruitStep = ()=>{
  const q=S.recruitQ;
  if(!q||S.driving) return false;
  const def=D.recruitQuests[q.id];
  if(!def) return false;
  if(q.stage==='task'){
    if(S.at!==q.target){ UI.toast(`🗺 ${D.nodes[q.target].name}에서 만나기로 했다`); return false; }
    G.openEventById(def.task); return true;
  }
  if(q.stage==='road'){
    UI.toast(`🚚 다음 정차까지 임시 동행을 이어간다 — ${def.name}`);
    return false;
  }
  if(q.stage==='follow'){
    if(S.at!==q.target){ UI.toast(`🗺 ${D.nodes[q.target].name}에서 할 말이 남았다 — ${def.name}`); return false; }
    if(Number.isFinite(q.roadDay)&&S.day<=q.roadDay){
      UI.toast(`🔥 ${def.name}와 길 위에서 하룻밤을 보낸 뒤 다시 이야기할 수 있다`);
      return false;
    }
    G.openEventById(def.follow); return true;
  }
  if(q.stage==='ready'){ G.openEventById(def.join); return true; }
  return false;
};

/* ── 유대 & 퍼크 (진전도) ── */
/* 부상 중에는 해당 동료의 전문 퍼크가 잠시 멈춘다. 기본 동행 효과는 유지된다. */
G.hasPerk = (pid)=> S && S.party.some(id=> !G.isInjured(id)&&(S.comps[id].perks||[]).includes(pid));
G.perkDef = (pid)=>{
  for(const cid in D.comps){ const P2=D.comps[cid].perks;
    for(const lv of [1,2]) for(const p of P2[lv]) if(p.id===pid) return p;
    if(P2[3].id===pid) return P2[3]; }
  return null;
};
G.bond = (id, amt)=>{
  if(!G.hasComp(id)) return;
  const c=S.comps[id];
  if(c.lvl>=3) { c.bond+=amt; return; }
  c.bond += amt;
  G.checkLevel(id);
};
G.checkLevel = (id)=>{
  const c=S.comps[id], nm=D.comps[id].name;
  while(c.lvl<3 && !c.pending && c.bond>=D.bondTh[c.lvl]){
    const next=c.lvl+1;
    if(next<3){ c.pending=next;
      UI.toast(`<span class="ic">✦</span>${nm}와의 유대가 깊어졌다 — 동료 카드에서 퍼크 선택`);
    } else { /* Lv3 시그니처(스토리)는 자동 습득 */
      c.lvl=3;
      const p=D.comps[id].perks[3];
      c.perks.push(p.id);
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
G.scheduleJourneyBeat = ()=>{
  if(!S||!D.journeyBeats) return null;
  const beat=D.journeyBeats.find(b=>S.stats.km>=b.km
    && !S.used.includes(b.id) && !S._storyQueue.includes(b.id));
  if(beat) G.queueStory(beat.id);
  return beat&&beat.id;
};
G.popStory = ()=>{
  while(S&&S._storyQueue&&S._storyQueue.length){
    const id=S._storyQueue.shift(), ev=D.events.find(e=>e.id===id);
    if(ev && (!ev.once||!S.used.includes(id))) return id;
  }
  return null;
};
/* 이벤트 해석 후 훅: 유대 획득 + 직업 부가 수확 */
G.afterChoice = (evd, choice)=>{
  const extra=[];
  const actingComp=choice.req&&(choice.req.healthyComp||choice.req.comp);
  if(actingComp){ G.bond(actingComp, 2); extra.push({t:`✦ ${D.comps[actingComp].name} 유대 +2`, c:'item'}); }
  else if(choice.req&&choice.req.perk){ const cid=Object.keys(D.comps).find(k=>JSON.stringify(D.comps[k].perks).includes(choice.req.perk));
    if(cid&&G.hasComp(cid)){ G.bond(cid,2); extra.push({t:`✦ ${D.comps[cid].name} 유대 +2`, c:'item'}); } }
  if(evd.needsComp&&(!choice.req||choice.req.comp!==evd.needsComp)){ G.bond(evd.needsComp, 2);
    extra.push({t:`✦ ${D.comps[evd.needsComp].name} 유대 +2`, c:'item'}); }
  if(evd.type==='탐색'){
    if(G.hasPerk('mj_eye')&&rng()<0.25){ S.items['부품']=(S.items['부품']||0)+1; extra.push({t:'🔧 폐차장의 눈: 부품 +1', c:'item'}); }
    if(G.hasPerk('pss_herb')&&rng()<0.2){ S.items['의약품']=(S.items['의약품']||0)+1; extra.push({t:'💊 약초학: 의약품 +1', c:'item'}); }
  }
  return extra;
};
G.combatOdds = (choice)=>{
  const base=typeof choice.combatRoll==='number'?choice.combatRoll:0.52;
  const edge=S&&S.combat?S.combat.edge||0:0;
  let bonus=edge*0.12;
  if(S&&S.up&&S.up.armor) bonus+=0.04;
  if(S&&S.up&&S.up.scope&&choice.tactic==='사격') bonus+=0.08;
  if(G.isInjured('driver')) bonus-=0.08;
  return clamp(base+bonus,0.12,0.9);
};
G.combatGrade = choice=>{
  const p=G.combatOdds(choice);
  return p>=0.68?'우세':p<0.42?'불리':'팽팽';
};
G.pickOutcome = (evd, choice)=>{
  if(choice.req&&choice.req.item==='탄약'&&G.hasPerk('kw_sniper')) return choice.out[0];
  if(choice.combatRoll!==undefined&&choice.out.length>1)
    return rng()<G.combatOdds(choice)?choice.out[0]:choice.out[1];
  return G.rollOut(choice.out);
};

/* ── notes (지식 그래프) ── */
G.addNote = (n)=>{
  const ex = S.notes.find(x=>x.title===n.title);
  if(ex){ if(n.body && !ex.body.includes(n.body)) ex.body += '\n'+n.body;
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
G.advance = (mins)=>{
  let m = mins;
  while(m>0){
    const toMid = 24*60 - S.min;
    const step = Math.min(m, toMid);
    S.min += step; m -= step;
    /* 깨어 있는 모든 시간에 피로가 쌓인다 (수면=camp가 유일한 리셋) */
    const injuryMul=G.isInjured('driver')?1.2:1;
    S.fatigue = clamp(S.fatigue + step*0.045*(1-G.driverLv()*0.06)*injuryMul, 0, 100);
    /* 정오 점심 */
    if(S.day>S._lunchDay && S.min>=12*60){ S._lunchDay=S.day; G.lunch(); }
    if(S.min>=24*60){ S.min=0; S.day++; G.dawn(); }
  }
};
G.lunch = ()=>{
  const need = Math.ceil(G.partySize()/2);
  const fOk = S.food>=need, wOk = true;   // 물은 아침 배급만 (v2.23 밸런스)
  S.food=Math.max(0,S.food-need);
  if(fOk&&wOk){ UI.toast(`🍚 점심 — 식량 -${need}`);
    if(typeof SCENE!=='undefined') SCENE.showMeal(16);
    if(S.up&&S.up.awning&&!S.driving) S.fatigue=Math.max(0,S.fatigue-3);
    if(S.up&&S.up.kitchen) G.moodAll(1);
    if(S.party.length&&rng()<0.6&&D.mealBanter) UI.speak({who:'sys', t:pick(D.mealBanter)}); }
  else { G.moodAll(-4); S.fatigue=clamp(S.fatigue+8,0,100);
    UI.toast('🍚 점심을 걸렀다 — 사기·체력이 떨어진다'); }
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
  let n = G.partySize();
  if(G.hasPerk('kw_ration')&&n>1) n--;   // 강우 자급자족
  // 아침 배급: 1 water + 1 food per person
  if(S.water>=n){ S.water-=n; S.thirst=0; } else { S.water=0; S.thirst++; G.moodAll(-8); S.fatigue=clamp(S.fatigue+15,0,100); UI.toast('💧 물이 부족하다…'); }
  if(S.food>=n){ S.food-=n; S.hunger=0; } else { S.food=0; S.hunger++; G.moodAll(-6); S.fatigue=clamp(S.fatigue+15,0,100); }
  if(S.water>0||S.food>0){ UI.toast(`🍙 아침 배급 — 물·식량 -${n}`);
    if(typeof SCENE!=='undefined') SCENE.showMeal(16);
    if(S.up&&S.up.awning&&!S.driving) S.fatigue=Math.max(0,S.fatigue-3);
    if(S.up&&S.up.kitchen) G.moodAll(1);
    if(S.party.length&&rng()<0.6&&D.mealBanter) UI.speak({who:'sys', t:pick(D.mealBanter)}); }
  if(S.up&&S.up.beehive&&rng()<0.3){ S.food+=1; G.moodAll(2);
    UI.toast('🐝 지붕 벌통에서 아침 꿀 — 식량 +1'); }
  if(G.hasComp('leo')) G.moodAll(3); // 레오의 아침 기타
  if(S.up&&S.up.garden){ S.food += S.up.garden2?2:1; }
  if(S.up&&S.up.fridge){ S._fridgeD=(S._fridgeD||0)+1;
    if(S._fridgeD>=3){ S._fridgeD=0; S.food+=1; UI.toast('🧊 냉장 박스 — 아낀 식량 +1'); } }
  if(S.up&&S.up.collector){ S.water += G.isWet()?2:1; }
  if(S.fatigue>=70){ G.moodAll(-3); UI.toast(S.party.length?'😴 다들 피곤이 얼굴에 앉았다 — 쉬어야 한다':'😴 피곤이 얼굴에 앉았다 — 쉬어야 한다'); }
  /* 의뢰 기한 */
  if(S.quest && S.day>S.quest.due){
    const q=S.quest; S.quest=null;
    const K=G.QKIND[q.kind]||G.QKIND.deliver;
    const fromStl=D.stls[D.nodes[q.from].stl];
    if(fromStl) fromStl.npcs.forEach(nid=>{ S.npcs[nid].att-=(q.kind==='express'?8:5); });
    UI.toast(`${K.ic} 의뢰 기한 초과 — ${G.questLabel(q)} 실패`);
    G.addNote({type:'사건', title:K.nm+' 실패: '+G.questLabel(q),
      body:`기한(${q.due}일차)을 넘겼다. ${D.nodes[q.from].name} 사람들 볼 낯이 없다.`, links:[]});
  }
  if(S.thirst>=3){ G.endGame('thirst'); return; }
  if(S.hunger===1) G.queueCrisis('crisis_hungry');
  G.save();
};
G.moodAll = (d)=>{ for(const id of S.party){ S.comps[id].mood = clamp(S.comps[id].mood+d,0,100); } };

/* ── travel ── */
G.canTravelTo = (id)=>{
  if(S.driving||S.ended) return {ok:false};
  const e = G.edgeBetween(S.at,id);
  if(!e) return {ok:false, why:'인접한 길이 없다'};
  if(!S.known.includes(id)) return {ok:false, why:'모르는 곳이다'};
  const fuelNeed = G.fuelFor(e[2], e[3]);
  if(S.fuel<=0) return {ok:false, why:'연료가 없다'};
  return {ok:true, km:e[2], road:e[3], fuel:fuelNeed};
};
G.fuelFor = (km,road)=>{ let per = 1/6.0; if(road==='rough') per*=1.35; if(road==='high') per*=0.92;
  if(G.hasComp('minji')) per*=0.92;
  if(G.hasPerk('mj_fuel')) per*=0.92;
  if(road==='rough' && S && S.up && S.up.mudtires) per/=1.15;   // 험로 타이어
  if(S){ let wxPen = S.wx==='storm'?0.12 : S.wx==='dust'?0.08 : 0;
    if(S.up&&S.up.snorkel) wxPen/=2;                              // 스노클
    per*=(1+wxPen);
    if(S.up&&S.up.solar) per*=0.92;
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
  UI.toast(`${def.guest.ic} 임시 동행 — ${def.guest.title}`);
};

G.startTravel = (to)=>{
  const chk = G.canTravelTo(to); if(!chk.ok) return false;
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
  }
  S.driving = {from:S.at, to, dist:chk.km, gone:0, road:chk.road, wx, slots, si:0};
  G.prepareRecruitGuest(S.driving);
  S.at = null;
  if(S.mode==='offroad') OFF.prefetch();
  UI.onDepart();
  G.save();
  return true;
};

const KMH = 44;                    // 주행 속도
const TIMESCALE = 2.2;             // 실제 1초 = 게임 2.2분
let banterCd = 6;                  // 첫 잡담까지 몇 초
let radioCd = 30;                  // 라디오 첫 수신까지

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
  S.fuel = Math.max(0, S.fuel - km*per*(dv.guestFuel||1));
  // van wear
  let wearMul = S.up&&S.up.susp? 0.5:1;
  if(S.up&&S.up.mudtires&&dv.road==='rough') wearMul*=0.6;
  wearMul*=dv.guestWear||1;
  if(dv.road==='rough') S.van = Math.max(0, S.van - km*(G.isWet()?0.09:0.06)*wearMul);
  if(S.wx==='storm') S.van = Math.max(0, S.van - km*0.03*wearMul);
  // 재이: 까치의 눈
  if(G.hasPerk('jy_magpie')){ S._scrapKm=(S._scrapKm||0)+km;
    if(S._scrapKm>=25){ S._scrapKm-=25; S.scrap++; UI.toast('🎒 재이가 길에서 쓸 만한 고철을 낚아챘다 +1'); } }
  // 운전은 추가 피로 (밤 운전은 특히)
  const nightFtg = G.isNight()? (S.up&&S.up.lightbar?0.049:0.075) : 0.04;   // 라이트바=밤길이 덜 갉아먹음
  const bunkMul = S.up&&S.up.bunk? 0.8:1;                                    // 2층 침대=교대 수면
  S.fatigue = clamp(S.fatigue + gm*nightFtg*bunkMul*(1-G.driverLv()*0.06)*(dv.guestFatigue||1), 0, 100);
  G.checkDriverLv();
  G.advance(gm);
  if(S.ended) return;
  // crises
  if(S.fuel<=0 && dv.gone<dv.dist){ G.openEventById('crisis_nofuel'); return; }
  if(S.van<=0){ S.van=0; G.openEventById('crisis_breakdown'); return; }
  if(S.fatigue>=99){ G.openEventById('crisis_collapse'); return; }
  if(S.fatigue>=85 && (S.day*1440+S.min)-S._drowsyAt>240){
    S._drowsyAt=S.day*1440+S.min; G.openEventById('crisis_drowsy'); return; }
  // event slots
  if(dv.si < dv.slots.length && dv.gone >= dv.slots[dv.si].at){
    const slot = dv.slots[dv.si++];
    if(slot.special==='bridge'){ G.openEvent(D.bridgeEvent); return; }
    if(slot.gen){ OFF.playGenerated(()=>G.fireDriveEvent()); return; }
    G.fireDriveEvent(); return;
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
    if(ev.needsDog && !S.dog) return false;
    if(ev.minParty && S.party.length<ev.minParty) return false;
    if(ev.minPursuit && S.pursuit<ev.minPursuit) return false;
    if(ev.needFlag && !S.flags[ev.needFlag]) return false;
    if(ev.needFlag2 && !S.flags[ev.needFlag2]) return false;
    if(ev.needWx && S.wx!==ev.needWx) return false;
    if(ev.needRain && !G.isWet()) return false;
    if(ev.needLowWater && S.water>2) return false;
    if(ev.hiddenTarget && !G.unknownHidden().length) return false;
    if(ev.id==='comp_sick' && !S.flags.food_poison) return false;
    return true;
  });
};
G.unknownHidden = ()=> Object.keys(D.nodes).filter(id=>D.nodes[id].type==='hidden' && !D.nodes[id].secret && !S.known.includes(id));

/* ── 사건 감독 ──
   콘텐츠 수를 늘리는 대신, 방금 본 사건과 같은 종류가 다시 겹치지 않게 하고
   무거운 본편·위기 뒤에는 한 호흡 가벼운 길 풍경을 우선한다. */
G.eventIsContextual = ev=> !!(ev && ev.once && (
  ev.priority || ev.needFlag || ev.needFlag2 || ev.needFlagMin || ev.needUp ||
  ev.needsComp2 || ev.needBond || ev.maxRemain!==undefined || ev.recruitStart
));
G.eventIsHeavy = ev=> !!(ev && (
  ev.ai || ev.priority || ['스토리','추적','위기'].includes(ev.type) ||
  (ev.once && (ev.needFlag || ev.needFlag2 || ev.needFlagMin))
));
G.eventIsCalm = ev=> !!(ev && !G.eventIsHeavy(ev) && !ev.minPursuit &&
  ['정경','동행','발견'].includes(ev.type));
G.directEventPool = (pool,opt={})=>{
  let out=(pool||[]).filter(Boolean);
  if(!out.length||!S) return out;
  const recent=new Set((S._recentEvents||[]).slice(-10));
  const fresh=out.filter(e=>!recent.has(e.id));
  if(fresh.length>=Math.min(3,out.length)) out=fresh;

  if(opt.breather!==false && S._eventBreather>0){
    const calm=out.filter(G.eventIsCalm);
    if(calm.length) out=calm;
    S._eventBreather=Math.max(0,S._eventBreather-1);
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
  if(ev.id){
    S._recentEvents.push(ev.id);
    if(S._recentEvents.length>16) S._recentEvents.splice(0,S._recentEvents.length-16);
  }
  if(ev.type){
    S._recentEventTypes.push(ev.type);
    if(S._recentEventTypes.length>6) S._recentEventTypes.splice(0,S._recentEventTypes.length-6);
  }
  if(G.eventIsHeavy(ev)) S._eventBreather=Math.max(S._eventBreather,1);
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
  const wOf=(e)=>{ let w=e.w;
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
  G.openEvent(evd);
};

G.openEventById = (id)=>{ const ev = D.events.find(e=>e.id===id); if(ev) G.openEvent(ev); };
G.openEvent = (evd)=>{
  if(evd.once) S.used.push(evd.id);
  G.rememberEvent(evd);
  S.stats.events++;
  UI.showEvent(evd);
};

/* fx 적용 → 표시용 칩 목록 반환 */
G.applyFx = (fx)=>{
  const chips = [];
  if(!fx) return chips;
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
  }
  if(fx.van<0 && S.up&&S.up.armor){ fx={...fx, van:-Math.ceil(-fx.van*0.7)};
    chips.push({t:'🛡 장갑판: 피해 감소', c:'plus'}); }
  if(fx.van<0 && S.up&&S.up.bullbar){ fx={...fx, van:-Math.ceil(-fx.van*0.85)};
    chips.push({t:'🛡 전면 가드: 피해 감소', c:'plus'}); }
  if(fx.combatStart){
    const c=fx.combatStart;
    S.combat={id:c.id||'encounter',threat:c.threat||'위협',edge:c.edge||0,startedDay:S.day};
  }
  if(fx.combatEdge&&S.combat){
    S.combat.edge=clamp((S.combat.edge||0)+fx.combatEdge,-2,3);
    chips.push({t:`전세 ${fx.combatEdge>0?'우세 +':'불리 '}${fx.combatEdge}`,c:fx.combatEdge>0?'plus':'minus'});
  }
  const num = (k,label,unit)=>{ if(fx[k]){ const v=fx[k];
    if(k==='fuel') S.fuel=clamp(S.fuel+v,0,S.fuelMax);
    else if(k==='water') S.water=Math.max(0,S.water+v);
    else if(k==='food') S.food=Math.max(0,S.food+v);
    else if(k==='scrap') S.scrap=Math.max(0,S.scrap+v);
    else if(k==='van') S.van=clamp(S.van+v,0,S.vanMax);
    chips.push({t:`${label} ${v>0?'+':''}${v}${unit||''}`, c:v>0?'plus':'minus'}); } };
  num('fuel','연료','L'); num('water','물'); num('food','식량'); num('scrap','고철'); num('van','차체','%');
  if(fx.time){ G.advance(fx.time); chips.push({t:`⏱ ${fx.time>=60?Math.round(fx.time/60*10)/10+'시간':fx.time+'분'}`, c:''}); }
  if(fx.fatigue){ S.fatigue=clamp(S.fatigue+fx.fatigue,0,100);
    chips.push({t:`😴 피로 ${fx.fatigue>0?'+':''}${fx.fatigue}`, c:fx.fatigue<0?'plus':'minus'}); }
  if(fx.skipKm && S.driving){ S.driving.gone=Math.min(S.driving.dist, S.driving.gone+fx.skipKm);
    chips.push({t:`🛣 지름길 ${fx.skipKm}km`, c:'plus'}); }
  if(fx.moodAll){ G.moodAll(fx.moodAll); if(S.party.length) chips.push({t:`사기 ${fx.moodAll>0?'+':''}${fx.moodAll}`, c:fx.moodAll>0?'plus':'minus'}); }
  if(fx.mood){ for(const id in fx.mood){ if(S.comps[id]!==undefined&&G.hasComp(id)){ S.comps[id].mood=clamp(S.comps[id].mood+fx.mood[id],0,100);
    chips.push({t:`${D.comps[id].name} ${fx.mood[id]>0?'+':''}${fx.mood[id]}`, c:fx.mood[id]>0?'plus':'minus'}); } } }
  if(fx.item){ for(const nm in fx.item){ const v=fx.item[nm]; S.items[nm]=Math.max(0,(S.items[nm]||0)+v);
    chips.push({t:`${nm} ${v>0?'+':''}${v}`, c:'item'}); } }
  if(fx.flag) S.flags[fx.flag]=true;
  if(fx.flag2) S.flags[fx.flag2]=true;
  if(fx.flagCount) S.flags[fx.flagCount]=(S.flags[fx.flagCount]||0)+1;
  if(fx.unflag) delete S.flags[fx.unflag];
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
    if(S.combat) chips.push({t:'교전 종료',c:'plus'});
    S.combat=null;
  }
  if(fx.chain){ S._chain = fx.chain; }   // 시트 닫힐 때 UI가 이어서 연다 (시네마틱 연쇄)
  if(fx.startRecruit) G.startRecruitQuest(fx.startRecruit);
  if(fx.recruitChoice) G.rememberRecruitChoice(fx.recruitChoice);
  if(fx.recruitRoad) G.markRecruitRoad(fx.recruitRoad);
  if(fx.recruitReady) G.markRecruitReady(fx.recruitReady);
  if(fx.recruit) G.doRecruit(fx.recruit);
  if(fx.note) G.addNote(fx.note);
  if(fx.gameover) G.endGame(fx.gameover);
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
  if(req.traces && G.traceCount()<req.traces) return {ok:false, t:`세대의 흔적 ${req.traces}개 필요`};
  if(req.party && S.party.length<req.party) return {ok:false, t:`동료 ${req.party}명 필요`};
  if(req.stories && G.deedsDone().filter(d=>d.cat==='동료').length<req.stories)
    return {ok:false, t:`개인 서사 ${req.stories}개 필요`};
  if(req.comp && !G.hasComp(req.comp)) return {ok:false, t:`${D.comps[req.comp].name} 필요`};
  if(req.healthyComp){
    if(!G.hasComp(req.healthyComp)) return {ok:false, t:`${D.comps[req.healthyComp].name} 필요`};
    if(G.isInjured(req.healthyComp)) return {ok:false, t:`${D.comps[req.healthyComp].name} 부상 회복 필요`};
  }
  if(req.up && !(S.up&&S.up[req.up])) return {ok:false, t:`${(G.upDef(req.up)||{nm:req.up}).nm} 필요`};
  if(req.dog && !S.dog) return {ok:false, t:'보리가 없다'};
  if(req.item && !(S.items[req.item]>0)) return {ok:false, t:`${req.item} 필요`};
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
  if(req.healthyComp) parts.push(`전투 가능: ${D.comps[req.healthyComp].name}${G.isInjured(req.healthyComp)?' (부상)':''}`);
  if(req.item) parts.push(`아이템: ${req.item}${req.item2?'+'+req.item2:''}`);
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
  if(req.traces&&G.traceCount()<req.traces) return false;
  if(req.party&&S.party.length<req.party) return false;
  if(req.stories&&G.deedsDone().filter(d=>d.cat==='동료').length<req.stories) return false;
  if(req.comp&&!G.hasComp(req.comp)) return false;
  if(req.healthyComp&&!G.hasComp(req.healthyComp)) return false;
  if(req.up&&!(S.up&&S.up[req.up])) return false;
  if(req.dog&&!S.dog) return false;
  return true;
};
G.reqCostText = (req)=>{
  if(!req) return '';
  const parts=[];
  if(req.item) parts.push(`${req.item}${req.item2?' + '+req.item2:''}`);
  if(req.scrap) parts.push(`고철 ${req.scrap}`);
  if(req.fuel) parts.push(`연료 ${req.fuel}L`);
  if(req.water) parts.push(`물 ${req.water}`);
  if(req.food) parts.push(`식량 ${req.food}`);
  return parts.join(' · ');
};
G.rollOut = (outs)=>{
  const total = outs.reduce((s,o)=>s+o.p,0); let r=rng()*total;
  for(const o of outs){ r-=o.p; if(r<=0) return o } return outs[outs.length-1];
};

G.doRecruit = (id)=>{
  if(G.hasComp(id) || S.party.length>=G.maxParty()) return false;
  S.party.push(id); S.comps[id] = S.comps[id]||{mood:65};
  if(S.comps[id].mood===undefined) S.comps[id].mood=65;
  S.comps[id].bond=Math.max(S.comps[id].bond||0,4);
  if(id==='leo') S.dog=true;
  if(S.recruitQ&&S.recruitQ.id===id) S.recruitQ=null;
  G.addNote({type:'인물',title:D.comps[id].name,
    body:`떠나기 전의 일을 함께 끝낸 뒤 달구지에 합류했다. ${D.comps[id].bio}`,links:[]});
  UI.toast(`<span class="ic">${D.comps[id].face}</span>${D.comps[id].name}, 달구지에 탑승`);
  const nextSeat=G.nextSeatUpgrade();
  if(S.party.length>=G.maxParty()&&nextSeat)
    setTimeout(()=>UI.toast(`💺 달구지가 찼다 — 다음 자리: ${nextSeat.nm}`),900);
  G.save(); return true;
};

/* ── arrival ── */
G.arrive = ()=>{
  const completedDrive=S.driving;
  const to = S.driving.to;
  const road = S.driving.road;
  S.at = to; S.driving = null;
  if(completedDrive&&completedDrive.guestFind){
    S.scrap+=completedDrive.guestFind;
    UI.toast(`🧰 재이가 길가에서 쓸 만한 고철을 챙겼다 +${completedDrive.guestFind}`);
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
    setTimeout(()=>G.openEventById('perimeter_first'), arrivalDelay);
    G.save(); return; }
  if(S.fuel<=0){ setTimeout(()=>G.openEventById('crisis_nofuel'), 700); }   // 도착 직후 빈 탱크 — 잠김 방지
  const loc = D.events.find(e=>e.locEvent===to && !S.used.includes(e.id)
    && (!e.needsComp||G.hasComp(e.needsComp)) && (!e.needFlag||S.flags[e.needFlag]));
  const arrivalDelay=UI.onArrive();
  if(S.recruitQ&&S.recruitQ.stage==='task'&&S.recruitQ.target===to)
    setTimeout(()=>UI.toast(`🤝 ${D.recruitQuests[S.recruitQ.id].name}의 부탁을 진행할 수 있다`),arrivalDelay);
  if(loc){ setTimeout(()=>G.openEvent(loc), arrivalDelay); }
  else if(!G.maybeCrisis()){
    const queued=G.popStory();
    if(queued) setTimeout(()=>G.openEventById(queued), arrivalDelay);
    else if(n.stl){ /* settlement panel via UI */ }
  }
  G.save();
};

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
G.explore = ()=>{
  if(S.driving||UI.modalOpen()) return false;
  const status=G.exploreStatus();
  if(!status.ok){ UI.toast(`🔦 ${status.reason}`); UI.renderAll(); return false; }
  if(S._exploreDay!==S.day){ S._exploreDay=S.day; S._exploreNodes={}; }
  S._exploreNodes[S.at]=status.tries+1;
  let freshHaul='';
  if(status.fresh){
    S._salvagedNodes[S.at]=true; S._salvageCount++;
    S.scrap+=4; freshHaul=' · 고철 +4';
    if(S._salvageCount%3===0){
      S.items['부품']=(S.items['부품']||0)+1;
      freshHaul+=' · 부품 +1';
    }
  }
  G.advance(status.mins);
  S.fatigue=clamp(S.fatigue+status.fatigue,0,100);
  const pool = G.eligible('탐색');
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
  const total=pool.reduce((s,e)=>s+e.w*(G.eventIsContextual(e)?2.1:1),0); let r=rng()*total;
  let evd=pool[0]; for(const e of pool){ r-=e.w*(G.eventIsContextual(e)?2.1:1); if(r<=0){evd=e;break} } G.openEvent(evd); };
G.camp = (msg)=>{
  if(S.driving||UI.modalOpen()) return;
  // advance to next 06:30
  const target = 6.5*60;
  let mins = (24*60 - S.min + target); if(S.min < target) mins = target - S.min;
  G.advance(mins);
  let mood=6, vanFix=4;
  if(G.hasPerk('pss_night')) mood+=3;
  if(G.hasPerk('leo_fire')) mood+=4;
  if(G.hasPerk('mj_camp')) vanFix+=6;
  if(S.up&&S.up.solar) vanFix+=3;
  if(S.up&&S.up.awning) mood+=2;
  if(S.up&&S.up.stove) mood+= G.isWet()?3:2;
  S.fatigue=0;
  G.moodAll(mood); S.van = clamp(S.van+vanFix,0,S.vanMax);
  if(G.hasPerk('jy_break')){ S.scrap+=2; }
  if(G.isWet()){ S.water+=2; UI.toast('💧 빗물받이 가득 — 물 +2'); }
  if(G.hasPerk('es_tap')&&rng()<0.25){ const h=G.nearestHidden();
    if(h){ S.known.push(h); UI.toast(`<span class="ic">📡</span>은수의 도청 — ${D.nodes[h].name}`, 'discover'); } }
  if(S.party.length){ const lucky=pick(S.party); G.bond(lucky,1); }
  const inTown = !!(S.at && D.nodes[S.at] && D.nodes[S.at].stl);
  UI.toast(msg|| (inTown?'🏘 마을 한켠에 차를 대고 잤다':'🔥 야영으로 하루를 마쳤다'));
  /* 노숙 리스크 — 마을 밖에서 잘 때만 */
  if(!inTown){
    let risk = G.regionOf()==='north'? 0.45:0.33;
    if(S.dog) risk-=0.10;
    if(G.hasPerk('kw_guard')) risk-=0.10;
    if(S.up&&S.up.curtain) risk-=0.07;
    if(rng()<Math.max(0.08,risk)){
      const north = G.regionOf()==='north';
      const r=rng();
      const ev = north? (r<0.45?'camp_scan': r<0.7?'camp_thief': r<0.87?'camp_dogs':'camp_visitor')
                      : (r<0.32?'camp_thief': r<0.6?'camp_dogs':'camp_visitor');
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
    /* 등장 화자 전원이 실제 탑승 중이어야 함 (동료만 검사, 나/sys 제외) */
    for(const ln of c.lines){ const w=ln[0];
      if(w!=='나'&&w!=='sys'&&D.comps[w]&&!G.hasComp(w)) return false; }
    return true; });
  if(!pool.length) return null;
  const c=pool[Math.floor(rng()*pool.length)];
  lastChat=D.chats.indexOf(c);
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
G.canBuyUp = (id)=>{
  const u=G.upDef(id); if(!u||S.up[id]) return {ok:false, why:'장착됨'};
  if(u.needs&&!S.up[u.needs]) return {ok:false, why:G.upDef(u.needs).nm+' 필요'};
  if(S.scrap<u.cost.scrap) return {ok:false, why:'고철 부족'};
  if((u.cost.parts||0)>(S.items['부품']||0)) return {ok:false, why:'부품 부족'};
  return {ok:true};
};
G.buyUpgrade = (id)=>{
  const chk=G.canBuyUp(id); if(!chk.ok) return false;
  const u=G.upDef(id);
  S.scrap-=u.cost.scrap;
  if(u.cost.parts) S.items['부품']-=u.cost.parts;
  S.up[id]=true;
  if(id==='tank1'||id==='tank2'){ S.fuelMax+=25; }
  if(id==='armor'){ S.vanMax+=25; S.van+=25; }
  const stage=u.seat?G.vanStage():null;
  UI.toast(`${u.ic} ${u.nm} 장착 완료${u.seat?` — ${stage.nm} · 동료 자리 ${G.maxParty()}명`:''}`);
  G.addNote({type:'사건', title:'달구지 개조: '+u.nm,
    body:(stage?stage.build:u.d)+' — 달구지가 조금 더 우리 집이 됐다.', links:[]});
  G.save(); return true;
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
  const worldN=S.flags.resist_revealed?G.cellsLinked().length:0;
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
G.endGame = (kind)=>{
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
