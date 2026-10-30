import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {inspectBuiltScenes} from '../tools/check-built-scenes.mjs';
const html=fs.readFileSync(new URL('../서울까지400km.html',import.meta.url),'utf8');
test('actual built scene registry contains only valid embedded scene bytes',async()=>{const report=await inspectBuiltScenes(html);assert.deepEqual(report.errors,[]);assert(report.keys>100)});
test('a dynamically constructed external path in actual evaluated registry is rejected',async()=>{const changed=html.replace("D.scenes = {","D.scenes = {\n 'test-dynamic-external':'assets/scenes/'+'missing.webp',");assert.notEqual(changed,html);const report=await inspectBuiltScenes(changed);assert(report.errors.some(s=>s.includes('test-dynamic-external')&&s.includes('assets/scenes/missing.webp')))});
test('invalid image payload is rejected',async()=>{const changed=html.replace("D.scenes = {","D.scenes = {\n 'test-invalid-image':'data:image/webp;base64,QUJD',");const report=await inspectBuiltScenes(changed);assert(report.errors.some(s=>s.includes('test-invalid-image')))});
