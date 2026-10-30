'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
const rows=require('./fixtures/qa-cycle60-codecs/approved-delivery.json'),root=path.resolve(__dirname,'..');
test('reviewed WebP sidecars keep the JPEG masters, original geometry and approved delivery bytes',async()=>{
 assert.equal(rows.length,3);assert.equal(new Set(rows.map(r=>r.target)).size,3);
 for(const r of rows){
  assert.equal(r.target,r.source.replace(/\.jpg$/,'.webp'));assert.equal(r.quality,92);
  for(const [file,bytes,sha] of [[r.source,r.originalBytes,r.sourceSha256],[r.target,r.candidateBytes,r.candidateSha256]]){
   const b=fs.readFileSync(path.join(root,file));assert.equal(b.length,bytes,file);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),sha,file);
   const m=await sharp(b).metadata();assert.deepEqual([m.width,m.height],[r.width,r.height],file);
  }
  assert(r.saved>10000);assert(r.psnr>40);assert(r.meanAbsoluteError<2);
 }
 assert.equal(rows.reduce((sum,r)=>sum+r.saved,0),121892);
});
