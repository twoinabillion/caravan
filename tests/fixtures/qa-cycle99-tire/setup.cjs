const {setup,pay,state:oldState,root}=require('../qa-cycle55-story/setup.cjs');
const ids=['crisis_flat','crisis_glass','ev_nail_trap','ev_no_spare_tire'];
function fresh(id='ev_no_spare_tire',min=600,capture=true){
 const h=setup();
 h.run(`S.pendingPresentation=null;S.at='chungju';S.driving=null;S.day=9;S.min=${min};S.food=20;S.water=20;S.fuel=40;S.scrap=30;S.fatigue=35;S.van=90;S.items['부품']=3;S.party=['minji','kangwoo'];globalThis.e=event(${JSON.stringify(id)});G.beginPresentation(e);globalThis.entry=qaEntry(e),info=qaInfo(e,'event',[],entry);`);
 if(capture)h.run("G.capturePresentationView({eventId:e.id,phase:'event',turns:entry,...info,index:0})");return h;
}
const state=h=>({...oldState(h),...h.json('({at:S.at,driving:S.driving,km:S.stats.km})')});
module.exports={setup,fresh,pay,state,root,ids};
