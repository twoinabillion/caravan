const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const base=path.resolve(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle12/systems');
const trace=JSON.parse(fs.readFileSync(base+'/player02/attempt01/player02-trace.json')).trace;
const helper=require('../qa-artifacts/qa-cycle-20261026/cycle12/story/reader-runtime.cjs');
function render(id,index){
 const r=trace.find(r=>r.action==='choice'&&r.observation.eventId===id),h=setup();
 h.run('(()=>{'+helper.code()+'})()');assert(h.run(`G.load(${JSON.stringify(fs.readFileSync(base+`/player02/attempt01/entry-${r.n-1}-${id}-export.json`,'utf8'))})`));
 h.run(`globalThis.ev=G.presentationEvent(${JSON.stringify(id)});globalThis.choice=ev.choices[${index}];`);
 const entry=h.json('qaNamed(qaEntry(ev))');h.run('globalThis.result=G.resolvePresentedChoice(ev,choice)');assert(h.run('result.ok'));
 const result=h.json('qaNamed(qaResult(ev,choice,result.out))');
 return {h,entry,result};
}
const spoken=turns=>turns.filter(t=>['dialogue','radio','ai','thought'].includes(t.kind));
const project=turns=>turns.map(t=>({kind:t.kind,who:t.who||null,name:t.displayName||null,text:t.text}));
function preserved(h,result){
 h.run("G.capturePresentationView({eventId:ev.id,phase:'outcome',turns:qaResult(ev,choice,result.out),index:0});G.save();");assert(h.run('G.load()'));
 h.run('globalThis.replay=G.resolvePresentedChoice(ev,choice)');assert.equal(h.run('replay.applied'),false);
 assert.deepEqual(project(h.json('qaNamed(qaResult(ev,choice,replay.out))')),project(result));
}
test('Jaepil answers the player rather than making the player explain his own candles',()=>{
 const {h,result}=render('npc_jaepil_2',0);assert.deepEqual(spoken(result).map(t=>t.who),['jaepil','jaepil','me','jaepil','jaepil']);preserved(h,result);
});
for(const [index,expected] of [[0,['miyoung','miyoung','me','miyoung','miyoung']],[1,['miyoung','miyoung']]])test('Miyoung ledger question and answer voices, branch'+index,()=>{
 const {h,entry,result}=render('npc_miyoung_2',index);assert.deepEqual(spoken(entry).map(t=>t.who),['me']);assert.deepEqual(spoken(result).map(t=>t.who),expected);preserved(h,result);
});
test('the arcade toy excuse is the player speaking',()=>{const {h,result}=render('exp_arcade',1);assert.deepEqual(spoken(result).map(t=>t.who),['me']);preserved(h,result);});
test('the customer asks about the bowl and the bibimbap cook replies',()=>{
 const {h,entry,result}=render('lc_jeonju_bibim',0);assert.deepEqual(spoken(entry).map(t=>t.displayName),['비빔밥 요리사','비빔밥 요리사']);
 assert.deepEqual(spoken(result).map(t=>t.who),['me','passer_woman']);assert.equal(spoken(result)[1].displayName,'비빔밥 요리사');preserved(h,result);
});
test('salvage clerk, customer and nearby corrector remain different voices',()=>{
 const {h,result}=render('salvage_claim',0);assert.deepEqual(spoken(result).map(t=>t.who),['passer_man','me','passer_man','passer_worker','passer_man']);
 assert.deepEqual(spoken(result).filter(t=>t.who==='passer_man').map(t=>t.displayName),['남자','남자','남자']);preserved(h,result);
});
test('the unseen Ghost speaker identifies its own group through the loudspeaker',()=>{
 const {h,entry,result}=render('cell_ghost_meet',0);assert.deepEqual(spoken(entry).map(t=>t.kind),['radio','radio']);assert.deepEqual(spoken(entry).map(t=>t.who),['radio','radio']);
 assert.deepEqual(spoken(result).map(t=>t.displayName),Array(4).fill('유령 통신원'));assert(spoken(result).every(t=>t.kind==='radio'));preserved(h,result);
});
test('already recorded legacy reader views are retained without retroactive speaker rewrites',()=>{
 const {h}=render('npc_jaepil_2',0),old=JSON.parse(fs.readFileSync(base+'/reader-diagnostic-before.json')).records.find(r=>r.event==='npc_jaepil_2').result;
 h.run(`G.capturePresentationView({eventId:ev.id,phase:'outcome',turns:${JSON.stringify(old)},index:0});G.save();`);assert(h.run('G.load()'));h.run('globalThis.replay=G.resolvePresentedChoice(ev,choice)');
 assert.equal(h.run('replay.applied'),false);assert.deepEqual(project(h.json('qaNamed(qaResult(ev,choice,replay.out))')),project(old));
});
