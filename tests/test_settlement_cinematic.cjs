/* Platform mocks verify code contracts, not Studio crop/touch/motion quality. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=f=>fs.readFileSync(f,'utf8'),ui=read('src/07-ui.js'),css=read('src/01-style.html');
function fn(name){const start=ui.indexOf('  function '+name+'('),end=ui.indexOf('\n  function ',start+4);assert(start>=0&&end>start);return ui.slice(start,end);}
function canvas(width=236,height=306){
 const calls=[],c=new Proxy({save(){},restore(){},measureText:s=>({width:s.length*4}),createRadialGradient:()=>({addColorStop(){}})},
 {get:(o,k)=>k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert(Number.isFinite(a),k);calls.push([k,...args]);}});
 return {style:{},isConnected:true,clientWidth:width,clientHeight:height,c,calls,getContext:()=>c,getBoundingClientRect:()=>({left:0,top:0,width,height})};
}
function world(){
 let ready=true,lastBuffer;const queue=[];
 const ctx=vm.createContext({console,Image:class{constructor(){this.complete=ready;this.naturalWidth=ready?960:0;this.naturalHeight=ready?1200:0;}},
 document:{createElement:()=>lastBuffer=canvas()},window:{devicePixelRatio:2},setTimeout:fn=>queue.push(fn)});
 vm.runInContext(read('src/03-data.js')+';globalThis.data=D;',ctx);
 vm.runInContext(read('src/05-scene.js')+';globalThis.scene=SCENE;',ctx);
 const scene=ctx.scene,D=ctx.data;
 return {ctx,scene,D,queue,failImage:()=>ready=false,buffer:()=>lastBuffer,
 init(width=236,height=306,extra={}){const cv=canvas(width,height);scene.initSettlement(cv,{id:'miryang',layout:D.settlementLayouts.miryang,
 spots:D.settlementLayouts.miryang.facilities,cinematic:true,scene:'approved.webp',...extra});return cv;},
 settle(){for(let i=0;i<200&&scene.settlementState()?.moving;i++)scene.drawSettlement(.05);}};
}
test('four drawn place labels and hits share one uniform projection at mobile and short sizes',()=>{
 const w=world();
 for(const [width,height] of [[236,306],[320,260],[360,414],[480,600]]){
  const arrivals=[],cv=w.init(width,height,{onArrive:id=>arrivals.push(id)});w.settle();arrivals.length=0;
  const scale=Math.max(width/236,height/306),ox=(width-236*scale)/2,oy=(height-306*scale)/2;
  for(const f of w.scene.settlementState().facilities){
   assert(w.buffer().calls.some(c=>c[0]==='fillText'&&c[1]===f.label&&c[2]===f.p.x));
   const x=ox+f.p.x*scale,y=oy+f.p.y*scale;assert(x>0&&x<width&&y>0&&y<height,'label stays in crop');
   cv.onpointerup({currentTarget:cv,clientX:x,clientY:y});assert.equal(w.scene.settlementState().focus,f.id);
   w.settle();assert.equal(arrivals.at(-1),f.id);const n=arrivals.length;w.scene.drawSettlement(.1);assert.equal(arrivals.length,n);
  }
  assert.equal(arrivals.length,4);assert.equal(cv.style.imageRendering,'auto');
  const draw=cv.calls.filter(c=>c[0]==='drawImage').at(-1);assert(Math.abs(draw[9]/draw[8]-306/236)<1e-10,'never stretch portrait');
 }
});
test('actual people approach once, can be cancelled by a place, and cannot reopen after exit',()=>{
 const w=world(),spoken=[],stl=w.D.stls.miryang;
 w.init(360,414,{npcs:stl.npcs.map(id=>({id,...w.D.npcs[id]})),recruit:{id:'minji',name:'민지'},party:[{id:'leo',name:'레오'}],
 onNpc:id=>spoken.push(id),onRecruit:id=>spoken.push(id),onComp:id=>spoken.push(id)});w.settle();
 for(const [type,id] of [...stl.npcs.map(id=>['npc',id]),['recruit','minji'],['companion','leo']]){
  assert(w.scene.approachSettlement(type,id));w.settle();w.queue.splice(0).forEach(fn=>fn());assert.equal(spoken.at(-1),id);
 }
 assert(!w.scene.approachSettlement('recruit','unintroduced'));
 const count=spoken.length;w.scene.approachSettlement('npc',stl.npcs[0]);w.scene.walkSettlement('garage');w.settle();w.queue.splice(0).forEach(fn=>fn());assert.equal(spoken.length,count);
 w.scene.approachSettlement('npc',stl.npcs[0]);w.settle();w.scene.closeSettlement();w.queue.splice(0).forEach(fn=>fn());assert.equal(spoken.length,count);
});
test('missing art keeps real facility navigation and no fake bodies or town van',()=>{
 const w=world();w.failImage();const arrivals=[];w.init(360,414,{onArrive:id=>arrivals.push(id)});w.settle();
 w.scene.walkSettlement('alley');w.settle();assert.equal(arrivals.at(-1),'alley');
 assert(!w.buffer().calls.some(c=>c[0]==='drawImage'),'no image drawn on failed decode');
 assert(w.buffer().calls.some(c=>c[0]==='fillText'&&c[1]==='펌프 골목'));
});
test('idle painted hub does not redraw at frame rate and resize invalidates it',()=>{
 const w=world(),cv=w.init(360,414);w.settle();const count=cv.calls.length;
 for(let i=0;i<60;i++)w.scene.drawSettlement(.016);assert.equal(cv.calls.length,count);
 cv.clientWidth=320;w.scene.drawSettlement(.016);assert(cv.calls.length>count);
});
function uiFixture(){
 const data=vm.runInNewContext(read('src/03-data.js')+';D'),nodes=new Map(),buttons=[],people=[],memory=new Map(),walks=[],approaches=[],sections=[];
 const cls=()=>({contains:()=>true,toggle(){},add(){},remove(){}});
 const node=()=>({dataset:{},classList:cls(),setAttribute(){},textContent:'',disabled:true});
 const overlay=node(),enter=node(),title=node(),detail=node(),place=node(),body={_html:'',
 set innerHTML(html){this._html=html;buttons.length=0;for(const m of html.matchAll(/data-stlfocus="([^"]+)"/g))buttons.push({...node(),dataset:{stlfocus:m[1]}});
 people.length=0;for(const m of html.matchAll(/data-stl-person="([^"]+)" data-person-type="([^"]+)"/g))people.push({...node(),dataset:{stlPerson:m[1],personType:m[2]},closest:()=>({open:true})});},
 get innerHTML(){return this._html;},querySelectorAll:s=>s==='[data-stlfocus]'?buttons:people};
 for(const [s,n] of [['#ovl-stl',overlay],['#stl-body',body],['#stl-enter',enter],['#stl-out',node()],['[data-stl-concern]',node()],['#stl-town-canvas',canvas()],['[data-stl-walk-title]',title],['[data-stl-focus-detail]',detail],['[data-stl-focus-place]',place]])nodes.set(s,n);
 const hub={...node(),querySelector:s=>nodes.get(s),querySelectorAll:()=>buttons};nodes.set('#stl-body .stl-hub',hub);
 let config,night=false;
 const ctx=vm.createContext({D:{...data,scenes:{'miryang-market-hub':'approved.webp'},portraits:{minji:'canonical.png'},recruitQuests:{minji:{meet:'meet',name:'민지'}},events:[{id:'meet'}]},
 S:{at:'miryang',min:1071.531,wx:'clear',party:[],items:{},fuel:42,fuelMax:70,water:16,waterMax:28,food:14,foodMax:24,scrap:24,recruitQ:null},
 G:{isNight:()=>night,hasComp:id=>ctx.S.party.includes(id),myName:()=> '상혁',stlImpact:()=>({stage:0,count:0}),isInfiniteResourceMode:()=>false},
 sessionStorage:{getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},curStl:'miryang',stlFocus:'market',stlFieldFocus:'',
 esc:s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),ICO:()=>'',AMBI:{settlement(){}},settlementHeader(){},
 $:s=>nodes.get(s),openModal(){},leaveSettlement(){},showStl:(...args)=>sections.push(args),talk(){},recruitStl(){},showComp(){},requestAnimationFrame:fn=>fn(),
 SCENE:{initSettlement:(cv,c)=>config=c,walkSettlement:id=>walks.push(id),approachSettlement:(...a)=>approaches.push(a)}});
 for(const name of ['settlementScene','settlementLayout','settlementSpots','settlementPortrait','settlementCompanion','settlementWalkCopy','settlementImpactCopy','settlementConcern','rememberSettlementFocus','restoreSettlementFocus','updateSettlementFocus','settlementResourceStripHtml','cinematicSettlementHtml','renderSettlementHub'])vm.runInContext(fn(name),ctx);
 return {ctx,body,buttons,people,enter,memory,walks,approaches,sections,overlay,config:()=>config,setNight:v=>night=v};
}
test('approved hub gates styling, preserves actual roster/resources and never executes on selection',()=>{
 const f=uiFixture(),before=JSON.stringify(f.ctx.S);f.ctx.renderSettlementHub();
 assert.equal(f.overlay.dataset.settlementView,'cinematic');assert(f.config().cinematic);assert.match(f.body.innerHTML,/stl-cinematic-hub/);
 assert.match(f.body.innerHTML,/사람 만나기/);assert.match(f.body.innerHTML,/data-stl-person="minji"/);assert.doesNotMatch(f.body.innerHTML,/data-stl-person="leo"/);
 f.buttons.find(b=>b.dataset.stlfocus==='garage').onclick();assert.equal(f.walks.at(-1),'garage');assert.equal(f.enter.disabled,true);assert.equal(f.sections.length,0);
 f.config().onArrive('market');assert(f.enter.disabled,'stale arrival ignored');f.config().onArrive('garage');assert(!f.enter.disabled);
 f.enter.onclick();assert.equal(f.sections.at(-1)[1],'garage');assert.equal(JSON.stringify(f.ctx.S),before);
 f.people.find(b=>b.dataset.stlPerson==='minji').onclick();assert.equal(f.approaches.at(-1).join(':'),'recruit:minji');
 f.config().onSelectPerson({label:'민지'});assert(f.enter.disabled);f.config().onGround();assert(f.enter.disabled);
 f.ctx.S.party=['minji'];f.ctx.renderSettlementHub();assert.equal(f.people.filter(b=>b.dataset.stlPerson==='minji').length,1);assert.equal(f.people.find(b=>b.dataset.stlPerson==='minji').dataset.personType,'companion');
});
test('night, other weather/time and other towns retain authored world and eligibility',()=>{
 const f=uiFixture();f.setNight(true);f.ctx.renderSettlementHub();assert.equal(f.overlay.dataset.settlementView,'world');assert.equal(f.ctx.stlFocus,'people');
 assert.equal((f.body.innerHTML.match(/disabled>/g)||[]).length,4,'three closed facilities plus initial entry');
 f.setNight(false);for(const wx of ['rain','storm','fog','dust']){f.ctx.S.wx=wx;f.ctx.renderSettlementHub();assert(!f.config().cinematic);}
 f.ctx.S.wx='clear';f.ctx.S.min=720;f.ctx.renderSettlementHub();assert(!f.config().cinematic);
 f.ctx.S.min=1071;f.ctx.curStl='muju';f.ctx.renderSettlementHub();assert(!f.config().cinematic);
});
test('same-place focus survives reopen/reload; cross-place or invalid focus never restores',()=>{
 const f=uiFixture();f.ctx.stlFocus='alley';f.ctx.rememberSettlementFocus();f.ctx.stlFocus='market';f.ctx.restoreSettlementFocus('miryang');assert.equal(f.ctx.stlFocus,'alley');
 f.ctx.S.at='yangsan';f.ctx.restoreSettlementFocus('miryang');assert.equal(f.ctx.stlFocus,'market');
 f.ctx.S.at='miryang';f.memory.set('caravan-settlement-focus-v1',JSON.stringify({at:'miryang',id:'miryang',focus:'missing'}));f.ctx.restoreSettlementFocus('miryang');assert.equal(f.ctx.stlFocus,'market');
});
test('new CSS has a structural gate and no emergency important or pixel border competing with old owner',()=>{
 const start=css.indexOf('/* Eye-level Miryang v1.'),end=css.indexOf('/* ── Settlement Field Board',start),owner=css.slice(start,end);
 assert.match(owner,/#ovl-stl\[data-settlement-view="cinematic"\]/);assert.doesNotMatch(owner,/!important|border-image/);
 assert.match(owner,/stl-cinematic-copy p\{[^}]*overflow-wrap:anywhere/);
 assert.match(owner,/stl-people\[open\]>div\{[^}]*overflow-y:auto/);
 const poles=read('src/05-scene.js').split('  function poles(')[1].split('  function line(')[0];assert.doesNotMatch(poles,/globalAlpha/);assert.match(poles,/ctx.clip\(\)/);
});
