const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'design-drafts');
const read=name=>fs.readFileSync(path.join(dir,name),'utf8');
const html=read('opening-presence-quiet.html'),css=read('opening-presence-quiet.css'),prior=read('opening-presence.html');
const excerpts=s=>[...s.matchAll(/<p[^>]*data-(source|result)="([^"]+)"[^>]*>([\s\S]*?)<\/p>/g)].map(m=>[m[1],m[2],m[3]]);
const links=s=>[...s.matchAll(/href="(#[^"]+)"/g)].map(m=>m[1]);

test('quiet refinement is a separate review draft; approved flow study stays registered',()=>{
  const list=JSON.parse(read('manifest.json')).drafts.slice(0,40);
  const entry=list.find(e=>e.id==='opening-presence-quiet-v2');
  assert.equal(entry.file,'opening-presence-quiet.html');
  assert.equal(entry.revision,'2');
  assert.match(entry.description,/자동 적용하지 않습니다/);
  assert(list.some(e=>e.id==='opening-presence-v1'));
  assert.doesNotMatch(html,/<script\b|<iframe\b|<form\b|<audio\b|<video\b|\bon\w+\s*=|localStorage|sessionStorage|javascript:/i);
  assert.match(html,/default-src 'none'/);
  assert.doesNotMatch(fs.readFileSync('tools/build-html.mjs','utf8'),/opening-presence-quiet/);
  for(const [,file]of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)){
    assert(!/^(?:https?:)?\/\//.test(file),file);
    assert(fs.existsSync(path.resolve(dir,file)),file);
  }
});

test('typography experiment retains every authored excerpt, image, choice and round-trip route',()=>{
  assert.deepEqual(excerpts(html),excerpts(prior));
  assert.deepEqual(links(html),links(prior));
  const images=s=>[...s.matchAll(/<img[^>]*src="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(images(html),images(prior));
  assert.doesNotMatch(html,/\.\.\.|…\s*<\/p>/);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size);
  for(const [,id]of html.matchAll(/href="#([^"]+)"/g))assert(ids.includes(id),id);
});

test('ordinary titles lose their visual row, not their accessible names or time/source cues',()=>{
  const sections=[...html.matchAll(/<section id="([^"]+)"[\s\S]*?<\/section>/g)];
  for(const [,id,]of sections){
    const section=sections.find(m=>m[1]===id)[0];
    const labelled=section.match(/aria-labelledby="([^"]+)"/)[1];
    assert(section.includes('id="'+labelled+'"'),id);
    if(id!=='first-road')assert.match(section,/class="time-kind/);
  }
  assert.match(css,/body:not\(:has\(#compare-layout:checked\)\) \.scene-heading h1\{[^}]*clip-path:inset\(50%\)/);
  assert.doesNotMatch(css,/\.scene-heading h1\{[^}]*display:none/);
  assert.match(html,/여덟 살 · 서울을 떠나던 밤/);
  assert.match(html,/전해 들은 이야기/);
  assert.match(html,/출처 · 할아버지의 이야기/);
  assert.match(html,/다시 지금/);
  assert.match(html,/서장을 마치고/);
});

test('native reference and large-type switches preserve art, touch sizes and authored text',()=>{
  assert.match(html,/<input id="compare-layout" type="checkbox">이전 안/);
  assert.match(html,/<input id="large-type" type="checkbox">큰 글씨/);
  assert.match(css,/--copy:17px;--heading:36px;--portrait:36px/);
  assert.match(css,/body:has\(#compare-layout:checked\)\{--copy:18px;--heading:64px;--portrait:48px/);
  assert.match(css,/body:has\(#large-type:checked\)\{--copy:21px\}/);
  assert(css.indexOf('body:has(#large-type:checked){')>css.indexOf('body:has(#compare-layout:checked){'));
  const art=s=>s.match(/--art:([^;]+)/)[1];
  assert.equal(art(css),art(read('opening-presence.css')));
  assert.match(css,/\.scene-art\{[^}]*object-fit:contain/);
  assert.match(css,/\.story-page\{grid-template-rows:var\(--heading\) var\(--art\) minmax\(0,1fr\) auto/);
  assert.match(css,/\.primary-action\{[^}]*min-height:50px/);
  assert.match(css,/\.back-action\{[^}]*min-height:44px/);
  assert.match(css,/\.choice-action\{[^}]*min-height:62px/);
  assert.match(css,/\.choice-action\{[^}]*font-size:var\(--copy\)/);
  assert.doesNotMatch(css,/(?:memory-page|reported-page)[^}]*--art:|line-clamp|text-overflow|!important|#scr-|#ev-wrap|filter:|animation:/);
});

test('only editorial prototype notes are suppressed; scroll and original choices remain reachable',()=>{
  const rules=[];
  require('postcss').parse(css).walkRules(rule=>{
    if(rule.nodes.some(n=>n.prop==='display'&&n.value==='none'))rules.push(rule.selector);
  });
  assert(rules.includes('body:not(:has(#compare-layout:checked)) :is(.scene-actions>p,.draft-note,.sound-note)'));
  assert(!rules.some(s=>/narration|spoken|choice-action|time-kind/.test(s)));
  assert.match(css,/\.reading-scroll\{min-height:0;overflow-y:auto/);
  assert.match(css,/focus-visible/);
  assert.match(css,/@media\(max-height:540px\)/);
  assert.match(html,/장면 제목은 목차에만 남기고/);
  assert.match(html,/열쇠 결과의 시동 위치만 작별 뒤로 조정/);
});
