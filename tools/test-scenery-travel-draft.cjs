const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.join(__dirname,'design-drafts');
const html=fs.readFileSync(path.join(dir,'scenery-travel.html'),'utf8');
const css=fs.readFileSync(path.join(dir,'scenery-travel.css'),'utf8');
const ast=require('postcss').parse(css);

test('draft is registered and sandbox/save/build isolated',()=>{
  const drafts=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8')).drafts;
  const draft=drafts.find(d=>d.id==='scenery-travel-v1');
  assert.equal(draft.file,'scenery-travel.html');assert.equal(draft.revision,'1');
  assert.equal(new Set(drafts.map(d=>d.id)).size,drafts.length);
  assert.match(draft.description,/게임 미적용/);
  assert.match(html,/default-src 'none'; img-src 'self'; style-src 'self'; form-action 'none'; base-uri 'none'/);
  assert.doesNotMatch(html,/<script\b|\bon\w+\s*=|localStorage|sessionStorage|<iframe\b|<form\b|javascript:|\/src\//i);
  assert.doesNotMatch(fs.readFileSync(path.join(__dirname,'build-html.mjs'),'utf8'),/scenery-travel/);
});
test('all existing art/style and label references resolve',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length);
  for(const [,url]of html.matchAll(/(?:src|href)="([^"]+)"/g)){
    assert(!/^(https?:|data:|javascript:)/.test(url));assert(fs.existsSync(path.resolve(dir,url)),url);
  }
  for(const [,id]of html.matchAll(/aria-labelledby="([^"]+)"/g))assert(ids.includes(id));
  for(const id of ['miryang-v1.webp','daegu-v1.webp','journey-dalguji-base-v1.webp'])assert(html.includes(id));
  assert.doesNotMatch(html,/assets\/scenes\/|assets\/portraits\//);
});
test('play is opt-in, pause and three native still positions are reachable',()=>{
  assert.match(html,/id="play" type="checkbox">/);
  assert.match(html,/id="pause" type="checkbox">/);
  assert.equal([...html.matchAll(/name="position"/g)].length,3);
  assert.match(html,/id="start" type="radio" name="position" checked/);
  for(const id of ['play','pause','middle','end'])assert(css.includes('#'+id+':checked'));
  assert.match(css,/animation-play-state:paused/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/focus-visible/);
  assert.doesNotMatch(css,/infinite|!important/);
});
test('proposal seam moves with its terrain; sky/road/vehicle are outside the moving strip',()=>{
  const block=html.match(/<section aria-labelledby="proposal-title"[\s\S]*?<\/section>/)[0];
  assert.equal([...block.matchAll(/class="travel-strip animated"/g)].length,1);
  assert.match(block,/<div class="ridge">/);
  assert.match(block,/<\/div>\s*<div class="road">/);
  assert.match(block,/<\/div>\s*<img class="vehicle"/);
  const animated=[];ast.walkRules(rule=>rule.walkDecls('animation',d=>animated.push([rule.selector,d.value])));
  assert(animated.some(([s,v])=>s.endsWith('.travel-strip')&&v==='travel var(--duration) linear both'));
  assert(!animated.some(([s])=>/\.vehicle|\.sky|\.scene(?:\b|$)|\.ridge/.test(s)));
  assert.doesNotMatch(css,/opacity\s*:|filter\s*:|transition\s*:/);
});
test('motion keeps two equal scenery windows and discloses schematic vs actual evidence',()=>{
  assert.equal([...html.matchAll(/class="scene"/g)].length,2);
  assert.equal([...html.matchAll(/class="vehicle"/g)].length,2);
  assert.match(html,/실제 플레이 녹화는 아니다/);
  assert.match(html,/실제 캔버스/);assert.match(html,/게임과 저장에는 미적용/);
  ast.walkAtRules('keyframes',rule=>rule.walkDecls(d=>assert(['transform','clip-path','background-position'].includes(d.prop),d.prop)));
  ast.walkRules(rule=>{
    if(!rule.selector.includes(':checked'))return;
    rule.walkDecls(d=>assert(!['height','width','min-height','max-height','scale'].includes(d.prop),d.prop));
  });
});
