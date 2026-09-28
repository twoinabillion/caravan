'use strict';

// Authored content checks only: no browser, saves or live-scene mutation.
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {STATIC_CONTENT_FILES} = require('./content-registry.cjs');
const root = path.resolve(__dirname, '..');
const ctx = vm.createContext({console, G:{}, rng:()=>0, clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});
for (const file of STATIC_CONTENT_FILES) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const D = vm.runInContext('D',ctx);
const page = id => D.intro.find(p=>p.scene===id);
const text = id => page(id).beats.map(t=>t.text).join('\n');
const played = D.intro.flatMap(p=>p.beats).map(t=>t.text).join('\n');

test('21-page prologue retains the approved sequence and real scene/speaker references',()=>{
  const scenes = [
    'intro-busan-room-morning-v1','intro-busan-water-line-v1','intro-busan-workday-v1',
    'intro-busan-cold-storage-v1','intro-busan-generator-night-v1','intro-busan-evening-call-v1',
    'intro-current-expulsion','intro-dock-aid','intro-passenger-seat','intro-cheollian-2026',
    'intro-first-expulsion','intro-resistance-begins','intro-parents-discovery',
    'intro-silenced-presentation','intro-blank-reason','intro-envelope-signal',
    'intro-appeal-denied','intro-mother-keepsakes','intro-dashboard-module',
    'intro-workshop-departure','intro-departure-choice'
  ];
  assert.deepEqual(Array.from(D.intro,p=>p.scene),scenes);
  for (const p of D.intro) {
    assert(D.scenes[p.scene],p.scene);
    assert(p.beats.length>=7,p.scene);
    for (const turn of p.beats) {
      assert(turn.kind&&turn.text.trim(),p.scene);
      if(turn.scene) assert(D.scenes[turn.scene],turn.scene);
      if(['dialogue','thought','letter','radio'].includes(turn.kind)) assert(turn.who&&turn.name,p.scene);
    }
  }
});

test('lived-in humour and careful family uncertainty survive the prose cut',()=>{
  for(const line of [
    '그건 나오면 안 되는 물인데.','그래. 나사 혼자 그랬겠지.',
    '씹는 동안 냉동기 안 도망가.','너는 그런 걸 왜 보고 다녀.',
    '내 로봇도 넣었어?','…넣었어. 맨 위에. 꺼내기 좋게.',
    '그땐 못 찾았다고 적는 거야. 없는 이름을 우리가 만들어 넣을 수는 없잖아.'
  ]) assert(played.includes(line),line);
  assert(text('intro-current-expulsion').includes('유나 누나'));
  assert(text('intro-parents-discovery').includes('확실히 몰랐어'));
  assert(text('intro-blank-reason').includes('둘이 이어졌는지는 남산 기록을 봐야'));
});

test('family farewell stops on the missing next car; institutional evidence follows separately',()=>{
  assert.equal(page('intro-silenced-presentation').beats.at(-1).text,
    '엄마는 나를 할아버지 차에 태웠다. 다음 차는 오지 않았다.');
  assert.match(text('intro-blank-reason'),/발표를 막은 기록에는 정부 기관 이름/);
  assert.match(text('intro-blank-reason'),/이 이송표에는 보낸 사람도, 이유도 안 적혀/);
});

test('the trip still needs evidence, safe module removal and help from six distinct groups',()=>{
  const current=text('intro-current-expulsion'),module=text('intro-dashboard-module');
  for(const fact of ['6,412명','20kg','제7 구역','집 문도 밥표도','통행 권한','사유란']) assert(current.includes(fact),fact);
  assert.match(text('intro-appeal-denied'),/원격 이의 제기 경로가 없습니다/);
  assert.match(text('intro-appeal-denied'),/서울 남산 중앙 노드/);
  for(const fact of ['4–5쪽','함께 태울 수 있음','계기판을 다시 닫았다','발신 기록','당사자 증언',
    '이송을 겪은 사람','명령망을 본 사람','길을 지킨 사람'])
    assert((text('intro-mother-keepsakes')+module).includes(fact),fact);
  for(const name of ['이음망','해도','돔','솥','유령','산지기']) assert(text('intro-resistance-begins').includes(name),name);
  assert.match(text('intro-mother-keepsakes'),/여섯 개의 작은 도장/);
  assert.match(text('intro-mother-keepsakes'),/여섯 거점의 도움이 필요/);
});

test('child questions stay concrete and the optional industrial history remains available',()=>{
  const history=page('intro-cheollian-2026');
  assert(history.beats.length<=12);
  assert(text(history.scene).includes('사흘만 한다며. 왜 안 껐어?'));
  assert(!text(history.scene).includes('그래도 사람이 마지막에 확인했지?'));
  for(const term of ['72시간','현장 봇','2026년','TIANYAN'])
    assert((history.readingRecord+text(history.scene)).includes(term),term);
  const discovery=text('intro-parents-discovery');
  for(const rule of ['당사자도 볼 수','책임자가 서명','이의를 제기할 길','하나라도 빠지면','병원이나 전력 복구는 그대로'])
    assert(discovery.includes(rule),rule);
});

test('action-led solo scenes do not require five recap lines to pass',()=>{
  for(const id of ['intro-dashboard-module','intro-workshop-departure']){
    assert.equal(page(id).beats.length,7);
    assert(page(id).solo,id);
  }
  assert.match(text('intro-workshop-departure'),/내일 고치기로 한 차/);
  assert.match(text('intro-workshop-departure'),/돌아올 날짜는 쓰지 못했다/);
  assert.match(text('intro-workshop-departure'),/난로에 쓸 몫도 줄었다/);
});

test('departure ends on goodbye, with the existing engine-start scene and no postscript',()=>{
  const departure=page('intro-departure-choice');
  assert.equal(departure.beats.at(-1).text,'할아버지, 다녀올게.');
  assert.equal(departure.beats.at(-2).scene,'intro-departure-start-v1');
  assert.match(text(departure.scene),/아직은 몰라/);
  assert.match(text(departure.scene),/먼저 떠난 사람들도 찾아보겠습니다/);
  assert(!text(departure.scene).includes('여섯 개의 작은 도장'));
});

test('removed interpretive endings do not return to the played beats',()=>{
  for(const phrase of ['이송표는 안내장이 아니었다','6,412명은 더 이상 방송 속 숫자가 아니었다',
    '바뀐 건 장비가 아니라','막연한 목적지가 아니라','열쇠는 찾았다. 이제',
    '누구를 태우라고 정해 둔 자리가 아니라','이번 호출은 평소보다 급하다',
    '서로 급한 것은 달랐지만 손은 같은 곳으로 모였다']) assert(!played.includes(phrase),phrase);
});
