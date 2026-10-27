'use strict';
const fs=require('node:fs'),{setup}=require('./setup.cjs');
const reader=require('../../../cycle12/story/reader-runtime.cjs');
exports.old='그날 저녁 통조림 비빔밥에 참기름 한 바퀴가 둘렸다. 전원이 국적을 되찾은 표정을 지었다.';
exports.next='다음 식사 때 통조림 비빔밥에 참기름 한 바퀴를 두를 생각에, 전원이 국적을 되찾은 표정을 지었다.';
exports.load=({frozen=false,minute=360,party=['minji'],at='miryang'}={})=>{
 const h=setup(frozen);h.run('(()=>{'+reader.code()+'})()');
 // Isolated static-derived boundary fixtures, not a natural journey or retry.
 h.run(`S.at=${JSON.stringify(at)};S.driving=null;S.party=${JSON.stringify(party)};S.day=5;S.min=${minute};S.food=4;S.water=8;S.scrap=10;S.comps.minji.mood=40;G.save();G.load();globalThis.e=event('exp_oilmill');globalThis.available=G.eventAvailable(e,{mode:'local'});G.beginPresentation(e);globalThis.entry=qaEntry(e);G.capturePresentationView({eventId:e.id,phase:'event',turns:entry,knownSpeaker:!!entry.knownSpeaker,index:0})`);
 return h;
};
exports.state=h=>h.json('({day:S.day,min:S.min,at:S.at,food:S.food,water:S.water,fuel:S.fuel,scrap:S.scrap,items:S.items,van:S.van,fatigue:S.fatigue,flags:S.flags,notes:S.notes,comps:S.comps,quest:S.quest,party:S.party})');
if(require.main===module){
 const baseline=exports.load({frozen:true}),before={cohortExcluded:true,classification:'static-derived temporal assertion; not natural22',event:baseline.json('e'),entry:baseline.json('qaNamed(entry)'),out:{},legacy:[]};
 for(const ci of [0,1]){
  const h=exports.load({frozen:true});h.run(`globalThis.c=e.choices[${ci}];globalThis.o=c.out[0]`);before.out[ci]=h.json('qaNamed(qaResult(e,c,o,{knownSpeaker:entry.knownSpeaker}))');
  h.run('globalThis.r=G.resolvePresentedChoice(e,c);if(!r.ok||!r.applied)throw Error("resolution");globalThis.turns=qaResult(e,c,r.out,{knownSpeaker:entry.knownSpeaker});G.capturePresentationView({eventId:e.id,phase:"outcome",turns,knownSpeaker:!!entry.knownSpeaker,index:0});G.save();G.load()');
  const file=`legacy-exp_oilmill-${ci}.json`;fs.writeFileSync(__dirname+'/'+file,h.run('G.exportSave()'));const row={choice:ci,file,text:h.run('r.out.text'),result:h.json('qaNamed(turns)')};
  const raw=JSON.parse(h.run('G.exportSave()'));delete raw.pendingPresentation.view;delete raw.pendingPresentation.reading;delete raw.pendingPresentation.authoredView;
  h.run(`G.load(${JSON.stringify(JSON.stringify(raw))});globalThis.again=G.resolvePresentedChoice(e,c)`);row.textOnly=h.json('qaNamed(qaResult(e,c,again.out))');before.legacy.push(row);
 }
 fs.writeFileSync(__dirname+'/oilmill-before.json',JSON.stringify(before,null,2)+'\n');
}
