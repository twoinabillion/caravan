const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const source=path.join(root,'assets/ui/road-environment/continuous-v3.json');
const hash=b=>createHash('sha256').update(b).digest('hex');

test('the road-art production contract exists before any unreviewed art can be wired',()=>{
 assert(fs.existsSync(source),'continuous route contract has not been created');
 const m=JSON.parse(fs.readFileSync(source));
 assert.equal(m.version,3);assert.equal(typeof m.enabled,'boolean');
 assert.equal(Object.keys(m.nodes).length,58);assert.equal(m.routes.length,78);
});

test('fixed city owners survive arbitrary route ordering and asset changes are rejected',()=>{
 const {validate}=require('../tools/continuous-route-contract.cjs');
 const m=JSON.parse(fs.readFileSync(source));
 const a=validate(root,m),b=validate(root,{...m,routes:[...m.routes].reverse()});
 assert.deepEqual(a.nodes,b.nodes);
 const bad=structuredClone(m);bad.nodes.busan.sha256='0'.repeat(64);
 assert.throws(()=>validate(root,bad),/node hash mismatch: busan/);
});

test('graph coverage and direction are authoritative, and draft artwork never passes release validation',()=>{
 const {validate}=require('../tools/continuous-route-contract.cjs');
 const m=JSON.parse(fs.readFileSync(source));
 const missing=structuredClone(m);missing.routes.pop();
 assert.throws(()=>validate(root,missing),/graph coverage/);
 const swapped=structuredClone(m);[swapped.routes[0].from,swapped.routes[0].to]=[swapped.routes[0].to,swapped.routes[0].from];
 assert.throws(()=>validate(root,swapped),/route orientation/);
 const draft=structuredClone(m);draft.enabled=false;draft.routes[0].status='pending';
 assert.throws(()=>validate(root,draft,{requireComplete:true}),/unaccepted road art/);
 const fake=structuredClone(m);const r=fake.routes[0];r.status='accepted';delete r.review;
 assert.throws(()=>validate(root,fake),/review evidence required/);
});

test('approved connector geometry and content are verified, not inferred from a claimed review flag',()=>{
 const {validate}=require('../tools/continuous-route-contract.cjs');
 const m=JSON.parse(fs.readFileSync(source)),temp=fs.mkdtempSync(path.join(os.tmpdir(),'caravan-road-contract-'));
 m.enabled=false;m.routes.forEach(r=>{r.status='pending';});
 try{
  // Exercise the delivery gate with a real2048x576 candidate, without
  // asserting that its appearance has passed a visual review.
  const bytes=fs.readFileSync(path.join(root,"assets/ui/road-studies/continuous-v3/nodes/busan.webp"));
  fs.writeFileSync(path.join(temp,'bridge.png'),bytes);
  const r=m.routes.find(r=>r.status==='pending');r.status='accepted';r.review={file:'review.json',reviewedAt:'2026-11-01',accepted:true};
  r.connector={file:'bridge.png',sha256:hash(bytes),width:2048,height:576};
  const review={route:r.id,sha256:hash(bytes),fromSha256:m.nodes[r.from].sha256,toSha256:m.nodes[r.to].sha256,joinSha256:hash(fs.readFileSync(path.join(root,'tools/continuous-route-join.cjs'))),accepted:true,checks:Object.fromEntries(['geometry','style','joins','crop320','crop360','crop480','forward','reverse'].map(k=>[k,true]))};
  fs.writeFileSync(path.join(temp,'review.json'),JSON.stringify(review));
  const resolver=p=>p==='bridge.png'||p==='review.json'?path.join(temp,p):path.join(root,p);
  assert.equal(validate(root,m,{resolve:resolver}).accepted,1);
  for(const field of ['fromSha256','toSha256','joinSha256']){
   fs.writeFileSync(path.join(temp,'review.json'),JSON.stringify({...review,[field]:'0'.repeat(64)}));
   assert.throws(()=>validate(root,m,{resolve:resolver}),/stale route review/);
  }
  fs.writeFileSync(path.join(temp,'review.json'),JSON.stringify(review));
  r.connector.width=768;assert.throws(()=>validate(root,m,{resolve:resolver}),/connector geometry/);
  r.connector.width=2048;r.connector.sha256='0'.repeat(64);assert.throws(()=>validate(root,m,{resolve:resolver}),/connector hash/);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
