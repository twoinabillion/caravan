const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('./content-registry.cjs');
const dir=path.resolve(__dirname,'design-drafts'),html=fs.readFileSync(path.join(dir,'reading-density.html'),'utf8'),css=fs.readFileSync(path.join(dir,'reading-density.css'),'utf8');
test('registered independent comparison cannot access or change the live intro/save',()=>{
  const entry=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8')).drafts.find(item=>item.id==='reading-density-v1');
  assert.equal(entry.file,'reading-density.html');assert.match(entry.description,/자동 적용하지 않습니다/);
  assert.doesNotMatch(html,/<script\b|<iframe\b|<form\b|<audio\b|<video\b|\bon\w+\s*=|localStorage|sessionStorage|javascript:/i);
  assert.match(html,/default-src 'none'/);assert.doesNotMatch(fs.readFileSync('tools/build-html.mjs','utf8'),/reading-density/);
  for(const [,file]of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g))assert(fs.existsSync(path.resolve(dir,file)),file);
});
test('all twelve actual water-line turns are retained verbatim and in order',()=>{
  const ctx=vm.createContext({console});for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
  const turns=JSON.parse(vm.runInContext('JSON.stringify(D.intro.find(page=>page.scene==="intro-busan-water-line-v1").beats)',ctx));
  const excerpts=[...html.matchAll(/<p[^>]*data-source="intro-busan-water-line-v1:(\d+)"[^>]*>([^<]*)<\/p>/g)];
  assert.equal(excerpts.length,12);assert.equal(turns.length,12);
  assert.deepEqual(excerpts.map(match=>Number(match[1])),turns.map((_,index)=>index));
  assert.deepEqual(excerpts.map(match=>match[2]),turns.map(turn=>turn.text));
});
test('one owner changes 16/1.55 to 17/1.6; large text remains 21 without resizing the picture',()=>{
  const rules=[];require('postcss').parse(css).walkRules(rule=>rules.push(rule));
  assert.match(css,/--copy:16px;--leading:1\.55;--turn-gap:10px/);
  assert.match(css,/body:has\(#current-type:checked\)\{--copy:17px;--leading:1\.6;--turn-gap:12px/);
  assert.match(css,/body:has\(#large-type:checked\)\{--copy:21px;--portrait:44px\}/);
  assert.match(css,/\.scene-visual img\{[^}]*aspect-ratio:16\/9[^}]*object-fit:contain/);
  assert(!rules.filter(rule=>/checked/.test(rule.selector)).some(rule=>rule.nodes.some(decl=>/height|width|art/.test(decl.prop||''))));
  assert.doesNotMatch(css,/!important|line-clamp|text-overflow:ellipsis|#scr-|#ev-/);
});
test('ordinary title is still accessible and the complete text has scroll and return targets',()=>{
  assert.match(html,/aria-labelledby="scene-title"/);assert.match(html,/id="scene-title"/);
  assert.match(css,/\.paper h1\{[^}]*clip-path:inset\(50%\)/);
  assert.match(css,/\.reading-scroll\{[^}]*overflow-y:auto/);
  assert.match(css,/min-height:44px/);assert.match(css,/focus-visible/);
  for(const [,id]of html.matchAll(/href="#([^"]+)"/g))assert(html.includes('id="'+id+'"'));
  assert.match(html,/<input id="current-type" type="checkbox">현재 17px/);
  assert.match(html,/<input id="large-type" type="checkbox">큰 글씨/);
});
test('approved game reader uses 16px and 1.55 for all intro prose while large text remains 21px',()=>{
  const source=fs.readFileSync('src/01-style.html','utf8'),ast=require('postcss').parse(source.replace(/<\/?style\b[^>]*>/g,''));
  const value=(selector,property)=>{
    const found=[];ast.walkRules(rule=>{if(rule.selector===selector)rule.walkDecls(property,decl=>found.push(decl.value));});
    assert.equal(found.length,1,selector+' '+property+' has one owner');return found[0];
  };
  const intro='#intro-book[data-reader-density="quiet"]',event='#app #ev-wrap.on #ev-sheet.passenger-reader[data-reader-layout="pages"][data-reader-density="quiet"]';
  const size=expression=>{
    const match=expression.match(/^calc\(var\(--reading-body-size,(\d+)px\) \+ (\d+)px\)$/);assert(match);
    return {normal:Number(match[1])+Number(match[2]),large:Number(value('.ui-large-text','--reading-body-size').replace('px',''))+Number(match[2])};
  };
  assert.deepEqual(size(value(intro,'--quiet-body')),{normal:16,large:21});
  assert.deepEqual(size(value(event,'--dialogue-body-size')),{normal:16,large:21});
  assert.equal(value(intro+' #intro-txt :is(.chat-bubble,.story-narration-text,.turn-text)','font'),'400 var(--quiet-body)/1.55 var(--sans)');
  assert.equal(value(intro,'--intro-transcript-gap'),'10px');
  assert.equal(value(intro,'--intro-narration-padding'),'5px 0');
  assert.equal(value(intro+' #intro-txt .intro-chat','gap'),'var(--intro-transcript-gap)');
  const transcriptGaps=[];ast.walkRules(rule=>{if(rule.selectors.includes('#intro-txt .story-transcript'))rule.walkDecls('gap',decl=>transcriptGaps.push(decl.value));});
  assert.equal(transcriptGaps.at(-1),'var(--intro-transcript-gap,15px)','the winning non-chat owner uses the quiet gap without changing legacy events');
  assert.equal(value(event,'--reader-paragraph-gap'),'10px');
  assert.equal(value(event,'--reader-line-height'),'1.55');
  assert.equal(value('#app #ev-sheet.passenger-reader[data-reader-layout="pages"][data-reader-skin="materials"] .page-text','line-height'),'var(--reader-line-height,1.6)');
  assert.equal(value(intro,'--quiet-portrait'),'36px');
  assert.equal(value('.ui-large-text '+intro,'--quiet-portrait'),'44px');
  assert.equal(value('html.ui-large-text '+event,'--reader-portrait-size'),'44px');
  // Density root tokens must not shrink pictures or hide content.
  ast.walkRules(rule=>{if(rule.selector===intro||rule.selector===event){
    assert(!rule.nodes.some(decl=>/^(?:height|max-height|overflow|display|visibility|--reader-art-height)$/.test(decl.prop||'')),rule.selector);
  }});
  assert.equal(value('#app #ev-wrap.on #ev-sheet.passenger-reader[data-reader-layout="pages"]','--dialogue-body-size'),'calc(var(--reading-body-size,15px) + 3px)','legacy typography is unchanged');
});
