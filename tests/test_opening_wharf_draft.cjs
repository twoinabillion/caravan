const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const folder=path.resolve(__dirname,'../tools/design-drafts');
const read=file=>fs.readFileSync(path.join(folder,file),'utf8');
const html=read('opening-wharf.html'),css=read('opening-wharf.css');

test('two-screen draft is registered and isolated from saves and gameplay',()=>{
 const manifest=JSON.parse(read('manifest.json'));
 assert.equal(new Set(manifest.drafts.map(d=>d.id)).size,manifest.drafts.length);
 assert.equal(manifest.drafts.find(d=>d.id==='opening-wharf-v1').file,'opening-wharf.html');
 assert.match(html,/default-src 'none'/);assert.match(html,/form-action 'none'/);
 assert.doesNotMatch(html,/<script\b|<form\b|<iframe\b|\bon\w+\s*=|localStorage|sessionStorage|javascript:/i);
 assert.match(html,/미적용 초안/);
 assert.doesNotMatch(fs.readFileSync(path.join(folder,'../build-html.mjs'),'utf8'),/opening-wharf/);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length);
 for(const [,target] of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)){
  assert(target.startsWith('#'));assert(ids.includes(target.slice(1)),target);
 }
 assert.match(html,/maxlength="8"/);
});

test('all three loadouts match real startProfiles without changing costs',()=>{
 const data=fs.readFileSync(path.resolve(folder,'../../src/03-data.js'),'utf8');
 const profiles=vm.runInNewContext('('+data.match(/D\.startProfiles = ([\s\S]*?);/)[1]+')');
 const baseline={fuel:42,scrap:24,water:16,food:14,parts:1,van:82};
 for(const [id,profile] of Object.entries(profiles)){
  const block=html.match(new RegExp('<section class="kit '+id+'"[\\s\\S]*?</section>'))[0];
  const state={...baseline,...profile.patch,parts:profile.patch.items?.['부품']??baseline.parts};
  assert.deepEqual([...block.matchAll(/<dd>(.*?)<\/dd>/g)].map(m=>m[1]),
   [state.fuel+'L',String(state.scrap),String(state.water),String(state.food),String(state.parts),state.van+'%']);
  assert.equal(block.match(/<p>(.*?)<\/p>/)[1].replaceAll('<br>',' '),profile.d);
 }
});

test('CSS parses, keeps the footer reachable and includes keyboard focus',()=>{
 require('postcss').parse(css);
 assert.doesNotMatch(css,/!important|animation\s*:|transition\s*:|line-clamp|text-overflow/);
 assert.match(css,/\.record-scroll\{[^}]*min-height:0;overflow-y:auto/);
 assert.match(css,/\.prep-actions\{flex:none/);
 assert.match(css,/input:focus-visible\+label/);
 assert.match(css,/#prepare:target/);
 for(const id of ['keeper','runner','hauler'])assert(css.includes('#wharf-'+id+':checked'));
});

test('two canonical-reference concept deliveries satisfy scene geometry and byte budget',async()=>{
 const contract=JSON.parse(fs.readFileSync(path.resolve(folder,'../../assets/visual-contract.json'),'utf8'));
 const prompts=JSON.parse(read('opening-wharf/prompts.json'));
 assert.equal(prompts.style,contract.styleId);
 assert.deepEqual(prompts.requiredReferences,contract.requiredReferences);
 for(const scene of ['harbor','cargo']){
  const image=path.join(folder,'opening-wharf',scene+'-v1.webp');
  const metadata=await require('sharp')(image).metadata();
  assert.equal(metadata.width,1024);assert.equal(metadata.height,576);
  assert.equal(metadata.format,'webp');
  assert(fs.statSync(image).size<=contract.assets.cinematicScene.maximumRecommendedBytes);
  const master=await require('sharp')(path.join(folder,'opening-wharf/masters',scene+'-v1.png')).metadata();
  assert(master.width>=1536&&master.height>=864);
 }
});
