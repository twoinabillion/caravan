const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const root='tools/design-drafts/';
const html=fs.readFileSync(root+'studio-play-controls.html','utf8');
const css=fs.readFileSync(root+'studio-play-controls.css','utf8');
test('Studio controls proposal is registered separately from gameplay',()=>{
  const manifest=JSON.parse(fs.readFileSync(root+'manifest.json','utf8'));
  const draft=manifest.drafts.find(x=>x.id==='studio-play-controls-v1');
  assert.equal(draft.file,'studio-play-controls.html');
  assert.equal(new Set(manifest.drafts.map(x=>x.id)).size,manifest.drafts.length);
  assert(!/<script|<iframe|<form|\bon[a-z]+\s*=|localStorage|postMessage|fetch\(/i.test(html));
  assert(!/https?:|url\(/i.test(css));
  assert(html.includes('실제 게임과 저장은 바뀌지 않습니다'));
});
test('both controls are outside the game outline with native reversible disclosure',()=>{
  assert(html.indexOf('최신 코드 적용')<html.indexOf('class="game-outline"'));
  assert(html.indexOf('처음부터 테스트')<html.indexOf('class="game-outline"'));
  assert.equal((html.match(/<details\b/g)||[]).length,2);
  assert.equal((html.match(/<summary>/g)||[]).length,2);
  assert.equal((html.match(/type="radio"/g)||[]).length,2);
  assert(css.includes(':focus-visible'));
  assert(css.includes('grid-template-columns:1fr 1fr'));
});
