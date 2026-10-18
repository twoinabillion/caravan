const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const folder = path.join(root, 'tools/design-drafts');
const html = fs.readFileSync(path.join(folder, 'name-introduction.html'), 'utf8');
const css = fs.readFileSync(path.join(folder, 'name-introduction.css'), 'utf8');

test('name proposal is registered but isolated from game, storage, forms and scripts', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(folder, 'manifest.json'), 'utf8'));
  assert.equal(new Set(manifest.drafts.map(d => d.id)).size, manifest.drafts.length);
  const entry = manifest.drafts.slice(0, 40).find(d => d.id === 'name-introduction-v1');
  assert.equal(entry.file, 'name-introduction.html');
  assert.match(entry.description, /固定|고정 이름/);
  assert.match(entry.description, /자동 적용하지 않습니다/);
  assert.doesNotMatch(html, /<script\b|<iframe\b|<form\b|\bon\w+\s*=|localStorage|sessionStorage|javascript:/i);
  assert.match(html, /default-src 'none'/);
  assert.match(html, /form-action 'none'/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'tools/build-html.mjs'), 'utf8'), /name-introduction/);
  for (const [, file] of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)) {
    assert(!/^https?:|^\/\//.test(file), file);
    assert(fs.existsSync(path.resolve(folder, file)), file);
  }
});

test('questions, response, back, next context and packing have valid native navigation', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, target] of html.matchAll(/(?:href="#|for=")([^"]+)"/g)) assert(ids.includes(target), target);
  for (const [, names] of html.matchAll(/aria-(?:labelledby|describedby)="([^"]+)"/g)) {
    for (const name of names.split(/\s+/)) assert(ids.includes(name), name);
  }
  assert.match(html, /id="example-name" value="다온" readonly/);
  assert.match(html, /실제 입력은 게임 연결 단계에 구현합니다/);
  assert.match(html, /이름을 말한다/);
  assert.match(html, /엄마, 다온 아저씨래/);
  const packing = html.match(/<section id="packing"[\s\S]*?<\/section>/)[0];
  assert.doesNotMatch(packing, /type="text"|기록할 이름|example-name/);
  assert.match(html, /다음은 감천 작업장/);
  assert.match(html, /어느 쪽을 골라도 이어집니다/);
});

test('packing retains exact authored additions and totals without a name field', () => {
  const data = fs.readFileSync(path.join(root, 'src/03-data.js'), 'utf8');
  const { packs, supplies } = vm.runInNewContext(data.slice(0, data.indexOf('D.transferDeadlineDay')) + ';({packs:D.departurePacks,supplies:D.departureSupplies})');
  const fields = ['fuel', 'scrap', 'water', 'food', 'parts', 'van'];
  assert.equal((html.match(/name="cargo"/g) || []).length, 3);
  assert.equal((html.match(/name="cargo"[^>]*\bchecked\b/g) || []).length, 1);
  for (const [id, pack] of Object.entries(packs)) {
    const choice = html.match(new RegExp(`<input id="cargo-${id}"[\\s\\S]*?</label>`))[0];
    assert(choice.includes(pack.nm));
    assert(choice.includes(pack.addition));
    const inventory = html.match(new RegExp(`<dl class="inventory-${id}"[\\s\\S]*?</dl>`))[0];
    assert.deepEqual([...inventory.matchAll(/<dd>(.*?)<\/dd>/g)].map(m => m[1]), fields.map(k => String(supplies(id)[k]) + (k === 'fuel' ? 'L' : k === 'van' ? '%' : '')));
    assert(css.includes(`#cargo-${id}:checked) .inventory-${id}`));
  }
});

test('all conversation snapshots share one image geometry and scrollable content', () => {
  require('postcss').parse(css);
  assert.equal((html.match(/class="scene-art"/g) || []).length, 3);
  assert.equal((html.match(/src="\.\.\/\.\.\/assets\/scenes\/opening-bus-family-v3.webp"/g) || []).length, 3);
  assert.match(css, /\.story-page\{grid-template-rows:auto var\(--art\) minmax\(0,1fr\) auto\}/);
  assert.match(css, /\.story-scroll,\.packing-scroll\{min-height:0;overflow-y:auto/);
  assert.match(css, /section:target\)>.question-page:not\(:target\)\{display:none\}/);
  assert.match(css, /section:target\{display:grid\}/);
  assert.match(css, /input:focus-visible/);
  assert.match(css, /body:has\(#large-type:checked\)/);
  assert.match(css, /@media\(max-width:340px\)/);
  assert.match(css, /@media\(max-height:540px\)/);
  assert.doesNotMatch(css, /!important|line-clamp|text-overflow|#scr-name|#ev-wrap|animation:/);
});
