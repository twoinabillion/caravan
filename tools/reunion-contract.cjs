'use strict';
const assert=require('node:assert/strict');
// Five new authored reunion events are validated in full before projecting
// the pre-existing corpus; no historical corpus hash is replaced.
module.exports=events=>{
 const entries=[['parkss','박 선생','과','진료소에 약을 전하고 박 선생과 길을 나눴던 일이 떠오른다.'],['leo','레오','와','침수된 길에서 레오와 보리를 함께 구했던 일이 떠오른다.'],['jaeyi','재이','와','무너진 창고에서 재이의 가족 상자를 꺼냈던 일이 떠오른다.'],['eunsu','은수','와','은수와 중계기의 송신을 끊었던 일이 떠오른다.'],['kangwoo','강우','와','강우와 함께 서연에게 시장 경계를 넘겼던 일이 떠오른다.']];
 const ids=new Set(entries.map(([id])=>'recruit_reunion_'+id)),matched=events.filter(e=>e.id.startsWith('recruit_reunion_'));assert.equal(matched.length,5);assert(matched.every(e=>ids.has(e.id)));
 for(const [id,name,particle,history] of entries){let rows=matched.filter(e=>e.id==='recruit_reunion_'+id);assert.equal(rows.length,1);assert.deepEqual(JSON.parse(JSON.stringify(rows[0])),{id:'recruit_reunion_'+id,type:'대화',w:0,noPool:1,title:name+particle+' 다시 만나다',text:history+' 그때는 각자의 길을 택했다. 다시 만나 함께 갈지 묻는다.',choices:[{label:'다시 함께 갈지 묻는다',out:[{p:1,text:name+'에게 서울까지 함께 갈 생각이 있는지 물었다. 대답을 기다렸다.',fx:{offerComp:id}}]}]});}
 return events.filter(e=>!ids.has(e.id));
};
