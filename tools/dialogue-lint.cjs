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
for (const [id, npc] of Object.entries(D.npcs || {})) {
  add('npc', id, npc.greet0);
  add('npc', id, npc.greetGood);
  add('npc', id, npc.greetBad);
  add('npc', id, npc.rumor && npc.rumor.text);
}
for (const item of D.radioTexts || []) add('radio', 'radio', typeof item === 'string' ? item : item.t);

const errors = [];
const warnings = [];
const personIds = new Set(Object.keys(D.comps || {}));

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
  rq_minji_join: [/서울까지 같이 가고 싶어요/, /손님 자리가 아니라 네 자리를 만들자/],
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
];
for (const sample of samples) {
  const hit = aiTells.find(pattern => pattern.test(sample.text));
  if (hit) warnings.push(`${sample.scope}/${sample.speaker}: ${sample.text}`);
  if (sample.text.length > 135) warnings.push(`긴 한 호흡 ${sample.scope}/${sample.speaker} (${sample.text.length}자)`);
}

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
