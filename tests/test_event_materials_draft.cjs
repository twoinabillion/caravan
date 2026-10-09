const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),sharp=require('sharp');
const folder=path.resolve(__dirname,'../tools/design-drafts'),read=f=>fs.readFileSync(path.join(folder,f),'utf8');
const html=read('event-materials.html'),css=read('event-materials.css');
test('isolated material draft is registered and cannot execute gameplay or write saves',()=>{
 const entry=JSON.parse(read('manifest.json')).drafts.find(d=>d.id==='event-materials-v1');
 assert.equal(entry.file,'event-materials.html');assert.equal(entry.revision,'1');
 assert.match(html,/default-src 'none'/);assert.match(html,/form-action 'none'/);
 assert.doesNotMatch(html,/<script\b|<iframe\b|<form\b|\bon\w+\s*=|localStorage|sessionStorage|javascript:/i);
 assert(!fs.readFileSync('tools/build-html.mjs','utf8').includes('event-materials'));
});
test('every control has a local reachable destination; results are hidden before choice',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length);
 for(const [,href]of html.matchAll(/href="([^"]+)"/g))if(href.startsWith('#'))assert(ids.includes(href.slice(1)),href);
 for(const [,src]of html.matchAll(/(?:src|href)="([^"]+)"/g))if(!src.startsWith('#'))assert(fs.existsSync(path.resolve(folder,src)),src);
 assert.match(css,/\.event-page\{display:none/);assert.match(css,/\.page-slot \.event-page:target\{display:flex/);
 assert.match(css,/\.reading-scroll\{[^}]*overflow-y:auto/);assert.match(css,/\.page-actions\{[^}]*flex:none/);
 assert.match(css,/object-fit:contain/);assert.match(css,/:focus-visible/);assert.match(css,/prefers-reduced-motion/);
 assert.doesNotMatch(css,/line-clamp|text-overflow|!important/);
 require('postcss').parse(css);
});
test('current event text, choices, outcomes, time and receipt titles are unchanged',()=>{
 const ctx=vm.createContext({console});
 for(const file of require('../tools/content-registry.cjs').STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
 const event=JSON.parse(JSON.stringify(vm.runInContext("D.openingDeparture.find(e=>e.id==='opening_failed_appeal')",ctx)));
 const text=s=>s.replaceAll('&amp;','&');
 for(const [index,turn]of event.turns.entries())assert.equal(text(html.match(new RegExp('data-turn="'+index+'">([^<]*)</p>'))[1]),turn.text);
 for(const choice of event.choices){
  const markup=html.match(new RegExp('data-choice="'+choice.id+'"[^>]*>([\\s\\S]*?)</a>'))[1];
  assert(markup.includes(choice.label));assert(markup.includes(choice.foreseeable.expense));
  assert.equal(text(html.match(new RegExp('data-result="'+choice.id+'">([^<]*)</p>'))[1]),choice.out[0].text);
  assert(html.includes(choice.out[0].fx.note.title));
 }
});
test('transparent generated components have separate UI geometry and canonical provenance',async()=>{
 const proof=JSON.parse(read('event-materials/provenance.json')),contract=JSON.parse(fs.readFileSync('assets/visual-contract.json','utf8'));
 assert.equal(proof.styleId,contract.styleId);assert.deepEqual(proof.requiredReferences,contract.requiredReferences);
 for(const id of ['frame','button']){
  const file=path.join(folder,'event-materials',id+'-v1.webp'),meta=await sharp(file).metadata(),spec=proof.contract[id];
  assert.equal(meta.width,spec.delivery[0]);assert.equal(meta.height,spec.delivery[1]);assert(meta.hasAlpha);assert.equal(meta.format,'webp');assert(fs.statSync(file).size<=spec.maxBytes);
  const master=await sharp(path.join(folder,'event-materials/masters',id+'-v1.png')).metadata();assert(master.width>=meta.width&&master.height>=meta.height);
  const pixel=await sharp(file).extract({left:Math.floor(meta.width/2),top:Math.floor(meta.height/2),width:1,height:1}).ensureAlpha().raw().toBuffer();
  if(id==='frame')assert.equal(pixel[3],0);else assert(pixel[3]>=250);
 }
});
