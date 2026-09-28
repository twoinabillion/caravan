/* Real source helpers + in-memory receipt owner; no browser or Studio save. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('./content-registry.cjs');
const source=fs.readFileSync('src/07-ui.js','utf8');
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function helper(ctx,name){
  const start=source.indexOf('  function '+name+'('),end=source.indexOf('\n  function ',start+4);
  assert(start>=0&&end>start,name+' has a source owner');
  vm.runInContext(source.slice(start,end),ctx);return ctx[name];
}
function setup(){
  const ctx=vm.createContext({console,esc,fmt:esc,stripTags:t=>String(t??'').replace(/<[^>]*>/g,''),
    clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),G:{},S:{party:[],flags:{}},setTimeout:()=>0});
  for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
  ctx.data=vm.runInContext('D',ctx);
  for(const name of ['storySurface','storyHeading','storyCompletedRecordHtml','storyNextStepHtml','storyOutcomeSummaryHtml','storyDisplayTurns'])helper(ctx,name);
  return ctx;
}
const event=(c,id)=>c.data.events.find(e=>e.id===id);
const update={kind:'main',title:'메인 스토리 진행 · 부모님의 인간 확인 검증키를 꺼낸다',
  next:'수원 성곽 공동체에서 ‘주변 탐색’을 눌러 「교환소 앞 달구지의 검증키」 기록을 확인한다 (열람 준비 30분)'};
test('surface selection distinguishes real video/talk/camp without changing combat or intro',()=>{
  const c=setup();
  assert.equal(c.storySurface(event(c,'story_family_principle')),'record');
  assert.equal(c.storySurface(event(c,'meet_scrapyard')),'talk');
  assert.equal(c.storySurface(event(c,'rq_minji_request')),'talk');
  assert.equal(c.storySurface({campConversation:true}),'camp');
  for(const e of [{combat:{}},{openingStep:1,type:'대화'},{}])assert.equal(c.storySurface(e),'');
  assert.equal(c.storyHeading(event(c,'story_family_principle')),'부모님의 발표 연습');
});
test('restored sentence comes only from the completed, saved restoration branch',()=>{
  const c=setup(),e=event(c,'story_family_principle');
  const state={eventId:e.id,phase:'outcome',choiceIndex:0,resultText:e.choices[0].out[0].text,
    turns:[{kind:'narration',text:'read'},{kind:'narration',text:'end'}],index:1};
  const before=JSON.stringify(state),html=c.storyCompletedRecordHtml(state);
  assert.match(html,/마지막 문장까지 복원했다/);assert.match(html,/인간 책임자의 서명/);
  assert.match(html,/<details[^>]*restoredLineOpen/);assert.doesNotMatch(html,/<details[^>]*\sopen/);
  for(const patch of [{choiceIndex:1},{index:0},{phase:'event'},{eventId:'other'},{resultText:'예전에 저장한 다른 결과'}])
    assert.equal(c.storyCompletedRecordHtml({...state,...patch}),'');
  assert.match(c.storyCompletedRecordHtml({...state,restoredLineOpen:true}),/<details[^>]*\sopen/);
  assert.equal(JSON.stringify(state),before);
});
test('resource/time/loss changes stay visible; record notices are collapsed and no chips are discarded',()=>{
  const c=setup(),chips=[{t:'새 기록 · 예측은 명령이 아니다'},{t:'◈ 예측과 명령 사이 · 확인'},
    {t:'기억됨 · 부모님이 남긴 문장의 끝을 복원했다.'},{t:'부품 +1'},{t:'고철 +4'},
    {t:'15분 경과'},{t:'차체 -4',c:'minus'},{t:'알 수 없는 중요한 변화'}];
  const before=JSON.stringify(chips),html=c.storyOutcomeSummaryHtml(chips,[update,update],{});
  const visible=html.replace(/<details[\s\S]*?<\/details>/g,'');
  for(const text of ['부품 +1','고철 +4','15분 경과','차체 -4','알 수 없는 중요한 변화'])assert(visible.includes(text));
  for(const chip of chips)assert(html.includes(esc(chip.t)));
  assert.doesNotMatch(visible,/기억됨|새 기록|◈|메인 스토리 갱신|메인 스토리 진행/);
  assert.equal((html.match(/story-next-place/g)||[]).length,1);assert.match(html,/is-loss/);
  assert.equal(JSON.stringify(chips),before);
});
test('next action keeps the saved Suwon target, actual control, reading time and record identity',()=>{
  const c=setup(),html=c.storyNextStepHtml(update);
  for(const label of ['수원 성곽 공동체','주변 탐색','준비 30분','교환소 앞 달구지의 검증키'])assert(html.includes(label));
  assert.doesNotMatch(html,/공주|진행 ·|갱신/);
  const fallback=c.storyNextStepHtml({kind:'side',title:'내일 다시 만나기',next:'문이 열리는 내일 아침 다시 온다.'});
  assert.match(fallback,/내일 아침/);assert.match(fallback,/사이드 미션/);
  assert.doesNotMatch(c.storyOutcomeSummaryHtml([{t:'<script>bad</script>'}],[{title:'<img>',next:'<svg>'}],{}),/<script>|<img>|<svg>/);
});
test('review retains original event, choice and outcome; condensed display never mutates them',()=>{
  const c=setup(),e=event(c,'story_family_principle');
  const state={phase:'outcome',eventId:e.id,choiceIndex:0,resultText:e.choices[0].out[0].text,
    history:{turns:[{kind:'narration',text:e.text}],index:0},selection:e.choices[0].label,
    turns:[{kind:'narration',text:e.choices[0].out[0].text}],index:0};
  const before=JSON.stringify(state);c.storyCompletedRecordHtml(state);
  const texts=c.storyDisplayTurns(state).map(t=>t.text);
  assert.equal(texts[0],e.text);assert.equal(texts[1],e.choices[0].label);assert.equal(texts[2],e.choices[0].out[0].text);
  assert.equal(JSON.stringify(state),before);
});
test('new disclosure states save synchronously, reload, and reject detached or stale controls',()=>{
  const c=setup();vm.runInContext(fs.readFileSync('src/04h-engine-presentation.js','utf8'),c);
  let saves=0;c.G.save=()=>saves++;c.G.openingPending=()=>null;c.G.currentCampConversation=()=>null;
  const state={eventId:'story_family_principle',phase:'outcome',turns:[{kind:'narration',text:'historical'}],index:0};
  c.S.pendingPresentation={eventId:state.eventId,phase:'result'};c.curStory=state;
  const records=['restoredLineOpen','resultRecordOpen'].map(key=>({dataset:{resultDisclosure:key},isConnected:true,open:false,
    summary:{},querySelector(){return this.summary;}}));
  const sheet={dataset:{eventKind:'story'},classList:{remove(){}},querySelector:()=>null,
    querySelectorAll:selector=>selector==='[data-result-disclosure]'?records:[]};
  helper(c,'placeStoryDock')(sheet,state);
  const click={preventDefault(){},stopPropagation(){}};
  records[0].summary.onclick(click);records[1].summary.onclick(click);
  assert.equal(saves,2,'no asynchronous toggle event is needed before reload');
  const restored={eventId:state.eventId,phase:'outcome'};
  c.S=JSON.parse(JSON.stringify(c.S));c.G.restorePresentationView(restored);
  assert.equal(restored.restoredLineOpen,true);assert.equal(restored.resultRecordOpen,true);
  assert.equal(restored.turns[0].text,'historical');
  records[0].isConnected=false;records[0].ontoggle();assert.equal(saves,2);
  c.curStory={...state};records[1].ontoggle();assert.equal(saves,2);
  const legacy=c.G.presentationView({turns:state.turns});
  assert.equal(legacy.restoredLineOpen,false);assert.equal(legacy.resultRecordOpen,false);
});
test('name presentation follows the authored identity state and leaves other speakers unchanged',()=>{
  const c=setup();c.playerSpeaker=id=>id==='me';c.speakerLaneKey=t=>t.who;
  c.speakerInfo=(id,name)=>({id,name:name||(id==='minji'?'민지':'상혁'),portrait:'portrait'});
  const chat=helper(c,'chatMessageHtml');
  assert.match(chat({who:'minji',name:'???',text:'아직 소개 전'},false,'left',{surface:'talk'}),/chat-name">소녀/);
  assert.match(chat({who:'minji',text:'민지.'},false,'left',{surface:'talk'}),/chat-name">민지/);
  assert.match(chat({who:'other',name:'???',text:'모르는 사람'},false,'left',{surface:'talk'}),/chat-name">\?\?\?/);
});
test('cabin returns to its underlying surface and keeps real camp memory and ability access',()=>{
  const c=setup();helper(c,'minjiGuestNoteHtml');c.G.recruitApproach=()=>null;
  assert.equal(c.minjiGuestNoteHtml(),'');
  c.S.recruitQ={id:'minji',stage:'task'};
  assert.match(c.minjiGuestNoteHtml(),/울산까지 함께 타는 손님/);
  c.S.campMemories={minji:{home:'함께 들었던 실제 야영 기억'}};
  assert.match(c.minjiGuestNoteHtml(),/함께 들었던 실제 야영 기억/);
  c.S.recruitQ.stage='road';assert.doesNotMatch(c.minjiGuestNoteHtml(),/울산까지/);
  c.S.party=['minji'];assert.equal(c.minjiGuestNoteHtml(),'');
  assert.match(source,/data-crew-close.*closeOvl\('#ovl-status'\)/);
  assert.match(source,/data-comp2="\$\{story.id\}"/);
  assert.match(source,/data-guest-notebook[\s\S]*?QuestLedgerUI\.pendingUpdateKind='side'/);
});
test('existing CSS owner parses; new themes keep readable controls and unclipped result text',()=>{
  const postcss=require('postcss'),css=fs.readFileSync('src/01-style.html','utf8');
  for(const [,block] of css.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g))postcss.parse(block);
  const owner=css.match(/<style id="passenger-story-reader">([\s\S]*?)<\/style>/)[1];
  assert.equal((css.match(/id="passenger-story-reader"/g)||[]).length,1);
  assert.match(owner,/object-fit:contain!important/);assert.match(owner,/overflow-wrap:anywhere/);
  assert.match(owner,/data-story-finished="1"[^\n]*overflow-y:auto!important/);
  const luminance=hex=>{
    const rgb=hex.match(/[\da-f]{2}/g).map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
    return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
  };
  const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  for(const [ink,paper] of [['eee9dd','1c292c'],['b8beb9','151c1f'],['c9c2b3','282723'],
    ['eee9dd','35494b'],['d4d9cf','35494b'],['202b28','d9bc88'],['c7cbbd','323930'],['f0bda5','1c292c']])
    assert(contrast(ink,paper)>=4.5,ink+'/'+paper);
  assert(contrast('80928c','1c292c')>=3,'choice boundary remains recognizable');
});
