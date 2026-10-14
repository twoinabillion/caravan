const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
test('reunion alone does not promise the later broadcast support in departure records',()=>{
 const store=new Map();
 const ctx=vm.createContext({console,Date,URLSearchParams,location:{search:''},setTimeout:()=>0,clearTimeout(){},UI:{},
  localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value),removeItem:key=>store.delete(key)}});
 for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 for(const file of fs.readdirSync('src').filter(f=>/^04.*\.js$/.test(f)).sort())vm.runInContext(fs.readFileSync('src/'+file,'utf8'),ctx);
 const run=code=>vm.runInContext(code,ctx);
 run("G.newGame('onroad','다온','full','keeper');S.flags.mother_reunited=true");
 let row=run("G.departureSteps().find(row=>row.id==='mother')");
 assert.equal(row.done,false);assert.match(row.detail,/재회했다/);assert.doesNotMatch(row.detail,/약속받았다/);
 run('G.save();S=null;G.load()');
 row=run("G.departureSteps().find(row=>row.id==='mother')");
 assert.equal(row.done,false);assert.doesNotMatch(row.detail,/약속받았다/);
 run('S.flags.mother_broadcast_ready=true');
 row=run("G.departureSteps().find(row=>row.id==='mother')");
 assert.equal(row.done,true);assert.match(row.detail,/송출 지원을 약속받았다/);
});
