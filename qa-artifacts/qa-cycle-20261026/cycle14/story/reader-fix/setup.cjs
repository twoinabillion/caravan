const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../../../../..');
const {STATIC_CONTENT_FILES}=require(path.join(root,'tools/content-registry.cjs'));
const engineFiles=[...STATIC_CONTENT_FILES,...fs.readdirSync(path.join(root,'src')).filter(p=>/^04[a-h]-.*\.js$/.test(p)).sort().map(p=>'src/'+p)];
function setup(sourceRoot=root){
 const store=new Map(),messages=[],timers=[],noop=()=>{};
 const ctx=vm.createContext({console,Date,URLSearchParams,location:{search:''},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout:noop,
  document:{readyState:'loading',addEventListener:noop},window:{dispatchEvent:noop},CustomEvent:function(){},
  UI:new Proxy({modalOpen:()=>false,onArrive:()=>0,toast:t=>messages.push(t)},{get:(o,k)=>o[k]||noop}),
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
 const run=s=>vm.runInContext(s,ctx);
 for(const p of engineFiles)run(fs.readFileSync(path.join(sourceRoot,p),'utf8'));
 const ui=fs.readFileSync(path.join(sourceRoot,'src/07-ui.js'),'utf8');
 run(ui.match(/  const stripTags=.*;/)[0]+ui.match(/  const playerSpeaker=.*;/)[0]+ui.slice(ui.indexOf('  function eventSpeakerCandidates('),ui.indexOf('  function prepareEventAudio(')));
 const journal=fs.readFileSync(path.join(sourceRoot,'src/07d-ui-quests.js'),'utf8');run(journal.slice(0,journal.indexOf('const QuestLedgerUI=')));
 run("G.seedOverride=202020;G.newGame('onroad','상혁','interactive');S.opening.completed=true;globalThis.event=id=>D.events.find(e=>e.id===id)||D.seoulStops.find(e=>e.id===id);globalThis.prose=v=>typeof v==='function'?v(S):v;");
 return {run,json:s=>JSON.parse(run('JSON.stringify('+s+')')),store,messages,timers};
}
module.exports={setup,engineFiles,root};
