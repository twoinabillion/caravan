'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup}=require('./fixtures/qa-cycle39-scenes/setup.cjs');
const dir=path.join(__dirname,'fixtures/qa-cycle41-pc-cafe');
const read=n=>fs.readFileSync(path.join(dir,n),'utf8');
const oldDef=JSON.parse(read('definition.json')), entry=read('entry.json');
const addition='\n\n나오는 길에 매점에서 남은 과자 세 봉지를 챙겼다.';
const state=h=>h.json('({food:S.food,water:S.water,scrap:S.scrap,day:S.day,min:S.min,comps:S.comps,flags:S.flags,items:S.items,notes:S.notes})');
test('definition changes only the food acquisition sentence',()=>{const h=setup();h.run("globalThis.e=event('ev_pc_cafe')");let current=h.json("JSON.parse(JSON.stringify(e,(k,v)=>typeof v==='function'?v.toString():v))");assert.equal(current.choices[1].out[0].text,oldDef.choices[1].out[0].text+addition);current.choices[1].out[0].text=oldDef.choices[1].out[0].text;assert.deepEqual(current,oldDef)});
for(let ci=0;ci<3;ci++)test(`choice ${ci}: fresh state, chips and reader; old paid and text-only restore`,()=>{
 const baseline=JSON.parse(read(`outcome-${ci}.json`)),h=setup();assert(h.run(`G.load(${JSON.stringify(entry)})`));h.run(`globalThis.e=event('ev_pc_cafe');G.pickOutcome=()=>e.choices[${ci}].out[0];globalThis.r=G.resolvePresentedChoice(e,e.choices[${ci}]);globalThis.turns=buildStoryTurns(prose(r.out.text),e,{knownSpeaker:false,speakers:r.out.speakers,turnSpeakers:r.out.turnSpeakers})`);assert(h.run('r.applied'));assert.equal(h.run('r.out.text'),baseline.text+(ci===1?addition:''));assert.deepEqual(h.json('r.chips'),baseline.chips);assert.deepEqual(state(h),baseline.state);assert.deepEqual(h.json('turns'),ci===1?[...baseline.turns,{kind:'narration',text:addition.trim()}]:baseline.turns);
 const paid=read(`paid-${ci}.json`);for(const textOnly of [false,true]){let saved=JSON.parse(paid);if(textOnly){delete saved.pendingPresentation.view;delete saved.pendingPresentation.reading;delete saved.pendingPresentation.authoredView}assert(h.run(`G.load(${JSON.stringify(JSON.stringify(saved))})`));let before=state(h);h.run(`globalThis.e=event('ev_pc_cafe');globalThis.r=G.resolvePresentedChoice(e,e.choices[${ci}])`);assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),baseline.text);if(textOnly)assert(h.run('r.out.frozenTextOnly'));else assert.deepEqual(h.json('r.out.turns'),baseline.turns);assert.deepEqual(state(h),before)}
});
