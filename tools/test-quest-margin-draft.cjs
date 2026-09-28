const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const html=read('tools/design-drafts/quest-margin-notes.html');
const css=read('tools/design-drafts/quest-margin-notes.css');

test('new journal marks are registered and isolated from game code and storage',()=>{
  const {drafts}=JSON.parse(read('tools/design-drafts/manifest.json'));
  assert.equal(new Set(drafts.map(row=>row.id)).size,drafts.length);
  assert.equal(drafts.find(row=>row.id==='quest-margin-notes-v1').file,'quest-margin-notes.html');
  assert.match(html,/default-src 'none'/);
  assert.doesNotMatch(html,/<script\b|\bon\w+\s*=|localStorage|sessionStorage|javascript:|<iframe\b|<form\b/i);
  assert.doesNotMatch(read('tools/build-html.mjs'),/quest-margin-notes/);
});

test('all examples have native selectors and only three receive new marks',()=>{
  const options=[...html.matchAll(/<option value="([a-z]+)"/g)].map(match=>match[1]);
  assert.equal(options.length,5);
  for(const value of options){
    assert.match(html,new RegExp(`class="entry-sample entry-${value}"`));
    assert(css.includes(`option[value="${value}"]:checked`));
  }
  assert.equal((html.match(/class="[^"]*new-mark"/g)||[]).length,3);
  assert.match(html,/id="show-marks" type="checkbox" checked/);
  assert.match(css,/:not\(:has\(#show-marks:checked\)\) .new-mark/);
  assert.doesNotMatch(html.match(/<section class="entry-sample entry-quiet">([\s\S]*?)<\/section>/)[1],/new-mark|<svg|<del>/);
});

test('marks do not erase facts or action guidance or add absent companions',()=>{
  const current=html.match(/<section class="entry-sample entry-key">([\s\S]*?)<\/section>/)[1];
  assert.match(current,/빠진 설명서부터 찾아야지/);
  assert.match(current,/조금만 당겨 볼까/);
  assert.match(current,/아니다\. 설명서부터\./);
  for(const deleted of html.matchAll(/<del>([\s\S]*?)<\/del>/g))assert.doesNotMatch(deleted[1],/수원|남산|청주|탐색|분/);
  assert.match(html,/수원 성곽 공동체/);
  assert.match(html,/열람 준비 30분/);
  assert.match(html,/이 초안에서는 이동하지 않습니다/);
  assert.doesNotMatch(html,/보리가|민지가|레오가|누군가가|대답했다|검증키를 꺼냈다/);
});

test('reuses approved handwritten surface with accessible semantic sketches',()=>{
  assert.match(css,/@import url\('quest-bound-notebook.css'\)/);
  assert.match(css,/@import url\('quest-font.css'\)/);
  assert.doesNotMatch(css,/!important|animation:/);
  assert.match(html,/계기판 낙서\. 배선도나 장치 해법이 아니다/);
  assert.match(html,/tabindex="0" aria-label="공책 본문/);
  assert.match(css,/focus-visible/);
  assert.match(html,/지운 말:/);
  assert.match(html,/덧쓴 말:/);
  assert.match(read('tools/design-drafts/quest-margin-notes.md'),/parent_principle_found/);
});
