const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.join(__dirname,'design-drafts');
const html=fs.readFileSync(path.join(dir,'road-cue-study.html'),'utf8');
const css=fs.readFileSync(path.join(dir,'road-cue-study.css'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));

test('draft is registered once and remains isolated from game/save',()=>{
  const draft=manifest.drafts.filter(d=>d.id==='road-cue-study-v1');
  assert.equal(draft.length,1);assert.equal(draft[0].file,'road-cue-study.html');
  assert.equal(new Set(manifest.drafts.map(d=>d.id)).size,manifest.drafts.length);
  assert(!/<script|<iframe|<form|\bon[a-z]+\s*=|localStorage|sessionStorage|postMessage|fetch\(/i.test(html));
  assert(!/!important|@import|https?:|animation:|transition:/i.test(css));
  assert(html.includes('실제 게임과 저장에는 미적용'));
  assert(html.includes('현재 사건의 등장인물이 아니야'));
});

test('native comparison/zoom controls have clear labels, defaults and reversible rules',()=>{
  for(const id of ['people','truck','proposal','current','zoom']){
    assert.match(html,new RegExp(`<label><input[^>]*id="${id}"`));
    assert(css.includes(`#${id}:checked`));
  }
  assert.equal((html.match(/ checked/g)||[]).length,2);
  assert.match(html,/<details class="notes"><summary>/);
  assert(css.includes(':focus-visible'));
  assert(css.includes('height:44px'));
});

test('all assets and SVG references resolve without executable or remote content',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size);
  for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(m[1].startsWith('#'))assert(ids.includes(m[1].slice(1)),m[1]);
    else{assert(!/^\w+:/.test(m[1]));assert(fs.existsSync(path.resolve(dir,m[1])),m[1]);}
  }
  assert(!html.includes('<foreignObject'));
});

test('same Dalguji/cue parts preserve aspect and reference scale',()=>{
  const player=html.match(/journey-dalguji-base-v1.webp" x="48" y="123" width="([\d.]+)" height="([\d.]+)"/);
  const cue=html.match(/cue-broken-vehicle-v3.webp" x="10" y="0" width="([\d.]+)" height="([\d.]+)"/);
  assert(player&&cue);
  const ratio=Number(cue[1])/Number(player[1]);assert(ratio>=.45&&ratio<=.55);
  assert(Math.abs(Number(cue[1])/Number(cue[2])-512/238)<.001);
  assert(Math.abs(Number(player[1])/Number(player[2])-1024/608)<.001);
  assert(html.includes('정적 초안'));assert(html.includes('이 초안은 정적 형태 비교야'));
  assert(!/road-cue-study/.test(fs.readFileSync(path.join(dir,'../../src/05-scene.js'),'utf8')));
});
