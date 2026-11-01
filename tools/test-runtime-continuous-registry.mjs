import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('unreviewed graph cannot activate or embed an image into production',async()=>{
 const file=path.join(root,'tools/runtime-continuous-terrain.mjs');assert(fs.existsSync(file),'production registry is not implemented');
 const {runtimeContinuous}=await import(file),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/ui/road-environment/continuous-v3.json')));let calls=0;
 const disabled=runtimeContinuous(root,{...manifest,enabled:false},()=>{calls++;return 'image';});assert.equal(disabled.enabled,false);assert.equal(Object.keys(disabled.nodes).length,0);assert.equal(calls,0);
 const unreviewed=structuredClone(manifest);unreviewed.enabled=true;unreviewed.routes[0].status='pending';
 assert.throws(()=>runtimeContinuous(root,unreviewed,()=>{calls++;return 'image';}),/unaccepted/);assert.equal(calls,0);
});
test('the reviewed graph embeds58city images and12shared corridors exactly once for78roads',async()=>{
 const {runtimeContinuous}=await import('./runtime-continuous-terrain.mjs'),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/ui/road-environment/continuous-v3.json'))),files=[];
 const registry=runtimeContinuous(root,{...manifest,enabled:true},file=>{files.push(file);return file;});
 assert.equal(Object.keys(registry.nodes).length,58);assert.equal(Object.keys(registry.corridors).length,12);assert.equal(registry.routes.length,78);
 assert.equal(files.length,70);assert.equal(new Set(files).size,70);
 const stale=structuredClone(manifest);stale.nodes.busan.review.file=stale.nodes.gimhae.review.file;
 assert.throws(()=>runtimeContinuous(root,{...stale,enabled:true},()=>assert.fail('embedded before validating every review')),/unaccepted city art/);
});
test('builder assembles the new owner once and preserves the legacy fallback',()=>{
 const builder=fs.readFileSync(path.join(root,'tools/build-html.mjs'),'utf8'),env=fs.readFileSync(path.join(root,'src/05a-road-environment.js'),'utf8');
 assert.equal(builder.split("'src/05f-continuous-terrain.js'").length>1,true,'new owner missing from build');
 assert(env.indexOf('CONTINUOUS_TERRAIN.draw')>=0,'new owner not connected');
 assert(env.indexOf('CONTINUOUS_TERRAIN.draw')<env.indexOf('ROAD_CONTINUITY.draw'));
});
