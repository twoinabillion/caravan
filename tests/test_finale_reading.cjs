/* Run directly: node tests/test_finale_reading.cjs. No generated build needed. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context=vm.createContext({console});
vm.runInContext(fs.readFileSync(path.join(root,'src/03-data.js'),'utf8')+'\nglobalThis.data=D;',context);
const D=context.data;
const ids=['seoul_core','seoul_decision','seoul_night','seoul_uplink_reveal'];
const find=id=>D.events.find(e=>e.id===id)||D.seoulStops.find(e=>e.id===id);
const original=new Map(ids.map(id=>[id,{text:find(id).text,choices:find(id).choices,contract:JSON.stringify(find(id).choices)}]));
vm.runInContext(fs.readFileSync(path.join(root,'src/03m-finale-reading.js'),'utf8'),context);
const state=(method,party=[])=>({flags:{['core_'+method]:true},party,comps:{},stats:{km:430},day:8,notes:[],log:[],at:'seoul'});
let count=0;
for(const method of ['transfer','sleep','quarantine']){
  for(const party of [[],['minji','kangwoo','eunsu'],['minji','kangwoo','eunsu','parkss','jaeyi','leo']]){
    const S=state(method,party);
    const before=JSON.stringify(S);
    for(const id of ids){
      const e=find(id),turns=e.turns(S);
      assert(turns.length>0&&turns.length<=12,id+' compact turns');
      assert(turns.every(t=>typeof t.text==='string'&&!/<[^>]*>/.test(t.text)),id+' plain turns');
      const expected=typeof original.get(id).text==='function'?original.get(id).text(S):original.get(id).text;
      assert.equal(e.readingRecord(S),expected.replace(/<[^>]*>/g,''),id+' full original retained');
      assert.strictEqual(e.text,original.get(id).text);
      assert.strictEqual(e.choices,original.get(id).choices);
      assert.equal(JSON.stringify(e.choices),original.get(id).contract,id+' choice contracts untouched');
    }
    const core=find('seoul_core').turns(S).map(t=>t.text).join('\n');
    assert(core.includes('정부 승인은 뒤')&&core.includes('제 지역 기록에 없습니다'));
    const night=find('seoul_night');
    assert(night.turns(S).some(t=>t.text.includes('6,412')));
    for(const choice of night.choices){
      const text=choice.out[0].turns(S).map(t=>t.text).join('\n');
      assert(text.includes(method==='sleep'?'검색창도 함께 잠겼다':method==='transfer'?'거점들의 다툼':'매일 밤 감시조'));
      assert(choice.out[0].readingRecord(S).length>text.length);
      if(method==='sleep') assert(text.includes('수신등은 켜지지 않았다')&&!text.includes('상행 전송'));
      for(const t of choice.out[0].turns(S).filter(t=>t.kind==='dialogue')) assert(party.includes(t.who),'absent cast must not speak');
    }
    assert.equal(JSON.stringify(S),before,'presentation must not mutate state');
    count++;
  }
}
const parents=state('sleep',['eunsu']);
parents.flags.mother_broadcast_ready=true;
parents.flags.father_fate_known=true;
assert(find('seoul_night').turns(parents).some(t=>t.who==='mother'));
assert(find('seoul_core').turns(parents).some(t=>t.text.includes('아빠가 지킨 회선')));
assert(find('seoul_night').readingRecord(parents).includes('열일곱 분'));
find('seoul_decision').choices.forEach((choice,i)=>{
  const S=state('transfer',['eunsu']);
  const text=choice.out[0].turns(S).map(t=>t.text).join('\n');
  assert(text.includes(['느린 합의','원본 기록 검색창','매일 밤 감시조'][i]),'chosen outcome owns its cost even before flags settle');
});
console.log(`Finale reading PASS: ${count} method/cast combinations, parent payoff, untouched choices/effects, original optional records, no state mutation.`);
