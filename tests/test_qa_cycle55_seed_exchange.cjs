'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('./fixtures/qa-cycle39-scenes/setup.cjs'),old=require('./fixtures/qa-cycle55-seed/baseline.json');
const name='해바라기 씨앗',saved=JSON.stringify;
const state=h=>h.json('[S.food,S.water,S.fuel,S.scrap,S.min,S.fatigue,S.van,S.flags,S.items,S.notes,S.comps]');
for(const n of [0,1])test(`return ${n}: fresh effects, exact item delta and paid reload`,()=>{
 const h=setup(),x=old['return'+n];h.run(`G.load(${saved(x.entry)});globalThis.e=event('seed_return'),r=G.resolvePresentedChoice(e,e.choices[${n}])`);
 assert(h.run('r.ok&&r.applied'));assert.equal(h.run('r.out.text'),x.text);assert.equal(h.run('S.food'),x.food);const flags=h.json('S.flags');assert.equal(flags.recruit_migration_v2,true);delete flags.recruit_migration_v2;assert.deepEqual(flags,x.flags);assert.deepEqual(h.json('S.notes'),x.notes);
 const items=h.json('S.items');if(n===0){assert.equal(items[name],1);delete items[name]}assert.deepEqual(items,x.items);
 const before=state(h);h.run('G.save();G.load();globalThis.replay=G.resolvePresentedChoice(e,e.choices['+n+'])');assert(h.run('replay.ok&&!replay.applied'));assert.deepEqual(state(h),before);
});
test('legacy borrowed or either return flag alone cannot create a packet',()=>{
 for(const x of [old.borrowedOnly,old.return0,old.return1]){const h=setup();h.run(`G.load(${saved(x.paid)});S.pendingPresentation=null;globalThis.e=event('ev_seed_girl');G.beginPresentation(e)`);assert.equal(h.run('G.reqOk(G.choiceReq(e.choices[1])).ok'),false);assert.equal(h.run(`S.items[${saved(name)}]||0`),0)}
});
test('trade costs packet once and retains other outcome effects across reload',()=>{
 const h=setup();h.run(`G.load(${saved(old.borrowedOnly.entry)});S.items[${saved(name)}]=1;globalThis.e=event('ev_seed_girl'),r=G.resolvePresentedChoice(e,e.choices[1])`);
 assert(h.run('r.ok&&r.applied'));assert.equal(h.run('r.out.text').replace(' 소녀는 말린 채소 세 꾸러미도 함께 건넸다.',''),old.borrowedOnly.result.text);assert.equal(h.run('S.food'),13);assert.equal(h.run(`S.items[${saved(name)}]||0`),0);
 let before=state(h);h.run('G.save();G.load();globalThis.replay=G.resolvePresentedChoice(e,e.choices[1])');assert(h.run('replay.ok&&!replay.applied'));assert.deepEqual(state(h),before);
 h.run('S.pendingPresentation=null;G.beginPresentation(e)');assert.equal(h.run('G.reqOk(G.choiceReq(e.choices[1])).ok'),false);
});
test('cancel/entry and other choice preserve the packet',()=>{
 const h=setup();h.run(`G.load(${saved(old.borrowedOnly.entry)});S.items[${saved(name)}]=1`);let before=state(h);h.run('G.save();G.load()');assert.deepEqual(state(h),before);h.run("globalThis.e=event('ev_seed_girl'),r=G.resolvePresentedChoice(e,e.choices[2])");assert(h.run('r.ok&&r.applied'));assert.equal(h.run(`S.items[${saved(name)}]`),1);
});
for(const [key,id,index] of [['return0','seed_return',0],['return1','seed_return',1],['borrowedOnly','ev_seed_girl',1]])test(`${key}: old paid and text-only receipts remain frozen`,()=>{
 for(const textOnly of [false,true]){const h=setup(),x=old[key],raw=JSON.parse(x.paid);if(textOnly){delete raw.pendingPresentation.reading;delete raw.pendingPresentation.view;delete raw.pendingPresentation.authoredView}h.run(`G.load(${saved(saved(raw))})`);const before=state(h);h.run(`globalThis.e=event(${saved(id)}),r=G.resolvePresentedChoice(e,e.choices[${index}])`);assert(h.run('r.ok&&!r.applied'));assert.equal(h.run('r.out.text'),x.text||x.result.text);if(textOnly)assert(h.run('r.out.frozenTextOnly'));assert.deepEqual(state(h),before)}
});
