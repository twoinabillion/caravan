'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const H=require('./fixtures/qa-cycle103-eunsu-join/setup.cjs');
function start(){const h=H.setup();h.run(`S.pendingPresentation=null;S.driving=null;S.opening=null;S._crisis=null;S.combat=null;S.at='busan';globalThis.shown=[];UI.modalOpen=()=>false;UI.showEvent=e=>{shown.push(e.id);G.beginPresentation(e);};UI.syncTravelMemoryNotice=()=>{};`);return h;}
const state=h=>h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.fuel,S.scrap,S.stats.events,S.used,S.flags,S.memories])');
test('travel memory first offers an unread notice, without revealing knowledge or charging time/randomness',()=>{
 const h=start(),before=state(h);h.run("rng=()=>{throw Error('offering a memory must not sample gameplay randomness')};G.openEventById('memory_busan_terminal')");
 assert.deepEqual(h.json('shown'),[]);assert.equal(state(h),before);
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

function addMemories(h,count){h.run(`globalThis.testMemories=[];for(let n=0;n<${count};n++){const event={id:'qa_memory_'+n,type:'스토리',once:true,noPool:1,roadApproach:false,title:'기억 '+n,travelMemory:{title:'기억 '+n,cue:'그날의 기억'},storyOrigin:{kind:'memory',title:'그때의 일'},text:'그날을 떠올렸다.',choices:[{label:'기억해 둔다',out:[{p:1,text:'수첩을 덮었다.',fx:{flag:'qa_memory_read_'+n}}]}]};D.events.push(event);testMemories.push(event);}`);}
test('many pending memories survive offer, defer and reload without a sixteen-item cutoff',()=>{
 const h=start();addMemories(h,24);const before=state(h);h.run('for(const e of testMemories)G.offerTravelMemory(e);G.deferTravelMemoryNotice();G.save();G.load();');
 assert.equal(h.run('G.pendingTravelMemories().length'),24);
 assert.deepEqual(h.json('G.pendingTravelMemories().map(e=>e.id)'),Array.from({length:24},(_,i)=>'qa_memory_'+i));
 assert.equal(state(h),before,'offering a backlog does not acquire knowledge or spend resources');assert.deepEqual(h.json('shown'),[]);
});
test('a fresh memory preserves an explicitly quiet existing backlog instead of reopening the notice',()=>{
 const h=start();addMemories(h,3);h.run('G.offerTravelMemory(testMemories[0]);G.deferTravelMemoryNotice();G.offerTravelMemory(testMemories[1]);G.offerTravelMemory(testMemories[2]);');
 assert.equal(h.run('S.travelMemoryInbox.quiet'),true);assert.equal(h.run('G.pendingTravelMemories().length'),3);assert.deepEqual(h.json('shown'),[]);
});
test('memories offered behind a current event or native dialog wait quietly after that activity',()=>{
 for(const code of ["G.beginPresentation(G.presentationEvent('meet_postman'))","UI.modalOpen=()=>true"]){
  const h=start();addMemories(h,2);h.run(code+';G.offerTravelMemory(testMemories[0]);G.offerTravelMemory(testMemories[1]);');
  assert.equal(h.run('S.travelMemoryInbox.quiet'),true);assert.deepEqual(h.json('shown'),[]);
 }
});
test('bad saved ids and duplicates cannot crowd valid memories out of the backlog',()=>{
 const h=start();addMemories(h,20);h.run("S.travelMemoryInbox={version:1,quiet:true,ids:[...Array(20).fill('missing'),null,{},...testMemories.flatMap(e=>[e.id,e.id])]};G.save();G.load();");
 assert.equal(h.run('G.pendingTravelMemories().length'),20);assert.equal(h.run('G.pendingTravelMemories()[0].id'),'qa_memory_0');
});
test('choosing a later memory opens just that reader; completing it never auto-opens the next',()=>{
 const h=start();addMemories(h,4);h.run('for(const e of testMemories)G.offerTravelMemory(e);G.deferTravelMemoryNotice();');
 assert.equal(h.run("G.openTravelMemory('qa_memory_2')"),true);assert.deepEqual(h.json('shown'),['qa_memory_2']);
 h.run("globalThis.e=G.presentationEvent('qa_memory_2');G.resolvePresentedChoice(e,e.choices[0]);G.queuePresentation();");
 assert.deepEqual(h.json('shown'),['qa_memory_2']);assert.deepEqual(h.json('G.pendingTravelMemories().map(e=>e.id)'),['qa_memory_0','qa_memory_1','qa_memory_3']);
 assert.equal(h.run('S.travelMemoryInbox.quiet'),true);assert.equal(h.run('S.flags.qa_memory_read_2'),true);
});

function interfaceFixture(count=4){
 const h=start();addMemories(h,count);
 h.run(`class MemoryNode{
  constructor(){this.hidden=false;this.open=false;this._text='';this.writes=0;this.attrs={};this.dataset={};this.children=[];this.listeners={};this.isConnected=true;this.classList={on:false,contains(){return this.on;}};}
  get textContent(){return this._text;}set textContent(value){this.writes++;this._text=value;}
  setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k]??null;}
  addEventListener(k,v){this.listeners[k]=v;}focus(){this.focused=true;}
  append(...items){this.children.push(...items);}replaceChildren(...items){this.children=[...items];}
  showModal(){this.open=true;}close(){this.open=false;this.listeners.close?.();}
  getBoundingClientRect(){return {left:10,right:300,top:10,bottom:500};}
 }
 globalThis.dom={};for(const key of ['host','cue','title','open','later','dialog','list','count','close','back','app'])dom[key]=new MemoryNode();dom.app.dataset.screen='game';dom.host.hidden=true;
 const parts={'[data-memory-cue]':dom.cue,'[data-memory-title]':dom.title,'[data-memory-open]':dom.open,'[data-memory-later]':dom.later};
 dom.host.querySelector=s=>parts[s];dom.dialog.querySelector=s=>s==='[data-memory-list]'?dom.list:s==='[data-memory-list-count]'?dom.count:dom.close;
 dom.dialog.querySelectorAll=()=>[dom.close,dom.back];
 globalThis.byId={'travel-memory-notice':dom.host,'travel-memory-dialog':dom.dialog,app:dom.app};
 document.documentElement={dataset:{}};document.getElementById=id=>byId[id]||null;document.createElement=()=>new MemoryNode();document.addEventListener=()=>{};document.hidden=false;
 window.handlers={};window.addEventListener=(name,fn)=>{window.handlers[name]=fn;};globalThis.MutationObserver=class{observe(){}};
 globalThis.screen='game';globalThis.$=selector=>byId[selector.slice(1)]||(byId[selector.slice(1)]=new MemoryNode());
 for(const e of testMemories)G.offerTravelMemory(e);`);
 const ui=require('node:fs').readFileSync('src/07-ui.js','utf8');
 const modal=ui.match(/  const modalOpen = ([\s\S]*?);\n\n  \/\* ── screens/)[1];h.run('UI.modalOpen='+modal+';');
 h.run(require('node:fs').readFileSync('src/07k-ui-travel-memory.js','utf8'));return h;
}
test('a backlog button opens a complete scrollable choice list and selecting a later row opens only that memory',()=>{
 const h=interfaceFixture(24),before=state(h);h.run('dom.open.listeners.click()');
 assert.equal(h.run('dom.dialog.open'),true);assert.equal(h.run('dom.list.children.length'),24);assert.equal(state(h),before);
 assert.equal(h.run('UI.modalOpen()'),true,'native memory list belongs to the real pause owner');
 h.run('dom.list.children[17].listeners.click()');
 assert.equal(h.run('dom.dialog.open'),false);assert.deepEqual(h.json('shown'),['qa_memory_17']);assert.equal(h.run('G.pendingTravelMemories().length'),23);
});
test('closing the list leaves every memory unread and its native modal pauses actual driving',()=>{
 const h=interfaceFixture();h.run('dom.open.listeners.click();S.driving={from:"busan",to:"yangsan",road:"high",dist:20,gone:0,slots:[],si:0};');
 const before=h.run('JSON.stringify(S)');h.run('G.tick(30)');assert.equal(h.run('JSON.stringify(S)'),before);
 h.run('dom.close.listeners.click()');assert.equal(h.run('dom.dialog.open'),false);assert.equal(h.run('G.pendingTravelMemories().length'),4);assert.deepEqual(h.json('shown'),[]);
});
test('routine renders do not repeatedly announce the same memory and an interruption folds its notice',()=>{
 const h=interfaceFixture(1),writes=h.run('dom.title.writes+dom.cue.writes+dom.open.writes');h.run('for(let n=0;n<40;n++)UI.syncTravelMemoryNotice()');assert.equal(h.run('dom.title.writes+dom.cue.writes+dom.open.writes'),writes);
 h.run("$('#ev-wrap').classList.on=true;UI.syncTravelMemoryNotice();$('#ev-wrap').classList.on=false;UI.syncTravelMemoryNotice()");
 assert.equal(h.run('S.travelMemoryInbox.quiet'),true);assert.equal(h.run('dom.host.hidden'),false);assert.equal(h.run('dom.host.dataset.quiet'),'true');
});
test('leaving gameplay closes its memory list without consuming or focusing a hidden entry control',()=>{
 const h=interfaceFixture();h.run("dom.open.listeners.click();dom.open.focused=false;screen='title';dom.app.dataset.screen='title';window.handlers.caravanscreenchange()");
 assert.equal(h.run('dom.dialog.open'),false);assert.equal(h.run('dom.open.focused'),false);assert.equal(h.run('G.pendingTravelMemories().length'),4);
});
test('a height-constrained memory list scrolls without shrinking row content outside its button',()=>{
 const fs=require('node:fs'),postcss=require('postcss'),sheet=fs.readFileSync('src/01-style.html','utf8');
 const css=postcss.parse([...sheet.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n'));
 const rules=selector=>{const values={};css.walkRules(rule=>{if(rule.selector===selector)rule.walkDecls(decl=>values[decl.prop]=decl.value);});return values;};
 const list=rules('#travel-memory-dialog [data-memory-list]'),row=rules('#travel-memory-dialog [data-memory-list]>button');
 assert.equal(list['overflow-y'],'auto');assert.equal(list['min-height'],'0');
 const fixedFlex=list.display==='flex'&&list['flex-direction']==='column'&&row.flex==='0 0 auto';
 const intrinsicGrid=list.display==='grid'&&list['grid-auto-rows']==='max-content';
 assert(fixedFlex||intrinsicGrid,'constrained rows must retain intrinsic content height');
});
