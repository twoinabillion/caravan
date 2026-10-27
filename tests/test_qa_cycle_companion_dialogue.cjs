const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
function fixture(id,ci=0){const h=setup();h.run(`G.save();G.load();S.party=['leo','eunsu'];S.comps.leo.bond=25;S.used=[];S.notes=[];globalThis.e=event('${id}');globalThis.ci=${ci};G.beginPresentation(e);`);return h;}
function paid(h){h.run('globalThis.result=G.resolvePresentedChoice(e,e.choices[ci])');assert(h.run('result.ok'));}
const roles=h=>h.json("buildStoryTurns(result.out.text,e,{turnSpeakers:result.out.turnSpeakers}).filter(t=>t.kind==='dialogue').map(t=>t.who)");
test('an independent first Eunsu silence conversation does not remember an unheard earlier statement',()=>{
 const h=fixture('talk_es_03');assert.equal(h.run('S.used.length'),0);assert.doesNotMatch(h.run('S.pendingPresentation.text'),/했잖아요|말을 이었다/);paid(h);assert(h.run("S.notes.some(n=>n.title==='침묵 분류학')"));
});
test('Leo theme result and journal record only the current performance, with the actual speakers',()=>{
 const h=fixture('talk_leo_14');paid(h);assert.doesNotMatch(h.run('result.out.text'),/이후로|앉을 때마다/);assert.doesNotMatch(h.run("S.notes.find(n=>n.title==='여덟 마디의 나').body"),/자동 연주|때마다/);
 assert.deepEqual(roles(h),['me','leo','me','leo','leo']);
});
test('Eunsu callsign result demonstrates one trial call while preserving the earned callsign flag',()=>{
 const h=fixture('talk_es_02');paid(h);assert.doesNotMatch(h.run('result.out.text'),/이후로|가끔/);assert.equal(h.run('S.flags.eunsu_callsign_held'),true);
 assert.deepEqual(roles(h),['eunsu','me','eunsu','eunsu']);
});
for(const ci of [0,1])test(`Leo guitar result ${ci} keeps consecutive Leo lines and player question on the correct speaker`,()=>{
 const h=fixture('talk_leo_21',ci);paid(h);assert.deepEqual(roles(h),['leo','leo','me','leo']);
 h.run('G.save();G.load();globalThis.result=G.resolvePresentedChoice(e,e.choices[ci])');assert.equal(h.run('result.applied'),false);assert.deepEqual(roles(h),['leo','leo','me','leo']);
});
test('paid historical dialogue and note text stay frozen after revised immediate prose',()=>{
 for(const id of ['talk_leo_14','talk_es_02','talk_es_03','talk_leo_21']){const h=fixture(id);h.run("S.notes=[{id:'old',title:'기존 기록',body:'이후로 계속했다',links:[],day:1}];S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:0,outcomeIndex:0,text:'전에 말했다. 이후로 계속했다.',chips:[]};G.save();G.load()");paid(h);assert.equal(h.run('result.applied'),false);assert.equal(h.run('result.out.text'),'전에 말했다. 이후로 계속했다.');assert.equal(h.run('S.notes[0].body'),'이후로 계속했다');}
});
