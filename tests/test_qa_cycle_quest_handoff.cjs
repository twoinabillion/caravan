// Engine/production UI callback contracts. Root owns real browser verification.
const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,button,snap}=require('../qa-artifacts/qa-cycle-20261026/cycle4/systems/quest-handoff.cjs');
test('normal active procurement survives ordinary hub, market, tabs, leave and reload without handoff',()=>{
 const h=fixture(),before=snap(h);assert(h.run('G.questReady()'));assert.equal(h.run("S.items['부품']"),17);
 for(const mode of ['hub','market','garage','people','alley','hub','market']){h.run(`showStl('daegu','${mode}')`);assert.deepEqual(snap(h),before,mode+' must only show a decision surface');}
 h.run("showStl('daegu','market',{previewOnly:true,questId:S.quest.ledgerId});leaveSettlement();");assert.deepEqual(snap(h),before);
 assert(h.run('G.save();G.load()'));assert.deepEqual(snap(h),before);assert.equal(h.run('G.canTravelTo(\'gumi\').ok'),true);
});
test('explicit production market handoff consumes two carried parts and pays 24 once across reload',()=>{
 const h=fixture(),before=snap(h);button(h);h.run('button.onclick()');
 assert.equal(h.run('S.quest'),null);assert.equal(h.run("S.items['부품']"),15);assert.equal(h.run('S.scrap'),before.scrap+24);
 assert.equal(h.run('S.questLedger.completed.length'),before.completed.length+1);assert.match(h.run('S.questLedger.completed.at(-1).expected'),/24/);
 const paid=snap(h);h.run('button.onclick()');assert.deepEqual(snap(h),paid);assert.equal(h.run('G.checkQuest()'),false);assert(h.run('G.load()'));assert.deepEqual(snap(h),paid);
 h.run("showStl('daegu','hub');showStl('daegu','market');leaveSettlement()");assert.deepEqual(snap(h),paid);
});
test('unready procurement and wrong destination cannot be handed in through stale enabled buttons',()=>{
 for(const mode of ['parts','location']){const h=fixture();h.run(mode==='parts'?"S.items['부품']=1":"S.at='miryang'");const before=snap(h);button(h);h.run('button.onclick()');assert.deepEqual(snap(h),before);assert.equal(h.run('G.checkQuest()'),false);}
});
test('explicit story handoff exposes but does not accept its next stage; paid and accepted snapshots reload',()=>{
 const h=fixture();h.run("S.quest=null;S.questFollowup=null;S.storyQuests={active:null,completed:[]};globalThis.chain=D.storyQuestChains[0];G.acceptQuest(G.makeStoryQuest(chain,1,'miryang','daegu','miryang',[]));");
 const active=snap(h);h.run("showStl('daegu','market');leaveSettlement()");assert.deepEqual(snap(h),active);button(h);h.run('button.onclick()');
 assert.equal(h.run('S.quest'),null);assert.equal(h.run('S.questFollowup.story.stage'),2);const paid=snap(h);assert(h.run('G.load()'));assert.deepEqual(snap(h),paid);
 h.run("showStl('daegu','hub');showStl('daegu','market')");assert.deepEqual(snap(h),paid);
 const next=h.json('S.questFollowup');button(h,{kind:'quest',quest:next});h.run('button.onclick()');assert.equal(h.run('S.quest.story.stage'),2);assert.equal(h.run('S.questFollowup'),null);const accepted=snap(h);assert(h.run('G.load()'));assert.deepEqual(snap(h),accepted);
});
for(const legacy of [false,true])test(`ended journey preserves quest, items and archive through ${legacy?'legacy':'current'} handoff and ordinary entry`,()=>{
 const h=fixture();button(h,{legacy});h.run('S.min=1430;S.water=0;S.thirst=3;G.advance(40);calls.length=0;');assert(h.run('S.ended'));
 const ended=snap(h),archive=h.store.get('seoul400_quality_archive_v1');h.run('button.onclick()');assert.deepEqual(snap(h),ended);assert.deepEqual(h.json('calls'),[]);
 assert.equal(h.run('G.checkQuest()'),false);h.run("showStl('daegu','hub');showStl('daegu','market');");assert.deepEqual(snap(h),ended);assert.deepEqual(h.json('calls'),[]);assert.equal(h.store.get('seoul400_quality_archive_v1'),archive);assert(!h.store.has('seoul400_save_v1'));
});
test('absent game rejects quest handoff and settlement entry safely',()=>{const h=fixture();h.run('S=null;calls.length=0');assert.equal(h.run('G.checkQuest()'),false);h.run("showStl('daegu','hub')");assert.deepEqual(h.json('calls'),[]);});
