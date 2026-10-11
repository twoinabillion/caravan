// Production gate: generated candidates alone cannot activate the new renderer.
const {key}=require('./road-route-plan.cjs');
const requiredReferences=require('../assets/visual-contract.json').requiredReferences;
function approvedRoutes(manifest,edges){
 if(manifest?.enabled!==true)return [];
 if(manifest.routes.length!==edges.length||new Set(manifest.routes.map(r=>r.id)).size!==edges.length)throw Error('Continuous terrain requires the whole route graph');
 return edges.map(([from,to,km])=>{
   const r=manifest.routes.find(r=>r.id===key(from,to));
   if(!r||r.from!==from||r.to!==to||r.km!==km||!r.master||!r.sha256)throw Error('Missing route master/provenance: '+key(from,to));
   if(!r.provenance?.prompt?.trim()||!r.provenance.generatedSource||requiredReferences.some(ref=>!r.provenance.references?.includes(ref)))throw Error('Missing exact generation receipt/canonical references: '+r.id);
   const checks=['geometry','style','endpoints','crop360','crop480','motion','reverse','departure','arrival','eventResume','reload'];
   if(checks.some(c=>r.acceptance[c]!==true))throw Error('Unreviewed continuous terrain: '+r.id);
   return r;
 });
}
module.exports={approvedRoutes};
