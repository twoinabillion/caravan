// Actual engine + production settlement entry/turn-in handlers; DOM/audio are sinks.
const fs=require('node:fs'),path=require('node:path');
const {setup}=require('../../../ten-persona-repairs-20261020/setup.cjs');
const ui=fs.readFileSync(path.resolve(__dirname,'../../../../src/07-ui.js'),'utf8');
const normal=fs.readFileSync(path.resolve(__dirname,'../story/normal-resume-active-board.json'),'utf8');
function install(h){
 h.run(`globalThis.calls=[];globalThis.curStl=null;globalThis.stlMode='hub';globalThis.stlFocus='market';globalThis.marketSelection=null;globalThis.garageSelection='';globalThis.peopleSelection='';globalThis.stlFieldFocus='';
 const qaNodes=new Map();globalThis.$=id=>{if(!qaNodes.has(id))qaNodes.set(id,{innerHTML:'',dataset:{},classList:{add(){},remove(){},toggle(){},contains:()=>true},setAttribute(){},querySelectorAll:()=>[]});return qaNodes.get(id);};
 globalThis.AMBI={settlement:()=>calls.push('ambience')};globalThis.SCENE={closeSettlement:()=>calls.push('scene-close')};globalThis.restoreSettlementFocus=()=>{};globalThis.renderSettlementHub=()=>calls.push('hub');globalThis.renderMarketFieldBoard=()=>calls.push('market');globalThis.renderGarage=()=>calls.push('garage');globalThis.renderPeopleFieldBoard=()=>calls.push('people');globalThis.renderAlleyFieldBoard=()=>calls.push('alley');globalThis.settlementHeader=()=>{};globalThis.settlementScene=()=>'';globalThis.settlementSpots=()=>({market:{label:'게시판'},garage:{label:'정비'},people:{label:'사람'},alley:{label:'현장'}});globalThis.openModal=()=>calls.push('open');globalThis.closeOvl=()=>calls.push('close');globalThis.renderAll=()=>calls.push('render');globalThis.settlementConcern=()=>({changed:false});globalThis.toast=()=>calls.push('toast');`);
 let start=ui.indexOf('  function showStl('),end=ui.indexOf('  function renderTrade(',start);h.run(ui.slice(start,end));
 start=ui.indexOf('  function leaveSettlement(');end=ui.indexOf('  function rememberSettlementFocus(',start);h.run(ui.slice(start,end));
 h.run('globalThis.qaDollar=$');return h;
}
function fixture(){const h=setup();if(!h.run(`G.load(${JSON.stringify(normal)})`))throw Error('Normal journey checkpoint did not load');return install(h);}
function button(h,{legacy=false,enabled=true,kind='quest-turnin',quest=null}={}){
 h.run(`globalThis.button={};globalThis.rows=[{key:'qa',kind:${JSON.stringify(kind)},enabled:${enabled},index:0}];globalThis.marketSelection=rows[0];globalThis.stlQuests=${JSON.stringify(quest?[quest]:[])};globalThis.curStl=D.nodes[S.at].stl;globalThis.body={querySelector:()=>button};globalThis.$=q=>q==='#market-action'?button:qaDollar(q);`);
 const start=ui.indexOf(legacy?"        const qt=body.querySelector('#q-turnin');":"    const action=$('#market-action');");
 const end=ui.indexOf(legacy?'      }\n    } else if':"    $('#stl-hub-back').onclick",start);
 h.run('{'+ui.slice(start,end)+'}');return h;
}
const snap=h=>h.json('({at:S.at,day:S.day,min:S.min,ended:S.ended,scrap:S.scrap,items:S.items,fuel:S.fuel,food:S.food,water:S.water,van:S.van,fatigue:S.fatigue,quest:S.quest,followup:S.questFollowup,storyQuests:S.storyQuests,notes:S.notes,npcs:S.npcs,flags:S.flags,completed:S.questLedger.completed})');
module.exports={fixture,button,install,snap};
