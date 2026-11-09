const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(room=300){
 const object={dataset:{},style:{},hidden:false,getBoundingClientRect:()=>({height:object.dataset.evidenceCompact==='true'?64:250})},source={hidden:true};
 const sheet={querySelector:selector=>selector==='.event-field-report'?{getBoundingClientRect:()=>({top:room})}:{getBoundingClientRect:()=>({bottom:64})}};
 const frame={clientHeight:844,classList:{contains:()=>false},closest:()=>sheet,getBoundingClientRect:()=>({top:0,bottom:844}),querySelector:s=>s==='[data-evidence-object]'?object:source};
 const c=vm.createContext({window:{matchMedia:()=>({matches:true})}}),src=fs.readFileSync('src/07-ui.js','utf8'),a=src.indexOf('  function fitSceneEvidence('),z=src.indexOf('\n  function ',a+4);vm.runInContext(src.slice(a,z),c);
 return {object,source,fit:()=>c.fitSceneEvidence(frame)};
}
test('physical evidence fits above the mobile dialogue rather than the covered full scene',()=>{const f=fixture();f.fit();assert.equal(f.object.dataset.evidenceCompact,'true');assert.equal(f.object.style.top,'180px');assert.equal(f.object.hidden,false);});
test('tiny uncovered scene keeps evidence reachable through its explicit source button',()=>{const f=fixture(110);f.fit();assert.equal(f.object.hidden,true);assert.equal(f.source.hidden,false);});
