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
test('repair notes do not reveal the transfer slip before Doyun presents it',()=>{
  const repair=step('opening_bus_repair');
  for(const choice of repair.choices){
    assert.match(choice.out[0].fx.note.body,/난방/);
    assert.doesNotMatch(choice.out[0].fx.note.body,/이송 사유|최종 승인자|남산|이송표/);
  }
  assert.match(step('opening_failed_appeal').turns[0].text,/도윤이 이송표를 내밀었다/);
  assert.deepEqual(Array.from(repair.choices,c=>c.out[0].fx.time),[20,35,55]);
});
test('appeal refusal says what is unavailable here and where to go without promising approval',()=>{
  const appeal=step('opening_failed_appeal');
  const terminal=appeal.turns.find(t=>t.kind==='ai');
  const refusal='이 단말에서는 이송 명령에 대한 이의 신청을 받을 수 없습니다.';
  const destination='명령을 확인하려면 서울 남산으로 직접 가셔야 합니다.';
  assert.equal(terminal.name,'부두 민원 단말');
  assert.equal(terminal.who,'cheollian');
  assert.equal(terminal.text,refusal+' '+destination);
  assert.equal(appeal.turns.length,5);
  const intro=D.intro.find(p=>p.scene==='intro-appeal-denied');
  const replies=Array.from(intro.beats).filter(t=>t.kind==='ai');
  assert.deepEqual(replies.map(t=>t.text),[
    '신청 항목을 말씀하십시오.',refusal,destination,
    '이 단말에서 안내할 수 있는 다른 절차는 없습니다.'
  ]);
  assert(intro.text.includes(refusal));
  assert(intro.text.includes(destination));
  for(const line of [terminal.text,...replies.map(t=>t.text)]){
    assert.doesNotMatch(line,/원격|포트|중앙 노드|담당자|접수됩니다|취소됩니다/);
  }
  assert.deepEqual(Array.from(appeal.choices,c=>c.id),['copy_receipt','record_names']);
  assert.deepEqual(Array.from(appeal.choices,c=>c.out[0].fx.time),[15,30]);
  for(const c of appeal.choices)assert.equal(c.out[0].fx.flag,'intro_appeal_failed');
  const appealIndex=D.openingDeparture.findIndex(e=>e.id===appeal.id);
  assert.equal(D.openingDeparture[appealIndex+1].id,'opening_parents_module');
});
