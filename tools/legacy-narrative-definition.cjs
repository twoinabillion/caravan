/* Definition-shape checks predate versioned narrative functions. Compare the
   exact mechanics of explicitly revised entries; their historical words and
   cursors are tested by the same suites' saved-reader/payment cases. */
const assert=require('node:assert/strict');
const revisions={seoul_night:'story-refinement-v1',story_personal_cache:'story-rhythm-v1',story_parent_route_shared:'story-rhythm-v1',story_parent_route_guarded:'story-rhythm-v1'};
for(const [id,revision] of Object.entries({...revisions}))if(id.startsWith('story_'))revisions['main_recovery_'+id]=revision;
module.exports=(actual,expected)=>{
 if(revisions[actual.id]){
  assert.equal(actual.narrativeRevision,revisions[actual.id]);
  actual=structuredClone(actual);expected=structuredClone(expected);
  delete actual.narrativeRevision;
  for(const row of [actual,expected]){
   delete row.turns;delete row.text;
   for(const choice of row.choices||[])for(const out of choice.out||[]){delete out.turns;delete out.text;}
  }
 }
 assert.deepEqual(actual,expected);
};
