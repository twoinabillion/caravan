const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup,root}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const ui=fs.readFileSync(root+'/src/07-ui.js','utf8'),scene=ui.slice(ui.indexOf('  function eventSceneKeys('),ui.indexOf('  function sceneFormat('))+';globalThis.qaInfo=eventScenePresentation;';
const raw=fs.readFileSync(root+'/tests/fixtures/qa-cycle26-37-support/cycle34/story/agent94/attempt01/normal-unpaid-597-seoul_open.json','utf8');
function loadNatural(){const h=setup();h.run(scene);assert(h.run('G.load('+JSON.stringify(raw)+')'));assert.equal(h.run('S.at'),'seoul');assert.equal(h.run('S.pendingPresentation.eventId'),'seoul_open');return h}
test('Seoul gate and following bridge agree on actual time and retain its real entry reader after reload',()=>{
 for(const min of [329,330,1169,1170,1234]){
  const h=loadNatural();h.run(`S.pendingPresentation=null;S.day=9;S.min=${min};globalThis.e=D.seoulOpenEvent;G.beginPresentation(e);globalThis.turns=buildStoryTurns(S.pendingPresentation.text,e,{turnSpeakers:e.turnSpeakers}),info=qaInfo(e,'event',[],turns);`);const keys=h.json('info.sceneKeys'),turns=h.json('turns');assert(turns.length>0);assert.deepEqual(keys,[min<330||min>=1170?'seoul-han-night-v1':'seoul-han']);
  const bridge=loadNatural();bridge.run(`S.pendingPresentation=null;S.day=9;S.min=${min};globalThis.e=event('seoul_han');G.beginPresentation(e);globalThis.info=qaInfo(e,'event')`);assert.deepEqual(bridge.json('info.sceneKeys'),keys);
  h.run("G.capturePresentationView({eventId:e.id,phase:'event',turns,...info,index:0});S.min=700;G.save();G.load();globalThis.restored={eventId:e.id,phase:'event'};G.restorePresentationView(restored)");
  assert.deepEqual(h.json('restored.sceneKeys'),keys);assert.deepEqual(h.json('restored.sceneTime'),{day:9,min});assert.deepEqual(h.json('restored.turns'),turns);
 }
});
test('legacy gate reading has no invented clock and retains its original key and reader',()=>{
 const h=loadNatural();h.run("globalThis.e=D.seoulOpenEvent,turns=buildStoryTurns(S.pendingPresentation.text,e,{turnSpeakers:e.turnSpeakers});delete S.pendingPresentation.sceneTime;G.capturePresentationView({eventId:e.id,phase:'event',turns,sceneKeys:['seoul-han'],index:0});globalThis.before=G.presentationReading(S.pendingPresentation.reading);G.save();G.load();globalThis.info=qaInfo(e,'event',[],turns)");
 assert.deepEqual(h.json('info.sceneKeys'),['seoul-han']);assert.equal(h.run('info.sceneTime'),undefined);assert.deepEqual(h.json('S.pendingPresentation.reading'),h.json('before'));
});

for(const reader of [true,false])test('legacy paid gate '+(reader?'reader':'text-only')+' retains its outcome and never reapplies',()=>{
 const h=loadNatural();h.run("globalThis.e=D.seoulOpenEvent;G.pickOutcome=()=>e.choices[0].out[0];globalThis.r=G.resolvePresentedChoice(e,e.choices[0]),turns=buildStoryTurns(r.out.text,e,{turnSpeakers:r.out.turnSpeakers});delete S.pendingPresentation.sceneTime;G.capturePresentationView({eventId:e.id,phase:'outcome',turns,sceneKeys:['seoul-han'],index:0})");assert(h.run('r.applied'));const before=h.run('JSON.stringify([S.at,S.min,S.food,S.water,S.fuel,S.flags,S.notes,S.items])'),text=h.run('r.out.text'),expected=h.json('turns');if(!reader)h.run('delete S.pendingPresentation.reading;delete S.pendingPresentation.view;delete S.pendingPresentation.authoredView');let save=h.run('G.exportSave()');assert(h.run('G.load('+JSON.stringify(save)+')'));h.run("globalThis.e=D.seoulOpenEvent,r=G.resolvePresentedChoice(e,e.choices[0]),info=qaInfo(e,'outcome')");assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),text);assert.equal(h.run('JSON.stringify([S.at,S.min,S.food,S.water,S.fuel,S.flags,S.notes,S.items])'),before);assert.deepEqual(h.json('info.sceneKeys'),['seoul-han']);assert.equal(h.run('info.sceneTime'),undefined);if(reader)assert.deepEqual(h.json('r.out.turns'),expected);else assert(h.run('r.out.frozenTextOnly'));
});
