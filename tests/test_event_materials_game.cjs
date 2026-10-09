// Ownership/assets/build contracts, not a replacement for native visual QA.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),sharp=require('sharp'),postcss=require('postcss');
const read=path=>fs.readFileSync(path,'utf8');
const css=read('src/01-style.html'),ui=read('src/07-ui.js');
const owner=css.match(/<style id="passenger-story-reader">([\s\S]*?)<\/style>/)[1];
test('one reader owner stages the entire materials skin, excluding combat and the departure brief',()=>{
  const rules=[];postcss.parse(owner).walkRules(rule=>{if(rule.selector.includes('[data-reader-skin="materials"]')&&!rule.selector.includes(':not([data-reader-skin'))rules.push(rule);});
  assert(rules.length>20);
  for(const rule of rules)assert(rule.selector.includes('.passenger-reader[data-reader-layout="pages"][data-reader-skin="materials"]'));
  const rest=css.replace(/<style id="passenger-story-reader">[\s\S]*?<\/style>/,'');
  assert(!rest.includes('data-reader-skin="materials"'));
  assert.match(ui,/readerSkin=!evd\.combat&&!missionOnly\?'materials':''/);
  assert.match(ui,/readerLayout:'pages',readerSkin:'materials'/);
  assert.match(ui,/delete \$\('#ev-sheet'\)\.dataset\.readerSkin/);
  for(const part of ['.event-head h2','.event-scene-frame:not(.zoomed)','.event-field-report','.page-speaker b','.page-turn[data-kind="ai"]','.event-choice-dock','.story-changes'])assert(rules.some(r=>r.selector.endsWith(part)),part);
  const artOwners=rules.filter(r=>r.nodes.some(n=>n.prop==='--reader-art-height'));
  assert(artOwners.length>=2,'ordinary and short viewport geometry');
  for(const rule of artOwners){
    assert(rule.selector.startsWith('#app #ev-wrap.on #ev-sheet'),'art must match root specificity');
    assert(!rule.selector.includes('data-story-step'),'reading/choices/results must share scene height');
  }
});
test('AI source keeps its authored terminal name, with the legacy broadcast fallback',()=>{
  const vm=require('node:vm');
  const source=ui.slice(ui.indexOf('  function pagedStoryHtml('),ui.indexOf('  function storyResultPageTurns('));
  const ctx={speakerInfo:()=>({}),esc:String,fmt:String};vm.createContext(ctx);vm.runInContext(source,ctx);
  assert(ctx.pagedStoryHtml([{kind:'ai',name:'부두 민원 단말',text:'원격 응답'}]).includes('부두 민원 단말'));
  assert(ctx.pagedStoryHtml([{kind:'ai',text:'응답'}]).includes('천리안 방송'));
});
test('generated silhouette has no solid rectangular backing, 9-slice fill or competing oval; text and accessibility survive',()=>{
  const scoped=[];postcss.parse(owner).walkRules(r=>{if(r.selector.includes('[data-reader-skin="materials"]'))scoped.push(r);});
  const button=scoped.find(r=>r.selector.endsWith(':is(.choice,.story-next)'));
  const prop=(rule,key)=>rule.nodes.find(n=>n.prop===key)?.value;
  assert.equal(prop(button,'background'),'transparent url("__UI_EVENT_MATERIAL_BUTTON__") center / 100% 100% no-repeat');
  assert.equal(prop(button,'border'),'0');assert.equal(prop(button,'border-image'),'none');
  assert.match(owner,/:is\(\.choice,\.story-next\)::after\{display:none!important\}/);
  const report=scoped.find(r=>r.selector.endsWith('.event-field-report'));
  assert.equal(prop(report,'background'),'var(--reader-page) padding-box');
  assert(!prop(report,'border-image').includes('fill'));
  assert(scoped.some(r=>r.selector.endsWith('.choice:disabled')));
  assert.match(owner,/:focus-visible/);assert.match(owner,/prefers-reduced-motion/);
  assert.doesNotMatch(owner.slice(owner.indexOf('/* Approved materials v1')),/line-clamp|text-overflow:ellipsis/);
  assert.match(ui,/sheet\.dataset\.pageFallback='actions'/);
});
test('promoted assets preserve alpha and master provenance within the unchanged HTML budget',async()=>{
  const manifest=JSON.parse(read('assets/ui/event-materials-v1.json'));
  assert(fs.existsSync(manifest.sourceProvenance));assert(fs.existsSync(manifest.prompts));
  for(const [key,row] of Object.entries(manifest.assets)){
    const meta=await sharp(row.path).metadata();assert.deepEqual([meta.width,meta.height],row.delivery);assert(meta.hasAlpha);assert(fs.statSync(row.path).size<=row.maxBytes);
    const {data,info}=await sharp(row.path).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const center=data[((Math.floor(info.height/2)*info.width+Math.floor(info.width/2))*4)+3];
    assert.equal(key==='frame'?center:Math.min(center,250),key==='frame'?0:250);
  }
  const built=read('서울까지400km.html');assert(Buffer.byteLength(built)<80_000_000);
  assert(!/__UI_EVENT_(?:READING_FRAME|MATERIAL_BUTTON)__/.test(built));
  assert(!/tools\/design-drafts\/event-materials/.test(built));
  assert(built.includes('--embedded-ui-event-reading-frame:url("data:image/webp;base64,'));
  assert(built.includes('--embedded-ui-event-material-button:url("data:image/webp;base64,'));
});
