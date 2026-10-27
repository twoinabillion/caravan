// Follow-up from a natural Gyeongju nap. Real engine fixture outcomes, finite supplies.
const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const rows=[['loc_gyeongju',0,0,300,70],['crisis_collapse',0,0,240,35],['crisis_collapse2',0,0,360,30],['exp_station',0,0,90,75],['comp_rps',0,1,25,90],['exp_icehouse',0,1,30,82],['ev_tent_village',0,0,60,85],['ev_quarry_hideout',0,0,60,82],['ev_limestone_cave',1,0,60,83],['ev_train_depot',1,0,60,82],['road_night_circle',0,0,360,54]];
function fixture([id,ci,oi],extra=''){
 const h=setup();h.run(`G.save();G.load();S.at='gyeongju';S.driving=null;S.min=500;S.fatigue=90;S.water=24;S.food=20;S._breakfastDay=S.day;S._lunchDay=S.day;S.notes=[];${['ev_limestone_cave','ev_train_depot'].includes(id)?"S.party=['minji'];":''}globalThis.e=event('${id}'),c=e.choices[${ci}],out=c.out[${oi}];G.pickOutcome=()=>out;${extra};G.beginPresentation(e);globalThis.start=S.day*1440+S.min;`);return h;
}
const pay=h=>h.run('globalThis.r=G.resolvePresentedChoice(e,c)');
const state=h=>h.run('JSON.stringify([S.day,S.min,S.fatigue,S.food,S.water,S.injuries,S.items,S.flags,S.notes,S.pendingPresentation])');
for(const row of rows)test(`authored partial sleep ${row[0]} pays its existing recovery without awake accumulation`,()=>{
 const h=fixture(row,"G.addInjury('driver','QA injury',2)");assert(h.run("G.isInjured('driver')"));pay(h);
 assert.equal(h.run('r.ok'),true);assert.equal(h.run('S.fatigue'),row[4]);assert.equal(h.run('S.day*1440+S.min-start'),row[3]);
 assert.equal(h.run('S.injuries.driver.days'),2);const after=state(h);assert(h.run('G.save();G.load()'));assert.equal(h.run('G.resolvePresentedChoice(e,c).applied'),false);assert.equal(state(h),after);
 h.run('G.queuePresentation(null)');assert.equal(h.run('S.pendingPresentation'),null);assert(h.run('G.neighbors(S.at).some(n=>G.canTravelTo(n.id).ok)'));
});
test('sleep sweep preserves fatal-midnight termination, original resource payment and no later note',()=>{
 for(const row of rows){const h=fixture(row,'S.min=1430;S.water=0;S.thirst=4;');pay(h);assert.equal(h.run('S.ended'),true,row[0]);assert.equal(h.run('S.fatigue'),90,row[0]);assert.equal(h.run('S.notes.length'),0);assert.notEqual(h.run('S.pendingPresentation?.phase'),'result');}
});
test('partial sleep still incurs missed meals and daily injury recovery without awake injury penalty',()=>{
 const h=fixture(rows[7],"S.min=380;S.food=0;S._breakfastDay=0;G.addInjury('driver','QA injury',2)");pay(h);
 assert.equal(h.run('S.hunger'),1);assert.equal(h.run('S.water'),23);assert.equal(h.run('S.fatigue'),90); // 90 + missed meal8 - authored8.
 const b=fixture(rows[7],"S.min=1430;G.addInjury('driver','QA injury',2)");pay(b);assert.equal(b.run('S.day'),2);assert.equal(b.run('S.min'),50);assert.equal(b.run('S.injuries.driver.days'),1);assert.equal(b.run('S.fatigue'),82);
});
test('old paid sleep results stay frozen; ordinary resting and a machine falling asleep stay awake',()=>{
 for(const row of rows){const h=fixture(row);h.run("S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:e.choices.indexOf(c),outcomeIndex:c.out.indexOf(out),text:'옛 지급 결과',chips:[{t:'옛 정산'}]};G.save();G.load();");const before=state(h);pay(h);assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),'옛 지급 결과');assert.equal(state(h),before);}
 for(const [id,ci,oi,want]of [['ev_meteor_shower',1,0,88.8],['exp_noraebang',0,0,91.8],['initiative_parkss_check',1,0,76.5]]){const h=fixture([id,ci,oi]);pay(h);assert(Math.abs(h.run('S.fatigue')-want)<1e-8,id);}
});
test('Leo free fallback retains Leo as the sole spoken voice in the real story reader',()=>{
 const h=setup();h.run("S.party=['leo'];globalThis.e=event('initiative_leo_pause'),o=e.choices[2].out[0]");
 assert.deepEqual(h.json("buildStoryTurns(o.text,e,{turnSpeakers:o.turnSpeakers}).filter(t=>t.kind==='dialogue').map(t=>t.who)"),['leo']);
});
