const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {runImageMagick} = require('./imagemagick.cjs');
const root = path.resolve(__dirname, '..');
const dir = path.join(__dirname, 'design-drafts');
const html = fs.readFileSync(path.join(dir, 'busan-yangsan-landscape.html'), 'utf8');
const css = fs.readFileSync(path.join(dir, 'busan-yangsan-landscape.css'), 'utf8');
const ast = require('postcss').parse(css);
test('registered and isolated from gameplay, scripting and saves', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json')));
  assert(manifest.drafts.some(d => d.id === 'busan-yangsan-landscape-v1' && d.file === 'busan-yangsan-landscape.html'));
  assert.equal(new Set(manifest.drafts.map(d => d.id)).size, manifest.drafts.length);
  assert.doesNotMatch(html, /<script\b|\bon\w+\s*=|localStorage|sessionStorage|<iframe\b|<form\b|javascript:|\/src\//i);
  assert.match(html, /게임 미적용/);
  for(const file of ['build-html.mjs', '../src/05e-road-continuity.js']){
    assert.doesNotMatch(fs.readFileSync(path.resolve(__dirname, file), 'utf8'), /busan-yangsan-continuous-v1|busan-yangsan-landscape/);
  }
});
test('references resolve and controls have a static and reduced-motion fallback', () => {
  for(const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if(!url.startsWith('https:')) assert(fs.existsSync(path.resolve(dir,url)),url);
  }
  assert.equal([...html.matchAll(/name="position"/g)].length, 4);
  assert.match(css, /animation-play-state:paused/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /translateX\(-50%\)/);
  assert.doesNotMatch(css, /infinite|scaleY|blur\(/);
  assert(ast.nodes.length > 0);
});
test('provenance distinguishes inferred geography and unapproved city endpoints', () => {
  const p = JSON.parse(fs.readFileSync(path.join(root,'assets/masters/busan-yangsan-continuity-v1/provenance.json')));
  assert.equal(p.references.length,4);
  for(const ref of p.references) assert(fs.existsSync(path.join(root,ref)));
  assert.equal(p.deliverySize[0]/2,1080);
  assert(p.limitations.some(s => s.includes('endpoint pixels')));
  assert(p.limitations.some(s => s.includes('not a surveyed')));
  assert.equal(p.geographySources.length,2);
});
test('draft delivery has required geometry, near-transparent sky and near-opaque ground', () => {
  const imagePath = path.join(root,'assets/ui/road-studies/busan-yangsan-continuous-v1.webp');
  const values = runImageMagick([imagePath,'-format','%w %h %[fx:p{0,0}.a] %[fx:p{1000,719}.a]','info:'],{encoding:'utf8'}).trim().split(' ').map(Number);
  assert.deepEqual(values.slice(0,2),[2160,720]);
  // Generated alpha is not binary; preserve it in this unapproved study.
  assert(values[2] < .01);
  assert(values[3] > .98);
  assert(fs.statSync(imagePath).size < 850000);
});
