'use strict';
// Isolated engine + extracted real workbench/close handlers, DOM stubs only.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {setup}=require('../../ten-persona-repairs-20261020/setup.cjs');
const root=path.resolve(__dirname,'../../..'),ui=fs.readFileSync(path.join(root,'src/07-ui.js'),'utf8');
const sourceRel='qa-artifacts/expedition-thirty-20261021/player30/attempt01/player30-save.json';
const raw=fs.readFileSync(path.join(root,sourceRel),'utf8');
const trace=JSON.parse(fs.readFileSync(path.join(root,'qa-artifacts/expedition-thirty-20261021/player30/attempt01/player30-trace.json'),'utf8'));
const logs=[];const emit=(kind,row)=>logs.push({index:logs.length,kind,...row});
function harness(patch=''){
 const h=setup();assert(h.run(`G.load(${JSON.stringify(raw)})`));
 h.run(`globalThis.qaCalls=[];globalThis.qaOpen=false;globalThis.qaHtml=[];
 globalThis.qaClass=new Set();globalThis.qaButtons={};
 globalThis.qaSheet={dataset:{},style:{removeProperty:()=>{}},classList:{add:(...xs)=>xs.forEach(x=>qaClass.add(x)),remove:(...xs)=>xs.forEach(x=>qaClass.delete(x)),contains:x=>qaClass.has(x)},
 get innerHTML(){return this._html||''},set innerHTML(v){this._html=v;qaHtml.push(v);qaButtons={};for(const m of v.matchAll(/<button[^>]*>/g)){const cr=m[0].match(/data-cr="([^"]+)"/),pick=m[0].match(/data-craft-pick="([^"]+)"/);const key=cr?'make':pick?'pick:'+pick[1]:m[0].includes('data-x=')?'close':null;if(key)qaButtons[key]={dataset:cr?{cr:cr[1]}:pick?{craftPick:pick[1]}:{},disabled:/ disabled/.test(m[0])};}},
 querySelectorAll:q=>q==='[data-craft-pick]'?Object.entries(qaButtons).filter(([k])=>k.startsWith('pick:')).map(([,v])=>v):[],querySelector:q=>q==='[data-cr]'?qaButtons.make:q==='[data-x]'?qaButtons.close:null};
 globalThis.$=q=>q==='#ev-wrap'?{classList:{contains:()=>qaOpen}}:qaSheet;
 globalThis.SND={setDriving:v=>qaCalls.push('driving:'+v)};
 globalThis.AMBI={action:v=>qaCalls.push('audio:'+v),restore:()=>qaCalls.push('ambient:restore')};
 globalThis.esc=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 globalThis.openModal=()=>{qaOpen=true;qaCalls.push('open');};globalThis.closeModal=()=>{qaOpen=false;qaCalls.push('close');};
 globalThis.renderAll=()=>qaCalls.push('road:render');globalThis.renderHud=()=>qaCalls.push('hud');
 globalThis.clearStoryAuto=()=>qaCalls.push('auto:clear');globalThis.showCampHub=()=>{};globalThis.showSeoul=()=>{};
 globalThis.curEv=null;globalThis.curStory=null;globalThis.curCombatChoices=[];
 UI.modalOpen=()=>qaOpen;UI.showEnding=()=>{qaOpen=false;qaCalls.push('ending')};
 `);
 const start=ui.indexOf('  let craftSelectedId='),end=ui.indexOf('\n  // This is a passenger',start);
 h.run(ui.slice(start,end));const cs=ui.indexOf('  function closeEvent('),ce=ui.indexOf('\n  function ',cs+4);h.run(ui.slice(cs,ce));
 if(patch)h.run(patch);
 return h;
}
const snap=h=>h.json('({at:S.at,day:S.day,min:S.min,scrap:S.scrap,fuel:S.fuel,water:S.water,food:S.food,items:S.items,up:S.up,armed:S.flags.armed_age,ended:S.ended,thirst:S.thirst,hunger:S.hunger,fatigue:S.fatigue})');
const htmlFacts=h=>{const html=h.run('qaSheet.innerHTML');return {costs:[...html.matchAll(/<small>(고철|부품|연료)<\/small><b>([^<]+)<\/b>/g)].map(m=>[m[1],m[2]]),disabled:h.run('qaButtons.make.disabled'),button:html.match(/<button type="button" class="craft-primary"[\s\S]*?<\/button>/)?.[0],open:h.run('qaOpen')};};
function select(h,id){h.run(`showCraft({selected:${JSON.stringify(id)},phase:'preview'})`);}
function execute(h,id,label,click=true){select(h,id);const before=snap(h),can=h.json(`G.canCraft(${JSON.stringify(id)})`),render=htmlFacts(h);h.run('qaCalls.length=0');const result=click?(h.run('if(!qaButtons.make.disabled) qaButtons.make.onclick()'),!render.disabled):h.run(`G.craft(${JSON.stringify(id)})`);const after=snap(h);emit(label,{id,before,can,render,result,after,calls:h.json('qaCalls')});return {before,after,can,render,result};}
module.exports={harness,snap,htmlFacts,select};
if(require.main===module){
const unlock=trace.trace.find(r=>r.observation?.eventId==='perimeter_first'&&r.action==='choice');
emit('provenance',{save:sourceRel,sha256:crypto.createHash('sha256').update(raw).digest('hex'),traceN:unlock.n,choice:unlock.decision||unlock.choice||unlock.selected,traceKeys:Object.keys(unlock),result:unlock.result,sourceEnded:JSON.parse(raw).ended,sourceArmed:JSON.parse(raw).flags.armed_age,method:'Resume unchanged prior public-engine run; no state injection in resumed cases. setup opening-completed fixture is replaced entirely by G.load(raw).'});
const h=harness();emit('resume-start',{state:snap(h),pending:h.json('S.pendingPresentation'),infinite:h.run('G.isInfiniteResourceMode()')});
for(const id of ['pipe','xbow','bolt','molotov','ammo']){
 const r=execute(h,id,'resumed-recipe');assert(r.result);assert.equal(r.after.min-r.before.min,40);
 const save= h.store.get('seoul400_save_v1');assert(h.run('G.load()'));assert.deepEqual(snap(h),r.after);emit('resumed-reload',{id,preserved:true,storedBytes:save.length});
}
const beforeClose=snap(h);h.run('qaCalls.length=0;qaButtons.close.onclick()');assert.deepEqual(snap(h),beforeClose);emit('resumed-close',{calls:h.json('qaCalls'),open:h.run('qaOpen'),nextRoutes:h.json('G.neighbors(S.at).map(x=>({to:x.id,check:G.canTravelTo(x.id)}))')});
execute(h,'pipe','resumed-repeat');h.run('qaButtons.close.onclick()');fs.writeFileSync(path.join(__dirname,'resumed-final-save.json'),h.run('JSON.stringify(S,null,2)'));
// Artificial fixtures below deliberately replace stocks/upgrades/clock; not natural play.
for(const id of ['pipe','xbow','bolt','molotov','ammo']){
 const a=harness("S.up.armory=true;S.scrap=40;S.items['부품']=3;S.fuel=10;S.min=600;S.water=10;S.food=10;");
 const r=execute(a,id,'fixture-armory');assert(r.result);assert.equal(r.after.min-r.before.min,20);
 fs.writeFileSync(path.join(__dirname,`render-armory-${id}.html`),a.run('qaHtml[0]'));
 const c=a.json(`D.crafts.find(x=>x.id===${JSON.stringify(id)})`),threshold=Math.ceil(c.need.scrap*.8);
 const b=harness(`S.up.armory=true;S.scrap=${threshold};S.items['부품']=3;S.fuel=10;S.min=600;S.water=10;S.food=10;`);
 execute(b,id,'fixture-discount-threshold');
 const z=harness(`S.scrap=${c.need.scrap-1};S.items['부품']=3;S.fuel=10;S.min=600;`);const reject=execute(z,id,'fixture-insufficient-scrap',false);assert(!reject.result);assert.deepEqual(reject.before,reject.after);
}
for(const id of ['xbow','ammo']){const z=harness("S.scrap=50;S.items['부품']=0;S.min=600");const r=execute(z,id,'fixture-missing-parts',false);assert(!r.result);assert.deepEqual(r.before,r.after);}
for(const fuel of [1.99,2,4.99,5,5.01]){const z=harness(`S.scrap=50;S.fuel=${fuel};S.min=600;`);const r=execute(z,'molotov','fixture-fuel-reserve',false);assert.equal(r.result,fuel>=5);if(!r.result)assert.deepEqual(r.before,r.after);}
for(const ar of [false,true]){const z=harness(`S.up.armory=${ar};S.min=1430;S.water=10;S.food=10;S.thirst=0;`);execute(z,'pipe','fixture-midnight');assert(z.run('G.load()'));emit('fixture-midnight-reload',{armory:ar,state:snap(z)});}
const fatal=harness("S.up.armory=false;S.min=1430;S.water=0;S.food=0;S.thirst=3;");execute(fatal,'pipe','fixture-fatal-midnight');emit('fixture-fatal-ui',{calls:fatal.json('qaCalls'),open:fatal.run('qaOpen'),html:fatal.run('qaSheet.innerHTML'),state:snap(fatal)});
const locked=harness('delete S.flags.armed_age;');execute(locked,'pipe','fixture-api-before-unlock',false);
emit('static-entry',{gate:'src/07-ui.js:2963 if(S.flags.armed_age)',link:'src/07-ui.js:2788 data-a craft → showCraft',limit:'Renderer/DOM stubs prove produced HTML and handler execution only, not visual/browsable accessibility.'});
fs.writeFileSync(path.join(__dirname,'raw-log.json'),JSON.stringify(logs,null,2));console.log(JSON.stringify({cases:logs.length,counts:logs.reduce((a,r)=>(a[r.kind]=(a[r.kind]||0)+1,a),{}),last:snap(h)},null,2));
}
