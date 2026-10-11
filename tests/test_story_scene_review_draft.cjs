const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const html=read('tools/design-drafts/story-scene-review.html');
const provenance=JSON.parse(read('tools/design-drafts/story-scene-review/provenance.json'));

test('approved Suwon cache is source-wired while the canonical review draft stays isolated',async()=>{
  const page=read('tools/design-drafts/northern-cache-scene-review.html');
  const data=JSON.parse(read('tools/design-drafts/story-scene-review/northern-cache-provenance.json'));
  const contract=JSON.parse(read('assets/visual-contract.json')),sharp=require('sharp');
  const manifest=JSON.parse(read('tools/design-drafts/manifest.json'));
  assert.equal(manifest.drafts.find(d=>d.id==='northern-cache-scene-review-v1').file,'northern-cache-scene-review.html');
  assert.match(page,/default-src 'none'/);assert.match(page,/form-action 'none'/);
  assert.match(page,/사용자 승인/);assert.match(page,/게임 소스 연결/);
  assert.doesNotMatch(page,/<script\b|<form\b|<iframe\b|\bon\w+\s*=|localStorage|sessionStorage|javascript:/i);
  assert.equal(data.styleId,contract.styleId);assert.deepEqual(data.requiredReferences,contract.requiredReferences);
  assert.equal(data.review.wiredIntoGameplay,true);assert.match(data.review.SangApproval,/approved-2026-10-10/);
  assert.equal(data.review.sourceObserved,true);assert.equal(data.review.deliveryObserved,true);
  assert.match(data.review.actualInGameCrop,/not-observed/);
  for(const row of data.images){
    assert.deepEqual(row.references,contract.requiredReferences);assert(row.prompt.length>400);
    assert(page.includes(row.asset));assert(page.includes(row.original));
    assert(fs.existsSync(path.join(root,row.original)));
    const m=await sharp(path.join(root,row.master)).metadata();assert(m.width>=1536&&m.height>=864);
    const a=await sharp(path.join(root,row.asset)).metadata();
    assert.deepEqual([a.width,a.height],contract.assets.cinematicScene.preferredDelivery);
    assert.equal(a.format,'webp');assert.equal(a.space,'srgb');
    assert(fs.statSync(path.join(root,row.asset)).size<=contract.assets.cinematicScene.maximumRecommendedBytes);
    assert(read('src/03g-scenes.js').includes(row.asset));
    assert(read('src/03l-main-recovery.js').includes(row.id));
  }
});

test('mounted-key draft is registered, static, and cannot mutate a save or apply gameplay',()=>{
  const manifest=JSON.parse(read('tools/design-drafts/manifest.json'));
  assert.equal(manifest.drafts.find(d=>d.id==='story-scene-review-v1').file,'story-scene-review.html');
  assert.match(html,/default-src 'none'/);assert.match(html,/form-action 'none'/);
  assert.doesNotMatch(html,/<script\b|<form\b|<iframe\b|\bon\w+\s*=|localStorage|sessionStorage|javascript:/i);
  assert.match(html,/사용자 승인/);assert.match(html,/게임 소스 연결/);
  assert.match(html,/family-verification-key-mounted-v3.webp/);
  assert.match(html,/family-verification-key.jpg/);
  assert.equal(provenance.delivery.wiredIntoGameplay,true);
  assert(read('src/03g-scenes.js').includes(provenance.delivery.asset));
});

test('mounted-key master and delivery meet the canonical scene contract with honest review limits',async()=>{
  const contract=JSON.parse(read('assets/visual-contract.json'));
  assert.equal(provenance.styleId,contract.styleId);
  assert.deepEqual(provenance.requiredReferences,contract.requiredReferences);
  for(const file of provenance.requiredReferences)assert(fs.existsSync(path.join(root,file)));
  const sharp=require('sharp'),master=await sharp(path.join(root,provenance.delivery.master)).metadata();
  assert(master.width>=1536&&master.height>=864);
  const delivery=await sharp(path.join(root,provenance.delivery.asset)).metadata();
  assert.deepEqual([delivery.width,delivery.height],contract.assets.cinematicScene.preferredDelivery);
  assert.equal(delivery.format,'webp');assert.equal(delivery.space,'srgb');
  assert(fs.statSync(path.join(root,provenance.delivery.asset)).size<=contract.assets.cinematicScene.maximumRecommendedBytes);
  assert.match(provenance.review.SangApproval,/approved-2026-10-10/);
  assert.match(provenance.review.actualInGameCrop,/not-observed/);
  assert.match(provenance.review.actualStudioDraftWindow,/not-observed/);
  assert(fs.existsSync(path.join(root,provenance.preservedOriginal)));
});

test('approved finale images are source-wired, with a registered non-mutating review draft',()=>{
  const page=read('tools/design-drafts/finale-scene-review.html');
  const data=JSON.parse(read('tools/design-drafts/story-scene-review/finale-provenance.json'));
  const manifest=JSON.parse(read('tools/design-drafts/manifest.json'));
  assert.equal(manifest.drafts.find(d=>d.id==='finale-scene-review-v1').file,'finale-scene-review.html');
  assert.match(page,/default-src 'none'/);assert.match(page,/사용자 승인/);assert.match(page,/게임 소스 연결/);
  assert.doesNotMatch(page,/<script\b|<form\b|<iframe\b|\bon\w+\s*=|localStorage|sessionStorage|javascript:/i);
  assert.equal(data.review.wiredIntoGameplay,true);assert.match(data.review.SangApproval,/approved-2026-10-10/);
  for(const row of data.images){
    assert(page.includes(row.asset));assert(page.includes(row.original));
    assert(read('src/03g-scenes.js').includes(row.asset));
  }
});

test('night/dawn/terminal masters, prompts, references and delivery satisfy the scene contract',async()=>{
  const data=JSON.parse(read('tools/design-drafts/story-scene-review/finale-provenance.json'));
  const contract=JSON.parse(read('assets/visual-contract.json')),sharp=require('sharp');
  assert.equal(data.styleId,contract.styleId);assert.deepEqual(data.requiredReferences,contract.requiredReferences);
  assert.equal(data.images.length,3);assert.equal(data.review.sourceObserved,true);assert.equal(data.review.deliveryObserved,true);
  assert.match(data.review.actualInGameCrop,/not-observed/);assert.match(data.review.actualStudioDraftWindow,/not-observed/);
  assert.equal(data.images[1].editTarget,data.images[0].master,'dawn uses night as its edit reference');
  for(const row of data.images){
    assert.deepEqual(row.references,contract.requiredReferences);assert(row.prompt.length>400);
    assert(fs.existsSync(path.join(root,row.original)));
    const master=await sharp(path.join(root,row.master)).metadata();assert(master.width>=1536&&master.height>=864);
    const asset=await sharp(path.join(root,row.asset)).metadata();
    assert.deepEqual([asset.width,asset.height],contract.assets.cinematicScene.preferredDelivery);
    assert.equal(asset.format,'webp');assert.equal(asset.space,'srgb');
    assert(fs.statSync(path.join(root,row.asset)).size<=contract.assets.cinematicScene.maximumRecommendedBytes);
  }
});
