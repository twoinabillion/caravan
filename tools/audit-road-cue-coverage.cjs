const fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES,permanentEvents}=require('./content-registry.cjs');
function inventory(){
 const ctx={console,window:{},document:{readyState:'loading',addEventListener(){}},G:{},S:null};vm.createContext(ctx);
 for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 const source=fs.readFileSync('src/04d-engine-director.js','utf8');
 vm.runInContext(source.slice(source.indexOf('  const ROAD_APPROACH_LABELS'),source.indexOf('  /* UI.roadApproach 구현')),ctx);
 vm.runInContext('globalThis.d=D',ctx);
 const manifest=JSON.parse(fs.readFileSync('assets/road-cues/manifest-v2.json'));
 vm.runInContext(fs.readFileSync('src/05c-road-cue-kit.js','utf8').replace('__ROAD_KIT_MANIFEST__',JSON.stringify(manifest)),ctx);
 return permanentEvents(ctx.d).map(ev=>{
  const profile=ctx.G.roadApproachProfile(ev);if(!profile)return null;
  const composition=ctx.G.roadCueKit.compose(profile,100);
  return {id:ev.id,title:ev.title,type:ev.type,profile,covered:!!composition?.layers.length,
   portrait:ctx.d.eventPortraits?.[ev.id]||null,text:typeof ev.text==='string'?ev.text:null};
 }).filter(Boolean);
}
module.exports={inventory};
if(require.main===module){
 const rows=inventory();
 if(process.argv.includes('--full'))console.log(JSON.stringify(rows,null,2));
 else{
  const groups={};for(const row of rows){const key=row.profile.scene.motif||row.profile.kind;const g=groups[key]||(groups[key]={total:0,covered:0});g.total++;g.covered+=Number(row.covered);}
  const named={};for(const row of rows)if(row.portrait)(named[row.portrait]||(named[row.portrait]=[])).push(row.id);
  console.log(JSON.stringify({total:rows.length,groups,named},null,2));
 }
}
