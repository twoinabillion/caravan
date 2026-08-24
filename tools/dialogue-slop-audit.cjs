#!/usr/bin/env node
'use strict';

/*
 * hardikpandya/stop-slop의 산문 편집 원칙을 한국어 게임 대사에 맞게
 * 재구성한 휴리스틱 감사 도구다. 질문·부사·짧은 문장을 금지하지 않는다.
 * 후보를 찾을 뿐이며 나이, 관계, 감정, 지식 범위는 사람이 판단한다.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dump = spawnSync(process.execPath, [path.join(__dirname, 'dialogue-lint.cjs'), '--dump'], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
});
if (dump.status !== 0) {
  process.stderr.write(dump.stderr || dump.stdout || '대사 원문을 불러오지 못했습니다.\n');
  process.exit(dump.status || 1);
}

const lines = dump.stdout.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
const checks = [
  ['번역투 연결어', /(?:이를 통해|더 나아가|전반적으로|결론적으로|종합적으로|필요가 있습니다|판단됩니다)/],
  ['정답형 대조 공식', /(?:중요한|문제|핵심|답|선택|판단)[^.!?]{0,55}(?:아니라|아니고)/],
  ['작가의 결론 대행', /(?:사람도 같다|설명이 필요 없었다|의 몫이다|다른 종류의 여행|살 사람 얼굴|지키는 사람들이|정보로 바뀌자)/],
  ['부정 나열', /(?:아니라|아니고)[^.!?]{0,70}(?:아니라|아니고)/],
  ['극적 정정 기호', /(?:—|--|…)[ ]*(?:아니라|가 아니라)/],
  ['과장 목발', /(?:말 그대로|완전히|절대적으로|분명히|명백히|그 자체로)/],
  ['독자 지시·메타 설명', /(?:알 수 있다|보여준다|의미한다|상징한다|이해할 수 있다)[.!?]?$/],
];

const findings = [];
for (const text of lines) {
  for (const [rule, pattern] of checks) if (pattern.test(text)) findings.push({ rule, text });
  const sentences = text.split(/(?<=[.!?。？！])\s+/);
  if (sentences.some(sentence => sentence.length > 145)) findings.push({ rule: '한 호흡 145자 초과', text });
}
const grouped = findings.reduce((out, item) => {
  (out[item.rule] ||= []).push(item);
  return out;
}, {});

if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify({ source: 'hardikpandya/stop-slop (adapted)', lines: lines.length, findings }, null, 2));
  process.exit(0);
}
console.log(`stop-slop 한국어 대사 감사: ${lines.length}줄 / 검토 후보 ${findings.length}건`);
for (const [rule, items] of Object.entries(grouped)) {
  console.log(`\n[${rule}] ${items.length}건`);
  for (const item of items.slice(0, 5)) console.log(`- ${item.text.slice(0, 180)}`);
  if (items.length > 5) console.log(`- …외 ${items.length - 5}건`);
}
console.log('\n주의: 후보 수는 품질 점수가 아니다. 사투리, 농담, 천리안의 행정 음성은 문맥상 유지할 수 있다.');
