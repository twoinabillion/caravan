/* Exercise the shipped canvas graph through its public build/draw/click API. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/06-mapgraph.js','utf8');
const notes=[{id:'anchor',title:'달구지',type:'물건',links:[]}];
for(let i=0;i<70;i++)notes.push({id:'journey-'+i,title:'여정'+i,type:'사건',links:['달구지','없는 기록']});
const before=JSON.stringify(notes),seen={labels:[],points:[],strokes:0},handlers={};let opened=null,point=null;
const ctx={setTransform(){},clearRect(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},
 stroke(){seen.strokes++},arc(x,y,r){point={x,y,r}},fill(){seen.points.push(point)},
 measureText(text){return{width:text.length*7}},fillText(text){seen.labels.push(text)}};
const canvas={clientWidth:480,clientHeight:640,getContext:()=>ctx,addEventListener:(name,fn)=>handlers[name]=fn,getBoundingClientRect:()=>({left:0,top:0})};
const context=vm.createContext({console,Math,S:{notes},UI:{showGraphNote:note=>opened=note},window:{devicePixelRatio:1},ResizeObserver:class{observe(){}}});
vm.runInContext(source.slice(source.indexOf('const GRAPH ='))+'\nglobalThis.graph=GRAPH;',context);
context.graph.init(canvas);context.graph.build();context.graph.draw(.016);
assert(seen.labels.includes('달구지'),'a recent event keeps its older referenced hub in the graph');
assert(seen.strokes>0,'relationships must actually draw, not become unconnected dots');
assert(seen.labels.includes('여정69'),'newest journey remains represented');
assert(seen.labels.length<=46,'graph retains its bounded size');
assert(!seen.labels.includes('없는 기록'),'unknown references do not create invented notes');
const p=seen.points[seen.labels.indexOf('달구지')];handlers.click({clientX:p.x,clientY:p.y});
assert.strictEqual(opened,notes[0],'the older connected node opens its actual saved note');
assert.equal(JSON.stringify(notes),before,'graph selection does not mutate journal history');
console.log('Graph PASS: old linked hub, drawn edges, recent record, bounded size, actual click target, no mutation.');
