'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const H=require('./fixtures/qa-cycle103-eunsu-join/setup.cjs');
function start(){const h=H.setup();h.run(`S.pendingPresentation=null;S.driving=null;S.opening=null;S._crisis=null;S.combat=null;S.at='busan';globalThis.shown=[];UI.modalOpen=()=>false;UI.showEvent=e=>{shown.push(e.id);G.beginPresentation(e);};UI.syncTravelMemoryNotice=()=>{};`);return h;}
const state=h=>h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.fuel,S.scrap,S.stats.events,S.used,S.flags,S.memories])');
test('travel memory first offers an unread notice, without revealing knowledge or charging time/randomness',()=>{
 const h=start(),before=state(h),rng=h.run('S.rngState');h.run("G.openEventById('memory_busan_terminal')");
 assert.deepEqual(h.json('shown'),[]);assert.equal(state(h),before);assert.equal(h.run('S.rngState'),rng);
 assert.deepEqual(h.json('G.pendingTravelMemories().map(e=>e.id)'),['memory_busan_terminal']);
 assert.equal(h.run('S.pendingPresentation'),null);
 h.run("G.openEventById('memory_busan_terminal');G.scheduleJourneyBeat();G.save();G.load();");
 assert.equal(h.run('G.pendingTravelMemories().length'),1);assert.equal(h.run("G.beatReady(D.journeyBeats.find(b=>b.id==='memory_busan_terminal'))"),false);
});
test('later stays unread after reload and deliberate open hands off to the existing saved reader exactly once',()=>{
 const h=start();h.run("G.openEventById('memory_busan_terminal');G.deferTravelMemoryNotice();G.save();G.load()");
 assert.equal(h.run('S.travelMemoryInbox.quiet'),true);assert.equal(h.run('G.pendingTravelMemories().length'),1);
 const before=h.run('S.stats.events');assert.equal(h.run("G.openTravelMemory('memory_busan_terminal')"),true);
 assert.deepEqual(h.json('shown'),['memory_busan_terminal']);assert.equal(h.run('G.pendingTravelMemories().length'),0);
 assert.equal(h.run('S.stats.events'),before+1);assert.equal(h.run('S.pendingPresentation.phase'),'event');
 assert.equal(h.run("G.openTravelMemory('memory_busan_terminal')"),false);
 h.run('G.save();G.load();G.resumePresentation()');assert.equal(h.run('S.stats.events'),before+1);
 h.run("globalThis.e=G.presentationEvent('memory_busan_terminal');globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);");assert.equal(h.run('r.applied'),true);
 const balance=state(h);h.run('G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);');assert.equal(h.run('r.applied'),false);assert.equal(state(h),balance);
});
test('active historical readers resume directly and night-camp choices and emergencies never become optional memories',()=>{
 const h=start();h.run("globalThis.e=G.presentationEvent('memory_busan_terminal');G.beginPresentation(e);delete S.pendingPresentation.narrativeRevision;G.openEvent(e,{continuation:true})");
 assert.deepEqual(h.json('shown'),['memory_busan_terminal']);assert.equal(h.run('G.pendingTravelMemories().length'),0);
 for(const id of ['camp_thief','camp_dogs','camp_scan','camp_visitor','crisis_hungry']){
  const x=start();x.run(`G.openEventById(${JSON.stringify(id)})`);assert.equal(x.run('G.pendingTravelMemories().length'),0,id);
 }
});
test('opening memory during a present event, approach, combat or crisis cannot replace that owner',()=>{
 for(const code of ["S.pendingPresentation={version:1,eventId:'meet_postman',phase:'event'}","S.driving={approach:{}}","S.combat={}","S._crisis='crisis_hungry'","UI.modalOpen=()=>true"]){
  const h=start();h.run("G.openEventById('memory_busan_terminal');"+code);const before=h.run('JSON.stringify(S)');
  assert.equal(h.run("G.openTravelMemory('memory_busan_terminal')"),false);assert.equal(h.run('JSON.stringify(S)'),before);
 }
});
test('road discoveries announce a sensory cue while keeping emergencies immediate and memories away from the roadside renderer',()=>{
 const h=start();
 assert.equal(h.run("G.roadApproachProfile(G.presentationEvent('memory_busan_terminal'))"),null);
 const p=h.json("G.roadApproachProfile(G.presentationEvent('meet_postman'))");assert(p.duration>=4000);assert.match(p.label,/자전거/);assert.doesNotMatch(p.label,/보상|편지를.*받/);
 assert.equal(h.run("G.roadApproachProfile({id:'crisis_hungry',type:'위기'})"),null);
 const radio=h.json("G.roadApproachProfile(G.presentationEvent('story_doyun_family_update'))");assert.equal(radio.kind,'signal');assert.match(radio.label,/길가 단말/);
});
test('notice controls preserve later, open the real reader, and hide under competing screens',()=>{
 const h=start();
 h.run(`globalThis.nodes={};for(const key of ['cue','title','open','later'])nodes[key]={hidden:false,textContent:'',attrs:{},listeners:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,v){this.listeners[k]=v;},focus(){this.focused=true;}};
 globalThis.notice={hidden:true,dataset:{},querySelector(selector){return nodes[selector.match(/memory-(\\w+)/)[1]];}};
 document.documentElement={dataset:{}};document.getElementById=id=>id==='travel-memory-notice'?notice:null;
 document.addEventListener=()=>{};window.addEventListener=()=>{};
 globalThis.MutationObserver=class {observe(){}};
 G.openEventById('memory_busan_terminal');`);
 h.run(require('node:fs').readFileSync('src/07k-ui-travel-memory.js','utf8'));
 assert.equal(h.run('notice.hidden'),false);assert.match(h.run('nodes.title.textContent'),/터미널/);
 h.run('nodes.later.listeners.click()');assert.equal(h.run('notice.dataset.quiet'),'true');assert.equal(h.run('nodes.open.focused'),true);
 h.run('UI.modalOpen=()=>true;UI.syncTravelMemoryNotice()');assert.equal(h.run('notice.hidden'),true);
 h.run('UI.modalOpen=()=>false;UI.syncTravelMemoryNotice();nodes.open.listeners.click()');
 assert.deepEqual(h.json('shown'),['memory_busan_terminal']);assert.equal(h.run('notice.hidden'),true);
});
