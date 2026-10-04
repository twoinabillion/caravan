const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const dir = path.join(__dirname, 'design-drafts');
const html = fs.readFileSync(path.join(dir, 'journey-continuity.html'), 'utf8');
const css = fs.readFileSync(path.join(dir, 'journey-continuity.css'), 'utf8');
const ast = require('postcss').parse(css);
const declarations = (selector, property) => {
  const found = [];
  ast.walkRules(rule => {
    if (rule.selector === selector) rule.walkDecls(property, decl => found.push(decl.value));
  });
  return found;
};

test('registered independent draft, no executable or game/save integration', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  assert.equal(manifest.drafts[0].id, 'journey-continuity-v1');
  assert.equal(manifest.drafts[0].file, 'journey-continuity.html');
  assert.equal(manifest.drafts[0].revision, '2');
  assert.equal(manifest.drafts[0].recommended, true);
  assert.equal(new Set(manifest.drafts.map(d => d.id)).size, manifest.drafts.length);
  assert.match(manifest.drafts[0].description, /가상/);
  assert.match(manifest.drafts[0].description, /미완료/);
  assert.match(html, /default-src 'none'; img-src 'self'; style-src 'self'; form-action 'none'; base-uri 'none'/);
  assert.doesNotMatch(html, /<script\b|\bon\w+\s*=|localStorage|sessionStorage|<iframe\b|<form\b|javascript:|\/src\//i);
  assert.doesNotMatch(fs.readFileSync(path.join(__dirname, 'build-html.mjs'), 'utf8'), /journey-continuity/);
});

test('local assets, fragments, accessible references and CSS URLs all resolve', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (url.startsWith('#')) assert(ids.includes(url.slice(1)), url);
    else {
      assert(!/^(https?:|data:|javascript:)/.test(url));
      assert(fs.existsSync(path.resolve(dir, url)), url);
    }
  }
  for (const [, id] of html.matchAll(/aria-labelledby="([^"]+)"/g)) assert(ids.includes(id));
  for (const [, url] of css.matchAll(/url\(['"]?([^)'"\s]+)/g)) assert(fs.existsSync(path.resolve(dir, url)), url);
  for (const [, url] of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) assert(url.startsWith('#'));
});

test('default is historical driving; current arrival data and hypothetical departure are distinguished', () => {
  assert.match(html, /id="stage-drive" type="radio" name="stage" checked/);
  assert.equal([...html.matchAll(/name="stage"/g)].length, 3);
  assert.match(html, /출발 전 배치 예시/);
  assert.match(html, /앞선 STOP 기록/);
  assert.match(html, /도착 후.*현재 시간과 탐색 예상치를 옮긴 독립 배치/);
  assert.match(html, /DAY 1 · 14:02/);
  assert.match(html, /DAY 1 · 14:50/);
  assert.match(html, /id="stop-route" type="radio" name="stop-mode" checked/);
  assert.match(html, /id="arrive-stay" type="radio" name="arrive-mode" checked/);
  assert.match(css, /\.stop-panel:has\(#stop-stay:checked\) \.stop-stay-content/);
  assert.match(css, /\.arrive-panel:has\(#arrive-route:checked\) \.arrive-route-content/);
  assert.match(html, /도착 사건이 있다면 기존 사건 흐름이 먼저/);
});

test('preview is on by default, present before departure and during travel, absent after arrival', () => {
  const text = '무너진 고가 아래를 탐색할 수 있다.';
  assert.match(html, /id="show-preview" type="checkbox" checked/);
  const stop = html.match(/<div class="content stop-route-content">([\s\S]*?)<div class="content stop-stay-content">/)[1];
  const drive = html.match(/<div class="content drive-content">([\s\S]*?)<div class="stage-panel arrive-panel">/)[1];
  const arrive = html.match(/<div class="stage-panel arrive-panel">([\s\S]*?)<nav class="bottom-nav"/)[1];
  assert.match(stop, /class="choice destination-choice" href="#choose-destination"/);
  assert.match(stop, /<small>변경 /);
  for (const block of [stop, drive]) assert(block.includes(`class="place-preview">${text}<`));
  assert.doesNotMatch(arrive, /class="place-preview"/);
  assert.match(arrive, /\+2시간 · 피로 약 \+5/);
  assert.match(arrive, /발견물 미확인/);
  assert.deepEqual(declarations('.prototype:has(#show-preview:not(:checked)) .place-preview', 'visibility'), ['hidden']);
  assert.deepEqual(declarations('.destination-row,.choice.destination-choice', 'grid-template-rows'), ['24px 18px']);
  assert.equal(24 + 18 + 3 + 4 + 7 + 1, 57); // 1px slack inside the unchanged 58px row.
  // Conservative all-full-width glyph budget; this is not actual browser/font measurement.
  assert([...text].length * 13 <= 320 - 12 - 2 - 20 - 8);
  assert.equal([...html.matchAll(/class="place-preview"/g)].length, 2);
});

test('a single scenery/vehicle/deck/strip/nav preserves geometry across stages and tabs', () => {
  for (const cls of ['scenery', 'dalguji', 'deck-area', 'deck', 'vehicle-strip', 'bottom-nav']) {
    assert.equal([...html.matchAll(new RegExp(`class="${cls}"`, 'g'))].length, 1, cls);
  }
  assert.deepEqual(declarations(':root', '--deck-height'), ['272px']);
  const owners = [];
  ast.walkDecls('--deck-height', decl => owners.push(decl.parent.selector));
  assert.deepEqual(owners, [':root']);
  assert.deepEqual(declarations('.stage-panel', 'grid-template-rows'), ['44px minmax(0,1fr)']);
  assert.deepEqual(declarations('.content', 'grid-template-rows'), ['58px 38px 48px 44px']);
  assert.deepEqual(declarations('.deck-area', 'flex'), ['0 0 var(--deck-height)']);
  assert.doesNotMatch(css, /transition\s*:\s*(all|height|transform|flex)|!important|line-clamp|text-overflow/);
  ast.walkRules(rule => {
    if (!/:(?:checked|target)/.test(rule.selector)) return;
    rule.walkDecls(decl => assert(!/^(height|min-height|max-height|flex|padding|margin|top|bottom|width|transform|grid-template-rows|--deck-height)$/.test(decl.prop), `${rule.selector}: ${decl.prop}`));
  });
  assert.match(css, /transition:opacity 650ms ease/);
  assert.match(css, /animation:content-in 150ms ease-out/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});

test('conservative row budget fits all five panels (static arithmetic, not browser QA)', () => {
  const panel = 272 - 14 - 2 - 8;
  assert.equal(panel, 44 + 4 + 58 + 38 + 48 + 44 + 3 * 4);
  assert.equal([...html.matchAll(/class="content /g)].length, 5);
  for (const height of [568, 650, 728, 800]) {
    const gameHeight = height - 44;
    const scenery = gameHeight - 272 - 44 - (height <= 650 ? 56 : 66);
    assert(scenery >= 88, `${height}px viewport`);
  }
  assert.deepEqual(declarations('.execute', 'min-height'), ['48px']);
  assert.deepEqual(declarations('.quiet-link', 'min-height'), ['44px']);
  assert.deepEqual(declarations('.travel-actions>a', 'min-height'), ['46px']);
  assert.match(css, /:focus-visible/);
});

test('distance has one visible owner and photo is only in an on-demand sheet', () => {
  const remaining = Math.ceil(34 - 23.727890333333146);
  const drive = html.match(/<div class="stage-panel drive-panel">([\s\S]*?)<div class="stage-panel arrive-panel">/)[1];
  assert.equal([...html.matchAll(/km 남음/g)].length, 1);
  assert.match(drive, new RegExp(`<strong>${remaining}</strong>km 남음`));
  assert.match(drive, /aria-valuenow="23.727890333333146"/);
  assert.match(drive, /href="#record"/);
  assert.match(drive, /점심 식사 · 식량 소모 없음/);
  assert.doesNotMatch(drive, /scenes\/|travel-destination-card|도착하면|장소 정보/);
  const progress = Number(declarations('.progress-track>span', 'width')[0].replace('%', ''));
  assert(Math.abs(progress - 23.727890333333146 / 34 * 100) < 1e-10);
  const sheet = html.match(/<section class="sheet destination-sheet"[\s\S]*?<\/section>/)[0];
  assert.match(sheet, /destination-yangsan-v1.webp/);
  assert.equal([...html.matchAll(/destination-yangsan-v1.webp/g)].length, 1);
  assert.match(html, /위험 경고까지 숨기자는 제안은 아닙니다/);
});

test('every detail target has a matching sheet, explicit close and backdrop return', () => {
  const targets = [...html.matchAll(/class="target sheet-target" id="([^"]+)"/g)].map(m => m[1]);
  for (const target of targets) {
    const sheet = html.match(new RegExp(`<section class="sheet ${target}-sheet"[\\s\\S]*?<\\/section>`));
    assert(sheet, target);
    assert.match(sheet[0], /class="close" href="#closed">닫기/);
    assert.match(sheet[0], /class="scrim" href="#closed" tabindex="-1"/);
    assert(css.includes(`:has(#${target}:target) .${target}-sheet`));
  }
  assert.match(css, /:has\(\.sheet-target:target\) :is\(\.draft-tools,\.deck-area,\.bottom-nav\)\{visibility:hidden\}/);
  assert.match(css, /\.sheet-scroll\{[^}]*overflow:auto/);
  assert.match(css, /\.sheet-body>header\{[^}]*flex-shrink:0/);
});

test('primary text palette meets 4.5:1 contrast (not visual QA)', () => {
  const luminance = hex => {
    const channels = hex.match(/[a-f\d]{2}/gi).map(n => parseInt(n, 16) / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  };
  for (const [fg, bg] of [['#f0eee2', '#202820'], ['#c1c4b5', '#202820'], ['#edc986', '#202820'], ['#edc986', '#192119'], ['#fff5df', '#99632c']]) {
    const [a, b] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
    assert((a + .05) / (b + .05) >= 4.5, `${fg} on ${bg}`);
  }
});
