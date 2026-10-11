// Mechanical correction of generation receipts; does not accept or wire art.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),file=path.join(root,'assets/ui/road-routes/manifest.json');
const m=JSON.parse(fs.readFileSync(file,'utf8'));
const receipts=require('./design-drafts/scenery-routes/batch-generation-receipts.json');
const original=require('./design-drafts/scenery-route/provenance.json');
const suffix='\nThe entire bottommost strip of solid terrain MUST be fully opaque alpha255 across the whole width, even where water is shown; only air above the terrain silhouette is transparent.';
function correct(id,c){
 if(!c.provenance)return;
 const exact=receipts.find(r=>r.id===id&&r.source===c.provenance.generatedSource);
 if(exact){c.provenance.prompt=exact.prompt;return;}
 if(id==='daegu--miryang'){
  c.provenance.prompt=original.prompt;c.provenance.references=original.references;
 }else if(id==='busan--yangsan'&&c.master?.endsWith('-v1.png')){
  c.provenance.prompt=null;
  c.provenance.promptRecord='Original manual prompt was not retained verbatim. The catalogue brief is not its generation receipt; re-author before production acceptance.';
 }else if(c.master?.endsWith('-v1.png')&&!c.provenance.prompt.endsWith(suffix))c.provenance.prompt+=suffix;
}
for(const r of m.routes){correct(r.id,r);for(const old of r.previousCandidates||[])correct(r.id,old);}
m.enabled=false;
fs.writeFileSync(file,JSON.stringify(m,null,2)+'\n');
console.log('Recorded exact available receipts, corrected Miryang references, explicitly marked missing manual prompt; production remains disabled.');
