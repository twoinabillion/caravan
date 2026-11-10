/* Real notebook, back/pause owners and driving engine; isolated DOM, not visual QA. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup}=require('./fixtures/qa-cycle103-eunsu-join/setup.cjs');
const ui=fs.readFileSync('src/07-ui.js','utf8'),journal=fs.readFileSync('src/07d-ui-quests.js','utf8');
function fixture(withNotebook=true){
 const h=setup();
 h.run(`
 S.pendingPresentation=null;S.opening=null;S._crisis=null;S.combat=null;S.at=null;
 S.driving={from:'busan',to:'yangsan',road:'high',dist:20,gone:0,slots:[],si:0};
 globalThis.screen='game';globalThis.byId={};globalThis.menuOpens=0;
 for(const id of ['ev-wrap','arrival-scene','ovl-stl','ovl-map','ovl-journal','ovl-status','ovl-menu','ovl-seoul','ovl-camp','ovl-local-actions','trip-destination-dialog','journey-detail-dialog','save-transfer-dialog','travel-memory-dialog'])byId[id]={classList:{contains:()=>false},open:false};
 byId['dk-menu']={click:()=>menuOpens++};globalThis.$=selector=>byId[selector.slice(1)];
 globalThis.ledgerHidden='true';globalThis.ledger={setAttribute:(key,value)=>{if(key==='aria-hidden')ledgerHidden=value;},getAttribute:()=>ledgerHidden};
 globalThis.trigger={isConnected:true,focus(){this.focused=true;}};
 globalThis.nativeDialog=null;globalThis.classes=new Set();globalThis.Event=class{constructor(type){this.type=type;this.defaultPrevented=false;}preventDefault(){this.defaultPrevented=true;}};
 document.querySelectorAll=selector=>selector==='dialog[open]'&&nativeDialog?.open?[nativeDialog]:[];
 document.querySelector=selector=>selector==='#scr-game.on'?{}:null;
 document.body={classList:{add:name=>classes.add(name),remove:name=>classes.delete(name),contains:name=>classes.has(name)}};
 document.activeElement=trigger;globalThis.requestAnimationFrame=fn=>fn();
 globalThis.activeModal=()=>null;
 `);
 if(withNotebook){
  h.run(journal.slice(journal.indexOf('const QuestLedgerUI=')));
  h.run(`QuestLedgerUI.root={querySelector:selector=>selector==='#quest-ledger'?ledger:{focus(){}}};
  QuestLedgerUI.render=()=>{};QuestLedgerUI.clearUpdateNotice=()=>{};QuestLedgerUI.open(trigger);`);
 }
 const modal=ui.match(/  const modalOpen = ([\s\S]*?);\n\n  \/\* ── screens/)[1];h.run('UI.modalOpen='+modal+';');
 const start=ui.indexOf('  function appBack('),end=ui.indexOf('\n  function ',start+4);h.run(ui.slice(start,end));
 return h;
}
test('reading the live objective notebook pauses all actual driving state',()=>{
 const h=fixture(),before=h.run('JSON.stringify(S)');
 assert.equal(h.run('QuestLedgerUI.isOpen()'),true);
 h.run('G.tick(.05)');assert.equal(h.run('JSON.stringify(S)')===before,true,'reading objectives must not spend fuel, time or endurance');
});
test('closing the notebook resumes the next driving action without a catch-up charge',()=>{
 const h=fixture(),before=h.json('({min:S.min,fuel:S.fuel,gone:S.driving.gone})');
 h.run('G.tick(30);QuestLedgerUI.close();');
 assert.deepEqual(h.json('({min:S.min,fuel:S.fuel,gone:S.driving?.gone})'),before);
 assert.equal(h.run('UI.modalOpen()'),false);h.run('G.tick(.05)');
 assert(h.run('S.driving.gone')>before.gone);assert(h.run('S.min')<before.min+1);
});
test('app back closes the live notebook and returns focus before opening any road menu',()=>{
 const h=fixture();assert.equal(h.run('appBack()'),true);
 assert.equal(h.run('QuestLedgerUI.isOpen()'),false);assert.equal(h.run('trigger.focused'),true);assert.equal(h.run('menuOpens'),0);
 h.run('appBack()');assert.equal(h.run('menuOpens'),1);
});
test('a native dialog above the notebook closes before the notebook itself',()=>{
 const h=fixture();h.run(`nativeDialog={open:true,dispatchEvent(){},close(){this.open=false;}};`);
 assert.equal(h.run('appBack()'),true);assert.equal(h.run('nativeDialog.open'),false);assert.equal(h.run('QuestLedgerUI.isOpen()'),true);
 h.run('appBack()');assert.equal(h.run('QuestLedgerUI.isOpen()'),false);
});
test('before the notebook initializes, the existing road and title back actions remain available',()=>{
 const h=fixture(false);assert.equal(h.run('UI.modalOpen()'),false);
 assert.equal(h.run('appBack()'),true);assert.equal(h.run('menuOpens'),1);
 h.run("screen='title'");assert.equal(h.run('UI.modalOpen()'),true);assert.equal(h.run('appBack()'),false);
});
