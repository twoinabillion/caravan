'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module');
const root=path.resolve(__dirname,'../../../../..');
const original=path.join(root,'qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
function setup(frozen=false){
 let source=fs.readFileSync(original,'utf8');
 const snapshot=path.join(root,'qa-artifacts/qa-cycle-20261026/cycle19/source');
 if(frozen)source=source.replace("fs.readFileSync(path.join(root,p),'utf8')","fs.readFileSync(path.join("+JSON.stringify(snapshot)+",p),'utf8')").replace("path.join(root,'src/07-ui.js')","path.join("+JSON.stringify(snapshot)+",'src/07-ui.js')").replace("path.join(root,'src/07d-ui-quests.js')","path.join("+JSON.stringify(snapshot)+",'src/07d-ui-quests.js')");
 const mod={exports:{}};
 vm.runInNewContext(source,{require:createRequire(original),module:mod,exports:mod.exports,__dirname:path.dirname(original),console,URLSearchParams});
 const h=mod.exports.setup(),read=h.json;
 h.json=expression=>JSON.parse(JSON.stringify(read(expression)));
 return h;
}
const normalEntry=fs.readFileSync(path.join(__dirname,'../attempt01/entry-166-ev_waterpark-export.json'),'utf8');
function fixture(frozen=false,party=null,guest=null){
 const h=setup(frozen);h.run(`G.load(${JSON.stringify(normalEntry)});`);
 if(party)h.run(`S.party=${JSON.stringify(party)};S.recruitQ=${JSON.stringify(guest)};S.pendingPresentation=null;`);
 h.run(`globalThis.e=G.presentationEvent('ev_waterpark');if(!S.pendingPresentation)G.beginPresentation(e);globalThis.entryTurns=buildStoryTurns(S.pendingPresentation.text,e,{turnSpeakers:e.turnSpeakers});globalThis.knownSpeaker=!!entryTurns.knownSpeaker;G.capturePresentationView({eventId:e.id,phase:'event',turns:entryTurns,knownSpeaker,index:0});`);
 return h;
}
function reader(h,i){
 h.run(`globalThis.turns=Array.isArray(r.out.turns)&&r.out.turns.length?r.out.turns:buildStoryTurns(r.out.text,e,{knownSpeaker:!!knownSpeaker,speakers:r.out.speakers,frozenTextOnly:!!r.out.frozenTextOnly,turnSpeakers:r.out.frozenTextOnly?[]:D.finaleSpeakers(e.id,${i},S)||r.out.turnSpeakers})`);
 return h.json('turns');
}
module.exports={setup,fixture,reader,normalEntry,root};
