// Isolated source-copy fixtures only. QA art tokens are not viewable artwork.
const fs=require('node:fs'),path=require('node:path');
const {setup:base}=require('../../../../../../qa-artifacts/qa-cycle-20261026/cycle15/story/repair/setup.cjs');
const root=path.resolve(__dirname,'../../../../../..');
const specs=require('./specs.json');
function setup(old=false){
 old=old||process.env.QA_TIME_DRAFT_BASELINE==='1';
 const dir=old?path.join(__dirname,'baseline'):(process.env.QA_TIME_PRODUCTION==='1'?root:path.join(__dirname,'source')),h=base(dir),ui=fs.readFileSync(dir+'/src/07-ui.js','utf8');
 h.run('Date=class extends Date {static now(){return 1793014000000;}};G.save();G.load();G.save();');
 h.run('(()=>{'+ui.slice(ui.indexOf('  function eventSceneKeys('),ui.indexOf('  function sceneFormat('))+
  ';globalThis.qaBaseKeys=eventSceneKeys;globalThis.qaInfo=typeof eventScenePresentation===\'function\'?eventScenePresentation:(e,phase,leading=[])=>({sceneKeys:eventSceneKeys(e,leading)});globalThis.qaOrientation=typeof eventSceneOrientation===\'function\'?eventSceneOrientation:()=>null;})()');
 const head=ui.indexOf('  function renderStoryScene('),sel=ui.slice(ui.indexOf('    const stages=D.eventTurnSceneStages',head),ui.indexOf('    const src=D.scenes&&D.scenes[key]',head));
 const marker=ui.slice(ui.indexOf("    if(sheet?.dataset?.readerDensity==='quiet')",head),ui.indexOf('    const keys=state&&state.sceneKeys',head));
 h.run(`globalThis.qaCut=(state,index)=>{const keys=state.sceneKeys||[];${sel}return key;};globalThis.qaMarker=(state,index,current)=>{const orientation={dataset:{currentOrientation:current}};const sheet={dataset:{readerDensity:'quiet'},querySelector:()=>orientation};${marker}return {kind:sheet.dataset.narrativeTime,text:orientation.textContent};};
 globalThis.qaEntry=e=>{const authored=typeof e.turns==='function'?e.turns(S):e.turns;return Array.isArray(authored)&&authored.length?authored:buildStoryTurns(S.pendingPresentation?.phase==='event'?S.pendingPresentation.text:prose(e.text),e,{turnSpeakers:D.finaleSpeakers(e.id,-1,S)||e.turnSpeakers});};
 globalThis.qaResult=(e,c,out)=>{const authored=out.frozenTextOnly?null:typeof out.turns==='function'?out.turns(S):out.turns;return Array.isArray(authored)&&authored.length?authored:buildStoryTurns(prose(out.text),e,{knownSpeaker:false,speakers:out.speakers,frozenTextOnly:!!out.frozenTextOnly,turnSpeakers:out.frozenTextOnly?[]:D.finaleSpeakers(e.id,e.choices.indexOf(c),S)||out.turnSpeakers});};`);
 return h;
}
function open(id,min=600,old=false){
 const h=setup(old);
 h.run(`S.pendingPresentation=null;S.party=['kangwoo','parkss','eunsu'];S.up.bench=true;S.at='miryang';S.driving=null;S.day=9;S.min=${min};S.food=60;S.water=60;S.scrap=50;S.fuel=60;S.fatigue=35;S.flags.sea_route=true;S.flags.dome_dossier=true;S.flags.postman_met=true;S.items['남산행 편지']=1;S._impactEcho={key:'miryang:parts',stlId:'miryang',from:'miryang',to:'daegu',actionId:'parts',label:'부품 정리',visual:'order',wx:'clear',done:false};G.save();G.load();globalThis.e=event(${JSON.stringify(id)});G.beginPresentation(e);globalThis.entry=qaEntry(e),info=qaInfo(e,'event',[],entry);G.capturePresentationView({eventId:e.id,phase:'event',turns:entry,...info,index:0});`);
 return h;
}
function pay(h,ci,oi=0,capture=true){
 h.run(`globalThis.c=e.choices[${ci}],prior=info.sceneKeys[0];G.pickOutcome=()=>c.out[${oi}];globalThis.r=G.resolvePresentedChoice(e,c);if(!r.ok)throw new Error(JSON.stringify(r));globalThis.turns=qaResult(e,c,r.out),info=qaInfo(e,'outcome',[r.out.scenes,r.out.scene,c.scenes,c.scene,D.eventChoiceScenes?.[e.id]?.[${ci}]].some(Boolean)?[r.out.scenes,r.out.scene,c.scenes,c.scene,D.eventChoiceScenes?.[e.id]?.[${ci}]]:[prior],turns);`);
 if(capture)h.run("globalThis.readerState={eventId:e.id,phase:'outcome',turns,...info,index:0};G.restorePresentationView(readerState);G.capturePresentationView(readerState);G.save();");
 return h.json('({text:r.out.text,turns,chips:r.chips,ok:r.ok,applied:r.applied,info})');
}
const state=h=>h.json('({day:S.day,min:S.min,food:S.food,water:S.water,fuel:S.fuel,scrap:S.scrap,van:S.van,fatigue:S.fatigue,party:S.party,comps:S.comps,flags:S.flags,notes:S.notes,items:S.items,seed:S.seed,impact:S._impactEcho,field:S._stlField})');
function prepare(){const rows=[];for(const spec of specs){const h=open(spec.id,1200,true),entryFile=`legacy/${spec.id}-entry.json`;fs.writeFileSync(path.join(__dirname,entryFile),h.run('G.exportSave()'));const row={...spec,entryFile,entry:h.json('entry'),keys:h.json('info.sceneKeys'),definition:h.json("JSON.parse(JSON.stringify(e,(k,v)=>typeof v==='function'?v.toString():v))"),outcomes:[]};for(let ci=0;ci<row.definition.choices.length;ci++)for(let oi=0;oi<row.definition.choices[ci].out.length;oi++){const x=open(spec.id,1200,true),r=pay(x,ci,oi),file=`legacy/${spec.id}-${ci}-${oi}.json`;fs.writeFileSync(path.join(__dirname,file),x.run('G.exportSave()'));row.outcomes.push({ci,oi,file,result:r,state:state(x)});}rows.push(row);}fs.writeFileSync(path.join(__dirname,'legacy.json'),JSON.stringify(rows,null,2)+'\n');console.log({entries:rows.length,paid:rows.reduce((n,r)=>n+r.outcomes.length,0)});}
module.exports={setup,open,pay,state,specs,root};if(require.main===module)prepare();
