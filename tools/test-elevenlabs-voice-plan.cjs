'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict');
const {voicePlan}=require('./elevenlabs-voice-plan.cjs');
test('current reader exports twelve exact spoken clips, without effects or game wiring',()=>{
  const plan=voicePlan();
  assert.equal(plan.clips.length,12);
  assert.equal(new Set(plan.clips.map(c=>c.text)).size,12);
  assert.equal(plan.game_wired,false);
  assert.match(plan.source_sha256,/^[a-f0-9]{64}$/);
  for(const clip of plan.clips)for(const route of clip.routes){
    assert.equal(route.kind,'radio');
    assert(['ai_census','ai_manifest','exp_glasshouse'].includes(route.event));
    assert(route.who==='cheollian'||route.event==='exp_glasshouse');
  }
});
test('sample is exactly the current census drone question, never Eunsu or player dialogue',()=>{
  const plan=voicePlan(),sample=plan.clips.find(c=>c.id===plan.sample_id);
  assert.equal(sample.text,'안녕하십니까. 정기 현황 파악 중입니다. 탑승 인원을 확인해도 되겠습니까.');
  assert(sample.routes.every(r=>r.event==='ai_census'&&r.phase==='entry'));
  const response=plan.clips.find(c=>c.text==='확인되었습니다. 안전 운행하십시오.');
  assert(response.routes.every(r=>r.event==='ai_census'&&r.phase==='result'&&r.choice===1));
  assert(!plan.clips.some(c=>/집계 코드|방금 뭐라고/.test(c.text)));
});
test('all four real cargo variants are kept instead of speaking absent dog or postman luggage',()=>{
  const lists=voicePlan().clips.filter(c=>c.text.startsWith('적하 목록을 확인합니다.'));
  assert.equal(lists.length,4);
  for(const clip of lists)for(const route of clip.routes){
    assert.equal(clip.text.includes('개 한 마리.'),route.when.dog);
    assert.equal(clip.text.includes('편지—'),route.when.postman_met);
  }
});
test('screen writing and the retired gate line are excluded; rebuild is stable',()=>{
  const plan=voicePlan();
  assert.deepEqual(plan.excluded.map(e=>e.event),['ai_vending','ai_gasstation','seoul_gate']);
  assert(!plan.clips.some(c=>/아직입니다|결제 수단|수고하셨습니다/.test(c.text)));
  assert.deepEqual(voicePlan(),plan);
});
