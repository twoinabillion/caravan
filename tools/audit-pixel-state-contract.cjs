'use strict';
/* Baseline evidence for future pixel presentation adapters. Runs the actual
   engine in isolated memory/localStorage; never opens or alters a user save.
   This does NOT implement/approve the production visual migration. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {setup,engineFiles}=require('../qa-artifacts/qa-cycle-20261026/cycle15/story/repair/setup.cjs');
const out='qa-artifacts/pixel-workshop-20261106';
const report={scope:'actual engine/ownership baseline in isolated VM; no new pixel renderer or visual approval',checks:[]};
const record=(name,evidence)=>report.checks.push({name,...evidence});
function fresh(){
 const h=setup();
 h.run("S.at='miryang';S.driving=null;S.party=['minji'];S.recruitQ=null;S.day=4;S.min=1200;S._campPlan={};S.campNight=3;S.campConversation=null;S.food=8;S.water=8;S.items['부품']=3;S.van=60;S.vanMax=100;S.fatigue=40;S.hunger=1");
 return h;
}
const state=h=>h.run('JSON.stringify(S)');
const storage=h=>JSON.stringify([...h.store]);
const h=fresh();
h.run(fs.readFileSync('src/07g-ui-home.js','utf8'));
const ids=h.json('Object.keys(D.comps)');
let rosterCases=0;
for(let mask=0;mask<(1<<ids.length);mask++){
 const party=ids.filter((_,i)=>mask&(1<<i));
 for(const stage of [null,'task','road','follow','ready']){
  h.run('S.party='+JSON.stringify(party)+';S.recruitQ='+JSON.stringify(stage?{id:'minji',stage}:null));
  const before=state(h),saved=storage(h),available=h.json('G.campParticipants()');
  const expected=stage&&['road','follow','ready'].includes(stage)?[...new Set([...party,'minji'])]:party;
  assert.deepEqual(available,expected);
  assert.equal(state(h),before);assert.equal(storage(h),saved);
  rosterCases++;
 }
}
record('camp participants come from the actual engine owner',{cases:rosterCases,includesRecruitmentGuestOnlyAt:['road','follow','ready'],readOnly:true});
h.run('S.party=[];S.recruitQ=null');
assert.deepEqual(h.json('G.campParticipants()'),[]);
record('no ambient Minji on an empty camp roster',{participants:[]});

let homeCases=0;
for(let mask=0;mask<(1<<ids.length);mask++){
 const party=ids.filter((_,i)=>mask&(1<<i));
 h.run('S.party='+JSON.stringify(party)+";S.campMemories=Object.fromEntries(Object.keys(D.comps).map(id=>[id,{home:'실제로 저장된 기억'}]))");
 const before=state(h),saved=storage(h);
 const markup=h.run('HOME.html({scene:"room.webp",party:S.party,up:S.up,memories:S.campMemories,keepsakes:D.companionKeepsakes,upgrades:D.upgrades})');
 const physical=[...markup.matchAll(/data-home-prop="companion:([^"]+)"/g)].map(m=>m[1]).sort();
 const memories=[...markup.matchAll(/data-home-object="memory:([^"]+)"/g)].map(m=>m[1]).sort();
 assert.deepEqual(physical,[...party].sort());
 assert.deepEqual(memories,ids.filter(id=>!party.includes(id)).sort());
 assert.equal(state(h),before);assert.equal(storage(h),saved);homeCases++;
}
record('departed companion memories never become physical room props',{cases:homeCases,readOnly:true});
h.run("S.party=[];S.up={bench:true,cabin:true,bunk:true};S.campMemories={}");
const home=h.run('HOME.html({scene:"room.webp",party:S.party,up:S.up,memories:S.campMemories,keepsakes:D.companionKeepsakes,upgrades:D.upgrades})');
const physicalFurniture=[...home.matchAll(/data-home-prop="(upgrade:[^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(physicalFurniture,['upgrade:bunk']);
record('sleeping furniture replacement has one physical owner',{visible:physicalFurniture});

const repair=fresh(),repairClock=repair.json('[S.day,S.min]');
repair.run("globalThis.result=G.prepareCamp('repair')");
assert(repair.run('result.ok'));assert.deepEqual(repair.json('[S.day,S.min]'),repairClock);
assert.equal(repair.run("S.items['부품']"),2);assert.equal(repair.run('S.van'),60);
assert.deepEqual(repair.json('S._campPlan'),{repair:true,last:'repair'});
const afterRepair=state(repair),repairStore=storage(repair);
repair.run("globalThis.repeat=G.prepareCamp('repair')");
assert.equal(repair.run('repeat.ok'),false);assert.equal(state(repair),afterRepair);assert.equal(storage(repair),repairStore);
record('repair flag means prepared/paid maintenance, not an ongoing timed job',{partsDelta:-1,immediateHullDelta:0,clockDelta:0,duplicateRejected:true,renderRule:'show prepared/settled state; actual hull recovery remains owned by sleep'});

const meal=fresh(),mealClock=meal.json('[S.day,S.min]');
meal.run("globalThis.result=G.prepareCamp('meal')");
assert(meal.run('result.ok'));assert.deepEqual(meal.json('[S.food,S.water,S.hunger]'),[7,7,0]);
assert.deepEqual(meal.json('[S.day,S.min]'),mealClock);
const afterMeal=state(meal),mealStore=storage(meal);
meal.run("globalThis.repeat=G.prepareCamp('meal')");
assert.equal(meal.run('repeat.ok'),false);assert.equal(state(meal),afterMeal);assert.equal(storage(meal),mealStore);
record('meal flag is the already-consumed meal',{foodDelta:-1,waterDelta:-1,clockDelta:0,duplicateRejected:true,renderRule:'a new frame or dialogue page must not consume food/water again or imply unpaid cooking progress'});

const talk=fresh(),talkClock=talk.json('[S.day,S.min]');
talk.run("globalThis.prepared=G.prepareCamp('talk','minji'),ev=G.campConversationEvent()");
assert(talk.run('prepared.ok'));assert.equal(talk.run('S.campConversation.choiceId'),null);
assert.deepEqual(talk.json('[S.day,S.min]'),talkClock);
const beforeReading=state(talk),beforeReadingStore=storage(talk);
for(let i=0;i<20;i++)talk.run('G.campConversationEvent();G.campParticipants();G.currentCampConversation()');
assert.equal(state(talk),beforeReading);assert.equal(storage(talk),beforeReadingStore);
talk.run('globalThis.paid=G.resolveCampChoice(ev.id,ev.choices[0].id)');
assert(talk.run('paid.applied'));assert.equal(talk.run('S.min'),talkClock[1]+15);
const selected=talk.run('S.campConversation.choiceId'),saved=talk.run('G.exportSave()');
assert(talk.run('G.load('+JSON.stringify(saved)+')'));
const reloaded=state(talk),reloadedStore=storage(talk);
talk.run('globalThis.ev=G.campConversationEvent(),replayed=G.resolveCampChoice(ev.id,'+JSON.stringify(selected)+')');
assert.equal(talk.run('replayed.applied'),false);assert.equal(state(talk),reloaded);assert.equal(storage(talk),reloadedStore);
record('dialogue reading is free, explicit choice owns time and paid result survives reload',{readPasses:20,readStateAndStorageUnchanged:true,chosenMinutes:15,replayApplied:false,renderRule:'advance text manually; never resolve a choice or charge time from animation/face changes'});
talk.run('S.campNight++');
assert.equal(talk.run('G.currentCampConversation()'),null);
record('old-night conversation is not current work',{expiredConversation:null});

report.sourceHashes=Object.fromEntries([...new Set([...engineFiles,'src/07g-ui-home.js'])].map(path=>[path,crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')]));
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(out+'/state-contract.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({checks:report.checks.length,rosterCases,homeCases,output:out+'/state-contract.json'}));
