const test=require('node:test'),assert=require('node:assert/strict');
const {inventory}=require('../tools/narrative-review-inventory.cjs');
test('inventory retains authored branches and functions without claiming review completion',()=>{
 const result=inventory();
 assert(result.counts.event>1000);assert.equal(result.counts.camp,6);assert(result.counts.intro>=27);
 assert.equal(new Set(result.rows.map(row=>row.key)).size,result.rows.length);
 for(const row of result.rows){
  assert.equal(row.fingerprint.length,64);
  assert(Object.values(row.status).every(status=>status==='unreviewed'));
 }
 const recovery=result.rows.find(row=>row.key==='event:main_recovery_story_parent_route_guarded');
 assert.equal(recovery.content.choices.length,2);assert.equal(recovery.content.recoveryOf,'story_parent_route_guarded');
 assert(recovery.content.choices[1].out[0].turns.$function);
 assert(recovery.dynamicFields.includes('content.choices.1.out.0.turns'));
 const jaeyi=result.rows.find(row=>row.key==='event:rq_jaeyi_task');
 assert(jaeyi.content.registeredEntryScenes);assert(jaeyi.content.registeredChoiceScenes);
 assert.equal(JSON.stringify(inventory()),JSON.stringify(result),'reproducible inventory');
});
