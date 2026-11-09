'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/07-ui.js','utf8');
function helper(name,env){const start=source.indexOf('  function '+name+'(');assert(start>=0,`${name} must be implemented`);const end=source.indexOf('\n  function ',start+4);vm.runInContext(source.slice(start,end),env);return env[name];}
test('paid installation is immediately readable and closable, with optional work record and no extra payment',()=>{
 let html='',closed=0,draws=0,restored=0;const garageRow={focus(){restored++;}};const done={focus(){},isConnected:true},record={focus(){}};
 const layer={isConnected:true,querySelector:s=>s==='#upgrade-install-done'?done:record,querySelectorAll:()=>[record,done],remove(){this.isConnected=false;closed++;}};
 const state={up:{tank1:true},fuelMax:90,vanMax:100};const before=JSON.stringify(state);
 const env=vm.createContext({S:state,D:{upgradeGroups:[{id:'fuel',nm:'연료',ids:['tank1']}],upgrades:[{id:'tank1'}],upgradeItemArt:{tank1:'own.webp'},upgradeWork:{fuel:{phases:['분해','체결','확인'],actions:['분해한다','체결한다','확인한다']}}},G:{vanStage:()=>({cm:0,nm:'기본'}),seatCapacity:()=>1,hasComp:()=>false},AMBI:{play(){}},SCENE:{drawSettlementVan(){draws++;}},document:{activeElement:done},requestAnimationFrame:f=>f(),renderGarage(){},esc:String,$:s=>s==='#ovl-stl'?{appendChild(){}}:s==='#garage-action'?done:s.includes('data-garage-key')?garageRow:{},el:(_tag,cls,markup)=>{html=markup;layer.className=cls;return layer;}});
 helper('playUpgradeInstall',env)({id:'tank1',nm:'보조 연료통',d:'용량 증가'},{up:{},stage:{cm:0,nm:'기본'},capacity:1,fuelMax:70,vanMax:100});
 assert.match(layer.className,/\bready\b/,'paid work cannot require three more fake work clicks');
 assert.match(html,/<details[\s>]/,'completed phases remain optional reading');assert.doesNotMatch(html,/id="upgrade-step-action"/);
 assert.equal(draws,2,'real before and after vehicle drawings remain');
 let stopped=false;layer.onkeydown({key:'Escape',preventDefault(){},stopPropagation(){stopped=true;}});
 assert.equal(closed,1);assert.equal(restored,1,'return focus belongs to the selected inspectable row, not the disabled bought action');assert(stopped,'Escape must not reach the background settlement');assert.equal(JSON.stringify(state),before);
});
test('work changes use actual fractional/capped hull and committed supplies/elapsed time, without modifying state',()=>{
 const env=vm.createContext({S:{van:100,scrap:12,items:{부품:2},day:3,min:45}});
 const fn=helper('garageWorkChanges',env);const before={van:93.25,scrap:20,parts:3,clock:2*1440+1425};const snapshot=JSON.stringify(env.S);
 const out=fn(before);assert.equal(out.hull,6.75);assert.equal(out.scrap,-8);assert.equal(out.parts,-1);assert.equal(out.minutes,60);assert.equal(JSON.stringify(env.S),snapshot);assert.equal(before.van,93.25);
});
test('camp eligibility distinguishes completed preparation, missing supplies and undamaged hull; rendering spends nothing',()=>{
 const state={food:0,water:0,van:80,vanMax:100,items:{부품:0}};let infinite=false;
 const env=vm.createContext({S:state,G:{hasResource:(k,n)=>infinite||Number(k==='부품'?state.items[k]:state[k])>=n}});
 const fn=helper('campPreparationState',env),before=JSON.stringify(state);
 for(const kind of ['meal','repair']){assert.equal(fn(kind,{}).enabled,false);assert(fn(kind,{}).reason);assert.equal(fn(kind,{[kind]:true}).done,true);assert.equal(fn(kind,{[kind]:true}).enabled,false);}
 assert.equal(JSON.stringify(state),before);
 state.food=state.water=1;state.items.부품=1;assert.equal(fn('meal',{}).enabled,true);assert.equal(fn('repair',{}).enabled,true);
 state.van=100;assert.equal(fn('repair',{}).enabled,false);state.van=80;state.items.부품=0;infinite=true;assert.equal(fn('repair',{}).enabled,true,'existing infinite-resource owner is respected');
});
test('garage formats fractional repair availability without floating point tails',()=>{
 let markup='';const body={set innerHTML(s){markup=s;},querySelectorAll:()=>[]},back={};
 const state={van:93.3,vanMax:100,scrap:20,items:{부품:2},up:{}};
 const env=vm.createContext({S:state,garageGroup:'fuel',garageSelection:'repair',garageRepairResult:null,curStl:'miryang',D:{upgradeGroups:[{id:'fuel',nm:'연료',sub:'설명',ids:[]}]},G:{settlementRepairQuote:()=>({cost:8,amount:30,mins:180}),hasResource:()=>true,hasComp:()=>false,durationLabel:()=> '3시간',vanStage:()=>({nm:'기본',cm:0}),seatCapacity:()=>1},esc:String,ICO:()=>'',requestAnimationFrame(){},settlementSpots:()=>({garage:{label:'정비소',sub:'설명'}}),fieldBoardShell:o=>o.body,$:q=>q==='#stl-body'?body:q==='#stl-hub-back'?back:null});
 const core=fs.readFileSync('src/04a-engine-core.js','utf8'),start=core.indexOf('G.supplyAmountLabel =');vm.runInContext(core.slice(start,core.indexOf('\n};',start)+3),env);
 helper('renderGarage',env)();assert.match(markup,/내구 최대 \+6\.7(?:\s| ·)/);assert.doesNotMatch(markup,/6\.700000/);assert.equal(state.van,93.3);
});
