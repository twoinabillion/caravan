const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/07-ui.js','utf8');
function fixture(){
 const calls=[],state={readerMode:'current'},doc={querySelector:()=>null,querySelectorAll:()=>[]};
 const c=vm.createContext({document:doc,Event:class{constructor(type){this.type=type;this.defaultPrevented=false;}preventDefault(){this.defaultPrevented=true;}},screen:'game',curStory:state,curEv:{},activeModal:()=>({id:'ev-wrap'}),setStoryReaderMode:(_,mode)=>{calls.push(mode);state.readerMode=mode;},closeOvl:s=>calls.push(s),MobileReader:{openTools:()=>calls.push('tools')},$:()=>({click:()=>calls.push('menu')})});
 const a=source.indexOf('  function appBack('),z=source.indexOf('\n  function ',a+4);assert(a>=0,'app back handler missing');vm.runInContext(source.slice(a,z),c);
 return {c,calls,state,doc,back:()=>c.appBack()};
}
test('app back closes native art first, never leaves or pays the underlying story',()=>{
 const f=fixture(),d={open:true,dispatchEvent:e=>{f.calls.push(e.type);return true;},close:()=>{d.open=false;f.calls.push('close');}};f.doc.querySelectorAll=()=>[d];assert.equal(f.back(),true);assert.deepEqual(f.calls,['cancel','close']);assert.equal(f.state.readerMode,'current');
});
test('app back returns from documents to the same story then opens free tools',()=>{
 const f=fixture();f.state.readerMode='inspection';assert.equal(f.back(),true);assert.deepEqual(f.calls,['current']);f.back();assert.deepEqual(f.calls,['current','tools']);
});
test('app back leaves an arrival or ending decision for its explicit control',()=>{
 const f=fixture();f.c.activeModal=()=>({id:'arrival-scene'});f.back();assert.deepEqual(f.calls,[]);f.c.activeModal=()=>({id:'ovl-seoul'});f.back();assert.deepEqual(f.calls,[]);
});
test('app back closes ordinary overlays and returns false at title',()=>{
 const f=fixture();f.c.activeModal=()=>({id:'ovl-map'});f.back();assert.deepEqual(f.calls,['#ovl-map']);f.c.activeModal=()=>null;f.c.screen='title';assert.equal(f.back(),false);
});
test('app back finishes the paid upgrade layer before closing its settlement',()=>{
 const f=fixture();f.c.activeModal=()=>({id:'ovl-stl'});
 const done={isConnected:true,click:()=>{f.calls.push('finish-install');done.isConnected=false;}};
 f.doc.querySelector=selector=>selector.includes('#upgrade-install-done')?done:null;
 assert.equal(f.back(),true);assert.deepEqual(f.calls,['finish-install']);
 assert.equal(f.back(),true);assert.deepEqual(f.calls,['finish-install','#ovl-stl']);
});
