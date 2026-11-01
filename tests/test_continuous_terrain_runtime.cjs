const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const sourceFile=path.resolve(__dirname,'../src/05f-continuous-terrain.js');
const registry={enabled:true,viewport:1024,height:576,width:2048,overlap:512,nodes:{a:{source:'a'},b:{source:'b'},c:{source:'c'}},corridors:{fields:{source:'fields'}},routes:[{id:'a--b',from:'a',to:'b',km:20,kind:'fields'},{id:'a--c',from:'a',to:'c',km:30,kind:'fields'}]};
function runtime({stalledWorker=false}={}){
 assert(fs.existsSync(sourceFile),'continuous terrain runtime is not implemented');
 const pending=new Map(),calls=[];
 function canvas(){const c={width:0,height:0};let seed=60;const ctx={drawImage:(image,...args)=>{seed=image.seed||seed;calls.push({canvas:c,image,args});},getImageData:()=>{const data=new Uint8ClampedArray(c.width*c.height*4);for(let i=0;i<data.length;i+=4){data[i]=seed;data[i+1]=70;data[i+2]=80;data[i+3]=255;}return {data};},putImageData:()=>{},clearRect:()=>{},setTransform:()=>{},save:()=>{},restore:()=>{},fillRect:()=>{}};c.getContext=()=>ctx;return c;}
 const context={document:{createElement:canvas},Image:class{constructor(){this.naturalWidth=2048;this.naturalHeight=576;this.seed=50;}set src(id){this.seed=id==='b'?90:id==='fields'?70:50;pending.set(id,this);}},Uint8ClampedArray,Int32Array,Map,Set,Promise,Math,Number,setTimeout,clearTimeout,localStorage:new Proxy({},{get(){throw Error('terrain accessed save storage');}})};
 const timeouts=[],workers=[];
 if(stalledWorker)Object.assign(context,{Blob,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},Worker:class{constructor(){this.posts=0;this.terminated=false;workers.push(this);}postMessage(){this.posts++;}terminate(){this.terminated=true;}},setTimeout:(fn,ms)=>ms===8000?(timeouts.push(fn),-timeouts.length):setTimeout(fn,ms),clearTimeout:id=>{if(id>=0)clearTimeout(id);}});
 const {joinTilePixels}=require('../tools/continuous-route-join.cjs');
 const text=fs.readFileSync(sourceFile,'utf8').replace('/*__CONTINUOUS_TERRAIN__*/{enabled:false,nodes:{},corridors:{},routes:[]}',JSON.stringify(registry)).replace('/*__CONTINUOUS_JOIN__*/null','('+joinTilePixels.toString()+')');
 const r=vm.runInNewContext(text+';CONTINUOUS_TERRAIN',context);
 return {r,pending,calls,canvas,timeouts,workers,load:id=>pending.get(id).onload(),fail:id=>pending.get(id).onerror()};
}
test('distance and reverse use the same spatial pixels without save mutation',()=>{
 const {r}=runtime();for(const W of [320,360,480])for(let i=0;i<=100;i++){
  const leg={from:'a',to:'b',dist:20,gone:20*i/100},v={driving:leg},before=JSON.stringify(v);
  const f=r.position(v,W),back=r.position({driving:{from:'b',to:'a',dist:20,gone:20*(1-i/100)}},W);
  assert(Math.abs(f.sourceX-back.sourceX)<1e-8);assert(Math.abs(f.sourceX-(512+3072*i/100))<1e-8);assert.equal(f.camera,f.sourceX/1024*W);assert.equal(JSON.stringify(v),before);
 }
 assert.equal(r.position({driving:{from:'a',to:'b',dist:0,gone:0}},360),null);
});
test('arrival, stop and next departure retain one city sample independent of route history',()=>{
 const {r}=runtime();const stop=r.citySample({at:'a'});
 for(const v of [{driving:{from:'a',to:'b',dist:20,gone:0}},{driving:{from:'b',to:'a',dist:20,gone:20}},{driving:{from:'c',to:'a',dist:30,gone:30}},{driving:{from:'a',to:'c',dist:30,gone:0}}])assert.deepEqual(r.citySample(v),stop);
 assert.equal(r.citySample({driving:{from:'a',to:'b',dist:20,gone:10}}),null);
 assert.equal(r.direction({driving:{from:'b',to:'a'}}),-1);assert.equal(r.direction({at:'a',lastJourneyRecap:{from:'b',to:'a'}}),-1);
});
test('decoding is awaited and a pending/failed road never paints a previous road',async()=>{
 const rt=runtime(),r=rt.r,target=rt.canvas().getContext('2d'),v={from:'a',to:'b'};
 const preparing=r.prepare(v);assert.equal(r.ready(v),false);
 for(const id of ['a','b','fields'])rt.load(id);
 assert.equal(await preparing,true);assert.equal(r.ready(v),true);
 const frame={W:360,H:272,scale:2,at:null,driving:{from:'a',to:'b',dist:20,gone:10},hour:12,dark:0,wx:'clear'};
 assert.equal(r.draw(target,frame),true);
 const other={from:'a',to:'c'},waiting=r.prepare(other);const count=rt.calls.length;
 assert.equal(r.draw(target,{...frame,driving:{from:'a',to:'c',dist:30,gone:15}}),false);
 assert.equal(rt.calls.length,count,'no unrelated cached road paint');rt.fail('c');
 assert.equal(await waiting,false);assert.equal(r.ready(other),false);assert.equal(r.ready(v),true);
});
test('stopped preload shares the same decoded city used by adjoining roads',async()=>{
 const rt=runtime(),p=rt.r.prepare({at:'a'});assert.equal(rt.r.ready({at:'a'}),false);rt.load('a');assert.equal(await p,true);assert.equal(rt.r.ready({at:'a'}),true);
 const again=rt.r.prepare({at:'a'});assert.equal(await again,true);assert.equal(rt.pending.size,1);
});
test('a stalled worker is retired once, and subsequent routes compose without another timeout',async()=>{
 const rt=runtime({stalledWorker:true}),p=rt.r.prepare({from:'a',to:'b'});
 for(const id of ['a','b','fields'])rt.load(id);
 await new Promise(r=>setImmediate(r));assert.equal(rt.workers.length,1);assert.equal(rt.timeouts.length,1);
 rt.timeouts[0]();assert.equal(await p,true);assert.equal(rt.workers[0].terminated,true);
 const next=rt.r.prepare({from:'a',to:'c'});rt.load('c');assert.equal(await next,true);
 assert.equal(rt.workers.length,1);assert.equal(rt.timeouts.length,1);assert.equal(rt.workers[0].posts,1);
});
test('an exact arrival and stop share the identical city canvas and source crop',async()=>{
 const rt=runtime(),p=rt.r.prepare({from:'a',to:'b'});for(const id of ['a','b','fields'])rt.load(id);assert.equal(await p,true);
 const target=rt.canvas().getContext('2d'),base={W:360,H:272,scale:2,hour:12,dark:0,wx:'clear'};
 const capture=view=>{rt.calls.length=0;assert.equal(rt.r.draw(target,{...base,...view}),true);return rt.calls.find(c=>c.canvas.width===720&&c.image.width>=2048);};
 const arrival=capture({driving:{from:'a',to:'b',dist:20,gone:20}}),stopped=capture({at:'b'});
 assert.equal(arrival.image,stopped.image);assert.deepEqual(arrival.args,stopped.args);
 const interior=capture({driving:{from:'a',to:'b',dist:20,gone:10}});assert.equal(interior.image.width,5120);
});
