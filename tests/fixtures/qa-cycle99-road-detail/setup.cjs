const {setup,pay,state,root}=require('../qa-cycle55-story/setup.cjs');
const ids=['cleaners_recall','find_filmset'];
function fresh(id,min=600,capture=true){
 const h=setup();h.run(`S.pendingPresentation=null;S.at='cheonan';S.driving=null;S.day=9;S.min=${min};S.food=20;S.water=20;S.fuel=40;S.scrap=30;S.fatigue=10;S.hunger=0;S.van=90;S.party=[];S.recruitQ=null;globalThis.e=event(${JSON.stringify(id)});if(!e)throw Error('event missing');G.beginPresentation(e);globalThis.entry=qaEntry(e),info=qaInfo(e,'event',[],entry);`);
 if(capture)h.run("G.capturePresentationView({eventId:e.id,phase:'event',turns:entry,knownSpeaker:!!entry.knownSpeaker,...info,index:0})");return h;
}
module.exports={setup,pay,state,root,ids,fresh};
