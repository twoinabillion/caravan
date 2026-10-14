const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
test('live startup watches budget configuration and changes schedule a build',()=>{
 const source=fs.readFileSync('tools/dev-live.mjs','utf8');
 const startup=source.slice(source.indexOf('server.listen(PORT,HOST,()=>{'));
 assert.match(startup,/watchFile\('tools\/build-budget\.json'\)/);
 const code=source.slice(source.indexOf('function watchFile('),source.indexOf('function gameShell('));
 const queued=[],watched=[];
 let changed;
 const context={ROOT:'/project',path:require('node:path'),watchers:[],
  fs:{existsSync:()=>true,watch:(file,callback)=>{watched.push(file);changed=callback;return {on(){}};}},
  scheduleBuild:(...args)=>queued.push(args)};
 vm.runInNewContext(code+";watchFile('tools/build-budget.json');",context);
 assert.deepEqual(watched,['/project/tools']);
 changed('change','unrelated.json');assert.equal(queued.length,0);
 changed('rename','build-budget.json');
 changed('change',Buffer.from('build-budget.json'));
 assert.deepEqual(queued,[['tools/build-budget.json',300],['tools/build-budget.json',300]]);
 changed('change',null);assert.equal(queued.length,3);
});
test('all local builder imports have live watchers',()=>{
 const builder=fs.readFileSync('tools/build-html.mjs','utf8');
 const live=fs.readFileSync('tools/dev-live.mjs','utf8');
 const startup=live.slice(live.indexOf('server.listen(PORT,HOST,()=>{'));
 for(const match of builder.matchAll(/from ['"]\.\/([^'"]+)['"]/g))
  assert(startup.includes("'"+match[1]+"'"),match[1]+' must trigger rebuild');
});
