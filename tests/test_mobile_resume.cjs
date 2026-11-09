const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(){
 const handlers={document:{},window:{}},doc={hidden:false,addEventListener:(n,f)=>handlers.document[n]=f},win={addEventListener:(n,f)=>handlers.window[n]=f};let clock=1000,calls=0;
 const c=vm.createContext({document:doc,window:win,Date:{now:()=>clock}});vm.runInContext(fs.readFileSync('src/07j-mobile-reader.js','utf8')+'\nglobalThis.mobile=MobileReader',c);c.mobile.bind(()=>calls++);c.mobile.bind(()=>calls+=100);
 return {doc,handlers,setTime:v=>clock=v,calls:()=>calls};
}
test('resume cue appears only after a real30second interruption, once per return',()=>{
 const f=fixture();f.doc.hidden=true;f.handlers.document.visibilitychange();f.setTime(31000);f.handlers.window.pagehide();f.doc.hidden=false;f.handlers.document.visibilitychange();assert.equal(f.calls(),1);f.handlers.window.pageshow();assert.equal(f.calls(),1);
});
test('short interruptions and hidden pageshow never show a resume cue',()=>{
 const f=fixture();f.handlers.window.pagehide();f.setTime(3000);f.handlers.window.pageshow();assert.equal(f.calls(),0);f.doc.hidden=true;f.handlers.document.visibilitychange();f.setTime(50000);f.handlers.window.pageshow();assert.equal(f.calls(),0);f.doc.hidden=false;f.handlers.document.visibilitychange();assert.equal(f.calls(),1);
});
