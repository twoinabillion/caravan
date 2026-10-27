const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
function fixture(){
 const h=setup(),ui=fs.readFileSync('src/07-ui.js','utf8');
 h.run(ui.slice(ui.indexOf('  function eventSceneKeys('),ui.indexOf('  function sceneFormat(')));
 h.run('G.save();G.load();');
 return h;
}
test('ordinary companion scene no longer depicts a fixed absent party member',()=>{
 const h=fixture();
 for(const party of [['minji','kangwoo'],['minji','eunsu','jaeyi'],['leo','parkss']]){
  h.run(`S.party=${JSON.stringify(party)}`);
  assert.deepEqual(h.json("eventSceneKeys(event('comp_van_name'))"),['companion-cabin-detail-v1']);
 }
 assert.deepEqual(h.json("D.sceneAssetMeta['companion-cabin-detail-v1'].companions"),[]);
 assert(h.run("!!D.scenes['event-companion-van']"),'historical scene key remains available');
});
test('specific companion and terminal stills take precedence over neutral cabin fallback',()=>{
 const h=fixture();
 for(const [id,key] of [['comp_hometown','companion-road-atlas-v1'],['comp_cloudgame','companion-window-clouds-v1'],['ev_leo_solo','recruit-leo-follow'],['story_bridge_departure_echo','story-roadside-terminal-detail-v2'],['story_bridge_child_voice','story-roadside-terminal-detail-v2']])
  assert.deepEqual(h.json(`eventSceneKeys(event('${id}'))`),[key]);
});
test('shared companion family art requires its pictured crew and working radio',()=>{
 const h=fixture();
 for(const [id,party,radio,key] of [
  ['comp_food_debate',['leo','parkss'],false,'companion-cabin-detail-v1'],
  ['comp_food_debate',['minji','jaeyi'],false,'event-companion-meal'],
  ['comp_tire_class',['minji'],false,'companion-cabin-detail-v1'],
  ['comp_tire_class',['minji','jaeyi'],false,'event-companion-repair'],
  ['comp_radio_war',['minji','eunsu'],false,'companion-cabin-detail-v1'],
  ['comp_radio_war',['minji','eunsu'],true,'event-companion-radio'],
  ['comp_snore',['minji','jaeyi'],false,'companion-cabin-detail-v1'],
  ['comp_snore',['minji','jaeyi','kangwoo'],false,'event-companion-camp']
 ]){
  h.run(`S.party=${JSON.stringify(party)};S.flags.radio_fixed=${radio}`);
  assert.deepEqual(h.json(`eventSceneKeys(event('${id}'))`),[key],`${id}/${party}/${radio}`);
 }
});
test('saved entry and paid reader scene keys survive loading without remapping or repayment',()=>{
 for(const phase of ['event','outcome']){
  const h=fixture();h.run("S.party=['minji','kangwoo'];globalThis.e=event('comp_food_debate');G.beginPresentation(e);");
  if(phase==='outcome')h.run('G.resolvePresentedChoice(e,e.choices[0]);');
  h.run(`G.capturePresentationView({eventId:e.id,phase:'${phase}',turns:[{kind:'narration',text:'보존할 옛 장면'}],sceneKeys:['event-companion-van'],index:0});`);
  const receipt=h.json('G.validatePresentation(S.pendingPresentation)'),state=h.json('[S.day,S.min,S.food,S.water,S.scrap,S.flags,S.notes,S.comps]');
  assert(h.run('G.save();G.load();'));
  h.run(`globalThis.restored={eventId:e.id,phase:'${phase}'};G.restorePresentationView(restored);`);
  assert.deepEqual(h.json('restored.sceneKeys'),['event-companion-van']);
  assert.equal(h.run('restored.turns[0].text'),'보존할 옛 장면');
  if(phase==='outcome')assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[0]).applied'),false);
  assert.deepEqual(h.json('S.pendingPresentation'),receipt);
  assert.deepEqual(h.json('[S.day,S.min,S.food,S.water,S.scrap,S.flags,S.notes,S.comps]'),state);
 }
});
