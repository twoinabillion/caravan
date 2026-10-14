const test=require('node:test'),assert=require('node:assert/strict');
const {audit}=require('../tools/audit-scene-usage.cjs');
test('usage audit retains alias targets and never marks absent literals safe to delete',()=>{
 const report=audit();
 assert.equal(report.rows.find(row=>row.key==='intro-keepsakes-sorting-v1').status,'used-by-alias');
 assert(!report.rows.some(row=>row.key==='recruit-jaeyi-trapped-box-v1'));
 assert(report.rows.every(row=>row.bytes>0));
 assert(report.rows.every(row=>!row.status.includes('safe-to-delete')));
});
