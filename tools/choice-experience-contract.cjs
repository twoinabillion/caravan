// Project only the five reviewed 2026-11-02 public choice forecasts onto old baselines.
// Assert the complete value before removing it; effects, prose and all other fields remain protected.
const assert=require('node:assert/strict');
const expected={
 // Production recovery clones the original event's choices; it is not a sixth authored edit.
 main_recovery_onboarding_first_road:{2:{exposure:'달구지가 관측망에 등록된다'}},
 onboarding_first_road:{2:{exposure:'달구지가 관측망에 등록된다'}},
 route_mid_fork:{0:{lasting:'청주까지 노선 변경 불가'},1:{lasting:'청주까지 노선 변경 불가'}},
 rq_minji_task:{1:{expense:'고철 4 · 차체 최대 3%'},2:{expense:'차체 최대 12%'}}
};
module.exports=function projectChoiceForecast(row){
 for(const [index,value]of Object.entries(expected[row.id]||{})){
  assert.deepEqual(row.choices[index].foreseeable,value,row.id+' choice '+index+' exact reviewed forecast');
  delete row.choices[index].foreseeable;
 }
 return row;
};
