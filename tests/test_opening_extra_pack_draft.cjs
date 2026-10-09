const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const folder=path.resolve(__dirname,'../tools/design-drafts');
const read=f=>fs.readFileSync(path.join(folder,f),'utf8');
const html=read('opening-extra-pack.html'),css=read('opening-extra-pack.css');
const proposal=JSON.parse(read('opening-extra-pack/proposal.json'));
test('registered isolated draft leaves the liked title unchanged',()=>{
 const title=s=>s.match(/    <section class="wharf-title"[\s\S]*?\n    <\/section>/)[0];
 assert.equal(title(html),title(read('opening-wharf.html')));
 assert(css.startsWith('/* Title'));assert.match(css,/@import "opening-wharf.css"/);
 const manifest=JSON.parse(read('manifest.json'));
 assert.equal(manifest.drafts.find(d=>d.id==='opening-extra-pack-v1').file,'opening-extra-pack.html');
 assert.equal(new Set(manifest.drafts.map(d=>d.id)).size,manifest.drafts.length);
 assert.match(html,/default-src 'none'/);assert.match(html,/form-action 'none'/);
 assert.doesNotMatch(html,/<script\b|<form\b|<iframe\b|\bon\w+\s*=|localStorage|sessionStorage|javascript:/i);
 assert.doesNotMatch(fs.readFileSync(path.join(folder,'../build-html.mjs'),'utf8'),/opening-extra-pack/);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length);
 for(const [,target] of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)){assert(target.startsWith('#'));assert(ids.includes(target.slice(1)),target)}
 assert.match(html,/maxlength="8"/);
});
test('one large bundle preview switches with the selected pack and ready CTA',()=>{
 assert.equal((html.match(/name="extra-pack"/g)||[]).length,3);
 assert.equal((html.match(/<input[^>]*name="extra-pack"[^>]*checked/g)||[]).length,1);
 assert.match(html,/<input[^>]*id="pack-fuel"[^>]*checked/);
 assert.doesNotMatch(html,/기본 짐은 실어뒀어요|pack-basic|pack-scene|pack-disabled|pack-baseline/);
 assert.equal((html.match(/<figure class="pack-preview /g)||[]).length,3);
 assert.match(css,/\.pack-preview\{display:none/);
 assert.match(css,/\.pack-preview img\{[^}]*width:100%[^}]*aspect-ratio:16\/9[^}]*object-fit:contain/);
 for(const {id} of proposal.packs){
  assert.match(html,new RegExp('<figure class="pack-preview '+id+'-preview"[\\s\\S]*?'+id+'-v1.webp'));
  assert.match(css,new RegExp('#pack-'+id+':checked\\) \\.'+id+'-preview'));
  assert.match(css,new RegExp('#pack-'+id+':checked\\) \\.'+id+'-ready'));
 }
 assert.match(css,/\.pack-ready\{display:none/);
 assert.match(css,/input:focus-visible\+label/);
 require('postcss').parse(css);assert.doesNotMatch(css,/!important|line-clamp|text-overflow/);
 assert.match(css,/\.pack-scroll\{flex:1;min-height:0;overflow-y:auto/);
 assert.match(css,/\.pack-actions\{flex:none/);
});
test('proposed totals are base plus exactly one bundle, not existing startProfiles',()=>{
 assert.equal(proposal.status,'draft-unbalanced-not-game-data');
 const fields=['fuel','scrap','water','food','parts','van'];
 for(const pack of proposal.packs){
  const block=html.match(new RegExp('<section class="pack-total '+pack.id+'-total"[\\s\\S]*?</section>'))[0];
  const values=[...block.matchAll(/<dd[^>]*>(.*?)<\/dd>/g)].map(m=>m[1]);
  assert.deepEqual(values,fields.map(k=>String(proposal.base[k]+(pack.delta[k]||0))+(k==='fuel'?'L':k==='van'?'%':'')));
  assert.match(css,new RegExp('#pack-'+pack.id+':checked'));
 }
 assert.equal(proposal.base.medicine,1);assert.equal(proposal.base.ammo,0);
 assert.match(html,/새 시작 규칙·수치는 제안/);
});
test('three generated bundle plates use canonical refs and scene delivery geometry',async()=>{
 const contract=JSON.parse(fs.readFileSync(path.resolve(folder,'../../assets/visual-contract.json'),'utf8'));
 const provenance=JSON.parse(read('opening-extra-pack/prompts.json'));
 assert.equal(provenance.style,contract.styleId);assert.deepEqual(provenance.requiredReferences,contract.requiredReferences);
 assert.equal(provenance.prompts.length,3);
 for(const {id} of proposal.packs){
  const delivery=path.join(folder,'opening-extra-pack',id+'-v1.webp');
  const info=await require('sharp')(delivery).metadata();
  assert.equal(info.width,1024);assert.equal(info.height,576);assert.equal(info.format,'webp');
  assert(fs.statSync(delivery).size<=contract.assets.cinematicScene.maximumRecommendedBytes);
  const master=await require('sharp')(path.join(folder,'opening-extra-pack/masters',id+'-v1.png')).metadata();
  assert(master.width>=1536&&master.height>=864);
 }
});
