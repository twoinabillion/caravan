'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../../../../..');
const {STATIC_CONTENT_FILES}=require(root+'/tools/content-registry.cjs');
exports.setup=(frozen=false)=>{
  const source=frozen?root+'/qa-artifacts/qa-cycle-20261026/cycle19/source':root;
  const store=new Map(),messages=[],noop=()=>{};
  const ctx=vm.createContext({console,Date,URLSearchParams,location:{search:''},
    setTimeout:()=>0,clearTimeout:noop,document:{readyState:'loading',addEventListener:noop},
    window:{dispatchEvent:noop},CustomEvent:function(){},
    UI:new Proxy({modalOpen:()=>false,toast:t=>messages.push(t)},{get:(o,k)=>o[k]||noop}),
    localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  const run=code=>vm.runInContext(code,ctx);
  for(const p of [...STATIC_CONTENT_FILES,...fs.readdirSync(source+'/src').filter(f=>/^04[a-h]-.*\.js$/.test(f)).sort().map(f=>'src/'+f)])run(fs.readFileSync(source+'/'+p,'utf8'));
  const ui=fs.readFileSync(source+'/src/07-ui.js','utf8');
  run(ui.match(/  const stripTags=.*;/)[0]+ui.match(/  const playerSpeaker=.*;/)[0]+ui.slice(ui.indexOf('  function eventSpeakerCandidates('),ui.indexOf('  function prepareEventAudio(')));
  run("G.seedOverride=181919;G.newGame('onroad','검증','interactive');S.opening.completed=true;globalThis.event=id=>G.presentationEvent(id);");
  return {run,json:s=>JSON.parse(run('JSON.stringify('+s+')')),store,messages};
};
