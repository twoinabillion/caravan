const path=require('node:path');
const {setup:base,root}=require('../../../cycle15/story/repair/setup.cjs');
const frozen=path.join(root,'qa-artifacts/qa-cycle-20261026/cycle24/source');
function setup(source=root){
 const h=base(source);
 h.run('Date=class extends Date {static now(){return 1793014000000;}};G.save();G.load();G.save();');
 h.run(`globalThis.entryTurns=e=>buildStoryTurns(S.pendingPresentation?.eventId===e.id?S.pendingPresentation.text:prose(e.text),e,{turnSpeakers:e.turnSpeakers});
 globalThis.resultTurns=(e,r,known)=>Array.isArray(r.out.turns)&&r.out.turns.length?r.out.turns:buildStoryTurns(prose(r.out.text),e,{knownSpeaker:!!known,speakers:r.out.speakers,frozenTextOnly:!!r.out.frozenTextOnly,turnSpeakers:r.out.frozenTextOnly?[]:r.out.turnSpeakers});`);
 return h;
}
function open(h,echo){
 h.run(`S.pendingPresentation=null;S.party=['kangwoo','parkss'];S.food=30;S.water=30;S.scrap=40;S.at='miryang';S.driving=null;S.day=9;S.min=600;S.weather='storm';S._impactEcho=${JSON.stringify(echo)};G.save();G.load();globalThis.e=event('settlement_road_echo');G.beginPresentation(e);globalThis.et=entryTurns(e);G.capturePresentationView({eventId:e.id,phase:'event',turns:et,index:0});G.save();`);
 return h;
}
function choose(h,i){
 h.run(`globalThis.c=e.choices[${i}],r=G.resolvePresentedChoice(e,c);globalThis.rt=resultTurns(e,r,et?.knownSpeaker);G.capturePresentationView({eventId:e.id,phase:'outcome',turns:rt,index:0});G.save();`);
 return h.json('({ok:r.ok,applied:r.applied,text:r.out.text,chips:r.chips,turns:rt,frozenTextOnly:!!r.out.frozenTextOnly})');
}
function state(h){const value=h.json('S');delete value.pendingPresentation;return value;}
module.exports={setup,open,choose,state,root,frozen};
