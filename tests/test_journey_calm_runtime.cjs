/* VM/CSS contracts only — not browser layout or visual QA. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),postcss=require('postcss');
const ui=fs.readFileSync('src/07-ui.js','utf8'),css=fs.readFileSync('src/01-style.html','utf8');
const styles=[...css.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(m=>postcss.parse(m[1]));
function fn(source,name){const start=source.indexOf('  function '+name+'('),end=source.indexOf('\n  function ',start+4);assert(start>=0&&end>start);return source.slice(start,end);}

test('new geometry is gated until apply; both modes and map share one 272px owner',()=>{
 const owners=[];
 for(const ast of styles)ast.walkDecls('--journey-deck-height',d=>owners.push({selector:d.parent.selector,value:d.value}));
 const calm=owners.filter(x=>x.selector.includes('[data-journey-deck="calm"]')&&!x.selector.includes(':not('));
 assert.deepEqual(calm,[{selector:'html:is([data-journey-layout="scene"],[data-journey-layout="driving"][data-journey-continuity="v2"])[data-journey-deck="calm"]',value:'272px'}]);
 for(const x of owners.filter(x=>x.selector.includes('data-journey-mode')||x.selector.includes('data-route-map'))){
  assert(x.selector.includes(':not([data-journey-deck="calm"])'),'legacy variable must not resize the new deck');
 }
 assert.match(ui,/dataset.journeyDeck='calm'/);assert.match(ui,/data-deck-layout="calm"/);
 assert.doesNotMatch(ui,/setProperty\('--stay-extra-height'/);
 assert.match(css,/:not\(\[data-journey-deck="calm"\]\).*#main:has\(#journey-mode-route/);
 assert.match(css,/:not\(\[data-journey-deck="calm"\]\)\[data-route-map="open"\] #app #journey-vehicle\{display:none\}/);
});
test('shared fixed rows exactly fit the shell without shrinking text; legacy loaded layout is separate',()=>{
 const selector='.journey-deck[data-deck-layout="calm"] :is(.journey-route,.stay-console,.journey-driving)';
 let row;
 for(const ast of styles)ast.walkRules(r=>{if(r.selector===selector)row=r;});
 assert(row);const props=Object.fromEntries(row.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));
 assert.equal(props['grid-template-rows'],'58px 38px 48px 44px');assert.equal(props.gap,'4px');
 assert.equal(272-14-2-8-44,58+38+48+44+3*4+4);
 assert.match(css,/.journey-deck\[data-deck-layout="calm"\] .stay-detail\{display:contents\}/);
 assert.match(css,/.trip-picker-list\{min-height:0;overflow-y:auto;/);
 assert(!row.toString().includes('!important'));
});
test('tab click and keyboard preserve game state and selected action; reduced motion skips animation',()=>{
 for(const reduced of [false,true]){
  let wires=0,resets=0,animations=0;
  const buttons=['route','local'].map(mode=>({dataset:{journeyMode:mode},attrs:{},setAttribute(k,v){this.attrs[k]=v;},focus(){this.focused=true;}}));
  const panels=['route','local'].map(mode=>({id:'journey-mode-'+mode,hidden:mode==='local',details:[{open:true}],querySelectorAll(){return this.details;},setAttribute(){},getAnimations:()=>[],animate(frames,opts){assert.deepEqual(JSON.parse(JSON.stringify(frames)),[{opacity:.35},{opacity:1}]);assert.equal(opts.duration,150);animations++;}}));
  const panel={querySelectorAll:s=>s==='[data-journey-mode]'?buttons:panels};
  const env=vm.createContext({S:{at:'miryang',day:1,min:718.57,driving:null},stayActionId:'radio',journeyConsoleMode:'route',routeMapOpen:true,
   document:{documentElement:{dataset:{}}},window:{matchMedia:()=>({matches:reduced})},
   resetStoppedStageFit:()=>resets++,scheduleStoppedStageFit:()=>{},wireRouteConsole:()=>wires++,panel});
  const before=JSON.stringify(env.S);vm.runInContext(fn(ui,'wireJourneyMode')+';wireJourneyMode(panel,[]);',env);
  buttons[1].onclick();assert.equal(env.journeyConsoleMode,'local');assert(!env.routeMapOpen);
  assert(panels[0].hidden&&!panels[1].hidden);assert(panels.every(p=>!p.details[0].open));
  assert.equal(buttons[1].tabIndex,0);assert(buttons[1].focused);
  let prevented=false;buttons[1].onkeydown({key:'ArrowLeft',preventDefault(){prevented=true;}});
  assert(prevented);assert.equal(env.journeyConsoleMode,'route');assert(!panels[0].hidden&&panels[1].hidden);
  assert.equal(env.stayActionId,'radio');assert.equal(JSON.stringify(env.S),before);
  buttons[0].onclick();assert.equal(wires,2,'same mode has no work');assert.equal(resets,2);
  assert.equal(animations,reduced?0:2);
 }
});
test('rerender closes native pickers before removing their hosts, without focus theft',()=>{
 const body=fn(ui,'renderPanel'),stop=body.indexOf('    if(!S)');
 const first=body.slice(body.indexOf('{')+1,stop);
 const dialogs=[{open:true,onclose:()=>assert.fail('old focus must not be restored'),close(){this.open=false;this.onclose?.();}}];
 const env=vm.createContext({$:()=>({querySelectorAll:s=>{assert.equal(s,'dialog[open]');return dialogs;}})});
 vm.runInContext(first,env);assert(!dialogs[0].open);assert.equal(dialogs[0].onclose,null);
});
test('selected destination never changes scenery until real travel; landscape blend remains continuous',()=>{
 const scene=fs.readFileSync('src/05-scene.js','utf8');
 const env=vm.createContext({S:{at:'miryang',driving:null},D:{nodeBio:{miryang:'rural',daegu:'urban'}},navChoiceId:'daegu',journeyConsoleMode:'route',Math,Number});
 vm.runInContext(fn(scene,'roadBackdropState'),env);
 const state=()=>JSON.parse(JSON.stringify(env.roadBackdropState()));
 const stopped=state();env.journeyConsoleMode='local';assert.deepEqual(state(),stopped);
 assert.equal(stopped.from.id,'miryang');assert.equal(stopped.to.id,'miryang');assert.equal(stopped.mix,0);
 env.S.driving={from:'miryang',to:'daegu',gone:0,dist:52};let previous=0;
 for(let gone=0;gone<=52;gone+=.1){env.S.driving.gone=gone;const mix=state().mix;assert(mix>=previous&&mix<=1);assert(mix-previous<.04);previous=mix;}
 assert.equal(previous,1);env.S={at:'daegu',driving:null};assert.equal(state().from.id,'daegu');
});
