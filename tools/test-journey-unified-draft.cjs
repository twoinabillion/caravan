const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.join(__dirname,'design-drafts');
const html=fs.readFileSync(path.join(dir,'journey-unified.html'),'utf8');
const css=fs.readFileSync(path.join(dir,'journey-unified.css'),'utf8');
test('journey draft remains isolated and registered',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
  assert.equal(manifest.drafts.find(x=>x.id==='journey-unified-v1').file,'journey-unified.html');
  assert.equal(new Set(manifest.drafts.map(x=>x.id)).size,manifest.drafts.length);
  assert(!/<script|<iframe|<form|\bon[a-z]+\s*=|localStorage|sessionStorage|postMessage|fetch\(/i.test(html));
  assert(!/https?:|@import|!important/i.test(css));
  assert(html.includes('실제 게임과 저장은 바뀌지 않습니다'));
});
test('native selectors have labels, unique IDs and a single default per group',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(ids.length,new Set(ids).size);
  const inputs=[...html.matchAll(/<label[^>]*>\s*<input([^>]+)>/g)].map(x=>x[1]);
  assert.equal(inputs.length,10);
  for(const name of ['demo-mode','journey-tab','stay-action']){
    assert.equal(inputs.filter(x=>x.includes(`name="${name}"`)&&x.includes('checked')).length,1);
  }
  assert(css.includes(':focus-visible'));
});
test('same heading and clock used in both scene modes; no second driving time',()=>{
  assert.equal((html.match(/class="scene-heading"/g)||[]).length,1);
  assert.equal((html.match(/class="scene-date"/g)||[]).length,1);
  assert(html.includes('세종 → 공주'));
  assert(css.includes('grid-template-columns:1fr 1fr'));
  assert(css.includes('flex:0 0 292px'));
  assert(!/overflow-y:\s*(auto|scroll)/.test(css));
});
test('each selected action has a reversible disclosure, costs and an explicit next step',()=>{
  for(const id of ['explore','camp','repair','radio','companion']){
    assert(html.includes(`id="action-${id}"`));
    assert(html.includes(`class="action-detail detail-${id}"`));
    assert(css.includes(`.detail-${id}`));
  }
  assert.equal((html.match(/<details class="action-preview">/g)||[]).length,6);
  assert.equal((html.match(/<summary>/g)||[]).length,6);
  assert(html.includes('현재 저장에는 동료가 없습니다'));
  assert(html.includes('바로 잠들지 않아요'));
});
test('all referenced assets exist locally and use original delivery files',()=>{
  for(const source of [html,css]) for(const match of source.matchAll(/(?:src="|href="|url\(['"])([^"')]+)/g)){
    assert(fs.existsSync(path.resolve(dir,match[1])),match[1]);
  }
});
