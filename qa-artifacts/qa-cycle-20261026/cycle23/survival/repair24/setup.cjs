'use strict';
const fs=require('node:fs'),path=require('node:path');
const {setup:base,root}=require('../../../cycle15/story/repair/setup.cjs');
const frozen=path.join(root,'qa-artifacts/qa-cycle-20261026/cycle23/source');
const natural=path.join(__dirname,'../attempt01/entry-483-ev_eunsu_solo-export.json');
function setup(source=root){
 const h=base(source);
 h.run(`globalThis.entryTurns=e=>buildStoryTurns(S.pendingPresentation?.eventId===e.id?S.pendingPresentation.text:prose(e.text),e,{turnSpeakers:e.turnSpeakers});
 globalThis.resultTurns=(e,r,known)=>Array.isArray(r.out.turns)&&r.out.turns.length?r.out.turns:buildStoryTurns(prose(r.out.text),e,{knownSpeaker:!!known,speakers:r.out.speakers,frozenTextOnly:!!r.out.frozenTextOnly,turnSpeakers:r.out.frozenTextOnly?[]:r.out.turnSpeakers});`);
 return h;
}
function open(h,id,water=1,party=['minji','parkss']){
 if(id==='ev_eunsu_solo')h.run(`G.load(${JSON.stringify(fs.readFileSync(natural,'utf8'))})`);
 else h.run(`S.pendingPresentation=null;S.party=${JSON.stringify(party)};S.water=${water};S.at='jeonju';S.driving=null;S.day=11;S.min=390;`);
 h.run(`globalThis.e=event(${JSON.stringify(id)});G.beginPresentation(e);globalThis.et=entryTurns(e);G.capturePresentationView({eventId:e.id,phase:'event',turns:et,index:0});G.save();G.load();globalThis.e=event(${JSON.stringify(id)});globalThis.et=entryTurns(e);`);
 return h;
}
function choose(h,ci){
 h.run(`globalThis.c=e.choices[${ci}];globalThis.r=G.resolvePresentedChoice(e,c);globalThis.rt=resultTurns(e,r,et.knownSpeaker);G.capturePresentationView({eventId:e.id,phase:'outcome',turns:rt,index:0});`);
 return h.json('({ok:r.ok,applied:r.applied,text:r.out.text,chips:r.chips,turns:rt})');
}
const state=h=>h.json('({day:S.day,min:S.min,food:S.food,water:S.water,fuel:S.fuel,scrap:S.scrap,van:S.van,fatigue:S.fatigue,items:S.items,flags:S.flags,notes:S.notes,party:S.party,comps:S.comps,driving:S.driving,used:S.used})');
module.exports={setup,open,choose,state,root,frozen};
