const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('tools/design-drafts/pursuit-indicator.html');
const css=read('tools/design-drafts/pursuit-indicator.css');

test('risk proposal is registered without replacing other drafts or joining the build',()=>{
  const {drafts}=JSON.parse(read('tools/design-drafts/manifest.json'));
  assert.equal(new Set(drafts.map(x=>x.id)).size,drafts.length);
  assert.equal(drafts.find(x=>x.id==='pursuit-indicator-v1').file,'pursuit-indicator.html');
  for(const id of ['scene-continuity-v1','quest-bound-notebook-v1','quest-folder-v1','quest-notebook-v1']) assert(drafts.some(x=>x.id===id));
  assert.doesNotMatch(read('tools/build-html.mjs'),/pursuit-indicator/);
  assert.match(html,/default-src 'none'/);
  assert.doesNotMatch(html,/<script\b|\bon\w+\s*=|localStorage|sessionStorage|javascript:|<iframe\b|<form\b/i);
  assert.match(html,/현재 화면 재현 아님/);
});

test('all six risk levels and both modes are native accessible controls',()=>{
  for(let n=0;n<=5;n++){
    assert.match(html,new RegExp(`id="risk-${n}" aria-label="추적 위험 ${n}단계"`));
    assert.match(css,new RegExp(`#risk-${n}:checked`));
  }
  for(const id of ['stopped','driving']) assert.match(html,new RegExp(`id="${id}"`));
  assert.equal((html.match(/<i><\/i>/g)||[]).length,6);
  assert.match(html,/<details class="risk-indicator">/);
  assert.match(css,/focus-visible/);
  assert.match(html,/현재 쌓인 관측 표식은 없어요/);
  assert.match(html,/지금 카메라가 보고 있다는 뜻은 아니에요/);
  assert.match(html,/이 초안에서는 이동하거나 시간을 보내지 않아요/);
});

test('reviewed assets resolve, scene is not tinted by danger, and indicator has bounded space',()=>{
  for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
    assert(fs.existsSync(path.resolve(root,'tools/design-drafts',match[1])),match[1]);
  }
  assert.doesNotMatch(css,/!important|animation:|mix-blend-mode|#55e0c8|85,224,200/);
  assert.doesNotMatch(css,/:has\(#risk-\d:checked\)\s+\.(?:scenery|landscape|dalguji)/);
  assert.match(css,/min-height:46px/);
  assert.match(css,/width:min\(272px,calc\(100vw - 28px\)\)/);
});
