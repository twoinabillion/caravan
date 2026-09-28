const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');

const root = path.resolve(__dirname, '..');
const dir = path.join(__dirname, 'design-drafts');
const html = fs.readFileSync(path.join(dir, 'result-quiet.html'), 'utf8');
const css = fs.readFileSync(path.join(dir, 'result-quiet.css'), 'utf8');
const source = fs.readFileSync(path.join(root, 'src/03-data.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
const sheet = postcss.parse(css);

test('draft is registered once and every manifest file exists', () => {
  assert.equal(manifest.version, 1);
  assert.equal(new Set(manifest.drafts.map(d => d.id)).size, manifest.drafts.length);
  const draft = manifest.drafts.filter(d => d.id === 'result-quiet-v1');
  assert.equal(draft.length, 1);
  assert.equal(draft[0].file, 'result-quiet.html');
  assert.match(draft[0].description, /게임·저장은 그대로/);
  assert.match(draft[0].description, /시각 검수.*미완료/);
  for (const d of manifest.drafts) assert.ok(fs.existsSync(path.join(dir, d.file)), d.file);
});

test('prototype has no executable content, external requests, forms or gameplay wiring', () => {
  assert.doesNotMatch(html, /<(?:script|iframe|object|embed|form)\b|\bon\w+\s*=|javascript:|data-(?:r|i|a|nav-depart)\s*=/i);
  assert.match(html, /default-src 'none'; style-src 'self'; form-action 'none'; base-uri 'none'/);
  const references = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(m => m[1]);
  assert.ok(references.every(r => r.startsWith('#') || r === 'result-quiet.css'));
  assert.doesNotMatch(css, /url\s*\(|@import/i);
  const build = fs.readFileSync(path.join(root, 'build.sh'), 'utf8');
  assert.doesNotMatch(build, /result-quiet/);
});

test('native controls have labels and every return link has a unique local destination', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id), id);
  for (const [, id] of html.matchAll(/for="([^"]+)"/g)) assert.ok(ids.includes(id), id);
  assert.match(html, /<label><input type="radio"[^>]+id="rq-after" checked>/);
  assert.match(html, /<label><input type="radio"[^>]+id="rq-before">/);
  assert.match(html, /<label[^>]*><input type="checkbox" id="rq-large">/);
  assert.match(html, /<details class="rq-record">\s*<summary>기록 보기<\/summary>/);
  assert.match(css, /\.rq-stage:has\(\.rq-return:target\) \.rq-reading \{ display: none; \}/);
  assert.match(css, /\.rq-return:target \{ display: block; \}/);
});

test('current record preserves source wording while the next action does not promise key extraction', () => {
  const event = source.slice(source.indexOf("id:'story_family_principle'"));
  const note = event.match(/note:\{type:'사건',title:'예측은 명령이 아니다',body:'([^']+)'/);
  assert.ok(note, 'source note');
  assert.ok(html.includes(note[1]), 'original note body preserved');
  const proposed = html.match(/<section class="rq-current rq-proposed"[\s\S]*?<\/section>/)[0];
  const firstView = proposed.split('<details')[0];
  assert.match(firstView, /부모님 영상의 끊긴 말을 복원했다/);
  assert.match(firstView, /검증키 확인/);
  assert.match(firstView, /수원 성곽 공동체에서 <strong>주변 탐색/);
  assert.match(firstView, /열람 준비 30분/);
  assert.doesNotMatch(firstView, /새 기록|기억됨|메인 스토리 갱신|꺼낸다|공주|기분|\+2/);
  assert.match(proposed, /다음 기록<\/dt><dd>교환소 앞 달구지의 검증키/);
});

test('fictional fixtures are labelled; gains and losses remain outside disclosures', () => {
  assert.match(html, /가상 수리 결과 — 수치와 문구는 배치 확인용/);
  assert.match(html, /가상 장면 — 추가 기록·목표·자원 변화 없음/);
  const resources = html.match(/<section class="rq-resources"[\s\S]*?<\/section>/)[0];
  assert.match(resources, /고철<\/dt><dd class="rq-loss">−4/);
  assert.match(resources, /차체<\/dt><dd>\+12/);
  assert.match(resources, /40분 경과/);
  assert.doesNotMatch(resources, /<details/);
  const empty = html.match(/<section class="rq-empty"[\s\S]*?<\/section>/)[0];
  assert.doesNotMatch(empty, /<details|<aside|rq-changes|변화 없음/);
  for (const value of ['resources', 'empty']) {
    assert.ok(css.includes(`#rq-case option[value="${value}"]:checked) :is(.rq-current, .rq-comparison)`));
  }
});

test('CSS parses and keeps result content in flow without clipping, fixed heights or override stacking', () => {
  let rules = 0;
  sheet.walkRules(() => rules++);
  assert.ok(rules > 30);
  sheet.walkDecls(d => {
    assert.equal(d.important, undefined, d.toString());
    if (/^(?:height|max-height)$/.test(d.prop)) {
      assert.equal(d.parent.selector, '.rq-review input', d.toString());
    }
    assert.ok(!(d.prop.startsWith('overflow') && /hidden|clip/.test(d.value)), d.toString());
    assert.ok(!(d.prop === 'position' && /absolute|fixed/.test(d.value)), d.toString());
  });
  assert.match(css, /width: min\(100%, 480px\)/);
  assert.match(css, /overflow-wrap: anywhere; word-break: keep-all/);
  assert.match(css, /#rq-large:checked[\s\S]*--rq-body: 21px; --rq-detail: 19px/);
  assert.match(css, /:focus-visible/);
});

test('main text, secondary text, loss text and action labels meet 4.5:1 contrast', () => {
  const luminance = hex => {
    const channels = hex.match(/[\da-f]{2}/g).map(v => parseInt(v, 16) / 255)
      .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return channels.reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  };
  for (const [fg, bg] of [['243a33', 'f4efe3'], ['4d6255', 'f4efe3'], ['4d6255', 'dde2d8'], ['853e2b', 'f4efe3'], ['fff7e6', '315649']]) {
    const a = luminance(fg), b = luminance(bg);
    assert.ok((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5, `${fg}/${bg}`);
  }
});
