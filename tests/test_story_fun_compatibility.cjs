'use strict';

// Read existing finite-journey receipts in two isolated source VMs. This suite
// never starts a game, spends a new choice, writes a user save, or opens the UI.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const beforeDir=path.join(root,'qa-artifacts/fun-story-build-20261108/before');
const baseline=JSON.parse(fs.readFileSync(path.join(beforeDir,'source-baseline.json'),'utf8'));
const provenance=JSON.parse(fs.readFileSync(path.join(beforeDir,'receipt-provenance.json'),'utf8'));
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
// Exact pre-edit UI dependency, retained before later dialog integration.
// Camp dependency recovered from HEAD; its bytes match the original baseline hash.
const dependencyBackups={
  'src/07-ui.js':{backup:'tests/fixtures/story-fun-compatibility/07-ui.js',sha256:'61123970537fe19fd3bbf18fc5f8788b7b31a739c234325ac8ad5790f673723b'},
  'src/03j-camp-conversations.js':{backup:'tests/fixtures/story-fun-compatibility/03j-camp-conversations.js',sha256:'53990752c074c5fff01bc28bb9ea575e75a66c017f43c9d6edfb3a7d070a9a79'}
};
const sourceBackups={...baseline.backups,...dependencyBackups};
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const clone=value=>JSON.parse(JSON.stringify(value));

function source(relative,legacy){
  const backup=legacy&&sourceBackups[relative];
  return fs.readFileSync(path.join(root,backup?backup.backup:relative),'utf8');
}
function section(text,from,to){
  const start=text.indexOf(from),end=text.indexOf(to,start);
  assert(start>=0&&end>start,'current UI reader source markers must exist: '+from);
  return text.slice(start,end);
}
function setup(legacy=false){
  const noop=()=>{},store=new Map(),timers=[];
  const FixedDate=class extends Date{static now(){return 1794080000000;}};
  const context=vm.createContext({console,Date:FixedDate,URLSearchParams,location:{search:''},
    setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout:noop,
    document:{readyState:'loading',addEventListener:noop},window:{dispatchEvent:noop},CustomEvent:function(){},
    UI:new Proxy({modalOpen:()=>false},{get:(owner,key)=>owner[key]||noop}),
    localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,String(value)),removeItem:key=>store.delete(key)}});
  const run=text=>vm.runInContext(text,context);
  const engines=Object.keys(baseline.runtimeHashes).filter(relative=>/^src\/04[a-h]-.*\.js$/.test(relative)).sort();
  for(const relative of [...STATIC_CONTENT_FILES,...engines])run(source(relative,legacy));
  run(source('src/07h-story-pages.js',legacy));
  const ui=source('src/07-ui.js',legacy);
  // Use the same parser, audio annotation, scene selection, and saved-view
  // restoration that showEvent/resolveChoice use. DOM layout is not asserted.
  run(ui.match(/^  const stripTags=.*;$/m)[0]+ui.match(/^  const playerSpeaker=.*;$/m)[0]+
    section(ui,'  function eventSpeakerCandidates(','  const ICO='));
  run(section(ui,'  function eventSceneKeys(','  function sceneFormat('));
  const journal=source('src/07d-ui-quests.js',legacy);
  run(journal.slice(0,journal.indexOf('const QuestLedgerUI=')));
  run(`
    globalThis.qaReadEntry=()=>{
      const e=G.presentationEvent(S.pendingPresentation.eventId),pending=G.beginPresentation(e);
      const text=pending.phase==='event'?pending.text:typeof e.text==='function'?e.text(S):e.text;
      const authored=typeof e.turns==='function'?e.turns(S):e.turns;
      const authoredTurns=Array.isArray(authored)&&authored.length
        ?authored.map(turn=>({...turn,...(turn.who==='me'&&!turn.name?{name:G.myName()}:{} )})):null;
      const turns=authoredTurns?(e.readingRecord?authoredTurns:prepareEventAudio(authoredTurns,e))
        :prepareEventAudio(buildStoryTurns(text,e,{turnSpeakers:D.finaleSpeakers(e.id,-1,S)||e.turnSpeakers}),e);
      const info=eventScenePresentation(e,'event',[],turns);
      const state={eventId:e.id,phase:'event',turns,index:0,...info,
        knownSpeaker:!!turns.knownSpeaker,
        readingRecord:typeof e.readingRecord==='function'?e.readingRecord(S):e.readingRecord};
      G.restorePresentationView(state);
      return {reader:state,text:pending.text,revision:pending.narrativeRevision||null};
    };
    globalThis.qaReadPaid=()=>{
      const saved=S.pendingPresentation,e=G.presentationEvent(saved.eventId),choice=e.choices[saved.choiceIndex];
      const result=G.resolvePresentedChoice(e,choice);
      if(!result.ok||result.applied)throw new Error('a historical receipt must not be paid again');
      const out=result.out,text=typeof out.text==='function'?out.text(S):out.text;
      const authored=out.frozenTextOnly?null:typeof out.turns==='function'?out.turns(S):out.turns;
      const turns=Array.isArray(authored)&&authored.length?authored:buildStoryTurns(text,e,{
        knownSpeaker:false,speakers:out.speakers,frozenTextOnly:!!out.frozenTextOnly,
        turnSpeakers:out.frozenTextOnly?[]:D.finaleSpeakers(e.id,e.choices.indexOf(choice),S)||out.turnSpeakers});
      const cuts=D.eventChoiceScenes?.[e.id]?.[saved.choiceIndex];
      const explicit=[out.scenes,out.scene,choice.scenes,choice.scene,cuts];
      const first=eventScenePresentation(e,'outcome',explicit,turns);
      const hasExplicit=first.sceneKeys.length&&explicit.some(value=>Array.isArray(value)?value.some(Boolean):Boolean(value));
      const prior=saved.reading?.history?.sceneKeys?.[0];
      const info=hasExplicit?first:eventScenePresentation(e,'outcome',prior?[prior]:[],turns);
      const state={eventId:e.id,phase:'outcome',turns,index:0,...info,knownSpeaker:!!turns.knownSpeaker,
        readingRecord:typeof out.readingRecord==='function'?out.readingRecord(S):out.readingRecord};
      G.restorePresentationView(state);
      return {reader:state,text,chips:result.chips,applied:result.applied,frozenTextOnly:!!out.frozenTextOnly};
    };
  `);
  return {run,json:expression=>JSON.parse(run('JSON.stringify('+expression+')')),store,timers};
}
function load(h,value){assert.equal(h.run('G.load('+JSON.stringify(JSON.stringify(value))+')'),true);}
function protectedState(h){
  return h.json(`({day:S.day,min:S.min,fuel:S.fuel,water:S.water,food:S.food,scrap:S.scrap,
    van:S.van,fatigue:S.fatigue,hunger:S.hunger,thirst:S.thirst,pursuit:S.pursuit,
    seed:S.seed,stats:S.stats,items:S.items,party:S.party,comps:S.comps,flags:S.flags,
    notes:S.notes,opening:S.opening,reading:S.pendingPresentation,recruitQ:S.recruitQ,
    campConversation:S.campConversation,campMemories:S.campMemories,queue:S._storyQueue,chain:S._chain})`);
}
function inputFor(row,kind,mode){
  const value=JSON.parse(fs.readFileSync(path.join(root,row.files[kind].path),'utf8'));
  const owner=value.pendingPresentation;
  if(mode==='authored-only'){delete owner.reading;delete owner.view;}
  if(mode==='text-only'||mode==='unmarked-text-only'){
    delete owner.reading;delete owner.view;delete owner.authoredView;
  }
  if(mode==='unmarked'||mode==='unmarked-text-only')delete owner.narrativeRevision;
  if(mode==='unknown-revision')owner.narrativeRevision='unrecognized-legacy-v0';
  if(mode==='cursor'){
    // Controlled pagination variation of an actual paid reader. The underlying
    // journey/choice/receipt is untouched; this is not another fresh player.
    const view=owner.reading.view,last=view.turns.length-1;
    view.index=last;
    view.recordOpen=true;view.resultRecordOpen=true;view.readerMode='review';
    view.readingPage={cursor:{turn:last,offset:1},end:{turn:view.turns.length,offset:0},
      mode:'actions',trail:[{turn:0,offset:0},{turn:last,offset:1}],choicePage:1,resultPage:1};
    if(owner.reading.history){
      const history=owner.reading.history;
      history.readingPage={cursor:{turn:0,offset:0},end:{turn:history.turns.length,offset:0},
        mode:'actions',trail:[{turn:0,offset:0}],choicePage:0,resultPage:0};
    }
  }
  return value;
}
function readTwice(legacy,input,paid){
  const h=setup(legacy);load(h,input);
  const expectedRng=h.json('[rng(),rng(),rng(),rng()]');load(h,input);
  const before=protectedState(h),owner=h.json('S.pendingPresentation');
  const result=h.json(paid?'qaReadPaid()':'qaReadEntry()');
  assert.deepEqual(protectedState(h),before,'reading may not alter resources, notes, receipt, queues or story state');
  assert.deepEqual(h.json('S.pendingPresentation'),owner,'saved raw reader/cursor owner remains immutable');
  assert.deepEqual(h.json('[rng(),rng(),rng(),rng()]'),expectedRng,'reading must not consume RNG');
  const afterRead=h.json('S');
  const exported=h.run('G.exportSave()');
  assert.equal(exported,JSON.stringify(afterRead),'export retains exact saved fields');
  load(h,JSON.parse(exported));
  const reloaded=protectedState(h),again=h.json(paid?'qaReadPaid()':'qaReadEntry()');
  assert.deepEqual(again,result,'save/load reopens the same exact reader');
  assert.deepEqual(protectedState(h),reloaded,'reload/replay cannot repay or append a note');
  return {result,state:reloaded,owner:h.json('S.pendingPresentation')};
}

test('pre-edit source copies and actual receipt provenance remain byte-identical',()=>{
  assert.equal(Object.keys(baseline.backups).length,9);
  for(const [relative,row]of Object.entries(sourceBackups)){
    assert.equal(sha(fs.readFileSync(path.join(root,row.backup))),row.sha256,relative+' baseline copy changed');
    assert.equal(row.sha256,baseline.runtimeHashes[relative].sha256,relative+' differs from pre-edit runtime manifest');
  }
  // A baseline VM may reuse only dependencies known not to have changed.
  const reused=new Set([...STATIC_CONTENT_FILES,
    ...Object.keys(baseline.runtimeHashes).filter(relative=>/^src\/04[a-h]-.*\.js$/.test(relative)),
    'src/07-ui.js','src/07h-story-pages.js','src/07d-ui-quests.js']);
  for(const relative of reused)assert(baseline.runtimeHashes[relative],relative+' has no pre-edit runtime provenance');
  for(const [relative,row]of Object.entries(baseline.runtimeHashes)){
    if(!reused.has(relative))continue;
    if(!sourceBackups[relative])assert.equal(sha(fs.readFileSync(path.join(root,relative))),row.sha256,
      relative+' changed without a pre-edit backup; capture it before extending this review');
  }
  for(const row of provenance.rows)for(const saved of Object.values(row.files))
    assert.equal(sha(fs.readFileSync(path.join(root,saved.path))),saved.sha256,'actual save provenance changed: '+saved.path);
});

for(const row of provenance.rows){
  for(const mode of ['as-saved','authored-only','text-only','unmarked-text-only','cursor']){
    test(row.eventId+' old paid '+mode+': exact current UI reader, receipt, resources, notes, cursor and RNG match pre-edit',()=>{
      const input=inputFor(row,'paid',mode);
      const old=readTwice(true,input,true),current=readTwice(false,input,true);
      assert.deepEqual(current,old,'new content must not rewrite a historical paid reader');
      assert.equal(current.result.text,input.pendingPresentation.text);
      assert.deepEqual(current.result.chips,input.pendingPresentation.chips);
      assert.deepEqual(current.state.notes,input.notes,'historical notes remain exact');
      for(const key of ['fuel','water','food','scrap','van','fatigue','seed'])assert.equal(current.state[key],input[key],key);
      if(mode==='text-only'||mode==='unmarked-text-only')assert.equal(current.result.frozenTextOnly,true);
      if(mode==='cursor')assert.deepEqual(current.result.reader.readingPage,input.pendingPresentation.reading.view.readingPage);
    });
  }
  for(const [kind,mode]of [['entry','as-saved'],['entry','unmarked'],['entry','unknown-revision'],['viewedEntry','as-saved'],['viewedEntry','unmarked']]){
    test(row.eventId+' historical '+kind+'/'+mode+': unmarked and earlier editions retain their actual reader without auto-upgrade',()=>{
      const input=inputFor(row,kind,mode);
      const old=readTwice(true,input,false),current=readTwice(false,input,false);
      assert.deepEqual(current,old,'earlier entry must use its matching authored edition');
      assert.equal(current.result.text,input.pendingPresentation.text);
      assert.equal(current.owner.narrativeRevision||null,input.pendingPresentation.narrativeRevision||null);
      if(input.pendingPresentation.reading?.view)
        assert.deepEqual(current.result.reader.turns,input.pendingPresentation.reading.view.turns);
    });
  }
}

module.exports={setup,load,readTwice,provenance,baseline};
