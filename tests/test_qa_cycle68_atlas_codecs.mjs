import {projectOriginalToCompressed} from './qa-cycle72-original-projection.mjs';
import {projectCycle72} from './qa-cycle72-atlas-projection.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {runtimeAtlas} from '../tools/runtime-landscape-atlas.mjs';
const root=path.resolve(import.meta.dirname,'..');
const fixture=path.join(root,'tests/fixtures/qa-cycle68-atlas-codecs');
const before=JSON.parse(fs.readFileSync(path.join(fixture,'baseline.json')));
const approved=JSON.parse(fs.readFileSync(path.join(fixture,'approved-delivery.json'))).routes;
const delta=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/qa-cycle70-atlas-codecs/approved-delivery.json'))).routes;
const deltaById=new Map(delta.map(x=>[x.id,x]));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
test('runtime atlas selects only approved delivery while preserving all panorama semantics',()=>{
 assert.equal(approved.length,43); assert.equal(new Set(approved.map(x=>x.id)).size,43);
 const selected=new Map(approved.map(x=>[x.id,x])); const after=projectCycle72(root,projectOriginalToCompressed(root,runtimeAtlas(root)));
 assert.equal(after.routes.length,78); assert.equal(after.routes.filter(x=>!selected.has(x.id)).length,35);
 for(const [i,r] of after.routes.entries()){
  const old=before.routes[i], a=selected.get(r.id); assert.equal(r.id,old.id);
  assert.equal(sha(old.file),old.sha256);
  if(a){assert.equal(a.source,old.file);assert.equal(a.sourceSha256,old.sha256);assert.equal(sha(a.target),a.candidateSha256);const change=deltaById.get(r.id);if(change){assert.equal(change.current,a.target);assert.equal(change.currentSha,a.candidateSha256);assert.equal(r.file,change.target);assert.equal(r.sha256,change.candidateSha)}else{assert.equal(r.file,a.target);assert.equal(r.sha256,a.candidateSha256)}}
  else {const change=deltaById.get(r.id);if(change){assert.equal(change.current,old.file);assert.equal(change.currentSha,old.sha256);assert.equal(r.file,change.target);assert.equal(r.sha256,change.candidateSha)}else{assert.equal(r.file,old.file);assert.equal(r.sha256,old.sha256)}}
 }
 const normalized=structuredClone(after);for(let i=0;i<normalized.routes.length;i++){normalized.routes[i].file=before.routes[i].file;normalized.routes[i].sha256=before.routes[i].sha256}
 assert.deepEqual(normalized,before);
});
test('approved assets retain dimensions and exact alpha; decoded RGB stays within limits',()=>{
 const script=`import json,sys,math\nfrom PIL import Image\nimport numpy as np\nfor x in json.load(open(sys.argv[1]))['routes']:\n a=np.asarray(Image.open(x['source']).convert('RGBA')); b=np.asarray(Image.open(x['target']).convert('RGBA'))\n assert a.shape==b.shape==(720,2160,4),x['id']\n assert np.array_equal(a[:,:,3],b[:,:,3]),x['id']\n d=a[:,:,:3].astype(np.int16)-b[:,:,:3].astype(np.int16)\n mse=np.mean(d.astype(np.float32)**2); psnr=10*math.log10(65025/mse); mae=float(np.abs(d).mean())\n assert psnr>40 and mae<2,(x['id'],psnr,mae)\n assert abs(psnr-x['rgbPsnr'])<0.001 and abs(mae-x['rgbMae'])<0.001,x['id']`;
 execFileSync('python3',['-c',script,path.join(fixture,'approved-delivery.json')],{cwd:root,env:{...process.env,OPENBLAS_NUM_THREADS:'1'},stdio:'pipe'});
});
