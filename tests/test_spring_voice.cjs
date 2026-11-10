const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),zlib=require('node:zlib'),crypto=require('node:crypto');
const {setup,pay,state}=require('./fixtures/qa-cycle55-story/setup.cjs');
const dir='tests/fixtures/natural-flow-spring/',raw=name=>zlib.gunzipSync(fs.readFileSync(dir+name)).toString();
function view(h){h.run("globalThis.e=G.presentationEvent('loc_spring'),entry=qaEntry(e),info=qaInfo(e,'event',[],entry)");}
function fresh(){const h=setup();h.run("S.party=[];S.pendingPresentation=null;S.driving=null;S.water=20;S.food=20;S.min=600;globalThis.e=G.presentationEvent('loc_spring');G.beginPresentation(e)");view(h);return h;}
function historical(name){const h=setup();assert(h.run(`G.load(${JSON.stringify(raw(name))})`));view(h);return h;}
test('a new solo hot-spring sigh belongs to the player, without introducing another person',()=>{
  const h=fresh(),result=pay(h,0);
  assert.equal(result.turns[0].who,'me');assert.equal(result.turns[0].text,'으어어어…');
  assert(result.turns.slice(1).every(t=>t.kind==='narration'));
  assert(!result.turns.some(t=>t.name==='???'||t.who==='passer_man'));
  assert.equal(h.run('S.party.length'),0);
});
test('new voice retains the exact words, time, resources and note of the legacy choice',()=>{
  const h=fresh(),old=fresh();old.run('delete S.pendingPresentation.narrativeRevision');view(old);
  const revised=pay(h,0),legacy=pay(old,0);
  assert.equal(revised.text,legacy.text);assert.deepEqual(revised.chips,legacy.chips);assert.deepEqual(state(h),state(old));
  const saved=h.run('G.exportSave()'),before=state(h),turns=revised.turns;
  assert(h.run(`G.load(${JSON.stringify(saved)})`));view(h);const replay=pay(h,0);
  assert.equal(replay.applied,false);assert.deepEqual(replay.turns,turns);assert.deepEqual(state(h),before);
});
for(const name of ['normal-unpaid-287-loc_spring.json.gz','entry-after-view-287-loc_spring.json.gz'])test(name+' keeps the historical unanswered edition',()=>{
  const old=historical(name),unknown=historical(name);unknown.run("S.pendingPresentation.narrativeRevision='unknown-spring'");view(unknown);
  const a=pay(old,0),b=pay(unknown,0);assert.deepEqual(a.turns,b.turns);
  assert.equal(a.turns[0].who,'passer_man','an old unanswered owner is never silently upgraded');
});
for(const textOnly of [false,true])test('natural paid hot-spring reader stays frozen '+textOnly,()=>{
  const h=historical('scene-loc_spring-result-288.json.gz');
  if(textOnly){h.run('delete S.pendingPresentation.reading;delete S.pendingPresentation.view;delete S.pendingPresentation.authoredView');view(h);}
  const before=state(h),result=pay(h,0);assert.equal(result.applied,false);
  assert.equal(result.turns[0].who,'passer_man');assert.deepEqual(state(h),before);
});
test('natural fixture compressed and logical bytes retain their original provenance',()=>{
  for(const [name,row]of Object.entries(require('./fixtures/natural-flow-spring/provenance.json').files)){
    const bytes=fs.readFileSync(dir+name),sha=data=>crypto.createHash('sha256').update(data).digest('hex');
    assert.equal(sha(bytes),row.sha256);assert.equal(sha(zlib.gunzipSync(bytes)),row.logicalSha256);
  }
});
test('historical mechanics projection accepts only the reviewed voice edition and never hides changed costs',()=>{
  const h=fresh(),project=require('../tools/story-refinement-contract.cjs'),row=h.json('e');
  assert.equal(row.narrativeRevision,'spring-self-voice-v1');
  const expected=structuredClone(row);delete expected.narrativeRevision;project([row]);assert.deepEqual(row,expected);
  const unknown=structuredClone(expected);unknown.narrativeRevision='another-spring';assert.throws(()=>project([unknown]),assert.AssertionError);
  const changed=structuredClone(expected);changed.narrativeRevision='spring-self-voice-v1';changed.choices[0].out[0].fx.time=999;
  project([changed]);assert.equal(changed.choices[0].out[0].fx.time,999);
});
