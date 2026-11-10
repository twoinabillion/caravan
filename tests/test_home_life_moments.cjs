const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup}=require('./fixtures/qa-cycle55-story/setup.cjs');
function fixture(){const h=setup();h.run(fs.readFileSync('src/07g-ui-home.js','utf8'));
  h.run(`S.party=['minji','jaeyi','parkss'];S.recruitQ=null;S.up={bench:true};S.at='miryang';
    S.day=3;S.min=1110;S.campNight=2;S.food=20;S.water=20;S.fatigue=20;S.hunger=1;
    S._campPlan={};delete S.homeLife;G.save();G.load();`);return h;}
const moment=h=>h.json('HOME.moment(HOME.state(S,D,G.campParticipants()))');
test('only one successful existing meal payment creates a frozen domestic moment',()=>{
  const h=fixture(),before=h.json('({food:S.food,water:S.water,min:S.min,seed:S.seed,bond:S.comps.minji.bond,mood:S.comps.minji.mood})');
  assert.equal(h.run("G.prepareCamp('meal').ok"),true);const record=h.json('S.homeLife');
  assert.equal(record.revision,'home-life-v1');assert.deepEqual(record.party,['minji','jaeyi','parkss']);
  assert.equal(h.run('S.food'),before.food-1);assert.equal(h.run('S.water'),before.water-1);
  assert.equal(h.run('S.min'),before.min);assert.equal(h.run('S.seed'),before.seed);
  assert.equal(h.run('S.comps.minji.bond'),before.bond);assert.equal(h.run('S.comps.minji.mood'),before.mood+3);
  assert.equal(h.run('S.fatigue'),14);assert.equal(h.run('S.hunger'),0);
  assert(record.after.some(t=>t.who==='parkss'));assert(record.after.some(t=>t.who==='jaeyi'));
  const paid=h.run('JSON.stringify(S)');assert.equal(h.run("G.prepareCamp('meal').ok"),false);
  assert.equal(h.run('JSON.stringify(S)'),paid);assert.equal(moment(h).phase,'after');
  h.run('G.save();G.load()');assert.deepEqual(h.json('S.homeLife'),record);
});
test('free inspection cannot create morning; one actual sleep keeps places and the same saved words',()=>{
  const h=fixture();h.run("G.prepareCamp('meal')");const record=h.json('S.homeLife');
  const places=h.json('HOME.layout(HOME.state(S,D,G.campParticipants()))');
  for(let i=0;i<3;i++){const before=h.run('JSON.stringify(S)');h.run('HOME.html(HOME.state(S,D,G.campParticipants()))');assert.equal(h.run('JSON.stringify(S)'),before);}
  assert.equal(moment(h).phase,'after');
  h.run('G.popTimedStory=()=>null;G.maybeCrisis=()=>false;G.camp()');
  assert.equal(h.run('S.campNight'),record.night+1);assert.equal(moment(h).phase,'morning');
  assert.deepEqual(moment(h).turns,record.morning);
  assert.deepEqual(h.json('HOME.layout(HOME.state(S,D,G.campParticipants()))').objects,places.objects);
  h.run('G.save();G.load()');assert.deepEqual(moment(h).turns,record.morning);
});
test('legacy paid meals and failed or merely opened preparation never invent a domestic record',()=>{
  const h=fixture();h.run('S._campPlan={meal:true};');assert.equal(moment(h),null);
  assert.equal(h.run("G.prepareCamp('meal').ok"),false);assert.equal(h.run('S.homeLife'),undefined);
  h.run('S._campPlan={};S.food=0');assert.equal(h.run("G.prepareCamp('meal').ok"),false);
  assert.equal(h.run('S.homeLife'),undefined);assert.equal(moment(h),null);
});
test('roster changes hide remembered speakers; guests and single companions receive their own moment',()=>{
  const h=fixture();h.run("G.prepareCamp('meal');S.party=['minji','jaeyi']");assert.equal(moment(h),null);
  h.run("S._campPlan={};S.party=[];S.recruitQ={id:'minji',stage:'road'};G.prepareCamp('meal')");
  assert.deepEqual(h.json('S.homeLife.party'),[]);assert.deepEqual(h.json('S.homeLife.participants'),['minji']);
  assert(h.json('S.homeLife.after').every(t=>!t.who||['me','minji'].includes(t.who)));
  assert.doesNotMatch(JSON.stringify(h.json('S.homeLife')),/자석 접시/);
  h.run("S.recruitQ=null");assert.equal(moment(h),null);
});
test('a new meal preserves an already-paid camp conversation verbatim',()=>{
  const h=fixture();h.run(`S.campConversation={id:'legacy-camp',night:S.campNight,cid:'minji',choiceId:'listen',
    resultText:'옛 지급 문장',chips:[{t:'15분 경과'}],reading:{view:{turns:[{text:'저장된 말',who:'minji'}],index:1}}};`);
  const old=h.run('JSON.stringify(S.campConversation)');h.run("G.prepareCamp('meal')");
  assert.equal(h.run('JSON.stringify(S.campConversation)'),old);
  h.run('G.save();G.load()');assert.equal(h.run('S.campConversation.resultText'),'옛 지급 문장');
});
test('the next paid meal carries an established place-sharing habit rather than replaying its introduction',()=>{
  const h=fixture();h.run("G.prepareCamp('meal')");const old=h.json('S.homeLife');
  h.run('G.popTimedStory=()=>null;G.maybeCrisis=()=>false;G.camp()');
  assert.equal(h.run("G.prepareCamp('meal').ok"),true);const next=h.json('S.homeLife');
  assert.equal(next.night,old.night+1);assert(next.after.length<old.after.length);
  assert.equal(moment(h).phase,'after');
});
test('a blocked or fatal sleep never produces a morning memory',()=>{
  const h=fixture();h.run("G.prepareCamp('meal');G.popTimedStory=()=>({id:'still-awake'});G.openEventById=()=>true;G.camp()");
  assert.equal(moment(h).phase,'after');assert.equal(h.run('S.campNight'),2);
  h.run("G.popTimedStory=()=>null;S.at=null;S.min=1439;S.water=0;S.thirst=2;G.camp()");
  assert.equal(h.run('S.ended'),true);assert.equal(moment(h),null);assert.equal(h.run('S.campNight'),2);
});
test('stale, future, malformed and absent-speaker records remain hidden without rewriting saved data',()=>{
  const h=fixture();h.run("G.prepareCamp('meal')");const original=h.json('S.homeLife');
  for(const patch of [{revision:'future'},{day:100},{night:100},{after:[{who:'absent',text:'없는 사람'}]},{after:null}]){
    h.run('S.homeLife='+JSON.stringify({...original,...patch}));const before=h.run('JSON.stringify(S)');
    assert.equal(moment(h),null);assert.equal(h.run('JSON.stringify(S)'),before);
  }
});
