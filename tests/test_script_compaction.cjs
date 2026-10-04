const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function normalize(v){
 if(!v||typeof v!=='object')return v;
 if(v.type==='ParenthesizedExpression')return normalize(v.expression);
 if(v.type==='TemplateLiteral'&&v.expressions.length===0)return {type:'Literal',value:v.quasis[0].value.cooked};
 if(Array.isArray(v))return v.map(normalize);
 return Object.fromEntries(Object.entries(v).filter(([k])=>!['start','end','raw','loc','range','parenthesized'].includes(k)).map(([k,x])=>[k,normalize(x)]));
}
function difference(a,b,path='root'){
 if(typeof a!==typeof b||a===null||b===null||typeof a!=='object')return a===b?null:path;
 if(Object.keys(a).join()!==Object.keys(b).join())return path+' keys';
 for(const k of Object.keys(a)){const d=difference(a[k],b[k],path+'.'+k);if(d)return d;}return null;
}
test('delivery compaction preserves the complete UI syntax tree, names and string values',async()=>{
 const {parseSync}=await import('vite'),{compactScriptSource}=await import('../tools/compact-script-source.mjs');
 const source=fs.readFileSync('src/07-ui.js','utf8'),built=compactScriptSource(source,'ui.js');
 const tree=code=>normalize(parseSync('ui.js',code,{sourceType:'script'}).program);
 assert.equal(difference(tree(source),tree(built)),null);
 assert(Buffer.byteLength(source)-Buffer.byteLength(built)>40000);
 new vm.Script(built);assert.doesNotMatch(built,/<\/script/i);
});
test('parser-based formatting retains ASI, regular expressions and literal whitespace',async()=>{
 const {compactScriptSource}=await import('../tools/compact-script-source.mjs');
 const source='function read(){return\n {x:1}};const result=[read(), /https?:\\/\\//.test("https://a"), ` a\\nb `, 8 / 2 / 2];';
 const run=code=>JSON.stringify(vm.runInNewContext(code+';result'));
 assert.equal(run(compactScriptSource(source,'fixture.js')),run(source));
});
