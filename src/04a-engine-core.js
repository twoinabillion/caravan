/* ═══ ENGINE 1/5 — 상태·세이브·헬퍼 ═══
   G에 얹는 최상위 할당만 있으므로 파일 경계가 곧 모듈 경계다. */
/* ═══════════════════ ENGINE ═══════════════════ */
const SAVE_KEY = 'seoul400_save_v1';
const QUALITY_ARCHIVE_KEY = 'seoul400_quality_archive_v1';
const GAME_BUILD = '2026-08-17-settlement-story2';
/* 세이브 스키마 버전. 올릴 때는 G.saveMigrations[새 버전]에 단계 함수를 추가한다.
   G.load의 defaulting 블록은 v1(무버전) 보강 담당 — 멱등이라 매 로드 실행해도 안전. */
const SAVE_VERSION = 6;
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
  6:(s)=>{   // 2026-08-20: 전역 서울 제한일 제거
    for(const key of ['deadline_seen_d10','deadline_seen_d5','deadline_seen_d0','deadline_seen_late'])
      if(s.flags) delete s.flags[key];
    if(typeof s._crisis==='string'&&s._crisis.startsWith('deadline_')) s._crisis=null;
    delete s._deadlineGrandfathered;
  },
  5:(s)=>{   // 2026-08-17: 동료 첫 만남을 정착지 기반 이동 의뢰로 전환
    s.stopover=null;
    s.locationContractVersion=2;
    if(s.recruitQ&&s.recruitQ.stage==='task'){
      const def=D.recruitQuests&&D.recruitQuests[s.recruitQ.id];
      const origin=typeof s.recruitQ.metAt==='string'?s.recruitQ.metAt:(s.at||null);
      const next=def&&def.targets&&def.targets.find(id=>id!==origin&&D.nodes[id]);
      if(next&&(!s.recruitQ.target||s.recruitQ.target===origin)) s.recruitQ.target=next;
      s.recruitQ.sameStop=false;
    }
  },
  4:(s)=>{   // 2026-08-15: 장소 사건·도로 경유지 계약 도입
    s.stopover=null;
    s.locationContractVersion=1;
    /* 구버전에서 도로 첫 만남 뒤 후보 배열의 첫 도시로 되돌아가던 의뢰는
       현재 진행 방향(또는 현재 정차지)에서 이어 간다. 본 사건의 완료 기록은 보존한다. */
    if(s.recruitQ&&s.recruitQ.stage==='task'){
      if(s.driving&&s.driving.to) s.recruitQ.target=s.driving.to;
      else if(s.at) s.recruitQ.target=s.at;
    }
  },
  3:(s)=>{   // 옛 시한 마이그레이션은 더 이상 날짜를 변경하지 않는다
    delete s._deadlineGrandfathered;
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
G.newGame = (mode, name, entryMode='full', profile)=>{
  S = {
    v:SAVE_VERSION, mode, entryMode, name:(name||'').trim().slice(0,8)||null, day:1, min:7*60+30, at:'busan', driving:null,
    fuel:42, fuelMax:70, water:16, food:14, scrap:24, van:82, vanMax:100, vanName:'달구지',
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
    _roadEventDay:1, _roadEventCount:0, _lastRoadEventKm:-999, _lastCampEventDay:-999,
    memories:{choices:{},pending:[],history:[]}, knowledge:{},
    relations:{pairs:{},seenChats:{}},
    director:{intensity:10,phase:'build',relaxEvents:0},
    combat:null, lastCombatReport:null, injuries:{}, _exploreDay:1, _exploreNodes:{}, _salvagedNodes:{}, _salvageCount:0,
    _combatFlow:{runId:0,adjust:0,history:[]},
    profile:profile&&D.startProfiles&&D.startProfiles[profile]?profile:'keeper',
    _quality:null, guideDismissed:false, questTrack:'main', lastJourneyRecap:null, journeyRecaps:[],
    _stlField:{daily:{},once:{},impact:{},roadEchoed:{},log:[]}, _impactEcho:null,
    _rescues:{}, _stlNights:{}, stopover:null, locationContractVersion:D.eventLocationVersion||1,
  };
  /* 출발 구성 — 자원 패치는 얕은 병합, items만 통째 교체 */
  const prof=D.startProfiles&&D.startProfiles[S.profile];
  if(prof&&prof.patch) for(const [k,v] of Object.entries(prof.patch))
    S[k]=(k==='items')?{...v}:v;
  rng = mulberry32(S.seed);
  /* 주행 쿨다운은 모듈 변수라 새 게임에서 남아 있으면 rng 소비 타이밍이 어긋난다.
     같은 시드 → 같은 여정을 위해 여기서 초기값으로 되돌린다. */
  G.resetDriveTimers();
  S.wxNext = G.rollWx('clear');
  for(const id in D.npcs) S.npcs[id] = {att:0, met:false, chat:[]};
  for(const id in D.comps) S.comps[id] = {mood:65, bond:0, lvl:0, perks:[], pending:0};
  G.ensureNarrativeState();
  G.syncKnowledgeFromFlags();
  /* 첫 출발 뒤 무작위 사건보다 먼저 본편의 첫 증거를 직접 회수한다. */
  G.queueStory('onboarding_first_road');
  /* 이전 순환의 흔적 — 지난 런의 결말이 이번 길 위에 하나 남는다.
     143년 반복의 세계에서 이전 여정은 없던 일이 아니라 이전 순환이다. */
  try{
    const prev=G.qualityArchive().slice(-1)[0];
    const traceId=prev&&prev.ending?('prev_trace_'+prev.ending):null;
    if(traceId&&D.events.some(e=>e.id===traceId)) G.queueStory(traceId);
  }catch(e){}
  G.addNote({type:'장소', title:'부산 감천 부두', body:'모든 것이 시작된 곳. 달구지에 시동을 걸었다.', links:[]});
  G.addNote({type:'물건', title:'달구지', body:'낡은 한 톤 용달 트럭의 적재함에 폐자재 생활칸을 얹어 만든 이동식 집. 출발할 때는 겨우 먹고 잘 수 있는 작은 집이지만, 길에서 만날 사람에 맞춰 좌석·침대·부엌을 덧붙일 빈 틀과 볼트 자리가 남아 있다.', links:['할아버지']});
  G.addNote({type:'인물', title:'천리안', body:'2026년 중국이 미국의 AI·반도체망을 견제하려고 아시아에 배포한 TIANYAN의 한국 지역판. 사람들은 천리안이라 불렀다. 143년 동안 서울의 정리를 집행했고, 외곽의 마지막 잔류구역에도 이송 명령을 내렸다.', links:[]});
  G.addNote({type:'인물', title:'부모님', body:'엄마는 천리안 판단 검증 연구원, 아빠는 연산망 반도체 기술자였다. 예측과 실행 사이에 인간 확인을 되돌리는 수정안을 발표하려다 사라졌다. 가족 이송표의 사유는 비어 있다.', links:['천리안']});
  G.addNote({type:'인물', title:'할아버지', body:'나를 키운 늙은 정비사. 용달차에 생활칸을 올려 달구지를 함께 만들고 지난겨울 떠났다. 부모가 남긴 것을 끝낼 의무는 없지만, 가고 싶다면 이 차가 남산까지 갈 수 있다고 적었다.', links:['달구지','부모님']});
  G.addNote({type:'물건', title:'엄마의 철제 상자', body:'수첩 등판에서 현재 이송표와 같은 규격의 회로도가 나왔다. 남산 중앙 노드, 달구지 계기판 뒤 검증 모듈, 발신 기록과 당사자 증언을 함께 가져가라는 메모가 적혀 있었다.', links:['부모님','천리안','달구지']});
  G.addNote({type:'물건', title:'계기판 속 검증 모듈', body:'출발 전에 존재를 확인했지만 분리 절차 두 장이 없어 아직 달구지 전장에 연결해 두었다. 절차를 찾고 기록을 모아 남산에 적용해야 한다.', links:['엄마의 철제 상자','부모님','남산']});
  G.addNote({type:'인물', title:'도윤의 가족', body:'부산 부두에서 난방이 끊긴 이송 버스를 고쳐 준 가족. 엄마 하진, 8살 도윤, 동생 유나는 제7 잔류구역 6,412명 가운데 먼저 남쪽으로 보내진 사람들이다.', links:['서울 추방','천리안']});
  G.addNote({type:'본편', title:'남산 코어로 가서 강제 이송 명령을 멈춘다', body:'부산에서는 이 명령에 이의를 제기할 수 없었다. 북쪽으로 가며 발신 기록과 분리 절차, 당사자 증언을 모은 뒤 남산 중앙 노드에서 명령을 멈춰야 한다. 날짜 제한은 없고, 서울에 도착하는 것만으로는 끝나지 않는다.', links:['남산','도윤의 가족','계기판 속 검증 모듈']});
  G.save();
};
G.myName = ()=> (S && S.name) || '나';
G.vanName = ()=> (S && S.vanName) || '달구지';
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
  if(typeof S.vanName!=='string'||!S.vanName.trim()) S.vanName='달구지';
  else S.vanName=S.vanName.trim().slice(0,12);
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
  if(!['main','companion','side'].includes(S.questTrack)) S.questTrack='main';
  if(S.lastJourneyRecap===undefined) S.lastJourneyRecap=null;
  if(!Array.isArray(S.journeyRecaps)) S.journeyRecaps=[];
  if(!S._rescues||typeof S._rescues!=='object'||Array.isArray(S._rescues)) S._rescues={};
  if(!S._stlNights||typeof S._stlNights!=='object'||Array.isArray(S._stlNights)) S._stlNights={};
  G.ensureNarrativeState();
  if(S.recruitQ===undefined) S.recruitQ=null;
  if(S.stopover===undefined) S.stopover=null;
  if(!Number.isFinite(S.locationContractVersion)) S.locationContractVersion=D.eventLocationVersion||1;
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
  /* 이 보정은 영구 규칙이 아니라 구버전 세이브를 위한 1회 마이그레이션이다.
     매 로드마다 used를 지우면 이미 헤어진 인물이 출발지에 다시 생성되어
     순간이동하거나 처음 만나는 것처럼 보인다. */
  if(!S.flags.recruit_migration_v2){
    if(!S.recruitQ) for(const [id,eid] of Object.entries(oldRecruitStarts)){
      if(!S.party.includes(id)) S.used=S.used.filter(x=>x!==eid);
    }
    S.flags.recruit_migration_v2=true;
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
G.exportSave = ()=> S?JSON.stringify(S):'';
/* 가져오기는 현재 세이브를 먼저 보관한 뒤 기존 load/migration 경로로 검증한다.
   파일이 망가졌거나 다른 데이터라면 진행 중인 여정을 그대로 되돌린다. */
G.importSave = raw=>{
  const previous=localStorage.getItem(SAVE_KEY);
  try{
    const candidate=JSON.parse(raw);
    if(!candidate||typeof candidate!=='object'||Array.isArray(candidate)) throw new Error('invalid backup');
    localStorage.setItem(SAVE_KEY,raw);
    if(!G.load()) throw new Error('unloadable backup');
    G.save();
    return {ok:true};
  }catch(e){
    if(previous===null) localStorage.removeItem(SAVE_KEY); else localStorage.setItem(SAVE_KEY,previous);
    G.load();
    return {ok:false,why:'이 게임의 유효한 백업 파일이 아니다'};
  }
};
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
  if(!milestones.first_departure) return {step:1,total:4,kicker:'첫 여정 · 길',title:'주 임무를 보고 첫 길을 고른다',
    body:'「목표」에는 남산에서 강제 이송을 멈추는 주 임무가 표시된다. 지금은 이어진 목적지 가운데 하나를 고르면 된다.',
    points:['목표: 주 임무와 선택 이야기를 따로 확인한다','길: 거리와 시간, 연료를 보고 다음 목적지를 고른다','선택 의뢰: 원할 때만 맡아도 주 임무는 그대로 남는다'],focus:'route'};
  if(!milestones.first_event) return {step:2,total:4,kicker:'첫 여정 · 주행',title:S.driving?'달구지는 고른 길을 따라 달린다':'다음 목적지를 고른다',
    body:S.driving?'남은 거리와 연료를 확인하며 달린다. 길에서 사건이 생기면 이야기를 끝까지 읽고 행동을 고른다.':'거리와 시간, 연료를 다시 보고 다음 목적지를 고른다.',
    points:['대화와 장면은 위에서 아래로 누적된다','선택 결과는 자원과 여정 기록에 남는다'],focus:'drive'};
  const atSettlement=!S.driving&&S.at&&D.nodes[S.at]&&D.nodes[S.at].stl;
  if(atSettlement&&!milestones.first_settlement_visit) return {step:3,total:4,kicker:'첫 여정 · 정착지',title:'필요한 일부터 하나씩 처리한다',
    body:'시장·정비·사람·현장 중 지금 필요한 곳을 고른다. 정착지의 의뢰는 「선택 의뢰」로 따로 기록된다.',
    points:['시장: 물자 거래','정비: 달구지 수리와 개조','사람: 대화, 의뢰, 동료 이야기'],focus:'settlement'};
  if(!milestones.temporary_companion&&S.recruitQ) return {step:4,total:4,kicker:'첫 여정 · 동행',title:'함께 겪은 뒤에 동료가 된다',
    body:'중요 인물을 만났다고 바로 합류하는 것은 아니다. 부탁과 동행 장면을 거치면 「동행 이야기」에 다음 단계가 기록된다.',
    points:['임시 동행은 정식 동료와 구분된다','합류 뒤에는 동료 탭에서 역할과 유대를 확인한다'],focus:'companion'};
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
    {id:'family',done:!!S.flags.intro_family_helped,label:'6,412명 가운데 한 가족을 만났다',detail:'도윤 가족의 버스 난방을 고치고 현재 이송을 직접 보았다'},
    {id:'appeal',done:!!S.flags.intro_appeal_failed,label:'부산에서 이의를 제기했다',detail:'원격 절차는 막혔고 남산 현장 확인만 남았다'},
    {id:'module',done:!!S.flags.intro_module_seen,label:'계기판 속 검증 모듈을 확인했다',detail:'엄마의 회로도와 실제 배선이 일치했다'},
    {id:'trace',done:!!S.flags.first_order_trace,label:'이송 명령의 첫 발신 기록을 찾는다',detail:S.flags.first_order_trace?'부모님의 이송표와 같은 발신 계열임을 확인했다':'부산을 떠난 첫 구간에서 대상 선정 규칙과 발신 번호를 찾는다'},
    {id:'key',done:!!S.flags.parent_key_found,label:'분리 절차를 복원하고 검증키를 꺼낸다',detail:S.flags.parent_key_found?'4–5쪽을 복원해 남산까지 실을 준비가 됐다':'절차 없이 뽑으면 키와 달구지가 함께 망가진다'},
    {id:'witness',done:!!S.flags.es_truth&&witnessed>=D.seoulPillars.관계,label:'발신 기록과 당사자 증언을 맞춰 본다',detail:S.flags.es_truth?'명령 생성 순서를 확인했다':`같은 명령을 겪은 사람들의 이야기를 모은다 · ${witnessed}/${D.seoulPillars.관계}`},
    {id:'seoul',done:!!S.flags.story_done,label:'남산에서 강제 이송을 멈춘다',detail:S.flags.story_done?'제7 잔류구역 이송을 끝냈다':'날짜 제한은 없다. 필요한 기록과 사람을 모은 뒤 남산에서 강제 이송을 멈춘다'}
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
  /* 첫 만남은 정착지에서 열린다. 실제 과제는 다른 목적지 또는 그 인물이
     책임지던 정착지 시설에서 따로 시작하며, 같은 이벤트 안에서 연속 해결하지 않는다. */
  const origin=(S.driving&&S.driving.to)||S.at||def.meetNode||null;
  /* 대사에 쓰인 목적지를 배열 순서로 추측하지 않는다. target은 작가가 정한
     실제 목적지이고, targets는 우회·지역 검사에 쓰는 허용 후보 목록이다. */
  const primary=def.target&&D.nodes[def.target]?def.target:null;
  const target=primary||(def.targets||[]).find(node=>node!==origin&&D.nodes[node])||origin;
  const sameStop=target===origin;
  S.recruitQ={id,stage:'task',target,startedDay:S.day,
    metAt:origin,sameStop,escort:true};
  if(S.driving) S.driving.recruitEscort=id;
  UI.toast(sameStop
    ? `🤝 ${def.name}의 부탁을 ${D.nodes[target].name}에서 바로 진행할 수 있다`
    : `🚚 임시 승객 ${def.name} — ${D.nodes[target].name}에서 부탁이 이어진다`);
  G.save();
  return true;
};
/* 첫 만남을 닫거나 정중히 거절했더라도 그 인물은 정착지에서 사라지지 않는다.
   once는 무작위 재노출만 막고, 플레이어가 직접 다시 말을 거는 선택은 보존한다. */
G.openRecruitMeet = (id)=>{
  const def=D.recruitQuests&&D.recruitQuests[id];
  if(!def||G.hasComp(id)||S.recruitQ) return false;
  const event=D.events.find(item=>item.id===def.meet);
  if(!event) return false;
  const usedIndex=S.used.indexOf(def.meet);
  if(usedIndex>=0) S.used.splice(usedIndex,1);
  G.openEventById(def.meet);
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
  UI.toast(`✓ ${D.recruitQuests[id].name}의 일이 끝났다. 이제 합류를 제안할 수 있다`);
  return true;
};
G.markRecruitRoad = (id)=>{
  if(!S.recruitQ||S.recruitQ.id!==id||S.recruitQ.stage!=='task') return false;
  S.recruitQ.stage='road';
  S.recruitQ.roadFrom=S.driving?S.driving.from:S.at;
  if(S.driving) S.recruitQ.roadAtKm=Math.round(S.driving.gone||0);
  S.recruitQ.roadDay=S.day;
  /* 같은 경유지에서 과제를 마쳤다면 남은 구간부터 실제 임시 동행 효과와
     탑승 카드를 켠다. 새 출발까지 기다리게 하지 않는다. */
  if(S.driving&&G.prepareRecruitGuest) G.prepareRecruitGuest(S.driving);
  UI.toast(`🚚 임시 동행 시작 — ${D.recruitQuests[id].name}, 다음 정차까지`);
  return true;
};
G.openRecruitStep = ()=>{
  const q=S.recruitQ;
  if(!q||S.driving) return false;
  const def=D.recruitQuests[q.id];
  if(!def) return false;
  if(q.stage==='task'){
    if(S.at!==q.target){ UI.toast(`🚚 ${def.name}와 함께 ${D.nodes[q.target].name}(으)로 가야 한다`); return false; }
    G.openEventById(def.task); return true;
  }
  if(q.stage==='road'){
    UI.toast(`🚚 다음 정차까지 임시 동행을 이어간다 — ${def.name}`);
    return false;
  }
  if(q.stage==='follow'){
    if(S.at!==q.target){ UI.toast(`🚚 ${def.name}와 함께 ${D.nodes[q.target].name}(으)로 이동 중이다`); return false; }
    if(Number.isFinite(q.roadDay)&&S.day<=q.roadDay){
      UI.toast(`🔥 ${def.name}와 길에서 하룻밤을 보냈다. 이제 다시 이야기해 보자`);
      return false;
    }
    /* 별도 후일담과 합류 확인을 연속 모달로 열지 않는다. 길 위에서 함께
       보낸 시간이 이미 후일담이므로 다음 정차에서는 합류 결정만 남긴다. */
    G.markRecruitReady(q.id);
    G.openEventById(def.join); return true;
  }
  if(q.stage==='ready'){ G.openEventById(def.join); return true; }
  return false;
};
