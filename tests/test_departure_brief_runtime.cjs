/* Actual UI/receipt helpers in a VM, not a browser, layout measurement or user save. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const source=fs.readFileSync('src/07-ui.js','utf8');
const plain=value=>JSON.parse(JSON.stringify(value));
const noop=()=>{};
function load(ctx,name){
 const start=source.indexOf('  function '+name+'('),end=source.indexOf('\n  function ',start+4);
 assert(start>=0,name);vm.runInContext(source.slice(start,end),ctx);return ctx[name];
}
function harness(){
 const classes={add:noop,remove:noop,toggle:noop,contains:()=>true};
 const reader={innerHTML:''},button={},live={textContent:''};
 const dock={innerHTML:'',querySelector:s=>s==='.onboarding-route-start'?button:null,querySelectorAll:()=>[]};
 const report={appendChild:node=>{node.parentElement=report}};
 const sheet={dataset:{},classList:classes,style:{removeProperty:noop},clientWidth:360,clientHeight:728,
  querySelector:s=>({'.story-reader':reader,'.event-choice-dock':dock,'.event-field-report':report}[s]||null),querySelectorAll:()=>[]};
 let saved,closed=0,rendered=0,applied=0,ordinaryRenders=0;
 const ctx=vm.createContext({console,setTimeout:()=>0,clearTimeout:noop,requestAnimationFrame:fn=>fn(),
  clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),curStory:null,curEv:null,curCombatChoices:[],
  S:{at:'busan',day:1,min:450,driving:null,flags:{},party:[],notes:[],food:14,water:16,fuel:42},
  G:{},UI:{},SND:{setDriving:noop,combat:noop},AMBI:{event:noop,restore:noop},
  $:s=>s==='#story-live'?live:sheet,
  esc:t=>String(t??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),stripTags:String,
  clearStoryAuto:noop,storySurface:()=>'',eventSceneKeys:e=>[e.scene],storyOriginHtml:()=>'',
  eventChoiceData:()=>({combatChoices:[],count:1,html:'choice'}),storyHeading:e=>e.title,
  prepareEventAudio:turns=>turns,buildStoryTurns:text=>[{kind:'narration',text}],dialogueLaneMap:()=>({}),
  combatHudHtml:()=>'',sceneFrameHtml:()=>'<div class="event-scene-frame"></div>',
  wireEventChoicePages:noop,wireSceneZoom:noop,openModal:noop,closeModal:()=>closed++,renderAll:()=>rendered++,
  storyOutcomeIsQuiet:()=>false,storyOutcomeChips:chips=>chips});
 for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 ctx.data=vm.runInContext('D',ctx);
 ctx.data.scenes={'onboarding-main-mission-v1':'canonical-image'};
 ctx.data.sceneDescriptions={'onboarding-main-mission-v1':'운전석의 상혁'};
 Object.assign(ctx.G,{save:()=>{saved=plain(ctx.S)},openingPending:()=>null,currentCampConversation:()=>null,
  hasComp:()=>false,reqOk:()=>({ok:true}),choiceReq:()=>({}),reqVisible:()=>true,qualityChoice:noop,
  pickOutcome:(_e,c)=>c.out[0],rememberCombatChoice:()=>null,afterChoice:()=>[],questLedgerSync:noop,
  questLedgerUpdates:()=>[],clearQuestLedgerUpdates:noop,resolveMainEvidenceChain:id=>id||null,
  mainEvidenceEntryId:id=>id,mainEvidenceLocationReady:()=>true,
  applyFx:fx=>{applied++;ctx.S.flags[fx.flag]=true;ctx.S.notes.push(plain(fx.note));return []}});
 vm.runInContext(fs.readFileSync('src/04h-engine-presentation.js','utf8'),ctx);
 for(const name of ['departureBriefHtml','renderDepartureBrief','placeStoryDock','resolveChoice','closeEvent','showEvent'])load(ctx,name);
 ctx.renderStoryState=()=>{
  if(sheet.dataset.missionLayout==='departure')ctx.renderDepartureBrief(sheet,ctx.curStory);
  else ordinaryRenders++;
 };
 ctx.UI.showEvent=ctx.showEvent;
 return {ctx,sheet,reader,dock,button,live,get saved(){return saved},
  get closed(){return closed},get rendered(){return rendered},get applied(){return applied},get ordinaryRenders(){return ordinaryRenders}};
}
test('approved copy renders as one goal and three escaped, meaningful leads',()=>{
 const {ctx}=harness(),brief=ctx.data.onboardingMission.missionBrief;
 const html=ctx.departureBriefHtml(brief);
 assert.equal((html.match(/<h3/g)||[]).length,1);assert.equal((html.match(/<dt>/g)||[]).length,3);
 assert.match(html,/남산의 강제 이송을\n멈춘다/);assert.match(html,/누가 명령을 보냈는지/);
 assert.doesNotMatch(html,/자동 읽기|내가 해야 할 일|<button|<small|<input|<ol/);
 const hostile={objective:'<script>',intent:'<img>',leads:[{name:'<b>',detail:'<iframe>'}]};
 assert.doesNotMatch(ctx.departureBriefHtml(hostile),/<script>|<img>|<b>|<iframe>/);
});
test('actual event shell omits dialogue controls and scene actions; next story resets the layout gate',()=>{
 const h=harness(),{ctx,sheet,dock,reader}=h;
 ctx.showEvent(ctx.data.onboardingMission);
 assert.equal(sheet.dataset.missionLayout,'departure');assert.equal(sheet.dataset.storyStep,'decision');
 assert.match(sheet.innerHTML,/<figure class="mission-art"><img src="canonical-image"/);
 assert.doesNotMatch(sheet.innerHTML,/event-head|scene-zoom|event-scene-frame|data-story-scene-next/);
 assert.match(reader.innerHTML,/id="mission-purpose"/);
 assert.equal((dock.innerHTML.match(/<button/g)||[]).length,1);
 assert.match(dock.innerHTML,/사이드 미션은 내가 돕고 싶을 때/);
 ctx.showEvent({id:'ordinary',title:'다음 이야기',text:'말',choices:[{label:'대답',out:[{text:'결과'}]}]});
 assert.equal(sheet.dataset.missionLayout,'');assert.match(sheet.innerHTML,/event-head/);
 assert.match(sheet.innerHTML,/event-scene-frame/);assert.equal(sheet.dataset.readerLayout,'pages');
 assert.equal(h.ordinaryRenders,2,'remeasure the page once after mounting its modal');
});
test('real reader dispatcher normalizes old review/inspection saves without auto-reading or selecting',()=>{
 for(const mode of ['current','review','inspection']){
  const h=harness(),{ctx,sheet}=h;ctx.showEvent(ctx.data.onboardingMission);
  ctx.S.pendingPresentation.reading.view.readerMode=mode;
  ctx.S=plain(ctx.S);ctx.showEvent(ctx.data.onboardingMission);
  const dispatcher=load(ctx,'renderStoryState');
  ctx.curStory.readerMode=mode;ctx.curStory.reviewing=true;
  dispatcher();
  assert.equal(ctx.curStory.readerMode,'current');assert.equal(ctx.curStory.reviewing,false);
  assert.equal(h.saved.pendingPresentation.reading.view.readerMode,'current');
  assert.equal(sheet.dataset.storyFinished,'1');assert.equal(h.applied,0);assert.equal(h.closed,0);
  assert.match(h.reader.innerHTML,/북쪽으로 가며 찾아야 할 세 가지/);
 }
});
test('actual road action saves once, closes, restores road controls and never starts travel',()=>{
 const h=harness(),{ctx,sheet,button}=h;const before=plain(ctx.S);
 ctx.showEvent(ctx.data.onboardingMission);assert.equal(h.applied,0);
 button.onclick();
 assert.equal(h.applied,1);assert.equal(h.closed,1);assert.equal(h.rendered,1);
 assert.equal(h.saved.flags.main_mission_started,true);assert.equal(h.saved.notes.length,1);
 for(const key of ['at','day','min','driving','food','water','fuel','party'])assert.deepEqual(plain(ctx.S[key]),before[key]);
 assert.equal(sheet.dataset.missionLayout,undefined);assert.equal(ctx.curStory,null);
 assert.equal(h.saved.pendingPresentation,null);
 ctx.S=plain(h.saved);assert.equal(ctx.G.resumePresentation(),false,'completed briefing is not reopened');
});
test('reload between effect and close resumes the same receipt, without a second note or effect',()=>{
 const h=harness(),{ctx}=h,event=ctx.data.onboardingMission;
 ctx.showEvent(event);
 ctx.G.resolvePresentedChoice(event,event.choices[0],ctx.curStory);
 assert.equal(h.saved.pendingPresentation.phase,'result');assert.equal(h.applied,1);
 ctx.S=plain(h.saved);ctx.G.resumePresentation();
 assert.equal(h.applied,1);assert.equal(h.saved.notes.length,1);assert.equal(h.closed,1);
 assert.equal(h.saved.pendingPresentation,null);assert.equal(h.saved.driving,null);
});
test('fresh unfinished entry shows the brief, completed entry skips it, and Escape cannot discard it',()=>{
 const h=harness(),{ctx}=h;let seen=0;
 Object.assign(ctx,{clearPreparation:noop,show:noop,applyIcons:noop,renderAll:noop,showEvent:()=>seen++});
 Object.assign(ctx.G,{qualitySessionStart:noop,qualitySettlementEnter:noop,resumePresentation:()=>false});
 load(ctx,'enterGame')();assert.equal(seen,1);assert.equal(ctx.S.flags.onboarding_mission_seen,true);
 ctx.S.flags.main_mission_started=true;ctx.enterGame();assert.equal(seen,1);
 // The existing modal input contract keeps Escape from dismissing decision events.
 assert.match(source,/e\.key==='Escape'&&modal\.id!=='ev-wrap'/);
 assert.match(source,/target\.focus\(\{preventScroll:true\}\)/);
});
test('the CSS owner is gated, content-sized and single-scroll with preference-aware type',()=>{
 const css=fs.readFileSync('src/01-style.html','utf8'),postcss=require('postcss');
 const blocks=[...css.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)];
 for(const [,body] of blocks)postcss.parse(body);
 const rules=[];for(const [,body] of blocks)postcss.parse(body).walkRules(r=>{
  if(r.selector.includes('data-mission-layout'))rules.push(r);
 });
 const scope='#app #ev-wrap #ev-sheet[data-mission-layout="departure"]';
 for(const rule of rules)assert(rule.selector.startsWith(scope));
 const prop=(suffix,name)=>rules.find(r=>r.selector===scope+suffix).nodes.find(d=>d.prop===name)?.value;
 assert.equal(prop(' .event-scroll','overflow-y'),'auto');
 assert.equal(prop(' .event-field-report','flex'),'none');assert.equal(prop(' .event-field-report','height'),'auto');
 assert.equal(prop(' .story-reader','overflow'),'visible');assert.equal(prop(' .mission-art','min-height'),'96px');
 assert.equal(prop(' .mission-art img','object-position'),'44% 54%');
 assert.match(prop('','--brief-body'),/reading-body-size/);
 assert.equal(prop(' .departure-copy dl>div','grid-template-columns'),'3.5em minmax(0,1fr)');
 assert(rules.some(r=>r.selector.includes(':focus-visible')));
 assert.doesNotMatch(css,/\.mission-brief\b/,'retired competing card owners are removed');
});
