const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),zlib=require('node:zlib'),crypto=require('node:crypto');
const {setup}=require('./fixtures/qa-cycle55-story/setup.cjs');
function fixture(){const h=setup(),bytes=fs.readFileSync(__dirname+'/fixtures/moving-home/park-escort-task.json.gz');
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),require('./fixtures/moving-home/park-provenance.json').sha256);
  h.run(fs.readFileSync('src/07g-ui-home.js','utf8'));h.run('S='+zlib.gunzipSync(bytes).toString()+';G.save();G.load()');return h;}
test('a naturally accepted escort is physically in HOME before camp-story eligibility',()=>{
  const h=fixture();assert.deepEqual(h.json('S.party'),[]);assert.equal(h.run('S.recruitQ.stage'),'task');assert.equal(h.run('S.recruitQ.escort'),true);
  const before=h.run('JSON.stringify(S)');assert.deepEqual(h.json('G.campParticipants()'),[],'task conversation premises remain gated');
  assert.deepEqual(h.json('G.homeParticipants()'),['parkss']);
  const html=h.run('HOME.html(HOME.state(S,D,G.homeParticipants()))');
  assert.match(html,/data-home-resident="parkss"/);assert.match(html,/임시 동행/);
  assert.doesNotMatch(html,/data-home-prop="companion:parkss"/);assert.equal(h.run('JSON.stringify(S)'),before);
});
test('a new meal for the natural task escort never freezes solo wording or invents their permanent tin',()=>{
  const h=fixture(),paid=h.run('JSON.stringify(S.pendingPresentation)');assert.equal(h.run("G.prepareCamp('meal').ok"),true);
  assert.deepEqual(h.json('S.homeLife.party'),[]);assert.deepEqual(h.json('S.homeLife.participants'),['parkss']);
  assert.doesNotMatch(h.run('JSON.stringify(S.homeLife)'),/그릇 하나|혼자 쓰던|진료 깡통/);
  const record=h.json('S.homeLife');h.run('G.save();G.load()');assert.deepEqual(h.json('S.homeLife'),record);
  assert.equal(h.run('JSON.stringify(S.pendingPresentation)'),paid);
  assert.equal(h.run('HOME.moment(HOME.state(S,D,G.homeParticipants())).phase'),'after');
});
test('only actual escort contracts or riding stages add a temporary household member',()=>{
  const h=fixture();
  for(const [q,expected]of [[{id:'parkss',stage:'task',escort:false},[]],[{id:'parkss',stage:'offer',escort:true},[]],
    [{id:'unknown',stage:'task',escort:true},[]],[{id:'minji',stage:'task',escort:true},['minji']],
    [{id:'parkss',stage:'road'},['parkss']],[{id:'parkss',stage:'follow'},['parkss']],[{id:'parkss',stage:'ready'},['parkss']]]){
    h.run('S.recruitQ='+JSON.stringify(q));assert.deepEqual(h.json('G.homeParticipants()'),expected);
  }
  h.run("S.party=['parkss'];S.recruitQ={id:'parkss',stage:'task',escort:true}");assert.deepEqual(h.json('G.homeParticipants()'),['parkss']);
});
