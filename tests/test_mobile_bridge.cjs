const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
async function fixture(){
 const listeners={},callbacks={},calls=[],vars={};
 const sdk={SafeAreaInsets:{get:()=>({top:44,bottom:34}),subscribe:()=>{calls.push('insets-bind');return()=>calls.push('insets-unbind');}},graniteEvent:{addEventListener:(name,options)=>{callbacks[name]=options.onEvent;calls.push(name+'-bind');return()=>calls.push(name+'-unbind');}},closeView:()=>calls.push('exit')};
 const c=vm.createContext({sdk,UI:{appBack:()=>{calls.push('back');return c.handled;}},handled:true,window:{ReactNativeWebView:{},addEventListener:(name,fn)=>listeners[name]=fn},location:{hostname:'example.com'},navigator:{userAgent:'test'},document:{documentElement:{classList:{toggle:()=>{}},style:{setProperty:(k,v)=>vars[k]=v}}}});
 const src=fs.readFileSync(process.env.CARAVAN_CLOSE_SOURCE||'src/09-close.html','utf8').replace(/^<\/script>\s*<script type="module">/,'').replace(/<\/script>\s*$/,'').replace("import('@apps-in-toss/web-framework')",'Promise.resolve(sdk)');
 vm.runInContext(src,c);await Promise.resolve();return {c,listeners,callbacks,calls,vars};
}
test('Toss back bridge uses UI ordering and exits only when UI has nothing to close',async()=>{
 const f=await fixture();assert.equal(typeof f.callbacks.backEvent,'function');f.callbacks.backEvent();assert.deepEqual(f.calls.slice(-1),['back']);f.c.handled=false;f.callbacks.backEvent();assert.deepEqual(f.calls.slice(-2),['back','exit']);assert.equal(f.vars['--safe-bottom'],'34px');
});
test('pagehide tears down and pageshow binds exactly once again',async()=>{
 const f=await fixture();assert.equal(typeof f.callbacks.backEvent,'function');f.listeners.pagehide();f.listeners.pageshow();f.listeners.pageshow();assert.equal(f.calls.filter(x=>x==='backEvent-bind').length,2);assert.equal(f.calls.filter(x=>x==='backEvent-unbind').length,1);assert.equal(f.calls.filter(x=>x==='insets-bind').length,2);
});
