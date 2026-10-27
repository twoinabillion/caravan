'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../../..'),frozenSource=root+'/qa-artifacts/qa-cycle-20261026/cycle23/source',delta=require('./copy-delta.json');
const {STATIC_CONTENT_FILES}=require(root+'/tools/content-registry.cjs'),reader=require('../../../cycle12/story/reader-runtime.cjs');
const natural=path.resolve(__dirname,'../player02/attempt01/entry-546-seoul_han-export.json');
exports.replace=s=>{for(const r of delta.replacements){assert.equal(s.split(r.old).length,2,'one exact replacement only');s=s.replace(r.old,r.new);}return s;};
exports.load=({draft=false,raw=null,fresh=false,met=true,letter=false,fixed=false}={})=>{
 const source=draft==='production'?root:frozenSource;
 const store=new Map(),noop=()=>{},ctx=vm.createContext({console,Date,URLSearchParams,location:{search:''},setTimeout:()=>0,clearTimeout:noop,document:{readyState:'loading',addEventListener:noop},window:{dispatchEvent:noop},CustomEvent:function(){},UI:new Proxy({modalOpen:()=>false},{get:(o,k)=>o[k]||noop}),localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}}),run=code=>vm.runInContext(code,ctx);
 for(const p of [...STATIC_CONTENT_FILES,...fs.readdirSync(source+'/src').filter(f=>/^04[a-h]-.*\.js$/.test(f)).sort().map(f=>'src/'+f)]){let text=fs.readFileSync(source+'/'+p,'utf8');if(draft===true&&p==='src/03-data.js')text=exports.replace(text);run(text);}
 const ui=fs.readFileSync(source+'/src/07-ui.js','utf8');run(ui.match(/  const stripTags=.*;/)[0]+ui.match(/  const playerSpeaker=.*;/)[0]+ui.slice(ui.indexOf('  function eventSpeakerCandidates('),ui.indexOf('  function prepareEventAudio(')));run('(()=>{'+reader.code()+'})()');
 assert(run(`G.load(${JSON.stringify(raw||fs.readFileSync(natural,'utf8'))})`));
 // Only the fresh/boundary fixtures use state setup. All are explicitly excluded
 // from the natural journey; the default preserves its exact pending export.
 if(fresh)run(`delete S.pendingPresentation;S.flags.postman_met=${met};S.flags.postman_letter=${letter};S.flags.radio_fixed=${fixed};S.flags.sea_route=true;S.items['남산행 편지']=1;G.save();G.load()`);
 run("globalThis.e=G.presentationEvent('seoul_han');");if(fresh)run('G.beginPresentation(e)');run('globalThis.entry=qaEntry(e)');
 return {run,json:s=>JSON.parse(run('JSON.stringify('+s+')'))};
};
exports.state=h=>h.json('({day:S.day,min:S.min,at:S.at,food:S.food,water:S.water,fuel:S.fuel,scrap:S.scrap,items:S.items,van:S.van,fatigue:S.fatigue,flags:S.flags,notes:S.notes,comps:S.comps,quest:S.quest,party:S.party})');
exports.text=h=>h.json('qaNamed(entry)').map(t=>t.text).join('\n');
if(require.main===module){
 const baseline={cohortExcluded:true,status:'frozen23 paid fixtures; not fresh-play evidence',legacy:[]};
 for(const ci of [0,1,2,3]){
  const h=exports.load({fresh:true,met:true,letter:ci===0});h.run(`globalThis.c=e.choices[${ci}];globalThis.r=G.resolvePresentedChoice(e,c)`);assert(h.run('r.ok&&r.applied'));
  h.run('globalThis.turns=qaResult(e,c,r.out,{knownSpeaker:entry.knownSpeaker});G.capturePresentationView({eventId:e.id,phase:"outcome",turns,knownSpeaker:!!entry.knownSpeaker,index:0});G.save();G.load()');
  const file=`legacy-${ci}.json`;fs.writeFileSync(__dirname+'/'+file,h.run('G.exportSave()'));
  const row={choice:ci,file,text:h.run('r.out.text'),turns:h.json('qaNamed(turns)')},raw=JSON.parse(h.run('G.exportSave()'));delete raw.pendingPresentation.view;delete raw.pendingPresentation.reading;delete raw.pendingPresentation.authoredView;
  h.run(`G.load(${JSON.stringify(JSON.stringify(raw))});globalThis.again=G.resolvePresentedChoice(e,c)`);row.textOnly=h.json('qaNamed(qaResult(e,c,again.out))');baseline.legacy.push(row);
 }
 fs.writeFileSync(__dirname+'/baseline.json',JSON.stringify(baseline,null,2)+'\n');
 const before=fs.readFileSync(frozenSource+'/src/03-data.js','utf8'),after=exports.replace(before);fs.writeFileSync(__dirname+'/source-before-block.txt',before.slice(before.indexOf("{id:'seoul_han'"),before.indexOf("{id:'seoul_ruins'")));fs.writeFileSync(__dirname+'/source-draft-block.txt',after.slice(after.indexOf("{id:'seoul_han'"),after.indexOf("{id:'seoul_ruins'")));
}
