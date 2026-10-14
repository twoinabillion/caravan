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
const state=(method,party=[])=>({flags:{['core_'+method]:true},party,
  comps:Object.fromEntries(party.map(id=>[id,{mood:60}])),stats:{km:430},day:8,notes:[],log:[],at:'seoul'});
let count=0;
for(const method of ['transfer','sleep','quarantine']){
  for(const party of [[],['minji','kangwoo','eunsu'],['minji','kangwoo','eunsu','parkss','jaeyi','leo']]){
    const S=state(method,party);
    const before=JSON.stringify(S);
    for(const id of ids){
      const e=find(id),turns=e.turns(S);
      // Keep the actual challenge and answer. Brevity must not erase the reason
      // for the self-target or make verification look like a sudden surrender.
      assert(turns.length>0&&turns.length<=16,id+' authored turns');
      assert(turns.every(t=>typeof t.text==='string'&&!/<[^>]*>/.test(t.text)),id+' plain turns');
      const expected=typeof original.get(id).text==='function'?original.get(id).text(S):original.get(id).text;
      assert.equal(e.readingRecord(S),expected.replace(/<[^>]*>/g,''),id+' full original retained');
      assert.strictEqual(e.text,original.get(id).text);
      assert.strictEqual(e.choices,original.get(id).choices);
      assert.equal(JSON.stringify(e.choices),original.get(id).contract,id+' choice contracts untouched');
    }
    const core=find('seoul_core').turns(S).map(t=>t.text).join('\n');
    assert(core.includes('정부 승인은 나중에')&&core.includes('제 지역 기록에 없습니다'));
    const night=find('seoul_night');
    assert(night.turns(S).some(t=>t.text.includes('6,412')));
    for(const choice of night.choices){
      const text=choice.out[0].turns(S).map(t=>t.text).join('\n');
      // Costs belong to the paid decision result, not a repeated night lecture.
      assert(!text.includes(method==='sleep'?'검색창도 함께 잠겼다':method==='transfer'?'거점들의 다툼':'매일 밤 감시조'));
      assert(choice.out[0].readingRecord(S).length>text.length);
      if(method==='sleep') assert(text.includes('콘솔의 꺼진 수신등')&&text.includes('코어는 잠들었다')&&!text.includes('상행 전송'));
      for(const t of choice.out[0].turns(S).filter(t=>t.kind==='dialogue')) assert(party.includes(t.who),'absent cast must not speak');
    }
    assert.equal(JSON.stringify(S),before,'presentation must not mutate state');
    count++;
  }
}
const parents=state('sleep',['eunsu']);
// All night choices share the same payoff, without inventing a prior promise.
for(const promised of [false,true])for(const broadcast of [false,true]){
  const S=state('transfer',['leo']);
  S.flags.song_400km=broadcast;
  S.used=['talk_leo_10']; // Entering the scene is not completion evidence.
  if(promised) S.notes.push({title:'3절 첫 줄 계약'});
  const before=JSON.stringify(S);
  for(const choice of find('seoul_night').choices){
    const turns=choice.out[0].turns(S),record=choice.out[0].readingRecord(S);
    const song=D.leoFinalVerseTurns(S);
    assert.equal(song.filter(t=>t.kind==='dialogue').length,2);
    assert.equal(song[1].text.includes('약속한'),promised);
    assert(song.every(t=>record.includes(t.text)),'optional record retains the same song');
    assert(turns.findIndex(t=>t.name==='400km · 3절 첫 줄')<turns.findIndex(t=>t.scene==='seoul-home-dawn-v2'));
    assert.equal(turns.filter(t=>t.name==='400km · 3절 첫 줄').length,1);
  }
  assert.equal(JSON.stringify(S),before);
  S.party=[];
  assert.equal(D.leoFinalVerseTurns(S).length,0,'no absent Leo, even with his promise note');
}
assert.equal(find('talk_leo_10').noFlag,'seoul_open');
for(const proof of ['none','used','flag','legacy-note']){
  const S=state('sleep',['jaeyi']);
  if(proof==='used')S.used=['talk_jy_21'];
  if(proof==='flag')S.flags.jaeyi_scale_entrusted=true;
  if(proof==='legacy-note')S.notes.push({title:'손저울의 상속',body:'재이가 아빠의 손저울을 서울까지 맡겼다.'});
  const expected=['flag','legacy-note'].includes(proof),before=JSON.stringify(S);
  for(const choice of find('seoul_night').choices){
    const turns=choice.out[0].turns(S),record=choice.out[0].readingRecord(S);
    assert.equal(turns.some(t=>t.text.includes('거래 완료')),expected);
    for(const turn of D.jaeyiScaleReturnTurns(S))assert(record.includes(turn.text));
    if(expected)assert.deepEqual(Array.from(D.jaeyiScaleReturnTurns(S).filter(t=>t.kind==='dialogue'),t=>t.who),['me','jaeyi']);
  }
  assert.equal(JSON.stringify(S),before);
  S.party=[];assert.equal(D.jaeyiScaleReturnTurns(S).length,0);
}
parents.flags.mother_broadcast_ready=true;
parents.flags.father_fate_known=true;
assert(find('seoul_night').turns(parents).some(t=>t.who==='mother'));
assert(find('seoul_core').turns(parents).some(t=>t.text.includes('아빠가 지킨 회선')));
assert(find('seoul_night').readingRecord(parents).includes('17분'));
find('seoul_decision').choices.forEach((choice,i)=>{
  const S=state('transfer',['eunsu']);
  const text=choice.out[0].turns(S).map(t=>t.text).join('\n');
  assert(text.includes(['느린 합의','원본 기록 검색창','매일 밤 감시조'][i]),'chosen outcome owns its cost even before flags settle');
});
console.log(`Finale reading PASS: ${count} method/cast combinations, parent payoff, untouched choices/effects, original optional records, no state mutation.`);
