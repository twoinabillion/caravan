'use strict';
/* Explicit presentation-only projection for pre-document corpus fixtures.
   Pin the added document facts first; never replace an old mechanics hash. */
const assert=require('node:assert/strict');
const facts={
 story_bridge_trace_gap:{label:'출력 기록지 살펴보기',ids:['trace-bus-log'],kind:'printout',values:[['03:12','03:16','03:23','']]},
 main_transfer_testimony:{label:'이송표 세 장 살펴보기',ids:['transfer-sunok','transfer-taemun','transfer-jia'],kind:'form',values:[['딸과 같은 목적지 · 다른 차','「헤어졌다」를 「다른 차에 태워졌다」로'],['급수 근무 중','하루 늦게 적힌 날짜 바로잡기'],['혼자 걷기 어려운 아버지 누락','아버지 이름 함께 적기']]},
 main_command_ledger:{label:'송수신 원본 살펴보기',ids:['command-family-order','command-human-check','command-uplink'],kind:'form',values:[['세 당사자의 표와 일치','남산 집행선'],['','집행'],['별도 조건이 남아 있음','남산 밖으로 이어짐','이 원본으로 확인할 수 없음']]}
};
module.exports=function projectEvidenceDocument(row){
 const fact=facts[row.id],inspection=row.inspection;
 if(!fact||!inspection)return row;
 assert.equal(inspection.sceneLabel,fact.label);
 assert.deepEqual(inspection.items.map(item=>item.id),fact.ids);
 inspection.items.forEach((item,i)=>{
  const doc=item.document;assert(doc,'approved document required: '+item.id);assert.equal(doc.kind,fact.kind);assert.equal(typeof doc.source,'string');assert(doc.source.length>0);
  assert(Object.keys(doc).every(k=>['kind','title','source','rows'].includes(k)),'document carries no mechanics');
  assert.deepEqual(doc.rows.map(r=>r.value),fact.values[i]);
  doc.rows.forEach(r=>{assert(Object.keys(r).every(k=>['label','value','blank'].includes(k)));assert.equal(r.blank===true,r.value==='');});
  delete item.document;
 });
 delete inspection.sceneLabel;
 if(row.id==='story_bridge_trace_gap'){
  assert(Object.keys(inspection).every(k=>['title','prompt','items'].includes(k)));
  assert.equal(inspection.prompt,'출력지의 시각과 비어 있는 칸을 직접 살핀다.');
  assert(Object.keys(inspection.items[0]).every(k=>['id','label','text'].includes(k)));
  delete row.inspection;
 }
 return row;
};
