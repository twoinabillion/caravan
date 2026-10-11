const assert=require('node:assert/strict');
const {catalogue}=require('../tools/road-route-plan.cjs'),{approvedRoutes}=require('../tools/road-route-readiness.cjs');
const manifest=catalogue(),edges=manifest.routes.map(r=>[r.from,r.to,r.km,r.road]);
assert.deepEqual(approvedRoutes(manifest,edges),[],'candidates do not activate production');
manifest.enabled=true;assert.throws(()=>approvedRoutes(manifest,edges),/Missing route master/);
for(const r of manifest.routes){r.master='master.png';r.sha256='a'.repeat(64);r.provenance={prompt:'Fixture generation prompt',generatedSource:'fixture.png',references:require('../assets/visual-contract.json').requiredReferences};for(const k of Object.keys(r.acceptance))r.acceptance[k]=true;}
assert.equal(approvedRoutes(manifest,edges).length,78);
const prompt=manifest.routes[0].provenance.prompt;
manifest.routes[0].provenance.prompt=null;assert.throws(()=>approvedRoutes(manifest,edges),/Missing exact generation receipt/);
manifest.routes[0].provenance.prompt=prompt;
manifest.routes[0].acceptance.departure=false;assert.throws(()=>approvedRoutes(manifest,edges),/Unreviewed/);
manifest.routes[0].acceptance.departure=true;
manifest.routes.pop();assert.throws(()=>approvedRoutes(manifest,edges),/whole route graph/);
console.log('PASS all-route production gate: no auto-activation, incomplete art/graph and unverified departure rejected');
