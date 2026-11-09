/* Explicit story-entry-v1 deltas projected onto old mechanics baselines.
   Keep the old hashes; assert each new edition and additive event first. */
const assert=require('node:assert/strict');
const revisions={
 'main_command_ledger':'story-refinement-v1','main_command_companion_ledger':'story-refinement-v1',
 'main_relay_conference':'story-refinement-v1','main_relay_companion_conference':'story-refinement-v1',
 'story_bridge_watched':'story-refinement-v1','seoul_night':'story-refinement-v1',
 'seoul_core':'story-rhythm-v1','seoul_session_reset':'story-rhythm-v1',
 'onboarding_first_road':'opening-flow-v1','memory_busan_terminal':'travel-memory-v1'
};
for(const prefix of ['','main_recovery_']){
 for(const id of ['parents_diversion_manifest','parents_separated_work'])revisions[prefix+id]='family-records-v1';
 for(const id of ['story_personal_cache','story_parent_route_shared','story_parent_route_guarded','parents_father_last_log'])revisions[prefix+id]='story-rhythm-v1';
}
module.exports=rows=>{
 for(let i=rows.length-1;i>=0;i--){
  const row=rows[i];if(!row)continue;
  if(row.id==='story_doyun_family_update'){
   assert.equal(row.once,true);assert.equal(row.noPool,1);assert.equal(row.needFlag,'bridge_departure_echo');
   assert.equal(row.narrativeRevision,'story-rhythm-v1');assert.equal(row.choices.length,1);
   assert.deepEqual(row.choices[0].out.map(out=>out.fx),[{flag:'doyun_family_status_known'}]);
   assert.deepEqual({...row.roadApproach,label:'길가 단말에 부산 연락소의 주파수가 표시돼 있다'},{kind:'signal',label:'길가 단말에 부산 연락소의 주파수가 표시돼 있다',duration:4200,scene:{motif:'radio-post',people:0}});
   rows.splice(i,1);continue;
  }
  if(row.id==='seoul_afterword_choice'){
   assert.equal(row.narrativeRevision,'story-rhythm-v1');assert.equal(row.choices.length,2);
   const fx=row.choices[0].out[0].fx;assert.equal(fx.flag,'story_done');assert.equal(fx.endJourney,1);assert.equal(fx.moodAll,2);
   assert.deepEqual(row.choices[1].out[0].fx,{flag:'afterword_requested',chain:'seoul_uplink_reveal'});
   rows.splice(i,1);continue;
  }
  if(Object.hasOwn(revisions,row.id)&&Object.hasOwn(row,'narrativeRevision')){
   assert.equal(row.narrativeRevision,revisions[row.id],row.id+' edition');delete row.narrativeRevision;
  }
  if(row.id==='memory_busan_terminal'&&row.travelMemory){
   assert.deepEqual({...row.travelMemory,title:'부산 터미널에서 기다리던 밤'},{title:'부산 터미널에서 기다리던 밤',cue:'문득, 그날이 떠올랐다.'});
   assert.equal(row.roadApproach,false);delete row.travelMemory;delete row.roadApproach;
  }
 }
 return rows;
};
