const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES,permanentEvents}=require('./content-registry.cjs');
const ctx=vm.createContext({console});
for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
const D=vm.runInContext('D',ctx),events=permanentEvents(D);
test('coffee and low fuel chats do not certify unperformed service or route feasibility',()=>{
  const coffee=D.chats.find(c=>c.need?.comp==='leo'&&c.need?.comp2==='parkss'&&c.need?.flag==='coffee_found');
  assert.deepEqual(Array.from(coffee.lines,l=>l[0]),['leo','parkss','leo','parkss','leo','parkss']);
  assert.match(coffee.lines[0][1],/다음에 내리면/);
  assert.match(coffee.lines[3][1],/아직 물도 안/);
  const fuel=D.chats.find(c=>c.id==='thread-low-fuel-minji-jaeyi');
  assert.deepEqual(JSON.parse(JSON.stringify(fuel.need)),{comps:['minji','jaeyi'],lowFuel:1,afterKm:45});
  assert.doesNotMatch(fuel.lines.map(l=>l[1]).join('\n'),/세 번 계산|내리막|줄이면 닿아요/);
  assert.match(fuel.lines[1][1],/지도부터.*남았는지는 모르/);
});
test('time, history and shelf measurements use readable numerals across source owners',()=>{
  for(const file of STATIC_CONTENT_FILES.concat(['src/04f-engine-quests.js'])){
    const source=fs.readFileSync(file,'utf8');
    assert.doesNotMatch(source,/열일곱 분|백사십삼 년|이십이 센티|새벽 세 시 십이 분|십일 분|마흔 분|삼십 분/,file);
  }
  assert(fs.readFileSync('src/03-data.js','utf8').includes('17분'));
  assert(fs.readFileSync('src/03m-finale-reading.js','utf8').includes('143년'));
  assert(D.campConversations.jaeyi.choices.find(c=>c.id==='shelf').text.includes('22cm'));
});
test('key names stay consistent without renaming the approval mechanism or factions',()=>{
  for(const file of STATIC_CONTENT_FILES){
    assert.doesNotMatch(fs.readFileSync(file,'utf8'),/반도체 검증키|검증 모듈|인간 확인망/);
  }
  assert.doesNotMatch(JSON.stringify(D.sceneDescriptions),/다온/);
  const source=fs.readFileSync('src/03-data.js','utf8');
  assert(source.includes('인간 확인 검증키'));
  assert(source.includes('명령을 실행하기 전에 사람의 승인을 받게 하는 장치'));
  for(const name of ['이음망','저항 연대망','TIANYAN','천리안','인간 확인층'])assert(source.includes(name),name);
});
test('approval intervals use their actual command and departure timestamps',()=>{
  const e=events.find(e=>e.id==='story_bridge_trace_gap');
  const times=[...e.text.matchAll(/(\d{2}):(\d{2})/g)].map(m=>Number(m[1])*60+Number(m[2]));
  assert.equal(times.length,3);
  const result=e.choices[0].out[0].text;
  assert(result.includes(`명령이 나온 지 ${times[2]-times[0]}분 뒤`));
  assert(result.includes(`버스가 떠난 지 ${times[2]-times[1]}분 뒤`));
  for(const file of ['src/03-data.js','src/03i-story-expansion.js'])
    assert.doesNotMatch(fs.readFileSync(file,'utf8'),/열한\s*분/);
});
test('unscheduled crew reactions stay in the present and retain their speakers',()=>{
  for(const [id,speakers] of [
    ['daily-minji-jaeyi-tools',['minji','jaeyi','minji','jaeyi','minji','jaeyi','minji','jaeyi','sys']],
    ['daily-minji-eunsu-sleep',['minji','eunsu','minji','eunsu','minji','eunsu','minji','sys']]
  ]){
    const c=D.chats.find(c=>c.id===id);
    assert.deepEqual(Array.from(c.lines,l=>l[0]),speakers);
    assert.doesNotMatch(c.lines.at(-1)[1],/다음 날|그날 밤/);
  }
});
test('shelf reply responds to making space, not an unperformed memorization',()=>{
  const result=events.find(e=>e.id==='rq_jaeyi_follow').choices[1].out[0].text;
  assert.match(result,/제 상자 자리까지 만들어요\?[\s\S]*계속 실을 거니까요/);
  assert.doesNotMatch(result,/높이를 왜 외워/);
});
test('crew chats preserve entry gates and speakers without certifying future time',()=>{
  for(const [id,need,speakers] of [
    ['daily-kangwoo-leo-nightmare',{comp:'kangwoo',comp2:'leo'},['leo','kangwoo','leo','kangwoo','leo','kangwoo','leo','kangwoo','sys']],
    ['daily-kangwoo-eunsu-orders',{comp:'kangwoo',comp2:'eunsu'},['kangwoo','eunsu','kangwoo','eunsu','kangwoo','eunsu','kangwoo','eunsu','sys']],
    ['daily-me-kangwoo-seat',{comp:'kangwoo'},['me','kangwoo','me','kangwoo','me','kangwoo','me','kangwoo','sys']],
    ['thread-three-night-watch',{comps:['kangwoo','eunsu','jaeyi'],party:3,night:1,afterKm:120},['jaeyi','eunsu','kangwoo','jaeyi','eunsu','kangwoo','jaeyi','kangwoo','sys']]
  ]){
    const c=D.chats.find(c=>c.id===id);
    assert.deepEqual(JSON.parse(JSON.stringify(c.need)),need,id);
    assert.deepEqual(Array.from(c.lines,l=>l[0]),speakers,id);
    assert.doesNotMatch(c.lines.at(-1)[1],/그날 밤|그 뒤로|분 뒤|시간 뒤/,id);
  }
  const orders=D.chats.find(c=>c.id==='daily-kangwoo-eunsu-orders');
  assert.match(orders.lines[6][1],/내가 잠깐 듣고/);
  assert.match(orders.lines[7][1],/넘길게요/);
  const watch=D.chats.find(c=>c.id==='thread-three-night-watch');
  assert.match(watch.lines[0][1],/한 명씩/);
  assert.match(watch.lines[5][1],/내가 먼저/);
});
test('early broadcast records evidence without inferring authorization from night hours',()=>{
  const e=events.find(e=>e.id==='story_bridge_departure_echo');
  const out=e.choices[0].out[0];
  assert.match(out.text,/3시 12분/);
  assert.match(out.text,/승인자의 이름은 끝내 나오지 않았다/);
  assert.doesNotMatch(out.text,/깨어 있기 어려운|사람이 확인했다면/);
  assert.equal(out.fx.time,15);
  assert.equal(out.fx.flag,'bridge_departure_echo');
});
