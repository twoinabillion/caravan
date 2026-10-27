const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle17/survival/repairs18-distance'),{setup,reader}=require(path.join(dir,'../repairs18-additional/runtime.cjs'));
const plain=x=>JSON.parse(JSON.stringify(x)),resources=h=>h.run('JSON.stringify([S.day,S.min,S.fuel,S.food,S.water,S.scrap,S.items,S.flags,S.notes,S.comps,S.stats])');
function fixture(file){const h=setup();if(file)assert(h.run('G.load('+JSON.stringify(fs.readFileSync(path.join(dir,file),'utf8'))+')'));h.run("globalThis.e=G.presentationEvent('ev_near_seoul_sign');globalThis.shown=[];UI.showEvent=ev=>{shown.push(ev.id);G.beginPresentation(ev);};");return h;}
function road(h,remaining){h.run(`S.at=null;S.driving={from:'suwon',to:'seoul',dist:34,gone:${34-remaining}};`);}
test('actual far northern node and road cannot advertise a one-digit Seoul distance',()=>{
 const h=fixture();h.run("S.at='yeongdong';S.driving=null;S.party=['minji'];S.used=[];S.stats.km=5000;");assert.equal(h.run('G.regionOf()'),'north');assert.equal(h.run('G.remainKm()'),208);assert.equal(h.run('G.eventLocation(e)'),null);assert.equal(h.run('G.eventAvailable(e)'),false);assert.equal(h.run('G.eligible().some(x=>x.id===e.id)'),false);
 for(const [n,allowed]of [[34,false],[10,false],[9.5,false],[9.01,true],[9,true],[8,true],[1,true]]){road(h,n);assert.equal(h.run('G.remainKm()'),Math.round(n));assert.equal(h.run('G.eventAvailable(e)'),allowed,String(n));}
});
test('new nine-kilometre entry can resolve once, reload and return to the road',()=>{
 const h=fixture();h.run("S.party=['minji'];S.food=20;S.water=24;S.used=[];");road(h,9);h.run('G.openEvent(e,{continuation:true});G.save();G.load();G.resumePresentation();');assert.equal(h.run('S.pendingPresentation.phase'),'event');assert.equal(h.run('S.used.filter(id=>id===e.id).length'),1);
 h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);');assert(h.run('r.ok&&r.applied'));const before=resources(h);h.run('G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);');assert.equal(h.run('r.applied'),false);assert.equal(resources(h),before);h.run('G.queuePresentation(null)');assert.equal(h.run('S.pendingPresentation'),null);assert.equal(h.run('G.resumePresentation()'),false);assert(h.run('!!S.driving'));
});
for(const phase of ['event','transition'])test('old unpaid '+phase+' defers and can be drawn at nine kilometres without borrowing skyline flags',()=>{
 for(const seen of [false,true]){const h=fixture('old-'+phase+'.json');h.run(`S.flags.seoul_seen=${seen};S.used.push('vg_seoulline');`);const before=resources(h);assert.equal(h.run('G.resumePresentation()'),false);assert.equal(h.run('shown.length'),0);assert.equal(h.run('S.pendingPresentation'),null);assert.equal(h.run('S.used.includes(e.id)'),false);assert(h.run("S.used.includes('vg_seoulline')"));assert.equal(resources(h),before);assert.equal(h.run('S.flags.seoul_seen'),seen);
  h.run('G.save();G.load()');road(h,9);assert.equal(h.run('G.eventAvailable(e)'),true);h.run('G.openEvent(e,{continuation:true})');assert.equal(h.run('shown.at(-1)'),h.run('e.id'));
 }
});
test('unpaid legacy entry already within nine kilometres remains readable and unconsumed',()=>{
 const h=fixture('old-event.json');road(h,9);const before=resources(h);assert(h.run('G.resumePresentation()'));assert.equal(h.run('S.pendingPresentation.phase'),'event');assert(h.run('S.used.includes(e.id)'));assert.equal(resources(h),before);
});
for(const textOnly of [false,true])test('both old paid choices outside range preserve '+(textOnly?'text-only':'reader')+' results, notes and payment',()=>{
 for(const i of [0,1]){const h=fixture('old-paid'+i+'.json');if(textOnly)h.run('S.pendingPresentation.reading=null;S.pendingPresentation.view=null;S.pendingPresentation.authoredView=null;G.save();G.load();');
  const saved=h.json('S.pendingPresentation'),before=resources(h);assert(h.run('G.remainKm()>9'));assert(h.run('G.resumePresentation()'));assert.equal(h.run('shown.at(-1)'),h.run('e.id'));assert.equal(h.run('S.pendingPresentation.text'),saved.text);
  h.run(`globalThis.knownSpeaker=false;globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}]);`);assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),saved.text);assert.equal(resources(h),before);assert(h.run('S.used.includes(e.id)'));
  if(!textOnly)assert.deepEqual(plain(reader(h,i)),plain(saved.reading.view.turns));else assert(h.run('r.out.frozenTextOnly'));
 }
});
test('a completed used marker without an unpaid receipt is not cleared by a stale far opening',()=>{
 const h=fixture('old-paid1.json');h.run('S.pendingPresentation=null;S._chain=null;');const before=resources(h);h.run('G.openEventById(e.id)');assert.equal(h.run('shown.length'),0);assert(h.run('S.used.includes(e.id)'));assert.equal(resources(h),before);road(h,9);assert.equal(h.run('G.eventAvailable(e)'),false);
});
test('the only event mechanics delta is the explicit maxRemain nine gate',()=>{
 const h=fixture(),old=require(path.join(dir,'event-before.json')),now=plain(h.json('JSON.parse(JSON.stringify(e,(k,v)=>typeof v==="function"?v.toString():v))'));assert.equal(now.maxRemain,9);delete now.maxRemain;assert.deepEqual(now,old);
});
