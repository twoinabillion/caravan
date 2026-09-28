'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {audit}=require('./audit-people-catalog.cjs');
const root=path.resolve(__dirname,'..');
const dir=path.join(__dirname,'design-drafts');
const book=path.join(dir,'people-catalog');
const data=JSON.parse(fs.readFileSync(path.join(book,'catalog.json'),'utf8'));
const html=fs.readFileSync(path.join(dir,'people-catalog.html'),'utf8');
const ready=data.people.filter(p=>p.status==='draft');
test('planned references have unique persistent IDs and explicit non-runtime status',()=>{
  assert.equal(new Set(data.people.map(p=>p.id)).size,data.people.length);
  assert.equal(data.runtimeApplied,false);
  assert.equal(data.stage,'reference-draft');
  for(const p of data.people){assert.match(p.id,/^[a-z_]+$/);assert.ok(['lead','named','anonymous'].includes(p.group));assert.ok(['draft','pending','blocked'].includes(p.status));}
});
test('every existing human canonical portrait is included without overwriting it',()=>{
  for(const p of audit().canonical){
    const found=data.people.find(x=>x.id===p.id);assert.ok(found,p.id);assert.equal(found.portrait,p.portrait);assert.ok(found.references.includes(p.portrait));
  }
  assert.equal(data.people.find(p=>p.id==='player_child').portrait,'assets/portraits/player_child.png');
  assert.notEqual(data.people.find(p=>p.id==='intro_child').id,data.people.find(p=>p.id==='roadcrew_doyun').id);
});
test('each visible draft has a unique master, preview, prompt and complete reference provenance',()=>{
  const hashes=new Set();
  for(const p of ready){
    const stem=p.id+'-'+(p.version||'v1');
    const png=fs.readFileSync(path.join(book,'masters',stem+'.png'));
    assert.equal(png.subarray(1,4).toString(),'PNG');
    assert.equal(png.readUInt32BE(16),1024,stem);assert.equal(png.readUInt32BE(20),1536,stem);assert.equal(png[25],6,'RGBA: '+stem);
    const hash=crypto.createHash('sha256').update(png).digest('hex');assert.ok(!hashes.has(hash),'duplicated bitmap: '+stem);hashes.add(hash);
    const preview=fs.readFileSync(path.join(book,'previews',stem+'.webp'));assert.equal(preview.subarray(8,12).toString(),'WEBP');
    assert.ok(fs.readFileSync(path.join(book,'prompts',stem+'.txt'),'utf8').length>200);
    assert.equal(p.references.length,5);for(const ref of p.references)assert.ok(fs.existsSync(path.join(root,ref)),ref);
  }
});
test('catalog reports only successful files and preserves incomplete slots',()=>{
  assert.equal((html.match(/<article class="person"/g)||[]).length,ready.length);
  for(const p of data.people.filter(p=>p.status!=='draft')){assert.ok(!html.includes('id="person-'+p.id+'"'));assert.ok(html.includes(p.name));}
});
test('all local presentation links exist and no script, save, game apply or network action exists',()=>{
  assert.ok(!/<script|<iframe|<form|onclick=|postMessage|localStorage|sessionStorage|fetch\(/i.test(html));
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
    const ref=match[1];if(ref.startsWith('#')){assert.ok(html.includes('id="'+ref.slice(1)+'"'));continue;}
    assert.ok(!ref.includes('://'));assert.ok(fs.existsSync(path.resolve(dir,ref)),ref);
  }
  assert.ok(html.includes('게임과 저장에는 미적용'));assert.ok(html.includes('접근 제한으로 미검수'));
});
test('Studio manifest points at the isolated draft only',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
  const entries=Array.isArray(manifest)?manifest:manifest.drafts;
  const entry=entries.find(p=>p.id==='people-catalog-v1');assert.ok(entry);assert.equal(entry.file,'people-catalog.html');
});
