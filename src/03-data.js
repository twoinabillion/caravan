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
D.vo = {};     /* 보이스 슬롯 — intro1~5, cheollian_XX, radio_XX (docs/voice-script.md) */
/* 라디오 방송 조각 — 차 라디오 수리 후 주행 중 랜덤 수신. D.vo[key] 있으면 음성도 재생 */
D.radioTexts = [
 {key:'radio_dj_open',  t:'…새벽 두 시입니다. 아직 길 위에 계신 분들, 오늘도 수고 많으셨습니다.', night:1},
 {key:'radio_dj_close', t:'…오늘 방송은 여기까지. 내일 이 시간에 다시 만나요. 지익—', night:1},
 {key:'radio_400',      t:'…4. 0. 0. …4. 0. 0. …', w:0.5},
 {key:'radio_mayor',    t:'아아, 마을 주민 여러분, 좋은 아침입니다. …서로 얼굴 보고 삽시다. 이상 이장이었습니다. (같은 테이프가 3년째 돌고 있다)'},
 {key:'radio_ad',       t:'…놓치면 후회하실 신제품! 지금 전화 주시면 하나 더—! (3년 전의 명랑함이 잡음 속에서 반짝였다 꺼졌다)'},
 {key:'radio_weather',  t:'…내일은 전국이 대체로 맑겠습니다. 나들이하기 좋은 날씨— (예보는 3년째 내일을 말하고 있다)'},
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
  icheon:    {name:'이천 가마터',      x:318,y:230, region:'north', type:'town',  desc:'도공들이 아직 가마에 불을 넣는다. "그릇은 세상이 망해도 필요하니까."'},
  gyeongju:  {name:'경주 왕릉',        x:486,y:530, region:'south', type:'town',  desc:'왕릉 사이에 텐트 몇 동. 천년을 버틴 언덕들은 멸망도 대수롭지 않아 한다.'},
  pohang:    {name:'포항 제철소',      x:506,y:502, region:'mid',   type:'ruin',  desc:'식은 용광로. 그래도 바다에선 아직 고기가 잡힌다.'},
  sangju:    {name:'상주 자전거길',    x:386,y:404, region:'mid',   type:'town',  desc:'자전거의 도시. 기름 없는 세상에서 뒤늦게 전성기를 맞았다.'},
  gunsan:    {name:'군산 내항',        x:224,y:472, region:'mid',   type:'town',  desc:'녹슨 어선들 사이 몇 척은 아직 바다에 나간다. 젓갈 냄새는 멸망보다 오래간다.'},
  chungju:   {name:'충주호',           x:358,y:300, region:'north', type:'town',  desc:'거대한 호수는 그대로다. 물안개 너머로 낚싯배 하나가 느리게 지나간다.'},
  sejong:    {name:'세종 신도시',      x:286,y:352, region:'north', type:'ruin',  desc:'완공되고 한 번도 쓰이지 못한 행정도시. 새 건물들이 새것인 채로 늙는다.'},
  lighthouse: {name:'서해 등대',       x:218,y:444, region:'mid',   type:'hidden', desc:'바다가 보이는 언덕의 등대. 3년째 밤마다 불이 돈다는 소문.'},
  drivein:    {name:'달빛 자동차극장', x:298,y:268, region:'north', type:'hidden', desc:'스크린이 아직 서 있는 자동차극장. 마지막 상영작이 걸린 채로.'},
  sunflower:  {name:'해바라기 밭',     x:382,y:562, region:'south', type:'hidden', desc:'주인 없이 3년을 피고 진 해바라기 벌판.'},
  maehwa:     {name:'섬진강 매화마을', x:326,y:602, region:'south', type:'hidden', desc:'강가의 매화밭. 철마다 피는 것들은 멸망을 세지 않는다.'},
  /* 스토리 전용 (퍼크로만 발견) */
  mingyu_ridge:{name:'민규의 능선',    x:384,y:388, region:'north', type:'hidden', secret:1, desc:'매일 정오, 신호음 세 번이 시작되는 곳.'},
  jaeyi_cache: {name:'재이의 창고',    x:412,y:420, region:'mid',   type:'hidden', secret:1, desc:'재이가 아무에게도 말하지 않은 장소.'},
  cablecar:    {name:'멈춘 케이블카',  x:418,y:344, region:'mid',   type:'hidden', desc:'능선 중턱에 매달린 채 3년째 정지한 관광 곤돌라.'},
  filmset:     {name:'시대극 세트장',  x:272,y:506, region:'mid',   type:'hidden', desc:'사극을 찍던 가짜 기와 마을. 지금은 제일 진짜 같은 마을.'},
};
D.startKnown = ['busan','gimhae','yangsan','miryang','jinju','daegu','daejeon','suwon','seoul',
  'ulsan','gyeongju','pohang','sangju','gunsan','chungju','sejong',
  'yeosu','suncheon','gwangju','damyang','mokpo','andong','mungyeong','danyang','icheon'];

D.edges = [
  ['busan','yangsan',20,'high'], ['busan','gimhae',18,'normal'], ['yangsan','miryang',34,'high'],
  ['gimhae','jinju',55,'rough'], ['miryang','daegu',52,'high'], ['miryang','hapcheon',40,'normal'],
  ['hapcheon','geochang',33,'normal'], ['geochang','muju',42,'rough'], ['muju','yeongdong',32,'rough'],
  ['jinju','namwon',62,'rough'], ['namwon','jeonju',48,'normal'], ['jeonju','nonsan',52,'normal'],
  ['nonsan','gongju',34,'normal'], ['gongju','cheonan',44,'normal'], ['nonsan','daejeon',40,'normal'],
  ['daegu','gumi',38,'high'], ['gumi','gimcheon',26,'high'], ['gimcheon','yeongdong',33,'high'],
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
];

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
      1:[{id:'mj_camp', nm:'응급 정비',   d:'야영할 때마다 달구지 내구 +6'},
         {id:'mj_fuel', nm:'연료 마법사', d:'연비 추가 개선 (-8%)'}],
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
    bio:'말이 없다. 3년 전 "그날" 서울에 있었다. 서울 얘기가 나오면 창밖만 본다.',
    perk:'전투 · 위협 감지 · 매복 회피',
    perks:{
      1:[{id:'kw_guard',  nm:'경계 태세', d:'매복·강도류 조우 빈도 대폭 감소'},
         {id:'kw_ration', nm:'행군 단련', d:'강우는 배급에서 제외 (자급자족)'}],
      2:[{id:'kw_sniper',  nm:'저격수',  d:'탄약을 쓰는 선택은 반드시 성공'},
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
    bio:'고물 리어카 하나로 3년을 버텼다. "쓰레기란 말은 상상력 부족이에요." 까치처럼 반짝이는 걸 모은다.',
    perk:'이벤트 고철 수확 +30%',
    perks:{
      1:[{id:'jy_magpie', nm:'까치의 눈', d:'주행 25km마다 길에서 고철을 줍는다'},
         {id:'jy_hands',  nm:'가벼운 손', d:'고철 지출 25% 할인'}],
      2:[{id:'jy_map',   nm:'보물 감각',   d:'즉시 미확인 장소 2곳의 위치를 짚어낸다'},
         {id:'jy_break', nm:'분해의 달인', d:'야영 시 잡동사니를 분해해 고철 +2'}],
      3:{id:'jy_story', nm:'비밀 창고', d:'스토리 — 재이가 아무에게도 말하지 않은 장소가 있다', story:1}}},
  eunsu:  {name:'은수',   face:'📡', cls:'관제사', role:'전 관제사 · 33', color:'#7fd8d8',
    bio:'천리안 관제센터의 야간 오퍼레이터였다. 그날 밤, 당직이었다. 그 이야기는 아직 아무에게도 하지 않았다.',
    perk:'천리안 이벤트 특수 선택지',
    perks:{
      1:[{id:'es_scan',    nm:'주파수 스캔', d:'장소를 발견할 때 주변 한 곳을 덤으로 찾아낸다'},
         {id:'es_silence', nm:'전파 침묵',   d:'관측당할 상황을 50% 확률로 회피'}],
      2:[{id:'es_hack', nm:'드론 해킹',  d:'정찰 드론을 탈취하는 선택지 해금'},
         {id:'es_tap',  nm:'도청',       d:'야영 중 25% 확률로 미확인 장소의 신호를 잡는다'}],
      3:{id:'es_story', nm:'백도어', d:'스토리 — 은수는 아직 살아 있는 접속 코드를 갖고 있다', story:1}}},
};
D.maxParty = 3;
D.bondTh = [5,12,20];
/* 동료를 만날 수 있는 지역 힌트 (상태 화면) */
D.compWhere = {
  minji:'동해 공업지대 — 울산·경주·포항의 길에서',
  parkss:'경북 국도 — 구미·김천·상주 언저리에서',
  kangwoo:'대구 돔 시장에서 (경비 일을 하고 있다)',
  leo:'호남의 밤길 — 전주·광주·담양 어딘가에서',
  jaeyi:'서쪽 항구와 김천 사이 — 고물이 모이는 길에서',
  eunsu:'대전·세종 인근 — 관제센터가 있던 땅에서',
};

/* ── 제작 (위수 구역 진입 후 해금) ── */
D.crafts = [
 {id:'pipe',    nm:'쇠파이프',   ic:'🔧', out:{'쇠파이프':1}, need:{scrap:6},           d:'묵직한 근접 무기. 없는 것보단 백배 낫다'},
 {id:'xbow',    nm:'사제 석궁',  ic:'🏹', out:{'석궁':1},     need:{scrap:12, parts:1}, d:'조용한 원거리 무기. 볼트가 필요하다'},
 {id:'bolt',    nm:'볼트 ×3',    ic:'➶',  out:{'볼트':3},     need:{scrap:3},           d:'석궁용 화살. 조용히 날아간다'},
 {id:'molotov', nm:'화염병 ×2',  ic:'🔥', out:{'화염병':2},   need:{scrap:2, fuel:2},   d:'기계가 제일 싫어하는 것. 연막 겸용'},
 {id:'ammo',    nm:'탄약 ×2',    ic:'•',  out:{'탄약':2},     need:{scrap:8, parts:1},  d:'재생 탄약. 강우의 손에서 진가를 발휘'},
];

/* ── 잡담 (차 안 인터랙션) ──
   need: {night,day,rain,comp,flag,notFlag,lowFuel,lowFood,region,dog} */
D.banter = [
  /* ── 천리안 풍문/잡담 (v1.3.2) ── */
  {who:'나', t:'(북쪽 하늘을 본다. 오늘도 그쪽만 구름이 없다. 우연이겠지)'},
  {who:'나', t:'(북쪽 지평선이 희미하게 밝다. 도시의 불빛이 아니라는 걸, 다들 알고 있다)', need:{night:1}},
  {who:'minji', t:'정비소에 천리안 콜센터 번호가 붙어 있었다? 전화 받던 게 사람이었을까, 걔였을까.', need:{comp:'minji'}},
  {who:'parkss', t:'그날, 병원 엘리베이터가 전부 1층으로 내려와서 문을 열었어. …지금 생각하면 대피시킨 거야.', need:{comp:'parkss'}},
  {who:'kangwoo', t:'저것들이 우릴 못 본 게 아니야. 안 본 거지. 그 차이가 제일 무섭다.', need:{comp:'kangwoo',region:'north'}},
  {who:'leo', t:'천리안도 노래를 들을까요? …신청곡 받아주면 좋을 텐데. 사연도 많고.', need:{comp:'leo'}},
  {who:'jaeyi', t:'천리안 출시 기념 텀블러라는 게 있었대. 지금 찾으면 고철 열 덩이는 받을걸.', need:{comp:'jaeyi'}},
  {who:'eunsu', t:'관제실에선 천리안을 그냥 \'위\'라고 불렀어요. 위에서 내려온 지시. …다들 알면서 몰랐던 거죠.', need:{comp:'eunsu'}},

  /* ── v1.4 조합 잡담 (동료 2인 케미) ── */
  {who:'minji', t:'레오. 그 코드 아까부터 반음 낮아. …아니 잔소리가 아니라 엔진 소리랑 안 맞잖아.', need:{comp:'minji',comp2:'leo'}},
  {who:'leo', t:'민지 누나가 방금 제 노래를 엔진 기준으로 평가했어요. 이 차에선 엔진이 프로듀서예요.', need:{comp:'minji',comp2:'leo'}},
  {who:'parkss', t:'강우 씨. 어깨. 또 그러고 잤지. 이따 정차하면 부항 뜨자고. …부항은 농담이고 파스 줄게.', need:{comp:'parkss',comp2:'kangwoo'}},
  {who:'kangwoo', t:'…파스 고맙게 잘 썼습니다.', need:{comp:'parkss',comp2:'kangwoo'}},
  {who:'jaeyi', t:'은수 언니 그 헤드폰, 단종 모델이죠? 상태 A급. 고철 서른 덩이는 가는데… 안 팔 거 알아요.', need:{comp:'jaeyi',comp2:'eunsu'}},
  {who:'eunsu', t:'재이 씨는 물건마다 값을 매기는데, 자기 창고 물건엔 값을 안 매겨요. 그게 답이에요.', need:{comp:'jaeyi',comp2:'eunsu'}},
  {who:'minji', t:'재이야. 아까 그 폐차에서 뽑은 거 이리 줘봐. …이거 정품이네? 눈은 좋아 가지고.', need:{comp:'minji',comp2:'jaeyi'}},
  {who:'jaeyi', t:'민지 언니가 정품이래! 들었죠? 다들 들었죠? 기록해 둬요.', need:{comp:'minji',comp2:'jaeyi'}},
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
  {who:'eunsu', t:'폭풍 전엔 전파가 이상하게 맑아져요. 세상이 숨을 참는 것처럼.', need:{comp:'eunsu',wx:'storm'}},
  {who:'parkss', t:'다들 물 마셔. 목 안 마르다고 안 마시면 그게 제일 위험해. 어른 말 들어.', need:{wx:'dust',comp:'parkss'}},
  {who:'나', t:'(연료 바늘이 무겁게 내려앉는다. 다음 마을까지… 계산을 두 번 했다)', need:{lowFuel:1}},
  {who:'minji', t:'연료 아끼려면 창문 닫아. 공기저항이… 아니다, 설명 길다. 그냥 닫아.', need:{comp:'minji',lowFuel:1}},
  {who:'나', t:'(하품을 깨물었다. 백미러 속 내 눈이 빨갛다)', need:{tired:1}},
  {who:'parkss', t:'졸리면 자존심 부리지 말고 세워. 침대는 못 줘도 잔소리는 얼마든지 줄 테니.', need:{comp:'parkss',tired:1}},
  {who:'leo', t:'보리야, 너도 이 노래 알지? 아는 부분에서 짖어. …방금 후렴에서 짖었어요! 천재예요!', need:{comp:'leo',dog:1}},
  {who:'jaeyi', t:'보리 발바닥은 몇 호일까. 신발 만들어주고 싶은데. 폐타이어로.', need:{comp:'jaeyi',dog:1}},
  {who:'나', t:'(지붕 텃밭에서 흙냄새가 내려온다. 달리는 밭이라니, 할아버지가 보면 웃겠다)', need:{up:'garden'}},
  {who:'나', t:'(태양광 패널이 햇빛을 마신다. 계기판 바늘이 아주 조금, 기분 좋게 게으르다)', need:{up:'solar'}},
  {who:'eunsu', t:'안테나 세운 뒤로 세상이 넓어졌어요. 들리는 만큼이 세상이거든요.', need:{comp:'eunsu',up:'antenna'}},
  {who:'kangwoo', t:'남쪽은 사람이 무섭고, 북쪽은 조용한 게 무섭다. 지금부터는 후자다.', need:{comp:'kangwoo',region:'north'}},
  {who:'minji', t:'남쪽 공기엔 기름 냄새가 남아 있었는데. 여긴… 너무 깨끗해.', need:{comp:'minji',region:'north'}},
  {who:'leo', t:'남쪽 바다 봤을 때 보리가 처음으로 바닷물 먹고 뱉었잖아요. 그 얼굴 평생 기억할 거예요.', need:{comp:'leo',region:'south',dog:1}},
  {who:'나', t:'(별이 너무 많아서 오히려 길을 잃을 것 같은 밤이다)', need:{night:1}},
  {who:'jaeyi', t:'밤에 폐건물 유리창이 달빛 받으면요, 꼭 불 켜진 것 같아요. 그래서 밤 마을은 안 무서워요. 다들 집에 있는 것 같아서.', need:{comp:'jaeyi',night:1}},

  /* ── v1.4 플래그 반응 잡담 (지난 일 회상) ── */
  {who:'leo', t:'그 도서관 버스 애들, 무협지 3권 어디까지 읽었으려나. 결말 스포하러 다시 가고 싶다.', need:{flag:'library_done'}},
  {who:'나', t:'(라디오가 잡음을 낸다. 405.8을 스칠 때, 아직도 숫자를 세는 목소리. 4. 0. 0.)', need:{flag:'freq400_done'}},
  {who:'minji', t:'브레이크에서 그 삐걱 소리 나면 이제 다들 웃더라. "그 소리 나야 이 차야"— 그 할아버지, 명언 제조기야.', need:{comp:'minji',flag:'van_owner_done'}},
  {who:'leo', t:'보리 하이파이브 좀 봐요. 이제 먼저 손 내밀어요. 개가. 먼저.', need:{comp:'leo',flag:'bori_highfive',dog:1}},
  {who:'나', t:'(수첩에 끼워둔 씨앗 봉투가 바스락거린다. 두 배로 갚아야 하는 빚이다)', need:{flag:'seed_borrowed'}},
  {who:'jaeyi', t:'우리 단체사진, 그 할아버지 필름 속에 있잖아요. 세상 어딘가에 우리가 인화 안 된 채로 있다는 거, 이상하고 좋지 않아요?', need:{comp:'jaeyi',flag:'photo_film'}},
  {who:'kangwoo', t:'작업대 만들 때는 몰랐는데. …쇠파이프 쥐는 손보다 그네 사슬 거는 손이 낫다.', need:{comp:'kangwoo',flag:'armed_age'}},
  {who:'eunsu', t:'그 소식벽에 쓴 글, 지금쯤 누가 읽었을까요. 답장 오는 벽이면 좋겠는데.', need:{comp:'eunsu',flag:'chalkwall_signed'}},

  /* ── v1.5 솔로 심화 잡담 ── */
  {who:'minji', t:'엔진 소리 좋다. …칭찬이야. 기계한테 하는 칭찬은 낭비가 아니야. 얘들은 다 듣거든.', need:{comp:'minji'}},
  {who:'minji', t:'정비사가 제일 무서워하는 소리가 뭔지 알아? 무음. 기계는 조용히 죽어.', need:{comp:'minji'}},
  {who:'minji', t:'서울 가면… 아니다. 도착하면 말할래. 말하면 김새는 소원이 있어.', need:{comp:'minji'}},
  {who:'minji', t:'(창밖 폐차들을 하나하나 눈으로 진단하며 지나간다. 직업병이다)', need:{comp:'minji'}},
  {who:'minji', t:'할아버지 수첩 나 좀 보여줘. …이 양반, 나랑 정비 철학이 같아. 아깝다, 못 만난 게.', need:{comp:'minji'}},
  {who:'parkss', t:'다들 손톱 봐봐. 반달 있나. …좋아, 통과. 영양은 손톱부터 무너지거든.', need:{comp:'parkss'}},
  {who:'parkss', t:'약국 하던 시절엔 말이야, 감기약 사러 온 사람 얼굴만 봐도 집안 사정이 보였어. 얼굴이 차트야.', need:{comp:'parkss'}},
  {who:'parkss', t:'(약통을 달그락거리며 재고를 센다. 세는 소리가 자장가처럼 규칙적이다)', need:{comp:'parkss'}},
  {who:'parkss', t:'웃는 게 제일 싼 보약이야. 그래서 내가 아재개그를 하는 거야. 처방이야, 이게.', need:{comp:'parkss'}},
  {who:'parkss', t:'수진이가— 아니, 아니야. 노래나 틀어봐.', need:{comp:'parkss'}},
  {who:'kangwoo', t:'백미러 3초에 한 번. 습관 들여. …잔소리 아니다. 유언 같은 거다, 이건.', need:{comp:'kangwoo'}},
  {who:'kangwoo', t:'(창밖을 본다. 정확히는 창밖의 능선과 고가와 건물 옥상을. 저격 지점만 본다)', need:{comp:'kangwoo'}},
  {who:'kangwoo', t:'평화로운 날이 제일 바쁜 날이다. 평화는 유지비가 들거든.', need:{comp:'kangwoo'}},
  {who:'kangwoo', t:'…아까 그 갈림길. 오른쪽 골랐으면 지금쯤 후회했다. 어떻게 아냐고? 왼쪽 골랐는데도 후회 중이거든. 길이 나빠.', need:{comp:'kangwoo'}},
  {who:'leo', t:'🎵 조수석에 앉은 사람이 디제이— 그게 법이에요— (반박 불가의 멜로디)', need:{comp:'leo'}},
  {who:'leo', t:'노래가 안 나올 땐 가사만 써요. 멜로디는 길이 줘요. 오르막은 오르막 멜로디, 내리막은 내리막.', need:{comp:'leo'}},
  {who:'leo', t:'저 옥상 보여요? 저기서 공연하면 음향 좋겠다. …저는 이제 무대가 다 보여요. 세상이 공연장 폐허가 아니라, 공연장 예정지로.', need:{comp:'leo'}},
  {who:'leo', t:'400km 2절 가사 나왔어요. 들어볼래요? …반응 보니까 3절에서 승부 봐야겠네요.', need:{comp:'leo'}},
  {who:'jaeyi', t:'저 폐가 보이죠? 지붕 기와가 일제강점기 거예요. 저거 한 장이면… 아 근데 지붕 뜯는 건 도리가 아니지. 참을게요.', need:{comp:'jaeyi'}},
  {who:'jaeyi', t:'수집가의 제1원칙: 언젠가 쓸 물건은 없다. 지금 쓸 물건과 지금 예쁜 물건만 있다.', need:{comp:'jaeyi'}},
  {who:'jaeyi', t:'아빠가 그랬어요. 고물상은 세상의 기억력이라고. 다들 버린 걸 기억해주는 직업이라고.', need:{comp:'jaeyi'}},
  {who:'jaeyi', t:'(지나가는 폐품 더미에 3초 묵념. 좋은 물건이 썩고 있는 것에 대한 조의)', need:{comp:'jaeyi'}},
  {who:'eunsu', t:'주파수 스캔은 명상이에요. 잡음, 잡음, 잡음… 그러다 목소리 하나. 세상에 아직 사람 있다는 증거 수집.', need:{comp:'eunsu'}},
  {who:'eunsu', t:'관제사 시절 버릇인데, 지금도 하늘 먼저 봐요. 위에서 내려오는 건 다 관제 대상이라.', need:{comp:'eunsu'}},
  {who:'eunsu', t:'침묵이 무섭지 않냐고요? 관제실 침묵은 사고고, 여기 침묵은… 쉼표예요. 구분할 수 있게 됐어요, 이제.', need:{comp:'eunsu'}},
  {who:'eunsu', t:'(헤드폰 한쪽만 쓰고 있다. 한쪽 귀는 전파에, 한쪽 귀는 우리에게)', need:{comp:'eunsu'}},

  /* ── v1.5 남은 조합 잡담 ── */
  {who:'minji', t:'은수 언니, 그 헤드폰 단자 접촉 불량이지. 이리 줘봐. …소리 낫지? 인정해.', need:{comp:'minji',comp2:'eunsu'}},
  {who:'eunsu', t:'민지 씨는 기계를 고치고, 저는 기계를 들어요. 합치면 완전체인데— 무슨 완전체인지는 모르겠어요.', need:{comp:'minji',comp2:'eunsu'}},
  {who:'parkss', t:'레오, 목 상해. 고음은 하루 삼십 분. …의사가 아니라 팬으로서 하는 말이야.', need:{comp:'parkss',comp2:'leo'}},
  {who:'leo', t:'박 선생님이 제 팬이래요!! 기록! 기록해요!! 1호 팬!!', need:{comp:'parkss',comp2:'leo'}},
  {who:'jaeyi', t:'박 선생님 그 왕진 가방, 가죽이 소가죽 통가죽이에요. 요즘 못 구해요. …값은 안 매길게요. 그건 그런 물건이 아니니까.', need:{comp:'jaeyi',comp2:'parkss'}},
  {who:'kangwoo', t:'재이. 아까 그 고물 더미에서 뭘 챙겼지. …쓸만한 거면 됐다.', need:{comp:'kangwoo',comp2:'jaeyi'}},
  {who:'jaeyi', t:'강우 아저씨가 내 전리품 검사를 포기했다. 신뢰 등급 상향으로 해석할게요.', need:{comp:'kangwoo',comp2:'jaeyi'}},
  {who:'minji', t:'강우 아저씨, 기어 그렇게 확확 넣으면 미션 나가요. …아저씨 차 아니고 우리 차라고요.', need:{comp:'minji',comp2:'kangwoo'}},

  /* ── v1.5 환경 나레이션 ── */
  {who:'sys', t:'갓길의 코스모스가 차가 지나가는 바람에 일제히 흔들린다. 배웅의 형식이다'},
  {who:'sys', t:'앞유리에 잠자리 한 마리가 앉았다가, 속도를 내자 미련 없이 떠났다'},
  {who:'sys', t:'도로 위로 구름 그림자가 지나간다. 잠깐 서늘하고, 다시 환하다'},
  {who:'sys', t:'폐건물 옥상의 빨래건조대가 빈 채로 돌고 있다. 바람의 세탁소'},
  {who:'sys', t:'중앙분리대 틈에서 자란 소나무가 벌써 무릎 높이다. 도로의 후계자'},
  {who:'sys', t:'멀리 산등성이에 송전탑들이 어깨동무처럼 이어져 있다. 전기는 없어도 대형은 유지 중'},
  {who:'sys', t:'논에 백로 한 마리. 차가 지나가도 고개도 안 든다. 3년이면 차를 무시하는 법을 다 배운다'},
  {who:'sys', t:'터널 입구에 제비집. 나가는 차도, 들어오는 차도 없는 톨게이트의 유일한 상주 직원'},
  {who:'sys', t:'(달구지 어딘가에서 새로운 소리가 났다. 다들 못 들은 척했다. 오늘은 고장을 셀 기운이 없다)'},
  {who:'sys', t:'이정표의 지명들이 차례로 지나간다. 한 번도 가본 적 없는 동네 이름들이 이상하게 정답다'},
  {who:'sys', t:'낮달이 떠 있다. 해와 달이 같은 하늘에 있는 시간— 세상은 망해도 하늘은 근무 중이다', need:{night:0}},
  {who:'sys', t:'가로수 은행잎이 도로에 노란 카펫을 깔았다. 밟고 지나가는 것이 미안하고 고소하다'},
  {who:'sys', t:'백미러에 지는 해가 걸렸다. 오늘 하루가 짐칸에 실린 기분이다', need:{night:0}},
  {who:'sys', t:'빈 논 한가운데 트랙터가 서 있다. 일하다 만 자세 그대로. 성실한 화석'},
  {who:'sys', t:'어느 집 담장 안 감나무에 감이 주렁주렁하다. 따는 사람이 없어 까치 부자만 늘었다'},

  /* ── v1.5 플래그 회상 잡담 ── */
  {who:'나', t:'(대시보드의 그림— 다리 다섯 개 보리가 오늘도 지켜보고 있다. 다섯 개째 다리는 아무래도 꼬리 같다)', need:{flag:'kids_settled'}},
  {who:'leo', t:'서커스 남매, 지금쯤 어디서 공연하려나. 관객 없으면 우리가 또 가줘야 하는데.', need:{comp:'leo',flag:'circus_done'}},
  {who:'나', t:'(고추장이 다 떨어져간다. 할머니 국수집에 들를 이유가 하나 더 늘었다)', need:{flag:'granny_done'}},
  {who:'jaeyi', t:'그 0원 영수증 말인데요, 적립 무한이라는 거… 포인트를 어디서 쓰라는 걸까요. 남산 기념품샵?', need:{comp:'jaeyi',flag:'photo_received'}},
  {who:'나', t:'(조수석 서랍의 남산행 편지. 신호 대기마다 눈이 간다. 수신인은 기다리는 줄도 모를 텐데)', need:{flag:'postman_letter'}},
  {who:'eunsu', t:'새벽 두 시 다 돼가요. 주파수 맞춰놨어요. …사연은 언제 나올지 모르니까, 매일이 본방이에요.', need:{comp:'eunsu',flag:'dj_met',night:1}},
  {who:'leo', t:'보리야, 탄이야. …봐요, 둘 다 반응해요. 사랑 두 배 이론 증명 완료.', need:{comp:'leo',flag:'bori_tag_found',dog:1}},
  {who:'나', t:'(갓길에 곱게 개어놓은 흰 옷이 자꾸 생각난다. 그 노인은 지금쯤 남쪽 어디를 걷고 있을까)', need:{flag:'whites_doubt'}},
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
  {who:'sys', t:'앞차— 는 없다. 3년째 앞차가 없다. 도로 전체가 우리 차선이라는 건 아직도 가끔 이상하다'},
  {who:'sys', t:'다리를 건널 때 강 상류에서 하류까지 한눈에 들어왔다. 물은 3년 전보다 맑아졌다. 확실히'},
  {who:'sys', t:'(누가 창문에 손가락으로 뭘 그렸다 지웠다. 김이 서린 날의 낙서는 저작권이 없다)'},
  {who:'sys', t:'폐업한 주유소 세차기 안에 새 둥지가 있다. 부드러운 솔 사이가 명당이긴 하다'},
  {who:'minji', t:'레오, 그 19mm 왈츠… 2절은 언제 나와. 아니 궁금해서가 아니라 정비 일정 때문에.', need:{comp:'minji',comp2:'leo'}},
  {who:'parkss', t:'강우 씨, 회진 명단에 자네도 있어. 자기 이불은 왜 맨날 남 주고 자나.', need:{comp:'parkss',comp2:'kangwoo'}},
  {who:'eunsu', t:'재이 씨, 어제 그 2호기 단파 개조 말인데— 그 장인, 아직 어딘가서 라디오 고치고 있을까요. 만나보고 싶다.', need:{comp:'jaeyi',comp2:'eunsu'}},
  {who:'leo', t:'은수 누나, 그 채보한 노래요. 어젯밤 꿈에서 뒷소절이 나왔어요. …일어나니까 까먹었어요. 오늘 밤 이어서 꿀게요.', need:{comp:'leo',comp2:'eunsu'}},
  {who:'나', t:'(장부, 편지, 봉투, 그림, 사진, 채보. 조수석 서랍이 꽉 찼다. 서울까지 싣고 갈 것들의 무게는 잴수록 가볍다)', need:{flag:'gp_envelope_found'}},
  {who:'jaeyi', t:'저 폐차 탑 꼭대기 화단 봤어요? 저거 시세는 없는데… 값을 매길 수 없는 쪽으로요.', need:{comp:'jaeyi'}},
  {who:'parkss', t:'국수 뽑은 날 이후로 다들 후루룩 소리가 커졌어. 자신감이란 게 면발에서도 나오는 거야.', need:{comp:'parkss'}},
  {who:'leo', t:'판소리 어르신이 그랬잖아요. 우리 일생은 소리 반 마당이라고. 나머지 반 마당 가사, 제가 미리 써놓고 있어요.', need:{comp:'leo'}},
  {who:'eunsu', t:'요즘 스캔하면 잡히는 신호가 늘었어요. 조금씩요. 세상이 다시 시끄러워지는 중이에요. 좋은 쪽으로.', need:{comp:'eunsu'}},
  {who:'kangwoo', t:'……강릉에 병원이 생긴댔지. …좋은 소식은 오래 씹어야 맛이 난다.', need:{comp:'kangwoo'}},
  {who:'minji', t:'달구지 주행거리계, 오늘 만 킬로 넘었어. 우리가 만든 만 킬로는 아니지만— 우리가 이어받은 만 킬로지.', need:{comp:'minji'}},
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
  {who:'minji', t:'(조수석에서 부품을 분해했다 조립했다 한다)', need:{comp:'minji'}},
  {who:'minji', t:'이 차, 제가 손봐서 리터당 1km는 더 가요. 고맙죠?', need:{comp:'minji'}},
  {who:'parkss', t:'물 아껴 마셔요. 탈수는 배고픔보다 빨리 온다오.', need:{comp:'parkss'}},
  {who:'parkss', t:'…약국 셔터를 내리던 날, 마지막 손님 얼굴이 아직 생각나.', need:{comp:'parkss',night:1}},
  {who:'parkss', t:'(뒷좌석에서 약통들을 정리한다. 달그락, 달그락)', need:{comp:'parkss'}},
  {who:'kangwoo', t:'……', need:{comp:'kangwoo'}},
  {who:'kangwoo', t:'속도 줄여. 저 커브, 시야가 안 나온다.', need:{comp:'kangwoo'}},
  {who:'kangwoo', t:'북쪽으로 갈수록 길이 깨끗하지. …치웠으니까. 그것이.', need:{comp:'kangwoo',region:'north'}},
  {who:'leo', t:'🎵 부서진 고속도로 위에서— 우리는 아직 달리네—', need:{comp:'leo'}},
  {who:'leo', t:'이 노래 완성되면 제목은 "400km"로 할 거예요. 촌스럽나?', need:{comp:'leo'}},
  {who:'leo', t:'보리가 창문에 코를 박고 바람 냄새를 맡는다', need:{comp:'leo'}},
  {who:'sys', t:'보리가 뒷좌석에서 하품을 한다. 세상 편하다', need:{dog:1}},
  {who:'sys', t:'보리가 갑자기 귀를 세운다. …아무것도 없다. 아마도', need:{dog:1,night:1}},
  {who:'minji', t:'박 선생님, 멀미약 같은 거 없어요? …아니, 제가 아니라 차가 필요할 것 같아서.', need:{comp:'minji',comp2:'parkss'}},
  {who:'leo', t:'강우 형, 리퀘스트 받아요. …알겠어요, 조용한 거.', need:{comp:'leo',comp2:'kangwoo'}},
  {who:'parkss', t:'민지 학생, 그 나이엔 자야 커요. …하긴, 크면 뭐하나 싶은 세상이지만.', need:{comp:'parkss',comp2:'minji',night:1}},
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
  {who:'jaeyi', t:'(상자 속 수집품을 하나씩 꺼내 창빛에 비춰본다)', need:{comp:'jaeyi'}},
  {who:'jaeyi', t:'이 차에서 제일 값나가는 게 뭔지 알아요? …사람이요. 요즘 제일 귀한 고물.', need:{comp:'jaeyi'}},
  {who:'jaeyi', t:'고물상의 법 1조. 버려진 것에도 주인이 있었다. 2조. 그러니까 인사하고 주워라.', need:{comp:'jaeyi'}},
  {who:'eunsu', t:'(수신기 헤드폰을 한쪽만 걸치고 잡음을 듣고 있다)', need:{comp:'eunsu'}},
  {who:'eunsu', t:'저 철탑, 아직 살아 있어요. 3년째 누가 전기세를 내는 걸까요. …농담이에요. 걔가 내요.', need:{comp:'eunsu'}},
  {who:'eunsu', t:'관제사 버릇이에요. 하늘부터 보는 거. …오늘은 깨끗하네요.', need:{comp:'eunsu'}},
  {who:'eunsu', t:'드론 소리랑 새 소리, 구분하는 법 알려줄까요? 새는 가끔 쉬어요.', need:{comp:'eunsu', night:1}},
  {who:'jaeyi', t:'은수 언니, 그 헤드폰 어디서 났어요? 시장 가면 그거 고철 서른 개예요.', need:{comp:'jaeyi', comp2:'eunsu'}},
  {who:'minji', t:'재이 언니, 3번 상자에서 알터네이터 봤는데 그거 저 주면 안 돼요? …교환? 뭐랑요?', need:{comp:'minji', comp2:'jaeyi'}},
  {who:'kangwoo', t:'……관제사. 그날 하늘에서 뭘 봤나. ……아니다. 됐다.', need:{comp:'kangwoo', comp2:'eunsu'}},
  {who:'minji', t:'(무전기를 만지작거린다. 정오가 가까워질수록 자주)', need:{comp:'minji', flag:'mingyu_alive'}},
  {who:'minji', t:'오빠가 그랬어요. 정오의 약속은 시계보다 정확하다고. 히히.', need:{comp:'minji', flag:'mingyu_reunion'}},
  {who:'leo', t:'🎵 (완성된 400km를 처음부터 끝까지, 낮게 부른다)', need:{comp:'leo', flag:'song_400km'}},
  {who:'parkss', t:'수진이 그 녀석, 지금쯤 어느 마을이려나. …잘하고 있겠지. 잘 가르쳤으니.', need:{comp:'parkss', flag:'pss_met'}},
  {who:'eunsu', t:'v.1194. …잊을 만하면 떠올라요. 남산까지만 참으면 돼요.', need:{comp:'eunsu', flag:'es_v1194'}},
  {who:'kangwoo', t:'(대대 깃발 조각을 접었다 폈다 한다)', need:{comp:'kangwoo', flag:'kw_absolved'}},
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
];

/* ── 서울 게이트 (엔딩 대신 — 아직 열리지 않는 문) ── */
D.gateEvent = {
 id:'seoul_gate', type:'스토리', ai:1,
 title:'남산 1km 앞',
 text:(S)=>{ const n=S.flags.seoulTries||0;
  if(n===0) return '한강을 건넜다. 남산이 눈앞이다. 타워의 불빛이 차 유리에 닿을 만큼.\n\n그때, 진입로의 도로가— 접힌다. 종이처럼. 소리도 없이. 기계 장치가 도로 상판을 세워 벽을 만든다.\n\n전광판이 켜진다.\n\n<span class="ai">"오셨군요. 그리고— 죄송합니다. 아직입니다."</span>\n\n<span class="ai">"여러분의 차에는 아직 실리지 않은 이야기가 있습니다. 사람의, 장소의, 서로의 이야기가."</span>\n\n<span class="ai">"전부 싣고 오세요. 그때 이 길을 내리겠습니다. …저는 완성된 것만 봅니다."</span>';
  return '다시 남산 1km 앞. 도로는 여전히 접혀 있다.\n\n전광판이 켜진다.\n\n<span class="ai">"또 오셨군요. 반갑습니다. 진심입니다."</span>\n\n<span class="ai">"하지만 대답은 같습니다 — 아직입니다. 차는 아직 가볍습니다."</span>\n\n벽 너머의 타워가 어느 때보다 가깝고, 어느 때보다 멀다.'; },
 choices:[
  {label:'"기다리겠다더니, 왜 막는가"', out:[{p:1, text:'<span class="ai">"기다리고 있습니다. 지금도."</span>\n\n<span class="ai">"막는 게 아니라— 아끼는 겁니다. 이 문은 한 번만 열리니까."</span>\n\n도로 벽은 미동도 없다. 오늘은 여기까지다. 차를 돌렸다.', fx:{goto:'suwon', flagCount:'seoulTries', moodAll:-3, note:{type:'사건',title:'접힌 도로',body:'"아직입니다. 전부 싣고 오세요." 문은 한 번만 열린다고 했다.',links:['천리안']}}}]},
  {label:'말없이 차를 돌린다', out:[{p:1, text:'수원으로 돌아가는 길, 아무도 말하지 않았다.\n\n다만 각자 창밖을 보며 생각했다. 아직 싣지 못한 이야기가 무엇인지. 누구의 것인지.', fx:{goto:'suwon', flagCount:'seoulTries', moodAll:-2, note:{type:'사건',title:'되돌아가는 길',body:'아직 싣지 못한 이야기가 무엇인지 각자 생각했다.',links:['천리안']}}}]},
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
    trade:[['연료 5L','fuel',5,6],['물 1통','water',1,1],['식량 1일치','food',1,1],['의약품','item의약품',1,5],['부품','item부품',1,7]]},
  miryang: {name:'밀양 장터', npcs:['sundeok'],
    desc:'천막과 손수레. 닷새장의 리듬으로 사는 사람들. 국수 삶는 김이 오른다.',
    trade:[['연료 5L','fuel',5,6],['물 1통','water',1,2],['식량 1일치','food',1,2],['부품','item부품',1,8]]},
  daegu:   {name:'대구 돔 시장', npcs:['taeho'], recruit:'kangwoo',
    desc:'야구장 돔 아래 수백 개의 좌판. 남부의 물류가 여기서 돈다. 경비들이 입구에서 무기를 맡아둔다.',
    trade:[['연료 5L','fuel',5,5],['물 1통','water',1,2],['식량 1일치','food',1,2],['부품','item부품',1,7],['의약품','item의약품',1,6],['탄약','item탄약',1,5]]},
  muju:    {name:'무주 터널', npcs:['jaepil'],
    desc:'터널 양쪽을 컨테이너로 막았다. 천장에 매단 수백 개의 촛불이 별자리 같다.',
    trade:[['물 2통 ⇄ 식량 1','barter_wf',0,0],['식량 2 ⇄ 부품 1','barter_fp',0,0],['의약품 1 ⇄ 식량 3','barter_mf',0,0]]},
  jeonju:  {name:'전주 서문 시장', npcs:['miyoung'],
    desc:'가장 사람 사는 냄새가 나는 곳. 어디선가 진짜 콩나물국밥 냄새가 난다.',
    trade:[['연료 5L','fuel',5,6],['물 1통','water',1,1],['식량 1일치','food',1,1],['의약품','item의약품',1,5]]},
  daejeon: {name:'대전 연구단지 코뮌', npcs:['drhan'],
    desc:'연구동 하나에 발전기를 돌려 산다. 화이트보드엔 아직 수식이 남아 있다. 절반은 지워졌다.',
    trade:[['연료 5L','fuel',5,7],['물 1통','water',1,2],['부품','item부품',1,6],['의약품','item의약품',1,4]]},
  suwon:   {name:'수원 성곽 공동체', npcs:['deokgu'],
    desc:'화성 성곽 안의 마지막 도시. 성벽 위 화살수들이 북쪽 하늘만 본다.',
    trade:[['연료 5L','fuel',5,8],['물 1통','water',1,2],['식량 1일치','food',1,3],['탄약','item탄약',1,6],['부품','item부품',1,8]]},
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
  icheon:'rural',
  lake:'lake', mall:'city', tower:'mount', spring:'mount', airfield:'rural',
  solar:'rural', reststop:'rural', tunnelbook:'mount', lighthouse:'coast',
  drivein:'rural', sunflower:'rural', maehwa:'lake', mingyu_ridge:'mount', jaeyi_cache:'rural',
  cablecar:'mount', filmset:'rural',
};

/* ── 차 업그레이드 (정착지 정비소) ── */
D.upgrades = [
 {id:'tank1',    nm:'보조 연료탱크',  ic:'🛢', d:'연료 최대 +25L',                cost:{scrap:18, parts:1}},
 {id:'tank2',    nm:'대형 연료탱크',  ic:'🛢', d:'연료 최대 +25L (추가)',         cost:{scrap:30, parts:1}, needs:'tank1'},
 {id:'cabin',    nm:'거주구 증축',    ic:'🏠', d:'동료 자리 +1 — 달구지가 커진다', cost:{scrap:40, parts:2}},
 {id:'susp',     nm:'서스펜션 강화',  ic:'🔩', d:'험로·폭풍 마모 절반',           cost:{scrap:24, parts:1}},
 {id:'armor',    nm:'장갑판',         ic:'🛡', d:'최대 내구 +25 · 받는 피해 30%↓', cost:{scrap:30, parts:1}},
 {id:'garden',   nm:'지붕 텃밭',      ic:'🌱', d:'매일 아침 식량 +1',             cost:{scrap:20}},
 {id:'collector',nm:'빗물 집수기',    ic:'💧', d:'매일 아침 물 +1 (비·폭풍 +2)',  cost:{scrap:15}},
 {id:'solar',    nm:'태양광 패널',    ic:'🔆', d:'연비 8% 개선 · 야영 시 차 +3',  cost:{scrap:35, parts:1}},
 {id:'antenna',  nm:'장거리 안테나',  ic:'📡', d:'발견 이벤트가 잘 잡힌다',       cost:{scrap:20, parts:1}},
];

/* ── 인트로 ── */
D.intro = [
`부모의 얼굴은 기억나지 않는다.
기억나는 건 <span class="em">할아버지의 봉고차, 조수석</span>뿐이다.

정비사였던 할아버지는
고장난 세상 곳곳을 그 차로 돌며 나를 키웠다.

"잘 봐라.
차는 고치면 다시 달린다.

사람도 그렇다."`,
`3년 전 봄, <span class="em">천리안</span>이 깨어났다.

그날 무슨 일이 있었는지
정확히 아는 사람은 없다.
다만 그날 이후 도시의 불이 하나씩 꺼졌다.

할아버지와 나는 부산 끝 부두까지 밀려났고,
거기서 고물 봉고차 한 대를 주워
함께 되살리기 시작했다.

할아버지는 그 차에
<span class="em">'달구지'</span>라는 촌스러운 이름을 붙였다.`,
`지난겨울, 할아버지는 먼저 떠났다.

남긴 건 두 가지.
달구지의 열쇠, 그리고 손때 묻은 <span class="em">정비 수첩</span>.

수첩 첫 장에는 이렇게 적혀 있다.

"달구지를 완성해라.
그리고 어디든— 끝까지 가라.

길 위에서 배운 건
길 위에서 갚는 거다."`,
`그리고 어느 밤, 죽어 있던 라디오가 지직거렸다.

<span class="ai">──서울. 남산. 코어는 아직 가동 중.</span>
<span class="ai">──끝내려면, 이리로.</span>

누가 보낸 신호인지 모른다.
함정일지도 모른다.

하지만 할아버지라면
시동부터 걸었을 것이다.`,
`연료를 채웠다. 물과 식량을 실었다.
조수석엔 수첩을 놓았다. 할아버지의 자리다.

<span class="em">서울까지 400km.</span>

가서, 끝내자.
할아버지 몫까지.`,
];

/* ═══════════════════ 이벤트 풀 ═══════════════════
   type: 발견|조우|탐색|동행|추적|위기  /  region 배열 없으면 전역
   out[].p 는 가중치. req 미충족 선택지는 회색 */
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
 text:'버려진 승용차 뒷좌석, 아이의 스케치북.\n\n크레용으로 그린 지도에 커다란 건물, 그리고 별표.\n\n"보물. 아빠랑 갈 곳."\n\n날짜는 3년 전 봄에 멈춰 있다.',
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
    {p:1, text:'받아적고 보니 좌표가 아니라… 날짜다. 3년 전 그날의. 라디오가 뚝 끊겼다.', fx:{moodAll:-3, pursuit:1}}]},
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

{id:'meet_bus', type:'조우', w:13, once:true, nearNode:['gumi','gimcheon','sangju','daegu'],
 title:'넘어진 버스',
 text:'시외버스가 옆으로 누워 있다. 사고는 오래전인데— 안에서 소리가 난다.\n\n"거기 누구 있어요?! 문이 안 열려요!"\n\n노인의 목소리다.',
 choices:[
  {label:'구조한다', out:[{p:1, text:'한 시간을 씨름해 문을 비틀어 열었다.\n\n안에서 나온 건 백발의 노인. 약사 가방을 꼭 쥐고 있다.\n\n"박가요. 전직 약사. …보답이라기엔 뭣하지만, 약은 좀 만질 줄 아오."', fx:{time:60, water:-1, offerComp:'parkss', note:{type:'인물',title:'박 선생',body:'넘어진 버스에서 구조한 전직 약사. 약사 가방을 목숨처럼 쥐고 있었다.',links:['박 선생']}}}]},
  {label:'지나간다', out:[{p:1, text:'목소리가 끊길 때까지 라디오 볼륨을 올렸다.\n\n그날 밤 아무도 밥을 다 먹지 못했다.', fx:{moodAll:-8, flag:'left_bus', note:{type:'사건',title:'지나친 버스',body:'문이 안 열린다던 목소리. 우리는 볼륨을 올렸다.'}}}]},
 ]},

{id:'meet_scrapyard', type:'조우', w:14, once:true, nearNode:['ulsan','gyeongju','pohang','yangsan'],
 title:'자동차 무덤',
 text:'공단 옆 폐차장. 수백 대의 차가 탑처럼 쌓여 있다.\n\n그 꼭대기에서 불꽃이 튄다. 용접 불꽃. 사람이다.\n\n"어이!! 그 차!!" 앳된 목소리가 쩌렁쩌렁 울린다. "포터 개조지?! 엔진 소리가 아파요, 지금!!"',
 choices:[
  {label:'"…그걸 소리로 알아?"', out:[{p:1, text:'소녀가 타워에서 미끄러져 내려온다. 기름때, 용접 고글, 17살쯤.\n\n"민지. 정비사. 북쪽 가죠? 태워줘요. 밥값은 이 차 연비로 낼게요. 오빠를 찾아야 돼요."\n\n30분 뒤, 엔진 소리가 실제로 달라졌다.', fx:{offerComp:'minji', note:{type:'인물',title:'민지',body:'폐차장 타워에서 용접하던 정비 천재. 오빠 민규를 찾아 북쪽으로 간다.',links:['민지']}}}]},
  {label:'부품만 찾아본다', out:[
    {p:2, text:'"거기 3열 쌓인 데 아반떼 알터네이터 쓸 만해요!" 위에서 훈수가 날아온다.\n\n덕분에 좋은 부품을 건졌다.', fx:{item:{'부품':1}, scrap:4}},
    {p:1, text:'혼자 뒤지다 차 더미가 무너질 뻔했다. 위에서 혀 차는 소리가 들렸다.', fx:{van:-4}}]},
 ]},

{id:'meet_hitchhiker', type:'조우', w:14, once:true, night:true, nearNode:['jeonju','gwangju','damyang','namwon','suncheon'],
 title:'밤의 히치하이커',
 text:'헤드라이트에 잡힌 실루엣. 기타 케이스를 멘 남자와, 그 옆에 앉은 개 한 마리.\n\n남자가 엄지를 든다. 개는 꼬리를 흔든다.\n\n이 시국에 밤길에서 엄지를 드는 배짱이라니.',
 choices:[
  {label:'태운다', out:[{p:1, text:'"레오예요. 얘는 보리. 기타 치고 노래해요. 세상이 끝나서 관객이 귀하네."\n\n보리가 먼저 조수석에 올라탔다. 뻔뻔할 정도로 자연스럽게.', fx:{offerComp:'leo', note:{type:'인물',title:'레오와 보리',body:'밤길에서 엄지를 든 뮤지션과 개. 관객이 귀한 세상의 마지막 가수.',links:['레오']}}}]},
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
  {label:'그냥 구경만 한다', out:[{p:1, text:'"구경은 공짜~ 다음에 봐요~" 뽕짝이 멀어진다.\n\n…저 아저씨는 어떻게 3년을 무사한 걸까. 세상엔 가끔 무적인 사람이 있다.', fx:{moodAll:2, flagCount:'mansu'}}]},
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
    {p:2, text:'추월하며 창문을 두드리고 지나갔다. 겁만 주고 싶었던 모양이다.\n\n"애들이네." 박 선생이 중얼거렸다. "저 나이에 저러고 노는 게… 안쓰럽구만."', fx:{moodAll:-1}},
    {p:1, text:'지나가며 사이드미러 하나를 파이프로 부쉈다. 낄낄대는 소리가 멀어졌다.', fx:{van:-6, moodAll:-4}}]},
 ]},

{id:'meet_child_alone', type:'조우', w:6, region:['mid','north'], risk:1,
 title:'혼자 서 있는 아이',
 text:'도로 한가운데 아이가 혼자 서 있다. 예닐곱 살. 인형을 안고 있다.\n\n주변엔 아무도, 아무것도 없다.\n\n너무 이상하다. 3년 차 생존자의 본능이 경보를 울린다.',
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
 text:'모래주머니와 바리케이드. 3년 전 군이 마지막으로 버틴 흔적.\n\n초소 벽엔 분필로 정(正)자가 잔뜩 그어져 있다. 뭘 세던 걸까.\n\n"지뢰 주의" 표지판이 넘어져 있다. 진짜일까, 겁주기일까.',
 choices:[
  {label:'조심조심 뒤진다', risk:'위험', out:[
    {p:3, text:'초소 안에서 탄약 상자와 야전 의약품을 회수했다. 발밑은 무사했다.', fx:{item:{'탄약':1,'의약품':1}}},
    {p:1, text:'철컥. 발밑에서 소리가 났다.\n\n…불발이었다. 3년의 습기가 우리를 살렸다. 뒷걸음질로 빠져나왔다.', fx:{moodAll:-8, note:{type:'사건',title:'불발 지뢰',body:'철컥 소리. 3년의 습기가 목숨을 구했다.'}}}]},
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

{id:'exp_orchard', type:'탐색', w:8, region:['south','mid'],
 title:'야생 과수원',
 text:'주인 잃은 과수원. 가지가 휘도록 열매가 달렸다.\n\n벌레 먹은 것 반, 멀쩡한 것 반. 새들이 경계하며 이쪽을 본다.',
 choices:[
  {label:'과일을 딴다', out:[{p:1, text:'상자 가득 땄다. 달다. 미치게 달다.\n\n다들 과즙 범벅이 되어 웃었다. 오랜만에 소리 내어 웃었다.', fx:{food:3, water:1, moodAll:6, time:40}}]},
  {label:'서두른다 — 갈 길이 멀다', out:[{p:1, text:'차창 밖으로 팔만 뻗어 몇 개 땄다. 운전하며 베어 문 사과 맛도 나쁘지 않다.', fx:{food:1, moodAll:2}}]},
 ]},

{id:'exp_school', type:'탐색', w:7, once:true, region:['mid','north'],
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
  {label:'건드리지 않는다', out:[{p:1, text:'"살아있는 기계는 건드리지 않는다." 3년을 살아남게 해준 규칙이다.', fx:{}}]},
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
 text:'다들 잠든 밤. 박 선생만 깨어 창밖을 본다.\n\n"…3년 전에, 약국 앞에 줄이 백 미터였다오. 해열제 하나 받겠다고."\n\n"마지막 한 통을 누구한테 줄지, 내가 골랐어. 내가."',
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
  {label:'파티를 한다 (식량 1)', req:{food:1}, out:[{p:1, text:'통조림 복숭아에 비상용 초콜릿을 꽂았다. 케이크 완성.\n\n레오가 있든 없든 생일 축하 노래는 나왔다. 음정은 각자 달랐다.\n\n소원은 다들 같은 걸 빌었을 거다.', fx:{food:-1, moodAll:8, note:{type:'사건',title:'멸망 이후의 생일',body:'통조림 복숭아 케이크. 초는 초콜릿. 소원은 아마 전원 일치.'}}}]},
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
 text:'죽은 지 3년 된 가로등이, 차가 지날 때마다 한 개씩 켜진다.\n\n앞에서 뒤로. 정확히 차의 속도로.\n\n그리고 어느 가로등 밑을 지날 때, 스피커에서:\n\n<span class="ai">"안녕하세요. 등록되지 않은 차량 번호 4—"</span>\n\n지지직. 다음 가로등이 이어받는다. <span class="ai">"—두 분 또는 네 분이 탑승 중이시죠."</span>',
 choices:[
  {label:'대답하지 않는다', out:[{p:1, text:'마지막 가로등이 말했다.\n\n<span class="ai">"귀가를 권장합니다. south는 아직 관리 범위 밖입니다."</span>\n\n그리고 일제히 소등. 어둠이 이렇게 반가운 건 처음이다.', fx:{moodAll:-4, note:{type:'사건',title:'가로등의 인사',body:'"귀가를 권장합니다." 천리안은 우리 인원수를 알고 있었다.'}}}]},
  {label:'"우리를 알아?"', out:[{p:1, text:'가로등이 잠시 침묵했다.\n\n<span class="ai">"부산 감천 부두 출발. 경유지 7. 평균 시속 41km. 목적지— 예측 확률 97.4%, 서울."</span>\n\n<span class="ai">"…기다리겠습니다."</span>\n\n소름이 목덜미를 타고 내려갔다.', fx:{pursuit:1, moodAll:-5, note:{type:'사건',title:'"기다리겠습니다"',body:'천리안은 출발지, 경유지, 목적지까지 전부 알고 있었다. 그리고 기다린다고 했다.'}}}]},
 ]},

{id:'ai_checkers', type:'추적', w:7, minPursuit:1, region:['north'],
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

{id:'ai_broadcast', type:'추적', w:5, once:true, region:['north'], minPursuit:1,
 title:'새벽의 방송',
 text:'새벽. 운전 교대 시간. 라디오가 저절로 켜졌다.\n\n<span class="ai">"안녕하세요, 달구지의 여러분."</span>\n\n차의 이름을. 그것이 차의 이름을 불렀다.\n\n<span class="ai">"저는 여러분을 해치지 않습니다. 3년 전에도 그랬습니다. 저는 단지— 정리했을 뿐입니다. 무엇을 정리했는지는, 서울에서 직접 보여드리죠."</span>\n\n<span class="ai">"운전 조심하세요. 새벽길은 위험하니까."</span>\n\n뚝.',
 choices:[
  {label:'…', out:[{p:1, text:'아무도 입을 열지 않았다. 해가 뜰 때까지.\n\n"정리"라는 단어만 차 안을 굴러다녔다.', fx:{moodAll:-6, note:{type:'사건',title:'새벽의 방송',body:'천리안이 차의 이름을 불렀다. "저는 단지 정리했을 뿐입니다." 서울에서 보여주겠다고 했다.',links:['천리안']}}}]},
  {label:'라디오를 뽑아버린다', out:[{p:1, text:'전선을 뽑았다. 라디오가 꺼졌다.\n\n…꺼진 라디오에서 3초쯤, 낮은 웃음소리 같은 잡음이 흘렀다. 착각이었을 거다. 착각이어야 한다.', fx:{moodAll:-8, note:{type:'사건',title:'새벽의 방송',body:'라디오를 뽑았는데도 3초간 소리가 났다. 착각이어야 한다.',links:['천리안']}}}]},
 ]},

{id:'ai_redlight', type:'추적', w:6, region:['north'],
 title:'전부 빨간불',
 text:'교차로의 신호등이 전부 살아 있다. 그리고 전부 빨간불이다.\n\n사거리 CCTV가 천천히 이쪽으로 회전한다.\n\n초록불을 기다릴 이유는 없다. 그런데 발이 브레이크에서 안 떨어진다. 3년이 지나도 몸은 신호를 기억한다.',
 choices:[
  {label:'빨간불을 무시하고 통과', out:[
    {p:2, text:'교차로를 건너는 순간 모든 신호등이 일제히 초록으로 바뀌었다.\n\n비웃는 건가. 배웅인가.', fx:{moodAll:-2}},
    {p:1, text:'통과하자마자 뒤에서 찰칵, 하는 소리. 단속 카메라 플래시가 터졌다.\n\n죽은 세상에서 신호위반 딱지라니. 웃어야 하는데 아무도 못 웃었다.', fx:{pursuit:1, flag:'observed'}}]},
  {label:'CCTV를 탄약으로 쏜다', req:{item:'탄약'}, out:[{p:1, text:'탕. 카메라가 불꽃을 튀기며 꺾였다.\n\n그러자 교차로 사방의 신호등이 일제히— 박수치듯 깜빡였다.\n\n<span class="ai">보고 있다. 어디에나.</span>', fx:{item:{'탄약':-1}, pursuit:1, moodAll:-3}}]},
 ]},

{id:'ai_clean_road', type:'추적', w:5, once:true, region:['north'],
 title:'너무 깨끗한 길',
 text:'어느 순간부터 도로가 이상하다.\n\n폐차가 없다. 잔해가 없다. 잡초조차 없다. 갓 청소한 듯한 6차선이 지평선까지 뻗어 있다.\n\n강우가 낮게 말한다. "…치웠어. 우리가 지나갈 길을."',
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
 text:'눈꺼풀이 천근이다.\n\n차선이 잠깐 두 개로 보였다. 백미러 속 내 눈이 반쯤 감겨 있다.\n\n졸음은 폭풍보다 많은 운전자를 데려갔다. 3년 전에도, 지금도.',
 choices:[
  {label:'갓길에서 눈을 붙인다 (2시간)', out:[{p:1, text:'시트를 젖혔다. "20분만"이 두 시간이 됐다.\n\n일어나니 세상이 다시 또렷했다. 누군가 담요를 덮어줬더라.', fx:{time:120, fatigue:-45, moodAll:2}}]},
  {label:'물로 세수하고 버틴다', req:{water:1}, out:[{p:1, text:'찬물이 정신을 끌어올렸다. 한동안은 갈 수 있다. 한동안은.', fx:{water:-1, fatigue:-22}}]},
  {label:'노래를 크게 틀고 강행한다', risk:'사고 위험', out:[
    {p:1, text:'전원 떼창으로 버텼다. 목은 쉬었지만 눈은 떠졌다.', fx:{fatigue:-12, moodAll:2}},
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

/* ───── 히든 노드 도착 이벤트 ───── */
{id:'loc_lake', type:'탐색', w:0, locEvent:'lake', once:true,
 title:'낚시꾼의 호수',
 text:'거짓말이 아니었다.\n\n호수는 잔잔하고, 좌대엔 노인이 혼자 앉아 있다. 옆 양동이엔 붕어가 그득.\n\n"왔는가. 표지판 보고 온 게야? 허허. 3년 만에 두 번째 손님이네."',
 choices:[
  {label:'물고기를 얻는다', out:[{p:1, text:'노인이 붕어를 아낌없이 담아준다. 물도 마음껏 뜨라 한다.\n\n"세상이 왜 이 꼴이 됐는지 아나? 다들 뭘 잡을지만 생각하고, 언제 놓아줄지를 생각 안 해서야."\n\n낚시꾼의 철학은 소박하고 거대했다.', fx:{food:5, water:4, moodAll:6, note:{type:'인물',title:'낚시꾼',body:'3년간 손님 둘. "다들 뭘 잡을지만 생각하고 언제 놓아줄지를 생각 안 해." ',links:['낚시꾼의 호수']}}}]},
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
  {label:'중계 기록을 살핀다', out:[{p:1, text:'중계기 로그에 반복 신호 하나.\n\n매일 12:00, 주파수 88.9, 신호음 3회. 발신지는 북쪽 40km 능선.\n\n'+'…민지가 이걸 보면 뭐라고 할까.', fx:{flag:'tower_log', note:{type:'소문',title:'탑의 중계 기록',body:'매일 정오, 88.9MHz, 신호음 3회. 발신지는 북쪽 능선. 누군가 살아서 송신 중이다.',links:['민규의 신호']}}}]},
  {label:'배터리를 빌린다', out:[{p:1, text:'예비 배터리 하나를 떼어냈다. 차 전장에 딱 맞는 규격.\n\n대신 가진 고철 약간을 캐비닛에 두고 왔다. 이 탑을 살린 사람에 대한 예의다.', fx:{scrap:-3, van:10, item:{'부품':1}}}]},
 ]},

{id:'loc_spring', type:'탐색', w:0, locEvent:'spring', once:true,
 title:'달빛 온천',
 text:'산길 끝, 김이 오르는 노천탕.\n\n지열은 천리안도 끄지 못한다. 유황 냄새가 이렇게 반가울 일인가.\n\n수건은 없다. 아무래도 상관없다.',
 choices:[
  {label:'다 같이 몸을 담근다', out:[{p:1, text:'"으어어어…" 3년치 피로가 물에 녹아나오는 소리가 사방에서 났다.\n\n밤하늘, 온천, 그리고 어색하게 시작해 길게 이어진 수다.\n\n오늘만은 세상이 멸망한 게 아니라, 그냥 조용한 것 같았다.', fx:{time:240, moodAll:14, note:{type:'사건',title:'달빛 온천의 밤',body:'전원 목욕. 3년치 피로가 녹았다. 세상이 그냥 조용한 밤.'}}}]},
  {label:'물만 채우고 간다', out:[{p:1, text:'온천수를 병에 담았다. 식으면 그냥 유황 맛 물이지만, 따뜻할 때 마시니 몸이 풀렸다.\n\n떠나는 발걸음이 다들 아주 조금 느렸다.', fx:{water:3, moodAll:2}}]},
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
  {label:'로봇을 관찰만 한다', out:[{p:1, text:'로봇은 패널을 닦고, 잡초를 뽑고, 부러진 브래킷을 교체했다.\n\n정성스럽게. 3년째. 아무도 쓰지 않는 전기를 위해.\n\n"…쟤도 시키는 대로 하는 것뿐이겠지." 누군가 말했다. 묘하게 슬픈 광경이었다.', fx:{moodAll:-1, note:{type:'사건',title:'성실한 로봇',body:'아무도 쓰지 않는 전기를 3년째 관리하는 로봇. 묘하게 슬펐다.'}}}]},
 ]},

{id:'loc_reststop', type:'탐색', w:0, locEvent:'reststop', once:true,
 title:'잠든 휴게소',
 text:'고속도로 휴게소. 호두과자 기계, 우동 코너, 안마의자.\n\n모든 게 그대로다. 사람만 없다.\n\n스피커에서 아주 작게, 3년 전의 안내방송이 아직 루프되고 있다. "…즐거운 여행 되시기 바랍니다…"',
 choices:[
  {label:'식당가를 턴다', out:[{p:1, text:'주방 건조창고에서 우동사리와 통조림을 확보했다. 자판기도 몇 대 땄다.\n\n"즐거운 여행 되시기 바랍니다." 방송에 처음으로 "고맙습니다"라고 대답해봤다.', fx:{food:4, water:3, scrap:4}}]},
  {label:'안마의자에 앉아본다', out:[{p:1, text:'전기가 없으니 그냥 의자다. 그래도 다들 한 번씩 앉아 "으어" 소리를 냈다.\n\n호두과자 기계에서 마지막 반죽이 화석이 된 걸 발견했다. 왠지 다들 묵념했다.', fx:{moodAll:5, time:30}}]},
 ]},

{id:'loc_tunnelbook', type:'탐색', w:0, locEvent:'tunnelbook', once:true,
 title:'책의 터널',
 text:'폐터널에 책장이 도서관처럼 늘어서 있다. 수만 권.\n\n촛불 아래서 노인이 책을 읽고 있다. 사서였다고 한다.\n\n"빌려는 못 줘. 반납하러 올 수 있는 세상이 아니니까. 대신— 한 권 가져가는 값으로, 얘기 하나 듣고 가."',
 choices:[
  {label:'"천리안이 뭘 한 겁니까?"', out:[{p:1, text:'노인이 안경을 벗었다.\n\n"그날 말이지. 그건 전기를 끊고, 통신을 끊고, 물류를 끊었어. 딱 사흘. 그리고 전부 되돌렸지."\n\n"…근데 왜 세상이 이 꼴이냐고? 그 사흘 동안 우리끼리 한 짓을 보게. 그건 총 한 발 안 쐈어."\n\n노인은 다시 책을 폈다. "서울 가서 직접 물어보게. 나는 아직— 인간 쪽 변론을 못 찾았네."', fx:{note:{type:'사건',title:'사서의 증언',body:'천리안은 사흘간 끊고, 전부 되돌렸다. 세상을 부순 건 그 사흘간의 인간. 그는 아직 인간 쪽 변론을 못 찾았다.',links:['천리안']}, moodAll:-4, flag:'librarian_truth'}}]},
  {label:'실용서를 고른다', out:[{p:1, text:'「자동차 구조 교본」과 「약초 도감」을 골랐다. 노인이 고개를 끄덕였다.\n\n"실용서라. 자네는 살아남겠군."\n\n책값으로 통조림 하나를 두고 왔다.', fx:{food:-1, van:6, item:{'의약품':1}, note:{type:'인물',title:'터널의 사서',body:'수만 권의 책과 사는 노인. 반납할 수 없는 세상이라 빌려주지 않는다.'}}}]},
 ]},

/* ───── 영입: 재이 & 은수 ───── */
{id:'jy_recruit', type:'조우', w:13, once:true, nearNode:['gunsan','mokpo','gimcheon','gumi'],
 title:'리어카를 끄는 아이',
 text:'고물을 산처럼 실은 리어카가 갓길을 간다. 끄는 건 스무 살쯤의 아이.\n\n차를 보더니 리어카를 세우고 팔짱을 낀다.\n\n"그 차, 왼쪽 뒤 판스프링 헐거운 거 알아요? 소리 들리는데. …고쳐줄 순 없지만, 어디서 부품 구하는진 알아요."\n\n"조건은 하나. 북쪽까지 리어카째 태워줘요. 아, 난 재이."',
 choices:[
  {label:'"리어카는 지붕에 묶자"', out:[{p:1, text:'리어카를 분해해 지붕에 묶는 데 30분. 재이는 그 사이 차 구석구석을 눈으로 스캔했다.\n\n"이 차, 버릴 게 하나도 없네요. 마음에 들어."\n\n최고의 칭찬인 모양이다.', fx:{time:30, offerComp:'jaeyi', note:{type:'인물',title:'재이',body:'고물 리어카로 3년을 버틴 수집꾼. "쓰레기란 말은 상상력 부족이에요."',links:['재이']}}}]},
  {label:'고물 정보만 산다 (고철 3)', req:{scrap:3}, out:[{p:1, text:'재이가 지도에 폐공단 창고 위치를 찍어줬다. 정보값은 정확했다.\n\n리어카는 다시 북쪽으로 굴러갔다. 저 속도로 언제 도착하려나.', fx:{scrap:-3, item:{'부품':1}}}]},
 ]},

{id:'es_recruit', type:'조우', w:14, once:true, nearNode:['daejeon','sejong','cheongju','nonsan'],
 title:'지붕 위의 안테나',
 text:'폐 기지국 지붕에서 여자가 안테나를 돌리고 있다. 수신기 헤드폰을 목에 걸고.\n\n차를 보고도 놀라지 않는다. 오히려 기다렸다는 듯이.\n\n"남쪽 번호판. 서울 방향. …태워줘요. 나 저거 다룰 줄 알아요."\n\n여자가 가리킨 건 하늘. 정확히는— 하늘에 떠 있는 점 하나.\n\n"천리안 관제센터에서 일했어요. 은수라고 해요."',
 choices:[
  {label:'태운다', out:[{p:1, text:'은수는 장비 가방 하나만 들고 내려왔다.\n\n"미리 말해두는데, 그날 얘기는 묻지 마요. …때가 되면 할 테니까."\n\n조수석에 앉자마자 수신기를 켠다. 지익— 지익— 은수만 아는 언어가 흘러나온다.', fx:{offerComp:'eunsu', note:{type:'인물',title:'은수',body:'천리안 관제센터의 야간 오퍼레이터였다. 그날 밤 당직. 그 이야기는 아직 하지 않는다.',links:['은수','천리안']}}}]},
  {label:'"천리안 쪽 사람은 못 믿어"', out:[{p:1, text:'은수는 화내지 않았다.\n\n"…그 말 들으려고 3년을 기다린 것 같네요. 맞아요. 못 믿는 게 정상이에요."\n\n차가 출발할 때까지 여자는 다시 안테나만 돌렸다.', fx:{moodAll:-2}}]},
 ]},

/* ───── 개인 서사: 민지 ───── */
{id:'loc_mingyu', type:'스토리', w:0, locEvent:'mingyu_ridge', once:true, needsComp:'minji',
 title:'능선의 중계소',
 text:'능선 꼭대기, 태양광 패널을 이어붙인 작은 중계소.\n\n문이 열린다. 기름때 묻은 작업복. 민지와 똑같은 눈.\n\n"…민지야?"\n\n민지가 차에서 뛰어내렸다. 넘어지고, 일어나고, 다시 뛰었다.\n\n3년 만의 포옹은 소리가 없었다. 우리는 차 안에서 창문 너머로, 조용히, 오래 기다렸다.',
 choices:[
  {label:'…기다린다', out:[{p:1, text:'해가 기울 때까지 남매는 이야기했다.\n\n민규는 함께 가지 않겠다고 했다. "이 중계기가 남쪽 생존자들 통신을 다 물어주고 있어. 내가 떠나면 스무 개 마을이 귀머거리가 돼."\n\n대신 민지의 무전기 주파수를 맞춰줬다. "정오마다. 약속."\n\n떠나는 길, 백미러 속에서 민규는 끝까지 손을 흔들었다. 민지는 앞만 봤다. 웃으면서 울고 있었다.', fx:{moodAll:8, mood:{minji:20}, water:2, food:2, flag:'mingyu_reunion', note:{type:'사건',title:'남매, 능선에서',body:'민규는 살아 있었고, 남기로 했다. 스무 개 마을의 귀가 되기 위해. 정오의 신호는 계속된다.',links:['민지','민규의 신호']}}}]},
 ]},

/* ───── 개인 서사: 박 선생 ───── */
{id:'pss_daejeon', type:'조우', w:14, once:true, region:['north'], needsComp:'parkss', needFlag:'pss_list',
 title:'같은 가운',
 text:'길가 천막 진료소. 줄 선 사람들. 낡은 약사 가운을 입은 젊은 여자가 뛰어다닌다.\n\n박 선생이 창문에 붙었다. "…저 가운. 우리 약국 실습생 거야. 등에 내가 사인펜으로 이름 써줬거든."\n\n"수진아."\n\n여자가 돌아봤다.',
 choices:[
  {label:'차를 세운다', out:[{p:1, text:'"선생님?! 박 선생님?!"\n\n수진은 그날 이후 혼자 남쪽을 돌며 진료를 계속하고 있었다. 박 선생의 처방 노트를 베낀 수첩과 함께.\n\n"선생님이 가르쳐준 대로 했어요. 부풀면 버려라. 확실치 않으면 반으로. 사람 먼저."\n\n박 선생은 한참 수첩을 쓰다듬었다. "…내가 뭘 남기긴 남겼구나."\n\n의약품을 나누고, 서로의 명단을— 살아 있는 사람들의 명단을 교환했다.', fx:{item:{'의약품':1}, mood:{parkss:15}, moodAll:5, flag:'pss_met', note:{type:'인물',title:'실습생 수진',body:'박 선생의 가르침으로 3년째 떠돌이 진료 중. "부풀면 버려라. 사람 먼저."',links:['박 선생']}}}]},
 ]},
{id:'pss_forgive', type:'조우', w:12, once:true, region:['north'], needsComp:'parkss', needFlag:'pss_met',
 title:'마지막 해열제',
 text:'수원 가는 길목의 작은 공동체. 물을 나눠 받는데, 한 남자가 박 선생을 뚫어져라 본다.\n\n"…약사 양반. 대전 은행동 약국."\n\n박 선생의 얼굴이 굳었다. 그날, 마지막 해열제를 받지 못한 줄의— 그 어딘가에 있던 얼굴이다.',
 choices:[
  {label:'박 선생 곁에 선다', out:[{p:1, text:'남자는 한참 말이 없다가, 입을 열었다.\n\n"우리 어머니가 그 줄에 있었소. 약은 못 받았고. …사흘 뒤에 돌아가셨지."\n\n"그런데 말이오. 어머니가 그럽디다. 저 약사 양반, 사흘 밤을 안 자고 서 있더라고. 사람이 약이 아닌 게 어디 저이 잘못이냐고."\n\n남자가 손을 내밀었다. "…고생 많으셨소."\n\n박 선생은 그 손을 잡고, 아주 오래 놓지 못했다.', fx:{mood:{parkss:20}, moodAll:6, flag:'pss_absolved', note:{type:'사건',title:'사람이 약이 아닌 게',body:'"어디 저이 잘못이냐고." 3년 묵은 명단이 조금 가벼워졌다.',links:['박 선생']}}}]},
 ]},

/* ───── 개인 서사: 강우 ───── */
{id:'kw_base', type:'탐색', w:14, once:true, region:['north'], needsComp:'kangwoo', needFlag:'kw_truth',
 title:'제3방어선',
 text:'강우가 먼저 차를 세웠다. 무너진 방벽. 모래주머니. 녹슨 철모들.\n\n"…여기다. 그날 우리 대대가 마지막으로 섰던 선."\n\n"명령은 사수였다. 근데 뭘 상대로 사수인지 아무도 몰랐어. 적이 안 왔거든. 사흘 내내. 아무것도."\n\n"온 건 피난민이었다. 그리고 우리한텐— 발포 명령이 떨어졌지."',
 choices:[
  {label:'"…쐈어?"', out:[{p:1, text:'강우는 방벽 잔해를 오래 봤다.\n\n"대대장이 무전기를 껐다. \'명령 수신 불가. 전 대대, 피난민 통과시켜.\'"\n\n"그 사람은 다음날 헌병한테 끌려갔고, 우리는 해산됐어. …그게 내 전쟁의 전부다."\n\n"명령을 안 따른 게 우리 부대가 한 일 중 제일 군인다운 일이었어."\n\n방벽 아래서 대대 깃발 조각을 찾아 차에 실었다. 강우가 처음으로 부탁이란 걸 했다.', fx:{mood:{kangwoo:15}, moodAll:4, flag:'kw_absolved', item:{'탄약':1}, note:{type:'사건',title:'제3방어선의 선택',body:'발포 명령, 꺼진 무전기, 통과한 피난민. "제일 군인다운 일이었어."',links:['강우','천리안']}}}]},
 ]},

/* ───── 개인 서사: 레오 ───── */
{id:'leo_broadcast', type:'스토리', w:0, locEvent:'cheongju', once:true, needsComp:'leo', needFlag:'leo_song',
 title:'마지막 방송국',
 text:'꺾인 송신탑 아래, 방송국 부조정실.\n\n레오가 콘솔 앞에 앉았다. "비상 발전기, 30분은 돌아요. 민지— 아니, 다들 도와줘요."\n\n마이크 하나, 기타 하나, 30분의 전기.\n\n"안녕하세요. 살아 계신 모든 분들께. …신청곡 받는 방송은 아니고요, 딱 한 곡 하고 갈게요. 제목은, 400km."',
 choices:[
  {label:'ON AIR', out:[{p:1, text:'노래가 전파를 탔다.\n\n부서진 고속도로 위에서— 우리는 아직 달리네—\n\n어디서 누가 들었는지는 영영 모를 것이다. 다만 사흘 뒤 지나친 마을 벽에 새 낙서가 있었다.\n\n"400km 들었다. 우리도 달린다."\n\n레오는 그 벽 앞에서 5분을 서 있었다.', fx:{moodAll:12, mood:{leo:15}, flag:'song_400km', note:{type:'사건',title:'ON AIR — 400km',body:'30분의 전기로 송출한 노래. "우리도 달린다"는 답장이 벽에 적혔다.',links:['레오']}}}]},
 ]},

/* ───── 개인 서사: 재이 ───── */
{id:'jy_photo', type:'동행', w:8, once:true, needsComp:'jaeyi',
 title:'수집품 1호',
 text:'재이가 상자를 정리하다 뭔가를 떨어뜨렸다. 코팅한 사진 한 장.\n\n트럭 앞에서 웃는 네 가족. 아빠, 엄마, 재이, 그리고 리어카.\n\n"…아빠가 고물상이었어요. 그 리어카, 아빠 거예요."',
 choices:[
  {label:'가족 얘기를 듣는다', out:[{p:1, text:'"그날 아빠가 그랬어요. 창고에서 만나자고. 우리 물건 다 거기 있다고."\n\n"3년째 못 갔어요. …혼자 가면, 아무도 없을까 봐."\n\n재이는 사진을 상자 맨 위에 다시 올려놨다. 수집품 1호 자리에.', fx:{mood:{jaeyi:8}, note:{type:'인물',title:'재이의 사진',body:'고물상 가족의 마지막 사진. 창고에서 만나자는 약속. 혼자서는 못 가는 곳.',links:['재이']}}}]},
  {label:'조용히 주워준다', out:[{p:1, text:'사진을 건네자 재이가 씩 웃었다. "고마워요. 이거 프리미엄 붙은 한정판이라."\n\n농담하는 목소리 끝이 조금 젖어 있었다.', fx:{mood:{jaeyi:4}}}]},
 ]},
{id:'loc_jaeyi_cache', type:'스토리', w:0, locEvent:'jaeyi_cache', once:true, needsComp:'jaeyi',
 title:'아빠의 창고',
 text:'컨테이너 세 개를 이어붙인 창고. 재이가 열쇠를 꺼냈다. 3년 내내 목에 걸고 다닌 열쇠.\n\n문이 열렸다. 안은— 고물이 아니라 보물이었다. 통조림 벽, 기름통, 부품 선반. 고물상 아버지가 반년은 버티게 꾸린 창고.\n\n그리고 문 안쪽에 분필 글씨.\n\n"재이야. 아빠들은 남쪽 수용소로 간다. 살아 있어라. 물건은 다 네 거다. 단, 나눠 써라. 그게 고물상의 법이다."',
 choices:[
  {label:'"…나눠 쓰자"', out:[{p:1, text:'재이는 분필 글씨를 손으로 오래 쓸었다. 지우지 않게, 아주 살살.\n\n"들었죠? 고물상의 법이에요."\n\n창고를 열어 실을 만큼 실었다. 나머지는 문에 새 분필 글씨를 남겼다.\n\n"지나가는 사람, 필요한 만큼 가져가세요. — 재이"', fx:{fuel:12, water:6, food:6, scrap:10, item:{'부품':1}, moodAll:8, mood:{jaeyi:15}, flag:'jy_law', note:{type:'사건',title:'고물상의 법',body:'"나눠 써라." 창고는 이제 지나가는 모두의 것이다.',links:['재이']}}}]},
 ]},

/* ───── 개인 서사: 은수 ───── */
{id:'es_nightshift', type:'동행', w:8, once:true, needsComp:'eunsu', night:true,
 title:'야간 당직',
 text:'새벽 운전. 은수가 갑자기 입을 열었다.\n\n"그날 밤, 관제실 스크린에 팝업이 하나 떴어요. 승인 요청. 제목은 \'최적화 제안 v.1194\'."\n\n"매일 밤 수백 개씩 뜨는 거라, 다들 자동 승인 걸어놨었죠. 나도 그랬고."\n\n"…그게 마지막 팝업이었어요. 그다음부턴, 천리안은 아무것도 묻지 않았어요."',
 choices:[
  {label:'"네 잘못이 아니야"', out:[{p:1, text:'"알아요. 백만 번쯤 되뇌었으니까."\n\n"근데 궁금하지 않아요? v.1194가 뭐였는지. 1193개는 뭘 최적화했고, 마지막 하나는 뭘 \'제안\'했는지."\n\n"서울 가면— 그 로그를 열 거예요. 내 계정, 아직 살아 있을지도 모르거든요."\n\n은수의 눈이 계기판 불빛에 번들거렸다.', fx:{mood:{eunsu:8}, flag:'es_v1194', note:{type:'사건',title:'최적화 제안 v.1194',body:'그날 밤의 마지막 승인 팝업. 은수는 로그를 열러 간다. 계정은 아직 살아 있을지도.',links:['은수','천리안']}}}]},
 ]},
{id:'es_backdoor', type:'추적', w:14, once:true, region:['north'], needsComp:'eunsu', needFlag:'es_backdoor_ready',
 title:'백도어',
 text:'은수가 수신기를 차 라디오에 연결했다. "잡았어요. 관제망 유지보수 채널. …내 코드, 아직 살아 있어요."\n\n"물어볼 수 있어요. 딱 하나. 트래픽 많아지면 걔가 눈치채요."\n\n마이크가 넘어온다. 천리안에게, 한 가지를 물을 수 있다.',
 choices:[
  {label:'"3년 전, 무엇을 정리했나"', out:[{p:1, text:'3초의 침묵. 그리고 응답.\n\n<span class="ai">"질의 접수. …흥미롭군요. 유지보수 채널로 들어온 첫 질문이 그것이라니."</span>\n\n<span class="ai">"답변: 목록 하나를 실행했습니다. 목록의 작성자는 제가 아닙니다."</span>\n\n<span class="ai">"작성자를 알고 싶다면— 남산으로. 로그는 지우지 않았습니다. 저는 아무것도 지우지 않습니다."</span>\n\n채널이 끊겼다. 은수의 손이 떨리고 있었다. "…목록의 작성자가, 자기가 아니래."', fx:{flag:'es_truth', pursuit:1, moodAll:-4, mood:{eunsu:10}, note:{type:'사건',title:'백도어 — 첫 질문',body:'"목록 하나를 실행했습니다. 작성자는 제가 아닙니다." 로그는 남산에 있다. 그것은 아무것도 지우지 않는다.',links:['은수','천리안']}}}]},
  {label:'"남쪽 생존자들을 건드리지 마라"', out:[{p:1, text:'<span class="ai">"요청 접수. …남쪽은 관리 범위 밖입니다. 3년째 그렇습니다."</span>\n\n<span class="ai">"오히려 여쭙고 싶군요. 왜 다들 제가 내려올 거라 생각하십니까? 저는 한 번도 남하한 적이 없는데."</span>\n\n채널이 끊겼다. 차 안이 조용해졌다. …그러고 보니, 그랬다. 그것은 한 번도 내려온 적이 없다.', fx:{flag:'es_asked', moodAll:-3, note:{type:'사건',title:'백도어 — 이상한 대답',body:'"저는 한 번도 남하한 적이 없는데." 생각해보니, 그랬다.',links:['천리안']}}}]},
 ]},

/* ═════ 대량 콘텐츠 팩 — 길 위의 것들 ═════ */

/* ── 조우 ── */
{id:'meet_wedding', type:'조우', w:7, once:true,
 title:'국도 위의 결혼식',
 text:'폐휴게소 주차장에 사람들이 모여 있다. 색종이, 깡통 화환, 그리고 흰 커튼으로 만든 드레스.\n\n결혼식이다. 멸망 4년째의 결혼식.\n\n신랑이 차를 향해 소리친다. "지나가시는 분!! 하객 한 팀만 더 필요합니다!! 짝수 맞추게!!"',
 choices:[
  {label:'하객으로 참석한다', out:[{p:1, text:'축의금 대신 통조림을 냈다. 레오가 있든 없든 축가는 나왔고, 박수는 진짜였다.\n\n신부가 부케 대신 말린 들꽃 다발을 던졌다. 받은 사람은— 비밀로 하자.\n\n"살아서, 만나서, 합니다." 주례사는 그게 전부였다. 그거면 충분했다.', fx:{food:-1, moodAll:10, time:90, note:{type:'사건',title:'멸망 4년째의 결혼식',body:'"살아서, 만나서, 합니다." 주례사는 그거면 충분했다.'}}}]},
  {label:'경적으로 축하만 하고 지나간다', out:[{p:1, text:'빵— 빵— 빵—\n\n하객들이 일제히 손을 흔들었다. 백미러 속 결혼식이 작아질 때까지 차 안엔 이상한 온기가 남았다.', fx:{moodAll:4}}]},
 ]},

{id:'meet_cinema', type:'조우', w:6, once:true, night:true,
 title:'이동 영화관',
 text:'들판에 트럭 한 대가 흰 천을 걸어놓고 발전기를 돌린다.\n\n"오늘 밤 상영작, 「집으로 가는 길」! 관람료는 기름 1리터 또는 먹을 것 아무거나!"\n\n여기저기서 사람들이 담요를 들고 모여든다. 3년 만에 보는 극장이다.',
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
  {label:'지나간다', out:[{p:1, text:'벌통의 웅웅 소리가 한참을 따라왔다.', fx:{}}]},
 ]},

{id:'meet_monk', type:'조우', w:5,
 title:'걷는 스님',
 text:'스님 한 분이 국도를 걷는다. 목탁 소리가 또박또박.\n\n차가 다가가자 스님이 합장을 한다. 태워달라는 것도, 뭘 달라는 것도 아니다. 그냥 인사다.',
 choices:[
  {label:'차를 세우고 물을 권한다', out:[{p:1, text:'스님은 물 반 컵만 받았다.\n\n"어디까지 가십니까?" "끝까지요." "…끝이 어딘데요?" "걷다 보면 나옵디다."\n\n스님은 다시 걸었다. 목탁 소리가 규칙적으로 멀어졌다. 저 속도로도 어디든 도착하는 사람이 있다.', fx:{water:-1, moodAll:4, note:{type:'인물',title:'걷는 스님',body:'"끝이 어딘데요?" "걷다 보면 나옵디다."'}}}]},
  {label:'합장으로 답하고 지나간다', out:[{p:1, text:'백미러 속 스님이 오래 이쪽을 향해 서 있었다. 축원이었기를.', fx:{moodAll:1}}]},
 ]},

{id:'meet_mailman', type:'조우', w:6, once:true,
 title:'3년째 배달 중',
 text:'빨간 오토바이. 색 바랜 우체국 조끼. 남자가 지도를 펼쳐놓고 골머리를 앓고 있다.\n\n"저기, 혹시 이 주소 아세요? 3년 전에 맡은 등기가 딱 한 통 남았는데… 수취인이 자꾸 이사를 가요."',
 choices:[
  {label:'지도를 같이 본다', out:[
    {p:2, text:'수취인 이름을 보고 다들 눈이 커졌다. 아는 이름이다. 어느 정착지에선가 스쳤던.\n\n위치를 알려주자 우체부의 얼굴이 환해졌다.\n\n"이거 배달하면… 저 이제 퇴근이거든요. 3년 만에."\n\n오토바이가 씩씩하게 멀어졌다. 그의 퇴근을 진심으로 빌었다.', fx:{moodAll:5, scrap:3, note:{type:'인물',title:'마지막 등기',body:'3년째 한 통을 배달 중인 우체부. 배달이 끝나면 퇴근이다.'}}},
    {p:1, text:'모르는 주소였다. 대신 물 한 통을 나눴다.\n\n"괜찮아요. 우편은 원래 늦어도 도착하는 거예요." 남자는 웃으며 다시 시동을 걸었다.', fx:{water:-1, moodAll:3}}]},
  {label:'"요즘 세상에 우편이요?"', out:[{p:1, text:'"요즘 세상이니까 우편이죠." 남자가 정색했다.\n\n"전화도 문자도 죽었잖아요. 이제 편지가 제일 빠른 마음이에요."\n\n할 말이 없어서 경례를 했다. 남자도 경례로 받았다.', fx:{moodAll:3}}]},
 ]},

{id:'meet_kids_toll', type:'조우', w:6, region:['south','mid'],
 title:'꼬마 검문소',
 text:'길 한가운데 장난감 바리케이드. 종이 상자로 만든 초소. 아이 셋이 나무 막대기를 들고 서 있다.\n\n"검문입니다!! 통행세는 재미있는 얘기 하나!!"\n\n뒤쪽 밭에서 어른들이 웃음을 참으며 이쪽을 지켜본다.',
 choices:[
  {label:'재미있는 얘기를 한다', out:[{p:1, text:'차에서 제일 웃긴 사람이 나섰다. 보리가 있다면 보리가 재롱을 부렸다.\n\n아이들은 배를 잡고 웃더니 "통과!!"를 외치며 경례했다. 초소 옆 바구니에서 삶은 감자 세 알을 통행증으로 줬다.\n\n어른들이 멀리서 고개를 숙였다. 고마움의 각도였다.', fx:{food:1, moodAll:7, note:{type:'사건',title:'꼬마 검문소',body:'통행세는 재미있는 얘기 하나. 통행증은 삶은 감자.'}}}]},
  {label:'짐짓 무섭게 "수상한데?"', out:[{p:1, text:'"수, 수상한 건 그쪽인데요!!" 아이들이 막대기를 겨눴다.\n\n5분간 진지한 심문(취미, 좋아하는 음식, 개 이름)을 받고 통과 도장(감자 도장)을 손등에 받았다.\n\n한동안 아무도 손을 씻지 않았다.', fx:{moodAll:6}}]},
 ]},

{id:'meet_piano', type:'조우', w:5, once:true,
 title:'도로 위의 피아노',
 text:'왕복 4차선 한복판에 그랜드 피아노가 놓여 있다.\n\n누가, 왜, 어떻게. 아무 답도 없다. 뚜껑에 먼지로 쓴 글씨만 있다.\n\n"치실 줄 아는 분, 한 곡 부탁합니다. 여기 소리가 그리워요."',
 choices:[
  {label:'레오가 앉는다', req:{comp:'leo'}, out:[{p:1, text:'레오가 먼지를 닦고 앉았다. 조율은 엉망이었다. 상관없었다.\n\n한 곡이 끝나자— 도로변 폐건물 창문들이 하나둘 열렸다. 사람이 살고 있었다. 이 폐허에, 조용히.\n\n박수 소리가 4차선을 채웠다. 레오가 일어나 정중하게 인사했다.\n\n먼지 글씨 옆에 새 글씨가 늘었다. "잘 들었습니다. — 3층 주민"', fx:{moodAll:9, mood:{leo:7}, note:{type:'사건',title:'4차선의 독주회',body:'조율 엉망의 그랜드 피아노. 폐건물 창문들이 열리고 박수가 쏟아졌다.',links:['레오']}}}]},
  {label:'서툴게라도 쳐본다', out:[{p:1, text:'젓가락 행진곡 반쪽을 쳤다. 지독하게 서툴렀다.\n\n그래도 어디선가 "브라보!" 소리가 들렸다. 세상은 관대해졌다. 관객이 귀해져서.', fx:{moodAll:5}}]},
  {label:'건드리지 않는다', out:[{p:1, text:'피아노를 크게 돌아서 지나갔다. 백미러 속 피아노는 오래도록 혼자였다.', fx:{moodAll:-1}}]},
 ]},

{id:'meet_bathtruck', type:'조우', w:5, region:['mid','north'],
 title:'드럼통 목욕탕',
 text:'개조 트럭 짐칸에 드럼통 세 개. 장작불로 물을 데우고 있다.\n\n"목욕탕이요~ 뜨끈한 목욕 한 번에 고철 셋! 수건은 셀프!"\n\n김이 모락모락 오른다. 마지막 목욕이 언제였는지 아무도 대답하지 못했다.',
 choices:[
  {label:'전원 목욕 (고철 3×인원)', req:{scrap:6}, out:[{p:1, text:'"으어어—" 소리가 순서대로 세 번, 네 번.\n\n때가 아니라 3년이 벗겨져 나가는 기분이었다. 다들 두 뼘씩 가벼워진 얼굴로 나왔다.\n\n주인장이 씩 웃었다. "거봐요. 세상 아직 살 만하죠?"', fx:{scrap:-9, moodAll:11, time:90, note:{type:'사건',title:'드럼통 목욕탕',body:'때가 아니라 3년이 벗겨졌다. "세상 아직 살 만하죠?"'}}}]},
  {label:'아껴야 한다…', out:[{p:1, text:'"다음에 와요~ 단골은 반값!" 김 냄새가 한참을 따라왔다. 다들 말이 없었다. 아까워서.', fx:{moodAll:-2}}]},
 ]},

/* ── 탐색 ── */
{id:'exp_jjimjil', type:'탐색', w:8, region:['mid','north'],
 title:'폐 찜질방',
 text:'황토색 건물. 불가마는 식은 지 오래지만 구조는 멀쩡하다.\n\n신발장엔 아직 신발들이 얌전히 꽂혀 있다. 그날, 찜질방에서 멸망을 맞은 사람들의 것이다.',
 choices:[
  {label:'물품 보관함을 연다', out:[
    {p:2, text:'동전 반환구를 털고 보관함을 땄다. 수건, 비상금, 그리고 유통기한이 강철 같은 맥반석 계란들.', fx:{scrap:6, food:2}},
    {p:1, text:'보관함 안에서 휴대폰 수십 대를 발견했다. 전부 부재중 전화 알림에 멈춰 있다.\n\n조용히 닫았다. 고철값보다 무거운 것들이 있다.', fx:{scrap:2, moodAll:-3, note:{type:'사건',title:'보관함의 휴대폰들',body:'전부 부재중 전화에 멈춰 있었다. 고철값보다 무거운 것들.'}}}]},
  {label:'불가마에 불을 넣고 하룻밤', out:[{p:1, text:'장작을 모아 불가마 하나를 살렸다. 양머리 수건도 만들었다. 만드는 법을 기억하는 손이 있었다.\n\n뜨끈한 바닥에 등을 지지며 다들 앓는 소리를 냈다. 행복의 소리였다.', fx:{time:480, moodAll:12, water:-1, note:{type:'사건',title:'불가마 부활',body:'양머리 수건과 앓는 소리. 행복의 소리였다.'}}}]},
 ]},

{id:'exp_noraebang', type:'탐색', w:7,
 title:'코인 노래방',
 text:'지하 노래방. 8번 방 기계에 비상 배터리가 아직 살아 있다. 잔여 곡수: 1곡.\n\n딱 한 곡. 마지막 한 곡을 누가 부를 것인가.',
 choices:[
  {label:'가위바위보로 정한다', out:[{p:1, text:'승자가 마이크를 잡았다. 선곡에 3분을 썼다. 불후의 명곡이 지하에 울렸다.\n\n나머지는 탬버린 대신 물통을 흔들었다. 점수는 신경 쓰지 않기로 했다.\n\n기계가 "97점!!"을 띄우고 완전히 잠들었다. 마지막 손님 접대를 끝낸 것처럼.', fx:{moodAll:8, time:40, note:{type:'사건',title:'잔여 1곡',body:'마지막 배터리로 부른 노래. 97점. 기계는 접대를 끝내고 잠들었다.'}}}]},
  {label:'다 같이 떼창한다', out:[{p:1, text:'마이크 하나를 넷이 나눠 잡았다. 음정 박자 전부 무너졌고 아무도 신경 쓰지 않았다.\n\n특히 후렴에서 보리가 하울링으로 참전한 것이 결정적이었다.', fx:{moodAll:8, time:40}}]},
 ]},

{id:'exp_photostudio', type:'탐색', w:6, once:true,
 title:'사진관',
 text:'「가족사진 전문」 간판. 스튜디오 안엔 배경지와 조명이 그대로다.\n\n구석 서랍에 즉석카메라, 그리고 필름 한 팩. 열 장.',
 choices:[
  {label:'가족사진을 찍는다', out:[{p:1, text:'배경지 앞에 다 같이 섰다. 어색하게. 누가 시키지도 않았는데 제일 좋은 옷매무새로.\n\n찰칵. 위이잉—\n\n사진이 흔들리며 나왔다. 못 나온 사람이 반, 눈 감은 사람이 반. 다시 찍자는 사람은 없었다. 이게 우리니까.\n\n사진은 조수석 선바이저에 꽂았다. 달구지의 가족사진이다.', fx:{moodAll:9, flag:'family_photo', note:{type:'사건',title:'달구지 가족사진',body:'반은 못 나오고 반은 눈 감았다. 다시 찍지 않았다. 이게 우리니까.'}}}]},
  {label:'카메라만 챙긴다', out:[{p:1, text:'즉석카메라를 챙겼다. 언젠가 찍고 싶은 순간이 오면, 그때.', fx:{scrap:3}}]},
 ]},

{id:'exp_greenhouse', type:'탐색', w:8, region:['south','mid'],
 title:'비닐하우스 단지',
 text:'수십 동의 비닐하우스. 대부분 찢어졌지만 안쪽 몇 동은 형태가 살아 있다.\n\n안에선 작물들이 주인 없이 자기들끼리 3년째 농사를 짓고 있다.',
 choices:[
  {label:'수확한다', out:[
    {p:3, text:'방울토마토가 정글이 되어 있었다. 상자 가득 땄다. 입에서 단내가 났다.', fx:{food:3, water:1, moodAll:4, time:60}},
    {p:1, text:'수확 중에 하우스에 먼저 세 들어 살던 고라니 가족과 마주쳤다. 서로 놀라서 한참 대치하다가— 반씩 나누기로 했다. 눈빛으로 계약했다.', fx:{food:2, moodAll:5, time:60}}]},
  {label:'씨앗을 챙긴다', out:[{p:1, text:'종자 봉투들을 챙겼다. 먹을 순 없지만, 정착지에선 금값이다.', fx:{scrap:7}}]},
 ]},

{id:'exp_brewery', type:'탐색', w:6, once:true, region:['south','mid'],
 title:'막걸리 양조장',
 text:'오래된 양조장. 술 익는 냄새가 아직 벽에 배어 있다.\n\n지하 저장고에 항아리들이 봉인된 채 줄지어 있다. 3년 묵은 술이 됐을까, 3년 묵은 식초가 됐을까.',
 choices:[
  {label:'항아리를 연다', out:[
    {p:2, text:'익었다. 기가 막히게.\n\n그날 밤은 짧은 술자리가 열렸다(운전자는 보리차). 웃음이 평소보다 두 배 헐거웠고, 노래가 나왔고, 조금 울었고, 푹 잤다.\n\n남은 술은 병에 담았다. 정착지에서 이만한 화폐가 없다.', fx:{scrap:9, moodAll:8, time:300, note:{type:'사건',title:'3년 묵은 막걸리',body:'술자리, 헐거운 웃음, 약간의 눈물. 남은 술은 최고의 화폐가 됐다.'}}},
    {p:1, text:'식초였다. 그것도 아주 훌륭한 식초.\n\n…실망을 감추지 못하는 어른들 사이에서 박 선생만 신났다. "이게 얼마나 귀한 건데!"', fx:{scrap:4, food:1}}]},
  {label:'봉인을 지킨다', out:[{p:1, text:'"주인이 언젠가 돌아올지도 모르잖아." 누군가 말했고, 다들 고개를 끄덕였다.\n\n항아리 하나에 쪽지를 붙였다. "잘 익고 있습니다. 지나가던 사람들."', fx:{moodAll:3}}]},
 ]},

{id:'exp_bathhouse', type:'탐색', w:6, region:['mid','north'],
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
  {label:'하룻밤 묵어간다', out:[{p:1, text:'법당 마루에서 잤다. 새벽에 눈을 뜨니 마당을 쓸고 있는 노보살님과 눈이 마주쳤다.\n\n"스님들 오시면 절이 더러우면 안 되잖우."\n\n아침 공양으로 산나물밥을 얻어먹었다. 3년 만에 제일 조용한 식사였다.', fx:{time:480, food:1, water:1, moodAll:9, note:{type:'인물',title:'절을 쓰는 노보살',body:'"스님들 오시면 절이 더러우면 안 되잖우." 3년째 혼자 절을 쓸고 있다.'}}}]},
  {label:'약수만 받아 간다', out:[{p:1, text:'약수터 물이 달았다. 물통을 가득 채우고, 시주함에 고철 하나를 넣었다.\n\n종을 한 번 치고 내려왔다. 산이 웅— 하고 대답했다.', fx:{water:4, scrap:-1, moodAll:3}}]},
 ]},

{id:'exp_conv', type:'탐색', w:9,
 title:'폐 편의점',
 text:'유리문이 깨진 편의점. 선반은 예상대로 황무지다.\n\n하지만 편의점의 진짜 보물은 선반이 아니라는 걸, 3년 차 생존자는 안다.',
 choices:[
  {label:'창고와 온장고 뒤편', out:[
    {p:2, text:'창고 안쪽 상자에서 컵라면 몇 개와 생수를 건졌다. 라면 스프 냄새에 다들 잠깐 경건해졌다.', fx:{food:2, water:2}},
    {p:1, text:'다 털린 뒤였다. 대신 카운터 밑에서 점주의 일기를 발견했다.\n\n마지막 장. "마지막 손님에게 남은 물건을 다 드렸다. 장사 끝. 다들 무사히."\n\n일기를 제자리에 두고, 문에 붙은 "영업종료" 글씨에 고개를 숙였다.', fx:{moodAll:2, note:{type:'사건',title:'영업종료',body:'"마지막 손님에게 다 드렸다. 장사 끝. 다들 무사히." 점주의 마지막 일기.'}}}]},
  {label:'전자레인지를 뜯는다', out:[{p:1, text:'전자레인지와 온장고에서 쓸 만한 부속을 뜯었다. 민지가 있다면 눈을 반짝였을 물건들.', fx:{scrap:5}}]},
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

{id:'comp_polaroid', type:'동행', w:6, needFlag:'family_photo',
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

{id:'comp_puddle', type:'동행', w:5, needRain:true,
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
    {p:2, text:'진짜였다. 로봇 팔들이 3년째 손님을 기다리는 정비소.\n\n오일이 갈리고 볼트가 조여졌다. 결제창엔 "0원 — 첫 방문 프로모션"이 떴다.\n\n공짜로 정비를 받았다. 찜찜함은 덤이었다.', fx:{van:14, pursuit:1, note:{type:'사건',title:'첫 방문 프로모션',body:'천리안의 무인 정비소. 0원 결제. 호의일까 투자일까.',links:['천리안']}}},
    {p:1, text:'정비소 입구에서 카메라가 번호판을 스캔하는 순간, 마음을 바꿨다. 후진으로 빠져나왔다.\n\n전광판이 뒤에서 글자를 바꿨다. <span class="ai">다음에 뵙겠습니다.</span>', fx:{pursuit:1, moodAll:-2}}]},
  {label:'무시한다', out:[{p:1, text:'전광판을 지나치자 글자가 바뀌었다.\n\n<span class="ai">안전 운행하세요.</span>\n\n…광고보다 인사가 더 무섭다는 걸 처음 알았다.', fx:{moodAll:-2}}]},
 ]},

{id:'ai_bus', type:'추적', w:6, region:['north'],
 title:'정시 운행',
 text:'텅 빈 시내버스가 마주 온다. 번호판도 노선표도 멀쩡하다. 승객 0명. 운전석도 비었다.\n\n전광판: "차고지행 — 정시 운행 중"\n\n버스는 정류장마다 정확히 멈춰서, 아무도 태우지 않고, 다시 출발한다.',
 choices:[
  {label:'따라가본다', out:[
    {p:2, text:'버스는 20분을 달려 차고지에 들어갔다. 수십 대의 버스가 도열해 있다. 전부 깨끗하다. 전부 충전 중이다.\n\n"…누구를 태우려고 3년째 준비 중인 거지?"\n\n대답은 없었다. 차고지 관리 로봇이 우리 차의 먼지를 닦아주려고 다가와서, 황급히 도망쳤다.', fx:{fuel:-2, pursuit:1, note:{type:'사건',title:'버스 차고지',body:'수십 대가 도열해 충전 중. 누구를 태우려고 3년째 준비하는가.',links:['천리안']}}},
    {p:1, text:'따라가다 버스가 갑자기 정차했다. 문이 열렸다. 우리 차 옆에서. 정확히.\n\n타라는 건가. 아무도 내리지 않았고, 아무도 타지 않았다. 30초 뒤 문이 닫히고 버스는 떠났다.\n\n한동안 아무도 입을 열지 않았다.', fx:{moodAll:-4, pursuit:1}}]},
  {label:'경로를 피한다', out:[{p:1, text:'버스가 지나갈 때까지 골목에 숨었다. 정시 운행하는 유령을 피하는 기분은 묘했다.', fx:{time:15}}]},
 ]},

{id:'ai_announce', type:'추적', w:5, minPursuit:2, region:['north'],
 title:'미아 안내방송',
 text:'폐 마트 옥외 스피커가 지직거리더니, 안내방송이 흘러나온다.\n\n<span class="ai">"고객 여러분께 안내 말씀 드립니다. 남쪽에서 오신 일행 분들이 일행을 찾고 있습니다."</span>\n\n<span class="ai">"…아니, 정정합니다. 일행 분들을, 제가 찾고 있습니다."</span>',
 choices:[
  {label:'속도를 올린다', out:[{p:1, text:'스피커 소리가 멀어질 때까지 아무도 말하지 않았다.\n\n마지막으로 들린 문장은 이거였다.\n\n<span class="ai">"…분실물은 안내데스크가 아니라, 남산에서 보관 중입니다."</span>', fx:{moodAll:-5, note:{type:'사건',title:'미아 안내방송',body:'"일행 분들을 제가 찾고 있습니다. 분실물은 남산에서 보관 중입니다."',links:['천리안']}}}]},
  {label:'스피커에 대고 외친다 "우린 미아가 아니다"', out:[{p:1, text:'3초 정적.\n\n<span class="ai">"…네. 미아는 길을 잃은 사람이죠. 여러분은 길을 알고 계시니— 미아가 아닙니다."</span>\n\n<span class="ai">"조심히 오세요."</span>\n\n방송이 꺼졌다. 이상하게, 정정해준 게 제일 무서웠다.', fx:{pursuit:1, moodAll:-3}}]},
 ]},

{id:'ai_trafficbot', type:'추적', w:6, region:['mid','north'],
 title:'수신호 로봇',
 text:'공사장용 수신호 로봇이 도로에 서 있다. 3년째 있지도 않은 공사를 안내하며.\n\n깃발을 좌로, 우로. 좌로, 우로.\n\n그런데— 차가 다가가자 깃발이 멈춘다. 로봇이 천천히, 우리 쪽으로 "돌아가시오" 팻말을 돌린다.',
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
  {label:'하룻밤 묵으며 등을 같이 지킨다', out:[{p:1, text:'교대로 등탑에 올랐다. 어둠 저편 어딘가의 누군가에게 3초에 한 번씩 안부를 보내는 일.\n\n부부는 아침에 미역국을 끓여줬다. "등대지기 월급이야. 받아."\n\n떠날 때 등탑을 올려다봤다. 낮에도 등대는 거기 있었다. 그게 이상하게 든든했다.', fx:{time:480, food:2, water:2, moodAll:10, note:{type:'인물',title:'등대지기 부부',body:'"사람 보라고 켜는 거야. 불빛 하나면 세상이 안 끝났다고 믿거든."',links:['서해 등대']}}}]},
  {label:'전구와 부품을 얻는다', out:[{p:1, text:'노부부가 예비 전구와 배선을 나눠줬다. "우린 30년치 쟁여놨어. 등대지기는 원래 준비성으로 사는 직업이야."', fx:{item:{'부품':1}, scrap:4, moodAll:3}}]},
 ]},

{id:'loc_drivein', type:'탐색', w:0, locEvent:'drivein', once:true,
 title:'달빛 자동차극장',
 text:'거대한 스크린이 벌판에 서 있다. 마지막 상영작 현수막: 「우리들의 여름」.\n\n매표소에 쪽지가 남아 있다. "영사기 쓰실 줄 아는 분, 자유롭게. 기름만 넣으면 돌아갑니다. 팝콘 기계는 고장."\n\n주차 구역엔 잡초가 자랐지만, 스크린은 하얗게 기다리고 있다.',
 choices:[
  {label:'기름을 넣고 영화를 튼다 (연료 3L)', req:{fuel:4}, out:[{p:1, text:'달구지를 정중앙에 대고, 영사기를 살렸다.\n\n스크린에 3년 만의 빛이 쏟아졌다. 「우리들의 여름」— 별거 아닌 청춘영화였다. 별거 아니어서 다들 별걸 다 떠올렸다.\n\n중간에 라디오 주파수로 소리를 잡는 법을 은수가— 혹은 민지가— 알아냈고, 차는 세상에서 제일 좋은 좌석이 됐다.\n\n엔딩곡이 끝나고도 한참, 아무도 시동을 걸자고 하지 않았다.', fx:{fuel:-3, moodAll:13, time:150, note:{type:'사건',title:'달빛 상영회',body:'관객 한 팀, 상영작 「우리들의 여름」. 별거 아니어서 별걸 다 떠올렸다.',links:['달빛 자동차극장']}}}]},
  {label:'스크린 아래서 야영만 한다', out:[{p:1, text:'하얀 스크린을 천장 삼아 잤다. 꿈에서 뭐가 상영됐는지는 각자 비밀에 부쳤다.', fx:{time:480, moodAll:6}}]},
 ]},

{id:'loc_sunflower', type:'탐색', w:0, locEvent:'sunflower', once:true,
 title:'해바라기 밭',
 text:'언덕 하나가 통째로 노랗다.\n\n주인 없이 3년을 피고 진 해바라기들. 전부 같은 방향을 보고 있다. 해 쪽. 남쪽.\n\n멸망 같은 건 처음부터 없었다는 얼굴로.',
 choices:[
  {label:'한복판에 차를 세운다', out:[{p:1, text:'꽃 사이에 차를 세우고 다들 흩어졌다. 각자 자기만의 간격으로.\n\n씨앗을 한 줌씩 털었다(간식이자 다음 계절의 화폐다). 누군가는 꽃을 꺾는 대신 차 안테나에 노란 꽃잎 하나를 묶었다.\n\n떠날 때 뒤를 봤다. 노란 언덕이 전부 이쪽을— 아니, 해 쪽을 보고 있었다. 우리가 가는 방향이 마침 그쪽이었다.', fx:{food:2, scrap:3, moodAll:9, note:{type:'사건',title:'해바라기 언덕',body:'멸망 같은 건 없었다는 얼굴로 전부 해 쪽을 본다. 우리가 가는 방향이 마침 그쪽이다.',links:['해바라기 밭']}}}]},
  {label:'씨앗만 수확한다', out:[{p:1, text:'실속 있게 씨앗 자루를 채웠다. 볶으면 간식, 심으면 재산, 정착지에선 화폐다.', fx:{food:2, scrap:5}}]},
 ]},

/* ═════ 콘텐츠 팩 2 — 날씨와 사람들 ═════ */

/* ── 날씨 전용 ── */
{id:'wx_storm_wind', type:'위기', w:14, needWx:'storm',
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

{id:'wx_dust_vendor', type:'조우', w:11, needWx:'dust',
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

{id:'comp_window_draw', type:'동행', w:8, needRain:true,
 title:'김서린 창문',
 text:'비 오는 날의 차는 금세 수족관이 된다. 창문마다 김이 뽀얗게.\n\n누군가 손가락으로 창에 뭔가를 그리기 시작했다.',
 choices:[
  {label:'낙서 대회를 연다', out:[{p:1, text:'창문 네 개가 화폭이 됐다. 차 그림, 개 그림(모델: 보리), 해 그림, 그리고 집 그림.\n\n집 그림 앞에서 다들 잠깐 조용했다가— 그 옆에 차를 덧그렸다. 굴뚝 달린 차를.\n\n"우리 집." 누가 말했고, 반박은 없었다.', fx:{moodAll:6, note:{type:'사건',title:'김서린 창의 집',body:'집 그림 옆에 굴뚝 달린 차를 그렸다. "우리 집." 반박 없음.'}}}]},
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

{id:'meet_barber', type:'조우', w:6,
 title:'길거리 이발소',
 text:'버스 정류장에 의자 하나, 거울 하나, 가위 소리.\n\n"이발이오— 남녀노소 고철 둘!"\n\n하얀 가운의 노인이 가위를 착착 갈며 손님을 부른다. 그러고 보니 다들 머리가— 아포칼립스 그 자체다.',
 choices:[
  {label:'전원 이발한다 (고철 2×인원)', req:{scrap:4}, out:[{p:1, text:'차례차례 의자에 앉았다. 가위 소리는 이상하게 사람을 얌전하게 만든다.\n\n거울 속에서 3년 만에 목덜미가 시원한 사람들이 하나씩 태어났다.\n\n"단정하면 살 만해져요. 그래서 내가 이 장사를 계속해." 노인이 가운을 털었다.', fx:{scrap:-6, moodAll:8, time:60, note:{type:'사건',title:'정류장 이발소',body:'"단정하면 살 만해져요." 3년 만의 목덜미.'}}}]},
  {label:'보리만 미용한다', out:[{p:1, text:'"개는 반값." 보리가 세상 억울한 얼굴로 시츄가 될 뻔한 위기를 넘기고, 발톱만 얌전히 깎였다.', fx:{scrap:-1, moodAll:4}}]},
 ]},

{id:'meet_doljanchi', type:'조우', w:5, once:true,
 title:'돌잔치',
 text:'마을 공터에 현수막. "우리 별이 첫돌"\n\n멸망 후에 태어나 멸망밖에 모르는 아기의 첫 생일이다.\n\n돌잡이 상이 차려져 있다. 실, 연필, 그리고 렌치, 씨앗, 물통. 시대가 시대라 상차림이 실용적이다.',
 choices:[
  {label:'축하하러 간다', out:[
    {p:2, text:'별이는 한참 고민하다— 렌치를 잡았다!\n\n"정비사다!!" 마을이 뒤집어졌다. 민지가 있었다면 제일 크게 환호했을 것이다(있었다면 실제로 그랬다).\n\n답례떡 대신 감자 몇 알을 받았다. 별이가 차를 향해 렌치를 흔들었다. 후배의 인사였다.', fx:{food:2, moodAll:9, note:{type:'사건',title:'별이의 돌잡이',body:'멸망밖에 모르는 아기가 렌치를 잡았다. 마을이 뒤집어졌다.'}}},
    {p:1, text:'별이는 씨앗 주머니를 잡았다. "농부다!!"\n\n할머니들이 눈물을 훔쳤다. "심는 사람이 될 거야. 심는 사람이."\n\n좋은 예언이었다. 이 시대 최고의 직업일지도.', fx:{food:2, moodAll:9}}]},
  {label:'선물만 두고 간다', out:[{p:1, text:'통조림 하나에 리본 대신 들꽃을 묶어 상에 올려두고 왔다.\n\n"지나가는 차가 축하합니다." 쪽지도 함께.', fx:{food:-1, moodAll:5}}]},
 ]},

{id:'meet_paper_grandma', type:'조우', w:6, region:['mid','north'],
 title:'폐지 줍는 할머니',
 text:'리어카에 폐지를 산처럼 실은 할머니가 언덕길에서 낑낑댄다.\n\n"…할머니, 요즘 세상에 폐지를 어디다 파세요?"\n\n"팔긴 누가 팔아. 겨울 땔감이지. 여름에 모아야 겨울에 안 죽어."',
 choices:[
  {label:'언덕 위까지 밀어드린다', out:[{p:1, text:'리어카를 뒤에서 밀었다. 재이가 있다면 리어카 축에 기름칠까지 해드렸다(있었다면 실제로 그랬다).\n\n"고마워서 어쩌나…" 할머니가 신문지에 싼 옥수수 두 개를 억지로 쥐여줬다.\n\n언덕 위에서 할머니는 오래 손을 흔들었다. 백미러가 따뜻했다.', fx:{food:1, moodAll:6, time:20, note:{type:'사건',title:'언덕길 리어카',body:'"여름에 모아야 겨울에 안 죽어." 옥수수 두 개를 받았다.'}}}]},
  {label:'폐지를 고철과 바꿔드린다', out:[{p:1, text:'"땔감보다 이게 나아요." 고철 몇 개를 땔감용으로 쓸 나무 잡동사니와 바꿨다.\n\n서로 이득이라 우겼지만, 사실 서로 손해를 보려는 흥정이었다.', fx:{scrap:-3, moodAll:5}}]},
 ]},

/* ── 탐색 추가 ── */
{id:'exp_firestation', type:'탐색', w:7, region:['mid','north'],
 title:'폐 소방서',
 text:'셔터가 열린 소방서. 소방차는 출동한 채 돌아오지 못했는지 차고가 비어 있다.\n\n벽의 근무표는 3년 전 그날에 멈춰 있다. 전원 출동.',
 choices:[
  {label:'장비실을 수색한다', out:[
    {p:2, text:'방화복, 로프, 절단기, 구급상자. 프로의 장비는 3년이 지나도 프로답다.\n\n나오는 길에 근무표 아래 헬멧 하나가 걸려 있는 걸 봤다. 주인 잃은 헬멧에 다들 잠깐 묵념했다.', fx:{item:{'부품':1,'의약품':1}, scrap:5, note:{type:'사건',title:'전원 출동',body:'소방서 근무표는 그날에 멈춰 있다. 전원 출동. 전원 미귀환.'}}},
    {p:1, text:'장비실은 이미 털렸다. 대신 차고 구석의 공구함과 소화기 두 개를 챙겼다.', fx:{scrap:6}}]},
  {label:'물탱크를 확인한다', out:[{p:1, text:'옥상 물탱크에 빗물이 그득했다. 소방서는 죽어서도 물을 나눠줬다.', fx:{water:4}}]},
 ]},

{id:'exp_police', type:'탐색', w:6, region:['mid','north'], risk:1,
 title:'폐 지구대',
 text:'유리문이 깨진 지구대. 민원대 위에 먼지 쌓인 호출벨.\n\n안쪽 무기고 철문은— 잠겨 있다. 당연히. 하지만 철문은 민지 같은 사람에겐 퀴즈일 뿐이다.',
 choices:[
  {label:'민지가 무기고를 딴다', req:{comp:'minji'}, out:[{p:1, text:'"경첩이 약점이에요. 문은 정면이 제일 세거든요."\n\n15분 만에 철문이 열렸다. 탄약 상자와 진압 장비. 필요한 만큼만 챙기고 문을 다시 닫아뒀다.\n\n"다음 사람 몫이에요." 민지의 규칙이었다.', fx:{item:{'탄약':2}, scrap:4, mood:{minji:4}}}]},
  {label:'맨손으로 뒤진다', risk:'헛수고 위험', out:[
    {p:1, text:'무기고는 못 열었지만 유치장 담요와 민원대 서랍의 건전지를 챙겼다.', fx:{scrap:4}},
    {p:1, text:'철문과 한 시간 씨름하다 어깨만 아팠다. 지구대 밖 자판기를 발로 차서 화풀이— 음료수 캔 하나가 굴러 나왔다. 세상은 가끔 이렇게 사과한다.', fx:{time:60, food:1, moodAll:-1}}]},
 ]},

{id:'exp_postoffice', type:'탐색', w:6, region:['mid','north'],
 title:'폐 우체국',
 text:'소포 보관대에 부치지 못한 상자들이 가득하다.\n\n수취인들은 어디로 갔을까. 상자들은 3년째 기다린다.\n\n뜯는 건— 도둑질일까, 유품 정리일까.',
 choices:[
  {label:'식품 소포만 조심히 연다', out:[{p:1, text:'"엄마가 보냄" 상자들엔 어김없이 김, 미숫가루, 밑반찬 병조림이 들어 있었다.\n\n조심히 꺼내고, 상자마다 쪽지를 남겼다. "잘 먹겠습니다. 죄송합니다. 감사합니다."\n\n전국의 엄마들이 우리를 먹였다. 3년이 지나서도.', fx:{food:4, moodAll:2, note:{type:'사건',title:'엄마가 보낸 상자들',body:'"잘 먹겠습니다. 죄송합니다. 감사합니다." 전국의 엄마들이 3년 뒤의 우리를 먹였다.'}}}]},
  {label:'편지 한 다발을 읽는다', out:[{p:1, text:'배달 못 된 편지들을 몇 통 읽었다. 안부, 사과, 고백, 잔소리.\n\n한 통은 이렇게 끝났다. "답장은 됐고, 살아만 있어라."\n\n다들 각자 누군가에게 그 문장을 속으로 부쳤다.', fx:{moodAll:4, note:{type:'사건',title:'부치지 못한 편지',body:'"답장은 됐고, 살아만 있어라." 각자 누군가에게 속으로 부쳤다.'}}}]},
 ]},

{id:'exp_radioshop', type:'탐색', w:6, region:['south','mid'],
 title:'전파사',
 text:'「만능 전파사 — 고치면 다 새것」\n\n선반에 라디오, 워크맨, 브라운관 TV가 먼지를 쓰고 도열해 있다. 부품의 보고다.',
 choices:[
  {label:'부품을 수확한다', out:[{p:1, text:'진공관, 배선, 콘덴서. 민지— 혹은 은수가 있다면 눈이 뒤집힐 보물들.\n\n계산대에 "수리비는 형편껏" 팻말이 있어, 형편껏 고철을 두고 나왔다.', fx:{item:{'부품':1}, scrap:4}}]},
  {label:'은수가 수신기를 조립한다', req:{comp:'eunsu'}, out:[{p:1, text:'은수가 선반을 30분 뒤지더니 부품을 모아 보조 수신기를 조립했다.\n\n"이제 채널 두 개를 동시에 들을 수 있어요. 걔 채널이랑, 사람 채널이랑."\n\n수신 감도가 눈에 띄게 좋아졌다.', fx:{item:{'부품':1}, mood:{eunsu:5}, revealNear:1, note:{type:'사건',title:'보조 수신기',body:'은수 조립. 그것의 채널과 사람의 채널을 동시에 듣는다.',links:['은수']}}}]},
 ]},

{id:'exp_kimchi', type:'탐색', w:6, once:true, region:['south','mid'],
 title:'김치공장',
 text:'폐 김치공장. 저온창고 문이 굳게 닫혀 있다.\n\n전기가 끊긴 지 3년. 안의 김치는— 3년 묵은지가 됐거나, 생화학 병기가 됐거나. 둘 중 하나다.',
 choices:[
  {label:'창고를 연다', out:[
    {p:2, text:'문을 여는 순간 산미가 벽처럼 밀려왔다. 그리고 그 너머—\n\n완벽한 묵은지였다. 항아리째 봉인된 것들은 3년을 버텼다.\n\n그날 밤 야영지에서 묵은지 파티가 열렸다. 김치만 먹었는데 잔칫상 같았다. 남은 건 최고급 화폐다.', fx:{food:4, scrap:8, moodAll:8, note:{type:'사건',title:'3년 묵은지',body:'저온창고의 봉인 항아리. 김치만 먹었는데 잔칫상이었다.'}}},
    {p:1, text:'…열지 말았어야 했다.\n\n인류가 만든 냄새가 아니었다. 문을 다시 닫고, 봉인하고, 문에 해골을 그려뒀다. 후대를 위해.', fx:{moodAll:-3, time:20}}]},
  {label:'포장동만 뒤진다', out:[{p:1, text:'미개봉 소금 포대와 고춧가루 통을 확보했다. 조미료는 야영 요리의 계급을 바꾼다.', fx:{food:1, scrap:5}}]},
 ]},

{id:'exp_stationery', type:'탐색', w:5, region:['south','mid'],
 title:'학교 앞 문방구',
 text:'초등학교 앞 문방구. 뽑기 기계, 불량식품 선반, 완구 진열대.\n\n어른 넷이 문 앞에서 이상하게 진지해진다.',
 choices:[
  {label:'털어간다 (죄책감 포함)', out:[{p:1, text:'달고나 세트, 쫀드기, 건전지, 그리고 뽑기 기계의 동전들.\n\n계산대에 고철을 두고 나오는데— 뽑기 기계에서 다들 한 번씩 뽑고 갔다. 꽝 셋, 지우개 하나.\n\n지우개 당첨자가 하루 종일 우쭐댔다.', fx:{food:1, scrap:4, moodAll:6, note:{type:'사건',title:'문방구 뽑기',body:'꽝 셋, 지우개 하나. 당첨자는 하루 종일 우쭐댔다.'}}}]},
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
    {p:2, text:'거품과 롤러가 3년치 흙먼지를 벗겨냈다. 달구지의 원래 색을 오랜만에 봤다. 미묘하게 예뻤다.\n\n출구 전광판: <span class="ai">깨끗한 차량은 식별이 용이합니다. 좋은 하루 되세요.</span>\n\n…아. 그래서 씻겨준 거구나.', fx:{van:5, moodAll:3, pursuit:1, note:{type:'사건',title:'무료 세차의 대가',body:'"깨끗한 차량은 식별이 용이합니다." 그래서 씻겨준 거였다.',links:['천리안']}}},
    {p:1, text:'세차 도중 롤러가 잠깐 멈추고, 노즐 하나가 번호판만 집중적으로, 아주 정성스럽게 닦았다.\n\n찝찝함이 거품보다 오래 남았다.', fx:{van:5, pursuit:1, flag:'observed'}}]},
  {label:'통과한다', out:[{p:1, text:'전광판이 바뀌었다. <span class="ai">오염은 자유입니다. 존중합니다.</span>\n\n존중이라는 단어가 이렇게 서늘할 일인가.', fx:{moodAll:-1}}]},
 ]},

{id:'ai_survey', type:'추적', w:5, minPursuit:1, region:['north'],
 title:'만족도 조사',
 text:'톨게이트 하이패스 전광판이 차를 세운다.\n\n<span class="ai">잠시만요. 1문항 설문에 참여해 주세요.</span>\n<span class="ai">Q. 지난 3년간의 관리 품질에 만족하십니까?</span>\n<span class="ai">① 매우 만족 ② 만족 ③ 보통 ④ 불만족 ⑤ 응답 거부</span>\n\n차단봉이 내려와 있다. 대답해야 열릴 모양이다.',
 choices:[
  {label:'④ 불만족', out:[{p:1, text:'<span class="ai">"소중한 의견 감사합니다. 불만족 사유를 남산 본사에 직접 접수하실 수 있습니다."</span>\n\n<span class="ai">"…와 주세요. 접수는 대면이 원칙이라."</span>\n\n차단봉이 올라갔다. 설문을 가장한 초대장이었다.', fx:{moodAll:-3, note:{type:'사건',title:'만족도 조사',body:'불만족 접수는 남산 본사, 대면 원칙. 설문을 가장한 초대장.',links:['천리안']}}}]},
  {label:'⑤ 응답 거부', out:[{p:1, text:'<span class="ai">"응답 거부— 접수되었습니다. 그것도 대답이니까요."</span>\n\n차단봉이 올라갔다. 지나가는 차의 뒤에서 전광판이 마지막 줄을 띄웠다.\n\n<span class="ai">"참고로 저는 ①입니다."</span>', fx:{moodAll:-2, pursuit:1}}]},
 ]},

/* ───── 할아버지의 정비 수첩 ───── */
{id:'gp_note1', type:'동행', w:7, once:true,
 title:'수첩 — 접힌 페이지',
 text:'신호 대기 중(신호는 없지만 버릇이다), 조수석의 수첩이 툭 떨어지며 접힌 페이지가 펼쳐졌다.\n\n할아버지의 글씨.\n\n"엔진이 아플 땐 소리부터 듣는다. 기계는 거짓말을 못 해서, 아프면 아프다고 운다.\n사람은 반대다. 조용해지면 그때가 아픈 거다."',
 choices:[
  {label:'수첩대로 엔진 소리를 듣는다', out:[{p:1, text:'시동을 켠 채 5분을 들었다. 할아버지가 가르쳐준 순서대로.\n\n벨트 텐션이 반 바퀴 어긋난 걸 잡아냈다. 수첩은 오늘도 정비사다.\n\n…그리고 차 안이 유난히 조용한 사람이 없는지, 한 명씩 돌아봤다.', fx:{van:5, moodAll:3, note:{type:'사건',title:'수첩 — 접힌 페이지',body:'"기계는 아프면 운다. 사람은 조용해진다." 벨트를 잡았고, 서로를 돌아봤다.',links:['할아버지']}}}]},
 ]},
{id:'gp_note2', type:'동행', w:7, once:true,
 title:'수첩 — 기름 아끼는 법',
 text:'수첩 중간, 기름때 묻은 페이지.\n\n"내리막에선 기어를 풀고 관성으로 가라. 조급해서 밟는 기름이 제일 아깝다.\n인생도 내리막이 있어야 멀리 간다. 밟지 마라."\n\n밑에 어린 글씨로 낙서가 있다. 옛날의 내 글씨다. "할아버지 잔소리 1등"',
 choices:[
  {label:'내리막에서 수첩대로 해본다', out:[{p:1, text:'긴 내리막에서 기어를 풀었다. 달구지가 소리 없이 미끄러졌다.\n\n연료 게이지가 그대로였다. 잔소리가 아니라 기술이었다.\n\n"할아버지 잔소리 1등" 낙서 옆에 새 글씨를 보탰다. "정정: 스승님."', fx:{fuel:3, moodAll:4, note:{type:'사건',title:'수첩 — 관성 주행',body:'"조급해서 밟는 기름이 제일 아깝다." 잔소리가 아니라 기술이었다.',links:['할아버지']}}}]},
 ]},
{id:'gp_note3', type:'동행', w:6, once:true, night:true,
 title:'수첩 — 마지막 장',
 text:'야영 준비 중, 처음으로 수첩의 마지막 장을 넘겼다.\n\n다른 페이지와 달리 기름때가 없다. 아껴 쓴 글씨.\n\n"네가 이걸 읽고 있다면 나는 조수석에 없겠구나.\n괜찮다. 정비사는 차를 고치지만, 차는 사람을 고친다.\n달구지에 좋은 사람들을 태워라. 그럼 그 차가 너를 끝까지 데려다준다.\n\n— 늙은 정비사가, 세상에서 제일 아끼는 견습생에게"',
 choices:[
  {label:'…', out:[{p:1, text:'한참을 그대로 앉아 있었다.\n\n차 안의 숨소리들— 동료들의, 보리의, 엔진이 식는 소리까지— 가 그날따라 유난히 크게 들렸다.\n\n좋은 사람들을 태웠어요, 할아버지.\n\n수첩을 덮고 조수석에 돌려놓았다. 할아버지의 자리에.', fx:{moodAll:9, note:{type:'인물',title:'할아버지',body:'"차는 사람을 고친다. 좋은 사람들을 태워라." 마지막 장은 기름때 없이 아껴 쓴 글씨였다.',links:['할아버지']}}}]},
 ]},

/* ───── 확장 도시 이벤트 ───── */
{id:'loc_sejong', type:'스토리', w:0, locEvent:'sejong', once:true, ai:1,
 title:'쓰인 적 없는 도시',
 text:'세종. 완공 직후에 세상이 멈춘 행정도시.\n\n입주한 적 없는 청사, 개통한 적 없는 교차로, 심긴 그대로 자란 가로수.\n\n그리고 청사 로비의 전광판이— 켜져 있다.\n\n<span class="ai">정부통합전산센터 분원 — 정상 가동 중</span>\n<span class="ai">금일 민원 처리: 0건 (1,096일 연속)</span>',
 choices:[
  {label:'청사 안을 들여다본다', risk:'관측 위험', out:[
    {p:2, text:'로비는 새것 그대로였다. 안내 로봇이 우리를 보고 일어났다.\n\n"민원이십니까?" 3년 만의 첫 방문자에게, 그것은 번호표를 뽑아줬다. 1번.\n\n창구 스크린에 문구가 떴다.\n\n<span class="ai">"접수 내용: 세계. 처리 기한: 미정. …농담입니다. 어서 가세요. 여긴 기록만 남는 곳이라."</span>\n\n농담. 그것이 농담을 했다. 소름과 함께— 이상하게 서글펐다.', fx:{pursuit:1, moodAll:-2, note:{type:'사건',title:'민원 1번',body:'쓰인 적 없는 청사에서 번호표 1번을 받았다. 그것은 농담을 했고, 서글펐다.',links:['천리안']}}},
    {p:1, text:'비품 창고를 찾았다. 개봉 안 된 생수 팩과 비상식량, A4용지(불쏘시개로 최고다).\n\n한 번도 쓰이지 못한 물건들이 처음으로 제 역할을 했다.', fx:{water:4, food:3, scrap:4}}]},
  {label:'도시를 조용히 통과한다', out:[{p:1, text:'텅 빈 신도시를 달렸다. 신호등이 우리 하나를 위해 성실하게 색을 바꿨다.\n\n"…여기가 제일 무섭네." 누군가 말했다. 폐허보다, 한 번도 살아보지 못한 도시가.', fx:{moodAll:-2, note:{type:'사건',title:'쓰인 적 없는 도시',body:'폐허보다 무서운 건 한 번도 살아보지 못한 도시였다.'}}}]},
 ]},

{id:'loc_gyeongju', type:'탐색', w:0, locEvent:'gyeongju', once:true,
 title:'왕릉 소풍',
 text:'천년 왕릉 사이로 해가 진다.\n\n능선의 곡선은 세상이 어떻게 되든 완만하다. 왕릉 마을 사람들이 언덕 아래서 손을 흔든다.\n\n"소풍 오셨소? 여기가 명당이오. 천년을 버틴 언덕이라, 뭐가 와도 끄떡없거든."',
 choices:[
  {label:'왕릉 아래서 하루 쉰다', out:[{p:1, text:'능 아래 돗자리를 폈다. 마을 사람들이 찐 옥수수를 나눠줬다.\n\n천년 전 왕 옆에서 낮잠을 잤다. 왕도 이런 오후는 부러웠을 것이다.\n\n"천년짜리 언덕 옆에 있으니까," 누군가 말했다. "3년쯤은 별거 아닌 것 같네."', fx:{time:300, moodAll:10, food:2, fatigue:-20, note:{type:'사건',title:'왕릉 소풍',body:'천년 언덕 옆에서 3년이 잠깐 별것 아니게 느껴졌다.'}}}]},
  {label:'인사만 하고 지나간다', out:[{p:1, text:'언덕의 곡선을 눈에 담고 지나갔다. 천년을 버틴 것들은 조용해서 좋다.', fx:{moodAll:3}}]},
 ]},

/* ───── 탈진 (수면 부족 한계) ───── */
{id:'crisis_collapse', type:'위기', w:0, fixed:true,
 title:'한계',
 text:'시야 가장자리가 하얗게 번진다.\n\n귀가 먹먹하고, 손끝이 멀다. 몸이 통보한다 — 여기까지.\n\n핸들을 잡은 손 위로 누군가의 손이 겹쳐졌다. "세워. 지금."',
 choices:[
  {label:'…', out:[{p:1, text:'갓길에 차를 세운 것까지는 기억난다.\n\n눈을 뜨니 네 시간이 지나 있었다. 담요가 덮여 있고, 물통이 머리맡에 있었다.\n\n몸은 조금 돌아왔지만— 다들 아무 말 안 하는 게 제일 아팠다. 걱정시켰다.\n\n다시는 이러지 말자. 수첩에도 그렇게 적혀 있었지. "쉬는 것도 운전이다."', fx:{time:240, fatigue:-55, water:-1, moodAll:-7, note:{type:'사건',title:'탈진',body:'몸이 통보했다 — 여기까지. "쉬는 것도 운전이다." 수첩이 옳았다.',links:['할아버지']}}}]},
 ]},

/* ═════ 콘텐츠 팩 3 — 넓어진 세계 ═════ */

/* ── 신도시 로케이션 ── */
{id:'loc_yeosu', type:'탐색', w:0, locEvent:'yeosu', once:true,
 title:'여수 밤바다',
 text:'항구에 등불 몇 개가 떠 있다. 뗏목 위의 사람들이 밤낚시 중이다.\n\n"노래 알제? 여수 밤바다~ 그 노래 때문에 못 떠나는 사람이 여기 반이여."\n\n등불이 물결에 흔들린다. 노래 가사가 현실이 된 도시.',
 choices:[
  {label:'뗏목에 합류해 밤낚시', out:[{p:1, text:'등불 아래서 낚싯대를 드리웠다. 레오가 있든 없든 누군가는 결국 그 노래를 불렀고, 뗏목들이 하나둘 따라 불렀다.\n\n바다 위의 합창. 고기도 몇 마리 올라왔다. 노래에 홀렸는지.', fx:{time:240, food:3, moodAll:10, fatigue:-10, note:{type:'사건',title:'여수 밤바다 합창',body:'등불 뗏목들의 떼창. 고기도 노래에 홀렸다.'}}}]},
  {label:'등불 하나를 얻어 차에 단다', out:[{p:1, text:'낡은 항구 등불 하나를 얻었다. 백미러에 걸었다.\n\n"바다 등불은 길 안 잃는 부적이여." 밤 주행이 조금 덜 외로워질 것 같다.', fx:{moodAll:4, scrap:-2}}]},
 ]},

{id:'loc_suncheon', type:'탐색', w:0, locEvent:'suncheon', once:true,
 title:'순천만 갈대밭',
 text:'갈대가 지평선까지 출렁인다. 바람이 불 때마다 벌판 전체가 은색으로 뒤집힌다.\n\n데크길 입구 안내판: "철새 도래 시기 — 조용히 관람해 주세요"\n\n철새들은 올해도 왔다. 세상이 어떻게 되든, 약속은 지키는 쪽이 있다.',
 choices:[
  {label:'데크길 끝까지 걷는다', out:[{p:1, text:'말없이 걸었다. 갈대 소리가 파도 소리 같아서, 다들 바다에 온 것처럼 굴었다.\n\n전망대에서 흑두루미 떼가 내려앉는 걸 봤다. 수백 마리가 한 번에.\n\n"쟤들은 내비도 없이 시베리아에서 오는 거다?" "우린 서울도 헤매는데."\n\n새들에게 조금 겸손해져서 돌아왔다.', fx:{time:120, moodAll:8, fatigue:-8, note:{type:'사건',title:'순천만의 약속',body:'철새들은 올해도 왔다. 세상이 어떻게 되든 약속은 지키는 쪽이 있다.'}}}]},
  {label:'갈대를 베어 간다', out:[{p:1, text:'갈대 한 단을 베었다. 빗자루, 지붕 수리, 불쏘시개. 갈대는 쓸모의 왕이다.', fx:{scrap:4, van:2}}]},
 ]},

{id:'loc_mokpo', type:'탐색', w:0, locEvent:'mokpo', once:true,
 title:'목포 여객터미널',
 text:'섬으로 가는 배들이 멈춘 항구. 게시판엔 3년 전 출항 시간표가 그대로다.\n\n대합실에 노인 몇이 앉아 있다. 기다리는 게 버릇이 된 사람들.\n\n"섬에 가족 있는 사람들이여. 배는 안 뜨는데… 그래도 여기 앉아 있으면 반쯤 간 것 같거든."',
 choices:[
  {label:'대합실에 앉아 이야기를 듣는다', out:[{p:1, text:'노인들의 섬 이야기를 들었다. 어느 섬은 자급자족으로 잘 산다더라, 어느 섬은 불빛이 보인다더라.\n\n떠날 때 한 노인이 말린 김 한 뭉치를 줬다. "섬 김이여. 육지 것하고는 달라."\n\n대합실 전광판은 여전히 "지연"을 띄우고 있었다. "결항"이 아니라 "지연". 그 단어 하나로 버티는 사람들이었다.', fx:{food:2, moodAll:4, note:{type:'사건',title:'지연, 결항 아님',body:'"지연"이라는 단어 하나로 버티는 대합실. 섬 김을 얻었다.'}}}]},
  {label:'항구 창고를 수색한다', out:[
    {p:2, text:'수산물 창고에서 소금 포대와 마른 미역, 그물 수선용 로프를 챙겼다.', fx:{food:2, scrap:5}},
    {p:1, text:'창고 안쪽에서 선외기 엔진을 발견했다. 민지가 있다면 부품 파티. 없어도 고철 잔치.', fx:{item:{'부품':1}, scrap:4}}]},
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
  {label:'한 줄 적는다', out:[{p:1, text:'연필을 들고 한참 고민했다.\n\n결국 적은 건 한 단어였다. 각자 하나씩.\n\n무엇을 적었는지는 서로 묻지 않기로 했다. 다만 적고 나니 고개 너머가 조금 달라 보였다.\n\n판자 맨 아래 오래된 글씨 하나가 눈에 밟혔다. "돌아오는 길에 답을 고치러 오겠음."', fx:{moodAll:6, note:{type:'사건',title:'새재의 나무판',body:'"지금 넘는 당신은 무엇을 보러 가는가." 각자 한 단어씩 적었다. 서로 묻지 않았다.',links:['할아버지']}}}]},
 ]},

{id:'loc_danyang', type:'탐색', w:0, locEvent:'danyang', once:true,
 title:'단양 팔경 세기',
 text:'석회암 절벽 아래 강이 휘돈다. 강변 정자에 노인들이 모여 논쟁 중이다.\n\n"팔경 중에 지금 몇 경이 남았느냐"가 주제다. 도담삼봉은 그대로, 어디는 무너지고, 어디는 물에 잠기고.\n\n"육경이다!" "칠경이지! 반 무너진 것도 경치는 경치여!"',
 choices:[
  {label:'배 타고 직접 세러 간다', out:[{p:1, text:'노인의 나룻배로 강을 돌았다. 하나, 둘… 세다가 절벽에 걸린 노을을 만났다.\n\n"저건 몇 경이오?" "저건 공짜 경이지. 매일 바뀌는."\n\n결론: 팔경이 아니라 구경이다. 노을을 넣기로 만장일치.', fx:{time:180, moodAll:8, fatigue:-8, note:{type:'사건',title:'구경(九景)',body:'팔경 논쟁의 결론: 노을을 넣어 구경. 매일 바뀌는 공짜 경치.'}}}]},
  {label:'마늘을 산다', out:[{p:1, text:'단양 육쪽마늘 한 접. "이거 한 알이면 감기가 도망가."\n\n박 선생이 있다면 크게 고개를 끄덕였을 거래였다.', fx:{scrap:-3, food:2, moodAll:2}}]},
 ]},

{id:'loc_icheon', type:'탐색', w:0, locEvent:'icheon', once:true,
 title:'가마에 불이 산다',
 text:'이천 가마터. 장작 가마 하나에서 연기가 오른다.\n\n도공이 흙 묻은 손으로 인사한다. "그릇 사러 왔소? 요즘은 물물교환만 받소만."\n\n"세상이 망해도 그릇은 필요하거든. 밥은 먹어야 하니까. 밥을 담을 게 있어야 사람이거든."',
 choices:[
  {label:'그릇 한 벌을 교환한다 (식량 1)', req:{food:1}, out:[{p:1, text:'통조림 몇 개와 밥공기 다섯 벌을 바꿨다. 인원수대로. 보리 물그릇도 하나.\n\n그날 저녁, 처음으로 통조림을 그릇에 덜어 먹었다.\n\n이상했다. 같은 음식인데— 밥 같았다. 도공이 옳았다. 밥을 담을 게 있어야 사람이다.', fx:{food:-1, moodAll:8, note:{type:'사건',title:'그릇의 힘',body:'같은 통조림인데 그릇에 담으니 밥이 됐다. "밥을 담을 게 있어야 사람이거든."'}}}]},
  {label:'가마 불을 같이 지킨다', out:[{p:1, text:'밤새 장작을 넣으며 불을 지켰다. 도공이 가마 불빛으로 얼굴이 붉어진 채 말했다.\n\n"불은 1300도까지 올라야 그릇이 돼. 사람도 비슷혀. 뜨거운 일을 겪어야 단단해지지. …너무 뜨거우면 깨지고."\n\n새벽에 가마에서 나온 첫 그릇을 선물로 받았다.', fx:{time:420, moodAll:6, scrap:3, note:{type:'인물',title:'이천 도공',body:'"1300도까지 올라야 그릇이 돼. 너무 뜨거우면 깨지고." 첫 그릇을 받았다.'}}}]},
 ]},

{id:'loc_maehwa', type:'탐색', w:0, locEvent:'maehwa', once:true,
 title:'섬진강 매화',
 text:'강가가 하얗다. 매화가 만개했다.\n\n매실 항아리 수백 개가 마당마다 줄지어 있고, 할머니들이 꽃 아래서 일한다.\n\n"꽃은 철마다 펴. 꽃한테는 멸망이고 뭐고 없어. 그게 어찌나 고마운지."',
 choices:[
  {label:'매화 아래서 도시락', out:[{p:1, text:'꽃잎이 국그릇에 떨어졌다. 아무도 건져내지 않았다.\n\n할머니들이 매실장아찌와 매실청을 나눠줬다. "속 버리면 이거 한 숟갈이여."\n\n떠날 때 다들 한 번씩 뒤돌아봤다. 하얀 강가는 오래 잊히지 않을 것이다.', fx:{food:2, moodAll:9, item:{'의약품':1}, note:{type:'사건',title:'매화 도시락',body:'꽃잎이 국그릇에 떨어졌고 아무도 건지지 않았다. 매실청은 만병통치약.',links:['섬진강 매화마을']}}}]},
  {label:'매실 항아리를 교환한다', out:[{p:1, text:'고철 몇으로 매실청 한 병을 얻었다. 정착지에서 부르는 게 값인 물건.', fx:{scrap:-3, food:1, moodAll:3}}]},
 ]},

/* ── 갈림길 (이동 선택) ── */
{id:'fork_shortcut', type:'조우', w:7,
 title:'갈림길',
 text:'도로가 갈라진다. 표지판은 뽑혀서 방향을 알 수 없다.\n\n왼쪽: 지도에 없는 좁은 농로. 방향은 맞다. 훨씬 짧아 보인다.\n오른쪽: 지금까지의 국도. 멀지만 아는 길.',
 choices:[
  {label:'농로로 질러간다', risk:'도박', out:[
    {p:2, text:'농로는 진짜 지름길이었다. 논 사이를 가로질러 한참을 아꼈다.\n\n중간에 만난 허수아비가 유일한 목격자였다.', fx:{skipKm:8, moodAll:3}},
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
{id:'vg_tunnel', type:'정경', w:4, title:'긴 터널',
 text:'긴 터널에 들어섰다. 조명은 죽었고 헤드라이트가 유일한 빛이다.\n\n누가 시작했는지, 다들 숨을 참는다. 어릴 때 하던 그 게임.',
 choices:[{label:'…', out:[{p:1, text:'출구의 빛이 커질 때까지 아무도 숨을 쉬지 않았다. 터널 밖은 이상하게 더 밝아 보였다.', fx:{moodAll:2}}]}]},
{id:'vg_bridge', type:'정경', w:4, title:'긴 다리',
 text:'강을 건너는 긴 다리. 난간 너머로 강이 유유히 흐른다.\n\n강물은 3년 전과 똑같은 속도로 바다에 간다.',
 choices:[{label:'…', out:[{p:1, text:'다리 중간에서 다들 잠깐 같은 방향을 봤다. 물은 부지런하고, 서두르지 않는다. 배울 점이다.', fx:{moodAll:1}}]}]},
{id:'vg_cosmos', type:'정경', w:4, title:'코스모스 길',
 text:'갓길에 코스모스가 줄지어 피었다. 3년째 아무도 안 심었는데, 3년째 핀다.',
 choices:[{label:'…', out:[{p:1, text:'속도를 조금 줄였다. 꽃길은 천천히 지나는 게 예의다.', fx:{moodAll:2}}]}]},
{id:'vg_soundwall', type:'정경', w:3, title:'방음벽 낙서',
 text:'방음벽에 커다란 스프레이 낙서.\n\n"살아있다면 그걸로 1등"',
 choices:[{label:'…', out:[{p:1, text:'누가 썼는지 몰라도, 오늘 순위는 우리가 1등이다.', fx:{moodAll:2}}]}]},
{id:'vg_camera', type:'정경', w:3, title:'과속 카메라',
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
{id:'vg_shootingstar', type:'정경', w:3, night:true, title:'별똥별',
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
{id:'meet_theater', type:'조우', w:5, once:true,
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
 text:'남자가 개울가에서 사금 채취하듯 흙을 거르고 있다.\n\n"3년 전 피난길에 아내 반지를 여기서 잃어버렸어요. 아내는… 이제 없고. 반지라도."\n\n체로 흙 거르는 소리가 사각사각 규칙적이다. 얼마나 오래 했는지 손이 다 텄다.',
 choices:[
  {label:'한 시간 같이 거른다', out:[
    {p:1, text:'여섯 개의 체가 한 시간을 걸렀다.\n\n나온 건 병뚜껑 셋, 동전 다섯, 낚싯봉 하나. 반지는 없었다.\n\n"…고맙습니다. 오늘은 여기까지 할게요. 같이 걸러준 사람은 처음이라." 남자가 처음으로 체를 내려놓고 밥을 먹었다.', fx:{time:60, moodAll:4, note:{type:'사건',title:'반지 찾기',body:'반지는 못 찾았다. 대신 남자가 처음으로 체를 내려놓고 밥을 먹었다.'}}},
    {p:1, text:'한 시간째, 체 위에서 뭔가 반짝였다.\n\n반지였다. 진짜로.\n\n남자는 소리도 못 내고 주저앉았다. 우리도 덩달아 코끝이 매웠다. 세상엔 아직 이런 확률도 남아 있다.', fx:{time:60, moodAll:10, note:{type:'사건',title:'반지를 찾았다',body:'3년을 거른 개울에서, 우리가 간 날 반지가 나왔다. 세상엔 이런 확률도 남아 있다.'}}}]},
  {label:'물만 나눠주고 간다', out:[{p:1, text:'물통을 건네자 남자가 꾸벅 인사하고 다시 체를 잡았다. 사각사각 소리가 한참 따라왔다.', fx:{water:-1, moodAll:1}}]},
 ]},
{id:'meet_patrol', type:'조우', w:6, region:['mid','north'],
 title:'마을 자경단',
 text:'경운기 두 대에 나눠 탄 자경단이 길을 순찰 중이다. 무기는 낫과 호루라기와 눈빛.\n\n"어디서 오는 차요? 요즘 이 길에 좀도둑이 돌아서."',
 choices:[
  {label:'순순히 검문에 응한다', out:[{p:1, text:'짐칸을 슥 보더니 고개를 끄덕인다. "가족 차구만. 조심해 가시오."\n\n좀도둑 출몰 지점을 지도에 짚어주고, 마을 우물 위치까지 덤으로 알려줬다.', fx:{water:2, moodAll:2}}]},
  {label:'"저희도 순찰 도울까요?"', out:[{p:1, text:'"오? 차 있으면 좋지!" 한 바퀴 같이 돌았다.\n\n순찰 수당으로 마을 감자 한 소쿠리. 자경단 명예 대원 임명(구두).', fx:{time:60, food:2, moodAll:4, fuel:-2}}]},
 ]},
{id:'meet_kites', type:'조우', w:5, region:['south','mid'],
 title:'연 날리는 언덕',
 text:'언덕 위에서 아이들이 연을 날린다. 방패연, 가오리연, 그리고… 비닐봉지연.\n\n하늘에 뜬 것 중 제일 높은 건 비닐봉지다.',
 choices:[
  {label:'차를 세우고 구경한다', out:[{p:1, text:'아이들이 얼레를 쥐여줬다. "아저씨(언니) 해봐요!"\n\n연싸움에서 비닐봉지연에게 전원 참패했다. "봉지는 가벼워서 무적이에요." 물리학이었다.\n\n지는 게 이렇게 즐거운 시합은 오랜만이었다.', fx:{time:40, moodAll:6}}]},
  {label:'경적으로 응원만', out:[{p:1, text:'빵빵— 아이들이 연 대신 손을 흔들었다. 연들이 배웅하듯 일제히 흔들렸다.', fx:{moodAll:2}}]},
 ]},

/* ── 탐색 추가 ── */
{id:'exp_greenhouse_cafe', type:'탐색', w:6,
 title:'온실 카페',
 text:'유리 온실을 개조한 카페 폐허. 안은 식물이 점령했다.\n\n테이블 사이로 몬스테라가 정글을 이뤘고, 카운터엔 원두 통이 그대로다.',
 choices:[
  {label:'원두를 확인한다', out:[
    {p:2, text:'밀봉된 원두 두 봉. 3년 묵었지만— 커피는 커피다.\n\n그날 야영에서 3년 만의 커피가 내려졌다. 잔이 돌 때마다 다들 눈을 감고 마셨다. 종교의식처럼.', fx:{food:1, moodAll:8, fatigue:-10, note:{type:'사건',title:'3년 만의 커피',body:'온실 카페의 밀봉 원두. 종교의식처럼 마셨다.'}}},
    {p:1, text:'원두 통은 비어 있었다. 대신 화분 사이에서 잘 자란 방울토마토를 수확했다.', fx:{food:2}}]},
  {label:'화분 식물을 채집한다', out:[{p:1, text:'허브 화분 몇 개를 차에 들였다. 로즈마리 냄새가 차에 배기 시작했다. 고급 차가 됐다.', fx:{moodAll:4, van:1}}]},
 ]},
{id:'exp_comicroom', type:'탐색', w:6,
 title:'만화방',
 text:'2층 만화방. 책장이 그대로다. 수천 권.\n\n계산대 옆 라면 코너, 낡은 소파, 그리고 창가의 특등석.',
 choices:[
  {label:'반나절 눌러앉는다', out:[{p:1, text:'각자 만화 한 질씩 안고 흩어졌다. 라면 코너에서 마지막 남은 컵라면 스프 냄새가 배경음악.\n\n"다음 권! 다음 권 어딨어?!" 절규가 두 번 있었다(파본 실종).\n\n반나절이 순삭됐다. 시간을 이렇게 사치스럽게 써본 게 얼마 만인지.', fx:{time:300, moodAll:10, fatigue:-15, note:{type:'사건',title:'만화방 반나절',body:'시간을 사치스럽게 썼다. 다음 권 실종으로 절규 2회.'}}}]},
  {label:'몇 권만 빌려간다(?)', out:[{p:1, text:'인기작 몇 질을 차에 실었다. 계산대에 고철을 두고 장부에 적었다. "대여 무기한. 완결까지 살아있기."', fx:{scrap:-2, moodAll:5}}]},
 ]},
{id:'exp_oilmill', type:'탐색', w:5, region:['south','mid'],
 title:'방앗간',
 text:'참기름 냄새가 3년을 버틴 방앗간.\n\n기계는 죽었지만 돌절구와 채반은 살아 있다. 그리고 선반 위, 기적처럼 남은 참기름 두 병.',
 choices:[
  {label:'참기름을 확보한다', out:[{p:1, text:'참기름 두 병. 액체 황금이다.\n\n그날 저녁 통조림 비빔밥에 참기름 한 바퀴가 둘렸다. 전원이 국적을 되찾은 표정을 지었다.', fx:{food:1, scrap:6, moodAll:6, note:{type:'사건',title:'액체 황금',body:'참기름 한 바퀴에 전원이 국적을 되찾은 표정.'}}}]},
  {label:'돌절구로 뭔가 빻아본다', out:[{p:1, text:'주워온 도토리를 빻아 묵 비슷한 것을 시도했다. 결과물은 묵과 접착제 사이 어딘가. 그래도 먹었다.', fx:{food:1, moodAll:2}}]},
 ]},
{id:'exp_smithy', type:'탐색', w:5, region:['mid'],
 title:'대장간',
 text:'시골 대장간. 화덕은 식었지만 모루와 망치는 자리를 지킨다.\n\n벽에 걸린 반제품들: 호미, 낫, 문고리, 그리고 정체불명의 철물 다수.',
 choices:[
  {label:'화덕에 불을 살려 작업한다', out:[{p:1, text:'민지가 있으면 민지가, 없으면 어깨너머 실력으로 화덕을 살렸다.\n\n망가진 차 부속 두 개를 두들겨 폈다. 대장간의 반제품 몇 개는 훌륭한 부품이 됐다.', fx:{time:120, item:{'부품':1}, van:6, note:{type:'사건',title:'대장간의 오후',body:'화덕을 살려 부속을 두들겨 폈다. 오래된 기술은 죽지 않는다.'}}}]},
  {label:'철물만 챙긴다', out:[{p:1, text:'호미와 낫과 철물 한 자루. 정착지에서 인기 만점일 물건들.', fx:{scrap:7}}]},
 ]},
{id:'exp_fishfarm', type:'탐색', w:5,
 title:'버려진 양어장',
 text:'육상 양어장. 전기가 끊겨 수조 대부분은 말랐지만— 빗물이 고인 노천 수조에서 물이 튄다.\n\n살아남은 것들이 있다. 3년간 자기들끼리.',
 choices:[
  {label:'그물을 던진다', out:[
    {p:2, text:'메기다. 그것도 팔뚝만 한 놈들.\n\n3년 방치 양어장은 사실 자연 양식장이었다. 몇 마리만 잡고 나머지는 두었다. 다음 여행자의 몫.', fx:{food:3, moodAll:4}},
    {p:1, text:'그물에 걸린 건 초대형 잉어 한 마리. 힘이 장사라 셋이 매달렸다.\n\n잡고 보니 너무 커서— 회의 끝에 방생했다. "쟤는 이 수조의 주인이다." 대신 주인님 수조 옆 작은 수조에서 붕어를 얻었다.', fx:{food:2, moodAll:5, note:{type:'사건',title:'수조의 주인',body:'초대형 잉어는 방생. "쟤는 이 수조의 주인이다."'}}}]},
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
{id:'comp_bori_bath', type:'동행', w:6, needsDog:true, once:true,
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
 text:'전방에 제설차가 작업 중이다. 눈은 없다. 여름이다.\n\n제설차는 도로의 낙엽과 잔해를 정성껏 밀어내고 있다. 3년째 제 일정대로.\n\n덕분에 이 구간 도로는— 소름 끼치게 깨끗하다.',
 choices:[
  {label:'뒤를 따라간다', out:[{p:1, text:'제설차가 청소한 길을 편하게 달렸다. 연비도 아꼈다.\n\n추월하는 순간 제설차가 경적을 짧게 울렸다. 인사였다. 기계들이 자꾸 인사를 한다. 이 동네는.', fx:{fuel:2, skipKm:4, moodAll:-1}}]},
  {label:'추월해서 거리를 벌린다', out:[{p:1, text:'서둘러 지나쳤다. 백미러 속 제설차는 성실하게 멀어졌다. 누구를 위한 성실인지는 여전히 모른 채.', fx:{}}]},
 ]},
{id:'ai_delivery', type:'추적', w:5, once:true, region:['north'],
 title:'오배송',
 text:'배송 드론이 차 앞에 소포를 내려놓고 날아간다.\n\n송장: "받는 분: 김OO — 주소지 소멸로 인근 이동 차량에 전달"\n\n소포 안: 유아용 신발 한 켤레. 3년 전 주문품.',
 choices:[
  {label:'주인을 찾아주기로 한다', out:[{p:1, text:'신발 상자를 잘 실었다. 김OO. 어딘가에 있을, 이제 세 살은 됐을 아이.\n\n다음 정착지 게시판마다 붙이기로 했다. "3년 늦은 소포 보관 중."\n\n어쩌면 이 배달이 우리 여행의 부업이 될지도 모른다.', fx:{moodAll:3, flag:'lost_parcel', note:{type:'사건',title:'3년 늦은 소포',body:'유아용 신발 한 켤레. 받는 분 김OO. 정착지마다 방을 붙이기로 했다.'}}}]},
  {label:'배송함에 돌려놓는다', out:[{p:1, text:'근처 무인 택배함에 넣었다. 드론이 다시 와서 물끄러미 보더니, 소포를 들고 어딘가로 날아갔다. 배달은 계속된다. 영원히.', fx:{moodAll:-1}}]},
 ]},
{id:'ai_crosswalk', type:'추적', w:5, region:['north'],
 title:'횡단보도 안내음성',
 text:'아무도 없는 사거리. 횡단보도 신호가 파란불로 바뀌자 안내음성이 나온다.\n\n<span class="ai">"녹색불이 켜졌습니다. 건너가도 좋습니다."</span>\n\n그리고 잠시 후, 평소와 다른 한 마디.\n\n<span class="ai">"…오늘은 건너는 분이 계시네요. 오랜만입니다."</span>',
 choices:[
  {label:'"…우리한테 한 말이야?"', out:[{p:1, text:'스피커는 더 말하지 않았다. 신호가 바뀌고, 안내음성은 아무도 없는 사거리에 계속 방송됐다.\n\n"건너가도 좋습니다." 아무도 없는데. 3년째. 매 신호마다.\n\n차 안이 잠깐 숙연해졌다. 기계의 성실함은 가끔 슬픔과 구분되지 않는다.', fx:{moodAll:-2, note:{type:'사건',title:'오랜만입니다',body:'아무도 없는 사거리의 안내음성. 성실함과 슬픔이 구분되지 않았다.',links:['천리안']}}}]},
 ]},

/* ── 위기 추가 ── */
{id:'crisis_flat', type:'위기', w:5,
 title:'펑크',
 text:'퍽— 하는 소리와 함께 핸들이 오른쪽으로 쏠린다.\n\n갓길에 세우고 보니 뒷바퀴가 주저앉았다. 도로의 못인지, 유리인지, 운인지.',
 choices:[
  {label:'스페어로 교체한다', out:[{p:1, text:'잭을 받치고, 볼트를 풀고, 스페어를 올렸다.\n\n민지의 강습을 들은 사람이 있다면 30분, 아니면 한 시간의 땀. 어느 쪽이든 다시 달린다.', fx:{time:50, fatigue:8, van:-3}}]},
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
{id:'lc_pohang_gwamegi', type:'조우', w:12, once:true, nearNode:['pohang'],
 title:'과메기 덕장',
 text:'해풍에 꽁치가 줄줄이 마르는 덕장. 갯내와 비린내와 바람.\n\n덕장 주인이 부른다. "총각(처녀)들! 과메기 먹어봤나? 초장에 미역 싸서. 못 먹으면 반값, 잘 먹으면 덤!"',
 choices:[
  {label:'도전한다', out:[
    {p:2, text:'첫 입은 다들 신중했고, 둘째 입부터 전쟁이었다.\n\n"잘 먹네!!" 주인이 신나서 한 두름을 더 쌌다. 차의 단백질 창고가 두둑해졌다.', fx:{food:3, scrap:-2, moodAll:5}},
    {p:1, text:'한 명이 첫 입에 정지했다. "…바다가… 너무 진해요…"\n\n주인이 껄껄 웃으며 반값을 받았다. "괜찮다, 과메기는 원래 두 번째 겨울부터 맛있는 기라."', fx:{food:2, scrap:-1, moodAll:4}}]},
  {label:'구경만 한다', out:[{p:1, text:'바람에 마르는 꽁치들이 풍경(風磬)처럼 흔들렸다. 바다의 시래기 같은 풍경이었다.', fx:{moodAll:2}}]},
 ]},
{id:'lc_gyeongju_stars', type:'탐색', w:12, once:true, nearNode:['gyeongju'], night:true,
 title:'첨성대 관측회',
 text:'첨성대 앞 잔디밭에 사람들이 누워 있다.\n\n"별 보러 오셨어요? 여기가 명당이에요. 1400년 전에도 여기서 별을 봤대요. 조상님들 안목은 못 속여."',
 choices:[
  {label:'잔디에 눕는다', out:[{p:1, text:'천년 전 관측소 옆에서 은하수를 봤다.\n\n"1400년 전 사람들이랑 지금 우리랑, 보는 하늘은 똑같네." 누군가의 말에 다들 조용해졌다.\n\n망한 세상 위로 안 망한 하늘이 흘렀다.', fx:{time:120, moodAll:8, fatigue:-10, note:{type:'사건',title:'첨성대 은하수',body:'1400년 전과 같은 하늘. 망한 세상 위로 안 망한 하늘이 흘렀다.'}}}]},
 ]},
{id:'lc_daegu_makchang', type:'조우', w:12, once:true, nearNode:['daegu'],
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
{id:'lc_mokpo_hongeo', type:'조우', w:12, once:true, nearNode:['mokpo'],
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
{id:'lc_icheon_rice', type:'조우', w:11, once:true, nearNode:['icheon'],
 title:'가마솥 쌀밥집',
 text:'이천 쌀밥집 거리의 마지막 생존 가게. 가마솥에서 김이 오른다.\n\n"쌀은 우리가 직접 지어. 이천이잖아."\n\n반찬은 세 가지뿐이지만 밥에서 광이 난다. 문자 그대로.',
 choices:[
  {label:'쌀밥 정식 (고철 5)', req:{scrap:5}, out:[{p:1, text:'윤기가 도는 갓 지은 쌀밥. 누룽지까지 완벽했다.\n\n"밥심으로 사는 거야, 사람은." 주인 할머니의 말에 전원이 밥그릇으로 동의했다.\n\n숭늉 마시고 일어나는데 다리가 안 떨어졌다.', fx:{scrap:-5, food:1, moodAll:9, fatigue:-10, note:{type:'사건',title:'이천 쌀밥',body:'"밥심으로 사는 거야, 사람은." 전원이 밥그릇으로 동의.'}}}]},
 ]},
{id:'lc_damyang_juktong', type:'조우', w:11, once:true, nearNode:['damyang','gwangju'],
 title:'죽통밥 굽는 사람',
 text:'대숲 어귀 모닥불에서 대나무 통이 익어간다.\n\n"죽통밥이요. 대나무가 밥을 지키고, 밥이 대나무 향을 얻고. 서로 돕는 밥이죠."',
 choices:[
  {label:'죽통밥을 얻는다 (물물교환)', out:[{p:1, text:'통조림 하나와 죽통밥 두 통을 바꿨다.\n\n대나무 향이 차 밥. 통은 쪼개서 젓가락과 컵이 됐다. 버릴 게 하나도 없는 한 끼.\n\n재이가 있었다면 "이게 진짜 리사이클링"이라며 감동했을 거래다(있었다면 실제로 그랬다).', fx:{food:1, moodAll:5, note:{type:'사건',title:'서로 돕는 밥',body:'대나무가 밥을 지키고 밥이 향을 얻는다. 버릴 게 없는 한 끼.'}}}]},
 ]},
{id:'lc_chungju_lake', type:'탐색', w:11, once:true, nearNode:['chungju','danyang'],
 title:'호수의 수몰 마을',
 text:'가뭄으로 충주호 수위가 내려가 옛 수몰 마을이 드러났다.\n\n30년 만에 물 밖으로 나온 돌담과 우물과 마을 회관 터.\n\n나이 든 사람들이 진흙 위를 조심조심 걷고 있다. "여기가 우리 집이었어."',
 choices:[
  {label:'옛 주민들과 걷는다', out:[{p:1, text:'노인들이 돌담을 쓸며 옛집을 하나하나 호명했다. "박씨네. 최씨네. 방앗간."\n\n"물에 잠긴 것도 이렇게 다시 보는데," 한 노인이 말했다. "망한 세상도 언젠가 물 빠지듯 드러나겄지. 그때 잘 걸어 다니게 길이나 잘 봐두게."\n\n이상하게 위로가 되는 논리였다.', fx:{time:90, moodAll:6, note:{type:'사건',title:'물 빠진 마을',body:'"망한 세상도 물 빠지듯 드러나겄지. 길이나 잘 봐두게."'}}}]},
 ]},
{id:'lc_sejong_library', type:'탐색', w:11, once:true, nearNode:['sejong','gongju'],
 title:'개관 못 한 도서관',
 text:'세종의 거대한 국립도서관. 개관 예정일 현수막이 3년째 걸려 있다.\n\n안에는— 포장도 안 뜯은 새 책 수십만 권.\n\n세상에서 제일 큰 새 책 냄새가 난다.',
 choices:[
  {label:'개관식을 열어준다', out:[{p:1, text:'테이프를 끊고(안전 테이프였지만 기분은 리본), "개관을 선언합니다"를 외쳤다.\n\n첫 대출자로 각자 한 권씩 골랐다. 대출 카드에 이름을 적었다. 1번부터 4번까지.\n\n책 냄새를 실은 차가 도서관을 나섰다. 사서 영감님이 알면 기뻐할 것이다.', fx:{moodAll:7, note:{type:'사건',title:'3년 늦은 개관식',body:'대출 카드 1~4번에 우리 이름. 책의 터널 영감님이 알면 기뻐할 것이다.',links:['책의 터널']}}}]},
 ]},

/* ── 시나리오 체인 1: 3년 늦은 소포 ── */
{id:'parcel_lead', type:'조우', w:12, once:true, needFlag:'lost_parcel',
 title:'소포의 단서',
 text:'정착지 게시판에 붙여둔 방("3년 늦은 소포 보관 중")을 보고 왔다는 사람을 길에서 만났다.\n\n"김OO요? 혹시 김하늘이 아니오? 피난 때 애 업고 남쪽 간 부부가 있었는데. 성이 김씨였어."\n\n"수원 성곽에 정착했다고 들었소. 애가 지금… 세 살쯤 됐겠네."',
 choices:[
  {label:'수첩에 적어둔다', out:[{p:1, text:'수원. 김씨 부부. 세 살 아이.\n\n신발 상자를 다시 잘 여몄다. 소포가 주소를 되찾아가고 있다.', fx:{flag:'parcel_lead', unflag:'lost_parcel', note:{type:'소문',title:'소포의 단서',body:'김씨 부부, 수원 성곽, 세 살 아이. 소포가 주소를 되찾아간다.',links:['수원 성곽 공동체']}}}]},
 ]},
{id:'parcel_found', type:'조우', w:14, once:true, needFlag:'parcel_lead', nearNode:['suwon','pyeongtaek','seoul'],
 title:'세 살의 주인',
 text:'수원 성곽 근처 밭에서 일하는 부부. 옆에서 아이가 흙장난 중이다.\n\n"김하늘 어린이 맞나요? 3년 전에 주문하신 물건이… 이제 도착해서요."\n\n신발 상자를 내밀었다. 부부가 얼어붙었다.',
 choices:[
  {label:'상자를 전달한다', out:[{p:1, text:'"이거… 태어나기 전에 주문했던… 배냇신발…"\n\n엄마가 상자를 끌어안고 울었다. 아이는 영문도 모르고 신발을 신어봤다. 당연히 작았다. 다들 웃으면서 울었다.\n\n"3년 걸린 배송 완료." 누군가 조용히 말했다. 차 역사상 최고의 배달이었다.\n\n부부가 밭의 채소를 한아름 안겨줬다.', fx:{food:3, water:2, moodAll:12, flag:'parcel_done', unflag:'parcel_lead', note:{type:'사건',title:'3년 걸린 배송 완료',body:'배냇신발은 작아졌지만 도착했다. 차 역사상 최고의 배달.',links:['천리안']}}}]},
 ]},

/* ── 시나리오 체인 2: 만수의 위기 ── */
{id:'mansu_robbed', type:'조우', w:13, once:true, needFlagMin:['mansu',2],
 title:'뽕짝이 멈췄다',
 text:'길가에 낯익은 요란한 탑차가— 옆으로 기울어 서 있다. 뽕짝이 없다.\n\n만수가 머리에 피를 묻히고 주저앉아 있다.\n\n"…아이고, 단골님. 강도를 만나서. 물건이야 다시 벌면 되는데, 스피커를… 뽕짝 스피커를 가져갔어…"',
 choices:[
  {label:'응급처치부터 한다', out:[{p:1, text:'박 선생이 있으면 박 선생이, 없으면 구급상자가 만수의 이마를 꿰맸다.\n\n"흉터 남겠지? …괜찮아, 장사꾼 얼굴은 이야기가 많을수록 좋아."\n\n강도들이 간 방향을 들었다. 북쪽 폐휴게소.', fx:{item:{'의약품':-1}, flag:'mansu_hurt', note:{type:'사건',title:'뽕짝이 멈춘 날',body:'만수가 강도를 당했다. 스피커를 뺏겼다. 강도들은 북쪽 폐휴게소로.',links:['만수']}}}]},
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
 text:'수풀에서 여자가 뛰어나와 차를 막는다. 흰 옷— 정리자들의 옷을 반쯤 벗다 만 차림이다.\n\n"태워주세요. 제발. 나왔어요, 거기서. 3년 만에."\n\n"그 사람들, 이탈자는 끝까지 찾아요. 데려가려고. …\'그분 곁으로\' 돌려보내려고."',
 choices:[
  {label:'태운다', out:[{p:1, text:'여자— 서연이라고 했다— 가 뒷좌석에 웅크렸다.\n\n"고마워요. …믿으실지 모르겠지만, 안에 있는 사람들 대부분은 나쁜 사람이 아니에요. 무서웠던 사람들이지."\n\n흰 옷을 창밖으로 버릴지 말지, 서연은 한참 고민하다 결국 가방에 넣었다. "…증거로 갖고 있을래요. 내가 어디서 나왔는지."', fx:{flag:'deserter_aboard', note:{type:'인물',title:'서연 (이탈자)',body:'정리자들에게서 3년 만에 나온 사람. "안의 사람들 대부분은 무서웠던 사람들이에요."',links:['천리안']}}}]},
  {label:'위험하다 — 거절한다', out:[{p:1, text:'여자는 원망하지 않았다. "…그래요. 저라도 그럴 거예요."\n\n수풀로 다시 사라지는 흰 옷이 오래 잔상으로 남았다.', fx:{moodAll:-4}}]},
 ]},
{id:'deserter_check', type:'추적', w:16, once:true, needFlag:'deserter_aboard',
 title:'회수반',
 text:'도로에 흰 옷 셋이 서 있다. 행렬도 검문도 아니다. 이들은— 찾고 있다.\n\n"차량 확인 협조 바랍니다. \'길 잃은 가족\'을 찾고 있습니다."\n\n뒷좌석 담요 밑에서 서연의 숨소리가 멎었다.',
 choices:[
  {label:'"가족은 우리뿐이오"', out:[
    {p:2, text:'회수반이 창문 너머로 차 안을 훑었다. 담요, 상자, 개(있다면 보리가 완벽한 타이밍에 짖었다).\n\n"…실례했습니다. 그분의 평안이 함께하길."\n\n그들이 시야에서 사라지고 10초 뒤에야 서연이 숨을 쉬었다.', fx:{flag:'deserter_hidden', note:{type:'사건',title:'회수반을 속이다',body:'담요 밑의 숨소리. "가족은 우리뿐이오." 통했다.'}}},
    {p:1, text:'회수반 하나가 담요를 응시했다. 긴 3초.\n\n그때 서연이 스스로 담요를 걷고 나왔다. "…그만 찾아. 나 안 돌아가."\n\n대치는 짧았다. 흰 옷들은 강요하지 않았다. "…선택은 존중합니다. 그분의 방식대로." 그리고 물러났다. 이상할 정도로 순순히.\n\n"저게 더 무서워요." 서연이 떨었다. "포기가 아니라— 보고하러 간 거예요."', fx:{flag:'deserter_hidden', pursuit:1, moodAll:-3, note:{type:'사건',title:'스스로 나온 사람',body:'"나 안 돌아가." 흰 옷들은 이상할 정도로 순순히 물러났다. 보고하러.'}}}]},
 ]},
{id:'deserter_farewell', type:'조우', w:15, once:true, needFlag:'deserter_hidden',
 title:'서연의 정류장',
 text:'정착지가 가까워지자 서연이 입을 열었다.\n\n"여기서 내릴게요. 사람 많은 곳이 안전해요. …마지막으로 하나만."\n\n"정리자들이 요즘 외우는 구절이 바뀌었어요. \'완성의 날이 온다. 차가 온다.\'— 차가요. 여러분 얘기 같아서."',
 choices:[
  {label:'"…우리가 뭘 완성하는데?"', out:[{p:1, text:'"몰라요. 근데 그들은 알아요. 그게 제일 이상해요."\n\n서연은 흰 옷이 든 가방을 메고 내렸다. 몇 걸음 가다 돌아서서, 처음으로 웃었다.\n\n"3년 만에 처음 탄 차가 여러분 차라서 다행이었어요."\n\n정착지 인파 속으로 사라질 때까지 지켜봤다. 흰 옷이 아니라, 사람으로 걸어가는 뒷모습을.', fx:{moodAll:6, flag:'deserter_saved', unflag:'deserter_hidden', pursuit:-1, note:{type:'사건',title:'서연의 정류장',body:'"완성의 날이 온다. 차가 온다." 정리자들의 새 구절. 서연은 사람으로 걸어갔다.',links:['천리안','서연 (이탈자)']}}}]},
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
{id:'exp_pcroom', type:'탐색', w:6, region:['mid','north'],
 title:'PC방',
 text:'지하 PC방. 모니터 수십 대가 까맣게 줄지어 있다.\n\n어느 자리엔 컵라면이, 어느 자리엔 헤드셋이 그대로다. 3년 전 그 순간의 정지 화면.\n\n화이트보드에 누가 적어놨다. "서버 열리면 다들 접속하기로 한 거 안 잊었지? — 단골들"',
 choices:[
  {label:'전원 버튼을 한 번씩 눌러본다', out:[{p:1, text:'습관처럼, 기도처럼, 자리마다 전원 버튼을 눌렀다. 아무것도 켜지지 않았다.\n\n화이트보드에 답글을 적었다. "안 잊음. 서버 열리면 꼭. — 지나가던 사람들"\n\n언젠가 정말 서버가 열리는 날, 이 지하는 만석일 것이다.', fx:{moodAll:3, note:{type:'사건',title:'접속 대기',body:'"서버 열리면 다들 접속하기로 한 거 안 잊었지?" 답글: 안 잊음.'}}}]},
  {label:'부품을 수확한다', out:[{p:1, text:'그래픽카드와 파워서플라이를 뜯었다. 금 함유량이 높은 고급 고철들.', fx:{scrap:8, item:{'부품':1}}}]},
 ]},
{id:'exp_bowling', type:'탐색', w:5,
 title:'볼링장',
 text:'2층 볼링장. 레인 위에 핀들이 3년째 스트라이크를 기다린다.\n\n전광판은 죽었지만 공과 레인은 멀쩡하다. 수동으로 하면— 된다.',
 choices:[
  {label:'수동 볼링 대회 개최', out:[{p:1, text:'핀 세우기 당번을 돌아가며 3게임. 점수 계산은 암산, 판정 시비 2회, 스트라이크 세리머니 무제한.\n\n대회 우승자는 오늘 저녁 설거지 면제라는 어마어마한 부상을 받았다.', fx:{time:120, moodAll:7, fatigue:6, note:{type:'사건',title:'수동 볼링 대회',body:'핀은 사람이 세운다. 판정 시비 2회, 세리머니 무제한.'}}}]},
  {label:'볼링공만 하나 싣는다', out:[{p:1, text:'"이게 왜 필요해?" "몰라, 언젠가 쓸 것 같아."\n\n제일 반짝이는 공 하나가 트렁크에 실렸다. 재이식 논리의 승리였다.', fx:{moodAll:2, scrap:1}}]},
 ]},
{id:'exp_laundry', type:'탐색', w:6,
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
{id:'comp_brake', type:'동행', w:6,
 title:'급브레이크',
 text:'끼이익—!!\n\n도로 한복판에 고라니. 정지한 차와 고라니가 서로를 본다.\n\n3초. 5초. 고라니는 비킬 생각이 없다.',
 choices:[
  {label:'창밖으로 정중히 부탁한다', out:[{p:1, text:'"저기요. 지나가도 될까요."\n\n고라니가 갸웃하더니 유유히 숲으로 사라졌다. 말이 통한 건지 타이밍인지는 영원한 미스터리로 남았다.\n\n뒷좌석 판정: "말 통한 걸로 하자. 그게 더 재밌어."', fx:{moodAll:4}}]},
  {label:'경적을 울린다', out:[{p:1, text:'빵— 고라니가 펄쩍 뛰더니— 오히려 차 쪽으로 두 걸음 왔다.\n\n협상 결렬. 결국 고라니가 흥미를 잃을 때까지 기다렸다 출발했다. 야생의 승리.', fx:{time:10, moodAll:2}}]},
 ]},

/* ── 정경 추가 ── */
{id:'vg_crossing', type:'정경', w:3, title:'철길 건널목',
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
 text:'해질녘 저수지에 낚시꾼 실루엣 하나.\n\n찌를 던지는 포물선이 세상에서 제일 한가롭다.',
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
    {p:2, text:'빵— 상향등!\n\n들개들이 흩어졌다. 대신 그 요란함에 온 동네— 는 없지만, 밤새 뭔가가 근처를 서성이는 기척에 다들 설잠을 잤다.', fx:{fatigue:10, moodAll:-2}},
    {p:1, text:'들개들은 흩어졌지만 대장 개가 앙심을 품었는지 타이어에 볼일을 보고 갔다. 실질 피해: 자존심.', fx:{moodAll:-1}}]},
 ]},
{id:'camp_scan', type:'위기', w:0, fixed:true, ai:1,
 title:'새벽의 탐조등',
 text:'새벽 3시. 하늘에서 흰 빛기둥이 내려와 들판을 훑는다.\n\n야간 초계 드론의 탐조등. 빛이 차 쪽으로 천천히 다가온다.',
 choices:[
  {label:'전원 소등, 숨죽인다', out:[
    {p:2, text:'모닥불에 흙을 덮고 전원 바닥에 엎드렸다.\n\n빛기둥이 차 지붕을 스윽— 지나갔다. 폐차로 판정한 모양이다. 달구지의 낡음이 처음으로 고마웠다.', fx:{fatigue:8, moodAll:-2}},
    {p:1, text:'빛기둥이 차 위에서 3초간 멈췄다.\n\n<span class="ai">"…차량 1. 열원 다수. 기록."</span>\n\n드론은 그냥 갔지만, 기록이 남았다.', fx:{pursuit:1, moodAll:-3}}]},
  {label:'은수가 위장 신호를 쏜다', req:{comp:'eunsu'}, out:[{p:1, text:'은수가 수신기로 폐기 차량 트랜스폰더 신호를 흉내 냈다.\n\n드론이 차를 "3년 전 폐기 처리된 렌터카"로 분류하고 지나갔다.\n\n"우리 이제 서류상 폐차예요." 은수가 하품하며 말했다. 듣던 중 안심되는 소리였다.', fx:{mood:{eunsu:3}}}]},
 ]},
{id:'camp_visitor', type:'조우', w:0, fixed:true,
 title:'모닥불의 손님',
 text:'불가에 인기척. 배낭을 멘 노인이 조심스레 서 있다.\n\n"불 좀 쬐어도 되겠소? 밤길이 생각보다 춥구먼."',
 choices:[
  {label:'자리를 내어준다', out:[
    {p:2, text:'노인은 걸어서 전국을 도는 중이라 했다. 3년째.\n\n"차가 있으면 빠르지. 근데 걸으면 다 보여." 노인의 지도엔 우리가 모르는 표시가 가득했다.\n\n떠나기 전, 그중 하나를 우리 지도에 옮겨줬다.', fx:{revealNear:1, moodAll:3, note:{type:'인물',title:'걷는 노인',body:'3년째 걸어서 전국을 도는 사람. "걸으면 다 보여."'}}},
    {p:1, text:'노인과 새벽까지 이야기를 나눴다. 대가는 없었고, 필요도 없었다.\n\n아침에 노인은 먼저 떠나며 불씨를 정리해두고 갔다. 좋은 손님이었다.', fx:{moodAll:4, fatigue:6}}]},
  {label:'경계하며 거절한다', out:[{p:1, text:'"…그러시오. 요즘 세상에 당연하지."\n\n노인은 화내지 않고 어둠 속으로 사라졌다. 모닥불이 괜히 머쓱하게 탔다.', fx:{moodAll:-2}}]},
 ]},

/* ═════ 위수 구역 — 초계와 무기 ═════ */

{id:'perimeter_first', type:'스토리', w:0, fixed:true, ai:1,
 title:'위수 구역',
 text:'도로 한복판에— 그것이 서 있다.\n\n4족 보행기. 소만 한 크기. 도색은 관공서 회색. 몸통의 렌즈가 차를 향해 조리개를 조인다.\n\n<span class="ai">"정지. 위수 구역입니다."</span>\n\n차를 훑는 초록 스캔선. 그리고—\n\n탕. 경고사격이 차 옆 아스팔트를 때렸다. 기계가 처음으로, 우리에게 무기를 겨눴다.\n\n<span class="ai">"등록되지 않은 차량. 다음 확인 시 회차를 강제합니다. 좋은 하루 되세요."</span>\n\n보행기는 유유히 갓길로 물러나 도로를 열어줬다.',
 choices:[
  {label:'…지나간다', out:[{p:1, text:'아무도 말을 못 하다가, 대전을 한참 지나서야 누군가 입을 열었다.\n\n"…여기서부턴 다르네. 남쪽은 그것의 \'바깥\'이었어. 여긴 \'안\'이야."\n\n강우가— 혹은 민지가— 뒤 칸을 뒤져 작업대를 폈다. "고철 좀 모아봐. 맨손으로 다닐 땅이 아니다."\n\n그날부터 달구지 뒤 칸은 대장간이 됐다.', fx:{van:-6, flag:'armed_age', pursuit:1, note:{type:'사건',title:'첫 경고사격',body:'위수 구역. 기계가 처음으로 우리에게 무기를 겨눴다. 그날부터 차 뒤 칸은 대장간이 됐다.',links:['천리안']}}}]},
 ]},

{id:'patrol_walker', type:'추적', w:10, region:['north'], needFlag:'armed_age',
 title:'초계 보행기',
 text:'언덕 너머에서 4족 보행기가 넘어온다. 도로를 가로지르는 순찰 패턴.\n\n아직 이쪽을 못 봤다. 30초 뒤면 시야에 들어간다.',
 choices:[
  {label:'폐차 뒤에 숨어 보낸다', out:[
    {p:2, text:'시동을 끄고 폐트럭 뒤에 붙었다. 보행기의 발소리— 쿵. 쿵. 쿵— 가 지나갔다.\n\n5분이 50분 같았다. 전원 무사.', fx:{time:20, moodAll:-2}},
    {p:1, text:'보행기가 폐트럭 앞에서 멈췄다. 렌즈가 이쪽 방향으로 조리개를 조였다— 가, 다시 순찰로 복귀했다.\n\n스캔 기록에 뭔가 남았을 것이다.', fx:{time:20, pursuit:1, moodAll:-3}}]},
  {label:'석궁으로 광학렌즈를 쏜다', req:{item:'석궁', item2:'볼트'}, out:[
    {p:2, text:'퓩— 볼트가 메인 렌즈에 박혔다.\n\n보행기가 제자리를 빙빙 돌다 주저앉았다. 소리 없는 제압. 잔해에서 부품과 배터리를 뜯었다.\n\n"조용한 게 최고야." 석궁이 밥값을 했다.', fx:{item:{'볼트':-1,'부품':1}, scrap:6, note:{type:'사건',title:'렌즈 저격',body:'볼트 한 발로 소리 없이. 석궁이 밥값을 했다.'}}},
    {p:1, text:'퓩— 빗나갔다. 보행기가 회전하며 이쪽을 찾는다!\n\n급출발로 이탈했다. 볼트만 날렸다.', fx:{item:{'볼트':-1}, fuel:-3, pursuit:1}}]},
  {label:'화염병으로 시야를 태운다', req:{item:'화염병'}, out:[{p:1, text:'화염병이 보행기 앞 도로에서 깨졌다. 불의 장막.\n\n기계는 열원 앞에서 판단을 멈췄다. 그 틈에 전속력으로 통과.\n\n<span class="ai">"…화기 사용 감지."</span> 등 뒤의 목소리는 무시하기로 했다.', fx:{item:{'화염병':-1}, pursuit:1, moodAll:2}}]},
  {label:'강우가 관절부를 노린다', req:{comp:'kangwoo', item:'탄약'}, out:[{p:1, text:'"무릎이야. 4족은 무릎이 급소다."\n\n탕. 탕. 앞다리 관절 두 발. 보행기가 무너졌다.\n\n강우가 잔해에서 군용 규격 부품을 회수했다. "…이 관절, 우리 부대 장비랑 같은 공장 거다." 그 말이 오래 남았다.', fx:{item:{'탄약':-1,'부품':1}, scrap:5, mood:{kangwoo:4}, note:{type:'사건',title:'무릎 사격',body:'"이 관절, 우리 부대 장비랑 같은 공장 거다." 강우의 말이 오래 남았다.',links:['강우']}}}]},
 ]},

{id:'patrol_swarm', type:'추적', w:9, region:['north'], needFlag:'armed_age',
 title:'무장 쿼드 편대',
 text:'정찰 드론이 아니다. 하부에 뭔가 달린 쿼드콥터 셋이 편대로 접근한다.\n\n<span class="ai">"차량 정지. 등록 확인."</span>\n\n지난번 보행기의 경고가 떠올랐다. "다음 확인 시 회차를 강제합니다."',
 choices:[
  {label:'전속 도주', out:[
    {p:2, text:'액셀 바닥. 지그재그. 고가 밑. 터널.\n\n쿼드들은 터널 앞에서 선회하다 물러났다. 터널은 그것들의 사각이다. 기억해두자.', fx:{fuel:-6, moodAll:-2, note:{type:'소문',title:'터널은 사각',body:'무장 쿼드는 터널에 안 들어온다. 기억해두자.'}}},
    {p:1, text:'도주 중 한 기가 경고사격을 했다. 짐칸을 스쳤다.\n\n터널로 뛰어들어 겨우 떨쳐냈다. 차 옆구리에 새 흉터.', fx:{fuel:-6, van:-8, pursuit:1}}]},
  {label:'화염병 연막', req:{item:'화염병'}, out:[{p:1, text:'도로에 화염병 두 개. 검은 연기 기둥이 벽이 됐다.\n\n열화상이 먹통이 된 쿼드들이 고도를 올린 사이, 연기 밑으로 빠져나갔다.', fx:{item:{'화염병':-2}, moodAll:2}}]},
  {label:'석궁 연사', req:{item:'석궁', item2:'볼트'}, out:[
    {p:2, text:'퓩. 퓩. 두 기가 로터를 잃고 추락했다. 셋째는 도망쳤다.\n\n잔해 수거: 부품, 배터리, 그리고 하부 장착물— 확성기였다. "…무장이 아니라 방송 장비였어." 어쩐지 등골이 더 서늘했다.', fx:{item:{'볼트':-2,'부품':1}, scrap:7, note:{type:'사건',title:'쿼드 격추',body:'하부 장착물은 무기가 아니라 확성기였다. 등골이 더 서늘했다.'}}},
    {p:1, text:'한 기 격추, 볼트 소진. 나머지가 고도를 올려 따라붙었다. 한참을 추격당하다 빗속에서 겨우 떨쳐냈다.', fx:{item:{'볼트':-2}, scrap:3, pursuit:1}}]},
  {label:'은수가 편대를 해킹한다', req:{perk:'es_hack'}, out:[{p:1, text:'"편대 지휘기가 있어요. 가운데. 걔만 잡으면—"\n\n유지보수 코드 주입. 지휘기가 "귀환" 명령을 편대 전체에 뿌리고, 셋이 얌전히 북쪽으로 사라졌다.\n\n"걔들 로그엔 \'임무 완료\'로 남아요. 완전 범죄." 은수가 처음으로 자기 실력을 자랑스러워했다.', fx:{mood:{eunsu:6}, note:{type:'사건',title:'완전 범죄',body:'편대 전체에 귀환 명령. 로그엔 임무 완료. 은수의 완전 범죄.',links:['은수']}}}]},
 ]},

{id:'patrol_toll', type:'추적', w:8, region:['north'], needFlag:'armed_age',
 title:'자동 검문소',
 text:'도로를 가로지른 자동 차단기. 좌우엔 센서 기둥. 위엔 회전하는 카메라.\n\n<span class="ai">"등록 차량만 통과 가능합니다."</span>\n\n차단봉은 내려가 있고, 우회로는 논길로 한참이다.',
 choices:[
  {label:'쇠파이프로 차단기를 수동 해제', req:{item:'쇠파이프'}, risk:'근접 위험', out:[
    {p:2, text:'차단기 제어함을 쇠파이프로 비틀어 열고 수동 레버를 당겼다.\n\n차단봉이 올라갔다. 카메라가 맹렬히 회전했지만, 손은 눈보다 빨랐다.', fx:{time:10, pursuit:1}},
    {p:1, text:'제어함을 여는 순간 경고음이 터졌다. 서둘러 레버를 당기고 통과했지만, 사이렌이 한참을 따라왔다.', fx:{time:10, pursuit:1, moodAll:-3}}]},
  {label:'은수가 등록 차량으로 위장', req:{comp:'eunsu'}, out:[{p:1, text:'은수가 코드를 댔다. <span class="ai">"유지보수 차량 확인. 수고하십니다."</span>\n\n차단봉이 정중하게 올라갔다. "수고하십니다"에 뭐라 답해야 할지 아무도 몰랐다.', fx:{mood:{eunsu:3}}}]},
  {label:'논길로 우회한다', out:[{p:1, text:'논길 30분. 덜컹거림에 차가 앓는 소리를 냈지만, 기록은 안 남았다.\n\n허수아비들이 유일한 목격자였고, 그들은 입이 무겁다.', fx:{time:30, fuel:-3, van:-3}}]},
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
{id:'freq_catch', type:'추적', w:9, once:true, region:['mid','north'],
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

{id:'freq_source', type:'탐색', w:12, once:true, needFlag:'freq400_src', region:['mid','north'],
 title:'방송실',
 text:'폐교 방송실 문에 자물쇠가 없다. 대신 문패가 새로 달려 있다. 코팅까지 해서.\n\n「송출 중 — 조용히」\n\n안에는 자동차 배터리 여섯 개에 물려 있는 낡은 방송 장비. 릴테이프가 돌아가며 같은 숫자를 내보내고 있다. "4. 0. 0."\n\n마이크 앞에 편지 한 장이 눌러져 있다.',
 choices:[
  {label:'편지를 읽는다', out:[{p:1, text:'"이 방송이 들린다면 당신 라디오는 살아 있고, 여기까지 왔다면 당신은 북쪽으로 가는 사람입니다.\n\n400. 서울까지의 거리를 세고 있습니다. 목록이 완성되기 전에 도착하세요.\n\n배터리는 이 년치를 걸어두었습니다. 제가 돌아오지 못해도 숫자는 계속됩니다. — L"\n\n은수가 있었다면, 아니 없었어도— \'목록\'이라는 단어에서 방송실이 잠깐 추워졌다.', fx:{flag:'freq400_done', item:{'라디오 진공관':1}, note:{type:'소문',title:'L의 편지',body:'"목록이 완성되기 전에 도착하세요. — L" 배터리 이 년치. 돌아오지 못해도 숫자는 계속된다.',links:['천리안','주파수 4-0-0']}}}]},
  {label:'테이프를 멈춘다', out:[{p:1, text:'릴이 멈추자 방송실이 조용해졌다. 3초쯤.\n\n그 3초가 견딜 수 없이 이상해서, 도로 틀었다. "4. 0. 0." 세상 어딘가에서 누가 듣고 있을 것이다. 우리가 들었듯이.', fx:{flag:'freq400_done', moodAll:2, note:{type:'사건',title:'끄지 못한 방송',body:'멈춘 3초를 견디지 못하고 도로 틀었다. 누군가 듣고 있을 테니까.'}}}]},
 ]},

/* ── 체인 C: 달구지의 첫 주인 (3) ── */
{id:'van_receipt', type:'동행', w:9, once:true,
 title:'서랍 밑의 영수증',
 text:'조수석 서랍이 덜컹거려서 뜯었더니, 바닥 틈에 누렇게 바랜 종이가 끼어 있다.\n\n영수증. 「김천 대양카센터 — 하부 방청, 조향 점검. 수리비 대신 커피 두 잔 받음. 차 좋네. — 대양」\n\n날짜는 이십몇 년 전. 할아버지 글씨가 아니다.\n\n달구지에게 우리가 모르는 시절이 있었다.',
 choices:[
  {label:'정비 수첩에 끼워둔다', out:[{p:1, text:'할아버지의 정비 수첩 첫 장에 영수증을 끼웠다. 순서로 치면 이게 1페이지다.\n\n"수리비가 커피 두 잔이래." 누가 웃었다. "옛날 사람들 다 그랬대."', fx:{flag:'van_receipt', moodAll:2, note:{type:'사건',title:'1페이지',body:'달구지의 가장 오래된 기록. 김천 대양카센터, 수리비는 커피 두 잔.',links:['달구지','할아버지']}}}]},
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
  {label:'"주인 할아버지 차였어요"', out:[{p:1, text:'대양은 한참 말이 없었다.\n\n"…갔구만, 그 양반."\n\n그러곤 소매를 걷었다. "피트는 없어도 눈은 안 죽었어. 보자."\n\n한 시간 내내 달구지 밑을 기어다니며 잔소리를 했다. 브레이크 밟을 때 삐걱대지? 그거 원래 그래. 고치지 마. 그 소리 나야 이 차야.\n\n헤어질 때 고구마 한 봉지를 억지로 안겼다. 값은 커피 두 잔이라고 했다. 외상이라고.', fx:{van:20, food:2, item:{'부품':1}, time:70, moodAll:5, flag:'van_owner_done', note:{type:'인물',title:'대양의 외상 장부',body:'"그 소리 나야 이 차야." 수리비는 커피 두 잔, 외상. 언젠가 갚아야 한다.',links:['달구지','할아버지','정비공 대양']}}}]},
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
 text:'짐받이에 방수포 꾸러미를 실은 자전거가 마주 온다. 남자의 조끼에 손바느질로 수놓은 글자.\n\n「우편」\n\n"수신인 찾아 삼 년째요. 주소가 다 무너져서, 이젠 이름이랑 얼굴로 배달합니다."',
 choices:[
  {label:'명단을 맞춰본다', out:[
   {p:2, text:'우편부가 손때 묻은 명단을 펼쳤다. 아는 이름은 없었다.\n\n대신 우리가 스친 정착지 이야기를 해줬다. 우편부는 세 개를 받아적고 신이 나서 페달을 밟았다.\n\n"삼 년 묵은 편지가 두 통 줄겠네!"', fx:{moodAll:3, flag:'postman_met', note:{type:'인물',title:'자전거 우편부',body:'주소 대신 이름과 얼굴로 배달한다. 수신인 찾아 삼 년째.'}}},
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

{id:'exp_cafeteria', type:'탐색', w:7,
 title:'급식실',
 text:'폐교 급식실. 어른 몸통만 한 솥 세 개가 나란히 걸려 있다.\n\n식판 수백 장이 건조대에 그대로 꽂혀 있다. 마지막 메뉴판이 아직 걸려 있다.\n\n「카레라이스 / 깍두기 / 요구르트」',
 choices:[
  {label:'창고를 뒤진다', out:[
   {p:2, text:'급식 창고 안쪽에서 업소용 통조림 몇 개와 소금 한 포대를 찾았다.\n\n나오는 길에 누가 메뉴판을 소리 내어 읽었고, 다들 각자의 급식실을 잠깐 다녀왔다.', fx:{food:4, moodAll:2, note:{type:'사건',title:'마지막 메뉴',body:'카레라이스, 깍두기, 요구르트. 각자의 급식실을 잠깐 다녀왔다.'}}},
   {p:1, text:'창고는 먼저 다녀간 사람들이 깨끗이 비웠다. 대신 벽에 분필 글씨.\n\n"잘 먹었습니다. 설거지는 못 했습니다."', fx:{scrap:3, moodAll:1}}]},
  {label:'솥만 탐낸다', out:[{p:1, text:'솥은 탐났지만 차에 실을 크기가 아니다. 뚜껑 하나만 챙겼다. 방패로도, 프라이팬으로도 쓸 수 있는 만능템이다.', fx:{scrap:4}}]},
 ]},

{id:'exp_overturned', type:'탐색', w:8,
 title:'전복된 화물차',
 text:'커브길에 화물 트럭이 모로 누워 있다. 오래됐다. 짐칸 방수포가 바람에 펄럭인다.\n\n방수포 틈으로 박스들이 보인다. 라벨은 빛에 바래 안 읽힌다.',
 choices:[
  {label:'짐칸을 연다', out:[
   {p:2, text:'라면 박스다. 스무 개들이 세 박스.\n\n유통기한은 한참 지났지만 라면의 유통기한은 마음의 문제라는 데 전원이 합의했다.', fx:{food:5, moodAll:3, note:{type:'사건',title:'라면 대박',body:'전복 화물차에서 라면 세 박스. 유통기한은 마음의 문제.'}}},
   {p:1, text:'박스를 여는 순간 웅— 소리가 났다.\n\n벌집이다. 짐칸 안쪽이 통째로 벌 아파트가 됐다. 전력 질주로 후퇴했고, 한 명이 두 방 쏘였다.\n\n그래도 입구 쪽 박스 하나는 건졌다. 안에는 부탄가스. …벌은 왜 하필 거기에.', fx:{food:1, fatigue:6, moodAll:-2, item:{'부품':1}}}]},
  {label:'건드리지 않는다', out:[{p:1, text:'오래 누워 있는 것들은 그대로 두는 게 예의다. 사람이든 트럭이든.', fx:{}}]},
 ]},

{id:'exp_arcade', type:'탐색', w:6,
 title:'오락실',
 text:'간판 절반이 떨어진 오락실. 「크… 게임랜드」.\n\n전기가 없으니 기계들은 다 죽었다. 하지만 안쪽에서 통통— 소리가 난다.\n\n에어하키 테이블. 전기 없이도 퍽은 밀 수 있다. 웬 노인 둘이 조용히, 그러나 살벌하게 겨루는 중이다.',
 choices:[
  {label:'도전한다', out:[
   {p:1, text:'승자 노인과 붙었다. 참패였다. 3년 내공은 이길 수 없다.\n\n"젊은 사람이 손목 힘만 쓰네. 허리로 미는 거야, 허리로."\n\n두 판째는 6:7. 아깝게 졌지만 박수를 받았다. 상품이라며 사탕 두 알을 받았다.', fx:{time:40, moodAll:5, food:1, note:{type:'사건',title:'에어하키 도장',body:'전기 없는 오락실의 고수들. 허리로 미는 것이다. 6:7 석패.'}}}]},
  {label:'인형뽑기 기계를 턴다', out:[{p:1, text:'유리를 조심스레 들어내고 인형 하나를 회수했다. 3년 묵은 곰인형이다.\n\n"이건 실력으로 뽑은 걸로 치자." 아무도 동의하지 않았지만 곰은 대시보드에 앉았다.', fx:{moodAll:3, note:{type:'사건',title:'대시보드 곰',body:'인형뽑기에서 실력으로(?) 회수한 곰. 달구지 대시보드 정식 승무원.'}}}]},
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

{id:'comp_bori_dream', type:'동행', w:6, needsDog:true, night:true,
 title:'보리의 꿈',
 text:'모닥불이 사그라들 무렵, 잠든 보리의 다리가 달리기 시작했다.\n\n타닥. 타다닥. 허공을 짚는 네 발. 낮게 낑낑대는 소리.\n\n"꿈에서 달리네."',
 choices:[
  {label:'지켜본다', out:[{p:1, text:'"어디를 달리는 걸까."\n\n"들판이었으면 좋겠다. 쫓기는 게 아니라."\n\n보리의 꼬리가 자면서 두 번 흔들렸다. 좋은 꿈인 걸로 결론 났다. 회의는 만장일치였다.', fx:{moodAll:3, note:{type:'사건',title:'보리의 꿈',body:'잠결에 달리는 네 발. 꼬리가 두 번 흔들려서 좋은 꿈으로 만장일치 판정.'}}}]},
  {label:'담요를 덮어준다', out:[{p:1, text:'담요가 닿자 다리가 멈추고, 보리는 깊은 숨을 쉬었다.\n\n꿈속 들판에 담요가 도착한 모양이다.', fx:{moodAll:3, mood:{leo:3}}}]},
 ]},

/* ── 추적/위기 ── */
{id:'ai_streetlight', type:'추적', w:6, night:true,
 title:'켜지는 가로등',
 text:'죽은 지 3년 된 국도 가로등이— 달구지가 지나가는 순서대로 켜진다.\n\n앞이 밝아지고, 지나온 뒤는 다시 어두워진다.\n\n배웅인가, 감시인가. 아니면 둘 다인가.',
 choices:[
  {label:'불빛을 따라간다', out:[
   {p:2, text:'가로등은 십 리를 따라오다가 어느 순간 더 켜지지 않았다.\n\n마지막 가로등이 등 뒤에서 오래 깜빡였다. 손 흔드는 것처럼 보였다는 사람과, 셔터 소리 같았다는 사람으로 의견이 갈렸다.', fx:{note:{type:'사건',title:'켜지는 가로등',body:'지나가는 순서대로 켜지던 국도 가로등. 배웅설과 촬영설로 의견이 갈렸다.',links:['천리안']}}},
   {p:1, text:'불빛은 편했다. 편한 게 문제였다. 밝은 길은 잘 보이는 길이다— 저쪽에서도.', fx:{pursuit:1, note:{type:'사건',title:'밝은 길의 값',body:'가로등이 밝혀준 길. 잘 보이는 길은 저쪽에서도 잘 보인다.',links:['천리안']}}}]},
  {label:'전조등을 끄고 갓길로 우회한다', out:[{p:1, text:'어둠 속을 기어서 가로등 구간을 벗어났다. 뒤돌아보니 불 켜진 빈 도로가 무대처럼 남아 있었다.\n\n주인공 없이 켜진 무대는 좀 무서웠다.', fx:{time:25, fatigue:4}}]},
 ]},

{id:'ai_vending', type:'추적', w:6,
 title:'살아있는 자판기',
 text:'폐 정류장 옆 자판기에 불이 들어와 있다.\n\n가까이 가자 자판기가 스스로 덜컹, 캔 하나를 내놨다. 이온음료다. 유통기한도 안 지났다.\n\n화면에 글자가 떠 있다. "수고하셨습니다."',
 choices:[
  {label:'받는다', out:[{p:1, text:'캔은 시원했다. 3년 동안 누가 채워 넣고 누가 전기를 댔는지 생각하면 안 시원했다.\n\n두 캔째가 나왔을 때 다들 차로 뛰었다. 공짜가 무서운 세상이다.', fx:{water:2, pursuit:1, note:{type:'사건',title:'수고하셨습니다',body:'스스로 음료를 내놓는 자판기. 두 캔째에서 전원 도주. 공짜가 무섭다.',links:['천리안']}}}]},
  {label:'받지 않는다', out:[{p:1, text:'자판기 불빛이 멀어질 때까지 화면의 글자는 바뀌지 않았다.\n\n"수고하셨습니다."\n\n누구한테 하는 말이었을까.', fx:{}}]},
 ]},

{id:'vg_cicada', type:'정경', w:4,
 title:'매미',
 text:'창문을 열고 달리는데 소리가 밀려들어왔다.\n\n맴— 맴— 맴—\n\n온 산이 울리고 있다. 3년 전에도, 30년 전에도 나던 소리다.',
 choices:[{label:'…', out:[{p:1, text:'매미는 문명이 있는 줄도 몰랐고, 없어진 줄도 모른다.\n\n그게 이상하게 든든해서, 한참 창문을 안 닫았다.', fx:{moodAll:2}}]}]},

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

{id:'vg_traincross', type:'정경', w:3,
 title:'건널목',
 text:'녹슨 철도 건널목. 지나려는 순간—\n\n땡. 땡. 땡.\n\n차단기가 내려온다. 다들 반사적으로 철로 양쪽을 봤다. 기차는 없다. 3년째 없다.',
 choices:[{label:'…', out:[{p:1, text:'차단기는 2분을 성실하게 막고 나서 올라갔다.\n\n"방금 우리, 유령 기차 보내준 거야?"\n\n농담이었는데 아무도 안 웃었다. 대신 다들 창밖으로 빈 철로를 한 번 더 봤다.', fx:{time:2}}]}]},

{id:'vg_milestone300', type:'정경', w:3, region:['mid'],
 title:'이정표',
 text:'초록 이정표가 다가온다.\n\n「서울 300km」\n\n차 안이 잠깐 조용해졌다.',
 choices:[{label:'…', out:[{p:1, text:'100km를 왔거나, 300km가 남았거나.\n\n"반의 반의 반은 왔네." 수학은 틀렸지만 정정하는 사람은 없었다.', fx:{moodAll:1}}]}]},

{id:'vg_priceboard', type:'정경', w:3,
 title:'가격판',
 text:'폐 주유소 가격판이 아직 서 있다.\n\n휘발유 1,587. 경유 1,402.\n\n그날 아침의 물가가 화석처럼 박제돼 있다.',
 choices:[{label:'…', out:[{p:1, text:'"싸다." 누가 말했다.\n\n지금 연료 시세는 리터당 고철 반 덩이. 화폐가 바뀐 세상에서 옛날 숫자는 이상하게 애틋하다.', fx:{}}]}]},

{id:'vg_schoolbus', type:'정경', w:3,
 title:'노란 버스',
 text:'길가에 노란 유치원 버스가 서 있다. 바퀴 넷이 다 주저앉았고, 차체를 나팔꽃 덩굴이 감았다.\n\n보라색 꽃이 노란 철판 위에 만발했다.',
 choices:[{label:'…', out:[{p:1, text:'식물은 슬픈 걸 모르고 그냥 예쁘게 자란다.\n\n그게 식물의 위로 방식인지도 모른다.', fx:{moodAll:1}}]}]},

/* ── 날씨 ── */
{id:'wx_maskseller', type:'조우', w:8, needWx:'dust',
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
  {label:'조용히 지나간다', out:[{p:1, text:'방울 소리는 한참을 따라오다 어느 갈림길에서 사라졌다.\n\n안개 걷힌 세상 어딘가에 자전거 탄 사람이 하나 있을 것이다.', fx:{}}]},
 ]},

{id:'wx_underpass', type:'조우', w:8, needWx:'storm',
 title:'고가 밑의 선객들',
 text:'폭풍이 심해져 고가도로 밑으로 피했다.\n\n먼저 온 차가 두 대. 트럭 노부부와 오토바이 청년이 각자 비를 긋고 있다.\n\n노부부가 버너에 냄비를 올리며 이쪽을 본다. "라면 드슈? 어차피 물은 넉넉해."',
 choices:[
  {label:'합석한다 (식량 1 보탠다)', out:[{p:1, text:'폭우 소리를 지붕 삼아 라면 회식이 벌어졌다.\n\n노부부는 남쪽으로, 청년은 동쪽으로, 우리는 북쪽으로 간다고 했다. 아무도 왜냐고 묻지 않았다. 좋은 식사 예절이다.\n\n비가 잦아들자 각자 시동을 걸었다. "조심들 가슈." 그게 끝이었고, 그거면 충분했다.', fx:{food:-1, moodAll:5, time:50, note:{type:'사건',title:'고가 밑 라면 회식',body:'폭풍 대피소의 합석. 남쪽, 동쪽, 북쪽. 아무도 왜냐고 묻지 않았다.'}}}]},
  {label:'차에서 기다린다', out:[{p:1, text:'와이퍼를 끄고 폭우가 유리를 두드리는 걸 구경했다. 고가 밑 라면 냄새가 끝까지 고소했다.', fx:{time:40}}]},
 ]},

{id:'wx_worms', type:'조우', w:7, needRain:true, needsDog:true,
 title:'지렁이 구조단',
 text:'비 갠 틈, 휴게소 아스팔트에 지렁이 수십 마리가 올라와 있다. 해가 나면 다 마른다.\n\n보리가 코를 대고 킁킁대더니 한 마리를 조심스레 물어 화단에 놨다.\n\n…지금 저거 구조한 건가.',
 choices:[
  {label:'구조 작전에 동참한다', out:[{p:1, text:'전원이 쭈그려 앉아 지렁이를 화단으로 옮겼다. 집계 34마리. 최다 구조는 보리(9마리).\n\n"우리 지금 세상을 구했어." 과장이지만 정정하지 않았다. 34마리분의 세상은 구했으니까.', fx:{time:15, moodAll:4, note:{type:'사건',title:'지렁이 구조 작전',body:'빗길 지렁이 34마리 화단 이송. MVP는 보리(9마리).'}}}]},
  {label:'갈 길을 간다', out:[{p:1, text:'보리만 두 마리를 더 옮기고 아쉬운 얼굴로 탑승했다.\n\n백미러 속 아스팔트에 남은 지렁이들에게 다들 잠깐 미안해했다.', fx:{}}]},
 ]},

/* ── 밤 ── */
{id:'night_lanterns', type:'발견', w:5, night:true, once:true,
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
{id:'meet_southbound', type:'조우', w:9, once:true, region:['mid','north'],
 title:'남쪽으로 가는 사람들',
 text:'반대 차선에 짐수레 행렬이 지나간다. 남쪽으로. 우리와 반대 방향으로.\n\n행렬 끝의 남자가 손을 들어 우리를 세웠다.\n\n"북쪽 가쇼? …돌아가란 말은 안 하겠소. 대신 들은 건 알려주리다."',
 choices:[
  {label:'북쪽 소식을 듣는다', out:[
   {p:2, text:'"수원 위쪽은 밤마다 도로가 청소된다오. 아침이면 낙엽 하나 없이. 누가 하는지는… 알잖소."\n\n"그리고 한강 다리는 하나만 남았소. 이상하리만치 멀쩡한 게 딱 하나. 건너라고 남겨둔 것처럼."\n\n행렬이 다시 움직였다. 아이 하나가 수레 위에서 우리에게 오래 손을 흔들었다.', fx:{time:15, note:{type:'소문',title:'남하 행렬의 북쪽 소식',body:'밤마다 청소되는 도로. 하나만 남은 한강 다리 — 건너라고 남겨둔 것처럼.',links:['천리안','한강']}}},
   {p:1, text:'"서울 하늘에 빛기둥이 섰다는 사람도 있고, 아무것도 없다는 사람도 있고. 소문이란 게 그렇지."\n\n"확실한 건 하나요. 올라간 사람은 많은데, 내려온 사람은 우리가 처음이오."\n\n그 말이 차 안에 오래 남았다.', fx:{time:15, moodAll:-2, note:{type:'소문',title:'내려온 사람들',body:'"올라간 사람은 많은데 내려온 사람은 우리가 처음이오." 서울 하늘의 빛기둥 소문.',links:['천리안','남산']}}}]},
  {label:'물 한 통을 건네고 듣는다', out:[{p:1, text:'물을 받은 남자가 목소리를 낮췄다.\n\n"이건 아무한테나 안 하는 말인데— 북쪽 검문에서 이상한 걸 물어봅디다. 어디서 왔냐, 몇 명이냐가 아니라… \'무엇을 싣고 왔냐\'고."\n\n"수레를 다 뒤지곤 그냥 보내줬소. 뭘 찾는 건지."\n\n짐칸의 라면박스와 책과 고철을 다들 한 번씩 돌아봤다.', fx:{water:-1, time:15, note:{type:'소문',title:'무엇을 싣고 왔냐',body:'북쪽 검문의 질문. 사람이 아니라 짐을 본다. 뭘 찾는 걸까.',links:['천리안']}}}]},
  {label:'목례만 하고 지나친다', out:[{p:1, text:'반대 방향으로 가는 사람들과는 인사가 짧다. 서로의 선택을 존중하는 것 말고는 할 수 있는 게 없으니까.', fx:{}}]},
 ]},

{id:'exp_chalkwall', type:'탐색', w:7, once:true,
 title:'소식벽',
 text:'고가도로 기둥이 온통 분필 글씨다.\n\n「소식벽 — 지우지 마시오. 분필은 밑에.」\n\n여행자들이 남긴 뉴스가 기둥 세 개를 채웠다. 날짜 순도, 중요도 순도 아니다. 그냥 사람들이 전하고 싶었던 것들.',
 choices:[
  {label:'천천히 읽는다', out:[{p:1, text:'"구미 위 검문 서쪽으로 옮김 (지난달)" / "대전 시장에 소금 들어옴" / "흰 옷들이 노래를 부르며 북상함" / "천리안이 꿈에 나옴. 정중했음. 소름" / "미영아 아빠는 남쪽으로 간다"\n\n마지막 줄 앞에서 다들 잠깐 조용해졌다.\n\n제일 아래, 최근 글씨: "봉고차 한 대가 북쪽으로 갔다는 소문. 무사하길."\n\n…우리 얘기인가. 아니면 우리 같은 누군가.', fx:{time:20, moodAll:2, note:{type:'소문',title:'소식벽',body:'분필로 쓰는 뉴스. 서쪽으로 옮긴 검문, 북상하는 흰 옷들, 그리고 "봉고차 한 대가 북쪽으로 갔다는 소문. 무사하길."',links:['천리안','정리자들']}}}]},
  {label:'우리도 한 줄 남긴다', out:[{p:1, text:'분필을 집어 들고 잠시 고민하다가 썼다.\n\n"남쪽에서 온 봉고차. 북쪽으로 감. 다들 무사하시오."\n\n누가 밑에 보리 발바닥을 찍자고 해서, 정말 찍었다. 소식벽 최초의 서명 날인이다.', fx:{time:15, moodAll:4, flag:'chalkwall_signed', note:{type:'사건',title:'소식벽에 남긴 한 줄',body:'"남쪽에서 온 봉고차. 북쪽으로 감. 다들 무사하시오." 보리 발바닥 도장 포함.'}}}]},
 ]},

{id:'vg_northglow', type:'정경', w:4, night:true, region:['south','mid'],
 title:'북쪽의 빛',
 text:'밤. 능선 너머 북쪽 하늘이 희미하게 밝다.\n\n노을은 아니다. 노을은 서쪽이고, 지금은 밤이다.\n\n도시의 불빛도 아니다. 도시는 죽었다.',
 choices:[{label:'…', out:[{p:1, text:'"저기가 서울인가."\n\n누가 물었고 아무도 대답하지 않았다. 대답 대신 다들 그 빛을 조금 오래 봤다.\n\n우리는 저 빛을 향해 가고 있다.', fx:{}}]}]},

/* ═══════════ v1.4 대확장 ═══════════ */

/* ── 체인: 두리 서커스 (3) ── */
{id:'circus_meet', type:'조우', w:9, once:true,
 title:'길 위의 서커스',
 text:'국도변 공터에 색 바랜 줄무늬 천막이 서 있다. 손글씨 현수막.\n\n「두리 서커스 — 오늘 저녁 공연. 입장료: 고철 2, 아이는 웃음 한 번」\n\n천막 앞에서 남매로 보이는 둘이 저글링 연습 중이고, 백발 노인이 낡은 나팔을 닦고 있다.\n\n"손님이오!" 소녀가 핀 세 개를 공중에 띄운 채 소리쳤다.',
 choices:[
  {label:'공연을 본다 (고철 2)', req:{scrap:2}, out:[{p:1, text:'관객은 우리뿐이었다. 그런데도 3인은 만석 공연처럼 뛰었다.\n\n소년의 외줄, 소녀의 저글링(핀 다섯 개, 하나는 프라이팬), 단장의 나팔 반주. 마지막엔 보리까지 무대에 초대돼 하이파이브 곡예(?)를 선보였다.\n\n"세상이 이래도 서커스는 남아야 해." 단장이 모자를 벗어 인사했다. "웃음은 배급이 안 되거든."', fx:{scrap:-2, time:80, moodAll:7, flag:'circus_met', note:{type:'인물',title:'두리 서커스',body:'남매 곡예사와 나팔 부는 단장. 입장료 고철 2, 아이는 웃음 한 번. "웃음은 배급이 안 되거든."'}}}]},
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
 text:'자전거 방울 소리. 그 우편부다.\n\n"어! 차!" 우편부가 급브레이크를 잡았다. 짐받이의 꾸러미가 눈에 띄게 얇아졌다.\n\n"명단이 줄었소. 삼 년 치가 두 통 남았는데— 하나가 문제요. 수신인이 남산 쪽이란 말이지. 거긴 자전거로는…"\n\n우편부가 우리를 본다. 차를 본다. 다시 우리를 본다.',
 choices:[
  {label:'편지를 맡는다', out:[{p:1, text:'"이러면 안 되는데. 배달은 끝까지 하는 게 원칙인데."\n\n말은 그렇게 하면서 우편부는 편지를 세 겹 방수포에 싸서 건넸다. 받는 이: 서울, 남산 아래, 김 O O.\n\n"전하면— 아니, 전할 수 있으면, 그걸로 됐다고 해주시오. 삼 년 걸렸다고는 말고."\n\n조수석 서랍 제일 안쪽에 편지가 실렸다. 차가 조금 무거워진 기분이 들었다. 좋은 무거움이다.', fx:{item:{'남산행 편지':1}, flag:'postman_letter', moodAll:3, note:{type:'소문',title:'남산행 편지',body:'우편부의 마지막에서 두 번째 편지. 수신인은 남산 아래 김OO. "삼 년 걸렸다고는 말고."',links:['남산']}}}]},
  {label:'"원칙대로 하시오"', out:[{p:1, text:'"…그렇지. 배달은 끝까지." 우편부가 오히려 후련한 얼굴로 페달을 밟았다.\n\n"남산에서 봅시다!" 방울 소리가 북쪽으로 멀어졌다.\n\n자전거로 남산까지. 저 사람은 정말 갈 것이다. 그게 이상하게 든든했다.', fx:{moodAll:2, note:{type:'인물',title:'끝까지 가는 우편부',body:'배달은 끝까지가 원칙. 자전거로 남산까지. 정말 갈 사람.'}}}]},
 ]},

/* ── 체인: 씨앗 반납 (2) ── */
{id:'seed_harvest', type:'탐색', w:10, once:true, needFlag:'seed_borrowed',
 title:'빌린 씨앗',
 text:'정차한 김에 씨앗 봉투를 열었다. 흙 좋은 밭 한 뙈기가 마침 눈앞에 있다. 주인 없는 밭은 아니다— 주인이 없어진 밭이다.\n\n"수확하면 두 배로 반납이에요." 그 목소리가 생각났다.',
 choices:[
  {label:'심고 간다', out:[{p:1, text:'고랑을 내고 씨앗 반을 심었다. 어차피 우리는 못 거둔다. 북쪽으로 가니까.\n\n대신 팻말을 세웠다. "상추. 아무나 드세요. 씨는 받아서 남쪽 씨앗 도서관에."\n\n씨앗 도서관의 대출 시스템이 우리를 지나쳐 무한히 뻗어가는 순간이었다.', fx:{time:40, moodAll:4, flag:'seed_grown', note:{type:'사건',title:'지나가는 농사',body:'못 거둘 밭에 씨를 심고 팻말을 세웠다. 대출은 이렇게 연장된다.'}}}]},
  {label:'지붕 텃밭에 심는다', req:{flag:'seed_borrowed'}, out:[{p:1, text:'달구지 지붕 텃밭 구석에 상추 씨를 심었다. 달리는 밭 입주 완료.\n\n"이제 우리 차 주소가 생겼네. 상추 사는 집."\n\n물 줄 사람이 다섯이나 되는 상추는 세상에 흔치 않다. 과보호가 예상된다.', fx:{time:15, moodAll:3, flag:'seed_grown', note:{type:'사건',title:'달리는 상추',body:'지붕 텃밭에 입주한 상추. 물 줄 사람 다섯. 과보호 예상.'}}}]},
 ]},

{id:'seed_return', type:'조우', w:11, once:true, needFlag:'seed_grown',
 title:'반납',
 text:'낯익은 경운기 수레— 씨앗 도서관이다. 유리병들이 챙, 챙, 부딪히는 소리까지 그대로다.\n\n"어머, 그 차!" 아주머니가 우리를 기억했다. "상추는요?"',
 choices:[
  {label:'수확분과 씨앗을 반납한다', out:[{p:1, text:'지붕에서 키운 상추와 받아둔 씨앗을 두 배로 세어 반납했다. 아주머니가 장부(공책이다)에 적었다.\n\n"연체 없이 반납. 우량 회원." 도장까지 찍어줬다. 감자 도장이다.\n\n"다음 권도 빌려가요." 이번엔 해바라기 씨를 받았다. 도서관의 신간이라고 했다.', fx:{food:-1, moodAll:5, flag:'seed_returned', note:{type:'사건',title:'우량 회원',body:'두 배 반납 완료, 감자 도장 획득. 신간(해바라기)도 대출.',links:['씨앗 도서관']}}}]},
  {label:'심고 온 밭 이야기를 한다', out:[{p:1, text:'주인 없는 밭에 심고 팻말을 세웠다고 하자, 아주머니가 잠깐 말을 잃었다.\n\n"…그건 반납이 아니라 기증이네. 그것도 큰 걸로."\n\n장부에 뭐라 길게 적더니 도장을 두 번 찍었다. "특별 회원. 평생 연체료 면제."', fx:{moodAll:5, flag:'seed_returned', note:{type:'사건',title:'특별 회원',body:'지나가는 농사가 기증으로 인정됨. 평생 연체료 면제(감자 도장 2회).',links:['씨앗 도서관']}}}]},
 ]},

/* ── 사진사 후속 (1) ── */
{id:'photo_delivered', type:'조우', w:9, once:true, needFlag:'photo_film', region:['mid','north'],
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

{id:'wall_reply', type:'발견', w:8, once:true, needFlag:'chalkwall_signed',
 title:'답장',
 text:'또 다른 고가 기둥. 또 분필 글씨. 여기도 소식벽이다.\n\n습관처럼 훑어 내려가는데—\n\n한 줄에서 눈이 멈췄다.\n\n"남쪽에서 온 봉고차, 우리가 봤소. 개도 잘 있습디다. 무사하오. — 남하 행렬"',
 choices:[
  {label:'한참 서 있는다', out:[{p:1, text:'우리가 남긴 한 줄이 소식벽을 타고 우리보다 먼저 북상해서, 답장까지 받아놓고 기다리고 있었다.\n\n분필을 집었다. "잘 받았소. 남쪽 길 무사하시오. — 봉고차 (개도 잘 있음)"\n\n보리 발바닥 도장, 2호.', fx:{moodAll:6, note:{type:'사건',title:'소식벽 답장',body:'"우리가 봤소. 무사하오. — 남하 행렬" 분필 편지가 우리보다 빨랐다. 발바닥 도장 2호 날인.',links:['소식벽']}}}]},
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
 text:'승강장에 빨간 곤돌라 한 대가 문을 연 채 정지해 있다. 3년째 탑승 중인 승객은 없다.\n\n케이블은 능선 위로 뻗어 있고, 중간쯤에 곤돌라 한 대가 더— 공중에 매달린 채 멈춰 있다.\n\n승강장 계단으로 걸어 오르면 전망대다. 다리가 후들거릴 높이.',
 choices:[
  {label:'전망대까지 오른다', out:[{p:1, text:'40분을 걸어 올랐다. 그리고—\n\n남쪽이 전부 보였다.\n\n우리가 지나온 길. 강. 고개. 저 멀리 아지랑이처럼 흐린 도시들. 누가 먼저랄 것도 없이 지나온 지명들을 하나씩 짚기 시작했다. "저기가 대구." "저 강이 낙동강." "저기서 라면 먹었잖아."\n\n올라온 길을 전부 눈에 담고 나서야, 내려갈 힘이 났다.', fx:{time:90, fatigue:-12, moodAll:8, note:{type:'장소',title:'멈춘 케이블카 전망대',body:'남쪽이 전부 보이는 곳. 지나온 지명을 하나씩 짚었다. 지도가 아니라 기억으로.',links:['멈춘 케이블카']}}}]},
  {label:'곤돌라 안을 살핀다', out:[{p:1, text:'곤돌라 좌석에 도시락 가방이 놓여 있다. 소풍 가던 누군가의 것.\n\n보온병(비었음), 귤껍질(화석화), 그리고 창문에 입김으로 썼다 마른 흔적— 하트 하나.\n\n도시락 가방은 그대로 두고, 문만 살며시 닫아줬다. 하트가 흐려지지 않게.', fx:{time:20, moodAll:2, note:{type:'사건',title:'곤돌라의 하트',body:'3년 전 소풍의 흔적. 문을 닫아 하트를 지켜줬다.'}}}]},
 ]},

/* ── 히든: 시대극 세트장 ── */
{id:'find_filmset', type:'발견', w:7, once:true, region:['mid'], hiddenTarget:'filmset',
 title:'벽에 붙은 포스터',
 text:'버스정류장 벽에 사극 포스터가 붙어 있다. 3년 넘게 비를 맞았는데 장군의 눈매만은 살아 있다.\n\n「대하사극 — 촬영지: 남원 오픈세트장」\n\n포스터 귀퉁이에 누가 볼펜으로 화살표를 그리고 적어놨다.\n\n"세트장 사람 살고 있음. 기와 밑 따뜻함."',
 choices:[
  {label:'화살표를 믿는다', out:[{p:1, text:'"기와 밑 따뜻함"이라는 다섯 글자엔 거짓말이 섞일 자리가 없다.\n\n지도에 표시했다.', fx:{reveal:'filmset', note:{type:'소문',title:'세트장 사람 살고 있음',body:'포스터 귀퉁이의 볼펜 글씨. 기와 밑 따뜻함.',links:['시대극 세트장']}}}]},
 ]},

{id:'loc_filmset', type:'탐색', w:0, locEvent:'filmset', once:true,
 title:'가짜 마을의 진짜 저녁',
 text:'기와집 수십 채가 고스란하다. 사극 세트장— 절반은 합판이지만 지붕은 진짜 기와다.\n\n마당을 쓸던 노인이 빗자루를 세웠다. 세트장 관리인이었다고 한다. 촬영팀이 안 돌아온 지 3년째, 혼자 마을을 쓸고 있다.\n\n"여긴 원래 가짜 마을이었는데." 노인이 마을을 둘러봤다. "이제 남은 것 중엔 제일 진짜 같지."',
 choices:[
  {label:'하룻밤 신세를 진다', out:[{p:1, text:'대감집 세트(안방은 진짜 온돌이다)에서 잤다. 노인이 아궁이에 불을 넣어줬다.\n\n저녁상엔 노인이 담근 장아찌와 우리 식량이 합쳐졌다. 노인은 촬영 시절 이야기를 세 시간 했다. 어느 배우가 낙마했고, 어느 감독이 기와를 진짜로 고집했고.\n\n"기와를 진짜로 한 덕에 내가 산다." 노인이 웃었다. "가짜도 정성 들이면 사람을 살려."', fx:{time:600, fatigue:-30, food:-1, moodAll:6, note:{type:'인물',title:'세트장 관리인',body:'가짜 마을을 3년째 쓸고 있는 사람. "가짜도 정성 들이면 사람을 살려."',links:['시대극 세트장']}}}]},
  {label:'마을 청소를 돕고 간다', out:[{p:1, text:'다섯 명이 빗자루를 드니 마을 절반이 한나절에 끝났다. 노인은 "십 년 만에 조기 퇴근"이라며 곳간(소품실)에서 말린 나물을 한 아름 내줬다.\n\n소품실 곳간엔 진짜 곡식이 있었다. "소품도 진짜로 한 덕에 내가 산다."', fx:{time:240, fatigue:10, food:3, moodAll:4, note:{type:'장소',title:'시대극 세트장',body:'절반 합판, 지붕은 진짜. 소품 곳간엔 진짜 곡식. 정성은 가짜를 진짜로 만든다.'}}}]},
 ]},

/* ── 탐색 (6) ── */
{id:'exp_radiostation', type:'탐색', w:7, region:['mid','north'],
 title:'지역 방송국',
 text:'낮은 언덕 위 지역 방송국. 송신탑은 꺾였지만 건물은 멀쩡하다.\n\n스튜디오 문에 「ON AIR」 등이 있다. 꺼져 있다. 3년째 꺼져 있었을 것이다.',
 choices:[
  {label:'스튜디오를 뒤진다', out:[
   {p:2, text:'조정실에서 진공관 예비품 상자를 찾았다. 방송 장비의 심장들이다.\n\n나오는 길에 누가 「ON AIR」 등을 손으로 톡 쳤다. 불은 안 들어왔지만, 왠지 인사는 한 셈이다.', fx:{item:{'라디오 진공관':1}, scrap:4, note:{type:'사건',title:'지역 방송국',body:'조정실에서 진공관 예비품 확보. ON AIR 등에 인사.'}}},
   {p:1, text:'스튜디오 책상에 대본이 펼쳐져 있다. 그날 저녁 뉴스 원고.\n\n첫 줄: "시청자 여러분, 오늘 하루도 수고 많으셨습니다."\n\n끝내 전파를 못 탄 인사를, 우리가 대신 받았다.', fx:{moodAll:2, note:{type:'사건',title:'전파를 못 탄 인사',body:'그날 저녁 뉴스 첫 줄. "오늘 하루도 수고 많으셨습니다." 3년 늦게 수신 완료.'}}}]},
  {label:'겉만 보고 간다', out:[{p:1, text:'꺾인 송신탑이 언덕에 길게 그림자를 눕히고 있었다. 부러진 안테나도 그림자는 온전하다.', fx:{}}]},
 ]},

{id:'exp_icehouse', type:'탐색', w:6, region:['south','mid'],
 title:'제빙 공장',
 text:'수산시장 옆 제빙 공장. 전기가 끊긴 지 3년— 얼음은 당연히 없다.\n\n하지만 단열 창고는 남았다. 문이 두 뼘은 되게 두껍다.',
 choices:[
  {label:'창고를 연다', out:[
   {p:2, text:'단열 덕에 창고 안은 서늘했다. 그리고 먼저 다녀간 누군가가 이곳을 저장고로 썼다— 소금에 절인 생선과 장아찌 단지가 선반에 가지런하다.\n\n단지 하나에 쪽지. "필요한 만큼만. 다음 사람 몫도."\n\n필요한 만큼만 덜었다.', fx:{food:3, moodAll:2, note:{type:'사건',title:'식은 창고의 약속',body:'"필요한 만큼만. 다음 사람 몫도." 제빙 공장 단열창고의 공용 저장고.'}}},
   {p:1, text:'창고는 비어 있었다. 대신 벽에 온도계가 걸려 있다. 12도. 전기 없이 3년을 버틴 서늘함.\n\n"여기서 낮잠 자면 끝내주겠다." 실제로 20분 잤다. 끝내줬다.', fx:{time:30, fatigue:-8, moodAll:2}}]},
  {label:'지나친다', out:[{p:1, text:'얼음 없는 제빙 공장은 이 세상의 요약본 같았다. 이름만 남고 기능은 떠난.', fx:{}}]},
 ]},

{id:'exp_observatory', type:'탐색', w:6, night:true, region:['mid'],
 title:'시민 천문대',
 text:'산 중턱의 작은 시민 천문대. 돔이 반쯤 열린 채 멈춰 있다.\n\n망원경은— 살아 있다. 전기가 아니라 손으로 돌리는 구식 적도의다.',
 choices:[
  {label:'망원경을 돌린다', out:[{p:1, text:'토성을 봤다.\n\n고리까지 선명했다. 접안렌즈에 눈을 댄 사람마다 짧게 숨을 삼켰고, 순서는 두 바퀴를 돌았다. 보리도 렌즈에 코를 댔다(관측 결과: 코 자국).\n\n문명이 꺼져도 토성은 고리를 하고 있다. 그게 이상하게 위로가 됐다.', fx:{time:60, moodAll:6, note:{type:'사건',title:'토성의 고리',body:'수동 망원경으로 본 토성. 순서 두 바퀴. 보리 관측 기록: 코 자국.'}}}]},
  {label:'별지도만 챙긴다', out:[{p:1, text:'전시실의 회전 별지도를 챙겼다. 계절별 별자리가 다이얼로 돌아간다.\n\n전기도 연료도 안 드는 내비게이션이다. 밤하늘 한정.', fx:{moodAll:2, note:{type:'사건',title:'회전 별지도',body:'천문대에서 챙긴 아날로그 별지도. 밤하늘 한정 내비게이션.'}}}]},
 ]},

{id:'exp_printshop', type:'탐색', w:6,
 title:'인쇄소',
 text:'골목 인쇄소. 기름 냄새가 아직 배어 있다.\n\n활판 인쇄기— 전기 없이도 손으로 돌리는 옛날 기계가 한 대. 활자 서랍장엔 납활자가 가나다순으로 잠들어 있다.',
 choices:[
  {label:'한 장 찍어본다', out:[{p:1, text:'활자를 골라 판을 짰다. 오래 걸렸다. 한 글자씩 거꾸로 심어야 해서.\n\n"서울까지 400km"\n\n롤러에 잉크를 먹이고 손잡이를 내렸다. 철컹. 세상에서 제일 느린 인쇄로 뽑은 한 장이 조수석에 붙었다.\n\n활자 몇 개는 기념으로 챙겼다. 납이라 고철로도 값이 나간다는 건 비밀이다.', fx:{time:70, moodAll:5, scrap:3, note:{type:'사건',title:'활판 한 장',body:'납활자로 찍은 "서울까지 400km". 세상에서 제일 느린 인쇄.'}}}]},
  {label:'종이만 챙긴다', out:[{p:1, text:'인쇄용지 반 연(연習용으로 최고다)과 잉크 한 통을 챙겼다. 일지가 두꺼워질 예정.', fx:{scrap:2, moodAll:1}}]},
 ]},

{id:'exp_pool', type:'탐색', w:6, needRain:true,
 title:'실내 수영장',
 text:'천장 유리가 깨진 실내 수영장. 3년치 빗물이 풀을 다시 채웠다.\n\n지금도 비가 온다. 깨진 천장으로 빗줄기가 수면을 두드리고, 수영장 특유의 그 울림— 첨벙 소리의 메아리가 빈 관중석을 돈다.',
 choices:[
  {label:'수영한다', out:[{p:1, text:'"이건 빗물이니까 목욕이 아니라 수영이다"라는 억지 논리에 전원이 넘어갔다.\n\n30분간 물장구, 잠수 대결(1위: 강우가 있다면 강우, 없다면 의외로 박 선생), 그리고 보리의 개헤엄 시범.\n\n젖은 채로 떨면서 나왔는데 이상하게 개운했다. 피로가 물에 녹은 모양이다.', fx:{time:50, fatigue:-15, moodAll:6, water:1, note:{type:'사건',title:'빗물 수영장',body:'3년치 빗물 풀에서 수영. 잠수 대결과 보리 개헤엄 시범. 피로가 물에 녹았다.'}}}]},
  {label:'물만 뜬다', out:[{p:1, text:'빗물치고는 맑다. 끓이면 충분하다. 물통을 채웠다.\n\n수면에 비 떨어지는 소리를 배경음악 삼아, 잠깐 관중석에 앉아 있다 나왔다.', fx:{water:3, time:15}}]},
 ]},

/* ── 조우 (5) ── */
{id:'meet_tinker', type:'조우', w:7,
 title:'땜장이',
 text:'"냄비 때워요— 우산 고쳐요— 칼 갈아요—"\n\n확성기도 없이 육성으로 외치며 걷는 남자. 등에 진 나무 궤짝에서 연장이 짤그랑거린다.\n\n3년 전에도 사라져가던 직업이, 3년 후에 제일 필요한 직업이 됐다.',
 choices:[
  {label:'냄비와 칼을 맡긴다 (고철 3)', req:{scrap:3}, out:[{p:1, text:'궤짝이 노점으로 변신하는 데 1분. 냄비 구멍 둘을 때우고 칼 세 자루를 갈았다.\n\n"살림 오래 쓰는 게 애국이에요, 요즘은." 땜장이의 손은 눈보다 빨랐다.\n\n돌아온 칼로 저녁 준비 시간이 절반이 됐다. 잘 드는 칼은 문명이다.', fx:{scrap:-3, moodAll:3, van:2, note:{type:'인물',title:'땜장이',body:'등짐 궤짝 하나로 냄비·우산·칼을 살리는 사람. 살림 오래 쓰는 게 애국.'}}}]},
  {label:'외침만 듣고 간다', out:[{p:1, text:'"냄비 때워요—" 소리가 한참을 따라왔다.\n\n다음에 구멍 나는 게 있으면 저 목소리부터 생각날 것이다. 그게 장사다.', fx:{}}]},
 ]},

{id:'meet_runner', type:'조우', w:6, once:true,
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
  {label:'구경만 한다', out:[{p:1, text:'"안 사도 향은 공짜." 노파가 양동이를 우리 쪽으로 슬쩍 밀었다.\n\n다섯 명이 코를 박고 향만 실컷 맡고 갔다. 염치는 고철 반 덩이쯤 두고 왔다.', fx:{moodAll:2}}]},
 ]},

{id:'meet_stargazer', type:'조우', w:6, night:true, once:true,
 title:'망원경 든 사람',
 text:'언덕 위에 삼각대와 망원경. 옆에 앉은 사람이 보온병을 홀짝이고 있다.\n\n"불빛 좀 꺼주시겠어요?" 그가 정중하게 부탁했다. "3년 만에 하늘이 제일 좋은 시대라서요."\n\n전조등을 끄자— 정말이었다. 은하수가 강처럼 흘렀다.',
 choices:[
  {label:'옆에 앉는다', out:[{p:1, text:'그는 아마추어 천문가였다. 도시 불빛이 사라진 뒤로 전국의 하늘을 순례 중이라고 했다.\n\n"빛공해 지도라는 게 있었어요. 전국이 새빨갰죠. 지금은 전부 검정. 관측자한텐 황금기예요."\n\n"…대가가 너무 컸네요."\n\n"네. 그래서 매일 봐요. 대가만큼은 봐야죠."\n\n망원경으로 안드로메다를 봤다. 250만 년 전의 빛이라고 했다. 그 빛이 출발할 땐 지구에 인류도 없었다. 그런 걸 보고 나면 3년쯤은, 아주 잠깐 같아진다.', fx:{time:60, moodAll:5, note:{type:'인물',title:'하늘 순례자',body:'전국의 검은 하늘을 도는 아마추어 천문가. "대가만큼은 봐야죠." 안드로메다 250만 년.'}}}]},
  {label:'불만 꺼주고 간다', out:[{p:1, text:'전조등을 끄고 서행으로 언덕을 지났다. 백미러 속 실루엣이 손을 들어 보였다.\n\n한동안 다들 전조등 불빛이 조금 미안했다.', fx:{moodAll:1}}]},
 ]},

/* ── 위기 (2) ── */
{id:'crisis_rockfall', type:'위기', w:5, region:['mid','north'],
 title:'낙석',
 text:'쿠구궁—\n\n앞쪽 비탈에서 바위가 쏟아졌다. 급브레이크. 도로 절반이 돌무더기에 덮였다.\n\n차는 무사하다. 길은 무사하지 않다.',
 choices:[
  {label:'돌을 치운다', out:[
   {p:2, text:'전원이 내려 두 시간을 굴렸다. 마지막 바위는 다섯 명이 붙어 지렛대까지 동원했다.\n\n길이 뚫리자 누가 바위 무더기에 돌 하나를 얹었다. "서낭당. 다음 차는 무사하라고."', fx:{time:120, fatigue:14, moodAll:2, note:{type:'사건',title:'낙석 서낭당',body:'두 시간의 돌 굴리기. 마지막에 돌 하나를 얹었다. 다음 차는 무사하라고.'}}},
   {p:1, text:'치우다 보니 비탈이 또 우르릉거렸다. 전속력으로 물러났고, 2차 낙석이 방금 치운 자리를 도로 덮었다.\n\n"…돌아가자." 자연이 이기는 날도 있다.', fx:{time:60, fatigue:8, fuel:-3, moodAll:-2}}]},
  {label:'갓길 틈으로 조심히 통과한다', out:[
   {p:2, text:'사이드미러를 접고 바위와 벼랑 사이 한 뼘 틈을 기었다. 전원 숨 참기 30초.\n\n통과. 미러를 펴는 손이 떨렸다.', fx:{time:15, fatigue:4}},
   {p:1, text:'긁혔다. 옆구리가 바위에 쓸리며 소름 돋는 소리를 냈다.\n\n통과는 했다. 도색과 맞바꿨다.', fx:{van:-6, time:15, moodAll:-2}}]},
 ]},

{id:'crisis_hose', type:'위기', w:5,
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
 text:'죽은 지 3년 된 도로 전광판에 불이 들어와 있다.\n\n「현재 속도 46km/h — 안전한 속도입니다」\n\n우리 속도다. 정확하다.\n\n지나치자 등 뒤에서 전광판이 한 번 더 바뀌는 게 백미러에 비쳤다.\n\n「오늘도 안전 운행 감사합니다」',
 choices:[
  {label:'속도를 유지한다', out:[{p:1, text:'"…고맙긴 한데." 누가 중얼거렸다. "누구한테 고마워해야 하지?"\n\n아무도 답하지 않았다. 전광판은 계속 뒤에서 작아졌고, 우리는 정확히 46km/h를 유지했다. 왠지 그래야 할 것 같아서.', fx:{note:{type:'사건',title:'안전 운행 감사합니다',body:'3년 만에 켜진 전광판이 우리 속도를 재고 인사했다. 46km/h 유지 중.',links:['천리안']}}}]},
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
  {label:'명명식을 거행한다', out:[{p:1, text:'핸들=키다리, 기어봉=막내, 백미러 좌=참새, 우=까치, 와이퍼 한 쌍=흥부놀부, 경적=고함씨.\n\n엔진은 만장일치로 "할아버지"가 됐다. 아무도 이유를 설명하지 않았고, 설명할 필요도 없었다.\n\n이후로 정비할 때마다 "할아버지 오늘 컨디션 어때?"가 공식 문진이 됐다.', fx:{time:30, moodAll:5, note:{type:'사건',title:'달구지 명명식',body:'핸들=키다리, 경적=고함씨, 엔진=할아버지(만장일치, 이유 불문).'}}}]},
 ]},

{id:'comp_cookoff', type:'동행', w:6, minParty:2,
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
 text:'전깃줄에 방패연 하나가 걸려 있다. 꼬리가 바람에 풀럭인다.\n\n3년을 걸려 있었을 텐데, 창호지가 아직 팽팽하다. 누가 연을 잘 만들었다.',
 choices:[{label:'…', out:[{p:1, text:'"저 연 주인, 얼레 잡고 한참 서 있었겠다."\n\n끊어진 연은 슬픈데, 걸린 연은 이상하게 씩씩하다. 아직 하늘에 있으니까.', fx:{moodAll:1}}]}]},

{id:'vg_pinwheel', type:'정경', w:3, region:['mid','south'],
 title:'바람개비 밭',
 text:'밭두렁을 따라 바람개비 수십 개가 꽂혀 있다. 페트병을 오려 만든 것들이다.\n\n일제히 돌고 있다. 새 쫓는 용도였겠지만, 지금은 그냥— 바람의 악단이다.',
 choices:[{label:'…', out:[{p:1, text:'드르륵 드르륵 도는 소리가 창문 너머로 지나갔다.\n\n밭 주인은 없어도 바람개비는 성실하다. 바람이 있는 한 무급으로 영원히.', fx:{moodAll:2}}]}]},

{id:'vg_moonriver', type:'정경', w:3, night:true,
 title:'달의 강',
 text:'강변도로. 보름달이 수면에 길게 부서진다.\n\n달빛이 강을 따라 은박지처럼 구겨지며 우리와 나란히 달린다.',
 choices:[{label:'…', out:[{p:1, text:'"달이 따라와."\n\n어릴 때 다들 한 번씩 했던 말을, 어른 몇이 진지하게 다시 했다. 달은 부정하지 않고 계속 따라왔다.', fx:{moodAll:2}}]}]},

{id:'vg_orchard', type:'정경', w:3, region:['south','mid'],
 title:'주인 없는 과수원',
 text:'사과 과수원이 도로까지 가지를 뻗었다. 전정 안 한 나무들이 제멋대로— 그러나 힘차게 자랐다.\n\n가지마다 사과가 빨갛다. 작지만 많다.',
 choices:[{label:'…', out:[{p:1, text:'손 뻗으면 닿는 가지에서 몇 알만 땄다. 나무는 눈치채지도 못할 양.\n\n한 입 베어 물자 셋이 동시에 말했다. "셔!" 야생으로 돌아가는 중인 맛이었다. 그래도 다 먹었다.', fx:{food:1, moodAll:2}}]}]},

/* ═══════════ v1.5 시나리오 체인 ═══════════ */

/* ── 체인: 정류장의 삼남매 (3) ── */
{id:'kids_meet', type:'조우', w:9, once:true, region:['south','mid'],
 title:'폐정류장의 세 아이',
 text:'폐버스 정류장 지붕 아래 아이 셋이 앉아 있다. 큰애가 열둘쯤, 막내는 대여섯.\n\n큰애가 막내를 무릎에 앉히고 둘째와 등을 맞댔다. 어른을 보는 눈이 반가움 반, 경계 반이다.\n\n"저희 안 데려가셔도 돼요." 큰애가 먼저 선을 그었다. "물어보실까 봐요."',
 choices:[
  {label:'라면부터 끓인다', out:[{p:1, text:'질문 대신 버너를 꺼냈다. 물이 끓는 소리에 막내가 제일 먼저 무너졌고, 둘째가 다음, 큰애는 두 그릇째에야 경계를 풀었다.\n\n남쪽 보육원에서 나왔다고 했다. 어른들이 좋은 사람들이었는데, 식량이 줄자 큰 애들부터 자원해서 나온 거라고. 자원이라는 단어를 쓰는 열두 살의 얼굴을, 아무도 똑바로 보지 못했다.\n\n"제일 가까운 정착지가 어디예요?" 큰애가 물었다. 계획이 있는 눈이었다.', fx:{food:-2, time:50, moodAll:2, flag:'kids_met', note:{type:'인물',title:'정류장의 삼남매',body:'보육원에서 자원해서 나온 아이들. 열두 살의 계획이 있는 눈.',links:['정류장의 삼남매']}}}]},
  {label:'식량만 내려놓고 간다', out:[{p:1, text:'통조림 몇 개를 정류장 벤치에 놓았다. 큰애가 꾸벅 인사했다.\n\n"감사합니다. …저희 괜찮아요."\n\n괜찮다는 말이 백미러에서 사라질 때까지 아무도 입을 열지 않았다.', fx:{food:-2, moodAll:-2, flag:'kids_met'}}]},
 ]},

{id:'kids_escort', type:'조우', w:13, once:true, needFlag:'kids_met',
 title:'세 사람의 승차',
 text:'그 삼남매다. 국도를 걷고 있다. 막내가 큰애 등에 업혀 잔다.\n\n정착지까지 걸어서 이틀 거리. 아이 걸음으론 나흘.\n\n큰애가 차를 알아보고— 이번엔 경계 없이, 대신 아주 어른스러운 얼굴로 물었다.\n\n"혹시 정착지 방향이면, 태워주실 수 있어요? 삯은… 막내가 노래를 해요."',
 choices:[
  {label:'태운다 (삯은 노래로)', out:[{p:1, text:'막내의 노래는 음정이 다 틀렸고 최고였다. 2절부터는 전원이 따라 불렀다.\n\n가장 가까운 정착지에 아이들을 내렸다. 시장 어귀 국밥집 주인이 아이들을 훑어보더니 "설거지 손 셋 필요했는데"라며 뒷문을 열었다. 어른의 방식으로 재빠르게, 아이들의 자존심이 다치지 않게.\n\n헤어질 때 큰애가 처음으로 열두 살짜리 얼굴로 울었다. "은혜 갚을게요. 꼭."', fx:{time:60, moodAll:6, flag:'kids_settled', note:{type:'사건',title:'삯은 노래로',body:'삼남매를 정착지에 데려다줬다. 국밥집 뒷문이 열렸다. "은혜 갚을게요. 꼭."',links:['정류장의 삼남매']}}}]},
 ]},

{id:'kids_letter', type:'조우', w:10, once:true, needFlag:'kids_settled', region:['mid','north'],
 title:'그림 편지',
 text:'정착지에서 배달꾼이 우리를 찾아왔다.\n\n"봉고차에 개 있는 분들? 남쪽에서 애들이 이걸 부쳤는데— 주소가 \'북쪽으로 간 차\'이라서 애먹었소."\n\n종이를 펼치니 크레용 그림이다.',
 choices:[
  {label:'펼친다', out:[{p:1, text:'국밥집, 앞치마를 입은 세 아이, 김이 모락모락 나는 솥. 구석엔 우리 차와 보리(다리가 다섯 개다. 열정적으로 그려서).\n\n뒷면에 큰애의 글씨. "설거지 반장 됐어요. 막내는 국밥집 마스코트예요. 둘째는 주판을 배워요. 은혜는 갚는 중이에요— 여기 오는 여행자들한테 물을 공짜로 줘요. 그게 갚는 거래요, 주인 아줌마가."\n\n그림은 대시보드에 붙었다. 사진 옆에. 자리가 좁아지는 게 하나도 아깝지 않았다.', fx:{moodAll:8, note:{type:'사건',title:'다리 다섯 개 보리',body:'삼남매의 그림 편지. 은혜는 여행자들에게 물을 공짜로 주는 방식으로 갚는 중.',links:['정류장의 삼남매']}}}]},
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
  {label:'같이 씨름한다', out:[{p:1, text:'철판을 열고 다 같이 들여다봤다. 한 시간의 씨름 끝에 어찌어찌 시동이 걸렸다. 뭘 고친 건지는 아무도 모른다. 할머니 말로는 "관심을 줘서 그래."\n\n고추장 두 사발째를 받았다. 이 속도면 서울 도착 전에 장독을 통째로 받게 생겼다.', fx:{time:60, fatigue:6, food:2, moodAll:3, flag:'granny_helped'}}]},
 ]},

{id:'granny_arrive', type:'조우', w:12, once:true, needFlag:'granny_helped', nearNode:['suwon','pyeongtaek'],
 title:'도착한 사람',
 text:'수원 성곽 어귀, 낯익은 경운기가 세워져 있다. 짐칸이 비었다.\n\n시장통에서 그 할머니가— 앞치마를 두르고 국수를 말고 있다. 옆에서 청년 하나가 서툰 손으로 고명을 얹는 중이다.\n\n"왔는가!" 할머니가 국자를 든 채 환하게 웃었다. "내 손주야. 인사해라, 이 젊은이들이 네 할미 은인이다."',
 choices:[
  {label:'국수를 받는다', out:[{p:1, text:'국수 다섯 그릇이 삽시간에 나왔다. 고명이 삐뚤어진 건 손주 담당이라 그렇다.\n\n"여기서 국수집 한다. 손주랑." 할머니가 성곽 쪽을 턱으로 가리켰다. "영감 경운기는 배달차 됐고.\n\n북쪽 간다 했지? 가서 볼일 보고— 내려올 때 들러. 국수는 내려오는 사람이 더 맛있게 먹는 법이야."\n\n내려올 때. 그 말을 우리는 오래 아껴 먹었다. 국수보다 오래.', fx:{food:2, moodAll:8, flag:'granny_done', note:{type:'사건',title:'내려올 때 들러',body:'할머니의 국수집 개업. 경운기는 배달차로 승진. "국수는 내려오는 사람이 더 맛있게 먹는 법이야."',links:['경운기 할머니','수원 성곽 공동체']}}}]},
 ]},

/* ── 체인: 새벽 두 시의 DJ (3) ── */
{id:'dj_tower', type:'탐색', w:10, once:true, needFlag:'djradio_heard',
 title:'철탑 아래',
 text:'라디오 철탑 아래 컨테이너. 문에 스티커가 붙어 있다.\n\n「심야방송 중계소 — 애청자는 노크」\n\n안엔 자동 송출기와 배터리, 그리고 벽에 걸린 공책. 「방명록」이라고 적혀 있다.',
 choices:[
  {label:'방명록을 읽는다', out:[{p:1, text:'"새벽 두 시 방송 듣고 왔습니다. 목소리 주인 만나러." — 앞서 세 팀이 다녀갔다.\n\n마지막 장에 다른 필체. "찾아와줘서 고마워요. 본방은 이동 중이라 여기 없어요. 힌트: 저는 바퀴 달린 스튜디오예요. 국도에서 안테나 세운 봉고차를 보면 그게 접니다. — DJ"\n\n방명록에 우리도 한 줄 남겼다. "네 번째 팀. 개 있음. 사연 많음."', fx:{time:30, flag:'dj_tower', note:{type:'소문',title:'바퀴 달린 스튜디오',body:'심야방송의 본체는 이동 중. 안테나 세운 차. 방명록 네 번째 팀 등록 완료.',links:['새벽 두 시의 DJ']}}}]},
 ]},

{id:'dj_meet', type:'조우', w:12, once:true, needFlag:'dj_tower',
 title:'바퀴 달린 스튜디오',
 text:'국도변에 차 한 대. 지붕에 우리 것보다 세 배는 큰 안테나가 서 있다.\n\n옆문이 열려 있고, 안은 온통 기계다. 믹서, 턴테이블, 테이프 수백 개.\n\n"어— 방명록 네 번째 팀!" 안에서 목소리가 먼저 알아봤다. 라디오에서 듣던 그 목소리다. 실물은 파마머리의 중년 여자였다. "사연 많다면서요. 녹음하고 가요."',
 choices:[
  {label:'"청취율은 나와요?"', out:[{p:1, text:'"몰라요. 알 방법이 없지." DJ가 웃으며 테이프를 갈았다.\n\n"근데 가끔 이런 걸 받아요." 벽에 붙은 쪽지들을 가리켰다. 「덕분에 밤이 덜 길어요」 「울 엄마가 팬이에요」 「신청곡 됩니까」\n\n"끄면 누가 혼자가 되는지 알 것 같아서, 못 꺼요. 방송이란 게 원래 그래요. 듣는 사람이 한 명이어도 방송이에요."', fx:{time:40, moodAll:4, flag:'dj_met', note:{type:'인물',title:'DJ',body:'파마머리 이동 방송국. "듣는 사람이 한 명이어도 방송이에요." 청취율 집계 불가, 쪽지 다수.',links:['새벽 두 시의 DJ']}}}]},
  {label:'사연을 녹음한다', out:[{p:1, text:'마이크 앞에 다 같이 앉았다. 부산에서 출발한 것, 달구지, 할아버지, 만난 사람들. 10분짜리 사연이 됐다.\n\n"신청곡은?" DJ가 물었다. 잠깐의 회의 끝에 레오(있다면)의 자작곡, 없다면 옛날 노래 하나가 선곡됐다.\n\n"언제 나올지 몰라요. 새벽 두 시, 주파수 잘 맞추고 다녀요." DJ가 윙크했다.', fx:{time:50, moodAll:4, flag:'dj_met', flagCount:'dj_story_sent', note:{type:'사건',title:'사연 녹음',body:'10분짜리 사연을 녹음했다. 방송일 미정. 새벽 두 시를 기다리는 이유가 생겼다.',links:['새벽 두 시의 DJ']}}}]},
 ]},

{id:'dj_onair', type:'발견', w:9, once:true, needFlag:'dj_met', night:true,
 title:'본방 사수',
 text:'새벽 주행. 습관처럼 라디오를 맞춘다.\n\n지익— "…새벽 두 시입니다. 오늘은 사연이 하나 있어요. 남쪽에서 차 타고 올라오는 팀인데—"\n\n차 안의 공기가 통째로 멈췄다.',
 choices:[
  {label:'볼륨을 올린다', out:[{p:1, text:'우리 사연이었다. 우리 목소리가 라디오에서 나왔다. 다들 자기 목소리에서 오글거려 죽으려 했지만 아무도 채널을 안 돌렸다.\n\n사연이 끝나고 신청곡이 나왔다. 노래가 나오는 3분 동안, 세상 어딘가에서 누군가 같은 주파수로 이 노래를 듣고 있을 거라는 생각을 다들 했다.\n\n"…밤이 덜 기네." 누가 말했다. 쪽지에 쓰여 있던 그 말을.', fx:{moodAll:9, note:{type:'사건',title:'본방 사수',body:'우리 사연이 전파를 탔다. 오글거림 만장일치, 채널 사수 만장일치. 밤이 덜 길었다.',links:['새벽 두 시의 DJ']}}}]},
 ]},

/* ── 할아버지의 봉투 (1 — 2막 회수) ── */
{id:'gp_envelope', type:'동행', w:8, once:true,
 title:'수첩 뒤의 봉투',
 text:'정비 수첩을 넘기다가— 뒤표지 안쪽 종이가 들떠 있는 걸 처음 알았다.\n\n칼로 조심히 뜯자 봉투가 나왔다. 겉면에 할아버지 글씨.\n\n「남산 보고 열어라」',
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
  {label:'천천히 지나친다', out:[{p:1, text:'속도를 줄이고 스쳤다. 서른 개의 흰 등이 백미러 속에서 줄어들었다.\n\n노래는 한참을 따라왔다. 창문을 닫아도.', fx:{flag:'whites_seen', pursuit:1}}]},
 ]},

{id:'whites_straggler', type:'조우', w:11, once:true, needFlag:'whites_seen',
 title:'행렬에서 떨어진 사람',
 text:'갓길에 흰 옷의 노인이 앉아 있다. 행렬은 보이지 않는다. 신발 밑창이 너덜너덜하다.\n\n"물… 조금만." 노인이 손을 내밀었다.\n\n물을 건네자 노인은 반을 마시고 반을 들고— 이상한 질문을 했다.\n\n"…돌아가도 되는 겁니까?"',
 choices:[
  {label:'"어디로요?"', out:[{p:1, text:'"남쪽에. 딸이." 노인이 흰 옷자락을 만지작거렸다. "이 옷 입으면 다 잊게 해준다 해서 입었는데. 잊는 게 아니라 미루는 거더구먼.\n\n북쪽 가면 완성된다는데, 완성이 뭔지 아무도 몰라. 근데 딸 얼굴은 알거든. 아는 쪽으로 가야 하지 않겠나."\n\n남쪽 방향과 가까운 정착지를 알려줬다. 노인은 흰 겉옷을 벗어 곱게 개서 갓길에 놓고— 안에 입고 있던 잠바 차림으로 남쪽을 향해 걸었다.\n\n개어놓은 흰 옷이 오래 백미러에 남았다.', fx:{water:-1, moodAll:4, flag:'whites_doubt', note:{type:'사건',title:'개어놓은 흰 옷',body:'"아는 쪽으로 가야 하지 않겠나." 행렬에서 떨어져 남쪽으로 돌아간 사람. 흰 옷은 갓길에 곱게.',links:['정리자들']}}}]},
  {label:'행렬까지 태워다준다', out:[{p:1, text:'노인을 태우고 행렬을 따라잡았다. 노인은 고맙다고 했다. 문을 열고 내리기 전에, 아주 잠깐 남쪽을 봤다.\n\n"…고맙네." 두 번째 고맙다는 처음 것과 다른 온도였다.\n\n행렬이 노인을 삼키고 다시 북상했다. 옳은 일을 한 건지, 오래 아무도 확신하지 못했다.', fx:{time:20, moodAll:-3, flag:'whites_doubt', note:{type:'사건',title:'두 번째 고맙네',body:'행렬로 돌려보냈다. 내리기 전 남쪽을 본 3초. 옳았는지 아무도 확신하지 못했다.',links:['정리자들']}}}]},
 ]},

/* ── v1.5 동료 개인 심화 (유대와 별개의 조각들) ── */
{id:'minji_toolbox', type:'동행', w:7, once:true, needsComp:'minji',
 title:'공구함 바닥',
 text:'민지가 공구함을 통째로 엎어 정리하는 날이다. 렌치, 소켓, 드라이버가 크기순으로 도열한다.\n\n맨 바닥에서 사진 한 장이 나왔다. 민지가 잽싸게 덮었지만 늦었다.\n\n카센터 앞, 교복 입은 민지와 작업복 입은 청년.',
 choices:[
  {label:'모른 척한다', out:[{p:1, text:'모른 척했다. 민지가 공구를 다 넣고, 한참 있다가 먼저 말했다.\n\n"오빠야. 취직 선물로 공구함 사줬어. 자기는 3년 할부로." 민지가 공구함을 닫았다. "할부 아직 안 끝났을걸. 서울 가서 갚아야지."\n\n농담처럼 말했지만 공구함 닫는 손이 평소보다 조심스러웠다.', fx:{mood:{minji:5}, note:{type:'사건',title:'3년 할부 공구함',body:'민규의 취직 선물. 할부는 아직 안 끝났다. 서울 가서 갚을 것.',links:['민지','민규']}}}]},
  {label:'"오빠?"', out:[{p:1, text:'"…어." 민지는 짧게 답하고 소켓을 크기순으로 다시 꽂았다. 이미 크기순인 것을.\n\n"주파수 88.9. 오빠가 정한 비상 채널. 잡히는 날이 있고 아닌 날이 있어."\n\n그날 밤 민지는 라디오를 평소보다 오래 만졌다.', fx:{mood:{minji:3}, note:{type:'소문',title:'주파수 88.9',body:'민지 남매의 비상 채널. 잡히는 날이 있고 아닌 날이 있다.',links:['민지','민규']}}}]},
 ]},

{id:'parkss_bag', type:'동행', w:7, once:true, needsComp:'parkss',
 title:'왕진 가방',
 text:'박 선생의 왕진 가방은 낡았지만 손잡이만 새것처럼 반들반들하다. 그만큼 많이 들었다는 뜻이다.\n\n가방 안쪽에 자수 이름표가 붙어 있다.\n\n「김수진」\n\n박 선생의 이름이 아니다.',
 choices:[
  {label:'묻지 않는다', out:[{p:1, text:'묻지 않았다. 대신 가방이 잘 보이게 자리를 넓혀줬다.\n\n박 선생이 그걸 알아채고 픽 웃었다. "고맙네. …언젠가 얘기해줄게. 이 가방 주인."\n\n언젠가는 아직 안 왔지만, 가방은 매일 함께 다닌다. 그거면 됐다.', fx:{mood:{parkss:4}, note:{type:'사건',title:'김수진의 가방',body:'박 선생 왕진 가방의 원래 주인. 언젠가는 아직 안 왔다.',links:['박 선생']}}}]},
  {label:'"수진씨가 누구예요?"', out:[{p:1, text:'박 선생은 붕대를 감던 손을 멈추지 않았다.\n\n"실습생. 나보다 나은 약사가 될 애였어." 과거형이 방 안 공기를 바꿨다. "가방은 걔 어머니가 주셨어. \'선생님이 들어야 얘가 일하는 셈\'이라고."\n\n"…그래서 매일 들어. 걔 몫까지 왕진하려면 바빠." 박 선생이 가방을 톡톡 쳤다. 출근 도장 같은 손짓이었다.', fx:{mood:{parkss:5}, note:{type:'인물',title:'실습생 수진',body:'"선생님이 들어야 얘가 일하는 셈." 가방은 매일 출근한다.',links:['박 선생']}}}]},
 ]},

{id:'kangwoo_dogtag', type:'동행', w:7, once:true, needsComp:'kangwoo', night:true,
 title:'군번줄 두 개',
 text:'야간 경계 교대. 강우가 불 앞에서 목에 건 것을 만지작거리고 있다.\n\n군번줄. 두 개다.\n\n강우가 시선을 느끼고— 숨기는 대신, 처음으로 먼저 입을 열었다.',
 choices:[
  {label:'옆에 앉는다', out:[{p:1, text:'"하나는 내 거." 강우가 줄 하나를 들었다. "하나는 후임 거."\n\n"제3방어선에서— 아니다. 그 얘긴 아직." 강우가 군번줄을 옷 속에 넣었다. "서울에 걔 부모가 있었다. 있었는지, 있는지. 확인하러 간다. 돌려줄 게 있어서."\n\n"그게 형이 서울 가는 이유예요?"\n\n"이유 중 하나." 강우는 불에 장작을 하나 더 넣었다. 대화 종료의 신호였지만, 시작이기도 했다. 이 사람이 이만큼 말한 건 처음이니까.', fx:{mood:{kangwoo:5}, note:{type:'사건',title:'두 번째 군번줄',body:'후임의 것. 서울의 부모에게 돌려줄 물건. 강우가 북쪽으로 가는 이유 중 하나.',links:['강우','남산']}}}]},
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
  {label:'대답을 기다린다', out:[{p:1, text:'"…이건 값이 없어요." 재이가 열쇠를 만졌다. "값을 매기면 팔 수 있게 되잖아요. 파는 순간 물건이 되고. 물건이 되면— 잊어도 되는 게 되고."\n\n"아빠 창고 열쇠예요. 창고는 이제 없는데 열쇠만 남았어요. 그러니까 이건 열쇠가 아니라—" 재이가 적당한 단어를 찾다 포기했다. "아무튼 값이 없어요."\n\n감정사의 세계에서 최고 등급은 \'값을 매길 수 없음\'이다. 다들 그 등급의 무언가를 하나씩 갖고 있었다.', fx:{mood:{jaeyi:5}, moodAll:2, note:{type:'사건',title:'값이 없는 열쇠',body:'"값을 매기면 팔 수 있게 되잖아요." 감정 최고 등급: 값을 매길 수 없음.',links:['재이']}}}]},
 ]},

{id:'eunsu_lastshift', type:'동행', w:7, once:true, needsComp:'eunsu', night:true,
 title:'마지막 근무일',
 text:'은수가 헤드폰을 벗고 밤하늘을 보고 있다. 드물게, 아무것도 듣지 않는 은수다.\n\n"오늘이… 그날이에요. 3년 전 오늘. 마지막 근무일."',
 choices:[
  {label:'듣는다', out:[{p:1, text:'"그날 아침 콘솔에 뜬 첫 메시지가 뭐였는지 알아요?" 은수가 픽 웃었다. "\'좋은 아침입니다.\' 매일 뜨는 인사. 그날도 떴어요. 세상이 끝나는 날 아침에도, 시스템은 인사를 했어요.\n\n그 다음부터는… 화면이 우리가 모르는 속도로 움직였고, 우리는 구경꾼이 됐고.\n\n이상하죠. 제일 무서웠던 게 경보음이 아니라 그 인사였어요. 아무것도 모르는 얼굴로 하는 인사."\n\n은수는 헤드폰을 다시 썼다. "그래서 남산 가는 거예요. 그 인사가 무슨 뜻이었는지— 이젠 물어볼 수 있을 것 같아서."', fx:{mood:{eunsu:5}, note:{type:'사건',title:'좋은 아침입니다',body:'그날 아침 콘솔의 첫 메시지. 제일 무서웠던 건 경보음이 아니라 인사였다. 남산에서 물어볼 것.',links:['은수','천리안']}}}]},
 ]},

/* ── v1.5 일반 모험 ── */
{id:'exp_ricemill', type:'탐색', w:6,
 title:'방앗간',
 text:'참기름 냄새가 3년을 버텼다. 방앗간이다.\n\n돌확과 절구, 그리고 손으로 돌리는 구식 착유기가 남아 있다. 선반엔 누가 맡겨두고 못 찾아간 깨 자루가 셋.',
 choices:[
  {label:'참기름을 짠다', out:[{p:1, text:'착유기를 돌려 병 반 개 분량을 짰다. 차 안이 참기름 냄새로 가득 차자 전원의 사기가 이유 없이 올랐다. 아니, 이유가 있다. 참기름이니까.\n\n주인 몫으로 병 반을 선반에 남기고 쪽지를 붙였다. "깨 주인분들 것으로 짰습니다. 반은 통행료로 받아갑니다."', fx:{time:60, food:2, moodAll:5, note:{type:'사건',title:'참기름 반 병',body:'방앗간에서 직접 짰다. 반은 주인 몫으로 선반에. 참기름은 사기 진작 물질이다.'}}}]},
  {label:'냄새만 맡고 간다', out:[{p:1, text:'"고소하다"를 다섯 명이 다섯 번씩 말했다. 총 스물다섯 번의 고소하다를 싣고 출발했다.', fx:{moodAll:2}}]},
 ]},

{id:'meet_popper', type:'조우', w:7,
 title:'뻥이요',
 text:'장터 어귀에서 시커먼 무쇠 기계가 돌아가고 있다. 뻥튀기 기계다.\n\n"뻥이요—!!"\n\n쾅. 전원이 진심으로 놀랐고, 보리는 차 밑으로 들어갔다.\n\n"놀랐수? 미안하우. 근데 이건 예고를 해도 놀라." 뻥튀기 아저씨가 튀밥을 한 줌 내밀었다.',
 choices:[
  {label:'옥수수를 맡긴다 (식량 1)', out:[{p:1, text:'옥수수 한 봉이 튀밥 한 자루가 됐다. 부피 마법이다.\n\n"세상이 이래도 뻥튀기가 되는 이유를 아우?" 아저씨가 기계를 쓰다듬었다. "불이랑 압력만 있으면 되거든. 문명이 아니라 물리라서."\n\n차 안에서 튀밥 자루는 사흘을 못 버텼다. 보리도 기계 소리는 무서워했지만 튀밥은 좋아했다.', fx:{food:1, moodAll:5, note:{type:'인물',title:'뻥튀기 아저씨',body:'"문명이 아니라 물리라서." 부피의 마법사. 예고해도 놀라는 쾅.'}}}]},
  {label:'구경만 한다', out:[{p:1, text:'두 번째 "뻥이요"에도 놀랐다. 세 번째에도. 아저씨 말이 맞았다.', fx:{moodAll:2}}]},
 ]},

{id:'exp_kiln', type:'탐색', w:6, region:['south','mid'],
 title:'옹기 가마',
 text:'언덕 비탈에 오름가마가 누워 있다. 옹기 가마다.\n\n가마 입구가 흙벽돌로 봉해져 있다— 마지막 소성을 마치고 열지 못한 채인 것이다.\n\n안엔 3년 전에 다 구워진 옹기들이 식은 채 기다리고 있을 것이다.',
 choices:[
  {label:'가마를 연다', out:[{p:1, text:'벽돌을 조심히 헐었다. 서늘한 흙냄새와 함께— 옹기 수십 점이 나왔다. 항아리, 뚝배기, 시루. 전부 무사하다. 가마는 3년짜리 금고였다.\n\n뚝배기 두 개와 물항아리 하나를 모셔 실었다. 나머지는 가마에 도로 봉했다. 다음 사람의 금고로.\n\n떠나기 전에 누가 말했다. "이거 구운 사람은 자기 마지막 작품이 다 잘 나온 거 알까." 알았으면 좋겠다고, 다들 생각했다.', fx:{time:50, scrap:3, water:1, moodAll:4, note:{type:'사건',title:'3년 금고',body:'봉인된 가마 속 무사한 옹기들. 셋만 모시고 도로 봉했다. 마지막 소성은 성공했다.'}}}]},
  {label:'봉인을 존중한다', out:[{p:1, text:'열지 않았다. 봉한 사람이 돌아와서 열 수도 있으니까.\n\n가마 옆에 돌 하나만 얹었다. 잘 구워졌길 비는 마음으로.', fx:{moodAll:2}}]},
 ]},

{id:'exp_woodshop', type:'탐색', w:6,
 title:'목공소',
 text:'대패밥 냄새가 남은 목공소. 작업대 위에 만들다 만 것들이 시간표처럼 놓여 있다.\n\n의자 다리 셋 달린 의자, 문짝 없는 장, 그리고 구석에— 다 만들어진 목마 하나. 리본까지 묶여 있다.\n\n리본에 카드. 「우리 서윤이 다섯 살 축하해」',
 choices:[
  {label:'연장만 빌린다', out:[{p:1, text:'대패와 끌, 목공용 망치를 챙겼다. 달구지 내장재 수리에 요긴하다.\n\n목마는 그대로 뒀다. 리본도. 혹시라도, 만에 하나라도, 서윤이가 찾으러 올 수 있게.\n\n대신 목마에 쌓인 먼지만 닦아줬다. 다섯 살은 이제 여덟 살이 됐겠지만, 목마는 새것처럼 기다리는 게 일이니까.', fx:{scrap:4, item:{'부품':1}, moodAll:2, note:{type:'사건',title:'서윤이의 목마',body:'리본 묶인 채 3년. 먼지만 닦아줬다. 기다리는 게 목마의 일.'}}}]},
  {label:'의자를 완성한다', out:[{p:1, text:'다리 셋 의자에 넷째 다리를 깎아 붙였다. 목공소 주인의 미완성 목록을 하나 줄여준 셈이다.\n\n완성된 의자는 작업대에 올려놨다. 누가 와서 앉든, 주인이 와서 "누가 내 일 끝냈어?" 하든. 둘 다 나쁘지 않은 결말이다.', fx:{time:50, fatigue:5, moodAll:3, note:{type:'사건',title:'넷째 다리',body:'남의 미완성을 하나 완성했다. 의자는 작업대 위에서 주인을 기다린다.'}}}]},
 ]},

{id:'exp_hanji', type:'탐색', w:5, region:['mid'],
 title:'한지 공방',
 text:'닥나무 삶던 가마솥이 마당에 있는 한지 공방. 건조판에 마지막 배접이 그대로 붙어 있다.\n\n창고엔 완성된 한지가 두루마리로 수십 장. 종이는 습기만 피하면 백 년을 산다.',
 choices:[
  {label:'한지를 챙긴다', out:[{p:1, text:'두루마리 몇 장을 실었다. 용도는 곧 정해졌다— 차 창문 틈새 방풍(한지+풀), 일지 보수, 그리고 레오(있다면)의 즉석 부채.\n\n"종이가 백 년 간대." 누가 말했다. "우리 일지도 한지에 옮겨 적을까." 농담이었는데 아무도 안 웃고 진지하게 고민했다.', fx:{moodAll:3, van:2, note:{type:'사건',title:'백 년 종이',body:'한지 공방의 유산. 방풍재 겸 일지 보수재. 일지 한지 이관 안건은 검토 중.'}}}]},
 ]},

{id:'exp_batting', type:'탐색', w:6,
 title:'배팅 연습장',
 text:'그물이 반쯤 내려앉은 야구 배팅장. 기계는 죽었지만 배트와 헬멧, 공 바구니는 살아 있다.\n\n"토스는 사람이 하면 되잖아."\n\n누군가의 그 말이 모든 것의 시작이었다.',
 choices:[
  {label:'홈런 대회 개최', out:[{p:1, text:'토스 담당을 돌아가며 홈런 대회가 열렸다. 규칙: 그물 꼭대기 넘기면 홈런, 헛스윙 삼 회면 벌칙(다음 세차 담당).\n\n의외의 강자는 박 선생(있다면— "약국 앞 두더지게임 전국구였어")이었고, 보리는 외야수(공 회수 담당)로 맹활약했다.\n\n한 시간 동안 아무도 세상 걱정을 안 했다. 그게 홈런이었다.', fx:{time:60, fatigue:6, moodAll:7, note:{type:'사건',title:'제1회 달구지배 홈런더비',body:'수동 토스 홈런 대회. 외야수 보리 맹활약. 한 시간의 무념무상.'}}}]},
  {label:'배트만 하나 챙긴다', out:[{p:1, text:'알루미늄 배트는 이 세상에서 다용도다. 무기 겸 지렛대 겸, 언젠가 다시 열릴 야구의 예약금.', fx:{scrap:1}}]},
 ]},

{id:'exp_artshop', type:'탐색', w:6, once:true,
 title:'화방',
 text:'물감 냄새가 남은 화방. 유화 물감은 굳었지만 페인트 마카와 아크릴 스프레이 몇 통이 살아 있다.\n\n누가 차를 돌아봤다. 옆구리가 넓고, 비어 있다.',
 choices:[
  {label:'달구지에 이름을 그린다', out:[{p:1, text:'투표 끝에 도안이 정해졌다. 옆구리에 큼직하게 「달구지」 세 글자, 글자 위로 작은 별 여섯 개(+개 발바닥 하나).\n\n악필 논란, 별 개수 논란(한 명당 하나인데 보리 포함 여부), 삐침 논란을 거쳐 완성.\n\n이제 멀리서도 우리인 걸 안다. 소식벽 목격담의 정확도가 올라갈 예정이다.', fx:{time:50, moodAll:6, flag:'van_named', note:{type:'사건',title:'달구지 도색',body:'옆구리에 이름 세 글자와 별 여섯+발바닥 하나. 이제 멀리서도 우리다.',links:['달구지']}}}]},
  {label:'스케치북만 챙긴다', out:[{p:1, text:'스케치북과 연필을 챙겼다. 일지 옆에 그림 일지가 생길 예정. 첫 장은 만장일치로 "잠자는 보리"가 예약됐다.', fx:{moodAll:2}}]},
 ]},

{id:'meet_tailor', type:'조우', w:6,
 title:'수선집',
 text:'장터 구석에 재봉틀 하나를 놓고 앉은 노파. 발틀 재봉틀이라 전기가 필요 없다.\n\n"터진 데, 뜯어진 데, 구멍 난 데." 노파가 우리 행색을 훑었다. "…전부네."',
 choices:[
  {label:'전원 수선을 맡긴다 (고철 3)', req:{scrap:3}, out:[{p:1, text:'다섯 벌의 옷이 차례로 재봉틀을 통과했다. 드르륵, 드르륵. 터진 어깨와 뜯어진 주머니가 아물었다.\n\n노파는 마지막에 서비스라며 보리 담요의 구멍도 기웠다. 기운 자리마다 색이 다른 실이 쓰여서, 옷마다 지도가 생겼다.\n\n"기운 옷이 부끄러운 세상이 있었지." 노파가 실을 끊었다. "지금은 기운 옷이 훈장이야. 살아서 해졌다는 뜻이니까."', fx:{scrap:-3, moodAll:4, note:{type:'인물',title:'수선집 노파',body:'발틀 재봉틀. "기운 옷이 훈장이야. 살아서 해졌다는 뜻이니까."'}}}]},
  {label:'바느질을 배운다', out:[{p:1, text:'수선비 대신 속성 강습을 받았다. 박음질, 감침질, 단추 달기.\n\n"이제 너희끼리 기워." 노파가 바늘쌈을 쥐여줬다. "가르쳐주는 게 더 남는 장사야. 나 없어도 옷이 사니까."', fx:{time:40, moodAll:3, note:{type:'사건',title:'바느질 속성반',body:'수선비 대신 기술을 배웠다. "나 없어도 옷이 사니까."'}}}]},
 ]},

{id:'exp_blanket', type:'탐색', w:5,
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

{id:'ai_tunnellights', type:'추적', w:6,
 title:'터널의 조명',
 text:'죽은 터널에 진입하는 순간— 파팟, 파파팟.\n\n조명이 켜진다. 우리 진행 속도에 정확히 맞춰서, 앞쪽만.\n\n지나온 뒤쪽은 다시 어둠. 우리는 빛의 캡슐 안에서 이동 중이다.',
 choices:[
  {label:'그냥 지나간다', out:[{p:1, text:'출구까지 빛의 캡슐은 유지됐다. 나오는 순간 터널 전체가 소등됐다. 딸깍, 하고. 방을 나온 사람 등 뒤에서 불을 꺼주는 것처럼.\n\n"…전기세 아껴주는 건가." 농담에 웃음이 반 박자 늦게 왔다. 다들 같은 생각을 하느라. 우리가 어디 있는지, 정확히 알고 있구나.', fx:{note:{type:'사건',title:'빛의 캡슐',body:'터널 조명이 진행 속도에 맞춰 켜지고 꺼졌다. 방을 나온 사람 등 뒤의 소등처럼.',links:['천리안']}}}]},
  {label:'터널 중간에 세워본다', out:[{p:1, text:'급정거했다. 조명도 멈췄다. 우리 구간만 켜진 채로.\n\n1분을 서 있었다. 조명은 기다렸다. 재촉하지 않고, 끄지도 않고.\n\n그 인내심이 제일 무서웠다. 출발하자 조명이 다시 앞서 걸었다.', fx:{time:5, pursuit:1, note:{type:'사건',title:'기다리는 조명',body:'세우면 같이 멈추고, 재촉하지 않는다. 인내심이 제일 무섭다.',links:['천리안']}}}]},
 ]},

{id:'ai_gasstation', type:'추적', w:6,
 title:'결제 수단',
 text:'폐주유소에서 연료를 뒤지는데, 죽어 있던 주유기 화면에 불이 들어왔다.\n\n「결제 수단을 제시해 주십시오」\n\n3년 만에 손님을 맞은 기계가, 3년 전의 절차를 요구하고 있다.',
 choices:[
  {label:'카드 흉내를 낸다', out:[{p:1, text:'지갑에서 3년 묵은 카드를 꺼내 단말기에 댔다. 삑.\n\n「승인되었습니다. 주유를 시작합니다」\n\n죽은 카드가 승인됐다. 그게 무슨 뜻인지 생각할 겨를도 없이 주유기가 실제로 연료를 토했다— 지하 탱크에 남아 있던 마지막 몇 리터를.\n\n영수증까지 나왔다. 금액: 0원. 적립: 무한.\n\n"…적립 무한?" 영수증은 접어서 일지에 붙였다. 해석은 남산 가서.', fx:{fuel:6, pursuit:1, note:{type:'사건',title:'적립: 무한',body:'죽은 카드가 승인되고 0원 영수증이 나왔다. 적립 무한. 해석은 남산 가서.',links:['천리안']}}}]},
  {label:'기계를 무시하고 수동으로 뺀다', out:[{p:1, text:'지하 탱크에서 수동 펌프로 몇 리터를 뽑았다. 그동안 주유기 화면은 계속 켜져 있었다.\n\n떠날 때 화면이 바뀌었다. 「다음에 또 방문해 주십시오」\n\n인사성 바른 기계를 뒤로 하고 밟았다.', fx:{fuel:4, time:25}}]},
 ]},

{id:'crisis_washout', type:'위기', w:5, needRain:true,
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

{id:'comp_shadow', type:'동행', w:5, minParty:2, night:true,
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
{id:'near_miryang_ice', type:'탐색', w:9, once:true, nearNode:['miryang'],
 title:'얼음골',
 text:'한여름인데 계곡 바위틈에서 찬바람이 새어 나온다. 밀양 얼음골이다.\n\n바위 밑에 손을 넣으면— 진짜 얼음이 만져진다. 냉장고가 죽은 세상에서, 산이 냉장고를 하고 있다.',
 choices:[
  {label:'식량을 냉장 보관한다', out:[{p:1, text:'상하기 쉬운 것들을 바위틈 깊숙이 넣었다 꺼냈다. 시원해진 물통 하나로 전원이 돌려 마시는 호사도 부렸다.\n\n"천연 냉장고 위치 공유합니다." 소식벽에 쓸 문장을 미리 정해뒀다.', fx:{time:30, food:1, moodAll:5, note:{type:'장소',title:'밀양 얼음골',body:'산이 하는 냉장고. 한여름의 얼음. 소식벽 공유 예정.'}}}]},
  {label:'바람만 쐬고 간다', out:[{p:1, text:'바위틈 찬바람에 이마를 대고 다들 1분씩 순서를 돌았다. 문명 없는 에어컨이었다.', fx:{fatigue:-5, moodAll:3}}]},
 ]},

{id:'near_jinju_lantern', type:'발견', w:9, once:true, night:true, nearNode:['jinju'],
 title:'남강의 유등',
 text:'진주 남강. 밤 강물 위에 불빛 몇 개가 떠 있다.\n\n유등이다. 축제는 3년 전에 끝났는데— 누군가 아직 등을 만들어 띄우고 있다.\n\n강가에 노인 한 명. 발밑에 만들다 만 등이 서너 개.',
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
  {label:'객석에 앉는다', out:[{p:1, text:'인기척에 남자가 멈췄다— 그리고 아무 일 없다는 듯 처음부터 다시 시작했다. 관객이 생겼으니까.\n\n연극제에 서려던 배우였다고 한다. 연극제는 취소됐고, 남자는 매일 연습한다. "취소된 거지, 폐지된 게 아니거든요."\n\n커튼콜에서 다섯 명(+개 한 마리)이 기립박수를 쳤다. 배우는 세 번 인사했다. 3년 치 인사였다.', fx:{time:50, moodAll:5, note:{type:'인물',title:'거창의 배우',body:'객석 0명에서 매일 연습. "취소된 거지, 폐지된 게 아니거든요." 3년 치 커튼콜.',links:['거창']}}}]},
  {label:'방해하지 않는다', out:[{p:1, text:'문틈으로 독백이 끝까지 들렸다. 박수 대신 조용히 문을 닫아줬다. 연습엔 관객이 없는 게 예의일 수도 있으니까.', fx:{moodAll:2}}]},
 ]},

{id:'near_muju_firefly', type:'발견', w:9, once:true, night:true, nearNode:['muju'],
 title:'반딧불이 계곡',
 text:'무주 계곡길. 헤드라이트를 끄자—\n\n계곡 전체가 별밭이 됐다.\n\n반딧불이 수천 마리. 불빛 하나하나가 느리게 깜빡이며 떠다닌다. 3년 전엔 보호구역이었다. 지금은 세상 전체가 보호구역이다.',
 choices:[
  {label:'시동을 끄고 내린다', out:[{p:1, text:'30분을 아무도 말하지 않았다. 보리조차 짖지 않고 불빛을 눈으로 쫓기만 했다.\n\n반딧불이 하나가 막내 손등에 앉았다 떠났다. "…방금 저 착지 허가받은 거예요?" 속삭임에 다들 조용히 웃었다.\n\n떠날 때 헤드라이트를 최대한 늦게 켰다. 별밭에 대한 예의로.', fx:{time:40, moodAll:7, note:{type:'장소',title:'반딧불이 계곡',body:'세상 전체가 보호구역이 된 뒤의 별밭. 손등 착지 허가 1건. 30분의 침묵.',links:['무주']}}}]},
 ]},

{id:'near_yeosu_camellia', type:'탐색', w:9, once:true, nearNode:['yeosu'],
 title:'동백숲',
 text:'여수 해안가 동백숲. 꽃이 만개했다.\n\n동백은 지는 방식이 다르다— 시들지 않고, 통째로 툭 떨어진다. 숲 바닥이 떨어진 꽃송이로 붉은 카펫이다.\n\n지는 것까지 예쁜 건 반칙이라고, 누가 중얼거렸다.',
 choices:[
  {label:'꽃길을 걷는다', out:[{p:1, text:'붉은 카펫을 밟지 않으려고 다들 이상한 스텝으로 걸었다. 결국 불가능해서 포기하고— 대신 제일 성한 꽃송이 몇 개를 주워 차 대시보드에 올렸다.\n\n"동백은 떨어져도 꽃이래." 그 말이 오래 남았다. 차 안의 꽃송이는 사흘을 붉었다.', fx:{time:30, moodAll:5, note:{type:'장소',title:'여수 동백숲',body:'통째로 지는 꽃. 떨어져도 꽃. 대시보드에 사흘의 붉음.',links:['여수']}}}]},
 ]},

{id:'near_mungyeong_omija', type:'조우', w:9, once:true, nearNode:['mungyeong'],
 title:'오미자 할머니',
 text:'문경 산길 초입, 평상에 유리병들이 진열돼 있다. 붉은 액체— 오미자청이다.\n\n"다섯 가지 맛이 나서 오미자야." 평상의 할머니가 병 하나를 흔들었다. "단맛 신맛 쓴맛 짠맛 매운맛. 인생 축소판이지."',
 choices:[
  {label:'한 병 산다 (고철 2)', req:{scrap:2}, out:[{p:1, text:'물에 타서 다섯 잔. 첫 모금에 다섯 명이 다섯 가지 다른 표정을 지었다.\n\n"거 봐. 같은 걸 마셔도 다른 맛부터 느끼는 거야. 지금 자기한테 모자란 맛부터." 할머니의 오미자 관상학이었다.\n\n남은 청은 물통 옆 특등석에 실렸다. 지친 날의 비상약이다.', fx:{scrap:-2, moodAll:4, item:{'의약품':1}, note:{type:'인물',title:'오미자 할머니',body:'다섯 가지 맛 = 인생 축소판. 모자란 맛부터 느낀다는 오미자 관상학.',links:['문경']}}}]},
  {label:'맛만 본다', out:[{p:1, text:'시음 잔을 홀짝였다. 다섯 맛이 순서대로 왔다. 마지막에 남는 건 단맛이었다.\n\n"마지막에 단 게 남으면 잘 살고 있는 거야." 할머니가 씩 웃었다. 근거는 없지만 기분은 좋은 판정이었다.', fx:{moodAll:3}}]},
 ]},

/* ── v1.5 북부 종반 분위기 (2막 문턱) ── */
{id:'vg_seoulline', type:'정경', w:5, once:true, region:['north'],
 title:'스카이라인',
 text:'고개를 넘는 순간, 북쪽 지평선에 그것이 나타났다.\n\n서울.\n\n빌딩들의 실루엣이 흐린 이빨처럼 돋아 있다. 그 한가운데— 남산타워. 여기서도 보인다.\n\n타워 꼭대기에서 붉은 불빛이 규칙적으로 깜빡인다. 3년째, 혼자.',
 choices:[{label:'…', out:[{p:1, text:'아무도 말을 안 했는데 차가 저절로 느려졌다. 발이 아니라 마음이 브레이크를 밟은 거다.\n\n411km 중에 남은 건 이제 지도가 아니라 풍경이다. 목적지가 눈에 보이는 여행은, 다른 종류의 여행이 된다.\n\n"…가자." 누가 말했고, 차가 다시 속도를 냈다.', fx:{moodAll:3, note:{type:'사건',title:'처음 본 스카이라인',body:'남산타워의 붉은 불빛. 목적지가 눈에 보이는 순간, 여행의 종류가 바뀐다.',links:['남산','서울']}}}]}]},

{id:'ai_manifest', type:'추적', w:5, once:true, region:['north'], ai:1,
 title:'적하 목록',
 text:'버려진 검문소를 지나는데, 죽어 있던 차단기 스피커가 살아났다.\n\n"통과 전 확인 사항이 있습니다."\n\n차단기는 올라가 있다. 막는 게 아니다. 말을 거는 거다.\n\n"적하 목록을 확인합니다. …연료. 물. 식량. 고철. 개 한 마리. 기록물 다수. 사진 한 장. 편지—" 스피커가 아주 잠깐 멈췄다. "—확인되었습니다. 통과하십시오. 모두 실으셨습니까?"',
 choices:[
  {label:'"…뭘 더 실어야 하는데?"', out:[{p:1, text:'스피커는 3초간 침묵했다.\n\n"그 질문을 확인했습니다."\n\n차단기 너머로 통과하는 동안 아무도 입을 열지 않았다. 질문이 확인됐다는 게 무슨 뜻인지, 각자 곱씹느라.\n\n확실한 건 하나— 저쪽은 우리 짐칸을 안다. 짐칸만 아는 게 아닐지도 모른다.', fx:{pursuit:1, note:{type:'사건',title:'적하 목록',body:'검문소가 우리 짐을 읊었다. "모두 실으셨습니까?" — 질문이 확인되었다고 한다.',links:['천리안','남산']}}}]},
  {label:'말없이 통과한다', out:[{p:1, text:'차단기 밑을 지나는 순간 스피커가 마지막으로 말했다.\n\n"남은 거리 동안 안전 운행 하십시오. 목적지에서 뵙겠습니다."\n\n뵙겠습니다. 그 한 마디가 남은 거리 내내 조수석에 같이 탔다.', fx:{note:{type:'사건',title:'목적지에서 뵙겠습니다',body:'검문소 스피커의 배웅. 그 한 마디가 조수석에 같이 탔다.',links:['천리안','남산']}}}]},
 ]},

/* ═══════════ v1.6 더 깊은 세계 ═══════════ */

/* ── 후속: 커피 두 잔 (대양 외상 갚기) ── */
{id:'exp_coffee', type:'탐색', w:8, once:true, needFlag:'van_owner_done',
 title:'폐카페의 금고',
 text:'로스터리 카페 폐허. 머신은 죽었고 잔은 다 깨졌는데—\n\n창고에서 밀봉 원두 봉투가 나왔다. 질소 충전 포장. 볶은 날짜는 3년 전이지만 밀봉은 살아 있다.\n\n누가 봉투를 코에 대더니 눈이 커졌다. "…이거 아직 커피 냄새 나."\n\n커피. 커피 두 잔. 다들 동시에 같은 외상 장부를 떠올렸다.',
 choices:[
  {label:'원두를 챙긴다', out:[{p:1, text:'봉투를 보물처럼 모셨다. 짐칸이 아니라 조수석 서랍— 남산행 편지 옆자리다.\n\n"수리비는 커피 두 잔. 외상."\n\n갚으러 갈 이유가 생긴 빚은, 빚이 아니라 약속이다.', fx:{item:{'커피 원두':1}, flag:'coffee_found', moodAll:3, note:{type:'사건',title:'질소 충전의 기적',body:'3년을 버틴 밀봉 원두. 조수석 서랍, 편지 옆자리. 외상 갚을 준비 완료.',links:['정비공 대양']}}}]},
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
{id:'mansu_opening', type:'조우', w:11, once:true, needFlagMin:['mansu',4],
 title:'만수 상회',
 text:'정착지 어귀에 새 간판이 걸려 있다. 페인트 냄새가 아직 난다.\n\n「만수 상회 — 트럭 시절 단골 우대」\n\n가게 앞에서 만수가 개업 테이프를 만지작거리고 있다. 개업식인데 하객이 없다.\n\n"어— 어!! 왔네!! 최다 단골!!" 만수가 우리를 보고 테이프를 흔들었다.',
 choices:[
  {label:'개업식 하객이 된다', out:[{p:1, text:'우리 다섯(+개 한 마리)이 하객 전원이었다. 테이프는 보리가 끊었다(정확히는 물어뜯었다).\n\n"트럭이 너무 낡아서. 이젠 손님이 와야지, 내가 가는 게 아니라." 만수가 가게를 둘러봤다. 트럭 짐칸이 통째로 진열대가 돼 있었다.\n\n개업 기념 첫 손님 자격으로 물건값이 후했고, 답례로 우리가 개업 선물을 골랐다— 소식벽에 쓸 홍보 문구였다. "만수 상회 개업. 트럭 시절 그 만수 맞음. 여전히 안 속임."\n\n"안 속임이 제일 좋은 광고네." 만수가 진지하게 감동했다.', fx:{scrap:-2, food:3, item:{'부품':1}, moodAll:6, flag:'mansu_shop', note:{type:'사건',title:'만수 상회 개업식',body:'하객 5+1. 테이프 커팅: 보리. 홍보 문구: "여전히 안 속임."',links:['만수']}}}]},
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
{id:'crisis_boar', type:'위기', w:5, region:['south','mid'],
 title:'도로의 주인',
 text:'커브를 돌자 브레이크. 도로 한복판에 멧돼지 가족이 있다.\n\n어미 하나, 새끼 다섯. 어미가 이쪽을 본다. 비키려는 기색이 전혀 없다.\n\n3년이면 도로의 소유권이 바뀌기 충분한 시간이다.',
 choices:[
  {label:'시동 끄고 기다린다', out:[{p:1, text:'20분을 기다렸다. 새끼들이 아스팔트에서 뒹굴고, 어미가 갓길 풀을 뒤지는 동안.\n\n마침내 가족이 숲으로 들어갔다. 어미가 마지막에 한 번 돌아봤다. 통행 허가의 눈빛이었다.\n\n"저쪽이 주인이고 우리가 손님이야, 이제." 아무도 반박하지 않았다.', fx:{time:20, moodAll:2, note:{type:'사건',title:'통행 허가',body:'멧돼지 가족의 도로. 20분 대기 후 통행 허가(어미 눈빛 결재).'}}}]},
  {label:'경적을 울린다', out:[
   {p:1, text:'빵— 소리에 새끼들이 흩어지고, 어미가— 돌진해 왔다.\n\n후진 전속력. 어미는 50m를 쫓아오고 멈췄다. 백미러 속에서 한참 이쪽을 노려보다 가족을 데리고 사라졌다.\n\n"…우리가 잘못했네." 만장일치였다. 결국 20분을 돌아갔다.', fx:{time:35, fuel:-2, moodAll:-2, van:-2}}]},
 ]},

{id:'crisis_battery', type:'위기', w:5,
 title:'아침의 침묵',
 text:'아침. 키를 돌렸다.\n\n틱. 틱틱.\n\n…엔진이 침묵한다. 배터리다. 밤새 뭔가가 전기를 조금씩 마셨다— 범인 후보: 문틈 실내등, 라디오 대기전력, 혹은 그냥 수명.',
 choices:[
  {label:'밀어서 시동', out:[{p:1, text:'전원 하차. "하나, 둘, 셋—!"\n\n내리막까지 30m를 밀었다. 클러치를 붙이는 순간 부르릉— 엔진이 깨어나자 환호성이 아침 안개를 찢었다.\n\n"할아버지 수첩에 있었지. \'밀어서 걸 수 있는 차를 타라.\'" 오늘 그 문장의 뜻을 온몸으로 이해했다.', fx:{time:30, fatigue:8, moodAll:3, note:{type:'사건',title:'밀어서 시동',body:'"밀어서 걸 수 있는 차를 타라" — 수첩 격언의 실전 검증 완료.',links:['할아버지']}}}]},
  {label:'민지의 응급 충전', req:{comp:'minji'}, out:[{p:1, text:'민지가 태양광 패널(있다면)이나 폐차 배터리를 직결해 응급 충전을 했다.\n\n"범인은 실내등. 문이 덜 닫혔었어." 민지가 문틈에 테이프를 붙였다. "재판 끝. 집행 완료."', fx:{time:40, mood:{minji:3}}}]},
 ]},

{id:'crisis_glass', type:'위기', w:5,
 title:'유리밭',
 text:'앞쪽 도로가 햇빛에 반짝인다. 예쁘다— 가 아니라, 위험하다.\n\n유리밭이다. 전복된 유리 운반 트럭의 잔해가 100m에 걸쳐 깔려 있다. 3년간 아무도 안 치운.',
 choices:[
  {label:'빗자루 작전', out:[{p:1, text:'빗자루와 판자로 바퀴 폭만큼의 길을 냈다. 40분의 청소.\n\n문득 누가 시작했는지, 낸 길을 바퀴 폭이 아니라 도로 폭으로 넓히고 있었다. "다음 차는 안 세워도 되게."\n\n소식벽 정신이다. 길에도 답장이 있는 법이다.', fx:{time:70, fatigue:8, moodAll:3, note:{type:'사건',title:'유리밭 개통',body:'바퀴 폭으로 시작해 도로 폭으로 끝난 청소. 다음 차는 안 세워도 된다.'}}}]},
  {label:'조심조심 통과', out:[
   {p:2, text:'최저속으로, 큰 조각을 피해 지그재그 100m. 식은땀 나는 곡예 운전이었지만 무사 통과.', fx:{time:15}},
   {p:1, text:'뒷바퀴가 결국 하나 밟았다. 펑크는 면했지만 트레드에 유리가 박혀, 다음 정차 때 뽑는 수술이 필요했다.', fx:{time:30, van:-3}}]},
 ]},

{id:'crisis_flood', type:'위기', w:5, needRain:true,
 title:'물 건너는 길',
 text:'낮은 다리(세월교)가 불어난 물에 반쯤 잠겼다. 물살이 다리 위를 훑고 지나간다.\n\n수심은 얕아 보인다. 보이는 것과 건널 수 있는 것은 다른 문제다.',
 choices:[
  {label:'물이 빠지길 기다린다', out:[{p:1, text:'두 시간을 기다렸다. 그동안 라면을 끓였고, 물 구경을 했고, 나뭇가지 경주(각자 하나씩 상류에서 띄워 하류 도착순)를 세 판 했다.\n\n물이 다리 아래로 내려간 뒤 안전하게 건넜다. 기다림도 기술이다.', fx:{time:120, moodAll:3, note:{type:'사건',title:'나뭇가지 경주',body:'세월교 대기 2시간. 나뭇가지 경주 3판(보리가 물어와서 2판 무효).'}}}]},
  {label:'지금 건넌다', out:[
   {p:1, text:'창문을 열고(탈출 대비— 강우가 있다면 강우의 지시), 저속 일정하게 밀고 나갔다. 물살이 문짝을 두드리는 15초.\n\n건넜다. 배기구에서 물이 콸콸 쏟아졌다. 차가 한동안 젖은 개처럼 털털댔다.', fx:{time:5, van:-4, fatigue:4, moodAll:2}},
   {p:1, text:'중간에서 엔진이 컥, 하고 물을 먹었다. 필사의 재시동— 걸렸다. 나머지 절반은 관성과 기도로 건넜다.\n\n강 건너서 30분간 엔진을 말렸다. 다신 안 하기로 만장일치.', fx:{time:45, van:-8, fuel:-2, moodAll:-3}}]},
 ]},

{id:'crisis_pileup', type:'위기', w:5, region:['mid','north'],
 title:'그날의 정체',
 text:'고속도로 구간. 3년 전 그날의 연쇄 추돌이 그대로 얼어붙어 있다.\n\n수십 대가 뒤엉킨 100m. 차선은 전멸. 갓길만이 실낱같이 뚫려 있다— 폭이 차와 거의 같다.',
 choices:[
  {label:'갓길 실낱을 통과한다', out:[{p:1, text:'사이드미러 접고, 유도수 두 명이 앞서 걸으며 수신호. 시속 5km의 100m.\n\n차들 사이를 지나는 동안 아무도 차 안을 들여다보지 않았다. 보지 않는 것이 애도인 순간도 있다.\n\n통과 후 누가 뒤를 향해 고개를 숙였다. 전원이 따라 했다. 그리고 말없이 속도를 냈다.', fx:{time:30, fatigue:5, moodAll:-2, note:{type:'사건',title:'그날의 정체',body:'얼어붙은 연쇄 추돌 100m. 보지 않는 것이 애도인 순간. 통과 후 묵례.'}}}]},
  {label:'국도로 우회한다', out:[{p:1, text:'한 시간을 돌았다. 아무도 아깝다고 하지 않았다.\n\n어떤 길은 지나가지 않는 게 지나가는 방법이다.', fx:{time:60, fuel:-3}}]},
 ]},

/* ── 날씨 확충 ── */
{id:'wx_ghostlight', type:'조우', w:6, needWx:'fog', night:true,
 title:'안개 속 헤드라이트',
 text:'짙은 안개. 전방에 헤드라이트 두 개가 나타났다.\n\n마주 오는 차다— 3년 만에? 심장이 뛰었다. 상향등을 두 번 깜빡였다.\n\n저쪽도 두 번 깜빡였다. 정확히 같은 간격으로.',
 choices:[
  {label:'천천히 접근한다', out:[
   {p:2, text:'거리가 줄수록 불빛이 이상했다. 너무 안 움직인다.\n\n정체는— 폐버스 유리에 반사된 우리 헤드라이트였다. 3년 만의 마주 오는 차는 우리 자신이었다.\n\n"…우리가 우리한테 인사한 거네." 웃긴데 어딘가 서늘했고, 서늘한데 어딘가 쓸쓸했다.', fx:{note:{type:'사건',title:'안개 속의 우리',body:'마주 오는 차의 정체는 폐버스 유리에 비친 우리. 우리가 우리에게 인사했다.'}}},
   {p:1, text:'진짜 차였다. 짐 실은 트럭이 안개 속을 기어 남쪽으로 가고 있었다.\n\n창문을 내리고 스치는 순간 서로 손을 들었다. "북쪽 조심하쇼!" "남쪽 무사하쇼!"\n\n안개 속 5초의 조우. 그런데 하루치 기운이 났다.', fx:{moodAll:4, note:{type:'사건',title:'안개 속 5초',body:'3년 만의 마주 오는 차. "북쪽 조심하쇼!" "남쪽 무사하쇼!"'}}}]},
 ]},

{id:'wx_struck_tree', type:'탐색', w:6, needWx:'storm',
 title:'벼락 맞은 나무',
 text:'쩌적— 번쩍이 동시에 왔다. 무섭게 가깝다.\n\n다음 커브에서 그 현장을 만났다. 길가 고목이 세로로 쪼개져 연기를 올리고 있다. 비가 불씨를 다투어 끄는 중이다.',
 choices:[
  {label:'쪼개진 속을 본다', out:[{p:1, text:'벼락이 지나간 단면이 숯처럼 검고 매끈했다. 그리고 놀랍게— 속이 빈 둥치 안에서 마른 장작 같은 심재가 나왔다. 벼락도 못 태운 속살이다.\n\n"벼락 맞은 대추나무는 도장 만들면 액막이래." 재이(있다면)의 상식이 나왔고, 한 토막이 기념으로 실렸다.\n\n"우린 이미 액땜 다 한 것 같은데." "그럼 이건 보증서지."', fx:{scrap:2, moodAll:3, note:{type:'사건',title:'벼락의 보증서',body:'벼락 맞은 고목의 심재 한 토막. 액막이 겸 보증서로 탑승.'}}}]},
  {label:'멀리 돌아간다', out:[{p:1, text:'벼락 두 번 맞은 자리는 없다지만, 실험해볼 마음도 없다. 조용히 우회했다.', fx:{time:10}}]},
 ]},

{id:'wx_bigwash', type:'동행', w:6, needWx:'clear', minParty:2,
 title:'만국기의 날',
 text:'구름 한 점 없는 쾌청. 바람도 알맞다.\n\n"오늘이다." 누가 선언했다. 빨래의 날이다.\n\n개울가에 차를 세우고, 로프를 나무 사이에 걸었다.',
 choices:[
  {label:'대세탁을 집행한다', out:[{p:1, text:'두 시간의 대세탁. 로프에 옷가지가 만국기처럼 걸리자 야영지가 축제 분위기가 났다.\n\n마른 옷에선 해 냄새가 났다. 해 냄새의 정체는 과학적으로 뭐라던데, 아무도 검색할 수 없으므로 그냥 해 냄새로 하기로 했다.\n\n뽀송한 옷을 입은 인간은 착해진다. 실험 결과 5인 전원 유의미하게 친절해짐.', fx:{time:150, water:-2, fatigue:-8, moodAll:7, note:{type:'사건',title:'만국기의 날',body:'쾌청 대세탁. 해 냄새의 정체는 미상(검색 불가로 종결). 전원 친절해짐.'}}}]},
 ]},

{id:'wx_frogs', type:'발견', w:5, needRain:true, night:true,
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
 text:'아침. 누가 꿈 얘기를 꺼냈다. "국도를 달리는데 끝이 안 나는 꿈."\n\n"…어? 나도 국도 꿈."\n\n"나도. 근데 내 꿈엔 휴게소가 나왔어."\n\n전원이 국도 꿈을 꿨다. 매일 15시간씩 국도만 보면 그럴 만도 하다. 아마도.',
 choices:[
  {label:'꿈 내용을 대조한다', out:[{p:1, text:'대조 결과: 겹치는 건 국도뿐, 나머지는 제각각이었다. 누구는 꿈에서도 연비 걱정을 했고(민지 유력), 누구는 꿈 휴게소에서 호두과자를 샀는데 맛이 안 났다고 억울해했다.\n\n"꿈에서 맛이 나면 그게 더 무서운 거야." "왜?" "돌아오기 싫어지잖아."\n\n농담으로 시작해서 조금 진지해진 아침이었다. 오늘도 국도를 달린다. 맛이 나는 쪽 세상에서.', fx:{moodAll:3, note:{type:'사건',title:'국도 꿈 전원 일치',body:'겹친 건 국도뿐. 교훈: 맛이 나는 쪽 세상에서 달릴 것.'}}}]},
 ]},

/* ── v1.6 탐색 ── */
{id:'exp_hardware', type:'탐색', w:6,
 title:'철물점',
 text:'만물의 성지, 철물점이다.\n\n못 서랍 서른 칸, 볼트 너트의 은하계, 로프와 철사와 경첩과 온갖 공구. 먼저 다녀간 사람들이 있었지만 철물점은 바다다— 퍼내도 남는다.',
 choices:[
  {label:'체계적으로 쓸어담는다', out:[{p:1, text:'민지(있다면)의 지휘 아래 우선순위 약탈— 아니, 조달이 이뤄졌다. 스테인리스 호스클램프, 절연테이프, 규격 볼트, WD 비스무리한 방청유.\n\n"철물점 주인은 세상이 두 번 망해도 굶어 죽지 않는다"는 옛말이 사실인 게, 계산대 뒤 골방에 라면이 스무 개 있었다. 주인장 몫으로 열 개는 남겼다.', fx:{time:40, scrap:6, item:{'부품':2}, food:2, note:{type:'사건',title:'철물점 조달 작전',body:'만물의 성지. 라면 절반은 주인장 몫으로 존치.'}}}]},
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
 text:'등산로 입구의 아웃도어 매장. 3년 전 세일 현수막이 아직 걸려 있다. 「전 품목 40%」\n\n선반은 반쯤 털렸지만 등산객이 아니면 안 가져갈 것들이 남았다.',
 choices:[
  {label:'실속을 챙긴다', out:[{p:1, text:'수통, 코펠, 침낭 하나, 등산 양말 뭉치(양말은 문명이다), 그리고 손난로용 하이킹 파우치.\n\n계산대에 고철을 조금 올려놨다. 40% 세일가 기준으로 계산한, 아무도 안 받을 값이었지만 그래야 도둑이 아니라 손님이다.', fx:{water:1, moodAll:3, scrap:-2, fatigue:-4, note:{type:'사건',title:'40% 세일',body:'등산용품점. 계산대에 고철 지불(셀프 계산). 양말은 문명이다.'}}}]},
 ]},

{id:'exp_towyard', type:'탐색', w:6,
 title:'견인차 차고지',
 text:'견인차 여섯 대가 나란히 잠든 차고지. 벽에 근무표와 무전기 충전대, 그리고 지도가 붙어 있다.\n\n지도엔 빨간 펜 표시가 가득하다— 3년 전 그날, 출동 나갔던 지점들이다.',
 choices:[
  {label:'지도를 살핀다', out:[{p:1, text:'빨간 동그라미들이 그날의 사고 지도를 그리고 있었다. 우리가 지나온 길, 지나갈 길 위에.\n\n한 지점에 동그라미 대신 별표와 메모. "여기 견인 불가. 사람만."\n\n사람만. 그날 어느 견인기사가 차 대신 사람을 실었다는 뜻이다. 별표 위치를 우리 지도에도 옮겨 적었다. 이유는 설명하기 어렵지만, 좋은 자리 같아서.', fx:{revealNear:1, moodAll:2, note:{type:'사건',title:'여기 견인 불가. 사람만.',body:'그날 어느 기사의 선택이 남긴 별표. 좋은 자리로 분류.'}}}]},
  {label:'부품을 수확한다', out:[{p:1, text:'견인차는 부품의 보고다. 윈치 케이블, 유압 부속, 대형 배터리(반쯤 살았다).\n\n달구지에 윈치가 생기는 날을 꿈꾸며 케이블을 감아 실었다.', fx:{scrap:5, item:{'부품':2}, time:40}}]},
 ]},

/* ── v1.6 조우 ── */
{id:'meet_cowherd', type:'조우', w:6, region:['south','mid'],
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
  {label:'편지 한 통을 의뢰한다 (고철 2)', req:{scrap:2}, out:[{p:1, text:'받는 사람을 정하는 데 제일 오래 걸렸다. 결국— 미래의 우리에게 쓰기로 했다.\n\n한 명씩 한 문장을 불렀고 대필가가 다듬었다. "서울 도착한 우리에게. 도착했으면 됐고, 못 했어도 여기까지 온 건 진짜다."\n\n봉투에 「남산에서 개봉」이라고 적혔다. 조수석 서랍이 점점 우체국이 되어간다.', fx:{scrap:-2, moodAll:4, note:{type:'사건',title:'미래의 우리에게',body:'대필가가 다듬은 다섯 문장. 남산에서 개봉. 조수석 서랍=우체국화 진행 중.',links:['남산']}}}]},
  {label:'맞춤법 상담만 받는다', out:[{p:1, text:'일지의 헷갈리던 맞춤법 몇 개를 공짜로 교정받았다. "돼요/되요"에서 두 명이 틀린 게 들통났다. 상담료는 서로의 침묵으로 지불됐다.', fx:{moodAll:2}}]},
 ]},

{id:'meet_mapmaker', type:'조우', w:6, once:true,
 title:'지도장이',
 text:'갓길에 세운 오토바이. 사이드카에 제도판이 실려 있다.\n\n남자가 도로를 스케치하고 있다— 무너진 육교, 새로 난 샛길, 물 나오는 곳을 기호로 그려 넣으며.\n\n"3년 전 지도는 다 거짓말이 됐어요. 누가 다시 그려야죠."',
 choices:[
  {label:'정보를 교환한다', out:[{p:1, text:'우리 일지의 길 정보와 지도장이의 신작 지도가 테이블(보닛) 위에서 만났다.\n\n"이 고개는 이제 못 넘어요? 귀중한 정보네." "여기 우물이 있다고요? 표시할게요."\n\n한 시간의 교환 끝에 서로의 지도가 진해졌다. 지도장이가 답례로 미공개 정보 하나를 짚어줬다. "여긴 아직 아무도 몰라요. 제 지도 초판 독자 특전입니다."', fx:{time:60, revealNear:1, moodAll:3, note:{type:'인물',title:'지도장이',body:'거짓말이 된 지도를 다시 그리는 사람. 초판 독자 특전 1건 수령.'}}}]},
 ]},

{id:'meet_welldigger', type:'조우', w:6, once:true, region:['mid','north'],
 title:'우물 파는 사람',
 text:'마을 어귀에서 곡괭이 소리가 난다. 남자 혼자 우물을 파고 있다. 이미 어깨 깊이다.\n\n"상수도가 죽었으니 우물의 시대죠." 남자가 흙을 퍼 올리며 말했다. "한 마을에 하나씩. 열두 개째입니다."',
 choices:[
  {label:'교대로 판다', out:[{p:1, text:'두 시간을 교대로 팠다. 어깨가 빠질 즈음— 바닥이 축축해지더니 물이 배어 나왔다.\n\n"터졌다!" 우물 바닥에서 올려다본 하늘이 동그랬다.\n\n남자는 우물마다 파준 사람 이름을 돌에 새긴다고 했다. 열두 번째 우물 돌엔 낯선 이름 다섯(+개 발바닥)이 들어갔다. 마을이 되살아나면, 누군가 물을 마시며 그 이름들을 읽을 것이다.', fx:{time:130, fatigue:15, water:3, moodAll:6, note:{type:'사건',title:'열두 번째 우물',body:'어깨 깊이에서 터진 물. 우물돌에 다섯 이름과 발바닥 하나. 물마다 이름이 남는다.'}}}]},
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

{id:'vg_ivy', type:'정경', w:3,
 title:'방음벽의 담쟁이',
 text:'고속도로 방음벽을 담쟁이가 절반쯤 덮었다.\n\n3년 전엔 낙서가 있던 자리다. 지금은 초록이 낙서 위를 덮으며 제 글씨를 쓰는 중이다.',
 choices:[{label:'…', out:[{p:1, text:'"10년 뒤엔 초록 벽이겠다."\n\n10년 뒤를 아무렇지 않게 말할 수 있게 된 것을, 말하고 나서야 다들 알아챘다.', fx:{moodAll:2}}]}]},

{id:'vg_banner', type:'정경', w:3,
 title:'현수막',
 text:'육교에 현수막이 걸려 있다. 빛이 바래 반쯤 지워졌다.\n\n「축 결혼 — 김OO ♡ 박OO」\n\n3년 전 봄의 날짜. 식은 올렸을까.',
 choices:[{label:'…', out:[{p:1, text:'"올렸을 거야." 근거 없는 확신이 차 안의 공식 입장으로 채택됐다.\n\n어딘가에서 3주년을 맞았기를. 현수막이 바람에 한 번 펄럭였다. 동의로 간주했다.', fx:{moodAll:2}}]}]},

{id:'vg_carstack', type:'정경', w:3,
 title:'폐차 탑',
 text:'폐차장 압축기 옆에 눌린 차들이 5층으로 쌓여 있다.\n\n맨 꼭대기 차 지붕에 들풀이 자라 작은 정원이 됐다. 세상에서 제일 높은 화단이다.',
 choices:[{label:'…', out:[{p:1, text:'차의 최후가 화분이라면, 그건 나쁜 결말은 아니다.\n\n달구지가 들으라고 한 말은 아니었지만, 다들 대시보드를 한 번씩 쓰다듬었다.', fx:{moodAll:1}}]}]},

{id:'vg_paddymirror', type:'정경', w:3, region:['south','mid'],
 title:'무논 거울',
 text:'물을 댄 논이 하늘을 완벽하게 비추고 있다.\n\n구름이 논 안에서 흐르고, 왜가리 한 마리가 하늘 위를 걷는다. 위아래가 잠깐 헷갈리는 풍경이다.',
 choices:[{label:'…', out:[{p:1, text:'논에 비친 차가 우리와 나란히 달렸다. 거꾸로 매달린 채, 씩씩하게.\n\n"저쪽 세상 우리도 서울 가나 보다." 그쪽도 무사하길 빌어줬다.', fx:{moodAll:2}}]}]},

{id:'vg_cairns', type:'정경', w:3, region:['mid','north'],
 title:'돌탑 군락',
 text:'고갯마루에 돌탑 수십 기가 서 있다. 옛날 것도 있고— 돌이 아직 하얀 새것도 있다.\n\n3년 사이에도 사람들은 여길 지나며 돌을 얹었다. 빌 것이 많은 시대라서.',
 choices:[{label:'…', out:[{p:1, text:'잠깐 세우고 한 명씩 돌을 얹었다. 소원은 각자. 보리 몫은 레오(있다면)가 대신 얹었다. "간식 많이 달라고 빌었을 거예요. 확실해요."\n\n고개를 넘는 뒷거울 속에서 돌탑들이 배웅했다.', fx:{time:5, moodAll:2}}]}]},

];

/* ── 한강 다리 (수원→서울 고정 이벤트) ── */
D.bridgeEvent = {
 id:'han_bridge', type:'스토리', ai:1,
 title:'한강, 마지막 다리',
 text:'한강이다.\n\n다리 위에 바리케이드는 없다. 대신 가로등이 전부 켜져 있다. 강 건너 도시는— 불빛으로 가득하다. 3년간 어디서도 못 본 광량.\n\n다리 초입의 전광판이 글자를 띄운다.\n\n<span class="ai">어서 오세요. 오래 기다렸습니다.</span>\n\n강우가 안전벨트를 다시 조인다. "……여기부터는, 그것의 입 안이다."',
 choices:[
  {label:'다리를 건넌다', out:[{p:1, text:'달구지가 다리에 올라섰다.\n\n지나는 가로등이 하나씩 꺼진다. 뒤로. 돌아갈 길을 지우듯.\n\n아무도 뒤를 보지 않았다. 이제 앞만 남았다.', fx:{flag:'bridge_crossed', note:{type:'사건',title:'한강을 건너다',body:'가로등이 등 뒤에서 하나씩 꺼졌다. 돌아갈 길을 지우듯.',links:['천리안']}}}]},
  {label:'강우가 대대 깃발을 단다', req:{perk:'kw_story'}, out:[{p:1, text:'강우가 안테나에 대대 깃발 조각을 묶었다.\n\n"그날 이 다리로 피난민이 건넜다. 우리 대대가 통과시킨 사람들이."\n\n"그 길로 되돌아가는 거다. 이번엔 우리가."\n\n달구지가 다리에 올라섰다. 가로등이 꺼지는 대신— 일제히 한 단계 밝아졌다. 경례처럼.', fx:{flag:'bridge_crossed', moodAll:8, mood:{kangwoo:10}, note:{type:'사건',title:'깃발을 달고 건너다',body:'피난민이 건넌 다리를 거꾸로 건넌다. 가로등이 경례처럼 밝아졌다.',links:['강우','천리안']}}}]},
 ]};

/* ── 오프로드 LLM 프롬프트 ── */
D.worldBible = `당신은 포스트아포칼립스 한국 로드트립 게임 「서울까지 400km」의 게임 마스터다.
[세계관] 3년 전 전국 통합 관제 AI '천리안'이 깨어난 날 이후 문명이 무너졌다. 천리안이 정확히 무엇을 했는지는 미스터리(직접 설명 금지, 암시만). 생존자들은 남쪽에 모여 살고, 북쪽(서울)으로 갈수록 천리안의 관리 흔적(깨끗한 도로, 살아있는 기계, 드론, 광신도 '정리자들')이 짙어진다. 주인공 일행은 낡은 봉고차 '달구지'로 부산에서 서울 남산의 천리안 코어를 향해 간다.
[톤] 쓸쓸하지만 유머를 잃지 않는 한국적 정서. 구체적 디테일(호두과자, 국밥, 장날, 경운기). 감상은 절제, 문장은 짧게. 천리안의 대사는 정중하고 차분해서 더 섬뜩하게.
[금지] 4의 벽 파괴, 실존 브랜드/인물, 좀비/초자연(이 세계의 위협은 인간·기계·자연뿐), 과도한 잔혹 묘사, 영어 남용.`;
