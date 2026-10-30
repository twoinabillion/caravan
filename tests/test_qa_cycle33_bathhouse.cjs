'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),old=require('./fixtures/qa-cycle33-bathhouse/old.json'),{setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
test('bathhouse speech and note do not claim a fixed group size; all other choices and mechanics match',()=>{
 const h=setup(),choices=h.json("event('exp_bathhouse').choices"),out=choices[0].out[0];
 assert.equal(out.text,'때수건 뭉치, 비누 상자, 그리고 기적처럼 멸균 바나나우유 한 박스.\n\n유통기한? 오늘부로 전원 사면했다.\n\n한 명당 하나씩. 빨대 꽂는 소리가 목욕탕에 울렸다.');
 assert.equal(out.fx.note.body,'유통기한 전원 사면. 빨대 꽂는 소리가 목욕탕에 울렸다.');
 out.text=old.choices[0].out[0].text;out.fx.note.body=old.choices[0].out[0].fx.note.body;assert.deepEqual(choices,old.choices);
});
for(const view of [true,false])test('old paid '+(view?'reader':'text-only')+' keeps original and never pays again',()=>{
 let save=JSON.parse(old.save);if(!view){delete save.pendingPresentation.view;delete save.pendingPresentation.reading;delete save.pendingPresentation.authoredView}
 let h=setup();assert(h.run('G.load('+JSON.stringify(JSON.stringify(save))+')'));let state=h.run('JSON.stringify([S.food,S.scrap,S.min,S.flags,S.items,S.notes,S.comps])');h.run("globalThis.e=event('exp_bathhouse'),r=G.resolvePresentedChoice(e,e.choices[0])");assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),old.text);assert.equal(h.run('JSON.stringify([S.food,S.scrap,S.min,S.flags,S.items,S.notes,S.comps])'),state);if(view)assert.deepEqual(h.json('r.out.turns'),old.turns);else assert(h.run('r.out.frozenTextOnly'));
});
for(const party of [['minji'],['minji','parkss'],['minji','parkss','kangwoo']])test('actual reader and notes fit '+(party.length+1)+' travelers',()=>{
 const h=setup();h.run(`S.party=${JSON.stringify(party)};globalThis.e=event('exp_bathhouse');G.beginPresentation(e);G.pickOutcome=()=>e.choices[0].out[0];globalThis.r=G.resolvePresentedChoice(e,e.choices[0]),turns=buildStoryTurns(r.out.text,e,{turnSpeakers:r.out.turnSpeakers});`);assert(h.run('r.applied'));assert(!h.run('r.out.text.includes("뽁. 뽁. 뽁.")'));assert(h.json('turns').some(t=>t.text.includes('빨대 꽂는 소리가')));assert(h.json('S.notes').some(n=>n.title==='바나나우유 사면식'&&!n.body.includes('뽁.')));
});
