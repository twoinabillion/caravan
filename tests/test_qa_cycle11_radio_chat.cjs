const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const root=path.resolve(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle11/systems/player02/attempt01');
function load(name){const h=setup();assert(h.run(`G.load(${JSON.stringify(fs.readFileSync(path.join(root,name),'utf8'))})`));return h;}
// These focused pools make the real picker deterministic; no fixture is counted as a journey.
function radioPool(h){h.run("D.banter=[D.banter.find(b=>b.t.includes('라디오가 지직거리다 잠깐 트로트'))]");}
function wrenchPool(h){h.run("D.chats=[D.chats.find(c=>c.id==='daily-me-jaeyi-wrench')]");}
test('normal unrepaired-radio checkpoint never produces music banter before or after reload',()=>{
 const h=load('entry-290-story_personal_cache-export.json');radioPool(h);
 assert.equal(h.run('!!S.flags.radio_fixed'),false);assert.equal(h.run("S.items['라디오 진공관']||0"),0);
 const before=h.run('JSON.stringify([S.food,S.water,S.fuel,S.scrap,S.items,S.flags,S.notes])');
 assert.equal(h.run('G.pickBanter()'),null);h.run('G.save();G.load()');
 assert.equal(h.run('G.pickBanter()'),null);assert.equal(h.run('JSON.stringify([S.food,S.water,S.fuel,S.scrap,S.items,S.flags,S.notes])'),before);
});
test('an actual radio repair permits the music line and keeps that permission after save reload',()=>{
 const h=setup();radioPool(h);h.run("S.items['라디오 진공관']=1;globalThis.beforeMinute=S.day*1440+S.min;");
 assert.equal(h.run('G.fixRadio()'),true);assert.equal(h.run("S.items['라디오 진공관']"),0);assert.equal(h.run('S.day*1440+S.min-beforeMinute'),40);
 assert(h.run('G.pickBanter()'));h.run('G.save();G.load()');assert(h.run('G.pickBanter()'));assert.equal(h.run('G.fixRadio()'),false);
});
test('wrench is put away once and cannot be rediscovered on a later road or after save reload',()=>{
 const h=load('entry-265-npc_miyoung_2-export.json');wrenchPool(h);
 assert.equal(h.run("G.pickChat()?.id"),'daily-me-jaeyi-wrench');h.run('G.resetDriveTimers();G.save();G.load()');
 assert.equal(h.run('G.pickChat()'),null);assert(h.run("S._crewChatSeen['daily-me-jaeyi-wrench']"));
 h.run('G.resetDriveTimers()');assert.equal(h.run('G.pickChat()'),null);
});
test('legacy untracked wrench history is not guessed from unrelated notes or elapsed days',()=>{
 const h=load('entry-290-story_personal_cache-export.json');wrenchPool(h);
 assert.equal(h.run("!!S._crewChatSeen?.['daily-me-jaeyi-wrench']"),false);
 assert.equal(h.run('S.day'),20);assert.equal(h.run("G.pickChat()?.id"),'daily-me-jaeyi-wrench');
});
