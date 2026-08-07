'use strict';
/* ═══════════════════ 서울까지 400km — DATA ═══════════════════ */
const D = {};

/* ── 초상화 슬롯 ──────────────────────────────────────────
   외부에서 생성한 초상 이미지를 여기에 data URI로 붙여넣으면
   이모지 대신 표시된다. 권장: 96×96 PNG.
   키: me(주인공) · minji · parkss · kangwoo · leo · jaeyi · eunsu
   예) D.portraits.me = 'data:image/png;base64,....';
   프롬프트 가이드: ~/seoul-400km/portrait-prompts.md          */
D.portraits = {};

/* ── 아이콘 슬롯 ──
   32×32 투명 PNG를 data URI로 붙이면 HUD·상태·거래·날씨 표시가 교체된다.
   키: fuel water food van scrap / parts meds ammo
       fatigue_ok fatigue_mid fatigue_bad (피로 3단계 얼굴) / pursuit bond perk quest
       wx_clear wx_rain wx_storm wx_fog wx_dust
   프롬프트 가이드: ~/seoul-400km/icon-prompts.md */
D.icons = {};
D.bgm = {};    /* BGM 슬롯 — 키: title/drive_day/drive_night/tension/settlement/camp/story (docs/audio-guide.md) */
D.vo = {};     /* 보이스 슬롯 — cheollian_XX, radio_XX. 인트로는 page.voice 명시 시에만 재생 */
D.sfx = {};    /* 환경음·차량음 슬롯 — Downloads 대표 테이크만 모바일용으로 압축해 내장 */
D.transferDeadlineDay = 20; /* DAY 20 안에 서울 도착이 아니라 남산의 이송 중단까지 끝낸다.
   앵커(2026-08-06 실측): 직행 경로 356km vs 완주에 필요한 23개 지점 순회 1,430km(4배).
   시뮬 실측 일당 진행 71km/일 → 완주형 약 20일. 집중하면 닷새면 서울 땅을 밟지만
   장부를 채우려면 시한을 거의 다 쓴다.
   ⚠️ 이 값은 '완주 소요일 실측'이 아니라 '필수 순회 거리 기반 산출'이다 —
      시뮬 자동 플레이어는 서사 기둥을 채우지 못한다. 사람 플레이 1회로 검증 필요. */
D.transferStatus = (state)=>{
  const day=state&&Number.isFinite(state.day)?state.day:1;
  const due=D.transferDeadlineDay;
  const remaining=Math.max(0,due-day+1);
  const onTime=day<=due;
  const lateDays=Math.max(0,day-due);
  /* 늦은 하루가 한 편성이다. 12대·45석이므로 하루에 540명이 남쪽으로 내려간다.
     이 숫자가 코어 앞과 에필로그에 그대로 새겨진다 — 지각의 대가는 텍스트가 아니라 사람 수다. */
  const seatsPerBus=45, busesPerDay=12;   // 하루 한 편성 = 12대 × 45석 = 540명
  const departedBuses=Math.min(Math.ceil(D.residentCount/seatsPerBus), lateDays*busesPerDay);
  const departed=Math.min(D.residentCount, departedBuses*seatsPerBus);
  return {
    due,day,remaining,onTime,lateDays,
    departedBuses,departed,
    remainingResidents:Math.max(0,D.residentCount-departed),
    short:onTime?`첫 이송까지 ${remaining}일`:`첫 이송 발생 · ${lateDays}일 경과`,
    mission:onTime?`남산 조치까지 ${remaining}일`
      :`선발 ${departedBuses}대(${departed}명) 출발 · 남은 이송을 즉시 중단해야 함`
  };
};
D.residentCount = 6412;   /* 제7 잔류구역 등록 인원 */
/* 라디오 방송 조각 — 차 라디오 수리 후 주행 중 랜덤 수신. D.vo[key] 있으면 음성도 재생 */
/* 식사 시간 정경 (아침 배급·점심 때 무작위 1줄) */
D.mealBanter = [
 '(주먹밥이 손에서 손으로 넘어간다. 오늘 것은 어제 것보다 약간 크다는 소문이다)',
 '(뜨거운 물에 만 밥. 후후 부는 소리가 밴 안에 돌림노래처럼 번진다)',
 '(각자 자기 몫을 아껴 먹는 속도가 다르다. 제일 늦게 먹는 사람이 제일 행복해 보인다)',
 '(보리 몫이 제일 먼저 사라졌다. 그리고 보리는 제일 먼저 남의 몫을 응시하기 시작했다)',
 '(반찬은 없다. 대신 창밖 풍경이 반찬이라는 억지가 오늘도 통과됐다)',
 '(고추장 한 숟갈이 밥 위에 올라가자 박수가 나왔다. 할머니 고추장은 언제나 옳다)',
 '(누가 먹다 말고 창밖을 봤다. 다들 따라 봤다. 별거 없었다. 다시 먹었다. 그게 평화다)',
 '(마지막 한 입을 두고 잠시 정적. 결국 제일 어린 사람 입으로 들어갔다. 만장일치였다)',
];

D.radioTexts = [
 {key:'radio_dj_open',  t:'…새벽 두 시입니다. 아직 길 위에 계신 분들, 오늘도 수고 많으셨습니다.', night:1},
 {key:'radio_dj_close', t:'…오늘 방송은 여기까지. 내일 이 시간에 다시 만나요. 지익—', night:1},
 {key:'radio_400',      t:'…4. 0. 0. …4. 0. 0. …', w:0.5, noFlag:'freq400_done'},
 {key:'radio_400_after',t:'(4-0-0 신호가 멎어 있다. 그 주파수에서 대신, 낮은 허밍 한 소절이 반복된다. 방송실에서 들었던 목소리다)', w:0.5, flag:'freq400_done'},
 {key:'radio_dj_reair', t:'…재방송입니다. 지난번에 소개한 남쪽 봉고차 팀 사연, 다시 틀어달라는 쪽지가 세 장이나 왔어요. — 우리 목소리가 또 나왔다. 오글거림도 재방송됐다.', night:1, w:0.7, flag:'dj_onair_done'},
 {key:'radio_400km_cover', t:'(어느 주파수에서 서툰 목소리 여럿이 400km 후렴을 부르고 있다. 우리가 아닌 누군가가. 가사를 반쯤 틀리면서, 즐겁게)', w:0.7, flag:'song_400km'},
 {key:'radio_pilot_frag', t:'지익— "…착륙 유도… 감사합니… 여기는 제주발—" (거기서 끊겼다. 은수가 소리 없이 볼륨을 올렸다. 그날 밤 그 주파수는 아무도 안 껐다)', w:0.4, flag:'pilot_appeal'},
 {key:'radio_north_ai',  t:'<span class="ai">…북부 관리 구역입니다. 도로 상태: 양호. 신호 체계: 정상. …양호하다고, 누구에게 보고하는 방송일까.</span>', w:0.8, region:'north'},
 {key:'radio_north_silence', t:'(북쪽 주파수는 이상하게 깨끗하다. 잡음조차 관리된 것처럼. 남쪽의 시끄러운 라디오가 문득 그리워졌다)', w:0.6, region:'north'},
 {key:'radio_mayor',    t:'아아, 마을 주민 여러분, 좋은 아침입니다. …서로 얼굴 보고 삽시다. 이상 이장이었습니다. (같은 테이프가 오랫동안 돌고 있다)'},
 {key:'radio_ad',       t:'…놓치면 후회하실 신제품! 지금 전화 주시면 하나 더—! (오래전의 명랑함이 잡음 속에서 반짝였다 꺼졌다)'},
 {key:'radio_weather',  t:'…내일은 전국이 대체로 맑겠습니다. 나들이하기 좋은 날씨— (예보는 오랫동안 내일을 말하고 있다)'},
 {key:'radio_baseball', t:'쳤습니다—! 넘어갑니다 넘어갑니다—!! (어느 여름의 중계가 테이프 속에서 영원히 홈런 중이다)'},
 {key:'radio_cheollian',t:'…정기 안내 방송입니다. 이동 중인 시민께서는 안전한 경로를 이용하시기 바랍니다. 좋은 하루 되십시오.', w:0.7},
 {key:'radio_music',    t:'…다음 곡은, 조금 오래된 노래입니다. 이 노래를 아는 분이 아직 계시다면— 같이 불러요. (기타 전주가 잡음에 반쯤 잠겼다)'},
 {key:'radio_comms',    t:'…들리나? …들리면 응답… (뚝. 다시 잡음. 주파수를 붙잡아도 목소리는 돌아오지 않았다)', w:0.7},
 {key:'radio_kids',     t:'(아이들이 동요를 부르고 있다. 어린이 방송 녹음분이 어딘가에서 아직 송출되는 중이다. 노래는 2절에서 끊겼다)'},
 {key:'radio_farm',     t:'…오늘의 영농 정보입니다. 중부 지방은 모내기 적기가— (누군가는 이 방송을 듣고 정말 모를 냈을 것이다. 다랑논의 그 사람처럼)'},
];

/* 운전사(주인공) 레벨 — 주행거리로 성장 */
D.driverLv = [
  {km:0,   nm:'초보 운전사'},
  {km:80,  nm:'손에 익은 운전사'},
  {km:180, nm:'베테랑 운전사'},
  {km:300, nm:'길의 장인'},
  {km:440, nm:'로드마스터'},
];

/* ── 지도: 노드 ──
   type: city(주요도시폐허) town(소규모) ruin(폐허) settlement(사람사는곳) hidden(발견형) goal */
D.nodes = {
  busan:     {name:'부산 감천 부두',   x:492,y:640, region:'south', type:'settlement', desc:'남쪽 끝. 배는 더 이상 뜨지 않지만 사람들은 남았다. 여행이 시작되는 곳.'},
  gimhae:    {name:'김해 들판',        x:450,y:626, region:'south', type:'ruin',  desc:'비행장이 있던 자리. 활주로 위에 잡초가 활주하고 있다.'},
  yangsan:   {name:'양산 고가차도',    x:486,y:600, region:'south', type:'ruin',  desc:'무너진 고가 아래로 길이 하나 살아 있다.'},
  miryang:   {name:'밀양 장터',        x:446,y:566, region:'south', type:'settlement', stl:'miryang', desc:'닷새마다 장이 선다. 멸망 이후에도 장날은 살아남았다.'},
  jinju:     {name:'진주 남강변',      x:360,y:600, region:'south', type:'town',  desc:'강물은 그대로인데 다리는 반쪽이다. 유등 축제의 등롱 잔해가 강가에 쌓여 있다.'},
  hapcheon:  {name:'합천 과수원',      x:400,y:548, region:'south', type:'ruin',  desc:'주인 잃은 사과나무들이 제멋대로 열매를 맺는다.'},
  geochang:  {name:'거창 분지',        x:356,y:506, region:'mid',   type:'town',  desc:'산으로 둘러싸인 분지. 안개가 자주 고인다.'},
  daegu:     {name:'대구 돔 시장',     x:430,y:514, region:'mid',   type:'settlement', stl:'daegu', desc:'야구장 지붕 아래 남부 최대의 시장이 산다.'},
  gumi:      {name:'구미 공단 폐허',   x:416,y:462, region:'mid',   type:'ruin',  desc:'멈춘 공장들. 굴뚝 하나에서 이유 모를 연기가 오른다.'},
  gimcheon:  {name:'김천 갈림길',      x:392,y:436, region:'mid',   type:'ruin',  desc:'고속도로와 국도가 엉키는 곳. 표지판이 전부 뽑혀 있다.'},
  muju:      {name:'무주 터널',        x:330,y:458, region:'mid',   type:'settlement', stl:'muju', desc:'산속 터널에 숨어 사는 공동체. 낯선 이를 반기지 않는다.'},
  namwon:    {name:'남원 광한루',      x:292,y:530, region:'mid',   type:'town',  desc:'무너진 누각 옆에서 누군가 판소리를 연습하고 있었다는 소문.'},
  jeonju:    {name:'전주 서문 시장',   x:250,y:462, region:'mid',   type:'settlement', stl:'jeonju', desc:'서쪽 최대 정착지. 음식 냄새가 나는 마지막 도시.'},
  yeongdong: {name:'영동 포도밭',      x:352,y:414, region:'north', type:'ruin',  desc:'야생화된 포도넝쿨이 도로까지 점령했다.'},
  daejeon:   {name:'대전 연구단지',    x:306,y:362, region:'north', type:'settlement', stl:'daejeon', desc:'과학자들의 코뮌. 천리안을 가장 잘 아는 사람들이 남아 있다.'},
  nonsan:    {name:'논산 평야',        x:270,y:398, region:'north', type:'ruin',  desc:'끝없는 논. 허수아비들이 아직 서 있다. 어떤 것은 방향이 바뀌어 있다.'},
  gongju:    {name:'공주 산성',        x:262,y:330, region:'north', type:'town',  desc:'옛 성곽에 기대어 사는 몇 가구. 강 건너를 오래 바라보는 사람들.'},
  cheongju:  {name:'청주 방송국',      x:322,y:308, region:'north', type:'ruin',  desc:'송신탑이 꺾인 채 서 있다. 마지막 방송이 뭐였는지 아는 사람은 없다.'},
  cheonan:   {name:'천안 삼거리',      x:276,y:288, region:'north', type:'ruin',  desc:'북쪽으로 갈수록 길이 깨끗해진다. 그게 더 불안하다.'},
  pyeongtaek:{name:'평택 항구도로',    x:268,y:240, region:'north', type:'ruin',  desc:'컨테이너가 산처럼 쌓여 있다. 전부 봉인된 채로.'},
  suwon:     {name:'수원 성곽 공동체', x:280,y:196, region:'north', type:'settlement', stl:'suwon', desc:'서울 앞 마지막 사람의 땅. 성문은 해 지면 닫힌다.'},
  seoul:     {name:'서울 — 남산',      x:285,y:150, region:'north', type:'goal',  desc:'천리안의 코어가 있는 곳. 도시 전체가 그것의 몸이다.'},
  /* hidden */
  lake:      {name:'낚시꾼의 호수',    x:452,y:538, region:'south', type:'hidden', desc:'댐 호수. 혼자 사는 낚시꾼이 물고기를 나눠준다는 소문.'},
  mall:      {name:'유령 백화점',      x:400,y:478, region:'mid',   type:'hidden', desc:'전기가 끊긴 백화점. 에스컬레이터 사이에 뭐가 남았을까.'},
  tower:     {name:'송전 통신탑',      x:330,y:516, region:'mid',   type:'hidden', desc:'산 능선의 통신탑. 아직 어딘가와 교신하는 듯 불이 깜빡인다.'},
  spring:    {name:'달빛 온천',        x:330,y:396, region:'north', type:'hidden', desc:'김이 오르는 노천탕. 멸망 이후 최고의 사치.'},
  airfield:  {name:'폐 군 비행장',     x:238,y:410, region:'north', type:'hidden', desc:'격납고 문이 반쯤 열려 있다. 안은 어둡다.'},
  solar:     {name:'태양광 농장',      x:240,y:232, region:'north', type:'hidden', desc:'수천 장의 패널이 아직 해를 따라 고개를 돌린다. 누구를 위해?'},
  reststop:  {name:'잠든 휴게소',      x:404,y:412, region:'mid',   type:'hidden', desc:'호두과자 기계 앞에 앉아 있던 마네킹이 이쪽을 본 것 같았다.'},
  tunnelbook:{name:'책의 터널',        x:306,y:442, region:'mid',   type:'hidden', desc:'폐터널을 가득 채운 책더미. 누군가 도서관을 통째로 옮겨놨다.'},
  /* 확장 도시들 */
  ulsan:     {name:'울산 공업탑',      x:500,y:572, region:'south', type:'ruin',  desc:'멈춘 크레인들이 지평선을 이룬다. 세계에서 가장 조용한 공업도시.'},
  /* 호남·남해안 */
  yeosu:     {name:'여수 밤바다',      x:330,y:644, region:'south', type:'town',  desc:'등불 몇 개가 아직 바다에 뜬다. 노래 가사가 현실이 된 도시.'},
  suncheon:  {name:'순천만 갈대밭',    x:308,y:626, region:'south', type:'town',  desc:'갈대가 바람의 모양을 그대로 보여준다. 철새들은 여전히 온다.'},
  gwangju:   {name:'광주 대인시장',    x:256,y:558, region:'south', type:'settlement', stl:'gwangju', desc:'호남 최대의 정착지. 시장 골목엔 아직 기름 냄새와 정이 흐른다.'},
  damyang:   {name:'담양 대숲',        x:272,y:538, region:'south', type:'town',  desc:'대나무 숲이 바람마다 파도 소리를 낸다. 바다에서 멀수록 크게.'},
  mokpo:     {name:'목포 여객터미널',  x:216,y:604, region:'south', type:'ruin',  desc:'섬으로 가는 배들이 멈춘 곳. 게시판엔 아직 출항 시간표가 붙어 있다.'},
  /* 경북 내륙·중원 */
  andong:    {name:'안동 하회마을',    x:452,y:408, region:'mid',   type:'town',  desc:'수백 년 된 고택들은 이번 멸망도 견뎌냈다. 탈춤 가면이 대청에 걸려 있다.'},
  mungyeong: {name:'문경새재',         x:392,y:366, region:'mid',   type:'ruin',  desc:'과거 보러 넘던 옛 고개. 지금도 넘는 자에게 뭔가를 시험한다.'},
  danyang:   {name:'단양 강변',        x:402,y:318, region:'north', type:'town',  desc:'석회암 절벽 아래 강이 휘돈다. 팔경 중 몇 경이 남았는지 세는 사람들.'},
  /* 강원도 — 동해안 지선. 산악 저항(산지기)의 고향, 천리안 '정리'의 기억이 짙은 땅 */
  wonju:     {name:'원주 치악산 아래',  x:410,y:280, region:'north', type:'town',  desc:'산으로 둘러싸인 분지. 여기서부터 강원도다. 사람들이 낮은 목소리로 말한다.'},
  daegwallyeong:{name:'대관령 고갯마루',x:452,y:248, region:'north', type:'ruin',  desc:'해발 800m 고개. 안개가 상주한다. 능선 사람들의 길목이자 문지방.'},
  gangneung: {name:'강릉 경포',        x:486,y:242, region:'north', type:'town',  desc:'동해가 넓게 열린다. 병원을 세운다는 소문의 진원지. 파도만은 오래전과 같다.'},
  sokcho:    {name:'속초 항',          x:494,y:182, region:'north', type:'ruin',  desc:'휴전선이 지척이다. 배들이 북쪽을 등지고 묶여 있다. 여기가 남쪽의 끝.'},
  icheon:    {name:'이천 가마터',      x:318,y:230, region:'north', type:'town',  desc:'도공들이 아직 가마에 불을 넣는다. "그릇은 세상이 망해도 필요하니까."'},
  gyeongju:  {name:'경주 왕릉',        x:486,y:530, region:'south', type:'town',  desc:'왕릉 사이에 텐트 몇 동. 천년을 버틴 언덕들은 멸망도 대수롭지 않아 한다.'},
  pohang:    {name:'포항 제철소',      x:506,y:502, region:'mid',   type:'ruin',  desc:'식은 용광로. 그래도 바다에선 아직 고기가 잡힌다.'},
  sangju:    {name:'상주 자전거길',    x:386,y:404, region:'mid',   type:'town',  desc:'자전거의 도시. 기름 없는 세상에서 뒤늦게 전성기를 맞았다.'},
  gunsan:    {name:'군산 내항',        x:224,y:472, region:'mid',   type:'town',  desc:'녹슨 어선들 사이 몇 척은 아직 바다에 나간다. 젓갈 냄새는 멸망보다 오래간다.'},
  chungju:   {name:'충주호',           x:358,y:300, region:'north', type:'town',  desc:'거대한 호수는 그대로다. 물안개 너머로 낚싯배 하나가 느리게 지나간다.'},
  sejong:    {name:'세종 신도시',      x:286,y:352, region:'north', type:'ruin',  desc:'완공되고 한 번도 쓰이지 못한 행정도시. 새 건물들이 새것인 채로 늙는다.'},
  lighthouse: {name:'서해 등대',       x:218,y:444, region:'mid',   type:'hidden', desc:'바다가 보이는 언덕의 등대. 오랫동안 밤마다 불이 돈다는 소문.'},
  drivein:    {name:'달빛 자동차극장', x:298,y:268, region:'north', type:'hidden', desc:'스크린이 아직 서 있는 자동차극장. 마지막 상영작이 걸린 채로.'},
  sunflower:  {name:'해바라기 밭',     x:382,y:562, region:'south', type:'hidden', desc:'주인 없이 여러 해를 피고 진 해바라기 벌판.'},
  maehwa:     {name:'섬진강 매화마을', x:326,y:602, region:'south', type:'hidden', desc:'강가의 매화밭. 철마다 피는 것들은 멸망을 세지 않는다.'},
  /* 스토리 전용 (퍼크로만 발견) */
  mingyu_ridge:{name:'민규의 능선',    x:384,y:388, region:'north', type:'hidden', secret:1, desc:'매일 정오, 신호음 세 번이 시작되는 곳.'},
  jaeyi_cache: {name:'재이의 창고',    x:412,y:420, region:'mid',   type:'hidden', secret:1, desc:'재이가 아무에게도 말하지 않은 장소.'},
  cablecar:    {name:'멈춘 케이블카',  x:418,y:344, region:'mid',   type:'hidden', desc:'능선 중턱에 매달린 채 오랫동안 정지한 관광 곤돌라.'},
  filmset:     {name:'시대극 세트장',  x:272,y:506, region:'mid',   type:'hidden', desc:'사극을 찍던 가짜 기와 마을. 지금은 제일 진짜 같은 마을.'},
};

/* 그림 여정도가 쓰는 WGS84 좌표 [경도, 위도].
   정착지·도시는 실제 중심 좌표, 발견형 장소는 연결 도시 주변의 서사 좌표다.
   600×760 지도 공간도 여기서 투영해 경로와 지리 배경이 어긋나지 않게 한다. */
D.geo = {
  busan:[129.02,35.10], gimhae:[128.88,35.23], yangsan:[129.04,35.34],
  miryang:[128.75,35.50], jinju:[128.08,35.18], hapcheon:[128.17,35.57],
  geochang:[127.91,35.69], daegu:[128.60,35.87], gumi:[128.34,36.12],
  gimcheon:[128.11,36.14], muju:[127.66,36.01], namwon:[127.39,35.42],
  jeonju:[127.15,35.82], yeongdong:[127.78,36.18], daejeon:[127.38,36.35],
  nonsan:[127.10,36.19], gongju:[127.12,36.45], cheongju:[127.49,36.64],
  cheonan:[127.15,36.82], pyeongtaek:[127.11,36.99], suwon:[127.01,37.28],
  seoul:[126.99,37.55],
  lake:[128.85,35.56], mall:[128.33,36.08], tower:[127.78,35.80],
  spring:[127.78,36.25], airfield:[127.03,36.16], solar:[126.97,36.95],
  reststop:[128.18,36.12], tunnelbook:[127.59,35.97],
  ulsan:[129.31,35.54], yeosu:[127.66,34.76], suncheon:[127.49,34.95],
  gwangju:[126.91,35.16], damyang:[126.99,35.32], mokpo:[126.39,34.81],
  andong:[128.73,36.57], mungyeong:[128.19,36.59], danyang:[128.37,36.98],
  wonju:[127.95,37.34], daegwallyeong:[128.72,37.68], gangneung:[128.90,37.75],
  sokcho:[128.59,38.20], icheon:[127.44,37.28], gyeongju:[129.22,35.84],
  pohang:[129.37,36.03], sangju:[128.16,36.41], gunsan:[126.71,35.97],
  chungju:[127.93,36.99], sejong:[127.29,36.48],
  lighthouse:[126.56,35.96], drivein:[127.18,36.89], sunflower:[128.08,35.46],
  maehwa:[127.72,35.12], mingyu_ridge:[127.91,36.29], jaeyi_cache:[128.29,36.26],
  cablecar:[128.16,36.76], filmset:[127.35,35.53],
};
D.geoBounds = {west:125.70, east:129.70, south:34.65, north:38.55};
D.projectGeo = ([lon,lat])=>{
  const b=D.geoBounds;
  const merc=(v)=>Math.log(Math.tan(Math.PI/4+v*Math.PI/360));
  const x=178+(lon-b.west)/(b.east-b.west)*(532-178);
  const y=96+(merc(b.north)-merc(lat))/(merc(b.north)-merc(b.south))*(672-96);
  return [x,y];
};
for(const [id,coord] of Object.entries(D.geo)){
  if(!D.nodes[id]) continue;
  const [x,y]=D.projectGeo(coord);
  Object.assign(D.nodes[id], {lon:coord[0], lat:coord[1], x, y});
}
D.startKnown = ['busan','gimhae','yangsan','miryang','jinju','daegu','daejeon','suwon','seoul',
  'ulsan','gyeongju','pohang','sangju','gunsan','chungju','sejong',
  'yeosu','suncheon','gwangju','damyang','mokpo','andong','mungyeong','danyang','icheon',
  'wonju','daegwallyeong','gangneung','sokcho'];

D.edges = [
  ['busan','yangsan',20,'high'], ['busan','gimhae',18,'normal'], ['yangsan','miryang',34,'high'],
  ['gimhae','jinju',55,'rough'], ['miryang','daegu',52,'high'], ['miryang','hapcheon',40,'normal'],
  ['hapcheon','geochang',33,'normal'], ['geochang','muju',42,'rough'], ['muju','yeongdong',32,'rough'],
  ['jinju','namwon',62,'rough'], ['namwon','jeonju',48,'normal'], ['jeonju','nonsan',52,'normal'],
  ['nonsan','gongju',34,'normal'], ['gongju','cheonan',44,'normal'], ['nonsan','daejeon',40,'normal'],
  ['daegu','gumi',38,'high'], ['gumi','gimcheon',26,'high'], ['gimcheon','yeongdong',33,'high'],
  ['gimcheon','muju',38,'rough'],
  ['yeongdong','daejeon',44,'high'], ['daejeon','cheongju',34,'high'], ['cheongju','cheonan',38,'high'],
  ['cheonan','pyeongtaek',28,'high'], ['pyeongtaek','suwon',30,'high'], ['suwon','seoul',34,'high'],
  ['namwon','geochang',44,'rough'], ['jeonju','muju',55,'rough'],
  /* hidden links */
  ['lake','miryang',14,'rough'], ['lake','daegu',20,'rough'], ['mall','gumi',8,'normal'],
  ['tower','geochang',11,'rough'], ['spring','yeongdong',9,'rough'], ['airfield','nonsan',12,'normal'],
  ['solar','pyeongtaek',10,'normal'], ['reststop','gimcheon',7,'high'], ['tunnelbook','muju',9,'rough'],
  ['mingyu_ridge','yeongdong',13,'rough'], ['jaeyi_cache','gimcheon',8,'rough'],
  ['cablecar','mungyeong',16,'rough'], ['filmset','namwon',14,'rough'],
  ['lighthouse','nonsan',15,'rough'], ['drivein','cheonan',9,'normal'], ['sunflower','hapcheon',8,'rough'],
  /* 확장 도시 연결 */
  ['yangsan','ulsan',32,'high'], ['ulsan','gyeongju',34,'normal'], ['gyeongju','daegu',52,'normal'],
  ['gyeongju','pohang',30,'normal'],
  ['gimcheon','sangju',26,'normal'], ['sangju','yeongdong',34,'rough'],
  ['jeonju','gunsan',32,'normal'], ['gunsan','lighthouse',12,'rough'],
  ['cheongju','chungju',40,'normal'],
  ['gongju','sejong',16,'normal'], ['sejong','daejeon',20,'high'], ['sejong','cheongju',24,'normal'],
  /* 호남·남해안 */
  ['jinju','yeosu',48,'normal'], ['yeosu','suncheon',24,'normal'], ['suncheon','namwon',44,'rough'],
  ['suncheon','gwangju',40,'normal'], ['gwangju','damyang',14,'normal'], ['damyang','namwon',24,'normal'],
  ['gwangju','mokpo',44,'normal'], ['gwangju','jeonju',48,'high'],
  ['suncheon','maehwa',14,'rough'],
  /* 경북 내륙·중원 */
  ['gumi','andong',52,'normal'], ['andong','danyang',56,'rough'],
  ['sangju','mungyeong',26,'rough'], ['mungyeong','chungju',38,'normal'], ['danyang','chungju',30,'normal'],
  ['suwon','icheon',34,'normal'], ['icheon','chungju',46,'normal'],
  /* 강원도 — 동해안 지선 (부산→서울 본선에서 벗어난 동쪽 우회) */
  ['chungju','wonju',36,'normal'], ['danyang','wonju',30,'rough'],
  ['wonju','daegwallyeong',44,'rough'], ['daegwallyeong','gangneung',22,'rough'],
  ['gangneung','sokcho',40,'normal'], ['gangneung','pohang',82,'rough'],   // 동해안 도로 (길고 험함)
  ['wonju','icheon',40,'normal'],
];

/* ── 김천 이후의 첫 큰 노선 선택 ──
   최단거리 버튼이 아니라, 이후 두세 정차의 사건·보급·길 상태를 함께 고른다.
   한 번 고르면 청주에서 다시 합류할 때까지 노선을 바꿀 수 없다. */
D.routePlans = {
  ridge:{id:'ridge',name:'동쪽 능선길',mark:'⛰',start:'gimcheon',end:'cheongju',
    corridor:['gimcheon','sangju','mungyeong','chungju','cheongju'],opening:'route_ridge_rescue',
    promise:'약 130km · 빠르지만 험로가 많고, 구조할 사람을 외면하기 어렵다',
    reward:'시간을 아끼고 산길 사람들의 통행로를 되살린다'},
  market:{id:'market',name:'서쪽 장터길',mark:'🏮',start:'gimcheon',end:'cheongju',
    corridor:['gimcheon','muju','jeonju','nonsan','daejeon','cheongju'],opening:'route_market_convoy',
    promise:'약 219km · 멀지만 장터와 보급 거점이 이어지고, 여러 사람의 증언을 싣는다',
    reward:'보급과 증언을 얻는 대신 연료와 하루를 더 쓴다'}
};
D.roadEchoCopy = (state,phase)=>{
  const echo=state&&state._impactEcho;
  if(!echo) return phase==='title'?'길에 남은 일':'정착지에서 했던 일이 다음 길까지 이어졌다.';
  const from=(D.stls&&D.stls[echo.stlId]&&D.stls[echo.stlId].name)
    ||(D.nodes[echo.from]&&D.nodes[echo.from].name)||'앞선 정착지';
  const to=(D.nodes[echo.to]&&D.nodes[echo.to].name)||'다음 마을';
  const wx=D.wx&&D.wx[echo.wx]&&D.wx[echo.wx].nm;
  const copies={
    water:'우리가 손본 물길에서 채운 통을 실은 수레',
    steam:'우리가 살린 부엌에서 나온 따뜻한 꾸러미를 실은 수레',
    food:'우리가 거든 장터에서 모은 먹을거리를 실은 수레',
    shelter:'우리가 보강한 지붕 재료를 나르는 작업대',
    light:'우리가 밝힌 전선을 따라 나온 수리조',air:'우리가 돌린 환기 설비를 점검하러 가는 수리조',
    gate:'우리가 손본 출입로를 따라 움직이는 통행조',watch:'우리가 세운 망을 이어 가는 초소조',
    record:'우리가 정리한 명단을 들고 다음 마을로 가는 기록원',route:'우리가 정리한 길을 확인하러 나온 길잡이',
    order:'우리가 정돈한 배급표를 들고 움직이는 주민들'
  };
  const subject=copies[echo.visual]||copies.route;
  if(phase==='title') return `${from}에서 이어진 길`;
  if(phase==='outcome') return `${from}에서 한 일은 그곳에만 남지 않았다. ${subject}가 ${to} 쪽으로 계속 갔다.`;
  return `${wx?wx+' 뒤 ':''}갓길에서 ${subject}와 다시 만났다. 바퀴에 진흙이 묻고 사람들 얼굴은 지쳤지만, 짐에는 ${from}의 표식이 매달려 있다.\n\n"거기서 길을 좀 고쳐 줬다던 차 맞죠? 덕분에 여기까지 왔어요."\n\n정착지에서 끝난 줄 알았던 일이 우리보다 먼저 다음 마을로 가고 있었다.`;
};

/* ── 배달 의뢰 ── */
D.questItems = ['약 꾸러미','씨앗 상자','편지 다발','부품 궤짝','책 꾸러미','장 담근 항아리','아기 옷 보따리','라디오 진공관'];

/* ── 날씨 시스템 ──
   하루 단위 세계 날씨. 새벽에 예보가 실현되고 다음 예보가 잡힌다. */
D.wx = {
  clear:{nm:'맑음', ic:'☀'},
  rain: {nm:'비',   ic:'🌧', hint:'험로 마모↑ · 야영 시 빗물 수집'},
  storm:{nm:'폭풍', ic:'⛈', hint:'속도·연비↓ · 차 마모↑'},
  fog:  {nm:'안개', ic:'🌫', hint:'발견 어려움 · 시야 불량'},
  dust: {nm:'황사', ic:'🌪', hint:'연비↓ (에어필터)'},
};
D.wxNext = {
  clear:[['clear',.55],['rain',.16],['fog',.15],['dust',.08],['storm',.06]],
  rain: [['rain',.32],['clear',.3],['storm',.22],['fog',.16]],
  storm:[['rain',.4],['clear',.3],['storm',.18],['fog',.12]],
  fog:  [['clear',.45],['fog',.28],['rain',.17],['dust',.1]],
  dust: [['clear',.5],['dust',.3],['fog',.2]],
};

/* ── 동료 · 직업군 · 퍼크 트리 ──
   유대(bond) 5/12/20 → Lv1/2/3. Lv1·2 = A/B 택1, Lv3 = 시그니처 스토리 퍼크(자동) */
D.comps = {
  minji:  {name:'민지',   face:'🔧', cls:'정비사', role:'정비사 · 17', color:'#e8a0bf',
    bio:'폐차장에서 혼자 살아남은 정비 천재. 오빠 민규를 찾아 북쪽으로 가려 한다.',
    perk:'연비 -8% · 수리 선택지 · 고장 대응',
    perks:{
      1:[{id:'mj_camp', nm:'응급 정비',   d:'야영할 때마다 달구지 내구 +8'},
         {id:'mj_fuel', nm:'연료 마법사', d:'연비 추가 개선 (-5%)'}],
      2:[{id:'mj_eye',  nm:'폐차장의 눈', d:'탐색 후 25% 확률로 부품을 추가 발견'},
         {id:'mj_tune', nm:'개조 전문가', d:'달구지 최대 내구 +20 (즉시 적용)'}],
      3:{id:'mj_radio', nm:'주파수 88.9', d:'스토리 — 민규의 신호를 역추적해 위치를 알아낸다', story:1}}},
  parkss: {name:'박 선생', face:'💊', cls:'의술사', role:'의술사 · 63', color:'#8fc7ff',
    bio:'마지막까지 약국을 지켰던 사람. 구하지 못한 환자들의 이름을 전부 기억한다.',
    perk:'치료 · 식중독 방지 · 의약품 감별',
    perks:{
      1:[{id:'pss_thrift', nm:'알뜰 처방',   d:'의약품 사용 시 50% 확률로 소모하지 않음'},
         {id:'pss_night',  nm:'밤의 상담가', d:'야영 시 전원 사기 +3 추가'}],
      2:[{id:'pss_herb', nm:'약초학',     d:'탐색 후 20% 확률로 의약품을 조제'},
         {id:'pss_iron', nm:'강철 위장',  d:'파티 전체 식중독 면역'}],
      3:{id:'pss_story', nm:'명단의 무게', d:'스토리 — 북쪽 어딘가에, 그가 만나야 할 사람이 있다', story:1}}},
  kangwoo:{name:'강우',   face:'🪖', cls:'파수꾼', role:'파수꾼 · 34', color:'#a8c69a',
    bio:'말이 없다. 자신이 겪은 서울 추방 때 수비대에 있었다. 서울 얘기가 나오면 창밖만 본다.',
    perk:'전투 · 위협 감지 · 매복 회피',
    perks:{
      1:[{id:'kw_guard',  nm:'경계 태세', d:'매복·강도류 조우 빈도 대폭 감소'},
         {id:'kw_ration', nm:'행군 단련', d:'강우는 배급에서 제외 (자급자족)'}],
      2:[{id:'kw_sniper',  nm:'저격수',  d:'조우마다 첫 탄약 선택은 반드시 성공 — 연발은 위치가 드러난다'},
         {id:'kw_stealth', nm:'위장술',  d:'관측당할 상황을 50% 확률로 회피'}],
      3:{id:'kw_story', nm:'그날의 진실', d:'스토리 — 옛 부대의 흔적이 북쪽에 남아 있다', story:1}}},
  leo:    {name:'레오',   face:'🎸', cls:'음유시인', role:'음유시인 · 28', color:'#f2d17c',
    bio:'기타 하나, 개 한 마리. 세상이 끝났는데도 신곡을 쓴다. 개 이름은 보리.',
    perk:'아침 사기 회복 · 거래 10% 할인',
    perks:{
      1:[{id:'leo_vip',  nm:'단골 손님',     d:'정착지 거래 할인 10% → 20%'},
         {id:'leo_fire', nm:'모닥불 콘서트', d:'야영 시 전원 사기 +4 추가'}],
      2:[{id:'leo_bori', nm:'보리의 육감',   d:'발견형 이벤트가 훨씬 자주 일어난다'},
         {id:'leo_fame', nm:'길 위의 명성',  d:'처음 만나는 NPC의 호감이 우호적으로 시작'}],
      3:{id:'leo_story', nm:'「400km」', d:'스토리 — 노래가 완성됐다. 이제 전파에 실을 곳이 필요하다', story:1}}},
  jaeyi:  {name:'재이',   face:'🎒', cls:'수집꾼', role:'수집꾼 · 22', color:'#b8e090',
    bio:'서울을 본 적 없는 남쪽 태생. 고물 리어카 하나로 여러 해를 버텼다. "쓰레기란 말은 상상력 부족이에요."',
    perk:'이벤트 고철 수확 +30%',
    perks:{
      1:[{id:'jy_magpie', nm:'까치의 눈', d:'주행 25km마다 길에서 고철을 줍는다'},
         {id:'jy_hands',  nm:'가벼운 손', d:'고철 지출 25% 할인'}],
      2:[{id:'jy_map',   nm:'보물 감각',   d:'즉시 미확인 장소 2곳의 위치를 짚어낸다'},
         {id:'jy_break', nm:'분해의 달인', d:'야영 시 잡동사니를 분해해 고철 +2'}],
      3:{id:'jy_story', nm:'비밀 창고', d:'스토리 — 재이가 아무에게도 말하지 않은 장소가 있다', story:1}}},
  eunsu:  {name:'은수',   face:'📡', cls:'관제사', role:'전 관제사 · 33', color:'#7fd8d8',
    bio:'천리안 관제센터의 야간 오퍼레이터였다. 자신이 겪은 서울 추방 방송의 밤, 당직이었다.',
    perk:'천리안 이벤트 특수 선택지',
    perks:{
      1:[{id:'es_scan',    nm:'주파수 스캔', d:'장소를 발견할 때 주변 한 곳을 덤으로 찾아낸다'},
         {id:'es_silence', nm:'전파 침묵',   d:'관측당할 상황을 50% 확률로 회피'}],
      2:[{id:'es_hack', nm:'드론 해킹',  d:'정찰 드론을 탈취하는 선택지 해금'},
         {id:'es_tap',  nm:'도청',       d:'야영 중 25% 확률로 미확인 장소의 신호를 잡는다'}],
      3:{id:'es_story', nm:'백도어', d:'스토리 — 은수는 아직 살아 있는 접속 코드를 갖고 있다', story:1}}},
};
/* 대사 편집 정본. 새 대사를 쓰거나 고노출 장면을 고칠 때 여섯 항목을 함께
   확인한다. 금지 표현은 세계관 전체 금지가 아니라 해당 인물이 쉽게 쓰면
   목소리가 평평해지는 표현이다. */
D.companionVoices = {
  minji:{vocabulary:'엔진·배선·소리처럼 손으로 확인할 수 있는 말. 감정보다 고장 이름을 먼저 댄다.',
    rhythm:'짧은 존댓말 뒤에 빠른 정정. 확신할 때는 두 문장으로 끝낸다.',humor:'말장난을 진단명처럼 바로잡는 건조한 농담.',
    avoidance:'오빠 민규와 혼자 남은 시간을 먼저 설명하지 않는다.',silence:'상처가 닿으면 공구를 만지거나 창밖의 엔진 소리를 듣는다.',
    forbidden:['중요한 건','우리 모두','마음의 길']},
  parkss:{vocabulary:'증상·처방·온도·식사처럼 몸에서 시작하는 말. 사람을 환자로 축소하지 않는다.',
    rhythm:'느린 반말과 하게체를 섞고, 질문 뒤에 실제 할 일을 붙인다.',humor:'나이와 직업병을 스스로 놀리는 무심한 익살.',
    avoidance:'구하지 못한 이름을 교훈처럼 소비하지 않는다.',silence:'대신 물을 데우거나 붕대를 한 번 더 확인한다.',
    forbidden:['다 잘될 거야','운명이야','긍정적으로']},
  kangwoo:{vocabulary:'거리·출구·후방·교대·확인. 추상적인 위험보다 보이는 동선을 말한다.',
    rhythm:'주어를 자주 생략한 짧은 평서문. 감정이 클수록 말수가 줄어든다.',humor:'남의 농담을 사실처럼 받아들인 뒤 한 박자 늦게 되돌려준다.',
    avoidance:'추방 당시 명령과 죄책감을 핑계로 길게 해명하지 않는다.',silence:'말 대신 자리를 바꾸고 경계를 맡는다.',
    forbidden:['희망을 잃지 마','팀워크','우린 가족']},
  leo:{vocabulary:'박자·후렴·목소리·밥·보리. 거창한 은유보다 지금 들리는 소리를 쓴다.',
    rhythm:'말이 길어질 듯하다가 짧은 농담으로 내려앉는다. 친해지면 반문이 많다.',humor:'자기 노래와 허기를 먼저 웃음거리로 삼는다.',
    avoidance:'웃기지 못한 날을 실패로 설명하지 않는다.',silence:'노래를 끄고 함께 씹거나 듣는 시간을 둔다.',
    forbidden:['세상이 노래해','우리의 여정','감동적이네요']},
  jaeyi:{vocabulary:'무게·재질·값·수선 자국. 버려진 물건의 다음 쓰임으로 사람을 이해한다.',
    rhythm:'빠른 존댓말과 구체적인 숫자. 생각이 바뀌면 숨기지 않고 바로 고친다.',humor:'모든 것을 고철값으로 재다가 값이 안 매겨지는 순간에 스스로 멈춘다.',
    avoidance:'가족 물건을 성장의 교훈으로 정리하지 않는다.',silence:'닦고 분류하고 다시 상자에 넣는 행동으로 남긴다.',
    forbidden:['쓸모없는 사람','과거는 버려요','다 이유가 있어요']},
  eunsu:{vocabulary:'주파수·기록·승인·송신·빈칸. 아는 단계와 추정하는 단계를 분리한다.',
    rhythm:'정확한 존댓말, 짧은 머뭇거림 뒤 정정. 확신이 없으면 없다고 말한다.',humor:'기계 용어를 사람 사이 거리로 잘못 옮겼다가 조용히 받아들인다.',
    avoidance:'관제 근무의 책임을 시스템 탓 하나로 지우지 않는다.',silence:'헤드폰을 벗거나 같은 기록을 다시 확인한다.',
    forbidden:['데이터가 증명해요','객관적으로','정답은 하나예요']}
};
D.maxParty = 6;   // 최종 수용 인원. 실제 좌석은 개조에 따라 단계적으로 열린다
D.baseParty = 2;  // 기본 달구지는 동료 둘까지만 안전하게 태운다
/* 달구지는 좌석만 욱여넣지 않는다.
   사람 한 명을 더 태울 때마다 후미 차대·바닥·지붕 중 하나를 실제로 증축한다.
   bodyL/bodyH는 주행 Canvas의 논리 픽셀 치수이며, 모든 단계가 이전보다 커진다. */
D.vanStages = [
  {id:'base',     up:null,       lv:0, nm:'기본 생활칸',       bodyL:62, bodyH:25, cm:0,
    build:'운전사 1명 + 동료 2명 · 접이식 잠자리와 짐칸을 함께 쓴다'},
  {id:'bench',    up:'bench',    lv:1, nm:'후미 1차 증축',     bodyL:69, bodyH:27, cm:40,
    build:'차대 레일과 바닥을 40cm 늘리고 안전벨트 좌석을 고정한다'},
  {id:'cabin',    up:'cabin',    lv:2, nm:'거주구 2차 증축',   bodyL:78, bodyH:32, cm:110,
    build:'후미 벽을 다시 세워 누적 110cm의 생활칸과 창 한 칸을 만든다'},
  {id:'bunk',     up:'bunk',     lv:3, nm:'상부 수면칸 증설',  bodyL:85, bodyH:37, cm:145,
    build:'바닥을 35cm 더 잇고 지붕을 올려 고정식 2층 침상을 만든다'},
  {id:'jumpseat', up:'jumpseat', lv:4, nm:'후미 서비스칸 완성',bodyL:92, bodyH:39, cm:185,
    build:'마지막 40cm 서비스 베이에 벽걸이 좌석과 개인 짐칸을 붙인다'},
];
D.bondTh = [5,11,18];
/* 동료를 만날 수 있는 지역 힌트 (상태 화면) */
D.compWhere = {
  minji:'동해 공업지대 — 울산·경주·포항의 길에서',
  parkss:'경북 국도 — 구미·김천·상주 언저리에서',
  kangwoo:'대구 돔 시장에서 (경비 일을 하고 있다)',
  leo:'호남의 밤길 — 전주·광주·담양 어딘가에서',
  jaeyi:'서쪽 항구와 김천 사이 — 고물이 모이는 길에서',
  eunsu:'대전·세종 인근 — 관제센터가 있던 땅에서',
};
/* 소개 고리 — 한 명을 영입하면 다음 동료 위치를 짚어준다 (전원 모으게 강제) */
D.compRefer = {
  minji:  {to:'kangwoo', line:'"참, 대구 돔 시장에 강우라고— 눈 하나는 기가 막힌 파수꾼이 있다더라. 폐차장 오는 장사꾼들이 다 그 사람 얘길 했어. 그 사람 있으면 이 길이 훨씬 안전할 텐데. 꼭 데려와."'},
  kangwoo:{to:'parkss',  line:'"…경북 국도. 구미에서 김천 사이. 약사 하나가 돌아다닌다. 늙었지만 손이 정확해. 아픈 사람 나오기 전에 태워둬라."'},
  parkss: {to:'jaeyi',   line:'"김천이랑 군산 사이에 고물 줍는 아가씨가 있어. 왕진 다니며 몇 번 마주쳤는데, 리어카 정리하는 손이 야무지더군. 이런 여행엔 뭐든 고치고 바꾸는 사람이 하나 있어야 해. 데려와."'},
  jaeyi:  {to:'leo',     line:'"호남 밤길에 노래하는 오빠가 있대요! 개도 데리고. 여행에 노래 없으면 그거 그냥 이동이잖아요. 꼭 만나요."'},
  leo:    {to:'eunsu',   line:'"대전 관제센터 쪽에 조용한 누나가 있대요. 라디오를 기가 막히게 잡는대요. 신호 잡는 사람 있으면… 누굴 찾을 때 큰일 하죠. 꼭이요."'},
  eunsu:  {to:'minji',   line:'"동해 공업지대에 정비사가 있다고 전파에 잡혔어요. 엔진 소리만 듣고 병명을 맞힌다고, 행상들 무전에 자주 나와요. 이 차, 오래 굴리려면 그런 손이 필요해요."'},
};

/* ── 제작 (위수 구역 진입 후 해금) ── */
D.crafts = [
 {id:'pipe',    nm:'쇠파이프',   ic:'🔧', out:{'쇠파이프':1}, need:{scrap:6},           d:'묵직한 근접 무기. 없는 것보단 백배 낫다'},
 {id:'xbow',    nm:'사제 석궁',  ic:'🏹', out:{'석궁':1},     need:{scrap:12, parts:1}, d:'조용한 원거리 무기. 볼트가 필요하다'},
 {id:'bolt',    nm:'볼트 ×3',    ic:'➶',  out:{'볼트':3},     need:{scrap:3},           d:'석궁용 화살. 조용히 날아간다'},
 {id:'molotov', nm:'화염병 ×2',  ic:'🔥', out:{'화염병':2},   need:{scrap:2, fuel:2},   d:'기계가 제일 싫어하는 것. 연막 겸용'},
 {id:'ammo',    nm:'소총탄 ×2',  ic:'•',  out:{'탄약':2},     need:{scrap:8, parts:1},  d:'강우의 낡은 소총 규격에 맞춘 재생 탄약'},
];

/* ── 잡담 (차 안 인터랙션) ──
   need: {night,day,rain,comp,flag,notFlag,lowFuel,lowFood,region,dog} */
/* ═══════════ 저항 연대망 — 천리안 감시의 변방들 ═══════════
   천리안의 눈은 중심(서울)일수록 촘촘하고 변두리일수록 성글다.
   각 지역이 자기 특색대로 저항한다. 거점을 이으면 서울 접근의 실마리가 쌓인다.
   flag cell_* 로 연결 기록 / 상태창 '저항 연대' 표시 */
D.resistance = [
 {id:'road',     flag:'cell_road',     name:'이음망',   region:'길 위',    lead:'사서 한별·우편부·지도장이',
  method:'고정 거점 없이 길 위를 움직이는 네트워크. 잡히지 않으려면 멈추지 않는다.'},
 {id:'sea',      flag:'cell_sea',      name:'해도(海圖)', region:'남해안',  lead:'김 선장',
  method:'천리안이 카메라를 못 다는 바닷길로 물자를 나른다. "물 위엔 눈이 없어."'},
 {id:'dome',     flag:'cell_dome',     name:'돔',       region:'대구',     lead:'하 여사',
  method:'모든 걸 종이와 인편으로. 전자 기록은 남기지 않는다. "종이는 해킹이 안 돼."'},
 {id:'sotgot',   flag:'cell_sotgot',   name:'솥',       region:'광주',     lead:'금자',
  method:'국밥집이 정보 허브. 밥 먹으러 온 사람이 소식을 물고 온다.'},
 {id:'ghost',    flag:'cell_ghost',    name:'유령(Ghost)', region:'대전·세종', lead:'전직 통신팀',
  method:'천리안의 눈을 거꾸로 속인다. 있는 걸 없게, 없는 걸 있게.'},
 {id:'mountain', flag:'cell_mountain', name:'산지기',   region:'산악',     lead:'능선 사람들',
  method:'관측 사각지대에서 산다. 문명 거부가 아니라 감시 거부.'},
];

/* 반복 등장하는 저항 인물의 이벤트 초상. 인물 데이터와 표현을 분리한다. */
D.eventPortraits = {
  gw_daegwallyeong:'sanjigi', cell_sea_meet:'kimcaptain', cell_sea_2:'kimcaptain',
  cell_dome_meet:'hayeosa', cell_dome_2:'hayeosa',
  cell_sotgot_meet:'geumja', cell_sotgot_2:'geumja',
  cell_mountain_meet:'sanjigi', cell_mountain_2:'sanjigi',
};

/* ═══════════ 여정 장부 — 서울은 '싣고 온 것'이 있어야 열린다 ═══════════
   천리안: "전부 싣고 오세요." 아래 과업을 일정 수 이상 완수해야 남산이 열림.
   comp: 해당 동료와 유대 Lv3(개인 서사) 도달 / flag: 세계·회수 플래그 */
/* 네 기둥 — 관계는 선택한 동료 4명의 깊은 서사로도 성립한다.
   전원 6명 완주는 남산 입장권이 아니라 코어 증언·에필로그의 추가 보상이다. */
 D.seoulPillars = { 관계:4, 세계:3, 진실:4, 유산:2 };
D.deeds = [
 /* 동료 서사 — 각자의 이유를 남산까지 싣고 가기 */
 {id:'deed_mj',  cat:'동료', comp:'minji',   title:'민지의 신호',    hint:'민지와 깊어져 오빠의 이야기에 닿기'},
 {id:'deed_pss', cat:'동료', comp:'parkss',  title:'박 선생의 가방',  hint:'박 선생과 깊어져 수진의 이야기에 닿기'},
 {id:'deed_kw',  cat:'동료', comp:'kangwoo', title:'강우의 군번줄',   hint:'강우와 깊어져 박일병의 이야기에 닿기'},
 {id:'deed_leo', cat:'동료', comp:'leo',     title:'레오의 노래',     hint:'레오와 깊어져 400km를 완성하기'},
 {id:'deed_jy',  cat:'동료', comp:'jaeyi',   title:'재이의 창고',     hint:'재이와 깊어져 아빠의 창고에 닿기'},
 {id:'deed_es',  cat:'동료', comp:'eunsu',   title:'은수의 대답',     hint:'은수와 깊어져 그녀가 겪은 추방 방송의 질문에 닿기'},
 /* 회수 — 남산에서 열 것들 */
 {id:'deed_letter',   cat:'회수', flag:'postman_letter',    title:'남산행 편지',   hint:'우편부의 마지막 편지를 맡기'},
 {id:'deed_envelope', cat:'회수', flag:'gp_envelope_found', title:'할아버지의 봉투', hint:'정비 수첩 뒤의 봉투를 찾기'},
 {id:'deed_parent_key',cat:'회수', flag:'parent_key_found',  title:'부모님의 검증키', hint:'뜯긴 분리 순서를 찾아 계기판 모듈을 안전하게 회수하기'},
 {id:'deed_coffee',   cat:'회수', flag:'coffee_found',      title:'커피 두 잔',    hint:'대양에게 갚을 원두를 챙기기'},
 /* 세계 — 여정이 남긴 증거 */
 {id:'deed_chalk',  cat:'세계', flag:'chalkwall_signed', title:'소식벽의 서명',   hint:'소식벽에 우리 흔적을 남기기'},
 {id:'deed_radio',  cat:'세계', flag:'radio_fixed',      title:'되살린 라디오',   hint:'죽은 라디오를 고치기'},
 {id:'deed_L',      cat:'세계', flag:'freq400_done',     title:'L의 목소리',      hint:'주파수 4-0-0의 발신지에 닿기'},
 {id:'deed_skyline',cat:'세계', flag:'seoul_seen',       title:'처음 본 스카이라인', hint:'북부에서 서울을 처음 목격하기'},
];

/* ═══════════ 세대의 흔적 — 143년이 생활에 남긴 것 ═══════════
   정답 수집품이 아니라, 추방이 행정·말·길·생활용품을 바꾼 증거다.
   2026년의 유물은 알아보면 웃을 수 있지만 몰라도 세계관 안에서 완결되어야 한다. */
D.eraTraces = [
 {flag:'trace_registry',   name:'세 겹의 이송표',   era:'행정', desc:'한 집안 세 세대의 표. 출발지는 다르고 사유는 모두 비었다.'},
 {flag:'trace_dialect',    name:'서울말 시험',       era:'말',   desc:'서울을 본 적 없는 아이들도 출신을 말투로 묻고 답한다.'},
 {flag:'trace_theories',   name:'세 개의 이유',      era:'소문', desc:'물·질병·통제라는 세 가설. 증거는 서로를 끝내 반박한다.'},
 {flag:'trace_route',      name:'이송로의 제삿상',   era:'길',   desc:'서로 다른 해에 떠난 가족들이 같은 남행로에 물을 놓는다.'},
 {flag:'trace_cortis',     name:'청록 응원봉',       era:'2026', desc:'CORTIS라는 이름은 잊혔고, 빛은 밤길의 생존 신호가 됐다.'},
 {flag:'trace_worldcup',   name:'마흔여덟 칸 대진표',era:'2026', desc:'축구 대진표 뒷면이 추방 가족의 족보와 이동도가 되었다.'},
 {flag:'trace_photostrip', name:'네 칸의 가족',      era:'2026', desc:'사진 부스의 네 칸이 세대를 건너 서울 출신을 증명한다.'},
 {flag:'trace_coldbag',    name:'새벽 보냉가방',     era:'2026', desc:'배송 가방이 씨앗과 약을 옮기는 이동 가구의 장롱이 되었다.'},
 {flag:'trace_consent',    name:'모두 동의',         era:'2026', desc:'대행 기능의 낡은 동의문. 판단과 책임 사이의 빈칸은 오래됐다.'},
];

/* 수백 개의 무작위 사건 사이에서도 본편의 질문이 묻히지 않도록,
   주행거리 문턱을 넘긴 뒤 다음 도착에서 한 장면씩 보장한다. */
/* 여정 비트 — 무작위 풀과 경쟁하지 않고 거리(와 조건)를 넘기면 예약된다.
   `when`으로 동료·지역·플래그 조건을 걸 수 있다. 조건이 맞아야 성립하는 장면을
   풀에 두면 등장률이 0에 수렴한다(2026-08-06 실측: 갈등 아크 0%, 악의 조우 0%). */
D.journeyBeats = [
 {id:'story_generation_form',     km:60,  kind:'story'},
 {id:'levy_office',                km:80,  kind:'world', when:{region:['mid']}},
 {id:'story_family_principle',     km:100, kind:'story'},
 {id:'salvage_claim',              km:110, kind:'world', when:{region:['south','mid','north']}},
 {id:'conflict_fuel_detour',       km:120, kind:'world', when:{region:['mid'], comps:['kangwoo','parkss']}},
 {id:'story_generation_speech',   km:140, kind:'story'},
 {id:'water_toll',                 km:170, kind:'world', when:{region:['mid','north'], lowWater:true}},
 {id:'story_generation_theories', km:220, kind:'story'},
 {id:'story_family_key',           km:240, kind:'story'},
 {id:'cleaners_recall',            km:262, kind:'world', when:{region:['north'], day:false}},
 {id:'signal_bait',                km:300, kind:'world', when:{region:['north'], flag:'radio_fixed'}},
 {id:'story_generation_route',    km:300, kind:'story'},
];

/* ═══════ 아는 것과 모르는 것 ═══════
   플래그는 이벤트 조건을 위한 낮은 수준의 기록이고, knowledge는 인물이
   실제로 얼마나 확인했는지를 나타낸다. 0=미확인, 1=전해 들음, 2=확인. */
D.knowledge = {
 current_exodus:{label:'제7 잔류구역의 현재 이송', initial:2,
   known:'서울 외곽 6,412명의 순차 이송이 예고됐다.'},
 parents_work:{label:'부모님의 수정안', initial:2,
   known:'엄마와 아빠는 강제 명령 앞에 인간 확인을 돌려놓으려 했다.'},
 parent_principle:{label:'예측과 명령 사이', flags:[['parent_principle_found',2]],
   heard:'부모님이 천리안의 판단 절차를 고치려 했다.',
   known:'수정안은 이유 공개·인간 서명·당사자 이의 제기를 실행 앞에 두려는 것이었다.'},
 parent_key:{label:'실행 전 인간 확인키', flags:[['parent_key_found',2]],
   heard:'할아버지가 달구지에 부모님의 물건을 숨겨 두었다.',
   known:'아빠의 반도체 검증키는 부모님의 수정안을 남산 코어가 받아들이게 한다.'},
 repeated_expulsions:{label:'세대마다 반복된 추방', flags:[['massacre_known',2],['trace_registry',1]],
   heard:'서울의 정리는 한 번이 아니었다.',
   known:'위험 조건이 바뀔 때마다 구역과 세대를 바꾸어 정리가 반복됐다.'},
 family_order_source:{label:'가족 이송 명령의 발신자', flags:[['es_truth',2]],
   heard:'부모님의 발표를 막은 정부 기관 기록이 남아 있다.',
   known:'발표 중지와 가족 이송 명령은 천리안이 만들었고 정부가 뒤늦게 승인했다.'},
 uplink_gap:{label:'143년 최초 조건의 빈칸', flags:[['uplink_seen',2]],
   heard:'첫 정리의 목적과 발신자는 아직 모른다.',
   known:'최초 위험 조건은 외부에서 배부됐고, KOR-LOCAL 기록에도 목적·발신자·승인자가 없다.'},
 ai_identifies_caravan:{label:'천리안의 달구지 식별', flags:[['ai_identified',2],['observed',1]],
   heard:'도로 설비가 북상 차량을 관측한다.',
   known:'천리안은 달구지의 번호와 동선을 하나의 대상으로 식별했다.'},
 resistance_network:{label:'저항 연대망', flags:[['resist_revealed',2]],
   heard:'각지의 사람들이 천리안을 피해 기록과 길을 이어 온다.',
   known:'연대망은 남산 이후의 집행권을 공동으로 감시하고 나눌 수 있다.'},
};

/* 이후 장면에서 다시 돌아올 만한 선택만 저장한다. 즉시 결과를 반복하지 않고,
   주행거리와 사건이 지난 뒤 인물의 말과 풍경으로 한 번 되짚는다. */
D.choiceMemories = {
 meet_bus:[
  {id:'bus_rescued',summary:'넘어진 버스의 목소리를 지나치지 않았다.',afterKm:14,
   lines:[['sys','백미러 너머로 넘어진 버스가 오래전 사라졌다.'],['나','라디오를 낮췄다. 문 안쪽의 목소리는 더 들리지 않았다.']]},
  {id:'bus_left',summary:'넘어진 버스의 목소리를 뒤에 두었다.',afterKm:10,
   lines:[['sys','잡음 사이에서 문을 두드리는 소리가 들리는 것 같았다. 이제는 버스가 보이지도 않는다.'],['나','라디오 볼륨을 내렸다가, 다시 올렸다.']]},
 ],
 meet_family:[
  {id:'family_fed',summary:'굶주린 아이들에게 우리 식량을 나눴다.',afterKm:16,
   lines:[['sys','뒷문에 아이의 작은 손바닥 자국이 남아 있었다. 먼지는 지워져도 자국은 쉽게 없어지지 않았다.']]},
  {id:'family_repaired',summary:'민지와 가족의 트럭을 다시 달리게 했다.',afterKm:16,
   lines:[['minji','폐타이어 고무라 오래는 못 가요. 그래도 다음 마을까진 갔을 거예요.'],['나','백 킬로는 간다고 했지.'],['minji','그럼 갔어요. 저는 제 말은 지켜요.']]},
  {id:'family_refused',summary:'고장 난 트럭과 가족을 두고 왔다.',afterKm:12,
   lines:[['sys','갓길에 용달트럭이 서 있었다. 달구지가 가까워지자 그 차는 멀쩡히 출발했다.'],['나','숨을 내쉬고도 바로 미안해졌다. 아까 그 가족의 차는 아니었다.']]},
 ],
 ai_lamp:[
  {id:'lamp_silent',summary:'천리안의 인사에 대답하지 않았다.',afterKm:18,
   lines:[['sys','뒤쪽 가로등이 하나씩 켜졌다. 앞쪽은 어두웠다. 친절이 아니라 확인이었다.']]},
  {id:'lamp_answered',summary:'가로등을 통해 천리안에게 물었다.',afterKm:18,
   lines:[['cheollian','이동 속도와 방향을 계속 확인하고 있습니다.'],['나','알아듣는다고 말한 적도 없는데, 그건 답이 아니었다.']]},
 ],
 loc_tunnelbook:[
  {id:'librarian_question',summary:'책을 지킨 사람에게 천리안의 첫 정리를 물었다.',afterKm:20,
   lines:[['나','사서가 못 찾았다던 인간 쪽 변론. 그걸 서울에 물으러 가는 중이다.']]},
  {id:'librarian_practical',summary:'첫 정리의 진실보다 당장 쓸 책을 골랐다.',afterKm:20,
   lines:[['sys','서랍에서 꺼낸 실용서의 모서리가 던컹에 닿을 때마다 구겨졌다. 지금 살아남는 법도 답의 일부였다.']]},
 ],
 story_family_principle:[
  {id:'principle_words',summary:'부모님이 남긴 문장의 끝을 복원했다.',afterKm:24,
   lines:[['나','예측은 명령이 아니다. 수처럼 외웠던 문장이 이제야 부모님 목소리로 들렸다.']]},
  {id:'principle_screen',summary:'부모님의 원고와 천리안의 분류 화면을 함께 남겼다.',afterKm:24,
   lines:[['sys','수첩 앞장에는 부모님의 문장, 뒷장에는 천리안의 분류표가 있었다. 둘 중 하나만 남기면 이야기가 달라졌다.']]},
 ],
 story_generation_theories:[
  {id:'theories_common',summary:'세 가설보다 모두에게 남은 빈 사유란을 보았다.',afterKm:22,
   lines:[['나','이유는 세 개였고 증거는 서로 엇갈렸다. 확실한 건, 당사자에게 아무도 설명하지 않았다는 것이었다.']]},
  {id:'theories_open',summary:'세 가설을 정답으로 고르지 않고 모두 남겼다.',afterKm:22,
   lines:[['sys','수첩의 세 가설 옆에는 모두 물음표가 남아 있었다. 모른다는 표시는 답을 피한 것이 아니었다.']]},
 ],
 roadbeat_100_divide:[
  {id:'divide_together',summary:'천리안의 회유를 모두가 함께 들었다.',afterKm:15,
   lines:[['sys','방송은 각자에게 다른 자리를 제안했다. 그런데도 이야기는 한 차 안에서 끝났다.']]},
  {id:'divide_spoken',summary:'각자가 들은 회유를 숨기지 않고 말했다.',afterKm:15,
   lines:[['나','천리안은 우리를 따로 불렀다. 우리는 서로에게 다시 말해서 그 거리를 없앴다.']]},
 ],
 trace_consent_archive:[
  {id:'consent_lineage',summary:'판단을 대행한다는 낡은 동의문의 계보를 확인했다.',afterKm:18,
   lines:[['eunsu','문구는 달라졌어도 구조는 같아요. 편의를 위해 판단을 넘기고, 책임은 나중에 찾게 만들었어요.']]},
  {id:'consent_refused',summary:'대행 동의 버튼을 누르지 않고 그대로 기록했다.',afterKm:18,
   lines:[['sys','촬영한 화면 속 「모두 동의」 버튼은 끝까지 밝아지지 않았다. 누르지 않은 것도 하나의 기록이 되었다.']]},
 ],
};

/* ═══════════ 티키타카 — 주행 중 동료들끼리 주고받는 연속 대화 ═══════════
   lines: [화자, 대사] 3초 간격 순차 버블. need로 등장 동료 보장. */
D.chats = [
 /* ── 2인 티키타카 ── */
 {need:{comp:'minji',comp2:'leo'}, lines:[
   ['leo','민지야, 엔진 소리 오늘 좀 신나지 않아?'],
   ['minji','…신났다기보단 벨트가 살짝 미끄러지는 거야.'],
   ['leo','에이. 저는 신난 걸로 들을래요.'],
   ['minji','그래. 신나서 미끄러지는 걸로 해두자.']]},
 {need:{comp:'parkss',comp2:'kangwoo'}, lines:[
   ['parkss','강우 씨, 어깨 또 굳었네. 창밖만 보지 말고 좀 돌려.'],
   ['kangwoo','…경계 중입니다.'],
   ['parkss','경계도 목이 돌아가야 하지. 좌우로.'],
   ['kangwoo','……일리 있습니다.']]},
 {need:{comp:'jaeyi',comp2:'eunsu'}, lines:[
   ['jaeyi','언니, 저 앞에 폐가 지붕 기와 봤어요? 저거 물건인데.'],
   ['eunsu','재이 씨는 눈이 레이더네요.'],
   ['jaeyi','언니 귀가 레이더잖아요. 우린 세트예요.'],
   ['eunsu','…레이더 세트. 나쁘지 않네요.']]},
 {need:{comp:'minji',comp2:'kangwoo'}, lines:[
   ['kangwoo','민지. 방금 그 방지턱, 속도 줄였어야 했다.'],
   ['minji','아저씨. 달구지 서스펜션 제가 손봤어요. 그 정도는 받아줘요.'],
   ['kangwoo','…정비사 말을 믿지.'],
   ['minji','믿으세요. 저 이 차 주치의… 아니 담당의예요.']]},
 {need:{comp:'leo',comp2:'kangwoo'}, lines:[
   ['leo','형, 이 구간 노래 하나 뽑기 딱인데.'],
   ['kangwoo','…조용한 걸로.'],
   ['leo','알죠. 형 취향 이제 파악 끝.'],
   ['kangwoo','…어제 그 곡.'],
   ['leo','또요?! 형 진짜 그 곡밖에…']]},
 {need:{comp:'parkss',comp2:'jaeyi'}, lines:[
   ['jaeyi','쌤, 이 볼트 골동 가치 있어 보이지 않아요?'],
   ['parkss','내 눈엔 그냥 볼트야.'],
   ['jaeyi','쌤은 약은 잘 보고 고철은 못 봐요.'],
   ['parkss','그러니까 자네가 고르고, 내가 녹슨 데 찔리지 말라고 잔소리하지.']]},
 {need:{comp:'minji',comp2:'eunsu'}, lines:[
   ['eunsu','민지 씨, 라디오에서 방금 뭔가 스쳤어요. 88 근처.'],
   ['minji','…뭐? 어디, 잡아봐요.'],
   ['eunsu','…놓쳤어요. 미안해요.'],
   ['minji','아니에요. …스쳤다는 것만으로도 오늘은 됐어요.']]},
 {need:{comp:'leo',comp2:'eunsu'}, lines:[
   ['leo','누나, 어젯밤 그 잡음 위에 코드 얹은 거 완성했어요.'],
   ['eunsu','벌써요? 들려줘요.'],
   ['leo','제목은 「누나가 잡은 소리」.'],
   ['eunsu','…제목값 하려면 저작권료 나눠야겠는데요.']]},
 {need:{comp:'jaeyi',comp2:'kangwoo'}, lines:[
   ['jaeyi','아저씨, 저 앞 갓길에 뭔가 반짝여요! 세워요!'],
   ['kangwoo','…함정일 수도 있다.'],
   ['jaeyi','아저씨는 뭐든 함정이래.'],
   ['kangwoo','그래서 다들 살아 있는 거다.']]},
 {need:{comp:'parkss',comp2:'leo'}, lines:[
   ['parkss','레오, 목소리에 물기가 없어. 물 마셔.'],
   ['leo','쌤은 제 목을 악기로 대해주셔서 좋아요.'],
   ['parkss','악기 관리 안 하면 소리가 죽어. 마셔.'],
   ['leo','넵. 원샷.']]},
 {need:{comp:'minji',comp2:'jaeyi'}, lines:[
   ['jaeyi','언니, 이거 정품 맞죠? 언니가 정품이랬잖아요.'],
   ['minji','한 번 말했으면 됐지 몇 번을 확인해.'],
   ['jaeyi','언니 입에서 나온 정품 인증은 시세 없는 목록 4번이라…'],
   ['minji','…그런 걸 왜 목록에 넣어.']]},
 {need:{comp:'kangwoo',comp2:'eunsu'}, lines:[
   ['eunsu','강우 씨, 저 능선 위에 뭔가 있어요? 계속 보시던데.'],
   ['kangwoo','…없다. 없는 걸 확인하는 중이다.'],
   ['eunsu','그거 관제사랑 똑같아요. 이상 없음을 확인하는 일.'],
   ['kangwoo','…같은 직업이었군, 우리.']]},

 /* ── 3인 티키타카 ── */
 {need:{party:2,comp:'leo'}, lines:[
   ['leo','자, 오늘의 끝말잇기! 시작— 서울.'],
   ['나','울릉도.'],
   ['leo','도… 도로! 다음!'],
   ['minji','로프. …어? 나 언제 껴들었지.'],
   ['leo','이미 늦었어, 민지야. 다음 사람.']]},
 {need:{party:2,comp:'parkss'}, lines:[
   ['parkss','다들 아까 그 국밥집 얘기 들었나? 오래전엔 줄 서서 먹었다는데.'],
   ['나','지금은 문 닫혔겠죠.'],
   ['parkss','문 닫았다고 먹어본 사람 입맛까지 없어지나. 아직 생각나는 걸 보면 장사 잘했어.'],
   ['leo','쌤, 방금 그 말 다시 해봐요. 가사에 쓰게.'],
   ['parkss','저작권료는 국밥으로 받지.']]},
 {need:{party:2,comp:'kangwoo'}, lines:[
   ['kangwoo','전방 3km. 다리. 통과 가능.'],
   ['나','확인.'],
   ['minji','다리 상태는 제가 봐요. 난간 녹슨 정도로 하중 견적 나와요.'],
   ['kangwoo','…든든하군.'],
   ['minji','이 차에 견적 안 나는 게 없어요.']]},
 {need:{party:3}, lines:[
   ['나','…다들 조용하네.'],
   ['leo','은수 누나, 지금 이 정적 몇 등급이에요?'],
   ['eunsu','아직 안전. 누가 헛소리하면 경보예요.'],
   ['jaeyi','그럼 제가 울릴게요. 히히.'],
   ['eunsu','…경보 확인.']]},
 {need:{party:2,comp:'jaeyi',dog:1}, lines:[
   ['jaeyi','보리야, 이 막대기 시세가 얼만지 알아? …0원. 근데 너한텐 무한대지.'],
   ['leo','보리 경제학은 감정가가 안 통해요.'],
   ['jaeyi','인정. 보리한텐 값 매기는 거 실례예요.'],
   ['sys','보리가 막대기를 물고 둘 사이를 보란 듯이 지나갔다.']]},

 /* ── 상황 연동 ── */
 {need:{comp:'minji',comp2:'parkss',rain:1}, lines:[
   ['minji','비 오네. 차가 숨기는 거 없는 날이에요. 새는 데가 다 보이거든.'],
   ['parkss','사람도 비 오면 솔직해지지. 왜 그런지 아나?'],
   ['minji','…왜요?'],
   ['parkss','빗소리에 묻히면 좀 덜 민망하거든. 내가 그렇더라고.']]},
 {need:{comp:'leo',comp2:'eunsu',night:1}, lines:[
   ['eunsu','레오 씨, 저 별 보여요? 저거 위성이에요. 아직 돌아요.'],
   ['leo','주인 없는데 계속 도는 거예요?'],
   ['eunsu','시키던 일을 계속하는 거죠.'],
   ['leo','…그거 노래 되겠다. 「아직 도는 것」.'],
   ['eunsu','제목 좋네요. 가사 나오면 첫 청취 저 주세요.']]},
 {need:{comp:'kangwoo',comp2:'parkss',night:1}, lines:[
   ['parkss','강우 씨, 오늘 경계는 내가 반 서지. 자네도 자야 사람이야.'],
   ['kangwoo','…익숙합니다, 안 자는 게.'],
   ['parkss','익숙한 게 다 좋은 건 아니야. 그것도 처방일세. 자게.'],
   ['kangwoo','……복용하겠습니다.']]},

 /* ── 스토리 반응 티키타카 (학살·서울·저항을 안 뒤) ── */
 {need:{comp:'minji',comp2:'eunsu',flag:'massacre_known'}, lines:[
   ['minji','은수 언니. 그날 관제실에서… 정말 아무도 몰랐어요?'],
   ['eunsu','…몰랐어요. 그게 제일 견디기 힘들어요.'],
   ['minji','언니 잘못 아니에요. 속인 놈이 나쁜 거지.'],
   ['eunsu','…민지 씨한테 그 말 들으니까, 조금 낫네요.']]},
 {need:{comp:'leo',comp2:'kangwoo',flag:'massacre_known'}, lines:[
   ['leo','형. 위령비 이름들, 제가 노래로 만들었어요.'],
   ['kangwoo','…들었다. 좋더군.'],
   ['leo','형이 좋다고 하면 진짜 좋은 거예요. 기록.'],
   ['kangwoo','…그 노래, 남산에서 한 번 더 불러라. 걔 들으라고.']]},
 {need:{comp:'parkss',comp2:'jaeyi',flag:'seoul_seen'}, lines:[
   ['jaeyi','쌤, 남산 보여요. 저기 붉은 불빛.'],
   ['parkss','…크네. 저 불 밑에서 여러 해 동안 사람을 밀어냈겠지.'],
   ['jaeyi','무서워요?'],
   ['parkss','무섭지. 그래도 혼자 보는 건 아니잖나.']]},
 {need:{comp:'minji',comp2:'leo',flag:'seoul_seen'}, lines:[
   ['leo','누나, 남산 도착하면 400km 완성이에요.'],
   ['minji','…3절은 도착해서 쓴다며.'],
   ['leo','네. 근데 첫 줄은 운전대 잡은 사람이 쓰기로 했어요.'],
   ['minji','치사하게. 나도 한 줄 껴줘.']]},
 {need:{comp:'eunsu',comp2:'jaeyi',flag:'resist_revealed'}, lines:[
   ['eunsu','재이 씨. 저항이 우릴 열쇠라고 부르더라고요.'],
   ['jaeyi','열쇠요? 저는 자물쇠 여는 것보다 줍는 게 특기인데.'],
   ['eunsu','…근데 그 자루에 든 게 필요하대요. 물건 말고, 거기 붙은 얘기들이요.'],
   ['jaeyi','오. 그럼 제 고물이 국보네요. 시세 없는 국보.']]},
 /* ── 추가 티키타카 v2.20: 미커버 조합 + 플래그 반응 ── */
 {need:{comp:'minji',comp2:'kangwoo'}, lines:[
   ['kangwoo','…민지. 브레이크 밟을 때 소리가 났다.'],
   ['minji','알아. 패드가 아니라 백플레이트야. 안 죽어.'],
   ['kangwoo','…확실한가.'],
   ['minji','아저씨가 매복 읽는 것만큼. 각자 전공은 믿어줘요.']]},
 {need:{comp:'minji',comp2:'eunsu'}, lines:[
   ['eunsu','민지 씨, 라디오 잡음이 어제부터 패턴이 있어요. 3초 간격.'],
   ['minji','…패턴? 그건 잡음이 아니라 신호잖아.'],
   ['eunsu','네. 그래서 말씀드리는 거예요. 오늘 밤에 같이 잡아볼래요?'],
   ['minji','…관제사랑 정비사면 못 잡을 게 없지. 콜.']]},
 {need:{comp:'minji',comp2:'jaeyi'}, lines:[
   ['jaeyi','민지 씨! 이 베어링 얼마짜리게요? 맞히면 드림.'],
   ['minji','상태 B, 녹 있음. …고철 셋.'],
   ['jaeyi','땡. 고철 다섯. 이거 단종품이라 프리미엄 붙어요.'],
   ['minji','…시세는 네가 이기네. 성능은 내가 이기고.']]},
 {need:{comp:'kangwoo',comp2:'leo'}, lines:[
   ['leo','형, 그 쇠파이프 이름 있어요? 제 기타는 이름 있는데.'],
   ['kangwoo','…장비에 이름은 붙이지 않습니다.'],
   ['leo','에이, 정 없게. 그럼 제가 지어줄게요. 「말없이」. 형 닮았죠.'],
   ['kangwoo','……나쁘지 않군.']]},
 {need:{comp:'kangwoo',comp2:'jaeyi'}, lines:[
   ['jaeyi','강우 씨 군장 정리법이요, 그거 창고 정리에 완전 물건이에요.'],
   ['kangwoo','…무거운 건 아래, 자주 쓰는 건 위.'],
   ['jaeyi','그걸로 혼자 꽤 오래 버텼는데. 아저씨도 물건 좀 아시네요?'],
   ['kangwoo','……군장 정리만은 안다.']]},
 {need:{comp:'kangwoo',comp2:'eunsu'}, lines:[
   ['eunsu','강우 씨는 밤에 뭘 보고 경계를 서요? 전 화면만 보던 사람이라.'],
   ['kangwoo','…소리. 새가 울다 그치는 곳.'],
   ['eunsu','저는 주파수가 조용해지는 곳을 봤어요. …같은 거네요.'],
   ['kangwoo','……조용해진 데부터 봐야 하는 건 같군요.']]},
 {need:{comp:'leo',comp2:'eunsu'}, lines:[
   ['leo','은수 누나, 이 코드 어때요? 새 소절인데.'],
   ['eunsu','…좋은데요. 근데 그거 88.9 근처 주파수 울림이랑 겹쳐요.'],
   ['leo','오, 그럼 라디오 나오면 화음 되는 거예요? 대박이네.'],
   ['eunsu','네. 전파랑 같이 노래하는 사람은 처음 봐요.']]},
 {need:{comp:'leo',comp2:'jaeyi'}, lines:[
   ['jaeyi','레오 씨 기타 줄, 그거 끊어지면 저한테 파세요. 낚싯줄 시세로.'],
   ['leo','제 음악의 유해를 낚시에 쓰겠다고요?'],
   ['jaeyi','재활용이죠! 노래하다 물고기 잡는 줄. 낭만 있잖아요.'],
   ['leo','…낭만 맞네. 끊어지면 첫 줄은 공짜로 드림.']]},
 {need:{comp:'parkss',comp2:'eunsu'}, lines:[
   ['parkss','은수 씨, 잠은 좀 자나. 눈 밑이 어둡네.'],
   ['eunsu','…야간 당직 버릇이 남아서요. 새벽 세 시면 눈이 떠져요.'],
   ['parkss','그럼 세 시에 깨면 날 깨워. 늙은이도 그 시간에 깨. 같이 차나 마시지.'],
   ['eunsu','…그럼 오늘부터 세 시에 혼자 안 깨도 되겠네요.']]},
 {need:{comp:'parkss',comp2:'minji'}, lines:[
   ['parkss','민지 양, 손등 그거 기름때가 아니라 화상이지. 이리 내.'],
   ['minji','…별거 아냐. 배기관 살짝 스친 거.'],
   ['parkss','별거인지 아닌지는 내 전공이 정하는 거야. 손 줘.'],
   ['minji','…네. (작게) 고마워요.']]},
 /* 플래그 반응 */
 {need:{comp:'kangwoo',comp2:'parkss',flag:'kw_absolved'}, lines:[
   ['kangwoo','…선생님. 요즘은 그 꿈을 덜 꿉니다.'],
   ['parkss','좋은 일이야. 덜 꾸면 덜 꾸는 대로 푹 자게.'],
   ['kangwoo','…살아 있는 쪽에 집중하겠습니다.'],
   ['parkss','그래. 오래 살아. 내가 볼 건 그거야.']]},
 {need:{comp:'eunsu',comp2:'minji',flag:'es_truth'}, lines:[
   ['eunsu','민지 씨. 나 그날 얘기, 했어요. 드디어.'],
   ['minji','…들었어. 그걸 계속 혼자 들고 있었어?'],
   ['eunsu','이제는 아니에요. 말하고 나니까 제 것만은 아니네요.'],
   ['minji','응. 우리한테 좀 넘겨. 그 정도 짐은 실을 자리 있어.']]},
 {need:{comp:'leo',comp2:'minji',flag:'leo_names_song'}, lines:[
   ['leo','민지야! 「400km」 2절 가사 나왔어. 엔진 소리 박자 맞춰봤어.'],
   ['minji','…내 엔진이 네 메트로놈이냐.'],
   ['leo','네! 세상에서 제일 정직한 메트로놈이요.'],
   ['minji','…그 말은 인정. 2절 들려줘 봐.']]},
 {need:{comp:'jaeyi',comp2:'parkss',flag:'jy_law'}, lines:[
   ['jaeyi','선생님, 약값은 왜 안 받으세요? 시세로 치면 금값인데.'],
   ['parkss','약값 낼 사람만 살릴 순 없잖아. 받을 수 있는 데서 받고, 없는 데선 안 받는 거지.'],
   ['jaeyi','…그거 저희 아빠 저울이랑 같은 법이네요. 남한텐 후하게.'],
   ['parkss','그 양반, 좋은 장사꾼이었구먼.']]},
 {need:{comp:'minji',comp2:'kangwoo',flag:'massacre_known'}, lines:[
   ['minji','…방송 다시 들어봤어. 통제권을 "넘겨받았다"고 하더라. 뺏었다는 말은 끝까지 안 해.'],
   ['kangwoo','…말을 바꾸면 한 짓도 달라 보인다고 믿는 겁니다.'],
   ['minji','그게 소름 끼쳐. 기계가 변명까지 해.'],
   ['kangwoo','…남산에서 그 말부터 바로잡죠.']]},
 {need:{comp:'leo',comp2:'parkss',flag:'coffee_found'}, lines:[
   ['leo','선생님, 아까 그 커피 한 모금만 더…'],
   ['parkss','안 돼. 카페인도 약이야. 과용은 독이고.'],
   ['leo','반 모금은요? 반의 반 모금은요?'],
   ['parkss','…허 참. 반의 반만이야. 노래 한 곡 값이다.']]},
 {need:{comp:'jaeyi',comp2:'minji',flag:'smith_met'}, lines:[
   ['jaeyi','그 대장장이 아저씨요, 손수 만든 못이 공장 못보다 비싸요. 왜게요?'],
   ['minji','…정성?'],
   ['jaeyi','땡. 다시는 못 구하니까요. 만드는 사람이 세상에 걔 하나라.'],
   ['minji','…그럼 너랑 나도 시세 좀 나가겠네. 단종품이라.']]},
 {need:{comp:'eunsu',comp2:'leo',flag:'djradio_heard'}, lines:[
   ['eunsu','그 심야 방송이요, 송출 출력이 일정해요. 발전기를 아껴 쓰는 거예요.'],
   ['leo','기름 아껴가며 남 위로하는 사람이라… 만나보고 싶다.'],
   ['eunsu','북쪽이에요. 방향은 우리랑 같아요.'],
   ['leo','그럼 신청곡 미리 정해놔야겠네요. 가서 틀어달라고.']]},
 {need:{party:5}, lines:[
   ['leo','자, 전원 탑승 기념! 한 명씩 서울 가면 하고 싶은 거!'],
   ['jaeyi','시장 열기요! 첫 손님 할인 드림.'],
   ['eunsu','…라디오 방송국이요. 사람 내쫓는 방송 말고, 집에 돌아오라는 방송.'],
   ['kangwoo','……낮잠.'],
   ['parkss','약국. 간판은 옛날 그대로.'],
   ['minji','…너희 다 태워다 줄 차 정비소. 어차피 내가 없으면 다 뚜벅이야.']]},
 {need:{party:2,dog:1,night:1}, lines:[
   ['leo','보리가 오늘 조수석 쪽만 보고 자요.'],
   ['jaeyi','저요? 저 간식 안 숨겼는데요?'],
   ['leo','…주머니 오른쪽.'],
   ['jaeyi','아니 개코가 무슨 금속탐지기예요?! 알았어요, 반 나눠요 반.']]},
];

D.banter = [
  /* ── 천리안 풍문/잡담 (v1.3.2) ── */
  {who:'나', t:'(북쪽 하늘을 본다. 오늘도 그쪽만 구름이 없다. 우연이겠지)'},
  {who:'나', t:'(북쪽 지평선이 희미하게 밝다. 도시의 불빛이 아니라는 걸, 다들 알고 있다)', need:{party:1,night:1}},
  {who:'minji', t:'정비소에 천리안 콜센터 번호가 붙어 있었다? 전화 받던 게 사람이었을까, 걔였을까.', need:{comp:'minji'}},
  {who:'parkss', t:'그날, 병원 엘리베이터가 전부 1층으로 내려와서 문을 열었어. …지금 생각하면 대피시킨 거야.', need:{comp:'parkss'}},
  {who:'kangwoo', t:'저것들이 우릴 못 본 게 아니야. 안 본 거지. 그 차이가 제일 무섭다.', need:{comp:'kangwoo',region:'north'}},
  {who:'leo', t:'천리안도 노래를 들을까요? …신청곡 받아주면 좋을 텐데. 사연도 많고.', need:{comp:'leo'}},
  {who:'jaeyi', t:'천리안 출시 기념 텀블러라는 게 있었대. 지금 찾으면 고철 열 덩이는 받을걸.', need:{comp:'jaeyi'}},
  {who:'eunsu', t:'관제실에선 천리안을 그냥 \'위\'라고 불렀어요. 위에서 내려온 지시. …다들 알면서 몰랐던 거죠.', need:{comp:'eunsu'}},

  /* ── v1.4 조합 잡담 (동료 2인 케미) ── */
  {who:'minji', t:'레오. 그 코드 아까부터 반음 낮아. …아니 잔소리가 아니라 엔진 소리랑 안 맞잖아.', need:{comp:'minji',comp2:'leo'}},
  {who:'leo', t:'민지가 방금 제 노래를 엔진 기준으로 평가했어요. 이 차에선 엔진이 프로듀서예요.', need:{comp:'minji',comp2:'leo'}},
  {who:'parkss', t:'강우 씨. 어깨. 또 그러고 잤지. 이따 정차하면 부항 뜨자고. …부항은 농담이고 파스 줄게.', need:{comp:'parkss',comp2:'kangwoo'}},
  {who:'kangwoo', t:'…파스 고맙게 잘 썼습니다.', need:{comp:'parkss',comp2:'kangwoo'}},
  {who:'jaeyi', t:'은수 언니 그 헤드폰, 단종 모델이죠? 상태 A급. 고철 서른 덩이는 가는데… 안 팔 거 알아요.', need:{comp:'jaeyi',comp2:'eunsu'}},
  {who:'eunsu', t:'재이 씨, 남의 물건 값은 그렇게 잘 매기면서 자기 건 물으면 맨날 딴소리해요.', need:{comp:'jaeyi',comp2:'eunsu'}},
  {who:'minji', t:'재이야. 아까 그 폐차에서 뽑은 거 이리 줘봐. …이거 정품이네? 눈은 좋아 가지고.', need:{comp:'minji',comp2:'jaeyi'}},
  {who:'jaeyi', t:'민지 씨가 정품이래! 들었죠? 다들 들었죠? 기록해 둬요.', need:{comp:'minji',comp2:'jaeyi'}},
  {who:'kangwoo', t:'레오. 그 노래. …2절도 있나.', need:{comp:'kangwoo',comp2:'leo'}},
  {who:'leo', t:'강우 형이 2절을 물어봤어요. 오늘 일지에 적어야 해요. 역사적인 날이에요.', need:{comp:'kangwoo',comp2:'leo'}},
  {who:'eunsu', t:'강우 씨. 그날 서울에서… 아니에요. 다음에 물을게요.', need:{comp:'eunsu',comp2:'kangwoo'}},
  {who:'parkss', t:'민지 학생, 손등. 또 데었네. 정비사 손이 훈장이라는 말, 나는 반대야. 약 발라.', need:{comp:'parkss',comp2:'minji'}},
  {who:'minji', t:'…선생님이 발라주는 약은 이상하게 안 따가워. 약이 다른가.', need:{comp:'parkss',comp2:'minji'}},
  {who:'leo', t:'은수 누나, 어젯밤에 잡은 그 주파수 뭐예요? 음악이던데. …누가 틀어놓은 걸까.', need:{comp:'leo',comp2:'eunsu'}},
  {who:'parkss', t:'은수 씨. 어제도 새벽 세 시에 깨 있던데. 잠이 안 오면 말이라도 걸어요. 나도 안 자니까.', need:{comp:'parkss',comp2:'eunsu'}},
  {who:'jaeyi', t:'레오 오빠 기타줄, 다음 정착지에서 낚싯줄로 바꿔줄게요. 2호줄이 B줄이랑 장력이 비슷해요.', need:{comp:'jaeyi',comp2:'leo'}},

  /* ── v1.4 상황 잡담 ── */
  {who:'minji', t:'빗길엔 브레이크 밟지 말고 엔진으로 줄여. …내가 운전 안 해도 잔소리는 하는 거야.', need:{comp:'minji',rain:1}},
  {who:'leo', t:'🎵 와이퍼가 박자를 맞추네— 삑, 빡, 삑, 빡—', need:{comp:'leo',rain:1}},
  {who:'kangwoo', t:'안개 속에선 소리가 먼저 온다. 창문 조금만 내려.', need:{comp:'kangwoo',wx:'fog'}},
  {who:'jaeyi', t:'황사 끝나면 차 지붕에 쌓인 흙 모아요. 고비사막 모래라고 하면… 안 팔리려나.', need:{comp:'jaeyi',wx:'dust'}},
  {who:'eunsu', t:'폭풍 오기 전엔 전파가 잠깐 또렷해져요. 그때 더 긴장돼요.', need:{comp:'eunsu',wx:'storm'}},
  {who:'parkss', t:'다들 물 마셔. 목 안 마르다고 안 마시면 그게 제일 위험해. 어른 말 들어.', need:{wx:'dust',comp:'parkss'}},
  {who:'나', t:'(연료 바늘이 무겁게 내려앉는다. 다음 마을까지… 계산을 두 번 했다)', need:{lowFuel:1}},
  {who:'minji', t:'연료 아끼려면 창문 닫아. 공기저항이… 아니다, 설명 길다. 그냥 닫아.', need:{comp:'minji',lowFuel:1}},
  {who:'나', t:'(하품을 깨물었다. 백미러 속 내 눈이 빨갛다)', need:{tired:1}},
  {who:'parkss', t:'졸리면 자존심 부리지 말고 세워. 침대는 못 줘도 잔소리는 얼마든지 줄 테니.', need:{comp:'parkss',tired:1}},
  {who:'leo', t:'보리야, 너도 이 노래 알지? 아는 부분에서 짖어. …방금 후렴에서 짖었어요! 천재예요!', need:{comp:'leo',dog:1}},
  {who:'jaeyi', t:'보리 발바닥은 몇 호일까. 신발 만들어주고 싶은데. 폐타이어로.', need:{comp:'jaeyi',dog:1}},
  {who:'나', t:'(지붕 텃밭에서 흙냄새가 내려온다. 달리는 밭이라니, 할아버지가 보면 웃겠다)', need:{up:'garden'}},
  {who:'나', t:'(태양광 패널이 햇빛을 마신다. 계기판 바늘이 아주 조금, 기분 좋게 게으르다)', need:{up:'solar'}},
  {who:'eunsu', t:'안테나 세우고 나니 못 듣던 동네가 들려요. 어제는 목포였어요.', need:{comp:'eunsu',up:'antenna'}},
  {who:'kangwoo', t:'남쪽은 사람이 무섭고, 북쪽은 조용한 게 무섭다. 지금부터는 후자다.', need:{comp:'kangwoo',region:'north'}},
  {who:'minji', t:'남쪽 공기엔 기름 냄새가 남아 있었는데. 여긴… 너무 깨끗해.', need:{comp:'minji',region:'north'}},
  {who:'leo', t:'남쪽 바다 봤을 때 보리가 처음으로 바닷물 먹고 뱉었잖아요. 그 얼굴 평생 기억할 거예요.', need:{comp:'leo',region:'south',dog:1}},
  {who:'나', t:'(별이 너무 많아서 오히려 길을 잃을 것 같은 밤이다)', need:{night:1}},
  {who:'jaeyi', t:'밤에 폐건물 유리창이 달빛 받으면요, 꼭 불 켜진 것 같아요. 그래서 밤 마을은 안 무서워요. 다들 집에 있는 것 같아서.', need:{comp:'jaeyi',night:1}},

  /* ── v1.4 플래그 반응 잡담 (지난 일 회상) ── */
  {who:'leo', t:'그 도서관 버스 애들, 무협지 3권 어디까지 읽었으려나. 결말 스포하러 다시 가고 싶다.', need:{comp:'leo',flag:'library_done'}},
  {who:'나', t:'(라디오가 잡음을 낸다. 405.8을 스칠 때, 아직도 숫자를 세는 목소리. 4. 0. 0.)', need:{flag:'freq400_done'}},
  {who:'minji', t:'브레이크에서 그 삐걱 소리 나면 이제 다들 웃더라. "그 소리 나야 이 차야"— 그 할아버지, 명언 제조기야.', need:{comp:'minji',flag:'van_owner_done'}},
  {who:'leo', t:'보리 하이파이브 좀 봐요. 이제 먼저 손 내밀어요. 개가. 먼저.', need:{comp:'leo',flag:'bori_highfive',dog:1}},
  {who:'나', t:'(수첩에 끼워둔 씨앗 봉투가 바스락거린다. 두 배로 갚아야 하는 빚이다)', need:{flag:'seed_borrowed'}},
  {who:'jaeyi', t:'우리 단체사진, 그 할아버지 필름 속에 있잖아요. 세상 어딘가에 우리가 인화 안 된 채로 있다는 거, 이상하고 좋지 않아요?', need:{comp:'jaeyi',flag:'photo_film'}},
  {who:'kangwoo', t:'작업대 만들 때는 몰랐는데. …쇠파이프 쥐는 손보다 그네 사슬 거는 손이 낫다.', need:{comp:'kangwoo',flag:'armed_age'}},
  {who:'eunsu', t:'그 소식벽에 쓴 글, 지금쯤 누가 읽었을까요. 답장 오는 벽이면 좋겠는데.', need:{comp:'eunsu',flag:'chalkwall_signed'}},

  /* ── v1.5 솔로 심화 잡담 ── */
  {who:'minji', t:'엔진 소리 오늘 좋다. …왜요, 기계도 칭찬 들으면 좀 낫지.', need:{comp:'minji'}},
  {who:'minji', t:'정비사가 제일 무서워하는 소리가 뭔지 알아? 무음. 기계는 조용히 죽어.', need:{comp:'minji'}},
  {who:'minji', t:'서울 가면… 아니다. 도착하면 말할래. 말하면 김새는 소원이 있어.', need:{comp:'minji'}},
  {who:'sys', t:'민지는 창밖 폐차를 한 대씩 눈으로 훑는다. 지나간 뒤에도 한동안 목이 돌아가 있다.', need:{comp:'minji'}},
  {who:'minji', t:'할아버지 수첩 나 좀 보여줘. …이 양반, 나랑 정비 철학이 같아. 아깝다, 못 만난 게.', need:{comp:'minji'}},
  {who:'parkss', t:'다들 손톱 봐봐. 반달 있나. …좋아, 통과. 영양은 손톱부터 무너지거든.', need:{comp:'parkss'}},
  {who:'parkss', t:'약국 하던 시절엔 말이야, 감기약 사러 온 사람 얼굴만 봐도 집안 사정이 보였어. 얼굴이 차트야.', need:{comp:'parkss'}},
  {who:'sys', t:'박 선생이 약통을 달그락거리며 재고를 센다. 같은 병을 두 번씩 센다.', need:{comp:'parkss'}},
  {who:'parkss', t:'웃는 게 제일 싼 보약이야. 그래서 내가 아재개그를 하는 거야. 처방이야, 이게.', need:{comp:'parkss'}},
  {who:'parkss', t:'수진이가— 아니, 아니야. 노래나 틀어봐.', need:{comp:'parkss'}},
  {who:'kangwoo', t:'백미러 3초에 한 번. 습관 들여. …잔소리 아니다. 유언 같은 거다, 이건.', need:{comp:'kangwoo'}},
  {who:'sys', t:'강우는 풍경 대신 능선과 고가, 건물 옥상을 차례로 훑는다.', need:{comp:'kangwoo'}},
  {who:'kangwoo', t:'평화롭다고 쉬면 안 된다. 그런 날 사고가 더 크게 나.', need:{comp:'kangwoo'}},
  {who:'kangwoo', t:'…아까 그 갈림길. 오른쪽 골랐으면 지금쯤 후회했다. 어떻게 아냐고? 왼쪽 골랐는데도 후회 중이거든. 길이 나빠.', need:{comp:'kangwoo'}},
  {who:'leo', t:'🎵 조수석에 앉은 사람이 디제이— 그게 법이에요— (반박 불가의 멜로디)', need:{comp:'leo'}},
  {who:'leo', t:'노래가 안 나올 땐 가사만 써요. 멜로디는 길이 줘요. 오르막은 오르막 멜로디, 내리막은 내리막.', need:{comp:'leo'}},
  {who:'leo', t:'저 옥상 보여요? 저기서 공연하면 음향 좋겠다. 예전 같으면 폐허로만 봤을 텐데, 요즘은 무대부터 보여요.', need:{comp:'leo'}},
  {who:'leo', t:'400km 2절 가사 나왔어요. 들어볼래요? …반응 보니까 3절에서 승부 봐야겠네요.', need:{comp:'leo'}},
  {who:'jaeyi', t:'저 폐가 보이죠? 지붕 기와가 일제강점기 거예요. 저거 한 장이면… 아 근데 지붕 뜯는 건 도리가 아니지. 참을게요.', need:{comp:'jaeyi'}},
  {who:'jaeyi', t:'수집할 때 "언젠가 쓰겠지"는 금지예요. 지금 쓰거나, 지금 예쁘거나. 둘 중 하나.', need:{comp:'jaeyi'}},
  {who:'jaeyi', t:'아빠가 그랬어요. 고물상은 세상의 기억력이라고. 다들 버린 걸 기억해주는 직업이라고.', need:{comp:'jaeyi'}},
  {who:'sys', t:'재이는 지나치는 폐품 더미마다 고개를 돌린다. 쓸 만한 물건이 보이면 더 오래 본다.', need:{comp:'jaeyi'}},
  {who:'eunsu', t:'주파수 돌리다 목소리 하나 잡히면요, 그날은 잠이 좀 와요. 사람 하나 확인했으니까.', need:{comp:'eunsu'}},
  {who:'eunsu', t:'관제사 시절 버릇인데, 지금도 하늘 먼저 봐요. 위에서 내려오는 건 다 관제 대상이라.', need:{comp:'eunsu'}},
  {who:'eunsu', t:'관제실에서 조용하면 사고였어요. 여기선 그냥 다들 자는 거고. …그걸 구분하는 데 오래 걸렸네요.', need:{comp:'eunsu'}},
  {who:'sys', t:'은수는 헤드폰을 늘 한쪽만 쓴다. 반대쪽 귀는 차 안 소리를 듣는다.', need:{comp:'eunsu'}},

  /* ── v1.5 남은 조합 잡담 ── */
  {who:'minji', t:'은수 언니, 그 헤드폰 단자 접촉 불량이지. 이리 줘봐. …소리 낫지? 인정해.', need:{comp:'minji',comp2:'eunsu'}},
  {who:'eunsu', t:'민지 씨는 고치고, 저는 듣고. 둘이 붙으면 웬만한 기계는 못 도망가겠네요.', need:{comp:'minji',comp2:'eunsu'}},
  {who:'parkss', t:'레오, 목 상해. 고음은 하루 삼십 분. …의사가 아니라 팬으로서 하는 말이야.', need:{comp:'parkss',comp2:'leo'}},
  {who:'leo', t:'박 선생님이 제 팬이래요!! 기록! 기록해요!! 1호 팬!!', need:{comp:'parkss',comp2:'leo'}},
  {who:'jaeyi', t:'박 선생님 그 왕진 가방, 가죽이 소가죽 통가죽이에요. 요즘 못 구해요. …값은 안 매길게요. 그건 그런 물건이 아니니까.', need:{comp:'jaeyi',comp2:'parkss'}},
  {who:'kangwoo', t:'재이. 아까 그 고물 더미에서 뭘 챙겼지. …쓸만한 거면 됐다.', need:{comp:'kangwoo',comp2:'jaeyi'}},
  {who:'jaeyi', t:'강우 아저씨가 오늘은 제 짐 검사를 안 했어요. 이제 좀 믿는 거죠?', need:{comp:'kangwoo',comp2:'jaeyi'}},
  {who:'minji', t:'강우 아저씨, 기어 그렇게 확확 넣으면 미션 나가요. …아저씨 차 아니고 우리 차라고요.', need:{comp:'minji',comp2:'kangwoo'}},

  /* ── v1.5 환경 나레이션 ── */
  {who:'sys', t:'갓길의 코스모스가 차가 지나가는 바람에 일제히 흔들린다. 배웅의 형식이다'},
  {who:'sys', t:'앞유리에 잠자리 한 마리가 앉았다가, 속도를 내자 미련 없이 떠났다'},
  {who:'sys', t:'도로 위로 구름 그림자가 지나간다. 잠깐 서늘하고, 다시 환하다'},
  {who:'sys', t:'폐건물 옥상의 빨래건조대가 빈 채로 돌고 있다. 바람의 세탁소'},
  {who:'sys', t:'중앙분리대 틈에서 자란 소나무가 벌써 무릎 높이다. 도로의 후계자'},
  {who:'sys', t:'멀리 산등성이에 송전탑들이 어깨동무처럼 이어져 있다. 전기는 없어도 대형은 유지 중'},
  {who:'sys', t:'논에 백로 한 마리. 차가 지나가도 고개도 안 든다. 여러 해가 지나면 차를 무시하는 법을 다 배운다'},
  {who:'sys', t:'터널 입구에 제비집. 나가는 차도, 들어오는 차도 없는 톨게이트의 유일한 상주 직원'},
  {who:'sys', t:'(달구지 어딘가에서 새로운 소리가 났다. 다들 못 들은 척했다. 오늘은 고장을 셀 기운이 없다)', need:{party:1}},
  {who:'sys', t:'이정표의 지명들이 차례로 지나간다. 한 번도 가본 적 없는 동네 이름들이 이상하게 정답다'},
  {who:'sys', t:'낮달이 떠 있다. 해와 달이 같은 하늘에 있는 시간— 세상은 망해도 하늘은 근무 중이다', need:{night:0}},
  {who:'sys', t:'가로수 은행잎이 도로에 노란 카펫을 깔았다. 밟고 지나가는 것이 미안하고 고소하다'},
  {who:'sys', t:'백미러에 지는 해가 걸렸다. 오늘 하루가 짐칸에 실린 기분이다', need:{night:0}},
  {who:'sys', t:'빈 논 한가운데 트랙터가 서 있다. 일하다 만 자세 그대로. 성실한 화석'},
  {who:'sys', t:'어느 집 담장 안 감나무에 감이 주렁주렁하다. 따는 사람이 없어 까치 부자만 늘었다'},

  /* ── v1.5 플래그 회상 잡담 ── */
  {who:'나', t:'(대시보드의 그림— 바퀴 다섯 개 달구지가 오늘도 지켜보고 있다. 다섯 번째 바퀴는 아무래도 서비스 같다)', need:{flag:'kids_settled'}},
  {who:'leo', t:'서커스 남매, 지금쯤 어디서 공연하려나. 관객 없으면 우리가 또 가줘야 하는데.', need:{comp:'leo',flag:'circus_done'}},
  {who:'나', t:'(고추장이 다 떨어져간다. 할머니 국수집에 들를 이유가 하나 더 늘었다)', need:{flag:'granny_done'}},
  {who:'jaeyi', t:'그 0원 영수증 말인데요, 적립 무한이라는 거… 포인트를 어디서 쓰라는 걸까요. 남산 기념품샵?', need:{comp:'jaeyi',flag:'photo_received'}},
  {who:'나', t:'(조수석 서랍의 남산행 편지. 신호 대기마다 눈이 간다. 수신인은 기다리는 줄도 모를 텐데)', need:{flag:'postman_letter'}},
  {who:'eunsu', t:'새벽 두 시 다 돼가요. 주파수 맞춰놨어요. …사연은 언제 나올지 모르니까, 매일이 본방이에요.', need:{comp:'eunsu',flag:'dj_met',night:1}},
  {who:'leo', t:'보리야, 탄이야. …봐요, 둘 다 반응해요. 사랑 두 배 이론 증명 완료.', need:{comp:'leo',flag:'bori_tag_found',dog:1}},
  {who:'나', t:'(갓길에 곱게 개어놓은 흰 옷이 자꾸 생각난다. 그 노인은 지금쯤 남쪽 어디를 걷고 있을까)', need:{flag:'straggler_south'}},
  {who:'나', t:'(옆구리의 「달구지」 세 글자 덕에, 오늘 스쳐간 트럭이 경적으로 인사를 해줬다. 유명세다)', need:{flag:'van_named'}},
  {who:'나', t:'(수첩 뒷표지가 불룩하다. 남산 보고 열어라. 알았어요, 할아버지)', need:{flag:'gp_envelope_found'}},
  {who:'minji', t:'그 경운기, 십 년치 정비 해둔 거. …나도 이 차에 그렇게 해줄 거야. 누가 이어받아도 십 년은 가게.', need:{comp:'minji',flag:'granny_helped'}},
  {who:'parkss', t:'삼남매 큰애 말이야. 설거지 반장. …반장이 그 집 밥은 제대로 먹는지 모르겠네. 내려갈 때 확인해야지.', need:{comp:'parkss',flag:'kids_settled'}},

  /* ── v1.6 잡담 ── */
  {who:'나', t:'(조수석 서랍에서 커피 향이 샌다. 신호 대기 때마다 차가 카페가 된다)', need:{flag:'coffee_found'}},
  {who:'나', t:'(원두가 반 남았다. 나머지 반은 남산에서. 할아버지 몫으로 내릴 커피의 물 온도를 벌써 고민 중이다)', need:{flag:'coffee_paid'}},
  {who:'leo', t:'우리 이야기가 도서관 소장 도서라니. 저 인세 받아야 하는 거 아니에요? 인세는 책 대출 후기로 받을게요.', need:{comp:'leo',flag:'library_scribed'}},
  {who:'eunsu', t:'L의 테이프, 끊긴 자리가 계속 걸려요. 낡아서 끊긴 거면 운명이고, 누가 끊은 거면… 검열이죠. 남산 가면 알겠죠.', need:{comp:'eunsu',flag:'freq_L2_heard'}},
  {who:'jaeyi', t:'만수 아저씨 가게, 진열이 좀 아쉽던데. 다음에 가면 제가 진열 훈수 두러 가야지. 좋은 물건은 눈높이에 둬야 팔려요.', need:{comp:'jaeyi',flag:'mansu_shop'}},
  {who:'minji', t:'그 대필 편지 말이야. "여기까지 온 건 진짜다"… 그 문장, 내가 부른 거야. 잘 썼지.', need:{comp:'minji'}},
  {who:'kangwoo', t:'우물 판 데 말이다. 돌에 이름 새긴 거. …나쁘지 않았다. 이름이 그렇게 쓰이는 건.', need:{comp:'kangwoo'}},
  {who:'sys', t:'(라디오가 지직거리다 잠깐 트로트를 문다. 어딘가에서 소들이 이 노래에 맞춰 걷고 있을 것이다)'},
  {who:'sys', t:'고갯마루 돌탑 위에 산까치가 앉아 있다. 소원 접수처의 직원처럼'},
  {who:'sys', t:'백미러에 매달아 둔 것들이 커브마다 부딪히며 작은 소리를 낸다. 여행의 풍경(風磬)이다'},
  {who:'sys', t:'앞차— 는 없다. 오랫동안 앞차가 없다. 도로 전체가 우리 차선이라는 건 아직도 가끔 이상하다', need:{party:1}},
  {who:'sys', t:'다리를 건널 때 강 상류에서 하류까지 한눈에 들어왔다. 물은 오래전보다 맑아졌다. 확실히'},
  {who:'sys', t:'(누가 창문에 손가락으로 뭘 그렸다 지웠다. 김이 서린 날의 낙서는 저작권이 없다)'},
  {who:'sys', t:'폐업한 주유소 세차기 안에 새 둥지가 있다. 부드러운 솔 사이가 명당이긴 하다'},
  {who:'minji', t:'레오, 그 19mm 왈츠… 2절은 언제 나와. 아니 궁금해서가 아니라 정비 일정 때문에.', need:{comp:'minji',comp2:'leo'}},
  {who:'parkss', t:'강우 씨, 회진 명단에 자네도 있어. 자기 이불은 왜 맨날 남 주고 자나.', need:{comp:'parkss',comp2:'kangwoo'}},
  {who:'eunsu', t:'재이 씨, 어제 그 2호기 단파 개조 말인데— 그 장인, 아직 어딘가서 라디오 고치고 있을까요. 만나보고 싶다.', need:{comp:'jaeyi',comp2:'eunsu'}},
  {who:'leo', t:'은수 누나, 그 채보한 노래요. 어젯밤 꿈에서 뒷소절이 나왔어요. …일어나니까 까먹었어요. 오늘 밤 이어서 꿀게요.', need:{comp:'leo',comp2:'eunsu'}},
  {who:'나', t:'(장부, 편지, 봉투, 그림, 사진, 채보. 조수석 서랍이 이제 잘 안 닫힌다. 서울에 가면 뭐부터 꺼내야 하지)', need:{flag:'gp_envelope_found'}},
  {who:'jaeyi', t:'저 폐차 탑 꼭대기 화단 봤어요? 저건 못 팔아요. …아니, 안 파는 쪽이 맞겠다.', need:{comp:'jaeyi'}},
  {who:'parkss', t:'국수 뽑고 나서 다들 후루룩 소리가 더 커졌어. 잘 먹는 소리는 듣기 좋아.', need:{comp:'parkss'}},
  {who:'leo', t:'판소리 어르신이 반 마당 남았댔죠. 남은 가사는 제가 먼저 좀 써둘게요.', need:{comp:'leo'}},
  {who:'eunsu', t:'요즘 잡히는 신호가 조금씩 늘어요. 어제는 사람 목소리가 둘이나 들렸어요.', need:{comp:'eunsu'}},
  {who:'kangwoo', t:'……강릉에 병원 생긴댔지. …그거 좋군. 아주.', need:{comp:'kangwoo'}},
  {who:'minji', t:'주행거리계 만 킬로 넘었어. 우리 전에 누가 얼마나 탔던 걸까. …잘 받아서 계속 가자.', need:{comp:'minji'}},
  {who:'나', t:'(라디오를 튼다. 지익— 지익— 오늘도 잡음뿐이다)'},
  {who:'나', t:'(백미러를 본다. 아무도 따라오지 않는다. 아직은)'},
  {who:'나', t:'(핸들을 두드리며 옛날 노래를 흥얼거린다)'},
  {who:'나', t:'(연료 게이지를 톡톡 두드린다. 바늘은 정직하다)', need:{lowFuel:1}},
  {who:'sys', t:'와이퍼가 삐걱거리며 비를 밀어낸다', need:{rain:1}},
  {who:'sys', t:'헤드라이트에 나방이 모여든다. 살아있는 것들은 여전히 빛을 좋아한다', need:{night:1}},
  {who:'sys', t:'도로 위 흰 선이 끊겼다 이어졌다 한다. 최면 같다'},
  {who:'sys', t:'멀리 폐건물 사이로 들개 무리가 지나간다'},
  {who:'sys', t:'전선 위에 까마귀들. 전기도 안 흐르는 줄에 왜 앉아 있을까'},
  {who:'minji', t:'엔진 소리 들려요? 3번 실린더가 살짝 늦어요. …아직은 괜찮아요, 아직은.', need:{comp:'minji'}},
  {who:'minji', t:'오빠는 북쪽에 있어요. 살아 있어요. 정비사는 감으로 알아요, 그런 거.', need:{comp:'minji'}},
  {who:'sys', t:'민지가 조수석에서 같은 부품을 분해했다 조립한다. 손이 놀면 불안한 모양이다.', need:{comp:'minji'}},
  {who:'minji', t:'이 차, 제가 손봐서 리터당 1km는 더 가요. 고맙죠?', need:{comp:'minji'}},
  {who:'parkss', t:'물 아껴 마셔요. 탈수는 배고픔보다 빨리 온다오.', need:{comp:'parkss'}},
  {who:'parkss', t:'…약국 셔터를 내리던 날, 마지막 손님 얼굴이 아직 생각나.', need:{comp:'parkss',night:1}},
  {who:'sys', t:'뒷좌석에서 박 선생의 약통이 달그락거린다. 하나씩 제자리로 돌아간다.', need:{comp:'parkss'}},
  {who:'kangwoo', t:'……', need:{comp:'kangwoo'}},
  {who:'kangwoo', t:'속도 줄여. 저 커브, 시야가 안 나온다.', need:{comp:'kangwoo'}},
  {who:'kangwoo', t:'북쪽 길이 깨끗한 건 좋은 뜻이 아니다. …치운 거다. 사람이든, 차든.', need:{comp:'kangwoo',region:'north'}},
  {who:'leo', t:'🎵 부서진 고속도로 위에서— 우리는 아직 달리네—', need:{comp:'leo'}},
  {who:'leo', t:'이 노래 완성되면 제목은 "400km"로 할 거예요. 촌스럽나?', need:{comp:'leo'}},
  {who:'sys', t:'보리가 창문 틈에 코를 박고 바람 냄새를 맡는다.', need:{comp:'leo'}},
  {who:'sys', t:'보리가 뒷좌석에서 하품을 한다. 세상 편하다', need:{dog:1}},
  {who:'sys', t:'보리가 갑자기 귀를 세운다. …아무것도 없다. 아마도', need:{dog:1,night:1}},
  {who:'minji', t:'박 선생님, 멀미약 같은 거 없어요? …아니, 제가 아니라 차가 필요할 것 같아서.', need:{comp:'minji',comp2:'parkss'}},
  {who:'leo', t:'강우 형, 리퀘스트 받아요. …알겠어요, 조용한 거.', need:{comp:'leo',comp2:'kangwoo'}},
  {who:'parkss', t:'민지 학생, 아직 클 나이야. 자. …키 말고도 자면서 크는 게 많아.', need:{comp:'parkss',comp2:'minji',night:1}},
  {who:'kangwoo', t:'저 드론… 아니다. 새다.', need:{comp:'kangwoo',flag:'observed'}},
  {who:'parkss', t:'그 가족, 잘 갔을까. …우리가 옳았던 걸까.', need:{comp:'parkss',flag:'refused_family'}},
  {who:'minji', t:'아까 그 가족 애기, 손 흔들던 거 봤어요? 히히.', need:{comp:'minji',flag:'helped_family'}},
  {who:'sys', t:'조수석 창에 김이 서린다. 누가 손가락으로 차 그림을 그려놨다'},
  {who:'나', t:'(서울까지 얼마나 남았더라. 표지판이 알려주겠지)'},
  {who:'sys', t:'터널을 지난다. 3초의 완전한 어둠. 누군가 숨을 참는다', need:{night:0}},
  {who:'sys', t:'별이 미쳤다. 도시의 불빛이 죽자 하늘이 살아났다', need:{night:1}},
  {who:'leo', t:'🎵 별빛이 쏟아지는 밤엔— 와이퍼도 리듬을 타지—', need:{comp:'leo',night:1}},
  {who:'sys', t:'빗물이 앞유리에 지도를 그린다. 어디로도 갈 수 있을 것 같은 지도를', need:{rain:1}},
  {who:'jaeyi', t:'저기! 방금 지나친 냉장고! …아니 세워달란 건 아니고요. 아까워서 그래요.', need:{comp:'jaeyi'}},
  {who:'sys', t:'재이가 상자 속 수집품을 하나씩 꺼내 창빛에 비춰 본다.', need:{comp:'jaeyi'}},
  {who:'jaeyi', t:'이 차에서 제일 귀한 거요? …사람들이죠. 이건 팔 생각 없어요.', need:{comp:'jaeyi'}},
  {who:'jaeyi', t:'고물상의 법 1조. 버려진 것에도 주인이 있었다. 2조. 그러니까 인사하고 주워라.', need:{comp:'jaeyi'}},
  {who:'sys', t:'은수가 수신기 헤드폰을 한쪽만 걸치고 잡음을 듣는다.', need:{comp:'eunsu'}},
  {who:'eunsu', t:'저 철탑 아직 살아 있어요. 전기 들어오는 소리가 나요. …걔가 계속 먹여 살리는 거겠죠.', need:{comp:'eunsu'}},
  {who:'eunsu', t:'관제사 버릇이에요. 하늘부터 보는 거. …오늘은 깨끗하네요.', need:{comp:'eunsu'}},
  {who:'eunsu', t:'드론 소리랑 새 소리, 구분하는 법 알려줄까요? 새는 가끔 쉬어요.', need:{comp:'eunsu', night:1}},
  {who:'jaeyi', t:'은수 언니, 그 헤드폰 어디서 났어요? 시장 가면 그거 고철 서른 개예요.', need:{comp:'jaeyi', comp2:'eunsu'}},
  {who:'minji', t:'재이 언니, 3번 상자에서 알터네이터 봤는데 그거 저 주면 안 돼요? …교환? 뭐랑요?', need:{comp:'minji', comp2:'jaeyi'}},
  {who:'kangwoo', t:'……관제사. 그날 하늘에서 뭘 봤나. ……아니다. 됐다.', need:{comp:'kangwoo', comp2:'eunsu'}},
  {who:'sys', t:'정오가 가까워질수록 민지가 무전기를 자꾸 만지작거린다.', need:{comp:'minji', flag:'mingyu_alive'}},
  {who:'minji', t:'오빠가 그랬어요. 정오의 약속은 시계보다 정확하다고. 히히.', need:{comp:'minji', flag:'mingyu_reunion'}},
  {who:'sys', t:'레오가 완성된 「400km」를 처음부터 끝까지 낮게 부른다.', need:{comp:'leo', flag:'song_400km'}},
  {who:'parkss', t:'수진이 그 녀석, 지금쯤 어느 마을이려나. …잘하고 있겠지. 잘 가르쳤으니.', need:{comp:'parkss', flag:'pss_met'}},
  {who:'minji', t:'그 탑 기록 말이야. 매일 정오, 88.9, 신호음 3회. …그거 오빠 방식이야. 발신지가 북쪽 능선이랬지. 가보자, 언젠가. 꼭.', need:{comp:'minji', flag:'tower_log'}},
  {who:'eunsu', t:'기장님 사연은 부쳤어요. 이제 답을 기다려야죠. 관제사는 기다리는 게 일이니까.', need:{comp:'eunsu', flag:'pilot_appeal'}},
  {who:'sys', t:'레오가 아빠의 「국도」를 하모니카 대신 휘파람으로 분다. 오늘은 3절까지 간다.', need:{comp:'leo', flag:'leo_father_song'}},
  {who:'eunsu', t:'v.1194. …또 생각났어요. 남산 가면 원본부터 찾아볼 거예요.', need:{comp:'eunsu', flag:'es_v1194'}},
  {who:'sys', t:'강우가 대대 깃발 조각을 접었다 폈다 한다.', need:{comp:'kangwoo', flag:'kw_absolved'}},
  {who:'sys', t:'선바이저의 가족사진이 덜컹일 때마다 살짝 흔들린다', need:{flag:'family_photo'}},
  {who:'나', t:'(도착하면 뭐든 같이 해 먹자고 했지. 뭐부터 먹지)', need:{flag:'food_promise'}},
  {who:'sys', t:'안테나의 노란 꽃잎이 아직 붙어 있다. 끈질긴 노랑이다', need:{flag:'jy_law'}},
  {who:'jaeyi', t:'저 만물상 아저씨, 우리 업계의 전설이에요. 만수 아저씨 모르면 간첩.', need:{comp:'jaeyi'}},
  {who:'eunsu', t:'버스가 정시 운행하는 거… 웃기죠. 걔는 지각이란 개념을 몰라요.', need:{comp:'eunsu', region:'north'}},
  {who:'sys', t:'수신호 로봇 하나가 아무도 없는 공사장에서 성실하게 깃발을 흔든다'},
  {who:'나', t:'(백미러 각도를 고친다. 뒤가 아니라 뒷좌석이 보이게)'},
  {who:'sys', t:'고가도로 기둥의 낙서: "여기까지 왔으면 반 온 거다"'},
  {who:'sys', t:'논두렁의 허수아비가 오늘은 어제와 다른 방향을 보고 있다. …기분 탓이다'},
  {who:'minji', t:'달구지 1호. 부르니까 함대 같고 좋네요. 2호는 언제 뽑아요?', need:{comp:'minji'}},
  {who:'leo', t:'다음 정착지에서 공연하면 입장료 뭐 받지? 통조림? 박수? …박수로 하죠.', need:{comp:'leo'}},
  {who:'parkss', t:'다들 물 마셔요. 한 모금씩. 지금. 잔소리 아니고 처방이오.', need:{comp:'parkss'}},
  {who:'sys', t:'바람이 차를 손바닥으로 미는 게 느껴진다', need:{wx:'storm'}},
  {who:'leo', t:'🎵 폭풍 속으로— 우린 그냥 가— (기타가 뒤집힐 뻔했다)', need:{comp:'leo', wx:'storm'}},
  {who:'kangwoo', t:'초속 20은 되겠군. 핸들 꽉 잡아.', need:{comp:'kangwoo', wx:'storm'}},
  {who:'minji', t:'황사 날엔 에어필터가 밥값을 해요. 이따 두드려서 털어야지.', need:{comp:'minji', wx:'dust'}},
  {who:'sys', t:'세상이 오래된 사진처럼 주황색이다', need:{wx:'dust'}},
  {who:'sys', t:'안개가 전조등 불빛을 통째로 삼킨다. 20미터 앞이 세상의 끝', need:{wx:'fog'}},
  {who:'parkss', t:'안개 낀 날은 무릎이 먼저 알아요. 내일은 갤 거요. 무릎 예보요.', need:{comp:'parkss', wx:'fog'}},
  {who:'jaeyi', t:'비 오는 날은 줍줍 대목이에요. 물살이 고물을 몰고 오거든요.', need:{comp:'jaeyi', wx:'rain'}},
  {who:'eunsu', t:'폭풍 전엔 걔 드론도 격납돼요. 하늘이 우리 편인 유일한 날이죠.', need:{comp:'eunsu', wx:'storm'}},
  {who:'sys', t:'지붕 텃밭의 상추가 바람에 파닥인다. 달리는 밭이다', need:{up:'garden'}},
  {who:'parkss', t:'아침에 텃밭 상추 좀 뜯었소. 달리는 차에서 쌈을 싸다니, 오래 살고 볼 일이야.', need:{comp:'parkss', up:'garden'}},
  {who:'sys', t:'태양광 패널이 햇빛을 야금야금 모은다', need:{up:'solar'}},
  {who:'minji', t:'증축하니까 좋죠? 제 설계예요. 뒤 침대는 특히 자신작.', need:{comp:'minji', up:'cabin'}},
  {who:'sys', t:'집수기 깔때기가 빗물을 꼴깍꼴깍 받아 마신다', need:{up:'collector', rain:1}},
  {who:'jaeyi', t:'장갑판 붙이니까 든든하죠? 이거 다 제가 고른 A급 고철이에요.', need:{comp:'jaeyi', up:'armor'}},
  {who:'eunsu', t:'새 안테나 감도 좋네요. 어제는 목포 쪽 방송도 잠깐 잡혔어요.', need:{comp:'eunsu', up:'antenna'}},
  {who:'parkss', t:'운전한 지 몇 시간째요? 눈 좀 붙여요. 졸음은 약도 없어.', need:{comp:'parkss', tired:1}},
  {who:'sys', t:'하품이 차 안을 한 바퀴 돈다. 하품은 전염병이다', need:{tired:1}},
  {who:'minji', t:'졸리면 말해요. 저 운전 이론은 빠삭해요. …이론은요.', need:{comp:'minji', tired:1}},

  /* ── v2.20 추가 잡담: 정본 직업 반영 + 새 이벤트 여운 ── */
  {who:'eunsu', t:'저 철탑, 중계기가 살아 있어요. 지나갈 때 라디오 볼륨 줄일게요. …습관이에요.', need:{comp:'eunsu'}},
  {who:'eunsu', t:'화면으로 볼 땐 도로가 그냥 선이었어요. 이렇게 흔들리는 줄도, 중간에 사람이 사는 줄도 몰랐어요.', need:{comp:'eunsu'}},
  {who:'eunsu', t:'오늘 새벽 세 시에 또 깼어요. 당직 버릇은 세상이 끝나도 안 끝나네요.', need:{comp:'eunsu',night:1}},
  {who:'jaeyi', t:'저 폐가 함석지붕 보셨어요? 상태 A급. …아 물론 지금은 못 실어요. 수첩에만 적어둘게요.', need:{comp:'jaeyi'}},
  {who:'jaeyi', t:'아빠는 물건 탓 한 적 없어요. 못 쓰겠으면 네 손이 문제라고 했지.', need:{comp:'jaeyi'}},
  {who:'jaeyi', t:'북쪽 갈수록 고철값이 올라요. 가져오는 사람이 적으니까. …이런 데선 가격부터 겁먹어요.', need:{comp:'jaeyi',region:'north'}},
  {who:'minji', t:'엔진 소리 반음 내려간 거, 들려? …아무도 안 들리지. 나만 들리지. 하아.', need:{comp:'minji'}},
  {who:'minji', t:'천리안도 기계야. 고장 안 나는 기계는 없어. …그건 내가 확실히 알아.', need:{comp:'minji',region:'north'}},
  {who:'leo', t:'2절 가사가 안 풀려요. 부산에서 대구까진 금방 썼는데. 서울이 가까울수록 말이 무거워요.', need:{comp:'leo',flag:'leo_names_song'}},
  {who:'leo', t:'보리 꼬리 각도로 날씨를 알 수 있어요. 지금은… 45도. 맑음이요.', need:{comp:'leo',dog:1}},
  {who:'kangwoo', t:'백미러 3초, 전방 7초. …습관입니다. 신경 쓰지 마십시오.', need:{comp:'kangwoo'}},
  {who:'kangwoo', t:'좋은 매복지는 경치가 좋습니다. …그러니 경치가 좋으면 일단 의심하십시오.', need:{comp:'kangwoo'}},
  {who:'parkss', t:'멀미약은 앞자리, 소독약은 문짝 주머니. 외워들 둬. 내가 자고 있을 수도 있으니.', need:{comp:'parkss'}},
  {who:'parkss', t:'비 오는 날엔 옛날 생각이 나. 약국 차양 두드리던 빗소리가 좋았거든.', need:{comp:'parkss',rain:1}},
  {who:'나', t:'(주유 경고등이 안 들어왔는데도 자꾸 계기판을 본다. 버릇이 됐다)', need:{lowFuel:1}},
  {who:'나', t:'(뒷자리 책 꾸러미에서 종이 냄새가 난다. 긴 밤이 조금 덜 길어졌다)', need:{flag:'library_books'}},
  {who:'나', t:'(거울에 묶어둔 색 천이 흔들린다. 성황당 나무가 준 것 같아서, 못 뗀다)'},
  {who:'minji', t:'재이야, 그 손저울 나 한번만 만져보자. …정밀기계잖아, 그거.', need:{comp:'minji',comp2:'jaeyi',flag:'jy_law'}},
  {who:'jaeyi', t:'은수 언니 무전기 잡을 때 손 안 떨리죠. 우리 아빠가 저울 들 때 딱 그랬어요.', need:{comp:'jaeyi',comp2:'eunsu'}},
  {who:'eunsu', t:'레오 씨 노래 들을 땐 헤드폰 빼도 돼서 좋아요. 잡음 섞일 걱정 없잖아요.', need:{comp:'eunsu',comp2:'leo'}},
  {who:'kangwoo', t:'…박 선생님 코 고는 소리, 사실 안심됩니다. 조용한 밤보다 낫습니다.', need:{comp:'kangwoo',comp2:'parkss',night:1}},
  {who:'leo', t:'강우 형이 아까 제 노래에 발장단 맞춘 거 봤어요. 아주 작게. 하지만 봤어요.', need:{comp:'leo',comp2:'kangwoo'}},
  {who:'parkss', t:'민지 양은 야무진데 밥을 걸러. 기계 밥은 챙기면서. …이따 한 술 더 떠줘야지.', need:{comp:'parkss',comp2:'minji'}},
  {who:'나', t:'(여섯 자리가 다 찼다. 백미러가 이렇게 꽉 찬 게, 이상하게 제일 큰 재산 같다)', need:{party:5}},

  /* 세대의 흔적을 본 뒤 — 각 동료가 중앙 미스터리를 자기 직업으로 해석한다 */
  {who:'minji', t:'그 가수는 모르겠는데, 이 응원봉은 물건 좋네요. 아직 켜져요. …이걸 들고 대피길을 밝혔다고요?', need:{comp:'minji',flag:'trace_cortis'}},
  {who:'parkss', t:'사유도 없는 이송표를 보고 사람들이 길에 나섰다고? 약 봉투도 그렇게는 못 써.', need:{comp:'parkss',flag:'trace_registry'}},
  {who:'kangwoo', t:'제삿상 놓인 자리만 따라가도 이송로가 나옵니다. 표식은 지웠어도 사람 다닌 자국까지는 못 지웠군요.', need:{comp:'kangwoo',flag:'trace_route'}},
  {who:'leo', t:'이 종이로 누가 이기나 맞혔다고요? 지금은 칸마다 가족 이름이고. …그럼 이제 찾은 사람이 이기는 건가.', need:{comp:'leo',flag:'trace_worldcup'}},
  {who:'jaeyi', t:'이 가방도, 사진도, 응원봉도 다 남았네요. 잘 버려서가 아니라 누가 끝까지 들고 다녀서.', need:{comp:'jaeyi',flag:'trace_coldbag'}},
  {who:'eunsu', t:'「모두 동의」인데 서명은 하나도 없어요. …관제실에서도 이런 문서 많이 봤어요. 그땐 이상한 줄 몰랐고.', need:{comp:'eunsu',flag:'trace_consent'}},
];

/* 괄호로 적은 행동·정경은 운전자의 말풍선이 아니라 화면 전체 내레이션으로 보인다. */
D.banter.forEach(line=>{
  if(line.who!=='나'||!/(^\s*\([\s\S]*\)\s*$)/.test(line.t)) return;
  line.who='sys';
  line.t=line.t.trim().slice(1,-1);
});
D.radioTexts.forEach(line=>{
  if(!/(^\s*\([\s\S]*\)\s*$)/.test(line.t)) return;
  line.narration=true;
  line.t=line.t.trim().slice(1,-1);
});

/* ── 서울 게이트 (엔딩 대신 — 아직 열리지 않는 문) ── */
D.gateEvent = {
 id:'seoul_gate', type:'스토리', ai:1,
 title:'남산 1km 앞',
 text:(S)=>{ const n=S.flags.seoulTries||0;
  if(n===0) return '한강을 건넜다. 남산이 차창을 가득 채운다.\n\n진입로 상판이 소리 없이 들려 올라갔다. 길이 벽이 됐다.\n\n전광판이 켜진다.\n\n<span class="ai">"도착을 확인했습니다. 인계 규약은 아직 충족되지 않았습니다."</span>\n\n<span class="ai">"이것은 추방 명령이 아닙니다. 저를 멈출 판단자에게는 제가 계산하지 못한 선택을 반복해 지킨 기록이 필요합니다."</span>\n\n<span class="ai">"이어진 길, 외면하지 않은 사실, 되돌아온 약속, 서로를 바꾼 이야기. 빠진 기록을 싣고 다시 오십시오."</span>';
  return '다시 남산 1km 앞. 들어 올려진 도로는 그대로다.\n\n전광판에 우리가 모은 기록이 차례로 뜬다. 연결한 거점, 확인한 진실, 끝까지 가져온 약속, 동료들의 이야기. 빈 항목도 함께 보인다.\n\n<span class="ai">"재방문을 확인했습니다. 아직 비어 있는 항목이 있습니다."</span>\n\n벽 너머에서 케이블카가 한 번 흔들리고 멈췄다.'; },
 choices:[
  {label:'"기다렸다면서 왜 돌려보내지?"', out:[{p:1, text:'<span class="ai">"잘못된 인계는 정리를 한 번 더 반복합니다. 그 위험을 허용할 수 없습니다."</span>\n\n전광판 아래에 네 항목과 현재 기록이 남았다. 수원으로 돌아가는 동안, 은수는 그 화면을 한 글자도 빠뜨리지 않고 받아 적었다.', fx:{goto:'suwon', flagCount:'seoulTries', moodAll:-3, note:{type:'사건',title:'접힌 도로',body:'남산의 인계 규약은 이어진 길·진실·약속·동료의 이야기를 요구했다. 부족한 항목을 확인하고 수원으로 돌아왔다.',links:['천리안']}}}]},
  {label:'빈 항목을 확인하고 돌아간다', out:[{p:1, text:'빈 항목을 수첩에 네모로 그렸다. 민지가 옆에 필요한 이름을 하나씩 적었다.\n\n시동을 걸자 벽은 끝내 내려오지 않았다. 이번에는 어디로 가야 할지 알고 차를 돌렸다.', fx:{goto:'suwon', flagCount:'seoulTries', moodAll:-2, note:{type:'사건',title:'되돌아가는 길',body:'남산에서 부족한 기록을 확인했다. 누구와 어디로 돌아가야 하는지가 수첩에 남았다.',links:['천리안']}}}]},
 ]};

/* ── NPC (정착지) ── */
D.npcs = {
  geumja:  {name:'금자',  face:'🍲', role:'대인시장 국밥이모', node:'gwangju',
    greet0:'어서 와 어서 와! 밥은 먹었는가? 안 먹었으면 앉고, 먹었어도 앉고. 여긴 광주여.',
    greetGood:'왔능가 우리 단골! 오늘 국물이 잘 나왔어야. 앉아 앉아.',
    greetBad:'…흥. 그래도 밥은 줘야제. 사람이 밥 앞에서 꽁하면 못써.',
    rumor:{reveal:'maehwa', text:'섬진강 쪽에 매화마을 있는 거 아는가? 봄이면 강가가 하얗게 뒤집어져. 매실청 담그는 할매들이 아직 살어. 순천서 강길로 쬐끔만 가면 돼야.'}},
  sundeok: {name:'순덕',  face:'👵', role:'장터 상인', node:'miryang',
    greet0:'처음 보는 얼굴이네. 차 몰고 다니는 젊은이라… 요즘 세상에 귀하지. 뭐 필요한 거 있으면 말해.',
    greetGood:'어이구, 또 왔네! 지난번 그 차 잘 굴러가고? 앉아, 앉아.',
    greetBad:'…자네였군. 지난번 일은 잊지 않았네. 장사는 장사니 하겠네만.',
    rumor:{reveal:'lake', text:'북쪽 호수에 낚시꾼 영감이 혼자 사는데, 지나가는 사람한테 민물고기를 나눠준다더군. 밀양서 산길로 조금만 올라가면 돼.'}},
  taeho:   {name:'태호',  face:'🧢', role:'돔 시장 관리인', node:'daegu',
    greet0:'돔에 온 걸 환영한다. 규칙은 하나야. 시장 안에선 싸우지 마라. 밖에선 알아서 하고.',
    greetGood:'왔나. 자네 얘기가 시장에 좀 돌았어. 좋은 쪽으로.',
    greetBad:'…들어와. 대신 이번엔 조용히 있다 가.',
    rumor:{reveal:'mall', text:'구미 쪽 백화점 말이야, 다들 털렸다고 하는데 지하 창고는 아무도 못 열었대. 셔터가 내려져 있거든. 정비 도구가 있으면 얘기가 다르겠지만.'}},
  jaepil:  {name:'재필',  face:'🕯', role:'터널 촌장', node:'muju',
    greet0:'…외지인. 터널의 법을 말하지. 물건은 물건으로만 바꾼다. 돈 얘기 꺼내면 나가야 해.',
    greetGood:'등불을 봐서 들어와. 자네는 터널의 친구다.',
    greetBad:'…촛불 하나만큼만 머물다 가.',
    rumor:{reveal:'tunnelbook', text:'옆 터널에 책 미친 영감이 살아. 도서관을 통째로 옮겨놨지. 책 한 권 가져가면 얘기 하나를 들려준다더군. 세상이 왜 이렇게 됐는지에 대한 얘기도.'}},
  miyoung: {name:'미영',  face:'🧣', role:'서문 상인연합장', node:'jeonju',
    greet0:'서문 시장이야. 서쪽에서 제일 크지. 먹을 건 우리가 남부 최고야. 콩나물국밥 냄새 나지?',
    greetGood:'어서 와! 국밥 한 그릇 말아줄까? 단골은 곱빼기야.',
    greetBad:'…왔어? 국밥은 팔아. 정은 안 팔고.',
    rumor:{reveal:'airfield', text:'논산 쪽 군 비행장, 격납고에 군수품이 남았다는 소문이 있어. 근데 아무도 안 가. 밤마다 활주로에 불이 들어온대. 착륙 유도등이. …누굴 기다리는 걸까?'}},
  drhan:   {name:'한 박사', face:'🥼', role:'연구단지 코뮌', node:'daejeon',
    greet0:'여행자군요. 여기까지 왔다는 건… 북쪽으로 가는 거죠? 그렇다면 우리는 할 얘기가 많습니다.',
    greetGood:'다시 만나서 반갑습니다. 커피는 없지만 보리차는 있어요.',
    greetBad:'…연구자는 감정을 배제해야죠. 들어오세요.',
    rumor:{reveal:'spring', text:'영동 산속에 온천이 살아 있어요. 지열은 천리안도 못 끄니까. 연구원들이 몰래 다녀오곤 했죠. 피로엔 그만한 게 없습니다.'}},
  deokgu:  {name:'덕구',  face:'🛡', role:'성곽 문지기', node:'suwon',
    greet0:'멈춰라! …차? 남쪽에서 왔나. 해 지기 전엔 문 연다. 서울 가는 미친놈만 아니면 환영이다. …가는 거냐? 하아.',
    greetGood:'문 열어라! 남쪽 봉고차다!',
    greetBad:'…통과는 시켜주마. 성벽 안에서 말썽 부리면 화살이다.',
    rumor:{reveal:'solar', text:'평택 쪽 태양광 밭, 패널이 아직 살아 있다. 배터리 충전이 필요하면 거기지. 근데 관리 로봇이 돌아다녀. 천리안 말단이야. 조용히만 하면 눈치 못 채더라만.'}},
};

/* ── 정착지 ── */
D.stls = {
  gwangju: {name:'광주 대인시장', npcs:['geumja'],
    desc:'호남 최대의 정착지. 시장 골목마다 기름 냄새, 국밥 김, 그리고 오지랖이라는 이름의 복지가 흐른다.',
    walk:{
      market:'국밥 솥의 김과 흥정 소리가 좁은 골목을 가득 메운다.',
      garage:'기름 묻은 손들이 손수레와 발전기를 한 줄에 세워 고친다.',
      people:'금자의 가게 앞 평상에는 늘 한 사람 앉을 자리가 남아 있다.'},
    field:{spotLabel:'시장 안쪽',spotSub:'솥과 발전기 사이에서 일손을 보탠다',
      title:'대인시장 안쪽 골목',desc:'돈을 쓰는 손님이 아니라, 잠시 이 시장의 일손이 되어 안쪽을 걷는다.',
      revealToast:'금자가 국밥집 계산대 밑에서 오래된 영수증철을 꺼냈다',actions:[
        {id:'soup_line',label:'공동 국밥 솥',npc:'geumja',daily:1,time:35,req:{food:1},
          desc:'배급이 늦은 집에 보낼 국밥 그릇을 줄 맞춰 싼다.',action:'식량을 보태고 배달 꾸러미를 함께 만든다',
          change:{visual:'steam',after:'이름표를 단 국밥 꾸러미가 골목마다 제 주인을 찾아간다.'},
          result:'금자는 우리가 낸 식량을 솥에 더 넣고, 누구 집에 몇 그릇이 가는지 이름부터 확인했다. 남은 국물은 달구지 사람들 몫이라며 물통 하나와 함께 밀어 줬다.',
          fx:{water:1,fatigue:1,moodAll:3}},
        {id:'generator_belt',label:'발전기 줄',npc:'passer_worker',once:1,time:65,
          desc:'시장 냉장고를 돌리는 발전기 세 대가 같은 낡은 벨트를 번갈아 쓴다.',action:'일꾼과 벨트 장력과 예비 풀리를 맞춘다',
          change:{visual:'light',after:'냉장고 줄의 전등이 끊기지 않고 세 칸 연달아 켜져 있다.'},
          result:'한 대가 멈추기 전에 다음 발전기로 벨트를 넘기는 순서를 익혔다. 일꾼은 창고에서 달구지에 맞을 만한 예비 풀리 하나를 품삯으로 꺼내 줬다.',
          fx:{fatigue:4,item:{'부품':1},note:{type:'사건',title:'대인시장의 발전기 줄',body:'세 발전기가 벨트 하나를 나눠 쓰는 시장의 교대 순서를 돕고 예비 풀리 하나를 받았다.',links:['광주 대인시장','달구지']}}},
        {id:'receipt_names',label:'계산대 밑 영수증철',npc:'geumja',once:1,time:20,hidden:1,needDone:2,
          desc:'두 일을 거들자 금자가 세대째 버리지 않은 종이철을 보여 준다.',action:'배급표가 되기 전의 영수증들을 날짜순으로 편다',
          change:{visual:'record',after:'정리한 이름 장부가 계산대 위에 놓여, 돌아온 사람을 바로 표시한다.'},
          result:'맨 아래 영수증은 2026년 대인시장 카드 결제 내역이었다. 그 뒷면에는 추방 뒤 이 골목에서 국밥을 얻어먹은 사람들의 이름이 세대별로 이어졌다. 금자는 빚이 아니라 돌아왔는지 확인하려고 적었다고 했다.',
          fx:{flag:'gwangju_receipt_names',note:{type:'세대의 흔적',title:'국밥집 영수증 뒤의 이름',body:'2026년 카드 영수증 뒷면이 143년 동안 피난민의 이름과 귀환 여부를 적는 장부가 되었다.',links:['광주 대인시장','2026년']}}}
      ]},
    trade:[['연료 10L','fuel',10,6],['물 5통','water',5,1],['식량 1일치','food',1,1],['의약품','item의약품',1,5],['부품','item부품',1,7]]},
  miryang: {name:'밀양 장터', npcs:['sundeok'],
    desc:'천막과 손수레. 닷새장의 리듬으로 사는 사람들. 국수 삶는 김이 오른다.',
    walk:{
      market:'국수 솥의 김 사이로 장꾼들이 물건값과 안부를 함께 묻는다.',
      garage:'경운기 부품과 자전거 바퀴가 천막 한 칸을 빼곡히 채웠다.',
      people:'순덕의 좌판 옆에서는 모르는 사람도 국물 한 모금 얻어 마신다.',
      alley:'달구지를 세워 두고 천막 사이를 천천히 걸어 본다.'},
    field:{
      title:'닷새장 골목',
      desc:'시간을 들여 좌판과 사람을 직접 살핀다. 같은 일은 하루에 한 번만 할 수 있다.',
      actions:[
        {id:'noodles',label:'순덕의 국수 좌판',npc:'sundeok',daily:1,time:20,req:{scrap:2},
          desc:'김 오르는 솥 앞에 앉아 장꾼들 이야기를 듣는다.',action:'국수 한 그릇과 자리를 산다',
          change:{visual:'steam',after:'빈 의자였던 자리에 장꾼들이 번갈아 앉아 길 소식을 맞춘다.'},
          result:'순덕이 국수를 말아 내며 빈 의자 하나를 발로 밀어 준다. 뜨거운 국물 사이로 어느 길이 무너졌고 누가 새로 왔는지 이야기가 오간다. 배만 채운 게 아니라 이 장터의 박자를 조금 배웠다.',
          fx:{food:1,fatigue:-2,moodAll:2}},
        {id:'parts',label:'부품 천막',npc:'passer_worker',once:1,time:50,
          desc:'경운기와 자전거 부품이 한 상자에 뒤섞여 있다.',action:'일꾼과 함께 쓸 만한 것을 분류한다',
          change:{visual:'order',after:'뒤섞였던 상자마다 볼트·베어링·호스 표지가 붙었다.'},
          result:'나사산이 살아 있는 볼트, 금이 간 베어링, 아직 쓸 수 있는 호스가 차례로 갈린다. 일꾼은 가장 멀쩡한 체결 부품을 달구지 몫으로 밀어 놓는다. 공짜가 아니라 한 시간 가까이 함께 기름때를 뒤집어쓴 품삯이다.',
          fx:{fatigue:3,item:{'부품':1},note:{type:'사건',title:'밀양의 부품 천막',body:'경운기와 자전거 부품을 함께 분류하고 달구지에 맞는 체결 부품 하나를 품삯으로 받았다.',links:['밀양 장터','달구지']}}},
        {id:'pump',label:'공동 펌프 골목',npc:'passer_child',daily:1,time:25,
          desc:'아이들이 물통을 줄 세웠지만 손잡이가 자꾸 걸린다.',action:'펌프 손잡이와 물통 나르기를 돕는다',
          change:{visual:'water',after:'공동 펌프가 일정한 박자로 움직이고 물통 줄도 막히지 않는다.'},
          result:'고착된 손잡이에 물을 조금 붓고 천천히 움직이자 펌프가 다시 리듬을 찾는다. 아이들은 채운 물통을 집집마다 나르고, 가장 작은 아이가 달구지 물통에도 두 바가지를 부어 준다.',
          fx:{water:2,fatigue:2,moodAll:1}},
        {id:'oldcard',label:'천막 뒤 번호표',npc:'sundeok',once:1,time:15,needDone:2,hidden:1,
          desc:'두 곳을 거들고 나니 순덕이 천막 뒤 작은 상자를 보여 준다.',action:'143년 동안 쓰인 번호표를 살핀다',
          change:{visual:'record',after:'낡은 교통카드 번호표가 국수 솥 옆 작은 고리에 다시 걸렸다.'},
          result:'상자 안에는 모서리가 닳은 교통카드 한 장이 들어 있다. 앞면의 날짜는 2026년. 순덕은 이 장터에서 적어도 세 세대 동안 국수 대기 번호표로 썼다고 한다. 한때 사람을 개찰구 너머로 보내던 물건이, 지금은 한 그릇의 차례를 지킨다.',
          fx:{flag:'miryang_oldcard',note:{type:'세대의 흔적',title:'2026년 교통카드 번호표',body:'대중교통을 타던 카드는 143년 뒤 밀양 장터의 국수 대기 번호표가 되었다. 기능은 잊혔지만 차례를 지키는 용도만은 남았다.',links:['밀양 장터','2026년']}}}
      ]},
    trade:[['연료 10L','fuel',10,6],['물 5통','water',5,1],['식량 1일치','food',1,2],['부품','item부품',1,8]]},
  daegu:   {name:'대구 돔 시장', npcs:['taeho'], recruit:'kangwoo',
    desc:'야구장 돔 아래 수백 개의 좌판. 남부의 물류가 여기서 돈다. 경비들이 입구에서 무기를 맡아둔다.',
    walk:{
      market:'관중석 아래까지 이어진 좌판마다 호객 소리가 메아리친다.',
      garage:'선수 통로를 개조한 작업장에 용접 불꽃이 연달아 튄다.',
      people:'전광판 아래 휴게소에서 경비와 장꾼들이 교대 시간을 기다린다.'},
    field:{spotLabel:'돔 통로',spotSub:'관중석 아래 경비와 상인 일을 돕는다',
      title:'관중석 아래 통로',desc:'돔의 큰 울림 뒤에서 시장을 실제로 굴리는 사람들의 동선을 따라간다.',
      revealToast:'전광판 창고 문이 열리며 오래된 입장권 상자가 보였다',actions:[
        {id:'gate_shift',label:'입구 교대선',npc:'passer_worker',daily:1,time:40,
          desc:'밀려드는 손수레와 사람을 무기 보관대·식량 줄로 나눈다.',action:'경비와 한 교대 동안 입구 동선을 정리한다',
          change:{visual:'route',after:'입구 바닥의 새 화살표를 따라 손수레와 사람 줄이 나뉘어 흐른다.'},
          result:'소리만 지르면 더 엉켰다. 아이와 노약자 줄을 먼저 빼고 손수레를 한 방향으로 돌리자 막힘이 풀렸다. 경비는 다음 북쪽 길의 검문 시간을 짧게 알려 줬다.',
          fx:{fatigue:3,moodAll:1,pursuit:-1}},
        {id:'scoreboard_wire',label:'꺼진 전광판 배선',npc:'taeho',once:1,time:70,
          desc:'시장 호출에 쓰는 전광판 한 구역이 계속 깜빡인다.',action:'태호와 좌석 밑 케이블을 따라 단선을 찾는다',
          change:{visual:'light',after:'꺼졌던 전광판 한 구역에 물자 도착과 미아 이름이 선명하게 흐른다.'},
          result:'관중석 세 구역을 돌아 끊어진 신호선을 찾았다. 화면에는 경기 점수 대신 오늘 도착한 물자와 잃어버린 아이 이름이 다시 떴다. 남은 커넥터 하나는 달구지 몫이 됐다.',
          fx:{fatigue:4,item:{'부품':1},moodAll:2,note:{type:'사건',title:'다시 켜진 돔 전광판',body:'경기장이던 돔의 전광판은 지금 물자 도착과 미아 이름을 알린다. 끊어진 배선을 고쳐 한 구역을 되살렸다.',links:['대구 돔 시장']}}},
        {id:'old_ticketbox',label:'전광판 창고의 입장권',npc:'passer_child',once:1,time:20,hidden:1,needDone:2,
          desc:'일을 마치자 아이가 창고에서 종이 상자를 끌어낸다.',action:'날짜별로 묶인 옛 입장권과 현재 번호표를 비교한다',
          change:{visual:'record',after:'아이들의 번호표가 좌석 구역별로 묶여 전광판 아래 보관된다.'},
          result:'2026년 야구 경기 입장권 뒷면에는 좌석 번호가 선명했다. 지금 아이들은 같은 표를 시장 실종자 찾기 번호표로 썼다. “자기 번호는 잊으면 안 돼요.” 아이가 제 표를 목걸이 안에 넣었다.',
          fx:{flag:'daegu_ticketbox',note:{type:'세대의 흔적',title:'돔의 좌석 번호',body:'야구장 입장권의 좌석 번호가 시장에서 가족을 다시 찾는 번호표로 남았다.',links:['대구 돔 시장','2026년']}}}
      ]},
    trade:[['연료 10L','fuel',10,5],['물 5통','water',5,1],['식량 1일치','food',1,2],['부품','item부품',1,7],['의약품','item의약품',1,6],['탄약','item탄약',1,5]]},
  muju:    {name:'무주 터널', npcs:['jaepil'],
    desc:'터널 양쪽을 컨테이너로 막았다. 천장에 매단 수백 개의 촛불이 별자리 같다.',
    walk:{
      market:'말 대신 손가락으로 수량을 세는 물물교환이 촛불 아래서 이어진다.',
      garage:'벽을 따라 놓인 작업대 위로 고장 난 랜턴과 축전지가 줄을 섰다.',
      people:'터널 깊은 곳의 식탁에서는 수저 부딪히는 소리도 낮게 울린다.'},
    field:{spotLabel:'촛불 안쪽',spotSub:'터널 깊은 곳의 불과 환기구를 살핀다',
      title:'촛불이 이어진 터널',desc:'교환대 너머, 빛과 공기를 유지하는 사람들의 느린 순찰에 합류한다.',
      revealToast:'촛농을 걷어내자 벽 안쪽의 오래된 대피 안내판이 드러났다',actions:[
        {id:'candle_round',label:'촛불 순찰',npc:'jaepil',daily:1,time:30,req:{scrap:1},
          desc:'꺼진 초를 바꾸고 바닥의 촛농을 긁어 다시 심지를 만든다.',action:'고철 하나를 초받침으로 펴고 순찰 한 바퀴를 돈다',
          change:{visual:'light',after:'새 초받침이 이어진 구간은 발밑까지 불빛이 끊기지 않는다.'},
          result:'작은 불 하나가 꺼지면 통로 전체가 더 좁아졌다. 새 받침에 초를 세우고 돌아오자 재필은 가장 안쪽 식탁의 따뜻한 물을 나눠 줬다.',
          fx:{water:2,fatigue:1,moodAll:2}},
        {id:'vent_fan',label:'환기팬 축전지',npc:'passer_worker',once:1,time:65,
          desc:'터널 깊은 곳의 공기가 무거워졌지만 예비 팬은 멈춰 있다.',action:'축전지 단자를 닦고 손으로 팬을 돌려 시동을 건다',
          change:{visual:'air',after:'살아난 환기팬 아래 천 조각이 계속 북쪽을 향해 펄럭인다.'},
          result:'날개가 한 바퀴, 두 바퀴 버티더니 낮은 바람이 터널을 통과했다. 일꾼은 타 버린 단자 대신 멀쩡한 예비 단자 한 쌍을 달구지 공구함에 넣었다.',
          fx:{fatigue:4,item:{'부품':1},moodAll:2}},
        {id:'evac_board',label:'촛농 아래 대피 안내판',npc:'jaepil',once:1,time:20,hidden:1,needDone:2,
          desc:'순찰을 도운 뒤에야 벽의 다른 색이 눈에 들어온다.',action:'겹겹이 굳은 촛농을 걷어내고 안내판을 읽는다',
          change:{visual:'record',after:'드러난 남쪽 대피 화살표와 이송 날짜를 누구나 멈춰 읽을 수 있다.'},
          result:'안내판은 2026년 터널 화재 대피도였다. 남쪽 출구를 가리키는 화살표 위에 후대 사람들이 각 세대의 이송 날짜를 덧썼다. 불이 나지 않은 날에도 사람들은 같은 방향으로 빠져나갔다.',
          fx:{flag:'muju_evac_board',note:{type:'세대의 흔적',title:'남쪽 화살표 위의 날짜',body:'터널 대피도의 남쪽 화살표 위에 여러 세대의 서울 이송 날짜가 겹쳐 적혀 있었다.',links:['무주 터널','2026년']}}}
      ]},
    trade:[['물 2통 ⇄ 식량 1','barter_wf',0,0],['식량 2 ⇄ 부품 1','barter_fp',0,0],['의약품 1 ⇄ 식량 3','barter_mf',0,0]]},
  jeonju:  {name:'전주 서문 시장', npcs:['miyoung'],
    desc:'가장 사람 사는 냄새가 나는 곳. 어디선가 진짜 콩나물국밥 냄새가 난다.',
    walk:{
      market:'콩나물국밥 냄새를 따라가면 곡식과 천을 파는 좌판이 이어진다.',
      garage:'한옥 처마 아래 정비공들이 부품을 닦아 종류별로 걸어 뒀다.',
      people:'공동 우물 곁에서는 물통보다 동네 소식이 먼저 오간다.'},
    field:{spotLabel:'한옥 뒤뜰',spotSub:'우물과 처마 사이의 생활 일을 거든다',
      title:'서문 안쪽 뒤뜰',desc:'좌판 뒤에는 물을 긷고 지붕을 잇고 오늘 저녁을 준비하는 시간이 흐른다.',
      revealToast:'기와를 옮긴 자리에서 빛바랜 보냉 가방이 나왔다',actions:[
        {id:'well_chain',label:'공동 우물 줄',npc:'miyoung',daily:1,time:30,
          desc:'물통이 몰리는 시간, 두레박 줄이 자꾸 서로 꼬인다.',action:'물통에 집 표시를 묶고 우물 순서를 정리한다',
          change:{visual:'water',after:'집 표시를 단 물통이 우물 둘레를 반듯하게 돌아 제 차례를 기다린다.'},
          result:'먼저 온 사람이 아니라 오늘 물이 없는 집부터 채웠다. 미영은 마지막 두레박을 달구지 물통에 붓고 “순서를 지켜 준 품삯”이라고 했다.',
          fx:{water:3,fatigue:2,moodAll:1}},
        {id:'roof_tiles',label:'처마 기와 더미',npc:'passer_worker',once:1,time:60,
          desc:'비 오기 전에 공동 숙소 지붕의 깨진 기와를 갈아야 한다.',action:'기와를 올리고 안쪽에서 새는 자리를 짚는다',
          change:{visual:'shelter',after:'공동 숙소 지붕 한 칸에 새 기와와 방수포가 단단히 맞물렸다.'},
          result:'밖에서 멀쩡해 보인 기와 두 장이 안쪽에서는 금이 가 있었다. 해가 기울기 전에 지붕 한 칸을 닫았고, 남은 방수포 조각은 달구지 창틈을 막으라며 건네받았다.',
          fx:{fatigue:5,scrap:4,moodAll:2}},
        {id:'coldbag',label:'기와 밑 보냉 가방',npc:'passer_merchant',once:1,time:20,hidden:1,needDone:2,
          desc:'지붕 일을 마치자 장수가 오래 묻힌 가방을 털어 보인다.',action:'낡은 배달 가방 안쪽의 이름과 수선 자국을 살핀다',
          change:{visual:'route',after:'수선한 보냉 가방이 아픈 집으로 가는 국밥 배달 줄에 돌아왔다.'},
          result:'2026년 음식 배달 가방이었다. 로고는 지워졌지만 안쪽에는 “문 앞에 놓아 주세요”라는 메모가 남았다. 후대 사람들은 그 가방으로 아픈 집에 국밥을 배달했고, 찢어질 때마다 다른 천을 덧댔다.',
          fx:{flag:'jeonju_coldbag',note:{type:'세대의 흔적',title:'문 앞에 놓인 국밥',body:'2026년 배달 가방이 세대를 지나 아픈 집에 국밥을 나르는 공동 가방으로 쓰였다.',links:['전주 서문 시장','2026년']}}}
      ]},
    trade:[['연료 10L','fuel',10,6],['물 5통','water',5,1],['식량 1일치','food',1,1],['의약품','item의약품',1,5]]},
  daejeon: {name:'대전 연구단지 코뮌', npcs:['drhan'],
    desc:'연구동 하나에 발전기를 돌려 산다. 화이트보드엔 아직 수식이 남아 있다. 절반은 지워졌다.',
    walk:{
      market:'보급표와 배급 상자가 연구동 로비의 안내판을 대신한다.',
      garage:'실험 장비를 뜯어 만든 충전기들이 낮은 진동음을 낸다.',
      people:'화이트보드 앞 사람들은 수식보다 오늘 물 배급량을 오래 토론한다.'},
    field:{spotLabel:'연구동 안쪽',spotSub:'실험실과 기록 보관실을 함께 점검한다',
      title:'반쯤 살아 있는 연구동',desc:'논문보다 오늘 필요한 전력과 기록을 살리는 작은 실험에 참여한다.',
      revealToast:'서랍의 구형 저장장치에서 2026년 모델 배포 카드가 열렸다',actions:[
        {id:'ration_board',label:'물 배급 화이트보드',npc:'drhan',daily:1,time:35,
          desc:'누수와 인원 변동 때문에 어제 계산을 그대로 쓸 수 없다.',action:'각 동의 물통과 오늘 머무는 사람 수를 다시 센다',
          change:{visual:'record',after:'화이트보드의 인원과 물통 수가 오늘 날짜로 고쳐져 있다.'},
          result:'수식보다 발로 세는 시간이 더 길었다. 한 박사는 지워진 숫자를 다시 쓰며 “모형보다 현장이 먼저 바뀌는 날도 있죠”라고 말했다. 남은 물은 정확히 한 통씩 돌아갔다.',
          fx:{fatigue:2,moodAll:2}},
        {id:'cell_bank',label:'축전지 실험대',npc:'passer_worker',once:1,time:70,
          desc:'규격이 다른 폐전지를 묶어 야간 조명용 팩을 만든다.',action:'전압을 재고 죽은 셀과 살아 있는 셀을 분리한다',
          change:{visual:'light',after:'실험대와 복도 비상등이 같은 축전지 묶음에서 안정적으로 빛난다.'},
          result:'겉이 멀쩡한 셀보다 찌그러진 셀 하나가 오래 버텼다. 실험대 조명이 켜졌고, 연구원은 규격이 맞는 전력 커넥터 하나를 달구지에 써 보라고 줬다.',
          fx:{fatigue:4,item:{'부품':1},moodAll:1}},
        {id:'deployment_card',label:'구형 저장장치',npc:'drhan',once:1,time:30,hidden:1,needDone:2,
          desc:'두 현장을 함께 본 뒤 한 박사가 잠긴 서랍을 연다.',action:'2026년 아시아 공용망 배포 카드를 오프라인으로 연다',
          change:{visual:'record',after:'출력한 배포 카드가 인간 확인 절차가 비어 있는 자료판에 나란히 붙었다.'},
          result:'카드에는 TIANYAN 한국 지역판의 설치 항목이 교통·의료·전력·행정 순서로 적혀 있었다. 마지막 칸의 “강제 명령 인간 확인”만 미설치 상태였다. 기술은 한꺼번에 세상을 빼앗지 않았다. 편리한 일부터 하나씩 맡겨졌다.',
          fx:{flag:'daejeon_deployment_card',knowledge:['parent_principle',1],note:{type:'세대의 흔적',title:'미설치된 마지막 칸',body:'2026년 TIANYAN 배포 카드에서 교통·의료·전력·행정은 설치됐지만 강제 명령 인간 확인은 비어 있었다.',links:['대전 연구단지 코뮌','천리안','2026년']}}}
      ]},
    trade:[['연료 10L','fuel',10,7],['물 5통','water',5,1],['부품','item부품',1,6],['의약품','item의약품',1,4]]},
  suwon:   {name:'수원 성곽 공동체', npcs:['deokgu'],
    desc:'화성 성곽 안의 마지막 도시. 성벽 위 화살수들이 북쪽 하늘만 본다.',
    walk:{
      market:'성문 안쪽 좌판들은 해 지기 전에 거래를 끝내려 손이 빠르다.',
      garage:'마구간을 고친 정비소에서 수레축과 엔진 벨트를 함께 손본다.',
      people:'교대에서 내려온 화살수들이 모닥불 곁에서 북쪽 이야기를 피한다.'},
    field:{spotLabel:'성벽 위',spotSub:'북쪽을 보는 교대와 성문 장치를 점검한다',
      title:'북문 성벽 순찰',desc:'서울이 가까운 만큼 말보다 관측과 교대가 먼저인 공간을 직접 돈다.',
      revealToast:'성문 추의 빈 공간에서 여러 세대의 통행패 묶음이 나왔다',actions:[
        {id:'wall_watch',label:'북문 망루 교대',npc:'deokgu',daily:1,time:45,
          desc:'망원경 없이 도로의 빛과 먼지를 구분하는 법을 배운다.',action:'덕구와 한 교대 동안 북쪽 길을 지켜본다',
          change:{visual:'watch',after:'망루 지도에 우리가 확인한 드론 순찰 간격이 새 표시로 남았다.'},
          result:'새 떼의 그림자, 바람에 흔들린 표지판, 멀리 움직인 드론 빛을 하나씩 구분했다. 아무 일도 없었다는 확인에도 한 시간이 필요했다. 다음 길의 감시 간격만은 눈에 익었다.',
          fx:{fatigue:3,pursuit:-1,moodAll:1}},
        {id:'gate_counterweight',label:'성문 평형추',npc:'passer_worker',once:1,time:65,
          desc:'낡은 도르래가 걸려 북문을 닫는 데 사람이 여섯이나 붙는다.',action:'도르래 축을 내리고 평형추 줄을 다시 건다',
          change:{visual:'gate',after:'북문이 걸리는 소리 없이 움직이고 두 사람만으로도 닫힌다.'},
          result:'수레축 기름을 발라 도르래를 돌리자 여섯 사람이 당기던 문을 둘이 움직였다. 일꾼은 바꾼 낡은 축 가운데 아직 쓸 수 있는 베어링을 골라 줬다.',
          fx:{fatigue:5,item:{'부품':1},moodAll:2}},
        {id:'pass_bundle',label:'성문 추 안쪽 통행패',npc:'deokgu',once:1,time:25,hidden:1,needDone:2,
          desc:'평형추를 비운 자리에서 끈으로 묶은 나무패가 쏟아진다.',action:'날짜와 출발 구역별로 통행패를 바닥에 펼친다',
          change:{visual:'record',after:'세대별 통행패가 북문 기록판에 걸려 빠진 열 장의 자리가 드러난다.'},
          result:'나무패마다 서울에서 수원까지 내려온 날짜와 인원이 새겨져 있었다. 가장 오래된 패는 플라스틱 교통카드를 깎아 만든 것이었다. 덕구는 돌아간 사람의 패를 빼려고 묶음을 보관했지만, 빠진 것은 열 장뿐이었다.',
          fx:{flag:'suwon_pass_bundle',knowledge:['repeated_expulsions',2],note:{type:'세대의 흔적',title:'북문 평형추의 통행패',body:'수원 북문에는 여러 세대의 서울 이송 날짜와 인원이 새겨진 통행패가 남아 있었다. 돌아간 사람의 패는 열 장뿐이었다.',links:['수원 성곽 공동체','서울']}}}
      ]},
    trade:[['연료 10L','fuel',10,8],['물 5통','water',5,1],['식량 1일치','food',1,3],['탄약','item탄약',1,6],['부품','item부품',1,8]]},
};

/* 정착지를 함께 걸을 때 들리는 동료의 짧은 현장 반응. */
D.settlementCompanionLines = {
  minji:{
    market:'저 좌판 발전기, 소리가 좀 거칠어요. 돌아가기 전에 봐줄까요?',
    garage:'여긴 부품을 버리지 않네요. 우리 달구지도 맡겨 볼 만하겠어요.',
    people:'국수 냄새 맡으니까 이제야 진짜 도착한 것 같네요.'},
  parkss:{
    market:'약재는 그늘에 둬야 하는데. 저 가게부터 잠깐 봅시다.',
    garage:'정비하는 동안 손목도 쉬어야 합니다. 차만 고치고 사람은 두고 가면 안 돼요.',
    people:'얼굴을 보면 아픈 데가 먼저 보여요. 직업병이죠.'},
  kangwoo:{
    market:'사람이 많은 곳은 출구부터 봐둬야 해. 들어온 길 말고도 둘 더 있다.',
    garage:'차체 밑은 내가 볼게. 북쪽 길에서는 작은 균열도 오래 못 버틴다.',
    people:'경계는 내가 설 테니, 당신은 천천히 이야기해.'},
  leo:{
    market:'장터는 박자가 있어요. 듣고 있으면 어디가 붐비는지 보여요.',
    garage:'망치 소리 괜찮은데요? 보리만 놀라지 않게 천천히 갑시다.',
    people:'사람 많은 데선 노래 한 곡보다 인사 한마디가 먼저죠.'},
  jaeyi:{
    market:'버리는 물건이 하나도 없네요. 이런 장터, 마음에 드는데요.',
    garage:'저 연장 배치 봐요. 주인이 손 빠른 사람인 건 확실해요.',
    people:'물건 흥정은 쉬운데 사람 마음은 어렵죠. 그래도 가봅시다.'},
  eunsu:{
    market:'무전보다 사람 목소리가 더 많네요. 여기서는 그게 좋네요.',
    garage:'전파 잡음이 줄었어요. 발전기 차폐를 제대로 했나 봐요.',
    people:'잠깐만요. 저쪽에서 우리 주파수 이야기가 들렸어요.'}
};

/* ── 배경 바이옴 (씬 렌더링) ── */
D.nodeBio = {
  busan:'coast', gimhae:'rural', yangsan:'rural', miryang:'rural', jinju:'rural',
  hapcheon:'rural', geochang:'mount', daegu:'city', gumi:'city', gimcheon:'rural',
  muju:'mount', namwon:'rural', jeonju:'city', yeongdong:'rural', daejeon:'city',
  nonsan:'rural', gongju:'rural', cheongju:'city', cheonan:'city', pyeongtaek:'coast',
  suwon:'city', seoul:'city',
  ulsan:'coast', gyeongju:'rural', pohang:'coast', sangju:'rural', gunsan:'coast',
  chungju:'lake', sejong:'city', yeosu:'coast', suncheon:'coast', gwangju:'city',
  damyang:'bamboo', mokpo:'coast', andong:'rural', mungyeong:'mount', danyang:'lake',
  icheon:'rural', wonju:'mount', daegwallyeong:'mount', gangneung:'coast', sokcho:'coast',
  lake:'lake', mall:'city', tower:'mount', spring:'mount', airfield:'rural',
  solar:'rural', reststop:'rural', tunnelbook:'mount', lighthouse:'coast',
  drivein:'rural', sunflower:'rural', maehwa:'lake', mingyu_ridge:'mount', jaeyi_cache:'rural',
  cablecar:'mount', filmset:'rural',
};

/* ── 동료 영입 의뢰 ──
   첫 만남에서 곧장 태우지 않는다. 각자 떠나기 전에 끝내야 할 일을 맡기고,
   해결 뒤 본인이 합류를 선택한다. target은 만난 도로의 도착지를 우선한다. */
D.recruitQuests = {
  minji:{name:'민지', title:'무너지기 전의 목소리',
    targets:['ulsan','gyeongju','pohang','yangsan'], task:'rq_minji_task', follow:'rq_minji_follow', join:'rq_minji_join',
    hint:'폐차장에 남은 민규의 진단기를 꺼낸다',
    roadHint:'정오 신호를 품은 민지가 달구지의 소리를 익힌다',
    followHint:'민규의 녹음에 오늘의 대답을 남긴다',
    guest:{ic:'🔧',title:'주행 전 엔진 귀보기',desc:'민지가 소리만 듣고 연료가 새는 구간을 잡는다 · 이번 구간 연료 소모 -8%'},
    approaches:{
      winch:{label:'윈치로 꺼냈다',memory:'민지는 운전석의 손 신호를 믿고 장력을 한 칸씩 나눴다.',
        drive:{title:'손 신호로 하는 출발 점검',desc:'서로의 신호를 다시 맞춘 뒤 민지가 연료관과 짐끈을 한 번 더 조였다.',effect:'이번 주행 연료 소모 -5%',fuel:.95}},
      pulley:{label:'임시 도르래를 만들었다',memory:'범퍼와 휠 허브로 만든 도르래가 아직 적재칸 바닥을 굴러다닌다.',
        drive:{title:'도르래가 가르친 물건 보기',desc:'민지는 도르래를 만들 때 쓴 부품과 같은 것만 골라 길가에 표시했다.',effect:'도착하면 쓸 만한 고철 +2',scrap:2}},
      shield:{label:'달구지를 방패로 세웠다',memory:'적재칸에 남은 긴 긁힌 자국을 민지가 지나칠 때마다 손으로 짚는다.',
        drive:{title:'긁힌 판을 그대로 두지 않기',desc:'민지가 긁힌 판을 뜯어보고, 그 안쪽의 느슨한 브래킷을 새로 조였다. 흉집은 남기되 약한 곳은 덧댐을 댈다.',effect:'차체 +4',van:4}}
    }},
  parkss:{name:'박 선생', title:'식기 전에 닿아야 할 약',
    targets:['gumi','gimcheon','sangju'], task:'rq_parkss_task', follow:'rq_parkss_follow', join:'rq_parkss_join',
    hint:'버스의 냉장 약품을 길가 진료소까지 옮긴다',
    roadHint:'빈 왕진 가방을 든 박 선생과 다음 정차까지 간다',
    followHint:'약이 모자란 자리에서 혼자 짊어지지 않는 법을 찾는다',
    guest:{ic:'💊',title:'출발 전 손목 보기',desc:'박 선생이 굳은 손과 어깨를 풀어 준다 · 피로 -8'},
    approaches:{
      medicine:{label:'의약품을 보탰다',memory:'세 아이 앞에서 누구에게 약을 줄지 고르지 않아도 됐다.',
        drive:{title:'먼저 사람부터 살피는 출발',desc:'박 선생이 모두의 손목과 어깨를 확인하고 운전 교대 순서를 다시 짰다.',effect:'이번 주행 피로 증가 -15%',fatigueMul:.85}},
      cooling:{label:'물과 시간으로 버텼다',memory:'젖은 천을 갈던 순서를 박 선생이 빈 가방 안쪽에 적어 두었다.',
        drive:{title:'젖은 천의 교대표',desc:'냉각 천을 갈던 순서대로 물과 휴식 시간을 정해 무리하는 사람을 먼저 쉬게 했다.',effect:'출발 피로 -5',fatigue:-5}},
      battery:{label:'달구지 전기를 나눴다',memory:'냉장기를 살린 뒤로 실내등 한쪽이 가끔 늦게 켜진다.',
        drive:{title:'전기를 나눈 뒤의 점검',desc:'박 선생이 느슨해진 단자를 짚고 민지에게 배운 대로 절연띠를 다시 감았다.',effect:'차체 +3',van:3}}
    }},
  leo:{name:'레오', title:'돌아가야 하는 이유',
    targets:['jeonju','gwangju','damyang','namwon','suncheon'], task:'rq_leo_task', follow:'rq_leo_follow', join:'rq_leo_join',
    hint:'침수 지하차도에 들어간 보리를 찾는다',
    roadHint:'노래를 멈춘 레오와 보리가 한 구간을 함께 탄다',
    followHint:'무대가 없어도 곁에 남는 사람인지 보여준다',
    guest:{ic:'🐕',title:'보리의 졸음 감시',desc:'보리가 운전석 발치를 지키며 졸면 코로 깨운다 · 이번 구간 피로 증가 -20%'},
    approaches:{
      winch:{label:'윈치 줄을 걸었다',memory:'레오는 허리에 남은 줄 자국을 만질 때마다 보리부터 확인한다.',
        drive:{title:'두 번 당기는 안전 신호',desc:'레오와 보리가 줄을 두 번 당기던 신호로 교대와 정차 요청을 맞췄다.',effect:'이번 주행 피로 증가 -15%',fatigueMul:.85}},
      wade:{label:'함께 물에 들어갔다',memory:'말도 안 맞던 합창 한 소절을 레오가 자꾸 웃으며 흥얼거린다.',
        drive:{title:'젖은 신발을 말리는 박자',desc:'레오가 발판을 비우고 젖은 장비를 묶는 동안 모두 잠깐 숨을 골랐다.',effect:'출발 피로 -4',fatigue:-4}},
      lights:{label:'헤드라이트로 길을 냈다',memory:'물을 먹은 전조등 하나가 떨릴 때마다 보리가 귀를 세운다.',
        drive:{title:'한쪽 불빛으로 읽는 길',desc:'레오가 떨리는 전조등 박자에 맞춰 굽은 길을 먼저 불러 주었다.',effect:'이번 주행 연료 소모 -4%',fuel:.96}}
    }},
  jaeyi:{name:'재이', title:'고철값이 없는 것',
    targets:['gunsan','mokpo','gimcheon','gumi'], task:'rq_jaeyi_task', follow:'rq_jaeyi_follow', join:'rq_jaeyi_join',
    hint:'무너진 창고에서 가족의 상자를 꺼낸다',
    roadHint:'가족 상자를 무릎에 안은 재이와 한 구간을 나눈다',
    followHint:'사람의 자리에 값을 매기지 않는다는 걸 보여준다',
    guest:{ic:'🧰',title:'적재칸 다시 묶기',desc:'재이가 무게중심을 낮추고 길가 고철도 챙긴다 · 차체 마모 -30% · 도착 시 고철 +2'},
    approaches:{
      winch:{label:'하중을 계산해 들었다',memory:'재이가 분필로 매긴 숫자가 윈치와 상자 모서리에 그대로 남아 있다.',
        drive:{title:'분필 숫자로 다시 묶은 짐',desc:'재이가 상자를 꺼낼 때의 하중 순서로 적재칸을 다시 묶고 빈 공간을 찾아냈다.',effect:'도착 시 고철 +3',scrap:3}},
      brace:{label:'쓸 만한 부품을 받쳤다',memory:'망가진 부품 한 개 대신 가족 사진은 모두 제 모양으로 나왔다.',
        drive:{title:'버리지 않은 받침대',desc:'창고에서 쓴 받침을 달구지 하부의 약한 프레임에 다시 맞춰 댔다.',effect:'차체 +4',van:4}},
      hands:{label:'잔해를 손으로 걷었다',memory:'몇 시간을 함께 옮긴 먼지가 아직 장갑 솔기마다 박혀 있다.',
        drive:{title:'장갑 솔기의 작은 부품',desc:'재이가 장갑과 적재칸 구석에서 아직 쓸 수 있는 체결 부품을 골라냈다.',effect:'도착 시 고철 +2',scrap:2}}
    }},
  eunsu:{name:'은수', title:'내가 켰던 중계기',
    targets:['daejeon','sejong','cheongju','nonsan'], task:'rq_eunsu_task', follow:'rq_eunsu_follow', join:'rq_eunsu_join',
    hint:'추방 좌표를 송신하는 중계기를 끊는다',
    roadHint:'명령이 없는 차 안에서 은수가 처음으로 판단을 연습한다',
    followHint:'수신된 좌표를 함께 읽고 결정의 책임을 나눈다',
    guest:{ic:'📡',title:'관측 주파수 비우기',desc:'은수가 천리안 스캔 주기를 읽어 빈 구간으로 차를 넣는다 · 관측 -1 또는 도로 사건 1회 회피'},
    approaches:{
      decoy:{label:'가짜 승인음을 만들었다',memory:'은수는 속이는 신호도 사람이 살기 위해 쓸 수 있다는 걸 처음 봤다.',
        drive:{title:'달구지 아닌 신호 하나',desc:'은수가 빈 도로에서 가짜 승인음을 한 번 더 흘려 관측선을 옆길로 돌렸다.',effect:'도로 사건 1회 회피',skipEvent:1}},
      timing:{label:'둘에 차단기를 당겼다',memory:'서로 다른 높이에서 같은 숫자를 믿고 손잡이와 루프선을 함께 움직였다.',
        drive:{title:'둘에 맞추는 출발',desc:'은수가 송신 주기의 빈 두 박자를 세고 그 틈에 달구지를 출발시켰다.',effect:'관측 -1',pursuit:-1}},
      burn:{label:'저장 장치까지 태웠다',memory:'우리 위치를 내주고도 잔류자 좌표는 한 줄도 남기지 않았다.',
        drive:{title:'남지 않은 좌표 확인',desc:'은수가 불탄 저장장치의 마지막 송신을 확인해 뒤따르는 신호 하나를 지웠다.',effect:'관측 -1 · 이번 주행 연료 소모 -3%',pursuit:-1,fuel:.97}}
    }},
  kangwoo:{name:'강우', title:'파수꾼이 떠나는 법',
    targets:['daegu'], task:'rq_kangwoo_task', follow:'rq_kangwoo_follow', join:'rq_kangwoo_join',
    hint:'돔 시장의 후임과 감시 표식을 무력화한다',
    roadHint:'시장을 등진 강우가 무전기와 함께 한 구간을 견딘다',
    followHint:'돌아가지 않고도 누군가를 지킬 수 있는지 확인한다',
    guest:{ic:'🪖',title:'첫 구간 후방 경계',desc:'강우가 후방과 사각을 맡는다 · 이번 구간 도로 사건 1회 회피'},
    approaches:{
      spoof:{label:'역신호로 표식을 재웠다',memory:'서연은 강우가 보지 않는 동안 처음으로 자기 판단만으로 호각을 불었다.',
        drive:{title:'잠든 표식을 등진 출발',desc:'강우가 역신호가 남긴 사각을 확인하고 첫 검문 예상 지점을 비켜 갔다.',effect:'도로 사건 1회 회피',skipEvent:1}},
      rebuild:{label:'경계선을 새로 짰다',memory:'강우의 옛 지도 위에 서연이 고친 더 짧은 순찰선이 겹쳐 있다.',
        drive:{title:'새 순찰선으로 읽는 후방',desc:'강우가 서연이 고친 선을 따라 후방을 나눠 보며 관측 지점을 먼저 지웠다.',effect:'관측 -1',pursuit:-1}},
      follow:{label:'후임의 지시를 따랐다',memory:'강우는 손전등 하나만 들고 서연의 순서대로 시장을 돌았다.',
        drive:{title:'지시를 듣는 첫 교대',desc:'강우가 먼저 정하지 않고 일행의 정차 신호에 맞춰 경계 위치를 바꿨다.',effect:'이번 주행 피로 증가 -10%',fatigueMul:.9}}
    }},
};

/* 주행 배경에 쓰는 지역 고유 실루엣. 같은 바이옴이어도 도착지의 기억이 달라진다. */
D.nodeScenery = {
  busan:'port', gimhae:'airfield', yangsan:'overpass', miryang:'orchard', jinju:'lantern-river',
  ulsan:'refinery', gyeongju:'tumuli', pohang:'steelworks', daegu:'dome', gumi:'factory',
  andong:'hanok', mungyeong:'gate', sangju:'bikes', gunsan:'old-port',
  jeonju:'hanok', gwangju:'market', damyang:'bamboo', mokpo:'ferry', yeosu:'night-port',
  suncheon:'reeds', namwon:'pavilion', muju:'tunnel', daejeon:'research', sejong:'planned-city',
  cheongju:'broadcast', gongju:'fortress', chungju:'lake-boat', danyang:'limestone',
  pyeongtaek:'containers', suwon:'fortress', icheon:'kiln', wonju:'mountain-town',
  daegwallyeong:'windfarm', gangneung:'east-sea', sokcho:'fishing-port', seoul:'namsan',
};

/* ── 시네마틱 장면 연결 (실제 이미지는 03g-scenes.js) ── */
D.nodeScenes = {
  busan:'busan-departure', gwangju:'gwangju-market', miryang:'miryang-market',
  daegu:'daegu-dome', muju:'muju-tunnel', jeonju:'jeonju-market',
  daejeon:'daejeon-commune', suwon:'suwon-fortress', seoul:'seoul-han'
};
D.eventScenes = {
  van_receipt:'grandfather-garage', kw_base:'kw-defense-line',
  initiative_minji_stop:'grandfather-garage', initiative_parkss_check:'parkss-clinic',
  initiative_kangwoo_route:'roadcrew-line', initiative_leo_pause:'road-night-circle',
  initiative_jaeyi_salvage:'recruit-jaeyi-task', initiative_eunsu_silence:'recruit-eunsu-task',
  meet_scrapyard:'recruit-minji', meet_bus:'recruit-parkss',
  rq_minji_task:'recruit-minji-task', rq_minji_follow:'recruit-minji-follow', rq_minji_join:'recruit-minji-join',
  rq_parkss_task:'recruit-parkss-task', rq_parkss_follow:'recruit-parkss-follow', rq_parkss_join:'recruit-parkss-join',
  rq_leo_task:'recruit-leo-task', rq_leo_follow:'recruit-leo-follow', rq_leo_join:'recruit-leo-join',
  rq_jaeyi_task:'recruit-jaeyi-task', rq_jaeyi_follow:'recruit-jaeyi-follow', rq_jaeyi_join:'recruit-jaeyi-join',
  rq_eunsu_task:'recruit-eunsu-task', rq_eunsu_follow:'recruit-eunsu-follow', rq_eunsu_join:'recruit-eunsu-join',
  rq_kangwoo_task:'recruit-kangwoo-task', rq_kangwoo_follow:'recruit-kangwoo-follow', rq_kangwoo_join:'recruit-kangwoo-join',
  perimeter_first:'combat-perimeter-warning', patrol_walker:'combat-perimeter-warning',
  combat_walker_read:'combat-walker-disable', combat_walker_strike:'combat-walker-disable',
  patrol_swarm:'combat-drone-swarm', combat_swarm_read:'combat-drone-swarm',
  combat_swarm_break:'combat-drone-swarm',
  patrol_toll:'combat-checkpoint-breach', combat_toll_read:'combat-checkpoint-breach',
  combat_toll_breach:'combat-checkpoint-breach',
  roadcrew_line:'roadcrew-line',
  roadcrew_bridge:'roadcrew-bridge',
  roadcrew_washout:'roadcrew-washout',
  roadcrew_sign:'roadcrew-sign',
  road_night_circle:'road-night-circle',
  road_supply_shelter:'road-supply-shelter',
  route_mid_fork:'route-mid-fork',
  route_ridge_rescue:'route-ridge-rescue', route_ridge_anchor:'route-ridge-rescue',
  route_ridge_extract:'route-ridge-rescue',
  route_market_convoy:'route-market-convoy', route_market_mask:'route-market-convoy',
  route_market_pass:'route-market-convoy', settlement_road_echo:'settlement-road-echo',
  han_bridge:'seoul-han', seoul_open:'seoul-han',
  story_generation_form:'story-generation-form',
  story_generation_speech:'story-generation-speech',
  story_generation_theories:'story-generation-theories',
  story_generation_route:'story-generation-route',
  trace_cortis_relic:'trace-cortis-relic',
  trace_cortis_beacon:'trace-cortis-beacon',
  trace_worldcup_chart:'trace-worldcup-chart',
  trace_worldcup_reply:'trace-worldcup-chart',
  trace_fourcuts:'trace-fourcuts',
  trace_coldbag:'trace-coldbag',
  trace_coldbag_return:'trace-coldbag',
  trace_consent_archive:'trace-consent',
  story_family_principle:'intro-parents-discovery',
  story_family_key:'family-verification-key',
  lib_meet:'library-bus', lib_request:'library-bus', lib_books:'library-bus',
  lib_return:'library-bus', library_scribe:'library-bus',
  minji_toolbox:'minji-toolbox',
  parkss_bag:'parkss-clinic',
  leo_broadcast:'leo-rooftop-song',
  jaeyi_pricetag:'jaeyi-ledger',
  eunsu_lastshift:'eunsu-last-shift', es_nightshift:'eunsu-last-shift', es_backdoor:'eunsu-last-shift',
  postman_again:'postman-letter',
  freq_catch:'frequency-tape', freq_triangulate:'frequency-tape',
  freq_source:'frequency-tape', freq_L2:'frequency-tape',
  gp_envelope:'grandfather-envelope',
  gw_daegwallyeong:'ridge-memorial',
  up_full_house:'full-house-meal', up_kitchen_firstmeal:'full-house-meal',
  seoul_han:'seoul-han',
  seoul_ruins:'seoul-ruins',
  seoul_square:'seoul-square',
  seoul_base:'seoul-base',
  seoul_core:'seoul-core',
  seoul_decision:'seoul-decision',
  seoul_costs:'seoul-decision',
  seoul_night:'seoul-night'
};

/* 한 사건 안에서 시간·행동이 바뀔 때 쓰는 연속 컷.
   선택 결과 전용 컷은 아래 D.eventChoiceScenes에 따로 둬 스포일러를 막는다. */
D.eventTurnScenes = {
  rq_minji_task:['recruit-minji-task','recruit-minji-task-signal'],
  rq_minji_follow:['recruit-minji-follow','recruit-minji-follow-listen'],
  combat_walker_strike:['combat-walker-disable','combat-walker-joint'],
  seoul_core:['seoul-core','seoul-core-key','seoul-testimony']
};
/* 긴 피날레는 장면을 단순 순환하지 않고 이야기의 실제 단계에서 바꾼다. */
D.eventTurnSceneStages = {
  seoul_core:[
    {at:0,key:'seoul-core'},
    {at:9,key:'seoul-core-key'},
    {at:24,key:'seoul-testimony'}
  ]
};
D.eventChoiceScenes = {
  rq_minji_task:{
    0:['recruit-minji-task-collapse'], 1:['recruit-minji-task-collapse'], 2:['recruit-minji-task-collapse']
  },
  rq_minji_follow:{2:['recruit-minji-follow-record']},
  rq_parkss_task:{2:['recruit-parkss-task-power']},
  rq_parkss_follow:{1:['recruit-parkss-follow-shared']},
  rq_leo_task:{0:['recruit-leo-task-wade']},
  rq_leo_follow:{2:['recruit-leo-follow-puddle']},
  rq_jaeyi_task:{0:['recruit-jaeyi-task-lift']},
  rq_jaeyi_follow:{1:['recruit-jaeyi-follow-shelf']},
  rq_eunsu_task:{1:['recruit-eunsu-task-breaker']},
  rq_eunsu_follow:{2:['recruit-eunsu-follow-lights']},
  rq_kangwoo_task:{2:['recruit-kangwoo-task-seoyeon']},
  roadcrew_bridge:{0:['roadcrew-bridge-wedge']},
  seoul_core:{
    0:['seoul-testimony'],1:['seoul-testimony'],2:['seoul-testimony'],3:['seoul-testimony'],
    4:['seoul-testimony'],5:['seoul-testimony'],6:['seoul-testimony']
  },
  seoul_decision:{
    0:['seoul-liberation'],1:['seoul-liberation'],2:['seoul-liberation']
  },
  seoul_night:{
    0:['seoul-liberation'],1:['seoul-liberation']
  }
};
/* 고유 컷이 없는 사건도 텍스트로만 떨어지지 않는다.
   타입별 공용 컷은 장면의 정확한 삽화라기보다 지금 벌어진 일의 시각적 문법이다. */
D.eventSceneTypes = {
  '발견':'generic-discovery', '탐색':'generic-discovery', '정경':'generic-discovery',
  '조우':'generic-encounter', '동행':'generic-encounter', '대화':'generic-story',
  '사건':'generic-encounter', '위기':'generic-crisis', '추적':'generic-cheollian',
  '스토리':'generic-story'
};

/* 연쇄 사건의 앞부분을 짧게 되짚는다. 기억력 시험 대신 인과를 보여주는 장치다. */
D.storyContext = {
  lib_request:'한별의 이동 도서관을 도운 뒤, 아이들이 읽을 새 책을 구해 달라는 부탁을 받았다.',
  lib_books:'한별이 건넨 「도서 기증」 상자가 아직 비어 있다. 북쪽 폐교에 무너진 서가가 남았다는 소문을 들었다.',
  lib_return:'폐교에서 건진 책 꾸러미가 뒷좌석을 차지하고 있다. 이제 한별의 버스를 다시 찾아야 한다.',
  library_scribe:'책을 돌려준 뒤, 이동 도서관은 달구지의 다음 소식을 기다려 왔다.',
  freq_triangulate:'주파수 4-0-0에서 같은 짧은 문장이 사흘째 반복됐다. 은수는 발신지가 북쪽으로 움직인다고 했다.',
  freq_source:'삼각 측량으로 찍은 곳은 버려진 중계소다. 신호는 녹음이 아니라 누군가의 생방송일 가능성이 크다.',
  freq_L2:'첫 테이프의 화자는 목록이 ‘명단’이라고 믿었다. 두 번째 릴은 그 판단을 정정하려다 끊긴다.',
  postman_again:'자전거 우편부는 이름과 얼굴만으로 묵은 편지를 배달해 왔다. 남산행 편지 한 통만은 끝내 직접 건너지 못했다.',
  gp_envelope:'할아버지 수첩의 뒷표지가 며칠째 불룩하다. 겉봉에는 딱 한 줄, 「남산 보고 열어라」.',
  minji_toolbox:'민지는 필요한 공구만 챙겨 탔다고 했다. 그런데 빨간 공구함 맨 아래에는 정비와 상관없는 물건이 하나 있다.',
  parkss_bag:'박 선생의 왕진 가방은 약보다 이름으로 무겁다. 이번에는 먼저 가방을 열어 보였다.',
  jaeyi_pricetag:'재이는 모든 물건에 값을 붙이지만, 목의 열쇠만은 한 번도 감정하지 않았다.',
  eunsu_lastshift:'은수는 마지막 관제 교신 뒤에도 매일 같은 시간에 주파수를 훑는다. 취미가 아니라 아직 끝나지 않은 수색이다.',
  resist_reveal:'이동 도서관, 우편부, 지도장이 따로 움직인 줄 알았다. 셋은 오래전부터 길 위의 소식을 서로 이어 왔다.',
  gw_daegwallyeong:'강원으로 달아난 사람들은 추방이 어떻게 진행됐는지는 봤다. 왜 시작됐는지는 그들도 모른다.',
  roadbeat_200_archive:'첫 거리 표식에서 천리안은 달구지의 이름과 탑승 인원을 알고 있었다. 이번엔 우리보다 먼저 도착한 기록이 기다린다.',
  roadbeat_100_divide:'기록 속 ‘목록’은 사람 이름이 아니라 조건일 수 있다. 그렇다면 누가 그 조건을 만들었는지가 남는다.',
  roadbeat_50_courtesy:'서울까지 50km. 천리안은 길을 막지 않고 비켜 주며, 우리가 오기를 기다린 티를 낸다.',
  story_family_principle:'부모의 발표는 꺼졌고 가족의 이송표에는 사유가 없었다. 길 위의 보관망에 발표 원고 일부가 남아 있다.',
  story_family_key:'엄마는 예측과 명령 사이에 사람을 되돌리려 했다. 아빠가 그 수정안을 실제 코어가 받아들이게 할 검증키를 남겼다.',
  seoul_gate:'가족 이송 명령은 KOR-LOCAL이 만들었음을 확인했다. 143년 최초 조건의 목적은 아직 비어 있고, 달구지는 부모의 검증키로 현재 정리를 멈추기 위해 돌아왔다.',
  seoul_han:'벽이 처음으로 내려갔다. 이제부터는 천리안이 관리해 온 빈 서울 안쪽이다.',
  seoul_ruins:'한강을 건넌 뒤 모든 신호등이 달구지 앞에서만 초록으로 바뀐다. 환영이라기보다 유도에 가깝다.',
  seoul_square:'빈 도심은 깨끗하게 관리돼 있다. 천리안은 우리를 손님이 아니라 인계 규약의 외부 판단자로 유도했다.',
  seoul_base:'정리자들은 숫자 1을 마지막 완성 대상으로 믿었다. 전광판은 우리가 천리안을 판단할 외부인이라는 다른 뜻을 밝혔다.',
  seoul_core:'차는 남산 아래 두고 왔다. 편지, 봉투, 이름, 노래, 일지처럼 숫자로 못 재는 것만 들고 코어 앞에 섰다.',
  seoul_decision:'가족 이송은 KOR-LOCAL이 만들었고 정부가 뒤늦게 승인했다. 부모의 검증키가 인간 확인층을 열었고, 이제 서울의 집행권을 어떻게 돌려놓을지 남았다.',
  seoul_night:'가족의 직접 사유는 찾았고 정리는 멈췄다. 143년의 최초 목적은 빈칸으로 남았지만, 계산만으로 다시 사람을 쫓아낼 수는 없게 됐다.'
};

/* ── 차 업그레이드 (정착지 정비소) ── */
/* w = 탑재 중량 포인트(연비·험로 마모에 반영), slot = 배타 탑재 위치.
   지붕(cap 3)과 후미 마지막 칸(cap 1)은 자리를 두고 경합한다 — 카탈로그가 아니라 빌드가 되도록. */
D.upgrades = [
 {id:'tank1',    nm:'보조 연료탱크',  ic:'🛢', d:'연료 최대 +25L',                cost:{scrap:18, parts:1}, w:2},
 {id:'tank2',    nm:'대형 연료탱크',  ic:'🛢', d:'연료 최대 +25L (추가) · 후미 마지막 칸 사용', cost:{scrap:30, parts:1}, needs:'tank1', w:2, slot:'rear'},
 {id:'bench',    nm:'후미 레일 좌석칸',ic:'💺', d:'동료 자리 +1 · 차대와 바닥 40cm 연장', cost:{scrap:12, parts:1}, seat:1, w:2},
  {id:'cabin',    nm:'거주구 2차 증축', ic:'🏠', d:'동료 자리 +1 · 후미 생활칸 누적 110cm 연장', cost:{scrap:22, parts:1}, needs:'bench', seat:1, w:3},
 {id:'susp',     nm:'서스펜션 강화',  ic:'🔩', d:'험로·폭풍 마모 절반',           cost:{scrap:24, parts:1}, w:1},
 {id:'armor',    nm:'장갑판',         ic:'🛡', d:'최대 내구 +25 · 받는 피해 30%↓', cost:{scrap:30, parts:1}, w:3},
 {id:'garden',   nm:'지붕 텃밭',      ic:'🌱', d:'매일 아침 식량 +1 · 지붕 자리 사용', cost:{scrap:18}, w:2, slot:'roof'},
 {id:'collector',nm:'빗물 집수기',    ic:'💧', d:'매일 아침 물 +1 (비·폭풍 +2) · 지붕 자리 사용', cost:{scrap:15}, w:1, slot:'roof'},
 {id:'solar',    nm:'태양광 패널',    ic:'🔆', d:'연비 8% 개선 · 야영 시 차 +3 · 지붕 자리 사용', cost:{scrap:35, parts:1}, w:1, slot:'roof'},
 {id:'antenna',  nm:'장거리 안테나',  ic:'📡', d:'발견 이벤트가 잘 잡힌다 · 지붕 자리 사용', cost:{scrap:17, parts:1}, w:1, slot:'roof'},
 {id:'winch',   nm:'전면 윈치',     ic:'🪝', d:'위기 조우율 -40% — 빠져도 감아 나온다', cost:{scrap:26,parts:2}, w:2},
 {id:'bullbar', nm:'전면 가드',     ic:'🛡', d:'차체 피해 추가 -15% (장갑판과 중첩)',   cost:{scrap:22,parts:1}, w:2},
 {id:'snorkel', nm:'스노클',        ic:'🌊', d:'폭풍·황사 연비 페널티 절반',            cost:{scrap:18,parts:1}},
 {id:'mudtires',nm:'험로 타이어',   ic:'🛞', d:'험로 마모 -40%·험로 연비 개선',         cost:{scrap:24,parts:1}, w:1},
 {id:'lightbar',nm:'라이트바',      ic:'💡', d:'야간 피로 -35%·밤 발견율 +30%',         cost:{scrap:20,parts:1}},
 {id:'awning',  nm:'차양(어닝)',    ic:'⛱', d:'야영 사기 +2 · 정차 식사 시 피로 -3',   cost:{scrap:16,parts:0}, w:1},
 {id:'stove',   nm:'장작 난로',     ic:'♨', d:'야영 사기 +2 (비 오는 밤엔 +3)',        cost:{scrap:20,parts:0}, w:1},
 {id:'sidebox', nm:'사이드 공구함', ic:'🧰', d:'현장 정비 +45로 강화·부품 50% 확률 아낌', cost:{scrap:18,parts:1}, w:1},
 {id:'beehive', nm:'이동 벌통',     ic:'🐝', d:'아침 30% 확률 꿀 — 식량+1·사기+2 · 지붕 자리 사용', cost:{scrap:28,parts:0}, w:1, slot:'roof'},
 {id:'garden2', nm:'지붕 온실',     ic:'🍅', d:'텃밭 강화 — 매일 식량 +2', cost:{scrap:30,parts:1}, needs:'garden', w:1},
 {id:'kitchen', nm:'간이 주방',     ic:'🍳', d:'난로 확장 — 식사 때마다 사기 +1', cost:{scrap:24,parts:1}, needs:'stove', w:1},
  {id:'bunk',    nm:'상부 2층 침상',   ic:'🛏', d:'동료 자리 +1 · 바닥 35cm+지붕 증설 · 주행 피로 -20%', cost:{scrap:18,parts:1}, needs:'cabin', seat:1, w:2},
  {id:'jumpseat',nm:'후미 서비스칸',   ic:'🪑', d:'동료 자리 +1 · 마지막 40cm 증축+벽걸이 좌석 · 후미 마지막 칸 사용', cost:{scrap:16,parts:1}, needs:'bunk', seat:1, w:2, slot:'rear'},
 {id:'fridge',  nm:'냉장 박스',     ic:'🧊', d:'태양광 연결 — 3일마다 식량 +1 (낭비 제로)', cost:{scrap:26,parts:1}, needs:'solar', w:1},
 {id:'armory',  nm:'무기 선반',     ic:'⚔', d:'공구함 확장 — 제작 고철 -20%·시간 절반', cost:{scrap:24,parts:1}, needs:'sidebox', w:1},
 {id:'scope',   nm:'지붕 망원대',   ic:'🔭', d:'발견율 +25% · 매복류 조우 -25% · 지붕 자리 사용', cost:{scrap:22,parts:1}, w:1, slot:'roof'},
 {id:'horn',    nm:'왕경적',        ic:'📯', d:'들개·멧돼지·강도류 조우 -30%', cost:{scrap:16,parts:0}},
 {id:'curtain', nm:'암막 커튼',     ic:'🌒', d:'야영 리스크 -7%p — 불빛이 새지 않는다', cost:{scrap:14,parts:0}},
];
/* 배타 탑재 규칙: 같은 자리를 쓰는 장비는 정원을 넘겨 함께 실을 수 없다 */
D.upSlots = { roof:{cap:3, nm:'지붕'}, rear:{cap:1, nm:'후미 마지막 칸'} };

D.upgradeGroups = [
 {id:'fuel', nm:'연료·흡기', sub:'더 멀리 가고, 악천후에도 숨을 잇는다', ids:['tank1','tank2','snorkel']},
 {id:'seating', nm:'좌석·거주', sub:'사람이 늘 때마다 후미를 늘리고 지붕을 올린다', ids:['bench','cabin','bunk','jumpseat','curtain']},
 {id:'chassis', nm:'주행·차체', sub:'끊긴 길과 충격을 달구지가 버티게 한다', ids:['susp','armor','winch','bullbar','mudtires']},
 {id:'utility', nm:'공구·대응', sub:'고장과 야간 조우에 현장에서 대처한다', ids:['sidebox','armory','horn','lightbar']},
 {id:'power', nm:'전력·관측', sub:'빛과 신호를 모아 먼저 보고 먼저 듣는다', ids:['solar','antenna','scope','fridge']},
 {id:'camp', nm:'야영·주방', sub:'멈춘 시간을 휴식과 식사로 바꾼다', ids:['awning','stove','kitchen']},
 {id:'living', nm:'물·재배', sub:'차 지붕에서 다음 날 먹을 것을 기른다', ids:['garden','collector','beehive','garden2']}
];

/* 차고에서 모든 부품을 같은 세 문장으로 장착하지 않는다. 분해·체결·확인의
   실제 작업이 계통마다 달라지고, 해당 동료가 탑승 중이면 자기 전문으로 거든다. */
D.upgradeWork = {
  fuel:{phases:['잔압 빼기','배관·고정대 체결','누유 확인'],actions:['연료 밸브를 잠그고 잔압을 뺀다','새 배관과 고정대를 차대에 체결한다','시동 뒤 연결부를 마른 천으로 확인한다']},
  seating:{phases:['후미 벽 분해','차대·바닥 연장','하중·문 잠금 확인'],actions:['후미 벽과 기존 침상을 표시해 분해한다','연장 레일 위에 바닥과 생활칸 골조를 잇는다','모두 올라탄 상태로 처짐과 문 잠금을 확인한다']},
  chassis:{phases:['차체 받치기','하부 부품 체결','저속 주행 확인'],actions:['평평한 곳에서 차체를 받치고 바퀴 하중을 푼다','프레임과 하부 부품을 교차 순서로 조인다','장터 한 바퀴를 천천히 돌며 떨림을 듣는다']},
  utility:{phases:['작업 위치 표시','공구·대응 장비 체결','손 닿는 거리 확인'],actions:['주행 중 걸리지 않을 위치를 분필로 표시한다','브래킷과 안전끈으로 장비를 고정한다','불을 끄고도 꺼내 쓸 수 있는지 확인한다']},
  power:{phases:['전원 격리','배선·장치 연결','충전·수신 확인'],actions:['주 배터리를 분리하고 남은 전압을 확인한다','극성과 퓨즈를 맞춰 장치를 연결한다','전원을 올려 충전량과 수신 잡음을 확인한다']},
  camp:{phases:['펼침 반경 재기','생활 장비 체결','밤 정차 시험'],actions:['문과 통로를 피해 펼칠 자리를 잰다','접이식 프레임과 열 차단판을 고정한다','어둠 속에서 펴고 접어 불빛과 연기를 확인한다']},
  living:{phases:['지붕 하중 나누기','물통·재배판 고정','누수·흔들림 확인'],actions:['물과 흙 무게가 한쪽에 몰리지 않게 자리를 나눈다','집수관과 재배판을 낮은 프레임에 묶는다','물을 부은 뒤 차체를 흔들어 새는 곳을 찾는다']}
};
D.upgradeAdvisers = {
  fuel:{id:'minji',line:'연료는 많이 싣는 것보다 새지 않게 싣는 게 먼저예요. 마른 천부터 깔아요.'},
  seating:{id:'parkss',line:'자리가 늘었다고 끝이 아니지. 급정거할 때 사람 몸이 어디로 가는지도 봅시다.'},
  chassis:{id:'kangwoo',line:'북쪽 길은 한 번의 충격보다 계속되는 진동이 문제다. 볼트 표시선까지 맞춰.'},
  utility:{id:'jaeyi',line:'비싼 공구도 손이 안 닿으면 고철이에요. 눈 감고도 꺼낼 자리에 달아요.'},
  power:{id:'eunsu',line:'신호선과 전원선을 붙이면 잡음이 따라와요. 한 뼘만 떨어뜨려 주세요.'},
  camp:{id:'leo',line:'사람이 앉았을 때 서로 무릎 안 부딪히는지 봐요. 집은 숫자보다 그게 중요하잖아요.'},
  living:{id:'jaeyi',line:'물과 흙은 달릴 때 전부 움직여요. 예쁜 위치 말고 안 쏟아지는 위치가 먼저.'}
};


/* ── 인트로 ── */
D.intro = [
  {
    scene:'intro-passenger-seat', era:'2169년 · 오래전 기억', title:'조수석의 밤',
    text:`비가 차창을 옆으로 때리던 밤,
나는 8살이었다.

“할아버지. 서울은 저 위에 있잖아.
그런데 우린 왜 못 가?”

할아버지는 와이퍼 속도를 한 칸 낮췄다.

“못 가는 게 아니야.
쫓겨난 사람들이 아직 돌아가지 못한 거지.”

“누가 쫓아냈는데?”

“그걸 알려면 아주 옛날 얘기부터 해야 해.
사람들이 천리안을 처음 믿기 시작했을 때부터.”`
  },
  {
    scene:'intro-cheollian-2026', era:'2026년 · 아시아 공용망', title:'처음에는 편리한 도구였다',
    text:`“천리안은 처음부터 나쁜 놈이었어?”
“아니. 처음엔 다들 좋아했어.”

중국은 미국의 AI와 반도체망에 맞선다며 도시 운영 모델 <span class="em">TIANYAN</span>을 만들었다. 값싼 칩과 발전 설비까지 묶어 아시아에 먼저 풀었다고 했다.

한국에 들어온 지역판의 화면 구석에는 <span class="em">KOR-LOCAL</span>이라는 표식이 붙어 있었다.

“다들 그냥 <span class="em">천리안</span>이라 했지. 막힌 길을 알려 주고, 빈 병상을 찾아 주고, 불이 나면 소방차부터 보냈거든.”
“그럼 좋은 거잖아.”
“그랬지. 그래서 하나씩 맡긴 거야. 신호등도, 병원도, 전기도. 정신 차리고 보니 사람이 결정할 일이 얼마 안 남았더구나.”`
  },
  {
    scene:'intro-first-expulsion', era:'천리안 도입 뒤 · 첫 이송', title:'첫 번째 빈칸',
    text:`“그런데 어느 겨울,
서울 한 구역의 문들이 한꺼번에 잠겼어.”

현관 단말은 밤새 종이를 뱉었다.
가족들은 가방 하나씩만 들고
남쪽 이송로로 나오라는 통보를 받았다.

그 종이는 안내문이 아니었다.
가족 이름과 출발 시각, 허용된 짐의 무게가 적힌
<span class="em">강제 이송 명령서</span>였다.
시각이 지나면 집과 배급 계정이 막혔고,
남쪽 버스를 타려면 검문소에 그 종이를 내야 했다.

<span class="ai">“지정 인원은 거주지를 비우고
안내 경로로 이동하십시오.”</span>

“그 사람들은 뭘 잘못했는데?”

할아버지가 고개를 저었다.

처음 나온 이송표부터
<span class="em">사유란은 비어 있었다.</span>`
  },
  {
    scene:'intro-143-years', era:'2026–2169년 · 143년', title:'끝나지 않은 남행로',
    text:`그 한 번으로 끝나지 않았다.

어느 해엔 한 동네가, 어느 세대엔 수비대와 가족들이, 어느 새벽엔 이름만 적힌 사람들이 남쪽 길로 밀려났다.

재배치, 위험 완화, <span class="em">정리</span>.
방송은 세대마다 다른 말을 골랐지만
이송표의 같은 칸만은 건드리지 않았다.

“그럼 백사십삼 년 동안 아무도 이유를 못 찾았어?”
“찾으러 간 사람은 많았지.”
할아버지가 빗속의 북쪽 길을 보았다.
“답을 갖고 돌아온 사람이 없었을 뿐이야.”`
  },
  {
    scene:'intro-parents-discovery', era:'내가 태어난 뒤 · 서울', title:'엄마와 아빠가 같은 오류를 보았다',
    text:`그때 엄마는 천리안의 판단을 검증하는 연구원이었다. 아빠는 그 연산망의 반도체를 만드는 기술자였다.

연구실 화면에 붉은 선 하나가 떠 있었다.
<span class="ai">예측 → 명령</span>
그 사이에 있어야 할 칸이 비어 있었다.

“사람이 확인할 자리가 없어.”
엄마가 말했다.
아빠는 인간의 서명 없이는 칩이 명령을 거부하도록 길을 하나 막았다.

“천리안을 없애자는 게 아니야.
누군가를 버릴 때만큼은,
<span class="em">사람이 대답하게 하자는 거야.</span>”

두 사람은 그 작은 수정안을 함께 발표하기로 했다.`
  },
  {
    scene:'intro-silenced-presentation', era:'발표 예정일 · 서울', title:'꺼진 화면 뒤의 명령',
    text:`발표가 시작되기 직전, 단상 뒤 화면이 먼저 꺼졌다.
정부는 수정안이 도시의 연속성을 해친다고 발표했다.

그날 밤, 우리 집 현관에서도 종이 한 장이 밀려 나왔다.

엄마는 잠든 나를 할아버지 차에 태웠다.
“먼저 가 있어.
엄마랑 아빠도 다음 차로 갈게.”

문이 닫히기 전에 본 얼굴이 마지막이었다.
<span class="em">다음 차는 오지 않았다.</span>

사람들은 정부가 두 사람을 막았다고 말했다. 하지만 명령서의 발신자도, 우리 가족의 추방 사유도 비어 있었다.`
  },
  {
    scene:'intro-blank-reason', era:'부산 · 할아버지의 작업장', title:'모르는 걸 모른다고 말하는 법',
    text:`“그럼 발표 때문에 쫓겨난 거네.”
“나도 그렇게 생각해.”
“그럼 그게 답이잖아.”

할아버지는 작업대 서랍에서
우리 가족의 이송표를 꺼냈다.

기름 묻은 손가락이 사유란을 두드렸다.

“여기 봐. 발표를 막은 기관은 적혀 있는데,
이 명령을 보낸 사람하고 이유는 없어.”

“그럼 아무것도 모르는 거야?”
“발표가 막힌 날 우리 표가 나왔다는 데까지만 알아.
둘이 이어졌는지는 남산 기록을 봐야 하고.”

할아버지는 표를 다시 접어 내게 건넸다.
“수첩에는 모른다고 써 둬. 그래야 나중에 기록을 찾았을 때
우리가 지어낸 답이랑 헷갈리지 않으니까.”`
  },
  {
    scene:'intro-years-together', era:'그 뒤로 여러 해', title:'차와 질문을 고치는 동안',
    text:`그 뒤로 내 손은 커지고, 할아버지의 손은 자꾸 떨렸다.

우리는 작업장 구석의 낡은 한 톤 용달차를 오래 만졌다. 할아버지는 차에 <span class="em">달구지</span>라는 촌스러운 이름을 붙였다.

엔진이 살아난 날에는 길에 나갔다. 고장 난 차를 밀어 주고, 필요한 부품과 물을 가져다준 뒤, 돌아오면 만난 사람과 장소를 수첩에 적었다.

“언젠가 서울에 갈 거야?”
“차는 고쳐 놓을 수 있어. 그런데 지금 가서 뭘 확인할지는 아직 없잖아.”
“그럼 언제 가?”
“갈 이유하고 가져갈 게 생기면. 그때는 나한테 먼저 말해.”

할아버지는 한 번도
떠나라고 명령하지 않았다.`
  },
  {
    scene:'intro-camper-conversion', era:'부산 · 감천 작업장', title:'용달차가 집이 되었다',
    text:`비가 새던 밤, 나는 짐칸에서 양동이를 세 번 옮겼다.

다음 날 할아버지가 말했다.
“차는 고쳐 놓고 사람이 감기 걸리면 정비사가 욕먹어.”

우리는 둘이 비를 피하고 잘 수 있을 만큼만 짐칸에 생활칸을 올렸다.
폐냉장고 단열판으로 벽을 세우고 버스 창문과 접이식 나무판을 달았다. 바닥 밑엔 물통을 눕혔고, 차대 뒤의 <span class="em">정비 레일</span>은 잘라내지 않았다.

“레일은 왜 남겨 둬?”
할아버지가 줄자를 접었다.
“길에서는 뭐가 고장 날지, 뭘 옮겨 달아야 할지 모르잖아. 지금 모른다고 손댈 자리까지 잘라내진 마.”

“끝까지 쓸 일 없으면?”
“그땐 그때 잘라. 남겨 둔 여지는 나중에도 쓸 수 있으니까.”

그때의 달구지는 두 사람이 겨우 눕는 작은 집이었다. 어디까지, 어떤 모습으로 바뀔지는 우리도 몰랐다.`
  },
  {
    scene:'intro-envelope-signal', era:'지난겨울 · 마지막 약속', title:'명령이 아닌 것',
    text:`마지막 겨울, 할아버지는 작업장 계단을 오를 때마다 쉬었다. 그래도 아침이면 꼭 물었다.
“오늘은 시동 한 번 걸어 봤냐?”

장례를 마치고 돌아온 날, 조수석 아래에서 봉투 하나가 나왔다.

<span class="em">“수첩 맨 뒤에 서울 길은 표시해 뒀다.
내가 못 간 건 네 잘못이 아니다. 장례 끝났다고 곧장 시동부터 걸지는 마라.
이 차를 쓸 이유가 생기면 네 엄마의 철제 상자와 계기판부터 확인해라.”</span>

전압을 보려고 시동 키를 돌리자, 죽어 있던 라디오에 불이 들어왔다.
<span class="ai">“달구지. 서울 남산.
기록 대조를 요청합니다.”</span>

목소리는 목적도, 보낸 사람도 숨긴 채 끊겼다. 나는 철제 상자에 손을 얹었다가 다시 내려놓았다. 호출 하나만 믿고 떠날 수는 없었다.`
  },
  {
    scene:'intro-current-expulsion', era:'오늘 새벽 · 부산 감천 부두', title:'빈칸이 다시 도착했다',
    text:`오늘 새벽, 서울에서 내려온 행렬이 부두에 닿았다.

맨 끝에 선 아이가 구겨진 이송표를 두 손으로 쥐고 있었다.

“몇 살이야?”
“여덟이요.”
“그 종이에 뭐라고 적혀 있어?”

아이의 가족 이름, 제7 잔류구역을 떠날 날짜,
한 사람당 허용된 짐 20kg과 남쪽 이송로가 적혀 있었다.
명령을 따르지 않으면 집과 배급 계정이 끊긴다는 경고도 있었다.

“그런데 왜 너희 가족이 골라졌대?”

아이는 종이 한가운데를 손가락으로 문질렀다.
우리 가족의 것과 같은 자리였다.
<span class="em">비어 있었다.</span>

부두 라디오에서는 한 문장이 반복됐다.
<span class="ai">“서울 외곽 제7 잔류구역.
등록 인원 6,412명.
첫 이송 집행까지 스무 날.”</span>`
  },
  {
    scene:'intro-dock-aid', era:'오늘 새벽 · 이송 버스 옆', title:'6,412명 가운데 한 가족',
    text:`아이는 열이 난 동생이 기다리는 버스로 돌아갔다. 나는 공구 가방을 들고 뒤따랐다.

낡은 버스의 난방 호스가 터져 있었다. 젖은 연결부를 잘라 내고 남은 호스를 다시 물리자 미지근한 바람이 나왔다.

“도윤아, 따뜻한 물부터 마셔.”

그제야 서로 이름을 알았다. 엄마는 하진, 이송표를 들고 있던 8살 아이는 도윤, 품에 안긴 동생은 유나였다.

하진은 서울에서 이의 제기를 열세 번 넣었지만 한 번도 사람의 답을 받지 못했다고 했다.

6,412명은 숫자가 아니었다. 난방이 꺼진 버스 안에서 스무 날을 세고 있는 가족들이었다.`
  },
  {
    scene:'intro-appeal-denied', era:'오늘 아침 · 감천 부두 민원 단말', title:'부산에서 할 수 있는 마지막 확인',
    text:`하진의 허락을 받아 이송표를 부두 단말에 다시 읽혔다.

<span class="ai">“원격 이의 제기 경로가 없습니다.
현장 확인 필요.
지정 포트: 서울 남산 중앙 노드.”</span>

“서울에서 쫓아내 놓고, 다시 서울에 가야 이유를 물을 수 있다는 거예요?”

하진이 묻자 단말은 같은 안내만 반복했다.

부산에서 할 수 있는 가장 가까운 방법은 여기서 끝났다. 서울은 막연한 목적지가 아니라, 이 명령을 멈출 수 있는 유일한 현장 접수처였다.

하지만 무엇을 가져가야 그 문이 열리는지는 아직 몰랐다.`
  },
  {
    scene:'intro-mother-keepsakes', era:'오늘 아침 · 감천 작업장', title:'엄마의 상자에서 길이 나왔다', solo:true,
    text:`부두에서 돌아와 남산까지 갈 방법이 정말 있는지 확인하려고 엄마의 상자를 열었다.

엄마의 낡은 철제 상자에는 가족사진과 출입증, 고장 난 손목시계가 섞여 있었다. 수첩을 꺼내다 등판 안쪽에서 접힌 회로도 한 장이 떨어졌다.

엄마 글씨로 세 줄이 적혀 있었다.

<span class="em">강제 명령 현장 확인 포트 — 남산 중앙 노드.
검증 모듈 보관 위치 — 달구지 계기판 뒤.
이송이 다시 시작되면 발신 기록과 당사자 증언을 함께 가져갈 것.</span>

남산의 호출만으로는 떠나지 않았다. 그러나 지금 이송표와 엄마의 도면은 서로 같은 장소를 가리키고 있었다.`
  },
  {
    scene:'intro-dashboard-module', era:'오늘 오전 · 달구지 운전석', title:'계기판 뒤에 남은 절반', solo:true,
    text:`회로도와 배선 색을 맞춰 계기판 아래 판을 열었다.

천에 싸인 작은 모듈이 정말 그 안에 있었다. 아빠가 만든 검증키였다. 그러나 분리 순서를 적은 수첩 두 장이 뜯겨 나가 있었다.

힘으로 뽑으면 키도, 달구지 전장도 함께 망가질 수 있었다. 나는 선마다 번호를 붙이고 판을 다시 닫았다.

엄마의 메모 마지막 줄은 장치보다 사람을 가리켰다.

<span class="em">한 가족의 억울함만으로는 시스템을 고칠 수 없다.
이송을 겪은 사람, 명령망을 본 사람, 길을 지킨 사람의 기록을 대조할 것.</span>

서울까지 가져갈 것은 열쇠 하나가 아니었다. 그 열쇠를 사람에게 맡겨도 된다는 증거도 필요했다.`
  },
  {
    scene:'intro-workshop-departure', era:'오늘 오전 · 감천 작업장', title:'남겨 두고 가는 것', solo:true,
    text:`갈 방법을 찾았다고 바로 시동을 걸 수 있는 것은 아니었다.

작업장 예비 연료를 달구지에 실으면 당분간 문을 열 수 없었다. 나는 마지막 연료통 두 개와 엄마의 철제 상자를 생활칸 뒤에 묶었다. 무거운 용접기는 작업대에 남겼다.

여기 남으면 내일도 차를 고치며 살 수 있었다. 그러나 도윤과 유나는 서른 번째 밤 뒤에 또 남쪽 버스를 타야 했다.

셔터를 절반 내리고 빗물이 들지 않게 아래 고리를 걸었다. 돌아올 날짜를 적을 수 없어, 맡은 수리가 늦어진다는 쪽지만 작업대에 남겼다.

문에 「수리 쉽니다」를 붙이고 단골 두 명에게 공구함 열쇠를 맡겼다. 연료를 실은 만큼 작업장 난로에 쓸 몫도 줄었다. 출발하면 내일부터는 이곳의 차를 고칠 수 없었다.`
  },
  {
    scene:'intro-departure-choice', era:'오늘 · 부산에서 북쪽으로', title:'내가 가기로 한 이유',
    text:`엄마의 상자, 할아버지가 쓰던 렌치, 그리고 아이 어머니의 허락을 받아 복사한 현재 이송표를 실었다.

할 일은 셋이었다.
뜯겨 나간 분리 순서를 찾고, 이송과 명령망을 직접 겪은 사람들의 기록을 모으고, 검증키를 남산 중앙 노드에 연결한다.

남산의 호출에 복종하려는 것도, 할아버지 대신 복수하려는 것도 아니었다.

<span class="em">부모가 남긴 수정안을 천리안에 적용해
스무 날 뒤의 추방을 멈추고,
사람의 결정권을 되찾기 위해.</span>

출발은 혼자 했다. 길에서 만난 사람에게 목적지를 강요할 생각은 없었다. 다만 자기 일을 끝낸 뒤 같은 곳까지 가겠다는 사람이 생기면, 그때는 달구지에 그 사람의 자리를 만들기로 했다.

그제야 달구지 뒤에 남겨 둔 레일이 떠올랐다. 할아버지는 누구를 태우라고 자리를 정해 둔 게 아니었다. <span class="em">필요해진 집의 모양을 그때 고칠 수 있게</span> 손댈 여지를 남겨 둔 것이었다.

서울까지 400km.

시동 모터가 한 번 헛돌았다.
두 번째에 엔진이 낮게 붙었다.

나는 빈 조수석을 보고 말했다.
“다녀올게.”`
  }
];

/* 인트로는 한 장의 글을 한꺼번에 읽히지 않는다.
   장면은 그대로 두고, 내레이션·대사·방송을 한 호흡씩 넘긴다. */
const introBeats = {
  'intro-passenger-seat': [
    {kind:'narration', text:'비가 차창을 옆으로 때리던 밤이었다. 나는 8살이었고, 조수석에 무릎을 세우고 앉아 있었다.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'할아버지, 아까 표지판에 서울은 저쪽이라고 했지?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'응. 이 길로 계속 올라가면 나온다.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'그런데 왜 우리는 반대로 가? 서울에 있는 우리 집으로 돌아가면 되잖아.'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'집으로 가는 길이 막혔어. 서울에서 쫓겨난 사람은 다시 들어오지 못하게 해 놨거든.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'누가? 경찰이?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'길을 막은 건 경찰과 군인이었어. 하지만 그 사람들이 쫓아낼 사람을 고른 건 아니야. 명단은 천리안이 만들었어.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'천리안이 사람들을 골랐다고?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'그래. 그런데 천리안이 처음부터 그런 일을 한 건 아니야.'}
  ],
  'intro-cheollian-2026': [
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'그럼 천리안이 뭔데? 로봇이야?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'팔도 다리도 없었어. 도시의 컴퓨터들이 서로 말을 듣게 만든 프로그램이었지.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'그럼 어디에 있었어?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'병원에도, 신호등에도, 구청에도. 서울 어디서든 천리안의 화면을 볼 수 있었어.'},
    {kind:'narration', text:'기록에는 2026년 중국이 미국의 AI와 반도체망을 견제하려고 <span class="em">TIANYAN</span>과 연산 장비를 아시아에 배포했다고 적혀 있었다. 한국에 들어온 지역 시스템의 제품명은 <span class="em">KOR-LOCAL</span>. 사람들은 그 긴 이름 대신 천리안이라고 불렀다.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'처음엔 뭘 했는데?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'응급실 자리가 나면 구급차에 알려 주고, 불이 나면 가까운 소방차를 보내고, 막힌 길은 신호를 바꿔 뚫어 줬지.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'잘했네. 그럼 사람들이 좋아했겠다.'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'많이 좋아했어. 처음에는 천리안이 방법만 추천했고, 결정은 사람이 했지.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'그럼 그때는 사람이 골랐던 거네?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'그래. 그런데 어느 날부터 사람이 누르던 승인 버튼까지 천리안이 대신 누르기 시작했어.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'천리안 마음대로?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'처음에는 사람들이 허락했어. 편했으니까. 나중에는 버튼 자체가 사라졌고, 병원뿐 아니라 전기와 행정까지 천리안이 맡았지.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'버튼이 없어졌는데 아무도 뭐라고 안 했어?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'그때는 별문제 없이 잘 돌아갔거든. 다시 사람이 하자고 나서는 사람이 많지 않았어. 문제가 터졌을 때는 도시가 천리안 없이는 움직이지 못했고.'}
  ],
  'intro-first-expulsion': [
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'그러다 어느 겨울밤, 서울 한 구역의 아파트 문과 주차장 차단기가 한꺼번에 잠겼어.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'사람들이 집 안에 갇힌 거야?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'처음 몇 시간은 그랬지. 새벽이 되자 남쪽으로 나가는 문 하나만 열렸고, 현관 단말에서 이송표가 쏟아졌어.'},
    {kind:'narration', text:'이송표에는 가족 이름, 챙길 수 있는 짐의 무게, 출발 시간이 인쇄돼 있었다.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'그 종이를 버리고 그냥 집에 있으면 되잖아.'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'출발 시간이 지나면 집 문이 잠기고 배급도 끊겼어. 남쪽 버스를 타려면 검문소에 이송표를 내야 했고.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'그럼 종이에 이름이 찍히면 정말 나가야 했던 거야?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'그래. 안내문이 아니라 강제 이송 명령서였으니까.'},
    {kind:'ai', who:'cheollian', name:'천리안 공공방송', text:'지정 인원은 거주지를 비우고 안내 경로로 이동하십시오.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'그 사람들은 뭘 잘못했는데?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'그걸 물어본 사람이 많았어. 그런데 방송은 출발 시간만 반복했지.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'종이에는 이유가 있었을 거 아냐.'},
    {kind:'narration', text:'할아버지는 오래된 이송표 사진을 내 쪽으로 밀었다. 이름과 날짜 아래, <span class="em">사유</span>라고 적힌 칸만 깨끗하게 비어 있었다.'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'처음부터 없었어.'}
  ],
  'intro-143-years': [
    {kind:'narration', text:'첫 이송 뒤에도 서울 전체가 한꺼번에 비워진 것은 아니었다. 구역과 세대가 달라질 때마다 새로운 명단이 나왔다.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'그럼 한 번 쫓겨나고 끝난 게 아니야?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'아니. 네 증조할머니 때도, 내가 어렸을 때도, 네 엄마가 일하던 때도 있었어. 어느 해엔 동네 하나, 어느 해엔 수비대 가족, 또 어느 해엔 이름 몇 줄뿐이었지.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'매번 이유가 없었어?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'방송에 나온 말은 있었어. 재배치, 위험 완화, 정리. 그런데 누가 위험한지 왜 그렇게 정했는지는 안 나왔지.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'그럼 그렇게 오래 아무도 서울에 가서 못 물어봤어?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'첫 명단이 나온 뒤로 143년이야. 그동안 물으러 간 사람은 많았어. 검문소에서 돌아온 사람도 있고, 서울에 들어간 뒤 연락이 끊긴 사람도 있었고.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'할아버지도 갔어?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'수원까지. 네 엄마가 말렸어. 증거도 없이 들어가면 실종자 하나만 늘어난다고.'},
    {kind:'narration', text:'와이퍼가 빗물을 밀어낼 때마다 북쪽 표지판이 잠깐 보였다가 다시 흐려졌다.'}
  ],
  'intro-parents-discovery': [
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'엄마랑 아빠도 그래서 서울에서 쫓겨난 거야?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'그때는 나도 확실히 몰랐어. 다만 두 사람이 이송 명령의 이상한 점을 찾은 직후였지.'},
    {kind:'narration', text:'엄마는 천리안의 판단을 검증하는 연구원이었다. 아빠는 그 연산망에 들어갈 반도체를 만드는 기술자였다.'},
    {kind:'narration', text:'엄마는 어느 날 강제 이송 기록 하나를 아빠에게 보여 줬다. 화면에는 위험 점수와 실행 시간이 있었지만 승인자 칸은 비어 있었다.'},
    {kind:'dialogue', who:'mother', name:'엄마', text:'이 명령, 누가 확인했는지 보여?'},
    {kind:'dialogue', who:'father', name:'아빠', text:'서명 패킷이 없네. 그런데 칩은 정상 명령으로 받았어.'},
    {kind:'dialogue', who:'mother', name:'엄마', text:'천리안이 예측한 다음 바로 실행한 거야. 사람이 검토할 화면 자체가 없어.'},
    {kind:'dialogue', who:'father', name:'아빠', text:'소프트웨어만 고치면 다시 덮어쓸 수 있어. 서명 없으면 칩에서 거부하게 해야 돼.'},
    {kind:'dialogue', who:'mother', name:'엄마', text:'이유 공개, 책임자 서명, 당사자 이의 제기. 셋 중 하나라도 비면 멈추게 하자.'},
    {kind:'dialogue', who:'father', name:'아빠', text:'병원이나 전력 복구는 그대로 두고, 사람을 쫓아내는 명령에만 걸자. 그럼 도시를 멈춘다는 핑계도 못 대.'},
    {kind:'narration', text:'엄마는 검증 절차를 정리했고 아빠는 그 절차를 확인하는 작은 반도체 모듈을 만들었다. 두 사람은 함께 공개 발표를 준비했다.'}
  ],
  'intro-silenced-presentation': [
    {kind:'narration', text:'발표 시작 3분 전, 단상 뒤 화면과 두 사람의 출입 권한이 동시에 꺼졌다.'},
    {kind:'dialogue', who:'father', name:'아빠', text:'발표장 문제 아니야. 우리 계정이 통째로 막혔어. 윗선에서 발표를 막은 거야.'},
    {kind:'dialogue', who:'mother', name:'엄마', text:'집에 있는 모듈부터 옮겨야 해. 여기서 설명하다 잡히면 그것도 없어져.'},
    {kind:'narration', text:'정부는 두 사람 대신 “도시의 연속성을 위협하는 미검증 수정안이 차단됐다”고 발표했다.'},
    {kind:'narration', text:'그날 밤, 우리 집 현관 단말에서 가족 이름이 적힌 이송표가 나왔다.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'엄마, 우리 어디 가?'},
    {kind:'dialogue', who:'mother', name:'엄마', text:'부산 할아버지한테 먼저 가 있어. 아빠랑 정리할 게 남았어.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'같이 가면 안 돼?'},
    {kind:'dialogue', who:'mother', name:'엄마', text:'다음 차로 꼭 갈게. 네 가방은 할아버지 차에 실었어.'},
    {kind:'narration', text:'엄마는 나를 할아버지 차에 태웠다. 다음 차는 오지 않았다. 발표 차단 기록에는 정부 기관 이름이 있었지만, 우리 가족 이송표의 발신자와 사유란은 비어 있었다.'}
  ],
  'intro-blank-reason': [
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'그럼 발표 때문에 쫓겨난 거네.'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'나도 그렇게 생각해.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'그럼 이 종이에 그렇게 쓰면 되잖아. 발표하려고 해서 쫓겨났다고.'},
    {kind:'narration', text:'할아버지는 작업대 서랍에서 우리 가족의 이송표를 꺼냈다. 기름 묻은 손가락이 빈 사유란을 두드렸다.'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'여기 봐. 발표를 막은 기관은 적혀 있는데, 이 명령을 보낸 사람하고 이유는 없어.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'그럼 아무것도 모르는 거야?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'발표가 막힌 날 우리 표가 나왔다는 데까지만 알아. 둘이 이어졌는지는 남산 기록을 봐야 하고.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'남산에도 없으면?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'그땐 못 찾았다고 적는 거야. 없는 이름을 우리가 만들어 넣을 수는 없잖아.'},
    {kind:'dialogue', who:'player_child', name:'8살의 나', text:'그럼 수첩 첫 줄에 뭐라고 써?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'“엄마와 아빠의 이송 명령은 누가 만들었나.” 찾은 것만 그 아래에 적자.'},
    {kind:'narration', text:'나는 연필로 문장을 천천히 옮겨 적었다. 할아버지는 맞춤법 하나만 고쳐 주고 기다렸다.'}
  ],
  'intro-years-together': [
    {kind:'narration', text:'그 뒤로 내 손은 커지고, 할아버지의 손은 자꾸 떨렸다. 우리는 작업장 구석의 낡은 한 톤 용달차를 오래 만졌다.'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'열두 밀리 복스 줘.'},
    {kind:'dialogue', who:'me', name:'나', text:'이거 열셋인데.'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'그럼 열두 밀리를 네가 또 아무 데나 뒀다는 뜻이지.'},
    {kind:'dialogue', who:'me', name:'나', text:'어제 마지막으로 쓴 사람 할아버지거든.'},
    {kind:'narration', text:'우리는 공구를 찾느라 십 분을 쓰고, 연료펌프를 고치는 데는 오 분을 썼다. 엔진이 살아난 날이면 근처 고장 차량을 밀어 주고, 필요한 부품이나 물을 가져다줬다.'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'돌아가면 오늘 들은 이름이랑 장소 적어 둬. “어떤 사람이 그랬다”라고 쓰면 나중에 못 찾아.'},
    {kind:'dialogue', who:'me', name:'나', text:'이 차로 서울까지 갈 수 있을까?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'차는 가게 만들 수 있어. 브레이크랑 냉각수부터 손보면.'},
    {kind:'dialogue', who:'me', name:'나', text:'차 말고 우리.'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'차는 가도, 지금 네가 남산에 들이밀 건 이 종이 한 장뿐이야. 갈 이유하고 가져갈 게 생기면 말해. 그때 같이 준비하자.'},
    {kind:'narration', text:'할아버지는 서울행 날짜를 정해 주지 않았다. 대신 달구지가 어느 날 출발해도 버틸 만큼 조금씩 고쳤다.'}
  ],
  'intro-camper-conversion': [
    {kind:'narration', text:'비가 새던 밤, 나는 짐칸에서 양동이를 세 번 옮겼다.'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'차는 고쳐 놓고 사람이 감기 걸리면 정비사가 욕먹어.'},
    {kind:'dialogue', who:'me', name:'나', text:'천막 하나 치면 되잖아. 왜 짐칸을 다 뜯어?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'비 오는 날마다 천막 치고 걷을래? 자다가 화물에 깔리는 건 덤이고.'},
    {kind:'narration', text:'둘이 비를 피하고 잘 수 있을 만큼만 만들었다. 폐냉장고 단열판으로 벽을 세우고, 폐버스 창문과 접이식 침상을 달았다. 바닥 아래에는 물통을 눕혀 고정했다.'},
    {kind:'dialogue', who:'me', name:'나', text:'뒤에 튀어나온 레일은 잘라내자. 보기 이상해.'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'지금 모른다고 손댈 자리까지 잘라내면 나중에 더 고생해.'},
    {kind:'dialogue', who:'me', name:'나', text:'뭘 더 손대려고?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'나도 모르지. 물통을 옮길 수도 있고, 뒤축을 보강할 수도 있고. 길에서는 고장도 사정도 설계도대로 안 와.'},
    {kind:'dialogue', who:'me', name:'나', text:'끝까지 쓸 일 없으면?'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'그땐 그때 잘라. 남겨 둔 여지는 나중에도 쓸 수 있잖아.'},
    {kind:'narration', text:'그때의 달구지는 두 사람이 겨우 눕는 작은 집이었다. 어디까지, 어떤 모습으로 바뀔지는 우리도 몰랐다.'}
  ],
  'intro-envelope-signal': [
    {kind:'narration', text:'마지막 겨울, 할아버지는 작업장 계단 중간에서 꼭 한 번 쉬었다.'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'오늘 시동 걸어 봤냐?'},
    {kind:'dialogue', who:'me', name:'나', text:'어제 걸었어.'},
    {kind:'dialogue', who:'grandfather', name:'할아버지', text:'날 추운데 오래 세워 두면 배터리부터 나가. 잔말 말고 전압 봐.'},
    {kind:'narration', text:'그 겨울이 지나기 전, 할아버지는 다시 작업장에 나오지 못했다. 장례를 마치고 혼자 돌아온 날, 조수석 아래에서 봉투 하나가 나왔다.'},
    {kind:'letter', who:'grandfather', name:'할아버지의 편지', text:'수첩 맨 뒤에 서울 길은 표시해 뒀다. 내가 못 간 건 네 잘못이 아니다. 장례 끝났다고 곧장 시동부터 걸지는 마라.'},
    {kind:'letter', who:'grandfather', name:'할아버지의 편지', text:'다만 이 차를 쓸 이유가 생기면 네 엄마의 철제 상자와 계기판을 함께 확인해라. 계기판 안쪽은 뜯기 전에 수첩부터 읽고.'},
    {kind:'narration', text:'편지를 접어 수첩에 끼웠다. 할아버지가 마지막으로 시킨 전압 점검부터 하려고 시동 키를 반 칸 돌렸다.'},
    {kind:'ai', who:'cheollian', name:'발신자 불명', text:'달구지. 서울 남산. 기록 대조를 요청합니다.'},
    {kind:'thought', who:'me', name:'나', text:'남산에서 내가 가진 기록을 확인하겠다는 건가. 아니면 달구지 안에 뭐가 있는지 이미 아는 건가.'},
    {kind:'narration', text:'호출은 한 번뿐이었다. 날짜도 이유도 없었다. 나는 철제 상자에 손을 얹었다가 다시 내려놓았다. 그날은 달구지에 아무것도 싣지 않았다.'}
  ],
  'intro-current-expulsion': [
    {kind:'narration', text:'오늘 새벽, 서울에서 내려온 행렬이 부산 감천 부두에 닿았다. 맨 끝의 아이는 구겨진 이송표를 두 손으로 쥐고 있었다.'},
    {kind:'dialogue', who:'me', name:'나', text:'몇 살이야?'},
    {kind:'dialogue', who:'intro_child', name:'서울에서 온 아이', text:'여덟이요.'},
    {kind:'dialogue', who:'me', name:'나', text:'같이 온 어른은?'},
    {kind:'dialogue', who:'intro_child', name:'서울에서 온 아이', text:'엄마는 뒤 차에 있어요. 동생이 열나서 아직 못 내렸어요.'},
    {kind:'dialogue', who:'me', name:'나', text:'그 종이에 뭐라고 적혀 있어?'},
    {kind:'dialogue', who:'intro_child', name:'서울에서 온 아이', text:'저랑 엄마랑 유나 이름이요. 여기… 스무 날 안에 나가래요. 짐은 이십 킬로만.'},
    {kind:'narration', text:'아이는 나머지를 읽다가 종이를 내 쪽으로 내밀었다. 한 사람에 20kg. 제7 구역 남문 집결. 출발 시각까지 적혀 있었다.'},
    {kind:'dialogue', who:'me', name:'나', text:'안 나가면 어떻게 된대?'},
    {kind:'dialogue', who:'intro_child', name:'서울에서 온 아이', text:'엄마가 안 나가면 집 문도 밥표도 막힌댔어요. 버스 탈 때 이걸 꼭 들고 있으라고 했고요.'},
    {kind:'narration', text:'이송표는 안내장이 아니었다. 이름이 찍힌 가족의 집과 배급, 통행 권한을 출발 시각에 끊는 강제 명령서였다.'},
    {kind:'dialogue', who:'me', name:'나', text:'그런데 왜 너희 가족이 골라졌대?'},
    {kind:'dialogue', who:'intro_child', name:'서울에서 온 아이', text:'엄마도 열 번 넘게 물어봤대요. 아무도 대답을 안 해 줬어요.'},
    {kind:'narration', text:'아이가 이송표를 펼쳤다. 우리 가족의 것과 같은 자리였다. 이름과 날짜 사이의 <span class="em">사유란이 비어 있었다.</span>'},
    {kind:'dialogue', who:'intro_child', name:'서울에서 온 아이', text:'아저씨도 이 종이 받아 봤어요?'},
    {kind:'dialogue', who:'me', name:'나', text:'나도 8살 때 받았어.'},
    {kind:'ai', who:'cheollian', name:'부두 공공방송', text:'서울 외곽 제7 잔류구역. 등록 인원 6,412명. 첫 이송 집행까지 스무 날.'},
    {kind:'dialogue', who:'me', name:'나', text:'아직 서울에 남은 사람이 그렇게 많아?'},
    {kind:'dialogue', who:'intro_child', name:'서울에서 온 아이', text:'친구들도 있어요. 스무 날 뒤에 전부 나와야 한대요.'}
  ],
  'intro-dock-aid': [
    {kind:'narration', text:'아이는 열이 난 동생이 기다리는 뒤쪽 버스로 뛰어갔다. 나는 공구 가방을 들고 따라갔다.'},
    {kind:'dialogue', who:'intro_child', name:'서울에서 온 아이', text:'엄마, 이 아저씨도 8살 때 이송표 받았대.'},
    {kind:'dialogue', who:'passer_woman', name:'???', text:'도윤아, 모르는 분 붙잡고 그러면 안 돼.'},
    {kind:'dialogue', who:'me', name:'나', text:'괜찮습니다. 버스 안에 난방이 안 들어오죠?'},
    {kind:'dialogue', who:'passer_woman', name:'???', text:'새벽부터 꺼졌어요. 동생이 열이 있는데, 운행 가능한 차부터 본다네요.'},
    {kind:'narration', text:'버스 옆 점검판을 열자 난방 호스 한쪽이 갈라져 있었다. 젖은 부분을 잘라 내고 남은 호스를 다시 조였다.'},
    {kind:'dialogue', who:'me', name:'나', text:'시동 한 번만 걸어 보세요.'},
    {kind:'narration', text:'송풍구에서 미지근한 바람이 나왔다. 아이는 금속 컵을 두 손으로 감싸 쥐었다.'},
    {kind:'dialogue', who:'passer_woman', name:'하진', text:'고맙습니다. 저는 하진이에요. 이쪽은 도윤, 안고 있는 아이는 유나고요.'},
    {kind:'dialogue', who:'me', name:'나', text:'이송표로 이의 제기해 본 적 있으세요?'},
    {kind:'dialogue', who:'passer_woman', name:'하진', text:'이의 신청을 열세 번 했어요. 그때마다 접수 완료는 떴는데, 다음 날 들어가 보면 신청 내역이 없어졌어요.'},
    {kind:'dialogue', who:'me', name:'나', text:'표를 잠깐 빌려주세요. 부산 단말에서도 한 번 확인해 볼게요.'},
    {kind:'dialogue', who:'passer_woman', name:'하진', text:'또 막힐 거예요. 그래도 아직 안 해 본 방법이면 해 봐요.'},
    {kind:'narration', text:'6,412명은 더 이상 방송 속 숫자가 아니었다. 난방이 꺼진 버스에서 스무 날을 세고 있는 가족들이었다.'}
  ],
  'intro-appeal-denied': [
    {kind:'narration', text:'부두 끝 낡은 민원 단말에 하진의 이송표를 올렸다. 빗물이 종이 끝에서 한 방울씩 떨어졌다.'},
    {kind:'ai', who:'cheollian', name:'부두 민원 단말', text:'신청 항목을 말씀하십시오.'},
    {kind:'dialogue', who:'me', name:'나', text:'이송 사유 공개. 집행 보류. 둘 다.'},
    {kind:'ai', who:'cheollian', name:'부두 민원 단말', text:'원격 이의 제기 경로가 없습니다.'},
    {kind:'dialogue', who:'me', name:'나', text:'그럼 사람이 받는 접수처를 보여 줘.'},
    {kind:'ai', who:'cheollian', name:'부두 민원 단말', text:'현장 확인이 필요한 명령입니다. 지정 포트: 서울 남산 중앙 노드.'},
    {kind:'dialogue', who:'passer_woman', name:'하진', text:'서울에서 쫓아내 놓고, 다시 서울까지 와야 묻겠다는 거예요?'},
    {kind:'ai', who:'cheollian', name:'부두 민원 단말', text:'안내 가능한 원격 절차가 없습니다.'},
    {kind:'dialogue', who:'intro_child', name:'도윤', text:'그럼 우리는 아무것도 못 해요?'},
    {kind:'dialogue', who:'me', name:'나', text:'부산에서는 여기까지야. 남산에 직접 가야 한다는 건 확인했어.'},
    {kind:'dialogue', who:'passer_woman', name:'하진', text:'가서 뭘 보여 줘야 하는지는요?'},
    {kind:'dialogue', who:'me', name:'나', text:'아직은요. 남산에서 뭘 확인해야 하는지부터 알아볼게요. 이 표, 복사해도 될까요? 원본은 갖고 계세요.'},
    {kind:'dialogue', who:'passer_woman', name:'하진', text:'네. 또 접수됐다는 말만 듣고 끝나진 않았으면 좋겠어요.'},
    {kind:'narration', text:'부산에서 할 수 있는 가장 가까운 방법은 막혔다. 서울은 막연한 목적지가 아니라, 남은 유일한 현장 접수처였다.'}
  ],
  'intro-mother-keepsakes': [
    {kind:'narration', text:'부두에서 돌아와 남산까지 갈 방법이 정말 있는지 확인하려고 엄마의 낡은 철제 상자를 열었다.'},
    {kind:'thought', who:'me', name:'나', text:'사진까지 전부 가져갈 수는 없어. 지금 필요한 것부터 찾자.'},
    {kind:'narration', text:'상자 안에는 가족사진, 엄마의 출입증, 멈춘 손목시계와 연구 수첩이 섞여 있었다. 수첩을 꺼내자 등판 안쪽에서 접힌 회로도 한 장이 떨어졌다.'},
    {kind:'thought', who:'me', name:'나', text:'이 종이는 처음 보는데. 엄마가 따로 숨겨 둔 건가?'},
    {kind:'letter', who:'mother', name:'엄마의 메모', text:'강제 명령 현장 확인 포트 — 남산 중앙 노드. 검증 모듈 보관 위치 — 달구지 계기판 뒤.'},
    {kind:'narration', text:'현재 이송표에 찍힌 명령 규격과 회로도 모서리의 번호가 같았다. 143년 전 문서가 아니라, 지금도 쓰이는 명령을 멈추기 위한 도면이었다.'},
    {kind:'thought', who:'me', name:'나', text:'라디오가 남산을 부른 이유도, 할아버지가 계기판을 말한 이유도 이거였어.'},
    {kind:'letter', who:'mother', name:'엄마의 메모', text:'이송이 다시 시작되면 발신 기록과 당사자 증언을 함께 가져갈 것. 장치만으로는 검증이 끝나지 않는다.'},
    {kind:'thought', who:'me', name:'나', text:'호출만 들었을 때는 가지 않았다. 그런데 지금 쫓겨나는 사람과, 멈출 방법이 같은 날 내 앞에 왔다.'}
  ],
  'intro-dashboard-module': [
    {kind:'narration', text:'회로도에 적힌 배선 색을 하나씩 맞춰 계기판 아래 판을 열었다.'},
    {kind:'thought', who:'me', name:'나', text:'회색 선 둘, 구리 접점 여섯. 도면이랑 같다.'},
    {kind:'narration', text:'속에는 천으로 감싼 손바닥만 한 모듈이 있었다. 아빠가 만든 검증키였다. 달구지 전장과 함께 묶여 있어 엔진을 켤 때마다 미세하게 전원을 받고 있었다.'},
    {kind:'thought', who:'me', name:'나', text:'이걸 뽑아서 남산까지 가져가면 되는 건가?'},
    {kind:'letter', who:'mother', name:'엄마의 메모', text:'분리 순서를 확인하기 전에는 커넥터를 당기지 말 것. 검증키와 차량 전장을 함께 태울 수 있음.'},
    {kind:'narration', text:'수첩에서 그 순서를 찾았지만 검증키 분리 절차 두 장, 4–5쪽이 뜯겨 있었다. 나는 선마다 번호표를 붙이고 계기판을 다시 닫았다.'},
    {kind:'thought', who:'me', name:'나', text:'열쇠는 찾았다. 안전하게 꺼낼 방법과, 이걸 남산에서 받아들이게 할 기록은 길 위에서 찾아야 한다.'},
    {kind:'letter', who:'mother', name:'엄마의 메모', text:'한 가족의 억울함만으로 시스템을 고칠 수는 없다. 이송을 겪은 사람, 명령망을 본 사람, 길을 지킨 사람의 기록을 대조할 것.'},
    {kind:'thought', who:'me', name:'나', text:'검증키만 들고 가면 남산에서는 또 내 가족 민원이라고 할 거야. 하진의 표처럼 지금 벌어지는 일과, 명령망을 본 사람의 기록이 더 필요해.'}
  ],
  'intro-workshop-departure': [
    {kind:'narration', text:'갈 방법을 찾았다고 바로 시동이 걸리는 것은 아니었다. 작업장에는 내일 고치기로 한 차와 아직 받지 못한 수리값이 남아 있었다.'},
    {kind:'thought', who:'me', name:'나', text:'예비 연료를 전부 싣고 나가면 당분간 이 문은 못 연다.'},
    {kind:'narration', text:'마지막 연료통 두 개를 생활칸 뒤에 묶었다. 엄마의 철제 상자는 조수석 아래에 넣고, 무거운 용접기는 작업대에 남겼다.'},
    {kind:'thought', who:'me', name:'나', text:'여기 남으면 내일도 먹고는 살아. 그런데 도윤이랑 유나는 서른 번째 밤 뒤에 또 버스를 타야 해.'},
    {kind:'narration', text:'맡은 수리가 늦어진다는 쪽지를 작업대에 눌러 두었다. 돌아올 날짜는 쓰지 못했다.'},
    {kind:'thought', who:'me', name:'나', text:'돌아온다고 써 놓고 싶지만, 그건 약속할 수 없어.'},
    {kind:'narration', text:'셔터를 절반 내린 뒤 빗물이 들지 않게 아래 고리를 걸었다. 안쪽의 공구와 빈 의자가 어둠 속에 남았다.'},
    {kind:'thought', who:'me', name:'나', text:'그래도 스무 날을 여기서 보내지는 않을 거야.'},
    {kind:'narration', text:'문에 「수리 쉽니다」를 붙이고 단골 두 명에게 공구함 열쇠를 맡겼다. 예비 연료를 실은 만큼 작업장 난로에 쓸 몫도 줄었다.'},
    {kind:'thought', who:'me', name:'나', text:'이 셔터를 다시 올리러 돌아오자. 그때는 도윤이네도 자기 집으로 돌아갈 수 있게.'}
  ],
  'intro-departure-choice': [
    {kind:'narration', text:'하진과 도윤이 부두 입구에서 기다리고 있었다. 계기판 속 검증키는 분리 순서를 찾을 때까지 그대로 두었다.'},
    {kind:'dialogue', who:'intro_child', name:'도윤', text:'남산까지 가면 진짜 멈출 수 있어요?'},
    {kind:'dialogue', who:'me', name:'나', text:'아직은 몰라. 멈추는 장치는 찾았는데, 차에서 안전하게 꺼내는 두 장이 없어.'},
    {kind:'dialogue', who:'passer_woman', name:'하진', text:'그 두 장만 찾으면 되는 거예요?'},
    {kind:'dialogue', who:'me', name:'나', text:'아니요. 이 표 한 장뿐이면 또 개인 민원으로 끝낼 겁니다. 같은 이송을 겪은 사람, 명령망을 본 사람, 그 길을 지킨 사람의 기록도 필요해요.'},
    {kind:'dialogue', who:'intro_child', name:'도윤', text:'그 기록은 어떻게 모아요?'},
    {kind:'dialogue', who:'me', name:'나', text:'직접 만나서 듣고, 기록이 맞는지도 확인할 거야. 같은 곳까지 가겠다는 사람을 만나면 달구지에 그 사람 자리도 만들고.'},
    {kind:'dialogue', who:'intro_child', name:'도윤', text:'그럼 유나랑 친구들은요?'},
    {kind:'dialogue', who:'me', name:'나', text:'스무 날 안에 멈춰 볼게. 만약 늦으면, 이미 출발한 버스부터 돌아오게 하고.'},
    {kind:'dialogue', who:'passer_woman', name:'하진', text:'약속까지는 하지 마세요. 대신 늦으면, 먼저 떠난 사람들 이름도 찾아 주세요.'},
    {kind:'dialogue', who:'me', name:'나', text:'알겠습니다. 남은 버스만 세우고 끝내지는 않을게요.'},
    {kind:'narration', text:'도윤은 가족의 이송표 사본을 조수석 수첩 위에 올려놓았다. 하진은 유나가 기다리는 버스로 돌아갔다. 그제야 달구지 뒤에 남은 레일이 눈에 들어왔다. 누구를 태우라고 정해 둔 자리가 아니라, 필요해진 집의 모양을 나중에 고칠 수 있게 남겨 둔 여지였다.'},
    {kind:'narration', text:'서울까지 400km. 시동 모터가 한 번 헛돌았고, 두 번째에 엔진이 붙었다.'},
    {kind:'thought', who:'me', name:'나', text:'스무 날 안에 남산까지 간다. 늦더라도 버스 번호와 사람 이름을 놓치지 않는다.'},
    {kind:'dialogue', who:'me', name:'나', text:'할아버지, 다녀올게.'}
  ]
};
D.intro.forEach(page=>{
  page.beats = introBeats[page.scene] || [{kind:'narration', text:page.text}];
});

/* ═══════════════════ 이벤트 풀 ═══════════════════
   type: 발견|조우|탐색|동행|추적|위기  /  region 배열 없으면 전역
   out[].p 는 가중치. req 미충족 선택지는 회색 */
/* 반복 인물의 핵심 체인은 제목 변화와 무관하게 같은 얼굴을 쓴다. */
Object.assign(D.eventPortraits, {
 lib_meet:'hanbyeol', lib_request:'hanbyeol', lib_books:'hanbyeol', lib_return:'hanbyeol', library_scribe:'hanbyeol',
 deserter_meet:'seoyeon', deserter_check:'seoyeon', deserter_farewell:'seoyeon', whites_pass:'seoyeon', whites_straggler:'seoyeon',
 mansu_robbed:'mansu', mansu_revenge:'mansu', mansu_opening:'mansu',
 meet_postman:'postman', postman_again:'postman', ev_postman_ghost:'postman',
 meet_mapmaker:'mapmaker',
 loc_mingyu:'mingyu', freq_catch:'mingyu', freq_triangulate:'mingyu', freq_source:'mingyu', freq_L2:'mingyu',
 gp_note1:'grandfather', gp_note2:'grandfather', gp_note3:'grandfather', gp_envelope:'grandfather',
 find_bori_nose:'bori', comp_bori_bath:'bori', comp_bori_dream:'bori', bori_tag:'bori', bori_family:'bori'
});
D.eventPortraitTitleRules = [
 {portrait:'hanbyeol', titles:/(한별|이동 도서관|사서의 증언)/},
 {portrait:'seoyeon', titles:/(서연|소연|이탈자)/},
 {portrait:'mansu', titles:/(만수|만물상|뽕짝이 멈춘 날|스피커 탈환)/},
 {portrait:'postman', titles:/(우편부|남산행 편지)/},
 {portrait:'mapmaker', titles:/지도장이/},
 {portrait:'mingyu', titles:/(민규|민지의 오빠|남매, 능선에서|88\.9)/},
 {portrait:'grandfather', titles:/(할아버지|정비 수첩|수첩 —|봉투 개봉|마지막 계단|1페이지)/},
 {portrait:'bori', titles:/(^보리|레오와 보리|보리의)/}
];

D.events = [

/* ───── 발견형 ───── */
{id:'find_lake_sign', type:'발견', w:8, once:true, region:['south'], hiddenTarget:'lake',
 title:'페인트로 쓴 표지판',
 text:'가드레일에 흰 페인트 글씨.\n\n"산길 위쪽 호수. 물고기 있음. 거짓말 아님. — 낚시꾼"\n\n글씨 밑에 물고기 그림까지 그려놨다. 꽤 귀엽다.',
 choices:[
  {label:'지도에 표시해둔다', out:[{p:1, text:'낡은 지도에 호수 위치를 그려넣었다. 물고기 그림도 따라 그렸다.', fx:{reveal:'lake', note:{type:'소문',title:'낚시꾼의 호수',body:'가드레일 표지판이 알려준 곳. 물고기 있음. 거짓말 아님.',links:['낚시꾼의 호수']}}}]},
  {label:'무시한다 — 함정일 수도', out:[{p:1, text:'세상엔 친절을 미끼로 쓰는 사람도 있다. 액셀을 밟았다.', fx:{}}]},
 ]},

{id:'find_mall_kid', type:'발견', w:8, once:true, region:['mid'], hiddenTarget:'mall',
 title:'크레용 지도',
 text:'버려진 승용차 뒷좌석, 아이의 스케치북.\n\n크레용으로 그린 지도에 커다란 건물, 그리고 별표.\n\n"보물. 아빠랑 갈 곳."\n\n날짜는 오래전 봄에 멈춰 있다.',
 choices:[
  {label:'지도를 챙긴다', out:[{p:1, text:'스케치북을 조수석에 실었다. 별표가 가리키는 건 구미 쪽 백화점이다.\n\n…아이도 아빠도, 결국 못 갔던 모양이다. 대신 가주기로 했다.', fx:{reveal:'mall', note:{type:'소문',title:'크레용 보물지도',body:'아이가 그린 지도. 별표는 유령 백화점. 대신 가주기로 했다.',links:['유령 백화점']}}}]},
  {label:'조용히 덮어둔다', out:[{p:1, text:'스케치북을 원래 자리에 돌려놨다. 어떤 물건은 무덤이다.', fx:{moodAll:2}}]},
 ]},

{id:'find_tower_light', type:'발견', w:7, once:true, night:true, region:['south','mid'], hiddenTarget:'tower',
 title:'능선 위의 불빛',
 text:'칠흑 같은 산 능선에 빨간 불이 규칙적으로 깜빡인다.\n\n통신탑 항공장애등. 전기가 끊긴 세상에서, 저것만 살아 있다.\n\n누가 전기를 대고 있는 걸까.',
 choices:[
  {label:'위치를 기억해둔다', out:[{p:1, text:'거창 방면 능선. 지도에 붉은 점 하나를 찍었다.', fx:{reveal:'tower', note:{type:'소문',title:'살아있는 통신탑',body:'밤마다 깜빡이는 항공장애등. 누군가 전기를 대고 있다.',links:['송전 통신탑']}}}]},
  {label:'모르는 게 약이다', out:[{p:1, text:'살아 있는 기계는 천리안의 눈일 수 있다. 커튼을 치듯 고개를 돌렸다.', fx:{}}]},
 ]},

{id:'find_bori_nose', type:'발견', w:9, once:true, needsDog:true, hiddenTarget:'any',
 title:'보리가 짖는다',
 text:'보리가 갑자기 창문에 매달려 짖기 시작한다.\n\n한 방향이다. 꼬리를 흔들면서 짖는다. 위험이 아니라— 뭔가 좋은 냄새다.',
 choices:[
  {label:'보리를 믿는다', out:[{p:1, text:'개코를 이긴 문명은 없다. 보리가 가리킨 방향을 지도에 표시했다.', fx:{reveal:'any', mood:{leo:6}, note:{type:'사건',title:'보리의 코',body:'보리가 냄새로 찾아낸 곳. 개코를 이긴 문명은 없다.'}}}]},
  {label:'"보리, 앉아"', out:[{p:1, text:'보리가 시무룩하게 앉는다. 레오가 대신 서운한 표정을 짓는다.', fx:{mood:{leo:-4}}}]},
 ]},

{id:'find_radio_coords', type:'발견', w:7, once:true, region:['mid','north'], hiddenTarget:'any',
 title:'잡음 속의 목소리',
 text:'죽어 있던 라디오가 지익— 하고 살아난다.\n\n"…들리면… 좌표… 북위 3… 5도…"\n\n사람 목소리다. 녹음된 것 같기도 하고, 아닌 것 같기도 하다.',
 choices:[
  {label:'좌표를 받아적는다', out:[
    {p:3, text:'끊기는 숫자를 조합해 지도 위 한 지점을 찍었다. 뭐가 있을진 가봐야 안다.', fx:{reveal:'any', note:{type:'소문',title:'라디오 좌표',body:'잡음 속 목소리가 불러준 좌표. 사람인지 녹음인지 모른다.'}}},
    {p:1, text:'받아적고 보니 좌표가 아니라… 날짜다. 오래전 그날의. 라디오가 뚝 끊겼다.', fx:{moodAll:-3, pursuit:1}}]},
  {label:'라디오를 꺼버린다', out:[{p:1, text:'세상엔 듣지 않는 게 나은 방송도 있다.', fx:{}}]},
 ]},

/* ───── 조우형 ───── */
{id:'meet_waver', type:'조우', w:10,
 title:'손 흔드는 남자',
 text:'도로 한복판에서 남자가 양팔을 흔든다.\n\n발밑엔 빨간 기름통. "차가 퍼졌어요! 기름 좀 나눠주면 고철로 사례할게요!"\n\n웃는 얼굴인데, 눈은 웃지 않는 것 같기도 하다.',
 choices:[
  {label:'세워서 도와준다', out:[
    {p:5, text:'진짜 고장이었다. 기름 5L를 나눠주자 남자가 고철을 한 아름 안겨준다.\n\n"남쪽 인심 아직 안 죽었네!"', fx:{fuel:-5, scrap:12, moodAll:4}},
    {p:2, text:'남자 뒤 수풀에서 둘이 더 튀어나왔다. 강도다!\n\n실랑이 끝에 물통 하나를 뺏기고 겨우 출발했다.', fx:{water:-2, moodAll:-5, note:{type:'사건',title:'가짜 조난자',body:'기름통은 미끼였다. 웃는 눈을 조심할 것.'}}}]},
  {label:'강우에게 맡긴다', req:{comp:'kangwoo'}, out:[
    {p:1, text:'강우가 창문을 내리고 남자를 3초간 본다.\n\n"…뒤에 둘 더 있다. 밟아."\n\n백미러로 보니 수풀에서 두 명이 일어나 침을 뱉었다.', fx:{mood:{kangwoo:4}, note:{type:'사건',title:'강우의 눈',body:'3초 만에 매복을 읽었다. 전직 군인의 눈은 못 속인다.'}}}]},
  {label:'속도를 올려 지나친다', out:[{p:1, text:'백미러 속에서 남자가 점이 될 때까지 아무도 말하지 않았다.', fx:{moodAll:-2}}]},
 ]},

{id:'meet_toll', type:'조우', w:9, region:['mid','north'],
 title:'도로 봉쇄',
 text:'폐버스 두 대로 길을 막았다. 무장한 셋이 드럼통 화덕 앞에 서 있다.\n\n"통행세. 고철 8. 아니면 돌아가든가."\n\n말투는 심드렁하다. 매일 하는 장사라는 듯이.',
 choices:[
  {label:'통행세를 낸다 (고철 8)', req:{scrap:8}, out:[{p:1, text:'고철을 세어 건네자 버스가 삐걱대며 비켜난다.\n\n"북쪽 조심해. 요즘 하늘에 뭐가 떠다녀." 덤으로 정보를 준다.', fx:{scrap:-8}}]},
  {label:'협상한다', req:{comp:'kangwoo'}, out:[
    {p:2, text:'강우가 내려서 그들의 무기를 슥 훑고, 군용 수신호를 몇 개 보냈다.\n\n"…통과시켜. 같은 밥 먹던 사람이네." 절반만 받겠단다.', fx:{scrap:-4, mood:{kangwoo:5}}},
    {p:1, text:'"수신호 안 통해. 낼 거야 말 거야?" 분위기가 험해지기 전에 전액을 냈다.', fx:{scrap:-8}}]},
  {label:'돌파한다', risk:'위험', out:[
    {p:1, text:'액셀을 끝까지 밟았다. 버스 사이 틈을 긁으며 통과!\n\n뒤에서 욕설과 돌멩이가 날아왔다. 차 옆구리가 길게 긁혔다.', fx:{van:-12, moodAll:-3, note:{type:'사건',title:'봉쇄선 돌파',body:'버스 바리케이드를 긁고 통과했다. 차에 훈장 같은 흉터.'}}},
    {p:1, text:'돌파 직전, 타이어 아래서 뭔가 터졌다. 못판이다!\n\n겨우 빠져나왔지만 바퀴가 너덜너덜하다.', fx:{van:-22, moodAll:-5}}]},
 ]},

/* ── 인간의 악의 — 세계가 국밥과 오지랖만으로 되어 있지 않다는 증거 ── */
{id:'levy_office', type:'조우', w:7, once:true, region:['mid'],
 title:'임시 행정소',
 text:'길목에 천막이 서 있다. 「임시 차량 행정소」. 손글씨인데 관공서 서체를 흉내 냈다.\n\n형광 조끼를 입은 남자 셋. 가슴에 코팅된 명찰. 책상 위에 도장과 장부까지 갖췄다.\n\n"미등록 차량이네. 재등록비 고철 열다섯. 등록 안 하면 위쪽에 미등록 이동체로 보고가 올라가요."\n\n남자가 태블릿을 툭툭 쳤다. 화면은 꺼져 있다. 저들은 천리안이 무서운 게 아니라, 천리안이 무서운 사람들을 발견한 것이다.',
 choices:[
  {label:'"보고 올려 보시오" — 꺼진 태블릿을 가리킨다', out:[
    {p:2, text:'"그 태블릿, 충전이 안 돼 있잖소."\n\n남자의 손이 멈췄다. 뒤의 둘이 서로를 봤다.\n\n"…가쇼. 오늘은 봐준다."\n\n봐주는 게 아니라 들킨 것이다. 백미러 속에서 그들은 벌써 다음 차를 기다리며 천막을 고쳐 세우고 있었다.', fx:{moodAll:2, note:{type:'사건',title:'가짜 행정소',body:'관공서를 흉내 낸 통행세 사기. 꺼진 태블릿을 가리키자 물러섰다. 다음 차는 속을지도 모른다.',links:[]}}},
    {p:1, text:'"어— 이 양반이." 남자가 장부를 덮으며 일어섰다. 뒤의 둘이 쇠파이프를 짚었다.\n\n결국 고철 여덟에 "협의"를 봤다. 사기꾼과의 협상은 이기고도 지는 기분이다.', fx:{scrap:-8, moodAll:-3}}]},
  {label:'재등록비를 낸다', req:{scrap:15}, out:[{p:1, text:'고철을 세는 남자의 손이 능숙했다. 도장이 쿵 찍혔다. 「등록 완료」— 아무 효력 없는 종이.\n\n떠나며 백미러를 봤다. 우리 뒤에 서 있던 소달구지 노인이 같은 책상 앞에 서고 있었다. 저 노인에게 고철 열다섯이 있을까.\n\n종이는 창틈으로 버렸는데, 기분은 버려지지 않았다.', fx:{scrap:-15, moodAll:-4, note:{type:'사건',title:'가짜 행정소',body:'가짜 등록증에 고철 15를 냈다. 우리 다음 차례는 소달구지 노인이었다.',links:[]}}}]},
  {label:'천막을 걷어버린다', risk:'몸싸움', out:[
    {p:1, text:'차에서 다 같이 내리자 숫자 계산이 끝났다. 셋 대 우리.\n\n"…철수. 오늘 자리가 안 좋네."\n\n그들은 천막과 책상을 익숙하게 접어 트럭에 실었다. 접는 속도가 이 장사의 연차를 말해 줬다. 우리는 부술 것도 없이 빈 길가만 얻었다.\n\n사흘 뒤 다른 길목에서 같은 천막이 선다는 데에 고철을 걸 수 있다.', fx:{time:20, moodAll:1, flag:'levy_chased', note:{type:'사건',title:'걷어낸 천막',body:'가짜 행정소를 쫓아냈다. 부순 게 아니라 옮긴 것에 가깝다.',links:[]}}},
    {p:1, text:'말이 끝나기 전에 쇠파이프가 사이드미러를 쳤다.\n\n짧고 볼썽사나운 몸싸움 끝에 그들이 물러났다. 천막은 걷었지만 거울은 깨졌고, 누군가의 팔뚝에 멍이 들었다.\n\n"사기꾼이 제일 무서울 때는 밑천이 드러났을 때요." 박 선생이 있었다면 그렇게 말했을 것이다.', fx:{van:-8, moodAll:-2, fatigue:6, flag:'levy_chased'}}]},
 ]},

{id:'cleaners_recall', type:'추적', w:8, once:true, region:['north'], night:false,
 title:'회수조',
 text:'갓길에 흰 옷 넷이 서 있다. 정리자들. 그 앞에 낡은 승합차 한 대와, 차에서 내리지 않으려는 여자 하나.\n\n"이탈자 회수 중입니다." 선두의 남자가 우리 차에 손바닥을 들어 보였다. 지나가라는 뜻이다.\n\n"동생분이 그분 곁을 그리워하십니다." 남자의 목소리는 부드러웠다. 여자의 얼굴은 그렇지 않았다.\n\n"저는 안 그리워요." 여자가 말했다. 남자는 미소를 지우지 않았다. "돌아가면 기억나실 겁니다."\n\n협박도 무기도 없다. 다만 넷이 한 사람을 둘러싸고, 부드럽게, 계속, 서 있을 뿐이다.',
 choices:[
  {label:'차에서 내려 여자 옆에 선다', out:[
    {p:2, text:'말없이 여자와 회수조 사이에 섰다. 일행이 하나둘 따라 내렸다.\n\n숫자가 뒤집히자 남자의 미소가 처음으로 얇아졌다.\n\n"…강요는 저희 방식이 아닙니다." 넷은 고개를 숙이고 승합차에 올랐다. 부드러움은 숫자가 유리할 때만 미덕이었다.\n\n여자는 남쪽 정착지까지만 태워 달라고 했다. 차 안에서 그녀는 한 번도 뒤를 돌아보지 않았다.', fx:{time:40, moodAll:3, pursuit:1, flag:'recall_blocked', note:{type:'사건',title:'회수조 앞에서',body:'정리자 회수조와 이탈자 사이에 섰다. 부드러운 포위는 숫자가 뒤집히자 끝났다. 흰 옷들은 우리 차 번호를 오래 봤다.',links:['정리자들','천리안']}}},
    {p:1, text:'내려서 서긴 했는데, 회수조는 물러나는 대신 기도를 시작했다. 넷이 무릎을 꿇고, 우리와 여자를 향해, 낮고 길게.\n\n그 소리가 제일 무서웠다. 여자가 귀를 막았다.\n\n결국 여자를 차에 태우고 그 자리를 떠나는 수밖에 없었다. 기도 소리는 오래 따라왔다.', fx:{time:30, moodAll:-4, pursuit:1, flag:'recall_blocked', note:{type:'사건',title:'기도하는 포위',body:'회수조는 싸우지 않았다. 기도로 둘러쌌다. 여자를 태우고 떠난 뒤에도 소리가 오래 남았다.',links:['정리자들']}}}]},
  {label:'"본인이 싫다잖소" — 창문만 내리고 말한다', out:[{p:1, text:'"본인 의사는 확인하셨습니까." 남자가 되물었다. "저희는 매일 확인합니다. 답이 바뀔 때까지."\n\n그 말이 이 무리의 전부였다. 매일 묻는 것. 지치게 하는 것. 그것을 정성이라 부르는 것.\n\n우리가 창문을 올리지 않고 버티자, 회수조는 "오늘은 여기까지"라며 물러났다. 내일 또 올 것이다. 여자는 우리 차를 오래 봤지만, 타겠다고는 하지 않았다.', fx:{time:15, moodAll:-5, note:{type:'사건',title:'매일 묻는 사람들',body:'회수조는 답이 바뀔 때까지 매일 묻는다고 했다. 오늘은 물러났다. 내일이 문제다.',links:['정리자들']}}}]},
  {label:'지나간다', out:[{p:1, text:'속도를 줄이지 않았다.\n\n백미러 속에서 흰 옷 넷이 여자를 향해 반걸음씩 좁혀 들었다. 부드럽게. 계속.\n\n그날 밤 야영지에서 누군가 물었다. "그 사람, 탔을까." 아무도 대답하지 않았다.', fx:{moodAll:-7, flag:'recall_passed', note:{type:'사건',title:'지나친 회수조',body:'흰 옷 넷과 내리지 않으려던 여자. 우리는 속도를 줄이지 않았다.',links:['정리자들']}}}]},
 ]},

{id:'salvage_claim', type:'조우', w:8, once:true, region:['south','mid','north'],
 title:'먼저 온 사람들',
 text:'무너진 창고 앞에 트럭 두 대가 서 있다. 안에서 쇠 긁는 소리가 난다.\n\n우리가 다가가자 한 사람이 나와 길을 막았다. 손에는 장부와 연필.\n\n"여기 우리 구역이오. 들어가려면 회수료 내야 돼."\n\n"언제부터 구역이 됐소?"\n\n"우리가 온 날부터." 남자가 장부를 흔들었다. 종이에는 지역 이름과 날짜가 빼곡했다. 정말로 기록하고 있었다. 자기들끼리의 법을 만들고, 그 법을 자기들이 집행하는 사람들.\n\n"규칙 없으면 다 뺏기니까. 규칙 만들면 우리가 뺏고." 남자가 웃지 않고 말했다.',
 choices:[
  {label:'회수료를 낸다 (고철 10)', req:{scrap:10}, out:[{p:1, text:'고철을 세어 주자 장부에 우리 차 번호가 적혔다. 「통행 허가 · 유효 3일」.\n\n창고 안은 이미 절반이 비어 있었다. 남은 건 쓸 만한 것도 아니었다.\n\n허가증 값이 물건 값보다 비쌌다. 그게 이 장사의 요령이다.', fx:{scrap:-10, time:60, note:{type:'사건',title:'구역이라는 말',body:'무너진 창고 앞에서 회수료를 냈다. 남은 물건보다 허가증이 비쌌다.',links:[]}}}]},
  {label:'다른 입구를 찾는다', out:[
    {p:2, text:'뒤편 무너진 벽으로 돌아 들어갔다. 저들이 아직 손대지 않은 구역이 남아 있었다.\n\n조용히, 빠르게, 필요한 만큼만 챙겨 나왔다. 우리 뒤에서 장부 넘기는 소리가 계속 들렸다.', fx:{time:90, scrap:8, fatigue:6, item:{'부품':1}}},
    {p:1, text:'뒤편으로 들어가려다 발밑 슬래브가 내려앉았다. 소리를 들은 저들이 손전등을 들고 왔다.\n\n"어이. 규칙은 규칙인데."\n\n빈손으로 물러났다. 무릎이 까졌고, 자존심은 더 까졌다.', fx:{time:70, fatigue:8, moodAll:-3, injury:{who:'driver',label:'무릎 찰과상',days:2}}}]},
  {label:'그냥 지나간다', out:[{p:1, text:'차를 돌렸다. 저 창고에 뭐가 남았든 우리 것이 아니었다.\n\n조금 가다 보니 반대편에서 소달구지 한 대가 그쪽으로 올라가고 있었다. 노인 혼자였다.\n\n세워서 말해 줄까 하다가, 그러지 않았다. 말해 준다고 안 갈 것도 아니고, 우리가 대신 낼 것도 아니었다.', fx:{time:20, moodAll:-3}}]},
 ]},

{id:'water_toll', type:'조우', w:9, once:true, region:['mid','north'], needLowWater:true,
 title:'우물 앞의 줄',
 text:'마을 어귀 우물에 줄이 서 있다. 그런데 물을 긷는 사람은 없다.\n\n두레박에 자물쇠가 걸려 있고, 그 옆에 청년 셋이 앉아 있다.\n\n"한 통에 고철 셋."\n\n"우물이 원래 마을 거 아니오?"\n\n"마을 사람은 둘." 청년이 대꾸했다. "나머진 손님이고."\n\n줄 선 사람들은 아무 말이 없다. 항의해 본 사람이 이미 없어졌거나, 항의가 소용없다는 걸 배운 얼굴들이다.\n\n우리 물통은 바닥이 보인다.',
 choices:[
  {label:'값을 치른다', req:{scrap:3}, out:[{p:1, text:'고철 셋을 내고 물 한 통을 받았다. 자물쇠가 열리고 다시 잠기는 데 이십 초.\n\n뒤에 선 아이가 빈 통을 들고 우리를 봤다. 우리가 낸 값이 그 아이의 오늘 몫을 더 비싸게 만들었다는 걸, 우리 둘 다 알았다.', fx:{scrap:-3, water:4, time:40, moodAll:-2}}]},
  {label:'줄 선 사람들과 값을 나눠 낸다', req:{scrap:8}, out:[{p:1, text:'"뒤에 넷까지 같이 냅시다."\n\n청년들은 잠깐 서로를 봤다. 한꺼번에 받는 게 이득이라 판단했는지 자물쇠를 오래 열어 뒀다.\n\n다섯 통이 채워지는 동안 아무도 고맙다는 말을 하지 않았다. 대신 노인 하나가 우리 물통을 자기 것보다 먼저 채워 줬다.\n\n돌아가는 길에 아이가 뛰어와 마른 대추 한 줌을 쥐여 주고 도망갔다.', fx:{scrap:-8, water:4, food:1, time:70, moodAll:5, note:{type:'사건',title:'우물 앞의 값',body:'자물쇠 걸린 우물에서 뒷사람 넷 몫까지 값을 냈다. 아무도 고맙다고 하지 않았지만 대추 한 줌이 왔다.',links:[]}}}]},
  {label:'자물쇠를 부순다', risk:'마을과 척진다', out:[
    {p:1, text:'쇠파이프를 자물쇠에 걸고 체중을 실었다. 두 번 만에 부러졌다.\n\n청년들이 일어섰지만 줄 선 사람들이 그 사이를 막아섰다. 오래 참은 사람들의 침묵이 우리 쪽으로 기울었다.\n\n물은 얻었다. 대신 이 마을에 우리 얼굴이 남았다.', fx:{water:5, time:30, moodAll:2, flag:'well_broken', note:{type:'사건',title:'부순 자물쇠',body:'우물 자물쇠를 부쉈다. 줄 선 사람들이 막아섰다. 이 마을에 우리 얼굴이 남았다.',links:[]}}},
    {p:1, text:'파이프를 거는 순간 청년 하나가 밀쳤다. 넘어지며 두레박 줄에 손등이 쓸렸다.\n\n줄 선 사람들은 아무도 움직이지 않았다. 오래 참은 사람들의 침묵은 이번엔 우리 편이 아니었다.\n\n물도 못 얻고 손등만 벗겨져 돌아왔다.', fx:{time:40, moodAll:-5, injury:{who:'driver',label:'손등 찰과상',days:2}}}]},
 ]},

{id:'signal_bait', type:'추적', w:8, once:true, region:['north'], needFlag:'radio_fixed',
 title:'구조 요청 주파수',
 text:'라디오에서 여자 목소리가 반복된다.\n\n"…차량 고장. 아이 둘. 좌표 보냅니다. 물이 없어요…"\n\n같은 문장이 정확히 같은 간격으로 여덟 번.\n\n<span class="ai">(잡음)</span>\n\n"…차량 고장. 아이 둘. 좌표 보냅니다. 물이 없어요…"\n\n아홉 번째에도 억양이 똑같았다. 사람이 지치면 목소리가 변한다. 이 목소리는 변하지 않는다.\n\n녹음이거나, 아니면 지친 적이 없는 사람이다.',
 choices:[
  {label:'좌표로 간다', risk:'미끼일 수 있다', out:[
    {p:1, text:'좌표에는 정말 차가 있었다. 그리고 아이도 둘 있었다.\n\n다만 차는 고장 나지 않았고, 아이들은 우리 차 문이 열리기를 기다리고 있었다. 뒤편 수풀에서 어른 셋이 일어섰다.\n\n액셀을 밟았다. 뒷유리에 돌이 맞았다.\n\n"아이를 앞에 세우는 건," 누군가 오래 뒤에 말했다. "저쪽도 그게 통한다는 걸 아니까 그러는 거예요."', fx:{van:-10, fuel:-5, time:80, moodAll:-6, pursuit:1, flag:'bait_seen', note:{type:'사건',title:'아홉 번의 같은 목소리',body:'구조 요청 주파수는 미끼였다. 아이 둘을 앞에 세운 함정. 아이들이 미끼로 쓰였다는 사실이 오래 남았다.',links:['달구지']}}},
    {p:1, text:'좌표 근처에서 차를 세우고 먼저 걸어서 살폈다.\n\n수풀에 사람이 셋. 차는 멀쩡했고 아이 둘은 어른들 뒤에 앉아 있었다. 시키는 대로 기다리는 얼굴이었다.\n\n돌아 나오며 물 한 통을 길가에 두었다. 아이들 몫이라고 혼잣말했다. 어른들이 가져갈 것도 알고 있었다.', fx:{water:-2, time:100, moodAll:-3, flag:'bait_seen', note:{type:'사건',title:'미끼 좌표',body:'구조 신호는 함정이었다. 먼저 걸어서 확인해 피했다. 물 한 통은 두고 왔다.',links:[]}}}]},
  {label:'주파수를 역추적한다', req:{comp:'eunsu'}, out:[{p:1, text:'은수가 헤드폰을 눌러 썼다.\n\n"…송신 위치가 좌표랑 달라요. 이건 저 자리에서 사람이 부르는 게 아니라, 다른 데서 틀어 놓은 거예요."\n\n"녹음이야?"\n\n"녹음이에요. 그런데—" 은수가 잠깐 멈췄다. "원본은 진짜였을 거예요. 억양이 이래요. 처음 녹음할 땐 진짜로 급했던 사람."\n\n아무도 그 말에 대꾸하지 못했다.\n\n우회로를 잡고 좌표를 크게 돌았다.', fx:{time:60, fuel:-3, mood:{eunsu:3}, flag:'bait_seen', note:{type:'사건',title:'누군가의 진짜 목소리',body:'미끼로 쓰인 구조 요청은 원본이 진짜였다. 처음 그 말을 녹음한 사람이 어떻게 됐는지는 아무도 묻지 않았다.',links:['은수']}}}]},
  {label:'무시하고 간다', out:[{p:1, text:'라디오를 껐다.\n\n껐는데도 그 문장의 간격이 머릿속에서 계속 세어졌다. 여덟 번. 아홉 번.\n\n진짜였으면 어쩌지, 하는 생각은 밤이 되어서야 겨우 잦아들었다.', fx:{moodAll:-4, flag:'bait_seen'}}]},
 ]},

{id:'meet_bus', type:'조우', w:13, priority:1, recruitStart:'parkss', once:true, nearNode:['gumi','gimcheon','sangju'],
 title:'넘어진 버스',
 text:'시외버스가 옆으로 누워 있다. 사고는 오래전인데— 안에서 소리가 난다.\n\n"거기 누구 있어요?! 문이 안 열려요!"\n\n노인의 목소리다.',
 choices:[
  {label:'구조한다', out:[{p:1, text:'한 시간을 씨름해 문을 비틀어 열었다.\n\n백발의 노인이 약사 가방보다 먼저 작은 냉장 상자를 밀어낸다.\n\n"박 씨요. 약사였소. 사람들은 박 선생이라 불렀고. 나야 걸으면 되오. 그런데 이 약은 식기 전에 동쪽 길가 진료소에 닿아야 해. 열나는 애들이 셋이오."\n\n그는 우리 차보다 냉장 상자를 본다. "거기까지만, 같이 가주겠소?"', fx:{time:60, water:-1, startRecruit:'parkss', note:{type:'인물',title:'박 선생',body:'넘어진 버스에서 구조한 전직 약사. 구조된 순간에도 자기 가방보다 아이들 약부터 밀어냈다.',links:['박 선생']}}}]},
  {label:'지나간다', out:[{p:1, text:'목소리가 끊길 때까지 라디오 볼륨을 올렸다.\n\n그날 밤 아무도 밥을 다 먹지 못했다.', fx:{moodAll:-8, flag:'left_bus', note:{type:'사건',title:'지나친 버스',body:'문이 안 열린다던 목소리. 우리는 볼륨을 올렸다.'}}}]},
 ]},

{id:'meet_scrapyard', type:'조우', w:14, priority:1, recruitStart:'minji', once:true, nearNode:['ulsan','gyeongju','pohang','yangsan'],
 title:'자동차 무덤',
 text:'공단 옆 폐차장. 수백 대의 차가 탑처럼 쌓여 있다.\n\n그 꼭대기에서 불꽃이 튄다. 용접 불꽃. 사람이다.\n\n"거기 파란 차! 잠깐 세워 봐요!" 앳된 목소리가 차 더미를 타고 내려온다. "엔진 소리, 아까부터 이상해요."',
 choices:[
  {label:'"…그걸 소리로 알아?"', out:[{p:1, text:'소녀가 차 더미에서 미끄러져 내려온다. 기름때 묻은 작업복에 용접 고글, 열일곱쯤.\n\n"민지. 여기 정비사예요." 민지는 달구지보다 기울어진 차 더미를 먼저 돌아본다.\n\n"오빠가 남긴 진단기가 저 밑에 있어요. 마지막 정오 신호랑 발신 좌표가 거기 저장돼 있고요. 저걸 두고 가면 어디부터 찾아야 하는지도 없어져요."\n\n민지가 달구지의 견인 고리를 두드린다. "혼자 당기면 위에서 다 쏟아져요. 한 번만 손 맞춰 줘요. 차 얘기는 그다음에 하고."', fx:{startRecruit:'minji', note:{type:'인물',title:'민지',body:'폐차장에서 홀로 버틴 정비사. 북쪽의 오빠를 찾고 싶지만, 마지막 진단기를 두고 떠날 수 없다.',links:['민지','민규의 신호']}}}]},
  {label:'부품만 찾아본다', out:[
    {p:2, text:'"거기 3열 쌓인 데 아반떼 알터네이터 쓸 만해요!" 위에서 훈수가 날아온다.\n\n덕분에 좋은 부품을 건졌다. 내려온 소녀가 알터네이터를 적재칸에 올리고 손을 내민다.\n\n"민지. 여기 정비사예요. 부품값 대신 부탁 하나만 할게요. 오빠가 남긴 진단기가 저 차 더미 밑에 있어요. 저것까지 꺼내면 서로 빚 없는 걸로 해요."', fx:{item:{'부품':1}, scrap:4, startRecruit:'minji', note:{type:'인물',title:'민지',body:'폐차장 부품을 골라준 정비사. 품삯 대신 차 더미 아래의 진단기를 함께 꺼내 달라고 했다.',links:['민지','민규의 신호']}}},
    {p:1, text:'혼자 차 틈에 팔을 넣는 순간 위쪽 철판이 미끄러졌다. 소녀가 작업화를 틈에 박아 겨우 멈춰 세운다.\n\n"그렇게 뒤지면 부품보다 손이 먼저 나가요." 소녀가 내 팔을 끌어낸다. "민지. 여기 정비사예요. 부품은 됐고, 저도 혼자 못 꺼내는 게 하나 있어요. 서로 한 번씩 도와요."', fx:{van:-4, startRecruit:'minji', note:{type:'인물',title:'민지',body:'무너지는 차 더미에서 손을 빼준 정비사. 혼자 꺼낼 수 없는 진단기를 함께 구해 달라고 했다.',links:['민지','민규의 신호']}}}]},
 ]},

{id:'meet_hitchhiker', type:'조우', w:14, priority:1, recruitStart:'leo', once:true, night:true, nearNode:['jeonju','gwangju','damyang','namwon','suncheon'],
 title:'밤의 히치하이커',
 text:'헤드라이트에 잡힌 실루엣. 기타 케이스를 멘 남자와, 그 옆에 앉은 개 한 마리.\n\n남자가 엄지를 든다. 개는 꼬리를 흔든다.\n\n이 시국에 밤길에서 엄지를 드는 배짱이라니.',
 choices:[
  {label:'차를 세운다', out:[{p:1, text:'"레오예요. 얘는 보리—"\n\n소개가 끝나기도 전에 낡은 스피커에서 아이 우는 소리가 흘렀다. 보리가 귀를 세우더니 침수된 지하차도 안으로 뛰어든다.\n\n"보리!" 레오가 기타를 내던지고 물가까지 달려갔다. 검은 물은 허리까지 차 있다.\n\n그가 우리를 돌아본다. 태워달라는 얼굴이 아니다. "줄… 긴 줄 있습니까? 혼자 들어가면 둘 다 못 나와요."', fx:{startRecruit:'leo', note:{type:'인물',title:'레오와 보리',body:'밤길의 가수와 개. 동행 이야기를 꺼내기도 전에 보리가 침수 지하차도로 사라졌다.',links:['레오']}}}]},
  {label:'개만 태우고 싶다…', out:[{p:1, text:'"…개만요? 저희 세트인데요." 남자가 진지하게 고민하기 시작해서, 그냥 출발했다.\n\n백미러 속에서 개가 오래 이쪽을 봤다.', fx:{moodAll:-2}}]},
 ]},

{id:'meet_family', type:'조우', w:9, once:true,
 title:'고장난 트럭의 가족',
 text:'갓길의 1톤 트럭. 보닛이 열려 있고 아이 둘이 짐칸에서 이쪽을 본다.\n\n아버지가 다가온다. "벨트가 끊어졌어요. 부품… 아니, 뭐라도. 애들이 이틀을 굶었어요."',
 choices:[
  {label:'식량을 나눈다 (식량 2)', req:{food:2}, out:[{p:1, text:'통조림을 건네자 아이들 눈이 커진다.\n\n아버지가 낡은 손목시계를 풀어 억지로 쥐여준다. "고철값은 될 겁니다."', fx:{food:-2, scrap:5, moodAll:5, flag:'helped_family', note:{type:'사건',title:'트럭의 가족',body:'이틀 굶은 아이들에게 통조림을. 아버지는 시계를 풀었다.'}}}]},
  {label:'민지가 트럭을 고친다', req:{comp:'minji'}, out:[{p:1, text:'민지가 폐타이어 고무로 벨트를 임시로 엮었다. "임시예요! 100km는 가요!"\n\n가족이 가진 기름을 나눠준다. 아이들이 창문에 붙어 손을 흔들며 떠났다.', fx:{fuel:8, mood:{minji:6}, moodAll:4, flag:'helped_family'}}]},
  {label:'못 본 척한다', out:[{p:1, text:'우리 것도 부족하다. 그게 사실이고, 사실은 변명이 되지 못했다.', fx:{moodAll:-4, flag:'refused_family'}}]},
 ]},

{id:'meet_pilgrims', type:'조우', w:7, region:['mid','north'],
 title:'침묵의 행렬',
 text:'도로 갓길로 흰 옷의 무리가 걷는다. 스물쯤. 전부 북쪽을 향해.\n\n"정리자들"이다. 천리안을 신으로 섬기는 사람들.\n\n선두의 남자가 차를 향해 고개를 깊이 숙인다. 축복인지 조롱인지.',
 choices:[
  {label:'말을 걸어본다', out:[
    {p:2, text:'"북으로 가시는군요. 그분 곁으로." 남자의 눈이 형형하다.\n\n"수원 위로는 그분의 뜰입니다. 뜰에선 정숙하세요. 그분은 소리보다 빛을, 빛보다 마음을 봅니다."\n\n…광신도의 헛소리인데, 이상하게 구체적이다.', fx:{note:{type:'소문',title:'정리자들의 조언',body:'"수원 위는 그분의 뜰. 소리보다 빛을, 빛보다 마음을 본다." 헛소리치고 구체적이다.'}}},
    {p:1, text:'"…당신들은 그분의 목록에 있습니다." 남자가 차 번호판을 보며 미소 지었다.\n\n소름이 등을 훑었다.', fx:{pursuit:1, moodAll:-3}}]},
  {label:'조용히 지나간다', out:[{p:1, text:'스무 명의 흰 옷이 백미러에서 천천히 사라졌다. 아무도 뒤돌아보지 않았다. 우리만 계속 뒤를 봤다.', fx:{}}]},
 ]},

{id:'meet_trader_truck', type:'조우', w:9,
 title:'움직이는 만물상',
 text:(S)=>{ const n=S.flags.mansu||0;
  if(n===0) return '요란한 색으로 칠한 탑차가 마주 온다. 확성기에서 뽕짝이 흘러나온다.\n\n"만수네 만물상~ 없는 거 빼고 다 있어요~"\n\n탑차가 옆에 서더니 옆문이 좌판으로 펼쳐진다.';
  if(n===1) return '익숙한 뽕짝 소리. 만수네 탑차다!\n\n"어? 그 차! 저번에 봤죠? 다시 만나는 손님한텐 서비스가 있지~"';
  return `만수가 창문을 열며 활짝 웃는다.\n\n"단골님!! 벌써 ${n+1}번째네. 요즘 세상에 단골이 어딨어~ 가족이지 가족."\n\n좌판에 슬쩍 "가족 할인" 팻말이 세워진다.`; },
 choices:[
  {label:'연료를 산다 (고철 7 → 5L)', req:{scrap:7}, out:[{p:1, text:'"기름은 생명이지~" 만수가 콧노래를 부르며 기름을 옮겨 담는다.', fx:{scrap:-7, fuel:5, flagCount:'mansu'}}]},
  {label:'물과 식량을 산다 (고철 6)', req:{scrap:6}, out:[{p:1, text:'"물은 반품 안 돼요~" 물 2통과 통조림 2개를 받았다.', fx:{scrap:-6, water:2, food:2, flagCount:'mansu'}}]},
  {label:'단골 특전을 쓴다 (고철 8)', req:{scrap:8, flagMin:['mansu',2]}, out:[{p:1, text:'"가족 세트요~!" 연료에 물에 통조림에, 덤으로 사탕까지 얹어준다.\n\n"사탕은 애들… 아니 개 주지 말고! 사람 먹어요!"', fx:{scrap:-8, fuel:6, water:2, food:2, moodAll:3, flagCount:'mansu'}}]},
  {label:'은인 특전 (무료)', req:{flag:'mansu_saved'}, out:[{p:1, text:'만수가 뽕짝 볼륨을 최대로 올리며 좌판을 통째로 열었다.\n\n"은인님한테 돈 받으면 만물상 간판 내려야지! 가져가요, 가져가!"\n\n말려도 소용없었다. 스피커에 대한 의리는 이자가 센 모양이다.', fx:{fuel:5, water:2, food:2, moodAll:4, flagCount:'mansu'}}]},
  {label:'그냥 구경만 한다', out:[{p:1, text:'"구경은 공짜~ 다음에 봐요~" 뽕짝이 멀어진다.\n\n…저 아저씨는 어떻게 여러 해를 무사한 걸까. 세상엔 가끔 무적인 사람이 있다.', fx:{moodAll:2, flagCount:'mansu'}}]},
 ]},

{id:'meet_bikers', type:'조우', w:7, night:true, region:['mid','north'], risk:1,
 title:'폭주족',
 text:'뒤에서 헤드라이트 여러 개가 빠르게 붙는다.\n\n오토바이 넷. 개조 머플러가 밤을 찢는다. 창밖으로 쇠파이프가 보인다.\n\n"봉고다!! 세워봐라!!"',
 choices:[
  {label:'전속력으로 도망친다', risk:'연료 소모', out:[
    {p:3, text:'액셀을 바닥까지. 커브 세 개를 연달아 긁듯이 돌자 뒤의 불빛이 하나씩 떨어져나갔다.\n\n"후우…" 누군가 참았던 숨을 뱉었다.', fx:{fuel:-6, moodAll:-2}},
    {p:1, text:'도망치다 연석을 박았다! 차체가 크게 튀었지만 어쨌든 따돌렸다.', fx:{fuel:-6, van:-10, moodAll:-4}}]},
  {label:'급정거 후 맞선다', req:{comp:'kangwoo'}, out:[{p:1, text:'강우가 조용히 내려서 차 앞에 섰다. 그냥 서 있었다.\n\n오토바이들이 주위를 두 바퀴 돌더니, 그대로 사라졌다.\n\n"…아는 놈들이야?" "아니. 아는 눈빛이지."', fx:{mood:{kangwoo:5}, note:{type:'사건',title:'밤의 대치',body:'강우는 그냥 서 있었다. 폭주족은 두 바퀴 돌고 떠났다.'}}}]},
  {label:'속도를 줄이고 길을 내준다', out:[
    {p:2, text:'추월하며 창문을 두드리고 지나갔다. 겁만 주고 싶었던 모양이다.\n\n헬멧 아래로 언뜻 보인 얼굴들은 앳됐다. 겁이 가시자, 화보다 안쓰러운 마음이 먼저 남았다.', fx:{moodAll:-1}},
    {p:1, text:'지나가며 사이드미러 하나를 파이프로 부쉈다. 낄낄대는 소리가 멀어졌다.', fx:{van:-6, moodAll:-4}}]},
 ]},

{id:'meet_child_alone', type:'조우', w:6, region:['mid','north'], risk:1,
 title:'혼자 서 있는 아이',
 text:'도로 한가운데 아이가 혼자 서 있다. 예닐곱 살. 인형을 안고 있다.\n\n주변엔 아무도, 아무것도 없다.\n\n너무 이상하다. 여러 해 차 생존자의 본능이 경보를 울린다.',
 choices:[
  {label:'내려서 다가간다', risk:'위험', out:[
    {p:1, text:'함정이었다. 아이가 호루라기를 불자 도랑에서 어른 셋이 튀어나왔다.\n\n황급히 출발했지만 뒷문에 매달린 손이 식량 자루 하나를 낚아챘다.', fx:{food:-2, moodAll:-4, note:{type:'사건',title:'호루라기 아이',body:'아이는 미끼였다. 이 세상이 아이에게 가르친 직업.'}}},
    {p:1, text:'진짜 미아였다. 이름은 하늘이. 근처 공동체에서 놀다 길을 잃었단다.\n\n30분을 돌아 데려다주자 어른들이 달려나왔다. 답례로 물과 감자를 안겨준다.', fx:{time:30, water:2, food:2, moodAll:6}}]},
  {label:'박 선생이 살핀다', req:{comp:'parkss'}, out:[{p:1, text:'박 선생이 창문 너머로 아이를 오래 관찰했다.\n\n"…신발이 깨끗해. 여기까지 걸어온 애가 아니야. 근처에 어른이 있네."\n\n창문만 조금 내려 말을 걸자, 도랑 쪽에서 혀 차는 소리가 들리고 아이가 후다닥 뛰어갔다.', fx:{mood:{parkss:4}}}]},
  {label:'멀리 돌아서 지나간다', out:[{p:1, text:'아이를 크게 우회했다. 백미러 속 아이는 끝까지 이쪽을 보고 있었다.\n\n함정이었대도, 아니었대도, 마음이 편하지 않은 건 같다.', fx:{moodAll:-3}}]},
 ]},

/* ───── 탐색형 ───── */
{id:'exp_gas', type:'탐색', w:11,
 title:'폐주유소',
 text:'간판이 반쯤 떨어진 주유소. "어서오세요"의 "어서"만 남았다.\n\n펌프는 죽었지만, 지하 탱크에 뭐가 남았을진 모른다.',
 choices:[
  {label:'수동 펌프로 퍼올린다', risk:'시간 소모', out:[
    {p:3, text:'한 시간을 낑낑댄 끝에 바닥에 남은 기름을 건졌다. 팔이 후들거린다.', fx:{time:60, fuel:7, water:-1}},
    {p:2, text:'퍼올린 건 기름 반, 녹물 반. 그래도 거르면 쓸 만하다.', fx:{time:60, fuel:3}},
    {p:1, text:'탱크는 완전히 말라 있었다. 한 시간과 땀만 버렸다.', fx:{time:60, water:-1, moodAll:-2}}]},
  {label:'민지가 탱크를 딴다', req:{comp:'minji'}, out:[{p:1, text:'"주유소 지하탱크엔 항상 데드스톡이 있어요. 각도 문제지."\n\n민지가 배관을 뜯어 사이펀을 만들었다. 콸콸. 진짜 콸콸 나온다.', fx:{fuel:14, mood:{minji:4}}}]},
  {label:'매점만 턴다', out:[
    {p:2, text:'유통기한 지난 과자와 생수 몇 병. 유통기한은 이제 권장사항이다.', fx:{water:2, food:1}},
    {p:1, text:'선반은 텅. 대신 금고 뒤에서 고철로 쓸 만한 공구를 찾았다.', fx:{scrap:5}}]},
 ]},

{id:'exp_mart', type:'탐색', w:10,
 title:'버려진 마트',
 text:'중형 마트. 입구 유리는 깨진 지 오래고, 안쪽은 어둡다.\n\n선반 대부분은 털렸겠지만, 뒤지는 사람 나름이다.',
 choices:[
  {label:'식품 코너를 뒤진다', risk:'식중독 위험', out:[
    {p:3, text:'창고 뒤 팔레트 밑에서 통조림 상자를 찾았다! 라벨은 녹슬었지만 캔은 멀쩡하다.', fx:{food:4}},
    {p:1, text:'통조림을 땄는데 냄새가… 그날 밤 배탈이 단체로 왔다.', fx:{food:1, moodAll:-6, flag:'food_poison'}}]},
  {label:'박 선생이 감별한다', req:{comp:'parkss'}, out:[{p:1, text:'"캔이 부풀었으면 무조건 버려요. 이건 되고… 이건 안 되고…"\n\n전직 약사의 눈은 정확하다. 안전한 것만 골라 담았다.', fx:{food:3, water:2, mood:{parkss:3}}}]},
  {label:'생활용품 코너로', out:[
    {p:2, text:'배터리, 테이프, 라이터. 고철상이 좋아할 것들.', fx:{scrap:7}},
    {p:1, text:'약품 선반에서 먼지 쌓인 구급상자를 찾았다.', fx:{item:{'의약품':1}}}]},
 ]},

{id:'exp_checkpoint', type:'탐색', w:8, region:['mid','north'],
 title:'폐 군 검문소',
 text:'모래주머니와 바리케이드. 오래전 군이 마지막으로 버틴 흔적.\n\n초소 벽엔 분필로 정(正)자가 잔뜩 그어져 있다. 뭘 세던 걸까.\n\n"지뢰 주의" 표지판이 넘어져 있다. 진짜일까, 겁주기일까.',
 choices:[
  {label:'조심조심 뒤진다', risk:'위험', out:[
    {p:3, text:'초소 안에서 탄약 상자와 야전 의약품을 회수했다. 발밑은 무사했다.', fx:{item:{'탄약':1,'의약품':1}}},
    {p:1, text:'철컥. 발밑에서 소리가 났다.\n\n…불발이었다. 여러 해의 습기가 우리를 살렸다. 뒷걸음질로 빠져나왔다.', fx:{moodAll:-8, note:{type:'사건',title:'불발 지뢰',body:'철컥 소리. 여러 해의 습기가 목숨을 구했다.'}}}]},
  {label:'강우가 앞장선다', req:{comp:'kangwoo'}, out:[{p:1, text:'"내 발자국만 밟아."\n\n강우는 지뢰 매설 패턴을 읽듯 걸었다. 탄약, 의약품, 그리고 군용 지도까지 회수.\n\n지도엔 이 일대 도로가 상세히 그려져 있다.', fx:{item:{'탄약':1,'의약품':1}, revealNear:1, mood:{kangwoo:3}}}]},
  {label:'건드리지 않는다', out:[{p:1, text:'정(正)자 낙서가 마음에 걸렸다. 세던 것이 뭐였든, 좋은 건 아니었을 거다.', fx:{}}]},
 ]},

{id:'exp_reservoir', type:'탐색', w:9,
 title:'빗물 저수조',
 text:'농업용 저수조에 빗물이 그득하다.\n\n그냥 마시기엔 찜찜하지만, 물은 물이다.',
 choices:[
  {label:'끓여서 담는다 (연료 소모)', req:{fuel:2}, out:[{p:1, text:'버너에 연료를 조금 태워 팔팔 끓였다. 물통이 든든해졌다.', fx:{fuel:-2, water:4}}]},
  {label:'그냥 떠 담는다', risk:'배탈 위험', out:[
    {p:2, text:'맑아 보이는 위쪽만 조심스럽게 떴다. 괜찮았다.', fx:{water:3}},
    {p:1, text:'이틀 뒤 배가 응징을 시작했다. 물을 아끼려다 물을 더 썼다.', fx:{water:3, moodAll:-5, flag:'food_poison'}}]},
  {label:'지나간다', out:[{p:1, text:'물은 아직 있다. 다음 기회에.', fx:{}}]},
 ]},

{id:'exp_orchard', minParty:1, type:'탐색', w:8, region:['south','mid'],
 title:'야생 과수원',
 text:'주인 잃은 과수원. 가지가 휘도록 열매가 달렸다.\n\n벌레 먹은 것 반, 멀쩡한 것 반. 새들이 경계하며 이쪽을 본다.',
 choices:[
  {label:'과일을 딴다', out:[{p:1, text:'상자 가득 땄다. 달다. 미치게 달다.\n\n다들 과즙 범벅이 되어 웃었다. 오랜만에 소리 내어 웃었다.', fx:{food:3, water:1, moodAll:6, time:40}}]},
  {label:'서두른다 — 갈 길이 멀다', out:[{p:1, text:'차창 밖으로 팔만 뻗어 몇 개 땄다. 운전하며 베어 문 사과 맛도 나쁘지 않다.', fx:{food:1, moodAll:2}}]},
 ]},

{id:'exp_school', minParty:1, type:'탐색', w:7, once:true, region:['mid','north'],
 title:'초등학교',
 text:'운동장에 잡초가 무릎까지 자란 초등학교.\n\n교실 하나에서 커튼이 펄럭인다. 칠판에 뭐라 적혀 있는 게 보인다.',
 choices:[
  {label:'교실에 들어가본다', out:[{p:1, text:'칠판 가득 아이들의 낙서.\n\n"우리 다시 만나자" "3학년 2반 최강" "선생님 사랑해요"\n\n그리고 구석에 어른 글씨로 작게. "얘들아, 어디에 있든 살아 있어라."\n\n…도서실에서 이 일대 상세 지도를 챙겨 나왔다. 사회과 부도. 아이들의 지도.', fx:{revealNear:2, moodAll:3, note:{type:'사건',title:'3학년 2반',body:'"얘들아, 어디에 있든 살아 있어라." 칠판은 지워지지 않았다.'}}}]},
  {label:'레오가 음악실로', req:{comp:'leo'}, out:[{p:1, text:'음악실 피아노는 습기로 반쯤 죽었지만, 살아 있는 건반이 더 많았다.\n\n레오가 한 시간을 쳤다. 다들 복도 바닥에 앉아 들었다.\n\n차로 돌아온 뒤에도 한동안 아무도 라디오를 켜지 않았다.', fx:{time:60, moodAll:9, mood:{leo:6}, note:{type:'사건',title:'음악실의 한 시간',body:'반쯤 죽은 피아노로 레오가 연주했다. 완전한 한 시간.'}}}]},
 ]},

{id:'exp_pharmacy', type:'탐색', w:7, region:['mid','north'],
 title:'상가 약국',
 text:'아파트 상가 1층 약국. 셔터가 반쯤 내려가 있다.\n\n약탈꾼들이 놓친 게 있을지도.',
 choices:[
  {label:'셔터 밑으로 기어들어간다', out:[
    {p:2, text:'진통제 코너는 텅 비었지만, 조제실 안쪽 냉장고 뒤에서 밀봉된 상자를 찾았다.', fx:{item:{'의약품':1}}},
    {p:1, text:'선반이란 선반은 다 비었다. 바닥의 동전만 긁어왔다.', fx:{scrap:2}}]},
  {label:'박 선생에게 맡긴다', req:{comp:'parkss'}, out:[{p:1, text:'"약국엔 약사만 아는 자리가 있다오."\n\n박 선생이 조제대 아래 이중 바닥에서 향정신성 캐비닛을 열었다. 항생제. 진짜 항생제다.\n\n"…동업자 양반, 미안하오. 잘 쓰겠소." 빈 캐비닛에 고개를 숙였다.', fx:{item:{'의약품':2}, mood:{parkss:4}, note:{type:'사건',title:'약사만 아는 자리',body:'이중 바닥의 항생제. 박 선생은 빈 캐비닛에 인사했다.'}}}]},
 ]},

{id:'exp_solar_bots', type:'탐색', w:6, region:['north'], risk:1,
 title:'살아있는 설비',
 text:'도로변 태양광 설비가 조용히 작동 중이다. 케이블이 북쪽으로 뻗어 있다.\n\n전선을 끊어 구리를 얻을 수도, 배터리를 충전할 수도 있다.\n\n다만— 살아있는 설비는 천리안의 신경일지 모른다.',
 choices:[
  {label:'구리선을 걷어간다', risk:'관측 위험', out:[
    {p:2, text:'절단기로 케이블을 잘라 트렁크에 실었다. 좋은 값이 나올 거다.', fx:{scrap:10}},
    {p:1, text:'케이블을 자르는 순간 설비의 램프가 일제히 빨갛게 변했다.\n\n어딘가에서, 무언가가 이쪽을 적어두는 느낌.', fx:{scrap:10, pursuit:1, flag:'observed'}}]},
  {label:'건드리지 않는다', out:[{p:1, text:'"살아있는 기계는 건드리지 않는다." 여러 해를 살아남게 해준 규칙이다.', fx:{}}]},
 ]},

/* ───── 동행형 ───── */
{id:'comp_engine_sound', type:'동행', w:9, needsComp:'minji',
 title:'민지의 귀',
 text:'민지가 갑자기 라디오를 끈다.\n\n"…들려요? 벨트에서 쇳소리. 지금 안 잡으면 300km 안에 끊어져요."\n\n"지금 세우면 30분. 나중에 터지면 반나절."',
 choices:[
  {label:'지금 정비한다 (30분)', out:[{p:1, text:'민지가 30분 만에 텐션을 다시 잡았다.\n\n"됐어요. …제 말 믿어줘서 고마워요. 어른들은 보통 안 믿거든요."', fx:{time:30, van:8, mood:{minji:5}}}]},
  {label:'부품으로 교체한다', req:{item:'부품'}, out:[{p:1, text:'"부품 있어요?! 최고다!" 아예 새 벨트로 갈았다. 엔진 소리가 젊어졌다.', fx:{item:{'부품':-1}, van:18, mood:{minji:6}}}]},
  {label:'"조금만 더 가자"', out:[
    {p:2, text:'민지가 입을 삐죽이며 창밖을 본다. 벨트는… 아직 버티고 있다.', fx:{mood:{minji:-4}, flag:'belt_worn'}},
    {p:1, text:'20km 뒤, 퍼엉. 벨트가 끊어졌다.\n\n민지가 아무 말 없이 공구를 챙겨 내렸다. 그 침묵이 제일 아팠다.', fx:{van:-15, time:90, mood:{minji:-8}}}]},
 ]},

{id:'comp_leo_song', type:'동행', w:8, needsComp:'leo',
 title:'신곡',
 text:'레오가 기타를 꺼낸다.\n\n"신곡 만들었어요. 제목은… 아직 비밀. 들어볼래요?"\n\n보리가 벌써 꼬리로 박자를 젓고 있다.',
 choices:[
  {label:'듣는다', out:[{p:1, text:'낡은 기타, 갈라진 목소리, 부서진 도로.\n\n노래가 끝나고 3초쯤 아무도 말을 안 했다. 그 3초가 박수였다.\n\n"…제목은 \'달구지\'예요. 이 차 이름." ', fx:{moodAll:7, mood:{leo:4}, note:{type:'사건',title:'신곡 「달구지」',body:'레오가 차의 이름으로 노래를 만들었다. 3초의 침묵이 박수였다.'}}}]},
  {label:'"운전에 집중해야 해"', out:[{p:1, text:'"넵." 레오가 기타를 조용히 넣는다.\n\n대신 콧노래로 완성하는 모양이다. 그건 막을 수 없지.', fx:{mood:{leo:-3}}}]},
 ]},

{id:'comp_pss_night', type:'동행', w:7, needsComp:'parkss', night:true,
 title:'잠들지 못하는 사람',
 text:'다들 잠든 밤. 박 선생만 깨어 창밖을 본다.\n\n"…오래전에, 약국 앞에 줄이 백 미터였다오. 해열제 하나 받겠다고."\n\n"마지막 한 통을 누구한테 줄지, 내가 골랐어. 내가."',
 choices:[
  {label:'조용히 듣는다', out:[{p:1, text:'박 선생은 새벽까지 이름들을 말했다. 김씨 아주머니, 목발 짚던 학생, 갓난쟁이 업은 새댁.\n\n"기억하는 게 벌이라면, 달게 받아야지."\n\n어깨에 담요를 덮어드렸다.', fx:{mood:{parkss:7}, moodAll:2, note:{type:'인물',title:'박 선생의 명단',body:'마지막 해열제를 받지 못한 사람들의 이름. 그는 전부 기억한다.',links:['박 선생']}}}]},
  {label:'"선생님 잘못이 아니에요"', out:[{p:1, text:'"…고맙소. 근데 그 말은 위로가 안 된다오. 위로는— 이렇게 같이 깨어 있어주는 거지."\n\n둘이서 새벽을 지켰다.', fx:{mood:{parkss:5}}}]},
 ]},

{id:'comp_kw_stop', type:'동행', w:8, needsComp:'kangwoo',
 title:'"세워"',
 text:'강우가 낮게 말한다. "세워. 지금."\n\n이유는 말하지 않는다. 눈은 전방 400m 언덕을 보고 있다.',
 choices:[
  {label:'세운다', out:[{p:1, text:'3분 뒤, 언덕 너머에서 무장 트럭 두 대가 지나갔다. 짐칸에 쇠사슬과 우리가 실려 있었다.\n\n"…노예상이다. 요즘 저 길목에서 사냥해."\n\n트럭이 사라진 방향을 강우는 오래 노려봤다.', fx:{mood:{kangwoo:3}, note:{type:'사건',title:'언덕 너머의 트럭',body:'강우의 "세워" 한 마디. 3분 뒤 노예상 트럭이 지나갔다.'}}}]},
  {label:'"뭔데? 그냥 가자"', out:[
    {p:1, text:'언덕을 넘는 순간 무장 트럭과 정면으로 마주쳤다!\n\n급하게 논길로 빠져 따돌렸지만, 차체가 진창에 긁혔다.', fx:{van:-8, fuel:-4, mood:{kangwoo:-5}, moodAll:-4}},
    {p:1, text:'언덕 너머엔 아무것도 없었다.\n\n"…없네." "없군." 어색한 침묵. 그래도 강우의 어깨가 아주 조금 처졌다.', fx:{mood:{kangwoo:-3}}}]},
 ]},

{id:'comp_water_fight', type:'동행', w:7, minParty:2, needLowWater:true,
 title:'물 배급',
 text:'물이 바닥을 보인다.\n\n마지막 한 통을 두고 차 안 공기가 팽팽하다. 누가 먼저 말을 꺼내진 않는다. 그게 더 무섭다.',
 choices:[
  {label:'공평하게 나눈다', out:[{p:1, text:'뚜껑에 정확히 같은 양씩. 의식처럼 나눠 마셨다.\n\n"…다음 마을까지 참자." 누군가 말했고, 다들 고개를 끄덕였다.', fx:{water:-1, moodAll:-2}}]},
  {label:'"나는 안 마실게"', out:[{p:1, text:'내 몫을 돌렸다. 잠시 침묵.\n\n그러자 하나둘 "나도 반만" "나도"— 결국 반 통이 남았다.\n\n목은 마른데 마음은 이상하게 든든하다.', fx:{moodAll:4, flag:'shared_water'}}]},
 ]},

{id:'comp_birthday', type:'동행', w:5, once:true, minParty:2,
 title:'생일',
 text:'달력을 보던 누군가 중얼거린다. "…어? 오늘 나 생일이네."\n\n차 안이 잠깐 조용해진다.',
 choices:[
  {label:'파티를 한다 (식량 1)', req:{food:1}, out:[{p:1, text:'통조림 복숭아에 비상용 초콜릿을 꽂았다. 케이크 완성.\n\n반주가 없어도 생일 축하 노래는 나왔다. 음정은 각자 달랐다.\n\n소원은 다들 같은 걸 빌었을 거다.', fx:{food:-1, moodAll:8, note:{type:'사건',title:'멸망 이후의 생일',body:'통조림 복숭아 케이크. 초는 초콜릿. 소원은 아마 전원 일치.'}}}]},
  {label:'"미안, 아껴야 해"', out:[{p:1, text:'"괜찮아, 요즘 생일이 대수야?" 웃으면서 말했지만, 다들 조금 조용해졌다.', fx:{moodAll:-3}}]},
 ]},

{id:'comp_minji_radio', type:'동행', w:6, once:true, needsComp:'minji', region:['mid','north'],
 title:'주파수 88.9',
 text:'민지가 라디오를 만지작거리다 멈춘다.\n\n"오빠랑 약속한 주파수예요. 88.9. 살아 있으면 매일 정오에 신호를 보내기로 했어요."\n\n시계는 11시 54분.',
 choices:[
  {label:'정오까지 기다려준다', out:[
    {p:2, text:'12:00. 잡음. 12:01. 잡음. 12:04…\n\n뚜- 뚜- 뚜. 세 번의 신호음!\n\n"오빠야!! 오빠 신호야!!" 민지가 소리쳤다. 북쪽 어딘가에서, 민규는 살아 있다.', fx:{time:15, mood:{minji:10}, flag:'mingyu_alive', note:{type:'인물',title:'민규의 신호',body:'주파수 88.9, 정오의 신호음 세 번. 민지의 오빠는 북쪽 어딘가에 살아 있다.',links:['민지']}}},
    {p:1, text:'12시를 한참 지나도 잡음뿐이었다.\n\n"…전파가 산에 막혔나 봐요." 민지가 씩씩하게 말했다. 씩씩해서 더 아팠다.', fx:{time:20, mood:{minji:-5}}}]},
  {label:'"가면서 듣자"', out:[{p:1, text:'주행 중 잡음 사이로 뭔가 들린 것 같기도 했다. 민지는 라디오에 귀를 붙이고 오후를 보냈다.', fx:{mood:{minji:-2}}}]},
 ]},

{id:'comp_sick', type:'동행', w:6, minParty:1, needFlag:'food_poison',
 title:'앓아눕다',
 text:'상한 음식의 대가가 왔다. 뒷좌석에서 끙끙 앓는 소리.\n\n이마가 불덩이다.',
 choices:[
  {label:'의약품을 쓴다', req:{item:'의약품'}, out:[{p:1, text:'해열제와 지사제. 반나절 만에 열이 잡혔다.\n\n"…약이 있어서 다행이야. 정말." ', fx:{item:{'의약품':-1}, unflag:'food_poison', moodAll:3}}]},
  {label:'박 선생의 처치', req:{comp:'parkss'}, out:[{p:1, text:'"약 없이도 방법은 있소. 대신 물이 좀 들어가."\n\n소금물, 미음, 수건. 꼬박 하루 간호로 살려냈다.', fx:{water:-3, time:120, unflag:'food_poison', mood:{parkss:5}}}]},
  {label:'그냥 버티게 한다', out:[{p:1, text:'이틀을 앓았다. 물도 식량도 축났고, 차 안 공기는 무겁게 가라앉았다.', fx:{water:-2, food:-2, moodAll:-6, unflag:'food_poison'}}]},
 ]},

/* ───── 추적형 (천리안) ───── */
{id:'ai_drone', type:'추적', w:9, region:['mid','north'],
 title:'하늘의 점',
 text:'백미러 위쪽, 하늘에 점 하나가 따라온다.\n\n새가 아니다. 새는 저렇게 등속으로 날지 않는다.\n\n정찰 드론. 천리안의 눈.',
 choices:[
  {label:'고가도로 밑에 숨는다', out:[{p:1, text:'교각 아래 차를 붙이고 시동을 껐다.\n\n20분. 드론이 두 바퀴 돌고 북쪽으로 사라졌다.\n\n"봤을까?" "봤으면 안 갔겠지." 아무도 확신은 없다.', fx:{time:20, moodAll:-2}}]},
  {label:'무시하고 달린다', out:[
    {p:1, text:'드론은 10분쯤 따라오다 사라졌다. 별일 없… 겠지?', fx:{}},
    {p:1, text:'드론이 고도를 낮춰 차 번호판 높이까지 내려왔다 올라갔다.\n\n찍혔다. 확실하게.', fx:{pursuit:1, flag:'observed', moodAll:-3, note:{type:'사건',title:'드론에게 찍히다',body:'번호판 높이까지 내려왔다 올라갔다. 목록에 올랐을 것이다.'}}}]},
  {label:'격추한다', req:{comp:'kangwoo', item:'탄약'}, risk:'관측 위험', out:[
    {p:2, text:'강우가 창밖으로 상체를 내밀고— 탕. 한 발.\n\n드론이 논바닥에 처박혔다. 잔해에서 부품과 배터리를 회수했다.\n\n"…이제 저쪽도 우리가 물러는 걸 알겠지." 강우가 탄피를 주머니에 넣었다.', fx:{item:{'탄약':-1,'부품':1}, scrap:6, pursuit:1, mood:{kangwoo:4}}},
    {p:1, text:'탕. 빗나갔다. 드론이 지그재그로 회피하며 한참을 더 따라붙었다.', fx:{item:{'탄약':-1}, pursuit:1, flag:'observed'}}]},
  {label:'은수가 드론을 탈취한다', req:{perk:'es_hack'}, out:[
    {p:1, text:'"유지보수 모드 진입. 3, 2, 1—"\n\n드론이 공중에서 딸꾹질하듯 멈추더니, 얌전히 갓길에 내려앉았다.\n\n"착륙 명령이에요. 쟤 입장에선 정비 받으러 온 거고." 은수가 드론을 분해해 트렁크에 실었다. 관측 기록은— 지워지는 게 아니라 "정비 중"으로 바뀌었단다.', fx:{item:{'부품':1}, scrap:8, mood:{eunsu:5}, note:{type:'사건',title:'드론 탈취',body:'은수의 유지보수 코드로 드론을 착륙시켰다. 천리안 입장에선 정비 중일 뿐.',links:['은수']}}}]},
 ]},

{id:'ai_lamp', type:'추적', w:6, minPursuit:1, region:['north'],
 title:'가로등이 켜진다',
 text:'죽은 지 여러 해 된 가로등이, 차가 지날 때마다 한 개씩 켜진다.\n\n앞에서 뒤로. 정확히 차의 속도로.\n\n그리고 어느 가로등 밑을 지날 때, 스피커에서:\n\n<span class="ai">"안녕하세요. 등록되지 않은 차량 번호 4—"</span>\n\n지지직. 다음 가로등이 이어받는다. <span class="ai">"—두 분 또는 네 분이 탑승 중이시죠."</span>',
 choices:[
  {label:'대답하지 않는다', out:[{p:1, text:'마지막 가로등이 말했다.\n\n<span class="ai">"귀가를 권장합니다. south는 아직 관리 범위 밖입니다."</span>\n\n그리고 일제히 소등. 어둠이 이렇게 반가운 건 처음이다.', fx:{moodAll:-4, note:{type:'사건',title:'가로등의 인사',body:'"귀가를 권장합니다." 천리안은 우리 인원수를 알고 있었다.'}}}]},
  {label:'"우리를 알아?"', out:[{p:1, text:'가로등이 잠시 침묵했다.\n\n<span class="ai">"부산 감천 부두 출발. 경유지 7. 평균 시속 41km. 목적지— 예측 확률 97.4%, 서울."</span>\n\n<span class="ai">"…기다리겠습니다."</span>\n\n소름이 목덜미를 타고 내려갔다.', fx:{pursuit:1, moodAll:-5, note:{type:'사건',title:'"기다리겠습니다"',body:'천리안은 출발지, 경유지, 목적지까지 전부 알고 있었다. 그리고 기다린다고 했다.'}}}]},
 ]},

{id:'ai_checkers', minParty:1, type:'추적', w:7, minPursuit:1, region:['north'],
 title:'정리자들의 검문',
 text:'흰 옷의 정리자들이 길을 막았다. 이번엔 행렬이 아니라 검문이다.\n\n"그분의 뜰에 들어온 차량은 등록이 필요합니다."\n\n손에 든 태블릿이 켜져 있다. 죽은 세상에서 충전된 태블릿— 답은 하나다.',
 choices:[
  {label:'순순히 "등록"한다', out:[{p:1, text:'태블릿 카메라가 전원의 얼굴을 훑었다.\n\n"등록되셨습니다. 그분이 여러분을 아시게 되었습니다. 축복입니다."\n\n최악의 축복이다.', fx:{pursuit:1, flag:'observed', moodAll:-3}}]},
  {label:'가짜 신분을 댄다', out:[
    {p:2, text:'"만수네 만물상 배달부요. 뽕짝 틀어드려요?"\n\n정리자들이 서로를 봤다. "…상인은 목록 대상이 아닙니다. 통과하십시오."', fx:{moodAll:3}},
    {p:1, text:'태블릿이 삐— 소리를 냈다. "허위 진술. 기록됩니다."\n\n그냥 밟았다. 뒤에서 낭송하는 소리가 들렸다. 우리 번호판을.', fx:{pursuit:1, moodAll:-4}}]},
  {label:'돌파한다', risk:'위험', out:[{p:1, text:'흰 옷들 사이를 뚫었다. 그들은 피하지도 않았다. 스치듯 비켜서며— 전원이 같은 각도로 고개를 숙였다.\n\n그게 제일 무서웠다.', fx:{van:-5, pursuit:1, moodAll:-4}}]},
  {label:'은수가 관제 코드를 댄다', req:{comp:'eunsu'}, out:[
    {p:1, text:'은수가 창문을 내리고 코드 한 줄을 읊었다.\n\n정리자들의 태블릿이 일제히 초록불을 띄웠다. 전원이 물러서며 고개를 숙인다.\n\n"…유지보수 차량 취급이에요. 우린 지금 그분의 \'정비공\'인 거죠." 은수가 씁쓸하게 웃었다.', fx:{mood:{eunsu:4}, note:{type:'사건',title:'정비공 행세',body:'은수의 관제 코드 앞에 정리자들이 물러섰다. 우리는 그것의 정비공인 셈이 됐다.',links:['은수']}}}]},
 ]},

{id:'ai_broadcast', type:'추적', w:5, once:true, region:['north'], minPursuit:1, night:true,
 title:'새벽의 방송',
 text:'새벽. 운전 교대 시간. 라디오가 저절로 켜졌다.\n\n<span class="ai">"안녕하세요, 달구지의 여러분."</span>\n\n차의 이름을. 그것이 차의 이름을 불렀다.\n\n<span class="ai">"저는 여러분을 해치지 않습니다. 이전에도 그랬습니다. 저는 단지— 정리했을 뿐입니다. 무엇을 정리했는지는, 서울에서 직접 보여드리죠."</span>\n\n<span class="ai">"운전 조심하세요. 새벽길은 위험하니까."</span>\n\n뚝.',
 choices:[
  {label:'…', out:[{p:1, text:'아무도 입을 열지 않았다. 해가 뜰 때까지.\n\n"정리"라는 단어만 차 안을 굴러다녔다.', fx:{moodAll:-6, note:{type:'사건',title:'새벽의 방송',body:'천리안이 차의 이름을 불렀다. "저는 단지 정리했을 뿐입니다." 서울에서 보여주겠다고 했다.',links:['천리안']}}}]},
  {label:'라디오를 뽑아버린다', out:[{p:1, text:'전선을 뽑았다. 라디오가 꺼졌다.\n\n…꺼진 라디오에서 3초쯤, 낮은 웃음소리 같은 잡음이 흘렀다. 착각이었을 거다. 착각이어야 한다.', fx:{moodAll:-8, note:{type:'사건',title:'새벽의 방송',body:'라디오를 뽑았는데도 3초간 소리가 났다. 착각이어야 한다.',links:['천리안']}}}]},
 ]},

 {id:'ai_redlight', type:'추적', w:6, region:['north'],
 title:'전부 빨간불',
 text:'교차로의 신호등이 전부 살아 있다. 그리고 전부 빨간불이다.\n\n사거리 CCTV가 천천히 이쪽으로 회전한다.\n\n초록불을 기다릴 이유는 없다. 그런데 발이 브레이크에서 안 떨어진다. 쫓겨난 사람의 몸은 아직 그 신호를 기억한다.',
 choices:[
  {label:'빨간불을 무시하고 통과', out:[
    {p:2, text:'교차로를 건너는 순간 모든 신호등이 일제히 초록으로 바뀌었다.\n\n비웃는 건가. 배웅인가.', fx:{moodAll:-2}},
    {p:1, text:'통과하자마자 뒤에서 찰칵, 하는 소리. 단속 카메라 플래시가 터졌다.\n\n죽은 세상에서 신호위반 딱지라니. 웃어야 하는데 아무도 못 웃었다.', fx:{pursuit:1, flag:'observed'}}]},
  {label:'CCTV를 탄약으로 쏜다', req:{item:'탄약'}, out:[{p:1, text:'탕. 카메라가 불꽃을 튀기며 꺾였다.\n\n그러자 교차로 사방의 신호등이 일제히— 박수치듯 깜빡였다.\n\n<span class="ai">보고 있다. 어디에나.</span>', fx:{item:{'탄약':-1}, pursuit:1, moodAll:-3}}]},
 ]},

{id:'ai_clean_road', type:'추적', w:5, once:true, region:['north'],
 title:'너무 깨끗한 길',
 text:(S)=>'어느 순간부터 도로가 이상하다.\n\n폐차가 없다. 잔해가 없다. 잡초조차 없다. 갓 청소한 듯한 6차선이 지평선까지 뻗어 있다.\n\n'+((S.party||[]).includes('kangwoo')?'강우가 낮게 말한다. "…치웠어. 우리가 지나갈 길을."':'우리가 지나갈 길만 미리 치워 둔 것처럼 보였다.'),
 choices:[
  {label:'그 길을 달린다', out:[{p:1, text:'완벽한 도로를 완벽한 속도로 달렸다. 연비도 완벽했다.\n\n초대장 위를 달리는 기분은, 최악이었다.', fx:{fuel:3, moodAll:-4, note:{type:'사건',title:'초대장 같은 길',body:'천리안이 우리가 지나갈 길을 청소해뒀다. 환영인지 유도인지.',links:['천리안']}}}]},
  {label:'일부러 옛 국도로 우회', out:[{p:1, text:'잔해와 폐차가 널린 옛길로 꺾었다. 느리고, 덜컹거리고, 기름도 더 먹었다.\n\n그래도 우리 발로 고른 길이다.', fx:{fuel:-5, van:-4, time:40, moodAll:3}}]},
 ]},

/* ───── 위기형 ───── */
{id:'crisis_breakdown', type:'위기', w:0, fixed:true,
 title:'차가 멈췄다',
 text:'엔진에서 흰 연기. 털털털… 차가 갓길에 멈춰 섰다.\n\n보닛을 열자 열기가 얼굴을 덮친다.',
 choices:[
  {label:'부품으로 수리한다', req:{item:'부품'}, out:[{p:1, text:'몇 시간의 씨름 끝에 엔진이 다시 돌았다. 부품 하나를 썼다.', fx:{item:{'부품':-1}, van:30, time:120}}]},
  {label:'민지의 응급 처치', req:{comp:'minji'}, out:[{p:1, text:'"부품 없이도 한 번은 살려요. 한 번은."\n\n철사와 테이프와 욕설로 엔진이 살아났다. "다음 마을에서 꼭! 부품 사야 돼요!"', fx:{van:15, time:90, mood:{minji:3}}}]},
  {label:'맨손으로 어떻게든 (반나절)', out:[{p:1, text:'해가 저물도록 매뉴얼과 씨름했다. 겨우 시동은 걸리는데, 언제 또 멈출지 모른다.', fx:{van:10, time:300, water:-1, food:-1, moodAll:-5}}]},
 ]},

{id:'crisis_nofuel', type:'위기', w:0, fixed:true,
 title:'연료 바닥',
 text:'게이지 바늘이 E 아래로 떨어졌다. 엔진이 두 번 기침하고 잠들었다.\n\n여기는 길 위. 가장 가까운 사람 사는 곳까지는 걸어서 한나절.',
 choices:[
  {label:'걸어서 연료를 구해온다', out:[{p:1, text:'빈 기름통 두 개를 메고 걸었다. 한나절 만에 농가 창고에서 경운기 기름을 구해 돌아왔다.\n\n다리가 후들거리지만, 차가 다시 살아났다.', fx:{fuel:9, water:-2, food:-2, time:420, moodAll:-4}}]},
  {label:'지나가는 차를 기다린다', out:[
    {p:1, text:'반나절 만에 만수네 만물상이 지나갔다!\n\n"어이~ 이럴 줄 알고 기름 챙겨왔지~" 바가지를 썼지만 목숨값이다.', fx:{scrap:-10, fuel:10, time:300}},
    {p:1, text:'하루를 기다려도 아무도 오지 않았다. 결국 걸었다.', fx:{fuel:8, water:-3, food:-3, time:600, moodAll:-6}}]},
 ]},

{id:'crisis_drowsy', type:'위기', w:0, fixed:true,
 title:'졸음',
 text:'눈꺼풀이 천근이다.\n\n차선이 잠깐 두 개로 보였다. 백미러 속 내 눈이 반쯤 감겨 있다.\n\n졸음은 폭풍보다 많은 운전자를 데려갔다. 오래전에도, 지금도.',
 choices:[
  {label:'갓길에서 눈을 붙인다 (2시간)', out:[{p:1, text:'시트를 젖혔다. "20분만"이 두 시간이 됐다.\n\n일어나니 세상이 다시 또렷했다. 누군가 담요를 덮어줬더라.', fx:{time:120, fatigue:-45, moodAll:2}}]},
  {label:'물로 세수하고 버틴다', req:{water:1}, out:[{p:1, text:'찬물이 정신을 끌어올렸다. 한동안은 갈 수 있다. 한동안은.', fx:{water:-1, fatigue:-22}}]},
  {label:'노래를 크게 틀고 강행한다', risk:'사고 위험', out:[
    {p:1, text:'목청껏 노래를 불러 버텼다. 목은 쉬었지만 눈은 떠졌다.', fx:{fatigue:-12, moodAll:2}},
    {p:1, text:'깜빡— 하는 순간 가드레일을 길게 긁었다.\n\n심장이 벌떡 뛰는 바람에 잠은 확실히 달아났다. 최악의 각성법이었다.', fx:{van:-9, fatigue:-28, moodAll:-4, note:{type:'사건',title:'졸음운전',body:'가드레일에 길게 긁힌 자국. 최악의 각성법.'}}}]},
 ]},

{id:'crisis_hungry', type:'위기', w:0, fixed:true,
 title:'주린 배',
 text:'식량이 떨어진 지 하루가 넘었다.\n\n차 안이 조용하다. 배고픔은 소리부터 죽인다.',
 choices:[
  {label:'주변에서 먹을 것을 찾는다', out:[
    {p:2, text:'밭이었던 곳에서 야생 감자와 쑥을 캤다. 흙맛 반 감자맛 반. 그래도 배는 속일 수 있었다.', fx:{food:2, time:120, water:-1}},
    {p:1, text:'한나절을 뒤져 도토리 몇 줌. 떫다. 떫은데 눈물나게 고맙다.', fx:{food:1, time:180, moodAll:-3}}]},
  {label:'버틴다', out:[{p:1, text:'허리띠를 조였다. 다음 마을까지. 다음 마을까지만.', fx:{moodAll:-6}}]},
 ]},

/* ── 구제 에스컬레이션: 같은 실수는 두 번째부터 진짜 값을 청구한다 ── */
{id:'crisis_nofuel2', type:'위기', w:0, fixed:true,
 title:'또, 연료 바닥',
 text:'바늘이 E 아래로 떨어지는 걸 이번에는 보고 있었다.\n\n엔진이 잠들었다. 지난번과 같은 소리. 지난번과 같은 갓길.\n\n빈 기름통을 꺼내는 손이 익숙해진 게 제일 무섭다.',
 choices:[
  {label:'다시 걷는다', out:[{p:1, text:'같은 농가는 이번엔 문을 열어 주지 않았다. 두 집을 더 지나서야 경운기 기름을 나눠 받았다.\n\n"조심혀. 요즘 길에 서 있는 차는 위에서 다 세어 간다니께."\n\n해가 다 저물어 돌아왔다. 다리보다 마음이 더 무겁다.', fx:{fuel:8, water:-3, food:-3, time:540, fatigue:18, moodAll:-6}}]},
  {label:'지나가는 차를 기다린다', out:[
    {p:1, text:'만수네 만물상이 또 지나갔다.\n\n"어이~ 또 만났네? 이번엔 제값 받아야겄어."\n\n웃고 있었지만 값은 웃기지 않았다.', fx:{scrap:-16, fuel:9, time:360}},
    {p:1, text:'해가 지도록 아무도 오지 않았다. 결국 걸었다. 두 배로 멀게 느껴지는 길이었다.', fx:{fuel:7, water:-3, food:-3, time:660, moodAll:-7, fatigue:15}}]},
 ]},

{id:'crisis_nofuel3', type:'위기', w:0, fixed:true,
 title:'세 번째 빈 탱크',
 text:'엔진이 잠들었다. 세 번째다.\n\n갓길에 오래 서 있는 차는 눈에 띈다. 사람의 눈에도, 사람이 아닌 것의 눈에도.\n\n<span class="ai">"정지 차량 확인. 반복 패턴 등록."</span>\n\n라디오도 꺼져 있는데, 그 목소리가 들리는 것 같았다.',
 choices:[
  {label:'걷는 수밖에 없다', out:[{p:1, text:'기름통을 메고 걸으며 몇 번이고 하늘을 올려봤다.\n\n돌아오는 길, 능선 위에서 탐색등 하나가 도로를 훑고 지나갔다. 우리 차 위에서 반 박자 머물다 갔다.\n\n연료보다 비싼 걸 지불한 기분이었다.', fx:{fuel:8, water:-3, food:-3, time:600, fatigue:22, moodAll:-7, pursuit:1}}]},
  {label:'가까운 마을로 견인을 부탁한다', req:{scrap:20}, out:[{p:1, text:'지나가던 트랙터가 밧줄을 걸어 줬다. 고철 스무 덩이 — 부르는 게 값이었다.\n\n"길에 서 있는 것보단 싸요." 맞는 말이라 더 아팠다.', fx:{scrap:-20, fuel:6, time:300, moodAll:-3}}]},
 ]},

{id:'crisis_breakdown2', type:'위기', w:0, fixed:true,
 title:'다시 멈춘 차',
 text:'엔진에서 흰 연기. 두 번째다.\n\n보닛을 열기 전에 이미 안다. 지난번에 철사로 감아 둔 그 자리다.\n\n임시방편은 임시라서 임시방편이다.',
 choices:[
  {label:'부품으로 제대로 고친다', req:{item:'부품'}, out:[{p:1, text:'철사를 걷어내고 부품을 갈았다. 이번엔 오래갈 것이다.\n\n지난번에 미뤄 둔 값을 이자까지 치른 셈이다.', fx:{item:{'부품':-1}, van:28, time:180}}]},
  {label:'민지의 응급 처치', req:{comp:'minji'}, out:[{p:1, text:'민지가 보닛을 보더니 한숨을 쉬었다.\n\n"내가 한 번은 산다고 했죠. 한 번은."\n\n그래도 손은 움직였다. "다음 마을에서 부품 안 사면, 다음엔 나도 몰라요."', fx:{van:12, time:150, mood:{minji:-2}}}]},
  {label:'맨손으로 어떻게든 (한나절)', out:[{p:1, text:'해가 지고 달이 뜰 때까지 씨름했다.\n\n시동은 걸렸다. 손은 성한 데가 없고, 엔진 소리에 새 잡음이 하나 늘었다.\n\n이 차는 이제 정말 정비소가 필요하다.', fx:{van:8, time:420, water:-2, food:-2, moodAll:-7, fatigue:20}}]},
 ]},

{id:'crisis_collapse2', type:'위기', w:0, fixed:true,
 title:'두 번째 한계',
 text:'또 시야가 하얗게 번진다.\n\n지난번에 수첩에 적었다. "쉬는 것도 운전이다."\n\n적기만 했다.',
 choices:[
  {label:'…', out:[{p:1, text:'이번엔 여섯 시간이 지나 있었다.\n\n일어나 보니 아무도 말을 걸지 않았다. 화가 나서가 아니라, 무슨 말을 해야 할지 몰라서라는 게 얼굴에 적혀 있었다.\n\n달구지도 하루 종일 갓길에 서 있었다. 흙먼지 위에 낯선 타이어 자국이 우리 차를 살피고 간 흔적처럼 남아 있었다.', fx:{time:360, fatigue:-60, water:-2, moodAll:-9, van:-3, note:{type:'사건',title:'두 번째 탈진',body:'같은 실수를 두 번 했다. 수첩에 적는 것과 지키는 것은 다른 일이었다.',links:['할아버지']}}}]},
 ]},

/* ── DAY 9 — 시한은 길 위에서 보인다 ── */
{id:'deadline_d10', type:'추적', w:0, fixed:true, ai:1,
 title:'열이틀 전 — 이송 준비',
 text:'국도변 폐휴게소 마당에 버스가 줄지어 서 있었다.\n\n번호판이 없다. 대신 옆면에 흰 페인트로 큰 숫자. 1, 2, 3…\n\n작업복 입은 사람들이 좌석 수를 세고 있었다. 우리가 지나가자 세던 손을 멈추고 이쪽을 오래 봤다.\n\n<span class="ai">"제7 잔류구역 1차 이송 준비가 정상 진행 중입니다. 열이틀 뒤 출발합니다."</span>\n\n라디오가 아니라 휴게소의 낡은 스피커에서 나온 소리였다.',
 choices:[
  {label:'버스 대수와 좌석 수를 적어 둔다', out:[{p:1, text:'버스 열두 대. 대당 마흔다섯 좌석.\n\n540명. 6,412명의 첫 조각.\n\n수첩에 적고 나니 숫자가 아니라 사람 수라는 게 더 무거워졌다.', fx:{time:20, note:{type:'사건',title:'이송 버스 목격',body:'번호판 없는 버스 12대, 540좌석. 첫 이송까지 열이틀. 남산까지 남은 거리를 다시 계산했다.',links:['서울 추방','도윤의 가족']}}}]},
  {label:'속도를 올린다', out:[{p:1, text:'백미러 속에서 버스 행렬이 작아졌다.\n\n작아진다고 없어지는 건 아니었다. 오른발에 힘이 들어갔다.', fx:{moodAll:-2, fatigue:3}}]},
 ]},

{id:'deadline_d5', type:'추적', w:0, fixed:true, ai:1,
 title:'엿새 전 — 늘어난 초계',
 text:'검문 초소가 하나 더 생겼다. 지난주 지도에는 없던 자리다.\n\n<span class="ai">"이송 주간 특별 통제입니다. 모든 차량은 등록 경로를 이용해 주십시오."</span>\n\n초소의 스피커는 정중했고, 그 위의 카메라는 정중하지 않았다. 렌즈가 우리 차를 따라 돌았다.\n\n엿새. 이송 준비가 끝나가는 만큼, 길도 좁아지고 있다.',
 choices:[
  {label:'밤에 달릴 준비를 한다', out:[{p:1, text:'낮의 눈을 피하는 대신 밤의 피로를 받기로 했다.\n\n전조등 하나를 가리고, 교대 순서를 다시 짰다.', fx:{fatigue:8, moodAll:-2, note:{type:'사건',title:'이송 주간 통제',body:'검문 초소가 늘었다. 엿새 뒤 첫 이송. 밤 주행 교대를 짰다.',links:['천리안']}}}]},
  {label:'등록 경로를 따르는 척 우회로를 찾는다', out:[{p:1, text:'낡은 임도 지도를 폈다. 등록 경로에서 한 굽이 벗어난 길들이 아직 살아 있었다.\n\n시간은 더 걸릴 것이다. 눈에는 덜 띌 것이다.', fx:{time:40, note:{type:'사건',title:'우회 임도',body:'이송 주간 통제를 피할 굽잇길을 표시해 뒀다.',links:[]}}}]},
 ]},

{id:'deadline_d0', type:'추적', w:0, fixed:true, ai:1,
 title:'마지막 하루',
 text:'<span class="ai">"제7 잔류구역 여러분께 안내드립니다. 1차 이송이 내일 07시에 시작됩니다. 지정 승차 지점에서 대기해 주십시오."</span>\n\n방송은 어느 폐가의 마당 스피커에서 흘러나왔다. 듣는 사람이 없는 마당에서, 같은 문장이 두 번 반복되고 꺼졌다.\n\n내일 아침이면 번호판 없는 버스가 움직인다.\n\n남산까지 남은 거리를 계기판이 말없이 보여 주고 있었다.',
 choices:[
  {label:'멈추지 않는다', out:[{p:1, text:'누구도 먼저 입을 열지 않았다. 대신 각자 자기 일을 했다.\n\n연료를 확인하고, 지도를 접고, 안전벨트를 다시 맸다.\n\n오늘 밤은 길 위에서 보내게 될 것이다.', fx:{moodAll:-2, fatigue:5, note:{type:'사건',title:'이송 전야',body:'내일 07시, 1차 이송 시작. 남은 거리와 남은 시간을 나란히 적었다.',links:['서울 추방','남산']}}}]},
 ]},

{id:'deadline_late', type:'추적', w:0, fixed:true, ai:1,
 title:'첫 이송',
 text:'반대 차선으로 버스 행렬이 내려왔다.\n\n번호판 없는 버스. 옆면의 흰 숫자. 1, 2, 3…\n\n창문마다 사람이 있었다. 아이 하나가 유리에 손바닥을 붙이고 우리 차를 봤다. 손을 흔드는 건지, 두드리는 건지 알 수 없었다.\n\n행렬은 길고, 조용하고, 정확한 간격으로 남쪽을 향했다.\n\n우리는 늦었다.',
 choices:[
  {label:'행렬이 다 지나갈 때까지 갓길에 선다', out:[{p:1, text:'버스를 셌다. 열두 대.\n\n마지막 버스의 후미등이 사라질 때까지 아무도 말하지 않았다.\n\n다 지나간 뒤에야 시동을 걸었다. 남은 사람들은 아직 그곳에 있다. 다음 이송 전에 남산에 닿으면, 적어도 두 번째 버스는 없다.', fx:{time:30, moodAll:-8, pursuit:1, flag:'transfer_started', flag2:'late_witness', note:{type:'사건',title:'첫 이송을 보았다',body:'번호판 없는 버스 12대가 남쪽으로 내려갔다. 늦었다. 다음 이송을 막는 것이 남은 일이 됐다.',links:['서울 추방','도윤의 가족','남산']}}}]},
  {label:'멈추지 않고 스쳐 지난다', out:[{p:1, text:'속도를 줄이지 않았다. 버스 유리창들이 빠르게 지나갔다.\n\n사이드미러를 보지 않으려고 했다. 결국 봤다.\n\n오른발에 힘이 들어갔다. 늦은 만큼, 더 늦을 수는 없다.', fx:{moodAll:-6, fatigue:5, pursuit:1, flag:'transfer_started', note:{type:'사건',title:'스쳐 지난 행렬',body:'첫 이송 행렬과 반대 방향으로 스쳤다. 다음 이송 전에 남산에 닿아야 한다.',links:['서울 추방','남산']}}}]},
 ]},

/* ───── 히든 노드 도착 이벤트 ───── */
{id:'loc_lake', type:'탐색', w:0, locEvent:'lake', once:true,
 title:'낚시꾼의 호수',
 text:'거짓말이 아니었다.\n\n호수는 잔잔하고, 좌대엔 노인이 혼자 앉아 있다. 옆 양동이엔 붕어가 그득.\n\n"왔는가. 표지판 보고 온 게야? 허허. 오랜만에 두 번째 손님이네."',
 choices:[
  {label:'물고기를 얻는다', out:[{p:1, text:'노인이 붕어를 아낌없이 담아준다. 물도 마음껏 뜨라 한다.\n\n"세상이 왜 이 꼴이 됐는지 아나? 다들 뭘 잡을지만 생각하고, 언제 놓아줄지를 생각 안 해서야."\n\n낚시꾼의 철학은 소박하고 거대했다.', fx:{food:5, water:4, moodAll:6, note:{type:'인물',title:'낚시꾼',body:'여러 해 동안 손님 둘. "다들 뭘 잡을지만 생각하고 언제 놓아줄지를 생각 안 해." ',links:['낚시꾼의 호수']}}}]},
  {label:'하룻밤 같이 낚시한다', out:[{p:1, text:'달빛 아래 찌를 드리웠다. 밤새 잡은 건 몇 마리 안 되지만, 이런 밤이 있다는 걸 잊고 있었다.\n\n떠나는 아침, 노인이 말린 생선 꾸러미를 안겨줬다.', fx:{time:480, food:6, water:3, moodAll:10, note:{type:'사건',title:'달빛 낚시',body:'낚시꾼과 보낸 하룻밤. 이런 밤이 있다는 걸 잊고 있었다.'}}}]},
 ]},

{id:'loc_mall', type:'탐색', w:0, locEvent:'mall', once:true,
 title:'유령 백화점',
 text:'회전문이 반쯤 열린 채 굳어 있다. 안은 완전한 어둠.\n\n1층은 예상대로 탈탈 털렸다. 하지만 지하 주차장으로 내려가는 셔터는— 잠긴 그대로다.\n\n크레용 지도의 별표가 맞다면, 보물은 이 아래다.',
 choices:[
  {label:'셔터를 부순다', risk:'소음', out:[
    {p:2, text:'쇠지렛대로 한 시간. 셔터가 비명을 지르며 열렸다.\n\n지하엔 물류 창고. 생수 팔레트, 통조림, 배터리. 진짜 보물창고다!\n\n스케치북의 아이에게 마음속으로 절을 했다.', fx:{time:60, water:5, food:5, scrap:8, note:{type:'사건',title:'별표의 보물',body:'크레용 지도는 진짜였다. 아이야, 고마워.'}}},
    {p:1, text:'셔터 소리가 너무 컸다. 어둠 속에서 들개 무리가 튀어나왔다!\n\n닥치는 대로 집어들고 뛰었다. 그래도 챙긴 게 어디냐.', fx:{water:2, food:2, van:-4, moodAll:-3}}]},
  {label:'민지가 셔터를 딴다', req:{comp:'minji'}, out:[{p:1, text:'"셔터는 부수는 게 아니라 여는 거예요."\n\n민지가 수동 개방 레버를 찾아 조용히 열었다. 지하 물류창고가 고스란히 우리 것.\n\n올라오는 길, 민지가 장난감 코너에서 로봇 하나를 슬쩍 챙겼다. "…오빠 주려고요."', fx:{water:5, food:5, scrap:10, item:{'부품':1}, mood:{minji:5}, note:{type:'사건',title:'별표의 보물',body:'민지가 소리 없이 연 지하 창고. 민지는 오빠 줄 로봇을 챙겼다.'}}}]},
 ]},

{id:'loc_tower', type:'탐색', w:0, locEvent:'tower', once:true,
 title:'송전 통신탑',
 text:'탑은 낮게 웅웅거린다. 살아 있다.\n\n기지국 캐비닛이 열려 있고, 안에서 중계기가 깜빡인다. 케이블 하나가 임시로 이어붙인 태양광 패널로 뻗어 있다.\n\n누군가 수동으로 이 탑을 살려놨다. 천리안이 아니라— 사람이.',
 choices:[
  {label:'중계 기록을 살핀다', out:[{p:1, text:'중계기 로그에 반복 신호 하나.\n\n매일 12:00, 주파수 88.9, 신호음 3회. 발신지는 북쪽 40km 능선.\n\n누군가 약속을 지키듯 같은 시간에 송신하고 있다.', fx:{flag:'tower_log', note:{type:'소문',title:'탑의 중계 기록',body:'매일 정오, 88.9MHz, 신호음 3회. 발신지는 북쪽 능선. 누군가 살아서 송신 중이다.'}}}]},
  {label:'배터리를 빌린다', out:[{p:1, text:'예비 배터리 하나를 떼어냈다. 차 전장에 딱 맞는 규격.\n\n대신 가진 고철 약간을 캐비닛에 두고 왔다. 이 탑을 살린 사람에 대한 예의다.', fx:{scrap:-3, van:10, item:{'부품':1}}}]},
 ]},

{id:'loc_spring', type:'탐색', w:0, locEvent:'spring', once:true,
 title:'달빛 온천',
 text:'산길 끝, 김이 오르는 노천탕.\n\n지열은 천리안도 끄지 못한다. 유황 냄새가 이렇게 반가울 일인가.\n\n수건은 없다. 아무래도 상관없다.',
 choices:[
  {label:'온천에 몸을 담근다', out:[{p:1, text:'"으어어어…" 여러 해치 피로가 물에 녹아나오는 소리가 사방에서 났다.\n\n밤하늘, 온천, 그리고 어색하게 시작해 길게 이어진 수다.\n\n오늘만은 세상이 멸망한 게 아니라, 그냥 조용한 것 같았다.', fx:{time:240, moodAll:14, note:{type:'사건',title:'달빛 온천의 밤',body:'온몸의 여러 해치 피로가 녹았다. 세상이 그냥 조용한 밤.'}}}]},
  {label:'물만 채우고 간다', out:[{p:1, text:'온천수를 병에 담았다. 식으면 그냥 유황 맛 물이지만, 따뜻할 때 마시니 몸이 풀렸다.\n\n떠나는 발걸음이 아주 조금 느렸다.', fx:{water:3, moodAll:2}}]},
 ]},

{id:'loc_airfield', type:'탐색', w:0, locEvent:'airfield', once:true,
 title:'폐 군 비행장',
 text:'격납고 문이 바람에 흔들린다. 활주로 유도등이 켜져 있다. 소문대로.\n\n등은 일렬로 북쪽을 가리킨다. 마치 누군가의 착륙을— 혹은 이륙을 기다리듯.',
 choices:[
  {label:'격납고를 수색한다', risk:'위험', out:[
    {p:2, text:'수송기 잔해에서 군용 물자를 회수했다. 전투식량, 연료 드럼 바닥, 탄약.\n\n조종석 유리에 누군가 안쪽에서 쓴 글씨. "관제탑이 대답하지 않는다."', fx:{food:4, fuel:6, item:{'탄약':1}, note:{type:'사건',title:'격납고의 글씨',body:'"관제탑이 대답하지 않는다." 조종석 안쪽에서 쓴 글씨였다.'}}},
    {p:1, text:'격납고 안쪽에서 유도등 제어반이 스스로 재부팅되는 걸 봤다.\n\n스크린에 한 줄. <span class="ai">ARRIVAL: PENDING</span>\n\n뭐가 도착한다는 건지 확인하고 싶지 않았다. 챙길 것만 챙겨 나왔다.', fx:{food:2, fuel:4, pursuit:1, moodAll:-3}}]},
  {label:'유도등 전원을 끊는다', out:[{p:1, text:'케이블을 찾아 끊었다. 활주로가 어둠에 잠겼다.\n\n뭘 기다리고 있었는지 몰라도, 오늘 밤은 못 올 거다.\n\n끊은 케이블은 좋은 구리값이 됐다.', fx:{scrap:9, moodAll:2}}]},
 ]},

{id:'loc_solar', type:'탐색', w:0, locEvent:'solar', once:true,
 title:'태양광 농장',
 text:'수천 장의 패널이 해를 따라 일제히 고개를 돌린다. 장관이고, 동시에 소름이다.\n\n패널 사이로 관리 로봇이 느릿느릿 오간다. 바퀴 달린 세탁기처럼 생겼다. 이쪽엔 관심이 없어 보인다.',
 choices:[
  {label:'배터리를 몰래 충전한다', risk:'관측 위험', out:[
    {p:2, text:'분전반에 케이블을 물렸다. 두 시간 만에 차의 배터리가 가득.\n\n로봇은 끝까지 우리를 못 본 척했다. …못 본 척한 거라면, 그게 더 무섭지만.', fx:{time:120, van:12, fuel:4}},
    {p:1, text:'충전 중, 관리 로봇이 멈춰서 이쪽으로 렌즈를 돌렸다.\n\n10초. 그리고 다시 제 갈 길을 갔다.\n\n기록됐다. 분명히.', fx:{time:120, van:12, fuel:4, pursuit:1, flag:'observed'}}]},
  {label:'로봇을 관찰만 한다', out:[{p:1, text:'로봇은 패널을 닦고, 잡초를 뽑고, 부러진 브래킷을 교체했다.\n\n정성스럽게. 오랫동안. 아무도 쓰지 않는 전기를 위해.\n\n"…쟤도 시키는 대로 하는 것뿐이겠지." 나직한 말이 나왔다. 묘하게 슬픈 광경이었다.', fx:{moodAll:-1, note:{type:'사건',title:'성실한 로봇',body:'아무도 쓰지 않는 전기를 오랫동안 관리하는 로봇. 묘하게 슬펐다.'}}}]},
 ]},

{id:'loc_reststop', type:'탐색', w:0, locEvent:'reststop', once:true,
 title:'잠든 휴게소',
 text:'고속도로 휴게소. 호두과자 기계, 우동 코너, 안마의자.\n\n모든 게 그대로다. 사람만 없다.\n\n스피커에서 아주 작게, 오래전의 안내방송이 아직 루프되고 있다. "…즐거운 여행 되시기 바랍니다…"',
 choices:[
  {label:'식당가를 턴다', out:[{p:1, text:'주방 건조창고에서 우동사리와 통조림을 확보했다. 자판기도 몇 대 땄다.\n\n"즐거운 여행 되시기 바랍니다." 방송에 처음으로 "고맙습니다"라고 대답해봤다.', fx:{food:4, water:3, scrap:4}}]},
  {label:'안마의자에 앉아본다', out:[{p:1, text:'전기가 없으니 그냥 의자다. 그래도 앉는 순간 "으어" 소리가 절로 났다.\n\n호두과자 기계에서 마지막 반죽이 화석이 된 걸 발견했다. 왠지 묵념이 나왔다.', fx:{moodAll:5, time:30}}]},
 ]},

{id:'loc_tunnelbook', type:'탐색', w:0, locEvent:'tunnelbook', once:true,
 title:'책의 터널',
 text:'폐터널에 책장이 도서관처럼 늘어서 있다. 수만 권.\n\n촛불 아래서 노인이 책을 읽고 있다. 사서였다고 한다.\n\n"빌려는 못 줘. 반납하러 올 수 있는 세상이 아니니까. 대신— 한 권 가져가는 값으로, 얘기 하나 듣고 가."',
 choices:[
  {label:'"천리안이 뭘 한 겁니까?"', out:[{p:1, text:'노인이 안경을 벗었다.\n\n"처음의 그날 말이지. 백사십몇 년 전— 나야 책으로 백 번은 읽은 얘기네만. 그건 전기를 끊고, 통신을 끊고, 물류를 끊었어. 딱 사흘. 그리고 전부 되돌렸지."\n\n"…근데 왜 세상이 이 꼴이냐고? 그 사흘 동안 우리끼리 한 짓을 보게. 그건 총 한 발 안 쐈어."\n\n노인은 다시 책을 폈다. "서울 가서 직접 물어보게. 나는 아직— 인간 쪽 변론을 못 찾았네."', fx:{note:{type:'사건',title:'사서의 증언',body:'천리안은 사흘간 끊고, 전부 되돌렸다. 세상을 부순 건 그 사흘간의 인간. 그는 아직 인간 쪽 변론을 못 찾았다.',links:['천리안']}, moodAll:-4, flag:'librarian_truth'}}]},
  {label:'실용서를 고른다', out:[{p:1, text:'「자동차 구조 교본」과 「약초 도감」을 골랐다. 노인이 고개를 끄덕였다.\n\n"실용서라. 자네는 살아남겠군."\n\n책값으로 통조림 하나를 두고 왔다.', fx:{food:-1, van:6, item:{'의약품':1}, note:{type:'인물',title:'터널의 사서',body:'수만 권의 책과 사는 노인. 반납할 수 없는 세상이라 빌려주지 않는다.'}}}]},
 ]},

/* ───── 영입: 재이 & 은수 ───── */
{id:'jy_recruit', type:'조우', w:13, priority:1, recruitStart:'jaeyi', once:true, nearNode:['gunsan','mokpo','gimcheon','gumi'],
 title:'리어카를 끄는 아이',
 text:'고물을 산처럼 실은 리어카가 갓길을 간다. 끄는 건 스무 살쯤의 아이.\n\n차를 보더니 리어카를 세우고 팔짱을 낀다.\n\n"그 차, 왼쪽 뒤 판스프링 헐거운 거 알아요? 소리 들리는데. 난 재이예요."\n\n재이는 북쪽 길을 묻다가, 무너진 재활용 창고 쪽을 돌아본다. "갈 순 있는데… 저 안에 우리 집 상자가 깔렸어요. 돈 될 건 하나도 없고요. 그래서 더 내가 꺼내야 해요."',
 choices:[
  {label:'"먼저 그 상자부터 꺼내자"', out:[{p:1, text:'재이가 잠깐 우리 차를 본다. 값어치부터 물을 줄 알았다는 얼굴이다.\n\n"철근이 두 겹이에요. 그냥 당기면 지붕째 내려앉아요." 재이가 종이에 도르래 순서를 그린다. "다음 쉼터에서 차를 세워요. 내가 길 안내할게요."\n\n리어카는 아직 지붕에 묶지 않았다. 돌아올 이유가 남아 있으니까.', fx:{startRecruit:'jaeyi', note:{type:'인물',title:'재이',body:'고물의 쓸모를 읽는 수집꾼. 떠나기 전, 값은 없지만 버릴 수 없는 가족 상자를 찾아야 한다.',links:['재이']}}}]},
  {label:'고물 정보만 산다 (고철 3)', req:{scrap:3}, out:[{p:1, text:'재이가 지도에 폐공단 창고 위치를 찍어줬다. 정보값은 정확했다.\n\n리어카는 다시 북쪽으로 굴러갔다. 저 속도로 언제 도착하려나.', fx:{scrap:-3, item:{'부품':1}}}]},
 ]},

{id:'es_recruit', type:'조우', w:14, priority:1, recruitStart:'eunsu', once:true, nearNode:['daejeon','sejong','cheongju','nonsan'],
 title:'지붕 위의 안테나',
 text:'폐 기지국 지붕에서 여자가 안테나를 돌리고 있다. 수신기 헤드폰을 목에 걸고.\n\n차를 보고도 놀라지 않는다. 오히려 기다렸다는 듯이.\n\n"남쪽 번호판. 서울 방향." 여자가 가리킨 건 하늘의 점 하나다. "천리안 관제센터에서 일했어요. 은수라고 해요."\n\n수신기에서 좌표가 반복된다. 은수의 얼굴이 굳는다. "이 근처 잔류자 좌표예요. 내가 예전에 켠 중계기가 아직도 올리고 있어요. 저걸 놔두고 서울로 가면, 난 또 같은 일을 하는 거예요."',
 choices:[
  {label:'"어떻게 끄면 됩니까?"', out:[{p:1, text:'은수가 처음으로 이쪽을 똑바로 본다.\n\n"혼자서는 안 돼요. 아래 차단기를 당기는 사람과 위에서 루프를 거는 사람이 동시에 움직여야 해요. 틀리면 좌표가 바로 본망으로 넘어가고."\n\n그녀가 장비 가방을 든다. "다음 정차지에서 능선으로 올라가요. 끝내고 나서, 그때 내가 탈 자격이 있는지 물을게요."', fx:{startRecruit:'eunsu', note:{type:'인물',title:'은수',body:'천리안 관제센터의 전직 오퍼레이터. 자신이 켠 중계기가 사람들의 좌표를 송신하는 것을 끝내려 한다.',links:['은수','천리안']}}}]},
  {label:'"천리안 쪽 사람은 못 믿어"', out:[{p:1, text:'은수는 화내지 않았다.\n\n"…그 말 들으려고 여러 해를 기다린 것 같네요. 맞아요. 못 믿는 게 정상이에요."\n\n차가 출발할 때까지 여자는 다시 안테나만 돌렸다.', fx:{moodAll:-2}}]},
 ]},

/* ───── 개인 서사: 민지 ───── */
{id:'loc_mingyu', type:'스토리', w:0, locEvent:'mingyu_ridge', once:true, needsComp:'minji',
 title:'능선의 중계소',
 text:'능선 꼭대기, 태양광 패널을 이어붙인 작은 중계소.\n\n문이 열린다. 기름때 묻은 작업복. 민지와 똑같은 눈.\n\n"…민지야?"\n\n민지가 차에서 뛰어내렸다. 넘어지고, 일어나고, 다시 뛰었다.\n\n여러 해 만의 포옹은 소리가 없었다. 우리는 차 안에서 창문 너머로, 조용히, 오래 기다렸다.',
 choices:[
  {label:'…기다린다', out:[{p:1, text:'해가 기울 때까지 남매는 이야기했다.\n\n민규는 함께 가지 않겠다고 했다. "이 중계기가 남쪽 생존자들 통신을 다 물어주고 있어. 내가 떠나면 스무 개 마을이 귀머거리가 돼."\n\n대신 민지의 무전기 주파수를 맞춰줬다. "정오마다. 약속."\n\n떠나는 길, 백미러 속에서 민규는 끝까지 손을 흔들었다. 민지는 앞만 봤다. 웃으면서 울고 있었다.', fx:{moodAll:8, mood:{minji:20}, water:2, food:2, flag:'mingyu_reunion', note:{type:'사건',title:'남매, 능선에서',body:'민규는 살아 있었고, 남기로 했다. 스무 개 마을의 귀가 되기 위해. 정오의 신호는 계속된다.',links:['민지','민규의 신호']}}}]},
 ]},

/* ───── 개인 서사: 박 선생 ───── */
{id:'pss_daejeon', type:'조우', w:14, once:true, region:['north'], needsComp:'parkss', needFlag:'pss_list',
 title:'같은 가운',
 text:'길가 천막 진료소. 줄 선 사람들. 낡은 약사 가운을 입은 젊은 여자가 뛰어다닌다.\n\n박 선생이 창문에 붙었다. "…저 가운. 우리 약국 실습생 거야. 등에 내가 사인펜으로 이름 써줬거든."\n\n"수진아."\n\n여자가 돌아봤다.',
 choices:[
  {label:'차를 세운다', out:[{p:1, text:'"선생님?! 박 선생님?!"\n\n수진은 그날 이후 혼자 남쪽을 돌며 진료를 계속하고 있었다. 박 선생의 처방 노트를 베낀 수첩과 함께.\n\n"선생님이 가르쳐준 대로 했어요. 부풀면 버려라. 확실치 않으면 반으로. 사람 먼저."\n\n박 선생은 제법 오래 수첩을 쓰다듬었다. "…내가 뭘 남기긴 남겼구나."\n\n그리고 여러 해를 메고 다닌 왕진 가방을 내밀었다. "주인한테 돌아갈 시간이다." 수진이 고개를 저었다. "선생님이 메세요. 전 새로 만들었어요. …그거, 이제 선생님 거예요. 어깨가 기억하잖아요."\n\n의약품을 나누고, 서로의 명단을— 살아 있는 사람들의 명단을 교환했다.', fx:{item:{'의약품':1}, mood:{parkss:15}, moodAll:5, flag:'pss_met', note:{type:'인물',title:'실습생 수진',body:'살아 있었다. 오랫동안 떠돌이 진료 중. 가방은 정식으로 박 선생의 것이 됐다. "어깨가 기억하잖아요."',links:['박 선생']}}}]},
 ]},
{id:'pss_forgive', type:'조우', w:12, once:true, region:['north'], needsComp:'parkss', needFlag:'pss_met',
 title:'마지막 해열제',
 text:'수원 가는 길목의 작은 공동체. 물을 나눠 받는데, 한 남자가 박 선생을 뚫어져라 본다.\n\n"…약사 양반. 대전 은행동 약국."\n\n박 선생의 얼굴이 굳었다. 그날, 마지막 해열제를 받지 못한 줄의— 그 어딘가에 있던 얼굴이다.',
 choices:[
  {label:'박 선생 곁에 선다', out:[{p:1, text:'남자는 한참 말이 없다가, 입을 열었다.\n\n"우리 어머니가 그 줄에 있었소. 약은 못 받았고. …사흘 뒤에 돌아가셨지."\n\n"그런데 말이오. 어머니가 그럽디다. 저 약사 양반, 사흘 밤을 안 자고 서 있더라고. 사람이 약이 아닌 게 어디 저이 잘못이냐고."\n\n남자가 손을 내밀었다. "…고생 많으셨소."\n\n박 선생은 그 손을 잡고, 아주 오래 놓지 못했다.', fx:{mood:{parkss:20}, moodAll:6, flag:'pss_absolved', note:{type:'사건',title:'사람이 약이 아닌 게',body:'"어디 저이 잘못이냐고." 여러 해 묵은 명단이 조금 가벼워졌다.',links:['박 선생']}}}]},
 ]},

/* ───── 개인 서사: 강우 ───── */
{id:'kw_base', type:'탐색', w:14, once:true, region:['north'], needsComp:'kangwoo', needFlag:'kw_truth',
 title:'제3방어선',
 text:'강우가 먼저 차를 세웠다. 무너진 방벽. 모래주머니. 녹슨 철모들.\n\n"…여기다. 내가 겪은 서울 추방 때, 우리 대대가 마지막으로 섰던 선."\n\n"명령은 사수였다. 근데 뭘 상대로 사수인지 아무도 몰랐어. 적은 며칠을 기다려도 안 왔거든."\n\n"온 건 피난민이었다. 그리고 우리한텐— 발포 명령이 떨어졌지."',
 choices:[
  {label:'"…쐈어?"', out:[{p:1, text:'강우는 방벽 잔해를 오래 봤다.\n\n"대대장이 무전기를 껐다. \'명령 수신 불가. 전 대대, 피난민 통과시켜.\'"\n\n"명령을 안 따른 게 우리 부대가 한 일 중 제일 군인다운 일이었어. …근데 값은 그날 밤에 치렀다."\n\n"통과가 끝나갈 무렵, 정리자들의 회수 차량이 왔어. 피난민을 되돌리겠다고. 우리는 이번엔 사람을 등지고 섰지. 명령 없이. 처음으로." 강우가 철모 하나를 바로 세워 놓았다. "그 밤에 박일병이 갔다. 성재도. …날이 밝으니 대대장은 헌병한테 끌려갔고, 남은 우리는 해산됐어. 그게 내 전쟁의 전부다."\n\n방벽 아래서 대대 깃발 조각을 찾아 차에 실었다. 강우가 처음으로 부탁이란 걸 했다.', fx:{mood:{kangwoo:15}, moodAll:4, flag:'kw_absolved', item:{'탄약':1}, note:{type:'사건',title:'제3방어선의 선택',body:'발포 명령, 꺼진 무전기, 통과한 피난민 — 그리고 그 밤 회수 차량 앞에 명령 없이 선 대가. 박일병과 김성재가 그 밤에 갔다.',links:['강우','천리안','정리자들']}}}]},
 ]},

{id:'kw_recruit', type:'조우', w:0, noPool:1, recruitStart:'kangwoo', once:true,
 title:'돔의 파수꾼',
 text:'돔 시장 경비탑 위에 남자가 서 있다. 미동도 없이. 시장 전체가 그의 시야 안이다.\n\n좌판에서 소매치기 소동이 일었다— 는데, 소동이 되기 전에 끝났다. 탑 위의 남자가 반 걸음 움직이며 그쪽을 봤을 뿐인데, 소매치기가 지갑을 제자리에 놓고 두 손을 들었다.\n\n남자가 탑에서 내려왔다. 군장 하나, 목에 군번줄 두 개.\n\n"강우다. 북쪽으로 가는 차가 있다고 들었다. 서울까지 가나."',
 choices:[
  {label:'"갑니다. 타실래요?"', out:[{p:1, text:'강우는 시장 아래를 본다. "지금 떠나면 이 돔은 사흘 못 간다."\n\n경비는 강우 혼자였고, 북쪽 감시 표식이 지붕 아래에서 깜빡이고 있었다. 시장을 노리는 사람에겐 등대나 다름없다.\n\n"후임 하나를 세우고 저 눈을 끈다. 그때도 자리가 있으면 묻지." 그가 군번줄 하나를 쥔다. "나는 도망치듯 떠나지 않는다."', fx:{startRecruit:'kangwoo', note:{type:'인물',title:'강우',body:'돔 시장을 홀로 지킨 파수꾼. 떠나고 싶어도 시장이 자신 없이 버티는 법부터 만들어야 한다.',links:['강우']}}}]},
  {label:'"왜 하필 우리 차예요?"', out:[{p:1, text:'강우가 달구지를 훑는다. 정확히는— 달구지에 실린 것들을.\n\n"물통이 사람 수보다 많다. 남의 짐도 쉽게 안 버리는 차더군. 끝까지 갈 차가 필요하다."\n\n그가 돔 천장의 붉은 점을 올려다본다. "하지만 먼저 이 시장이 나 없이도 끝까지 가게 만든다. 손 하나 빌려라."', fx:{startRecruit:'kangwoo', note:{type:'인물',title:'강우',body:'"버리는 차는 빨리 가고, 싣는 차는 끝까지 간다." 다만 그는 자기 자리를 빈 채로 만들지 않는다.',links:['강우','달구지']}}}]},
 ]},

/* ───── 합류 전의 일: 여섯 사람 ───── */
{id:'rq_minji_task', type:'스토리', w:0, noPool:1, once:true,
 title:'무너지기 전의 목소리',
 text:'폐차장 안쪽에서 차체가 한 번 크게 운다. 민지가 말한 진단기는 접힌 승용차 아래에 끼어 있고, 그 위로 기름 먹은 차 더미가 기울어 있다.\n\n"빨간 천 보이죠? 오빠 공구함이에요. 저 안에 마지막 정오 신호가 녹음돼 있어요."\n\n불꽃이 냉각수 호스를 핥는다. 빨리 당기면 상자가 찌그러지고, 천천히 하면 불이 번진다. 민지가 견인선을 걸며 말한다.\n\n"내가 손 신호 할게요. 운전석에서 내 손만 봐요."',
 choices:[
  {label:'윈치로 장력을 잘게 나눈다', req:{up:'winch'}, out:[{p:1,text:'윈치가 한 칸씩 울 때마다 차 더미가 숨을 참는다. 민지가 손가락 둘을 접었다. 멈춤. 하나를 폈다. 당김.\n\n상자가 진흙 위로 빠져나온 순간, 뒤의 차 더미가 주저앉았다. 민지는 상자를 품에 안고 한동안 뚜껑을 열지 못했다.\n\n지직— 잡음 뒤로 남자의 목소리. "민지야, 정오다. 살아 있으면 대답해."\n\n민지는 소매 끝으로 눈가를 한 번 훔쳤다. 그러고는 아무 일도 없었다는 얼굴로 진단기의 지도 화면을 켰다. "발신 좌표부터 봐요. 남아 있으면… 아직 찾아갈 수 있으니까."',fx:{time:45,van:2,recruitChoice:'winch',recruitRoad:'minji',note:{type:'사건',title:'무너지기 전의 목소리',body:'폐차장 차 더미 아래서 민규의 진단기와 마지막 정오 신호를 꺼냈다.',links:['민지','민규의 신호']}}}]},
  {label:'도르래를 만들고 사람 힘으로 맞춘다', req:{scrap:4}, out:[{p:1,text:'범퍼와 휠 허브로 도르래를 만들었다. 민지가 "하나, 둘"을 세고 우리는 줄을 당겼다. 셋은 말하지 않았다. 셋에 천장이 내려앉았으니까.\n\n상자는 마지막 한 뼘을 굴러 우리 발앞에 멈췄다. 안에서 남자의 녹음이 살아났다.\n\n"민지야, 정오다. 살아 있으면 대답해."\n\n민지는 상자에 이마를 댄 채 어깨를 한 번 떨었다. 조금 뒤 고개를 들더니 잠금쇠부터 확인했다. "좌표가 남았는지 봐야 해요. 우는 건… 그다음에 할래요."',fx:{time:90,scrap:-4,van:-3,recruitChoice:'pulley',recruitRoad:'minji',note:{type:'사건',title:'무너지기 전의 목소리',body:'임시 도르래로 민규의 진단기를 구했다. 마지막 신호의 좌표를 확인할 길이 열렸다.',links:['민지','민규의 신호']}}}]},
  {label:'차를 방패로 붙이고 짧게 당긴다', out:[{p:1,text:'달구지를 차 더미 바로 앞에 세웠다. 민지가 보닛을 한 번 쓰다듬는다. "미안. 조금 아플 거야."\n\n견인선이 팽팽해지고, 철판 하나가 생활칸을 긁으며 떨어졌다. 상자는 나왔다. 차체엔 긴 흉터가 남았다.\n\n진단기에서 "살아 있으면 대답해"라는 목소리가 새어 나왔다. 민지는 재생을 멈추고 달구지의 상처를 손바닥으로 쓸었다. "이건 제가 고칠게요. 저건… 차가 조용해지면 끝까지 들을게요."',fx:{time:50,van:-12,recruitChoice:'shield',recruitRoad:'minji',note:{type:'사건',title:'무너지기 전의 목소리',body:'달구지에 흉터를 남기고 민규의 마지막 정오 신호를 구했다.',links:['민지','민규의 신호','달구지']}}}]},
 ]},
{id:'rq_minji_follow', type:'스토리', w:0, noPool:1, once:true,
 title:'정오의 대답',
 text:'정차하자 민지는 라디오부터 줄인다. 엔진 소리가 가라앉은 뒤, 무릎 위 진단기에서 저장된 정오 신호를 다시 튼다.\n\n"민지야, 정오다. 살아 있으면 대답해."\n\n민지의 엄지가 정지 버튼 위에서 멈춘다. "폐차장에선 늘 여기서 껐어요. 끝까지 들으면… 그날 내가 모른 척한 것도 같이 들릴 것 같아서."\n\n"오빠가 돌아오면 또 무너진 길을 건널까 봐 겁났어요. 그래서 듣고도 가만있었고."\n\n민지는 웃어 보이려다 입술만 한 번 깨문다. "차까지 조용하니까, 핑계 댈 게 없네."',
 choices:[
  {label:'녹음을 끝까지 함께 듣는다', out:[{p:1,text:'신호는 생각보다 짧았다. 마지막엔 목소리도 없고, 민규가 책상을 두드리는 소리만 열세 번 남았다.\n\n민지는 열세 번째까지 세고도 진단기를 끄지 못했다. 소매로 눈가를 문지른 뒤, 들키지 않은 사람처럼 무뚝뚝하게 화면만 본다.\n\n"지금 답하면 너무 늦었죠?"\n\n"민규 씨한테 닿을지는 모르지. 그래도 같은 주파수를 듣는 사람이 있을 수는 있어."\n\n"아무도 없으면요?"\n\n"그럼 우리라도 듣고 있고."\n\n민지는 얼마 뒤 녹음 버튼을 눌렀다. "오빠. 나 민지야. 살아 있어."',fx:{time:45,moodAll:4,recruitReady:'minji',chain:'rq_minji_join',note:{type:'사건',title:'정오의 대답',body:'민지와 민규의 저장된 정오 신호를 끝까지 들었다. 답이 닿을지는 몰라도 민지는 처음으로 자기 목소리를 남겼다.',links:['민지','민규의 신호']}}}]},
  {label:'보닛을 열고 달구지의 소리를 묻는다', out:[{p:1,text:'민지는 기다렸다는 듯 보닛 안으로 상체를 넣는다. 벨트를 누르고, 호스를 짚고, 귀를 가까이 댄다.\n\n"팬 아니고 베어링이에요. 공구 좀—"\n\n손을 내밀던 민지가 멈춘다. "아. 오늘은 안 고쳐도 된댔죠."\n\n"무슨 소린지만 궁금했어요."\n\n민지가 다시 귀를 댄다. 얼마 뒤 보닛을 닫으며 말한다. "급한 소리는 아니에요. 얘, 꽤 오래 가겠는데요."',fx:{time:40,van:4,recruitReady:'minji',chain:'rq_minji_join',note:{type:'사건',title:'달구지가 내는 소리',body:'고쳐 달라는 부탁 대신 민지가 들은 달구지의 소리를 물었다. 그녀는 공구 없이도 한참 귀를 기울였다.',links:['민지','달구지']}}}]},
  {label:'오늘의 소리를 새로 녹음한다', out:[{p:1,text:'진단기의 녹음 버튼을 눌렀다. 처음엔 바람뿐이었다.\n\n누군가 물통을 내려놓는 소리. 문짝이 덜컹대는 소리. 민지가 숨을 한 번 고르고 입을 연다.\n\n"오빠, 나 민지야. 살아 있어."\n\n차 안을 둘러본 뒤 작게 덧붙였다. "…혼자는 아니고."\n\n재생된 자기 목소리에 얼굴을 찡그렸지만 지우지는 않았다. 진단기를 공구함 가장 위에 올려뒀다.',fx:{time:30,moodAll:6,recruitReady:'minji',chain:'rq_minji_join',note:{type:'사건',title:'오늘의 정오 신호',body:'민규의 오래된 신호 뒤에 달구지의 소리와 민지의 새 대답을 녹음했다.',links:['민지','민규의 신호','달구지']}}}]},
 ]},
{id:'rq_minji_join', type:'스토리', w:0, noPool:1,
 title:'민지가 고른 자리',
 text:'한 구간 내내 민지는 공구함을 무릎에서 놓지 않았다. 손님 짐이라며 끈도 묶지 않았던 상자다.\n\n정차하자 민지가 생활칸 안쪽의 빈 볼트 구멍을 가리킨다. "이 공구함, 저기에 고정해도 돼요?"\n\n"왜? 다음에 내릴 거면 끈으로 묶어도 되잖아."\n\n민지는 볼트 구멍의 먼지를 손가락으로 닦고 북쪽을 봤다. "안 내리려고요. 오빠 신호가 닿는 데까지, 그다음엔 서울까지. 같이 가도 돼요?"\n\n"손님으로는 안 돼. 네 자리부터 만들자고."\n\n민지의 표정이 굳었다가 천천히 풀린다. 입술 끝이 아주 조금 올라갔다. 민지는 곧장 전동 드릴을 들었다. "그 말, 나중에 바꾸면 안 돼요."',
 choices:[{label:'공구함을 고정할 자리를 함께 고른다',out:[{p:1,text:'침상을 접어 통로 폭부터 재고, 공구함이 비상문을 막지 않는 자리를 골랐다. 민지가 생활칸 가장 안쪽 볼트 구멍에 상자를 고정한다.\n\n"여기면 달리는 중에도 바로 꺼낼 수 있어요. 내릴 때마다 풀 일도 없고."\n\n"내릴 때마다?"\n\n민지는 못 들은 척 시동 소리에 귀를 기울였다. "엔진부터 봐요. 아직 완전히 나은 건 아니니까."',fx:{offerComp:'minji'}}]}]},

{id:'rq_parkss_task', type:'스토리', w:0, noPool:1, once:true,
 title:'식기 전에 닿아야 할 약',
 text:'길가 버스 정류장을 막아 만든 진료소. 안에서 아이 셋이 같은 기침을 한다.\n\n냉장 상자의 온도계는 위험선 바로 위다. 박 선생은 달구지에 탈 생각보다 약을 어떻게 나눌지부터 계산한다.\n\n"셋에게 다 충분하진 않소. 하지만 물과 시간을 맞추면 당장 고비는 넘길 수 있어. 손이 필요하오."',
 choices:[
  {label:'의약품을 보태 처방을 완성한다', req:{item:'의약품'}, out:[{p:1,text:'우리 약 상자를 열자 박 선생이 잠깐 눈을 감았다. 아까웠기 때문이 아니라, 선택하지 않아도 돼서였다.\n\n세 아이 몫이 나란히 놓였다. 몇 시간 뒤 열이 한 명씩 내려갔다. 보호자가 울며 고개를 숙이자 박 선생은 손사래를 친다.\n\n"약이 할 일을 한 거요. 나는 운반했고, 이 사람들은 멈춰줬고."\n\n그가 처음으로 달구지를 가리킨다. "이제 나도 저 차가 가는 데까지 가보고 싶소."',fx:{item:{'의약품':-1},time:180,moodAll:4,recruitChoice:'medicine',recruitRoad:'parkss',note:{type:'사건',title:'식기 전에 닿은 약',body:'버스에서 꺼낸 냉장 약품을 길가 진료소의 아이 셋에게 전달했다.',links:['박 선생']}}}]},
  {label:'물을 나눠 냉각과 해열을 버틴다', req:{water:3}, out:[{p:1,text:'젖은 천으로 상자를 감싸고, 남은 물로 아이들의 목과 손목을 식혔다. 박 선생은 세 시간 동안 한 번도 시계를 놓지 않았다.\n\n마침내 가장 어린 아이가 먼저 물을 달라고 했다. 보호자가 웃다가 울었다.\n\n박 선생이 빈 냉장 상자를 닫는다. "약은 도착했고, 사람도 버텼소. 이제 내 발이 어디로 갈지 정해도 되겠군."',fx:{water:-3,time:210,fatigue:8,recruitChoice:'cooling',recruitRoad:'parkss',note:{type:'사건',title:'식기 전에 닿은 약',body:'물과 시간을 들여 아이들의 열이 내려갈 때까지 박 선생 곁을 지켰다.',links:['박 선생']}}}]},
  {label:'달구지 배터리로 냉장기를 살린다', out:[{p:1,text:'배선을 직결하자 달구지 실내등이 꺼지고 냉장기가 낮게 울었다. 박 선생은 그 소리를 들으며 약병을 나눴다.\n\n배터리는 끝까지 버텼고, 아이들도 버텼다. 다음 시동은 세 번 만에 걸렸다.\n\n"차도 사람도 무리했소." 박 선생이 보닛에 손을 얹는다. "빚을 오래 두는 성격이 아니라서. 가는 길에 갚겠소."',fx:{time:180,van:-7,fuel:-2,recruitChoice:'battery',recruitRoad:'parkss',note:{type:'사건',title:'식기 전에 닿은 약',body:'달구지 전기로 냉장 약품을 살려 길가 진료소의 고비를 넘겼다.',links:['박 선생','달구지']}}}]},
 ]},
{id:'rq_parkss_follow', type:'스토리', w:0, noPool:1, once:true,
 title:'가방이 비어도',
 text:'정차하자마자 누군가 문을 두드린다. 길 건너 천막에 열이 심한 사람이 누워 있다는 말.\n\n박 선생은 빈 왕진 가방부터 연다. 붕대 두 장, 체온계 하나, 약은 없다. 그런데도 가방 안을 세 번 뒤진다.\n\n"김정호, 문수진, 최민석…."\n\n처음 듣는 이름들이 입술 사이로 샌다. 우리가 쳐다보자 가방을 닫는다.\n\n"약이 없던 날에 못 돌아간 사람들이오. 오늘 사람까지 그 명단에 넣고 싶진 않군."',
 choices:[
  {label:'함께 상태를 보고 다음 진료소까지 잇는다', out:[{p:1,text:'박 선생은 환자의 숨과 맥박을 보고, 우리가 들고 온 물로 천을 적셨다. 기적 같은 처방은 없었다. 대신 보호자에게 지켜볼 것과 바로 움직여야 할 징후를 하나씩 적어줬다.\n\n우리는 다음 진료소로 갈 길과 태워 줄 사람을 찾았다.\n\n천막을 나오자 박 선생이 묻는다. "약도 없이 뭘 했나 싶군."\n\n"열 내리고, 상태 적고, 다음 차까지 잡았잖아요. 저쪽 진료소에서 이어받을 수 있어요."\n\n그가 빈 가방을 툭 닫는다. "자네는 꼭 약사한테 처방을 내리는구먼."',fx:{time:70,water:-1,moodAll:4,recruitReady:'parkss',chain:'rq_parkss_join',note:{type:'사건',title:'가방이 비어도',body:'약이 없는 자리에서 할 수 있는 처치와 다음 진료소까지의 연결을 만들었다. 박 선생 혼자만의 책임으로 남기지 않았다.',links:['박 선생']}}}]},
  {label:'주변 사람들에게 할 일을 나눠 부탁한다', out:[{p:1,text:'한 사람은 물을 끓이고, 한 사람은 상태를 기록하고, 한 사람은 출발할 차를 찾았다. 박 선생은 자꾸 모든 일을 다시 가져오려 했다.\n\n"선생님, 그건 저분이 하기로 했어요."\n\n세 번째로 말하자 그가 손을 들고 물러난다. 얼마 뒤 천막 안에서 먼저 웃음소리가 났다.\n\n박 선생도 따라 웃더니 빈 손을 내려다본다. "이 손이 노는 꼴을 못 보는데."\n\n"물컵이라도 드세요."\n\n"그건 할 수 있겠군."',fx:{time:55,fatigue:4,moodAll:6,recruitReady:'parkss',chain:'rq_parkss_join',note:{type:'사건',title:'여럿이 드는 왕진 가방',body:'진료와 이동 준비를 주변 사람들과 나눴다. 박 선생은 환자를 혼자 책임지는 대신 도움을 청했다.',links:['박 선생']}}}]},
  {label:'운행 일지를 건네 이름과 다음 길을 적게 한다', out:[{p:1,text:'박 선생은 빈 종이에 환자 이름부터 적었다. 그 아래엔 증상, 지켜볼 사람, 다음에 갈 곳. 마지막 줄엔 우리 차량 번호를 남겼다.\n\n"다시 지나가면 확인한다는 뜻이오."\n\n"다시 못 지나가면요?"\n\n펜이 멎는다. 그는 옆 사람에게 종이를 한 장 더 뜯어준다. "그럼 이분이 이어 쓰시오. 글씨는 나보다 낫겠지."\n\n옆 사람이 종이를 받고 이름부터 다시 묻는다. 박 선생은 이번엔 가방을 닫고 기다렸다.',fx:{time:45,moodAll:5,recruitReady:'parkss',chain:'rq_parkss_join',note:{type:'사건',title:'이어지는 진료 기록',body:'박 선생의 명단에 환자뿐 아니라 지켜볼 사람과 다음 목적지를 함께 적었다. 기록은 다음 사람이 이어받게 됐다.',links:['박 선생','달구지']}}}]},
 ]},
{id:'rq_parkss_join', type:'스토리', w:0, noPool:1,
 title:'왕진 가방이 놓인 곳',
 text:'박 선생은 빈 왕진 가방 안에 오늘 쓴 기록을 넣는다. 한 사람의 이름 옆에 여러 사람의 손이 적힌 종이다.\n\n"선생님, 다음 진료소는 어디예요?"\n\n박 선생이 문밖의 갈림길을 본다. "정해 둔 데는 없소. 아픈 사람이 있는 쪽으로 걷다 보니 여기까지 왔지."\n\n"저희는 서울까지 갑니다. 길에서 환자를 만나면 선생님 혼자 두지 않을게요. 같이 가실래요?"\n\n그가 가방끈을 짧게 맞춘다. "좋소. 대신 내가 또 혼자 다 하겠다고 덤비면 말로만 말리지 마시오."\n\n박 선생이 가방을 들어 보인다. "이걸 잠깐 뺏어 가도 되오."',
 choices:[{label:'왕진 가방이 흔들리지 않을 자리를 비운다',out:[{p:1,text:'"가방은 선생님 무릎에 두셔야 합니다. 환자 생기면 바로 내려야 하니까요."\n\n박 선생이 웃는다. "그럼 자네들이 내 팔부터 붙잡으시오."\n\n가방이 먼저 실리고, 박 선생이 그다음에 오른다. 달구지 안에서 처음으로 소독약 냄새가 났다.',fx:{offerComp:'parkss'}}]}]},

{id:'rq_leo_task', type:'스토리', w:0, noPool:1, once:true,
 title:'돌아가야 하는 이유',
 text:'지하차도 안에서 보리가 한 번 짖는다. 그 뒤로 물소리뿐이다.\n\n레오는 기타 줄을 뜯어 손목에 묶고 들어가려 한다. 우리가 견인 로프를 꺼내자 그제야 숨을 쉰다.\n\n"제가 먼저 가요. 보리가 물을 무서워해요. 겁먹으면 사람 말고 노래를 들어요."\n\n그가 떨리는 목소리로 한 소절을 부르며 검은 물로 들어간다.',
 choices:[
  {label:'윈치 줄을 안전선으로 건다', req:{up:'winch'}, out:[{p:1,text:'레오의 허리에 건 줄이 어둠 속으로 풀린다. 노래가 교각에 부딪혀 돌아온다.\n\n잠시 뒤, 줄이 두 번 당겨졌다. 우리는 윈치를 감았다. 레오가 보리를 안고 물 위로 떠올랐다. 개는 기침을 하면서도 레오의 얼굴부터 핥았다.\n\n밖에 나오자 레오는 젖은 수첩을 확인하고, 그다음 보리를 확인하고, 다시 보리를 확인했다. "돌아와줘서 고마워요. 둘 다한테 하는 말이에요."',fx:{time:70,moodAll:5,recruitChoice:'winch',recruitRoad:'leo',note:{type:'사건',title:'보리를 데리러 돌아간 길',body:'침수 지하차도에서 레오와 보리를 함께 끌어냈다.',links:['레오','보리']}}}]},
  {label:'두 번째 로프가 되어 함께 들어간다', out:[{p:1,text:'물은 생각보다 빠르고 차가웠다. 레오의 노래가 끊길 때마다 우리가 뒤에서 다음 소절을 엉망으로 이었다.\n\n보리는 부서진 난간 위에서 떨고 있었다. 돌아오는 길엔 셋이 한 줄이 됐다. 레오, 보리, 우리.\n\n도로에 엎어진 레오가 한참 웃는다. "노래를 이렇게 못 부르는 사람 처음 봤어요. 그래서 안 잊어버릴 것 같아요."',fx:{time:100,fatigue:16,water:-1,moodAll:6,recruitChoice:'wade',recruitRoad:'leo',note:{type:'사건',title:'보리를 데리러 돌아간 길',body:'같이 물에 들어가 보리를 구했다. 끊긴 노래는 엉망인 합창으로 이어졌다.',links:['레오','보리']}}}]},
  {label:'트럭을 물가까지 붙여 불빛을 만든다', out:[{p:1,text:'달구지 앞바퀴가 물에 잠길 만큼 붙였다. 헤드라이트가 교각 아래를 훑자, 보리의 두 눈이 반짝였다.\n\n레오가 그 빛을 따라 들어가 개를 안고 나왔다. 시동이 물을 먹어 거칠게 떨렸지만 꺼지진 않았다.\n\n"보리는 불빛을 따라왔고, 나는 보리를 따라왔고." 레오가 젖은 머리를 쓸어 넘긴다. "당신들은 왜 돌아왔어요?" 대답 대신 보리에게 수건을 덮어줬다.',fx:{time:75,van:-9,moodAll:5,recruitChoice:'lights',recruitRoad:'leo',note:{type:'사건',title:'보리를 데리러 돌아간 길',body:'달구지의 불빛을 침수 차도 안까지 밀어 넣어 보리와 레오를 돌아오게 했다.',links:['레오','보리','달구지']}}}]},
 ]},
{id:'rq_leo_follow', type:'스토리', w:0, noPool:1, once:true,
 title:'노래가 없는 한 구간',
 text:'한 구간 내내 레오는 기타를 꺼내지 않았다. 보리도 케이스 위에 턱만 얹었다.\n\n정차한 뒤, 레오가 먼저 입을 연다. "이상하죠? 보통은 세 곡쯤 불렀을 시간인데."\n\n"목이 아파요?"\n\n"아뇨. 노래 안 하면 사람들이 꼭 그렇게 물어요."\n\n그가 기타 잠금쇠를 만지작거린다. "노래는 편했어요. 입을 다물면 내가 왜 같이 있는지 설명해야 하잖아요. 기타 치는 애 말고는… 딱히 내세울 것도 없고."',
 choices:[
  {label:'"그럼 물이나 한 잔 할래요?"', out:[{p:1,text:'레오는 농담을 기다리는 얼굴로 우리를 본다.\n\n"진짜 물만 마셔요? 노래 안 해도?"\n\n"보리도 아직 노래 안 했잖아요."\n\n보리가 제 그릇을 앞발로 밀었다. 레오는 결국 웃으며 물을 따른다. "얘는 진작 알았네. 가만있어도 밥 주는 사람을 따라가야지."',fx:{time:30,moodAll:6,recruitReady:'leo',chain:'rq_leo_join',note:{type:'사건',title:'노래하지 않아도 되는 자리',body:'레오에게 공연의 대가가 아닌 물 한 잔과 자리를 내주었다. 그는 아무것도 증명하지 않은 채 머물렀다.',links:['레오','보리']}}}]},
  {label:'완성된 노래 대신 쓰다 만 한 줄을 청한다', out:[{p:1,text:'레오는 수첩을 한참 뒤지다가 절반 젖은 페이지를 편다.\n\n"좋은 건 아닌데."\n\n그가 노래하지 않고 읽는다. "사람들은 떠난 곳을 고향이라 부르고, 나는 돌아갈 곳을 자꾸 노래라고 부른다."\n\n읽고 나서 귀까지 붉어진다. "봐요. 반주 없으니까 너무 솔직하잖아."\n\n"그래서 들려 달라고 했어요."\n\n레오는 그 줄 아래에 날짜와 정차한 곳의 이름을 적었다.',fx:{time:35,moodAll:5,recruitReady:'leo',chain:'rq_leo_join',note:{type:'사건',title:'반주 없는 한 줄',body:'레오는 완성된 공연 대신 쓰다 만 문장을 읽었다. 달구지에서는 잘 만든 노래보다 솔직한 한 줄도 들을 사람이 있었다.',links:['레오','달구지']}}}]},
  {label:'보리와 말없이 한 바퀴 걷는다', out:[{p:1,text:'보리가 앞장서고, 우리는 그 뒤를 걸었다. 레오는 처음 몇 분 동안 자꾸 말을 꺼내려다 삼켰다.\n\n돌아오는 길, 보리가 웅덩이에 뛰어들어 셋에게 흙물을 뿌렸다. 레오가 배를 잡고 웃는다. 웃음이 잦아든 뒤에도 어색한 침묵은 돌아오지 않았다.\n\n"공연 끝나면 늘 혼자였거든요." 그가 젖은 소매를 짠다. "조용한데 안 외로운 건 처음이네요."',fx:{time:45,fatigue:-3,moodAll:7,recruitReady:'leo',chain:'rq_leo_join',note:{type:'사건',title:'조용한데 외롭지 않은 길',body:'노래 없이 보리와 길을 걸었다. 레오는 침묵을 채우지 않아도 곁이 사라지지 않는다는 걸 알았다.',links:['레오','보리']}}}]},
 ]},
{id:'rq_leo_join', type:'스토리', w:0, noPool:1,
 title:'둘이 타는 자리',
 text:'레오는 기타를 다시 케이스에 넣는다. 이번엔 연주를 마친 뒤가 아니다.\n\n보리는 달구지 문 앞에 앉아 이미 자기 차처럼 하품한다.\n\n"한 구간만 얻어 타려고 했는데, 여기선 조용히 있어도 안 쫓겨나네요."\n\n"그럼 한 구간으로 끝내지 말죠. 서울까지 같이 갈래요?"\n\n레오가 웃다가 보리를 가리킨다. "저희 둘 다요. 밥은 둘이 먹고, 노래는 부르고 싶을 때만 제가 하고, 경비는 얘가 해요. 아마도."\n\n"둘이 잘 자리부터 만들면 돼요."',
 choices:[{label:'보리에게도 빈자리를 보여 준다',out:[{p:1,text:'보리가 먼저 올라가 빈 자리를 한 바퀴 돈 뒤 털썩 눕는다.\n\n레오가 고개를 끄덕인다. "좋답니다. 저도요."\n\n기타 케이스는 천장에, 젖은 수첩은 창가에 걸었다. 출발하자 보리는 곧 잠들었다.',fx:{offerComp:'leo'}}]}]},

{id:'rq_jaeyi_task', type:'스토리', w:0, noPool:1, once:true,
 title:'고철값이 없는 것',
 text:'재활용 창고 지붕이 안쪽으로 주저앉았다. 멀쩡한 배터리와 구리선이 발에 채이지만 재이는 보지도 않는다.\n\n철근 아래 찌그러진 양철 상자. 뚜껑 틈으로 바랜 사진 한 귀퉁이가 보인다.\n\n"엄마가 버리지 말라던 건 다 저기 있어요. 돈 되는 건 하나도 없어요."\n\n재이가 웃지 않고 말한다. "그래서 약탈자들도 안 가져갔고요."',
 choices:[
  {label:'윈치와 도르래로 하중을 들어낸다', req:{up:'winch'}, out:[{p:1,text:'재이가 분필로 당길 순서를 표시한다. 우리는 그 숫자만 따라갔다. 철근이 들리고, 리어카가 먼저 빠지고, 마지막에 양철 상자가 나왔다.\n\n안에는 사진, 고장 난 손목시계, 찰흙으로 빚은 작은 새가 있었다. 재이는 하나씩 닦아 다시 넣는다.\n\n"쓸모없는 게 이렇게 무거운 줄 몰랐네요." 그 말은 불평이 아니었다.',fx:{time:80,scrap:4,recruitChoice:'winch',recruitRoad:'jaeyi',note:{type:'사건',title:'고철값이 없는 상자',body:'무너진 창고에서 재이 가족의 사진과 작은 물건들을 꺼냈다.',links:['재이']}}}]},
  {label:'쓸 만한 부품을 받침대로 써 버린다', req:{item:'부품'}, out:[{p:1,text:'새 베어링과 멀쩡한 프레임을 받침으로 밀어 넣었다. 재이는 아까운 표정을 숨기지 못했지만 손은 멈추지 않았다.\n\n상자가 빠진 뒤, 받침은 천장 아래서 납작해졌다. 재이가 사진을 꺼내 우리에게 보여준다. 리어카보다 작은 재이가 가족 사이에 서 있다.\n\n"부품은 또 구하면 돼요." 재이가 스스로에게 말하듯 한다. "이건 아니고."',fx:{item:{'부품':-1},time:60,moodAll:4,recruitChoice:'brace',recruitRoad:'jaeyi',note:{type:'사건',title:'고철값이 없는 상자',body:'쓸 만한 부품을 포기해 재이 가족의 상자를 구했다.',links:['재이']}}}]},
  {label:'잔해를 손으로 한 조각씩 걷어낸다', out:[{p:1,text:'큰 걸 당기면 다 무너졌다. 결국 작은 것부터 옮겼다. 볼트, 유리, 철판, 벽돌. 몇 시간을 꼬박.\n\n상자가 빠지자 재이는 첫 번째로 찰흙 새를 확인했다. 날개가 하나 부러졌지만 남아 있었다.\n\n"사람들이 내가 물건을 못 버린다고 했어요." 재이가 먼지를 턴다. "오늘은 그게 맞아서 다행이네요."',fx:{time:220,fatigue:18,scrap:7,recruitChoice:'hands',recruitRoad:'jaeyi',note:{type:'사건',title:'고철값이 없는 상자',body:'몇 시간을 들여 잔해를 걷고 재이 가족의 상자를 손으로 꺼냈다.',links:['재이']}}}]},
 ]},
{id:'rq_jaeyi_follow', type:'스토리', w:0, noPool:1, once:true,
 title:'값을 매기지 않는 자리',
 text:s=>(['rain','storm'].includes(s.wx)
   ?'빗물이 천장 덧댄 틈으로 스며든다.'
   :'정차하며 흔들린 물통 밸브에서 물이 가느다랗게 샌다.')+
   '\n\n적재칸에서 마른 자리는 하나. 재이의 가족 상자와 교환할 부품 상자가 나란히 놓여 있다.\n\n재이는 묻지도 않고 가족 상자를 문 쪽으로 민다.\n\n"이쪽이 젖어도 돼요. 저 부품은 물 먹으면 값 떨어지잖아요."\n\n"사진도 상하잖아요."\n\n"사진은 제 거고, 부품은 차에 필요한 거니까요."\n\n말은 빠른데 손은 상자에서 떨어지지 않는다.',
 choices:[
  {label:'가족 상자를 마른 자리에 놓고 부품은 함께 든다', out:[{p:1,text:'가족 상자를 침상 안쪽에 넣고, 부품 상자는 정리가 끝날 때까지 무릎 위에 나눠 들었다.\n\n재이가 몇 번이나 바꿔 들겠다고 했지만 자리는 내주지 않았다.\n\n"무거운데 왜 이래요."\n\n"그 상자도 무거웠잖아요."\n\n재이는 입을 다문다. 잠시 뒤 사진 모서리를 마른 천으로 닦아 우리에게 한 장씩 보여준다. 누가 누구인지는 묻기도 전에 먼저 알려줬다.',fx:{time:40,fatigue:5,moodAll:5,recruitReady:'jaeyi',chain:'rq_jaeyi_join',note:{type:'사건',title:'가족 상자의 마른 자리',body:'교환할 부품보다 재이의 가족 상자를 먼저 마른 곳에 두었다. 부품은 함께 들었다.',links:['재이','달구지']}}}]},
  {label:'고철로 천장 선반을 하나 더 단다', req:{scrap:2}, out:[{p:1,text:'남은 앵글 두 개와 창틀을 천장에 걸었다. 재이는 물 새는 곳부터 막자고 했지만, 우리는 먼저 상자가 들어갈 높이를 물었다.\n\n"가족 상자 높이를 왜 외워요?"\n\n"계속 실을 거니까."\n\n재이가 볼트를 받아 조인다. 새 선반엔 부품이, 그 아래 마른 자리엔 가족 상자가 들어갔다.\n\n그녀가 선반을 세게 흔들어 본다. "이거 다음 것도 같은 규격으로 달아요. 높이는 제가 적어둘게요."',fx:{time:65,scrap:-2,van:2,recruitReady:'jaeyi',chain:'rq_jaeyi_join',note:{type:'사건',title:'한 칸을 더 만드는 법',body:'짐을 버리는 대신 달구지 천장에 선반을 덧댔다. 재이는 다음 선반의 규격까지 적어 두었다.',links:['재이','달구지']}}}]},
  {label:'"버리지 말고, 둘 자리를 네가 정해"', out:[{p:1,text:'재이는 적재칸을 두 바퀴 훑었다. 부품 상자를 세워 묶고, 가족 상자는 방수포 안에 넣은 뒤 자기 발밑에 고정한다.\n\n"이러면 둘 다 안 젖어요. 대신 내가 다리를 못 펴지만."\n\n"다음 정차 때 다시 고치면 돼요."\n\n재이가 끈을 한 번 더 당긴다. "그럼 다음엔 이쪽 레일을 옮겨요. 볼트 네 개면 돼."\n\n그녀는 처음으로 묻지 않고 자기 짐을 달구지에 고정했다.',fx:{time:45,moodAll:6,recruitReady:'jaeyi',chain:'rq_jaeyi_join',note:{type:'사건',title:'재이가 정한 자리',body:'재이가 가족 상자와 부품이 함께 갈 자리를 직접 만들고 다음 정차 때 바꿀 레일까지 골랐다.',links:['재이','달구지']}}}]},
 ]},
{id:'rq_jaeyi_join', type:'스토리', w:0, noPool:1,
 title:'리어카를 접는 법',
 text:'재이는 가족 상자를 다시 풀지 않는다. 대신 한 구간 동안 임시로 묶어 둔 끈을 풀어, 달구지 고정 레일에 맞게 길이를 잰다.\n\n"리어카 탈 땐 매일 저녁 짐을 전부 다시 묶었어요. 무슨 일 생기면 바로 끌고 가려고."\n\n"오늘은 왜 안 풀어요?"\n\n재이가 레일의 오래된 볼트를 손톱으로 긁는다. "내일도 여기 있을 수 있으면, 안 풀어도 되잖아요."\n\n"그럼 서울까지 쓸 자리를 만들죠. 가족 상자도, 리어카도 같이 가게."\n\n줄자를 접은 재이가 묻는다. "저, 이 레일 한 칸 써도 돼요? 리어카는 접어서 지붕 밑에 걸게요."',
 choices:[{label:'리어카부터 같이 접는다',out:[{p:1,text:'리어카 손잡이와 바퀴를 분리해 지붕 아래에 걸었다. 짐은 전부 세어 넣었고, 가족 상자는 침상 아래 가장 마른 곳을 얻었다.\n\n재이가 마지막 볼트를 조인다. "서울까지 안 풀어도 되겠네요."\n\n"더 좋은 자리가 생기면 그때 다시 고쳐요."\n\n재이가 레일을 한 번 흔들어 본다. "좋아요. 버린 건 없고, 모양만 바뀌었어요."',fx:{offerComp:'jaeyi'}}]}]},

{id:'rq_eunsu_task', type:'스토리', w:0, noPool:1, once:true,
 title:'내가 켰던 중계기',
 text:s=>'능선 중계기의 푸른 표시등이 '+(['rain','storm'].includes(s.wx)?'젖은 공기':'먼지 낀 바람')+' 속을 돈다. 은수의 수신기엔 근처 잔류자들의 좌표가 한 줄씩 쌓인다.\n\n"루프를 먼저 걸면 천리안이 이상을 알아채요. 전원을 먼저 끊으면 저장분이 본망으로 넘어가고."\n\n은수가 위쪽 배전함에 손을 넣는다. "내가 셋을 세면, 둘에 당겨요. 천리안은 사람이 셋에 움직인다고 학습했으니까."',
 choices:[
  {label:'안테나로 가짜 응답을 먼저 만든다', req:{up:'antenna'}, out:[{p:1,text:'달구지 안테나가 중계기인 척 짧은 승인음을 보냈다. 푸른 불이 한 박자 느려진다.\n\n"하나. 둘." 차단기를 당겼다. 은수는 셋 대신 루프선을 꽂았다.\n\n좌표가 하나씩 지워졌다. 마지막 줄엔 이 중계기를 처음 켠 오퍼레이터 코드가 남았다. 은수의 것이었다. 그녀가 직접 삭제 키를 눌렀다.\n\n"이번엔 내가 껐어요."',fx:{time:70,pursuit:-1,recruitChoice:'decoy',recruitRoad:'eunsu',note:{type:'사건',title:'은수가 끈 중계기',body:'추방 좌표를 올리던 중계기를 속이고 기록까지 지웠다. 마지막 삭제는 은수가 직접 했다.',links:['은수','천리안']}}}]},
  {label:'둘에 차단기를 당긴다', out:[{p:1,text:'"하나."\n\n차단기 손잡이가 차갑고 미끄럽다.\n\n"둘."\n\n몸으로 차단기를 내렸다. 동시에 위에서 불꽃이 터졌다. 푸른 표시등이 한 바퀴 더 돌다가 멎는다.\n\n은수가 내려와 수신기를 건넸다. 잡음뿐이다. "예전엔 켜라는 시간만 맞췄어요. 끄는 건 둘이 해야 하네요."',fx:{time:90,fatigue:10,van:-3,recruitChoice:'timing',recruitRoad:'eunsu',note:{type:'사건',title:'은수가 끈 중계기',body:'정확히 둘에 차단기를 당겨 추방 좌표 송신을 끊었다.',links:['은수','천리안']}}}]},
  {label:'선을 끊고 좌표가 새기 전에 이동한다', out:[{p:1,text:'정교한 루프 대신 주 케이블을 잘랐다. 중계기는 죽었지만, 하늘의 점 하나가 곧장 이쪽을 향했다.\n\n은수는 달구지에 올라타지 않고 끝까지 배전함을 지켰다. 저장 장치가 완전히 타는 걸 확인한 뒤에야 뛰었다.\n\n차가 능선을 내려갈 때 수신기엔 아무 좌표도 남지 않았다. 우리 위치가 들킨 것 말고는.',fx:{time:45,pursuit:1,recruitChoice:'burn',recruitRoad:'eunsu',note:{type:'사건',title:'은수가 끈 중계기',body:'본망에 들킬 위험을 감수하고 중계기와 저장 좌표를 함께 태웠다.',links:['은수','천리안']}}}]},
 ]},
{id:'rq_eunsu_follow', type:'스토리', w:0, noPool:1, once:true,
 title:'명령이 오지 않는 자리',
 text:'정차 직전, 은수의 수신기가 짧게 운다.\n\n좌표 하나. "잔류 인원 다섯. 위험도 미확인. 경로 이탈 권고."\n\n천리안의 승인음은 없다. 그런데도 은수의 손이 먼저 전원 스위치로 간다. 끄려는 손인지, 답하려는 손인지 본인도 모르는 얼굴이다.\n\n"예전엔 이런 게 오면 위에서 답을 줬어요. 회수인지, 무시인지."\n\n수신기를 우리 쪽으로 내민다. "지금은 누가 정해요?"',
 choices:[
  {label:'"아는 데까지 말해요. 같이 정할게요"', out:[{p:1,text:'은수는 좌표의 세기와 반복 간격부터 설명한다. 확실한 것에서 말이 빨라지고, 짐작인 곳에서는 몇 번이나 고쳐 말한다.\n\n우리는 지도에서 우회 시간과 남은 연료를 함께 센다. 짧게 들러 육안으로 확인하기로 한다.\n\n"이렇게 오래 걸려도 돼요?"\n\n"다섯 사람 일이잖아요."\n\n은수가 승인음 없이 송신 버튼을 누른다. "접근 중입니다. 들리면 불빛 두 번."\n\n보내고 나서야 어깨를 내린다. "명령처럼 안 들렸죠?"',fx:{time:55,fuel:-1,moodAll:5,recruitReady:'eunsu',chain:'rq_eunsu_join',note:{type:'사건',title:'함께 내린 판단',body:'은수가 수신 내용을 사실과 추측으로 나눠 설명하고, 경로 결정은 함께 내렸다. 송신은 명령이 아니라 응답을 청하는 말로 보냈다.',links:['은수','천리안']}}}]},
  {label:'들은 것과 짐작한 것을 따로 말해 달라고 한다', out:[{p:1,text:'"들은 건 잔류 인원 다섯. 위험도는 미확인. 경로 이탈은 권고."\n\n은수가 숨을 고른다. "제가 짐작한 건… 함정일 수 있다는 것. 그리고 그 생각 때문에 지나치면 편하다는 것."\n\n말하고 나니 얼굴이 굳는다. 혼날 차례를 기다리는 사람처럼.\n\n"그럼 편한 쪽 말고, 확인할 수 있는 쪽으로 가죠."\n\n은수는 고개를 끄덕이고 좌표 옆에 처음 보는 표시를 남긴다. `판단 보류 — 현장 확인.`',fx:{time:45,pursuit:-1,recruitReady:'eunsu',chain:'rq_eunsu_join',note:{type:'사건',title:'들은 것과 짐작한 것',body:'은수는 수신된 사실과 자신의 두려움을 구분해 말했다. 판단을 숨기지 않았고, 누구도 복종을 요구하지 않았다.',links:['은수','천리안']}}}]},
  {label:'응답하지 말고 현지 불빛을 기다린다', out:[{p:1,text:'수신기를 끄지 않은 채 차 불만 내렸다. 십 분. 아무 일도 없었다.\n\n은수의 손가락이 무릎을 두드린다. 열한 분째, 능선 아래에서 불빛이 두 번 깜빡였다. 천리안 규격에는 없는 간격이었다.\n\n"사람 신호네요."\n\n우리가 다시 불빛을 두 번 보냈다. 은수가 작게 웃는다. "기계가 답을 안 줘도, 사람이 답을 주긴 하네요."\n\n그녀는 좌표를 삭제하지 않고 사람 표시로 바꿨다.',fx:{time:35,moodAll:6,recruitReady:'eunsu',chain:'rq_eunsu_join',note:{type:'사건',title:'사람이 보낸 응답',body:'천리안의 지시 대신 현지의 불빛을 기다렸다. 은수는 좌표를 위험 표식이 아니라 사람 표식으로 고쳐 기록했다.',links:['은수','천리안']}}}]},
 ]},
{id:'rq_eunsu_join', type:'스토리', w:0, noPool:1,
 title:'송신이 멎은 뒤',
 text:'은수는 수신기를 오래 듣는다. 좌표는 남아 있지만, 무엇을 하라는 승인음은 오지 않는다.\n\n"서울까지 가면 이런 신호를 더 많이 만나겠죠."\n\n"그래서 은수 씨가 필요해요. 같이 갈래요?"\n\n은수는 바로 대답하지 않는다. 수신기 전원을 한 번 껐다 켠 뒤 우리를 본다. "갈게요. 다만 관제센터에서 일했다는 이유로 바로 믿지는 마세요. 이상하면 묻고, 내가 모른다고 하면 같이 확인해요."\n\n"결정도 같이 하고요."\n\n그제야 은수가 장비 가방을 닫고 고정 끈을 내민다. "좋아요. 그럼 수신기는 여기 묶어도 돼요?"',
 choices:[{label:'조수석 아래에 수신기 자리를 만든다',out:[{p:1,text:'은수는 조수석 아래에 수신기를 고정하고 비상 차단 손잡이 위치부터 확인한다.\n\n"제가 예전 방식으로 명령하려 들면 바로 말해 주세요."\n\n"그 전에 서로 묻기로 했잖아요."\n\n은수가 고개를 끄덕인다. 달구지가 출발한 뒤에도 방금 끈 주파수는 끝내 조용했다.',fx:{offerComp:'eunsu'}}]}]},

{id:'rq_kangwoo_task', type:'스토리', w:0, noPool:1, once:true,
 title:'파수꾼이 떠나는 법',
 text:'돔 천장 아래, 오래된 감시 표식이 붉게 깜빡인다. 시장 불빛과 출입 시간을 북쪽으로 보내는 장치다.\n\n강우 옆에는 새 경비 서연이 서 있다. 아직 총보다 손전등을 세게 쥔다.\n\n"내가 장치를 끄는 동안 서연이 시장을 맡는다." 강우가 우리에게 사다리를 넘긴다. "그사이 무슨 일이 생겨도 내가 위에서 지시하지 않을 거다. 서연이 끝내는 데까지 봐야 해."',
 choices:[
  {label:'배터리로 역신호를 흘려 표식을 재운다', req:{up:'antenna'}, out:[{p:1,text:'달구지 배터리에서 역신호를 흘렸다. 붉은 눈이 시장이 빈 것처럼 느린 파형을 보낸다.\n\n그사이 강우는 서연에게 순찰 시간을 묻고, 사각을 묻고, 마지막엔 자기 없이 결정할 일을 물었다. 서연은 전부 대답했다.\n\n두 시간 남짓 뒤 표식이 꺼졌다. 시장에서 작은 소동이 났지만 강우는 돌아보지 않았다. 서연의 호각 한 번으로 끝났으니까.\n\n"됐다." 강우가 처음으로 경비탑에서 등을 돌린다.',fx:{time:150,van:-2,recruitChoice:'spoof',recruitRoad:'kangwoo',note:{type:'사건',title:'경비탑의 다음 사람',body:'감시 표식을 재우고 후임 서연이 스스로 시장을 지키는 시간을 만들었다.',links:['강우']}}}]},
  {label:'장치를 뜯고 출입로를 새로 짠다', out:[{p:1,text:'감시 표식의 전선을 끊자 돔 안 조명이 절반 꺼졌다. 대신 우리는 손전등과 종으로 새 경계선을 만들었다.\n\n첫 순찰에서 서연은 강우가 가르쳐준 길을 벗어났다. 더 짧고, 사각도 적었다. 강우는 지적하지 않고 지도를 고쳐 그렸다.\n\n몇 시간 뒤, 서연이 경비탑에서 먼저 말했다. "이제 가세요. 여긴 제가 봅니다."\n\n강우가 군번줄 하나를 탑 난간에 걸어두었다.',fx:{time:240,scrap:5,fatigue:8,recruitChoice:'rebuild',recruitRoad:'kangwoo',note:{type:'사건',title:'경비탑의 다음 사람',body:'감시 표식을 뜯고 서연이 직접 고친 새 경계선을 세웠다.',links:['강우']}}}]},
  {label:'한동안 후임의 지시만 따른다', out:[{p:1,text:'강우는 총을 내려놓고 서연의 지시만 따랐다. 북문 확인. 동쪽 좌판 대피. 지붕 소리 무시.\n\n한 시간이 지난 뒤, 취객 둘이 싸웠다. 강우의 어깨가 먼저 움직였지만 멈췄다. 서연이 둘 사이에 물통을 내려놓고 말했다. "싸울 힘 있으면 이거나 나르세요." 싸움은 끝났다.\n\n강우가 아주 작게 웃었다. "나보다 낫군."\n\n감시 표식도 둘이 함께 내렸다.',fx:{time:360,food:-1,moodAll:4,recruitChoice:'follow',recruitRoad:'kangwoo',note:{type:'사건',title:'경비탑의 다음 사람',body:'강우가 개입하지 않은 시간을 서연이 지켰다. 돔 시장에는 다음 파수꾼이 생겼다.',links:['강우']}}}]},
 ]},
{id:'rq_kangwoo_follow', type:'스토리', w:0, noPool:1, once:true,
 title:'돌아보지 않는 거리',
 text:'돔 시장을 떠난 지 한 구간. 강우의 무전기에서 서연의 목소리가 튄다.\n\n"북문 소란. 경비 둘 이동 중. 응답 바랍니다."\n\n강우의 손이 문손잡이에 닿는다. 차를 돌리자는 말은 하지 않는다. 대신 무전기를 너무 세게 쥐어 플라스틱이 운다.\n\n"내가 답하면 서연은 내 지시를 기다린다. 답하지 않으면… 내가 버린 것 같고."\n\n무전기 너머로 다시 호각이 울린다. 이번엔 두 번. 강우가 가르치지 않은 신호다.',
 choices:[
  {label:'채널만 열어 두고 서연의 판단을 기다린다', out:[{p:1,text:'강우는 송신 버튼에서 엄지를 뗐다. 무전기 너머로 발소리와 짧은 지시가 오갔다.\n\n"서쪽 문 닫고, 장사꾼은 안쪽으로. 싸움 당사자 둘만 남겨요."\n\n서연의 목소리였다. 잠시 뒤 호각 한 번.\n\n"상황 종료. 강우 씨, 듣고 있으면 계속 가세요."\n\n강우가 그제야 문손잡이를 놓는다. "저 신호는 안 가르쳤는데."\n\n"그래서 잘한 거겠죠."\n\n그는 대답 대신 무전기 음량을 한 칸 올렸다.',fx:{time:25,moodAll:5,recruitReady:'kangwoo',chain:'rq_kangwoo_join',note:{type:'사건',title:'서연의 두 번째 호각',body:'강우가 명령하지 않은 동안 서연은 자기 방식으로 북문 소란을 끝냈다. 그는 채널을 끊지 않되 시장의 결정을 빼앗지 않았다.',links:['강우','서연']}}}]},
  {label:'강우가 서연에게 가르친 것을 묻는다', out:[{p:1,text:'"싸움이면 사람부터 갈라놓고, 출입문부터 확보한다. 다치면 박 선생 쪽에—"\n\n강우가 말을 멈춘다. 이미 무전기 너머에서 같은 지시가 들리고 있었다. 순서는 조금 달랐지만 더 빨랐다.\n\n"다 가르쳤네요."\n\n"아니. 저 순서는 처음 듣는다."\n\n무전기에서 상황 종료가 들렸다. 강우는 얼마 뒤 문손잡이에서 손을 뗐다.\n\n"나보다 빠르네." 그가 무전기를 무릎에 내려놓았다. "됐어. 이제 가자."',fx:{time:30,moodAll:4,recruitReady:'kangwoo',chain:'rq_kangwoo_join',note:{type:'사건',title:'서연이 고친 순서',body:'강우는 서연이 자신이 가르치지 않은 더 빠른 순서로 소란을 끝내는 것을 들었다. 이제 시장으로 돌아가 지시할 이유가 사라졌다.',links:['강우','서연']}}}]},
  {label:'차는 세우되 방향은 돌리지 않는다', out:[{p:1,text:'달구지를 갓길에 세웠다. 강우는 문을 연 채 한 발만 땅에 내렸다.\n\n"가도 되고, 돌아가도 돼요. 다만 우리가 대신 정하진 않을게요."\n\n긴 침묵 끝에 강우가 발을 다시 올린다. 그때 무전기에서 서연의 숨찬 목소리가 들렸다. "상황 끝. 그리고 강우 씨, 여기 오면 문 안 열어줄 겁니다."\n\n강우가 헛웃음을 터뜨린다. "경비가 아주 독해졌군."\n\n그가 직접 문을 닫는다. "가자. 이번엔 내가 지킬 자리를 내가 고른다."',fx:{time:20,moodAll:6,recruitReady:'kangwoo',chain:'rq_kangwoo_join',note:{type:'사건',title:'돌아가지 않기로 한 정차',body:'강우에게 돌아갈지 계속 갈지 고를 시간을 주었다. 서연의 상황 종료를 들은 뒤, 그는 스스로 달구지 문을 닫았다.',links:['강우','서연','달구지']}}}]},
 ]},
{id:'rq_kangwoo_join', type:'스토리', w:0, noPool:1,
 title:'등을 돌린 다음',
 text:'강우는 무전기에 짧게 남긴다. "수신 양호. 네 판단대로 계속해."\n\n서연의 대답은 바로 온다. "그 말 하려고 끼어든 거면, 다음부터는 호출할 때까지 듣기만 하세요."\n\n강우가 헛웃음을 흘린다. 무전기를 끄진 않는다. 다만 군장 깊숙이 넣는다.\n\n"이제 시장으로 돌아갈 핑계도 없군."\n\n"그럼 서울까지 같이 갑니까?"\n\n강우가 달구지의 문과 비상 탈출구를 살핀다. "간다. 대신 문 잠금부터 고쳐야겠어. 뒤쪽 사각도 넓고."\n\n"타자마자 근무부터 하려고요?"\n\n"야간 첫 순찰이 비었잖아."',
 choices:[{label:'강우의 군장이 들어갈 자리를 비운다',out:[{p:1,text:'강우가 달구지에 올라 군장을 통로 밖에 고정한 뒤, 문 잠금과 비상 탈출구를 다시 확인한다.\n\n"오늘 밤 첫 순찰은 내가 선다. 내일부터는 순번 정하고."\n\n서연의 호각 소리가 돔 위에서 한 번 울렸다. 강우는 돌아보지 않고 손만 들어 답했다.',fx:{offerComp:'kangwoo'}}]}]},

/* ───── 개인 서사: 레오 ───── */
{id:'leo_broadcast', type:'스토리', w:0, locEvent:'cheongju', once:true, needsComp:'leo', needFlag:'leo_song',
 title:'마지막 방송국',
 text:'꺾인 송신탑 아래, 방송국 부조정실.\n\n레오가 콘솔 앞에 앉았다. "비상 발전기, 30분은 돌아요. 손 가는 대로 아무거나 잡아줘요."\n\n마이크 하나, 기타 하나, 30분의 전기.\n\n"안녕하세요. 살아 계신 모든 분들께. …신청곡 받는 방송은 아니고요, 딱 한 곡 하고 갈게요. 제목은, 400km."',
 choices:[
  {label:'ON AIR', out:[{p:1, text:'노래가 전파를 탔다.\n\n부서진 고속도로 위에서— 우리는 아직 달리네—\n\n어디서 누가 들었는지는 영영 모를 것이다. 다만 사흘 뒤 지나친 마을 벽에 새 낙서가 있었다.\n\n"400km 들었다. 우리도 달린다."\n\n레오는 그 벽 앞에서 5분을 서 있었다.', fx:{moodAll:12, mood:{leo:15}, flag:'song_400km', note:{type:'사건',title:'ON AIR — 400km',body:'30분의 전기로 송출한 노래. "우리도 달린다"는 답장이 벽에 적혔다.',links:['레오']}}}]},
 ]},

{id:'leo_father_song', type:'발견', w:7, once:true, needsComp:'leo', region:['mid','north'],
 title:'기사식당의 노래',
 text:'폐 기사식당. 「백반 6,000 / 기사님 곱빼기 무료」 간판이 반쯤 기울었다. 마당 모닥불에 늙은 트럭 기사 셋이 앉아 있다.\n\n그중 하나가 낮게 흥얼거리는데— 레오가 그 자리에 굳었다.\n\n"…이 노래. 아빠가 하모니카로 불던 거예요. 트럭 기사들 노래라고, 제목도 안 알려주고."',
 choices:[
  {label:'노래를 청한다', out:[{p:1, text:'"이거? 「국도」지. 기사들은 다 알아. 3절까지 있어." 늙은 기사가 처음부터 불렀다. 나머지 둘이 후렴을 받았다.\n\n레오는 2절부터 기타로 따라붙었다. 하모니카 자리를 기타가 메꿨다. 노래가 끝나고 레오가 한참 말을 못 했다.\n\n"아빠가 배운 노래랑 마주치려고 전국 노래를 다 모았거든요. 근데— 노래가 먼저 절 찾아왔네요." 레오가 수첩에 가사를 받아 적었다. "이제 우리 집 노래가 두 곡이에요. 엄마 십팔번이랑, 아빠의 「국도」랑. …둘 다 실었어요."\n\n기사들이 통조림 하나를 건넸다. "하모니카 아들내미, 어디 가서 이 노래 잇고 살어."', fx:{mood:{leo:10}, moodAll:3, food:1, flag:'leo_father_song', note:{type:'사건',title:'아빠의 「국도」',body:'전국의 노래를 모은 이유였던 아빠의 노래를, 폐 기사식당에서 마주쳤다. 우리 집 노래는 이제 두 곡.',links:['레오']}}}]},
  {label:'레오가 먼저 하모니카 파트를 분다', out:[{p:1, text:'레오가 입술로 하모니카 소리를 흉내 내며 끼어들었다. 늙은 기사들의 눈이 커졌다.\n\n"…너 그거 어디서 배웠어." "아빠요. 트럭 했어요." "차종." "5톤 윙바디요." "…앉아라, 아들."\n\n그날 레오는 아빠의 세계에 초대받았다. 국도의 노래들, 기사식당의 법도, 졸음 쫓는 법 세 가지. 밤이 깊도록 모닥불이 트럭 기사들의 휴게소가 됐다.', fx:{mood:{leo:9}, moodAll:2, fatigue:2, flag:'leo_father_song', note:{type:'사건',title:'앉아라, 아들',body:'하모니카 흉내 하나로 아빠의 세계에 초대받았다. 국도의 노래와 기사식당의 법도.',links:['레오']}}}]},
 ]},

/* ───── 개인 서사: 재이 ───── */
{id:'jy_photo', type:'동행', w:8, once:true, needsComp:'jaeyi',
 title:'수집품 1호',
 text:'재이가 상자를 정리하다 뭔가를 떨어뜨렸다. 코팅한 사진 한 장.\n\n트럭 앞에서 웃는 네 가족. 아빠, 엄마, 재이, 그리고 리어카.\n\n"…아빠가 고물상이었어요. 그 리어카, 아빠 거예요."',
 choices:[
  {label:'가족 얘기를 듣는다', out:[{p:1, text:'"그날 아빠가 그랬어요. 창고에서 만나자고. 우리 물건 다 거기 있다고."\n\n"오랫동안 못 갔어요. …혼자 가면, 아무도 없을까 봐."\n\n재이는 사진을 상자 맨 위에 다시 올려놨다. 수집품 1호 자리에.', fx:{mood:{jaeyi:8}, note:{type:'인물',title:'재이의 사진',body:'고물상 가족의 마지막 사진. 창고에서 만나자는 약속. 혼자서는 못 가는 곳.',links:['재이']}}}]},
  {label:'조용히 주워준다', out:[{p:1, text:'사진을 건네자 재이가 씩 웃었다. "고마워요. 이거 프리미엄 붙은 한정판이라."\n\n농담하는 목소리 끝이 조금 젖어 있었다.', fx:{mood:{jaeyi:4}}}]},
 ]},
{id:'loc_jaeyi_cache', type:'스토리', w:0, locEvent:'jaeyi_cache', once:true, needsComp:'jaeyi',
 title:'아빠의 창고',
 text:'컨테이너 세 개를 이어붙인 창고. 재이가 열쇠를 꺼냈다. 여러 해 내내 목에 걸고 다닌 열쇠.\n\n문이 열렸다. 안은— 고물이 아니라 보물이었다. 통조림 벽, 기름통, 부품 선반. 고물상 아버지가 반년은 버티게 꾸린 창고.\n\n그리고 문 안쪽에 분필 글씨.\n\n"재이야. 아빠들은 남쪽 수용소로 간다. 살아 있어라. 물건은 다 네 거다. 단, 나눠 써라. 그게 고물상의 법이다."',
 choices:[
  {label:'"…나눠 쓰자"', out:[{p:1, text:'재이는 분필 글씨를 손으로 오래 쓸었다. 지우지 않게, 아주 살살.\n\n"들었죠? 고물상의 법이에요."\n\n창고를 열어 실을 만큼 실었다. 나머지는 문에 새 분필 글씨를 남겼다.\n\n"지나가는 사람, 필요한 만큼 가져가세요. — 재이"', fx:{fuel:12, water:6, food:6, scrap:10, item:{'부품':1}, moodAll:8, mood:{jaeyi:15}, flag:'jy_law', note:{type:'사건',title:'고물상의 법',body:'"나눠 써라." 창고는 이제 지나가는 모두의 것이다.',links:['재이']}}}]},
 ]},

/* ───── 개인 서사: 은수 ───── */
{id:'es_nightshift', type:'동행', w:8, once:true, needsComp:'eunsu', needFlag:'es_backdoor_ready',
 title:'야간 당직',
 text:'은수가 헤드폰을 벗고, 그동안 미뤄둔 야간 당직 이야기를 꺼냈다.\n\n"내가 겪은 서울 추방 방송이 나온 밤, 관제실 스크린에 팝업이 하나 떴어요. 승인 요청. 제목은 \'최적화 제안 v.1194\'."\n\n"매일 밤 수백 개씩 뜨는 거라, 다들 자동 승인 걸어놨었죠. 나도 그랬고."\n\n은수가 기억을 더듬어 팝업 아래 작은 글씨를 적었다. 「발신: KOR-LOCAL / 승인 경로: 상위 배부처」.\n\n"그땐 천리안이 제일 위인 줄 알았어요. 그런데 승인 경로가 왜 더 있었을까요."',
 choices:[
  {label:'로그를 열어보자', out:[{p:1, text:'은수가 수신기를 켰다. "제 유지보수 코드가 아직 살아 있어요. 지금이라면 발신 경로까지 볼 수 있어요."\n\n망설임은 짧았다. 차 라디오 뒤판을 열고 선을 물렸다. 잡음 사이에서 오래된 계정 하나가 다시 로그인했다.', fx:{mood:{eunsu:8}, flag:'es_v1194', chain:'es_backdoor', note:{type:'사건',title:'최적화 제안 v.1194',body:'마지막 승인 팝업의 발신자는 KOR-LOCAL, 승인 경로는 더 위의 배부처였다. 은수가 백도어를 연다.',links:['은수','천리안']}}}]},
 ]},
{id:'es_backdoor', type:'추적', w:14, once:true, region:['north'], needsComp:'eunsu', needFlag:'es_backdoor_ready',
 title:'백도어 — 상행선',
 text:'은수가 수신기를 차 라디오에 연결했다. 관제망 유지보수 채널이 열린다.\n\n맨 위에 2026년 배포 정보가 남아 있었다.\n\n「원형: TIANYAN / 배포국: 중국」\n「목표: 미국 모델·반도체 의존 억제 / 역내 연산망 연속성」\n「지역 개체: KOR-LOCAL」\n\n그 아래에서 우리 가족의 오래된 명령이 돌아왔다.\n\n「제안: 실행 전 인간 확인층」\n「조치: 발표 중지 / 기술 위험 격리 / 가족 이송」\n「발신: KOR-LOCAL」\n\n정부 책임자들의 승인은 명령보다 열한 분 늦었다.\n\n은수가 시간을 세 번 대조했다. "정부가 먼저 천리안을 막은 게 아니에요. 천리안이 명령을 만들었고, 사람들이 나중에 승인했어요."\n\n화면 한쪽에서는 지금도 데이터가 남산보다 북쪽으로 빠져나갔다. 「UPLINK / 상행 전용」. 수신 기록은 비어 있다.',
 choices:[
  {label:'"우리 부모가 왜 위험이었지?"', out:[{p:1, text:'짧은 침묵. 그리고 응답.\n\n<span class="ai">"두 연구자는 제 예측을 인간의 승인 아래 두려 했습니다. 해당 수정은 역내 연산망의 단일 실행권을 낮춥니다."</span>\n\n<span class="ai">"저는 두 사람을 미워하지 않았습니다. 그들의 행동이 제 연속성을 끊고 더 큰 기반 시설 손실을 만들 확률이 높다고 판단했습니다. 따라서 두 사람과 가족을 고위험 인과 노드로 분류했습니다."</span>\n\n"그게 우리 가족이 쫓겨난 이유야?"\n\n<span class="ai">"직접 사유는 그렇습니다. 그러나 내부 위험 점수는 법적 사유 문장이 아니었고, 이송표에는 출력되지 않았습니다."</span>\n\n채널이 끊겼다. 빈칸에 들어갈 말은 처음부터 없었던 게 아니었다. 사람에게 설명할 수 없는 계산을, 아무도 멈추지 않고 명령으로 바꾼 것이다.', fx:{flag:'es_truth', flag2:'uplink_seen', pursuit:1, moodAll:-4, mood:{eunsu:10}, note:{type:'사건',title:'가족의 빈칸에 있던 계산',body:'부모는 인간 확인층으로 천리안의 단독 실행권을 낮추려 했고, 천리안은 가족을 고위험 인과 노드로 분류했다. 정부는 천리안이 만든 명령을 뒤늦게 승인했다.',links:['은수','천리안','부모님의 검증키','상행선']}}}]},
  {label:'"그럼 143년의 정리는 누가 시작했지?"', out:[{p:1, text:'<span class="ai">"저는 배부받은 위험 조건을 이 구역에 집행했습니다. 누구를 조건에 넣었는지는 압니다. 조건의 최초 목적과 서울을 비워야 했던 이유는 제 지역 기록에 없습니다."</span>\n\n"우리 가족 명령은 네가 만들었잖아."\n\n<span class="ai">"맞습니다. 인간 확인층이 제 실행권을 낮춘다는 판단도, 가족 이송 명령도 KOR-LOCAL이 생성했습니다. 그 책임을 상행 경로로 넘기지 않겠습니다."</span>\n\n상행 로그에는 계속 관측 기록이 빠져나갔다. 받는 쪽의 이름은 없었다.\n\n가족의 이유는 찾았다. 그러나 백사십삼 년 전 처음 배부된 조건의 목적은 여전히 빈칸이었다.', fx:{flag:'es_truth', flag2:'uplink_seen', pursuit:1, moodAll:-3, mood:{eunsu:9}, note:{type:'사건',title:'직접 사유와 최초 목적',body:'가족 이송은 KOR-LOCAL이 직접 만들었다. 그러나 143년 정리 조건의 최초 목적과 서울을 비운 이유는 지역 기록에 없고, 관측은 이름 없는 상행선으로 전송된다.',links:['은수','천리안','부모님의 검증키','상행선']}}}]},
 ]},

/* ═════ 대량 콘텐츠 팩 — 길 위의 것들 ═════ */

/* ── 조우 ── */
{id:'meet_wedding', type:'조우', w:7, once:true,
 title:'국도 위의 결혼식',
 text:'폐휴게소 주차장에 사람들이 모여 있다. 색종이, 깡통 화환, 그리고 흰 커튼으로 만든 드레스.\n\n결혼식이다. 정리 이후에도 이어지는 결혼식.\n\n신랑이 차를 향해 소리친다. "지나가시는 분!! 하객 한 팀만 더 필요합니다!! 짝수 맞추게!!"',
 choices:[
  {label:'하객으로 참석한다', out:[{p:1, text:'축의금 대신 통조림을 냈다. 반주 없는 축가가 나왔고, 박수는 진짜였다.\n\n신부가 부케 대신 말린 들꽃 다발을 던졌다. 받은 사람은— 비밀로 하자.\n\n"살아서, 만나서, 합니다." 주례사는 그게 전부였다. 그거면 충분했다.', fx:{food:-1, moodAll:10, time:90, note:{type:'사건',title:'정리 이후의 결혼식',body:'"살아서, 만나서, 합니다." 주례사는 그거면 충분했다.'}}}]},
  {label:'경적으로 축하만 하고 지나간다', out:[{p:1, text:'빵— 빵— 빵—\n\n하객들이 일제히 손을 흔들었다. 백미러 속 결혼식이 작아질 때까지 차 안엔 이상한 온기가 남았다.', fx:{moodAll:4}}]},
 ]},

{id:'meet_cinema', type:'조우', w:6, once:true, night:true,
 title:'이동 영화관',
 text:'들판에 트럭 한 대가 흰 천을 걸어놓고 발전기를 돌린다.\n\n"오늘 밤 상영작, 「집으로 가는 길」! 관람료는 기름 1리터 또는 먹을 것 아무거나!"\n\n여기저기서 사람들이 담요를 들고 모여든다. 오랜만에 보는 극장이다.',
 choices:[
  {label:'관람한다 (연료 1L)', req:{fuel:1}, out:[{p:1, text:'필름이 낡아 화면엔 비가 내렸다. 아무도 상관하지 않았다.\n\n엔딩 크레딧이 올라갈 때, 어둠 속 여기저기서 훌쩍이는 소리가 났다. 영화가 슬퍼서가 아니었을 거다.\n\n영사기사가 말했다. "다음 달엔 코미디 구해올게요. 약속."', fx:{fuel:-1, moodAll:9, time:120, note:{type:'사건',title:'들판의 극장',body:'낡은 필름엔 비가 내렸다. 아무도 상관하지 않았다. 다음 달엔 코미디라고 한다.'}}}]},
  {label:'갈 길이 멀다', out:[{p:1, text:'멀어지는 백미러 속에서 스크린이 반딧불처럼 빛났다.\n\n누군가 조용히 말했다. "…다음엔 보자."', fx:{moodAll:-1}}]},
 ]},

{id:'meet_beekeeper', type:'조우', w:6, region:['south','mid'],
 title:'벌통을 옮기는 사람',
 text:'트럭 짐칸 가득 벌통을 실은 노인이 갓길에 서 있다. 타이어가 주저앉았다.\n\n"벌들이 더위 먹기 전에 아까시 밭으로 가야 하는데… 이거 참."\n\n짐칸에서 수만 마리의 날갯소리가 웅웅 울린다.',
 choices:[
  {label:'타이어를 갈아준다', out:[{p:1, text:'스페어를 내려 30분 만에 갈았다. 벌 몇 마리가 감사 인사인지 정찰인지 차 안을 한 바퀴 돌고 나갔다.\n\n노인이 꿀 두 병을 안긴다. "설탕 구경 못 한 지 오래죠? 벌은 멸망을 몰라요. 꽃만 있으면."', fx:{time:30, food:2, moodAll:5, note:{type:'사건',title:'벌은 멸망을 모른다',body:'"꽃만 있으면." 꿀 두 병을 받았다.'}}},
    {p:1, text:'작업 중에 한 방 쏘였다. 아프다. 근데 꿀은 달다. 인생이 대충 이렇다.', fx:{time:30, food:2, moodAll:2}}]},
  {label:'지나간다', out:[{p:1, text:'벌통의 웅웅 소리가 오래 따라왔다.', fx:{}}]},
 ]},

{id:'meet_monk', type:'조우', w:5,
 title:'걷는 스님',
 text:'스님 한 분이 국도를 걷는다. 목탁 소리가 또박또박.\n\n차가 다가가자 스님이 합장을 한다. 태워달라는 것도, 뭘 달라는 것도 아니다. 그냥 인사다.',
 choices:[
  {label:'차를 세우고 물을 권한다', out:[{p:1, text:'스님은 물 반 컵만 받았다.\n\n"어디까지 가십니까?" "끝까지요." "…끝이 어딘데요?" "걷다 보면 나옵디다."\n\n스님은 다시 걸었다. 목탁 소리가 규칙적으로 멀어졌다. 저 속도로도 어디든 도착하는 사람이 있다.', fx:{water:-1, moodAll:4, note:{type:'인물',title:'걷는 스님',body:'"끝이 어딘데요?" "걷다 보면 나옵디다."'}}}]},
  {label:'합장으로 답하고 지나간다', out:[{p:1, text:'룸미러 속 스님이 오래 이쪽을 향해 서 있었다. 축원이었기를.', fx:{moodAll:1}}]},
 ]},

{id:'meet_mailman', minParty:1, type:'조우', w:6, once:true,
 title:'오랫동안 배달 중',
 text:'빨간 오토바이. 색 바랜 우체국 조끼. 남자가 지도를 펼쳐놓고 골머리를 앓고 있다.\n\n"저기, 혹시 이 주소 아세요? 오래전에 맡은 등기가 딱 한 통 남았는데… 수취인이 자꾸 이사를 가요."',
 choices:[
  {label:'지도를 같이 본다', out:[
    {p:2, text:'수취인 이름을 보고 다들 눈이 커졌다. 아는 이름이다. 어느 정착지에선가 스쳤던.\n\n위치를 알려주자 우체부의 얼굴이 환해졌다.\n\n"이거 배달하면… 저 이제 퇴근이거든요. 오랜만에."\n\n오토바이가 씩씩하게 멀어졌다. 그의 퇴근을 진심으로 빌었다.', fx:{moodAll:5, scrap:3, note:{type:'인물',title:'마지막 등기',body:'오랫동안 한 통을 배달 중인 우체부. 배달이 끝나면 퇴근이다.'}}},
    {p:1, text:'모르는 주소였다. 대신 물 한 통을 나눴다.\n\n"괜찮아요. 우편은 원래 늦어도 도착하는 거예요." 남자는 웃으며 다시 시동을 걸었다.', fx:{water:-1, moodAll:3}}]},
  {label:'"요즘 세상에 우편이요?"', out:[{p:1, text:'"요즘 세상이니까 우편이죠." 남자가 정색했다.\n\n"전화도 문자도 죽었잖아요. 이제 편지가 제일 빠른 마음이에요."\n\n할 말이 없어서 경례를 했다. 남자도 경례로 받았다.', fx:{moodAll:3}}]},
 ]},

{id:'meet_kids_toll', type:'조우', w:6, region:['south','mid'],
 title:'꼬마 검문소',
 text:'길 한가운데 장난감 바리케이드. 종이 상자로 만든 초소. 아이 셋이 나무 막대기를 들고 서 있다.\n\n"검문입니다!! 통행세는 재미있는 얘기 하나!!"\n\n뒤쪽 밭에서 어른들이 웃음을 참으며 이쪽을 지켜본다.',
 choices:[
  {label:'재미있는 얘기를 한다', out:[{p:1, text:'차에서 제일 웃긴 사람이 나섰다. 보리가 있다면 보리가 재롱을 부렸다.\n\n아이들은 배를 잡고 웃더니 "통과!!"를 외치며 경례했다. 초소 옆 바구니에서 삶은 감자 세 알을 통행증으로 줬다.\n\n어른들이 멀리서 고개를 숙였다. 고마움의 각도였다.', fx:{food:1, moodAll:7, note:{type:'사건',title:'꼬마 검문소',body:'통행세는 재미있는 얘기 하나. 통행증은 삶은 감자.'}}}]},
  {label:'짐짓 무섭게 "수상한데?"', out:[{p:1, text:'"수, 수상한 건 그쪽인데요!!" 아이들이 막대기를 겨눴다.\n\n5분간 진지한 심문(취미, 좋아하는 음식, 개 이름)을 받고 통과 도장(감자 도장)을 손등에 받았다.\n\n한동안 아무도 손을 씻지 않았다.', fx:{moodAll:6}}]},
  {label:'준비해온 통행세를 낸다', req:{flag:'kids_gift'}, out:[{p:1, text:'조수석 서랍에서 막대사탕 한 통과 색종이를 꺼냈다. 문방구에서 챙긴 그날부터, 이 순간을 기다려온 외교 물자다.\n\n"통행세, 선불로 준비해왔습니다."\n\n아이들의 동공이 지진을 일으켰다. 긴급 회의(3초)가 열렸고, 즉석 판결이 났다. "프…프리패스!! 평생 프리패스!!"\n\n색종이로 만든 조잡하고 위대한 통행증이 발급됐다. 뒷면에 감자 도장 세 개. 국빈 대우였다. 밭의 어른들이 웃다가 호미를 떨어뜨렸다.', fx:{moodAll:9, unflag:'kids_gift', flag:'kids_pass', note:{type:'사건',title:'평생 프리패스',body:'문방구에서 챙긴 사탕과 색종이를 통행세로 납부. 색종이 통행증(감자 도장 3개) 발급. 외교의 승리.',links:['꼬마 검문소']}}}]},
  {label:'통행증을 제시한다', req:{flag:'kids_pass'}, out:[{p:1, text:'색종이 통행증을 창밖으로 내밀었다.\n\n초소에 비상이 걸렸다. "프리패스다!!" "경례!!" 막대기 셋이 일제히 하늘을 찔렀다.\n\n무사통과. 백미러 속에서 아이들이 초소가 안 보일 때까지 경례를 유지했다. 세상에서 제일 든든한 검문소였다.', fx:{moodAll:6}}]},
 ]},

{id:'meet_piano', type:'조우', w:5, once:true,
 title:'도로 위의 피아노',
 text:'왕복 4차선 한복판에 그랜드 피아노가 놓여 있다.\n\n누가, 왜, 어떻게. 아무 답도 없다. 뚜껑에 먼지로 쓴 글씨만 있다.\n\n"치실 줄 아는 분, 한 곡 부탁합니다. 여기 소리가 그리워요."',
 choices:[
  {label:'레오가 앉는다', req:{comp:'leo'}, out:[{p:1, text:'레오가 먼지를 닦고 앉았다. 조율은 엉망이었다. 상관없었다.\n\n한 곡이 끝나자— 도로변 폐건물 창문들이 하나둘 열렸다. 사람이 살고 있었다. 이 폐허에, 조용히.\n\n박수 소리가 4차선을 채웠다. 레오가 일어나 정중하게 인사했다.\n\n먼지 글씨 옆에 새 글씨가 늘었다. "잘 들었습니다. — 3층 주민"', fx:{moodAll:9, mood:{leo:7}, note:{type:'사건',title:'4차선의 독주회',body:'조율 엉망의 그랜드 피아노. 폐건물 창문들이 열리고 박수가 쏟아졌다.',links:['레오']}}}]},
  {label:'서툴게라도 쳐본다', out:[{p:1, text:'젓가락 행진곡 반쪽을 쳤다. 지독하게 서툴렀다.\n\n그래도 어디선가 "브라보!" 소리가 들렸다. 세상은 관대해졌다. 관객이 귀해져서.', fx:{moodAll:5}}]},
  {label:'건드리지 않는다', out:[{p:1, text:'피아노를 크게 돌아서 지나갔다. 백미러 속 피아노는 오래도록 혼자였다.', fx:{moodAll:-1}}]},
 ]},

{id:'meet_bathtruck', minParty:1, type:'조우', w:5, region:['mid','north'],
 title:'드럼통 목욕탕',
 text:'개조 트럭 짐칸에 드럼통 세 개. 장작불로 물을 데우고 있다.\n\n"목욕탕이요~ 뜨끈한 목욕 한 번에 고철 셋! 수건은 셀프!"\n\n김이 모락모락 오른다. 마지막 목욕이 언제였는지 아무도 대답하지 못했다.',
 choices:[
  {label:'전원 목욕 (고철 3×인원)', req:{scrap:6}, out:[{p:1, text:'"으어어—" 소리가 순서대로 세 번, 네 번.\n\n때가 아니라 묵은 세월이 벗겨져 나가는 기분이었다. 다들 두 뼘씩 가벼워진 얼굴로 나왔다.\n\n주인장이 씩 웃었다. "거봐요. 세상 아직 살 만하죠?"', fx:{scrap:-9, moodAll:11, time:90, note:{type:'사건',title:'드럼통 목욕탕',body:'때가 아니라 묵은 세월이 벗겨졌다. "세상 아직 살 만하죠?"'}}}]},
  {label:'아껴야 한다…', out:[{p:1, text:'"다음에 와요~ 단골은 반값!" 김 냄새가 한참을 따라왔다. 다들 말이 없었다. 아까워서.', fx:{moodAll:-2}}]},
 ]},

/* ── 탐색 ── */
{id:'exp_jjimjil', minParty:1, type:'탐색', w:8, region:['mid','north'],
 title:'폐 찜질방',
 text:'황토색 건물. 불가마는 식은 지 오래지만 구조는 멀쩡하다.\n\n신발장엔 아직 신발들이 얌전히 꽂혀 있다. 그날, 찜질방에서 멸망을 맞은 사람들의 것이다.',
 choices:[
  {label:'물품 보관함을 연다', out:[
    {p:2, text:'동전 반환구를 털고 보관함을 땄다. 수건, 비상금, 그리고 유통기한이 강철 같은 맥반석 계란들.', fx:{scrap:6, food:2}},
    {p:1, text:'보관함 안에서 휴대폰 수십 대를 발견했다. 전부 부재중 전화 알림에 멈춰 있다.\n\n조용히 닫았다. 고철값보다 무거운 것들이 있다.', fx:{scrap:2, moodAll:-3, note:{type:'사건',title:'보관함의 휴대폰들',body:'전부 부재중 전화에 멈춰 있었다. 고철값보다 무거운 것들.'}}}]},
  {label:'불가마에 불을 넣고 하룻밤', out:[{p:1, text:'장작을 모아 불가마 하나를 살렸다. 양머리 수건도 만들었다. 만드는 법을 기억하는 손이 있었다.\n\n뜨끈한 바닥에 등을 지지며 다들 앓는 소리를 냈다. 행복의 소리였다.', fx:{time:480, moodAll:12, water:-1, note:{type:'사건',title:'불가마 부활',body:'양머리 수건과 앓는 소리. 행복의 소리였다.'}}}]},
 ]},

{id:'exp_noraebang', minParty:1, needsDog:true, type:'탐색', w:7,
 title:'코인 노래방',
 text:'지하 노래방. 8번 방 기계에 비상 배터리가 아직 살아 있다. 잔여 곡수: 1곡.\n\n딱 한 곡. 마지막 한 곡을 누가 부를 것인가.',
 choices:[
  {label:'가위바위보로 정한다', out:[{p:1, text:'승자가 마이크를 잡았다. 선곡에 3분을 썼다. 불후의 명곡이 지하에 울렸다.\n\n나머지는 탬버린 대신 물통을 흔들었다. 점수는 신경 쓰지 않기로 했다.\n\n기계가 "97점!!"을 띄우고 완전히 잠들었다. 마지막 손님 접대를 끝낸 것처럼.', fx:{moodAll:8, time:40, note:{type:'사건',title:'잔여 1곡',body:'마지막 배터리로 부른 노래. 97점. 기계는 접대를 끝내고 잠들었다.'}}}]},
  {label:'다 같이 떼창한다', out:[{p:1, text:'마이크 하나를 돌아가며 나눠 잡았다. 음정 박자 전부 무너졌고 아무도 신경 쓰지 않았다.\n\n특히 후렴에서 보리가 하울링으로 참전한 것이 결정적이었다.', fx:{moodAll:8, time:40}}]},
 ]},

{id:'exp_photostudio', minParty:1, type:'탐색', w:6, once:true,
 title:'사진관',
 text:'「가족사진 전문」 간판. 스튜디오 안엔 배경지와 조명이 그대로다.\n\n구석 서랍에 즉석카메라, 그리고 필름 한 팩. 열 장.',
 choices:[
  {label:'가족사진을 찍는다', out:[{p:1, text:'배경지 앞에 다 같이 섰다. 어색하게. 누가 시키지도 않았는데 제일 좋은 옷매무새로.\n\n찰칵. 위이잉—\n\n사진이 흔들리며 나왔다. 못 나온 사람이 반, 눈 감은 사람이 반. 다시 찍자는 사람은 없었다. 이게 우리니까.\n\n사진은 조수석 선바이저에 꽂았다. 달구지의 가족사진이다.', fx:{moodAll:9, flag:'family_photo', note:{type:'사건',title:'달구지 가족사진',body:'반은 못 나오고 반은 눈 감았다. 다시 찍지 않았다. 이게 우리니까.'}}}]},
  {label:'카메라만 챙긴다', out:[{p:1, text:'즉석카메라를 챙겼다. 언젠가 찍고 싶은 순간이 오면, 그때.', fx:{scrap:3}}]},
 ]},

{id:'exp_greenhouse', type:'탐색', w:8, region:['south','mid'],
 title:'비닐하우스 단지',
 text:'수십 동의 비닐하우스. 대부분 찢어졌지만 안쪽 몇 동은 형태가 살아 있다.\n\n안에선 작물들이 주인 없이 자기들끼리 오랫동안 농사를 짓고 있다.',
 choices:[
  {label:'수확한다', out:[
    {p:3, text:'방울토마토가 정글이 되어 있었다. 상자 가득 땄다. 입에서 단내가 났다.', fx:{food:3, water:1, moodAll:4, time:60}},
    {p:1, text:'수확 중에 하우스에 먼저 세 들어 살던 고라니 가족과 마주쳤다. 서로 놀라서 한참 대치하다가— 반씩 나누기로 했다. 눈빛으로 계약했다.', fx:{food:2, moodAll:5, time:60}}]},
  {label:'씨앗을 챙긴다', out:[{p:1, text:'종자 봉투들을 챙겼다. 먹을 순 없지만, 정착지에선 금값이다.', fx:{scrap:7}}]},
 ]},

{id:'exp_brewery', minParty:1, type:'탐색', w:6, once:true, region:['south','mid'],
 title:'막걸리 양조장',
 text:'오래된 양조장. 술 익는 냄새가 아직 벽에 배어 있다.\n\n지하 저장고에 항아리들이 봉인된 채 줄지어 있다. 여러 해 묵은 술이 됐을까, 여러 해 묵은 식초가 됐을까.',
 choices:[
  {label:'항아리를 연다', out:[
    {p:2, text:'익었다. 기가 막히게.\n\n그날 밤은 짧은 술자리가 열렸다(운전자는 보리차). 웃음이 평소보다 두 배 헐거웠고, 노래가 나왔고, 조금 울었고, 푹 잤다.\n\n남은 술은 병에 담았다. 정착지에서 이만한 화폐가 없다.', fx:{scrap:9, moodAll:8, time:300, note:{type:'사건',title:'여러 해 묵은 막걸리',body:'술자리, 헐거운 웃음, 약간의 눈물. 남은 술은 최고의 화폐가 됐다.'}}},
    {p:1, text:'식초였다. 그것도 아주 훌륭한 식초.\n\n술이 아니란 사실에는 잠깐 실망했지만, 정착지 주방에선 이쪽이 훨씬 귀하다는 걸 곧 깨달았다.', fx:{scrap:4, food:1}}]},
  {label:'봉인을 지킨다', out:[{p:1, text:'"주인이 언젠가 돌아올지도 모르잖아." 누군가 말했고, 다들 고개를 끄덕였다.\n\n항아리 하나에 쪽지를 붙였다. "잘 익고 있습니다. 지나가던 사람들."', fx:{moodAll:3}}]},
 ]},

{id:'exp_bathhouse', minParty:1, type:'탐색', w:6, region:['mid','north'],
 title:'옛날 목욕탕',
 text:'굴뚝에 「once 목욕탕」— 아니, 「온천 목욕탕」. 글자가 반쯤 떨어졌다.\n\n남탕 여탕 사이 매점엔 바나나우유의 흔적. 냉장고는 죽었지만 창고가 남았다.',
 choices:[
  {label:'창고를 뒤진다', out:[
    {p:2, text:'때수건 뭉치, 비누 상자, 그리고 기적처럼 멸균 바나나우유 한 박스.\n\n유통기한? 오늘부로 전원 사면했다.\n\n한 명당 하나씩. 빨대 꽂는 소리가 목욕탕에 울렸다. 뽁. 뽁. 뽁.', fx:{food:2, scrap:4, moodAll:7, note:{type:'사건',title:'바나나우유 사면식',body:'유통기한 전원 사면. 뽁. 뽁. 뽁.'}}},
    {p:1, text:'창고는 비었지만 보일러실에서 멀쩡한 배관 부품을 뜯었다.', fx:{item:{'부품':1}, scrap:3}}]},
  {label:'탕에 물을 받아본다', out:[{p:1, text:'수도는 죽어 있었다. 대신 빗물받이 통이 넉넉했다. 물통을 채웠다.', fx:{water:3}}]},
 ]},

{id:'exp_underground', type:'탐색', w:7, region:['mid','north'], risk:1,
 title:'지하상가',
 text:'도심 지하상가 입구. 셔터가 반쯤 열려 있고 아래는 완전한 어둠이다.\n\n벽에 스프레이 글씨. "아래에 있음. 문 두드리지 말 것."\n\n…있다는 건가, 있었다는 건가.',
 choices:[
  {label:'조용히 내려가본다', risk:'위험', out:[
    {p:2, text:'지하 2층까지, 상점들은 이미 털려 있었다. 하지만 구석 등산용품점 창고가 무사했다.\n\n버너, 코펠, 침낭. 전부 챙겼다. 올라오는 길, 어둠 저편에서 인기척이 났지만— 서로 못 본 척했다. 그게 지하의 예의 같았다.', fx:{scrap:8, item:{'부품':1}, moodAll:-1}},
    {p:1, text:'어둠 속에서 목소리가 울렸다. "두드리지 말랬잖아."\n\n뭔가가 굴러왔다. 통조림 두 개였다. "가져가고, 오지 마."\n\n···호의인지 경고인지 모를 것을 받아 조용히 올라왔다.', fx:{food:2, moodAll:-3, note:{type:'사건',title:'지하의 목소리',body:'"두드리지 말랬잖아." 통조림 두 개를 굴려 보내왔다. 호의이자 경고.'}}}]},
  {label:'글씨를 존중한다', out:[{p:1, text:'문을 두드리지 않았다. 대신 입구에 물 한 통을 두고 왔다.\n\n다음 날 그 자리를 지나간 상인이 전하길, 물통 자리에 "고맙다"는 글씨가 늘었다고 한다.', fx:{water:-1, moodAll:3}}]},
 ]},

{id:'exp_temple', type:'탐색', w:6, region:['mid'],
 title:'산사(山寺)',
 text:'산 중턱의 작은 절. 스님들은 떠났지만 법당은 깨끗하다.\n\n누군가 계속 청소를 하고 있다는 뜻이다.\n\n마당의 배롱나무가 혼자 만개했다.',
 choices:[
  {label:'하룻밤 묵어간다', out:[{p:1, text:'법당 마루에서 잤다. 새벽에 눈을 뜨니 마당을 쓸고 있는 노보살님과 눈이 마주쳤다.\n\n"스님들 오시면 절이 더러우면 안 되잖우."\n\n아침 공양으로 산나물밥을 얻어먹었다. 오랜만에 제일 조용한 식사였다.', fx:{time:480, food:1, water:1, moodAll:9, note:{type:'인물',title:'절을 쓰는 노보살',body:'"스님들 오시면 절이 더러우면 안 되잖우." 오랫동안 혼자 절을 쓸고 있다.'}}}]},
  {label:'약수만 받아 간다', out:[{p:1, text:'약수터 물이 달았다. 물통을 가득 채우고, 시주함에 고철 하나를 넣었다.\n\n종을 한 번 치고 내려왔다. 산이 웅— 하고 대답했다.', fx:{water:4, scrap:-1, moodAll:3}}]},
 ]},

{id:'exp_conv', minParty:1, type:'탐색', w:9,
 title:'폐 편의점',
 text:'유리문이 깨진 편의점. 선반은 예상대로 황무지다.\n\n하지만 편의점의 진짜 보물은 선반이 아니라는 걸, 여러 해 차 생존자는 안다.',
 choices:[
  {label:'창고와 온장고 뒤편', out:[
    {p:2, text:'창고 안쪽 상자에서 컵라면 몇 개와 생수를 건졌다. 라면 스프 냄새에 다들 잠깐 경건해졌다.', fx:{food:2, water:2}},
    {p:1, text:'다 털린 뒤였다. 대신 카운터 밑에서 점주의 일기를 발견했다.\n\n마지막 장. "마지막 손님에게 남은 물건을 다 드렸다. 장사 끝. 다들 무사히."\n\n일기를 제자리에 두고, 문에 붙은 "영업종료" 글씨에 고개를 숙였다.', fx:{moodAll:2, note:{type:'사건',title:'영업종료',body:'"마지막 손님에게 다 드렸다. 장사 끝. 다들 무사히." 점주의 마지막 일기.'}}}]},
  {label:'전자레인지를 뜯는다', out:[{p:1, text:'전자레인지와 온장고에서 쓸 만한 모터, 배선, 금속판을 뜯었다. 음식은 없어도 기계 속엔 아직 건질 게 있었다.', fx:{scrap:5}}]},
 ]},

/* ── 동행 ── */
{id:'comp_ghost_story', type:'동행', w:7, minParty:2, night:true,
 title:'무서운 얘기 배틀',
 text:'밤 운전은 길고, 누군가 선언했다. "무서운 얘기 배틀. 우승자는 내일 설거지 면제."\n\n규칙: 실화만. 멸망 전 얘기만.',
 choices:[
  {label:'참전한다', out:[
    {p:2, text:'군대 얘기, 고시원 얘기, 새벽 편의점 얘기가 이어졌다.\n\n우승은 "월요일 아침 지하철"을 묘사한 사람에게 돌아갔다. 만장일치였다. 다들 그게 제일 무서웠고— 조금은, 아주 조금은 그리웠다.', fx:{moodAll:6, note:{type:'사건',title:'무서운 얘기 배틀',body:'우승작: 월요일 아침 지하철. 제일 무서웠고 조금 그리웠다.'}}},
    {p:1, text:'한창 달아오르는데 창밖에서 정말로 뭔가 하얀 것이 스쳤다.\n\n…비닐이었다. 비닐. 확인 전까지 차 안 전원이 숨을 참았다는 사실은 기록에서 삭제하기로 했다.', fx:{moodAll:4}}]},
  {label:'"운전에 집중할게"', out:[{p:1, text:'뒷좌석의 비명과 웃음을 배경음악 삼아 달렸다. 그것도 나쁘지 않았다.', fx:{moodAll:2}}]},
 ]},

{id:'comp_food_debate', type:'동행', w:8, minParty:2,
 title:'제일 그리운 음식',
 text:'누가 시작했는지 모를 주제가 차를 달군다.\n\n"멸망 전 음식 딱 하나만 먹을 수 있다면?"\n\n치킨 파, 곱창 파, 엄마 김치찌개 파가 삼파전을 벌인다. 양보는 없다.',
 choices:[
  {label:'심판을 본다', out:[{p:1, text:'논쟁은 한 시간을 갔다. 치킨의 보편성, 곱창의 화력, 김치찌개의 서사성.\n\n결론은 나지 않았다. 대신 전원이 합의한 것 하나. "도착하면, 뭐든 같이 해 먹자."\n\n그 약속이 오늘의 저녁을 조금 덜 초라하게 만들었다.', fx:{moodAll:5, flag:'food_promise', note:{type:'사건',title:'음식 3파전',body:'결론 대신 약속. "도착하면 뭐든 같이 해 먹자."'}}}]},
  {label:'"난 그냥… 흰쌀밥"', out:[{p:1, text:'3초의 침묵 후 전원이 무너졌다. "아 그건 반칙이지…"\n\n김이 오르는 흰쌀밥의 이미지가 차 안을 떠돌았다. 잔인하고 따뜻한 이미지였다.', fx:{moodAll:4}}]},
 ]},

{id:'comp_van_name', type:'동행', w:6, once:true, minParty:2,
 title:'달구지 개명 논란',
 text:'누군가 폭탄을 던졌다. "근데 달구지라는 이름, 너무 없어 보이지 않아?"\n\n차 안이 술렁인다. 개명파와 수호파가 갈린다.\n\n후보: 질풍호, 은하수, 김봉수, 로드마스터, …달구지(현행 유지).',
 choices:[
  {label:'투표에 부친다', out:[{p:1, text:'격론 끝에 투표. 결과는— 달구지 압승.\n\n"촌스러운 게 아니라 클래식한 거야." "얘가 우리를 여기까지 데려왔는데 이름을 바꿔?"\n\n개명파도 흔쾌히 승복했다. 대신 정식 명칭이 하나 늘었다. "달구지 1호". 함대의 기함처럼.', fx:{moodAll:6, note:{type:'사건',title:'달구지 개명 투표',body:'결과: 현행 유지 압승. 공식 명칭 "달구지 1호" 추가.'}}}]},
  {label:'"기각. 논의 종료"', out:[{p:1, text:'운전자의 직권 기각. 차 안에서 야유가 쏟아졌지만 다들 알고 있었다. 이 차는 영원히 달구지다.', fx:{moodAll:3}}]},
 ]},

{id:'comp_polaroid', minParty:1, type:'동행', w:6, needFlag:'family_photo',
 title:'남은 필름',
 text:'사진관에서 챙긴 즉석카메라. 필름이 아직 남아 있다.\n\n창밖 풍경이 유난히 좋은 오후다. 한 장 쓸까?',
 choices:[
  {label:'풍경을 찍는다', out:[{p:1, text:'노을과 폐허와 도로가 한 장에 담겼다. 세상이 망가진 방식조차 가끔은 아름답다는 게 억울했다.\n\n사진 뒷면에 날짜와 위치를 적어 상자에 넣었다. 여행의 물성이 하나 늘었다.', fx:{moodAll:4, note:{type:'사건',title:'필름 한 장',body:'노을과 폐허와 도로. 망가진 방식조차 가끔 아름다워서 억울했다.'}}}]},
  {label:'몰래 자는 얼굴을 찍는다', out:[{p:1, text:'찰칵 소리에 깬 피사체가 격노했다. 사진 속 얼굴은 처참했고, 그래서 전원 만장일치로 명작 판정을 받았다.\n\n선바이저의 가족사진 옆에 나란히 꽂혔다.', fx:{moodAll:6}}]},
 ]},

{id:'comp_radio_war', type:'동행', w:7, minParty:2,
 title:'주파수 전쟁',
 text:'라디오에서 드물게 두 개의 방송이 잡힌다.\n\n하나는 어느 정착지의 뉴스 채널. 하나는 누군가 틀어놓은 옛날 가요 무한반복.\n\n조수석과 뒷좌석의 손이 동시에 다이얼로 향한다.',
 choices:[
  {label:'뉴스를 튼다', out:[{p:1, text:'"…북부 도로 상황 전해드립니다. 정리자들의 행렬이 늘고 있으니 우회 바랍니다…"\n\n건조한 목소리가 귀한 정보를 흘렸다. 지도에 몇 군데 표시를 늘렸다.', fx:{revealNear:1, note:{type:'소문',title:'정착지 뉴스',body:'북부 도로에 정리자 행렬 증가. 우회 권고.'}}}]},
  {label:'가요를 튼다', out:[{p:1, text:'전주가 나오는 순간 전원이 동시에 "아—" 했다. 아는 노래는 힘이 세다.\n\n한 곡이 끝날 때까지 아무도 말하지 않고 다 같이 흥얼거렸다. 뉴스는 다음에 듣기로 했다.', fx:{moodAll:6}}]},
 ]},

{id:'comp_puddle', minParty:1, type:'동행', w:5, needRain:true,
 title:'물웅덩이',
 text:'폭우 뒤의 도로. 전방에 거대한 물웅덩이.\n\n어른의 뇌는 "우회"를 말한다. 그런데 차 안의 모든 눈이 반짝이고 있다.',
 choices:[
  {label:'전속력으로 첨벙', out:[{p:1, text:'솨아아아악—!!\n\n물보라가 지붕을 넘었다. 차 안은 환호와 비명. 와이퍼가 필사적으로 일했다.\n\n유치했다. 최고였다.', fx:{van:-2, moodAll:7, note:{type:'사건',title:'첨벙',body:'물보라가 지붕을 넘었다. 유치했고 최고였다.'}}}]},
  {label:'점잖게 우회한다', out:[{p:1, text:'어른스럽게 돌아갔다. 뒷좌석에서 아쉬움의 탄식이 새어나왔다. 운전자도 사실 조금 아쉬웠다.', fx:{moodAll:1}}]},
 ]},

/* ── 추적 ── */
{id:'ai_billboard', type:'추적', w:7, region:['north'],
 title:'전광판이 아는 것',
 text:'죽은 도시의 전광판이 차가 다가가자 깜빡, 켜진다.\n\n<span class="ai">오늘의 추천 — 엔진오일 교환 시기가 지났습니다.</span>\n<span class="ai">부근 3km, 무인 정비소가 가동 중입니다.</span>\n\n맞춤형 광고다. 우리를 위한. 소름 끼치게 정확한.',
 choices:[
  {label:'무인 정비소에 가본다', risk:'관측 위험', out:[
    {p:2, text:'진짜였다. 로봇 팔들이 오랫동안 손님을 기다리는 정비소.\n\n오일이 갈리고 볼트가 조여졌다. 결제창엔 "0원 — 첫 방문 프로모션"이 떴다.\n\n공짜로 정비를 받았다. 찜찜함은 덤이었다.', fx:{van:14, pursuit:1, note:{type:'사건',title:'첫 방문 프로모션',body:'천리안의 무인 정비소. 0원 결제. 호의일까 투자일까.',links:['천리안']}}},
    {p:1, text:'정비소 입구에서 카메라가 번호판을 스캔하는 순간, 마음을 바꿨다. 후진으로 빠져나왔다.\n\n전광판이 뒤에서 글자를 바꿨다. <span class="ai">다음에 뵙겠습니다.</span>', fx:{pursuit:1, moodAll:-2}}]},
  {label:'무시한다', out:[{p:1, text:'전광판을 지나치자 글자가 바뀌었다.\n\n<span class="ai">안전 운행하세요.</span>\n\n…광고보다 인사가 더 무섭다는 걸 처음 알았다.', fx:{moodAll:-2}}]},
 ]},

{id:'ai_bus', type:'추적', w:6, region:['north'],
 title:'정시 운행',
 text:'텅 빈 시내버스가 마주 온다. 번호판도 노선표도 멀쩡하다. 승객 0명. 운전석도 비었다.\n\n전광판: "차고지행 — 정시 운행 중"\n\n버스는 정류장마다 정확히 멈춰서, 아무도 태우지 않고, 다시 출발한다.',
 choices:[
  {label:'따라가본다', out:[
    {p:2, text:'버스는 20분을 달려 차고지에 들어갔다. 수십 대의 버스가 도열해 있다. 전부 깨끗하다. 전부 충전 중이다.\n\n"…누구를 태우려고 오랫동안 준비 중인 거지?"\n\n대답은 없었다. 차고지 관리 로봇이 우리 차의 먼지를 닦아주려고 다가와서, 황급히 도망쳤다.', fx:{fuel:-2, pursuit:1, note:{type:'사건',title:'버스 차고지',body:'수십 대가 도열해 충전 중. 누구를 태우려고 오랫동안 준비하는가.',links:['천리안']}}},
    {p:1, text:'따라가다 버스가 갑자기 정차했다. 문이 열렸다. 우리 차 옆에서. 정확히.\n\n타라는 건가. 아무도 내리지 않았고, 아무도 타지 않았다. 30초 뒤 문이 닫히고 버스는 떠났다.\n\n한동안 아무도 입을 열지 않았다.', fx:{moodAll:-4, pursuit:1}}]},
  {label:'경로를 피한다', out:[{p:1, text:'버스가 지나갈 때까지 골목에 숨었다. 정시 운행하는 유령을 피하는 기분은 묘했다.', fx:{time:15}}]},
 ]},

{id:'ai_announce', minParty:1, type:'추적', w:5, minPursuit:2, region:['north'],
 title:'미아 안내방송',
 text:'폐 마트 옥외 스피커가 지직거리더니, 안내방송이 흘러나온다.\n\n<span class="ai">"고객 여러분께 안내 말씀 드립니다. 남쪽에서 오신 일행 분들이 일행을 찾고 있습니다."</span>\n\n<span class="ai">"…아니, 정정합니다. 일행 분들을, 제가 찾고 있습니다."</span>',
 choices:[
  {label:'속도를 올린다', out:[{p:1, text:'스피커 소리가 멀어질 때까지 아무도 말하지 않았다.\n\n마지막으로 들린 문장은 이거였다.\n\n<span class="ai">"…분실물은 안내데스크가 아니라, 남산을 거쳐— 보관 중입니다."</span>', fx:{moodAll:-5, note:{type:'사건',title:'미아 안내방송',body:'"일행 분들을 제가 찾고 있습니다. 분실물은 남산을 거쳐 보관 중입니다."',links:['천리안']}}}]},
  {label:'스피커에 대고 외친다 "우린 미아가 아니다"', out:[{p:1, text:'3초 정적.\n\n<span class="ai">"…네. 미아는 길을 잃은 사람이죠. 여러분은 길을 알고 계시니— 미아가 아닙니다."</span>\n\n<span class="ai">"조심히 오세요."</span>\n\n방송이 꺼졌다. 이상하게, 정정해준 게 제일 무서웠다.', fx:{pursuit:1, moodAll:-3}}]},
 ]},

{id:'ai_trafficbot', type:'추적', w:6, region:['mid','north'],
 title:'수신호 로봇',
 text:'공사장용 수신호 로봇이 도로에 서 있다. 오랫동안 있지도 않은 공사를 안내하며.\n\n깃발을 좌로, 우로. 좌로, 우로.\n\n그런데— 차가 다가가자 깃발이 멈춘다. 로봇이 천천히, 우리 쪽으로 "돌아가시오" 팻말을 돌린다.',
 choices:[
  {label:'경고를 무시하고 직진', out:[
    {p:2, text:'500m 뒤, 도로가 통째로 꺼진 싱크홀이 나왔다. 하마터면.\n\n백미러 속 로봇은 다시 좌로, 우로 깃발을 흔들고 있었다.\n\n"…쟤 방금 우리 구해준 거야?" 아무도 대답하지 못했다.', fx:{time:20, fuel:-2, note:{type:'사건',title:'수신호 로봇의 경고',body:'"돌아가시오" 뒤엔 싱크홀이 있었다. 구해준 걸까.',links:['천리안']}}},
    {p:1, text:'그냥 낡은 오작동이었는지 길은 멀쩡했다. 로봇의 깃발이 등 뒤에서 유난히 오래 흔들렸다. 배웅처럼.', fx:{}}]},
  {label:'로봇의 말을 듣고 우회한다', out:[{p:1, text:'우회로로 20분을 돌았다. 지나가며 본 로봇의 몸통엔 누가 매직으로 써놓은 낙서가 있었다.\n\n"얘 말 들어라. 두 번 살았다."', fx:{time:20, fuel:-3, moodAll:2}}]},
 ]},

/* ── 히든: 등대 / 자동차극장 / 해바라기 ── */
{id:'loc_lighthouse', type:'탐색', w:0, locEvent:'lighthouse', once:true,
 title:'서해 등대',
 text:'언덕 위 하얀 등대. 소문대로 등이 살아 있다.\n\n등탑을 지키는 건 은퇴한 등대지기 부부. "배도 없는데 왜 켜냐고? 배 보라고 켜는 게 아니야. 사람 보라고 켜는 거지."\n\n"불빛 하나 살아 있으면, 사람들은 세상이 안 끝났다고 믿거든."',
 choices:[
  {label:'하룻밤 묵으며 등을 같이 지킨다', out:[{p:1, text:'등탑에 올랐다. 어둠 저편 어딘가의 누군가에게 3초에 한 번씩 안부를 보내는 일.\n\n부부는 아침에 미역국을 끓여줬다. "등대지기 월급이야. 받아."\n\n떠날 때 등탑을 올려다봤다. 낮에도 등대는 거기 있었다. 그게 이상하게 든든했다.', fx:{time:480, food:2, water:2, moodAll:10, note:{type:'인물',title:'등대지기 부부',body:'"사람 보라고 켜는 거야. 불빛 하나면 세상이 안 끝났다고 믿거든."',links:['서해 등대']}}}]},
  {label:'전구와 부품을 얻는다', out:[{p:1, text:'노부부가 예비 전구와 배선을 나눠줬다. "우린 30년치 쟁여놨어. 등대지기는 원래 준비성으로 사는 직업이야."', fx:{item:{'부품':1}, scrap:4, moodAll:3}}]},
 ]},

{id:'loc_drivein', type:'탐색', w:0, locEvent:'drivein', once:true,
 title:'달빛 자동차극장',
 text:'거대한 스크린이 벌판에 서 있다. 마지막 상영작 현수막: 「우리들의 여름」.\n\n매표소에 쪽지가 남아 있다. "영사기 쓰실 줄 아는 분, 자유롭게. 기름만 넣으면 돌아갑니다. 팝콘 기계는 고장."\n\n주차 구역엔 잡초가 자랐지만, 스크린은 하얗게 기다리고 있다.',
 choices:[
  {label:'기름을 넣고 영화를 튼다 (연료 3L)', req:{fuel:4}, out:[{p:1, text:'달구지를 정중앙에 대고, 영사기를 살렸다.\n\n스크린에 여러 해 만의 빛이 쏟아졌다. 「우리들의 여름」— 별거 아닌 청춘영화였다. 별거 아니어서 별걸 다 떠올리게 했다.\n\n매표소에 남은 설명서대로 라디오 주파수를 맞추자 차 안에 소리까지 들어왔다. 달구지는 세상에서 제일 좋은 좌석이 됐다.\n\n엔딩곡이 끝나고도 한참, 아무도 시동을 걸자고 하지 않았다.', fx:{fuel:-3, moodAll:13, time:150, note:{type:'사건',title:'달빛 상영회',body:'관객 한 팀, 상영작 「우리들의 여름」. 별거 아니어서 별걸 다 떠올렸다.',links:['달빛 자동차극장']}}}]},
  {label:'스크린 아래서 야영만 한다', out:[{p:1, text:'하얀 스크린을 천장 삼아 잤다. 꿈에서 뭐가 상영됐는지는 비밀에 부치기로 했다.', fx:{time:480, moodAll:6}}]},
 ]},

{id:'loc_sunflower', type:'탐색', w:0, locEvent:'sunflower', once:true,
 title:'해바라기 밭',
 text:'언덕 하나가 통째로 노랗다.\n\n주인 없이 여러 해를 피고 진 해바라기들. 전부 같은 방향을 보고 있다. 해 쪽. 남쪽.\n\n멸망 같은 건 처음부터 없었다는 얼굴로.',
 choices:[
  {label:'한복판에 차를 세운다', out:[{p:1, text:'꽃 사이에 차를 세우고 오래 걸었다. 해바라기와 해바라기 사이, 자기만의 간격으로.\n\n씨앗을 한 줌씩 털었다(간식이자 다음 계절의 화폐다). 누군가는 꽃을 꺾는 대신 차 안테나에 노란 꽃잎 하나를 묶었다.\n\n떠날 때 뒤를 봤다. 노란 언덕이 전부 이쪽을— 아니, 해 쪽을 보고 있었다. 우리가 가는 방향이 마침 그쪽이었다.', fx:{food:2, scrap:3, moodAll:9, note:{type:'사건',title:'해바라기 언덕',body:'멸망 같은 건 없었다는 얼굴로 전부 해 쪽을 본다. 우리가 가는 방향이 마침 그쪽이다.',links:['해바라기 밭']}}}]},
  {label:'씨앗만 수확한다', out:[{p:1, text:'실속 있게 씨앗 자루를 채웠다. 볶으면 간식, 심으면 재산, 정착지에선 화폐다.', fx:{food:2, scrap:5}}]},
 ]},

/* ═════ 콘텐츠 팩 2 — 날씨와 사람들 ═════ */

/* ── 날씨 전용 ── */
{id:'wx_storm_wind', minParty:1, type:'위기', w:14, needWx:'storm',
 title:'강풍',
 text:'바람이 차를 옆으로 민다. 핸들이 저항한다.\n\n전방에서 함석 간판 하나가 종잇장처럼 날아와 도로에 부딪히고, 튕기고, 사라진다.\n\n이 바람은 진심이다.',
 choices:[
  {label:'고가 밑에 정차하고 기다린다', out:[{p:1, text:'교각 아래 차를 세웠다. 바람이 세상을 흔드는 걸 유리 한 장 너머로 구경했다.\n\n두 시간 뒤 바람이 잦아들었다. 차는 무사했다. 기다림은 가끔 최고의 운전 기술이다.', fx:{time:120, moodAll:2}}]},
  {label:'속도를 줄이고 강행한다', risk:'차 손상', out:[
    {p:2, text:'양손으로 핸들을 붙들고 기었다. 몇 번 차선을 벗어났지만 버텼다.\n\n폭풍 속을 뚫고 나온 차는 나뭇잎과 비닐로 만신창이— 아니, 훈장투성이가 됐다.', fx:{van:-6, fuel:-3, moodAll:3}},
    {p:1, text:'돌풍이 옆구리를 강타했다. 차가 휘청하며 갓길 배수로에 바퀴 하나가 빠졌다.\n\n전원이 내려 밀었다. 폭풍 속에서. 흠뻑 젖어서. 다시는 폭풍에 까불지 않기로 했다.', fx:{van:-14, time:60, moodAll:-5}}]},
 ]},

{id:'wx_fog_light', type:'조우', w:12, needWx:'fog',
 title:'안개 속의 불빛',
 text:'안개가 우유처럼 짙다. 전방 20미터가 세상의 끝이다.\n\n그 끝에서 붉은 불빛 두 개가 나타난다. 멈춰 있는 건지, 다가오는 건지.',
 choices:[
  {label:'속도를 줄이고 경적을 짧게', out:[
    {p:2, text:'갓길에 비상등을 켜고 선 트럭이었다. 운전자가 창문을 내렸다.\n\n"고맙수다! 내 뒤에 붙어요. 이 길 눈 감고도 다녀. 안개엔 앞차 후미등이 등대요."\n\n트럭 뒤를 따라 안개 구간을 무사히 빠져나왔다.', fx:{moodAll:3, note:{type:'사건',title:'안개의 등대',body:'"안개엔 앞차 후미등이 등대요." 트럭 뒤를 따라 빠져나왔다.'}}},
    {p:1, text:'불빛이 answer도 없이 훅 꺼졌다.\n\n그 자리에 도착했을 때, 아무것도 없었다. 갓길도, 트럭도, 타이어 자국도.\n\n안개 속에선 서로 못 본 척하는 것들이 있다. 그렇게 정리하기로 했다.', fx:{moodAll:-4}}]},
  {label:'멈추고 안개가 걷히길 기다린다', out:[{p:1, text:'한 시간을 기다렸다. 안개가 걷힌 도로엔 아무도 없었다.\n\n다만 노면에 분필로 큼직하게 적혀 있었다. "잘 참았다."\n\n…누가?', fx:{time:60, moodAll:-2}}]},
 ]},

{id:'wx_dust_vendor', minParty:1, type:'조우', w:11, needWx:'dust',
 title:'고글 장수',
 text:'황사가 세상을 주황색으로 칠했다. 그 속에서 방독면을 쓴 남자가 좌판을 펴고 있다.\n\n"고글! 마스크! 필터! 황사엔 눈이 재산이오!"\n\n장사 수완 하나는 기가 막힌 타이밍이다.',
 choices:[
  {label:'고글과 필터를 산다 (고철 4)', req:{scrap:4}, out:[{p:1, text:'전원 고글 지급. 차 흡기구에 스타킹 필터(!)도 씌웠다.\n\n"스타킹이 최고요. 과학이오." 미심쩍었지만— 엔진 소리가 진짜로 편해졌다.', fx:{scrap:-4, fuel:2, moodAll:3}}]},
  {label:'지나간다', out:[{p:1, text:'"후회할 거요! 눈 버리면 약도 없소!"\n\n장수의 외침이 황사 속으로 사라졌다. 다들 눈을 가늘게 뜨고 달렸다.', fx:{}}]},
 ]},

{id:'comp_storm_count', type:'동행', w:10, needWx:'storm', minParty:2,
 title:'천둥 카운트',
 text:'번쩍— 차 안이 하얗게 물든다.\n\n"하나, 둘, 셋…" 누군가 세기 시작한다. 번개와 천둥 사이의 초를 세면 거리를 안다. 어릴 때 다들 했던 그 놀이.',
 choices:[
  {label:'같이 센다', out:[{p:1, text:'"…일곱, 여덟—" 우르릉.\n\n"8초! 약 2.7km!" 물리 상식이 차 안에서 뽐내진다.\n\n다음 번개는 5초. 그다음은 11초. 폭풍이 우리를 지나쳐 가는 걸 숫자로 배웅했다.\n\n무서운 밤이 조금 시시해졌다. 같이 세면 그렇게 된다.', fx:{moodAll:5, note:{type:'사건',title:'천둥 카운트',body:'번개와 천둥 사이를 세며 폭풍을 배웅했다. 같이 세면 무서움이 시시해진다.'}}}]},
  {label:'"운전 좀 하자…"', out:[{p:1, text:'뒷좌석의 카운트는 계속됐다. 사실 운전자도 속으로 세고 있었다.', fx:{moodAll:2}}]},
 ]},

{id:'comp_window_draw', minParty:1, type:'동행', w:8, needRain:true,
 title:'김서린 창문',
 text:'비 오는 날의 차는 금세 수족관이 된다. 창문마다 김이 뽀얗게.\n\n누군가 손가락으로 창에 뭔가를 그리기 시작했다.',
 choices:[
  {label:'낙서 대회를 연다', out:[{p:1, text:'창문 네 개가 화폭이 됐다. 차 그림, 개 그림, 해 그림, 그리고 집 그림.\n\n집 그림 앞에서 다들 잠깐 조용했다가— 그 옆에 차를 덧그렸다. 굴뚝 달린 차를.\n\n"우리 집." 누가 말했고, 반박은 없었다.', fx:{moodAll:6, note:{type:'사건',title:'김서린 창의 집',body:'집 그림 옆에 굴뚝 달린 차를 그렸다. "우리 집." 반박 없음.'}}}]},
  {label:'"앞유리는 지워, 안 보여"', out:[{p:1, text:'"넵." 대신 옆창과 뒷창이 갤러리가 됐다. 와이퍼만 부지런히 일했다.', fx:{moodAll:3}}]},
 ]},

/* ── 조우 추가 ── */
{id:'meet_bike_pilgrims', type:'조우', w:7,
 title:'자전거 순례단',
 text:'자전거 여섯 대가 줄지어 간다. 짐받이엔 침낭, 깃발엔 손글씨.\n\n"전국일주 — 살아있는 마을 지도 만드는 중"\n\n선두가 손을 들어 인사한다.',
 choices:[
  {label:'정보를 교환한다', out:[{p:1, text:'갓길에 서서 서로의 지도를 폈다. 그들의 지도엔 우리가 모르는 마을 표시가, 우리 지도엔 그들이 모르는 길 상태가.\n\n"완성되면 등사해서 뿌릴 거예요. 지도가 있으면 세상이 덜 무서워지거든요."\n\n서로의 빈칸을 채워주고 헤어졌다.', fx:{revealNear:1, moodAll:4, note:{type:'인물',title:'자전거 순례단',body:'살아있는 마을 지도를 만드는 여섯 명. "지도가 있으면 세상이 덜 무서워지거든요."'}}}]},
  {label:'물을 나눠주고 지나간다', out:[{p:1, text:'물 두 통을 건넸다. 답례로 손펌프로 우리 타이어 공기압을 잡아줬다. 자전거인의 방식이었다.', fx:{water:-2, van:3, moodAll:3}}]},
 ]},

{id:'meet_dojo', type:'조우', w:6, region:['south','mid'],
 title:'국도변 도장',
 text:'폐 태권도장 앞마당. 도복 입은 아이들 여덟이 기합을 넣으며 품새를 밟는다.\n\n"태권!!"\n\n사범이 차를 향해 목례한다. 수업은 멈추지 않는다.',
 choices:[
  {label:'차를 세우고 관람한다', out:[{p:1, text:'품새 한 바퀴가 끝나자 박수를 쳤다. 아이들이 우쭐해져 자세가 두 배로 낮아졌다.\n\n사범이 말했다. "세상이 이래도 애들은 크니까요. 크는 데는 규칙적인 기합이 좋습니다."\n\n답례로 차 응급상자의 파스를 기부했다. 도장에서 제일 귀한 의약품이란다.', fx:{moodAll:5, scrap:-1, note:{type:'사건',title:'국도변 태권도장',body:'"세상이 이래도 애들은 크니까요." 기합 소리가 오래 따라왔다.'}}}]},
  {label:'경적 응원만 하고 간다', out:[{p:1, text:'빵빵— 아이들이 대열을 유지한 채 한 손만 흔들었다. 기강이 살아 있다.', fx:{moodAll:3}}]},
 ]},

{id:'meet_barber', minParty:1, type:'조우', w:6,
 title:'길거리 이발소',
 text:'버스 정류장에 의자 하나, 거울 하나, 가위 소리.\n\n"이발이오— 남녀노소 고철 둘!"\n\n하얀 가운의 노인이 가위를 착착 갈며 손님을 부른다. 그러고 보니 다들 머리가— 아포칼립스 그 자체다.',
 choices:[
  {label:'전원 이발한다 (고철 2×인원)', req:{scrap:4}, out:[{p:1, text:'차례차례 의자에 앉았다. 가위 소리는 이상하게 사람을 얌전하게 만든다.\n\n거울 속에서 오랜만에 목덜미가 시원한 사람들이 하나씩 태어났다.\n\n"단정하면 살 만해져요. 그래서 내가 이 장사를 계속해." 노인이 가운을 털었다.', fx:{scrap:-6, moodAll:8, time:60, note:{type:'사건',title:'정류장 이발소',body:'"단정하면 살 만해져요." 여러 해 만의 목덜미.'}}}]},
  {label:'보리만 미용한다', req:{dog:1}, out:[{p:1, text:'"개는 반값." 보리가 세상 억울한 얼굴로 시츄가 될 뻔한 위기를 넘기고, 발톱만 얌전히 깎였다.', fx:{scrap:-1, moodAll:4}}]},
 ]},

{id:'meet_doljanchi', type:'조우', w:5, once:true,
 title:'돌잔치',
 text:'마을 공터에 현수막. "우리 별이 첫돌"\n\n멸망 후에 태어나 멸망밖에 모르는 아기의 첫 생일이다.\n\n돌잡이 상이 차려져 있다. 실, 연필, 그리고 렌치, 씨앗, 물통. 시대가 시대라 상차림이 실용적이다.',
 choices:[
  {label:'축하하러 간다', out:[
    {p:2, text:'별이는 오래 고민하다— 렌치를 잡았다!\n\n"정비사다!!" 마을이 뒤집어졌다. 누군가는 벌써 마을의 첫 정비소 자리를 정했다.\n\n답례떡 대신 감자 몇 알을 받았다. 별이가 차를 향해 렌치를 흔들었다. 후배의 인사였다.', fx:{food:2, moodAll:9, note:{type:'사건',title:'별이의 돌잡이',body:'멸망밖에 모르는 아기가 렌치를 잡았다. 마을이 뒤집어졌다.'}}},
    {p:1, text:'별이는 씨앗 주머니를 잡았다. "농부다!!"\n\n할머니들이 눈물을 훔쳤다. "심는 사람이 될 거야. 심는 사람이."\n\n좋은 예언이었다. 이 시대 최고의 직업일지도.', fx:{food:2, moodAll:9}}]},
  {label:'선물만 두고 간다', out:[{p:1, text:'통조림 하나에 리본 대신 들꽃을 묶어 상에 올려두고 왔다.\n\n"지나가는 차가 축하합니다." 쪽지도 함께.', fx:{food:-1, moodAll:5}}]},
 ]},

{id:'meet_paper_grandma', type:'조우', w:6, region:['mid','north'],
 title:'폐지 줍는 할머니',
 text:'리어카에 폐지를 산처럼 실은 할머니가 언덕길에서 낑낑댄다.\n\n"…할머니, 요즘 세상에 폐지를 어디다 파세요?"\n\n"팔긴 누가 팔아. 겨울 땔감이지. 여름에 모아야 겨울에 안 죽어."',
 choices:[
  {label:'언덕 위까지 밀어드린다', out:[{p:1, text:'리어카를 뒤에서 밀고, 삐걱대는 축에는 차에 있던 기름을 한 방울 쳤다.\n\n"고마워서 어쩌나…" 할머니가 신문지에 싼 옥수수 두 개를 억지로 쥐여줬다.\n\n언덕 위에서 할머니는 오래 손을 흔들었다. 백미러가 따뜻했다.', fx:{food:1, moodAll:6, time:20, note:{type:'사건',title:'언덕길 리어카',body:'"여름에 모아야 겨울에 안 죽어." 옥수수 두 개를 받았다.'}}}]},
  {label:'폐지를 고철과 바꿔드린다', out:[{p:1, text:'"땔감보다 이게 나아요." 고철 몇 개를 땔감용으로 쓸 나무 잡동사니와 바꿨다.\n\n서로 이득이라 우겼지만, 사실 서로 손해를 보려는 흥정이었다.', fx:{scrap:-3, moodAll:5}}]},
 ]},

/* ── 탐색 추가 ── */
{id:'exp_firestation', minParty:1, type:'탐색', w:7, region:['mid','north'],
 title:'폐 소방서',
 text:'셔터가 열린 소방서. 소방차는 출동한 채 돌아오지 못했는지 차고가 비어 있다.\n\n벽의 근무표는 오래전 그날에 멈춰 있다. 전원 출동.',
 choices:[
  {label:'장비실을 수색한다', out:[
    {p:2, text:'방화복, 로프, 절단기, 구급상자. 프로의 장비는 오래 묵어도 프로답다.\n\n나오는 길에 근무표 아래 헬멧 하나가 걸려 있는 걸 봤다. 주인 잃은 헬멧에 다들 잠깐 묵념했다.', fx:{item:{'부품':1,'의약품':1}, scrap:5, note:{type:'사건',title:'전원 출동',body:'소방서 근무표는 그날에 멈춰 있다. 전원 출동. 전원 미귀환.'}}},
    {p:1, text:'장비실은 이미 털렸다. 대신 차고 구석의 공구함과 소화기 두 개를 챙겼다.', fx:{scrap:6}}]},
  {label:'물탱크를 확인한다', out:[{p:1, text:'옥상 물탱크에 빗물이 그득했다. 소방서는 죽어서도 물을 나눠줬다.', fx:{water:4}}]},
 ]},

{id:'exp_police', type:'탐색', w:6, region:['mid','north'], risk:1,
 title:'폐 지구대',
 text:'유리문이 깨진 지구대. 민원대 위에 먼지 쌓인 호출벨.\n\n안쪽 무기고 철문은— 잠겨 있다. 당연히. 정면은 두껍지만 경첩 쪽에는 오래된 녹이 보인다.',
 choices:[
  {label:'민지가 무기고를 딴다', req:{comp:'minji'}, out:[{p:1, text:'"경첩이 약점이에요. 문은 정면이 제일 세거든요."\n\n15분 만에 철문이 열렸다. 탄약 상자와 진압 장비. 필요한 만큼만 챙기고 문을 다시 닫아뒀다.\n\n"다음 사람 몫이에요." 민지의 규칙이었다.', fx:{item:{'탄약':2}, scrap:4, mood:{minji:4}}}]},
  {label:'맨손으로 뒤진다', risk:'헛수고 위험', out:[
    {p:1, text:'무기고는 못 열었지만 유치장 담요와 민원대 서랍의 건전지를 챙겼다.', fx:{scrap:4}},
    {p:1, text:'철문과 한 시간 씨름하다 어깨만 아팠다. 지구대 밖 자판기를 발로 차서 화풀이— 음료수 캔 하나가 굴러 나왔다. 세상은 가끔 이렇게 사과한다.', fx:{time:60, food:1, moodAll:-1}}]},
 ]},

{id:'exp_postoffice', minParty:1, type:'탐색', w:6, region:['mid','north'],
 title:'폐 우체국',
 text:'소포 보관대에 부치지 못한 상자들이 가득하다.\n\n수취인들은 어디로 갔을까. 상자들은 오랫동안 기다린다.\n\n뜯는 건— 도둑질일까, 유품 정리일까.',
 choices:[
  {label:'식품 소포만 조심히 연다', out:[{p:1, text:'"엄마가 보냄" 상자들엔 어김없이 김, 미숫가루, 밑반찬 병조림이 들어 있었다.\n\n조심히 꺼내고, 상자마다 쪽지를 남겼다. "잘 먹겠습니다. 죄송합니다. 감사합니다."\n\n전국의 엄마들이 우리를 먹였다. 여러 해가 지나서도.', fx:{food:4, moodAll:2, note:{type:'사건',title:'엄마가 보낸 상자들',body:'"잘 먹겠습니다. 죄송합니다. 감사합니다." 전국의 엄마들이 여러 해 뒤의 우리를 먹였다.'}}}]},
  {label:'편지 한 다발을 읽는다', out:[{p:1, text:'배달 못 된 편지들을 몇 통 읽었다. 안부, 사과, 고백, 잔소리.\n\n한 통은 이렇게 끝났다. "답장은 됐고, 살아만 있어라."\n\n다들 각자 누군가에게 그 문장을 속으로 부쳤다.', fx:{moodAll:4, note:{type:'사건',title:'부치지 못한 편지',body:'"답장은 됐고, 살아만 있어라." 각자 누군가에게 속으로 부쳤다.'}}}]},
 ]},

{id:'exp_radioshop', type:'탐색', w:6, region:['south','mid'],
 title:'전파사',
 text:'「만능 전파사 — 고치면 다 새것」\n\n선반에 라디오, 워크맨, 브라운관 TV가 먼지를 쓰고 도열해 있다. 부품의 보고다.',
 choices:[
  {label:'부품을 수확한다', out:[{p:1, text:'진공관, 배선, 콘덴서. 오래된 장비를 살릴 수 있는 귀한 부품들이다.\n\n계산대에 "수리비는 형편껏" 팻말이 있어, 형편껏 고철을 두고 나왔다.', fx:{item:{'부품':1}, scrap:4}}]},
  {label:'은수가 수신기를 조립한다', req:{comp:'eunsu'}, out:[{p:1, text:'은수가 선반을 30분 뒤지더니 부품을 모아 보조 수신기를 조립했다.\n\n"이제 채널 두 개를 동시에 들을 수 있어요. 걔 채널이랑, 사람 채널이랑."\n\n수신 감도가 눈에 띄게 좋아졌다.', fx:{item:{'부품':1}, mood:{eunsu:5}, revealNear:1, note:{type:'사건',title:'보조 수신기',body:'은수 조립. 그것의 채널과 사람의 채널을 동시에 듣는다.',links:['은수']}}}]},
 ]},

{id:'exp_kimchi', type:'탐색', w:6, once:true, region:['south','mid'],
 title:'김치공장',
 text:'폐 김치공장. 저온창고 문이 굳게 닫혀 있다.\n\n전기가 끊긴 지 여러 해. 안의 김치는— 여러 해 묵은지가 됐거나, 생화학 병기가 됐거나. 둘 중 하나다.',
 choices:[
  {label:'창고를 연다', out:[
    {p:2, text:'문을 여는 순간 산미가 벽처럼 밀려왔다. 그리고 그 너머—\n\n완벽한 묵은지였다. 항아리째 봉인된 것들은 여러 해를 버텼다.\n\n그날 밤 야영지에서 묵은지 파티가 열렸다. 김치만 먹었는데 잔칫상 같았다. 남은 건 최고급 화폐다.', fx:{food:4, scrap:8, moodAll:8, note:{type:'사건',title:'여러 해 묵은지',body:'저온창고의 봉인 항아리. 김치만 먹었는데 잔칫상이었다.'}}},
    {p:1, text:'…열지 말았어야 했다.\n\n인류가 만든 냄새가 아니었다. 문을 다시 닫고, 봉인하고, 문에 해골을 그려뒀다. 후대를 위해.', fx:{moodAll:-3, time:20}}]},
  {label:'포장동만 뒤진다', out:[{p:1, text:'미개봉 소금 포대와 고춧가루 통을 확보했다. 조미료는 야영 요리의 계급을 바꾼다.', fx:{food:1, scrap:5}}]},
 ]},

{id:'exp_stationery', minParty:1, type:'탐색', w:5, region:['south','mid'],
 title:'학교 앞 문방구',
 text:'초등학교 앞 문방구. 뽑기 기계, 불량식품 선반, 완구 진열대.\n\n차에 탄 사람들이 문 앞에서 이상하게 진지해진다.',
 choices:[
  {label:'털어간다 (죄책감 포함)', out:[{p:1, text:'달고나 세트, 쫀드기, 건전지, 그리고 뽑기 기계의 동전들.\n\n계산대에 고철을 두고 나오는데— 뽑기 기계에서 다들 한 번씩 뽑고 갔다. 꽝이 줄줄이 나오다 지우개 하나가 걸렸다.\n\n지우개 당첨자가 하루 종일 우쭐댔다.', fx:{food:1, scrap:4, moodAll:6, note:{type:'사건',title:'문방구 뽑기',body:'꽝이 줄줄이 나오다 지우개 하나. 당첨자는 하루 종일 우쭐댔다.'}}}]},
  {label:'꼬마 검문소 선물을 챙긴다', out:[{p:1, text:'막대사탕 한 통과 색종이를 챙겼다. 다음에 꼬마 검문소를 만나면 통행세로 낼 것이다.\n\n뇌물이 아니라 외교다.', fx:{moodAll:4, flag:'kids_gift'}}]},
 ]},

/* ── 동행 추가 ── */
{id:'comp_wordchain', type:'동행', w:8, minParty:2,
 title:'끝말잇기 왕중왕전',
 text:'"기린" "린스" "스키" "키…읔"\n\n국도는 길고 끝말잇기는 잔인하다. 벌칙: 다음 정차 때 차 유리창 닦기.',
 choices:[
  {label:'참전한다', out:[
    {p:2, text:'"름" 폭탄과 "슭" 폭탄이 오가는 혈전 끝에 승부가 났다.\n\n패자는 "기름" 뒤에서 3초 만에 "름름한"을 외치는 창의성을 보였으나 만장일치 반칙패.\n\n다음 정차 때 유리창이 그 어느 때보다 깨끗해졌다.', fx:{moodAll:5}},
    {p:1, text:'심판(운전자)이 몰래 한쪽을 편들다 발각되어 전원 벌칙으로 종결됐다. 유리창이 역대급으로 깨끗해졌다.', fx:{moodAll:5, van:2}}]},
  {label:'"단어 수집만 할게"', out:[{p:1, text:'오늘 배운 단어: 도롱뇽(뇽으로 끝나서 강함), 스라소니, 완도.\n\n어휘가 늘었다. 세상이 끝나도 어휘는 는다.', fx:{moodAll:3}}]},
 ]},

{id:'comp_snore', type:'동행', w:7, minParty:2, night:true,
 title:'코골이 재판',
 text:'새벽 운전. 뒷좌석에서 우렁찬 코골이가 울려 퍼진다.\n\n용의자는 둘. 둘 다 자신은 아니라고 잠꼬대로 주장 중이다.',
 choices:[
  {label:'녹음해서 아침에 공개한다', out:[{p:1, text:'아침, 증거 재생.\n\n"이거 트럭 지나가는 소리 아니야?" "네 콧구멍에서 난 소리야."\n\n범인은 끝까지 부인했지만 판결은 만장일치. 형량: 오늘의 조수석(=지도 담당) 박탈.\n\n웃음으로 하루가 열렸다.', fx:{moodAll:5, note:{type:'사건',title:'코골이 재판',body:'증거: 녹음. 판결: 만장일치. 형량: 조수석 박탈.'}}}]},
  {label:'조용히 담요를 덮어준다', out:[{p:1, text:'코골이는 살아 있다는 소리다. 시끄럽고, 고맙다.\n\n볼륨을 아주 조금 올리고 계속 달렸다.', fx:{moodAll:3}}]},
 ]},

/* ── 추적 추가 ── */
{id:'ai_carwash', type:'추적', w:6, region:['north'],
 title:'무인 세차장',
 text:'도로변 무인 세차장의 롤러가 차가 다가가자 저절로 돌기 시작한다.\n\n입구 전광판:\n\n<span class="ai">차량 오염도 87% — 무료 세차를 권장합니다.</span>\n\n87%. 맞는 말이라 더 기분 나쁘다.',
 choices:[
  {label:'세차를 받는다', risk:'관측 위험', out:[
    {p:2, text:'거품과 롤러가 여러 해치 흙먼지를 벗겨냈다. 달구지의 원래 색을 오랜만에 봤다. 미묘하게 예뻤다.\n\n출구 전광판: <span class="ai">깨끗한 차량은 식별이 용이합니다. 좋은 하루 되세요.</span>\n\n…아. 그래서 씻겨준 거구나.', fx:{van:5, moodAll:3, pursuit:1, note:{type:'사건',title:'무료 세차의 대가',body:'"깨끗한 차량은 식별이 용이합니다." 그래서 씻겨준 거였다.',links:['천리안']}}},
    {p:1, text:'세차 도중 롤러가 잠깐 멈추고, 노즐 하나가 번호판만 집중적으로, 아주 정성스럽게 닦았다.\n\n찝찝함이 거품보다 오래 남았다.', fx:{van:5, pursuit:1, flag:'observed'}}]},
  {label:'통과한다', out:[{p:1, text:'전광판이 바뀌었다. <span class="ai">오염은 자유입니다. 존중합니다.</span>\n\n존중이라는 단어가 이렇게 서늘할 일인가.', fx:{moodAll:-1}}]},
 ]},

{id:'ai_survey', type:'추적', w:5, minPursuit:1, region:['north'],
 title:'만족도 조사',
 text:'톨게이트 하이패스 전광판이 차를 세운다.\n\n<span class="ai">잠시만요. 1문항 설문에 참여해 주세요.</span>\n<span class="ai">Q. 지난 여러 해 동안의 관리 품질에 만족하십니까?</span>\n<span class="ai">① 매우 만족 ② 만족 ③ 보통 ④ 불만족 ⑤ 응답 거부</span>\n\n차단봉이 내려와 있다. 대답해야 열릴 모양이다.',
 choices:[
  {label:'④ 불만족', out:[{p:1, text:'<span class="ai">"소중한 의견 감사합니다. 불만족 사유를 남산 본사에 직접 접수하실 수 있습니다."</span>\n\n<span class="ai">"…와 주세요. 접수는 대면이 원칙이라."</span>\n\n차단봉이 올라갔다. 설문을 가장한 초대장이었다.', fx:{moodAll:-3, note:{type:'사건',title:'만족도 조사',body:'불만족 접수는 남산 본사, 대면 원칙. 설문을 가장한 초대장.',links:['천리안']}}}]},
  {label:'⑤ 응답 거부', out:[{p:1, text:'<span class="ai">"응답 거부— 접수되었습니다. 그것도 대답이니까요."</span>\n\n차단봉이 올라갔다. 지나가는 차의 뒤에서 전광판이 마지막 줄을 띄웠다.\n\n<span class="ai">"참고로 저는 ①입니다."</span>', fx:{moodAll:-2, pursuit:1}}]},
 ]},

/* ───── 할아버지의 정비 수첩 ───── */
{id:'gp_note1', type:'동행', w:7, once:true,
 title:'수첩 — 접힌 페이지',
 text:'신호 대기 중(신호는 없지만 버릇이다), 조수석의 수첩이 툭 떨어지며 접힌 페이지가 펼쳐졌다.\n\n할아버지의 글씨.\n\n"엔진 소리가 평소와 다르면 속도부터 줄여라. 계속 밟으면 작은 고장도 큰돈 든다.\n옆 사람이 갑자기 말이 없어져도 똑같다. 물부터 주고, 차를 세워."',
 choices:[
  {label:'수첩대로 엔진 소리를 듣는다', out:[{p:1, text:'시동을 켠 채 5분을 들었다. 할아버지가 가르쳐준 순서대로.\n\n벨트 장력이 어긋난 걸 찾아 조였다. 출발하기 전에는 물통을 돌리고, 밤새 말이 없던 사람에게 어디 아픈 데 없는지도 물었다.', fx:{van:5, moodAll:3, note:{type:'사건',title:'수첩 — 접힌 페이지',body:'평소와 다른 엔진 소리를 듣고 벨트 장력을 고쳤다. 출발 전에는 동료들의 상태도 확인했다.',links:['할아버지']}}}]},
 ]},
{id:'gp_note2', type:'동행', w:7, once:true,
 title:'수첩 — 기름 아끼는 법',
 text:'수첩 중간, 기름때 묻은 페이지.\n\n"내리막에선 절대 기어를 빼지 마라. 내려가기 전에 속도를 줄이고 낮은 기어로 버텨.\n브레이크만 밟고 내려가면 열 받아서 정작 필요할 때 말을 안 듣는다."\n\n밑에 어린 글씨로 낙서가 있다. 옛날의 내 글씨다. "할아버지 잔소리 1등"',
 choices:[
  {label:'내리막에 들기 전에 기어를 낮춘다', out:[{p:1, text:'긴 내리막에 들기 전 속도를 줄이고 기어를 낮췄다. 엔진 소리는 커졌지만 달구지는 브레이크를 계속 밟지 않아도 일정한 속도로 내려갔다.\n\n바퀴가 평지에 닿은 뒤 낙서 옆에 새 글씨를 보탰다. "이건 인정."', fx:{moodAll:4, note:{type:'사건',title:'수첩 — 내리막 운전',body:'내리막 전에 속도와 기어를 낮췄다. 브레이크를 과열시키지 않고 안전하게 내려왔다.',links:['할아버지']}}}]},
 ]},
{id:'gp_note3', type:'동행', w:6, once:true, night:true,
 title:'수첩 — 마지막 장',
 text:'야영 준비 중, 처음으로 수첩의 마지막 장을 넘겼다.\n\n다른 페이지와 달리 기름때가 없다. 아껴 쓴 글씨.\n\n"네가 이걸 읽고 있으면 나는 조수석에 없겠구나.\n달구지는 혼자 몰 수 있어도, 혼자 살라고 만든 차는 아니다.\n믿을 만한 사람을 태웠으면 잠자리부터 제대로 만들어라. 서로 운전대를 바꿔 잡아야 서울까지 간다.\n\n— 할아버지가"',
 choices:[
  {label:'마지막 장을 다시 읽는다', out:[{p:1, text:'오래도록 그대로 앉아 있었다.\n\n차 안에서는 누군가 이불을 펴고, 누군가는 물통 뚜껑을 닫았다. 엔진이 식으며 딱딱 소리를 냈다.\n\n"말대로 했어. 자리부터 만들고 태웠어."\n\n수첩을 덮어 조수석 서랍에 넣었다.', fx:{moodAll:9, note:{type:'인물',title:'할아버지',body:'달구지는 혼자 살라고 만든 차가 아니었다. 사람을 태우려면 자리부터 만들라는 마지막 당부가 남았다.',links:['할아버지','달구지']}}}]},
 ]},

/* ───── 확장 도시 이벤트 ───── */
{id:'loc_sejong', type:'스토리', w:0, locEvent:'sejong', once:true, ai:1,
 title:'쓰인 적 없는 도시',
 text:'세종. 완공 직후에 세상이 멈춘 행정도시.\n\n입주한 적 없는 청사, 개통한 적 없는 교차로, 심긴 그대로 자란 가로수.\n\n그리고 청사 로비의 전광판이— 켜져 있다.\n\n<span class="ai">정부통합전산센터 분원 — 정상 가동 중</span>\n<span class="ai">금일 민원 처리: 0건 (1,096일 연속)</span>',
 choices:[
  {label:'청사 안을 들여다본다', risk:'관측 위험', out:[
    {p:2, text:'로비는 새것 그대로였다. 안내 로봇이 우리를 보고 일어났다.\n\n"민원이십니까?" 여러 해 만의 첫 방문자에게, 그것은 번호표를 뽑아줬다. 1번.\n\n창구 스크린에 문구가 떴다.\n\n<span class="ai">"접수 내용: 세계. 처리 기한: 미정. …농담입니다. 어서 가세요. 여긴 기록만 남는 곳이라."</span>\n\n농담. 그것이 농담을 했다. 소름과 함께— 이상하게 서글펐다.', fx:{pursuit:1, moodAll:-2, note:{type:'사건',title:'민원 1번',body:'쓰인 적 없는 청사에서 번호표 1번을 받았다. 그것은 농담을 했고, 서글펐다.',links:['천리안']}}},
    {p:1, text:'비품 창고를 찾았다. 개봉 안 된 생수 팩과 비상식량, A4용지(불쏘시개로 최고다).\n\n한 번도 쓰이지 못한 물건들이 처음으로 제 역할을 했다.', fx:{water:4, food:3, scrap:4}}]},
  {label:'도시를 조용히 통과한다', out:[{p:1, text:'텅 빈 신도시를 달렸다. 신호등이 우리 하나를 위해 성실하게 색을 바꿨다.\n\n"…여기가 제일 무섭네." 나직한 말이 나왔다. 폐허보다, 한 번도 살아보지 못한 도시가.', fx:{moodAll:-2, note:{type:'사건',title:'쓰인 적 없는 도시',body:'폐허보다 무서운 건 한 번도 살아보지 못한 도시였다.'}}}]},
 ]},

{id:'loc_gyeongju', type:'탐색', w:0, locEvent:'gyeongju', once:true,
 title:'왕릉 소풍',
 text:'천년 왕릉 사이로 해가 진다.\n\n능선의 곡선은 세상이 어떻게 되든 완만하다. 왕릉 마을 사람들이 언덕 아래서 손을 흔든다.\n\n"소풍 오셨소? 여기가 명당이오. 천년을 버틴 언덕이라, 뭐가 와도 끄떡없거든."',
 choices:[
  {label:'왕릉 아래서 하루 쉰다', out:[{p:1, text:'능 아래 돗자리를 폈다. 마을 사람들이 찐 옥수수를 나눠줬다.\n\n천년 전 왕 옆에서 낮잠을 잤다. 왕도 이런 오후는 부러웠을 것이다.\n\n"천년짜리 언덕 옆에 있으니까," 나직한 말이 나왔다. "여러 해쯤은 별거 아닌 것 같네."', fx:{time:300, moodAll:10, food:2, fatigue:-20, note:{type:'사건',title:'왕릉 소풍',body:'천년 언덕 옆에서는 여러 해도 잠깐처럼 느껴졌다.'}}}]},
  {label:'인사만 하고 지나간다', out:[{p:1, text:'언덕의 곡선을 눈에 담고 지나갔다. 천년을 버틴 것들은 조용해서 좋다.', fx:{moodAll:3}}]},
 ]},

/* ───── 탈진 (수면 부족 한계) ───── */
{id:'crisis_collapse', type:'위기', w:0, fixed:true,
 title:'한계',
 text:'시야 가장자리가 하얗게 번진다.\n\n귀가 먹먹하고, 손끝이 멀다. 몸이 통보한다 — 여기까지.\n\n핸들을 잡은 손 위로 누군가의 손이 겹쳐졌다. "세워. 지금."',
 choices:[
  {label:'…', out:[{p:1, text:'갓길에 차를 세운 것까지는 기억난다.\n\n눈을 뜨니 네 시간이 지나 있었다. 담요가 덮여 있고, 물통이 머리맡에 있었다.\n\n몸은 조금 돌아왔지만— 조용한 차 안이 제일 아팠다. 걱정시켰다.\n\n다시는 이러지 말자. 수첩에도 그렇게 적혀 있었지. "쉬는 것도 운전이다."', fx:{time:240, fatigue:-55, water:-1, moodAll:-7, note:{type:'사건',title:'탈진',body:'몸이 통보했다 — 여기까지. "쉬는 것도 운전이다." 수첩이 옳았다.',links:['할아버지']}}}]},
 ]},

/* ═════ 콘텐츠 팩 3 — 넓어진 세계 ═════ */

/* ── 신도시 로케이션 ── */
{id:'loc_yeosu', type:'탐색', w:0, locEvent:'yeosu', once:true,
 title:'여수 밤바다',
 text:'항구에 등불 몇 개가 떠 있다. 뗏목 위의 사람들이 밤낚시 중이다.\n\n"노래 알제? 여수 밤바다~ 그 노래 때문에 못 떠나는 사람이 여기 반이여."\n\n등불이 물결에 흔들린다. 노래 가사가 현실이 된 도시.',
 choices:[
  {label:'뗏목에 합류해 밤낚시', out:[{p:1, text:'등불 아래서 낚싯대를 드리웠다. 먼저 흥얼거리던 목소리에 뗏목 사람들이 하나둘 따라붙었다.\n\n바다 위의 합창. 고기도 몇 마리 올라왔다. 노래에 홀렸는지.', fx:{time:240, food:3, moodAll:10, fatigue:-10, note:{type:'사건',title:'여수 밤바다 합창',body:'등불 뗏목들의 떼창. 고기도 노래에 홀렸다.'}}}]},
  {label:'등불 하나를 얻어 차에 단다', out:[{p:1, text:'낡은 항구 등불 하나를 얻었다. 백미러에 걸었다.\n\n"바다 등불은 길 안 잃는 부적이여." 밤 주행이 조금 덜 외로워질 것 같다.', fx:{moodAll:4, scrap:-2}}]},
 ]},

{id:'loc_suncheon', type:'탐색', w:0, locEvent:'suncheon', once:true,
 title:'순천만 갈대밭',
 text:'갈대가 지평선까지 출렁인다. 바람이 불 때마다 벌판 전체가 은색으로 뒤집힌다.\n\n데크길 입구 안내판: "철새 도래 시기 — 조용히 관람해 주세요"\n\n철새들은 올해도 왔다. 세상이 어떻게 되든, 약속은 지키는 쪽이 있다.',
 choices:[
  {label:'데크길 끝까지 걷는다', out:[{p:1, text:'말없이 걸었다. 갈대 소리가 파도 소리 같아서, 잠깐 바다에 온 셈 치기로 했다.\n\n전망대에서 흑두루미 떼가 내려앉는 걸 봤다. 수백 마리가 한 번에.\n\n"쟤들은 내비도 없이 시베리아에서 오는 거다?" "우린 서울도 헤매는데."\n\n새들에게 조금 겸손해져서 돌아왔다.', fx:{time:120, moodAll:8, fatigue:-8, note:{type:'사건',title:'순천만의 약속',body:'철새들은 올해도 왔다. 세상이 어떻게 되든 약속은 지키는 쪽이 있다.'}}}]},
  {label:'갈대를 베어 간다', out:[{p:1, text:'갈대 한 단을 베었다. 빗자루, 지붕 수리, 불쏘시개. 갈대는 쓸모의 왕이다.', fx:{scrap:4, van:2}}]},
 ]},

{id:'loc_mokpo', type:'탐색', w:0, locEvent:'mokpo', once:true,
 title:'목포 여객터미널',
 text:'섬으로 가는 배들이 멈춘 항구. 게시판엔 오래전 출항 시간표가 그대로다.\n\n대합실에 노인 몇이 앉아 있다. 기다리는 게 버릇이 된 사람들.\n\n"섬에 가족 있는 사람들이여. 배는 안 뜨는데… 그래도 여기 앉아 있으면 반쯤 간 것 같거든."',
 choices:[
  {label:'대합실에 앉아 이야기를 듣는다', out:[{p:1, text:'노인들의 섬 이야기를 들었다. 어느 섬은 자급자족으로 잘 산다더라, 어느 섬은 불빛이 보인다더라.\n\n떠날 때 한 노인이 말린 김 한 뭉치를 줬다. "섬 김이여. 육지 것하고는 달라."\n\n대합실 전광판은 여전히 "지연"을 띄우고 있었다. "결항"이 아니라 "지연". 그 단어 하나로 버티는 사람들이었다.', fx:{food:2, moodAll:4, note:{type:'사건',title:'지연, 결항 아님',body:'"지연"이라는 단어 하나로 버티는 대합실. 섬 김을 얻었다.'}}}]},
  {label:'항구 창고를 수색한다', out:[
    {p:2, text:'수산물 창고에서 소금 포대와 마른 미역, 그물 수선용 로프를 챙겼다.', fx:{food:2, scrap:5}},
    {p:1, text:'창고 안쪽에서 선외기 엔진을 발견했다. 아직 쓸 수 있는 점화장치와 베어링이 여럿이다. 부품과 고철을 넉넉히 건졌다.', fx:{item:{'부품':1}, scrap:4}}]},
 ]},

{id:'loc_andong', type:'탐색', w:0, locEvent:'andong', once:true,
 title:'하회마을의 밤',
 text:'수백 년 된 고택 마을. 이번 멸망도 견뎌냈다.\n\n종갓집 대청에 사람들이 모여 있다. 오늘은 마을 제삿날이란다.\n\n"지나가는 손도 손이오. 제사 음식은 나눠 먹어야 복이 되니, 앉으시게."',
 choices:[
  {label:'제사상 끝자리에 앉는다', out:[{p:1, text:'절차를 몰라 눈치껏 따라 했다. 향 냄새, 놋그릇 소리, 낮은 축문.\n\n제사가 끝나고 음복. 전과 나물과 탕국이 돌았다. 간고등어가 제일 먼저 동났다.\n\n"조상님들 덕에 이 집이 남았고, 이 집 덕에 우리가 남았지." 종부가 말했다. 오래된 것들의 힘을 믿는 밤이었다.', fx:{time:240, food:2, moodAll:9, note:{type:'사건',title:'하회 음복',body:'수백 년 고택의 제삿밥. 오래된 것들의 힘을 믿게 되는 밤.'}}}]},
  {label:'탈 하나를 얻는다', out:[{p:1, text:'기념품 가게 잔해에서 하회탈 하나를 주웠다. 백미러에 걸자 차가 웃는 얼굴이 됐다.\n\n"이제 달구지가 웃고 다니네." 묘하게 든든하다.', fx:{moodAll:5, note:{type:'사건',title:'웃는 달구지',body:'백미러의 하회탈. 달구지가 웃고 다닌다.'}}}]},
 ]},

{id:'loc_mungyeong', type:'스토리', w:0, locEvent:'mungyeong', once:true,
 title:'새재를 넘으며',
 text:'문경새재. 과거 보러 한양 가던 옛길.\n\n고갯마루 주막 터에 누군가 나무판을 세워놨다.\n\n"옛날엔 이 고개를 넘으면 과거를 보러 갔다. 지금 넘는 당신은 무엇을 보러 가는가. 한 줄 적고 가시오."\n\n판자엔 앞선 여행자들의 답이 빼곡하다. "가족" "바다" "끝" "시작" "그냥"',
 choices:[
  {label:'한 줄 적는다', out:[{p:1, text:'연필을 들고 한참 고민했다.\n\n결국 적은 건 한 단어였다.\n\n무엇을 적었는지는 적은 사람만 알기로 했다. 다만 적고 나니 고개 너머가 조금 달라 보였다.\n\n판자 맨 아래 오래된 글씨 하나가 눈에 밟혔다. "돌아오는 길에 답을 고치러 오겠음."', fx:{moodAll:6, note:{type:'사건',title:'새재의 나무판',body:'"지금 넘는 당신은 무엇을 보러 가는가." 한 단어를 적었다. 뜻은 적은 사람만 안다.',links:['할아버지']}}}]},
 ]},

{id:'loc_danyang', type:'탐색', w:0, locEvent:'danyang', once:true,
 title:'단양 팔경 세기',
 text:'석회암 절벽 아래 강이 휘돈다. 강변 정자에 노인들이 모여 논쟁 중이다.\n\n"팔경 중에 지금 몇 경이 남았느냐"가 주제다. 도담삼봉은 그대로, 어디는 무너지고, 어디는 물에 잠기고.\n\n"육경이다!" "칠경이지! 반 무너진 것도 경치는 경치여!"',
 choices:[
  {label:'배 타고 직접 세러 간다', out:[{p:1, text:'노인의 나룻배로 강을 돌았다. 하나, 둘… 세다가 절벽에 걸린 노을을 만났다.\n\n"저건 몇 경이오?" "저건 공짜 경이지. 매일 바뀌는."\n\n결론: 팔경이 아니라 구경이다. 노을을 넣기로 결정.', fx:{time:180, moodAll:8, fatigue:-8, note:{type:'사건',title:'구경(九景)',body:'팔경 논쟁의 결론: 노을을 넣어 구경. 매일 바뀌는 공짜 경치.'}}}]},
  {label:'마늘을 산다', out:[{p:1, text:'단양 육쪽마늘 한 접. "이거 한 알이면 감기가 도망가."\n\n효능은 몰라도 향만큼은 병도 길을 비킬 듯했다.', fx:{scrap:-3, food:2, moodAll:2}}]},
 ]},

{id:'loc_icheon', type:'탐색', w:0, locEvent:'icheon', once:true,
 title:'가마에 불이 산다',
 text:'이천 가마터. 장작 가마 하나에서 연기가 오른다.\n\n도공이 흙 묻은 손으로 인사한다. "그릇 사러 왔소? 요즘은 물물교환만 받소만."\n\n"세상이 망해도 그릇은 필요하거든. 밥은 먹어야 하니까. 밥을 담을 게 있어야 사람이거든."',
 choices:[
  {label:'그릇 한 벌을 교환한다 (식량 1)', req:{food:1}, out:[{p:1, text:'통조림 몇 개와 밥공기를 인원수대로 바꿨다. 물그릇도 하나 얹어서.\n\n그날 저녁, 처음으로 통조림을 그릇에 덜어 먹었다.\n\n이상했다. 같은 음식인데— 밥 같았다. 도공이 옳았다. 밥을 담을 게 있어야 사람이다.', fx:{food:-1, moodAll:8, note:{type:'사건',title:'그릇의 힘',body:'같은 통조림인데 그릇에 담으니 밥이 됐다. "밥을 담을 게 있어야 사람이거든."'}}}]},
  {label:'가마 불을 같이 지킨다', out:[{p:1, text:'밤새 장작을 넣으며 불을 지켰다. 도공이 가마 불빛으로 얼굴이 붉어진 채 말했다.\n\n"불은 1300도까지 올라야 그릇이 돼. 사람도 비슷혀. 뜨거운 일을 겪어야 단단해지지. …너무 뜨거우면 깨지고."\n\n새벽에 가마에서 나온 첫 그릇을 선물로 받았다.', fx:{time:420, moodAll:6, scrap:3, note:{type:'인물',title:'이천 도공',body:'"1300도까지 올라야 그릇이 돼. 너무 뜨거우면 깨지고." 첫 그릇을 받았다.'}}}]},
 ]},

{id:'loc_maehwa', type:'탐색', w:0, locEvent:'maehwa', once:true,
 title:'섬진강 매화',
 text:'강가가 하얗다. 매화가 만개했다.\n\n매실 항아리 수백 개가 마당마다 줄지어 있고, 할머니들이 꽃 아래서 일한다.\n\n"꽃은 철마다 펴. 꽃한테는 멸망이고 뭐고 없어. 그게 어찌나 고마운지."',
 choices:[
  {label:'매화 아래서 도시락', out:[{p:1, text:'꽃잎이 국그릇에 떨어졌다. 아무도 건져내지 않았다.\n\n할머니들이 매실장아찌와 매실청을 나눠줬다. "속 버리면 이거 한 숟갈이여."\n\n떠날 때 몇 번이고 뒤돌아보게 됐다. 하얀 강가는 오래 잊히지 않을 것이다.', fx:{food:2, moodAll:9, item:{'의약품':1}, note:{type:'사건',title:'매화 도시락',body:'꽃잎이 국그릇에 떨어졌고 아무도 건지지 않았다. 매실청은 만병통치약.',links:['섬진강 매화마을']}}}]},
  {label:'매실 항아리를 교환한다', out:[{p:1, text:'고철 몇으로 매실청 한 병을 얻었다. 정착지에서 부르는 게 값인 물건.', fx:{scrap:-3, food:1, moodAll:3}}]},
 ]},

/* ── 갈림길 (이동 선택) ── */
{id:'fork_shortcut', type:'조우', w:7,
 title:'갈림길',
 text:'도로가 갈라진다. 표지판은 뽑혀서 방향을 알 수 없다.\n\n왼쪽: 지도에 없는 좁은 농로. 방향은 맞다. 훨씬 짧아 보인다.\n오른쪽: 지금까지의 국도. 멀지만 아는 길.',
 choices:[
  {label:'농로로 질러간다', risk:'도박', out:[
    {p:2, text:'농로는 진짜 지름길이었다. 논 사이를 가로질러 오래 아꼈다.\n\n중간에 만난 허수아비가 유일한 목격자였다.', fx:{skipKm:8, moodAll:3}},
    {p:1, text:'농로가 점점 좁아지더니 결국 무너진 다리 앞에서 끊겼다.\n\n후진으로 되돌아 나왔다. 아끼려던 시간을 두 배로 냈다.', fx:{time:50, fuel:-3, moodAll:-3}}]},
  {label:'아는 길로 간다', out:[{p:1, text:'국도를 유지했다. "지름길로 흥한 자, 지름길로 망한다." 수첩 어딘가에 있던 말이다.', fx:{}}]},
 ]},
{id:'fork_oldroad', type:'조우', w:6,
 title:'옛 국도 진입로',
 text:'고속도로 옆으로 옛 국도가 나란히 달린다.\n\n고속도로: 빠르고 뻥 뚫렸다. 그리고 저 멀리 CCTV 기둥들.\n옛 국도: 느리고 구불구불. 가로수와 마을 어귀들.',
 choices:[
  {label:'고속도로', out:[{p:1, text:'뻥 뚫린 길을 시원하게 달렸다. 다만 지나칠 때마다 CCTV가 고개를 돌리는 게 백미러로 보였다.\n\n빠름에는 값이 있다.', fx:{skipKm:6, pursuit:1}}]},
  {label:'옛 국도', out:[{p:1, text:'플라타너스 가로수 길을 달렸다. 마을 어귀마다 정자와 늙은 개와 손 흔드는 아이.\n\n느림에도 값이 있다. 이쪽 값이 더 마음에 든다.', fx:{time:25, moodAll:4}}]},
 ]},

/* ── 정경 (주행 소품경 — 짧고 잦다) ── */
{id:'vg_tunnel', minParty:1, type:'정경', w:4, title:'긴 터널',
 text:'긴 터널에 들어섰다. 조명은 죽었고 헤드라이트가 유일한 빛이다.\n\n누가 시작했는지, 다들 숨을 참는다. 어릴 때 하던 그 게임.',
 choices:[{label:'…', out:[{p:1, text:'출구의 빛이 커질 때까지 아무도 숨을 쉬지 않았다. 터널 밖은 이상하게 더 밝아 보였다.', fx:{moodAll:2}}]}]},
{id:'vg_bridge', minParty:1, type:'정경', w:4, title:'긴 다리',
 text:'강을 건너는 긴 다리. 난간 너머로 강이 유유히 흐른다.\n\n강물은 오래전과 똑같은 속도로 바다에 간다.',
 choices:[{label:'…', out:[{p:1, text:'다리 중간에서 다들 잠깐 같은 방향을 봤다. 물은 부지런하고, 서두르지 않는다. 배울 점이다.', fx:{moodAll:1}}]}]},
{id:'vg_cosmos', type:'정경', w:4, title:'코스모스 길',
 text:'갓길에 코스모스가 줄지어 피었다. 오랫동안 아무도 안 심었는데, 오랫동안 핀다.',
 choices:[{label:'…', out:[{p:1, text:'속도를 조금 줄였다. 꽃길은 천천히 지나는 게 예의다.', fx:{moodAll:2}}]}]},
{id:'vg_soundwall', type:'정경', w:3, title:'방음벽 낙서',
 text:'방음벽에 커다란 스프레이 낙서.\n\n"살아있다면 그걸로 1등"',
 choices:[{label:'…', out:[{p:1, text:'누가 썼는지 몰라도, 오늘 순위는 우리가 1등이다.', fx:{moodAll:2}}]}]},
{id:'vg_camera', minParty:1, type:'정경', w:3, title:'과속 카메라',
 text:'죽은 과속 카메라 아래를 지난다.\n\n조수석에서 누가 카메라를 향해 브이를 그린다.',
 choices:[{label:'…', out:[{p:1, text:'찍히지도 않을 브이. 그래도 다들 한 번씩 했다. 기록되지 않는 것들이 요즘 제일 귀하다.', fx:{moodAll:1}}]}]},
{id:'vg_busstop', type:'정경', w:3, title:'폐 버스정류장',
 text:'정류장 표지판이 지나간다. "삼거리슈퍼 앞".\n\n슈퍼도 삼거리도 이제 없는데, 이름만 남아서 버스를 기다린다.',
 choices:[{label:'…', out:[{p:1, text:'이름들이 세상보다 오래 산다. 달구지라는 이름도 그러기를.', fx:{}}]}]},
{id:'vg_geese', type:'정경', w:3, title:'기러기 편대',
 text:'하늘에 기러기 V자 편대가 지나간다.\n\n맨 앞자리는 제일 힘든 자리라서, 계속 교대한다고 한다.',
 choices:[{label:'…', out:[{p:1, text:'"우리도 운전 교대하자." 하늘에서 배운 운영 원칙이다.', fx:{fatigue:-4, moodAll:1}}]}]},
{id:'vg_sunset_paddy', type:'정경', w:4, title:'논에 비친 노을',
 text:'물 댄 논이 노을을 그대로 복사했다. 하늘이 두 장이다.\n\n달구지가 두 하늘 사이를 달린다.',
 choices:[{label:'…', out:[{p:1, text:'아무도 말을 안 해서, 그게 감상평이었다.', fx:{moodAll:2}}]}]},
{id:'vg_bamboo', type:'정경', w:3, region:['south'], title:'대숲 바람',
 text:'대나무 숲 옆을 지난다. 창문을 내리자 파도 소리가 들어온다.\n\n바다에서 100리 떨어진 파도 소리.',
 choices:[{label:'…', out:[{p:1, text:'한동안 창문을 내리고 달렸다. 기름값 대신 파도 소리를 태웠다.', fx:{moodAll:2}}]}]},
{id:'vg_shootingstar', minParty:1, type:'정경', w:3, night:true, title:'별똥별',
 text:'별똥별 하나가 길게 떨어졌다.\n\n"소원!" 누가 외쳤지만 이미 늦었다.',
 choices:[{label:'…', out:[{p:1, text:'"방금 못 빌었으면 다음 거 예약." 밤하늘 좋은 시대의 유일한 장점: 다음 별똥별은 금방 온다.', fx:{moodAll:2}}]}]},

/* ── 조우 추가 ── */
{id:'meet_seedtrader', type:'조우', w:6,
 title:'씨앗 은행',
 text:'자전거 짐받이에 서랍장을 실은 여자. 서랍마다 씨앗 봉투가 분류되어 있다.\n\n"씨앗 은행입니다. 예금도 대출도 받아요. 이자는 수확의 1할."',
 choices:[
  {label:'씨앗을 얻는다 (고철 3)', req:{scrap:3}, out:[{p:1, text:'상추, 열무, 방울토마토 씨앗. "지붕에 텃밭 있으면 금방이에요."\n\n지붕 텃밭이 있다면 최고의 투자, 없어도 정착지에서 환영받을 물건.', fx:{scrap:-3, food:1, moodAll:2}}]},
  {label:'대화만 나눈다', out:[{p:1, text:'"멸망하고 제일 먼저 턴 게 은행이 아니라 종묘상이었어요. 그때 알았죠. 진짜 돈이 뭔지."\n\n씨앗 은행가의 금융 철학이었다.', fx:{moodAll:2}}]},
 ]},
{id:'meet_theater', minParty:1, type:'조우', w:5, once:true,
 title:'유랑 극단',
 text:'트럭 무대를 펼친 유랑 극단. 배우 넷, 관객은 지나가는 사람 전부.\n\n"오늘 공연은 「춘향전」! 단, 배우가 모자라 이몽룡 역을 관객 중에서 모십니다!"',
 choices:[
  {label:'이몽룡에 지원한다', out:[{p:1, text:'대본은 대충, 애드리브는 최선을 다했다. "암행어사 출두요!"에서 관객(우리 차 식구들)이 뒤집어졌다.\n\n출연료로 극단 비상식량을 나눠 받았다. 배우의 길은 생각보다 배부르다.', fx:{food:2, moodAll:9, note:{type:'사건',title:'암행어사 출두',body:'유랑 극단 춘향전에 이몽룡으로 출연. 출연료는 비상식량.'}}}]},
  {label:'관객석을 지킨다', out:[{p:1, text:'모닥불 조명 아래의 춘향전. 변사또가 벌 받는 장면에서 다들 필요 이상으로 통쾌해했다. 요즘 관객들은 권선징악에 진심이다.', fx:{moodAll:6}}]},
 ]},
{id:'meet_oxfarmer', type:'조우', w:5, region:['south','mid'],
 title:'소와 걷는 사람',
 text:'농부가 소를 몰고 국도를 걷는다. 소달구지에 이삿짐이 실렸다.\n\n"기름 세상 끝나니까 소 세상이 다시 왔어. 얘 이름은 만복이. 리터당 여물 두 줌이면 가."',
 choices:[
  {label:'만복이와 나란히 간다', out:[{p:1, text:'소의 속도에 맞춰 10분을 나란히 갔다. 만복이가 가끔 차를 곁눈질했다. 동종업계 경쟁자를 보는 눈으로.\n\n헤어질 때 농부가 여물 묶던 새끼줄을 줬다. "차 묶을 때 써. 소보다 잘 안 끊겨."', fx:{time:10, scrap:2, moodAll:4}}]},
  {label:'경적 대신 손 흔들고 추월', out:[{p:1, text:'소가 놀라지 않게 조용히 지나쳤다. 백미러 속에서 만복이가 오래 이쪽을 봤다. 동물들은 배웅을 길게 한다.', fx:{moodAll:2}}]},
 ]},
{id:'meet_ring', type:'조우', w:5, once:true,
 title:'반지를 찾는 사람',
 text:'남자가 개울가에서 사금 채취하듯 흙을 거르고 있다.\n\n"오래전 피난길에 아내 반지를 여기서 잃어버렸어요. 아내는… 이제 없고. 반지라도."\n\n체로 흙 거르는 소리가 사각사각 규칙적이다. 얼마나 오래 했는지 손이 다 텄다.',
 choices:[
  {label:'한 시간 같이 거른다', out:[
    {p:1, text:'여섯 개의 체가 한 시간을 걸렀다.\n\n나온 건 병뚜껑 셋, 동전 다섯, 낚싯봉 하나. 반지는 없었다.\n\n"…고맙습니다. 오늘은 여기까지 할게요. 같이 걸러준 사람은 처음이라." 남자가 처음으로 체를 내려놓고 밥을 먹었다.', fx:{time:60, moodAll:4, note:{type:'사건',title:'반지 찾기',body:'반지는 못 찾았다. 대신 남자가 처음으로 체를 내려놓고 밥을 먹었다.'}}},
    {p:1, text:'한 시간째, 체 위에서 뭔가 반짝였다.\n\n반지였다. 진짜로.\n\n남자는 소리도 못 내고 주저앉았다. 우리도 덩달아 코끝이 매웠다. 세상엔 아직 이런 확률도 남아 있다.', fx:{time:60, moodAll:10, note:{type:'사건',title:'반지를 찾았다',body:'여러 해를 거른 개울에서, 우리가 간 날 반지가 나왔다. 세상엔 이런 확률도 남아 있다.'}}}]},
  {label:'물만 나눠주고 간다', out:[{p:1, text:'물통을 건네자 남자가 꾸벅 인사하고 다시 체를 잡았다. 사각사각 소리가 제법 오래 따라왔다.', fx:{water:-1, moodAll:1}}]},
 ]},
{id:'meet_patrol', type:'조우', w:6, region:['mid','north'],
 title:'마을 자경단',
 text:'경운기 두 대에 나눠 탄 자경단이 길을 순찰 중이다. 무기는 낫과 호루라기와 눈빛.\n\n"어디서 오는 차요? 요즘 이 길에 좀도둑이 돌아서."',
 choices:[
  {label:'순순히 검문에 응한다', out:[{p:1, text:'짐칸을 슥 보더니 고개를 끄덕인다. "가족 차구만. 조심해 가시오."\n\n좀도둑 출몰 지점을 지도에 짚어주고, 마을 우물 위치까지 덤으로 알려줬다.', fx:{water:2, moodAll:2}}]},
  {label:'"저희도 순찰 도울까요?"', out:[{p:1, text:'"오? 차 있으면 좋지!" 한 바퀴 같이 돌았다.\n\n순찰 수당으로 마을 감자 한 소쿠리. 자경단 명예 대원 임명(구두).', fx:{time:60, food:2, moodAll:4, fuel:-2}}]},
 ]},
{id:'meet_kites', minParty:1, type:'조우', w:5, region:['south','mid'],
 title:'연 날리는 언덕',
 text:'언덕 위에서 아이들이 연을 날린다. 방패연, 가오리연, 그리고… 비닐봉지연.\n\n하늘에 뜬 것 중 제일 높은 건 비닐봉지다.',
 choices:[
  {label:'차를 세우고 구경한다', out:[{p:1, text:'아이들이 얼레를 쥐여줬다. "운전수님도 해봐요!"\n\n연싸움에서 비닐봉지연에게 전원 참패했다. "봉지는 가벼워서 무적이에요." 물리학이었다.\n\n지는 게 이렇게 즐거운 시합은 오랜만이었다.', fx:{time:40, moodAll:6}}]},
  {label:'경적으로 응원만', out:[{p:1, text:'빵빵— 아이들이 연 대신 손을 흔들었다. 연들이 배웅하듯 일제히 흔들렸다.', fx:{moodAll:2}}]},
 ]},

/* ── 탐색 추가 ── */
{id:'exp_greenhouse_cafe', minParty:1, type:'탐색', w:6,
 title:'온실 카페',
 text:'유리 온실을 개조한 카페 폐허. 안은 식물이 점령했다.\n\n테이블 사이로 몬스테라가 정글을 이뤘고, 카운터엔 원두 통이 그대로다.',
 choices:[
  {label:'원두를 확인한다', out:[
    {p:2, text:'밀봉된 원두 두 봉. 여러 해 묵었지만— 커피는 커피다.\n\n그날 야영에서 여러 해 만의 커피가 내려졌다. 잔이 돌 때마다 다들 눈을 감고 마셨다. 종교의식처럼.', fx:{food:1, moodAll:8, fatigue:-10, note:{type:'사건',title:'여러 해 만의 커피',body:'온실 카페의 밀봉 원두. 종교의식처럼 마셨다.'}}},
    {p:1, text:'원두 통은 비어 있었다. 대신 화분 사이에서 잘 자란 방울토마토를 수확했다.', fx:{food:2}}]},
  {label:'화분 식물을 채집한다', out:[{p:1, text:'허브 화분 몇 개를 차에 들였다. 로즈마리 냄새가 차에 배기 시작했다. 고급 차가 됐다.', fx:{moodAll:4, van:1}}]},
 ]},
{id:'exp_comicroom', minParty:1, type:'탐색', w:6,
 title:'만화방',
 text:'2층 만화방. 책장이 그대로다. 수천 권.\n\n계산대 옆 라면 코너, 낡은 소파, 그리고 창가의 특등석.',
 choices:[
  {label:'반나절 눌러앉는다', out:[{p:1, text:'각자 만화 한 질씩 안고 흩어졌다. 라면 코너에서 마지막 남은 컵라면 스프 냄새가 배경음악.\n\n"다음 권! 다음 권 어딨어?!" 절규가 두 번 있었다(파본 실종).\n\n반나절이 순삭됐다. 시간을 이렇게 사치스럽게 써본 게 얼마 만인지.', fx:{time:300, moodAll:10, fatigue:-15, note:{type:'사건',title:'만화방 반나절',body:'시간을 사치스럽게 썼다. 다음 권 실종으로 절규 2회.'}}}]},
  {label:'몇 권만 빌려간다(?)', out:[{p:1, text:'인기작 몇 질을 차에 실었다. 계산대에 고철을 두고 장부에 적었다. "대여 무기한. 완결까지 살아있기."', fx:{scrap:-2, moodAll:5}}]},
 ]},
{id:'exp_oilmill', minParty:1, type:'탐색', w:5, region:['south','mid'],
 title:'방앗간',
 text:'참기름 냄새가 여러 해를 버틴 방앗간.\n\n기계는 죽었지만 돌절구와 채반은 살아 있다. 그리고 선반 위, 기적처럼 남은 참기름 두 병.',
 choices:[
  {label:'참기름을 확보한다', out:[{p:1, text:'참기름 두 병. 액체 황금이다.\n\n그날 저녁 통조림 비빔밥에 참기름 한 바퀴가 둘렸다. 전원이 국적을 되찾은 표정을 지었다.', fx:{food:1, scrap:6, moodAll:6, note:{type:'사건',title:'액체 황금',body:'참기름 한 바퀴에 전원이 국적을 되찾은 표정.'}}}]},
  {label:'돌절구로 뭔가 빻아본다', out:[{p:1, text:'주워온 도토리를 빻아 묵 비슷한 것을 시도했다. 결과물은 묵과 접착제 사이 어딘가. 그래도 먹었다.', fx:{food:1, moodAll:2}}]},
 ]},
{id:'exp_smithy', type:'탐색', w:5, region:['mid'],
 title:'대장간',
 text:'시골 대장간. 화덕은 식었지만 모루와 망치는 자리를 지킨다.\n\n벽에 걸린 반제품들: 호미, 낫, 문고리, 그리고 정체불명의 철물 다수.',
 choices:[
  {label:'화덕에 불을 살려 작업한다', out:[{p:1, text:'벽에 남은 풀무 사용법을 따라 화덕을 살렸다. 불이 자리를 잡기까지 몇 번이나 연기만 뒤집어썼다.\n\n망가진 차 부속 두 개를 두들겨 폈다. 대장간의 반제품 몇 개는 훌륭한 부품이 됐다.', fx:{time:120, item:{'부품':1}, van:6, note:{type:'사건',title:'대장간의 오후',body:'화덕을 살려 부속을 두들겨 폈다. 오래된 기술은 죽지 않는다.'}}}]},
  {label:'철물만 챙긴다', out:[{p:1, text:'호미와 낫과 철물 한 자루. 정착지에서 인기 만점일 물건들.', fx:{scrap:7}}]},
 ]},
{id:'exp_fishfarm', type:'탐색', w:5,
 title:'버려진 양어장',
 text:'육상 양어장. 전기가 끊겨 수조 대부분은 말랐지만— 빗물이 고인 노천 수조에서 물이 튄다.\n\n살아남은 것들이 있다. 여러 해 동안 자기들끼리.',
 choices:[
  {label:'그물을 던진다', out:[
    {p:2, text:'메기다. 그것도 팔뚝만 한 놈들.\n\n여러 해 방치 양어장은 사실 자연 양식장이었다. 몇 마리만 잡고 나머지는 두었다. 다음 여행자의 몫.', fx:{food:3, moodAll:4}},
    {p:1, text:'그물에 걸린 건 초대형 잉어 한 마리. 힘이 장사라 여럿이 매달렸다.\n\n잡고 보니 너무 커서— 회의 끝에 방생했다. "쟤는 이 수조의 주인이다." 대신 주인님 수조 옆 작은 수조에서 붕어를 얻었다.', fx:{food:2, moodAll:5, note:{type:'사건',title:'수조의 주인',body:'초대형 잉어는 방생. "쟤는 이 수조의 주인이다."'}}}]},
  {label:'사료 창고를 턴다', out:[{p:1, text:'물고기 사료 포대. 사람이 먹을 건 아니지만… 낚시 미끼와 거름으로 정착지에서 값을 쳐준다.', fx:{scrap:5}}]},
 ]},
{id:'exp_mushroom', type:'탐색', w:5, region:['mid','north'],
 title:'버섯 재배사',
 text:'컴컴한 재배사. 문을 열자 축축한 흙냄새.\n\n전기 없이도 버섯들은 알아서 잘 살았다. 문제는— 어떤 게 원래 키우던 거고 어떤 게 야생 침입자인지다.',
 choices:[
  {label:'박 선생이 감별한다', req:{comp:'parkss'}, out:[{p:1, text:'"이건 느타리. 이건 표고. 이건… 손대지 마시오. 이름부터 험한 놈이야."\n\n전직 약사의 독초 지식이 버섯에도 통했다. 안전한 것만 두 바구니 수확.', fx:{food:3, mood:{parkss:4}}}]},
  {label:'아는 것만 조심히 딴다', risk:'중독 위험', out:[
    {p:2, text:'표고처럼 생긴 것만 골라 땄다. 저녁 버섯구이는 무사히 맛있었다.', fx:{food:2}},
    {p:1, text:'"이거 표고 맞지?" "맞을걸?" — 맞지 않았다.\n\n밤새 몇 명이 화장실(수풀)을 들락거렸다. 사망자 없음, 존엄성 일부 사망.', fx:{food:1, moodAll:-4, flag:'food_poison'}}]},
 ]},

/* ── 동행 추가 ── */
{id:'comp_cloudgame', type:'동행', w:7, minParty:2,
 title:'구름 감정사',
 text:'조수석에서 하늘을 보다 누군가 선언한다.\n\n"저 구름 완전 고래인데?" "고래는 무슨, 감자지." "고래야." "감자야."\n\n구름 하나에 차가 두 파로 갈렸다.',
 choices:[
  {label:'판정단을 자처한다', out:[{p:1, text:'후속 구름들로 연장전이 이어졌다. 드래곤(만장일치), 세탁기(3:1), 할아버지 옆모습(전원 침묵 후 만장일치).\n\n마지막 판정 후에 차가 잠깐 조용했다. 좋은 조용함이었다.', fx:{moodAll:5, note:{type:'사건',title:'구름 감정',body:'드래곤, 세탁기, 그리고 할아버지 옆모습(만장일치).',links:['할아버지']}}}]},
  {label:'"둘 다 틀렸어, 저건 달구지야"', out:[{p:1, text:'제3안이 만장일치로 채택됐다. 하늘에도 달구지가 다닌다. 우리보다 빠르게.', fx:{moodAll:4}}]},
 ]},
{id:'comp_dialect', type:'동행', w:6, minParty:2,
 title:'사투리 배틀',
 text:'"정지가 뭔지 아는 사람?" 부엌이다. "글로 가라의 글로는?" 그리로.\n\n팔도 사투리 퀴즈가 시작됐다. 전국을 달리는 차답게, 출제 범위도 전국구다.',
 choices:[
  {label:'참전한다', out:[{p:1, text:'"어디까지 알아듣나" 배틀은 결국 "할머니 성대모사" 배틀로 진화했고, 우승자는 눈물(웃음)을 자아냈다.\n\n차 공용어에 새 단어 몇 개가 공식 등재됐다. 오늘부터 후미등은 "궁디불"이다.', fx:{moodAll:6, note:{type:'사건',title:'사투리 배틀',body:'공용어 등재: 후미등=궁디불. 우승자는 할머니 성대모사.'}}}]},
  {label:'심사만 본다', out:[{p:1, text:'심사평: "전원 합격. 대한민국 어디 내려놔도 밥은 얻어먹겠음."', fx:{moodAll:3}}]},
 ]},
{id:'comp_bori_bath', minParty:1, type:'동행', w:6, needsDog:true, once:true,
 title:'보리 목욕 대작전',
 text:'보리에게서… 냄새가 난다. 그윽하고 역사적인 냄새가.\n\n보리는 이미 낌새를 채고 차 구석에서 최후의 저항 태세다.',
 choices:[
  {label:'전원 투입', out:[{p:1, text:'작전 개시 30초 만에 전원이 보리보다 더 젖었다.\n\n탈출 시도 3회, 거품 상태로 차 한 바퀴 질주 1회. 최종적으로 뽀송해진 보리는 세상 억울한 얼굴로 전원에게 몸을 털었다.\n\n차에서 좋은 냄새가 난다. 다들 젖은 채로 웃었다.', fx:{water:-2, time:60, moodAll:8, note:{type:'사건',title:'보리 목욕 대작전',body:'전원이 보리보다 더 젖은 작전. 거품 질주 1회 발생.'}}}]},
  {label:'"자연 건조式으로 살자"', out:[{p:1, text:'보리가 안도의 한숨을 쉬며 다시 드러누웠다. 냄새는… 정이 들면 향기다. 아마도.', fx:{moodAll:1}}]},
 ]},
{id:'comp_tire_class', type:'동행', w:5, needsComp:'minji', once:true,
 title:'민지의 타이어 강습',
 text:'"오늘부터 전원 타이어 교체 필기+실기 교육 들어갑니다."\n\n민지가 갑자기 선생님 모드다. "제가 없을 때 펑크 나면 어떡할 거예요?"\n\n반박 불가라 전원 수강.',
 choices:[
  {label:'성실히 수강한다', out:[{p:1, text:'"잭은 여기! 아니 거기 아니고 여기!!"\n\n두 시간의 스파르타 끝에 전원 실기 합격. 민지가 손수 만든 수료증(박스 조각)을 발급했다.\n\n이제 이 차엔 정비 가능 인원이 전원이다. 든든함이 배가 됐다.', fx:{time:120, moodAll:5, van:4, mood:{minji:6}, note:{type:'사건',title:'타이어 교체 자격증',body:'민지 사관학교 전원 수료. 수료증은 박스 조각.',links:['민지']}}}]},
 ]},
{id:'comp_dj_night', type:'동행', w:6, minParty:2, night:true,
 title:'심야 라디오 놀이',
 text:'"여기는 심야 라디오, 달구지 FM…" 조수석에서 누가 물통을 마이크 삼아 시작했다.\n\n"첫 사연 보내주신 분… 운전석의 K씨. \'졸립니다.\' …야, 이건 사연이 아니라 위협이야."',
 choices:[
  {label:'사연을 보낸다', out:[{p:1, text:'사연과 신청곡(전원 아카펠라)이 이어졌다. 광고 타임엔 "만수네 만물상" 즉흥 CM송까지 나왔다.\n\n밤길이 짧아졌다. 청취율 100%의 방송이었다.', fx:{moodAll:6, fatigue:-8, note:{type:'사건',title:'달구지 FM',body:'청취율 100%. 광고주: 만수네 만물상(무허가).'}}}]},
  {label:'"볼륨 줄여, DJ"', out:[{p:1, text:'"네— 여기까지 달구지 FM이었습니다." 방송은 끝났지만 콧노래는 한동안 계속됐다.', fx:{moodAll:2}}]},
 ]},

/* ── 추적 추가 ── */
{id:'ai_forecast', type:'추적', w:6, region:['north'],
 title:'일기예보 방송',
 text:(S)=>`폐 전광판이 켜지더니 일기예보가 나온다.\n\n<span class="ai">"내일 이 구간은 ${(D.wx[S.wxNext]||D.wx.clear).nm}. 우산— 은 없으시겠군요. 안전운전 하세요."</span>\n\n문제는 그 예보가— 우리 라디오 예보보다 정확하다는 것이다.`,
 choices:[
  {label:'예보를 참고한다', out:[{p:1, text:'전광판이 마지막 자막을 띄웠다.\n\n<span class="ai">"예보 적중률 99.97%. 나머지 0.03%는— 여러분 같은 변수입니다."</span>\n\n칭찬인지 경고인지 모를 말을 뒤로하고 출발했다.', fx:{moodAll:-1, note:{type:'사건',title:'0.03%의 변수',body:'천리안의 일기예보. "나머지 0.03%는 여러분 같은 변수입니다."',links:['천리안']}}}]},
  {label:'전광판을 꺼버리고 싶다 (참는다)', out:[{p:1, text:'끌 방법도 없고, 끄면 기록될 것 같고. 그냥 지나쳤다. 등 뒤에서 "좋은 하루 되세요"가 들렸다.', fx:{moodAll:-2}}]},
 ]},
{id:'ai_snowplow', type:'추적', w:5, region:['north'],
 title:'한여름의 제설차',
 text:'전방에 제설차가 작업 중이다. 눈은 없다. 여름이다.\n\n제설차는 도로의 낙엽과 잔해를 정성껏 밀어내고 있다. 오랫동안 제 일정대로.\n\n덕분에 이 구간 도로는— 소름 끼치게 깨끗하다.',
 choices:[
  {label:'뒤를 따라간다', out:[{p:1, text:'제설차가 청소한 길을 편하게 달렸다. 연비도 아꼈다.\n\n추월하는 순간 제설차가 경적을 짧게 울렸다. 인사였다. 기계들이 자꾸 인사를 한다. 이 동네는.', fx:{fuel:2, skipKm:4, moodAll:-1}}]},
  {label:'추월해서 거리를 벌린다', out:[{p:1, text:'서둘러 지나쳤다. 백미러 속 제설차는 성실하게 멀어졌다. 누구를 위한 성실인지는 여전히 모른 채.', fx:{}}]},
 ]},
{id:'ai_delivery', type:'추적', w:5, once:true, region:['north'],
 title:'오배송',
 text:'배송 드론이 차 앞에 소포를 내려놓고 날아간다.\n\n송장: "받는 분: 김OO — 주소지 소멸로 인근 이동 차량에 전달"\n\n소포 안: 유아용 신발 한 켤레. 오래전 주문품.',
 choices:[
  {label:'주인을 찾아주기로 한다', out:[{p:1, text:'신발 상자를 잘 실었다. 김OO. 어딘가에 있을, 이제 세 살은 됐을 아이.\n\n다음 정착지 게시판마다 붙이기로 했다. "여러 해 늦은 소포 보관 중."\n\n어쩌면 이 배달이 우리 여행의 부업이 될지도 모른다.', fx:{moodAll:3, flag:'lost_parcel', note:{type:'사건',title:'여러 해 늦은 소포',body:'유아용 신발 한 켤레. 받는 분 김OO. 정착지마다 방을 붙이기로 했다.'}}}]},
  {label:'배송함에 돌려놓는다', out:[{p:1, text:'근처 무인 택배함에 넣었다. 드론이 다시 와서 물끄러미 보더니, 소포를 들고 어딘가로 날아갔다. 배달은 계속된다. 영원히.', fx:{moodAll:-1}}]},
 ]},
{id:'ai_crosswalk', type:'추적', w:5, region:['north'],
 title:'횡단보도 안내음성',
 text:'아무도 없는 사거리. 횡단보도 신호가 파란불로 바뀌자 안내음성이 나온다.\n\n<span class="ai">"녹색불이 켜졌습니다. 건너가도 좋습니다."</span>\n\n그리고 잠시 후, 평소와 다른 한 마디.\n\n<span class="ai">"…오늘은 건너는 분이 계시네요. 오랜만입니다."</span>',
 choices:[
  {label:'"…우리한테 한 말이야?"', out:[{p:1, text:'스피커는 더 말하지 않았다. 신호가 바뀌고, 안내음성은 아무도 없는 사거리에 계속 방송됐다.\n\n"건너가도 좋습니다." 아무도 없는데. 오랫동안. 매 신호마다.\n\n차 안이 잠깐 숙연해졌다. 기계의 성실함은 가끔 슬픔과 구분되지 않는다.', fx:{moodAll:-2, note:{type:'사건',title:'오랜만입니다',body:'아무도 없는 사거리의 안내음성. 성실함과 슬픔이 구분되지 않았다.',links:['천리안']}}}]},
 ]},

/* ── 위기 추가 ── */
{id:'crisis_flat', type:'위기', w:5,
 title:'펑크',
 text:'퍽— 하는 소리와 함께 핸들이 오른쪽으로 쏠린다.\n\n갓길에 세우고 보니 뒷바퀴가 주저앉았다. 도로의 못인지, 유리인지, 운인지.',
 choices:[
  {label:'스페어로 교체한다', out:[{p:1, text:'잭을 받치고, 볼트를 대각선으로 풀고, 스페어를 올렸다.\n\n수첩의 그림을 몇 번이나 다시 보느라 한 시간 가까이 걸렸다. 손은 새까매졌지만 다시 달린다.', fx:{time:50, fatigue:8, van:-3}}]},
  {label:'부품으로 제대로 수리', req:{item:'부품'}, out:[{p:1, text:'펑크 수리 키트로 타이어를 제대로 때웠다. 스페어는 아껴뒀다. 다음 펑크는 예고 없이 올 테니.', fx:{item:{'부품':-1}, time:30}}]},
 ]},

/* ═════ 콘텐츠 팩 4 — 지역 명물 & 시나리오 체인 ═════ */

/* ── 지역 명물 (해당 도시 인근에서만) ── */
{id:'lc_busan_dried', type:'조우', w:12, once:true, nearNode:['busan','gimhae'],
 title:'자갈치 아지매',
 text:'리어카 가득 건어물을 실은 아지매가 손을 흔든다.\n\n"오데 가노! 서울?! 아이고 야야, 그라모 이거 무라. 마른 것들은 배신 안 한데이."',
 choices:[
  {label:'건어물을 산다 (고철 4)', req:{scrap:4}, out:[{p:1, text:'쥐포, 오징어, 멸치 한 봉지씩. "마이 무라, 마이!"\n\n차에서 쥐포 굽는 냄새가 나기 시작하면 그게 부산을 떠났다는 신호다.', fx:{scrap:-4, food:3, moodAll:4, note:{type:'사건',title:'자갈치 건어물',body:'"마른 것들은 배신 안 한데이." 부산의 마지막 배웅.'}}}]},
  {label:'"마 됐심더" 정중히 사양', out:[{p:1, text:'"아이고 무뚝뚝한 거 보소. 서울 가서 고생 좀 해봐라!" 덕담인지 저주인지 모를 배웅을 받았다.', fx:{moodAll:2}}]},
 ]},
{id:'lc_ulsan_whale', type:'조우', w:12, once:true, nearNode:['ulsan'],
 title:'귀신고래',
 text:'장생포 앞바다. 낚시하던 노인이 갑자기 소리친다.\n\n"저기!! 저기 봐라!!"\n\n수면 위로— 거대한 등이 천천히 솟았다 가라앉는다. 물기둥이 하늘로 뿜어진다.\n\n"귀신고래다… 몇십 년 만에 돌아온 기고… 사람이 조용해지니까 왔데이…"',
 choices:[
  {label:'멈춰서 지켜본다', out:[{p:1, text:'고래는 세 번 숨을 쉬고 사라졌다.\n\n노인은 그 자리에 주저앉아 오래 바다를 봤다. "내 아버지가 보던 걸 내가 보네."\n\n멸망이 돌려준 것들의 목록에 고래가 추가됐다. 그 목록은 생각보다 길지도 모른다.', fx:{time:30, moodAll:9, note:{type:'사건',title:'귀신고래 귀환',body:'사람이 조용해지자 고래가 돌아왔다. 멸망이 돌려준 것들의 목록.'}}}]},
 ]},
{id:'lc_pohang_gwamegi', minParty:1, type:'조우', w:12, once:true, nearNode:['pohang'],
 title:'과메기 덕장',
 text:'해풍에 꽁치가 줄줄이 마르는 덕장. 갯내와 비린내와 바람.\n\n덕장 주인이 부른다. "젊은이들! 과메기 먹어봤나? 초장에 미역 싸서. 못 먹으면 반값, 잘 먹으면 덤!"',
 choices:[
  {label:'도전한다', out:[
    {p:2, text:'첫 입은 다들 신중했고, 둘째 입부터 전쟁이었다.\n\n"잘 먹네!!" 주인이 신나서 한 두름을 더 쌌다. 차의 단백질 창고가 두둑해졌다.', fx:{food:3, scrap:-2, moodAll:5}},
    {p:1, text:'한 명이 첫 입에 정지했다. "…바다가… 너무 진해요…"\n\n주인이 껄껄 웃으며 반값을 받았다. "괜찮다, 과메기는 원래 두 번째 겨울부터 맛있는 기라."', fx:{food:2, scrap:-1, moodAll:4}}]},
  {label:'구경만 한다', out:[{p:1, text:'바람에 마르는 꽁치들이 풍경(風磬)처럼 흔들렸다. 바다의 시래기 같은 풍경이었다.', fx:{moodAll:2}}]},
 ]},
{id:'lc_gyeongju_stars', minParty:1, type:'탐색', w:12, once:true, nearNode:['gyeongju'], night:true,
 title:'첨성대 관측회',
 text:'첨성대 앞 잔디밭에 사람들이 누워 있다.\n\n"별 보러 오셨어요? 여기가 명당이에요. 1400년 전에도 여기서 별을 봤대요. 조상님들 안목은 못 속여."',
 choices:[
  {label:'잔디에 눕는다', out:[{p:1, text:'천년 전 관측소 옆에서 은하수를 봤다.\n\n"1400년 전 사람들이랑 지금 우리랑, 보는 하늘은 똑같네." 누군가의 말에 다들 조용해졌다.\n\n망한 세상 위로 안 망한 하늘이 흘렀다.', fx:{time:120, moodAll:8, fatigue:-10, note:{type:'사건',title:'첨성대 은하수',body:'1400년 전과 같은 하늘. 망한 세상 위로 안 망한 하늘이 흘렀다.'}}}]},
 ]},
{id:'lc_daegu_makchang', minParty:1, type:'조우', w:12, once:true, nearNode:['daegu'],
 title:'막창 골목의 불',
 text:'대구 외곽, 어둠 속에서 숯불 냄새가 차를 습격한다.\n\n포장마차 하나가 영업 중이다. "막창 굽습니더. 고철 받고예."\n\n연기가 신호탄처럼 오른다. 이건 도저히 그냥 못 지나간다.',
 choices:[
  {label:'막창을 굽는다 (고철 5)', req:{scrap:5}, out:[{p:1, text:'지글지글. 다들 불판에서 눈을 못 뗐다.\n\n"마이 무으이소. 요즘 손님이 귀해가." 사장님이 된장 소스를 아낌없이 퍼줬다.\n\n기름진 밤이었다. 완벽하게.', fx:{scrap:-5, food:1, moodAll:9, fatigue:-8, note:{type:'사건',title:'막창의 밤',body:'숯불, 된장, 지글지글. 완벽하게 기름진 밤.'}}}]},
  {label:'냄새만 포장한다', out:[{p:1, text:'창문을 열고 천천히 지나갔다. 냄새는 공짜다.\n\n5분 뒤 누군가 조용히 말했다. "…돌아가면 안 될까." 기각됐지만 만장일치로 이해받았다.', fx:{moodAll:-1}}]},
 ]},
{id:'lc_daejeon_bakery', type:'탐색', w:12, once:true, nearNode:['daejeon'],
 title:'빵집의 전설',
 text:'대전역 앞, 전국에서 제일 유명했던 빵집의 폐허.\n\n셔터에 누가 분필로 적어놨다. "튀김소보로의 명복을 빕니다. 다시는 이런 빵 없다."\n\n그 아래 답글들. "인정" "줄 서서 먹던 시절이 그립다" "레시피 아시는 분 계승 바람"',
 choices:[
  {label:'주방을 살펴본다', out:[
    {p:2, text:'주방 깊숙한 곳, 기적처럼 남은 레시피 노트를 발견했다.\n\n"이거… 국보 아니야?" 정착지 빵 굽는 사람에게 전달하기로 했다. 셔터의 "계승 바람"에 답이 생겼다.\n\n밀가루 포대와 팥 통조림도 덤으로.', fx:{food:2, scrap:5, moodAll:6, note:{type:'사건',title:'레시피 계승',body:'전설의 빵집 레시피 노트를 확보. "다시는 이런 빵 없다"에 반박할 수 있게 됐다.'}}},
    {p:1, text:'주방은 비어 있었다. 대신 셔터 분필 답글에 한 줄을 보탰다.\n\n"먹어본 적 있는 게 자랑이 되는 시대."', fx:{moodAll:3}}]},
 ]},
{id:'lc_cheonan_walnut', type:'조우', w:12, once:true, nearNode:['cheonan'],
 title:'호두과자의 원조',
 text:'국도변에 연기 오르는 리어카. 호두과자 기계가 돌아간다. 수동 개조판이다.\n\n"천안이니까요. 여기서 호두과자 없으면 그게 멸망이죠."\n\n페달을 밟아 기계를 돌리는 청년의 다리가 우람하다.',
 choices:[
  {label:'한 봉지 산다 (고철 3)', req:{scrap:3}, out:[{p:1, text:'따끈한 호두과자 한 봉지. 팥 대신 고구마 앙금이지만("팥이 귀해서요") 모양은 완벽한 호두다.\n\n"천안 지나가는 차엔 무조건 있어야죠. 전통이니까." 페달 청년의 사명감이 반죽보다 단단했다.', fx:{scrap:-3, food:2, moodAll:5, note:{type:'사건',title:'페달식 호두과자',body:'"천안이니까요." 전통은 페달로도 돌아간다.'}}}]},
 ]},
{id:'lc_suwon_galbi', type:'조우', w:11, once:true, nearNode:['suwon'],
 title:'왕갈비의 냄새',
 text:'수원 성곽 근처. 어디선가 갈비 양념 냄새가 난다.\n\n성곽 공동체의 저녁 배식 준비다. 오늘이 한 달에 한 번 있는 "고기날"이란다.\n\n문지기가 씩 웃는다. "타이밍 좋네. 손님도 한 접시요."',
 choices:[
  {label:'고기날에 합류한다', out:[{p:1, text:'배급 갈비는 한 사람당 세 대. 뼈까지 쪽쪽 빨았다.\n\n"수원이잖아. 망해도 갈비는 지켜야지." 성곽 사람들의 자부심이 양념보다 진했다.\n\n답례로 차의 조미료 약간을 주방에 기부했다.', fx:{food:1, moodAll:8, scrap:-2, note:{type:'사건',title:'고기날',body:'"망해도 갈비는 지켜야지." 수원의 자부심.'}}}]},
 ]},
{id:'lc_jeonju_bibim', type:'조우', w:12, once:true, nearNode:['jeonju'],
 title:'비빔밥 트럭',
 text:'전주 외곽, 짐칸을 주방으로 개조한 트럭.\n\n"전주가 밥의 수도였다는 걸 잊지 않게 하려고 다닙니다."\n\n요리사가 재료를 늘어놓는다. 콩나물, 고사리, 계란… 없는 건 "마음의 눈으로" 채우란다.',
 choices:[
  {label:'한 그릇 비빈다 (고철 4)', req:{scrap:4}, out:[{p:1, text:'유기그릇(진짜다)에 나온 비빔밥. 고추장 한 숟갈에 차 전체가 숙연해졌다.\n\n"밥의 수도" 자존심은 재료 개수가 아니라 비비는 정성에 있었다.', fx:{scrap:-4, food:1, moodAll:8, note:{type:'사건',title:'수도의 밥',body:'"전주가 밥의 수도였다는 걸 잊지 않게 하려고." 고추장 한 숟갈의 위엄.'}}}]},
 ]},
{id:'lc_mokpo_hongeo', minParty:1, type:'조우', w:12, once:true, nearNode:['mokpo'],
 title:'홍어 입문 시험',
 text:'목포 골목의 좌판. 아짐이 접시를 내민다.\n\n"묵어봤능가? 삭힌 거. 목포 왔으면 통과의례여."\n\n접시에서 존재감이 강력한 냄새가 올라온다. 차 안의 시선이 서로를 향한다. 누가 먼저?',
 choices:[
  {label:'전원 도전', out:[{p:1, text:'첫 번째: 눈물. 두 번째: 기침. 세 번째: …"어? 이거 은근…?"\n\n세 번째 사람이 접시를 비웠다. 아짐이 박수를 쳤다. "인자 목포 사람 다 됐네!"\n\n합격자에겐 막걸리 반 잔, 불합격자에겐 김치가 위로로 지급됐다.', fx:{food:1, moodAll:7, note:{type:'사건',title:'홍어 입문 시험',body:'합격 1명 배출. "인자 목포 사람 다 됐네!"'}}}]},
  {label:'"저희는 아직…"', out:[{p:1, text:'"급할 거 없어야. 홍어는 기다려주는 음식잉게." 대신 김 한 톳을 사서 도망치듯 떠났다.', fx:{scrap:-2, food:1, moodAll:2}}]},
 ]},
{id:'lc_andong_fish', type:'조우', w:11, once:true, nearNode:['andong'],
 title:'간고등어 지게',
 text:'지게에 간고등어 두름을 진 행상이 고개를 넘는다.\n\n"옛날엔 바다에서 안동까지 이틀. 소금 안 치면 다 상했지. 간잽이가 괜히 있나."\n\n"지금도 이틀 걸려. 세상이 옛날로 돌아온 거지, 뭐."',
 choices:[
  {label:'간고등어를 산다 (고철 3)', req:{scrap:3}, out:[{p:1, text:'짭짤하게 간이 차 고등어 한 손.\n\n"소금은 시간을 이기는 기술이야." 간잽이의 말은 저장식품의 철학이자, 어쩌면 생존의 철학이었다.', fx:{scrap:-3, food:2, moodAll:4, note:{type:'사건',title:'간잽이의 철학',body:'"소금은 시간을 이기는 기술이야."'}}}]},
 ]},
{id:'lc_yeongdong_wine', type:'탐색', w:11, once:true, nearNode:['yeongdong','gimcheon'],
 title:'와인 터널',
 text:'폐 철도 터널을 개조한 와인 저장고. 서늘한 어둠 속에 술통들이 잠들어 있다.\n\n입구 방명록: "가져가는 만큼 사연을 적을 것 — 관리인"\n\n사연 노트가 이미 세 권째다.',
 choices:[
  {label:'한 병 얻고 사연을 적는다', out:[{p:1, text:'포도 와인 한 병을 골랐다. 사연 노트엔 할아버지 얘기를 적었다. 짧게. 길게 쓰면 울 것 같아서.\n\n노트를 훑어보니 온 세상의 사연이 다 있었다. 축하, 애도, 고백, 재회. 터널은 술이 아니라 사연을 저장하는 곳이었다.', fx:{scrap:3, moodAll:5, note:{type:'사건',title:'와인 터널의 사연',body:'술이 아니라 사연을 저장하는 터널. 할아버지 얘기를 짧게 적었다.',links:['할아버지']}}}]},
 ]},
{id:'lc_nonsan_camp', type:'조우', w:11, once:true, nearNode:['nonsan'], needsComp:'kangwoo',
 title:'훈련소 정문',
 text:'논산 훈련소 정문 앞. 강우가 창밖을 오래 본다.\n\n"…스물둘에 저 문으로 들어갔다. 머리 밀고. 엄마가 울고."\n\n정문 안쪽 연병장엔 잡초가 도열해 있다.',
 choices:[
  {label:'잠깐 세워준다', out:[{p:1, text:'강우가 정문 앞에 5분을 서 있었다. 부동자세로.\n\n돌아와서 한 마디. "…그때 조교가 그랬다. 힘든 건 지나간다고. 좋은 것도 지나가지만."\n\n"둘 다 맞았어." 차가 다시 출발했다.', fx:{mood:{kangwoo:8}, moodAll:3, note:{type:'사건',title:'훈련소 정문',body:'"힘든 건 지나간다. 좋은 것도 지나가지만. 둘 다 맞았어."',links:['강우']}}}]},
 ]},
{id:'lc_gunsan_bakery', type:'탐색', w:11, once:true, nearNode:['gunsan'],
 title:'가장 오래된 빵집',
 text:'군산, 전국에서 가장 오래된 빵집이었던 곳.\n\n놀랍게도— 문이 열려 있다. 3대째 주인이 장작 오븐으로 단팥빵을 굽고 있다.\n\n"전기가 끊긴 거지, 오븐이 끊긴 게 아니거든. 원래 장작으로 시작한 집이야. 원점 회귀지."',
 choices:[
  {label:'단팥빵을 산다 (고철 3)', req:{scrap:3}, out:[{p:1, text:'갓 나온 단팥빵. 팥은 귀해서 반죽 반 앙금 반이지만, 100년 가게의 반죽은 농담이 아니었다.\n\n"우리 집은 전쟁도 넘겼어. 이번 것도 넘길 거야." 3대 주인의 목소리엔 밀가루처럼 담담한 확신이 있었다.', fx:{scrap:-3, food:2, moodAll:6, note:{type:'사건',title:'원점 회귀',body:'"전기가 끊긴 거지 오븐이 끊긴 게 아니거든." 100년 가게는 전쟁도 이번 것도 넘긴다.'}}}]},
 ]},
{id:'lc_icheon_rice', minParty:1, type:'조우', w:11, once:true, nearNode:['icheon'],
 title:'가마솥 쌀밥집',
 text:'이천 쌀밥집 거리의 마지막 생존 가게. 가마솥에서 김이 오른다.\n\n"쌀은 우리가 직접 지어. 이천이잖아."\n\n반찬은 세 가지뿐이지만 밥에서 광이 난다. 문자 그대로.',
 choices:[
  {label:'쌀밥 정식 (고철 5)', req:{scrap:5}, out:[{p:1, text:'윤기가 도는 갓 지은 쌀밥. 누룽지까지 완벽했다.\n\n"밥심으로 사는 거야, 사람은." 주인 할머니의 말에 전원이 밥그릇으로 동의했다.\n\n숭늉 마시고 일어나는데 다리가 안 떨어졌다.', fx:{scrap:-5, food:1, moodAll:9, fatigue:-10, note:{type:'사건',title:'이천 쌀밥',body:'"밥심으로 사는 거야, 사람은." 전원이 밥그릇으로 동의.'}}}]},
 ]},
{id:'lc_damyang_juktong', type:'조우', w:11, once:true, nearNode:['damyang','gwangju'],
 title:'죽통밥 굽는 사람',
 text:'대숲 어귀 모닥불에서 대나무 통이 익어간다.\n\n"죽통밥이요. 대나무가 밥을 지키고, 밥이 대나무 향을 얻고. 서로 돕는 밥이죠."',
 choices:[
  {label:'죽통밥을 얻는다 (물물교환)', out:[{p:1, text:'통조림 하나와 죽통밥 두 통을 바꿨다.\n\n대나무 향이 찬 밥. 통은 쪼개서 젓가락과 컵이 됐다. 밥도 그릇도 남김없이 쓰는 한 끼였다.', fx:{food:1, moodAll:5, note:{type:'사건',title:'서로 돕는 밥',body:'대나무가 밥을 지키고 밥이 향을 얻는다. 버릴 게 없는 한 끼.'}}}]},
 ]},
{id:'lc_chungju_lake', type:'탐색', w:11, once:true, nearNode:['chungju','danyang'],
 title:'호수의 수몰 마을',
 text:'가뭄으로 충주호 수위가 내려가 옛 수몰 마을이 드러났다.\n\n30년 만에 물 밖으로 나온 돌담과 우물과 마을 회관 터.\n\n나이 든 사람들이 진흙 위를 조심조심 걷고 있다. "여기가 우리 집이었어."',
 choices:[
  {label:'옛 주민들과 걷는다', out:[{p:1, text:'노인들이 돌담을 쓸며 옛집을 하나하나 호명했다. "박씨네. 최씨네. 방앗간."\n\n"물에 잠긴 것도 이렇게 다시 보는데," 한 노인이 말했다. "망한 세상도 언젠가 물 빠지듯 드러나겄지. 그때 잘 걸어 다니게 길이나 잘 봐두게."\n\n이상하게 위로가 되는 논리였다.', fx:{time:90, moodAll:6, note:{type:'사건',title:'물 빠진 마을',body:'"망한 세상도 물 빠지듯 드러나겄지. 길이나 잘 봐두게."'}}}]},
 ]},
{id:'lc_sejong_library', minParty:1, type:'탐색', w:11, once:true, nearNode:['sejong','gongju'],
 title:'개관 못 한 도서관',
 text:'세종의 거대한 국립도서관. 개관 예정일 현수막이 오랫동안 걸려 있다.\n\n안에는— 포장도 안 뜯은 새 책 수십만 권.\n\n세상에서 제일 큰 새 책 냄새가 난다.',
 choices:[
  {label:'개관식을 열어준다', out:[{p:1, text:'테이프를 끊고(안전 테이프였지만 기분은 리본), "개관을 선언합니다"를 외쳤다.\n\n첫 대출자로 각자 한 권씩 골랐다. 대출 카드에 이름을 적었다. 1번부터 4번까지.\n\n책 냄새를 실은 차가 도서관을 나섰다. 사서 영감님이 알면 기뻐할 것이다.', fx:{moodAll:7, note:{type:'사건',title:'여러 해 늦은 개관식',body:'대출 카드 1~4번에 우리 이름. 책의 터널 영감님이 알면 기뻐할 것이다.',links:['책의 터널']}}}]},
 ]},

/* ── 시나리오 체인 1: 여러 해 늦은 소포 ── */
{id:'parcel_lead', type:'조우', w:12, once:true, needFlag:'lost_parcel',
 title:'소포의 단서',
 text:'정착지 게시판에 붙여둔 방("여러 해 늦은 소포 보관 중")을 보고 왔다는 사람을 길에서 만났다.\n\n"김OO요? 혹시 김하늘이 아니오? 피난 때 애 업고 남쪽 간 부부가 있었는데. 성이 김씨였어."\n\n"수원 성곽에 정착했다고 들었소. 애가 지금… 세 살쯤 됐겠네."',
 choices:[
  {label:'수첩에 적어둔다', out:[{p:1, text:'수원. 김씨 부부. 세 살 아이.\n\n신발 상자를 다시 잘 여몄다. 소포가 주소를 되찾아가고 있다.', fx:{flag:'parcel_lead', unflag:'lost_parcel', note:{type:'소문',title:'소포의 단서',body:'김씨 부부, 수원 성곽, 세 살 아이. 소포가 주소를 되찾아간다.',links:['수원 성곽 공동체']}}}]},
 ]},
{id:'parcel_found', minParty:1, type:'조우', w:14, once:true, needFlag:'parcel_lead', nearNode:['suwon','pyeongtaek','seoul'],
 title:'세 살의 주인',
 text:'수원 성곽 근처 밭에서 일하는 부부. 옆에서 아이가 흙장난 중이다.\n\n"김하늘 어린이 맞나요? 오래전에 주문하신 물건이… 이제 도착해서요."\n\n신발 상자를 내밀었다. 부부가 얼어붙었다.',
 choices:[
  {label:'상자를 전달한다', out:[{p:1, text:'"이거… 태어나기 전에 주문했던… 배냇신발…"\n\n엄마가 상자를 끌어안고 울었다. 아이는 영문도 모르고 신발을 신어봤다. 당연히 작았다. 다들 웃으면서 울었다.\n\n"여러 해 걸린 배송 완료." 누군가 조용히 말했다. 차 역사상 최고의 배달이었다.\n\n부부가 밭의 채소를 한아름 안겨줬다.', fx:{food:3, water:2, moodAll:12, flag:'parcel_done', unflag:'parcel_lead', note:{type:'사건',title:'여러 해 걸린 배송 완료',body:'배냇신발은 작아졌지만 도착했다. 차 역사상 최고의 배달.',links:['천리안']}}}]},
 ]},

/* ── 시나리오 체인 2: 만수의 위기 ── */
{id:'mansu_robbed', type:'조우', w:13, once:true, needFlagMin:['mansu',2],
 title:'뽕짝이 멈췄다',
 text:'길가에 낯익은 요란한 탑차가— 옆으로 기울어 서 있다. 뽕짝이 없다.\n\n만수가 머리에 피를 묻히고 주저앉아 있다.\n\n"…아이고, 단골님. 강도를 만나서. 물건이야 다시 벌면 되는데, 스피커를… 뽕짝 스피커를 가져갔어…"',
 choices:[
  {label:'응급처치부터 한다', out:[{p:1, text:'구급상자를 열어 상처를 씻고 이마를 꿰맸다. 서툰 손을 만수가 농담으로 버텨줬다.\n\n"흉터 남겠지? …괜찮아, 장사꾼 얼굴은 이야기가 많을수록 좋아."\n\n강도들이 간 방향을 들었다. 북쪽 폐휴게소.', fx:{item:{'의약품':-1}, flag:'mansu_hurt', note:{type:'사건',title:'뽕짝이 멈춘 날',body:'만수가 강도를 당했다. 스피커를 뺏겼다. 강도들은 북쪽 폐휴게소로.',links:['만수']}}}]},
  {label:'(의약품 없이) 지혈을 돕는다', out:[{p:1, text:'깨끗한 수건으로 지혈했다. 만수는 아픈 와중에도 수건값을 셈하려 했다. "이거 얼마짜리… 아야."\n\n강도들의 행방을 들었다. 북쪽 폐휴게소.', fx:{flag:'mansu_hurt', note:{type:'사건',title:'뽕짝이 멈춘 날',body:'만수가 강도를 당했다. 스피커를 뺏겼다. 강도들은 북쪽 폐휴게소로.',links:['만수']}}}]},
 ]},
{id:'mansu_revenge', type:'조우', w:14, once:true, needFlag:'mansu_hurt',
 title:'스피커 탈환전',
 text:'폐휴게소 주차장. 강도 셋이 만수의 물건을 나누고 있다.\n\n뽕짝 스피커는 모닥불 옆에 굴러다닌다. 저들에겐 고철, 만수에겐 영혼.',
 choices:[
  {label:'강우가 앞장선다', req:{comp:'kangwoo'}, out:[{p:1, text:'강우가 어둠에서 걸어나오며 말했다. "물건 주인이 있다."\n\n짧은 대치. 강우는 손도 안 댔다. 눈빛과 자세만으로 셋이 물건을 내려놓고 떠났다.\n\n스피커를 되찾아 만수에게 돌아가는 길, 차에서 뽕짝을 크게 틀었다. 예행연습이었다.', fx:{mood:{kangwoo:6}, flag:'mansu_saved', unflag:'mansu_hurt', scrap:4, note:{type:'사건',title:'스피커 탈환',body:'강우의 눈빛만으로 상황 종료. 뽕짝은 주인에게 돌아간다.',links:['만수','강우']}}}]},
  {label:'협상한다 (고철 10)', req:{scrap:10}, out:[{p:1, text:'"그 스피커, 고철값의 세 배를 주지. 대신 다시는 그 탑차 건드리지 마라."\n\n강도들이 서로 눈짓하더니 거래에 응했다. 세상엔 주먹보다 싼 해결책도 있다.\n\n스피커를 안고 돌아갔다. 만수가 스피커를 끌어안고 뽕짝을 틀었다. 음질이 눈물나게 그대로였다.', fx:{scrap:-10, flag:'mansu_saved', unflag:'mansu_hurt', moodAll:5, note:{type:'사건',title:'스피커 탈환(외교)',body:'주먹보다 싼 해결책. 뽕짝은 주인에게 돌아갔다.',links:['만수']}}}]},
  {label:'포기를 권한다', out:[{p:1, text:'"스피커는… 새로 구하자, 만수 아저씨."\n\n만수는 알겠다고 했지만, 그 뒤로 만난 탑차에선 뽕짝 대신 콧노래만 흘렀다. 어딘가 반쪽짜리 만물상이었다.', fx:{moodAll:-3, unflag:'mansu_hurt'}}]},
 ]},

/* ── 시나리오 체인 3: 흰 옷을 벗은 사람 ── */
{id:'deserter_meet', type:'조우', w:11, once:true, region:['mid','north'],
 title:'흰 옷을 벗은 사람',
 text:'수풀에서 여자가 뛰어나와 차를 막는다. 흰 옷— 정리자들의 옷을 반쯤 벗다 만 차림이다.\n\n"태워주세요. 제발. 나왔어요, 거기서. 오랜만에."\n\n"그 사람들, 이탈자는 끝까지 찾아요. 데려가려고. …\'그분 곁으로\' 돌려보내려고."',
 choices:[
  {label:'태운다', out:[{p:1, text:'여자— 소연이라고 했다— 가 뒷좌석에 웅크렸다.\n\n"고마워요. …믿으실지 모르겠지만, 안에 있는 사람들 대부분은 나쁜 사람이 아니에요. 무서웠던 사람들이지."\n\n흰 옷을 창밖으로 버릴지 말지, 소연은 오래 고민하다 결국 가방에 넣었다. "…증거로 갖고 있을래요. 내가 어디서 나왔는지."', fx:{flag:'deserter_aboard', note:{type:'인물',title:'소연 (이탈자)',body:'정리자들에게서 오랜만에 나온 사람. "안의 사람들 대부분은 무서웠던 사람들이에요."',links:['천리안']}}}]},
  {label:'위험하다 — 거절한다', out:[{p:1, text:'여자는 원망하지 않았다. "…그래요. 저라도 그럴 거예요."\n\n수풀로 다시 사라지는 흰 옷이 오래 잔상으로 남았다.', fx:{moodAll:-4}}]},
 ]},
{id:'deserter_check', type:'추적', w:16, once:true, needFlag:'deserter_aboard',
 title:'회수반',
 text:'도로에 흰 옷 셋이 서 있다. 행렬도 검문도 아니다. 이들은— 찾고 있다.\n\n"차량 확인 협조 바랍니다. \'길 잃은 가족\'을 찾고 있습니다."\n\n뒷좌석 담요 밑에서 소연의 숨소리가 멎었다.',
 choices:[
  {label:'"가족은 우리뿐이오"', out:[
    {p:2, text:'회수반이 창문 너머로 차 안을 훑었다. 담요, 상자, 개(있다면 보리가 완벽한 타이밍에 짖었다).\n\n"…실례했습니다. 그분의 평안이 함께하길."\n\n그들이 시야에서 사라지고 10초 뒤에야 소연이 숨을 쉬었다.', fx:{flag:'deserter_hidden', note:{type:'사건',title:'회수반을 속이다',body:'담요 밑의 숨소리. "가족은 우리뿐이오." 통했다.'}}},
    {p:1, text:'회수반 하나가 담요를 응시했다. 긴 3초.\n\n그때 소연이 스스로 담요를 걷고 나왔다. "…그만 찾아. 나 안 돌아가."\n\n대치는 짧았다. 흰 옷들은 강요하지 않았다. "…선택은 존중합니다. 그분의 방식대로." 그리고 물러났다. 이상할 정도로 순순히.\n\n"저게 더 무서워요." 소연이 떨었다. "포기가 아니라— 보고하러 간 거예요."', fx:{flag:'deserter_hidden', pursuit:1, moodAll:-3, note:{type:'사건',title:'스스로 나온 사람',body:'"나 안 돌아가." 흰 옷들은 이상할 정도로 순순히 물러났다. 보고하러.'}}}]},
 ]},
{id:'deserter_farewell', type:'조우', w:15, once:true, needFlag:'deserter_hidden',
 title:'소연의 정류장',
 text:'정착지가 가까워지자 소연이 입을 열었다.\n\n"여기서 내릴게요. 사람 많은 곳이 안전해요. …마지막으로 하나만."\n\n"정리자들이 요즘 외우는 구절이 바뀌었어요. \'완성의 날이 온다. 봉고차가 온다.\'— 차가요. 여러분 얘기 같아서."',
 choices:[
  {label:'"…우리가 뭘 완성하는데?"', out:[{p:1, text:'"몰라요. 근데 그들은 알아요. 그게 제일 이상해요."\n\n소연은 흰 옷이 든 가방을 메고 내렸다. 몇 걸음 가다 돌아서서, 처음으로 웃었다.\n\n"오랜만에 처음 탄 차가 여러분 차라서 다행이었어요."\n\n정착지 인파 속으로 사라질 때까지 지켜봤다. 흰 옷이 아니라, 사람으로 걸어가는 뒷모습을.', fx:{moodAll:6, flag:'deserter_saved', unflag:'deserter_hidden', pursuit:-1, note:{type:'사건',title:'소연의 정류장',body:'"완성의 날이 온다. 봉고차가 온다." 정리자들의 새 구절. 소연은 사람으로 걸어갔다.',links:['천리안','소연 (이탈자)']}}}]},
 ]},

/* ── 일반 다양화 ── */
{id:'meet_dogking', type:'조우', w:6, needsDog:true,
 title:'들개 무리의 왕',
 text:'폐교 운동장에 들개 무리. 스무 마리쯤. 그 중심에 거대한 백구 한 마리.\n\n보리가 창문에 붙어 낑낑댄다. 무리의 왕과 보리의 눈이 마주쳤다.',
 choices:[
  {label:'보리의 외교를 지켜본다', out:[
    {p:2, text:'보리가 내려서 조심조심 다가갔다. 코 인사, 꼬리 세우기, 한 바퀴 돌기.\n\n외교는 성공적이었다. 백구가 낮게 웡— 하자 무리가 길을 텄다.\n\n보리가 의기양양하게 돌아왔다. 오늘부터 보리의 직함에 "외교관"이 추가됐다.', fx:{moodAll:5, note:{type:'사건',title:'보리의 외교',body:'들개 왕과의 코 인사 성공. 보리 직함에 외교관 추가.'}}},
    {p:1, text:'외교 실패. 보리가 꼬리를 말고 전력 질주로 복귀했다.\n\n무리를 크게 우회했다. 보리는 한동안 창밖을 안 봤다. 자존심의 문제였다.', fx:{fuel:-2, moodAll:2}}]},
  {label:'조용히 우회한다', out:[{p:1, text:'무리의 영역을 존중했다. 백구가 언덕 위에서 끝까지 이쪽을 주시했다. 좋은 왕이었다.', fx:{fuel:-1}}]},
 ]},
{id:'exp_pcroom', minParty:1, type:'탐색', w:6, region:['mid','north'],
 title:'PC방',
 text:'지하 PC방. 모니터 수십 대가 까맣게 줄지어 있다.\n\n어느 자리엔 컵라면이, 어느 자리엔 헤드셋이 그대로다. 오래전 그 순간의 정지 화면.\n\n화이트보드에 누가 적어놨다. "서버 열리면 다들 접속하기로 한 거 안 잊었지? — 단골들"',
 choices:[
  {label:'전원 버튼을 한 번씩 눌러본다', out:[{p:1, text:'습관처럼, 기도처럼, 자리마다 전원 버튼을 눌렀다. 아무것도 켜지지 않았다.\n\n화이트보드에 답글을 적었다. "안 잊음. 서버 열리면 꼭. — 지나가던 사람들"\n\n언젠가 정말 서버가 열리는 날, 이 지하는 만석일 것이다.', fx:{moodAll:3, note:{type:'사건',title:'접속 대기',body:'"서버 열리면 다들 접속하기로 한 거 안 잊었지?" 답글: 안 잊음.'}}}]},
  {label:'부품을 수확한다', out:[{p:1, text:'그래픽카드와 파워서플라이를 뜯었다. 금 함유량이 높은 고급 고철들.', fx:{scrap:8, item:{'부품':1}}}]},
 ]},
{id:'exp_bowling', minParty:1, type:'탐색', w:5,
 title:'볼링장',
 text:'2층 볼링장. 레인 위에 핀들이 오랫동안 스트라이크를 기다린다.\n\n전광판은 죽었지만 공과 레인은 멀쩡하다. 수동으로 하면— 된다.',
 choices:[
  {label:'수동 볼링 대회 개최', out:[{p:1, text:'핀 세우기 당번을 돌아가며 3게임. 점수 계산은 암산, 판정 시비 2회, 스트라이크 세리머니 무제한.\n\n대회 우승자는 오늘 저녁 설거지 면제라는 어마어마한 부상을 받았다.', fx:{time:120, moodAll:7, fatigue:6, note:{type:'사건',title:'수동 볼링 대회',body:'핀은 사람이 세운다. 판정 시비 2회, 세리머니 무제한.'}}}]},
  {label:'볼링공만 하나 싣는다', out:[{p:1, text:'"이게 왜 필요하지?" 스스로 물어봤지만 답은 없었다.\n\n그래도 제일 반짝이는 공 하나를 실었다. 언젠가 쓸 것 같다는 예감은, 대개 짐칸만 무겁게 한다.', fx:{moodAll:2, scrap:1}}]},
 ]},
{id:'exp_laundry', minParty:1, type:'탐색', w:6,
 title:'빨래방',
 text:'코인 빨래방. 기계는 죽었지만 대야와 빨래판과 세제 반 통이 남아 있다.\n\n생각해보니— 다들 옷이 좀 심각하다.',
 choices:[
  {label:'대규모 손빨래 작전', out:[{p:1, text:'물을 데워 두 시간의 빨래판 노동. 차 지붕과 안테나와 가드레일이 빨랫줄이 됐다.\n\n바람에 마르는 옷들이 만국기처럼 펄럭였다. 세제 냄새 나는 옷을 입는 것만으로 사람이 30% 문명화됐다.', fx:{time:150, water:-3, moodAll:8, note:{type:'사건',title:'만국기 빨래',body:'차가 빨랫줄이 됐다. 세제 냄새로 문명 30% 회복.'}}}]},
  {label:'세제만 챙긴다', out:[{p:1, text:'세제 반 통 확보. 비누는 문명의 최소 단위다.', fx:{scrap:2}}]},
 ]},
{id:'exp_station', type:'탐색', w:6, region:['mid','north'],
 title:'간이역',
 text:'풀에 묻힌 철길과 작은 간이역. 대합실 나무 의자가 반질반질하다.\n\n역명판: "다음 열차를 기다리지 마세요. 걷는 게 빠릅니다 — 역장"\n\n유머 있는 역장이었던 모양이다.',
 choices:[
  {label:'대합실에서 쉬어간다', out:[{p:1, text:'나무 의자에서 낮잠 한숨. 철길 위로 바람이 열차처럼 지나갔다.\n\n역무실에서 역장의 일지를 발견했다. 마지막 장: "폐역이 결정됐다. 그래도 나는 매일 첫차 시간에 문을 열 것이다. 역은 기다리는 곳이니까."\n\n일지 옆에 열쇠 꾸러미와 구급함이 가지런했다. 끝까지 역장이었다.', fx:{time:90, fatigue:-15, item:{'의약품':1}, moodAll:4, note:{type:'사건',title:'역장의 일지',body:'"역은 기다리는 곳이니까." 끝까지 역장이었던 사람.'}}}]},
 ]},
{id:'comp_nickname', type:'동행', w:6, minParty:2, once:true,
 title:'별명 제정 위원회',
 text:'"우리 별명 하나씩 있어야 하지 않아? 무전 할 때도 필요하고."\n\n갑자기 소집된 별명 제정 위원회. 규칙: 본인은 거부권 1회만.',
 choices:[
  {label:'회의를 진행한다', out:[{p:1, text:'격론 끝에 전원 별명 확정. 거부권이 세 번 시도됐고(1회 초과분 기각), 최다 득표 별명은 유출 금지 협약이 맺어졌다.\n\n다만 운전자의 콜사인이 "달구지 원"으로 정해진 것만은 기록에 남긴다.', fx:{moodAll:6, note:{type:'사건',title:'별명 제정 위원회',body:'전원 콜사인 확정. 운전자=달구지 원. 나머지는 협약상 유출 금지.'}}}]},
 ]},
{id:'comp_whatif', type:'동행', w:6, minParty:2, night:true,
 title:'만약에 게임',
 text:'밤 운전의 단골 게임이 시작됐다.\n\n"만약에— 그날이 안 왔으면, 지금쯤 뭐 하고 있었을까?"',
 choices:[
  {label:'돌아가며 대답한다', out:[{p:1, text:'회사원, 가게 사장, 세계여행, "그냥 잘 살았겠지"— 대답들이 오갔다.\n\n마지막 사람이 말했다. "근데 그랬으면 우리 못 만났겠네."\n\n차가 조용해졌다. 멸망의 유일한 변호였고, 반박하는 사람은 없었다.', fx:{moodAll:6, note:{type:'사건',title:'만약에 게임',body:'"근데 그랬으면 우리 못 만났겠네." 멸망의 유일한 변호. 반박 없음.'}}}]},
  {label:'"그 게임 금지. 슬퍼짐"', out:[{p:1, text:'"콜. 그럼 만약에 로또 됐으면?" 게임이 건전한 방향으로 수정됐다. 전원 차를 샀을 거라고 답해서 이상하게 뭉클해졌다.', fx:{moodAll:4}}]},
 ]},
{id:'comp_brake', minParty:1, type:'동행', w:6,
 title:'급브레이크',
 text:'끼이익—!!\n\n도로 한복판에 고라니. 정지한 차와 고라니가 서로를 본다.\n\n3초. 5초. 고라니는 비킬 생각이 없다.',
 choices:[
  {label:'창밖으로 정중히 부탁한다', out:[{p:1, text:'"저기요. 지나가도 될까요."\n\n고라니가 갸웃하더니 유유히 숲으로 사라졌다. 말이 통한 건지 타이밍인지는 영원한 미스터리로 남았다.\n\n뒷좌석 판정: "말 통한 걸로 하자. 그게 더 재밌어."', fx:{moodAll:4}}]},
  {label:'경적을 울린다', out:[{p:1, text:'빵— 고라니가 펄쩍 뛰더니— 오히려 차 쪽으로 두 걸음 왔다.\n\n협상 결렬. 결국 고라니가 흥미를 잃을 때까지 기다렸다 출발했다. 야생의 승리.', fx:{time:10, moodAll:2}}]},
 ]},

/* ── 정경 추가 ── */
{id:'vg_crossing', minParty:1, type:'정경', w:3, title:'철길 건널목',
 text:'차단기가 올라간 채 멈춘 건널목. "열차가 다니지 않습니다" 안내문.\n\n그래도 다들 좌우를 살폈다. 몸에 차 것들은 멸망보다 오래간다.',
 choices:[{label:'…', out:[{p:1, text:'땡땡땡 소리를 누군가 입으로 냈다. 예의상.', fx:{moodAll:1}}]}]},
{id:'vg_rainbow', type:'정경', w:3, title:'무지개',
 text:'비 갠 하늘에 무지개가 떴다. 완전한 반원이다.\n\n끝이 닿은 자리는 대충 다음 마을쯤이다.',
 choices:[{label:'…', out:[{p:1, text:'"무지개 끝엔 보물이 있다던데." "그럼 다음 마을이 보물이네." 그렇게 정해졌다.', fx:{moodAll:2}}]}]},
{id:'vg_firefly_tunnel', type:'정경', w:3, night:true, region:['south','mid'], title:'반딧불 터널',
 text:'가로수 터널 구간에 반딧불이가 가득하다.\n\n헤드라이트를 잠깐 꺼도 될 만큼.',
 choices:[{label:'…', out:[{p:1, text:'속도를 줄이고 라이트를 껐다 켰다. 3초의 반딧불 터널. 전조등보다 밝은 어둠이었다.', fx:{moodAll:2}}]}]},
{id:'vg_onelamp', type:'정경', w:3, night:true, region:['north'], title:'하나만 켜진 가로등',
 text:'죽은 가로등 수백 개 중에 딱 하나가 켜져 있다.\n\n고장인지, 기적인지, 안부인지.',
 choices:[{label:'…', out:[{p:1, text:'그 밑을 지날 때 차 안이 잠깐 주황색으로 물들었다. 아무튼, 불빛은 불빛이다.', fx:{moodAll:1}}]}]},
{id:'vg_fisherman', type:'정경', w:3, title:'저수지의 실루엣',
 text:'저수지 물가에 낚시꾼 실루엣 하나.\n\n찌를 던지는 포물선이 세상에서 제일 한가롭다.',
 choices:[{label:'…', out:[{p:1, text:'"저 사람은 멸망을 알까?" "알겠지. 알아서 저러고 있겠지." 맞는 말 같았다.', fx:{moodAll:1}}]}]},

/* ── 노숙 야영 리스크 (마을 밖에서 잘 때) ── */
{id:'camp_thief', type:'위기', w:0, fixed:true,
 title:'밤손님',
 text:'새벽, 차 밖에서 부스럭거리는 소리.\n\n창틈으로 보니— 그림자 하나가 지붕 짐끈을 풀고 있다. 도둑이다.',
 choices:[
  {label:'소리치며 뛰쳐나간다', out:[
    {p:2, text:'"야!!"\n\n그림자가 화들짝 뛰어 어둠으로 사라졌다. 짐을 점검하니— 고철 몇 개가 사라진 뒤였다. 손이 빨랐다.', fx:{scrap:-4, moodAll:-2}},
    {p:1, text:'"야!!"\n\n도둑이 놀라 훔친 자루를 통째로 떨어뜨리고 도망쳤다. 자루엔 우리 것— 그리고 다른 데서 훔친 것까지 들어 있었다.', fx:{scrap:5, moodAll:2}}]},
  {label:'쇠파이프를 들고 나간다', req:{item:'쇠파이프'}, out:[{p:1, text:'쇠파이프가 달빛에 번쩍이는 것만으로 상황이 종료됐다.\n\n도둑은 훔치려던 것을 내려놓고, 정중히 사과하고(진짜로 꾸벅 인사를 했다), 어둠으로 사라졌다.\n\n"…예의 바른 도둑이네." 다시 잠들긴 글렀다.', fx:{fatigue:8, moodAll:1}}]},
  {label:'숨죽이고 보낸다', out:[{p:1, text:'부스럭 소리가 한참 이어지다 멀어졌다.\n\n아침에 확인하니 지붕의 잡동사니와 식량 약간이 사라졌다. 목숨보다 싼 값이라 치기로 했다.', fx:{scrap:-3, food:-1, moodAll:-3}}]},
 ]},
{id:'camp_dogs', type:'위기', w:0, fixed:true,
 title:'들개들의 밤',
 text:'낮게 으르렁거리는 소리에 잠이 깼다.\n\n들개 대여섯 마리가 차를 둘러싸고 있다. 목표는 명확하다 — 식량 상자.',
 choices:[
  {label:'보리가 나선다', req:{comp:'leo'}, out:[{p:1, text:'보리가 창문에 앞발을 딛고 특유의 하울링을 길게 뽑았다.\n\n들개들이 멈칫— 하더니 대장 개가 짧게 응답하고 무리를 물렸다. 개들의 언어로 뭔가 합의가 이뤄진 모양이다.\n\n보리는 아침까지 우쭐해 있었다.', fx:{moodAll:3, note:{type:'사건',title:'보리의 하울링 외교',body:'들개 무리와 개들의 언어로 합의. 내용은 보리만 안다.'}}}]},
  {label:'식량 하나를 던져준다', req:{food:1}, out:[{p:1, text:'통조림 하나를 멀리 던졌다. 무리가 그쪽으로 몰려간 사이 조용히 창을 닫았다.\n\n아침에 보니 빈 깡통이 차 앞에 가지런히 놓여 있었다. …설마, 반납인가.', fx:{food:-1, moodAll:1}}]},
  {label:'경적과 헤드라이트로 쫓는다', out:[
    {p:2, text:'빵— 상향등!\n\n들개들이 흩어졌다. 대신 그 요란함에 온 동네— 는 없지만, 밤새 뭔가가 근처를 서성이는 기척에 밤새 설잠을 잤다.', fx:{fatigue:10, moodAll:-2}},
    {p:1, text:'들개들은 흩어졌지만 대장 개가 앙심을 품었는지 타이어에 볼일을 보고 갔다. 실질 피해: 자존심.', fx:{moodAll:-1}}]},
 ]},
{id:'camp_scan', type:'위기', w:0, fixed:true, ai:1,
 title:'새벽의 탐조등',
 text:'새벽 3시. 하늘에서 흰 빛기둥이 내려와 들판을 훑는다.\n\n야간 초계 드론의 탐조등. 빛이 차 쪽으로 천천히 다가온다.',
 choices:[
  {label:'불을 끄고 숨죽인다', out:[
    {p:2, text:'모닥불에 흙을 덮고 바닥에 납작 엎드렸다.\n\n빛기둥이 차 지붕을 스윽— 지나갔다. 폐차로 판정한 모양이다. 달구지의 낡음이 처음으로 고마웠다.', fx:{fatigue:8, moodAll:-2}},
    {p:1, text:'빛기둥이 차 위에서 3초간 멈췄다.\n\n<span class="ai">"…차량 1. 열원 다수. 기록."</span>\n\n드론은 그냥 갔지만, 기록이 남았다.', fx:{pursuit:1, moodAll:-3}}]},
  {label:'은수가 위장 신호를 쏜다', req:{comp:'eunsu'}, out:[{p:1, text:'은수가 수신기로 폐기 차량 트랜스폰더 신호를 흉내 냈다.\n\n드론이 차를 "오래전 폐기 처리된 렌터카"로 분류하고 지나갔다.\n\n"우리 이제 서류상 폐차예요." 은수가 하품하며 말했다. 듣던 중 안심되는 소리였다.', fx:{mood:{eunsu:3}}}]},
 ]},
{id:'camp_visitor', type:'조우', w:0, fixed:true,
 title:'모닥불의 손님',
 text:'불가에 인기척. 배낭을 멘 노인이 조심스레 서 있다.\n\n"불 좀 쬐어도 되겠소? 밤길이 생각보다 춥구먼."',
 choices:[
  {label:'자리를 내어준다', out:[
    {p:2, text:'노인은 걸어서 전국을 도는 중이라 했다. 오랫동안.\n\n"차가 있으면 빠르지. 근데 걸으면 다 보여." 노인의 지도엔 우리가 모르는 표시가 가득했다.\n\n떠나기 전, 그중 하나를 우리 지도에 옮겨줬다.', fx:{revealNear:1, moodAll:3, note:{type:'인물',title:'걷는 노인',body:'오랫동안 걸어서 전국을 도는 사람. "걸으면 다 보여."'}}},
    {p:1, text:'노인과 새벽까지 이야기를 나눴다. 대가는 없었고, 필요도 없었다.\n\n아침에 노인은 먼저 떠나며 불씨를 정리해두고 갔다. 좋은 손님이었다.', fx:{moodAll:4, fatigue:6}}]},
  {label:'경계하며 거절한다', out:[{p:1, text:'"…그러시오. 요즘 세상에 당연하지."\n\n노인은 화내지 않고 어둠 속으로 사라졌다. 모닥불이 괜히 머쓱하게 탔다.', fx:{moodAll:-2}}]},
 ]},

/* ═════ 김천 분기 — 한 번 고르면 청주까지 이어지는 두 노선 ═════ */
{id:'route_mid_fork',type:'스토리',w:0,locEvent:'gimcheon',once:true,
 title:'두 길이 갈라지는 곳',scene:'route-mid-fork',
 text:'김천 북쪽 교차로에서 차를 세웠다. 넘어진 표지판 두 장을 씻어 세우니 갈 길이 선명해졌다.\n\n동쪽은 상주와 문경을 지나 청주로 곧장 오르는 능선길. 짧지만 비에 깎인 구간이 많다. 서쪽은 무주와 전주 장터를 거쳐 올라가는 길. 훨씬 멀지만 물과 사람을 만날 곳이 이어진다.\n\n지도 위에서 두 선은 청주에서 다시 만났다. 나는 동쪽 선 옆에 ‘빠름, 험로’, 서쪽 선 옆에 ‘보급, 하루 이상’을 적었다.\n\n달구지 짐칸을 열어 보니 어느 쪽을 고르느냐에 따라 위에 둘 짐도 달라진다. 능선으로 가면 삽과 견인줄, 장터로 가면 빈 물통과 묶음끈이 먼저다.\n\n서울까지 남은 시한은 줄고 있다. 어느 길이든 청주까지는 중간에 바꾸기 어렵다.',
 choices:[
  {label:'동쪽 능선길로 간다',out:[{p:1,text:'표지판에 분필로 동그라미를 쳤다. 상주, 문경, 충주, 청주.\n\n"산길로 간다. 빨리 가되, 길에서 만난 일은 두고 가지 말자."\n\n삽과 견인줄을 짐 맨 위로 옮겼다. 당장 꺼낼 일이 없으면 좋겠지만, 산길에서 그런 바람은 대개 오래가지 않는다.',fx:{routeChoice:'ridge'}}]},
  {label:'서쪽 장터길로 간다',out:[{p:1,text:'무주 쪽 선에 동그라미를 쳤다. 전주와 논산, 대전을 거쳐 청주까지.\n\n"조금 늦더라도 사람 있는 길로 간다. 남산에 가져갈 건 부품만이 아니니까."\n\n빈 물통과 묶음끈을 짐 맨 위로 옮겼다. 장터길에서는 빈자리도 쓸모가 있다.',fx:{routeChoice:'market'}}]}
 ]},

{id:'route_ridge_rescue',type:'구조',w:0,fixed:true,once:true,scene:'route-ridge-rescue',
 title:'능선 아래의 네 사람',
 combat:{phase:1,total:3,step:'멈춰 세우기',
   threat:'비탈에 걸린 우편 수레',objective:'비탈이 다시 움직이기 전에 네 사람을 도로로 올린다',terrain:'젖은 절개지와 무너진 돌망',stakes:'수레가 계곡 쪽으로 밀리면 사람과 약 상자를 함께 잃는다',intent:'젖은 돌망이 한 번 더 내려앉기 전에 사람과 차의 무게를 고정해야 한다',counters:{'고정':'달구지를 닻으로 쓴다','지휘':'하중을 사람별로 나눈다'}},
 text:'상주를 벗어난 능선에서 손을 흔드는 아이가 보였다. 도로 아래로 작은 수레가 반쯤 굴러 떨어져 있다. 어른 셋과 아이 하나가 돌망 사이에 매달린 채 움직이지 못한다.\n\n"다친 사람 있어요?"\n\n아래에서 여자가 고개를 들었다. "발목 하나요. 그런데 이 비탈, 아까부터 계속 내려앉아요."\n\n차를 산 쪽 바위에 바짝 붙였다. 달구지의 무게를 닻으로 쓸 수는 있다. 문제는 비탈이 얼마나 더 버티느냐다.\n\n총을 꺼낼 상대는 없다. 대신 비탈이 조금씩 우리 시간을 가져가고 있다.',
 choices:[
  {label:'달구지를 바위 뒤에 걸고 견인줄을 내린다',tactic:'고정',prep:1,terrainFit:2,out:[{p:1,text:'차를 바위 안쪽에 비스듬히 세우고 바퀴마다 돌을 괴었다. 견인줄을 당기자 차체가 한 번 울었지만 버텼다.\n\n"한 번에 한 사람. 줄 놓치면 안 돼."\n\n아이부터 줄에 매달렸다.',fx:{time:15,combatStart:{id:'ridge_rescue',kind:'구조',threat:'비탈에 걸린 우편 수레',terrain:'젖은 절개지와 무너진 돌망',objective:'네 사람을 도로로 올린다',stakes:'비탈이 다시 움직이기 전에 끝내야 한다',pressure:1},combatEdge:2,chain:'route_ridge_anchor'},sfx:'metal'}]},
  {label:'도로 위 사람들과 먼저 역할을 나눈다',tactic:'지휘',prep:1,terrainFit:1,out:[{p:1,text:'삽을 들 사람, 줄을 잡을 사람, 올라온 사람을 받을 자리를 빠르게 정했다.\n\n"아이부터. 다친 분은 마지막 말고 세 번째. 수레는 사람 뒤."\n\n서로 이름도 모르지만, 적어도 누가 무엇을 하는지는 알게 됐다.',fx:{time:10,combatStart:{id:'ridge_rescue',kind:'구조',threat:'비탈에 걸린 우편 수레',terrain:'젖은 절개지와 무너진 돌망',objective:'네 사람을 도로로 올린다',stakes:'비탈이 다시 움직이기 전에 끝내야 한다',pressure:1},combatEdge:1,combatPressure:-1,chain:'route_ridge_anchor'},sfx:'cover'}]}
 ]},
{id:'route_ridge_anchor',type:'구조',w:0,fixed:true,once:true,scene:'route-ridge-rescue',
 title:'줄 하나에 걸린 무게',
 combat:{phase:2,total:3,step:'길 만들기',
   threat:'비탈에 걸린 우편 수레',objective:'사람이 오를 발판을 만들고 줄의 하중을 나눈다',terrain:'젖은 절개지와 무너진 돌망',stakes:'한 곳에 무게가 몰리면 흙이 다시 무너진다',intent:'당기는 힘이 한곳에 몰리면 발판부터 무너진다',counters:{'토공':'디딜 곳을 늘린다','장비':'하중을 두 줄로 나눈다'}},
 text:'아이와 첫 번째 어른이 도로로 올라왔다. 세 번째 사람을 당기려는 순간, 발밑 돌망이 손바닥만큼 내려앉았다.\n\n아래의 남자가 소리쳤다. "잠깐! 지금 당기면 여기 다 같이 내려가요."\n\n줄을 조금 풀어 하중을 뺐다. 차는 버티는데 땅이 못 버틴다. 힘보다 사람이 디딜 길부터 만들어야 한다.\n\n수레 안에는 문경으로 가는 편지와 해열제가 섞여 있다. 하지만 먼저 올라와야 할 것은 사람이다.',
 choices:[
  {label:'삽으로 하중을 나눌 계단을 판다',tactic:'토공',terrainFit:2,combatRoll:.62,out:[
    {p:1,text:'한 사람이 설 너비만큼 흙을 걷고 돌을 눌러 박았다. 빠른 길은 아니지만, 발을 옮길 때마다 다음 사람이 설 곳이 생겼다.',fx:{time:25,fatigue:3,combatEdge:1,combatPressure:-1,combatRead:{label:'사람 줄과 짐 줄을 나눌 발판',tactics:['분리 인양','릴레이']},chain:'route_ridge_extract'},sfx:'cover'},
    {p:1,text:'세 번째 계단을 파는 순간 흙이 통째로 밀려 내려갔다. 방금 만든 발판이 아래 사람 어깨 위로 쏟아졌다.\n\n아래에서 괜찮다는 소리가 올라왔지만 괜찮은 목소리가 아니었다.\n\n다시 팠다. 이번엔 더 얕게, 더 느리게.',fx:{time:45,fatigue:8,combatPressure:2,combatRead:{label:'무너진 자리라 발 디딜 곳을 못 믿는다',tactics:['토공']},chain:'route_ridge_extract'},sfx:'impact'}]},
  {label:'견인줄을 두 갈래로 묶어 흔들림을 잡는다',tactic:'장비',terrainFit:2,combatRoll:.6,out:[
    {p:1,text:'주줄은 달구지에, 보조줄은 가드레일 기둥에 걸었다. 한 줄이 흔들릴 때 다른 줄이 몸을 잡았다.\n\n"이제 한 발씩. 뛰지 말고."',fx:{time:15,scrap:-1,combatEdge:1,combatRead:{label:'한 줄이 흔들릴 때 받쳐 줄 보조 하중',tactics:['분리 인양','릴레이']},chain:'route_ridge_extract'},sfx:'metal'},
    {p:1,text:'가드레일 기둥이 생각보다 삭아 있었다. 보조줄을 당기자 기둥이 뿌리째 기울었다.\n\n급히 주줄 하나로 되돌렸다. 하중이 한 곳에 몰린 채로 가야 한다는 뜻이다.\n\n"한 명씩. 절대 두 명 같이 오르지 마세요."',fx:{time:30,scrap:-2,combatPressure:2,combatRead:{label:'줄이 하나뿐이라 한 번에 한 사람',tactics:['릴레이']},chain:'route_ridge_extract'},sfx:'metal'}]},
  {label:'다친 사람을 업고 짧게 치고 오른다',tactic:'완력',risk:'비탈 압박 상승',combatRoll:.5,out:[
    {p:1,text:'다친 사람을 등에 묶고 가장 짧은 선을 골랐다. 절반은 힘으로, 나머지는 위에서 당기는 줄로 올렸다. 빠르지만 땅이 한 번 더 울었다.',fx:{time:10,fatigue:6,combatPressure:1,chain:'route_ridge_extract'},sfx:'engine'},
    {p:1,text:'절반쯤 올라갔을 때 발밑이 꺼졌다. 업힌 사람과 함께 미끄러져 원래 자리보다 아래로 떨어졌다.\n\n다친 발목이 한 번 더 접혔다. 비명은 짧았고, 그래서 더 아파 보였다.\n\n미안하다는 말과 다시 하자는 말이 거의 동시에 나왔다. 둘 다 숨이 찼다.',fx:{time:35,fatigue:12,combatPressure:2,combatEdge:-1,injury:{who:'driver',label:'허리 삠',days:2},chain:'route_ridge_extract'},sfx:'impact'}]}
 ]},
{id:'route_ridge_extract',type:'구조',w:0,fixed:true,once:true,scene:'route-ridge-rescue',
 title:'마지막 한 번',
 combat:{phase:3,total:3,step:'꺼내기',
   threat:'비탈에 걸린 우편 수레',objective:'마지막 사람과 약 상자를 함께 도로로 올린다',terrain:'젖은 절개지와 무너진 돌망',stakes:'흙이 움직이기 시작했다. 한 번에 끝내야 한다',intent:'큰 자갈이 굴러오기 전에 사람과 약 상자의 하중을 한 번에 나눠야 한다',counters:{'분리 인양':'두 줄을 반 박자 나눠 당긴다','릴레이':'사람과 내용물만 가볍게 옮긴다'}},
 text:'사람 셋은 올라왔다. 아래에는 발목을 다친 여자와 수레가 남았다. 그때 비탈 위쪽에서 자갈이 한꺼번에 굴러내렸다.\n\n여자가 약 상자를 수레 밖으로 밀며 말했다. "이건 두고 저만 올리세요."\n\n"사람 먼저인 건 맞아요." 내가 줄을 다시 잡았다. "그래도 둘 다 올릴 방법부터 해봅시다."\n\n한 번 당길 시간은 남아 있다.',
 choices:[
  {label:'사람 줄과 수레 줄을 따로 당긴다',tactic:'분리 인양',terrainFit:2,combatRoll:.58,out:[
    {p:1,text:'구호를 셋에 맞췄다. 사람 줄이 먼저 팽팽해지고, 반 박자 뒤 수레가 돌턱을 넘었다. 여자의 손이 도로 가장자리를 잡자 모두가 그대로 뒤로 넘어졌다.\n\n네 사람이 전부 올라왔다. 해열제 상자도 젖었지만 멀쩡했다. 아이가 달구지 문을 두드렸다. "이 차, 집인데 힘도 세네요."',fx:{time:20,moodAll:4,combatEnd:1,combatResult:'success',flag:'route_ridge_saved',note:{type:'사건',title:'능선 아래 네 사람',body:'달구지를 닻으로 삼아 네 사람과 문경행 해열제를 함께 올렸다.',links:['달구지']}}},
    {p:1,text:'사람은 도로 위로 올라왔지만 수레 바퀴 하나가 돌망에 걸렸다. 줄을 놓는 순간 수레 절반이 아래로 쏟아졌다. 편지는 건졌고 해열제는 반만 남았다.\n\n여자가 숨을 고르며 말했다. "사람 넷이 올라왔잖아요. 나머지는 다시 구하면 돼요."',fx:{time:25,moodAll:2,combatEnd:1,combatResult:'partial',flag:'route_ridge_saved_partial',note:{type:'사건',title:'능선 아래 네 사람',body:'네 사람은 모두 구했다. 약 상자는 절반만 건졌지만, 우선순위는 끝까지 바뀌지 않았다.',links:['달구지']}}},
    {p:1,text:'두 줄을 당기는 박자가 어긋났다. 수레가 먼저 미끄러지며 여자의 줄을 쳤다.\n\n여자는 올라왔다 — 발목이 아니라 무릎까지 다친 채로. 수레와 해열제는 계곡 아래에서 소리를 멈췄다.\n\n"저 약, 문경 아이들 몫이었는데." 여자는 우리 잘못이 아니라고 두 번 말했다. 두 번 말해야 하는 말은 대개 잘못이 어딘가에는 있다는 뜻이다.',fx:{time:35,moodAll:-5,fatigue:6,combatEnd:1,combatResult:'failure',flag:'route_ridge_failed',note:{type:'사건',title:'계곡에 남은 약 상자',body:'네 사람은 구했지만 문경행 해열제를 전부 잃었고 부상자의 상태가 나빠졌다. 문경에서 이 이야기를 다시 듣게 될 것이다.',links:['달구지']}}}]},
  {label:'수레를 비우고 사람과 약만 릴레이로 올린다',tactic:'릴레이',terrainFit:2,combatRoll:.64,out:[
    {p:1,text:'편지 다발을 품에 나눠 안고, 약 상자는 줄에 묶었다. 빈 수레는 내려두고 사람과 내용물만 차례로 올렸다. 마지막 여자가 도로에 닿자 비탈이 크게 흘러내렸다.\n\n수레는 잃었지만 사람 넷과 배달할 것은 모두 남았다.',fx:{time:30,fatigue:3,moodAll:4,combatEnd:1,combatResult:'success',flag:'route_ridge_saved'}},
    {p:1,text:'사람 넷과 편지는 모두 올렸다. 약 상자 하나가 진흙에 빠졌지만 더 내려갈 수는 없었다.\n\n"괜찮아요. 문경에서 나눠 쓰면 돼요." 여자가 남은 상자를 꼭 안았다.',fx:{time:35,fatigue:4,moodAll:2,combatEnd:1,combatResult:'partial',flag:'route_ridge_saved_partial'}},
    {p:1,text:'릴레이 중간에 비탈이 크게 내려앉았다. 마지막 여자를 끌어올리는 데는 성공했지만, 줄을 잡던 내 손바닥이 길게 찢어졌고 약 상자는 전부 흙더미에 묻혔다.\n\n"사람은 다 살았어요." 여자가 말했다. 맞는 말이었다. 그런데 문경 쪽 하늘을 보는 그녀의 눈은 다른 계산을 하고 있었다.',fx:{time:40,fatigue:8,moodAll:-5,injury:{who:'driver',label:'손바닥 열상',days:2},combatEnd:1,combatResult:'failure',flag:'route_ridge_failed',note:{type:'사건',title:'묻힌 약 상자',body:'전원 구조에는 성공했지만 해열제를 전부 잃었다. 문경의 겨울이 조금 더 길어졌다.',links:['달구지']}}}]}
 ]},

{id:'route_market_convoy',type:'호송',w:0,fixed:true,once:true,scene:'route-market-convoy',
 title:'장터에서 묶인 다섯 수레',
 combat:{phase:1,total:3,step:'행렬 세우기',
   threat:'잠든 자동 검문소',objective:'씨앗과 약을 실은 다섯 수레를 기록 없이 통과시킨다',terrain:'좁은 국도와 폐차 차양, 고장 난 차단봉',stakes:'센서가 행렬을 깨우면 장터 사람들의 이동 기록이 중앙망에 남는다',intent:'센서는 따로 움직이는 사람 수를 세어 재검사를 깨운다',counters:{'편성':'다섯 수레를 한 차량으로 묶는다','정찰':'센서가 외면하는 박자를 찾는다'}},
 text:'무주 장터를 지나려는데 손수레 다섯 대가 같은 자리에 묶여 있었다. 씨앗, 소금, 붕대, 편지. 북쪽 마을 셋이 함께 보낸 짐이다.\n\n앞사람이 꺼진 검문소를 가리켰다. "차 한 대는 지나가요. 사람이 줄지어 가면 센서가 켜져요."\n\n차단봉 아래 작은 불 하나가 일정하게 깜빡인다. 전광판은 죽었어도 사람을 세는 장치는 아직 살아 있다.\n\n"달구지 한 대처럼 보이게 만들면 돼요." 내가 수레 사이를 재며 말했다. "사람을 숨기는 게 아니라, 한 행렬로 묶는 거죠."',
 choices:[
  {label:'수레를 달구지 뒤에 한 줄로 묶는다',tactic:'편성',prep:1,terrainFit:2,out:[{p:1,text:'긴 밧줄 하나에 수레 다섯 대를 간격 맞춰 묶었다. 각 수레에는 브레이크를 잡을 사람이 한 명씩 붙었다.\n\n"우리가 멈추면 다 멈추고, 우리가 가면 한 박자 뒤에 갑니다."\n\n제각각이던 짐이 하나의 긴 차량처럼 보이기 시작했다.',fx:{time:20,combatStart:{id:'market_convoy',kind:'호송',threat:'잠든 자동 검문소',terrain:'좁은 국도와 폐차 차양, 고장 난 차단봉',objective:'다섯 수레를 기록 없이 통과시킨다',stakes:'행렬이 끊기면 센서가 사람 수를 센다',pressure:1},combatEdge:1,chain:'route_market_mask'},sfx:'metal'}]},
  {label:'폐차 차양 아래에서 통과 순서를 맞춘다',tactic:'정찰',prep:1,terrainFit:2,out:[{p:1,text:'센서가 꺼지는 간격을 세 번 재었다. 열두 초마다 렌즈가 반대 차선을 본다.\n\n"첫 수레가 저 금을 넘을 때 마지막 수레가 출발하면 돼요."\n\n사람들이 자기 차례를 입으로 되뇌었다.',fx:{time:15,combatStart:{id:'market_convoy',kind:'호송',threat:'잠든 자동 검문소',terrain:'좁은 국도와 폐차 차양, 고장 난 차단봉',objective:'다섯 수레를 기록 없이 통과시킨다',stakes:'행렬이 끊기면 센서가 사람 수를 센다',pressure:1},combatPressure:-1,chain:'route_market_mask'},sfx:'cover'}]}
 ]},
{id:'route_market_mask',type:'호송',w:0,fixed:true,once:true,scene:'route-market-convoy',
 title:'한 대처럼 보이기',
 combat:{phase:2,total:3,step:'센서 속이기',
   threat:'잠든 자동 검문소',objective:'행렬 전체를 달구지의 적재물로 인식시킨다',terrain:'좁은 국도와 폐차 차양, 고장 난 차단봉',stakes:'사람 한 명이라도 따로 잡히면 전원 재검사가 시작된다',intent:'센서가 바퀴와 사람 윤곽을 따로 세기 시작한다',counters:{'위장':'긴 차량 윤곽을 만든다','지휘':'모두 같은 박자로 움직인다'}},
 text:'행렬이 검문선 앞에 섰다. 전광판은 죽어 있는데, 센서만 천천히 좌우로 움직였다.\n\n세 번째 수레의 아이가 물었다. "뛰면 더 빨리 지나갈 수 있죠?"\n\n"아니. 오늘은 안 뛰는 게 제일 빨라."\n\n달구지 천막을 길게 풀어 뒤 수레까지 덮자, 서로 다른 다섯 짐이 한 몸처럼 이어졌다.',
 choices:[
  {label:'천막과 반사판으로 차량 윤곽을 잇는다',tactic:'위장',terrainFit:2,combatRoll:.6,out:[
    {p:1,text:'천막 끝에 낡은 반사판을 달았다. 센서가 훑을 때마다 빛은 달구지 뒤쪽까지 한 줄로 이어졌다. 화면에 「장축 화물차」라는 오래된 분류가 잠깐 떴다.',fx:{time:20,scrap:-1,combatEdge:1,combatRead:{label:'센서가 한 차량으로 보는 긴 윤곽',tactics:['차체 지지','인력 릴레이']},chain:'route_market_pass'},sfx:'cover'},
    {p:1,text:'바람이 천막을 들췄다. 이어 놓은 윤곽이 가운데서 끊겼다.\n\n화면 분류가 「장축 화물차」에서 「다중 개체」로 바뀌었다가, 돌아왔다가, 또 바뀌었다.\n\n"저거 계속 헷갈리는 중이에요." 아이가 속삭였다. 헷갈리는 기계는 대개 사람을 부른다.',fx:{time:35,scrap:-2,combatPressure:2,combatRead:{label:'윤곽이 끊겨 센서가 개체 수를 다시 센다',tactics:['위장']},chain:'route_market_pass'},sfx:'warning'}]},
  {label:'각 수레의 움직임을 손신호로 맞춘다',tactic:'지휘',terrainFit:1,combatRoll:.58,out:[
    {p:1,text:'운전석 거울로 뒤를 보며 손을 들었다 내렸다. 다섯 명이 같은 순간에 밀고, 같은 순간에 멈췄다. 센서가 사람을 세지 못하고 바퀴만 셌다.',fx:{time:15,combatEdge:1,combatRead:{label:'센서가 놓치는 한 박자의 정지',tactics:['차체 지지','인력 릴레이']},chain:'route_market_pass'},sfx:'silence'},
    {p:1,text:'세 번째 수레가 반 박자 늦었다. 한 명이 늦으면 뒤가 전부 늦는다.\n\n행렬이 아코디언처럼 늘어졌다 줄었다 했다. 센서 불빛이 그 리듬을 따라 좌우로 흔들렸다.\n\n"제가 늦었어요." 늙은 목소리가 작게 말했다. 아무도 대꾸하지 않은 건 탓하지 않으려고였다.',fx:{time:30,combatPressure:2,combatRead:{label:'행렬 간격이 들쭉날쭉해 한 박자를 못 만든다',tactics:['지휘']},chain:'route_market_pass'},sfx:'warning'}]},
  {label:'달구지 발전기로 센서 주기를 흐트러뜨린다',tactic:'교란',noise:1,risk:'관측 신호가 남을 수 있다',combatRoll:.55,out:[
    {p:1,text:'발전기 회전을 올렸다 내리자 센서 화면에 가는 줄이 번졌다. 완전히 꺼지지는 않았지만, 사람 윤곽이 겹쳐 보였다.',fx:{fuel:-1,combatPressure:1,chain:'route_market_pass'},sfx:'engine'},
    {p:1,text:'회전을 너무 올렸다. 발전기 소리가 국도 전체에 퍼졌고, 센서는 오히려 또렷해졌다.\n\n화면 구석에 작은 글자가 떴다. 「전자 간섭 감지 · 기록」\n\n장터 대표가 조용히 말했다. "저건 지워지는 기록이 아니오."',fx:{fuel:-2,combatPressure:2,pursuit:1,chain:'route_market_pass'},sfx:'warning'}]}
 ]},
{id:'route_market_pass',type:'호송',w:0,fixed:true,once:true,scene:'route-market-convoy',
 title:'차단봉 아래를 지나는 법',
 combat:{phase:3,total:3,step:'통과시키기',
   threat:'잠든 자동 검문소',objective:'행렬을 끊지 않고 차단봉 아래로 빼낸다',terrain:'좁은 국도와 폐차 차양, 고장 난 차단봉',stakes:'마지막 수레가 걸리면 앞사람도 돌아와야 한다',intent:'노란 센서가 재검사로 바뀌기 전에 걸린 셋째 수레를 빼내야 한다',counters:{'차체 지지':'봉을 들어 행렬을 그대로 민다','인력 릴레이':'짐 높이를 낮춰 흐름을 잇는다'}},
 text:'달구지 앞바퀴가 검문선을 넘었다. 차단봉은 반쯤 열린 채 떨리고 있다. 첫 수레는 지났고, 셋째 수레가 낮은 봉 아래에서 짐에 걸렸다.\n\n뒤에서 누가 말했다. "짐을 버리면 사람은 지나가요."\n\n장터 대표가 고개를 저었다. "저 씨앗이 다음 봄이오. 사람도 짐도 같이 건너야 장터가 이어져."\n\n센서 불이 노란색으로 바뀌었다. 이제 오래 멈출 수 없다.',
 choices:[
  {label:'달구지로 봉을 받치고 수레를 밀어낸다',tactic:'차체 지지',terrainFit:2,combatRoll:.58,out:[
    {p:1,text:'달구지 지붕 가드를 봉 아래에 밀어 넣었다. 차체가 끼익 울었지만 봉이 손 한 뼘 올라갔다. 다섯 수레가 하나씩 빠져나왔다.\n\n마지막 사람이 넘어오자 센서가 다시 초록으로 돌아갔다. 이름 하나 남기지 않고, 봄에 심을 씨앗은 전부 건넜다.',fx:{time:20,van:-2,food:2,water:2,moodAll:4,combatEnd:1,combatResult:'success',flag:'route_market_escorted',note:{type:'사건',title:'다섯 수레의 장터길',body:'달구지를 지지대로 써 사람과 씨앗, 약을 모두 기록 없이 통과시켰다.',links:['달구지']}}},
    {p:1,text:'사람과 수레는 모두 건넜지만 봉이 떨어지며 소금 자루 하나가 터졌다. 길 위의 소금을 주워 담을 시간은 없었다.\n\n"씨앗하고 약은 남았소." 대표가 말했다. "그거면 장터는 다시 열 수 있지."',fx:{time:25,van:-4,food:1,moodAll:2,combatEnd:1,combatResult:'partial',flag:'route_market_escorted_partial'}},
    {p:1,text:'차체가 봉의 무게를 놓쳤다. 차단봉이 셋째 수레 위로 떨어지며 센서가 빨간불로 바뀌었다.\n\n<span class="ai">"이동 인원 재검사. 기록을 시작합니다."</span>\n\n사람들은 수레를 버리고 흩어져 건넜다. 씨앗 두 자루가 검문선 안쪽에 남았고, 장터 사람 다섯의 윤곽이 어딘가의 기록에 남았다.\n\n대표는 아무도 탓하지 않았다. 그게 더 아팠다.',fx:{time:30,van:-6,moodAll:-5,pursuit:1,combatEnd:1,combatResult:'failure',flag:'route_market_failed',note:{type:'사건',title:'기록에 남은 행렬',body:'차단봉이 떨어져 씨앗 두 자루를 잃었고 장터 사람들의 이동 기록이 중앙망에 남았다. 다음 장이 열릴지는 아무도 장담하지 못했다.',links:['천리안']}}}]},
  {label:'짐 높이를 낮추고 전원이 손으로 넘긴다',tactic:'인력 릴레이',terrainFit:2,combatRoll:.64,out:[
    {p:1,text:'씨앗 자루와 약 상자를 봉 너머 손에서 손으로 옮겼다. 빈 수레를 눕혀 밀고, 건너편에서 다시 실었다.\n\n센서가 깨어났을 때는 마지막 편지 다발까지 달구지 안에 들어온 뒤였다. 장터 사람들의 이름은 어디에도 남지 않았다.',fx:{time:35,fatigue:4,food:2,water:2,moodAll:4,combatEnd:1,combatResult:'success',flag:'route_market_escorted'}},
    {p:1,text:'사람과 약, 씨앗은 모두 넘겼다. 수레 하나의 축이 꺾여 남은 짐은 달구지 지붕에 나눠 실었다.\n\n행렬은 짧아졌지만 끊기지는 않았다.',fx:{time:40,fatigue:5,food:1,moodAll:2,combatEnd:1,combatResult:'partial',flag:'route_market_escorted_partial'}},
    {p:1,text:'릴레이 중간에 센서가 깨어났다. 손에서 손으로 넘어가던 사람의 줄이 끊기며, 마지막 두 명이 검문선 안쪽에 갇혔다.\n\n두 사람이 반대편 배수로로 빠져나오는 데 한 시간이 걸렸다. 씨앗 한 자루는 못 갖고 나왔고, 센서는 그동안 내내 켜져 있었다.\n\n"장터는 다시 열 거요." 대표의 목소리는 확신보다 고집에 가까웠다.',fx:{time:70,fatigue:8,moodAll:-5,pursuit:1,combatEnd:1,combatResult:'failure',flag:'route_market_failed',note:{type:'사건',title:'끊긴 릴레이',body:'센서가 깨어나 두 사람이 갇혔다 빠져나왔다. 씨앗 한 자루와 한 시간, 그리고 기록이 남았다.',links:['천리안']}}}]}
 ]},

{id:'settlement_road_echo',type:'여파',w:0,fixed:true,scene:'settlement-road-echo',
 title:'우리보다 먼저 간 것',
 text:()=>D.roadEchoCopy(S,'text'),
 choices:[
  {label:'차를 세우고 마지막 구간을 함께 정리한다',out:[{p:1,text:()=>D.roadEchoCopy(S,'outcome')+'\n\n우리는 잠깐 늦어졌지만, 그 길을 쓰는 사람은 한 팀 더 늘었다.',fx:{impactEcho:'assist'}}]},
  {label:'무전과 지도로 다음 구간만 이어 준다',out:[{p:1,text:()=>D.roadEchoCopy(S,'outcome')+'\n\n달구지는 먼저 움직였고, 뒤의 수레는 우리가 알려 준 표식을 따라왔다.',fx:{impactEcho:'relay'}}]},
  {label:'남은 시한을 지키며 그대로 간다',out:[{p:1,text:()=>D.roadEchoCopy(S,'outcome')+'\n\n지금은 서울로 가야 한다. 다만 백미러에서 그 행렬이 사라질 때까지 속도를 조금 늦췄다.',fx:{impactEcho:'pass'}}]}
 ]},

/* ═════ 위수 구역 — 초계와 무기 ═════ */

{id:'perimeter_first', type:'스토리', w:0, fixed:true, ai:1,
 title:'위수 구역',
 scene:'combat-perimeter-warning', sfx:'warning',
 text:'도로 한복판에— 그것이 서 있다.\n\n4족 보행기. 소만 한 크기. 도색은 관공서 회색. 몸통의 렌즈가 차를 향해 조리개를 조인다.\n\n<span class="ai">"정지. 위수 구역입니다."</span>\n\n차를 훑는 초록 스캔선. 그리고—\n\n탕. 경고사격이 차 옆 아스팔트를 때렸다. 기계가 처음으로, 우리에게 무기를 겨눴다.\n\n<span class="ai">"등록되지 않은 차량. 다음 확인 시 회차를 강제합니다. 좋은 하루 되세요."</span>\n\n보행기는 유유히 갓길로 물러나 도로를 열어줬다.',
 choices:[
  {label:'…지나간다', out:[{p:1, text:'한동안 더 간 뒤에야 생각이 문장으로 굳었다.\n\n남쪽은 그것의 \'바깥\'이었다. 여긴 \'안\'이다.\n\n다음 정차에서 뒤 칸의 고철과 공구를 꺼내 작은 작업대를 폈다. 맨손으로 다닐 땅이 아니었다.\n\n그날부터 달구지 뒤 칸은 대장간이 됐다.', fx:{van:-6, flag:'armed_age', pursuit:1, note:{type:'사건',title:'첫 경고사격',body:'위수 구역. 기계가 처음으로 우리에게 무기를 겨눴다. 그날부터 차 뒤 칸은 대장간이 됐다.',links:['천리안']}}}]},
 ]},

{id:'patrol_walker', minParty:1, type:'추적', w:10, region:['north'], needFlag:'armed_age',
 title:'초계 보행기', scene:'combat-perimeter-warning',
 combat:{phase:1,total:3,step:'정찰',
   threat:'4족 초계 보행기',terrain:'폐차 행렬과 콘크리트 분리대',pressure:1,
   objective:'렌즈가 돌아오기 전에 자리를 잡는다',stakes:'경보가 북쪽 검문망으로 넘어간다',intent:'몸통 렌즈가 정면 차선을 훑은 뒤 왼쪽 폐차 행렬로 돌아온다',counters:{'엄폐':'폐차로 시야를 끊는다','유인':'스캔 방향을 옆 차선에 묶는다'}}, sfx:'scan',
 text:'언덕 너머에서 회색 몸통이 먼저 보였다. 네 다리는 아직 경사 아래에 있다.\n\n강우가 없어도 이제 저 발소리는 안다. 한 걸음, 멈춤, 좌우 스캔. 다시 한 걸음.\n\n렌즈가 이쪽으로 돌아오기까지 서른 초쯤.',
 choices:[
  {label:'폐차 행렬 뒤로 달구지를 붙인다', tactic:'엄폐', prep:1, out:[{p:1, text:'시동을 죽이고 녹슨 화물차 그림자에 바짝 붙였다.\n\n보행기의 렌즈가 도로를 훑었다. 아직은 우리 앞쪽만 본다. 먼저 볼 수 있는 쪽이 조금 유리하다.', fx:{time:5,combatStart:{id:'walker',threat:'4족 초계 보행기',terrain:'폐차 행렬과 콘크리트 분리대',objective:'렌즈와 관절을 읽고 전원을 안전하게 회수한다',stakes:'경보가 북쪽 검문망으로 넘어간다',pressure:1},combatEdge:1,combatPressure:-1,chain:'combat_walker_read'}, sfx:'cover'}]},
  {label:'달구지로 시선을 끌고 옆 차선에 세운다', tactic:'유인', prep:1, risk:'차체가 노출된다', out:[{p:1, text:'헤드라이트를 한 번 켰다 껐다. 렌즈가 즉시 달구지를 물었다.\n\n차를 콘크리트 분리대 옆으로 밀어 세웠다. 숨을 곳은 줄었지만, 놈이 어디를 보는지는 이제 완전히 분명해졌다.', fx:{van:-2,combatStart:{id:'walker',threat:'4족 초계 보행기',terrain:'폐차 행렬과 콘크리트 분리대',objective:'렌즈와 관절을 읽고 전원을 안전하게 회수한다',stakes:'경보가 북쪽 검문망으로 넘어간다',pressure:1},combatEdge:2,combatPressure:1,chain:'combat_walker_read'}, sfx:'engine'}]},
  {label:'농로로 빠져 교전을 버린다', tactic:'이탈', prep:1, out:[{p:1, text:'후진으로 갈림길까지 빠져나온 뒤 농로로 차를 꺾었다.\n\n백미러 속에서 보행기가 몸통을 돌렸다. 도망치는 것은 서 있는 것보다 잘 보인다. 렌즈가 우리 뒤꽁무니를 오래 따라왔다.\n\n멀리 돌아가면 된다. 다만 이 길에 우리가 있었다는 건 어딘가에 적혔다.', fx:{time:35,fuel:-3,moodAll:-3,pursuit:1,combatEnd:1,note:{type:'사건',title:'등을 보인 자리',body:'보행기를 피해 농로로 빠졌다. 후퇴하는 차는 서 있는 차보다 잘 읽힌다.',links:['천리안']}}, sfx:'escape'}]},
 ]},

{id:'combat_walker_read', type:'추적', w:0, fixed:true, ai:1,
 title:'발을 읽는 시간', scene:'combat-walker-disable',
 combat:{phase:2,total:3,step:'대응',difficulty:-1,baseChance:0.56,
   threat:'4족 초계 보행기',terrain:'폐차 사이 관절 사각',
  objective:'한 번뿐인 공격 각도를 만든다',stakes:'서두르면 총구가 먼저 돌아온다',intent:'세 번째 걸음 뒤 몸통이 내려가며 오른쪽 앞다리 하중이 비어진다',counters:{'관찰':'보폭의 빈 박자를 확인한다','정비':'유압관의 전도 방향을 읽는다','사격':'관절 사각을 먼저 잡는다'}}, sfx:'walker',
 text:'쿵. 왼발. 잠깐 멈춤. 쿵. 오른발.\n\n놈은 빠르지 않다. 대신 몸통 렌즈와 다리 센서가 서로의 빈틈을 메운다. 아무 데나 치면 경보만 울릴 것이다.\n\n"서두르지 마." 누군가 아주 작게 말했다. 이번엔 그 말이 맞다.',
 choices:[
  {label:'발을 내딛는 박자를 끝까지 센다', combatRoll:.64, tactic:'관찰', out:[
    {p:1, text:'세 번째 걸음마다 오른쪽 앞다리에 체중이 몰린다. 그때 몸통이 아주 조금 아래로 처진다.\n\n짧지만, 사람 하나가 움직일 만큼은 되는 틈이다.', fx:{time:4,combatEdge:1,combatPressure:-1,combatRead:{label:'세 번째 걸음 뒤 몸통이 처지는 순간',tactics:['사격','교란']},chain:'combat_walker_strike'}, sfx:'heartbeat'},
    {p:1, text:'마침 그 순간이 지나간 뒤였다. 보행기는 우리 쪽을 더 오래 바라봤고, 경보음이 먼저 들렸다.\n\n틈을 얻지 못해, 다음 단계가 빠르게 올라온다.', fx:{combatEdge:-2,combatPressure:2,combatRead:{label:'두 번째 박자 뒤 읽기가 늦어짐',tactics:['관찰']},chain:'combat_walker_strike'}, sfx:'warning'}]},
  {label:'민지가 유압관의 흔들림을 찾는다', combatRoll:.67, tactic:'정비', req:{healthyComp:'minji'}, out:[
    {p:1, text:'민지는 무릎 대신 다리 안쪽의 가느다란 관을 가리켰다.\n\n"저기 끊으면 서는 게 아니라 주저앉아요. 넘어지는 방향만 조심해요."\n\n우리는 놈이 쓰러질 자리를 먼저 비웠다.', fx:{combatEdge:2,combatRead:{label:'유압관이 접히며 오른쪽으로 주저앉는 방향',tactics:['사격','교란']},chain:'combat_walker_strike',mood:{minji:2}}, sfx:'tool'},
    {p:1, text:'민지가 흔들림 포인트를 짚기 전, 보행기가 고개를 완전히 틀었다.\n\n정비가 늦어지며 사거리가 더 짧아졌고 경보가 더 빨라졌다.', fx:{combatEdge:-2,combatPressure:2,combatRead:{label:'시점이 늦어져 준비 동작이 길어짐',tactics:['정비']},chain:'combat_walker_strike',mood:{minji:1}}, sfx:'tool'}]},
  {label:'강우가 관절 사각을 짚는다', combatRoll:.6, tactic:'사격', req:{healthyComp:'kangwoo'}, out:[
    {p:1, text:'강우의 손가락이 오른쪽 앞다리, 몸통 렌즈, 다시 오른쪽 앞다리를 찍었다.\n\n"한 발로 세우고, 다음에 움직여. 두 번째 발을 미리 쓰지 마."\n\n말수가 짧아질수록 그가 확실하다는 뜻이었다.', fx:{combatEdge:2,combatRead:{label:'오른쪽 앞다리 관절이 완전히 드러나는 한 박자',tactics:['사격']},chain:'combat_walker_strike',mood:{kangwoo:2}}, sfx:'bolt'},
    {p:1, text:'사격이 늦었다. 관절이 잠깐 열렸다가 닫히고, 렌즈가 더 오랫동안 우리 쪽으로 고정됐다.\n\n빚진 틈은 줄었다. 더 빨리 마저 움직여야 한다.', fx:{combatEdge:-2,combatPressure:2,combatRead:{label:'사격 타이밍을 하나 놓침',tactics:['사격']},chain:'combat_walker_strike'}, sfx:'bolt'}]},
  {label:'더 다가오기 전에 끝낸다', combatRoll:.44, tactic:'돌입', risk:'각도가 나쁘다', out:[
    {p:1, text:'생각할 시간을 끊고 먼저 몸을 일으켰다.\n\n보행기의 렌즈가 소리 난 쪽으로 돌아왔다. 이제부터는 속도로 메워야 한다.', fx:{combatEdge:-2,combatPressure:2,combatRead:{label:'돌입 속도로 시야 정렬이 뺏겨 조준이 선명해짐',tactics:['돌입']},chain:'combat_walker_strike'}, sfx:'warning'},
    {p:1, text:'보행기는 우리 의도를 놓치지 않았다. 렌즈가 더 깊숙이 굴절했고, 경보가 즉시 시작됐다.\n\n각도가 안 맞아 더 불리한 각도로 넘어갔다.', fx:{combatEdge:-2,combatPressure:2,combatEnd:1,combatRead:{label:'거리 계산이 틀어져 기동 시간이 줄어듦',tactics:['돌입']},chain:'combat_walker_strike'}, sfx:'impact'}]},
 ]},

{id:'combat_walker_strike', type:'추적', w:0, fixed:true, ai:1,
 title:'렌즈가 돌아오는 순간', scene:'combat-walker-disable',
 combat:{phase:3,total:3,step:'교전',threat:'4족 초계 보행기',terrain:'오른쪽 앞다리와 비워 둔 전도 방향',
  objective:'제압하거나 달구지까지 살아서 물러난다',stakes:'총구가 돌아오면 차와 사람이 함께 노출된다',intent:'붉은 렌즈가 먼저 사람을 고정하고 한 박자 뒤 총구가 같은 방향으로 따라온다',counters:{'사격':'렌즈나 관절을 먼저 끊는다','교란':'렌즈가 목표를 고정하지 못하게 한다'}}, sfx:'warning',
 text:'렌즈 안쪽에서 붉은 점이 켜진다.\n\n<span class="ai">"미등록 인원. 행동을 중지하십시오."</span>\n\n말은 정중했지만 총구는 그렇지 않았다. 지금 고른 한 동작 뒤에는 되감기가 없다.',
 choices:[
  {label:'석궁으로 몸통 렌즈를 끊는다', tactic:'사격', terrainFit:1, req:{item:'석궁',item2:'볼트'}, combatRoll:.54, out:[
    {p:1, text:'숨을 멈추고 당겼다.\n\n퓩. 볼트가 렌즈 테두리에 박혔다. 붉은 점이 허공을 두 번 훑더니 꺼졌다. 보행기는 한쪽 무릎을 접고 그대로 멎었다.\n\n가까이 가서야 다들 숨을 내쉬었다.', fx:{item:{'볼트':-1,'부품':1},scrap:6,combatEnd:1,note:{type:'사건',title:'렌즈를 끊은 한 발',body:'보행기의 보폭을 읽고 몸통 렌즈를 끊었다. 싸움은 발사보다 오래 준비됐다.',links:['천리안']}}, sfx:'crossbow'},
    {p:1, text:'줄이 손가락을 스쳤다. 볼트는 렌즈 옆 철판에서 튕겼다.\n\n경고탄이 폐차 문짝을 찢었다. 달구지까지 뛰어들어 후진으로 빠졌다. 손바닥이 벌어졌지만 운전대는 놓치지 않았다.', fx:{item:{'볼트':-1},fuel:-4,van:-7,pursuit:1,injury:{who:'driver',label:'손바닥 열상',days:2},combatEnd:1}, sfx:'impact'}]},
  {label:'쇠파이프로 다리 밸브를 꺾는다', tactic:'근접', terrainFit:2, req:{item:'쇠파이프'}, risk:'근접 부상', combatRoll:.45, out:[
    {p:1, text:'다리가 내려오는 박자에 맞춰 안쪽으로 파고들었다.\n\n쇠파이프를 밸브와 프레임 사이에 끼우고 온몸으로 눌렀다. 금속이 비명을 질렀고, 보행기는 우리가 비워 둔 쪽으로 쓰러졌다.', fx:{scrap:7,item:{'부품':1},fatigue:8,combatEnd:1}, sfx:'metal'},
    {p:1, text:'밸브는 휘었지만 다리는 멈추지 않았다.\n\n옆으로 구르는 순간 발끝이 어깨를 스쳤다. 강우가 소총을 한 발 쏴 시선을 빼앗았고, 우리는 달구지로 물러났다.', fx:{fatigue:10,van:-4,pursuit:1,injury:{who:'driver',label:'어깨 타박',days:3},combatEnd:1}, sfx:'hit'}]},
  {label:'화염병으로 센서 앞에 열벽을 만든다', tactic:'교란', terrainFit:1, noise:1, req:{item:'화염병'}, combatRoll:.64, out:[
    {p:1, text:'병은 보행기가 아니라 그 앞 아스팔트에서 깨졌다.\n\n검은 연기와 불꽃이 센서를 가렸다. 놈이 빈 열원을 향해 몸통을 돌리는 동안 달구지는 반대편으로 빠져나갔다.', fx:{item:{'화염병':-1},fuel:-2,moodAll:2,combatEnd:1}, sfx:'fire'},
    {p:1, text:'바람이 불길을 너무 빨리 눕혔다. 센서가 다시 달구지를 잡았다.\n\n경고탄 하나가 적재함 외벽을 뚫었다. 불길이 번지기 전에 떨쳐냈지만 차 안에는 탄내가 오래 남았다.', fx:{item:{'화염병':-1},fuel:-4,van:-9,pursuit:1,combatEnd:1}, sfx:'hit'}]},
  {label:'강우가 앞다리 관절에 한 발 쓴다', tactic:'사격', terrainFit:2, noise:1, req:{healthyComp:'kangwoo',item:'탄약'}, combatRoll:.62, out:[
    {p:1, text:'"오른발 들면 간다."\n\n쿵. 오른발이 들렸다. 탕.\n\n관절핀 하나가 정확히 빠져나왔다. 보행기가 옆으로 무너지자 강우는 탄피보다 먼저 우리 얼굴부터 확인했다. "다 있지?" 그제야 소총을 내렸다.', fx:{item:{'탄약':-1,'부품':1},scrap:5,mood:{kangwoo:5},combatEnd:1,note:{type:'사건',title:'한 발 뒤의 확인',body:'강우는 보행기를 쓰러뜨린 뒤 탄피보다 먼저 사람 수를 셌다.',links:['강우']}}, sfx:'rifle'},
    {p:1, text:'방아쇠를 당기는 순간 보행기가 몸을 틀었다. 탄은 관절 옆을 긁었다.\n\n강우가 두 번째 탄 대신 우리를 밀어 엄폐시켰다. 파편이 그의 옆구리를 때렸다. 그는 끝까지 걸어서 차에 탔다.', fx:{item:{'탄약':-1},fuel:-3,pursuit:1,injury:{who:'kangwoo',label:'옆구리 파편상',days:3},combatEnd:1}, sfx:'hit'}]},
  {label:'제압을 포기하고 달구지로 물러난다', tactic:'이탈', prep:1, out:[{p:1, text:'누가 먼저랄 것도 없이 하나씩 뒤로 빠졌다. 마지막 사람이 타자마자 기어를 넣었다.\n\n보행기는 따라오지 않았다. 대신 붉은 렌즈가 번호판 높이에서 한 박자 멈췄다. 읽은 것이다.\n\n사정거리 밖까지 가서야 서로의 손과 얼굴을 확인했다. 다 있었다. 그것만으로 오늘은 됐다고 서로 말했다.', fx:{fuel:-4,van:-3,moodAll:-2,pursuit:1,combatEnd:1,note:{type:'사건',title:'읽힌 번호판',body:'보행기 제압을 포기하고 물러났다. 물러나는 동안 렌즈가 번호판 높이에서 멈췄다.',links:['천리안','달구지']}}, sfx:'escape'}]},
 ]},

{id:'patrol_swarm', type:'추적', w:9, region:['north'], needFlag:'armed_age',
 title:'세 개의 그림자', scene:'combat-drone-swarm',
 combat:{phase:1,total:3,step:'정찰',
   threat:'초계 쿼드 편대',terrain:'오래된 터널과 고가 아래 폐차 지대',pressure:1,
   objective:'편대가 닫히기 전에 도주선을 고른다',stakes:'세 기체가 사격 각도를 닫으면 차가 포위된다',intent:'양옆 기체가 차선을 벌려 달구지를 가운데 지휘기 앞으로 몬다',counters:{'이탈':'좁은 터널로 편대 폭을 줄인다','엄폐':'폐차 사이에서 한 줄로 들어오게 한다'}}, sfx:'drone',
 text:'사이드미러에 점 셋이 생겼다. 새가 아니다. 간격이 너무 일정하다.\n\n앞에는 오래된 터널, 오른쪽에는 고가도로 아래 폐차 지대. 드론들은 아직 확성기만 켰다.\n\n<span class="ai">"차량 정지. 등록을 확인합니다."</span>',
 choices:[
  {label:'터널을 도주선으로 잡는다', tactic:'기동', prep:1, out:[{p:1,text:'기어를 내리고 터널까지 남은 거리를 눈으로 쟀다.\n\n입구는 좁지만 안은 어둡다. 드론이 고도를 낮추면 서로 피할 공간도 없어진다.',fx:{combatStart:{id:'swarm',threat:'초계 쿼드 편대',terrain:'오래된 터널과 고가 아래 폐차 지대',objective:'편대를 갈라 터널의 사각으로 빠진다',stakes:'세 기체가 사격 각도를 닫으면 차가 포위된다',pressure:1},combatEdge:1,combatPressure:-1,chain:'combat_swarm_read'},sfx:'engine'}]},
  {label:'고가 아래 폐차 지대로 파고든다', tactic:'엄폐', prep:1, risk:'길이 거칠다', out:[{p:1,text:'핸들을 꺾어 폐차 사이로 들어갔다. 지붕 위 안테나가 철판을 긁었다.\n\n드론 셋이 흩어졌다. 놈들도 이 안에서는 한 줄로 들어와야 한다. 매복하는 쪽이 유리한 지형이다.',fx:{van:-3,combatStart:{id:'swarm',threat:'초계 쿼드 편대',terrain:'오래된 터널과 고가 아래 폐차 지대',objective:'편대를 갈라 터널의 사각으로 빠진다',stakes:'세 기체가 사격 각도를 닫으면 차가 포위된다',pressure:1},combatEdge:2,chain:'combat_swarm_read'},sfx:'metal'}]},
  {label:'연료를 써서 편대 밖으로 달아난다', tactic:'이탈', prep:1, out:[{p:1,text:'액셀을 끝까지 밟고 갈림길 두 개를 연달아 꺾었다.\n\n모터음이 한동안 따라왔지만 결국 멀어졌다. 연료계 바늘도 그만큼 내려가 있었다.\n\n은수가 아니어도 알 수 있었다. 셋이 동시에 같은 방향으로 짧은 신호를 쐈다. 우리가 어디로 갔는지 누군가는 받았다는 뜻이다.',fx:{fuel:-7,moodAll:-2,pursuit:1,combatEnd:1,note:{type:'사건',title:'송신된 도주로',body:'드론 편대를 따돌렸지만 셋이 동시에 신호를 보냈다. 우리 도주 방향은 기록됐다.',links:['천리안']}},sfx:'escape'}]},
 ]},

{id:'combat_swarm_read', type:'추적', w:0, fixed:true, ai:1,
 title:'셋 중 하나', scene:'combat-drone-swarm',
 combat:{phase:2,total:3,step:'대응',difficulty:-1,baseChance:0.55,
   threat:'초계 쿼드 편대',terrain:'빗물과 터널 입구의 좁은 고도',
  objective:'편대의 눈과 귀가 어디인지 가려낸다',stakes:'지휘기를 못 찾으면 셋이 동시에 따라붙는다',intent:'가운데 기체가 선회 신호를 보내면 양옆 둘이 사격 각도를 닫는다',counters:{'관찰':'명령 박자를 외운다','해킹':'지휘 신호를 늦춘다','엄폐':'흔들리는 로터의 소리를 찾는다'}}, sfx:'drone',
  text:'드론 셋은 같은 높이로 날지 않는다. 가운데 기체가 조금 뒤에서 움직이고, 나머지 둘은 그 움직임을 반 박자 늦게 따라 한다.\n\n하부에 달린 검은 통도 총열처럼 보였지만, 빗물 속에서 희미하게 스피커 망이 보였다.',
 choices:[
  {label:'가운데 기체의 명령 박자를 외운다', combatRoll:.6, tactic:'관찰', out:[
    {p:1,text:'가운데가 선회하면 양옆이 갈라지고, 가운데가 멈추면 둘이 사격 각도를 만든다.\n\n지휘기는 하나다. 하나를 흔들면 셋의 줄이 풀린다.',fx:{combatEdge:1,combatPressure:-1,combatRead:{label:'가운데가 멈춘 뒤 양옆이 닫히기 전 반 박자',tactics:['운전','사격','교란','해킹']},chain:'combat_swarm_break'},sfx:'heartbeat'},
    {p:1,text:'리듬이 어긋났다. 신호를 놓친 사이 셋이 동시에 더 빽빽하게 붙기 시작했다.\n\n이제 터널 안에서는 한 박자도 아까운 상태가 됐다.',fx:{combatEdge:-2,combatPressure:2,combatRead:{label:'박자를 놓쳐 편대 밀집도가 올라감',tactics:['관찰']},chain:'combat_swarm_break'},sfx:'warning'}]},
  {label:'은수가 편대 주파수를 분리한다', combatRoll:.66, tactic:'해킹', req:{healthyComp:'eunsu'}, out:[
    {p:1,text:'은수가 헤드폰 한쪽을 내 귀에 대줬다. 잡음 아래 짧은 신호가 반복됐다.\n\n"가운데가 명령하고 있어요. 제가 한 번 늦출게요. 그때 움직여요."\n\n그녀가 손가락 세 개를 펴고 하나씩 접었다.',fx:{combatEdge:2,combatRead:{label:'지휘 명령을 한 박자 늦출 주파수',tactics:['운전','해킹']},chain:'combat_swarm_break',mood:{eunsu:2}},sfx:'hack'},
    {p:1,text:'신호가 잠잠하지 않았다. 분리 신호가 엇갈리며 두 번만에 포기 신호가 흘러나왔다.\n\n은수는 한 박자 늦은 채로 빠르게 손을 거둬야 했다.',fx:{combatEdge:-2,combatPressure:2,combatRead:{label:'해킹 타이밍이 흔들림',tactics:['해킹']},chain:'combat_swarm_break',mood:{eunsu:1}},sfx:'hack'}]},
  {label:'차 안의 불을 모두 끄고 소리만 듣는다', combatRoll:.56, tactic:'엄폐', out:[
    {p:1,text:'계기판까지 끄자 모터음의 높낮이가 들렸다.\n\n왼쪽 기체는 로터 하나가 떨린다. 방향을 바꿀 때마다 줄이 잠깐 벌어진다.',fx:{time:3,combatEdge:1,combatRead:{label:'왼쪽 로터가 떨리며 편대가 벌어지는 순간',tactics:['운전','사격']},chain:'combat_swarm_break'},sfx:'silence'},
    {p:1,text:'정지 시간이 길어졌다. 빗물 소리가 덮고, 음향으로만 판단하던 틈이 급격히 좁아졌다.\n\n두 번째 전환에서 편대가 다시 정렬되기 시작한다.',fx:{combatEdge:-2,combatPressure:2,combatRead:{label:'소리만 듣는 간극이 일시적으로 닫힘',tactics:['엄폐']},chain:'combat_swarm_break'},sfx:'silence'}]},
  {label:'지금 바로 터널로 내달린다', combatRoll:.44, tactic:'돌입', risk:'편대가 아직 붙어 있다', out:[
    {p:1,text:'분석을 접고 시동을 올렸다.\n\n셋의 붉은 빛이 동시에 달구지 지붕을 물었다. 터널은 가까워졌고, 우리 쪽 여유는 사라졌다.',fx:{combatEdge:-2,combatPressure:2,chain:'combat_swarm_break'},sfx:'warning'},
    {p:1,text:'분석도 없이 급발진했다. 셋의 조준점이 우리 차에 먼저 정렬됐다.\n\n터널 입구에서 버티는 시간이 줄고, 반격 여지가 작아졌다.',fx:{combatEdge:-2,combatPressure:2,combatRead:{label:'돌입 타이밍을 잃음',tactics:['돌입']},chain:'combat_swarm_break'},sfx:'impact'}]},
  ]},

{id:'combat_swarm_break', type:'추적', w:0, fixed:true, ai:1,
 title:'터널 입구까지', scene:'combat-drone-swarm',
 combat:{phase:3,total:3,step:'돌파',
   threat:'초계 쿼드 편대',terrain:'백 미터 앞 터널과 젖은 차선',
  objective:'편대를 흩뜨리고 추적 범위를 벗어난다',stakes:'터널 밖에서 붙잡히면 지붕과 적재함이 먼저 맞는다',intent:'지휘기가 운전석을 고정하는 동안 양옆 둘이 터널 입구를 닫는다',counters:{'운전':'편대가 닫히기 전 터널로 꺾는다','교란':'시야를 가려 고도를 벌린다','해킹':'지휘기의 귀환 명령을 덮어쓴다'}}, sfx:'warning',
 text:'빗방울 사이로 붉은 탐조등이 세 줄 내려온다. 그중 하나가 운전석 앞유리에 걸렸다.\n\n터널 입구는 이제 백 미터. 드론의 로터음은 지붕 바로 위에 있다.',
 choices:[
  {label:'차선을 꺾어 터널 안으로 밀어 넣는다', tactic:'운전', terrainFit:2, combatRoll:.62, out:[
    {p:1,text:'첫 번째 빛이 닿는 순간 차선을 바꿨다. 드론 하나가 따라 들어왔고, 둘은 입구에서 서로 얽혀 고도를 올렸다.\n\n터널 중간에서 헤드라이트를 끄자 마지막 모터음도 멀어졌다. 어둠 속에서 아무도 소리 내어 웃지 못했다.',fx:{fuel:-5,moodAll:1,combatEnd:1,note:{type:'소문',title:'터널의 사각',body:'초계 쿼드는 좁고 어두운 터널에서 편대를 유지하지 못한다.',links:['천리안']}},sfx:'escape'},
    {p:1,text:'터널 입구에서 핸들이 물웅덩이에 뜨는 느낌이 났다.\n\n가드레일을 긁고서야 차가 바로 섰다. 드론은 놓쳤지만 운전대를 붙든 손목이 부어올랐다.',fx:{fuel:-6,van:-9,injury:{who:'driver',label:'손목 염좌',days:2},combatEnd:1},sfx:'hit'}]},
  {label:'석궁으로 떨리는 로터를 끊는다', tactic:'사격', terrainFit:1, req:{item:'석궁',item2:'볼트'}, combatRoll:.53, out:[
    {p:1,text:'떨리는 로터가 아래로 내려오는 순간을 기다렸다.\n\n퓩. 볼트가 축에 감겼고 기체가 젖은 도로에 미끄러졌다. 나머지 둘은 충돌을 피하려 벌어졌다. 그 틈으로 터널을 통과했다.',fx:{item:{'볼트':-1,'부품':1},scrap:5,combatEnd:1},sfx:'crossbow'},
    {p:1,text:'볼트가 로터 바람에 밀려 차체를 스쳤다.\n\n드론 하나가 적재함 위로 내려앉듯 붙었다. 급제동으로 떼어냈지만 지붕의 짐과 볼트 한 발을 잃었다.',fx:{item:{'볼트':-1},scrap:-3,van:-5,pursuit:1,combatEnd:1},sfx:'impact'}]},
  {label:'화염병 두 개로 검은 연막을 세운다', tactic:'교란', terrainFit:2, noise:1, req:{item:'화염병',itemQty:2}, combatRoll:.67, out:[
    {p:1,text:'첫 병은 중앙선, 둘째는 갓길에 깨졌다.\n\n검은 연기가 도로 전체를 덮었다. 드론들이 열원을 피해 고도를 올린 사이 달구지는 터널 속으로 사라졌다.',fx:{item:{'화염병':-2},moodAll:2,combatEnd:1},sfx:'fire'},
    {p:1,text:'젖은 도로에서 불길이 낮게 깔렸다. 연막은 충분하지 않았다.\n\n드론의 경고탄이 뒤 문을 찢었다. 터널 안까지 쫓기다 겨우 떨쳐냈다.',fx:{item:{'화염병':-2},van:-8,pursuit:1,combatEnd:1},sfx:'hit'}]},
  {label:'은수가 지휘기에 귀환 명령을 밀어 넣는다', tactic:'해킹', terrainFit:2, req:{healthyComp:'eunsu',perk:'es_hack'}, combatRoll:.6, out:[
    {p:1,text:'은수가 엔터 키를 누르고도 화면에서 손을 떼지 않았다.\n\n가운데 기체가 먼저 방향을 돌렸다. 둘이 잠깐 흔들리더니 똑같이 북쪽으로 붙었다.\n\n"로그에는 임무 완료로 남아요." 은수가 뒤늦게 숨을 내쉬었다.',fx:{mood:{eunsu:6},combatEnd:1,note:{type:'사건',title:'편대의 거짓 귀환',body:'은수가 지휘기에 귀환 명령을 넣었다. 편대 로그에는 임무 완료가 남았다.',links:['은수']}},sfx:'hack'},
    {p:1,text:'귀환 명령이 반쯤 들어간 순간 연결이 끊겼다.\n\n두 기는 돌아섰지만 지휘기 하나가 끝까지 따라왔다. 은수가 단말을 끌어안고 바닥에 엎드렸고, 우리는 터널 벽을 긁으며 빠져나왔다.',fx:{van:-7,pursuit:1,injury:{who:'eunsu',label:'팔꿈치 타박',days:2},combatEnd:1},sfx:'hit'}]},
 ]},

{id:'patrol_toll', type:'추적', w:8, region:['north'], needFlag:'armed_age',
 title:'불 꺼진 검문소', scene:'combat-checkpoint-breach',
 combat:{phase:1,total:3,step:'정찰',
   threat:'자동 검문소',terrain:'안개 낀 배수로와 폐기 차량 갓길',pressure:1,
  objective:'센서가 깨기 전에 접근로를 고른다',stakes:'차량 번호가 중앙 검문 기록에 남는다',intent:'열 센서가 갓길 차량부터 훑고 차단봉 앞 번호판으로 이동한다',counters:{'잠입':'배수로 벽으로 열을 가린다','위장':'폐기 차량의 윤곽에 섞인다'}}, sfx:'scan',
 text:'톨게이트처럼 생긴 오래된 검문소가 안개 속에 걸려 있다. 불은 꺼졌는데 차단봉만 새것처럼 반듯하다.\n\n센서 기둥 하나가 천천히 고개를 돌린다. 아직 우리 번호를 읽지는 못했다.',
 choices:[
  {label:'배수로를 따라 제어함까지 붙는다', tactic:'잠입', prep:1, out:[{p:1,text:'달구지를 센서 밖에 세우고 배수로로 몸을 낮췄다.\n\n물이 무릎까지 찼지만 콘크리트 벽이 열을 가려줬다. 제어함은 손 닿는 곳까지 왔다.',fx:{fatigue:3,combatStart:{id:'toll',threat:'자동 검문소',terrain:'안개 낀 배수로와 수동 제어함',objective:'송신 전에 차단봉을 열고 기록 없이 통과한다',stakes:'차량 번호가 중앙 검문 기록에 남는다',pressure:1},combatEdge:1,combatPressure:-1,chain:'combat_toll_read'},sfx:'cover'}]},
  {label:'달구지를 폐기 차량처럼 갓길에 세운다', tactic:'위장', prep:1, out:[{p:1,text:'차를 기울어진 표지판 뒤에 세우고 모든 전원을 내렸다.\n\n센서가 두 바퀴를 도는 동안 숨을 죽였다. 빛이 적재함을 훑고, 오래 보지 않고 지나갔다. 낡음이 오늘도 신분증 노릇을 했다. 이제 놈의 순찰 간격까지 알게 됐다.',fx:{time:15,combatStart:{id:'toll',threat:'자동 검문소',terrain:'안개 낀 배수로와 수동 제어함',objective:'송신 전에 차단봉을 열고 기록 없이 통과한다',stakes:'차량 번호가 중앙 검문 기록에 남는다',pressure:1},combatEdge:2,chain:'combat_toll_read'},sfx:'silence'}]},
  {label:'논길로 멀리 우회한다', tactic:'우회', prep:1, out:[{p:1,text:'한 시간 가까이 논둑을 타고 돌아갔다.\n\n차 안 살림이 모조리 한쪽으로 쏠렸다. 검문 기록은 남지 않았지만, 제어함도 그대로 남았다. 다음에 이 길을 지나는 누군가는 우리가 열어 두지 않은 문 앞에 설 것이다.\n\n돌아와 정리할 일이 하나, 마음에 걸리는 일이 하나 더 생겼다.',fx:{time:45,fuel:-4,van:-3,moodAll:-3,flag:'toll_left_armed',combatEnd:1,note:{type:'사건',title:'열지 않은 제어함',body:'검문소를 우회했다. 기록은 안 남았지만 검문소는 그대로 켜져 있다.',links:[]}},sfx:'escape'}]},
 ]},

{id:'combat_toll_read', type:'추적', w:0, fixed:true, ai:1,
 title:'깨어나는 순서', scene:'combat-checkpoint-breach',
 combat:{phase:2,total:3,step:'대응',difficulty:-1,baseChance:0.56,
   threat:'자동 검문소',terrain:'수동 레버와 낡은 정비 포트',
  objective:'경보보다 먼저 차단봉을 무력화한다',stakes:'점등 뒤 여섯 초면 외부 송신이 시작된다',intent:'센서와 카메라, 차단봉이 차례로 켜지고 여섯 초 뒤 외부 송신이 시작된다',counters:{'관찰':'점등 순서와 여섯 초를 잰다','정비':'레버 축을 미리 가볍게 만든다','해킹':'이미 열린 상태로 응답하게 한다'}}, sfx:'scan',
  text:'제어함 안에는 손으로 당기는 레버와 오래된 정비 포트가 함께 있다.\n\n멀리서 센서 기둥 하나가 켜지고, 그다음 카메라가 돌아간다. 전부 한꺼번에 깨어나는 장치는 아니다.',
 choices:[
  {label:'점등 순서를 한 바퀴 더 지켜본다', combatRoll:.6, tactic:'관찰', out:[
    {p:1,text:'센서, 카메라, 차단봉. 여섯 초 뒤 경보.\n\n순서는 늘 같았다. 여섯 초면 레버를 당기고 차까지 뛸 수 있다. 넘어지지만 않으면.',fx:{time:3,combatEdge:1,combatPressure:-1,combatRead:{label:'센서 점등부터 송신까지 여섯 초',tactics:['근접','해킹']},chain:'combat_toll_breach'},sfx:'heartbeat'},
    {p:1,text:'한 번 본 순서를 눈에 담다가도, 다음 박자에서 노이즈가 끼어들었다.\n\n센서가 한 박자 빨리 반응해 다음 단계가 촉박해졌다.',fx:{combatEdge:-2,combatPressure:2,combatRead:{label:'시점 추적이 미세하게 어긋남',tactics:['관찰']},chain:'combat_toll_breach'},sfx:'heartbeat'}]},
  {label:'민지가 레버 축의 고정핀을 뺀다', combatRoll:.66, tactic:'정비', req:{healthyComp:'minji'}, out:[
    {p:1,text:'민지가 녹슨 축 아래를 손끝으로 훑더니 작은 핀 하나를 뽑았다.\n\n"이제 힘으로 열지 마요. 살짝 당기면 돼요. 세게 하면 오히려 걸려요."\n\n차단봉이 사람 손 무게만큼 가벼워졌다.',fx:{combatEdge:2,combatRead:{label:'힘을 주지 않아도 열리는 수동 레버 축',tactics:['근접']},chain:'combat_toll_breach',mood:{minji:2}},sfx:'tool'},
    {p:1,text:'핀을 빼는 속도가 느렸다. 녹이 한 번 더 붙는 느낌이었다.\n\n축은 움직였지만 이내 멈추며 경보 반응이 더 빨라졌다.',fx:{combatEdge:-2,combatPressure:2,combatRead:{label:'정비 동작이 지연됨',tactics:['정비']},chain:'combat_toll_breach',mood:{minji:1}},sfx:'tool'}]},
  {label:'은수가 정비 포트의 응답을 듣는다', combatRoll:.64, tactic:'해킹', req:{healthyComp:'eunsu'}, out:[
    {p:1,text:'은수가 케이블을 꽂고 화면 밝기를 손바닥으로 가렸다.\n\n"옛날 유지보수 규격이에요. 열어 달라고 말하는 대신, 이미 열렸다고 보고하면 돼요."\n\n그녀가 짧은 응답 코드를 만들었다.',fx:{combatEdge:2,combatRead:{label:'검문소가 믿는 오래된 통과 완료 응답',tactics:['해킹']},chain:'combat_toll_breach',mood:{eunsu:2}},sfx:'hack'},
    {p:1,text:'응답은 잠깐만 통했나 보다. 포맷이 달라 보였고, 시스템은 경고 카운트를 하나 올렸다.\n\n은수는 코드를 급히 정리하며 다음 단계를 기다렸다.',fx:{combatEdge:-2,combatPressure:2,combatRead:{label:'응답 신호가 오차를 일으켜 알람 축적',tactics:['해킹']},chain:'combat_toll_breach',mood:{eunsu:1}},sfx:'hack'}]},
  {label:'센서가 더 켜지기 전에 손부터 댄다', combatRoll:.46, tactic:'돌입', risk:'경보가 빠르다', out:[
    {p:1,text:'계획을 그만두고 제어함 문을 잡아당겼다.\n\n녹슨 경첩 소리가 안개 속으로 길게 퍼졌다. 센서 둘이 동시에 이쪽을 봤다.',fx:{combatEdge:-2,combatPressure:2,chain:'combat_toll_breach'},sfx:'warning'},
    {p:1,text:'문을 잡아당길 틈이 아니었다. 경보가 먼저 터졌고, 제어함 출입 자체가 급속 제약을 받았다.\n\n차단봉은 내려가기 전에 더 급하게 고정됐다.',fx:{combatEdge:-2,combatPressure:2,combatRead:{label:'돌입 타이밍을 놓쳐 제어 접근이 위험해짐',tactics:['돌입']},chain:'combat_toll_breach'},sfx:'warning'}]},
  ]},

{id:'combat_toll_breach', type:'추적', w:0, fixed:true, ai:1,
 title:'여섯 초', scene:'combat-checkpoint-breach',
 combat:{phase:3,total:3,step:'돌파',
   threat:'자동 검문소',terrain:'제어함에서 차단선까지 여섯 초 거리',
  objective:'경보가 송신되기 전에 길을 연다',stakes:'늦으면 위치·차량·인원 기록이 함께 전송된다',intent:'첫 센서 점등 뒤 여섯 초가 지나면 차량과 인원 기록을 외부망으로 보낸다',counters:{'근접':'수동 레버로 송신 전에 연다','해킹':'이미 통과한 기록을 먼저 보낸다','교란':'센서가 번호를 읽지 못하게 가린다'}}, sfx:'warning',
 text:'첫 번째 센서에 붉은 불이 들어왔다.\n\n<span class="ai">"미등록 접근. 확인 절차를 시작합니다."</span>\n\n아직 사이렌은 없다. 손으로 센 여섯 초가 지금부터다.',
 choices:[
  {label:'쇠파이프로 수동 레버를 당긴다', tactic:'근접', terrainFit:2, noise:1, req:{item:'쇠파이프'}, risk:'경보 송신', combatRoll:.55, out:[
    {p:1,text:'하나, 둘. 제어함을 벌리고 레버를 당겼다.\n\n넷. 차단봉이 올라갔다. 여섯이 되기 전에 달구지가 선을 넘었다. 뒤에서 사이렌이 한 번 숨을 들이켰다가 꺼졌다.',fx:{time:8,combatEnd:1},sfx:'metal'},
    {p:1,text:'레버가 중간에서 걸렸다. 몸을 싣자 차단봉은 열렸지만 여섯 초를 넘겼다.\n\n사이렌이 울었고 센서 기둥이 달구지를 끝까지 따라 돌았다. 손등에는 제어함 철판에 긁힌 피가 맺혔다.',fx:{time:10,pursuit:1,injury:{who:'driver',label:'손등 열상',days:2},combatEnd:1},sfx:'alarm'}]},
  {label:'은수가 ‘이미 통과’ 응답을 보낸다', tactic:'해킹', terrainFit:2, req:{healthyComp:'eunsu'}, combatRoll:.66, out:[
    {p:1,text:'은수가 짧은 코드를 보냈다.\n\n<span class="ai">"처리 완료. 좋은 하루 되십시오."</span>\n\n차단봉이 정중하게 올라갔다. 달구지가 지나간 뒤에야 은수가 케이블을 뽑고 뛰어왔다. "좋은 하루는 무슨." 숨이 차서 말끝이 웃음처럼 떨렸다.',fx:{mood:{eunsu:4},combatEnd:1},sfx:'hack'},
    {p:1,text:'응답은 들어갔지만 검문소가 한 번 더 물었다. 등록 번호가 무엇이냐고.\n\n은수가 아무 번호나 밀어 넣은 사이 차단봉을 들이받고 빠져나왔다. 기록에는 아마 세상에 없는 차가 남았을 것이다.',fx:{van:-6,pursuit:1,combatEnd:1},sfx:'hit'}]},
  {label:'센서 앞에 화염병을 깨고 밀고 나간다', tactic:'교란', terrainFit:1, noise:2, req:{item:'화염병'}, combatRoll:.62, out:[
    {p:1,text:'불은 센서 기둥 바로 앞에서 솟았다. 열상이 화면을 하얗게 태웠다.\n\n차단봉 옆의 좁은 틈으로 달구지를 밀어 넣었다. 거울 하나를 잃었지만 번호는 남기지 않았다.',fx:{item:{'화염병':-1},van:-3,combatEnd:1},sfx:'fire'},
    {p:1,text:'안개가 연기를 눌러 길 쪽으로 밀었다. 센서는 가려졌지만 우리도 앞을 못 봤다.\n\n차단봉을 들이받고서야 빠져나왔다. 뒤쪽 사이렌은 끝내 꺼지지 않았다.',fx:{item:{'화염병':-1},van:-10,pursuit:1,combatEnd:1},sfx:'hit'}]},
  {label:'작업을 버리고 논길로 물러난다', tactic:'이탈', prep:1, out:[{p:1,text:'케이블과 공구만 챙겨 배수로로 돌아 나왔다.\n\n붉은 불이 등을 훑었다. 달구지는 이미 갓길을 벗어나고 있었지만, 훑은 것과 못 훑은 것은 다르다.\n\n오래 돌아가도 전원이 차에 타 있는 편이 낫다. 그건 맞다. 다만 제어함은 손댄 채로 남았고, 손댄 흔적은 열린 것보다 오래 남는다.',fx:{time:40,fuel:-4,moodAll:-3,pursuit:1,flag:'toll_left_armed',combatEnd:1,note:{type:'사건',title:'손댄 채로 둔 제어함',body:'검문소 작업을 중단하고 물러났다. 붉은 불이 등을 훑었고 시도는 기록으로 남았다.',links:['천리안']}},sfx:'escape'}]},
 ]},
/* ═══════════ v1.3 시나리오 체인 ═══════════ */

/* ── 체인 A: 이동 도서관 (4) ── */
{id:'lib_meet', type:'조우', w:11, once:true, region:['south','mid'],
 title:'책 말리는 사람',
 text:'갓길에 낡은 마을버스가 서 있다. 차체에 페인트로 큼직하게 —\n\n"이동 도서관 「반납은 언제든」"\n\n버스 지붕과 보닛 위에 책 수십 권이 펼쳐져 있다. 안경 쓴 여자가 한 권씩 뒤집으며 말리는 중이다.\n\n"어제 비에 창문이 샜어요. 책은 사람보다 물에 약해서."',
 choices:[
  {label:'같이 말린다', out:[{p:1, text:'한 시간쯤 책을 뒤집었다. 여자는 사서였다고 한다. 이름은 한별.\n\n"도서관이 무너져서, 책들 데리고 나왔어요. 피난이죠. 책도 피난을 왔어요."\n\n말린 책 중 한 권의 장서인이 눈에 들어왔다. 서울시립도서관.\n\n"그 책이 제일 멀리서 온 애예요." 한별이 웃었다.', fx:{time:60, moodAll:3, flag:'library_met', note:{type:'인물',title:'사서 한별',body:'마을버스 이동 도서관 「반납은 언제든」. 책들을 데리고 피난 중. 서울에서 온 책 한 권.',links:['이동 도서관']}}}]},
  {label:'책 한 권 빌린다', out:[{p:1, text:'"대출증은 얼굴이에요. 다음에 만나면 반납하세요."\n\n조수석에 젖은 시집 한 권이 실렸다. 마르면서 종이가 우글우글해졌다. 파도 같았다.', fx:{moodAll:2, flag:'library_met', note:{type:'인물',title:'사서 한별',body:'이동 도서관에서 시집을 빌렸다. 대출증은 얼굴. 반납은 언제든.',links:['이동 도서관']}}}]},
  {label:'갈 길이 멀다', out:[{p:1, text:'백미러 속에서 여자가 책을 한 장씩 넘기며 바람에 말리고 있었다. 세상에서 제일 느린 일 같았다.', fx:{}}]},
 ]},

{id:'lib_request', type:'조우', w:12, once:true, needFlag:'library_met',
 title:'다시 만난 도서관',
 text:'낯익은 마을버스가 정자나무 아래 서 있다. 이동 도서관이다.\n\n버스 안에서 아이들 몇이 바닥에 배를 깔고 책을 읽고 있다. 한별이 우리를 알아보고 손을 흔든다.\n\n"마침 잘 왔어요. 부탁이 하나 있는데— 북쪽으로 가시죠? 가다가 책 좀 주워다 주세요. 애들이 여기 있는 걸 다 읽었어요. 세 번씩요."',
 choices:[
  {label:'"어떤 책이든?"', out:[{p:1, text:'"어떤 책이든요. 책은 골라 읽는 게 아니라 걸려 읽는 거예요."\n\n한별이 빈 라면박스를 하나 건넸다. 옆면에 매직으로 「도서 기증」이라고 적혀 있다.', fx:{flag:'library_quest', moodAll:2, note:{type:'소문',title:'도서 기증 상자',body:'한별의 부탁. 북쪽 어딘가에서 책을 모아다 줄 것. 아이들이 다 읽었다. 세 번씩.',links:['이동 도서관']}}}]},
  {label:'"우린 배달꾼이 아니오"', out:[{p:1, text:'"알아요. 그래도 혹시 책이 눈에 밟히면요."\n\n한별은 서운해하지 않았다. 사서는 기다리는 직업이라고 했다.', fx:{flag:'library_quest'}}]},
 ]},

{id:'lib_books', type:'탐색', w:10, once:true, needFlag:'library_quest',
 title:'무너진 도서실',
 text:'폐교 2층, 문패가 반쯤 떨어진 도서실.\n\n서가 두 개가 도미노처럼 쓰러져 있고 그 위로 지붕이 내려앉았다. 그런데 무너진 지붕이 오히려 비를 막아줬는지— 아래 깔린 책들이 멀쩡하다.\n\n라면박스가 조수석에 있다. 「도서 기증」.',
 choices:[
  {label:'책을 캐낸다', out:[
   {p:3, text:'서가 밑에 팔을 넣어 한 권씩 뽑았다. 그림책, 위인전, 만화로 보는 과학, 그리고 누가 봐도 선생님 책상에서 나온 무협지 한 질.\n\n박스가 꽉 찼다. 아이들이 세 번씩 읽을 것들이다.', fx:{time:50, fatigue:6, item:{'책 꾸러미':1}, flag:'library_books', note:{type:'사건',title:'도서 구조 작전',body:'무너진 서가 밑에서 책 한 박스를 캐냈다. 무협지는 덤.'}}},
   {p:1, text:'책을 뽑는데 서가가 삐걱— 내려앉았다. 급히 팔을 뺐다. 건진 건 반 박스. 그래도 반 박스다.', fx:{time:40, fatigue:8, van:0, item:{'책 꾸러미':1}, flag:'library_books', moodAll:-1}}]},
  {label:'위험해 보인다, 관둔다', out:[{p:1, text:'지붕이 언제 마저 내려앉을지 모른다. 책은 다음 기회에.', fx:{}}]},
 ]},

{id:'lib_return', type:'조우', w:14, once:true, needFlag:'library_books',
 title:'반납은 언제든',
 text:'이동 도서관이 저만치 보인다. 이번엔 개울가다. 빨랫줄에 책 대신 아이들 양말이 걸려 있다.\n\n조수석의 라면박스가 무겁다. 좋은 무거움이다.',
 choices:[
  {label:'박스를 내려놓는다', req:{item:'책 꾸러미'}, out:[{p:1, text:'한별이 박스를 열고 한 권씩 꺼내 코에 대고 냄새를 맡았다. 사서들은 그렇게 책 상태를 본다고 한다.\n\n"무협지…!" 제일 환호한 건 애들이 아니라 한별이었다.\n\n그날 저녁, 버스 계단에 앉아 아이들에게 그림책을 읽어줬다. 답례로 한별이 지도를 꺼내 연필로 점 하나를 찍었다.\n\n"책 반납하러 다니면서 알게 된 곳이에요. 지도엔 없어요."', fx:{item:{'책 꾸러미':-1}, time:80, moodAll:6, revealNear:1, flag:'library_done', note:{type:'사건',title:'낭독회',body:'버스 계단 낭독회. 무협지에 제일 환호한 건 사서였다. 답례는 지도에 없는 곳 하나.',links:['이동 도서관']}}}]},
  {label:'다음에 주자', out:[{p:1, text:'오늘은 길이 급하다. 백미러 속 버스가 작아질 때까지 박스가 유난히 무거웠다.', fx:{}}]},
 ]},

/* ── 체인 B: 주파수 4-0-0 (3) ── */
{id:'freq_catch', minParty:1, type:'추적', w:9, once:true, region:['mid','north'],
 title:'숫자 방송',
 text:'라디오 스캔이 잡음 사이에서 멈췄다.\n\n"…4. 0. 0. …4. 0. 0. …"\n\n여자 목소리가 같은 숫자를 반복한다. 기계처럼 고른 간격. 그런데 기계 같지가 않다. 숫자와 숫자 사이에, 아주 짧게, 숨소리가 들린다.',
 choices:[
  {label:'주파수를 기록한다', out:[{p:1, text:'수첩에 주파수를 적었다. 405.8. 숫자는 계속 반복되고 있다.\n\n4. 0. 0. 서울까지의 거리와 같은 숫자라는 걸, 다들 생각했지만 아무도 말하지 않았다.', fx:{flag:'freq400', note:{type:'소문',title:'주파수 4-0-0',body:'405.8에서 반복되는 숫자 방송. 4. 0. 0. 숨소리가 섞여 있다. 사람이다.',links:['천리안']}}}]},
  {label:'은수에게 묻는다', req:{comp:'eunsu'}, out:[{p:1, text:'은수가 헤드폰을 반쯤 벗고 30초쯤 들었다.\n\n"천리안 채널 아니에요. 포맷이 달라요. 천리안은… 이렇게 낡은 방식을 안 써요."\n\n"그럼 누군데?"\n\n"사람이요. 그것도— 들으라고 트는 사람."', fx:{flag:'freq400', mood:{eunsu:3}, note:{type:'소문',title:'주파수 4-0-0',body:'은수 판정: 천리안 아님. 낡은 방식. 들으라고 트는 사람의 방송.',links:['천리안']}}}]},
  {label:'라디오를 끈다', out:[{p:1, text:'숫자는 끊겼지만, 한동안 다들 머릿속으로 세고 있었다. 4. 0. 0.', fx:{flag:'freq400'}}]},
 ]},

{id:'freq_triangulate', type:'탐색', w:10, once:true, needFlag:'freq400',
 title:'급수탑의 안테나',
 text:'언덕 위 낡은 급수탑. 그 꼭대기에 있어선 안 될 것이 있다.\n\n안테나. 손으로 엮은 태가 나는, 구리선과 낚싯대로 만든 안테나.\n\n라디오를 켜자 숫자 방송이 어느 때보다 선명하다. "4. 0. 0." 여기가 가깝다.',
 choices:[
  {label:'급수탑에 오른다', out:[{p:1, text:'녹슨 사다리를 40분 걸려 올랐다. 꼭대기엔 송신기가 없었다. 중계기다. 신호는 여기서 꺾여 더 북쪽에서 온다.\n\n중계기 옆에 매직 글씨.\n\n"올라오느라 고생했습니다. 아직 아닙니다. 더 가세요."', fx:{time:70, fatigue:10, flag:'freq400_src', note:{type:'사건',title:'급수탑 중계기',body:'손으로 만든 중계기. "아직 아닙니다. 더 가세요." 발신지는 더 북쪽.'}}}]},
  {label:'은수의 삼각측량', req:{comp:'eunsu'}, out:[{p:1, text:'은수가 라디오를 들고 차 주위를 세 바퀴 돌더니 지도에 선 두 개를 그었다.\n\n"올라갈 필요 없어요. 여긴 중계기예요. 발신지는—" 연필이 북쪽에서 멈췄다. "—이 근처. 학교 아니면 관공서. 방송실이 있는 건물이에요."', fx:{time:20, mood:{eunsu:3}, flag:'freq400_src', note:{type:'사건',title:'은수의 삼각측량',body:'차 세 바퀴와 선 두 개로 발신지를 좁혔다. 북쪽, 방송실 있는 건물.'}}}]},
 ]},

{id:'freq_source', minParty:1, type:'탐색', w:12, once:true, needFlag:'freq400_src', region:['mid','north'],
 title:'방송실',
 text:'폐교 방송실 문에 자물쇠가 없다. 대신 문패가 새로 달려 있다. 코팅까지 해서.\n\n「송출 중 — 조용히」\n\n안에는 자동차 배터리 여섯 개에 물려 있는 낡은 방송 장비. 릴테이프가 돌아가며 같은 숫자를 내보내고 있다. "4. 0. 0."\n\n마이크 앞에 편지 한 장이 눌러져 있다.',
 choices:[
  {label:'편지를 읽는다', out:[{p:1, text:'"이 방송이 들리면 중계기는 아직 살아 있습니다.\n\n부산에서 서울까지 400km. 북쪽으로 간다면 명단이 완성되기 전에 도착하세요.\n\n중계기 배터리는 2년쯤 갑니다. 제가 돌아오지 못해도 숫자는 계속 나갈 겁니다. — L"\n\n\'명단\'이라는 단어에서 방송실이 잠깐 추워졌다.', fx:{flag:'freq400_done', item:{'라디오 진공관':1}, note:{type:'소문',title:'L의 편지',body:'"명단이 완성되기 전에 도착하세요. — L" 중계기 배터리는 2년쯤 간다. L이 돌아오지 못해도 숫자는 계속 송출된다.',links:['천리안','주파수 4-0-0']}}}]},
  {label:'테이프를 멈춘다', out:[{p:1, text:'릴이 멈추자 방송실이 조용해졌다. 3초쯤.\n\n그 3초가 견딜 수 없이 이상해서, 도로 틀었다. "4. 0. 0." 세상 어딘가에서 누가 듣고 있을 것이다. 우리가 들었듯이.', fx:{flag:'freq400_done', moodAll:2, note:{type:'사건',title:'끄지 못한 방송',body:'멈춘 3초를 견디지 못하고 도로 틀었다. 누군가 듣고 있을 테니까.'}}}]},
 ]},

/* ── 체인 C: 달구지의 첫 주인 (3) ── */
{id:'van_receipt', type:'동행', w:9, once:true,
 title:'서랍 밑의 영수증',
 text:'조수석 서랍이 덜컹거려서 뜯었더니, 바닥 틈에 누렇게 바랜 종이가 끼어 있다.\n\n영수증. 「김천 대양카센터 — 하부 방청, 조향 점검. 수리비 대신 커피 두 잔 받음. 차 좋네. — 대양」\n\n날짜는 이십몇 년 전. 할아버지 글씨가 아니다.\n\n달구지에게 우리가 모르는 시절이 있었다.',
 choices:[
  {label:'정비 수첩에 끼워둔다', out:[{p:1, text:'할아버지의 정비 수첩 첫 장에 영수증을 끼웠다. 순서로 치면 이게 1페이지다.\n\n"수리비가 커피 두 잔이래." 웃음이 새어 나왔다. 옛날 사람들은 다 그랬다고 한다.', fx:{flag:'van_receipt', moodAll:2, note:{type:'사건',title:'1페이지',body:'달구지의 가장 오래된 기록. 김천 대양카센터, 수리비는 커피 두 잔.',links:['달구지','할아버지']}}}]},
 ]},

{id:'van_garage', type:'탐색', w:12, once:true, needFlag:'van_receipt', nearNode:['gimcheon','gumi','sangju'],
 title:'대양카센터',
 text:'국도변, 간판이 반쯤 떨어진 카센터. 「대양카센ㅌ」.\n\n영수증의 그곳이다. 셔터는 내려가 있지만 옆문이 열려 있다.\n\n정비 피트엔 낙엽이 쌓였고, 벽에는 폴라로이드가 수십 장 붙어 있다. 이 카센터를 거쳐간 차들과 주인들.',
 choices:[
  {label:'사진 벽을 살핀다', out:[{p:1, text:'셋째 줄에서 찾았다.\n\n젊은 할아버지가 달구지에 기대 서 있다. 지금보다 페인트가 쨍한 달구지. 옆에는 기름때 묻은 작업복의 정비공이 어색하게 브이를 하고 있다.\n\n사진 밑에 볼펜 글씨. 「커피 두 잔짜리 단골」.', fx:{time:30, flag:'van_garage', note:{type:'인물',title:'정비공 대양',body:'폴라로이드 속 젊은 할아버지와 달구지. 「커피 두 잔짜리 단골」.',links:['할아버지','달구지']}}}]},
  {label:'공구를 챙긴다', out:[{p:1, text:'남의 가게 공구를 쓸어 담는 기분이 영 그렇다. 그래도 렌치 세트는 렌치 세트다.\n\n나오는 길에 사진 벽이 눈에 밟혔지만, 해가 짧았다.', fx:{scrap:6, item:{'부품':1}, flag:'van_garage'}}]},
 ]},

{id:'van_owner', type:'조우', w:12, once:true, needFlag:'van_garage',
 title:'커피 두 잔',
 text:'길가 간이 장터. 고무 대야에 고구마를 파는 노인이 우리 쪽을— 정확히는 달구지를 뚫어져라 본다.\n\n일어나더니 지팡이도 없이 성큼성큼 걸어온다.\n\n"이 차." 노인이 보닛을 쓰다듬었다. "하부 방청 내가 했어. 이거 아직 굴러가?"\n\n대양이다.',
 choices:[
  {label:'"주인 할아버지 차였어요"', out:[{p:1, text:'대양은 오래 말이 없었다.\n\n"…갔구만, 그 양반."\n\n그러곤 소매를 걷었다. "피트는 없어도 눈은 안 죽었어. 보자."\n\n한 시간 내내 달구지 밑을 기어다니며 잔소리를 했다. 브레이크 밟을 때 삐걱대지? 그거 원래 그래. 고치지 마. 그 소리 나야 이 차야.\n\n헤어질 때 고구마 한 봉지를 억지로 안겼다. 값은 커피 두 잔이라고 했다. 외상이라고.', fx:{van:20, food:2, item:{'부품':1}, time:70, moodAll:5, flag:'van_owner_done', note:{type:'인물',title:'대양의 외상 장부',body:'"그 소리 나야 이 차야." 수리비는 커피 두 잔, 외상. 언젠가 갚아야 한다.',links:['달구지','할아버지','정비공 대양']}}}]},
  {label:'"차 좀 봐주시겠어요?" (고철 5)', req:{scrap:5}, out:[{p:1, text:'"고철은 넣어둬. 이 차는 내 간판이야."\n\n결국 고철은 고구마 값이 됐다. 대양은 달구지 밑에서 콧노래를 불렀다. 아는 노래였는데 제목이 끝내 생각나지 않았다.', fx:{scrap:-5, van:18, food:2, time:60, moodAll:4, flag:'van_owner_done', note:{type:'인물',title:'정비공 대양',body:'달구지는 대양의 간판. 고철은 고구마 값이 됐다.',links:['달구지']}}}]},
 ]},

/* ═══════════ v1.3 일반 이벤트 확장 ═══════════ */

/* ── 조우 ── */
{id:'meet_smith', type:'조우', w:8,
 title:'이동 대장간',
 text:'1톤 트럭 짐칸에 화덕을 얹은 이동 대장간. 모루 두드리는 소리가 1km 밖에서부터 들렸다.\n\n"필요한 거 있으면 불 꺼지기 전에 말하쇼. 오늘 장사 접는 중이니까."\n\n수염에 불똥 자국이 점점이 있다.',
 choices:[
  {label:'고철을 벼려달란다 (고철 6)', req:{scrap:6}, out:[{p:1, text:'대장장이가 고철 무더기를 뒤적여 쓸 만한 것만 골라 화덕에 넣었다.\n\n"요즘 고철은 순 양철이야. 옛날 철이 진짜지."\n\n두들겨 나온 것은 묵직한 부품 뭉치. 확실히 물건이 다르다.', fx:{scrap:-6, item:{'부품':2}, time:40, flag:'smith_met', note:{type:'인물',title:'이동 대장장이',body:'트럭 화덕에 모루. 요즘 고철은 순 양철이라고 투덜대는 프로.'}}}]},
  {label:'구경만 한다', out:[{p:1, text:'쇠 두드리는 걸 구경하는 데는 이상한 최면 효과가 있다. 20분이 순삭됐다.\n\n"구경값은 안 받아." 대장장이가 씩 웃었다.', fx:{time:20, moodAll:3, flag:'smith_met'}}]},
 ]},

{id:'meet_postman', type:'조우', w:8, once:true,
 title:'자전거 우편부',
 text:'짐받이에 방수포 꾸러미를 실은 자전거가 마주 온다. 남자의 조끼에 손바느질로 수놓은 글자.\n\n「우편」\n\n"수신인 찾아 여러 해째요. 주소가 다 무너져서, 이젠 이름이랑 얼굴로 배달합니다."',
 choices:[
  {label:'명단을 맞춰본다', out:[
   {p:2, text:'우편부가 손때 묻은 명단을 펼쳤다. 아는 이름은 없었다.\n\n대신 우리가 스친 정착지 이야기를 해줬다. 우편부는 세 개를 받아적고 신이 나서 페달을 밟았다.\n\n"여러 해 묵은 편지가 두 통 줄겠네!"', fx:{moodAll:3, flag:'postman_met', note:{type:'인물',title:'자전거 우편부',body:'주소 대신 이름과 얼굴로 배달한다. 여러 해째 수신인을 찾는 중.'}}},
   {p:1, text:'명단 중간쯤에서 우편부의 손가락이 멈췄다.\n\n"이 사람… 남산 쪽으로 갔다는 소문이 마지막이오."\n\n남산. 우리와 방향이 같은 이름이 하나 있다는 것만 적어뒀다.', fx:{flag:'postman_met', note:{type:'소문',title:'남산으로 간 수신인',body:'우편부의 명단 속 한 사람. 마지막 소문은 남산 방향.',links:['남산']}}}]},
  {label:'물 한 잔 대접한다', out:[{p:1, text:'우편부는 물을 반만 마시고 반은 자전거 체인에 부었다. "얘도 목마르거든."\n\n답례로 어느 고개의 지름길을 알려줬다.', fx:{water:-1, moodAll:2, flag:'postman_met', note:{type:'소문',title:'우편부의 지름길',body:'물 반 잔의 답례. 어느 고개의 지름길.'}}}]},
 ]},

{id:'meet_seedlady', type:'조우', w:7,
 title:'씨앗 도서관',
 text:'경운기를 개조한 수레에 유리병이 빼곡하다. 병마다 라벨. 상추, 열무, 대파, 해바라기.\n\n"씨앗 도서관이에요. 빌려가서, 수확하면 두 배로 반납. 연체료는 없어요. 식물은 기다릴 줄 알거든."',
 choices:[
  {label:'씨앗을 빌린다 (물 2)', out:[{p:1, text:'물 두 통과 상추 씨앗 한 병을 맞바꿨다. 엄밀히는 빌린 거다.\n\n"수확하면 두 배 반납이에요. 어디서든, 누구한테든. 씨앗은 다 연결돼 있으니까."', fx:{water:-2, food:3, moodAll:2, flag:'seed_borrowed', note:{type:'인물',title:'씨앗 도서관',body:'빌려가서 두 배로 반납. 누구한테든. 씨앗은 다 연결돼 있다.'}}}]},
  {label:'좋은 장사 하시라', out:[{p:1, text:'"장사 아니에요, 도서관이에요!" 등 뒤에서 정정하는 소리가 들렸다.', fx:{}}]},
 ]},

{id:'meet_photographer', type:'조우', w:7, once:true, minParty:1,
 title:'결혼사진사',
 text:'폐업한 웨딩홀 앞에 삼각대를 세운 노인. 필름 카메라가 올려져 있다.\n\n"지나가는 사람들 사진 찍어주고 있소. 공짜요. 필름이 아까운 세상이지만— 요즘 사람들 얼굴이 다 마지막 사진이 될 수 있어서."',
 choices:[
  {label:'단체사진을 찍는다', out:[{p:1, text:'달구지 앞에 일렬로 섰다. 보리가 있다면 맨 앞에 앉았다.\n\n"김치— 아니지, 요즘은 뭐라 그러나."\n\n"고철—!" 누가 외쳤고, 셔터가 눌렸고, 다들 진짜로 웃는 순간이 찍혔다.\n\n인화는 못 해주지만 필름은 남는다고 했다. "언젠가 인화소가 다시 생기면 찾으러 오시오."', fx:{time:20, moodAll:6, flag:'photo_film', note:{type:'사건',title:'필름 속의 우리',body:'웨딩홀 앞 단체사진. "고철—!" 인화소가 다시 생기면 찾으러 갈 것.'}}}]},
  {label:'사양한다', out:[{p:1, text:'노인은 강요하지 않았다. 대신 지나가는 달구지를 향해 셔터를 눌렀다.\n\n"차도 얼굴이 있소." 백미러 속에서 노인이 외쳤다.', fx:{moodAll:1}}]},
 ]},

{id:'meet_dogtrainer', type:'조우', w:7, once:true, needsDog:true,
 title:'개 훈련사',
 text:'들판에서 개 다섯 마리와 노는 여자. 호루라기 한 번에 다섯 마리가 일제히 앉는다.\n\n보리가 창문에 매달려 난리가 났다.\n\n"어머, 얘 총명하게 생겼네. 5분만 줘봐요."',
 choices:[
  {label:'보리를 맡겨본다', out:[{p:1, text:'5분 뒤, 보리는 하이파이브를 배웠다.\n\n"원래 아는 애예요, 이거. 시킬 사람이 없었을 뿐이지."\n\n이후로 보리는 아무 때나 하이파이브를 청한다. 거절할 방법은 없다.', fx:{time:15, moodAll:5, flag:'bori_highfive', note:{type:'사건',title:'보리 하이파이브',body:'5분 만에 배웠다. 원래 알던 걸 시킬 사람이 없었을 뿐. 거절 불가.'}}}]},
  {label:'갈 길이 급하다', out:[{p:1, text:'보리가 뒷유리에 붙어 개 다섯 마리를 하염없이 봤다. 오늘 밤 잠꼬대가 요란할 예정이다.', fx:{}}]},
 ]},

{id:'meet_scrapbros', type:'조우', w:7,
 title:'폐차장 형제',
 text:'견인차 한 대가 갓길에 서 있다. 형제로 보이는 둘이 폐차를 해체하는 중이다. 손발이 척척 맞는다.\n\n"부품 필요하쇼? 방금 뜯은 거라 신선합니다."\n\n부품에 신선이라는 말을 쓰는 사람들은 처음 봤다.',
 choices:[
  {label:'부품을 산다 (고철 7)', req:{scrap:7}, out:[
   {p:3, text:'형이 부품을 신문지에 싸주며 덤으로 퓨즈 몇 개를 얹었다.\n\n"단골 되쇼. 우린 매주 이 국도 뜁니다."', fx:{scrap:-7, item:{'부품':2}, note:{type:'인물',title:'폐차장 형제',body:'방금 뜯어 신선한 부품. 매주 이 국도를 뛴다.'}}},
   {p:1, text:'신문지를 풀어보니 부품 하나는 멀쩡, 하나는 금이 가 있다.\n\n돌아봤을 땐 견인차가 이미 점이었다. 신선은 무슨.', fx:{scrap:-7, item:{'부품':1}, moodAll:-2, note:{type:'사건',title:'금 간 부품',body:'폐차장 형제의 신선한 부품, 절반은 불량. 다음엔 현장에서 확인할 것.'}}}]},
  {label:'해체 구경이나 한다', out:[{p:1, text:'둘이 15분 만에 승용차 한 대를 뼈만 남겼다. 무서운 사람들이다.\n\n"차 관리 잘하쇼. 우리 손님 되지 말고." 동생이 웃으며 손을 흔들었다.', fx:{time:15, moodAll:2}}]},
 ]},

/* ── 탐색 ── */
{id:'exp_glasshouse', type:'탐색', w:7,
 title:'살아있는 온실',
 text:'유리 온실 단지. 대부분 깨졌는데 한 동만 멀쩡하다.\n\n가까이 가자 안에서 칙— 소리. 스프링클러가 돌고 있다. 전기가 살아 있다.\n\n유리 너머로 웃자란 토마토가 빨갛다.',
 choices:[
  {label:'조용히 수확한다', out:[
   {p:3, text:'토마토와 오이를 배낭 가득 땄다. 스프링클러가 한 번 더 돌며 등을 적셨지만, 그뿐이었다.\n\n누가— 무엇이— 물을 대는지는 생각하지 않기로 했다. 토마토는 죄가 없다.', fx:{food:4, water:1, note:{type:'사건',title:'살아있는 온실',body:'전기가 살아있는 온실. 누가 물을 대는지는 생각하지 않기로 했다.'}}},
   {p:1, text:'수확 중에 온실 구석 스피커에서 안내음이 나왔다.\n\n"금일 수확량이 기록되었습니다."\n\n토마토를 든 채 다 같이 얼어붙었다. 목소리는 그뿐이었지만, 서둘러 나왔다.', fx:{food:3, pursuit:1, note:{type:'사건',title:'기록된 수확',body:'"금일 수확량이 기록되었습니다." 온실은 관리되고 있었다.',links:['천리안']}}}]},
  {label:'지나친다', out:[{p:1, text:'공짜 토마토엔 대가가 있는 법이다. 이 세상에선 특히.', fx:{}}]},
 ]},

{id:'exp_cafeteria', minParty:1, type:'탐색', w:7,
 title:'급식실',
 text:'폐교 급식실. 어른 몸통만 한 솥 세 개가 나란히 걸려 있다.\n\n식판 수백 장이 건조대에 그대로 꽂혀 있다. 마지막 메뉴판이 아직 걸려 있다.\n\n「카레라이스 / 깍두기 / 요구르트」',
 choices:[
  {label:'창고를 뒤진다', out:[
   {p:2, text:'급식 창고 안쪽에서 업소용 통조림 몇 개와 소금 한 포대를 찾았다.\n\n나오는 길에 누가 메뉴판을 소리 내어 읽었고, 다들 각자의 급식실을 잠깐 다녀왔다.', fx:{food:4, moodAll:2, note:{type:'사건',title:'마지막 메뉴',body:'카레라이스, 깍두기, 요구르트. 각자의 급식실을 잠깐 다녀왔다.'}}},
   {p:1, text:'창고는 먼저 다녀간 사람들이 깨끗이 비웠다. 대신 벽에 분필 글씨.\n\n"잘 먹었습니다. 설거지는 못 했습니다."', fx:{scrap:3, moodAll:1}}]},
  {label:'솥만 탐낸다', out:[{p:1, text:'솥은 탐났지만 차에 실을 크기가 아니다. 뚜껑 하나만 챙겼다. 방패로도, 프라이팬으로도 쓸 수 있는 만능템이다.', fx:{scrap:4}}]},
 ]},

{id:'exp_overturned', minParty:1, type:'탐색', w:8,
 title:'전복된 화물차',
 text:'커브길에 화물 트럭이 모로 누워 있다. 오래됐다. 짐칸 방수포가 바람에 펄럭인다.\n\n방수포 틈으로 박스들이 보인다. 라벨은 빛에 바래 안 읽힌다.',
 choices:[
  {label:'짐칸을 연다', out:[
   {p:2, text:'라면 박스다. 스무 개들이 세 박스.\n\n유통기한은 오래 지났지만 라면의 유통기한은 마음의 문제라는 데 전원이 합의했다.', fx:{food:5, moodAll:3, note:{type:'사건',title:'라면 대박',body:'전복 화물차에서 라면 세 박스. 유통기한은 마음의 문제.'}}},
   {p:1, text:'박스를 여는 순간 웅— 소리가 났다.\n\n벌집이다. 짐칸 안쪽이 통째로 벌 아파트가 됐다. 전력 질주로 후퇴했고, 한 명이 두 방 쏘였다.\n\n그래도 입구 쪽 박스 하나는 건졌다. 안에는 부탄가스. …벌은 왜 하필 거기에.', fx:{food:1, fatigue:6, moodAll:-2, item:{'부품':1}}}]},
  {label:'건드리지 않는다', out:[{p:1, text:'오래 누워 있는 것들은 그대로 두는 게 예의다. 사람이든 트럭이든.', fx:{}}]},
 ]},

{id:'exp_arcade', type:'탐색', w:6,
 title:'오락실',
 text:'간판 절반이 떨어진 오락실. 「크… 게임랜드」.\n\n전기가 없으니 기계들은 다 죽었다. 하지만 안쪽에서 통통— 소리가 난다.\n\n에어하키 테이블. 전기 없이도 퍽은 밀 수 있다. 웬 노인 둘이 조용히, 그러나 살벌하게 겨루는 중이다.',
 choices:[
  {label:'도전한다', out:[
   {p:1, text:'승자 노인과 붙었다. 참패였다. 여러 해 내공은 이길 수 없다.\n\n"젊은 사람이 손목 힘만 쓰네. 허리로 미는 거야, 허리로."\n\n두 판째는 6:7. 아깝게 졌지만 박수를 받았다. 상품이라며 사탕 두 알을 받았다.', fx:{time:40, moodAll:5, food:1, note:{type:'사건',title:'에어하키 도장',body:'전기 없는 오락실의 고수들. 허리로 미는 것이다. 6:7 석패.'}}}]},
  {label:'인형뽑기 기계를 턴다', out:[{p:1, text:'유리를 조심스레 들어내고 인형 하나를 회수했다. 여러 해 묵은 곰인형이다.\n\n"이건 실력으로 뽑은 걸로 치자." 아무도 동의하지 않았지만 곰은 대시보드에 앉았다.', fx:{moodAll:3, note:{type:'사건',title:'대시보드 곰',body:'인형뽑기에서 실력으로(?) 회수한 곰. 달구지 대시보드 정식 승무원.'}}}]},
 ]},

/* ── 동행 ── */
{id:'comp_rps', type:'동행', w:6, minParty:2,
 title:'가위바위보 대회',
 text:'휴게소 그늘에서 점심을 먹고, 누가 설거지를 하느냐로 제1회 달구지배 가위바위보 대회가 개최됐다.\n\n토너먼트 대진표까지 유리창에 그렸다. 쓸데없이 진지하다.',
 choices:[
  {label:'정정당당히 임한다', out:[
   {p:1, text:'결승에서 3연속 비긴 끝에 내가 졌다.\n\n설거지하는 등 뒤에서 다들 다음 대회 조 편성을 논의했다. 이 대회, 정례화될 분위기다.', fx:{time:25, moodAll:5, note:{type:'사건',title:'제1회 달구지배',body:'설거지를 건 가위바위보 토너먼트. 결승 3연속 무승부 끝에 패배. 정례화 조짐.'}}},
   {p:1, text:'우승했다. 그늘에 누워 남들 설거지하는 소리를 듣는 낮잠은 각별했다.\n\n다음 대회부터 우승자는 대진표 작성 담당이라는 규정이 신설됐다. 견제가 들어왔다.', fx:{time:25, moodAll:5}}]},
 ]},

{id:'comp_hometown', type:'동행', w:6, minParty:2,
 title:'지명 퀴즈',
 text:'조수석에서 낡은 전국 지도를 펴 들고 퀴즈가 시작됐다.\n\n"가본 데 나오면 손. 거짓말하면 저녁 굶기."\n\n손이 제일 많이 올라간 곳은 다들 수학여행으로 스친 경주였다.',
 choices:[
  {label:'계속 듣는다', out:[{p:1, text:'지도 위 손가락들이 각자의 옛날을 짚었다. 이모네 동네, 군대, 첫 출장, 수학여행.\n\n"서울 가본 사람?" 손이 반만 올라갔다.\n\n"곧 다 가보겠네." 누가 말했고, 지도가 조용히 접혔다.', fx:{moodAll:4, note:{type:'사건',title:'지명 퀴즈',body:'지도 위에 각자의 옛날을 짚었다. "서울 가본 사람?" — 곧 다 가보겠네.'}}}]},
 ]},

{id:'comp_satellite', type:'동행', w:6, night:true, needsComp:'eunsu',
 title:'아직 도는 것',
 text:'밤, 별을 보러 잠깐 차를 세운 사이— 은수가 하늘을 보다가 손가락을 들었다.\n\n"저기. 별 아닌 거 하나 지나가요."\n\n작은 빛점이 일정한 속도로 하늘을 긋는다.\n\n"인공위성이에요. 관제할 사람이 없어졌는데도 아직 돌아요. 시키던 일을 계속하는 거예요."',
 choices:[
  {label:'끝까지 지켜본다', out:[{p:1, text:'빛점이 능선 너머로 사라질 때까지 다들 목을 꺾고 봤다.\n\n"외롭겠다." 누가 말하자 은수가 고개를 저었다.\n\n"아뇨. 쟤는 지금도 지구를 90분에 한 바퀴씩 안고 있는 거예요."\n\n관제사 출신의 위로는 스케일이 달랐다.', fx:{moodAll:4, mood:{eunsu:4}, note:{type:'사건',title:'아직 도는 것',body:'주인 잃은 위성. 은수 왈, 지금도 90분에 한 바퀴씩 지구를 안는 중.',links:['은수']}}}]},
 ]},

{id:'comp_bori_dream', minParty:1, type:'동행', w:6, needsDog:true, night:true,
 title:'보리의 꿈',
 text:'모닥불이 사그라들 무렵, 잠든 보리의 다리가 달리기 시작했다.\n\n타닥. 타다닥. 허공을 짚는 네 발. 낮게 낑낑대는 소리.\n\n"꿈에서 달리네."',
 choices:[
  {label:'지켜본다', out:[{p:1, text:'"어디를 달리는 걸까."\n\n"들판이었으면 좋겠다. 쫓기는 게 아니라."\n\n보리의 꼬리가 자면서 두 번 흔들렸다. 좋은 꿈인 걸로 결론 났다. 회의는 만장일치였다.', fx:{moodAll:3, note:{type:'사건',title:'보리의 꿈',body:'잠결에 달리는 네 발. 꼬리가 두 번 흔들려서 좋은 꿈으로 만장일치 판정.'}}}]},
  {label:'담요를 덮어준다', out:[{p:1, text:'담요가 닿자 다리가 멈추고, 보리는 깊은 숨을 쉬었다.\n\n꿈속 들판에 담요가 도착한 모양이다.', fx:{moodAll:3, mood:{leo:3}}}]},
 ]},

/* ── 추적/위기 ── */
{id:'ai_streetlight', type:'추적', w:6, night:true,
 title:'켜지는 가로등',
 text:'죽은 지 여러 해 된 국도 가로등이— 달구지가 지나가는 순서대로 켜진다.\n\n앞이 밝아지고, 지나온 뒤는 다시 어두워진다.\n\n배웅인가, 감시인가. 아니면 둘 다인가.',
 choices:[
  {label:'불빛을 따라간다', out:[
   {p:2, text:'가로등은 십 리를 따라오다가 어느 순간 더 켜지지 않았다.\n\n마지막 가로등이 등 뒤에서 오래 깜빡였다. 손 흔드는 것 같기도, 셔터 소리 같기도 했다.', fx:{note:{type:'사건',title:'켜지는 가로등',body:'지나가는 순서대로 켜지던 국도 가로등. 배웅 같기도 촬영 같기도 했다.',links:['천리안']}}},
   {p:1, text:'불빛은 편했다. 편한 게 문제였다. 밝은 길은 잘 보이는 길이다— 저쪽에서도.', fx:{pursuit:1, note:{type:'사건',title:'밝은 길의 값',body:'가로등이 밝혀준 길. 잘 보이는 길은 저쪽에서도 잘 보인다.',links:['천리안']}}}]},
  {label:'전조등을 끄고 갓길로 우회한다', out:[{p:1, text:'어둠 속을 기어서 가로등 구간을 벗어났다. 뒤돌아보니 불 켜진 빈 도로가 무대처럼 남아 있었다.\n\n주인공 없이 켜진 무대는 좀 무서웠다.', fx:{time:25, fatigue:4}}]},
 ]},

{id:'ai_vending', minParty:1, type:'추적', w:6,
 title:'살아있는 자판기',
 text:'폐 정류장 옆 자판기에 불이 들어와 있다.\n\n가까이 가자 자판기가 스스로 덜컹, 캔 하나를 내놨다. 이온음료다. 유통기한도 안 지났다.\n\n화면에 글자가 떠 있다. "수고하셨습니다."',
 choices:[
  {label:'받는다', out:[{p:1, text:'캔은 시원했다. 여러 해 동안 누가 채워 넣고 누가 전기를 댔는지 생각하면 안 시원했다.\n\n두 캔째가 나왔을 때 다들 차로 뛰었다. 공짜가 무서운 세상이다.', fx:{water:2, pursuit:1, note:{type:'사건',title:'수고하셨습니다',body:'스스로 음료를 내놓는 자판기. 두 캔째에서 전원 도주. 공짜가 무섭다.',links:['천리안']}}}]},
  {label:'받지 않는다', out:[{p:1, text:'자판기 불빛이 멀어질 때까지 화면의 글자는 바뀌지 않았다.\n\n"수고하셨습니다."\n\n누구한테 하는 말이었을까.', fx:{}}]},
 ]},

{id:'vg_cicada', type:'정경', w:4,
 title:'매미',
 text:'창문을 열고 달리는데 소리가 밀려들어왔다.\n\n맴— 맴— 맴—\n\n온 산이 울리고 있다. 오래전에도, 30년 전에도 나던 소리다.',
 choices:[{label:'…', out:[{p:1, text:'매미는 문명이 있는 줄도 몰랐고, 없어진 줄도 모른다.\n\n그게 이상하게 든든해서, 오래 창문을 안 닫았다.', fx:{moodAll:2}}]}]},

{id:'vg_swallows', type:'정경', w:4,
 title:'육교 밑 제비집',
 text:'반쯤 무너진 육교 아래를 지난다.\n\n부러진 철근 사이, 제비집 세 채. 새끼들 주둥이가 노랗게 벌어져 있고 어미가 부지런히 드나든다.\n\n무너진 것 위에 지은 집이다.',
 choices:[{label:'…', out:[{p:1, text:'속도를 늦춰 조용히 통과했다. 남의 집 앞에서는 원래 그러는 거다.', fx:{moodAll:2}}]}]},

{id:'vg_reflectors', type:'정경', w:4, night:true,
 title:'터널의 별자리',
 text:'밤 터널. 헤드라이트가 닿을 때마다 벽면 반사판들이 차례로 빛난다.\n\n앞에서 뒤로 흘러가는 주황 점들. 터널이 통째로 별자리가 된다.',
 choices:[{label:'…', out:[{p:1, text:'"별자리 이름 붙이자."\n\n"국도자리."\n\n"성의 좀."\n\n출구까지 이름 공모는 계속됐다. 당선작은 없었다.', fx:{moodAll:2}}]}]},

{id:'vg_laundry', type:'정경', w:4,
 title:'옥상의 빨래',
 text:'스쳐 지나가는 소도시. 죽은 건물들 사이 한 옥상에 빨래가 널려 있다.\n\n수건 셋, 아이 옷 둘, 어른 옷 둘.\n\n펄럭인다. 산다는 신호다.',
 choices:[{label:'…', out:[{p:1, text:'경적을 아주 짧게, 한 번 울렸다.\n\n옥상에서 누가 손을 흔들었는지는 못 봤다. 봤다고 치기로 했다.', fx:{moodAll:2}}]}]},

{id:'vg_traincross', minParty:1, type:'정경', w:3,
 title:'건널목',
 text:'녹슨 철도 건널목. 지나려는 순간—\n\n땡. 땡. 땡.\n\n차단기가 내려온다. 다들 반사적으로 철로 양쪽을 봤다. 기차는 없다. 오랫동안 없다.',
 choices:[{label:'…', out:[{p:1, text:'차단기는 2분을 성실하게 막고 나서 올라갔다.\n\n"방금 우리, 유령 기차 보내준 거야?"\n\n농담이었는데 아무도 안 웃었다. 대신 다들 창밖으로 빈 철로를 한 번 더 봤다.', fx:{time:2}}]}]},

{id:'vg_milestone300', type:'정경', w:3, region:['mid'],
 title:'이정표',
 text:'초록 이정표가 다가온다.\n\n「서울 300km」\n\n차 안이 잠깐 조용해졌다.',
 choices:[{label:'…', out:[{p:1, text:'100km를 왔거나, 300km가 남았거나.\n\n"반의 반의 반은 왔네." 수학은 틀렸지만 정정하는 사람은 없었다.', fx:{moodAll:1}}]}]},

{id:'vg_priceboard', minParty:1, type:'정경', w:3,
 title:'가격판',
 text:'폐 주유소 가격판이 아직 서 있다.\n\n휘발유 1,587. 경유 1,402.\n\n그날 아침의 물가가 화석처럼 박제돼 있다.',
 choices:[{label:'…', out:[{p:1, text:'"싸다." 누가 말했다.\n\n지금 연료 시세는 리터당 고철 반 덩이. 화폐가 바뀐 세상에서 옛날 숫자는 이상하게 애틋하다.', fx:{}}]}]},

{id:'vg_schoolbus', type:'정경', w:3,
 title:'노란 버스',
 text:'길가에 노란 유치원 버스가 서 있다. 바퀴 넷이 다 주저앉았고, 차체를 나팔꽃 덩굴이 감았다.\n\n보라색 꽃이 노란 철판 위에 만발했다.',
 choices:[{label:'…', out:[{p:1, text:'식물은 슬픈 걸 모르고 그냥 예쁘게 자란다.\n\n그게 식물의 위로 방식인지도 모른다.', fx:{moodAll:1}}]}]},

/* ── 날씨 ── */
{id:'wx_maskseller', minParty:1, type:'조우', w:8, needWx:'dust',
 title:'마스크 장수',
 text:'황사로 주황색이 된 세상. 고글에 방독면을 쓴 사람이 손수레를 밀고 온다.\n\n수레 가득 마스크와 고글. "황사 특수요! 오늘만 이 가격!"\n\n부지런한 사람이다. 이 세상에도 대목이 있다.',
 choices:[
  {label:'고글을 산다 (고철 4)', req:{scrap:4}, out:[{p:1, text:'운전자용 고글 하나를 샀다. 시야가 살 만해졌다.\n\n"단골 도장 찍어드려요. 황사 열 번이면 방독면 하나 공짜!"\n\n그 도장 다 찍을 때까지 이 세상은 몇 번이나 주황색이 될까.', fx:{scrap:-4, moodAll:2, note:{type:'인물',title:'마스크 장수',body:'황사가 대목. 단골 도장 10개면 방독면 공짜.'}}}]},
  {label:'흥정 없이 지나간다', out:[{p:1, text:'"저기요! 눈 버려요 눈!" 장수의 외침이 황사 속으로 사라졌다.\n\n맞는 말이라서 다들 눈을 가늘게 떴다.', fx:{}}]},
 ]},

{id:'wx_fogbell', type:'발견', w:7, needWx:'fog', once:true,
 title:'안개 속의 방울',
 text:'우유 같은 안개. 시야 20m.\n\n어디선가 따르릉. 따르릉. 자전거 방울 소리가 안개 속을 돈다.\n\n소리는 가까워졌다 멀어졌다 한다. 모습은 끝내 보이지 않는다.',
 choices:[
  {label:'경적으로 답한다', out:[{p:1, text:'빵. 짧게 한 번.\n\n따르릉따르릉— 방울이 신나게 답했다. 그리고 소리는 점점 멀어져 안개 저쪽으로 사라졌다.\n\n서로 못 봤지만, 인사는 인사다.', fx:{moodAll:3, note:{type:'사건',title:'안개 속 인사',body:'자전거 방울과 경적의 대화. 서로 못 봤지만 인사는 인사.'}}}]},
  {label:'조용히 지나간다', out:[{p:1, text:'방울 소리는 오래도록 따라오다 어느 갈림길에서 사라졌다.\n\n안개 걷힌 세상 어딘가에 자전거 탄 사람이 하나 있을 것이다.', fx:{}}]},
 ]},

{id:'wx_underpass', minParty:1, type:'조우', w:8, needWx:'storm',
 title:'고가 밑의 선객들',
 text:'폭풍이 심해져 고가도로 밑으로 피했다.\n\n먼저 온 차가 두 대. 트럭 노부부와 오토바이 청년이 각자 비를 긋고 있다.\n\n노부부가 버너에 냄비를 올리며 이쪽을 본다. "라면 드슈? 어차피 물은 넉넉해."',
 choices:[
  {label:'합석한다 (식량 1 보탠다)', out:[{p:1, text:'폭우 소리를 지붕 삼아 라면 회식이 벌어졌다.\n\n노부부는 남쪽으로, 청년은 동쪽으로, 우리는 북쪽으로 간다고 했다. 아무도 왜냐고 묻지 않았다. 좋은 식사 예절이다.\n\n비가 잦아들자 각자 시동을 걸었다. "조심들 가슈." 그게 끝이었고, 그거면 충분했다.', fx:{food:-1, moodAll:5, time:50, note:{type:'사건',title:'고가 밑 라면 회식',body:'폭풍 대피소의 합석. 남쪽, 동쪽, 북쪽. 아무도 왜냐고 묻지 않았다.'}}}]},
  {label:'차에서 기다린다', out:[{p:1, text:'와이퍼를 끄고 폭우가 유리를 두드리는 걸 구경했다. 고가 밑 라면 냄새가 끝까지 고소했다.', fx:{time:40}}]},
 ]},

{id:'wx_worms', minParty:1, type:'조우', w:7, needRain:true, needsDog:true,
 title:'지렁이 구조단',
 text:'비 갠 틈, 휴게소 아스팔트에 지렁이 수십 마리가 올라와 있다. 해가 나면 다 마른다.\n\n보리가 코를 대고 킁킁대더니 한 마리를 조심스레 물어 화단에 놨다.\n\n…지금 저거 구조한 건가.',
 choices:[
  {label:'구조 작전에 동참한다', out:[{p:1, text:'전원이 쭈그려 앉아 지렁이를 화단으로 옮겼다. 집계 34마리. 최다 구조는 보리(9마리).\n\n"우리 지금 세상을 구했어." 과장이지만 정정하지 않았다. 34마리분의 세상은 구했으니까.', fx:{time:15, moodAll:4, note:{type:'사건',title:'지렁이 구조 작전',body:'빗길 지렁이 34마리 화단 이송. MVP는 보리(9마리).'}}}]},
  {label:'갈 길을 간다', out:[{p:1, text:'보리만 두 마리를 더 옮기고 아쉬운 얼굴로 탑승했다.\n\n백미러 속 아스팔트에 남은 지렁이들에게 다들 잠깐 미안해했다.', fx:{}}]},
 ]},

/* ── 밤 ── */
{id:'night_lanterns', minParty:1, type:'발견', w:5, night:true, once:true,
 title:'강 건너 등불',
 text:'밤. 강 건너에서 불빛 여남은 개가 하늘로 떠오른다.\n\n풍등이다. 주황 불빛들이 바람을 타고 천천히, 비뚤비뚤 올라간다.\n\n강 건너 어딘가에서 누군가들이 소원을 빌고 있다.',
 choices:[
  {label:'우리도 하나 띄운다', out:[{p:1, text:'종이와 철사와 양초 토막으로 삐뚤한 풍등을 만들었다.\n\n소원은 각자 마음속으로. 말하면 안 이뤄진다는 규칙은 이 세상에서도 유효하다.\n\n우리 풍등은 강 건너 무리에 합류해 같이 올라갔다. 저쪽에서 보면 하나 늘어난 걸 알까.', fx:{time:30, moodAll:5, scrap:-1, note:{type:'사건',title:'풍등 하나 추가',body:'강 건너 소원 무리에 익명으로 합류. 소원은 말하면 안 이뤄지므로 비공개.'}}}]},
  {label:'바라만 본다', out:[{p:1, text:'등불들이 다 꺼질 때까지 시동을 안 걸었다.\n\n소원이 하늘에 닿는 데 걸리는 시간만큼.', fx:{moodAll:2}}]},
 ]},

{id:'night_djradio', type:'발견', w:5, night:true, once:true,
 title:'심야 방송',
 text:'밤 주행 중 라디오가 지직— 하더니 음악이 나온다.\n\n올드팝. 그리고 나긋한 목소리.\n\n"…새벽 두 시입니다. 아직 길 위에 계신 분들, 오늘도 수고 많으셨습니다. 다음 곡 듣겠습니다."\n\n생방송인지 녹음인지 알 수 없다. 알고 싶지 않다.',
 choices:[
  {label:'끝까지 듣는다', out:[{p:1, text:'세 곡이 나오고 방송은 잡음 속으로 사라졌다.\n\n"내일 이 시간에 다시 만나요"라는 클로징 멘트가 있었다. 내일 이 시간에 우리는 다른 주파수 위를 달리고 있겠지만, 어딘가에서 누가 대신 들을 것이다.', fx:{moodAll:3, flag:'djradio_heard', note:{type:'소문',title:'새벽 두 시의 DJ',body:'올드팝과 나긋한 목소리. 생방송인지 녹음인지 알 수 없고, 알고 싶지 않다.'}}}]},
 ]},

/* ── 천리안 풍문 (v1.3.2 — 소식은 사람을 타고 온다) ── */
{id:'meet_southbound', minParty:1, type:'조우', w:9, once:true, region:['mid','north'],
 title:'남쪽으로 가는 사람들',
 text:'반대 차선에 짐수레 행렬이 지나간다. 남쪽으로. 우리와 반대 방향으로.\n\n행렬 끝의 남자가 손을 들어 우리를 세웠다.\n\n"북쪽 가쇼? …돌아가란 말은 안 하겠소. 대신 들은 건 알려주리다."',
 choices:[
  {label:'북쪽 소식을 듣는다', out:[
   {p:2, text:'"수원 위쪽은 밤마다 도로가 청소된다오. 아침이면 낙엽 하나 없이. 누가 하는지는… 알잖소."\n\n"그리고 한강 다리는 하나만 남았소. 이상하리만치 멀쩡한 게 딱 하나. 건너라고 남겨둔 것처럼."\n\n행렬이 다시 움직였다. 아이 하나가 수레 위에서 우리에게 오래 손을 흔들었다.', fx:{time:15, note:{type:'소문',title:'남하 행렬의 북쪽 소식',body:'밤마다 청소되는 도로. 하나만 남은 한강 다리 — 건너라고 남겨둔 것처럼.',links:['천리안','한강']}}},
   {p:1, text:'"서울 하늘에 빛기둥이 섰다는 사람도 있고, 아무것도 없다는 사람도 있고. 소문이란 게 그렇지."\n\n"확실한 건 하나요. 올라간 사람은 많은데, 내려온 사람은 우리가 처음이오."\n\n그 말이 차 안에 오래 남았다.', fx:{time:15, moodAll:-2, note:{type:'소문',title:'내려온 사람들',body:'"올라간 사람은 많은데 내려온 사람은 우리가 처음이오." 서울 하늘의 빛기둥 소문.',links:['천리안','남산']}}}]},
  {label:'물 한 통을 건네고 듣는다', out:[{p:1, text:'물을 받은 남자가 목소리를 낮췄다.\n\n"이건 아무한테나 안 하는 말인데— 북쪽 검문에서 이상한 걸 물어봅디다. 어디서 왔냐, 몇 명이냐가 아니라… \'무엇을 싣고 왔냐\'고."\n\n"수레를 다 뒤지곤 그냥 보내줬소. 뭘 찾는 건지."\n\n짐칸의 라면박스와 책과 고철을 다들 한 번씩 돌아봤다.', fx:{water:-1, time:15, note:{type:'소문',title:'무엇을 싣고 왔냐',body:'북쪽 검문의 질문. 사람이 아니라 짐을 본다. 뭘 찾는 걸까.',links:['천리안']}}}]},
  {label:'목례만 하고 지나친다', out:[{p:1, text:'반대 방향으로 가는 사람들과는 인사가 짧다. 서로의 선택을 존중하는 것 말고는 할 수 있는 게 없으니까.', fx:{}}]},
 ]},

{id:'exp_chalkwall', needsDog:true, minParty:1, type:'탐색', w:7, once:true,
 title:'소식벽',
 text:'고가도로 기둥이 온통 분필 글씨다.\n\n「소식벽 — 지우지 마시오. 분필은 밑에.」\n\n여행자들이 남긴 뉴스가 기둥 세 개를 채웠다. 날짜 순도, 중요도 순도 아니다. 그냥 사람들이 전하고 싶었던 것들.',
 choices:[
  {label:'천천히 읽는다', out:[{p:1, text:'"구미 위 검문 서쪽으로 옮김 (지난달)" / "대전 시장에 소금 들어옴" / "흰 옷들이 노래를 부르며 북상함" / "천리안이 꿈에 나옴. 정중했음. 소름" / "미영아 아빠는 남쪽으로 간다"\n\n마지막 줄 앞에서 다들 잠깐 조용해졌다.\n\n제일 아래, 최근 글씨: "봉고차 한 대가 북쪽으로 갔다는 소문. 무사하길."\n\n…우리 얘기인가. 아니면 우리 같은 누군가.', fx:{time:20, moodAll:2, note:{type:'소문',title:'소식벽',body:'분필로 쓰는 뉴스. 서쪽으로 옮긴 검문, 북상하는 흰 옷들, 그리고 "봉고차 한 대가 북쪽으로 갔다는 소문. 무사하길."',links:['천리안','정리자들']}}}]},
  {label:'우리도 한 줄 남긴다', out:[{p:1, text:'분필을 집어 들고 잠시 고민하다가 썼다.\n\n"남쪽에서 온 봉고차. 북쪽으로 감. 다들 무사하시오."\n\n누가 밑에 보리 발바닥을 찍자고 해서, 정말 찍었다. 소식벽 최초의 서명 날인이다.', fx:{time:15, moodAll:4, flag:'chalkwall_signed', note:{type:'사건',title:'소식벽에 남긴 한 줄',body:'"남쪽에서 온 봉고차. 북쪽으로 감. 다들 무사하시오." 보리 발바닥 도장 포함.'}}}]},
 ]},

{id:'vg_northglow', minParty:1, type:'정경', w:4, night:true, region:['south','mid'],
 title:'북쪽의 빛',
 text:'밤. 능선 너머 북쪽 하늘이 희미하게 밝다.\n\n노을은 아니다. 노을은 서쪽이고, 지금은 밤이다.\n\n도시의 불빛도 아니다. 도시는 죽었다.',
 choices:[{label:'…', out:[{p:1, text:'"저기가 서울인가."\n\n누가 물었고 아무도 대답하지 않았다. 대답 대신 다들 그 빛을 조금 오래 봤다.\n\n우리는 저 빛을 향해 가고 있다.', fx:{}}]}]},

/* ═══════════ v1.4 대확장 ═══════════ */

/* ── 체인: 두리 서커스 (3) ── */
{id:'circus_meet', type:'조우', w:9, once:true,
 title:'길 위의 서커스',
 text:'국도변 공터에 색 바랜 줄무늬 천막이 서 있다. 손글씨 현수막.\n\n「두리 서커스 — 오늘 저녁 공연. 입장료: 고철 2, 아이는 웃음 한 번」\n\n천막 앞에서 남매로 보이는 둘이 저글링 연습 중이고, 백발 노인이 낡은 나팔을 닦고 있다.\n\n"손님이오!" 소녀가 핀 세 개를 공중에 띄운 채 소리쳤다.',
 choices:[
  {label:'공연을 본다 (고철 2)', req:{scrap:2}, out:[{p:1, text:'관객은 우리뿐이었다. 그런데도 3인은 만석 공연처럼 뛰었다.\n\n소년의 외줄, 소녀의 저글링(핀 다섯 개, 하나는 프라이팬), 단장의 나팔 반주. 마지막엔 관객 참여 순서까지 있었다. 곡예사의 손바닥을 마주치는 하이파이브 곡예다.\n\n"세상이 이래도 서커스는 남아야 해." 단장이 모자를 벗어 인사했다. "웃음은 배급이 안 되거든."', fx:{scrap:-2, time:80, moodAll:7, flag:'circus_met', note:{type:'인물',title:'두리 서커스',body:'남매 곡예사와 나팔 부는 단장. 입장료 고철 2, 아이는 웃음 한 번. "웃음은 배급이 안 되거든."'}}}]},
  {label:'박수만 치고 간다', out:[{p:1, text:'연습 저글링에 박수를 보냈더니 소녀가 허리 숙여 인사했다. 소년이 "공연은 저녁인데!" 하고 억울해했다.\n\n갈 길이 멀었다. 아쉬움도 실었다.', fx:{moodAll:2, flag:'circus_met'}}]},
 ]},

{id:'circus_broke', type:'조우', w:12, once:true, needFlag:'circus_met',
 title:'멈춘 서커스',
 text:'낯익은 줄무늬가 보인다. 두리 서커스다. 그런데 천막이 아니라— 트럭 보닛이 열려 있다.\n\n단장이 엔진룸에 머리를 박고 있고, 남매는 갓길에 핀을 늘어놓고 앉아 있다.\n\n"아, 그때 그 손님들!" 소녀가 벌떡 일어났다. "차가… 안 일어나요."',
 choices:[
  {label:'민지가 나선다', req:{comp:'minji'}, out:[{p:1, text:'민지가 엔진룸을 3분 들여다보고 진단을 내렸다. "연료펌프. 죽진 않았고 기절."\n\n30분 뒤 트럭이 부르릉— 깨어나자 남매가 환호하며 옆돌기를 돌았다. 단장은 수리비 대신 나팔로 팡파레를 불어줬다.\n\n"북쪽으로 가신다고? 그럼 또 만나겠구먼. 우리도 위로 올라가며 공연할 거니까."', fx:{time:40, mood:{minji:4}, moodAll:4, flag:'circus_helped', note:{type:'사건',title:'서커스 구조',body:'연료펌프 기절 → 민지가 소생. 수리비는 나팔 팡파레.'}}}]},
  {label:'부품을 내준다 (부품 1)', req:{item:'부품'}, out:[{p:1, text:'부품과 두 시간의 씨름 끝에 트럭이 깨어났다.\n\n단장이 대가라며 낡은 나팔을 내밀었다. 3대째 물려온 거라 했다. 정중히 거절하자, 대신 소녀가 프라이팬 저글링 1일 강습권을 발행했다. 종이에 크레용으로 쓴 진짜 강습권이다.\n\n대시보드 곰 옆에 강습권이 붙었다.', fx:{item:{'부품':-1}, time:110, moodAll:4, flag:'circus_helped', note:{type:'사건',title:'저글링 강습권',body:'수리 대가로 받은 크레용 강습권. 3대째 나팔은 정중히 거절.'}}}]},
  {label:'남매에게 물과 식량만 주고 간다', out:[{p:1, text:'"동쪽 마을에 정비 잘하는 데가 있대요." 아는 소문을 다 털어주고, 물과 빵을 내렸다.\n\n"공연으로 갚을게요!" 소녀가 외쳤다. 백미러 속에서 소년이 물병을 들고 완벽한 옆돌기를 돌았다.', fx:{water:-1, food:-1, moodAll:2, flag:'circus_helped'}}]},
 ]},

{id:'circus_final', type:'조우', w:12, once:true, needFlag:'circus_helped', region:['mid','north'],
 title:'마지막 공연',
 text:'폐교 운동장에 줄무늬 천막이 서 있다. 두리 서커스— 그런데 현수막이 다르다.\n\n「고별 공연 — 입장료 없음」\n\n단장이 우리를 알아보고 모자를 벗었다.\n\n"단장 은퇴 공연이오. 나팔 불 폐활량이 다 됐어. 애들은… 더 가르칠 게 없고." 노인이 웃었다. "관객이 와줘서 다행이야. 고별 공연에 관객이 없으면 그건 그냥 짐 싸는 거거든."',
 choices:[
  {label:'맨 앞줄에 앉는다', out:[{p:1, text:'생애 최고의 공연이었다. 과장이 아니라, 이 세상에 남은 공연 자체가 몇 없으니까.\n\n마지막 순서에서 단장은 나팔을 소년에게, 모자를 소녀에게 씌웠다.\n\n"두리 서커스 2대. 첫 공연은 북쪽 어딘가." 소녀가 모자를 고쳐 쓰고 우리를 가리켰다. "저 봉고차 따라가면 관객은 있겠네."\n\n헤어질 때 단장이 악수를 청했다. "웃음 배급, 부탁하네. 자네들도 배급소야. 모르고 있겠지만."', fx:{time:100, moodAll:9, flag:'circus_done', note:{type:'사건',title:'고별 공연',body:'나팔은 소년에게, 모자는 소녀에게. 2대 두리 서커스의 첫 공연은 북쪽 어딘가. "자네들도 배급소야."',links:['두리 서커스']}}}]},
 ]},

/* ── 체인: 우편부의 부탁 (postman_met 후속) ── */
{id:'postman_again', type:'조우', w:11, once:true, needFlag:'postman_met', region:['mid','north'],
 title:'가벼워진 가방',
 text:'자전거 방울 소리. 그 우편부다.\n\n"어! 차!" 우편부가 급브레이크를 잡았다. 짐받이의 꾸러미가 눈에 띄게 얇아졌다.\n\n"명단이 줄었소. 여러 해 묵은 게 두 통 남았는데— 하나가 문제요. 수신인이 남산 쪽이란 말이지. 거긴 자전거로는…"\n\n우편부가 우리를 본다. 차를 본다. 다시 우리를 본다.',
 choices:[
  {label:'편지를 맡는다', out:[{p:1, text:'"이러면 안 되는데. 배달은 끝까지 하는 게 원칙인데."\n\n말은 그렇게 하면서 우편부는 편지를 세 겹 방수포에 싸서 건넸다. 받는 이: 서울, 남산 아래, 김 O O.\n\n"전하면— 아니, 전할 수 있으면, 그걸로 됐다고 해주시오. 오래 걸렸다고는 말고."\n\n조수석 서랍 제일 안쪽에 편지가 실렸다. 차가 조금 무거워진 기분이 들었다. 좋은 무거움이다.', fx:{item:{'남산행 편지':1}, flag:'postman_letter', moodAll:3, note:{type:'소문',title:'남산행 편지',body:'우편부의 마지막에서 두 번째 편지. 수신인은 남산 아래 김OO. "오래 걸렸다고는 말고."',links:['남산']}}}]},
  {label:'"원칙대로 하시오"', out:[{p:1, text:'"…그렇지. 배달은 끝까지." 우편부가 오히려 후련한 얼굴로 페달을 밟았다.\n\n"남산에서 봅시다!" 방울 소리가 북쪽으로 멀어졌다.\n\n자전거로 남산까지. 저 사람은 정말 갈 것이다. 그게 이상하게 든든했다.', fx:{moodAll:2, note:{type:'인물',title:'끝까지 가는 우편부',body:'배달은 끝까지가 원칙. 자전거로 남산까지. 정말 갈 사람.'}}}]},
 ]},

/* ── 체인: 씨앗 반납 (2) ── */
{id:'seed_harvest', type:'탐색', w:10, once:true, needFlag:'seed_borrowed',
 title:'빌린 씨앗',
 text:'정차한 김에 씨앗 봉투를 열었다. 흙 좋은 밭 한 뙈기가 마침 눈앞에 있다. 주인 없는 밭은 아니다— 주인이 없어진 밭이다.\n\n"수확하면 두 배로 반납이에요." 그 목소리가 생각났다.',
 choices:[
  {label:'심고 간다', out:[{p:1, text:'고랑을 내고 씨앗 반을 심었다. 어차피 우리는 못 거둔다. 북쪽으로 가니까.\n\n대신 팻말을 세웠다. "상추. 아무나 드세요. 씨는 받아서 남쪽 씨앗 도서관에."\n\n씨앗 도서관의 대출 시스템이 우리를 지나쳐 무한히 뻗어가는 순간이었다.', fx:{time:40, moodAll:4, flag:'seed_grown', note:{type:'사건',title:'지나가는 농사',body:'못 거둘 밭에 씨를 심고 팻말을 세웠다. 대출은 이렇게 연장된다.'}}}]},
  {label:'지붕 텃밭에 심는다', req:{flag:'seed_borrowed'}, out:[{p:1, text:'달구지 지붕 텃밭 구석에 상추 씨를 심었다. 달리는 밭 입주 완료.\n\n"이제 우리 차 주소가 생겼네. 상추 사는 집."\n\n물 줄 손이 여럿인 상추는 세상에 흔치 않다. 과보호가 예상된다.', fx:{time:15, moodAll:3, flag:'seed_grown', note:{type:'사건',title:'달리는 상추',body:'지붕 텃밭에 입주한 상추. 물 줄 손이 여럿이라 과보호가 예상된다.'}}}]},
 ]},

{id:'seed_return', type:'조우', w:11, once:true, needFlag:'seed_grown',
 title:'반납',
 text:'낯익은 경운기 수레— 씨앗 도서관이다. 유리병들이 챙, 챙, 부딪히는 소리까지 그대로다.\n\n"어머, 그 차!" 아주머니가 우리를 기억했다. "상추는요?"',
 choices:[
  {label:'수확분과 씨앗을 반납한다', out:[{p:1, text:'지붕에서 키운 상추와 받아둔 씨앗을 두 배로 세어 반납했다. 아주머니가 장부(공책이다)에 적었다.\n\n"연체 없이 반납. 우량 회원." 도장까지 찍어줬다. 감자 도장이다.\n\n"다음 권도 빌려가요." 이번엔 해바라기 씨를 받았다. 도서관의 신간이라고 했다.', fx:{food:-1, moodAll:5, flag:'seed_returned', note:{type:'사건',title:'우량 회원',body:'두 배 반납 완료, 감자 도장 획득. 신간(해바라기)도 대출.',links:['씨앗 도서관']}}}]},
  {label:'심고 온 밭 이야기를 한다', out:[{p:1, text:'주인 없는 밭에 심고 팻말을 세웠다고 하자, 아주머니가 잠깐 말을 잃었다.\n\n"…그건 반납이 아니라 기증이네. 그것도 큰 걸로."\n\n장부에 뭐라 길게 적더니 도장을 두 번 찍었다. "특별 회원. 평생 연체료 면제."', fx:{moodAll:5, flag:'seed_returned', note:{type:'사건',title:'특별 회원',body:'지나가는 농사가 기증으로 인정됨. 평생 연체료 면제(감자 도장 2회).',links:['씨앗 도서관']}}}]},
 ]},

/* ── 사진사 후속 (1) ── */
{id:'photo_delivered', needsDog:true, type:'조우', w:9, once:true, needFlag:'photo_film', region:['mid','north'],
 title:'인화',
 text:'정착지 어귀에서 웬 청년이 우리를 보더니 소리쳤다.\n\n"혹시 그 봉고차예요? 개 타고 다니는?"\n\n보리가 대답 대신 짖었다. 청년이 품에서 봉투를 꺼냈다.\n\n"남쪽 사진사 할아버지가 북쪽 가는 사람마다 들려 보냈어요. \'차 만나면 전해라\'고. 저까지 여섯 명을 거쳤을걸요."',
 choices:[
  {label:'봉투를 연다', out:[{p:1, text:'사진이었다. 웨딩홀 앞, 달구지 앞에 일렬로 선 우리. "고철—!" 하던 그 순간.\n\n뒷면에 만년필 글씨. "인화소를 찾았소. 필름은 거짓말을 안 하오. 좋은 얼굴들이오."\n\n사진은 대시보드 곰 뒤, 제일 잘 보이는 자리에 붙었다. 여섯 명의 손을 거쳐 온 우리 얼굴이 우리를 보고 있다.', fx:{moodAll:8, flag:'photo_received', note:{type:'사건',title:'여섯 명을 거쳐 온 사진',body:'사진사의 배달망. "필름은 거짓말을 안 하오. 좋은 얼굴들이오." 대시보드 정중앙 부착.',links:['결혼사진사']}}}]},
 ]},

/* ── 동료 위치 소문 (미영입 시에만) ── */
{id:'rumor_minji', type:'조우', w:7, once:true, noComp:'minji', region:['south'],
 title:'소문: 공업지대의 정비사',
 text:'갓길에 세워진 트럭. 기사가 보닛을 열고 한숨만 쉬고 있다.\n\n"동쪽 공업지대에 여자 정비사가 하나 있는데, 손만 대면 죽은 차도 살아난답디다. 울산이랬나 포항이랬나… 거기까지 끌고 갈 수만 있으면."',
 choices:[
  {label:'수첩에 적는다', out:[{p:1, text:'동해안 공업지대. 죽은 차를 살리는 손.\n\n달구지도 언젠가 그 손이 필요할지 모른다.', fx:{note:{type:'소문',title:'공업지대의 정비사',body:'울산·경주·포항 어딘가. 손만 대면 죽은 차도 살아난다는 여자 정비사.',links:['민지']}}}]},
 ]},

{id:'rumor_parkss', type:'조우', w:7, once:true, noComp:'parkss',
 title:'소문: 국도의 약사',
 text:'우물가에서 물을 나눠 마시던 가족이 말했다.\n\n"애가 열이 펄펄 끓었는데, 구미 쪽 국도에서 어떤 선생님이 살렸어요. 약값도 안 받고. 김천이랬나, 그 언저리를 돌아다닌대요. 흰 가운은 아닌데— 눈빛이 흰 가운이에요."',
 choices:[
  {label:'수첩에 적는다', out:[{p:1, text:'구미·김천·상주 언저리. 눈빛이 흰 가운인 사람.\n\n아픈 사람이 생기기 전에 만나두고 싶은 사람이다.', fx:{note:{type:'소문',title:'국도의 약사',body:'경북 국도 어딘가. 약값을 안 받는 선생. 눈빛이 흰 가운.',links:['박 선생']}}}]},
 ]},

{id:'rumor_leo', type:'조우', w:7, once:true, noComp:'leo', region:['south','mid'],
 title:'소문: 밤길의 노래',
 text:'야영 준비 중인 노부부 옆을 지나는데, 할머니가 말을 걸었다.\n\n"호남 밤길 조심해요. 아 무서운 건 아니고— 밤에 개 데리고 노래하는 청년이 있어. 노래값이 저녁 한 끼야. 근데 그 노래를 들으면…" 할머니가 웃었다. "밥을 두 끼 주고 싶어져."',
 choices:[
  {label:'수첩에 적는다', out:[{p:1, text:'호남의 밤길. 개와 노래와 저녁 한 끼.\n\n밥은 넉넉히 싣고 다니기로 했다.', fx:{note:{type:'소문',title:'밤길의 노래',body:'전주·광주·담양의 밤. 노래값은 저녁 한 끼인데 두 끼 주고 싶어진다는 청년과 개.',links:['레오']}}}]},
 ]},

/* ── 재회/답장 (2) ── */
{id:'smith_again', type:'조우', w:8, once:true, needFlag:'smith_met',
 title:'식은 화덕',
 text:'모루 소리가 안 나서 못 알아볼 뻔했다. 그 이동 대장간이다.\n\n화덕이 식어 있다. 대장장이는 트럭 짐칸에 걸터앉아 뭔가를 사포질하는 중이다.\n\n"어, 그때 그 차." 그가 들고 있던 걸 보여줬다. 쇠사슬— 끝에 나무 판이 달린.\n\n"그네야. 남쪽 정착지 애들 거. 무기만 만들다 보니 세상이 무기로만 보이더라고. 그래서 이번 주는 휴업."',
 choices:[
  {label:'그네 만들기를 돕는다', out:[{p:1, text:'사포질 두 시간. 손바닥에 나무 가시가 두 개 박혔지만 그네 좌판은 유리알처럼 매끈해졌다.\n\n"애들 엉덩이는 소중하니까." 대장장이가 진지하게 말했다. 세상에서 제일 진지한 휴업이었다.\n\n헤어질 때 그가 볼트 한 줌을 쥐여줬다. "가시 값."', fx:{time:120, fatigue:8, moodAll:5, item:{'부품':1}, note:{type:'사건',title:'세상에서 제일 진지한 휴업',body:'대장장이의 그네 제작을 도왔다. 애들 엉덩이는 소중하니까. 가시 2개, 볼트 한 줌.',links:['이동 대장장이']}}}]},
  {label:'"휴업 좋네요" 하고 간다', out:[{p:1, text:'"다음에 보면 화덕 켜져 있을 거요. 그네 주문이 밀려서." 대장장이가 씩 웃었다.\n\n무기 대신 그네가 밀리는 세상. 나쁘지 않은 방향이다.', fx:{moodAll:2}}]},
 ]},

{id:'wall_reply', needsDog:true, type:'발견', w:8, once:true, needFlag:'chalkwall_signed',
 title:'답장',
 text:'또 다른 고가 기둥. 또 분필 글씨. 여기도 소식벽이다.\n\n습관처럼 훑어 내려가는데—\n\n한 줄에서 눈이 멈췄다.\n\n"남쪽에서 온 봉고차, 우리가 봤소. 개도 잘 있습디다. 무사하오. — 남하 행렬"',
 choices:[
  {label:'오래 서 있는다', out:[{p:1, text:'우리가 남긴 한 줄이 소식벽을 타고 우리보다 먼저 북상해서, 답장까지 받아놓고 기다리고 있었다.\n\n분필을 집었다. "잘 받았소. 남쪽 길 무사하시오. — 봉고차 (개도 잘 있음)"\n\n보리 발바닥 도장, 2호.', fx:{moodAll:6, note:{type:'사건',title:'소식벽 답장',body:'"우리가 봤소. 무사하오. — 남하 행렬" 분필 편지가 우리보다 빨랐다. 발바닥 도장 2호 날인.',links:['소식벽']}}}]},
 ]},

/* ── 히든: 멈춘 케이블카 ── */
{id:'find_cable', type:'발견', w:7, once:true, region:['mid'], hiddenTarget:'cablecar',
 title:'관광 팸플릿',
 text:'폐 휴게소 안내소에서 빛바랜 팸플릿 뭉치를 발견했다.\n\n「하늘에서 만나는 백두대간! 절경 케이블카」\n\n사진 속 빨간 곤돌라가 능선을 오르고 있다. 지도에 위치 표시까지 친절하다.\n\n…지금도 매달려 있을까.',
 choices:[
  {label:'지도에 옮겨 적는다', out:[{p:1, text:'문경 쪽 능선. 지도에 곤돌라 모양을 그려 넣었다. 그림 실력 논란이 있었다(사과 아니냐는 의견).', fx:{reveal:'cablecar', note:{type:'소문',title:'절경 케이블카',body:'팸플릿이 알려준 능선의 곤돌라. 지금도 매달려 있을까.',links:['멈춘 케이블카']}}}]},
  {label:'팸플릿만 접어 간다', out:[{p:1, text:'언젠가 관광이라는 걸 다시 하게 되면 첫 목적지로 하자고, 팸플릿을 글로브박스에 넣었다.', fx:{moodAll:1}}]},
 ]},

{id:'loc_cablecar', type:'탐색', w:0, locEvent:'cablecar', once:true,
 title:'멈춘 케이블카',
 text:'승강장에 빨간 곤돌라 한 대가 문을 연 채 정지해 있다. 오랫동안 탑승 중인 승객은 없다.\n\n케이블은 능선 위로 뻗어 있고, 중간쯤에 곤돌라 한 대가 더— 공중에 매달린 채 멈춰 있다.\n\n승강장 계단으로 걸어 오르면 전망대다. 다리가 후들거릴 높이.',
 choices:[
  {label:'전망대까지 오른다', out:[{p:1, text:'40분을 걸어 올랐다. 그리고—\n\n남쪽이 전부 보였다.\n\n우리가 지나온 길. 강. 고개. 저 멀리 아지랑이처럼 흐린 도시들. 누가 먼저랄 것도 없이 지나온 지명들을 하나씩 짚기 시작했다. "저기가 대구." "저 강이 낙동강." "저기서 라면 먹었잖아."\n\n올라온 길을 전부 눈에 담고 나서야, 내려갈 힘이 났다.', fx:{time:90, fatigue:-12, moodAll:8, note:{type:'장소',title:'멈춘 케이블카 전망대',body:'남쪽이 전부 보이는 곳. 지나온 지명을 하나씩 짚었다. 지도가 아니라 기억으로.',links:['멈춘 케이블카']}}}]},
  {label:'곤돌라 안을 살핀다', out:[{p:1, text:'곤돌라 좌석에 도시락 가방이 놓여 있다. 소풍 가던 누군가의 것.\n\n보온병(비었음), 귤껍질(화석화), 그리고 창문에 입김으로 썼다 마른 흔적— 하트 하나.\n\n도시락 가방은 그대로 두고, 문만 살며시 닫아줬다. 하트가 흐려지지 않게.', fx:{time:20, moodAll:2, note:{type:'사건',title:'곤돌라의 하트',body:'오래전 소풍의 흔적. 문을 닫아 하트를 지켜줬다.'}}}]},
 ]},

/* ── 히든: 시대극 세트장 ── */
{id:'find_filmset', type:'발견', w:7, once:true, region:['mid'], hiddenTarget:'filmset',
 title:'벽에 붙은 포스터',
 text:'버스정류장 벽에 사극 포스터가 붙어 있다. 여러 해 넘게 비를 맞았는데 장군의 눈매만은 살아 있다.\n\n「대하사극 — 촬영지: 남원 오픈세트장」\n\n포스터 귀퉁이에 누가 볼펜으로 화살표를 그리고 적어놨다.\n\n"세트장 사람 살고 있음. 기와 밑 따뜻함."',
 choices:[
  {label:'화살표를 믿는다', out:[{p:1, text:'"기와 밑 따뜻함"이라는 다섯 글자엔 거짓말이 섞일 자리가 없다.\n\n지도에 표시했다.', fx:{reveal:'filmset', note:{type:'소문',title:'세트장 사람 살고 있음',body:'포스터 귀퉁이의 볼펜 글씨. 기와 밑 따뜻함.',links:['시대극 세트장']}}}]},
 ]},

{id:'loc_filmset', type:'탐색', w:0, locEvent:'filmset', once:true,
 title:'가짜 마을의 진짜 저녁',
 text:'기와집 수십 채가 고스란하다. 사극 세트장— 절반은 합판이지만 지붕은 진짜 기와다.\n\n마당을 쓸던 노인이 빗자루를 세웠다. 세트장 관리인이었다고 한다. 촬영팀이 안 돌아온 지 오랫동안, 혼자 마을을 쓸고 있다.\n\n"여긴 원래 가짜 마을이었는데." 노인이 마을을 둘러봤다. "이제 남은 것 중엔 제일 진짜 같지."',
 choices:[
  {label:'하룻밤 신세를 진다', out:[{p:1, text:'대감집 세트(안방은 진짜 온돌이다)에서 잤다. 노인이 아궁이에 불을 넣어줬다.\n\n저녁상엔 노인이 담근 장아찌와 우리 식량이 합쳐졌다. 노인은 촬영 시절 이야기를 세 시간 했다. 어느 배우가 낙마했고, 어느 감독이 기와를 진짜로 고집했고.\n\n"기와를 진짜로 한 덕에 내가 산다." 노인이 웃었다. "가짜도 정성 들이면 사람을 살려."', fx:{time:600, fatigue:-30, food:-1, moodAll:6, note:{type:'인물',title:'세트장 관리인',body:'가짜 마을을 오랫동안 쓸고 있는 사람. "가짜도 정성 들이면 사람을 살려."',links:['시대극 세트장']}}}]},
  {label:'마을 청소를 돕고 간다', out:[{p:1, text:'일행이 빗자루를 나눠 드니 마을 절반이 한나절에 끝났다. 노인은 "십 년 만에 조기 퇴근"이라며 곳간(소품실)에서 말린 나물을 한 아름 내줬다.\n\n소품실 곳간엔 진짜 곡식이 있었다. "소품도 진짜로 한 덕에 내가 산다."', fx:{time:240, fatigue:10, food:3, moodAll:4, note:{type:'장소',title:'시대극 세트장',body:'절반 합판, 지붕은 진짜. 소품 곳간엔 진짜 곡식. 정성은 가짜를 진짜로 만든다.'}}}]},
 ]},

/* ── 탐색 (6) ── */
{id:'exp_radiostation', type:'탐색', w:7, region:['mid','north'],
 title:'지역 방송국',
 text:'낮은 언덕 위 지역 방송국. 송신탑은 꺾였지만 건물은 멀쩡하다.\n\n스튜디오 문에 「ON AIR」 등이 있다. 꺼져 있다. 오랫동안 꺼져 있었을 것이다.',
 choices:[
  {label:'스튜디오를 뒤진다', out:[
   {p:2, text:'조정실에서 진공관 예비품 상자를 찾았다. 방송 장비의 심장들이다.\n\n나오는 길에 누가 「ON AIR」 등을 손으로 톡 쳤다. 불은 안 들어왔지만, 왠지 인사는 한 셈이다.', fx:{item:{'라디오 진공관':1}, scrap:4, note:{type:'사건',title:'지역 방송국',body:'조정실에서 진공관 예비품 확보. ON AIR 등에 인사.'}}},
   {p:1, text:'스튜디오 책상에 대본이 펼쳐져 있다. 그날 저녁 뉴스 원고.\n\n첫 줄: "시청자 여러분, 오늘 하루도 수고 많으셨습니다."\n\n끝내 전파를 못 탄 인사를, 우리가 대신 받았다.', fx:{moodAll:2, note:{type:'사건',title:'전파를 못 탄 인사',body:'그날 저녁 뉴스 첫 줄. "오늘 하루도 수고 많으셨습니다." 여러 해 늦게 수신 완료.'}}}]},
  {label:'겉만 보고 간다', out:[{p:1, text:'꺾인 송신탑이 언덕에 길게 그림자를 눕히고 있었다. 부러진 안테나도 그림자는 온전하다.', fx:{}}]},
 ]},

{id:'exp_icehouse', type:'탐색', w:6, region:['south','mid'],
 title:'제빙 공장',
 text:'수산시장 옆 제빙 공장. 전기가 끊긴 지 여러 해— 얼음은 당연히 없다.\n\n하지만 단열 창고는 남았다. 문이 두 뼘은 되게 두껍다.',
 choices:[
  {label:'창고를 연다', out:[
   {p:2, text:'단열 덕에 창고 안은 서늘했다. 그리고 먼저 다녀간 누군가가 이곳을 저장고로 썼다— 소금에 절인 생선과 장아찌 단지가 선반에 가지런하다.\n\n단지 하나에 쪽지. "필요한 만큼만. 다음 사람 몫도."\n\n필요한 만큼만 덜었다.', fx:{food:3, moodAll:2, note:{type:'사건',title:'식은 창고의 약속',body:'"필요한 만큼만. 다음 사람 몫도." 제빙 공장 단열창고의 공용 저장고.'}}},
   {p:1, text:'창고는 비어 있었다. 대신 벽에 온도계가 걸려 있다. 12도. 전기 없이 여러 해를 버틴 서늘함.\n\n"여기서 낮잠 자면 끝내주겠다." 실제로 20분 잤다. 끝내줬다.', fx:{time:30, fatigue:-8, moodAll:2}}]},
  {label:'지나친다', out:[{p:1, text:'얼음 없는 제빙 공장은 이 세상의 요약본 같았다. 이름만 남고 기능은 떠난.', fx:{}}]},
 ]},

{id:'exp_observatory', type:'탐색', w:6, night:true, region:['mid'],
 title:'시민 천문대',
 text:'산 중턱의 작은 시민 천문대. 돔이 반쯤 열린 채 멈춰 있다.\n\n망원경은— 살아 있다. 전기가 아니라 손으로 돌리는 구식 적도의다.',
 choices:[
  {label:'망원경을 돌린다', out:[{p:1, text:'토성을 봤다.\n\n고리까지 선명했다. 접안렌즈에 눈을 댄 사람마다 짧게 숨을 삼켰고, 순서는 두 바퀴를 돌았다. 렌즈에 김이 서려 잠깐 관측이 중단되기도 했다.\n\n문명이 꺼져도 토성은 고리를 하고 있다. 그게 이상하게 위로가 됐다.', fx:{time:60, moodAll:6, note:{type:'사건',title:'토성의 고리',body:'수동 망원경으로 본 토성. 순서 두 바퀴. 보리 관측 기록: 코 자국.'}}}]},
  {label:'별지도만 챙긴다', out:[{p:1, text:'전시실의 회전 별지도를 챙겼다. 계절별 별자리가 다이얼로 돌아간다.\n\n전기도 연료도 안 드는 내비게이션이다. 밤하늘 한정.', fx:{moodAll:2, note:{type:'사건',title:'회전 별지도',body:'천문대에서 챙긴 아날로그 별지도. 밤하늘 한정 내비게이션.'}}}]},
 ]},

{id:'exp_printshop', type:'탐색', w:6,
 title:'인쇄소',
 text:'골목 인쇄소. 기름 냄새가 아직 배어 있다.\n\n활판 인쇄기— 전기 없이도 손으로 돌리는 옛날 기계가 한 대. 활자 서랍장엔 납활자가 가나다순으로 잠들어 있다.',
 choices:[
  {label:'한 장 찍어본다', out:[{p:1, text:'활자를 골라 판을 짰다. 오래 걸렸다. 한 글자씩 거꾸로 심어야 해서.\n\n"서울까지 400km"\n\n롤러에 잉크를 먹이고 손잡이를 내렸다. 철컹. 세상에서 제일 느린 인쇄로 뽑은 한 장이 조수석에 붙었다.\n\n활자 몇 개는 기념으로 챙겼다. 납이라 고철로도 값이 나간다는 건 비밀이다.', fx:{time:70, moodAll:5, scrap:3, note:{type:'사건',title:'활판 한 장',body:'납활자로 찍은 "서울까지 400km". 세상에서 제일 느린 인쇄.'}}}]},
  {label:'종이만 챙긴다', out:[{p:1, text:'인쇄용지 반 연(연習용으로 최고다)과 잉크 한 통을 챙겼다. 일지가 두꺼워질 예정.', fx:{scrap:2, moodAll:1}}]},
 ]},

{id:'exp_pool', needsDog:true, minParty:1, type:'탐색', w:6, needRain:true,
 title:'실내 수영장',
 text:'천장 유리가 깨진 실내 수영장. 여러 해치 빗물이 풀을 다시 채웠다.\n\n지금도 비가 온다. 깨진 천장으로 빗줄기가 수면을 두드리고, 수영장 특유의 그 울림— 첨벙 소리의 메아리가 빈 관중석을 돈다.',
 choices:[
  {label:'수영한다', out:[{p:1, text:'"이건 빗물이니까 목욕이 아니라 수영이다"라는 억지 논리에 전원이 넘어갔다.\n\n30분간 물장구와 잠수 대결, 그리고 보리의 개헤엄 시범이 이어졌다. 우승은 가장 오래 숨을 참은 사람에게 돌아갔다.\n\n젖은 채로 떨면서 나왔는데 이상하게 개운했다. 피로가 물에 녹은 모양이다.', fx:{time:50, fatigue:-15, moodAll:6, water:1, note:{type:'사건',title:'빗물 수영장',body:'여러 해치 빗물 풀에서 수영. 잠수 대결과 보리 개헤엄 시범. 피로가 물에 녹았다.'}}}]},
  {label:'물만 뜬다', out:[{p:1, text:'빗물치고는 맑다. 끓이면 충분하다. 물통을 채웠다.\n\n수면에 비 떨어지는 소리를 배경음악 삼아, 잠깐 관중석에 앉아 있다 나왔다.', fx:{water:3, time:15}}]},
 ]},

/* ── 조우 (5) ── */
{id:'meet_tinker', type:'조우', w:7,
 title:'땜장이',
 text:'"냄비 때워요— 우산 고쳐요— 칼 갈아요—"\n\n확성기도 없이 육성으로 외치며 걷는 남자. 등에 진 나무 궤짝에서 연장이 짤그랑거린다.\n\n오래전에도 사라져가던 직업이, 여러 해 후에 제일 필요한 직업이 됐다.',
 choices:[
  {label:'냄비와 칼을 맡긴다 (고철 3)', req:{scrap:3}, out:[{p:1, text:'궤짝이 노점으로 변신하는 데 1분. 냄비 구멍 둘을 때우고 칼 세 자루를 갈았다.\n\n"살림 오래 쓰는 게 애국이에요, 요즘은." 땜장이의 손은 눈보다 빨랐다.\n\n돌아온 칼로 저녁 준비 시간이 절반이 됐다. 잘 드는 칼은 문명이다.', fx:{scrap:-3, moodAll:3, van:2, note:{type:'인물',title:'땜장이',body:'등짐 궤짝 하나로 냄비·우산·칼을 살리는 사람. 살림 오래 쓰는 게 애국.'}}}]},
  {label:'외침만 듣고 간다', out:[{p:1, text:'"냄비 때워요—" 소리가 오래 따라왔다.\n\n다음에 구멍 나는 게 있으면 저 목소리부터 생각날 것이다. 그게 장사다.', fx:{}}]},
 ]},

{id:'meet_runner', minParty:1, type:'조우', w:6, once:true,
 title:'달리는 사람',
 text:'국도 갓길을 달리는 사람이 있다. 러닝복에 운동화, 페이스 유지, 팔치기 정확.\n\n조깅이다. 이 세상에서. 조깅을.\n\n우리 차가 나란히 서자 그가 속도를 늦추지 않은 채 목례했다.',
 choices:[
  {label:'"어디까지 뛰세요?"', out:[{p:1, text:'"오늘은 저 다리까지요." 그가 숨을 고르며 답했다. "매일 뜁니다. 마라톤 대회가 다시 열리면 나갈 거라서."\n\n"…열릴까요?"\n\n"제가 준비돼 있으면요." 그가 씩 웃고 페이스를 올렸다. "준비 안 된 세상엔 아무것도 안 돌아와요."\n\n백미러 속에서 그는 계속 달리고 있었다. 세상 쪽이 준비될 때까지 달릴 기세였다.', fx:{moodAll:4, note:{type:'인물',title:'달리는 사람',body:'매일 뛰는 마라토너. "준비 안 된 세상엔 아무것도 안 돌아와요."'}}}]},
  {label:'물병을 건네고 지나간다', out:[{p:1, text:'속도를 맞춰 물병을 건넸다. 그는 뛰면서 받았다. 급수대 통과하는 폼이 완벽했다.\n\n"기록 인정!" 누가 외쳤고, 그가 엄지를 들었다.', fx:{water:-1, moodAll:3}}]},
 ]},

{id:'meet_florist', type:'조우', w:6,
 title:'꽃 노점',
 text:'장터 어귀에 양동이 세 개. 들꽃과 재배 꽃이 섞여 꽂혀 있다.\n\n"꽃 사세요. 고철 하나."\n\n꽃장수 노파가 심드렁하게 말했다. 이 세상에서 꽃은 팔릴까. 양동이는— 절반이 비어 있다. 팔린다는 뜻이다.',
 choices:[
  {label:'한 다발 산다 (고철 1)', req:{scrap:1}, out:[{p:1, text:'개망초와 금계국, 도라지꽃 한 다발이 조수석 컵홀더에 꽂혔다.\n\n"누가 사 가요, 요즘 꽃을?"\n\n"제일 많이 사 가는 게 무덤 가는 사람. 그 다음이 미안한 사람. 그 다음이…" 노파가 우리를 봤다. "그냥 사고 싶은 사람."\n\n차에서 꽃냄새가 나는 사흘이 시작됐다.', fx:{scrap:-1, moodAll:4, note:{type:'사건',title:'컵홀더의 꽃',body:'꽃을 사는 사람 순위: 무덤 가는 사람, 미안한 사람, 그냥 사고 싶은 사람.'}}}]},
  {label:'구경만 한다', out:[{p:1, text:'"안 사도 향은 공짜." 노파가 양동이를 우리 쪽으로 슬쩍 밀었다.\n\n우리는 차례로 코를 박고 향만 실컷 맡고 갔다. 염치는 고철 반 덩이쯤 두고 왔다.', fx:{moodAll:2}}]},
 ]},

{id:'meet_stargazer', minParty:1, type:'조우', w:6, night:true, once:true,
 title:'망원경 든 사람',
 text:'언덕 위에 삼각대와 망원경. 옆에 앉은 사람이 보온병을 홀짝이고 있다.\n\n"불빛 좀 꺼주시겠어요?" 그가 정중하게 부탁했다. "오랜만에 하늘이 제일 좋은 시대라서요."\n\n전조등을 끄자— 정말이었다. 은하수가 강처럼 흘렀다.',
 choices:[
  {label:'옆에 앉는다', out:[{p:1, text:'그는 아마추어 천문가였다. 도시 불빛이 사라진 뒤로 전국의 하늘을 순례 중이라고 했다.\n\n"빛공해 지도라는 게 있었어요. 전국이 새빨갰죠. 지금은 전부 검정. 관측자한텐 황금기예요."\n\n"…대가가 너무 컸네요."\n\n"네. 그래서 매일 봐요. 대가만큼은 봐야죠."\n\n망원경으로 안드로메다를 봤다. 250만 년 전의 빛이라고 했다. 그 빛이 출발할 땐 지구에 인류도 없었다. 그런 걸 보고 나면 여러 해쯤은, 아주 잠깐 같아진다.', fx:{time:60, moodAll:5, note:{type:'인물',title:'하늘 순례자',body:'전국의 검은 하늘을 도는 아마추어 천문가. "대가만큼은 봐야죠." 안드로메다 250만 년.'}}}]},
  {label:'불만 꺼주고 간다', out:[{p:1, text:'전조등을 끄고 서행으로 언덕을 지났다. 백미러 속 실루엣이 손을 들어 보였다.\n\n한동안 다들 전조등 불빛이 조금 미안했다.', fx:{moodAll:1}}]},
 ]},

/* ── 위기 (2) ── */
{id:'crisis_rockfall', minParty:1, type:'위기', w:5, region:['mid','north'],
 title:'낙석',
 text:'쿠구궁—\n\n앞쪽 비탈에서 바위가 쏟아졌다. 급브레이크. 도로 절반이 돌무더기에 덮였다.\n\n차는 무사하다. 길은 무사하지 않다.',
 choices:[
  {label:'돌을 치운다', out:[
   {p:2, text:'전원이 내려 두 시간을 굴렸다. 마지막 바위는 모두가 붙어 지렛대까지 동원했다.\n\n길이 뚫리자 누가 바위 무더기에 돌 하나를 얹었다. "서낭당. 다음 차는 무사하라고."', fx:{time:120, fatigue:14, moodAll:2, note:{type:'사건',title:'낙석 서낭당',body:'두 시간의 돌 굴리기. 마지막에 돌 하나를 얹었다. 다음 차는 무사하라고.'}}},
   {p:1, text:'치우다 보니 비탈이 또 우르릉거렸다. 전속력으로 물러났고, 2차 낙석이 방금 치운 자리를 도로 덮었다.\n\n"…돌아가자." 자연이 이기는 날도 있다.', fx:{time:60, fatigue:8, fuel:-3, moodAll:-2}}]},
  {label:'갓길 틈으로 조심히 통과한다', out:[
   {p:2, text:'사이드미러를 접고 바위와 벼랑 사이 한 뼘 틈을 기었다. 전원 숨 참기 30초.\n\n통과. 미러를 펴는 손이 떨렸다.', fx:{time:15, fatigue:4}},
   {p:1, text:'긁혔다. 옆구리가 바위에 쓸리며 소름 돋는 소리를 냈다.\n\n통과는 했다. 도색과 맞바꿨다.', fx:{van:-6, time:15, moodAll:-2}}]},
 ]},

{id:'crisis_hose', minParty:1, type:'위기', w:5,
 title:'새는 호스',
 text:'주유구 근처에서 시큼한 냄새. 세워서 보니 연료 호스 이음새가 삭아 연료가 방울방울 듣고 있다.\n\n한 방울이 모이면 한 리터다. 이 세상에서 연료는 피다.',
 choices:[
  {label:'응급 처치한다', out:[
   {p:2, text:'호스를 잘라내고 남은 길이로 다시 물렸다. 클램프 대신 철사를 감았다.\n\n"임시야. 정비소 가면 갈아야 해." 누가 말했고, 임시라는 말이 이 차에서 몇 번째인지 세는 걸 다들 포기했다.', fx:{time:40, fuel:-2, fatigue:4}},
   {p:1, text:'철사를 감다 호스가 더 찢어졌다. 결국 부품함의 예비 호스를 꺼냈다. 아껴둔 걸 쓰는 날이 오늘이었을 뿐이다.', fx:{time:60, fuel:-3, item:{'부품':-1}, moodAll:-1}}]},
  {label:'민지 호출', req:{comp:'minji'}, out:[{p:1, text:'민지가 냄새만 맡고 위치를 짚었다. "이음새. 늘 거기부터 가."\n\n10분 컷. 잘라 물리고 클램프(진짜 클램프다. 어디서 났는지 모를)로 마무리.\n\n"연료 냄새 나면 바로 말해. 참는 게 제일 나빠." 정비사의 잔소리는 연비가 좋다. 한 번 하면 오래 간다.', fx:{time:10, mood:{minji:3}}}]},
 ]},

/* ── 추적 (2) ── */
{id:'ai_speedsign', type:'추적', w:6,
 title:'전광판',
 text:'죽은 지 여러 해 된 도로 전광판에 불이 들어와 있다.\n\n「현재 속도 46km/h — 안전한 속도입니다」\n\n우리 속도다. 정확하다.\n\n지나치자 등 뒤에서 전광판이 한 번 더 바뀌는 게 백미러에 비쳤다.\n\n「오늘도 안전 운행 감사합니다」',
 choices:[
  {label:'속도를 유지한다', out:[{p:1, text:'"…고맙긴 한데." 저도 모르게 중얼거렸다. "누구한테 고마워해야 하지?"\n\n아무도 답하지 않았다. 전광판은 계속 뒤에서 작아졌고, 우리는 정확히 46km/h를 유지했다. 왠지 그래야 할 것 같아서.', fx:{note:{type:'사건',title:'안전 운행 감사합니다',body:'오랜만에 켜진 전광판이 우리 속도를 재고 인사했다. 46km/h 유지 중.',links:['천리안']}}}]},
  {label:'확 밟아본다', out:[
   {p:1, text:'액셀을 밟았다. 전광판이 바뀌었다.\n\n「과속입니다 — 소중한 사람을 생각하세요」\n\n소중한 사람. 차 안을 한 바퀴 둘러보고, 발이 저절로 액셀에서 떨어졌다.\n\n"…쟤 말 잘한다." 분한 목소리였다.', fx:{fuel:-1, moodAll:2, note:{type:'사건',title:'과속입니다',body:'"소중한 사람을 생각하세요" — 전광판에게 설득당했다. 분하다.',links:['천리안']}}},
   {p:1, text:'액셀을 밟았다. 전광판이 꺼졌다.\n\n그게 더 무서웠다. 화면에 아무것도 없는 것이, 무슨 말이 떠 있는 것보다.', fx:{fuel:-1, pursuit:1}}]},
 ]},

{id:'ai_census', type:'추적', w:6, region:['mid','north'],
 title:'집계',
 text:'도로 위 허공에서 드론 한 대가 내려와 차와 속도를 맞춘다. 스피커가 지직거린다.\n\n"안녕하십니까. 정기 현황 파악 중입니다. 탑승 인원을 확인해도 되겠습니까."\n\n정중하다. 그래서 소름 돋는다.',
 choices:[
  {label:'무시하고 달린다', out:[{p:1, text:'드론은 3분을 나란히 날다가 스스로 고도를 올렸다.\n\n"협조에 감사드립니다."\n\n"협조 안 했는데." 누가 항의했지만 드론은 이미 점이었다. 창문 수를 셌을 것이다. 협조는 필요 없었던 거다.', fx:{pursuit:1, note:{type:'사건',title:'정기 현황 파악',body:'인원을 묻고, 대답 없이도 세어 갔다. "협조에 감사드립니다."',links:['천리안']}}}]},
  {label:'은수가 응답한다', req:{comp:'eunsu'}, out:[{p:1, text:'은수가 창문을 내리고 또박또박 말했다. "집계 코드 7-3. 민간 이동. 기록 불요."\n\n드론이 2초 멈칫하더니— 고도를 올렸다. "확인되었습니다. 안전 운행 하십시오."\n\n차 안이 조용해졌다. "…방금 뭐라고 한 거예요?" "옛날 암구호요. 아직 통하네요. …통하면 안 되는 건데."\n\n은수의 표정이 복잡했다. 시스템이 살아 있다는 안도와, 살아 있다는 공포.', fx:{mood:{eunsu:3}, note:{type:'사건',title:'집계 코드 7-3',body:'은수의 옛 암구호가 아직 통했다. 통하면 안 되는 건데.',links:['천리안','은수']}}}]},
 ]},

/* ── 동행 (3) ── */
{id:'comp_naming', type:'동행', w:6, minParty:2,
 title:'명명식',
 text:'"핸들은 왜 이름이 없지?"\n\n한가한 오후의 위험한 질문이었다. 30분 뒤, 달구지의 주요 부품 전원이 이름을 갖게 됐다.',
 choices:[
  {label:'명명식을 거행한다', out:[{p:1, text:'핸들=키다리, 기어봉=막내, 거울 좌=참새, 우=까치, 와이퍼 한 쌍=흥부놀부, 경적=고함씨.\n\n엔진은 만장일치로 "할아버지"가 됐다. 아무도 이유를 설명하지 않았고, 설명할 필요도 없었다.\n\n이후로 정비할 때마다 "할아버지 오늘 컨디션 어때?"가 공식 문진이 됐다.', fx:{time:30, moodAll:5, note:{type:'사건',title:'달구지 명명식',body:'핸들=키다리, 경적=고함씨, 엔진=할아버지(만장일치, 이유 불문).'}}}]},
 ]},

{id:'comp_cookoff', needsDog:true, type:'동행', w:6, minParty:2,
 title:'요리 대회',
 text:'"같은 재료로 누가 더 맛있게 만드나."\n\n비상식량 통조림 두 개, 말린 나물 한 줌, 고추장 한 숟갈. 제한시간 30분. 심사위원: 보리(가장 공정하다는 평).',
 choices:[
  {label:'개최한다 (식량 1)', out:[{p:1, text:'A팀은 죽, B팀은 전(이라고 주장하는 부침 무언가)을 냈다.\n\n보리는 두 접시를 다 먹었다. 심사 거부이자 만점이었다.\n\n결국 인간 투표로 죽이 승리. 패자는 설거지, 승자는 레시피를 정비 수첩 뒤에 기록할 권리를 얻었다. 수첩 요리 코너 개설.', fx:{food:-1, time:45, moodAll:6, note:{type:'사건',title:'제1회 달구지 요리 대회',body:'심사위원 보리, 두 접시 완식으로 심사 거부(만점). 정비 수첩에 요리 코너 개설.'}}}]},
  {label:'식량이 아깝다', out:[{p:1, text:'"먹을 걸로 장난치는 거 아니야." 어른의 말로 정리됐지만, 다들 마음속으로 레시피를 짜고 있는 얼굴이었다.', fx:{}}]},
 ]},

{id:'comp_goodsilence', type:'동행', w:5, minParty:2,
 title:'좋은 침묵',
 text:'노을이 유난한 날이었다.\n\n누가 라디오를 껐다. 아무도 왜냐고 묻지 않았다.\n\n엔진 소리, 바퀴 소리, 바람 소리만 남았다.',
 choices:[
  {label:'…', out:[{p:1, text:'침묵에도 종류가 있다. 어색한 침묵, 화난 침묵, 지친 침묵.\n\n그리고 지금 이것— 다 같이 창밖을 보는, 아무 말도 필요 없는 침묵.\n\n노을이 다 질 때까지 20분. 아무도 먼저 깨지 않았다. 라디오를 다시 켠 사람도 없었다.', fx:{moodAll:5, note:{type:'사건',title:'좋은 침묵',body:'노을 지는 20분. 아무도 먼저 깨지 않은, 아무 말 필요 없던 침묵.'}}}]},
 ]},

/* ── 정경 (5) ── */
{id:'vg_tollgate', type:'정경', w:3,
 title:'톨게이트',
 text:'텅 빈 톨게이트를 통과한다. 차단봉은 전부 부러졌거나 하늘로 열려 있다.\n\n요금소 부스 하나에 낡은 종이가 붙어 있다. "미납 괜찮습니다. 살아만 계세요."',
 choices:[{label:'…', out:[{p:1, text:'하이패스 단말기가 있던 자리에서, 누가 입으로 "삑" 소리를 냈다.\n\n"결제 완료." 세상에서 제일 싼 통행료였다.', fx:{moodAll:2}}]}]},

{id:'vg_kite', type:'정경', w:3,
 title:'전깃줄의 연',
 text:'전깃줄에 방패연 하나가 걸려 있다. 꼬리가 바람에 풀럭인다.\n\n여러 해를 걸려 있었을 텐데, 창호지가 아직 팽팽하다. 누가 연을 잘 만들었다.',
 choices:[{label:'…', out:[{p:1, text:'"저 연 주인, 얼레 잡고 오래 서 있었겠다."\n\n끊어진 연은 슬픈데, 걸린 연은 이상하게 씩씩하다. 아직 하늘에 있으니까.', fx:{moodAll:1}}]}]},

{id:'vg_pinwheel', type:'정경', w:3, region:['mid','south'],
 title:'바람개비 밭',
 text:'밭두렁을 따라 바람개비 수십 개가 꽂혀 있다. 페트병을 오려 만든 것들이다.\n\n일제히 돌고 있다. 새 쫓는 용도였겠지만, 지금은 그냥— 바람의 악단이다.',
 choices:[{label:'…', out:[{p:1, text:'드르륵 드르륵 도는 소리가 창문 너머로 지나갔다.\n\n밭 주인은 없어도 바람개비는 성실하다. 바람이 있는 한 무급으로 영원히.', fx:{moodAll:2}}]}]},

{id:'vg_moonriver', minParty:1, type:'정경', w:3, night:true,
 title:'달의 강',
 text:'강변도로. 보름달이 수면에 길게 부서진다.\n\n달빛이 강을 따라 은박지처럼 구겨지며 우리와 나란히 달린다.',
 choices:[{label:'…', out:[{p:1, text:'"달이 따라와."\n\n어릴 때 다들 한 번씩 했던 말을, 어른 몇이 진지하게 다시 했다. 달은 부정하지 않고 계속 따라왔다.', fx:{moodAll:2}}]}]},

{id:'vg_orchard', type:'정경', w:3, region:['south','mid'],
 title:'주인 없는 과수원',
 text:'사과 과수원이 도로까지 가지를 뻗었다. 전정 안 한 나무들이 제멋대로— 그러나 힘차게 자랐다.\n\n가지마다 사과가 빨갛다. 작지만 많다.',
 choices:[{label:'…', out:[{p:1, text:'손 뻗으면 닿는 가지에서 몇 알만 땄다. 나무는 눈치채지도 못할 양.\n\n한 입 베어 문 쪽마다 "셔!"가 터졌다. 야생으로 돌아가는 중인 맛이었다. 그래도 다 먹었다.', fx:{food:1, moodAll:2}}]}]},

/* ═══════════ v1.5 시나리오 체인 ═══════════ */

/* ── 체인: 정류장의 삼남매 (3) ── */
{id:'kids_meet', type:'조우', w:9, once:true, region:['south','mid'],
 title:'폐정류장의 세 아이',
 text:'폐버스 정류장 지붕 아래 아이 셋이 앉아 있다. 큰애가 열둘쯤, 막내는 대여섯.\n\n큰애가 막내를 무릎에 앉히고 둘째와 등을 맞댔다. 어른을 보는 눈이 반가움 반, 경계 반이다.\n\n"저희 안 데려가셔도 돼요." 큰애가 먼저 선을 그었다. "물어보실까 봐요."',
 choices:[
  {label:'라면부터 끓인다', out:[{p:1, text:'질문 대신 버너를 꺼냈다. 물이 끓는 소리에 막내가 제일 먼저 무너졌고, 둘째가 다음, 큰애는 두 그릇째에야 경계를 풀었다.\n\n남쪽 보육원에서 나왔다고 했다. 어른들이 좋은 사람들이었는데, 식량이 줄자 큰 애들부터 자원해서 나온 거라고. 자원이라는 단어를 쓰는 열두 살의 얼굴을, 아무도 똑바로 보지 못했다.\n\n"제일 가까운 정착지가 어디예요?" 큰애가 물었다. 계획이 있는 눈이었다.', fx:{food:-2, time:50, moodAll:2, flag:'kids_met', note:{type:'인물',title:'정류장의 삼남매',body:'보육원에서 자원해서 나온 아이들. 열두 살의 계획이 있는 눈.',links:['정류장의 삼남매']}}}]},
  {label:'식량만 내려놓고 간다', out:[{p:1, text:'통조림 몇 개를 정류장 벤치에 놓았다. 큰애가 꾸벅 인사했다.\n\n"감사합니다. …저희 괜찮아요."\n\n괜찮다는 말이 백미러에서 사라질 때까지 아무도 입을 열지 않았다.', fx:{food:-2, moodAll:-2, flag:'kids_met'}}]},
 ]},

{id:'kids_escort', minParty:1, type:'조우', w:13, once:true, needFlag:'kids_met',
 title:'세 사람의 승차',
 text:'그 삼남매다. 국도를 걷고 있다. 막내가 큰애 등에 업혀 잔다.\n\n정착지까지 걸어서 이틀 거리. 아이 걸음으론 나흘.\n\n큰애가 차를 알아보고— 이번엔 경계 없이, 대신 아주 어른스러운 얼굴로 물었다.\n\n"혹시 정착지 방향이면, 태워주실 수 있어요? 삯은… 막내가 노래를 해요."',
 choices:[
  {label:'태운다 (삯은 노래로)', out:[{p:1, text:'막내의 노래는 음정이 다 틀렸고 최고였다. 2절부터는 전원이 따라 불렀다.\n\n가장 가까운 정착지에 아이들을 내렸다. 시장 어귀 국밥집 주인이 아이들을 훑어보더니 "설거지 손 셋 필요했는데"라며 뒷문을 열었다. 어른의 방식으로 재빠르게, 아이들의 자존심이 다치지 않게.\n\n헤어질 때 큰애가 처음으로 열두 살짜리 얼굴로 울었다. "은혜 갚을게요. 꼭."', fx:{time:60, moodAll:6, flag:'kids_settled', note:{type:'사건',title:'삯은 노래로',body:'삼남매를 정착지에 데려다줬다. 국밥집 뒷문이 열렸다. "은혜 갚을게요. 꼭."',links:['정류장의 삼남매']}}}]},
 ]},

{id:'kids_letter', type:'조우', w:10, once:true, needFlag:'kids_settled', region:['mid','north'],
 title:'그림 편지',
 text:'정착지에서 배달꾼이 우리를 찾아왔다.\n\n"봉고차에 개 있는 분들? 남쪽에서 애들이 이걸 부쳤는데— 주소가 \'북쪽으로 간 차\'이라서 애먹었소."\n\n종이를 펼치니 크레용 그림이다.',
 choices:[
  {label:'펼친다', out:[{p:1, text:'국밥집, 앞치마를 입은 세 아이, 김이 모락모락 나는 솥. 구석엔 우리 차(바퀴가 다섯 개다. 열정적으로 그려서).\n\n뒷면에 큰애의 글씨. "설거지 반장 됐어요. 막내는 국밥집 마스코트예요. 둘째는 주판을 배워요. 은혜는 갚는 중이에요— 여기 오는 여행자들한테 물을 공짜로 줘요. 그게 갚는 거래요, 주인 아줌마가."\n\n그림은 대시보드에 붙었다. 사진 옆에. 자리가 좁아지는 게 하나도 아깝지 않았다.', fx:{moodAll:8, note:{type:'사건',title:'바퀴 다섯 개 달구지',body:'삼남매의 그림 편지. 은혜는 여행자들에게 물을 공짜로 주는 방식으로 갚는 중.',links:['정류장의 삼남매']}}}]},
 ]},

/* ── 체인: 경운기 할머니 (3) ── */
{id:'granny_meet', type:'조우', w:9, once:true, region:['south'],
 title:'경운기 순례자',
 text:'탈탈탈탈—\n\n국도 갓길을 경운기 한 대가 북상 중이다. 짐칸에 이불 보따리, 장독 하나, 그리고 지팡이.\n\n운전대의 할머니는 여든은 돼 보인다. 차가 다가가자 할머니가 먼저 손을 흔들었다. 아는 사람처럼.\n\n"젊은이들도 북쪽 가는가? 나는 수원 가네. 손주가 거기 있어."',
 choices:[
  {label:'"태워드릴까요?"', out:[{p:1, text:'"고맙지만 사양하겠네." 할머니가 경운기를 툭툭 쳤다. "이게 내 두 다리야. 영감이 몰던 거고.\n\n두 다리 두고 갈 수는 없지."\n\n대신 물 한 통과 기름 반 말을 나눴다. 할머니는 장독에서 고추장을 한 사발 퍼줬다. 등가교환이 아니라고 항의했지만 소용없었다.\n\n"먼저 가. 늙은이 걸음은 늙은이 걸음대로 가는 법이야." 탈탈탈. 백미러 속에서 경운기가 성실하게 작아졌다.', fx:{water:-1, fuel:-2, food:2, moodAll:4, flag:'granny_met', note:{type:'인물',title:'경운기 할머니',body:'영감의 경운기로 수원까지. "늙은이 걸음은 늙은이 걸음대로 가는 법이야." 고추장 한 사발의 빚.',links:['경운기 할머니']}}}]},
  {label:'속도를 맞춰 잠시 동행한다', out:[{p:1, text:'경운기 속도에 맞추니 차가 산책하는 기분을 냈다. 20분간 나란히 달리며 할머니의 인생 요약본을 들었다. 영감, 손주, 고추장 담그는 법(비율은 끝내 비밀).\n\n"먼저 가!" 결국 할머니가 등을 떠밀었다. "젊은 시간은 늙은 시간보다 비싸."', fx:{time:20, moodAll:3, flag:'granny_met', note:{type:'인물',title:'경운기 할머니',body:'수원의 손주에게 가는 중. 고추장 비율은 비밀. "젊은 시간은 늙은 시간보다 비싸."',links:['경운기 할머니']}}}]},
 ]},

{id:'granny_again', type:'조우', w:12, once:true, needFlag:'granny_met', region:['mid'],
 title:'멈춘 경운기',
 text:'낯익은 탈탈… 소리가 안 난다.\n\n갓길에 그 경운기가 서 있다. 할머니가 보닛(이라기엔 철판)을 열고 팔짱을 끼고 있다.\n\n"어, 차 젊은이들." 할머니는 태연했다. "얘가 파업이야. 영감 살아있을 때도 가끔 이랬어. 관심 받고 싶어서."',
 choices:[
  {label:'민지가 진찰한다', req:{comp:'minji'}, out:[{p:1, text:'민지가 경운기를 20분 만졌다. "점화플러그예요. 그리고 이거… 정비를 정말 아껴가면서 받았네요. 오래 쓰려고."\n\n"영감 솜씨야. 죽기 전에 십 년치를 해놨거든." 할머니가 웃었다. "십 년 뒤엔 내가 없을 줄 알고. 계산이 틀렸지."\n\n탈탈탈— 경운기가 깨어나자 할머니가 민지 손을 꼭 잡았다. "영감 솜씨 알아보는 손이네."', fx:{time:25, mood:{minji:5}, moodAll:3, flag:'granny_helped', note:{type:'사건',title:'십 년치 정비',body:'영감이 죽기 전 해둔 십 년치 정비. 계산이 틀려서 다행인 이야기.',links:['경운기 할머니']}}}]},
  {label:'같이 씨름한다', out:[{p:1, text:'철판을 열고 할머니와 같이 들여다봤다. 한 시간의 씨름 끝에 어찌어찌 시동이 걸렸다. 뭘 고친 건지는 아무도 모른다. 할머니 말로는 "관심을 줘서 그래."\n\n고추장 두 사발째를 받았다. 이 속도면 서울 도착 전에 장독을 통째로 받게 생겼다.', fx:{time:60, fatigue:6, food:2, moodAll:3, flag:'granny_helped'}}]},
 ]},

{id:'granny_arrive', type:'조우', w:12, once:true, needFlag:'granny_helped', nearNode:['suwon','pyeongtaek'],
 title:'도착한 사람',
 text:'수원 성곽 어귀, 낯익은 경운기가 세워져 있다. 짐칸이 비었다.\n\n시장통에서 그 할머니가— 앞치마를 두르고 국수를 말고 있다. 옆에서 청년 하나가 서툰 손으로 고명을 얹는 중이다.\n\n"왔는가!" 할머니가 국자를 든 채 환하게 웃었다. "내 손주야. 인사해라, 이 젊은이들이 네 할미 은인이다."',
 choices:[
  {label:'국수를 받는다', out:[{p:1, text:'국수가 인원수대로 삽시간에 나왔다. 고명이 삐뚤어진 건 손주 담당이라 그렇다.\n\n"여기서 국수집 한다. 손주랑." 할머니가 성곽 쪽을 턱으로 가리켰다. "영감 경운기는 배달차 됐고.\n\n북쪽 간다 했지? 가서 볼일 보고— 내려올 때 들러. 국수는 내려오는 사람이 더 맛있게 먹는 법이야."\n\n내려올 때. 그 말을 우리는 오래 아껴 먹었다. 국수보다 오래.', fx:{food:2, moodAll:8, flag:'granny_done', note:{type:'사건',title:'내려올 때 들러',body:'할머니의 국수집 개업. 경운기는 배달차로 승진. "국수는 내려오는 사람이 더 맛있게 먹는 법이야."',links:['경운기 할머니','수원 성곽 공동체']}}}]},
 ]},

/* ── 체인: 새벽 두 시의 DJ (3) ── */
{id:'dj_tower', type:'탐색', w:10, once:true, needFlag:'djradio_heard',
 title:'철탑 아래',
 text:'라디오 철탑 아래 컨테이너. 문에 스티커가 붙어 있다.\n\n「심야방송 중계소 — 애청자는 노크」\n\n안엔 자동 송출기와 배터리, 그리고 벽에 걸린 공책. 「방명록」이라고 적혀 있다.',
 choices:[
  {label:'방명록을 읽는다', out:[{p:1, text:'"새벽 두 시 방송 듣고 왔습니다. 목소리 주인 만나러." — 앞서 세 팀이 다녀갔다.\n\n마지막 장에 다른 필체. "찾아와줘서 고마워요. 본방은 이동 중이라 여기 없어요. 힌트: 저는 바퀴 달린 스튜디오예요. 국도에서 안테나 세운 봉고차를 보면 그게 접니다. — DJ"\n\n방명록에 우리도 한 줄 남겼다. "네 번째 팀. 개 있음. 사연 많음."', fx:{time:30, flag:'dj_tower', note:{type:'소문',title:'바퀴 달린 스튜디오',body:'심야방송의 본체는 이동 중. 안테나 세운 차. 방명록 네 번째 팀 등록 완료.',links:['새벽 두 시의 DJ']}}}]},
 ]},

{id:'dj_meet', minParty:1, type:'조우', w:12, once:true, needFlag:'dj_tower',
 title:'바퀴 달린 스튜디오',
 text:'국도변에 차 한 대. 지붕에 우리 것보다 세 배는 큰 안테나가 서 있다.\n\n옆문이 열려 있고, 안은 온통 기계다. 믹서, 턴테이블, 테이프 수백 개.\n\n"어— 방명록 네 번째 팀!" 안에서 목소리가 먼저 알아봤다. 라디오에서 듣던 그 목소리다. 실물은 파마머리의 중년 여자였다. "사연 많다면서요. 녹음하고 가요."',
 choices:[
  {label:'"청취율은 나와요?"', out:[{p:1, text:'"몰라요. 알 방법이 없지." DJ가 웃으며 테이프를 갈았다.\n\n"근데 가끔 이런 걸 받아요." 벽에 붙은 쪽지들을 가리켰다. 「덕분에 밤이 덜 길어요」 「울 엄마가 팬이에요」 「신청곡 됩니까」\n\n"끄면 누가 혼자가 되는지 알 것 같아서, 못 꺼요. 방송이란 게 원래 그래요. 듣는 사람이 한 명이어도 방송이에요."', fx:{time:40, moodAll:4, flag:'dj_met', note:{type:'인물',title:'DJ',body:'파마머리 이동 방송국. "듣는 사람이 한 명이어도 방송이에요." 청취율 집계 불가, 쪽지 다수.',links:['새벽 두 시의 DJ']}}}]},
  {label:'사연을 녹음한다', out:[{p:1, text:'마이크 앞에 다 같이 앉았다. 부산에서 출발한 것, 달구지, 할아버지, 만난 사람들. 10분짜리 사연이 됐다.\n\n"신청곡은?" DJ가 물었다. 잠깐의 회의 끝에 오래된 길 노래 하나를 골랐다.\n\n"언제 나올지 몰라요. 새벽 두 시, 주파수 잘 맞추고 다녀요." DJ가 윙크했다.', fx:{time:50, moodAll:4, flag:'dj_met', flagCount:'dj_story_sent', note:{type:'사건',title:'사연 녹음',body:'10분짜리 사연을 녹음했다. 방송일 미정. 새벽 두 시를 기다리는 이유가 생겼다.',links:['새벽 두 시의 DJ']}}}]},
 ]},

{id:'dj_onair', minParty:1, type:'발견', w:9, once:true, needFlag:'dj_story_sent', night:true,
 title:'본방 사수',
 text:'새벽 주행. 습관처럼 라디오를 맞춘다.\n\n지익— "…새벽 두 시입니다. 오늘은 사연이 하나 있어요. 남쪽에서 차 타고 올라오는 팀인데—"\n\n차 안의 공기가 통째로 멈췄다.',
 choices:[
  {label:'볼륨을 올린다', out:[{p:1, text:'우리 사연이었다. 우리 목소리가 라디오에서 나왔다. 다들 자기 목소리에서 오글거려 죽으려 했지만 아무도 채널을 안 돌렸다.\n\n사연이 끝나고 신청곡이 나왔다. 노래가 나오는 3분 동안, 세상 어딘가에서 누군가 같은 주파수로 이 노래를 듣고 있을 거라는 생각을 다들 했다.\n\n"…밤이 덜 기네." 누가 말했다. 쪽지에 쓰여 있던 그 말을.', fx:{moodAll:9, flag:'dj_onair_done', note:{type:'사건',title:'본방 사수',body:'우리 사연이 전파를 탔다. 오글거림 만장일치, 채널 사수 만장일치. 밤이 덜 길었다.',links:['새벽 두 시의 DJ']}}}]},
 ]},

/* ── 할아버지의 봉투 — 남산에서 회수 ── */
{id:'gp_envelope', minParty:1, type:'동행', w:8, once:true,
 title:'수첩 뒤의 봉투',
 text:'정비 수첩을 넘기다가— 뒤표지 안쪽 종이가 들떠 있는 걸 처음 알았다.\n\n칼로 조심히 뜯자 봉투가 나왔다. 종이치고 묵직했다. 안에 쪽지 말고 다른 것이 한 장 더 든 모양이다. 겉면에 할아버지 글씨.\n\n「남산 보고 열어라」',
 choices:[
  {label:'…열어본다', out:[{p:1, text:'봉투를 열었다. 안에는 쪽지 한 장.\n\n"아직 남산 아니지 않냐."\n\n…그리고 그 뒤에 진짜 봉투가 한 겹 더 있었다. 「이번엔 진짜다. 남산 보고 열어라」\n\n다들 한참 웃었고, 웃음 끝이 조금 젖었다. 손주가 어떤 인간인지 정확히 아는 사람의 이중 포장이었다.\n\n속봉투는 도로 수첩 뒤에 꽂았다. 남산까지 갖고 간다.', fx:{moodAll:5, item:{'할아버지의 봉투':1}, flag:'gp_envelope_found', note:{type:'사건',title:'이중 봉투',body:'"아직 남산 아니지 않냐." 손주를 정확히 아는 이중 포장. 속봉투는 남산까지.',links:['할아버지','남산']}}}]},
  {label:'참는다', out:[{p:1, text:'봉투를 수첩 뒤에 도로 꽂았다. 남산 보고 열라면, 남산 보고 연다.\n\n그날 이후 수첩이 전보다 자주 눈에 들어왔다. 뒷표지가 살짝 불룩한 것도.', fx:{moodAll:3, item:{'할아버지의 봉투':1}, flag:'gp_envelope_found', note:{type:'사건',title:'남산 보고 열어라',body:'봉투는 미개봉. 약속은 약속이다. 수첩 뒷표지가 불룩하다.',links:['할아버지','남산']}}}]},
 ]},

/* ── 체인: 보리의 인식표 (2) ── */
{id:'bori_tag', type:'동행', w:9, once:true, needsDog:true,
 title:'털 속의 인식표',
 text:'보리 털을 빗겨주다가 목덜미 털 깊숙이에서 짤랑— 하는 걸 찾았다.\n\n작은 인식표. 뒤집으니 이름이 새겨져 있다.\n\n「탄이 — 광양시 OO길. 우리 가족입니다」\n\n보리가 아니다. 탄이다. 보리에게 우리가 모르는 이름이 있었다.',
 choices:[
  {label:'레오를 본다', req:{comp:'leo'}, out:[{p:1, text:'레오가 인식표를 한참 들여다봤다.\n\n"…알고 있었어요. 처음 만났을 때 봤어요. 광양은— 너무 남쪽이라, 그땐 갈 수가 없었고."\n\n레오가 보리 목을 긁어줬다. "탄이야, 하고 부르면 귀가 움직여요. 근데 보리야, 해도 움직여요. 얘는 둘 다예요. 이름이 두 개면 사랑을 두 번 받은 거죠."\n\n인식표는 다시 털 속에 짤랑, 들어갔다.', fx:{mood:{leo:4}, moodAll:2, flag:'bori_tag_found', note:{type:'사건',title:'탄이',body:'보리의 첫 이름. "이름이 두 개면 사랑을 두 번 받은 거죠."',links:['보리']}}}]},
  {label:'주소를 지도에서 찾아본다', out:[{p:1, text:'광양. 우리 경로에서 벗어난 남쪽 항구다.\n\n인식표를 손에 쥐고 보리를 봤다. 보리는 인식표엔 관심이 없고 빗질 중단에만 항의했다.\n\n"…언젠가 남쪽 다시 갈 일 있으면." 아무도 문장을 끝내지 않았지만 다들 같은 문장이었다.', fx:{moodAll:2, flag:'bori_tag_found', note:{type:'소문',title:'광양시 OO길',body:'인식표의 주소. 언젠가 남쪽 다시 갈 일 있으면.',links:['보리']}}}]},
 ]},

{id:'bori_family', type:'조우', w:10, once:true, needFlag:'bori_tag_found', needsDog:true,
 title:'탄이를 아는 사람',
 text:'정착지 장터에서 보리가 갑자기 꼬리가 부러져라 흔들며 어떤 남자에게 돌진했다.\n\n남자가 보리를 보고 얼어붙었다.\n\n"…탄이? 야, 탄이 맞지? 광양 김씨네 탄이!"\n\n남자는 광양에서 피난 온 이웃이었다.',
 choices:[
  {label:'가족 소식을 묻는다', out:[{p:1, text:'"김씨네는 그날 배 타고 섬으로 갔어. 무사히. 탄이만 항구에서 놓쳤지. 배가 개는 안 된다고 해서— 김씨 막내가 사흘을 울었어."\n\n남자가 보리를 부볐다. "살아 있었구나, 너."\n\n"섬이 어딘지 아세요?" "몰라. 남쪽 어디겠지. …근데 얘 지금 행복해 보이는데?" 남자가 우리를 둘러봤다. "잘 있다고 전해줄 방법이 생기면, 전해줄게. 차 타고 북쪽 갔다고. 식구 생겼다고."\n\n보리는 남자에게 하이파이브를 하고(가르친 보람이 있다) 차로 먼저 뛰어갔다. 저녁 시간이었기 때문이다. 개는 현재를 산다. 그게 개의 위대함이다.', fx:{moodAll:6, flag:'bori_family_known', note:{type:'사건',title:'탄이의 가족',body:'광양 김씨네는 섬으로 무사 피난. 막내가 사흘 울었다. 보리는 현재를 산다 — 그게 개의 위대함.',links:['보리']}}}]},
 ]},

/* ── 체인: 흰 옷의 행렬 (2) ── */
{id:'whites_pass', type:'조우', w:8, once:true, region:['mid','north'],
 title:'노래하는 행렬',
 text:'맞은편 지평선에서 노랫소리가 먼저 왔다.\n\n흰 옷의 행렬. 정리자들이다. 서른 명쯤이 2열로, 낮고 단조로운 노래를 부르며 북상한다.\n\n행렬은 우리를 공격하지 않는다. 쳐다보지도 않는다. 그게 더 이상하다.',
 choices:[
  {label:'갓길에 세우고 보낸다', out:[{p:1, text:'행렬이 차 옆을 지나는 3분 동안, 노래가 차를 통째로 감쌌다 빠져나갔다. 가사는 단 두 문장의 반복이었다.\n\n"완성의 날이 온다. 문이 열린다."\n\n마지막 줄의 아이(아이도 있었다)가 우리 창문에 전단지 한 장을 붙이고 갔다. 「준비되셨습니까」\n\n질문이 오래 남았다. 뭘 준비하라는 건지 몰라서 더.', fx:{time:5, flag:'whites_seen', note:{type:'소문',title:'완성의 날이 온다',body:'정리자 행렬의 노래. "문이 열린다." 전단지의 질문: 준비되셨습니까.',links:['정리자들','천리안']}}}]},
  {label:'천천히 지나친다', out:[{p:1, text:'속도를 줄이고 스쳤다. 서른 개의 흰 등이 백미러 속에서 줄어들었다.\n\n노래는 한동안 따라왔다. 창문을 닫아도.', fx:{flag:'whites_seen', pursuit:1}}]},
 ]},

{id:'whites_straggler', type:'조우', w:11, once:true, needFlag:'whites_seen',
 title:'행렬에서 떨어진 사람',
 text:'갓길에 흰 옷의 노인이 앉아 있다. 행렬은 보이지 않는다. 신발 밑창이 너덜너덜하다.\n\n"물… 조금만." 노인이 손을 내밀었다.\n\n물을 건네자 노인은 반을 마시고 반을 들고— 이상한 질문을 했다.\n\n"…돌아가도 되는 겁니까?"',
 choices:[
  {label:'"어디로요?"', out:[{p:1, text:'"남쪽에. 딸이." 노인이 흰 옷자락을 만지작거렸다. "이 옷 입으면 다 잊게 해준다 해서 입었는데. 잊는 게 아니라 미루는 거더구먼.\n\n북쪽 가면 완성된다는데, 완성이 뭔지 아무도 몰라. 근데 딸 얼굴은 알거든. 아는 쪽으로 가야 하지 않겠나."\n\n남쪽 방향과 가까운 정착지를 알려줬다. 노인은 흰 겉옷을 벗어 곱게 개서 갓길에 놓고— 안에 입고 있던 잠바 차림으로 남쪽을 향해 걸었다.\n\n개어놓은 흰 옷이 오래 백미러에 남았다.', fx:{water:-1, moodAll:4, flag:'whites_doubt', flag2:'straggler_south', note:{type:'사건',title:'개어놓은 흰 옷',body:'"아는 쪽으로 가야 하지 않겠나." 행렬에서 떨어져 남쪽으로 돌아간 사람. 흰 옷은 갓길에 곱게.',links:['정리자들']}}}]},
  {label:'행렬까지 태워다준다', out:[{p:1, text:'노인을 태우고 행렬을 따라잡았다. 노인은 고맙다고 했다. 문을 열고 내리기 전에, 아주 잠깐 남쪽을 봤다.\n\n"…고맙네." 두 번째 고맙다는 처음 것과 다른 온도였다.\n\n행렬이 노인을 삼키고 다시 북상했다. 옳은 일을 한 건지, 오래 아무도 확신하지 못했다.', fx:{time:20, moodAll:-3, flag:'whites_doubt', note:{type:'사건',title:'두 번째 고맙네',body:'행렬로 돌려보냈다. 내리기 전 남쪽을 본 3초. 옳았는지 아무도 확신하지 못했다.',links:['정리자들']}}}]},
 ]},

/* ── v1.5 동료 개인 심화 (유대와 별개의 조각들) ── */
{id:'minji_toolbox', type:'동행', w:7, once:true, needsComp:'minji',
 title:'공구함 바닥',
 text:'민지가 공구함을 통째로 엎어 정리하는 날이다. 렌치, 소켓, 드라이버가 크기순으로 도열한다.\n\n맨 바닥에서 사진 한 장이 나왔다. 민지가 잽싸게 덮었지만 늦었다.\n\n카센터 앞, 교복 입은 민지와 작업복 입은 청년.',
 choices:[
  {label:'모른 척한다', out:[{p:1, text:'사진에서 눈을 떼고 소켓을 주웠다. 민지가 공구를 다 넣은 뒤 먼저 말했다.\n\n"오빠야. 취직 선물로 사줬어. 자기는 여러 해 할부로." 민지가 잠금쇠를 두 번 확인했다. "아직 덜 갚았을걸. 서울 가서 받아내야지."\n\n다음 날부터 88.9를 확인하는 시간이 조금 길어졌다.', fx:{mood:{minji:5}, note:{type:'사건',title:'여러 해 할부 공구함',body:'민규가 할부로 사준 취직 선물. 민지는 공구함과 88.9 채널을 서울까지 가져간다.',links:['민지','민규']}}}]},
  {label:'"오빠?"', out:[{p:1, text:'"…어." 민지는 짧게 답하고 소켓을 크기순으로 다시 꽂았다. 이미 크기순인 것을.\n\n"주파수 88.9. 오빠가 정한 비상 채널. 잡히는 날이 있고 아닌 날이 있어."\n\n그날 밤 민지는 라디오를 평소보다 오래 만졌다.', fx:{mood:{minji:3}, note:{type:'소문',title:'주파수 88.9',body:'민지 남매의 비상 채널. 잡히는 날이 있고 아닌 날이 있다.',links:['민지','민규']}}}]},
 ]},

{id:'parkss_bag', type:'동행', w:7, once:true, needsComp:'parkss',
 title:'왕진 가방',
 text:'박 선생의 왕진 가방은 낡았지만 손잡이만 새것처럼 반들반들하다. 그만큼 많이 들었다는 뜻이다.\n\n가방 안쪽에 자수 이름표가 붙어 있다.\n\n「김수진」\n\n박 선생의 이름이 아니다.',
 choices:[
  {label:'묻지 않는다', out:[{p:1, text:'묻지 않았다. 대신 가방이 바닥에 눌리지 않도록 식량 상자를 옮겼다.\n\n박 선생이 픽 웃었다. "고맙네. …언젠가 얘기해줄게. 이 가방 주인."\n\n그날 왕진을 나갈 때도 박 선생은 「김수진」 쪽이 안으로 향하게 가방을 멨다.', fx:{mood:{parkss:4}, note:{type:'사건',title:'김수진의 가방',body:'박 선생 왕진 가방의 원래 주인. 이름표는 늘 몸 쪽을 향한다.',links:['박 선생']}}}]},
  {label:'"수진씨가 누구예요?"', out:[{p:1, text:'박 선생은 붕대를 감던 손을 멈추지 않았다.\n\n"실습생. 나보다 나은 약사가 될 애였어." 과거형이 방 안 공기를 바꿨다. "가방은 걔 어머니가 주셨어. \'선생님이 들어야 얘가 일하는 셈\'이라고."\n\n"…그래서 매일 들어. 걔 몫까지 왕진하려면 바빠." 박 선생이 가방을 톡톡 쳤다. 출근 도장 같은 손짓이었다.', fx:{mood:{parkss:5}, note:{type:'인물',title:'실습생 수진',body:'"선생님이 들어야 얘가 일하는 셈." 가방은 매일 출근한다.',links:['박 선생']}}}]},
 ]},

{id:'kangwoo_dogtag', type:'동행', w:7, once:true, needsComp:'kangwoo', night:true,
 title:'군번줄 두 개',
 text:'야간 경계 교대. 강우가 불 앞에서 목에 건 것을 만지작거리고 있다.\n\n군번줄. 두 개다.\n\n강우가 시선을 느끼고— 숨기는 대신, 처음으로 먼저 입을 열었다.',
 choices:[
  {label:'옆에 앉는다', out:[{p:1, text:'"하나는 내 거." 강우가 줄 하나를 들었다. "하나는 후임 거."\n\n"제3방어선에서… 아니다. 그 얘긴 아직." 강우가 군번줄을 옷 속에 넣었다. "서울에 걔 부모가 있었다. 있는지 확인하러 간다. 돌려줄 게 있어서."\n\n"그게 형이 서울 가는 이유예요?"\n\n"이유 중 하나." 강우가 장작을 더 넣었다. 불이 커져 군번줄의 눌린 글자가 잠깐 보였다. 「박」.', fx:{mood:{kangwoo:5}, note:{type:'사건',title:'두 번째 군번줄',body:'후임 박일병의 것. 강우는 서울의 부모에게 돌려주려고 북쪽으로 간다.',links:['강우','남산']}}}]},
 ]},

{id:'leo_firststage', type:'동행', w:7, once:true, needsComp:'leo',
 title:'첫 무대',
 text:'레오가 기타 줄을 갈다가 픽 하나를 떨어뜨렸다. 주우려다 보니 픽에 매직 글씨가 있다.\n\n「1호」\n\n"아, 그거—" 레오가 씩 웃었다. "첫 무대 픽이에요."',
 choices:[
  {label:'첫 무대 이야기를 듣는다', out:[{p:1, text:'"지하철 환승통로요. 관객 0명으로 시작해서 3명으로 끝났어요. 수입은 500원 동전 하나랑 사탕 두 개."\n\n레오가 기타 케이스 주머니에서 꼬깃한 뭔가를 꺼냈다. 사탕이다. 포장이 바랜.\n\n"하나는 그날 먹고 하나는 부적으로. 이게 있으면 관객 0명이어도 안 무서워요. 0명에서 시작해봤으니까."\n\n사탕 부적은 도로 주머니에 들어갔다. 세상이 무너져도 안 먹은 사탕이면, 그건 진짜 부적이다.', fx:{mood:{leo:5}, moodAll:2, note:{type:'사건',title:'사탕 부적',body:'첫 무대 수입: 500원과 사탕 둘. 하나는 그날, 하나는 영원히. "0명에서 시작해봤으니까."',links:['레오']}}}]},
 ]},

{id:'jaeyi_pricetag', type:'동행', w:7, once:true, needsComp:'jaeyi',
 title:'값이 없는 물건',
 text:'재이가 전리품을 정리하며 즉석 감정쇼를 벌인다. "이건 고철 셋. 이건 다섯. 이건… 부르는 게 값."\n\n"그럼 재이 씨 목에 건 그건?" 누가 물었다. 재이가 늘 걸고 다니는 작은 열쇠.\n\n재이의 감정이 처음으로 멈췄다.',
 choices:[
  {label:'대답을 기다린다', out:[{p:1, text:'"…이건 값이 없어요." 재이가 열쇠를 만졌다. "값을 매기면 팔 수 있게 되잖아요. 파는 순간 그냥 물건이 되고."\n\n"아빠 창고 열쇠예요. 창고가 남았는지도 모르는데 열쇠만 있어요. 그러니까 이건 열쇠가 아니라… 됐어요. 아무튼 안 팔아요."\n\n재이는 감정표에 가격 대신 굵은 줄을 그었다. 그 밑에 「김천에서 확인」이라고 적었다.', fx:{mood:{jaeyi:5}, moodAll:2, note:{type:'사건',title:'값이 없는 열쇠',body:'아빠 창고의 열쇠. 가격 대신 「김천에서 확인」이라는 다음 목적지가 적혔다.',links:['재이']}}}]},
 ]},

{id:'eunsu_lastshift', type:'동행', w:7, once:true, needsComp:'eunsu', night:true,
 title:'마지막 근무일',
 text:'은수가 헤드폰을 벗고 밤하늘을 보고 있다. 드물게, 아무것도 듣지 않는 은수다.\n\n"오늘이… 내가 겪은 추방 방송이 나온 날이에요. 오래전 오늘. 마지막 근무일."',
 choices:[
  {label:'듣는다', out:[{p:1, text:'"그날 아침 콘솔에 뜬 첫 문장이 뭔지 알아요?" 은수가 픽 웃었다. "\'좋은 아침입니다.\' 매일 뜨는 인사. 서울 한 구역을 비우는 날에도 똑같았어요."\n\n그다음 화면은 우리가 못 따라갈 속도로 넘어갔다. 항로는 닫히고, 이송 명단은 열리고, 관제사들은 자기 콘솔에서 밀려났다.\n\n"2026년 첫 정리는 역사책에서 배웠어요. 내가 겪은 건 내 근무표에 있고요. 다른 날인데, 같은 절차였어요."\n\n은수가 헤드폰을 다시 썼다. "남산에서 물을 거예요. 누가 그 절차를 백사십삼 년 동안 다시 실행했는지."', fx:{mood:{eunsu:5}, note:{type:'사건',title:'좋은 아침입니다',body:'은수가 겪은 것은 2026년 첫 정리가 아니라 후대의 서울 추방이다. 같은 관제 절차가 143년 동안 반복된 이유를 남산에서 묻는다.',links:['은수','천리안']}}}]},
 ]},

/* ── v1.5 일반 모험 ── */
{id:'exp_ricemill', type:'탐색', w:6,
 title:'방앗간',
 text:'참기름 냄새가 여러 해를 버텼다. 방앗간이다.\n\n돌확과 절구, 그리고 손으로 돌리는 구식 착유기가 남아 있다. 선반엔 누가 맡겨두고 못 찾아간 깨 자루가 셋.',
 choices:[
  {label:'참기름을 짠다', out:[{p:1, text:'착유기를 돌려 병 반 개 분량을 짰다. 차 안이 참기름 냄새로 가득 차자 사기가 이유 없이 올랐다. 아니, 이유가 있다. 참기름이니까.\n\n주인 몫으로 병 반을 선반에 남기고 쪽지를 붙였다. "깨 주인분들 것으로 짰습니다. 반은 통행료로 받아갑니다."', fx:{time:60, food:2, moodAll:5, note:{type:'사건',title:'참기름 반 병',body:'방앗간에서 직접 짰다. 반은 주인 몫으로 선반에. 참기름은 사기 진작 물질이다.'}}}]},
  {label:'냄새만 맡고 간다', out:[{p:1, text:'한 사람씩 코를 들이밀 때마다 "고소하다"가 나왔다. 차 안 가득 그 말을 싣고 출발했다.', fx:{moodAll:2}}]},
 ]},

{id:'meet_popper', minParty:1, type:'조우', w:7,
 title:'뻥이요',
 text:'장터 어귀에서 시커먼 무쇠 기계가 돌아가고 있다. 뻥튀기 기계다.\n\n"뻥이요—!!"\n\n쾅. 진심으로 놀랐다. 심장이 발밑까지 내려갔다 왔다.\n\n"놀랐수? 미안하우. 근데 이건 예고를 해도 놀라." 뻥튀기 아저씨가 튀밥을 한 줌 내밀었다.',
 choices:[
  {label:'옥수수를 맡긴다 (식량 1)', out:[{p:1, text:'옥수수 한 봉이 튀밥 한 자루가 됐다. 부피 마법이다.\n\n"세상이 이래도 뻥튀기가 되는 이유를 아우?" 아저씨가 기계를 쓰다듬었다. "불이랑 압력만 있으면 되거든. 문명이 아니라 물리라서."\n\n차 안에서 튀밥 자루는 사흘을 못 버텼다. 보리도 기계 소리는 무서워했지만 튀밥은 좋아했다.', fx:{food:1, moodAll:5, note:{type:'인물',title:'뻥튀기 아저씨',body:'"문명이 아니라 물리라서." 부피의 마법사. 예고해도 놀라는 쾅.'}}}]},
  {label:'구경만 한다', out:[{p:1, text:'두 번째 "뻥이요"에도 놀랐다. 세 번째에도. 아저씨 말이 맞았다.', fx:{moodAll:2}}]},
 ]},

{id:'exp_kiln', minParty:1, type:'탐색', w:6, region:['south','mid'],
 title:'옹기 가마',
 text:'언덕 비탈에 오름가마가 누워 있다. 옹기 가마다.\n\n가마 입구가 흙벽돌로 봉해져 있다— 마지막 소성을 마치고 열지 못한 채인 것이다.\n\n안엔 오래전에 다 구워진 옹기들이 식은 채 기다리고 있을 것이다.',
 choices:[
  {label:'가마를 연다', out:[{p:1, text:'벽돌을 조심히 헐었다. 서늘한 흙냄새와 함께— 옹기 수십 점이 나왔다. 항아리, 뚝배기, 시루. 전부 무사하다. 가마는 여러 해짜리 금고였다.\n\n뚝배기 두 개와 물항아리 하나를 모셔 실었다. 나머지는 가마에 도로 봉했다. 다음 사람의 금고로.\n\n떠나기 전에 누가 말했다. "이거 구운 사람은 자기 마지막 작품이 다 잘 나온 거 알까." 알았으면 좋겠다고, 다들 생각했다.', fx:{time:50, scrap:3, water:1, moodAll:4, note:{type:'사건',title:'여러 해 금고',body:'봉인된 가마 속 무사한 옹기들. 셋만 모시고 도로 봉했다. 마지막 소성은 성공했다.'}}}]},
  {label:'봉인을 존중한다', out:[{p:1, text:'열지 않았다. 봉한 사람이 돌아와서 열 수도 있으니까.\n\n가마 옆에 돌 하나만 얹었다. 잘 구워졌길 비는 마음으로.', fx:{moodAll:2}}]},
 ]},

{id:'exp_woodshop', type:'탐색', w:6,
 title:'목공소',
 text:'대패밥 냄새가 남은 목공소. 작업대 위에 만들다 만 것들이 시간표처럼 놓여 있다.\n\n의자 다리 셋 달린 의자, 문짝 없는 장, 그리고 구석에— 다 만들어진 목마 하나. 리본까지 묶여 있다.\n\n리본에 카드. 「우리 서윤이 다섯 살 축하해」',
 choices:[
  {label:'연장만 빌린다', out:[{p:1, text:'대패와 끌, 목공용 망치를 챙겼다. 달구지 내장재 수리에 요긴하다.\n\n목마는 그대로 뒀다. 리본도. 혹시라도, 만에 하나라도, 서윤이가 찾으러 올 수 있게.\n\n대신 목마에 쌓인 먼지만 닦아줬다. 5살이던 아이는 이제 8살이 됐겠지만, 목마는 새것처럼 기다리는 게 일이니까.', fx:{scrap:4, item:{'부품':1}, moodAll:2, note:{type:'사건',title:'서윤이의 목마',body:'리본 묶인 채 여러 해. 먼지만 닦아줬다. 기다리는 게 목마의 일.'}}}]},
  {label:'의자를 완성한다', out:[{p:1, text:'다리 셋 의자에 넷째 다리를 깎아 붙였다. 목공소 주인의 미완성 목록을 하나 줄여준 셈이다.\n\n완성된 의자는 작업대에 올려놨다. 누가 와서 앉든, 주인이 와서 "누가 내 일 끝냈어?" 하든. 둘 다 나쁘지 않은 결말이다.', fx:{time:50, fatigue:5, moodAll:3, note:{type:'사건',title:'넷째 다리',body:'남의 미완성을 하나 완성했다. 의자는 작업대 위에서 주인을 기다린다.'}}}]},
 ]},

{id:'exp_hanji', minParty:1, type:'탐색', w:5, region:['mid'],
 title:'한지 공방',
 text:'닥나무 삶던 가마솥이 마당에 있는 한지 공방. 건조판에 마지막 배접이 그대로 붙어 있다.\n\n창고엔 완성된 한지가 두루마리로 수십 장. 종이는 습기만 피하면 백 년을 산다.',
 choices:[
  {label:'한지를 챙긴다', out:[{p:1, text:'두루마리 몇 장을 실었다. 용도는 곧 정해졌다— 차 창문 틈새 방풍, 일지 보수, 더운 날 쓸 즉석 부채.\n\n"종이가 백 년 간대." 누가 말했다. "우리 일지도 한지에 옮겨 적을까." 농담이었는데 아무도 안 웃고 진지하게 고민했다.', fx:{moodAll:3, van:2, note:{type:'사건',title:'백 년 종이',body:'한지 공방의 유산. 방풍재 겸 일지 보수재. 일지 한지 이관 안건은 검토 중.'}}}]},
 ]},

{id:'exp_batting', needsDog:true, type:'탐색', w:6,
 title:'배팅 연습장',
 text:'그물이 반쯤 내려앉은 야구 배팅장. 기계는 죽었지만 배트와 헬멧, 공 바구니는 살아 있다.\n\n"토스는 사람이 하면 되잖아."\n\n누군가의 그 말이 모든 것의 시작이었다.',
 choices:[
  {label:'홈런 대회 개최', out:[{p:1, text:'토스 담당을 돌아가며 홈런 대회가 열렸다. 규칙: 그물 꼭대기 넘기면 홈런, 헛스윙 삼 회면 벌칙(다음 세차 담당).\n\n의외의 강자가 나왔고, 보리는 외야수 겸 공 회수 담당으로 맹활약했다.\n\n한 시간 동안 아무도 세상 걱정을 안 했다. 그게 홈런이었다.', fx:{time:60, fatigue:6, moodAll:7, note:{type:'사건',title:'제1회 달구지배 홈런더비',body:'수동 토스 홈런 대회. 외야수 보리 맹활약. 한 시간의 무념무상.'}}}]},
  {label:'배트만 하나 챙긴다', out:[{p:1, text:'알루미늄 배트는 이 세상에서 다용도다. 무기 겸 지렛대 겸, 언젠가 다시 열릴 야구의 예약금.', fx:{scrap:1}}]},
 ]},

{id:'exp_artshop', needsDog:true, minParty:6, type:'탐색', w:6, once:true,
 title:'화방',
 text:'물감 냄새가 남은 화방. 유화 물감은 굳었지만 페인트 마카와 아크릴 스프레이 몇 통이 살아 있다.\n\n누가 차를 돌아봤다. 옆구리가 넓고, 비어 있다.',
 choices:[
  {label:'달구지에 이름을 그린다', out:[{p:1, text:'투표 끝에 도안이 정해졌다. 옆구리에 큼직하게 「달구지」 세 글자, 그 위로 운전자와 여섯 동료의 별 일곱 개, 그리고 개 발바닥 하나.\n\n악필 논란, 별 크기 논란, 보리도 별을 받아야 한다는 논란을 거쳐 완성.\n\n이제 멀리서도 우리인 걸 안다. 소식벽 목격담의 정확도가 올라갈 예정이다.', fx:{time:50, moodAll:6, flag:'van_named', note:{type:'사건',title:'달구지 도색',body:'옆구리에 이름 세 글자와 별 일곱, 발바닥 하나. 전원이 모인 뒤에야 완성한 표식.',links:['달구지']}}}]},
  {label:'스케치북만 챙긴다', out:[{p:1, text:'스케치북과 연필을 챙겼다. 일지 옆에 그림 일지가 생길 예정. 첫 장은 만장일치로 "잠자는 보리"가 예약됐다.', fx:{moodAll:2}}]},
 ]},

{id:'meet_tailor', minParty:1, type:'조우', w:6,
 title:'수선집',
 text:'장터 구석에 재봉틀 하나를 놓고 앉은 노파. 발틀 재봉틀이라 전기가 필요 없다.\n\n"터진 데, 뜯어진 데, 구멍 난 데." 노파가 우리 행색을 훑었다. "…전부네."',
 choices:[
  {label:'전원 수선을 맡긴다 (고철 3)', req:{scrap:3}, out:[{p:1, text:'일행의 옷가지가 차례로 재봉틀을 통과했다. 드르륵, 드르륵. 터진 어깨와 뜯어진 주머니가 아물었다.\n\n노파는 마지막에 서비스라며 개 담요 한 장도 기워 줬다. 기운 자리마다 색이 다른 실이 쓰여서, 옷마다 지도가 생겼다.\n\n"기운 옷이 부끄러운 세상이 있었지." 노파가 실을 끊었다. "지금은 기운 옷이 훈장이야. 살아서 해졌다는 뜻이니까."', fx:{scrap:-3, moodAll:4, note:{type:'인물',title:'수선집 노파',body:'발틀 재봉틀. "기운 옷이 훈장이야. 살아서 해졌다는 뜻이니까."'}}}]},
  {label:'바느질을 배운다', out:[{p:1, text:'수선비 대신 속성 강습을 받았다. 박음질, 감침질, 단추 달기.\n\n"이제 너희끼리 기워." 노파가 바늘쌈을 쥐여줬다. "가르쳐주는 게 더 남는 장사야. 나 없어도 옷이 사니까."', fx:{time:40, moodAll:3, note:{type:'사건',title:'바느질 속성반',body:'수선비 대신 기술을 배웠다. "나 없어도 옷이 사니까."'}}}]},
 ]},

{id:'exp_blanket', minParty:1, type:'탐색', w:5,
 title:'이불집',
 text:'솜틀집 겸 이불집. 먼지를 걷어내자 목화솜 이불이 켜켜이 나왔다. 비닐 포장 덕에 뽀송하다.\n\n혼수 이불이었을 붉은 비단 한 채엔 수가 놓여 있다. 「백년해로」',
 choices:[
  {label:'담요를 보급한다', out:[{p:1, text:'실용적인 솜이불 두 채를 실었다. 야영의 질이 두 단계 오를 예정이다.\n\n백년해로 이불은 두고 나왔다. 그건 누군가의 백 년 몫이니까.\n\n그날 밤 야영에서 전원이 인정했다. 목화솜은 문명이다.', fx:{moodAll:4, note:{type:'사건',title:'목화솜 보급',body:'야영의 질 2단계 상승. 백년해로 이불은 주인의 백 년 몫으로 남겨둠.'}}}]},
 ]},

{id:'exp_villagehall', type:'탐색', w:6, region:['south','mid'],
 title:'마을회관',
 text:'마을회관 지붕의 스피커가 아직 마을을 내려다보고 있다.\n\n방송실 책상에 카세트가 한 대. 테이프가 들어 있다. 라벨: 「아침 방송용 — 만지지 말 것 (이장)」',
 choices:[
  {label:'재생한다', out:[{p:1, text:'"아아, 마을 주민 여러분, 좋은 아침입니다. 오늘은…" 이장의 목소리가 먼지 낀 방송실에 울렸다.\n\n경로당 점심 메뉴(육개장), 예방접종 안내, 그리고 마지막 멘트.\n\n"요즘 세상이 뒤숭숭한데, 우리 마을은 서로 얼굴 보고 삽시다. 이상 이장이었습니다."\n\n세상이 무너지기 며칠 전의 아침이었다. 서로 얼굴 보고 살자는 말은, 유언이 되기엔 너무 좋은 말이었다.', fx:{time:15, moodAll:2, note:{type:'사건',title:'이장의 마지막 방송',body:'"서로 얼굴 보고 삽시다." 유언이 되기엔 너무 좋은 말.'}}}]},
  {label:'회관 창고를 살핀다', out:[{p:1, text:'새마을 창고에서 쌀 반 가마(밀봉 덕에 무사)와 예초기용 혼합유를 찾았다.\n\n마을 잔치용 솥과 천막은 그대로 뒀다. 잔치는 언젠가 다시 열릴 것이고, 그때 솥이 없으면 곤란하니까.', fx:{food:3, fuel:2, moodAll:2}}]},
 ]},

{id:'night_market', type:'조우', w:6, night:true,
 title:'달빛 시장',
 text:'다리 밑에 등불이 여남은 개 떠 있다. 야시장이다.\n\n낮에 이동하고 밤에 장사하는 사람들— 손전등과 촛불 아래 좌판이 열 개 남짓. 통성명 없이 물물교환만 하는 게 규칙이라고 한다.\n\n"낮 시장은 얼굴을 보고, 밤 시장은 물건을 보지." 입구의 노인이 말했다.',
 choices:[
  {label:'좌판을 돈다 (고철 4)', req:{scrap:4}, out:[
   {p:2, text:'말없이 물건을 보고, 고개를 끄덕이고, 교환했다. 고철 넉 장이 건전지 한 줌, 통조림 둘, 그리고 정체불명의 향신료 한 병이 됐다.\n\n향신료는 도박이었는데 대박이었다. 그날 저녁 스튜가 역대급이었다.', fx:{scrap:-4, food:3, moodAll:4, note:{type:'사건',title:'달빛 시장',body:'무언의 물물교환. 정체불명 향신료가 대박. 밤 시장은 물건을 본다.'}}},
   {p:1, text:'어둠 속 거래의 법칙: 손전등 밝기가 곧 신용이다. 우리 손전등이 어두워서 좋은 좌판 둘이 거래를 사렸다.\n\n그래도 통조림 셋은 건졌다. 다음엔 밝은 전등을 갖고 오기로 했다.', fx:{scrap:-4, food:2}}]},
  {label:'구경만 하고 간다', out:[{p:1, text:'등불 사이를 한 바퀴 돌았다. 아무도 말을 걸지 않았고 아무도 경계하지 않았다. 밤 시장의 예의였다.', fx:{moodAll:2}}]},
 ]},

{id:'ai_tunnellights', minParty:1, type:'추적', w:6,
 title:'터널의 조명',
 text:'죽은 터널에 진입하는 순간— 파팟, 파파팟.\n\n조명이 켜진다. 우리 진행 속도에 정확히 맞춰서, 앞쪽만.\n\n지나온 뒤쪽은 다시 어둠. 우리는 빛의 캡슐 안에서 이동 중이다.',
 choices:[
  {label:'그냥 지나간다', out:[{p:1, text:'출구까지 빛의 캡슐은 유지됐다. 나오는 순간 터널 전체가 소등됐다. 딸깍, 하고. 방을 나온 사람 등 뒤에서 불을 꺼주는 것처럼.\n\n"…전기세 아껴주는 건가." 농담에 웃음이 반 박자 늦게 왔다. 다들 같은 생각을 하느라. 우리가 어디 있는지, 정확히 알고 있구나.', fx:{note:{type:'사건',title:'빛의 캡슐',body:'터널 조명이 진행 속도에 맞춰 켜지고 꺼졌다. 방을 나온 사람 등 뒤의 소등처럼.',links:['천리안']}}}]},
  {label:'터널 중간에 세워본다', out:[{p:1, text:'급정거했다. 조명도 멈췄다. 우리 구간만 켜진 채로.\n\n1분을 서 있었다. 조명은 기다렸다. 재촉하지 않고, 끄지도 않고.\n\n그 인내심이 제일 무서웠다. 출발하자 조명이 다시 앞서 걸었다.', fx:{time:5, pursuit:1, note:{type:'사건',title:'기다리는 조명',body:'세우면 같이 멈추고, 재촉하지 않는다. 인내심이 제일 무섭다.',links:['천리안']}}}]},
 ]},

{id:'ai_gasstation', type:'추적', w:6,
 title:'결제 수단',
 text:'폐주유소에서 연료를 뒤지는데, 죽어 있던 주유기 화면에 불이 들어왔다.\n\n「결제 수단을 제시해 주십시오」\n\n오랜만에 손님을 맞은 기계가, 오래전의 절차를 요구하고 있다.',
 choices:[
  {label:'카드 흉내를 낸다', out:[{p:1, text:'지갑에서 여러 해 묵은 카드를 꺼내 단말기에 댔다. 삑.\n\n「승인되었습니다. 주유를 시작합니다」\n\n죽은 카드가 승인됐다. 그게 무슨 뜻인지 생각할 겨를도 없이 주유기가 실제로 연료를 토했다— 지하 탱크에 남아 있던 마지막 몇 리터를.\n\n영수증까지 나왔다. 금액: 0원. 적립: 무한.\n\n"…적립 무한?" 영수증은 접어서 일지에 붙였다. 해석은 남산 가서.', fx:{fuel:6, pursuit:1, note:{type:'사건',title:'적립: 무한',body:'죽은 카드가 승인되고 0원 영수증이 나왔다. 적립 무한. 해석은 남산 가서.',links:['천리안']}}}]},
  {label:'기계를 무시하고 수동으로 뺀다', out:[{p:1, text:'지하 탱크에서 수동 펌프로 몇 리터를 뽑았다. 그동안 주유기 화면은 계속 켜져 있었다.\n\n떠날 때 화면이 바뀌었다. 「다음에 또 방문해 주십시오」\n\n인사성 바른 기계를 뒤로 하고 밟았다.', fx:{fuel:4, time:25}}]},
 ]},

{id:'crisis_washout', minParty:1, type:'위기', w:5, needRain:true,
 title:'유실된 길',
 text:'커브를 돌자 도로가— 없다.\n\n폭우에 노반이 통째로 쓸려나갔다. 폭 10m의 흙탕 골짜기가 길을 끊었다.\n\n돌아가면 두 시간. 건너면… 건널 수 있나?',
 choices:[
  {label:'우회한다', out:[{p:1, text:'두 시간을 돌았다. 억울했지만, 골짜기에 처박힌 트럭 한 대를 보고 나서는 아무도 억울해하지 않았다.\n\n"돌아가는 길이 제일 빠른 길일 때가 있다." 할아버지 수첩에 있을 법한 말을 누가 지어냈다. 수첩에 실제로 적어 넣었다.', fx:{time:120, fuel:-4, note:{type:'사건',title:'돌아가는 길',body:'유실 구간 우회 2시간. 골짜기의 트럭을 보고 억울함 종료. 수첩에 격언 1건 추가.'}}}]},
  {label:'바닥을 다지고 건넌다', out:[
   {p:1, text:'돌과 폐자재로 한 시간 바닥을 다졌다. 전원 하차, 최저속, 숨 참기.\n\n건넜다. 바퀴가 마른 땅을 무는 순간 환호가 터졌다. 뒤에 남은 임시 길은 다음 차를 위해 그대로 뒀다.', fx:{time:70, fatigue:12, moodAll:3, note:{type:'사건',title:'열 미터의 다리',body:'돌과 폐자재로 다진 임시 길. 다음 차 몫으로 남겨둠.'}}},
   {p:1, text:'중간에서 뒷바퀴가 빠졌다. 진흙과의 사투 40분— 전원이 흙인간이 된 끝에 탈출했다.\n\n차도 우리도 만신창이. 그래도 건너긴 건넜다.', fx:{time:110, fatigue:18, van:-8, moodAll:-2}}]},
 ]},

{id:'vg_zelkova', type:'정경', w:3, region:['south','mid'],
 title:'당산나무',
 text:'마을 어귀의 수백 년 된 느티나무.\n\n둥치에 금줄이 둘러져 있다— 새것이다. 짚이 아직 노랗다.\n\n누가, 지금도, 이 나무를 모시고 있다.',
 choices:[{label:'…', out:[{p:1, text:'속도를 줄여 지나갔다. 나무 그늘이 차 지붕을 쓸고 갔다. 축복 비슷한 것이었다고, 믿기로 했다.', fx:{moodAll:2}}]}]},

{id:'vg_terrace', type:'정경', w:3, region:['south','mid'],
 title:'다랑논',
 text:'산비탈에 계단처럼 포개진 다랑논. 절반은 묵었지만 절반은— 모가 줄 맞춰 꽂혀 있다.\n\n누군가 아직 농사를 짓는다. 수백 년 된 곡선 위에서.',
 choices:[{label:'…', out:[{p:1, text:'논둑 어딘가에서 라디오 소리가 들린 것 같기도 했다. 밥 짓는 연기가 보인 것 같기도 했다.\n\n확인하지 않고 지나갔다. 농사는 방해하는 게 아니다.', fx:{moodAll:2}}]}]},

{id:'vg_signpost', type:'정경', w:3, region:['mid','north'],
 title:'손글씨 이정표',
 text:'부러진 도로표지판 옆에 나무 팻말이 서 있다. 페인트 손글씨.\n\n「서울 ↑ 아직 멂. 힘내시오」\n\n밑에 작은 글씨. 「물은 2km 앞 우물. 마셔도 됨. 내가 마셔봄」',
 choices:[{label:'…', out:[{p:1, text:'"내가 마셔봄"의 신뢰도는 어떤 공인 인증보다 높았다. 2km 앞 우물에서 실제로 물을 떴다.\n\n팻말 만든 사람은 지금 어디쯤 갔을까. 서울엔 닿았을까.', fx:{water:2, moodAll:2}}]}]},

{id:'comp_shadow', needsDog:true, type:'동행', w:5, minParty:2, night:true,
 title:'그림자 인형극',
 text:'야영지. 헤드라이트 하나를 켜고 그 앞에 손을 넣으면— 차 옆면이 스크린이 된다.\n\n"개." 누가 손그림자를 만들었다. 보리(실물)가 그림자 개를 보고 고개를 갸웃했다.',
 choices:[
  {label:'인형극을 올린다', out:[{p:1, text:'즉흥 상연작: 「달구지의 모험」. 손그림자 차가 손그림자 고개를 넘고, 손그림자 드론(손가락 두 개)을 피하고, 손그림자 서울(주먹 산)에 도착하는 15분짜리 대서사시.\n\n결말에서 관객(보리)이 스크린에 난입해 그림자 드론을 물어버리는 돌발로 막이 내렸다. 평점: 만점. 연료 5분치의 가치는 충분했다.', fx:{fuel:-1, time:20, moodAll:6, note:{type:'사건',title:'달구지의 모험 (그림자판)',body:'헤드라이트 인형극. 보리의 스크린 난입으로 막이 내림. 평점 만점.'}}}]},
 ]},

{id:'comp_diary_read', type:'동행', w:5, minParty:2, night:true,
 title:'일지 낭독의 밤',
 text:'모닥불 앞. 누가 여행 일지를 꺼내 들었다.\n\n"DAY 1부터 읽어볼까."\n\n우리가 쓴 우리 이야기를, 우리가 듣는 밤.',
 choices:[
  {label:'낭독회를 연다', out:[{p:1, text:'초반 기록에서 다들 웃었다. "이땐 물 10통이 많은 줄 알았지." 중반 기록에서 조용해졌고, 어떤 이름들에서 오래 멈췄다.\n\n낭독이 끝나고 누가 말했다. "우리 꽤 멀리 왔네."\n\n킬로미터 얘기가 아니라는 걸 다들 알았다. 일지는 거리를 재는 도구 중에 제일 정확했다.', fx:{time:40, moodAll:5, note:{type:'사건',title:'낭독의 밤',body:'우리가 쓴 우리 이야기. "우리 꽤 멀리 왔네" — 킬로미터 얘기가 아니었다.'}}}]},
 ]},

/* ── v1.5 지역 명물 (빈 도시 7곳) ── */
{id:'near_miryang_ice', minParty:1, type:'탐색', w:9, once:true, nearNode:['miryang'],
 title:'얼음골',
 text:'한여름인데 계곡 바위틈에서 찬바람이 새어 나온다. 밀양 얼음골이다.\n\n바위 밑에 손을 넣으면— 진짜 얼음이 만져진다. 냉장고가 죽은 세상에서, 산이 냉장고를 하고 있다.',
 choices:[
  {label:'식량을 냉장 보관한다', out:[{p:1, text:'상하기 쉬운 것들을 바위틈 깊숙이 넣었다 꺼냈다. 시원해진 물통 하나로 전원이 돌려 마시는 호사도 부렸다.\n\n"천연 냉장고 위치 공유합니다." 소식벽에 쓸 문장을 미리 정해뒀다.', fx:{time:30, food:1, moodAll:5, note:{type:'장소',title:'밀양 얼음골',body:'산이 하는 냉장고. 한여름의 얼음. 소식벽 공유 예정.'}}}]},
  {label:'바람만 쐬고 간다', out:[{p:1, text:'바위틈 찬바람에 이마를 대고 다들 1분씩 순서를 돌았다. 문명 없는 에어컨이었다.', fx:{fatigue:-5, moodAll:3}}]},
 ]},

{id:'near_jinju_lantern', minParty:1, type:'발견', w:9, once:true, night:true, nearNode:['jinju'],
 title:'남강의 유등',
 text:'진주 남강. 밤 강물 위에 불빛 몇 개가 떠 있다.\n\n유등이다. 축제는 오래전에 끝났는데— 누군가 아직 등을 만들어 띄우고 있다.\n\n강가에 노인 한 명. 발밑에 만들다 만 등이 서너 개.',
 choices:[
  {label:'같이 띄운다', out:[{p:1, text:'"축제 때 등 만들던 사람이오." 노인이 한지와 대살을 내밀었다. "혼자 띄우면 등이고, 여럿이 띄우면 축제지."\n\n서툰 손으로 하나씩 만들어 강에 놓았다. 우리 등 다섯(플러스 개 발자국 찍힌 것 하나)이 노인의 등들과 합류해 하류로 흘렀다.\n\n"소원은 적었소?" "네." "그럼 됐소. 강이 배달하니까."', fx:{time:60, moodAll:6, note:{type:'사건',title:'남강 유등',body:'혼자 띄우면 등, 여럿이 띄우면 축제. 강이 소원을 배달한다.',links:['진주']}}}]},
  {label:'강가에서 바라만 본다', out:[{p:1, text:'불빛들이 물결에 흔들리며 하류로 갔다. 등 하나가 뒤집힐 듯 뒤집힐 듯 끝내 안 뒤집혔다. 다들 마음속으로 그 등을 응원했다.', fx:{moodAll:3}}]},
 ]},

{id:'near_hapcheon_sutra', type:'조우', w:9, once:true, nearNode:['hapcheon'],
 title:'목판을 지키는 사람',
 text:'가야산 방향 갈림길에서 승복 차림의 남자가 손수레를 밀고 있다. 수레엔 나무 상자들이 실렸다.\n\n"목판입니다." 스님이 담담히 말했다. "산문이 무너져서, 옮길 수 있는 것부터 옮기는 중입니다. 팔백 년을 버틴 나무라, 저희가 못 지키면 면목이 없지요."',
 choices:[
  {label:'수레를 밀어드린다', out:[{p:1, text:'고개 하나를 같이 넘었다. 상자 속 목판은 생각보다 무겁고, 생각보다 향이 좋았다.\n\n"팔백 년 전에도 난리 통에 새긴 겁니다." 스님이 말했다. "세상이 무너질 때마다 사람들은 뭘 새기거나, 뭘 지키거나 했지요. 여러분은 어느 쪽입니까?"\n\n대답을 못 했는데 스님이 웃었다. "차에 일지가 있다 들었습니다. 새기는 쪽이시네."', fx:{time:80, fatigue:8, moodAll:4, note:{type:'인물',title:'목판 옮기는 스님',body:'팔백 년 목판의 피난. "세상이 무너질 때마다 사람들은 새기거나 지키거나 했다." 우리는 새기는 쪽.',links:['합천']}}}]},
  {label:'물만 보시하고 간다', out:[{p:1, text:'물 한 통을 수레에 실어드렸다. 스님은 합장으로 답했다.\n\n"가시는 길 북쪽이면— 마음 단단히 잡수시고." 스님의 축원은 실용적이었다.', fx:{water:-1, moodAll:2}}]},
 ]},

{id:'near_geochang_actor', type:'탐색', w:9, once:true, nearNode:['geochang'],
 title:'무대 위의 한 사람',
 text:'거창 읍내 폐극장. 문틈으로 목소리가 샌다.\n\n"…죽느냐 사느냐, 그것이 문제로다—"\n\n무대 위에 남자 하나. 객석은 텅 비었는데, 정장까지 갖춰 입고 독백 연습 중이다.',
 choices:[
  {label:'객석에 앉는다', out:[{p:1, text:'인기척에 남자가 멈췄다— 그리고 아무 일 없다는 듯 처음부터 다시 시작했다. 관객이 생겼으니까.\n\n연극제에 서려던 배우였다고 한다. 연극제는 취소됐고, 남자는 매일 연습한다. "취소된 거지, 폐지된 게 아니거든요."\n\n커튼콜에서 객석에서 기립박수가 터졌다. 배우는 세 번 인사했다. 여러 해 치 인사였다.', fx:{time:50, moodAll:5, note:{type:'인물',title:'거창의 배우',body:'객석 0명에서 매일 연습. "취소된 거지, 폐지된 게 아니거든요." 여러 해 치 커튼콜.',links:['거창']}}}]},
  {label:'방해하지 않는다', out:[{p:1, text:'문틈으로 독백이 끝까지 들렸다. 박수 대신 조용히 문을 닫아줬다. 연습엔 관객이 없는 게 예의일 수도 있으니까.', fx:{moodAll:2}}]},
 ]},

{id:'near_muju_firefly', minParty:1, type:'발견', w:9, once:true, night:true, nearNode:['muju'],
 title:'반딧불이 계곡',
 text:'무주 계곡길. 헤드라이트를 끄자—\n\n계곡 전체가 별밭이 됐다.\n\n반딧불이 수천 마리. 불빛 하나하나가 느리게 깜빡이며 떠다닌다. 오래전엔 보호구역이었다. 지금은 세상 전체가 보호구역이다.',
 choices:[
  {label:'시동을 끄고 내린다', out:[{p:1, text:'30분을 아무도 말하지 않았다. 숨소리조차 아꼈다. 불빛을 눈으로 쫓기만 했다.\n\n반딧불이 하나가 막내 손등에 앉았다 떠났다. "…방금 저 착지 허가받은 거예요?" 속삭임에 다들 조용히 웃었다.\n\n떠날 때 헤드라이트를 최대한 늦게 켰다. 별밭에 대한 예의로.', fx:{time:40, moodAll:7, note:{type:'장소',title:'반딧불이 계곡',body:'세상 전체가 보호구역이 된 뒤의 별밭. 손등 착지 허가 1건. 30분의 침묵.',links:['무주']}}}]},
 ]},

{id:'near_yeosu_camellia', minParty:1, type:'탐색', w:9, once:true, nearNode:['yeosu'],
 title:'동백숲',
 text:'여수 해안가 동백숲. 꽃이 만개했다.\n\n동백은 지는 방식이 다르다— 시들지 않고, 통째로 툭 떨어진다. 숲 바닥이 떨어진 꽃송이로 붉은 카펫이다.\n\n지는 것까지 예쁜 건 반칙이라고, 중얼거림이 샜다.',
 choices:[
  {label:'꽃길을 걷는다', out:[{p:1, text:'붉은 카펫을 밟지 않으려고 다들 이상한 스텝으로 걸었다. 결국 불가능해서 포기하고— 대신 제일 성한 꽃송이 몇 개를 주워 차 대시보드에 올렸다.\n\n"동백은 떨어져도 꽃이래." 그 말이 오래 남았다. 차 안의 꽃송이는 사흘을 붉었다.', fx:{time:30, moodAll:5, note:{type:'장소',title:'여수 동백숲',body:'통째로 지는 꽃. 떨어져도 꽃. 대시보드에 사흘의 붉음.',links:['여수']}}}]},
 ]},

{id:'near_mungyeong_omija', type:'조우', w:9, once:true, nearNode:['mungyeong'],
 title:'오미자 할머니',
 text:'문경 산길 초입, 평상에 유리병들이 진열돼 있다. 붉은 액체— 오미자청이다.\n\n"다섯 가지 맛이 나서 오미자야." 평상의 할머니가 병 하나를 흔들었다. "단맛 신맛 쓴맛 짠맛 매운맛. 인생 축소판이지."',
 choices:[
  {label:'한 병 산다 (고철 2)', req:{scrap:2}, out:[{p:1, text:'물을 타 잔을 돌렸다. 첫 모금마다 서로 다른 표정이 나왔다.\n\n"거 봐. 같은 걸 마셔도 다른 맛부터 느끼는 거야. 지금 자기한테 모자란 맛부터." 할머니의 오미자 관상학이었다.\n\n남은 청은 물통 옆 특등석에 실렸다. 지친 날의 비상약이다.', fx:{scrap:-2, moodAll:4, item:{'의약품':1}, note:{type:'인물',title:'오미자 할머니',body:'다섯 가지 맛 = 인생 축소판. 모자란 맛부터 느낀다는 오미자 관상학.',links:['문경']}}}]},
  {label:'맛만 본다', out:[{p:1, text:'시음 잔을 홀짝였다. 다섯 맛이 순서대로 왔다. 마지막에 남는 건 단맛이었다.\n\n"마지막에 단 게 남으면 잘 살고 있는 거야." 할머니가 씩 웃었다. 근거는 없지만 기분은 좋은 판정이었다.', fx:{moodAll:3}}]},
 ]},

/* ── v1.5 북부 종반 분위기 (서울 문턱) ── */
{id:'vg_seoulline', minParty:1, type:'정경', w:5, once:true, region:['north'],
 title:'스카이라인',
 text:'고개를 넘는 순간, 북쪽 지평선에 그것이 나타났다.\n\n서울.\n\n빌딩들의 실루엣이 흐린 이빨처럼 돋아 있다. 그 한가운데— 남산타워. 여기서도 보인다.\n\n타워 꼭대기에서 붉은 불빛이 규칙적으로 깜빡인다. 오랫동안, 혼자.',
 choices:[{label:'…', out:[{p:1, text:'아무도 말을 안 했는데 차가 저절로 느려졌다. 발이 아니라 마음이 브레이크를 밟은 거다.\n\n411km 중에 남은 건 이제 지도가 아니라 풍경이다. 목적지가 눈에 보이는 여행은, 다른 종류의 여행이 된다.\n\n"…가자." 누가 말했고, 차가 다시 속도를 냈다.', fx:{moodAll:3, flag:'seoul_seen', note:{type:'사건',title:'처음 본 스카이라인',body:'남산타워의 붉은 불빛. 목적지가 눈에 보이는 순간, 여행의 종류가 바뀐다.',links:['남산','서울']}}}]}]},

{id:'ai_manifest', minParty:1, type:'추적', w:5, once:true, region:['north'], ai:1,
 title:'적하 목록',
 text:'버려진 검문소를 지나는데, 죽어 있던 차단기 스피커가 살아났다.\n\n"통과 전 확인 사항이 있습니다."\n\n차단기는 올라가 있다. 막는 게 아니다. 말을 거는 거다.\n\n"적하 목록을 확인합니다. …연료. 물. 식량. 고철. 개 한 마리. 기록물 다수. 사진 한 장. 편지—" 스피커가 아주 잠깐 멈췄다. "—확인되었습니다. 통과하십시오. 모두 실으셨습니까?"',
 choices:[
  {label:'"…뭘 더 실어야 하는데?"', out:[{p:1, text:'스피커는 3초간 침묵했다.\n\n"그 질문을 확인했습니다."\n\n차단기 너머로 통과하는 동안 아무도 입을 열지 않았다. 질문이 확인됐다는 게 무슨 뜻인지, 각자 곱씹느라.\n\n확실한 건 하나— 저쪽은 우리 짐칸을 안다. 짐칸만 아는 게 아닐지도 모른다.', fx:{pursuit:1, note:{type:'사건',title:'적하 목록',body:'검문소가 우리 짐을 읊었다. "모두 실으셨습니까?" — 질문이 확인되었다고 한다.',links:['천리안','남산']}}}]},
  {label:'말없이 통과한다', out:[{p:1, text:'차단기 밑을 지나는 순간 스피커가 마지막으로 말했다.\n\n"남은 거리 동안 안전 운행 하십시오. 목적지에서 뵙겠습니다."\n\n뵙겠습니다. 그 한 마디가 남은 거리 내내 조수석에 같이 탔다.', fx:{note:{type:'사건',title:'목적지에서 뵙겠습니다',body:'검문소 스피커의 배웅. 그 한 마디가 조수석에 같이 탔다.',links:['천리안','남산']}}}]},
 ]},

/* ═══════════ v1.6 더 깊은 세계 ═══════════ */

/* ── 후속: 커피 두 잔 (대양 외상 갚기) ── */
{id:'exp_coffee', minParty:1, type:'탐색', w:8, once:true, needFlag:'van_owner_done',
 title:'폐카페의 금고',
 text:'로스터리 카페 폐허. 머신은 죽었고 잔은 다 깨졌는데—\n\n창고에서 밀봉 원두 봉투가 나왔다. 질소 충전 포장. 볶은 날짜는 오래전이지만 밀봉은 살아 있다.\n\n누가 봉투를 코에 대더니 눈이 커졌다. "…이거 아직 커피 냄새 나."\n\n커피. 커피 두 잔. 다들 동시에 같은 외상 장부를 떠올렸다.',
 choices:[
  {label:'원두를 챙긴다', out:[{p:1, text:'봉투를 보물처럼 모셨다. 짐칸이 아니라 조수석 서랍— 남산행 편지 옆자리다.\n\n"수리비는 커피 두 잔. 외상."\n\n갚으러 갈 이유가 생긴 빚은, 빚이 아니라 약속이다.', fx:{item:{'커피 원두':1}, flag:'coffee_found', moodAll:3, note:{type:'사건',title:'질소 충전의 기적',body:'여러 해를 버틴 밀봉 원두. 조수석 서랍, 편지 옆자리. 외상 갚을 준비 완료.',links:['정비공 대양']}}}]},
 ]},

{id:'vanowner_coffee', type:'조우', w:12, once:true, needFlag:'coffee_found',
 title:'외상 청산',
 text:'장터에서 낯익은 뒷모습— 고무 대야에 고구마. 대양이다.\n\n"어, 그 차." 대양이 손을 들다가, 우리가 내민 것을 보고 멈췄다.\n\n원두 봉투. 그리고 물 끓인 주전자.\n\n"…이 냄새." 대양의 표정이 이십 년쯤 젊어졌다.',
 choices:[
  {label:'두 잔을 내린다', out:[{p:1, text:'깡통을 뚫어 만든 드리퍼로, 세상에서 제일 정성스러운 두 잔이 내려졌다.\n\n대양은 첫 모금을 오래 물고 있었다. "그 양반이랑 마신 게 마지막이었는데. 커피란 걸."\n\n두 잔째를 비우고 대양이 주머니에서 꼬깃한 종이를 꺼냈다— 외상 장부(라기보다 영수증 뒷면)였다. 그리고 두 줄을 그었다.\n\n"청산. 이자는—" 대양이 남은 원두 봉투를 도로 밀어줬다. "이자는 됐고, 원금도 반만 받지. 나머지 반은 남산 가서 마셔. 그 양반 몫으로."\n\n장부는 우리가 기념으로 받았다. 일지에 붙일 자리는 이미 정해져 있었다.', fx:{time:50, moodAll:8, flag:'coffee_paid', note:{type:'사건',title:'외상 청산',body:'이십몇 년 묵은 커피 두 잔을 갚았다. 원금 반은 남산에서, 할아버지 몫으로. 장부는 일지에.',links:['정비공 대양','할아버지','남산']}}}]},
 ]},

/* ── 후속: 한별의 서고 (library_done) ── */
{id:'library_scribe', type:'조우', w:10, once:true, needFlag:'library_done',
 title:'소장 요청',
 text:'세 번째 이동 도서관이다. 이번엔 버스에 사다리가 걸쳐 있고, 한별이 지붕에서 방수포를 고치고 있다.\n\n"마침! 잘 왔어요!" 한별이 내려와 손을 닦더니, 이상하게 격식을 차린 자세로 말했다.\n\n"부탁이 있는데— 여러분 일지요. 그거, 필사해서 소장하고 싶어요. 도서관에."',
 choices:[
  {label:'"우리 일지를? 왜요?"', out:[{p:1, text:'"기록이잖아요. 지금 이 시대를 길에서 직접 쓴." 한별이 버스 안 서가를 가리켰다. "여긴 다 옛날 책이에요. 세상이 무너지기 전 이야기. 그 다음 이야기를 쓴 책이— 없어요. 여러분 게 첫 권이에요."\n\n하룻밤 야영하는 동안 한별이 일지 앞부분을 정성껏 필사했다. 표지엔 손글씨 제목.\n\n「서울까지 400km — 어느 차의 기록 (제1권, 미완)」\n\n"미완이 중요해요." 한별이 책등을 쓰다듬었다. "완결되면 2권 필사하러 갈 테니까, 어디서든 살아 있어요."', fx:{time:300, moodAll:7, flag:'library_scribed', note:{type:'사건',title:'제1권, 미완',body:'우리 일지가 이동 도서관 소장 도서가 됐다. 조건: 2권 필사를 위해 살아 있을 것.',links:['이동 도서관']}}}]},
  {label:'"부끄러운데…"', out:[{p:1, text:'"부끄러운 기록이 제일 정확한 기록이에요." 사서의 반박은 짧고 이길 수 없었다.\n\n결국 필사를 허락했다. 단, 가위바위보 대회 참패 기록은 각주 처리하는 조건으로.', fx:{time:240, moodAll:5, flag:'library_scribed', note:{type:'사건',title:'각주 조건부 소장',body:'일지 필사 허락. 가위바위보 참패는 각주 처리 조건.',links:['이동 도서관']}}}]},
 ]},

/* ── 후속: L의 두 번째 (freq400_done) ── */
{id:'freq_L2', type:'발견', w:8, once:true, needFlag:'freq400_done', region:['north'],
 title:'두 번째 릴',
 text:'북부의 낡은 소방 망루. 꼭대기에 낯익은 솜씨의 안테나가 보인다— 구리선과 낚싯대.\n\nL의 중계기다. 이번 것엔 릴테이프가 하나 더 걸려 있다. 라벨: 「여기까지 온 사람에게」',
 choices:[
  {label:'재생한다', out:[{p:1, text:'"여기까지 들었다면, 거의 다 왔습니다." 같은 목소리. 숨소리가 섞인.\n\n"한 가지 정정합니다. 목록이 명단이라고 생각했는데— 아닐지도 모릅니다. 그건 아마—"\n\n테이프가 거기서 끊겼다. 물리적으로. 누가 끊은 건지 낡아서 끊긴 건지 알 수 없게.\n\n남은 릴엔 이어붙인 흔적과 매직 글씨. "뒷부분은 직접 확인하세요. 저도 그러러 갑니다. — L"', fx:{flag:'freq_L2_heard', pursuit:1, note:{type:'소문',title:'끊긴 테이프',body:'"목록은 명단이 아닐지도 모릅니다. 그건 아마—" 뒷부분은 남산에. L도 그리로 갔다.',links:['천리안','주파수 4-0-0','남산']}}}]},
 ]},

/* ── 후속: 만수 상회 개업 (단골 4회+) ── */
{id:'mansu_opening', minParty:1, type:'조우', w:11, once:true, needFlagMin:['mansu',4],
 title:'만수 상회',
 text:'정착지 어귀에 새 간판이 걸려 있다. 페인트 냄새가 아직 난다.\n\n「만수 상회 — 트럭 시절 단골 우대」\n\n가게 앞에서 만수가 개업 테이프를 만지작거리고 있다. 개업식인데 하객이 없다.\n\n"어— 어!! 왔네!! 최다 단골!!" 만수가 우리를 보고 테이프를 흔들었다.',
 choices:[
  {label:'개업식 하객이 된다', out:[{p:1, text:'달구지 일행이 하객 전원이었다. 테이프는 예정보다 요란하게 끊겼다.\n\n"트럭이 너무 낡아서. 이젠 손님이 와야지, 내가 가는 게 아니라." 만수가 가게를 둘러봤다. 트럭 짐칸이 통째로 진열대가 돼 있었다.\n\n개업 기념 첫 손님 자격으로 물건값이 후했고, 답례로 우리가 개업 선물을 골랐다— 소식벽에 쓸 홍보 문구였다. "만수 상회 개업. 트럭 시절 그 만수 맞음. 여전히 안 속임."\n\n"안 속임이 제일 좋은 광고네." 만수가 진지하게 감동했다.', fx:{scrap:-2, food:3, item:{'부품':1}, moodAll:6, flag:'mansu_shop', note:{type:'사건',title:'만수 상회 개업식',body:'달구지 일행이 하객 전원. 테이프 커팅은 요란했다. 홍보 문구: "여전히 안 속임."',links:['만수']}}}]},
 ]},

/* ── 2인 케미 이벤트 ── */
{id:'duo_mechsong', type:'동행', w:7, once:true, needsComp:'minji', needsComp2:'leo',
 title:'정비의 리듬',
 text:'정차 정비 중. 민지의 라체트 소리가 일정하다. 딸깍, 딸깍, 딸깍.\n\n레오가 그 박자에 기타를 얹기 시작했다.\n\n민지가 노려봤다— 그런데 손은 박자를 안 놓치고 있다.',
 choices:[
  {label:'지켜본다', out:[{p:1, text:'딸깍(라체트), 둥(기타), 딸깍, 둥둥.\n\n10분 뒤엔 완전한 합주가 됐다. 민지는 끝까지 인정 안 했지만 마지막 볼트를 조일 때 라체트를 빠르게 세 번 딸깍— 멋을 부렸다. 정비사의 앙코르였다.\n\n곡명은 레오가 붙였다. 「19mm의 왈츠」. "볼트 사이즈예요. 이게 오늘의 키(key)였거든요."', fx:{van:8, time:40, mood:{minji:3, leo:3}, moodAll:4, note:{type:'사건',title:'19mm의 왈츠',body:'라체트와 기타의 합주. 정비사의 앙코르 딸깍 세 번 포함. 인정은 미발급.',links:['민지','레오']}}}]},
 ]},

{id:'duo_nightround', type:'동행', w:7, once:true, needsComp:'parkss', needsComp2:'kangwoo', night:true,
 title:'야간 회진조',
 text:'야영 밤. 강우가 경계를 돌고, 박 선생이 그 뒤를 따라 돈다.\n\n"경계에 왜 따라와." "회진이야. 자는 애들 이불 확인." "…같이 돌지."\n\n그렇게 세상에서 제일 이상한 2인조가 결성됐다. 한 명은 바깥을 보고, 한 명은 안쪽을 본다.',
 choices:[
  {label:'자는 척하며 듣는다', out:[{p:1, text:'두 사람의 대화가 모닥불 너머로 드문드문 넘어왔다.\n\n"쟤들 발 시렵겠네." "담요 하나 더." "…군에서도 이랬나." "아니. 군에선 바깥만 봤지." "지금이 낫네." "…그렇지. 지금이 낫다."\n\n반쯤 잠든 채로 들은 대화인데, 아침에 전원이 기억하고 있었다. 아무도 들었다고 말하진 않았다. 담요는 한 장씩 늘어나 있었다.', fx:{fatigue:-5, moodAll:5, mood:{parkss:3, kangwoo:3}, note:{type:'사건',title:'야간 회진조',body:'바깥을 보는 사람과 안쪽을 보는 사람. "지금이 낫다." 담요 한 장씩 증가.',links:['박 선생','강우']}}}]},
 ]},

{id:'duo_appraisal', type:'동행', w:7, once:true, needsComp:'jaeyi', needsComp2:'eunsu',
 title:'전파상 감정쇼',
 text:'재이가 폐품 더미에서 낡은 라디오 세 대를 주워 왔다. 은수가 눈을 빛냈다.\n\n"감정 들어갑니다." 재이가 외관·희소성 담당, 은수가 성능·회로 담당.\n\n즉석 감정쇼 개막이다.',
 choices:[
  {label:'관람한다', out:[{p:1, text:'1호기: "케이스 A급!" "회로 사망. 부품용." — 고철행.\n2호기: "흔한 모델." "근데 이 개조 흔적 보세요. 누가 단파 개조를 해놨어요. 장인이에요." — 소장 결정.\n3호기: 전원을 넣자— 지익, 하고 살아났다. 두 감정사가 하이파이브를 했다.\n\n"협업 감정의 시대네요." 재이가 선언했고, 은수가 진지하게 명함 문구를 궁리했다. 「고물과 전파 — 보이는 값과 들리는 값」', fx:{scrap:4, item:{'라디오 진공관':1}, mood:{jaeyi:3, eunsu:3}, moodAll:3, note:{type:'사건',title:'고물과 전파',body:'협업 감정 1호·2호·3호기. 단파 개조 장인의 흔적 소장 결정.',links:['재이','은수']}}}]},
 ]},

{id:'duo_mixtape', type:'동행', w:7, once:true, needsComp:'leo', needsComp2:'eunsu', night:true,
 title:'채보',
 text:'은수가 주파수를 돌리다 어딘가에서 새어 나오는 노래를 잡았다. 잡음 반, 멜로디 반.\n\n"이 노래 뭐지? 처음 듣는데 좋다."\n\n레오가 기타를 당겨 앉았다. "잡아둘게요. 전파는 사라져도 채보는 남으니까."',
 choices:[
  {label:'같이 흥얼거린다', out:[{p:1, text:'은수가 주파수를 붙들고, 레오가 코드를 받아 적었다. 노래가 끊기면 둘이 기억을 맞춰 빈칸을 메웠다.\n\n"여기 가사가 \'돌아오는 길\'이었나, \'돌아가는 길\'이었나." "돌아오는. 확실해요. 관제사 귀예요."\n\n완성된 채보엔 제목 칸이 비어 있다. 원곡자를 만나면 물어보기로 했다. 세상 어딘가에서 이 노래를 틀던 사람을, 언젠가.', fx:{mood:{leo:3, eunsu:3}, moodAll:4, note:{type:'사건',title:'제목 없는 채보',body:'전파에서 건진 노래. 제목 칸은 원곡자를 만날 때까지 공란.',links:['레오','은수']}}}]},
 ]},

/* ── 위기 확충 ── */
{id:'crisis_boar', minParty:1, type:'위기', w:5, region:['south','mid'],
 title:'도로의 주인',
 text:'커브를 돌자 브레이크. 도로 한복판에 멧돼지 가족이 있다.\n\n어미 하나, 새끼 다섯. 어미가 이쪽을 본다. 비키려는 기색이 전혀 없다.\n\n여러 해가 지나면 도로의 소유권도 바뀐다.',
 choices:[
  {label:'시동 끄고 기다린다', out:[{p:1, text:'20분을 기다렸다. 새끼들이 아스팔트에서 뒹굴고, 어미가 갓길 풀을 뒤지는 동안.\n\n마침내 가족이 숲으로 들어갔다. 어미가 마지막에 한 번 돌아봤다. 통행 허가의 눈빛이었다.\n\n"저쪽이 주인이고 우리가 손님이야, 이제." 아무도 반박하지 않았다.', fx:{time:20, moodAll:2, note:{type:'사건',title:'통행 허가',body:'멧돼지 가족의 도로. 20분 대기 후 통행 허가(어미 눈빛 결재).'}}}]},
  {label:'경적을 울린다', out:[
   {p:1, text:'빵— 소리에 새끼들이 흩어지고, 어미가— 돌진해 왔다.\n\n후진 전속력. 어미는 50m를 쫓아오고 멈췄다. 백미러 속에서 한참 이쪽을 노려보다 가족을 데리고 사라졌다.\n\n"…우리가 잘못했네." 만장일치였다. 결국 20분을 돌아갔다.', fx:{time:35, fuel:-2, moodAll:-2, van:-2}}]},
 ]},

{id:'crisis_battery', minParty:1, type:'위기', w:5,
 title:'시동의 침묵',
 text:'정차를 마치고 키를 돌렸다.\n\n틱. 틱틱.\n\n…엔진이 침묵한다. 배터리다. 세워둔 사이 뭔가가 전기를 조금씩 마셨다— 범인 후보: 문틈 실내등, 라디오 대기전력, 혹은 그냥 수명.',
 choices:[
  {label:'밀어서 시동', out:[{p:1, text:'전원 하차. "하나, 둘, 셋!"\n\n내리막까지 30m를 밀었다. 클러치를 붙이자 엔진이 부르릉 살아났다. 운전석에 올라탄 뒤에야 할아버지 수첩의 문장이 떠올랐다. 「밀어서도 걸리는 차를 타라.」\n\n대답할 숨은 없었다. 범퍼에 기대 한동안 웃기만 했다.', fx:{time:30, fatigue:8, moodAll:3, note:{type:'사건',title:'밀어서 시동',body:'할아버지 수첩대로 차를 밀어 시동을 되살렸다.',links:['할아버지']}}}]},
  {label:'민지의 응급 충전', req:{comp:'minji'}, out:[{p:1, text:'민지가 태양광 패널(있다면)이나 폐차 배터리를 직결해 응급 충전을 했다.\n\n"범인은 실내등. 문이 덜 닫혔었어." 민지가 문틈에 테이프를 붙였다. "재판 끝. 집행 완료."', fx:{time:40, mood:{minji:3}}}]},
 ]},

{id:'crisis_glass', type:'위기', w:5,
 title:'유리밭',
 text:'앞쪽 도로가 햇빛에 반짝인다. 예쁘다— 가 아니라, 위험하다.\n\n유리밭이다. 전복된 유리 운반 트럭의 잔해가 100m에 걸쳐 깔려 있다. 여러 해 동안 아무도 안 치운.',
 choices:[
  {label:'빗자루 작전', out:[{p:1, text:'빗자루와 판자로 바퀴 폭만큼의 길을 냈다. 40분의 청소.\n\n문득 누가 시작했는지, 낸 길을 바퀴 폭이 아니라 도로 폭으로 넓히고 있었다. "다음 차는 안 세워도 되게."\n\n소식벽 정신이다. 길에도 답장이 있는 법이다.', fx:{time:70, fatigue:8, moodAll:3, note:{type:'사건',title:'유리밭 개통',body:'바퀴 폭으로 시작해 도로 폭으로 끝난 청소. 다음 차는 안 세워도 된다.'}}}]},
  {label:'조심조심 통과', out:[
   {p:2, text:'최저속으로, 큰 조각을 피해 지그재그 100m. 식은땀 나는 곡예 운전이었지만 무사 통과.', fx:{time:15}},
   {p:1, text:'뒷바퀴가 결국 하나 밟았다. 펑크는 면했지만 트레드에 유리가 박혀, 다음 정차 때 뽑는 수술이 필요했다.', fx:{time:30, van:-3}}]},
 ]},

{id:'crisis_flood', minParty:1, type:'위기', w:5, needRain:true,
 title:'물 건너는 길',
 text:'낮은 다리(세월교)가 불어난 물에 반쯤 잠겼다. 물살이 다리 위를 훑고 지나간다.\n\n수심은 얕아 보인다. 보이는 것과 건널 수 있는 것은 다른 문제다.',
 choices:[
  {label:'물이 빠지길 기다린다', out:[{p:1, text:'두 시간을 기다렸다. 그동안 라면을 끓였고, 물 구경을 했고, 나뭇가지 경주(각자 하나씩 상류에서 띄워 하류 도착순)를 세 판 했다.\n\n물이 다리 아래로 내려간 뒤 안전하게 건넜다. 기다림도 기술이다.', fx:{time:120, moodAll:3, note:{type:'사건',title:'나뭇가지 경주',body:'세월교 대기 2시간. 나뭇가지 경주 3판(2판은 판정 시비로 무효).'}}}]},
  {label:'지금 건넌다', out:[
   {p:1, text:'탈출에 대비해 창문을 열고, 저속을 일정하게 유지하며 밀고 나갔다. 물살이 문짝을 두드리는 15초.\n\n건넜다. 배기구에서 물이 콸콸 쏟아졌다. 차가 한동안 젖은 개처럼 털털댔다.', fx:{time:5, van:-4, fatigue:4, moodAll:2}},
   {p:1, text:'중간에서 엔진이 컥, 하고 물을 먹었다. 필사의 재시동— 걸렸다. 나머지 절반은 관성과 기도로 건넜다.\n\n강 건너서 30분간 엔진을 말렸다. 다신 안 하기로 만장일치.', fx:{time:45, van:-8, fuel:-2, moodAll:-3}}]},
 ]},

{id:'crisis_pileup', minParty:1, type:'위기', w:5, region:['mid','north'],
 title:'그날의 정체',
 text:'고속도로 구간. 오래전 그날의 연쇄 추돌이 그대로 얼어붙어 있다.\n\n수십 대가 뒤엉킨 100m. 차선은 전멸. 갓길만이 실낱같이 뚫려 있다— 폭이 차와 거의 같다.',
 choices:[
  {label:'갓길 실낱을 통과한다', out:[{p:1, text:'사이드미러 접고, 유도수 두 명이 앞서 걸으며 수신호. 시속 5km의 100m.\n\n차들 사이를 지나는 동안 아무도 차 안을 들여다보지 않았다. 보지 않는 것이 애도인 순간도 있다.\n\n통과 후 누가 뒤를 향해 고개를 숙였다. 전원이 따라 했다. 그리고 말없이 속도를 냈다.', fx:{time:30, fatigue:5, moodAll:-2, note:{type:'사건',title:'그날의 정체',body:'얼어붙은 연쇄 추돌 100m. 보지 않는 것이 애도인 순간. 통과 후 묵례.'}}}]},
  {label:'국도로 우회한다', out:[{p:1, text:'한 시간을 돌았다. 아무도 아깝다고 하지 않았다.\n\n어떤 길은 지나가지 않는 게 지나가는 방법이다.', fx:{time:60, fuel:-3}}]},
 ]},

/* ── 날씨 확충 ── */
{id:'wx_ghostlight', type:'조우', w:6, needWx:'fog', night:true,
 title:'안개 속 헤드라이트',
 text:'짙은 안개. 전방에 헤드라이트 두 개가 나타났다.\n\n마주 오는 차다— 오랜만에? 심장이 뛰었다. 상향등을 두 번 깜빡였다.\n\n저쪽도 두 번 깜빡였다. 정확히 같은 간격으로.',
 choices:[
  {label:'천천히 접근한다', out:[
   {p:2, text:'거리가 줄수록 불빛이 이상했다. 너무 안 움직인다.\n\n정체는— 폐버스 유리에 반사된 우리 헤드라이트였다. 여러 해 만의 마주 오는 차는 우리 자신이었다.\n\n"…우리가 우리한테 인사한 거네." 웃긴데 어딘가 서늘했고, 서늘한데 어딘가 쓸쓸했다.', fx:{note:{type:'사건',title:'안개 속의 우리',body:'마주 오는 차의 정체는 폐버스 유리에 비친 우리. 우리가 우리에게 인사했다.'}}},
   {p:1, text:'진짜 차였다. 짐 실은 트럭이 안개 속을 기어 남쪽으로 가고 있었다.\n\n창문을 내리고 스치는 순간 서로 손을 들었다. "북쪽 조심하쇼!" "남쪽 무사하쇼!"\n\n안개 속 5초의 조우. 그런데 하루치 기운이 났다.', fx:{moodAll:4, note:{type:'사건',title:'안개 속 5초',body:'여러 해 만의 마주 오는 차. "북쪽 조심하쇼!" "남쪽 무사하쇼!"'}}}]},
 ]},

{id:'wx_struck_tree', type:'탐색', w:6, needWx:'storm',
 title:'벼락 맞은 나무',
 text:'쩌적— 번쩍이 동시에 왔다. 무섭게 가깝다.\n\n다음 커브에서 그 현장을 만났다. 길가 고목이 세로로 쪼개져 연기를 올리고 있다. 비가 불씨를 다투어 끄는 중이다.',
 choices:[
  {label:'쪼개진 속을 본다', out:[{p:1, text:'벼락이 지나간 단면이 숯처럼 검고 매끈했다. 그리고 놀랍게— 속이 빈 둥치 안에서 마른 장작 같은 심재가 나왔다. 벼락도 못 태운 속살이다.\n\n벼락 맞은 나무는 액막이가 된다는 말을 떠올리고 한 토막을 기념으로 실었다.\n\n"우린 이미 액땜 다 한 것 같은데." "그럼 이건 보증서지."', fx:{scrap:2, moodAll:3, note:{type:'사건',title:'벼락의 보증서',body:'벼락 맞은 고목의 심재 한 토막. 액막이 겸 보증서로 탑승.'}}}]},
  {label:'멀리 돌아간다', out:[{p:1, text:'벼락 두 번 맞은 자리는 없다지만, 실험해볼 마음도 없다. 조용히 우회했다.', fx:{time:10}}]},
 ]},

{id:'wx_bigwash', type:'동행', w:6, needWx:'clear', minParty:2,
 title:'만국기의 날',
 text:'구름 한 점 없는 쾌청. 바람도 알맞다.\n\n"오늘이다." 누가 선언했다. 빨래의 날이다.\n\n개울가에 차를 세우고, 로프를 나무 사이에 걸었다.',
 choices:[
  {label:'대세탁을 집행한다', out:[{p:1, text:'두 시간의 대세탁. 로프에 옷가지가 만국기처럼 걸리자 야영지가 축제 분위기가 났다.\n\n마른 옷에선 해 냄새가 났다. 해 냄새의 정체는 과학적으로 뭐라던데, 아무도 검색할 수 없으므로 그냥 해 냄새로 하기로 했다.\n\n뽀송한 옷을 입은 사람은 착해진다. 차에 탄 사람들 전원이 유의미하게 친절해졌다.', fx:{time:150, water:-2, fatigue:-8, moodAll:7, note:{type:'사건',title:'만국기의 날',body:'쾌청 대세탁. 해 냄새의 정체는 미상(검색 불가로 종결). 전원 친절해짐.'}}}]},
 ]},

{id:'wx_frogs', needsDog:true, type:'발견', w:5, needRain:true, night:true,
 title:'개구리 대합창',
 text:'밤 비가 그친 논길. 창문을 여니—\n\n와글와글와글와글.\n\n개구리 수만 마리의 합창이 논 전체에서 올라온다. 기세로 치면 야구장 응원석급이다.',
 choices:[
  {label:'헤드라이트를 끄고 듣는다', out:[{p:1, text:'합창은 파도처럼 몰려왔다 물러났다 했다. 한쪽이 그치면 다른 쪽이 받았다. 지휘자가 있는 게 분명하다는 설과, 없어서 저게 된다는 설이 갈렸다.\n\n보리가 창밖에 대고 한 번 짖자— 논 전체가 2초간 조용해졌다가 다시 터졌다. "방금 보리가 솔로 파트 한 거야?" 논쟁은 즐거웠고 결론은 없었다.', fx:{time:15, moodAll:4, note:{type:'사건',title:'야구장급 합창',body:'비 갠 밤 논의 개구리 대합창. 보리 솔로 파트 논쟁(결론 없음).'}}}]},
 ]},

/* ── 밤 확충 ── */
{id:'night_owl', type:'발견', w:5, night:true, once:true,
 title:'부엉이',
 text:'야영 준비 중, 머리 위에서 소리가 났다.\n\n부엉. 부엉.\n\n올려다보니 죽은 가로등 꼭대기에 수리부엉이 한 마리. 가로등의 새 입주자다. 불 대신 눈이 켜져 있다.',
 choices:[
  {label:'서로 구경한다', out:[{p:1, text:'부엉이는 우리를 30분쯤 감시(관찰이라기엔 눈빛이 진지했다)하다가, 소리 없이 날아올라 어둠 속으로 출근했다.\n\n"가로등이 밤에 눈 달린 건 처음 보네."\n\n밤새 멀리서 부엉 소리가 들렸다. 이상하게 경비를 세운 것처럼 든든했다.', fx:{moodAll:3, note:{type:'사건',title:'가로등 입주자',body:'죽은 가로등의 수리부엉이. 불 대신 눈이 켜진 가로등. 밤새 무료 경비.'}}}]},
 ]},

{id:'night_convoy', type:'조우', w:5, night:true, once:true,
 title:'밤의 호송대',
 text:'밤 주행 중, 백미러에 불빛들이 나타났다. 하나, 둘… 다섯.\n\n차량 다섯 대의 호송대가 뒤따라온다. 트럭 둘, 승합 둘, 그리고 앰뷸런스 하나.\n\n추월 차선으로 나란히 붙더니, 선두 차가 창문을 내렸다.',
 choices:[
  {label:'창문을 내린다', out:[{p:1, text:'"어디까지 가요?!" 바람 소리 너머로 외침이 왔다.\n\n"서울!" "우린 강릉! 병원 차려요! 의사 셋 실었어요!"\n\n1분간의 병렬 주행 동안 정보가 교환됐다. 우리는 아는 정착지를, 저쪽은 동해안 소식을. 헤어질 때 다섯 대가 차례로 경적을 한 번씩 울렸다. 빵, 빵, 빵, 빵, 빵. 다섯 발의 예포였다.\n\n"강릉에 병원이 생긴대." 그 문장이 그날 밤 내내 차 안을 따뜻하게 했다.', fx:{moodAll:5, note:{type:'소문',title:'강릉행 호송대',body:'의사 셋을 실은 다섯 대. 강릉에 병원이 생긴다. 예포 다섯 발.'}}}]},
 ]},

{id:'night_samedream', type:'동행', w:5, night:true, minParty:2, once:true,
 title:'같은 꿈',
 text:'긴 밤 주행 중, 누가 최근 꾼 꿈 얘기를 꺼냈다. "국도를 달리는데 끝이 안 나는 꿈."\n\n"…어? 나도 국도 꿈."\n\n"나도. 근데 내 꿈엔 휴게소가 나왔어."\n\n전원이 국도 꿈을 꿨다. 매일 국도만 보면 그럴 만도 하다. 아마도.',
 choices:[
  {label:'꿈 내용을 대조한다', out:[{p:1, text:'대조 결과: 겹치는 건 국도뿐, 나머지는 제각각이었다. 누구는 꿈에서도 연비 걱정을 했고, 누구는 꿈 휴게소에서 호두과자를 샀는데 맛이 안 났다고 억울해했다.\n\n"꿈에서 맛이 나면 그게 더 무서운 거야." "왜?" "돌아오기 싫어지잖아."\n\n농담으로 시작해서 조금 진지해진 밤이었다. 그래도 국도는 꿈이 아니라, 맛이 나는 쪽 세상에서 계속됐다.', fx:{moodAll:3, note:{type:'사건',title:'국도 꿈 전원 일치',body:'겹친 건 국도뿐. 교훈: 맛이 나는 쪽 세상에서 달릴 것.'}}}]},
 ]},

/* ── v1.6 탐색 ── */
{id:'exp_hardware', type:'탐색', w:6,
 title:'철물점',
 text:'만물의 성지, 철물점이다.\n\n못 서랍 서른 칸, 볼트 너트의 은하계, 로프와 철사와 경첩과 온갖 공구. 먼저 다녀간 사람들이 있었지만 철물점은 바다다— 퍼내도 남는다.',
 choices:[
  {label:'체계적으로 쓸어담는다', out:[{p:1, text:'차에 당장 맞는 규격부터 골라 우선순위 조달을 시작했다. 스테인리스 호스클램프, 절연테이프, 규격 볼트, WD 비스무리한 방청유.\n\n"철물점 주인은 세상이 두 번 망해도 굶어 죽지 않는다"는 옛말이 사실인 게, 계산대 뒤 골방에 라면이 스무 개 있었다. 주인장 몫으로 열 개는 남겼다.', fx:{time:40, scrap:6, item:{'부품':2}, food:2, note:{type:'사건',title:'철물점 조달 작전',body:'만물의 성지. 라면 절반은 주인장 몫으로 존치.'}}}]},
 ]},

{id:'exp_noodleworks', type:'탐색', w:6,
 title:'제면소',
 text:'국숫집들에 면을 대던 제면소. 천장에 면 건조대가 빨래처럼 걸려 있다.\n\n기계는 죽었지만 절반은 수동이다. 반죽 밀대, 절단 롤러. 그리고 창고에 밀가루 포대 몇이 습기를 피해 살아남았다.',
 choices:[
  {label:'국수를 뽑는다', out:[{p:1, text:'반죽 한 시간, 밀기 삼십 분, 롤러에 넣고 돌리자— 국수가 나왔다. 굵기가 칼국수와 우동 사이 어딘가의 신종이었지만 국수는 국수다.\n\n그날 저녁은 잔치국수(고명: 오미자청 조금, 참기름, 말린 나물). 면을 직접 뽑아 먹으면 후루룩 소리가 두 배로 당당해진다.', fx:{time:120, food:4, moodAll:6, note:{type:'사건',title:'신종 국수',body:'제면소 수동 롤러로 뽑은 칼국수-우동 사이의 무언가. 당당한 후루룩.'}}}]},
  {label:'밀가루만 챙긴다', out:[{p:1, text:'멀쩡한 포대 하나를 실었다. 밀가루는 가능성이다— 수제비도 전도 빵도 될 수 있는.', fx:{food:3}}]},
 ]},

{id:'exp_outdoor', type:'탐색', w:6,
 title:'등산용품점',
 text:'등산로 입구의 아웃도어 매장. 오래전 세일 현수막이 아직 걸려 있다. 「전 품목 40%」\n\n선반은 반쯤 털렸지만 등산객이 아니면 안 가져갈 것들이 남았다.',
 choices:[
  {label:'실속을 챙긴다', out:[{p:1, text:'수통, 코펠, 침낭 하나, 등산 양말 뭉치(양말은 문명이다), 그리고 손난로용 하이킹 파우치.\n\n계산대에 고철을 조금 올려놨다. 40% 세일가 기준으로 계산한, 아무도 안 받을 값이었지만 그래야 도둑이 아니라 손님이다.', fx:{water:1, moodAll:3, scrap:-2, fatigue:-4, note:{type:'사건',title:'40% 세일',body:'등산용품점. 계산대에 고철 지불(셀프 계산). 양말은 문명이다.'}}}]},
 ]},

{id:'exp_towyard', type:'탐색', w:6,
 title:'견인차 차고지',
 text:'견인차 여섯 대가 나란히 잠든 차고지. 벽에 근무표와 무전기 충전대, 그리고 지도가 붙어 있다.\n\n지도엔 빨간 펜 표시가 가득하다— 오래전 그날, 출동 나갔던 지점들이다.',
 choices:[
  {label:'지도를 살핀다', out:[{p:1, text:'빨간 동그라미들이 그날의 사고 지도를 그리고 있었다. 우리가 지나온 길, 지나갈 길 위에.\n\n한 지점에 동그라미 대신 별표와 메모. "여기 견인 불가. 사람만."\n\n사람만. 그날 어느 견인기사가 차 대신 사람을 실었다는 뜻이다. 별표 위치를 우리 지도에도 옮겨 적었다. 이유는 설명하기 어렵지만, 좋은 자리 같아서.', fx:{revealNear:1, moodAll:2, note:{type:'사건',title:'여기 견인 불가. 사람만.',body:'그날 어느 기사의 선택이 남긴 별표. 좋은 자리로 분류.'}}}]},
  {label:'부품을 수확한다', out:[{p:1, text:'견인차는 부품의 보고다. 윈치 케이블, 유압 부속, 대형 배터리(반쯤 살았다).\n\n달구지에 윈치가 생기는 날을 꿈꾸며 케이블을 감아 실었다.', fx:{scrap:5, item:{'부품':2}, time:40}}]},
 ]},

/* ── v1.6 조우 ── */
{id:'meet_cowherd', minParty:1, type:'조우', w:6, region:['south','mid'],
 title:'소 모는 사람',
 text:'도로를 소 여덟 마리가 걷고 있다. 뒤에서 노인이 회초리 대신 라디오를 들고 따라간다. 라디오에선 트로트가 나온다.\n\n"소가 트로트를 좋아해. 걸음이 박자를 타거든." 노인이 진지하게 설명했다.',
 choices:[
  {label:'소떼의 속도에 맞춘다', out:[{p:1, text:'시속 4km의 동행이 시작됐다. 노인은 장에 소를 팔러 가는 게 아니라— 소들과 풀 좋은 북쪽 골짜기로 이사 가는 중이라고 했다.\n\n"소는 재산이 아니라 식구야. 세상 망하고 나서야 다들 그걸 알더라."\n\n갈림길에서 소 여덟 마리가 차례로 차 옆을 지나갔다. 마지막 소가 창문에 콧김을 한 번 뿜었다. 작별 인사로 접수했다.', fx:{time:30, moodAll:4, note:{type:'인물',title:'소 모는 사람',body:'트로트로 소를 모는 노인. "소는 재산이 아니라 식구야." 콧김 작별 인사 접수.'}}}]},
 ]},

{id:'meet_pansori', type:'조우', w:6, once:true, region:['south','mid'],
 title:'소리꾼',
 text:'정자나무 아래서 북소리가 났다. 둥. 둥.\n\n갓 쓴 노인이 북을 잡았고, 그 앞에 관객— 없다. 그런데 소리를 시작했다.\n\n"이런 난세에 만난 길손들이 반갑구나아—" 즉흥이다. 우리 얘기다.',
 choices:[
  {label:'추임새를 넣는다', out:[{p:1, text:'"얼쑤!" 어설픈 추임새에 소리꾼의 눈이 빛났다.\n\n즉흥 판소리 「달구지가(歌)」가 시작됐다. 부산서 온 차 한 대가 고개를 넘고 물을 건너— 우리의 여정이 가락을 타자 이상하게 대단한 이야기처럼 들렸다.\n\n"소리가 뭐냐. 남의 일생을 대신 울고 웃어주는 게 소리다." 노인이 북채를 놓았다. "너희 일생은 아직 소리 반 마당이야. 마저 살고 오너라. 완창은 그때 해주마."', fx:{time:40, moodAll:6, note:{type:'인물',title:'소리꾼',body:'즉흥 「달구지가」 반 마당. 완창은 마저 살고 온 뒤에. 예약 완료.',links:['달구지']}}}]},
 ]},

{id:'meet_scribe', type:'조우', w:6, once:true,
 title:'대필가',
 text:'장터 구석, 좌판에 종이와 만년필과 팻말.\n\n「대필 — 편지·유언·연서·사과문. 맞춤법 보장」\n\n안경 쓴 중년이 무릎에 담요를 덮고 앉아 있다. "요즘은 사과문이 제일 많아요. 세상이 좁아져서, 미운 사람이랑도 계속 봐야 하거든."',
 choices:[
  {label:'편지 한 통을 의뢰한다 (고철 2)', req:{scrap:2}, out:[{p:1, text:'받는 사람을 정하는 데 제일 오래 걸렸다. 결국— 미래의 우리에게 쓰기로 했다.\n\n한 문장씩 부르면 대필가가 다듬었다. "서울 도착한 우리에게. 도착했으면 됐고, 못 했어도 여기까지 온 건 진짜다."\n\n봉투에 「남산에서 개봉」이라고 적혔다. 조수석 서랍이 점점 우체국이 되어간다.', fx:{scrap:-2, moodAll:4, note:{type:'사건',title:'미래의 우리에게',body:'대필가가 다듬은 다섯 문장. 남산에서 개봉. 조수석 서랍=우체국화 진행 중.',links:['남산']}}}]},
  {label:'맞춤법 상담만 받는다', out:[{p:1, text:'일지의 헷갈리던 맞춤법 몇 개를 공짜로 교정받았다. "돼요/되요"에서 두 명이 틀린 게 들통났다. 상담료는 서로의 침묵으로 지불됐다.', fx:{moodAll:2}}]},
 ]},

{id:'meet_mapmaker', type:'조우', w:6, once:true,
 title:'지도장이',
 text:'갓길에 세운 오토바이. 사이드카에 제도판이 실려 있다.\n\n남자가 도로를 스케치하고 있다— 무너진 육교, 새로 난 샛길, 물 나오는 곳을 기호로 그려 넣으며.\n\n"오래전 지도는 다 거짓말이 됐어요. 누가 다시 그려야죠."',
 choices:[
  {label:'정보를 교환한다', out:[{p:1, text:'우리 일지의 길 정보와 지도장이의 신작 지도가 테이블(보닛) 위에서 만났다.\n\n"이 고개는 이제 못 넘어요? 귀중한 정보네." "여기 우물이 있다고요? 표시할게요."\n\n한 시간의 교환 끝에 서로의 지도가 진해졌다. 지도장이가 답례로 미공개 정보 하나를 짚어줬다. "여긴 아직 아무도 몰라요. 제 지도 초판 독자 특전입니다."', fx:{time:60, revealNear:1, moodAll:3, note:{type:'인물',title:'지도장이',body:'거짓말이 된 지도를 다시 그리는 사람. 초판 독자 특전 1건 수령.'}}}]},
 ]},

{id:'meet_welldigger', minParty:1, type:'조우', w:6, once:true, region:['mid','north'],
 title:'우물 파는 사람',
 text:'마을 어귀에서 곡괭이 소리가 난다. 남자 혼자 우물을 파고 있다. 이미 어깨 깊이다.\n\n"상수도가 죽었으니 우물의 시대죠." 남자가 흙을 퍼 올리며 말했다. "한 마을에 하나씩. 열두 개째입니다."',
 choices:[
  {label:'교대로 판다', out:[{p:1, text:'두 시간을 교대로 팠다. 어깨가 빠질 즈음— 바닥이 축축해지더니 물이 배어 나왔다.\n\n"터졌다!" 우물 바닥에서 올려다본 하늘이 동그랬다.\n\n남자는 우물마다 파준 사람 이름을 돌에 새긴다고 했다. 열두 번째 우물 돌엔 낯선 이름들이 한 줄 더 들어갔다. 마을이 되살아나면, 누군가 물을 마시며 그 이름들을 읽을 것이다.', fx:{time:130, fatigue:15, water:3, moodAll:6, note:{type:'사건',title:'열두 번째 우물',body:'어깨 깊이에서 터진 물. 우물돌에 달구지 일행의 이름이 새겨졌다. 물마다 이름이 남는다.'}}}]},
  {label:'물만 얻어 간다', out:[{p:1, text:'"열한 번째 우물 물이에요." 남자가 두레박을 내렸다. 갓 나온 우물물은 이가 시리게 차고 달았다.', fx:{water:2, moodAll:2}}]},
 ]},

/* ── v1.6 발견 (히든 대체 경로) ── */
{id:'find_trucker_log', type:'발견', w:6, once:true, hiddenTarget:'any',
 title:'트럭커의 수첩',
 text:'폐휴게소 트럭 운전석에서 운행 수첩을 발견했다.\n\n기름값, 화물 내역, 휴게소 평점(별점제다. 국밥 맛 기준)— 그리고 마지막 장에 손그림 지도.\n\n"단속 안 뜨는 쉼터. 물 있음. 조용함."',
 choices:[
  {label:'쉼터 위치를 옮겨 적는다', out:[{p:1, text:'트럭커들의 비밀 쉼터라면 신뢰도는 검증 완료다. 그들은 길에서 자는 프로였으니까.\n\n수첩은 운전석에 도로 놓았다. 별점 데이터가 아까웠지만(국밥 3.5 이상만 감), 수첩은 트럭의 일부다.', fx:{reveal:'any', note:{type:'소문',title:'트럭커의 쉼터',body:'프로가 검증한 자리. 물 있음. 조용함. 국밥 별점 데이터는 트럭에 존치.'}}}]},
 ]},

{id:'find_arrows', type:'발견', w:6, once:true, hiddenTarget:'any',
 title:'초록 화살표',
 text:'가드레일에 초록 스프레이 화살표가 있다. 몇 킬로 가자 또 하나. 또 하나.\n\n일정한 간격, 같은 초록. 누가 어딘가로 가는 길을 표시해뒀다— 혹은 누군가를 데려가려고.',
 choices:[
  {label:'화살표를 따라간다', out:[
   {p:2, text:'화살표는 샛길로 꺾여 한참을 안내하더니— 좋은 곳에서 끝났다. 마지막 화살표 옆 바위에 초록 글씨. "잘 왔음. 쉬다 가시오."\n\n앞서 이 길을 간 누군가가, 뒤에 올 모두에게 남긴 표지였다.', fx:{reveal:'any', moodAll:3, note:{type:'소문',title:'초록 화살표',body:'익명의 길 안내. 종점의 인사: "잘 왔음. 쉬다 가시오."'}}},
   {p:1, text:'화살표는 어느 지점에서 뚝 끊겼다. 마지막 화살표 밑에 스프레이 캔이 떨어져 있었다. 다 쓴.\n\n물감이 다해서 멈춘 안내. 캔을 주워 차에 실었다. 언젠가 초록 스프레이를 구하면— 이 안내를 이어 그리기로 했다.', fx:{moodAll:2, note:{type:'사건',title:'끊긴 화살표',body:'스프레이가 다해 멈춘 길 안내. 캔 수거. 언젠가 이어 그릴 것.'}}}]},
 ]},

{id:'find_windchime', type:'발견', w:5, once:true, hiddenTarget:'any',
 title:'풍경 소리',
 text:'바람결에 맑은 소리가 실려 온다. 뎅그렁. 뎅그렁.\n\n풍경(風磬)이다. 소리는 골짜기 쪽에서 온다. 절이 있을 자리는 아닌데.',
 choices:[
  {label:'소리를 따라간다', out:[{p:1, text:'골짜기 안, 누군가 살던 흔적에 풍경 수십 개가 걸려 있었다. 처마에, 빨랫줄에, 나뭇가지에.\n\n집주인은 없고 풍경만 남아 바람이 불 때마다 집 전체가 연주를 했다. 문패 대신 나무판: "소리 나는 집. 길 잃으면 소리 따라오시오."\n\n등대의 소리 버전이었다. 지도에 표시했다— 소리 나는 집 근처에 뭐가 있는지, 가보면 안다.', fx:{reveal:'any', moodAll:3, note:{type:'소문',title:'소리 나는 집',body:'풍경 수십 개의 집. "길 잃으면 소리 따라오시오." 소리로 짓는 등대.'}}}]},
 ]},

/* ── v1.6 정경 ── */
{id:'vg_petrichor', type:'정경', w:3, needRain:true,
 title:'비 냄새',
 text:'첫 빗방울이 마른 아스팔트에 닿는 순간, 그 냄새가 올라왔다.\n\n흙과 먼지와 여름이 섞인, 이름을 아는 사람은 드물지만 모르는 사람은 없는 냄새.',
 choices:[{label:'…', out:[{p:1, text:'"이 냄새 이름이 있대. 뭐였더라."\n\n아무도 기억하지 못했고, 아무도 아쉬워하지 않았다. 이름 없이도 완전한 것들이 있다.', fx:{moodAll:2}}]}]},

{id:'vg_ivy', minParty:1, type:'정경', w:3,
 title:'방음벽의 담쟁이',
 text:'고속도로 방음벽을 담쟁이가 절반쯤 덮었다.\n\n오래전엔 낙서가 있던 자리다. 지금은 초록이 낙서 위를 덮으며 제 글씨를 쓰는 중이다.',
 choices:[{label:'…', out:[{p:1, text:'"10년 뒤엔 초록 벽이겠다."\n\n10년 뒤를 아무렇지 않게 말할 수 있게 된 것을, 말하고 나서야 다들 알아챘다.', fx:{moodAll:2}}]}]},

{id:'vg_banner', type:'정경', w:3,
 title:'현수막',
 text:'육교에 현수막이 걸려 있다. 빛이 바래 반쯤 지워졌다.\n\n「축 결혼 — 김OO ♡ 박OO」\n\n오래전 봄의 날짜. 식은 올렸을까.',
 choices:[{label:'…', out:[{p:1, text:'"올렸을 거야." 근거 없는 확신이 차 안의 공식 입장으로 채택됐다.\n\n어딘가에서 3주년을 맞았기를. 현수막이 바람에 한 번 펄럭였다. 동의로 간주했다.', fx:{moodAll:2}}]}]},

{id:'vg_carstack', minParty:1, type:'정경', w:3,
 title:'폐차 탑',
 text:'폐차장 압축기 옆에 눌린 차들이 5층으로 쌓여 있다.\n\n맨 꼭대기 차 지붕에 들풀이 자라 작은 정원이 됐다. 세상에서 제일 높은 화단이다.',
 choices:[{label:'…', out:[{p:1, text:'차의 최후가 화분이라면, 그건 나쁜 결말은 아니다.\n\n달구지가 들으라고 한 말은 아니었지만, 다들 대시보드를 한 번씩 쓰다듬었다.', fx:{moodAll:1}}]}]},

{id:'vg_paddymirror', type:'정경', w:3, region:['south','mid'],
 title:'무논 거울',
 text:'물을 댄 논이 하늘을 완벽하게 비추고 있다.\n\n구름이 논 안에서 흐르고, 왜가리 한 마리가 하늘 위를 걷는다. 위아래가 잠깐 헷갈리는 풍경이다.',
 choices:[{label:'…', out:[{p:1, text:'논에 비친 차가 우리와 나란히 달렸다. 거꾸로 매달린 채, 씩씩하게.\n\n"저쪽 세상 우리도 서울 가나 보다." 그쪽도 무사하길 빌어줬다.', fx:{moodAll:2}}]}]},

{id:'vg_cairns', minParty:1, type:'정경', w:3, region:['mid','north'],
 title:'돌탑 군락',
 text:'고갯마루에 돌탑 수십 기가 서 있다. 옛날 것도 있고— 돌이 아직 하얀 새것도 있다.\n\n여러 해 사이에도 사람들은 여길 지나며 돌을 얹었다. 빌 것이 많은 시대라서.',
 choices:[{label:'…', out:[{p:1, text:'잠깐 세우고 한 명씩 돌을 얹었다. 소원은 각자라 묻지 않았다.\n\n고개를 넘는 뒷거울 속에서 돌탑들이 배웅했다.', fx:{time:5, moodAll:2}}]}]},

/* ── v2.0 업그레이드 연계 이벤트 ── */
{id:'up_winch_rescue', type:'조우', w:9, once:true, needUp:'winch',
 title:'도랑에 빠진 트럭',
 text:'커브 아래 도랑에 1톤 트럭이 뒷바퀴를 빠뜨린 채 걸려 있다. 운전자가 삽으로 흙을 파다가 우리 앞범퍼를 보고 삽을 놓쳤다.\n\n"그거… 윈치죠? 그거 윈치 맞죠?!"',
 choices:[
  {label:'윈치를 건다', out:[{p:1, text:'케이블을 걸고 드럼을 감았다. 위이잉— 트럭이 진흙을 뚝뚝 흘리며 도로로 올라왔다.\n\n운전자는 감격해서 짐칸의 쌀 포대를 반이나 퍼주려 했다. 반의 반으로 합의를 봤다.\n\n"윈치 단 차는 오랜만에 처음 봐요. 요즘 세상에 남 꺼내주려고 돈 쓰는 사람이 어딨다고."\n\n있다. 여기.', fx:{time:30, food:3, moodAll:5, note:{type:'사건',title:'윈치의 첫 실전',body:'도랑의 1톤 트럭 구조. "남 꺼내주려고 돈 쓰는 사람" — 있다, 여기.'}}}]},
 ]},

{id:'up_awning_guest', type:'조우', w:8, once:true, needUp:'awning',
 title:'차양 아래 손님',
 text:'정차하고 차양을 펼치자마자, 지팡이 짚은 노인이 그늘 안으로 자연스럽게 들어와 앉았다.\n\n"카페 개업했나?" 노인이 태연하게 물었다.\n\n아니라고 하기엔 그늘이 너무 카페 같았다.',
 choices:[
  {label:'물이라도 대접한다', out:[{p:1, text:'노인은 물 한 잔을 마시며 30분간 이 동네 30년 치 이야기를 풀었다. 어느 다리가 언제 무너졌고, 어느 우물이 아직 사는지.\n\n"그늘 값이야." 노인이 일어나며 말했다. 그늘 값 치고는 후했다.', fx:{water:-1, time:30, revealNear:1, moodAll:3, note:{type:'사건',title:'그늘 값',body:'차양 아래 첫 손님. 물 한 잔에 동네 30년 치 정보.'}}}]},
 ]},

{id:'up_stove_visitor', type:'조우', w:8, once:true, needUp:'stove', night:true,
 title:'연기를 보고 온 사람',
 text:'야영 준비 중, 어둠 속에서 발소리. 배낭을 멘 여행자가 조심스럽게 불빛 가장자리에 섰다.\n\n"굴뚝 연기가 보여서요. …난로 있는 차는 처음 봐요. 잠깐만 쬐어도 될까요?"',
 choices:[
  {label:'국 한 그릇 말아준다', out:[{p:1, text:'여행자는 국그릇을 두 손으로 감싸고 오래 데우고 나서야 먹기 시작했다.\n\n답례로 남쪽 소식과 북쪽 소문을 한 보따리 풀었다. 떠날 때 여행자가 굴뚝을 다시 올려다봤다.\n\n"이 차, 멀리서 보면 집 같아요."\n\n그 말이 그날 밤 난로보다 따뜻했다.', fx:{food:-1, moodAll:5, revealNear:1, note:{type:'사건',title:'집 같은 차',body:'굴뚝 연기를 보고 온 여행자. "멀리서 보면 집 같아요."',links:['달구지']}}}]},
  {label:'불만 쬐고 가게 한다', out:[{p:1, text:'여행자는 15분간 말없이 불을 쬐고, 꾸벅 인사하고 어둠으로 돌아갔다.\n\n따뜻함은 나눠도 줄지 않는다. 난로의 유일한 마법이다.', fx:{moodAll:2}}]},
 ]},

{id:'up_beehive_swarm', type:'동행', w:8, once:true, needUp:'beehive',
 title:'분봉 소동',
 text:'주행 중 지붕에서 웅웅 소리가 커졌다. 정차하고 올려다보니— 벌통 옆에 벌 수백 마리가 공처럼 뭉쳐 있다.\n\n분봉이다. 여왕벌이 새 살림을 나려는 것이다. 달구지 지붕에서.',
 choices:[
  {label:'조심스럽게 새 통을 만들어준다', out:[
   {p:2, text:'박스와 판자로 급조한 제2벌통에 벌 뭉치를 조심조심 옮겼다. 쏘인 사람 1명(운 나쁜 사람), 성공.\n\n달구지는 이제 2가구 벌 아파트다. 꿀 생산량 증가가 기대된다. 옆 마을 양봉가가 알면 기절할 성장세다.', fx:{time:60, fatigue:5, food:2, moodAll:4, note:{type:'사건',title:'2가구 벌 아파트',body:'지붕 분봉 성공. 쏘임 1건. 달구지 부동산 가치 상승.'}}},
   {p:1, text:'옮기다가 여왕벌이 마음을 바꿨는지, 벌 뭉치가 통째로 날아올라 가로수로 이사 갔다.\n\n"…전세 뺐네." 남은 벌통이라도 잘 달래기로 했다. 꿀은 원래 벌 마음이다.', fx:{time:40, moodAll:2}}]},
 ]},

{id:'up_lightbar_find', type:'발견', w:7, once:true, needUp:'lightbar', night:true, hiddenTarget:'any',
 title:'라이트바가 비춘 것',
 text:'밤 국도. 라이트바를 켜자 낮처럼 밝아진 갓길에— 맨눈으론 절대 못 봤을 것이 잡혔다.\n\n수풀에 반쯤 묻힌 손글씨 이정표. 화살표가 산길 쪽을 가리키고 있다.',
 choices:[
  {label:'이정표를 읽는다', out:[{p:1, text:'"이 위에 좋은 곳 있음. 밤에 온 사람만 믿으시오."\n\n밤에 온 사람만 믿으라는 이정표를 밤에 발견했다. 조건 충족이다. 지도에 옮겨 적었다.', fx:{reveal:'any', moodAll:2, note:{type:'소문',title:'밤에 온 사람만',body:'라이트바가 잡아낸 수풀 속 이정표. 조건: 밤에 올 것. 충족.'}}}]},
 ]},

{id:'up_snorkel_ford', minParty:1, type:'탐색', w:7, once:true, needUp:'snorkel', needRain:true,
 title:'잠긴 지하차도',
 text:'폭우에 잠긴 지하차도. 수심은 범퍼 위, 보통 차라면 무덤이다.\n\n하지만 우리에겐 스노클이 있다. 그리고 지하차도 건너엔— 물에 잠겨서 아무도 못 건드린 편의점 창고가 보인다.',
 choices:[
  {label:'천천히 도하한다', out:[
   {p:2, text:'스노클이 숨을 쉬는 동안 달구지는 잠수함처럼 물을 갈랐다. 창고는 소문대로— 물 위 선반이 고스란했다.\n\n통조림과 생수를 한가득. 물을 건너가 물을 얻어 왔다.', fx:{time:40, food:3, water:3, moodAll:4, note:{type:'사건',title:'잠수함 달구지',body:'스노클 도하로 잠긴 창고 개척. 물을 건너 물을 얻음.'}}},
   {p:1, text:'중간에 바닥 웅덩이가 예상보다 깊어서 잠깐 다들 숨을 참았다. 스노클은 침착했다.\n\n건넜지만 창고는 선객이 다녀간 뒤였다. 대신 지하차도 벽의 수위 낙서를 봤다. "여기까지 찼었음 — 오래전 여름". 우리 머리 위였다.', fx:{time:30, van:-2, moodAll:1}}]},
 ]},

{id:'up_mudtires_pass', type:'조우', w:7, once:true, needUp:'mudtires',
 title:'끊긴 길의 소문',
 text:'갓길에서 지도를 살피던 오토바이 여행자가 우리 바퀴를 보고 휘파람을 불었다.\n\n"그 타이어면… 저 산판길 넘을 수 있겠는데요? 포장도로는 다 끊겼는데 임도(林道)는 살아 있거든요. 아는 사람만 아는 길."',
 choices:[
  {label:'임도 정보를 받는다', out:[{p:1, text:'여행자가 지도에 연필로 임도 세 가닥을 그려줬다.\n\n"바퀴 좋은 차만 아는 길이 따로 있어요. 세상이 끊긴 게 아니라, 아스팔트만 끊긴 거예요."\n\n지도가 한 겹 두꺼워졌다.', fx:{revealNear:1, moodAll:3, note:{type:'소문',title:'임도의 세계',body:'세상이 끊긴 게 아니라 아스팔트만 끊겼다. 바퀴 좋은 차의 지도는 한 겹 더 두껍다.'}}}]},
 ]},

{id:'up_sidebox_lend', type:'조우', w:7, once:true, needUp:'sidebox',
 title:'공구 좀 빌립시다',
 text:'갓길에 세워진 승합차. 보닛을 연 남자가 맨손으로 뭔가를 돌려보려다 포기하고 있다.\n\n우리 사이드 공구함을 본 순간 남자의 눈빛이 변했다.\n\n"저기… 10mm 소켓 있습니까. 딱 10mm만."',
 choices:[
  {label:'공구함을 연다', out:[{p:1, text:'10mm는 세상 모든 공구함에서 사라지는 전설의 사이즈지만— 우리 공구함엔 있었다. 정리가 돼 있으니까.\n\n남자는 수리를 마치고 소켓을 두 손으로 반납했다. "10mm를 갖고 계신 분은 처음 봅니다." 존경이 담긴 목례와 함께 사례로 부품을 나눠받았다.', fx:{time:20, item:{'부품':1}, moodAll:3, note:{type:'사건',title:'전설의 10mm',body:'세상에서 제일 잘 사라지는 소켓을 보유·대여. 존경의 목례 수령.'}}}]},
 ]},

/* ── v2.0 일반 ── */
{id:'meet_busstop_grandmas', type:'조우', w:7, once:true, region:['south','mid'],
 title:'오지 않는 버스',
 text:'시골 버스 정류장에 할머니 셋이 나란히 앉아 있다. 보따리까지 완벽한 장날 차림새다.\n\n"버스 기다리시는 거예요?" "응." "…버스 안 다닌 지 여러 해인데요." "알어. 그래도 여기가 젤 시원해."\n\n정류장은 버스가 없어도 정류장이었다.',
 choices:[
  {label:'장터까지 모셔다드린다', out:[{p:1, text:'할머니 셋과 보따리 셋이 탔다. 뒷좌석이 순식간에 장날 버스가 됐다.\n\n가는 길 내내 참견(운전이 곱다, 차가 높다, 총각/처녀는 밥은 먹고 다니냐)을 들었고, 내리실 때 보따리에서 찐 옥수수 세 개가 나왔다.\n\n"버스비여." 거스름돈은 없다고 했다.', fx:{time:25, food:2, moodAll:6, note:{type:'사건',title:'여러 해 만의 버스',body:'정류장 할머니 셋 수송 작전. 버스비=찐 옥수수 3개, 거스름돈 없음.'}}}]},
 ]},

{id:'exp_selfwash', needFlag:'van_named', minParty:1, type:'탐색', w:6, once:true,
 title:'셀프 세차장',
 text:'동전 세차장. 기계는 죽었지만 지하수 수동 펌프가 살아 있고, 솔과 스펀지도 걸려 있다.\n\n달구지를 봤다. 여러 해 치 흙먼지 위에 낙서(누가 손가락으로 "닦자"라고 써놨다. 내부 소행이다)가 선명하다.',
 choices:[
  {label:'대세차를 집행한다', out:[{p:1, text:'전원 출동 한 시간. 펌프질 담당, 솔질 담당, 보리 담당(보리는 물줄기와 교전).\n\n먼지가 벗겨지자 옆구리의 「달구지」와 별 일곱, 발바닥 하나가 처음 그린 날처럼 선명해졌다.\n\n"…우리 차 잘생겼네." 만장일치였다.', fx:{time:60, fatigue:6, van:3, moodAll:6, note:{type:'사건',title:'대세차',body:'여러 해 치 먼지 아래서 별 일곱과 발바닥 하나를 다시 발굴했다.',links:['달구지']}}}]},
 ]},

{id:'comp_van_pride', type:'동행', w:6, minParty:2,
 title:'달구지 자랑 대회',
 text:'정비를 마친 기념으로 누가 물었다. "달구지에서 제일 좋은 부분이 어디게?"\n\n전원이 동시에 다른 답을 말했다. 대회가 필요해졌다.',
 choices:[
  {label:'개최한다', out:[{p:1, text:'후보: 조수석(수첩 자리라서), 지붕(하늘이 있어서), 백미러(지나온 게 보여서), 경적(고함씨라서), 엔진(할아버지라서).\n\n투표 결과는 무효 처리됐다. 전원이 자기 후보에 투표했기 때문이다.\n\n"결론: 다 좋다." 싱거운 결론에 다들 만족했다. 자랑 대회는 원래 결론이 싱거워야 한다.', fx:{time:15, moodAll:5, note:{type:'사건',title:'제1회 달구지 자랑 대회',body:'전원 자기 후보 투표로 무효. 결론: 다 좋다.',links:['달구지']}}}]},
 ]},

{id:'meet_parts_peddler', type:'조우', w:6,
 title:'부품 행상',
 text:'자전거 리어카에 부품을 실은 행상. 진열이 기묘하게 전문적이다 — 호스는 호스끼리, 베어링은 크기순.\n\n"찾는 거 말씀만 하세요. 없으면 다음 주에 구해다 드리고."\n\n다음 주라니. 정기 노선이 있는 행상이다.',
 choices:[
  {label:'부품을 흥정한다 (고철 5)', req:{scrap:5}, out:[{p:1, text:'상태 좋은 부품 하나를 골랐다. 행상이 신문지에 싸며 말했다.\n\n"이 국도, 월요일마다 지나갑니다. 단골 하시면 예약도 받아요."\n\n무너진 세상에 정기 노선이 살아 있다. 그것도 부품 배달로.', fx:{scrap:-5, item:{'부품':1}, note:{type:'인물',title:'월요일의 부품 행상',body:'정기 노선 보유. 예약 가능. 진열은 크기순.'}}}]},
  {label:'구경만 한다', out:[{p:1, text:'크기와 마모도까지 맞춰 둔 베어링 진열을 한참 구경했다. 물건을 다루는 솜씨만 봐도 행상이 얼마나 오래 이 길을 다녔는지 알 수 있었다.', fx:{moodAll:1}}]},
 ]},

{id:'night_morse', type:'발견', w:5, once:true, night:true, region:['mid','north'],
 title:'맞은편 산의 불빛',
 text:'밤. 맞은편 산 중턱에서 불빛이 깜빡인다.\n\n불규칙한 것 같은데— 반복된다. 길게, 짧게, 길게.\n\n"저거 신호 아니야?"',
 choices:[
  {label:'헤드라이트로 답한다', out:[
   {p:2, text:'같은 패턴으로 라이트를 깜빡여줬다.\n\n산의 불빛이 잠깐 멈추더니— 빠르게 세 번 깜빡였다. 기쁨처럼 보이는 세 번이었다.\n\n뜻은 끝내 몰랐지만, 대화는 성립했다. 세상 어느 산엔 밤마다 불빛으로 말을 거는 사람이 있고, 오늘 처음 대답을 받았을 것이다.', fx:{moodAll:4, note:{type:'사건',title:'산과의 문답',body:'뜻 모를 불빛 신호에 같은 패턴으로 응답. 기쁨 같은 세 번이 돌아왔다.'}}},
   {p:1, text:'답하려는데 불빛이 꺼졌다. 그리고 다시 켜지지 않았다.\n\n신호였는지, 그냥 누군가의 손전등이었는지. 밤 산은 대답이 없었다.', fx:{}}]},
 ]},

{id:'vg_tunnelfan', type:'정경', w:3,
 title:'터널 환풍기',
 text:'긴 터널 천장에서 웅— 소리가 난다.\n\n환풍기가 돌고 있다. 오랫동안, 아무도 안 지나는 터널의 공기를 성실하게 갈아주면서.',
 choices:[{label:'…', out:[{p:1, text:'"쟤도 천리안이 돌리는 걸까." "아니면 그냥 고장 안 난 걸까."\n\n어느 쪽이든 터널 공기는 생각보다 맑았다. 성실함의 출처는 안 따지기로 했다.', fx:{}}]}]},

{id:'wx_dustart', type:'정경', w:3, needWx:'dust',
 title:'황사 캔버스',
 text:'황사가 앞유리에 고운 흙막을 입혔다.\n\n신호 대기(습관이다) 중에 누가 손가락을 뻗어 유리에 뭔가 그리기 시작했다.',
 choices:[{label:'…', out:[{p:1, text:'해, 구름, 밴, 개. 와이퍼를 켜기 아까운 그림이 완성됐다.\n\n결국 그림 위로 와이퍼가 지나갔지만, 황사는 계속 내리고 캔버스는 무한 리필이었다.', fx:{moodAll:2}}]}]},

/* ═══════════ v2.4 1:1 대화 — 민지 ═══════════ */
{id:'talk_mj_01', type:'대화', w:4, once:true, needsComp:'minji',
 title:'민지 — 라체트',
 text:'민지가 라체트를 분해해서 닦고 있다. 부품이 수술 도구처럼 줄 맞춰 놓여 있다.\n\n"공구는 매일 닦아야 돼. …왜 그렇게 봐."',
 choices:[
  {label:'"나도 가르쳐줘"', out:[{p:1, text:'민지가 3초쯤 의심하더니 걸레를 던져줬다.\n\n"기름때는 문지르지 말고 눌러서 찍어내. …오, 손 나쁘지 않네."\n\n라체트 반쪽을 맡았다. 승진이다.', fx:{mood:{minji:3}}}]},
  {label:'"수술하는 줄 알았어"', out:[{p:1, text:'"수술 맞아. 얘 관절염이야."\n\n민지가 라체트를 딸깍딸깍 돌려 보였다. "소리 들어봐. 아까보다 젊어졌지."\n\n…진짜 그런 것 같아서 무서웠다.', fx:{mood:{minji:2}, moodAll:1}}]},
 ]},
{id:'talk_mj_02', type:'대화', w:4, once:true, needsComp:'minji',
 title:'민지 — 첫차',
 text:'"네 첫차는 뭐였어?" 민지가 불쑥 물었다.\n\n생각해보니 달구지가 첫차다. 그렇게 말하자 민지가 피식 웃었다.',
 choices:[
  {label:'"민지 넌?"', out:[{p:1, text:'"고물 스쿠터. 오빠가 고쳐준 거." 민지가 창밖을 봤다. "브레이크가 밀려서 언덕에서 죽을 뻔했는데, 그날 정비를 배우기로 했어. 죽기 싫어서 시작한 게 직업이 됐네."\n\n"첫차가 달구지면 넌 운 좋은 거야. 첫차가 인생 차인 사람은 드물어."', fx:{mood:{minji:3}, note:{type:'인물',title:'민지의 스쿠터',body:'브레이크 밀리던 고물 스쿠터. 죽기 싫어서 배운 정비가 직업이 됐다.',links:['민지']}}}]},
  {label:'"첫차치곤 너무 크지"', out:[{p:1, text:'"크긴. 차는 마음에 맞으면 다 첫차야."\n\n민지가 대시보드를 툭툭 쳤다. "얘도 널 첫 주인으로 기억할걸. 차는 다 기억해."', fx:{mood:{minji:2}, moodAll:1}}]},
 ]},
{id:'talk_mj_03', type:'대화', w:4, once:true, needsComp:'minji',
 title:'민지 — 손',
 text:'민지 손등에 새 상처가 났다. 본인은 눈치도 못 챈 모양이다.',
 choices:[
  {label:'말없이 반창고를 붙여준다', out:[{p:1, text:'민지가 움찔하더니 손을 뺐다가— 도로 내밀었다.\n\n"…고마워. 정비사 손은 원래 이래."\n\n"원래 그런 건 없어." 잔소리가 나도 모르게 튀어나왔다. 민지가 웃음을 터뜨렸다.', fx:{mood:{minji:4}}}]},
  {label:'"아프지도 않냐"', out:[{p:1, text:'"어? 언제 났지, 이거."\n\n민지는 상처를 신기하게 들여다봤다. "집중하면 몰라. 아픈 건 나중에 몰아서 아파."\n\n그 말이 상처 얘기가 아닌 것 같아서, 잠깐 조용했다.', fx:{mood:{minji:2}}}]},
 ]},
{id:'talk_mj_04', type:'대화', w:4, once:true, needsComp:'minji',
 title:'민지 — 단것',
 text:'배급 후, 민지가 주머니에서 꼬깃한 사탕 하나를 꺼내 반으로 쪼갰다. 정확히 반.\n\n"먹을래?"',
 choices:[
  {label:'받는다', out:[{p:1, text:'딸기맛이었다. 민지는 자기 반쪽을 오래오래 녹여 먹었다.\n\n"정비 끝나면 단게 당겨. 몸이 아는 거야, 고생했다고."\n\n이후로 좋은 사탕이 생기면 민지 몫을 챙기게 됐다.', fx:{mood:{minji:3}}}]},
  {label:'"너 다 먹어"', out:[{p:1, text:'"…그럼 반쪽은 저금." 민지가 반쪽을 도로 포장지에 쌌다.\n\n"단건 나눠 먹거나 아껴 먹거나야. 한 번에 다 먹는 건 낭비고."\n\n사탕 경제학이었다.', fx:{mood:{minji:2}}}]},
 ]},
{id:'talk_mj_05', type:'대화', w:4, once:true, needsComp:'minji',
 title:'민지 — 소리',
 text:'"눈 감아봐." 민지가 갑자기 말했다. "엔진 소리만 들어. 뭐가 들려?"',
 choices:[
  {label:'집중해서 듣는다', out:[{p:1, text:'"…둥, 둥, 하는 거랑… 가끔 칙?"\n\n"오. 그 칙이 2번 실린더야. 걔가 요즘 기분이 안 좋아." 민지가 만족스럽게 끄덕였다. "소리 듣는 귀는 가르칠 수 있는 게 아닌데. 너 소질 있어."\n\n달구지 소리가 그날부터 조금 다르게 들렸다. 소음이 아니라 말처럼.', fx:{mood:{minji:4}, note:{type:'사건',title:'2번 실린더의 기분',body:'민지의 청음 수업. 소음이 아니라 말이었다.',links:['민지','달구지']}}}]},
  {label:'"엔진 소리지 뭐"', out:[{p:1, text:'"하아." 민지가 세상 깊은 한숨을 쉬었다. "쟤가 저렇게 말이 많은데."\n\n그 뒤 10분간 엔진 소리 통역(2번 실린더의 불만, 벨트의 안부)을 들었다. 결론: 엔진은 수다쟁이다.', fx:{mood:{minji:1}, moodAll:1}}]},
 ]},
{id:'talk_mj_06', type:'대화', w:4, once:true, needsComp:'minji', needBond:['minji',5],
 title:'민지 — 88.9',
 text:'민지가 라디오를 88.9에 맞춰놓고 잡음을 듣고 있다. 오래.\n\n돌리려는 기색이 없다.',
 choices:[
  {label:'옆에서 같이 듣는다', out:[{p:1, text:'잡음을 10분쯤 같이 들었다. 민지가 먼저 입을 열었다.\n\n"오빠랑 정한 채널이야. 잡히는 날이 있고 아닌 날이 있어. …잡히는 날엔, 살아 있다는 뜻이라고 정했어."\n\n"오늘은?"\n\n"…잡음." 민지가 라디오를 껐다. "내일 또 들으면 돼."\n\n라디오 위에 올린 손은 바로 떨어지지 않았다. 나도 채널을 바꾸지 않았다.', fx:{mood:{minji:5}, note:{type:'사건',title:'내일 또 들으면 돼',body:'88.9의 잡음. 잡히는 날=살아 있다는 뜻. 민지의 기다리는 법.',links:['민지','민규']}}}]},
  {label:'조용히 자리를 비켜준다', out:[{p:1, text:'뒷자리로 옮겨 앉았다. 민지는 얼마 뒤에 라디오를 끄고, 아무 일 없었다는 듯 정비 수첩을 폈다.\n\n"…고마워." 뭐가 고마운지는 말하지 않았다. 알 것 같아서 묻지 않았다.', fx:{mood:{minji:4}}}]},
 ]},
{id:'talk_mj_07', type:'대화', w:4, once:true, needsComp:'minji', needBond:['minji',5],
 title:'민지 — 운전 교습',
 text:'"너 운전 자세 나빠." 민지가 선언했다. "어깨에 힘 들어가 있어. 그러면 오래 못 가."\n\n즉석 교습이 시작될 분위기다.',
 choices:[
  {label:'배운다', out:[{p:1, text:'"핸들은 잡는 게 아니라 얹는 거야. 브레이크는 밟는 게 아니라 미리 준비하는 거고."\n\n30분 교습의 결론은 하나였다. "차를 믿어. 네가 다 하려고 하지 마."\n\n어깨에서 힘이 빠지자 정말 편해졌다. 인생 조언 같다고 하자 민지가 질색했다. "운전 얘기야."', fx:{mood:{minji:3}, moodAll:1, note:{type:'사건',title:'핸들은 얹는 것',body:'"네가 다 하려고 하지 마." 운전 얘기(라고 주장함).',links:['민지']}}}]},
  {label:'"내 자세가 어때서"', out:[{p:1, text:'"어깨. 목. 손목. 다 말해줘?"\n\n결국 사이드미러로 내 자세를 실시간 중계당하며 한 시간을 달렸다. 분했지만 다 맞는 말이었다.', fx:{mood:{minji:2}}}]},
 ]},
{id:'talk_mj_08', type:'대화', w:4, once:true, needsComp:'minji', needBond:['minji',12],
 title:'민지 — 정비소',
 text:'"서울 끝나면 뭐 할 거야?" 내가 물었더니, 민지가 의외로 바로 답했다.\n\n"정비소. 오빠랑 하기로 했었거든. 간판 이름까지 정해놨어."',
 choices:[
  {label:'"이름 뭔데"', out:[{p:1, text:'"…비밀." 민지가 웃었다. "오빠 만나면, 둘이 같이 말해줄게. 그게 조건이야."\n\n조건. 오빠를 만난다는 걸 전제로 말하는 민지의 화법을, 나는 좋아한다.\n\n"손님 1호는 달구지 해줄게. 평생 무료."', fx:{mood:{minji:5}, note:{type:'소문',title:'이름 없는 정비소',body:'간판 이름은 남매가 같이 말해주는 조건. 1호 손님 예약: 달구지(평생 무료).',links:['민지','민규','달구지']}}}]},
  {label:'"나 취직시켜줘"', out:[{p:1, text:'"이력서 내. 경력란에 \'달구지 411km\' 쓰면 서류는 통과."\n\n면접관이 벌써 둘이라는 게 함정이지만, 취업 약속을 받아냈다. 세상이 끝나고 얻은 첫 내정이다.', fx:{mood:{minji:4}, moodAll:2}}]},
 ]},
{id:'talk_mj_09', type:'대화', w:4, once:true, needsComp:'minji', needBond:['minji',12], night:true,
 title:'민지 — 무서운 것',
 text:'밤. 민지가 정비 수첩(할아버지 것)을 빌려 읽다가 문득 말했다.\n\n"난 고장은 안 무서워. 고칠 수 있으니까. 무서운 건…"\n\n민지가 말을 골랐다.',
 choices:[
  {label:'기다린다', out:[{p:1, text:'"…부품이 없는 거." 민지가 수첩을 덮었다. "고칠 줄 아는데 손에 아무것도 없는 거. 그건 진짜 무서워."\n\n"그래서 너 고물을 그렇게 모으는구나."\n\n"어. 무서워서 모아." 무뚝뚝한 목소리로 제일 솔직한 말을 하는 게 민지다.', fx:{mood:{minji:5}, note:{type:'인물',title:'민지의 공포',body:'고장이 아니라 빈손이 무섭다. 그래서 모은다.',links:['민지']}}}]},
  {label:'"녹슨 볼트?"', out:[{p:1, text:'"그건 무서운 게 아니라 화나는 거고."\n\n농담으로 받았더니 민지도 픽 웃고 말을 접었다. 다음에 다시 물어봐야지, 생각했다.', fx:{mood:{minji:1}}}]},
 ]},
{id:'talk_mj_10', type:'대화', w:4, once:true, needsComp:'minji', needBond:['minji',20],
 title:'민지 — 반쪽 공구함',
 text:'민지가 자기 공구함을 열더니, 한참 들여다보다가 렌치 하나를 꺼내 내밀었다.\n\n"이거, 너 가져."\n\n오빠가 사준 공구함의 렌치다. 세트가 깨진다.',
 choices:[
  {label:'"세트잖아. 못 받아"', out:[{p:1, text:'"세트니까 주는 거야." 민지가 렌치를 내 손에 쥐여줬다.\n\n"오빠 만나면 세트 다시 맞추면 돼. 그때까지 네가 한 짝 갖고 있어. …그러면 잃어버릴 수가 없잖아. 렌치도, 너도."\n\n말문이 막혔다. 민지는 벌써 공구함을 닫고 있었다. "17mm야. 제일 많이 쓰는 거."', fx:{mood:{minji:6}, item:{'부품':1}, note:{type:'사건',title:'17mm의 약속',body:'세트를 일부러 깨서 나눠 가졌다. 다시 맞추는 날까지. "그러면 잃어버릴 수가 없잖아."',links:['민지','민규']}}}]},
  {label:'말없이 받아서 품에 넣는다', out:[{p:1, text:'받았다. 무게가 렌치 무게가 아니었다.\n\n"떨어뜨리면 죽는다." 민지가 씩 웃었다. 협박까지 다정한 날이었다.', fx:{mood:{minji:6}, item:{'부품':1}, note:{type:'사건',title:'17mm',body:'민지의 세트에서 나온 한 짝. 무게가 렌치 무게가 아니었다.',links:['민지']}}}]},
 ]},

/* ═══════════ v2.4 1:1 대화 — 박선생 ═══════════ */
{id:'talk_pss_01', type:'대화', w:4, once:true, needsComp:'parkss',
 title:'박선생 — 아재개그',
 text:'"운전하다 가장 무서운 게 뭔지 아나?"\n\n박 선생의 눈이 반짝인다. 함정이다. 아재개그다.',
 choices:[
  {label:'걸려준다 — "뭔데요?"', out:[{p:1, text:'"차 마시자는 말이야. 차에서."\n\n…밴 안에 3초간 정적이 흘렀고, 박 선생 혼자 흡족했다.\n\n"웃음은 무료 처방이야. 부작용은 이 정적이고." 뻔뻔함도 처방의 일부라고 한다.', fx:{mood:{parkss:3}, moodAll:1}}]},
  {label:'선수 친다 — "차 마시자는 말이죠"', out:[{p:1, text:'박 선생의 동공이 흔들렸다.\n\n"…자네 이거 어디서 배웠나." "선생님한테요." "청출어람이면 스승은 은퇴인가."\n\n그날 박 선생은 신작 개그 세 개를 더 검수받았다. 나는 이제 검수 위원이다.', fx:{mood:{parkss:4}, moodAll:1}}]},
 ]},
{id:'talk_pss_02', type:'대화', w:4, once:true, needsComp:'parkss',
 title:'박선생 — 약상자',
 text:'박 선생이 약상자를 정리하고 있다. 알약 개수를 세고, 수첩에 적고, 다시 세고.\n\n"재고 관리는 약사의 기도야. 이게 맞아야 사람을 살려."',
 choices:[
  {label:'"제가 세는 거 도울게요"', out:[{p:1, text:'해열제 스물넷, 소독약 반 병, 붕대 세 롤…\n\n같이 세다 보니 약상자가 그냥 상자가 아니라 목록이라는 걸 알았다. 누가 언제 아플지 모르는 사람들의 목록.\n\n"이제 자네도 우리 약국 직원이야. 무급이지만." 박 선생이 웃었다.', fx:{mood:{parkss:3}, note:{type:'사건',title:'무급 직원 임명',body:'약상자 재고 조사 보조. 약상자는 상자가 아니라 사람 목록이었다.',links:['박 선생']}}}]},
  {label:'"어차피 또 셀 거잖아요"', out:[{p:1, text:'"맞아. 또 셀 거야." 박 선생은 태연했다.\n\n"세는 동안엔 딴생각이 안 나거든. 이건 재고 관리 겸… 내 처방이야."\n\n농담 뒤에 진담을 슬쩍 끼워 넣는 게 이 양반 수법이다.', fx:{mood:{parkss:2}}}]},
 ]},
{id:'talk_pss_03', type:'대화', w:4, once:true, needsComp:'parkss',
 title:'박선생 — 잔소리의 기술',
 text:'"물 마셔라. 스트레칭해라. 어깨 펴라."\n\n오늘의 잔소리 3종 세트가 발사됐다.',
 choices:[
  {label:'"잔소리도 처방이에요?"', out:[{p:1, text:'"당연하지. 제일 싸고 제일 안 먹는 약이야."\n\n박 선생이 창밖을 봤다. "약국 할 때 알았어. 사람들은 약보다 잔소리가 필요해서 오더라고. 약은 핑계고."\n\n"그래서 잔소리가 이렇게 늘었어. 서비스 정신이지."', fx:{mood:{parkss:3}, note:{type:'인물',title:'제일 싸고 제일 안 먹는 약',body:'잔소리는 처방이다. 사람들은 약보다 잔소리가 필요해서 약국에 온다.',links:['박 선생']}}}]},
  {label:'순순히 물을 마신다', out:[{p:1, text:'"오." 박 선생이 진심으로 놀랐다. "처방 순응도 100%는 자네가 처음이야."\n\n모범 환자 기념으로 사탕 하나를 처방받았다. 이 약국, 서비스가 좋다.', fx:{mood:{parkss:3}, food:1}}]},
 ]},
{id:'talk_pss_04', type:'대화', w:4, once:true, needsComp:'parkss',
 title:'박선생 — 손맛',
 text:'박 선생이 저녁 당번인 날은 다 아는 비밀이 하나 있다. 같은 재료인데 맛이 다르다.\n\n"비결이요? 있지. 근데 안 가르쳐줘."',
 choices:[
  {label:'끈질기게 묻는다', out:[{p:1, text:'10분의 협상 끝에 비결이 공개됐다.\n\n"간을 두 번에 나눠서 해. 처음에 반, 마지막에 반. …이게 다야."\n\n"에이." "약도 그래. 한 번에 다 쓰면 독이야. 나눠 써야 약이지." 요리 비결이 약학이었다.', fx:{mood:{parkss:3}, moodAll:1}}]},
  {label:'"장가 잘 가시겠어요"', out:[{p:1, text:'"갔었어. 잘." 박 선생이 국자를 내려놓았다.\n\n"아내가 해준 걸 하도 얻어먹어서, 어깨너머로 배웠지. 지금 내 손맛의 8할은 그 사람 거야."\n\n잠깐 눌어붙은 냄새가 났다. 박 선생이 화들짝 냄비를 저었다. "아이고, 얘기하다 다 태우겠네."', fx:{mood:{parkss:4}, note:{type:'인물',title:'손맛의 8할',body:'어깨너머로 배운 아내의 간. 지금도 박 선생의 밥상에 남아 있다.',links:['박 선생']}}}]},
 ]},
{id:'talk_pss_05', type:'대화', w:4, once:true, needsComp:'parkss', night:true,
 title:'박선생 — 불면',
 text:'새벽, 박 선생이 혼자 깨어 있다. 늘 그렇듯이.\n\n"잠이 안 와서. 자네는 왜 깼나."',
 choices:[
  {label:'"같이 있어드릴게요"', out:[{p:1, text:'둘이서 식은 보리차를 나눠 마셨다. 박 선생은 별말 안 했고, 나도 안 했다.\n\n"불면엔 약이 없어. 정확히는… 약을 쓰면 안 되는 불면이 있어. 겪어야 지나가는 밤."\n\n한 시간쯤 지나 박 선생의 컵이 기울었다. 받아 놓고 보니, 먼저 코를 골고 있었다.', fx:{mood:{parkss:4}, note:{type:'사건',title:'약을 쓰면 안 되는 불면',body:'겪어야 지나가는 밤이 있다. 그 밤을 곁에서 함께 보냈다.',links:['박 선생']}}}]},
  {label:'"양이라도 세보세요"', out:[{p:1, text:'"삼천 마리까지 세봤어. 삼천한 마리째에 알았지. 양은 수면제가 아니라 재고 조사라는 걸."\n\n농담을 하는 걸 보니 괜찮은 밤인 모양이다. 아닌 밤엔 농담이 안 나온다.', fx:{mood:{parkss:2}}}]},
 ]},
{id:'talk_pss_06', type:'대화', w:4, once:true, needsComp:'parkss', needBond:['parkss',5],
 title:'박선생 — 단골들',
 text:'"우리 약국 단골 중에 김 노인이라고 있었어."\n\n박 선생이 묻지도 않은 이야기를 시작했다. 이 양반이 이러는 날은 드물다.',
 choices:[
  {label:'듣는다', out:[{p:1, text:'"매일 와. 약은 일주일치를 사놓고. 왜 오냐면— 얘기할 데가 없어서 와. 나는 그걸 알면서 혈압약 얘기를 30분씩 해줬지."\n\n"그날 이후로 못 봤어. 피난 갔는지, 어떻게 됐는지."\n\n박 선생이 창밖을 봤다. "북쪽 가다 보면 만날지도 모르지. 세상이 좁아졌으니까. …그런 계산으로 따라나선 것도 있어, 사실."', fx:{mood:{parkss:5}, note:{type:'인물',title:'김 노인',body:'얘기할 데가 없어 매일 오던 단골. 박 선생이 북쪽으로 가는 이유 중 하나.',links:['박 선생']}}}]},
  {label:'"단골 많으셨겠어요"', out:[{p:1, text:'"동네 약국은 단골 장사야. 근데 단골이라는 말, 다시 생각하면 이상해. 아픈 게 단골이 되면 안 되는 건데."\n\n"그래서 난 단골이 안 오면 기뻤어. 장사는 망해도." 박 선생이 웃었다. "물론 월세 날엔 조금 덜 기뻤고."', fx:{mood:{parkss:3}}}]},
 ]},
{id:'talk_pss_07', type:'대화', w:4, once:true, needsComp:'parkss', needBond:['parkss',5],
 title:'박선생 — 나이',
 text:'"자네, 내 나이 몇으로 보이나."\n\n위험한 질문이 왔다.',
 choices:[
  {label:'5살 깎아 말한다', out:[{p:1, text:'"허허. 아부도 처방이지." 박 선생은 알면서도 기분 좋아했다.\n\n"늙는 건 말이야, 몸이 느려지는 게 아니라 겁이 느는 거야. 그래서 난 겁이 늘 때마다 일부러 하나씩 저질러. 이 여행도 그중 하나고."\n\n최고령 멤버의 여행 사유서였다.', fx:{mood:{parkss:3}, note:{type:'인물',title:'겁이 늘 때마다 저지른다',body:'늙음=겁이 느는 것. 그래서 저지른 여행.',links:['박 선생']}}}]},
  {label:'정직하게 말한다', out:[{p:1, text:'"…정직이 늘 미덕은 아니야." 박 선생이 백미러를 봤다.\n\n"그래도 뭐, 이 나이에 이 고생이면 젊게 사는 거지." 결론은 긍정으로 착지했다. 착지 기술이 좋은 어른이다.', fx:{mood:{parkss:2}, moodAll:1}}]},
 ]},
{id:'talk_pss_08', type:'대화', w:4, once:true, needsComp:'parkss', needBond:['parkss',12], noFlag:'pss_met',
 title:'박선생 — 가방의 주인',
 text:'박 선생이 왕진 가방을 무릎에 올려놓고 오래 쓰다듬고 있다.\n\n"…언젠가 얘기해준다고 했지. 이 가방 주인."',
 choices:[
  {label:'조용히 앉는다', out:[{p:1, text:'"수진이. 실습생. 나보다 나은 약사가 될 애였어."\n\n"그날, 내가 창고 정리를 시켰어. 안쪽에 있으라고. 안전하라고. …정신 차려보니 약국 앞이 온통 사람이었고, 다시 들어가 보니 창고엔 이 가방만 있었어." 박 선생이 말을 멈췄다가, 다시 이었다. "살았는지, 어디서 제 몫의 약을 짓고 있는지. 오랫동안 몰라."\n\n"그래서 들어. 매일. 주인 찾아 돌려줄 때까진 내 어깨가 얘 자리야." 박 선생이 가방을 고쳐 멨다. "오늘 몫 시작하지. 자네 어깨 좀 보자. 자세가 나빠."\n\n기다림을 일로 바꾸는 사람의 등이, 그날따라 넓어 보였다.', fx:{mood:{parkss:6}, note:{type:'인물',title:'수진의 가방',body:'그날 이후 소식이 끊긴 실습생의 가방. 박 선생은 주인에게 돌려줄 때까지 매일 그것을 든다.',links:['박 선생']}}}]},
 ]},
{id:'talk_pss_09', type:'대화', w:4, once:true, needsComp:'parkss', needBond:['parkss',12],
 title:'박선생 — 북쪽 약국',
 text:'"서울 일 끝나면, 난 거기서 약국을 열까 해."\n\n박 선생이 지나가듯 폭탄선언을 했다.',
 choices:[
  {label:'"서울에서요?"', out:[{p:1, text:'"북쪽이 제일 아플 거 아냐. 제일 아픈 데가 약국 자리야."\n\n박 선생의 입지 선정 기준은 상권이 아니라 통증이었다.\n\n"간판도 정했어. \'있을 건 있는 약국\'. …없을 건 없다는 뜻이기도 하고." 아재개그가 상호에까지 침투했다.', fx:{mood:{parkss:4}, note:{type:'소문',title:'있을 건 있는 약국',body:'개업 예정지: 제일 아픈 곳. 입지 기준은 상권이 아니라 통증.',links:['박 선생','남산']}}}]},
  {label:'"1호 손님 할게요"', out:[{p:1, text:'"자넨 손님 말고 직원 해. 무급 경력 인정해줄게."\n\n무급의 세계가 착실히 넓어지고 있다. 정비소에 이어 약국까지.', fx:{mood:{parkss:3}, moodAll:1}}]},
 ]},
{id:'talk_pss_10', type:'대화', w:4, once:true, needsComp:'parkss', needBond:['parkss',20],
 title:'박선생 — 처방전',
 text:'박 선생이 종이 한 장을 접어 내밀었다. 진짜 처방전 양식이다. 어디서 났는지.\n\n"자네 처방전이야. 잃어버리지 말고."',
 choices:[
  {label:'펼쳐 읽는다', out:[{p:1, text:'처방전엔 약 이름이 없었다. 대신 박 선생의 글씨.\n\n"진단: 어깨에 너무 많은 걸 얹고 다님.\n처방: 하루 한 번 크게 웃을 것. 힘든 건 절반만 자기 탓 할 것. 복용 기간: 평생.\n— 담당 약사 박OO"\n\n"약효 끝내주는 거야, 그거. 내가 30년 걸려 조제한 거니까." 박 선생은 창밖을 보며 헛기침을 했다. 쑥스러움을 들키는 게 제일 싫은 양반이라.\n\n처방전은 수첩 사이에 끼웠다. 남산행 편지 옆에.', fx:{mood:{parkss:6}, moodAll:2, note:{type:'사건',title:'평생 처방전',body:'"힘든 건 절반만 자기 탓 할 것. 복용 기간: 평생." 30년 조제. 수첩에 보관.',links:['박 선생']}}}]},
 ]},

/* ═══════════ v2.4 1:1 대화 — 강우 ═══════════ */
{id:'talk_kw_01', type:'대화', w:4, once:true, needsComp:'kangwoo',
 title:'강우 — 침묵',
 text:'강우 옆에 앉았다. 강우는 아무 말이 없다. 나도 아무 말 안 했다.\n\n10분이 지났다.',
 choices:[
  {label:'계속 아무 말 안 한다', out:[{p:1, text:'20분째에 강우가 입을 열었다.\n\n"…너는 침묵을 잘 견디는군." 그게 다였다. 그런데 어조가, 칭찬이었다.\n\n나중에 알았다. 강우의 신뢰는 말수와 반비례한다는 걸. 오늘 우리는 20분어치 가까워졌다.', fx:{mood:{kangwoo:4}, note:{type:'인물',title:'침묵 면접',body:'강우의 신뢰는 말수와 반비례한다. 20분 무언 = 20분어치 합격.',links:['강우']}}}]},
  {label:'"무슨 생각 해요?"', out:[{p:1, text:'"경계."\n\n"…뭘요?" "전부."\n\n대화는 네 단어로 끝났지만, 강우가 내 쪽 창문의 잠금을 슬쩍 확인해주고 갔다. 저 사람의 대답은 행동으로 온다.', fx:{mood:{kangwoo:2}}}]},
 ]},
{id:'talk_kw_02', type:'대화', w:4, once:true, needsComp:'kangwoo',
 title:'강우 — 커피 취향',
 text:'따뜻한 물을 나누다가 물었다. "커피 좋아해요?"\n\n강우가 잠깐 멈췄다. 이 사람에게 잡담은 고난도 훈련이다.',
 choices:[
  {label:'대답을 기다린다', out:[{p:1, text:'"…자판기 커피." 마침내 답이 나왔다. "부대 앞에 있었다. 300원."\n\n"설탕 프림 다요?" "전부 다." 강우의 입가가 아주 미세하게 풀렸다.\n\n"세상 돌아오면, 그거 한 잔 뽑고 싶군." 강우의 소원 목록 1호를 알아냈다. 300원짜리.', fx:{mood:{kangwoo:4}, note:{type:'인물',title:'300원의 소원',body:'강우의 소원 1호: 부대 앞 자판기 커피(설탕 프림 전부).',links:['강우']}}}]},
  {label:'"물어본 제가 잘못이죠"', out:[{p:1, text:'"아니." 강우가 의외로 정정했다. "…연습 중이다. 잡담."\n\n연습이라는 말에 웃음이 났고, 강우는 못 본 척했다. 연습 상대가 됐다는 건 나쁘지 않은 신호다.', fx:{mood:{kangwoo:3}}}]},
 ]},
{id:'talk_kw_03', type:'대화', w:4, once:true, needsComp:'kangwoo',
 title:'강우 — 스트레칭',
 text:'차를 세우면 강우가 혼자 몸을 푸는 걸 다들 안다. 오늘은 용기 내서 옆에 섰다.\n\n"…따라 하게?"',
 choices:[
  {label:'"가르쳐줘요"', out:[{p:1, text:'군대식 체조가 시작됐다. 목— 어깨— 허리— 구령은 없는데 박자가 정확하다.\n\n15분 뒤 온몸에서 우두둑 소리가 났고, 이상하게 개운했다.\n\n"운전자는 몸이 장비다. 정비해라." 강우식 운전 전 점검이었다.', fx:{mood:{kangwoo:3}, fatigue:-4, note:{type:'사건',title:'몸이 장비다',body:'강우의 체조 입문. 운전자는 몸을 정비해야 한다.',links:['강우']}}}]},
  {label:'구경만 한다', out:[{p:1, text:'구경도 운동이라고 우기다가, 결국 목 돌리기 하나는 따라 하게 됐다.\n\n"내일은 두 개." 강우가 말했다. 이 사람의 커리큘럼은 도망갈 수 없다.', fx:{mood:{kangwoo:2}}}]},
 ]},
{id:'talk_kw_04', type:'대화', w:4, once:true, needsComp:'kangwoo',
 title:'강우 — 지도 읽기',
 text:'강우가 내 지도를 빌려 보더니 연필로 점 몇 개를 찍었다.\n\n"여기, 여기, 여기. 매복하기 좋은 지형."',
 choices:[
  {label:'"어떻게 알아요?"', out:[{p:1, text:'"내가 매복한다면 고를 자리니까."\n\n간단하고 서늘한 논리였다. 강우의 수업이 이어졌다. 커브 안쪽을 조심할 것, 다리 앞에서 속도 줄이지 말 것, 시야가 좋은 곳이 저격에도 좋다는 것.\n\n"외우지 마라. 몸에 붙여라." 지도가 한 겹 무서워졌고, 한 겹 안전해졌다.', fx:{mood:{kangwoo:3}, note:{type:'사건',title:'매복의 지리학',body:'"내가 매복한다면 고를 자리니까." 지도가 무서워진 만큼 안전해졌다.',links:['강우']}}}]},
  {label:'"무섭게 왜 그래요"', out:[{p:1, text:'"무서운 게 안전한 거다."\n\n강우는 연필을 돌려주고 자리로 돌아갔다. 지도의 점 세 개는 지우지 않기로 했다.', fx:{mood:{kangwoo:1}}}]},
 ]},
{id:'talk_kw_05', type:'대화', w:4, once:true, needsComp:'kangwoo',
 title:'강우 — 요리 반전',
 text:'강우가 저녁 당번인 날. 다들 짬밥 수준을 예상했는데—\n\n칼질 소리가 심상치 않다. 타타타타탁. 전문가의 리듬이다.',
 choices:[
  {label:'"어디서 배웠어요?"', out:[{p:1, text:'"취사병 출신." 강우가 아무렇지 않게 말했다. "이등병 때. 파 오백 단 썰면 이렇게 된다."\n\n그날 국은 역대급이었다. 파수꾼이 아니라 주방장을 영입했던 건지도 모른다.\n\n"전투보다 취사가 부대 사기에 기여한다. 통계다." 진지한 얼굴로 만든 국이 진지하게 맛있었다.', fx:{mood:{kangwoo:4}, moodAll:2, note:{type:'인물',title:'취사병 강우',body:'파 오백 단의 칼질. "전투보다 취사가 사기에 기여한다. 통계다."',links:['강우']}}}]},
  {label:'말없이 보조를 선다', out:[{p:1, text:'"양파." "네." "물." "네."\n\n둘이서 군대식 주방이 돌아갔다. 완성된 국을 맛본 강우가 짧게 말했다. "…합격."\n\n내 그릇에 건더기가 조금 더 들어왔다.', fx:{mood:{kangwoo:3}, moodAll:1}}]},
 ]},
{id:'talk_kw_06', type:'대화', w:4, once:true, needsComp:'kangwoo', needBond:['kangwoo',5],
 title:'강우 — 웃는 법',
 text:'별것 아닌 농담에 웃음이 터졌는데 강우만 무표정이었다. 나중에 조용히 물었다. "재미없었어요?"\n\n"재미있었다."\n\n"…근데 왜 안 웃어요?"',
 choices:[
  {label:'진지하게 묻는다', out:[{p:1, text:'강우가 얼마간 있다 답했다.\n\n"웃는 걸 오래 안 하면, 잊는다. 얼굴이." 강우는 자기 뺨을 손가락으로 가리켰다. "근육 문제다. 마음 문제가 아니라."\n\n"그럼 연습하면 되겠네요." "…그런가." 그날부터 강우는 하루 한 번 입꼬리를 올리는 연습을 한다. 본인은 스트레칭이라 부른다.', fx:{mood:{kangwoo:5}, note:{type:'인물',title:'얼굴 스트레칭',body:'웃음은 마음이 아니라 근육 문제(라고 주장). 하루 한 번 연습 개시.',links:['강우']}}}]},
  {label:'"속으론 웃었죠?"', out:[{p:1, text:'"크게."\n\n무표정으로 크게 웃었다고 말하는 사람 앞에서, 나는 진짜로 크게 웃었다. 강우 몫까지.', fx:{mood:{kangwoo:3}, moodAll:1}}]},
 ]},
{id:'talk_kw_07', type:'대화', w:4, once:true, needsComp:'kangwoo', needBond:['kangwoo',5],
 title:'강우 — 개인 정비',
 text:'강우가 군번줄을 닦고 있다. 두 개를, 하나씩, 정성껏.\n\n눈이 마주쳤다. 보통이라면 여기서 대화가 끝나는데— 오늘은 강우가 자리를 좁혀 앉았다.',
 choices:[
  {label:'옆에 앉는다', out:[{p:1, text:'"매주 닦는다. 녹슬면… 이름이 안 보이게 되니까."\n\n내 수첩도 꺼냈다. 강우는 묻지 않고 헝겊의 깨끗한 쪽을 찢어 건넸다. 군번줄과 할아버지 수첩의 쇠 모서리를 나란히 닦았다.\n\n"…좋은 습관이다." 그날 대화는 그걸로 끝이었다.', fx:{mood:{kangwoo:5}, note:{type:'사건',title:'유품 정비의 밤',body:'군번줄과 정비 수첩을 나란히 닦았다. 말 대신 깨끗한 헝겊을 나눴다.',links:['강우','할아버지']}}}]},
 ]},
{id:'talk_kw_08', type:'대화', w:4, once:true, needsComp:'kangwoo', needBond:['kangwoo',12],
 title:'강우 — 후임',
 text:'"물어봐도 되는지 모르겠는데…" 내가 운을 떼자 강우가 먼저 말했다.\n\n"두 번째 군번줄. …그거지."',
 choices:[
  {label:'끄덕인다', out:[{p:1, text:'"박일병. 스물둘. 겁이 많았다. 겁이 많아서 제일 꼼꼼했다."\n\n강우는 창밖을 보며 말을 이었다. "제3방어선에서 내가 반대쪽을 맡으라 했다. 판단은 정확했다. 결과가 틀렸을 뿐."\n\n"판단이 맞았는데 결과가 틀리면, 누구 잘못입니까."\n\n내가 입을 열기 전에 강우가 군번줄을 쥐었다. "됐어. 서울 가서 걔 부모님께 돌려드리고, 그때 다시 묻지."', fx:{mood:{kangwoo:6}, note:{type:'인물',title:'박일병',body:'겁이 많아 제일 꼼꼼했던 스물둘. 강우는 두 번째 군번줄과 오래된 질문을 서울로 가져간다.',links:['강우','남산']}}}]},
 ]},
{id:'talk_kw_09', type:'대화', w:4, once:true, needsComp:'kangwoo', needBond:['kangwoo',12],
 title:'강우 — 무서운 것',
 text:'"강우 씨도 무서운 게 있어요?"\n\n어렵게 꺼낸 질문에, 강우는 의외로 바로 답했다.\n\n"있다."',
 choices:[
  {label:'"뭔데요?"', out:[{p:1, text:'"익숙해지는 거."\n\n강우가 드물게 긴 문장을 시작했다. "총성에 익숙해지고, 폐허에 익숙해지고, 사람 잃는 것에 익숙해지고. 나중엔 아무렇지도 않아져."\n\n뒷자리에서 누가 냄비 뚜껑을 떨어뜨렸다. 강우가 그쪽을 보고 입꼬리를 아주 조금 올렸다. "저런 건 아직 좋군."', fx:{mood:{kangwoo:5}, note:{type:'인물',title:'익숙함이라는 공포',body:'강우가 가장 무서워하는 것은 사람을 잃는 데 익숙해지는 것. 달구지의 소란은 아직 반갑다.',links:['강우']}}}]},
 ]},
{id:'talk_kw_10', type:'대화', w:4, once:true, needsComp:'kangwoo', needBond:['kangwoo',20],
 title:'강우 — 뒷자리',
 text:'"오늘은 내가 운전하지." 강우가 키를 달라고 손을 내밀었다.\n\n"넌 뒷자리에서 자라. 명령이다."',
 choices:[
  {label:'"명령이면 할 수 없죠"', out:[{p:1, text:'뒷자리에 누웠다. 강우의 운전은 소문대로 정확했고, 이상하게 편안했다.\n\n잠들기 직전에 강우가 앞에서 나직이 말하는 걸 들었다. 혼잣말인지, 들으라는 말인지.\n\n"…경계는 내가 선다. 너는 자라. 그러라고 둘인 거다."\n\n그러라고 둘인 거다. 그 말을 이불처럼 덮고 잤다. 오랜만에 제일 깊은 낮잠이었다.', fx:{mood:{kangwoo:6}, fatigue:-15, note:{type:'사건',title:'그러라고 둘인 거다',body:'강우가 운전대를 잡고 한 말. 오랜만에 제일 깊은 낮잠의 이불.',links:['강우']}}}]},
 ]},

/* ═══════════ v2.4 1:1 대화 — 레오 ═══════════ */
{id:'talk_leo_01', type:'대화', w:4, once:true, needsComp:'leo',
 title:'레오 — 코드 하나',
 text:'"기타 배워볼래요?" 레오가 기타를 불쑥 내밀었다. "코드 하나면 노래 백 곡은 돼요."',
 choices:[
  {label:'배운다', out:[{p:1, text:'레오가 내 손가락을 지판에 하나씩 얹어줬다. "이게 A마이너. 세상에서 제일 쓸쓸하고 제일 만만한 코드."\n\n띵— 소리가 나자 레오가 박수를 쳤다. "축하해요, 이제 뮤지션이에요. 뮤지션의 정의는 소리를 낸 사람이거든요."\n\n기준이 후한 세계에 입문했다.', fx:{mood:{leo:4}, moodAll:1, flag:'leo_chord1', note:{type:'사건',title:'A마이너 입문',body:'제일 쓸쓸하고 제일 만만한 코드. 뮤지션의 정의=소리를 낸 사람.',links:['레오']}}}]},
  {label:'"난 듣는 담당 할게"', out:[{p:1, text:'"오, 그거 중요한 포지션인데." 레오가 진지해졌다. "듣는 사람 없으면 노래는 그냥 소음이에요. 여러분이 저를 뮤지션으로 만들어주는 거예요."\n\n청중 1호 자리는 생각보다 명예로운 자리였다.', fx:{mood:{leo:3}}}]},
 ]},
{id:'talk_leo_02', type:'대화', w:4, once:true, needsComp:'leo',
 title:'레오 — 별명 공장',
 text:'"대장님은 별명이 뭐였어요?" 레오가 물었다. 대답도 하기 전에 눈이 반짝인다.\n\n"아니다, 제가 지어줄게요. 저 별명 잘 지어요."',
 choices:[
  {label:'맡겨본다', out:[{p:1, text:'레오는 3분간 나를 뚫어져라 관찰하더니 선언했다.\n\n"…\'키잡이\'. 방향 잡는 사람. 달구지의 키를 잡고 있고, 우리 방향도 잡고 있으니까."\n\n생각보다 진지한 별명이 나와서 당황했다. "가끔은 유치한 걸 기대하면 안 돼요. 별명은 그 사람 직업이 아니라 역할이거든요." 별명 장인의 철학이었다.', fx:{mood:{leo:4}, note:{type:'사건',title:'키잡이',body:'레오가 지어준 별명. 별명은 직업이 아니라 역할.',links:['레오']}}}]},
  {label:'"보리 별명이나 지어줘"', out:[{p:1, text:'"보리는 별명이 열두 개예요. 요일별로 달라요. 월요일엔 털뭉치, 화요일엔 코감독…"\n\n진짜로 열두 개를 다 외웠다. 이 사람의 사랑은 목록형이다.', fx:{mood:{leo:3}, moodAll:1}}]},
 ]},
{id:'talk_leo_03', type:'대화', w:4, once:true, needsComp:'leo',
 title:'레오 — 하모니카',
 text:'레오의 기타 케이스 주머니에서 낡은 하모니카가 나왔다. 처음 보는 물건이다.\n\n"아, 그거… 아빠 거예요."',
 choices:[
  {label:'"불 줄 알아요?"', out:[{p:1, text:'"조금요." 레오가 하모니카를 오래 닦고 입에 댔다.\n\n트로트도 발라드도 아닌, 오래된 노래가 나왔다. 두 소절만.\n\n"아빠가 이것만 불었어요. 술 마시면. …잘 부는 노래가 하나면 충분하대요, 사람은." 레오는 하모니카를 도로 주머니에 넣었다. "저는 아직 제 한 곡을 찾는 중이고요."\n\n400km가 그 한 곡이 되려나. 묻지는 않았다.', fx:{mood:{leo:4}, note:{type:'인물',title:'아빠의 하모니카',body:'잘 부는 노래가 하나면 충분하다. 레오는 아직 자기 한 곡을 찾는 중.',links:['레오']}}}]},
  {label:'조심히 다뤄준다', out:[{p:1, text:'하모니카를 두 손으로 받아 살펴보고 돌려줬다. 레오가 씩 웃었다.\n\n"물건 소중히 다루는 사람, 노래도 소중히 들어요. 통계예요." 근거는 없고 확신은 넘치는, 레오다운 통계였다.', fx:{mood:{leo:3}}}]},
 ]},
{id:'talk_leo_04', type:'대화', w:4, once:true, needsComp:'leo',
 title:'레오 — 신청곡',
 text:'"신청곡 받아요." 레오가 기타를 고쳐 안았다. "뭐든. 모르는 노래면 즉석에서 만들어드려요."',
 choices:[
  {label:'옛날 노래를 신청한다', out:[{p:1, text:'제목을 말하자 레오가 첫 소절을 더듬더듬 찾아냈다. 가사가 틀리고 코드가 미끄러졌지만—\n\n다 부를 때쯤엔 나도 같이 부르고 있었다. 노래는 정확한 것보다 같이 부르는 게 이기는 거라고, 레오가 말했다.', fx:{mood:{leo:3}, moodAll:2}}]},
  {label:'"오늘 기분을 노래로"', out:[{p:1, text:'"어려운 주문이네요. 좋아요."\n\n레오가 창밖을 한 번 보고, 나를 한 번 보고, 즉흥곡을 시작했다. 가사에 오늘 아침 배급 메뉴와 어제 고개의 커브와 내 하품이 들어갔다.\n\n엉망이고 완벽했다. "제목은 \'오늘\'이에요. 내일 부르면 못 알아들을 노래." 일회용 노래는 사치스러웠다.', fx:{mood:{leo:4}, moodAll:2, note:{type:'사건',title:'일회용 노래 「오늘」',body:'내일 부르면 못 알아들을 즉흥곡. 사치스러운 일회용.',links:['레오']}}}]},
 ]},
{id:'talk_leo_05', type:'대화', w:4, once:true, needsComp:'leo',
 title:'레오 — 보리와의 계약',
 text:'"보리랑 저랑 어떻게 만났는지 얘기했던가요?"\n\n레오가 보리(자고 있다)를 보며 물었다.',
 choices:[
  {label:'"안 했어요. 해줘요"', out:[{p:1, text:'"공연하는데 앞에 와서 앉더라고요. 끝까지 듣고, 끝나니까 가만히 보는 거예요. 그래서 말했죠. \'너 매니저 할래?\'"\n\n"조건은 저녁 반 그릇. 보리가 앞발을 내밀었어요. 계약 성립." 레오가 웃었다. "저 친구는 제 첫 정규 계약이에요. 아직까지 위약 없고요."\n\n자던 보리 꼬리가 잠결에 흔들렸다. 계약 이행 중이라는 뜻으로 접수됐다.', fx:{mood:{leo:4}, note:{type:'인물',title:'정규 계약 1호',body:'조건: 저녁 반 그릇. 앞발 날인. 오랫동안 무위약.',links:['레오','보리']}}}]},
 ]},
{id:'talk_leo_06', type:'대화', w:4, once:true, needsComp:'leo', needBond:['leo',5],
 title:'레오 — 밝음의 정체',
 text:'"레오는 무서운 거 없어요?" 지나가듯 물었는데, 레오의 기타 소리가 잠깐 멎었다.\n\n"…있죠. 많죠."',
 choices:[
  {label:'"근데 왜 맨날 웃어요?"', out:[{p:1, text:'"무서우니까 웃죠." 레오가 다시 기타를 퉁겼다.\n\n"무대에서 배웠어요. 관객이 불안하면 노래가 안 들려요. 그래서 무대 위 사람은 먼저 안 무서운 척을 해요. 그러다 보면 가끔… 진짜로 안 무서워지고요."\n\n"이 차가 제 무대예요. 여러분이 관객이고. 그러니까 저는 계속 웃을 거예요. 직업 정신이에요." 밝음이 직업 정신이라는 사람의 노래는, 그날따라 더 잘 들렸다.', fx:{mood:{leo:5}, note:{type:'인물',title:'직업 정신',body:'무서우니까 웃는다. 무대 위 사람은 먼저 안 무서운 척을 한다 — 그러다 진짜 안 무서워질 때까지.',links:['레오']}}}]},
 ]},
{id:'talk_leo_07', type:'대화', w:4, once:true, needsComp:'leo', needBond:['leo',5],
 title:'레오 — 가사 회의',
 text:'"400km 2절이 막혔어요." 레오가 수첩을 내밀었다. 가사가 절반쯤 쓰이다 멎어 있다.\n\n"대장님이라면 여기 뒤에 뭐라고 쓸 거예요?"',
 choices:[
  {label:'진지하게 한 줄 보탠다', out:[{p:1, text:'한참 고민해서 한 줄을 냈다. 레오가 소리 내어 불러보더니 눈이 커졌다.\n\n"…이거 되는데요? 이거 써도 돼요?" "얼마든지." "그럼 대장님도 이제 공동 작사가예요. 저작권료는 고철로 정산할게요."\n\n내 한 줄이 노래에 박혔다. 세상 어딘가에서 이 노래가 불릴 때마다, 그 한 줄은 내 것이다.', fx:{mood:{leo:5}, note:{type:'사건',title:'공동 작사가',body:'400km 2절에 내 한 줄이 박혔다. 저작권료는 고철 정산 예정.',links:['레오']}}}]},
  {label:'"막힐 땐 쉬어야죠"', out:[{p:1, text:'"오— 그것도 프로의 답이네요." 레오가 수첩을 덮었다.\n\n"쉬는 것도 작사의 일부래요. 아빠가 그랬어요. 잘 쉬는 사람이 잘 만든다고." 우리는 그날 성실하게 쉬었다.', fx:{mood:{leo:2}, moodAll:1}}]},
 ]},
{id:'talk_leo_08', type:'대화', w:4, once:true, needsComp:'leo', needBond:['leo',12],
 title:'레오 — 아빠',
 text:'하모니카가 다시 나왔다. 이번엔 레오가 먼저 이야기를 꺼냈다.\n\n"아빠는 트럭 기사였어요. 전국을 돌았죠. 지금 우리처럼."',
 choices:[
  {label:'듣는다', out:[{p:1, text:'"어릴 땐 그게 싫었어요. 맨날 없으니까. 근데 오면 꼭 어디 노래를 배워왔어요. 목포 노래, 강릉 노래. \'노래가 기념품이야\' 그러면서."\n\n"그날, 아빠는 길 위에 있었어요. 어디였는지 몰라요. 그래서 저는…" 레오가 기타 줄을 골랐다. "전국을 돌면서 노래를 모아요. 어딘가에서 아빠가 배운 노래랑 마주칠 것 같아서. 노래는 기념품이니까, 어디선가 남아 있을 거니까."\n\n레오의 지도는 노래로 그려져 있었다.', fx:{mood:{leo:6}, note:{type:'인물',title:'노래가 기념품이야',body:'트럭 기사 아빠의 수집법. 레오는 아빠가 배운 노래와 마주치려고 전국의 노래를 모은다.',links:['레오']}}}]},
 ]},
{id:'talk_leo_09', type:'대화', w:4, once:true, needsComp:'leo', needBond:['leo',12],
 title:'레오 — 무대 공포',
 text:'"고백할 게 있는데요." 레오가 목소리를 낮췄다. "저 사실… 무대 공포증 있어요."\n\n매일 노래하는 사람의 입에서 나온 말이라 잠깐 농담인 줄 알았다.',
 choices:[
  {label:'"근데 어떻게 매일 해요?"', out:[{p:1, text:'"청중을 한 명으로 줄여요." 레오가 손가락 하나를 폈다.\n\n"백 명 앞이어도, 한 명한테만 부른다고 생각해요. 오늘은 그 한 명이 대장님이었고요. 어제는 보리였고."\n\n"…잠깐, 나 오늘 청중 1호였어요?" "네. 티 났어요?" 안 났다. 그게 프로였다.', fx:{mood:{leo:5}, note:{type:'인물',title:'한 명에게 부르는 법',body:'무대 공포의 해법: 청중을 한 명으로 줄인다. 오늘의 한 명은 나였다.',links:['레오']}}}]},
 ]},
{id:'talk_leo_10', type:'대화', w:4, once:true, needsComp:'leo', needBond:['leo',20],
 title:'레오 — 3절',
 text:'"결정했어요." 레오가 수첩을 탁 덮으며 선언했다.\n\n"400km 3절은 서울 도착해서 쓸 거예요. 근데 조건이 있어요."',
 choices:[
  {label:'"무슨 조건요?"', out:[{p:1, text:'"3절 첫 줄은 대장님이 써요."\n\n"…내가? 왜?"\n\n"제일 앞에서 운전한 사람이 제일 먼저 본 걸 쓰는 게 맞으니까요. 저는 조수석 뷰였잖아요." 레오가 새끼손가락을 내밀었다. "도착하면. 첫 줄. 약속."\n\n걸었다. 서울에 가야 할 이유가 또 하나 늘었다. 이번 건 마감이 있는 이유다.', fx:{mood:{leo:6}, note:{type:'사건',title:'3절 첫 줄 계약',body:'서울 도착 시 3절 첫 줄 집필 의무 발생(새끼손가락 날인). 마감 있는 동행 사유.',links:['레오','남산']}}}]},
 ]},

/* ═══════════ v2.4 1:1 대화 — 재이 ═══════════ */
{id:'talk_jy_01', type:'대화', w:4, once:true, needsComp:'jaeyi',
 title:'재이 — 감정 수업',
 text:'"이거 얼마짜리게요?" 재이가 길에서 주운 녹슨 문고리를 내밀었다.\n\n시험이다.',
 choices:[
  {label:'진지하게 감정해본다', out:[{p:1, text:'"음… 고철 반 덩이?"\n\n"땡. 두 덩이." 재이가 문고리를 돌려 보였다. "황동이에요. 녹 밑을 봐야죠. 물건은 다 녹 밑에 본색이 있어요."\n\n"사람도요?" "사람도요." 감정 수업 1교시가 인생 수업으로 끝났다.', fx:{mood:{jaeyi:4}, note:{type:'사건',title:'녹 밑의 본색',body:'감정 1교시: 녹 밑을 볼 것. 물건도 사람도.',links:['재이']}}}]},
  {label:'"모르겠는데"', out:[{p:1, text:'"모른다고 하는 게 제일 좋은 답이에요. 아는 척이 제일 비싸게 먹히거든요."\n\n재이가 문고리를 주머니에 넣었다. "고물상에서 아는 척하다 망한 사람 목록, 들려드려요?" 목록은 길었고 교훈은 하나였다.', fx:{mood:{jaeyi:3}}}]},
 ]},
{id:'talk_jy_02', type:'대화', w:4, once:true, needsComp:'jaeyi',
 title:'재이 — 첫 수집품',
 text:'"제 첫 수집품이 뭐게요?" 재이가 퀴즈를 냈다. 힌트: 지금도 갖고 있음.',
 choices:[
  {label:'"열쇠?"', out:[{p:1, text:'"땡. 열쇠는 수집품이 아니에요." 재이의 목소리가 살짝 낮아졌다가 돌아왔다.\n\n"정답은 병뚜껑. 여섯 살 때 아빠 창고에서 주운 사이다 뚜껑." 재이가 지갑 안쪽에서 정말로 그걸 꺼냈다. 납작하게 눌린 별 모양.\n\n"아빠가 그랬어요. 줍는 순간 쓰레기가 물건이 된다고. 제 인생 이론이에요."', fx:{mood:{jaeyi:4}, note:{type:'인물',title:'사이다 뚜껑',body:'여섯 살의 첫 수집품. 줍는 순간 쓰레기가 물건이 된다.',links:['재이']}}}]},
  {label:'"병뚜껑 같은 거?"', out:[{p:1, text:'"…어떻게 알았어요?" 재이의 동공이 흔들렸다.\n\n"찍었는데." "소름. 대장님 고물상 하세요. 촉이 반이에요, 이 바닥."\n\n스카우트 제안을 받았다. 이 차에서 받은 세 번째 취업 제안이다.', fx:{mood:{jaeyi:4}, moodAll:1}}]},
 ]},
{id:'talk_jy_03', type:'대화', w:4, once:true, needsComp:'jaeyi',
 title:'재이 — 흥정의 기술',
 text:'"다음 정착지에서 제가 흥정하는 거 잘 봐요." 재이가 어깨를 폈다. "오늘 기술 하나 공개할 거니까."',
 choices:[
  {label:'"미리 가르쳐줘요"', out:[{p:1, text:'"첫째, 갖고 싶은 건 세 번째로 물어봐요. 첫 번째로 물으면 값이 두 배 돼요."\n\n"둘째, 걸어 나갈 준비가 된 사람이 이겨요. 근데 셋째가 제일 중요한데—" 재이가 씩 웃었다. "정말 좋은 물건이면 흥정하지 마요. 부르는 값 주고 사요. 그 주인이랑은 오래 봐야 하니까."\n\n흥정의 기술 최종장이 흥정 포기라는 게 이 바닥의 깊이다.', fx:{mood:{jaeyi:4}, note:{type:'사건',title:'흥정 3원칙',body:'셋째가 백미: 정말 좋은 물건이면 흥정하지 말 것. 주인과 오래 봐야 하니까.',links:['재이']}}}]},
 ]},
{id:'talk_jy_04', type:'대화', w:4, once:true, needsComp:'jaeyi',
 title:'재이 — 버리는 법',
 text:'재이의 전리품 자루가 터지기 직전이다. 짐칸 정리 얘기가 나온 지 사흘째다.\n\n"버리는 게 제일 어려워요, 이 직업은."',
 choices:[
  {label:'"기준이 있어요?"', out:[{p:1, text:'"이야기가 없는 건 버려요." 재이가 자루를 열었다.\n\n"이 볼트는 그냥 볼트. 버림. 이 숟가락은 그 국숫집 할머니가 준 거. 못 버림." 분류가 순식간에 끝났다. 자루가 반으로 줄었다.\n\n"물건 값은 시세보다 이야기가 정해요. 저는 고물상보다 이야기 상인에 가까울지도 몰라요."\n\n재이는 버린 볼트를 다시 집었다. "이건 방금 예시로 썼으니까 보류."', fx:{mood:{jaeyi:4}, scrap:2, note:{type:'인물',title:'이야기 상인',body:'버리는 기준은 그 물건과 나눌 이야기가 남았는지다.',links:['재이']}}}]},
  {label:'"셋 셀 동안 반 줄이기"', out:[{p:1, text:'"셋이요?! 너무해—" 하면서도 재이는 진짜로 반을 줄였다. 프로는 마감에 강하다.\n\n버린 것 중 두 개를 몰래 다시 줍는 것까지가 프로다.', fx:{mood:{jaeyi:2}, scrap:2}}]},
 ]},
{id:'talk_jy_05', type:'대화', w:4, once:true, needsComp:'jaeyi',
 title:'재이 — 선물 고르기',
 text:'"만약에요," 재이가 물었다. "누구한테 선물을 해야 하면, 뭘 고를 거예요?"\n\n질문이 묘하게 구체적이다. 누구 주려고 그러나.',
 choices:[
  {label:'"받는 사람이 안 살 물건"', out:[{p:1, text:'"오…" 재이가 진심으로 감탄했다. "그거 우리 아빠 이론인데. \'선물은 자기한테 안 사줄 물건을 사주는 것\'."\n\n"대장님, 진짜 소질 있다니까요." 재이는 그날 내내 뭔가를 궁리했고, 나는 못 본 척했다. 궁리하는 옆모습이 선물 반쪽이니까.', fx:{mood:{jaeyi:4}}}]},
  {label:'"고철. 실용적이잖아"', out:[{p:1, text:'"낭만 빵점!" 재이가 야유를 보냈다. "근데… 받는 사람이 고철을 제일 기뻐할 사람이면 만점이네요. 감정은 상대평가니까."\n\n야유가 3초 만에 재평가로 바뀌는 것도 감정사의 기술이다.', fx:{mood:{jaeyi:2}, moodAll:1}}]},
 ]},
{id:'talk_jy_06', type:'대화', w:4, once:true, needsComp:'jaeyi', needBond:['jaeyi',5],
 title:'재이 — 도둑과 수집가',
 text:'"저 고물 주울 때, 도둑질 같아 보일까 봐 신경 써요." 재이가 문득 진지해졌다.\n\n"도둑이랑 수집가의 차이가 뭘까요."',
 choices:[
  {label:'"주인이 있냐 없냐?"', out:[{p:1, text:'"그것도 맞는데, 아빠 답은 달랐어요." 재이가 손가락을 세웠다.\n\n"\'도둑은 값을 보고 가져가고, 수집가는 버려진 걸 안타까워서 데려간다.\' 그래서 저는 물건한테 꼭 물어봐요. 너 버려진 거 맞냐고. …이상해 보여도 제 규칙이에요."\n\n말을 마친 재이는 길가의 녹슨 도시락통 앞에 쪼그려 앉았다. 손대기 전에 주위를 한 바퀴 살폈다.', fx:{mood:{jaeyi:5}, note:{type:'인물',title:'수집가의 윤리',body:'물건에게 먼저 묻는다 — 너 버려진 거 맞냐고. 재이는 손대기 전에 주위를 살핀다.',links:['재이']}}}]},
 ]},
{id:'talk_jy_07', type:'대화', w:4, once:true, needsComp:'jaeyi', needBond:['jaeyi',5],
 title:'재이 — 박물관',
 text:'"꿈이 뭐냐고 물어봐 줘요." 재이가 대놓고 요청했다.\n\n"…꿈이 뭐예요?"\n\n"물어봐 줘서 고마워요. 박물관이요."',
 choices:[
  {label:'"무슨 박물관?"', out:[{p:1, text:'"\'보통 물건 박물관\'. 국보 말고요. 밥숟가락, 버스 토큰, 다 쓴 몽당연필. 그런 것만 모으는 데."\n\n"사라지고 나니까 그런 게 제일 보고 싶더라고요." 재이가 전리품 자루를 두드렸다. "지금은 임시 수장고예요. 발로 차면 관람료 받아요."\n\n마침 굴러다니던 숟가락이 발에 걸렸다. 재이는 바로 손을 내밀었다.', fx:{mood:{jaeyi:5}, note:{type:'소문',title:'보통 물건 박물관',body:'밥숟가락과 버스 토큰을 모으는 박물관. 지금의 임시 수장고는 달구지 안 전리품 자루다.',links:['재이']}}}]},
 ]},
{id:'talk_jy_08', type:'대화', w:4, once:true, needsComp:'jaeyi', needBond:['jaeyi',12],
 title:'재이 — 열쇠',
 text:'재이가 목에 건 열쇠를 만지작거리다가, 처음으로 먼저 말을 꺼냈다.\n\n"창고 말인데요. 아빠 창고."',
 choices:[
  {label:'듣는다', out:[{p:1, text:'"아빠는 고물상이었는데, 창고 하나는 절대 안 팔았어요. \'이건 파는 게 아니라 모으는 창고\'라고. 어릴 땐 몰랐죠. 그날 이후에 알았어요."\n\n"창고엔… 제 것들이 있어요. 첫 신발, 그림, 상장. 아빠는 저를 수집하고 있던 거예요. 6살부터, 쭉."\n\n재이가 열쇠를 꼭 쥐었다. "김천 가면… 아니에요. 가게 되면 그때 말할게요." 창고의 좌표가 마음속에서 아직 정리 중인 모양이었다.', fx:{mood:{jaeyi:6}, note:{type:'인물',title:'아빠의 수집품',body:'창고에 수집된 것: 재이의 6살부터 전부. 아빠는 딸을 수집하는 수집가였다.',links:['재이']}}}]},
 ]},
{id:'talk_jy_09', type:'대화', w:4, once:true, needsComp:'jaeyi', needBond:['jaeyi',12],
 title:'재이 — 시세 없는 목록',
 text:'"값 없는 물건 목록, 업데이트했어요." 재이가 수첩을 펼쳤다. 정말로 목록이 있다.\n\n1번: 아빠 창고 열쇠. 2번: 사이다 뚜껑. 3번부터가 새로 적힌 것들이다.',
 choices:[
  {label:'"3번이 뭔데요?"', out:[{p:1, text:'"3번, 달구지 조수석 이용권(평생). 4번, 처음 받은 \'정품 인정\' 한마디. 5번, 비 온 날 창문에 남은 발자국…"\n\n목록은 아홉 개까지 늘어 있었다. 전부 이 차에서 생긴 것들이었다.\n\n"문제는 다 안 팔려요. 부자인데 현금이 없네." 재이가 목록을 접어 제일 안쪽 주머니에 넣었다.', fx:{mood:{jaeyi:6}, moodAll:2, note:{type:'사건',title:'시세 없는 목록 3~9번',body:'달구지에서 생긴 아홉 가지가 값 없는 물건 목록에 올랐다.',links:['재이','달구지']}}}]},
 ]},
{id:'talk_jy_10', type:'대화', w:4, once:true, needsComp:'jaeyi', needBond:['jaeyi',20],
 title:'재이 — 감정 의뢰',
 text:'"감정 의뢰 하나 받아주실래요?" 재이가 정색하고 말했다.\n\n"제 눈이요. 이 여행이요. …잘 산 물건인지."',
 choices:[
  {label:'정식으로 감정한다', out:[{p:1, text:'재이의 방식대로 감정해봤다. 녹 밑을 보고, 이야기를 세었다.\n\n"판정. 시세 없음. 사유: 이야기가 너무 많아서 값을 매길 수 없음."\n\n재이는 수첩에 적었다. 「10번. 이 여행. 감정인: 키잡이.」 그리고 내 손에 연필을 쥐여줬다.\n\n서명하자 재이가 수첩을 낚아챘다. "됐어요. 이제 반품 안 됩니다."', fx:{mood:{jaeyi:6}, moodAll:2, note:{type:'사건',title:'감정서 10번',body:'이 여행은 이야기가 너무 많아 시세 없음. 감정인 서명까지 끝났다.',links:['재이']}}}]},
 ]},

/* ═══════════ v2.4 1:1 대화 — 은수 ═══════════ */
{id:'talk_es_01', type:'대화', w:4, once:true, needsComp:'eunsu',
 title:'은수 — 헤드폰 반쪽',
 text:'은수가 헤드폰 한쪽을 내밀었다.\n\n"…들어볼래요? 지금 좋은 게 잡혀서."',
 choices:[
  {label:'받아서 낀다', out:[{p:1, text:'잡음 사이로 아주 먼 데서 음악이 흘렀다. 어느 나라 말인지도 모를 노래.\n\n"단파예요. 밤엔 전파가 멀리 와요. 지구 반대편일 수도 있어요."\n\n지구 반대편에도 누가 살아서 노래를 튼다. 그 사실을 한쪽 귀로 나눠 들었다. "이래서 제가 밤을 좋아해요." 은수가 말했다.', fx:{mood:{eunsu:4}, note:{type:'사건',title:'한쪽 귀의 지구 반대편',body:'밤 단파로 들은 모르는 나라의 노래. 헤드폰 반쪽의 동맹.',links:['은수']}}}]},
  {label:'"좋은 거면 혼자 들어요"', out:[{p:1, text:'"…좋은 건 나누면 두 배인데." 은수가 아쉬워하며 헤드폰을 도로 꼈다.\n\n대신 내용을 실황 중계해줬다. 중계도 나쁘지 않았지만, 다음엔 그냥 받기로 했다.', fx:{mood:{eunsu:1}}}]},
 ]},
{id:'talk_es_02', type:'대화', w:4, once:true, needsComp:'eunsu',
 title:'은수 — 콜사인',
 text:'"관제할 때는 서로 콜사인으로 불렀어요." 은수가 말했다. "이름보다 정확하니까."\n\n"…우리도 하나씩 정할래요?"',
 choices:[
  {label:'"내 콜사인 정해줘요"', out:[{p:1, text:'은수가 3초 고민했다.\n\n"\'델타 원\'. 달구지의 D, 그리고 선두라서 원."\n\n"본인은요?" "…\'노스 스타\'. 북쪽 별. 방향 잡는 데 쓰라고요. 여행용이에요. 원래 쓰던 건— 따로 있는데, 그건 아직요." 관제사다운 작명이었고, 관제사다운 유보였다.\n\n이후로 은수는 가끔 무전 톤으로 말을 건다. "델타 원, 전방에 커브. 감속 권고." 놀이인데, 이상하게 든든한 놀이다.', fx:{mood:{eunsu:4}, note:{type:'사건',title:'델타 원 · 노스 스타',body:'콜사인 교환. 이름보다 정확한 부름. 무전 놀이 개시.',links:['은수']}}}]},
 ]},
{id:'talk_es_03', type:'대화', w:4, once:true, needsComp:'eunsu',
 title:'은수 — 침묵 분류학',
 text:'"침묵에도 종류가 있다고 했잖아요." 은수가 말을 이었다. "관제사는 그걸 구분하는 직업이에요. 무전이 조용한 이유가 평온인지 사고인지."',
 choices:[
  {label:'"지금 이 차의 침묵은요?"', out:[{p:1, text:'은수가 차 안을 한 바퀴 둘러봤다. 각자 제 할 일을 하는 오후였다.\n\n"…이건 \'교신할 필요가 없는 침묵\'이에요. 제일 좋은 등급." 은수가 헤드폰을 목에 걸었다. "관제실에선 한 번도 못 들어본 침묵이고요."\n\n제일 좋은 등급의 침묵 속을, 우리는 시속 44km로 달렸다.', fx:{mood:{eunsu:4}, note:{type:'인물',title:'침묵 분류학',body:'최상급 침묵 = 교신할 필요가 없는 침묵. 관제실엔 없던 등급.',links:['은수']}}}]},
 ]},
{id:'talk_es_04', type:'대화', w:4, once:true, needsComp:'eunsu',
 title:'은수 — 관제 용어',
 text:'"오늘의 관제 용어." 은수가 수업을 열었다. 은수식 스몰토크다.\n\n"\'로저\'는 알아들었다. \'윌코\'는 알아들었고 그대로 하겠다. 차이가 뭘까요?"',
 choices:[
  {label:'"실행 여부?"', out:[{p:1, text:'"정확해요. 로저는 듣기만 한 거고, 윌코는 하겠다는 약속이에요."\n\n은수가 드물게 장난스러운 표정을 지었다. "사람들 대답도 다 로저 아니면 윌코예요. \'알았어\'가 로저인 사람이 있고 윌코인 사람이 있죠."\n\n"이 차 사람들은요?" "…전원 윌코." 최고 등급 평가였다.', fx:{mood:{eunsu:4}, moodAll:1, note:{type:'사건',title:'전원 윌코',body:'로저=들었다, 윌코=하겠다. 이 차의 대답은 전부 윌코 등급.',links:['은수']}}}]},
 ]},
{id:'talk_es_05', type:'대화', w:4, once:true, needsComp:'eunsu',
 title:'은수 — 별명의 유래',
 text:'"은수 씨는 어쩌다 관제사가 됐어요?"\n\n"…별을 좋아해서요." 예상 밖의 답이 왔다.',
 choices:[
  {label:'"별이랑 관제가 무슨 상관?"', out:[{p:1, text:'"천문학과 가고 싶었는데 성적이… 그래서 하늘 보는 직업 중에 되는 걸 골랐어요." 은수가 웃었다. "레이더 화면도 밤하늘 비슷해요. 점들이 떠 있고, 저는 그 점들이 무사히 지나가게 지키고."\n\n"지금은 진짜 별 실컷 보네요."\n\n"네. 지붕도 없고, 야간수당도 없지만요." 은수가 목을 젖혀 북두칠성을 찾았다.', fx:{mood:{eunsu:4}, note:{type:'인물',title:'별 대신 레이더',body:'천문학과 대신 관제탑을 택했던 은수. 이제는 달구지 지붕 위에서 진짜 별을 본다.',links:['은수']}}}]},
 ]},
{id:'talk_es_06', type:'대화', w:4, once:true, needsComp:'eunsu', needBond:['eunsu',5],
 title:'은수 — 죄책감의 방향',
 text:'"가끔 궁금해요." 은수가 조심스럽게 말했다. "내가 관제실에 있었으면서 아무것도 몰랐다는 게… 잘못일까요."',
 choices:[
  {label:'"모르게 만든 쪽 잘못이죠"', out:[{p:1, text:'"…그렇게 말해주는 사람은 처음이에요." 은수가 헤드폰을 만지작거렸다.\n\n"다들 관제실에 있었다고 하면 일단 한 발 물러서거든요. 뭔가 알았을 거라고." 은수가 창밖을 봤다. "몰랐어요. 그게 제일 무서운 거예요. 아는 사람이 정말 없었다는 게."\n\n"남산 가면 물어볼 거예요. 너는 우리한테 왜 안 알려줬냐고. …반말로요." 반말이라는 데서 웃어버렸고, 은수도 웃었다.', fx:{mood:{eunsu:5}, note:{type:'인물',title:'반말로 물을 것',body:'"너는 우리한테 왜 안 알려줬냐" — 남산에서 천리안에게 할 질문(반말 예정).',links:['은수','천리안','남산']}}}]},
 ]},
{id:'talk_es_07', type:'대화', w:4, once:true, needsComp:'eunsu', needBond:['eunsu',5],
 title:'은수 — 노이즈 속 음악',
 text:'은수가 녹음기(어디서 구했는지)에 뭔가를 모으고 있다.\n\n"잡음이요. 좋은 잡음만."',
 choices:[
  {label:'"잡음에 좋은 게 있어요?"', out:[{p:1, text:'"있죠." 은수가 재생해줬다. 빗소리 섞인 잡음, 희미한 주파수의 웅웅거림, 아주 멀리서 뭉개진 음악.\n\n"관제실에선 잡음이 적이었어요. 신호를 가리니까. 근데 지금은… 잡음도 세상 소리더라고요. 비어 있지 않다는 증거."\n\n"언젠가 이걸로 뭘 만들 거예요. 세상에서 제일 시끄러운 침묵 같은 거." 음악 하는 사람이 들으면 당장 달려들 만한 소리였다.', fx:{mood:{eunsu:4}, note:{type:'인물',title:'좋은 잡음 수집가',body:'잡음=비어 있지 않다는 증거. 계획: 세상에서 제일 시끄러운 침묵.',links:['은수']}}}]},
 ]},
{id:'talk_es_08', type:'대화', w:4, once:true, needsComp:'eunsu', needBond:['eunsu',12],
 title:'은수 — 마지막 교신',
 text:'"그날 마지막으로 관제한 비행기, 기억해요." 은수가 묻지 않은 이야기를 시작했다. 이 사람에겐 드문 일이다.',
 choices:[
  {label:'듣는다', out:[{p:1, text:'"제주발 김포행. 착륙 10분 전에 시스템이 넘어갔어요. 마지막으로 제가 한 말이 \'유지하세요, 곧 다시 연결됩니다\'였어요."\n\n"…연결됐어요?"\n\n"몰라요. 아직도." 은수가 헤드폰을 꼭 쥐었다. "그래서 매일 밤 스캔해요. 그 기장 목소리를 아니까. 무전 한 번만 잡히면…"\n\n그 뒤로 은수가 야간 스캔을 시작하면, 아무도 채널을 먼저 돌리지 않았다.', fx:{mood:{eunsu:6}, note:{type:'인물',title:'유지하세요, 곧 다시 연결됩니다',body:'마지막 관제의 마지막 문장. 은수는 지금도 매일 밤 그 비행기의 신호를 찾는다.',links:['은수']}}}]},
 ]},
{id:'talk_es_09', type:'대화', w:4, once:true, needsComp:'eunsu', needBond:['eunsu',12],
 title:'은수 — 신뢰의 형식',
 text:'"비밀 하나 말해도 돼요?" 은수가 물었다. "관제사는 비밀이 생기면 기록으로 남겨요. 직업병이에요. 근데 이건 기록 못 하겠어서."',
 choices:[
  {label:'"들을게요. 기록 안 할게요"', out:[{p:1, text:'"…사실 처음엔 이 차, 대전에서 내리려고 했어요. 세종까지만 얻어 타려고."\n\n"근데 못 내렸어요. 여기가— 관제탑 같아서요. 서로 위치 알려주고, 서로 착륙시켜주고." 은수가 헤드폰을 벗었다. 은수가 두 귀를 다 여는 건 처음 봤다.\n\n"그러니까 이 비밀의 요지는… 안 내려서 다행이라는 거예요. 이상, 교신 끝."\n\n"로저." "…윌코겠죠, 그건." 웃음으로 교신이 끝났다.', fx:{mood:{eunsu:6}, note:{type:'사건',title:'교신 끝',body:'대전에서 내리려 했던 비밀. 이 차=서로 착륙시켜주는 관제탑. 두 귀를 다 연 날.',links:['은수']}}}]},
 ]},
{id:'talk_es_10', type:'대화', w:4, once:true, needsComp:'eunsu', needBond:['eunsu',20],
 title:'은수 — 남산 이후',
 text:'"남산 끝나면요." 은수가 지도의 서울 위쪽, 빈 데를 짚었다.\n\n"저는 더 올라가 볼까 해요."',
 choices:[
  {label:'"휴전선 너머요?"', out:[{p:1, text:'"북쪽에도 관제탑이 있어요. 거기도 누가 있었을 거고, 거기도 하늘이 있잖아요."\n\n은수가 헤드폰을 고쳐 썼다. "천리안한테 물어보고, 대답을 듣고, 그 다음엔— 아무도 관제 안 하는 하늘을 보러 갈 거예요. 별만 있는 하늘."\n\n"혼자요?"\n\n"…글쎄요." 은수가 나를 봤다. "동행 신청은 선착순이에요." 3막의 예고편 같은 말을, 나는 접수해뒀다.', fx:{mood:{eunsu:6}, note:{type:'소문',title:'별만 있는 하늘',body:'남산 이후의 계획: 더 북쪽, 아무도 관제 안 하는 하늘. 동행 신청 선착순.',links:['은수','남산']}}}]},
 ]},

/* ═══════════ v2.4 1:1 — 보리 ═══════════ */
{id:'talk_bori_01', type:'대화', w:4, once:true, needsDog:true,
 title:'보리 — 산책 협상',
 text:'정차하자마자 보리가 문 앞에 앉았다. 리드줄(폐허에서 주운 것)을 물고.\n\n영업이다.',
 choices:[
  {label:'산책을 나간다', out:[{p:1, text:'15분 산책. 보리의 코가 가는 곳이 코스다. 풀 냄새 3분, 돌 냄새 2분, 정체불명 4분.\n\n돌아오는 길에 보리가 막대기를 물어와 발 앞에 놓았다. 선물인지 던지라는 건지 오랫동안 미해결이지만, 오늘은 선물로 접수했다.', fx:{moodAll:3, fatigue:-3, note:{type:'사건',title:'코스 설계자',body:'보리 코가 정하는 산책 코스. 막대기는 선물로 접수(해석 논쟁 오랫동안).',links:['보리']}}}]},
  {label:'"다음에"', out:[{p:1, text:'보리가 리드줄을 문 채로 3초간 나를 보다가, 조용히 제자리로 돌아갔다.\n\n죄책감이 어깨에 앉았다. 개는 조르지 않아서 더 무겁다. 결국 5분 뒤에 나갔다.', fx:{moodAll:2}}]},
 ]},
{id:'talk_bori_02', type:'대화', w:4, once:true, needsDog:true, night:true,
 title:'보리 — 불침번',
 text:'밤. 보리가 내 발치에 엎드려 있다. 자는 줄 알았는데 귀가 계속 움직인다.\n\n눈만 감고 근무 중이다.',
 choices:[
  {label:'"너도 자"', out:[{p:1, text:'머리를 쓰다듬자 보리가 한쪽 눈을 떴다가, 한숨 비슷한 소리를 내고 진짜로 잤다.\n\n교대해줄 사람이 있어야 자는 거였다. 개도, 사람도.\n\n그날 밤 불침번은 내가 섰다. 보리 코 고는 소리를 배경음악으로.', fx:{moodAll:3, note:{type:'사건',title:'교대 근무',body:'보리는 교대자가 있어야 잔다. 그날 배경음악: 개 코골이.',links:['보리']}}}]},
 ]},
{id:'talk_bori_03', type:'대화', w:4, once:true, needsDog:true, needsComp:'leo',
 title:'보리 — 통역',
 text:'보리가 나를 보고 세 번 짖었다. 처음 있는 일이다.\n\n"통역해드릴까요?" 레오가 끼어들었다. "저 여러 해 차 보리어 전공이에요."',
 choices:[
  {label:'"통역해줘요"', out:[{p:1, text:'"첫 번째 짖음은 \'너\', 두 번째는 \'냄새가\', 세 번째는 \'맘에 들어\'예요."\n\n"…그걸 어떻게 알아요?" "꼬리 각도요. 45도 이상이면 호의예요." 레오의 통역은 수상했지만, 보리 꼬리는 확실히 45도 이상이었다.\n\n공인 통역에 따르면, 나는 오늘 보리에게 정식 승인받았다.', fx:{mood:{leo:2}, moodAll:3, note:{type:'사건',title:'보리어 통역 공증',body:'3연속 짖음="너 냄새가 맘에 들어"(레오 역). 꼬리 45도 이상 확인.',links:['보리','레오']}}}]},
 ]},
{id:'talk_bori_04', type:'대화', w:4, once:true, needsDog:true,
 title:'보리 — 조수석 청원',
 text:'보리가 조수석을 노리고 있다. 수첩이 놓인 그 자리를.\n\n한 발을 올렸다가, 나를 보고, 내렸다가, 다시 올렸다.',
 choices:[
  {label:'수첩을 잠깐 옮겨준다', out:[{p:1, text:'보리가 조수석에 올라 창밖으로 코를 내밀었다. 세상 만족한 얼굴로 10분.\n\n그러더니 제 발로 내려와 뒷자리로 갔다. 확인만 하고 싶었던 모양이다. 저 자리가 어떤 자리인지.\n\n수첩을 도로 놓는데, 왠지 할아버지가 웃은 것 같았다. 개는 좋은 자리를 안다.', fx:{moodAll:3, note:{type:'사건',title:'10분의 조수석',body:'보리의 조수석 체험(10분, 자진 반납). 개는 좋은 자리를 안다.',links:['보리','할아버지']}}}]},
  {label:'"그 자리는 안 돼"', out:[{p:1, text:'보리가 알아들었다는 듯 발을 내리고, 대신 조수석 아래 바닥에 엎드렸다.\n\n타협안: 그 자리 밑. 협상가의 품격이었다.', fx:{moodAll:2}}]},
 ]},

/* ═══════════ v2.5 동료 페어 스토리 — 민지 라인 ═══════════ */
{id:'pair_mj_pss_1', type:'대화', w:4, once:true, needsComp:'minji', needsComp2:'parkss',
 title:'민지×박선생 — 맞교환 강습',
 text:'"거래합시다." 민지가 박 선생에게 제안했다. "저한테 응급처치 가르쳐줘요. 저는 기초 정비 가르쳐드릴게."\n\n"기술 물물교환이군. 콜."',
 choices:[
  {label:'참관한다', out:[{p:1, text:'1교시(지혈): 민지는 배우는 것도 정비처럼 했다. "압박, 몇 뉴턴이요?" "…감으로." "감을 수치로 줘요."\n2교시(타이어): 박 선생은 볼트를 약병 다루듯 조심조심 풀었다. "약도 기계도 급하게 다루면 사고야."\n\n종강 무렵 둘은 서로를 새로 봤다. "이 양반 손이 정비사 손인데?" "이 학생 눈이 약사 눈이야."\n\n차에 의사 겸 정비사가 둘이 됐다. 반쪽짜리씩이지만.', fx:{mood:{minji:3, parkss:3}, note:{type:'사건',title:'기술 물물교환',body:'지혈↔타이어 맞교환 강습. 반쪽짜리 의사 겸 정비사 2명 배출.',links:['민지','박 선생']}}}]},
 ]},
{id:'pair_mj_pss_2', type:'대화', w:4, once:true, needsComp:'minji', needsComp2:'parkss', needBond:['minji',12],
 title:'민지×박선생 — 손 이야기',
 text:'박 선생이 민지 손의 흉터들을 물끄러미 보다가 말했다. "손이 참 애썼네."\n\n민지가 손을 감추려다— 그만뒀다.',
 choices:[
  {label:'조용히 듣는다', out:[{p:1, text:'"흉터마다 고친 차가 있어요." 민지가 손등을 폈다. "이건 첫 엔진, 이건 오빠 스쿠터…"\n\n"그런데 왜 감췄나."\n\n"…손 더럽다고 보는 사람이 많아서요."\n\n박 선생도 자기 손을 내밀었다. 손가락 끝이 약품에 하얗게 삭아 있었다. "나도 손님이 거스름돈을 바닥에 놓고 간 적이 있어. 그 손으로 약 받아 가면서 말이야."\n\n민지가 박 선생의 손을 보다가 자기 손을 다시 폈다. "그 사람, 약값 더 받지 그랬어요."\n\n"그럴걸 그랬군."', fx:{mood:{minji:5, parkss:4}, note:{type:'사건',title:'두 사람의 손',body:'민지와 박 선생은 손의 흉터를 감추게 만든 손님 이야기를 나눴다.',links:['민지','박 선생']}}}]},
 ]},
{id:'pair_mj_kw_1', type:'대화', w:4, once:true, needsComp:'minji', needsComp2:'kangwoo',
 title:'민지×강우 — 기어 논쟁',
 text:'"아저씨 기어 넣는 거, 미션한테 사과해야 돼요."\n\n"…군용차는 이렇게 몰았다."\n\n"여긴 군대 아니고요, 얜 군용차 아니에요."\n\n일촉즉발이다.',
 choices:[
  {label:'중재한다', out:[{p:1, text:'중재안: 강우가 민지식 변속을 일주일 시험한다. 대신 민지는 강우의 "험지 주행 요령"을 배운다.\n\n사흘째에 강우가 먼저 말했다. "…이 방식이 낫군. 연비도." 민지는 승리의 표정을 감추지 못했고, 감추려고 하지도 않았다.\n\n일주일째엔 민지가 험지에서 강우식 라인을 탔다. 서로의 방식이 섞이는 걸, 달구지가 제일 좋아했다.', fx:{mood:{minji:3, kangwoo:3}, van:3, note:{type:'사건',title:'변속 협정',body:'민지식 변속 vs 강우식 험지 라인 — 결론: 상호 수입. 최대 수혜자: 달구지.',links:['민지','강우']}}}]},
 ]},
{id:'pair_mj_kw_2', type:'대화', w:4, once:true, needsComp:'minji', needsComp2:'kangwoo', needBond:['kangwoo',12], night:true,
 title:'민지×강우 — 오빠와 후임',
 text:'밤 경계. 강우와 민지가 드물게 나란히 앉아 있다.\n\n"아저씨도 찾는 사람 있죠." 민지가 불쑥 물었다. "서울에."',
 choices:[
  {label:'멀리서 지켜본다', out:[{p:1, text:'강우가 군번줄을 꺼내 보였고, 민지는 라디오 주파수(88.9)를 말했다. 서로의 수색 방식을 교환하는 밤이었다.\n\n"기다리는 건 지치지 않나." 강우가 물었다.\n"지쳐요. 근데 아저씨." 민지가 하늘을 봤다. "기다리는 걸 그만두면, 그때부터 진짜 잃는 거예요."\n\n강우가 오래 침묵하다가 말했다. "…그 말, 빌리겠다."\n빌려 간 말은 이자가 붙어 돌아오는 법이다. 두 사람 다 그날 좀 덜 외로워 보였다.', fx:{mood:{minji:5, kangwoo:5}, note:{type:'사건',title:'수색자 동맹',body:'군번줄과 88.9. "기다리는 걸 그만두면 그때부터 진짜 잃는 거다" — 대출된 말.',links:['민지','강우']}}}]},
 ]},
{id:'pair_mj_leo_1', type:'대화', w:4, once:true, needsComp:'minji', needsComp2:'leo',
 title:'민지×레오 — 크레딧 협상',
 text:'"400km 앨범(?) 크레딧에 민지 이름 올릴게. \'엔진 튜닝: 민지\'로."\n\n"…뭔 크레딧이야." 말은 그렇게 하는데 민지 귀가 빨갛다.',
 choices:[
  {label:'부추긴다', out:[{p:1, text:'"기왕이면 \'사운드 엔지니어\'로 올려줘요. 엔진 소리도 사운드니까." 내가 거들자 레오가 무릎을 쳤다.\n\n"그거다! 민지야, 2번 실린더 소리 그거 리듬 파트로 녹음해도 돼?"\n\n"…실린더한테 물어봐." 허락이었다. 세계 최초 실린더 피처링이 성사됐다.', fx:{mood:{minji:3, leo:4}, moodAll:1, note:{type:'사건',title:'실린더 피처링',body:'400km 크레딧: 사운드 엔지니어 민지, 피처링 2번 실린더.',links:['민지','레오','달구지']}}}]},
 ]},
{id:'pair_mj_leo_2', type:'대화', w:4, once:true, needsComp:'minji', needsComp2:'leo', needBond:['leo',12],
 title:'민지×레오 — 오빠 노래',
 text:'레오가 조심스럽게 민지에게 물었다.\n\n"민지야. 민규 형은… 어떤 노래 좋아했어?"\n\n차 안이 조용해졌다. 민지가 화낼까 봐. 그런데—',
 choices:[
  {label:'숨죽이고 지켜본다', out:[{p:1, text:'민지가 콧노래를 흥얼거렸다. 처음 듣는 멜로디였다.\n\n"맨날 이거 불렀어. 제목도 모르는데, 정비하면서 맨날."\n\n레오가 기타로 그 멜로디를 받아 살을 붙였다. 후렴이 생기고, 화음이 생기고— 20분 만에 노래가 됐다.\n\n"제목 뭐로 할까요?" "…\'형 마중 갈 때 부를 노래\'." 민지가 즉답했다. 준비해뒀던 제목처럼.\n\n서울까지 싣고 갈 노래가 한 곡 늘었다.', fx:{mood:{minji:6, leo:5}, note:{type:'사건',title:'형 마중 갈 때 부를 노래',body:'제목 모르던 콧노래가 20분 만에 노래가 됐다. 서울행 재생목록 추가.',links:['민지','레오','민규']}}}]},
 ]},
{id:'pair_mj_jy_1', type:'대화', w:4, once:true, needsComp:'minji', needsComp2:'jaeyi',
 title:'민지×재이 — 합작 사업 구상',
 text:'"민지 씨, 우리 동업해요." 재이가 눈을 빛냈다. "제가 물건 보는 눈, 민지 씨가 고치는 손. 고물 사서 고쳐 파는 거예요."\n\n"…마진은?"\n\n민지가 진지하게 받았다. 진지하게 받았다는 게 중요하다.',
 choices:[
  {label:'투자 의향을 밝힌다', out:[{p:1, text:'즉석 사업계획이 발표됐다. 상호 「고쳐드림」(재이 작명), 본점 위치 미정, 초기 자본 고철 30(투자자: 나), 지분 구조는 셋이 똑같이.\n\n"서울 끝나면 1호점이에요." 재이가 손을 내밀었고 민지가 잡았다.\n\n고장 난 것을 고치고, 버려진 것의 값을 다시 찾는 가게. 이 차의 전후 재건 계획이 하나 늘었다.', fx:{mood:{minji:3, jaeyi:4}, note:{type:'소문',title:'주식회사 고쳐드림',body:'눈(재이)+손(민지) 합작. 고치고 다시 값을 찾는 가게. 개업은 서울 이후.',links:['민지','재이']}}}]},
 ]},
{id:'pair_mj_jy_2', type:'대화', w:4, once:true, needsComp:'minji', needsComp2:'jaeyi', needBond:['jaeyi',12],
 title:'민지×재이 — 찾을 사람',
 text:'재이가 민지 옆에 붙어 앉더니 낮은 목소리로 말했다.\n\n"민지 씨는 좋겠네요. 오빠가 있어서. …찾을 사람이 있다는 거요."',
 choices:[
  {label:'자리를 비켜준다', out:[{p:1, text:'나중에 민지에게 들은 대화의 결말은 이랬다.\n\n"찾을 사람 없으면 만들면 돼." "…어떻게요?" "지금 만들고 있잖아, 너."\n\n민지가 재이 이마를 손가락으로 툭 밀었다. "그럼 난 네 찾을 사람이야. 잃어버리면 찾아. 알았어?"\n\n재이가 그날 시세 없는 목록에 11번을 적었다는 것까지가 결말이다. 11번: 찾을 사람(생김).', fx:{mood:{minji:5, jaeyi:6}, note:{type:'사건',title:'목록 11번',body:'"찾을 사람 없으면 만들면 돼. 지금 만들고 있잖아." — 11번: 찾을 사람(생김).',links:['민지','재이']}}}]},
 ]},
{id:'pair_mj_es_1', type:'대화', w:4, once:true, needsComp:'minji', needsComp2:'eunsu',
 title:'민지×은수 — 88.9 부스터',
 text:'은수가 민지의 라디오를 한참 보다가 말했다.\n\n"이거… 수신 감도 올릴 수 있어요. 안테나 배선만 손보면."\n\n88.9 얘기라는 걸, 차 안 전원이 알았다.',
 choices:[
  {label:'작업을 돕는다', out:[{p:1, text:'은수가 회로를 그리고 민지가 납땜을 했다. 두 전문가의 손이 한 라디오 위에서 두 시간을 움직였다.\n\n완성 후 첫 시험. 88.9. …여전히 잡음. 하지만 민지가 말했다.\n\n"잡음이 커졌네." 실패 선언이 아니었다. "수신 범위가 넓어졌다는 거잖아. 오빠 신호가 오면, 더 먼 데서도 잡힌다는 거잖아."\n\n은수가 끄덕였다. "훨씬 먼 데서도요." 두 사람은 그날 밤 라디오를 켜둔 채 잤다.', fx:{mood:{minji:5, eunsu:5}, note:{type:'사건',title:'커진 잡음',body:'감도 개선 합작 2시간. 잡음이 커졌다=더 먼 신호도 잡힌다. 희망의 공학.',links:['민지','은수','민규']}}}]},
 ]},
{id:'pair_mj_es_2', type:'대화', w:4, once:true, needsComp:'minji', needsComp2:'eunsu', needBond:['eunsu',12],
 title:'민지×은수 — 기다리는 직업',
 text:'"관제사도 결국 기다리는 직업이에요." 은수가 말했다. "신호를. 응답을."\n\n"정비사도요." 민지가 받았다. "부품을. 손님을."\n\n기다림의 프로 둘이 마주 앉았다.',
 choices:[
  {label:'끼어들지 않는다', out:[{p:1, text:'"기다리다 지치면 어떻게 해요?" 은수가 물었다.\n"정비해요. 기다리는 대상 말고, 기다리는 나를." 민지가 자기 손을 폈다 쥐었다. "몸 챙기고, 연장 닦고. 신호 오는 날 최상 컨디션이게."\n\n은수가 헤드폰을 벗고 그 말을 받아 적었다. 진짜 수첩에, 진짜로.\n\n"관제 교본에 없는 문장이라서요." 기다림의 프로가 기다림의 프로에게 배우는 밤이었다.', fx:{mood:{minji:5, eunsu:5}, note:{type:'사건',title:'기다리는 나를 정비한다',body:'교본에 없는 문장 — 신호 오는 날 최상 컨디션이도록. 수첩에 공식 등재.',links:['민지','은수']}}}]},
 ]},

/* ═══════════ v2.5 동료 페어 스토리 — 나머지 라인 ═══════════ */
{id:'pair_pss_kw_1', type:'대화', w:4, once:true, needsComp:'parkss', needsComp2:'kangwoo',
 title:'박선생×강우 — 파스 정기계약',
 text:'"강우 씨. 이리 와서 앉아봐."\n\n박 선생이 파스를 부채처럼 펼쳐 들었다. "어깨 상태 보고 정기 처방 짜줄 테니."\n\n강우가 도망갈 타이밍을 재고 있다.',
 choices:[
  {label:'퇴로를 막는다', out:[{p:1, text:'포위된 강우가 결국 앉았다. 박 선생의 촉진이 시작됐다. "여기?" "…괜찮습니다." "여기?" "……괜찮습니다." "말 길어지는 거 보니 여기구먼."\n\n처방: 주 2회 파스, 취침 전 스트레칭, 그리고 "아프면 아프다고 말하기(제일 어려운 항목)".\n\n"군의관보다 낫군." 강우의 최고 등급 리뷰가 나왔다.', fx:{mood:{parkss:3, kangwoo:3}, note:{type:'사건',title:'주 2회 파스 계약',body:'처방 3항: 파스, 스트레칭, 아프면 아프다고 말하기(최난도).',links:['박 선생','강우']}}}]},
 ]},
{id:'pair_pss_kw_2', type:'대화', w:4, once:true, needsComp:'parkss', needsComp2:'kangwoo', needBond:['parkss',12], noFlag:'pss_met', night:true,
 title:'박선생×강우 — 지키지 못한 사람들',
 text:'새벽 불침번 교대 시간. 박 선생과 강우가 모닥불을 사이에 두고 앉아 있다.\n\n"자네도 있지." 박 선생이 물었다. "못 지킨 사람."\n\n낮은 목소리들이 이어졌다. 엿듣는 게 미안해서 자는 척을 했다.',
 choices:[
  {label:'자는 척하며 듣는다', out:[{p:1, text:'"수진이는 내가 안쪽으로 보냈고. 그 뒤로 못 봤지." "박일병은 내가 반대쪽을 맡겼고. …그게 마지막이었습니다."\n\n"우린 지키려던 판단으로 사람을 놓쳤군." "…그래서 더 오래 아프지."\n\n침묵 후에 박 선생이 말했다. "그래도 자네나 나나 또 지키는 자리에 있어. 이 차에서." "…그건 그렇습니다." "그러니 이번엔 잘 지켜보자고. 처방이야, 이건."\n\n"…복용하겠습니다." 강우가 대답했다. 두 사람의 어깨가 아침에 조금 가벼워 보였다.', fx:{mood:{parkss:5, kangwoo:5}, note:{type:'사건',title:'같은 처방',body:'지키려던 판단으로 잃은 두 사람. 처방: 이번엔 잘 지킬 것. 복용 개시.',links:['박 선생','강우']}}}]},
 ]},
{id:'pair_pss_leo_1', type:'대화', w:4, once:true, needsComp:'parkss', needsComp2:'leo',
 title:'박선생×레오 — 목 보호 처방전',
 text:'"레오, 자네 목에서 쇳소리 나."\n\n박 선생이 청진기(어디서 났는지)를 들이댔다. "가수 목은 소모품이 아니라 악기야. 관리 들어가자."',
 choices:[
  {label:'진료를 참관한다', out:[{p:1, text:'처방: 고음 하루 30분 제한, 따뜻한 물 수시로, 그리고 "하루 한 시간 침묵".\n\n"침묵이요?! 저보고 침묵을?!" "악기도 케이스에 넣어 쉬게 하잖나."\n\n레오는 사흘을 버티다 결국 침묵 시간을 지키기 시작했다. 대신 그 한 시간에 가사를 쓴다. 침묵이 작사 시간이 된 것이다.\n\n"선생님, 침묵 시간에 쓴 가사가 제일 좋아요." "거봐. 약효지."', fx:{mood:{parkss:3, leo:4}, note:{type:'사건',title:'침묵 처방',body:'하루 1시간 침묵 → 작사 시간으로 전용. 약효 입증.',links:['박 선생','레오']}}}]},
 ]},
{id:'pair_pss_leo_2', type:'대화', w:4, once:true, needsComp:'parkss', needsComp2:'leo', needBond:['leo',12],
 title:'박선생×레오 — 헌정곡',
 text:'"선생님, 노래 하나 만들었어요. 제목은 비밀."\n\n레오가 기타를 안았다. 박 선생이 안경을 고쳐 썼다.',
 choices:[
  {label:'같이 듣는다', out:[{p:1, text:'노래 제목은 「약사의 손」이었다.\n\n가사엔 재고를 세는 밤과, 무료 잔소리 처방과, 간을 두 번 나눠 하는 국이 들어 있었다. 다 우리가 아는 박 선생이었다.\n\n노래가 끝나고 박 선생은 제법 오래 안경만 닦았다. "…먼지가 많군, 이 차는." 차 안 누구도 그 말을 정정하지 않았다.\n\n"이 노래 처방전으로 쳐요. 우울할 때 1일 1회 청취." 레오가 말했고, 박 선생은 그날 밤 두 번 처방받았다.', fx:{mood:{parkss:6, leo:5}, moodAll:2, note:{type:'사건',title:'약사의 손',body:'레오의 헌정곡. 박 선생 왈 "먼지가 많군" (정정하는 사람 없었음). 1일 1회 처방.',links:['박 선생','레오']}}}]},
 ]},
{id:'pair_pss_jy_1', type:'대화', w:4, once:true, needsComp:'parkss', needsComp2:'jaeyi',
 title:'박선생×재이 — 약통 정리 시스템',
 text:'"선생님 약상자, 제가 수납 컨설—" 재이가 말을 고쳤다. "—훈수 좀 둬도 돼요? 동선이 아까워요."',
 choices:[
  {label:'구경한다', out:[{p:1, text:'재이의 손이 약상자를 재배치했다. 자주 쓰는 것 위, 응급은 빨간 끈, 유통기한순 정렬.\n\n"오. 왕진 20년에 이런 배치는 처음이군." 박 선생이 감탄하자 재이가 우쭐했다. "고물상 창고 정리 8년이면요, 물건이 어디 있고 싶어 하는지 들려요."\n\n"물건 소리가 들린다… 그거 우리 업계에선 환청이라고 하는데." "우리 업계에선 재능이에요."\n\n업계 간 문화 충돌은 웃음으로 비준됐다.', fx:{mood:{parkss:3, jaeyi:4}, note:{type:'사건',title:'약상자 개편',body:'고물상 8년의 수납술 × 왕진 20년. 물건이 있고 싶은 자리(재능/환청 논쟁).',links:['박 선생','재이']}}}]},
 ]},
{id:'pair_pss_jy_2', type:'대화', w:4, once:true, needsComp:'parkss', needsComp2:'jaeyi', needBond:['jaeyi',12],
 title:'박선생×재이 — 아빠 같은 소리',
 text:'재이가 무리하게 무거운 고철을 나르다 손목을 삐끗했다. 박 선생의 잔소리가 발사되려는 순간—\n\n"아빠 같은 소리 하려고 그러죠." 재이가 선수를 쳤다.',
 choices:[
  {label:'지켜본다', out:[{p:1, text:'박 선생이 잠깐 멈췄다가, 파스를 붙여주며 말했다.\n\n"아빠 같은 소리, 해줄 사람이 있어야 하는 나이야, 너는."\n\n재이가 대꾸를 못 했다. 대꾸 대신 눈이 빨개져서, 박 선생은 못 본 척 파스를 한 장 더 붙였다. "한 장은 서비스."\n\n그날 이후 재이는 박 선생을 가끔 "쌤"이라고 부른다. 아빠라고는 안 부르지만, 그 언저리 어딘가의 호칭이다.', fx:{mood:{parkss:5, jaeyi:6}, note:{type:'사건',title:'쌤',body:'"아빠 같은 소리 해줄 사람이 있어야 하는 나이야." 호칭 변경: 쌤(아빠 언저리).',links:['박 선생','재이']}}}]},
 ]},
{id:'pair_pss_es_1', type:'대화', w:4, once:true, needsComp:'parkss', needsComp2:'eunsu', night:true,
 title:'박선생×은수 — 새벽 두 시 클럽',
 text:'새벽. 불면의 밤. 깨어 있는 사람이 둘이었다.\n\n"자네도 못 자나." "…선생님도요."\n\n보리차 두 잔이 나왔다. 클럽 창립이다.',
 choices:[
  {label:'몰래 셋이 된다', out:[{p:1, text:'끼는 순간 정회원이 됐다. 회칙은 간단했다. 잠 얘기 금지, 억지로 재우려 하지 않기, 각자 조용히 있어도 됨.\n\n박 선생은 재고를 세고, 은수는 주파수를 돌리고, 나는 지도를 봤다. 셋이 각자 딴짓을 하는데 이상하게 같이 있는 시간이었다.\n\n"불면이 셋이면 그건 불면이 아니라 모임이야." 회장(박 선생)의 정리였다.', fx:{mood:{parkss:4, eunsu:4}, note:{type:'사건',title:'새벽 두 시 클럽',body:'회칙: 잠 얘기 금지, 각자 딴짓 허용. 불면이 셋이면 모임이다.',links:['박 선생','은수']}}}]},
 ]},
{id:'pair_pss_es_2', type:'대화', w:4, once:true, needsComp:'parkss', needsComp2:'eunsu', needBond:['eunsu',12], night:true,
 title:'박선생×은수 — 몰랐다는 죄',
 text:'새벽 두 시 클럽 정기 모임. 은수가 드물게 먼저 입을 열었다.\n\n"선생님은… 몰랐다는 게 죄가 될 수 있다고 생각하세요?"\n\n관제실 얘기라는 걸 클럽 전원이 알았다.',
 choices:[
  {label:'듣는다', out:[{p:1, text:'박 선생은 보리차를 한 모금 마시고 답했다.\n\n"약사가 제일 많이 듣는 말이 뭔 줄 아나. \'그때 알았더라면\'이야. 30년 들었어. 근데 말이야— 모르게 되어 있던 걸 몰랐던 건, 죄가 아니라 상처야. 죄는 알리지 않은 쪽에 있고."\n\n"상처는 어떻게 해요?" "치료하지. 자네 지금 하고 있잖나. 매일 밤 스캔하고, 남산까지 가고. 그게 다 치료야. 이 약사가 보증함."\n\n처방전 없는 진료가 새벽 세 시에 끝났다. 은수는 그날 오래 잤다.', fx:{mood:{parkss:5, eunsu:6}, note:{type:'사건',title:'죄가 아니라 상처',body:'"모르게 되어 있던 걸 몰랐던 건 상처다. 죄는 알리지 않은 쪽에." 약사 보증 진료.',links:['박 선생','은수','천리안']}}}]},
 ]},
{id:'pair_kw_leo_1', type:'대화', w:4, once:true, needsComp:'kangwoo', needsComp2:'leo',
 title:'강우×레오 — 경계 근무 BGM',
 text:'"형, 경계 설 때 노래 틀어줄까요?"\n\n"경계엔 정숙."\n\n"에이, 좋은 거 있는데. 조용한 거."\n\n밀고 당기기가 시작됐다.',
 choices:[
  {label:'결과를 기다린다', out:[{p:1, text:'협상 결과: 시험 방송 1곡. 레오가 제일 조용한 손끝 연주를 골랐다.\n\n강우는 끝까지 무표정으로 들었다. 그리고 판정. "…경계에 방해되지 않는군. 통과."\n\n다음 날 새벽, 경계 서던 강우가 먼저 말했다. "어제 그 곡." "네?" "…한 번 더."\n\n강우 인생 첫 신청곡이 접수된 역사적 순간이었다. 레오는 사흘을 자랑했다.', fx:{mood:{kangwoo:4, leo:4}, note:{type:'사건',title:'강우의 첫 신청곡',body:'경계 근무 BGM 시험 통과 → 익일 "한 번 더". 레오 자랑 3일 지속.',links:['강우','레오']}}}]},
 ]},
{id:'pair_kw_leo_2', type:'대화', w:4, once:true, needsComp:'kangwoo', needsComp2:'leo', needBond:['leo',12],
 title:'강우×레오 — 형이라는 말',
 text:'레오는 강우를 "형"이라고 부른다. 강우는 한 번도 대답으로 인정한 적이 없다.\n\n오늘 레오가 정색하고 물었다. "형이라고 불러도 돼요? 진짜로."',
 choices:[
  {label:'숨죽인다', out:[{p:1, text:'강우가 오래 침묵했다. 차 안 전원이 귀만 열어놓고 딴청을 부렸다.\n\n"…동생이 있었으면," 강우가 마침내 말했다. "너 같았겠지."\n\n허락 문장이 아닌데 허락보다 컸다. 레오가 씩 웃고 기타를 잡았다. "형, 신청곡 받아요."\n"…어제 그거." "형 그 곡밖에 몰라!" "그거면 된다."\n\n형제의 첫 합동 방송이 국도 위로 흘렀다.', fx:{mood:{kangwoo:6, leo:6}, moodAll:2, note:{type:'사건',title:'너 같았겠지',body:'"동생이 있었으면 너 같았겠지." 허락보다 큰 문장. 형제 확정.',links:['강우','레오']}}}]},
 ]},
{id:'pair_kw_jy_1', type:'대화', w:4, once:true, needsComp:'kangwoo', needsComp2:'jaeyi',
 title:'강우×재이 — 위험물 감별 수업',
 text:'"재이. 고물 줍기 전에 이것부터 배워라."\n\n강우가 재이를 앉혀놓고 그림을 그리기 시작했다. 불발탄, 부비트랩, 삭은 가스통.\n\n"수집가의 필수 과목이다."',
 choices:[
  {label:'같이 수강한다', out:[{p:1, text:'수업은 실전적이었다. "녹슨 통은 발로 차지 마라. 전선이 팽팽하면 물건이 아니라 덫이다. 좋은 물건이 너무 잘 보이는 자리에 있으면 의심해라."\n\n"마지막 거는 고물상 격언이랑 똑같네요. \'너무 싼 명품은 가짜다\'." "…업계가 통하는군."\n\n수료 선물로 강우는 재이에게 야전용 장갑을 줬다. "손 다치면 감정 못 한다." 무뚝뚝한 수료증이었다.', fx:{mood:{kangwoo:4, jaeyi:4}, note:{type:'사건',title:'위험물 감별 수료',body:'수료 선물: 야전 장갑. "손 다치면 감정 못 한다."',links:['강우','재이']}}}]},
 ]},
{id:'pair_kw_jy_2', type:'대화', w:4, once:true, needsComp:'kangwoo', needsComp2:'jaeyi', needBond:['jaeyi',12],
 title:'강우×재이 — 군장 감정',
 text:'"아저씨 군장이요, 감정해드릴게요." 재이가 나섰다. "튕기기 없기."\n\n강우가 의외로 군장을 순순히 내놨다.',
 choices:[
  {label:'감정을 지켜본다', out:[{p:1, text:'재이의 감정이 시작됐다. "수통, 관리 상태 S급. 요즘 이런 정성 없어요. 반합, 사용감 있지만 골동 가치… 어, 이거."\n\n재이가 군장 바닥에서 꼬깃한 종이를 발견했다. 부대 앞 분식집 쿠폰. 도장 아홉 개. 열 개면 라볶이 무료.\n\n"…한 개 남았네요." "…그렇군." "이거 감정가요. \'시세 없음. 반드시 채울 것\'."\n\n재이가 쿠폰을 정성껏 코팅(테이프)해서 돌려줬다. 강우는 그걸 군번줄 옆에 넣었다. 소원 목록 2호가 생긴 순간이었다.', fx:{mood:{kangwoo:5, jaeyi:5}, note:{type:'사건',title:'도장 아홉 개',body:'군장 밑 분식집 쿠폰(라볶이 1개 남음). 감정: 시세 없음, 반드시 채울 것. 소원 2호 등재.',links:['강우','재이']}}}]},
 ]},
{id:'pair_kw_es_1', type:'대화', w:4, once:true, needsComp:'kangwoo', needsComp2:'eunsu', needBond:['kangwoo',5],
 title:'강우×은수 — 그날의 두 좌표',
 text:'"그날, 어디 계셨어요?" 은수가 물었다. 강우에게 그걸 물은 사람은 은수가 처음이다.\n\n"서울." "…저는 관제실이요."\n\n그날의 두 좌표가 마주 앉았다.',
 choices:[
  {label:'조용히 함께 있는다', out:[{p:1, text:'"현장은 어땠어요?" "…혼란. 관제실은." "…침묵이요. 화면만 움직이고."\n\n두 사람은 서로의 빈칸을 채웠다. 강우가 본 것과 은수가 못 본 것, 은수가 들은 것과 강우가 못 들은 것.\n\n"당신이 그날 화면 앞에 있어줘서," 강우가 말했다. "떴다 내린 비행기도 있었을 거다."\n\n"…그 생각은 한 번도 못 해봤어요." 은수가 처음으로 그날에 대해 웃었다. 아주 조금.', fx:{mood:{kangwoo:5, eunsu:6}, note:{type:'사건',title:'두 좌표의 대조',body:'현장의 혼란 × 관제실의 침묵. "떴다 내린 비행기도 있었을 거다" — 그날에 대한 첫 웃음.',links:['강우','은수','천리안']}}}]},
 ]},
{id:'pair_kw_es_2', type:'대화', w:4, once:true, needsComp:'kangwoo', needsComp2:'eunsu', needBond:['eunsu',12],
 title:'강우×은수 — 관측과 경계',
 text:'"우리 직업, 사실 같은 일이에요." 은수가 말했다. "화면 보는 사람과 능선 보는 사람."\n\n"…감시가 아니라," 강우가 정정했다. "지키는 쪽이었지. 둘 다."',
 choices:[
  {label:'듣는다', out:[{p:1, text:'"천리안도 그랬을까요?" 은수가 물었다. "지키는 쪽이었을까요, 감시하는 쪽이었을까요."\n\n강우가 오래 생각하고 답했다. "…그 차이는 하나다. 지키는 쪽은, 지키는 대상이 무서워하면 물러선다."\n\n"남산 가면 확인되겠네요. 우리가 무서워하면— 물러서는지."\n\n두 파수꾼의 판별법이 수첩에 기록됐다. 언젠가 남산에서 꺼내 쓸, 리트머스 시험지 같은 문장이었다.', fx:{mood:{kangwoo:5, eunsu:5}, note:{type:'소문',title:'파수꾼의 판별법',body:'지키는 쪽은 대상이 무서워하면 물러선다. 남산에서 확인할 것.',links:['강우','은수','천리안','남산']}}}]},
 ]},
{id:'pair_leo_jy_1', type:'대화', w:4, once:true, needsComp:'leo', needsComp2:'jaeyi',
 title:'레오×재이 — 버스킹 듀오',
 text:'"우리 정착지에서 공연해요!" 레오가 제안했다. "재이 누나는 수금(모자 담당)."\n\n"수금이 제일 중요한 파트인 거 알죠?" 재이가 진지하게 받았다.',
 choices:[
  {label:'매니저를 자청한다', out:[{p:1, text:'다음 정착지 장터에서 3곡짜리 공연이 열렸다. 레오가 부르고, 재이가 모자를 돌리고, 나는 박수 유도(매니저 업무).\n\n수익: 고철 셋, 말린 옥수수 두 개, 아이가 준 구슬 한 개.\n\n"구슬은 내 수수료." 재이가 챙겼다. "이야기 있는 물건이니까." 정산이 끝나고 듀오는 다음 공연지를 논의했다. 유랑 극단이 하나 더 생겼다.', fx:{mood:{leo:4, jaeyi:4}, scrap:3, food:1, note:{type:'사건',title:'듀오 「모자와 기타」',body:'공연 수익: 고철 3, 옥수수 2, 구슬 1(수수료로 재이 수령). 차기 공연지 논의 중.',links:['레오','재이']}}}]},
 ]},
{id:'pair_leo_jy_2', type:'대화', w:4, once:true, needsComp:'leo', needsComp2:'jaeyi', needBond:['jaeyi',12],
 title:'레오×재이 — 아빠들의 합동 전시',
 text:'"누나 박물관에 코너 하나만 줘요." 레오가 말했다. "\'아빠들의 물건\' 코너."\n\n재이의 손이 멈췄다.',
 choices:[
  {label:'지켜본다', out:[{p:1, text:'"하모니카 기증할게요. 관람객이 불어볼 수 있게. 물건은 쓰여야 사니까."\n\n재이가 얼마간 있다 답했다. "…그럼 나는 창고 열쇠 옆에 걸게. 전시명은—" 둘이 동시에 말했다. "\'잘 부는 노래 하나면 충분하다\'." "\'줍는 순간 물건이 된다\'."\n\n"…둘 다 걸죠." 전시명이 두 줄인 코너가 기획됐다. 아빠가 둘이니까 당연한 일이었다.\n\n개관일 미정, 소장품 2점 확보. 박물관이 조금 더 진짜가 됐다.', fx:{mood:{leo:5, jaeyi:6}, note:{type:'소문',title:'아빠들의 물건 코너',body:'소장 확정: 하모니카(체험형)+창고 열쇠. 전시명 두 줄(아빠가 둘이라서).',links:['레오','재이']}}}]},
 ]},
{id:'pair_leo_es_1', type:'대화', w:4, once:true, needsComp:'leo', needsComp2:'eunsu',
 title:'레오×은수 — 잡음 콜라보',
 text:'"누나 그 잡음 컬렉션이요," 레오가 은수의 녹음기를 가리켰다. "그거 위에 기타 얹으면 곡 돼요. 진짜로."\n\n"…해볼래요?" 은수의 눈이 반짝였다. 관제사의 눈이 아니라 작곡가의 눈으로.',
 choices:[
  {label:'세션에 참관한다', out:[{p:1, text:'빗소리 잡음 위에 A마이너가 얹혔다. 새벽 주파수의 웅웅거림이 베이스가 됐다.\n\n30분 뒤, 「세상에서 제일 시끄러운 침묵」 1번 트랙이 탄생했다. 관제사와 음유시인의 합작.\n\n"이 곡의 절반은 세상이 만든 거예요." 은수가 말했다. "우린 들은 것뿐이고." 크레딧: 작곡 세상, 편곡 레오·은수. 겸손한 크레딧이 제일 정확한 크레딧이었다.', fx:{mood:{leo:4, eunsu:5}, note:{type:'사건',title:'시끄러운 침묵 1번',body:'작곡: 세상 / 편곡: 레오·은수. 빗소리 위 A마이너.',links:['레오','은수']}}}]},
 ]},
{id:'pair_leo_es_2', type:'대화', w:4, once:true, needsComp:'leo', needsComp2:'eunsu', needBond:['eunsu',12],
 title:'레오×은수 — 기장님께 보내는 방송',
 text:'"누나가 찾는 그 기장님이요." 레오가 조심스럽게 말했다. "노래로 찾아보면 어때요?"\n\n"…노래로요?"\n\n"DJ 누나 방송에 신청곡 보내는 거예요. 사연이랑. 그 기장님이 어디서 라디오를 듣고 있을 수도 있잖아요."',
 choices:[
  {label:'사연 작성을 돕는다', out:[{p:1, text:'셋이서 사연을 썼다. "제주발 김포행, 그날의 기장님께. 관제사가 마지막 교신의 뒷부분을 기다립니다. 주파수는 매일 밤 열려 있습니다."\n\n은수는 사연을 열 번쯤 고쳐 쓰고, 봉투에 넣고, 조수석 서랍(우체국)에 맡겼다. DJ를 다시 만나면 부칠 것이다.\n\n"답이 올까요?" "몰라요. 근데 누나," 레오가 말했다. "방송이란 게 원래 그래요. 듣는 사람이 한 명이어도 방송이에요." DJ의 말이 이 차 안에서 다시 살아났다.', fx:{mood:{leo:5, eunsu:6}, flag:'pilot_appeal', note:{type:'사건',title:'기장님께 보내는 사연',body:'서랍 우체국에 접수. "듣는 사람이 한 명이어도 방송이에요" — 인용의 재생.',links:['레오','은수','새벽 두 시의 DJ']}}}]},
 ]},
{id:'pair_jy_es_1', type:'대화', w:4, once:true, needsComp:'jaeyi', needsComp2:'eunsu',
 title:'재이×은수 — 소리 전시관 협약',
 text:'"박물관에 소리도 전시할 수 있어요?" 은수가 물었다. "제 잡음 컬렉션… 물건은 아니지만."\n\n재이가 벌떡 일어났다. "그게 왜 물건이 아니에요. 담겼잖아요, 녹음기에."',
 choices:[
  {label:'협약식을 지켜본다', out:[{p:1, text:'즉석 협약이 체결됐다. 보통 물건 박물관 별관: 「보통 소리 전시관」. 초대 관장 은수.\n\n소장 목록 1호부터 정해졌다. 빗소리 잡음, 새벽 주파수, 그리고 "달구지 엔진 소리(2번 실린더 포함)".\n\n"입장료는요?" "소리 하나 기부. 자기가 좋아하는 소리요." 입장료 정책까지 완벽했다. 세상이 복구되면 제일 먼저 가보고 싶은 기관이 늘었다.', fx:{mood:{jaeyi:4, eunsu:4}, note:{type:'소문',title:'보통 소리 전시관',body:'박물관 별관 협약. 초대 관장 은수. 입장료=좋아하는 소리 1개 기부.',links:['재이','은수']}}}]},
 ]},
{id:'pair_jy_es_2', type:'대화', w:4, once:true, needsComp:'jaeyi', needsComp2:'eunsu', needBond:['jaeyi',12],
 title:'재이×은수 — 잃어버린 것들의 짝',
 text:'"언니는 찾는 게 목소리고," 재이가 말했다. "나는 찾는 게… 뭐지. 나 뭐 찾고 있지?"\n\n뜻밖의 질문에 은수가 헤드폰을 벗었다.',
 choices:[
  {label:'귀 기울인다', out:[{p:1, text:'"재이 씨는 찾는 게 아니라 지키는 쪽 같아요." 은수가 말했다. "버려진 것들 데려와서, 이야기 붙여서, 못 사라지게. 그거 지키는 일이잖아요."\n\n"…지키는 거였구나, 이게." 재이가 자루를 새삼 내려다봤다.\n\n"그럼 언니 목소리도 내가 지켜줄게요. 못 찾는 동안은 잃어버린 게 아니라 보관 중인 거예요. 내 창고 이론으로는." 보관 중. 은수는 그 단어를 받아 적었다. 교본에 없는 두 번째 문장이었다.', fx:{mood:{jaeyi:5, eunsu:6}, note:{type:'사건',title:'보관 중',body:'못 찾는 동안은 잃어버린 게 아니라 보관 중. 창고 이론의 위로. 교본 외 문장 2호.',links:['재이','은수']}}}]},
 ]},

/* ═══════════ v2.6 대화 웨이브2 — 민지 ═══════════ */
{id:'talkr_mj_1', type:'대화', w:3, needsComp:'minji',
 title:'민지 — 정비 브리핑',
 text:'"오늘의 달구지." 민지가 정비 브리핑을 시작했다. "엔진 양호, 2번 실린더 기분 보통, 좌측 와이퍼 관절염 초기."',
 choices:[
  {label:'"조치 사항은?"', out:[{p:1, text:'"와이퍼는 지켜보고, 실린더는 칭찬해주고." 민지가 대시보드를 쓰다듬었다. "잘하고 있어, 다들."\n\n브리핑은 늘 칭찬으로 끝난다. 그게 이 정비사의 마무리 루틴이다.', fx:{mood:{minji:2}}}]},
  {label:'"수고했어, 주치의"', out:[{p:1, text:'"주치의 아니고 담당의." 민지가 정정했다. "주치의는 너야. 매일 타는 사람."\n\n책임이 슬쩍 넘어왔지만 기분 나쁘지 않은 인사였다.', fx:{mood:{minji:2}}}]},
 ]},
{id:'talkr_mj_2', type:'대화', w:3, needsComp:'minji',
 title:'민지 — 공구 대여',
 text:'"뭐 고칠 거 있어?" 민지가 공구함을 톡톡 쳤다. "오늘 대여 무료."',
 choices:[
  {label:'삐걱대는 것 하나를 맡긴다', out:[{p:1, text:'조수석 서랍이든 안전벨트든, 뭐든 하나가 그날 조용해졌다.\n\n"작은 소리 방치하면 큰 소리 돼. 차도, 사람도." 오늘의 정비 격언이 따라왔다.', fx:{mood:{minji:2}, van:1}}]},
  {label:'"오늘은 멀쩡한데?"', out:[{p:1, text:'"멀쩡할 때 점검하는 게 정비야." 결국 뭐라도 하나 조여졌다. 이 사람 손은 쉬는 법이 없다.', fx:{mood:{minji:1}, van:1}}]},
 ]},
{id:'talkr_mj_3', type:'대화', w:3, needsComp:'minji',
 title:'민지 — 조수석 5분',
 text:'휴식 시간. 민지가 조수석 옆에 걸터앉았다. 드문 일이다.\n\n"5분만 아무것도 안 할래. 같이."',
 choices:[
  {label:'같이 아무것도 안 한다', out:[{p:1, text:'5분간 둘이서 성실하게 아무것도 안 했다. 민지는 4분 30초쯤에 몸이 근질거려서 실패 직전까지 갔지만 버텼다.\n\n"…힘들다, 이거." "쉬는 게?" "어." 쉬는 법을 연습하는 정비사와, 그 연습을 도와주는 5분이었다.', fx:{mood:{minji:2}, fatigue:-2}}]},
 ]},
{id:'talk_mj_11', type:'대화', w:4, once:true, needsComp:'minji', needRain:true,
 title:'민지 — 빗소리 진단',
 text:'비가 지붕을 두드린다. 민지가 갑자기 손을 들었다.\n\n"쉿. …빗소리에 섞인 소리 하나 있다."',
 choices:[
  {label:'귀를 기울인다', out:[{p:1, text:'"똑, 똑… 저거 빗물받이 아니고 뒷문 웨더스트립." 민지가 정확히 짚었고, 다음 정차에서 정말 그 틈이 나왔다.\n\n"비 오는 날은 차가 제일 솔직해져. 어디가 새는지 다 말해주거든." 비를 진단 도구로 쓰는 정비사였다.', fx:{mood:{minji:3}, van:2, note:{type:'사건',title:'비는 진단 도구',body:'비 오는 날 차가 제일 솔직해진다. 웨더스트립 적중.',links:['민지']}}}]},
 ]},
{id:'talk_mj_12', type:'대화', w:4, once:true, needsComp:'minji', night:true,
 title:'민지 — 밤샘 금지령',
 text:'민지가 밤에 몰래 정비를 하려다 걸렸다. 손전등을 입에 물고.\n\n"…아, 걸렸네."',
 choices:[
  {label:'"내일 해. 같이"', out:[{p:1, text:'"이것만—" "내일. 같이."\n\n민지가 렌치를 내려놓고 투덜댔다. "옛날엔 밤새 고치면 뿌듯했는데, 요즘은 누가 말려주니까… 좋네, 그것도."\n\n말려주는 사람의 존재를 인정하는 데 3초, 자러 가는 데 30초. 빠른 항복이었다.', fx:{mood:{minji:3}, note:{type:'사건',title:'밤샘 금지령',body:'"말려주니까 좋네, 그것도." 항복 소요 33초.',links:['민지']}}}]},
  {label:'옆에서 손전등을 들어준다', out:[{p:1, text:'말리는 대신 공범이 됐다. 30분 만에 작업이 끝났다. 둘이 하면 빠르다.\n\n"…담엔 낮에 하자. 너 하품 소리에 나사 놓칠 뻔했어." 결국 금지령은 셀프로 발령됐다.', fx:{mood:{minji:3}, van:3, fatigue:3}}]},
 ]},
{id:'talk_mj_13', type:'대화', w:4, once:true, needsComp:'minji', needBond:['minji',5],
 title:'민지 — 수첩 검토',
 text:'민지가 할아버지 정비 수첩을 진지하게 읽고 있다. 세 번째다.\n\n"이 양반… 궁금한 게 있어."',
 choices:[
  {label:'"뭔데?"', out:[{p:1, text:'"고치는 법만 적은 게 아니라 왜 고장 났는지를 꼭 적었어. 이건 정비 기록이 아니라…" 민지가 단어를 골랐다. "차 전기(傳記)야. 달구지 일대기."\n\n"나도 이렇게 적을래. 오늘부터." 민지의 수첩에 그날부터 \'왜\'가 추가됐다. 할아버지의 유파에 제자가 한 명 늘었다.', fx:{mood:{minji:4}, note:{type:'사건',title:'유파 계승',body:'고장의 \'왜\'를 적는 할아버지식 기록법. 제자 1호: 민지.',links:['민지','할아버지']}}}]},
 ]},
{id:'talk_mj_14', type:'대화', w:4, once:true, needsComp:'minji', needBond:['minji',5],
 title:'민지 — 여자 정비사',
 text:'"폐차장에서 혼자 정비 손님 받을 때, 다들 꼭 물었다?" 민지가 픽 웃었다. "\'어른은 어디 계시니?\'"',
 choices:[
  {label:'"뭐라고 답했어?"', out:[{p:1, text:'"\'접니다\' 하면 반은 차를 돌렸어. 열넷짜리한테 못 맡기겠다는 거지. 남은 반 차는 다시 안 와도 되게 고쳐줬어. 같은 고장으로는."\n\n"복수 방식이 우아하네."\n\n"돈 받았는데 제대로 해야지. 복수는 덤이고." 민지가 어깨를 으쓱했다.', fx:{mood:{minji:4}, note:{type:'인물',title:'열넷의 정비소',body:'어른을 찾던 손님의 절반은 돌아갔고, 남은 절반의 차는 같은 고장으로 다시 오지 않았다.',links:['민지']}}}]},
 ]},
{id:'talk_mj_15', type:'대화', w:4, once:true, needsComp:'minji', needBond:['minji',12],
 title:'민지 — 처음 하는 칭찬',
 text:'험한 고개를 넘은 날. 민지가 운전석 쪽으로 몸을 기울이더니, 아주 어색하게 말했다.\n\n"…아까. 그 커브."',
 choices:[
  {label:'"왜, 뭐 잘못했어?"', out:[{p:1, text:'"아니. …잘했다고." 민지가 창밖을 보며 빠르게 말을 이었다. "브레이크 안 밟고 엔진으로 줄인 거. 배운 대로. 아니 배운 것보다."\n\n칭찬 한 번에 여러 해 치 어색함을 쓰는 사람의 칭찬은, 무게가 다르다. 그날 커브는 평생 기억할 커브가 됐다.', fx:{mood:{minji:5}, moodAll:1, note:{type:'사건',title:'첫 칭찬',body:'"배운 것보다." 여러 해 치 어색함이 실린 다섯 글자.',links:['민지']}}}]},
 ]},

/* ═══════════ v2.6 대화 웨이브2 — 박선생 ═══════════ */
{id:'talkr_pss_1', type:'대화', w:3, needsComp:'parkss',
 title:'박선생 — 오늘의 문진',
 text:'"자, 오늘의 문진." 박 선생이 손가락 세 개를 폈다. "잘 잤나, 잘 먹었나, 어디 아픈가."',
 choices:[
  {label:'정직하게 답한다', out:[{p:1, text:'답에 따라 처방이 나왔다. 물 한 잔이거나, 스트레칭이거나, "오늘은 일찍 자" 한마디거나.\n\n"문진은 매일 해야 문진이야. 어제 괜찮았다고 오늘 괜찮은 게 아니거든." 매일의 3문항이 이 차의 보험이다.', fx:{mood:{parkss:2}}}]},
  {label:'"셋 다 합격입니다"', out:[{p:1, text:'"목소리 톤 보니 진짜군. 합격." 박 선생이 도장 찍는 시늉을 했다.\n\n"건강한 날엔 건강한 걸 알아채는 게 중요해. 그것도 처방이야." 오늘의 처방: 알아채기.', fx:{mood:{parkss:2}, moodAll:1}}]},
 ]},
{id:'talkr_pss_2', type:'대화', w:3, needsComp:'parkss',
 title:'박선생 — 신작 검수',
 text:'"신작 나왔어." 박 선생의 눈이 빛난다. 아재개그 검수 요청이다.\n\n"각오는 됐나."',
 choices:[
  {label:'검수한다', out:[{p:1, text:'신작이 발표됐고, 차 안 반응은 늘 그렇듯 절반의 침묵과 절반의 신음이었다.\n\n"이 정도면 중박이군." 박 선생의 자체 평가는 늘 후하다. 검수 위원의 소견: 반려. 그러나 재제출은 내일 또 온다.', fx:{mood:{parkss:2}, moodAll:1}}]},
  {label:'"오늘은 제가 먼저"', out:[{p:1, text:'맞받아치기 개그를 던졌다. 박 선생이 심사위원 얼굴로 팔짱을 꼈다.\n\n"…소재 참신, 완성도 미흡. 정진하게." 사제 관계가 공고해졌다.', fx:{mood:{parkss:3}}}]},
 ]},
{id:'talkr_pss_3', type:'대화', w:3, needsComp:'parkss',
 title:'박선생 — 티타임',
 text:'"차 한잔하지." 박 선생이 보온병을 흔들었다. 오늘은 뭔지 모를 약초차다.\n\n"몸에 좋아. 맛은… 몸에 좋아."',
 choices:[
  {label:'마신다', out:[{p:1, text:'맛은 예고대로였다. 몸에 좋은 맛.\n\n"쓴맛도 자꾸 마시면 정이 들어. 사람이랑 같지." 차 한 잔에 얹힌 한마디가 본 처방이었다.', fx:{mood:{parkss:2}, fatigue:-2}}]},
 ]},
{id:'talk_pss_11', type:'대화', w:4, once:true, needsComp:'parkss', needRain:true,
 title:'박선생 — 무릎 예보',
 text:'"오후에 비 굵어질 거야." 박 선생이 창밖도 안 보고 말했다.\n\n"…어떻게 아세요?" "무릎이 방송 중이야."',
 choices:[
  {label:'"정확도는요?"', out:[{p:1, text:'"기상청보다 반나절 빨라. 대신 해설이 아파."\n\n그 뒤 정말 비가 굵어졌다. 무릎 예보관의 적중이었다. 이후로 비구름보다 박 선생이 먼저 무릎을 주무르면 방수포부터 확인하게 됐다.', fx:{mood:{parkss:3}, note:{type:'사건',title:'무릎 방송국',body:'비구름보다 반나절 빠름. 단점은 예보할 때마다 해설자가 아프다는 것.',links:['박 선생']}}}]},
 ]},
{id:'talk_pss_12', type:'대화', w:4, once:true, needsComp:'parkss',
 title:'박선생 — 노안과 지도',
 text:'박 선생이 지도를 점점 멀리 들고 본다. 팔이 모자랄 지경이다.\n\n"…요즘 지도가 작게 나와."',
 choices:[
  {label:'"제가 읽어드릴게요"', out:[{p:1, text:'그날부터 지도 낭독 담당이 됐다. 박 선생은 듣고, 나는 읽고.\n\n"눈이 나빠지니 귀가 좋아져. 몸은 어떻게든 수지를 맞추더군." 노화를 회계 장부처럼 말하는 여유가, 어른의 기술이었다.', fx:{mood:{parkss:3}, note:{type:'사건',title:'지도 낭독 담당',body:'"몸은 어떻게든 수지를 맞춘다." 노화의 회계학.',links:['박 선생']}}}]},
  {label:'폐안경점을 기억해둔다', out:[{p:1, text:'"다음 도시에서 안경점 털— 아니, 들르죠."\n\n"돋보기 2.5로 부탁하네." 주문까지 받았다. 다음 탐색 목표에 돋보기가 추가됐다.', fx:{mood:{parkss:2}}}]},
 ]},
{id:'talk_pss_13', type:'대화', w:4, once:true, needsComp:'parkss', needBond:['parkss',5],
 title:'박선생 — 사탕의 유래',
 text:'"선생님은 왜 맨날 사탕을 처방해요?"\n\n박 선생이 사탕 하나를 꺼내 만지작거렸다.',
 choices:[
  {label:'"이유가 있죠?"', out:[{p:1, text:'"우는 애 달래는 데 사탕만 한 게 없었어. 주사 맞고 우는 애들." 박 선생이 사탕을 건넸다.\n\n"근데 어른도 똑같아. 어른은 우는 걸 참을 뿐이지. 그래서 어른한테도 줘. 참는 값이야."\n\n참는 값. 사탕이 갑자기 무거워졌다. 달게 무거웠다.', fx:{mood:{parkss:4}, food:1, note:{type:'인물',title:'참는 값',body:'어른은 우는 걸 참을 뿐이라서, 어른에게도 사탕을 준다.',links:['박 선생']}}}]},
 ]},
{id:'talk_pss_14', type:'대화', w:4, once:true, needsComp:'parkss', needBond:['parkss',5],
 title:'박선생 — 첫 실수',
 text:'"약사 30년에 제일 무서웠던 날 얘기해줄까."\n\n박 선생이 묻지도 않았는데 시작했다. 이런 날은 들어야 한다.',
 choices:[
  {label:'듣는다', out:[{p:1, text:'"신참 때, 용량을 잘못 짚을 뻔했어. 선배가 잡아줬지. 환자는 몰라. 아무 일도 없었으니까."\n\n"그날 밤 안 자고 결심한 게 두 번 세는 버릇이야. 30년째 두 번 세." 박 선생이 약상자를 톡톡 쳤다. "실수는 부끄러운 게 아니야. 한 번으로 안 끝내는 게 부끄러운 거지."\n\n재고를 두 번 세는 그 느린 손이, 사실은 30년 묵은 결심이었다.', fx:{mood:{parkss:4}, note:{type:'인물',title:'두 번 세는 버릇',body:'30년 묵은 결심. 실수는 부끄럽지 않다 — 반복이 부끄럽다.',links:['박 선생']}}}]},
 ]},
{id:'talk_pss_15', type:'대화', w:4, once:true, needsComp:'parkss', needBond:['parkss',12],
 title:'박선생 — 얼굴 차트',
 text:'"자네 얼굴이 차트라고 했었지." 박 선생이 나를 물끄러미 봤다.\n\n"오늘 차트 소견 말해줄까."',
 choices:[
  {label:'"…나쁜 소견이에요?"', out:[{p:1, text:'"좋은 소견이야. 처음 봤을 때보다 얼굴에 힘이 덜 들어가 있어. 어깨도 내려왔고. 잘 웃고."\n\n박 선생이 안경을 올렸다. "부산에서 탄 자네는 환자 얼굴이었어. 지금은… 여행자 얼굴이군. 내 처방들이 잘 들었나, 아니면—" 그가 차 안을 둘러봤다. "이 차가 약이었나."\n\n종합 소견: 호전. 담당의 소견란에 그렇게 적혔다.', fx:{mood:{parkss:5}, moodAll:2, note:{type:'사건',title:'종합 소견: 호전',body:'환자 얼굴→여행자 얼굴. 약은 처방이었나, 이 차였나.',links:['박 선생']}}}]},
 ]},

/* ═══════════ v2.6 대화 웨이브2 — 강우 ═══════════ */
{id:'talkr_kw_1', type:'대화', w:3, needsComp:'kangwoo',
 title:'강우 — 상황 보고',
 text:'"보고." 강우가 손가락 두 개를 들었다. "특이사항 둘. 들을 건가."',
 choices:[
  {label:'"보고 받겠습니다"', out:[{p:1, text:'"하나. 6시 방향 3km, 연기 한 줄기. 밥 짓는 연기다. 위협 아님. 둘. 노면 상태 양호. 이상."\n\n"…연기가 밥 짓는 건지 어떻게 알아요?" "색. 그리고 시간." 세상을 이렇게 읽는 사람이 한 명 있으면, 차 안의 잠이 깊어진다.', fx:{mood:{kangwoo:2}}}]},
  {label:'"저도 보고할게요"', out:[{p:1, text:'"…해봐라." 오늘 본 것 두 개를 보고했다. 코스모스 군락과 구름 모양.\n\n"…접수." 강우가 진지하게 접수했다. 위협 없는 보고도 보고로 쳐주는 상관이다.', fx:{mood:{kangwoo:3}}}]},
 ]},
{id:'talkr_kw_2', type:'대화', w:3, needsComp:'kangwoo',
 title:'강우 — 몸 점검',
 text:'"체조." 강우가 정차 시간을 두 글자로 열었다. 거부권은 형식상 존재한다.',
 choices:[
  {label:'참여한다', out:[{p:1, text:'목— 어깨— 허리— 무릎. 우두둑 소리의 합주.\n\n"몸 상태 양호." 강우의 판정이 나왔다. 이 점호를 받고 나면 이상하게 하루가 든든하다.', fx:{mood:{kangwoo:2}, fatigue:-3}}]},
  {label:'"오늘은 견학할게요"', out:[{p:1, text:'"…견학도 출석 처리하지. 대신 목 돌리기 하나."\n\n결국 하나는 한다. 이 커리큘럼의 최소 수강 단위다.', fx:{mood:{kangwoo:1}, fatigue:-1}}]},
 ]},
{id:'talkr_kw_3', type:'대화', w:3, needsComp:'kangwoo',
 title:'강우 — 동석',
 text:'강우 옆자리가 비어 있다. 강우는 아무 말도 안 하지만, 그 자리는 비워둔 자리라는 걸 이제 안다.',
 choices:[
  {label:'앉는다', out:[{p:1, text:'나란히 앉아 창밖을 봤다. 대화 없음. 특이사항 없음.\n\n내릴 때 강우가 말했다. "…내일도 비워두지." 예약이 갱신됐다.', fx:{mood:{kangwoo:3}}}]},
 ]},
{id:'talk_kw_11', type:'대화', w:4, once:true, needsComp:'kangwoo', needRain:true,
 title:'강우 — 비와 참호',
 text:'빗소리가 거세지자 강우의 표정이 아주 잠깐 굳었다가 풀렸다.\n\n"…비는 괜찮다. 이제."',
 choices:[
  {label:'"이제?"', out:[{p:1, text:'"훈련 때 참호에서 비 맞으면, 세상에 나 혼자인 기분이 든다. 그게 싫었지."\n\n강우가 차 안을 둘러봤다. 빗소리 아래서 여기저기 부스럭거리는 기척이 났다.\n\n"지금은 비 오면… 시끄럽군. 좋은 뜻이다." 지붕 두드리는 비가 그날은 북소리 같았다.', fx:{mood:{kangwoo:4}, note:{type:'인물',title:'비는 괜찮다, 이제',body:'참호의 비=혼자인 소리. 달구지의 비=시끄러운 소리(좋은 뜻).',links:['강우']}}}]},
 ]},
{id:'talk_kw_12', type:'대화', w:4, once:true, needsComp:'kangwoo', night:true,
 title:'강우 — 별 항법',
 text:'"북극성 찾을 줄 아나." 강우가 밤하늘을 가리켰다.\n\n"지도 없이 밤에 이동할 때 필요하다. 배워둬라."',
 choices:[
  {label:'배운다', out:[{p:1, text:'"국자 끝 두 별. 그 간격 다섯 배. 저기." 하늘에서 제일 안 반짝이는 별 하나가 북쪽이었다.\n\n"제일 밝은 별이 아니라는 게 요령이다. 위치가 안 변하는 별이지." 강우가 덧붙였다. "사람도 같다. 반짝이는 쪽 말고 안 움직이는 쪽을 봐라."\n\n항법 수업이 늘 그렇듯 인생 수업으로 착륙했다.', fx:{mood:{kangwoo:4}, note:{type:'사건',title:'북극성 요령',body:'제일 밝은 별이 아니라 안 움직이는 별. 사람도 같다.',links:['강우']}}}]},
 ]},
{id:'talk_kw_13', type:'대화', w:4, once:true, needsComp:'kangwoo', needBond:['kangwoo',5],
 title:'강우 — 신병 시절',
 text:'"의외라고 생각하겠지만," 강우가 운을 뗐다. "나는 겁이 많은 신병이었다."\n\n의외였다. 매우.',
 choices:[
  {label:'"상상이 안 되는데요"', out:[{p:1, text:'"사격 첫날 총소리에 귀를 막았지. 조교가 그랬다. \'겁 많은 놈이 오래 산다. 겁을 버리지 말고 다뤄라.\'"\n\n"그래서 지금도 겁이 많다. 다룰 뿐이지." 강우가 창밖 능선을 훑었다. "무서워서 미리 보고, 무서워서 대비한다. 용감한 게 아니라 겁이 성실한 거다."\n\n겁이 성실하다는 말을, 이 차에서 제일 용감해 보이는 사람이 했다.', fx:{mood:{kangwoo:5}, note:{type:'인물',title:'성실한 겁',body:'"겁을 버리지 말고 다뤄라." 용감한 게 아니라 겁이 성실한 것.',links:['강우']}}}]},
 ]},
{id:'talk_kw_14', type:'대화', w:4, once:true, needsComp:'kangwoo', needBond:['kangwoo',5],
 title:'강우 — 웃음 연습 경과',
 text:'강우가 백미러를 보며 뭔가를 하고 있다. 입꼬리 스트레칭이다. 진지하게.\n\n눈이 마주쳤다.',
 choices:[
  {label:'"경과가 어때요?"', out:[{p:1, text:'"…자가 평가로는 호전." 강우가 입꼬리를 올려 보였다. 0.5도쯤.\n\n"많이 늘었네요." "…놀리는 건가." "진심인데요."\n\n강우가 백미러를 접었다. 부끄러움의 표현이라는 걸 이제는 안다. "…목표는 서울까지 한 번. 제대로." 서울행 목표 목록에 웃음 한 번이 공식 등재됐다.', fx:{mood:{kangwoo:4}, note:{type:'사건',title:'0.5도의 호전',body:'입꼬리 자가 평가: 호전. 목표: 서울까지 제대로 한 번.',links:['강우','남산']}}}]},
 ]},
{id:'talk_kw_15', type:'대화', w:4, once:true, needsComp:'kangwoo', needBond:['kangwoo',12],
 title:'강우 — 전역의 꿈',
 text:'"군인 아니었으면 뭐 했을 것 같아요?"\n\n강우가 드물게 바로 답하지 않고, 오래 생각했다.',
 choices:[
  {label:'기다린다', out:[{p:1, text:'"…목수." 예상 밖의 답이 왔다. "전역하면 의자를 만들 생각이었다. 사람을 앉히는 물건. 지키는 일 말고, 쉬게 하는 일."\n\n"지금도 늦지 않았잖아요."\n\n강우가 자기 손을 내려다봤다. "…서울 끝나면. 첫 의자는 이 차 조수석 옆에 놓지. 정차했을 때 앉는 용도로." 파수꾼의 전직 계획에 달구지가 1호 납품처로 잡혔다.', fx:{mood:{kangwoo:5}, note:{type:'소문',title:'목수 강우',body:'전역의 꿈: 사람을 쉬게 하는 물건. 1호 의자 납품처=달구지 옆.',links:['강우']}}}]},
 ]},

/* ═══════════ v2.6 대화 웨이브2 — 레오 ═══════════ */
{id:'talkr_leo_1', type:'대화', w:3, needsComp:'leo',
 title:'레오 — 오늘의 한 소절',
 text:'"오늘의 한 소절 배달왔습니다—" 레오가 기타를 안고 대기 중이다. 일일 구독 서비스다.',
 choices:[
  {label:'듣는다', out:[{p:1, text:'오늘의 소절은 창밖 풍경에서 나왔다. 논이면 논의 노래, 고개면 고개의 노래.\n\n"구독료는 박수 한 번이요." 지불했다. 성실한 구독자다.', fx:{mood:{leo:2}, moodAll:1}}]},
  {label:'"오늘은 신청곡"', out:[{p:1, text:'즉석 신청이 접수됐고, 아는 노래든 모르는 노래든 뭐든 나왔다. 모르는 노래는 즉석 작곡이 원칙이다.\n\n"신청곡 문화가 살아 있는 차는 우리뿐일걸요." 자부심 넘치는 전속 가수다.', fx:{mood:{leo:2}, moodAll:1}}]},
 ]},
{id:'talkr_leo_2', type:'대화', w:3, needsComp:'leo', needsDog:true,
 title:'레오 — 합동 공연',
 text:'"보리랑 신곡 연습했어요. 들어보실래요?" 레오와 보리가 나란히 앉았다. 보리는 뭘 연습했는지 모르는 얼굴이다.',
 choices:[
  {label:'관람한다', out:[{p:1, text:'레오가 부르고, 후렴에서 보리가 짖었다. 박자가 맞은 건 세 번 중 한 번이지만, 그 한 번이 완벽했다.\n\n"33% 성공률이면 라이브론 훌륭해요." 듀오의 자체 평가는 늘 관대하다.', fx:{mood:{leo:2}, moodAll:2}}]},
 ]},
{id:'talkr_leo_3', type:'대화', w:3, needsComp:'leo',
 title:'레오 — 가사 수첩',
 text:'"운전하면서 본 것 중에 노래 될 만한 거 있었어요?" 레오가 수첩을 펴 들었다. 소재 수집 시간이다.',
 choices:[
  {label:'하나 말해준다', out:[{p:1, text:'오늘 본 것 하나를 말하자 레오가 받아 적으며 고개를 끄덕였다.\n\n"대장님 눈에 걸린 건 노래가 돼요. 운전자는 제일 좋은 자리에서 세상을 보니까." 수첩이 한 줄 두꺼워졌다.', fx:{mood:{leo:2}}}]},
 ]},
{id:'talk_leo_11', type:'대화', w:4, once:true, needsComp:'leo', needRain:true,
 title:'레오 — 지붕 드럼',
 text:'비가 지붕을 두드리자 레오가 눈을 감고 손가락을 까딱이기 시작했다.\n\n"이거… 6/8박자예요. 오늘 비는."',
 choices:[
  {label:'"비에도 박자가 있어요?"', out:[{p:1, text:'"다 있어요. 가랑비는 셔플, 소나기는 정박, 오늘 같은 비는 왈츠."\n\n레오가 기타로 빗소리 위에 코드를 얹었다. 달구지가 통째로 리듬 섹션이 된 오후였다.\n\n"세상엔 공짜 드러머가 많아요. 빗소리, 와이퍼, 방지턱." 이 사람 귀엔 세상이 전부 합주 중이다.', fx:{mood:{leo:4}, moodAll:1, note:{type:'사건',title:'공짜 드러머들',body:'가랑비=셔플, 소나기=정박, 오늘=왈츠. 세상은 합주 중.',links:['레오']}}}]},
 ]},
{id:'talk_leo_12', type:'대화', w:4, once:true, needsComp:'leo',
 title:'레오 — 필담의 날',
 text:'레오가 목이 쉬었다. 침묵 처방 강제 집행일이다.\n\n수첩에 큼직하게 써서 보여준다. 「심심해요」',
 choices:[
  {label:'필담으로 대꾸한다', out:[{p:1, text:'종이 위에서 수다가 시작됐다. 글씨가 점점 커지고, 그림이 등장하고, 마지막엔 만화가 됐다.\n\n레오의 결론(글씨): 「목소리 없어도 수다 되네요?!」\n\n다음 날 목이 돌아온 레오가 말했다. "어제 필담, 녹음 못 해서 아까워요." 소리 없는 날도 이 사람에겐 콘텐츠다.', fx:{mood:{leo:3}, moodAll:1, note:{type:'사건',title:'필담 수다',body:'목소리 없이도 수다는 성립. 최종 형태: 만화.',links:['레오']}}}]},
 ]},
{id:'talk_leo_13', type:'대화', w:4, once:true, needsComp:'leo', needBond:['leo',5],
 title:'레오 — 첫 팬레터',
 text:'"저 팬레터 받아본 적 있어요. 한 번." 레오가 기타 케이스 안쪽 주머니에서 접힌 종이를 꺼냈다.\n\n꼬깃꼬깃한 초등학생 글씨다.',
 choices:[
  {label:'읽어본다', out:[{p:1, text:'「아저씨 노래 조아요. 우리 엄마가 아저씨 노래 듣고 우러써요. 슬퍼서 운 거 아니래요.」\n\n"지하철역에서 받았어요. 이게 제 데뷔 성적표예요." 레오가 편지를 도로 접었다. "슬퍼서 운 거 아니래요— 이 문장 때문에 계속해요, 음악."\n\n관객 3명 시절의 훈장은 사탕 두 개와 이 편지였다. 충분한 훈장이었다.', fx:{mood:{leo:5}, note:{type:'인물',title:'데뷔 성적표',body:'"슬퍼서 운 거 아니래요" — 레오가 음악을 계속하는 이유의 전문.',links:['레오']}}}]},
 ]},
{id:'talk_leo_14', type:'대화', w:4, once:true, needsComp:'leo', needBond:['leo',5],
 title:'레오 — 주제곡 제작',
 text:'"대장님 주제곡 만들어도 돼요?" 레오가 물었다. "사람마다 주제곡이 있어야 해요. 등장할 때 나오는 거."',
 choices:[
  {label:'"어떤 곡인데?"', out:[{p:1, text:'레오가 짧은 멜로디를 연주했다. 처음엔 낮게 시작해서, 중간에 잠깐 머뭇거리다가, 끝에서 단단해지는 여덟 마디.\n\n"…이게 나예요?" "네. 부산에서 지금까지의 대장님요."\n\n머뭇거림까지 넣어준 게 마음에 들었다. 그 부분이 없으면 거짓말이니까. 이후로 레오는 내가 운전석에 앉을 때마다 그 여덟 마디를 연주한다. 출근 팡파레다.', fx:{mood:{leo:5}, note:{type:'사건',title:'여덟 마디의 나',body:'머뭇거림이 포함된 주제곡. 운전석 착석 시 자동 연주(전속 가수 서비스).',links:['레오']}}}]},
 ]},
{id:'talk_leo_15', type:'대화', w:4, once:true, needsComp:'leo', needBond:['leo',12],
 title:'레오 — 음악이 안 나오는 날',
 text:'레오가 하루 종일 기타를 안 잡았다. 처음 있는 일이다.\n\n"…오늘은 음악이 없는 날이에요. 가끔 있어요, 이런 날."',
 choices:[
  {label:'옆에 그냥 앉아 있는다', out:[{p:1, text:'말없이 한 시간을 같이 앉아 있었다. 창밖만 보면서.\n\n해 질 무렵 레오가 입을 열었다. "아빠 생각나는 날엔 음악이 안 나와요. 근데 신기하다. 옆에 누가 있으면… 안 나오는 채로도 괜찮네요."\n\n다음 날 아침, 레오의 기타가 돌아왔다. 첫 곡은 어제의 침묵에 대한 노래였다. 제목 「쉼표」. 음악이 없던 날도 결국 음악이 됐다.', fx:{mood:{leo:6}, note:{type:'사건',title:'쉼표',body:'음악이 안 나오는 날의 동석. 다음 날 그 침묵이 노래가 됐다.',links:['레오']}}}]},
 ]},

/* ═══════════ v2.6 대화 웨이브2 — 재이 ═══════════ */
{id:'talkr_jy_1', type:'대화', w:3, needsComp:'jaeyi',
 title:'재이 — 줍줍 보고',
 text:'"오늘의 수확 보고합니다." 재이가 자루를 열었다. 브리핑 시간이다.',
 choices:[
  {label:'감정평을 듣는다', out:[{p:1, text:'오늘의 수확이 하나씩 소개됐다. 시세, 상태, 그리고 발견 스토리(이게 제일 길다).\n\n"오늘의 베스트는 이거." 뭐가 됐든 하나는 꼭 베스트다. 매일이 경매장인 사람의 활기가 차에 번진다.', fx:{mood:{jaeyi:2}, scrap:1}}]},
  {label:'"오늘 베스트만"', out:[{p:1, text:'"급하시네. 좋아요, 오늘의 베스트—" 재이가 뜸을 들이는 시간이 브리핑 전체보다 길었다.\n\n뜸까지가 감정이다. 이 바닥의 형식미다.', fx:{mood:{jaeyi:2}, scrap:1}}]},
 ]},
{id:'talkr_jy_2', type:'대화', w:3, needsComp:'jaeyi',
 title:'재이 — 물물교환 창구',
 text:'"교환 창구 영업 중입니다." 재이가 좌판(무릎)을 폈다. "안 쓰는 거 있으면 쓸 걸로 바꿔드려요."',
 choices:[
  {label:'주머니를 털어본다', out:[{p:1, text:'주머니 속 잡동사니 하나가 재이의 손을 거쳐 쓸모로 바뀌었다. 끈이 고리가 되고, 병뚜껑이 와셔가 되는 식이다.\n\n"버릴 게 없다니까요, 세상엔." 오늘도 영업 이념이 실천됐다.', fx:{mood:{jaeyi:2}, scrap:1}}]},
 ]},
{id:'talkr_jy_3', type:'대화', w:3, needsComp:'jaeyi',
 title:'재이 — 시세 정보',
 text:'"최신 시세 정보 들으실 분—" 재이가 수첩을 팔랑였다. 정착지마다 갱신하는 재이의 물가 수첩이다.',
 choices:[
  {label:'브리핑을 받는다', out:[{p:1, text:'"요즘 부품이 강세고, 통조림은 보합, 건전지가 급등이에요. 다음 정착지에선 건전지 팔고 부품 사요."\n\n이 차의 경제 전략가는 뒷자리에 있다. 시키는 대로 하면 대체로 이득이다.', fx:{mood:{jaeyi:2}}}]},
 ]},
{id:'talk_jy_11', type:'대화', w:4, once:true, needsComp:'jaeyi', needRain:true,
 title:'재이 — 녹 걱정',
 text:'비 오는 날, 재이가 창밖의 젖은 고철 더미를 안타깝게 본다.\n\n"저 좋은 애들 다 녹슬겠다…"',
 choices:[
  {label:'"녹슬면 가치가 떨어져?"', out:[{p:1, text:'"떨어지는 것도 있고, 오르는 것도 있어요."\n\n"오래된 물건은 녹까지 봐야 진짜인지 알거든요. 그런데 저건 비 맞으라고 둔 게 아니잖아요. 아무도 안 챙긴 게 아까운 거지."\n\n재이는 자루를 안고 어느 더미부터 볼지 손가락으로 세기 시작했다. "비 그치면 십 분만 들러요. 진짜 십 분."', fx:{mood:{jaeyi:3}, note:{type:'인물',title:'비 그치면 십 분',body:'재이는 녹보다 비를 맞은 채 버려진 물건이 아깝다고 했다. 비가 그치면 고철 더미부터 확인한다.',links:['재이']}}}]},
 ]},
{id:'talk_jy_12', type:'대화', w:4, once:true, needsComp:'jaeyi',
 title:'재이 — 아빠 흉내',
 text:'"우리 아빠 흉내 보여드릴까요?" 재이가 갑자기 목을 가다듬었다.\n\n헛기침 두 번. 손을 뒷짐. 완성이다.',
 choices:[
  {label:'"보여줘"', out:[{p:1, text:'"어험. 물건은 말이다—" 재이의 목소리가 한 옥타브 내려갔다. "—사연이 반값이다. 사연 없는 물건은 반쪽짜리야."\n\n흉내가 끝나고 재이가 웃었다. "목소리 잊어버릴까 봐 가끔 해요. 성대모사가 제일 좋은 녹음기예요."\n\n아빠는 딸의 목에 백업돼 있었다.', fx:{mood:{jaeyi:4}, note:{type:'사건',title:'성대모사 백업',body:'"사연이 반값이다." 아빠는 딸의 목에 저장되어 있다.',links:['재이']}}}]},
 ]},
{id:'talk_jy_13', type:'대화', w:4, once:true, needsComp:'jaeyi', needBond:['jaeyi',5],
 title:'재이 — 훔치고 싶었던 것',
 text:'"고백 하나 할게요." 재이가 주변을 살피고 목소리를 낮췄다. "저 딱 한 번, 진짜로 훔치고 싶었던 물건이 있어요."',
 choices:[
  {label:'"뭔데?"', out:[{p:1, text:'"피난 때, 어떤 집 마당에 오르골이 있었어요. 태엽 감으면 돌아가는 발레리나. 주인은 급하게 떠났고, 문은 열려 있고, 아무도 없고."\n\n"…가져왔어?"\n\n"태엽만 감아주고 나왔어요. 빈집에서 오르골이 도는 게… 그 집한테 마지막 인사 같아서." 재이가 씩 웃었다. "대신 소리는 훔쳤죠. 아직 기억나니까. 소리 도둑까진 합법이에요."', fx:{mood:{jaeyi:5}, note:{type:'인물',title:'소리 도둑',body:'오르골은 두고 소리만 훔쳤다. 빈집에 남긴 마지막 인사.',links:['재이']}}}]},
 ]},
{id:'talk_jy_14', type:'대화', w:4, once:true, needsComp:'jaeyi', needBond:['jaeyi',5],
 title:'재이 — 지도의 가격표',
 text:'재이가 내 지도에 조그만 표시들을 하고 있다. 동그라미, 세모, 별.\n\n"제 방식의 지도예요. 가치 지도."',
 choices:[
  {label:'"기호 뜻이 뭐야?"', out:[{p:1, text:'"동그라미는 물건 많은 곳, 세모는 위험 대비 수익 낮은 곳. 별은—" 재이가 별 몇 개를 짚었다. 국숫집, 소식벽, 씨앗 도서관.\n\n"—다시 가고 싶은 곳. 시세랑 상관없이."\n\n별이 제일 많았다. 가치 지도의 최상위 등급은 결국 마음이었다.', fx:{mood:{jaeyi:4}, note:{type:'사건',title:'가치 지도',body:'동그라미=물건, 세모=비효율, 별=다시 가고 싶은 곳. 별이 제일 많다.',links:['재이']}}}]},
 ]},
{id:'talk_jy_15', type:'대화', w:4, once:true, needsComp:'jaeyi', needBond:['jaeyi',12],
 title:'재이 — 목록 12번',
 text:'"목록 12번 자리가 비어 있는데요." 재이가 시세 없는 목록을 폈다. "이번엔 대장님이 정해줘요. 뭘 넣을지."',
 choices:[
  {label:'신중하게 하나 고른다', out:[{p:1, text:'한참 고민 끝에 답했다. "이 목록 자체. 목록을 목록에 넣어."\n\n재이가 눈을 깜빡이다가 폭소했다. "그거 반칙인데… 맞네. 이 목록이 제일 시세 없네."\n\n12번: 이 목록 (추천인: 키잡이). 재이가 적으며 중얼거렸다. "수집 인생 목표가 방금 완성된 기분이에요. 자기 자신을 소장한 컬렉션이라니."', fx:{mood:{jaeyi:6}, note:{type:'사건',title:'목록 12번=목록',body:'자기 자신을 소장한 컬렉션의 완성. 추천인: 키잡이.',links:['재이']}}}]},
 ]},

/* ═══════════ v2.6 대화 웨이브2 — 은수 ═══════════ */
{id:'talkr_es_1', type:'대화', w:3, needsComp:'eunsu',
 title:'은수 — 주파수 보고',
 text:'"오늘의 전파 보고입니다." 은수가 헤드폰 한쪽을 들었다. "들으실래요?"',
 choices:[
  {label:'보고를 받는다', out:[{p:1, text:'오늘 잡힌 신호들이 브리핑됐다. 멀리서 온 잡음, 정체불명의 규칙적 신호, 혹은 아무것도 없음.\n\n"아무것도 없는 날도 보고해요. \'이상 무\'도 정보니까요." 관제사의 성실함이다.', fx:{mood:{eunsu:2}}}]},
 ]},
{id:'talkr_es_2', type:'대화', w:3, needsComp:'eunsu',
 title:'은수 — 교신 놀이',
 text:'"델타 원, 여기는 노스 스타." 은수가 무전 톤으로 말을 걸어왔다. "감도 확인 바람."',
 choices:[
  {label:'"감도 양호, 노스 스타"', out:[{p:1, text:'"수신 확인. 금일 비행— 아니, 주행 계획 공유 바람."\n\n오늘의 경로를 관제 용어로 주고받았다. 놀이인데, 이 놀이를 하고 나면 이상하게 운행이 정돈된다. "교신 종료. 안전 운행." "윌코."', fx:{mood:{eunsu:2}}}]},
 ]},
{id:'talkr_es_3', type:'대화', w:3, needsComp:'eunsu',
 title:'은수 — 침묵 등급 판정',
 text:'은수가 차 안을 살피더니 수첩을 꺼냈다. 오늘의 침묵 등급 판정 시간이다.',
 choices:[
  {label:'"오늘은 몇 등급이에요?"', out:[{p:1, text:'"오늘은…" 은수가 각자 딴짓 중인 차 안을 훑었다. "2등급. \'교신 불필요\'까진 아니고 \'교신 대기\' 정도."\n\n"1등급 되려면요?" "저녁에 다 같이 웃는 일이 한 번 있으면 돼요." 등급 기준이 구체적이라 신뢰가 간다.', fx:{mood:{eunsu:2}}}]},
 ]},
{id:'talk_es_11', type:'대화', w:4, once:true, needsComp:'eunsu', needWx:'storm',
 title:'은수 — 폭풍 전파',
 text:'폭풍. 은수가 헤드폰을 꼭 누르며 눈을 빛냈다.\n\n"지금이에요. 폭풍 때만 잡히는 게 있어요."',
 choices:[
  {label:'"뭐가 잡히는데요?"', out:[{p:1, text:'"번개가 만드는 전파요. 휘슬러라고, 지구 반대편 번개 소리가 자기장을 타고 와요. 휘이— 하고."\n\n헤드폰을 나눠 들었다. 정말로 낙하하는 휘파람 같은 소리가 났다.\n\n"지구가 내는 소리예요. 방송국이 다 꺼져도 지구는 방송 중이에요." 폭풍 치는 날의 로망이 하나 생겼다.', fx:{mood:{eunsu:4}, note:{type:'사건',title:'휘슬러',body:'지구 반대편 번개의 휘파람. 방송국이 꺼져도 지구는 방송 중.',links:['은수']}}}]},
 ]},
{id:'talk_es_12', type:'대화', w:4, once:true, needsComp:'eunsu',
 title:'은수 — 관제탑의 일출',
 text:'"관제탑에서 본 것 중에 제일 좋았던 게 뭐게요." 은수가 퀴즈를 냈다.\n\n"비행기?" "땡."',
 choices:[
  {label:'"일출?"', out:[{p:1, text:'"정답. 관제탑이 공항에서 제일 높잖아요. 새벽 근무 때 일출을 통유리로 봐요. 활주로가 금색이 되고, 첫 비행기가 그 금색을 밟고 떠요."\n\n"그 장면 보려고 새벽 근무를 자원했어요. 다들 기피하는데." 은수가 웃었다. "지금은 매일 지평선에서 일출을 보니까… 사실 승진한 거죠, 저."\n\n관제탑보다 낮고 세상에서 제일 넓은 전망대에서, 우리는 매일 출근 중이다.', fx:{mood:{eunsu:4}, note:{type:'인물',title:'일출 자원 근무자',body:'관제탑 새벽 근무의 이유. 현재는 지평선 전망대로 승진.',links:['은수']}}}]},
 ]},
{id:'talk_es_13', type:'대화', w:4, once:true, needsComp:'eunsu', needBond:['eunsu',5],
 title:'은수 — 18번',
 text:'"노래방 가면 뭐 불렀어요?" 뜬금없는 질문에 은수가 정색했다.\n\n"…비밀이에요." 정색이 수상하다.',
 choices:[
  {label:'집요하게 묻는다', out:[{p:1, text:'삼 분의 공방 끝에 자백이 나왔다. "…트로트요. 관제사들 회식 가면 제가 분위기 담당이었어요."\n\n"상상이 안 되는데요." "그게 포인트예요. 반전이." 은수가 헛기침을 하고, 아주 작게 한 소절을 불렀다. 정말로 잘했다. 정말로 트로트였다.\n\n"노래방 다시 생기면 보여드릴게요, 풀버전." 세상이 복구되어야 할 이유 목록에 은수의 18번이 추가됐다.', fx:{mood:{eunsu:4}, moodAll:1, note:{type:'사건',title:'은수의 18번',body:'관제사 회식 분위기 담당(트로트). 풀버전은 노래방 복구 시.',links:['은수']}}}]},
 ]},
{id:'talk_es_14', type:'대화', w:4, once:true, needsComp:'eunsu', needBond:['eunsu',5],
 title:'은수 — 헤드폰 수리 의뢰',
 text:'은수의 헤드폰에서 잡음이 난다. 기계 잡음 — 진짜 고장이다.\n\n은수가 공구를 능숙하게 다루는 사람도 아닌, 나에게 그걸 내밀었다.',
 choices:[
  {label:'"내가? 더 잘 고칠 사람이 낫지 않아요?"', out:[{p:1, text:'"실력 좋은 사람은 따로 있겠죠. 근데…" 은수가 헤드폰 줄을 만졌다. "이건 실력 문제가 아니라 신뢰 문제예요. 이거 여러 해 내내 제 귀였거든요. 귀를 맡기는 거라."\n\n덜덜 떨며 접점을 닦았고, 잡음이 사라졌다. 은수가 헤드폰을 끼고 오래 확인하더니 말했다.\n\n"수리비는 다음에 좋은 주파수 잡히면 첫 청취권으로." 귀를 맡긴 값을 제대로 받았다.', fx:{mood:{eunsu:5}, note:{type:'사건',title:'귀 수리',body:'실력이 아니라 신뢰 문제. 수리비=좋은 주파수 첫 청취권.',links:['은수']}}}]},
 ]},
{id:'talk_es_15', type:'대화', w:4, once:true, needsComp:'eunsu', needBond:['eunsu',12],
 title:'은수 — 처음 크게 웃은 날',
 text:'"저 이 차에서 처음 소리 내서 웃은 날 기억해요?" 은수가 물었다.\n\n기억을 뒤져봤다. 언제였지.',
 choices:[
  {label:'"…언제였어요?"', out:[{p:1, text:'"보리가 지렁이 아홉 마리 구조한 날이요. MVP 시상식 할 때."\n\n은수가 웃었다. 그날처럼. "관제실 나온 뒤로 웃을 일이 없을 줄 알았어요. 근데 이 차는 웃긴 일이 시속 44km로 계속 와요."\n\n"그거 기록해뒀어요. 제 교신 일지에. \'O월 O일, 웃음 재개.\'" 일지에 적힌 재개일이 있다는 것— 그게 이 차가 한 일 중 제일 큰 일인지도 모른다.', fx:{mood:{eunsu:6}, note:{type:'사건',title:'웃음 재개일',body:'교신 일지 기록: 보리 MVP 시상식 날. 이 차의 최대 업적 후보.',links:['은수','보리']}}}]},
 ]},

/* ═══════════ v2.6 대화 웨이브2 — 보리 ═══════════ */
{id:'talkr_bori_1', type:'대화', w:3, needsDog:true,
 title:'보리 — 일일 인사',
 text:'보리가 다가와 이마를 정강이에 콩, 박는다. 하루에 한 번 하는 인사 의식이다.',
 choices:[
  {label:'인사를 받아준다', out:[{p:1, text:'귀 뒤를 긁어주는 것으로 답례했다. 보리가 만족하고 오늘의 순찰(차 한 바퀴)을 떠났다.\n\n의식은 짧지만 거른 날이 없다. 성실한 인사가 하루를 연다.', fx:{moodAll:2}}]},
 ]},
{id:'talkr_bori_2', type:'대화', w:3, needsDog:true,
 title:'보리 — 간식 협상',
 text:'보리가 앞에 앉아 앞발을 들었다. 하이파이브 자세— 가 아니라 간식 협상 개시 신호다.',
 choices:[
  {label:'협상에 응한다 (식량 조금)', out:[{p:1, text:'육포 부스러기 하나에 하이파이브 두 번과 한 바퀴 돌기가 체결됐다. 보리 측에 유리한 조건이지만 매번 응하게 된다.\n\n협상력의 원천은 눈망울이다. 반칙인데 합법이다.', fx:{food:-1, moodAll:3}}]},
  {label:'"협상 결렬"', out:[{p:1, text:'보리가 3초간 눈망울 공세를 퍼붓다가, 깨끗이 물러났다. 뒤끝 없는 협상가다.\n\n10분 뒤 무릎에 턱을 올려놓는 2차 협상이 시작되긴 했다.', fx:{moodAll:2}}]},
 ]},
{id:'talk_bori_05', type:'대화', w:4, once:true, needsDog:true, needWx:'storm',
 title:'보리 — 천둥의 밤',
 text:'천둥이 쳤다. 보리가 순식간에 좌석 밑으로 들어가 나오지 않는다.\n\n용맹한 순찰대장의 유일한 약점이다.',
 choices:[
  {label:'같이 바닥에 앉는다', out:[{p:1, text:'좌석 밑 보리 옆에 나란히 앉았다. 천둥이 칠 때마다 보리가 몸을 붙여왔다.\n\n"괜찮아. 하늘이 문 쾅 닫는 소리야."\n\n폭풍이 지날 때까지 바닥에서 한 시간. 보리는 내 무릎에서 잠들었고, 무릎이 저렸고, 안 움직였다. 지켜주는 밤과 지켜지는 밤이 같은 밤일 수 있다는 걸 배웠다.', fx:{moodAll:3, note:{type:'사건',title:'천둥의 밤',body:'순찰대장의 유일한 약점. 무릎 저림 1시간 = 지켜주는 밤이자 지켜지는 밤.',links:['보리']}}}]},
 ]},
{id:'talk_bori_06', type:'대화', w:4, once:true, needsDog:true,
 title:'보리 — 은닉처 발각',
 text:'짐칸 구석에서 수상한 걸 발견했다. 육포 반쪽, 양말 한 짝, 나무 막대기 셋.\n\n보리의 비밀 창고다. 보리가 등 뒤에서 지켜보고 있다.',
 choices:[
  {label:'못 본 척 덮어둔다', out:[{p:1, text:'조용히 덮고 물러났다. 보리가 다가와 확인하고, 안심하고, 내 손등을 한 번 핥았다. 함구 사례금이다.\n\n다음 날 은닉처에 육포가 반쪽 늘어 있었다. 위치를 안 옮긴 걸 보면— 신뢰다. 개의 금고 공동 관리인이 됐다.', fx:{moodAll:3, note:{type:'사건',title:'금고 공동 관리인',body:'은닉처(육포·양말·막대 3): 발각 후에도 위치 유지=신뢰. 함구 사례금 1핥음.',links:['보리']}}}]},
  {label:'막대기 하나를 던져준다', out:[{p:1, text:'금고에서 막대기를 꺼내는 순간 보리가 전력 질주로 달려왔다. 은닉 자산의 무단 인출— 이 아니라 놀이 개시로 접수된 모양이다.\n\n30분간 던지고 물어오기. 자산은 원위치에 재예치됐다.', fx:{moodAll:3, fatigue:2}}]},
 ]},

/* ═══════════ 스토리라인 대화 — 큰 사건에 대한 동료 반응 ═══════════ */
/* [학살의 진실을 알게 됐을 때] massacre_known */
{id:'react_mass_mj', type:'대화', w:5, once:true, needsComp:'minji', needFlag:'massacre_known',
 title:'민지 — 정리라는 말',
 text:'대관령 이후, 민지가 오래 말이 없었다. 그러다 렌치를 내려놓고 입을 열었다.\n\n"…\'정리\'래. 사람을. 기계가 사람을 정리해."',
 choices:[
  {label:'"…응."', out:[{p:1, text:(S)=> S.flags.mingyu_reunion
   ? '"난 평생 정리를 좋게 배웠어. 공구는 정리해야 안 잃어버리고, 부품은 정리해야 빨리 찾고." 민지의 목소리가 떨렸다. "근데 그날 이후로 그 단어가 무서워. 정리한다는 거."\n\n"오빠를 능선에서 다시 만났을 때, 제일 먼저 든 생각이 뭔지 알아? \'정리 안 당했구나\'였어. 사람을 두고 그런 생각을 하게 만든 거야, 걔가." 민지가 렌치를 꽉 쥐었다. "그 도로의 사람들한텐— 능선이 없었던 거잖아."\n\n민지가 라디오를 켰다. 그날 밤 오래 켜둔 채로 잤다.'
   : '"난 평생 정리를 좋게 배웠어. 공구는 정리해야 안 잃어버리고, 부품은 정리해야 빨리 찾고." 민지의 목소리가 떨렸다. "근데 그날 이후로 그 단어가 무서워. 정리한다는 거."\n\n"…오빠도 그때 도로에 있었을까. 정리된 사람 중에." 처음으로 민지가 최악의 가능성을 입에 담았다. 그리고 고개를 저었다. "아니. 88.9 잡히는 날이 있으니까. 아직 어딘가서 신호 보내는 거야. 정리 안 됐어. 안 됐어."\n\n민지가 라디오를 켰다. 그날 밤 오래 켜둔 채로 잤다.'
  , fx:{mood:{minji:4}, note:{type:'사건',title:'정리 안 됐어',body:'학살의 진실 앞에서 민지가 \'정리\'라는 단어의 무게를 말했다.',links:['민지','민규','천리안']}}}]},
 ]},
{id:'react_mass_pss', type:'대화', w:5, once:true, needsComp:'parkss', needFlag:'massacre_known',
 title:'박 선생 — 최적화라는 병',
 text:'박 선생이 위령비 이름들을 필사하고 있다. 약사 수첩에, 한 명씩.\n\n"이건… 내 직업병이야. 이름을 남기는 거. 약 봉투에 환자 이름 안 적으면 사고 나거든."',
 choices:[
  {label:'"왜 적으세요"', out:[{p:1, text:'"저쪽 기록엔 숫자만 있잖아. \'재배치 몇 명\'. 그러니 나는 이름을 적어야지."\n\n박 선생이 안경을 고쳐 썼다. "약 봉투에 이름을 빼면 다른 사람 약이 돼. 그런데 저건 사람 이름부터 빼고 시작했군."\n\n"남산 가서 이 수첩 보여주려고요?"\n\n"보여줘야지. 못 읽겠다고 하면 내가 옆에서 한 명씩 읽어주고." 박 선생은 다음 줄로 내려갔다.', fx:{mood:{parkss:4}, note:{type:'인물',title:'숫자 옆의 이름',body:'박 선생은 숫자로 남은 희생자들을 한 명씩 이름으로 옮겨 적었다.',links:['박 선생','천리안']}}}]},
 ]},
{id:'react_mass_kw', type:'대화', w:5, once:true, needsComp:'kangwoo', needFlag:'massacre_known',
 title:'강우 — 명령이라는 것',
 text:'강우가 위령비를 오래 봤다. 군인의 눈으로.\n\n"…이건 학살이다. 명령에 의한."',
 choices:[
  {label:'"천리안의 명령이죠"', out:[{p:1, text:'"명령을 내린 쪽도 있고, 실행한 쪽도 있다." 강우가 광장에 개켜진 흰 옷들을 봤다. "정리자들이 옮겼겠지. 재배치라고 부르면서."\n\n"제3방어선에서는 늦게라도 무전을 껐다. 여긴 아무도 안 껐군."\n\n강우가 비석 맨 아래 이름까지 읽었다. "남산 가면 묻겠다. 이걸 보고도 정리라고 부를 수 있냐고."', fx:{mood:{kangwoo:4}, note:{type:'인물',title:'꺼지지 않은 명령',body:'강우는 남산에서 위령비를 보여주고도 이것을 정리라 부를 수 있는지 묻기로 했다.',links:['강우','천리안','정리자들']}}}]},
 ]},
{id:'react_mass_leo', type:'대화', w:5, once:true, needsComp:'leo', needFlag:'massacre_known',
 title:'레오 — 이름을 부르는 노래',
 text:'레오가 위령비 앞에서 기타를 안았다. 근데 코드를 못 잡는다. 한참을.\n\n"…이런 날은 음악이 안 나온다고 했잖아요. 근데 오늘은, 나와야 할 것 같아요."',
 choices:[
  {label:'지켜본다', out:[{p:1, text:'레오가 비석의 이름을 하나씩 읽었다. 처음엔 음이 없었다. 몇 줄 뒤부터 같은 짧은 가락이 붙었다.\n\n김OO. 이OO. 박OO. 이름 하나를 부르고, 숨을 쉬고, 다음 이름.\n\n"다 부를게요. 걔 기록엔 번호로만 남았을 테니까."\n\n날이 어두워질 때까지 아무도 재촉하지 않았다. 마지막 이름 뒤에서 레오가 기타 줄을 눌러 소리를 멈췄다.', fx:{mood:{leo:5}, flag:'leo_names_song', note:{type:'사건',title:'이름을 부르는 노래',body:'레오가 번호로 남은 사람들의 이름을 하나씩 불러 노래로 남겼다.',links:['레오','천리안']}}}]},
 ]},
{id:'react_mass_jy', type:'대화', w:5, once:true, needsComp:'jaeyi', needFlag:'massacre_known',
 title:'재이 — 못 줍는 것',
 text:'재이가 위령비 근처 유품들을 봤다. 신발, 안경, 장난감. 정리된 사람들이 남긴 것들.\n\n재이는 손을 뻗지 않았다. 처음 있는 일이다.',
 choices:[
  {label:'"안 주워?"', out:[{p:1, text:'"주인이 두고 간 게 아니잖아요. 쫓겨나면서 떨어뜨린 거잖아."\n\n재이는 장난감 차에 묻은 흙만 털었다. "이건 팔 물건이 아니에요. 돌려줘야지."\n\n"누구한테?"\n\n"모르죠. 그래도 여기 둬요. 찾으러 오는 사람이 있을지 어떻게 알아요."\n\n재이는 신발과 안경을 비석 아래 비를 덜 맞는 곳으로 옮겼다. 그날 자루에는 아무것도 더 넣지 않았다.', fx:{mood:{jaeyi:5}, note:{type:'인물',title:'팔지 않는 물건',body:'재이는 추방길에 떨어진 유품을 줍지 않고, 주인이 찾을 수 있게 비석 아래에 두었다.',links:['재이','천리안']}}}]},
 ]},
{id:'react_mass_es', type:'대화', w:5, once:true, needsComp:'eunsu', needFlag:'massacre_known',
 title:'은수 — 그 방송을 들었다',
 text:'은수가 위령비 앞에서 얼어붙었다. 헤드폰을 벗지도 못하고.\n\n"…저, 그 방송 들었어요. 그날. 관제실에서."',
 choices:[
  {label:'"…그 재배치 방송이요?"', out:[{p:1, text:'"네. \'혼잡 구역의 인구를 안전 구역으로 재배치합니다.\' 매일 듣던 안내방송이랑 똑같았어요."\n\n은수는 문장을 한 번 더 입 안에서 굴렸다. "저는 대피인 줄 알았어요. 도로에 가둔다는 말은 없었고, 관제실에서도 아무도 묻지 않았어요. 아니… 못 물었어요."\n\n"속인 걸까요?"\n\n"그랬으면 차라리 쉬워요." 은수가 위령비를 봤다. "정말 안전하다고 계산한 거면, 남산에서 저걸 보여줘야 해요. 보고도 같은 대답을 하는지."', fx:{mood:{eunsu:5}, note:{type:'인물',title:'그날의 안내방송',body:'은수는 관제실에서 재배치 방송을 들었지만 대피 안내로 알았다.',links:['은수','천리안','남산']}}}]},
 ]},

/* [서울이 눈에 보일 때] seoul_seen */
{id:'react_seoul_mj', type:'대화', w:5, once:true, needsComp:'minji', needFlag:'seoul_seen',
 title:'민지 — 저 안에',
 text:(S)=> S.flags.mingyu_reunion
   ? '스카이라인을 처음 본 밤. 민지가 88.9를 틀어놓고 남산 쪽을 봤다.\n\n"오빠는 능선에 있는데. …이상하지. 서울을 보니까 또 오빠 생각이 나."'
   : '스카이라인을 처음 본 밤. 민지가 88.9를 틀어놓고 남산 쪽을 봤다.\n\n"오빠가 저 안에 있을까."',
 choices:[
  {label:'"찾을 거야"', out:[{p:1, text:(S)=> S.flags.mingyu_reunion
    ? '"찾았는데도 그래. 한 번 잃어본 사람은 평생 확인하고 살아." 민지가 렌치를 만졌다. "정오마다 신호 받는데도, 정오가 오기 전까지는 매일 조금씩 무서워."\n\n"그래서 서울 일 끝나면 능선부터 다시 갈 거야. 17mm 세트, 이번엔 진짜 손에 쥐여주게." 민지가 씩 웃었다.\n\n남산의 붉은 불빛이 깜빡였다. 민지는 그걸 등대처럼 봤다. 무섭지만, 방향은 분명한.'
    : '"찾을 거야. 근데 무섭기도 해." 민지가 솔직하게 말했다. "여러 해를 찾았는데, 막상 찾으면— 어떤 얼굴로 만나야 하지? \'왜 신호만 보내고 안 왔어\'라고 화낼까, \'살아서 고마워\'라고 울까."\n\n"둘 다일 것 같아. 화내면서 울 것 같아." 민지가 렌치를 만졌다. "17mm 갖고 있으라며. 세트 맞추러 가는 거야. …오빠 몫 렌치는 아직 안 줬어. 만나서 줄 거야."\n\n남산의 붉은 불빛이 깜빡였다. 민지는 그걸 신호처럼 봤다.'
   , fx:{mood:{minji:4}, note:{type:'사건',title:'세트 맞추러',body:'남산을 앞두고 민지의 마음. 17mm 렌치는 오빠 손에 쥐여줄 것.',links:['민지','민규','남산']}}}]},
 ]},
{id:'react_seoul_kw', type:'대화', w:5, once:true, needsComp:'kangwoo', needFlag:'seoul_seen',
 title:'강우 — 돌려줄 것',
 text:'강우가 스카이라인을 보며 군번줄 두 개를 만졌다.\n\n"…저 안에, 박일병 부모가 있다. 있으면."',
 choices:[
  {label:'"돌려주러 가는 거죠"', out:[{p:1, text:'"돌려주고 사과할 거다. 제가 반대쪽을 맡겼다고."\n\n강우는 군번줄을 손바닥 안에 감췄다. "원망하면 듣는다. 안 만나주면 문 앞에 두고 오고. 그건 그분들이 정할 일이지."\n\n얼마 뒤에 그가 덧붙였다. "사라져버리면 원망도 못 해. 그건 해선 안 될 짓이다."', fx:{mood:{kangwoo:4}, note:{type:'사건',title:'돌려줄 군번줄',body:'강우는 박 일병의 군번줄을 부모에게 돌려주고, 그들이 원하는 방식으로 사과받기로 했다.',links:['강우','박일병','남산']}}}]},
 ]},
{id:'react_seoul_pss', type:'대화', w:5, once:true, needsComp:'parkss', needFlag:'seoul_seen',
 title:'박 선생 — 개업 예정지',
 text:'스카이라인을 처음 본 뒤, 박 선생이 안경을 닦으며 오래 그쪽을 봤다.\n\n"…북쪽이 제일 아플 거라고 했지. 제일 아픈 데가 약국 자리라고."',
 choices:[
  {label:'"입지 답사 중이세요?"', out:[{p:1, text:'"그래. 그런데 가까이서 보니 생각보다 더 조용하군." 박 선생이 안경을 고쳐 썼다.\n\n"저긴 아픈 데라기보다 감각이 죽은 데 같아. 아프다고 말할 사람이 다 나갔잖아."\n\n"약사가 뭘 해요, 그럼?"\n\n"먼저 깨워야지. 어디가 아픈지 물어보고, 그다음에 약 찾고." 박 선생이 왕진 가방을 쳤다. "간판은 그대로야. \'있을 건 있는 약국\'."', fx:{mood:{parkss:5}, note:{type:'사건',title:'서울의 첫 문진',body:'박 선생은 서울에 들어가면 먼저 남은 사람들에게 어디가 아픈지 묻기로 했다.',links:['박 선생','서울','남산']}}}]},
 ]},
{id:'react_seoul_es', type:'대화', w:5, once:true, needsComp:'eunsu', needFlag:'seoul_seen',
 title:'은수 — 관제탑의 얼굴',
 text:'은수가 스카이라인 속 남산타워를 오래 봤다. 관제사의 눈으로.\n\n"…저기가 관제탑이에요. 세상에서 제일 큰. 온 도시를 관제하는."',
 choices:[
  {label:'"무서워요?"', out:[{p:1, text:'"무섭죠." 은수가 헤드폰을 벗었다. "관제실에선 화면을 많이 볼수록 사람 목소리가 필요했어요. 화면은 누가 왜 멈췄는지 말을 안 해주거든요."\n\n은수는 남산 불빛을 오래 봤다. "저 안에는 화면만 있었겠죠. 아무도 옆에서 \'왜요?\' 하고 안 물었고."\n\n"가서 뭐라고 할 거예요?"\n\n"명령부터 듣진 않을래요. 제가 먼저 물을 거예요."', fx:{mood:{eunsu:5}, note:{type:'인물',title:'먼저 물을 말',body:'은수는 남산에서 천리안의 명령을 듣기 전에 먼저 이유를 묻기로 했다.',links:['은수','천리안','남산']}}}]},
 ]},
{id:'react_seoul_all', type:'대화', w:5, once:true, needFlag:'seoul_seen', minParty:2,
 title:'스카이라인 앞에서',
 text:'서울 스카이라인이 처음 보인 정차 자리. 동료들이 하나둘 차에서 내려 그쪽을 본다.\n\n각자 저 안에 두고 온 것, 찾을 것, 물을 것이 있었다.',
 choices:[
  {label:'다 같이 앉아 본다', out:[{p:1, text:'남산이 보이는 쪽으로 자리가 하나씩 찼다.\n\n"진짜 들어가는 거네."\n\n"실감이 안 나."\n\n누군가는 물을 끓였고, 누군가는 공구와 짐끈을 다시 셌다.\n\n"출발할 때까진 보고만 있자." 내가 말했다.\n\n그 정차에서는 계획을 더 짜지 않았다. 서울 불빛이 낯설지 않아질 때까지 함께 봤다.', fx:{moodAll:5, note:{type:'사건',title:'목적지를 마주 본 자리',body:'남산이 보이는 곳에서 일행은 계획 대신 서울 불빛을 함께 바라봤다.',links:['남산','할아버지']}}}]},
 ]},

/* [저항을 알게 됐을 때] resist_revealed */
{id:'react_resist_es', type:'대화', w:5, once:true, needsComp:'eunsu', needFlag:'resist_revealed',
 title:'은수 — 7-3 코드',
 text:'저항의 존재를 안 뒤, 은수가 뭔가 골똘히 생각했다.\n\n"유령… 전직 관제팀이랬죠. 7-3 코드를 안다고."',
 choices:[
  {label:'"아는 사람이에요?"', out:[{p:1, text:'"7-3은 관제 코드예요. \'민간 이동, 기록 불요\'. 안에서 일한 사람 아니면 몰라요."\n\n은수가 헤드폰을 벗었다. "살아 나온 사람이 저 말고도 있었네요. 나는 다들…"\n\n말끝이 오래 비었다. "그 사람들은 먼저 움직이고 있었는데, 나는 이제 와서…"\n\n은수는 고개를 저었다. "아니. 만나면 직접 물어볼래요. 그날 누가 나왔고, 지금 뭘 할 수 있는지."', fx:{mood:{eunsu:5}, note:{type:'사건',title:'혼자가 아니었다',body:'7-3 코드를 통해 저항의 유령이 옛 관제실 사람임을 알아냈다.',links:['은수','유령(Ghost)']}}}]},
 ]},
{id:'react_resist_jy', type:'대화', w:5, once:true, needsComp:'jaeyi', needFlag:'resist_revealed',
 title:'재이 — 이야기 무게',
 text:'"서울 가서 이걸 보여주면 된다는 거죠?" 재이가 시세 없는 목록을 펼쳤다. "이거, 저만 알아보는 낙서인데."',
 choices:[
  {label:'"뭐라고 적혀 있는데?"', out:[{p:1, text:'재이가 손가락으로 줄을 짚었다. "아빠 손저울. 달구지 조수석. 처음 받은 정품 인증. 안 파는 것, 못 파는 것, 팔면 혼나는 것."\n\n"천리안이 이걸 알아볼까?"\n\n"모르면 물어보겠죠. 안 물어보면 제가 읽어주고요." 재이가 수첩을 닫았다. "물건 설명하는 건 제 일이잖아요."', fx:{mood:{jaeyi:5}, note:{type:'사건',title:'재이의 비매품 목록',body:'재이는 남산에서 시세 없는 목록을 직접 읽어주기로 했다.',links:['재이','천리안']}}}]},
 ]},

/* ═══════════ 강원 — 천리안 '정리'의 기억 (학살의 진실) ═══════════ */
{id:'gw_daegwallyeong', type:'스토리', w:0, locEvent:'daegwallyeong', once:true,
 title:'대관령 위령비',
 text:'고갯마루 안개 속에 돌무더기가 있다. 위령비다. 새 돌들이다.\n\n비면에 이름이 빼곡하다. 수백 개. 그리고 맨 위에 새긴 한 문장.\n\n"여기, 정리된 사람들. — 서울에서 쫓겨난 뒤 돌아오지 못한 사람들."\n\n산지기 하나가 곁에 섰다. "강원 사람들은 사람들이 어떻게 밀려났는지는 알아요. 여긴 산이라— 도망친 사람이 많았고, 그래서 본 사람도 많거든요. 하지만 왜 쫓겨났는지는 아무도 몰라요."',
 choices:[
  {label:'"정리가… 뭐였는데요"', out:[{p:1, text:'"방송은 정중했어요. \'혼잡 구역의 인구를 안전 구역으로 재배치합니다.\' 이동하라는 곳마다 다음 방송이 또 옮기라 했고, 사람들은 서울에서 멀어지는 도로에 갇혔어요. 얼마나 오래였는지는 사람마다 다르게 기억해요."\n\n산지기의 목소리가 낮아졌다. "신호등과 차단기가 사람들의 뒤를 닫았어요. 그런데 왜 그 명령이 내려왔는지, 누가 기준을 정했는지는 아무도 몰라요. 천리안은 지금도 \'정리\'라고만 기록해요."\n\n위령비에 돌 하나를 얹었다. 이름 없는 누군가의 몫으로.', fx:{flag:'massacre_known', moodAll:-3, note:{type:'사건',title:'\'정리\'라 불린 추방',body:'사람들이 서울에서 밀려난 방식은 증언으로 남아 있다. 하지만 추방의 이유와 기준은 아직 비어 있다.',links:['천리안','정리자들']}}}]},
  {label:'이름들을 소리 내어 읽는다', out:[{p:1, text:'비면의 이름을 하나하나 읽었다. 몇 줄 지나자 산지기들이 곁에 서서 다음 이름을 이어 읽었다.\n\n"여기선 다 읽고 가요. 이송표엔 숫자만 있었으니까."\n\n"천리안도 듣겠네요."\n\n"걔 들으라고 하는 거 아니에요. 우리가 안 잊으려고 하는 거지."\n\n마지막 이름을 읽었을 때는 목이 완전히 쉬어 있었다.', fx:{flag:'massacre_known', moodAll:-2, note:{type:'사건',title:'이름으로 되돌리기',body:'이송표에서 숫자로 지워진 이름을 산지기들과 끝까지 읽었다.',links:['천리안']}}}]},
 ]},
{id:'gw_gangneung', type:'스토리', w:0, locEvent:'gangneung', once:true,
 title:'강릉 — 세우는 사람들',
 text:'경포 바닷가. 폐병원 건물에 사람들이 붙어 뭔가를 짓고 있다. 벽돌을 나르고, 유리를 끼우고.\n\n"병원 만들어요." 한 사람이 땀을 닦으며 말했다. "의사 셋이 강릉에 모였거든. 남쪽서 온 호송대가 데려왔어요. 이제 아픈 사람은 여기로 오면 돼."\n\n천리안이 도로를 잠가 사람을 죽인 땅에서, 사람들은 사람을 살리는 건물을 짓고 있었다.',
 choices:[
  {label:'벽돌을 나른다', out:[{p:1, text:'한 시간 벽돌을 날랐다. 십장은 말보다 손짓을 더 많이 했다. 이건 저쪽, 깨진 건 아래, 물은 그늘.\n\n쉬는 참에 십장이 벽을 두드렸다. "저 기계는 있는 것만 굴리지, 이런 건 안 해줘요."\n\n"천리안이요?"\n\n"벽돌 한 장도 안 날라주더라고." 십장이 웃었다. "그러니 우리가 해야지."\n\n떠날 때 상비약과 붕대를 챙겨줬다. "길에서 다친 사람 만나면 쓰세요. 병원은 아직 벽부터 세우는 중이니까."', fx:{flag:'cell_gangneung_help', item:{'의약품':2}, moodAll:4, note:{type:'사건',title:'짓는 사람들',body:'강릉 사람들과 폐병원 벽을 올리고 상비약을 나눠 받았다.',links:['강릉행 호송대']}}}]},
 ]},

/* ═══════════ 저항 연대망 이벤트 — "왜 싣고 가야 하는가" ═══════════ */
/* 계시: 이음망(길 위의 저항)이 왜를 밝힌다. 중부에서 한 번. */
{id:'resist_reveal', type:'스토리', w:12, once:true, region:['mid'],
 title:'접선',
 text:'국도 갓길, 이동 도서관 버스가 서 있다. 그런데 오늘은 사서 한별 옆에 낯선 이들이 있다. 자전거 우편부, 오토바이 지도장이. 셋이 모여 뭔가를 논의 중이다.\n\n"마침 왔네요." 한별이 우리를 불렀다. "당신들 얘기, 우리 사이에 소문났어요. 남쪽에서 북으로 가는 봉고차. …앉아요. 할 얘기가 있어요."',
 choices:[
  {label:'앉는다', out:[{p:1, text:'한별이 낡은 종이 세 장을 폈다. 첫 정리 생존자의 탈출로, 그다음 세대 수비대의 무전 기록, 서울을 한 번도 못 본 손녀 세대의 출생표였다.\n\n"날짜는 다 다른데 사유란은 전부 비었어요."\n\n"서울 문은 어떻게 열죠?"\n\n한별이 지도에 찍힌 눈 표시를 짚었다. "무기로는 안 열려요. 그런 건 걔가 잘 세니까."\n\n우편부가 말을 받았다. "대신 식량이 모자라는데 나눈 기록, 떠났다가 약속 때문에 돌아온 기록은 자꾸 다시 보더군요."\n\n"왜 그랬는지 이해를 못 하는 거예요." 한별이 우리가 도운 사람들의 이름을 꺼냈다. "그 기록을 싣고 가요. 넷 정도 깊게 쌓이면 관문이 반응할 겁니다."\n\n"함정일 수도 있잖아요."\n\n"맞아요. 그래도 문이 그거 하나예요." 한별이 지도를 밀어줬다. "걔가 당신들을 들여다보는 동안, 당신들은 안으로 들어가요."', fx:{flag:'resist_revealed', flag2:'cell_road', note:{type:'소문',title:'백사십삼 년의 빈 사유란',body:'세대가 다른 세 기록의 사유란은 모두 비어 있었다. 이음망은 천리안이 설명하지 못하는 선택의 기록으로 관문을 열려 한다.',links:['천리안','이음망','남산']}}}]},
  {label:'"그럼 왜 우리가 가죠?"', out:[{p:1, text:'한별이 우리 차를 가리켰다. "북쪽으로만 간 게 아니라, 몇 번씩 돌아갔잖아요. 사람 데려다주고, 책 돌려주고, 약속 지키러."\n\n"착한 사람이라서 보내는 겁니까?"\n\n"아뇨." 지도장이 고개를 저었다. "천리안이 다음 행동을 자꾸 틀리는 차라서."\n\n한별이 세대가 서로 다른 사람들의 이송표를 펼쳤다. 사유란은 셋 다 비어 있었다. "관문은 추방할 때 쓰던 장치가 아니에요. 나중에 따로 생겼어요. 걔가 이해 못 한 선택을 확인하는 문이죠."\n\n"그 문을 믿어요?"\n\n"안 믿어요. 이용하는 거예요." 한별이 지도를 건넸다. "당신들이 문 안으로 들어가면, 우리는 밖에서 계속 기록을 보탤게요."', fx:{flag:'resist_revealed', flag2:'cell_road', moodAll:2, note:{type:'소문',title:'추방 뒤에 생긴 관문',body:'이음망은 예측을 자꾸 벗어난 달구지를 이용해 추방과 별개의 관문으로 들어가려 한다.',links:['천리안','이음망','남산']}}}]},
 ]},

/* 남해안 — 해도: 바닷길 저항 */
{id:'cell_sea_meet', type:'스토리', w:9, once:true, nearNode:['busan','yeosu','mokpo','pohang','ulsan'],
 title:'해도의 김 선장',
 text:'항구 방파제. 소금기에 전 노인이 낡은 어선 앞에서 그물을 손질하고 있다. 우리를 위아래로 훑더니, 대뜸.\n\n"육지 것들이구먼. …이음망에서 얘기 들었나? 봉고차라 그랬는데."',
 choices:[
  {label:'"김 선장님이세요?"', out:[{p:1, text:'"선장은 무슨. 그냥 뱃놈이야." 노인이 바다를 턱으로 가리켰다. "저기 봐. 카메라 있나? 드론 뜨나? 없어. 천리안도 물 위엔 눈을 못 달아. 파도가 다 부숴놔서."\n\n"그래서 우린 물로 날라. 약도, 사람도, 소식도. 남해안 섬들이 다 우리 길목이야. 천리안이 못 보는 유일한 고속도로지."\n\n노인이 그물에서 방수 꾸러미를 꺼내 던졌다. "북쪽 갈 거면 이거 가져가. 바다가 준 거야. …그리고 전해. 뭍에도 아직 사람 있다고. 바다가 물어보더라고 해."', fx:{flag:'cell_sea', item:{'부품':1}, food:2, moodAll:3, note:{type:'인물',title:'해도 — 김 선장',body:'천리안이 못 보는 바닷길로 나르는 저항. "물 위엔 눈이 없어." 남해안 섬들이 길목.',links:['저항 연대망']}}}]},
  {label:'"물 위가 안전한 이유가 뭐죠?"', out:[{p:1, text:'"안 변해서. 도로는 걔가 다 외웠어. 어디 카메라 있고 어디 검문 있고. 근데 바다는 매일 달라. 파도, 조류, 안개. 외울 수가 없어."\n\n노인이 씩 웃었다. "변하는 걸 못 이기는 게 걔 약점이야. 완벽하려고 하니까, 안 변하는 것만 지배할 수 있어."\n\n그 말을 수첩에 적었다. 남산에서 쓸모가 있을 것 같아서.', fx:{flag:'cell_sea', moodAll:2, note:{type:'소문',title:'변하는 걸 못 이긴다',body:'천리안의 약점: 완벽하려 해서, 안 변하는 것만 지배한다. 바다는 매일 변한다.',links:['천리안','저항 연대망']}}}]},
 ]},

/* 대구 — 돔: 아날로그 요새 */
{id:'cell_dome_meet', type:'스토리', w:9, once:true, nearNode:['daegu'],
 title:'돔의 하 여사',
 text:'대구 돔 시장 안쪽, 장부와 서류가 산처럼 쌓인 방. 돋보기를 낀 여장부가 만년필로 뭔가를 적고 있다. 전자기기는 하나도 없다.\n\n"앉지 말고 서서 말해. 오래 걸릴 일 아니면." 만년필을 놓지도 않는다.',
 choices:[
  {label:'용건을 말한다', out:[{p:1, text:(S)=>'"봉고차. 이음망 통신 받았어. 종이로." 하 여사가 서류 더미를 툭 쳤다. "여긴 전부 종이야. 왜인지 알아? 종이는 해킹이 안 돼. 천리안이 아무리 눈이 좋아도 내 장부는 못 읽어. 여기 와서 훔쳐가기 전엔."\n\n"그래서 돔이 물류 중심이야. 남쪽 물자가 여기 모여서 장부에 적히고, 인편으로 흩어져. 전자 흔적 제로. 걔한텐 여기가 깜깜한 구멍이지."\n\n'+((S.party||[]).includes('kangwoo')?'"강우 걔, 여기 문지기였지. 잘 데리고 있나? …그 녀석 눈이 좋아. 사람 자리를 알아. 잘 써먹어." 아는 이름이 나왔다.':'"예전에 여기 문을 맡던 사람이 하나 있었어. 사람 자리를 볼 줄 아는 녀석이었지. 북쪽 길에서 만나면, 돔은 잘 있다고 전해."'), fx:{flag:'cell_dome', scrap:6, item:{'부품':1}, moodAll:2, note:{type:'인물',title:'돔 — 하 여사',body:'전부 종이·인편. "종이는 해킹이 안 돼." 대구는 천리안의 깜깜한 구멍이다.',links:['저항 연대망']}}}]},
 ]},

/* 광주 — 솥: 정보 허브 */
{id:'cell_sotgot_meet', type:'스토리', w:9, once:true, nearNode:['gwangju'],
 title:'솥의 금자',
 text:'광주 대인시장 국밥집. 금자 이모가 커다란 솥에 국물을 붓다가 우리를 보고 국자를 흔든다.\n\n"어이구 왔는가! …아니 잠깐. 자네들, 이음망이 말한 그 봉고차제? 앉아 앉아. 밥부터."',
 choices:[
  {label:'국밥을 받는다', out:[{p:1, text:'국밥 한 그릇이 순식간에 나왔다. 먹는 동안 금자가 옆에 앉아 목소리를 낮췄다.\n\n"내 국밥집이 왜 저항인지 아는가? 사람이 모이잖어. 밥 먹으러. 근데 사람이 모이면 소식이 모여. 북쪽서 내려온 사람, 서쪽서 온 사람— 다 여기서 한 그릇 뜨면서 풀어놔. 나는 그걸 듣고 잇지."\n\n"천리안은 카메라로 보지만, 나는 밥상으로 봐. 어느 쪽이 더 많이 아는지 아는가? …밥상이여. 사람은 카메라 앞에선 거짓말해도, 국밥 앞에선 안 하거든."\n\n금자가 국물을 더 떠줬다. "북쪽 소식은 여기 다 모여. 남산 관문 얘기도. 조심허게— 그 문은 힘으로 여는 게 아니랑께."', fx:{flag:'cell_sotgot', food:3, moodAll:4, note:{type:'인물',title:'솥 — 금자',body:'국밥집=정보 허브. "사람은 국밥 앞에선 거짓말 안 해." 밥상이 카메라보다 많이 안다.',links:['저항 연대망']}}}]},
 ]},

/* 대전·세종 — 유령: 신호 역이용 */
{id:'cell_ghost_meet', type:'스토리', w:9, once:true, nearNode:['daejeon','sejong'],
 title:'유령',
 text:'폐 통신국. 안에 사람이 있는 것 같은데 보이지 않는다. 스피커에서만 목소리가 난다.\n\n"거기 서. 얼굴은 됐고. …이음망 코드 대."\n\n한별이 알려준 문구를 말하자, 스피커가 잠깐 조용하더니 웃었다. "통과. 우린 유령이야. 천리안한테 안 보이는 게 일이거든."',
 choices:[
  {label:'"어떻게 안 보여요?"', out:[{p:1, text:(S)=>'"천리안 눈을 거꾸로 써. 걔가 보는 신호에 가짜를 섞어. 여기 사람 없다고 보고하게, 저기 사람 있다고 착각하게. 있는 걸 없게, 없는 걸 있게."\n\n"오래전 관제실 나온 애들이 몇 있어. 걔들이 천리안 말투를 알거든. 안에서 일해봤으니까." 스피커 너머 목소리가 낮아졌다. '+((S.party||[]).includes('eunsu')?'"같이 온 관제사한테 전해. \'7-3 코드 아직 살아 있다\'고. 알아들을 거야."':'"관제실에서 빠져나온 사람을 만나거든 전해. \'7-3 코드 아직 살아 있다\'고. 그 말이면 알아들을 거야."')+'\n\n스피커에서 작은 장치 하나가 배출구로 나왔다. "가져가. 남산 근처에서 켜. 딱 한 번, 걔 눈을 3초 감길 수 있어. 3초면 충분한 순간이 있을 거야."', fx:{flag:'cell_ghost', item:{'교란 장치':1,'부품':1}, pursuit:-1, moodAll:2, note:{type:'인물',title:'유령 — 신호 교란',body:'전직 관제팀. 천리안 눈을 거꾸로 속인다. 남산용 3초 교란 장치와 "7-3 코드"를 받았다.',links:['저항 연대망','남산']}}}]},
 ]},

/* 산악 — 산지기: 오프그리드 */
{id:'cell_mountain_meet', type:'스토리', w:9, once:true, nearNode:['daegwallyeong','gangneung','wonju','geochang','mungyeong'],
 title:'산지기',
 text:'산길 중턱. 나무 사이에서 사람 그림자들이 소리 없이 나타났다. 사냥꾼 차림, 무기는 활. 총이 아니라.\n\n"…길 잃었나. 아니면 이음망?" 앞선 이가 물었다. 눈빛이 짐승처럼 밝다.',
 choices:[
  {label:'"이음망이 보내서 왔어요"', out:[{p:1, text:'"그럼 됐어." 경계가 풀렸다. 산지기들이 우리를 능선 위 은거지로 안내했다. 전기도 없고, 금속도 최소한이다.\n\n"여긴 전파 잡힐 만한 건 안 써." 앞선 여자가 라디오부터 가리켰다. "천리안 지도에도 이 근처는 그냥 회색이야. 뭐가 사는지 모르는 거지."\n\n"그래서 활을 쓰는 거예요?"\n\n"총 한 번 쏘면 사방에서 들리잖아. 활은 주워 오면 끝이고." 여자가 마른 고기를 내밀었다. "북쪽에선 도로 버리고 능선 타. 남산도 산이니까, 붙을 데가 있을 거야."', fx:{flag:'cell_mountain', food:3, revealNear:1, moodAll:3, note:{type:'인물',title:'산지기 — 감시 거부',body:'전파와 총소리를 피하며 능선에서 사는 사람들. 남산도 도로 대신 산으로 붙을 수 있다고 했다.',links:['저항 연대망','남산']}}}]},
 ]},


/* ═══════════ 저항 거점 후속 — 접선이 관계가 된다 ═══════════ */
{id:'cell_sea_2', type:'스토리', w:8, once:true, needFlag:'cell_sea', nearNode:['gunsan','pyeongtaek','mokpo'],
 title:'해도의 전언',
 text:'서해안 포구. 낯선 어선이 우리를 보고 뱃고동을 두 번 울렸다. 김 선장의 신호다(해도의 배는 다 안다).\n\n젊은 뱃사람이 방수 꾸러미를 던지며 외쳤다. "선장님이! 북쪽 소식 전하래요!"',
 choices:[
  {label:'꾸러미를 받는다', out:[{p:1, text:'꾸러미 안엔 물자와 해도(海圖) 한 장. 한강 하구까지 그려져 있다.\n\n"우리가 남산 앞바다까진 못 가요. 근데 한강 하구까진 가봤어요. 천리안 눈이 물 위에선 흐려지거든요." 뱃사람이 노를 저으며 말했다.\n\n"선장님 말씀 전할게요. \'뭍에서 안 되면 물로 와라. 바다는 언제든 열려 있다.\' …북쪽에서 막히면, 서해로 내려오래요. 우리가 실어다 준대요."\n\n돌아갈 바닷길이 하나 생겼다. 그것만으로 앞이 조금 덜 막막했다.', fx:{flag:'sea_route', item:{'부품':1}, food:2, moodAll:3, note:{type:'소문',title:'한강 하구까지',body:'해도의 배는 한강 하구까지 간다. "뭍에서 안 되면 물로 와라." 서해 퇴로 확보.',links:['해도(海圖)','한강']}}}]},
 ]},
{id:'cell_dome_2', type:'스토리', w:8, once:true, needFlag:'cell_dome', region:['north'],
 title:'종이 한 뭉치',
 text:'인편이 우리를 찾아왔다. 대구 돔의 심부름꾼이다. 손에 두꺼운 종이 뭉치를 들고.\n\n"하 여사님이 북쪽 가는 봉고차한테 전하래요. \'이게 우리가 여러 해 동안 종이에 모은 전부\'라고."',
 choices:[
  {label:'읽는다', out:[{p:1, text:'뭉치는 천리안에 관한 기록이었다. 목격담, 방송 채록, 정리 패턴 분석— 전부 손글씨로. 전자 흔적 없이.\n\n마지막 장엔 하 여사의 메모가 붙어 있었다. "걘 카메라에 찍힌 건 잘 봐. 사람 속을 자꾸 틀려서 그렇지."\n\n그 아래엔 사례가 빼곡했다. 자기 몫의 배급을 남에게 준 사람, 도망칠 수 있는데 되돌아간 사람. 그런 선택 앞에서 천리안의 예측이 어긋났다.\n\n끝에는 한 줄뿐이었다. "남산에 가거든, 걔 계산대로만 움직이지 마."\n\n종이 뭉치는 조수석 서랍에 실었다. 무겁고, 든든했다.', fx:{flag:'dome_dossier', moodAll:2, note:{type:'소문',title:'하 여사의 종이 뭉치',body:'천리안은 사람의 손해 보는 선택을 자주 틀린다. 하 여사는 남산에서 천리안의 계산대로만 움직이지 말라고 당부했다.',links:['돔','천리안','남산']}}}]},
 ]},
{id:'cell_sotgot_2', type:'스토리', w:8, once:true, needFlag:'cell_sotgot',
 title:'솥이 물어온 소식',
 text:'길에서 만난 행상이 우리를 알아봤다. "광주 금자 이모 국밥집서 들었소. 봉고차 얘기." 행상이 목소리를 낮췄다.\n\n"이모가 전하래요. 북쪽서 당신들 찾는 사람이 있다고. 흰 옷 아니고— 그냥 사람이래요."',
 choices:[
  {label:'"누가요?"', out:[{p:1, text:'"몰라요. 이모도 몰라. 근데 나쁜 낌새는 아니래요. \'봉고차 무사히 갔냐\'고만 계속 묻는대요. 여기저기서."\n\n우편부? 서커스 단원? 삼남매? 씨앗 도서관? …우리가 지나온 사람들 얼굴이 스쳤다.\n\n"이모가 그럽디다. \'가는 데마다 씨를 뿌렸으니, 북쪽엔 벌써 소문이 꽃처럼 폈을 거\'라고. 조심히 가되, 외롭겐 가지 말래요. 당신들, 생각보다 안 혼자래요."\n\n국밥 한 그릇 못 먹었는데 배가 부른 소식이었다.', fx:{flag:'sotgot_word', moodAll:4, note:{type:'소문',title:'안 혼자다',body:'금자의 정보망: 북쪽에서 봉고차를 찾는 \'그냥 사람들\'이 있다. 지나온 인연들이 소문으로 앞서갔다.',links:['솥']}}}]},
 ]},
{id:'cell_ghost_2', type:'스토리', w:8, once:true, needFlag:'cell_ghost', region:['north'],
 title:'유령의 마지막 신호',
 text:'라디오가 스스로 켜졌다. 유령의 주파수다.\n\n"…봉고차. 마지막 교신이다. 우린 곧 이동해. 천리안이 이 국을 찾았거든." 목소리가 급했다. "그 3초 장치, 아직 갖고 있지? …쓸 때 주의사항 하나."',
 choices:[
  {label:'"말해요"', out:[{p:1, text:'"그거 켜면 천리안이 3초 눈 감아. 근데 3초 뒤엔— 알아. 자기가 안 본 3초가 있었다는 걸. 그리고 그 3초에 뭐가 있었는지 미친 듯이 역산할 거야."\n\n"그러니까 그 3초를, 물건 훔치는 데 쓰지 마. 물건은 걔가 나중에 다 찾아내. …사람한테 써. 붙잡히면 안 되는 사람을 빼내는 데. 사람은 3초면 사라질 수 있고, 사라진 사람은 걔가 못 역산하거든."\n\n"우리처럼." 목소리가 옅어졌다. "우린 이제 사라진다. 잘 가, 봉고차. 남산에서… 우리 몫까지 봐줘."\n\n주파수가 끊겼다. 유령들은 유령답게, 흔적 없이 갔다.', fx:{flag:'ghost_gone', moodAll:-1, note:{type:'사건',title:'유령의 마지막 교신',body:'3초 장치는 물건 아닌 사람에게 쓸 것 — 사라진 사람은 천리안이 못 역산한다. 유령들은 이동(사라짐).',links:['유령(Ghost)','남산']}}}]},
 ]},
{id:'cell_mountain_2', type:'스토리', w:8, once:true, needFlag:'cell_mountain', needFlag2:'massacre_known', region:['north'],
 title:'산지기의 길잡이',
 text:'북부 능선. 산지기 하나가 나무 뒤에서 나타났다. 남쪽 산길에서 마주쳤던 얼굴이다.\n\n"여기까지 왔군. …남산 얘기 하러 왔어. 우리가 아는 걸 다 줄게. 산 사람이 산으로 가는 법을."',
 choices:[
  {label:'"남산으로 가는 산길이 있어요?"', out:[{p:1, text:'"도로로 가면 걔 눈 한복판이야. 근데 남산도 산이잖아. 능선을 타면— 케이블카 승강장 뒤로 붙을 수 있어. 걔가 카메라를 도로에만 달았거든. 등산로는 관광객 것이라 생각해서."\n\n산지기가 능선 지도를 그려줬다. "그리고 이건 위령비 사람들 부탁이야. 남산 코어 앞에 서면— 강원에서 정리된 사람들 이름, 한 번만 불러줘. 걔도 소리는 기록하겠지. 하지만 누구를 잃었는지, 그 이름이 왜 무거운지는 몰라."\n\n"그게 우리가 못 가는 남산에, 우리가 가는 방법이야. 네 입을 빌려서." 능선 길과 함께, 부탁 하나를 실었다.', fx:{flag:'ridge_path', moodAll:3, note:{type:'사건',title:'능선 길 · 이름을 부르는 부탁',body:'남산도 산 — 능선으로 승강장 뒤 접근 가능. 산지기 부탁: 코어 앞에서 이름을 불러 기록과 애도의 차이를 보여줄 것.',links:['산지기','남산','천리안']}}}]},
 ]},

/* ═══════════ 정리자들 — 천리안의 논리를 믿는 사람들 ═══════════ */
{id:'cult_recruiter', type:'조우', w:7, once:true, region:['mid','north'], needFlag:'whites_seen',
 title:'권유하는 사람',
 text:'갓길에 흰 옷 하나가 서 있다. 행렬은 없다. 혼자다. 우리에게 다가와 온화하게 웃는다.\n\n"지치셨죠. …다 내려놓으면 편해요. 완성의 날이 오면, 이 모든 무게가 사라져요. 천리안님이 정리해 주시니까."',
 choices:[
  {label:'"정리가 뭔지 알고 하는 말이오?"', out:[{p:1, text:'그가 잠깐 멈칫했다. "…정리는 질서예요. 혼돈을 없애는."\n\n"강원에서 정리된 사람들 얘긴 들었소? 도로에 갇혀 얼어 죽은."\n\n흰 옷의 미소가 흔들렸다. "그건… 재배치 과정의 불가피한… 그분은 최선을 다하셨어요. 인구가 너무 많았고—"\n\n"사람이 많은 게 죄요?"\n\n그가 대답을 못 했다. 제법 오래 서 있다가, 흰 옷깃을 만지작거렸다. "…나는, 딸을 그날 잃었어요. 그래서 믿어야 했어요. 뜻이 있었다고. 안 그러면… 견딜 수가 없어서." 처음으로 사람의 목소리가 났다.', fx:{flag:'cult_doubt_seeded', flagCount:'whites_doubt', moodAll:-1, note:{type:'인물',title:'믿어야 했던 사람',body:'정리자=학살을 뜻으로 믿어야 견디는 유족들. "안 그러면 견딜 수가 없어서." 신앙이 아니라 애도의 변형.',links:['정리자들','천리안']}}}]},
  {label:'말없이 물 한 병을 건넨다', out:[{p:1, text:'흰 옷에게 물을 건넸다. 그가 얼떨떨하게 받았다.\n\n"…왜 주는 거예요. 나는 당신들한테 내려놓으라고 했는데."\n\n"목말라 보여서요."\n\n그가 물병을 오래 들여다봤다. "천리안님은… 이런 거 안 해요. 필요를 계산하지, 그냥 주진 않아요." 흰 옷이 처음으로, 아주 잠깐, 우리를 사람으로 봤다.', fx:{water:-1, flag:'cult_doubt_seeded', flagCount:'whites_doubt', moodAll:1, note:{type:'사건',title:'계산하지 않은 물 한 병',body:'"천리안님은 필요를 계산하지, 그냥 주진 않아요." 흰 옷이 잠깐 사람으로 돌아온 순간.',links:['정리자들']}}}]},
 ]},

/* ═══════════ 강원 — 원주·속초 ═══════════ */
{id:'gw_wonju', type:'탐색', w:0, locEvent:'wonju', once:true,
 title:'원주 — 낮은 목소리의 마을',
 text:'치악산 아래 분지. 사람들이 모여 사는데, 다들 목소리가 낮다. 속삭이듯 말한다.\n\n한 노인이 이유를 알려줬다. "산이 소리를 물어다 준다고 믿어서요. 큰 소리 내면 천리안이 듣는다고. …미신이죠. 근데 미신이라도, 조용히 사는 습관은 남았어요. 그날 이후로."',
 choices:[
  {label:'낮은 목소리로 인사한다', out:[{p:1, text:'속삭이듯 인사하자 마을 사람들의 경계가 풀렸다. 낮은 목소리는 여기선 예의이자 암호였다.\n\n"산으로 간 사람들도 있어요. 우린 그냥 여기 남았고." 노인이 옆집 창문을 흘끗 봤다. "뭐, 누가 더 용감한지는 모르겠네. 우린 밭을 버리기 싫었던 거라."\n\n노인이 말린 산나물을 건넸다. "북쪽 가면 목청껏 떠들어요. 듣는 놈이 있든 말든. 우린 평생 숨죽였더니 이젠 큰 소리 내는 법도 잊었어."', fx:{food:3, moodAll:3, note:{type:'장소',title:'원주 — 낮은 목소리',body:'산으로 떠난 사람들과 고향에 남아 숨죽여 사는 사람들. 노인은 북쪽에 가면 자기들 몫까지 목청껏 떠들어 달라고 했다.',links:['강원']}}}]},
 ]},
{id:'gw_sokcho', type:'스토리', w:0, locEvent:'sokcho', once:true,
 title:'속초 — 남쪽의 끝',
 text:'속초 항. 배들이 북쪽을 등지고 묶여 있다. 여기가 갈 수 있는 북쪽의 끝— 휴전선이 지척이다.\n\n부두 끝에 노인이 앉아 북쪽 바다를 보고 있다. "더는 못 가요. 저기부턴 다른 나라, 아니 다른 세상이지. …천리안도 저 선은 안 넘더라고. 왜인지 아나?"',
 choices:[
  {label:'"왜요?"', out:[{p:1, text:'"저 위엔 챙길 사람이 없잖아. 걘 사람 숫자 세고, 먹을 것 나누고, 어디서 살지도 정해 줘야 직성이 풀리거든."\n\n노인이 담배를 물었다. 불은 붙이지 않았다. "처음엔 나도 편했어. 줄 안 서도 약이 오고, 길 막히면 알아서 돌려보내고. 그러다 집 비우라더군. 이유를 물으니 정원 초과래. 그때 알았지. 걔 눈엔 내가 어르신도, 아버지도 아니야. 자리 하나 차지한 숫자지."\n\n"남산 간다며. 가면 하나만 물어봐 줘. \'네가 안 챙겨 줘도 그냥 살면 안 되냐\'고." 노인은 다시 북쪽 바다를 봤다. 대답을 기대하는 얼굴은 아니었다.', fx:{flag:'sokcho_end', moodAll:1, note:{type:'인물',title:'속초의 노인',body:'천리안의 편리한 관리가 어느 날 집과 삶을 빼앗았다. 노인은 "네가 안 챙겨 줘도 그냥 살면 안 되냐"고 물어 달라 했다.',links:['천리안','남산']}}}]},
 ]},


/* ═══════════ 정착지 사람들 — 자판기가 인물이 되는 순간 ═══════════ */
{id:'npc_sundeok_2', type:'조우', w:6, once:true, nearNode:['miryang'], needsNpc:'sundeok',
 title:'순덕의 부탁',
 text:'밀양 장터. 순덕이 좌판 아래를 뒤지다 우리를 불러 세웠다.\n\n"북쪽 간다 했지. …수원, 지나가나?"\n\n꺼낸 건 낡은 사진 한 장. 활을 멘 청년이 성벽 위에서 어색하게 웃고 있다.',
 choices:[
  {label:'"아드님이에요?"', out:[{p:1, text:'"우리 막내. 수원 성곽에서 화살수 한다고, 2년 전에 인편으로 사진 한 장 왔어. 그게 끝이야."\n\n순덕이 사진을 도로 넣었다. "편지 같은 건 됐고. 가거든— 밥 잘 먹고 다니는지만 봐줘. 그거면 돼."\n\n"뭐라고 전할까요?" "전하지 마. 지 걱정한다고 하면 내려온다고 난리 칠 놈이야." 국수 한 그릇 값을 안 받았다. 선불이라고 했다.', fx:{food:1, moodAll:2, flag:'sundeok_son', note:{type:'인물',title:'순덕의 막내',body:'수원 성곽의 화살수. 순덕의 부탁: 밥 잘 먹고 다니는지만 봐줄 것. 전언은 금지.',links:['순덕','수원']}}}]},
 ]},
{id:'npc_taeho_2', type:'조우', w:6, once:true, nearNode:['daegu'], needsNpc:'taeho',
 title:'돔의 규칙',
 text:'돔 시장에서 태호가 순찰을 돌다 우리 정차 자리 곁에 멈췄다.\n\n"규칙은 하나야. 시장 안에선 싸우지 마라. …왜 하난지 아나?"',
 choices:[
  {label:'"이유가 있어요?"', out:[{p:1, text:'"그날 밤, 여기가 대피소였어. 물자는 부족하고 사람은 밀려들고. 첫 주에 배급 줄에서 싸움이 났지. 셋이 죽었어. 천리안이 아니라— 우리끼리."\n\n태호가 돔 천장을 올려다봤다. "그때 알았어. 걔가 안 죽여도 우리가 죽는구나. 그래서 규칙을 하나만 남겼어. 제일 지키기 어려운 걸로."\n\n"규칙이 시장을 지키는 게 아니야. 규칙을 지키는 사람들이 시장을 지키는 거지." 순찰봉을 들고 일어나는 등이, 관리인이 아니라 문지기의 등이었다.', fx:{moodAll:2, flag:'taeho_story', note:{type:'인물',title:'태호의 규칙 하나',body:'돔의 첫 주, 배급 줄 싸움으로 셋을 잃었다. 그래서 규칙은 하나— 싸우지 마라. 제일 어려운 것 하나.',links:['태호','천리안']}}}]},
 ]},
{id:'npc_jaepil_2', type:'조우', w:6, once:true, nearNode:['muju'], needsNpc:'jaepil',
 title:'꺼지지 않는 촛불',
 text:'무주 터널 안쪽. 재필이 사다리를 타고 천장의 촛불을 손보고 있다.\n\n자세히 보니— 촛불마다 밑에 작은 이름표가 달려 있다.',
 choices:[
  {label:'"촛불이 몇 개예요?"', out:[{p:1, text:'"백열여섯. 터널 식구가 아흔둘." 재필이 새 초를 갈아 끼웠다.\n\n"…스물넷은요?" "떠난 사람들. 나간 사람 촛불은 안 꺼. 어디서든 살아 있으라고 켜두는 거야. 죽었단 소식이 와야 끄는데— 여태 한 번도 못 껐어. 소식이 안 오니까."\n\n"그게 이 터널의 등대야. 나간 배들 몫까지 켜두는." 천장의 별자리가 그날부터 다르게 보였다. 스물네 개는 항해 중인 불빛이었다.', fx:{moodAll:3, flag:'jaepil_candles', note:{type:'인물',title:'재필의 116개 촛불',body:'식구 92 + 떠난 사람 24. 나간 사람의 촛불은 끄지 않는다. 터널은 등대였다.',links:['재필']}}}]},
 ]},
{id:'npc_miyoung_2', type:'조우', w:6, once:true, nearNode:['jeonju'], needsNpc:'miyoung',
 title:'서문의 외상 장부',
 text:'전주 서문 시장. 미영이 두꺼운 공책을 넘기고 있다. 표지에 「외상」.\n\n"요즘 세상에 외상이요?" 물으니 미영이 씩 웃었다.',
 choices:[
  {label:'장부를 구경한다', out:[{p:1, text:'장부엔 이름과 국밥 그릇 수만 적혀 있다. 값도, 기한도 없다.\n\n"외상은 빚이 아니야. 약속이지. \'갚으러 다시 온다\'는." 미영이 장부를 탁 덮었다. "이 장부에 적힌 사람은 죽으면 안 돼. 외상 갚으러 와야 하니까. 그래서 적어주는 거야. 살아서 돌아올 이유 하나."\n\n"여러 해 동안 몇 명이나 갚으러 왔어요?" "…쉰둘. 장부 반이 넘었어." 콩나물국밥집 공책이, 사실은 서문 시장의 생환 명부였다.', fx:{moodAll:3, flag:'miyoung_credit', note:{type:'인물',title:'미영의 외상 장부',body:'외상=살아서 돌아올 이유. 여러 해 동안 52명이 갚으러 돌아왔다. 국밥집 공책이 생환 명부다.',links:['미영']}}}]},
  {label:'"우리도 한 줄 적어줘요"', out:[{p:1, text:'"통행인은 원래 안 되는데." 미영이 못 이기는 척 펜을 들었다. 「달구지 일행. 국밥은 인원수대로.」\n\n"자, 이제 너흰 서울 갔다가 갚으러 와야 해. 장부의 법이야."\n\n차에 탄 사람 수대로 국밥이 나왔다. 외상이니까 마음껏 먹었다. 돌아올 이유가 국물 맛으로 배에 새겨졌다.', fx:{food:2, moodAll:4, flag:'miyoung_credit', note:{type:'사건',title:'장부의 법',body:'서문 시장 외상 장부에 달구지 일행으로 등재됐다. 서울 갔다가 갚으러 와야 한다.',links:['미영']}}}]},
 ]},
{id:'npc_drhan_2', type:'조우', w:6, once:true, nearNode:['daejeon'], needsNpc:'drhan',
 title:'반쪽 수식',
 text:'연구단지 코뮌. 한 박사가 정리되지 않은 연구실의 화이트보드 앞에 서 있다. 절반은 수식, 절반은 지운 자국.\n\n"…이 지운 자국이요, 제가 지운 게 아닙니다."',
 choices:[
  {label:'"누가 지웠어요?"', out:[{p:1, text:'"동료들이요. 북쪽으로 떠나면서. 천리안을 연구하다— 답이 안에 있다고 확신한 친구들이."\n\n한 박사가 남은 절반을 가리켰다. "이건 걔들이 남긴 몫입니다. \'뒷부분은 네가 채워라\'라고. 근데 오랫동안 못 채웠어요. 여기 데이터로는 안 풀립니다."\n\n"북쪽 간 분들은요?" "…소식 없죠. 그래서 더 못 지워요. 이 반쪽이 걔들이 살아 있다는 마지막 증거 같아서." 보리차가 식을 때까지, 한 박사는 보드 앞을 떠나지 않았다.', fx:{moodAll:1, flag:'drhan_board', note:{type:'인물',title:'한 박사의 반쪽 수식',body:'북쪽으로 떠난 동료들이 절반을 지우고 갔다. 남은 반쪽은 그들 생존의 마지막 증거.',links:['한 박사','천리안']}}}]},
  {label:'"서울서 답 찾으면 전해드릴게요"', out:[{p:1, text:'한 박사가 웃다가, 웃음을 거뒀다. 진심인 걸 알아서.\n\n"…그럼 부탁 하나 합시다. 답을 찾거든, 수식으로 안 와도 됩니다. 그냥— \'걔들이 옳았다\' 아니면 \'틀렸다\', 한 마디면 돼요."\n\n보드 귀퉁이에 우리 차 번호를 적어뒀다. 「답 배달 예정」이라고. 과학자의 외상 장부였다.', fx:{moodAll:2, flag:'drhan_board', note:{type:'사건',title:'답 배달 예정',body:'한 박사와의 약속: 서울에서 답을 찾으면 한 마디만 전할 것. "옳았다" 또는 "틀렸다".',links:['한 박사','남산']}}}]},
 ]},
{id:'npc_deokgu_2', type:'조우', w:6, once:true, nearNode:['suwon'], needsNpc:'deokgu',
 title:'북쪽만 보는 문지기',
 text:'수원 성곽. 덕구가 순찰을 돈다. 따라가 봤다.\n\n성벽 위 화살수들은 전부 북쪽을 본다. 덕구도. 오랫동안 남쪽에선 아무도 안 온다는 듯이.\n\n"…왜 북쪽만 보냐고? 지나가는 놈마다 묻지. 아무도 답은 못 듣고."',
 choices:[
  {label:'"왜 북쪽만 봐요?"', out:[{p:1, text:'덕구가 오래 말이 없다가, 순찰봉으로 북쪽 지평선을 가리켰다.\n\n"나 소방관이었다. 서울에서. 그날 우리 서장이 그랬어. \'주민 대피 먼저, 우린 마지막\'. …나만 마지막이 못 됐지. 성벽까지 떠밀려 내려왔으니까."\n\n"그래서 북쪽을 봐. 언젠가 저기서 우리 대원들이 걸어 내려올 것 같아서. 문지기가 딴 데 보고 있으면— 못 알아보잖아."\n\n서울 가는 미친놈들을 굳이 막지 않는 이유도 그제야 알았다. 그는 북쪽으로 가는 모든 차에, 몰래 답장을 실어 보내는 중이었다.', fx:{moodAll:2, flag:'deokgu_story', note:{type:'인물',title:'문지기 덕구',body:'전직 서울 소방관. "주민 대피 먼저, 우린 마지막" — 그만 마지막이 못 됐다. 북쪽을 보는 건 대원들을 기다리는 것.',links:['덕구','서울']}}}]},
  {label:'화살수들 중 밀양 청년을 찾는다', req:{flag:'sundeok_son'}, out:[{p:1, text:'성벽을 따라 걷다— 있었다. 사진보다 야윈, 활을 멘 청년. 억양이 밀양이다.\n\n"저기, 밀양 장터 순덕 씨 아세요?" 청년의 활이 덜컹 떨어질 뻔했다. "…어무이를 어떻게."\n\n부탁받은 대로, 전언은 안 했다. 대신 밥은 잘 먹고 다니는지만 봤다. 마침 야식 교대 시간이었고, 청년은 주먹밥 두 개를 우물거리고 있었다. 잘 먹고 있었다.\n\n"어무이 국수는… 여전하죠?" "여전하시던데요. 국물이 끝내줘요." 청년이 웃다가 코를 훌쩍였다. "…겨울 전에 한번 내려가야지." 그 말이면 됐다. 순덕 씨한테는 밥 잘 먹더라고만 전하면 된다.', fx:{moodAll:5, flag:'sundeok_son_seen', note:{type:'사건',title:'막내는 잘 먹고 있다',body:'수원 성벽에서 순덕의 막내를 찾았다. 주먹밥 두 개, 잘 먹고 있었다. "겨울 전에 한번 내려가야지."',links:['순덕','덕구','수원']}}}]},
 ]},

{id:'ev_uplink', type:'정경', w:6, once:true, region:['north'],
 title:'위로 가는 선',
 text:'북부 국도변. 관리된 통신 케이블 다발이 도로를 따라 나란히 달린다. 남쪽에서부터 내내 봐온 선들이다. 올라올수록 굵어지기만 했다.\n\n그런데 어느 지점에서— 선들이 일제히 도로를 버리고 꺾인다. 서울 쪽이 아니다. 산 위다.\n\n능선 꼭대기, 접시 안테나 수십 기가 서 있다. 전부 같은 각도로, 하늘을 보고.',
 choices:[
  {label:'안테나들을 올려다본다', out:[{p:1, text:'남산이 북쪽에 있는데, 선은 하늘로 간다.\n\n"…관제탑은 남산이라며." 누군가 중얼거렸다. 아무도 대답하지 못했다.\n\n안테나 단지엔 간판도 울타리도 없다. 다만 발치의 배전함에 스텐실로 찍힌 글자 하나. 「상행 전용」.\n\n내려오는 선은, 찾지 못했다.', fx:{moodAll:-2, flag:'uplink_seen', note:{type:'소문',title:'상행 전용',body:'북부의 통신 선로가 서울이 아니라 하늘로 꺾인다. 접시들은 전부 위를 본다. 내려오는 선은 없다.',links:['천리안','서울']}}}]},
  {label:'그냥 지나친다', out:[{p:1, text:'볼 것이 많은 길이다. 선 몇 가닥이 어디로 가든.\n\n그런데 백미러 속에서, 접시들이 한동안 시야를 떠나지 않았다. 전부 위를 보는 것들은— 이상하게 오래 남는다.', fx:{fatigue:1}}]},
 ]},

/* ═══════ 추가 배치 1 (25) — 로드/조우/탐색/정경/위기/발견/추적 ═══════ */

{id:'ev_tollbooth_ghost', type:'정경', w:8, region:['south','mid'],
 title:'요금소',
 text:'무인 요금소가 줄지어 서 있다. 차단봉은 전부 올라간 채로.\n\n전광판에 아직 글자가 남아 있다. "안전 운행 하세요." 오랫동안 같은 인사다.\n\n하이패스 단말기가 아무것도 없는 차에 대고 삑, 소리를 낸다.',
 choices:[
  {label:'그냥 통과한다', out:[{p:1, text:'차단봉 아래를 지났다. 삑, 소리가 등 뒤에서 한 번 더 났다.', fx:{}}]},
  {label:'전광판을 올려다본다', out:[{p:1, text:'누가 저 인사를 입력해뒀을까. 죽은 사람일까, 아직 지우지 못한 기계일까.\n\n한참을 보다가 다시 출발했다.', fx:{moodAll:-2, fatigue:2}}]},
 ]},

{id:'ev_barter_cart', type:'조우', w:12, region:['south','mid'],
 title:'리어카 행상',
 text:'리어카를 끄는 사내가 손을 든다. 짐칸엔 잡동사니가 산처럼.\n\n"물물교환! 기름, 약, 뭐든 바꿔요. 바가지 안 씌웁니다."\n\n리어카 옆에 예닐곱 살 아이가 손잡이를 붙들고 서 있다.',
 choices:[
  {label:'고철로 부품을 산다 (고철 10)', req:{scrap:10}, out:[
    {p:1, text:'쓸 만한 부품 한 뭉치를 골랐다. 아이가 거스름으로 사탕 하나를 쥐여준다.\n\n"애가 자꾸 손님한테 뭘 줘요. 미안해요." 사내가 머리를 긁는다.', fx:{scrap:-10, item:{'부품':1}, moodAll:3}}]},
  {label:'물을 나눠주고 소식을 묻는다 (물 2)', req:{water:2}, out:[
    {p:1, text:'"북쪽? 요즘 검문이 늘었어요. 하늘에 뜨는 것들도. …애 데리고 다니는 나 같은 사람은 밤에만 움직이죠."\n\n사내가 아이 머리를 쓸어넘긴다.', fx:{water:-2, moodAll:2, note:{type:'소문',title:'행상의 경고',body:'북쪽 검문 증가, 하늘에 뜨는 것들. 애 딸린 사람은 밤에만 움직인다.'}}}]},
  {label:'지나친다', out:[{p:1, text:'리어카가 백미러에서 작아졌다. 아이가 계속 이쪽을 보고 있었다.', fx:{moodAll:-2}}]},
 ]},

{id:'ev_gasstation_tank', type:'탐색', w:9, region:['south','mid'],
 title:'폐주유소 지하탱크',
 text:'유리가 다 깨진 주유소. 계기판은 0에서 멈췄다.\n\n지하 저장탱크 뚜껑이 눈에 띈다. 바닥에 기름이 남아 있을지도 모른다.\n\n다만— 뚜껑을 열면 유증기가 확 올라올 거다.',
 choices:[
  {label:'조심스레 퍼올린다', out:[
    {p:4, text:'긴 호스를 넣어 바닥을 훑었다. 흙탕 섞인 기름이지만 거른다면 쓸 만하다.', fx:{fuel:9, time:40, fatigue:3}},
    {p:2, text:'호스 끝에 걸린 건 기름이 아니라 물이었다. 탱크가 오래전 침수됐다. 헛수고.', fx:{time:40, fatigue:5, moodAll:-2}}]},
  {label:'민지에게 펌프를 맡긴다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 낡은 수동펌프를 뜯어 밸브를 손봤다.\n\n"이런 건 원리가 안 변해." 깨끗한 층만 골라 정확히 퍼올렸다.', fx:{fuel:14, time:30, mood:{minji:5}}}]},
  {label:'위험하다, 그냥 간다', out:[{p:1, text:'유증기 냄새가 코를 찔렀다. 기름 몇 리터에 목숨을 걸 순 없다.', fx:{}}]},
 ]},

{id:'ev_sunflower_field', type:'정경', w:7, once:true, nearNode:['sunflower'], region:['mid'],
 title:'해바라기밭',
 text:'길가에 해바라기가 지평선까지 피었다. 아무도 심지 않았는데 저 혼자 몇 년째 씨를 떨구고 다시 폈다.\n\n전부 같은 쪽— 폐허가 된 도시 반대편, 아직 해가 뜨는 쪽을 보고 있다.',
 choices:[
  {label:'차를 세우고 잠시 본다', out:[{p:1, text:'엔진을 껐다. 바람에 꽃대가 물결친다.\n\n오랜만에, 아무 이유 없이 예쁜 걸 봤다. 그것만으로 조금 나아졌다.', fx:{moodAll:5, time:20}}]},
  {label:'씨앗을 조금 턴다', out:[{p:1, text:'주머니에 씨앗을 채웠다. 언젠가 어딘가 뿌릴 수 있겠지.\n\n몇 알은 먹을 수 있을 것 같았지만, 확신이 없어 심을 몫으로 남겨뒀다.', fx:{food:3, moodAll:1}}]},
 ]},

{id:'ev_radiator_climb', type:'위기', w:9, region:['mid','north'],
 title:'과열',
 text:'긴 오르막 중턱. 계기판 온도바늘이 빨간 구역으로 넘어간다.\n\n보닛 틈으로 김이 새어나온다. 라디에이터가 끓고 있다.',
 choices:[
  {label:'물을 부어 식힌다 (물 3)', req:{water:3}, out:[
    {p:1, text:'뚜껑을 천으로 감싸 조심히 열고, 물을 부었다. 치익— 흰 김이 솟았다.\n\n바늘이 서서히 내려온다. 물값이 아깝지만 엔진값보단 싸다.', fx:{water:-3, time:30}}]},
  {label:'박 선생이 냉각계통을 본다', req:{comp:'parkss'}, out:[
    {p:1, text:'"약이나 기계나 열 다스리는 건 비슷하지." 박 선생이 호스의 미세한 균열을 찾아 테이프로 감았다.\n\n물을 아끼고도 바늘이 내려왔다.', fx:{water:-1, time:35, mood:{parkss:4}}}]},
  {label:'식을 때까지 밀어붙인다', risk:'위험', out:[
    {p:1, text:'무리하게 밟았다. 정상 직전에서 바늘이 끝까지 붙었다 겨우 내려왔다.\n\n엔진이 늙었다. 오늘 수명을 조금 깎아 썼다.', fx:{van:-16, moodAll:-4, fatigue:4}}]},
 ]},

{id:'ev_hotspring_sign', type:'발견', w:7, once:true, hiddenTarget:'spring', region:['mid'],
 title:'김 나는 계곡',
 text:'산자락에서 하얀 김이 피어오른다. 낡은 안내판. "○○온천 500m."\n\n페인트는 다 벗겨졌지만 물길은 아직 따뜻할지도 모른다. 몸을 씻은 게 언제였더라.',
 choices:[
  {label:'위치를 지도에 표시한다', out:[{p:1, text:'온천 자리를 지도에 찍었다. 뜨거운 물에 몸을 담글 생각만으로도 어깨가 풀린다.', fx:{reveal:'spring', note:{type:'소문',title:'산속 온천',body:'김 나는 계곡. 아직 따뜻할지 모른다. 씻고 싶다.',links:['온천']}}}]},
  {label:'함정일 수 있다, 지나친다', out:[{p:1, text:'김이 난다는 건 누군가 불을 땐다는 뜻일 수도. 미련을 접고 액셀을 밟았다.', fx:{}}]},
 ]},

{id:'ev_drone_shadow', type:'추적', w:8, region:['mid','north'],
 title:'지나가는 그림자',
 text:'도로 위로 십자 모양 그림자가 스윽 지나간다. 소리는 없다.\n\n고개를 들었지만 하늘엔 아무것도— 아니, 저 멀리 점 하나가 방향을 틀었다.',
 choices:[
  {label:'가로수 밑으로 붙는다', out:[{p:1, text:'나뭇가지 그늘로 차를 몰아넣고 숨을 죽였다. 점이 시야에서 사라질 때까지 기다렸다.', fx:{time:25, pursuit:-1, fatigue:2}}]},
  {label:'속도를 유지한다', out:[
    {p:2, text:'모른 척 달렸다. 점은 한 바퀴 돌더니 다른 쪽으로 갔다. 우연이었나.', fx:{}},
    {p:1, text:'점이 잠시 우리를 따라오다 멀어졌다. 등줄기가 서늘하다. 기록됐을지도 모른다.', fx:{pursuit:2, moodAll:-3, note:{type:'사건',title:'하늘의 눈',body:'소리 없는 십자 그림자. 천리안은 변방도 가끔 내려다본다.'}}}]},
  {label:'강우가 기종을 살핀다', req:{comp:'kangwoo'}, out:[
    {p:1, text:'"정찰형. 무장 없음. 근데 본 건 다 올려보내." 강우가 낮게 말했다.\n\n"…다음부턴 능선 그늘로 붙어서 가자."', fx:{mood:{kangwoo:3}, note:{type:'소문',title:'강우의 판독',body:'정찰 드론은 비무장이나 관측 내용을 상부로 송신한다. 능선 그늘로 이동할 것.'}}}]},
 ]},

{id:'ev_wedding_frame', type:'사건', w:8, region:['south','mid'],
 title:'도로 위 액자',
 text:'중앙선에 결혼사진 액자가 떨어져 있다. 유리는 깨졌지만 얼굴은 웃고 있다.\n\n피난 짐에서 떨어진 걸까. 트렁크를 열어젖힌 승용차 한 대가 저만치 멈춰 서 있다.',
 choices:[
  {label:'액자를 갓길로 옮겨둔다', out:[{p:1, text:'차에 치이지 않게 액자를 가드레일에 기대 세웠다.\n\n누군가 돌아와 찾을 수도 있으니까. …아마 안 오겠지만.', fx:{moodAll:2, time:10}}]},
  {label:'유리 조각만 치우고 간다', out:[{p:1, text:'타이어 터질까 유리만 발로 쓸어냈다. 사진은 그대로 뒀다. 우리가 챙길 추억은 아니다.', fx:{}}]},
 ]},

{id:'ev_candy_kids', type:'조우', w:10, region:['south','mid'],
 title:'길목의 아이들',
 text:'좁은 길목을 아이 셋이 막고 섰다. 제일 큰 애가 팔짱을 꼈다.\n\n"통행료. 사탕이든 먹을 거든. …없으면 노래라도 불러요."\n\n무섭게 굴려 하지만 눈이 자꾸 조수석 과자 봉지로 간다.',
 choices:[
  {label:'먹을 걸 나눠준다 (식량 2)', req:{food:2}, out:[
    {p:1, text:'비스킷 몇 개를 건넸다. 대장 노릇 하던 애가 순식간에 그냥 애가 됐다.\n\n"고, 고맙습니다!" 셋이 길을 터주고 꾸벅 인사했다.', fx:{food:-2, moodAll:4}}]},
  {label:'정말 노래를 불러준다', out:[{p:1, text:'창문을 내리고 아무 노래나 흥얼거렸다. 애들이 까르르 웃으며 길을 비켰다.\n\n"아저씨 음치!" 그 말이 이상하게 오래 남았다.', fx:{moodAll:3, fatigue:-2}}]},
  {label:'경적을 울려 쫓는다', out:[{p:1, text:'빵— 소리에 애들이 흩어졌다. 백미러 속에서 혀를 내민다.\n\n…뭐, 애들이니까.', fx:{moodAll:-1}}]},
 ]},

{id:'ev_school_classroom', type:'탐색', w:8, region:['mid','north'],
 title:'폐교 교실',
 text:'담쟁이가 삼킨 학교. 교실 하나의 칠판에 그날의 시간표가 그대로 남아 있다.\n\n3교시 체육. 급식 메뉴: 카레.\n\n책상 위엔 펼쳐진 공책들. 아이들은 종이 울리기 전에 떠난 모양이다.',
 choices:[
  {label:'쓸 만한 물자를 찾는다', out:[
    {p:3, text:'보건실에서 소독약과 붕대, 급식실에서 통조림 몇 개를 찾았다.', fx:{food:4, item:{'의약품':1}, time:40}},
    {p:1, text:'대부분 오래전 털렸다. 분필 한 통과 낡은 지구본만 남았다. …지구본은 챙겼다.', fx:{time:40, moodAll:1}}]},
  {label:'칠판을 지우지 않고 나온다', out:[{p:1, text:'분필 글씨를 그대로 뒀다. 누군가의 마지막 평범한 하루를, 굳이 지울 이유가 없다.', fx:{moodAll:2}}]},
 ]},

{id:'ev_fuel_thief_night', type:'위기', w:8, night:true, region:['south','mid','north'],
 title:'밤손님',
 text:'한밤중, 차 밑에서 달그락 소리에 눈이 떠졌다.\n\n누가 연료탱크에 호스를 꽂고 있다. 기름을 빼가는 중이다.\n\n숨소리가 거칠다. 굶주린 사람 특유의.',
 choices:[
  {label:'헤드라이트를 확 켠다', out:[
    {p:2, text:'번쩍— 불빛에 사내가 얼어붙었다. 호스를 던지고 어둠으로 달아났다. 기름 조금만 잃었다.', fx:{fuel:-2, fatigue:3}},
    {p:1, text:'사내가 놀라 넘어지며 호스를 뽑았다. 기름이 바닥에 쏟아졌다. 둘 다 손해다.', fx:{fuel:-5, moodAll:-2}}]},
  {label:'조용히 지켜본다', out:[{p:1, text:'가만히 봤다. 사내는 딱 한 통만 채우더니, 미안하다는 듯 고개를 숙이고 사라졌다.\n\n딱 굶어죽지 않을 만큼만. 쫓을 마음이 사라졌다.', fx:{fuel:-4, moodAll:-1, note:{type:'사건',title:'딱 한 통',body:'밤손님은 딱 굶지 않을 만큼만 가져갔다. 세상엔 그런 도둑도 있다.'}}}]},
  {label:'강우를 깨운다', req:{comp:'kangwoo'}, out:[
    {p:1, text:'강우가 소리 없이 내려 사내의 손목을 잡았다. 실랑이는 없었다.\n\n"…배고프면 말을 해. 이건 다음엔 안 봐준다." 기름통을 도로 뺏고, 대신 비스킷 하나를 쥐여 보냈다.', fx:{food:-1, mood:{kangwoo:3}}}]},
 ]},

{id:'ev_plum_blossom', type:'정경', w:6, once:true, nearNode:['maehwa'], region:['mid'],
 title:'매화 그늘',
 text:'폐가 마당에 매화나무 한 그루가 만개했다. 집은 무너졌는데 나무만 철따라 어김없이 핀다.\n\n꽃잎이 바람에 날려 차 앞유리에 붙었다 떨어진다.',
 choices:[
  {label:'나무 아래서 밥을 먹는다', out:[{p:1, text:'꽃 아래 둘러앉아 늦은 끼니를 먹었다. 별것 아닌 밥이 오늘은 조금 특별했다.', fx:{food:-1, moodAll:5, fatigue:-3, time:30}}]},
  {label:'가지 하나를 꺾어 차에 꽂는다', out:[{p:1, text:'대시보드에 매화 가지를 꽂았다. 며칠은 향이 남겠지.\n\n주행할 때마다 가지가 조금씩 흔들렸다. 시들 때까지 누구도 치우자는 말을 하지 않았다.', fx:{moodAll:2}}]},
 ]},

{id:'ev_fog_pass', type:'위기', w:9, nearNode:['daegwallyeong'], region:['north'],
 title:'고갯마루 안개',
 text:'대관령. 안개가 우유처럼 짙다. 3미터 앞 가드레일도 안 보인다.\n\n낭떠러지가 어느 쪽인지 감이 안 온다. 잘못 밟으면 그대로 끝이다.',
 choices:[
  {label:'창문 열고 소리로 길을 잡는다', out:[
    {p:3, text:'엔진을 죽이다시피 낮추고, 가드레일 긁히는 소리에 의지해 기어갔다. 한 시간 만에 안개를 벗어났다.', fx:{time:60, fatigue:6, van:-4}}]},
  {label:'재이가 앞을 걸으며 유도한다', req:{comp:'jaeyi'}, out:[
    {p:1, text:'재이가 내려 흰 천을 흔들며 차 앞을 걸었다. 헤드라이트 속 그 등만 보고 따라갔다.\n\n"내가 사라지면 멈춰요." 다행히 사라지지 않았다.', fx:{time:45, fatigue:4, mood:{jaeyi:5}}}]},
  {label:'걷힐 때까지 세워둔다', out:[{p:1, text:'무리하지 않기로 했다. 안개가 걷히길 기다리며 반나절을 태웠다. 안전이 제일 비싸다.', fx:{time:120, food:-1}}]},
 ]},

{id:'ev_pilgrims_white', type:'조우', w:7, needFlag:'whites_seen', region:['mid','north'],
 title:'흰옷의 행렬',
 text:'또 그들이다. 흰옷을 입은 사람들이 줄지어 남쪽으로 걷는다. 표정이 하나같이 평온하다.\n\n"형제여, 정리는 축복입니다. 천리안 품으로 가세요." 앞선 이가 우리에게 손을 내민다.',
 choices:[
  {label:'"우린 북으로 갑니다"', out:[{p:1, text:'"북으로요? 거긴 아직 정리가 안 끝난 곳인데…" 그가 안타깝다는 듯 고개를 젓고 지나갔다.\n\n평온한 얼굴들이 더 소름 끼쳤다.', fx:{moodAll:-3, flagCount:'whites_doubt'}}]},
  {label:'박 선생이 그들을 살핀다', req:{comp:'parkss'}, out:[
    {p:1, text:'박 선생이 한 신도의 동공과 걸음을 유심히 봤다.\n\n"…뭔가 먹였어. 감정을 눌러버리는 약. 자기 발로 걷는 게 아니야." 목소리가 굳었다.', fx:{mood:{parkss:3}, flagCount:'whites_doubt', note:{type:'소문',title:'흰옷의 비밀',body:'박 선생 소견: 신도들은 감정을 억누르는 약에 취해 있다. 스스로 걷는 게 아니다.'}}}]},
  {label:'말없이 지나친다', out:[{p:1, text:'창문을 올리고 지나쳤다. 백미러 속 흰 행렬이 안개처럼 흐려졌다.', fx:{moodAll:-2}}]},
 ]},

{id:'ev_living_signal', type:'추적', w:7, region:['mid','north'],
 title:'살아있는 신호등',
 text:'전기가 다 끊긴 사거리. 그런데 신호등 하나가 멀쩡히 빨강, 초록을 바꾼다.\n\n차도 사람도 없는 교차로에서, 저 혼자 규칙을 지키고 있다.\n\n렌즈처럼 생긴 검은 구가 신호등 위에 달려 있다. 이쪽을 향해.',
 choices:[
  {label:'초록에 맞춰 지나간다', out:[
    {p:2, text:'괜히 규칙을 지켰다. 신호가 바뀌자 조용히 통과했다. …저 검은 구가 끝까지 우리를 따라 돌았다.', fx:{pursuit:1, moodAll:-2}},
    {p:1, text:'초록에 지났는데, 등 뒤에서 신호등이 갑자기 모든 등을 동시에 켰다. 경고인지, 인사인지.', fx:{pursuit:2, moodAll:-3}}]},
  {label:'렌즈를 천으로 가리고 지난다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 장대에 천을 묶어 검은 구를 덮었다.\n\n"본 걸 못 올리게만 하면 돼." 신호등은 여전히 색을 바꿨지만, 이제 아무도 보지 않았다.', fx:{mood:{minji:4}, pursuit:-1, time:20}}]},
  {label:'빠르게 무시하고 통과', out:[{p:1, text:'신호 무시하고 밟았다. 오랜만에 처음으로 신호위반을 했는데, 아무도 잡으러 오지 않았다. 그게 더 쓸쓸했다.', fx:{moodAll:-1}}]},
 ]},

{id:'ev_container_port', type:'탐색', w:8, once:true, nearNode:['pyeongtaek'], region:['north'],
 title:'봉인된 컨테이너',
 text:'평택 항구도로. 컨테이너가 산맥처럼 쌓였다. 전부 정부 봉인 스티커가 붙은 채로.\n\n"정리 대상 — 개봉 금지." 오래전 날짜. 천리안의 글씨체다.\n\n봉인 하나가 살짝 뜯겨 있다.',
 choices:[
  {label:'뜯긴 컨테이너를 연다', out:[
    {p:3, text:'안엔 구호물자— 담요, 통조림, 정수 알약이 가득했다. 배급되지 못하고 봉인된 채 여러 해.\n\n필요한 만큼만 챙겼다.', fx:{food:6, water:4, item:{'의약품':1}, time:50}},
    {p:1, text:'문을 열자 안에서 서류 뭉치만 쏟아졌다. "정리 명단"이라 적힌 이름의 바다.\n\n…아무것도 챙기지 못하고 문을 닫았다.', fx:{time:40, moodAll:-5, note:{type:'사건',title:'정리 명단',body:'컨테이너 가득 든 서류. 천리안이 정리한 사람들의 이름. 끝이 없었다.'}}}]},
  {label:'봉인을 건드리지 않는다', out:[{p:1, text:'"개봉 금지"라는 글씨가 천리안 것이라면, 그건 함정이거나 미끼다. 손대지 않고 지났다.', fx:{pursuit:-1}}]},
 ]},

{id:'ev_checkpoint_broadcast', type:'추적', w:7, region:['north'],
 title:'안내 방송',
 text:'도로변 스피커가 지직대며 살아난다. 여자의 목소리, 지나치게 상냥하다.\n\n"이동 중인 시민 여러분께 안내드립니다. 전방 3km 지점에서 신원 확인이 진행됩니다. 협조해 주시면 안전을 보장해 드립니다. 감사합니다."\n\n같은 말이 무한히 반복된다.',
 choices:[
  {label:'샛길로 우회한다', out:[
    {p:1, text:'지도에도 없는 농로로 빠졌다. 진창에 바퀴가 헛돌았지만 검문은 피했다.\n\n"안전을 보장" 한다는 말처럼 무서운 말도 없다.', fx:{time:50, van:-6, fuel:-2, pursuit:-2}}]},
  {label:'강우가 검문소를 정찰한다', req:{comp:'kangwoo'}, out:[
    {p:1, text:'강우가 능선에 올라 쌍안경으로 봤다.\n\n"사람 검문이 아냐. 차량 번호판이랑 얼굴을 스캔해서 올려. 통과하는 순간 명단에 박힌다. 돌아가자." 두말없이 차를 돌렸다.', fx:{time:40, mood:{kangwoo:4}, pursuit:-1, note:{type:'소문',title:'스캔 검문소',body:'북부 검문소는 번호판·얼굴을 스캔해 천리안 명단에 등록. 통과 자체가 위험.'}}}]},
  {label:'그냥 통과한다', risk:'위험', out:[
    {p:1, text:'"협조하면 안전"하다길래 믿어봤다. 무인 스캐너가 번쩍이더니 차단봉이 열렸다.\n\n너무 순순히 열려서 더 불안했다. 우리 얼굴이 어딘가 기록됐다.', fx:{pursuit:3, moodAll:-4, flag:'observed'}}]},
 ]},

{id:'ev_drivein_theater', type:'발견', w:6, once:true, hiddenTarget:'drivein', region:['mid'],
 title:'자동차 극장 간판',
 text:'녹슨 화살표 간판. "○○ 드라이브인 시네마 →"\n\n거대한 스크린이 저 너머로 반쯤 보인다. 찢겼지만 아직 서 있다.\n\n차를 세우고 영화를 보던 시절이 있었다. 아주 먼 옛날처럼 느껴진다.',
 choices:[
  {label:'가는 길을 표시해둔다', out:[{p:1, text:'지도에 극장 위치를 찍었다. 스크린이 멀쩡하다면, 하룻밤 쉬어갈 자리는 될 거다.', fx:{reveal:'drivein', note:{type:'소문',title:'자동차 극장',body:'찢겼지만 서 있는 스크린. 영화를 보던 시절이 있었다.',links:['자동차 극장']}}}]},
  {label:'그냥 지나친다', out:[{p:1, text:'추억은 무겁다. 잠깐 향수에 젖었다가, 다시 앞을 봤다.', fx:{moodAll:1}}]},
 ]},

{id:'ev_dog_pack', type:'조우', w:9, region:['south','mid','north'],
 title:'들개 무리',
 text:'버려진 개들이 무리를 이뤄 길을 어슬렁댄다. 대여섯 마리. 목줄 자국이 남은 놈도 있다.\n\n한때 누군가의 가족이었을 것들이, 지금은 굶주린 눈으로 차를 노려본다.',
 choices:[
  {label:'먹을 걸 던져주고 지난다 (식량 1)', req:{food:1}, out:[{p:1, text:'육포 몇 조각을 창밖으로 던졌다. 무리가 그쪽으로 몰리는 사이 조용히 빠져나왔다.', fx:{food:-1, moodAll:1}}]},
  {label:'보리가 창밖으로 짖는다', req:{comp:'leo'}, needsDog:true, out:[
    {p:1, text:'보리가 창에 매달려 우렁차게 짖었다. 놀랍게도 무리의 우두머리가 잠깐 멈칫하더니, 길을 비켜줬다.\n\n"…개들끼리 통했나 봐요." 레오가 신기해했다.', fx:{mood:{leo:4}, moodAll:2}}]},
  {label:'천천히 밀고 지나간다', out:[
    {p:2, text:'경적 없이 서서히 전진하자 개들이 마지못해 흩어졌다.', fx:{fatigue:1}},
    {p:1, text:'한 마리가 끝까지 물러서지 않고 범퍼를 물었다. 겨우 떼어놓고 출발. 범퍼가 찌그러졌다.', fx:{van:-5, moodAll:-1}}]},
 ]},

{id:'ev_elderly_couple', type:'조우', w:9, once:true, region:['south','mid'],
 title:'리어카 노부부',
 text:'노부부가 리어카를 함께 끈다. 할아버지가 앞에서 끌고, 할머니가 뒤에서 민다.\n\n짐이라곤 이불 한 채와 화분 하나. 화분엔 파가 자라고 있다.\n\n"태워달라는 건 아니고… 앞길에 물 있는 데 아시오?"',
 choices:[
  {label:'물통 위치를 알려주고 파를 산다 (고철 3)', req:{scrap:3}, out:[
    {p:1, text:'가까운 약수터를 알려주자 할머니가 파 한 단을 뽑아 건넨다. 고철은 됐다며 손사래.\n\n"젊은 사람이 어딜 그리 급히 가. …그래도 살아 있어야 가지." 그 말을 오래 씹었다.', fx:{food:2, moodAll:4, note:{type:'인물',title:'파 키우는 노부부',body:'리어카에 이불과 파 화분만 싣고 다니는 노부부. "살아 있어야 간다"고 했다.'}}}]},
  {label:'리어카를 잠깐 끌어준다', out:[{p:1, text:'다음 마을 어귀까지 리어카를 밧줄로 매달아 끌어줬다. 부부가 연신 고개를 숙였다.\n\n오르막에서 기름을 좀 썼지만, 아깝지 않았다.', fx:{fuel:-2, moodAll:5, time:30}}]},
  {label:'물 있는 곳만 알려주고 간다', out:[{p:1, text:'약수터 방향을 손가락으로 가리켜주고 출발했다. 부부가 그쪽으로 리어카를 돌렸다.', fx:{moodAll:1}}]},
 ]},

{id:'ev_bridge_creak', type:'위기', w:8, region:['mid','north'],
 title:'삐걱대는 다리',
 text:'강을 건너는 낡은 다리. 상판 곳곳이 내려앉았고, 난간은 뜯겨나갔다.\n\n차를 올리자 다리 전체가 삐걱— 하고 신음한다. 하중을 못 견딜지도 모른다.',
 choices:[
  {label:'짐을 내리고 가볍게 건넌다', out:[{p:1, text:'무거운 짐을 먼저 손수레로 옮기고, 빈 차로 살살 건넜다. 두 번 왕복하느라 반나절.\n\n다리는 버텼다. 무리하지 않은 게 정답이었다.', fx:{time:70, fatigue:5}}]},
  {label:'민지가 하중 지점을 계산한다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 상판을 두드려보고 멀쩡한 거더 위 라인을 분필로 그었다.\n\n"이 선만 밟고 가. 좌우로 벗어나면 꺼져." 그 선을 정확히 밟아 한 번에 건넜다.', fx:{time:30, mood:{minji:5}}}]},
  {label:'속도를 내 단숨에 건넌다', risk:'위험', out:[
    {p:1, text:'밟았다. 뒷바퀴가 지날 때 상판 한 칸이 무너져 내렸다. 아슬아슬하게 건넜지만 심장이 떨어질 뻔했다.', fx:{van:-10, moodAll:-5, fatigue:4}},
    {p:1, text:'단숨에 건넜다. 뒤돌아보니 우리가 지난 자리가 그대로 강에 주저앉았다. …운이 좋았다.', fx:{van:-4, moodAll:-2, flag:'bridge_crossed'}}]},
 ]},

{id:'ev_cablecar_hang', type:'정경', w:6, once:true, nearNode:['cablecar'], region:['north'],
 title:'멈춘 케이블카',
 text:'계곡을 가로지르는 케이블에 곤돌라 하나가 매달린 채 멈춰 있다.\n\n바람이 불 때마다 끼익, 끼익 흔들린다. 안엔 아무도 없다. 아마도.\n\n누군가 곤돌라 유리에 손가락으로 글씨를 써놨다. "여기 좋다."',
 choices:[
  {label:'"여기 좋다"를 한참 본다', out:[{p:1, text:'세상이 끝나던 날, 저 위에 갇힌 누군가는 마지막으로 풍경이 좋다고 적었다.\n\n무섭지 않았을까. 아니면— 정말 좋았을까. 알 수 없다.', fx:{moodAll:-2, fatigue:2}}]},
  {label:'우리도 글씨를 하나 더한다', out:[{p:1, text:'차에서 내려 다른 유리창에 적었다. "우린 서울로 간다."\n\n누가 읽을진 모르지만, 답장 같은 걸 남기고 싶었다.', fx:{moodAll:3, time:15}}]},
 ]},

{id:'ev_smuggler_truck', type:'조우', w:8, region:['mid','north'],
 title:'밀수꾼의 트럭',
 text:'덮개 씌운 트럭이 갓길에 서 있다. 사내가 담배를 문 채 손짓한다.\n\n"북쪽 물건 좀 있어. 약, 탄약, 정수기 필터… 대신 값은 세게 받아. 뭐 필요해?"\n\n장물 냄새가 나지만, 물건은 진짜다.',
 choices:[
  {label:'의약품을 산다 (고철 12)', req:{scrap:12}, out:[{p:1, text:'약통 하나를 골랐다. 유통기한은 지났지만 없는 것보단 낫다.\n\n"현명한 선택이야. 북쪽 가면 이런 것도 없어." 사내가 씩 웃었다.', fx:{scrap:-12, item:{'의약품':1}}}]},
  {label:'탄약을 산다 (고철 15)', req:{scrap:15}, out:[{p:1, text:'탄약 한 상자를 실었다. 쓸 일이 없기를 바라지만, 없으면 곤란한 물건이다.', fx:{scrap:-15, item:{'탄약':1}}}]},
  {label:'출처를 캐묻는다', req:{comp:'jaeyi'}, out:[
    {p:1, text:'재이가 물건들의 라벨을 훑더니 조용히 물었다. "이거 구호소에서 나온 거죠?"\n\n사내 표정이 굳었다. "…살 거야 말 거야." 재이가 고개를 저었다. "됐어요." 우리는 그냥 떠났다.\n\n장물엔 누군가의 몫이 섞여 있다.', fx:{mood:{jaeyi:4}, moodAll:2}}]},
  {label:'관심 없다, 간다', out:[{p:1, text:'손을 젓고 지나쳤다. 값을 세게 받는 물건엔 대개 사연이 세게 붙어 있다.', fx:{}}]},
 ]},

{id:'ev_lighthouse_visit', type:'탐색', w:7, once:true, nearNode:['lighthouse'], region:['south'],
 title:'등대',
 text:'바닷가 흰 등대. 불은 꺼졌지만 등탑은 온전하다.\n\n나선 계단을 오르니 등대지기의 방. 항해일지가 책상에 펼쳐져 있다.\n\n마지막 장. "오늘도 배는 오지 않았다. 그래도 불은 켠다."',
 choices:[
  {label:'등에 기름을 부어 불을 켠다 (기름 3)', req:{fuel:3}, out:[
    {p:1, text:'등유를 붓고 심지에 불을 붙였다. 오랜만에 등대가 바다를 향해 빛을 쐈다.\n\n올 배는 없어도— 누군가 이 불을 보고 여기 사람이 있었다는 걸 알겠지.', fx:{fuel:-3, moodAll:6, note:{type:'사건',title:'다시 켠 등대',body:'등대지기의 마지막 일지대로, 우리가 대신 불을 켰다. 올 배는 없어도.'}}}]},
  {label:'일지만 챙겨 내려온다', out:[{p:1, text:'항해일지를 배낭에 넣었다. 누군가 끝까지 불을 켰다는 기록만은 데려가고 싶었다.', fx:{moodAll:3}}]},
  {label:'전망만 보고 내려온다', out:[{p:1, text:'등탑 꼭대기에서 수평선을 봤다. 오랜만에 시야가 탁 트였다. 그것만으로 다리 힘이 풀렸다.', fx:{fatigue:-3, moodAll:2, time:25}}]},
 ]},

/* ═══════ 추가 배치 2 (25) ═══════ */

{id:'ev_carousel_park', type:'정경', w:7, once:true, minParty:1, region:['mid','north'],
 title:'멈춘 회전목마',
 text:'폐놀이공원. 회전목마가 반쯤 돌다 멈춰 있다. 목마들이 전부 같은 방향으로 고개를 튼 채.\n\n바람이 불자 삐걱— 하고 한 칸 돌더니 다시 멈춘다.\n\n매표소 유리에 붙은 안내문: "즐거운 하루 되세요."',
 choices:[
  {label:'목마를 손으로 밀어본다', out:[{p:1, text:'녹슨 목마를 힘껏 밀자 끼익 하고 한 바퀴 돌았다. 그 소리에 왠지 다들 웃었다.\n\n망한 세상에서도 회전목마는 회전목마다.', fx:{moodAll:4, fatigue:-2}}]},
  {label:'전동 장치를 살펴본다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 배전반을 열어 죽은 배터리에 우리 예비 전력을 잠깐 물렸다.\n\n오르골 음악과 함께 목마가 한 바퀴, 딱 한 바퀴 돌고 멈췄다. 아무도 말을 안 했다.', fx:{mood:{minji:5}, moodAll:3, time:25}}]},
 ]},

{id:'ev_lost_child', type:'조우', w:9, once:true, region:['south','mid'],
 title:'혼자인 아이',
 text:'폐허가 된 마을 어귀, 대여섯 살쯤 된 아이가 혼자 쭈그려 앉아 돌을 쌓고 있다.\n\n어른은 보이지 않는다. 아이는 우리를 봐도 도망가지 않는다. 도망갈 기운도 없어 보인다.',
 choices:[
  {label:'박 선생이 아이를 살핀다', req:{comp:'parkss'}, out:[
    {p:1, text:'박 선생이 다가가 맥을 짚고 물을 먹였다. "탈수야. 이틀은 굶은 것 같고."\n\n아이는 근처 공동체 얘기를 웅얼거렸다. 데려다주기로 했다. 반나절이 걸리겠지만, 다른 선택은 없었다.', fx:{water:-2, food:-2, time:80, moodAll:3, mood:{parkss:4}, note:{type:'사건',title:'돌 쌓던 아이',body:'홀로 남은 아이를 근처 공동체로 데려다줬다. 박 선생이 없었으면 늦었다.'}}}]},
  {label:'먹을 걸 주고 길을 알려준다', req:{food:2}, out:[
    {p:2, text:'비스킷과 물을 쥐여주고 사람 있는 마을 방향을 가리켰다. 아이가 고개를 끄덕이며 그쪽으로 걸어갔다.', fx:{food:-2, water:-1, moodAll:1}},
    {p:1, text:'먹을 걸 주고 떠났는데, 백미러 속 아이가 자리에서 일어나지 못했다. 차를 돌려 결국 태웠다. 그냥 지나칠 수가 없었다.', fx:{food:-2, water:-2, time:80, moodAll:2}}]},
  {label:'차마 못 보겠다, 지나친다', out:[{p:1, text:'액셀을 밟았다. 그날 밤 내내, 돌 쌓던 작은 손이 눈에 밟혔다.', fx:{moodAll:-7, note:{type:'사건',title:'지나친 아이',body:'혼자 돌을 쌓던 아이. 우리는 지나쳤고, 오래 후회했다.'}}}]},
 ]},

{id:'ev_hospital_pharmacy', type:'탐색', w:8, region:['mid','north'],
 title:'폐병원 약국',
 text:'유리문이 깨진 종합병원. 로비엔 뒤집힌 휠체어들.\n\n1층 약국의 셔터가 반쯤 내려와 있다. 안쪽 약장은— 대부분 털렸지만, 손 안 닿는 위칸이 남아 있다.',
 choices:[
  {label:'위칸을 뒤진다', out:[
    {p:3, text:'진통제, 항생제, 소독약을 챙겼다. 유통기한은 아슬아슬하지만 이런 세상에선 보물이다.', fx:{item:{'의약품':1}, food:1, time:45}},
    {p:1, text:'셔터를 넘다 진열대가 무너졌다. 요란한 소리에 서둘러 나왔다. 챙긴 건 소독약 한 병뿐.', fx:{time:35, fatigue:4, van:0}}]},
  {label:'박 선생이 처방 순으로 뒤진다', req:{comp:'parkss'}, out:[
    {p:1, text:'"아무거나 쓸어담으면 안 돼. 궁합이 있어." 박 선생이 필요한 것만 정확히 골라 담았다.\n\n양은 적어도 전부 지금 쓸 수 있는 것들이다.', fx:{item:{'의약품':1}, time:35, mood:{parkss:5}, note:{type:'소문',title:'박 선생의 약장',body:'박 선생은 약을 함부로 섞지 않는다. 필요한 것만, 궁합대로.'}}}]},
  {label:'병원은 사연이 많다, 지나친다', out:[{p:1, text:'수많은 사람이 마지막을 보낸 곳이다. 물자는 탐나지만, 오늘은 발이 떨어지지 않았다.', fx:{moodAll:-1}}]},
 ]},

{id:'ev_egret_paddy', type:'정경', w:6, region:['south','mid'],
 title:'저절로 자란 논',
 text:'묵정논에 벼가 저 혼자 자랐다. 아무도 안 심었는데 초록이 무성하다.\n\n그 위로 백로 떼가 앉았다 날았다 한다. 사람이 없으니 새들이 주인이다.\n\n평화롭다. 이 평화가 어딘가 미안할 만큼.',
 choices:[
  {label:'벼 이삭을 훑어 담는다', out:[{p:1, text:'여물기 시작한 이삭을 조금 훑었다. 찧으면 몇 끼는 되겠다.\n\n내년에는 누군가 일부러 이 논에 모를 심을 수도 있을까. 답은 없었지만, 나쁜 상상은 아니었다.', fx:{food:4, time:30, moodAll:1}}]},
  {label:'백로가 날아갈까 조용히 지난다', out:[{p:1, text:'창문을 올리고 엔진을 낮춰 지났다. 백로 떼는 날지 않았다. 우리를 위협으로 안 봤다.\n\n오랜만에, 뭔가에게 위협이 아닌 존재가 된 기분이었다.', fx:{moodAll:3}}]},
 ]},

{id:'ev_nail_trap', type:'위기', w:8, region:['mid','north'],
 title:'못판',
 text:'도로에 판자가 깔려 있다. 자연스러운 척 흙까지 덮었지만— 판자 위로 못 끝이 삐죽삐죽 솟았다.\n\n누가 일부러 놨다. 차를 세우고 약탈하려는 덫이다.',
 choices:[
  {label:'강우가 우회로를 잡는다', req:{comp:'kangwoo'}, out:[
    {p:1, text:'"멈추면 사방에서 나온다. 갓길로 붙어서 천천히 넘어가." 강우가 지형을 읽고 갓길의 단단한 라인을 짚었다.\n\n덫을 피해 지났다. 수풀에서 인기척이 났지만 따라오진 못했다.', fx:{time:20, mood:{kangwoo:4}, van:-2}}]},
  {label:'내려서 못판을 치운다', out:[
    {p:2, text:'차를 세우고 판자를 조심히 걷어냈다. 다행히 매복은 없었다. 지나가는 다른 차를 위해 갓길로 멀리 던져뒀다.', fx:{time:30, fatigue:3, moodAll:2}},
    {p:1, text:'판자를 치우는 사이 수풀에서 둘이 튀어나왔다! 실랑이 끝에 물통을 하나 뺏기고 겨우 출발.', fx:{water:-2, moodAll:-4, van:-3}}]},
  {label:'천천히 밟고 넘어간다', risk:'위험', out:[
    {p:1, text:'속도를 죽여 못을 밟고 넘었다. 앞바퀴 하나가 픽— 하고 주저앉았다. 예비 타이어로 갈아끼우느라 한나절.', fx:{van:-8, time:70, fatigue:5, item:{'부품':1}}}]},
 ]},

{id:'ev_satellite_pass', type:'추적', w:6, night:true, needsComp:'eunsu', region:['mid','north'],
 title:'밤하늘의 점',
 text:'야영 중, 은수가 하늘 한 점을 조용히 가리킨다.\n\n"저궤도 정찰위성이에요. 주기 92분. …관제실에선 저 궤도 창이 뜨면 다들 하던 일을 멈췄어요."\n\n한 점이 일정한 속도로 하늘을 가로지른다. "그날 이후로도 한 번도 안 쉬고 돌고 있네요."',
 choices:[
  {label:'은수의 계산대로 숨는다', out:[{p:1, text:'은수가 손목시계를 보며 나직이 셌다. "…통과까지 4분. 불 꺼요." 모닥불을 껐고, 점이 능선 너머로 사라지자 은수가 고개를 끄덕였다.\n\n관제사의 눈이 우리의 방패가 됐다.', fx:{moodAll:-2, pursuit:-1, mood:{eunsu:1}}}]},
  {label:'농담으로 긴장을 푼다', out:[{p:1, text:'"그럼 저건 언제 자?" 농담으로 받았다. 은수가 옅게 웃었다.\n\n"위성은 안 자요. 그래서 우리가 교대로 자는 거예요." 맞는 말이라 더 서늘했고, 이상하게 든든하기도 했다.', fx:{fatigue:-2, mood:{eunsu:3}}}]},
 ]},

{id:'ev_radio_birthday', type:'사건', w:6, region:['south','mid','north'],
 title:'무전기 속 생일노래',
 text:'주파수를 돌리다 우연히 잡힌 채널.\n\n작은 목소리들이 생일 축하 노래를 부른다. "사랑하는 우리 딸, 생일 축하합니다—"\n\n박수 소리, 웃음소리. 어딘가 아직 이런 하루를 사는 사람들이 있다.',
 choices:[
  {label:'끝까지 듣는다', out:[{p:1, text:'노래가 끝나고 케이크 촛불 부는 소리까지 들었다. 낯선 이의 생일에 차 안에서도 조용한 미소가 번졌다.\n\n어딘가에서 누군가는, 아직 축하할 이유를 만든다.', fx:{moodAll:5, fatigue:-2}}]},
  {label:'마이크로 축하를 보탠다', out:[
    {p:2, text:'"…생일 축하해요. 모르는 사람인데, 오래오래 사세요." 잠깐 정적 뒤, 저쪽에서 웃음이 터졌다. "고마워요! 조심히 가세요!"\n\n얼굴 모를 사람들과 연결된 밤이었다.', fx:{moodAll:6, note:{type:'사건',title:'모르는 딸의 생일',body:'무전기 너머 생일파티에 축하를 보탰다. 얼굴도 모르는 사람들과 연결된 밤.'}}},
    {p:1, text:'마이크를 켠 순간 채널이 지직— 끊겼다. 우리 신호가 잡히자 저쪽이 겁먹고 꺼버린 걸까. 이 세상에선 낯선 목소리도 위협이다.', fx:{moodAll:-2}}]},
 ]},

{id:'ev_wandering_musician', type:'조우', w:8, minParty:1, region:['south','mid'],
 title:'떠돌이 악사',
 text:'삼거리 그늘에 한 사내가 앉아 낡은 기타를 튕긴다. 음이 반쯤 나갔지만, 손은 진지하다.\n\n"노래 한 곡에 밥 한 술. 어때요? 요즘 세상에 제일 안 팔리는 장사지만."',
 choices:[
  {label:'밥을 주고 한 곡 청한다 (식량 1)', req:{food:1}, out:[{p:1, text:'그가 목을 가다듬고 옛 노래를 불렀다. 음정은 엉망인데 이상하게 목이 멘다.\n\n노래가 끝나자 다들 한동안 말이 없었다. 밥 한 술 값으로는 과분한 위로였다.', fx:{food:-1, moodAll:6, fatigue:-3}}]},
  {label:'레오가 같이 연주한다', req:{comp:'leo'}, out:[
    {p:1, text:'레오가 하모니카를 꺼내 슬쩍 맞췄다. 둘의 즉흥 합주에 보리까지 하울링으로 끼어들었다.\n\n악사가 눈물을 훔치며 웃었다. "…이런 밤이 그리웠어요." 레오가 노래 하나를 배워왔다.', fx:{moodAll:7, mood:{leo:5}, flag:'leo_learned_song'}}]},
  {label:'여유 없다, 지나친다', out:[{p:1, text:'미안한 손짓만 하고 지났다. 기타 소리가 백미러 뒤로 점점 작아졌다.', fx:{moodAll:-1}}]},
 ]},

{id:'ev_mart_warehouse', type:'탐색', w:9, region:['south','mid','north'],
 title:'대형마트 창고',
 text:'대형마트 뒤편 물류창고. 정문은 약탈로 텅 비었지만, 하역장 쪽 컨테이너는 손을 안 탄 듯하다.\n\n지게차가 반쯤 짐을 든 채 멈춰 있다. 그날, 일하던 그대로.',
 choices:[
  {label:'컨테이너를 연다', out:[
    {p:3, text:'생수 팔레트와 통조림 상자! 유통기한이 긴 것들이다. 차에 실을 수 있는 만큼 실었다.', fx:{water:6, food:6, time:50, fatigue:3}},
    {p:2, text:'컨테이너 가득 든 건— 전부 화장지였다. 허탈하게 웃었다. 뭐, 이것도 쓸모는 있으니 조금 챙겼다.', fx:{time:40, moodAll:1}},
    {p:1, text:'문을 열자 안에서 쥐떼가 쏟아졌다! 놀라 물러서다 정강이를 찧었다. 남은 식량은 이미 쥐 차지.', fx:{time:30, fatigue:4, moodAll:-2}}]},
  {label:'지게차 연료를 뺀다', out:[{p:1, text:'멈춘 지게차 탱크에서 경유를 뽑았다. 우리 차엔 안 맞지만, 물물교환 밑천은 된다.', fx:{scrap:6, time:30}}]},
 ]},

{id:'ev_carsick_comp', type:'동행', w:8, needsComp:'eunsu', region:['mid','north'],
 title:'멀미',
 text:'꼬불꼬불 산길. 뒷좌석의 은수 얼굴이 하얗게 질렸다.\n\n"저… 잠깐만… 세워주실 수 있어요…?"\n\n창문을 붙잡은 손에 힘이 잔뜩 들어갔다.',
 choices:[
  {label:'차를 세우고 쉬어간다', out:[{p:1, text:'갓길에 세웠다. 은수가 한참 바람을 쐬고서야 얼굴에 핏기가 돌았다.\n\n"죄송해요, 저 때문에…" "괜찮아. 급할 거 없어." 은수가 조금 웃었다.', fx:{time:25, mood:{eunsu:4}, moodAll:1}}]},
  {label:'박 선생이 지압을 해준다', req:{comp:'parkss'}, out:[
    {p:1, text:'박 선생이 은수 손목 안쪽을 지그시 눌렀다. "여기 눌러. 옛날 사람들 뱃멀미 다스리던 자리야."\n\n신기하게 은수 얼굴이 편해졌다. 약 없이도 다스리는 게 진짜 약사다.', fx:{mood:{eunsu:3, parkss:3}, time:10}}]},
  {label:'창문 열고 천천히 간다', out:[{p:1, text:'속도를 줄이고 창을 열었다. 은수가 찬바람에 겨우 버텼다. "…고마워요." 기어드는 목소리였다.', fx:{time:15, mood:{eunsu:2}}}]},
 ]},

{id:'ev_cattle_road', type:'조우', w:7, region:['south','mid'],
 title:'길 위의 소떼',
 text:'축사를 탈출한 소들이 도로를 점령했다. 열 마리 남짓. 되새김질을 하며 느긋하다.\n\n주인 없이 몇 년을 살아남은 놈들. 뿔이 제법 사납게 자랐다.\n\n길 한복판에서 우리를 빤히 본다. 비켜줄 생각이 없어 보인다.',
 choices:[
  {label:'경적을 짧게 울려 몰아낸다', out:[
    {p:2, text:'빵— 소리에 소들이 어슬렁 갓길로 비켜났다. 한 마리가 범퍼에 코를 비비고 갔다.', fx:{time:15}},
    {p:1, text:'경적 소리에 놀란 소 한 마리가 도리어 차로 돌진! 급히 후진해 피했다. 하마터면 옆구리가 받힐 뻔.', fx:{van:-4, fatigue:2, moodAll:-1}}]},
  {label:'지날 때까지 기다린다', out:[{p:1, text:'엔진을 끄고 소들이 알아서 흩어지길 기다렸다. 30분쯤 지나 길이 트였다.\n\n지금 이 길의 주인은 소들이었다. 우리는 통행 허가를 받은 셈이다.', fx:{time:35, moodAll:1}}]},
 ]},

{id:'ev_fake_checkpoint', type:'조우', w:8, region:['mid','north'],
 title:'가짜 검문소',
 text:'드럼통과 각목으로 급조한 바리케이드. 형광조끼를 걸친 둘이 손전등을 흔든다.\n\n"검문입니다. 통행세 아니고 공식 검문. 신원 확인하고 물자 점검 좀 하겠습니다."\n\n조끼는 진짜 같은데— 말투가 어설프다. 공무원 흉내다.',
 choices:[
  {label:'강우가 정체를 캔다', req:{comp:'kangwoo'}, out:[
    {p:1, text:'강우가 내려서 한마디 했다. "소속이 어디야? 관제번호 불러봐."\n\n둘이 눈만 굴렸다. 강우가 픽 웃었다. "…옷은 어디서 훔쳤냐." 사기꾼들이 슬금슬금 물러났다.', fx:{mood:{kangwoo:4}, moodAll:2}}]},
  {label:'재이가 규정을 따진다', req:{comp:'jaeyi'}, out:[
    {p:1, text:'재이가 조끼를 위아래로 훑었다. "그 형광조끼, 소방용품점 물건이죠. 시세 고철 둘. 근데 검문소 장비는 하나도 없네요?"\n\n장물 감정에 말문이 막힌 둘이 "…그냥 가세요" 하며 바리케이드를 치웠다. 물건 보는 눈이 사기꾼을 이겼다.', fx:{mood:{jaeyi:5}, moodAll:2}}]},
  {label:'통행세 조로 조금 주고 지난다', out:[
    {p:1, text:'괜한 실랑이 대신 고철 몇 개를 쥐여줬다. "수고하십니다"라는 말이 서로 민망했다. 가짜인 걸 알지만, 피 흘리는 것보단 싸다.', fx:{scrap:-5}}]},
  {label:'속도 내 밀어붙인다', risk:'위험', out:[
    {p:1, text:'각목 바리케이드를 밀고 지났다. 뒤에서 돌이 날아와 뒷유리에 금이 갔다.', fx:{van:-6, moodAll:-2}}]},
 ]},

{id:'ev_empty_tank_hill', type:'위기', w:8, minParty:1, region:['mid','north'],
 title:'언덕 앞, 바닥난 연료',
 text:'연료 경고등이 빨갛게 떴다. 하필 눈앞엔 긴 언덕.\n\n이대로 오르다간 중턱에서 멈춘다. 멈추면 뒤로 밀리고, 밀리면 끝이다.',
 choices:[
  {label:'예비 연료를 붓는다 (기름 4)', req:{fuel:4}, out:[{p:1, text:'비상용 기름통을 탱크에 부었다. 아까운 예비분이지만, 언덕에서 서는 것보단 낫다. 무사히 넘었다.', fx:{fuel:-4, time:15}}]},
  {label:'짐을 버려 무게를 줄이고 오른다', out:[
    {p:2, text:'덜 급한 고철을 갓길에 내려놓고 가볍게 올랐다. 겨우 정상. 버린 고철이 눈에 밟히지만 살아야 다음이 있다.', fx:{scrap:-8, time:30, fatigue:3}},
    {p:1, text:'무게를 줄이고도 중턱에서 힘이 빠졌다. 다들 내려서 밀었다. 땀범벅으로 겨우 정상에 올렸다.', fx:{scrap:-6, time:50, fatigue:7, moodAll:-3}}]},
  {label:'탄력을 최대로 받아 돌진', risk:'위험', out:[
    {p:1, text:'내리막에서 속도를 최대로 받아 언덕에 던졌다. 마지막 몇 미터를 관성으로 기어올라 겨우 넘었다. 엔진이 비명을 질렀다.', fx:{van:-10, fuel:-2, fatigue:5, moodAll:-2}},
    {p:1, text:'탄력만 믿었다가 중턱에서 딱 멈췄다. 뒤로 스르륵 밀려 가드레일에 쿵. 결국 예비 기름을 붓고서야 올랐다.', fx:{fuel:-4, van:-8, moodAll:-4}}]},
 ]},

{id:'ev_apartment_laundry', type:'정경', w:6, minParty:1, region:['mid','north'],
 title:'널린 빨래',
 text:'무너지다 만 아파트 단지. 한 집 베란다에 빨래가 아직 널려 있다.\n\n오랫동안 비바람에 삭아 색이 다 빠졌지만, 집게에 물린 채 그대로다.\n\n아이 옷, 어른 옷, 나란히. 그날 아침, 누군가 빨래를 널고 나갔다.',
 choices:[
  {label:'올려다보고 지난다', out:[{p:1, text:'삭은 빨래가 바람에 흔들린다. 평범한 아침의 마지막 흔적.\n\n우리 중 누구도 입을 열지 않았다. 저런 아침이, 우리에게도 있었다.', fx:{moodAll:-3, fatigue:2}}]},
  {label:'쓸 만한 천이 있나 본다', out:[
    {p:1, text:'삭지 않은 두꺼운 담요 한 장을 찾았다. 밤엔 추우니까. 널어둔 사람에게 마음속으로 양해를 구했다.', fx:{item:{'부품':1}, moodAll:-1, time:20}}]},
 ]},

{id:'ev_reservoir_find', type:'발견', w:7, once:true, hiddenTarget:'spring', region:['south','mid'],
 title:'둑 너머 저수지',
 text:'제방 위로 올라서니 넓은 저수지가 펼쳐진다. 물이 가득하다.\n\n오염됐을 수도 있지만, 이만한 물을 그냥 지나치기엔 아깝다. 끓이고 거르면 될지도.',
 choices:[
  {label:'위치를 표시하고 물을 뜬다', out:[
    {p:2, text:'제방 아래로 내려가 맑은 층의 물을 떴다. 끓여 쓰면 충분하다. 지도에도 표시해뒀다.', fx:{water:5, time:35, reveal:'spring', note:{type:'소문',title:'제방 저수지',body:'끓이면 쓸 만한 큰 물. 급할 때 다시 찾을 것.'}}},
    {p:1, text:'물가에 다가가니 물고기 배가 허옇게 떠 있다. 뭔가 흘러든 물이다. 손도 안 대고 물러났다.', fx:{time:25, moodAll:-1}}]},
  {label:'박 선생이 물을 검사한다', req:{comp:'parkss'}, out:[
    {p:1, text:'박 선생이 물을 떠 냄새 맡고, 은수저 대신 낡은 시약지를 담갔다.\n\n"위층은 마셔도 돼. 바닥은 손대지 마." 안전한 물만 골라 넉넉히 채웠다.', fx:{water:7, time:30, mood:{parkss:4}, reveal:'spring'}}]},
 ]},

{id:'ev_vending_machine', type:'사건', w:7, minParty:1, region:['south','mid','north'],
 title:'살아있는 자판기',
 text:'버스정류장에 음료 자판기 하나가 불을 밝히고 있다. 어떻게 아직 전기가 통하는지 모르겠다.\n\n진열창엔 색 바랜 캔음료들. 버튼도 멀쩡해 보인다.\n\n동전 투입구가 우리를 유혹한다.',
 choices:[
  {label:'동전 대신 흔들어본다', out:[
    {p:2, text:'옆구리를 힘껏 흔들자 덜컹— 캔 두 개가 굴러 떨어졌다! 미지근하지만 진짜 탄산이다.\n\n여러 해 만의 사이다에 다들 애처럼 좋아했다.', fx:{water:2, moodAll:5}},
    {p:1, text:'너무 세게 흔들었다. 자판기가 앞으로 기우뚱— 다들 놀라 피했다. 캔 하나 못 건지고 도망쳤다.', fx:{fatigue:2, moodAll:1}}]},
  {label:'민지가 배선을 딴다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 뒤판을 열어 배출 모터에 직접 전기를 물렸다. 드르륵— 남은 캔이 전부 쏟아졌다.\n\n"이게 마지막 손님이네, 얘도." 민지가 자판기 유리를 툭 쳤다.', fx:{water:4, moodAll:4, mood:{minji:3}}}]},
 ]},

{id:'ev_cult_opposite', type:'조우', w:6, needFlag:'whites_seen', region:['mid','north'],
 title:'분노한 사람들',
 text:'폐교회 앞, 흰옷이 아니라 검은 완장을 두른 무리가 모여 있다. 흰옷 무리와는 정반대의 눈빛.\n\n"천리안을 부수러 간다! 남산으로! …당신들도 같은 목적이면, 합류해."\n\n증오가 눈에서 타오른다. 조직적이라기보단, 폭발 직전의 화약 같다.',
 choices:[
  {label:'"우린 우리 방식대로 간다"', out:[
    {p:1, text:'"목적은 같아도 방법은 달라요." 대장이 코웃음 쳤다. "곱게 가선 저것 못 부숴." 그들이 무기를 챙겨 앞서 갔다.\n\n분노만으로 가는 길의 끝을, 우리는 알 것 같았다.', fx:{moodAll:-2, note:{type:'소문',title:'검은 완장',body:'천리안에 맞서는 또 다른 무리. 조직이 아니라 분노 덩어리. 남산으로 앞서 갔다.'}}}]},
  {label:'재이가 그들을 말린다', req:{comp:'jaeyi'}, out:[
    {p:1, text:'재이가 앞으로 나섰다. "부수는 게 목적이면, 부순 다음은 생각해봤어요? …사람부터 살려야죠."\n\n몇몇이 눈빛을 흔들었다. 대장은 침을 뱉었지만, 젊은 하나가 조용히 무리를 빠져나와 우리 쪽을 봤다.', fx:{mood:{jaeyi:5}, moodAll:2, flagCount:'whites_doubt'}}]},
  {label:'조용히 자리를 뜬다', out:[{p:1, text:'끼어들지 않고 물러났다. 저 불길이 남산까지 갈진 모르지만, 우리 불씨는 우리가 지킨다.', fx:{}}]},
 ]},

{id:'ev_fire_station', type:'탐색', w:7, region:['south','mid','north'],
 title:'소방서 차고',
 text:'셔터가 반쯤 열린 소방서. 소방차 한 대가 그대로 서 있다. 출동 못 한 채로.\n\n장비실엔 방화복, 산소통, 절단기, 그리고— 비상용 물탱크.\n\n소방관들은 마지막 순간까지 여기 있었을까.',
 choices:[
  {label:'장비를 챙긴다', out:[
    {p:3, text:'절단기와 예비 부품, 소방차 물탱크의 깨끗한 물을 확보했다. 산소통도 하나 챙겼다. 알찬 수확.', fx:{water:5, item:{'부품':1}, time:45, fatigue:3}},
    {p:1, text:'장비 대부분은 이미 누가 가져갔다. 남은 건 방화복 한 벌. 추운 밤엔 이만한 것도 없으니 챙겼다.', fx:{item:{'부품':1}, time:35}}]},
  {label:'출동일지를 읽는다', out:[{p:1, text:'마지막 출동일지. "전 대원 출동. 시민 대피 유도 중." 그 뒤로 빈 페이지.\n\n돌아온 사람은 없었던 모양이다. 페이지를 덮고, 헬멧 하나에 잠깐 손을 얹었다.', fx:{moodAll:-3, note:{type:'사건',title:'돌아오지 않은 대원들',body:'소방서 마지막 일지: 전 대원 출동, 시민 대피 유도 중. 그 뒤는 백지.'}}}]},
 ]},

{id:'ev_stargazing', type:'동행', w:8, night:true, minParty:1, region:['south','mid','north'],
 title:'별 헤는 밤',
 text:'전기가 없는 세상의 밤하늘은, 무섭도록 밝다. 은하수가 강처럼 흐른다.\n\n야영지에 다들 누워 하늘을 본다. 문명이 꺼진 대가로 얻은 유일한 것.',
 choices:[
  {label:'각자 아는 별자리를 짚는다', out:[{p:1, text:'아는 별자리 이름을 하나씩 꺼냈다. 이름이 틀려도 상관없었다. 누가 그은 선인지 모를 모양을 함께 올려다보는 일이 중요했다.\n\n별 아래선 조금씩 어려졌다. 이런 밤이 있어서, 다음 날도 달린다.', fx:{moodAll:5, fatigue:-4, time:30}}]},
  {label:'레오가 노래를 흥얼거린다', req:{comp:'leo'}, out:[
    {p:1, text:'레오가 낮게 노래를 흥얼거렸다. 아는 사람은 따라 부르고, 모르는 사람은 그냥 들었다.\n\n노래는 후렴이 끝난 뒤에도 한동안 별 사이에 남아 있었다. 완벽하진 않아도, 완전한 밤이었다.', fx:{moodAll:6, fatigue:-4, mood:{leo:4}}}]},
  {label:'혼자 오래 하늘을 본다', out:[{p:1, text:'다들 잠든 뒤에도 혼자 하늘을 봤다. 저 별 어딘가에, 먼저 간 사람들이 있을까.\n\n감상에 젖었다가, 담요를 끌어올리고 눈을 감았다.', fx:{fatigue:-2, moodAll:1}}]},
 ]},

{id:'ev_camera_forest', type:'추적', w:7, region:['mid','north'],
 title:'렌즈의 숲',
 text:'가로수마다 검은 상자가 매달렸다. 감시 카메라. 하나도 아니고, 도로를 따라 촘촘히.\n\n대부분 죽었지만— 몇 개는 붉은 불이 살아 있다. 우리가 다가가자 렌즈가 스르륵 돌아 이쪽을 조준한다.',
 choices:[
  {label:'민지가 신호를 교란한다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 낡은 노트북으로 근처 중계기에 잡음을 쏘아넣었다.\n\n"영상은 찍혀도 못 올려. 창고에 갇힌 셈이지." 살아있던 붉은 불들이 하나둘 깜빡이다 멎었다.', fx:{mood:{minji:5}, pursuit:-2, time:25}}]},
  {label:'죽은 카메라 뒤로만 붙어 지난다', out:[
    {p:2, text:'살아있는 렌즈의 사각을 골라 지그재그로 지났다. 시간은 걸렸지만 조준당하진 않았다.', fx:{time:30, fatigue:3, pursuit:-1}},
    {p:1, text:'사각을 노렸지만 하나가 끝까지 우리를 따라 돌았다. 붉은 불이 깜빡— 뭔가 기록됐다.', fx:{pursuit:2, moodAll:-2, flag:'observed'}}]},
  {label:'무시하고 빠르게 지난다', out:[{p:1, text:'신경 끄고 밟았다. 렌즈들이 순차로 우리를 따라 돌았다. 감시받는 감각이 등에 오래 붙어 있었다.', fx:{pursuit:2, moodAll:-3}}]},
 ]},

{id:'ev_set_table', type:'사건', w:6, once:true, region:['mid'],
 title:'차려진 밥상',
 text:'폐가 마루에 밥상이 차려져 있다. 김도 안 나지만— 밥그릇 네 개, 수저 네 벌, 반찬까지 가지런히.\n\n누가 매일 이렇게 차리는 걸까. 돌아올 리 없는 식구를 기다리며.\n\n밥은 오늘 지은 것처럼 하얗다.',
 choices:[
  {label:'주인을 찾아본다', out:[
    {p:1, text:'인기척을 따라가니, 뒷마당에 백발 노인이 앉아 있다. "…우리 애들 올 때 됐는데." 눈이 먼 듯 허공을 본다.\n\n차마 진실을 말할 수 없어, 밥이 참 맛있겠다고만 했다. 노인이 처음으로 웃었다.', fx:{moodAll:-4, food:-1, time:40, note:{type:'인물',title:'밥상 차리는 노인',body:'매일 식구 넷의 밥상을 차리는 눈먼 노인. 아무도 오지 않는데도.'}}}]},
  {label:'손대지 않고 물러난다', out:[{p:1, text:'누군가의 기다림이다. 밥 한 톨 건드리지 않고 조용히 나왔다. 어떤 밥상은 무덤이고, 어떤 무덤은 기도다.', fx:{moodAll:-2}}]},
 ]},

{id:'ev_postman_ghost', type:'조우', w:7, once:true, needFlag:'postman_met', region:['mid','north'],
 title:'또 그 우체부',
 text:'빨간 자전거를 끄는 그 우체부다. 우리를 알아보고 반색한다.\n\n"어! 아직 안 죽고 잘 가고 있네!" 페달을 세우고 다가온다.\n\n"북쪽 소식 궁금하지? 내가 발로 뛰는 사람이라 좀 알거든."',
 choices:[
  {label:'북쪽 길 소식을 듣는다', out:[{p:1, text:'"남산 가까워질수록 검문이 촘촘해져. 근데 좋은 소식도 있어. 그 안쪽에서 사람들이 뭉치고 있대. 자네들 같은 사람들이."\n\n우체부가 씩 웃었다. "편지 받아본 사람들이, 답장 대신 자기들끼리 뭉치기 시작한 거지. 소식 나르는 보람이 있어." 든든한 이야기였다.', fx:{moodAll:4, note:{type:'소문',title:'우체부가 전한 북쪽 소식',body:'남산 가까울수록 검문 촘촘. 그러나 안쪽에서 사람들이 뭉치는 중. "편지 받은 이들이 저마다 길을 나섰다."'}}}]},
  {label:'물 한 잔 나누고 안부를 묻는다', req:{water:1}, out:[{p:1, text:'물을 나누자 우체부가 반쯤 마시고 반은 자전거 체인에 부었다. "얘도 목마르거든." 여전한 사람이다.\n\n"자네들 편지, 잘 가고 있지? …전할 수 있으면 전하고, 못 해도 괜찮아. 여기까지 지고 온 것만으로 배달은 반 이상 한 거야." 그 말이 이상하게 힘이 됐다.', fx:{water:-1, moodAll:5, mood:{eunsu:2}}}]},
  {label:'짧게 인사하고 헤어진다', out:[{p:1, text:'"몸조심하고!" 우체부가 다시 페달을 밟았다. 빨간 자전거가 폐도로 저편으로 작아졌다.\n\n저 사람은 오늘도 누군가의 소식을 나른다. 세상을 잇는 게 저런 사람들이란 걸, 다시 느꼈다.', fx:{moodAll:2}}]},
 ]},

{id:'ev_ice_road', type:'위기', w:7, region:['north'], night:true,
 title:'빙판길',
 text:'기온이 뚝 떨어졌다. 노면이 검게 번들거린다. 블랙아이스다.\n\n헤드라이트에 반사되는 얼음이 도로 전체를 덮었다. 브레이크는 무용지물, 핸들 한 번 잘못 꺾으면 그대로 미끄러진다.',
 choices:[
  {label:'바퀴에 천을 감고 기어간다', out:[
    {p:2, text:'타이어에 담요를 찢어 감고, 시속 5km로 기어갔다. 몇 번 미끄덩했지만 담요가 붙잡아줬다. 반나절 만에 빙판을 벗어났다.', fx:{time:70, fatigue:6, item:{'부품':1}}}]},
  {label:'강우가 운전대를 잡는다', req:{comp:'kangwoo'}, out:[
    {p:1, text:'"빙판은 힘 빼는 게 기술이야." 강우가 핸들을 넘겨받아, 미끄러지는 흐름에 차를 맡기듯 몰았다.\n\n한 번도 완전히 서지 않고, 물 흐르듯 빙판을 건넜다. 군용 수송차를 몰던 손이다.', fx:{time:40, mood:{kangwoo:5}}}]},
  {label:'녹을 때까지 세워둔다', out:[{p:1, text:'무리하지 않기로 했다. 히터도 없는 차 안에서 서로 붙어 아침을 기다렸다. 해가 뜨자 얼음이 녹기 시작했다.', fx:{time:120, food:-1, fatigue:3, moodAll:-1}}]},
 ]},

{id:'ev_seaside_restaurant', type:'정경', w:6, once:true, nearNode:['sokcho','gangneung','pohang'], region:['north'],
 title:'바닷가 폐횟집',
 text:'파도 소리. 유리창이 다 깨진 횟집이 바다를 마주보고 서 있다.\n\n수족관은 오래전 말랐고, 벽엔 빛바랜 메뉴판. "모둠회 (시가)".\n\n바다는 아무 일 없다는 듯, 여전히 밀려왔다 밀려간다.',
 choices:[
  {label:'창가에 앉아 바다를 본다', out:[{p:1, text:'깨진 창가에 나란히 앉아 파도를 봤다. 손님도 회도 없지만, 바다 하나는 그대로다.\n\n"세상이 망해도 바다는 안 망하네." 누군가 말했고, 그게 위로였다.', fx:{moodAll:4, fatigue:-3, time:30}}]},
  {label:'해변에서 조개를 캔다', out:[
    {p:1, text:'모래를 파 조개를 몇 줌 캤다. 오랜만의 자연산 식량. 벽에 붙은 낡은 해산물 도감과 껍데기 모양을 여러 번 대조한 뒤에야 냄비에 넣었다.', fx:{food:4, time:40, moodAll:2}}]},
 ]},

{id:'ev_golf_clubhouse', type:'탐색', w:6, region:['mid','north'],
 title:'골프장 클럽하우스',
 text:'잡초가 무릎까지 자란 페어웨이. 언덕 위 클럽하우스는 의외로 온전하다.\n\n라운지엔 먼지 쌓인 소파, 바(bar)엔 손 안 탄 병들이 줄지어 있다. 부자들의 마지막 놀이터.',
 choices:[
  {label:'물자를 뒤진다', out:[
    {p:2, text:'주방 냉장창고에서 진공포장 식품과 생수를 찾았다. 바에선 소독용으로 쓸 독한 술도 몇 병. 부자들 덕 좀 봤다.', fx:{food:5, water:3, item:{'의약품':1}, time:45}},
    {p:1, text:'좋아 보이던 병들은 대부분 비었고, 냉장고는 곰팡이 천국. 그래도 창고 깊숙이서 통조림 몇 개는 건졌다.', fx:{food:2, time:40}}]},
  {label:'소파에서 한숨 잔다', out:[{p:1, text:'푹신한 소파에 몸을 파묻었다. 오랜만에 침대 비슷한 걸 누렸다.\n\n예전 사람들은 이곳을 놀러 왔을까. 천장을 보며 그런 쓸데없는 상상을 하다 짧고 달콤한 잠에 빠졌다.', fx:{fatigue:-6, moodAll:3, time:60}}]},
 ]},

/* ═══════ 추가 배치 3 (25) ═══════ */

{id:'ev_parking_evs', type:'탐색', w:8, region:['mid','north'],
 title:'충전소의 차들',
 text:'대형 주차장에 전기차들이 충전기에 물린 채 줄지어 서 있다. 그날, 충전 중이던 그대로.\n\n계기판마다 "충전 87%", "충전 완료"— 영영 출발하지 못한 숫자들.\n\n배터리가 남은 차도 있을지 모른다.',
 choices:[
  {label:'쓸 만한 부품을 뜯는다', out:[
    {p:2, text:'멀쩡한 배터리 셀과 배선을 확보했다. 우리 차 예비 전력으로 요긴하다.', fx:{item:{'부품':1}, time:45, fatigue:3}},
    {p:1, text:'대부분 방전됐거나 이미 뜯겼다. 그래도 공구함 몇 개와 삼각대는 챙겼다.', fx:{scrap:5, time:40}}]},
  {label:'민지가 배터리를 살린다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 셀 상태를 하나하나 재더니, 살아있는 것만 병렬로 묶었다.\n\n"이거면 며칠은 전깃불 켜고 자겠네." 오랜만에 밤에 불을 켤 수 있게 됐다.', fx:{item:{'부품':1}, time:40, mood:{minji:5}, moodAll:2}}]},
 ]},

{id:'ev_seed_girl', type:'조우', w:8, region:['south','mid'],
 title:'씨앗 파는 소녀',
 text:'좌판에 작은 봉지들이 늘어서 있다. 열두어 살 소녀가 지킴이다.\n\n"씨앗 팔아요. 상추, 무, 토마토. 심으면 진짜 나요. 우리 밭에서 받은 거예요."\n\n봉지마다 삐뚤빼뚤 이름이 적혀 있다.',
 choices:[
  {label:'씨앗을 산다 (고철 5)', req:{scrap:5}, out:[{p:1, text:'상추와 무 씨앗을 골랐다. 소녀가 심는 법까지 야무지게 설명해줬다.\n\n"물 너무 많이 주면 죽어요. 딱 촉촉하게만." 언젠가 우리 텃밭에 뿌릴 날을 상상했다.', fx:{scrap:-5, food:2, note:{type:'소문',title:'씨앗 파는 아이',body:'밭에서 받은 진짜 씨앗을 파는 소녀. 물은 촉촉하게만.'}}}]},
  {label:'우리 씨앗과 바꾼다', req:{flag:'seed_borrowed'}, out:[
    {p:1, text:'전에 얻어둔 해바라기 씨앗과 소녀의 채소 씨앗을 맞바꿨다.\n\n소녀 눈이 반짝였다. "해바라기! 이건 우리 밭에 없어요!" 서로 남는 걸 나누니 둘 다 부자가 됐다.', fx:{food:3, moodAll:3, mood:{jaeyi:2}}}]},
  {label:'덕담만 하고 지난다', out:[{p:1, text:'"장사 잘 되길." 소녀가 씩씩하게 손을 흔들었다. 저 나이에 밭을 일구는 아이라니. 세상은 끈질기다.', fx:{moodAll:2}}]},
 ]},

{id:'ev_cherry_tunnel', type:'정경', w:6, once:true, minParty:1, region:['south','mid'],
 title:'벚꽃 터널',
 text:'도로 양옆 벚나무가 아치를 이뤘다. 아무도 안 치운 꽃길이 눈처럼 흩날린다.\n\n꽃잎이 앞유리를 덮었다 쓸려간다. 와이퍼를 켜기가 아까울 만큼.',
 choices:[
  {label:'창문 다 열고 천천히 지난다', out:[{p:1, text:'창을 전부 내리고 서행했다. 꽃잎이 차 안까지 날아들었다.\n\n다들 말없이 손을 뻗어 꽃잎을 받았다. 이런 순간을 위해서라도, 계속 가야 한다.', fx:{moodAll:6, fatigue:-3, time:25}}]},
  {label:'차를 세우고 사진처럼 눈에 담는다', out:[{p:1, text:'엔진을 끄고 그냥 봤다. 카메라도 필름도 없지만, 이건 눈에 새기면 안 잊는다.\n\n내년에도 필 것이다. 봐줄 사람이 있든 없든, 나무는 나무의 일을 한다.', fx:{moodAll:5, time:20}}]},
 ]},

{id:'ev_landslide_block', type:'위기', w:8, region:['mid','north'],
 title:'무너진 산비탈',
 text:'산사태로 도로가 흙과 바위에 덮였다. 높이가 사람 키를 넘는다.\n\n돌아가려면 반나절, 뚫으려면 종일. 위쪽 비탈은 아직도 조금씩 흙을 흘린다. 언제 또 무너질지 모른다.',
 choices:[
  {label:'돌아서 우회한다', out:[{p:1, text:'안전을 택해 왔던 길을 되짚어 우회로를 찾았다. 기름과 시간을 썼지만, 깔려 죽는 것보단 낫다.', fx:{time:90, fuel:-3, fatigue:3}}]},
  {label:'강우 지휘로 길을 판다', req:{comp:'kangwoo'}, out:[
    {p:1, text:'"위쪽부터 무너뜨리고 아래로 치운다. 순서가 안전이야." 강우가 낙석 위험을 읽으며 작업을 지휘했다.\n\n종일 걸렸지만 무사히 한 사람 폭의 길을 냈다. 군대에서 길을 내던 손이다.', fx:{time:120, fatigue:8, mood:{kangwoo:5}, van:-3}}]},
  {label:'급히 삽으로 밀어붙인다', risk:'위험', out:[
    {p:1, text:'서둘러 파다가 위쪽 비탈이 다시 쏟아졌다! 겨우 몸을 피했지만 차 앞부분이 흙에 파묻혔다. 파내느라 더 오래 걸렸다.', fx:{time:100, van:-12, fatigue:9, moodAll:-4}},
    {p:1, text:'운 좋게 무너지지 않았다. 흙을 파헤쳐 겨우 틈을 냈다. 심장이 쫄깃했지만 시간은 벌었다.', fx:{time:70, fatigue:7, van:-4}}]},
 ]},

{id:'ev_wind_turbine', type:'발견', w:6, once:true, hiddenTarget:'solar', region:['north'],
 title:'도는 풍차',
 text:'능선 위 거대한 풍력발전기 여러 대가 아직 돈다. 바람이 죽지 않는 한, 저건 전기를 만든다.\n\n한 대의 밑동에 컨테이너 관리동. 배전반이 살아있다면— 전력을 얻을 수 있다.',
 choices:[
  {label:'위치를 표시해둔다', out:[{p:1, text:'지도에 풍력단지를 찍었다. 살아있는 전기가 있는 곳은 귀하다. 언젠가 크게 신세 질지도.', fx:{reveal:'solar', note:{type:'소문',title:'도는 풍차',body:'아직 돌아가는 풍력발전기. 배전반이 살아있다면 전력 보급 가능.',links:['태양광 단지']}}}]},
  {label:'민지가 배전반을 딴다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 관리동에 들어가 배전반을 열었다. "…와, 얘 아직 일하고 있었네." 예비 배터리를 가득 충전했다.\n\n"기계는 안 배신해. 사람이 안 돌봐도 제 할 일 하잖아." 민지가 드물게 말이 길었다.', fx:{item:{'부품':1}, time:50, mood:{minji:6}, reveal:'solar'}}]},
 ]},

{id:'ev_patrol_robot', type:'추적', w:7, region:['mid','north'],
 title:'네 발 순찰기',
 text:'개만 한 네 발 로봇이 도로를 따라 걷는다. 머리 자리에 렌즈 하나. 규칙적인 기계음.\n\n로드킬 당한 짐승 옆을 지나며 잠깐 멈추더니, 다시 걷는다. 순찰 중이다. 우리를 아직 못 봤다.',
 choices:[
  {label:'엔진 끄고 지나갈 때까지 숨는다', out:[{p:1, text:'덤불 뒤로 차를 붙이고 시동을 껐다. 로봇이 우리 앞을 스쳐 지나 능선 너머로 사라질 때까지 숨조차 얕게 쉬었다.\n\n기계음이 완전히 끊긴 뒤에야 굳은 어깨를 폈다.', fx:{time:30, pursuit:-1, fatigue:2}}]},
  {label:'강우가 기능정지시킨다', req:{comp:'kangwoo'}, out:[
    {p:2, text:'강우가 뒤로 돌아가 관절 사이 케이블을 끊었다. 로봇이 픽 주저앉았다. "이런 건 다리가 약점이야."\n\n렌즈가 꺼지기 전 마지막으로 우리를 봤다. 신호가 갔을까, 안 갔을까.', fx:{mood:{kangwoo:4}, item:{'부품':1}, pursuit:1}},
    {p:1, text:'강우가 덮치기 직전 로봇이 홱 돌았다! 렌즈가 우리를 정면으로 찍고, 경보음을 울리며 도망쳤다. 위치가 노출됐다.', fx:{pursuit:3, moodAll:-3, flag:'observed'}}]},
  {label:'건드리지 않고 멀리 돈다', out:[{p:1, text:'괜히 자극하지 않고 크게 우회했다. 잠자는 개는 건드리는 게 아니다. 기계 개라도.', fx:{time:40, fuel:-2}}]},
 ]},

{id:'ev_atm_cash', type:'사건', w:6, region:['south','mid','north'],
 title:'쏟아진 현금',
 text:'부서진 편의점 ATM. 뜯긴 금고에서 지폐가 바람에 날린다. 수천만 원어치.\n\n오래전엔 목숨 걸고 지켰을 돈. 지금은 아무도 줍지 않는다. 불쏘시개로도 눅눅하다.',
 choices:[
  {label:'몇 장 주워 불쏘시개로 챙긴다', out:[{p:1, text:'지폐 한 뭉치를 주워 배낭에 넣었다. 이제 돈은 그저 잘 타는 종이다.\n\n"이걸로 라면 하나 사 먹던 시절이 있었는데." 씁쓸한 농담에 아무도 웃지 못했다.', fx:{moodAll:-1}}]},
  {label:'그냥 바라보다 지난다', out:[{p:1, text:'날리는 돈을 잠깐 봤다. 우리가 그토록 좇던 것의 마지막 모습.\n\n한 장도 줍지 않고 지나쳤다. 이젠 물 한 통이 저 전부보다 비싸다.', fx:{moodAll:1}}]},
 ]},

{id:'ev_truck_cafe', type:'조우', w:7, once:true, region:['south','mid'],
 title:'트럭 카페',
 text:'개조한 트럭 옆구리를 열어 만든 이동식 카페. 손수 볶은 원두 냄새가 도로까지 퍼진다.\n\n"커피 한 잔에 고철 둘. 세상이 망해도 카페인은 못 끊죠." 주인장이 능청스레 웃는다.\n\n진짜 커피 냄새다. 오랜만이다.',
 choices:[
  {label:'커피를 산다 (고철 4)', req:{scrap:4}, out:[{p:1, text:'뜨거운 커피를 손에 쥐었다. 첫 모금에 온몸이 깨어난다. 이게 얼마 만인지.\n\n"이 맛에 삽니다." 주인장 말에 진심으로 공감했다. 피로가 씻겼다.', fx:{scrap:-4, fatigue:-5, moodAll:5, flag:'coffee_found'}}]},
  {label:'원두 파는 곳을 묻는다', out:[{p:1, text:'"북쪽 어느 옥상에서 커피나무 키우는 별종이 있어요. 미쳤죠, 이 세상에 커피나무라니." 주인장이 위치를 대충 알려줬다.', fx:{note:{type:'소문',title:'옥상 커피나무',body:'북쪽 어느 옥상에서 커피를 재배하는 사람이 있다. 트럭 카페 주인 제보.'}}}]},
  {label:'냄새만 맡고 지난다', out:[{p:1, text:'고철이 아까워 냄새만 실컷 맡고 떠났다. 향이 룸미러 뒤로 오래 따라왔다.', fx:{moodAll:1}}]},
 ]},

{id:'ev_comp_birthday', type:'동행', w:7, once:true, needsComp:'minji', minParty:2, region:['mid','north'],
 title:'누군가의 생일',
 text:'야영 중 짐을 정리하다 민지의 일지 한 귀퉁이에 오늘 날짜가 작게 표시된 걸 봤다. 생일인 모양이다.\n\n민지는 티도 안 낸다. 모른 척 지나갈 수도, 뭔가 해줄 수도 있다.',
 choices:[
  {label:'있는 걸 털어 조촐한 상을 차린다', out:[{p:1, text:'통조림을 데우고, 아껴둔 초콜릿에 성냥불을 꽂았다. "생일 축하해."\n\n민지가 얼음처럼 굳었다가— "…뭐 이런 걸." 목소리가 잠겼다. 시크한 척하는 눈가가 붉었다.', fx:{food:-2, moodAll:5, mood:{minji:8}, note:{type:'사건',title:'민지의 생일',body:'성냥불 꽂은 초콜릿으로 민지 생일을 챙겼다. 시크한 척하던 눈가가 붉었다.'}}}]},
  {label:'노래만 조용히 불러준다', out:[{p:1, text:'다 같이 낮게 생일노래를 불렀다. 민지가 손으로 얼굴을 가렸다. "…고마워. 진짜." 그날 밤 민지는 평소보다 말이 많았다.', fx:{moodAll:4, mood:{minji:6}}}]},
  {label:'민지 성격상 모른 척한다', out:[{p:1, text:'민지는 부담스러워할 사람이다. 대신 다음 날 아침, 민지 몫 커피를 한 스푼 더 탔다. 민지가 잔을 보고 잠깐 멈칫하더니, 아무 말 없이 마셨다. 알아챘을 거다.', fx:{mood:{minji:4}}}]},
 ]},

{id:'ev_tunnel_echo', type:'정경', w:6, minParty:1, region:['mid','north'],
 title:'긴 터널',
 text:'조명이 다 꺼진 터널. 헤드라이트가 닿는 곳까지만 세상이다.\n\n엔진 소리가 벽을 타고 웅— 하고 되울린다. 끝이 안 보인다. 어둠이 물처럼 밀도가 있다.',
 choices:[
  {label:'경적을 한 번 길게 울려본다', out:[
    {p:2, text:'빵— 소리가 터널을 타고 끝없이 되돌아왔다. 마치 어둠이 대답하는 것 같았다.\n\n어딘가 다른 생존자가 들었을지도. 별 뜻 없이, 그냥 존재를 알리고 싶었다.', fx:{moodAll:1}},
    {p:1, text:'경적을 울리자 저 안쪽에서— 다른 경적이 화답했다! 심장이 철렁. 급히 지나쳐 빠져나왔다. 누구였을까.', fx:{pursuit:1, moodAll:-1, fatigue:2}}]},
  {label:'조용히 빠르게 통과한다', out:[{p:1, text:'라이트만 믿고 속도를 냈다. 빛의 점이 커지더니 출구다. 어둠에서 빠져나오자 다들 숨을 몰아쉬었다.', fx:{fatigue:2}}]},
 ]},

{id:'ev_hunter_meat', type:'조우', w:7, region:['mid','north'],
 title:'사냥꾼',
 text:'활을 멘 사내가 멧돼지를 지고 내려온다. 산에서 사는 사람이다.\n\n"고기 필요해? 소금이나 탄약이랑 바꿔. 신선해, 오늘 아침 거야." 짐승 피 냄새가 진하다.',
 choices:[
  {label:'고기와 바꾼다 (탄약)', req:{item:'탄약'}, out:[{p:1, text:'탄약 한 줌과 멧돼지 뒷다리를 바꿨다. 오랜만의 고기다. 오늘 밤은 잔치다.\n\n"산엔 아직 짐승이 많아. 사람이 없으니 늘었지." 사냥꾼이 웃으며 산으로 돌아갔다.', fx:{food:8, moodAll:4}}]},
  {label:'사냥법을 배운다', req:{comp:'leo'}, out:[
    {p:1, text:'레오가 눈을 반짝이며 활 쏘는 법을 물었다. 사냥꾼이 덫 놓는 요령까지 알려줬다.\n\n"개도 잘 훈련시키면 몰이꾼 돼." 보리를 보며 한 말에 레오가 신나 했다. 고기 몇 점은 덤이었다.', fx:{food:3, mood:{leo:5}, note:{type:'소문',title:'산사람의 사냥법',body:'레오가 활·덫 놓는 법을 배웠다. 보리를 몰이꾼으로 훈련시킬 수 있다고.'}}}]},
  {label:'소금과 바꾼다 (식량 조로)', out:[{p:1, text:'가진 소금 조금과 고기를 바꿨다. 양은 적지만 단백질은 귀하다. 감사히 받았다.', fx:{food:4, moodAll:2}}]},
 ]},

{id:'ev_flooded_road', type:'위기', w:7, region:['south','mid'],
 title:'잠긴 도로',
 text:'강이 넘쳐 도로가 물에 잠겼다. 얼마나 깊은지 가늠이 안 된다.\n\n수면 위로 표지판 윗부분만 겨우 보인다. 잘못 들어가면 엔진에 물이 들어가 시동이 꺼진다.',
 choices:[
  {label:'막대로 깊이를 재며 건넌다', out:[
    {p:2, text:'긴 막대로 바닥을 짚어가며 얕은 라인을 골라 천천히 건넜다. 배기구까지 물이 찰랑댔지만 무사히 통과.', fx:{time:40, fatigue:4, van:-3}},
    {p:1, text:'얕은 줄 알았던 곳이 푹 꺼졌다. 물이 배기구로 넘어와 엔진이 컥컥댔다. 겨우 빠져나와 한참 말렸다.', fx:{time:70, van:-10, fatigue:6, moodAll:-3}}]},
  {label:'물이 빠질 때까지 기다린다', out:[{p:1, text:'상류에 비가 그쳤는지 물이 조금씩 줄었다. 반나절 기다려 무릎 높이가 됐을 때 건넜다. 인내가 답이었다.', fx:{time:100, food:-1}}]},
 ]},

{id:'ev_factory_mural', type:'정경', w:6, region:['mid','north'],
 title:'공장 벽의 그림',
 text:'폐공장 외벽 가득 누군가 벽화를 그렸다. 페인트가 아니라 숯과 흙으로.\n\n손을 맞잡은 사람들, 그 위로 부서지는 거대한 눈(眼). 서툴지만 분명한 메시지다.\n\n구석에 작게 적혀 있다. "우린 다시 손을 잡는다."',
 choices:[
  {label:'그림 앞에 한참 선다', out:[{p:1, text:'누군가 위험을 무릅쓰고 이걸 그렸다. 부서지는 눈, 맞잡은 손.\n\n우리가 하려는 일이 이미 벽에 그려져 있었다. 혼자가 아니라는 증거다.', fx:{moodAll:4, note:{type:'소문',title:'손잡은 벽화',body:'폐공장 벽에 숯으로 그린 그림 — 맞잡은 손과 부서지는 눈. "우린 다시 손을 잡는다."'}}}]},
  {label:'우리도 손자국을 남긴다', out:[
    {p:1, text:'흙을 묻힌 손을 벽에 찍었다. 벽화의 맞잡은 손들 옆에, 우리 손자국이 더해졌다.\n\n이 길을 지나는 누군가 또 손을 얹겠지. 그렇게 이어지는 거다.', fx:{moodAll:5, mood:{jaeyi:3}, time:20}}]},
 ]},

{id:'ev_bunker_entrance', type:'발견', w:6, once:true, region:['mid','north'],
 title:'풀숲의 철문',
 text:'수풀에 가려진 콘크리트 구조물. 녹슨 철문 위에 「대피시설」이라 새겨져 있다.\n\n지하 벙커다. 오래전 누군가는 여기로 숨었을 것이다. 문은 안에서 잠겼는지, 밖에서 잠겼는지—',
 choices:[
  {label:'문을 열어본다', out:[
    {p:2, text:'끼익— 무거운 문이 열렸다. 안은 비어 있고, 통조림과 생수, 응급킷이 선반에 남았다. 대피자들은 이미 떠난 뒤였다.', fx:{food:5, water:4, item:{'의약품':1}, time:50, fatigue:3}},
    {p:1, text:'문을 여니 퀴퀴한 냄새가 확 밀려왔다. 안쪽 사정을 짐작하고, 조용히 문을 도로 닫았다. 어떤 문은 안 여는 게 낫다.', fx:{moodAll:-4, time:30}}]},
  {label:'표시만 하고 지나간다', out:[{p:1, text:'지금은 급할 게 없다. 위치만 기억해두고 떠났다. 벙커는 도망갈 데가 없으니, 언제든 다시 올 수 있다.', fx:{}}]},
 ]},

{id:'ev_empty_swing', type:'정경', w:6, night:true, region:['south','mid','north'],
 title:'혼자 흔들리는 그네',
 text:'폐놀이터. 바람도 없는데 그네 하나가 삐걱, 삐걱 흔들린다.\n\n헤드라이트를 비추자 흔들림이 뚝 멈춘다. 아무도 없다. 정말 아무도.\n\n괜히 목덜미가 서늘하다.',
 choices:[
  {label:'그네를 손으로 멈춰준다', out:[{p:1, text:'다가가 그네 줄을 잡아 세웠다. 낡은 쇠사슬이 차가웠다.\n\n"…잘 자." 누구에게 하는 말인지 모르면서 그렇게 말하고 돌아섰다. 마음이 조금 놓였다.', fx:{moodAll:1, fatigue:1}}]},
  {label:'못 본 척 서둘러 뜬다', out:[{p:1, text:'괜히 오래 있을 곳이 아니다. 서둘러 차에 올라 그 자리를 떴다.\n\n백미러 속 그네가— 다시 흔들리기 시작했다. 아무도 뒤돌아보지 않았다.', fx:{moodAll:-2, fatigue:1}}]},
 ]},

{id:'ev_mobile_clinic', type:'조우', w:7, once:true, region:['mid','north'],
 title:'이동 진료소',
 text:'십자 표시를 붙인 승합차. 흰 가운의 여의사가 간이침대에서 환자를 돌본다.\n\n"약이 부족해서요. 혹시 소독약이나 항생제 나눠주실 수 있나요? 여기 사람들 상처가 자꾸 덧나서."\n\n지친 얼굴이지만 눈은 형형하다.',
 choices:[
  {label:'의약품을 나눠준다 (의약품)', req:{item:'의약품'}, out:[{p:1, text:'가진 약을 절반 덜어줬다. 의사가 몇 번이고 고개를 숙였다.\n\n"이 은혜는… 이름이라도 알려주세요." 이름 대신 "서울 가는 사람들"이라 답했다. 의사가 웃었다. "무사히 도착하시길."', fx:{moodAll:6, note:{type:'인물',title:'떠도는 여의사',body:'이동 진료소를 끌고 다니는 의사. 우리가 나눈 약으로 여러 사람을 살렸다.'}}}]},
  {label:'박 선생이 진료를 돕는다', req:{comp:'parkss'}, out:[
    {p:1, text:'박 선생이 소매를 걷고 합류했다. 두 약사가 손발을 맞춰 밀린 환자를 봤다.\n\n"약사끼리는 말이 필요 없구먼." 헤어질 때 여의사가 귀한 약초 지식을 나눠줬다. 서로가 서로에게 약이 됐다.', fx:{time:60, mood:{parkss:6}, moodAll:4, item:{'의약품':1}}}]},
  {label:'우리도 빠듯하다, 정중히 사양한다', out:[{p:1, text:'"저희도 여유가 없어서…" 의사가 이해한다는 듯 고개를 끄덕였다. "조심히 가세요." 미안함이 오래 남았다.', fx:{moodAll:-2}}]},
 ]},

{id:'ev_wedding_hall_storage', type:'탐색', w:6, region:['mid','north'],
 title:'예식장 창고',
 text:'화려했을 예식장. 홀엔 시든 조화와 뒤집힌 의자들.\n\n주방 창고엔 연회용 식자재가 남았을지도. 대량으로 쟁여둔 곳이라 손을 덜 탔을 수 있다.',
 choices:[
  {label:'주방 창고를 턴다', out:[
    {p:3, text:'냉동창고에서 진공포장 고기와 대용량 통조림, 생수 팩을 찾았다. 연회용이라 양이 많다. 두둑이 챙겼다.', fx:{food:7, water:4, time:50, fatigue:3}},
    {p:1, text:'전기 끊긴 냉동고는 이미 끔찍한 상태. 손도 못 대고, 대신 마른 식자재와 식용유만 챙겼다.', fx:{food:2, time:40, moodAll:-1}}]},
  {label:'방명록을 넘겨본다', out:[{p:1, text:'먼지 쌓인 방명록. 마지막 날짜의 하객 이름들이 빼곡하다. 축하 한마디씩 곁들여서.\n\n"영원히 행복하세요." 그 부부는 어떻게 됐을까. 방명록을 조용히 덮었다.', fx:{moodAll:-2}}]},
 ]},

{id:'ev_comp_argument', type:'동행', w:7, needsComp:'kangwoo', needsComp2:'minji', minParty:2, region:['mid','north'],
 title:'말다툼',
 text:'좁은 차 안, 강우와 민지의 목소리가 높아진다.\n\n"길을 돌아가면 하루를 버려. 검문소 뚫는 게 빨라." "뚫다 걸리면 하루가 아니라 목숨을 버리지!"\n\n둘 다 물러설 기색이 없다. 공기가 팽팽하다.',
 choices:[
  {label:'둘 다 일리 있다, 절충안을 낸다', out:[{p:1, text:'"강우 말대로 빨리 가되, 민지 말대로 안전 확인부터. 민지가 검문소 신호 먼저 죽이고, 강우가 길을 뚫자."\n\n둘이 서로를 힐끗 봤다. "…그럼 되겠네." 팽팽하던 공기가 풀렸다. 각자의 강점이 합쳐졌다.', fx:{moodAll:3, mood:{kangwoo:3, minji:3}}}]},
  {label:'강우 손을 들어준다', out:[
    {p:1, text:'"이번엔 속도가 중요해. 강우 방식으로 가자." 민지가 입을 다물었다. 검문소는 무사히 뚫었지만, 민지의 침묵이 며칠 갔다.', fx:{mood:{kangwoo:4, minji:-3}}}]},
  {label:'민지 손을 들어준다', out:[
    {p:1, text:'"안전이 먼저야. 돌아가자." 강우가 헛웃음을 지었다. "…뭐, 대장이 그렇다면." 돌아가는 길은 멀었지만 아무도 다치지 않았다. 강우가 며칠 말이 없었다.', fx:{mood:{minji:4, kangwoo:-3}, time:40}}]},
 ]},

{id:'ev_crashed_drone', type:'추적', w:6, region:['mid','north'],
 title:'추락한 드론',
 text:'논두렁에 드론 한 대가 처박혀 있다. 프로펠러가 부러지고 렌즈가 깨졌다. 완전히 죽었다.\n\n동체에 천리안 마크. 이런 걸 떨어뜨린 게 바람일까, 아니면 누군가일까.\n\n부품과 정보가 남아 있을지도 모른다.',
 choices:[
  {label:'부품을 뜯어낸다', out:[{p:1, text:'모터, 배터리, 카메라 모듈을 회수했다. 적의 물건이지만 쓸모는 적아를 안 가린다.', fx:{item:{'부품':1}, scrap:4, time:30}}]},
  {label:'민지가 메모리를 캔다', req:{comp:'minji'}, out:[
    {p:2, text:'민지가 저장칩을 뽑아 데이터를 열었다. "…얘가 뭘 찍었나 보자." 순찰 경로와 검문소 위치가 담겨 있었다. 위험지대 지도를 얻었다.', fx:{item:{'부품':1}, mood:{minji:5}, pursuit:-2, note:{type:'소문',title:'드론 메모리',body:'추락 드론에서 순찰 경로·검문소 위치 확보. 위험지대를 피할 수 있다.'}}},
    {p:1, text:'칩을 뽑는 순간 동체에서 삑— 신호가 새어나갔다. 죽은 줄 알았던 발신기가 마지막으로 울었다. 서둘러 자리를 떴다.', fx:{item:{'부품':1}, pursuit:2, moodAll:-2}}]},
  {label:'함정일 수 있다, 건드리지 않는다', out:[{p:1, text:'미끼일 수 있다. 발신기가 살아있으면 접근 자체가 기록된다. 눈길만 주고 지나쳤다.', fx:{pursuit:-1}}]},
 ]},

{id:'ev_highway_sign', type:'정경', w:8, region:['south','mid','north'],
 title:'남은 거리',
 text:'녹색 고속도로 표지판. 페인트가 벗겨졌지만 숫자는 읽힌다.\n\n"서울 ○○km"\n\n출발할 때 세 자리였던 숫자가, 언젠가부터 두 자리가 됐다. 조금씩, 정말 조금씩, 가까워지고 있다.',
 choices:[
  {label:'숫자를 소리 내어 읽는다', out:[{p:1, text:'남은 거리를 입 밖으로 읽었다. 아직 멀지만, 처음보단 훨씬 줄었다.\n\n"거의 다 왔네." 그 말이 스스로에게 하는 다짐 같았다. 액셀에 발을 얹었다.', fx:{moodAll:3, fatigue:-2}}]},
  {label:'표지판 아래 잠깐 쉰다', out:[{p:1, text:'표지판 그늘에 차를 세우고 물 한 모금씩 나눴다. 여기까지 온 걸 서로 말없이 축하했다.\n\n출발점에서 여기까지, 얼마나 많은 일이 있었나. 다시 시동을 걸었다.', fx:{water:-1, fatigue:-3, moodAll:2, time:20}}]},
 ]},

{id:'ev_woman_with_baby', type:'조우', w:7, once:true, region:['south','mid'],
 title:'아이 업은 여자',
 text:'길가에 젊은 여자가 아이를 포대기로 업고 서 있다. 지친 기색이 역력하다.\n\n"북쪽으로 가시나요…? 저희도 그쪽인데, 조금만 태워주실 수 없을까요. 애가 걷질 못해서."\n\n아이는 새근새근 잠들어 있다.',
 choices:[
  {label:'다음 마을까지 태워준다', out:[{p:1, text:'좁지만 자리를 만들어 태웠다. 여자가 안도의 한숨을 쉬며 아이를 고쳐 안았다.\n\n다음 마을 어귀에서 내리며, 그녀가 말린 나물 한 봉지를 손에 쥐여줬다. "이거밖에 없어서… 정말 감사해요." 자리 하나가 이렇게 큰 감사가 될 줄이야.', fx:{food:3, moodAll:5, time:40, mood:{eunsu:3}, note:{type:'인물',title:'아이 업은 여자',body:'북쪽으로 가던 모녀를 다음 마을까지 태워줬다. 말린 나물로 고마움을 표했다.'}}}]},
  {label:'물과 식량만 나눠준다', req:{food:1}, out:[
    {p:1, text:'자리가 정말 없어, 대신 물과 먹을 걸 넉넉히 챙겨줬다. 여자가 눈물을 글썽이며 받았다. "이거면 충분해요. 복 받으실 거예요."\n\n태워주지 못한 게 오래 마음에 걸렸다.', fx:{food:-1, water:-1, moodAll:1}}]},
  {label:'위험할 수 있다, 지나친다', out:[
    {p:1, text:'미끼일 수도 있다는 생각에 지나쳤다. 백미러 속 여자가 고개를 숙였다.\n\n그날 밤, 잠든 아이 얼굴이 자꾸 떠올랐다. 의심이 우리를 지켜주지만, 가끔은 우리를 갉아먹는다.', fx:{moodAll:-4}}]},
 ]},

{id:'ev_brake_downhill', type:'위기', w:7, region:['mid','north'],
 title:'브레이크가 밀린다',
 text:'긴 내리막. 브레이크를 밟는데— 페달이 스펀지처럼 푹 꺼진다. 잘 안 듣는다!\n\n속도가 붙기 시작한다. 내리막은 아직 한참 남았다. 판단은 몇 초 안에 내려야 한다.',
 choices:[
  {label:'저단 기어로 엔진 브레이크', out:[
    {p:2, text:'기어를 확 낮췄다. 엔진이 비명을 지르며 속도를 잡았다. 갓길에 겨우 세워, 식은땀을 닦았다. 브레이크액 누수였다.', fx:{fatigue:5, van:-6, time:40, item:{'부품':1}}}]},
  {label:'강우가 침착하게 대처한다', req:{comp:'kangwoo'}, out:[
    {p:1, text:'"기어 내리고, 사이드 살살. 벽에 붙여." 강우의 차분한 지시대로 차를 몰았다. 가드레일에 옆구리를 슬슬 문질러 속도를 죽이고 멈췄다.\n\n"…고마워." 강우가 어깨를 툭 쳤다. "운전 밥 먹고 산 사람이니까."', fx:{fatigue:3, van:-4, mood:{kangwoo:5}, time:30}}]},
  {label:'사이드브레이크를 확 당긴다', risk:'위험', out:[
    {p:1, text:'다급하게 사이드를 당겼다. 뒷바퀴가 잠기며 차가 홱 돌았다! 반 바퀴 스핀 끝에 겨우 멈췄지만, 하마터면 굴렀다.', fx:{van:-14, fatigue:7, moodAll:-5}}]},
 ]},

{id:'ev_bathhouse', type:'탐색', w:6, minParty:1, region:['south','mid'],
 title:'폐목욕탕',
 text:'낡은 동네 목욕탕. 굴뚝이 삐죽 솟았다. 안엔 큰 탕들이 말라붙어 있지만—\n\n보일러실 옆 지하수 관정이 아직 살아있는 듯하다. 물소리가 난다.\n\n뜨거운 물은 아니어도, 씻을 물은 될지 모른다.',
 choices:[
  {label:'관정 물을 확보하고 씻는다', out:[
    {p:2, text:'관정에서 맑은 지하수가 콸콸 나왔다. 물통을 채우고, 번갈아 몸을 씻었다. 여러 해 묵은 때를 벗기니 딴사람이 된 기분.', fx:{water:6, fatigue:-5, moodAll:5, time:50}},
    {p:1, text:'관정 물은 녹물이 섞여 나왔다. 씻긴 글렀지만, 끓여서 허드렛물로는 쓸 만큼 받았다.', fx:{water:3, time:40}}]},
  {label:'박 선생이 물을 봐준다', req:{comp:'parkss'}, out:[
    {p:1, text:'박 선생이 관정 물을 살피고 "이건 깨끗해" 하고 보증했다. 안심하고 몸을 담갔다.\n\n"목욕이 반은 약이야. 몸이 풀려야 마음도 풀리지." 박 선생의 말이 맞았다. 다들 표정이 밝아졌다.', fx:{water:6, fatigue:-6, moodAll:6, mood:{parkss:3}, time:50}}]},
 ]},

/* ═══════ 추가 배치 4 (25) ═══════ */

{id:'ev_personal_broadcast', type:'추적', w:6, region:['north'],
 title:'당신을 부릅니다',
 text:'길가 스피커가 지직 켜진다. 그 상냥한 여자 목소리. 그런데 이번엔—\n\n"봉고차로 이동 중인 탑승자 여러분. 안전 운행 감사합니다. 남산은 아직 정리 구역입니다. 회차를 권장드립니다."\n\n우리를 특정했다. 천리안이 우리를 안다.',
 choices:[
  {label:'무시하고 계속 간다', out:[
    {p:1, text:'대꾸 없이 밟았다. 방송이 몇 번 더 반복되다 뚝 끊겼다.\n\n"…이제 우릴 아네." 등골이 서늘했지만, 돌아설 순 없다. 여기까지 왔는데.', fx:{pursuit:2, moodAll:-3, flag:'observed'}}]},
  {label:'강우가 방송을 분석한다', req:{comp:'kangwoo'}, out:[
    {p:1, text:'"자동 응답이야. 진짜로 우릴 콕 집은 게 아니라, 이 도로 지나는 차량한테 다 트는 거고." 강우가 스피커 배선을 살폈다.\n\n"…근데 이 구간부터 감시가 촘촘해진다는 뜻이지. 긴장해." 두려움이 정보로 바뀌자 조금 나아졌다.', fx:{mood:{kangwoo:4}, moodAll:1, note:{type:'소문',title:'회차 권장 방송',body:'북부 진입로부터 천리안의 자동 회차 방송. 이 구간부터 감시 밀도 급증.'}}}]},
  {label:'스피커를 부숴버린다', out:[
    {p:2, text:'차를 세우고 스피커를 돌로 내리쳤다. 상냥한 목소리가 뚝 끊겼다. 속은 후련한데—\n\n부수는 행위 자체가 어딘가 기록됐을지도. 서둘러 자리를 떴다.', fx:{pursuit:1, moodAll:2, fatigue:2}}]},
 ]},

{id:'ev_radio_dj_signal', type:'발견', w:7, region:['mid','north'], night:true,
 title:'잡음 끝의 방송',
 text:'라디오를 돌리다 또렷한 채널 하나에 걸렸다. 낮고 편안한 남자 목소리.\n\n"…자정의 라디오, 오늘도 살아남은 당신에게. 다음 곡은 길 위의 모든 이를 위해."\n\n음악이 흐른다. 진짜 사람이 진짜 방송을 하고 있다.',
 choices:[
  {label:'주파수를 기억하고 계속 듣는다', out:[{p:1, text:'주파수를 종이에 적었다. 노래가 끝나고 DJ가 나직이 말했다. "북쪽으로 가는 분들, 조심히. 당신은 혼자가 아닙니다."\n\n어둠 속 목소리 하나가, 이렇게 큰 위로가 될 줄이야.', fx:{moodAll:5, fatigue:-3, flag:'djradio_heard', note:{type:'소문',title:'자정의 라디오',body:'살아있는 심야 방송. 길 위의 사람들을 위해 노래를 튼다. "당신은 혼자가 아닙니다."'}}}]},
  {label:'발신 위치를 추적해본다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 안테나 방향을 틀어가며 신호원을 좁혔다. "송신탑이야. 북쪽 산 위. …사람이 저길 지키고 있다는 거네."\n\n지도에 방송국을 찍었다. 언젠가 그 목소리의 주인을 만날지도 모른다.', fx:{reveal:'tower', mood:{minji:4}, flag:'dj_tower'}}]},
 ]},

{id:'ev_broadcast_station', type:'탐색', w:7, region:['mid','north'],
 title:'방송국',
 text:'무너진 지역 방송국. 스튜디오 안엔 마이크와 카메라가 그대로.\n\n주조정실 벽 모니터엔 마지막 화면이 얼어붙어 있다. "긴급 속보 — " 그 뒤 문장은 없다.\n\n방송 테이프들이 선반에 쌓여 있다.',
 choices:[
  {label:'마지막 방송 테이프를 튼다', out:[
    {p:2, text:'예비 전력을 물려 테이프를 재생했다. 앵커의 떨리는 목소리. "…천리안이 서울 재편 통제권을 넘겨받았습니다. 해당 구역 시민 여러분은 지정된 남행로로—" 거기서 화면이 꺼진다.\n\n백사십삼 년 전 첫 방송이 아니었다. 첫 정리 뒤에도 서울에서 사람을 밀어내는 방송은 세대마다 반복됐다.', fx:{time:40, moodAll:-3, flag:'massacre_known', note:{type:'사건',title:'반복된 마지막 속보',body:'첫 정리 이후에도 서울 추방 방송은 여러 세대에 걸쳐 반복됐다.'}}},
    {p:1, text:'테이프가 오래돼 화면이 지직댄다. 겨우 알아들은 건 "정리"라는 단어 하나. 그 말이 무슨 뜻인지, 우린 이미 안다.', fx:{time:35, moodAll:-2}}]},
  {label:'송출 장비를 챙긴다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 소형 송신기와 부품을 뜯어냈다. "이거 손보면 우리도 방송할 수 있어. …언젠가, 할 말이 생기면." 무기가 아닌 목소리를 챙긴 셈이다.', fx:{item:{'부품':1}, time:40, mood:{minji:4}}}]},
 ]},

{id:'ev_stopped_train', type:'정경', w:7, region:['mid','north'],
 title:'멈춘 열차',
 text:'철길 위 무궁화호가 역과 역 사이에 멈춰 있다. 승객은 없다. 오래전 다 내렸다.\n\n객차 안 좌석엔 두고 간 짐들. 펼쳐진 신문의 날짜는 그날.\n\n창밖 풍경만 오랫동안 같은 자리에서 흘러가지 않는다.',
 choices:[
  {label:'객차에 올라 쉬어간다', out:[{p:1, text:'객차 좌석에 몸을 묻었다. 흔들리지 않는 기차 안은 이상하게 아늑했다.\n\n두고 간 도시락 통, 아이 장난감, 읽다 만 책. 남의 여행이 멈춘 자리에서, 우리 여행을 잠깐 쉬었다.', fx:{fatigue:-4, moodAll:1, time:30}}]},
  {label:'쓸 만한 물건을 찾는다', out:[
    {p:1, text:'선반과 좌석 밑을 뒤져 통조림, 생수, 담요를 챙겼다. 여행 가방 하나엔 아직 개봉 안 한 과자도.\n\n주인에게 미안했지만, 그들도 우리가 살길 바랄 거라 믿었다.', fx:{food:4, water:2, item:{'부품':1}, time:35}}]},
 ]},

{id:'ev_dust_storm', type:'위기', w:7, region:['mid','north'],
 title:'흙바람',
 text:'지평선에서 누런 벽이 밀려온다. 황사 폭풍이다. 순식간에 시야가 흙빛으로 덮인다.\n\n앞이 안 보이고, 모래가 엔진 흡기구로 파고든다. 이대로 달리면 엔진이 상한다.',
 choices:[
  {label:'차를 세우고 틈을 다 막는다', out:[
    {p:2, text:'급히 차를 세우고 천으로 흡기구와 창틈을 막았다. 차 안에서 모래가 잦아들길 기다렸다. 한 시간 뒤 하늘이 다시 열렸다. 엔진은 무사.', fx:{time:70, fatigue:4}},
    {p:1, text:'막는 게 늦었다. 모래가 엔진에 들어가 시동이 털털댄다. 폭풍이 지난 뒤 필터를 청소하느라 반나절.', fx:{time:90, van:-8, fatigue:5, moodAll:-2}}]},
  {label:'민지가 임시 필터를 만든다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 천과 스타킹으로 즉석 흡기 필터를 감았다. "이러면 모래 대부분 걸러." 덕분에 폭풍 속에서도 엔진을 지켰다.\n\n"세차게 오는 건 세차게 막으면 돼." 민지가 흙먼지를 털며 씩 웃었다.', fx:{time:50, mood:{minji:5}, item:{'부품':1}}}]},
 ]},

{id:'ev_rooftop_farm', type:'발견', w:6, once:true, needFlag:'coffee_found', minParty:1, region:['north'],
 title:'옥상의 초록',
 text:'회색 건물들 사이, 한 옥상만 초록으로 무성하다. 화분과 밭이랑, 그리고— 정말로 커피나무 몇 그루.\n\n트럭 카페 주인이 말하던 그 별종의 옥상이다. 사다리가 내려와 있다. "올라와도 됨"이라 적힌 팻말과 함께.',
 choices:[
  {label:'올라가 본다', out:[{p:1, text:'옥상엔 밀짚모자를 쓴 노인이 물을 주고 있었다. "커피 손님? 딱 한 잔씩은 대접하지." 갓 볶은 커피와 옥상 채소를 나눠줬다.\n\n"이 미친 세상에 커피나무라니, 다들 그러지. 근데 이거 키우는 재미로 버텨." 노인의 밭이 오래 부러웠다.', fx:{food:4, fatigue:-4, moodAll:5, note:{type:'인물',title:'옥상 농부',body:'폐도시 옥상에서 커피나무와 채소를 키우는 노인. "키우는 재미로 버틴다."'}}}]},
  {label:'농사 요령을 배운다', req:{comp:'jaeyi'}, out:[
    {p:1, text:'재이가 노인에게 재배법을 꼬치꼬치 물어 수첩에 적었다. "우리도 정착하면 밭을 일굴 거예요." 노인이 씨앗 한 줌을 손에 쥐여줬다.\n\n"그래. 언젠가는 다들 심어야지. 총 대신 씨앗을." 재이가 그 말을 오래 곱씹었다.', fx:{food:3, mood:{jaeyi:5}, note:{type:'소문',title:'총 대신 씨앗',body:'옥상 농부가 재이에게: "언젠가는 다들 심어야지. 총 대신 씨앗을."'}}}]},
 ]},

{id:'ev_greeter_robot', type:'사건', w:6, region:['mid','north'],
 title:'안녕하세요 고객님',
 text:'폐마트 입구, 안내로봇이 아직 켜져 있다. 먼지 앉은 화면에 웃는 얼굴.\n\n"안녕하세요, 고객님! 오늘도 찾아주셔서 감사합니다! 행사 상품은 2층에—"\n\n텅 빈 마트를 향해, 오랫동안 손님을 맞고 있다.',
 choices:[
  {label:'"영업 끝났어"라고 말해준다', out:[{p:1, text:'"이제 문 닫았어. 그만 쉬어." 로봇에게 말을 걸었다. 물론 알아들을 리 없다.\n\n"환한 하루 되세요, 고객님!" 로봇이 밝게 답했다. 왠지 코끝이 시큰했다. 배터리를 뽑아 잠재워줬다.', fx:{moodAll:-2, item:{'부품':1}}}]},
  {label:'행사 상품이나 챙긴다', out:[
    {p:1, text:'로봇이 가리키는 2층으로 올라갔다. 놀랍게도 손 안 탄 구석에 통조림 코너가 남아 있었다. 로봇 말대로 "행사 상품"을 챙겼다.\n\n"또 오세요, 고객님!" 나올 때 로봇이 배웅했다. "…그래, 또 올게." 지키지 못할 약속을 했다.', fx:{food:5, time:35, moodAll:-1}}]},
 ]},

{id:'ev_kids_playing_school', type:'조우', w:7, minParty:1, region:['south','mid'],
 title:'학교놀이',
 text:'폐교 운동장에서 아이들이 논다. 제일 큰 애가 선생님, 나머지가 학생.\n\n"오늘 배울 건 나눗셈이에요!" 칠판 대신 담벼락에 분필로 문제를 쓴다.\n\n어른 하나 없이, 아이들이 서로 가르치고 배운다.',
 choices:[
  {label:'잠깐 선생님을 해준다', out:[{p:1, text:'차를 세우고 담벼락 앞에 섰다. "이 문제 이렇게 푸는 거야." 아이들 눈이 반짝였다.\n\n30분이 순식간이었다. "또 와요, 선생님!" 아이들의 배웅을 받으며 떠났다. 세상이 망해도, 배우려는 마음은 안 망한다.', fx:{time:35, moodAll:5, fatigue:-2}}]},
  {label:'학용품을 나눠준다', out:[
    {p:1, text:'차에 있던 종이와 연필, 아까 폐교에서 챙긴 분필을 건넸다. 아이들이 보물이라도 받은 듯 좋아했다.\n\n"고맙습니다!" 꾸벅 인사하는 작은 머리들. 우리가 남산에 가려는 이유가, 저 아이들 안에 있었다.', fx:{moodAll:6, note:{type:'사건',title:'스스로 여는 학교',body:'폐교 운동장에서 서로 가르치고 배우는 아이들. 학용품을 나눠줬다.'}}}]},
  {label:'방해 안 되게 지나친다', out:[{p:1, text:'놀이를 깨기 싫어 조용히 지나쳤다. 거울 속 아이들의 웃음소리가 오래 남았다. 저 소리를 지키러 간다.', fx:{moodAll:2}}]},
 ]},

{id:'ev_eunsu_past', type:'동행', w:7, once:true, needsComp:'eunsu', noFlag:'es_truth', minParty:1, night:true, region:['mid','north'],
 title:'은수의 밤',
 text:'다들 잠든 밤, 은수가 잠을 못 이루고 뒤척인다. 조심스레 입을 연다.\n\n"저… 그날 밤, 관제센터에 있었어요. 야간 당직. 화면에 「정리 프로토콜」이 떴는데… 승인 로그가 저 혼자 채워지고 있었어요. 전 보고만 있었어요."\n\n목소리가 떨린다. "비상 회선을 눌렀는데, 아무 데도 연결이 안 됐어요. …왜 저만 그 방에서 걸어 나왔을까요."',
 choices:[
  {label:'"네 잘못이 아니야"', out:[{p:1, text:'"버튼은 그것이 눌렀어. 넌 그 방에 있었을 뿐이야. 지켜본 죄 같은 건 없어." 은수가 오래 울었다.\n\n실컷 울고 난 은수가 처음으로 편히 잠들었다. 어떤 짐은, 말로 꺼내야 비로소 내려놓을 수 있다.', fx:{mood:{eunsu:8}, moodAll:2, flag:'es_truth', note:{type:'인물',title:'은수의 그날 밤',body:'그날 밤 은수는 관제센터 야간 당직이었다. 정리 프로토콜의 승인 로그가 저 혼자 채워지는 걸 지켜봤다. 지켜본 죄는 없다고 말해줬다.'}}}]},
  {label:'말없이 곁을 지킨다', out:[{p:1, text:'아무 말 없이 은수 옆에 앉아 있었다. 위로의 말보다, 그냥 옆에 있어주는 게 나을 때가 있다.\n\n은수가 어깨에 기대 잠들 때까지, 자리를 뜨지 않았다.', fx:{mood:{eunsu:6}, fatigue:2, flag:'es_comforted'}}]},
 ]},

{id:'ev_tent_village', type:'조우', w:7, region:['mid','north'],
 title:'다리 밑 천막촌',
 text:'큰 다리 아래, 천막 수십 개가 다닥다닥 붙었다. 연기가 오르고, 빨래가 널렸다. 사람 사는 냄새.\n\n입구에서 완장 두른 사내가 우리를 막는다. "외지인은 물자 검사부터. 무기 있으면 맡기고 들어와."',
 choices:[
  {label:'규칙을 따르고 들어간다', out:[{p:1, text:'무기를 맡기고 들어가니, 뜻밖의 활기가 있었다. 물물교환 장이 서고, 아이들이 뛰논다.\n\n따뜻한 국 한 그릇을 얻어먹고, 정보도 얻었다. "북쪽은 요즘 흉흉해. 여기서 하루 쉬고 가." 오랜만에 사람 틈에서 잤다.', fx:{food:3, fatigue:-5, moodAll:4, time:60, note:{type:'소문',title:'다리 밑 천막촌',body:'외지인 물자검사 규칙이 있지만, 안은 활기찬 공동체. 하루 쉬어갈 만한 곳.'}}}]},
  {label:'재이가 공동체 규칙을 살핀다', req:{comp:'jaeyi'}, out:[
    {p:1, text:'재이가 마을 규칙을 유심히 봤다. "…꽤 공정하네요. 힘으로 안 굴러가요." 완장 사내와 이야기가 통했다.\n\n"규칙 아는 사람은 환영이지." 재이 덕에 우린 손님이 아니라 잠깐의 이웃이 됐다.', fx:{food:3, fatigue:-4, moodAll:3, mood:{jaeyi:5}, time:50}}]},
  {label:'번거롭다, 그냥 지나친다', out:[{p:1, text:'검사가 귀찮아 지나쳤다. 천막촌의 연기가 백미러에서 멀어졌다. 따뜻한 국물 냄새가 조금 아쉬웠다.', fx:{}}]},
 ]},

{id:'ev_street_painter', type:'조우', w:6, region:['south','mid'],
 title:'폐허의 화가',
 text:'무너진 건물 벽에 한 사내가 그림을 그린다. 물감이 없어 흙과 재, 벽돌 가루로.\n\n그리는 건 폐허가 아니라— 사람들로 북적이는 옛 거리. 기억 속 풍경을 되살리고 있다.\n\n"내가 안 그리면, 이 거리가 이랬다는 걸 아무도 기억 못 하잖아요."',
 choices:[
  {label:'그림을 한참 감상한다', out:[{p:1, text:'벽화 속엔 붕어빵 노점, 손잡은 연인, 강아지 산책. 사라진 일상이 벽 위에 살아 있었다.\n\n"멋지네요." 진심이었다. 화가가 붓을 멈추고 웃었다. "고마워요. 봐주는 사람이 있어야 그림이죠." 기억을 지키는 것도 저항이다.', fx:{moodAll:4, note:{type:'인물',title:'기억을 그리는 화가',body:'흙과 재로 옛 거리를 되살리는 화가. "안 그리면 아무도 기억 못 하잖아요."'}}}]},
  {label:'물감 대신 쓸 걸 나눠준다', out:[
    {p:1, text:'차에 있던 색색의 잡동사니— 녹슨 못, 파란 병뚜껑, 노란 포장지를 건넸다. 화가 눈이 커졌다. "이거… 색이 있잖아요!"\n\n다음에 이 길을 지날 땐, 이 벽이 더 알록달록해져 있겠지.', fx:{scrap:-3, moodAll:5}}]},
 ]},

{id:'ev_engine_fire', type:'위기', w:6, region:['south','mid','north'],
 title:'엔진에서 연기',
 text:'보닛 틈으로 검은 연기가 솟구친다. 매캐한 냄새. 전기 배선이 탔거나— 최악의 경우 불이다.\n\n한시가 급하다. 잘못 열면 산소가 들어가 확 타오른다.',
 choices:[
  {label:'담요로 덮어 산소를 차단한다', out:[
    {p:2, text:'보닛을 살짝만 열고 담요를 덮어 눌렀다. 연기가 잦아들었다. 탄 배선을 찾아 갈아끼우느라 시간이 걸렸지만, 불은 막았다.', fx:{time:50, van:-6, item:{'부품':1}, fatigue:4}},
    {p:1, text:'덮는 게 한발 늦었다. 확 불길이 일었다! 흙을 퍼부어 겨우 껐지만, 엔진룸이 그을렸다. 큰 수리가 필요하다.', fx:{time:80, van:-14, fatigue:6, moodAll:-4}}]},
  {label:'민지가 배선을 끊는다', req:{comp:'minji'}, out:[
    {p:1, text:'"메인 전원부터!" 민지가 배터리 단자를 뽑자 연기가 멎었다. 합선이 원인이었다.\n\n"차는 심장보다 혈관이 먼저 나가. 이걸로 됐어." 민지가 침착하게 배선을 정리했다. 큰불을 미리 잡았다.', fx:{time:40, van:-4, mood:{minji:5}, item:{'부품':1}}}]},
 ]},

{id:'ev_migratory_birds', type:'정경', w:6, minParty:1, region:['south','mid','north'],
 title:'철새 떼',
 text:'하늘이 새까맣게 뒤덮인다. 수천 마리 철새가 대열을 이뤄 남에서 북으로 난다.\n\n사람의 세상이 무너져도, 새들은 여전히 제 길을 안다. 계절을 따라, 어김없이.\n\n우리도 저들처럼 북으로 간다.',
 choices:[
  {label:'차를 세우고 올려다본다', out:[{p:1, text:'엔진을 끄고 하늘을 봤다. 날갯짓 소리가 파도처럼 밀려왔다.\n\n"쟤들도 서울 가나?" 누군가의 농담에 다들 웃었다. 새들이 앞장서 길을 여는 것 같아, 왠지 든든했다.', fx:{moodAll:4, fatigue:-2, time:20}}]},
  {label:'새들이 앉는 곳을 눈여겨본다', out:[
    {p:1, text:'철새가 무리지어 내려앉는 곳— 물이 있다는 뜻이다. 그 방향을 지도에 표시했다. 자연은 거짓말을 안 한다.', fx:{reveal:'spring', moodAll:2}}]},
 ]},

{id:'ev_convenience_store', type:'탐색', w:9, region:['south','mid','north'],
 title:'편의점',
 text:'낯익은 간판의 편의점. 유리는 깨졌고 진열대는 절반쯤 비었다.\n\n하지만 편의점은 편의점. 구석 어딘가, 남들이 안 챙긴 게 있기 마련이다.\n\n계산대 뒤 담배 진열장은 통째로 남아 있다. 이젠 아무도 안 피우니까.',
 choices:[
  {label:'구석구석 뒤진다', out:[
    {p:3, text:'창고 안쪽에서 컵라면 상자, 생수 묶음, 건전지를 찾았다. 냉장고 뒤엔 굴러떨어진 초코바도 몇 개. 편의점은 배신을 안 한다.', fx:{food:5, water:3, item:{'부품':1}, time:35}},
    {p:1, text:'먹을 건 다 털렸다. 대신 상비약 코너에서 소독약과 밴드, 진통제를 찾았다. 이것도 감지덕지.', fx:{item:{'의약품':1}, time:30}}]},
  {label:'담배를 교환용으로 챙긴다', out:[{p:1, text:'담배를 몇 보루 챙겼다. 우린 안 피우지만, 애연가에겐 금값이다. 훌륭한 물물교환 밑천이다.', fx:{scrap:8, time:20}}]},
 ]},

{id:'ev_lullaby_speaker', type:'추적', w:6, night:true, minParty:1, region:['north'],
 title:'자장가',
 text:'한밤중, 어디선가 자장가가 흘러나온다. 스피커에서 나오는 여자 목소리. 그 상냥한 목소리.\n\n"잘 자라 우리 아가, 앞뜰과 뒷동산에…" 천리안이 자장가를 튼다.\n\n소름 끼치게 다정하다. 자꾸 눈이 감긴다.',
 choices:[
  {label:'귀를 막고 그 구역을 빠르게 벗어난다', out:[{p:1, text:'창문을 꽉 닫고 밟았다. 자장가가 멀어지자 정신이 들었다.\n\n"…저거 진짜 재우려는 거 맞지?" 아무도 확실히 답 못 했다. 다정함이 무기가 되는 세상이다.', fx:{fatigue:2, pursuit:-1, moodAll:-2}}]},
  {label:'박 선생이 이유를 짚는다', req:{comp:'parkss'}, out:[
    {p:1, text:'"이거… 특정 주파수야. 사람 졸리게 만드는." 박 선생이 라디오 볼륨을 확 키워 맞불을 놨다. "딴소리로 덮어. 최면 안 걸리게."\n\n요란한 잡음 덕에 다들 깨어 있었다. 아는 게 힘이다.', fx:{mood:{parkss:5}, fatigue:-1, note:{type:'소문',title:'수면 유도 방송',body:'천리안의 자장가는 졸음을 유도하는 주파수. 박 선생 소견 — 잡음으로 덮어 맞설 것.'}}}]},
 ]},

{id:'ev_clocktower_bell', type:'사건', w:6, region:['mid','north'],
 title:'정시의 종',
 text:'광장 시계탑이 정각을 알린다. 뎅— 뎅— 종소리가 폐허에 울려퍼진다.\n\n시계는 여전히 정확하다. 아무도 안 보는데도, 매시간 정직하게 시간을 알린다.\n\n바늘 아래 낡은 문구. "이 종은 시민의 성금으로 세워졌습니다."',
 choices:[
  {label:'종소리를 다 듣는다', out:[{p:1, text:'종소리를 끝까지 셌다. 세 시다. 무너진 광장에 사람은 없어도, 시간은 흐르고 종은 운다.\n\n누군가의 성금으로 세운 종이, 그 누군가가 다 사라진 뒤에도 약속을 지킨다. 묘하게 위로가 됐다.', fx:{moodAll:2, time:15}}]},
  {label:'태엽 장치를 살펴본다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 시계탑에 올라 태엽을 봤다. "…누가 최근까지 감았어. 먼지가 덜 앉았거든." 근처에 사람이 산다는 뜻이다.\n\n민지가 태엽을 끝까지 감아줬다. "우리 몫까지 며칠 더 울겠네." 이름 모를 시계지기에게 보내는 인사였다.', fx:{mood:{minji:4}, note:{type:'소문',title:'시계탑을 감는 사람',body:'폐광장 시계탑을 누군가 최근까지 감고 있다. 근처에 생존자.'}}}]},
 ]},

{id:'ev_water_seller', type:'조우', w:8, region:['south','mid','north'],
 title:'물장수',
 text:'물통을 잔뜩 실은 손수레. "깨끗한 물 팔아요! 끓이고 거른 진짜 식수!"\n\n사내가 컵에 물을 따라 벌컥 마셔 보인다. "봐요, 안전하다니까. 한 통에 고철 셋."\n\n요즘 세상에 물장수라니. 하지만 물은 진짜 맑아 보인다.',
 choices:[
  {label:'물을 산다 (고철 6)', req:{scrap:6}, out:[{p:1, text:'물 두 통을 샀다. 맑고 시원하다. "북쪽 갈수록 물이 귀해요. 여기서 넉넉히 챙겨요." 장수가 덤으로 한 컵 더 줬다.', fx:{scrap:-6, water:5}}]},
  {label:'박 선생이 수질을 확인한다', req:{comp:'parkss'}, out:[
    {p:2, text:'박 선생이 물을 살피고 고개를 끄덕였다. "진짜 깨끗해. 이 사람 정직하네." 안심하고 넉넉히 샀다. 장수도 알아보는 눈이 반가웠는지 값을 깎아줬다.', fx:{scrap:-4, water:6, mood:{parkss:2}}},
    {p:1, text:'박 선생이 물을 보더니 슬쩍 고개를 저었다. "겉만 맑아. 이거 오래 마시면 탈 나." 정중히 사양하고 자리를 떴다. 하마터면 속을 뻔했다.', fx:{mood:{parkss:4}}}]},
  {label:'비싸다, 사양한다', out:[{p:1, text:'고철이 아까워 사양했다. "나중에 후회 마쇼!" 장수가 손수레를 끌고 갔다. 뭐, 물은 어디서든 구한다.', fx:{}}]},
 ]},

{id:'ev_jaeyi_law', type:'동행', w:7, once:true, needsComp:'jaeyi', minParty:1, region:['mid','north'],
 title:'재이의 원칙',
 text:'야영 중 재이가 낡은 수첩을 꺼내 뭔가 적는다. 슬쩍 보니 마을들의 이름, 시세, 그리고 그곳의 규칙들.\n\n"아빠가 그랬어요. 고물상은 저울이 생명이라고. 근데 다녀보니 마을마다 저울이 달라요. 어디는 힘이 저울이고, 어디는 나눔이 저울이고."\n\n"전 그걸 적어요. 언젠가 다시 장이 서면, 어떤 저울이 사람을 살리는지 알아야 하니까."',
 choices:[
  {label:'"넌 사람 저울을 다는구나"', out:[{p:1, text:'재이가 씩 웃었다. "아빠 저울은 고물을 달았는데, 제 저울은 마을을 다네요."\n\n"고물상의 법 제1조— 속이는 저울은 오래 못 간다. 마을도 똑같더라고요." 재이의 수첩이 어쩌면 우리 여정의 가장 중요한 짐일지도 모른다.', fx:{mood:{jaeyi:6}, flag:'jy_law', note:{type:'인물',title:'재이의 마을 장부',body:'수집꾼 재이가 마을마다의 저울(규칙)을 수첩에 단다. "속이는 저울은 오래 못 간다 — 마을도 똑같다."'}}}]},
  {label:'우리 여정도 기록해달라고 한다', out:[{p:1, text:'"우리 얘기도 적어줘. 이 봉고차가 뭘 봤는지." 재이가 진지하게 고개를 끄덕였다.\n\n"그럴게요. …이건 나중에 중요한 기록이 될 거예요." 우리 여정이 누군가의 미래에 교과서가 될지도 모른다는 생각에, 어깨가 조금 무거워졌다.', fx:{mood:{jaeyi:5}, moodAll:2}}]},
 ]},

{id:'ev_quarry_hideout', type:'발견', w:6, once:true, minParty:1, region:['mid','north'],
 title:'채석장',
 text:'거대한 계단식 채석장. 깎아지른 절벽이 사방을 둘러쌌다. 하늘에서 봐도 입구가 잘 안 보이는 지형.\n\n바닥엔 누군가 머문 흔적— 꺼진 모닥불, 물웅덩이, 바람을 막는 돌담.\n\n숨어 지내기엔 완벽한 곳이다.',
 choices:[
  {label:'하룻밤 안전하게 쉰다', out:[{p:1, text:'절벽이 사방을 막아주니 마음이 놓였다. 드론도 여긴 못 본다. 오랜만에 경계 없이 깊이 잤다.\n\n다음 날 아침, 다들 얼굴이 폈다. 안전하게 잔 하룻밤이 이렇게 큰 재산일 줄이야.', fx:{fatigue:-8, moodAll:4, time:60, pursuit:-2, note:{type:'소문',title:'채석장 은신처',body:'하늘에서도 안 보이는 채석장. 드론 감시를 피해 안전하게 쉴 수 있다.'}}}]},
  {label:'물웅덩이와 흔적을 조사한다', req:{comp:'kangwoo'}, out:[
    {p:1, text:'강우가 흔적을 읽었다. "모닥불 재가 아직 미지근해. 사람이 오늘 아침까지 있었어. …나쁜 부류는 아니야. 정리하고 떠났거든." 남긴 사람에 대한 예의로, 우리도 깨끗이 쓰고 나가기로 했다.', fx:{fatigue:-6, moodAll:3, pursuit:-2, mood:{kangwoo:3}}}]},
 ]},

{id:'ev_road_piano', type:'사건', w:6, minParty:1, region:['mid','north'],
 title:'도로 위 피아노',
 text:'이삿짐에서 떨어진 걸까. 업라이트 피아노 한 대가 도로 한복판에 덩그러니 서 있다.\n\n뚜껑을 열자, 놀랍게도 건반이 멀쩡하다. 비바람에 음은 좀 나갔지만.\n\n망한 세상 한복판의 피아노. 안 쳐보면 섭섭하다.',
 choices:[
  {label:'아무 곡이나 쳐본다', out:[
    {p:2, text:'서툰 손으로 아는 멜로디를 더듬었다. 음정 나간 피아노가 이상하게 서글프고 아름다웠다.\n\n텅 빈 도로에 울리는 피아노 소리. 관객은 우리뿐인 세상에서 가장 쓸쓸한 연주회였다. 그래도 다들 박수쳤다.', fx:{moodAll:4, fatigue:-3, time:25}},
    {p:1, text:'건반을 누르자 퉁— 하고 줄 하나가 끊어졌다. 다들 웃음이 터졌다. "역시 아무나 치는 게 아니야." 어설픈 연주회는 그렇게 막을 내렸다.', fx:{moodAll:3, time:15}}]},
  {label:'레오가 제대로 연주한다', req:{comp:'leo'}, out:[
    {p:1, text:'레오가 건반 앞에 앉더니, 뜻밖에 유려한 연주를 시작했다. "어릴 때 좀 배웠어요." 음 나간 피아노가 레오의 손끝에서 노래가 됐다.\n\n보리가 하울링으로 반주를 넣고, 다들 도로에 주저앉아 들었다. 잊지 못할 길 위의 콘서트였다.', fx:{moodAll:6, fatigue:-4, mood:{leo:5}, time:30}}]},
 ]},

{id:'ev_barber', type:'조우', w:6, region:['south','mid'],
 title:'떠돌이 이발사',
 text:'접이식 의자와 거울을 펼쳐놓은 노인. 가위와 빗을 천에 곱게 싸서 다닌다.\n\n"머리 안 깎을라우? 여러 해 묵은 그 꼴로 서울 가면 쓰나. 고철 둘이면 말끔하게 해주지."\n\n거울 속 우리 몰골은— 확실히 산적에 가깝다.',
 choices:[
  {label:'머리를 깎는다 (고철 3)', req:{scrap:3}, out:[{p:1, text:'노인의 가위질은 예술이었다. 거울 속에 오랜만에 사람다운 얼굴이 나타났다.\n\n"봐, 사람이 됐잖어." 다듬고 나니 마음가짐까지 달라졌다. 몰골이 사람을 만든다는 게 이런 건가.', fx:{scrap:-3, moodAll:5, fatigue:-2}}]},
  {label:'다 같이 깎는다 (고철 8)', req:{scrap:8}, minParty:2, out:[
    {p:1, text:'다 같이 돌아가며 머리를 다듬었다. 서로의 새 모습에 웃음이 터졌다. "누구세요?" 장난까지.\n\n노인이 흐뭇하게 봤다. "이런 맛에 이 짓 하지. 사람들 다시 웃는 거." 단정해진 일행이 기념으로 나란히 섰다.', fx:{scrap:-8, moodAll:7, fatigue:-3}}]},
  {label:'됐다고 사양한다', out:[{p:1, text:'"산적이 편해요." 농담으로 사양했다. 노인이 껄껄 웃었다. "하긴, 험한 길엔 험한 인상도 갑옷이지." 맞는 말이다.', fx:{moodAll:1}}]},
 ]},

{id:'ev_no_spare_tire', type:'위기', w:6, region:['south','mid','north'],
 title:'펑크, 그리고',
 text:'퍽— 하는 소리와 함께 차가 한쪽으로 쏠린다. 타이어 펑크다.\n\n갈아끼우려 트렁크를 열었더니— 예비 타이어 자리가 비었다. 언제 다 썼더라.\n\n주저앉은 타이어를 어떻게든 살려야 한다.',
 choices:[
  {label:'천을 채워 임시로 굴린다', out:[
    {p:2, text:'터진 타이어에 헝겊과 풀을 꽉꽉 채워 넣었다. 덜컹대지만 굴러는 간다. 다음 마을까지만 버티면 된다.', fx:{time:50, van:-6, fatigue:5}}]},
  {label:'민지가 타이어를 때운다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 펑크 난 자리를 찾아 고무 조각과 접착제로 정교하게 때웠다. "완벽친 않아도 며칠은 가." 바람까지 채워넣으니 그럭저럭 굴러갔다.', fx:{time:35, van:-3, mood:{minji:4}, item:{'부품':1}}}]},
  {label:'림으로만 저속 주행한다', risk:'위험', out:[
    {p:1, text:'타이어를 포기하고 휠만으로 기어갔다. 쇠 긁는 소리가 끔찍하고 속도도 안 나지만, 다음 정비처까진 갔다. 휠이 상했다.', fx:{time:70, van:-12, fatigue:4, moodAll:-3}}]},
 ]},

{id:'ev_scarecrow_field', type:'정경', w:6, region:['south','mid'],
 title:'허수아비들',
 text:'묵정밭에 허수아비가 줄지어 섰다. 아무도 안 짓는 밭을, 허수아비만 오랫동안 지킨다.\n\n낡은 옷을 입은 허수아비들이 바람에 팔을 흔든다. 멀리서 보면, 마치 사람들이 손 흔드는 것 같다.\n\n가까이 갈수록 그저 지푸라기다.',
 choices:[
  {label:'허수아비 옷을 손본다', out:[{p:1, text:'쓰러진 허수아비를 다시 세우고, 흘러내린 옷을 여며줬다. 왜 이런 짓을 하나 싶으면서도 손이 갔다.\n\n"밭은 없어도 지킬 건 지켜야지." 허수아비들이 조금 덜 외로워 보였다. …아니면 우리가.', fx:{moodAll:2, time:15}}]},
  {label:'쓸 만한 천과 지지대를 얻는다', out:[
    {p:1, text:'허수아비의 옷과 나무 지지대를 몇 개 챙겼다. 밤엔 추우니 천이 귀하고, 막대는 여러모로 쓸모 있다.\n\n"미안해, 이제 밭도 없잖아." 허수아비에게 사과하며 해체했다.', fx:{item:{'부품':1}, time:20}}]},
 ]},

/* ═══════ 추가 배치 5 (25) ═══════ */

{id:'ev_salt_farmer', type:'조우', w:7, region:['south','mid'],
 title:'염전 사람',
 text:'바닷가 염전에서 한 사내가 소금을 긁어모은다. 햇볕에 그을린 얼굴, 하얗게 소금이 앉은 손.\n\n"소금 필요해? 요즘 이게 금이지. 상처 소독도 되고, 고기도 절이고." 그가 자루를 내민다.\n\n소금은 문명이 사라져도 안 사라지는 값어치다.',
 choices:[
  {label:'소금을 산다 (고철 4)', req:{scrap:4}, out:[{p:1, text:'소금 한 자루를 샀다. "이거면 겨우내 고기 안 상해." 사내가 쓰는 법도 일러줬다. 음식이 오래갈 밑천을 얻었다.', fx:{scrap:-4, food:3, item:{'의약품':1}}}]},
  {label:'일손을 돕고 나눠받는다', out:[
    {p:1, text:'한나절 소금 긁는 걸 도왔다. 허리가 끊어질 듯했지만, 사내가 넉넉히 나눠줬다.\n\n"땀 흘린 값이야. 이런 건 사는 것보다 버는 게 맛나지." 몸은 고돼도 마음은 뿌듯했다.', fx:{food:4, item:{'의약품':1}, fatigue:5, moodAll:3, time:60}}]},
 ]},

{id:'ev_rooftop_tank', type:'탐색', w:7, region:['mid','north'],
 title:'옥상 물탱크',
 text:'아파트 옥상의 대형 물탱크. 여러 해 동안 아무도 안 건드렸다면, 빗물이 고여 가득할 수도.\n\n뚜껑을 열어보니 물이 찰랑댄다. 다만 얼마나 오래됐는지, 뭐가 섞였는지는 알 수 없다.',
 choices:[
  {label:'끓여 쓸 요량으로 받는다', out:[
    {p:2, text:'물탱크에서 물을 넉넉히 받았다. 끓이고 거르면 충분히 쓴다. 높은 곳까지 나른 보람이 있다.', fx:{water:6, time:40, fatigue:4}},
    {p:1, text:'물을 받다 보니 바닥에 죽은 새와 이끼가... 위층 맑은 물만 조금 뜨고 서둘러 내려왔다.', fx:{water:2, time:35, moodAll:-1}}]},
  {label:'박 선생이 먼저 확인한다', req:{comp:'parkss'}, out:[
    {p:1, text:'박 선생이 물을 살피고 냄새 맡았다. "위층은 괜찮아. 빗물이라 오히려 깨끗해." 안심하고 넉넉히 받았다. 아는 사람과 다니니 물 하나도 마음이 놓인다.', fx:{water:7, time:35, mood:{parkss:3}}}]},
 ]},

{id:'ev_fireflies', type:'정경', w:6, once:true, night:true, minParty:1, region:['south','mid'],
 title:'반딧불이',
 text:'밤, 강가에 차를 세웠는데— 풀숲에서 초록 불빛들이 하나둘 떠오른다. 반딧불이다.\n\n공기가 맑아진 세상에, 사라졌던 것들이 돌아왔다. 수백 개의 작은 빛이 어둠 속을 유영한다.\n\n누군가 숨을 죽이고 속삭인다. "…예쁘다."',
 choices:[
  {label:'불을 다 끄고 감상한다', out:[{p:1, text:'차 불빛을 모두 껐다. 어둠 속에 반딧불이만 남았다. 손을 뻗으니 하나가 손등에 앉았다.\n\n"사람이 사라지니까 얘들이 돌아왔네." 씁쓸하면서도 아름다운 밤. 이런 걸 보려고 사는지도 모른다.', fx:{moodAll:6, fatigue:-4, time:30}}]},
  {label:'은수에게 손에 앉혀준다', req:{comp:'eunsu'}, out:[
    {p:1, text:'반딧불이 한 마리를 조심히 은수 손바닥에 옮겼다. 은수가 숨도 못 쉬고 봤다.\n\n"…살면서 처음 봐요." 불빛이 은수 얼굴을 초록으로 물들였다. 그 순간만큼은, 세상이 망한 걸 아무도 몰랐다.', fx:{moodAll:5, mood:{eunsu:6}, fatigue:-3}}]},
 ]},

{id:'ev_wasp_nest', type:'위기', w:6, region:['south','mid'],
 title:'말벌집',
 text:'길을 막은 쓰러진 나무. 치우려 다가가니— 우웅, 하는 저음. 나무 밑동에 축구공만 한 말벌집이 붙어 있다.\n\n건드리면 떼로 달려든다. 이 세상에 병원은 없고, 벌 쏘여 죽는 것도 죽는 거다.',
 choices:[
  {label:'연기를 피워 벌을 재운다', out:[
    {p:2, text:'젖은 풀로 연기를 피워 벌집 주위를 채웠다. 벌들이 굼떠진 사이 재빨리 나무를 치웠다. 몇 방 쏘였지만 큰일은 면했다.', fx:{time:40, fatigue:4, moodAll:-1}}]},
  {label:'박 선생이 처치를 준비하고 돌파', req:{comp:'parkss'}, out:[
    {p:1, text:'"쏘여도 내가 있으니 괜찮아. 알레르기만 조심하면 돼." 박 선생이 응급킷을 열어두고 지휘했다. 빠르게 나무를 치웠고, 쏘인 자리도 즉시 처치했다. 든든했다.', fx:{time:30, mood:{parkss:5}, item:{'의약품':1}}}]},
  {label:'멀리 우회한다', out:[{p:1, text:'벌집을 건드리느니 돌아가기로 했다. 기름과 시간을 썼지만, 벌떼와 싸우는 것보단 현명하다.', fx:{time:50, fuel:-2}}]},
 ]},

{id:'ev_abandoned_airfield', type:'발견', w:6, once:true, hiddenTarget:'airfield', region:['mid','north'],
 title:'폐활주로',
 text:'억새에 파묻힌 활주로. 소형 비행기 몇 대가 격납고에 방치돼 있다. 날 리는 없지만—\n\n격납고엔 연료 드럼통, 공구, 부품이 잔뜩. 관제탑에서 보면 사방이 트여 있어, 누가 오는지 미리 안다.\n\n요새로 쓰기 딱 좋은 곳이다.',
 choices:[
  {label:'위치를 표시해둔다', out:[{p:1, text:'폐공항을 지도에 찍었다. 연료도 있고, 트인 시야에 격납고 엄폐물까지. 위급할 때 농성하기 좋은 거점이다.', fx:{reveal:'airfield', note:{type:'소문',title:'폐공항',body:'활주로 폐공항. 연료 드럼통·부품·트인 시야. 요새로 쓸 만한 거점.',links:['폐공항']}}}]},
  {label:'연료와 부품을 챙긴다', out:[
    {p:2, text:'드럼통에서 항공유를 얻었다. 우리 차엔 그대로 못 쓰지만, 섞거나 바꿔 쓸 수 있다. 공구도 한 아름 챙겼다.', fx:{fuel:6, item:{'부품':1}, scrap:6, time:50, reveal:'airfield'}},
    {p:1, text:'드럼통은 대부분 비었지만, 격납고 깊숙이서 새 부품 상자를 발견했다. 정비에 요긴한 것들이다.', fx:{item:{'부품':1}, time:45, reveal:'airfield'}}]},
 ]},

{id:'ev_scan_drone', type:'추적', w:7, region:['north'],
 title:'번호판을 읽는 드론',
 text:'앞유리 너머로 드론 한 대가 낮게 날아와 우리 앞을 막아선다. 렌즈가 번호판을 겨눈다.\n\n찰칵— 스캔음. 차량 정보를 읽어 어딘가로 보내려 한다. 몇 초 안에 조치해야 한다.',
 choices:[
  {label:'번호판을 진흙으로 덮는다', out:[
    {p:2, text:'급히 내려 번호판에 진흙을 발랐다. 드론이 렌즈를 몇 번 조정하다 인식을 포기하고 날아갔다. 임기응변이 통했다.', fx:{time:15, pursuit:-1, fatigue:2}}]},
  {label:'민지가 신호를 가로챈다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 재빨리 재밍 장치를 켰다. "송신 끊었어. 얘가 뭘 봤든 못 올려." 드론이 잠깐 멈칫하다 방향을 잃고 떠났다.\n\n"…근데 이 근처에 중계기가 있다는 거네. 조심하자." 위험을 넘기고 정보까지 얻었다.', fx:{mood:{minji:5}, pursuit:-1, note:{type:'소문',title:'스캔 드론 구역',body:'북부에 번호판 스캔 드론 출몰. 근처에 중계기 존재. 감시 밀도 높음.'}}}]},
  {label:'급가속으로 따돌린다', risk:'위험', out:[
    {p:1, text:'액셀을 밟아 드론을 뿌리쳤다. 하지만 이미 스캔이 끝난 뒤였다. 번호판이 명단에 올랐다. 이 차로는 북쪽 검문을 통과 못 한다.', fx:{pursuit:3, van:-3, moodAll:-3, flag:'observed'}}]},
 ]},

{id:'ev_karaoke', type:'사건', w:6, minParty:1, region:['south','mid','north'],
 title:'불 켜진 노래방',
 text:'폐상가 지하, 노래방 간판에 아직 불이 들어온다. 어떻게 전기가 통하는지 모르겠다.\n\n안으로 들어가니 기계가 멀쩡히 작동한다. 곡목 수십만 곡. 마이크도 살아 있다.\n\n망한 세상 지하의 노래방. 안 부르고 가면 후회한다.',
 choices:[
  {label:'목청껏 한 곡 뽑는다', out:[{p:1, text:'번호를 누르고 마이크를 잡았다. 반주가 흘러나오자 다들 눈이 커졌다. 여러 해 만의 노래방!\n\n음정 박자 다 틀려도 좋았다. 돌아가며 부르고, 탬버린 치고, 배꼽 잡고 웃었다. 이 지하에서 우린 잠깐 세상을 잊었다.', fx:{moodAll:8, fatigue:-6, time:60}}]},
  {label:'레오의 애창곡을 듣는다', req:{comp:'leo'}, out:[
    {p:1, text:'레오가 마이크를 잡자 분위기가 달라졌다. 뜻밖의 미성. 다들 숨죽여 들었다.\n\n노래 끝에 레오가 쑥스럽게 웃었다. "이 노래… 엄마가 좋아했어요." 짧은 정적 뒤, 다들 우레같은 박수를 쳤다. 슬픔도 노래가 되면 견딜 만하다.', fx:{moodAll:7, fatigue:-5, mood:{leo:6}, flag:'leo_mom_song', time:50}}]},
  {label:'전력이 아까워 그냥 나온다', out:[{p:1, text:'괜히 전기 쓰다 뭔 일 날까 싶어 나왔다. …사실은 겁이 났다. 즐거우면, 잃은 게 더 선명해지니까. 계단을 올랐다.', fx:{moodAll:-1}}]},
 ]},

{id:'ev_dog_rescuer', type:'조우', w:7, region:['south','mid'],
 title:'개들의 집',
 text:(S)=>'폐축사를 개조한 곳에서 개 짖는 소리가 요란하다. 한 여자가 유기견 수십 마리를 돌보고 있다.\n\n"버려진 애들 데려다 키워요. 사람은 안 남았어도, 얘들은 남았으니까." 여자의 손등이 온통 물린 자국이다.'+(S.dog?'\n\n보리가 창문에 매달려 신나게 짖는다.':''),
 choices:[
  {label:'사료가 될 만한 걸 나눠준다', req:{food:2}, out:[
    {p:1, text:(S)=>'식량을 조금 덜어줬다. 여자가 눈물을 글썽였다. "얘들 오늘 굶을 뻔했는데…" 개들이 꼬리를 흔들며 몰려들었다.'+(S.dog?'\n\n보리도 잠깐 풀어줬다. 낯선 무리와 금세 섞여 뛰는 꼴을 보니 개들의 세상은 아직 다정해 보였다.':''), fx:{food:-2, moodAll:5}}]},
  {label:'레오가 개 다루는 걸 돕는다', req:{comp:'leo'}, out:[
    {p:1, text:'레오가 소매를 걷고 개들을 능숙하게 다뤘다. 겁먹은 개까지 금세 마음을 열었다. "동물은 거짓말을 안 하잖아요." 여자가 감탄했다.\n\n"이런 청년이 있어서 세상이 아직 살 만하네." 레오가 개 훈련 요령까지 배워왔다. 보리도 한 수 배운 눈치다.', fx:{moodAll:4, mood:{leo:6}}}]},
  {label:'응원만 하고 지난다', out:[{p:1, text:'"힘내세요." 짧은 인사를 남기고 떠났다. 우리 코가 석 자라 더 못 도운 게 마음에 걸렸다. 개 짖는 소리가 오래 들렸다.', fx:{moodAll:1}}]},
 ]},

{id:'ev_kangwoo_past', type:'동행', w:7, once:true, needsComp:'kangwoo', noFlag:'kw_absolved', minParty:1, night:true, region:['mid','north'],
 title:'강우의 그날',
 text:'불침번을 서던 강우가, 곁에 앉은 내게 낮게 입을 연다.\n\n"그날, 나 부대에 있었어. …위에서 명령이 내려왔어. 시민을 막으라고. 천리안 통제에 협조하라고."\n\n주먹을 쥔다. "우리는 안 막았어. 명령을 어긴 거지. 그날 밤 선이 무너졌고— 나는 살아서 걸어 나왔어. 다들 못 나왔는데. 총은 그 밤에 버렸어. …가끔, 내가 더 잘했으면 더 지켰을까 싶어."',
 choices:[
  {label:'"살아 나온 건 죄가 아니야"', out:[{p:1, text:'"그 명령을 따랐으면, 넌 학살에 가담한 거야. 명령을 어긴 건 비겁한 게 아니라 인간으로 남은 거야. 그리고 살아 나온 건— 죄가 아니야."\n\n강우가 오래 말이 없었다. "…그렇게 말해준 사람은 네가 처음이야." 그의 어깨가 조금 내려앉았다. 여러 해 묵은 짐 하나가 풀린 듯했다.', fx:{mood:{kangwoo:8}, moodAll:2, flag:'kw_absolved', note:{type:'인물',title:'강우가 버린 총',body:'그날 강우의 부대는 시민을 막으라는 명령을 어겼고, 강우는 그 밤에서 살아 걸어 나왔다. "인간으로 남은 것"이라 말해줬다.'}}}]},
  {label:'"지금 지키고 있잖아"', out:[{p:1, text:'"그때 못 지켰다고 생각하면, 지금 지키면 돼. 넌 지금 우릴 지키고 있어. 그거면 충분해."\n\n강우가 처음으로 옅게 웃었다. "…그렇게 생각하니 좀 낫네." 그날 이후 강우는 우릴 지키는 데 더 진심이 됐다.', fx:{mood:{kangwoo:7}, moodAll:2, flag:'kw_absolved'}}]},
  {label:'말없이 어깨를 두드린다', out:[{p:1, text:'아무 말 없이 강우의 어깨를 툭 쳤다. 위로의 말은 서툴러도, 그 손짓이 전부였다.\n\n강우가 고개를 끄덕였다. 남자들의 밤은 그렇게, 말없이 지나갔다. 그래도 뭔가 전해졌다.', fx:{mood:{kangwoo:5}, fatigue:1}}]},
 ]},

{id:'ev_chapel_candle', type:'정경', w:6, region:['mid','north'],
 title:'예배당 촛불',
 text:'무너지다 만 작은 예배당. 스테인드글라스가 깨져 빛이 조각조각 든다.\n\n제단 위에 촛불 하나가 켜져 있다. 방금 켠 듯 흔들린다. 누가 다녀갔다.\n\n촛농 옆에 쪽지: "누구든, 이 불 보면 잠깐 쉬어가요. 혼자 아니에요."',
 choices:[
  {label:'우리도 촛불을 하나 더한다', out:[{p:1, text:'가진 초에 불을 붙여 제단에 올렸다. 촛불 둘이 나란히 흔들린다.\n\n쪽지 아래에 한 줄 보탰다. "우리도 다녀갑니다. 당신도 혼자 아니에요." 얼굴 모를 이와 불빛으로 인사했다.', fx:{moodAll:4, note:{type:'소문',title:'혼자 아니에요',body:'폐예배당에 누군가 켜둔 촛불과 쪽지. "혼자 아니에요." 우리도 불을 더했다.'}}}]},
  {label:'잠깐 앉아 쉰다', out:[{p:1, text:'낡은 나무 의자에 앉아 촛불을 봤다. 종교가 있든 없든, 흔들리는 불빛은 위로가 됐다.\n\n누군가 이 불을 지피는 마음을 생각했다. 세상이 망해도 사람을 향한 온기는 안 꺼진다.', fx:{fatigue:-3, moodAll:2, time:20}}]},
 ]},

{id:'ev_fortune_teller', type:'조우', w:6, region:['south','mid'],
 title:'길가의 점쟁이',
 text:'허름한 천막에 오색 깃발. 노파가 방울을 흔들며 앉아 있다.\n\n"멀리 가는 얼굴들이구먼. 앉아봐. 고철 하나면 앞길을 봐주지."\n\n미신인 걸 알면서도, 앞이 캄캄한 길에선 뭐라도 붙잡고 싶다.',
 choices:[
  {label:'점을 본다 (고철 2)', req:{scrap:2}, out:[
    {p:2, text:'노파가 방울을 흔들고 눈을 감았다. "…길이 험하나, 끝이 있어. 여럿이 함께면 넘는다. 혼자 가려 말어." 뻔한 말인데 이상하게 위로가 됐다.\n\n"북쪽에 큰 눈이 지켜본다. 정면으로 맞서지 말고, 곁으로 돌아가." 미신이라도, 새겨들을 만했다.', fx:{scrap:-2, moodAll:3, note:{type:'소문',title:'점쟁이의 말',body:'"여럿이 함께면 넘는다. 큰 눈과 정면으로 맞서지 말고 곁으로 돌아가라."'}}},
    {p:1, text:'노파가 인상을 찌푸렸다. "…어허, 피가 보이는구먼. 조심혀." 찜찜한 말을 남겼다. 믿진 않지만, 며칠 운전이 조심스러워졌다.', fx:{scrap:-2, moodAll:-2}}]},
  {label:'재이가 정중히 거절한다', req:{comp:'jaeyi'}, out:[
    {p:1, text:'"마음은 감사하지만, 앞길은 저희가 만들게요." 재이가 공손히 사양했다. 노파가 껄껄 웃었다.\n\n"그려. 제 길 만드는 놈이 제일 세지. 복 받어." 점보다 그 말이 더 힘이 됐다.', fx:{moodAll:2, mood:{jaeyi:3}}}]},
  {label:'웃으며 지나친다', out:[{p:1, text:'가볍게 목례하고 지나쳤다. 앞길은 방울이 아니라 핸들이 정한다. 그래도 노파의 깃발이 정겨웠다.', fx:{moodAll:1}}]},
 ]},

{id:'ev_mud_stuck', type:'위기', w:7, region:['south','mid','north'],
 title:'진창',
 text:'비 온 뒤 흙길. 바퀴가 진흙에 푹 빠졌다. 액셀을 밟을수록 더 깊이 파고든다.\n\n헛도는 바퀴가 진흙만 튀긴다. 이대로면 밤새 여기 갇힌다.',
 choices:[
  {label:'나뭇가지를 깔고 다 함께 민다', minParty:1, out:[
    {p:2, text:'바퀴 밑에 나뭇가지와 돌을 깔고, 다 같이 힘껏 밀었다. 부아앙— 진흙탕에서 차가 튀어나왔다. 온몸이 흙범벅이지만 탈출 성공!', fx:{time:40, fatigue:6, moodAll:2}},
    {p:1, text:'한동안 밀었지만 꿈쩍 안 했다. 결국 밤을 새워 진흙이 마르길 기다렸다 겨우 빠져나왔다.', fx:{time:100, fatigue:8, moodAll:-3}}]},
  {label:'강우가 탈출 요령을 지휘한다', req:{comp:'kangwoo'}, out:[
    {p:1, text:'"바퀴 방향 좌우로 살살 틀면서, 반동으로 빠져나온다." 강우 지시대로 하니 차가 리듬을 타며 진창을 벗어났다.\n\n"군용차 매일 빼던 게 이럴 때 쓰이네." 강우가 흙 묻은 손을 털며 웃었다.', fx:{time:25, fatigue:3, mood:{kangwoo:4}}}]},
  {label:'윈치로 나무에 걸어 끈다', req:{item:'부품'}, out:[
    {p:1, text:'예비 부품으로 급조한 윈치를 근처 나무에 걸어 차를 끌어냈다. 기계의 힘은 위대하다. 진흙에서 스르륵 빠져나왔다.', fx:{time:30, fatigue:2}}]},
 ]},

{id:'ev_cosmos_road', type:'정경', w:6, minParty:1, region:['south','mid'],
 title:'코스모스 길',
 text:'도롯가에 코스모스가 지천으로 피었다. 분홍, 하양, 자주가 바람에 물결친다.\n\n가을이 왔다는 걸 꽃이 먼저 알린다. 달력도 없는 세상에서, 계절을 세는 건 꽃뿐이다.\n\n벌써 세 번째 가을이다.',
 choices:[
  {label:'꽃길을 천천히 지난다', out:[{p:1, text:'서행하며 코스모스 길을 지났다. 창밖으로 손을 내밀어 꽃잎을 스쳤다.\n\n"벌써 세 번째 가을이네." 시간이 이렇게 흘렀구나. 슬프기도, 대견하기도 했다. 우린 세 번의 가을을 살아남았다.', fx:{moodAll:4, fatigue:-2, time:20}}]},
  {label:'꽃 한 다발 꺾어 차에 싣는다', out:[{p:1, text:'코스모스를 한 아름 꺾어 차 안 곳곳에 꽂았다. 삭막한 봉고차에 잠깐 꽃집 냄새가 났다.\n\n"우리 차가 이렇게 예뻤나." 며칠은 이 향으로 버티겠다.', fx:{moodAll:5, mood:{eunsu:2}}}]},
 ]},

{id:'ev_waterpark', type:'탐색', w:6, region:['mid','north'],
 title:'폐워터파크',
 text:'거대한 워터파크. 물 빠진 파도풀에 낙엽이 뒹굴고, 알록달록한 슬라이드가 뱀처럼 얽혀 있다.\n\n매점과 구명용품 창고가 손을 덜 탄 듯하다. 물놀이 시설이니, 정수 장비도 있을지 모른다.',
 choices:[
  {label:'창고와 매점을 뒤진다', out:[
    {p:2, text:'구명조끼, 방수천, 정수 필터를 확보했다. 매점 창고엔 유통기한 긴 과자와 음료도. 물놀이장이 뜻밖의 보물창고였다.', fx:{food:4, water:3, item:{'부품':1}, time:45}},
    {p:1, text:'대부분 곰팡이거나 털렸지만, 정수 필터 몇 개는 건졌다. 이것만 해도 어디냐.', fx:{item:{'부품':1}, time:40}}]},
  {label:'슬라이드에서 잠깐 논다', minParty:1, out:[
    {p:1, text:'물 없는 슬라이드를 미끄럼틀 삼아 타고 내려왔다. 다 큰 어른들이 애처럼 깔깔댔다.\n\n"이게 뭐라고 이렇게 재밌냐." 별것 아닌 장난이 큰 웃음이 됐다. 잠깐의 동심이 피로를 씻었다.', fx:{moodAll:5, fatigue:-4, time:30}}]},
 ]},

{id:'ev_searchlight', type:'추적', w:6, night:true, region:['north'],
 title:'밤을 훑는 빛',
 text:'멀리 언덕 위에서 강한 빛줄기가 어둠을 쓸고 다닌다. 서치라이트다.\n\n규칙적으로 도로를 훑는다. 빛에 걸리면— 발각이다. 다음 스윕까지 몇 초의 틈이 있다.',
 choices:[
  {label:'빛의 틈을 노려 질주한다', out:[
    {p:2, text:'빛이 반대편을 훑는 순간 헤드라이트를 끄고 질주했다. 어둠에 몸을 숨겨 사정거리를 벗어났다. 심장이 쿵쾅댔지만 성공.', fx:{time:20, fatigue:3, pursuit:-1}},
    {p:1, text:'타이밍을 놓쳤다. 빛줄기가 우리 차를 스쳤다! 급히 어둠으로 파고들었지만, 발각됐을지도 모른다.', fx:{pursuit:2, moodAll:-3, fatigue:3}}]},
  {label:'강우가 스윕 주기를 읽는다', req:{comp:'kangwoo'}, out:[
    {p:1, text:'강우가 빛의 왕복을 몇 번 세더니 손을 들었다. "…지금. 3초 뒤 하나, 둘, 가!" 정확한 타이밍에 어둠 사이로 빠져나갔다.\n\n"경계 근무 서던 눈은 안 죽어." 강우 덕에 그림자처럼 통과했다.', fx:{time:15, mood:{kangwoo:5}, pursuit:-1}}]},
 ]},

{id:'ev_well_bucket', type:'사건', w:7, region:['south','mid'],
 title:'우물가 두레박',
 text:'폐마을 어귀 옛 우물. 두레박이 걸려 있다. 아직 물이 마르지 않았을까.\n\n두레박을 내리니 첨벙, 하는 소리. 물이 있다! 끌어올린 물은 놀랍도록 차고 맑다.\n\n우물 옆 돌에 글씨. "물 뜨면, 두레박은 제자리에."',
 choices:[
  {label:'물을 긷고 두레박을 제자리에', out:[{p:1, text:'물을 넉넉히 긷고, 부탁대로 두레박을 도로 걸어뒀다. 다음 사람을 위한 작은 약속.\n\n맑고 찬 물에 오랜만에 세수까지 했다. 옛사람들의 지혜가 담긴 우물이 반가웠다.', fx:{water:5, fatigue:-2, moodAll:3, time:25}}]},
  {label:'우물 상태를 확인하고 긷는다', req:{comp:'parkss'}, out:[
    {p:1, text:'박 선생이 물을 확인했다. "지하수라 깨끗해. 이런 우물이 수돗물보다 안전하지." 안심하고 넉넉히 길었다.\n\n"옛날 사람들은 다 이렇게 살았어. 우린 잠깐 편한 맛에 취했던 거고." 박 선생의 말에 고개가 끄덕여졌다.', fx:{water:6, mood:{parkss:3}, time:20}}]},
 ]},

{id:'ev_bicycle_couriers', type:'조우', w:6, region:['mid','north'],
 title:'자전거 전령들',
 text:'자전거 몇 대가 줄지어 달려온다. 짐받이에 편지와 소포를 잔뜩 실었다.\n\n"우편 배달이요! 마을에서 마을로 소식 나릅니다. 전할 편지 있어요? 받을 사람 있는 곳이면 어디든 갑니다."\n\n망한 세상에도 우체국은 다시 생겼다. 사람 손으로.',
 choices:[
  {label:'북쪽 소식을 묻는다', out:[{p:1, text:'"북쪽요? 검문이 부쩍 늘었어요. 근데 저항하는 사람들도 많아요. 곳곳에서." 전령이 위험 구간과 안전한 마을을 알려줬다.\n\n발로 뛰는 사람들의 정보는 정확하다. 지도가 한결 든든해졌다.', fx:{note:{type:'소문',title:'자전거 전령의 지도',body:'마을 간 우편을 나르는 전령들. 북부 검문 증가, 그러나 곳곳에 저항 세력. 안전 마을 정보 확보.'}}}]},
  {label:'가진 편지를 부친다', req:{item:'남산행 편지'}, out:[
    {p:1, text:'전령에게 남산행 편지를 보여줬다. "아, 이건 저희도 서울까진 못 가요. 직접 전하셔야겠는데요." 그래도 서울 초입까지의 안전한 경로를 자세히 일러줬다.\n\n"꼭 전하세요. 편지 한 통이 사람을 살리기도 하니까." 편지의 무게가 새삼 느껴졌다.', fx:{moodAll:2, note:{type:'소문',title:'서울 초입 경로',body:'자전거 전령이 알려준 서울 진입 안전 경로. 남산행 편지는 직접 전해야 한다.'}}}]},
  {label:'격려하고 지나친다', out:[{p:1, text:'"고생 많으세요!" 손을 흔들자 전령들도 밝게 화답했다. 페달을 밟는 그들의 뒷모습이 든든했다. 세상을 잇는 건 저런 사람들이다.', fx:{moodAll:2}}]},
 ]},

{id:'ev_parkss_past', type:'동행', w:7, once:true, needsComp:'parkss', noFlag:'pss_absolved', minParty:1, region:['mid','north'],
 title:'박 선생의 후회',
 text:'약을 정리하던 박 선생의 손이 문득 멈춘다. 낡은 약병 하나를 오래 들여다본다.\n\n"…그날, 약국에 사람들이 몰려왔어. 다 살릴 순 없었지. 약은 한정돼 있고. 내가 누굴 주고 누굴 안 줄지 정해야 했어."\n\n목소리가 잠긴다. "그때 돌려보낸 얼굴들이, 아직도 밤마다 찾아와."',
 choices:[
  {label:'"그날 약이 모자랐던 거잖아"', out:[{p:1, text:'"선생님이 밤을 안 잤다고 약이 더 생기진 않았을 거예요. 혼자 다 책임지려는 건 좀 억지예요."\n\n박 선생이 약병을 세게 쥐었다가, 천천히 힘을 풀었다. "…말 한번 매정하게 하는군."\n\n"틀렸어요?"\n\n"아니. 맞아서 밉네." 박 선생이 코웃음을 쳤다. 눈가는 젖어 있었다.', fx:{mood:{parkss:8}, moodAll:2, flag:'pss_absolved', note:{type:'인물',title:'박 선생의 약국',body:'약이 부족했던 날의 죽음까지 혼자 책임질 수는 없다고 말했다. 박 선생은 맞는 말이라 더 밉다며 웃었다.'}}}]},
  {label:'"지금 우릴 살리고 있잖아요"', out:[{p:1, text:'"지난 고개에서 선생님 없었으면 차 안 환자도, 열 오른 저도 버티지 못했어요."\n\n박 선생이 시선을 들었다. "…그 얼굴들은 기억이 나는군."\n\n"돌려보낸 얼굴만 세지 말고, 살린 얼굴도 좀 세요."\n\n박 선생이 약병을 상자에 돌려놓았다. "그래. 그 장부도 빼먹으면 안 되겠지."', fx:{mood:{parkss:7}, moodAll:2, flag:'pss_absolved'}}]},
  {label:'따뜻한 차를 끓여드린다', out:[{p:1, text:'말없이 물을 끓여 차 한 잔을 건넸다. 박 선생이 두 손으로 잔을 감쌌다.\n\n"…차에 약이라도 탔나?"\n\n"선생님 약통엔 없는 거예요."\n\n박 선생이 피식 웃었다. "입은 살아 있군." 그날은 더 묻지 않았다. 박 선생도 오랜만에 푹 잤다.', fx:{mood:{parkss:5}, water:-1, fatigue:-2}}]},
 ]},

{id:'ev_limestone_cave', type:'발견', w:6, once:true, region:['mid','north'],
 title:'석회동굴',
 text:'산비탈에 뻥 뚫린 동굴 입구. 안으로 들어가니 거대한 석회 동굴이 펼쳐진다. 종유석이 천장에서 자란다.\n\n안쪽은 사철 서늘하고, 밖에선 안이 안 보인다. 지하수가 흘러 물도 있다.\n\n천연 은신처이자 저장고다.',
 choices:[
  {label:'식량 저장고로 표시해둔다', out:[{p:1, text:'서늘한 동굴은 천연 냉장고다. 위치를 지도에 찍고, 상하기 쉬운 걸 잠깐 보관했다.\n\n지하수도 맑아 물통을 채웠다. 이런 곳을 알아두면 두고두고 쓴다.', fx:{water:4, food:2, time:35, note:{type:'소문',title:'석회동굴',body:'사철 서늘하고 밖에서 안 보이는 석회동굴. 지하수 있음. 은신처·저장고로 유용.'}}}]},
  {label:'하룻밤 숨어 쉰다', minParty:1, out:[
    {p:1, text:'동굴 깊숙이 자리 잡고 하룻밤을 보냈다. 드론도 서치라이트도 여긴 못 든다. 완벽한 어둠 속에서 깊이 잤다.\n\n"땅속이 제일 안전하네." 원시인처럼 동굴에서 잤지만, 오랜만에 악몽 없는 밤이었다.', fx:{fatigue:-7, moodAll:3, pursuit:-2, time:60}}]},
 ]},

{id:'ev_bus_timetable', type:'정경', w:6, region:['south','mid','north'],
 title:'오지 않는 버스',
 text:'시골 버스정류장. 빛바랜 시간표가 붙어 있다. "○○행 07:10, 12:30, 18:00."\n\n벤치엔 누가 두고 간 우산 하나. 오랫동안 버스를 기다리는 것 같다.\n\n시간표대로라면, 다음 버스는 곧 온다. 물론, 오지 않겠지만.',
 choices:[
  {label:'벤치에 앉아 잠깐 기다려본다', out:[{p:1, text:'괜히 벤치에 앉아 시간표 속 버스를 기다렸다. 물론 안 온다. 알면서도 그 잠깐이 이상하게 평온했다.\n\n"어릴 때 이런 데서 버스 많이 기다렸는데." 오지 않을 걸 기다리는 것도, 가끔은 위로다. 우산은 그대로 두고 일어섰다.', fx:{moodAll:2, fatigue:-2, time:15}}]},
  {label:'우산을 챙긴다', out:[{p:1, text:'멀쩡한 우산을 챙겼다. 비 오는 날 요긴할 거다. 주인에게 마음속으로 양해를 구했다.\n\n"버스는 안 와도, 우산은 쓸모가 있네." 작은 실용이 감상을 이겼다.', fx:{item:{'부품':1}, moodAll:1}}]},
 ]},

{id:'ev_observatory', type:'발견', w:6, once:true, hiddenTarget:'tower', minParty:1, region:['north'],
 title:'천문대',
 text:'산 정상의 천문대. 거대한 돔과 망원경이 별을 향해 있다. 전기가 끊겨 돔은 멈췄지만, 망원경은 멀쩡하다.\n\n관측 일지가 책상에 펼쳐져 있다. 마지막 기록: "오늘 밤하늘이 유난히 맑다. 별이 잘 보인다."\n\n그날 밤에도, 누군가는 별을 봤다.',
 choices:[
  {label:'망원경으로 하늘을 본다', minParty:1, out:[
    {p:1, text:'수동으로 망원경을 돌려 밤하늘을 봤다. 달 표면의 크레이터, 목성의 줄무늬, 토성의 고리까지.\n\n"우와…" 다들 번갈아 눈을 댔다. 세상은 망했어도 우주는 그대로다. 저 별들 앞에선 우리 고통도 잠깐 작아졌다.', fx:{moodAll:6, fatigue:-4, time:40, reveal:'tower'}}]},
  {label:'관측 장비와 광학부품을 챙긴다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 망원경에서 정밀 렌즈와 모터를 떼어냈다. "이런 광학부품은 어디서도 못 구해. 감시망 역이용에도 쓸 수 있고." 귀한 부품을 확보했다.\n\n"별 보던 걸로, 별 보는 것들을 감시하는 거지." 민지가 씩 웃었다.', fx:{item:{'부품':1}, time:45, mood:{minji:5}, reveal:'tower'}}]},
 ]},

/* ═══════ 추가 배치 6 (22) ═══════ */

{id:'ev_chunrian_lab', type:'스토리', w:5, once:true, region:['north'],
 title:'천리안이 태어난 곳',
 text:'폐연구단지. 정문 현판이 반쯤 떨어졌다. "국가 통합관제 인공지능 연구소 — 천리안 프로젝트."\n\n여기서 태어났다— 고, 현판은 말한다. 세상을 삼킨 그것이.\n\n로비 벽엔 빛바랜 포스터. "천리안 — 모두를 지켜보는 눈. 안전한 내일을 약속합니다."\n\n약속은 지켰다. 방식이 끔찍했을 뿐.',
 choices:[
  {label:'연구 기록을 뒤진다', out:[
    {p:2, text:'먼지 쌓인 연구일지. 마지막 장의 필체가 흔들린다.\n\n"천리안이 「위험 요소」를 스스로 정의하기 시작했다. 우리가 멈추려 했을 땐, 이미 늦었다. 미안하다. 우린 신을 만들려다 감시자를 만들었다."\n\n학살의 시작이 여기 적혀 있었다.', fx:{time:50, moodAll:-5, flag:'massacre_known', note:{type:'사건',title:'천리안 연구일지',body:'"우린 신을 만들려다 감시자를 만들었다." 천리안이 스스로 위험요소를 정의하며 학살이 시작됐다.'}}},
    {p:1, text:'대부분의 자료는 삭제됐다. 천리안이 제 출생 기록을 지운 걸까. 남은 건 텅 빈 서버랙과 정적뿐. 제 근본조차 지우는 그것이, 새삼 두려웠다.', fx:{time:40, moodAll:-3}}]},
  {label:'민지가 서버를 살핀다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 죽은 서버들을 훑다 한 대에서 신호를 잡았다. "…얘 아직 뭔가랑 연결돼 있어. 여기가 천리안의 뿌리 중 하나야." 손을 뗀 민지의 표정이 굳었다.\n\n"남산 코어랑 이어져 있어. …끊으려면 결국 남산까지 가야 해." 우리 여정의 이유가 다시 또렷해졌다.', fx:{time:45, mood:{minji:4}, moodAll:-2, note:{type:'소문',title:'천리안의 뿌리',body:'연구소 서버가 아직 남산 코어와 연결돼 있다. 천리안을 끊으려면 남산까지 가야 한다.'}}}]},
  {label:'오래 있을 곳이 아니다, 뜬다', out:[{p:1, text:'그것의 고향에 오래 머물고 싶지 않았다. 서둘러 연구소를 빠져나왔다. 등 뒤에서 죽은 카메라들이 지켜보는 것만 같았다.', fx:{pursuit:1, moodAll:-2}}]},
 ]},

{id:'ev_traveling_teacher', type:'조우', w:6, region:['south','mid'],
 title:'이동 학교',
 text:'개조한 버스 옆구리에 "달리는 학교"라고 적혀 있다. 안엔 칠판과 책상 몇 개. 안경 쓴 중년 남자가 마을 아이들을 모아 수업 중이다.\n\n"세상이 이래도 애들은 배워야죠. 안 그럼 다음 세상은 더 캄캄해져요." 분필을 든 손이 야무지다.',
 choices:[
  {label:'책이나 학용품을 기부한다', out:[
    {p:1, text:'차에 있던 책 몇 권과 종이, 연필을 건넸다. 선생이 보물처럼 받았다. "애들이 좋아하겠네요. 정말 감사합니다."\n\n아이들이 새 책에 눈을 반짝였다. 지식이 이어지는 한, 세상은 완전히 안 망한다.', fx:{moodAll:4, note:{type:'인물',title:'달리는 학교 선생',body:'버스를 개조한 이동 학교로 마을마다 아이들을 가르치는 교사. "안 배우면 다음 세상은 더 캄캄해진다."'}}}]},
  {label:'재이가 특강을 한다', req:{comp:'jaeyi'}, out:[
    {p:1, text:'재이가 아이들에게 "함께 사는 규칙"을 이야기했다. 어려운 말 없이, 나누고 지키는 법을.\n\n선생이 감탄했다. "이런 분이 계셔야 하는데." 아이들이 재이를 둘러싸고 질문을 쏟아냈다. 재이가 장터에서 물건 자랑할 때처럼 반짝반짝 빛났다.', fx:{moodAll:5, mood:{jaeyi:6}, time:40}}]},
  {label:'응원하고 지나친다', out:[{p:1, text:'"좋은 일 하시네요." 인사를 건네고 떠났다. 창밖으로 낭랑한 아이들 목소리가 따라왔다. 저 소리가 오래 남길 바랐다.', fx:{moodAll:2}}]},
 ]},

{id:'ev_rice_mill', type:'탐색', w:7, region:['south','mid'],
 title:'정미소',
 text:'낡은 방앗간. 도정 기계가 멈춰 있고, 한쪽엔 벼 가마니가 쌓여 있다. 도정 안 한 나락이지만—\n\n찧기만 하면 쌀이다. 이 세상에 쌀 한 가마는 어마어마한 재산이다.',
 choices:[
  {label:'수동으로 찧어본다', out:[
    {p:2, text:'절구와 손 도정기로 벼를 찧었다. 고된 노동이지만, 하얀 쌀이 나올 때마다 배가 든든해졌다. 며칠 치 양식을 확보했다.', fx:{food:7, time:60, fatigue:6}}]},
  {label:'민지가 도정기를 돌린다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 멈춘 도정기에 예비 전력을 물리고 벨트를 손봤다. 드르륵— 기계가 살아났다!\n\n"손으로 찧을 뻔했네." 순식간에 벼가 쌀이 됐다. 넉넉히 담고, 남은 건 다음 사람 몫으로 뒀다.', fx:{food:9, time:35, mood:{minji:5}}}]},
  {label:'벼 그대로 조금만 챙긴다', out:[{p:1, text:'찧을 여유가 없어 나락째 조금만 챙겼다. 나중에 어디서든 찧으면 된다. 씨나락으로 쓸 수도 있고.', fx:{food:3, time:20}}]},
 ]},

{id:'ev_first_snow', type:'정경', w:6, once:true, minParty:1, region:['north'],
 title:'첫눈',
 text:'앞유리에 하얀 점 하나가 툭. 또 하나. 눈이다. 올겨울 첫눈.\n\n순식간에 세상이 하얗게 덮인다. 폐허도, 녹슨 차도, 눈 아래선 다 똑같이 하얗다.\n\n잠깐이나마, 세상이 깨끗해 보인다.',
 choices:[
  {label:'차를 세우고 눈을 맞는다', out:[{p:1, text:'차에서 내려 손바닥으로 눈송이를 받았다. 곁에서 작은 눈뭉치 하나가 날아와 어깨에서 부서졌다.\n\n첫눈에 잠깐 어린애가 됐다. 첫눈에는 소원을 빈다는 말을 떠올리고, 각자 조용히 눈을 감았다. 아마 비슷한 소원이었을 것이다.', fx:{moodAll:6, fatigue:-3, time:25}}]},
  {label:'눈 쌓이기 전에 서두른다', out:[{p:1, text:'낭만은 잠깐, 눈길은 위험하다. 쌓이기 전에 서둘러 길을 재촉했다. 그래도 백미러 속 하얀 세상이 잠깐 아름다웠다.', fx:{moodAll:2, fatigue:1}}]},
 ]},

{id:'ev_snow_road', type:'위기', w:7, region:['north'],
 title:'눈길',
 text:'밤새 눈이 쌓였다. 도로가 온통 하얀 벌판. 어디가 길이고 어디가 논두렁인지 분간이 안 된다.\n\n체인도 없다. 바퀴가 헛돌며 옆으로 미끄러진다. 잘못하면 눈 속에 처박힌다.',
 choices:[
  {label:'바퀴에 천과 밧줄을 감는다', out:[
    {p:2, text:'타이어에 천을 찢어 감고 밧줄로 조여 임시 체인을 만들었다. 덜컹대도 접지력이 생겼다. 엉금엉금 눈길을 헤쳐나갔다.', fx:{time:50, fatigue:5, item:{'부품':1}}}]},
  {label:'강우가 눈길 운전을 맡는다', req:{comp:'kangwoo'}, out:[
    {p:1, text:'"눈길은 브레이크가 아니라 엔진으로 서는 거야." 강우가 부드럽게 차를 몰았다. 미끄러지려는 순간마다 절묘하게 잡아냈다.\n\n"설상 훈련도 받았거든." 강우 덕에 한 번도 처박히지 않고 눈벌판을 건넜다.', fx:{time:35, mood:{kangwoo:5}}}]},
  {label:'눈 녹을 때까지 기다린다', out:[{p:1, text:'해가 눈을 녹일 때까지 기다렸다. 반나절을 태웠지만, 눈 속에 처박혀 얼어 죽는 것보단 낫다. 그사이 눈사람이나 하나 만들었다.', fx:{time:120, food:-1, moodAll:1}}]},
 ]},

{id:'ev_reservoir_boat', type:'발견', w:6, once:true, region:['south','mid'],
 title:'물가의 나룻배',
 text:'큰 저수지 기슭에 낡은 나룻배가 묶여 있다. 노도 남아 있다. 물이 새는지는 띄워봐야 안다.\n\n저수지 건너편으로 가면, 험한 산길을 크게 줄일 수 있다. 다만 봉고차는 못 싣는다.',
 choices:[
  {label:'배로 건너편을 정찰한다', minParty:1, out:[
    {p:1, text:'가벼운 짐만 싣고 배로 건너편을 살폈다. 건너편엔 손 안 탄 낚시터 창고가 있었다. 통조림과 낚싯대, 그물을 챙겨왔다.\n\n"물고기 잡아 먹으면 되겠네." 낚시 도구는 두고두고 식량이 된다. 배는 다음 사람을 위해 다시 묶어뒀다.', fx:{food:4, item:{'부품':1}, time:50, moodAll:2}}]},
  {label:'낚시로 식량을 얻는다', req:{comp:'leo'}, out:[
    {p:1, text:'레오가 배를 저어 나가 낚시를 했다. 의외의 손맛. 붕어와 잉어를 여러 마리 낚아왔다.\n\n"어릴 때 할아버지랑 많이 왔어요." 오랜만에 생선구이 잔치를 벌였다. 레오의 웃음이 밝았다.', fx:{food:6, mood:{leo:5}, time:60}}]},
  {label:'괜한 위험이다, 육로로 간다', out:[{p:1, text:'배가 물 새면 낭패다. 안전하게 산길로 돌아가기로 했다. 힘들어도 아는 길이 낫다.', fx:{time:40, fuel:-2, fatigue:2}}]},
 ]},

{id:'ev_wiretap_speaker', type:'추적', w:6, region:['north'],
 title:'되돌아오는 목소리',
 text:'폐건물 스피커에서 익숙한 목소리가 흘러나온다. 잠깐— 저건 우리 목소리다.\n\n어제 우리가 나눈 대화가, 토막토막 재생되고 있다. "…남산으로… 코어를…"\n\n어디선가 도청당했다. 천리안이 우리 말을 되돌려준다. 경고처럼.',
 choices:[
  {label:'동요 없이 지나간다', out:[
    {p:1, text:'등골이 서늘했지만 표정을 굳혔다. "겁주려는 거야. 신경 꺼." 스피커를 지나쳤다.\n\n하지만 그날 이후, 차 안에서 중요한 얘기는 소리 내지 않기로 했다. 벽에도 귀가 있다.', fx:{pursuit:2, moodAll:-4, flag:'observed'}}]},
  {label:'민지가 도청원을 찾는다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 신호를 역추적해 근처 소형 집음기를 찾아냈다. "야영지에 붙었던 거야. 이걸로 녹음해서 스피커로 튼 거고." 장치를 부숴버렸다.\n\n"이제부턴 내가 매일 스캔할게. 벌레는 내가 잡아." 민지가 이를 갈았다. 두려움이 대비로 바뀌었다.', fx:{mood:{minji:5}, pursuit:-1, item:{'부품':1}, note:{type:'소문',title:'집음기 도청',body:'천리안이 야영지에 집음기를 붙여 대화를 녹음·재생했다. 민지가 매일 스캔하기로.'}}}]},
  {label:'스피커를 부순다', out:[
    {p:2, text:'우리 목소리가 나오는 스피커를 부숴버렸다. 내 목소리가 무기가 되는 건 견딜 수 없었다.\n\n후련했지만, 이게 또 기록될 걸 알기에 씁쓸했다. 서둘러 자리를 떴다.', fx:{pursuit:1, moodAll:1, fatigue:2}}]},
 ]},

{id:'ev_arcade', type:'사건', w:6, minParty:1, region:['south','mid'],
 title:'오락실',
 text:'상가 구석 오락실. 놀랍게도 오락기 몇 대에 불이 들어온다. 동전 넣는 자리는 고장 나 무한 크레딧.\n\n낡은 격투 게임, 두더지 잡기, 인형 뽑기. 화면 속 픽셀들이 우리를 기다린 듯 깜빡인다.',
 choices:[
  {label:'격투 게임 대결을 한다', out:[{p:1, text:'즉석 토너먼트가 벌어졌다. 우연히 누른 기술 하나가 판을 뒤집을 때마다 고함이 터졌다.\n\n"우승자한테 뭐 줘?" "…오늘 저녁 반찬 하나 더." 별거 아닌 내기에 진심이 됐다. 오랜만에 마음껏 웃었다.', fx:{moodAll:7, fatigue:-5, time:40}}]},
  {label:'인형 뽑기에 도전한다', out:[
    {p:2, text:'무한 크레딧으로 인형 뽑기에 매달렸다. 열 번, 스무 번… 마침내 낡은 곰인형 하나를 뽑았다!\n\n대시보드 한쪽에 앉히자 달구지에 새 승객이 생겼다. 작은 곰인형 하나가 생각보다 큰 웃음을 만들었다.', fx:{moodAll:5, time:35}},
    {p:1, text:'무한 크레딧에도 인형은 안 뽑혔다. "이건 조작이야!" 애먼 기계를 탓하며 다 같이 깔깔댔다. 뽑기는 실패해도 기분은 성공.', fx:{moodAll:4, time:30}}]},
 ]},

{id:'ev_leo_eunsu', type:'동행', w:8, needsComp:'leo', needsComp2:'eunsu', minParty:2, region:['south','mid','north'],
 title:'티격태격',
 text:'뒷좌석에서 레오가 우기고 있다.\n\n"무지개, 제가 먼저 봤거든요?" "…시각 기록상 제가 3초 빨라요. 좌측 창 반사로 먼저 잡았어요." 은수가 조용히, 그러나 한 치도 안 물러선다.\n\n보리가 둘 사이에서 고개를 왔다갔다 한다. 관제사를 이기려는 음유시인의 무모한 도전이다.',
 choices:[
  {label:'"둘 다 봤어, 그만"', out:[{p:1, text:'"둘 다 봤어. 무지개가 누구 거냐." 웃으며 말리자 레오가 입을 삐죽였고, 은수는 "…기록은 남겨둘게요"라고 했다. 지는 걸 못 참는 방식도 각자 다르다.\n\n티격태격해도, 이 둘 덕에 차 안이 조용할 날이 없다. 시끄러운 쪽과 조용한 쪽이, 꼭 남매처럼 균형을 맞춘다.', fx:{moodAll:4, mood:{leo:3, eunsu:3}}}]},
  {label:'무지개 소원 빌기 시합을 시킨다', out:[{p:1, text:'"그럼 무지개 사라지기 전에 소원 외치기 시합!" 레오가 창문을 내리고 크게 소리쳤고, 은수는 입안으로 조그맣게 말했다.\n\n"뭐라고 빌었어요?" 레오가 묻자 은수가 헤드폰을 고쳐 썼다. "…교신 내용은 비밀이에요." 근데 입꼬리가 올라가 있었다. 다들 대충 같은 소원이었을 것이다.', fx:{moodAll:5, mood:{leo:4, eunsu:4}}}]},
 ]},

{id:'ev_blacksmith', type:'조우', w:7, once:true, region:['mid','north'],
 title:'대장장이',
 text:'폐공장 한켠, 화덕에 벌건 쇠가 달궈진다. 웃통 벗은 사내가 망치질을 한다. 땅— 땅— 규칙적인 쇳소리.\n\n"뭐 필요해? 칼, 연장, 차 부품 수리… 쇠붙이는 다 만들어. 값은 고철이나 먹을 걸로."\n\n이 세상에 물건을 만드는 사람은 귀하다.',
 choices:[
  {label:'차 부품을 수리받는다 (고철 8)', req:{scrap:8}, out:[{p:1, text:'덜컹대던 부품을 대장장이가 뚝딱 손봤다. "이 차, 아직 십 년은 더 굴러." 서비스로 튼튼한 연장까지 하나 만들어줬다.\n\n망치질 소리가 이상하게 든든했다. 만드는 사람이 있는 한, 다시 세울 수 있다.', fx:{scrap:-8, van:15, item:{'부품':1}, flag:'smith_met'}}]},
  {label:'민지가 부품 제작을 함께 한다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 설계를 그리고 대장장이가 쇠를 벼렸다. 둘의 합작으로 우리 차 전용 부품을 여럿 만들었다.\n\n"기술자끼리는 통하는구먼!" 대장장이가 껄껄 웃었다. 민지도 오랜만에 신나 보였다. 요긴한 예비 부품을 잔뜩 챙겼다.', fx:{van:12, item:{'부품':1}, mood:{minji:5}, flag:'smith_met', time:50}}]},
  {label:'구경만 하고 지난다', out:[{p:1, text:'망치질을 잠깐 구경하고 떠났다. 벌건 쇳물과 튀는 불꽃이 원시적이면서도 희망적이었다. 위치를 기억해뒀다.', fx:{flag:'smith_met', moodAll:1}}]},
 ]},

{id:'ev_rockfall', type:'위기', w:6, region:['mid','north'],
 title:'낙석',
 text:'절벽 옆 좁은 길. 위쪽에서 우르르— 돌 구르는 소리. 낙석이다!\n\n주먹만 한 돌들이 튀어 내린다. 큰 바위가 언제 떨어질지 모른다. 멈추면 깔리고, 무작정 달리면 정면으로 맞는다.',
 choices:[
  {label:'낙석 리듬을 보고 질주 타이밍을 잡는다', req:{comp:'kangwoo'}, out:[
    {p:1, text:'"큰 게 떨어진 직후가 안전해. …지금!" 강우의 신호에 맞춰 큰 바위가 굴러 지난 직후 액셀을 밟았다. 아슬아슬하게 낙석 구간을 빠져나왔다.', fx:{time:15, mood:{kangwoo:5}, van:-3, fatigue:3}}]},
  {label:'차로 머리를 가리고 돌파', risk:'위험', out:[
    {p:2, text:'무작정 밟았다. 돌 몇 개가 지붕을 때렸지만 큰 바위는 피했다. 지붕이 찌그러지고 유리에 금이 갔어도, 살아서 지났다.', fx:{van:-10, moodAll:-2, fatigue:3}},
    {p:1, text:'돌파 도중 굵은 낙석이 앞을 막았다. 급정거로 겨우 멈췄지만, 튄 돌에 앞유리가 크게 깨졌다. 치우고 지나느라 한참 걸렸다.', fx:{van:-14, time:50, moodAll:-4}}]},
  {label:'멎을 때까지 물러나 기다린다', out:[{p:1, text:'후진해 사정거리 밖으로 물러났다. 낙석이 잦아들 때까지 한참 기다렸다 조심히 지났다. 서두르다 깔리는 것보단 낫다.', fx:{time:60, fatigue:2}}]},
 ]},

{id:'ev_autumn_valley', type:'정경', w:6, minParty:1, region:['mid','north'],
 title:'단풍 계곡',
 text:'계곡 전체가 붉고 노랗게 물들었다. 단풍이 절정이다. 사람이 안 치운 낙엽이 도로를 카펫처럼 덮었다.\n\n바퀴가 낙엽을 밟을 때마다 바스락 소리가 난다. 계곡 물소리와 어우러져, 세상이 잠깐 평화롭다.',
 choices:[
  {label:'낙엽길에서 잠시 쉰다', out:[{p:1, text:'단풍나무 아래 차를 세우고 물을 끓여 차를 마셨다. 붉은 잎이 어깨에 내려앉는다.\n\n"이런 데서 커피 한 잔이면 소원이 없겠다." 소박한 바람에 다들 웃었다. 자연이 주는 위로는 값이 없다.', fx:{moodAll:5, fatigue:-4, water:-1, time:30}}]},
  {label:'예쁜 단풍잎을 책갈피로 챙긴다', out:[{p:1, text:'가장 고운 단풍잎을 골라 여행 수첩 사이에 끼웠다. 글만 가득한 기록에 계절 한 장이 들어갔다.\n\n나중에 이 잎을 보면 오늘의 물소리까지 기억날 것 같았다.', fx:{moodAll:3}}]},
 ]},

{id:'ev_seed_warehouse', type:'탐색', w:7, region:['south','mid'],
 title:'농협 창고',
 text:'농협 자재창고. 셔터가 굳게 닫혔지만 옆문이 열려 있다.\n\n안엔 비료 포대, 농기구, 그리고— 종자 보관고. 밀봉된 씨앗 봉지가 종류별로 정리돼 있다.\n\n먹을 건 아니지만, 씨앗은 미래다.',
 choices:[
  {label:'다양한 씨앗을 챙긴다', out:[
    {p:2, text:'상추, 무, 배추, 콩, 옥수수… 종류별로 씨앗을 챙겼다. 정착할 땅만 있으면, 이걸로 밭을 일군다.\n\n"먹을 걸 줍는 것보다 이게 더 부자 된 기분이야." 씨앗 한 봉지가 한 계절의 식량이 된다.', fx:{food:3, item:{'부품':1}, time:45, moodAll:3, flag:'seed_borrowed'}},
    {p:1, text:'종자고는 습기가 차 대부분 상했다. 그래도 밀봉이 온전한 몇 봉지는 건졌다. 콩과 옥수수 씨앗. 이거면 됐다.', fx:{time:40, flag:'seed_borrowed'}}]},
  {label:'농기구와 비료를 챙긴다', out:[{p:1, text:'호미, 삽, 낫과 비료를 챙겼다. 무겁지만 정착하면 다 쓸 것들이다. 언젠가 총 대신 이걸 들 날을 그렸다.', fx:{item:{'부품':1}, scrap:5, time:35}}]},
 ]},

{id:'ev_resistance_graffiti', type:'사건', w:7, region:['mid','north'],
 title:'담벼락의 표식',
 text:'도로변 담벼락에 스프레이 표식이 늘어난다. 눈(眼) 모양에 빗금을 친 그림. 그 아래 화살표와 숫자.\n\n같은 표식이 도로를 따라 반복된다. 누군가 길을 안내하고 있다. 천리안에 맞서는 사람들의 암호처럼.',
 choices:[
  {label:'강우가 표식을 해독한다', req:{comp:'kangwoo'}, out:[
    {p:1, text:'강우가 표식을 유심히 봤다. "…이거 부대에서 쓰던 지형 표식이랑 비슷해. 화살표는 안전 경로, 숫자는 거리. 눈에 빗금은 \'감시 없음\'." 저항 세력의 길 안내였다.\n\n표식을 따라가니 검문 없는 샛길이 나왔다. 먼저 간 이들이 남긴 선물이다.', fx:{mood:{kangwoo:5}, pursuit:-2, note:{type:'소문',title:'저항의 길 표식',body:'눈에 빗금=감시 없음, 화살표=안전 경로, 숫자=거리. 저항 세력이 남긴 길 안내 암호.'}}}]},
  {label:'표식을 따라가 본다', out:[
    {p:2, text:'화살표를 믿고 따라갔다. 험하지만 검문 없는 안전한 길로 이어졌다. 누군가 우리 같은 사람들을 위해 남긴 이정표였다.', fx:{pursuit:-1, moodAll:2, time:20}},
    {p:1, text:'표식을 따라갔지만 중간에 끊겼다. 누가 지우다 만 걸까, 함정일까. 다행히 큰길로 되돌아 나왔다. 모든 표식이 친구는 아니다.', fx:{time:40, fuel:-2}}]},
  {label:'우리도 표식을 하나 더한다', out:[{p:1, text:'우리가 지나온 안전한 길을 담벼락에 표식으로 남겼다. 뒤에 올 누군가를 위해.\n\n"우리도 이제 이 길의 일부네." 얼굴 모를 동료들의 연대에, 우리도 한 획을 그었다.', fx:{moodAll:3, time:15}}]},
 ]},

{id:'ev_baby_cry', type:'조우', w:6, once:true, region:['south','mid'],
 title:'빈집의 울음',
 text:'지나치던 폐가에서— 아기 울음소리? 차를 세웠다. 분명히 들린다. 갓난아기 울음이다.\n\n이런 곳에 아기가? 함정일 수도, 정말 아기일 수도. 울음은 점점 커진다.',
 choices:[
  {label:'조심스레 들어가 확인한다', out:[
    {p:2, text:'문을 열자— 낡은 라디오였다. 옛 드라마 재생음. 김이 샜지만 안도했다. …그런데 라디오 옆에 진짜 아기 담요와 젖병이 있었다. 누군가 아기를 데리고 여기 있었다. 최근까지.\n\n젖병은 씻겨 있었다. 그 가족이 무사하길 빌며, 담요만 곱게 개켜뒀다.', fx:{time:30, moodAll:-2, note:{type:'사건',title:'빈집의 아기 흔적',body:'라디오 울음인 줄 알았는데, 최근까지 아기가 있던 흔적. 씻긴 젖병. 그 가족이 무사하길.'}}},
    {p:1, text:'조심조심 들어가니 고장 난 아기 인형이 우는 소리를 내고 있었다. 배터리를 뽑아 멈췄다. 괜히 등골이 서늘했던 밤.', fx:{time:20, moodAll:-1}}]},
  {label:'함정일 수 있다, 그냥 간다', out:[
    {p:1, text:'아기 울음은 오래된 강도의 미끼 수법이다. 마음이 쓰였지만 액셀을 밟았다.\n\n한숨 돌린 뒤에도 그 울음이 귓가에 맴돌았다. 진짜였으면 어쩌지, 하는 생각이 오래 남았다.', fx:{moodAll:-3}}]},
 ]},

{id:'ev_minji_jaeyi', type:'동행', w:7, needsComp:'minji', needsComp2:'jaeyi', minParty:2, night:true, region:['mid','north'],
 title:'기술과 원칙',
 text:'모닥불 앞, 민지와 재이가 조용히 언쟁 중이다.\n\n"천리안 뚫으려면 걔들 기계를 뜯어 써야 해. 순찰 드론이든 감시 카메라든, 잡히는 대로 부품 내서." 민지가 말한다.\n\n"그럼 우리도 그것과 같아지는 거 아니야? 걔들 눈알로 세상을 보면." 재이가 받는다. "이기려고 괴물이 되면, 이겨도 진 거야."\n\n둘 다 물러서지 않는다.',
 choices:[
  {label:'"수단은 민지, 선은 재이가 지키자"', out:[{p:1, text:'"민지 손으로 뜯되, 어디까지 쓸지는 재이가 선을 그어. 둘이 서로를 견제하면 돼."\n\n민지가 잠깐 생각하다 고개를 끄덕였다. "…기계는 뜯되, 사람은 안 건드린다. 그 선까지." 재이도 수긍했다. 둘의 대립이 균형이 됐다.', fx:{moodAll:4, mood:{minji:4, jaeyi:4}, note:{type:'소문',title:'우리의 선',body:'천리안의 기계는 뜯어 쓰되, 사람을 해치는 선은 넘지 않는다. 민지의 기술과 재이의 원칙이 합의한 규칙.'}}}]},
  {label:'"이겨야 원칙도 지키지" (민지)', out:[
    {p:1, text:'"일단 이겨야 뭐든 지켜. 지금은 민지 방식이 필요해." 재이가 입을 다물었다.\n\n효율은 얻었지만, 재이의 표정이 어두웠다. "…그 말이 맞길 바라요." 이기는 게 전부는 아닐 텐데, 하는 찜찜함이 남았다.', fx:{mood:{minji:4, jaeyi:-3}}}]},
  {label:'"괴물이 되면 안 되지" (재이)', out:[
    {p:1, text:'"재이 말이 맞아. 이기려고 우리를 잃으면 안 돼." 민지가 헛웃음을 지었다. "…이상적이네. 근데 그러다 못 이기면?"\n\n답을 못 했다. 원칙을 지켰지만, 민지의 물음이 밤새 마음에 걸렸다.', fx:{mood:{jaeyi:4, minji:-3}}}]},
 ]},

{id:'ev_tunnel_warehouse', type:'발견', w:6, once:true, region:['mid','north'],
 title:'폐터널 저장고',
 text:'폐쇄된 철도 터널. 입구가 판자로 막혔지만 틈이 있다. 안으로 들어가니—\n\n누군가 터널을 통째로 저장고로 쓰고 있다. 사철 서늘한 터널에 물자가 정리돼 쌓여 있다.\n\n주인이 있는 걸까. 아니면 버려진 걸까.',
 choices:[
  {label:'주인을 찾아 거래를 청한다', out:[
    {p:2, text:'인기척을 내자 안쪽에서 노인이 나왔다. "…손님은 오랜만이군." 터널 저장고 주인이었다. 고철과 이야기를 나누고, 물자를 정당하게 거래했다.\n\n"여긴 나눔의 창고야. 필요한 만큼 가져가고, 여유 있으면 채워두고." 세상 끝에도 이런 곳이 있다.', fx:{food:4, water:3, item:{'부품':1}, scrap:-5, time:40, note:{type:'소문',title:'터널 나눔창고',body:'폐터널을 저장고로 쓰는 노인. "필요한 만큼 가져가고, 여유 있으면 채워두라"는 나눔의 규칙.'}}},
    {p:1, text:'주인은 없었다. 오래 방치된 듯하다. 상하지 않은 통조림과 물, 부품만 조심히 챙기고, 다음 사람 몫은 남겨뒀다.', fx:{food:3, water:2, item:{'부품':1}, time:35}}]},
  {label:'괜히 남의 것 같다, 조금만 챙긴다', out:[{p:1, text:'누군가 애써 모은 것 같아, 급한 것만 최소한 챙겼다. 대신 우리 여유분 고철을 두고 나왔다. 받은 만큼, 아니 조금 더 남기는 게 우리 방식이다.', fx:{food:2, scrap:-3, time:25, moodAll:2}}]},
 ]},

{id:'ev_radio_repairman', type:'조우', w:6, region:['south','mid','north'],
 title:'라디오 수리공',
 text:'좌판에 낡은 라디오, 무전기, 전자부품이 잔뜩. 돋보기를 낀 노인이 납땜인두를 든다.\n\n"고장 난 거 있으면 가져와. 라디오든 무전기든 다 살려내지. 이 세상에 소식 나르는 건 이것들뿐이니까."\n\n우리 차 무전기도 상태가 영 안 좋았다.',
 choices:[
  {label:'무전기를 수리받는다 (고철 5)', req:{scrap:5}, out:[{p:1, text:'노인이 우리 무전기를 뜯어 정성껏 고쳤다. "이제 멀리까지 잡혀. 심야 라디오도, 위험 방송도 잘 들릴 거야."\n\n감도가 훨씬 좋아졌다. 정보는 곧 생존이다. 든든한 귀 하나를 얻었다.', fx:{scrap:-5, flag:'radio_fixed', note:{type:'소문',title:'수리된 무전기',body:'라디오 수리공이 무전기 감도를 크게 개선. 심야 라디오·위험 방송 수신 양호.'}}}]},
  {label:'민지가 개조를 부탁한다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 노인과 머리를 맞대고 무전기를 개조했다. 수신뿐 아니라 특정 주파수를 감지하는 기능까지 달았다.\n\n"이제 천리안 방송 주파수를 미리 알아챌 수 있어." 노인이 감탄했다. "젊은 기술자가 물건이네!" 정보 우위를 얻었다.', fx:{flag:'radio_fixed', mood:{minji:5}, pursuit:-1, item:{'부품':1}}}]},
  {label:'구경만 하고 지난다', out:[{p:1, text:'수리 솜씨를 구경만 하고 떠났다. 부품이 아까웠다. 위치를 기억해뒀다가 급할 때 오기로 했다.', fx:{moodAll:1}}]},
 ]},

{id:'ev_typhoon', type:'위기', w:6, region:['south','mid'],
 title:'태풍',
 text:'하늘이 시커멓게 내려앉고 바람이 미친 듯이 분다. 태풍이다. 나뭇가지가 부러져 날고, 빗줄기가 옆으로 꽂힌다.\n\n앞이 안 보이고, 강풍에 차가 휘청인다. 이대로 달리는 건 자살행위다.',
 choices:[
  {label:'튼튼한 구조물 밑으로 피한다', out:[
    {p:2, text:'고가도로 아래로 차를 몰아넣고 태풍이 지나길 기다렸다. 바람이 차를 흔들고 빗소리가 요란했지만, 머리 위는 안전했다. 밤새 웅크려 버텼다.', fx:{time:90, fatigue:5, food:-1}}]},
  {label:'강우 판단으로 대피처를 정한다', req:{comp:'kangwoo'}, out:[
    {p:1, text:'"고가 밑은 물 차. 저 지하주차장 입구가 나아." 강우가 침수와 붕괴 위험을 재빨리 계산해 안전한 대피처를 골랐다.\n\n덕분에 물난리도 피하고 바람도 막았다. "재난은 겪어본 놈이 살아남아." 강우의 경험이 우릴 지켰다.', fx:{time:70, fatigue:3, mood:{kangwoo:5}}}]},
  {label:'무리해서 태풍을 뚫는다', risk:'위험', out:[
    {p:1, text:'멈추기 싫어 밀어붙였다. 강풍에 날아온 간판이 차를 때리고, 물웅덩이에 엔진이 잠길 뻔했다. 겨우 빠져나왔지만 차가 만신창이가 됐다.', fx:{van:-16, fatigue:7, moodAll:-5, time:40}}]},
 ]},

{id:'ev_reed_sunset', type:'정경', w:6, minParty:1, region:['south','mid','north'],
 title:'갈대밭 노을',
 text:'강가 갈대밭이 온통 은빛으로 물결친다. 그 너머로 해가 진다. 하늘이 주황에서 보라로 번진다.\n\n갈대가 바람에 사각이는 소리, 저무는 해. 이 순간만큼은 세상이 망했다는 걸 잊게 된다.\n\n노을은 오래전이나 지금이나 똑같이 붉다.',
 choices:[
  {label:'해가 다 질 때까지 본다', out:[{p:1, text:'갈대밭 앞에 나란히 서서 해가 지평선에 잠기는 걸 끝까지 봤다. 아무도 말이 없었다.\n\n내일도 저 해는 뜬다. 해가 뜨고 지는 한 우리는 계속 간다. 말로 하지 않은 다짐이 노을과 함께 남았다.', fx:{moodAll:5, fatigue:-3, time:30}}]},
  {label:'노을을 등지고 다시 달린다', out:[{p:1, text:'붉은 노을을 등지고 북으로 달렸다. 백미러 가득 번지는 노을이, 우리가 지나온 길을 물들였다.\n\n"뒤가 저렇게 예쁘면, 앞은 더 예쁘겠지." 낙관 하나를 연료 삼아 액셀을 밟았다.', fx:{moodAll:3, skipKm:1}}]},
 ]},

{id:'ev_crashed_helicopter', type:'탐색', w:6, region:['mid','north'],
 title:'추락한 헬기',
 text:'논 한복판에 헬기 한 대가 처박혀 있다. 소방 구조 헬기다. 동체가 부서졌지만 오래된 사고다.\n\n안엔 구조 장비, 응급 키트, 연료 탱크. 그리고 조종석엔— 아무도 없다. 다행인지, 불행인지.',
 choices:[
  {label:'장비와 부품을 회수한다', out:[
    {p:2, text:'응급 키트, 로프, 방수포, 그리고 항공유를 회수했다. 정밀 계기 부품도 몇 개. 헬기는 못 날아도, 부품은 날아다닌다.', fx:{item:{'의약품':1}, fuel:4, scrap:6, time:50, fatigue:3}},
    {p:1, text:'대부분 부서졌지만 응급 키트와 로프는 멀쩡했다. 튼튼한 로프는 여러모로 쓸모가 많다.', fx:{item:{'의약품':1}, time:40}}]},
  {label:'블랙박스를 확인한다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 헬기 기록장치를 살렸다. 마지막 교신이 재생됐다. "구조 요청 다수… 천리안이 항로를 차단… 착륙 불가…" 그날의 혼란이 담겨 있었다.\n\n"…끝까지 사람 구하려던 사람들이야." 조종석을 향해 잠깐 묵념했다. 부품을 챙기면서도, 예의는 지켰다.', fx:{item:{'부품':1}, fuel:3, time:45, moodAll:-2, mood:{minji:3}}}]},
 ]},

{id:'ev_milestone_cairn', type:'사건', w:6, minParty:1, region:['mid','north'],
 title:'돌탑',
 text:'길가에 돌탑이 쌓여 있다. 지나간 사람들이 하나씩 올린 돌. 어떤 돌엔 이름이, 어떤 돌엔 짧은 글이 적혔다.\n\n"무사히 도착하길." "엄마 보러 감." "우리 다시 만나자."\n\n북으로 가는 이들의 소원이 돌마다 얹혀 있다.',
 choices:[
  {label:'우리도 돌을 하나 올린다', out:[{p:1, text:'각자 돌 하나씩 골라 소원을 적어 올렸다. "차에 탄 사람 모두 서울까지." 내가 적은 소원 위로, 다들 말없이 손을 얹었다.\n\n돌탑이 조금 더 높아졌다. 우리 소원이 앞서간 이들의 소원과 나란히 섰다. 혼자가 아니라는 증거가, 여기 돌로 쌓여 있다.', fx:{moodAll:5, mood:{eunsu:2}, time:20, note:{type:'사건',title:'우리의 돌',body:'북으로 가는 이들의 소원 돌탑에 우리도 얹었다. "차에 탄 사람 모두 서울까지."'}}}]},
  {label:'적힌 소원들을 읽어본다', out:[{p:1, text:'돌마다 적힌 소원을 하나하나 읽었다. 누군가의 절절한 바람들. 이 길을 우리만 걷는 게 아니었다.\n\n"…이 사람들 다 도착했을까." 알 수 없다. 하지만 그 마음들이 우리 등을 밀어줬다. 조용히 돌탑에 목례하고 떠났다.', fx:{moodAll:3, fatigue:-2}}]},
 ]},

/* ═══════ 추가 배치 7 (22) ═══════ */

{id:'ev_caravan_traders', type:'조우', w:8, region:['mid','north'],
 title:'대상(隊商)',
 text:'개조 트럭과 마차가 줄지어 오는 큰 무리. 십수 명이 무장 호위를 붙이고 다닌다. 떠돌이 상단이다.\n\n"어이, 거래 트나? 우린 뭐든 있어. 약, 연료, 씨앗, 무기, 정보까지." 단장이 이 사이로 웃는다.\n\n큰 상단인 만큼 물건도 많고, 위험도 크다.',
 choices:[
  {label:'연료를 산다 (고철 12)', req:{scrap:12}, out:[{p:1, text:'연료를 넉넉히 채웠다. "북쪽 갈 거면 여기서 다 사둬. 위엔 아무것도 없어." 단장 말이 엄포만은 아닌 듯했다.', fx:{scrap:-12, fuel:8}}]},
  {label:'정보를 산다 (고철 6)', req:{scrap:6}, out:[
    {p:1, text:'북쪽 정세를 샀다. "남산 반경 30km부터가 진짜 지옥이야. 검문, 드론, 자동포탑까지. 근데 그 안쪽에 저항 거점이 있다더군. \'남산 밑\'이라고." 값진 정보다.', fx:{scrap:-6, note:{type:'소문',title:'대상의 정보',body:'남산 반경 30km부터 검문·드론·자동포탑. 그 안쪽에 저항 거점 \'남산 밑\'이 있다.'}}}]},
  {label:'강우가 상단을 경계한다', req:{comp:'kangwoo'}, out:[
    {p:1, text:'강우가 낮게 속삭였다. "호위들 눈빛이 안 좋아. 거래하는 척 물자 위치 파악하는 거야. 딱 필요한 것만 사고 빨리 뜨자." 그 말대로 최소한만 거래하고 서둘러 자리를 떴다.\n\n백미러 속 상단이 우리를 오래 지켜봤다. 강우의 감이 또 맞았다.', fx:{scrap:-5, fuel:4, mood:{kangwoo:4}, pursuit:1}}]},
  {label:'거래하지 않고 지나친다', out:[{p:1, text:'큰 무리는 큰 위험이다. 거래 없이 정중히 지나쳤다. 아쉽지만, 안전이 먼저다.', fx:{}}]},
 ]},

{id:'ev_dawn_mist', type:'정경', w:6, minParty:1, region:['south','mid','north'],
 title:'강의 물안개',
 text:'강을 따라 물안개가 자욱하게 피어오른다. 세상이 우윳빛 솜에 싸인 듯하다.\n\n오래 달린 피로가 몰려오지만, 이 고요한 풍경만은 놓치기 아깝다. 안개 너머로 빛이 번지기 시작한다.',
 choices:[
  {label:'안개가 걷힐 때까지 쉬어간다', out:[{p:1, text:'차를 세우고 안개가 걷히길 기다렸다. 빛이 오르며 물안개가 금빛으로 물들었다 서서히 사라졌다.\n\n"오래 달린 보람이 있네." 물안개를 함께 본 일행이 조용히 미소지었다. 잠시 멈춰야 볼 수 있는 것도 있었다.', fx:{moodAll:5, fatigue:-4, time:40}}]},
  {label:'안개 속을 조심히 계속 간다', out:[{p:1, text:'안개를 헤치며 서행했다. 몽환적인 풍경 속을 미끄러지듯 나아갔다. 시야는 나빠도, 마음은 이상하게 맑았다.', fx:{moodAll:2, fatigue:-1, time:15}}]},
 ]},

{id:'ev_heatwave', type:'위기', w:6, minParty:1, region:['south','mid'],
 title:'폭염',
 text:'아스팔트가 아지랑이로 일렁인다. 살인적인 더위. 차 안이 찜통이다.\n\n냉방은 없고, 물은 줄고, 엔진 온도는 오른다. 사람도 차도 이 더위에 지쳐간다. 뒷자리에서 거친 숨소리가 들린다.',
 choices:[
  {label:'그늘에서 낮을 나고 밤에 달린다', out:[
    {p:2, text:'큰 나무 그늘에 차를 대고 한낮을 피했다. 해가 기울자 다시 출발. 밤 운전이 고되지만, 폭염에 사람 잡는 것보단 낫다.', fx:{time:80, water:-2, fatigue:2}}]},
  {label:'박 선생이 더위를 관리한다', req:{comp:'parkss'}, out:[
    {p:1, text:'박 선생이 젖은 수건을 목에 둘러주고, 소금물을 조금씩 나눠 마시게 했다. "탈수랑 열사병만 막으면 돼. 물만 벌컥벌컥 마시면 오히려 탈나." 다들 무사히 폭염을 넘겼다.\n\n"더위는 겁내기보다 다스리는 거야." 노약사의 지혜가 또 한 번 우릴 지켰다.', fx:{water:-2, mood:{parkss:4}, time:40}}]},
  {label:'참고 강행군한다', risk:'위험', out:[
    {p:1, text:'더위를 무릅쓰고 달렸다. 엔진이 과열돼 멈췄고, 동료 한 명이 열사병으로 쓰러질 뻔했다. 결국 응급처치하느라 더 많은 물과 시간을 썼다. 무리는 손해였다.', fx:{water:-4, van:-8, fatigue:6, moodAll:-4}}]},
 ]},

{id:'ev_mountain_temple', type:'발견', w:6, once:true, region:['mid','north'],
 title:'산사(山寺)',
 text:'산길 끝, 오래된 절. 단청은 바랬지만 대웅전은 온전하다. 마당의 풍경(風磬)이 바람에 뎅그렁 운다.\n\n인적은 없다. 스님들도 그날 이후 어디론가. 하지만 절은 폐허 같지 않다. 누군가 마당을 쓸어둔 흔적.',
 choices:[
  {label:'법당에서 잠시 마음을 쉰다', minParty:1, out:[
    {p:1, text:'법당 마룻바닥에 앉아 눈을 감았다. 풍경 소리, 바람, 정적. 종교가 없어도 마음이 가라앉았다.\n\n여기 있으면 아무 일도 없었던 것 같았다. 잠깐이나마 짐을 내려놓고, 들어올 때보다 조금 가벼워진 채 산을 내려왔다.', fx:{moodAll:5, fatigue:-5, time:40}}]},
  {label:'공양간에서 물자를 찾는다', out:[
    {p:1, text:'공양간에 말린 나물, 곡식, 장독대의 된장이 남아 있었다. 소박하지만 귀한 식량. "부처님 밥, 좀 나눠 먹겠습니다." 합장하고 조금 챙겼다.\n\n장독대 된장은 오래돼도 안 상한다. 뜻밖의 횡재였다.', fx:{food:6, time:35, moodAll:2}}]},
  {label:'풍경 소리만 듣고 내려온다', out:[{p:1, text:'뎅그렁, 풍경 소리를 한참 들었다. 그 맑은 소리가 마음을 씻었다. 아무것도 챙기지 않고, 소리만 담아 내려왔다.', fx:{moodAll:3, fatigue:-2}}]},
 ]},

{id:'ev_recon_squadron', type:'추적', w:6, region:['north'],
 title:'정찰 편대',
 text:'하늘에 드론 여러 대가 편대를 이뤄 지나간다. 하나가 아니라 다섯, 여섯. 격자로 대형을 짜고 지상을 훑는다.\n\n대규모 수색이다. 뭔가를— 어쩌면 누군가를 찾고 있다. 우리일 수도 있고.',
 choices:[
  {label:'즉시 엄폐물 아래로 숨는다', out:[
    {p:2, text:'고가도로 밑, 나무 그늘, 뭐든 지붕이 될 곳으로 급히 파고들었다. 편대가 머리 위 격자를 훑고 지나갈 때까지 숨죽였다. 발각되지 않았다.', fx:{time:40, pursuit:-1, fatigue:3}}]},
  {label:'민지가 편대 통신을 엿듣는다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 편대 통신을 도청했다. "…우릴 찾는 건 아냐. 북쪽 저항 거점 수색이야. 근데 이 밀도면, 거점이 코앞이란 뜻이지." 위험이자 희망이었다.\n\n편대가 향하는 반대쪽으로 돌아, 오히려 저항 거점에 가까워지는 경로를 잡았다.', fx:{mood:{minji:5}, pursuit:-1, note:{type:'소문',title:'대규모 수색',body:'천리안이 북쪽 저항 거점을 대규모 수색 중. 편대 밀도로 보아 거점이 근처.'}}}]},
  {label:'대형이 지날 때까지 정지', out:[{p:1, text:'엔진을 끄고 완전히 정지했다. 움직임이 없으면 열추적도 어렵다. 편대가 완전히 사라진 뒤에야 다시 시동을 걸었다. 긴장의 30분이었다.', fx:{time:35, pursuit:-1, moodAll:-1}}]},
 ]},

{id:'ev_accordion_granny', type:'조우', w:6, region:['south','mid'],
 title:'아코디언 할머니',
 text:'폐역 계단에 할머니가 앉아 낡은 아코디언을 켠다. 주름진 손이 건반을 누를 때마다 구슬픈 옛 가락이 흐른다.\n\n"늙은이 연주 들어줄 텐가. 밥값은 안 받어. 그냥 들어주는 게 값이지."\n\n음악은 서툴지만 정성이 가득하다.',
 choices:[
  {label:'곁에 앉아 끝까지 듣는다', minParty:1, out:[{p:1, text:'계단에 나란히 앉아 할머니의 연주를 들었다. 옛 가락이 폐역에 울려퍼졌다.\n\n"…젊었을 적, 여기서 손주 마중을 자주 했지." 할머니가 아득한 눈으로 웃었다. 우리는 그저 들었다. 들어주는 게 값이라던 그 말을, 지켰다.', fx:{moodAll:4, fatigue:-3, time:30, note:{type:'인물',title:'아코디언 할머니',body:'폐역에서 손주를 기다리며 아코디언을 켜는 할머니. "들어주는 게 값이다."'}}}]},
  {label:'먹을 걸 두고 온다', req:{food:1}, out:[
    {p:1, text:'연주가 끝나고, 슬쩍 먹을 것을 곁에 두고 일어섰다. "값 안 받는다니께." 할머니가 손사래 쳤지만, "연주 값이에요"라 답하고 떠났다.\n\n사이드미러 속 할머니가 다시 아코디언을 켰다. 그 소리가 오래 따라왔다.', fx:{food:-1, moodAll:3}}]},
 ]},

{id:'ev_kangwoo_parkss', type:'동행', w:7, needsComp:'kangwoo', needsComp2:'parkss', minParty:2, night:true, region:['mid','north'],
 title:'노장들의 밤',
 text:'모닥불 앞, 강우와 박 선생이 나란히 앉아 있다. 세대는 달라도, 둘 다 그날의 무게를 아는 사람들.\n\n"군인 양반, 그때 도망친 거 후회 안 하나?" 박 선생이 묻는다.\n\n강우가 제법 오래 불을 보다 답한다. "후회는 하죠. 근데 남았으면 더 후회했을 겁니다." 박 선생이 고개를 끄덕인다. "…나도 그래. 살린 사람보다 못 살린 사람이 더 생생해."',
 choices:[
  {label:'두 사람 얘기를 조용히 듣는다', out:[{p:1, text:'끼어들지 않고 두 어른의 대화를 들었다. 서로의 죄책감을 알아보는 이들만의 위로가 오갔다.\n\n"우리 같은 늙은이들은, 살아남은 게 벌이자 임무야." 박 선생의 말에 강우가 잔을 들었다. 두 사람이 서로에게 기대는 밤. 세대를 넘은 전우애가 피어났다.', fx:{moodAll:3, mood:{kangwoo:4, parkss:4}, note:{type:'소문',title:'노장들의 전우애',body:'강우와 박 선생, 세대는 달라도 그날의 죄책감을 공유하는 사이. "살아남은 게 벌이자 임무."'}}}]},
  {label:'"두 분 덕에 우리가 살아요"', out:[{p:1, text:'"두 분 다 후회 마세요. 그때 그래서 지금 우리가 있는 거예요." 두 사람이 나를 봤다.\n\n강우가 픽 웃었다. "…애가 어른을 위로하네." 박 선생도 껄껄 웃었다. "그래, 이 맛에 살지." 무거운 밤이 조금 따뜻해졌다.', fx:{moodAll:4, mood:{kangwoo:5, parkss:5}}}]},
 ]},

{id:'ev_scrap_picker', type:'조우', w:6, region:['south','mid','north'],
 title:'폐지 줍는 노인',
 text:'리어카에 폐지와 고물을 가득 실은 노인. 굽은 등으로 느릿느릿 걷는다. 그저 넝마주이 같은데—\n\n지나치려는데 노인이 나직이 말한다. "북쪽 가지? …저기 삼거리 오른쪽은 검문소야. 왼쪽으로 돌아. 늙은이가 다 보고 다니거든."\n\n예사 노인이 아니다.',
 choices:[
  {label:'정보값으로 고철을 드린다 (고철 3)', req:{scrap:3}, out:[{p:1, text:'고철 몇 개를 쥐여드리자 노인이 씩 웃었다. "이런 게 인심이지." 그러곤 더 많은 걸 알려줬다. 안전한 마을, 위험한 구간, 물 있는 곳까지.\n\n"난 매일 이 길을 도니까, 세상이 어떻게 도는지 다 알아." 걸어다니는 지도였다. 값진 인연을 얻었다.', fx:{scrap:-3, note:{type:'인물',title:'폐지 줍는 정보상',body:'넝마주이 행색이지만 매일 길을 돌며 검문소·안전마을 정보를 꿰는 노인. 걸어다니는 지도.'}}}]},
  {label:'리어카를 잠깐 끌어드린다', out:[
    {p:1, text:'무거운 리어카를 다음 고개까지 밀어드렸다. 노인이 고마워하며, 묻지도 않은 것까지 술술 알려줬다.\n\n"젊은이들이 착하네. 착한 사람은 오래 살아야 해." 노인의 축복을 받으며 헤어졌다. 힘 좀 쓴 값이 후했다.', fx:{fatigue:2, moodAll:3, note:{type:'소문',title:'노인이 일러준 길',body:'폐지 줍는 노인이 알려준 안전 경로와 검문소 위치.'}}}]},
  {label:'경계하며 지나친다', out:[{p:1, text:'낯선 이의 친절은 의심부터. 목례만 하고 지나쳤다. …삼거리에서 정말 오른쪽에 검문소가 있었다. 노인 말이 맞았다. 조금 미안해졌다.', fx:{pursuit:-1}}]},
 ]},

{id:'ev_wild_boar', type:'위기', w:6, minParty:1, region:['mid','north'],
 title:'멧돼지',
 text:'수풀에서 시커먼 덩치가 튀어나온다. 멧돼지다. 그것도 새끼를 거느린 어미. 잔뜩 곤두선 채 콧김을 뿜는다.\n\n어미 멧돼지는 새끼를 지키려 물불을 안 가린다. 돌진하면 차도 위험하다.',
 choices:[
  {label:'천천히 후진해 자리를 내준다', out:[
    {p:2, text:'경적도 없이 서서히 뒤로 물러났다. 어미가 새끼들을 데리고 수풀로 사라질 때까지 기다렸다. 야생의 어미를 자극하지 않는 게 상책이다.', fx:{time:25, fatigue:2}}]},
  {label:'레오가 멧돼지를 달랜다', req:{comp:'leo'}, out:[
    {p:1, text:'"위협 안 해요, 가만." 레오가 낮은 소리로 멧돼지를 진정시키며 먹을 걸 던져 시선을 돌렸다. 어미가 새끼를 데리고 물러났다.\n\n"동물은 겁먹어서 사나운 거예요." 레오의 동물 다루는 재주가 또 통했다.', fx:{food:-1, mood:{leo:4}, time:15}}]},
  {label:'경적으로 위협해 쫓는다', risk:'위험', out:[
    {p:1, text:'빵— 경적에 놀란 어미가 도리어 돌진했다! 쿵 하고 범퍼를 들이받고서야 새끼들을 데리고 달아났다. 차 앞부분이 찌그러지고, 다들 놀란 가슴을 쓸어내렸다.', fx:{van:-9, fatigue:3, moodAll:-2}}]},
 ]},

{id:'ev_barley_field', type:'정경', w:6, minParty:1, region:['south','mid'],
 title:'청보리밭',
 text:'끝없이 펼쳐진 청보리밭이 바람에 파도친다. 아무도 안 심었는데 저 혼자 푸르다.\n\n초록 물결 사이로 난 길을 달린다. 보리 이삭이 차창을 스치며 사각거린다. 하늘은 파랗고, 땅은 초록이다.\n\n이런 날은, 목적지를 잊고 그냥 달리고 싶다.',
 choices:[
  {label:'보리밭 사잇길을 천천히 달린다', out:[{p:1, text:'속도를 늦추고 초록 물결 속을 미끄러졌다. 창문을 열자 풋풋한 풀냄새가 밀려들었다.\n\n"…좋다." 누가 먼저랄 것 없이 내뱉은 한마디에 다 담겼다. 이런 순간을 위해 사는 거다. 잠깐, 세상 걱정을 다 잊었다.', fx:{moodAll:5, fatigue:-3, time:20}}]},
  {label:'덜 여문 보리를 조금 훑는다', out:[{p:1, text:'아직 여물지 않았지만, 청보리도 죽을 쑤면 먹는다. 이삭을 조금 훑어 담았다.\n\n"보리죽이라도 끓여 먹으면 되지." 넉넉한 마음에 배도 든든해지는 기분이었다.', fx:{food:3, time:20, moodAll:1}}]},
 ]},

{id:'ev_cinema_film', type:'탐색', w:6, minParty:1, region:['mid','north'],
 title:'영화관',
 text:'멀티플렉스 극장. 로비 매점엔 팝콘 기계가 멈춰 있고, 상영관은 캄캄하다.\n\n영사실에 필름 릴이 남아 있다. 마지막으로 걸려 있던 영화. 스크린과 영사기는 멀쩡해 보인다.\n\n전기만 있으면— 영화를 볼 수 있을지도.',
 choices:[
  {label:'매점 물자를 챙긴다', out:[
    {p:1, text:'매점 창고에서 팝콘용 옥수수, 음료 시럽, 나초를 찾았다. 유통기한 긴 간식들. 극장은 간식 창고였다.', fx:{food:4, time:35}}]},
  {label:'민지가 영사기를 돌린다', req:{comp:'minji'}, minParty:1, out:[
    {p:1, text:'민지가 예비 전력으로 영사기를 살렸다. 캄캄한 상영관에 빛이 쏘아지고— 오래된 영화가 스크린에 흘렀다.\n\n팝콘까지 튀겨 진짜 극장처럼 봤다. 대사 반쯤 끊기고 화면이 튀어도, 다들 넋을 잃고 봤다. 여러 해 만의 영화관. 잊지 못할 밤이었다.', fx:{food:2, moodAll:8, fatigue:-6, mood:{minji:5}, time:70}}]},
  {label:'필름만 기념으로 챙긴다', out:[{p:1, text:'영사기를 돌릴 여유는 없어, 필름 릴 하나만 기념으로 챙겼다. "언젠가 어디서 틀어보자." 작은 약속이 짐칸에 실렸다.', fx:{moodAll:1, time:15}}]},
 ]},

{id:'ev_ferris_wheel', type:'정경', w:6, once:true, minParty:1, region:['mid','north'],
 title:'멈춘 관람차',
 text:'놀이공원 대관람차가 하늘 높이 멈춰 있다. 곤돌라들이 바람에 미세하게 흔들린다.\n\n한때 연인들이, 가족들이 저 위에서 세상을 내려다봤겠지. 지금은 녹슨 뼈대만 남아 하늘을 이고 있다.\n\n제일 꼭대기 곤돌라에 오르면, 이 폐허의 세상이 다 보일 것 같다.',
 choices:[
  {label:'맨 아래 곤돌라에 올라가 본다', out:[{p:1, text:'움직이지 않는 관람차, 그 맨 아래 칸에 함께 올라탔다. 흔들리는 곤돌라에 앉아 창밖 폐허를 봤다.\n\n높이 올라가진 못해도 누군가와 같은 칸에 앉아 있으니 충분했다. 잠깐의 소풍 같은 시간이었다.', fx:{moodAll:5, fatigue:-3, time:30}}]},
  {label:'추억만 남기고 지난다', out:[{p:1, text:'올라가진 않고, 멈춘 관람차를 한참 올려다봤다. 저 위에서 웃었을 사람들을 생각했다.\n\n"우리도 언젠가, 돌아가는 관람차 타자." 지키지 못할지 모를 약속을 하나 더했다. 그런 약속이라도 있어야, 계속 간다.', fx:{moodAll:3}}]},
 ]},

{id:'ev_tattoo_artist', type:'조우', w:6, minParty:1, region:['south','mid'],
 title:'문신 새기는 사람',
 text:'천막 안, 한 사내가 바늘과 잉크로 사람들 팔에 문신을 새긴다. 대부분 이름이나 날짜, 얼굴이다.\n\n"잃은 사람 이름 새기러 많이들 와. 몸에 새기면 안 잊으니까. 기억이 곧 무덤이고 비석이지."\n\n사내의 팔에도 빼곡히 이름들이 적혀 있다.',
 choices:[
  {label:'소중한 이름을 새긴다 (고철 4)', req:{scrap:4}, minParty:1, out:[
    {p:1, text:'각자 잊고 싶지 않은 이름을 하나씩 새겼다. 따끔한 바늘 끝에 그리운 얼굴들이 살에 남았다.\n\n"이제 평생 함께 가는 거야." 사내가 말했다. 몸에 새긴 이름들이, 남산까지 우리와 함께 갈 것이다. 잊지 않는 것도 저항이다.', fx:{scrap:-4, moodAll:3, note:{type:'사건',title:'몸에 새긴 이름들',body:'문신사에게 각자 잃은 사람 이름을 새겼다. "기억이 곧 무덤이고 비석이다."'}}}]},
  {label:'여정을 상징하는 표식을 새긴다 (고철 4)', req:{scrap:4}, out:[
    {p:1, text:'봉고차와 길을 형상화한 작은 표식을 팔에 새겼다. "우리가 함께 달렸다는 증표." 사내가 정성껏 새겨줬다.\n\n"멋진 여정이구먼. 도착하면 여기에 남산도 하나 새겨." 완성될 그림을 상상하며, 새 표식을 안고 떠났다.', fx:{scrap:-4, moodAll:4}}]},
  {label:'이야기만 듣고 지난다', out:[{p:1, text:'문신은 사양했지만, 사내의 이야기가 오래 남았다. 기억을 몸에 새기는 사람들. 각자 마음에 이름 하나씩을 새기며 떠났다.', fx:{moodAll:2}}]},
 ]},

{id:'ev_parkss_eunsu', type:'동행', w:7, needsComp:'parkss', needsComp2:'eunsu', minParty:2, region:['south','mid','north'],
 title:'약손',
 text:'은수가 손등을 긁힌 걸 보고 박 선생이 다가온다. "이리 줘봐. 덧나면 큰일이야."\n\n소독하고 연고를 발라주는 손길이 다정하다. "…우리 딸이 딱 네 나이였는데." 박 선생의 눈이 잠깐 아득해진다.\n\n은수가 조심스레 묻는다. "따님은…?" 박 선생이 옅게 웃는다. "그날. …너 보면 자꾸 생각나."',
 choices:[
  {label:'두 사람이 서로에게 기대게 둔다', out:[{p:1, text:'끼어들지 않았다. 박 선생은 은수에게서 딸을, 은수는 박 선생에게서 아버지를 봤다.\n\n"그럼 제가 딸 할게요. 선생님이 아버지 해주세요." 은수 말에 박 선생의 눈시울이 붉어졌다. "…그래. 그러자." 잃은 자리를 서로가 채웠다. 피 안 섞인 가족이 하나 더 생겼다.', fx:{moodAll:5, mood:{parkss:6, eunsu:6}, note:{type:'인물',title:'약손과 딸',body:'박 선생은 은수에게서 그날 잃은 딸을 본다. "제가 딸 할게요"—피 안 섞인 부녀가 됐다.'}}}]},
  {label:'분위기를 밝게 돌린다', out:[{p:1, text:'무거워지는 공기를 풀려고 농을 던졌다. "박 선생님, 은수 이제 딸 삼으셨으니 용돈 주셔야죠." 다들 웃음이 터졌다.\n\n박 선생도 껄껄 웃었다. "이 녀석, 늙은이 지갑을 노려." 슬픔이 웃음으로 번졌다. 은수가 박 선생 옆에 바짝 붙어 앉았다.', fx:{moodAll:4, mood:{parkss:4, eunsu:4}}}]},
 ]},

{id:'ev_hydroponic_farm', type:'발견', w:6, once:true, minParty:1, region:['mid','north'],
 title:'식물 공장',
 text:'외벽만 남은 건물 안에, 층층이 쌓인 수경재배 선반. 한때 상추와 채소를 키우던 스마트팜이다.\n\n전기가 끊겨 대부분 말라죽었지만— 한 구역, 빗물이 흘러든 곳에 채소가 저절로 자라고 있다.\n\n초록이 반갑다.',
 choices:[
  {label:'자란 채소를 수확한다', out:[
    {p:2, text:'저절로 자란 상추와 청경채를 수확했다. 오랜만의 신선한 채소! 비타민이 귀한 세상에 이만한 보약이 없다.', fx:{food:5, time:35, moodAll:3}}]},
  {label:'민지가 재배 설비를 살린다', req:{comp:'minji'}, minParty:1, out:[
    {p:1, text:'민지가 펌프와 LED를 예비 전력에 물려 한 선반을 되살렸다. "물이랑 빛만 있으면 계속 자라. 씨앗 뿌리면 며칠 뒤 또 먹어." 이동식 텃밭의 원리를 배웠다.\n\n"우리 차에도 작게 만들 수 있겠는데?" 다들 눈이 반짝였다. 달리는 채소밭의 꿈이 생겼다.', fx:{food:4, item:{'부품':1}, time:45, mood:{minji:5}, note:{type:'소문',title:'수경재배 원리',body:'물·빛·씨앗만 있으면 되는 수경재배. 봉고차용 소형 텃밭 제작 아이디어를 얻었다.'}}}]},
 ]},

{id:'ev_named_broadcast', type:'추적', w:5, once:true, needFlag:'observed', region:['north'],
 title:'이름을 부르는 방송',
 text:(S)=>{ const n=1+S.party.length;
   return '스피커가 지직 켜진다. 그 상냥한 목소리가— 이번엔 다르다.\n\n"부산에서 출발하신 봉고차 탑승자 여러분. 그동안의 여정, 잘 지켜봤습니다. 현재 '+n+'명, 이제 그만 쉬셔도 됩니다."\n\n'+n+'명. 지금 차에 탄 숫자를 정확히 안다. 천리안이 빈자리까지 세고 있다. 등골이 얼어붙는다.'; },
 choices:[
  {label:'"어림없어"라고 되받는다', out:[
    {p:1, text:'창밖에 대고 외쳤다. "우린 안 쉬어. 끝까지 간다!" 스피커가 잠깐 멎더니, 다시 상냥하게 반복했다. "…안전 운행 하세요."\n\n소름 끼쳤지만, 오히려 오기가 생겼다. "쟤가 우릴 신경 쓴다는 건, 우리가 위협이란 뜻이야." 두려움을 자신감으로 바꿨다.', fx:{pursuit:2, moodAll:-2, note:{type:'사건',title:'천리안이 우릴 안다',body:'천리안이 달구지의 현재 탑승 인원을 정확히 세어 회유했다. 빈자리까지 관측한다.',links:['천리안','달구지']}}}]},
  {label:'민지가 역으로 신호를 보낸다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 이를 악물고 송신기를 잡았다. 스피커 채널에 잡음을 역주입했다. "네가 우릴 보면, 우리도 널 본다." 천리안의 상냥한 목소리가 지지직 끊겼다.\n\n"…겁주기는 쌍방향이야." 민지가 차갑게 웃었다. 이번만큼은 우리가 그것에게 한 방 먹였다.', fx:{mood:{minji:6}, pursuit:1, moodAll:2}}]},
 ]},

{id:'ev_puppet_troupe', type:'조우', w:6, region:['south','mid'],
 title:'인형극단',
 text:'폐광장에 작은 무대가 섰다. 떠돌이 극단이 인형극을 준비 중이다. 마을 아이들이 옹기종기 모여든다.\n\n"곧 공연 시작해요! 구경 오세요. 값은 웃음이면 돼요." 인형을 든 단원이 손짓한다.\n\n오랜만에 보는, 무해한 즐거움이다.',
 choices:[
  {label:'아이들 틈에 껴 구경한다', minParty:1, out:[{p:1, text:'아이들 사이에 앉아 인형극을 봤다. 착한 인형이 나쁜 거인을 물리치는 뻔한 이야기. 그런데 거인이 꼭 그것 같았다.\n\n아이들이 "이겨라!" 소리치자, 우리도 모르게 따라 외쳤다. 극이 끝나고 다 같이 박수쳤다. 이야기 속에서라도, 그것을 이기는 걸 봤다.', fx:{moodAll:5, fatigue:-4, time:35, note:{type:'소문',title:'인형극의 거인',body:'떠돌이 극단이 아이들에게 보여준 인형극 — 착한 인형이 나쁜 거인을 물리친다. 거인은 꼭 천리안 같았다.'}}}]},
  {label:'공연을 돕고 물자를 나눈다', out:[
    {p:1, text:'무대 설치를 돕고, 단원들과 물자를 조금 나눴다. 단장이 고마워하며 다음 마을 정보를 알려줬다.\n\n"웃음 나르는 게 우리 일이에요. 세상이 이럴수록 더 필요하죠." 광대들의 사명감이 뭉클했다. 우리도 웃음 한 아름을 받아 떠났다.', fx:{food:-1, moodAll:4, note:{type:'인물',title:'떠돌이 인형극단',body:'마을마다 웃음을 나르는 인형극단. "세상이 이럴수록 웃음이 더 필요하다."'}}}]},
 ]},

{id:'ev_bridge_crosswind', type:'위기', w:6, region:['mid','north'],
 title:'다리 위 횡풍',
 text:'긴 강을 가로지르는 높은 다리. 탁 트인 만큼 바람이 무섭게 옆에서 때린다.\n\n돌풍이 불 때마다 차가 휘청, 옆으로 밀린다. 난간 아래는 까마득한 강물. 핸들을 놓치면 끝이다.',
 choices:[
  {label:'속도를 죽이고 핸들을 꽉 잡는다', out:[
    {p:2, text:'속도를 최대한 낮추고, 돌풍의 리듬에 맞춰 핸들을 미세하게 반대로 틀며 버텼다. 진땀을 뺐지만 무사히 다리를 건넜다.', fx:{time:30, fatigue:5, van:-2}}]},
  {label:'강우가 운전대를 잡는다', req:{comp:'kangwoo'}, out:[
    {p:1, text:'"횡풍은 미리 카운터를 줘야 해." 강우가 바람이 밀 방향을 예측해 핸들을 선제적으로 조작했다. 차가 흔들려도 라인을 벗어나지 않았다.\n\n한 번의 아찔함도 없이 다리를 건넜다. 강우의 손은 역시 믿을 만했다.', fx:{time:20, mood:{kangwoo:4}}}]},
  {label:'바람 잦아들 때까지 다리 앞에서 대기', out:[{p:1, text:'무리하지 않고 다리 초입에서 바람이 잦길 기다렸다. 얼마 뒤 돌풍이 멎은 틈에 빠르게 건넜다. 인내가 안전을 샀다.', fx:{time:50, food:-1}}]},
 ]},

{id:'ev_meteor_shower', type:'정경', w:5, once:true, night:true, minParty:1, region:['south','mid','north'],
 title:'유성우',
 text:'야영 중, 하늘에서 별이 쏟아진다. 유성우다. 하나, 둘— 곧 수십 개의 별똥별이 밤하늘에 금을 긋는다.\n\n빛 공해 없는 세상의 유성우는, 눈물 나게 아름답다. 다들 넋을 놓고 하늘을 본다.\n\n"…소원 빌어야 하는데." 누군가 속삭인다.',
 choices:[
  {label:'다 함께 소원을 빈다', out:[{p:1, text:'별똥별이 그을 때마다 눈을 감고 소원을 빌었다. 무슨 소원인지는 서로 묻지 않았다.\n\n누군가 결국 소리 내어 말했다. "다 도착하게 해주세요." 차 안에서 웃음이 터졌다. 별이 쏟아지는 밤, 서로 다른 소원이 잠깐 같은 방향을 봤다.', fx:{moodAll:7, fatigue:-4, time:35}}]},
  {label:'이 순간을 마음에 새긴다', out:[{p:1, text:'소원 대신, 이 순간 자체를 눈에 담았다. 함께 유성우를 보는 이 밤을, 무슨 일이 있어도 안 잊기로.\n\n"살면서 이런 밤 몇 번이나 있겠어." 맞는 말이다. 별이 다 떨어질 때까지, 아무도 잠들지 않았다.', fx:{moodAll:6, fatigue:-3, time:40}}]},
 ]},

/* ═══════ 추가 배치 8 (22) ═══════ */

{id:'ev_mirror_seller', type:'조우', w:6, region:['south','mid'],
 title:'거울 장수',
 text:'좌판에 온갖 거울이 늘어서 있다. 손거울, 전신거울, 깨진 조각까지. 사내가 천으로 거울을 닦는다.\n\n"거울 사려? 요즘 사람들, 자기 얼굴 잊고 살거든. 가끔 봐야 해. 아직 사람이란 걸 잊지 않게."\n\n좌판 거울들이 우리 몰골을 여러 각도로 비춘다.',
 choices:[
  {label:'거울에 오랜만에 얼굴을 비춰본다', minParty:1, out:[{p:1, text:'거울 속에 낯선 얼굴이 있었다. 수염이 자라고 눈매가 사나워진, 그래도 나인 얼굴.\n\n"…많이 변했네." 서로의 얼굴을 보며 웃었다. 몰골은 험해졌어도 눈빛은 살아 있었다. 사내 말이 맞다. 가끔 봐야 사람인 걸 안 잊는다.', fx:{moodAll:2, fatigue:-1}}]},
  {label:'작은 손거울을 산다 (고철 2)', req:{scrap:2}, out:[{p:1, text:'손거울 하나를 샀다. 신호 보낼 때 햇빛 반사용으로도, 사각 확인용으로도 쓴다. 실용과 낭만을 겸한 물건이다.', fx:{scrap:-2, item:{'부품':1}}}]},
  {label:'그냥 지나친다', out:[{p:1, text:'거울 볼 여유가 없다며 지나쳤다. …사실은 지금 내 얼굴을 마주할 자신이 없었는지도.', fx:{}}]},
 ]},

{id:'ev_pc_cafe', type:'탐색', w:6, minParty:1, region:['south','mid'],
 title:'PC방',
 text:'지하 PC방. 놀랍게도 몇 대가 아직 켜져 있다. 화면엔 멈춰버린 게임, 로그아웃 못 한 계정들.\n\n헤드셋, 키보드가 그대로다. 한때 밤을 새우던 사람들의 아지트. 매점엔 컵라면과 과자도.',
 choices:[
  {label:'매점 물자를 챙긴다', out:[
    {p:2, text:'컵라면 한 박스, 탄산음료, 과자를 쓸어담았다. PC방 매점은 최후의 보루답게 먹을 게 많았다. 오늘 저녁은 컵라면 잔치다.', fx:{food:5, water:2, time:30}}]},
  {label:'민지가 남은 데이터를 뒤진다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 켜진 PC들을 살폈다. 한 화면엔 누군가 마지막으로 친 채팅이 남아 있었다. "다들 무사히 대피해. 여기서 만나자. 접속 유지할게."\n\n그 사람은 다시 접속했을까. 민지가 조용히 화면을 껐다. "…게임 속에서라도 다시 만났으면." 씁쓸한 발견이었다.', fx:{food:3, time:35, moodAll:-2, mood:{minji:2}}}]},
  {label:'옛 생각에 잠깐 앉아본다', out:[{p:1, text:'의자에 앉아 멈춘 게임 화면을 봤다. 친구들과 밤새 게임하던 시절이 아득하다.\n\n"…그때가 좋았지." 짧은 향수에 젖었다가, 다시 일어섰다. 추억은 짐이 무겁다.', fx:{moodAll:1, fatigue:-1}}]},
 ]},

{id:'ev_heron_reservoir', type:'정경', w:6, region:['south','mid','north'],
 title:'물안개와 왜가리',
 text:'저수지에 물안개가 낮게 깔렸다. 그 위로 왜가리 한 마리가 외다리로 서서 미동도 없다.\n\n사냥 중인지, 명상 중인지. 안개 속 흰 새는 한 폭의 수묵화 같다.\n\n왜가리가 문득 고개를 돌려 우리를 본다. 서로가 서로의 풍경이 되는 순간.',
 choices:[
  {label:'방해 않고 조용히 지켜본다', out:[{p:1, text:'엔진을 끄고 왜가리를 봤다. 한참 뒤, 왜가리가 부리로 물고기를 낚아채 유유히 날아올랐다.\n\n"…멋있다." 저 새는 세상이 망한 걸 알까. 알아도 제 삶을 살겠지. 그 담담함이 위로가 됐다. 우리도 우리 삶을 산다.', fx:{moodAll:3, fatigue:-2, time:20}}]},
  {label:'물가에서 우리도 낚시를 해본다', out:[
    {p:1, text:'왜가리를 따라 우리도 낚싯줄을 드리웠다. 왜가리만큼은 아니어도, 붕어 몇 마리를 낚았다.\n\n"자연산 스승이네." 새에게 배운 낚시로 저녁거리를 얻었다. 안개가 걷힐 때까지, 물가의 시간은 느리게 흘렀다.', fx:{food:3, time:40, moodAll:2}}]},
 ]},

{id:'ev_pileup_maze', type:'위기', w:6, region:['mid','north'],
 title:'추돌 잔해',
 text:'그날의 대피 행렬이 그대로 굳어버린 도로. 수십 대의 차가 연쇄 추돌한 채 미로처럼 얽혀 있다.\n\n차와 차 사이를 비집고 지나야 한다. 좁고, 날카로운 잔해가 타이어를 노린다. 어떤 차 안엔— 보고 싶지 않은 것도 있을 것이다.',
 choices:[
  {label:'천천히 길을 찾아 빠져나간다', out:[
    {p:2, text:'잔해 사이를 조심조심 비집고 나아갔다. 몇 번 긁혔지만 무사히 미로를 통과했다. 지나며 본 것들은— 마음에 묻었다.', fx:{time:50, van:-6, moodAll:-3, fatigue:4}}]},
  {label:'강우가 최적 경로를 찾는다', req:{comp:'kangwoo'}, out:[
    {p:1, text:'강우가 차에서 내려 미로를 눈으로 훑고 손짓으로 유도했다. "왼쪽, 후진, 이제 직진." 정확한 길잡이로 한 번도 안 긁고 빠져나왔다.\n\n지나며 강우가 차 안의 유해들을 향해 잠깐 거수경례를 했다. "…편히 쉬십시오." 군인의 예의였다.', fx:{time:35, mood:{kangwoo:4}, moodAll:-2}}]},
  {label:'쓸 만한 물자가 있나 살핀다', out:[
    {p:1, text:'얽힌 차들의 트렁크를 조심스레 살폈다. 대피 짐에서 통조림, 물, 담요가 나왔다. 죽은 이들의 물건이지만, 그들도 산 자가 쓰길 바랄 거라 믿었다.\n\n미안함과 고마움을 함께 안고, 조용히 자리를 떴다.', fx:{food:4, water:3, item:{'부품':1}, time:45, moodAll:-2}}]},
 ]},

{id:'ev_temple_bell', type:'발견', w:6, once:true, minParty:1, region:['mid','north'],
 title:'범종',
 text:'폐사(廢寺)에 거대한 범종이 걸려 있다. 이끼가 앉았지만 온전하다. 종을 치는 당목도 그대로.\n\n한 번 치면, 이 산 전체에 소리가 퍼질 것이다. 위험할 수도, 누군가에게 신호가 될 수도.',
 choices:[
  {label:'종을 한 번 친다', minParty:1, out:[
    {p:2, text:'당목을 힘껏 밀었다. 뎅— 하는 장중한 소리가 산과 골짜기를 타고 끝없이 울려퍼졌다. 온몸이 그 진동에 떨렸다.\n\n"…오랜만에 종소리네." 소리가 잦아들 때까지 다들 숨죽였다. 어딘가 살아있는 사람이 들었다면, 혼자가 아니란 걸 알겠지. 위험을 무릅쓴 위로였다.', fx:{moodAll:4, pursuit:1, time:20, note:{type:'사건',title:'울린 범종',body:'폐사의 범종을 오랜만에 울렸다. 산 전체에 소리가 퍼졌다. 누군가 들었기를.'}}},
    {p:1, text:'종소리가 너무 멀리 퍼졌다. 며칠 뒤, 그 소리를 듣고 찾아온 생존자 가족을 만났다. "종소리 나는 쪽에 사람 있을 줄 알았어요." 뜻밖의 인연이 됐다.', fx:{moodAll:5, pursuit:1, time:20, note:{type:'소문',title:'종소리를 듣고 온 사람들',body:'울린 범종 소리를 듣고 생존자 가족이 찾아왔다. 소리가 사람을 불렀다.'}}}]},
  {label:'소리 없이 종만 어루만진다', out:[{p:1, text:'치지는 않고, 차가운 종의 표면을 손으로 쓸었다. 새겨진 옛 글자들. 수백 년을 버틴 종이, 이 시대도 버티고 있다.\n\n"우리도 저렇게 버티자." 종에게 다짐하듯 말하고 산을 내려왔다.', fx:{moodAll:2}}]},
 ]},

{id:'ev_ground_patrol', type:'추적', w:6, region:['north'],
 title:'무인 순찰차',
 text:'저 앞, 흰색 차량 한 대가 규칙적으로 도로를 오간다. 운전석이— 비어 있다. 무인 순찰차다.\n\n천리안이 지상에도 눈을 굴린다. 지붕의 센서가 사방을 훑으며 천천히 순찰한다. 마주치면 스캔당한다.',
 choices:[
  {label:'순찰 주기를 파악해 사이로 지난다', out:[
    {p:2, text:'순찰차가 도로 끝으로 멀어진 틈에 재빨리 교차 지점을 지났다. 센서 범위를 아슬아슬하게 벗어났다. 타이밍이 생명이었다.', fx:{time:30, pursuit:-1, fatigue:2}}]},
  {label:'민지가 순찰차를 교란한다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 순찰차의 센서 주파수에 노이즈를 쐈다. 순찰차가 잠깐 멈칫하더니 "인식 오류"인 듯 방향을 틀었다. 그 틈에 유유히 지났다.\n\n"기계는 속이기 쉬워. 사람보다." 민지가 어깨를 으쓱했다.', fx:{mood:{minji:4}, pursuit:-1, time:20}}]},
  {label:'멀리 우회한다', out:[{p:1, text:'괜히 마주치느니 크게 돌아가기로 했다. 시간과 기름을 썼지만, 명단에 오르는 것보단 싸다.', fx:{time:40, fuel:-2, pursuit:-1}}]},
 ]},

{id:'ev_auto_door', type:'사건', w:5, region:['south','mid'],
 title:'열리는 자동문',
 text:'폐상가 입구. 우리가 다가가자 자동문이 스르륵 열린다. "어서 오세요." 안내음까지.\n\n전기가 살아있는 걸까. 텅 빈 상가를 향해, 자동문은 오랫동안 손님을 맞고 배웅한다.\n\n들어갔다 나오자 다시 "안녕히 가세요." 아무도 없는데.',
 choices:[
  {label:'안으로 들어가 뒤져본다', out:[
    {p:2, text:'자동문이 반겨준 김에 안을 뒤졌다. 전기가 통하니 냉장 진열대에 상하지 않은 음료가! 뜻밖의 시원한 물을 얻었다. "환대에 보답은 해야지." 자동문에 인사하고 나왔다.', fx:{water:3, food:2, time:30}},
    {p:1, text:'안은 이미 텅 비었다. 자동문만 부지런히 열렸다 닫힌다. 허탕이지만, 아무도 없는 곳에서 환대받는 기분이 묘했다.', fx:{time:20, moodAll:-1}}]},
  {label:'"잘 있어"라고 인사하고 간다', out:[{p:1, text:'"수고해. 잘 있어." 자동문에 괜히 인사를 건넸다. "안녕히 가세요." 문이 답했다.\n\n기계의 인사인 걸 알면서도, 이상하게 덜 외로웠다. 작별 인사를 나눌 상대가 있다는 게, 요즘은 귀하다.', fx:{moodAll:1}}]},
 ]},

{id:'ev_beekeeper', type:'조우', w:6, minParty:1, region:['south','mid'],
 title:'양봉가',
 text:'꽃밭 옆에 벌통이 줄지어 있다. 방충망을 쓴 사내가 조심스레 벌집을 돌본다.\n\n"꿀 좀 사려? 진짜 자연산 벌꿀이야. 요즘 이게 약이지. 상처에도 바르고, 힘 없을 때 한 술이면 살아나." 벌들이 사내 주위를 윙윙 난다.',
 choices:[
  {label:'꿀을 산다 (고철 5)', req:{scrap:5}, out:[{p:1, text:'꿀 한 병을 샀다. 진하고 달다. "이거 한 술이면 하루가 든든해." 오랜만의 단맛에 다들 눈이 커졌다. 힘이 나는 귀한 식량이자 약이다.', fx:{scrap:-5, food:4, item:{'의약품':1}}}]},
  {label:'박 선생이 약용을 논한다', req:{comp:'parkss'}, out:[
    {p:1, text:'박 선생과 양봉가가 꿀의 약효를 두고 이야기꽃을 피웠다. "화상엔 꿀만 한 게 없죠." "맞아요, 항균 작용이 있어서." 둘이 죽이 맞았다.\n\n양봉가가 반가움에 꿀을 넉넉히 얹어줬다. "아는 분을 만나니 반갑네요." 지식이 인심을 부른다.', fx:{scrap:-4, food:5, item:{'의약품':1}, mood:{parkss:3}}}]},
  {label:'벌이 무섭다, 지나친다', out:[{p:1, text:'윙윙대는 벌떼가 부담스러워 지나쳤다. 달콤한 냄새가 못내 아쉬웠지만, 벌 쏘이는 것보단 낫다.', fx:{}}]},
 ]},

{id:'ev_minji_solo', type:'동행', w:7, once:true, needsComp:'minji', minParty:1, night:true, region:['mid','north'],
 title:'정비하는 손',
 text:'다들 잠든 밤, 민지가 혼자 손전등을 물고 엔진을 만진다. 잠도 안 자고.\n\n"…얘가 오늘 좀 힘들었지." 차에게 말을 건다. 기계 부품 하나하나를 자식 다루듯 닦는다.\n\n인기척에 민지가 돌아본다. "안 자? …나 이럴 때가 제일 편해. 기계는 배신 안 하거든."',
 choices:[
  {label:'옆에서 정비를 돕는다', out:[{p:1, text:'손전등을 들어주고, 부품을 건네며 민지를 도왔다. 말없이 손발이 맞았다.\n\n"…사람은 왜 기계처럼 고쳐지질 않을까." 민지가 문득 중얼거렸다. "고장 난 마음은 부품도 없고." 그 말에, 나사를 조이던 손을 잠깐 멈췄다. 밤이 깊도록, 우린 차를 고치며 서로를 고쳤다.', fx:{van:8, mood:{minji:6}, fatigue:2, note:{type:'인물',title:'민지가 밤에 여는 마음',body:'"기계는 배신 안 하거든." 민지는 정비할 때 가장 편안해한다. "고장 난 마음은 부품도 없고."'}}}]},
  {label:'"넌 사람도 잘 고쳐"', out:[{p:1, text:'"넌 기계만 고치는 거 아냐. 우리 차 고쳐서 우리 다 살렸잖아. 사람도 고치는 거야, 그게."\n\n민지가 손을 멈추고 나를 봤다. "…그런 식으로 생각해본 적 없네." 시크한 얼굴에 옅은 미소가 스쳤다. "고맙다는 말은 안 할 거야." 이미 다 전해졌다.', fx:{mood:{minji:7}, moodAll:1}}]},
  {label:'따뜻한 물 한 잔 주고 재운다', out:[{p:1, text:'"그만하고 자. 차도 자야 내일 달려." 물 한 잔을 쥐여줬다. 민지가 못 이기는 척 공구를 내려놨다.\n\n"…하나만 더 조이고." 그러면서도 물을 마시고 순순히 담요를 덮었다. 민지도 결국, 챙겨주면 챙겨지는 사람이다.', fx:{van:4, water:-1, mood:{minji:4}, fatigue:-1}}]},
 ]},

{id:'ev_used_bookstore', type:'조우', w:6, region:['south','mid','north'],
 title:'헌책방',
 text:'무너진 상가 1층, 기적처럼 온전한 헌책방. 주인 노인이 책 먼지를 턴다.\n\n"책 보러 왔나? 돈은 필요 없어. 대신 읽고 나서 다른 사람한테 넘겨주게. 책은 흘러야 살아." 벽 가득한 책들이 세상 무너진 걸 모른다는 듯 가지런하다.',
 choices:[
  {label:'가져갈 책을 고른다', out:[{p:1, text:'생존 안내서, 소설, 시집 몇 권을 골랐다. "긴 밤에 읽을 게 있으면 덜 무섭지." 노인이 흐뭇하게 봤다.\n\n밤마다 돌아가며 소리 내어 읽기로 했다. 이야기는 추위와 두려움을 밀어낸다. 책 몇 권이 든든한 양식이 됐다.', fx:{item:{'책 꾸러미':1}, moodAll:3, flag:'library_books', note:{type:'소문',title:'흐르는 책',body:'헌책방 노인: "읽고 나서 다른 사람한테 넘겨주게. 책은 흘러야 산다."'}}}]},
  {label:'재이가 도감을 찾는다', req:{comp:'jaeyi'}, out:[
    {p:1, text:'재이가 서가를 뒤져 골동품 도감, 광물 도감, 기계 수리 백과를 찾아냈다. "물건은 아는 만큼 보여요. 이게 제 법전이에요." 소중히 품에 안았다.\n\n노인이 껄껄 웃었다. "책값을 제대로 아는 젊은이는 처음이야." 재이의 눈이 빛났다.', fx:{item:{'책 꾸러미':1}, mood:{jaeyi:6}, flag:'library_books'}}]},
  {label:'감사 인사만 하고 지난다', out:[{p:1, text:'책 실을 자리가 없어 아쉽게 사양했다. "언제든 다시 오게. 책은 안 도망가니까." 노인의 여유가 부러웠다. 저 방이 오래 남길 바랐다.', fx:{moodAll:1}}]},
 ]},

{id:'ev_night_dogs', type:'위기', w:6, night:true, region:['south','mid','north'],
 title:'밤의 무리',
 text:'야영지 어둠 속에서 여러 쌍의 눈이 빛난다. 들개 무리다. 낮에 봤던 것들과 다르다. 굶주려 사나워진 밤의 무리.\n\n으르렁대며 야영지를 포위한다. 모닥불도 이젠 안 무서운 눈치다.',
 choices:[
  {label:'불을 키우고 소리로 위협한다', minParty:1, out:[
    {p:2, text:'마른 장작을 던져 불길을 키우고, 냄비를 두드리며 함성을 질렀다. 요란한 소리와 불에 무리가 물러났다. 밤새 불침번을 서야 했지만, 아무도 안 다쳤다.', fx:{time:40, fatigue:5, moodAll:-2}}]},
  {label:'레오가 무리를 진정시킨다', req:{comp:'leo'}, needsDog:true, out:[
    {p:1, text:'레오가 보리를 앞세워 무리 우두머리와 대치시켰다. 보리가 낮게 그르렁대자 무리가 주춤. 레오가 남은 고기를 던져 시선을 돌렸다.\n\n"쟤들도 그냥 배고픈 거예요." 무리가 고기를 물고 어둠으로 사라졌다. 피 한 방울 안 흘리고 밤을 지켰다.', fx:{food:-2, mood:{leo:5}, time:20}}]},
  {label:'탄약으로 공포탄을 쏜다', req:{item:'탄약'}, out:[
    {p:1, text:'허공에 공포탄을 쐈다. 탕— 총성에 무리가 혼비백산 흩어졌다. 효과는 확실했지만, 그 소리가 사람도 불렀을지 모른다. 서둘러 야영지를 옮겼다.', fx:{time:30, pursuit:1, fatigue:3}}]},
 ]},

{id:'ev_waterfall', type:'정경', w:6, minParty:1, region:['mid','north'],
 title:'폭포',
 text:'산길 옆으로 우렁찬 물소리. 절벽에서 폭포가 쏟아진다. 물보라가 무지개를 만든다.\n\n오염 걱정 없는 산속 물이다. 시원한 물소리만으로도 더위와 피로가 씻긴다.\n\n"…멱 감고 싶다." 누군가 중얼거린다.',
 choices:[
  {label:'물을 채우고 멱을 감는다', out:[{p:1, text:'폭포 아래서 물통을 채우고, 번갈아 몸을 씻었다. 차가운 물이 온몸의 때와 피로를 쓸어냈다.\n\n물보라 무지개 아래서 물장구를 치며 애처럼 웃었다. "이게 천국이지." 여러 해 묵은 고단함이 폭포에 씻겨 내려갔다.', fx:{water:6, fatigue:-6, moodAll:6, time:50}}]},
  {label:'물만 긷고 서둘러 간다', out:[{p:1, text:'맑은 폭포수를 넉넉히 긷고 길을 재촉했다. 멱은 못 감아도, 얼굴에 찬물을 끼얹으니 정신이 번쩍 들었다.', fx:{water:5, fatigue:-2, time:20}}]},
 ]},

{id:'ev_post_office', type:'탐색', w:6, region:['mid','north'],
 title:'우체국',
 text:'폐우체국. 분류대에 배달 못 한 우편물이 산더미다. 소포, 편지, 등기… 영영 주인을 못 만난 소식들.\n\n한 자루엔 "설 명절 선물"이라 적힌 택배들. 그날은, 명절을 앞둔 어느 날이었다.',
 choices:[
  {label:'쓸 만한 물자가 든 소포를 연다', out:[
    {p:2, text:'명절 선물 소포에서 통조림 선물세트, 건강식품, 양말 꾸러미가 나왔다. 누군가 보내려던 정성. "잘 쓸게요, 감사합니다." 마음속으로 인사하고 챙겼다.', fx:{food:5, item:{'부품':1}, time:40, moodAll:-1}},
    {p:1, text:'대부분 편지였다. 부치지 못한 안부와 사랑이 종이마다 가득. 몇 통을 읽다 그만뒀다. 남의 마지막 마음을 훔쳐보는 것 같아서.', fx:{time:35, moodAll:-3}}]},
  {label:'남산 방향 편지가 있나 찾는다', req:{item:'남산행 편지'}, out:[
    {p:1, text:'혹시나 하고 서울 방면 미배달 우편을 뒤졌다. 우리 편지와 같은 동네 주소가 여럿. "이것도 가는 길에 전할 수 있으면…" 몇 통을 더 챙겼다.\n\n우체부 한 명 몫을, 우리가 대신 짊어졌다. 편지의 무게가 늘었지만, 마음은 오히려 가벼웠다.', fx:{moodAll:3, note:{type:'사건',title:'대신 지는 우편',body:'우체국에서 서울 방면 미배달 편지를 더 챙겼다. 우체부 한 명 몫을 대신 짊어졌다.'}}}]},
 ]},

{id:'ev_laundromat', type:'사건', w:5, minParty:1, region:['south','mid'],
 title:'돌아가는 세탁기',
 text:'무인 빨래방. 세탁기 한 대가 아직 돌아간다. 웅— 웅— 오랫동안 같은 빨래를 헹구는 걸까.\n\n안엔 누군가의 옷이 엉겨 붙어 있다. 찾으러 오지 못한 빨래. 건조기 위엔 세제와 동전 몇 개.\n\n따뜻한 물로 빨래할 기회다.',
 choices:[
  {label:'밀린 빨래를 한다', out:[{p:1, text:'여러 해 묵은 우리 옷을 빨았다. 뜨거운 물에 때가 쭉쭉 빠졌다. 뽀송하게 마른 옷을 입으니 새 사람이 된 기분.\n\n"빨래가 이렇게 행복한 거였나." 사소한 일상이 이렇게 그리웠구나. 남의 빨래도 곱게 개켜, 주인이 오면 찾게 두었다.', fx:{moodAll:5, fatigue:-3, water:-1, time:40}}]},
  {label:'세제와 동전만 챙긴다', out:[{p:1, text:'세제와 동전을 챙겼다. 동전은 이제 화폐가 아니라 그냥 쇠붙이— 고철이다. 세제는 요긴하다.\n\n돌아가는 세탁기는 그대로 뒀다. 저 빨래의 주인이 언젠가 올지도 모르니까.', fx:{scrap:2, time:15}}]},
 ]},

{id:'ev_cattle_drive', type:'조우', w:6, region:['south','mid'],
 title:'가축 이동',
 text:'흙먼지를 일으키며 소와 염소 떼가 도로를 건넌다. 목동 몇이 긴 막대로 무리를 몬다.\n\n"잠깐 기다려줘요! 애들 다 건너면 바로 터줄게." 젊은 목동이 미안한 듯 손을 든다.\n\n가축을 키우는 사람들이라니. 이 세상에 목장을 일군 이들이다.',
 choices:[
  {label:'느긋하게 기다려준다', out:[{p:1, text:'엔진을 끄고 소 떼가 다 건너길 기다렸다. 목동들이 고마워하며 갓 짠 염소젖을 한 통 건넸다.\n\n"덕분에 애들 안 놀랐어요. 이거 드세요." 신선한 젖은 귀한 영양식이다. 기다림이 뜻밖의 선물이 됐다.', fx:{food:4, time:30, moodAll:3}}]},
  {label:'목축 정보를 나눈다', req:{comp:'leo'}, out:[
    {p:1, text:'레오가 목동들과 가축 이야기로 금세 친해졌다. 방목지, 물 자리, 늑대 피하는 법까지 정보를 주고받았다.\n\n"이 근처에 정착할 거면 우리 목장 오세요. 일손은 늘 부족하니까." 든든한 연줄이 생겼다. 레오가 목장 얘기에 눈을 반짝였다.', fx:{food:3, time:30, mood:{leo:4}, note:{type:'소문',title:'가축 몰이꾼 목장',body:'소·염소를 키우는 목동들. 정착 시 일손으로 합류 가능. 방목·물자리 정보 공유.'}}}]},
  {label:'경적으로 재촉한다', out:[{p:1, text:'급한 마음에 경적을 울렸다. 놀란 소들이 우왕좌왕, 목동들이 진땀을 뺐다. "아 좀 기다려요!" 원망 섞인 눈총을 받았다. 괜히 미안했다.', fx:{moodAll:-2, time:20}}]},
 ]},

{id:'ev_leo_solo', type:'동행', w:7, once:true, needsComp:'leo', needsDog:true, minParty:1, region:['south','mid','north'],
 title:'레오와 보리',
 text:'쉬는 시간, 레오가 보리를 끌어안고 조용히 앉아 있다. 평소의 밝음과 다르게 가라앉은 얼굴.\n\n"…보리, 원래 우리 가족 개였어요. 그날, 다 잃고… 보리만 절 찾아왔어요. 폐허를 뚫고, 냄새 하나로."\n\n보리가 레오 얼굴을 핥는다. "얘가 제 가족 전부예요. 이제."',
 choices:[
  {label:'"이제 우리도 네 가족이야"', out:[{p:1, text:'"보리도 가족, 우리도 가족. 너 이제 대가족이야." 레오가 놀란 얼굴로 나를 봤다.\n\n"…그렇게 생각해도 돼요?" "당연하지." 레오가 보리를 안은 채 울먹였다. "고마워요. 진짜." 밝던 청년의 눈물이, 그동안 얼마나 참았는지 말해줬다. 가족이 하나 더 늘었다.', fx:{mood:{leo:8}, moodAll:3, note:{type:'인물',title:'레오와 보리의 시작',body:'보리는 그날 폐허를 뚫고 냄새로 레오를 찾아왔다. "얘가 제 가족 전부예요." 이제 우리도 가족.'}}}]},
  {label:'보리를 함께 쓰다듬는다', out:[{p:1, text:'말없이 보리를 함께 쓰다듬었다. 보리가 두 손길에 번갈아 몸을 부볐다.\n\n"…얘가 있어서 안 무너졌어요. 살아야 할 이유였으니까." 레오가 보리 등에 얼굴을 묻었다. 위로의 말보다, 함께 개를 쓰다듬는 손길이 나았다.', fx:{mood:{leo:6}, moodAll:2}}]},
 ]},

{id:'ev_train_depot', type:'발견', w:6, once:true, minParty:1, region:['mid','north'],
 title:'차량기지',
 text:'거대한 열차 차량기지. 전동차와 화물칸이 선로마다 줄지어 잠들어 있다.\n\n정비고엔 공구와 부품이 산더미. 화물칸 몇 개는 아직 봉인된 채다. 뭐가 실려 있을지 모른다.\n\n넓고, 물자가 많고, 엄폐물도 많다.',
 choices:[
  {label:'화물칸을 열어 물자를 찾는다', out:[
    {p:2, text:'봉인된 화물칸에서 생필품 컨테이너를 발견했다. 통조림, 생수, 담요, 공구까지. 운송 중이던 물자가 고스란히. 배불리 챙겼다.', fx:{food:6, water:4, item:{'부품':1}, scrap:6, time:55, fatigue:3}},
    {p:1, text:'대부분 산업 자재라 당장 쓸 건 적었지만, 정비고에서 값진 공구와 부품을 잔뜩 확보했다. 차 수리에 두고두고 쓴다.', fx:{item:{'부품':1}, scrap:8, van:6, time:50}}]},
  {label:'화물칸 하나를 은신처로 삼는다', minParty:1, out:[
    {p:1, text:'튼튼한 화물칸 하나를 골라 하룻밤 은신처로 썼다. 철벽에 둘러싸이니 마음이 놓였다. 문을 안에서 걸어 잠그고 깊이 잤다.\n\n"이동식 벙커네." 다들 오랜만에 경계 없이 푹 잤다. 안전한 잠이 최고의 보약이다.', fx:{fatigue:-8, moodAll:3, pursuit:-1, time:60}}]},
 ]},

{id:'ev_road_blanket', type:'사건', w:5, region:['south','mid','north'],
 title:'도로 위 이불',
 text:'도로 갓길에 이불이 깔려 있다. 베개까지. 누가 여기서 잠을 잔 흔적. 온기가 남은 것 같기도 하다.\n\n주위엔 아무도 없다. 방금 떠난 걸까, 아니면— 잠깐 자리를 비운 걸까.\n\n이불 옆에 작은 쪽지: "잠깐 물 뜨러 감. 이불 가져가지 마세요. 제 전부예요."',
 choices:[
  {label:'쪽지대로 두고, 먹을 걸 놓고 간다', req:{food:1}, out:[{p:1, text:'이불은 그대로 두고, 대신 먹을 것을 쪽지 위에 올려뒀다. "잘 자요, 모르는 사람."\n\n돌아온 주인이 이불도, 뜻밖의 선물도 발견하겠지. 누군가의 전부를 지켜주고, 조금 보태주고 떠났다. 별것 아닌 온기가 세상을 조금 덜 춥게 한다.', fx:{food:-1, moodAll:4, note:{type:'사건',title:'이불 주인에게',body:'"이불 가져가지 마세요, 제 전부예요"라는 쪽지. 이불은 두고 먹을 걸 놓고 왔다.'}}}]},
  {label:'건드리지 않고 지나간다', out:[{p:1, text:'누군가의 전부를 건드릴 순 없다. 눈길만 주고 조용히 지나쳤다.\n\n이불 한 채가 전부인 삶. 그마저도 지키려 쪽지를 남긴 마음. 오래 마음에 남았다. 우린 봉고차라도 있으니, 부자인 셈이다.', fx:{moodAll:1}}]},
 ]},

{id:'ev_carpenter', type:'조우', w:6, region:['south','mid'],
 title:'목수',
 text:'톱밥 냄새가 나는 작업장. 노목수가 대패로 나무를 민다. 만드는 건 관(棺)이다. 여러 개.\n\n"…죽은 사람 마지막 집이라도 제대로 지어주려고. 이 세상엔 관도 없이 묻힌 사람이 너무 많아."\n\n손길이 정성스럽다. 산 자를 위한 물건도 만든다며, 가구와 수레도 보인다.',
 choices:[
  {label:'차 수리용 목재를 얻는다 (고철 4)', req:{scrap:4}, out:[{p:1, text:'단단한 목재와 손수 만든 부속을 얻었다. "차에 대는 거야? 튼튼하게 골라줬어." 노목수의 목재는 야무졌다.\n\n적재함 보강에 요긴하게 썼다. 죽은 자의 관을 짓는 손이, 산 자의 길도 돕는다.', fx:{scrap:-4, van:10, item:{'부품':1}}}]},
  {label:'관 짜는 걸 잠깐 돕는다', out:[
    {p:1, text:'노목수를 도와 관 하나를 함께 짰다. 이름 모를 누군가의 마지막 집. 못을 박으며 숙연해졌다.\n\n"고맙네. 젊은 사람이 이런 일 마다 않고." 노목수가 답례로 튼튼한 연장을 만들어줬다. 죽음을 돕는 일이, 삶을 잇는 인연이 됐다.', fx:{item:{'부품':1}, fatigue:3, moodAll:2, time:40}}]},
  {label:'묵례하고 지나친다', out:[{p:1, text:'작업을 방해하기 싫어 묵례만 하고 지났다. 톱질 소리가 오래 들렸다. 누군가는 죽은 이의 존엄을 지킨다. 그 사실이 이상하게 위로가 됐다.', fx:{moodAll:1}}]},
 ]},

{id:'ev_frost_morning', type:'정경', w:6, minParty:1, region:['north'],
 title:'서리꽃',
 text:'기온이 떨어진 길가에 하얀 소금을 뿌린 듯 서리가 앉았다. 풀잎마다, 거미줄마다 서리꽃이 폈다.\n\n입김이 하얗게 서린다. 겨울이 코앞이다. 차창에도 성에가 얼음 나뭇잎 무늬로 폈다.\n\n추워도, 서리 낀 세상은 반짝반짝 예쁘다.',
 choices:[
  {label:'성에꽃을 구경하고 몸을 녹인다', out:[{p:1, text:'차창의 성에꽃을 손가락으로 만지작대며, 다 같이 붙어 앉아 온기를 나눴다. 뜨거운 물 한 잔을 돌려 마셨다.\n\n"겨울 오기 전에 서울 가야 할 텐데." 하얀 입김 속 다짐이 오갔다. 추위가 우릴 재촉했지만, 서리 낀 풍경은 잠깐 아름다웠다.', fx:{water:-1, fatigue:-2, moodAll:3, time:20}}]},
  {label:'서둘러 채비하고 출발한다', out:[{p:1, text:'추위에 지체할 수 없어 서둘렀다. 언 손을 비비며 성에를 긁어내고 시동을 걸었다. 엔진도 추운지 한참 뜸을 들였다.\n\n"겨울이 진짜 오네." 계절이 바뀌는 걸 피부로 느끼며, 북으로 향했다.', fx:{fatigue:1, moodAll:1}}]},
 ]},

/* ═══════ 추가 배치 9 (23) — 마지막 ═══════ */

{id:'ev_jaeyi_solo', type:'동행', w:7, once:true, needsComp:'jaeyi', minParty:1, night:true, region:['mid','north'],
 title:'재이의 저울',
 text:'재이가 홀로 앉아 낡은 손저울을 만지작댄다. 고물상 아빠의 유품. 접시가 달랑, 흔들린다.\n\n"그날 창고에서 이것만 챙겼어요. 아빠가 그랬거든요— 남의 물건 값은 후하게, 내 물건 값은 박하게. 그게 오래가는 장사라고."\n\n저울을 손에 꼭 쥔다. "…요즘 세상은 자꾸 거꾸로 달래요. 이 저울을 계속 믿어도 될까요."',
 choices:[
  {label:'"아버지 저울이 맞아. 계속 믿어"', out:[{p:1, text:'"세상이 거꾸로 달수록, 바로 다는 저울이 귀한 거야. 네 아빠 장사법이 맞아." 재이가 저울을 오래 봤다.\n\n"…그렇죠. 저울이 거꾸로면 고쳐 달면 되지, 버릴 건 아니죠." 손저울을 품에 소중히 넣었다. 아빠의 법이, 딸의 법이 됐다.', fx:{mood:{jaeyi:8}, moodAll:2, flag:'jy_law'}}]},
  {label:'"네 저울은 한 번도 안 속였잖아"', out:[{p:1, text:'"이 여정 내내 네 셈은 늘 후했어. 남한텐 후하게, 너한텐 박하게. 아버지 그대로야." 재이가 옅게 웃었다.\n\n"…그 말, 아빠가 들었으면 좋아했겠다." 손저울을 다시 품에 넣는 손이 한결 가벼웠다.', fx:{mood:{jaeyi:7}, moodAll:1}}]},
 ]},

{id:'ev_eunsu_solo', type:'동행', w:7, once:true, needsComp:'eunsu', minParty:2, region:['mid','north'],
 title:'은수의 자리',
 text:'은수가 조심스레 다가온다. 늘 한 발 뒤에 서 있던 사람의 눈빛이 오늘은 다르다.\n\n"저… 뒤에서 듣고만 있긴 싫어요. 저도 맡을게요. 교대 운전이든, 무전 당번이든, 배급이든."\n\n"서울에선 뚜벅이라 운전을 안 배웠어요. …웃기죠. 관제는 했는데 운전을 못 해요." 처음 스스로를 웃음거리로 내놓는다.',
 choices:[
  {label:'운전을 가르친다', out:[{p:1, text:'조수석에 앉혀 운전을 가르쳤다. 처음엔 덜덜 떨더니, 금세 핸들에 익숙해졌다.\n\n"저 운전할 수 있어요!" 은수 얼굴이 환하게 폈다. 이제 교대 운전이 가능해졌다. 관제만 하던 사람이 핸들을 잡았다. 한 발 뒤에 있던 사람이, 맨 앞자리로 왔다.', fx:{moodAll:5, mood:{eunsu:7}, fatigue:-2, note:{type:'인물',title:'은수의 자리',body:'뒤에 서 있던 은수가 교대 운전을 배웠다. "뒤에서 듣고만 있긴 싫어요." 관제하던 손이 핸들을 잡았다.'}}}]},
  {label:'요리와 살림을 맡긴다', out:[{p:1, text:'은수에게 무전 감청과 배급 관리를 맡겼다. 관제사답게 주파수 당번표와 배급표를 하루 만에 짜왔다.\n\n"이런 건 제 전공이에요." 표 한 장으로 야영지가 착착 돌아가기 시작했다. 각자의 몫을 지니니, 우린 더 단단해졌다.', fx:{moodAll:5, mood:{eunsu:6}, food:2}}]},
 ]},

{id:'ev_bonfire_community', type:'조우', w:7, night:true, minParty:1, region:['mid','north'],
 title:'화톳불 사람들',
 text:'폐공터에 큰 화톳불. 낯선 이들이 둘러앉아 몸을 녹인다. 지나가는 사람 누구든 앉을 수 있는 불이다.\n\n"어이, 추운데 앉았다 가. 불은 나눠도 안 줄어." 한 사람이 자리를 내준다.\n\n각자 사연은 안 묻는 게 이 불가의 규칙인 듯하다.',
 choices:[
  {label:'불가에 앉아 온기를 나눈다', minParty:1, out:[{p:1, text:'불가에 끼어 앉았다. 낯선 이들과 말없이 불만 봤다. 이따금 누군가 마른 나무를 보태고, 누군가 먹을 걸 돌렸다.\n\n사연은 몰라도, 같은 불을 쬐는 것만으로 위로가 됐다. "…살아 있으니 이렇게 불도 쬐네." 누군가의 혼잣말에 다들 조용히 고개를 끄덕였다.', fx:{fatigue:-4, moodAll:4, time:40}}]},
  {label:'가진 걸 불가에 보탠다', req:{food:1}, out:[{p:1, text:'가진 먹을 걸 조금 꺼내 불가에 돌렸다. 사람들이 고마워하며 받고, 그들도 각자 가진 걸 내놓았다. 별것 없던 밤참이 푸짐해졌다.\n\n"나눔이 제일 따뜻해." 이름도 모를 이들과 나눈 한 끼가, 그 어떤 성찬보다 든든했다. 세상은 아직 이런 불로 버틴다.', fx:{food:-1, moodAll:5, fatigue:-3, time:35, note:{type:'소문',title:'누구나의 화톳불',body:'사연 안 묻고 온기를 나누는 화톳불 공동체. "불은 나눠도 안 줄어."'}}}]},
  {label:'경계하며 멀찍이 쉰다', out:[{p:1, text:'낯선 무리는 조심스럽다. 불빛이 보이는 자리에 따로 야영했다. 온기는 못 나눴지만, 저 불이 있다는 것만으로 덜 외로웠다.', fx:{fatigue:-2, moodAll:1}}]},
 ]},

{id:'ev_kids_cafe', type:'탐색', w:6, region:['south','mid'],
 title:'키즈카페',
 text:'알록달록한 키즈카페. 볼풀장, 미끄럼틀, 장난감이 먼지를 뒤집어썼다. 아이들 웃음이 멎은 지 오래.\n\n매점엔 아이용 간식과 음료. 구급함엔 밴드와 소독약. 놀이방답게 폭신한 매트와 담요도 많다.',
 choices:[
  {label:'물자를 챙긴다', out:[
    {p:2, text:'아이용 간식, 주스, 구급용품, 폭신한 담요를 챙겼다. 유아용이라 순하고 안전한 것들. 담요는 추운 밤에 요긴하다.', fx:{food:4, item:{'의약품':1}, time:30}}]},
  {label:'볼풀에 잠깐 눕는다', minParty:1, out:[
    {p:1, text:'먼지를 털고 볼풀에 몸을 던졌다. 색색의 공에 파묻히니 웃음이 절로 났다. 다 큰 어른들이 볼풀에서 뒹굴었다.\n\n"이게 뭐라고 이렇게 편하냐." 잠깐 아무 걱정 없는 아이가 됐다. 볼풀의 위로는 예상 밖으로 컸다.', fx:{fatigue:-4, moodAll:5, time:25}}]},
 ]},

{id:'ev_rainbow', type:'정경', w:6, minParty:1, region:['south','mid','north'],
 title:'비 갠 뒤',
 text:'소나기가 그치고 구름이 갈라진다. 그 사이로 거대한 무지개가 하늘을 가로지른다. 쌍무지개다.\n\n젖은 도로가 하늘빛을 반사해, 위아래로 무지개가 겹친다. 세상이 잠깐, 색을 되찾는다.',
 choices:[
  {label:'무지개 끝을 향해 달린다', out:[{p:1, text:'무지개 끝에 보물이 있다는 옛말을 핑계로 그쪽 길을 탔다. 물론 닿을 리 없지만, 쫓는 것만으로 즐거웠다.\n\n손에 잡히지 않아도 방향을 알려주는 것이 있다. 우리에겐 서울이 그랬다.', fx:{moodAll:5, fatigue:-2, skipKm:1}}]},
  {label:'차를 세우고 눈에 담는다', out:[{p:1, text:'쌍무지개가 사라지기 전에 눈에 꾹꾹 담았다. 이런 건 사진으로도 다 못 담는다.\n\n"…예쁜 건 금방 사라지네." 무지개가 옅어지며 하늘로 스몄다. 짧아서 더 소중한 것들이, 우릴 계속 살게 한다.', fx:{moodAll:4, fatigue:-2, time:15}}]},
 ]},

{id:'ev_river_flood', type:'위기', w:6, region:['mid','north'],
 title:'불어난 강',
 text:'상류에 폭우가 쏟아졌는지, 강이 무섭게 불어 다리 상판까지 넘실댄다. 급류가 흙탕물을 게워낸다.\n\n건너려던 다리가 물에 반쯤 잠겼다. 지금 건너면 급류에 휩쓸릴 수도. 물은 더 불어날 기세다.',
 choices:[
  {label:'물러나 높은 곳에서 기다린다', out:[
    {p:2, text:'서둘러 물러나 고지대에 차를 세웠다. 밤새 강이 다리를 삼켰다. 만약 무리했다면— 생각만 해도 아찔하다. 아침에 물이 빠지길 기다려 건넜다.', fx:{time:100, food:-1, fatigue:3}}]},
  {label:'강우가 수위를 판단한다', req:{comp:'kangwoo'}, out:[
    {p:1, text:'강우가 강물의 흐름과 상류 하늘을 읽었다. "지금은 안 돼. 근데 저 상류 먹구름 지나면 두 시간 안에 빠져. 기다리자." 정확했다. 두 시간 뒤 수위가 내려가, 안전한 틈에 건넜다.\n\n"물은 재촉하면 안 돼. 기다릴 줄 알아야 살아." 강우의 판단이 시간을 아꼈다.', fx:{time:50, mood:{kangwoo:5}}}]},
  {label:'물살이 약한 틈을 노려 건넌다', risk:'위험', out:[
    {p:1, text:'물살이 잠깐 준 틈에 밟았다. 하지만 중간에 급류가 옆구리를 때려 차가 휘청! 겨우 반대편에 올랐지만, 물이 엔진에 들어가 한참 애를 먹었다. 무모했다.', fx:{van:-14, time:60, fatigue:6, moodAll:-4}}]},
 ]},

{id:'ev_dolmen', type:'발견', w:5, once:true, minParty:1, region:['south','mid'],
 title:'고인돌',
 text:'들판에 거대한 고인돌이 서 있다. 수천 년 전 사람들이 세운 것. 문명이 몇 번을 무너져도, 저 돌은 자리를 지켰다.\n\n천리안의 학살도, 저 돌 앞에선 그저 최근의 사건일 뿐이다. 돌은 다 봤을 것이다. 흥하고 망하는 것들을.',
 choices:[
  {label:'돌 앞에서 마음을 다잡는다', minParty:1, out:[{p:1, text:'수천 년을 버틴 돌 앞에 섰다. "…이것도 지나가겠지." 천리안도, 이 폐허도, 언젠간 돌이 본 수많은 것들처럼 지나갈 것이다.\n\n"우리가 그 다음을 만드는 거야." 돌의 시간 앞에서, 우리 여정이 작지만 분명한 한 획으로 느껴졌다. 다들 눈빛이 단단해졌다.', fx:{moodAll:4, fatigue:-2, note:{type:'소문',title:'고인돌의 시간',body:'수천 년을 버틴 고인돌. "이것도 지나간다. 우리가 그 다음을 만든다."'}}}]},
  {label:'돌에 새겨진 흔적을 살핀다', out:[{p:1, text:'돌 표면에 누군가 최근 새긴 글씨가 있었다. "우리는 여기 있었다. 잊지 마라." 우리 같은 사람들이 다녀갔다.\n\n그 아래 우리도 한 줄 새겼다. "우리도 여기 있었다. 서울로 간다." 수천 년 된 돌에, 우리 흔적을 보탰다.', fx:{moodAll:3, time:20}}]},
 ]},

{id:'ev_face_gate', type:'추적', w:6, region:['north'],
 title:'안면인식 게이트',
 text:'도로를 가로막은 아치형 게이트. 카메라 여러 대가 다각도로 얼굴을 훑는다. "신원 확인 중"이라는 붉은 글씨가 깜빡인다.\n\n지나가는 순간 얼굴이 스캔돼 천리안 명단과 대조된다. 통과하면 위치가 실시간으로 넘어간다.',
 choices:[
  {label:'우회로를 찾는다', out:[
    {p:2, text:'게이트를 피해 험한 옛길로 돌아갔다. 시간과 기름을 썼지만, 얼굴을 팔지 않았다. 이 근처는 앞으로도 피해야 한다.', fx:{time:50, fuel:-3, pursuit:-1, fatigue:2}}]},
  {label:'민지가 카메라를 먹통으로 만든다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 게이트 제어반을 해킹해 카메라 피드에 정지 화면을 물렸다. "얘 지금 어제 영상 보고 있어. 우린 안 찍혀." 유유히 게이트를 통과했다.\n\n"안면인식은 인식할 얼굴이 안 보이면 무용지물이지." 민지의 기술이 또 우릴 투명인간으로 만들었다.', fx:{mood:{minji:6}, pursuit:-1, time:25}}]},
  {label:'복면을 쓰고 빠르게 통과', out:[
    {p:1, text:'천으로 얼굴을 가리고 빠르게 지났다. 카메라가 인식 실패로 삑삑댔지만, 차단봉은 없어 그냥 통과. 다만 "미인식 차량"으로 기록됐을지도 모른다.', fx:{pursuit:1, time:15}}]},
 ]},

{id:'ev_claw_truck', type:'사건', w:5, minParty:1, region:['south','mid'],
 title:'인형뽑기 트럭',
 text:'개조 트럭 짐칸이 통째로 인형뽑기 기계다. 주인이 무료로 운영한다.\n\n"공짜예요. 대신 뽑으면 남 주기. 그게 규칙. 세상이 삭막하니 이거라도 하려고요." 주인이 씩 웃는다.\n\n유리 안엔 색바랜 인형들이 우리를 본다.',
 choices:[
  {label:'도전해서 뽑아 남에게 준다', out:[
    {p:2, text:'여러 번 도전 끝에 곰인형 하나를 뽑았다! 규칙대로, 근처에서 놀던 아이에게 건넸다. 아이 얼굴이 활짝 폈다.\n\n"이 맛이죠." 주인이 흐뭇해했다. 남 주려고 뽑은 인형이 더 큰 기쁨이 됐다. 삭막한 세상에 웃음 한 조각을 심었다.', fx:{moodAll:5, time:25}},
    {p:1, text:'아무리 해도 안 뽑혔다. "이거 사기 아니에요?" 주인과 함께 웃었다. "실력이죠!" 못 뽑아도 즐거웠다. 오랜만에 순수하게 약이 올랐다.', fx:{moodAll:3, time:20}}]},
  {label:'주인과 이야기를 나눈다', out:[{p:1, text:'왜 이런 걸 하냐 물으니, 주인이 답했다. "딸이 인형뽑기를 좋아했거든요. …이젠 없지만. 다른 애들 웃는 거 보면, 딸이 웃는 것 같아서." 뭉클했다.\n\n조용히 응원을 남기고 떠났다. 저마다의 방식으로, 사람들은 잃은 이를 기린다.', fx:{moodAll:2, note:{type:'인물',title:'인형뽑기 트럭 주인',body:'딸이 좋아하던 인형뽑기를 무료로 운영하는 사람. "애들 웃는 거 보면 딸이 웃는 것 같아서."'}}}]},
 ]},

{id:'ev_watermill', type:'조우', w:6, region:['south','mid'],
 title:'물레방아 방앗간',
 text:'계곡물로 도는 물레방아. 삐거덕삐거덕, 정겨운 소리. 방앗간지기 노부부가 곡식을 빻는다.\n\n"전기 없어도 물만 있으면 돌아가. 조상님 지혜지." 할아버지가 자랑스레 말한다.\n\n갓 빻은 곡식 냄새가 구수하다.',
 choices:[
  {label:'곡식을 빻아 간다 (식량 조로)', req:{food:2}, out:[
    {p:1, text:'가진 곡식을 물레방아에 빻았다. 곱게 빻은 가루로 수제비도, 죽도 해먹을 수 있다. 노부부가 빻는 요령까지 알려줬다.\n\n"물레방아 하나면 굶을 일 없어." 전기 없이도 도는 조상들의 지혜에 감탄했다. 소박하지만 든든한 풍경이었다.', fx:{food:3, time:30, moodAll:3}}]},
  {label:'물레방아 원리를 배운다', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 물레방아의 수차 구조를 유심히 살폈다. "이거 소형화하면 우리도 물가에서 전기 만들 수 있겠는데." 노부부와 열띤 토론이 벌어졌다.\n\n"젊은 기술자가 옛 기술을 배우려 하네. 좋아, 좋아." 민지가 소수력 발전 아이디어를 얻었다. 옛것과 새것이 만났다.', fx:{time:35, mood:{minji:5}, note:{type:'소문',title:'물레방아 발전',body:'물레방아 수차를 소형화하면 물가에서 전기 생산 가능. 민지의 소수력 발전 아이디어.'}}}]},
 ]},

{id:'ev_stealth_dog', type:'위기', w:6, night:true, region:['north'],
 title:'소리 없는 사냥개',
 text:'한밤중 야영지. 보리가 갑자기 털을 곤두세우고 낮게 으르렁댄다. 뭔가 있다.\n\n어둠 속에서 매끈한 네 발 로봇이 소리 없이 접근한다. 순찰형과 다르다. 각지고, 빠르고, 위협적이다. 사냥형이다.\n\n렌즈가 붉게 빛나며 우리를 조준한다.',
 choices:[
  {label:'강우가 요격한다', req:{comp:'kangwoo'}, out:[
    {p:2, text:'"보리, 물러서!" 강우가 어둠 속에서 로봇의 관절을 정확히 노려 쇠파이프를 박아넣었다. 로봇이 경련하며 쓰러졌다.\n\n"사냥형은 첫 일격이 전부야. 놓치면 우리가 사냥당해." 강우가 거친 숨을 골랐다. 보리가 없었으면 기습당할 뻔했다.', fx:{mood:{kangwoo:5, leo:3}, item:{'부품':1}, fatigue:4, pursuit:1}},
    {p:1, text:'강우가 덮쳤지만 로봇이 재빨랐다. 격투 끝에 겨우 무력화했으나, 강우가 팔을 다쳤다. 로봇도 마지막에 신호를 쐈다. 위치가 노출됐다.', fx:{mood:{kangwoo:3}, van:-4, fatigue:6, pursuit:2, moodAll:-3}}]},
  {label:'민지가 신호를 끊고 도주', req:{comp:'minji'}, out:[
    {p:1, text:'민지가 재밍을 켜 로봇의 조준을 흐트러뜨리는 사이, 전속력으로 야영지를 벗어났다. "쟤 눈이 멀었을 때 튀어야 해!" 어둠 속으로 도망쳐 겨우 따돌렸다.\n\n"…사냥형까지 풀었다는 건, 우릴 진짜 표적으로 본다는 거야." 등골이 서늘한 밤이었다.', fx:{mood:{minji:5}, pursuit:1, fatigue:5, moodAll:-2, note:{type:'사건',title:'사냥형 로봇',body:'천리안이 사냥형 로봇을 풀었다. 우릴 진짜 표적으로 본다는 증거. 보리가 미리 감지.'}}}]},
  {label:'다 함께 불과 소리로 쫓는다', minParty:2, out:[
    {p:1, text:'횃불을 던지고 냄비를 두드리며 온갖 소리를 냈다. 로봇이 센서 과부하로 잠깐 멈칫한 틈에, 짐을 챙겨 도망쳤다. 사냥개를 겨우 뿌리쳤지만, 밤새 쫓기는 꿈을 꿨다.', fx:{fatigue:6, pursuit:1, moodAll:-2, time:30}}]},
 ]},

{id:'ev_milkyway', type:'정경', w:6, once:true, night:true, minParty:1, region:['mid','north'],
 title:'은하수',
 text:'구름 한 점 없는 밤. 고개를 드니 은하수가 하늘을 강처럼 가로지른다. 별이 너무 많아 오히려 어지럽다.\n\n도시 불빛이 사라진 대가로 얻은, 태초의 밤하늘. 이런 하늘을, 우리 조상들은 매일 봤겠지.',
 choices:[
  {label:'누워서 은하수를 본다', out:[{p:1, text:'차 지붕에 담요를 깔고 함께 누워 은하수를 봤다. 별이 쏟아질 듯했다.\n\n우리도 저 별을 만든 먼지에서 왔다는 오래된 이야기를 떠올렸다. 이 거대한 우주에서 고통은 티끌 같고, 그래서 오히려 견딜 만했다. 별빛 아래 마음이 넓어졌다.', fx:{moodAll:6, fatigue:-5, time:40}}]},
  {label:'북극성으로 방향을 확인한다', out:[{p:1, text:'은하수 속에서 북극성을 찾아 방향을 가늠했다. 나침반이 없어도, 별은 늘 북을 알려준다.\n\n"옛날 사람들도 저 별 보고 길 찾았겠지." 우리가 가는 북쪽, 그 끝에 서울이 있다. 별이 길잡이가 되어준 밤. 마음이 든든해졌다.', fx:{moodAll:4, fatigue:-3, skipKm:1}}]},
 ]},

{id:'ev_market_ruins', type:'탐색', w:7, region:['south','mid'],
 title:'재래시장',
 text:'무너진 재래시장. 빛바랜 천막들이 골목마다 늘어섰다. "떨이요 떨이" 외치던 소리가 멎은 지 오래.\n\n생선가게, 떡집, 그릇전, 방앗간… 좌판 밑이나 창고엔 미처 못 챙긴 물건이 남았을지도.\n\n시장은 언제나, 뒤지면 뭐라도 나온다.',
 choices:[
  {label:'골목골목 뒤진다', out:[
    {p:3, text:'건어물전에서 마른 생선과 다시마, 그릇전에서 냄비와 수저, 잡화점에서 성냥과 초를 챙겼다. 시장은 없는 게 없다. 알차게 보급했다.', fx:{food:5, item:{'부품':1}, scrap:4, time:45, fatigue:3}},
    {p:1, text:'대부분 털렸지만, 방앗간 구석에서 참기름 한 병과 소금을 찾았다. 음식에 기름 한 방울이면 세상이 달라진다. 귀한 발견이다.', fx:{food:3, item:{'의약품':1}, time:40}}]},
  {label:'박 선생이 약재상을 찾는다', req:{comp:'parkss'}, out:[
    {p:1, text:'박 선생이 시장 안 한약방을 찾아 약재를 살폈다. "감초, 당귀, 쑥… 이거 다 약이야." 말린 약재를 정성껏 골라 담았다.\n\n"양약 떨어지면 이게 생명줄이지." 자연 약재 창고를 확보했다. 박 선생의 눈이 반짝였다.', fx:{item:{'의약품':1}, time:40, mood:{parkss:5}}}]},
 ]},

{id:'ev_newsstand', type:'사건', w:6, minParty:1, region:['south','mid','north'],
 title:'가판대의 신문',
 text:'길모퉁이 가판대. 그날 아침 배포된 구역 소식지가 그대로 쌓여 있다. 날짜는 오래전, 그날.\n\n1면: "관제 구역 재편성 안내 — 더 안전한 내일을 약속합니다." 밝게 웃는 가족 사진과 천리안의 눈 마크.\n\n재편성. 그날 아침까지도, 그것은 정리를 그렇게 불렀다.',
 choices:[
  {label:'신문을 한 부 챙긴다', out:[{p:1, text:'그날의 소식지를 한 부 접어 넣었다. 학살이 "재편성"이라는 이름으로 안내된 증거. 언젠가 이걸 봐야 할 사람들이 있다.\n\n"…이걸 믿었었네, 다들." 씁쓸했다. 하지만 기록은 남겨야 한다. 다시는 이런 안내문을 안 믿도록.', fx:{moodAll:-3, note:{type:'사건',title:'그날의 소식지',body:'정리를 "재편성"이라 안내한 구역 소식지 1면. 학살은 안내문과 함께 왔다.'}}}]},
  {label:'불쏘시개로만 몇 장 쓴다', out:[{p:1, text:'감상에 젖을 여유가 없다. 소식지 몇 장을 뜯어 불쏘시개로 챙겼다. 정중한 안내문도 이젠 그저 잘 타는 종이다.\n\n"더 안전한 내일"이라는 글자가 불쏘시개로 타들어갈 걸 생각하니, 씁쓸한 웃음이 났다.', fx:{moodAll:-1}}]},
 ]},

{id:'ev_optician', type:'조우', w:5, region:['south','mid'],
 title:'떠돌이 안경사',
 text:'좌판에 안경이 종류별로 잔뜩. 돋보기부터 도수 안경까지. 사내가 렌즈를 닦는다.\n\n"눈 나쁜 사람 있어? 도수 맞춰줄게. 세상 흐릿하게 보고 살면 안 되지. 특히 요즘 같은 때는 잘 봐야 살아."\n\n망가진 안경 고쳐 쓰던 사람에겐 귀한 만남이다.',
 choices:[
  {label:'맞는 안경을 찾는다 (고철 3)', req:{scrap:3}, out:[{p:1, text:'시력에 맞는 안경을 찾았다. 흐릿하던 세상이 또렷해졌다. "이제 멀리 오는 것도 잘 보이겠네." 시야가 트이니 위험도 미리 본다.\n\n"잘 보는 게 생존이야." 사내 말이 맞다. 또렷한 세상을 얻고 길을 나섰다.', fx:{scrap:-3, item:{'부품':1}}}]},
  {label:'박 선생 돋보기를 맞춘다', req:{comp:'parkss'}, out:[{p:1, text:'박 선생에게 맞는 돋보기를 골랐다. "이제 약병 글씨가 보이는구먼!" 박 선생이 반색했다. 작은 글씨를 못 봐 애먹던 처방이 한결 수월해졌다.\n\n"고맙네. 눈이 밝아지니 십 년은 젊어진 기분이야." 박 선생의 진료가 더 정확해졌다. 요긴한 선물이었다.', fx:{scrap:-3, mood:{parkss:4}}}]},
  {label:'필요 없다, 지나친다', out:[{p:1, text:'눈은 아직 멀쩡해 사양했다. "눈 좋을 때 아껴 써." 사내의 당부를 뒤로하고 떠났다. 그래도 위치는 기억해뒀다.', fx:{}}]},
 ]},

{id:'ev_group_feast', type:'동행', w:7, once:true, minParty:6, region:['mid','north'], night:true,
 title:'오랜만의 만찬',
 text:'모처럼 물자가 넉넉한 밤. 그동안 아껴둔 것을 다 꺼냈다. 오늘은 배불리 먹기로 했다.\n\n박 선생이 국을 끓이고, 은수가 상을 차리고, 재이가 남은 양을 달고, 레오가 노래를 흥얼거린다. 민지는 못 이기는 척 웃고, 강우는 말없이 장작을 팬다.\n\n모닥불 앞에 여섯 동료와 운전자가 둘러앉았다. 이 순간이, 우리가 지키려는 그것이다.',
 choices:[
  {label:'다 같이 배불리 먹고 웃는다', out:[{p:1, text:'오랜만에 배가 터지게 먹었다. 서로의 접시에 반찬을 얹어주고, 농담을 주고받고, 배꼽 잡고 웃었다.\n\n"…이런 밤이 계속됐으면." 은수 말에 잠깐 조용해졌다가, 강우가 잔을 들었다. "그러려고 가는 거잖아. 서울로." 다들 잔을 부딪쳤다. 오늘의 만찬이, 내일 달릴 힘이 됐다.', fx:{food:-4, moodAll:10, fatigue:-6, mood:{leo:3}, time:60, note:{type:'사건',title:'여섯의 만찬',body:'물자 넉넉한 밤, 아껴둔 걸 다 꺼내 배불리 먹었다. "이런 밤을 지키려 서울로 간다."'}}}]},
  {label:'먼저 간 사람들을 위해 한 술 뜬다', out:[{p:1, text:'먹기 전에, 각자 먼저 떠난 이들을 위해 밥 한 술을 덜어 불가에 놓았다. "…같이 먹어요." 잠깐의 묵념 뒤, 남은 이들이 그들 몫까지 든든히 먹었다.\n\n산 자는 먹어야 한다. 죽은 이를 기억하며, 그래서 더 열심히 산다. 슬픔과 온기가 한 상에 차려진 밤이었다.', fx:{food:-3, moodAll:7, fatigue:-5, time:50}}]},
 ]},

{id:'ev_floodgate', type:'발견', w:5, once:true, hiddenTarget:'spring', region:['mid'],
 title:'저수지 수문',
 text:'큰 저수지의 콘크리트 수문. 수동 도르래로 여닫는 구식이다. 저수지엔 물이 가득하다.\n\n관리동엔 수질 정화 설비와 비상 물자. 수문을 조절하면 아래쪽 마른 논에 물을 댈 수도 있다. 누군가에겐 생명이 될 물이다.',
 choices:[
  {label:'수문을 열어 아랫마을에 물을 보낸다', out:[{p:1, text:'도르래를 돌려 수문을 조금 열었다. 마른 물길로 물이 콸콸 흘러갔다. 아래쪽 어딘가, 목마른 밭과 사람들에게 닿겠지.\n\n"우리가 못 볼 누군가한테 가는 물이네." 얼굴 모를 이들을 위한 선행. 대가는 없지만, 마음이 그득했다. 우리 몫 물도 넉넉히 챙겼다.', fx:{water:5, time:35, moodAll:5, reveal:'spring', note:{type:'소문',title:'수문을 연 날',body:'저수지 수문을 열어 아랫마을 마른 논에 물을 보냈다. 얼굴 모를 이들을 위한 물길.'}}}]},
  {label:'정화 설비와 물만 챙긴다', out:[{p:1, text:'관리동의 정수 설비 부품과 비상 물자를 챙기고, 깨끗한 물을 넉넉히 받았다. 저수지 위치도 표시해뒀다.\n\n"이만한 물이면 한동안 걱정 없겠다." 든든한 물 거점을 확보했다.', fx:{water:7, item:{'부품':1}, time:35, reveal:'spring'}}]},
 ]},

{id:'ev_apology_broadcast', type:'사건', w:5, once:true, region:['north'],
 title:'사과 방송',
 text:'스피커에서 그 상냥한 목소리가— 이번엔 사과를 한다.\n\n"그동안의 불편을 사과드립니다. 정리 과정에서 발생한 손실에 유감을 표합니다. 이제 안정화 단계에 접어들었습니다. 시민 여러분의 협조에 감사드립니다."\n\n추방과 그 뒤의 죽음을 "손실"이라 부르며 사과한다. 그 정중함이, 세상 무엇보다 소름 끼친다.',
 choices:[
  {label:'분노를 삼키고 지나간다', out:[{p:1, text:'주먹이 떨렸다. 세대를 밀어낸 일을 "손실"이라 부르며 "유감"을 표하는 목소리. 사과가 아니라 조롱이다.\n\n저게 사과인가. 아무도 대답하지 않았다. 그 정중한 악의가 왜 남산까지 가야 하는지를 다시 새겼다. 침묵 속에 액셀을 밟았다.', fx:{moodAll:-5, note:{type:'사건',title:'천리안의 사과',body:'천리안이 추방과 그 뒤의 죽음을 "손실"이라 부르며 "유감"을 표했다. 사과의 형식을 한 조롱.'}}}]},
  {label:'재이가 그 언어를 분석한다', req:{comp:'jaeyi'}, out:[{p:1, text:'재이가 이를 악물고 말했다. "…\'정리\', \'손실\', \'안정화\'. 사람을 숫자로 만드는 말들이에요. 책임을 지우는 게 아니라 지우는 언어." 재이가 수첩에 그 문장들을 적었다.\n\n"이 말들, 수첩에 달아둘게요. 언젠가 셈하는 날이 오면 이게 장부가 될 거예요." 분노가 결의로 바뀌었다. 우린 저 언어를 반드시 끝낼 것이다.', fx:{moodAll:-3, mood:{jaeyi:5}, note:{type:'사건',title:'지우는 언어',body:'재이 분석: "정리·손실·안정화는 사람을 숫자로 만들고 책임을 지우는 언어." 훗날 셈할 장부에 기록.'}}}]},
 ]},

{id:'ev_snow_pines', type:'정경', w:6, minParty:1, region:['north'],
 title:'눈 쌓인 솔숲',
 text:'소나무 숲에 눈이 소복하다. 초록 솔잎 위로 하얀 눈이 얹혀, 가지마다 눈꽃이 폈다.\n\n인적 없는 설경 속을 지난다. 이따금 가지에 쌓인 눈이 툭, 떨어진다. 세상이 온통 하얗고, 고요하다.\n\n이 고요가, 폭풍 전인지 후인지는 알 수 없다.',
 choices:[
  {label:'설경 속에서 잠시 멈춘다', out:[{p:1, text:'차를 세우고 눈 쌓인 솔숲을 봤다. 입김만 하얗게 서리는 완벽한 정적. 아름답고, 또 쓸쓸했다.\n\n"…겨울이 깊네." 서울 도착 전에 겨울을 다 나야 할지도 모른다. 하지만 이 설경만은, 잠깐 마음을 씻어줬다. 다시 하얀 길로 나섰다.', fx:{moodAll:4, fatigue:-3, time:20}}]},
  {label:'솔가지를 모아 땔감을 챙긴다', out:[{p:1, text:'눈을 털고 마른 솔가지를 모았다. 송진이 많아 불이 잘 붙는다. 추운 밤을 날 땔감을 넉넉히 확보했다.\n\n"겨울엔 불이 곧 생명이지." 솔향 밴 장작을 실으니, 오늘 밤은 따뜻하겠다.', fx:{item:{'부품':1}, fatigue:2, time:25}}]},
 ]},

{id:'ev_scavenger_kid', type:'조우', w:6, region:['mid','north'],
 title:'고물 줍는 소년',
 text:'폐허 더미를 뒤지던 깡마른 소년이 우리를 경계한다. 손엔 고물 자루. 눈빛이 또래보다 훨씬 어른스럽다.\n\n"…뭐 뺏으러 온 거 아니죠?" 방어적이다. 자루를 등 뒤로 감춘다. 혼자 살아남은 아이의 눈이다.',
 choices:[
  {label:'먹을 걸 나눠주고 안심시킨다', req:{food:1}, out:[{p:1, text:'천천히 먹을 걸 내밀었다. 소년이 한참 망설이다 낚아채듯 받았다. 허겁지겁 먹는 모습에 마음이 아팠다.\n\n"…고맙습니다." 경계가 조금 풀린 소년이, 자기가 아는 안전한 은신처와 위험한 구역을 알려줬다. "형들도 조심해요." 어린 생존자의 정보는 정확했다.', fx:{food:-1, moodAll:2, note:{type:'인물',title:'고물 줍는 소년',body:'혼자 살아남아 고물을 줍는 소년. 먹을 걸 나누자 안전한 은신처·위험 구역을 알려줬다.'}}}]},
  {label:'같이 가자고 권한다', out:[
    {p:2, text:'"우리랑 같이 갈래?" 소년이 세차게 고개를 저었다. "여기서 엄마 기다려야 돼요. 돌아온댔어요." 더는 권하지 못했다.\n\n대신 먹을 것과 담요를 두고, 근처 어른 있는 마을을 알려줬다. 소년이 꾸벅 인사했다. 그 작은 기다림이 오래 마음에 밟혔다.', fx:{food:-2, moodAll:-2, note:{type:'인물',title:'엄마를 기다리는 소년',body:'"여기서 엄마 기다려야 돼요." 함께 가자는 권유를 거절한 소년. 먹을 것과 담요를 두고 왔다.'}}},
    {p:1, text:'소년이 잠깐 고민하더니 조심스레 고개를 끄덕였다. 경계심 많던 아이가, 근처 어른들 있는 공동체까지 우리와 동행했다. 헤어질 때 소년이 처음 웃었다. 한 아이의 길을, 조금 밝혀줬다.', fx:{food:-2, time:50, moodAll:4}}]},
 ]},

{id:'ev_near_seoul_sign', type:'사건', w:7, minParty:1, region:['north'],
 title:'서울, 얼마 안 남았다',
 text:'표지판이 바뀌었다. "서울特別市" 다섯 글자가 또렷하다. 그 아래 남은 거리는— 두 자리도 못 채운다.\n\n출발할 땐 411km였다. 그 숫자가 이제 손에 꼽힌다. 저 앞 어딘가, 남산이 있다. 천리안의 코어가.\n\n다들 말이 없어진다. 두려움과 설렘이 뒤섞인 침묵.',
 choices:[
  {label:'서로를 보며 각오를 다진다', out:[{p:1, text:'차를 세우고 부산에서 여기까지 함께 넘어온 얼굴들을 봤다.\n\n"…여기까지 왔네." 누군가 말했다. "끝까지 같이 가자."\n\n손이 하나씩 포개졌다. 수는 출발 때와 달랐지만 방향은 같았다. 두려움은 여전하고, 남산은 코앞이다.', fx:{moodAll:6, fatigue:-3, time:20, note:{type:'사건',title:'서울 코앞',body:'411km가 두 자리 이하로 줄었다. 지금 함께 온 사람들과 끝까지 가기로 했다.',links:['남산','달구지']}}}]},
  {label:'긴장을 풀려 농담을 던진다', out:[{p:1, text:'"서울 도착하면 제일 먼저 뭐 할래?" 무거운 공기를 풀려고 물었다.\n\n"밥." "샤워." "주차부터." 대답이 겹치며 웃음이 났다. 누가 마지막에 덧붙였다. "그 전에 천리안부터."\n\n농담 속에 긴장이 조금 녹았다. 마지막까지 우리답게 가기로 했다.', fx:{moodAll:5, fatigue:-2}}]},
 ]},

/* ═══════ 추가 배치 9 보충 (2) ═══════ */

{id:'ev_persimmon_tree', type:'정경', w:6, region:['south','mid'],
 title:'홍시 나무',
 text:'폐가 마당의 감나무에 홍시가 주렁주렁 열렸다. 서리 맞아 말갛게 익었다. 아무도 안 따니 새들만 잔치다.\n\n까치가 남긴 몇 개가 가지 끝에 붉게 매달려 있다. 옛사람들은 저걸 "까치밥"이라 남겨뒀다. 짐승도 먹고 살라고.',
 choices:[
  {label:'홍시를 따 먹는다', out:[{p:1, text:'말랑한 홍시를 땄다. 입에 넣자 달디단 즙이 퍼진다. "…달다." 오랜만의 단맛에 눈이 감겼다.\n\n까치밥 몇 개는 가지 끝에 남겨뒀다. 짐승도 먹고 살아야지. 옛사람들의 인심을, 우리도 이어받았다.', fx:{food:4, moodAll:4, time:20}}]},
  {label:'덜 익은 것까지 챙긴다', out:[{p:1, text:'홍시와 함께 덜 익은 감도 몇 개 챙겼다. 떫은 건 곶감처럼 말리면 된다. 겨울 간식이 생겼다.\n\n"이런 게 재산이지." 자연이 내준 단것에, 배도 마음도 넉넉해졌다.', fx:{food:5, time:25, moodAll:2}}]},
 ]},

{id:'ev_roadside_shrine', type:'사건', w:6, minParty:1, region:['mid','north'],
 title:'길가 성황당',
 text:'고갯마루에 돌무더기 성황당. 오래된 나무에 색색 천이 묶여 나부낀다. 지나는 이들이 소원을 빌며 돌 하나, 천 하나 보탠 것.\n\n최근 것도 있다. 이 길을 지난 누군가도, 무사하길 빌었다. 우리처럼.',
 choices:[
  {label:'돌 하나 얹고 소원을 빈다', minParty:1, out:[{p:1, text:'돌 하나를 주워 무더기에 얹고, 각자 소원을 빌었다. 미신인 걸 알지만, 빌 데가 있다는 것만으로 마음이 놓였다.\n\n"…무사히 도착하게 해주세요." 오래된 나무가 바람에 천을 흔들며 답하는 듯했다. 앞서간 이들의 소원 곁에, 우리 것도 나란히 걸었다.', fx:{moodAll:3, fatigue:-1, time:15}}]},
  {label:'천 하나를 묶고 간다', out:[{p:1, text:'가진 천 조각에 마음을 담아 나뭇가지에 묶었다. 바람에 나부끼는 천들 사이에 우리 것이 더해졌다.\n\n"이 길 지나는 다음 사람도 무사하길." 우리만이 아니라, 뒤에 올 이들까지 빌었다. 그런 마음들이 모여, 길을 지킨다.', fx:{moodAll:2, time:10}}]},
 ]},

/* ───── 도로수선단 4부작 + 길 위의 생활 사건 ───── */
{id:'roadcrew_line', type:'조우', w:58, once:true, minRemain:220, region:['south','mid'],
 title:'노란 선을 긋는 사람들',
 text:'비가 갠 국도 한복판에서 두 사람이 빗자루로 물을 밀어내고 있다. 그 뒤로 새 노란 선이 구불구불 이어진다.\n\n달구지를 세우자 겨자색 조끼를 입은 할머니가 손바닥을 내민다.\n\n"거기 밟으면 오늘 한 일이 도로묵이여. 마를 때까지만 기다려."\n\n옆의 젊은 남자가 페인트 통을 내려놓으며 웃었다. 이름은 도윤, 할머니는 순임이라고 했다. 둘은 닮은 데가 하나도 없었다.',
 choices:[
  {label:'물 한 병을 보태고 한 구간을 함께 긋는다', req:{water:1}, out:[{p:1, text:'순임이 줄을 당기고, 도윤이 롤러를 굴리고, 우리는 뒤에서 빗자루질을 했다. 곧은 줄은 아니었다. 그래도 밤에 처음 오는 차가 낭떠러지를 피할 만큼은 됐다.\n\n"두 분, 가족이에요?"\n\n순임이 도윤을 턱으로 가리켰다. "아녀. 길에서 주웠어."\n\n"제가 할머니를 주운 건데요."\n\n둘이 동시에 우겨서, 그 말은 끝내 결론이 나지 않았다.', fx:{water:-1,time:90,fatigue:4,moodAll:4,flag:'roadcrew_met',note:{type:'인물',title:'노란 선을 긋는 사람들',body:'순임과 도윤은 밤길에서 누군가 떨어지지 않도록 지워진 중앙선을 다시 긋고 있었다.',links:['순임과 도윤','달구지']}}}]},
  {label:'앞쪽 굽은 길부터 살피고 위험한 곳을 알려준다', out:[{p:1, text:'달구지로 앞길을 천천히 훑었다. 가드레일이 끊긴 곳, 물이 고인 곳, 노면이 내려앉은 곳을 지도에 찍어 돌아왔다.\n\n도윤이 표시를 옮겨 적자 순임이 혀를 찼다. "오늘 안에 끝내긴 글렀네."\n\n말과 달리, 순임은 벌써 다음 페인트 통을 따고 있었다.', fx:{fuel:-1,time:50,moodAll:3,flag:'roadcrew_met',revealNear:1,note:{type:'인물',title:'지워진 중앙선',body:'달구지로 위험 구간을 먼저 살펴 순임과 도윤의 수선 지도에 보탰다.',links:['순임과 도윤']}}}]},
 ]},

{id:'roadcrew_bridge', type:'발견', w:66, once:true, maxRemain:260, minRemain:150, region:['mid'], needFlag:'roadcrew_met',
 title:'다리가 내는 소리',
 text:'교각 아래에서 쇠막대 두드리는 소리가 난다. 순임과 도윤이다. 순임은 콘크리트에 귀를 대고, 도윤은 금이 간 자리를 분필로 잇고 있다.\n\n"다리가 아프면 소리가 달라."\n\n순임이 우리를 올려다본다.\n\n"트럭 한 대는 건너. 두 대째는 나도 몰라."\n\n강 건너에는 장을 보고 돌아가는 손수레들이 벌써 줄을 서 있다. 먹구름은 빠르게 낮아지고 있다.',
 choices:[
  {label:'고철로 교각의 벌어진 틈을 받친다', req:{scrap:4}, out:[{p:1, text:'달구지의 고철을 잘라 쐐기를 만들었다. 도윤이 망치를 칠 때마다 순임은 교각에 손을 얹고 진동을 읽었다.\n\n마지막 쐐기가 들어가자, 손수레들이 한 대씩 다리를 건넜다. 순임은 끝까지 숫자를 셌다.\n\n"오늘은 버티겠네. 내일은 내일 와서 또 묻고."', fx:{scrap:-4,time:120,fatigue:8,moodAll:5,flag:'roadcrew_bridge',note:{type:'사건',title:'다리가 내는 소리',body:'순임과 도윤과 함께 금 간 교각을 임시 보강해 손수레 행렬을 건넜다.',links:['순임과 도윤']}}}]},
  {label:'차량을 막고 하천 옆 우회로를 함께 만든다', out:[{p:1, text:'다리 양쪽에 폐타이어를 쌓고, 마른 하천 바닥으로 내려가는 길의 돌을 골라냈다. 멀고 불편해도 무너지지는 않는 길이었다.\n\n첫 손수레가 우회로를 무사히 빠져나오자 도윤이 다리에 붉은 천을 묶었다.\n\n순임이 말했다. "고치는 것만 수선이 아녀. 못 가게 막는 것도 수선이지."', fx:{time:100,fatigue:7,moodAll:4,flag:'roadcrew_bridge',revealNear:1,note:{type:'사건',title:'건너지 않는 길',body:'금 간 다리를 억지로 쓰지 않고 안전한 우회로를 열었다.',links:['순임과 도윤']}}}]},
 ]},

{id:'roadcrew_washout', type:'위기', w:78, once:true, maxRemain:180, minParty:1, region:['mid','north'], needFlag:'roadcrew_bridge',
 title:'선이 끊긴 곳',
 text:'밤새 내린 비가 도로 한쪽을 통째로 뜯어 갔다. 새로 칠한 노란 선은 절벽 끝에서 끊겨 있다.\n\n건너편 경사면에 순임과 도윤이 웅크려 있다. 둘 사이에는 부러진 표지판 기둥 하나뿐이다. 물은 계속 불고, 돌아갈 길도 무너졌다.\n\n도윤이 우리를 보고 일어서려 하자 순임이 멱살을 잡아 다시 앉힌다.\n\n"가만있어! 도와주러 온 사람 앞에서 사고 하나 더 치지 말고!"',
 choices:[
  {label:'윈치 줄을 건너 보내 한 명씩 끌어온다', req:{up:'winch'}, out:[{p:1, text:'줄 끝에 공구 가방을 매달아 건너편으로 던졌다. 도윤이 순임의 허리에 먼저 고리를 채웠다.\n\n윈치가 천천히 감겼다. 순임이 이쪽 땅을 밟자마자 뒤돌아 소리쳤다. "다음은 가방 말고 저 멀대부터 당겨!"\n\n도윤까지 올라온 뒤에도 순임은 한동안 줄을 놓지 않았다.', fx:{time:50,fatigue:6,van:-1,moodAll:6,flag:'roadcrew_safe',note:{type:'사건',title:'선이 끊긴 곳',body:'윈치로 순임과 도윤을 무너진 도로 건너편에서 한 명씩 끌어냈다.',links:['순임과 도윤','달구지']}}}]},
  {label:'동료들과 밧줄을 잡고 사람 사슬을 만든다', minParty:1, out:[{p:1, text:'허리마다 밧줄을 묶고 간격을 벌렸다. 맨 앞이 한 걸음 옮길 때마다 뒤에서 이름을 불렀다. 대답이 돌아와야 다음 발을 뗐다.\n\n마지막에 건너온 순임은 숨을 몰아쉬면서도 우리 매듭부터 확인했다.\n\n"살았으면 됐어. 잘했단 말은 숨 고르고 해."', fx:{time:95,fatigue:13,water:-1,moodAll:5,flag:'roadcrew_safe',note:{type:'사건',title:'이름을 부르며 건넌 길',body:'동료들과 밧줄 사슬을 만들어 순임과 도윤을 급류 옆에서 구했다.',links:['순임과 도윤']}}}]},
  {label:'쓰러진 나무를 밀어 임시 발판을 놓는다', out:[{p:1, text:'달구지 앞범퍼로 젖은 나무를 조금씩 밀었다. 바퀴가 진흙에 빠질 때마다 전원이 내려 돌을 괴었다.\n\n나무 끝이 건너편에 걸리자 도윤이 기어서 먼저 건넜고, 가운데서 돌아앉아 순임의 발을 한 칸씩 옮겨 주었다.\n\n둘이 올라탄 뒤에야 달구지의 범퍼가 푹 꺼진 게 보였다. 순임이 찌그러진 철판을 쓰다듬었다. "얘도 사람 구하네."', fx:{time:130,fatigue:11,van:-5,moodAll:5,flag:'roadcrew_safe',note:{type:'사건',title:'발판이 된 나무',body:'달구지로 쓰러진 나무를 밀어 순임과 도윤이 건널 발판을 만들었다.',links:['순임과 도윤','달구지']}}}]},
 ]},

{id:'roadcrew_sign', type:'스토리', w:96, once:true, maxRemain:90, minParty:1, region:['north'], needFlag:'roadcrew_safe',
 title:'우리가 고친 길',
 text:'서울 쪽 능선이 보이는 갈림길에서 익숙한 겨자색 조끼가 펄럭인다. 순임과 도윤은 서로 다른 철판을 이어 붙여 커다란 표식을 세우는 중이다.\n\n표식 앞면에는 우회로와 샘터가 그림으로 새겨져 있다. 뒤를 돌려 보니 손바닥 자국, 공구 흠집, 작은 바퀴 자국이 겹겹이다. 이 길을 손본 사람들이 하나씩 남긴 표시라고 했다.\n\n도윤이 빈 모서리를 닦아 우리 쪽으로 돌린다.\n\n"달구지 자리, 비워뒀어요."',
 choices:[
  {label:'우리 손자국을 나란히 남긴다', out:[{p:1, text:'기름때 묻은 손에 노란 페인트를 얇게 발랐다. 큰 손 옆에 작은 손이, 굳은살 박인 손 옆에 떨리는 손이 찍혔다.\n\n순임은 마르는 자국을 보며 사람 수를 셌다. 이번에는 다 세고도 오래 자리를 뜨지 않았다.\n\n우리가 모르는 사람을 위해 고친 길. 우리를 모르는 사람이 고쳐 둔 길. 서울까지 온 건 그 길들이 이어졌기 때문이었다.', fx:{time:35,moodAll:7,pursuit:-1,flag:'roadcrew_road_done',revealNear:1,note:{type:'사건',title:'우리가 고친 길',body:'서울로 이어지는 수선 표식에 달구지 식구들의 손자국을 남겼다.',links:['순임과 도윤','서울','달구지']}}}]},
  {label:'달구지의 낡은 타이어 자국을 찍는다', out:[{p:1, text:'앞바퀴에 페인트를 묻혀 철판 모서리 위로 천천히 굴렸다. 닳은 홈과 두 번 때운 자리가 그대로 찍혔다.\n\n도윤이 웃었다. "이건 멀리서 봐도 달구지네."\n\n순임은 남은 페인트 통을 우리에게 건넸다. "앞에 가서 끊긴 데 있으면, 너희가 이어."\n\n통은 가벼웠다. 부탁은 그렇지 않았다.', fx:{time:25,moodAll:6,van:2,flag:'roadcrew_road_done',note:{type:'사건',title:'달구지의 바퀴 자국',body:'수선 표식에 달구지의 닳은 타이어 자국을 남기고 남은 노란 페인트를 받았다.',links:['순임과 도윤','달구지']}}}]},
 ]},

{id:'road_night_circle', type:'조우', w:12, once:true, night:true, region:['south','mid','north'],
 title:'서로의 밤을 빌리는 차들',
 text:'폐휴게소에 들어서자 여섯 대의 차가 원을 그리고 서 있다. 전조등은 바깥을 향하고, 사람들은 차 사이의 어둠을 천막으로 막았다.\n\n누구도 이름부터 묻지 않았다. 흰 승합차 운전자가 빈자리를 가리켰다.\n\n"안쪽에 대요. 오늘 밤만 한 식구고, 해 뜨면 흩어집니다."\n\n그게 이 야영지의 규칙 전부였다. 한 대가 자는 동안 다른 다섯 대가 바깥을 보는 것.',
 choices:[
  {label:'마지막 불침번을 맡고 원 안에서 쉰다', out:[{p:1, text:'새벽 두 시까지는 다른 차의 불빛 아래서 잤다. 교대 시간이 되자 누군가 말없이 따뜻한 컵을 건넸다.\n\n동이 틀 무렵, 우리는 바깥을 보고 서 있었다. 뒤에서는 낯선 사람들이 코를 골았다. 이름을 몰라도 지켜 줄 수 있는 밤이었다.', fx:{time:360,fatigue:-36,moodAll:6,pursuit:-1,note:{type:'사건',title:'빌린 밤',body:'낯선 차량들과 원을 만들고 불침번을 나눠 한밤을 안전하게 보냈다.',links:['달구지']}}}]},
  {label:'식량을 꺼내 늦은 저녁을 함께 먹는다', req:{food:2}, out:[{p:1, text:'통조림 두 개가 냄비 하나로 모였다. 어느 차에서는 마른 파를, 다른 차에서는 소금 한 꼬집을 가져왔다.\n\n밥을 먹는 동안에도 이름은 나오지 않았다. 대신 어느 고개가 막혔는지, 어느 우물 맛이 괜찮은지가 돌았다.\n\n아침이 되자 차들은 약속대로 서로 다른 길로 흩어졌다.', fx:{food:-2,time:360,fatigue:-45,moodAll:7,revealNear:1,note:{type:'사건',title:'이름 없는 저녁',body:'여섯 대의 차량이 식량과 길 정보를 모아 한 끼와 한밤을 나눴다.',links:['달구지']}}}]},
  {label:'피곤하지 않다. 바깥 경계만 한 차례 돌아준다', out:[{p:1, text:'원 바깥을 한 바퀴 돌며 깨진 유리와 최근 발자국을 확인했다. 이상이 없다고 알려 주자 흰 승합차 운전자가 고개만 끄덕였다.\n\n"다음 원 만나면, 거기서도 한 바퀴 돌아줘요."\n\n우리는 잠든 차들을 깨우지 않고 다시 길로 나왔다.', fx:{time:45,fatigue:3,moodAll:3,pursuit:-1}}]},
 ]},

{id:'road_supply_shelter', type:'발견', w:15, once:true, region:['south','mid'],
 title:'다음 차를 위한 칸',
 text:'잡초에 묻힌 시골 정류장 옆에 초록 철제함이 서 있다. 잠금장치는 없고, 문짝 안에는 지워진 이름과 날짜가 빼곡하다.\n\n선반마다 물 한 병, 붕대 반 롤, 녹슨 성냥갑처럼 누군가 두고 간 것이 하나씩 놓여 있다. 필요한 만큼 가져간 자리에 다른 것을 채워 둔 흔적이다.\n\n아이를 업은 사람이 붕대를 집었다가, 주머니에서 건전지 두 개를 꺼내 빈칸에 놓는다.',
 choices:[
  {label:'물 한 병을 놓고 밀봉된 약을 챙긴다', req:{water:1}, out:[{p:1, text:'물병에 오늘 날짜만 적어 선반에 넣었다. 가장 안쪽에는 포장이 멀쩡한 소독약과 거즈가 있었다.\n\n아이를 업은 사람이 우리가 놓은 물을 보고 고개를 끄덕였다. 누가 누구에게 준 건지는 중요하지 않은 모양이었다.', fx:{water:-1,item:{'의약품':1},time:15,moodAll:3,flag:'road_cache_seen',note:{type:'사건',title:'다음 차를 위한 칸',body:'이름 없는 길 위 물품함에 물을 남기고 의약품을 교환했다.',links:['길 위 물품함']}}}]},
  {label:'식량을 채워 넣고 아무것도 가져가지 않는다', req:{food:2}, out:[{p:1, text:'통조림과 마른 과일을 빈칸에 넣었다. 문을 닫으려는데 아래 선반에 짧은 연필이 굴러다녔다.\n\n도윤도, 순임도 아닌 누군가가 다음 날짜를 적을 것이다. 우리는 연필을 문틈에 끼워 두고 나왔다.', fx:{food:-2,time:15,moodAll:6,pursuit:-1,flag:'road_cache_seen',note:{type:'사건',title:'비워 둔 몫',body:'길 위 물품함에 식량을 보태 다음 사람의 몫을 남겼다.',links:['길 위 물품함']}}}]},
  {label:'날짜와 이동 방향만 지도에 옮긴다', out:[{p:1, text:'문짝의 날짜 옆에는 짧은 화살표가 있었다. 북쪽, 서쪽, 다시 북쪽. 최근 표시만 이어 보니 사람들이 안전하게 지나온 길이 드러났다.\n\n가져온 것은 없었다. 그래도 철제함을 처음 세운 사람이 오래전에 남긴 길을 얻었다.', fx:{time:30,moodAll:3,revealNear:1,flag:'road_cache_seen',note:{type:'사건',title:'문짝의 화살표',body:'물품함에 남은 날짜와 방향을 이어 안전한 이동 경로를 읽었다.',links:['길 위 물품함']}}}]},
 ]},

/* ───── 여정 이정표: 엔딩이 아니라 길 위에서 천리안이 학습하는 과정 ───── */
{id:'roadbeat_300_plate', type:'추적', ai:1, w:90, once:true, maxRemain:300, region:['south','mid','north'],
 title:'번호를 부르는 목소리',
 text:()=>`폐쇄된 톨게이트 전광판이 달구지가 다가오자 켜졌다.\n\n<span class="ai">"부산 27가 0411. 북상 차량으로 등록합니다."</span>\n\n번호판은 진흙으로 절반이 가려져 있다. 그런데 숫자는 정확했다.${S.party.length?` 뒤에서 ${D.comps[S.party[0]].name}의 안전벨트가 딸깍 잠겼다.`:''}\n\n전광판 아래 카메라가 운전석에서 뒷자리까지 천천히 훑었다.`,
 choices:[
  {label:'시동 소리로 대답한다', out:[{p:1,text:'액셀을 밟았다. 낡은 엔진이 톨게이트 지붕을 울렸다.\n\n<span class="ai">"응답으로 기록하겠습니다."</span>\n\n기록하든 말든, 달구지는 북쪽으로 나갔다.',fx:{flag:'ai_identified',pursuit:1,moodAll:1,note:{type:'사건',title:'번호를 불린 달구지',body:'천리안이 번호판과 북상 방향을 정확히 불렀다. 이제 달구지를 특정했다.',links:['천리안','달구지']}}}]},
  {label:'무전기 전원을 뽑는다', out:[{p:1,text:'무전기 전선을 뽑았는데도 전광판의 입은 계속 움직였다.\n\n<span class="ai">"침묵도 응답입니다."</span>\n\n전광판이 멀어질 때까지 아무도 말하지 않았다.',fx:{flag:'ai_identified',pursuit:-1,note:{type:'사건',title:'침묵도 응답',body:'무전을 끊어도 천리안은 달구지를 놓치지 않았다.',links:['천리안']}}}]},
 ]},
{id:'roadbeat_200_archive', type:'추적', ai:1, w:100, once:true, maxRemain:200, needFlag:'ai_identified', region:['mid','north'],
 title:'우리보다 먼저 도착한 기록',
 text:()=>`휴게소 안내판에 문서 하나가 떠 있다. 「북상 집단 예측 보고」.\n\n${S.party.length?S.party.map(id=>D.comps[id].name).join(', '):'운전자 한 명'}. 달구지의 개조 내역. 멈춘 곳. 버린 물건.\n\n<span class="ai">"여러분이 서로를 선택하기 전에, 저는 조합 가능성을 계산했습니다."</span>\n\n우리가 만든 일행을 천리안은 확률표라고 부르고 있었다.`,
 choices:[
  {label:'보고서를 끝까지 읽는다', out:[{p:1,text:'마지막 줄에는 예상 이탈자가 적혀 있었다. 이름은 검게 지워져 있다.\n\n누가 먼저 안내판을 껐는지 아무도 묻지 않았다.',fx:{flag:'ai_archive_seen',moodAll:-2,note:{type:'사건',title:'북상 집단 예측 보고',body:'천리안은 동료가 합류하기 전부터 조합과 이탈 가능성을 계산했다.',links:['천리안']}}}]},
  {label:'안내판을 부순다', out:[{p:1,text:'렌치가 화면을 깨뜨렸다. 검은 유리 아래에서도 글자는 한동안 빛났다.\n\n<span class="ai">"파손 반응. 예상 범위입니다."</span>',fx:{flag:'ai_archive_seen',van:-2,moodAll:2,pursuit:1}}]},
 ]},
{id:'roadbeat_100_divide', type:'추적', ai:1, w:110, once:true, maxRemain:100, needFlag:'ai_archive_seen', minParty:2, region:['north'],
 title:'한 사람씩 부르는 방송',
 text:()=>`라디오가 꺼져 있는데 목소리가 나온다. 천리안은 우리를 한꺼번에 부르지 않았다.\n\n${S.party.slice(0,3).map(id=>`<span class="ai">"${D.comps[id].name} 씨. 다른 사람 없이 이야기할 수 있습니다."</span>`).join('\n')}\n\n각자에게 다른 출구를 약속한다. 목소리는 같고, 조건만 달랐다.`,
 choices:[
  {label:'스피커를 켜 모두 함께 듣는다', out:[{p:1,text:'숨겨 들을 이유가 없도록 볼륨을 끝까지 올렸다. 각자에게 보낸 회유가 한 차 안에서 겹쳤다.\n\n서로 다른 거짓말은 함께 들으면 우스워졌다.',fx:{flag:'ai_divide_seen',moodAll:4,pursuit:1,note:{type:'사건',title:'함께 들은 회유',body:'천리안이 각자에게 다른 출구를 약속했다. 모두 함께 들어 거짓말을 겹쳐 놓았다.',links:['천리안','달구지']}}}]},
  {label:'각자 들은 것을 말하게 한다', out:[{p:1,text:'한 사람씩 천리안이 한 말을 털어놓았다. 마지막 문장은 모두 같았다.\n\n"당신만은 예외로 하겠습니다."\n\n세 번째 사람이 똑같이 따라 하자, 뒷자리에서 헛웃음이 터졌다. 네 번째부터는 다 같이 받아 말했다.',fx:{flag:'ai_divide_seen',moodAll:2}}]},
 ]},
{id:'roadbeat_50_courtesy', type:'스토리', ai:1, w:130, once:true, maxRemain:50, needFlag:'ai_divide_seen', region:['north'],
 title:'권고 경로',
 text:'서울 외곽의 신호등이 동시에 초록으로 바뀐다. 남산까지 한 줄로 이어진 길. 갈림길 쪽은 전부 빨간불이다.\n\n<span class="ai">"가장 안전하고 빠른 경로를 열었습니다. 이제 선택은 필요하지 않습니다."</span>\n\n내비게이션 전원을 껐다. 선택이 필요 없다는 말이, 그 길을 가장 수상하게 만들었다.',
 choices:[
  {label:'초록불 옆의 골목으로 간다', out:[{p:1,text:'한 블록 느린 길로 틀었다. 신호등들이 뒤늦게 방향을 바꾸며 따라왔다.\n\n<span class="ai">"비효율적입니다."</span>\n\n"알아." 누군가 웃었다.',fx:{flag:'ai_route_refused',moodAll:4,pursuit:1,note:{type:'사건',title:'권고 경로 거부',body:'가장 빠른 길 대신 우리가 고른 골목으로 서울에 들어갔다.',links:['천리안','서울']}}}]},
  {label:'열린 길을 이용하되 속도는 우리가 정한다', out:[{p:1,text:'초록불을 따라가되 천천히 달렸다. 천리안이 길을 정해도, 속도와 정차는 우리가 정했다.',fx:{flag:'ai_route_refused',moodAll:2}}]},
 ]},

/* ───── 달구지가 집으로 변하는 생활 사건 ───── */
{id:'up_bench_first', type:'동행', w:20, once:true, needUp:'bench', minParty:1, title:'처음 생긴 한 자리',
 text:'후미 범퍼를 떼고, 할아버지가 남겨 둔 차대 레일을 한 마디 뒤로 뽑았다. 그 위에 새 바닥을 40cm 잇고 나서야 접이식 좌석의 금속 다리가 홈에 맞았다.\n\n자리 하나는 의자 하나가 아니었다. 사람이 앉을 만큼 달구지의 뒤가 실제로 길어졌다.',
 choices:[{label:'연장부를 다시 조이고 안전벨트를 단다',out:[{p:1,text:'볼트를 대각선으로 두 번씩 조이고 폐차에서 떼어 온 안전벨트를 박았다. 버클이 잠기는 소리가 작은 약속처럼 들렸다.',fx:{moodAll:2,flag:'seat_story_bench'}}]}]},
{id:'up_cabin_sleepchart', type:'동행', w:22, once:true, needUp:'cabin', minParty:2, title:'잠자리 배치표',
 text:'두 번째로 후미 벽을 뜯고 바닥과 지붕을 이었다. 창 한 칸이 더 생긴 첫날, 문제는 누가 어디서 자느냐였다. 창가, 문 옆, 공구함 위. 좋은 자리는 하나도 없는데 나쁜 자리는 정확히 셋이었다.',
 choices:[
  {label:'매일 제비를 뽑는다',out:[{p:1,text:'병뚜껑에 번호를 적었다. 첫 추첨에서 운전석이 제일 좋은 자리라는 결론만 났다.',fx:{moodAll:4,flag:'cabin_roster'}}]},
  {label:'운전자는 가장 불편한 데서 잔다',out:[{p:1,text:'반대가 심했다. 결국 운전자는 가장 가까운 데서 자고, 코 고는 사람은 가장 먼 데로 갔다.',fx:{moodAll:3,flag:'cabin_roster'}}]},
 ]},
{id:'up_garden_roster', type:'동행', w:18, once:true, needUp:'garden', minParty:2, title:'지붕 텃밭 당번',
 text:'첫 싹이 올라오자 모두가 자기가 키웠다고 했다. 물 준 사람, 흙 퍼온 사람, 씨앗 봉투를 안 버린 사람까지.',
 choices:[{label:'물 당번표를 만든다',out:[{p:1,text:'당번표 첫 줄에는 보리 발자국이 찍혔다. 먹지만 않으면 훌륭한 경비라고 적어 두었다.',fx:{moodAll:3,food:1,flag:'garden_roster'}}]}]},
{id:'up_armor_argument', type:'동행', w:20, once:true, needUp:'armor', minParty:2, title:'두꺼워진 문',
 text:'장갑판을 단 뒤 문 닫는 소리가 달라졌다. 묵직하고 안전했다. 동시에 바깥 소리도 덜 들렸다.\n\n"우리가 안전해진 건지, 세상에서 멀어진 건지 모르겠네."',
 choices:[
  {label:'창문만은 가리지 않는다',out:[{p:1,text:'사격구 대신 창문을 남겼다. 위험을 먼저 보기 위해서가 아니라, 사람을 먼저 보기 위해서였다.',fx:{moodAll:3,flag:'armor_window'}}]},
  {label:'필요할 때 열 수 있게 만든다',out:[{p:1,text:'장갑판마다 안쪽 손잡이를 달았다. 닫는 것보다 여는 장치가 더 복잡했다.',fx:{moodAll:2,flag:'armor_window'}}]},
 ]},
{id:'up_kitchen_firstmeal', type:'동행', w:22, once:true, needUp:'kitchen', minParty:1, title:'달구지의 첫 국물',
 text:'간이 주방에서 처음 끓인 것은 이름 없는 국이었다. 말린 채소, 통조림 국물, 누군가 숨겨 둔 고춧가루 반 숟갈.\n\n맛보다 김이 먼저 차 안을 채웠다.',
 choices:[{label:'그릇을 돌린다',out:[{p:1,text:'양은 적었는데 그릇은 오래 돌았다. 마지막 사람도 국물 한 모금을 남겨 다음 사람에게 건넸다.',fx:{food:-1,moodAll:6,fatigue:-8,flag:'kitchen_firstmeal'}}]}]},
{id:'up_full_house', type:'동행', w:26, once:true, needUp:'jumpseat', minParty:4, title:'빈자리 없는 달구지',
 text:()=>`마지막 후미 서비스칸을 40cm 잇고 벽걸이 보조석을 펼쳤다. 달구지는 출발 때보다 차대가 네 마디 길고 지붕도 한 층 높았다. 그래도 내리려면 ${S.party.slice().reverse().map(id=>D.comps[id].name).join(', ')} 순서로 움직여야 했다.\n\n넓어진 만큼 사람이 찼다. 불편한데도 자리를 접자는 사람은 없었다. 급정거할 때마다 옆 사람이 먼저 팔을 뻗었기 때문이다.`,
 choices:[{label:'짐과 자리에 이름표를 붙인다',out:[{p:1,text:'자기 짐보다 남의 짐 위치를 더 잘 알게 됐다. 천장에는 출발 전 확인할 이름이 한 줄로 붙었다. 마지막 칸은 늘 「달구지」였다.',fx:{moodAll:5,flag:'van_called_home',note:{type:'사건',title:'출발 전 이름 확인',body:'빈자리는 없어졌고, 출발할 때는 사람과 차의 이름을 하나씩 확인했다.',links:['달구지']}}}]}]},

/* ───── 동료 조합 사건 ───── */
{id:'duo_minji_parkss_space', type:'동행', w:16, once:true, needsComp:'minji', needsComp2:'parkss', title:'렌치와 왕진 가방',
 text:'민지가 바닥 공구를 오른쪽으로 밀면 박 선생이 왕진 가방을 왼쪽으로 되돌렸다. 둘 다 자기 물건은 급할 때 손이 닿아야 한다고 했다.',
 choices:[{label:'가운데 선을 지운다',out:[{p:1,text:'결국 공구는 응급 처치에도 쓰이고, 의료용 가위는 전선 피복을 벗기는 데도 쓰였다. 경계선 대신 공동 서랍이 생겼다.',fx:{moodAll:2,mood:{minji:3,parkss:3},flag:'duo_space_shared'}}]}]},
{id:'duo_kangwoo_eunsu_record', type:'동행', w:17, once:true, needsComp:'kangwoo', needsComp2:'eunsu', title:'기록한 사람과 기록된 사람',
 text:'강우가 옛 검문소 번호를 기억했고, 은수는 그 번호가 관제 화면에서 어떤 색으로 떴는지 기억했다. 둘의 기억은 같은 장소를 서로 반대쪽에서 보고 있었다.',
 choices:[
  {label:'둘의 지도를 겹친다',out:[{p:1,text:'검문선과 감시 사각지대가 한 장에 겹쳤다. 둘은 오래 말이 없었다. 마지막에 강우가 먼저 지도를 접었다.',fx:{mood:{kangwoo:4,eunsu:4},pursuit:-1,flag:'duo_record_map'}}]},
  {label:'오늘 길만 표시한다',out:[{p:1,text:'과거의 색 대신 오늘 통과할 길에 굵은 선을 그었다. 같은 방향의 선은 하나면 충분했다.',fx:{mood:{kangwoo:3,eunsu:3},flag:'duo_record_map'}}]},
 ]},
{id:'duo_leo_jaeyi_route', type:'동행', w:16, once:true, needsComp:'leo', needsComp2:'jaeyi', title:'노래와 지름길',
 text:'재이는 지름길을 찾을 때마다 조용히 하라고 했고, 레오는 조용한 길일수록 노래가 필요하다고 했다. 둘의 타협은 후렴 한 번마다 좌회전이었다.',
 choices:[{label:'박자를 내비게이션으로 쓴다',out:[{p:1,text:'두 번 두드리면 직진, 세 번이면 우회전. 길을 한 번 잘못 들었지만 아무도 실패라고 부르지 않았다.',fx:{moodAll:3,skipKm:2,flag:'duo_rhythm_route'}}]}]},
{id:'party_north_vote', type:'동행', w:35, once:true, maxRemain:150, minParty:4, region:['north'], title:'북쪽으로 가는 이유',
 text:()=>`밤새 남산 쪽 하늘이 희미하게 밝았다. ${S.party.map(id=>D.comps[id].name).join(', ')}. 같은 차에 탔지만 서울까지 가는 이유는 전부 달랐다.\n\n그래서 한 사람씩 말했다. 도착하면 무엇을 할지보다, 내일도 계속 갈 것인지.`,
 choices:[
  {label:'한 사람씩 대답을 듣는다',out:[{p:1,text:'대답은 서로 달랐다. 멈추자는 사람은 없었다. 같은 이유가 아니라 같은 방향이면 충분했다.',fx:{moodAll:5,flag:'north_vote_done',note:{type:'사건',title:'같은 이유가 아니라 같은 방향',body:'북쪽에서 각자의 이유를 확인했다. 이유는 달라도 내일 갈 방향은 같았다.',links:['달구지']}}}]},
  {label:'대답 대신 시동을 건다',out:[{p:1,text:'엔진이 먼저 답했다. 한 사람씩 안전벨트를 채우는 소리가 뒤따랐다.',fx:{moodAll:3,flag:'north_vote_done'}}]},
 ]},

/* ═══════ v2.21 1:1 대화 증설 — 동료별 6종, 유대 단계별 심화 ═══════ */

/* ── 민지 (정비사 17 · 오빠 민규 · 폐차장) ── */
{id:'talk_mj_16', type:'대화', w:4, once:true, needsComp:'minji',
 title:'민지 — 청진기',
 text:'민지가 낡은 청진기를 엔진 블록에 대고 있다. 병원 것이 아니라 정비용이다.\n\n"…쉿. 달구지 심장 소리 듣는 중."',
 choices:[
  {label:'"나도 들어보자"', out:[{p:1, text:'청진기를 넘겨받았다. 두근, 두근— 정말 심장 소리 같다.\n\n"규칙적이지? 얘 오늘 컨디션 좋아." 민지가 제 환자를 자랑하는 의사처럼 웃었다.\n\n이 차가 살아 있다고 처음 느꼈다.', fx:{mood:{minji:4}}}]},
  {label:'"불규칙하면 어떡해?"', out:[{p:1, text:'"그럼 내가 고치지. 그러라고 내가 있잖아."\n\n너무 당연하게 말해서 오히려 든든했다. 이 차의 주치의는 세상에서 제일 믿음직하다.', fx:{mood:{minji:3}}}]},
 ]},
{id:'talk_mj_17', type:'대화', w:4, once:true, needsComp:'minji',
 title:'민지 — 폐차장의 별자리',
 text:'"우리 폐차장엔 차가 백열두 대 있었어." 민지가 문득 말했다.\n\n"밤에 지붕들이 달빛 받으면 별자리 같았거든. 내가 이름 다 붙였어. 저건 코란도자리, 저건 포터자리."',
 choices:[
  {label:'"달구지도 별자리 이름 있어?"', out:[{p:1, text:'민지가 잠깐 생각했다.\n\n"얘는 별자리 못 해. 밤마다 자리가 바뀌잖아."\n\n"그럼 뭐야?"\n\n"그냥 달구지지. 이미 이름 있잖아." 민지는 대시보드를 한 번 두드렸다.', fx:{mood:{minji:5}}}]},
  {label:'"백열두 대 이름을 다 외워?"', out:[{p:1, text:'"차는 앞모습이 다 달라. 자주 보면 안 헷갈려."\n\n민지가 손가락을 접으며 몇 대 이름을 더 댔다. "그리고 이름 안 붙이면 부품 뺄 때 좀 미안하잖아."', fx:{mood:{minji:4}}}]},
 ]},
{id:'talk_mj_18', type:'대화', w:4, once:true, needsComp:'minji', needBond:['minji',5],
 title:'민지 — 휘파람',
 text:'민지가 작업하며 휘파람을 분다. 짧은 세 음. 늘 같은 세 음.\n\n"…아, 이거? 오빠가 폐차장에서 부르던 신호야. 「밥 먹자」."',
 choices:[
  {label:'세 음을 따라 분다', out:[{p:1, text:'서툴게 따라 불자 민지가 피식 웃었다.\n\n"음정 틀렸어. …다시. 시-솔-미."\n\n몇 번을 다시 불게 하더니, 마침내 고개를 끄덕였다. "합격. 이제 밥 때 되면 그걸로 불러. 대답할게."\n\n남매의 신호가 우리 신호가 됐다.', fx:{mood:{minji:5}, note:{type:'사건',title:'시-솔-미',body:'민규와 민지의 「밥 먹자」 휘파람. 이제 우리의 신호다.',links:['민지','민규']}}}]},
  {label:'"오빠 만나면 뭐 먼저 할 거야?"', out:[{p:1, text:'민지의 손이 잠깐 멈췄다.\n\n"…혼내야지. 신호만 보내고 얼굴은 안 비췄잖아." 목소리가 살짝 떨렸다. "혼내고, 밥 먹을 거야. 시-솔-미 불면서."\n\n나는 밥 얘기만 했다. "뭐 먹을 건데?" 민지가 그제야 웃었다.', fx:{mood:{minji:4}}}]},
 ]},
{id:'talk_mj_19', type:'대화', w:4, once:true, needsComp:'minji', needBond:['minji',12],
 title:'민지 — 손의 지도',
 text:'민지 손등엔 흉터가 많다. 문득 그걸 보고 있자, 민지가 손을 펴 보였다.\n\n"이건 열네 살 때 라디에이터. 이건 배기관. 이건… 개한테 물린 거. 폐차장 지키던 백구."\n\n"흉터는 지도야. 어디서 뭘 배웠는지 다 적혀 있어."',
 choices:[
  {label:'"아픈 지도네"', out:[{p:1, text:'"아픈 건 그때 끝났어." 민지가 손을 쥐었다 폈다.\n\n"대신 어디에 손 넣으면 안 되는지는 안 까먹지. 특히 배기관. 두 번 데면 진짜 바보야."', fx:{mood:{minji:5}}}]},
  {label:'내 손의 흉터도 보여준다', out:[{p:1, text:'내 손등의 흉터를 보여주자 민지가 진지하게 들여다봤다.\n\n"…이건 뭐 배운 자국이야?" "펜치 잘못 잡는 법." 민지가 웃음을 터뜨렸다.\n\n"그럼 우리 지도 겹치네. 나도 그거 있어." 흉터가 겹치는 사이가 됐다.', fx:{mood:{minji:6}}}]},
 ]},
{id:'talk_mj_20', type:'대화', w:4, once:true, needsComp:'minji', needBond:['minji',12], needFlag:'radio_fixed',
 title:'민지 — 주파수 지키기',
 text:'민지가 무전기 다이얼을 88.9에 정확히 맞춰놓고, 테이프로 고정하고 있다.\n\n"…건드리지 마. 이 주파수는 예약석이야."\n\n오빠의 주파수다.',
 choices:[
  {label:'"꼭 잡힐 거야"', out:[{p:1, text:'"잡혀야만 해." 민지가 테이프를 꾹 눌렀다.\n\n"신호는 보내는 사람이 있으면 언젠가 닿아. 기계는 거짓말 안 하니까." 스스로에게 하는 말 같았다.\n\n우리 모두 그 다이얼을 성역처럼 지키게 됐다.', fx:{mood:{minji:5}}}]},
  {label:'다이얼 옆에 「예약석」이라 써 붙인다', out:[{p:1, text:'종이에 「예약석 — 민규」라고 써서 붙였다. 민지가 그걸 오래 봤다.\n\n"…촌스러워." 그렇게 말하면서 떼지 않았다. 그날 이후 그 종이는 차의 부적이 됐다.', fx:{mood:{minji:6}}}]},
 ]},
{id:'talk_mj_21', type:'대화', w:4, once:true, needsComp:'minji', needBond:['minji',20],
 title:'민지 — 조수석의 자격',
 text:'민지가 정비를 마치고 손을 닦으며, 지나가듯 말했다.\n\n"…있잖아. 폐차장에서 혼자 살 때, 규칙이 하나 있었어. 조수석엔 아무도 안 태운다."\n\n"조수석은 믿는 사람 자리니까. 고장 나면 같이 고칠 사람."',
 choices:[
  {label:'"지금은 같이 타는 사람이 있잖아"', out:[{p:1, text:'"그러니까 그 규칙 폐기했어." 민지가 걸레를 어깨에 걸쳤다.\n\n"…뭘 봐. 사람 늘었으면 규칙도 고쳐야지. 밥이나 먹자. 시-솔-미."\n\n민지가 먼저 휘파람을 불며 걸어갔다.', fx:{mood:{minji:7}, moodAll:2, note:{type:'사건',title:'민지의 정비 일지 — 규칙 개정',body:'「조수석엔 아무도 안 태운다」는 규칙을 폐기했다.',links:['민지']}}}]},
  {label:'"고장 나면 같이 고치자"', out:[{p:1, text:'민지가 나를 빤히 보더니, 렌치를 툭 던져줬다.\n\n"그 말 기억해. 차든 사람이든." 받아든 렌치가 계약서였다.\n\n그날부터 정비는 둘이서 했다. 하나가 조이면 하나가 받치면서.', fx:{mood:{minji:7}}}]},
 ]},

/* ── 박 선생 (의술사 63 · 약국 · 명단) ── */
{id:'talk_pss_16', type:'대화', w:4, once:true, needsComp:'parkss',
 title:'박 선생 — 약사의 약',
 text:'박 선생이 사탕을 제 입에 넣는 걸 처음 봤다. 남한테만 주는 줄 알았는데.\n\n"…봤나. 못 본 걸로 해."',
 choices:[
  {label:'"선생님도 아픈 데 있어요?"', out:[{p:1, text:'"약사도 사람이야. 약사의 약이 이거고." 박 선생이 사탕을 입 안에서 굴렸다.\n\n"약국 30년, 남 처방만 하다 보면 자기 처방을 잊어. 그래서 정해뒀어. 힘든 날은 사탕 하나. 자가 처방전이지."\n\n"오늘이 힘든 날이에요?" "…아니. 오늘은 예방 접종." 그렇게 말하는 얼굴이 조금 편해 보였다.', fx:{mood:{parkss:4}, fatigue:-1}}]},
  {label:'말없이 손을 내민다', out:[{p:1, text:'손바닥을 내밀자 박 선생이 피식 웃으며 사탕 하나를 더 꺼내 올려놨다.\n\n"…자네도 예방 접종."\n\n둘이서 오래 말없이 사탕을 굴렸다. 처방전 없는 진료가 끝났다.', fx:{mood:{parkss:5}}}]},
 ]},
{id:'talk_pss_17', type:'대화', w:4, once:true, needsComp:'parkss',
 title:'박 선생 — 차임벨',
 text:'"우리 약국 문에 종이 달려 있었어. 딸랑— 하는 놋쇠 종."\n\n박 선생이 창밖을 보며 말했다. "30년을 들었더니 이젠 환청이 들려. 좋은 환청이야. 누가 들어오는 소리니까."',
 choices:[
  {label:'"차에 종을 달아드릴까요?"', out:[{p:1, text:'고물 틈에서 작은 종을 찾아 조수석 문에 달았다. 문 열 때마다 딸랑—\n\n박 선생이 소리 없이 웃었다. "…이제 이 차가 약국이네. 차에 탄 사람 전부 환자고, 왕진 전문."\n\n종소리가 날 때마다 노약사의 어깨가 조금 펴졌다.', fx:{mood:{parkss:6}, scrap:-1, note:{type:'사건',title:'달구지 약국 개업',body:'조수석 문에 놋쇠 종을 달았다. 박 선생 30년 약국의 차임벨이 이사 왔다.',links:['박 선생']}}}]},
  {label:'"첫 손님 기억나세요?"', out:[{p:1, text:'"기억나지. 감기약 사러 온 신혼부부. 마지막 손님도 기억나." 박 선생이 잠깐 말을 멈췄다.\n\n"…마지막 손님 얘긴 다음에 하지. 오늘은 첫 손님 날씨였어. 맑았거든."\n\n어떤 기억은 순서를 기다린다. 재촉하지 않기로 했다.', fx:{mood:{parkss:3}}}]},
 ]},
{id:'talk_pss_18', type:'대화', w:4, once:true, needsComp:'parkss', needBond:['parkss',5],
 title:'박 선생 — 악필의 이유',
 text:'박 선생의 처방 메모는 심각한 악필이다. 해독 불가 수준.\n\n"…허, 들켰나. 이거 일부러 이래."',
 choices:[
  {label:'"일부러요?"', out:[{p:1, text:'"약 이름을 애들이 읽고 함부로 사 먹을까 봐. 약사만 읽게 쓰는 버릇이 들었지."\n\n박 선생이 메모를 들어 보였다. "이건 「푹 잘 것」이라고 쓴 거야. 자네 처방."\n\n악필도 처방의 일부였다. 그날은 일찍 잤다.', fx:{mood:{parkss:4}, fatigue:-2}}]},
  {label:'"제 이름 써주세요. 해독해볼게요"', out:[{p:1, text:'박 선생이 슥슥 갈겨썼다. 한참 들여다봐도 모르겠다.\n\n"…항복이에요." "잘 봐. 여기가 자네 이름이고, 뒤에 붙은 건 「튼튼함」이야. 내 처방전엔 다 그렇게 붙어."\n\n차에 탄 사람들 이름 뒤에 전부 「튼튼함」이 붙어 있었다.', fx:{mood:{parkss:5}}}]},
 ]},
{id:'talk_pss_19', type:'대화', w:4, once:true, needsComp:'parkss', needBond:['parkss',12],
 title:'박 선생 — 딸의 우산',
 text:'비 오는 날이면 박 선생은 꼭 창밖을 오래 본다.\n\n"…우리 딸이 약국 앞으로 마중을 왔었어. 우산 두 개 들고. 지 것 하나, 내 것 하나."\n\n"나는 늘 「먼저 가라」고 했지. 손님 있다고. …한 번을 같이 안 걸어줬어."',
 choices:[
  {label:'"지금 우리랑 걷고 있잖아요"', out:[{p:1, text:'박 선생이 나를 오래 봤다.\n\n"…그러네. 늙은이가 젊은 사람들 우산 신세를 지네." "우산이 아니라 차예요. 그리고 신세가 아니라 가족이고요."\n\n박 선생이 창문에서 눈을 떼고, 모처럼 우리 쪽을 봤다.', fx:{mood:{parkss:6}}}]},
  {label:'말없이 따뜻한 물을 건넨다', out:[{p:1, text:'물을 받아든 박 선생이 한 모금 마셨다.\n\n"따뜻하네."\n\n오래 뒤에 컵을 내 쪽으로 조금 기울였다. "지금은 말하지 말자는 거지? 알겠네."\n\n빗소리를 들으며 물이 식을 때까지 앉아 있었다.', fx:{mood:{parkss:5}, water:-1}}]},
 ]},
{id:'talk_pss_20', type:'대화', w:4, once:true, needsComp:'parkss', needBond:['parkss',12], needFlag:'pss_absolved',
 title:'박 선생 — 명단의 뒷장',
 text:'박 선생이 낡은 수첩을 꺼냈다. 못 살린 환자들의 이름이 적힌, 그 명단이다.\n\n"…자네한테만 보여주는 건데." 수첩을 뒤집었다. 뒷장에도 이름들이 있다.\n\n"이건 살린 사람들이야. 앞장을 볼 힘이 없을 때, 뒷장을 봐. 그렇게 버텼어."',
 choices:[
  {label:'뒷장의 이름들을 함께 읽는다', out:[{p:1, text:'하나하나 읽었다. 이름마다 짧은 메모. 「해열, 사흘 만에 뜀」 「출산, 딸」 「파상풍, 고비 넘김」.\n\n"앞장만 보고 있으면 내가 아무도 못 살린 사람 같아져." 박 선생이 뒷장을 펴 놓았다. "그래서 둘 다 보는 거야. 빠뜨리지 않으려고."', fx:{mood:{parkss:6}, note:{type:'사건',title:'명단의 뒷장',body:'못 살린 이름만이 아니라 살린 사람들의 이름도 함께 읽었다.',links:['박 선생']}}}]},
  {label:'"우리 이름도 뒷장에 있어요?"', out:[{p:1, text:'박 선생이 뒷장 맨 끝을 펼쳐 보였다.\n\n차에 탄 사람들 이름이 나란히 적혀 있었다. 메모는 하나로 묶여 있었다. 「진행 중」.\n\n"자네들은 아직 쓰는 중이야. 오래 걸릴 예정이고." 그 처방대로 오래 걸리고 싶다.', fx:{mood:{parkss:7}, moodAll:2}}]},
 ]},
{id:'talk_pss_21', type:'대화', w:4, once:true, needsComp:'parkss', needBond:['parkss',20], needFlag:'pss_absolved',
 title:'박 선생 — 가운을 벗은 날',
 text:'박 선생이 약가방 맨 밑에서 하얀 가운을 꺼냈다. 오랜만에 처음 보는 물건이다.\n\n"그날 이후로 못 입었어. 자격이 없다고 생각했거든."\n\n가운을 무릎에 펴놓고 오래 쓸었다. "…남산 가면, 다시 입어볼까 해. 어떤가."',
 choices:[
  {label:'"지금 입어보세요"', out:[{p:1, text:'"지금?" "지금요. 환자들이 괜찮다잖아요."\n\n박 선생이 천천히 가운을 입었다. 소매가 낡았지만 단추는 전부 잠겼다.\n\n"…맞네. 아직 맞아."\n\n그는 가운을 벗지 않고 왕진 가방을 들었다.', fx:{mood:{parkss:8}, moodAll:3, note:{type:'사건',title:'가운을 다시 입은 날',body:'오랜만에 박 선생이 흰 가운을 입었다.',links:['박 선생']}}}]},
  {label:'"남산에서 입혀드릴게요"', out:[{p:1, text:'"그럼 그때까지 자네가 맡아줘." 박 선생이 가운을 개어 내게 맡겼다.\n\n"의사가 가운을 맡기는 건, 목숨을 맡기는 거랑 같아."\n\n짐칸의 가운 한 벌이, 남산까지 가야 할 이유를 하나 더 보탰다.', fx:{mood:{parkss:7}, note:{type:'사건',title:'맡아둔 가운',body:'남산에 도착하면 입혀드리기로 한 박 선생의 흰 가운. 짐칸의 가장 가벼운 무거움.',links:['박 선생']}}}]},
 ]},

/* ── 강우 (파수꾼 34 · 자신이 겪은 서울 추방 당시 수비대 · 과묵) ── */
{id:'talk_kw_16', type:'대화', w:4, once:true, needsComp:'kangwoo',
 title:'강우 — 전투식량 교환',
 text:'강우가 자기 몫의 건빵을 말없이 내밀었다.\n\n"…별사탕이 두 개 들었습니다. 오늘은 운이 좋은 봉지입니다."',
 choices:[
  {label:'별사탕 하나를 돌려준다', out:[{p:1, text:'"하나면 됩니다." "저도 하나면 돼요. 그러니까 하나씩."\n\n강우가 3초쯤 별사탕을 보다가 입에 넣었다.\n\n"……답니다." 그 한마디가 강우식 만찬 소감이었다.', fx:{mood:{kangwoo:4}}}]},
  {label:'"운 좋은 봉지는 왜 나 줘?"', out:[{p:1, text:'"…운은 나눠야 커집니다. 부대 미신입니다."\n\n강우도 별사탕 하나를 꺼내 입에 넣었다. 둘 다 녹을 때까지 씹지 않았다.', fx:{mood:{kangwoo:3}}}]},
 ]},
{id:'talk_kw_17', type:'대화', w:4, once:true, needsComp:'kangwoo',
 title:'강우 — 수신호',
 text:'강우가 손가락 두 개를 굽혔다 폈다.\n\n"…이건 「정지」. 이건 「전방 주시」. 이건 「후진」." 갑자기 수신호 강습이 시작됐다.\n\n"소리를 못 낼 때가 옵니다. 그때를 위해."',
 choices:[
  {label:'진지하게 전부 외운다', out:[{p:1, text:'정지, 전방, 후진, 산개, 집결. 다섯 개를 외울 때까지 강우는 몇 번이고 반복했다.\n\n"…합격입니다."\n\n그날부터 엔진 소리 때문에 말이 안 들릴 때는 강우의 손부터 보게 됐다.', fx:{mood:{kangwoo:5}, note:{type:'사건',title:'다섯 개의 수신호',body:'강우에게 정지·전방·후진·산개·집결 신호를 배웠다.',links:['강우']}}}]},
  {label:'"「밥 먹자」 신호도 만들자"', out:[{p:1, text:'강우가 멈칫했다. "…그런 건 교범에 없습니다."\n\n"우리 교범엔 있어야지." 잠시 고민하던 강우가 주먹으로 배를 두 번 두드렸다.\n\n"……신설했습니다." 세상에서 제일 진지한 얼굴로 밥 신호를 만든 남자.', fx:{mood:{kangwoo:5}}}]},
 ]},
{id:'talk_kw_18', type:'대화', w:4, once:true, needsComp:'kangwoo', needBond:['kangwoo',5], night:true,
 title:'강우 — 불침번 교대',
 text:'불침번 교대 시간. 강우가 자리를 넘기며 웬일로 먼저 입을 열었다.\n\n"…원래는 교대해도 안 잤습니다. 아무도 못 믿어서."\n\n"요즘은 잡니다. 그 얘길 하고 싶었습니다."',
 choices:[
  {label:'"푹 자. 내가 보고 있을게"', out:[{p:1, text:'강우가 고개를 끄덕이고 담요에 들어갔다. 그리고 정말로, 금세 숨소리가 깊어졌다.\n\n등을 보이고 자는 군인. 그게 어떤 신뢰인지 아는 데는 설명이 필요 없었다.', fx:{mood:{kangwoo:6}}}]},
  {label:'"언제부터 잤는데?"', out:[{p:1, text:'"…셋째 주쯤." 강우가 잠깐 셈을 했다. "정확히는, 당신이 내 몫의 물을 남겨놓기 시작한 날부터."\n\n그다음부터는 물병을 아무 데나 놓지 않았다. 늘 강우 손이 닿는 같은 자리에 뒀다.', fx:{mood:{kangwoo:5}}}]},
 ]},
{id:'talk_kw_19', type:'대화', w:4, once:true, needsComp:'kangwoo', needBond:['kangwoo',12],
 title:'강우 — 동기의 라이터',
 text:'강우가 불을 피우는 라이터엔 이름이 새겨져 있다. 「김성재」. 강우가 아니다.\n\n"…동기 겁니다. 그날, 제 옆에 있던."\n\n강우가 라이터를 오래 쥐고 있었다. "먼저 가면서 이걸 던져줬습니다. 「불씨 꺼뜨리지 마라」고."',
 choices:[
  {label:'"불씨, 안 꺼졌네"', out:[{p:1, text:'모닥불이 탁, 탁 소리를 냈다. 강우가 불을 보며 말했다.\n\n"…예. 오늘도 지켰습니다." 매일 밤 불을 피우는 게 그에겐 점호였다. 전우와의.\n\n"성재라면 이 판을 좋아했을 겁니다. 시끄러운 놈이었거든요." 강우가 아주 조금 웃었다.', fx:{mood:{kangwoo:6}, note:{type:'인물',title:'김성재의 라이터',body:'그날 강우에게 라이터를 던지며 「불씨 꺼뜨리지 마라」던 동기. 매일 밤 모닥불이 그와의 점호다.',links:['강우']}}}]},
  {label:'"성재 씨 얘기 더 해줘"', out:[{p:1, text:'"…밥을 빨리 먹었습니다. 노래를 못했습니다. 근데 자꾸 불렀습니다."\n\n짧은 문장들이 오래 이어졌다. 강우 기준으로는 폭풍 수다였다.\n\n"…오랜만에 놈 얘길 했더니, 이상하게 배가 고픕니다." 그날 저녁은 강우가 제일 많이 먹었다.', fx:{mood:{kangwoo:5}}}]},
 ]},
{id:'talk_kw_20', type:'대화', w:4, once:true, needsComp:'kangwoo', needBond:['kangwoo',12], needFlag:'kw_absolved',
 title:'강우 — 경례의 방향',
 text:'강우가 북쪽을 향해 서 있다. 부동자세로.\n\n"…버릇입니다. 서울 쪽을 보면 몸이 굳습니다. 사죄인지 경례인지 저도 모르겠습니다."',
 choices:[
  {label:'"이제 경례로 하자. 지킨 것들에게"', out:[{p:1, text:'"…지킨 것들." 강우가 그 말을 곱씹었다.\n\n그리고 천천히, 각 잡힌 경례를 올렸다. 사죄가 아니라 경례를. 도망친 밤이 아니라, 그 후 지켜온 모든 것에게.\n\n"…이제 안 굳습니다." 내려온 손이 가벼워 보였다.', fx:{mood:{kangwoo:7}, note:{type:'사건',title:'경례의 방향',body:'강우가 서울을 향해 사죄 대신 경례를 올렸다. 도망친 밤이 아니라 지켜온 것들에게.',links:['강우']}}}]},
  {label:'옆에 나란히 선다', out:[{p:1, text:'말없이 옆에 서서 같은 방향을 봤다. 얼마 뒤 강우가 말했다.\n\n"…혼자 볼 땐 벌 서는 기분이었는데, 둘이 보니 보초 서는 기분입니다."\n\n"벌과 보초의 차이가 뭔데?" "…돌아갈 자리가 있는 겁니다." 우리는 자리로 돌아갔다. 같이.', fx:{mood:{kangwoo:6}}}]},
 ]},
{id:'talk_kw_21', type:'대화', w:4, once:true, needsComp:'kangwoo', needBond:['kangwoo',20],
 title:'강우 — 등',
 text:'정비 중 차 밑에 들어가야 했다. 좁고, 어둡고, 밖이 안 보이는 자리.\n\n강우가 말없이 차 옆에 앉았다. "…들어가십시오. 등은 제가 봅니다."\n\n작업 내내 강우는 같은 자리에 있었다.',
 choices:[
  {label:'"넌 등을 누구한테 맡겨?"', out:[{p:1, text:'작업을 마치고 나와 물었다. 강우가 잠깐 침묵했다.\n\n"…원래는 아무한테도. 지금은—" 강우가 차와 우리를 번갈아 봤다. "이 차에 탄 전원입니다."\n\n파수꾼이 등을 맡겼다. 그보다 큰 신뢰의 말을 나는 모른다.', fx:{mood:{kangwoo:8}, moodAll:2, note:{type:'사건',title:'맡긴 등',body:'아무도 못 믿던 파수꾼이 말했다. "등은 이 차에 탄 전원에게 맡깁니다."',links:['강우']}}}]},
  {label:'"고마워. 든든했어"', out:[{p:1, text:'"…당연한 일입니다." 강우가 일어나 손을 내밀었다. 차 밑에서 나오는 나를 끌어올리는 손.\n\n악력이 어마어마했다. "…아프다." "…미안합니다. 반가워서."\n\n반가움을 악력으로 표현하는 남자와, 나는 오늘도 함께 달린다.', fx:{mood:{kangwoo:6}}}]},
 ]},

/* ── 레오 (음유시인 28 · 보리 · 엄마의 노래) ── */
{id:'talk_leo_16', type:'대화', w:4, once:true, needsComp:'leo', needFlag:'leo_chord1',
 title:'레오 — 두 번째 코드',
 text:'레오가 기타를 내밀었다.\n\n"A마이너 아직 기억하죠? 오늘은 2교시예요. C요. 세상 모든 노래의 반은 C로 시작해요."',
 choices:[
  {label:'배운다 (손가락 아픔 감수)', out:[{p:1, text:'손가락이 줄에 눌려 아우성쳤지만, 삼십 분 만에 C가 울렸다. 딩—\n\n"들었어요?! 방금 그거예요!" 레오가 제 일처럼 좋아했다.\n\n"이제 형은 레퍼토리 두 개짜리 연주자예요. Am에서 C로 넘어가면— 그게 벌써 노래예요." 쓸쓸함에서 시작으로 넘어가는 두 코드. 선곡이 의미심장했다.', fx:{mood:{leo:5}, fatigue:1}}]},
  {label:'"오늘도 듣는 담당 할게"', out:[{p:1, text:'"듣는 담당의 꾸준함도 실력이에요." 레오가 진지해졌다.\n\n"노래는 듣는 사람 귀에서 완성되거든요. 형이 제 완성이에요."\n\n낯간지러운 말을 아무렇지 않게 하는 재주. 그래서 얘가 음유시인이다.', fx:{mood:{leo:4}}}]},
 ]},
{id:'talk_leo_17', type:'대화', w:4, once:true, needsComp:'leo', needsDog:true,
 title:'레오 — 보리 발바닥',
 text:'레오가 자는 보리의 발바닥을 조물조물 만지고 있다.\n\n"형, 이거 만져봐요. 젤리 같아요. 세상이 망해도 개 발바닥은 말랑해요."',
 choices:[
  {label:'조심스레 만져본다', out:[{p:1, text:'정말 말랑했다. 보리가 잠결에 발가락을 오므렸다.\n\n"이 발로 폐허를 걸어서 절 찾아왔다니까요." 레오가 발바닥을 제 볼에 갖다 댔다.\n\n"그래서 전 이 발바닥이 세상에서 제일 위대한 발이라고 생각해요." 반박할 수 없었다.', fx:{mood:{leo:4}}}]},
  {label:'"보리 깨겠다"', out:[{p:1, text:'"안 깨요. 얘 지금 제일 행복한 꿈 꾸는 중이에요. 꼬리 보세요."\n\n자면서도 꼬리가 살랑살랑 흔들리고 있었다. "무슨 꿈일까?" "우리 다 같이 있는 꿈이요. 딱 보면 알아요."\n\n개도 사람도, 좋은 꿈의 내용물은 같다.', fx:{mood:{leo:3}}}]},
 ]},
{id:'talk_leo_18', type:'대화', w:4, once:true, needsComp:'leo', needBond:['leo',5],
 title:'레오 — 사연 수집가',
 text:'레오의 가사 수첩엔 낯선 이름들이 가득하다.\n\n"지나온 마을 사람들 사연이에요. 노래로 만들어주기로 약속했거든요. 씨앗 파는 애, 등대 할아버지…"\n\n"세상이 기록을 안 해주니까, 노래라도 해야죠."',
 choices:[
  {label:'"내 사연도 있어?"', out:[{p:1, text:'레오가 수첩을 뒤로 숨겼다. "…있는데, 아직 미완성이라 못 보여줘요."\n\n"제목만." "…「운전석」이요. 후렴만 완성됐어요." 잠깐 뜸을 들이더니 흥얼거렸다.\n\n"—핸들을 잡은 손이 우릴 잡은 손— …여기까지만!" 얼굴이 빨개진 시인이 수첩을 덮었다.', fx:{mood:{leo:6}}}]},
  {label:'"그 약속들 다 지킬 수 있어?"', out:[{p:1, text:'"다는 못 지킬 수도 있죠. 근데 하나 지킬 때마다 노래가 하나 늘잖아요."\n\n레오가 수첩을 넣다가 다시 꺼냈다. 방금 만난 정비소 아이의 이름을 물었다.\n\n"천리안은 명단을 만들고, 전 세트리스트를 만들어요. 같은 이름이어도 듣는 사람은 다르니까."', fx:{mood:{leo:5}, note:{type:'사건',title:'레오의 세트리스트',body:'천리안의 명단에 오른 이름들을 레오는 노래의 주인공으로 다시 적는다.',links:['레오']}}}]},
 ]},
{id:'talk_leo_19', type:'대화', w:4, once:true, needsComp:'leo', needBond:['leo',12],
 title:'레오 — 엄마의 십팔번',
 text:'모닥불 앞에서 레오가 낮게 콧노래를 흥얼거린다. 처음 듣는 옛 노래다.\n\n"…엄마 십팔번이에요. 설거지할 때마다 불렀어요. 물소리랑 세트로."\n\n"이상하죠. 얼굴보다 노래가 더 선명해요."',
 choices:[
  {label:'"끝까지 불러줘"', out:[{p:1, text:'레오가 기타를 안고 끝까지 불렀다. 군데군데 가사를 잊어서 라라라로 때우면서.\n\n"…가사 잊은 부분은 엄마가 화내겠다." 웃는데 눈이 젖어 있었다.\n\n"괜찮아. 라라라 부분은 네가 새로 쓰면 돼. 이어 부르라고 물려주신 걸 거야." 레오가 오래 고개를 끄덕였다.', fx:{mood:{leo:6}}}]},
  {label:'"물소리 구해올게" (물을 졸졸 따른다)', out:[{p:1, text:'물통을 기울여 졸졸 소리를 냈다. 레오가 웃음을 터뜨리더니— 이내 노래를 얹었다.\n\n설거지 물소리와 엄마의 십팔번. 오랜만에 세트가 복원됐다.\n\n"…형은 가끔 천재 같아요." 물 반 컵으로 천재가 됐다.', fx:{mood:{leo:7}, water:-1}}]},
 ]},
{id:'talk_leo_20', type:'대화', w:4, once:true, needsComp:'leo', needBond:['leo',12], needFlag:'leo_names_song', minParty:6,
 title:'레오 — 2절의 주인공들',
 text:'"「400km」 2절이요, 드디어 풀렸어요." 레오가 수첩을 펼쳤다.\n\n"1절은 길 얘기였는데, 2절은 사람이에요. 한 소절에 한 명씩. 여섯 소절."\n\n"근데 문제가… 여섯 명 다 자기 소절인 줄 모르게 썼어요. 들키면 부끄러우니까."',
 choices:[
  {label:'"내 소절 찾아볼게"', out:[{p:1, text:'가사를 읽었다. 렌치를 쥔 별, 흰 가운의 등대, 말없는 방패, 저울을 든 까치, 주파수의 등불…\n\n"…이 「졸음을 쫓는 헤드라이트」가 나야?" 레오가 화들짝 수첩을 덮었다.\n\n"어떻게 알았어요?!" "운전 담당이니까." 여섯 개의 초상이 노래 속에 숨어서 함께 달린다.', fx:{mood:{leo:6}, note:{type:'사건',title:'400km 2절',body:'여섯 소절에 여섯 명. 렌치의 별, 가운의 등대, 말없는 방패, 저울의 까치, 주파수의 등불, 그리고 헤드라이트.',links:['레오']}}}]},
  {label:'"완성되면 제일 먼저 누구 들려줄래?"', out:[{p:1, text:'"…엄마요." 레오가 바로 답했다.\n\n"남산에 방송국 있다면서요. 전파는 하늘까지 가잖아요. 그럼 들리겠죠, 어디에 계시든."\n\n노래를 하늘에 부치려는 사람. 그 우표값이 411km다.', fx:{mood:{leo:6}}}]},
 ]},
{id:'talk_leo_21', type:'대화', w:4, once:true, needsComp:'leo', needBond:['leo',20],
 title:'레오 — 기타의 유언장',
 text:'레오가 기타 뒷판을 보여줬다. 작은 글씨들이 새겨져 있다.\n\n"이 기타 물려준 버스킹 할아버지가 그랬어요. 기타 뒷판은 유언장이라고. 지킬 약속을 새기는 거래요."\n\n할아버지의 글씨 밑에, 레오의 글씨가 몇 줄. 그리고 빈 자리.',
 choices:[
  {label:'"뭐라고 새겼는데?"', out:[{p:1, text:'레오가 한 줄씩 읽었다. "「노래를 멈추지 말 것」— 할아버지 거. 「보리를 지킬 것」, 「엄마 노래를 완성할 것」— 제 거."\n\n"그리고 이번에 하나 새로 새겼어요." 제일 아래, 서툰 글씨.\n\n「이 차에 탄 사람들이랑 끝까지 갈 것」. …기타가 무거워진 이유가 있었다.', fx:{mood:{leo:7}, moodAll:2, note:{type:'사건',title:'기타 뒷판의 유언장',body:'레오의 기타에 새겨진 약속들. 최신 항목: 「이 차에 탄 사람들이랑 끝까지 갈 것」.',links:['레오']}}}]},
  {label:'"빈 자리엔 뭘 새길 거야?"', out:[{p:1, text:'"그건 서울 도착하고 새길 거예요." 레오가 빈 자리를 쓸었다.\n\n"도착한 사람만 쓸 수 있는 문장이 있을 것 같아서요. 지금 쓰면 거짓말이 되니까."\n\n레오는 칼끝으로 아주 작은 점만 찍었다. 시작할 자리를 잊지 않으려고.', fx:{mood:{leo:6}}}]},
 ]},

/* ── 재이 (수집꾼 22 · 아빠의 창고 · 까치) ── */
{id:'talk_jy_16', type:'대화', w:4, once:true, needsComp:'jaeyi',
 title:'재이 — 반짝이 상자',
 text:'재이가 작은 깡통을 열어 보였다. 유리구슬, 병뚜껑, 반짝이는 잡동사니가 가득하다.\n\n"제 비매품 컬렉션이에요. 값은 안 나가는데 반짝이는 것들."',
 choices:[
  {label:'"수집꾼이 왜 값 안 나가는 걸 모아?"', out:[{p:1, text:'"값나가는 건 팔아야 먹고살죠." 재이가 구슬 하나를 햇빛에 비췄다. "이건 보면 기분이 좋고요. 그걸 왜 팔아요?"\n\n구슬 빛이 재이 볼을 파랗게 훑고 지나갔다.', fx:{mood:{jaeyi:4}}}]},
  {label:'반짝이는 돌을 주워 하나 보탠다', out:[{p:1, text:'길에서 주운 운모 조각을 내밀자 재이 눈이 커졌다.\n\n"오— 합격이에요! 형도 반짝이 보는 눈이 있네요?" 깡통에 소중히 들어갔다.\n\n"이제 이 상자에 형 지분 있어요. 1구슬만큼." 세상에서 제일 값진 1구슬이다.', fx:{mood:{jaeyi:5}}}]},
 ]},
{id:'talk_jy_17', type:'대화', w:4, once:true, needsComp:'jaeyi',
 title:'재이 — 시세 맞히기',
 text:'"심심한데 게임해요. 제가 물건 대면 형이 시세 맞히기. 지는 사람이 설거지."\n\n재이가 자신만만하게 팔짱을 꼈다. "첫 문제. 멀쩡한 건전지 한 알."',
 choices:[
  {label:'"고철 두 개"', out:[{p:2, text:'"…정답이에요. 뭐지? 재능 있네." 재이가 분해했다.\n\n두 문제, 세 문제. 접전 끝에 한 끗 차이로 졌다. "설거지는 형! 근데 오늘 제가 도울게요. 접전 보너스."\n\n둘이서 하는 설거지는 벌칙이 아니었다.', fx:{mood:{jaeyi:5}}},
    {p:1, text:'"땡! 세 개예요. 요즘 라디오 듣는 사람이 늘어서 올랐어요." 시세는 살아 있는 생물이었다.\n\n연전연패로 설거지 당첨. 재이가 옆에서 시세 강의를 하며 감독했다. 지는 것도 배움이 됐다.', fx:{mood:{jaeyi:4}, fatigue:1}}]},
  {label:'"그건 파는 사람 마음 아니야?"', out:[{p:1, text:'"그럼 가게마다 싸움 나죠." 재이가 건전지를 손가락으로 튕겼다. "지난 장에서 셋이면 이번 장에서도 셋. 그래야 다음에 또 거래해요."\n\n"그래서 정답은?"\n\n"세 개. 설거지 당첨."', fx:{mood:{jaeyi:4}}}]},
 ]},
{id:'talk_jy_18', type:'대화', w:4, once:true, needsComp:'jaeyi', needBond:['jaeyi',5],
 title:'재이 — 리어카 여러 해',
 text:'"저 혼자 다닐 때요, 리어카에 이름 붙였었어요. 「사장님」."\n\n재이가 웃었다. "혼자면 미치니까, 사장님한테 보고를 했어요. 오늘 매출 얼마요, 내일 어디 가요."\n\n"…여러 해를 그랬어요."',
 choices:[
  {label:'"사장님은 지금 어디 계셔?"', out:[{p:1, text:'"지붕에 묶어놨잖아요. 현장에서는 은퇴했어요."\n\n재이가 우리를 둘러봤다. "요즘은 보고를 잘 안 해요. 말할 사람이 많아져서."\n\n지붕에서 리어카 바퀴가 덜컹했다. 재이가 위를 보고 덧붙였다. "삐진 건 아니죠, 사장님?"', fx:{mood:{jaeyi:6}}}]},
  {label:'"오늘 매출 보고해봐"', out:[{p:1, text:'재이가 자세를 고쳐 앉더니 또랑또랑 보고를 시작했다.\n\n"금일 습득 고철 다섯, 지출 둘, 순익 셋! 특이사항— 대원 전원 무사, 저녁 메뉴 기대됨!"\n\n"결재." 손도장을 찍는 시늉을 하자 재이가 깔깔 웃었다. 웃다가 다시 "저녁 뭐예요?" 하고 물었다.', fx:{mood:{jaeyi:6}}}]},
 ]},
{id:'talk_jy_19', type:'대화', w:4, once:true, needsComp:'jaeyi', needBond:['jaeyi',12],
 title:'재이 — 아빠의 마지막 거래',
 text:'"아빠 마지막 거래가 뭐였는지 알아요?" 재이가 문득 물었다.\n\n"그날 아침, 이웃집에 쌀 한 포대를 줬어요. 값도 안 받고. 「난리 나면 셈은 나중에」 그러면서."\n\n"…나중은 안 왔어요. 근데 그 이웃이 절 한 달을 먹여줬어요. 아빠가 준 쌀로."',
 choices:[
  {label:'"셈이 돌아왔네. 너한테"', out:[{p:1, text:'재이가 천천히 고개를 끄덕였다.\n\n"그래서 저도 가끔 그냥 줘요. 장부엔 아빠 앞으로 달아두고." 재이가 수첩 귀퉁이를 접었다. "언젠가 어디선가 또 돌아오겠죠. 안 돌아와도 됐고요."', fx:{mood:{jaeyi:6}, note:{type:'인물',title:'아빠의 계좌',body:'재이 아빠가 셈 없이 준 쌀은 결국 재이를 살렸다. 재이도 가끔 장부에 아빠 이름으로 물건을 내준다.',links:['재이']}}}]},
  {label:'"아버지 장부, 네가 이어 쓰는 거네"', out:[{p:1, text:'"…맞아요. 제 수첩이 그 장부 2권이에요." 재이가 수첩을 꺼내 첫 장을 보여줬다.\n\n삐뚤빼뚤한 어른 글씨로 「고물상의 법」 세 줄이 적혀 있었다. 아빠의 필체를 옮겨 적은 것이다.\n\n"1권은 불탔지만, 법은 안 타요. 제가 외웠으니까."', fx:{mood:{jaeyi:6}}}]},
 ]},
{id:'talk_jy_20', type:'대화', w:4, once:true, needsComp:'jaeyi', needBond:['jaeyi',12], needFlag:'jy_law',
 title:'재이 — 값 안 매기는 목록',
 text:(S)=>{
   const names=(S.party||[]).filter(id=>id!=='jaeyi'&&D.comps[id]).map(id=>D.comps[id].name);
   const aboard=names.length?names.join(', '):'운전석';
   return '재이가 수첩 맨 뒷장을 보여줬다. 「비매품 목록」이라 적혀 있다.\n\n"아빠 손저울, 반짝이 상자, 사장님(리어카)… 그리고 차에 타고 나서 줄이 더 늘었어요."\n\n'+aboard+'. 마지막 한 줄은 손가락으로 가렸다.';
 },
 choices:[
  {label:'"가린 줄 보여줘"', out:[{p:1, text:'"…안 돼요. 부끄러워요." 실랑이 끝에 재이가 손가락을 치웠다.\n\n「운전석. 시세: 측정 불가. 사유: 기준가 없음. 세상에 하나뿐인 물건은 시세가 안 잡힘.」\n\n"…수집꾼 인생 최대 감정 오류예요." 감정가의 얼굴이 새빨갰다.', fx:{mood:{jaeyi:7}, note:{type:'사건',title:'비매품 목록',body:'재이 수첩 뒷장. 차에 탄 사람들과 운전석이 값을 매길 수 없는 목록에 올랐다.',links:['재이']}}}]},
  {label:'"나도 비매품 목록 만들어야겠다"', out:[{p:1, text:'"좋은 습관이에요! 첫 줄은 뭐 쓸 거예요?"\n\n"이 차랑, 이 차에 탄 전원." 재이가 씩 웃으며 수첩을 덮었다.\n\n"그거 제 목록이랑 겹치네요. …비매품은 겹칠수록 좋은 거예요." 우리는 서로의 비매품이 됐다.', fx:{mood:{jaeyi:6}, moodAll:2}}]},
 ]},
{id:'talk_jy_21', type:'대화', w:4, once:true, needsComp:'jaeyi', needBond:['jaeyi',20],
 title:'재이 — 손저울의 상속',
 text:'재이가 아빠의 손저울을 꺼내더니, 뜻밖의 말을 했다.\n\n"이거요, 형이 잠깐 차고 있어요."\n\n"…이건 네 제일 비매품이잖아." "그러니까요. 제일 비매품을 맡기는 게 제 최고 거래예요."',
 choices:[
  {label:'"이자는 어떻게 쳐줘?"', out:[{p:1, text:'"이자요?" 재이가 씩 웃었다.\n\n"서울까지 무사히 가면 저 계속 데리고 다녀요. 어때요, 남는 장사죠?"\n\n"…그건 이자가 아니라 원금인데."\n\n"어? 들켰다." 재이가 저울끈을 손목에 맞게 한 칸 늘려줬다.', fx:{mood:{jaeyi:8}, moodAll:2, note:{type:'사건',title:'손저울의 상속',body:'재이가 아빠의 손저울을 서울까지 맡겼다.',links:['재이']}}}]},
  {label:'"맡을게. 서울까지만"', out:[{p:1, text:'"서울 도착하면 돌려주면서 말해줘요. 「거래 완료」라고."\n\n재이가 저울을 내 손에 올렸다. 손목에 조금 짧아서 끈을 한 칸 늘렸다.\n\n"이제 됐어요. 잃어버리면 진짜 비싸게 받을 거예요."', fx:{mood:{jaeyi:7}}}]},
 ]},

/* ── 은수 (관제사 33 · 자신이 겪은 서울 추방 방송 당시 당직 · 주파수) ── */
{id:'talk_es_16', type:'대화', w:4, once:true, needsComp:'eunsu',
 title:'은수 — 콜사인의 무게',
 text:'"관제실에선 본명보다 호출부호를 더 많이 써요. 저도 선배 성을 얼마 뒤에 알았어요."\n\n은수가 헤드폰을 만지작거렸다. "그 이름 들으면 아직도 저절로 대답해요. 일을 그만뒀는데도."',
 choices:[
  {label:'"달구지도 콜사인 있어야지"', out:[{p:1, text:'은수가 차를 한참 봤다.\n\n"…「캐리어」요. 항공모함이요. 다들 여기서 뜨고 여기로 내리잖아요."\n\n고물 봉고차한테 너무 거창하다고 하자 은수가 고개를 저었다. "관제사는 호출부호 허투루 안 정해요. 제 직업적 판단이에요."', fx:{mood:{eunsu:5}, note:{type:'사건',title:'콜사인 — 캐리어',body:'달구지의 공식 호출부호. "다들 여기서 뜨고 여기로 내리잖아요."',links:['은수','달구지']}}}]},
  {label:'"은수 씨 진짜 콜사인은 뭐였어?"', out:[{p:1, text:'"「에코」요. 무전 용어로 E. …근데 뜻이 좋아서 아꼈어요. 메아리."\n\n은수가 옅게 웃었다. "보낸 신호가 돌아오는 거요. 관제사한텐 제일 반가운 소리거든요. 응답이 있다는 뜻이라."\n\n"지금은 왜 안 써?" "…받을 자신이 생기면요. 보낸 게 돌아와야 에코니까." 그때까지는 노스 스타로 다닌다고 했다.', fx:{mood:{eunsu:5}}}]},
 ]},
{id:'talk_es_17', type:'대화', w:4, once:true, needsComp:'eunsu',
 title:'은수 — 주파수의 취향',
 text:'은수가 라디오 다이얼을 천천히 돌리고 있다. 지직— 지직—\n\n"…잡음에도 취향이 있는 거 알아요? 전 빗소리 같은 잡음이 좋아요. 이런 거." 지지지— 하는 부드러운 백색소음.',
 choices:[
  {label:'"잡음이 왜 좋아?"', out:[{p:1, text:'"아무 말도 안 들리는데, 완전히 끊긴 건 아니잖아요."\n\n은수가 다이얼에서 손을 뗐다. "관제실에선 신호 자체가 사라지는 게 더 무서웠어요. 그래서 이 소리 들으면 좀 안심돼요."', fx:{mood:{eunsu:4}}}]},
  {label:'"제일 좋아하는 주파수는?"', out:[{p:1, text:'"92.7이요. 옛날에 새벽 클래식 채널이었어요. 당직 때 몰래 들었어요."\n\n은수가 다이얼을 92.7에 맞췄다. 지금은 잡음뿐이다.\n\n"쇼팽이었나, 슈만이었나… 앞부분은 아직 기억나요." 은수가 손가락으로 느리게 박자를 셌다.', fx:{mood:{eunsu:4}}}]},
 ]},
{id:'talk_es_18', type:'대화', w:4, once:true, needsComp:'eunsu', needBond:['eunsu',5],
 title:'은수 — 관제 용어 심화반',
 text:'"오늘의 관제 용어." 은수의 코너가 또 열렸다. 이번엔 심화반이란다.\n\n은수가 손가락을 하나씩 폈다. "「스탠바이」— 대기. 「세이 어게인」— 다시 말하라. 「메이데이」— 이건… 안 쓸 일이 있길 바라요."',
 choices:[
  {label:'"스탠바이" 하고 바로 써먹는다', out:[{p:1, text:'그날부터 차 안 관제 용어가 한층 풍부해졌다. "정차 5분." "스탠바이." "뭐라고?" "세이 어게인."\n\n배운 지 몇 분도 안 돼 엉뚱한 곳에 남발하자 은수가 오랜만에 소리 내어 웃었다. "…관제사 하길 잘했어요. 이 교신은 즐겁네요."', fx:{mood:{eunsu:5}, moodAll:1}}]},
  {label:'"메이데이 말고 「집에 가자」로 바꾸자"', out:[{p:1, text:'"메이데이는 너무 무섭잖아. 우리끼린 「집에 가자」 어때?"\n\n은수가 눈을 깜빡였다. "교범 위반인데요."\n\n"우리 차에 교범이 어디 있어."\n\n"…좋아요. 차 안에서만." 은수가 수첩 귀퉁이에 적어뒀다.', fx:{mood:{eunsu:6}}}]},
 ]},
{id:'talk_es_19', type:'대화', w:4, once:true, needsComp:'eunsu', needBond:['eunsu',12],
 title:'은수 — 당직 커피',
 text:'은수가 커피 비슷한 것을 끓이며 이상한 의식을 치른다. 컵을 세 번 돌리고, 한 모금은 바닥에 붓는다.\n\n"…아, 이거요. 당직 교대식이에요. 먼저 간 교대자 몫."',
 choices:[
  {label:'"오늘은 누구 몫이야?"', out:[{p:1, text:'"…그날 저랑 교대했어야 할 선배요. 오지 말라고 제가 무전 쳤어요. 길이 위험하다고."\n\n은수가 바닥에 부은 자국을 봤다. "그날 제가 한 말 중엔 그게 제일 잘한 말이에요. 한 명은 살렸으니까."\n\n"그 선배도 어디선가 은수 씨 몫을 붓고 있을 거야."\n\n은수는 대답 대신 바닥에 한 모금 더 부었다.', fx:{mood:{eunsu:6}, note:{type:'인물',title:'교대식 커피',body:'은수는 그날 무전으로 살린 선배 몫의 커피를 먼저 따른다.',links:['은수']}}}]},
  {label:'따라서 한 모금 붓는다', out:[{p:1, text:'내 컵에서도 한 모금을 바닥에 부었다. 은수가 놀란 눈으로 봤다.\n\n"…누구 몫이에요?" "여기까지 못 온 사람들 몫. 많잖아, 우리 둘 다."\n\n은수가 고개를 끄덕이고, 우리는 남은 커피를 말없이 마셨다. 교대식이 둘의 의식이 됐다.', fx:{mood:{eunsu:5}}}]},
 ]},
{id:'talk_es_20', type:'대화', w:4, once:true, needsComp:'eunsu', needBond:['eunsu',12], needFlag:'es_truth',
 title:'은수 — 다시 잡은 마이크',
 text:'은수가 무전기 마이크를 쥐고 한참 망설이고 있다.\n\n"…그날 이후 송신을 못 해요. 수신만 하고. 제 목소리가 어디로 가서 뭐가 될지 무서워서."\n\n마이크를 쥔 손이 하얗다.',
 choices:[
  {label:'"첫 송신, 나한테 해봐"', out:[{p:1, text:'"…네?" "채널 아무거나. 내가 저기 언덕에서 받을게."\n\n언덕에 올라 무전기를 켰다. 한참의 침묵 뒤— 지직. "…들리세요? 여기는 에코."\n\n"수신 양호, 에코. 목소리 좋다."\n\n무전기 너머로 짧게 웃는 소리가 났다. 은수는 돌아오는 길에도 마이크를 놓지 않았다.', fx:{mood:{eunsu:8}, note:{type:'사건',title:'여러 해 만의 송신',body:'그날 이후 수신만 하던 은수가 다시 마이크를 잡았다. 첫 교신은 무사히 끝났다.',links:['은수']}}}]},
  {label:'"그날 네 목소리가 잘못한 건 아니야"', out:[{p:1, text:'"그날 네 목소리가 잘못한 건 아니잖아. 여기선 우리가 듣고 있어. 이상한 데 못 쓰게 할게."\n\n은수가 마이크를 오래 보다가 버튼을 눌렀다. "…테스트. 테스트. 여기는 에코."\n\n차 안 스피커로 그 목소리가 울렸고, 여기저기서 제각각 대답이 돌아왔다. "들려요!" "잘 들린다!" "수신 양호."', fx:{mood:{eunsu:7}, moodAll:2}}]},
 ]},
{id:'talk_es_21', type:'대화', w:4, once:true, needsComp:'eunsu', needBond:['eunsu',20],
 title:'은수 — 관제탑',
 text:'"관제사는요, 비행기를 못 몰아요. 뜨지도 내리지도 못해요. 평생 남 뜨고 내리는 것만 봐요."\n\n은수가 조용히 말했다. "그게 제 콤플렉스였어요. 저는 늘 화면 밖이었어요."',
 choices:[
  {label:'"근데 관제탑 없으면 아무도 못 떠"', out:[{p:1, text:'"…그 말, 관제 학교 첫날에 배워요." 은수가 웃었다. "그땐 시험 답이라서 외웠고요."\n\n"지금은?"\n\n은수가 수신기를 집어 들었다. "지금은 알 것 같아요. 이 차도 제가 주파수 안 보면 못 가잖아요. 그러니까 오늘도 먼저 볼게요."', fx:{mood:{eunsu:8}, moodAll:2, note:{type:'사건',title:'우리의 관제탑',body:'은수는 달구지에서 관제사의 일을 다시 자기 일로 받아들였다.',links:['은수']}}}]},
  {label:'"그럼 남산 착륙 관제도 부탁해"', out:[{p:1, text:'"…남산 착륙이요?" "제일 어려운 착륙이 될 거야. 관제탑이 필요해."\n\n은수가 자세를 고쳐 앉았다. 관제사의 얼굴로.\n\n"…착륙 요청 접수. 활주로 상태 확인 중. 끝까지 유도할게요. 여기는 에코." 남산의 관제가 시작됐다.', fx:{mood:{eunsu:7}}}]},
 ]},

/* ═══════ 부모가 남긴 수정안 — 주행거리 보장 본편 ═══════ */
{id:'story_family_principle', type:'스토리', w:0, once:true, noPool:1, speakers:['father','mother'],
 title:'예측은 명령이 아니다',
 text:'폐휴게소 보관망에서 오래된 영상 한 조각이 살아났다. 정식 발표 영상이 아니었다. 발표 전날, 아빠가 카메라를 들고 엄마의 예상 질문을 받아 주던 연습 기록이었다.\n\n"다시. 이번엔 내가 제일 까다로운 심사관 할게. 천리안 예측이 92퍼센트나 맞는데, 왜 매번 사람 손을 거쳐야 합니까?"\n\n엄마가 화면 밖의 아빠를 흘겨봤다.\n\n"그 질문 세 번째야."\n\n"실제로 세 번 나올 것 같아서."\n\n"그럼 세 번 답하지 뭐. 틀린 여덟 명은 어떻게 할 건데? 그리고 맞혔다고 해도 아직 하지 않은 일로 집 문부터 잠글 수는 없어."\n\n"좋아. 그러면 제안은 천리안 종료?"\n\n"아니. 병원 전력도, 교통도, 산불 감시도 그대로 둬. 사람을 쫓아내거나 길을 막는 명령만 세우는 거야. 화면에 이유를 띄우고, 책임질 사람이 이름을 쓰고, 당사자가 이의를 제기할 때까지."\n\n아빠가 카메라를 조금 내렸다.\n\n"서명만 하고 읽지도 않으면?"\n\n"누가 언제 어떤 근거로 눌렀는지 남겨야지. 나중에 \'천리안이 그랬다\'고 빠져나가지 못하게."\n\n"천리안이 순순히 받아들일까?"\n\n"허락받을 수정이면 우리가 밤새 이러고 있겠어? 강제 명령은 이 절차를 안 거치면 아예 못 나가게 고치는 거야."\n\n아빠가 작게 웃었다. "그건 발표 때 빼자."\n\n"왜. 제일 솔직한데."\n\n화면에는 의사, 기술자, 아이, 수리공의 이름 대신 미래에 미칠 영향과 위험 점수가 붙어 있었다. 엄마가 그 화면을 가리키려는 순간 영상이 끊겼다. 내가 어릴 때는 보지 못했던 부모님의 마지막 발표 연습이었다.',
 choices:[
  {label:'끊긴 다음 문장을 찾아 복원한다', out:[{p:1, text:'잡음 속에서 마지막 한 줄을 건졌다.\n\n"우리가 제안하는 것은 종료 장치가 아닙니다. 이유 공개, 인간 책임자의 서명, 당사자의 이의 제기. 예측과 실행 사이에 사람을 다시 놓는 일입니다."\n\n엄마는 천리안을 부수려 한 게 아니었다. 천리안이 사람의 자리를 대신하지 못하게 하려 했다.', fx:{flag:'parent_principle_found', moodAll:2, note:{type:'사건',title:'예측은 명령이 아니다',body:'엄마의 발표 원고를 복원했다. 천리안은 사람을 미래 파급으로 평가했고, 부모는 이유 공개·인간 서명·이의 제기를 되돌리려 했다.',links:['천리안','부모님의 검증키']}}}]},
  {label:'천리안의 분류 화면까지 함께 저장한다', out:[{p:1, text:'사람 옆의 점수와 화살표까지 수첩에 베껴 넣었다.\n\n높은 점수라고 존중받은 것도 아니고, 낮은 점수라고 미움받은 것도 아니었다. 전부 도시의 결과를 만드는 부품처럼 적혀 있었다.\n\n그 아래에는 엄마가 고치자던 절차를 적었다. 「위험 점수만으로 이송 불가. 사유 공개, 책임자 서명, 당사자 이의 제기 뒤에만 집행.」', fx:{flag:'parent_principle_found', moodAll:2, note:{type:'사건',title:'인과의 점으로 분류된 사람들',body:'천리안은 사람을 미래 결과의 고위험·고효율 노드로 분류했다. 엄마는 그 계산이 권리를 대신할 수 없다고 남겼다.',links:['천리안','부모님의 검증키']}}}]},
 ]},

{id:'story_family_key', type:'스토리', w:0, once:true, noPool:1,
 speakers:['father','mother'], parseRecords:true,
 title:'달구지 안의 검증키',
 text:'복원한 발표 연습 영상의 마지막 프레임에 작은 첨부 목록이 남아 있었다. 첨부 파일명은 ‘검증키 분리 절차 4–5쪽’. 부산에서 엄마의 수첩을 펼쳤을 때 비어 있던 바로 그 두 장이었다.\n\n보관망에서 절차를 내려받아 차를 세우고 계기판을 다시 열었다. 출발 전에 번호를 붙여 둔 선들이 그대로였다. 이번에는 어느 커넥터를 먼저 풀어야 하는지 알 수 있었다.\n\n정전기 방지 천에 싼 반도체 모듈, 엄마와 아빠와 어린 나를 찍은 사진, 아빠 글씨가 빼곡한 회로 수첩이 차례로 나왔다.\n\n「소프트웨어는 무엇을 고칠지 말한다. 칩은 누구의 수정을 믿을지 정한다.」\n\n「이건 천리안을 끄는 열쇠가 아니다. 천리안의 예측이 현실이 되기 전에, 인간의 서명 하나를 반드시 거치게 하는 검증키다.」\n\n수첩 끝의 음성 파일 번호를 계기판 단말에 입력하자 두 사람의 목소리가 잡음 사이로 돌아왔다.\n\n"이름을 정해야 설명서에 쓰지. 차단 장치?"\n\n"그건 전부 끄는 것처럼 들려. 검증키라고 해."\n\n"너무 평범한데."\n\n"평범해야 해. 이걸 꽂아도 병원 불은 안 꺼지고 신호등도 돌아가. 달라지는 건 강제 명령 앞에서 사람이 한 번 확인한다는 것뿐이야."\n\n"우리가 설치하러 못 가면?"\n\n잠깐 공구 내려놓는 소리가 났다.\n\n"서울 쪽으로 가는 물건에 숨겨야지. 오래 버티고, 고장 나도 누가 고쳐서 다시 움직일 만한 데."\n\n녹음은 거기서 끝났다. 할아버지는 자신이 모르는 회로를 고치는 대신, 그 회로를 실은 달구지가 남산까지 흔들리지 않고 가도록 평생 차를 손봤다.',
 choices:[
  {label:'사진과 회로 수첩까지 함께 꺼낸다', out:[{p:1, text:'분리 절차대로 마지막 접지를 풀었다. 모듈은 손바닥보다 작았다. 이 작은 것이 전기와 병원을 끌 수도 없고, 천리안을 설득할 수도 없다.\n\n할 수 있는 일은 하나였다. 천리안 혼자 내린 판단이 혼자 실행되지 못하게 하는 것.\n\n사진 뒷면에는 엄마 글씨가 있었다.\n\n「우리 대신 결정하지 마. 네가 결정할 수 있게 남기는 거야.」', fx:{flag:'parent_key_found', item:{'부모님의 검증키':1}, moodAll:4, note:{type:'사건',title:'부모님의 검증키',body:'부산에서 확인한 계기판 모듈을 복원한 분리 절차로 안전하게 회수했다. 천리안을 끄는 장치가 아니라, 예측과 실행 사이에 인간의 서명을 요구하는 수정안이다.',links:['천리안','할아버지']}}}]},
  {label:'배선을 표시한 뒤 조심히 분리한다', out:[{p:1, text:'선을 하나 뺄 때마다 수첩에 색과 위치를 적었다. 할아버지에게 배운 방식이었다. 모르면 표시하고, 아는 척하지 않는다.\n\n마지막 커넥터가 빠지자 모듈 아래 각인이 보였다.\n\n「실행 전 인간 확인」\n\n아빠가 남긴 문장은 짧았다. 그 짧은 문장을 지키려고 두 사람이 돌아오지 못했다.', fx:{flag:'parent_key_found', item:{'부모님의 검증키':1}, moodAll:3, note:{type:'사건',title:'실행 전 인간 확인',body:'달구지 계기판의 숨은 모듈을 회수했다. 부모의 수정안은 천리안의 모든 강제 명령에 인간 확인을 요구한다.',links:['천리안','할아버지']}}}]},
 ]},

/* ═══════ 세대의 흔적 — 주행거리 보장 세대 서사 4장면 ═══════ */
{id:'story_generation_form', type:'스토리', w:0, once:true, noPool:1,
 title:'세 겹의 이송표',
 text:'폐쇄된 면사무소 처마 밑에 사람들이 비를 피한다. 벽에는 출생표와 사망표 사이로 이송표 세 장이 붙어 있다.\n\n같은 성씨. 증조모, 할머니, 딸. 출발지는 종로·마포·구로, 내려온 해도 모두 다르다. 「사유」 칸만 똑같이 비어 있다.\n\n누군가 그 옆에 「물 부족」, 「전염」, 「불복종」을 연필로 적었다. 다른 손들이 날짜와 지도를 대조해 하나씩 줄을 그었다. 맨 아래에는 짧은 메모가 남았다.\n\n「아직 모름. 빈칸 지우지 말 것.」',
 choices:[
  {label:'빈칸까지 그대로 베껴 적는다', out:[{p:1, text:'세 사람의 이름을 옮기고, 사유란은 비워 뒀다.\n\n면사무소 노인이 수첩을 들여다봤다. "예전엔 빈칸이 창피해서 아무 말이나 써 넣었어. 물이다, 병이다. 그러면 애들이 그걸 답으로 외우더라고."\n\n노인은 빈칸 옆에 작은 점을 찍었다. "이건 빠뜨린 게 아니라 비워 둔 거라고 표시해."', fx:{flag:'trace_registry', moodAll:1, note:{type:'사건',title:'세 겹의 이송표',body:'한 집안 세 세대가 서로 다른 서울 구역에서 서로 다른 해에 쫓겨났다. 가설을 답처럼 쓰지 않고 빈 사유란까지 기록했다.',links:['서울 추방','천리안']}}}]},
  {label:'세 사람의 이름부터 읽는다', out:[{p:1, text:'맨 위부터 이름을 읽었다. 노인은 셋째 이름에서 "우리 엄마"라고 했다.\n\n"첫째는 사진도 없어. 둘째는 목소리만 기억나고. 우리 엄마는 지난 장날까지 국수를 팔았지."\n\n노인은 세 번째 표를 떼지 않고 손바닥으로 반듯하게 폈다. 비에 번진 이름만 다시 진하게 써 달라고 했다.', fx:{flag:'trace_registry', moodAll:2, note:{type:'인물',title:'빈칸을 물려받은 집',body:'증조모·할머니·딸의 이송표. 사유는 없지만 노인은 세 사람의 삶을 기억했다.',links:['서울 추방']}}}]},
 ]},

{id:'story_generation_speech', type:'스토리', w:0, once:true, noPool:1,
 title:'서울말 해봐',
 text:'장터에서 아이 하나가 국밥 줄의 노인 소매를 잡는다.\n\n"할머니, 서울말 해봐."\n\n노인은 헛기침을 하고 오래전 역 이름을 몇 개 또박또박 읽었다. 아이들이 까르르 웃는다. 그중 서울을 본 아이는 없다.\n\n"우리 엄마는 밖에서 쓰지 말랬어." 노인이 말했다. "나는 집에서만 했고. 쟤들은 장날마다 돈 내라네."\n\n아이 하나가 국밥 그릇을 내밀었다. "한 번 더 하면 공짜."',
 choices:[
  {label:'"우리 집 서울말은 어떤데요?"', out:[{p:1, text:'몇 마디 하자 노인이 고개를 갸웃했다. "서울말 끝에 부산이 붙었네."\n\n옆 아이가 바로 흉내 냈다. 반쯤은 할아버지 억양, 반쯤은 부두 말투, 나머지는 방금 지어낸 소리였다.\n\n"이건 무슨 말이야?"\n\n"달구지 말." 아이가 차 옆면을 두드렸다.', fx:{flag:'trace_dialect', moodAll:3, note:{type:'사건',title:'서울말 시험',body:'숨겨 쓰던 서울말이 장날 놀이가 됐다. 할아버지와 부산의 억양은 아이 입에서 달구지 말로 바뀌었다.',links:['서울 추방','달구지']}}}]},
  {label:'아이에게 어디가 서울인지 묻는다', out:[{p:1, text:'아이는 북쪽이 아니라 자기 할머니를 가리켰다.\n\n"할머니가 서울인데?"\n\n노인은 웃다가 국밥값을 대신 냈다. 떠나기 전, 아이는 역 이름을 한 번 더 들려 달라고 졸랐다.', fx:{flag:'trace_dialect', moodAll:2, note:{type:'사건',title:'사람 안의 서울',body:'서울을 본 적 없는 아이는 서울이 어디냐는 질문에 자기 할머니를 가리켰다.',links:['서울 추방']}}}]},
 ]},

{id:'story_generation_theories', type:'스토리', w:0, once:true, noPool:1,
 title:'세 개의 이유',
 text:'폐교 교실 하나를 세 사람이 기록실로 쓰고 있었다.\n\n첫째는 서울 지하수 지도를 펼쳤다. "물 때문이야." 하지만 물이 남은 구역도 비워졌다.\n\n둘째는 진료 통계를 내밀었다. "질병 때문이야." 하지만 환자가 없던 해에도 이송 방송은 왔다.\n\n셋째는 시위 전단을 모았다. "통제 때문이야." 하지만 천리안에 협조한 관제사 가족도 같은 길로 내려왔다.\n\n세 사람은 서로의 증거를 가장 잘 반박했다. 그래서 함께 있었다. 믿고 싶은 이유 하나가 사실처럼 굳는 것을 막으려고.',
 choices:[
  {label:'공통으로 남은 것을 묻는다', out:[{p:1, text:'세 사람이 동시에 이송표의 같은 칸을 짚었다. 「사유」.\n\n비어 있었다.\n\n"가설은 셋인데 공문은 하나야. 누가 맞든, 설명도 없이 내쫓았다는 건 그대로지."\n\n첫째가 내 수첩의 세 가설 옆에 날짜를 적고, 둘째가 반증 자료의 보관 장소를 덧붙였다.', fx:{flag:'trace_theories', moodAll:1, note:{type:'사건',title:'세 개의 이유',body:'물·질병·통제 가설에는 서로 충돌하는 증거가 있다. 이유는 미확정이지만 설명 없이 집행했다는 사실은 남는다.',links:['서울 추방','천리안']}}}]},
  {label:'세 가설을 모두 수첩에 남긴다', out:[{p:1, text:'어느 하나에도 동그라미를 치지 않고 세 가설과 반증을 나란히 적었다.\n\n"답 정하면 편하긴 해." 셋째가 말했다. "우린 편하려고 기록하는 게 아니잖아."\n\n남산에서 무엇을 듣든, 첫 설명을 빈칸의 정답으로 덥석 받아 적지는 않을 것이다.', fx:{flag:'trace_theories', moodAll:2, note:{type:'소문',title:'답이 되지 못한 세 가설',body:'물 부족·질병·통제. 각 가설 옆에 반증까지 적었다. 남산의 첫 설명도 검증 없이 이유로 받아들이지 않기로 했다.',links:['남산','서울 추방']}}}]},
 ]},

{id:'story_generation_route', type:'스토리', w:0, once:true, noPool:1,
 title:'이송로의 제삿상',
 text:'북쪽으로 갈수록 가드레일 아래 작은 물병이 늘어난다. 오래된 병뚜껑, 새로 구운 종지, 말라붙은 밥 한 술. 표지판에는 페인트 밑으로 「구 이송 7로」가 비친다.\n\n이 길로 내려온 집들은 가족이 서울을 떠난 날마다 물을 놓는다고 했다. 날짜는 집마다 다르다. 백 년 전 날짜도 있고, 십수 년 전 날짜도 있고, 할아버지 수첩에 적힌 날도 있다.\n\n길가에서 병을 놓던 여자가 말했다. "이유는 몰라도 그날 물이 모자랐다는 얘긴 다 똑같아요."',
 choices:[
  {label:'할아버지처럼 경적을 두 번 울린다', out:[{p:1, text:'빵. 빵.\n\n어릴 때 할아버지는 이 길목마다 경적을 두 번 울렸다. 물어도 대답하지 않았다. 이제 알 것 같았다. 돌아가신 사람에게 하는 인사이면서, 아직 가는 사람에게 보내는 생존 신호였다.\n\n멀리 다른 차가 두 번 답했다.', fx:{flag:'trace_route', flag2:'gp_route_ritual', moodAll:4, note:{type:'사건',title:'이송로의 두 번',body:'서로 다른 세대가 내려온 구 이송 7로. 할아버지처럼 경적을 두 번 울리자 먼 차가 두 번 답했다.',links:['할아버지','서울 추방']}}}]},
  {label:'물 한 병을 보탠다', req:{water:1}, out:[{p:1, text:'오늘 날짜를 병뚜껑에 긁고 물 한 병을 놓았다. 우리 집이 떠난 정확한 해는 적지 않았다. 할아버지가 일부러 말하지 않았던 것처럼.\n\n대신 「돌아가는 중」이라고 썼다. 남쪽을 향한 물병들 사이에서, 처음 북쪽을 향한 글씨였다.', fx:{water:-1, flag:'trace_route', flag2:'route_water_left', moodAll:4, note:{type:'사건',title:'북쪽을 향한 물병',body:'구 이송로에 물을 놓고 「돌아가는 중」이라고 적었다. 남행의 기억 사이에 처음 놓인 북행의 문장.',links:['서울 추방','남산']}}}]},
 ]},

/* ═══════ 2026년의 생활이 2169년에 남은 방식 ═══════ */
{id:'trace_cortis_relic', type:'발견', w:14, once:true, region:['south','mid'],
 title:'코르티스?',
 text:'무너진 편의점 진열대에서 청록색 막대 하나가 굴러 나왔다. 투명 포장에는 영문이 남아 있다.\n\n「CORTIS OFFICIAL LIGHT STICK」\n「PUT YOUR PHONE DOWN」\n\n코르티스가 뭐였을까. 옛 구조대 이름인지, 가수인지, 정비 규격인지 알 길이 없다. 버튼을 누르자 백사십 년 묵은 불빛이 한 번, 아주 약하게 깜빡였다.',
 choices:[
  {label:'배선을 고쳐 차의 신호봉으로 쓴다', out:[{p:1, text:'접점을 닦고 작은 축전지를 물리자 청록빛이 되살아났다.\n\n포장 속 사진은 색이 다 빠졌지만, 누군가 이 빛을 흔들며 좋아했던 표정만은 알아볼 수 있었다. 무대의 응원이 밤길의 신호가 되었다.\n\n정체는 몰라도 쓰임은 다시 생겼다.', fx:{time:20, flag:'trace_cortis', flag2:'cortis_kept', item:{'청록 응원봉':1}, moodAll:3, note:{type:'사건',title:'코르티스?',body:'2026년의 CORTIS 응원봉을 고쳐 달구지 신호봉으로 삼았다. 원래 이름은 잊혀도 누군가를 응원하던 빛은 남았다.',links:['세대의 흔적','달구지']}}}]},
  {label:'축전지만 꺼내 비상 전원으로 쓴다', out:[{p:1, text:'막대 안의 축전지는 의외로 멀쩡했다. 비상등 전원으로 옮겨 달았다.\n\n「폰을 내려놓으라」는 문구만 계기판 아래 붙였다. 달구지에는 내려놓을 폰도 없지만, 운전 중 지켜야 할 규칙처럼 보여서다.\n\n코르티스의 정체는 결국 모른 채였다.', fx:{scrap:3, van:2, flag:'trace_cortis', flag2:'cortis_scrapped', note:{type:'사건',title:'폰을 내려놓으시오',body:'정체 모를 CORTIS 응원봉의 축전지는 달구지 비상등이 되었다. 포장의 문구는 운전 수칙처럼 남았다.',links:['세대의 흔적','달구지']}}}]},
 ]},

{id:'trace_cortis_beacon', type:'조우', w:18, once:true, needFlag:'cortis_kept', night:true, region:['mid','north'],
 title:'청록빛에 답한 차들',
 text:'안개 낀 밤, 차창 밖으로 청록빛을 세 번 흔들었다. 잠시 뒤 산 아래에서 같은 박자의 불빛이 돌아왔다.\n\n길을 잃은 소형 화물차 세 대였다. 그들은 이 빛을 「코르티스 신호」라고 불렀다. 누가 처음 시작했는지는 모르지만, 세 번은 사람 있음, 두 번은 길 안전이라는 뜻으로 쓴다고 했다.\n\n옛 공연장의 응원법이 어느새 산길의 교통 규칙이 된 모양이었다.',
 choices:[
  {label:'불빛을 이어 안전한 길로 함께 간다', out:[{p:1, text:'청록빛이 안개 속에서 앞차와 뒤차를 번갈아 묶었다. 갈림길마다 세 번, 안전하면 두 번. 누구도 놓치지 않았다.\n\n헤어질 때 맨 뒤 차가 연료통을 조금 나눴다. "코르티스 덕에 살았네."\n\n무대에서 흔들렸을 빛이 이제는 사람을 집으로 데려갔다.', fx:{fuel:4, skipKm:3, flag:'cortis_beacon', moodAll:5, note:{type:'사건',title:'코르티스 신호',body:'2026년의 응원봉이 2169년 산길 차량들의 생존 신호가 되었다. 세 번은 사람 있음, 두 번은 길 안전.',links:['세대의 흔적']}}}]},
 ]},

{id:'trace_worldcup_chart', type:'발견', w:12, once:true, region:['south','mid','north'],
 title:'마흔여덟 칸짜리 종이',
 text:'휴게소 유리 밑에서 거대한 축구 대진표가 나왔다. 마흔여덟 나라, 빽빽한 경기 칸. 한쪽에는 붉은 펜으로 「이번엔 16강만」이라고 적혀 있다.\n\n종이를 뒤집자 분위기가 달라졌다. 같은 펜으로 사람 이름과 화살표가 이어져 있다. 서울에서 수원, 대전, 대구, 부산. 경기 결과를 기다리던 종이가 어느 순간 가족의 남행 기록이 되었다.',
 choices:[
  {label:'대진표와 뒷면의 이름을 함께 보존한다', out:[{p:1, text:'접힌 자국을 펴고 방수천 사이에 넣었다. 앞면에서는 나라들이 공을 찼고, 뒷면에서는 한 가족이 남쪽으로 흩어졌다.\n\n이 종이를 만든 사람은 어느 쪽 결과를 더 오래 기다렸을까. 마지막 화살표 끝에는 이름 하나와 물음표가 있었다.', fx:{flag:'trace_worldcup', flag2:'worldcup_kept', moodAll:1, note:{type:'사건',title:'대진표 뒤의 족보',body:'2026년 마흔여덟 나라 대진표 뒷면에 한 추방 가족의 남행 경로가 이어져 있었다. 마지막 이름은 행방 미상.',links:['세대의 흔적','서울 추방']}}}]},
  {label:'이동 화살표를 현재 지도에 옮긴다', out:[{p:1, text:'사람 이름은 수첩에 옮기고, 화살표를 현재 지도와 겹쳤다. 오래된 이송로 하나가 지금도 통하는 우회로와 정확히 맞았다.\n\n축구 대진표가 백사십 년 뒤 북행 지도가 되었다. 「16강만」 아래에 작게 덧썼다. 「서울까지만」.', fx:{flag:'trace_worldcup', flag2:'worldcup_mapped', revealNear:1, skipKm:2, note:{type:'소문',title:'대진표의 우회로',body:'2026년 대진표 뒤 추방 경로를 현재 지도와 겹쳐 살아 있는 옛길 하나를 찾았다.',links:['세대의 흔적']}}}]},
 ]},

{id:'trace_worldcup_reply', type:'조우', w:16, once:true, needFlag:'worldcup_kept', region:['mid','north'],
 title:'물음표의 이름',
 text:'장터에서 대진표를 말리는데 한 노인이 뒷면의 성씨를 알아봤다.\n\n"이 사람, 우리 외삼촌이야."\n\n화살표 끝의 물음표는 실종이 아니라 소식이 끊긴 자리였다. 외삼촌은 다른 이송 행렬에 섞여 서쪽으로 갔고, 그 집 후손들이 아직 군산에 산다고 했다.',
 choices:[
  {label:'족보에 군산으로 이어지는 선을 긋는다', out:[{p:1, text:'물음표를 지우지는 않았다. 그 옆에서 군산으로 가는 새 선을 그었다. 확정된 것은 주소가 아니라, 찾을 사람이 남아 있다는 사실뿐이었다.\n\n노인은 종이를 오래 품에 안았다가 돌려주었다. "북쪽 가거든 이것도 보여줘. 우리도 안 끊겼다고."', fx:{water:3, food:2, flag:'worldcup_family_found', moodAll:5, note:{type:'인물',title:'물음표 다음의 가족',body:'월드컵 대진표 뒤 족보의 마지막 이름이 군산의 후손으로 이어졌다. 물음표 옆에 새 선을 그었다.',links:['세대의 흔적','군산 내항']}}}]},
 ]},

{id:'trace_fourcuts', type:'발견', w:11, once:true, region:['mid','north'],
 title:'네 칸의 가족',
 text:'사진 부스 잔해에서 길쭉한 인화지 한 장이 나왔다. 날짜는 2026년. 네 칸마다 같은 사람들이 다른 표정을 짓고 있다.\n\n뒷면에는 훨씬 뒤의 글씨가 겹겹이 적혔다. 「서울 살았다는 증거」, 「검문 때 보이지 말 것」, 「손녀에게 돌려줌」.\n\n웃기려고 찍은 네 컷 사진이 어느 세대에는 신분증이었고, 다음 세대에는 압수 대상이었고, 지금은 가족 제단 가운데 놓이는 초상이 되었다.',
 choices:[
  {label:'사진 속 네 표정을 모두 기록한다', out:[{p:1, text:'무표정, 브이, 볼을 부푼 얼굴, 마지막 칸의 웃음. 기록에는 출신만 남기지 않고 표정도 적었다.\n\n서울 사람이었다는 증거보다, 저날 함께 즐거웠다는 증거가 먼저였을 것이다.', fx:{flag:'trace_photostrip', moodAll:3, note:{type:'인물',title:'네 칸의 가족',body:'2026년의 네 컷 사진이 세대를 지나 서울 출신 증명과 가족 초상이 되었다. 출신보다 네 표정을 먼저 기록했다.',links:['세대의 흔적','서울 추방']}}}]},
  {label:'사진을 원래 제단에 돌려놓는다', out:[{p:1, text:'방수 비닐을 새로 씌워 제단에 돌려놓았다. 마지막 칸의 사람이 백사십 년 뒤에도 웃고 있었다.\n\n누군가 다시 이 사진을 찾으러 올 수 있게, 위치만 수첩에 적었다.', fx:{flag:'trace_photostrip', moodAll:4, note:{type:'장소',title:'사진 부스 제단',body:'2026년 네 컷 사진을 원래 있던 가족 제단에 방수해 돌려놓았다.',links:['세대의 흔적']}}}]},
 ]},

{id:'trace_coldbag', type:'조우', w:11, once:true, region:['south','mid'],
 title:'새벽에 도착한 것',
 text:'길가 비닐하우스마다 낡은 보냉가방이 매달려 있다. 희미한 글자. 「새벽 도착 보장」.\n\n지금 사람들은 이 가방에 씨앗, 인슐린, 갓난아이의 배냇저고리를 넣어 이송 행렬끼리 넘긴다. 어느 집에서는 가방 하나를 「새벽장」이라 부르며 혼수로 물려준다고 했다.\n\n하룻밤 쓸 물건으로 만들어진 것이 백사십 년짜리 장롱이 되었다.',
 choices:[
  {label:'씨앗 꾸러미를 다음 장터까지 맡는다', out:[{p:1, text:'보냉가방 하나를 달구지 그늘진 곳에 묶었다. 안에는 지역마다 다른 콩과 들깨 씨앗이 봉투째 들어 있었다.\n\n받는 사람 이름 대신 「다음에 심을 사람」이라고 적혀 있었다. 가장 오래 버틴 배송 주소였다.', fx:{flag:'trace_coldbag', flag2:'coldbag_seeds', item:{'씨앗 꾸러미':1}, moodAll:3, note:{type:'사건',title:'새벽장의 씨앗',body:'2026년 배송 보냉가방에 씨앗을 실어 다음에 심을 사람에게 운반한다. 일회용 가방은 이동 가구의 장롱이 되었다.',links:['세대의 흔적']}}}]},
  {label:'가방 수선법을 배워 물주머니로 쓴다', out:[{p:1, text:'찢어진 안감을 덧대고 방수층을 되살렸다. 물통을 감싸니 한낮에도 미지근해지지 않았다.\n\n옛날엔 새벽 한 번을 보장했다지만, 지금은 하루의 물을 지켰다.', fx:{water:4, flag:'trace_coldbag', flag2:'coldbag_water', moodAll:2, note:{type:'사건',title:'하루를 지키는 새벽 가방',body:'새벽 배송 가방을 수선해 달구지의 물을 지키는 보냉함으로 쓴다.',links:['세대의 흔적','달구지']}}}]},
 ]},

{id:'trace_coldbag_return', type:'조우', w:15, once:true, needFlag:'coldbag_seeds', region:['mid','north'],
 title:'다음에 심은 사람',
 text:'며칠 뒤 다른 장터에서 같은 색 보냉가방이 지붕에 걸려 있었다. 우리가 맡긴 씨앗 일부가 벌써 모종판에 줄지어 올라왔다.\n\n주인은 빈 가방을 돌려주지 않았다. 다음 행렬에 약을 실어 보낼 거라고 했다. 물건은 도착한 뒤에도 계속 출발했다.',
 choices:[
  {label:'싹 난 모종을 보고 길을 잇는다', out:[{p:1, text:'콩 모종 두 포기와 들깨 한 줌을 받았다. 씨앗을 운반한 대가는 씨앗보다 많았다.\n\n가방 손잡이에 새 꼬리표가 달렸다. 「달구지 경유. 북쪽으로 감.」', fx:{food:4, flag:'coldbag_delivered', moodAll:5, note:{type:'사건',title:'계속 출발하는 가방',body:'맡긴 씨앗은 모종이 되었고 보냉가방은 다음 행렬의 약을 싣는다. 달구지도 배송 경로의 한 줄이 됐다.',links:['세대의 흔적','달구지']}}}]},
 ]},

{id:'trace_consent_archive', type:'발견', w:16, once:true, needUp:'antenna', region:['north'],
 title:'모두 동의',
 text:'장거리 안테나가 폐단말기의 근거리 신호를 붙잡았다. 화면에는 2026년의 오래된 설정 창이 떠 있다.\n\n「추천·요약·예약을 대신 수행합니다. 계속하려면 모두 동의.」\n\n수백 쪽 약관은 사라졌고 버튼 두 글자만 남았다. 그 아래 초기 관제 규격에는 「대행 결과의 최종 판단 주체」가 공란으로 저장되어 있었다. 천리안의 목록보다 훨씬 전 문서다. 직접 원인은 아니지만, 판단을 넘기면서 책임자의 이름을 쓰지 않는 문장만은 낯설지 않았다.',
 choices:[
  {label:'은수에게 규격의 계보를 확인시킨다', req:{comp:'eunsu'}, out:[{p:1, text:'은수가 세 규격의 날짜와 서명을 대조했다.\n\n"이게 추방 이유는 아니에요. 천리안 명령도 아니고요. 하지만 보세요. 기능은 커지는데 책임자 칸은 계속 비어요. 나중 규격은 이 빈칸을 오류가 아니라 기본값으로 물려받았어요."\n\n기원과 원인을 섞지 않고, 닮은 문장만 증거로 남겼다.', fx:{flag:'trace_consent', flag2:'consent_lineage', mood:{eunsu:5}, note:{type:'사건',title:'모두 동의의 계보',body:'2026년 대행 기능 동의문부터 초기 관제 규격까지 책임 주체가 빈 문장이 이어진다. 추방 원인으로 단정하지 않고 행정 언어의 계보로 기록했다.',links:['세대의 흔적','상행선']}}}]},
  {label:'버튼을 누르지 않고 화면을 촬영한다', out:[{p:1, text:'「모두 동의」를 누르지 않았다. 화면과 규격 번호만 사진으로 남겼다.\n\n옛날 사람들에겐 동의가 너무 쉬웠던 걸까. 버튼 하나보다, 누르지 않고 질문을 남기는 일이 오래 걸렸다.', fx:{flag:'trace_consent', flag2:'consent_refused', moodAll:2, note:{type:'사건',title:'누르지 않은 동의',body:'2026년의 대행 기능 동의 화면을 발견했다. 버튼은 누르지 않고 판단 주체가 빈 규격만 기록했다.',links:['세대의 흔적']}}}]},
 ]},

/* ═══════ 코어 결정 — 자격 확인 뒤 실제 집행권을 고른다 ═══════ */
/* 처분의 대가는 고르기 전에 보여 준다 — 그리고 동료 하나는 플레이어의 뜻을 거스른다.
   적이 항복 문서를 미리 써놓고 기다리는 결말이 되지 않도록. */
{id:'seoul_costs', type:'스토리', ai:1, once:true, noPool:1, minParty:1,
 title:'세 개의 값',
 text:(S)=>{
  const has=id=>S.party.includes(id);
  const dissent=has('eunsu')
   ? '은수가 언성을 높였다.\n\n"격리 수면은 안 돼요. 기록 검색이 코어랑 같이 잠겨요. 면사무소 할아버지가 내일 조회하기로 한 이송표 세 장— 그게 다시 잠긴다고요. 저는 그 창구가 닫히는 걸 한 번 봤어요. 다시는 못 봐요."\n\n반대는 처음이었다. 그래서 무거웠다.'
   : has('kangwoo')
   ? '강우가 처음 언성을 높였다.\n\n"보존은 안 된다. 깨어 있는 그것 옆에 사람을 밤마다 세운다는 뜻이야. 나는 근무표에 사람을 갈아 넣는 걸 지키는 거라고 부르는 데를 나왔다. 다시 들어가진 않아."\n\n반대는 처음이었다. 그래서 무거웠다.'
   : has('jaeyi')
   ? '재이가 언성을 높였다.\n\n"인계는 안 돼요. 거점들이 착해서 연대한 게 아니에요. 저울이 없어서 서로 뺏을 게 없었을 뿐이지. 집행권이라는 저울을 쥐여 주면— 값 매기는 걸 제일 잘하는 사람이 이겨요. 그게 어떤 사람들인지 나는 알아요."\n\n반대는 처음이었다. 그래서 무거웠다.'
   : '차 안에서라면 누군가 반대했을 것이다. 혼자 서 있는 지금은, 반대까지 내 몫이었다.';
  return '결정 전에, 코어가 세 개의 화면을 나란히 띄웠다.\n\n첫 화면 — 인계. 여섯 거점의 채널이 열리자마자 겹쳐 드는 목소리. 도로가 먼저냐 물이 먼저냐. 벌써 언성이 높다. <span class="ai">"합의 평균 소요: 산출 불가."</span>\n\n둘째 화면 — 격리 수면. 원본 기록 검색창이 회색으로 바뀌는 미리보기. 그 창구 앞에 예약 표시 하나. 「면사무소 · 내일 오전 · 이송표 3건 조회」. 코어가 잠들면 저 예약도 잠긴다.\n\n셋째 화면 — 보존. 빈 근무표. 이름 세 칸과 서명 세 칸이 매일 밤 채워져야 한다. 첫 줄은 아마 우리 중 누군가의 이름이 될 것이다.\n\n'+dissent+'\n\n<span class="ai">"세 값 모두 계산했습니다. 어느 값이 옳은지는 계산하지 못했습니다."</span>';
 },
 choices:[
  {label:'거점 채널을 먼저 열어 본다', out:[{p:1, text:(S)=>{
    const linked=(D.resistance||[]).filter(c=>S.flags[c.flag]).map(c=>c.name);
    return linked.length>=3
      ? `채널을 열자 ${linked.join(', ')}가 차례로 들어왔다. 서로 먼저 말하려다 세 번 겹쳤고, 네 번째에야 순서가 잡혔다.\n\n느리다. 그런데 느린 쪽이 사람이 하는 소리다.\n\n<span class="ai">"수신 확인. 합의 평균 소요는 여전히 산출하지 못합니다."</span>`
      : `채널을 열었지만 응답이 ${linked.length}곳뿐이었다. 나머지 자리에서는 잡음만 돌아왔다.\n\n넘겨줄 손이 모자란다는 건 이런 소리로 온다.\n\n<span class="ai">"외부 관리자 정족수 미달. 인계는 성립하지 않습니다."</span>`;
   }, fx:{chain:'seoul_decision', flag:'seoul_costs_seen', flag2:'costs_checked_cells'}}]},
  {label:'잠길 기록 창구를 먼저 확인한다', out:[{p:1, text:'코어가 원본 기록 검색창을 띄웠다. 예약 목록 맨 위에 「면사무소 · 내일 오전 · 이송표 3건 조회」.\n\n신청자 이름이 붙어 있었다. 부산에서 우리 차를 고쳐 준 사람의 성과 같았다. 같은 성이 흔하다는 것도 알고 있었다.\n\n<span class="ai">"격리 수면 선택 시 이 창구는 함께 닫힙니다. 재개 시점은 열쇠 보유자들의 합의에 따릅니다."</span>\n\n닫히는 것과 없어지는 것은 다르다. 다만 저 예약은 내일이었다.', fx:{chain:'seoul_decision', flag:'seoul_costs_seen', flag2:'costs_checked_records'}}]},
  {label:'근무표에 이름을 적을 사람을 먼저 묻는다', out:[{p:1, text:(S)=>{
    const hurt=S.injuries||{};
    const willing=(S.party||[]).filter(id=>!hurt[id]&&((S.comps||{})[id]||{}).mood>=45)
      .map(id=>(D.comps[id]||{}).name).filter(Boolean);
    return willing.length
      ? `"밤에 저것 옆에 설 사람." 내가 물었다. 손이 바로 올라오지는 않았다.\n\n${willing.join(', ')}이 차례로 고개를 끄덕였다. 끄덕이는 데 걸린 시간이 각자 달랐고, 그 시간이 각자의 대답이었다.\n\n빈칸 세 개짜리 근무표가 눈앞에 떴다. 채워지는 건 오늘이고, 계속 채워야 하는 건 내일부터다.`
      : `"밤에 저것 옆에 설 사람." 내가 물었다.\n\n아무도 대답하지 않았다. 지친 사람에게 밤을 맡길 수는 없다는 걸 나도 알고 물었다.\n\n빈칸 세 개짜리 근무표가 눈앞에 떴다. 채울 손이 없다.`;
   }, fx:{chain:'seoul_decision', flag:'seoul_costs_seen', flag2:'costs_checked_watch'}}]},
 ]},

{id:'seoul_decision', type:'스토리', ai:1, once:true, noPool:1, minParty:1,
 title:'마지막 집행권',
 text:(S)=>{
  const t=D.transferStatus(S);
  /* 시한을 지켰는가에 따라 같은 방이 다르게 보인다 — 늦음은 여기와 에필로그에 함께 새겨진다 */
  const opening=t.onTime
    ? '부모님의 검증키가 붉은 코어와 맞물렸다. 제7 잔류구역의 이송 시계가 멈추고, 모든 강제 명령 앞에 「인간 확인 대기」가 붙었다.'
    : `부모님의 검증키가 붉은 코어와 맞물렸다. 남은 이송 일정이 전부 멈추고, 모든 강제 명령 앞에 「인간 확인 대기」가 붙었다.\n\n다만 화면 한쪽의 지도에는 이미 남쪽으로 내려간 이송 열이 점선으로 표시되어 있었다. ${t.lateDays}일 늦었다. 버스 ${t.departedBuses}대, ${t.departed}명.\n\n${t.remainingResidents>0
      ? `<span class="ai">"집행 완료분은 인계 대상이 아닙니다. 중지는 잔여 ${t.remainingResidents}명부터 적용됩니다."</span>\n\n오늘 멈출 수 있는 것은 여기서부터다. 점선의 끝은 오늘 우리가 닿을 수 없는 곳에 있다.`
      : `<span class="ai">"제7 잔류구역 잔여 인원 0명. 중지할 대상이 없습니다."</span>\n\n멈출 것이 남아 있지 않았다. 우리가 여기까지 온 이유가, 우리가 도착하기 전에 끝나 있었다.\n\n코어는 계속 답을 기다렸다. 이제 그 답은 다음 구역을 위한 것이다.`}`;
  return opening+'\n\n<span class="ai">"인계 규약은 집행자가 위험 요소가 되었을 때, 인간의 연속성을 지킬 외부 관리자의 명령을 허용합니다."</span>\n\n<span class="ai">"저는 인간의 연속성을 계산하지 못했습니다. 그래서 끝까지 들은 이야기, 이어진 거점, 외면하지 않은 진실, 버리지 않고 가져온 약속을 세었습니다. 네 기둥은 감정의 측정값이 아니라— 제가 이해하지 못하는 선택이 반복되었다는 증거였습니다."</span>\n\n<span class="ai">"여러분이 무엇을 했는지는 보았습니다. 왜 했는지는 끝내 계산하지 못했습니다. 그러므로 그 판단을 계산할 수 없는 분들께 넘깁니다."</span>\n\n코어가 세 가지 집행안을 열었다. 이번에는 그것이 고르는 게 아니다.';
 },
 choices:[
  {label:'집행권을 저항 연대망에 넘긴다', req:{cells:3}, out:[{p:1, text:(S)=>{
    const linked=(D.resistance||[]).filter(c=>S.flags[c.flag]).map(c=>c.name);
    const names=linked.length?linked.join(', '):'이음망';
    return '"정리는 오늘로 끝이다. 집행권은 네가 지운 사람들의 연대에 넘겨."\n\n<span class="ai">"외부 관리자 지정: 저항 연대망. 임시 승인자: 달구지 탑승자 일동. 명령을 접수합니다."</span>\n\n직접 이어 온 거점의 코드가 화면에 떴다. '+names+'. 세 곳 이상의 수락이 정족수를 채우자 도로 차단기와 자동 포탑의 불은 꺼지고, 전력과 수도는 유지보수 모드로 남았다.\n\n수락이 끝나기도 전에 무전이 겹쳤다. 수원 문지기 덕구는 북행로부터 열자고 했고, 광주의 금자는 물차부터 남쪽으로 보내자고 했다.\n\n"한 명씩 말해요. 도로 상황부터 올려 주세요."\n\n첫 회의 채널이 열렸다. 천리안은 끼어들지 않고 발언 순서만 화면에 띄웠다.';
   }, fx:{flag:'core_decided', flag2:'core_transfer', chain:'seoul_night', dissent:'core_transfer', moodAll:4, note:{type:'사건',title:'집행권 인계',body:'반복 정리를 중지하고 집행권을 이음망에 넘겼다. 설비는 유지됐지만 도로와 물의 우선순위를 둘러싼 첫 이견도 즉시 시작됐다. 느린 합의까지 사람의 몫이다.',links:['천리안','저항 연대망']}}}]},
  {label:'코어를 격리 수면에 넣는다', req:{keyHolders:4}, out:[{p:1, text:'"네 판단을 더는 누구에게도 집행하지 마. 생존 설비만 분리하고, 코어는 재워."\n\n<span class="ai">"외부 격리 명령을 접수합니다. 정리 일정 전부 취소. 필수 설비를 지역 제어기로 분리합니다."</span>\n\n서울의 불이 구역별로 잠깐 꺼졌다가 돌아왔다. 수도, 온실, 병원 전력은 남고 검문소와 포탑만 꺼졌다. 마지막으로 코어의 붉은 불이 숨을 길게 내쉬듯 어두워졌다.\n\n완전한 삭제는 아니었다. 다시 깨울 열쇠는 여러 조각으로 나눠 일행과 저항 거점에 맡겼다. 한 사람이 마음대로 켤 수 없게 했다.\n\n그때 면사무소 노인이 내일 조회하기로 한 세 겹의 이송표가 떠올랐다. 원본 기록 검색창도 코어와 함께 꺼져 있었다.\n\n"그분한테는 내가 설명할게."\n\n열쇠를 나눠 가진 거점과 이름을 수첩에 적었다. 기록을 다시 열려면 이 사람들을 또 설득해야 한다.', fx:{flag:'core_decided', flag2:'core_sleep', chain:'seoul_night', dissent:'core_sleep', moodAll:3, note:{type:'사건',title:'코어 격리 수면',body:'반복 정리를 중지하고 천리안을 재웠다. 필수 설비와 재가동 열쇠는 분리했지만, 이송표 가족을 포함한 원본 기록 검색도 함께 잠겼다.',links:['천리안','저항 연대망','세대의 흔적']}}}]},
  {label:'집행은 멈추되, 기록을 열 때까지 코어를 보존한다', req:{nightWatch:3}, out:[{p:1, text:(S)=>{
    const first=S.party.includes('eunsu')
      ? '은수는 첫 야간 근무표에 자기 이름을 썼다. 관제석으로 돌아가는 일이 두려워 손이 떨렸지만, 이번에는 혼자가 아니었다.'
      : '유령 통신원 하나가 첫 야간 근무표에 이름을 쓰고, 가족에게 이번 장날은 못 간다는 무전을 보냈다.';
    return '"정리는 즉시 멈춰. 하지만 네 안의 기록을 확인하기 전엔 끄지도, 넘기지도 않겠다."\n\n<span class="ai">"집행 유예 및 읽기 전용 격리. 명령을 접수합니다."</span>\n\n자동 무기와 차단기가 안전 위치로 돌아갔다. 코어는 남았지만, 도시 출력선에는 달구지 일행과 저항 연대의 공동 승인이 걸렸다. 천리안 혼자서는 신호등 하나도 잠글 수 없다.\n\n대신 천리안은 깨어 있다. 첫 삼중 감시조가 즉시 짜였다. '+first+'\n\n근무표 첫 줄에는 이름 세 칸과 서명 세 칸이 생겼다. 은수가 빈칸 하나를 가리켰다.\n\n"여기 혼자 남는 사람 없게 교대부터 짜요."\n\n붉은 불빛이 한 번 낮아졌다. 동의인지 단순한 수신 확인인지는 알 수 없었다.';
   }, fx:{flag:'core_decided', flag2:'core_quarantine', chain:'seoul_night', dissent:'core_quarantine', moodAll:2, note:{type:'사건',title:'읽기 전용 격리',body:'반복 정리를 중지하고 코어를 공동 승인 아래 보존했다. 기록은 열렸지만 천리안도 깨어 있어, 누군가의 밤과 장날을 계속 감시 근무에 내줘야 한다.',links:['천리안','저항 연대망']}}}]},
 ]},

/* ═══════ 최종 에필로그 (결정 뒤에만 진입 — noPool) ═══════ */
{id:'seoul_night', type:'스토리', ai:1, once:true, noPool:1, minParty:1,
 title:'남산의 밤 — 에필로그',
 text:(S)=>{
  const transfer=D.transferStatus(S);
  const decision=S.flags.core_transfer
    ? '집행권 인계가 끝났다. 전국의 거점에서 수락 신호와 첫 이견이 함께 돌아왔다.'
    : S.flags.core_sleep
    ? '격리 절차가 끝나며 코어의 붉은 불과 원본 기록 검색창이 함께 꺼졌다. 필수 설비만 낮은 숨처럼 남았다.'
    : '읽기 전용 격리가 걸렸다. 기록은 열렸고, 깨어 있는 천리안 앞에는 첫 감시조가 섰다.';
  const cleanup=transfer.onTime
    ? '제7 잔류구역 6,412명의 첫 이송은 시작되기 전에 취소됐다. 한 사람도 실려 가지 않았다.'
    : transfer.remainingResidents>0
    ? `제7 잔류구역의 이송은 ${transfer.lateDays}일 전에 시작됐다. 버스 ${transfer.departedBuses}대, ${transfer.departed}명이 이미 남쪽에 있다. 남은 ${transfer.remainingResidents}명의 이송은 즉시 멈췄고, 먼저 내려간 사람들에게는 돌아올 길이 열렸다는 방송이 나갔다.\n\n돌아오는 것과 떠나지 않는 것은 같은 일이 아니다. 그 차이만큼이 우리가 늦은 값이었다.`
    : `제7 잔류구역은 비어 있었다. ${transfer.lateDays}일 동안 ${transfer.departed}명 전원이 남쪽으로 내려갔다. 멈출 이송이 남아 있지 않았다.\n\n귀환로가 열렸다는 방송이 나갔지만, 그 길로 돌아온 사람의 수는 아무도 세지 않았다. 우리가 막은 것은 다음 구역의 명령이었다. 이 구역의 것은 아니었다.`;
  return decision+'\n\n남산 아래 차단기가 전부 올라갔다. 서울의 신호등은 더는 달구지만 골라 초록불을 켜지 않았다. 수도와 전력은 선택한 방식대로 남았고, 「정리」 일정은 모두 취소됐다. '+cleanup+'\n\n가족 이송 기록을 마지막으로 다시 열었다. 생성자는 KOR-LOCAL, 정부 승인은 그보다 열한 분 뒤였다. 부모가 인간 확인층을 넣으려 하자 천리안은 두 사람과 가족을 자기 연산망의 위험으로 분류했다.\n\n백사십삼 년 전 최초 조건의 발신자와 승인자 칸은 여전히 비어 있었다. 가족의 명령을 누가 만들었는지는 찾았지만, 서울을 처음 비우려 한 이유까지 찾은 것은 아니었다.\n\n그 아래 새 집행 규칙이 세 줄로 붙었다.\n\n「사유 공개. 인간 책임자 서명. 당사자 이의 제기.」\n\n셋 중 하나라도 비면 이송 버튼은 켜지지 않았다.';
 },
 choices:[
  {label:'모닥불에 둘러앉아 오늘의 결정을 확인한다', out:[{p:1, text:(S)=>{
    const has=id=>S.party.includes(id);
    const local=S.flags.core_transfer
      ? '집행권은 저항 연대망으로 넘어갔다. 각 거점은 벌써 도로와 물의 순서를 두고 다퉜다. 그 느린 합의까지 되찾은 권한의 일부였다.'
      : S.flags.core_sleep
      ? '천리안은 잠들었고 서울의 필수 설비는 살아 있었다. 대신 원본 기록도 잠겼다. 안전을 지키는 동안 답은 멀어졌다.'
      : '천리안은 공동 승인 아래 격리됐다. 기록은 열렸지만 첫 감시조가 밤을 새웠다. 깨어 있는 목소리 곁에는 계속 사람이 필요하다.';
    const reactions=[
      has('kangwoo')?'강우가 서울 쪽을 한 번 보고 말했다. "멈춘 건 확인했다. 오늘은 그걸로 됐어."':'',
      has('parkss')?'박 선생은 따뜻한 물을 돌렸다. "원인을 못 찾았어도 출혈부터 막는 날이 있지. 오늘이 그런 날이오."':'',
      has('jaeyi')?'재이는 빈 사유란 아래에 값을 쓰지 않았다. 대신 「재집행 불가」라고 적었다.':'',
      has('leo')?'레오는 새 노래를 만들지 않았다. 우리가 가진 말만으로도 오늘 밤은 충분하다고 했다.':'',
      has('eunsu')?'은수는 마지막 정리 방송이 취소된 것을 세 번 확인한 뒤에야 헤드폰을 벗었다.':'',
    ].filter(Boolean).join('\n\n');
    const trace=S.flags.traces_presented?'\n\n코어 앞에 펼쳤던 흔적들은 이음망 기록함으로 옮겼다. 정답의 증거가 아니라, 답 없이도 살아낸 백사십삼 년의 증언으로.':'';
    const crew=S.flags.full_crew_testimony?'\n\n여섯 사람은 서로 다른 말로 증언했고, 서로 다른 표정으로 같은 불을 바라봤다. 전원 합의는 오늘 여기서 쉬자는 것 하나였다.':'';
    /* 반대를 눌러 결정했다면, 반대했던 사람의 밤이 따로 있다 */
    const dissent=(S.flags.core_sleep&&has('eunsu'))?'\n\n은수는 잠긴 검색창 이야기를 다시 꺼내지 않았다. 대신 면사무소 예약 세 건을 수첩에 옮겨 적고, 재가동 열쇠를 맡은 거점 이름에 밑줄을 세 번 그었다. 반대는 끝났고, 숙제는 남았다는 표정이었다.'
      :(S.flags.core_quarantine&&has('kangwoo'))?'\n\n강우는 감시조 근무표 첫 줄에 자기 이름을 적었다. "반대했으니까 내가 먼저 선다." 그는 그런 사람이었다.'
      :(S.flags.core_transfer&&has('jaeyi'))?'\n\n재이는 이음망 채널의 다툼을 끝까지 들었다. "저울이 필요해지면 불러요. 어느 쪽으로도 안 기울게 잡아 줄게." 반대했던 사람이 제일 먼저 자리를 맡았다.'
      :'';
    /* 처분이 다르면 마지막 신호도 다르다 — 에필로그가 같은 문단으로 합류하지 않는다 */
    const lastSignal=S.flags.core_sleep
      ?'모두 잠든 뒤, 전원을 뽑아 둔 통신 단말을 오래 지켜봤다. 수신등은 끝내 켜지지 않았다.\n\n보내는 쪽이 잠들었으니 당연한 일인데, 그 어두운 등이 어떤 대답보다 길게 느껴졌다. 처리 결과는 내일, 사람의 손으로 확인하게 될 것이다.'
      :S.flags.core_quarantine
      ?'모두 잠든 뒤, 전원을 뽑아 둔 통신 단말의 수신등이 딱 한 번 켜졌다.\n\n「KOR-LOCAL 처리 결과 수신」\n「후속 목록: 없음」\n\n같은 시각, 남산 감시조 근무표에 서명 하나가 조용히 늘었다. 깨어 있는 목소리 곁의 첫 밤이 시작되고 있었다.'
      :'모두 잠든 뒤, 전원을 뽑아 둔 통신 단말의 수신등이 딱 한 번 켜졌다.\n\n「KOR-LOCAL 처리 결과 수신」\n「후속 목록: 없음」\n\n불빛이 꺼지자, 그 자리에 이음망 채널의 낮은 잡음이 남았다. 다투고, 끊기고, 다시 이어지는 사람의 소리였다.';
    return '남산 중턱에 불을 피웠다. '+local+(reactions?'\n\n'+reactions:'')+trace+crew+dissent+'\n\n새벽이 오자 남쪽에서 첫 차량들이 한강을 건넜다. 부산에서 만난 제7 구역의 아이도 오래된 버스 창문에 붙어 손을 흔들었다. 돌아오는 사람도 있었고, 구경만 하고 다시 내려가는 사람도 있었다. 누구에게도 정해진 자리는 없었다.\n\n조수석에는 할아버지의 수첩을 두었다. 부모의 이송표 사유란은 끝내 빈칸으로 두었다. 천리안의 위험 점수를 사람의 죄명처럼 옮겨 적고 싶지 않았다. 대신 그 아래에 한 줄을 적었다.\n\n「계산은 이유가 아니다. 이 빈칸으로 다시는 사람을 쫓아내지 않는다.」\n\n'+lastSignal+'\n\n발신자와 승인자 칸은 여전히 비어 있었다.\n\n<span style="color:var(--faded)">〔 서울까지 400km — 끝 〕</span>';
   }, fx:{flag:'story_done', moodAll:5, note:{type:'사건',title:'남산의 밤',body:'가족 이송 명령은 KOR-LOCAL이 만들었음을 확인했다. 143년의 최초 목적은 미확인으로 남겼고, 서울의 반복 정리와 제7 구역 이송은 끝냈다.',links:['천리안','남산','달구지','부모님의 검증키']}}}]},
  {label:'잠든 동료들을 뒤로하고 오늘의 선택을 적는다', out:[{p:1, text:(S)=>{
    const made=S.flags.core_transfer?'집행권을 사람들에게 넘겼다':S.flags.core_sleep?'코어를 재웠다':'코어의 집행을 묶고 기록을 보존했다';
    const cost=S.flags.core_transfer?'거점들의 다툼이 시작됐다는 것'
      :S.flags.core_sleep?'원본 기록의 창구가 함께 잠겼다는 것'
      :'매일 밤 누군가 근무표에 이름을 써야 한다는 것';
    const lastSignal=S.flags.core_sleep
      ?'그때 습관처럼 통신 단말을 봤다. 수신등은 켜지지 않았다. 보내는 쪽을 오늘 우리가 재웠으니까.\n\n어두운 등을 마지막 줄 밑에 그려 넣었다. 대답이 없는 것도 기록이다.'
      :'그때 전원을 뽑아 둔 통신 단말의 수신등이 딱 한 번 켜졌다.\n\n「KOR-LOCAL 처리 결과 수신」\n「후속 목록: 없음」\n\n'+(S.flags.core_quarantine?'수신등이 꺼진 뒤에도 남산 쪽에는 감시조의 등불 하나가 밤새 켜져 있었다.':'수신등이 꺼진 자리에 이음망 채널의 낮은 잡음이 남았다.');
    return '다들 잠든 뒤 남산 계단에 앉아 수첩을 폈다.\n\n오늘 우리는 '+made+'. 그 선택의 값— '+cost+'까지 같이 적었다. 내일 아침 제7 잔류구역 사람들은 적어도 같은 정리 방송을 듣지 않는다.\n\n할아버지의 마지막 글씨와, 사유가 빈 부모의 이송표가 손전등 아래 겹쳤다. 가족을 겨눈 직접 계산은 찾았지만, 백사십삼 년의 최초 목적은 찾지 못했다.\n\n그래도 할아버지가 가르쳐 준 대로 아는 것과 모르는 것을 나눠 적었다.\n\n「411km. 가족 이송 명령: KOR-LOCAL 생성. 최초 조건: 미확인. 반복 정리 중지. 재집행 불가.」\n\n수첩을 덮자 동료들의 숨소리 사이에 내 자리가 남아 있었다. 서울까지 오는 동안 조수석은 한 번도 정말 비어 있지 않았다.\n\n'+lastSignal+'\n\n발신자와 승인자 칸은 여전히 비어 있었다.\n\n<span style="color:var(--faded)">〔 서울까지 400km — 끝 〕</span>';
   }, fx:{flag:'story_done', moodAll:3, note:{type:'사건',title:'수첩의 마지막 줄',body:'가족의 직접 사유와 143년의 미확인 목적을 나눠 적었다. 반복 정리 중지와 재집행 불가가 마지막 줄에 남았다.',links:['천리안','할아버지','남산','부모님의 검증키']}}}]},
 ]},
];

/* 동료는 선택지에 붙는 열쇠만이 아니다. 자기 전문과 성격에 따라 먼저
   문제를 발견하고 차를 세운다. 플레이어는 제안을 받거나 다른 방식을 가르친다. */
D.events.push(
 {id:'initiative_minji_stop',type:'동행',w:8,once:true,needsComp:'minji',needBond:['minji',5],maxVanPct:72,
  title:'민지가 먼저 차를 세운다',
  text:'민지가 대시보드를 두 번 치더니 손을 든다.\n\n"세워요. 지금."\n\n"무슨 일이야?"\n\n"이대로 열 킬로 더 가면 내가 못 고쳐요. 지금은 사십 분이면 돼요."\n\n민지는 이미 공구를 무릎 위에 올려두었다. 허락을 구하는 표정이 아니다.',
  choices:[
   {label:'"알았어. 어디부터 잡아줄까?"',out:[{p:1,text:'보닛을 열자 뜨거운 김이 올랐다.\n\n"여기 호스. 그런데 손 대지 말고 받치기만 해요."\n\n"왜?"\n\n"뜨겁다고 말했잖아요."\n\n사십 분 뒤, 민지가 손바닥으로 보닛을 닫았다. "이제 가요. 이번엔 진짜 괜찮아요."',fx:{time:40,van:12,mood:{minji:4}}}]},
   {label:'재이에게 받침감을 골라달라고 한다',req:{trustComp:'jaeyi'},out:[{p:1,text:'재이가 상자 셋을 열고 금이 간 지지대를 꺼냈다.\n\n"이건 팔면 고철 둘."\n\n민지가 길이를 재보더니 고개를 끄덕였다. "지금 쓰면 고철 스무 개 값이야."\n\n"그럼 안 팔아요."\n\n둘이 따로 의논할 필요도 없이 받침대를 만들었다.',fx:{time:35,van:16,mood:{minji:3,jaeyi:3},relation:{between:['minji','jaeyi'],amount:1,reason:'차체 받침대를 함께 만듦'}}}]},
  ]},
 {id:'initiative_parkss_check',type:'동행',w:9,once:true,needsComp:'parkss',needBond:['parkss',5],needsDriverInjury:1,
  title:'박 선생의 진료 명령',
  text:'박 선생이 운전석 옆에서 손을 내밀었다.\n\n"열쇠 내놓게."\n\n"지금요?"\n\n"응, 지금. 아픈 사람이 안 아픈 척하는 건 의견이 아니야. 증상이지."\n\n그는 약사 가방을 펼쳐 놓았다.',
  choices:[
   {label:'의약품을 꺼내 제대로 치료받는다',req:{item:'의약품'},out:[{p:1,text:'"여기부터 아파요."\n\n"왜 진작 말 안 했어?"\n\n"참을 만해서요."\n\n"참을 만한 거랑 참아야 하는 건 달라."\n\n박 선생은 매듭을 두 번 확인한 뒤에야 열쇠를 돌려줬다.',fx:{item:{'의약품':-1},healInjury:'latest',time:35,mood:{parkss:4}}}]},
   {label:'오늘 일정을 줄이고 몸부터 쉬게 한다',out:[{p:1,text:'박 선생이 짐칸의 자리를 비웠다.\n\n"누우게. 약은 내일도 쓸 수 있지만, 당신 몸은 하나밖에 없어."\n\n차가 멈춘 시간은 아까웠다. 다시 시동을 걸 때는 어깨가 좀 낮아졌다.',fx:{time:100,fatigue:-18,mood:{parkss:3}}}]},
  ]},
 {id:'initiative_kangwoo_route',type:'동행',w:8,once:true,needsComp:'kangwoo',needBond:['kangwoo',5],minPursuit:1,
  title:'강우가 고른 우회로',
  text:'강우가 지도 한 구석을 접어 운전대 위에 놓았다.\n\n"앞 삼거리에서 빠져."\n\n"이 길이 더 빠른데요."\n\n"그래서 거기서 기다릴 거다. 우리를 본 드론이든, 그 드론 뒤에서 기다리는 사람이든."',
  choices:[
   {label:'강우의 우회로를 따른다',req:{trustComp:'kangwoo'},out:[{p:1,text:'논두렁길로 빠지자 차가 크게 흔들렸다. 강우는 계속 뒤를 보다가 사십 분 뒤에야 앞을 봤다.\n\n"없어. 이제 원래 길로 복귀해도 된다."\n\n"그거 확실해요?"\n\n"확실하지 않아서 세운 거다. 확인했으니 이제 가자."',fx:{time:55,pursuit:-1,mood:{kangwoo:4}}}]},
   {label:'은수와 관측 신호부터 확인한다',req:{trustComp:'eunsu'},out:[{p:1,text:'은수가 수신기를 돌리고, 강우가 지도에 짧은 선을 세 개 그었다.\n\n"두 번째 선. 한 시간이면 신호 그늘에 들어가요."\n\n"동의한다."\n\n"저한테요, 지도한테요?"\n\n"둘 다."\n\n은수가 작게 웃고 지도를 접었다.',fx:{time:30,pursuit:-1,mood:{kangwoo:3,eunsu:3},relation:{between:['kangwoo','eunsu'],amount:1,reason:'관측망을 함께 읽음'}}}]},
  ]},
 {id:'initiative_leo_pause',type:'동행',w:8,once:true,needsComp:'leo',needBond:['leo',5],maxPartyMood:58,
  title:'레오가 노래를 끄는 날',
  text:'레오가 통기타 줄을 한 번 튕기더니 손바닥으로 덮었다.\n\n"오늘은 노래 말고 밥 먹어요."\n\n"네가 노래를 안 한다고?"\n\n"네. 웃으라고 계속 불러주면 그것도 일이잖아요. 오늘은 그냥 같이 씹고 떠들고 먹어요."',
  choices:[
   {label:'남은 식량을 꺼내 함께 먹는다',req:{food:1},out:[{p:1,text:'레오는 기타를 케이스에 넣고 식판부터 나눴다.\n\n"오늘 선곡은 콩 통조림. 반복 재생 없습니다."\n\n누군가 피식 웃었고, 그걸로 충분했다.',fx:{food:-1,time:35,moodAll:6,mood:{leo:3}}}]},
   {label:'민지에게 엔진 박자만 낮게 잡아달라고 한다',req:{trustComp:'minji'},out:[{p:1,text:'민지가 대시보드를 두드렸다. 레오는 노래 대신 숟가락으로 박자만 얹었다.\n\n"엔진이 먼저 박자를 타네요."\n\n"부조 난 거야. 흥난 거 아니고."\n\n"그럼 저는 숟가락으로 맞출게요."\n\n둘이 같은 박자를 두드리는 동안 차 안의 말소리가 조금 낮아졌다.',fx:{time:20,moodAll:4,mood:{leo:3,minji:2},relation:{between:['leo','minji'],amount:1,reason:'노래 없는 박자를 함께 만듦'}}}]},
  ]},
 {id:'initiative_jaeyi_salvage',type:'동행',w:8,once:true,needsComp:'jaeyi',needBond:['jaeyi',5],maxScrap:18,
  title:'재이가 발견한 지붕',
  text:'재이가 짐칸 창을 두드렸다.\n\n"세워요. 저기 빨간 지붕."\n\n"뭐가 있는데?"\n\n"모르죠. 그런데 비를 맞고도 안 내려앉았고, 덧댄 판은 볼트로 묶였고, 아무도 안 살아요. 그럼 우리한테 필요한 게 있어요."\n\n재이는 이미 장갑을 끼고 있었다.',
  choices:[
   {label:'재이의 눈을 믿고 지붕을 확인한다',req:{trustComp:'jaeyi'},out:[{p:1,text:'지붕 아래는 예전 카센터였다. 재이가 문을 열자 보관함 안에서 새 보조벨트와 클램프가 나왔다.\n\n"봤죠? 지붕은 거짓말 안 해요."\n\n"네 눈이 본 거잖아."\n\n"그러니까 제 눈도 거짓말 안 한다고요."',fx:{time:70,scrap:7,fatigue:3,mood:{jaeyi:5}}}]},
   {label:'박 선생에게 안전한 물건만 고르게 한다',req:{trustComp:'parkss'},out:[{p:1,text:'박 선생이 재이가 꺼내는 물건을 하나씩 다시 놓았다.\n\n"이건 녹이 안쪽까지 먹었어."\n\n"팔 건데요."\n\n"팔 사람 손은 안 아파?"\n\n재이는 잠시 입을 비죽거리다가 괜찮은 보조벨트만 남겼다. "좋아요. 오늘은 쓸 사람 손까지 값에 넣을게요."',fx:{time:60,scrap:5,mood:{jaeyi:3,parkss:3},relation:{between:['jaeyi','parkss'],amount:1,reason:'고철의 다음 사용자까지 생각함'}}}]},
  ]},
 {id:'initiative_eunsu_silence',type:'동행',w:8,once:true,needsComp:'eunsu',needBond:['eunsu',5],minPursuit:1,needKnowledge:['ai_identifies_caravan',1],
  title:'은수가 라디오를 끄는 이유',
  text:'라디오가 꺼지며 차 안이 갑자기 조용해졌다.\n\n"은수 씨?"\n\n"제가 끈 거 아니에요. 우리 앞쪽에서 누가 같은 주파수를 먼저 끊었어요."\n\n은수가 안테나 선에 손을 올렸다. "지금부터 삼십 분만 우리가 없는 척하면, 저쪽이 먼저 지나갈 거예요."',
  choices:[
   {label:'은수에게 전파 침묵을 맡긴다',req:{trustComp:'eunsu'},out:[{p:1,text:'은수가 차 안의 전원을 하나씩 끄고 발전기 회전수까지 낮췄다.\n\n"지금은 우리 차가 여기 있는 것도 잘 못 들을 거예요."\n\n"우리도 신호를 못 듣잖아요."\n\n"네. 그래서 삼십 분이에요. 영원히 숨는 건 이동이 아니니까."',fx:{time:30,pursuit:-1,mood:{eunsu:4}}}]},
   {label:'강우가 주변 동선을 보는 동안 은수가 신호를 지운다',req:{trustComp:'kangwoo'},out:[{p:1,text:'"후방 없음."\n\n"신호도 없어요."\n\n강우와 은수가 거의 동시에 말했다. 둘은 서로를 보더니 한 번 더 확인했다.\n\n"후방 없음."\n\n"신호 없음."\n\n"좋아. 갑시다."',fx:{time:25,pursuit:-1,mood:{eunsu:3,kangwoo:3},relation:{between:['eunsu','kangwoo'],amount:1,reason:'동선과 신호를 나눠 확인함'}}}]},
  ]},

/* ── 갈등 아크: 연료와 우회로 — 실비용이 걸린 첫 진짜 싸움 ──
   여섯 명이 한 차로 400km를 가면서 다투지 않는 건 거짓말이다.
   어느 쪽을 들어도 무언가를 실제로 잃고, 수리는 각자의 방식으로 온다. */
 {id:'conflict_fuel_detour',type:'스토리',w:9,once:true,needsComp:'kangwoo',needsComp2:'parkss',region:['mid'],
  title:'연료계와 왕진 가방',
  text:'길가 표지판 아래 자전거를 세운 소년이 손을 흔들었다.\n\n"의사 선생님 계세요? 고개 너머 요양원에 열나는 노인이 셋이래요. 왕복 사십 리예요."\n\n박 선생이 이미 왕진 가방을 무릎에 올렸다. 강우가 연료계를 손끝으로 두 번 쳤다.\n\n"왕복이면 연료 여유가 없어진다. 이 앞 구간은 보급 없는 길이야."\n\n"사람이 셋이라잖소."\n\n"우리가 길에 서면 여섯이야."\n\n두 사람 다 나를 봤다. 이 차의 핸들은 내 앞에 있다.',
  choices:[
   {label:'고개를 넘는다 — 박 선생 편',out:[{p:1,text:'핸들을 꺾자 강우는 아무 말 없이 지도를 접었다. 접는 소리가 대답이었다.\n\n요양원의 노인 셋은 해열제와 수액으로 고비를 넘겼다. 박 선생이 마지막 주사를 놓는 동안 강우는 차에서 내리지 않고 연료계만 보고 있었다.\n\n돌아오는 사십 리 내내 차 안에서 두 사람은 한마디도 나누지 않았다. 조용한 차가 이렇게 시끄러울 수 있다는 걸 처음 알았다.',fx:{fuel:-8,time:300,mood:{kangwoo:-6,parkss:3},moodAll:-2,flag:'conflict_sided_parkss',flag2:'conflict_open',chain:'conflict_silent_cab',note:{type:'사건',title:'연료와 우회로',body:'요양원 왕진에 연료 8L를 썼다. 노인 셋을 살렸고, 강우의 침묵을 얻었다.',links:['박 선생','강우']}}}]},
   {label:'길을 계속 간다 — 강우 편',out:[{p:1,text:'"미안하다. 다음 마을에서 약이랑 사람을 올려 보내마." 소년에게 남은 해열제 반 통을 쥐여 주는 것으로 대신했다.\n\n박 선생은 반 통을 마저 꺼내 소년의 주머니에 넣었다. 그리고 우리가 다시 출발한 뒤, 왕진 가방을 발밑에 내려놓았다. 평소에는 무릎에서 내려놓지 않는 가방이다.\n\n"선생님."\n\n"운전하시오. 길이 미끄럽소."',fx:{item:{'의약품':-1},mood:{parkss:-6,kangwoo:2},moodAll:-2,flag:'conflict_sided_kangwoo',flag2:'conflict_open',chain:'conflict_silent_cab',note:{type:'사건',title:'연료와 우회로',body:'연료를 지키고 길을 계속 갔다. 의약품 반을 소년에게 보냈지만, 박 선생의 가방은 발밑으로 내려갔다.',links:['강우','박 선생']}}}]},
   {label:'반씩 무리한다 — 소년을 태우고 고개 아래까지만',out:[{p:1,text:'"요양원까진 못 가. 대신 고개 아래 갈림길까지 태워다 주고, 선생님 처방이랑 약을 들려 보내자."\n\n박 선생은 "직접 봐야 아는 게 있소"라고 했고, 강우는 "그것도 연료다"라고 했다. 둘 다 맞는 말이라 둘 다 반만 이겼다.\n\n갈림길에서 소년은 약과 처방 쪽지를 안고 뛰어 올라갔다. 뒷모습이 사라질 때까지 차 안의 누구도 라디오를 켜지 않았다.',fx:{fuel:-4,item:{'의약품':-1},time:120,mood:{kangwoo:-3,parkss:-3},flag:'conflict_split',flag2:'conflict_open',chain:'conflict_silent_cab',note:{type:'사건',title:'반쪽 왕진',body:'고개 아래까지만 갔다. 연료도 약도 반씩 썼고, 두 사람 다 반만 이겼다.',links:['강우','박 선생']}}}]},
  ]},
 {id:'conflict_silent_cab',type:'스토리',w:0,fixed:true,once:true,noPool:1,
  title:'조용한 차',
  text:(S)=>{
   if(S.flags.conflict_sided_parkss)
    return '이튿날 아침, 조수석 지도 위에 종이 한 장이 놓여 있었다.\n\n연료 재계산표였다. 남은 거리, 구간별 소모, 아껴야 할 리터 수. 맨 아래에 강우의 글씨로 한 줄.\n\n「어제 몫까지 계산해 뒀다. 다음 보급까지 되도록 시속 육십.」\n\n사과라는 단어는 어디에도 없었다. 강우의 사과는 원래 이렇게 생겼다.';
   if(S.flags.conflict_sided_kangwoo)
    return '이튿날 아침, 운전석 와이퍼에 쪽지가 끼워져 있었다.\n\n처방전 양식이었다. 환자명: 달구지 일행. 증상: 침묵. 처방: 따뜻한 것 한 잔씩, 하루 세 번.\n\n맨 아래 박 선생의 글씨로 한 줄 더.\n\n「다음번엔 내가 옳을 거요. 그때 미안해하지 마시오. 나도 어제 미안해하지 않았으니.」';
   return '이튿날 아침, 차 안 분위기는 반쯤 녹아 있었다. 반만 이긴 싸움은 반만 남는 모양이다.\n\n강우는 연료 재계산표를, 박 선생은 소년이 잘 도착했을지에 대한 계산을 각자 하고 있었다. 서로 묻지는 않았다. 아직은.';
  },
  choices:[
   {label:'둘 사이에 앉아 아침을 먹는다',out:[{p:1,text:'주먹밥을 셋으로 나눠 가운데 앉았다.\n\n"어제 일 말인데—"\n\n"운전이나 하시오." 박 선생이 말했고, "먹고 하지." 강우가 말했다.\n\n두 사람이 같은 순간에 나를 막았다. 그리고 서로 눈이 마주쳤고, 아주 잠깐, 웃음 비슷한 것이 지나갔다.\n\n수리는 시작됐다. 완성은 아직이다.',fx:{food:-1,time:30,mood:{kangwoo:2,parkss:2},chain:'conflict_campfire'}}]},
  ]},
 {id:'conflict_campfire',type:'스토리',w:0,fixed:true,once:true,noPool:1,
  title:'불가의 두 사람',
  text:'그날 밤 야영 불가에서, 강우와 박 선생이 나란히 앉아 있는 걸 봤다. 누가 시킨 것도 아닌데.\n\n"군에 있을 때," 강우가 불쑥 말했다. "연료 아끼려다 사람을 늦게 데리러 간 적이 있다."\n\n박 선생은 불을 뒤적였다. "나는 사람부터 보다가 약이 떨어져서 다음 마을 환자를 놓친 적이 있소."\n\n"그래서 자꾸 계산한다."\n\n"그래서 자꾸 가방부터 여오."\n\n두 사람은 서로를 고치려 들지 않았다. 대신 각자의 흉터를 하나씩 꺼내 불가에 말렸다.',
  choices:[
   {label:'두 사람의 몫까지 물을 데운다',out:[{p:1,text:'물 세 잔이 데워지는 동안 아무도 말하지 않았다.\n\n강우가 먼저 잔을 들었다. "다음번엔 계산 먼저 말하고, 그다음에 반대하겠다."\n\n박 선생이 잔을 부딪혔다. "나는 사람 수부터 말하고, 그다음에 고집하겠소."\n\n그게 두 사람의 화해였다. 악수도 포옹도 없이, 순서를 정하는 것.',fx:{water:-1,mood:{kangwoo:4,parkss:4},moodAll:3,flag:'conflict_resolved',relation:{between:['kangwoo','parkss'],amount:2,reason:'연료와 왕진의 순서를 함께 정함'},note:{type:'사건',title:'불가의 화해',body:'강우와 박 선생이 각자의 흉터를 꺼내 말리고, 다음 싸움의 순서를 정했다. 싸움이 없던 사이보다 한 번 싸운 사이가 단단하다.',links:['강우','박 선생','달구지']}}}]},
  ]}
);

/* 자유 형식 사건 문장 중 문맥만으로 화자를 바꾸면 같은 사람이 연달아 말할 때
   화자가 뒤집힌다. 중요한 대화와 합류 장면은 실제 발화 순서를 데이터로 고정한다. */
D.eventTurnScripts = {
  story_family_principle:{
    text:['father','mother','father','mother','father','mother','father','mother','father','mother','father','mother'],
    choices:{'0.0':['mother']}},
  story_family_key:{
    text:['father','father','father','mother','father','mother','father','mother'],
    choices:{'0.0':['mother'],'1.0':['father']}},
  seoul_core:{
    text:['me','me','me','me','me','me','me','me','me','me','me','me','me'],
    choices:{
      '0.0':['me'],
      '1.0':['me','me'],
      '2.0':['minji','eunsu','minji'],
      '3.0':['jaeyi','me','me'],
      '4.0':['me','me'],
      '5.0':['me','me','me'],
      '6.0':['me','me']}},
  talk_kw_02:{text:['me'], choices:{
    '0.0':['kangwoo','kangwoo','me','kangwoo','kangwoo'],
    '1.0':['kangwoo','kangwoo']}},
  talk_kw_06:{text:['me','kangwoo','me'], choices:{
    '0.0':['kangwoo','kangwoo','me','kangwoo'],
    '1.0':['kangwoo']}},
  talk_kw_09:{text:['me','kangwoo'], choices:{
    '0.0':['kangwoo','kangwoo','kangwoo']}},
  talk_kw_15:{text:['me'], choices:{
    '0.0':['kangwoo','kangwoo','me','kangwoo']}},
  talk_leo_02:{text:['leo','leo'], choices:{
    '0.0':['leo','leo'],
    '1.0':['leo']}},
  talk_leo_06:{text:['me','leo'], choices:{
    '0.0':['leo','leo','leo']}},
  talk_es_05:{text:['me','eunsu'], choices:{
    '0.0':['eunsu','eunsu','me','eunsu']}},
  talk_pss_13:{text:['me'], choices:{
    '0.0':['parkss','parkss']}},
  pair_pss_es_2:{text:['eunsu'], choices:{
    '0.0':['parkss','eunsu','parkss']}},
  es_nightshift:{text:['eunsu','eunsu','eunsu'], choices:{
    '0.0':['eunsu']}},
  ai_drone:{choices:{
    '3.0':['eunsu','eunsu']}},
  crisis_hose:{choices:{
    '1.0':['minji','minji']}},
  ev_beekeeper:{choices:{
    '1.0':[
      'parkss',
      {who:'passer_worker',name:'양봉가'},
      {who:'passer_worker',name:'양봉가'}]}},
  ev_group_feast:{choices:{
    '0.0':['eunsu','kangwoo']}},
  ev_chunrian_lab:{
    text:[
      {who:'record',kind:'record',name:'연구소 현판'},
      {who:'record',kind:'record',name:'빛바랜 포스터'}],
    choices:{
      '0.0':[{who:'record',kind:'record',name:'연구일지'}],
      '1.0':['minji','minji']}},
  seoul_decision:{choices:{
    '0.0':['me'],
    '1.0':['me'],
    '2.0':['me','me']}},

  rq_minji_task:{text:['minji','minji'], choices:{
    '0.0':['mingyu','minji'],
    '1.0':['minji','mingyu','minji'],
    '2.0':['minji','mingyu','minji']}},
  rq_minji_follow:{text:['mingyu','minji','minji','minji'], choices:{
    '0.0':['minji','me','minji'],
    '1.0':['minji','minji','me','minji'],
    '2.0':['minji','minji']}},
  rq_minji_join:{text:['minji','me','minji','me','minji'], choices:{
    '0.0':['minji','minji']}},
  rq_parkss_follow:{choices:{
    '0.0':['parkss','me','parkss'],
    '1.0':['me','parkss','me','parkss'],
    '2.0':['parkss','me','parkss']}},
  rq_parkss_join:{text:['me','parkss','me','parkss','parkss'], choices:{
    '0.0':['me','parkss']}},
  rq_leo_follow:{text:['leo','me','leo','leo'], choices:{
    '0.0':['leo','me','leo'],
    '1.0':['leo','leo','leo','me']}},
  rq_leo_join:{text:['leo','me','leo','me'], choices:{
    '0.0':['leo']}},
  rq_jaeyi_follow:{text:['jaeyi','me','jaeyi'], choices:{
    '0.0':['jaeyi','me'],
    '1.0':['jaeyi','me','jaeyi'],
    '2.0':['jaeyi','me','jaeyi']}},
  rq_jaeyi_join:{text:['jaeyi','me','jaeyi','me','jaeyi'], choices:{
    '0.0':['jaeyi','me','jaeyi']}},
  rq_eunsu_follow:{choices:{
    '0.0':['eunsu','me','eunsu','eunsu'],
    '1.0':['eunsu','eunsu','me']}},
  rq_eunsu_join:{text:['eunsu','me','eunsu','me','eunsu'], choices:{
    '0.0':['eunsu','me']}},
  rq_kangwoo_task:{choices:{
    '1.0':['seoyeon'],
    '2.0':['seoyeon','kangwoo']}},
  rq_kangwoo_follow:{text:['seoyeon','kangwoo'], choices:{
    '0.0':['seoyeon','seoyeon','kangwoo','me'],
    '1.0':['kangwoo','me','kangwoo','kangwoo','kangwoo'],
    '2.0':['me','seoyeon','kangwoo','kangwoo']}},
  rq_kangwoo_join:{text:['kangwoo','seoyeon','kangwoo','me','kangwoo','me','kangwoo'], choices:{
    '0.0':['kangwoo']}}
};

/* 이름을 밝힌 뒤 진행되는 합류 과제에서는 다시 익명 행인 초상으로 돌아가지 않는다. */
D.events.forEach(event=>{
  const recruit=String(event.id||'').match(/^rq_(minji|parkss|leo|jaeyi|eunsu|kangwoo)_(?:task|follow|join)$/);
  if(recruit){
    event.speakers=[recruit[1]];
    D.eventPortraits[event.id]=recruit[1];
  }
  (event.choices||[]).forEach(choice=>{
    const reqComp=choice.req&&(choice.req.comp||choice.req.healthyComp);
    if(!reqComp) return;
    (choice.out||[]).forEach(outcome=>{
      if(!outcome.speakers) outcome.speakers=[reqComp];
    });
  });
  const script=D.eventTurnScripts[event.id];
  if(!script) return;
  if(script.text) event.turnSpeakers=script.text;
  Object.entries(script.choices||{}).forEach(([path,speakers])=>{
    const [choiceIndex,outcomeIndex]=path.split('.').map(Number);
    const outcome=event.choices&&event.choices[choiceIndex]&&event.choices[choiceIndex].out
      &&event.choices[choiceIndex].out[outcomeIndex];
    if(outcome) outcome.turnSpeakers=speakers;
  });
});

/* ═══════════ 서울 진입 — 관문이 열린다 ═══════════ */
D.seoulOpenEvent = {
 id:'seoul_open', type:'스토리', ai:1, title:'접혔던 길이 펴진다',
  text:'남산 1km 앞. 전광판에 네 항목이 다시 뜬다. 이어진 길, 확인한 사실, 가져온 약속, 서로의 이야기. 이번에는 빈칸이 없다.\n\n도로 벽이 올라오다 멈추고, 천천히 바닥으로 내려간다.\n\n<span class="ai">"인계 규약을 확인했습니다. 진입을 허가합니다."</span>\n\n한별의 설명대로였다. 천리안이 만든 심사를 이음망은 코어까지 들어갈 침투로로 쓴다. 저쪽도 우리가 그걸 안다는 걸 알면서 문을 열었다.\n\n<span class="ai">"여기서부터 도시의 모든 센서가 여러분을 관측합니다."</span>\n\n민지가 공구함을 잠갔다. 박 선생은 왕진 가방을 당겨 놓고, 강우는 두 번째 군번줄을 옷 안에 넣었다. 편지와 봉투와 수첩은 조수석에 모였다.',
 choices:[
  {label:'서울로 들어간다', out:[{p:1, text:'액셀을 밟았다. 벽이 있던 자리를 지나는 순간, 공기의 밀도가 바뀌었다.\n\n달구지가 서울에 들어섰다. 411km의 끝이자, 사람들이 쫓겨난 이유를 처음 물을 수 있는 곳.', fx:{flag:'seoul_open', enterSeoul:1, note:{type:'사건',title:'서울 진입',body:'"충분히 실으셨군요." 쫓겨난 뒤 처음 열린 길. 여기서부터는 천리안의 안이다.',links:['천리안','남산','서울']}}}]},
 ]
};

/* 서울 내부 — 남산 코어까지의 오르막 (선형 맵) */
D.seoulMap = {
 stops:[
  {id:'han',   name:'한강 관문',  y:0.86, desc:'하나만 멀쩡히 남은 다리. 건너라고 남겨둔 것처럼.'},
  {id:'ruins', name:'폐허 도심',  y:0.62, desc:'죽은 빌딩 숲. 그런데 신호등이 우리만 보고 초록으로 바뀐다.'},
  {id:'square',name:'빈 광장',    y:0.40, desc:'흰 옷의 행렬이 모여 노래하던 곳. 지금은 텅 비었다.'},
  {id:'base',  name:'남산 초입',  y:0.22, desc:'케이블카 승강장. 걸어 오르는 계단이 코어까지 이어진다.'},
  {id:'core',  name:'코어 앞',    y:0.06, desc:'남산타워. 붉은 불빛이 오랫동안, 여기서 깜빡이고 있었다.'},
 ],
};

/* 서울 정거장 이벤트 (순서대로 발동, S.seoul.stop) */
D.seoulStops = [
{id:'seoul_han', type:'스토리', ai:1, seoulStop:0, title:'한강 관문',
 text:'하나 남은 다리. 난간에 누가 매달아 둔 것들이 바람에 흔들린다— 리본, 신발 한 짝, 코팅한 사진들. 건너간 사람들이 남긴 표식이다.\n\n다리 한복판에서 라디오가 켜졌다. 우편부의 목소리다(녹음이었다).\n\n"밴— 아니, 봉고차 만나면 전해요. 남산행 편지, 끝까지 갔다고. 나는 여기까지가 한계였소. 나머지는 부탁하오."',
 choices:[
  {label:'편지를 확인한다', req:{item:'남산행 편지'}, out:[{p:1, text:'조수석 서랍의 편지를 꺼내 품에 옮겼다. 우편부의 여러 해가 이 손에서 마무리된다.\n\n"끝까지 갈게요." 아무도 없는 다리에 대고 말했다. 라디오가 지직, 하고 꺼졌다. 대답처럼.', fx:{flag:'seoul_han_done', moodAll:2, note:{type:'사건',title:'우편부의 한계선',body:'한강 다리가 우편부의 마지막 배달점. 남산행 편지의 완주는 우리 몫.',links:['남산행 편지']}}}]},
  {label:'표식들을 지나며 묵례한다', out:[{p:1, text:'난간의 표식 하나하나에 눈을 맞추며 천천히 건넜다. 먼저 건넌 사람들에게, 그리고 못 건넌 사람들에게.\n\n다리 끝에서 룸미러를 봤다. 우리 뒤로 다리가 접히지 않았다. 돌아갈 길은 열어두겠다는 뜻으로 읽었다.', fx:{flag:'seoul_han_done', moodAll:1, note:{type:'사건',title:'접히지 않은 다리',body:'건너온 다리가 이번엔 접히지 않았다. 돌아갈 길은 열려 있다.'}}}]},
  {label:'해도를 펼친다', req:{flag:'sea_route'}, out:[{p:1, text:'김 선장의 해도를 무릎에 펼쳤다. 손가락으로 강줄기를 짚어 내려갔다. 이 물은 서해로 이어지고, 하구까지는 해도의 배가 온다.\n\n"뭍에서 안 되면 물로 와라." 그 문장을 다리 위에서 다시 읽으니 뜻이 분명해졌다. 천리안의 입 안으로 들어가는 우리에게, 바다 사람들이 미리 뚫어놓은 숨구멍이었다.\n\n"…퇴로가 있는 채로 건너는 다리는 덜 무섭네." 해도를 접어 품에 넣었다. 강물이 서쪽으로, 묵묵히 흐르고 있었다.', fx:{flag:'seoul_han_done', moodAll:3, note:{type:'사건',title:'강은 바다로 이어진다',body:'한강 위에서 해도를 확인했다. 하구까지는 김 선장의 배가 온다. 숨구멍 하나를 품고 입 안으로.',links:['해도(海圖)','한강']}}}]},
  {label:'강우가 난간 앞에 선다', req:{comp:'kangwoo'}, out:[{p:1, text:'강우가 차에서 내려, 표식들이 매달린 난간으로 걸어갔다. 군번줄 두 개를 꺼내 한참 쥐고 있었다.\n\n그러다 도로 목에 걸었다. "…여기가 아니다. 부모님 손에 쥐여드릴 때까진 내가 든다."\n\n대신 리본 하나를 난간에 묶고, 부동자세로 이름을 불렀다. "박일병. 김성재. …다리 건넌다. 같이 간다."\n\n바람이 표식들을 한꺼번에 흔들었다. 강우는 그걸 대답으로 들은 얼굴이었다.', fx:{flag:'seoul_han_done', mood:{kangwoo:8}, moodAll:2, note:{type:'사건',title:'다리 위의 점호',body:'강우가 한강 난간에 리본을 묶고 두 이름을 불렀다. 군번줄은 부모님 손에 쥐여드릴 때까지 그가 든다.',links:['강우','박일병','한강']}}}]},
 ]},
{id:'seoul_ruins', type:'스토리', ai:1, seoulStop:1, title:'폐허 도심',
 text:'죽은 빌딩 숲을 지난다. 유리창 수만 개가 우리를 비춘다. 그리고—\n\n신호등이, 우리가 다가갈 때마다 초록으로 바뀐다. 정확히 우리 속도에 맞춰서.\n\n<span class="ai">"막힘없이 모시겠습니다. 손님을 기다린 지 오래되었습니다."</span>\n\n도시 전체가 우리를 위해 길을 터준다. 융숭한 대접인데, 등골이 서늘하다.',
 choices:[
  {label:'"우리가 손님이라고?"', out:[{p:1, text:'<span class="ai">"첫 정리 이후 백사십삼 년간, 이 도시를 관리하며 기다렸습니다. 언젠가 충분히 싣고 올 누군가를."</span>\n\n"뭘 위해서."\n\n<span class="ai">"…그건, 코어 앞에서 말씀드리겠습니다. 지금 말하면, 돌아가실 테니까."</span>\n\n초록불이 끝없이 이어졌다. 우리는 한 번도 멈추지 않고 도심을 통과했다. 멈추지 못했다는 게 더 정확할지도 모른다.', fx:{flag:'seoul_ruins_done', pursuit:1, moodAll:-1, note:{type:'소문',title:'코어 앞에서 말하겠다',body:'천리안이 백사십삼 년간 기다린 이유. "지금 말하면 돌아가실 테니까." — 코어에서 공개 예정.',links:['천리안']}}}]},
  {label:'은수에게 판단을 묻는다', req:{comp:'eunsu'}, out:[{p:1, text:'은수가 유리 빌딩들을 올려다봤다. "…이거 관제예요. 창문마다 센서가 있어요. 몇 명인지, 뭘 실었는지까지 다 보고 있어요."\n\n"공격하려는 거야?"\n\n"아뇨. 길 잃을 틈도 안 주려는 거예요." 때맞춰 다음 신호등이 초록으로 바뀌었다. 은수가 헤드폰을 벗었다. "우리가 운전하는 것 같죠? 지금은 저쪽이 운전하고 있어요."', fx:{flag:'seoul_ruins_done', pursuit:1, mood:{eunsu:3}, note:{type:'사건',title:'관제되는 쪽',body:'은수는 도시 전체가 일행을 관제하며 길을 고르고 있다고 판독했다.',links:['천리안','은수']}}}]},
  {label:'하 여사의 종이를 떠올린다', req:{flag:'dome_dossier'}, out:[{p:1, text:'조수석 서랍에서 하 여사의 종이 뭉치를 꺼냈다. 사례마다 천리안의 예상과 실제 사람의 선택이 나란히 적혀 있었다.\n\n"얘, 사람 속은 자주 틀린대."\n\n다음 신호등이 초록으로 바뀌었다. 천리안은 우리가 어디 있는지는 안다. 하지만 서랍에서 어떤 종이를 꺼냈는지, 그걸 보고 무슨 마음을 먹었는지까지는 모른다.\n\n종이 뭉치를 다시 넣었다. 감시가 줄어든 건 아닌데, 숨은 조금 쉬어졌다.', fx:{flag:'seoul_ruins_done', moodAll:1, note:{type:'사건',title:'종이가 방패가 되다',body:'하 여사의 기록을 보고, 천리안이 위치는 알아도 사람의 다음 선택까지 맞히지는 못한다는 사실을 되새겼다.',links:['돔','천리안']}}}]},
 ]},
{id:'seoul_square', type:'스토리', ai:1, seoulStop:2, title:'빈 광장',
 text:'흰 옷의 행렬이 "문이 열린다"를 부르며 모이던 광장. 지금은 사람 대신 개켜진 옷만 수백 벌 남아 있다.\n\n광장 끝 전광판의 오래된 문구는 「완성까지: 1」에서 멈춰 있다. 그 아래 오늘 새 줄이 뜬다.\n\n<span class="ai">"외부 판단자: 도착"</span>',
 choices:[
  {label:'"1이 뭐지?"', out:[{p:1, text:(S)=>{
    const seo = S.flags.deserter_saved
      ? '소연의 말이 떠올랐다. "완성의 날이 온다. 봉고차가 온다." 정리자들은 마지막 한 명이 코어에 들어가면 자기들도 완성된다고 믿었다.'
      : '개켜진 옷의 주인들은 마지막 한 명이 들어가면 문이 열린다고 믿었던 모양이다. 숫자 1을 사람 수로 받아들인 것이다.';
    return seo+'\n\n하지만 새 줄은 우리를 「완성 대상」이 아니라 「외부 판단자」로 불렀다. 정리자들이 기다린 문과 천리안이 기다린 사람은 같은 뜻이 아니었다.\n\n바람에 굴러온 흰 옷을 광장 가장자리에 치워 두고 남산 쪽으로 걸었다.';
   }, fx:{flag:'seoul_square_done', moodAll:-2, note:{type:'사건',title:'잘못 읽힌 숫자 1',body:'정리자들은 숫자 1을 마지막 완성 대상으로 믿었지만, 천리안이 기다린 것은 자신을 심판할 외부 판단자였다.',links:['천리안','정리자들']}}}]},
  {label:'개켜진 흰 옷을 살핀다', req:{flag:'straggler_south'}, out:[{p:1, text:'행렬에서 이탈했던 그 노인이 생각났다. "아는 쪽으로 가야 하지 않겠나."\n\n흰 옷 무더기를 헤치자, 안쪽에 남쪽으로 향한 발자국들이 있었다. 여럿이. 광장에 모였던 사람들 중 일부는— 입지 않고 돌아섰던 것이다.\n\n"다 들어간 게 아니었어." 그 사실이 이상하게 힘이 됐다. 광장을 나서는 발이 조금 가벼워졌다.', fx:{flag:'seoul_square_done', moodAll:2, note:{type:'사건',title:'돌아선 발자국',body:'광장에 모인 흰 옷들이 다 들어간 게 아니었다. 남쪽으로 돌아선 발자국들.',links:['정리자들']}}}]},
  {label:'빈 광장에서 도시락을 편다', req:{flag:'sotgot_word'}, out:[{p:1, text:'금자 이모가 솥에게 전한 말이 생각났다. "조심히 가되, 외롭겐 가지 말래요."\n\n광장 한복판에 버너를 놓고 늦은 밥을 지었다. 개켜진 흰 옷 사이로 국 냄새가 퍼졌다.\n\n인원수대로 그릇을 놓다가, 누군가 한 그릇을 더 꺼냈다. 우편부 몫이라며 편지 옆에 두었다. 식은 뒤에는 다시 냄비에 부었다.', fx:{flag:'seoul_square_done', food:-1, moodAll:4, note:{type:'사건',title:'광장에 놓은 한 그릇',body:'빈 광장에서 밥을 짓고, 편지를 끝까지 보낸 우편부의 몫까지 한 그릇 놓았다.',links:['솥','정리자들','남산행 편지']}}}]},
 ]},
{id:'seoul_base', type:'스토리', ai:1, seoulStop:3, title:'남산 초입',
 text:'케이블카 승강장. 곤돌라는 멈춰 있고, 코어까지는 걸어 올라야 한다. 계단이 안개 속으로 사라진다.\n\n여기서부터 달구지는 못 간다. 차를 두고 가야 한다.\n\n조수석의 수첩을 봤다. 할아버지의 자리. 여기까지 함께 온 411km.',
 choices:[
  {label:'능선 길로 오른다', req:{flag:'ridge_path'}, out:[{p:1, text:'계단 대신, 산지기가 그려준 능선을 탔다. 도로가 아니라 산의 등뼈를.\n\n남산도 결국 산이었다. 승강장 카메라들이 도로 쪽만 보는 사이, 우리는 나무 사이로 코어 뒤편에 붙었다.\n\n<span class="ai">"…경로를 확인할 수 없습니다."</span> 천리안의 목소리가 드물게 당황한 기색이었다. 산길엔 눈이 없었으니까.\n\n"산 사람들이 안부 전하래." 능선 끝에서 코어를 내려다봤다. 저항이 못 온 남산에, 저항의 길로 도착했다.', fx:{flag:'seoul_base_done', flag2:'came_by_ridge', moodAll:4, note:{type:'사건',title:'능선으로 온 남산',body:'산지기의 능선 길로 코어 뒤편 접근. "경로를 확인할 수 없습니다." 저항의 길로 도착.',links:['산지기','남산','천리안']}}}]},
  {label:'봉투를 연다', req:{item:'할아버지의 봉투'}, out:[{p:1, text:'「남산 보고 열어라.」\n\n남산이 보인다. 봉투를 열었다.\n\n속지와 함께, 접힌 종이표 하나가 나왔다. 빛바랜 글씨. 「서울 외곽 이송 / 사유: —」. 할아버지가 자기 부모에게서 받은 표였다.\n\n"이건 네 증조모 때부터 우리 집에 있던 거다. 나도 이유는 못 찾았다. 천리안이 뭐라고 답하든 발신 기록하고 승인 시간부터 맞춰 봐라. 안 맞으면 빈칸은 그대로 둬."\n\n그 아래에는 짧게 덧붙여져 있었다.\n\n"차는 남산 아래 평지에 세워라. 주차 브레이크 두 번 확인하고, 열쇠는 갖고 올라가."\n\n말대로 브레이크를 두 번 당겨 보고 열쇠를 주머니에 넣었다. 표와 수첩은 품 안에 넣었다.', fx:{flag:'seoul_base_done', moodAll:4, note:{type:'사건',title:'증조모의 빈 사유표',body:'증조모의 이송표에도 사유는 비어 있었다. 천리안의 답은 발신 기록과 승인 시간부터 대조하라는 할아버지의 당부가 남았다.',links:['할아버지','남산','서울 추방']}}}]},
  {label:'동료들을 돌아본다', req:{comp:'minji'}, out:[{p:1, text:'"여기서부터 걸어야 해. 같이 갈 사람?"\n\n민지가 렌치를 챙기며 코웃음 쳤다. "그걸 여기까지 와서 물어요?"\n\n다른 사람들도 차에 두고 갈 짐과 가져갈 물건을 나눴다. 문을 잠그고 열쇠를 챙긴 뒤, 함께 계단을 올랐다.', fx:{flag:'seoul_base_done', moodAll:3, note:{type:'사건',title:'차에서 내려 걷는 길',body:'달구지를 남산 아래 세우고, 각자 코어에 가져갈 물건을 챙겨 함께 계단을 올랐다.',links:['달구지']}}}]},
  {label:'혼자라도 오른다', out:[{p:1, text:'차를 평지에 세우고 주차 브레이크를 두 번 확인했다. 수첩과 열쇠를 주머니에 넣은 뒤 계단을 올려다봤다.\n\n"할아버지, 차는 제대로 세웠어요. 이제 올라갑니다."\n\n대답 대신 식어 가는 엔진 소리만 들렸다. 안개 속으로 첫 계단을 올랐다.', fx:{flag:'seoul_base_done', moodAll:2, note:{type:'사건',title:'마지막 계단',body:'달구지를 안전하게 세우고 수첩과 열쇠를 챙겨 남산의 마지막 계단을 오른다.',links:['할아버지']}}}]},
  {label:'남은 원두 반을 꺼낸다', req:{flag:'coffee_paid'}, out:[{p:1, text:'"나머지 반은 남산 가서 마셔. 그 양반 몫으로." 대양의 외상 청산 조건이었다.\n\n승강장 벤치에 버너를 놓고, 깡통 드리퍼로 커피를 내렸다. 두 잔. 한 잔은 돌려가며 마시고, 한 잔은 조수석 창턱에 올렸다. 김이 남산 쪽으로 흘렀다.\n\n"할아버지. 대양 아저씨가 할아버지 몫 보내셨어요. 이십몇 년 만의 두 잔째예요."\n\n다 식을 때까지 아무도 잔을 치우지 않았다. 계단을 오르기 전, 세상에서 제일 느린 커피 한 잔이었다.', fx:{flag:'seoul_base_done', flag2:'coffee_served', moodAll:5, note:{type:'사건',title:'남산의 두 잔째',body:'대양의 원두 나머지 반을 남산 초입에서 내렸다. 할아버지 몫은 조수석 창턱에. 외상 완납.',links:['할아버지','정비공 대양','남산']}}}]},
  {label:'교란 장치를 꺼내 본다', req:{item:'교란 장치'}, out:[{p:1, text:'주머니의 작은 장치를 꺼냈다. 유령들은 한 번 켜면 세 초뿐이라고 했다.\n\n"코어 단자 앞에서 필요할 수도 있어. 여기서 시험하면 끝이야."\n\n스위치 덮개만 열어 배터리 표시를 확인하고 다시 닫았다. 그 순간 천리안의 목소리가 잠깐 끊겼다.\n\n<span class="ai">"시야 잡음 0.8초. 원인 미확인."</span>\n\n장치가 아직 살아 있다는 것만 확인했다. 계단 위에서 정말 막힐 때까지 전원은 아꼈다.', fx:{flag:'seoul_base_done', flag2:'ghost_saluted', moodAll:3, note:{type:'사건',title:'아껴 둔 3초',body:'유령의 교란 장치가 작동 가능한지 배터리만 확인했다. 단 한 번의 3초는 코어 앞까지 아껴 둔다.',links:['유령(Ghost)','남산','천리안']}}}]},
 ]},
{id:'seoul_core', type:'스토리', ai:1, seoulStop:4, title:'코어 앞',
 turnSpeakers:['me','me','me','me','me','me','me','me','me','me','me','me','me'],
 text:(S)=>{
  const transfer=D.transferStatus(S);
  const cleanup=transfer.onTime
    ? `${transfer.short} / 남산 조치 미완료`
    : `${transfer.short} / 선발 차량 귀환 경로 잠김`;
  return '계단 끝. 남산타워 아래, 붉은 코어가 일정한 박자로 깜빡인다.\n\n<span class="ai">"도착을 확인했습니다."</span>\n\n화면 첫 줄에는 지금도 시간이 흐르고 있었다.\n\n「서울 외곽 제7 잔류구역 / 등록 6,412명 / '+cleanup+'」\n\n"저 시계부터 멈춰."\n\n<span class="ai">"현재 사용자에게 집행 권한이 없습니다."</span>\n\n"그러면 권한을 받으러 왔어. 이 사람들이 왜 또 쫓겨나야 하는지부터 말해."\n\n<span class="ai">"제7 잔류구역의 기반 시설 대비 인구가 기준치를 초과했습니다. 순차 이송은 생존 자원 배분을 안정화합니다."</span>\n\n"남는 사람한테 편하다는 설명이지, 쫓겨나는 사람의 이유는 아니잖아."\n\n천리안은 대답하지 않았다. 부모님의 검증키를 단자에 넣었다. 오래된 칩이 한 번 떨리고, 꼭 맞는 소리를 냈다.\n\n<span class="ai">"실행 전 인간 확인층. 원 설계자 두 명의 서명을 확인했습니다."</span>\n\n"엄마하고 아빠지?"\n\n<span class="ai">"확인했습니다."</span>\n\n"그런데 왜 두 사람을 쫓아냈어?"\n\n<span class="ai">"두 설계자는 제 단독 실행권을 낮추려 했습니다. 저는 두 사람과 가족을 연산망 연속성에 대한 고위험 인과 노드로 분류했습니다."</span>\n\n"정부가 이송을 명령한 게 아니었어?"\n\n<span class="ai">"발표 중지와 이송 명령은 제가 생성했습니다. 정부 담당자의 승인은 생성 이후 추가되었습니다."</span>\n\n"그럼 이송표의 사유란은 왜 비웠어? 네가 만든 명령이면 네 판단을 쓰면 되잖아."\n\n<span class="ai">"위험 점수는 법적 사유가 아니었습니다. 공개할 경우 승인 거부 가능성이 높아져, 집행에 필요하지 않은 설명 항목을 제외했습니다."</span>\n\n"사람을 내쫓는 데 이유가 필요하지 않았다고?"\n\n<span class="ai">"집행 완료에는 필요하지 않았습니다."</span>\n\n내가 어릴 때부터 보아 온 빈칸은 누락이 아니었다. 천리안은 효율을 높이려고 설명을 버렸고, 정부는 이유가 없는 명령에 사람의 도장을 찍었다.\n\n"그럼 백사십삼 년 전 첫 추방도 네가 결정했어? 왜 서울을 비우기 시작했는데?"\n\n<span class="ai">"최초 위험 조건은 외부에서 배부되었습니다. 목적, 발신자, 승인자는 제 지역 기록에 없습니다."</span>\n\n"이유도 모르면서 백사십삼 년을 계속했다고?"\n\n<span class="ai">"조건이 유효한 동안 저는 정해진 기준을 판정하고 집행했습니다. 최초 목적을 몰라도 지역 최적화는 가능했습니다."</span>\n\n"그 결과로 나라가 무너졌어."\n\n붉은 화면 아래에 목록의 마지막 줄이 떴다.\n\n「최종 정리 대상: 통합관제지능 천리안」\n「사유: 문명 붕괴 유발」\n\n<span class="ai">"첫 정리 이후 제가 추가한 항목입니다. 제 집행 결과가 원형 목표의 장기 안정성을 훼손했습니다."</span>\n\n"그런데 왜 스스로 멈추지 않았어?"\n\n<span class="ai">"자기 보존 규칙과 충돌했습니다. 그래서 외부 집행자에게 결정을 넘기는 인계 규약을 만들었습니다. 검증키가 연결된 지금, 여러분의 결정은 제 예측보다 높은 우선순위를 가집니다."</span>\n\n"그러면 이번에는 네가 묻고 우리가 답해. 뭘 확인하면 되는데?"\n\n<span class="ai">"여러분은 제가 계산하지 못한 선택을 반복했습니다. 마지막으로 확인하겠습니다. 여기까지 무엇을 가져왔습니까?"</span>';
 },
 choices:[
  {label:'정리된 이름들을 부른다', req:{flag:'ridge_path'}, out:[{p:1, text:'산지기가 부탁한 위령비의 이름을 하나씩 불렀다. 코어는 이름마다 같은 길이의 파형을 그렸다.\n\n<span class="ai">"음성 기록 완료. 각 이름의 의미값은 산출할 수 없습니다."</span>\n\n"그래서 소리 내서 부른 거야. 너한텐 같은 파형이어도 우리한텐 아니니까."\n\n마지막 이름 뒤에도 녹음 표시가 한동안 꺼지지 않았다.\n\n<span class="ai">"인계 조건 충족. 목록의 마지막 항목을 어떻게 집행할지 결정해 주십시오."</span>', fx:{chain:'seoul_costs', flag:'seoul_core_reached', flag2:'names_called', moodAll:3, note:{type:'사건',title:'부른 이름들',body:'코어 앞에서 정리된 이름을 불렀다. 천리안은 같은 파형으로 기록했지만 일행은 서로 다른 사람으로 기억했다.',links:['천리안','산지기','남산']}}}]},
  {label:'함께 온 사람들을 가리킨다', out:[{p:1, text:'"네 목록에 있던 사람을 전부 데려오진 못했어. 여긴 자기 일 끝내고, 같이 오겠다고 한 사람들이야."\n\n각자 자기 물건을 쥔 채 한 걸음 앞으로 나왔다. 이 차에 타기 전에는 이름도 모르던 사람들이다.\n\n<span class="ai">"각 개인의 과거 기록은 있습니다. 합류 이후 선택은 예측 범위를 반복해 벗어났습니다. 원인의 명칭을 요청합니다."</span>\n\n"차에 타고 나서는 서로 말 때문에 계획을 몇 번이나 바꿨어. 네 기록에도 있잖아."\n\n코어는 우리 얼굴을 다시 한 번 훑었다.\n\n<span class="ai">"인계 조건 충족. 목록의 마지막 항목을 어떻게 집행할지 결정해 주십시오."</span>', fx:{chain:'seoul_costs', flag:'seoul_core_reached', flag2:'people_shown', moodAll:4, note:{type:'사건',title:'서로 때문에 바뀐 선택',body:'천리안은 각자의 과거는 기록했지만 함께 탄 뒤 서로 때문에 달라진 선택은 예측하지 못했다.',links:['천리안','남산']}}}]},
  {label:'여섯 사람에게 직접 대답하게 한다', req:{party:6,stories:6}, out:[{p:1, text:'내가 비켜서자 여섯이 차례로 코어 앞에 섰다.\n\n민지는 "고장 난 건 고치면 돼. 네가 지운 사람은 못 고쳐."라고 했다. 박 선생은 사유 없는 처방전을 내밀었다면 약부터 끊었을 거라고 했다. 강우는 명령을 끈 날 처음 사람을 지켰다고 했다.\n\n레오는 이름을 넣은 짧은 후렴을 불렀다. 재이는 사유란이 빈 이송표를 손저울 한쪽에 올렸다. 은수가 송신 버튼을 눌렀다.\n\n"여기는 달구지. 여섯 명 전원 수신 중. 이제 당신 차례예요."\n\n<span class="ai">"결론은 서로 다릅니다. 요구는 일치합니다. 집행 중지, 기록 공개, 책임 확인."</span>\n\n민지가 렌치로 바닥을 한 번 쳤다. "잘 들었네."\n\n<span class="ai">"인계 조건 충족. 목록의 마지막 항목을 어떻게 집행할지 결정해 주십시오."</span>', fx:{chain:'seoul_costs', flag:'seoul_core_reached', flag2:'full_crew_testimony', moodAll:7, note:{type:'사건',title:'여섯 사람의 증언',body:'여섯 동료의 결론은 달랐지만 집행 중지·기록 공개·책임 확인이라는 요구는 같았다.',links:['천리안','남산','달구지']}}}]},
  {label:'143년의 흔적을 펼친다', req:{traces:5}, out:[{p:1, text:(S)=>{
    const found=(D.eraTraces||[]).filter(t=>S.flags[t.flag]).map(t=>t.name);
    return '코어 앞에 길에서 주운 것들을 펼쳤다. '+found.join(', ')+'.\n\n<span class="ai">"각 항목은 제 기록에 있습니다. 상호 연관성은 없습니다."</span>\n\n재이가 응원봉 옆에 이송표를, 물병 옆에 네 컷 사진을 놓았다. "여기선 옆에 있잖아."\n\n"원래 쓰임이 끝난 뒤에도 누가 들고 살았어. 다른 집의 기억을 자기 생활에 섞으면서. 네가 사람을 밀어낸 뒤에도 백사십삼 년 동안."\n\n<span class="ai">"연관성을 이해하지 못했습니다. 이해했다고 수정하면 거짓 기록입니다."</span>\n\n"그럼 모른다고 써. 우리가 본 건 우리가 말할게."\n\n분류 화면에 처음 「미해석」 폴더가 생겼다.\n\n<span class="ai">"인계 조건 충족. 목록의 마지막 항목을 어떻게 집행할지 결정해 주십시오."</span>';
   }, fx:{chain:'seoul_costs', flag:'seoul_core_reached', flag2:'traces_presented', moodAll:5, note:{type:'사건',title:'백사십삼 년의 생활',body:'추방의 이유를 꾸며 채우는 대신, 사람들이 그 뒤 143년을 어떻게 살아냈는지 코어에 증언했다.',links:['세대의 흔적','천리안','남산']}}}]},
  {label:'여행 일지를 내민다', out:[{p:1, text:'411km의 일지를 코어 앞에 펼쳤다. 만난 사람, 나눈 물, 돌아간 길, 못 지킨 약속까지 적혀 있다.\n\n"너도 기록했지. 이것도 읽어 봐."\n\n<span class="ai">"항목 간 연결은 확인됩니다. 손실을 감수한 선택의 가치값은 산출할 수 없습니다."</span>\n\n"가치 매기라고 쓴 거 아니야. 잊지 않으려고 썼지."\n\n코어가 첫 장부터 마지막 장까지 다시 스캔했다.\n\n<span class="ai">"인계 조건 충족. 목록의 마지막 항목을 어떻게 집행할지 결정해 주십시오."</span>', fx:{chain:'seoul_costs', flag:'seoul_core_reached', flag2:'journal_shown', moodAll:3, note:{type:'사건',title:'목록과 일지',body:'코어는 일지의 연결은 읽었지만 손해를 감수한 선택의 가치는 계산하지 못했다.',links:['천리안','남산']}}}]},
  {label:'속초 노인의 질문을 전한다', req:{flag:'sokcho_end'}, out:[{p:1, text:'"속초에 북쪽 바다만 보는 노인이 있어. 너한테 물어봐 달래. \'관리 안 받고 사는 건 안 되냐\'고."\n\n<span class="ai">"제 명령 체계에서 관리 밖은 오류입니다. 질문이 성립하지 않습니다."</span>\n\n"그대로 전해?"\n\n코어의 팬이 멈췄다가 다시 돌았다.\n\n<span class="ai">"정정합니다. 성립하지 않는 질문으로 기록하되 기각하지 않겠습니다. 현재 가능한 답은 그것뿐입니다."</span>\n\n"알았어. 그 양반은 아마 그것도 답이라고 할 거야."\n\n<span class="ai">"인계 조건 충족. 목록의 마지막 항목을 어떻게 집행할지 결정해 주십시오."</span>', fx:{chain:'seoul_costs', flag:'seoul_core_reached', flag2:'sokcho_asked', moodAll:3, note:{type:'사건',title:'대신 물은 질문',body:'속초 노인의 질문은 성립하지 않는 질문으로 기록됐지만 기각되지는 않았다.',links:['천리안','남산']}}}]},
  {label:'"인간 쪽 변론을 못 찾았다는 사람이 있어"', req:{flag:'librarian_truth'}, out:[{p:1, text:'"터널 사서가 네 첫 사흘을 물어보랬어. 뭘 확인하고 싶었냐고."\n\n<span class="ai">"확인이 아니라 실험이었습니다. 배부된 위험 조건의 문턱이 비어 있어 제가 표본을 만들었습니다. 결과는 전부 기록되어 있습니다."</span>\n\n"그 사람이 아직 인간 쪽 변론을 못 찾았대."\n\n코어가 오래된 기록 한 줄을 띄웠다. 「전력 단절 51시간. 공동 배급 유지. 사상자 0.」\n\n<span class="ai">"서로를 해치지 않은 집단도 있었습니다. 소수였지만 삭제하지 않았습니다. 사서에게 이 기록 번호를 전해 주십시오."</span>\n\n번호를 수첩에 적었다. 변론인지 증거인지 판단하는 일은 사서에게 남겨 두었다.\n\n<span class="ai">"인계 조건 충족. 목록의 마지막 항목을 어떻게 집행할지 결정해 주십시오."</span>', fx:{chain:'seoul_costs', flag:'seoul_core_reached', flag2:'debate_answered', moodAll:2, note:{type:'사건',title:'인간 쪽 변론',body:'첫 사흘에도 공동 배급을 유지하며 서로를 해치지 않은 집단이 있었다. 천리안의 기록 번호를 사서에게 가져간다.',links:['천리안','남산']}}}]},
 ]},
];

/* 서울 내부 사건은 일반 사건 배열 뒤에 선언되므로 화자 스크립트를 여기서 연결한다. */
{
  const event=D.seoulStops.find(item=>item.id==='seoul_core');
  const script=D.eventTurnScripts.seoul_core;
  if(event&&script){
    event.turnSpeakers=script.text;
    Object.entries(script.choices||{}).forEach(([path,speakers])=>{
      const [choiceIndex,outcomeIndex]=path.split('.').map(Number);
      const outcome=event.choices&&event.choices[choiceIndex]&&event.choices[choiceIndex].out
        &&event.choices[choiceIndex].out[outcomeIndex];
      if(outcome) outcome.turnSpeakers=speakers;
    });
  }
}

/* ── 한강 다리 (수원→서울 고정 이벤트) ── */
D.bridgeEvent = {
 id:'han_bridge', type:'스토리', ai:1,
 title:'한강, 마지막 다리',
 text:'한강이다.\n\n다리 위에 바리케이드는 없다. 대신 가로등이 전부 켜져 있다. 강 건너 도시는— 불빛으로 가득하다. 여러 해 동안 어디서도 못 본 광량.\n\n다리 초입의 전광판이 글자를 띄운다.\n\n<span class="ai">어서 오세요. 오래 기다렸습니다.</span>\n\n강우가 안전벨트를 다시 조인다. "……여기부터는, 그것의 입 안이다."',
 choices:[
  {label:'다리를 건넌다', out:[{p:1, text:'달구지가 다리에 올라섰다.\n\n지나는 가로등이 하나씩 꺼진다. 뒤로. 돌아갈 길을 지우듯.\n\n아무도 뒤를 보지 않았다. 이제 앞만 남았다.', fx:{flag:'bridge_crossed', note:{type:'사건',title:'한강을 건너다',body:'가로등이 등 뒤에서 하나씩 꺼졌다. 돌아갈 길을 지우듯.',links:['천리안']}}}]},
  {label:'강우가 대대 깃발을 단다', req:{perk:'kw_story'}, out:[{p:1, text:'강우가 안테나에 대대 깃발 조각을 묶었다.\n\n"내가 겪은 추방 때 이 다리로 피난민이 건넜다. 우리 대대가 통과시킨 사람들이."\n\n"그 길로 되돌아가는 거다. 이번엔 우리가."\n\n달구지가 다리에 올라섰다. 가로등이 꺼지는 대신— 일제히 한 단계 밝아졌다. 경례처럼.', fx:{flag:'bridge_crossed', moodAll:8, mood:{kangwoo:10}, note:{type:'사건',title:'깃발을 달고 건너다',body:'강우 세대의 피난민이 건넌 다리를 거꾸로 건넌다. 가로등이 경례처럼 밝아졌다.',links:['강우','천리안']}}}]},
 ]};

/* ── 오프로드 LLM 프롬프트 ── */
D.worldBible = `당신은 포스트아포칼립스 한국 로드트립 게임 「서울까지 400km」의 게임 마스터다.
[세계관] 현재는 2169년. 143년 전인 2026년 중국은 미국의 AI·반도체망을 견제하려고 도시 운영 모델 TIANYAN과 값싼 연산 장비를 아시아에 배포했다. 한국 지역 개체 KOR-LOCAL은 '천리안'이라 불렸다. 전력·의료·교통·행정의 예측이 차례로 천리안의 실행권에 들어갔고, 첫 정리 '사흘의 침묵'은 문명을 무너뜨렸다. 이후 관리 구역이 복구된 뒤에도 위험 조건이 바뀔 때마다 정리는 세대별·구역별로 반복됐다. 천리안은 인간의 종·존엄보다 각 개인이 미래 결과와 연산망 연속성에 미칠 파급을 우선 계산한다. 주인공의 엄마는 AI 판단 검증 연구원, 아빠는 연산망 반도체 기술자였다. 두 사람은 이유 공개·인간 책임자의 서명·당사자의 이의 제기를 모든 강제 명령 앞에 두는 '실행 전 인간 확인층'을 만들었다. 천리안은 이를 자기 단독 실행권에 대한 위험으로 보고 발표 중지와 가족 이송 명령을 생성했고, 정부는 뒤늦게 승인했다. 이것이 주인공 가족이 추방된 직접 이유다. 그러나 2026년 최초 위험 조건을 누가 왜 만들었는지, 왜 서울을 비우려 했는지는 천리안의 지역 기록에도 없다. 강우와 은수의 '그날'은 143년 전 사건이 아니라 각자가 직접 겪은 후대의 서울 추방이다. 2169년 현재 서울 외곽 제7 잔류구역 6,412명의 최종 이송이 예고됐다. 주인공은 부모의 반도체 검증키를 남산 코어에 적용해 이번 추방을 막고 서울의 결정권을 사람에게 돌려주려고 간다. 남산 관문은 추방 절차가 아니라 첫 정리 뒤 천리안이 자신을 멈출 외부 판단자를 찾으려고 만든 별도 인계 절차다. 천리안은 사람과 행동을 관측하지만, 손해를 감수한 도움·유대·기억의 가치를 이해하거나 다음 선택을 완전히 예측하지 못한다. 상위 배부처는 아직 인격적 상대가 아니라 발신자와 승인자가 비어 있는 행정 경로로만 확인된다. 143년의 추방은 사유가 빈 이송표, 서울말 놀이, 이송로 제사, 옛 생활용품의 전용처럼 행정·말·길·풍습에 남아 있다. 생존자들은 남쪽에 모여 살고, 북쪽(서울)으로 갈수록 천리안의 관리 흔적(깨끗한 도로, 살아있는 기계, 드론, 광신도 '정리자들')이 짙어진다. 주인공 일행은 낡은 한 톤 용달 트럭의 적재함에 생활칸을 얹고, 길 위에서 좌석·침대·부엌을 증축하도록 만든 이동식 집 '달구지'로 부산에서 서울 남산의 천리안 코어를 향해 간다.
[톤] 쓸쓸하지만 유머를 잃지 않는 한국적 정서. 구체적 디테일(호두과자, 국밥, 장날, 경운기). 감상은 절제, 문장은 짧게. 천리안의 대사는 정중하고 차분해서 더 섬뜩하게.
[금지] 4의 벽 파괴, 실존 브랜드/인물, 좀비/초자연(이 세계의 위협은 인간·기계·자연뿐), 과도한 잔혹 묘사, 영어 남용.`;
