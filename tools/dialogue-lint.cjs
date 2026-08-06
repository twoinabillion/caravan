#!/usr/bin/env node
/*
 * 한국어 대사 품질 게이트.
 * 사용:
 *   node tools/dialogue-lint.cjs
 *   node tools/dialogue-lint.cjs --dump
 *
 * 자동 판정은 연기와 맥락을 대신하지 않는다. 여기서는 몰입을 확실히 깨는
 * 항목(화자 이름을 단 행동 지문, 임시 플레이어 표기, 폐기된 3년 설정)과
 * 한국어 AI 문체의 대표적인 연결어만 연기 테스트 전 스모크 검사한다.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', '03-data.js'), 'utf8');
const D = new Function(source + '\nreturn D;')();
const dump = process.argv.includes('--dump');

/* 검사 결과 수집 — 아래 최상위 검사들이 곧바로 push하므로 반드시 먼저 선언한다 */
const errors = [];
const warnings = [];

const samples = [];
const companionIds = Object.keys(D.comps || {});
const allFlags = Object.fromEntries([
  'mansu', 'mingyu_reunion', 'deserter_saved', 'core_transfer',
  'core_sleep', 'traces_presented', 'full_crew_testimony',
  ...(D.resistance || []).map(item => item.flag),
  ...(D.eraTraces || []).map(item => item.flag),
].map(flag => [flag, true]));
const dialogueStates = [
  {day:10, party:[], flags:{mansu:0}, wxNext:'clear'},
  {day:20, party:companionIds.slice(0, 3), flags:{...allFlags, mansu:1, core_transfer:false}, wxNext:'rain'},
  {day:40, party:companionIds, flags:{...allFlags, mansu:3, core_transfer:false, core_sleep:true}, wxNext:'storm'},
];

const add = (scope, speaker, text) => {
  if (typeof text !== 'string' || !text.trim()) return;
  samples.push({scope, speaker, text:text.replace(/<[^>]+>/g, '').trim()});
};
const addQuoted = (scope, text) => {
  if (typeof text !== 'string') return;
  const humanText = text.replace(/<span class=["']ai["']>[\s\S]*?<\/span>/g, '');
  for (const match of humanText.matchAll(/["“]([^"”\n]{2,})["”]/g)) add(scope, 'event', match[1]);
};
const addQuotedVariants = (scope, value) => {
  if (typeof value !== 'function') {
    addQuoted(scope, value);
    return;
  }
  const variants = new Set();
  for (const state of dialogueStates) {
    try {
      global.S = state;
      const result = value(state);
      if (typeof result === 'string') variants.add(result);
    } catch (error) {
      throw new Error(`${scope} 동적 대사 평가 실패: ${error.message}`);
    }
  }
  delete global.S;
  for (const text of variants) addQuoted(scope, text);
};

for (const chat of D.chats || []) {
  for (const [speaker, text] of chat.lines || []) add('chat', speaker, text);
}
for (const item of D.banter || []) {
  if (item.who !== 'sys' && !(item.who === '나' && /^\s*\(/.test(item.t))) {
    add('banter', item.who, item.t);
  }
}
const allEvents = [
  ...(D.events || []),
  ...(D.seoulStops || []),
  ...[D.bridgeEvent, D.gateEvent, D.seoulOpenEvent].filter(Boolean),
];
for (const event of allEvents) {
  addQuotedVariants(event.id, event.text);
  for (const choice of event.choices || []) {
    addQuotedVariants(event.id, choice.label);
    for (const outcome of choice.out || []) addQuotedVariants(event.id, outcome.text);
  }
}
for (const page of D.intro || []) {
  addQuoted('intro', page.text);
  for (const turn of page.beats || []) {
    if (['dialogue','thought','letter'].includes(turn.kind)) add('intro-turn', turn.name || turn.who, turn.text);
  }
}

/* 인트로의 핵심 정보는 '설명을 들음 → 확인 행동 → 출발 결정' 순서로
   도착해야 한다. 키워드가 모두 있어도 순서가 뒤집히면 1에서 5로 건너뛴
   것처럼 보이므로, 플레이어가 실제로 보게 되는 턴 순서를 함께 검사한다. */
const introByScene = new Map((D.intro || []).map(page => [page.scene, page]));
const introTurnIndex = (scene, pattern) => {
  const page=introByScene.get(scene);
  return page ? (page.beats || []).findIndex(turn => pattern.test(turn.text || '')) : -1;
};
const requireIntroOrder = (scene, steps) => {
  let previous=-1;
  for(const [label,pattern] of steps){
    const index=introTurnIndex(scene,pattern);
    if(index<0 || index<=previous){
      errors.push(`인트로 인과 단계 누락·역전: ${scene} / ${label}`);
      return;
    }
    previous=index;
  }
};
requireIntroOrder('intro-parents-discovery', [
  ['아이의 가족 질문', /엄마랑 아빠도/],
  ['할아버지의 불확실성', /확실히 몰랐어/],
  ['부모가 발견한 승인 공백', /승인자 칸은 비어/],
]);
requireIntroOrder('intro-envelope-signal', [
  ['장례 직후 출발 금지', /곧장 시동부터 걸지는 마라/],
  ['전압 점검 행동', /전압 점검/],
  ['남산 호출', /기록 대조를 요청합니다/],
  ['그날은 출발하지 않음', /아무것도 싣지 않았다/],
]);
requireIntroOrder('intro-departure-choice', [
  ['불완전한 장치 인정', /아직은 몰라/],
  ['추가 기록 필요', /같은 이송을 겪은 사람/],
  ['동행은 본인 선택', /같은 곳까지 가겠다는 사람/],
  ['행동 시한 선언', /스무 날 안에/],
]);
const currentTransfer=introByScene.get('intro-current-expulsion');
const childTransferSpeech=(currentTransfer&&currentTransfer.beats||[])
  .filter(turn=>turn.kind==='dialogue'&&turn.who==='intro_child')
  .map(turn=>turn.text).join('\n');
if(/제7\s*구역.*20kg|검문소.*통행/s.test(childTransferSpeech)){
  errors.push('8살 도윤이 행정 정보를 완성된 문장으로 대신 설명함');
}
for (const [id, npc] of Object.entries(D.npcs || {})) {
  add('npc', id, npc.greet0);
  add('npc', id, npc.greetGood);
  add('npc', id, npc.greetBad);
  add('npc', id, npc.rumor && npc.rumor.text);
}
for (const item of D.radioTexts || []) add('radio', 'radio', typeof item === 'string' ? item : item.t);

const personIds = new Set(Object.keys(D.comps || {}));

for (const id of personIds) {
  const voice=D.companionVoices&&D.companionVoices[id];
  if(!voice) errors.push(`동료 목소리 시트 누락: ${id}`);
  else if(!Array.isArray(voice.forbidden)||voice.forbidden.length<3)
    errors.push(`동료 금지 범용 표현 부족: ${id}`);
}

/* 화자 스크립트와 연쇄 사건은 대사 자체가 자연스러워도 연결 키 하나가
   어긋나면 화면에서 갑자기 다른 사람이 말하거나 앞 설명 없이 다음 장면이 뜬다.
   긴 시나리오를 추가할 때 그 회귀를 데이터 단계에서 막는다. */
const eventById = new Map(allEvents.map(event => [event.id, event]));
const speakerIds = new Set([
  ...Object.keys(D.comps || {}), ...Object.keys(D.npcs || {}),
  'me','나','sys','record','radio','cheollian','grandfather','mother','father',
  'player_child','intro_child','unknown','passer_man','passer_woman','passer_elder',
  'passer_child','passer_merchant','passer_guard','passer_refugee','passer_worker',
  'passer_medic','seoyeon','mingyu'
]);
const validateSpeaker = (value, scope) => {
  const who=typeof value==='string'?value:value&&value.who;
  if(!who) errors.push(`화자 스크립트 빈 값: ${scope}`);
  else if(!speakerIds.has(who)) errors.push(`등록되지 않은 화자: ${scope} / ${who}`);
  if(value&&typeof value==='object'&&value.kind==='dialogue'&&!value.name)
    errors.push(`익명 대화 화자 이름 누락: ${scope} / ${who}`);
};
for (const [eventId, script] of Object.entries(D.eventTurnScripts || {})) {
  const event=eventById.get(eventId);
  if(!event){ errors.push(`화자 스크립트의 사건 누락: ${eventId}`); continue; }
  for(const [index,value] of (script.text||[]).entries()) validateSpeaker(value,`${eventId}.text.${index}`);
  for(const [path, speakers] of Object.entries(script.choices||{})){
    const [choiceIndex,outcomeIndex]=path.split('.').map(Number);
    const outcome=event.choices&&event.choices[choiceIndex]&&event.choices[choiceIndex].out
      &&event.choices[choiceIndex].out[outcomeIndex];
    if(!outcome) errors.push(`화자 스크립트 결과 경로 누락: ${eventId} / ${path}`);
    for(const [index,value] of (speakers||[]).entries()) validateSpeaker(value,`${eventId}.${path}.${index}`);
  }
}
for (const event of allEvents) {
  for (const [choiceIndex,choice] of (event.choices||[]).entries()) {
    for (const [outcomeIndex,outcome] of (choice.out||[]).entries()) {
      const target=outcome.fx&&outcome.fx.chain;
      if(target&&!eventById.has(target)) errors.push(`연쇄 사건 대상 누락: ${event.id} ${choiceIndex}.${outcomeIndex} → ${target}`);
      if(target===event.id) errors.push(`자기 자신으로 되도는 연쇄 사건: ${event.id}`);
    }
  }
}
for (const eventId of Object.keys(D.storyContext||{})) {
  if(!eventById.has(eventId)) errors.push(`앞 이야기 문맥의 사건 누락: ${eventId}`);
}

for (const item of D.banter || []) {
  if (personIds.has(item.who) && /^\s*\(/.test(item.t || '')) {
    errors.push(`행동 지문에 인물 화자 지정: ${item.who} — ${item.t}`);
  }
}
for (const chat of D.chats || []) {
  for (const [speaker, text] of chat.lines || []) {
    if (speaker !== 'sys' && /^\s*\(/.test(text || '')) {
      errors.push(`티키타카 행동 지문에 화자 지정: ${speaker} — ${text}`);
    }
  }
}

const stalePatterns = [
  [/형\(주인공\)/, '임시 플레이어 표기 "형(주인공)"'],
  [/(?<!\d)3\s*년|(?<![가-힣])(?:삼|三)\s*년/, '폐기된 3년 설정'],
  [/정\s*박사/, '만나지 않은 인물 "정 박사"'],
  [/답보다\s*먼저\s*지켜야\s*하는\s*건\s*질문/, '맥락 없이 결론부터 말하는 폐기 대사'],
  [/문을\s*잠그고\s*이름을\s*고른/, '서로 무관한 행동을 억지로 연결한 폐기 대사'],
  [/내리막에선\s*기어를\s*풀고/, '위험한 내리막 중립 주행 안내'],
  [/차는\s*사람을\s*고친다/, '구체적 행동 없이 감정만 요구하는 폐기 대사'],
  [/배터리는\s*이\s*년치를\s*걸어/, '사람이 쓰지 않는 어색한 배터리 표현'],
  [/아이에게\s*빌린\s*(?:빈\s*)?이송표/, '아이의 필수 서류를 빌려 가는 폐기 설정'],
  [/이제\s*대답하러\s*갈\s*거야/, '감정 반응 없이 결론부터 말하는 민지 폐기 대사'],
  [/이제\s*출발해도\s*돼요/, '신호 직후 합류를 확정하는 민지 폐기 대사'],
  [/사람이\s*셋이면\s*셋이\s*(?:잘|누울)\s*수\s*있는/, '동료를 만나기 전 탑승을 기정사실로 한 폐기 대사'],
  [/사람이\s*늘면\s*자리도\s*늘려야지/, '동료를 만나기 전 증축을 기정사실로 한 폐기 대사'],
];
for (const [pattern, label] of stalePatterns) {
  if (pattern.test(source)) errors.push(label);
}

for (const page of D.intro || []) {
  if (!Array.isArray(page.beats) || page.beats.length < 8) {
    errors.push(`인트로 화자 턴 부족: ${page.scene || page.title}`);
    continue;
  }
  const spoken=page.beats.filter(turn=>['dialogue','thought','letter','ai'].includes(turn.kind));
  const speakers=new Set(page.beats.filter(turn=>turn.kind==='dialogue').map(turn=>turn.who));
  if(spoken.length<5) errors.push(`인트로 문답 부족: ${page.scene || page.title}`);
  /* 유품을 정리하거나 장치를 확인하는 장면은 혼자 있는 것이 서사적으로 맞다.
     solo 장면에 억지 대화 상대를 만들지 않고, 생각·편지 턴의 충분한 호흡만 검사한다. */
  if(!page.solo&&speakers.size<2) errors.push(`인트로 대화 상대 부족: ${page.scene || page.title}`);
  for (const [index, turn] of page.beats.entries()) {
    if (!turn.kind || typeof turn.text !== 'string' || !turn.text.trim()) {
      errors.push(`인트로 빈 턴: ${page.scene || page.title} #${index + 1}`);
    }
    if (['dialogue','thought','letter'].includes(turn.kind) && (!turn.who || !turn.name)) {
      errors.push(`인트로 화자 누락: ${page.scene || page.title} #${index + 1}`);
    }
    if (turn.kind === 'ai' && turn.who !== 'cheollian') {
      errors.push(`인트로 AI 출처 누락: ${page.scene || page.title} #${index + 1}`);
    }
  }
}

/* 합류 장면은 동료가 갑자기 승차를 선언하지 않는다.
   이전 과제의 감정선과 별개로, 화면 안에서도 제안→응답→자리 마련이 읽혀야 한다. */
const recruitJoinRules = {
  rq_minji_join: [/서울까지\. 같이 가도 돼요/, /네 자리부터 만들자고/],
  rq_parkss_join: [/같이 가실래요/, /좋소/],
  rq_leo_join: [/서울까지 같이 갈래요/, /저희 둘 다요/],
  rq_jaeyi_join: [/서울까지 쓸 자리를 만들죠/, /이 레일 한 칸 써도 돼요/],
  rq_eunsu_join: [/같이 갈래요/, /갈게요/],
  rq_kangwoo_join: [/서울까지 같이 갑니까/, /간다/],
};
for (const [id, patterns] of Object.entries(recruitJoinRules)) {
  const event = allEvents.find(item => item.id === id);
  if (!event || typeof event.text !== 'string') {
    errors.push(`합류 장면 누락: ${id}`);
    continue;
  }
  let previous = -1;
  for (const pattern of patterns) {
    const match = event.text.match(pattern);
    const index = match ? event.text.indexOf(match[0]) : -1;
    if (index < 0 || index <= previous) {
      errors.push(`합류 대화의 제안→응답 순서 깨짐: ${id} / ${pattern}`);
      break;
    }
    previous = index;
  }
  const joins = (event.choices || []).flatMap(choice => choice.out || [])
    .filter(outcome => outcome.fx && outcome.fx.offerComp);
  if (joins.length !== 1) errors.push(`합류 확정 분기 수 이상: ${id} (${joins.length})`);
}
for (const id of Object.keys(D.comps || {})) {
  const task=eventById.get(`rq_${id}_task`);
  const follow=eventById.get(`rq_${id}_follow`);
  const join=eventById.get(`rq_${id}_join`);
  if(!task||!follow||!join) continue;
  const taskOut=(task.choices||[]).flatMap(choice=>choice.out||[]);
  const followOut=(follow.choices||[]).flatMap(choice=>choice.out||[]);
  if(taskOut.some(out=>!(out.fx&&out.fx.recruitRoad===id)))
    errors.push(`동료 과제 결과가 후속 체험으로 이어지지 않음: ${id}`);
  if(followOut.some(out=>!(out.fx&&out.fx.recruitReady===id&&out.fx.chain===join.id)))
    errors.push(`동료 합류 전 망설임·확인 단계 누락: ${id}`);
}

const introGrandfatherTerms = (D.intro || []).flatMap(page => page.beats || [])
  .filter(turn => turn.kind === 'dialogue' && turn.who === 'grandfather')
  .map(turn => turn.text)
  .join('\n');
if (/KOR-LOCAL|TIANYAN|케이오알\s*로컬/.test(introGrandfatherTerms)) {
  errors.push('할아버지가 제품명·내부 용어를 설명하는 인트로 회귀');
}

const aiTells = [
  /이를 통해/, /더 나아가/, /전반적으로/, /결론적으로/,
  /핵심은/, /의미합니다/, /판단됩니다/, /필요가 있습니다/,
  /선이 아니라 삶/, /해야 하는 건 (?:질문|답|사람|길)/,
  /중요한 건/, /문제는 [^.!?]{0,45}(?:아니라|아냐)/,
  /(?:선택|판단|질문|답|이유)(?:은|이|가|을) [^.!?]{0,45}의 몫/,
];
for (const sample of samples) {
  const hit = aiTells.find(pattern => pattern.test(sample.text));
  if (hit) warnings.push(`${sample.scope}/${sample.speaker}: ${sample.text}`);
  if (sample.text.length > 135) warnings.push(`긴 한 호흡 ${sample.scope}/${sample.speaker} (${sample.text.length}자)`);
}

/* 한 인물의 여러 대사가 같은 첫마디로 시작하면 장면이 달라도 음성이
   템플릿처럼 들린다. 열 번 이상 반복되는 시작만 수동 검토 후보로 올린다. */
for (const id of personIds) {
  const openings=new Map();
  for (const sample of samples.filter(item=>item.speaker===id)) {
    const opening=sample.text.replace(/^[\s…·,.!?"“”']+/,'').split(/[\s,.!?]/)[0].slice(0,8);
    if(opening.length<2) continue;
    openings.set(opening,(openings.get(opening)||0)+1);
  }
  for (const [opening,count] of openings) if(count>=10)
    warnings.push(`반복 문장 시작 ${id} / 「${opening}」 ${count}회`);
}

/* 서술 목발 단어 총량 상한 — 세계 전체가 한 사람의 리듬으로 말하지 않게.
   상한은 2026-08 경구 다이어트로 낮춘 값에 고정한다. 늘어나면 게이트가 막는다. */
const crutchCaps = [['한참', 45], ['처음으로', 36], ['백미러', 66]];
for (const [word, cap] of crutchCaps) {
  const count = (source.match(new RegExp(word, 'g')) || []).length;
  if (count > cap) errors.push(`목발 단어 「${word}」 ${count}회 > 상한 ${cap}회 — 동의어로 흩거나 문장을 바꿀 것`);
}

/* 경구 종결 비율 — 이벤트 결과문이 "X는 Y다"식 짧은 단정으로 닫히는 빈도.
   개별로는 좋은 문장이라 금지하지 않고, 비율만 감시한다 (늘면 게이트). */
const outcomeTexts = [];
for (const ev of D.events || []) {
  for (const choice of ev.choices || []) {
    for (const out of (typeof choice.out === 'object' && Array.isArray(choice.out)) ? choice.out : []) {
      if (typeof out.text === 'string') outcomeTexts.push(out.text);
    }
  }
}
const aphorismEnd = (text) => {
  const plain = text.replace(/<[^>]+>/g, '').trim();
  const lastSentence = plain.split(/\n+/).pop().trim();
  return lastSentence.length > 0 && lastSentence.length <= 30 &&
    /(?:은|는|이|가|도) [가-힣 ]{1,14}(?:이)?다[.」"']?$/.test(lastSentence);
};
const aphorismCount = outcomeTexts.filter(aphorismEnd).length;
const aphorismRatio = outcomeTexts.length ? aphorismCount / outcomeTexts.length : 0;
console.log(`경구 종결 ${aphorismCount}/${outcomeTexts.length} (${Math.round(aphorismRatio * 100)}%)`);
if (aphorismRatio > 0.16) errors.push(`경구 종결 비율 ${Math.round(aphorismRatio * 100)}% > 상한 16% — 결과문을 행동이나 여백으로 닫을 것`);

if (dump) {
  for (const sample of samples) {
    process.stdout.write(`${sample.text}\n`);
  }
  process.exit(0);
}

const counts = samples.reduce((out, item) => {
  out[item.scope === 'chat' ? '티키타카' : item.scope === 'banter' ? '주행 대사' :
      item.scope === 'npc' ? 'NPC' : item.scope === 'radio' ? '라디오' :
      item.scope === 'intro-turn' ? '인트로 턴' : '대화 이벤트']++;
  return out;
}, {'티키타카':0, '주행 대사':0, 'NPC':0, '라디오':0, '인트로 턴':0, '대화 이벤트':0});

console.log(`대사 샘플 ${samples.length}줄 ${JSON.stringify(counts)}`);
for (const warning of warnings.slice(0, 12)) console.log(`⚠️ ${warning}`);
if (warnings.length > 12) console.log(`⚠️ 추가 검토 후보 ${warnings.length - 12}줄`);
if (errors.length) {
  for (const error of errors) console.log(`❌ ${error}`);
  console.log(`\n대사 게이트 실패 ${errors.length}건`);
  process.exit(1);
}
console.log(`✅ 몰입 파괴 항목 0건 (수동 검토 후보 ${warnings.length}건)`);
