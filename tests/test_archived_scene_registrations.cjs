const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const archive=require('../tools/archived-scene-registrations.json');
function load(restore){
 const context=vm.createContext({console});
 for(const file of STATIC_CONTENT_FILES){
  let text=fs.readFileSync(file,'utf8');
  if(restore&&file==='src/03g-scenes.js')text=text.replace('D.scenes = {','D.scenes = {'+archive.entries.map(e=>JSON.stringify(e.key)+':'+JSON.stringify(e.placeholder)+',').join(''));
  vm.runInContext(text,context);
 }
 return JSON.parse(vm.runInContext('JSON.stringify({scenes:D.scenes,meta:D.sceneAssetMeta,descriptions:D.sceneDescriptions})',context));
}
test('archiving overwritten payloads preserves all final scene keys, assets and metadata',()=>{
 assert.deepEqual(load(false),load(true));
 for(const row of archive.entries){
  assert.ok(fs.existsSync(row.asset),'original art remains recoverable');
  assert.ok(!fs.readFileSync('src/03g-scenes.js','utf8').includes(row.placeholder));
 }
});
