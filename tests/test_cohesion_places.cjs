/* Source-level behavior harness; no generated HTML or raster dependency. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,'src',file),'utf8');
let checks=0,failures=0;const test=(name,fn)=>{try{fn();checks++;console.log('PASS '+name);}catch(error){failures++;console.error('FAIL '+name+': '+error.message);}};
// Canvas is the platform boundary; geometry, movement and callback code stay real.
function canvas(){
  const calls=[];let depth=0;
  const c=new Proxy({calls,save(){depth++;},restore(){depth--;assert(depth>=0);},measureText:s=>({width:s.length*4}),createRadialGradient:()=>({addColorStop(){}})},
    {get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args])});
  return {style:{},isConnected:true,clientWidth:236,clientHeight:306,getContext:()=>c,getBoundingClientRect:()=>({left:0,top:0,width:236,height:306}),c};
}
let lastBuffer;
const ctx=vm.createContext({console,Image:class{constructor(){this.complete=false;}},document:{createElement:()=>lastBuffer=canvas()},window:{devicePixelRatio:1},setTimeout:fn=>fn()});
vm.runInContext(read('03-data.js')+'\nglobalThis.data=D;',ctx);
vm.runInContext(read('05-scene.js')+'\nglobalThis.scene=SCENE;',ctx);
const D=ctx.data,scene=ctx.scene,cities=['miryang','gwangju','daegu','muju','jeonju','daejeon','suwon'];
const coords={};
function init(id,extra={}){const cv=canvas();scene.initSettlement(cv,{id,layout:D.settlementLayouts[id],spots:D.settlementLayouts[id].facilities,...extra});return cv;}
function settle(){for(let i=0;i<200&&scene.settlementState().moving;i++)scene.drawSettlement(.05);}
test('seven settlements have different spatial arrangements, not the old four corner booths',()=>{
  for(const id of cities){init(id);coords[id]=scene.settlementState().facilities;}
  const spread=id=>{const pts=coords[id].map(f=>f.p);return Math.max(...pts.map(p=>p.y))-Math.min(...pts.map(p=>p.y));};
  assert(spread('muju')>120,'tunnel facilities must run along its long passage');
  const people=coords.gwangju.find(f=>f.id==='people').p;
  assert(people.x>90&&people.x<140&&people.y<220,'communal hearth belongs in the square');
  assert(coords.suwon.find(f=>f.id==='people').p.y<coords.suwon.find(f=>f.id==='market').p.y,'wall watch and market are on different sides of the gate');
  assert(new Set(cities.map(id=>JSON.stringify(coords[id]))).size===7);
});
test('all 28 visible facilities are selectable and deliver a single arrival at a valid doorstep',()=>{
  for(const id of cities){
    const arrivals=[],walks=[];const cv=init(id,{onArrive:id=>arrivals.push(id),onWalk:id=>walks.push(id)});settle();arrivals.length=0;
    for(const facility of scene.settlementState().facilities){
      cv.onpointerup({currentTarget:cv,clientX:facility.p.x,clientY:facility.p.y});
      assert.equal(scene.settlementState().focus,facility.id,id+' visual hit');
      const target=scene.settlementState().target;
      assert(target.x>14&&target.x<222&&target.y>82&&target.y<294,id+' valid target');
      assert(target.y>facility.p.y+18,id+' arrival below building');
      settle();assert.equal(scene.settlementState().moving,false);assert.equal(arrivals.at(-1),facility.id);
      const n=arrivals.length;scene.drawSettlement(.1);assert.equal(arrivals.length,n,'no duplicate arrival');
      assert.equal(scene.settlementState().player.x,target.x);assert.equal(scene.settlementState().player.y,target.y);
    }
    assert.equal(arrivals.length,4);assert.equal(walks.length,4);
    assert.equal(scene.walkSettlement('missing'),false);
    scene.closeSettlement();assert.equal(scene.settlementState(),null);
    assert.equal(cv.onpointerup,null,'closed scene releases owned handlers');
  }
});
test('drawn facility labels follow the same coordinates as hit targets',()=>{
  for(const id of cities){const cv=init(id);
    const labels=lastBuffer.c.calls.filter(c=>c[0]==='fillText');
    for(const f of scene.settlementState().facilities){
      const drawn=labels.find(c=>c[1]===f.label&&Math.abs(c[2]-f.p.x)<1);
      assert(drawn,id+' '+f.id+' label follows building');
      cv.onpointerup({currentTarget:cv,clientX:drawn[2],clientY:drawn[3]});
      assert.equal(scene.settlementState().focus,f.id,'visible label also selects its facility');
    }
  }
});
test('actual residents, recruits and companions remain reachable at their drawn positions',()=>{
  for(const id of cities){
    const spoken=[],stl=D.stls[id],recruit=stl.recruit?{id:stl.recruit,name:D.comps[stl.recruit].name}:null;
    const cv=init(id,{npcs:stl.npcs.map(id=>({id,...D.npcs[id]})),recruit,
      onNpc:id=>spoken.push('npc:'+id),onRecruit:id=>spoken.push('recruit:'+id),onComp:id=>spoken.push('companion:'+id),party:[{id:'minji',name:'민지'}]});
    settle();
    for(const npc of scene.settlementState().residents){
      cv.onpointerup({currentTarget:cv,clientX:npc.p.x,clientY:npc.p.y});settle();
      assert.equal(spoken.at(-1),'npc:'+npc.id,id+' resident');
    }
    const person=scene.settlementState().recruit;
    if(person){cv.onpointerup({currentTarget:cv,clientX:person.p.x,clientY:person.p.y});settle();assert.equal(spoken.at(-1),'recruit:'+person.id);}
    const companion=scene.settlementState().companions[0];
    cv.onpointerup({currentTarget:cv,clientX:companion.p.x,clientY:companion.p.y});settle();assert.equal(spoken.at(-1),'companion:minji');
  }
});
test('completed local work still leaves physical changes in each town',()=>{
  for(const id of cities){init(id,{impact:{stage:0}});const before=lastBuffer.c.calls.filter(c=>c[0]==='fillRect').length;init(id,{impact:{stage:3}});assert(lastBuffer.c.calls.filter(c=>c[0]==='fillRect').length>before,id+' work adds visible physical details');}
});
test('a pending conversation cannot reopen after the player leaves the town',()=>{
  const queue=[],spoken=[];ctx.setTimeout=fn=>queue.push(fn);
  const cv=init('miryang',{npcs:[{id:'sundeok',name:'순덕'}],onNpc:id=>spoken.push(id)});settle();
  const npc=scene.settlementState().residents[0];cv.onpointerup({currentTarget:cv,clientX:npc.p.x,clientY:npc.p.y});settle();
  assert.equal(queue.length,1);scene.closeSettlement();queue.forEach(fn=>fn());assert.equal(spoken.length,0);
  ctx.setTimeout=fn=>fn();
});
test('switching towns releases the previous canvas handlers',()=>{
  const first=init('miryang');init('muju');
  assert.equal(first.onpointerup,null);assert.equal(first.onkeydown,null);
});
let home;
if(fs.existsSync(path.join(root,'src/07g-ui-home.js'))){vm.runInContext(read('07g-ui-home.js')+'\nglobalThis.home=HOME;',ctx);home=ctx.home;}
const state={party:['minji'],up:{bunk:true,solar:false},memories:{leo:{home:'남겨 둔 <기억> & "노래"'}},keepsakes:D.companionKeepsakes,upgrades:D.upgrades};
test('empty home has the vehicle space and no phantom objects',()=>{
  assert(home,'HOME renderer is required');const html=home.html({});
  assert(html.includes('home-shell'));assert(!html.includes('data-home-object='));
});
test('owned props and departed memories stay distinct, escaped and stable across party order',()=>{
  assert(home,'HOME renderer is required');const html=home.html(state);
  assert(html.includes('data-home-object="companion:minji"'));
  assert(html.includes('data-home-object="memory:leo"'));assert(!html.includes('data-home-object="companion:leo"'));
  assert(html.includes('data-home-object="upgrade:bunk"'));assert(!html.includes('data-home-object="upgrade:solar"'));
  assert(!html.includes('data-home-object="companion:jaeyi"'));
  const active=home.html({...state,party:['leo','minji']});
  assert(active.includes('data-home-object="companion:minji"'));assert(active.includes('data-home-object="companion:leo"'));assert(!active.includes('data-home-object="memory:leo"'));
});
test('object activation reveals only its actual state without mutation; wiring is idempotent and disposable',()=>{
  assert(home,'HOME renderer is required');
  const snapshot=JSON.stringify(state),buttons=['companion:minji','memory:leo','upgrade:bunk'].map(key=>({dataset:{homeObject:key},setAttribute(k,v){this[k]=v;}}));
  const detail={innerHTML:''};const container={querySelectorAll:selector=>selector==='[data-home-object]'?buttons:[],querySelector:()=>detail};
  const oldCleanup=home.wire(container,state);const cleanup=home.wire(container,state);oldCleanup();
  buttons[1].onclick();assert(detail.innerHTML.includes('남겨 둔 &lt;기억&gt; &amp; &quot;노래&quot;'));assert(detail.innerHTML.includes('남긴 기억'));
  buttons[2].onclick();assert(detail.innerHTML.includes('주행 피로 -20%'));assert(!detail.innerHTML.includes('남겨 둔'));
  buttons[0].onclick();assert(detail.innerHTML.includes(D.companionKeepsakes.minji.desc));
  assert.equal(JSON.stringify(state),snapshot);cleanup();assert(buttons.every(button=>button.onclick===null));
});
console.log(`${checks} passed, ${failures} failed`);if(failures)process.exitCode=1;
