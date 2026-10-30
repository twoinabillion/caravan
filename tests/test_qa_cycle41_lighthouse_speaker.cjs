'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup}=require('./fixtures/qa-cycle39-scenes/setup.cjs');
const oldEntry=fs.readFileSync(__dirname+'/fixtures/qa-cycle41-lighthouse/old-entry.json','utf8');
const oldPaid=fs.readFileSync(__dirname+'/fixtures/qa-cycle41-lighthouse/old-paid.json','utf8');
test('fresh lighthouse entry distinguishes the keeper and his wife',()=>{
 const h=setup();h.run("globalThis.e=event('loc_lighthouse');globalThis.t=buildStoryTurns(prose(e.text),e,{turnSpeakers:e.turnSpeakers})");
 const turns=h.json('t'),dialogues=turns.filter(t=>t.kind==='dialogue');
 assert.equal(dialogues.length,3);assert.deepEqual(dialogues.slice(0,2).map(t=>[t.who,t.name,t.speakerUncertain]),[['passer_elder','등대지기',undefined],['passer_elder','등대지기',undefined]]);
 assert.equal(dialogues[2].text,'또 저 소리. 손님만 오면 저 소리야. 식사는 했어요?');assert.equal(dialogues[2].who,'passer_woman');assert.equal(dialogues[2].name,'등대지기 부인');
});
test('old saved entry and paid reader stay frozen and paid choice is not reapplied',()=>{
 const h=setup();for(const saved of [oldEntry,oldPaid]){const expected=JSON.parse(saved).pendingPresentation;assert(h.run('G.load('+JSON.stringify(saved)+')'));assert.deepEqual(h.json('S.pendingPresentation.reading'),expected.reading);}
 const before=h.run('JSON.stringify([S.food,S.water,S.scrap,S.min,S.flags,S.items,S.notes,S.comps])');h.run("globalThis.e=event('loc_lighthouse'),r=G.resolvePresentedChoice(e,e.choices[0])");assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),JSON.parse(oldPaid).pendingPresentation.text);assert.equal(h.run('JSON.stringify([S.food,S.water,S.scrap,S.min,S.flags,S.items,S.notes,S.comps])'),before);
});
test('both choice effects stay intact and their speakers identify the keeper couple',()=>{
 const h=setup();h.run("globalThis.e=event('loc_lighthouse')");
 const expected=[{time:480,food:2,water:2,moodAll:10,note:{type:'인물',title:'등대지기 부부',body:'"사람 보라고 켜는 거야. 불빛 하나면 세상이 안 끝났다고 믿거든."',links:['서해 등대']}},{item:{'부품':1},scrap:4,moodAll:3}];
 const texts=['등대지기 월급이야. 받아.','우린 30년치 쟁여놨어. 등대지기는 원래 준비성으로 사는 직업이야.'];
 for(let i=0;i<2;i++) {h.run(`globalThis.o=e.choices[${i}].out[0],t=buildStoryTurns(o.text,e,{turnSpeakers:o.turnSpeakers})`);assert.deepEqual(h.json('o.fx'),expected[i]);const lines=h.json("t.filter(x=>x.kind==='dialogue')");assert.equal(lines.length,1);assert.equal(lines[0].text,texts[i]);assert.equal(lines[0].who,'passer_elder');assert.equal(lines[0].name,'등대지기 부부');assert.equal(lines[0].speakerUncertain,undefined);}
});
