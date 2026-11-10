// Actual HOME renderer + real participant owner, private save, no browser claim.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup}=require('./fixtures/qa-cycle55-story/setup.cjs');
const zlib=require('node:zlib'),crypto=require('node:crypto');
function fixture(){const h=setup();h.run(fs.readFileSync('src/07g-ui-home.js','utf8'));
  h.run(`S.party=[];S.recruitQ={id:'minji',stage:'road'};S.up={};
    S.campMemories={minji:{home:'공구 없이 함께 달구지의 소리를 들었다.',voice:'minji-guest-v1'}};`);return h;}
function render(h){return h.run('HOME.html(HOME.state(S,D,G.campParticipants()))');}
test('a current temporary rider is present in HOME without inventing their permanent keepsake',()=>{
  const h=fixture(),before=h.run('JSON.stringify(S)'),html=render(h);
  assert.match(html,/민지와 나눈 시간/);assert.match(html,/지금 함께 머무는 사람과의 기억/);
  assert.doesNotMatch(html,/떠난 동료|data-home-prop="companion:minji"|민지의 자석 접시에 남긴 기억/);
  assert.match(html,/data-home-object="memory:minji"/);assert.equal(h.run('JSON.stringify(S)'),before);
});
test('joining permanently adds only the actual present companion object and keeps the same memory text',()=>{
  const h=fixture(),memory=h.run('S.campMemories.minji.home');h.run("S.party=['minji'];S.recruitQ=null");
  const html=render(h);assert.match(html,/data-home-prop="companion:minji"/);assert.match(html,/지금 함께 쓰는 물건/);
  assert.equal(h.run('S.campMemories.minji.home'),memory);
});
test('a departed known guest leaves the shared time rather than a never-earned physical dish',()=>{
  const h=fixture();h.run('S.recruitQ=null');const html=render(h);
  assert.match(html,/민지와 나눈 시간/);assert.match(html,/잠시 함께했던 시간/);
  assert.doesNotMatch(html,/data-home-prop="companion:minji"|민지의 자석 접시/);
});
test('a departed formal companion retains the existing keepsake memory and no physical prop',()=>{
  const h=fixture();h.run('S.recruitQ=null;delete S.campMemories.minji.voice');const html=render(h);
  assert.match(html,/민지의 자석 접시에 남긴 기억/);assert.match(html,/떠난 동료가 남긴 기억/);
  assert.doesNotMatch(html,/data-home-prop="companion:minji"/);
});
test('guest memories use each real name and Korean particle, including a departed unjoined guest',()=>{
  const h=fixture();h.run(`S.recruitQ={id:'parkss',stage:'road'};
    S.campMemories={parkss:{home:'함께 나눈 대화.',pendingBond:2}};`);
  let html=render(h);assert.match(html,/박 선생과 나눈 시간/);assert.doesNotMatch(html,/박 선생와|data-home-prop="companion:parkss"/);
  h.run('S.recruitQ=null');html=render(h);
  assert.match(html,/박 선생과 나눈 시간/);assert.match(html,/잠시 함께했던 시간/);
  assert.doesNotMatch(html,/떠난 동료|진료 깡통/);
});
test('a guest memory paid into a formal bond no longer implies an unjoined visitor after departure',()=>{
  const h=fixture();h.run('S.recruitQ=null;S.campMemories.minji.pendingBond=0');
  const html=render(h);assert.match(html,/민지의 자석 접시에 남긴 기억/);
  assert.match(html,/떠난 동료가 남긴 기억/);assert.doesNotMatch(html,/data-home-prop="companion:minji"/);
});
test('only real camping participants enter the visiting roster; unread visits create no invented memory',()=>{
  const h=fixture();h.run('S.recruitQ.stage="offer"');assert.doesNotMatch(render(h),/지금 함께 머무는 사람과의 기억/);
  h.run('S.recruitQ.stage="road";S.campMemories={}');const html=render(h);
  assert.doesNotMatch(html,/data-home-object="memory:minji"|data-home-prop="companion:minji"/);
});
test('both real camp and ending callers use the same read-only state adapter',()=>{
  const ui=fs.readFileSync('src/07-ui.js','utf8'),matches=[...ui.matchAll(/const homeState=([^;]+);/g)];
  assert.equal(matches.length,2);
  for(const [,expression]of matches){const h=fixture();h.run('globalThis.publicHome='+expression);
    assert.deepEqual(h.json('publicHome.visitors'),[{id:'minji',name:'민지'}]);assert.doesNotMatch(h.run('HOME.html(publicHome)'),/떠난 동료/);}
});
test('the ending keeps its empty-save fallback without calling the live participant owner',()=>{
  const ui=fs.readFileSync('src/07-ui.js','utf8'),matches=[...ui.matchAll(/const homeState=([^;]+);/g)];
  const h=fixture();h.run('S=null;globalThis.publicHome='+matches[1][1]);
  assert.deepEqual(h.json('publicHome.party'),[]);assert.deepEqual(h.json('publicHome.visitors'),[]);
  assert.doesNotThrow(()=>h.run('HOME.html(publicHome)'));
});
test('the exact natural paid guest save remains unchanged through HOME inspection and reload',()=>{
  const bytes=fs.readFileSync(__dirname+'/fixtures/moving-home/guest-minji.json.gz');
  const provenance=require('./fixtures/moving-home/provenance.json');
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),provenance.sourceSha256);
  const original=JSON.parse(zlib.gunzipSync(bytes)),h=fixture();
  h.run('S='+JSON.stringify(original)+';G.save();G.load()');
  assert.deepEqual(h.json('S.party'),[]);assert.equal(h.run('S.recruitQ.stage'),'follow');
  const before=h.run('JSON.stringify(S)'),html=render(h);
  assert.match(html,/민지와 나눈 시간/);
  assert.doesNotMatch(html,/떠난 동료|data-home-prop="companion:minji"|자석 접시/);
  assert.equal(h.run('JSON.stringify(S)'),before);
  assert.deepEqual(h.json('S.campConversation'),original.campConversation,'paid words, reading cursor and chips remain exact');
  h.run('G.save();G.load()');assert.equal(render(h),html);
  assert.equal(h.run('JSON.stringify(S)'),before,'inspection and save/load never repay costs or advance the clock');
});
