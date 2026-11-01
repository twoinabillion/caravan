const {setup,pay,state,root}=require('../qa-cycle97-family-postman/setup.cjs');
const fs=require('fs'),path=require('path');
const cases=[{id:'parkss_bag',met:false},{id:'parkss_bag',met:true},{id:'meet_postman',met:false}];
function fresh(id,min=600,capture=true,met=true){const h=setup(),file=path.join(__dirname,'actual98-'+id+'-entry.json');h.run(`G.load(${JSON.stringify(fs.readFileSync(file,'utf8'))});S.pendingPresentation=null;S.day=9;S.min=${min};S.flags.pss_met=${met};globalThis.e=event(${JSON.stringify(id)});G.beginPresentation(e);globalThis.entry=qaEntry(e),info=qaInfo(e,'event',[],entry);`);if(capture)h.run("G.capturePresentationView({eventId:e.id,phase:'event',turns:entry,...info,index:0})");return h;}
module.exports={setup,pay,state,root,fresh,cases};
