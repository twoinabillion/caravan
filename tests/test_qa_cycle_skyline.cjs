const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const normalPath=path.resolve(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle6/systems/player02/attempt02/entry-578-vg_seoulline-export.json');
function fixture(){
 const h=setup();
 h.run("S.party=['leo','parkss'];S.flags={};S.used=[];S.notes=[];S.day=54;S.min=831;S.stats.km=4277.6;globalThis.e=event('vg_seoulline');globalThis.shown=[];UI.showEvent=ev=>{shown.push(ev.id);G.beginPresentation(ev);};");
 return h;
}
function road(h,gone=4){h.run(`S.at=null;S.driving={from:'suwon',to:'seoul',dist:34,gone:${gone}};`);}
function resources(h){return h.run('JSON.stringify([S.day,S.min,S.fuel,S.food,S.water,S.scrap,S.items,S.flags,S.notes,S.comps])');}
test('normal Daejeon–Sejong checkpoint cannot draw a Seoul skyline despite 4277km travelled',()=>{
 const h=fixture();assert(h.run(`G.load(${JSON.stringify(fs.readFileSync(normalPath,'utf8'))})`));
 assert.equal(h.run('S.driving.from'),'daejeon');assert.equal(h.run('S.driving.to'),'sejong');
 assert(h.run('G.remainKm()>150'));h.run("S.used=S.used.filter(id=>id!==e.id)");
 assert.equal(h.run('G.eventAvailable(e)'),false);assert.equal(h.run('G.eligible().some(ev=>ev.id===e.id)'),false);
});
test('actual remaining road distance opens at 30km, and paid sighting is not Seoul arrival',()=>{
 const h=fixture();road(h,3);assert.equal(h.run('G.remainKm()'),31);assert.equal(h.run('G.eventAvailable(e)'),false);
 road(h,4);assert.equal(h.run('G.remainKm()'),30);assert.equal(h.run('G.eventAvailable(e)'),true);
 h.run('G.openEvent(e,{continuation:true});G.save();G.load();G.resumePresentation()');
 assert.equal(h.run('S.pendingPresentation.phase'),'event');assert.equal(h.run('S.used.filter(id=>id===e.id).length'),1);
 const before=h.run('S.comps.leo.mood');h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);G.save();G.load()');
 assert(h.run('r.applied'));assert(h.run('S.flags.seoul_seen'));assert.equal(h.run('!!S.flags.seoul_open'),false);
 assert.equal(h.run('S.comps.leo.mood'),Math.min(100,before+3));assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[0]).applied'),false);
});
test('unpaid normal legacy entry defers on Continue and can be encountered near Seoul later',()=>{
 const h=fixture();assert(h.run(`G.load(${JSON.stringify(fs.readFileSync(normalPath,'utf8'))})`));
 const before=resources(h);assert.equal(h.run('G.resumePresentation()'),false);
 assert.equal(h.run('shown.length'),0);assert.equal(h.run('S.pendingPresentation'),null);assert.equal(h.run('S.used.includes(e.id)'),false);assert.equal(resources(h),before);
 h.run('G.save();G.load()');road(h,4);assert.equal(h.run('G.eventAvailable(e)'),true);
 h.run('G.openEvent(e,{continuation:true})');assert.equal(h.run('shown.at(-1)'),'vg_seoulline');
});
test('unpaid transition and explicit stale opening defer without consuming skyline availability',()=>{
 const h=fixture();h.run("S.at='sejong';S.driving=null;S.used=[e.id];S.pendingPresentation={version:1,eventId:e.id,phase:'transition'};G.save();G.load();");
 assert.equal(h.run('G.resumePresentation()'),false);assert.equal(h.run('S.pendingPresentation'),null);assert.equal(h.run('S.used.includes(e.id)'),false);assert.equal(h.run('shown.length'),0);
 h.run("G.openEventById(e.id)");assert.equal(h.run('shown.length'),0);assert.equal(h.run('S.used.includes(e.id)'),false);
 h.run('G.queuePresentation(e.id)');assert.equal(h.run('S.pendingPresentation'),null);
 road(h,4);assert.equal(h.run('G.eventAvailable(e)'),true);
});
test('historical paid skyline outside the new range retains text, notes, cursor and payment',()=>{
 const h=fixture();h.run("S.at='sejong';S.driving=null;S.used=[e.id];S.flags.seoul_seen=true;S.notes=[{title:'처음 본 스카이라인',body:'예전에 읽은 기록'}];S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:0,outcomeIndex:0,text:'예전에 본 서울',chips:[],view:{turns:[{kind:'narration',text:'예전에 본 서울'}],index:0}};G.save();G.load();");
 const before=resources(h);assert(h.run('G.resumePresentation()'));assert.equal(h.run('shown.at(-1)'),'vg_seoulline');
 assert.equal(h.run('S.pendingPresentation.view.turns[0].text'),'예전에 본 서울');h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');
 assert.equal(h.run('r.out.text'),'예전에 본 서울');assert.equal(h.run('r.applied'),false);assert.equal(resources(h),before);assert.equal(h.run('S.used.includes(e.id)'),true);assert.equal(h.run('!!S.flags.seoul_open'),false);
});
