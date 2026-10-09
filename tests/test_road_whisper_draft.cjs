const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');
const folder = path.resolve(__dirname, '../tools/design-drafts');
const html = fs.readFileSync(path.join(folder, 'road-whisper.html'), 'utf8');
const css = fs.readFileSync(path.join(folder, 'road-whisper.css'), 'utf8');
const parsed = postcss.parse(css);
function declarations(selector) {
  const values = {};
  parsed.walkRules(selector, rule => rule.walkDecls(d => values[d.prop] = d.value));
  return values;
}

test('native Studio draft is registered and isolated from game execution and saves', () => {
  const entry = JSON.parse(fs.readFileSync(path.join(folder, 'manifest.json'), 'utf8')).drafts.find(d => d.id === 'road-whisper-v1');
  assert.equal(entry.file, 'road-whisper.html');
  assert.equal(entry.revision, '1');
  assert.match(entry.description, /정적 부품 배치/);
  assert.match(html, /default-src 'none'/);
  assert.match(html, /form-action 'none'/);
  assert.doesNotMatch(html, /<script\b|<iframe\b|<form\b|\bon\w+\s*=|localStorage|sessionStorage|javascript:/i);
  assert(!fs.readFileSync('tools/build-html.mjs', 'utf8').includes('road-whisper'));
  assert(!fs.existsSync(path.join(folder, 'road-whisper.js')));
});

test('all local controls and reusable parts resolve, with unique destinations', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, href] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (href.startsWith('#')) assert(ids.includes(href.slice(1)), href);
    else assert(fs.existsSync(path.resolve(folder, href)), href);
  }
  assert.equal(declarations('.sheet').display, 'none');
  assert.equal(declarations('.sheet:target').display, 'flex');
  assert.equal(declarations('.sheet-copy').overflow, 'auto');
  assert.equal(declarations('.sheet').position, 'absolute');
  assert.match(css, /:focus-visible/);
  assert.doesNotMatch(css, /line-clamp|text-overflow|!important/);
});

test('thought uses authored observation without a card title or picture', () => {
  const thought = html.match(/<p class="whisper"[^>]*>([^<]+)<\/p>/)[1];
  assert(fs.readFileSync('src/03-data.js', 'utf8').includes("t:'" + thought + "'"));
  assert.doesNotMatch(html, /road-thought-card|event-crisis-exhaustion|<h\d[^>]*>운전 중 생각/);
  assert.match(html, /실제 주행 재현 아님/);
  assert.match(html, /7<\/b>km 남음/);
  assert.match(html, /DAY 1 · 09:59/);
});

test('thought never consumes deck space and fixed controls retain 272px shell', () => {
  assert.equal(declarations('.whisper').position, 'absolute');
  assert.equal(declarations('.whisper')['font-size'], '14px');
  assert.equal(parseInt(declarations('.deck').height) + parseInt(declarations('.vehicle-strip').height), 272);
  assert.equal(declarations('.travel-actions,.quiet-actions')['grid-template-columns'], '1fr 1fr');
  const quiet = html.match(/<div class="quiet-actions">([\s\S]*?)<\/div>/)[1];
  assert.equal([...quiet.matchAll(/<a /g)].length, 2);
  assert.doesNotMatch(quiet, /whisper|aside|img/);
});

test('native occasional, hold, off and event gates work without scripts', () => {
  assert.equal(declarations('.whisper').animation, 'whisper-cycle 35s linear infinite');
  assert.equal(declarations('.prototype:has(#hold-thought:checked) .whisper').animation, 'none');
  assert.equal(declarations('.prototype:has(input[value="off"]:checked) .whisper').display, 'none');
  assert.equal(declarations('.prototype:has(.sheet:target) .whisper').display, 'none');
  assert.equal(declarations('.prototype:has(.sheet:target) :is(.draft-tools,.vehicle-strip,.deck,.bottom-nav)').visibility, 'hidden');
  assert.match(css, /23%,100%\{opacity:0;visibility:hidden\}/);
  assert(35 * .23 < 8.1);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /animation-timing-function:steps\(1,end\)/);
});
