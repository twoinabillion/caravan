const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const ctx=vm.createContext({console});
for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
const D=vm.runInContext('D',ctx),step=id=>D.openingDeparture.find(e=>e.id===id);
test('opening bridges live once in authored narration, never in UI injection',()=>{
  const bridge='공구를 하나씩 공구함에 넣는 동안, 버스 안 공기가 조금씩 데워졌다.';
  assert.equal(step('opening_failed_appeal').turns[0].text.split(bridge).length-1,1);
  assert.match(step('opening_departure').turns[0].text,/^계기판 덮개를 닫고 작업장 안을 마지막으로 둘러봤다\./);
  assert(!fs.readFileSync('src/07-ui.js','utf8').includes(bridge));
  for(const id of ['opening_failed_appeal','opening_departure']){
    assert.equal(step(id).turns[0].kind,'narration');
    assert(!step(id).turns[0].fx,'bridge must not spend time or resources');
  }
});
test('departure still preserves its two actual choices and original costs',()=>{
  const e=step('opening_departure');
  assert(e.openingFinal);
  assert.deepEqual(Array.from(e.choices,c=>c.id),['leave_key','keep_key']);
  assert.deepEqual(Array.from(e.choices,c=>c.out[0].fx.time),[10,5]);
  for(const c of e.choices){
    assert.equal(c.out[0].fx.flag,'intro_workshop_left');
    assert.equal(c.out[0].scene,'intro-departure-start-v1');
  }
});
