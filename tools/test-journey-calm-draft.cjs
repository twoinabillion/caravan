const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(__dirname,'design-drafts');
const html=fs.readFileSync(path.join(dir,'journey-calm.html'),'utf8');
const css=fs.readFileSync(path.join(dir,'journey-calm.css'),'utf8');
const ast=require('postcss').parse(css);
const actions=['stl','explore','camp','repair','radio'];

test('registered draft, no scripts, saves, game imports or automatic apply',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
 const draft=manifest.drafts.find(d=>d.id==='journey-calm-v1');
 assert.equal(draft.file,'journey-calm.html');assert.equal(draft.revision,'1');assert(draft.recommended);
 assert.equal(new Set(manifest.drafts.map(d=>d.id)).size,manifest.drafts.length);
 assert.match(draft.description,/정적 배치/);assert.match(draft.description,/미완료/);
 assert.match(html,/default-src 'none'; img-src 'self'; style-src 'self'; form-action 'none'; base-uri 'none'/);
 assert.doesNotMatch(html,/<script\b|\bon\w+\s*=|localStorage|sessionStorage|<iframe\b|<form\b|javascript:|\/src\//i);
 assert.doesNotMatch(fs.readFileSync(path.join(root,'tools/build-html.mjs'),'utf8'),/journey-calm/);
});
test('every local asset and fragment resolves, no duplicate targets',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const [,url]of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  if(url.startsWith('#'))assert(ids.includes(url.slice(1)),url);
  else{assert(!/^(https?:|data:|javascript:)/.test(url));assert(fs.existsSync(path.resolve(dir,url)),url);}
 }
 for(const [,url]of css.matchAll(/url\(['"]?([^)'"\s]+)/g))assert(fs.existsSync(path.resolve(dir,url)),url);
 for(const [,url]of html.matchAll(/<a\b[^>]*href="([^"]+)"/g))assert(url.startsWith('#'));
});
test('five activities share selection, explicit execution, reopening and preserved cancel routes',()=>{
 assert.deepEqual([...html.matchAll(/data-choice="([^"]+)"/g)].map(m=>m[1]),actions);
 for(const action of actions){
  assert.match(html,new RegExp(`class="action-state for-${action}"`));
  assert.match(html,new RegExp(`class="action-choice" href="#pick-${action}"`));
  assert.match(html,new RegExp(`class="cancel for-${action}" href="#${action}">취소`));
  assert.match(html,new RegExp(`class="picker-scrim for-${action}" href="#${action}"`));
  const block=html.match(new RegExp(`<article class="action-state for-${action}"[\\s\\S]*?<\\/article>`))[0];
  assert.match(block,/<details class="execute">/);
  if(action!=='stl')assert(css.includes(`:is(#${action},#pick-${action}):target`));
 }
 assert.match(html,/id="mode-route" name="journey-mode" type="radio" checked/);
 assert.match(css,/:has\(\.picker-target:target\) :is\(\.deck,\.scene-switch\)\{visibility:hidden\}/);
 assert.match(html,/선택만으로 실행되지 않아요/);
});
test('scenery is a single stable assembly; only an explicit scenario checkbox switches backgrounds',()=>{
 assert.equal([...html.matchAll(/class="scenery"/g)].length,1);
 assert.equal([...html.matchAll(/class="dalguji"/g)].length,1);
 assert.match(html,/가상 도착 예시/);assert.match(html,/정적 합성 예시/);
 const owners=[];ast.walkDecls('--deck-height',d=>owners.push([d.parent.selector,d.value]));
 assert.deepEqual(owners,[[':root','272px'],['.prototype:has(#before:checked)','292px'],['.prototype:has(#before:checked):has(#mode-stay:checked)','340px']]);
 ast.walkRules(r=>{if(r.selector.includes('mode-stay'))assert(!r.selector.includes('.environment')&&!r.selector.includes('.dalguji'));});
 assert.match(css,/transition:opacity 650ms ease/);assert.match(css,/animation:content-in 150ms ease-out/);
 assert.doesNotMatch(css,/transition\s*:\s*(all|height|transform|flex)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/:focus-visible/);assert.doesNotMatch(css,/!important|line-clamp|text-overflow/);
});
test('conservative fixed-row allocation fits the proposed shell (not browser layout QA)',()=>{
 const deck=272,framePad=14,border=2,deckPad=8,tabs=44,panelPad=4;
 const available=deck-framePad-border-deckPad-tabs-panelPad;
 const route=58+38+48+44+3*4,stay=(58+38+48+2*4)+44+4;
 assert.equal(available,200);assert.equal(route,available);assert.equal(stay,available);
 for(const height of [568,728,800]){
  const game=height-44,dock=height<=650?56:66;
  for(const d of [272,292,340])assert(game-d-44-dock>=84,`${height}px / ${d}px deck`);
 }
 const summaries=[];ast.walkRules(r=>{if(r.selector==='.quiet-link>summary'||r.selector==='.execute>summary')r.walkDecls('min-height',d=>summaries.push(+d.value.replace('px','')));});
 assert.deepEqual(summaries,[48,44]);
});
test('primary copy and selected palette meet 4.5:1 contrast (not visual QA)',()=>{
 const lum=h=>{const v=h.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722};
 for(const [fg,bg]of [['#f0eee2','#202820'],['#c1c4b5','#202820'],['#edc986','#202820'],['#fff5df','#99632c']]){
  const [a,b]=[lum(fg),lum(bg)].sort((a,b)=>b-a);assert((a+.05)/(b+.05)>=4.5,`${fg} on ${bg}`);
 }
});
