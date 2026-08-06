/* ═══════════════════ ENGINE ═══════════════════ */
const SAVE_KEY = 'seoul400_save_v1';
const QUALITY_ARCHIVE_KEY = 'seoul400_quality_archive_v1';
const GAME_BUILD = '2026-08-06-quality3';
/* 세이브 스키마 버전. 올릴 때는 G.saveMigrations[새 버전]에 단계 함수를 추가한다.
   G.load의 defaulting 블록은 v1(무버전) 보강 담당 — 멱등이라 매 로드 실행해도 안전. */
const SAVE_VERSION = 3;
let S = null;               // game state
let rng = mulberry32(Date.now() % 2147483647);

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R = (n)=>rng()*n;
const pick = (arr)=>arr[Math.floor(rng()*arr.length)];
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

const G = {};

/* 세이브 마이그레이션 단계. 키 = 도달할 버전. 각 단계는 그 버전에서 새로 생긴
   필드만 책임진다(아래 G.load의 일반 보강 블록은 손상 세이브용 안전망으로 남는다). */
G.saveMigrations = {
  3:(s)=>{   // 2026-08-06: 시한 30일 → 20일. 옛 계약으로 달린 날은 소급 청구하지 않는다
    if(Number.isFinite(s.day)&&s.day>D.transferDeadlineDay&&!s.flags?.transfer_started){
      s._deadlineGrandfathered=true;
      s.day=Math.min(s.day,D.transferDeadlineDay);   // 옛 시한 아래 있던 진행은 시한 내로 본다
    }
  },
  2:(s)=>{   // 2026-08-06: 구제 횟수·정착지 숙박 횟수 도입
    if(!s._rescues||typeof s._rescues!=='object'||Array.isArray(s._rescues)) s._rescues={};
    if(!s._stlNights||typeof s._stlNights!=='object'||Array.isArray(s._stlNights)) s._stlNights={};
  },
};
const COMBAT_DIFFICULTY_SHIFT = 0.06;      // per combat.difficulty 단계
const COMBAT_ROLL_VARIANCE = 0.7;          // combatRoll 편차 반영 폭
const COMBAT_AUTO_ADJUST_DECAY = 0.84;     // 전투 결과 기반 적응형 난이도 감쇠율
const COMBAT_AUTO_ADJUST_GAIN = { success: -0.14, partial: 0.08, failure: 0.24 };
const COMBAT_AUTO_ADJUST_STREAK_BOOST = 0.06; // 연속 동일 결과에 대한 보정 추가 강도
const COMBAT_AUTO_ADJUST_STREAK_LIMIT = 3;   // 연속 부스트 최대 레벨
const COMBAT_AUTO_ADJUST_MAX = 0.5;
const COMBAT_AUTO_ADJUST_SCALE = 0.16;     // [-0.5~0.5] → 판정 보정 ±0.08 — 체감 가능한 크기

/* ── new game / save ── */
G.newGame = (mode, name, entryMode='full')=>{
  S = {
    v:SAVE_VERSION, mode, entryMode, name:(name||'').trim().slice(0,8)||null, day:1, min:7*60+30, at:'busan', driving:null,
    fuel:42, fuelMax:70, water:16, food:14, scrap:24, van:82, vanMax:100,
    items:{'부품':1,'의약품':1,'탄약':0},
    party:[], comps:{}, dog:false, _scrapKm:0,
    known:Object.keys(D.nodes).filter(id=>D.nodes[id].type!=='hidden'), visited:['busan'],
    flags:{mother_keepsakes:true,intro_family_helped:true,intro_appeal_failed:true,
      intro_module_seen:true,intro_workshop_left:true}, pursuit:0, used:[], quest:null, recruitQ:null, wx:'clear', wxNext:'clear', up:{},
    notes:[], noteSeq:0, npcs:{}, stats:{km:0, events:0, nonlethal:0}, routePlan:null,
    /* 시드는 주입 가능해야 한다 — 같은 시드 → 같은 여정이라야 회귀 테스트와
       실엔진 시뮬레이션이 성립한다 (G.seedOverride를 미리 세팅). */
    thirst:0, hunger:0, ended:false,
    seed:Number.isFinite(G.seedOverride)?G.seedOverride:Math.floor(Math.random()*1e9),
    fatigue:0, _dlv:0, _drowsyDay:0, _drowsyAt:-999, _lunchDay:0, _storyQueue:[],
    _recentEvents:[], _recentEventTypes:[], _eventBreather:0, _beatQueue:[],
    memories:{choices:{},pending:[],history:[]}, knowledge:{},
    relations:{pairs:{},seenChats:{}},
    director:{intensity:10,phase:'build',relaxEvents:0},
    combat:null, lastCombatReport:null, injuries:{}, _exploreDay:1, _exploreNodes:{}, _salvagedNodes:{}, _salvageCount:0,
    _combatFlow:{runId:0,adjust:0,history:[]},
    _quality:null, guideDismissed:false, lastJourneyRecap:null,
    _stlField:{daily:{},once:{},impact:{},roadEchoed:{},log:[]}, _impactEcho:null,
    _rescues:{}, _stlNights:{},
  };
  rng = mulberry32(S.seed);
  /* 주행 쿨다운은 모듈 변수라 새 게임에서 남아 있으면 rng 소비 타이밍이 어긋난다.
     같은 시드 → 같은 여정을 위해 여기서 초기값으로 되돌린다. */
  G.resetDriveTimers();
  S.wxNext = G.rollWx('clear');
  for(const id in D.npcs) S.npcs[id] = {att:0, met:false, chat:[]};
  for(const id in D.comps) S.comps[id] = {mood:65, bond:0, lvl:0, perks:[], pending:0};
  G.ensureNarrativeState();
  G.syncKnowledgeFromFlags();
  G.addNote({type:'장소', title:'부산 감천 부두', body:'모든 것이 시작된 곳. 달구지에 시동을 걸었다.', links:[]});
  G.addNote({type:'물건', title:'달구지', body:'낡은 한 톤 용달 트럭의 적재함에 폐자재 생활칸을 얹어 만든 이동식 집. 출발할 때는 겨우 먹고 잘 수 있는 작은 집이지만, 길에서 만날 사람에 맞춰 좌석·침대·부엌을 덧붙일 빈 틀과 볼트 자리가 남아 있다.', links:['할아버지']});
  G.addNote({type:'인물', title:'천리안', body:'2026년 중국이 미국의 AI·반도체망을 견제하려고 아시아에 배포한 TIANYAN의 한국 지역판 KOR-LOCAL. 사람들은 천리안이라 불렀다. 143년 동안 서울의 정리를 집행했고, 스무 날 뒤 외곽의 마지막 잔류구역 이송을 예고했다.', links:[]});
  G.addNote({type:'인물', title:'부모님', body:'엄마는 천리안 판단 검증 연구원, 아빠는 연산망 반도체 기술자였다. 예측과 실행 사이에 인간 확인을 되돌리는 수정안을 발표하려다 사라졌다. 가족 이송표의 사유는 비어 있다.', links:['천리안']});
  G.addNote({type:'인물', title:'할아버지', body:'나를 키운 늙은 정비사. 용달차에 생활칸을 올려 달구지를 함께 만들고 지난겨울 떠났다. 부모가 남긴 것을 끝낼 의무는 없지만, 가고 싶다면 이 차가 남산까지 갈 수 있다고 적었다.', links:['달구지','부모님']});
  G.addNote({type:'물건', title:'엄마의 철제 상자', body:'현재 이송표와 같은 명령 규격을 가리키는 회로도가 수첩 등판에서 나왔다. 남산 중앙 노드, 달구지 계기판 뒤 검증 모듈, 발신 기록과 당사자 증언을 함께 가져가라는 메모가 적혀 있었다.', links:['부모님','천리안','달구지']});
  G.addNote({type:'물건', title:'계기판 속 검증 모듈', body:'출발 전에 존재를 확인했지만 분리 절차 두 장이 없어 아직 달구지 전장에 연결해 두었다. 절차를 찾고 기록을 모아 남산에 적용해야 한다.', links:['엄마의 철제 상자','부모님','남산']});
  G.addNote({type:'인물', title:'도윤의 가족', body:'부산 부두에서 난방이 끊긴 이송 버스를 고쳐 준 가족. 엄마 하진, 8살 도윤, 동생 유나는 제7 잔류구역 6,412명 가운데 먼저 남쪽으로 보내진 사람들이다.', links:['서울 추방','천리안']});
  G.addNote({type:'사건', title:'스무 날의 시한', body:'부산의 원격 이의 제기는 막혔다. DAY 20 안에 남산 중앙 노드에서 이송 중단까지 완료해야 첫 이송을 막을 수 있다. 서울 도착만으로 끝나지 않는다.', links:['남산','도윤의 가족','계기판 속 검증 모듈']});
  G.save();
};
G.myName = ()=> (S && S.name) || '나';
let saveWarned=false;
G.save = ()=>{ if(!S||S.ended) return; try{
  if(S._quality&&S._quality.activeSession) S._quality.lastSeenAt=Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(S));
  saveWarned=false;
}catch(e){
  /* 무음 유실 금지 — 진행이 쌓이는 게임에서 저장 실패는 반드시 사용자에게 보인다 */
  if(!saveWarned){ saveWarned=true;
    try{ UI.toast('💾 저장에 실패했어요 — 브라우저 저장 공간을 확인해 주세요','warn'); }catch(_e){}
    console.warn('save failed', e);
  }
} };
G.load = ()=>{ try{ const j = localStorage.getItem(SAVE_KEY); if(!j) return false;
  const parsed=JSON.parse(j);
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)) throw new Error('invalid save root');
  S=parsed;
  if(S.at===undefined&&(!S.driving||typeof S.driving!=='object')) throw new Error('save has no location');
  if(S.at!==null&&(!S.at||!D.nodes[S.at])) throw new Error('save has invalid location');
  if(S.driving&&(!D.nodes[S.driving.from]||!D.nodes[S.driving.to])) throw new Error('save has invalid route');
  if(!Number.isFinite(S.day)) S.day=1;
  if(!Number.isFinite(S.min)) S.min=7*60+30;
  for(const key of ['fuel','fuelMax','water','food','scrap','van','vanMax','thirst','hunger','pursuit'])
    if(!Number.isFinite(S[key])) S[key]=({fuel:42,fuelMax:70,water:16,food:14,scrap:0,van:82,vanMax:100}[key]||0);
  if(!Number.isFinite(S.seed)) S.seed=1;
  /* 이어서 가기도 새 게임과 같은 출발선에서 시작한다 (세션 잔여 상태 제거) */
  G.resetDriveTimers();
  /* 버전 마이그레이션: 이전 버전 세이브는 단계 함수를 순서대로 통과하고,
     실제로 통과한 만큼만 버전이 올라간다. 실행 안 된 단계를 완료로 찍으면
     나중에 진짜 마이그레이션을 붙여도 옛 세이브에는 영영 적용되지 않는다. */
  let v=Number.isFinite(S.v)?S.v:1;
  while(v<SAVE_VERSION){
    const step=G.saveMigrations[v+1];
    if(!step) break;
    step(S); v++;
  }
  S.v=v;
  if(!S.stats||typeof S.stats!=='object'||Array.isArray(S.stats)) S.stats={km:0,events:0,nonlethal:0};
  if(!Number.isFinite(S.stats.km)) S.stats.km=0;
  if(!Number.isFinite(S.stats.events)) S.stats.events=0;
  if(!Array.isArray(S.party)) S.party=[];
  if(!S.comps||typeof S.comps!=='object'||Array.isArray(S.comps)) S.comps={};
  if(!S.flags||typeof S.flags!=='object'||Array.isArray(S.flags)) S.flags={};
  if(!S.items||typeof S.items!=='object'||Array.isArray(S.items)) S.items={};
  for(const name of ['부품','의약품','탄약']) if(!Number.isFinite(S.items[name])) S.items[name]=0;
  if(!Array.isArray(S.used)) S.used=[];
  if(!Array.isArray(S.known)) S.known=[];
  if(!Array.isArray(S.visited)) S.visited=S.at?[S.at]:[];
  if(!Array.isArray(S.notes)) S.notes=[];
  if(!Number.isFinite(S.noteSeq)) S.noteSeq=S.notes.length;
  if(!S.npcs||typeof S.npcs!=='object'||Array.isArray(S.npcs)) S.npcs={};
  for(const id in D.npcs) if(!S.npcs[id]) S.npcs[id]={att:0,met:false,chat:[]};
  rng = mulberry32(S.seed + (S.stats.events*7919));
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
  if(!Array.isArray(S._beatQueue)) S._beatQueue=[];
  if(!Array.isArray(S._recentEvents)) S._recentEvents=[];
  if(!Array.isArray(S._recentEventTypes)) S._recentEventTypes=[];
  if(!Number.isFinite(S._eventBreather)) S._eventBreather=0;
  if(S.guideDismissed===undefined) S.guideDismissed=false;
  if(S.lastJourneyRecap===undefined) S.lastJourneyRecap=null;
  if(!S._rescues||typeof S._rescues!=='object'||Array.isArray(S._rescues)) S._rescues={};
  if(!S._stlNights||typeof S._stlNights!=='object'||Array.isArray(S._stlNights)) S._stlNights={};
  G.ensureNarrativeState();
  if(S.recruitQ===undefined) S.recruitQ=null;
  if(S.combat===undefined) S.combat=null;
  if(S.lastCombatReport===undefined) S.lastCombatReport=null;
  G.ensureCombatFlow();
  G.recoverQualitySession();
  if(S.routePlan===undefined) S.routePlan=null;
  if(!S.stats) S.stats={km:0,events:0,nonlethal:0};
  if(!Number.isFinite(S.stats.nonlethal)) S.stats.nonlethal=0;
  if(S._impactEcho===undefined) S._impactEcho=null;
  if(!S.injuries||Array.isArray(S.injuries)) S.injuries={};
  if(!Number.isFinite(S._exploreDay)) S._exploreDay=S.day;
  if(!S._exploreNodes||Array.isArray(S._exploreNodes)) S._exploreNodes={};
  if(!S._salvagedNodes||Array.isArray(S._salvagedNodes)) S._salvagedNodes={};
  if(!Number.isFinite(S._salvageCount)) S._salvageCount=Object.keys(S._salvagedNodes).length;
  if(!S._stlField||Array.isArray(S._stlField)) S._stlField={daily:{},once:{},impact:{},roadEchoed:{},log:[]};
  if(!S._stlField.daily||Array.isArray(S._stlField.daily)) S._stlField.daily={};
  if(!S._stlField.once||Array.isArray(S._stlField.once)) S._stlField.once={};
  if(!S._stlField.impact||Array.isArray(S._stlField.impact)) S._stlField.impact={};
  if(!S._stlField.roadEchoed||Array.isArray(S._stlField.roadEchoed)) S._stlField.roadEchoed={};
  if(!Array.isArray(S._stlField.log)) S._stlField.log=[];
  /* 새 인트로 이전 세이브도 이미 부산을 떠난 시점이므로 출발 직전의 정본 행동을 복원한다. */
  if(S.flags.intro_family_helped===undefined) S.flags.intro_family_helped=true;
  if(S.flags.intro_appeal_failed===undefined) S.flags.intro_appeal_failed=true;
  if(S.flags.intro_workshop_left===undefined) S.flags.intro_workshop_left=true;
  /* 구버전은 실행 기록만 있었으므로 남아 있는 기록에서 최초 방문 흔적을 복원한다. */
  for(const entry of S._stlField.log){
    if(!entry||!entry.stl||!entry.id) continue;
    const key=`${entry.stl}:${entry.id}`;
    if(!S._stlField.impact[key]) S._stlField.impact[key]={day:entry.day||1,min:entry.min||0};
  }
  for(const [key,done] of Object.entries(S._stlField.once)){
    if(done&&!S._stlField.impact[key]) S._stlField.impact[key]={day:1,min:0,legacy:true};
  }
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
  G.syncKnowledgeFromFlags();
  return true; }catch(e){ S=null; return false } };
G.hasSave = ()=>{ try{
  const raw=localStorage.getItem(SAVE_KEY); if(!raw) return false;
  const save=JSON.parse(raw);
  return Boolean(save&&typeof save==='object'&&!Array.isArray(save)
    &&(save.at!==undefined||save.driving)&&Number.isFinite(save.day));
}catch(e){ return false } };
G.wipe = ()=>{ try{ localStorage.removeItem(SAVE_KEY) }catch(e){} };

/* ── helpers ── */
G.node = id=>D.nodes[id];
G.partySize = ()=> 1 + S.party.length;
/* 서사 상태는 기존 v1 저장과 분리해 보강한다. 구버전 세이브는
   없는 필드만 추가하며, 이미 본 이벤트나 동료 수치는 건드리지 않는다. */
G.ensureNarrativeState = ()=>{
  if(!S) return;
  if(!S.memories||Array.isArray(S.memories)) S.memories={choices:{},pending:[],history:[]};
  if(!S.memories.choices||Array.isArray(S.memories.choices)) S.memories.choices={};
  if(!Array.isArray(S.memories.pending)) S.memories.pending=[];
  if(!Array.isArray(S.memories.history)) S.memories.history=[];
  if(!S.knowledge||Array.isArray(S.knowledge)) S.knowledge={};
  if(!S.relations||Array.isArray(S.relations)) S.relations={pairs:{},seenChats:{}};
  if(!S.relations.pairs||Array.isArray(S.relations.pairs)) S.relations.pairs={};
  if(!S.relations.seenChats||Array.isArray(S.relations.seenChats)) S.relations.seenChats={};
  if(!S.director||Array.isArray(S.director)) S.director={intensity:10,phase:'build',relaxEvents:0};
  if(!Number.isFinite(S.director.intensity)) S.director.intensity=10;
  if(!['build','peak','fade','relax'].includes(S.director.phase)) S.director.phase='build';
  if(!Number.isFinite(S.director.relaxEvents)) S.director.relaxEvents=0;
  for(const [id,def] of Object.entries(D.knowledge||{})){
    const initial=Number.isFinite(def.initial)?def.initial:0;
    if(!Number.isFinite(S.knowledge[id])) S.knowledge[id]=initial;
    else S.knowledge[id]=clamp(S.knowledge[id],0,2);
  }
};
G.ensureCombatFlow = ()=>{
  if(!S) return null;
  if(!S._combatFlow||typeof S._combatFlow!=='object') S._combatFlow={runId:0,adjust:0,history:[]};
  S._combatFlow.runId=Math.max(0,Number(S._combatFlow.runId)||0);
  S._combatFlow.adjust=Number.isFinite(S._combatFlow.adjust)
    ? clamp(S._combatFlow.adjust,-COMBAT_AUTO_ADJUST_MAX,COMBAT_AUTO_ADJUST_MAX)
    : 0;
  if(!Array.isArray(S._combatFlow.history)) S._combatFlow.history=[];
  return S._combatFlow;
};
G.ensureQualityState = ()=>{
  if(!S) return null;
  const fresh=()=>({version:3,build:GAME_BUILD,entryMode:S.entryMode||'legacy',createdAt:Date.now(),playMs:0,activeSession:null,sessions:[],
    counts:{events:0,choices:0,combats:0,repeatEvents:0,visibleChoices:0,lockedChoices:0},
    eventIds:{},eventTypes:{},combat:{success:0,partial:0,failure:0},resources:{},
    first45:{events:0,choices:0,combats:0},lastEventType:'',typeStreak:0,maxTypeStreak:0,
    heavyStreak:0,maxHeavyStreak:0,meaningful:{lastPlayMs:0,maxGapMinutes:0,changes:[]},
    resourceLatch:{},routes:{},settlements:{},activeSettlement:null,upgrades:[],choiceEchoes:0,
    milestones:{},choiceCallbacks:{remembered:0,near:0,late:0,items:{}},endings:{},timeline:[]});
  if(!S._quality||typeof S._quality!=='object'||Array.isArray(S._quality)) S._quality=fresh();
  const q=S._quality;
  if(!q.counts||typeof q.counts!=='object') q.counts=fresh().counts;
  for(const key of ['events','choices','combats','repeatEvents','visibleChoices','lockedChoices'])
    if(!Number.isFinite(q.counts[key])) q.counts[key]=0;
  if(!q.eventIds||Array.isArray(q.eventIds)) q.eventIds={};
  if(!q.eventTypes||Array.isArray(q.eventTypes)) q.eventTypes={};
  if(!q.combat||Array.isArray(q.combat)) q.combat={success:0,partial:0,failure:0};
  for(const key of ['success','partial','failure']) if(!Number.isFinite(q.combat[key])) q.combat[key]=0;
  if(!q.resources||Array.isArray(q.resources)) q.resources={};
  if(!q.resourceLatch||Array.isArray(q.resourceLatch)) q.resourceLatch={};
  if(!q.routes||Array.isArray(q.routes)) q.routes={};
  if(!q.settlements||Array.isArray(q.settlements)) q.settlements={};
  if(!Array.isArray(q.upgrades)) q.upgrades=[];
  if(!Number.isFinite(q.choiceEchoes)) q.choiceEchoes=0;
  if(!q.milestones||Array.isArray(q.milestones)) q.milestones={};
  if(!q.choiceCallbacks||Array.isArray(q.choiceCallbacks)) q.choiceCallbacks={remembered:0,near:0,late:0,items:{}};
  for(const key of ['remembered','near','late']) if(!Number.isFinite(q.choiceCallbacks[key])) q.choiceCallbacks[key]=0;
  if(!q.choiceCallbacks.items||Array.isArray(q.choiceCallbacks.items)) q.choiceCallbacks.items={};
  if(!q.endings||Array.isArray(q.endings)) q.endings={};
  if(!q.first45||Array.isArray(q.first45)) q.first45={events:0,choices:0,combats:0};
  if(!Number.isFinite(q.heavyStreak)) q.heavyStreak=0;
  if(!Number.isFinite(q.maxHeavyStreak)) q.maxHeavyStreak=0;
  if(!q.meaningful||Array.isArray(q.meaningful)) q.meaningful={lastPlayMs:0,maxGapMinutes:0,changes:[]};
  if(!Number.isFinite(q.meaningful.lastPlayMs)) q.meaningful.lastPlayMs=0;
  if(!Number.isFinite(q.meaningful.maxGapMinutes)) q.meaningful.maxGapMinutes=0;
  if(!Array.isArray(q.meaningful.changes)) q.meaningful.changes=[];
  if(!Array.isArray(q.timeline)) q.timeline=[];
  if(!Array.isArray(q.sessions)) q.sessions=[];
  if(!Number.isFinite(q.playMs)) q.playMs=0;
  q.version=3;
  q.build=GAME_BUILD;
  q.entryMode=S.entryMode||q.entryMode||'legacy';
  return q;
};
G.recoverQualitySession = ()=>{
  const q=G.ensureQualityState();
  if(!q||!q.activeSession) return q;
  const endAt=Math.max(q.activeSession.startedAt,Math.min(Date.now(),q.lastSeenAt||q.activeSession.startedAt));
  const duration=Math.max(0,Math.min(4*60*60*1000,endAt-q.activeSession.startedAt));
  q.playMs+=duration;
  q.sessions.push({day:q.activeSession.day,km:q.activeSession.km,durationMin:Math.round(duration/6000)/10,interrupted:true});
  if(q.sessions.length>50) q.sessions=q.sessions.slice(-50);
  q.lastStop={context:'비정상 종료 복구',stop:S.combat?`combat:${S.combat.id}`:S.driving?`drive:${S.driving.from}>${S.driving.to}`:S.at?`node:${S.at}`:'unknown',day:S.day,km:Math.round((S.stats&&S.stats.km)||0)};
  q.activeSession=null;
  return q;
};
G.qualityPlayMs = ()=>{
  const q=G.ensureQualityState();
  if(!q) return 0;
  const live=q.activeSession&&Number.isFinite(q.activeSession.startedAt)
    ? Math.max(0,Date.now()-q.activeSession.startedAt) : 0;
  return q.playMs+live;
};
G.qualityRecord = (type,data={})=>{
  const q=G.ensureQualityState();
  if(!q) return;
  q.timeline.push({type,day:S.day,min:Math.round(S.min),km:Math.round((S.stats&&S.stats.km)||0),
    playMin:Math.round(G.qualityPlayMs()/6000)/10,...data});
  if(q.timeline.length>400) q.timeline=q.timeline.slice(-400);
  q.lastSeenAt=Date.now();
};
G.qualityMilestone = (id,data={})=>{
  const q=G.ensureQualityState();
  if(!q||!id||q.milestones[id]) return q&&q.milestones[id]||null;
  const row={playMin:Math.round(G.qualityPlayMs()/6000)/10,day:S.day,min:Math.round(S.min),
    km:Math.round((S.stats&&S.stats.km)||0),...data};
  q.milestones[id]=row;
  G.qualityRecord('milestone',{milestone:id,...data});
  return row;
};
G.qualityMeaningfulChange = (kind,id='')=>{
  const q=G.ensureQualityState();
  if(!q) return;
  const now=G.qualityPlayMs();
  const gap=Math.max(0,Math.round((now-(q.meaningful.lastPlayMs||0))/6000)/10);
  q.meaningful.maxGapMinutes=Math.max(q.meaningful.maxGapMinutes||0,gap);
  q.meaningful.lastPlayMs=now;
  q.meaningful.changes.push({kind,id,playMin:Math.round(now/6000)/10,day:S.day,km:Math.round((S.stats&&S.stats.km)||0)});
  if(q.meaningful.changes.length>100) q.meaningful.changes=q.meaningful.changes.slice(-100);
  G.qualityRecord('meaningful_change',{kind,id,gapMinutes:gap});
};
G.qualitySessionStart = ()=>{
  const q=G.ensureQualityState();
  if(!q||q.activeSession) return;
  q.activeSession={startedAt:Date.now(),day:S.day,km:Math.round((S.stats&&S.stats.km)||0)};
  G.qualityRecord('session_start');
  G.qualityMilestone('journey_start',{entryMode:S.entryMode||'legacy'});
  if(!(q.meaningful&&q.meaningful.changes&&q.meaningful.changes.length)) G.qualityMeaningfulChange('objective','journey_start');
};
G.qualitySessionEnd = context=>{
  const q=G.ensureQualityState();
  if(!q||!q.activeSession) return;
  const duration=Math.max(0,Math.min(4*60*60*1000,Date.now()-q.activeSession.startedAt));
  q.playMs+=duration;
  q.sessions.push({day:q.activeSession.day,km:q.activeSession.km,durationMin:Math.round(duration/6000)/10});
  if(q.sessions.length>50) q.sessions=q.sessions.slice(-50);
  q.activeSession=null;
  const stop=S.combat?`combat:${S.combat.id}`:S.driving?`drive:${S.driving.from}>${S.driving.to}`:S.at?`node:${S.at}`:'unknown';
  q.lastStop={context:context||'',stop,day:S.day,km:Math.round((S.stats&&S.stats.km)||0)};
  G.qualityRecord('session_end',{durationMin:Math.round(duration/6000)/10,context:context||'',stop});
  G.save();
};
G.qualityRoute = (id,status)=>{
  const q=G.ensureQualityState();
  const row=q.routes[id]||(q.routes[id]={chosen:0,completed:0});
  if(status==='chosen') row.chosen++;
  if(status==='completed') row.completed++;
  row.lastDay=S.day; row.lastKm=Math.round((S.stats&&S.stats.km)||0);
  G.qualityRecord(`route_${status}`,{routeId:id});
};
G.qualitySettlementEnter = nodeId=>{
  const node=D.nodes&&D.nodes[nodeId], stlId=node&&node.stl;
  if(!stlId) return;
  const q=G.ensureQualityState();
  if(q.activeSettlement&&q.activeSettlement.id===stlId) return;
  q.activeSettlement={id:stlId,nodeId,startedPlayMs:G.qualityPlayMs(),startedGameMin:S.day*1440+S.min};
  const row=q.settlements[stlId]||(q.settlements[stlId]={visits:0,playMinutes:0,gameMinutes:0,actions:0});
  row.visits++;
  G.qualityRecord('settlement_enter',{settlementId:stlId,nodeId});
  if(stlId!=='busan') G.qualityMilestone('first_settlement',{settlementId:stlId,nodeId});
};
G.qualitySettlementLeave = nodeId=>{
  const q=G.ensureQualityState(), active=q.activeSettlement;
  if(!active) return;
  const playMinutes=Math.max(0,Math.round((G.qualityPlayMs()-active.startedPlayMs)/6000)/10);
  const gameMinutes=Math.max(0,Math.round(S.day*1440+S.min-active.startedGameMin));
  const row=q.settlements[active.id]||(q.settlements[active.id]={visits:1,playMinutes:0,gameMinutes:0,actions:0});
  row.playMinutes=Math.round((row.playMinutes+playMinutes)*10)/10;
  row.gameMinutes+=gameMinutes;
  row.lastNode=nodeId||active.nodeId;
  G.qualityRecord('settlement_leave',{settlementId:active.id,nodeId:nodeId||active.nodeId,playMinutes,gameMinutes});
  q.activeSettlement=null;
};
G.qualitySettlementAction = stlId=>{
  const q=G.ensureQualityState();
  const row=q.settlements[stlId]||(q.settlements[stlId]={visits:1,playMinutes:0,gameMinutes:0,actions:0});
  row.actions++;
  G.qualityRecord('settlement_action',{settlementId:stlId});
  G.qualityMeaningfulChange('settlement',stlId);
};
G.qualityUpgrade = id=>{
  const q=G.ensureQualityState(), u=G.upDef(id);
  q.upgrades.push({id,day:S.day,km:Math.round((S.stats&&S.stats.km)||0),route:S.routePlan&&S.routePlan.id||''});
  if(q.upgrades.length>40) q.upgrades=q.upgrades.slice(-40);
  G.qualityRecord('upgrade',{upgradeId:id,group:(D.upgradeGroups||[]).find(group=>group.ids.includes(id))?.id||'',cost:u&&u.cost&&u.cost.scrap||0});
  G.qualityMeaningfulChange('vehicle',id);
};
G.qualityChoiceEcho = memory=>{
  const q=G.ensureQualityState();
  q.choiceEchoes++;
  const id=memory&&memory.id||'';
  if(id){
    const row=q.choiceCallbacks.items[id]||(q.choiceCallbacks.items[id]={remembered:false,near:false,late:false});
    if(!row.near){ row.near=true; q.choiceCallbacks.near++; }
  }
  G.qualityRecord('choice_echo',{memoryId:memory&&memory.id||'',eventId:memory&&memory.eventId||''});
};
G.qualityChoiceRemember = memory=>{
  const q=G.ensureQualityState(), id=memory&&memory.id||'';
  if(!id) return;
  const row=q.choiceCallbacks.items[id]||(q.choiceCallbacks.items[id]={remembered:false,near:false,late:false});
  if(!row.remembered){ row.remembered=true; q.choiceCallbacks.remembered++; }
  G.qualityRecord('choice_remember',{memoryId:id,eventId:memory.eventId||''});
  G.qualityMeaningfulChange('story',id);
};
G.qualityChoiceLate = (memoryId,source='ending')=>{
  const q=G.ensureQualityState();
  if(!memoryId) return;
  const row=q.choiceCallbacks.items[memoryId]||(q.choiceCallbacks.items[memoryId]={remembered:false,near:false,late:false});
  if(!row.late){ row.late=true; q.choiceCallbacks.late++; }
  G.qualityRecord('choice_late_callback',{memoryId,source});
};
G.qualityEnding = kind=>{
  const q=G.ensureQualityState();
  q.endings[kind]=(q.endings[kind]||0)+1;
  G.qualityRecord('ending',{ending:kind});
};
G.qualityArchive = ()=>{ try{
  const rows=JSON.parse(localStorage.getItem(QUALITY_ARCHIVE_KEY)||'[]');
  return Array.isArray(rows)?rows:[];
}catch(e){ return []; } };
G.archiveQualityRun = kind=>{ try{
  const rows=G.qualityArchive();
  rows.push({endedAt:new Date().toISOString(),ending:kind,day:S.day,km:Math.round((S.stats&&S.stats.km)||0),
    route:S.routePlan&&S.routePlan.id||'',entryMode:S.entryMode||'legacy',party:[...(S.party||[])],
    vanBuild:G.vanBuildProfile(),recruitApproaches:G.recruitApproachEchoes(),choices:(S.memories&&S.memories.history||[])
      .map(id=>S.memories.choices[id]).filter(Boolean).slice(-8),summary:G.qualitySummary()});
  localStorage.setItem(QUALITY_ARCHIVE_KEY,JSON.stringify(rows.slice(-12)));
}catch(e){} };
G.qualityEventOpen = ev=>{
  if(!ev) return;
  const q=G.ensureQualityState(), recent=S._recentEvents||[];
  const reverseIndex=[...recent].reverse().indexOf(ev.id);
  const repeatDistance=reverseIndex<0?null:reverseIndex+1;
  q.counts.events++;
  q.eventIds[ev.id]=(q.eventIds[ev.id]||0)+1;
  q.eventTypes[ev.type||'기타']=(q.eventTypes[ev.type||'기타']||0)+1;
  if(repeatDistance!==null&&repeatDistance<=10) q.counts.repeatEvents++;
  if(q.lastEventType===(ev.type||'기타')) q.typeStreak++;
  else { q.lastEventType=ev.type||'기타'; q.typeStreak=1; }
  q.maxTypeStreak=Math.max(q.maxTypeStreak||0,q.typeStreak);
  const heavy=Boolean(ev.combat)||/(전투|위기|천리안|추격|습격)/.test(`${ev.type||''} ${ev.title||''}`);
  q.heavyStreak=heavy?(q.heavyStreak||0)+1:0;
  q.maxHeavyStreak=Math.max(q.maxHeavyStreak||0,q.heavyStreak);
  if(S.driving) S.driving.eventCount=(S.driving.eventCount||0)+1;
  if(G.qualityPlayMs()<=45*60*1000) q.first45.events++;
  G.qualityRecord('event_open',{eventId:ev.id||'',eventType:ev.type||'기타',repeatDistance});
  G.qualityMilestone('first_event',{eventId:ev.id||'',eventType:ev.type||'기타'});
};
G.qualityChoice = (ev,choice,index,visible,available)=>{
  const q=G.ensureQualityState();
  q.counts.choices++;
  q.counts.visibleChoices+=Math.max(0,visible||0);
  q.counts.lockedChoices+=Math.max(0,(visible||0)-(available||0));
  if(G.qualityPlayMs()<=45*60*1000) q.first45.choices++;
  G.qualityRecord('choice',{eventId:ev&&ev.id||'',eventType:ev&&ev.type||'',choiceIndex:index,
    tactic:choice&&choice.tactic||'',visible:visible||0,available:available||0});
  G.qualityMilestone('first_choice',{eventId:ev&&ev.id||'',choiceIndex:index});
};
G.qualityCombat = report=>{
  if(!report) return;
  const q=G.ensureQualityState();
  const result=['success','partial','failure'].includes(report.resultCode)?report.resultCode:'partial';
  q.counts.combats++;
  q.combat[result]++;
  if(G.qualityPlayMs()<=45*60*1000) q.first45.combats++;
  G.qualityRecord('combat_end',{threat:report.threat||'',kind:report.kind||'',result,
    tactics:(report.tactics||[]).join('>'),gainCount:(report.gains||[]).length,costCount:(report.costs||[]).length});
  G.qualityMilestone('first_combat',{threat:report.threat||'',result});
};
G.qualityResourceCheck = ()=>{
  if(!S) return;
  const q=G.ensureQualityState();
  const thresholds={fuel:S.fuel<=10,water:S.water<=G.partySize(),food:S.food<=G.partySize(),
    van:S.van<=30,fatigue:S.fatigue>=85,pursuit:S.pursuit>=4};
  for(const [key,active] of Object.entries(thresholds)){
    if(active&&!q.resourceLatch[key]){
      q.resourceLatch[key]=true;
      q.resources[key]=(q.resources[key]||0)+1;
      G.qualityRecord('resource_critical',{resource:key});
    } else if(!active) q.resourceLatch[key]=false;
  }
};
G.qualitySummary = ()=>{
  const q=G.ensureQualityState(), combats=q.counts.combats||0, events=q.counts.events||0;
  return {playMinutes:Math.round(G.qualityPlayMs()/6000)/10,sessions:q.sessions.length+(q.activeSession?1:0),
    events,uniqueEvents:Object.keys(q.eventIds).length,repeatRate:events?Math.round(q.counts.repeatEvents/events*100):0,
    maxTypeStreak:q.maxTypeStreak||0,maxHeavyStreak:q.maxHeavyStreak||0,choices:q.counts.choices||0,
    lockedRate:q.counts.visibleChoices?Math.round(q.counts.lockedChoices/q.counts.visibleChoices*100):0,
    combats,combat:{...q.combat},successRate:combats?Math.round(q.combat.success/combats*100):0,
    first45:{...q.first45},resources:{...q.resources},routes:{...q.routes},settlements:{...q.settlements},
    upgrades:q.upgrades.length,choiceEchoes:q.choiceEchoes||0,choiceCallbacks:{...q.choiceCallbacks,items:{...q.choiceCallbacks.items}},
    milestones:{...q.milestones},meaningful:{lastPlayMin:Math.round((q.meaningful.lastPlayMs||0)/6000)/10,
      maxGapMinutes:Math.max(q.meaningful.maxGapMinutes||0,Math.round((G.qualityPlayMs()-(q.meaningful.lastPlayMs||0))/6000)/10),
      count:q.meaningful.changes.length},entryMode:q.entryMode||'legacy',lastStop:q.lastStop||null,
    endings:{...q.endings},timelineCount:q.timeline.length,build:q.build};
};
G.journeyGuide = ()=>{
  if(!S||S.guideDismissed||G.qualityArchive().length||G.qualityPlayMs()>45*60*1000) return null;
  const milestones=G.ensureQualityState().milestones||{};
  if(!milestones.first_departure) return {step:1,total:4,kicker:'FIRST JOURNEY',title:'다음 길 하나를 고른다',
    body:'서울까지 남은 방향과 연료·시간·위험을 비교한 뒤, 감당할 수 있는 길을 누르면 바로 출발한다.',focus:'route'};
  if(!milestones.first_event) return {step:2,total:4,kicker:'ON THE ROAD',title:S.driving?'주행은 자동으로 이어진다':'다음 길에서 첫 사건을 만난다',
    body:S.driving?'남은 거리와 자원을 지켜보다 사건이 멈춰 세우면, 예상 결과와 조건을 읽고 선택한다.':'도착까지 사건이 없었다면 다음 길을 고르면 된다. 사건이 열릴 때 선택의 예상 결과와 조건을 확인한다.',focus:'drive'};
  const atSettlement=!S.driving&&S.at&&D.nodes[S.at]&&D.nodes[S.at].stl;
  if(atSettlement&&!milestones.first_settlement_visit) return {step:3,total:4,kicker:'FIRST STOP',title:'정착지 안으로 들어간다',
    body:'거래만 하지 않아도 된다. 사람을 만나고 현장 일을 도우면 다음 길과 동료의 이야기가 열린다.',focus:'settlement'};
  if(!milestones.temporary_companion) return {step:4,total:4,kicker:'MAKE ROOM',title:'사람의 일을 먼저 끝낸다',
    body:'만난 사람의 부탁을 따라가면 한 구간을 손님으로 동행한다. 서로를 겪은 뒤에야 합류를 고른다.',focus:'companion'};
  return null;
};
G.exportQuality = format=>{
  const q=G.ensureQualityState(), summary=G.qualitySummary();
  if(format==='json') return JSON.stringify({game:'서울까지 400km',exportedAt:new Date().toISOString(),summary,quality:q,completedRuns:G.qualityArchive()},null,2);
  const L=['# 서울까지 400km — 품질 기록','',
    `> 기록 스키마 ${q.version} · 빌드 ${q.build}`,
    `> 외부 전송 없는 로컬 기록 · DAY ${S.day} · ${Math.round(S.stats.km)}km · 실제 플레이 ${summary.playMinutes}분`,'',
    '## 핵심 지표','',
    `- 사건 ${summary.events}회 · 고유 사건 ${summary.uniqueEvents}개 · 10사건 내 반복 ${summary.repeatRate}%`,
    `- 선택 ${summary.choices}회 · 잠긴 선택지 노출 비율 ${summary.lockedRate}%`,
    `- 같은 사건 유형 최대 ${summary.maxTypeStreak}회 연속`,
    `- 무거운 장면 최대 ${summary.maxHeavyStreak}회 연속 · 의미 있는 변화 최대 공백 ${summary.meaningful.maxGapMinutes}분`,
    `- 전투 ${summary.combats}회 · 성공 ${summary.combat.success} · 부분 성공 ${summary.combat.partial} · 실패 ${summary.combat.failure}`,
    `- 첫 45분 · 사건 ${summary.first45.events} · 선택 ${summary.first45.choices} · 전투 ${summary.first45.combats}`,
    `- 핵심 선택 기록 ${summary.choiceCallbacks.remembered} · 가까운 회수 ${summary.choiceCallbacks.near} · 먼 회수 ${summary.choiceCallbacks.late}`,
    `- 개조 ${summary.upgrades}회 · 시작 방식 ${summary.entryMode}`,'',
    '## 첫 여정 이정표',''];
  const milestoneRows=Object.entries(summary.milestones);
  if(milestoneRows.length) milestoneRows.forEach(([id,row])=>L.push(`- ${id}: ${row.playMin}분 · DAY ${row.day} · ${row.km}km`));
  else L.push('- 아직 기록 없음');
  L.push('',
    '## 노선과 정착지','');
  const routeRows=Object.entries(summary.routes);
  if(routeRows.length) routeRows.forEach(([id,row])=>L.push(`- 노선 ${id}: 선택 ${row.chosen||0}회 · 완주 ${row.completed||0}회`));
  else L.push('- 노선 기록 없음');
  const settlementRows=Object.entries(summary.settlements);
  if(settlementRows.length) settlementRows.forEach(([id,row])=>L.push(`- 정착지 ${id}: 방문 ${row.visits||0}회 · 실제 ${row.playMinutes||0}분 · 현장 행동 ${row.actions||0}회`));
  else L.push('- 정착지 기록 없음');
  L.push('',
    '## 자원 위험 진입','');
  const resourceNames={fuel:'연료',water:'물',food:'식량',van:'차체',fatigue:'피로',pursuit:'관측'};
  const resourceRows=Object.entries(summary.resources);
  if(resourceRows.length) resourceRows.forEach(([key,value])=>L.push(`- ${resourceNames[key]||key}: ${value}회`));
  else L.push('- 아직 기록 없음');
  L.push('','## 최근 세부 기록','');
  q.timeline.slice(-120).forEach(row=>L.push(`- ${row.playMin}분 · DAY ${row.day} · ${row.km}km · ${row.type}${row.eventId?` · ${row.eventId}`:''}${row.result?` · ${row.result}`:''}`));
  return L.join('\n');
};
G.combatAdaptiveBias = ()=>{
  const flow=G.ensureCombatFlow();
  return flow?flow.adjust:0;
};
G.combatAdaptivePercent = ()=>Math.round(G.combatAdaptiveBias()*100);
G.combatAdaptiveTrendPercent = ()=>{
  const flow=G.ensureCombatFlow();
  if(!flow || !Array.isArray(flow.history) || flow.history.length<1) return 0;
  const samples=flow.history.slice(-3);
  const count=Math.max(1,samples.length);
  const avg=samples.reduce((sum,entry)=>sum+(Number.isFinite(entry.delta)?entry.delta:0),0)/count;
  return Math.round(avg*100);
};
G.combatRecentFailureStreak = ()=>{
  const flow=G.ensureCombatFlow();
  if(!flow || !Array.isArray(flow.history) || flow.history.length<1) return 0;
  let streak=0;
  for(let i=flow.history.length-1;i>=0;i--){
    if(flow.history[i]&&flow.history[i].result==='failure') streak++;
    else break;
  }
  return Math.min(3,streak);
};
G.recordCombatOutcome = (resultCode)=>{
  const flow=G.ensureCombatFlow();
  if(!flow) return;
  const sameAsLast = (()=> {
    const prev=flow.history[flow.history.length-1];
    let streak=0;
    for(let i=flow.history.length-1;i>=0;i--){
      if(flow.history[i].result===resultCode) streak++;
      else break;
    }
    return prev&&prev.result===resultCode ? streak : 0;
  })();
  const streak=Math.max(0,sameAsLast);
  const before=flow.adjust;
  const gain = resultCode==='success'
    ? COMBAT_AUTO_ADJUST_GAIN.success
    : resultCode==='partial' ? COMBAT_AUTO_ADJUST_GAIN.partial
    : COMBAT_AUTO_ADJUST_GAIN.failure;
  const boost = Math.min(COMBAT_AUTO_ADJUST_STREAK_LIMIT, Math.max(0,streak)) * COMBAT_AUTO_ADJUST_STREAK_BOOST;
  const tunedGain = resultCode==='failure' ? gain + boost : gain - boost*0.5;
  flow.adjust=clamp(flow.adjust*COMBAT_AUTO_ADJUST_DECAY+tunedGain,-COMBAT_AUTO_ADJUST_MAX,COMBAT_AUTO_ADJUST_MAX);
  const delta=flow.adjust-before;
  flow.history.push({
    result:resultCode,
    day:S.day,
    km:Math.round((S.stats&&S.stats.km)||0),
    before:Math.round(before*1000)/1000,
    after:Math.round(flow.adjust*1000)/1000,
    delta:Math.round(delta*1000)/1000,
    streak:Math.max(streak+1,1)
  });
  if(flow.history.length>12) flow.history=flow.history.slice(-12);
  return {before,after:flow.adjust,delta,streak:Math.max(streak+1,1)};
};
G.knowledgeLevel = id=>{
  G.ensureNarrativeState();
  return S&&Number.isFinite(S.knowledge[id])?S.knowledge[id]:0;
};
G.learn = (id,level=1)=>{
  G.ensureNarrativeState();
  const def=D.knowledge&&D.knowledge[id];
  if(!def) return null;
  const before=G.knowledgeLevel(id), after=clamp(Math.max(before,level),0,2);
  S.knowledge[id]=after;
  return after>before?{id,level:after,label:def.label}:null;
};
G.syncKnowledgeFromFlags = ()=>{
  if(!S) return [];
  G.ensureNarrativeState();
  const learned=[];
  for(const [id,def] of Object.entries(D.knowledge||{})){
    for(const rule of def.flags||[]){
      if(S.flags&&S.flags[rule[0]]){
        const hit=G.learn(id,rule[1]);
        if(hit) learned.push(hit);
      }
    }
  }
  return learned;
};
G.knowledgeSummary = ()=>{
  G.ensureNarrativeState();
  return Object.entries(D.knowledge||{}).map(([id,def])=>{
    const level=G.knowledgeLevel(id);
    return {id,label:def.label,level,text:level>=2?def.known:(level===1?(def.heard||def.known):'아직 확인하지 못했다.')};
  });
};
G.transferStatus = (state=S)=>D.transferStatus(state);
/* 출발 동기는 설정 문단으로 끝내지 않고 플레이 중 계속 확인하는 작업 목록이다.
   검증 모듈은 부산에서 이미 보았고, 빠진 절차와 여러 사람의 기록을 모은 뒤에야
   안전하게 회수해 남산에 연결할 수 있다. */
G.departureSteps = ()=>{
  if(!S) return [];
  const witnessed=G.pillars?G.pillars().관계.have:0;
  return [
    {id:'family',done:!!S.flags.intro_family_helped,label:'6,412명 가운데 한 가족을 만남',detail:'도윤 가족의 버스 난방을 고치고 현재 이송을 직접 보았다'},
    {id:'appeal',done:!!S.flags.intro_appeal_failed,label:'부산에서 이의 제기 시도',detail:'원격 절차는 막혔고 남산 현장 확인만 남았다'},
    {id:'module',done:!!S.flags.intro_module_seen,label:'계기판 속 검증 모듈 확인',detail:'엄마의 회로도와 실제 배선이 일치했다'},
    {id:'key',done:!!S.flags.parent_key_found,label:'분리 절차 복원·검증키 안전 회수',detail:S.flags.parent_key_found?'4–5쪽을 복원해 남산까지 실을 준비가 됐다':'절차 없이 뽑으면 키와 달구지가 함께 망가진다'},
    {id:'witness',done:!!S.flags.es_truth&&witnessed>=D.seoulPillars.관계,label:'발신 기록과 당사자 증언 대조',detail:S.flags.es_truth?'명령 생성 순서를 확인했다':`같은 명령을 겪은 사람들의 이야기를 모은다 · ${witnessed}/${D.seoulPillars.관계}`},
    {id:'seoul',done:!!S.flags.story_done,label:'남산에서 이송 중단까지 완료',detail:S.flags.story_done?'제7 잔류구역 이송을 끝냈다':'서울 도착이 아니라 DAY 9 안의 이송 중단이 완료 조건이다'}
  ];
};
G.relationKey = (a,b)=>[a,b].sort().join(':');
G.relation = (a,b)=>{
  G.ensureNarrativeState();
  return (S.relations.pairs[G.relationKey(a,b)]||{}).score||0;
};
G.changeRelation = (a,b,amount,reason)=>{
  if(!a||!b||a===b||!G.hasComp(a)||!G.hasComp(b)||!Number.isFinite(amount)) return null;
  G.ensureNarrativeState();
  const key=G.relationKey(a,b), pair=S.relations.pairs[key]||{score:0,history:[]};
  pair.score=clamp(pair.score+amount,-3,5);
  pair.history=Array.isArray(pair.history)?pair.history:[];
  pair.history.push({day:S.day,amount,reason:reason||'함께 겪은 일'});
  if(pair.history.length>8) pair.history=pair.history.slice(-8);
  S.relations.pairs[key]=pair;
  return {key,score:pair.score};
};
G.bestRelation = id=>{
  if(!S||!G.hasComp(id)) return null;
  const peers=S.party.filter(other=>other!==id).map(other=>({id:other,score:G.relation(id,other)}));
  peers.sort((a,b)=>b.score-a.score);
  return peers[0]&&peers[0].score>0?peers[0]:null;
};
G.relationLabel = score=>score>=5?'서로를 맡김':score>=3?'손발이 맞음':score>=1?'호흡을 익힘':'낯섦';
G.rememberCrewChat = chat=>{
  if(!S||!chat||!Array.isArray(chat.lines)) return;
  G.ensureNarrativeState();
  const index=(D.chats||[]).indexOf(chat), key=`chat:${index}`;
  if(index<0||S.relations.seenChats[key]) return;
  const speakers=[...new Set(chat.lines.map(line=>line[0]).filter(id=>D.comps[id]&&G.hasComp(id)))];
  if(speakers.length<2) return;
  for(let i=0;i<speakers.length;i++) for(let j=i+1;j<speakers.length;j++)
    G.changeRelation(speakers[i],speakers[j],1,'길 위에서 나눈 대화');
  S.relations.seenChats[key]=true;
  G.save();
};
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
G.recruitApproach = (id)=>{
  const q=S&&S.recruitQ&&(!id||S.recruitQ.id===id)?S.recruitQ:null;
  const cid=id||(q&&q.id);
  const choice=(q&&q.choice)||(cid&&S&&S.comps&&S.comps[cid]&&S.comps[cid].approach);
  const def=cid&&D.recruitQuests&&D.recruitQuests[cid];
  return choice&&def&&def.approaches ? def.approaches[choice] : null;
};
G.recruitApproachEchoes = ()=> (S&&S.party||[]).map(id=>{
  const choice=S.comps&&S.comps[id]&&S.comps[id].approach;
  const quest=D.recruitQuests&&D.recruitQuests[id];
  const approach=choice&&quest&&quest.approaches&&quest.approaches[choice];
  if(!approach) return null;
  return {id,choice,name:D.comps[id]&&D.comps[id].name||quest.name,
    label:approach.label,memory:approach.memory,driveEchoed:Boolean(S.flags&&S.flags[`${id}_approach_drive`])};
}).filter(Boolean);
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
  const urgent=ready.find(id=>{ const w=defs(id).when||{}; return w.region||w.lowWater||w.flag; });
  const out=urgent||ready[0];
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
/* 대응 단계도 판정이다. counter에 맞는 대응은 의도 보정과 높은 기본치를 받지만
   확정 성공은 아니다 — 실패하면 부정확한 read(그 전술만 남는 좁은 정보)가 남고,
   3단계에서 그 정보의 질이 그대로 반영된다. "정보의 질"이 도박의 대상이 된다. */
G.combatFailurePreview = choice=>{
  if(!choice||!Array.isArray(choice.out)||choice.out.length<2) return '';
  const fx=choice.out[choice.out.length-1]&&choice.out[choice.out.length-1].fx||{};
  const bits=[];
  if((fx.van||0)<0) bits.push(`차체 ${fx.van}`);
  if((fx.fuel||0)<0) bits.push(`연료 ${fx.fuel}L`);
  if((fx.pursuit||0)>0) bits.push(`관측 +${fx.pursuit}`);
  if(fx.injury) bits.push(`부상 위험`);
  if(fx.item) for(const k in fx.item) if(fx.item[k]<0) bits.push(`${k} ${fx.item[k]}`);
  if((fx.combatPressure||0)>0) bits.push(`압박 +${fx.combatPressure}`);
  if((fx.combatEdge||0)<0) bits.push(`우위 ${fx.combatEdge}`);
  if((fx.fatigue||0)>0) bits.push(`피로 +${fx.fatigue}`);
  return bits.slice(0,3).join(' · ');
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
G.pickOutcome = (evd, choice)=>{
  let out=null, index=0, rolled=false, rolledValue;
  /* 강우의 저격은 조우당 한 발만 확실하다 — 연발은 위치를 드러낸다(소음×관측 정합) */
  if(choice.req&&choice.req.item==='탄약'&&G.hasPerk('kw_sniper')&&S.combat&&!S.combat.sniperUsed){
    S.combat.sniperUsed=1; out=choice.out[0];
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
G.advance = (mins)=>{
  let m = mins;
  while(m>0){
    const toMid = 24*60 - S.min;
    const step = Math.min(m, toMid);
    /* 분 단위로 정규화한다. 주행 tick이 실수를 더하다 보면 06:30이 389.9999가 되어
       "다음 날 아침"을 판별하는 조건과 표시가 어긋난다. */
    S.min = Math.round((S.min + step) * 1000) / 1000; m -= step;
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
  G.tickDeadline();
  G.save();
};
/* DAY 9 — 선언된 시한을 실제로 집행한다. 압박은 새벽마다 단계적으로 오르고,
   시한을 넘기면 첫 이송이 실제로 출발한다(에필로그·처분 장면에 새겨진다). */
G.tickDeadline = ()=>{
  if(!S || S.flags.core_decided || S.flags.story_done) return;
  const t=D.transferStatus(S);
  const fire=(flag,id)=>{ if(!S.flags[flag]){ S.flags[flag]=1; G.queueCrisis(id); return true; } return false; };
  /* 시한이 실제 여정 길이(닷새~스무 날)와 같은 척도가 된 뒤로는 날짜 축이 주도한다.
     거리 축은 남산 코앞까지 갔는데 아직 압박을 못 본 경우를 위한 안전망으로만 남긴다. */
  const remainKm=G.remainKm();
  /* 단계는 남은 날로 고른다 — 이벤트 본문이 "엿새 뒤" 같은 절대 날짜를 말하기 때문이다.
     거리 축은 한 단계도 못 본 채 남산 코앞까지 간 경우의 안전망으로만 쓴다. */
  const seenAny=S.flags.deadline_seen_d10||S.flags.deadline_seen_d5||S.flags.deadline_seen_d0;
  if(t.onTime){
    if(t.remaining<=Math.ceil(t.due*0.6)) fire('deadline_seen_d10','deadline_d10');
    else if(remainKm<=150 && !seenAny) fire('deadline_seen_d10','deadline_d10');
    if(t.remaining<=Math.ceil(t.due*0.3) && fire('deadline_seen_d5','deadline_d5') && S.pursuit<1) S.pursuit=1;
    if(t.remaining<=1 || (remainKm<=40 && !S.flags.deadline_seen_d0)) fire('deadline_seen_d0','deadline_d0');
  } else {
    fire('deadline_seen_late','deadline_late');
    /* 늦은 하루하루가 관측을 끌어올린다 — 시간 자체가 비용이다 */
    if(t.lateDays>=2 && S.pursuit<5 && rng()<0.5){
      S.pursuit=clamp(S.pursuit+1,0,5);
      UI.toast('👁 이송 경로의 초계가 늘었다 — 관측 +1');
    }
  }
};
G.moodAll = (d)=>{ for(const id of S.party){ S.comps[id].mood = clamp(S.comps[id].mood+d,0,100); } };

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
    if(S._scrapKm>=25){ S._scrapKm-=25; S.scrap++; UI.toast('🎒 재이가 길에서 쓸 만한 고철을 낚아챘다 +1'); } }
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
  const recent=new Set((S._recentEvents||[]).slice(-10));
  const fresh=out.filter(e=>!recent.has(e.id));
  if(fresh.length>=Math.min(3,out.length)) out=fresh;

  const phase=S.director&&S.director.phase;
  /* 숨 고르기는 절정이 끝난 뒤에 — peak 중에는 breather가 절정을 가로채지 않는다 */
  if(opt.breather!==false && S._eventBreather>0 && phase!=='peak'){
    const calm=out.filter(G.eventIsCalm);
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
  if(G.eventIsHeavy(ev)) S._eventBreather=Math.max(S._eventBreather,1);
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
G.openEvent = (evd)=>{
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
  if(fx.recruit) G.doRecruit(fx.recruit);
  if(fx.note) G.addNote(fx.note);
  for(const learned of G.syncKnowledgeFromFlags())
    chips.push({t:`◈ ${learned.label} · ${learned.level>=2?'확인':'단서'}`,c:'item'});
  if(fx.flag==='story_done') chips.push(...G.completeJourney());
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
G.doStlFieldAction = (stlId,actionId)=>{
  if(S.driving||!S.at||D.nodes[S.at].stl!==stlId) return {ok:false,reason:'이 장소에 멈춰 있지 않다'};
  const action=G.stlFieldAction(stlId,actionId), before=G.stlFieldStatus(stlId,action);
  if(!before.ok) return {ok:false,reason:before.reason};
  const field=D.stls[stlId].field, state=G.stlFieldState();
  const impactBefore=G.stlImpact(stlId), firstImpact=!state.impact[before.onceKey];
  const wasHiddenOpen=field.actions.some(a=>a.hidden&&!G.stlFieldStatus(stlId,a).hiddenLocked);
  const fx={...(action.fx||{}),time:action.time||0};
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
  G.checkLevel(id);
  const memory=G.recruitApproach(id);
  G.addNote({type:'인물',title:D.comps[id].name,
    body:`떠나기 전의 일을 함께 끝낸 뒤 달구지에 합류했다.${memory?' '+memory.label+'. '+memory.memory:''} ${D.comps[id].bio}`,links:[]});
  UI.toast(`<span class="ic">${D.comps[id].face}</span>${D.comps[id].name}, 달구지에 탑승`);
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
  return {from:drive.from,to:drive.to,km:Math.round(drive.dist),minutes:elapsed,road:drive.road,
    events:drive.eventCount||0,build:start.build||'기본 생존형',changes,routeCompleted,
    routeContract,routeName:route&&route.def&&route.def.name||'',routeProgress:routeContract?`${routeContract.done}/${routeContract.total}`:'',
    day:S.day};
};
G.arrive = ()=>{
  const completedDrive=S.driving;
  const to = S.driving.to;
  const road = S.driving.road;
  S.at = to; S.driving = null;
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
    setTimeout(()=>G.openEventById('perimeter_first'), arrivalDelay);
    G.save(); return; }
  if(S.fuel<=0){ setTimeout(()=>G.openRescue('nofuel','crisis_nofuel'), 700); }   // 도착 직후 빈 탱크 — 잠김 방지
  const loc = D.events.find(e=>e.locEvent===to && !S.used.includes(e.id)
    && (!e.needsComp||G.hasComp(e.needsComp)) && (!e.needFlag||S.flags[e.needFlag]));
  const arrivalDelay=UI.onArrive();
  if(S.recruitQ&&S.recruitQ.stage==='task'&&S.recruitQ.target===to)
    setTimeout(()=>UI.toast(`🤝 ${D.recruitQuests[S.recruitQ.id].name}의 부탁을 진행할 수 있다`),arrivalDelay);
  /* setTimeout으로 넘기는 id를 함께 기록한다. 타이머가 돌지 않는 환경(시뮬·테스트)이
     이 층을 통째로 놓치거나, 반대로 사본을 만들어 큐를 두 번 빼는 일을 막는다. */
  S._simDeferred=null;
  if(loc){ S._simDeferred=loc.id; setTimeout(()=>G.openEvent(loc), arrivalDelay); }
  else if(!G.maybeCrisis()){
    const queued=G.popStory();
    if(queued){ S._simDeferred=queued; setTimeout(()=>G.openEventById(queued), arrivalDelay); }
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
G.exploreForecast = status=>{
  status=status||G.exploreStatus();
  const region=G.regionOf();
  const danger=(S.pursuit>=3||S.wx==='storm'||region==='north')?'높음'
    :(S.pursuit>0||S.wx==='rain'||status.repeat)?'보통':'낮음';
  const focus=region==='north'?'통제 흔적 · 우회로 · 생존 물자'
    :region==='central'?'사람의 흔적 · 폐시설 · 보급품':'생활 흔적 · 고철 · 길의 소문';
  const guaranteed=status.fresh?'고철 4 · 체결 부품 가능':'확정 회수 없음';
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
    S.scrap+=4; freshHaul=' · 고철 +4';
    /* 초반 두 지역은 좌석 증축을 막지 않도록 표준 체결 부품을 보장한다.
       이후에는 세 지역마다 한 번이라 무한 파밍보다 새 길을 택하는 편이 낫다. */
    if(S._salvageCount<=2||S._salvageCount%3===0){
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
  if(S.party.length){ const lucky=pick(S.party); G.bond(lucky,1); }
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
G.canBuyUp = (id)=>{
  const u=G.upDef(id); if(!u||S.up[id]) return {ok:false, why:'장착됨'};
  if(u.needs&&!S.up[u.needs]) return {ok:false, why:G.upDef(u.needs).nm+' 필요'};
  if(u.slot&&D.upSlots&&D.upSlots[u.slot]){
    const rule=D.upSlots[u.slot], used=G.slotUsage(u.slot);
    if(used.length>=rule.cap)
      return {ok:false, why:`${rule.nm} 자리 없음 — ${used.map(x=>x.nm).join(' · ')} 장착 중`};
  }
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
    const price=Math.max(1,Math.round(price0*G.tradeDiscount(stlId)));
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
  const price=Math.max(1,Math.round((w[3]+f[3]*2)*G.tradeDiscount(stlId)));
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
G.endGame = (kind)=>{
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
