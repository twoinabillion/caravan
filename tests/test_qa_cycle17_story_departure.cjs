'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup:baseSetup}=require('../qa-artifacts/qa-cycle-20261026/cycle15/story/repair/setup.cjs'),helper=require('../qa-artifacts/qa-cycle-20261026/cycle12/story/reader-runtime.cjs');
const setup=()=>process.env.QA_SOURCE_ROOT?baseSetup(process.env.QA_SOURCE_ROOT):baseSetup();
const dir=path.resolve(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle17/story/repair'),old=require(dir+'/before.json'),raw=fs.readFileSync(path.resolve(dir,'../agent03/attempt01/normal-unpaid-57-story_bridge_departure_echo.json'),'utf8');
const newEntry='도로변 항만 중계 단말에서 잡음이 났다. 이어 부산 항만 방송이 발신 시각과 송신 주파수를 알렸다. 내일 새벽 동부 노선 이송자 명단. 도윤 가족 이름 뒤로 처음 듣는 이름이 열일곱 더 이어졌다. 부산을 빠져나오면 끝날 거라고 믿은 사람은 없었다. 그래도 다음 종이가 벌써 나올 줄은 몰랐다.';
const newResult='명단보다 먼저 적은 건 시각이었다. 새벽 3시 12분. 발신 시각은 정확했지만 승인자의 이름은 끝내 나오지 않았다. 주파수 옆에 시각을 옮겨 적었다.';
function fixture(repaired){const h=setup();h.run('(()=>{'+helper.code()+'})()');assert(h.run('G.load('+JSON.stringify(raw)+')'));h.run(`S.flags.radio_fixed=${repaired};S.pendingPresentation=null;globalThis.e=event('story_bridge_departure_echo');G.beginPresentation(e);globalThis.entry=qaEntry(e)`);return h;}
const state=h=>h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.fuel,S.scrap,S.items,S.flags,S.notes,S.comps,S.fatigue,S.pursuit])');
for(const repaired of [false,true])test('roadside terminal identifies audible clock/frequency with repaired='+repaired,()=>{
 const h=fixture(repaired),turns=h.json('qaNamed(entry)');assert.equal(turns.map(t=>t.text).join('\n'),newEntry);assert(turns.every(t=>t.kind==='narration'));assert.doesNotMatch(newEntry,/수신기가 혼자|이름이 열일곱 줄/);for(const i of [0,1])assert(h.run(`G.reqOk(G.choiceReq(e.choices[${i}])).ok`));
 h.run('G.save();G.load()');assert.deepEqual(h.json('qaNamed(qaEntry(e))'),turns);
});
for(const repaired of [false,true])for(const i of [0,1])test('choice'+i+' pays original effect once and preserves new receipt, repaired='+repaired,()=>{
 const h=fixture(repaired),time=h.run('S.day*1440+S.min'),fatigue=h.run('S.fatigue');h.run(`globalThis.c=e.choices[${i}];globalThis.r=G.resolvePresentedChoice(e,c)`);assert(h.run('r.ok&&r.applied'));assert.equal(h.run('r.out.text'),i===0?newResult:old.event.choices[1].out[0].text);assert.equal(h.run('S.day*1440+S.min'),time+(i===0?15:0));assert.equal(h.run('S.fatigue'),fatigue+old.legacy[i].fatigueDelta);assert.equal(h.run('!!S.flags.radio_fixed'),repaired);assert(h.run('S.flags.bridge_departure_echo'));
 h.run('globalThis.reader=qaResult(e,c,r.out,{knownSpeaker:!!entry.knownSpeaker})');const turns=h.json('qaNamed(reader)'),before=state(h);h.run("G.capturePresentationView({eventId:e.id,phase:'outcome',turns:reader,knownSpeaker:!!entry.knownSpeaker,index:0});G.save();G.load();globalThis.replay=G.resolvePresentedChoice(e,c)");assert.equal(h.run('replay.applied'),false);assert.equal(state(h),before);assert.deepEqual(h.json('qaNamed(qaResult(e,c,replay.out))'),turns);
});
for(const textOnly of [false,true])test('old paid outcomes preserve '+(textOnly?'text-only':'frozen-view')+' wording and payment',()=>{
 for(const row of old.legacy){const h=setup();h.run('(()=>{'+helper.code()+'})()');const save=JSON.parse(fs.readFileSync(path.join(dir,row.file)));if(textOnly){delete save.pendingPresentation.view;delete save.pendingPresentation.reading;}assert(h.run('G.load('+JSON.stringify(JSON.stringify(save))+')'));const before=state(h);h.run(`globalThis.e=event('story_bridge_departure_echo');globalThis.r=G.resolvePresentedChoice(e,e.choices[${row.i}])`);assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),row.text);assert.equal(state(h),before);assert.deepEqual(h.json(`qaNamed(qaResult(e,e.choices[${row.i}],r.out))`),textOnly?row.textOnly:row.reader);}
});
test('all gates choice labels probability costs effects and listening alternative remain exact',()=>{const h=setup(),now=h.json("event('story_bridge_departure_echo')"),expected=JSON.parse(JSON.stringify(old.event));assert.equal(now.text,newEntry);assert.equal(now.choices[0].out[0].text,newResult);now.text=expected.text;now.choices[0].out[0].text=expected.choices[0].out[0].text;
 // Parent's separate visual repair reuses the reviewed roadside terminal asset.
 assert.equal(now.scene,'story-roadside-terminal-detail-v2');now.scene=expected.scene;assert.deepEqual(now,expected);
});
