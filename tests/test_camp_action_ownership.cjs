// The legacy text normalizer must not take ownership of camp navigation.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/07-ui.js','utf8');
const start=source.indexOf('  const duplicate=/^(?:실행');
const end=source.indexOf('\n})();',start);
const make=(text,inCamp)=>({textContent:text,children:[],dataset:{},classes:new Set(),closest:s=>s.split(',').includes('#ovl-camp')&&inCamp?{}:null,querySelectorAll:()=>[],get classList(){return {add:c=>this.classes.add(c)}}});
const nav=make('야영 준비',true),road=make('차 안에서 야영 준비 다음 06:30 준비',false);
vm.runInNewContext(source.slice(start,end),{document:{readyState:'complete',body:{},querySelectorAll:()=>[nav,road],querySelector:()=>null},MutationObserver:class{observe(){}}});
assert(!nav.classes.has('ui-whole-action-card'),'camp navigation must retain its own 48px control style');
assert(road.classes.has('ui-whole-action-card'),'road action cards keep the legacy treatment');
console.log('PASS camp navigation ownership and existing road action treatment');
