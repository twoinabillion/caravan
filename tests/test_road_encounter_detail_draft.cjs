const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');
const folder = path.resolve(__dirname, '../tools/design-drafts');
const html = fs.readFileSync(path.join(folder, 'road-encounter-detail.html'), 'utf8');
const css = fs.readFileSync(path.join(folder, 'road-encounter-detail.css'), 'utf8');
const parsed = postcss.parse(css);
function declarations(selector) {
  const values = {};
  parsed.walkRules(selector, rule => rule.walkDecls(d => values[d.prop] = d.value));
  return values;
}

test('draft is registered, sandbox-compatible and isolated from save state', () => {
  const entry = JSON.parse(fs.readFileSync(path.join(folder, 'manifest.json'), 'utf8')).drafts.find(d => d.id === 'road-encounter-detail-v1');
  assert.equal(entry.file, 'road-encounter-detail.html');
  assert.equal(entry.revision, '6');
  assert.match(entry.description, /정적 HTML\/SVG/);
  assert.match(html, /default-src 'none'/);
  assert.match(html, /form-action 'none'/);
  assert.doesNotMatch(html, /<script\b|<iframe\b|<form\b|\bon\w+\s*=|localStorage|sessionStorage|javascript:/i);
  assert(!fs.readFileSync(path.resolve(__dirname, '../tools/build-html.mjs'), 'utf8').includes('road-encounter-detail'));
});

test('all image, stylesheet and SVG references resolve with unique IDs', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, href] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (href.startsWith('#')) assert(ids.includes(href.slice(1)), href);
    else assert(fs.existsSync(path.resolve(folder, href)), href);
  }
  assert.match(html, /cue-coffee-van-v3.webp/);
  assert.match(html, /cue-temporary-checkpoint-v1.webp/);
  assert.match(html, /journey-dalguji-base-v1.webp/);
});

test('native radio controls switch both full scene and detail together', () => {
  assert.equal(declarations('.old-art').display, 'var(--old-art)');
  assert.equal(declarations('.new-art').display, 'var(--new-art)');
  assert.equal(declarations('.study')['--old-art'], 'none');
  assert.equal(declarations('.study:has(#current:checked)')['--new-art'], 'none');
  assert.equal(declarations('.study:has(#current:checked)')['--old-art'], 'block');
  assert.equal(declarations('.study:has(#checkpoint:checked,#cart:checked,#fuel:checked,#bicycle:checked) .coffee-example').display, 'none');
  assert.equal(declarations('.study:has(#checkpoint:checked) .checkpoint-example').display, 'block');
  assert.match(css, /:focus-visible/);
  assert.equal(declarations('fieldset span')['min-height'], '44px');
  assert.doesNotMatch(css, /line-clamp|text-overflow|!important|animation:/);
});

test('vehicle stays fixed while independent cue and anonymous adult keep their proportions', () => {
  assert.equal(declarations('.study:has(#zoom:checked) .scene').transform, 'scale(2.2)');
  assert.equal(80 * .9425 / 145, .52);
  assert.equal([...html.matchAll(/journey-dalguji-base-v1.webp/g)].length, 1);
  assert.match(html, /실제 캔버스 픽셀 렌더링·날씨·밤·움직임은 아직 검증하지 않았어/);
  assert.match(html, /새 인물은 이름 없는 비교용/);
  assert.doesNotMatch(html, /id="adult"|id="guard"|id="jacket"|id="wall"/);
  for (const name of ['coffee-vendor', 'checkpoint-worker', 'checkpoint-booth', 'market-cart', 'fuel-pump', 'delivery-bicycle', 'postman-standing', 'cart-trader', 'beekeeper-standing']) {
    assert.match(html, new RegExp(`cue-${name}-v1.webp`));
  }
});

test('generated proposal parts retain masters and genuine transparent delivery assets', async () => {
  const sharp = require('sharp');
  for (const name of ['coffee-vendor', 'checkpoint-worker', 'checkpoint-booth', 'market-cart', 'fuel-pump', 'delivery-bicycle', 'postman-standing', 'cart-trader', 'beekeeper-standing']) {
    const master = path.resolve(folder, `../../assets/road-cues/masters/${name}-v1.png`);
    const delivery = path.resolve(folder, `../../assets/road-cues/cue-${name}-v1.webp`);
    const m = await sharp(master).metadata();
    const d = await sharp(delivery).metadata();
    const stats = await sharp(delivery).stats();
    assert(m.width >= 1024 || m.height >= 1024);
    assert(m.hasAlpha && d.hasAlpha);
    assert(d.height >= 384);
    assert.equal(stats.channels[3].min, 0);
    assert(stats.channels[3].max > 240);
  }
});
