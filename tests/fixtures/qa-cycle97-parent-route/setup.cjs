const {setup,pay,state,root}=require('../qa-cycle55-story/setup.cjs');
const ids=['story_bridge_parent_route','story_parent_route_shared','story_parent_route_guarded','main_recovery_story_parent_route_shared','main_recovery_story_parent_route_guarded'];
function fresh(id,min=600,capture=true,opt={}){
 const h=setup();h.run(`S.pendingPresentation=null;S.at='suwon';S.driving=null;S.day=9;S.min=${min};S.food=20;S.water=20;S.fuel=40;S.scrap=30;S.fatigue=10;S.hunger=0;S.van=90;S.party=${JSON.stringify(opt.party||[])};S.recruitQ=null;S.flags.parent_key_located=true;S.flags.parent_key_found=${id==='story_bridge_parent_route'};S.items['부모님의 검증키']=${id==='story_bridge_parent_route'?1:0};S.flags.parent_cache_shared=true;S.flags.parent_cache_guarded=true;S.flags.parents_split_known=${!!opt.split};S.flags.parents_routes_traced=${!!opt.split};S.flags.mother_reunited=${!!opt.mother};globalThis.e=event(${JSON.stringify(id)});if(!e)throw Error('event missing');G.beginPresentation(e);globalThis.entry=qaEntry(e),info=qaInfo(e,'event',[],entry);`);
 if(capture)h.run("G.capturePresentationView({eventId:e.id,phase:'event',turns:entry,knownSpeaker:!!entry.knownSpeaker,...info,index:0})");return h;
}
module.exports={setup,pay,state,root,ids,fresh};
