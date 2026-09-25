/* Source-level VM tests: execute the same reader helpers and receipt owner used live. */
const assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm');
const source=fs.readFileSync('src/07-ui.js','utf8');
const ctx=vm.createContext({console,clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),D:{scenes:{room:'room'},events:[],roadCheckInEvents:[],seoulStops:[]},G:{},S:{},setTimeout:()=>0});
const json=x=>JSON.parse(JSON.stringify(x));
const helper=name=>{const start=source.indexOf('  function '+name+'(');assert(start>=0,'real renderer helper '+name+' exists');const end=source.indexOf('\n  function ',start+4);vm.runInContext(source.slice(start,end),ctx);return ctx[name];};
let passed=0,failed=0;
const test=(name,fn)=>{try{fn();passed++;console.log('PASS '+name)}catch(e){failed++;console.error('FAIL '+name+': '+e.message)}};
const turns=['read one','read two','unread'].map(text=>({kind:'narration',text}));
test('current slice stays one unit; review excludes unread; chosen action/outcome occur once',()=>{
 const slice=helper('storyReadingSlice'), display=helper('storyDisplayTurns');
 const state={phase:'event',turns,index:1};
 assert.deepEqual(json(slice(state)).map(t=>t.text),['read two']);
 state.readerMode='review';assert.deepEqual(json(slice(state)).map(t=>t.text),['read one','read two']);
 const result={phase:'outcome',turns:[{kind:'narration',text:'result'},{kind:'narration',text:'unread result'}],index:0,history:{turns,index:1},selection:'chosen',readerMode:'review'};
 assert.deepEqual(json(display(result)).map(t=>t.text),['read one','read two','chosen','result']);
 assert.deepEqual(json(slice(result)).map(t=>t.text),['read one','read two','chosen','result']);
 result.readerMode='current';assert.deepEqual(json(slice(result)).map(t=>t.text),['result']);
});
test('view restore retains index/review/inspection in receipt; legacy defaults are safe',()=>{
 vm.runInContext(fs.readFileSync('src/04h-engine-presentation.js','utf8'),ctx);
 const G=ctx.G;G.save=()=>{};G.openingPending=()=>null;G.currentCampConversation=()=>null;
 const state={eventId:'test',phase:'event',turns,index:1,readerMode:'inspection',inspectionId:'source-a',inspectedIds:['source-a',null,7],recordOpen:true};
 ctx.S.pendingPresentation={eventId:'test',phase:'event'};G.capturePresentationView(state);
 const restored={eventId:'test',phase:'event',turns,index:0};G.restorePresentationView(restored);
 assert.equal(restored.index,1);assert.equal(restored.readerMode,'inspection');assert.deepEqual(json(restored.inspectedIds),['source-a']);
 restored.readerMode='current';G.capturePresentationView(restored);const back={eventId:'test',phase:'event'};G.restorePresentationView(back);assert.equal(back.index,1);
 assert.equal(G.presentationView({turns,index:0}).readerMode,'current');
});
test('saved outcome resume never applies gameplay twice',()=>{
 const G=ctx.G;let effects=0;G.applyFx=()=>{effects++;return []};
 const choice={out:[{text:'original',fx:{food:1}}]}, event={id:'test',choices:[]};event.choices=[choice];
 ctx.S={pendingPresentation:{eventId:'test',phase:'result',choiceIndex:0,outcomeIndex:0,text:'saved result',chips:[]}};
 for(let i=0;i<3;i++){const r=G.resolvePresentedChoice(event,choice);assert.equal(r.applied,false);assert.equal(r.out.text,'saved result')}
 assert.equal(effects,0);
});
test('scene framing stays canonical through dialogue and result',()=>{
 const shot=helper('storySceneShot');
 for(const phase of ['event','outcome'])for(let i=0;i<12;i++)assert.equal(shot({phase,turns}, {kind:'dialogue',who:'leo'},i,'character').scale,1);
});
test('key story notices remain unread through save; ordinary outcomes still acknowledge; replay is inert',()=>{
 const G=ctx.G;let effects=0,saved='';
 const choice={label:'chosen',out:[{text:'result',fx:{food:1}}]},event={id:'notice',choices:[choice]};ctx.D.events=[event];
 Object.assign(G,{save:()=>{saved=JSON.stringify(ctx.S)},reqVisible:()=>true,reqOk:()=>({ok:true}),choiceReq:()=>({}),qualityChoice:()=>{},
   pickOutcome:()=>choice.out[0],rememberCombatChoice:()=>null,applyFx:()=>{effects++;return []},afterChoice:()=>[],questLedgerSync:()=>{},
   questLedgerUpdates:()=>ctx.S.questLedger.updates.slice(ctx.S.questLedger.seenUpdateCount),
   clearQuestLedgerUpdates:()=>{ctx.S.questLedger.seenUpdateCount=ctx.S.questLedger.updates.length}});
 const fresh=()=>({flags:{},pendingPresentation:{phase:'event',eventId:'notice'},questLedger:{seenUpdateCount:0,updates:[{id:'side',title:'side mission',next:'later'}]}});
 ctx.S=fresh();G.resolvePresentedChoice(event,choice,{turns,index:1},{deferQuestRead:true});
 assert.equal(ctx.S.questLedger.seenUpdateCount,0);assert.equal(JSON.parse(saved).questLedger.seenUpdateCount,0);
 ctx.S=JSON.parse(saved);G.resolvePresentedChoice(event,choice,null,{deferQuestRead:true});assert.equal(effects,1);
 assert.equal(G.questLedgerUpdates().length,1);ctx.S=fresh();G.resolvePresentedChoice(event,choice,{turns,index:1});
 assert.equal(ctx.S.questLedger.seenUpdateCount,1);assert.equal(effects,2);
});
test('record and inspection mode switches preserve current index and reject stale controls',()=>{
 const setMode=helper('setStoryReaderMode'),state={phase:'event',eventId:'test',turns,index:1};let renders=0;
 ctx.curStory=state;ctx.renderStoryState=()=>{renders++};ctx.requestAnimationFrame=fn=>fn();ctx.$=()=>({focus:()=>{}});
 setMode(state,'review');assert.equal(state.readerMode,'review');assert.equal(state.index,1);
 setMode(state,'inspection');assert.equal(state.index,1);setMode(state,'current');assert.equal(state.index,1);assert.equal(state.reviewing,false);
 const prior=renders;setMode({...state},'review');assert.equal(renders,prior);
});
test('optional authored record is separate, escaping evidence does not consume it',()=>{
 ctx.esc=t=>String(t??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');ctx.fmt=ctx.esc;
 const inspect=helper('storyInspectionHtml'),state={index:1,readerMode:'inspection',inspectedIds:['one'],inspectionId:'one',inspection:{title:'paper',prompt:'choose',items:[{id:'one',label:'witness',text:'<script>bad</script>'}]}};
 const before=JSON.stringify(state),html=inspect(state);assert(html.includes('aria-pressed="true"'));assert(html.includes('&lt;script>'));assert(!html.includes('<script>'));assert.equal(JSON.stringify(state),before);
 const record=helper('storyRecordHtml');assert(record('long original').includes('<details'));assert(!record('long original').includes(' open'));assert(record('long original',true).includes(' open'));
 const display=ctx.storyDisplayTurns;assert(!display({phase:'event',index:0,turns,readingRecord:'future original'}).some(row=>row.kind==='archive'));
});
test('ending uses only present cast, earned memory and an unambiguous actual decision',()=>{
 ctx.D.comps={minji:{},leo:{}};ctx.D.nodes={daegu:{name:'대구'}};ctx.D.openingDecisionCallbacks={depart:{go:{summary:'left with the real letter'}}};
 const ending=helper('endingJourneyModel'),state={party:['minji','unknown'],at:'daegu',flags:{},opening:{decisions:{depart:{choiceId:'go'}}},campMemories:{minji:{home:'real memory'}}};
 const before=JSON.stringify(state),model=ending(state,'stranded');assert.deepEqual(json(model.party),['minji']);assert.equal(model.memory,'real memory');assert.equal(model.decision,'left with the real letter');assert.equal(JSON.stringify(state),before);
 const empty=ending({party:[],flags:{},at:'daegu'},'story_done');assert.equal(empty.memory,'');assert.equal(empty.decision,'');
 const sleep=ending({...state,flags:{core_sleep:true}},'story_done');assert(sleep.decision.includes('검색창'));
 assert(!ending({...state,opening:null,flags:{core_sleep:true,core_transfer:true}},'story_done').decision);
});
test('journal wikilinks are escaped labels or navigation to existing notes',()=>{
 ctx.S={notes:[{title:'known',links:[]}]};helper('journalLinkHtml');const body=helper('journalBodyHtml');
 const html=body('read [[known|label]] and [[<script>]]');assert(html.includes('data-note-title="known"'));assert(html.includes('>label</button>'));assert(!html.includes('[['));assert(!html.includes('<script>'));
});
test('real document choice keydown consumes held digits across multi-turn and single-turn results',()=>{
 const wireStart=source.indexOf('  function wire(){'),wireEnd=source.indexOf("    $('#bt-new').onclick",wireStart);
 const registration=source.slice(wireStart,wireEnd)+'\n}';
 for(const resultLength of [3,1]){
   const listeners={},modal={id:'ev-wrap',getAttribute:()=>null,querySelectorAll:()=>cards};let cards,closed=0,selected=0;
   const env=vm.createContext({document:{addEventListener:(type,fn)=>{listeners[type]=fn},querySelector:sel=>sel==='#ev-wrap.on'?modal:null},window:{addEventListener:()=>{}},heldStoryAdvanceKeys:new Set(),activeModal:()=>modal,curStory:null,screen:'game',S:{},G:{save:()=>{}}});
   env.advanceStory=state=>state.index++;
   cards=[{offsetParent:{},click:()=>{selected++;env.curStory={phase:'outcome',index:0,turns:Array(resultLength).fill({})};cards=resultLength===1?[{offsetParent:{},click:()=>closed++}]:[]}}];
   vm.runInContext(registration+'\nwire();',env);
   const event=repeat=>({key:'1',code:'Digit1',repeat,preventDefault:()=>{},target:{closest:()=>null}});
   listeners.keydown(event(false));assert.equal(selected,1);assert.equal(env.curStory.index,0);
   listeners.keydown(event(true));listeners.keydown(event(true));assert.equal(env.curStory.index,0,'held selection cannot advance result');assert.equal(closed,0,'held selection cannot close single-turn result');
   listeners.keyup({code:'Digit1'});listeners.keydown(event(false));
   if(resultLength===3)assert.equal(env.curStory.index,1);else assert.equal(closed,1);
 }
});
test('fresh story reading is manual and reachable auto control persists opt-in, pauses, and resumes',()=>{
 const declarations=source.match(/  let storyAuto=.+storyAutoTimer=0;/)[0];
 const load=(env,name)=>{const start=source.indexOf('  function '+name+'('),end=source.indexOf('\n  function ',start+4);assert(start>=0,name+' is a real UI handler');vm.runInContext(source.slice(start,end),env)};
 for(const stored of [null,'0','1']){
   const values=new Map(stored===null?[]:[['caravan_story_auto',stored]]),timers=new Map();let serial=0,buttons=[];
   const toolbar={set innerHTML(html){buttons=[...html.matchAll(/<button ([^>]+)>([^<]*)<\/button>/g)].map(match=>({attrs:match[1],textContent:match[2],dataset:{readerMode:match[1].match(/data-reader-mode="([^"]+)"/)?.[1]},focus:()=>{},setAttribute(name,value){this.attrs+=' '+name+'="'+value+'"'}}))},querySelectorAll:()=>buttons.filter(button=>button.dataset.readerMode),querySelector:()=>buttons.find(button=>button.attrs.includes('data-story-auto'))};
   const sheet={classList:{contains:()=>false},querySelector:sel=>sel==='.story-reader-tools'?toolbar:null,querySelectorAll:()=>[]};
   const reader={scrollHeight:100,scrollTop:0,clientHeight:100};
   const state={index:0,turns:[{text:'one'},{text:'two'},{text:'three'}],readerMode:'current'};
   const env=vm.createContext({console,Map,localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)},setTimeout:fn=>{timers.set(++serial,fn);return serial},clearTimeout:id=>timers.delete(id),curStory:state,document:{hidden:false},window:{},stripTags:t=>String(t||''),$:sel=>sel==='#ev-sheet'?sheet:sel.includes('[data-story-auto]')?toolbar.querySelector():sel.includes('zoomed')?null:sel==='#ev-wrap'?{classList:{contains:()=>true}}:reader,advanceStory:s=>s.index++,setStoryReaderMode:()=>{}});
   vm.runInContext(declarations,env);for(const name of ['clearStoryAuto','storyAutoDelay','scheduleStoryAuto','wireStoryTools'])load(env,name);
   if(source.includes('  function toggleStoryAuto('))load(env,'toggleStoryAuto');
   env.scheduleStoryAuto(state,state.turns[0]);assert.equal(timers.size,stored==='1'?1:0,'only an explicit stored opt-in schedules reading');
   env.clearStoryAuto();env.wireStoryTools(sheet,state);const button=toolbar.querySelector('[data-story-auto]');assert(button,'automatic reading is reachable');assert(button.attrs.includes('aria-pressed="'+(stored==='1')+'"'));
   const before=state.index;button.onclick({stopPropagation:()=>{}});assert.equal(state.index,before);assert.equal(values.get('caravan_story_auto'),stored==='1'?'0':'1');assert(toolbar.querySelector().attrs.includes('aria-pressed="'+(stored!=='1')+'"'));assert.equal(timers.size,stored==='1'?0:1);
   if(stored!=='1'){
     state.readerMode='review';state.reviewing=true;env.scheduleStoryAuto(state,state.turns[0]);assert.equal(timers.size,0);
     state.readerMode='inspection';env.scheduleStoryAuto(state,state.turns[0]);assert.equal(timers.size,0);
     state.readerMode='current';state.reviewing=false;env.scheduleStoryAuto(state,state.turns[0]);assert.equal(timers.size,1);
     reader.scrollHeight=300;env.scheduleStoryAuto(state,state.turns[0]);assert.equal(timers.size,0,'long unread text pauses auto');
     reader.scrollTop=200;env.scheduleStoryAuto(state,state.turns[0]);assert.equal(timers.size,1);
     const run=[...timers.values()][0];run();assert.equal(state.index,before+1);
   }
 }
});
test('HOME activation brings actual detail into view and returns to the same object without mutation',()=>{
 const env=vm.createContext({});vm.runInContext(fs.readFileSync('src/07g-ui-home.js','utf8')+'\nglobalThis.home=HOME;',env);
 let detailScroll=0,detailFocus=0,objectScroll=0,objectFocus=0;const back={onclick:null};
 const button={dataset:{homeObject:'companion:minji'},setAttribute:()=>{},focus:()=>objectFocus++,scrollIntoView:()=>objectScroll++};
 const detail={innerHTML:'',querySelector:()=>back,focus:()=>detailFocus++,scrollIntoView:()=>detailScroll++,setAttribute:()=>{}};
 const container={querySelectorAll:selector=>selector==='[data-home-object]'?[button]:[],querySelector:()=>detail};
 const state={party:['minji'],keepsakes:{minji:{name:'real dish',desc:'actual object'}},memories:{minji:{home:'our saved memory'}}},before=JSON.stringify(state);
 const cleanup=env.home.wire(container,state);button.onclick();assert(detail.innerHTML.includes('our saved memory'));assert.equal(detailScroll,1);assert.equal(detailFocus,1);assert.equal(typeof back.onclick,'function');
 back.onclick();assert.equal(objectScroll,1);assert.equal(objectFocus,1);assert.equal(JSON.stringify(state),before);cleanup();assert.equal(button.onclick,null);assert.equal(back.onclick,null);
});
test('two fresh manual advances work immediately without a time-based rejection',()=>{
 const start=source.indexOf('  function advanceStory('),end=source.indexOf('\n  function ',start+4),state={index:0,turns:[1,2,3],readerMode:'current'};let renders=0;
 const env=vm.createContext({curStory:state,clearStoryAuto:()=>{},renderStoryState:()=>renders++,requestAnimationFrame:fn=>fn(),$:()=>({querySelector:()=>({focus:()=>{}})}),alignStoryLatest:()=>{}});
 vm.runInContext(source.slice(start,end),env);env.advanceStory(state);env.advanceStory(state);assert.equal(state.index,2);assert.equal(renders,2);
 state.readerMode='review';state.index=0;env.advanceStory(state);assert.equal(state.index,0);
});
test('restored result review refreshes result metadata and closes to the same result unit',()=>{
 const control={focus:()=>{}},log={insertAdjacentHTML:()=>{}},classes={add:()=>{},remove:()=>{},toggle:()=>{}},progress={textContent:'1 / 5'},live={textContent:'event first'};
 const reader={innerHTML:'',querySelector:sel=>sel==='.story-transcript'?log:null,insertAdjacentHTML:()=>{},focus:()=>{}},dock={closest:()=>null,classList:classes,querySelector:()=>control};
 const report={scrollTop:340};
 const sheet={dataset:{eventKind:'story',storyPhase:'event',storyStep:'beat'},classList:classes,querySelector:sel=>({'.event-field-report':report,'.story-reader':reader,'.event-choice-dock':dock,'[data-event-progress]':progress,'.story-next,.choice:not([disabled])':control}[sel]||null)};
 const state={phase:'outcome',eventId:'leo_broadcast',label:'결과',index:0,turns:Array.from({length:9},(_,i)=>({kind:'narration',text:'result '+i})),history:{turns:Array.from({length:5},(_,i)=>({kind:'narration',text:'event '+i})),index:4},selection:'ON AIR',readerMode:'review'};
 let scenePhase='',captures=0;const env=vm.createContext({curStory:state,G:{capturePresentationView:()=>captures++},$:sel=>sel==='#ev-sheet'?sheet:sel==='#story-live'?live:reader,clearStoryAuto:()=>{},storyPresentationOptions:()=>({}),storyReaderHtml:rows=>rows.map(row=>row.text).join('|'),wireStoryTools:()=>{},renderStoryScene:s=>{scenePhase=s.phase},placeStoryDock:()=>{},speakerInfo:()=>({}),stripTags:String,esc:String,requestAnimationFrame:fn=>fn(),alignStoryLatest:()=>{},syncEventDockReserve:()=>{},wireStoryReviewPause:()=>{},scheduleStoryAuto:()=>{}});
 for(const name of ['storyDisplayTurns','storyReadingSlice','renderStoryState','setStoryReaderMode']){
   const start=source.indexOf('  function '+name+'('),end=source.indexOf('\n  function ',start+4);vm.runInContext(source.slice(start,end),env);
 }
 env.renderStoryState();assert.equal(report.scrollTop,0);assert.equal(progress.textContent,'결과 · 1 / 9');assert.equal(sheet.dataset.storyPhase,'outcome');assert.equal(sheet.dataset.storyStep,'result');assert.equal(sheet.dataset.storyFinished,'0');assert(live.textContent.includes('result 0'));assert.equal(scenePhase,'outcome');
 assert.equal(reader.innerHTML,'event 0|event 1|event 2|event 3|event 4|ON AIR|result 0');
 control.onclick({stopPropagation:()=>{}});assert.equal(state.readerMode,'current');assert.equal(state.index,0);assert.equal(reader.innerHTML,'result 0');assert.equal(progress.textContent,'결과 · 1 / 9');assert.equal(captures,2);
});
console.log(`${passed} passed / ${failed} failed`);process.exitCode=failed?1:0;
