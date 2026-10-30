'use strict';
// Populate scene-keys.json after independent art approval and mapping integration:
// {"lib_books":{"scene":"..."},"freq_source":{"scene":"..."},
//  "freq_triangulate":{"day":"...","night":"..."},"freq_L2":{"day":"...","night":"..."}}
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {setup,root}=require('./setup.cjs'),file=path.join(__dirname,'scene-keys.json');
if(!fs.existsSync(file))throw Error('Approved scene-keys.json required; do not infer expected art from implementation');
const keys=JSON.parse(fs.readFileSync(file));
function init(){let h=setup(),ui=fs.readFileSync(root+'/src/07-ui.js','utf8');h.run(ui.slice(ui.indexOf('  function eventSceneKeys('),ui.indexOf('  function sceneFormat('))+';globalThis.info=eventScenePresentation;');return h}
for(const id of ['lib_books','freq_source','freq_triangulate','freq_L2','freq_catch','story_generation_route'])test(id+' fresh scene with real resolver',()=>{
 let h=init(),row=keys[id];assert(row,`${id} missing expected keys`);
 for(const min of [329,330,1169,1170]){
  h.run(`S.party=['eunsu'];S.day=4;S.min=${min};S.pendingPresentation=null;globalThis.e=event('${id}');G.beginPresentation(e);globalThis.i=info(e,'event',[],[])`);
  const expected=row.scene||(min<330||min>=1170?row.night:row.day);
  assert.deepEqual(h.json('i.sceneKeys'),[expected]);
  if(!row.scene)assert.deepEqual(h.json('i.sceneTime'),{day:4,min});
  // An explicitly supplied unrelated authored cut remains authoritative.
  h.run(`globalThis.cut=info(e,'event',['seoul-core-view-v2'],[])`);
  assert.deepEqual(h.json('cut.sceneKeys'),['seoul-core-view-v2']);
 }
});
test('water tower 70-minute result uses its paid time after crossing dusk',()=>{
 let h=init(),row=keys.freq_triangulate;h.run(`S.day=4;S.min=1140;S.pendingPresentation=null;globalThis.e=event('freq_triangulate');G.beginPresentation(e);globalThis.et=buildStoryTurns(prose(e.text),e,{turnSpeakers:e.turnSpeakers}),ei=info(e,'event',[],et);G.capturePresentationView({eventId:e.id,phase:'event',turns:et,...ei,index:0});G.pickOutcome=()=>e.choices[0].out[0];globalThis.r=G.resolvePresentedChoice(e,e.choices[0]),rt=buildStoryTurns(r.out.text,e,{turnSpeakers:r.out.turnSpeakers}),ri=info(e,'outcome',[ei.sceneKeys[0]],rt)`);
 assert(h.run('r.applied'));assert.equal(h.run('S.min'),1210);assert.deepEqual(h.json('ei.sceneKeys'),[row.day]);assert.deepEqual(h.json('ri.sceneKeys'),[row.night]);assert.deepEqual(h.json('ri.sceneTime'),{day:4,min:1210});
});
