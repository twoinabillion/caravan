const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.join(__dirname,'design-drafts');
const html=fs.readFileSync(path.join(dir,'pursuit-status.html'),'utf8');
const css=fs.readFileSync(path.join(dir,'pursuit-status.css'),'utf8');
test('pursuit placement draft is registered, isolated, and preserves prior draft',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
  assert.equal(manifest.drafts.find(x=>x.id==='pursuit-status-v1').file,'pursuit-status.html');
  assert(manifest.drafts.some(x=>x.id==='pursuit-indicator-v1'));
  assert.equal(manifest.drafts.length,new Set(manifest.drafts.map(x=>x.id)).size);
  assert(!/<script|<iframe|<form|\bon[a-z]+\s*=|localStorage|sessionStorage|postMessage|fetch\(/i.test(html));
  assert(!/https?:|@import|!important/i.test(css));
  assert(html.includes('실제 게임에는 미적용'));
});
test('comparison and all risk levels have native labeled controls',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(ids.length,new Set(ids).size);
  assert.match(html,/<input id="layout-new"[^>]*checked/);
  assert(!/<input id="layout-old"[^>]*checked/.test(html));
  assert.match(html,/<label[^>]*for="risk-level"/);
  assert.equal((html.match(/ selected/g)||[]).length,1);
  for(let i=0;i<=5;i++){
    assert(html.includes(`<option value="${i}"`));
    assert(css.includes(`option[value="${i}"]:checked`));
  }
  assert(css.includes(':focus-visible'));
});
test('explanation is reversible, current risk is not an immediate enemy, change notice is one-shot',()=>{
  assert.match(html,/<details class="risk">/);
  assert(html.includes('다시 누르면 닫혀요'));
  assert(html.includes('지금 누가 쫓아온다는 뜻은 아니에요'));
  assert(html.includes('하룻밤 쉬는 것도 거절당해요'));
  assert(css.includes('width:78px;height:44px'));
  assert(css.includes('animation:notice-once 5s both'));
  assert(css.includes('prefers-reduced-motion'));
  assert(!css.includes('infinite'));
  assert(css.includes('.risk>summary .compact-pips{display:none}'));
});
test('all referenced assets are existing local delivery files',()=>{
  for(const text of [html,css])for(const m of text.matchAll(/(?:src="|href="|url\(['"])([^"')]+)/g)){
    assert(fs.existsSync(path.resolve(dir,m[1])),m[1]);
  }
});
