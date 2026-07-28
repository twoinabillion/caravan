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
];
for (const [pattern, label] of stalePatterns) {
  if (pattern.test(source)) errors.push(label);
}

for (const page of D.intro || []) {
  if (!Array.isArray(page.beats) || page.beats.length < 4) {
    errors.push(`인트로 화자 턴 부족: ${page.scene || page.title}`);
    continue;
  }
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

const aiTells = [
  /이를 통해/, /더 나아가/, /전반적으로/, /결론적으로/,
  /핵심은/, /의미합니다/, /판단됩니다/, /필요가 있습니다/,
  /선이 아니라 삶/,
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
