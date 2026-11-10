'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createRequire}=require('node:module');
function fixtureFrom(file){const s=fs.readFileSync(file,'utf8'),end=s.indexOf('\ntest(');assert(end>0);return new Function('require',s.slice(0,end)+'\nreturn fixture;')(createRequire(path.resolve(file)));}
const lifecycleFixture=fixtureFrom('tests/test_app_lifecycle.cjs'),audioFixture=fixtureFrom('tools/test-audio-lifecycle.cjs'),ui=fs.readFileSync('src/07-ui.js','utf8');
function reading(kind,automatic=true){
 const f=lifecycleFixture({screen:kind==='intro'?'intro':'game'}),timers=new Map();let seq=0,renders=0,advanced=0,menu=false;
 const state={eventId:'reading-probe',phase:'event',index:0,turns:[{kind:'narration',text:'첫 장'},{kind:'narration',text:'다음 장'}],readerMode:'current',readingPage:{mode:'read',cursor:{turn:0,offset:0},trail:[]},_page:{done:false,end:{turn:1,offset:0},rows:[{text:'첫 장'}]}};
 f.context.setTimeout=(fn,delay)=>{timers.set(++seq,{fn,delay});return seq;};f.context.clearTimeout=id=>timers.delete(id);
 Object.assign(f.context,{introAuto:automatic,introAutoTimer:0,introAutoGeneration:0,introIdx:0,introTurnIdx:0,introPages:()=>[{beats:[{text:'프롤로그'}]}],updateIntroAuto:()=>{},nextIntro:()=>advanced++,
  curStory:kind==='intro'?null:state,storyAuto:automatic,storyAutoTimer:0,storyAutoGeneration:0,MobileReader:{isOpen:()=>menu},stripTags:String,storyAutoDelay:()=>2600,renderStoryState:()=>renders++,
  $:sel=>sel==='#ev-sheet .story-reader'?{scrollHeight:100,scrollTop:0,clientHeight:100}:sel==='#ev-wrap'?{classList:{contains:()=>true}}:null});
 for(const name of ['clearIntroAuto','scheduleIntroAuto','clearStoryAuto','advanceStory','scheduleStoryAuto']){const a=ui.indexOf('  function '+name+'('),z=ui.indexOf('\n  function ',a+4);assert(a>0&&z>a);f.run(ui.slice(a,z));}
 const schedule=()=>f.run(kind==='intro'?'scheduleIntroAuto()':'scheduleStoryAuto(curStory,curStory.turns[curStory.index])');
 const fire=()=>{const [id,timer]=timers.entries().next().value||[];assert(timer,'one eligible timer exists');timers.delete(id);timer.fn();};
 return {...f,state,timers,schedule,fire,renders:()=>renders,advanced:()=>advanced,menu:v=>menu=v};
}
for(const kind of ['intro','story'])test(`${kind}: pagehide-before-hidden cannot advance; return rearms once and rejects stale callbacks`,()=>{
 const f=reading(kind);f.schedule();const old=[...f.timers.values()][0],before=f.snapshot();
 f.emit('window','pagehide');old.fn();assert.equal(f.state.readingPage.cursor.turn,0);assert.equal(f.advanced(),0);assert.equal(f.renders(),0);assert.equal(f.timers.size,0);
 f.emit('window','pageshow');assert.equal(f.timers.size,1);old.fn();assert.equal(f.state.readingPage.cursor.turn,0);assert.equal(f.advanced(),0);assert.equal(f.timers.size,1,'stale callback cannot erase or replace the return timer');
 f.emit('window','pageshow');assert.equal(f.timers.size,1,'duplicate return does not duplicate reading');f.fire();
 if(kind==='intro')assert.equal(f.advanced(),1);else assert.equal(f.state.readingPage.cursor.turn,1);
 assert.deepEqual(f.snapshot(),before,'reading lifecycle never spends game time/resources');
});
for(const kind of ['intro','story'])test(`${kind}: visibility+pagehide and hidden pageshow retain reading until an actual visible return`,()=>{
 const f=reading(kind);f.schedule();const old=[...f.timers.values()][0];f.context.document.hidden=true;f.emit('document','visibilitychange');f.emit('window','pagehide');old.fn();f.emit('window','pageshow');assert.equal(f.timers.size,0);
 f.context.document.hidden=false;f.emit('document','visibilitychange');assert.equal(f.timers.size,1);f.fire();assert.equal(kind==='intro'?f.advanced():f.state.readingPage.cursor.turn,1);
});
for(const kind of ['intro','story'])test(`${kind}: manual reading remains manual after suspension`,()=>{const f=reading(kind,false);f.schedule();assert.equal(f.timers.size,0);f.emit('window','pagehide');f.emit('window','pageshow');assert.equal(f.timers.size,0);assert.equal(f.state.readingPage.cursor.turn,0);assert.equal(f.advanced(),0);});
test('story return retains inspection/tools pauses and does not auto-select a decision',()=>{
 for(const mode of ['inspection','review','actions','tools']){const f=reading('story');f.schedule();f.emit('window','pagehide');if(mode==='actions')f.state.readingPage.mode='actions';else if(mode==='tools')f.menu(true);else f.state.readerMode=mode;f.emit('window','pageshow');assert.equal(f.timers.size,0,mode);assert.equal(f.state.readingPage.cursor.turn,0);}
});
test('repeated lifecycle suspension preserves explicit song and its playback position',()=>{
 const f=audioFixture();f.audio.BGM.toggleSong();const song=f.media.find(a=>a.src==='song');song.currentTime=37;
 f.document.hidden=true;f.audio.suspendForLifecycle();f.audio.suspendForLifecycle();assert(f.media.every(a=>a.paused));
 f.document.hidden=false;f.audio.resumeForLifecycle();assert.equal(f.audio.BGM.isSongPlaying(),true);assert.equal(song.currentTime,37);assert(f.media.filter(a=>a.src!=='song').every(a=>a.paused));
});
test('muting during repeated song suspension remains authoritative on return',()=>{const f=audioFixture();f.audio.BGM.toggleSong();f.audio.suspendForLifecycle();f.audio.BGM.setOn(false);f.audio.suspendForLifecycle();f.audio.resumeForLifecycle();assert(f.media.every(a=>a.paused));});

// Pure intro wiring/schedulers: no engine setup, newGame or player state.
function introPauseFixture(automatic=true){
 const vm=require('node:vm'),timers=new Map(),record={open:false},nodes={};let seq=0,advanced=0,summary=false;
 for(const selector of ['#opening-history','#intro-skip','#intro-summary-continue'])nodes[selector]={};
 const c=vm.createContext({screen:'name',UI:{},document:{hidden:false},introAuto:automatic,introAutoTimer:0,introAutoGeneration:0,introIdx:0,introTurnIdx:0,introPreview:false,lifecyclePaused:false,
  introPages:()=>[{beats:[{text:'미리 읽는 기억'}]}],stripTags:String,updateIntroAuto(){},nextIntro:()=>advanced++,
  setTimeout:fn=>{timers.set(++seq,fn);return seq;},clearTimeout:id=>timers.delete(id),record,
  pauseArrivalCountdown(){},resumeArrivalCountdown(){},clearStoryAuto(){},curStory:null,
  rememberPreparation(){},SND:{enable(){}},show:id=>c.screen=id.replace('scr-',''),renderIntro:()=>c.scheduleIntroAuto(),
  openModal:()=>summary=true,closeModal:()=>summary=false,
  $:selector=>nodes[selector]||(selector==='#intro-summary'?{classList:{contains:()=>summary}}:selector==='#intro-txt .story-reading-record[open]'&&record.open?record:null)});
 const run=code=>vm.runInContext(code,c);
 for(const name of ['clearIntroAuto','scheduleIntroAuto','setLifecyclePaused']){const a=ui.indexOf('  function '+name+'('),z=ui.indexOf('\n  function ',a+4);assert(a>=0&&z>a);run(ui.slice(a,z));}
 const a=ui.indexOf("    const openingHistory=$('#opening-history');"),z=ui.indexOf('    let introPointer=',a);assert(a>=0&&z>a);run(ui.slice(a,z));
 const b=ui.indexOf("    $('#intro-skip').onclick="),y=ui.indexOf("    $('#intro-summary-start').onclick=",b);assert(b>=0&&y>b);run(ui.slice(b,y));
 run(ui.split('\n').find(line=>line.includes('record.ontoggle=()=>')));
 return {c,run,timers,record,nodes,advanced:()=>advanced,fire(){const [id,fn]=timers.entries().next().value||[];assert(fn,'eligible intro timer');timers.delete(id);fn();}};
}
test('intro history entry with saved automatic reading starts after its actual screen handoff',()=>{
 const f=introPauseFixture();f.nodes['#opening-history'].onclick();assert.equal(f.c.screen,'intro');assert.equal(f.c.introPreview,true);assert.equal(f.timers.size,1);f.fire();assert.equal(f.advanced(),1);
 const manual=introPauseFixture(false);manual.nodes['#opening-history'].onclick();assert.equal(manual.timers.size,0);
});
test('intro document pause survives background return without advancing the expanded record',()=>{
 const f=introPauseFixture();f.nodes['#opening-history'].onclick();f.record.open=true;f.record.ontoggle();assert.equal(f.timers.size,0);
 f.run('setLifecyclePaused(true);setLifecyclePaused(false)');assert.equal(f.timers.size,0);assert.equal(f.record.open,true);assert.equal(f.advanced(),0);
 f.record.open=false;f.c.scheduleIntroAuto();assert.equal(f.timers.size,1);f.fire();assert.equal(f.advanced(),1);
});
test('intro summary pause survives background return until its explicit continue control',()=>{
 const f=introPauseFixture();f.nodes['#opening-history'].onclick();f.nodes['#intro-skip'].onclick({stopPropagation(){}});assert.equal(f.timers.size,0);
 f.run('setLifecyclePaused(true);setLifecyclePaused(false)');assert.equal(f.timers.size,0);assert.equal(f.advanced(),0);
 f.nodes['#intro-summary-continue'].onclick({stopPropagation(){}});assert.equal(f.timers.size,1);f.fire();assert.equal(f.advanced(),1);
});
test('intro document pause blocks a queued callback before its toggle event arrives',()=>{
 const f=introPauseFixture();f.c.screen='intro';f.c.scheduleIntroAuto();assert.equal(f.timers.size,1);
 f.record.open=true;f.fire();assert.equal(f.advanced(),0);assert.equal(f.record.open,true);
 f.c.scheduleIntroAuto();assert.equal(f.timers.size,0);
});
