const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('tools/design-drafts/quest-bound-notebook.html');

test('bound notebook is a registered, isolated prototype with preserved alternatives',()=>{
  const {drafts}=JSON.parse(read('tools/design-drafts/manifest.json'));
  assert.equal(new Set(drafts.map(x=>x.id)).size,drafts.length);
  const draft=drafts.find(x=>x.id==='quest-bound-notebook-v1');
  assert.equal(draft.file,'quest-bound-notebook.html');
  assert.equal(draft.recommended,true);
  for(const name of ['quest-folder.html','quest-notebook.html']) assert(drafts.some(x=>x.file===name));
  assert.match(html,/default-src 'none'/);
  assert.doesNotMatch(html,/<script\b|\bon\w+\s*=|localStorage|sessionStorage|javascript:|<iframe\b|<form\b/i);
  assert.doesNotMatch(read('tools/build-html.mjs'),/quest-bound-notebook|quest-bound-font/);
});

test('prototype keeps canonical index labels, factual limits, and accessible native controls',()=>{
  for(const [id,label] of [['main','메인 스토리'],['side','사이드 미션'],['done','완료 기록']]){
    assert.match(html,new RegExp(`id="notes-${id}" aria-label="${label}"`));
    assert.match(html,new RegExp(`<label for="notes-${id}">${label}</label>`));
  }
  assert.match(html,/tabindex="0" aria-label="공책 본문/);
  assert.match(html,/초안에서는 이동하지 않습니다/);
  assert.match(html,/현재 완료 이력을 뜻하지 않습니다/);
  assert.doesNotMatch(html,/강제 이송선|증언 묶음|같은 번호|서로 기록을 보내/);
  assert.match(html,/청주 방송국/);
  assert.match(html,/열람 준비 30분/);
  assert.match(html,/<details class="written-record" open>/);
});

test('prototype uses a separate embedded font without enlarging the game font',()=>{
  const css=read('tools/design-drafts/quest-bound-notebook.css');
  const font=read('tools/design-drafts/quest-bound-font.css');
  assert.match(css,/@import url\('quest-bound-font.css'\)/);
  assert.match(font,/data:font\/woff2;base64,/);
  assert.doesNotMatch(css,/!important/);
  assert.match(css,/overflow-y:auto/);
  assert.match(css,/focus-visible/);
  assert.match(css,/height:44px/);
});

test('scribbles are authored on one page, do not erase guidance, and have readable semantics',()=>{
  assert.equal((html.match(/class="margin-aside"/g)||[]).length,1);
  assert.equal((html.match(/class="dalguji-doodle"/g)||[]).length,1);
  assert.match(html,/<span class="note-sr">지운 말: <\/span><del>혼자서는 무리일 것 같다/);
  assert.match(html,/덧쓴 말: <\/span>해 보기 전엔 모르지\./);
  assert.match(html,/role="img" aria-label="공책 구석의 작은 달구지 낙서"/);
  assert.doesNotMatch(html.match(/<del>[\s\S]*?<\/del>/)[0],/청주|방송국|탐색|30분/);
  const quietPages=html.slice(html.indexOf('<section class="note-side">'),html.indexOf('</footer>'));
  assert.doesNotMatch(quietPages,/margin-aside|pen-crossout|dalguji-doodle/);
});
