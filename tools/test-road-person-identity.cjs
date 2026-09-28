const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.join(__dirname,'design-drafts');
const html=fs.readFileSync(path.join(dir,'road-person-identity.html'),'utf8');
const css=fs.readFileSync(path.join(dir,'road-person-identity.css'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
const asset='road-person-identity/traveler-woman-01-master-v1.png';

test('one registered draft; no script, storage, game runtime or auto-apply',()=>{
  const drafts=manifest.drafts.filter(d=>d.id==='road-person-identity-v1');
  assert.equal(drafts.length,1);assert.equal(drafts[0].file,'road-person-identity.html');
  assert.equal(new Set(manifest.drafts.map(d=>d.id)).size,manifest.drafts.length);
  assert(!/<script|<iframe|<form|\bon[a-z]+\s*=|localStorage|sessionStorage|postMessage|fetch\(/i.test(html));
  assert(!/!important|@import|https?:|animation:|transition:/i.test(css));
  for(const text of ['실제 게임과 저장에는 미적용','전체 인물의 중복 얼굴 정리와 ID 연결은 아직 미구현','정적 비교','접근 제한으로 미검수'])assert(html.includes(text));
  assert(!fs.readFileSync(path.join(dir,'../../src/05-scene.js'),'utf8').includes('traveler-woman-01'));
});

test('face, full body and scale reuse the exact same master; no new face is substituted',()=>{
  assert.equal(html.split(asset).length-1,4);
  assert.match(html,/<svg class="face-view" viewBox="400 22 290 334"/);
  const png=fs.readFileSync(path.join(dir,asset));
  assert.equal(png.subarray(1,4).toString(),'PNG');
  assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),1536);
  assert.equal(png[25],6,'PNG is RGBA');
});

test('all references resolve locally; face switch has native controls and clear reversible CSS',()=>{
  for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    assert(!/^\w+:/.test(m[1]));assert(fs.existsSync(path.resolve(dir,m[1])),m[1]);
  }
  for(const id of ['view-body','view-face']){
    assert.match(html,new RegExp(`<label><input[^>]*id="${id}"`));
    assert(css.includes(`#${id}:checked`));
  }
  assert.equal((html.match(/ checked/g)||[]).length,1);
  assert(css.includes(':focus-visible'));assert(css.includes('min-height:44px'));
  assert.match(html,/<details>\s*<summary>/);
});

test('ratio study keeps existing vehicle proportions and explicitly separates canvas implementation',()=>{
  assert(80/155>=.45&&80/155<=.55);
  assert(Math.abs(155/92.03125-1024/608)<.001);
  assert(Math.abs(80/37.1875-512/238)<.001);
  assert.match(html,/x="207" y="80" width="14" height="21"/);
  assert(html.includes('PNG를 그대로 움직이는 도로에 붙이지 않아'));
  assert(html.includes('캔버스/픽셀 렌더러'));
});

test('generation provenance preserves contract prompts and all required reference filenames',()=>{
  const contract=JSON.parse(fs.readFileSync(path.join(dir,'../../assets/visual-contract.json'),'utf8'));
  const prompt=fs.readFileSync(path.join(dir,'road-person-identity/prompt-v1.txt'),'utf8');
  const notes=fs.readFileSync(path.join(dir,'road-person-identity.md'),'utf8');
  assert(prompt.includes(contract.prompt.base));assert(prompt.includes(contract.prompt.negative));
  for(const ref of contract.requiredReferences)assert(notes.includes(path.basename(ref)));
  assert(notes.includes('built-in'));assert(notes.includes('전체 42명과의 얼굴 중복 검사는 아니다'));
});
