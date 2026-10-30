'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const fixture=(id,ci)=>JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/qa-cycle35-story',id+'-'+ci+'.json')));
function open(id,ci){let h=setup();h.run(`S.party=['minji'];S.food=20;S.water=20;S.scrap=20;S.min=600;globalThis.e=event('${id}');G.beginPresentation(e);G.pickOutcome=()=>e.choices[${ci}].out[0];globalThis.r=G.resolvePresentedChoice(e,e.choices[${ci}]);globalThis.turns=buildStoryTurns(r.out.text,e,{turnSpeakers:D.finaleSpeakers(e.id,${ci},S)||r.out.turnSpeakers});`);assert(h.run('r.applied'));return h}
test('lake entry identifies its sole elder while outcomes retain correct roles and effects',()=>{
 let h=open('loc_lake',0);h.run("globalThis.entry=buildStoryTurns(prose(e.text),e,{turnSpeakers:e.turnSpeakers})");let entry=h.json('entry').filter(t=>t.kind==='dialogue');assert.deepEqual(entry.map(t=>[t.who,t.name]),[['passer_elder','낚시꾼']]);assert.deepEqual(h.json('turns').filter(t=>t.kind==='dialogue').map(t=>[t.who,t.name]),[['passer_elder','낚시꾼']]);assert.deepEqual(h.json('e.choices'),fixture('loc_lake',0).choices);assert.deepEqual(open('loc_lake',1).json('turns').filter(t=>t.kind==='dialogue'),[]);
});
test('silent wrench acceptance gives the visible size while other branches and effects stay exact',()=>{
 const h=open('talk_mj_10',1),old=fixture('talk_mj_10',1),choices=h.json("JSON.parse(JSON.stringify(e.choices,(k,v)=>typeof v==='function'?v.toString():v))");assert.match(h.run('r.out.text'),/렌치에 새겨진 17mm/);assert.match(h.run('prose(e.choices[0].out[0].text)'),/17mm야/);choices[1].out[0].text=old.choices[1].out[0].text;assert.deepEqual(choices,old.choices);
});
for(const [id,ci] of [['loc_lake',0],['loc_lake',1],['talk_mj_10',0],['talk_mj_10',1]])for(const view of [true,false])test(`${id}.${ci} old paid ${view?'reader':'text-only'} preserved without duplicate effects`,()=>{
 const old=fixture(id,ci),raw=JSON.parse(old.save);if(!view){delete raw.pendingPresentation.view;delete raw.pendingPresentation.reading;delete raw.pendingPresentation.authoredView}
 const h=setup();assert(h.run('G.load('+JSON.stringify(JSON.stringify(raw))+')'));const state=h.run('JSON.stringify([S.food,S.water,S.scrap,S.min,S.items,S.flags,S.notes,S.comps])');h.run(`globalThis.e=event('${id}'),r=G.resolvePresentedChoice(e,e.choices[${ci}])`);assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),old.text);assert.equal(h.run('JSON.stringify([S.food,S.water,S.scrap,S.min,S.items,S.flags,S.notes,S.comps])'),state);if(view)assert.deepEqual(h.json('r.out.turns'),old.turns);else assert(h.run('r.out.frozenTextOnly'));
});
