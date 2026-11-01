const {setup,pay,state,root}=require('../qa-cycle55-story/setup.cjs');
const ids=['crisis_drowsy','crisis_hungry','crisis_collapse','crisis_collapse2','loc_jaeyi_cache'];
function fresh(id,min=600,capture=true){
 const h=setup();
 h.run(`S.pendingPresentation=null;S.at=${JSON.stringify(id==='loc_jaeyi_cache'?'jaeyi_cache':'gimcheon')};S.driving=null;S.day=9;S.min=${min};S.food=20;S.water=20;S.fuel=40;S.scrap=30;S.fatigue=70;S.hunger=2;S.van=90;S.party=['jaeyi'];S.flags.jaeyi_cache_opened=false;S.flags.jy_law=false;S.known.jaeyi_cache=true;globalThis.e=event(${JSON.stringify(id)});G.beginPresentation(e);globalThis.entry=qaEntry(e),info=qaInfo(e,'event',[],entry);`);
 if(capture)h.run("G.capturePresentationView({eventId:e.id,phase:'event',turns:entry,...info,index:0})");
 return h;
}
module.exports={setup,fresh,pay,state,root,ids};
