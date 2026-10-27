const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('../qa-artifacts/qa-cycle-20261026/cycle15/story/repair/setup.cjs');
function fixture(pair=false){const h=setup();h.run(`S.party=${JSON.stringify(pair?['minji','jaeyi']:['minji'])};globalThis.chat=D.chats.find(c=>c.lines.some(l=>l[1].includes(${JSON.stringify(pair?'민지 인증':'손에 기름이 안 빠지네')})));D.chats=[chat];delete S._crewChatSeen;`);assert(h.run('!!chat'));return h;}
test('same-day soap conversation cannot repeat after timer reset, save/load or import',()=>{
 const h=fixture();assert(h.run('!!G.pickChat()'));h.run('G.resetDriveTimers()');assert.equal(h.run('G.pickChat()'),null);h.run('G.load()');assert.equal(h.run('G.pickChat()'),null);const raw=h.run('G.exportSave()');assert(h.run('G.importSave('+JSON.stringify(raw)+').ok'));assert.equal(h.run('G.pickChat()'),null);
});
test('the one-companion chat stamp is saved immediately, even without a pair relation reward',()=>{
 const h=fixture();assert(h.run('!!G.pickChat()'));h.run('S.min+=7;G.load()');assert.equal(h.run('G.pickChat()'),null);
});
test('a public departure preserves the same-day chat stamp',()=>{
 const h=fixture();assert(h.run('!!G.pickChat()'));assert.equal(h.run("G.startTravel('yangsan')"),true);assert(h.run('!!S.driving'));assert.equal(h.run('G.pickChat()'),null);h.run('G.load()');assert.equal(h.run('G.pickChat()'),null);
});
test('a new day can replay ordinary conversation without manually resetting timers',()=>{
 const h=fixture();assert(h.run('!!G.pickChat()'));assert.equal(h.run('G.pickChat()'),null);h.run('S.day++');assert(h.run('!!G.pickChat()'));assert.equal(h.run('G.pickChat()'),null);
});
test('new journey and legacy missing stamp are eligible, with no cross-journey leak',()=>{
 const h=fixture();assert(h.run('!!G.pickChat()'));h.run("G.newGame('onroad','새 여행','interactive');S.party=['minji'];S.opening.completed=true");assert(h.run('!!G.pickChat()'));h.run('delete S._crewChatSeen;G.save();G.load()');assert(h.run('!!G.pickChat()'));
});
test('daily suppression does not multiply the existing once-per-pair relation reward',()=>{
 const h=fixture(true);const start=h.run("G.relation('minji','jaeyi')");assert(h.run('!!G.pickChat()'));const first=h.run("G.relation('minji','jaeyi')");assert.equal(first,start+1);h.run('G.load()');assert.equal(h.run('G.pickChat()'),null);h.run('S.day++');assert(h.run('!!G.pickChat()'));assert.equal(h.run("G.relation('minji','jaeyi')"),first);
});
test('once arc priority and lifetime completion survive daily filtering and reload',()=>{
 const h=fixture(true);h.run("D.chats.push({id:'fixture-arc',arc:'continuity',once:true,need:{comp:'minji'},lines:[['minji','첫 확인']]})");assert.equal(h.run('G.pickChat().id'),'fixture-arc');assert(h.run('!!G.pickChat()'));assert.equal(h.run('G.pickChat()'),null);h.run('G.load();S.day++');assert(h.run('!!G.pickChat()'));assert.equal(h.run('G.pickChat()'),null);assert(h.run("!!S._crewChatSeen['fixture-arc']"));
});
test('fully consumed chat pool returns null without modifying clocks, resources, RNG or banter choice',()=>{
 const h=fixture();assert(h.run('!!G.pickChat()'));const before=h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.fuel,S.scrap,S.seed])');h.run('G.resetDriveTimers();globalThis.oldRng=rng;rng=()=>{throw Error("empty chat pool must not sample")};globalThis.oldBanter=G.pickBanter;G.pickBanter=()=>{throw Error("no new fallback")};');assert.equal(h.run('G.pickChat()'),null);assert.equal(h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.fuel,S.scrap,S.seed])'),before);h.run('rng=oldRng;G.pickBanter=oldBanter');
});
