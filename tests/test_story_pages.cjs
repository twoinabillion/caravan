/* VM/markup tests only. The fit callbacks are synthetic, not visual QA. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES,permanentEvents}=require('../tools/content-registry.cjs');
const source=fs.readFileSync('src/07-ui.js','utf8'),plain=x=>JSON.parse(JSON.stringify(x));
const ctx=vm.createContext({console});
vm.runInContext(fs.readFileSync('src/07h-story-pages.js','utf8'),ctx);
const pages=vm.runInContext('StoryPages',ctx);
const markup=/<span (?:class="(?:ai|em)"|style="color:var\(--faded\)")>|<\/span>/g;
const visible=text=>String(text).replace(markup,'');
function paginate(turns,capacity){
 const result=[],seen=new Set();let at={turn:0,offset:0};
 for(;;){
  const key=JSON.stringify(at);assert(!seen.has(key),'cursor must progress');seen.add(key);
  const part=pages.take(turns,at,rows=>rows.reduce((n,r)=>n+pages.length(r.text),0)<=capacity);
  result.push(part);if(part.done)break;at=part.end;
 }
 return result;
}
function helper(env,name){
 const start=source.indexOf('  function '+name+'('),end=source.indexOf('\n  function ',start+4);
 assert(start>=0,name);vm.runInContext(source.slice(start,end),env);return env[name];
}
test('actual scene renderer follows night/dawn beats across rosters, back and restore',()=>{
 const env=vm.createContext({console,requestAnimationFrame:fn=>fn(),speakerInfo:who=>({id:who})});
 for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),env);
 const D=vm.runInContext('D',env),night=D.events.find(e=>e.id==='seoul_night');
 const img={style:{},classList:{remove(){},add(){}},isConnected:true};
 const frame={dataset:{cutToken:'initial'},style:{setProperty(){}},setAttribute(){},querySelector:()=>img};
 env.$=()=>({querySelector:()=>frame});helper(env,'sceneFormat');helper(env,'storySceneShot');helper(env,'renderStoryScene');
 for(const method of ['transfer','sleep','quarantine'])for(const party of [[],['eunsu'],Object.keys(D.comps)])for(let choice=0;choice<2;choice++){
  const S={flags:{['core_'+method]:true},party,comps:{},stats:{km:430},notes:[],opening:{decisions:{}},campMemories:{}};
  const turns=night.choices[choice].out[0].turns(S),dawn=turns.findIndex(t=>t.text.startsWith('새벽,'));
  assert(dawn>0);
  const state={eventId:night.id,phase:'outcome',turns,sceneKeys:D.eventChoiceScenes.seoul_night[choice]};
  const before=JSON.stringify(state);
  for(const capacity of [1,150,400,Infinity]){
   const parts=paginate(turns,capacity);
   assert.equal(parts.flatMap(p=>p.rows).map(r=>visible(r.text)).join(''),turns.map(t=>visible(t.text)).join(''));
   assert(parts.every(p=>!p.rows.some(r=>r.sourceIndex<dawn)||!p.rows.some(r=>r.sourceIndex>=dawn)),
     'one visible page must not span two authored time beats');
  }
  for(const index of [...turns.keys(),0,dawn-1,dawn,turns.length-1]){
   const restored=plain(state);env.renderStoryScene(restored,restored.turns[index],index);
   assert.equal(frame.dataset.sceneKey,index<dawn?'seoul-night-quiet-v2':'seoul-home-dawn-v2');
  }
  assert.equal(JSON.stringify(state),before,'rendering must not mutate the receipt');
 }
 const state={eventId:'e',phase:'event',turns:[{text:'a',scene:'not-wired'},{text:'b'}],sceneKeys:['seoul-core-view-v2']};
 env.renderStoryScene(state,state.turns[0],0);assert.equal(frame.dataset.sceneKey,'seoul-core-view-v2');
 assert(Object.values(D.eventChoiceScenes.seoul_decision).every(keys=>!keys.includes('seoul-home-dawn-v2')));
});
test('authored picture beats preserve split-row metadata and cannot move a question across the cut',()=>{
 const turns=[{kind:'dialogue',who:'me',text:'들려요?',scene:'night'},
  {kind:'dialogue',who:'mother',text:'새벽이네.',scene:'dawn'},
  {kind:'narration',text:'아침 설명이 길게 이어진다.'}];
 const parts=paginate(turns,3),rows=parts.flatMap(p=>p.rows);
 assert(rows.filter(r=>r.sourceIndex===1).every(r=>r.scene==='dawn'));
 assert(parts.every(p=>!p.rows.some(r=>r.sourceIndex===0)||!p.rows.some(r=>r.sourceIndex===1)));
 assert.equal(rows.map(r=>r.text).join(''),turns.map(t=>t.text).join(''));
 const unbounded=pages.take(turns,{turn:0,offset:0},()=>true);
 assert.deepEqual(plain(unbounded.end),{turn:1,offset:0});
 assert.equal(pages.take(turns,plain(unbounded.end),()=>true).rows[0].scene,'dawn');
});
test('every character, space, emoji, literal entity and approved span survives small pages',()=>{
 for(const text of ['긴 대사입니다. 다음 말도 그대로.\n\n끝.','가🙂나다 &amp; <script>x</script>','앞 <span class="em">강조 <span class="ai">안쪽</span> 뒤</span> 끝']){
  for(const size of [1,3,10,23,1000]){
   const turns=[{kind:'dialogue',who:'minji',text}],before=JSON.stringify(turns),parts=paginate(turns,size);
   assert.equal(parts.flatMap(p=>p.rows).map(r=>visible(r.text)).join(''),visible(text));
   for(const row of parts.flatMap(p=>p.rows))assert.equal((row.text.match(/<span /g)||[]).length,(row.text.match(/<\/span>/g)||[]).length);
   assert.equal(JSON.stringify(turns),before);
  }
 }
});
test('all authored static event/result texts conserve their full content through the paginator',()=>{
 const dataCtx=vm.createContext({console});for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),dataCtx);
 const D=vm.runInContext('D',dataCtx),events=permanentEvents(D);let checked=0;
 for(const ev of events)for(const item of [ev,...(ev.choices||[]).flatMap(c=>c.out||[])]){
  if(typeof item.text!=='string')continue;
  const turns=[{kind:'narration',text:item.text}];
  assert.equal(paginate(turns,173).flatMap(p=>p.rows).map(r=>visible(r.text)).join(''),visible(item.text),ev.id);checked++;
 }
 assert(checked>2500,checked+' texts');
});
test('short question/reply moves together; narrated beats and voiced cuts keep their identities',()=>{
 const turns=[{kind:'narration',text:'배경 설명 설명 설명 설명'},{kind:'dialogue',who:'me',text:'어떡해요?'},{kind:'dialogue',who:'sundeok',text:'그냥 두면 돼.'}];
 const result=paginate(turns,22);
 assert.equal(result[0].rows.length,1);assert.deepEqual(plain(result[1].rows.map(r=>r.who)),['me','sundeok']);
 const voiced=paginate([{kind:'narration',text:'앞'},{kind:'ai',voice:'clip',text:'방송'},{kind:'narration',text:'뒤'}],100);
 assert.equal(voiced.length,3);assert.equal(voiced[1].rows[0].voice,'clip');
});
test('oversized single glyph still advances; empty turns and invalid cursors terminate',()=>{
 const turns=[{kind:'narration',text:''},{kind:'dialogue',text:'말'}];
 assert.equal(pages.take(turns,{turn:-5,offset:-8},()=>false).done,true);
 assert.deepEqual(plain(pages.cursor(turns,{turn:500,offset:900})),{turn:2,offset:0});
 assert.equal(pages.take([],{},()=>false).done,true);
});
test('resource receipt rows stay atomic even when one row needs the explicit scroll fallback',()=>{
 const resource={kind:'resource',text:'부품 -1',resource:{name:'부품',amount:'−1'},atomic:true};
 const turns=[{kind:'narration',text:'완료.'},resource,{kind:'summary',text:'다음 행동'}],before=JSON.stringify(turns);
 const result=paginate(turns,1),rows=result.flatMap(p=>p.rows).filter(r=>r.kind==='resource');
 assert.equal(rows.length,1);assert.equal(rows[0].text,'부품 -1');assert.equal(rows[0].resource.amount,'−1');
 assert.equal(JSON.stringify(turns),before);assert.equal(result.at(-1).done,true);
});
test('48px profile row follows the speaker, never narration or a repeated continuous speech',()=>{
 const env=vm.createContext({esc:s=>String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),
  speakerInfo:(who,name)=>({id:who,name:name||who,portrait:['me','minji'].includes(who)?who+'.png':null}),
  speakerLaneKey:t=>t.who,storyRecordHtml:()=>''});
 for(const name of ['safeHtml','fmt','pagedStoryHtml'])helper(env,name);
 const html=env.pagedStoryHtml([{kind:'dialogue',who:'minji',text:'하나'},{kind:'narration',text:'손을 든다.'},{kind:'dialogue',who:'minji',text:'둘'},
  {kind:'dialogue',who:'me',text:'셋'},{kind:'dialogue',who:'unknown',name:'낯선 사람',text:'<script>x</script>'}]);
 assert.equal((html.match(/<img /g)||[]).length,2);assert.equal((html.match(/width="48" height="48"/g)||[]).length,2);
 assert.equal((html.match(/<header class="page-speaker"/g)||[]).length,3);assert.doesNotMatch(html,/<script>/);
 assert.match(html,/낯선 사람/);assert.match(html,/&lt;script&gt;/);
});
test('partial-turn cursor, history high water and choice/result pages survive receipt save/reload',()=>{
 const env=vm.createContext({console,G:{},S:{pendingPresentation:{eventId:'e',phase:'event'}},D:{scenes:{}},clamp:(x,a,b)=>Math.min(b,Math.max(a,x)),StoryPages:pages});
 vm.runInContext(fs.readFileSync('src/04h-engine-presentation.js','utf8'),env);
 Object.assign(env.G,{openingPending:()=>null,currentCampConversation:()=>null,save:()=>{}});
 const state={eventId:'e',phase:'event',turns:[{kind:'dialogue',who:'me',text:'가나다라마바사',speakerUncertain:true}],index:0,
  readingPage:{cursor:{turn:0,offset:2},end:{turn:0,offset:5},trail:[{turn:0,offset:0}],mode:'read',choicePage:2,resultPage:1}};
 env.G.capturePresentationView(state);env.S=plain(env.S);
 const restored={eventId:'e',phase:'event'};env.G.restorePresentationView(restored);
 assert.deepEqual(plain(restored.readingPage),state.readingPage);assert(restored.turns[0].speakerUncertain);
 assert.equal(pages.readThrough(restored.turns,restored.readingPage.end)[0].text,'가나다라마');
 state.readingPage.mode='actions';assert.equal(env.G.presentationView(state).readingPage.mode,'read','unread text cannot be skipped by a partial save');
 state.readingPage.end={turn:1,offset:0};assert.equal(env.G.presentationView(state).readingPage.mode,'actions');
 let applied=0;env.G.applyFx=()=>applied++;
 env.S.pendingPresentation={eventId:'e',phase:'result',choiceIndex:0,outcomeIndex:0,text:'saved',chips:[]};
 const ch={out:[{text:'authored'}]},ev={id:'e',choices:[ch]};
 for(let i=0;i<3;i++)assert.equal(env.G.resolvePresentedChoice(ev,ch).applied,false);
 assert.equal(applied,0);
});
test('real advance handler moves by measured page, pauses in review, and stops at decisions',()=>{
 const state={turns:[{kind:'dialogue',who:'minji',text:'가나다라마바사아자차'}],readingPage:{cursor:{turn:0,offset:0},end:{turn:0,offset:0},trail:[],mode:'read'}};
 let renders=0;const env=vm.createContext({curStory:state,StoryPages:pages,clearStoryAuto(){},requestAnimationFrame:fn=>fn(),$:()=>null,
  renderStoryState(){renders++;state._page=pages.take(state.turns,state.readingPage.cursor,rows=>pages.length(rows[0].text)<=4);}});
 env.renderStoryState();const advance=helper(env,'advanceStory');
 advance(state);assert.equal(state.readingPage.cursor.offset,4);assert.equal(state.readingPage.trail.length,1);
 state.readerMode='review';advance(state);assert.equal(state.readingPage.cursor.offset,4);
 state.readerMode='current';advance(state);assert.equal(state.readingPage.cursor.offset,8);
 advance(state);assert.equal(state.readingPage.mode,'actions');const before=renders;advance(state);assert.equal(renders,before);
 advance({...state});assert.equal(renders,before,'stale controls do nothing');
});
test('style owner is gated from old live shells, choices keep full text, and builder includes pagination first',()=>{
 const css=fs.readFileSync('src/01-style.html','utf8'),postcss=require('postcss');
 for(const [,body] of css.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g))postcss.parse(body);
 const owner=css.match(/<style id="passenger-story-reader">([\s\S]*?)<\/style>/)[1];
 const active=owner.slice(owner.indexOf('/* Approved event-pages v2.'));
 assert.match(active,/width:48px;height:48px;object-fit:contain/);assert.match(active,/reading-body-size,15px\) \+ 3px/);
 assert.doesNotMatch(active,/line-clamp|text-overflow:ellipsis/);
 assert.match(active,/\[data-reader-mode="review"\]/);assert.match(active,/\[hidden\]\{display:none!important\}/);
 const build=fs.readFileSync('tools/build-html.mjs','utf8');assert(build.indexOf("'src/07h-story-pages.js'")<build.indexOf("'src/07-ui.js'"));
});

// A small deterministic DOM double exercises wiring and height decisions. It
// deliberately does NOT claim to emulate browser typography/crop/visual fit.
function renderHarness(state,height=450){
 const strip=s=>s.replace(/<[^>]*>/g,'');
 class Node{
  constructor(){this.children=[];this.classList={remove(){},contains:()=>true};this.dataset={};this.style={};this._html='';}
  set innerHTML(html){this._html=html;this.children=[];this.buttons=[...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(([,attrs,text])=>{
   const b=new Node();b.attrs=attrs;b.textContent=strip(text);b.hidden=/\bhidden\b/.test(attrs);b.disabled=/\bdisabled\b/.test(attrs);
   b.addEventListener=(_,fn)=>b.onclick=fn;return b;
  });}
  get innerHTML(){return this._html;}
  get textContent(){return this._text??strip(this.innerHTML);}
  set textContent(value){this._text=value;}
  querySelector(sel){
   if(sel==='[data-page-count]')return this.count||(this.count=new Node());
   const attr=sel.match(/^\[([^\]]+)\]$/)?.[1];
   return (this.buttons||[]).find(b=>attr?b.attrs.includes(attr):sel==='.story-next'&&b.attrs.includes('story-next'))
    ||this.children.map(c=>c.querySelector(sel)).find(Boolean)||null;
  }
  querySelectorAll(sel){return sel==='.choices>.choice'?(this.buttons||[]).filter(b=>/class="choice\b/.test(b.attrs)):[];}
  appendChild(node){node.parentElement=this;this.children.push(node);}
  focus(){} remove(){}
  getBoundingClientRect(){
   const buttons=(this.buttons||[]).filter(b=>!b.hidden),choices=buttons.filter(b=>/class="choice\b/.test(b.attrs));
   return {height:12+choices.reduce((n,b)=>n+40+Math.ceil(b.textContent.length/28)*20,0)+(choices.length?22:0)+44};
  }
 }
 const reader=new Node(),dock=new Node(),report=new Node(),sheet=new Node();report.clientHeight=height;dock.parentElement=report;
 Object.assign(sheet.dataset,{readerLayout:'pages',eventKind:'story'});
 sheet.querySelector=sel=>({'.story-reader':reader,'.event-choice-dock':dock,'.event-field-report':report}[sel]||null);
 Object.defineProperty(reader,'clientHeight',{get:()=>Math.max(0,height-dock.getBoundingClientRect().height)});
 Object.defineProperty(reader,'scrollHeight',{get:()=>Math.max(reader.clientHeight,Math.ceil(strip(reader.innerHTML).length/24)*28+(reader.innerHTML.match(/page-speaker/g)||[]).length*56)});
 let captures=0;
 const env=vm.createContext({console,StoryPages:pages,D:{icons:{}},window:{},document:{createElement:()=>new Node()},curStory:state,
  esc:String,fmt:String,stripTags:strip,speakerInfo:(who,name)=>({id:who,name:name||who,portrait:who+'.png'}),speakerLaneKey:t=>t.who,
  G:{capturePresentationView:()=>captures++},wireStoryTools(){},renderStoryScene(){},wireStoryReviewPause(){},scheduleStoryAuto(){},wireSceneZoom(){},
  placeStoryDock(){},normalizeRecruitDecisionDock(){},storyRecordHtml:()=>'',storyInspectionHtml:()=>'',storyCompletedRecordHtml:()=>'',storyOutcomeSummaryHtml:()=>'',
  clearStoryAuto(){},VO:{play(){}},AMBI:{play(){}},heldStoryAdvanceKeys:new Set(),$:()=>null,
  requestAnimationFrame:fn=>fn(),closeEvent(){},setStoryReaderMode:(s,mode)=>{s.readerMode=mode;env.renderStoryState();}});
 for(const name of ['storyElapsedChip','storyResourceChange','storyResourceIcon','storyResourceHtml','pagedStoryHtml','storyResultPageTurns','renderPagedStory','advanceStory','storyDisplayTurns'])helper(env,name);
 env.renderStoryState=()=>env.renderPagedStory(state,sheet);
 return {env,state,sheet,reader,dock,get captures(){return captures}};
}
test('real page renderer reaches every choice group, can read back, and returns from records',()=>{
 const state={phase:'event',eventId:'fixture',index:0,turns:[{kind:'dialogue',who:'minji',text:'가나다라 '.repeat(180)}],
  finalDock:'<div class="choices">'+Array.from({length:9},(_,i)=>`<button class="choice" data-i="${i}">선택 ${i} · 긴 설명을 그대로 읽는다</button>`).join('')+'</div>',wireFinal(){}};
 const h=renderHarness(state);h.env.renderStoryState();let pagesRead=0;
 while(state.readingPage.mode==='read'){h.env.advanceStory(state);assert(++pagesRead<30);}
 assert(pagesRead>1);assert.equal(h.sheet.dataset.pageFallback,'');
 const visible=[];
 for(;;){visible.push(...h.dock.querySelectorAll('.choices>.choice').filter(b=>!b.hidden).map(b=>b.textContent));
  const next=h.dock.children[0].querySelector('[data-page-next]');if(next.disabled)break;next.onclick();}
 assert.equal(visible.length,9);assert.equal(new Set(visible).size,9);
 h.dock.children[0].querySelector('[data-page-back]').onclick();assert.equal(state.readingPage.mode,'read');
 const saved=plain(state.readingPage.cursor);state.readerMode='review';h.env.renderStoryState();
 h.dock.querySelector('[data-reader-close]').onclick({stopPropagation(){}});
 assert.equal(state.readerMode,'current');assert.deepEqual(plain(state.readingPage.cursor),saved);assert(h.captures>0);
});
test('real result renderer pages long saved summaries without applying effects or losing the exit',()=>{
 const state={phase:'outcome',eventId:'fixture',index:0,turns:[{kind:'narration',text:'끝났다.'}],
  readingPage:{cursor:{turn:0,offset:0},end:{turn:1,offset:0},mode:'actions',trail:[],choicePage:0,resultPage:0},
  resultChips:Array.from({length:30},(_,i)=>({t:`변화 ${i} · 보관한 결과 내용`,c:'plus'})),questUpdates:[],
  finalDock:'<div class="choices"><button class="choice">길로 돌아가기</button></div>',wireFinal(){}};
 const h=renderHarness(state);h.env.renderStoryState();const seen=[];
 for(;;){seen.push(stripMarkup(h.reader.innerHTML));const next=h.dock.children[0].querySelector('[data-page-next]');if(next.disabled)break;next.onclick();}
 const joined=seen.join('');for(let i=0;i<30;i++)assert(joined.includes(`변화 ${i} · 보관한 결과 내용`));
 assert.equal(h.sheet.dataset.pageFallback,'');assert.equal(h.dock.querySelectorAll('.choices>.choice')[0].hidden,false);
 function stripMarkup(s){return s.replace(/<[^>]*>/g,'');}
});
test('a short reaction keeps its exit on the same page, and back remains usable',()=>{
 const state={phase:'outcome',eventId:'fixture',index:0,turns:[{kind:'dialogue',who:'minji',text:'가자, 대장님.'},{kind:'narration',text:'민지가 공구함을 든다.'}],
  resultChips:[],questUpdates:[],finalDock:'<div class="choices"><button class="choice">길로 돌아가기</button></div>',wireFinal(){}};
 const h=renderHarness(state);h.env.renderStoryState();
 assert.equal(state.readingPage.mode,'actions');assert.match(h.reader.innerHTML,/가자, 대장님/);assert.match(h.reader.innerHTML,/공구함/);
 h.dock.children[0].querySelector('[data-page-back]').onclick();assert.equal(state.readingPage.mode,'read');
 h.env.advanceStory(state);assert.equal(state.readingPage.mode,'actions');
});
test('offroad reply uses the same reader; a closed conversation never reopens on a late response',async()=>{
 let resolve,requests=0,saved=0;const shown=[];
 const env=vm.createContext({curStory:{offroad:true},chatNpc:'sundeok',$:()=>({value:'안녕하세요'}),
  D:{npcs:{sundeok:{name:'순덕'}}},G:{myName:()=> '상혁',save:()=>saved++},renderHud(){},closeEvent(){},
  storyDisplayTurns:()=>[{kind:'dialogue',who:'sundeok',text:'인사'}],
  OFF:{npcChat:()=>{requests++;return new Promise(r=>resolve=r)}},
  showNpcDialogue:(nid,turns,actions,opt)=>{const state={nid,turns,actions,opt,offroad:opt.offroad};shown.push(state);env.curStory=state;return state;}});
 const start=source.indexOf('  async function sendChat('),end=source.indexOf('\n  function showNodeCard',start);
 vm.runInContext(source.slice(start,end),env);
 const pending=env.sendChat();assert.equal(requests,1);assert.equal(shown.length,1);
 env.curStory=null;resolve({reply:'늦은 답'});await pending;
 assert.equal(shown.length,1);assert.equal(saved,1);
 env.curStory={offroad:true};const next=env.sendChat();resolve({reply:'지금 답',chips:[{t:'물 +1'}]});await next;
 assert.equal(shown.at(-1).turns[0].who,'sundeok');assert.equal(shown.at(-1).turns[0].text,'지금 답');
 assert.equal(shown.at(-1).turns[1].kind,'narration');assert.equal(shown.at(-1).opt.history.at(-1).who,'me');
 assert.equal(shown.at(-1).offroad,true);
});
