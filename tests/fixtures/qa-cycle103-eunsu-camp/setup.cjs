const {setup,pay,state,root}=require('../qa-cycle97-family-postman/setup.cjs');
const fs=require('fs'),path=require('path');
const seed=JSON.parse(fs.readFileSync(path.join(root,'qa-artifacts/qa-cycle-20261026/cycle102/story/agent101/attempt01/scene-camp_5_eunsu-entry-317.json')));
function render(h){h.run("globalThis.e=G.campConversationEvent(),entry=qaEntry(e),info=qaInfo(e,'event',[],entry)")}
function fresh(prev,facts,wait,min=600,legacy=false){const h=setup();h.run(`G.load(${JSON.stringify(JSON.stringify(seed))});S.pendingPresentation=null;S.campConversation=null;S.campNight=103;S.day=7;S.min=${min};S.party=['eunsu'];S.recruitQ=null;S.food=12;S.water=20;S.fuel=40;S.scrap=30;S.fatigue=35;S.hunger=0;S._campPlan={};S.campMemories.eunsu=${JSON.stringify(prev?{choiceId:prev,choiceVisits:{facts,wait},visits:facts+wait}:null)};G.prepareCamp('talk','eunsu');`);if(legacy)h.run('delete S.campConversation.sceneContext');render(h);return h;}
module.exports={setup,pay,state,root,fresh,render};
