const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const {root,sha}=require('../tools/road-hd-plan.cjs'),{frame,WORLD}=require('../tools/road-hd-layout.cjs');
const p=JSON.parse(fs.readFileSync(path.join(root,'assets/ui/road-connectors/manifest-hd.json')));
test('All78actual corridors have native1024px candidates, untouched shared cities and no automatic approvals',async()=>{
 const real=require('../tools/road-route-plan.cjs').catalogue().routes;
 assert.deepEqual(p.routes.map(r=>r.id).sort(),Array.from(real,r=>r.id).sort());assert.equal(p.enabled,false);
 const cities=new Map();
 for(const r of p.routes){
  const c=r.nativeCandidate;assert.ok(c,r.id);assert.ok(c.sourcePixelsPerViewport>=1024,r.id);assert.ok(c.sourcePixelsPerViewport>=480*2,r.id);
  const m=await sharp(path.join(root,c.file)).metadata();assert.equal(m.width,1024);assert.equal(m.height,576);assert.ok(m.hasAlpha);
  assert.equal(sha(c.file),c.sha256);assert.equal(c.acceptance.style,false);assert.equal(c.acceptance.reload,false);assert.equal(c.acceptance.motion,false);
  for(const city of r.canonicalCities){assert.equal(sha(city.file),city.sha256);if(cities.has(city.id))assert.equal(cities.get(city.id),city.sha256);cities.set(city.id,city.sha256);}
  const receipt=JSON.parse(fs.readFileSync(path.join(root,c.provenance)));
  assert.equal(receipt.kind,'mechanical-native-master-crop');assert.equal(receipt.visualApproval,false);assert.equal(receipt.gameEnabled,false);
  assert.equal(sha(receipt.sourceMaster),receipt.sourceSha256);assert.equal(receipt.crop.width,c.sourcePixelsPerViewport);
 }
 assert.equal(cities.size,58);
});
test('Uniform native projection covers all travel positions in both directions without strip warping',()=>{
 for(const r of p.routes)for(const width of [320,360,480])for(const reverse of [false,true])for(let n=0;n<=100;n++){
  const f=frame(n/100,{width,reverse});const spans=f.plates.map(s=>[s.x,s.x+s.width]).sort((a,b)=>a[0]-b[0]);
  assert.ok(spans[0][0]<=1e-9,r.id);let end=spans[0][1];for(const span of spans.slice(1)){assert.ok(span[0]<=end+1e-9);end=Math.max(end,span[1]);}assert.ok(end>=width-1e-9);
  assert.ok(f.plates.every(s=>s.width===width&&!s.mirrored));assert.equal(f.baseline,.72);
 }
 assert.equal(frame(0).camera,0);assert.equal(frame(1).camera,(WORLD-1)*360);
 assert.equal(frame(1,{reverse:true}).camera,0);assert.equal(frame(0,{reverse:true}).camera,(WORLD-1)*360);
});
test('Studio draft is script-free and all78entries have explicit stop/return/join controls',()=>{
 const html=fs.readFileSync(path.join(root,'tools/design-drafts/scenery-hd-all.html'),'utf8'),css=fs.readFileSync(path.join(root,'tools/design-drafts/scenery-hd-all.css'),'utf8');
 assert.equal((html.match(/class="hd-route"/g)||[]).length,78);assert.equal((html.match(/class="hd-world"/g)||[]).length,78);
 for(const c of ['play','pause','reverse','start','first','middle','last','end'])assert.equal((html.match(new RegExp('class="'+c+'"','g'))||[]).length,78);
 assert.doesNotMatch(html,/<script|localStorage|sessionStorage|caravan-live|onclick=/i);assert.doesNotMatch(html,/<svg|<canvas|preserveAspectRatio/i);
 assert.match(css,/animation-play-state:paused/);assert.match(css,/prefers-reduced-motion/);assert.doesNotMatch(css,/scale\(1|scaleY|blur\(|!important/);
 assert.match(html,/재출력 78\/78/);assert.match(html,/생산 승인0개/);assert.match(html,/게임 미적용/);
 assert.equal(require('../tools/design-drafts/manifest.json').drafts.filter(d=>d.id==='scenery-hd-all-v1').length,1);
});
test('Generation receipts are exact and rejected outputs remain separate from acceptance',()=>{
 for(const r of p.routes.filter(r=>r.file)){
  const receipt=JSON.parse(fs.readFileSync(path.join(root,r.provenance)));assert.equal(receipt.tool,'image_gen.imagegen');assert.ok(receipt.prompt.length>500);
  assert.equal(receipt.references.length,5);assert.ok(receipt.generatedSource.includes('/generated_images/'));assert.ok(fs.existsSync(path.join(root,receipt.master)));
  assert.equal(receipt.sha256,sha(r.file));assert.equal(receipt.visualApproval,false);assert.equal(r.acceptance.geometry,false);assert.equal(r.acceptance.style,false);
 }
});
