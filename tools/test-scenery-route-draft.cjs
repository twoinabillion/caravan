const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const dir=path.join(__dirname,'design-drafts');
const html=fs.readFileSync(path.join(dir,'scenery-route.html'),'utf8');
const css=fs.readFileSync(path.join(dir,'scenery-route.css'),'utf8');
const ast=require('postcss').parse(css);
test('connected route draft is registered and gameplay/save isolated',()=>{
  const drafts=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'))).drafts;
  const d=drafts.find(d=>d.id==='scenery-route-v1');
  assert.equal(d.file,'scenery-route.html');assert.equal(d.revision,'1');assert.equal(d.recommended,true);
  assert.equal(drafts.find(d=>d.id==='scenery-travel-v1').recommended,false);
  assert.equal(new Set(drafts.map(d=>d.id)).size,drafts.length);
  assert.match(d.description,/게임 미적용/);
  assert.match(html,/default-src 'none'; img-src 'self'; style-src 'self'; form-action 'none'; base-uri 'none'/);
  assert.doesNotMatch(html,/<script\b|\bon\w+\s*=|localStorage|sessionStorage|<iframe\b|<form\b|javascript:|\/src\//i);
  assert.doesNotMatch(fs.readFileSync(path.join(__dirname,'build-html.mjs'),'utf8'),/scenery-route/);
  assert.match(html,/실제 저장의 주행은 아니다/);assert.match(html,/게임과 저장에는 미적용/);
});
test('all references and labelled controls resolve',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
  for(const [,url]of html.matchAll(/(?:src|href)="([^"]+)"/g))assert(fs.existsSync(path.resolve(dir,url)),url);
  for(const [,id]of html.matchAll(/aria-labelledby="([^"]+)"/g))assert(ids.includes(id));
  assert.match(html,/journey-dalguji-base-v1.webp/);assert.doesNotMatch(html,/assets\/scenes\/|assets\/portraits\//);
  assert.match(html,/id="play" type="checkbox">/);assert.match(html,/id="pause" type="checkbox">/);
  assert.equal([...html.matchAll(/name="position"/g)].length,3);assert.match(html,/id="start" type="radio" name="position" checked/);
  for(const id of ['play','pause','middle','end'])assert(css.includes('#'+id+':checked'));
  assert.match(css,/animation-play-state:paused/);assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/focus-visible/);
});
test('terrain is one strip without crossfade/wipe/cover; truck geometry stays fixed',()=>{
  const block=html.match(/<div class="travel-strip animated">([\s\S]*?)<\/div>/)[1];
  assert.equal([...block.matchAll(/<img\b/g)].length,1);assert.match(block,/class="terrain"/);
  assert.doesNotMatch(html,/class="ridge|class="wipe/);
  assert.doesNotMatch(css,/opacity\s*:|filter\s*:|mask\s*:|transition\s*:|!important|infinite/);
  const animated=[];ast.walkRules(r=>r.walkDecls('animation',d=>animated.push([r.selector,d.value])));
  assert(animated.some(([s,v])=>s.endsWith('.travel-strip')&&v==='travel var(--duration) linear both'));
  assert(!animated.some(([s])=>/\.vehicle|\.sky|\.scene(?:\b|$)/.test(s)));
  ast.walkAtRules('keyframes',r=>r.walkDecls(d=>assert(['transform','background-position'].includes(d.prop),d.prop)));
  ast.walkRules(r=>{if(r.selector.includes(':checked'))r.walkDecls(d=>assert(!['height','width','min-height','max-height','scale'].includes(d.prop),d.prop));});
  // 3 window widths, exactly 2 window widths of travel: last crop stays inside art.
  assert.match(css,/width:300%/);assert.match(css,/translateX\(-66\.666667%\)/);
  assert.match(css,/translateX\(-33\.333333%\)/);
  assert.match(css,/aspect-ratio:18\/13/);
});
test('delivery preserves opaque ground, transparent sky and canonical geometry',async()=>{
  const file=path.join(dir,'scenery-route/miryang-daegu-v1.webp');const m=await sharp(file).metadata();
  assert.equal(m.width,1024);assert.equal(m.height,576);assert.equal(m.space,'srgb');assert.equal(m.hasAlpha,true);
  assert(fs.statSync(file).size<150000);
  const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let top=0,bottom=0;
  for(let x=0;x<info.width;x++){if(data[x*4+3]===0)top++;if(data[((info.height-1)*info.width+x)*4+3]>=250)bottom++;}
  assert.equal(top,info.width);assert(bottom/info.width>.98);
  const master=await sharp(path.join(dir,'scenery-route/masters/miryang-daegu-v1.png')).metadata();
  assert(master.width>=2160);assert.equal(master.width/master.height,3);
  const p=JSON.parse(fs.readFileSync(path.join(dir,'scenery-route/provenance.json')));
  for(const ref of ['visual-canon-2026-08-11.png','world-canon-2026-08-11.png','people-canon-2026-08-11.png','dalguji-technical-canon-2026-08-11.webp'])assert(p.references.some(r=>r.endsWith(ref)));
});
