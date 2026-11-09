'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('zoomed hidden evidence keeps its compact state and is measured again after unzoom',()=>{
 const source=fs.readFileSync('src/07-ui.js','utf8'),start=source.indexOf('  function fitSceneEvidence('),end=source.indexOf('  function syncStoryEvidence(',start);
 assert(start>=0&&end>start,'focused evidence-fit owner exists');
 const c=vm.createContext({});vm.runInContext(source.slice(start,end)+'\nglobalThis.fit=fitSceneEvidence;',c);
 const object={dataset:{evidenceCompact:'true'},getBoundingClientRect(){return {height:frame.zoomed?0:this.dataset.evidenceCompact==='true'?90:263};}};
 const frame={zoomed:true,clientHeight:180,classList:{contains:()=>frame.zoomed},querySelector:()=>object};
 c.fit(frame);assert.equal(object.dataset.evidenceCompact,'true','hidden object must not lose fitted mode');
 frame.zoomed=false;c.fit(frame);assert.equal(object.dataset.evidenceCompact,'true','narrow restored scene refits');
 frame.clientHeight=320;c.fit(frame);assert.equal(object.dataset.evidenceCompact,'false','larger scene restores the full paper');
});
