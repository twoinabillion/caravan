'use strict';
const assert=require('node:assert/strict');
const revised=new Set(['main_command_ledger','main_command_companion_ledger',
  'main_relay_conference','main_relay_companion_conference','story_bridge_watched','seoul_core','seoul_night']);
const family=new Set(['parents_diversion_manifest','parents_separated_work','story_personal_cache',
  'story_parent_route_shared','story_parent_route_guarded'].flatMap(id=>[id,'main_recovery_'+id]));
const rhythm=new Set(['story_personal_cache','story_parent_route_shared','story_parent_route_guarded',
  'parents_father_last_log'].flatMap(id=>[id,'main_recovery_'+id]).concat('seoul_core','seoul_afterword_choice','seoul_session_reset'));
const edition=id=>id==='onboarding_first_road'?'opening-flow-v1':rhythm.has(id)?'story-rhythm-v1':family.has(id)?'family-records-v1':'story-refinement-v1';
// Project only this approved addition/edition out of historical mechanics
// checks. Existing costs, gates, choices and original chains remain compared.
module.exports=rows=>{
  for(let i=rows.length-1;i>=0;i--){
    const row=rows[i];
    if(row.id==='seoul_afterword_choice'){
      const mechanics=JSON.parse(JSON.stringify(row,(key,value)=>
        ['text','body','title','label','turnSpeakers','turns','readingRecord','note','missionBrief'].includes(key)?undefined:value));
      assert.deepEqual(mechanics,{id:'seoul_afterword_choice',type:'스토리',once:true,noPool:1,
        scene:'seoul-home-dawn-v2',narrativeRevision:'story-rhythm-v1',choices:[
          {out:[{p:1,fx:{flag:'story_done',endJourney:1,moodAll:2}}]},
          {out:[{p:1,fx:{flag:'afterword_requested',chain:'seoul_uplink_reveal'}}]}
        ]});
      rows.splice(i,1);
    }else if(row.id==='story_doyun_family_update'){
      const mechanics=JSON.parse(JSON.stringify(row,(key,value)=>
        ['text','body','title','label','turnSpeakers','turns','readingRecord','note','missionBrief'].includes(key)?undefined:value));
      assert.deepEqual(mechanics,{id:'story_doyun_family_update',type:'스토리',once:true,noPool:1,
        scene:'story-roadside-terminal-detail-v2',narrativeRevision:'story-rhythm-v1',needFlag:'bridge_departure_echo',
        choices:[{out:[{p:1,fx:{flag:'doyun_family_status_known'}}]}]});
      rows.splice(i,1);
    }else if(row.id==='memory_busan_terminal'&&row.narrativeRevision!==undefined){
      assert.equal(row.narrativeRevision,'travel-memory-v1');
      assert.deepEqual(row.travelMemory,{title:'부산 터미널에서 기다리던 밤',cue:'문득, 그날이 떠올랐다.'});
      assert.equal(row.roadApproach,false);
      delete row.narrativeRevision;delete row.travelMemory;delete row.roadApproach;
    }else if(row.id==='loc_spring'&&row.narrativeRevision!==undefined){
      assert.equal(row.narrativeRevision,'spring-self-voice-v1');delete row.narrativeRevision;
    }else if(row.narrativeRevision!==undefined){
      assert(revised.has(row.id)||family.has(row.id)||rhythm.has(row.id)||row.id==='onboarding_first_road','unreviewed narrative edition: '+row.id);
      assert.equal(row.narrativeRevision,edition(row.id));delete row.narrativeRevision;
    }
  }
  return rows;
};
// Definition snapshots predate this edition. Only these ten entry owners may
// project their revised turns; all outcome/requirement/effect data stays tested.
module.exports.familyEntry=(row,legacy)=>{
  if(!family.has(row.id))return row;
  assert.equal(row.narrativeRevision,edition(row.id));
  assert(['undefined','string','function'].includes(typeof row.turns));
  assert(legacy.turns===undefined||Array.isArray(legacy.turns));
  delete row.narrativeRevision;
  if(rhythm.has(row.id))row.text=legacy.text;
  if(legacy.turns===undefined)delete row.turns;
  else row.turns=JSON.parse(JSON.stringify(legacy.turns));
  return row;
};
