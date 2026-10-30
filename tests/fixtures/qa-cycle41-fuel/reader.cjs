'use strict';
const fs=require('node:fs'),{setup,root}=require('./setup.cjs');
function init(id,min=600){
 const h=setup(),ui=fs.readFileSync(root+'/src/07-ui.js','utf8');
 h.run(ui.slice(ui.indexOf('  function eventSceneKeys('),ui.indexOf('  function sceneFormat('))+';globalThis.info=eventScenePresentation;');
 h.run(`S.party=[];S.day=4;S.min=${min};S.food=60;S.water=60;S.scrap=60;S.fuel=0;S.fatigue=15;S.at='miryang';S.driving=null;S.pendingPresentation=null;globalThis.e=event('${id}');G.beginPresentation(e);globalThis.et=buildStoryTurns(prose(e.text),e,{turnSpeakers:e.turnSpeakers}),ei=info(e,'event',[],et);G.capturePresentationView({eventId:e.id,phase:'event',turns:et,...ei,index:0});`);
 return h;
}
function pay(h,ci,oi){
 h.run(`G.pickOutcome=()=>e.choices[${ci}].out[${oi}];globalThis.r=G.resolvePresentedChoice(e,e.choices[${ci}]);if(!r.ok)throw Error(JSON.stringify(r));globalThis.rt=buildStoryTurns(r.out.text,e,{turnSpeakers:r.out.turnSpeakers}),ri=info(e,'outcome',[ei.sceneKeys[0]],rt);G.capturePresentationView({eventId:e.id,phase:'outcome',turns:rt,...ri,history:{eventId:e.id,phase:'event',turns:et,...ei,index:0},index:0});`);
 return h.json('({text:r.out.text,turns:rt,chips:r.chips,scene:ri})');
}
const state=h=>h.json('[S.food,S.water,S.fuel,S.scrap,S.min,S.day,S.fatigue,S.van,S.pursuit,S.flags,S.items,S.notes,S.comps]');
module.exports={init,pay,state};
