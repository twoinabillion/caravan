// Real save loader + title owner, private storage/DOM only; no browser state.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const ui=fs.readFileSync('src/07-ui.js','utf8');
const titleSource=ui.slice(ui.indexOf('  function refreshTitle(){'),ui.indexOf('  function previousJourneyHtml('));
function fixture(){
 const store=new Map(),writes=[],calls=[],nodes=Object.fromEntries(['scr-title','bt-new','bt-continue','bt-title-restore','cont-info','last-journey','title-last-record'].map(id=>[id,{hidden:false,style:{},dataset:{titleLayout:'wharf'},textContent:'',classList:{toggle(){}}}]));
 const storage={failRead:false,getItem:k=>{if(storage.failRead)throw Error('read denied');return store.get(k)??null;},setItem:(k,v)=>{store.set(k,String(v));writes.push(k);},removeItem:k=>store.delete(k)};
 const context=vm.createContext({console,URLSearchParams,location:{search:''},setTimeout:()=>0,clearTimeout(){},localStorage:storage,
  UI:{},screen:'title',$:s=>nodes[s.slice(1)],previousJourneyHtml:()=>'',SND:{enable:()=>calls.push('sound')},
  enterGame:()=>calls.push('enter'),showEnding:kind=>calls.push('ending:'+kind),toast:t=>calls.push('toast:'+t)});
 for(const f of STATIC_CONTENT_FILES)vm.runInContext('"use strict";\n'+fs.readFileSync(f,'utf8'),context);
 for(const f of fs.readdirSync('src').filter(f=>/^04.*\.js$/.test(f)).sort())vm.runInContext('"use strict";\n'+fs.readFileSync('src/'+f,'utf8'),context);
 const run=code=>vm.runInContext(code,context);
 vm.runInContext(titleSource,context);
 run("G.newGame('onroad','현재 여정','skip','keeper','fuel');G.save();S.min+=7;G.delayBanter(55);globalThis.previous=S;globalThis.previousRng=rng");
 writes.length=0;const raw=run('G.exportSave()');
 return {run,context,store,storage,writes,calls,nodes,raw};
}
function liveIntact(f){assert.equal(f.run('S===previous'),true);assert.equal(f.run('rng===previousRng'),true);assert.equal(f.run('G.exportSave()'),f.raw);assert.equal(f.run('G.banterCooldown()'),55);}
test('failed ordinary loads retain an existing live journey, RNG and cooldown',()=>{
 for(const raw of ['{',JSON.stringify({at:'missing-node',day:1}),JSON.stringify({at:'busan',day:1,comps:{minji:3}})]){
  const f=fixture(),stored=[...f.store];f.context.raw=raw;assert.equal(f.run('G.load(raw)'),false);liveIntact(f);assert.deepEqual([...f.store],stored);assert.equal(f.writes.length,0);
 }
});
test('malformed version metadata is not silently migrated as an unversioned save',()=>{
 for(const v of [0,-1,1.5,9.5,'9','999',null,{},[]]){
  const f=fixture();f.context.raw=JSON.stringify({...JSON.parse(f.raw),v});
  assert.equal(f.run('G.inspectSave(raw).ok'),false,JSON.stringify(v));liveIntact(f);
  assert.equal(f.run('G.importSave(raw).ok'),false,JSON.stringify(v));liveIntact(f);assert.equal(f.writes.length,0);
 }
});
test('title refuses invalid locations and newer versions while keeping restore reachable',()=>{
 for(const change of [{at:'missing-node'},{v:999},{comps:{minji:3}}]){
  const f=fixture(),invalid=JSON.stringify({...JSON.parse(f.raw),...change});f.store.set('seoul400_save_v1',invalid);
  f.context.refreshTitle();assert.equal(f.nodes['bt-continue'].style.display,'none');assert.equal(f.nodes['bt-title-restore'].hidden,false);liveIntact(f);assert.equal(f.writes.length,0);
 }
});
test('valid unversioned partial saves receive a usable Continue summary without mutation',()=>{
 const f=fixture(),legacy=JSON.parse(f.raw);delete legacy.v;delete legacy.stats;f.store.set('seoul400_save_v1',JSON.stringify(legacy));
 f.context.refreshTitle();assert.equal(f.nodes['bt-continue'].style.display,'flex');assert.equal(f.nodes['bt-title-restore'].hidden,true);assert.equal(f.nodes['cont-info'].textContent,'DAY 1 · 0km 주행 · 온로드');liveIntact(f);assert.equal(f.writes.length,0);
});
test('all supported numeric versions and unversioned v1 still inspect and load',()=>{
 for(const v of [undefined,1,2,3,4,5,6,7,8,9]){
  const f=fixture(),data={...JSON.parse(f.raw),v};f.context.raw=JSON.stringify(data);
  assert.equal(f.run('G.inspectSave(raw).ok'),true,String(v));liveIntact(f);assert.equal(f.run('G.importSave(raw).ok'),true,String(v));assert.equal(f.run('G.load()'),true);assert.equal(f.run('S.v'),9);assert.equal(f.run("G.canTravelTo('yangsan').ok"),true);
 }
});
test('Continue rechecks storage changed after title render and leaves a readable recovery path',()=>{
 const f=fixture();f.context.refreshTitle();assert.equal(f.nodes['bt-continue'].style.display,'flex');
 f.store.set('seoul400_save_v1',JSON.stringify({...JSON.parse(f.raw),v:999}));const stored=[...f.store];
 assert.equal(f.context.continueSavedJourney(),false);liveIntact(f);assert.deepEqual([...f.store],stored);assert.equal(f.nodes['bt-title-restore'].hidden,false);assert.equal(f.nodes['bt-continue'].style.display,'none');assert(!f.calls.includes('sound'));assert(!f.calls.includes('enter'));assert(f.calls.some(c=>c.startsWith('toast:저장된 여정을 불러오지 못했습니다')));
});
test('read-denied and absent storage cannot erase unsaved memory or enter play',()=>{
 for(const mode of ['denied','empty']){const f=fixture();if(mode==='denied')f.storage.failRead=true;else f.store.clear();assert.equal(f.context.continueSavedJourney(),false);liveIntact(f);assert.equal(f.writes.length,0);assert(!f.calls.includes('enter'));}
});
test('a stale title Continue cannot replace a journey after leaving the title',()=>{
 const f=fixture();f.context.screen='name';const stored=[...f.store];assert.equal(f.context.continueSavedJourney(),false);liveIntact(f);assert.deepEqual([...f.store],stored);assert.deepEqual(f.calls,[]);
});
test('ended saves open the ending and automatic live resume never enables sound',()=>{
 const f=fixture();f.store.set('seoul400_save_v1',JSON.stringify({...JSON.parse(f.raw),ended:true,endKind:'stranded'}));
 assert.equal(f.context.continueSavedJourney(false),true);assert(f.calls.includes('ending:stranded'));assert(!f.calls.includes('enter'));assert(!f.calls.includes('sound'));
});
test('valid Continue loads exactly the saved receipt; summaries use repaired finite mileage',()=>{
 const f=fixture();f.run("G.newGame('onroad','읽던 장면','interactive','keeper','repair');G.resolveOpeningChoice('opening_workshop','answer_call')");
 const data=JSON.parse(f.run('G.exportSave()'));data.stats.km='corrupt';const receipt=JSON.stringify(data.opening.pendingResult);f.store.set('seoul400_save_v1',JSON.stringify(data));
 f.context.refreshTitle();assert.match(f.nodes['cont-info'].textContent,/0km 주행/);assert.equal(f.context.continueSavedJourney(),true);assert(f.calls.includes('sound'));assert(f.calls.includes('enter'));assert.equal(f.run('JSON.stringify(S.opening.pendingResult)'),receipt);assert.equal(f.run("G.resolveOpeningChoice('opening_workshop','answer_call').applied"),false);assert.equal(f.run('S.min'),data.min);
});
test('invalid load with no live journey still leaves a clean empty title',()=>{
 const f=fixture();f.run('S=null');f.context.raw='{';assert.equal(f.run('G.load(raw)'),false);assert.equal(f.run('S'),null);assert.equal(f.writes.length,0);
});
