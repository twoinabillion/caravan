// Read-only readiness report. Never changes acceptance flags or enables gameplay.
const fs=require('node:fs'),path=require('node:path');
const {root,sha}=require('./road-hd-plan.cjs'),{measure,productionGeometry}=require('./road-hd-quality.cjs');
async function check(){
 const p=JSON.parse(fs.readFileSync(path.join(root,'assets/ui/road-connectors/manifest-hd.json')));
 const result={routes:p.routes.length,nativeCandidates:0,newGenerations:0,productionReady:0,bytes:0,unretainedHistoricalPrompts:0,enabled:p.enabled,rows:[]};
 for(const r of p.routes){
  const cityHashesIntact=r.canonicalCities.every(c=>sha(c.file)===c.sha256),c=r.nativeCandidate;
  const row={id:r.id,cityHashesIntact,native:null,generated:null};
  if(c){
   result.nativeCandidates++;result.bytes+=c.bytes;const g=await measure(path.join(root,c.file),r);
   const receipt=JSON.parse(fs.readFileSync(path.join(root,c.provenance)));
   result.unretainedHistoricalPrompts+=!receipt.generation?.prompt;
   row.native={file:c.file,hashIntact:sha(c.file)===c.sha256,sourcePixelsPerViewport:c.sourcePixelsPerViewport,geometry:g,productionGeometry:productionGeometry(g),visualApproval:false};
  }
  if(r.file){result.newGenerations++;const g=await measure(path.join(root,r.file),r);row.generated={file:r.file,geometry:g,productionGeometry:productionGeometry(g),visualApproval:false};}
  // No visual/crop/motion/reload approval may be inferred from numeric results.
  if(c&&cityHashesIntact&&row.native.hashIntact&&row.native.productionGeometry&&Object.values(c.acceptance).every(Boolean))result.productionReady++;
  result.rows.push(row);
 }
 return result;
}
module.exports={check};if(require.main===module)check().then(r=>{
 if(process.argv.includes('--report'))fs.writeFileSync(path.join(root,'tools/design-drafts/scenery-hd/readiness.json'),JSON.stringify(r,null,2)+'\n');
 if(process.argv.includes('--json'))console.log(JSON.stringify(r,null,2));
 else console.log(JSON.stringify({...r,rows:undefined}));
}).catch(e=>{console.error(e);process.exitCode=1;});
