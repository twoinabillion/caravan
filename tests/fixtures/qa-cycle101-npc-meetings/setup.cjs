'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../../..'),dir=__dirname;
const {STATIC_CONTENT_FILES}=require(path.join(root,'tools/content-registry.cjs'));
const files=[...STATIC_CONTENT_FILES,...fs.readdirSync(root+'/src').filter(p=>/^04[a-h]-.*\.js$/.test(p)).sort().map(p=>'src/'+p)];
const plain=v=>JSON.parse(JSON.stringify(v));
function setup(saved){
 const store=new Map(),messages=[],noop=()=>{},ctx=vm.createContext({console,Date,URLSearchParams,location:{search:''},setTimeout:()=>0,clearTimeout:noop,document:{readyState:'loading',addEventListener:noop},window:{dispatchEvent:noop},CustomEvent:function(){},UI:new Proxy({modalOpen:()=>false,onArrive:()=>0,toast:t=>messages.push(t)},{get:(o,k)=>o[k]||noop}),localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
 const run=s=>vm.runInContext(s,ctx),json=s=>JSON.parse(run('JSON.stringify('+s+')'));
 for(const file of files)run(fs.readFileSync(root+'/'+file,'utf8'));
 const ui=fs.readFileSync(root+'/src/07-ui.js','utf8');
 run(ui.match(/  const stripTags=.*;/)[0]+ui.match(/  const playerSpeaker=.*;/)[0]+ui.slice(ui.indexOf('  function eventSpeakerCandidates('),ui.indexOf('  function prepareEventAudio(')));
 run("Date=class extends Date {static now(){return 1793014000000;}};globalThis.newGames=0;G.newGame=()=>{newGames++;throw Error('fresh game prohibited in controlled regression')};globalThis.event=id=>D.events.find(e=>e.id===id)||D.seoulStops.find(e=>e.id===id);");
 if(saved!==false){const raw=saved||require('./control-seed.json');if(!run(`G.load(${JSON.stringify(JSON.stringify(raw))})`))throw Error('fixture load failed')}
 const start=ui.indexOf('  function talk(nid){'),end=ui.indexOf('  // Small-talk uses',start);
 run(`globalThis.activeNpc=null;globalThis.savedNpc=null;globalThis.curEv=null;globalThis.curStory=null;globalThis.curStl='miryang';globalThis.OFF={ready:()=>true};globalThis.showNpcDialogue=(id,turns,actions)=>{activeNpc={id,turns,actions}};globalThis.talkOff=(id,greet)=>{activeNpc={id,turns:[{text:greet}],actions:[]}};globalThis.renderHud=()=>{};globalThis.showStl=()=>{};globalThis.closeEvent=()=>{activeNpc=null};${ui.slice(start,end)};globalThis.qaTalk=talk;`);
 return {run,json,messages,store};
}
function fresh(stl,fame=false){const h=setup();h.run(`S.at=${JSON.stringify(stl)};S.driving=null;S.day=9;S.min=600;S.food=24;S.water=28;S.fuel=65;S.scrap=100;S.fatigue=10;S.van=90;S.party=${JSON.stringify(fame?['leo']:[])};S.comps.leo.perks=${JSON.stringify(fame?['leo_fame']:[])};S.pendingPresentation=null;S._stlField={daily:{},once:{},impact:{},roadEchoed:{},log:[]};for(const id in S.npcs)S.npcs[id]={att:0,met:false,chat:[]};globalThis.curStl=${JSON.stringify(stl)};`);return h;}
function unlock(h,stl,id){h.run(`(()=>{const a=G.stlFieldAction(${JSON.stringify(stl)},${JSON.stringify(id)});if(a.hidden){for(const p of D.stls[${JSON.stringify(stl)}].field.actions.filter(p=>p.id!==a.id).slice(0,a.needDone||0))S._stlField.daily[S.day+':'+${JSON.stringify(stl)}+':'+p.id]=true;}})()`);}
const snapshot=h=>h.json('S');
const stripMet=s=>{s=plain(s);for(const n of Object.values(s.npcs||{}))delete n.met;return s};
const work=(h,stl,id)=>h.json(`G.doStlFieldAction(${JSON.stringify(stl)},${JSON.stringify(id)})`);
const load=(h,s)=>h.run(`G.load(${JSON.stringify(JSON.stringify(s))})`);
module.exports={setup,fresh,unlock,snapshot,stripMet,work,load,root,dir,plain,files};
