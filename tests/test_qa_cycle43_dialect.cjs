'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const setup=require('./fixtures/qa-cycle39-scenes/setup.cjs').setup,sourceRoot=undefined;
const old='"점수는요?" "안 매겨." "왜요." "다 붙었어. 어디 내려놔도 밥은 얻어먹겠더라."\n\n채점표는 끝내 안 나왔다.';
for(const party of [['parkss','eunsu'],['minji','parkss'],['eunsu','parkss'],['kangwoo','minji'],['jaeyi','leo']])test(party.join(',')+' only elder first makes player polite',()=>{
 let h=setup(sourceRoot);h.run(`S.party=${JSON.stringify(party)};globalThis.e=event('comp_dialect'),c=e.choices[1];G.beginPresentation(e);globalThis.r=G.resolvePresentedChoice(e,c),t=buildStoryTurns(r.out.text,e,{turnSpeakers:D.finaleSpeakers(e.id,1,S)||r.out.turnSpeakers})`);assert(h.run('r.applied'));let lines=h.json("t.filter(x=>x.kind==='dialogue')");assert.deepEqual(lines.map(v=>v.who),[party[0],'me',party[0],'me']);if(party[0]==='parkss'){assert.equal(lines[1].text,'안 매겨요.');assert.equal(lines[3].text,'다 붙었어요. 어디 내려놔도 밥은 얻어먹겠더라고요.')}else assert.equal(h.run('r.out.text'),old);assert.deepEqual(h.json('c.out[0].fx'),{moodAll:3});
});
test('old paid text and reader stay frozen without repeat payment',()=>{
 let h=setup(sourceRoot),saved=fs.readFileSync(__dirname+'/fixtures/qa-cycle43-dialect/old-paid.json','utf8');assert(h.run('G.load('+JSON.stringify(saved)+')'));const before=h.run('JSON.stringify([S.food,S.water,S.scrap,S.min,S.flags,S.items,S.notes,S.comps])');h.run("globalThis.e=event('comp_dialect'),r=G.resolvePresentedChoice(e,e.choices[1])");assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),old);assert.deepEqual(h.json('r.out.turns'),JSON.parse(fs.readFileSync(__dirname+'/fixtures/qa-cycle43-dialect/old-turns.json')));assert.equal(h.run('JSON.stringify([S.food,S.water,S.scrap,S.min,S.flags,S.items,S.notes,S.comps])'),before);
});
test('old unpaid reader stays frozen but subsequent result follows current party',()=>{
 const h=setup(),saved=fs.readFileSync(__dirname+'/fixtures/qa-cycle43-dialect/old-entry.json','utf8'),expected=JSON.parse(saved).pendingPresentation;assert(h.run('G.load('+JSON.stringify(saved)+')'));assert.deepEqual(h.json('S.pendingPresentation.reading'),expected.reading);h.run("globalThis.e=event('comp_dialect'),r=G.resolvePresentedChoice(e,e.choices[1]),t=buildStoryTurns(r.out.text,e,{turnSpeakers:D.finaleSpeakers(e.id,1,S)||r.out.turnSpeakers})");assert(h.run('r.applied'));assert.deepEqual(h.json("t.filter(x=>x.kind==='dialogue').map(x=>x.who)"),['parkss','me','parkss','me']);assert.match(h.run('r.out.text'),/안 매겨요/);
});
test('participating choice effect and authored turns remain unchanged',()=>{
 const h=setup();h.run("globalThis.o=event('comp_dialect').choices[0].out[0]");assert.deepEqual(h.json('o.fx'),{moodAll:6,note:{type:'사건',title:'사투리 배틀',body:'공용어 등재: 후미등=궁디불. 우승자는 할머니 성대모사.'}});assert.equal(h.run('o.turns.length'),3);assert.equal(h.run('o.turns[2].text'),'대신 단어가 하나 남았다. 오늘부터 이 차에서 후미등은 궁디불이다.');
});
