// Run the shipped optional-offline boot block, not a duplicate implementation.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ui=fs.readFileSync('src/07-ui.js','utf8');
const start=ui.indexOf("    if('serviceWorker' in navigator");
const end=ui.indexOf("    document.documentElement.classList.toggle('installed-app'",start);
assert(start>0&&end>start);
const source=ui.slice(start,end);
function fixture({missing=false,denied=false,worker=null,hostname='example.test',protocol='https:',search='',toss=false,screen='game'}={}){
 const calls=[],listeners=new Map(),stored=new Map();let accesses=0;
 const listen=owner=>(name,fn)=>listeners.set(owner+':'+name,fn);
 const registration={update:async()=>calls.push('update')};
 const sw=worker||{controller:{},register:async(...args)=>{calls.push(['register',...args]);return registration;},
  getRegistrations:async()=>[{unregister:async()=>calls.push('unregister')}],addEventListener:listen('worker')};
 const navigator={};
 if(!missing)Object.defineProperty(navigator,'serviceWorker',{get(){accesses++;if(denied)throw new Error('SecurityError: sandbox denied');return sw;}});
 const caches={keys:async()=>['seoul-400km-old','unrelated'],delete:async key=>calls.push(['delete',key])};
 const context=vm.createContext({navigator,window:{addEventListener:listen('window'),caches},document:{hidden:false,addEventListener:listen('document')},
  caches,location:{protocol,hostname,search,reload:()=>calls.push('reload')},URLSearchParams,tossRuntime:toss,screen,
  sessionStorage:{getItem:key=>stored.get(key),setItem:(key,value)=>stored.set(key,value)},toast:text=>calls.push(['toast',text]),
  appShellRegistration:null,bootContinued:false});
 vm.runInContext(source+'\nbootContinued=true;',context);
 return {calls,context,listeners,stored,accesses:()=>accesses,emit:async(owner,name)=>{
  await listeners.get(owner+':'+name)?.();await Promise.resolve();await Promise.resolve();
 }};
}
test('denied service-worker getter cannot reject load or interrupt the remaining boot',async()=>{
 const f=fixture({denied:true});assert.equal(f.context.bootContinued,true);
 await assert.doesNotReject(()=>f.emit('window','load'));assert.equal(f.accesses(),1);assert.deepEqual(f.calls,[]);
});
test('missing, file and Toss runtimes skip optional offline ownership entirely',async()=>{
 for(const options of [{missing:true},{protocol:'file:'},{toss:true}]){
  const f=fixture(options);assert.equal(f.context.bootContinued,true);
  assert.equal(f.listeners.has('window:load'),false);assert.equal(f.accesses(),0);assert.deepEqual(f.calls,[]);
 }
});
test('local preview retains unregister and removes only this game cache',async()=>{
 const f=fixture({hostname:'127.0.0.1'});await f.emit('window','load');
 assert(f.calls.includes('unregister'));assert.deepEqual(f.calls.filter(Array.isArray),[['delete','seoul-400km-old']]);
 assert.equal(f.context.appShellRegistration,null);assert.equal(f.accesses(),1);
});
test('local cleanup with synchronously denied API also remains optional',async()=>{
 const f=fixture({hostname:'localhost',worker:{getRegistrations(){throw Error('SecurityError');}}});
 await assert.doesNotReject(()=>f.emit('window','load'));assert.equal(f.context.bootContinued,true);
});
test('normal hosted and explicit local PWA register, update and retain return checks',async()=>{
 for(const options of [{},{hostname:'localhost',search:'?pwa=1'}]){
  const f=fixture(options);await f.emit('window','load');
  const call=f.calls.find(Array.isArray);assert.equal(call[0],'register');assert.equal(call[1],'./service-worker.js');assert.equal(call[2].updateViaCache,'none');
  assert.equal(f.accesses(),1);assert.equal(f.calls.filter(x=>x==='update').length,1);
  f.context.document.hidden=true;await f.emit('document','visibilitychange');assert.equal(f.calls.filter(x=>x==='update').length,1);
  f.context.document.hidden=false;await f.emit('document','visibilitychange');await f.emit('window','online');
  assert.equal(f.calls.filter(x=>x==='update').length,3);
  await f.emit('worker','controllerchange');assert(f.calls.some(x=>Array.isArray(x)&&x[0]==='toast'));assert(!f.calls.includes('reload'));
 }
});
test('first install does not reload; existing controller reloads title at most once',async()=>{
 const firstWorker={controller:null,register:async()=>({update:async()=>{}}),addEventListener(name,fn){this.changed=fn;}};
 const first=fixture({worker:firstWorker});
 await first.emit('window','load');firstWorker.changed();assert.equal(first.calls.includes('reload'),false);
 const f=fixture({screen:'title'});await f.emit('window','load');await f.emit('worker','controllerchange');await f.emit('worker','controllerchange');
 assert.equal(f.calls.filter(x=>x==='reload').length,1);assert.equal(f.stored.get('caravan_app_reloaded'),'1');
});
test('controller access, registration and update denials never reject load',async()=>{
 for(const worker of [
  {get controller(){throw Error('SecurityError');}},
  {controller:null,register:async()=>{throw Error('not supported');}},
  {controller:null,register:async()=>({update:async()=>{throw Error('offline');}})}
 ]){const f=fixture({worker});await assert.doesNotReject(()=>f.emit('window','load'));assert.equal(f.context.bootContinued,true);assert(!f.calls.includes('reload'));}
});
