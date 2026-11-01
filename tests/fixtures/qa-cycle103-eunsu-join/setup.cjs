const {setup,pay,state,root}=require('../qa-cycle97-family-postman/setup.cjs');
function render(h){h.run("globalThis.entry=qaEntry(e),info=qaInfo(e,'event',[],entry)")}
function fresh(approach,min=600,capture=false){const h=setup();h.run(`S.pendingPresentation=null;S.at='cheonan';S.day=7;S.min=${min};S.party=['parkss'];S.driving=null;S.food=12;S.water=20;S.fuel=40;S.scrap=30;S.fatigue=35;S.hunger=0;S.recruitQ={id:'eunsu',stage:'ready',choice:${JSON.stringify(approach)}};globalThis.e=event('rq_eunsu_join');G.beginPresentation(e);`);render(h);if(capture)h.run("G.capturePresentationView({eventId:e.id,phase:'event',turns:entry,...info,index:0})");return h;}
module.exports={setup,pay,state,root,fresh,render};
