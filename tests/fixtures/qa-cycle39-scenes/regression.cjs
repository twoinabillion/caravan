'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');
const old=require('./old-fixtures.json'),{setup,root}=require('./setup.cjs');
function init(){let h=setup(),ui=fs.readFileSync(root+'/src/07-ui.js','utf8');h.run(ui.slice(ui.indexOf('  function eventSceneKeys('),ui.indexOf('  function sceneFormat('))+';globalThis.info=eventScenePresentation;');return h}
const state=h=>h.json('[S.food,S.water,S.scrap,S.min,S.fatigue,S.van,S.flags,S.items,S.notes,S.comps]');
for(const [id,data] of Object.entries(old)){
 test(id+' authored definition unchanged',()=>{let h=init();h.run(`globalThis.e=event('${id}')`);assert.deepEqual(h.json(`JSON.parse(JSON.stringify(e,(k,v)=>typeof v==='function'?v.toString():v))`),data.definition)});
 for(const c of data.cases)test(`${id} ${c.ci}.${c.oi}: fresh effects and old entry, paid and text-only receipts`,()=>{
  let h=init();h.run(`S.party=['eunsu'];S.day=4;S.min=600;S.pendingPresentation=null;globalThis.e=event('${id}');G.beginPresentation(e);globalThis.et=buildStoryTurns(prose(e.text),e,{turnSpeakers:e.turnSpeakers}),ei=info(e,'event',[],et);G.capturePresentationView({eventId:e.id,phase:'event',turns:et,...ei,index:0});G.pickOutcome=()=>e.choices[${c.ci}].out[${c.oi}];globalThis.r=G.resolvePresentedChoice(e,e.choices[${c.ci}]),rt=buildStoryTurns(r.out.text,e,{turnSpeakers:r.out.turnSpeakers});`);
  assert(h.run('r.applied'));assert.equal(h.run('r.out.text'),c.resultText);assert.deepEqual(h.json('rt'),c.resultTurns);assert.deepEqual(state(h),c.state);
  assert(h.run('G.load('+JSON.stringify(c.entry)+')'));h.run(`globalThis.e=event('${id}'),i=info(e,'event',[],[])`);assert.deepEqual(h.json('i.sceneKeys'),c.entryInfo.sceneKeys);assert.equal(h.run('i.sceneTime'),undefined);assert.deepEqual(h.json('S.pendingPresentation.reading.view.turns'),c.entryTurns);
  assert(h.run('G.load('+JSON.stringify(c.paid)+')'));h.run(`globalThis.e=event('${id}'),i=info(e,'outcome',[],[])`);assert.deepEqual(h.json('i.sceneKeys'),c.resultInfo.sceneKeys);assert.equal(h.run('i.sceneTime'),undefined);let before=state(h);h.run(`globalThis.r=G.resolvePresentedChoice(e,e.choices[${c.ci}])`);assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),c.resultText);assert.deepEqual(h.json('r.out.turns'),c.resultTurns);assert.deepEqual(state(h),before);
  let textOnly=JSON.parse(c.paid);delete textOnly.pendingPresentation.view;delete textOnly.pendingPresentation.reading;delete textOnly.pendingPresentation.authoredView;assert(h.run('G.load('+JSON.stringify(JSON.stringify(textOnly))+')'));before=state(h);h.run(`globalThis.e=event('${id}'),r=G.resolvePresentedChoice(e,e.choices[${c.ci}]),i=info(e,'outcome',[],[])`);assert.equal(h.run('r.applied'),false);assert(h.run('r.out.frozenTextOnly'));assert.equal(h.run('r.out.text'),c.resultText);assert.deepEqual(h.json('i.sceneKeys'),c.resultInfo.sceneKeys);assert.deepEqual(state(h),before);
 });
}
