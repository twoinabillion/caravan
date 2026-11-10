const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup}=require('./fixtures/qa-cycle55-story/setup.cjs');
function fixture(){const h=setup();h.run(fs.readFileSync('src/07g-ui-home.js','utf8'));
  h.run("S.party=['minji','jaeyi'];S.recruitQ=null;S.up={};S.campMemories={};");return h;}
const model=h=>h.json('HOME.layout(HOME.state(S,D,G.campParticipants()))');
test('household places follow actual stages and capacity without stretching room art',()=>{
  const h=fixture();
  for(const id of [null,'bench','cabin','bunk','jumpseat']){
    if(id)h.run('S.up['+JSON.stringify(id)+']=true');
    const before=h.run('JSON.stringify(S)'),m=model(h);
    assert.equal(m.stage.id,h.run('G.vanStage().id'));assert.equal(m.capacity,h.run('G.seatCapacity()'));
    assert.deepEqual(m.seats.filter(s=>s.kind==='companion').map(s=>s.id),['minji','jaeyi']);
    assert.equal(m.fixedBunk,id==='bunk'||id==='jumpseat');
    assert.equal(h.run('JSON.stringify(S)'),before);
  }
});
test('a third actual companion changes shared storage; it never fabricates a waiting person',()=>{
  const h=fixture();h.run('S.up.bench=true');let m=model(h);
  assert.equal(m.seats.filter(s=>s.kind==='empty').length,1);assert(!m.seats.some(s=>s.id==='parkss'));
  const before=m.objects.find(o=>o.key==='companion:jaeyi').placement;
  h.run("S.party.push('parkss')");m=model(h);
  assert.equal(m.seats.filter(s=>s.kind==='empty').length,0);
  assert.notEqual(m.objects.find(o=>o.key==='companion:jaeyi').placement,before);
  assert.match(m.objects.find(o=>o.key==='companion:jaeyi').placement,/좌석 아래/);
  assert.match(m.aisle,/상자/);
  h.run('G.save();G.load()'); // Normalize the controlled pre-recruit fixture once.
  const saved=h.run('JSON.stringify(S)');h.run('G.save();G.load()');assert.deepEqual(model(h),m);
  assert.equal(h.run('JSON.stringify(S)'),saved);
});
test('guests share a real place without a permanent keepsake, and departure never leaves a rider',()=>{
  const h=fixture();h.run("S.party=[];S.recruitQ={id:'minji',stage:'road'}");let m=model(h);
  assert.equal(m.seats.find(s=>s.id==='minji').kind,'guest');assert(!m.objects.some(o=>o.key==='companion:minji'));
  h.run("S.recruitQ=null;S.campMemories.minji={home:'함께 들은 소리',pendingBond:2}");m=model(h);
  assert(!m.seats.some(s=>s.id==='minji'));assert(!m.objects.some(o=>o.key==='companion:minji'));
});
test('a temporary third rider also changes how the actual two companions share their belongings',()=>{
  const h=fixture();h.run("S.up.bench=true;S.recruitQ={id:'parkss',stage:'road'}");
  const m=model(h);assert.match(m.objects.find(o=>o.key==='companion:jaeyi').placement,/좌석 아래/);
  assert.equal(m.seats.find(s=>s.id==='parkss').kind,'guest');
  assert(!m.objects.some(o=>o.key==='companion:parkss'));
});
test('older over-capacity saves keep actual riders and disclose the shared place',()=>{
  const h=fixture();h.run("S.party=['minji','jaeyi','parkss','kangwoo'];S.up={}");const m=model(h);
  assert.equal(m.capacity,2);assert.equal(m.seats.filter(s=>s.kind==='companion').length,4);
  assert.equal(m.overflow,2);assert.match(m.aisle,/함께/);
  assert.equal(h.run('S.party.length'),4);
});
