'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {STATIC_CONTENT_FILES} = require('../tools/content-registry.cjs');
const root = path.resolve(__dirname, '..');

function validate(mutation = '') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'caravan-speaker-validator-'));
  try {
    for (const file of [...STATIC_CONTENT_FILES, 'tools/content-registry.cjs', 'tools/validate-content.cjs']) {
      fs.mkdirSync(path.dirname(path.join(dir, file)), {recursive:true});
      fs.copyFileSync(path.join(root, file), path.join(dir, file));
    }
    if (mutation) fs.appendFileSync(path.join(dir, STATIC_CONTENT_FILES.at(-1)), '\n' + mutation + '\n');
    const result = spawnSync(process.execPath, ['tools/validate-content.cjs'], {cwd:dir, encoding:'utf8'});
    assert.equal(result.error, undefined);
    return {status:result.status, output:result.stdout + result.stderr};
  } finally {
    fs.rmSync(dir, {recursive:true, force:true});
  }
}

test('build content validation accepts actual crew word-game speaker routes', () => {
  const result = validate();
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /콘텐츠 참조 정상/);
});

test('crew speaker tokens remain valid in object descriptors as well as strings', () => {
  const result = validate("D.eventTurnScripts.comp_wordchain.text[0]={who:'party_first',name:'첫 동료'};D.eventTurnScripts.comp_wordchain.text[1]={who:'party_second',name:'둘째 동료'};");
  assert.equal(result.status, 0, result.output);
});

test('adding the second-crew token does not accept unknown crew roles', () => {
  const result = validate("D.eventTurnScripts.comp_wordchain.text[1]={who:'party_third',name:'미지원 역할'};");
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /turnScript:comp_wordchain\.text: 없는 화자 party_third/);
});
