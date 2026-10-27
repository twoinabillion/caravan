'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {setup}=require('../../../cycle15/story/repair/setup.cjs');
const helper=require('../../../cycle12/story/reader-runtime.cjs');
const dir=__dirname,source=path.resolve(dir,'../../source');
const cases=[['loc_tunnelbook','attempt01',286],['ev_parkss_past','attempt01',389],['ev_atm_cash','attempt02',369],['comp_snore','attempt02',444],['talk_es_01','attempt02',524]];
const state='({day:S.day,min:S.min,at:S.at,driving:S.driving,food:S.food,water:S.water,fuel:S.fuel,scrap:S.scrap,van:S.van,fatigue:S.fatigue,flags:S.flags,notes:S.notes,comps:S.comps,items:S.items,stats:S.stats,used:S.used})';
function init(id,sourceRoot,party){const h=setup(sourceRoot);h.run('(()=>{'+helper.code()+'})()');const c=cases.find(c=>c[0]===id),save=JSON.parse(fs.readFileSync(path.resolve(dir,`../agent03/${c[1]}/normal-unpaid-${c[2]}-${id}.json`)));assert(h.run('G.load('+JSON.stringify(JSON.stringify(save))+')'));h.run(`globalThis.e=event('${id}');`);if(party)h.run(`S.party=${JSON.stringify(party)};`);return h;}
function pay(h,ci){h.run(`globalThis.entry=qaEntry(e);globalThis.c=e.choices[${ci}];globalThis.r=G.resolvePresentedChoice(e,c);globalThis.turns=qaResult(e,c,r.out,{knownSpeaker:!!entry.knownSpeaker});`);assert(h.run('r.ok&&r.applied'));return h.json('qaNamed(turns)');}
function reload(h){const before=h.run('JSON.stringify('+state+')'),turns=h.json('qaNamed(turns)');h.run('G.capturePresentationView({eventId:e.id,phase:"outcome",turns,knownSpeaker:!!entry.knownSpeaker,index:0});G.save();G.load();globalThis.replay=G.resolvePresentedChoice(e,c);');assert.equal(h.run('replay.applied'),false);assert.equal(h.run('JSON.stringify('+state+')'),before);assert.deepEqual(h.json('qaNamed(qaResult(e,c,replay.out))'),turns);}
const encoded=(h,expr)=>JSON.parse(h.run('JSON.stringify('+expr+",(k,v)=>typeof v==='function'?{$function:v.toString()}:v)"));
module.exports={fs,path,assert,dir,source,cases,state,init,pay,reload,encoded};
