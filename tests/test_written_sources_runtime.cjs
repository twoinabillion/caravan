/* Real renderer/parser + isolated receipts. Not browser typography or user-save QA. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES,permanentEvents}=require('../tools/content-registry.cjs');
const ui=fs.readFileSync('src/07-ui.js','utf8'),plain=value=>JSON.parse(JSON.stringify(value));
function helper(ctx,name){
  const start=ui.indexOf('  function '+name+'('),end=ui.indexOf('\n  function ',start+4);
  assert(start>=0&&end>start,name);vm.runInContext(ui.slice(start,end),ctx);return ctx[name];
}
function setup(){
  const ctx=vm.createContext({console,introPreview:false,S:{party:[],flags:{},comps:{}},G:{myName:()=> '검수 이름'}});
  for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
  ctx.data=vm.runInContext('D',ctx);
  vm.runInContext(ui.slice(ui.indexOf('  const esc='),ui.indexOf('  function speakerInfo(')),ctx);
  ctx.escapeTitle=vm.runInContext('esc',ctx);
  for(const name of ['speakerInfo','storyDocumentTitle','storyTurnHtml','speakerLaneKey','safeHtml','fmt','pagedStoryHtml'])helper(ctx,name);
  vm.runInContext(fs.readFileSync('src/07h-story-pages.js','utf8'),ctx);
  return ctx;
}
const renderers=ctx=>[turn=>ctx.storyTurnHtml(turn,{intro:true}),turn=>ctx.storyTurnHtml(turn),turn=>ctx.pagedStoryHtml([turn]),turn=>ctx.pagedStoryHtml([turn],true)];
test('authored memo, letter and written record have one source, no portrait and unchanged body in every reader',()=>{
  const ctx=setup();
  const turns=[...ctx.data.intro.flatMap(page=>page.beats||[]),
    ...permanentEvents(ctx.data).flatMap(event=>[...(Array.isArray(event.turns)?event.turns:[]),
      ...(event.choices||[]).flatMap(choice=>(choice.out||[]).flatMap(out=>Array.isArray(out.turns)?out.turns:[]))])]
    .filter(turn=>ctx.storyDocumentTitle(turn));
  assert(turns.length>10);assert(turns.some(turn=>turn.name==='엄마의 메모'));
  assert(turns.some(turn=>/남산 유지실/.test(turn.name||'')));
  const before=JSON.stringify(turns);
  for(const turn of turns)for(const render of renderers(ctx)){
    const html=render(turn),title=ctx.storyDocumentTitle(turn),heading=html.match(/<div class="[^"]*document-source">([^<]*)<\/div>/g)||[];
    assert.equal(heading.length,1,title);assert(heading[0].includes(ctx.escapeTitle(title)));
    assert.match(html,/data-source-layout="document"/);
    assert.doesNotMatch(html,/<img\b|<small\b|turn-speaker|page-speaker/);
    assert(html.includes(ctx.fmt(turn.text)),title+' body must survive');
  }
  assert.equal(JSON.stringify(turns),before,'rendering cannot rewrite source identity/text/audio');
});
test('unnamed sources use only the original kind and explicit titles are escaped, not inferred from actors',()=>{
  const ctx=setup();
  for(const kind of ['letter','record'])for(const name of [undefined,'','  '])for(const render of renderers(ctx)){
    const html=render({kind,who:'mother',name,text:'원문'});
    assert.match(html,new RegExp('document-source">'+(kind==='letter'?'편지':'기록')+'<'));
    assert.doesNotMatch(html,/엄마|초상|<img/);
  }
  for(const render of renderers(ctx)){
    const html=render({kind:'letter',who:'mother',name:'<img onerror="bad"> & 메모',text:'첫 줄\n🙂 끝'});
    assert.match(html,/&lt;img onerror=&quot;bad&quot;&gt; &amp; 메모/);
    assert.doesNotMatch(html,/<img\b|<script\b/);assert.match(html,/첫 줄<br>🙂 끝/);
  }
});
test('recorded audio/video and unknown media retain their legacy labels, portraits and audio metadata',()=>{
  const ctx=setup();
  ctx.data.portraits.mother='mother.png';
  for(const [name,medium] of [['엄마의 목소리','audio'],['엄마의 메시지','video'],['소리','radio'],['낯선 매체','hologram'],['엄마의 녹음',undefined],['엄마의 영상',undefined]]){
    const turn={kind:'record',who:'mother',name,medium,text:'들리니?',voice:'saved-voice',sfx:'saved-sfx'},before=JSON.stringify(turn);
    assert.equal(ctx.storyDocumentTitle(turn),'');
    const legacy=ctx.storyTurnHtml(turn),paged=ctx.pagedStoryHtml([turn]);
    assert.match(legacy,/turn-avatar/);assert(legacy.includes(name));assert.match(paged,/page-source">기록</);
    assert.doesNotMatch(legacy+paged,/data-source-layout|document-source/);
    assert.equal(JSON.stringify(turn),before);
  }
  for(const medium of ['paper','text','written','document'])assert.equal(ctx.storyDocumentTitle({kind:'record',medium,name:'사진 뒷면 글씨'}),'사진 뒷면 글씨');
});
test('speech, thought, terminal, radio and consecutive speaker grouping are not changed into documents',()=>{
  const ctx=setup();ctx.data.portraits.mother='mother.png';ctx.data.portraits.me='me.png';
  const rows=[{kind:'dialogue',who:'mother',name:'엄마',text:'하나'},
    {kind:'letter',who:'mother',name:'엄마의 메모',text:'둘'},
    {kind:'dialogue',who:'mother',name:'엄마',text:'셋'},
    {kind:'thought',who:'me',text:'생각한다.'},{kind:'ai',name:'부두 민원 단말',text:'신청 항목을 말씀하십시오.'},
    {kind:'radio',name:'녹음 방송',text:'지금 방송입니다.'}];
  const html=ctx.pagedStoryHtml(rows);
  assert.equal((html.match(/page-speaker/g)||[]).length,1,'existing consecutive-speaker grouping stays intact');
  assert.equal((html.match(/<img\b/g)||[]).length,1);assert.equal((html.match(/document-source/g)||[]).length,1);
  assert.match(html,/page-source">생각</);assert.match(html,/page-source">부두 민원 단말</);assert.match(html,/page-source">라디오</);
  for(const row of rows.filter(row=>row.kind!=='letter'))assert.doesNotMatch(ctx.storyTurnHtml(row),/document-source|data-source-layout/);
  assert.doesNotMatch(ctx.storyTurnHtml(rows[3]),/turn-avatar/);
});
test('actual prose parser preserves authored written attribution without changing recorded media inference',()=>{
  const ctx=setup();
  vm.runInContext(ui.slice(ui.indexOf('  function eventSpeakerCandidates('),ui.indexOf('  function prepareEventAudio(')),ctx);
  const event=ctx.data.events.find(event=>event.id==='parents_father_last_log');assert(event);
  assert(event.turns.some(turn=>turn.kind==='record'&&ctx.storyDocumentTitle(turn)));
  const written=ctx.buildStoryTurns('종이 쪽지에 적혀 있었다: 「문을 닫아라.」',{parseRecords:true},{});
  assert(written.some(row=>row.kind==='record'));
  for(const turn of written.filter(row=>row.kind==='record'))assert.match(ctx.pagedStoryHtml([turn]),/document-source">기록</);
  const audio=ctx.buildStoryTurns('라디오에서 목소리가 흘러나왔다: "아직 들리나? 문을 닫고 기다려라."',{},{});
  assert(audio.some(row=>row.kind==='radio'));
  for(const turn of audio)assert.doesNotMatch(ctx.pagedStoryHtml([turn]),/document-source|data-source-layout/);
});
test('paid frozen documents and Unicode reading position survive receipt reload and review without reapplying effects',()=>{
  const ctx=setup();ctx.clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
  vm.runInContext(fs.readFileSync('src/04h-engine-presentation.js','utf8'),ctx);
  let saves=0,effects=0;Object.assign(ctx.G,{openingPending:()=>null,currentCampConversation:()=>null,save:()=>saves++,applyFx:()=>effects++});
  const turn={kind:'letter',who:'mother',name:'엄마의 메모',text:'가🙂나다\n마지막',voice:'original-clip',sfx:'paper',medium:'paper'};
  const state={eventId:'written-fixture',phase:'outcome',turns:[turn],index:0,readerMode:'current',
    readingPage:{cursor:{turn:0,offset:2},end:{turn:0,offset:5},trail:[{turn:0,offset:0}],mode:'read',choicePage:0,resultPage:0}};
  ctx.S.pendingPresentation={eventId:state.eventId,phase:'result',choiceIndex:0,outcomeIndex:0,text:'옛 결과',chips:[]};
  ctx.G.capturePresentationView(state);ctx.S=plain(ctx.S);
  const before=JSON.stringify(ctx.S),restored={eventId:state.eventId,phase:'outcome'};ctx.G.restorePresentationView(restored);
  assert.deepEqual(plain(restored.turns),[turn]);assert.deepEqual(plain(restored.readingPage),state.readingPage);
  const pages=vm.runInContext('StoryPages',ctx),part=pages.take(restored.turns,restored.readingPage.cursor,()=>true);
  assert.equal(part.rows[0].text,'나다\n마지막');
  for(const render of renderers(ctx))assert.match(render(part.rows[0]),/document-source">엄마의 메모</);
  ctx.pagedStoryHtml(pages.readThrough(restored.turns,restored.readingPage.end),true);
  assert.equal(JSON.stringify(ctx.S),before,'display/review cannot rewrite the paid receipt');
  const choice={out:[{text:'새 대본'}]},event={id:state.eventId,choices:[choice]};
  for(let i=0;i<3;i++)assert.equal(ctx.G.resolvePresentedChoice(event,choice).applied,false);
  assert.equal(effects,0);assert(saves>0);
});
test('document styles have one owner, wrap long headings and gate portrait inset removal until structural apply',()=>{
  const css=fs.readFileSync('src/01-style.html','utf8'),postcss=require('postcss'),rules=[];
  for(const [,body]of css.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g))postcss.parse(body).walkRules(rule=>rules.push(rule));
  const values=(selector,prop)=>rules.filter(rule=>rule.selector===selector).flatMap(rule=>rule.nodes.filter(node=>node.prop===prop).map(node=>node.value));
  assert.deepEqual(values('.document-source','font'),['600 var(--reading-detail-size,13px)/1.5 var(--sans)']);
  assert.deepEqual(values('.document-source','overflow-wrap'),['anywhere']);
  assert.deepEqual(values('.document-source','white-space'),['normal']);
  assert.deepEqual(values('#intro-txt .story-turn.dialogue .turn-text,#intro-txt .story-turn.letter:not([data-source-layout="document"]) .turn-text','padding-left'),['58px']);
  assert.deepEqual(values('#app #ev-sheet.passenger-reader[data-reader-layout="pages"] .page-turn[data-source-layout="document"]','--reader-source-size'),['var(--reading-detail-size,13px)']);
  const documentRules=rules.filter(rule=>/document-source|data-source-layout/.test(rule.selector));
  for(const rule of documentRules)assert(!rule.nodes.some(node=>/height|overflow$|line-clamp|text-overflow/.test(node.prop||'')),rule.selector);
  assert.match(css,/--quiet-body:calc\(var\(--reading-body-size,13px\) \+ 3px\)/);
  assert.match(css,/\.ui-large-text\{--reading-body-size:18px/);
});
