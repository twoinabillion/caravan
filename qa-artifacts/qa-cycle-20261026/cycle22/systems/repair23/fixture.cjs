'use strict';
const fs=require('node:fs'),path=require('node:path'),{setup}=require('./setup.cjs');
const reader=require('../../../cycle12/story/reader-runtime.cjs');
const entryFile=path.resolve(__dirname,'../player02/attempt01/entry-443-npc_deokgu_2-export.json');
exports.load=({frozen=false,party=null,youngMan=false}={})=>{
 const h=setup(frozen);h.run('(()=>{'+reader.code()+'})()');
 if(!h.run(`G.load(${JSON.stringify(fs.readFileSync(entryFile,'utf8'))})`))throw Error('normal entry load');
 // Natural entry is untouched for the default fixture. Explicit party/flag cases
 // are isolated, cohort-excluded boundaries, never fresh journey evidence.
 if(party!==null)h.run(`S.party=${JSON.stringify(party)}`);
 if(youngMan)h.run('S.flags.sundeok_son=true');
 h.run("globalThis.e=event('npc_deokgu_2');globalThis.entry=qaEntry(e)");
 return h;
};
exports.state=h=>h.json('({day:S.day,min:S.min,food:S.food,water:S.water,fuel:S.fuel,scrap:S.scrap,items:S.items,van:S.van,fatigue:S.fatigue,flags:S.flags,notes:S.notes,comps:S.comps,quest:S.quest,party:S.party})');
