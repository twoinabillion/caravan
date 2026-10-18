/* Isolated design review, not gameplay implementation or visual QA. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('./content-registry.cjs');
const html=fs.readFileSync('tools/design-drafts/written-sources.html','utf8'),css=fs.readFileSync('tools/design-drafts/written-sources.css','utf8');
test('written sources draft is registered and cannot operate gameplay, storage or assets',()=>{
  const entry=JSON.parse(fs.readFileSync('tools/design-drafts/manifest.json','utf8')).drafts.find(item=>item.id==='written-sources-v1');
  assert.equal(entry.file,'written-sources.html');assert.match(entry.description,/자동 적용하지 않습니다/);
  assert.doesNotMatch(html,/<script\b|<iframe\b|<form\b|<img\b|<audio\b|<video\b|\bon\w+\s*=|localStorage|sessionStorage|javascript:/i);
  assert.match(html,/default-src 'none'/);assert.doesNotMatch(fs.readFileSync('tools/build-html.mjs','utf8'),/written-sources/);
});
test('intro and event excerpts preserve their actual canonical text and source names',()=>{
  const ctx=vm.createContext({console});for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
  for(const [,source,index,text] of html.matchAll(/data-source="([^":]+):(\d+)"[^>]*>([^<]*)<\/p>/g)){
    const turn=JSON.parse(vm.runInContext(`JSON.stringify((D.intro.find(page=>page.scene===${JSON.stringify(source)})?.beats||D.openingDeparture.find(event=>event.id===${JSON.stringify(source)})?.turns)[${Number(index)}])`,ctx));
    assert.equal(text,turn.text);if(turn.kind==='letter')assert.equal(turn.name,'엄마의 메모');
  }
  assert.equal([...html.matchAll(/data-source=/g)].length,4);
});
test('one document heading replaces the two-line kind without adding a portrait or changing body density',()=>{
  const ast=require('postcss').parse(css),rules=[];ast.walkRules(rule=>rules.push(rule));
  const value=(selector,prop)=>rules.find(rule=>rule.selector===selector)?.nodes.find(decl=>decl.prop===prop)?.value;
  assert.equal(value('.old-kind','display'),'none');
  assert.equal(value('body:has(#old-source:checked) .old-kind','display'),'block');
  assert.equal(value(':root','--copy'),'16px');assert.equal(value('body:has(#large-source:checked)','--copy'),'21px');
  assert.equal(value('.document','font'),'400 var(--copy)/1.55 var(--sans)');
  assert.equal(value('.study-scroll','overflow-y'),'auto');
  assert.match(html,/제목 없는 문서는 기존 ‘편지’ 또는 ‘기록’을 한 번만/);
  assert.match(html,/실제 대사의 이름·초상, 생각·방송의 구분/);
  const heads=[...html.matchAll(/<header class="document-head">([\s\S]*?)<\/header>/g)];assert.equal(heads.length,3);
  for(const [,head]of heads){assert.equal([...head.matchAll(/<h2\b/g)].length,1);assert.doesNotMatch(head,/<img|<small|<b>/);}
  assert.doesNotMatch(css,/!important|line-clamp|text-overflow:ellipsis/);
});
