const {setup,pay,state,root}=require('../qa-cycle55-story/setup.cjs');
function fresh(min=600,capture=true){const h=setup();h.run(`S.pendingPresentation=null;S.at='chungju';S.driving=null;S.day=6;S.min=${min};S.food=20;S.water=20;S.fuel=40;S.scrap=30;S.fatigue=35;S.van=90;S.party=[];globalThis.e=event('exp_station');G.beginPresentation(e);globalThis.entry=qaEntry(e),info=qaInfo(e,'event',[],entry);`);if(capture)h.run("G.capturePresentationView({eventId:e.id,phase:'event',turns:entry,...info,index:0})");return h;}
module.exports={setup,pay,state,root,fresh};
