const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('src/07-ui.js','utf8');
function fixture(){let open=false,scheduled=[],advanced=0;
 const state={index:0,turns:[{text:'one'},{text:'two'}],readingPage:{cursor:{turn:0,offset:0},mode:'read'}};
 const c=vm.createContext({clearStoryAuto:()=>{},storyAuto:true,storyAutoTimer:0,storyAutoGeneration:0,lifecyclePaused:false,MobileReader:{isOpen:()=>open},document:{hidden:false},curStory:state,storyAutoDelay:()=>10,stripTags:x=>x,setTimeout:fn=>{scheduled.push(fn);return 1;},advanceStory:()=>advanced++,$:sel=>sel==='#ev-sheet .story-reader'?{scrollHeight:100,scrollTop:0,clientHeight:100}:sel==='#ev-wrap'?{classList:{contains:()=>true}}:null});
 const a=src.indexOf('  function scheduleStoryAuto('),b=src.indexOf('\n  function ',a+4);vm.runInContext(src.slice(a,b),c);
 return {state,schedule:()=>c.scheduleStoryAuto(state,state.turns[0]),open:()=>open=true,scheduled,advanced:()=>advanced};
}
test('resize cannot schedule automatic reading under an open tools dialog',()=>{const f=fixture();f.open();f.schedule();assert.equal(f.scheduled.length,0);});
test('an already queued reading callback cannot advance through the tools dialog',()=>{const f=fixture();f.schedule();assert.equal(f.scheduled.length,1);f.open();f.scheduled[0]();assert.equal(f.advanced(),0);});
