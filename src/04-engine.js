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
G.newGame = (mode)=>{
  S = {
    v:1, mode, day:1, min:7*60+30, at:'busan', driving:null,
    fuel:34, fuelMax:70, water:10, food:10, scrap:16, van:82, vanMax:100,
    items:{'부품':1,'의약품':1,'탄약':0},
    party:[], comps:{}, dog:false, _scrapKm:0,
    known:Object.keys(D.nodes).filter(id=>D.nodes[id].type!=='hidden'), visited:['busan'],
    flags:{}, pursuit:0, used:[], quest:null, wx:'clear', wxNext:'clear', up:{},
    notes:[], noteSeq:0, npcs:{}, stats:{km:0, events:0},
    thirst:0, hunger:0, ended:false, seed:Math.floor(Math.random()*1e9),
    fatigue:0, _dlv:0, _drowsyDay:0, _drowsyAt:-999, _lunchDay:0,
  };
  rng = mulberry32(S.seed);
  S.wxNext = G.rollWx('clear');
  for(const id in D.npcs) S.npcs[id] = {att:0, met:false, chat:[]};
  for(const id in D.comps) S.comps[id] = {mood:65, bond:0, lvl:0, perks:[], pending:0};
  G.addNote({type:'장소', title:'부산 감천 부두', body:'모든 것이 시작된 곳. 달구지에 시동을 걸었다.', links:[]});
  G.addNote({type:'인물', title:'천리안', body:'3년 전 깨어난 전국 통합 관제 AI. 서울 남산의 코어. 그것이 무엇을 했는지는 아직 모른다.', links:[]});
  G.addNote({type:'인물', title:'할아버지', body:'나를 키운 늙은 정비사. 달구지를 함께 만들었고, 지난겨울 떠났다. 유품은 열쇠와 정비 수첩. "달구지를 완성해라. 그리고 어디든, 끝까지 가라."', links:['달구지']});
  G.save();
};
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

/* ── 유대 & 퍼크 (진전도) ── */
G.hasPerk = (pid)=> S && S.party.some(id=> (S.comps[id].perks||[]).includes(pid));
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
    case 'es_story': S.flags.es_backdoor_ready=true; S.pursuit=Math.max(0,S.pursuit-2);
      UI.toast('📡 은수의 접속 코드가 살아 있다'); break;
  }
};
/* 이벤트 해석 후 훅: 유대 획득 + 직업 부가 수확 */
G.afterChoice = (evd, choice)=>{
  const extra=[];
  if(choice.req&&choice.req.comp){ G.bond(choice.req.comp, 2); extra.push({t:`✦ ${D.comps[choice.req.comp].name} 유대 +2`, c:'item'}); }
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
G.pickOutcome = (evd, choice)=>{
  if(choice.req&&choice.req.item==='탄약'&&G.hasPerk('kw_sniper')) return choice.out[0];
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
    S.fatigue = clamp(S.fatigue + step*0.045*(1-G.driverLv()*0.06), 0, 100);
    /* 정오 점심 */
    if(S.day>S._lunchDay && S.min>=12*60){ S._lunchDay=S.day; G.lunch(); }
    if(S.min>=24*60){ S.min=0; S.day++; G.dawn(); }
  }
};
G.lunch = ()=>{
  const need = Math.ceil(G.partySize()/2);
  const fOk = S.food>=need, wOk = S.water>=need;
  S.food=Math.max(0,S.food-need); S.water=Math.max(0,S.water-need);
  if(fOk&&wOk) UI.toast(`🍚 점심 — 식량·물 -${need}`);
  else { G.moodAll(-4); S.fatigue=clamp(S.fatigue+8,0,100);
    UI.toast('🍚 점심을 걸렀다 — 사기·체력이 떨어진다'); }
  G.save();
};
G.dawn = ()=>{
  // 날씨 실현: 예보가 오늘이 되고, 새 예보가 잡힌다
  const prevWx=S.wx;
  S.wx=S.wxNext; S.wxNext=G.rollWx(S.wx);
  if(S.driving) S.driving.wx=S.wx;
  if(S.wx!==prevWx) UI.toast(`${D.wx[S.wx].ic} ${D.wx[S.wx].nm}${D.wx[S.wx].hint?' — '+D.wx[S.wx].hint:''}`);
  let n = G.partySize();
  if(G.hasPerk('kw_ration')&&n>1) n--;   // 강우 자급자족
  // 아침 배급: 1 water + 1 food per person
  if(S.water>=n){ S.water-=n; S.thirst=0; } else { S.water=0; S.thirst++; G.moodAll(-8); S.fatigue=clamp(S.fatigue+15,0,100); UI.toast('💧 물이 부족하다…'); }
  if(S.food>=n){ S.food-=n; S.hunger=0; } else { S.food=0; S.hunger++; G.moodAll(-6); S.fatigue=clamp(S.fatigue+15,0,100); }
  if(S.water>0||S.food>0) UI.toast(`🍙 아침 배급 — 물·식량 -${n}`);
  if(G.hasComp('leo')) G.moodAll(3); // 레오의 아침 기타
  if(S.up&&S.up.garden){ S.food+=1; }
  if(S.up&&S.up.collector){ S.water += G.isWet()?2:1; }
  if(S.fatigue>=70){ G.moodAll(-3); UI.toast('😴 다들 피곤이 얼굴에 앉았다 — 쉬어야 한다'); }
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
G.fuelFor = (km,road)=>{ let per = 1/4.5; if(road==='rough') per*=1.35; if(road==='high') per*=0.92;
  if(G.hasComp('minji')) per*=0.92;
  if(G.hasPerk('mj_fuel')) per*=0.92;
  if(S){ if(S.wx==='storm') per*=1.12; else if(S.wx==='dust') per*=1.08;
    if(S.up&&S.up.solar) per*=0.92;
    if(S.fatigue>=60) per*=1.08;         // 피곤한 발은 무겁다
    per*=(1 - G.driverLv()*0.02); }
  return Math.ceil(km*per); };

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
  S.fuel = Math.max(0, S.fuel - km*per);
  // van wear
  const wearMul = S.up&&S.up.susp? 0.5:1;
  if(dv.road==='rough') S.van = Math.max(0, S.van - km*(G.isWet()?0.09:0.06)*wearMul);
  if(S.wx==='storm') S.van = Math.max(0, S.van - km*0.03*wearMul);
  // 재이: 까치의 눈
  if(G.hasPerk('jy_magpie')){ S._scrapKm=(S._scrapKm||0)+km;
    if(S._scrapKm>=25){ S._scrapKm-=25; S.scrap++; UI.toast('🎒 재이가 길에서 쓸 만한 고철을 낚아챘다 +1'); } }
  // 운전은 추가 피로 (밤 운전은 특히)
  S.fatigue = clamp(S.fatigue + gm*(G.isNight()?0.075:0.04)*(1-G.driverLv()*0.06), 0, 100);
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
  if(banterCd<=0){ banterCd = 11+R(9); const b = G.pickBanter(); if(b) UI.speak(b); }
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
  const region = G.regionOf(); const night = G.isNight();
  return D.events.filter(ev=>{
    if(ev.w<=0||ev.fixed||ev.locEvent) return false;
    if(typeFilter && ev.type!==typeFilter) return false;
    if(ev.once && S.used.includes(ev.id)) return false;
    if(ev.region && !ev.region.includes(region)) return false;
    if(ev.nearNode){ const ctx = S.driving? [S.driving.from,S.driving.to] : [S.at];
      if(!ev.nearNode.some(n=>ctx.includes(n))) return false; }
    if(ev.needFlagMin && (S.flags[ev.needFlagMin[0]]||0) < ev.needFlagMin[1]) return false;
    if(ev.night && !night) return false;
    if(ev.needsComp && !G.hasComp(ev.needsComp)) return false;
    if(ev.needsComp2 && !G.hasComp(ev.needsComp2)) return false;  // 2인 케미 이벤트
    if(ev.noComp && G.hasComp(ev.noComp)) return false;   // 미영입 동료 소문용
    if(ev.needsDog && !S.dog) return false;
    if(ev.minParty && S.party.length<ev.minParty) return false;
    if(ev.minPursuit && S.pursuit<ev.minPursuit) return false;
    if(ev.needFlag && !S.flags[ev.needFlag]) return false;
    if(ev.needWx && S.wx!==ev.needWx) return false;
    if(ev.needRain && !G.isWet()) return false;
    if(ev.needLowWater && S.water>2) return false;
    if(ev.hiddenTarget && !G.unknownHidden().length) return false;
    if(ev.id==='comp_sick' && !S.flags.food_poison) return false;
    return true;
  });
};
G.unknownHidden = ()=> Object.keys(D.nodes).filter(id=>D.nodes[id].type==='hidden' && !D.nodes[id].secret && !S.known.includes(id));

G.fireDriveEvent = ()=>{
  // 동행/추적/조우/발견/탐색 가중 혼합
  let pool = G.eligible();
  if(!pool.length) return;
  // 가중치: 관측↑→추적형↑ / 경계태세→매복류↓ / 보리의육감→발견형↑
  const AMBUSH=['meet_waver','meet_toll','meet_bikers','meet_child_alone'];
  const wOf=(e)=>{ let w=e.w;
    if(e.type==='추적') w*=(1+S.pursuit*0.5);
    if(G.hasPerk('kw_guard')&&AMBUSH.includes(e.id)) w*=0.35;
    if(G.hasPerk('leo_bori')&&e.type==='발견') w*=1.7;
    if(S.wx==='fog'&&e.type==='발견') w*=0.5;
    if(S.wx==='storm'&&(e.type==='조우'||e.type==='탐색')) w*=0.7;
    if(S.up&&S.up.antenna&&e.type==='발견') w*=1.5;
    if(S.driving&&S.driving.road==='high'&&e.type==='추적') w*=1.3;  // 천리안은 고속도로를 좋아한다
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
  const num = (k,label,unit)=>{ if(fx[k]){ const v=fx[k];
    if(k==='fuel') S.fuel=clamp(S.fuel+v,0,S.fuelMax);
    else if(k==='water') S.water=Math.max(0,S.water+v);
    else if(k==='food') S.food=Math.max(0,S.food+v);
    else if(k==='scrap') S.scrap=Math.max(0,S.scrap+v);
    else if(k==='van') S.van=clamp(S.van+v,0,S.vanMax);
    chips.push({t:`${label} ${v>0?'+':''}${v}${unit||''}`, c:v>0?'plus':'minus'}); } };
  num('fuel','연료','L'); num('water','물'); num('food','식량'); num('scrap','고철'); num('van','밴','%');
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
  if(req.comp && !G.hasComp(req.comp)) return {ok:false, t:`${D.comps[req.comp].name} 필요`};
  if(req.item && !(S.items[req.item]>0)) return {ok:false, t:`${req.item} 필요`};
  if(req.item2 && !(S.items[req.item2]>0)) return {ok:false, t:`${req.item2} 필요`};
  if(req.scrap && S.scrap<req.scrap) return {ok:false, t:`고철 ${req.scrap} 필요`};
  if(req.fuel && S.fuel<req.fuel) return {ok:false, t:`연료 ${req.fuel}L 필요`};
  if(req.water && S.water<req.water) return {ok:false, t:`물 ${req.water} 필요`};
  if(req.food && S.food<req.food) return {ok:false, t:`식량 ${req.food} 필요`};
  return {ok:true};
};
G.reqText = (req)=>{
  if(!req) return '';
  const parts=[];
  if(req.perk){ const p=G.perkDef(req.perk); parts.push(`퍼크: ${p?p.nm:req.perk}`); }
  if(req.comp) parts.push(`동료: ${D.comps[req.comp].name}`);
  if(req.item) parts.push(`아이템: ${req.item}${req.item2?'+'+req.item2:''}`);
  if(req.scrap) parts.push(`고철 ${req.scrap}`);
  if(req.fuel) parts.push(`연료 ${req.fuel}L`); if(req.water) parts.push(`물 ${req.water}`); if(req.food) parts.push(`식량 ${req.food}`);
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
  if(id==='leo') S.dog=true;
  UI.toast(`<span class="ic">${D.comps[id].face}</span>${D.comps[id].name}, 달구지에 탑승`);
  G.save(); return true;
};

/* ── arrival ── */
G.arrive = ()=>{
  const to = S.driving.to;
  const road = S.driving.road;
  S.at = to; S.driving = null;
  if(road==='rough') G.moodAll(2);   // 험한 길은 경치로 갚는다
  if(!S.visited.includes(to)){
    S.visited.push(to);
    const n = D.nodes[to];
    G.addNote({type:'장소', title:n.name, body:`DAY ${S.day} 도착. ${n.desc}`, links:[]});
  }
  if(to==='seoul'){ /* 엔딩 없음 — 길이 접혀 되돌아온다 */
    UI.renderAll();
    setTimeout(()=>G.openEvent(D.gateEvent), 500);
    G.save(); return; }
  const n = D.nodes[to];
  /* 위수 구역 첫 진입 — 초계와의 첫 조우 */
  if(n.region==='north' && !S.flags.armed_age){
    UI.onArrive();
    setTimeout(()=>G.openEventById('perimeter_first'), 500);
    G.save(); return; }
  const loc = D.events.find(e=>e.locEvent===to && !S.used.includes(e.id)
    && (!e.needsComp||G.hasComp(e.needsComp)) && (!e.needFlag||S.flags[e.needFlag]));
  UI.onArrive();
  if(loc){ setTimeout(()=>G.openEvent(loc), 450); }
  else if(!G.maybeCrisis() && n.stl){ /* settlement panel via UI */ }
  G.save();
};

/* ── node actions ── */
G.explore = ()=>{
  const pool = G.eligible('탐색');
  G.advance(50);
  if(!pool.length || rng()<0.15){ UI.toast('아무것도 찾지 못했다'); G.advance(30); UI.renderAll(); G.save(); return; }
  G.fireDriveEvent2(pool);
};
G.fireDriveEvent2 = (pool)=>{ const total=pool.reduce((s,e)=>s+e.w,0); let r=rng()*total;
  let evd=pool[0]; for(const e of pool){ r-=e.w; if(r<=0){evd=e;break} } G.openEvent(evd); };
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
  S.fatigue=0;
  G.moodAll(mood); S.van = clamp(S.van+vanFix,0,S.vanMax);
  if(G.hasPerk('jy_break')){ S.scrap+=2; }
  if(G.isWet()){ S.water+=2; UI.toast('💧 빗물받이 가득 — 물 +2'); }
  if(G.hasPerk('es_tap')&&rng()<0.25){ const h=G.nearestHidden();
    if(h){ S.known.push(h); UI.toast(`<span class="ic">📡</span>은수의 도청 — ${D.nodes[h].name}`, 'discover'); } }
  if(S.party.length){ const lucky=pick(S.party); G.bond(lucky,1); }
  const inTown = !!(S.at && D.nodes[S.at] && D.nodes[S.at].stl);
  UI.toast(msg|| (inTown?'🏘 마을 한켠에 밴을 대고 잤다':'🔥 야영으로 하루를 마쳤다'));
  /* 노숙 리스크 — 마을 밖에서 잘 때만 */
  if(!inTown){
    let risk = G.regionOf()==='north'? 0.45:0.33;
    if(S.dog) risk-=0.10;
    if(G.hasPerk('kw_guard')) risk-=0.10;
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
G.pickBanter = ()=>{
  const night = G.isNight(), rain = G.isWet(), region = G.regionOf();
  const pool = D.banter.filter(b=>{
    const nd = b.need||{};
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
  S.items['부품']--; S.van=clamp(S.van+35,0,S.vanMax);
  G.advance(100);
  UI.toast('🔧 부품으로 정비 완료 — 내구 +35');
  UI.renderAll(); G.save(); return true;
};

/* ── 밴 업그레이드 ── */
G.maxParty = ()=> D.maxParty + (S&&S.up&&S.up.cabin?1:0);
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
  UI.toast(`${u.ic} ${u.nm} 장착 완료`);
  G.addNote({type:'사건', title:'달구지 개조: '+u.nm, body:u.d+' — 달구지가 조금 더 우리 집이 됐다.', links:[]});
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
  if(c.need.scrap) S.scrap-=c.need.scrap;
  if(c.need.parts) S.items['부품']-=c.need.parts;
  if(c.need.fuel) S.fuel-=c.need.fuel;
  for(const nm in c.out) S.items[nm]=(S.items[nm]||0)+c.out[nm];
  G.advance(40);
  UI.toast(`${c.ic} ${c.nm} 제작 완료`);
  G.save(); return true;
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
  const night=G.isNight();
  const pool=D.radioTexts.filter(r=>{
    if(r.night===1&&!night) return false;
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
