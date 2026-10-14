const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/07-ui.js','utf8');
function harness(restart=false){
 const calls=[],ctx=vm.createContext({screen:'intro',introIdx:0,introTurnIdx:0,introRestart:restart,
  D:{intro:[{beats:[{text:'끝'}]}]},S:{},pendingMode:'onroad',pendingName:'다온',pendingProfile:'keeper',pendingPack:'repair',
  $:()=>({classList:{contains:()=>true}}),clearIntroAuto(){},closeModal(){},renderIntro(){},
  localStorage:{setItem(){}},AMBI:{setLoop(){}},
  G:{newGame(...args){calls.push(args);},save(){calls.push('save');}},enterGame(){calls.push('enter');ctx.screen='game';}});
 vm.runInContext(source.slice(source.indexOf('  function nextIntro(){'),source.indexOf('  function enterGame(){')),ctx);
 return {ctx,calls,run:code=>vm.runInContext(code,ctx)};
}
test('summary completion is once-only for a new journey and a restart',()=>{
 for(const restart of [false,true]){
  const {ctx,calls,run}=harness(restart);
  run('skipIntro();skipIntro();nextIntro()');
  assert.equal(calls.length,2);assert.equal(calls[1],'enter');
  if(restart){assert.equal(calls[0],'save');assert.equal(ctx.S.entryMode,'summary');}
  else assert.deepEqual(calls[0],['onroad','다온','summary','keeper','repair']);
 }
});
test('inactive controls do nothing; returning to an active intro still permits completion',()=>{
 const {ctx,calls,run}=harness();ctx.screen='name';
 run('nextIntro();skipIntro()');assert.equal(calls.length,0);assert.equal(ctx.introIdx,0);
 ctx.screen='intro';run('nextIntro();skipIntro();nextIntro()');
 assert.equal(calls.length,2);assert.equal(calls[0][2],'full');
});
test('intro keyboard advancement consumes a held key until release',()=>{
 let advances=0,prevented=0;
 const held=new Set(),ctx=vm.createContext({e:{code:'Enter',repeat:false,preventDefault(){prevented++;}},heldStoryAdvanceKeys:held,nextIntro(){advances++;}});
 const start=source.indexOf("      if(screen==='intro'&&!modal");
 const body=source.slice(source.indexOf('{',start)+1,source.indexOf('\n      }',start));
 vm.runInContext('function key(){'+body+'}',ctx);
 vm.runInContext('key()',ctx);assert.equal(advances,1);assert(held.has('Enter'));
 held.clear();ctx.e.repeat=true;vm.runInContext('key()',ctx);assert.equal(advances,1);assert.equal(prevented,2);
 ctx.e.repeat=false;vm.runInContext('key()',ctx);assert.equal(advances,2);
 assert(source.includes("document.addEventListener('keyup',e=>heldStoryAdvanceKeys.delete(e.code))"));
});
