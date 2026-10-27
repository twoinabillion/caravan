'use strict';
const fs=require('node:fs'),path=require('node:path'),{setup}=require('./setup.cjs');
const reader=require('../../../cycle12/story/reader-runtime.cjs');
const seeds={signal_bait:'entry-239-signal_bait-export.json',crisis_nofuel:'entry-69-crisis_nofuel-export.json',crisis_nofuel2:'entry-69-crisis_nofuel-export.json'};
exports.load=(id,{frozen=false,party=['eunsu','parkss']}={})=>{
 const h=setup(frozen);h.run('(()=>{'+reader.code()+'})()');
 const raw=fs.readFileSync(path.resolve(__dirname,'../player02/attempt01',seeds[id]),'utf8');
 if(!h.run(`G.load(${JSON.stringify(raw)})`))throw Error('fixture load');
 // Isolated boundary fixture. The source natural entry is never overwritten.
 // Explicit resources/crew permit every authored branch; no journey is counted.
 h.run(`S.party=${JSON.stringify(party)};S.pendingPresentation=null;S.driving=null;S.at='daejeon';S.day=20;S.min=600;S.food=24;S.water=28;S.fuel=30;S.scrap=90;S.hunger=0;S.thirst=0;S.flags.radio_fixed=true;globalThis.e=event('${id}');G.beginPresentation(e);globalThis.entry=qaEntry(e);G.capturePresentationView({eventId:e.id,phase:'event',turns:entry,knownSpeaker:!!entry.knownSpeaker,index:0});G.save();G.load();`);
 return h;
};
exports.state=h=>h.json('({day:S.day,min:S.min,food:S.food,water:S.water,fuel:S.fuel,scrap:S.scrap,items:S.items,van:S.van,fatigue:S.fatigue,flags:S.flags,notes:S.notes,comps:S.comps,quest:S.quest})');
exports.ids=Object.keys(seeds);
