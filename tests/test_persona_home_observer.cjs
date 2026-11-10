// Controlled observation probes, not fresh players or browser quality checks.
const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('./fixtures/qa-cycle55-story/setup.cjs');
const observer=require('../tools/persona-observer.cjs');
function fixture(){const h=setup();h.run("S.party=[];S.up={};S.recruitQ=null;S.roadGarage=false;S.scrap=100;S.items['부품']=10;");return {h,G:h.run('G'),D:h.run('D'),S:h.run('S')};}
test('upgrade choices expose the real displayed road price, prerequisites and construction time',()=>{
  const {h,G,D,S}=fixture();
  assert.equal(typeof observer.upgradeOptions,'function');
  let rows=observer.upgradeOptions(G,D,S),collector=rows.find(r=>r.id==='collector');
  assert.deepEqual(collector.cost,{scrap:15,parts:0});assert.equal(collector.minutes,200);
  assert.equal(collector.description,'매일 아침 물 +1 (비·폭풍 +2) · 지붕 자리 사용');
  h.run('S.roadGarage=true');rows=observer.upgradeOptions(G,D,S);
  assert.equal(rows.find(r=>r.id==='collector').cost.scrap,23,'same quote the actual road garage charges');
  const cabin=rows.find(r=>r.id==='cabin');assert.deepEqual(cabin.requirements,[{id:'bench',name:'후미 레일 좌석칸',owned:false},{id:'susp',name:'서스펜션 강화',owned:false}]);
  assert.equal(cabin.minutes,300);assert.equal(cabin.status.ok,false);
});
test('current mechanic and engineering ownership change the actual visible quote',()=>{
  const {h,G,D,S}=fixture();h.run("S.party=['minji'];S.up={bench:true,susp:true}");
  const cabin=observer.upgradeOptions(G,D,S).find(r=>r.id==='cabin');
  assert.equal(cabin.minutes,225);assert(cabin.requirements.every(r=>r.owned));assert(cabin.status.ok);
});
test('public roof and rear occupancy identify actual mutually exclusive parts',()=>{
  const {h,G,D,S}=fixture();h.run('S.up={garden:true,collector:true,antenna:true,jumpseat:true,tank1:true,susp:true}');
  const rows=observer.upgradeOptions(G,D,S),solar=rows.find(r=>r.id==='solar'),tank=rows.find(r=>r.id==='tank2');
  assert.deepEqual(solar.slot,{id:'roof',name:'지붕',cap:3,used:3,installed:[{id:'garden',name:'지붕 텃밭'},{id:'collector',name:'빗물 집수기'},{id:'antenna',name:'장거리 안테나'}]});
  assert.equal(solar.status.ok,false);assert.equal(tank.slot.used,1);assert.deepEqual(tank.slot.installed,[{id:'jumpseat',name:'후미 서비스칸'}]);assert.equal(tank.status.ok,false);
});
test('home status observes earned capacity, stage, rations and real guest identities',()=>{
  const {h,G,D,S}=fixture();assert.equal(typeof observer.homeStatus,'function');
  const empty=observer.homeStatus(G,D,S);assert.equal(empty.stage.id,'base');assert.equal(empty.seatCapacity,2);assert.deepEqual(empty.installed,[]);
  h.run("S.party=['minji','jaeyi'];S.recruitQ={id:'leo',stage:'road'};S.up={bench:true,cabin:true,susp:true};");
  const home=observer.homeStatus(G,D,S);assert.equal(home.stage.id,'cabin');assert.equal(home.stage.extensionCm,110);assert.equal(home.seatCapacity,4);
  assert.deepEqual(home.participants,[{id:'minji',name:'민지',guest:false},{id:'jaeyi',name:'재이',guest:false},{id:'leo',name:'레오',guest:true}]);
  assert.deepEqual(home.capacity,{fuel:70,food:24,water:28});assert.equal(home.rations.foodPerDay,5);assert.equal(home.rations.waterPerDay,3);
});
test('observation is immutable, cannot pay an upgrade or expose future outcomes',()=>{
  const {h,G,D,S}=fixture(),before=h.run('JSON.stringify(S)'),registry=h.run('JSON.stringify(D.upgrades)');
  const rows=observer.upgradeOptions(G,D,S),home=observer.homeStatus(G,D,S);
  assert.deepEqual(Object.keys(rows[0]).sort(),['cost','description','id','installation','minutes','name','owned','requirements','slot','status'].sort());
  rows[0].cost.scrap=0;rows[0].status.ok=false;home.participants.push({id:'unknown'});home.installed.push({id:'unearned'});
  assert.equal(h.run('JSON.stringify(S)'),before);assert.equal(h.run('JSON.stringify(D.upgrades)'),registry);
});
