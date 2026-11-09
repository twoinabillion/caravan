'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),{STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const reader=require('../qa-artifacts/continuous-20261107/cohort01/story/reader-runtime.cjs');
const baseline=path.join(__dirname,'fixtures/qa-cycle97-parent-route/story_parent_route_guarded-entry.json');
const retained=path.join(root,'qa-artifacts/remaining-20261108/cohort01/explorer/agent214/attempt01/scene-exp_greenhouse-result-51.json');
const day='explore-abandoned-greenhouse-day-v1',night='explore-abandoned-greenhouse-night-v1',revision='greenhouse-presence-v1';
function setup(raw){
 const storage=new Map(),noop=()=>{},UI=new Proxy({modalOpen:()=>false},{get:(o,k)=>o[k]||noop});
 const DateFixed=class extends Date{static now(){return 1793014000000;}};
 const ctx=vm.createContext({console,Date:DateFixed,URLSearchParams,location:{search:''},setTimeout:()=>0,clearTimeout:noop,document:{readyState:'loading',addEventListener:noop},window:{dispatchEvent:noop},CustomEvent:function(){},UI,SND:new Proxy({},{get:()=>noop}),localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)}});
 const run=code=>vm.runInContext(code,ctx),json=code=>JSON.parse(run('JSON.stringify('+code+')'));
 for(const file of [...STATIC_CONTENT_FILES,...fs.readdirSync(path.join(root,'src')).filter(f=>/^04[a-h]-.*\.js$/.test(f)).sort().map(f=>'src/'+f)])run(fs.readFileSync(path.join(root,file),'utf8'));
 const journal=fs.readFileSync(path.join(root,'src/07d-ui-quests.js'),'utf8');run(journal.slice(0,journal.indexOf('const QuestLedgerUI=')));
 run(reader.code()+';globalThis.qaInfo=eventScenePresentation;globalThis.g=G;globalThis.d=D;globalThis.event=id=>D.events.find(e=>e.id===id);G.newGame=()=>{throw Error("No newGame in load-only greenhouse tests");};');
 const ui=fs.readFileSync(path.join(root,'src/07-ui.js'),'utf8'),head=ui.indexOf('  function renderStoryScene('),a=ui.indexOf('    const keys=state&&state.sceneKeys||[];',head),b=ui.indexOf('    const src=D.scenes&&D.scenes[key]',a);assert(a>=0&&b>a);run('globalThis.qaSelected=(state,index)=>{const frame=true;'+ui.slice(a,b)+';return key};');
 UI.showEvent=e=>ctx.g.beginPresentation(e);
 assert(run('G.load('+JSON.stringify(typeof raw==='string'?raw:JSON.stringify(raw))+')'));
 run("globalThis.e=event('exp_greenhouse');");
 return {run,json};
}
function fixture(min){
 // Controlled isolated fixture derived from an existing valid save, not a player.
 const save=JSON.parse(fs.readFileSync(baseline));Object.assign(save,{at:'yangsan',day:9,min,party:[],driving:null,pendingPresentation:null,combat:null,ended:false,food:12,water:12,fatigue:10,_chain:null});
 const h=setup(save);assert.equal(h.run("G.queuePresentation('exp_greenhouse')"),'exp_greenhouse');assert(h.run('G.presentTransition()'));return h;
}
function entry(h,capture=true){h.run("globalThis.turns=qaEntry(e),info=qaInfo(e,'event',[],turns);");if(capture)h.run("G.capturePresentationView({eventId:e.id,phase:'event',turns,...info,index:0});");return h.json("({turns,info,selected:qaSelected({eventId:e.id,phase:'event',turns,...info},0)})");}
function pay(h,index){
 h.run(`globalThis.c=e.choices[${index}],r=G.resolvePresentedChoice(e,c);if(!r.ok)throw Error(r.why);globalThis.turns=qaResult(e,c,r.out),info=qaInfo(e,'outcome',['event-explore-farm'],turns),view={eventId:e.id,phase:'outcome',turns,...info,index:0};G.restorePresentationView(view);G.capturePresentationView(view);`);
 return h.json('({applied:r.applied,text:r.out.text,view,receipt:S.pendingPresentation,selected:qaSelected(view,0)})');
}
const state=h=>h.json('({day:S.day,min:S.min,food:S.food,water:S.water,fuel:S.fuel,scrap:S.scrap,van:S.van,fatigue:S.fatigue,items:S.items,flags:S.flags,notes:S.notes,seed:S.seed})');
test('greenhouse-only place registry keeps shared farm/cafe and canonical vehicle metadata',()=>{
 const h=fixture(600),v=h.json('D.eventSceneTimeVariants.exp_greenhouse||null');assert(v,'new greenhouse registry is required');assert.equal(v.revision,revision);assert.equal(v.base,'event-explore-farm');assert.equal(v.day,day);assert.equal(v.night,night);assert.equal(v.legacy,null);
 for(const key of [day,night]){const m=h.json('D.sceneAssetMeta['+JSON.stringify(key)+']');assert.equal(m.format,'place');assert.deepEqual(m.companions,[]);assert.equal(m.size,'1024x576');assert.deepEqual(m.vehicleReference,['assets/reference/dalguji-technical-canon-2026-08-11.webp']);assert.equal(h.run('D.scenes['+JSON.stringify(key)+']'),'assets/scenes/'+key+'.webp');}
 assert.equal(h.run("D.scenes['event-explore-farm']"),'__SCENE_EVENT_EXPLORE_FARM__');assert.deepEqual(h.json('D.eventSceneTimeVariants.exp_greenhouse_cafe'),{base:'event-explore-farm',day:'explore-greenhouse-cafe-day-v1',night:'explore-greenhouse-cafe-night-v1'});
});
for(const [min,key] of [[1169.75,day],[1170,night]])test(`queued receipt at minute${min} stamps current clock/revision; seed result and reload keep exact art/effects`,()=>{
 const h=fixture(min),beforeWords=h.run('e.text'),beforeOut=h.json('e.choices.map(c=>c.out.map(o=>({text:o.text,fx:o.fx})))');assert.equal(h.run('S.pendingPresentation.sceneRevision'),revision);assert.deepEqual(h.json('S.pendingPresentation.sceneTime'),{day:9,min});
 const shown=entry(h);assert.deepEqual(shown.info.sceneKeys,[key]);assert.equal(shown.selected,key);assert.equal(h.run('S.pendingPresentation.text'),beforeWords);
 const result=pay(h,1);assert(result.applied);assert.deepEqual(result.view.sceneKeys,[key]);assert.equal(result.text,'종자 봉투들을 챙겼다. 먹을 순 없지만, 정착지에선 금값이다.');const paid=state(h);assert(h.run('G.load(G.exportSave())'));const replay=pay(h,1);assert.equal(replay.applied,false);assert.deepEqual(replay.receipt,result.receipt,'compare canonical saved owners, not first-frame objects before default normalization');assert.deepEqual(replay.view.turns,result.view.turns);assert.deepEqual(state(h),paid);assert.deepEqual(h.json('e.choices.map(c=>c.out.map(o=>({text:o.text,fx:o.fx})))'),beforeOut);
 assert.equal(result.selected,key);assert.equal(replay.selected,key);
 h.run('S.min='+(key===day?1300:600));assert.deepEqual(entry(h,false).info.sceneKeys,['event-explore-farm'],'paid owner never lends its clock to a new entry phase');h.run("info=qaInfo(e,'outcome',['event-explore-farm'],view.turns)");assert.deepEqual(h.json('info.sceneKeys'),[key],'stored paid view wins over current clock');
});
test('real60minute harvest crosses sunset with an owned day entry and night result, never repayment',()=>{
 const h=fixture(1169.75);assert.deepEqual(entry(h).info.sceneKeys,[day]);const result=pay(h,0);assert(result.applied);assert.equal(h.run('S.min'),1229.75);assert.deepEqual(result.view.sceneKeys,[night]);assert.deepEqual(result.receipt.sceneTime,{day:9,min:1229.75});assert.deepEqual(result.receipt.reading.history.sceneKeys,[day]);const before=state(h);assert.equal(pay(h,0).applied,false);assert.deepEqual(state(h),before);
});
test('unmarked clocked legacy unpaid entry stays original until a newly paid result receives the new revision',()=>{
 const h=fixture(1170);h.run('delete S.pendingPresentation.sceneRevision;delete S.pendingPresentation.reading;');assert.deepEqual(entry(h,false).info.sceneKeys,['event-explore-farm']);h.run('G.beginPresentation(e)');assert.equal(h.run('S.pendingPresentation.sceneRevision||null'),null);const result=pay(h,1);assert(result.applied);assert.equal(result.receipt.sceneRevision,revision);assert.deepEqual(result.view.sceneKeys,[night]);
});
for(const mode of ['exact-retained','text-only','clocked-text-only'])test(`actual retained agent214 n52 paid receipt ${mode} keeps original words/art and cannot repay`,{skip:!fs.existsSync(retained)},()=>{
 const bytes=fs.readFileSync(retained),sha=crypto.createHash('sha256').update(bytes).digest('hex');assert.equal(sha,'c9dfa69ef7142c03121decd20a4d585762c221926b1da9a5221052b92eadde7f');const save=JSON.parse(bytes),original=save.pendingPresentation.text;
 if(mode!=='exact-retained'){delete save.pendingPresentation.reading;delete save.pendingPresentation.view;delete save.pendingPresentation.authoredView;if(mode==='clocked-text-only')save.pendingPresentation.sceneTime={day:save.day,min:save.min};}
 const h=setup(save),before=state(h),receipt=h.json('S.pendingPresentation');h.run('globalThis.c=e.choices[S.pendingPresentation.choiceIndex],r=G.resolvePresentedChoice(e,c);globalThis.turns=qaResult(e,c,r.out),info=qaInfo(e,\'outcome\',[\'event-explore-farm\'],turns);');assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),original);assert.deepEqual(h.json('info.sceneKeys'),['event-explore-farm']);assert.equal(h.run("qaSelected({eventId:e.id,phase:'outcome',turns,...info},0)"),'event-explore-farm');assert.deepEqual(state(h),before);assert.deepEqual(h.json('S.pendingPresentation'),receipt);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(retained)).digest('hex'),sha);
});
