const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const folder=path.resolve(__dirname,'../tools/design-drafts');
const read=name=>fs.readFileSync(path.join(folder,name),'utf8');
const html=read('departure-brief.html'),css=read('departure-brief.css');

test('departure draft is registered without removing existing prototypes',()=>{
 const manifest=JSON.parse(read('manifest.json'));
 assert.equal(manifest.version,1);
 assert.equal(new Set(manifest.drafts.map(d=>d.id)).size,manifest.drafts.length);
 const draft=manifest.drafts.find(d=>d.id==='departure-brief-v1');
 assert.equal(draft.file,'departure-brief.html');assert.equal(draft.revision,'1');
 assert.equal(draft.recommended,true);
 assert(manifest.drafts.some(d=>d.id==='intro-recollection-v1'));
});

test('prototype cannot execute scripts, navigate the game or read/write saves',()=>{
 assert.match(html,/default-src 'none'; style-src 'self'; img-src 'self'; form-action 'none'; base-uri 'none'/);
 assert.doesNotMatch(html,/<script\b|\bon\w+\s*=|localStorage|sessionStorage|<iframe\b|<form\b|javascript:/i);
 assert.match(html,/게임에 미적용/);
 for(const [,target] of html.matchAll(/<a\b[^>]*href="([^"]+)"/g))assert(target.startsWith('#'));
 assert.doesNotMatch(fs.readFileSync(path.resolve(folder,'../build-html.mjs'),'utf8'),/departure-brief/);
});

test('resources and both navigation endpoints resolve; only the existing illustration is used',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  assert(!/^(https?:|data:|javascript:)/.test(url));
  if(url.startsWith('#'))assert(ids.includes(url.slice(1)),url);
  else assert(fs.existsSync(path.resolve(folder,url.split('?')[0])),url);
 }
 const images=[...html.matchAll(/<img\b[^>]*src="([^"]+)"/g)];
 assert.equal(images.length,1);
 assert.equal(images[0][1],'../../assets/scenes/onboarding-main-mission-v1.jpg');
 assert.match(html,/href="#road-return">길로 나가기/);
 assert.match(html,/href="#mission">초안으로 돌아가기/);
 assert.match(html,/자동으로 출발하지는 않아/);
});

test('one objective and three distinct leads preserve the mission without implying ownership or sequence',()=>{
 const mission=html.slice(html.indexOf('<section class="mission-page"'),html.indexOf('<section class="return-page"'));
 assert.equal((mission.match(/<h1\b/g)||[]).length,1);
 assert.deepEqual([...mission.matchAll(/data-lead="([^"]+)"/g)].map(m=>m[1]),['record','key','testimony']);
 assert.match(mission,/남산의 강제 이송을/);
 assert.match(mission,/사람의 확인 없이는/);
 assert.match(mission,/사이드 미션은 내가 돕고 싶을 때/);
 assert.doesNotMatch(mission,/<input\b|<ol\b|자동 읽기|기록<|내가 해야 할 일|메인 스토리/);
});

test('CSS has one isolated owner, readable large type and no clipping or automatic motion',()=>{
 const ast=require('postcss').parse(css);
 assert.doesNotMatch(css,/!important|animation\s*:|transition\s*:|line-clamp|text-overflow|overflow(?:-[xy])?\s*:\s*(?:hidden|clip)/);
 assert.doesNotMatch(css,/#ev-sheet|#app|#frame/);
 const decl=(selector,property)=>{
  let value;ast.walkRules(selector,rule=>rule.walkDecls(property,d=>{value=d.value}));return value;
 };
 assert.equal(decl('.mission-copy','flex'),'none');
 assert.equal(decl('.mission-actions','flex'),'none');
 assert.equal(decl('.mission-art','flex'),'1 1 0');
 assert.equal(decl('.road-action','min-height'),'52px');
 assert.equal(decl('body:has(#large-text:checked)','--body-size'),'20px');
 assert.equal(decl('body:has(#full-art:checked) .mission-art img','object-fit'),'contain');
 assert.match(css,/:focus-visible/);
 assert.match(css,/:has\(#road-return:target\)/);
});

test('specified text/button colors meet 4.5:1 (static palette check, not visual QA)',()=>{
 const luminance=hex=>{
  const rgb=hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255)
   .map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
 };
 const color=name=>css.match(new RegExp('--'+name+': (#[a-f0-9]{6});'))[1];
 for(const [fg,bg] of [['ink','cabin'],['muted','cabin'],['muted','outside'],['cabin','brass']]){
  const [a,b]=[luminance(color(fg)),luminance(color(bg))].sort((a,b)=>b-a);
  assert((a+.05)/(b+.05)>=4.5,fg+' on '+bg);
 }
});
