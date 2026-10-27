const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const checkpoint=path.resolve(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle12/systems/player02/attempt01/entry-354-story_bridge_child_voice-export.json');
function select(h,prefix){h.run(`D.banter=[D.banter.find(b=>b.t.startsWith(${JSON.stringify(prefix)}))]`);assert.equal(h.run('D.banter.filter(Boolean).length'),1);}
// Explicit boundary fixtures: these states are not counted as natural journeys.
function at(prefix,minute){const h=setup();select(h,prefix);h.run(`S.min=${minute};S.wx='clear';const nd=D.banter[0].need||{};S.party=[nd.comp,nd.comp2].filter(Boolean);if(nd.flag)S.flags[nd.flag]=true;if(nd.up)S.up[nd.up]=true;G.resetDriveTimers();`);return h;}
test('the real morning checkpoint does not describe a setting sun, including after reload',()=>{
 const h=setup();assert(h.run(`G.load(${JSON.stringify(fs.readFileSync(checkpoint,'utf8'))})`));select(h,'지는 해가');
 assert.equal(h.run('S.day'),10);assert(h.run('S.min<9*60'));assert.equal(h.run('G.pickBanter()'),null);
 const before=h.run('JSON.stringify([S.day,S.min,S.items,S.flags,S.notes,S.party,S.fuel,S.food,S.water,S.scrap])');
 h.run('G.save();G.load()');assert.equal(h.run('G.pickBanter()'),null);
 assert.equal(h.run('JSON.stringify([S.day,S.min,S.items,S.flags,S.notes,S.party,S.fuel,S.food,S.water,S.scrap])'),before);
});
const cases=[
 ['setting sun','지는 해가',[330,505,1019.999,1170,1439.999],[1020,1080,1169.999]],
 ['approaching two oclock','새벽 두 시 다 돼가요',[0,89.999,120,1350],[90,119.999]],
 ['approaching noon','정오가 가까워질수록',[0,659.999,720,1350],[660,719.999]],
 ['already woke at three today','오늘 새벽 세 시에 또 깼어요',[0,179.999,330],[180,329.999,1170,1439.999]],
 ['sunlight reaches the solar panel','햇빛이 들자 태양광',[0,329.999,1170,1439.999],[330,720,1169.999]],
 ['clouds uncover the solar panel','구름이 걷히자 패널',[0,329.999,1170,1439.999],[330,720,1169.999]],
 ['moving daytime cloud shadows','도로 위로 구름 그림자가',[0,329.999,1170,1439.999],[330,720,1169.999]]
];
for(const [name,prefix,blocked,allowed] of cases)test(name+' follows actual clock boundaries before and after reload',()=>{
 for(const minute of blocked){const h=at(prefix,minute);assert.equal(h.run('G.pickBanter()'),null,`${name} must not play at${minute}`);h.run('G.save();G.load()');assert.equal(h.run('G.pickBanter()'),null);}
 for(const minute of allowed){const h=at(prefix,minute);assert(h.run('G.pickBanter()'),`${name} must remain reachable at${minute}`);h.run('G.save();G.load()');assert(h.run('G.pickBanter()'),`${name} must survive reload at${minute}`);}
});
test('time windows keep companion, story flag and owned-panel requirements',()=>{
 const dj=at('새벽 두 시 다 돼가요',100);dj.run('S.party=[]');assert.equal(dj.run('G.pickBanter()'),null);
 dj.run("S.party=['eunsu'];delete S.flags.dj_met");assert.equal(dj.run('G.pickBanter()'),null);
 const noon=at('정오가 가까워질수록',700);noon.run('delete S.flags.mingyu_alive');assert.equal(noon.run('G.pickBanter()'),null);
 const solar=at('햇빛이 들자 태양광',720);solar.run('delete S.up.solar');assert.equal(solar.run('G.pickBanter()'),null);
});
test('untimed scenery and existing weather gates remain available as before',()=>{
 assert(at('백미러에 매단 열쇠고리',0).run('G.pickBanter()'));
 const rain=at('와이퍼가 삐걱거리며 비를',720);assert.equal(rain.run('G.pickBanter()'),null);rain.run("S.wx='rain'");assert(rain.run('G.pickBanter()'));
 const fog=at('안개가 전조등 불빛까지',720);assert.equal(fog.run('G.pickBanter()'),null);fog.run("S.wx='fog'");assert(fog.run('G.pickBanter()'));
});
