/* Real engine, isolated storage. Never imports into the user's live save. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
function setup(){
 const store=new Map(),writes=[];
 const storage={getItem:k=>store.get(k)||null,removeItem:k=>store.delete(k),
  setItem(k,v){if(this.fail)throw Error('quota');writes.push([k,String(v)]);store.set(k,String(v));}};
 const ctx=vm.createContext({console,URLSearchParams,location:{search:''},setTimeout:()=>0,clearTimeout(){},UI:{},localStorage:storage});
 for(const f of STATIC_CONTENT_FILES)vm.runInContext('"use strict";\n'+fs.readFileSync(f,'utf8'),ctx);
 for(const f of fs.readdirSync('src').filter(f=>/^04.*\.js$/.test(f)).sort())vm.runInContext('"use strict";\n'+fs.readFileSync('src/'+f,'utf8'),ctx);
 const run=code=>vm.runInContext(code,ctx);
 run("G.newGame('onroad','보존할 여정','full');G.save();S.min+=7;G.delayBanter(55);globalThis.before=S;globalThis.beforeRng=rng;");
 const before=run('JSON.stringify(S)'),saved=new Map(store);writes.length=0;
 return {run,ctx,store,storage,writes,before,saved};
}
function unchanged(h){
 assert.equal(h.run('S===before'),true,'retain live object references');
 assert.equal(h.run('JSON.stringify(S)'),h.before,'retain unsaved current progress');
 assert.equal(h.run('rng===beforeRng'),true,'retain RNG stream');
 assert.equal(h.run('G.banterCooldown()'),55,'retain pending audio timing');
 assert.deepEqual(h.store,h.saved,'retain stored bytes');
}
for(const raw of ['{','[]','{"at":"missing-node","day":1}',
 '{"at":"busan","day":1,"comps":{"minji":3}}']){
 test('rejected import is non-mutating: '+raw,()=>{
  const h=setup();h.ctx.raw=raw;
  assert.equal(h.run('G.importSave(raw).ok'),false);unchanged(h);
  assert.equal(h.writes.length,0,'invalid input never enters persistent storage');
 });
}
test('storage rejection returns a failure without rollback writes or loss of live state',()=>{
 const h=setup();h.ctx.raw=h.run('G.exportSave()');h.storage.fail=true;
 assert.equal(h.run('G.importSave(raw).ok'),false);unchanged(h);assert.equal(h.writes.length,0);
});
test('future-version import is rejected rather than rewritten by an older engine',()=>{
 const h=setup();h.ctx.raw=h.run('JSON.stringify({...S,v:SAVE_VERSION+1})');
 assert.equal(h.run('G.importSave(raw).ok'),false);unchanged(h);assert.equal(h.writes.length,0);
});
test('valid legacy import commits migrated data once and remains loadable',()=>{
 const h=setup();h.ctx.raw=h.run("JSON.stringify({...S,v:1,name:'복원한 여정',min:620})");
 assert.equal(h.run('G.importSave(raw).ok'),true);assert.equal(h.writes.length,1);
 assert.equal(h.run('S.v===SAVE_VERSION'),true);assert.equal(h.run('S.min'),620);
 assert.equal(h.run('G.banterCooldown()'),6);
 assert.equal(h.run('G.load()'),true);assert.equal(h.run('S.name'),'복원한 여정');
 assert.equal(h.run('S.min'),620);assert.equal(h.run("G.canTravelTo('yangsan').ok"),true);
});
test('valid import preserves a paid receipt and cannot charge its choice again after reload',()=>{
 const h=setup();
 h.run("globalThis.e=D.events.find(e=>e.id==='whites_pass');G.beginPresentation(e);globalThis.paid=G.resolvePresentedChoice(e,e.choices[0]);");
 assert.equal(h.run('paid.ok'),true);
 h.ctx.raw=h.run('G.exportSave()');const receipt=h.run('JSON.stringify(S.pendingPresentation)');
 const supplies=h.run('JSON.stringify([S.water,S.food,S.scrap,S.min])');
 assert.equal(h.run('G.importSave(raw).ok'),true);assert.equal(h.run('G.load()'),true);
 assert.equal(h.run('JSON.stringify(S.pendingPresentation)'),receipt);
 assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[0]).applied'),false);
 assert.equal(h.run('JSON.stringify([S.water,S.food,S.scrap,S.min])'),supplies);
});
test('invalid import with no existing save leaves the title state and storage empty',()=>{
 const h=setup();h.store.clear();h.run('S=null;globalThis.beforeRng=rng');
 assert.equal(h.run("G.importSave('{').ok"),false);
 assert.equal(h.run('S'),null);assert.equal(h.run('rng===beforeRng'),true);assert.equal(h.store.size,0);
});
