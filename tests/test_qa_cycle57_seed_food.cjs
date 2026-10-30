'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{setup}=require('./fixtures/qa-cycle39-scenes/setup.cjs'),old=require('./fixtures/qa-cycle57-seed-food/baseline.json');
const additions={
 'meet_seedlady:0':['엄밀히는 빌린 거다.','엄밀히는 빌린 거다. 주인은 바로 먹을 말린 채소 세 꾸러미도 함께 건넸다.'],
 'ev_seed_girl:0':['상추와 무 씨앗을 골랐다.','상추와 무 씨앗을 골랐다. 소녀는 바로 먹을 말린 채소 두 꾸러미도 함께 내주었다.'],
 'ev_seed_girl:1':['전에 얻어둔 해바라기 씨앗과 소녀의 채소 씨앗을 맞바꿨다.','전에 얻어둔 해바라기 씨앗과 소녀의 채소 씨앗을 맞바꿨다. 소녀는 말린 채소 세 꾸러미도 함께 건넸다.']
};
for(const id of Object.keys(old))for(const x of old[id].cases)test(`${id} choice ${x.ci}: fresh reader text and unchanged effects`,()=>{
 const h=setup(),base=old[id];h.run(`G.load(${JSON.stringify(base.entry)});globalThis.e=event(${JSON.stringify(id)});G.pickOutcome=()=>e.choices[${x.ci}].out[0];globalThis.r=G.resolvePresentedChoice(e,e.choices[${x.ci}]);`);assert(h.run('r.ok&&r.applied'));const change=additions[id+':'+x.ci];const expected=change?x.text.replace(...change):x.text;assert.equal(h.run('r.out.text'),expected);assert.equal(h.run('S.food'),x.food);assert.equal(h.run('S.water'),x.water);assert.equal(h.run('S.scrap'),x.scrap);assert.deepEqual(h.json('S.items'),x.items);assert.deepEqual(h.json(`e.choices[${x.ci}].req||null`),base.definition.choices[x.ci].req||null);assert.deepEqual(h.json(`e.choices[${x.ci}].out[0].fx`),base.definition.choices[x.ci].out[0].fx);
 h.run(`globalThis.turns=buildStoryTurns(r.out.text,e,{turnSpeakers:r.out.turnSpeakers||[]})`);if(change)assert(h.json('turns').some(t=>t.text.includes(change[1])));h.run(`globalThis.oldTurns=buildStoryTurns(${JSON.stringify(x.text)},e,{turnSpeakers:r.out.turnSpeakers||[]})`);assert.deepEqual(h.json("turns.filter(t=>t.kind==='dialogue')"),h.json("oldTurns.filter(t=>t.kind==='dialogue')"));
});
for(const id of Object.keys(old))for(const x of old[id].cases)test(`${id} choice ${x.ci}: legacy entry and paid/text-only reader remain frozen`,()=>{
 for(const textOnly of [false,true]){const h=setup(),raw=JSON.parse(x.paid);if(textOnly){delete raw.pendingPresentation.reading;delete raw.pendingPresentation.view;delete raw.pendingPresentation.authoredView}h.run(`G.load(${JSON.stringify(JSON.stringify(raw))});globalThis.e=event(${JSON.stringify(id)})`);const before=h.json('[S.food,S.water,S.scrap,S.items,S.flags,S.notes]');h.run(`globalThis.r=G.resolvePresentedChoice(e,e.choices[${x.ci}])`);assert(h.run('r.ok&&!r.applied'));assert.equal(h.run('r.out.text'),x.text);if(textOnly)assert(h.run('r.out.frozenTextOnly'));assert.deepEqual(h.json('[S.food,S.water,S.scrap,S.items,S.flags,S.notes]'),before)}
 const h=setup();h.run(`G.load(${JSON.stringify(old[id].entry)})`);assert.equal(h.run('S.pendingPresentation.text'),old[id].definition.text);
});
